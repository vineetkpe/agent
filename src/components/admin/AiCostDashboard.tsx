import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { DollarSign, Cpu, TrendingUp, Layers, RefreshCw, AlertCircle, Zap, Shield, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SummaryData {
  windowDays: number;
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalEstimatedCost: number;
}

interface BreakdownItem {
  userId?: string;
  siteId?: string;
  featureTag?: string;
  provider?: string;
  model?: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

interface DailyTrendItem {
  date: string;
  calls: number;
  cost: number;
  inputTokens: number;
  outputTokens: number;
}

interface ExpensiveRequest {
  id: string;
  createdAt: string;
  provider: string;
  model: string;
  callType: string;
  userId: string;
  siteId: string;
  featureTag: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export const AiCostDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowDays, setWindowDays] = useState(30);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [userBreakdown, setUserBreakdown] = useState<BreakdownItem[]>([]);
  const [siteBreakdown, setSiteBreakdown] = useState<BreakdownItem[]>([]);
  const [featureBreakdown, setFeatureBreakdown] = useState<BreakdownItem[]>([]);
  const [providerBreakdown, setProviderBreakdown] = useState<BreakdownItem[]>([]);
  const [modelBreakdown, setModelBreakdown] = useState<BreakdownItem[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrendItem[]>([]);
  const [topExpensive, setTopExpensive] = useState<ExpensiveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"feature" | "user" | "site" | "provider">("feature");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/admin/stats/ai-cost?window=${windowDays}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load AI cost statistics.");
      }

      const data = await res.json();
      setSummary(data.summary);
      setUserBreakdown(data.userBreakdown || []);
      setSiteBreakdown(data.siteBreakdown || []);
      setFeatureBreakdown(data.featureBreakdown || []);
      setProviderBreakdown(data.providerBreakdown || []);
      setModelBreakdown(data.modelBreakdown || []);
      setDailyTrend(data.dailyTrend || []);
      setTopExpensive(data.topExpensiveRequests || []);
    } catch (err: any) {
      setError(err.message || "Failed to load stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [windowDays]);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2 font-mono">
          <RefreshCw className="w-6 h-6 text-violet-650 animate-spin" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            Calculating AI Cost Aggregations...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Window Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            AI Cost & Usage Analytics
          </h2>
          <p className="text-xs text-zinc-500 font-mono">
            Granular spend tracking by user, website, AI feature, provider & model
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase">Timeframe:</label>
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 rounded-xl border-2 border-zinc-955 bg-white text-xs font-mono font-bold shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] focus:outline-none"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
            <option value={0}>All Time</option>
          </select>
          <button
            onClick={() => fetchStats()}
            className="p-1.5 border-2 border-zinc-955 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-700 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border-2 border-red-955 bg-red-50 text-xs font-mono text-red-755">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="flat" className="p-4 bg-gradient-to-br from-emerald-50 to-white">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Est. Total Spend</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-900 mt-2">
            ${summary?.totalEstimatedCost.toFixed(4) || "0.0000"}
          </p>
          <span className="text-[9px] font-mono text-zinc-400 mt-1 block">
            Token counts x admin rates
          </span>
        </Card>

        <Card variant="flat" className="p-4">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Total AI Requests</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-900 mt-2">
            {summary?.totalCalls.toLocaleString() || 0}
          </p>
          <span className="text-[9px] font-mono text-zinc-400 mt-1 block">
            API calls across providers
          </span>
        </Card>

        <Card variant="flat" className="p-4">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Input Tokens</span>
            <Cpu className="w-4 h-4 text-violet-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-900 mt-2">
            {summary?.totalInputTokens.toLocaleString() || 0}
          </p>
          <span className="text-[9px] font-mono text-zinc-400 mt-1 block">
            Prompt / context tokens
          </span>
        </Card>

        <Card variant="flat" className="p-4">
          <div className="flex items-center justify-between text-zinc-600">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Output Tokens</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-mono font-bold text-zinc-900 mt-2">
            {summary?.totalOutputTokens.toLocaleString() || 0}
          </p>
          <span className="text-[9px] font-mono text-zinc-400 mt-1 block">
            Generated response tokens
          </span>
        </Card>
      </div>

      {/* Daily Spend Trend */}
      <Card variant="flat" className="p-6">
        <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-violet-650" /> Daily Spend Trend
          </h3>
          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase">
            {dailyTrend.length} active days in window
          </span>
        </div>

        {dailyTrend.length === 0 ? (
          <p className="text-xs font-mono text-zinc-400 py-6 text-center">
            No API usage recorded in this time window.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="h-32 flex items-end gap-1.5 pt-4 pb-2 px-2 border-b border-zinc-200 overflow-x-auto">
              {dailyTrend.map((d) => {
                const maxCost = Math.max(...dailyTrend.map((t) => t.cost), 0.0001);
                const heightPct = Math.max(8, Math.round((d.cost / maxCost) * 100));
                return (
                  <div
                    key={d.date}
                    className="flex-1 min-w-[20px] flex flex-col items-center group relative"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-zinc-900 text-white text-[9px] font-mono rounded px-2 py-1 z-10 whitespace-nowrap shadow-lg">
                      {d.date}: ${d.cost.toFixed(4)} ({d.calls} calls, {(d.inputTokens + d.outputTokens).toLocaleString()} tok)
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-violet-600 rounded-t-sm hover:bg-violet-500 transition-colors"
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-400 pt-1">
              <span>{dailyTrend[0]?.date}</span>
              <span>{dailyTrend[dailyTrend.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Breakdowns by Tab */}
      <Card variant="flat" className="p-6">
        <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("feature")}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-lg border-2 border-zinc-955 transition-all ${
                activeTab === "feature" ? "bg-violet-650 text-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              By AI Feature
            </button>
            <button
              onClick={() => setActiveTab("user")}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-lg border-2 border-zinc-955 transition-all ${
                activeTab === "user" ? "bg-violet-650 text-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              By User
            </button>
            <button
              onClick={() => setActiveTab("site")}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-lg border-2 border-zinc-955 transition-all ${
                activeTab === "site" ? "bg-violet-650 text-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              By Website
            </button>
            <button
              onClick={() => setActiveTab("provider")}
              className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-lg border-2 border-zinc-955 transition-all ${
                activeTab === "provider" ? "bg-violet-650 text-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" : "bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              By Provider / Model
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-zinc-955 rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-955 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600">
                <th className="py-2.5 px-4">
                  {activeTab === "feature" ? "Feature Tag" : activeTab === "user" ? "User ID" : activeTab === "site" ? "Site ID" : "Provider / Model"}
                </th>
                <th className="py-2.5 px-4 text-right">Total Requests</th>
                <th className="py-2.5 px-4 text-right">Input Tokens</th>
                <th className="py-2.5 px-4 text-right">Output Tokens</th>
                <th className="py-2.5 px-4 text-right">Est. Spend ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs font-mono">
              {activeTab === "feature" &&
                featureBreakdown.map((item) => (
                  <tr key={item.featureTag} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-4 font-bold text-zinc-800">
                      <Badge variant="violet" className="text-[10px]">
                        {item.featureTag || "unspecified_feature"}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">{item.calls.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.inputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.outputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">${item.cost.toFixed(4)}</td>
                  </tr>
                ))}

              {activeTab === "user" &&
                userBreakdown.map((item) => (
                  <tr key={item.userId} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-4 font-bold text-zinc-800 truncate max-w-xs">{item.userId}</td>
                    <td className="py-2.5 px-4 text-right">{item.calls.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.inputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.outputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">${item.cost.toFixed(4)}</td>
                  </tr>
                ))}

              {activeTab === "site" &&
                siteBreakdown.map((item) => (
                  <tr key={item.siteId} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-4 font-bold text-zinc-800 truncate max-w-xs">{item.siteId}</td>
                    <td className="py-2.5 px-4 text-right">{item.calls.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.inputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.outputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">${item.cost.toFixed(4)}</td>
                  </tr>
                ))}

              {activeTab === "provider" &&
                providerBreakdown.map((item) => (
                  <tr key={item.provider} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-4 font-bold text-zinc-800">
                      <Badge variant="emerald" className="text-[10px]">
                        {item.provider}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right">{item.calls.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.inputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right text-zinc-500">{item.outputTokens.toLocaleString()}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">${item.cost.toFixed(4)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Expensive Requests */}
      <Card variant="flat" className="p-6">
        <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> Top Expensive Individual Requests
          </h3>
          <span className="text-[9px] font-mono text-zinc-400">
            N heaviest token calls (prompt content excluded for privacy)
          </span>
        </div>

        <div className="overflow-x-auto border-2 border-zinc-955 rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-955 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600">
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Feature</th>
                <th className="py-2.5 px-4">Provider / Model</th>
                <th className="py-2.5 px-4 text-right">Tokens (In / Out)</th>
                <th className="py-2.5 px-4 text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs font-mono">
              {topExpensive.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-400">
                    No requests recorded yet.
                  </td>
                </tr>
              ) : (
                topExpensive.map((req) => (
                  <tr key={req.id} className="hover:bg-zinc-50">
                    <td className="py-2.5 px-4 text-zinc-500 text-[11px]">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-zinc-800">
                      <Badge variant="violet" className="text-[9px]">
                        {req.featureTag}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-600 text-[11px]">
                      <span className="font-bold">{req.provider}</span> ({req.model})
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-600">
                      {req.inputTokens.toLocaleString()} / {req.outputTokens.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                      ${req.estimatedCost.toFixed(5)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
