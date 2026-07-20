import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sites: {
          include: {
            audits: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const apiUsageCount = await prisma.apiUsageLog.count({
      where: { userId: user.id },
    });

    const recentAuditItems = await prisma.auditItem.findMany({
      where: { site: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionActive: user.subscriptionActive,
        suspended: user.suspended,
        isAdmin: user.isAdmin,
        plan: user.plan,
        planSource: user.planSource,
        planActivatedAt: user.planActivatedAt,
        createdAt: user.createdAt,
      },
      sites: user.sites,
      apiUsageCount,
      recentAuditItems,
    });
  } catch (error: any) {
    console.error("[Admin User Detail GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load user details." }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { userId } = await params;
    const body = await req.json();

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    let auditLogMessage = "";

    if (body.action === "deactivate_subscription") {
      updateData.plan = null;
      updateData.subscriptionActive = false;
      updateData.planSource = null;
      auditLogMessage += `Deactivated subscription (plan: null, active: false, source: null). `;
    } else {
      if (body.plan !== undefined) {
        if (body.plan === null) {
          updateData.plan = null;
          updateData.subscriptionActive = false;
          updateData.planSource = null;
          auditLogMessage += `Plan updated to null (deactivated). `;
        } else {
          updateData.plan = body.plan;
          updateData.subscriptionActive = true;
          updateData.planSource = "admin_grant";
          updateData.planActivatedAt = new Date();
          auditLogMessage += `Plan updated to ${body.plan} (source: admin_grant). `;
        }
      } else if (body.subscriptionActive !== undefined) {
        updateData.subscriptionActive = !!body.subscriptionActive;
        auditLogMessage += `Premium subscription status updated from ${targetUser.subscriptionActive} to ${!!body.subscriptionActive}. `;
      }
    }

    if (body.suspended !== undefined) {
      updateData.suspended = !!body.suspended;
      auditLogMessage += `Suspended status updated from ${targetUser.suspended} to ${!!body.suspended}. `;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(`[AUDIT TRAIL] Admin ${currentUser.email} modified User ${targetUser.email} (ID: ${userId}). Changes: ${auditLogMessage}`);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("[Admin User PATCH Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to update user settings." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { userId } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: "Cannot delete your own administrative account." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(`[AUDIT TRAIL] Admin ${currentUser.email} deleted User ${targetUser.email} (ID: ${userId}) cascade successfully.`);

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error: any) {
    console.error("[Admin User DELETE Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user." }, { status: 500 });
  }
}
