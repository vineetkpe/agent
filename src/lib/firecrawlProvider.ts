import * as cheerio from "cheerio";
import { CrawledPage } from "./crawler";

export async function crawlWithFirecrawl(url: string, limit = 10): Promise<any[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey || apiKey === "mock-firecrawl-key") {
    throw new Error("FIRECRAWL_API_KEY is not configured.");
  }

  console.log(`[Firecrawl] Submitting crawl job for URL: ${url}`);
  const response = await fetch("https://api.firecrawl.dev/v1/crawl", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      url,
      limit,
      scrapeOptions: {
        formats: ["html"]
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl crawl trigger failed: ${response.statusText}. Details: ${text}`);
  }

  const { id } = await response.json();
  console.log(`[Firecrawl] Job submitted successfully. Job ID: ${id}`);

  const checkUrl = `https://api.firecrawl.dev/v1/crawl/${id}`;
  let attempts = 0;
  const maxAttempts = 24; // 120 seconds max wait

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;

    console.log(`[Firecrawl] Polling job status (Attempt ${attempts}/${maxAttempts})...`);
    const checkRes = await fetch(checkUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!checkRes.ok) {
      console.warn(`[Firecrawl] Polling failed: ${checkRes.statusText}`);
      continue;
    }

    const jobData = await checkRes.json();
    if (jobData.status === "completed") {
      console.log(`[Firecrawl] Crawl job completed. Received ${jobData.data?.length || 0} pages.`);
      return jobData.data || [];
    } else if (jobData.status === "failed") {
      throw new Error(`Firecrawl crawl job failed: ${jobData.error || "Unknown error"}`);
    }
  }

  throw new Error("Firecrawl crawl job timed out.");
}

export function parseFirecrawlPage(page: any): CrawledPage {
  const html = page.html || "";
  const $ = cheerio.load(html);

  const title = page.metadata?.title || $("title").text().trim() || "";
  const metaDescription = page.metadata?.description || $('meta[name="description"]').attr("content")?.trim() || "";

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

  let hostname = "";
  try {
    hostname = new URL(page.url).hostname;
  } catch {}

  const internalLinksSet: Set<string> = new Set();
  const externalLinksSet: Set<string> = new Set();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (!href || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }
    try {
      const absoluteUrl = new URL(href, page.url);
      if (absoluteUrl.hostname === hostname) {
        absoluteUrl.hash = "";
        internalLinksSet.add(absoluteUrl.toString());
      } else {
        externalLinksSet.add(absoluteUrl.toString());
      }
    } catch {}
  });

  const textClone = cheerio.load(html);
  textClone("script, style, iframe, noscript, svg").remove();
  const visibleText = textClone("body").text().replace(/\s+/g, " ").trim().slice(0, 1200);

  return {
    url: page.url,
    title,
    metaDescription,
    headings,
    images,
    internalLinks: Array.from(internalLinksSet),
    externalLinks: Array.from(externalLinksSet),
    schemas,
    rawHtml: html,
    visibleText,
  };
}
