import { prisma } from "./prisma";

export interface PlanLimits {
  maxSites: number;
  cooldownMinutes: number;
  wpAutoApply: boolean;
  chatbot: boolean;
  autoScheduledCrawl: boolean;
  pdfExport: boolean;
  whiteLabelReport: boolean;
  uptimeMonitoring: boolean;
  description: string;
}

interface CacheEntry {
  plans: Record<string, PlanLimits>;
  timestamp: number;
}

let cachedPlanLimits: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000;

export function invalidatePlanLimitsCache() {
  cachedPlanLimits = null;
  console.log("[Plan limits Cache] Invalidated.");
}

async function loadPlanLimitsFromDb(): Promise<Record<string, PlanLimits>> {
  try {
    const dbPlans = await prisma.plan.findMany({
      where: { isActive: true },
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
    });

    const parsedLimits: Record<string, PlanLimits> = {};

    for (const plan of dbPlans) {
      const limits: any = {
        maxSites: 1,
        cooldownMinutes: 1440,
        wpAutoApply: false,
        chatbot: false,
        autoScheduledCrawl: false,
        pdfExport: false,
        whiteLabelReport: false,
        uptimeMonitoring: true, // Universal per UPTIME-FREE-1
        description: `${plan.name} pricing package`,
      };

      for (const pf of plan.features) {
        let val: any;
        try {
          val = typeof pf.value === "string" ? JSON.parse(pf.value) : pf.value;
        } catch {
          val = pf.value;
        }

        const featureKey = pf.featureKey;
        if (pf.feature.type === "number") {
          limits[featureKey] = typeof val === "number" ? val : parseInt(val, 10);
        } else if (pf.feature.type === "boolean") {
          limits[featureKey] = String(val) === "true" || val === true;
        } else {
          limits[featureKey] = val;
        }
      }

      // Universal uptime monitoring per UPTIME-FREE-1
      limits.uptimeMonitoring = true;

      parsedLimits[plan.slug.toLowerCase()] = limits;
    }

    return parsedLimits;
  } catch (err) {
    console.error("[Plan limits] Error loading plans from DB, falling back to static:", err);
    return getFallbackPlanLimits();
  }
}

function getFallbackPlanLimits(): Record<string, PlanLimits> {
  return {
    free: {
      maxSites: 1,
      cooldownMinutes: 1440,
      wpAutoApply: false,
      chatbot: false,
      autoScheduledCrawl: false,
      pdfExport: false,
      whiteLabelReport: false,
      uptimeMonitoring: true, // Universal per UPTIME-FREE-1
      description: "1 site, 1 lifetime audit, copy-paste fixes only, no WP auto-apply, no chatbot, universal uptime check",
    },
    starter: {
      maxSites: 1,
      cooldownMinutes: 1440,
      wpAutoApply: true,
      chatbot: true,
      autoScheduledCrawl: false,
      pdfExport: false,
      whiteLabelReport: false,
      uptimeMonitoring: true,
      description: "1 website, manual audits (24h cooldown), full AI fixes, WordPress one-click apply, AI chat assistant, real uptime checks",
    },
    growth: {
      maxSites: 3,
      cooldownMinutes: 360,
      wpAutoApply: true,
      chatbot: true,
      autoScheduledCrawl: true,
      pdfExport: true,
      whiteLabelReport: false,
      uptimeMonitoring: true,
      description: "Up to 3 websites, everything in Starter, weekly automatic re-scan + email digest, downloadable PDF SEO reports, real uptime checks",
    },
    agency: {
      maxSites: 10,
      cooldownMinutes: 60,
      wpAutoApply: true,
      chatbot: true,
      autoScheduledCrawl: true,
      pdfExport: true,
      whiteLabelReport: true,
      uptimeMonitoring: true,
      description: "Up to 10 websites, everything in Growth, white-label PDF reports, fastest audit cooldown, real uptime checks",
    },
  };
}

/**
 * Global asynchronous helper to resolve plan limits.
 * Best used inside API Route Handlers.
 */
export async function getEffectivePlanLimitsAsync(user?: {
  plan?: string | null;
  isAdmin?: boolean;
  suspended?: boolean;
  email?: string | null;
  role?: string | null;
} | null): Promise<PlanLimits> {
  if (!user) {
    return getPlanLimitsBySlug("free");
  }

  // Admin override stays as-is (full unlimited bypass)
  const isAdmin = user.role === "admin" || user.isAdmin || (user.email && user.email.toLowerCase() === "vineetkpe@gmail.com");
  if (isAdmin) {
    return {
      maxSites: Infinity,
      cooldownMinutes: 0,
      wpAutoApply: true,
      chatbot: true,
      autoScheduledCrawl: true,
      pdfExport: true,
      whiteLabelReport: true,
      uptimeMonitoring: true,
      description: "Unlimited admin override access",
    };
  }

  if (user.suspended) {
    return {
      maxSites: 0,
      cooldownMinutes: Infinity,
      wpAutoApply: false,
      chatbot: false,
      autoScheduledCrawl: false,
      pdfExport: false,
      whiteLabelReport: false,
      uptimeMonitoring: false,
      description: "Account suspended",
    };
  }

  const slug = (user.plan || "free").toLowerCase();
  return getPlanLimitsBySlug(slug);
}

/**
 * Synchronous resolver for plan limits. Used by UI views to avoid hydration issues.
 * Returns cached limits if initialized, otherwise returns fallback definition.
 */
export function getEffectivePlanLimits(user?: {
  plan?: string | null;
  isAdmin?: boolean;
  suspended?: boolean;
  email?: string | null;
  role?: string | null;
} | null): PlanLimits {
  if (!user) {
    return getFallbackPlanLimits().free;
  }

  const isAdmin = user.role === "admin" || user.isAdmin || (user.email && user.email.toLowerCase() === "vineetkpe@gmail.com");
  if (isAdmin) {
    return {
      maxSites: Infinity,
      cooldownMinutes: 0,
      wpAutoApply: true,
      chatbot: true,
      autoScheduledCrawl: true,
      pdfExport: true,
      whiteLabelReport: true,
      uptimeMonitoring: true,
      description: "Unlimited admin override access",
    };
  }

  if (user.suspended) {
    return {
      maxSites: 0,
      cooldownMinutes: Infinity,
      wpAutoApply: false,
      chatbot: false,
      autoScheduledCrawl: false,
      pdfExport: false,
      whiteLabelReport: false,
      uptimeMonitoring: false,
      description: "Account suspended",
    };
  }

  const slug = (user.plan || "free").toLowerCase();
  if (cachedPlanLimits) {
    const limits = cachedPlanLimits.plans[slug];
    if (limits) return limits;
  }

  return getFallbackPlanLimits()[slug] || getFallbackPlanLimits().free;
}

async function getPlanLimitsBySlug(slug: string): Promise<PlanLimits> {
  const now = Date.now();
  if (!cachedPlanLimits || now - cachedPlanLimits.timestamp > CACHE_TTL_MS) {
    console.log("[Plan limits Cache] Miss. Loading from DB...");
    const plans = await loadPlanLimitsFromDb();
    cachedPlanLimits = {
      plans,
      timestamp: now,
    };
  }

  const limits = cachedPlanLimits.plans[slug];
  if (!limits) {
    return getFallbackPlanLimits()[slug] || getFallbackPlanLimits().free;
  }
  return limits;
}
