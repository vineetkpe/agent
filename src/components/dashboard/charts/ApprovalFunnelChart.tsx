"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Card } from "../../ui/Card";

interface ApprovalFunnelChartProps {
  items: any[];
}

export const ApprovalFunnelChart: React.FC<ApprovalFunnelChartProps> = ({ items = [] }) => {
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const approvedCount = items.filter((i) => i.status === "approved").length;
  const appliedCount = items.filter((i) => i.status === "applied").length;
  const rejectedCount = items.filter((i) => i.status === "rejected").length;

  const data = [
    { name: "Pending", count: pendingCount, color: "#f59e0b" },   // Amber
    { name: "Approved", count: approvedCount, color: "#4f46e5" },  // Indigo/Blue
    { name: "Applied", count: appliedCount, color: "#10b981" },   // Emerald
    { name: "Rejected", count: rejectedCount, color: "#71717a" },  // Zinc
  ];

  const total = items.length;
  const hasData = total > 0;

  return (
    <Card variant="flat" className="h-[280px] flex flex-col space-y-4">
      <div>
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500">
          Approval & Action Funnel
        </h3>
        <p className="text-xs text-zinc-400">Track recommendation review and deployment progress</p>
      </div>

      <div className="flex-1 w-full min-h-[160px]">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-mono">
            No audits run yet to calculate funnel progress
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <XAxis type="number" stroke="#71717a" fontSize={10} fontFamily="monospace" tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#71717a"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                width={80}
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
