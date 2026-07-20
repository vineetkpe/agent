import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { publishWpPost, resolveWpPostIdFromUrl, updateWpTitle, updateWpMetaDescription, getWpPost } from "@/lib/wordpress";
import { getCurrentUser } from "@/lib/user";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { itemId, action } = await req.json();

    if (!itemId || !action) {
      return NextResponse.json({ error: "Missing parameters: itemId and action are required." }, { status: 400 });
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'." }, { status: 400 });
    }

    // 1. Fetch the audit item
    const item = await prisma.auditItem.findUnique({
      where: { id: itemId },
      include: { site: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Audit item not found" }, { status: 404 });
    }

    // 2. Security Check: Ownership verification
    if (item.site.userId !== currentUser.id) {
      console.error(`[Security Alert] User ${currentUser.email} attempted unauthorized access to item ${itemId} belonging to userId ${item.site.userId}`);
      return NextResponse.json({ error: "Forbidden: You do not own this site resource." }, { status: 403 });
    }

    if (action === "reject") {
      const updatedItem = await prisma.auditItem.update({
        where: { id: itemId },
        data: { status: "rejected" },
      });
      return NextResponse.json({ success: true, status: "rejected", item: updatedItem });
    }

    // Action is "approve"
    // 3. Process based on item type
    if (item.type === "blog_post") {
      const postData = JSON.parse(item.suggestedValue || "{}");
      const site = item.site;

      // Check if WordPress is connected
      if (site.wpUrl && site.wpUsername && site.wpAppPasswordEncrypted) {
        const limits = getEffectivePlanLimits(currentUser);
        if (!limits.wpAutoApply) {
          return NextResponse.json(
            { error: "plan_limit", message: "WordPress auto-apply requires a paid plan" },
            { status: 403 }
          );
        }
        console.log(`[Auto-Apply] WordPress is connected for ${site.url}. Pushing post...`);
        
        try {
          // Decrypt application password
          const appPassword = decrypt(site.wpAppPasswordEncrypted);
          
          // Publish post as draft to WordPress
          const wpResult = await publishWpPost(
            site.wpUrl,
            site.wpUsername,
            appPassword,
            postData.title,
            postData.content,
            postData.slug
          );

          if (wpResult.success) {
            // Update item to applied status and store the live url link
            const updatedItem = await prisma.auditItem.update({
              where: { id: itemId },
              data: {
                status: "applied",
                appliedAt: new Date(),
                wpPostId: `post:${wpResult.id}`,
                // Update suggestedValue to store the live post link in the meta
                suggestedValue: JSON.stringify({
                  ...postData,
                  wpLink: wpResult.url,
                }),
              },
            });

            await logActivity(currentUser.id, "wp_publish", { siteId: site.id, itemId: item.id, type: item.type, wpLink: wpResult.url }, req);

            return NextResponse.json({
              success: true,
              status: "applied",
              wpLink: wpResult.url,
              item: updatedItem,
              message: "Blog post successfully pushed to WordPress as a draft!",
            });
          } else {
            console.error("[Auto-Apply WP Error]:", wpResult.error);
            // Save error message to item but leave status as pending/approved
            const updatedItem = await prisma.auditItem.update({
              where: { id: itemId },
              data: {
                status: "pending", // Revert to pending so they can try again
                errorMessage: `WordPress push failed: ${wpResult.error}`,
              },
            });

            return NextResponse.json(
              {
                error: `WordPress API Error: ${wpResult.error}. Credentials might be invalid or permissions restricted.`,
                item: updatedItem,
              },
              { status: 502 }
            );
          }
        } catch (decryptErr: any) {
          console.error("[Decrypt Credentials Error]:", decryptErr);
          return NextResponse.json({ error: "Failed to decrypt WordPress credentials securely." }, { status: 500 });
        }
      } else {
        // Site has NO WordPress connected. Mark as approved so it is ready for copy-paste
        const updatedItem = await prisma.auditItem.update({
          where: { id: itemId },
          data: { status: "approved" },
        });

        await logActivity(currentUser.id, "wp_publish", { siteId: site.id, itemId: item.id, type: item.type, approvedWithoutWp: true }, req);

        return NextResponse.json({
          success: true,
          status: "approved",
          item: updatedItem,
          message: "Approved! WordPress is not connected, please copy-paste the draft code below.",
        });
      }
    } else if (item.type === "meta_title" || item.type === "meta_description") {
      const site = item.site;
      if (site.wpUrl && site.wpUsername && site.wpAppPasswordEncrypted) {
        const limits = getEffectivePlanLimits(currentUser);
        if (!limits.wpAutoApply) {
          return NextResponse.json(
            { error: "plan_limit", message: "WordPress auto-apply requires a paid plan" },
            { status: 403 }
          );
        }
        console.log(`[Auto-Apply] WordPress connected. Resolving post ID for URL: ${item.targetUrl}`);
        try {
          const appPassword = decrypt(site.wpAppPasswordEncrypted);

          // 1. Resolve WordPress post/page ID
          let postId: number | null = null;
          let postType: "post" | "page" | null = null;

          if (item.wpPostId) {
            const parts = item.wpPostId.split(":");
            if (parts.length === 2) {
              postType = parts[0] as "post" | "page";
              postId = parseInt(parts[1], 10);
            }
          }

          if (!postId || !postType) {
            const matched = await resolveWpPostIdFromUrl(
              site.wpUrl,
              site.wpUsername,
              appPassword,
              item.targetUrl
            );
            if (matched) {
              postId = matched.id;
              postType = matched.type;
              // Cache resolved WP post ID
              await prisma.auditItem.update({
                where: { id: itemId },
                data: { wpPostId: `${matched.type}:${matched.id}` },
              });
            }
          }

          if (!postId || !postType) {
            const updatedItem = await prisma.auditItem.update({
              where: { id: itemId },
              data: {
                status: "approved",
                errorMessage: "Could not locate a matching WordPress post/page for this URL.",
              },
            });
            return NextResponse.json({
              success: true,
              status: "approved",
              item: updatedItem,
              message: "Approved! Could not locate matching WordPress post/page URL, copy-paste the snippet instead.",
            });
          }

          // 2. Update based on type
          if (item.type === "meta_title") {
            // Retrieve current live value to save as pre-fix state
            let currentVal = item.currentValue;
            try {
              const liveWp = await getWpPost(site.wpUrl, site.wpUsername, appPassword, postId, postType);
              if (liveWp.success && liveWp.title) {
                currentVal = JSON.stringify({ title: liveWp.title, length: liveWp.title.length });
              }
            } catch (err) {
              console.error("[Approve Route] Failed to fetch current live WP page state:", err);
            }

            const updateResult = await updateWpTitle(
              site.wpUrl,
              site.wpUsername,
              appPassword,
              postId,
              postType,
              item.suggestedValue || ""
            );

            if (updateResult.success) {
              const updatedItem = await prisma.auditItem.update({
                where: { id: itemId },
                data: {
                  status: "applied",
                  appliedAt: new Date(),
                  currentValue: currentVal,
                  errorMessage: null,
                },
              });
              await logActivity(currentUser.id, "wp_publish", { siteId: site.id, itemId: item.id, type: item.type }, req);
              return NextResponse.json({
                success: true,
                status: "applied",
                item: updatedItem,
                message: "Meta title successfully updated on WordPress live!",
              });
            } else {
              const updatedItem = await prisma.auditItem.update({
                where: { id: itemId },
                data: {
                  status: "approved",
                  errorMessage: `WordPress title update failed: ${updateResult.error}`,
                },
              });
              return NextResponse.json({
                success: true,
                status: "approved",
                item: updatedItem,
                message: `WordPress Title Update API failed. Copy-paste snippet instead.`,
              });
            }
          } else {
            // item.type === "meta_description"
            const plugin = site.detectedSeoPlugin as "yoast" | "rankmath" | null;
            if (plugin && (plugin === "yoast" || plugin === "rankmath")) {
              // Retrieve current live value to save as pre-fix state
              let currentVal = item.currentValue;
              try {
                const liveWp = await getWpPost(site.wpUrl, site.wpUsername, appPassword, postId, postType);
                if (liveWp.success && liveWp.metaDescription) {
                  currentVal = JSON.stringify({ description: liveWp.metaDescription, length: liveWp.metaDescription.length });
                }
              } catch (err) {
                console.error("[Approve Route] Failed to fetch current live WP page state:", err);
              }

              const updateResult = await updateWpMetaDescription(
                site.wpUrl,
                site.wpUsername,
                appPassword,
                postId,
                postType,
                plugin,
                item.suggestedValue || ""
              );

              if (updateResult.success) {
                const updatedItem = await prisma.auditItem.update({
                  where: { id: itemId },
                  data: {
                    status: "applied",
                    appliedAt: new Date(),
                    currentValue: currentVal,
                    errorMessage: null,
                  },
                });
                await logActivity(currentUser.id, "wp_publish", { siteId: site.id, itemId: item.id, type: item.type }, req);
                return NextResponse.json({
                  success: true,
                  status: "applied",
                  item: updatedItem,
                  message: `Meta description successfully updated via ${plugin === "yoast" ? "Yoast" : "RankMath"}!`,
                });
              } else {
                const updatedItem = await prisma.auditItem.update({
                  where: { id: itemId },
                  data: {
                    status: "approved",
                    errorMessage: updateResult.error || `Automatic meta description update was rejected by your WordPress site.`,
                  },
                });
                return NextResponse.json({
                  success: true,
                  status: "approved",
                  item: updatedItem,
                  message: `Yoast/RankMath update not accepted. Copy-paste snippet instead.`,
                });
              }
            } else {
              const updatedItem = await prisma.auditItem.update({
                where: { id: itemId },
                data: {
                  status: "approved",
                  errorMessage: "No supported SEO plugin (Yoast / RankMath) detected on your WordPress site.",
                },
              });
              return NextResponse.json({
                success: true,
                status: "approved",
                item: updatedItem,
                message: "Approved! Copy-paste description snippet.",
              });
            }
          }
        } catch (err: any) {
          console.error("[Auto-Apply Meta Error]:", err);
          const updatedItem = await prisma.auditItem.update({
            where: { id: itemId },
            data: {
              status: "approved",
              errorMessage: `WordPress update failed: ${err.message || err}`,
            },
          });
          return NextResponse.json({
            success: true,
            status: "approved",
            item: updatedItem,
            message: `WordPress update failed: ${err.message || err}. Copy-paste snippet instead.`,
          });
        }
      } else {
        const updatedItem = await prisma.auditItem.update({
          where: { id: itemId },
          data: { status: "approved" },
        });
        return NextResponse.json({
          success: true,
          status: "approved",
          item: updatedItem,
          message: "Approved! WordPress is not connected, please copy-paste the metadata.",
        });
      }
    } else {
      // For all other types
      const updatedItem = await prisma.auditItem.update({
        where: { id: itemId },
        data: { status: "approved" },
      });

      return NextResponse.json({
        success: true,
        status: "approved",
        item: updatedItem,
        message: "Approved! Copy-paste snippet code is ready.",
      });
    }

  } catch (error: any) {
    console.error("[Approve Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Approval execution failed unexpectedly." },
      { status: 500 }
    );
  }
}
