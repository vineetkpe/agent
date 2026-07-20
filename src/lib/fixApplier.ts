import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { publishWpPost, resolveWpPostIdFromUrl, updateWpTitle, updateWpMetaDescription, getWpPost } from "@/lib/wordpress";
import { AuditItem, Site, User } from "@prisma/client";

export async function applyAuditItemFix(
  item: AuditItem,
  site: Site,
  user: User,
  appliedVia: 'manual' | 'auto'
): Promise<
  | { success: true; status: "applied"; wpLink?: string; item: AuditItem; message: string }
  | { success: true; status: "approved"; item: AuditItem; message: string }
  | { error: string; item?: AuditItem; status: number }
> {
  const itemId = item.id;

  if (item.type === "blog_post") {
    const postData = JSON.parse(item.suggestedValue || "{}");

    // Check if WordPress is connected
    if (site.wpUrl && site.wpUsername && site.wpAppPasswordEncrypted) {
      try {
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
          const updatedItem = await prisma.auditItem.update({
            where: { id: itemId },
            data: {
              status: "applied",
              appliedAt: new Date(),
              autoAppliedAt: appliedVia === "auto" ? new Date() : null,
              wpPostId: `post:${wpResult.id}`,
              suggestedValue: JSON.stringify({
                ...postData,
                wpLink: wpResult.url,
              }),
            },
          });

          return {
            success: true,
            status: "applied",
            wpLink: wpResult.url,
            item: updatedItem,
            message: "Blog post successfully pushed to WordPress as a draft!",
          };
        } else {
          console.error("[Auto-Apply WP Error]:", wpResult.error);
          const updatedItem = await prisma.auditItem.update({
            where: { id: itemId },
            data: {
              status: "pending", // Revert to pending so they can try again
              errorMessage: `WordPress push failed: ${wpResult.error}`,
            },
          });

          return {
            error: `WordPress API Error: ${wpResult.error}. Credentials might be invalid or permissions restricted.`,
            item: updatedItem,
            status: 502,
          };
        }
      } catch (decryptErr) {
        console.error("[Decrypt Credentials Error]:", decryptErr);
        return {
          error: "Failed to decrypt WordPress credentials securely.",
          status: 500,
        };
      }
    } else {
      // Site has NO WordPress connected
      const updatedItem = await prisma.auditItem.update({
        where: { id: itemId },
        data: { status: "approved" },
      });

      return {
        success: true,
        status: "approved",
        item: updatedItem,
        message: "Approved! WordPress is not connected, please copy-paste the draft code below.",
      };
    }
  } else if (item.type === "meta_title" || item.type === "meta_description") {
    if (site.wpUrl && site.wpUsername && site.wpAppPasswordEncrypted) {
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
          return {
            success: true,
            status: "approved",
            item: updatedItem,
            message: "Approved! Could not locate matching WordPress post/page URL, copy-paste the snippet instead.",
          };
        }

        // 2. Update based on type
        if (item.type === "meta_title") {
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
                autoAppliedAt: appliedVia === "auto" ? new Date() : null,
                currentValue: currentVal,
                errorMessage: null,
              },
            });
            return {
              success: true,
              status: "applied",
              item: updatedItem,
              message: "Meta title successfully updated on WordPress live!",
            };
          } else {
            const updatedItem = await prisma.auditItem.update({
              where: { id: itemId },
              data: {
                status: "approved",
                errorMessage: `WordPress title update failed: ${updateResult.error}`,
              },
            });
            return {
              success: true,
              status: "approved",
              item: updatedItem,
              message: `WordPress Title Update API failed. Copy-paste snippet instead.`,
            };
          }
        } else {
          // item.type === "meta_description"
          const plugin = site.detectedSeoPlugin as "yoast" | "rankmath" | null;
          if (plugin && (plugin === "yoast" || plugin === "rankmath")) {
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
                  autoAppliedAt: appliedVia === "auto" ? new Date() : null,
                  currentValue: currentVal,
                  errorMessage: null,
                },
              });
              return {
                success: true,
                status: "applied",
                item: updatedItem,
                message: `Meta description successfully updated via ${plugin === "yoast" ? "Yoast" : "RankMath"}!`,
              };
            } else {
              const updatedItem = await prisma.auditItem.update({
                where: { id: itemId },
                data: {
                  status: "approved",
                  errorMessage: updateResult.error || `Automatic meta description update was rejected by your WordPress site.`,
                },
              });
              return {
                success: true,
                status: "approved",
                item: updatedItem,
                message: `Yoast/RankMath update not accepted. Copy-paste snippet instead.`,
              };
            }
          } else {
            const updatedItem = await prisma.auditItem.update({
              where: { id: itemId },
              data: {
                status: "approved",
                errorMessage: "No supported SEO plugin (Yoast / RankMath) detected on your WordPress site.",
              },
            });
            return {
              success: true,
              status: "approved",
              item: updatedItem,
              message: "Approved! Copy-paste description snippet.",
            };
          }
        }
      } catch (err) {
        console.error("[Auto-Apply Meta Error]:", err);
        const updatedItem = await prisma.auditItem.update({
          where: { id: itemId },
          data: {
            status: "approved",
            errorMessage: `WordPress update failed: ${(err as Error).message || err}`,
          },
        });
        return {
          success: true,
          status: "approved",
          item: updatedItem,
          message: `WordPress update failed: ${(err as Error).message || err}. Copy-paste snippet instead.`,
        };
      }
    } else {
      const updatedItem = await prisma.auditItem.update({
        where: { id: itemId },
        data: { status: "approved" },
      });
      return {
        success: true,
        status: "approved",
        item: updatedItem,
        message: "Approved! WordPress is not connected, please copy-paste the metadata.",
      };
    }
  } else {
    // For all other types
    const updatedItem = await prisma.auditItem.update({
      where: { id: itemId },
      data: { status: "approved" },
    });

    return {
      success: true,
      status: "approved",
      item: updatedItem,
      message: "Approved! Copy-paste snippet code is ready.",
    };
  }
}
