interface GscQueryRow {
  query: string;
  position: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
}

export function computeRankingTrend(audits: any[]) {
  // Filter audits with a valid, non-empty gscSnapshot, and sort by createdAt ascending
  const usableAudits = audits
    .filter((a) => {
      if (!a.gscSnapshot) return false;
      try {
        const parsed = JSON.parse(a.gscSnapshot);
        return Array.isArray(parsed) && parsed.length > 0;
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (usableAudits.length < 2) {
    return {
      status: "not_enough_history_yet",
      topGainers: [],
      topLosers: [],
      visibilityScore: 0,
    };
  }

  // The most recent audit
  const recentAudit = usableAudits[usableAudits.length - 1];
  const recentQueries: GscQueryRow[] = JSON.parse(recentAudit.gscSnapshot);

  // Find baseline snapshot within 30-90 days window
  const recentDate = new Date(recentAudit.createdAt);
  const minDate = new Date(recentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
  const maxDate = new Date(recentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Find audit in [minDate, maxDate]
  let baselineAudit = usableAudits.find((a) => {
    const d = new Date(a.createdAt);
    return d >= minDate && d <= maxDate;
  });

  if (!baselineAudit) {
    // fallback to oldest available audit
    baselineAudit = usableAudits[0];
  }

  // Ensure baseline and recent are not the same
  if (baselineAudit.id === recentAudit.id) {
    return {
      status: "not_enough_history_yet",
      topGainers: [],
      topLosers: [],
      visibilityScore: 0,
    };
  }

  const baselineQueries: GscQueryRow[] = JSON.parse(baselineAudit.gscSnapshot);

  // Map baseline query to position
  const baselineMap = new Map<string, number>();
  for (const q of baselineQueries) {
    baselineMap.set(q.query.toLowerCase().trim(), q.position);
  }

  const queryChanges: { query: string; change: number; recentPos: number; baselinePos: number }[] = [];
  let queriesInTop10 = 0;

  for (const q of recentQueries) {
    const qKey = q.query.toLowerCase().trim();
    if (q.position >= 1 && q.position <= 10) {
      queriesInTop10++;
    }

    if (baselineMap.has(qKey)) {
      const baselinePos = baselineMap.get(qKey)!;
      const change = baselinePos - q.position; // pos improvement, e.g. 15 -> 5 is +10
      queryChanges.push({
        query: q.query,
        change,
        recentPos: q.position,
        baselinePos,
      });
    }
  }

  // Sort changes: top gainers (positive change first)
  const sortedGainers = [...queryChanges]
    .filter((qc) => qc.change > 0)
    .sort((a, b) => b.change - a.change);

  // Sort changes: top losers (negative change first)
  const sortedLosers = [...queryChanges]
    .filter((qc) => qc.change < 0)
    .sort((a, b) => a.change - b.change);

  const visibilityScore = recentQueries.length > 0
    ? Math.round((queriesInTop10 / recentQueries.length) * 100)
    : 0;

  return {
    status: "success",
    topGainers: sortedGainers.slice(0, 5).map((g) => ({
      query: g.query,
      change: g.change,
      currentPosition: g.recentPos,
      previousPosition: g.baselinePos,
    })),
    topLosers: sortedLosers.slice(0, 5).map((l) => ({
      query: l.query,
      change: l.change,
      currentPosition: l.recentPos,
      previousPosition: l.baselinePos,
    })),
    visibilityScore,
  };
}

import { prisma } from "@/lib/prisma";

function normalizeUrl(url?: string): string {
  if (!url) return "";
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

function getAveragePositionForUrl(gscSnapshotRaw: string | null, targetUrl: string): number | null {
  if (!gscSnapshotRaw) return null;
  try {
    const rows = JSON.parse(gscSnapshotRaw);
    if (!Array.isArray(rows)) return null;

    const normTarget = normalizeUrl(targetUrl);
    const matchingRows = rows.filter((r: any) => {
      if (!r || typeof r.position !== "number") return false;
      if (r.page) {
        return normalizeUrl(r.page) === normTarget;
      }
      return false;
    });

    if (matchingRows.length === 0) return null;
    const totalPos = matchingRows.reduce((sum: number, r: any) => sum + r.position, 0);
    return totalPos / matchingRows.length;
  } catch {
    return null;
  }
}

/**
 * Evaluates outcome tags for applied AuditItems by comparing page GSC search positions
 * before vs after the fix was applied (requiring a post-fix audit at least 14 days after appliedAt).
 */
export async function evaluateAuditItemOutcomes(siteId?: string): Promise<{ evaluated: number; updated: number }> {
  const FourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  const whereClause: any = {
    appliedAt: { not: null },
    outcomeTag: null,
  };
  if (siteId) {
    whereClause.siteId = siteId;
  }

  const itemsToEvaluate = await prisma.auditItem.findMany({
    where: whereClause,
    take: 100,
  });

  let updatedCount = 0;

  for (const item of itemsToEvaluate) {
    if (!item.appliedAt) continue;

    const appliedTime = new Date(item.appliedAt).getTime();
    const minPostDate = new Date(appliedTime + FourteenDaysMs);

    // Find audit immediately BEFORE appliedAt
    const preAudit = await prisma.audit.findFirst({
      where: {
        siteId: item.siteId,
        createdAt: { lte: item.appliedAt },
      },
      orderBy: { createdAt: "desc" },
    });

    // Find audit at least 14 days AFTER appliedAt
    const postAudit = await prisma.audit.findFirst({
      where: {
        siteId: item.siteId,
        createdAt: { gte: minPostDate },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!preAudit || !postAudit || !preAudit.gscSnapshot || !postAudit.gscSnapshot) {
      if (postAudit && (preAudit?.gscSnapshot === null || postAudit?.gscSnapshot === null)) {
        await prisma.auditItem.update({
          where: { id: item.id },
          data: { outcomeTag: "insufficient_data" },
        });
        updatedCount++;
      }
      continue;
    }

    const prePos = getAveragePositionForUrl(preAudit.gscSnapshot, item.targetUrl);
    const postPos = getAveragePositionForUrl(postAudit.gscSnapshot, item.targetUrl);

    let tag: "improved" | "no_change" | "worsened" | "insufficient_data";

    if (prePos === null || postPos === null) {
      tag = "insufficient_data";
    } else {
      const diff = prePos - postPos; // Lower position number = better ranking (e.g. 10 -> 4 => +6)
      if (diff >= 1.0) {
        tag = "improved";
      } else if (diff <= -1.0) {
        tag = "worsened";
      } else {
        tag = "no_change";
      }
    }

    await prisma.auditItem.update({
      where: { id: item.id },
      data: { outcomeTag: tag },
    });
    updatedCount++;
  }

  return { evaluated: itemsToEvaluate.length, updated: updatedCount };
}
