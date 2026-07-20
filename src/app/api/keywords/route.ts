import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { fetchSearchConsoleData } from "@/lib/googleSearchConsole";
import { generateStructuredJson } from "@/lib/aiProvider";
import { crawlSite } from "@/lib/crawler";

async function getSuggestedOpportunities(site: any, rankingNow: any[]): Promise<any[]> {
  const manuallyEntered = site.manuallyEnteredContext ? JSON.parse(site.manuallyEnteredContext) : null;
  const profile = site.businessProfile
    ? JSON.parse(site.businessProfile)
    : (manuallyEntered ? {
        industry: manuallyEntered.industry,
        category: manuallyEntered.industry,
        summary: manuallyEntered.description,
        services: manuallyEntered.services || [],
        targetAudience: manuallyEntered.targetAudience,
      } : null);

  const servicesList = profile?.services
    ? (Array.isArray(profile.services) ? profile.services.map((s: any) => typeof s === "string" ? s : s.name).join(", ") : String(profile.services))
    : "None listed";

  const profileText = profile ? `
Discovered Business Profile:
- Industry: ${profile.industry}
- Category: ${profile.category}
- Summary: ${profile.summary}
- Services: ${servicesList}
- Target Audience: ${profile.targetAudience}
` : "No explicit business profile discovered yet.";

  const seedKeywordsText = rankingNow && rankingNow.length > 0
    ? `Here are top search queries currently ranking for this website: ${rankingNow.map((k: any) => `"${k.query}"`).slice(0, 15).join(", ")}`
    : "No Search Console ranking queries available.";

  const businessGoalsList = site.businessGoals ? JSON.parse(site.businessGoals) : [];
  const goalsBiasText = businessGoalsList.length > 0
    ? `\nBIAS SIGNAL: The business owner is focused on these goals: ${businessGoalsList.join(", ")}.
If the goals include 'more_calls' or 'more_bookings', prioritize local-intent keywords that prompt the visitor to contact, call, or book an appointment.
If the goals include 'more_sales', prioritize transactional/commercial-intent keywords.
If the goals include 'more_traffic', suggest high-volume informational keywords that solve common customer search questions.\n`
    : "";

  const systemPrompt = `
You are an expert SEO Systems Architect and Growth Planner.
Generate 6 target keyword recommendations for the website: ${site.url}.

${goalsBiasText}
${profileText}

${seedKeywordsText}

CRITICAL RULES:
1. Suggest a mix of short-tail keywords (broad target category keywords) and long-tail keywords (informational, question, or FAQ-style keywords).
2. Ground all suggestions strictly in the business profile services, audience, and actual category. Do NOT invent generic keywords.
3. Classify search intent for each keyword as either 'informational', 'commercial', or 'local'.
4. Provide a realistic growth rationale for each suggestion (e.g. why it helps the business, what search intent it captures).
5. Never claim or imply backlink generation or guaranteed backlinks results anywhere in rationale.

Return the suggestions formatted EXACTLY as a JSON object matching this schema:
{
  "suggestions": [
    { "keyword": "string", "intent": "informational" | "commercial" | "local", "rationale": "string" }
  ]
}
`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      suggestions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            keyword: { type: "STRING" },
            intent: { type: "STRING", enum: ["informational", "commercial", "local"] },
            rationale: { type: "STRING" }
          },
          required: ["keyword", "intent", "rationale"]
        }
      }
    },
    required: ["suggestions"]
  };

  try {
    const aiResponse = await generateStructuredJson<{ suggestions: any[] }>(
      systemPrompt,
      responseSchema,
      site.userId
    );
    return aiResponse.suggestions || [];
  } catch (err) {
    console.error("Failed to generate AI keyword suggestions:", err);
    return [
      { keyword: "local services near me", intent: "local", rationale: "Captures commercial customer queries." },
      { keyword: "how to choose service provider", intent: "informational", rationale: "Targets early funnel research." }
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
      return NextResponse.json({ error: "Missing siteId parameter" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized" }, { status: 404 });
    }

    let rankingNow: any[] = [];
    let suggestedOpportunities: any[] = [];

    // Check GSC connection
    if (site.gscConnected) {
      try {
        rankingNow = await fetchSearchConsoleData(site);
      } catch (err) {
        console.error("Failed to fetch Search Console data:", err);
        return NextResponse.json({ error: "Failed to fetch Search Console data." }, { status: 500 });
      }
    }

    // Load AI suggestions from cache or generate new ones
    let cacheData: any = null;
    if (site.gscCachedData) {
      try {
        cacheData = JSON.parse(site.gscCachedData);
      } catch (e) {}
    }

    const cacheAgeMs = Date.now() - (site.gscLastSyncedAt ? new Date(site.gscLastSyncedAt).getTime() : 0);
    if (cacheData && cacheData.suggestedOpportunities && cacheAgeMs < 24 * 60 * 60 * 1000) {
      suggestedOpportunities = cacheData.suggestedOpportunities;
    } else {
      suggestedOpportunities = await getSuggestedOpportunities(site, rankingNow);
      
      // Store in unified cache format
      await prisma.site.update({
        where: { id: site.id },
        data: {
          gscCachedData: JSON.stringify({
            rankingNow,
            suggestedOpportunities
          }),
          gscLastSyncedAt: new Date()
        }
      });
    }

    // Perform keyword intelligence checks (stuffing, cannibalization, gaps) using crawled page text
    const latestAudit = await prisma.audit.findFirst({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" }
    });

    let pages: any[] = [];
    try {
      const crawlResult = await crawlSite(site.url, 5);
      pages = crawlResult?.pages || [];
    } catch (crawlErr) {
      console.error("[Keywords API] Crawl failed during keyword analysis:", crawlErr);
    }

    const stuffingIssues: any[] = [];
    const cannibalizationIssues: any[] = [];
    const gapIssues: any[] = [];

    if (pages.length > 0) {
      const targetKeywords = new Set<string>();
      suggestedOpportunities.forEach((opp: any) => {
        if (opp.keyword) targetKeywords.add(opp.keyword.toLowerCase().trim());
      });
      rankingNow.forEach((rank: any) => {
        if (rank.query) targetKeywords.add(rank.query.toLowerCase().trim());
      });

      // 1. Keyword density check
      for (const page of pages) {
        const visibleText = page.visibleText || "";
        for (const kw of targetKeywords) {
          const density = calculateKeywordDensity(visibleText, kw);
          if (density > 3.0) {
            stuffingIssues.push({
              pageUrl: page.url,
              keyword: kw,
              density,
              wordCount: visibleText.split(/\s+/).filter(Boolean).length
            });
          }
        }
      }

      if (latestAudit) {
        for (const issue of stuffingIssues) {
          const priorityScore = { priority: "high", impactScore: 8, difficultyScore: 3 };
          const existing = await prisma.auditItem.findFirst({
            where: {
              auditId: latestAudit.id,
              type: "keyword_stuffing",
              targetUrl: issue.pageUrl,
              currentValue: { contains: issue.keyword }
            }
          });
          if (!existing) {
            await prisma.auditItem.create({
              data: {
                auditId: latestAudit.id,
                siteId: site.id,
                type: "keyword_stuffing",
                targetUrl: issue.pageUrl,
                currentValue: JSON.stringify({ keyword: issue.keyword, density: issue.density, wordCount: issue.wordCount }),
                suggestedValue: `Keyword stuffing detected for '${issue.keyword}' (density: ${issue.density}%). Reduce occurrences of the keyword to keep the density below 3% and prevent search engine spam flags.`,
                status: "pending",
                priority: priorityScore.priority,
                impactScore: priorityScore.impactScore,
                difficultyScore: priorityScore.difficultyScore,
              }
            });
          }
        }
      }

      // 2. Cannibalization check
      for (const kw of targetKeywords) {
        const competingPages: string[] = [];
        for (const page of pages) {
          const titleMatch = page.title?.toLowerCase().includes(kw);
          const h1Match = page.headings?.some((h: any) => h.level === "h1" && h.text.toLowerCase().includes(kw));
          const metaMatch = page.metaDescription?.toLowerCase().includes(kw);
          if (titleMatch || h1Match || metaMatch) {
            competingPages.push(page.url);
          }
        }
        if (competingPages.length >= 2) {
          cannibalizationIssues.push({
            keyword: kw,
            urls: competingPages
          });
        }
      }

      if (latestAudit) {
        for (const issue of cannibalizationIssues) {
          const priorityScore = { priority: "high", impactScore: 7, difficultyScore: 4 };
          const targetUrl = issue.urls[0];
          const existing = await prisma.auditItem.findFirst({
            where: {
              auditId: latestAudit.id,
              type: "keyword_cannibalization",
              currentValue: { contains: issue.keyword }
            }
          });
          if (!existing) {
            await prisma.auditItem.create({
              data: {
                auditId: latestAudit.id,
                siteId: site.id,
                type: "keyword_cannibalization",
                targetUrl: targetUrl,
                currentValue: JSON.stringify({ keyword: issue.keyword, competingUrls: issue.urls }),
                suggestedValue: `Keyword cannibalization detected for '${issue.keyword}'. Multiple pages (${issue.urls.join(", ")}) are competing for this keyword. Differentiate the content by focusing on unique secondary search intent or merge them.`,
                status: "pending",
                priority: priorityScore.priority,
                impactScore: priorityScore.impactScore,
                difficultyScore: priorityScore.difficultyScore,
              }
            });
          }
        }
      }

      // 3. Keyword gap analysis
      if (site.gscConnected) {
        for (const rank of rankingNow) {
          const impressions = rank.impressions || 0;
          const clicks = rank.clicks || 0;
          const query = (rank.query || "").toLowerCase().trim();
          
          if (query && impressions > 0 && clicks <= 1) {
            let targeted = false;
            for (const page of pages) {
              const inTitle = page.title?.toLowerCase().includes(query);
              const inH1 = page.headings?.some((h: any) => h.level === "h1" && h.text.toLowerCase().includes(query));
              if (inTitle || inH1) {
                targeted = true;
                break;
              }
            }
            if (!targeted) {
              gapIssues.push({
                query: rank.query,
                impressions,
                clicks,
                position: rank.position
              });
            }
          }
        }

        if (latestAudit) {
          for (const issue of gapIssues) {
            const priorityScore = { priority: "high", impactScore: 8, difficultyScore: 4 };
            const existing = await prisma.auditItem.findFirst({
              where: {
                auditId: latestAudit.id,
                type: "keyword_opportunity",
                source: "gsc_verified",
                currentValue: { contains: issue.query }
              }
            });
            if (!existing) {
              await prisma.auditItem.create({
                data: {
                  auditId: latestAudit.id,
                  siteId: site.id,
                  type: "keyword_opportunity",
                  targetUrl: site.url,
                  currentValue: JSON.stringify({ query: issue.query, impressions: issue.impressions, clicks: issue.clicks, position: issue.position }),
                  suggestedValue: JSON.stringify({
                    keyword: issue.query,
                    intent: "informational",
                    rationale: `Content Gap Opportunity: Site receives impressions (${issue.impressions}) but zero/low clicks (${issue.clicks}) for query '${issue.query}', and no page targets it in title/H1. Create a dedicated page or section targeting this keyword.`,
                    position: issue.position,
                    impressions: issue.impressions,
                    clicks: issue.clicks
                  }),
                  status: "pending",
                  source: "gsc_verified",
                  priority: priorityScore.priority,
                  impactScore: priorityScore.impactScore,
                  difficultyScore: priorityScore.difficultyScore,
                }
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      rankingNow,
      suggestedOpportunities,
      stuffingIssues,
      cannibalizationIssues,
      gapIssues
    });
  } catch (error: any) {
    console.error("[Keywords API Error]:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}

function calculateKeywordDensity(text: string, keyword: string): number {
  if (!text || !keyword) return 0;
  
  const words = text.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  const totalWords = words.length;
  if (totalWords === 0) return 0;

  const keywordWords = keyword.toLowerCase().match(/\b[a-z0-9'-]+\b/g) || [];
  if (keywordWords.length === 0) return 0;

  let matchCount = 0;
  for (let i = 0; i <= totalWords - keywordWords.length; i++) {
    let match = true;
    for (let j = 0; j < keywordWords.length; j++) {
      if (words[i + j] !== keywordWords[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      matchCount++;
      i += keywordWords.length - 1;
    }
  }

  return parseFloat(((matchCount * keywordWords.length) / totalWords * 100).toFixed(2));
}
