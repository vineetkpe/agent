import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { logActivity } from "@/lib/activityLog";
import { applyAuditItemFix } from "@/lib/fixApplier";

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
    // Check WordPress connection and plan limits if needed
    if (item.site.wpUrl && item.site.wpUsername && item.site.wpAppPasswordEncrypted) {
      const limits = getEffectivePlanLimits(currentUser);
      if (!limits.wpAutoApply) {
        return NextResponse.json(
          { error: "plan_limit", message: "WordPress auto-apply requires a paid plan" },
          { status: 403 }
        );
      }
    }

    const result = await applyAuditItemFix(item, item.site, currentUser, "manual");

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, item: result.item },
        { status: result.status }
      );
    } else {
      const wpLink = "wpLink" in result ? result.wpLink : undefined;

      await logActivity(
        currentUser.id,
        "wp_publish",
        {
          siteId: item.site.id,
          itemId: item.id,
          type: item.type,
          wpLink,
          approvedWithoutWp: result.status === "approved" && !(item.site.wpUrl && item.site.wpUsername && item.site.wpAppPasswordEncrypted) ? true : undefined,
        },
        req
      );

      return NextResponse.json({
        success: true,
        status: result.status,
        wpLink,
        item: result.item,
        message: result.message,
      });
    }

  } catch (error) {
    console.error("[Approve Route Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Approval execution failed unexpectedly." },
      { status: 500 }
    );
  }
}

