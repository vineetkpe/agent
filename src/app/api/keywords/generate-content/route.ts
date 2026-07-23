import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { generateStructuredJson } from "@/lib/aiProvider";
import { validateSeoContent } from "@/lib/contentValidator";
import { getPriorityScoring } from "@/lib/seoChecks";

const articleResponseSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    content: { type: "STRING" },
    metaDescription: { type: "STRING" },
    wordCount: { type: "INTEGER" },
    suggestedSlug: { type: "STRING" },
    targetKeyword: { type: "STRING" },
  },
  required: [
    "title",
    "content",
    "metaDescription",
    "wordCount",
    "suggestedSlug",
    "targetKeyword"
  ]
};

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { siteId, keyword, keywordType, geoTarget } = body;

    if (!siteId || !keyword) {
      return NextResponse.json({ error: "Missing required fields: siteId and keyword" }, { status: 400 });
    }

    const site = await prisma.site.findFirst({
      where: { id: siteId, userId: currentUser.id }
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found or unauthorized access" }, { status: 404 });
    }

    const typeStr = keywordType === "long-tail" ? "long-tail keyword" : "short-tail keyword";
    const geoStr = geoTarget ? `Geographic Target Region: ${geoTarget}` : "Geographic Target Region: Worldwide (No local targeting)";

    const businessGoalsList = site.businessGoals ? JSON.parse(site.businessGoals) : [];
    const goalsBiasText = businessGoalsList.length > 0
      ? `\nBIAS SIGNAL: The business owner is focused on these goals: ${businessGoalsList.join(", ")}.
If the goals include 'more_calls' or 'more_bookings', frame the article's call-to-actions to prompt the reader to contact, call, or book an appointment.
If the goals include 'more_sales', frame the article around product value propositions and conversions.
If the goals include 'more_traffic', frame the article as a highly helpful guide resolving common informational search queries.\n`
      : "";

    // Construct highly specific SEO prompt targeting the keyword and type
    const prompt = `
Generate a high-ranking blog article optimized for search engine indexing.

${goalsBiasText}

Target Configuration:
- Target Keyword: "${keyword}"
- Keyword Classification Type: ${typeStr}
- ${geoStr}

Strict SEO Content Generation Rules:
1. Title Tag: Between 50 and 60 characters long. Must contain the primary keyword.
2. Meta Description: Between 150 and 160 characters long. Must contain the primary keyword.
3. Content Body:
   - Must be written in valid clean HTML format (exclude surrounding markdown markers like \`\`\`html).
   - Word count: If keyword type is "long-tail", write a detailed, comprehensive long-form article of AT LEAST 1200 words. If keyword type is "short-tail", write a highly informative structured article of AT LEAST 600 words.
   - Headings: Include exactly one H1 heading at the start of the article. Must contain the primary keyword and be distinct from the Title Tag. Include logical H2 and H3 subheadings.
   - Links: Incorporate at least 2 internal relative site links (e.g. targeting "/about", "/services", or relative paths targeting the domain "${site.url}"). Incorporate at least 1 outbound authority link (e.g. referencing high-quality documentation, Wikipedia, or resources).
   - Local SEO Geo-Targeting: If a Geographic Target Region is set, you must naturally mention the target city/state/region in the H1 heading, at least one H2 subheading, and naturally multiple times inside paragraph descriptions to satisfy local search intent.
    `;

    console.log(`[AI Content Gen] Running structured article generation for keyword: "${keyword}" (${keywordType})`);
    
    interface GeneratedArticle {
      title: string;
      content: string;
      metaDescription: string;
      wordCount: number;
      suggestedSlug: string;
      targetKeyword: string;
    }

    const aiResult = await generateStructuredJson<GeneratedArticle>(
      prompt,
      articleResponseSchema,
      currentUser.id,
      siteId,
      "content_generation"
    );

    // Validate the generated article against our content validator rules
    const validation = validateSeoContent({
      title: aiResult.title,
      content: aiResult.content,
      metaDescription: aiResult.metaDescription,
      targetKeyword: keyword
    }, site.url);

    // Extract individual validation parameters
    const titleLengthPassed = aiResult.title.length >= 50 && aiResult.title.length <= 60;
    const metaLengthPassed = aiResult.metaDescription.length >= 150 && aiResult.metaDescription.length <= 160;
    
    const textContent = aiResult.content.replace(/<[^>]*>/g, " ");
    const wordCountActual = textContent.trim().split(/\s+/).filter(Boolean).length;
    const wordCountPassed = keywordType === "long-tail" ? wordCountActual >= 1200 : wordCountActual >= 600;

    const h1Matches = aiResult.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h1CountPassed = h1Matches.length === 1;

    const hrefs: string[] = [];
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;
    while ((match = hrefRegex.exec(aiResult.content)) !== null) {
      hrefs.push(match[1]);
    }
    const origin = new URL(site.url).origin.toLowerCase();
    const internalLinks = hrefs.filter(link => link.startsWith("/") || link.toLowerCase().startsWith(origin));
    const externalLinks = hrefs.filter(link => link.toLowerCase().startsWith("http") && !link.toLowerCase().startsWith(origin));

    const internalLinksPassed = internalLinks.length >= 2;
    const externalLinksPassed = externalLinks.length >= 1;

    const checks = {
      titleLengthPassed,
      metaLengthPassed,
      wordCountPassed,
      h1CountPassed,
      internalLinksPassed,
      externalLinksPassed
    };

    const passed = Object.values(checks).every(Boolean);

    // Automatically register the generated post as a pending AuditItem so it displays in the AI Content Suite
    const latestAudit = await prisma.audit.findFirst({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" }
    });

    if (latestAudit) {
      const warning = passed ? null : "This draft doesn't fully meet SEO best practices, review before publishing";
      const scores = getPriorityScoring("blog_post");
      await prisma.auditItem.create({
        data: {
          auditId: latestAudit.id,
          siteId: site.id,
          type: "blog_post",
          targetUrl: `${site.url}/blog/${aiResult.suggestedSlug}`,
          currentValue: JSON.stringify({ status: "not_created" }),
          suggestedValue: JSON.stringify({
            title: aiResult.title,
            content: aiResult.content,
            slug: aiResult.suggestedSlug,
            targetKeyword: keyword,
            metaDescription: aiResult.metaDescription,
            wordCount: wordCountActual,
            internalLinksUsed: internalLinks,
            externalLinksUsed: externalLinks,
            validation: {
              passed,
              failures: validation.failures,
              checks
            }
          }),
          contentQualityWarning: warning,
          status: "pending",
          priority: scores.priority,
          impactScore: scores.impactScore,
          difficultyScore: scores.difficultyScore,
        }
      });
      console.log(`[AI Content Gen] Automatically saved article as a pending AuditItem under Audit #${latestAudit.id}`);
    }

    return NextResponse.json({
      success: true,
      article: {
        title: aiResult.title,
        metaDescription: aiResult.metaDescription,
        content: aiResult.content,
        wordCount: wordCountActual,
        suggestedSlug: aiResult.suggestedSlug,
        targetKeyword: keyword
      },
      validation: {
        passed,
        failures: validation.failures,
        checks
      }
    });

  } catch (error) {
    console.error("[Keywords Content Generation Error]:", error);
    return NextResponse.json({ error: (error as Error).message || "Failed to generate SEO article." }, { status: 500 });
  }
}

