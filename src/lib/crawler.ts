import * as cheerio from "cheerio";
import { isSafeUrlToFetch } from "./urlSafety";

export interface CrawledPage {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  images: { src: string; alt: string }[];
  internalLinks: string[];
  externalLinks: string[];
  schemas: string[]; // JSON-LD text content
  rawHtml: string;
  visibleText?: string;
  headers?: Record<string, string>;
  lastModifiedDate?: string;
}

export interface CrawlResult {
  pages: CrawledPage[];
  crawlerUsed: "cheerio" | "firecrawl";
  crawlerWarning?: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isThinContent(pages: CrawledPage[]): boolean {
  if (pages.length === 0) return true;

  let totalWords = 0;
  let hasRootDivOnly = false;

  for (const page of pages) {
    const words = countWords(page.visibleText || "");
    totalWords += words;

    const bodyMatch = page.rawHtml?.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1].replace(/<!--[\s\S]*?-->/g, "").trim();
      const cleanBody = bodyContent.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "").replace(/\s+/g, "").trim();
      if (
        cleanBody === '<divid="root"></div>' ||
        cleanBody === '<divid="app"></div>' ||
        cleanBody === '<divid="root"/>' ||
        cleanBody === '<divid="app"/>' ||
        cleanBody === ""
      ) {
        hasRootDivOnly = true;
      }
    }
  }

  const avgWords = totalWords / pages.length;
  console.log(`[Crawler Quality] Checked crawl quality: average words = ${avgWords}, SPA marker = ${hasRootDivOnly}`);

  return avgWords < 150 || hasRootDivOnly;
}

export async function crawlSite(startUrl: string, maxPages = 15): Promise<CrawlResult> {
  const crawled: Map<string, CrawledPage> = new Map();
  const queue: string[] = [];
  
  let parsedStartUrl: URL;
  try {
    parsedStartUrl = new URL(startUrl);
  } catch {
    throw new Error("Invalid start URL provided to crawler.");
  }
  
  const hostname = parsedStartUrl.hostname;
  
  if (!(await isSafeUrlToFetch(parsedStartUrl.toString()))) {
    console.log(`[Crawler] Skipping unsafe start URL: ${parsedStartUrl.toString()}`);
    return { pages: [], crawlerUsed: "cheerio" };
  }
  
  queue.push(parsedStartUrl.toString());

  while (queue.length > 0 && crawled.size < maxPages) {
    const currentUrl = queue.shift()!;
    const normalizedUrl = new URL(currentUrl);
    normalizedUrl.hash = "";
    const cleanUrlStr = normalizedUrl.toString();

    if (crawled.has(cleanUrlStr)) {
      continue;
    }

    if (!(await isSafeUrlToFetch(cleanUrlStr))) {
      console.log(`[Crawler] Skipping unsafe URL during crawl loop: ${cleanUrlStr}`);
      continue;
    }

    try {
      console.log(`[Crawler] Fetching: ${cleanUrlStr}`);
      const response = await fetch(cleanUrlStr, {
        headers: {
          "User-Agent": "AI-Website-Growth-Agent/1.0 (SEO Audit)",
        },
        signal: AbortSignal.timeout(8000),
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.log(`[Crawler] Skipping non-HTML resource: ${cleanUrlStr} (${contentType})`);
        continue;
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $("title").text().trim() || "";
      const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";

      const headings: { level: string; text: string }[] = [];
      $("h1, h2, h3, h4, h5, h6").each((_, el) => {
        headings.push({
          level: el.name.toLowerCase(),
          text: $(el).text().trim(),
        });
      });

      const images: { src: string; alt: string }[] = [];
      $("img").each((_, el) => {
        const src = $(el).attr("src") || "";
        const alt = $(el).attr("alt")?.trim() || "";
        if (src) {
          images.push({ src, alt });
        }
      });

      const schemas: string[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        const text = $(el).html()?.trim();
        if (text) {
          schemas.push(text);
        }
      });

      const internalLinksSet: Set<string> = new Set();
      const externalLinksSet: Set<string> = new Set();

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href")?.trim();
        if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
          return;
        }

        try {
          const absoluteUrl = new URL(href, cleanUrlStr);
          if (absoluteUrl.hostname === hostname) {
            absoluteUrl.hash = "";
            const absStr = absoluteUrl.toString();
            internalLinksSet.add(absStr);
            
            if (!crawled.has(absStr) && !queue.includes(absStr)) {
              const pathname = absoluteUrl.pathname.toLowerCase();
              const isAsset = pathname.endsWith(".png") || pathname.endsWith(".jpg") || 
                              pathname.endsWith(".jpeg") || pathname.endsWith(".gif") || 
                              pathname.endsWith(".pdf") || pathname.endsWith(".zip") || 
                              pathname.endsWith(".css") || pathname.endsWith(".js") ||
                              pathname.endsWith(".xml");
              
              if (!isAsset && queue.length < maxPages * 10) {
                queue.push(absStr);
              }
            }
          } else {
            externalLinksSet.add(absoluteUrl.toString());
          }
        } catch {}
      });

      const textClone = cheerio.load(html);
      textClone("script, style, iframe, noscript, svg").remove();
      const visibleText = textClone("body").text().replace(/\s+/g, " ").trim().slice(0, 1200);

      // Extract Last-Modified date
      let lastModifiedDate: string | undefined = undefined;
      const lmHeader = response.headers.get("last-modified");
      if (lmHeader) {
        const parsed = Date.parse(lmHeader);
        if (!isNaN(parsed)) {
          lastModifiedDate = new Date(parsed).toISOString();
        }
      }

      if (!lastModifiedDate) {
        const metaMod = $('meta[property="article:modified_time"]').attr("content") ||
                        $('meta[property="og:updated_time"]').attr("content") ||
                        $('meta[name="revised"]').attr("content");
        if (metaMod) {
          const parsed = Date.parse(metaMod);
          if (!isNaN(parsed)) {
            lastModifiedDate = new Date(parsed).toISOString();
          }
        }
      }

      if (!lastModifiedDate) {
        const bodyText = textClone("body").text();
        const dateRegexes = [
          /last\s+updated\s+(?:on\s+)?([a-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
          /updated\s+(?:on\s+)?([a-z]+\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/i
        ];
        for (const regex of dateRegexes) {
          const match = bodyText.match(regex);
          if (match && match[1]) {
            const parsed = Date.parse(match[1]);
            if (!isNaN(parsed)) {
              lastModifiedDate = new Date(parsed).toISOString();
              break;
            }
          }
        }
      }

      crawled.set(cleanUrlStr, {
        url: cleanUrlStr,
        title,
        metaDescription,
        headings,
        images,
        internalLinks: Array.from(internalLinksSet),
        externalLinks: Array.from(externalLinksSet),
        schemas,
        rawHtml: html,
        visibleText,
        headers,
        lastModifiedDate,
      });

    } catch (error) {
      console.error(`[Crawler] Failed to crawl ${cleanUrlStr}:`, error);
    }
  }

  const cheerioPages = Array.from(crawled.values());

  if (isThinContent(cheerioPages)) {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlApiKey && firecrawlApiKey !== "mock-firecrawl-key") {
      console.log(`[Crawler] Thin content detected (${cheerioPages.length} pages). Retrying with Firecrawl JS rendering...`);
      try {
        const { crawlWithFirecrawl, parseFirecrawlPage } = await import("./firecrawlProvider");
        const firecrawlPages = await crawlWithFirecrawl(startUrl, maxPages);
        const parsedPages = firecrawlPages.map(p => parseFirecrawlPage(p));
        return {
          pages: parsedPages,
          crawlerUsed: "firecrawl"
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Crawler] Firecrawl fallback failed: ${errorMsg}`);
        return {
          pages: cheerioPages,
          crawlerUsed: "cheerio",
          crawlerWarning: "This site may use JavaScript rendering. Fallback retry failed: " + errorMsg
        };
      }
    } else {
      console.log(`[Crawler] Thin content detected, but FIRECRAWL_API_KEY is not set. Skipping fallback.`);
      return {
        pages: cheerioPages,
        crawlerUsed: "cheerio",
        crawlerWarning: "This site may use JavaScript rendering that our scanner can't fully read yet -- results may be incomplete."
      };
    }
  }

  return {
    pages: cheerioPages,
    crawlerUsed: "cheerio"
  };
}
