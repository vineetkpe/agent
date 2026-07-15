import { NextResponse } from "next/server";
import { crawlSite } from "@/lib/crawler";
import { runSeoAudits } from "@/lib/seoChecks";
import { generateStructuredJson } from "@/lib/aiProvider";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";
import { isSafeUrlToFetch } from "@/lib/urlSafety";

// Define the response schema structure expected from Gemini
const geminiResponseSchema = {
  type: "OBJECT",
  properties: {
    fixes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          targetUrl: { type: "STRING" },
          type: { type: "STRING", enum: ["meta_title", "meta_description", "schema_markup", "missing_alt", "broken_link"] },
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
        },
        required: ["title", "content", "suggestedSlug"],
      },
    },
  },
  required: ["fixes", "blogPosts"],
};

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const site = await prisma.site.findFirst({
      where: { userId: currentUser.id },
      select: {
        id: true,
        url: true,
        wpUrl: true,
        wpUsername: true,
        createdAt: true,
      },
    });

    if (!site) {
      return NextResponse.json({ site: null, audit: null });
    }

    const latestAudit = await prisma.audit.findFirst({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      site,
      audit: latestAudit,
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
        const cooldownMinutes = parseInt(process.env.AUDIT_COOLDOWN_MINUTES || "5", 10);
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

    if (!site) {
      site = await prisma.site.create({
        data: {
          userId: currentUser.id,
          url: cleanUrl,
        },
      });
    }

    // 3. Run crawler
    const crawledPages = await crawlSite(cleanUrl, 10); // cap at 10 pages for speed/testing
    if (crawledPages.length === 0) {
      return NextResponse.json({ error: `Could not fetch or crawl the site at ${cleanUrl}. Check if the URL is active.` }, { status: 422 });
    }

    // 4. Run local SEO audits
    const auditResults = await runSeoAudits(crawledPages, cleanUrl);

    // 5. Create Audit database record
    const audit = await prisma.audit.create({
      data: {
        siteId: site.id,
        scorePerformance: auditResults.scorePerformance,
        scoreSeo: auditResults.scoreSeo,
        status: "pending",
      },
    });

    // 6. Generate improvements using Gemini AI
    const systemPrompt = `
You are an expert AI Website Growth Agent specializing in Local Business SEO and Content Marketing.
We have audited the website: ${cleanUrl}.
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
1. Exact fix suggestions for each page with a 'meta_title' or 'meta_description' or 'schema_markup' or 'missing_alt' or 'broken_link' issue.
   - For 'meta_title' issues: Provide an optimized title tag between 30 and 60 characters.
   - For 'meta_description' issues: Provide an optimized meta description between 120 and 160 characters.
   - For 'schema_markup' issues: Provide a valid schema.org LocalBusiness or Article JSON-LD markup string.
   - For 'missing_alt' issues: Provide an optimized alt text suggestion for the image.
   - For 'broken_link' issues: Provide a recommended action or a suggested replacement URL if obvious from context.
   Ensure the 'targetUrl' and 'type' keys in the 'fixes' array match exactly with the 'targetUrl' and 'type' keys from the issues list so they can be matched correctly.
2. Two (2) high-quality draft blog posts targeting content gaps or educational queries for the users of this business to drive organic search growth. Write content in WordPress-compatible HTML format (wrap blocks in standard tags or Guttenberg comments like <!-- wp:paragraph -->).

Return the suggestions formatted EXACTLY as a JSON object matching this schema:
{
  "fixes": [
    { "targetUrl": "string", "type": "meta_title" | "meta_description" | "schema_markup" | "missing_alt" | "broken_link", "suggestedValue": "string" }
  ],
  "blogPosts": [
    { "title": "string", "content": "string", "suggestedSlug": "string" }
  ]
}
`;

    const aiResponse = await generateStructuredJson<{
      fixes: { targetUrl: string; type: string; suggestedValue: string }[];
      blogPosts: { title: string; content: string; suggestedSlug: string }[];
    }>(systemPrompt, geminiResponseSchema, currentUser.id);

    // 7. Save pending items to the database
    const savedItems = [];

    // Save Page/Meta/Alt/Link Fixes
    if (aiResponse.fixes && aiResponse.fixes.length > 0) {
      for (const fix of aiResponse.fixes) {
        // Find corresponding issue current value
        const relatedIssue = auditResults.issues.find(
          (issue) => issue.targetUrl === fix.targetUrl && issue.type === fix.type
        );
        const currentValue = relatedIssue ? JSON.stringify(relatedIssue.currentValue) : "";

        const item = await prisma.auditItem.create({
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
        savedItems.push(item);
      }
    }

    // Save Blog Post suggestions
    if (aiResponse.blogPosts && aiResponse.blogPosts.length > 0) {
      for (const post of aiResponse.blogPosts) {
        const item = await prisma.auditItem.create({
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
            }),
            status: "pending",
          },
        });
        savedItems.push(item);
      }
    }

    // 8. Update Audit record to completed
    const completedAudit = await prisma.audit.update({
      where: { id: audit.id },
      data: { status: "completed" },
      include: { items: true },
    });

    // 9. Send notification email (logged for MVP/V1)
    console.log(`[Email Notification] Sending ready alert: Hello! Your audit for ${cleanUrl} is ready. View fixes here: http://localhost:3000/dashboard`);

    return NextResponse.json({
      success: true,
      audit: {
        id: completedAudit.id,
        scorePerformance: completedAudit.scorePerformance,
        scoreSeo: completedAudit.scoreSeo,
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
