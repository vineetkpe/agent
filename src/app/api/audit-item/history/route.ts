import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const targetUrl = searchParams.get("targetUrl");
    const type = searchParams.get("type");

    if (!siteId || !targetUrl || !type) {
      return NextResponse.json({ error: "Missing required parameters (siteId, targetUrl, type)." }, { status: 400 });
    }

    // Verify site ownership (excluding deleted)
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id, deletedAt: null },
    });
    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    const history = await prisma.auditItem.findMany({
      where: {
        siteId,
        targetUrl,
        type,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        suggestedValue: true,
        status: true,
        appliedAt: true,
        rolledBackAt: true,
        createdAt: true,
        audit: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("[AuditItem History Route Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
