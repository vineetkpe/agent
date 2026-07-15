import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

interface ApiUsageItem {
  provider: string;
  success: number;
  failure: number;
  total: number;
}

interface UsageBreakdownProps {
  usage: ApiUsageItem[];
}

export const UsageBreakdown: React.FC<UsageBreakdownProps> = ({ usage }) => {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-600 block">
          Telemetry Analytics
        </span>
        <h3 className="text-lg font-extrabold text-zinc-950 font-mono">AI Provider Success Rate</h3>
      </div>

      {usage.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
          <p className="text-xs text-zinc-400 font-mono">No AI requests logged in the last 30 days.</p>
        </div>
      ) : (
        <div className="space-y-6">
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

                {/* Progress bar representing success vs failure */}
                <div className="w-full h-3.5 rounded-full overflow-hidden border border-zinc-950 bg-red-400 flex">
                  <div
                    style={{ width: `${successPct}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                  />
                </div>

                <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-zinc-500">
                  <span className="text-emerald-600 font-bold">✓ {item.success} Succeeded</span>
                  <span className="text-red-500 font-bold">⚠ {item.failure} Fallback/Mocked</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
export default UsageBreakdown;
