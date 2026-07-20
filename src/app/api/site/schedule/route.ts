import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId, crawlScheduleEnabled, crawlScheduleHourUtc } = await req.json();
    if (!siteId) {
      return NextResponse.json({ error: "Missing site ID" }, { status: 400 });
    }

    // Verify hour is 0-23
    let hour = crawlScheduleHourUtc;
    if (crawlScheduleHourUtc !== null && crawlScheduleHourUtc !== undefined) {
      hour = Math.max(0, Math.min(23, Number(crawlScheduleHourUtc)));
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId, userId: currentUser.id },
      data: {
        crawlScheduleEnabled: Boolean(crawlScheduleEnabled),
        crawlScheduleHourUtc: hour,
      },
    });

    return NextResponse.json({ success: true, site: updatedSite });
  } catch (error) {
    console.error("[Save Schedule Settings Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to save schedule settings." }, { status: 500 });
  }
}

