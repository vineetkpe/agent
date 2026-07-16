import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/Button";
import { getEffectivePlanLimits } from "@/lib/planLimits";

interface BillingUpgradeBannerProps {
  currentUser: any;
  handleSubscribe: () => void;
  isSubscribing: boolean;
  allSites?: any[];
}

export const BillingUpgradeBanner: React.FC<BillingUpgradeBannerProps> = ({
  currentUser,
  handleSubscribe,
  isSubscribing,
  allSites = [],
}) => {
  const limits = getEffectivePlanLimits(currentUser);
  const planName = currentUser?.plan 
    ? currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1) 
    : currentUser?.subscriptionActive ? "Premium" : "Free";

  const siteCount = allSites.length;
  const maxSites = limits.maxSites;
  const usageText = maxSites === Infinity ? "Unlimited sites" : `${siteCount} of ${maxSites} sites used`;

  const isPaid = currentUser?.subscriptionActive || currentUser?.plan;

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
    </div>
  );
};
export default BillingUpgradeBanner;
