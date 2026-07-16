import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId, gscUrl, disconnect } = await req.json();
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

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        gscConnected: disconnect ? false : true,
        gscUrl: disconnect ? null : gscUrl || site.url,
      },
    });

    return NextResponse.json({
      success: true,
      message: disconnect
        ? "Google Search Console disconnected successfully!"
        : "Google Search Console connected successfully!",
      site: {
        id: updatedSite.id,
        gscConnected: updatedSite.gscConnected,
        gscUrl: updatedSite.gscUrl,
      },
    });
  } catch (error: any) {
    console.error("[Search Console API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
