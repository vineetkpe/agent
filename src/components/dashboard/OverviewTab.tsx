import React from "react";
import { Sparkles, ArrowRight, Activity, Calendar, FileText, CheckCircle, Clock, XCircle, Zap } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface OverviewTabProps {
  currentSite: any;
  currentAudit: any;
  selectTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  currentSite,
  currentAudit,
  selectTab,
}) => {
  const items = currentAudit?.items || [];
  const pendingCount = items.filter((i: any) => i.status === "pending").length;
  const approvedCount = items.filter((i: any) => i.status === "approved").length;
  const appliedCount = items.filter((i: any) => i.status === "applied").length;
  const rejectedCount = items.filter((i: any) => i.status === "rejected").length;

  const lastAuditDate = currentAudit?.createdAt
    ? new Date(currentAudit.createdAt).toLocaleString()
    : "No audits run yet";

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Domain Quick Overview Card */}
      <Card variant="flat" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-900">
            <Sparkles className="w-6 h-6 text-violet-500" /> HeyDrona AI Employee Workspace
          </h2>
          <p className="text-xs mt-1 leading-relaxed text-zinc-600">
            Connecting:{" "}
            <span className="text-violet-600 font-mono font-bold">
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

      {/* Status Score Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card variant="flat" className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-550">
            SEO Health Index
          </span>
          <span className="text-4xl font-extrabold text-violet-600 mt-2 font-mono">
            {currentAudit?.scoreSeo ? `${currentAudit.scoreSeo}%` : "--"}
          </span>
          <p className="text-[10px] text-zinc-500 mt-auto pt-4 leading-relaxed">
            Percentage of standard header guidelines passed
          </p>
        </Card>

        <Card variant="flat" className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-555">
            Performance Index
          </span>
          <span className="text-4xl font-extrabold text-emerald-600 mt-2 font-mono">
            {currentAudit?.scorePerformance ? `${currentAudit.scorePerformance}` : "--"}
          </span>
          <p className="text-[10px] text-zinc-500 mt-auto pt-4">
            Tested page load parameters
          </p>
        </Card>

        <Card variant="flat" className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-550">
            Total Issues Flagged
          </span>
          <span className="text-4xl font-extrabold text-indigo-650 mt-2 font-mono">
            {items.length}
          </span>
          <p className="text-[10px] text-zinc-500 mt-auto pt-4">
            SEO recommendations and blog content drafts
          </p>
        </Card>

        <Card variant="flat" className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-550">
            Audit Date
          </span>
          <span className="text-sm font-bold text-zinc-700 mt-4 leading-normal flex items-center gap-1.5 font-mono">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            {currentAudit?.createdAt
              ? new Date(currentAudit.createdAt).toLocaleDateString()
              : "--"}
          </span>
          <p className="text-[10px] text-zinc-500 mt-auto pt-4">
            Latest crawling timestamp
          </p>
        </Card>
      </div>

      {/* Real Audit Task Summary Timeline */}
      <Card variant="flat">
        <div className="pb-6 border-b border-zinc-100">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900">
            <Activity className="w-5 h-5 text-violet-600" /> SEO Optimization Summary
          </h3>
          <p className="text-xs mt-0.5 text-zinc-500">
            Current status of audit tasks pulled from database audit record ({lastAuditDate}).
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div className="p-4 border rounded-xl bg-zinc-50 border-zinc-200">
            <div className="flex items-center gap-2 text-amber-600 mb-1.5">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Pending Review
              </span>
            </div>
            <span className="text-2xl font-black text-zinc-800 font-mono">
              {pendingCount}
            </span>
          </div>

          <div className="p-4 border rounded-xl bg-zinc-50 border-zinc-200">
            <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Approved
              </span>
            </div>
            <span className="text-2xl font-black text-zinc-800 font-mono">
              {approvedCount}
            </span>
          </div>

          <div className="p-4 border rounded-xl bg-zinc-50 border-zinc-200">
            <div className="flex items-center gap-2 text-indigo-600 mb-1.5">
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Pushed/Applied
              </span>
            </div>
            <span className="text-2xl font-black text-zinc-800 font-mono">
              {appliedCount}
            </span>
          </div>

          <div className="p-4 border rounded-xl bg-zinc-50 border-zinc-200">
            <div className="flex items-center gap-2 text-zinc-550 mb-1.5">
              <XCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Rejected
              </span>
            </div>
            <span className="text-2xl font-black text-zinc-800 font-mono">
              {rejectedCount}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
