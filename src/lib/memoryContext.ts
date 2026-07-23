import { prisma } from "@/lib/prisma";

export interface ParsedBusinessProfile {
  summary?: string;
  industry?: string;
  category?: string;
  products?: any[];
  services?: any[];
  targetAudience?: string;
  brandVoice?: any;
  usps?: string[];
  competitors?: string[];
  confidenceScore?: number;
  locationDetected?: string | null;
  languageDetected?: string;
  businessGoals?: string[];
}

export interface KnowledgeGraphSummary {
  totalNodes: number;
  totalEdges: number;
  countsByType: Record<string, number>;
}

export interface BoundedAuditSummary {
  id: string;
  createdAt: Date;
  scorePerformance: number;
  scoreSeo: number;
  scoreAccessibility: number | null;
  scoreBestPractices: number | null;
  cwv: {
    lcpSeconds: number | null;
    clsScore: number | null;
    inpMilliseconds: number | null;
  };
  gscSnapshot: any[] | null;
  openItemsCountByType: Record<string, number>;
  pendingItems: Array<{
    type: string;
    targetUrl: string;
    status: string;
    currentValue: string | null;
    suggestedValue: string | null;
  }>;
}

export interface WebsiteMemoryContext {
  siteId: string;
  url: string;
  businessProfile: ParsedBusinessProfile | null;
  knowledgeGraph: KnowledgeGraphSummary | null;
  audits: BoundedAuditSummary[];
}

/**
 * Builds a bounded Layer 2 memory context for a website.
 * Retrieves parsed business profile, knowledge graph node counts,
 * and up to `maxAudits` (default 5) recent audits with scores, CWV, GSC summary, and open AuditItems.
 * 
 * Read-only via Prisma -- no AI calls, no crawling, no database writes.
 * Gracefully handles sites with missing profiles or zero audit history.
 */
export async function buildWebsiteMemoryContext(
  siteId: string,
  options?: { maxAudits?: number }
): Promise<WebsiteMemoryContext> {
  const maxAudits = options?.maxAudits ?? 5;

  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        audits: {
          orderBy: { createdAt: "desc" },
          take: maxAudits,
          include: {
            items: {
              select: {
                id: true,
                type: true,
                targetUrl: true,
                status: true,
                currentValue: true,
                suggestedValue: true,
              },
            },
          },
        },
      },
    });

    if (!site) {
      return {
        siteId,
        url: "",
        businessProfile: null,
        knowledgeGraph: null,
        audits: [],
      };
    }

    // 1. Business Profile Parsing (reusing runAudit.ts logic pattern)
    let businessProfile: ParsedBusinessProfile | null = null;
    try {
      const manuallyEntered = site.manuallyEnteredContext
        ? JSON.parse(site.manuallyEnteredContext)
        : null;

      if (site.businessProfile) {
        businessProfile = JSON.parse(site.businessProfile);
      } else if (manuallyEntered) {
        businessProfile = {
          summary: manuallyEntered.description,
          industry: manuallyEntered.industry,
          category: manuallyEntered.industry,
          products: [],
          services: manuallyEntered.services || [],
          targetAudience: manuallyEntered.targetAudience,
          brandVoice: "Professional",
          usps: manuallyEntered.cityServiceArea
            ? [`Located in ${manuallyEntered.cityServiceArea}`]
            : [],
          competitors: [],
          confidenceScore: 1.0,
        };
      }
    } catch {
      businessProfile = null;
    }

    // Attach businessGoals if present
    if (site.businessGoals) {
      try {
        const parsedGoals = JSON.parse(site.businessGoals);
        if (!businessProfile) {
          businessProfile = { businessGoals: parsedGoals };
        } else {
          businessProfile.businessGoals = parsedGoals;
        }
      } catch {
        // ignore parse error
      }
    }

    // 2. Knowledge Graph Summary
    let knowledgeGraph: KnowledgeGraphSummary | null = null;
    if (site.knowledgeGraphData) {
      try {
        const rawGraph = JSON.parse(site.knowledgeGraphData);
        const nodes = Array.isArray(rawGraph?.nodes) ? rawGraph.nodes : [];
        const edges = Array.isArray(rawGraph?.edges) ? rawGraph.edges : [];
        const countsByType: Record<string, number> = {};

        for (const node of nodes) {
          const type = node?.type || "unknown";
          countsByType[type] = (countsByType[type] || 0) + 1;
        }

        knowledgeGraph = {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          countsByType,
        };
      } catch {
        knowledgeGraph = null;
      }
    }

    // 3. Bounded Audits
    const audits: BoundedAuditSummary[] = site.audits.map((audit) => {
      let parsedGsc: any[] | null = null;
      if (audit.gscSnapshot) {
        try {
          parsedGsc = JSON.parse(audit.gscSnapshot);
        } catch {
          parsedGsc = null;
        }
      }

      const openItemsCountByType: Record<string, number> = {};
      const pendingItems: Array<{
        type: string;
        targetUrl: string;
        status: string;
        currentValue: string | null;
        suggestedValue: string | null;
      }> = [];

      for (const item of audit.items) {
        if (item.status === "pending") {
          openItemsCountByType[item.type] = (openItemsCountByType[item.type] || 0) + 1;
          pendingItems.push({
            type: item.type,
            targetUrl: item.targetUrl,
            status: item.status,
            currentValue: item.currentValue,
            suggestedValue: item.suggestedValue,
          });
        }
      }

      return {
        id: audit.id,
        createdAt: audit.createdAt,
        scorePerformance: audit.scorePerformance,
        scoreSeo: audit.scoreSeo,
        scoreAccessibility: audit.scoreAccessibility,
        scoreBestPractices: audit.scoreBestPractices,
        cwv: {
          lcpSeconds: audit.lcpSeconds,
          clsScore: audit.clsScore,
          inpMilliseconds: audit.inpMilliseconds,
        },
        gscSnapshot: parsedGsc,
        openItemsCountByType,
        pendingItems,
      };
    });

    return {
      siteId: site.id,
      url: site.url,
      businessProfile,
      knowledgeGraph,
      audits,
    };
  } catch (err) {
    console.error("[buildWebsiteMemoryContext] Error building context:", err);
    return {
      siteId,
      url: "",
      businessProfile: null,
      knowledgeGraph: null,
      audits: [],
    };
  }
}
