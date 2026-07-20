import { NextResponse } from "next/server";
import { crawlSite } from "@/lib/crawler";
import { runSeoAudits } from "@/lib/seoChecks";
import { generateStructuredJson } from "@/lib/aiProvider";
import { analyzeBusinessProfile } from "@/lib/businessIntelligence";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { sanitizeHtml } from "@/lib/sanitizer";
import { checkRateLimit } from "@/lib/rateLimit";
import { fetchSearchConsoleData } from "@/lib/googleSearchConsole";
import { validateSeoContent } from "@/lib/contentValidator";
import { runAuditForSite } from "@/lib/runAudit";
import { logActivity } from "@/lib/activityLog";

// Define the response schema structure expected from Gemini
const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    keywordOpportunities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          keyword: { type: "STRING" },
          rationale: { type: "STRING" },
          intent: { type: "STRING", enum: ["informational", "transactional"] },
        },
        required: ["keyword", "rationale", "intent"],
      },
    },
    fixes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          targetUrl: { type: "STRING" },
          type: { type: "STRING", enum: ["meta_title", "meta_description", "schema_markup", "missing_alt", "broken_link", "heading_structure", "canonical_tag", "social_meta", "duplicate_content"] },
          suggestedValue: { type: "STRING" },
        },
        required: ["targetUrl", "type", "suggestedValue"],
      },
    },
    blogPosts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          content: { type: "STRING" },
          metaDescription: { type: "STRING" },
          wordCount: { type: "INTEGER" },
          internalLinksUsed: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          externalLinksUsed: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          suggestedSchema: { type: "STRING" },
          suggestedSlug: { type: "STRING" },
          targetKeyword: { type: "STRING" },
        },
        required: [
          "title",
          "content",
          "metaDescription",
          "wordCount",
          "internalLinksUsed",
          "externalLinksUsed",
          "suggestedSchema",
          "suggestedSlug",
          "targetKeyword"
        ],
      },
    },
  },
  required: ["keywordOpportunities", "fixes", "blogPosts"],
};

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSiteId = searchParams.get("siteId");
    const requestedAuditId = searchParams.get("auditId");

    let site;
    if (requestedSiteId) {
      site = await prisma.site.findFirst({
        where: { id: requestedSiteId, userId: currentUser.id },
        select: {
          id: true,
          url: true,
          wpUrl: true,
          wpUsername: true,
          customInstructions: true,
          gscConnected: true,
          gscUrl: true,
          businessProfile: true,
          wpConnectedAt: true,
          detectedSeoPlugin: true,
          uptimeMonitoringEnabled: true,
          currentUptimeStatus: true,
          lastUptimeCheckAt: true,
          gaPropertyId: true,
          gaConnected: true,
          manuallyEnteredContext: true,
          competitorsJson: true,
          createdAt: true,
        },
      });
    } else {
      site = await prisma.site.findFirst({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          url: true,
          wpUrl: true,
          wpUsername: true,
          customInstructions: true,
          gscConnected: true,
          gscUrl: true,
          businessProfile: true,
          wpConnectedAt: true,
          detectedSeoPlugin: true,
          uptimeMonitoringEnabled: true,
          currentUptimeStatus: true,
          lastUptimeCheckAt: true,
          gaPropertyId: true,
          gaConnected: true,
          manuallyEnteredContext: true,
          competitorsJson: true,
          createdAt: true,
        },
      });
    }

    const allSites = await prisma.site.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        url: true,
        wpUrl: true,
        wpUsername: true,
        customInstructions: true,
        gscConnected: true,
        gscUrl: true,
        businessProfile: true,
        wpConnectedAt: true,
        detectedSeoPlugin: true,
        uptimeMonitoringEnabled: true,
        currentUptimeStatus: true,
        lastUptimeCheckAt: true,
        gaPropertyId: true,
        gaConnected: true,
        manuallyEnteredContext: true,
        competitorsJson: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!site) {
      return NextResponse.json({ site: null, audit: null, pastAudits: [], allSites });
    }

    const latestAudit = await prisma.audit.findFirst({
      where: requestedAuditId 
        ? { id: requestedAuditId, siteId: site.id }
        : { siteId: site.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    const pastAudits = await prisma.audit.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
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
        aiScanError: true,
        pageSpeedScanError: true,
        createdAt: true,
        status: true,
      },
    });

    // Build Activity Log
    const siteAudits = await prisma.audit.findMany({
      where: { siteId: site.id },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const siteAuditItems = await prisma.auditItem.findMany({
      where: { siteId: site.id },
      orderBy: { updatedAt: "desc" },
    });

    const activityLog: any[] = [];

    // Add audits
    for (const aud of siteAudits) {
      if (aud.status === "completed") {
        activityLog.push({
          id: `audit-${aud.id}`,
          type: "audit_completed",
          timestamp: aud.createdAt,
          title: "Crawl completed",
          detail: `Found ${aud._count.items} issues/recommendations.`,
        });
      }
    }

    // Add status transitions
    for (const item of siteAuditItems) {
      if (item.status === "applied") {
        let postTitle = "";
        let wpLink = "";
        if (item.type === "blog_post" && item.suggestedValue) {
          try {
            const parsed = JSON.parse(item.suggestedValue);
            postTitle = parsed.title || "";
            wpLink = parsed.wpLink || "";
          } catch {}
        }
        activityLog.push({
          id: `apply-${item.id}`,
          type: "item_applied",
          timestamp: item.appliedAt || item.updatedAt,
          title: item.type === "blog_post" 
            ? `Published to WordPress: ${postTitle || "Blog Post"}` 
            : `Applied fix: ${item.type.replace("_", " ")}`,
          detail: `For ${item.targetUrl}`,
          link: wpLink || undefined,
        });
      } else if (item.status === "approved") {
        activityLog.push({
          id: `approve-${item.id}`,
          type: "item_approved",
          timestamp: item.updatedAt,
          title: `Approved: ${item.type.replace("_", " ")}`,
          detail: `For ${item.targetUrl}`,
        });
      } else if (item.status === "rejected") {
        activityLog.push({
          id: `reject-${item.id}`,
          type: "item_rejected",
          timestamp: item.updatedAt,
          title: `Rejected: ${item.type.replace("_", " ")}`,
          detail: `For ${item.targetUrl}`,
        });
      }
    }

    // Add WP connection event
    if (site.wpConnectedAt) {
      activityLog.push({
        id: `wp-conn-${site.id}`,
        type: "wp_connected",
        timestamp: site.wpConnectedAt,
        title: "Connected to WordPress",
        detail: `Credentials configured for ${site.wpUrl}`,
      });
    }

    // Sort by timestamp desc
    activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const uptimeChecks = site ? await prisma.uptimeCheck.findMany({
      where: { siteId: site.id },
      orderBy: { checkedAt: "desc" },
      take: 1000,
    }) : [];

    const allUserAuditItems = await prisma.auditItem.findMany({
      where: {
        site: {
          userId: currentUser.id
        }
      },
      include: {
        site: {
          select: { url: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    let gaData = null;
    if (site && site.gaConnected && site.gaPropertyId) {
      try {
        const { fetchAnalyticsData } = await import("@/lib/googleAnalytics");
        gaData = await fetchAnalyticsData(site);
      } catch (err) {
        console.error("[Audit Route] Failed to fetch GA4 analytics data:", err);
      }
    }

    return NextResponse.json({
      site,
      audit: latestAudit,
      pastAudits,
      allSites,
      allUserAuditItems,
      gaData,
      activityLog,
      uptimeChecks,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        subscriptionActive: currentUser.subscriptionActive,
        subscriptionEndsAt: currentUser.subscriptionEndsAt,
        isAdmin: currentUser.isAdmin,
        plan: currentUser.plan,
        onboardingCompletedAt: currentUser.onboardingCompletedAt,
        lastNotificationCheckAt: currentUser.lastNotificationCheckAt,
      },
    });
  } catch (error: any) {
    console.error("[Audit Get Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { url, targetKeyword } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing website URL parameter" }, { status: 400 });
    }

    // Normalize URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }
    const cleanUrl = new URL(targetUrl).origin;

    // SSRF Check on audit start
    if (!(await isSafeUrlToFetch(cleanUrl))) {
      return NextResponse.json({ error: "Unsafe website URL provided." }, { status: 400 });
    }

    // Fetch Site
    let site = await prisma.site.findFirst({
      where: {
        userId: currentUser.id,
        url: cleanUrl,
      },
    });

    const limits = getEffectivePlanLimits(currentUser);
    const isAdmin = currentUser.role === "admin" || currentUser.isAdmin || (currentUser.email && currentUser.email.toLowerCase() === "vineetkpe@gmail.com");

    if (!isAdmin) {
      const allowed = await checkRateLimit(currentUser.id, "audit", 10, 60);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many audit requests. Limit is 10 audits per hour." },
          { status: 429 }
        );
      }
    }

    if (!isAdmin) {
      if (!currentUser.plan) {
        const completedAuditsCount = await prisma.audit.count({
          where: {
            site: {
              userId: currentUser.id,
            },
            status: "completed",
          },
        });
        if (completedAuditsCount >= 1) {
          return NextResponse.json(
            {
              error: "upgrade_required",
              message: "Free tier is limited to 1 lifetime completed audit. Please upgrade to run additional audits.",
            },
            { status: 402 }
          );
        }
      }

      if (site) {
        const latestAudit = await prisma.audit.findFirst({
          where: { siteId: site.id },
          orderBy: { createdAt: "desc" },
        });

        if (latestAudit) {
          let cooldownMinutes = limits.cooldownMinutes;

          try {
            const settings = await prisma.appSettings.findFirst({
              where: { id: "singleton" }
            });
            if (settings && settings.auditCooldownMinutes !== null && settings.auditCooldownMinutes !== undefined) {
              cooldownMinutes = settings.auditCooldownMinutes;
            }
          } catch (settingsErr) {
            console.error("[Audit Route] Failed to load AppSettings:", settingsErr);
          }

          if (cooldownMinutes === null || cooldownMinutes === undefined) {
            if (process.env.AUDIT_COOLDOWN_MINUTES) {
              cooldownMinutes = parseInt(process.env.AUDIT_COOLDOWN_MINUTES, 10);
            } else {
              cooldownMinutes = 5;
            }
          }

          const nextAllowedTime = latestAudit.createdAt.getTime() + cooldownMinutes * 60 * 1000;
          const now = Date.now();
          if (now < nextAllowedTime) {
            const diffMs = nextAllowedTime - now;
            const diffMins = Math.ceil(diffMs / 60000);
            return NextResponse.json(
              { error: `Site was audited recently. Please wait ${diffMins} minute(s) before running another audit.` },
              { status: 429 }
            );
          }
        }
      }
    }

    // Create Site record if missing
    if (!site) {
      site = await prisma.site.create({
        data: {
          userId: currentUser.id,
          url: cleanUrl,
        },
      });
    }

    // Log the audit run event
    await logActivity(currentUser.id, "audit_run", { siteId: site.id, targetKeyword }, req);

    // Call the extracted reusable pipeline
    const completedAudit = await runAuditForSite(site, { targetKeyword });

    return NextResponse.json({
      success: true,
      audit: completedAudit,
    });

  } catch (error: any) {
    console.error("[Audit Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Audit run failed unexpectedly." },
      { status: 500 }
    );
  }
}
