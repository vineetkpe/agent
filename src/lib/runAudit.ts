import { crawlSite } from "@/lib/crawler";
import { runSeoAudits, getPageSpeedData, getPriorityScoring } from "@/lib/seoChecks";
import { generateStructuredJson } from "@/lib/aiProvider";
import { analyzeBusinessProfile } from "@/lib/businessIntelligence";
import { prisma } from "@/lib/prisma";
import { fetchSearchConsoleData } from "@/lib/googleSearchConsole";
import { validateSeoContent } from "@/lib/contentValidator";
import { sanitizeHtml } from "@/lib/sanitizer";
import { searchRelevantImages } from "@/lib/unsplash";

// Define the response schema structure expected from Gemini
const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    keywordOpportunities: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          keyword: { type: "STRING" },
          rationale: { type: "STRING" },
          intent: { type: "STRING", enum: ["informational", "transactional"] },
        },
        required: ["keyword", "rationale", "intent"],
      },
    },
    fixes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          targetUrl: { type: "STRING" },
          type: { type: "STRING", enum: ["meta_title", "meta_description", "schema_markup", "missing_alt", "broken_link", "heading_structure", "canonical_tag", "social_meta", "duplicate_content"] },
          suggestedValue: { type: "STRING" },
        },
        required: ["targetUrl", "type", "suggestedValue"],
      },
    },
    blogPosts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          content: { type: "STRING" },
          metaDescription: { type: "STRING" },
          wordCount: { type: "INTEGER" },
          internalLinksUsed: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          externalLinksUsed: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          suggestedSchema: { type: "STRING" },
          suggestedSlug: { type: "STRING" },
          targetKeyword: { type: "STRING" },
        },
        required: [
          "title",
          "content",
          "metaDescription",
          "wordCount",
          "internalLinksUsed",
          "externalLinksUsed",
          "suggestedSchema",
          "suggestedSlug",
          "targetKeyword"
        ],
      },
    },
  },
  required: ["keywordOpportunities", "fixes", "blogPosts"],
};

export async function runAuditForSite(
  site: any,
  options?: { isScheduled?: boolean; targetKeyword?: string }
) {
  const cleanUrl = site.url;
  const userId = site.userId;
  const targetKeyword = options?.targetKeyword;

  console.log(`[runAudit] Starting audit pipeline for: ${cleanUrl}`);

  // 3. Run crawler
  const crawlResult = await crawlSite(cleanUrl, 10); // cap at 10 pages for speed/testing
  const crawledPages = crawlResult.pages;
  const crawlerUsed = crawlResult.crawlerUsed;
  const crawlerWarning = crawlResult.crawlerWarning;

  if (crawledPages.length === 0) {
    throw new Error(`Could not fetch or crawl the site at ${cleanUrl}. Check if the URL is active.`);
  }

  // 4. Run Business Intelligence analysis
  let businessProfileData: string | null = null;
  let businessProfileError: string | null = null;
  try {
    console.log(`[runAudit] Analyzing business profile for ${cleanUrl}...`);
    const profile = await analyzeBusinessProfile(crawledPages, cleanUrl, userId);
    businessProfileData = JSON.stringify(profile);
    console.log(`[runAudit] Discovered Business Profile (Confidence: ${profile.confidenceScore}): ${profile.category}`);
  } catch (biError: any) {
    console.error("[runAudit] Business Intelligence layer failure:", biError);
    businessProfileError = biError instanceof Error ? biError.message : String(biError);
  }

  // 5. Update Site record
  const updateData: any = {};
  if (businessProfileData !== null) {
    updateData.businessProfile = businessProfileData;
  }
  
  // Build and attach the knowledge graph
  try {
    const activeProfile = businessProfileData 
      ? JSON.parse(businessProfileData) 
      : (site.businessProfile ? JSON.parse(site.businessProfile) : null);
    if (activeProfile) {
      const { buildKnowledgeGraph } = await import("./knowledgeGraph");
      const graph = buildKnowledgeGraph(crawledPages, activeProfile);
      updateData.knowledgeGraphData = JSON.stringify(graph);
    }
  } catch (kgErr) {
    console.error("[runAudit] Failed to build knowledge graph:", kgErr);
  }

  const updatedSite = await prisma.site.update({
    where: { id: site.id },
    data: updateData,
  });

  // 6. Run local SEO audits
  const auditResults = await runSeoAudits(crawledPages, cleanUrl);

  // Fetch Google Search Console data if connected
  let gscSnapshotData: any[] = [];
  let gscPromptText = "";
  if (updatedSite.gscConnected) {
    try {
      console.log(`[runAudit] Fetching GSC data for verified site URL: ${updatedSite.url}`);
      gscSnapshotData = await fetchSearchConsoleData(updatedSite);
      gscPromptText = `
Here is real search performance query ranking data fetched directly from Google Search Console for this site:
${JSON.stringify(gscSnapshotData, null, 2)}

INSTRUCTIONS FOR KEYWORD OPPORTUNITIES:
1. Prioritize suggested keyword opportunities for queries that are already ranking between positions 5 and 20 (page-1-adjacent keywords that have strong potential to rank higher with content optimization).
2. Suggest keyword opportunities for high-impression but low-CTR (click-through rate) queries, which indicate a metadata or snippet clickability problem rather than a ranking issue.
3. Every suggestion in 'keywordOpportunities' based on this verified data MUST have its source set to 'gsc_verified' and must include its current average position and impression counts inside the suggested value.
`;
    } catch (gscError: any) {
      console.error("[runAudit] Search Console data fetch failed:", gscError);
      throw new Error(`Google Search Console data fetch failed: ${gscError.message || gscError}`);
    }
  } else {
    gscPromptText = `
Note: Google Search Console is NOT connected. You must generate keyword opportunities based ONLY on the business profile (industry, category, services, target audience, and target region/intent). Do NOT invent generic terms. Ground all keyword suggestions in the specific business's offerings. Every suggestion generated this way will be tagged as 'ai_suggested' and is considered unverified.
`;
  }

  // Create Audit database record
  const audit = await prisma.audit.create({
    data: {
      siteId: updatedSite.id,
      scorePerformance: 0,
      scoreSeo: auditResults.scoreSeo,
      status: "pending",
      businessProfileError: businessProfileError,
      gscSnapshot: updatedSite.gscConnected ? JSON.stringify(gscSnapshotData) : null,
      crawlerUsed,
      crawlerWarning,
    },
  });

  // 6. Generate improvements using Gemini AI (AI Scan Step)
  let aiResponse: any = null;
  let aiScanError: string | null = null;

  try {
    console.log(`[runAudit] Running AI content/fixes scan for: ${cleanUrl}`);
    const manuallyEntered = updatedSite.manuallyEnteredContext ? JSON.parse(updatedSite.manuallyEnteredContext) : null;
    const parsedProfile = updatedSite.businessProfile
      ? JSON.parse(updatedSite.businessProfile)
      : (manuallyEntered ? {
          summary: manuallyEntered.description,
          industry: manuallyEntered.industry,
          category: manuallyEntered.industry,
          products: [],
          services: manuallyEntered.services || [],
          targetAudience: manuallyEntered.targetAudience,
          brandVoice: "Professional",
          usps: [`Located in ${manuallyEntered.cityServiceArea}`],
          competitors: [],
          confidenceScore: 1.0,
        } : null);
    const productsList = parsedProfile?.products
      ? (Array.isArray(parsedProfile.products)
          ? parsedProfile.products.map((p: any) => typeof p === "string" ? p : p.name).join(", ")
          : String(parsedProfile.products))
      : "None listed";
    const servicesList = parsedProfile?.services
      ? (Array.isArray(parsedProfile.services)
          ? parsedProfile.services.map((s: any) => typeof s === "string" ? s : s.name).join(", ")
          : String(parsedProfile.services))
      : "None listed";
    const voiceGuide = parsedProfile?.brandVoice
      ? (typeof parsedProfile.brandVoice === "string"
          ? parsedProfile.brandVoice
          : `Tone: ${parsedProfile.brandVoice?.tone || ""}, Reading Level: ${parsedProfile.brandVoice?.readingLevel || ""}, Vocabulary Notes: ${parsedProfile.brandVoice?.vocabularyNotes || ""}, Avoid Words/Phrases: ${(parsedProfile.brandVoice?.doNotUse || []).join(", ")}`)
      : "Professional";

    const profileText = parsedProfile ? `
Here is the Discovered Business Intelligence Profile for this company:
- Industry: ${parsedProfile.industry}
- Category: ${parsedProfile.category}
- Summary: ${parsedProfile.summary}
- Products: ${productsList}
- Services: ${servicesList}
- Target Audience: ${parsedProfile.targetAudience}
- Brand Voice/Tone Style Guide: ${voiceGuide}
- Location Detected: ${parsedProfile.locationDetected || "Worldwide / Remote"}
- Language Detected: ${parsedProfile.languageDetected || "en"}
- Unique Selling Points (USPs): ${parsedProfile.usps?.join(" | ") || "None"}
- Competitors: ${parsedProfile.competitors?.join(", ") || "None listed"}
` : "No explicit business profile discovered yet.";

    const businessGoalsList = updatedSite.businessGoals ? JSON.parse(updatedSite.businessGoals) : [];
    const goalsBiasText = businessGoalsList.length > 0
      ? `\nBIAS SIGNAL: The business owner is focused on these goals: ${businessGoalsList.join(", ")}.
If the goals include 'more_calls' or 'more_bookings', prioritize local-intent keywords and content that prompts the visitor to contact, call, or book an appointment.
If the goals include 'more_sales', prioritize transactional-intent keywords and clear product/service value propositions.
If the goals include 'more_traffic', suggest high-volume informational keywords that solve common customer search questions.\n`
      : "";

    const targetKeywordRule = targetKeyword
      ? `\nCRITICAL REQUIRED TARGET KEYWORD: You MUST write one of the blog posts targeting the primary keyword "${targetKeyword}". This keyword must be the primary focus of that blog post.\n`
      : "";

    const systemPrompt = `
You are an expert AI Website Growth Agent specializing in Local Business SEO and Content Marketing.
We have audited the website: ${cleanUrl}.

${goalsBiasText}

${profileText}

${gscPromptText}

${targetKeywordRule}
CRITICAL ON-PAGE SEO CONTENT RULES:
You MUST follow these rules exactly for any blog post and meta tag suggestions:
- title_tag: 50-60 characters, primary keyword within the first half, no clickbait/ALL CAPS.
- meta_description: 150-160 characters, includes primary keyword naturally, ends with an implicit or explicit call-to-action, no truncation-triggering length.
- h1: Exactly one per page, contains the primary keyword, distinct from the title tag wording (not identical duplicate).
- heading_structure: Logical H2/H3 hierarchy, no skipped levels, each major H2 section covers a distinct subtopic/keyword variation of the primary topic.
- word_count: Minimum 1200 words for blog posts targeting competitive local-service keywords, minimum 600 for simple informational/FAQ-style pages. Never pad with fluff to hit the count -- reject and regenerate if content is bloated filler.
- keyword_placement: Primary keyword appears in: title, H1, first 100 words, and at least one H2. Keyword density between 0.5%-1.5% of total words -- never stuffed.
- internal_links: Minimum 2 contextual internal links to other real pages on the same site. You MUST use only the following real crawled page URLs: ${JSON.stringify(crawledPages.map(p => p.url))}. Never invent page URLs.
- external_links: Minimum 1 outbound link to a genuinely authoritative, topically relevant source (e.g. an industry body, .gov/.edu, or major recognized publication) to build topical trust signals. Never link to competitors or low-quality sites.
- image_alt_text: Every suggested image slot includes descriptive alt text containing the topic naturally, never keyword-stuffed.
- readability: Short paragraphs (3-4 sentences max), active voice preferred, at least one bulleted or numbered list where content allows it.
- schema: Suggest Article or BlogPosting JSON-LD schema alongside the content (headline, datePublished, author) for eligible content.
- backlinks_disclaimer: Backlinks (external sites linking TO this content) cannot be generated or guaranteed by content rules -- they depend on outside sites choosing to link. Do not claim or imply guaranteed backlink results anywhere in generated content or UI copy.

Here is the summary of the crawled pages:
${JSON.stringify(
  crawledPages.map((p) => ({
    url: p.url,
    title: p.title,
    metaDescription: p.metaDescription,
    headingsCount: p.headings.length,
    imagesCount: p.images.length,
    schemasPresent: p.schemas.length > 0,
  })),
  null,
  2
)}

Here are the specific SEO issues identified by our scanner:
${JSON.stringify(
  auditResults.issues.map((issue) => ({
    type: issue.type,
    targetUrl: issue.targetUrl,
    currentDetails: issue.currentValue,
  })),
  null,
  2
)}

Based on this audit data, please generate:
1. A list of 3-5 'quick win' keyword opportunities specific to this business, each containing the keyword phrase, why it's realistically winnable soon (long-tail, local-intent, low apparent competition, directly matches a service/product this business actually offers per its crawled content/business profile), and estimated intent (informational vs transactional).
2. Exact fix suggestions for each page with a 'meta_title', 'meta_description', 'schema_markup', 'missing_alt', 'broken_link', 'heading_structure', 'canonical_tag', 'social_meta', or 'duplicate_content' issue.
   - For 'meta_title' issues: Provide an optimized title tag between 30 and 60 characters.
   - For 'meta_description' issues: Provide an optimized meta description between 120 and 160 characters.
   - For 'schema_markup' issues: Provide a valid schema.org JSON-LD markup string. Select the correct schema type based on the actual page content and catalog: a product page -> Product schema, a service page -> Service schema, a page with Q&A -> FAQPage schema, any page (site-level) -> Organization schema, BreadcrumbList schema if clear page hierarchy exists. Never generate a type that doesn't match the page content (e.g. no Product schema on blog posts).
   - For 'missing_alt' issues: Provide an optimized alt text suggestion for the image.
   - For 'broken_link' issues: Provide a recommended action or a suggested replacement URL if obvious from context.
   - For 'heading_structure' issues: Provide a corrected heading structure outline suggestion (e.g. H1: title, H2: subtitle).
   - For 'canonical_tag' issues: Provide the corrected self-referencing HTML canonical snippet link.
   - For 'social_meta' issues: Provide the missing OpenGraph / Twitter meta HTML snippets (og:title, og:description, etc.).
   - For 'duplicate_content' issues: Provide a suggested unique title or meta description alternative to resolve duplication.
   Ensure the 'targetUrl' and 'type' keys in the 'fixes' array match exactly with the 'targetUrl' and 'type' keys from the issues list so they can be matched correctly.
3. Two (2) high-quality draft blog posts targeting content gaps or educational queries for the users of this business to drive organic search growth. Write content in WordPress-compatible HTML format (wrap blocks in standard tags or Guttenberg comments like <!-- wp:paragraph -->). Each blog post must be built around one of the identified quick-win keywords.

Return the suggestions formatted EXACTLY as a JSON object matching this schema:
{
  "keywordOpportunities": [
    { "keyword": "string", "rationale": "string", "intent": "informational" | "transactional" }
  ],
  "fixes": [
    { "targetUrl": "string", "type": "meta_title" | "meta_description" | "schema_markup" | "missing_alt" | "broken_link" | "heading_structure" | "canonical_tag" | "social_meta" | "duplicate_content", "suggestedValue": "string" }
  ],
  "blogPosts": [
    { "title": "string", "content": "string", "suggestedSlug": "string", "targetKeyword": "string" }
  ]
}
`;

    let attempt = 1;
    let validationFailuresMap: Record<number, string[]> = {};
    let validationChecksMap: Record<number, any> = {};
    let hasFailures = false;

    while (attempt <= 2) {
      let currentPrompt = systemPrompt;
      if (attempt === 2) {
        const failureText = Object.entries(validationFailuresMap)
          .map(([idx, fails]) => `Blog Post #${Number(idx) + 1} ("${aiResponse.blogPosts[idx]?.title || "Untitled"}") failed the following SEO rules:\n${fails.map(f => `- ${f}`).join("\n")}`)
          .join("\n\n");
        
        currentPrompt += `\n\n[WARNING] Your previous generation attempt failed validation:\n${failureText}\n\nPlease correct all listed errors and resubmit the complete, corrected JSON. Ensure all constraints (title length, meta length, word count, H1, internal/external links) are fully met.`;
      }

      aiResponse = await generateStructuredJson<any>(currentPrompt, geminiResponseSchema, userId);
      
      validationFailuresMap = {};
      validationChecksMap = {};
      hasFailures = false;

      if (aiResponse.blogPosts && aiResponse.blogPosts.length > 0) {
        for (let i = 0; i < aiResponse.blogPosts.length; i++) {
          const post = aiResponse.blogPosts[i];
          const opp = aiResponse.keywordOpportunities?.find(
            (o: any) => o.keyword === post.targetKeyword
          );
          const intent = opp ? opp.intent : "informational";
          
          const validation = validateSeoContent({
            title: post.title,
            content: post.content,
            metaDescription: post.metaDescription,
            targetKeyword: post.targetKeyword,
            intent,
          }, cleanUrl);
          
          if (!validation.passed) {
            validationFailuresMap[i] = validation.failures;
            hasFailures = true;
          }
          validationChecksMap[i] = validation.checks;
        }
      }
      
      if (!hasFailures) {
        break; // All passed
      }
      
      attempt++;
    }

    // Save Page/Meta/Alt/Link Fixes
    if (aiResponse.fixes && aiResponse.fixes.length > 0) {
      for (const fix of aiResponse.fixes) {
        const relatedIssue = auditResults.issues.find(
          (issue) => issue.targetUrl === fix.targetUrl && issue.type === fix.type
        );
        const currentValue = relatedIssue ? JSON.stringify(relatedIssue.currentValue) : "";

        const scores = getPriorityScoring(fix.type);
        await prisma.auditItem.create({
          data: {
            auditId: audit.id,
            siteId: site.id,
            type: fix.type,
            targetUrl: fix.targetUrl,
            currentValue: currentValue,
            suggestedValue: fix.suggestedValue,
            status: "pending",
            priority: scores.priority,
            impactScore: scores.impactScore,
            difficultyScore: scores.difficultyScore,
          },
        });
      }
    }

    // Save Blog Post suggestions
    if (aiResponse.blogPosts && aiResponse.blogPosts.length > 0) {
      for (let i = 0; i < aiResponse.blogPosts.length; i++) {
        const post = aiResponse.blogPosts[i];
        const sanitizedContent = sanitizeHtml(post.content);
        const failures = validationFailuresMap[i] || [];
        let warning = failures.length > 0
          ? "This draft doesn't fully meet SEO best practices, review before publishing"
          : null;

        let finalContent = sanitizedContent;
        const accessKey = process.env.UNSPLASH_ACCESS_KEY;
        if (!accessKey || accessKey === "mock-key") {
          const skipMsg = "Image insertion skipped because UNSPLASH_ACCESS_KEY is not configured.";
          warning = warning ? `${warning}. ${skipMsg}` : skipMsg;
        } else {
          try {
            const queryTerm = post.targetKeyword || post.title || "business";
            const images = await searchRelevantImages(queryTerm, 2);

            if (images.length > 0) {
              const img1 = images[0];
              const alt1 = `Illustration for ${post.targetKeyword || post.title}`;
              const fig1 = `
<figure class="wp-block-image aligncenter size-large">
  <img src="${img1.url}" alt="${alt1}" />
  <figcaption>Photo by <a href="${img1.photographerLink}?utm_source=heydrona&utm_medium=referral" target="_blank" rel="noopener">${img1.photographerName}</a> on <a href="https://unsplash.com/?utm_source=heydrona&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a></figcaption>
</figure>
`;
              // Prepend image 1
              finalContent = fig1 + finalContent;

              if (images.length > 1) {
                const img2 = images[1];
                const alt2 = `Additional photo supporting ${post.targetKeyword || post.title}`;
                const fig2 = `
<figure class="wp-block-image aligncenter size-large">
  <img src="${img2.url}" alt="${alt2}" />
  <figcaption>Photo by <a href="${img2.photographerLink}?utm_source=heydrona&utm_medium=referral" target="_blank" rel="noopener">${img2.photographerName}</a> on <a href="https://unsplash.com/?utm_source=heydrona&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a></figcaption>
</figure>
`;
                // Insert image 2 before the first H2 tag, or if none, append
                if (finalContent.includes("<h2>")) {
                  finalContent = finalContent.replace("<h2>", `${fig2}\n<h2>`);
                } else if (finalContent.includes("<!-- wp:heading -->")) {
                  finalContent = finalContent.replace("<!-- wp:heading -->", `${fig2}\n<!-- wp:heading -->`);
                } else {
                  finalContent = finalContent + fig2;
                }
              }
            } else {
              const skipMsg = "No relevant images found on Unsplash for this topic.";
              warning = warning ? `${warning}. ${skipMsg}` : skipMsg;
            }
          } catch (imgErr) {
            console.error("[Unsplash Content Embed Error]:", imgErr);
          }
        }

        const scores = getPriorityScoring("blog_post");
        await prisma.auditItem.create({
          data: {
            auditId: audit.id,
            siteId: site.id,
            type: "blog_post",
            targetUrl: `${cleanUrl}/blog/${post.suggestedSlug}`,
            currentValue: JSON.stringify({ status: "not_created" }),
            suggestedValue: JSON.stringify({
              title: post.title,
              content: finalContent,
              slug: post.suggestedSlug,
              targetKeyword: post.targetKeyword,
              metaDescription: post.metaDescription,
              wordCount: post.wordCount,
              internalLinksUsed: post.internalLinksUsed,
              externalLinksUsed: post.externalLinksUsed,
              suggestedSchema: post.suggestedSchema,
              validation: validationChecksMap[i] ? {
                ...validationChecksMap[i],
                failures: validationFailuresMap[i] || [],
              } : null,
            }),
            status: "pending",
            contentQualityWarning: warning,
            priority: scores.priority,
            impactScore: scores.impactScore,
            difficultyScore: scores.difficultyScore,
          },
        });
      }
    }

    // Save Keyword Opportunities
    if (aiResponse.keywordOpportunities && aiResponse.keywordOpportunities.length > 0) {
      for (const opp of aiResponse.keywordOpportunities) {
        const matchedGsc = updatedSite.gscConnected
          ? gscSnapshotData.find(g => g.query.toLowerCase().trim() === opp.keyword.toLowerCase().trim())
          : null;
        
        const source = matchedGsc ? "gsc_verified" : "ai_suggested";
        
        const suggestedValueObj: any = {
          keyword: opp.keyword,
          rationale: opp.rationale,
          intent: opp.intent,
        };
        
        if (matchedGsc) {
          suggestedValueObj.position = matchedGsc.position;
          suggestedValueObj.impressions = matchedGsc.impressions;
          suggestedValueObj.clicks = matchedGsc.clicks;
          suggestedValueObj.ctr = matchedGsc.ctr;
        }

        const scores = getPriorityScoring("keyword_opportunity");
        await prisma.auditItem.create({
          data: {
            auditId: audit.id,
            siteId: site.id,
            type: "keyword_opportunity",
            targetUrl: cleanUrl,
            currentValue: "",
            suggestedValue: JSON.stringify(suggestedValueObj),
            status: "pending",
            source: source,
            priority: scores.priority,
            impactScore: scores.impactScore,
            difficultyScore: scores.difficultyScore,
          },
        });
      }
    }
  } catch (aiError: any) {
    console.error("[runAudit] AI step failed:", aiError);
    aiScanError = aiError?.message || "AI scan step failed.";
  }

  // Save mechanical/informational issues directly
  try {
    const directIssues = auditResults.issues.filter(issue =>
      ["insecure_link", "image_weight", "robots_sitemap", "mobile_viewport_missing", "hreflang_missing", "orphan_page", "missing_security_headers", "js_rendering_risk", "generic_anchor_text"].includes(issue.type)
    );
    for (const issue of directIssues) {
      if (issue.type === "robots_sitemap" && issue.currentValue?.path === "/sitemap.xml") {
        continue;
      }
      
      let suggestedText = issue.suggestedValue?.action || issue.suggestedValue;
      if (issue.type === "robots_sitemap" && issue.currentValue?.path === "/robots.txt") {
        suggestedText = `Create a robots.txt file at ${cleanUrl}/robots.txt with: \n\nUser-agent: *\nAllow: /\n\nSitemap: ${cleanUrl}/sitemap.xml`;
      }

      const scores = getPriorityScoring(issue.type);
      await prisma.auditItem.create({
        data: {
          auditId: audit.id,
          siteId: site.id,
          type: issue.type,
          targetUrl: issue.targetUrl,
          currentValue: JSON.stringify(issue.currentValue),
          suggestedValue: suggestedText,
          status: "pending",
          priority: scores.priority,
          impactScore: scores.impactScore,
          difficultyScore: scores.difficultyScore,
        },
      });
    }

    const hasSitemapIssue = auditResults.issues.some(
      (issue) => issue.type === "robots_sitemap" && issue.currentValue?.path === "/sitemap.xml"
    );
    if (hasSitemapIssue) {
      const urlsXml = crawledPages.map(p => `  <url>\n    <loc>${p.url}</loc>\n  </url>`).join("\n");
      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
      
      const scores = getPriorityScoring("robots_sitemap");
      await prisma.auditItem.create({
        data: {
          auditId: audit.id,
          siteId: site.id,
          type: "robots_sitemap",
          targetUrl: cleanUrl,
          currentValue: JSON.stringify({ path: "/sitemap.xml", missing: true }),
          suggestedValue: sitemapXml,
          status: "pending",
          priority: scores.priority,
          impactScore: scores.impactScore,
          difficultyScore: scores.difficultyScore,
        },
      });
    }
  } catch (saveErr) {
    console.error("[runAudit] Direct issues save failed:", saveErr);
  }

  // Google PageSpeed Insights Step
  let psData: any = null;
  let pageSpeedScanError: string | null = null;

  try {
    console.log(`[runAudit] Running PageSpeed Insights scan for: ${cleanUrl}`);
    psData = await getPageSpeedData(cleanUrl);
  } catch (psiError: any) {
    console.error("[runAudit] PageSpeed step failed:", psiError);
    pageSpeedScanError = psiError?.message || "Google PageSpeed Insights scan step failed.";
  }

  // Generate internal linking suggestions if AI succeeded
  if (!aiScanError && crawledPages.length > 2) {
    console.log(`[runAudit] Generating AI internal linking suggestions...`);
    const pagesSummary = crawledPages.map(p => ({
      url: p.url,
      title: p.title,
      existingInternalLinksOut: p.internalLinks
    }));

    const internalLinkingSchema = {
      type: "OBJECT",
      properties: {
        suggestions: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              fromUrl: { type: "STRING" },
              toUrl: { type: "STRING" },
              anchorText: { type: "STRING" },
              reason: { type: "STRING" },
            },
            required: ["fromUrl", "toUrl", "anchorText", "reason"],
          },
        },
      },
      required: ["suggestions"],
    };

    const linkingPrompt = `
You are an expert SEO strategist. Analyze the following pages crawled from a website and suggest 3-5 high-value internal links that do NOT already exist, where the source page and target page topics are clearly related to improve navigation and distribute page authority.

Pages structure:
${JSON.stringify(pagesSummary, null, 2)}

Provide suggestions as a JSON object matching this schema:
{
  "suggestions": [
    { "fromUrl": "string", "toUrl": "string", "anchorText": "string", "reason": "string" }
  ]
}
`;

    try {
      const linkingResponse = await generateStructuredJson<{
        suggestions: { fromUrl: string; toUrl: string; anchorText: string; reason: string }[];
      }>(linkingPrompt, internalLinkingSchema, userId);

      if (linkingResponse.suggestions && linkingResponse.suggestions.length > 0) {
        for (const sug of linkingResponse.suggestions) {
          const scores = getPriorityScoring("internal_linking");
          await prisma.auditItem.create({
            data: {
              auditId: audit.id,
              siteId: site.id,
              type: "internal_linking",
              targetUrl: sug.fromUrl,
              currentValue: "",
              suggestedValue: JSON.stringify({
                toUrl: sug.toUrl,
                anchorText: sug.anchorText,
                reason: sug.reason,
              }),
              status: "pending",
              priority: scores.priority,
              impactScore: scores.impactScore,
              difficultyScore: scores.difficultyScore,
            },
          });
        }
      }
    } catch (linkErr) {
      console.error("[runAudit] Internal Linking AI Error:", linkErr);
    }
  }

  // 8. Update Audit record to completed/failed state
  const completedAudit = await prisma.audit.update({
    where: { id: audit.id },
    data: {
      scorePerformance: psData?.scorePerformance ?? 0,
      scoreSeoGoogle: psData?.scoreSeoGoogle ?? null,
      scoreAccessibility: psData?.scoreAccessibility ?? null,
      scoreBestPractices: psData?.scoreBestPractices ?? null,
      lcpSeconds: psData?.lcpSeconds ?? null,
      clsScore: psData?.clsScore ?? null,
      inpMilliseconds: psData?.inpMilliseconds ?? null,
      aiScanError,
      pageSpeedScanError,
      status: (aiScanError && pageSpeedScanError) ? "failed" : "completed",
    },
    include: {
      items: true,
    },
  });

  // 9. Send notification email
  console.log(`[Email Notification] Sending ready alert: Hello! Your audit for ${cleanUrl} is ready. View fixes here: http://localhost:3000/dashboard`);

  return completedAudit;
}
