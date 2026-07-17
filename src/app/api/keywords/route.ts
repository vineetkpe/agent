import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { fetchSearchConsoleData } from "@/lib/googleSearchConsole";
import { generateStructuredJson } from "@/lib/aiProvider";

async function getSuggestedOpportunities(site: any, rankingNow: any[]): Promise<any[]> {
  const profile = site.businessProfile ? JSON.parse(site.businessProfile) : null;
  const profileText = profile ? `
Discovered Business Profile:
- Industry: ${profile.industry}
- Category: ${profile.category}
- Summary: ${profile.summary}
- Services: ${profile.services?.join(", ") || "None listed"}
- Target Audience: ${profile.targetAudience}
` : "No explicit business profile discovered yet.";

  const seedKeywordsText = rankingNow && rankingNow.length > 0
    ? `Here are top search queries currently ranking for this website: ${rankingNow.map((k: any) => `"${k.query}"`).slice(0, 15).join(", ")}`
    : "No Search Console ranking queries available.";

  const systemPrompt = `
You are an expert SEO Systems Architect and Growth Planner.
Generate 6 target keyword recommendations for the website: ${site.url}.

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

    return NextResponse.json({
      rankingNow,
      suggestedOpportunities
    });
  } catch (error: any) {
    console.error("[Keywords API Error]:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
