import { NextResponse } from "next/server";
import { verifyWpConnection, normalizeWpUrl, detectSeoPlugin } from "@/lib/wordpress";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";
import { checkRateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const isAdmin = currentUser.isAdmin || (currentUser.email && currentUser.email.toLowerCase() === "vineetkpe@gmail.com");
    if (!isAdmin) {
      const allowed = await checkRateLimit(currentUser.id, "wp_connect", 10, 60);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many WordPress connection attempts. Limit is 10 per hour." },
          { status: 429 }
        );
      }
    }
    const { wpUrl, username, appPassword, siteUrl } = await req.json();

    if (!wpUrl || !username || !appPassword || !siteUrl) {
      return NextResponse.json(
        { error: "Missing required connection parameters: wpUrl, username, appPassword, siteUrl" },
        { status: 400 }
      );
    }

    const normalizedWpUrl = normalizeWpUrl(wpUrl);
    
    // Normalize target siteUrl origin (BUG-3 URL consistency)
    let targetSiteUrl = siteUrl.trim();
    if (!/^https?:\/\//i.test(targetSiteUrl)) {
      targetSiteUrl = "https://" + targetSiteUrl;
    }
    const normalizedSiteUrl = new URL(targetSiteUrl).origin;

    // TRUST-3: Lock WordPress domain connection
    const wpHostname = new URL(normalizedWpUrl).hostname.replace(/^www\./i, "");
    const siteHostname = new URL(normalizedSiteUrl).hostname.replace(/^www\./i, "");
    if (wpHostname !== siteHostname) {
      return NextResponse.json(
        { error: `WordPress site domain must match the crawled website (${normalizedSiteUrl}). Add and crawl that site first if you want to connect a different domain.` },
        { status: 400 }
      );
    }

    // SSRF Checks (SEC-2 SSRF protection)
    if (!(await isSafeUrlToFetch(normalizedWpUrl)) || !(await isSafeUrlToFetch(normalizedSiteUrl))) {
      return NextResponse.json(
        { error: "Unsafe website or WordPress URL endpoint provided." },
        { status: 400 }
      );
    }
    
    // 1. Verify connection to WordPress REST API
    const isConnected = await verifyWpConnection(normalizedWpUrl, username, appPassword);
    if (!isConnected) {
      return NextResponse.json(
        { error: "Could not connect to WordPress. Please verify URL, username, and Application Password." },
        { status: 401 }
      );
    }

    // Detect SEO Plugin
    const detectedPlugin = await detectSeoPlugin(normalizedWpUrl);

    // 3. Encrypt the application password
    const encryptedPassword = encrypt(appPassword);

    // 4. Update or Create the Site record with WordPress connection info
    let site = await prisma.site.findFirst({
      where: {
        userId: currentUser.id,
        url: normalizedSiteUrl,
      },
    });

    if (site) {
      site = await prisma.site.update({
        where: { id: site.id },
        data: {
          wpUrl: normalizedWpUrl,
          wpUsername: username,
          wpAppPasswordEncrypted: encryptedPassword,
          detectedSeoPlugin: detectedPlugin,
          wpConnectedAt: new Date(),
        },
      });
    } else {
      site = await prisma.site.create({
        data: {
          userId: currentUser.id,
          url: normalizedSiteUrl,
          wpUrl: normalizedWpUrl,
          wpUsername: username,
          wpAppPasswordEncrypted: encryptedPassword,
          detectedSeoPlugin: detectedPlugin,
          wpConnectedAt: new Date(),
        },
      });
    }

    await logActivity(currentUser.id, "wp_connect", { siteId: site.id, wpUrl: normalizedWpUrl }, req);

    return NextResponse.json({
      success: true,
      message: "WordPress site connected successfully!",
      siteId: site.id,
    });
  } catch (error) {
    console.error("[WordPress Connect Route Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

