import { CrawledPage, CrawlResult } from "./crawler";
import { isSafeUrlToFetch } from "./urlSafety";
import * as cheerio from "cheerio";
import crypto from "crypto";

export interface AuditResults {
  scoreSeo: number;
  issues: {
    type: "meta_title" | "meta_description" | "broken_link" | "missing_alt" | "schema_markup" | "heading_structure" | "canonical_tag" | "social_meta" | "insecure_link" | "duplicate_content" | "robots_sitemap" | "image_weight" | "redirect_chain" | "indexability_issue" | "duplicate_image" | "stale_content" | "mobile_viewport_missing" | "hreflang_missing" | "orphan_page" | "missing_security_headers" | "js_rendering_risk" | "generic_anchor_text" | "keyword_stuffing" | "keyword_cannibalization";
    targetUrl: string;
    currentValue: unknown;
    suggestedValue: unknown;
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
  } catch {
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

export async function runSeoAudits(
  pagesOrResult: CrawledPage[] | CrawlResult,
  seedUrl: string,
  crawlerUsed?: "cheerio" | "firecrawl"
): Promise<AuditResults> {
  const pages: CrawledPage[] = Array.isArray(pagesOrResult) ? pagesOrResult : (pagesOrResult?.pages || []);
  const crawlType = Array.isArray(pagesOrResult) ? (crawlerUsed || "cheerio") : (pagesOrResult?.crawlerUsed || crawlerUsed || "cheerio");

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

  // 5. Redirect Chain Check
  const internalLinks = new Set<string>();
  for (const page of pages) {
    page.internalLinks.forEach(link => {
      try {
        const absUrl = new URL(link, page.url).toString();
        if (new URL(absUrl).hostname === new URL(seedUrl).hostname) {
          internalLinks.add(absUrl);
        }
      } catch {}
    });
  }

  const uniqueLinksList = Array.from(internalLinks).slice(0, 20);
  for (const link of uniqueLinksList) {
    const trace = await traceRedirects(link);
    if (trace.chain.length > 3 || trace.isLoop) {
      totalSeoChecks++;
      issues.push({
        type: "redirect_chain",
        targetUrl: link,
        currentValue: { chain: trace.chain, hops: trace.chain.length - 1, isLoop: trace.isLoop },
        suggestedValue: {
          action: trace.isLoop 
            ? `Fix redirect loop detected at ${link}: ${trace.chain.join(" -> ")}`
            : `Flatten redirect chain for ${link} (currently ${trace.chain.length - 1} hops): ${trace.chain.join(" -> ")}`
        }
      });
    }
  }

  // 6. Indexability checks
  const disallowedPaths = await getRobotsDisallowedPaths(seedUrl);
  for (const page of pages) {
    const isDisallowed = isPathDisallowed(page.url, disallowedPaths);
    
    let isNoindexMeta = false;
    try {
      const $ = cheerio.load(page.rawHtml);
      const robotsMeta = $('meta[name="robots"]').attr("content")?.toLowerCase() || "";
      isNoindexMeta = robotsMeta.includes("noindex");
    } catch {}

    const xRobots = page.headers?.["x-robots-tag"]?.toLowerCase() || "";
    const isNoindexHeader = xRobots.includes("noindex");

    if (isNoindexMeta || isNoindexHeader) {
      totalSeoChecks++;
      if (isDisallowed) {
        // Intentionally excluded
      } else {
        issues.push({
          type: "indexability_issue",
          targetUrl: page.url,
          currentValue: { noindexMeta: isNoindexMeta, noindexHeader: isNoindexHeader, disallowed: isDisallowed },
          suggestedValue: {
            action: `Remove 'noindex' directive from ${page.url} to allow Google indexing. Accidental noindex directives completely block pages from organic search.`
          }
        });
      }
    }
  }

  // 7. Duplicate Images Check via file content hashing
  // NOTE: AI/relevance-based image visual analysis is intentionally skipped in this round to avoid high vision model API costs. Flagged as a future enhancement.
  try {
    const imageUrlMap = new Map<string, string[]>();
    for (const page of pages) {
      const images = page.images || [];
      for (const img of images) {
        if (!img.src) continue;
        try {
          const absUrl = new URL(img.src, page.url).toString();
          const list = imageUrlMap.get(absUrl) || [];
          if (!list.includes(page.url)) {
            list.push(page.url);
            imageUrlMap.set(absUrl, list);
          }
        } catch {}
      }
    }

    const uniqueImageUrls = Array.from(imageUrlMap.keys()).slice(0, 15);
    const hashes: Record<string, string[]> = {};

    const imageHashResults = await Promise.all(
      uniqueImageUrls.map(async (url) => {
        if (!(await isSafeUrlToFetch(url))) return null;
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
          if (!res.ok) return null;
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const md5Hash = crypto.createHash("md5").update(buffer).digest("hex");
          return { url, hash: md5Hash };
        } catch {
          return null;
        }
      })
    );

    for (const res of imageHashResults) {
      if (res && res.hash) {
        if (!hashes[res.hash]) hashes[res.hash] = [];
        hashes[res.hash].push(res.url);
      }
    }

    for (const [hash, urls] of Object.entries(hashes)) {
      if (urls.length > 1) {
        totalSeoChecks++;
        const targetUrl = imageUrlMap.get(urls[0])?.[0] || seedUrl;
        issues.push({
          type: "duplicate_image",
          targetUrl,
          currentValue: { hash, imageUrls: urls },
          suggestedValue: {
            action: `Exact duplicate image files detected under different paths: ${urls.map(u => u.replace(/^https?:\/\/(www\.)?/i, "").substring(0, 30)).join(", ")}. Consolidate image files or use unique content to improve uniqueness signals.`
          }
        });
      }
    }
  } catch (err) {
    console.error("[SEO Checks] Duplicate image check error:", err);
  }

  // 8. Content Freshness / Staleness Checks
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    for (const page of pages) {
      if (page.lastModifiedDate) {
        const parsed = Date.parse(page.lastModifiedDate);
        if (!isNaN(parsed)) {
          const modDate = new Date(parsed);
          if (modDate < twelveMonthsAgo) {
            totalSeoChecks++;
            issues.push({
              type: "stale_content",
              targetUrl: page.url,
              currentValue: { lastModified: page.lastModifiedDate },
              suggestedValue: {
                action: `Content is older than 12 months (last updated: ${modDate.toLocaleDateString()}). Review, update, or expand this content to maintain high search ranking freshness signals.`
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[SEO Checks] Freshness check error:", err);
  }

  // Mobile viewport checks
  for (const page of pages) {
    totalSeoChecks++;
    const vpIssues = checkMobileFriendliness(page);
    if (vpIssues.length > 0) {
      issues.push(...vpIssues);
    } else {
      passedSeoChecks++;
    }
  }

  // Hreflang checks
  totalSeoChecks++;
  const hreflangIssues = checkHreflang(pages, seedUrl);
  if (hreflangIssues.length > 0) {
    issues.push(...hreflangIssues);
  } else {
    passedSeoChecks++;
  }

  // Orphan page checks
  const orphanIssues = checkOrphanPages(pages, seedUrl);
  const orphanUrls = new Set(orphanIssues.map(i => normalizeUrl(i.targetUrl)));
  const normalizedSeed = normalizeUrl(seedUrl);
  for (const page of pages) {
    let isHomepage = false;
    try {
      const parsed = new URL(page.url);
      if (parsed.pathname === "/" || parsed.pathname === "") isHomepage = true;
    } catch {}
    if (normalizeUrl(page.url) === normalizedSeed) isHomepage = true;
    if (isHomepage) continue;

    totalSeoChecks++;
    if (orphanUrls.has(normalizeUrl(page.url))) {
      // Failed
    } else {
      passedSeoChecks++;
    }
  }
  issues.push(...orphanIssues);

  // Security headers checks
  totalSeoChecks++;
  const securityIssues = await checkSecurityHeaders(seedUrl, pages.find(p => normalizeUrl(p.url) === normalizedSeed));
  if (securityIssues.length > 0) {
    issues.push(...securityIssues);
  } else {
    passedSeoChecks++;
  }

  // JS rendering risk checks
  totalSeoChecks++;
  const jsIssues = await checkJsRenderingRisk(pages, crawlType, seedUrl);
  if (jsIssues.length > 0) {
    issues.push(...jsIssues);
  } else {
    passedSeoChecks++;
  }

  // Anchor text quality checks
  const anchorIssues = checkAnchorTextQuality(pages);
  const anchorUrls = new Set(anchorIssues.map(i => normalizeUrl(i.targetUrl)));
  for (const page of pages) {
    totalSeoChecks++;
    if (anchorUrls.has(normalizeUrl(page.url))) {
      // Failed
    } else {
      passedSeoChecks++;
    }
  }
  issues.push(...anchorIssues);

  // SEO Score calculation (percentage of passed audits)
  const scoreSeo = totalSeoChecks > 0 ? Math.round((passedSeoChecks / totalSeoChecks) * 100) : 100;

  return {
    scoreSeo,
    issues,
  };
}

// ==========================================
// NEW TECH-2 & LINKS-1 HELPER FUNCTIONS
// ==========================================

function normalizeUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return urlStr.replace(/\/$/, "");
  }
}

export function checkMobileFriendliness(page: CrawledPage): AuditResults["issues"] {
  const issues: AuditResults["issues"] = [];
  const $ = cheerio.load(page.rawHtml);
  const viewport = $('meta[name="viewport"]').attr("content");
  if (!viewport || !viewport.toLowerCase().includes("width=device-width")) {
    issues.push({
      type: "mobile_viewport_missing",
      targetUrl: page.url,
      currentValue: { viewport: viewport || null },
      suggestedValue: { action: "Add a viewport meta tag <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> to optimize for mobile devices." }
    });
  }
  return issues;
}

export function checkHreflang(pages: CrawledPage[], seedUrl: string): AuditResults["issues"] {
  const issues: AuditResults["issues"] = [];
  let hasHreflang = false;
  const htmlLangs = new Set<string>();
  const urlLangPatterns = new Set<string>();

  const langRegex = /\/(en|es|fr|de|it|pt|zh|ja|ru|ko|nl|pl|sv|da|no|fi)\b/i;

  for (const page of pages) {
    const $ = cheerio.load(page.rawHtml);
    const hrefLangs = $('link[rel="alternate"][hreflang]');
    if (hrefLangs.length > 0) {
      hasHreflang = true;
    }
    const lang = $('html').attr('lang')?.toLowerCase().split('-')[0].trim();
    if (lang) {
      htmlLangs.add(lang);
    }
    
    const match = page.url.match(langRegex);
    if (match) {
      urlLangPatterns.add(match[1].toLowerCase());
    }
  }

  const isMultiLanguage = htmlLangs.size > 1 || urlLangPatterns.size > 1;

  if (isMultiLanguage && !hasHreflang && pages.length > 1) {
    issues.push({
      type: "hreflang_missing",
      targetUrl: seedUrl,
      currentValue: { htmlLangs: Array.from(htmlLangs), urlLangPatterns: Array.from(urlLangPatterns) },
      suggestedValue: { action: "Implement hreflang tags (e.g. <link rel=\"alternate\" hreflang=\"x\" href=\"...\" />) to guide search engines to the correct language version of each page." }
    });
  }
  return issues;
}

export function checkOrphanPages(pages: CrawledPage[], seedUrl: string): AuditResults["issues"] {
  const issues: AuditResults["issues"] = [];
  const normalizedSeed = normalizeUrl(seedUrl);
  
  const allInternalLinks = new Set<string>();
  for (const p of pages) {
    for (const link of p.internalLinks) {
      allInternalLinks.add(normalizeUrl(link));
    }
  }
  
  for (const page of pages) {
    const normUrl = normalizeUrl(page.url);
    
    let isHomepage = false;
    try {
      const parsed = new URL(page.url);
      if (parsed.pathname === "/" || parsed.pathname === "") {
        isHomepage = true;
      }
    } catch {}
    if (normUrl === normalizedSeed) {
      isHomepage = true;
    }
    
    if (isHomepage) continue;
    
    if (!allInternalLinks.has(normUrl)) {
      issues.push({
        type: "orphan_page",
        targetUrl: page.url,
        currentValue: { incomingLinksCount: 0 },
        suggestedValue: { action: `Orphan page detected: no other crawled page links to ${page.url}. Add internal links to this page from relevant content to help search engines discover and rank it.` }
      });
    }
  }
  return issues;
}

export async function checkSecurityHeaders(url: string, homepagePage?: CrawledPage): Promise<AuditResults["issues"]> {
  const issues: AuditResults["issues"] = [];
  let headers: Record<string, string> | undefined = homepagePage?.headers;

  if (!headers) {
    if (await isSafeUrlToFetch(url)) {
      try {
        const res = await fetch(url, {
          method: "HEAD",
          headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
          signal: AbortSignal.timeout(4000),
        });
        const tempHeaders: Record<string, string> = {};
        res.headers.forEach((value, key) => {
          tempHeaders[key.toLowerCase()] = value;
        });
        headers = tempHeaders;
      } catch {
        try {
          const res = await fetch(url, {
            method: "GET",
            headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
            signal: AbortSignal.timeout(4000),
          });
          const tempHeaders: Record<string, string> = {};
          res.headers.forEach((value, key) => {
            tempHeaders[key.toLowerCase()] = value;
          });
          headers = tempHeaders;
        } catch {}
      }
    }
  }

  if (headers) {
    const missing: string[] = [];
    if (!headers["strict-transport-security"]) missing.push("Strict-Transport-Security");
    if (!headers["x-content-type-options"]) missing.push("X-Content-Type-Options");
    if (!headers["x-frame-options"]) missing.push("X-Frame-Options");

    if (missing.length > 0) {
      issues.push({
        type: "missing_security_headers",
        targetUrl: url,
        currentValue: { missingHeaders: missing },
        suggestedValue: { action: `Missing security headers: ${missing.join(", ")}. Setting these headers is a search-safety trust signal that protects users and enhances search-adjacent domain trust.` }
      });
    }
  }
  return issues;
}

export async function checkJsRenderingRisk(
  pages: CrawledPage[],
  crawlerUsed: "cheerio" | "firecrawl",
  seedUrl: string
): Promise<AuditResults["issues"]> {
  const issues: AuditResults["issues"] = [];
  
  if (crawlerUsed === "firecrawl") {
    const targetPage = pages[0];
    if (targetPage && await isSafeUrlToFetch(targetPage.url)) {
      try {
        const res = await fetch(targetPage.url, {
          headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
          signal: AbortSignal.timeout(4000),
        });
        const rawHtml = await res.text();
        const $ = cheerio.load(rawHtml);
        $("script, style, iframe, noscript, svg").remove();
        const cheerioText = $("body").text().replace(/\s+/g, " ").trim();
        const cheerioWordCount = cheerioText.split(/\s+/).filter(Boolean).length;
        
        const renderedWordCount = (targetPage.visibleText || "").trim().split(/\s+/).filter(Boolean).length;
        const gap = renderedWordCount - cheerioWordCount;
        
        if (gap > 0 || cheerioWordCount < 100) {
          issues.push({
            type: "js_rendering_risk",
            targetUrl: targetPage.url,
            currentValue: {
              crawlerUsed,
              cheerioWordCount,
              renderedWordCount,
              gap
            },
            suggestedValue: {
              action: `JavaScript rendering risk detected. The page relies heavily on client-side JS. Raw HTML crawl found only ${cheerioWordCount} words, whereas JS-rendered crawl found ${renderedWordCount} words (a gap of ${gap} words). Ensure critical SEO content, meta tags, and links are present in the raw server-rendered HTML for search engine bots that do not execute JS immediately.`
            }
          });
        }
      } catch {
        issues.push({
          type: "js_rendering_risk",
          targetUrl: targetPage.url,
          currentValue: { crawlerUsed, error: "could_not_compare" },
          suggestedValue: { action: "JavaScript rendering risk detected. The site required Firecrawl (JS rendering) to extract content, meaning standard bots may see less content. Ensure critical SEO content is server-rendered." }
        });
      }
    }
  } else {
    const totalWords = pages.reduce((acc, p) => acc + (p.visibleText || "").trim().split(/\s+/).filter(Boolean).length, 0);
    const avgWords = pages.length > 0 ? totalWords / pages.length : 0;
    
    const hasSpaMarker = pages.some(p => {
      const bodyMatch = p.rawHtml?.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        const bodyContent = bodyMatch[1].replace(/<!--[\s\S]*?-->/g, "").trim();
        const cleanBody = bodyContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "").replace(/\s+/g, "").trim();
        return (
          cleanBody === '<divid="root"></div>' ||
          cleanBody === '<divid="app"></div>' ||
          cleanBody === '<divid="root"/>' ||
          cleanBody === '<divid="app"/>' ||
          cleanBody === ""
        );
      }
      return false;
    });

    if (avgWords < 150 || hasSpaMarker) {
      issues.push({
        type: "js_rendering_risk",
        targetUrl: seedUrl,
        currentValue: { crawlerUsed, avgWords, hasSpaMarker },
        suggestedValue: {
          action: "Potential JavaScript rendering risk. The crawler detected thin content or SPA root elements under standard crawling. Ensure that search engines can read the content without requiring full client-side JS rendering."
        }
      });
    }
  }

  return issues;
}

export function checkAnchorTextQuality(pages: CrawledPage[]): AuditResults["issues"] {
  const issues: AuditResults["issues"] = [];
  const genericPatterns = [
    "click here",
    "read more",
    "learn more",
    "this page",
    "go here",
    "link",
    "more",
    "here"
  ];
  
  const urlToTitleMap = new Map<string, string>();
  for (const p of pages) {
    urlToTitleMap.set(normalizeUrl(p.url), p.title);
  }
  
  for (const page of pages) {
    const $ = cheerio.load(page.rawHtml);
    const pageIssuesList: { anchorText: string; href: string; suggestion: string }[] = [];
    
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.trim();
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (!href) return;
      
      let absUrl: string;
      try {
        absUrl = new URL(href, page.url).toString();
      } catch {
        return;
      }
      
      const cleanHref = normalizeUrl(absUrl);
      try {
        const pageOrigin = new URL(page.url).origin;
        const linkOrigin = new URL(absUrl).origin;
        if (pageOrigin !== linkOrigin) return;
      } catch {
        return;
      }
      
      const lowerText = text.toLowerCase();
      const isBareUrl = lowerText.startsWith("http://") || lowerText.startsWith("https://") || lowerText.startsWith("www.");
      const isGeneric = genericPatterns.includes(lowerText) || isBareUrl || lowerText === "";
      
      if (isGeneric) {
        const destTitle = urlToTitleMap.get(cleanHref);
        let alternative = "descriptive keywords matching the destination page's topic";
        if (destTitle) {
          alternative = `"${destTitle}" or related keywords`;
        }
        pageIssuesList.push({
          anchorText: text || "(empty anchor text / bare URL)",
          href: absUrl,
          suggestion: `Change anchor text to be more descriptive, e.g., referencing ${alternative}.`
        });
      }
    });
    
    if (pageIssuesList.length > 0) {
      issues.push({
        type: "generic_anchor_text",
        targetUrl: page.url,
        currentValue: { occurrences: pageIssuesList },
        suggestedValue: {
          action: `Generic anchor text found on ${page.url}. Improve search optimization by updating links (e.g. ${pageIssuesList.map(o => `"${o.anchorText}" -> ${o.href}`).slice(0, 3).join(", ")}) to use descriptive, keyword-rich anchor text referencing the destination page titles.`
        }
      });
    }
  }
  return issues;
}

async function traceRedirects(initialUrl: string): Promise<{ chain: string[]; isLoop: boolean }> {
  const chain: string[] = [initialUrl];
  let currentUrl = initialUrl;
  
  for (let hop = 0; hop < 5; hop++) {
    if (!(await isSafeUrlToFetch(currentUrl))) {
      break;
    }
    try {
      const res = await fetch(currentUrl, {
        method: "HEAD",
        redirect: "manual",
        headers: { "User-Agent": "AI-Website-Growth-Agent/1.0" },
        signal: AbortSignal.timeout(3000),
      });
      
      if ([301, 302, 307, 308].includes(res.status)) {
        const loc = res.headers.get("location");
        if (!loc) break;
        const nextUrl = new URL(loc, currentUrl).toString();
        if (chain.includes(nextUrl)) {
          chain.push(nextUrl);
          return { chain, isLoop: true };
        }
        chain.push(nextUrl);
        currentUrl = nextUrl;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return { chain, isLoop: false };
}

async function getRobotsDisallowedPaths(baseUrl: string): Promise<string[]> {
  const robotsUrl = `${baseUrl.replace(/\/$/, "")}/robots.txt`;
  if (!(await isSafeUrlToFetch(robotsUrl))) return [];
  try {
    const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = await res.text();
      const lines = text.split("\n");
      const disallowed: string[] = [];
      let isUserAgentWildcard = false;
      for (const line of lines) {
        const clean = line.trim().toLowerCase();
        if (clean.startsWith("user-agent:")) {
          const ua = clean.split(":")[1]?.trim();
          isUserAgentWildcard = (ua === "*");
        } else if (clean.startsWith("disallow:") && isUserAgentWildcard) {
          const path = clean.split(":")[1]?.trim();
          if (path) disallowed.push(path);
        }
      }
      return disallowed;
    }
  } catch {}
  return [];
}

function isPathDisallowed(url: string, disallowedPaths: string[]): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return disallowedPaths.some(p => {
      const rule = p.replace(/\*/g, ".*");
      return new RegExp("^" + rule).test(path);
    });
  } catch {
    return false;
  }
}

export function getPriorityScoring(type: string): { priority: "critical" | "high" | "medium" | "low"; impactScore: number; difficultyScore: number } {
  const PRIORITY_MAP: Record<string, { priority: "critical" | "high" | "medium" | "low"; impact: number; difficulty: number }> = {
    indexability_issue: { priority: "critical", impact: 10, difficulty: 2 },
    broken_link: { priority: "critical", impact: 9, difficulty: 3 },
    robots_sitemap: { priority: "high", impact: 8, difficulty: 2 },
    meta_title: { priority: "high", impact: 8, difficulty: 2 },
    meta_description: { priority: "medium", impact: 6, difficulty: 2 },
    heading_structure: { priority: "medium", impact: 5, difficulty: 3 },
    canonical_tag: { priority: "medium", impact: 7, difficulty: 2 },
    social_meta: { priority: "low", impact: 3, difficulty: 2 },
    insecure_link: { priority: "medium", impact: 6, difficulty: 3 },
    duplicate_content: { priority: "high", impact: 8, difficulty: 5 },
    image_weight: { priority: "low", impact: 4, difficulty: 2 },
    redirect_chain: { priority: "medium", impact: 6, difficulty: 3 },
    blog_post: { priority: "high", impact: 8, difficulty: 7 },
    duplicate_image: { priority: "low", impact: 4, difficulty: 3 },
    stale_content: { priority: "medium", impact: 6, difficulty: 4 },
    mobile_viewport_missing: { priority: "high", impact: 8, difficulty: 2 },
    hreflang_missing: { priority: "medium", impact: 6, difficulty: 3 },
    orphan_page: { priority: "medium", impact: 7, difficulty: 3 },
    missing_security_headers: { priority: "low", impact: 4, difficulty: 2 },
    js_rendering_risk: { priority: "high", impact: 8, difficulty: 5 },
    generic_anchor_text: { priority: "medium", impact: 5, difficulty: 3 },
    keyword_stuffing: { priority: "high", impact: 8, difficulty: 3 },
    keyword_cannibalization: { priority: "high", impact: 7, difficulty: 4 },
    keyword_opportunity: { priority: "high", impact: 8, difficulty: 4 },
  };
  const match = PRIORITY_MAP[type] || { priority: "low", impact: 1, difficulty: 1 };
  return {
    priority: match.priority,
    impactScore: match.impact,
    difficultyScore: match.difficulty
  };
}

export function getRiskLevel(type: string): "low" | "high" {
  const RISK_MAP: Record<string, "low" | "high"> = {
    meta_title: "low",
    meta_description: "low",
    missing_alt: "low",
    schema_markup: "low",
    broken_link: "low",
    image_weight: "low",
    canonical_tag: "low",
    social_meta: "low",
    robots_sitemap: "low",
    redirect_chain: "low",
    indexability_issue: "low",
    duplicate_image: "low",
    mobile_viewport_missing: "low",
    hreflang_missing: "low",
    missing_security_headers: "low",
    orphan_page: "low",
    
    blog_post: "high",
    heading_structure: "high",
    duplicate_content: "high",
    stale_content: "high",
    keyword_stuffing: "high",
    keyword_cannibalization: "high",
    generic_anchor_text: "high",
    insecure_link: "high",
    js_rendering_risk: "high",
  };
  return RISK_MAP[type] || "high";
}
