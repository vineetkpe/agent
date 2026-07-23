import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { AlertTriangle, Globe, Sparkles, Activity, ShieldCheck, Zap } from "lucide-react";

interface UsageData {
  plan: string;
  limits: {
    maxSites: number;
    cooldownMinutes: number;
    wpAutoApply: boolean;
    chatbot: boolean;
    autoScheduledCrawl: boolean;
    pdfExport: boolean;
    whiteLabelReport: boolean;
    uptimeMonitoring: boolean;
    description: string;
  };
  usage: {
    sites: {
      used: number;
      limit: string | number;
      percent: number;
    };
    aiRequests: {
      used: number;
      period: string;
    };
    audits: {
      used: number;
      period: string;
    };
    crawls: {
      used: number;
      period: string;
    };
  };
  warnings: Array<{ metric: string; percent: number; message: string }>;
}

export const UsageTab: React.FC<{ currentUser?: any; onUpgrade?: () => void }> = ({ onUpgrade }) => {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        setLoading(true);
        const res = await fetch("/api/user/usage");
        if (!res.ok) {
          throw new Error("Failed to fetch usage data.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load usage");
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-zinc-200 rounded animate-pulse w-48" />
        <div className="h-32 bg-zinc-200 rounded animate-pulse w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-28 bg-zinc-200 rounded animate-pulse" />
          <div className="h-28 bg-zinc-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <p className="text-sm text-red-600 font-mono">{error || "Unable to load usage details."}</p>
      </Card>
    );
  }

  const { plan, limits, usage, warnings } = data;

  return (
    <div className="p-6 space-y-6">
      {/* 80% Soft-Limit Warning Banner */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold font-mono uppercase tracking-wide">Usage Limit Warning</h4>
            {warnings.map((w, idx) => (
              <p key={idx} className="text-xs">
                {w.message} Consider upgrading your plan to expand your website capacity.
              </p>
            ))}
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="mt-2 text-xs font-bold underline hover:text-amber-950 font-mono"
              >
                Upgrade Plan Now →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan Header Card */}
      <Card className="p-6 bg-gradient-to-r from-violet-900 to-indigo-900 text-white border-2 border-zinc-950 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-violet-300">
              Active Tier Allowance
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold uppercase font-mono tracking-tight">{plan} Plan</h2>
              <Badge variant="violet" className="capitalize">
                {limits.description.split(",")[0]}
              </Badge>
            </div>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-4 py-2 bg-white text-zinc-950 font-bold text-xs font-mono rounded-xl border-2 border-zinc-950 hover:bg-violet-50 transition-colors shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
            >
              Change / Upgrade Plan
            </button>
          )}
        </div>
      </Card>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Websites Usage */}
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-violet-600" />
              <h3 className="font-bold text-sm font-mono text-zinc-900">Websites Capacity</h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-600">
              {usage.sites.used} / {usage.sites.limit}
            </span>
          </div>

          <div className="w-full h-3.5 bg-zinc-100 rounded-full border border-zinc-950 overflow-hidden flex">
            <div
              style={{ width: `${usage.sites.percent}%` }}
              className={`h-full transition-all duration-500 ${
                usage.sites.percent >= 80 ? "bg-amber-500" : "bg-violet-600"
              }`}
            />
          </div>

          <p className="text-xs text-zinc-500 font-mono">
            {usage.sites.percent >= 80
              ? "Approaching website connection limit."
              : "Active connected site slots in workspace."}
          </p>
        </Card>

        {/* AI Assistant Requests */}
        <Card className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm font-mono text-zinc-900">AI Requests (30d)</h3>
            </div>
            <Badge variant="violet">{usage.aiRequests.used} calls</Badge>
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            AI generation requests, chat interactions, and profile extractions performed over the last 30 days.
          </p>
        </Card>

        {/* Audits Performed */}
        <Card className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm font-mono text-zinc-900">Growth Scans (30d)</h3>
            </div>
            <Badge variant="emerald">{usage.audits.used} audits</Badge>
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            Full website audits and SEO fix generations completed in the last 30 days.
          </p>
        </Card>

        {/* Page Crawls */}
        <Card className="p-6 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm font-mono text-zinc-900">Page Crawls (30d)</h3>
            </div>
            <Badge variant="amber">{usage.crawls.used} crawls</Badge>
          </div>
          <p className="text-xs text-zinc-600 font-mono">
            Direct website page fetches and structural audits logged over the last 30 days.
          </p>
        </Card>
      </div>
    </div>
  );
};
export default UsageTab;
