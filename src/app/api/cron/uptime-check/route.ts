import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSafeUrlToFetch } from "@/lib/urlSafety";
import { getEffectivePlanLimits } from "@/lib/planLimits";

async function sendEmail(to: string, subject: string, htmlContent: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Uptime Cron] Missing RESEND_API_KEY, skipping alert dispatch.");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "HeyDrona Growth <onboarding@resend.dev>",
        to,
        subject,
        html: htmlContent,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Uptime Cron] Resend email send failed: ${text}`);
    } else {
      console.log(`[Uptime Cron] Dispatched email to ${to} successfully.`);
    }
  } catch (e) {
    console.error("[Uptime Cron] Network error calling Resend API:", e);
  }
}

async function pingSite(url: string): Promise<{ isUp: boolean; responseTimeMs: number; statusCode: number | null; errorMessage: string | null }> {
  const startTime = Date.now();
  
  // SSRF Protection check
  const isSafe = await isSafeUrlToFetch(url);
  if (!isSafe) {
    return {
      isUp: false,
      responseTimeMs: Date.now() - startTime,
      statusCode: null,
      errorMessage: "SSRF verification failed: Hostname/IP resolved to private or invalid address."
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "HeyDrona Uptime Checker/1.0",
      },
    });
    clearTimeout(timeoutId);

    // Fallback to GET if HEAD method is unsupported (400, 405, 501)
    if (res.status === 400 || res.status === 405 || res.status === 501) {
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 10000);
      res = await fetch(url, {
        method: "GET",
        signal: getController.signal,
        headers: {
          "User-Agent": "HeyDrona Uptime Checker/1.0",
        },
      });
      clearTimeout(getTimeoutId);
    }

    const duration = Date.now() - startTime;
    const isUp = res.status >= 200 && res.status < 400;

    return {
      isUp,
      responseTimeMs: duration,
      statusCode: res.status,
      errorMessage: isUp ? null : `HTTP status code: ${res.status}`,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;
    return {
      isUp: false,
      responseTimeMs: duration,
      statusCode: null,
      errorMessage: err.name === "AbortError" ? "Request timed out after 10 seconds" : err.message || String(err),
    };
  }
}

async function processInBatches(sites: any[], batchSize: number, processor: (site: any) => Promise<void>) {
  for (let i = 0; i < sites.length; i += batchSize) {
    const batch = sites.slice(i, i + batchSize);
    await Promise.all(batch.map(processor));
  }
}

export async function GET(req: Request) {
  try {
    // 1. Authorization header validation
    const authHeader = req.headers.get("authorization") || "";
    const expectedSecret = process.env.CRON_SECRET;
    
    if (!expectedSecret) {
      console.error("[Uptime Cron] CRON_SECRET is not set in environment.");
      return NextResponse.json({ error: "CRON_SECRET environment config missing" }, { status: 500 });
    }

    const token = authHeader.replace(/^bearer\s+/i, "").trim();
    if (token !== expectedSecret) {
      console.warn("[Uptime Cron] Unauthorized trigger attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Load all eligible sites
    const allSites = await prisma.site.findMany({
      where: {
        uptimeMonitoringEnabled: true,
      },
      include: {
        user: true,
      },
    });

    const eligibleSites = allSites.filter((site) => {
      const limits = getEffectivePlanLimits(site.user);
      return limits.uptimeMonitoring;
    });

    console.log(`[Uptime Cron] Starting check for ${eligibleSites.length} eligible sites.`);

    // 3. Process sites in concurrency batch of 10
    await processInBatches(eligibleSites, 10, async (site) => {
      const checkResult = await pingSite(site.url);
      const checkedAt = new Date();

      // Log current check to database
      await prisma.uptimeCheck.create({
        data: {
          siteId: site.id,
          checkedAt,
          isUp: checkResult.isUp,
          responseTimeMs: checkResult.responseTimeMs,
          statusCode: checkResult.statusCode,
          errorMessage: checkResult.errorMessage,
        },
      });

      // Update Site model
      const previousStatus = site.currentUptimeStatus;
      const newStatus = checkResult.isUp ? "up" : "down";

      await prisma.site.update({
        where: { id: site.id },
        data: {
          currentUptimeStatus: newStatus,
          lastUptimeCheckAt: checkedAt,
        },
      });

      // Handle transitions & alerts
      const ownerEmail = site.user?.email;
      if (ownerEmail) {
        if (previousStatus === "up" && !checkResult.isUp) {
          // Transition to DOWN
          console.log(`[Uptime Alert] Site ${site.url} is DOWN. Dispatching email to ${ownerEmail}`);
          const subject = `🚨 Alert: Your website ${site.url} is DOWN`;
          const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
              <h2 style="color: #dc2626;">Uptime Monitoring Alert</h2>
              <p>We detected that your website is currently offline.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Website URL:</td>
                  <td style="padding: 8px 0;">${site.url}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Checked At:</td>
                  <td style="padding: 8px 0;">${checkedAt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Error Detail:</td>
                  <td style="padding: 8px 0; color: #b91c1c;">${checkResult.errorMessage || "Unknown connection error"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">HTTP Code:</td>
                  <td style="padding: 8px 0;">${checkResult.statusCode || "N/A"}</td>
                </tr>
              </table>
              <p style="margin-top: 25px; font-size: 13px; color: #6b7280;">
                We will continue to inspect your site status every 5 minutes and notify you when service is recovered.
              </p>
            </div>
          `;
          await sendEmail(ownerEmail, subject, htmlContent);
        } else if (previousStatus === "down" && checkResult.isUp) {
          // Transition to UP (Recovery)
          console.log(`[Uptime Alert] Site ${site.url} recovered. Dispatching email to ${ownerEmail}`);
          const subject = `✅ Recovered: Your website ${site.url} is UP`;
          const htmlContent = `
            <div style="font-family: sans-serif; padding: 20px; color: #1f2937;">
              <h2 style="color: #16a34a;">Service Recovery Confirmed</h2>
              <p>Your website has successfully recovered and is back online.</p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Website URL:</td>
                  <td style="padding: 8px 0;">${site.url}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Checked At:</td>
                  <td style="padding: 8px 0;">${checkedAt.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Response Time:</td>
                  <td style="padding: 8px 0;">${checkResult.responseTimeMs}ms</td>
                </tr>
              </table>
              <p style="margin-top: 25px; font-size: 13px; color: #6b7280;">
                No action is required. We are continuously tracking your website visibility.
              </p>
            </div>
          `;
          await sendEmail(ownerEmail, subject, htmlContent);
        }
      }
    });

    return NextResponse.json({ success: true, checkedCount: eligibleSites.length });
  } catch (error: any) {
    console.error("[Uptime Cron Error]:", error);
    return NextResponse.json({ error: error.message || "Uptime check cron failed." }, { status: 500 });
  }
}
