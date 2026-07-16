import React from "react";
import { Sparkles, ArrowRight, Activity, Calendar } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ScoreTrendChart } from "./charts/ScoreTrendChart";
import { IssueBreakdownChart } from "./charts/IssueBreakdownChart";
import { ApprovalFunnelChart } from "./charts/ApprovalFunnelChart";

interface OverviewTabProps {
  currentSite: any;
  currentAudit: any;
  selectTab: (tab: any) => void;
  pastAudits?: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  currentSite,
  currentAudit,
  selectTab,
  pastAudits = [],
}) => {
  if (!currentAudit) {
    return (
      <div className="space-y-8 animate-slide-up">
        <Card variant="shadow" className="max-w-2xl mx-auto text-center p-12 space-y-6 my-12">
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
      const timeB = b.appliedAt ? new Date(b.appliedAt).getTime() : new Date(b.createdAt).getTime();
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

      {/* Two Column Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreTrendChart pastAudits={pastAudits} />
        <IssueBreakdownChart items={items} />
      </div>

      {/* Funnel Chart Row */}
      <ApprovalFunnelChart items={items} />

      {/* Recent Activity List */}
      <Card variant="flat" className="space-y-4">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500">
            Recent Activity
          </h3>
          <p className="text-xs text-zinc-400">Last 5 updates for this website</p>
        </div>

        <div className="space-y-3">
          {activityItems.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2">No activity recorded yet.</p>
          ) : (
            activityItems.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-xl bg-zinc-50/50 border-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-800 font-mono">
                      {item.type.replace("_", " ").toUpperCase()}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px] sm:max-w-md">
                      {item.targetUrl.includes("example.com") && currentSite?.url
                        ? item.targetUrl.replace("https://example.com", currentSite.url)
                        : item.targetUrl}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end justify-center">
                  {item.status === "applied" && (
                    <Badge variant="emerald" className="text-[8px] px-1.5 py-0.5">Live</Badge>
                  )}
                  {item.status === "approved" && (
                    <Badge variant="amber" className="text-[8px] px-1.5 py-0.5">Approved</Badge>
                  )}
                  {item.status === "rejected" && (
                    <Badge variant="zinc" className="text-[8px] px-1.5 py-0.5">Rejected</Badge>
                  )}
                  {item.status === "pending" && (
                    <Badge variant="violet" className="text-[8px] px-1.5 py-0.5">Pending</Badge>
                  )}
                  <span className="text-[9px] text-zinc-400 font-mono block mt-1">
                    {new Date(item.appliedAt || item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
