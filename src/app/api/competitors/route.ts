import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { generateStructuredJson } from "@/lib/aiProvider";
import { crawlSite } from "@/lib/crawler";
import { runSeoAudits, getPageSpeedData } from "@/lib/seoChecks";
import { isSafeUrlToFetch } from "@/lib/urlSafety";

const suggestedCompetitorSchema = {
  type: "OBJECT",
  properties: {
    competitors: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          url: { type: "STRING" },
          name: { type: "STRING" }
        },
        required: ["url", "name"]
      }
    }
  },
  required: ["competitors"]
};

async function suggestCompetitors(site: any): Promise<any[]> {
  const manuallyEntered = site.manuallyEnteredContext ? JSON.parse(site.manuallyEnteredContext) : null;
  const profile = site.businessProfile
    ? JSON.parse(site.businessProfile)
    : (manuallyEntered ? {
        summary: manuallyEntered.description,
        industry: manuallyEntered.industry,
        category: manuallyEntered.industry,
        services: manuallyEntered.services || [],
        targetAudience: manuallyEntered.targetAudience,
      } : null);

  if (!profile) {
    return [
      { url: "https://example-competitor.com", name: "Competitor A (Sample)" },
      { url: "https://another-competitor.com", name: "Competitor B (Sample)" }
    ];
  }

  const prompt = `
You are an expert SEO Competitor Intelligence Analyst.
We need to identify 3-5 direct local or industry competitors for this business:
- Website: ${site.url}
- Industry: ${profile.industry}
- Category: ${profile.category}
- Summary: ${profile.summary}
- Services Offered: ${profile.services?.join(", ") || "None listed"}
- Target Audience: ${profile.targetAudience}

Please suggest 3-5 actual competitor domain URLs and their business names. Ground your suggestions in the location or category of this business. Do not suggest dominant global brands (like Amazon or Google) unless they are direct competitors.
Return the suggestions formatted EXACTLY as a JSON object matching this schema:
{
  "competitors": [
    { "url": "string", "name": "string" }
  ]
}
`;

  try {
    const response = await generateStructuredJson<{ competitors: any[] }>(
      prompt,
      suggestedCompetitorSchema,
      site.userId
    );
    return response.competitors || [];
  } catch (err) {
    console.error("[Competitor Suggestion AI Error]:", err);
    return [
      { url: "https://example-competitor.com", name: "Competitor A (Sample)" },
      { url: "https://another-competitor.com", name: "Competitor B (Sample)" }
    ];
  }
}

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId query parameter" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    let competitors: any[] = [];
    if (site.competitorsJson) {
      try {
        competitors = JSON.parse(site.competitorsJson);
      } catch (e) {
        competitors = [];
      }
    }

    // Generate AI suggestions if list is empty
    if (competitors.length === 0) {
      const suggestions = await suggestCompetitors(site);
      competitors = suggestions.map(s => ({
        url: s.url,
        name: s.name,
        status: "suggested",
        scanResult: null
      }));

      // Cache suggestions
      await prisma.site.update({
        where: { id: siteId },
        data: {
          competitorsJson: JSON.stringify(competitors)
        }
      });
    }

    return NextResponse.json({ success: true, competitors });
  } catch (error: any) {
    console.error("[Competitors GET Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to load competitors." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { siteId, action, payload } = await req.json();
    if (!siteId) {
      return NextResponse.json({ error: "Missing siteId parameter" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    let competitors: any[] = [];
    if (site.competitorsJson) {
      try {
        competitors = JSON.parse(site.competitorsJson);
      } catch (e) {}
    }

    if (action === "update") {
      // payload is the complete list of competitors
      competitors = payload;
      const updatedSite = await prisma.site.update({
        where: { id: siteId },
        data: {
          competitorsJson: JSON.stringify(competitors)
        }
      });
      return NextResponse.json({ success: true, competitors: JSON.parse(updatedSite.competitorsJson || "[]") });
    }

    if (action === "scan") {
      const { competitorUrl } = payload;
      if (!competitorUrl) {
        return NextResponse.json({ error: "Missing competitorUrl in payload" }, { status: 400 });
      }

      // Normalize competitor URL
      let targetUrl = competitorUrl.trim();
      if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = "https://" + targetUrl;
      }
      const cleanCompUrl = new URL(targetUrl).origin;

      if (!(await isSafeUrlToFetch(cleanCompUrl))) {
        return NextResponse.json({ error: "Unsafe or private IP address provided for competitor." }, { status: 400 });
      }

      // Run lightweight crawl (3 pages) & SEO / PageSpeed scan
      console.log(`[Competitor Scan] Starting technical comparative scan for: ${cleanCompUrl}`);
      
      let pages: any[] = [];
      let pageSpeedScore = null;
      let averageWordCount = 0;
      let headingCount = 0;
      let metaDescriptionPresent = false;

      try {
        const crawlResult = await crawlSite(cleanCompUrl, 3);
        pages = crawlResult.pages;
      } catch (crawlErr) {
        console.error("[Competitor Scan] Crawl failed:", crawlErr);
      }

      if (pages.length > 0) {
        let totalWords = 0;
        let totalHeadings = 0;
        let metasCount = 0;

        pages.forEach((p) => {
          const words = (p.visibleText || "").trim().split(/\s+/).filter(Boolean).length;
          totalWords += words;
          totalHeadings += p.headings.length;
          if (p.metaDescription) {
            metasCount++;
          }
        });

        averageWordCount = Math.round(totalWords / pages.length);
        headingCount = Math.round(totalHeadings / pages.length);
        metaDescriptionPresent = (metasCount / pages.length) >= 0.5;
      }

      // Query PageSpeed Insights (lightweight mobile test)
      try {
        const ps = await getPageSpeedData(cleanCompUrl);
        pageSpeedScore = ps.scorePerformance;
      } catch (psErr) {
        console.error("[Competitor Scan] PageSpeed failed:", psErr);
      }

      const scanResult = {
        pageSpeedScore,
        averageWordCount,
        headingCount,
        metaDescriptionPresent,
        titlePattern: pages[0]?.title || "N/A",
        metaPattern: pages[0]?.metaDescription || "N/A",
        scannedAt: new Date()
      };

      // Update the scanResult in competitorsJson
      competitors = competitors.map((comp) => {
        if (comp.url.toLowerCase().replace(/\/$/, "") === cleanCompUrl.toLowerCase().replace(/\/$/, "")) {
          return {
            ...comp,
            status: "confirmed",
            scanResult
          };
        }
        return comp;
      });

      const updatedSite = await prisma.site.update({
        where: { id: siteId },
        data: {
          competitorsJson: JSON.stringify(competitors)
        }
      });

      return NextResponse.json({ success: true, competitors: JSON.parse(updatedSite.competitorsJson || "[]") });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Competitors POST Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to execute competitor action." }, { status: 500 });
  }
}
