import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId, enabled } = await req.json();
    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const updated = await prisma.site.update({
      where: { id: siteId },
      data: {
        uptimeMonitoringEnabled: !!enabled,
        // Reset state if turning off
        currentUptimeStatus: enabled ? site.currentUptimeStatus : null,
      }
    });

    return NextResponse.json({ success: true, site: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Toggle failed." }, { status: 500 });
  }
}
