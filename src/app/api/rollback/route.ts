import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { updateWpTitle, updateWpMetaDescription, deleteWpPost } from "@/lib/wordpress";
import { getCurrentUser } from "@/lib/user";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: "itemId parameter is required." }, { status: 400 });
    }

    // 1. Fetch the audit item
    const item = await prisma.auditItem.findUnique({
      where: { id: itemId },
      include: { site: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Audit item not found" }, { status: 404 });
    }

    // 2. Ownership verification
    if (item.site.userId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this site resource." }, { status: 403 });
    }

    // 3. Status checks
    if (item.status !== "applied") {
      return NextResponse.json({ error: "Only applied fixes can be rolled back." }, { status: 400 });
    }

    if (!item.currentValue) {
      return NextResponse.json({ error: "No pre-fix currentValue captured to rollback to." }, { status: 400 });
    }

    const site = item.site;
    if (!site.wpUrl || !site.wpUsername || !site.wpAppPasswordEncrypted) {
      return NextResponse.json({ error: "WordPress is not connected to this site." }, { status: 400 });
    }

    const appPassword = decrypt(site.wpAppPasswordEncrypted);

    // 4. Revert based on type
    if (item.type === "blog_post") {
      if (!item.wpPostId) {
        return NextResponse.json({ error: "No WordPress post reference ID found to delete." }, { status: 400 });
      }

      const parts = item.wpPostId.split(":");
      const postType = parts[0] as "post" | "page";
      const postId = parseInt(parts[1], 10);

      if (isNaN(postId)) {
        return NextResponse.json({ error: "Invalid WordPress post ID resolved." }, { status: 400 });
      }

      const deleteResult = await deleteWpPost(
        site.wpUrl,
        site.wpUsername,
        appPassword,
        postId,
        postType
      );

      if (!deleteResult.success) {
        return NextResponse.json({ error: `WordPress deletion failed: ${deleteResult.error}` }, { status: 502 });
      }
    } else if (item.type === "meta_title") {
      let oldTitle = item.currentValue;
      if (oldTitle.startsWith("{")) {
        try {
          const parsed = JSON.parse(oldTitle);
          oldTitle = parsed.title || parsed.value || oldTitle;
        } catch {}
      }

      if (!item.wpPostId) {
        return NextResponse.json({ error: "No WordPress target resolved for meta title revert." }, { status: 400 });
      }
      const parts = item.wpPostId.split(":");
      const postType = parts[0] as "post" | "page";
      const postId = parseInt(parts[1], 10);

      const updateResult = await updateWpTitle(
        site.wpUrl,
        site.wpUsername,
        appPassword,
        postId,
        postType,
        oldTitle
      );

      if (!updateResult.success) {
        return NextResponse.json({ error: `WordPress update failed: ${updateResult.error}` }, { status: 502 });
      }
    } else if (item.type === "meta_description") {
      let oldDesc = item.currentValue;
      if (oldDesc.startsWith("{")) {
        try {
          const parsed = JSON.parse(oldDesc);
          oldDesc = parsed.description || parsed.value || oldDesc;
        } catch {}
      }

      if (!item.wpPostId) {
        return NextResponse.json({ error: "No WordPress target resolved for meta description revert." }, { status: 400 });
      }
      const parts = item.wpPostId.split(":");
      const postType = parts[0] as "post" | "page";
      const postId = parseInt(parts[1], 10);

      const plugin = site.detectedSeoPlugin as "yoast" | "rankmath" | null;
      if (!plugin || (plugin !== "yoast" && plugin !== "rankmath")) {
        return NextResponse.json({ error: "No supported SEO plugin (Yoast/RankMath) is active on this WordPress site." }, { status: 400 });
      }

      const updateResult = await updateWpMetaDescription(
        site.wpUrl,
        site.wpUsername,
        appPassword,
        postId,
        postType,
        plugin,
        oldDesc
      );

      if (!updateResult.success) {
        return NextResponse.json({ error: `WordPress update failed: ${updateResult.error}` }, { status: 502 });
      }
    } else {
      return NextResponse.json({ error: `Rollback not supported for check type: ${item.type}` }, { status: 400 });
    }

    // 5. Update Status in DB
    const updatedItem = await prisma.auditItem.update({
      where: { id: itemId },
      data: {
        status: "rolled_back",
        rolledBackAt: new Date(),
      },
    });

    await logActivity(currentUser.id, "wp_rollback", { siteId: site.id, itemId: item.id, type: item.type }, req);

    return NextResponse.json({
      success: true,
      status: "rolled_back",
      item: updatedItem,
      message: "Successfully reverted change on live CMS site!",
    });
  } catch (error) {
    console.error("[Rollback Route Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Rollback execution failed unexpectedly." },
      { status: 500 }
    );
  }
}

