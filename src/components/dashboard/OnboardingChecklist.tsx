import React, { useEffect } from "react";
import { CheckSquare, Square, Sparkles, ArrowRight, X } from "lucide-react";
import { Card } from "../ui/Card";

interface OnboardingChecklistProps {
  currentUser: any;
  allSites: any[];
  currentSite: any;
  currentAudit: any;
  selectTab: (tab: any) => void;
  onDismiss: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  currentUser,
  allSites,
  currentSite,
  currentAudit,
  selectTab,
  onDismiss,
}) => {
  // If onboarding is already completed in database, don't show anything
  if (currentUser?.onboardingCompletedAt) {
    return null;
  }

  // Derive steps status from real DB state
  const step1Done = allSites.length > 0;
  // Audit is completed if there are any audits in site or currentAudit exists
  const step2Done = (currentSite?.audits?.length > 0) || (currentAudit !== null);
  const step3Done = !!currentSite?.wpConnectedAt;
  const step4Done = currentAudit?.items?.some((i: any) => i.status === "applied") || false;

  const steps = [
    {
      id: "step-1",
      label: "Add your first website",
      done: step1Done,
      tab: "sites",
      instructions: "Go to sites tab and add your URL",
    },
    {
      id: "step-2",
      label: "Run your first audit",
      done: step2Done,
      tab: "crawler",
      instructions: "Run crawling scan on your added site",
    },
    {
      id: "step-3",
      label: "Connect WordPress",
      done: step3Done,
      tab: "connections",
      instructions: "Authorize WP REST API connection keys",
    },
    {
      id: "step-4",
      label: "Approve your first fix",
      done: step4Done,
      tab: "recommendations",
      instructions: "Approve AI recommendation to auto-push optimization",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  // Auto-complete in DB when all 4 tasks are genuinely done
  useEffect(() => {
    if (completedCount === 4 && !currentUser?.onboardingCompletedAt) {
      onDismiss(); // calls the backend to complete onboarding
    }
  }, [completedCount, currentUser?.onboardingCompletedAt, onDismiss]);

  return (
    <Card variant="flat" className="p-6 relative border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        type="button"
        className="absolute top-4 right-4 p-1.5 border-2 border-zinc-950 rounded-lg hover:bg-zinc-50 transition-colors shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px]"
        title="Dismiss checklist permanently"
      >
        <X className="w-3.5 h-3.5 text-zinc-900" />
      </button>

      <div className="space-y-4 max-w-xl">
        <div className="flex items-center gap-2 text-violet-650">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
            Onboarding Setup Checklist ({completedCount}/{steps.length} done)
          </h3>
        </div>

        <p className="text-xs leading-relaxed text-zinc-550">
          Complete these 4 state-driven steps to fully configure HeyDrona AI Growth Agent for automated SEO content generation.
        </p>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-505">
            <span>PROGRESS</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-3 border-2 border-zinc-950 bg-zinc-50 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => {
                if (!step.done) {
                  selectTab(step.tab);
                }
              }}
              disabled={step.done}
              type="button"
              className={`p-3 border-2 rounded-xl text-left transition-all font-mono flex items-start gap-3 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px] ${
                step.done
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-500/10 cursor-default"
                  : "bg-white border-zinc-950 text-zinc-800 hover:bg-zinc-50 cursor-pointer"
              }`}
            >
              {step.done ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className={`text-[11px] font-bold block ${step.done ? "line-through text-emerald-700/60" : ""}`}>
                  {step.label}
                </span>
                {!step.done && (
                  <span className="text-[9px] text-zinc-450 flex items-center gap-1">
                    {step.instructions} <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
export default OnboardingChecklist;
