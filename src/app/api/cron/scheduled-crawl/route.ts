import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { runAuditForSite } from "@/lib/runAudit";

export async function GET(req: Request) {
  try {
    // 1. Authorization header validation
    const authHeader = req.headers.get("authorization") || "";
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      console.error("[Scheduled Crawl Cron] CRON_SECRET is not set in environment.");
      return NextResponse.json({ error: "CRON_SECRET environment config missing" }, { status: 500 });
    }

    const token = authHeader.replace(/^bearer\s+/i, "").trim();
    if (token !== expectedSecret) {
      console.warn("[Scheduled Crawl Cron] Unauthorized trigger attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch current UTC hour
    const currentUtcHour = new Date().getUTCHours();
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000);

    console.log(`[Scheduled Crawl Cron] Checking for UTC hour ${currentUtcHour}...`);

    // 3. Find matching sites
    const scheduledSites = await prisma.site.findMany({
      where: {
        crawlScheduleEnabled: true,
        crawlScheduleHourUtc: currentUtcHour,
        OR: [
          { lastScheduledCrawlAt: null },
          { lastScheduledCrawlAt: { lt: twentyHoursAgo } }
        ]
      },
      include: {
        user: true,
      }
    });

    // Filter by entitlement check
    const eligibleSites = scheduledSites.filter((site) => {
      const limits = getEffectivePlanLimits(site.user);
      return limits.autoScheduledCrawl;
    });

    console.log(`[Scheduled Crawl Cron] Found ${scheduledSites.length} matching schedule(s), ${eligibleSites.length} eligible based on tier limit.`);

    const results: Array<{ siteId: string; url: string; success: boolean; error?: string }> = [];

    // 4. Process in batches with concurrency limit of 5
    const batchSize = 5;
    for (let i = 0; i < eligibleSites.length; i += batchSize) {
      const batch = eligibleSites.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (site) => {
          try {
            console.log(`[Scheduled Crawl Cron] Starting scheduled crawl for site ${site.url}`);
            
            // Run audit pipeline
            await runAuditForSite(site, { isScheduled: true });

            // Update site last crawl timestamp
            await prisma.site.update({
              where: { id: site.id },
              data: {
                lastScheduledCrawlAt: new Date()
              }
            });

            results.push({ siteId: site.id, url: site.url, success: true });
            console.log(`[Scheduled Crawl Cron] Successfully ran scheduled crawl for site ${site.url}`);
          } catch (err) {
            console.error(`[Scheduled Crawl Cron] Failure for site ${site.url}:`, err);
            results.push({ siteId: site.id, url: site.url, success: false, error: (err as Error).message || String(err) });
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      processedCount: eligibleSites.length,
      results
    });

  } catch (error) {
    console.error("[Scheduled Crawl Cron Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Scheduled crawl cron failed." }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;

