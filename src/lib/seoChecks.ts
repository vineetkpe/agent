import { CrawledPage } from "./crawler";
import { isSafeUrlToFetch } from "./urlSafety";
import * as cheerio from "cheerio";

export interface AuditResults {
  scoreSeo: number;
  issues: {
    type: "meta_title" | "meta_description" | "broken_link" | "missing_alt" | "schema_markup" | "heading_structure" | "canonical_tag" | "social_meta" | "insecure_link" | "duplicate_content" | "robots_sitemap" | "image_weight";
    targetUrl: string;
    currentValue: any;
    suggestedValue: any;
  }[];
}

// Simple link checker helper
async function checkLink(url: string): Promise<{ url: string; isBroken: boolean; statusCode?: number }> {
  // SSRF Check
  if (!(await isSafeUrlToFetch(url))) {
    console.log(`[SEO Checks] Skipping unsafe link check: ${url}`);
    return { url, isBroken: true };
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    
    // Some servers return 405 Method Not Allowed for HEAD, try GET in that case
    if (response.status === 405 || response.status === 403) {
      const getResponse = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
        signal: AbortSignal.timeout(4000),
      });
      return {
        url,
        isBroken: getResponse.status >= 400,
        statusCode: getResponse.status,
      };
    }

    return {
      url,
      isBroken: response.status >= 400,
      statusCode: response.status,
    };
  } catch (err) {
    return {
      url,
      isBroken: true,
    };
  }
}

export interface PageSpeedDataResult {
  scorePerformance: number | null;
  scoreSeoGoogle: number | null;
  scoreAccessibility: number | null;
  scoreBestPractices: number | null;
  lcpSeconds: number | null;
  clsScore: number | null;
  inpMilliseconds: number | null;
  isMock?: boolean;
}

// Fetch Google PageSpeed Insights scores across all 4 categories
export async function getPageSpeedData(url: string): Promise<PageSpeedDataResult> {
  // SSRF Check
  if (!(await isSafeUrlToFetch(url))) {
    throw new Error(`SSRF validation failed: Unsafe target URL provided: ${url}`);
  }

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey || apiKey === "mock-gemini-key" || apiKey === "mock-pagespeed-key" || apiKey === "mock-key") {
    console.log("[PageSpeed] Using mock PageSpeed scores.");
    const scorePerformance = Math.floor(Math.random() * (85 - 65 + 1)) + 65;
    const scoreSeoGoogle = Math.floor(Math.random() * (95 - 80 + 1)) + 80;
    const scoreAccessibility = Math.floor(Math.random() * (90 - 75 + 1)) + 75;
    const scoreBestPractices = Math.floor(Math.random() * (88 - 70 + 1)) + 70;
    const lcpSeconds = parseFloat((Math.random() * (4.2 - 1.2) + 1.2).toFixed(2));
    const clsScore = parseFloat((Math.random() * (0.25 - 0.01) + 0.01).toFixed(3));
    const inpMilliseconds = Math.floor(Math.random() * (450 - 80) + 80);
    return {
      scorePerformance,
      scoreSeoGoogle,
      scoreAccessibility,
      scoreBestPractices,
      lcpSeconds,
      clsScore,
      inpMilliseconds,
      isMock: true,
    };
  }

  const categories = ["performance", "seo", "accessibility", "best-practices"];
  const categoryParams = categories.map(cat => `category=${cat}`).join("&");
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&${categoryParams}&key=${apiKey}`;

  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google PageSpeed Insights API failed with status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  if (data?.error) {
    throw new Error(`Google PageSpeed Insights API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const lighthouse = data?.lighthouseResult;
  if (!lighthouse) {
    throw new Error("Invalid response structure from Google PageSpeed Insights API (missing lighthouseResult).");
  }

  const perfScoreVal = lighthouse?.categories?.performance?.score;
  const seoScoreVal = lighthouse?.categories?.seo?.score;
  const accScoreVal = lighthouse?.categories?.accessibility?.score;
  const bpScoreVal = lighthouse?.categories?.["best-practices"]?.score;

  const scorePerformance = typeof perfScoreVal === "number" ? Math.round(perfScoreVal * 100) : null;
  const scoreSeoGoogle = typeof seoScoreVal === "number" ? Math.round(seoScoreVal * 100) : null;
  const scoreAccessibility = typeof accScoreVal === "number" ? Math.round(accScoreVal * 100) : null;
  const scoreBestPractices = typeof bpScoreVal === "number" ? Math.round(bpScoreVal * 100) : null;

  const lcpVal = lighthouse?.audits?.["largest-contentful-paint"]?.numericValue;
  const lcpSeconds = typeof lcpVal === "number" ? parseFloat((lcpVal / 1000).toFixed(2)) : null;

  const clsVal = lighthouse?.audits?.["cumulative-layout-shift"]?.numericValue;
  const clsScore = typeof clsVal === "number" ? parseFloat(clsVal.toFixed(3)) : null;

  const inpVal = lighthouse?.audits?.["interaction-to-next-paint"]?.numericValue ??
                 lighthouse?.audits?.["total-blocking-time"]?.numericValue;
  const inpMilliseconds = typeof inpVal === "number" ? Math.round(inpVal) : null;

  return {
    scorePerformance,
    scoreSeoGoogle,
    scoreAccessibility,
    scoreBestPractices,
    lcpSeconds,
    clsScore,
    inpMilliseconds,
  };
}

// Site-wide Duplicate Content and Sitemap/Robots checks
async function checkSiteWideIssues(pages: CrawledPage[], baseUrl: string): Promise<AuditResults["issues"]> {
  const siteWideIssues: AuditResults["issues"] = [];
  
  // 1. Duplicate Content Check (titles and meta descriptions)
  const titleGroups: Record<string, string[]> = {};
  const descGroups: Record<string, string[]> = {};
  
  for (const p of pages) {
    const title = p.title?.trim().toLowerCase();
    if (title) {
      if (!titleGroups[title]) titleGroups[title] = [];
      titleGroups[title].push(p.url);
    }
    
    const desc = p.metaDescription?.trim().toLowerCase();
    if (desc) {
      if (!descGroups[desc]) descGroups[desc] = [];
      descGroups[desc].push(p.url);
    }
  }

  for (const [title, urls] of Object.entries(titleGroups)) {
    if (urls.length > 1) {
      siteWideIssues.push({
        type: "duplicate_content",
        targetUrl: baseUrl,
        currentValue: { field: "title", value: title, urls },
        suggestedValue: { action: `Duplicate titles found for urls: ${urls.join(", ")}. Provide unique SEO titles for each page.` }
      });
    }
  }

  for (const [desc, urls] of Object.entries(descGroups)) {
    if (urls.length > 1) {
      siteWideIssues.push({
        type: "duplicate_content",
        targetUrl: baseUrl,
        currentValue: { field: "meta_description", value: desc, urls },
        suggestedValue: { action: `Duplicate meta descriptions found for urls: ${urls.join(", ")}. Provide unique meta descriptions for each page.` }
      });
    }
  }

  // 2. Robots.txt and Sitemap.xml Check
  const robotsUrl = `${baseUrl.replace(/\/$/, "")}/robots.txt`;
  const sitemapUrl = `${baseUrl.replace(/\/$/, "")}/sitemap.xml`;
  
  // Check robots.txt
  if (await isSafeUrlToFetch(robotsUrl)) {
    try {
      const res = await fetch(robotsUrl, {
        method: "GET",
        headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
        signal: AbortSignal.timeout(5500)
      });
      const text = res.ok ? await res.text() : "";
      if (!res.ok || !text.trim()) {
        siteWideIssues.push({
          type: "robots_sitemap",
          targetUrl: baseUrl,
          currentValue: { path: "/robots.txt", statusCode: res.status, empty: !text.trim() },
          suggestedValue: { action: `Create a valid robots.txt file at ${robotsUrl} to guide search engine crawlers.` }
        });
      }
    } catch {
      siteWideIssues.push({
        type: "robots_sitemap",
        targetUrl: baseUrl,
        currentValue: { path: "/robots.txt", error: "network_error" },
        suggestedValue: { action: `Create a valid robots.txt file at ${robotsUrl} to guide search engine crawlers.` }
      });
    }
  }
  
  // Check sitemap.xml
  if (await isSafeUrlToFetch(sitemapUrl)) {
    try {
      const res = await fetch(sitemapUrl, {
        method: "GET",
        headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
        signal: AbortSignal.timeout(5500)
      });
      if (!res.ok) {
        siteWideIssues.push({
          type: "robots_sitemap",
          targetUrl: baseUrl,
          currentValue: { path: "/sitemap.xml", statusCode: res.status },
          suggestedValue: { action: `Create a valid sitemap.xml file at ${sitemapUrl} to help search engines index your pages.` }
        });
      }
    } catch {
      siteWideIssues.push({
        type: "robots_sitemap",
        targetUrl: baseUrl,
        currentValue: { path: "/sitemap.xml", error: "network_error" },
        suggestedValue: { action: `Create a valid sitemap.xml file at ${sitemapUrl} to help search engines index your pages.` }
      });
    }
  }

  return siteWideIssues;
}

export async function runSeoAudits(pages: CrawledPage[], seedUrl: string): Promise<AuditResults> {
  const issues: AuditResults["issues"] = [];
  
  let totalSeoChecks = 0;
  let passedSeoChecks = 0;

  // 1. Meta Tag, Schema, Heading, Canonical & Social Tag Audits
  for (const page of pages) {
    const $ = cheerio.load(page.rawHtml);

    // Title checks
    totalSeoChecks++;
    if (!page.title) {
      issues.push({
        type: "meta_title",
        targetUrl: page.url,
        currentValue: { title: "", length: 0 },
        suggestedValue: { action: "Generate missing SEO title" }
      });
    } else {
      const len = page.title.length;
      if (len < 30 || len > 65) {
        issues.push({
          type: "meta_title",
          targetUrl: page.url,
          currentValue: { title: page.title, length: len },
          suggestedValue: { action: "Optimize title length (recommend 30-65 chars)" }
        });
      } else {
        passedSeoChecks++;
      }
    }

    // Description checks
    totalSeoChecks++;
    if (!page.metaDescription) {
      issues.push({
        type: "meta_description",
        targetUrl: page.url,
        currentValue: { description: "", length: 0 },
        suggestedValue: { action: "Generate missing SEO description" }
      });
    } else {
      const len = page.metaDescription.length;
      if (len < 120 || len > 160) {
        issues.push({
          type: "meta_description",
          targetUrl: page.url,
          currentValue: { description: page.metaDescription, length: len },
          suggestedValue: { action: "Optimize description length (recommend 120-160 chars)" }
        });
      } else {
        passedSeoChecks++;
      }
    }

    // Image alt tag checks
    const missingAltImages = page.images.filter(img => !img.alt);
    if (missingAltImages.length > 0) {
      totalSeoChecks += missingAltImages.length;
      issues.push({
        type: "missing_alt",
        targetUrl: page.url,
        currentValue: { count: missingAltImages.length, images: missingAltImages.map(img => img.src) },
        suggestedValue: { action: "Generate semantic alt text descriptions for missing images" }
      });
    }

    // Schema checks (JSON-LD)
    totalSeoChecks++;
    if (page.schemas.length === 0) {
      issues.push({
        type: "schema_markup",
        targetUrl: page.url,
        currentValue: { schemaPresent: false },
        suggestedValue: { action: "Generate appropriate LocalBusiness or Article Schema JSON-LD" }
      });
    } else {
      passedSeoChecks++;
    }

    // Heading structure checks
    const h1s = page.headings.filter(h => h.level === "h1");
    let prevLevel = 0;
    let hasSkipped = false;
    let skippedDetails = "";
    for (const h of page.headings) {
      const levelNum = parseInt(h.level.replace("h", ""), 10);
      if (isNaN(levelNum)) continue;
      if (prevLevel > 0 && levelNum > prevLevel + 1) {
        hasSkipped = true;
        skippedDetails = `Heading level skipped: H${prevLevel} directly followed by H${levelNum}.`;
        break;
      }
      prevLevel = levelNum;
    }
    
    let headingIssueMsg = "";
    if (h1s.length === 0) {
      headingIssueMsg = "Missing H1 tag entirely.";
    } else if (h1s.length > 1) {
      headingIssueMsg = `Page has ${h1s.length} H1 tags; should have exactly 1.`;
    } else if (hasSkipped) {
      headingIssueMsg = skippedDetails;
    }
    
    totalSeoChecks++;
    if (headingIssueMsg) {
      issues.push({
        type: "heading_structure",
        targetUrl: page.url,
        currentValue: { h1Count: h1s.length, skippedDetails: hasSkipped ? skippedDetails : null },
        suggestedValue: { action: headingIssueMsg }
      });
    } else {
      passedSeoChecks++;
    }

    // Canonical tag checks
    totalSeoChecks++;
    const canonicalHref = $('link[rel="canonical"]').attr("href")?.trim();
    
    if (!canonicalHref) {
      issues.push({
        type: "canonical_tag",
        targetUrl: page.url,
        currentValue: { canonical: null },
        suggestedValue: { action: `Add a self-referencing canonical link: <link rel="canonical" href="${page.url}" />` }
      });
    } else {
      let isMismatch = false;
      try {
        const cleanPageUrl = new URL(page.url);
        const cleanCanonicalUrl = new URL(canonicalHref, page.url);
        if (cleanCanonicalUrl.toString() !== cleanPageUrl.toString()) {
          isMismatch = true;
        }
      } catch {
        isMismatch = true;
      }
      
      if (isMismatch) {
        issues.push({
          type: "canonical_tag",
          targetUrl: page.url,
          currentValue: { canonical: canonicalHref },
          suggestedValue: { action: `Fix mismatched canonical tag. Expected self-referencing canonical: ${page.url}` }
        });
      } else {
        passedSeoChecks++;
      }
    }

    // Social meta checks
    totalSeoChecks++;
    const ogTitle = $('meta[property="og:title"]').attr("content") || $('meta[name="og:title"]').attr("content");
    const ogDesc = $('meta[property="og:description"]').attr("content") || $('meta[name="og:description"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content") || $('meta[name="og:image"]').attr("content");
    const twitterCard = $('meta[property="twitter:card"]').attr("content") || $('meta[name="twitter:card"]').attr("content");
    
    const missingTags = [];
    if (!ogTitle) missingTags.push("og:title");
    if (!ogDesc) missingTags.push("og:description");
    if (!ogImage) missingTags.push("og:image");
    if (!twitterCard) missingTags.push("twitter:card");
    
    if (missingTags.length > 0) {
      issues.push({
        type: "social_meta",
        targetUrl: page.url,
        currentValue: { missingTags },
        suggestedValue: { action: `Add missing social meta tags: ${missingTags.join(", ")}` }
      });
    } else {
      passedSeoChecks++;
    }

    // Insecure link checks
    if (page.url.startsWith("https://")) {
      const insecureLinks = page.internalLinks.filter(link => link.startsWith("http://"));
      if (insecureLinks.length > 0) {
        totalSeoChecks++;
        issues.push({
          type: "insecure_link",
          targetUrl: page.url,
          currentValue: { insecureLinks },
          suggestedValue: { action: `Upgrade insecure HTTP internal links to HTTPS: ${insecureLinks.join(", ")}` }
        });
      }
    }
  }

  // 2. Broken Link Checker
  const allLinks = new Set<string>();
  for (const page of pages) {
    page.externalLinks.forEach(link => allLinks.add(link));
    page.internalLinks.forEach(link => allLinks.add(link));
  }

  const linkList = Array.from(allLinks).slice(0, 30); // limit to first 30 unique links for V1 to be safe
  const brokenLinks: string[] = [];

  if (linkList.length > 0) {
    const linkCheckResults = await Promise.all(
      linkList.map(link => checkLink(link))
    );
    
    for (const res of linkCheckResults) {
      totalSeoChecks++;
      if (res.isBroken) {
        brokenLinks.push(res.url);
        const affectedPages = pages
          .filter(p => p.internalLinks.includes(res.url) || p.externalLinks.includes(res.url))
          .map(p => p.url);

        issues.push({
          type: "broken_link",
          targetUrl: affectedPages[0] || seedUrl,
          currentValue: { brokenUrl: res.url, statusCode: res.statusCode || "timeout/network_error" },
          suggestedValue: { action: `Remove or update broken link reference to ${res.url}` }
        });
      } else {
        passedSeoChecks++;
      }
    }
  }

  // 3. Oversized Image Detection
  const allImages = new Set<string>();
  for (const page of pages) {
    for (const img of page.images) {
      if (img.src) {
        try {
          const absImgUrl = new URL(img.src, page.url).toString();
          allImages.add(absImgUrl);
        } catch {}
      }
    }
  }

  const uniqueImages = Array.from(allImages).slice(0, 20);
  const IMAGE_WEIGHT_THRESHOLD_KB = 300;
  
  if (uniqueImages.length > 0) {
    const imageSizeChecks = await Promise.all(
      uniqueImages.map(async (imgUrl) => {
        if (!(await isSafeUrlToFetch(imgUrl))) return null;
        try {
          const res = await fetch(imgUrl, {
            method: "HEAD",
            headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
            signal: AbortSignal.timeout(3000),
          });
          const contentLength = res.headers.get("content-length");
          if (contentLength) {
            const bytes = parseInt(contentLength, 10);
            if (!isNaN(bytes)) {
              const kb = bytes / 1024;
              if (kb > IMAGE_WEIGHT_THRESHOLD_KB) {
                return { url: imgUrl, sizeKb: Math.round(kb) };
              }
            }
          }
        } catch {}
        return null;
      })
    );

    for (const sizeCheck of imageSizeChecks) {
      if (sizeCheck) {
        totalSeoChecks++;
        const affectedPages = pages
          .filter(p => p.images.some(img => {
            try {
              return new URL(img.src, p.url).toString() === sizeCheck.url;
            } catch {
              return false;
            }
          }))
          .map(p => p.url);

        issues.push({
          type: "image_weight",
          targetUrl: affectedPages[0] || seedUrl,
          currentValue: { imageUrl: sizeCheck.url, sizeKb: sizeCheck.sizeKb },
          suggestedValue: { action: `Compress this image to be under ${IMAGE_WEIGHT_THRESHOLD_KB}KB (current size: ${sizeCheck.sizeKb}KB).` }
        });
      }
    }
  }

  // 4. Site-wide checks (Duplicate Content & Robots/Sitemap existence)
  const siteWideIssues = await checkSiteWideIssues(pages, seedUrl);
  for (const swIssue of siteWideIssues) {
    totalSeoChecks++;
    issues.push(swIssue);
  }

  // SEO Score calculation (percentage of passed audits)
  const scoreSeo = totalSeoChecks > 0 ? Math.round((passedSeoChecks / totalSeoChecks) * 100) : 100;

  return {
    scoreSeo,
    issues,
  };
}
