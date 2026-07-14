import { NextResponse } from "next/server";
import { verifyWpConnection, normalizeWpUrl } from "@/lib/wordpress";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "WordPress site connected successfully!",
      siteId: site.id,
    });
  } catch (error: any) {
    console.error("[WordPress Connect Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
