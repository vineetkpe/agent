import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { checkRateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityLog";
import { crawlSite, isThinContent, CrawledPage } from "@/lib/crawler";
import { analyzeBusinessProfile } from "@/lib/businessIntelligence";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const isAdmin = currentUser.isAdmin || (currentUser.email && currentUser.email.toLowerCase() === "vineetkpe@gmail.com");
    if (!isAdmin) {
      const allowed = await checkRateLimit(currentUser.id, "site_create", 5, 60);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many site creation requests. Limit is 5 per hour." },
          { status: 429 }
        );
      }
    }

    const limits = getEffectivePlanLimits(currentUser);
    const existingSitesCount = await prisma.site.count({
      where: { userId: currentUser.id },
    });

    if (existingSitesCount >= limits.maxSites) {
      return NextResponse.json(
        {
          error: "plan_limit",
          message: `Your current plan allows up to ${limits.maxSites} site(s). You have already registered ${existingSitesCount} site(s). Please upgrade to add more.`,
          limit: limits.maxSites,
          current: existingSitesCount,
        },
        { status: 403 }
      );
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

    await logActivity(currentUser.id, "site_created", { siteId: site.id, url: cleanUrl }, req);

    // Run crawler & check content quality
    let isThin = true;
    let businessProfileData = null;
    let pages: CrawledPage[] = [];
    try {
      const crawlResult = await crawlSite(cleanUrl, 5); // cap at 5 pages for onboarding scan speed
      pages = crawlResult.pages;
      isThin = isThinContent(pages);

      if (!isThin && pages.length > 0) {
        const profile = await analyzeBusinessProfile(pages, cleanUrl, currentUser.id);
        businessProfileData = JSON.stringify(profile);

        // update site with businessProfile
        site = await prisma.site.update({
          where: { id: site.id },
          data: {
            businessProfile: businessProfileData,
          },
        });
      }
    } catch (crawlErr) {
      console.error("[Onboarding Crawl Error]:", crawlErr);
    }

    return NextResponse.json({
      success: true,
      message: "New site added successfully!",
      site,
      isThin,
    });
  } catch (error) {
    console.error("[Site Create API Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}

