import { NextResponse } from "next/server";
import { verifyWpConnection, normalizeWpUrl } from "@/lib/wordpress";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/lib/user";

export async function POST(req: Request) {
  try {
    const { wpUrl, username, appPassword, siteUrl } = await req.json();

    if (!wpUrl || !username || !appPassword || !siteUrl) {
      return NextResponse.json(
        { error: "Missing required connection parameters: wpUrl, username, appPassword, siteUrl" },
        { status: 400 }
      );
    }

    const normalizedWpUrl = normalizeWpUrl(wpUrl);
    
    // 1. Verify connection to WordPress REST API
    const isConnected = await verifyWpConnection(normalizedWpUrl, username, appPassword);
    if (!isConnected) {
      return NextResponse.json(
        { error: "Could not connect to WordPress. Please verify URL, username, and Application Password." },
        { status: 401 }
      );
    }

    // 2. Fetch or create our default workspace user
    const defaultUser = await getOrCreateDefaultUser();

    // 3. Encrypt the application password
    const encryptedPassword = encrypt(appPassword);

    // 4. Update or Create the Site record with WordPress connection info
    let site = await prisma.site.findFirst({
      where: {
        userId: defaultUser.id,
        url: siteUrl,
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
          userId: defaultUser.id,
          url: siteUrl,
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
