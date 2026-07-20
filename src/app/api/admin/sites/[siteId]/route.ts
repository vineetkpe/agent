import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { siteId } = await params;
    const { action } = await req.json();

    if (action !== "resetCooldown") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const latestAudit = await prisma.audit.findFirst({
      where: { siteId },
      orderBy: { createdAt: "desc" },
    });

    if (latestAudit) {
      await prisma.audit.update({
        where: { id: latestAudit.id },
        data: {
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });
      console.log(`[AUDIT TRAIL] Admin ${currentUser.email} reset audit cooldown for site ${site.url} (ID: ${siteId}).`);
    }

    return NextResponse.json({ success: true, message: "Audit cooldown bypassed/reset successfully." });
  } catch (error) {
    console.error("[Admin Site Action Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to process site action." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { siteId } = await params;

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    await prisma.site.delete({
      where: { id: siteId },
    });

    console.log(`[AUDIT TRAIL] Admin ${currentUser.email} deleted Site ${site.url} (ID: ${siteId}).`);

    return NextResponse.json({ success: true, message: "Site deleted successfully." });
  } catch (error) {
    console.error("[Admin Site DELETE Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to delete site." }, { status: 500 });
  }
}
