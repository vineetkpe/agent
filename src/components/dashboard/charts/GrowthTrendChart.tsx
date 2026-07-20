"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card } from "../../ui/Card";
import { supabase } from "@/lib/supabaseClient";
import { Calendar, Activity } from "lucide-react";

interface GrowthTrendChartProps {
  currentSite: any;
}

export const GrowthTrendChart: React.FC<GrowthTrendChartProps> = ({ currentSite }) => {
  const [range, setRange] = useState<"7d" | "30d" | "6mo" | "1yr">("30d");
  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [earliestDataAt, setEarliestDataAt] = useState<string | null>(null);
  const [gscConnected, setGscConnected] = useState(false);
  const [gaConnected, setGaConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrendData = async () => {
    if (!currentSite?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      if (typeof window !== "undefined") {
        const impToken = localStorage.getItem("impersonation_token");
        if (impToken) {
          headers["x-impersonation-token"] = impToken;
        }
      }

      const res = await fetch(
        `/api/analytics/trend?siteId=${currentSite.id}&range=${range}`,
        { headers }
      );
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to load trend analytics.");
      }

      setDataPoints(resData.dataPoints || []);
      setEarliestDataAt(resData.earliestDataAt);
      setGscConnected(resData.gscConnected || false);
      setGaConnected(resData.gaConnected || false);
    } catch (err: any) {
      console.error("[GrowthTrendChart] Error fetching trend data:", err);
      setError(err.message || "Failed to load trend analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
  }, [currentSite?.id, range]);

  // Determine if historical data range exceeds the actual duration since account creation
  const daysOfHistoryAvailable = React.useMemo(() => {
    if (!earliestDataAt) return 0;
    const diffMs = Date.now() - new Date(earliestDataAt).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, [earliestDataAt]);

  const requestedDays = React.useMemo(() => {
    if (range === "7d") return 7;
    if (range === "30d") return 30;
    if (range === "6mo") return 180;
    if (range === "1yr") return 365;
    return 30;
  }, [range]);

  const isHistoryInsufficient = daysOfHistoryAvailable < requestedDays;

  return (
    <Card variant="flat" className="flex flex-col space-y-4 w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <Activity className="w-4.5 h-4.5 text-violet-600" /> SEO & Search Growth Trend
          </h3>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            Plotting SEO score performance values {(gscConnected || gaConnected) && `& real-time search ${[gscConnected && "clicks", gaConnected && "sessions"].filter(Boolean).join(" and ")}`}
          </p>
        </div>

        {/* Range Segmented Controls */}
        <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-250 font-mono text-[10px] self-start sm:self-auto shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]">
          {(["7d", "30d", "6mo", "1yr"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-md uppercase font-bold tracking-wider transition-all cursor-pointer ${
                range === r
                  ? "bg-white text-zinc-950 shadow-sm border border-zinc-300"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isHistoryInsufficient && earliestDataAt && (
        <div className="p-3 bg-amber-50 border border-amber-205 rounded-xl text-[10px] font-mono text-amber-705 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Tracking started {daysOfHistoryAvailable} days ago (on {new Date(earliestDataAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}). Check back later for the full {requestedDays}-day view.
          </span>
        </div>
      )}

      <div className="flex-1 w-full min-h-[250px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-xs font-mono text-zinc-500 z-10">
            <span className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mr-2" />
            Loading trend stats...
          </div>
        )}

        {error ? (
          <div className="h-full flex items-center justify-center text-xs text-rose-500 font-mono">
            {error}
          </div>
        ) : dataPoints.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-mono py-12">
            No audit history found for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={dataPoints}
              margin={{ top: 10, right: gscConnected ? 20 : 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={9}
                fontFamily="monospace"
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[0, 100]}
                stroke="#7c3aed"
                fontSize={9}
                fontFamily="monospace"
                tickLine={false}
                label={{ value: "SEO Score", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fontSize: "9px", fontFamily: "monospace", fill: "#7c3aed" } }}
              />
              {(gscConnected || gaConnected) && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#10b981"
                  fontSize={9}
                  fontFamily="monospace"
                  tickLine={false}
                  label={{ value: gscConnected && gaConnected ? "Clicks / Sessions" : gscConnected ? "Organic Clicks" : "GA Sessions", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fontSize: "9px", fontFamily: "monospace", fill: "#10b981" } }}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "2px solid #09090b",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  boxShadow: "2px 2px 0px 0px rgba(9,9,11,1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="scoreSeo"
                name="SEO Score (%)"
                stroke="#7c3aed"
                strokeWidth={3}
                activeDot={{ r: 5 }}
              />
              {gscConnected && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="clicks"
                  name="Google Clicks"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
              )}
              {gaConnected && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sessions"
                  name="GA Sessions"
                  stroke="#0284c7"
                  strokeWidth={3}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
export default GrowthTrendChart;
