import { NextResponse } from "next/server";
import { crawlSite } from "@/lib/crawler";
import { runSeoAudits } from "@/lib/seoChecks";
import { generateStructuredJson } from "@/lib/aiProvider";
import { analyzeBusinessProfile } from "@/lib/businessIntelligence";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";

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
          suggestedSlug: { type: "STRING" },
          targetKeyword: { type: "STRING" },
        },
        required: ["title", "content", "suggestedSlug", "targetKeyword"],
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

    return NextResponse.json({
      site,
      audit: latestAudit,
      pastAudits,
      allSites,
      activityLog,
      user: {
        email: currentUser.email,
        subscriptionActive: currentUser.subscriptionActive,
        isAdmin: currentUser.isAdmin,
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

    const { url } = await req.json();
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
    if (site) {
      const latestAudit = await prisma.audit.findFirst({
        where: { siteId: site.id },
        orderBy: { createdAt: "desc" },
      });

      if (latestAudit) {
        let cooldownMinutes = 5;
        try {
          const settings = await prisma.appSettings.findFirst({
            where: { id: "singleton" }
          });
          if (settings && settings.auditCooldownMinutes !== null && settings.auditCooldownMinutes !== undefined) {
            cooldownMinutes = settings.auditCooldownMinutes;
          } else if (process.env.AUDIT_COOLDOWN_MINUTES) {
            cooldownMinutes = parseInt(process.env.AUDIT_COOLDOWN_MINUTES, 10);
          }
        } catch (settingsErr) {
          console.error("[Audit Route] Failed to load AppSettings:", settingsErr);
          if (process.env.AUDIT_COOLDOWN_MINUTES) {
            cooldownMinutes = parseInt(process.env.AUDIT_COOLDOWN_MINUTES, 10);
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

    console.log(`[Audit Route] Starting audit pipeline for user ${currentUser.email} on: ${cleanUrl}`);

    // 3. Run crawler
    const crawledPages = await crawlSite(cleanUrl, 10); // cap at 10 pages for speed/testing
    if (crawledPages.length === 0) {
      return NextResponse.json({ error: `Could not fetch or crawl the site at ${cleanUrl}. Check if the URL is active.` }, { status: 422 });
    }

    // 4. Run Business Intelligence analysis
    let businessProfileData: string | null = null;
    try {
      console.log(`[Audit Route] Analyzing business profile for ${cleanUrl}...`);
      const profile = await analyzeBusinessProfile(crawledPages, cleanUrl, currentUser.id);
      businessProfileData = JSON.stringify(profile);
      console.log(`[Audit Route] Discovered Business Profile (Confidence: ${profile.confidenceScore}): ${profile.category}`);
    } catch (biError) {
      console.error("[Audit Route] Business Intelligence layer failure:", biError);
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
      site = await prisma.site.update({
        where: { id: site.id },
        data: {
          businessProfile: businessProfileData,
        },
      });
    }

    // 6. Run local SEO audits
    const auditResults = await runSeoAudits(crawledPages, cleanUrl);

    // 5. Create Audit database record
    const audit = await prisma.audit.create({
      data: {
        siteId: site.id,
        scorePerformance: 0,
        scoreSeo: auditResults.scoreSeo,
        status: "pending",
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

      const systemPrompt = `
You are an expert AI Website Growth Agent specializing in Local Business SEO and Content Marketing.
We have audited the website: ${cleanUrl}.

${profileText}

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

      aiResponse = await generateStructuredJson<{
        keywordOpportunities: { keyword: string; rationale: string; intent: string }[];
        fixes: { targetUrl: string; type: string; suggestedValue: string }[];
        blogPosts: { title: string; content: string; suggestedSlug: string; targetKeyword: string }[];
      }>(systemPrompt, geminiResponseSchema, currentUser.id);

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
        for (const post of aiResponse.blogPosts) {
          await prisma.auditItem.create({
            data: {
              auditId: audit.id,
              siteId: site.id,
              type: "blog_post",
              targetUrl: `${cleanUrl}/blog/${post.suggestedSlug}`,
              currentValue: JSON.stringify({ status: "not_created" }),
              suggestedValue: JSON.stringify({
                title: post.title,
                content: post.content,
                slug: post.suggestedSlug,
                targetKeyword: post.targetKeyword,
              }),
              status: "pending",
            },
          });
        }
      }

      // Save Keyword Opportunities
      if (aiResponse.keywordOpportunities && aiResponse.keywordOpportunities.length > 0) {
        for (const opp of aiResponse.keywordOpportunities) {
          await prisma.auditItem.create({
            data: {
              auditId: audit.id,
              siteId: site.id,
              type: "keyword_opportunity",
              targetUrl: cleanUrl,
              currentValue: "",
              suggestedValue: JSON.stringify({
                keyword: opp.keyword,
                rationale: opp.rationale,
                intent: opp.intent,
              }),
              status: "pending",
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
