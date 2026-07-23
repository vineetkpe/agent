import { NextResponse } from "next/server";
import { isSafeUrlToFetch } from "@/lib/urlSafety";
import { crawlSite, CrawledPage } from "@/lib/crawler";
import { checkRateLimit } from "@/lib/rateLimit";

interface TeaserIssue {
  type: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export async function POST(req: Request) {
  try {
    // Extract IP address for rate limiting unauthenticated public requests
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous-ip";

    // 1. Enforce strict rate limiting (e.g. 5 audits per 10 minutes per IP)
    const allowed = await checkRateLimit(ip, "public_free_audit", 5, 10);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. You can run up to 5 free website audits per 10 minutes. Please try again shortly." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing required parameter: url" }, { status: 400 });
    }

    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // 2. Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL provided. Please enter a valid website address (e.g. https://example.com)." }, { status: 400 });
    }

    // 3. SSRF Protection: Reject private/internal/local IP addresses and non-public hosts
    const isSafe = await isSafeUrlToFetch(parsedUrl.toString());
    if (!isSafe) {
      return NextResponse.json(
        { error: "Invalid website URL. Private, internal, or non-resolvable addresses cannot be audited." },
        { status: 400 }
      );
    }

    // 4. Perform lightweight single-page crawl (cap at 1 page for speed and abuse resistance)
    const crawlResult = await crawlSite(parsedUrl.toString(), 1);
    if (!crawlResult || crawlResult.pages.length === 0) {
      return NextResponse.json(
        { error: "Could not reach or parse the target website. Make sure the site is online and publicly accessible." },
        { status: 422 }
      );
    }

    const page: CrawledPage = crawlResult.pages[0];
    const detectedIssues: TeaserIssue[] = [];
    let scoreDeduction = 0;

    // Check 1: Meta Title
    if (!page.title || page.title.trim() === "") {
      detectedIssues.push({
        type: "meta_title",
        title: "Missing Page Title",
        description: "The page does not have an HTML <title> tag, which is critical for search engine rankings.",
        severity: "high",
      });
      scoreDeduction += 20;
    } else if (page.title.length < 30) {
      detectedIssues.push({
        type: "meta_title",
        title: "Page Title Too Short",
        description: `Current title is ${page.title.length} characters. Search engines recommend titles between 30 and 60 characters.`,
        severity: "medium",
      });
      scoreDeduction += 10;
    } else if (page.title.length > 60) {
      detectedIssues.push({
        type: "meta_title",
        title: "Page Title Truncated",
        description: `Current title is ${page.title.length} characters and will be truncated on Google search result pages.`,
        severity: "medium",
      });
      scoreDeduction += 10;
    }

    // Check 2: Meta Description
    if (!page.metaDescription || page.metaDescription.trim() === "") {
      detectedIssues.push({
        type: "meta_description",
        title: "Missing Meta Description",
        description: "The page lacks a meta description tag, reducing click-through rates on search results.",
        severity: "high",
      });
      scoreDeduction += 20;
    } else if (page.metaDescription.length < 70) {
      detectedIssues.push({
        type: "meta_description",
        title: "Meta Description Too Short",
        description: `Meta description is ${page.metaDescription.length} characters (recommended: 70-160 characters).`,
        severity: "low",
      });
      scoreDeduction += 8;
    } else if (page.metaDescription.length > 160) {
      detectedIssues.push({
        type: "meta_description",
        title: "Meta Description Truncated",
        description: `Meta description is ${page.metaDescription.length} characters and may get cut off on search results.`,
        severity: "low",
      });
      scoreDeduction += 8;
    }

    // Check 3: Heading Structure (H1)
    const h1Headings = page.headings.filter((h) => h.level.toLowerCase() === "h1");
    if (h1Headings.length === 0) {
      detectedIssues.push({
        type: "heading_structure",
        title: "Missing H1 Heading",
        description: "No <h1> heading tag was found on the homepage. Search engines rely on H1s to understand main topics.",
        severity: "high",
      });
      scoreDeduction += 15;
    } else if (h1Headings.length > 1) {
      detectedIssues.push({
        type: "heading_structure",
        title: "Multiple H1 Headings Detected",
        description: `Found ${h1Headings.length} H1 tags. Best practice is to have exactly one H1 per page.`,
        severity: "medium",
      });
      scoreDeduction += 10;
    }

    // Check 4: Missing Image Alt Tags
    const imagesMissingAlt = page.images.filter((img) => !img.alt || img.alt.trim() === "");
    if (imagesMissingAlt.length > 0) {
      detectedIssues.push({
        type: "missing_alt",
        title: `${imagesMissingAlt.length} Image(s) Missing Alt Text`,
        description: "Images without alt text harm web accessibility and image search optimization.",
        severity: "medium",
      });
      scoreDeduction += Math.min(20, imagesMissingAlt.length * 5);
    }

    // Check 5: Mobile Viewport Meta Tag
    const hasViewport = page.rawHtml.includes('name="viewport"') || page.rawHtml.includes("viewport");
    if (!hasViewport) {
      detectedIssues.push({
        type: "mobile_viewport_missing",
        title: "Missing Mobile Viewport Tag",
        description: "Page lacks a responsive viewport tag, making it render poorly on mobile devices.",
        severity: "high",
      });
      scoreDeduction += 20;
    }

    // Check 6: Canonical Tag
    const hasCanonical = page.rawHtml.includes('rel="canonical"') || page.rawHtml.includes("canonical");
    if (!hasCanonical) {
      detectedIssues.push({
        type: "canonical_tag",
        title: "Missing Canonical Tag",
        description: "No canonical tag specified, increasing risk of duplicate content indexing.",
        severity: "medium",
      });
      scoreDeduction += 10;
    }

    // Compute final mini score (range 30 to 98)
    const computedScore = Math.max(30, Math.min(98, 100 - scoreDeduction));

    // Limit teaser issues to top 2-3 items
    const teaserIssues = detectedIssues.slice(0, 3);
    const totalIssuesCount = detectedIssues.length;
    const hiddenCount = Math.max(0, totalIssuesCount - teaserIssues.length);

    return NextResponse.json({
      success: true,
      url: parsedUrl.toString(),
      score: computedScore,
      teaserIssues,
      totalIssuesCount,
      hiddenCount,
    });
  } catch (error) {
    console.error("[Public Free Audit API Error]:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while analyzing the website. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
