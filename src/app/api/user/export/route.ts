import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionActive: true,
        plan: true,
        planSource: true,
        planActivatedAt: true,
        onboardingCompletedAt: true,
        reportEmailDay: true,
        reportEmailEnabled: true,
        subscriptionEndsAt: true,
        cancellationReason: true,
        createdAt: true,
        sites: {
          select: {
            id: true,
            url: true,
            wpUrl: true,
            wpUsername: true,
            customInstructions: true,
            gscConnected: true,
            gscUrl: true,
            gscLastSyncedAt: true,
            businessProfile: true,
            detectedSeoPlugin: true,
            wpConnectedAt: true,
            uptimeMonitoringEnabled: true,
            currentUptimeStatus: true,
            lastUptimeCheckAt: true,
            gaPropertyId: true,
            gaConnected: true,
            manuallyEnteredContext: true,
            competitorsJson: true,
            businessGoals: true,
            createdAt: true,
            gscCachedData: true, // we will parse this below
            audits: {
              select: {
                id: true,
                scorePerformance: true,
                scoreSeo: true,
                scoreSeoGoogle: true,
                scoreAccessibility: true,
                scoreBestPractices: true,
                lcpSeconds: true,
                clsScore: true,
                inpMilliseconds: true,
                status: true,
                aiScanError: true,
                pageSpeedScanError: true,
                businessProfileError: true,
                crawlerUsed: true,
                crawlerWarning: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
            auditItems: {
              select: {
                id: true,
                auditId: true,
                type: true,
                targetUrl: true,
                currentValue: true,
                suggestedValue: true,
                status: true,
                appliedAt: true,
                errorMessage: true,
                source: true,
                contentQualityWarning: true,
                createdAt: true,
                updatedAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Map sites to parse cached GSC keyword research and remove raw gscCachedData
    const sites = user.sites.map((site) => {
      let keywordResearch = null;
      if (site.gscCachedData) {
        try {
          keywordResearch = JSON.parse(site.gscCachedData);
        } catch (e) {
          console.error("Failed to parse gscCachedData during export:", e);
        }
      }
      const { gscCachedData, ...rest } = site;
      return {
        ...rest,
        keywordResearch,
      };
    });

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionActive: user.subscriptionActive,
        plan: user.plan,
        planSource: user.planSource,
        planActivatedAt: user.planActivatedAt,
        onboardingCompletedAt: user.onboardingCompletedAt,
        reportEmailDay: user.reportEmailDay,
        reportEmailEnabled: user.reportEmailEnabled,
        subscriptionEndsAt: user.subscriptionEndsAt,
        cancellationReason: user.cancellationReason,
        createdAt: user.createdAt,
      },
      sites,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error("[User Data Export Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile user data export" },
      { status: 500 }
    );
  }
}
