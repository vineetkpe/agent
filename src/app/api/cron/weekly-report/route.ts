import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { calculateSeoHealthScore } from "@/lib/scoreCalculator";
import { fetchGscSummary } from "@/lib/googleSearchConsole";
import { fetchDailySessions } from "@/lib/googleAnalytics";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    // 1. Authorization header validation
    const authHeader = req.headers.get("authorization") || "";
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      console.error("[Weekly Report Cron] CRON_SECRET is not set in environment.");
      return NextResponse.json({ error: "CRON_SECRET environment config missing" }, { status: 500 });
    }

    const token = authHeader.replace(/^bearer\s+/i, "").trim();
    if (token !== expectedSecret) {
      console.warn("[Weekly Report Cron] Unauthorized trigger attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().getUTCDay();
    console.log(`[Weekly Report Cron] Running for UTC day: ${today}`);

    // Fetch active users with matching email day
    const users = await prisma.user.findMany({
      where: {
        reportEmailEnabled: true,
        reportEmailDay: today,
        suspended: false,
      },
      include: {
        sites: {
          include: {
            audits: {
              where: { status: "completed" },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    const results = [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    for (const user of users) {
      // 2. Gate check by Plan limit
      const limits = getEffectivePlanLimits(user);
      if (!limits.autoScheduledCrawl) {
        console.log(`[Weekly Report Cron] User ${user.email} plan does not support scheduled crawlers/reports.`);
        continue;
      }

      console.log(`[Weekly Report Cron] Compiling digest for: ${user.email}`);

      let totalAuditsRunThisWeek = 0;
      let totalFixesApprovedOrApplied = 0;
      let hasRealActivity = false;
      const siteDigests = [];

      for (const site of user.sites) {
        // Find audits this week vs previous week
        const auditsThisWeek = site.audits.filter(a => a.createdAt >= oneWeekAgo);
        const auditsPrevWeek = site.audits.filter(a => a.createdAt >= twoWeeksAgo && a.createdAt < oneWeekAgo);

        const auditCount = auditsThisWeek.length;
        totalAuditsRunThisWeek += auditCount;

        // Fetch audit item counts updated this week
        const itemsUpdatedThisWeek = await prisma.auditItem.findMany({
          where: {
            siteId: site.id,
            updatedAt: { gte: oneWeekAgo },
            status: { in: ["approved", "applied"] },
          },
        });
        const approvedCount = itemsUpdatedThisWeek.filter(i => i.status === "approved").length;
        const appliedCount = itemsUpdatedThisWeek.filter(i => i.status === "applied").length;
        totalFixesApprovedOrApplied += (approvedCount + appliedCount);

        if (auditCount > 0 || approvedCount > 0 || appliedCount > 0) {
          hasRealActivity = true;
        }

        // Calculate SEO Health Scores
        const latestAudit = auditsThisWeek[0] || site.audits[0] || null;
        let scoreChangeStr = "no audits recorded";
        let currentHealth = 0;

        if (latestAudit) {
          currentHealth = calculateSeoHealthScore(latestAudit);
          // Look for an audit before this week
          const prevAudit = auditsPrevWeek[0] || site.audits.find(a => a.createdAt < oneWeekAgo) || null;
          if (prevAudit) {
            const prevHealth = calculateSeoHealthScore(prevAudit);
            const diff = currentHealth - prevHealth;
            scoreChangeStr = `${currentHealth}% (${diff >= 0 ? "+" : ""}${diff}%)`;
          } else {
            scoreChangeStr = `${currentHealth}% (baseline)`;
          }
        }

        // Fetch GSC clicks/impressions trend if connected
        let gscChangeText = "Not connected";
        if (site.gscConnected) {
          try {
            const thisWeekGsc = await fetchGscSummary(site, oneWeekAgo, new Date());
            const prevWeekGsc = await fetchGscSummary(site, twoWeeksAgo, oneWeekAgo);
            
            const clicksDiff = thisWeekGsc.clicks - prevWeekGsc.clicks;
            const impsDiff = thisWeekGsc.impressions - prevWeekGsc.impressions;
            
            gscChangeText = `${thisWeekGsc.clicks} clicks (${clicksDiff >= 0 ? "+" : ""}${clicksDiff}), ${thisWeekGsc.impressions} impressions (${impsDiff >= 0 ? "+" : ""}${impsDiff})`;
            if (thisWeekGsc.clicks > 0 || prevWeekGsc.clicks > 0) {
              hasRealActivity = true;
            }
          } catch (e) {
            console.error(`[Weekly Report Cron] GSC fetch failed for site ${site.url}:`, e);
          }
        }

        // Fetch GA sessions trend if connected
        let gaChangeText = "Not connected";
        if (site.gaConnected && site.gaPropertyId) {
          try {
            const thisWeekGaMap = await fetchDailySessions(site, oneWeekAgo, new Date());
            const prevWeekGaMap = await fetchDailySessions(site, twoWeeksAgo, oneWeekAgo);
            
            const thisWeekSessions = Object.values(thisWeekGaMap).reduce((a, b) => a + b, 0);
            const prevWeekSessions = Object.values(prevWeekGaMap).reduce((a, b) => a + b, 0);
            const sessionsDiff = thisWeekSessions - prevWeekSessions;
            
            gaChangeText = `${thisWeekSessions} sessions (${sessionsDiff >= 0 ? "+" : ""}${sessionsDiff})`;
            if (thisWeekSessions > 0 || prevWeekSessions > 0) {
              hasRealActivity = true;
            }
          } catch (e) {
            console.error(`[Weekly Report Cron] GA fetch failed for site ${site.url}:`, e);
          }
        }

        siteDigests.push({
          url: site.url,
          scoreText: scoreChangeStr,
          scansRun: auditCount,
          applied: appliedCount,
          approved: approvedCount,
          gscText: gscChangeText,
          gaText: gaChangeText,
        });
      }

      // 3. Compile and Dispatch Email
      let emailHtml = "";
      let subject = "";

      if (!hasRealActivity) {
        subject = "HeyDrona SEO Weekly Digest - Keep Growing!";
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #7c3aed; margin-bottom: 5px;">HeyDrona Weekly Growth Digest</h2>
            <p style="color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; margin-top: 0;">No new scans this week</p>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p>Hello,</p>
            <p>We did not log any new crawls, scan updates, or optimization changes on your websites this week.</p>
            <p>Keeping your site optimized is key to maintaining search authority and attracting local appointments and inquiries.</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Want to check your SEO scores?</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 10px;">Launch Your Dashboard</a>
            </div>
            <p>See you next week!</p>
            <br />
            <p style="font-size: 12px; color: #a1a1aa; border-t: 1px solid #e4e4e7; pt: 10px;">The HeyDrona Team</p>
          </div>
        `;
      } else {
        subject = "HeyDrona SEO Weekly Digest - Real Growth Metrics Inside";
        
        let sitesHtml = "";
        for (const s of siteDigests) {
          sitesHtml += `
            <div style="border: 1px solid #e4e4e7; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <h4 style="margin: 0 0 10px 0; color: #18181b; font-size: 15px;">${s.url}</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
                <tr>
                  <td style="padding: 5px 0; font-weight: bold; width: 40%;">SEO Health Score:</td>
                  <td style="padding: 5px 0; color: #7c3aed; font-weight: bold;">${s.scoreText}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">New Scans Run:</td>
                  <td style="padding: 5px 0;">${s.scansRun} audits</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">Fixes Approved / Applied:</td>
                  <td style="padding: 5px 0;">${s.approved} approved, ${s.applied} applied</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">GSC Search Performance:</td>
                  <td style="padding: 5px 0; font-family: monospace;">${s.gscText}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: bold;">Google Analytics 4:</td>
                  <td style="padding: 5px 0; font-family: monospace;">${s.gaText}</td>
                </tr>
              </table>
            </div>
          `;
        }

        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #7c3aed; margin-bottom: 5px;">HeyDrona Weekly Growth Digest</h2>
            <p style="color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; margin-top: 0;">Weekly Activity Summary</p>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p>Hello,</p>
            <p>Here is your weekly search intelligence performance overview for the sites on your account:</p>
            
            ${sitesHtml}

            <div style="text-align: center; margin: 25px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Manage Your AI Growth Routines</a>
            </div>
            <p>Best regards,</p>
            <p style="font-size: 12px; color: #a1a1aa; border-t: 1px solid #e4e4e7; pt: 10px;">The HeyDrona Team</p>
          </div>
        `;
      }

      await sendEmail({
        to: user.email,
        subject,
        html: emailHtml,
      });

      results.push({ email: user.email, success: true, hasRealActivity });
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
    });
  } catch (error: any) {
    console.error("[Weekly Report Cron Error]:", error);
    return NextResponse.json({ error: error.message || "Weekly report cron execution failed." }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
