import { NextResponse } from "next/server";
import { crawlSite } from "@/lib/crawler";
import { runSeoAudits } from "@/lib/seoChecks";
import { generateStructuredJson } from "@/lib/aiProvider";
import { analyzeBusinessProfile } from "@/lib/businessIntelligence";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { sanitizeHtml } from "@/lib/sanitizer";
import { checkRateLimit } from "@/lib/rateLimit";
import { fetchSearchConsoleData } from "@/lib/googleSearchConsole";
import { validateSeoContent } from "@/lib/contentValidator";

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

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedSiteId = searchParams.get("siteId");
    const requestedAuditId = searchParams.get("auditId");

    let site;
    if (requestedSiteId) {
      site = await prisma.site.findFirst({
        where: { id: requestedSiteId, userId: currentUser.id },
        select: {
          id: true,
          url: true,
          wpUrl: true,
          wpUsername: true,
          customInstructions: true,
          gscConnected: true,
          gscUrl: true,
          businessProfile: true,
          wpConnectedAt: true,
          detectedSeoPlugin: true,
          uptimeMonitoringEnabled: true,
          currentUptimeStatus: true,
          lastUptimeCheckAt: true,
          createdAt: true,
        },
      });
    } else {
      site = await prisma.site.findFirst({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          url: true,
          wpUrl: true,
          wpUsername: true,
          customInstructions: true,
          gscConnected: true,
          gscUrl: true,
          businessProfile: true,
          wpConnectedAt: true,
          detectedSeoPlugin: true,
          uptimeMonitoringEnabled: true,
          currentUptimeStatus: true,
          lastUptimeCheckAt: true,
          createdAt: true,
        },
      });
    }

    const allSites = await prisma.site.findMany({
      where: { userId: currentUser.id },
      select: {
        id: true,
        url: true,
        wpUrl: true,
        wpUsername: true,
        customInstructions: true,
        gscConnected: true,
        gscUrl: true,
        businessProfile: true,
        wpConnectedAt: true,
        detectedSeoPlugin: true,
        uptimeMonitoringEnabled: true,
        currentUptimeStatus: true,
        lastUptimeCheckAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!site) {
      return NextResponse.json({ site: null, audit: null, pastAudits: [], allSites });
    }

    const latestAudit = await prisma.audit.findFirst({
      where: requestedAuditId 
        ? { id: requestedAuditId, siteId: site.id }
        : { siteId: site.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    const pastAudits = await prisma.audit.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        scorePerformance: true,
        scoreSeo: true,
        scoreSeoGoogle: true,
        scoreAccessibility: true,
        scoreBestPractices: true,
        lcpSeconds: true,
        clsScore: true,
        inpMilliseconds: true,
        aiScanError: true,
        pageSpeedScanError: true,
        createdAt: true,
        status: true,
      },
    });

    // Build Activity Log
    const siteAudits = await prisma.audit.findMany({
      where: { siteId: site.id },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const siteAuditItems = await prisma.auditItem.findMany({
      where: { siteId: site.id },
      orderBy: { updatedAt: "desc" },
    });

    const activityLog: any[] = [];

    // Add audits
    for (const aud of siteAudits) {
      if (aud.status === "completed") {
        activityLog.push({
          id: `audit-${aud.id}`,
          type: "audit_completed",
          timestamp: aud.createdAt,
          title: "Crawl completed",
          detail: `Found ${aud._count.items} issues/recommendations.`,
        });
      }
    }

    // Add status transitions
    for (const item of siteAuditItems) {
      if (item.status === "applied") {
        let postTitle = "";
        let wpLink = "";
        if (item.type === "blog_post" && item.suggestedValue) {
          try {
            const parsed = JSON.parse(item.suggestedValue);
            postTitle = parsed.title || "";
            wpLink = parsed.wpLink || "";
          } catch {}
        }
        activityLog.push({
          id: `apply-${item.id}`,
          type: "item_applied",
          timestamp: item.appliedAt || item.updatedAt,
          title: item.type === "blog_post" 
            ? `Published to WordPress: ${postTitle || "Blog Post"}` 
            : `Applied fix: ${item.type.replace("_", " ")}`,
          detail: `For ${item.targetUrl}`,
          link: wpLink || undefined,
        });
      } else if (item.status === "approved") {
        activityLog.push({
          id: `approve-${item.id}`,
          type: "item_approved",
          timestamp: item.updatedAt,
          title: `Approved: ${item.type.replace("_", " ")}`,
          detail: `For ${item.targetUrl}`,
        });
      } else if (item.status === "rejected") {
        activityLog.push({
          id: `reject-${item.id}`,
          type: "item_rejected",
          timestamp: item.updatedAt,
          title: `Rejected: ${item.type.replace("_", " ")}`,
          detail: `For ${item.targetUrl}`,
        });
      }
    }

    // Add WP connection event
    if (site.wpConnectedAt) {
      activityLog.push({
        id: `wp-conn-${site.id}`,
        type: "wp_connected",
        timestamp: site.wpConnectedAt,
        title: "Connected to WordPress",
        detail: `Credentials configured for ${site.wpUrl}`,
      });
    }

    // Sort by timestamp desc
    activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const uptimeChecks = site ? await prisma.uptimeCheck.findMany({
      where: { siteId: site.id },
      orderBy: { checkedAt: "desc" },
      take: 1000,
    }) : [];

    return NextResponse.json({
      site,
      audit: latestAudit,
      pastAudits,
      allSites,
      activityLog,
      uptimeChecks,
      user: {
        email: currentUser.email,
        subscriptionActive: currentUser.subscriptionActive,
        isAdmin: currentUser.isAdmin,
        plan: currentUser.plan,
        onboardingCompletedAt: currentUser.onboardingCompletedAt,
        lastNotificationCheckAt: currentUser.lastNotificationCheckAt,
      },
    });
  } catch (error: any) {
    console.error("[Audit Get Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard data." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { url, targetKeyword } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing website URL parameter" }, { status: 400 });
    }

    // Normalize URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }
    const cleanUrl = new URL(targetUrl).origin;

    // SSRF Check on audit start
    if (!(await isSafeUrlToFetch(cleanUrl))) {
      return NextResponse.json({ error: "Unsafe website URL provided." }, { status: 400 });
    }

    // 2. Fetch or create Site
    let site = await prisma.site.findFirst({
      where: {
        userId: currentUser.id,
        url: cleanUrl,
      },
    });

    // COST-1: Add a per-site audit cooldown to prevent cost/quota abuse
    const limits = getEffectivePlanLimits(currentUser);
    const isAdmin = currentUser.isAdmin || (currentUser.email && currentUser.email.toLowerCase() === "vineetkpe@gmail.com");

    if (!isAdmin) {
      const allowed = await checkRateLimit(currentUser.id, "audit", 10, 60);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many audit requests. Limit is 10 audits per hour." },
          { status: 429 }
        );
      }
    }

    if (!isAdmin) {
      // ENFORCE-2: Lifetime audit cap for free-tier users (plan is null)
      if (!currentUser.plan) {
        const completedAuditsCount = await prisma.audit.count({
          where: {
            site: {
              userId: currentUser.id,
            },
            status: "completed",
          },
        });
        if (completedAuditsCount >= 1) {
          return NextResponse.json(
            {
              error: "upgrade_required",
              message: "Free tier is limited to 1 lifetime completed audit. Please upgrade to run additional audits.",
            },
            { status: 402 }
          );
        }
      }

      if (site) {
        const latestAudit = await prisma.audit.findFirst({
          where: { siteId: site.id },
          orderBy: { createdAt: "desc" },
        });

        if (latestAudit) {
          let cooldownMinutes = limits.cooldownMinutes;

          // (1) AppSettings.auditCooldownMinutes if explicitly set by admin wins
          try {
            const settings = await prisma.appSettings.findFirst({
              where: { id: "singleton" }
            });
            if (settings && settings.auditCooldownMinutes !== null && settings.auditCooldownMinutes !== undefined) {
              cooldownMinutes = settings.auditCooldownMinutes;
            }
          } catch (settingsErr) {
            console.error("[Audit Route] Failed to load AppSettings:", settingsErr);
          }

          // If no admin settings, fallback to (3) env AUDIT_COOLDOWN_MINUTES default
          if (cooldownMinutes === null || cooldownMinutes === undefined) {
            if (process.env.AUDIT_COOLDOWN_MINUTES) {
              cooldownMinutes = parseInt(process.env.AUDIT_COOLDOWN_MINUTES, 10);
            } else {
              cooldownMinutes = 5; // global safety default fallback
            }
          }

          const nextAllowedTime = latestAudit.createdAt.getTime() + cooldownMinutes * 60 * 1000;
          const now = Date.now();
          if (now < nextAllowedTime) {
            const diffMs = nextAllowedTime - now;
            const diffMins = Math.ceil(diffMs / 60000);
            return NextResponse.json(
              { error: `Site was audited recently. Please wait ${diffMins} minute(s) before running another audit.` },
              { status: 429 }
            );
          }
        }
      }
    }

    console.log(`[Audit Route] Starting audit pipeline for user ${currentUser.email} on: ${cleanUrl}`);

    // 3. Run crawler
    const crawlResult = await crawlSite(cleanUrl, 10); // cap at 10 pages for speed/testing
    const crawledPages = crawlResult.pages;
    const crawlerUsed = crawlResult.crawlerUsed;
    const crawlerWarning = crawlResult.crawlerWarning;

    if (crawledPages.length === 0) {
      return NextResponse.json({ error: `Could not fetch or crawl the site at ${cleanUrl}. Check if the URL is active.` }, { status: 422 });
    }

    // 4. Run Business Intelligence analysis
    let businessProfileData: string | null = null;
    let businessProfileError: string | null = null;
    try {
      console.log(`[Audit Route] Analyzing business profile for ${cleanUrl}...`);
      const profile = await analyzeBusinessProfile(crawledPages, cleanUrl, currentUser.id);
      businessProfileData = JSON.stringify(profile);
      console.log(`[Audit Route] Discovered Business Profile (Confidence: ${profile.confidenceScore}): ${profile.category}`);
    } catch (biError: any) {
      console.error("[Audit Route] Business Intelligence layer failure:", biError);
      businessProfileError = biError instanceof Error ? biError.message : String(biError);
    }

    // 5. Create or update Site record
    if (!site) {
      site = await prisma.site.create({
        data: {
          userId: currentUser.id,
          url: cleanUrl,
          businessProfile: businessProfileData,
        },
      });
    } else {
      const updateData: any = {};
      if (businessProfileData !== null) {
        updateData.businessProfile = businessProfileData;
      }
      site = await prisma.site.update({
        where: { id: site.id },
        data: updateData,
      });
    }

    // 6. Run local SEO audits
    const auditResults = await runSeoAudits(crawledPages, cleanUrl);

    // Fetch Google Search Console data if connected
    let gscSnapshotData: any[] = [];
    let gscPromptText = "";
    if (site.gscConnected) {
      try {
        console.log(`[Audit Route] Fetching GSC data for verified site URL: ${site.url}`);
        gscSnapshotData = await fetchSearchConsoleData(site);
        gscPromptText = `
Here is real search performance query ranking data fetched directly from Google Search Console for this site:
${JSON.stringify(gscSnapshotData, null, 2)}

INSTRUCTIONS FOR KEYWORD OPPORTUNITIES:
1. Prioritize suggested keyword opportunities for queries that are already ranking between positions 5 and 20 (page-1-adjacent keywords that have strong potential to rank higher with content optimization).
2. Suggest keyword opportunities for high-impression but low-CTR (click-through rate) queries, which indicate a metadata or snippet clickability problem rather than a ranking issue.
3. Every suggestion in 'keywordOpportunities' based on this verified data MUST have its source set to 'gsc_verified' and must include its current average position and impression counts inside the suggested value.
`;
      } catch (gscError: any) {
        console.error("[Audit Route] Search Console data fetch failed:", gscError);
        throw new Error(`Google Search Console data fetch failed: ${gscError.message || gscError}`);
      }
    } else {
      gscPromptText = `
Note: Google Search Console is NOT connected. You must generate keyword opportunities based ONLY on the business profile (industry, category, services, target audience, and target region/intent). Do NOT invent generic terms. Ground all keyword suggestions in the specific business's offerings. Every suggestion generated this way will be tagged as 'ai_suggested' and is considered unverified.
`;
    }

    // 5. Create Audit database record
    const audit = await prisma.audit.create({
      data: {
        siteId: site.id,
        scorePerformance: 0,
        scoreSeo: auditResults.scoreSeo,
        status: "pending",
        businessProfileError: businessProfileError,
        gscSnapshot: site.gscConnected ? JSON.stringify(gscSnapshotData) : null,
        crawlerUsed,
        crawlerWarning,
      },
    });

    // 6. Generate improvements using Gemini AI (AI Scan Step)
    let aiResponse: any = null;
    let aiScanError: string | null = null;

    try {
      console.log(`[Audit] Running AI content/fixes scan for: ${cleanUrl}`);
      const parsedProfile = businessProfileData ? JSON.parse(businessProfileData) : null;
      const profileText = parsedProfile ? `
Here is the Discovered Business Intelligence Profile for this company:
- Industry: ${parsedProfile.industry}
- Category: ${parsedProfile.category}
- Summary: ${parsedProfile.summary}
- Products: ${parsedProfile.products?.join(", ") || "None listed"}
- Services: ${parsedProfile.services?.join(", ") || "None listed"}
- Target Audience: ${parsedProfile.targetAudience}
- Brand Voice/Tone: ${parsedProfile.brandVoice}
- Unique Selling Points (USPs): ${parsedProfile.usps?.join(" | ") || "None"}
- Competitors: ${parsedProfile.competitors?.join(", ") || "None listed"}
` : "No explicit business profile discovered yet.";

      const targetKeywordRule = targetKeyword
        ? `\nCRITICAL REQUIRED TARGET KEYWORD: You MUST write one of the blog posts targeting the primary keyword "${targetKeyword}". This keyword must be the primary focus of that blog post.\n`
        : "";

      const systemPrompt = `
You are an expert AI Website Growth Agent specializing in Local Business SEO and Content Marketing.
We have audited the website: ${cleanUrl}.

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
   - For 'schema_markup' issues: Provide a valid schema.org LocalBusiness or Article JSON-LD markup string.
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

        aiResponse = await generateStructuredJson<any>(currentPrompt, geminiResponseSchema, currentUser.id);
        
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

          await prisma.auditItem.create({
            data: {
              auditId: audit.id,
              siteId: site.id,
              type: fix.type,
              targetUrl: fix.targetUrl,
              currentValue: currentValue,
              suggestedValue: fix.suggestedValue,
              status: "pending",
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
          const warning = failures.length > 0
            ? "This draft doesn't fully meet SEO best practices, review before publishing"
            : null;

          await prisma.auditItem.create({
            data: {
              auditId: audit.id,
              siteId: site.id,
              type: "blog_post",
              targetUrl: `${cleanUrl}/blog/${post.suggestedSlug}`,
              currentValue: JSON.stringify({ status: "not_created" }),
              suggestedValue: JSON.stringify({
                title: post.title,
                content: sanitizedContent,
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
            },
          });
        }
      }

      // Save Keyword Opportunities
      if (aiResponse.keywordOpportunities && aiResponse.keywordOpportunities.length > 0) {
        for (const opp of aiResponse.keywordOpportunities) {
          const matchedGsc = site.gscConnected
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
            },
          });
        }
      }
    } catch (aiError: any) {
      console.error("[Audit] AI step failed:", aiError);
      aiScanError = aiError?.message || "AI scan step failed.";
    }

    // Save mechanical/informational issues directly
    try {
      const directIssues = auditResults.issues.filter(issue =>
        ["insecure_link", "image_weight", "robots_sitemap"].includes(issue.type)
      );
      for (const issue of directIssues) {
        if (issue.type === "robots_sitemap" && issue.currentValue?.path === "/sitemap.xml") {
          continue;
        }
        
        let suggestedText = issue.suggestedValue?.action || issue.suggestedValue;
        if (issue.type === "robots_sitemap" && issue.currentValue?.path === "/robots.txt") {
          suggestedText = `Create a robots.txt file at ${cleanUrl}/robots.txt with: \n\nUser-agent: *\nAllow: /\n\nSitemap: ${cleanUrl}/sitemap.xml`;
        }

        await prisma.auditItem.create({
          data: {
            auditId: audit.id,
            siteId: site.id,
            type: issue.type,
            targetUrl: issue.targetUrl,
            currentValue: JSON.stringify(issue.currentValue),
            suggestedValue: suggestedText,
            status: "pending",
          },
        });
      }

      const hasSitemapIssue = auditResults.issues.some(
        (issue) => issue.type === "robots_sitemap" && issue.currentValue?.path === "/sitemap.xml"
      );
      if (hasSitemapIssue) {
        const urlsXml = crawledPages.map(p => `  <url>\n    <loc>${p.url}</loc>\n  </url>`).join("\n");
        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>`;
        
        await prisma.auditItem.create({
          data: {
            auditId: audit.id,
            siteId: site.id,
            type: "robots_sitemap",
            targetUrl: cleanUrl,
            currentValue: JSON.stringify({ path: "/sitemap.xml", missing: true }),
            suggestedValue: sitemapXml,
            status: "pending",
          },
        });
      }
    } catch (saveErr) {
      console.error("[Audit] Direct issues save failed:", saveErr);
    }

    // Google PageSpeed Insights Step
    let psData: any = null;
    let pageSpeedScanError: string | null = null;

    try {
      console.log(`[Audit] Running PageSpeed Insights scan for: ${cleanUrl}`);
      const { getPageSpeedData } = await import("@/lib/seoChecks");
      psData = await getPageSpeedData(cleanUrl);
    } catch (psiError: any) {
      console.error("[Audit] PageSpeed step failed:", psiError);
      pageSpeedScanError = psiError?.message || "Google PageSpeed Insights scan step failed.";
    }

    // Generate internal linking suggestions if AI succeeded
    if (!aiScanError && crawledPages.length > 2) {
      console.log(`[Audit] Generating AI internal linking suggestions...`);
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
        }>(linkingPrompt, internalLinkingSchema, currentUser.id);

        if (linkingResponse.suggestions && linkingResponse.suggestions.length > 0) {
          for (const sug of linkingResponse.suggestions) {
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
              },
            });
          }
        }
      } catch (linkErr) {
        console.error("[Internal Linking AI Error]:", linkErr);
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

    return NextResponse.json({
      success: true,
      audit: {
        id: completedAudit.id,
        siteId: completedAudit.siteId,
        scorePerformance: completedAudit.scorePerformance,
        scoreSeo: completedAudit.scoreSeo,
        scoreSeoGoogle: completedAudit.scoreSeoGoogle,
        scoreAccessibility: completedAudit.scoreAccessibility,
        scoreBestPractices: completedAudit.scoreBestPractices,
        lcpSeconds: completedAudit.lcpSeconds,
        clsScore: completedAudit.clsScore,
        inpMilliseconds: completedAudit.inpMilliseconds,
        aiScanError: completedAudit.aiScanError,
        pageSpeedScanError: completedAudit.pageSpeedScanError,
        status: completedAudit.status,
        createdAt: completedAudit.createdAt,
        items: completedAudit.items,
      },
    });

  } catch (error: any) {
    console.error("[Audit Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Audit run failed unexpectedly." },
      { status: 500 }
    );
  }
}
