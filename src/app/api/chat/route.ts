import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { generateContent } from "@/lib/aiProvider";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const isAdmin = currentUser.isAdmin || (currentUser.email && currentUser.email.toLowerCase() === "vineetkpe@gmail.com");
    if (!isAdmin) {
      const allowed = await checkRateLimit(currentUser.id, "chat", 30, 60);
      if (!allowed) {
        return NextResponse.json(
          { error: "Too many chat messages. Limit is 30 messages per hour." },
          { status: 429 }
        );
      }
    }

    const limits = getEffectivePlanLimits(currentUser);
    if (!limits.chatbot) {
      return NextResponse.json(
        {
          error: "plan_limit",
          message: "The AI chat assistant requires a paid plan. Please upgrade to access this feature.",
        },
        { status: 403 }
      );
    }

    const { messages, siteId } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
    }

    // 1. Fetch site context
    let site;
    if (siteId) {
      site = await prisma.site.findFirst({
        where: { id: siteId, userId: currentUser.id },
        include: {
          audits: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { items: true },
          },
        },
      });
    } else {
      site = await prisma.site.findFirst({
        where: { userId: currentUser.id },
        orderBy: { createdAt: "desc" },
        include: {
          audits: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { items: true },
          },
        },
      });
    }

    const latestAudit = site?.audits?.[0];
    const auditSummary = latestAudit ? {
      scorePerformance: latestAudit.scorePerformance,
      scoreSeo: latestAudit.scoreSeo,
      lcpSeconds: latestAudit.lcpSeconds,
      clsScore: latestAudit.clsScore,
      inpMilliseconds: latestAudit.inpMilliseconds,
      issues: latestAudit.items.map(item => ({
        type: item.type,
        targetUrl: item.targetUrl,
        status: item.status,
        currentValue: item.currentValue ? item.currentValue.substring(0, 150) : "",
        suggestedValue: item.suggestedValue ? item.suggestedValue.substring(0, 150) : "",
      })),
    } : null;

    // Fetch history of all audits for the chatbot context
    const pastAudits = site ? await prisma.audit.findMany({
      where: { siteId: site.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        scorePerformance: true,
        scoreSeo: true,
        createdAt: true,
      },
    }) : [];

    const businessProfile = site?.businessProfile ? JSON.parse(site.businessProfile) : null;

    // Construct the context prompt containing history
    const historyText = messages
      .map((m: any) => `${m.role === "user" ? "User" : "AI Assistant"}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = `
You are the AI Growth Assistant (Antigravity Employee) for the website: ${site?.url || "crawled site"}.

Here is the Active Site Summary:
- Website URL: ${site?.url || "None connected"}
- WordPress connected: ${site?.wpUrl ? "Yes" : "No"}
- Total historical scans run: ${pastAudits.length}

Here is the Discovered Business Intelligence Profile for this site:
- Industry: ${businessProfile?.industry || "Unknown"}
- Category: ${businessProfile?.category || "Unknown"}
- Company Summary: ${businessProfile?.summary || "Unknown"}
- Products Offered: ${businessProfile?.products?.join(", ") || "None listed"}
- Services Offered: ${businessProfile?.services?.join(", ") || "None listed"}
- Target Audience: ${businessProfile?.targetAudience || "Unknown"}
- Brand Voice/Tone: ${businessProfile?.brandVoice || "Neutral"}
- Unique Selling Points (USPs): ${businessProfile?.usps?.join(" | ") || "None"}
- Competitors: ${businessProfile?.competitors?.join(", ") || "None inferred"}
- Profile Scan Confidence: ${businessProfile?.confidenceScore || 0.0}

User's Custom Instructions & Guidelines for you:
"${site?.customInstructions || "No custom instructions provided yet."}"
Please align your suggestions and explanations strictly with the user's instructions and business profile above!

Here is the details of every historical crawl audit run on this site:
${JSON.stringify(pastAudits, null, 2)}

Here is the latest/currently loaded SEO & Performance Audit data for the site:
${JSON.stringify(auditSummary, null, 2)}

Chatbot Interaction Style Guide (CRITICAL):
1. Answer ONLY what is specifically asked. Do NOT dump extra lists, metrics, or detailed guides unless the user explicitly requests them.
2. Keep your answers brief, straight to the point, and highly conversational.
3. Only provide a detailed or long-form answer when the user specifically requests "in detail", "give me details", or "explain fully".
4. If a query could warrant a long explanation, provide a short summary first and ask the user: "Would you like me to go into more detail about this?"
5. If the audit data is null or empty, kindly prompt the user to start a crawl audit using the "Site Crawler" tab on the dashboard so we can get audit reports to analyze.
6. If the user gives you suggestions, comments, or instructions on what to do (e.g. "Focus on content gaps" or "Optimize specific images"), acknowledge their instructions politely and confirm that you will prioritize these guidelines in future crawlers and content generation cycles.

Below is the conversation history:
${historyText}

Please reply to the user's latest message as the AI Assistant following the Style Guide. Keep your response concise, clean, professional, and formatted in clean markdown.
`;

    const reply = await generateContent(systemPrompt, currentUser.id);
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("[Chat API Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat request." },
      { status: 500 }
    );
  }
}
