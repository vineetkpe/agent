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
      console.error("[Monthly Report Cron] CRON_SECRET is not set in environment.");
      return NextResponse.json({ error: "CRON_SECRET environment config missing" }, { status: 500 });
    }

    const token = authHeader.replace(/^bearer\s+/i, "").trim();
    if (token !== expectedSecret) {
      console.warn("[Monthly Report Cron] Unauthorized trigger attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Monthly Report Cron] Triggered report compilation`);

    // Fetch active users
    const users = await prisma.user.findMany({
      where: {
        reportEmailEnabled: true,
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
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    for (const user of users) {
      // 2. Gate check by Plan limit
      const limits = getEffectivePlanLimits(user);
      if (!limits.autoScheduledCrawl) {
        console.log(`[Monthly Report Cron] User ${user.email} plan does not support scheduled crawlers/reports.`);
        continue;
      }

      console.log(`[Monthly Report Cron] Compiling digest for: ${user.email}`);

      let totalAuditsRunThisMonth = 0;
      let totalFixesApprovedOrApplied = 0;
      let hasRealActivity = false;
      const siteDigests = [];

      for (const site of user.sites) {
        // Find audits this month vs previous month
        const auditsThisMonth = site.audits.filter(a => a.createdAt >= oneMonthAgo);
        const auditsPrevMonth = site.audits.filter(a => a.createdAt >= twoMonthsAgo && a.createdAt < oneMonthAgo);

        const auditCount = auditsThisMonth.length;
        totalAuditsRunThisMonth += auditCount;

        // Fetch audit item counts updated this month
        const itemsUpdatedThisMonth = await prisma.auditItem.findMany({
          where: {
            siteId: site.id,
            updatedAt: { gte: oneMonthAgo },
            status: { in: ["approved", "applied"] },
          },
        });
        const approvedCount = itemsUpdatedThisMonth.filter(i => i.status === "approved").length;
        const appliedCount = itemsUpdatedThisMonth.filter(i => i.status === "applied").length;
        totalFixesApprovedOrApplied += (approvedCount + appliedCount);

        if (auditCount > 0 || approvedCount > 0 || appliedCount > 0) {
          hasRealActivity = true;
        }

        // Calculate SEO Health Scores
        const latestAudit = auditsThisMonth[0] || site.audits[0] || null;
        let scoreChangeStr = "no audits recorded";
        let currentHealth = 0;

        if (latestAudit) {
          currentHealth = calculateSeoHealthScore(latestAudit);
          // Look for an audit before this month
          const prevAudit = auditsPrevMonth[0] || site.audits.find(a => a.createdAt < oneMonthAgo) || null;
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
            const thisMonthGsc = await fetchGscSummary(site, oneMonthAgo, new Date());
            const prevMonthGsc = await fetchGscSummary(site, twoMonthsAgo, oneMonthAgo);
            
            const clicksDiff = thisMonthGsc.clicks - prevMonthGsc.clicks;
            const impsDiff = thisMonthGsc.impressions - prevMonthGsc.impressions;
            
            gscChangeText = `${thisMonthGsc.clicks} clicks (${clicksDiff >= 0 ? "+" : ""}${clicksDiff}), ${thisMonthGsc.impressions} impressions (${impsDiff >= 0 ? "+" : ""}${impsDiff})`;
            if (thisMonthGsc.clicks > 0 || prevMonthGsc.clicks > 0) {
              hasRealActivity = true;
            }
          } catch (e) {
            console.error(`[Monthly Report Cron] GSC fetch failed for site ${site.url}:`, e);
          }
        }

        // Fetch GA sessions trend if connected
        let gaChangeText = "Not connected";
        if (site.gaConnected && site.gaPropertyId) {
          try {
            const thisMonthGaMap = await fetchDailySessions(site, oneMonthAgo, new Date());
            const prevMonthGaMap = await fetchDailySessions(site, twoMonthsAgo, oneMonthAgo);
            
            const thisMonthSessions = Object.values(thisMonthGaMap).reduce((a, b) => a + b, 0);
            const prevMonthSessions = Object.values(prevMonthGaMap).reduce((a, b) => a + b, 0);
            const sessionsDiff = thisMonthSessions - prevMonthSessions;
            
            gaChangeText = `${thisMonthSessions} sessions (${sessionsDiff >= 0 ? "+" : ""}${sessionsDiff})`;
            if (thisMonthSessions > 0 || prevMonthSessions > 0) {
              hasRealActivity = true;
            }
          } catch (e) {
            console.error(`[Monthly Report Cron] GA fetch failed for site ${site.url}:`, e);
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
        subject = "HeyDrona SEO Monthly Growth Report";
        emailHtml = `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #7c3aed; margin-bottom: 5px;">HeyDrona Monthly SEO Digest</h2>
            <p style="color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; margin-top: 0;">No active scans this month</p>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p>Hello,</p>
            <p>We did not log any new crawls, scan updates, or optimization changes on your websites during the previous month.</p>
            <p>Keeping your site optimized regularly is key to maintaining search authority and attracting local appointments and inquiries.</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Ready to optimize your site?</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; margin-top: 10px;">Launch Your Dashboard</a>
            </div>
            <p>See you next month!</p>
            <br />
            <p style="font-size: 12px; color: #a1a1aa; border-t: 1px solid #e4e4e7; pt: 10px;">The HeyDrona Team</p>
          </div>
        `;
      } else {
        subject = "HeyDrona SEO Monthly Growth Report - Monthly Summary Inside";
        
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
            <h2 style="color: #7c3aed; margin-bottom: 5px;">HeyDrona Monthly Growth Report</h2>
            <p style="color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; margin-top: 0;">Monthly Performance Summary</p>
            <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p>Hello,</p>
            <p>Here is your monthly search intelligence performance overview for the sites on your account:</p>
            
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
    console.error("[Monthly Report Cron Error]:", error);
    return NextResponse.json({ error: error.message || "Monthly report cron execution failed." }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
