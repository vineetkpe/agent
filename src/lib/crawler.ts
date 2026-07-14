import * as cheerio from "cheerio";

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
}

export async function crawlSite(startUrl: string, maxPages = 15): Promise<CrawledPage[]> {
  const crawled: Map<string, CrawledPage> = new Map();
  const queue: string[] = [];
  
  // Normalize and validate starting URL
  let parsedStartUrl: URL;
  try {
    parsedStartUrl = new URL(startUrl);
  } catch {
    throw new Error("Invalid start URL provided to crawler.");
  }
  
  const origin = parsedStartUrl.origin;
  const hostname = parsedStartUrl.hostname;
  
  queue.push(parsedStartUrl.toString());

  while (queue.length > 0 && crawled.size < maxPages) {
    const currentUrl = queue.shift()!;
    
    // Normalize URL for deduplication (strip hash)
    const normalizedUrl = new URL(currentUrl);
    normalizedUrl.hash = "";
    const cleanUrlStr = normalizedUrl.toString();

    if (crawled.has(cleanUrlStr)) {
      continue;
    }

    try {
      console.log(`[Crawler] Fetching: ${cleanUrlStr}`);
      const response = await fetch(cleanUrlStr, {
        headers: {
          "User-Agent": "AI-Website-Growth-Agent/1.0 (SEO Audit)",
        },
        signal: AbortSignal.timeout(8000), // 8s timeout
      });

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        console.log(`[Crawler] Skipping non-HTML resource: ${cleanUrlStr} (${contentType})`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract SEO tags
      const title = $("title").text().trim() || "";
      const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";

      // Extract headings
      const headings: { level: string; text: string }[] = [];
      $("h1, h2, h3, h4, h5, h6").each((_, el) => {
        headings.push({
          level: el.name.toLowerCase(),
          text: $(el).text().trim(),
        });
      });

      // Extract images
      const images: { src: string; alt: string }[] = [];
      $("img").each((_, el) => {
        const src = $(el).attr("src") || "";
        const alt = $(el).attr("alt")?.trim() || "";
        if (src) {
          images.push({ src, alt });
        }
      });

      // Extract JSON-LD schema
      const schemas: string[] = [];
      $('script[type="application/ld+json"]').each((_, el) => {
        const text = $(el).html()?.trim();
        if (text) {
          schemas.push(text);
        }
      });

      // Extract links
      const internalLinksSet: Set<string> = new Set();
      const externalLinksSet: Set<string> = new Set();

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href")?.trim();
        if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
          return;
        }

        try {
          const absoluteUrl = new URL(href, cleanUrlStr);
          
          // Check if internal
          if (absoluteUrl.hostname === hostname) {
            // Strip hash
            absoluteUrl.hash = "";
            const absStr = absoluteUrl.toString();
            internalLinksSet.add(absStr);
            
            // Queue if not already crawled
            if (!crawled.has(absStr) && !queue.includes(absStr)) {
              // Exclude static assets
              const pathname = absoluteUrl.pathname.toLowerCase();
              const isAsset = pathname.endsWith(".png") || pathname.endsWith(".jpg") || 
                              pathname.endsWith(".jpeg") || pathname.endsWith(".gif") || 
                              pathname.endsWith(".pdf") || pathname.endsWith(".zip") || 
                              pathname.endsWith(".css") || pathname.endsWith(".js") ||
                              pathname.endsWith(".xml");
              if (!isAsset) {
                queue.push(absStr);
              }
            }
          } else {
            externalLinksSet.add(absoluteUrl.toString());
          }
        } catch {
          // Invalid href format, skip
        }
      });

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
      });

    } catch (error) {
      console.error(`[Crawler] Failed to crawl ${cleanUrlStr}:`, error);
      // Still log as failed or skip
    }
  }

  return Array.from(crawled.values());
}
