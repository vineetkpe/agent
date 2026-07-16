import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Normalize URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }
    const cleanUrl = new URL(targetUrl).origin;

    // SSRF checks
    if (!(await isSafeUrlToFetch(cleanUrl))) {
      return NextResponse.json({ error: "Unsafe or private IP address provided." }, { status: 400 });
    }

    // Check if site already exists for this user
    let site = await prisma.site.findFirst({
      where: {
        userId: currentUser.id,
        url: cleanUrl,
      },
    });

    if (site) {
      return NextResponse.json({ error: "Site already registered in your account." }, { status: 409 });
    }

    // Create the Site record
    site = await prisma.site.create({
      data: {
        userId: currentUser.id,
        url: cleanUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: "New site added successfully!",
      site,
    });
  } catch (error: any) {
    console.error("[Site Create API Error]:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
