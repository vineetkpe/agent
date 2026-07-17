import React from "react";
import { Sparkles, ArrowRight, Activity, Calendar } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ScoreTrendChart } from "./charts/ScoreTrendChart";
import { IssueBreakdownChart } from "./charts/IssueBreakdownChart";
import { ApprovalFunnelChart } from "./charts/ApprovalFunnelChart";

import { AgentActivityLog } from "./AgentActivityLog";
import { UptimeWidget } from "./UptimeWidget";
import { GrowthTrendChart } from "./charts/GrowthTrendChart";

interface OverviewTabProps {
  currentSite: any;
  currentAudit: any;
  selectTab: (tab: any) => void;
  pastAudits?: any[];
  activityLog?: any[];
  uptimeChecks?: any[];
  currentUser?: any;
  onRefresh?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  currentSite,
  currentAudit,
  selectTab,
  pastAudits = [],
  activityLog = [],
  uptimeChecks = [],
  currentUser,
  onRefresh,
}) => {
  if (!currentAudit) {
    return (
      <div className="space-y-8 animate-slide-up">
        {/* Domain Quick Overview Card */}
        <Card variant="flat" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-900">
              <Sparkles className="w-6 h-6 text-violet-500" /> HeyDrona AI Employee Workspace
            </h2>
            <p className="text-xs mt-1 leading-relaxed text-zinc-655">
              Connecting:{" "}
              <span className="text-violet-650 font-mono font-bold">
                {currentSite?.url || "No website connected yet"}
              </span>
              . Running autonomous digital growth routines daily.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card variant="flat" className="text-center p-12 space-y-6 bg-zinc-50/10 border-2 border-dashed border-zinc-250 rounded-2xl">
              <div className="w-16 h-16 rounded-full border-2 border-zinc-950 flex items-center justify-center mx-auto bg-violet-50 text-violet-600 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 uppercase font-mono">
                  Initialize Your AI Growth Routine
                </h2>
                <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                  No SEO crawls or diagnostics audits have been executed for your site yet. Start now to analyze sitemaps, target keywords, and publish optimization tags.
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => selectTab("crawler")}
                  type="button"
                  className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm tracking-wider uppercase transition-all duration-200 border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex items-center gap-2"
                >
                  Run Your First Crawl <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-1">
            {onRefresh && (
              <UptimeWidget
                currentSite={currentSite}
                uptimeChecks={uptimeChecks}
                currentUser={currentUser}
                onRefresh={onRefresh}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const items = currentAudit?.items || [];
  const pendingCount = items.filter((i: any) => i.status === "pending").length;
  const approvedCount = items.filter((i: any) => i.status === "approved").length;
  const appliedCount = items.filter((i: any) => i.status === "applied").length;

  // Sorting recent activity changes
  const activityItems = [...items]
    .sort((a: any, b: any) => {
      const timeA = a.appliedAt ? new Date(a.appliedAt).getTime() : new Date(a.createdAt).getTime();
      const timeB = b.appliedAt ? new Date(b.appliedAt).getTime() : b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  const getLcpInfo = (val: number | null | undefined) => {
    if (val === null || val === undefined) return { text: "--", color: "text-zinc-500" };
    if (val < 2.5) return { text: `${val}s (Good)`, color: "text-emerald-600" };
    if (val <= 4.0) return { text: `${val}s (Warn)`, color: "text-amber-600" };
    return { text: `${val}s (Poor)`, color: "text-red-655" };
  };

  const getClsInfo = (val: number | null | undefined) => {
    if (val === null || val === undefined) return { text: "--", color: "text-zinc-500" };
    if (val < 0.1) return { text: `${val} (Good)`, color: "text-emerald-600" };
    if (val <= 0.25) return { text: `${val} (Warn)`, color: "text-amber-600" };
    return { text: `${val} (Poor)`, color: "text-red-655" };
  };

  const getInpInfo = (val: number | null | undefined) => {
    if (val === null || val === undefined) return { text: "--", color: "text-zinc-500" };
    if (val < 200) return { text: `${val}ms (Good)`, color: "text-emerald-600" };
    if (val <= 500) return { text: `${val}ms (Warn)`, color: "text-amber-600" };
    return { text: `${val}ms (Poor)`, color: "text-red-655" };
  };

  const lcpInfo = getLcpInfo(currentAudit?.lcpSeconds);
  const clsInfo = getClsInfo(currentAudit?.clsScore);
  const inpInfo = getInpInfo(currentAudit?.inpMilliseconds);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Domain Quick Overview Card */}
      <Card variant="flat" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-900">
            <Sparkles className="w-6 h-6 text-violet-500" /> HeyDrona AI Employee Workspace
          </h2>
          <p className="text-xs mt-1 leading-relaxed text-zinc-650">
            Connecting:{" "}
            <span className="text-violet-650 font-mono font-bold">
              {currentSite?.url || "No website connected yet"}
            </span>
            . Running autonomous digital growth routines daily.
          </p>
        </div>
        <div>
          <button
            onClick={() => selectTab("crawler")}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs tracking-wider uppercase transition-all duration-200 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center gap-2 shrink-0"
          >
            Run Crawler Audit <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            Total Issues Found
          </span>
          <span className="text-2xl font-extrabold text-indigo-650 mt-1 font-mono">
            {items.length}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            Fixes Applied
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
            {appliedCount}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            Pending Review
          </span>
          <span className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
            {pendingCount}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            SEO Score
          </span>
          <span className="text-2xl font-extrabold text-violet-650 mt-1 font-mono">
            {currentAudit?.scoreSeo ? `${currentAudit.scoreSeo}%` : "--"}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            Performance Score
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono">
            {currentAudit?.scorePerformance ? `${currentAudit.scorePerformance}` : "--"}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            LCP (Load Speed)
          </span>
          <span className={`text-sm font-extrabold mt-1 font-mono ${lcpInfo.color}`}>
            {lcpInfo.text}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            CLS (Visual Shift)
          </span>
          <span className={`text-sm font-extrabold mt-1 font-mono ${clsInfo.color}`}>
            {clsInfo.text}
          </span>
        </Card>

        <Card variant="flat" className="flex flex-col p-4 justify-between">
          <span className="text-[9px] uppercase tracking-wider font-bold block text-zinc-500 font-mono">
            INP/TBT (Latency)
          </span>
          <span className={`text-sm font-extrabold mt-1 font-mono ${inpInfo.color}`}>
            {inpInfo.text}
          </span>
        </Card>
      </div>

      {/* Two Column Charts & Uptime Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScoreTrendChart pastAudits={pastAudits} />
            <IssueBreakdownChart items={items} />
          </div>
          <ApprovalFunnelChart items={items} />
        </div>
        <div className="lg:col-span-1">
          {onRefresh && (
            <UptimeWidget
              currentSite={currentSite}
              uptimeChecks={uptimeChecks}
              currentUser={currentUser}
              onRefresh={onRefresh}
            />
          )}
        </div>
      </div>

      {/* Real SEO & Search Growth Trend Chart */}
      <GrowthTrendChart currentSite={currentSite} />

      {/* Real Agent Activity Log */}
      <AgentActivityLog activityLog={activityLog} />
    </div>
  );
};
