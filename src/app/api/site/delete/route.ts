import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId } = await req.json();
    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId parameter" }, { status: 400 });
    }

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: {
        id: siteId,
        userId: currentUser.id,
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    await prisma.site.update({
      where: {
        id: siteId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await logActivity(currentUser.id, "site_deleted", { siteId, url: site.url }, req);

    return NextResponse.json({
      success: true,
      message: "Site and all historical audits successfully deleted.",
    });
  } catch (error) {
    console.error("[Site Delete API Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

