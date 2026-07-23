import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/user";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const windowDays = parseInt(searchParams.get("window") || "30", 10);
    const sinceDate = windowDays > 0 ? new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000) : new Date(0);

    // Fetch rate settings from AppSettings
    const settings: any = await prisma.appSettings.findFirst({ where: { id: "singleton" } });
    const rates: Record<string, { input: number; output: number }> = {
      gemini: {
        input: settings?.geminiInputRate ?? 0.15,
        output: settings?.geminiOutputRate ?? 0.60,
      },
      groq: {
        input: settings?.groqInputRate ?? 0.59,
        output: settings?.groqOutputRate ?? 0.79,
      },
      openrouter: {
        input: settings?.openrouterInputRate ?? 0.80,
        output: settings?.openrouterOutputRate ?? 0.80,
      },
    };

    const logs: any[] = await prisma.apiUsageLog.findMany({
      where: {
        createdAt: {
          gte: sinceDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const calculateCost = (provider: string, inputTokens?: number | null, outputTokens?: number | null) => {
      const pKey = (provider || "gemini").toLowerCase();
      const pRates = rates[pKey] || { input: 0.50, output: 0.50 };
      const inCost = ((inputTokens || 0) / 1000000) * pRates.input;
      const outCost = ((outputTokens || 0) / 1000000) * pRates.output;
      return inCost + outCost;
    };

    // 1. Group by User
    const userBreakdownMap = new Map<string, { userId: string; calls: number; inputTokens: number; outputTokens: number; cost: number }>();
    // 2. Group by Site
    const siteBreakdownMap = new Map<string, { siteId: string; calls: number; inputTokens: number; outputTokens: number; cost: number }>();
    // 3. Group by Feature
    const featureBreakdownMap = new Map<string, { featureTag: string; calls: number; inputTokens: number; outputTokens: number; cost: number }>();
    // 4. Group by Provider
    const providerBreakdownMap = new Map<string, { provider: string; calls: number; inputTokens: number; outputTokens: number; cost: number }>();
    // 5. Group by Model
    const modelBreakdownMap = new Map<string, { model: string; calls: number; inputTokens: number; outputTokens: number; cost: number }>();
    // 6. Daily Spend Trend
    const dailyTrendMap = new Map<string, { date: string; calls: number; cost: number; inputTokens: number; outputTokens: number }>();

    let totalCalls = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalEstimatedCost = 0;

    for (const log of logs) {
      totalCalls++;
      const inTok = log.inputTokens || 0;
      const outTok = log.outputTokens || 0;
      const cost = calculateCost(log.provider, inTok, outTok);

      totalInputTokens += inTok;
      totalOutputTokens += outTok;
      totalEstimatedCost += cost;

      // User
      const uKey = log.userId || "anonymous_or_system";
      const u = userBreakdownMap.get(uKey) || { userId: uKey, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      u.calls++;
      u.inputTokens += inTok;
      u.outputTokens += outTok;
      u.cost += cost;
      userBreakdownMap.set(uKey, u);

      // Site
      const sKey = log.siteId || "uncategorized_site";
      const s = siteBreakdownMap.get(sKey) || { siteId: sKey, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      s.calls++;
      s.inputTokens += inTok;
      s.outputTokens += outTok;
      s.cost += cost;
      siteBreakdownMap.set(sKey, s);

      // Feature
      const fKey = log.featureTag || "unspecified_feature";
      const f = featureBreakdownMap.get(fKey) || { featureTag: fKey, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      f.calls++;
      f.inputTokens += inTok;
      f.outputTokens += outTok;
      f.cost += cost;
      featureBreakdownMap.set(fKey, f);

      // Provider
      const pKey = log.provider || "unknown";
      const p = providerBreakdownMap.get(pKey) || { provider: pKey, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      p.calls++;
      p.inputTokens += inTok;
      p.outputTokens += outTok;
      p.cost += cost;
      providerBreakdownMap.set(pKey, p);

      // Model
      const mKey = log.model || "unspecified_model";
      const m = modelBreakdownMap.get(mKey) || { model: mKey, calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      m.calls++;
      m.inputTokens += inTok;
      m.outputTokens += outTok;
      m.cost += cost;
      modelBreakdownMap.set(mKey, m);

      // Daily Trend
      const dayStr = new Date(log.createdAt).toISOString().split("T")[0];
      const d = dailyTrendMap.get(dayStr) || { date: dayStr, calls: 0, cost: 0, inputTokens: 0, outputTokens: 0 };
      d.calls++;
      d.cost += cost;
      d.inputTokens += inTok;
      d.outputTokens += outTok;
      dailyTrendMap.set(dayStr, d);
    }

    // Top expensive requests (sort by (inputTokens + outputTokens) desc)
    const topExpensiveRequests = [...logs]
      .sort((a, b) => ((b.inputTokens || 0) + (b.outputTokens || 0)) - ((a.inputTokens || 0) + (a.outputTokens || 0)))
      .slice(0, 15)
      .map(l => ({
        id: l.id,
        createdAt: l.createdAt,
        provider: l.provider,
        model: l.model || "N/A",
        callType: l.callType,
        userId: l.userId || "N/A",
        siteId: l.siteId || "N/A",
        featureTag: l.featureTag || "N/A",
        inputTokens: l.inputTokens || 0,
        outputTokens: l.outputTokens || 0,
        totalTokens: (l.inputTokens || 0) + (l.outputTokens || 0),
        estimatedCost: calculateCost(l.provider, l.inputTokens, l.outputTokens),
      }));

    return NextResponse.json({
      summary: {
        windowDays,
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalEstimatedCost,
      },
      rates,
      userBreakdown: Array.from(userBreakdownMap.values()).sort((a, b) => b.cost - a.cost),
      siteBreakdown: Array.from(siteBreakdownMap.values()).sort((a, b) => b.cost - a.cost),
      featureBreakdown: Array.from(featureBreakdownMap.values()).sort((a, b) => b.cost - a.cost),
      providerBreakdown: Array.from(providerBreakdownMap.values()).sort((a, b) => b.cost - a.cost),
      modelBreakdown: Array.from(modelBreakdownMap.values()).sort((a, b) => b.cost - a.cost),
      dailyTrend: Array.from(dailyTrendMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      topExpensiveRequests,
    });
  } catch (error) {
    console.error("[Admin AI Cost Stats Error]:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch AI cost statistics." },
      { status: 500 }
    );
  }
}
