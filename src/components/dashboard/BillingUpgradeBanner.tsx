import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "../ui/Button";

interface BillingUpgradeBannerProps {
  currentUser: any;
  handleSubscribe: () => void;
  isSubscribing: boolean;
}

export const BillingUpgradeBanner: React.FC<BillingUpgradeBannerProps> = ({
  currentUser,
  handleSubscribe,
  isSubscribing,
}) => {
  if (currentUser?.subscriptionActive) return null;

  return (
    <div className="p-4 mx-4 mb-4 rounded-2xl border border-violet-100 bg-violet-50/50 shadow-sm">
      <div className="flex items-center gap-2 text-violet-600">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          HeyDrona Premium
        </span>
      </div>
      <p className="text-[10px] leading-relaxed mt-1.5 text-zinc-500">
        Unlock CMS REST integrations and run daily site optimizations.
      </p>
      <Button
        onClick={handleSubscribe}
        disabled={isSubscribing}
        variant="primary"
        className="w-full py-2.5 mt-3 text-[11px]"
      >
        {isSubscribing ? "Upgrading..." : "Hire AI Employee ($19/mo)"}
      </Button>
    </div>
  );
};
export default BillingUpgradeBanner;
