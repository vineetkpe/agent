import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface ApiUsageItem {
  provider: string;
  success: number;
  failure: number;
  total: number;
  failovers?: number;
}

interface ApiFeatureItem {
  callType: string;
  success: number;
  failure: number;
  total: number;
  failovers?: number;
}

interface ApiUserItem {
  userId: string;
  totalCalls: number;
}

interface UsageBreakdownProps {
  usage: ApiUsageItem[];
  byFeature?: ApiFeatureItem[];
  byUser?: ApiUserItem[];
}

export const UsageBreakdown: React.FC<UsageBreakdownProps> = ({ usage, byFeature = [], byUser = [] }) => {
  return (
    <Card className="p-6 space-y-6">
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-600 block">
          Telemetry & AI Cost Analytics
        </span>
        <h3 className="text-lg font-extrabold text-zinc-950 font-mono">AI Usage & Provider Breakdown</h3>
      </div>

      {/* 1. By Provider */}
      <div>
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 mb-3">
          Usage by AI Provider (30d)
        </h4>
        {usage.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
            <p className="text-xs text-zinc-400 font-mono">No AI requests logged in the last 30 days.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {usage.map((item, idx) => {
              const successPct = item.total > 0 ? Math.round((item.success / item.total) * 100) : 0;

              return (
                <div key={idx} className="p-4 rounded-xl border-2 border-zinc-950 bg-zinc-50 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm uppercase tracking-wide font-mono text-zinc-900">
                        {item.provider}
                      </span>
                      <Badge variant={item.failure > 0 ? "amber" : "emerald"}>
                        {item.total} calls
                      </Badge>
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-650">
                      {successPct}% success rate
                    </span>
                  </div>

                  <div className="w-full h-3.5 rounded-full overflow-hidden border border-zinc-950 bg-red-400 flex">
                    <div
                      style={{ width: `${successPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-zinc-500">
                    <span className="text-emerald-600 font-bold">✓ {item.success} Succeeded</span>
                    <span className="text-red-500 font-bold">⚠ {item.failure} Failed / Fallback</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. By Feature / Call Type */}
      {byFeature.length > 0 && (
        <div className="border-t border-zinc-200 pt-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 mb-3">
            Usage by Feature / Call Type
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-950 bg-zinc-100 text-zinc-700">
                  <th className="py-2 px-3">Call Type / Feature</th>
                  <th className="py-2 px-3">Total Calls</th>
                  <th className="py-2 px-3">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {byFeature.map((item, idx) => {
                  const pct = item.total > 0 ? Math.round((item.success / item.total) * 100) : 0;
                  return (
                    <tr key={idx} className="border-b border-zinc-200">
                      <td className="py-2 px-3 font-bold text-zinc-900">{item.callType}</td>
                      <td className="py-2 px-3 text-zinc-700">{item.total}</td>
                      <td className="py-2 px-3 text-emerald-600 font-bold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Top Consumers */}
      {byUser.length > 0 && (
        <div className="border-t border-zinc-200 pt-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600 mb-3">
            Top AI Call Consumers (User ID)
          </h4>
          <div className="space-y-2">
            {byUser.map((userItem, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs font-mono py-1 border-b border-zinc-100">
                <span className="text-zinc-700 truncate max-w-[200px]">{userItem.userId}</span>
                <span className="font-bold text-violet-600">{userItem.totalCalls} calls</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
export default UsageBreakdown;
