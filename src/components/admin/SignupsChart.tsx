import React from "react";
import { Card } from "../ui/Card";

interface SignupItem {
  date: string;
  count: number;
}

interface SignupsChartProps {
  signups: SignupItem[];
}

export const SignupsChart: React.FC<SignupsChartProps> = ({ signups }) => {
  const maxCount = Math.max(...signups.map((s) => s.count), 1);

  return (
    <Card className="p-6 col-span-1 lg:col-span-2">
      <div className="mb-4">
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-violet-600 block">
          Telemetry Analytics
        </span>
        <h3 className="text-lg font-extrabold text-zinc-950 font-mono">Daily User Signups (Last 30 Days)</h3>
      </div>

      <div className="h-64 flex items-end gap-1.5 pt-8 pb-2 border-b-2 border-zinc-950 relative">
        {/* Horizontal gridlines for scale */}
        <div className="absolute top-8 left-0 right-0 border-t border-dashed border-zinc-200 pointer-events-none" />
        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-zinc-200 pointer-events-none" />

        {signups.map((s, idx) => {
          const heightPct = (s.count / maxCount) * 85 + 5; // offset slightly so 0 is still slightly visible
          const formattedDate = new Date(s.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip on Hover */}
              <div className="absolute -top-6 scale-0 group-hover:scale-100 transition-transform bg-zinc-950 text-white text-[10px] py-1 px-2 rounded border border-zinc-950 shadow-md font-mono z-20 pointer-events-none whitespace-nowrap">
                {formattedDate}: {s.count} signup{s.count !== 1 ? "s" : ""}
              </div>

              {/* Bar */}
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-md border-2 border-zinc-950 transition-all duration-500 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] group-hover:bg-violet-500 ${
                  s.count > 0 ? "bg-gradient-to-t from-indigo-500 to-violet-500" : "bg-zinc-150 border-zinc-300 shadow-none"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Axis labels (showing only start, middle, end for layout safety) */}
      <div className="flex justify-between mt-2 font-mono text-[9px] font-bold text-zinc-400 uppercase">
        <span>{signups[0] ? new Date(signups[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
        <span>{signups[15] ? new Date(signups[15].date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
        <span>{signups[29] ? new Date(signups[29].date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}</span>
      </div>
    </Card>
  );
};
export default SignupsChart;
