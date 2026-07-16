import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { getEffectivePlanLimits } from "@/lib/planLimits";

interface BillingUpgradeBannerProps {
  currentUser: any;
  handleSubscribe: () => void;
  isSubscribing: boolean;
  allSites?: any[];
  currentSite?: any;
  currentAudit?: any;
}

export const BillingUpgradeBanner: React.FC<BillingUpgradeBannerProps> = ({
  currentUser,
  handleSubscribe,
  isSubscribing,
  allSites = [],
  currentSite = null,
  currentAudit = null,
}) => {
  const [nudgeDismissed, setNudgeDismissed] = React.useState(false);
  const limits = getEffectivePlanLimits(currentUser);
  const planName = currentUser?.plan 
    ? currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1) 
    : currentUser?.subscriptionActive ? "Premium" : "Free";

  const siteCount = allSites.length;
  const maxSites = limits.maxSites;
  const usageText = maxSites === Infinity ? "Unlimited sites" : `${siteCount} of ${maxSites} sites used`;

  const isPaid = currentUser?.subscriptionActive || currentUser?.plan;

  // Find the latest audit date from currentSite or currentAudit
  let latestDate: Date | null = null;
  if (currentAudit?.createdAt) {
    latestDate = new Date(currentAudit.createdAt);
  } else if (currentSite?.audits && currentSite.audits.length > 0) {
    const dates = currentSite.audits.map((a: any) => new Date(a.createdAt).getTime());
    latestDate = new Date(Math.max(...dates));
  }

  let daysSinceLastAudit = 0;
  let showScanNudge = false;
  if (latestDate) {
    const ageMs = Date.now() - latestDate.getTime();
    daysSinceLastAudit = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    
    // Nudge if audit is older than 14 days and plan doesn't have autoWeeklyRescan
    const hasAutoWeeklyRescan = limits.autoWeeklyRescan;
    showScanNudge = daysSinceLastAudit > 14 && !hasAutoWeeklyRescan;
  }

  React.useEffect(() => {
    if (currentSite?.id) {
      const dismissed = localStorage.getItem(`nudge-dismissed-${currentSite.id}`);
      if (dismissed === "true") {
        setNudgeDismissed(true);
      } else {
        setNudgeDismissed(false);
      }
    }
  }, [currentSite?.id]);

  const handleDismissNudge = () => {
    if (currentSite?.id) {
      localStorage.setItem(`nudge-dismissed-${currentSite.id}`, "true");
    }
    setNudgeDismissed(true);
  };

  return (
    <div className="p-4 mx-4 mb-4 rounded-2xl border border-violet-100 bg-violet-50/50 shadow-sm font-mono">
      <div className="flex items-center justify-between text-violet-650">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {planName} Plan
          </span>
        </div>
      </div>
      
      <p className="text-[10px] leading-relaxed mt-1.5 text-zinc-550">
        {isPaid ? usageText : "1 website, 1 lifetime audit. Unlock CMS connection & AI assistant."}
      </p>

      {(!isPaid || (maxSites !== Infinity && maxSites < 10)) && (
        <Button
          onClick={handleSubscribe}
          disabled={isSubscribing}
          variant="primary"
          className="w-full py-2.5 mt-3 text-[11px]"
        >
          {isSubscribing ? "Upgrading..." : isPaid ? "Upgrade Plan" : "Hire AI Employee ($19/mo)"}
        </Button>
      )}

      {showScanNudge && !nudgeDismissed && (
        <div className="mt-3.5 p-2.5 rounded-xl border-2 border-amber-950 bg-amber-50 text-[10px] text-amber-900 leading-normal flex flex-col gap-1.5 animate-fade-in font-mono relative">
          <button
            onClick={handleDismissNudge}
            type="button"
            className="absolute top-1 right-2 text-amber-800 hover:text-amber-950 font-bold"
          >
            ✕
          </button>
          <div className="font-bold uppercase tracking-wider text-[8px] text-amber-850">
            ⚠️ Scan Nudge
          </div>
          <p>
            It&apos;s been {daysSinceLastAudit} days since your last scan. Run a new audit to identify and fix new issues.
          </p>
        </div>
      )}
    </div>
  );
};
export default BillingUpgradeBanner;
