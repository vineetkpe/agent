import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { publishWpPost } from "@/lib/wordpress";

export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ error: "Audit item not found" }, { status: 444 });
    }

    if (action === "reject") {
      const updatedItem = await prisma.auditItem.update({
        where: { id: itemId },
        data: { status: "rejected" },
      });
      return NextResponse.json({ success: true, status: "rejected", item: updatedItem });
    }

    // Action is "approve"
    // 2. Process based on item type
    if (item.type === "blog_post") {
      const postData = JSON.parse(item.suggestedValue || "{}");
      const site = item.site;

      // Check if WordPress is connected
      if (site.wpUrl && site.wpUsername && site.wpAppPasswordEncrypted) {
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
                // Update suggestedValue to store the live post link in the meta
                suggestedValue: JSON.stringify({
                  ...postData,
                  wpLink: wpResult.url,
                }),
              },
            });

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

        return NextResponse.json({
          success: true,
          status: "approved",
          item: updatedItem,
          message: "Approved! WordPress is not connected, please copy-paste the draft code below.",
        });
      }
    } else {
      // For SEO Meta tag modifications (meta_title, meta_description, schema_markup)
      // Since auto-updating HTML tags requires plugin access or write back headers,
      // in V1 we mark it as approved, showing it on the dashboard as a copy-paste snippet.
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
