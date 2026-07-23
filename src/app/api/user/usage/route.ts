import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanLimits } from "@/lib/planLimits";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [sitesCount, aiRequestsCount, auditsCount, crawlsCount] = await Promise.all([
      prisma.site.count({
        where: { userId: currentUser.id },
      }),
      prisma.apiUsageLog.count({
        where: {
          userId: currentUser.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.audit.count({
        where: {
          site: { userId: currentUser.id },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.rateLimitLog.count({
        where: {
          userId: currentUser.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const limits = getEffectivePlanLimits(currentUser);

    const sitesPercent =
      limits.maxSites === Infinity || limits.maxSites === 0
        ? 0
        : Math.min(100, Math.round((sitesCount / limits.maxSites) * 100));

    const warnings: Array<{ metric: string; percent: number; message: string }> = [];

    if (sitesPercent >= 80) {
      warnings.push({
        metric: "sites",
        percent: sitesPercent,
        message: `You have used ${sitesCount} of ${limits.maxSites === Infinity ? "∞" : limits.maxSites} allowed sites (${sitesPercent}%).`,
      });
    }

    return NextResponse.json({
      plan: (currentUser.plan || "free").toLowerCase(),
      limits,
      usage: {
        sites: {
          used: sitesCount,
          limit: limits.maxSites === Infinity ? "Unlimited" : limits.maxSites,
          percent: sitesPercent,
        },
        aiRequests: {
          used: aiRequestsCount,
          period: "30 days",
        },
        audits: {
          used: auditsCount,
          period: "30 days",
        },
        crawls: {
          used: crawlsCount,
          period: "30 days",
        },
      },
      warnings,
    });
  } catch (error) {
    console.error("[User Usage API Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch user usage." },
      { status: 500 }
    );
  }
}
