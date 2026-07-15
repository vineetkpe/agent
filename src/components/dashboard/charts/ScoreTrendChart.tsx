"use client";

import React from "react";
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

interface ScoreTrendChartProps {
  pastAudits: any[];
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ pastAudits = [] }) => {
  const isSingle = pastAudits.length === 1;

  // Format data for chart
  const data = pastAudits.map((audit) => ({
    date: new Date(audit.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
    SEO: audit.scoreSeo || 0,
    Performance: audit.scorePerformance || 0,
  }));

  return (
    <Card variant="flat" className="h-[350px] flex flex-col space-y-4">
      <div>
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500">
          SEO & Performance Score Trend
        </h3>
        <p className="text-xs text-zinc-400">History of your score metrics over time</p>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        {pastAudits.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-mono">
            No audits run yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#71717a"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
              />
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
                  fontSize: "10px",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              />
              <Line
                type="monotone"
                dataKey="SEO"
                stroke="#7c3aed"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Performance"
                stroke="#10b981"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {isSingle && (
        <p className="text-[11px] font-mono text-zinc-500 text-center italic bg-zinc-50 py-1.5 rounded-lg border border-zinc-200">
          Run more audits over time to see your trend
        </p>
      )}
    </Card>
  );
};
