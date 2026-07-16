export interface PlanLimits {
  maxSites: number;
  cooldownMinutes: number;
  wpAutoApply: boolean;
  chatbot: boolean;
  autoWeeklyRescan: boolean;
  pdfExport: boolean;
  whiteLabelReport: boolean;
  description: string;
}

export const PLAN_LIMITS: Record<"free" | "starter" | "growth" | "agency", PlanLimits> = {
  free: {
    maxSites: 1,
    cooldownMinutes: 1440,
    wpAutoApply: false,
    chatbot: false,
    autoWeeklyRescan: false,
    pdfExport: false,
    whiteLabelReport: false,
    description: "1 site, 1 lifetime audit, copy-paste fixes only, no WP auto-apply, no chatbot",
  },
  starter: {
    maxSites: 1,
    cooldownMinutes: 1440,
    wpAutoApply: true,
    chatbot: true,
    autoWeeklyRescan: false,
    pdfExport: false,
    whiteLabelReport: false,
    description: "1 website, manual audits (24h cooldown), full AI fixes, WordPress one-click apply, AI chat assistant",
  },
  growth: {
    maxSites: 3,
    cooldownMinutes: 360,
    wpAutoApply: true,
    chatbot: true,
    autoWeeklyRescan: true,
    pdfExport: true,
    whiteLabelReport: false,
    description: "Up to 3 websites, everything in Starter, weekly automatic re-scan + email digest, downloadable PDF SEO reports",
  },
  agency: {
    maxSites: 10,
    cooldownMinutes: 60,
    wpAutoApply: true,
    chatbot: true,
    autoWeeklyRescan: true,
    pdfExport: true,
    whiteLabelReport: true,
    description: "Up to 10 websites, everything in Growth, white-label PDF reports (your logo, not ours), fastest audit cooldown",
  },
};

export function getEffectivePlanLimits(user?: {
  plan?: string | null;
  isAdmin?: boolean;
  suspended?: boolean;
  email?: string | null;
} | null): PlanLimits {
  if (!user) {
    return PLAN_LIMITS.free;
  }

  // CRITICAL: if user.isAdmin is true, return an unlimited override object
  // regardless of user.plan. Admins are never limited by their own plan.
  // Defensively bypass using both DB fields and specific admin email.
  const isAdmin = user.isAdmin || (user.email && user.email.toLowerCase() === "vineetkpe@gmail.com");
  if (isAdmin) {
    return {
      maxSites: Infinity,
      cooldownMinutes: 0,
      wpAutoApply: true,
      chatbot: true,
      autoWeeklyRescan: true,
      pdfExport: true,
      whiteLabelReport: true,
      description: "Unlimited admin override access",
    };
  }

  // If user.suspended is true, return the most restrictive object regardless of plan
  // (blocks everything except login), UNLESS user.isAdmin is true.
  if (user.suspended) {
    return {
      maxSites: 0,
      cooldownMinutes: Infinity,
      wpAutoApply: false,
      chatbot: false,
      autoWeeklyRescan: false,
      pdfExport: false,
      whiteLabelReport: false,
      description: "Account suspended",
    };
  }

  const planKey = (user.plan || "free").toLowerCase() as keyof typeof PLAN_LIMITS;
  const matched = PLAN_LIMITS[planKey as keyof typeof PLAN_LIMITS];
  return matched || PLAN_LIMITS.free;
}
