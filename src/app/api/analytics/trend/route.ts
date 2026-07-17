import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const range = searchParams.get("range") || "30d";

    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId query parameter" }, { status: 400 });
    }

    // Verify site ownership
    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or access denied" }, { status: 404 });
    }

    // Compute start date based on range
    const now = new Date();
    const startDate = new Date();
    if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (range === "6mo") {
      startDate.setMonth(now.getMonth() - 6);
    } else if (range === "1yr") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else {
      startDate.setDate(now.getDate() - 30); // fallback
    }

    // Fetch audits within range
    const audits = await prisma.audit.findMany({
      where: {
        siteId: site.id,
        createdAt: { gte: startDate },
        status: "completed",
      },
      orderBy: { createdAt: "asc" },
    });

    // Fetch earliest audit globally for this site
    const earliestAudit = await prisma.audit.findFirst({
      where: { siteId: site.id, status: "completed" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const earliestDataAt = earliestAudit?.createdAt || null;

    // Fetch GA daily sessions if connected
    let dailySessions: Record<string, number> = {};
    if (site.gaConnected && site.gaPropertyId) {
      try {
        const { fetchDailySessions } = await import("@/lib/googleAnalytics");
        dailySessions = await fetchDailySessions(site, startDate, new Date());
      } catch (err) {
        console.error("[Trend GA Fetch Error]:", err);
      }
    }

    // Map audits to data points
    const dataPoints = audits.map((audit) => {
      let clicks = 0;
      let impressions = 0;
      if (site.gscConnected && audit.gscSnapshot) {
        try {
          const snapshot = JSON.parse(audit.gscSnapshot);
          if (Array.isArray(snapshot)) {
            clicks = snapshot.reduce((sum, item) => sum + (item.clicks || 0), 0);
            impressions = snapshot.reduce((sum, item) => sum + (item.impressions || 0), 0);
          }
        } catch (e) {
          console.error("[Trend API] Failed to parse gscSnapshot:", e);
        }
      }

      // Match GA session for this audit's day (e.g. key format YYYYMMDD)
      const auditDate = new Date(audit.createdAt);
      const year = auditDate.getFullYear();
      const month = String(auditDate.getMonth() + 1).padStart(2, "0");
      const day = String(auditDate.getDate()).padStart(2, "0");
      const dateKey = `${year}${month}${day}`;
      const sessions = dailySessions[dateKey] ?? 0;

      return {
        id: audit.id,
        createdAt: audit.createdAt,
        date: audit.createdAt.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        scorePerformance: audit.scorePerformance,
        scoreSeo: audit.scoreSeo,
        scoreSeoGoogle: audit.scoreSeoGoogle,
        scoreAccessibility: audit.scoreAccessibility,
        scoreBestPractices: audit.scoreBestPractices,
        clicks: site.gscConnected ? clicks : null,
        impressions: site.gscConnected ? impressions : null,
        sessions: site.gaConnected ? sessions : null,
      };
    });

    return NextResponse.json({
      success: true,
      range,
      siteId,
      gscConnected: site.gscConnected,
      gaConnected: site.gaConnected,
      earliestDataAt,
      dataPoints,
    });
  } catch (error: any) {
    console.error("[Trend API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load trend analytics." }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
