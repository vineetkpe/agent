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

interface IssueBreakdownChartProps {
  items: any[];
}

export const IssueBreakdownChart: React.FC<IssueBreakdownChartProps> = ({ items = [] }) => {
  // Count by type
  const typeCounts: Record<string, number> = {
    meta_title: 0,
    meta_description: 0,
    schema_markup: 0,
    missing_alt: 0,
    broken_link: 0,
    blog_post: 0,
  };

  items.forEach((item) => {
    if (typeCounts[item.type] !== undefined) {
      typeCounts[item.type]++;
    }
  });

  const displayNames: Record<string, string> = {
    meta_title: "Meta Title",
    meta_description: "Meta Desc",
    schema_markup: "Schema Markup",
    missing_alt: "Missing Alt",
    broken_link: "Broken Link",
    blog_post: "Blog Post",
  };

  const colors: Record<string, string> = {
    meta_title: "#7c3aed", // violet
    meta_description: "#4f46e5", // indigo
    schema_markup: "#10b981", // emerald
    missing_alt: "#f59e0b", // amber
    broken_link: "#ef4444", // red
    blog_post: "#ec4899", // pink
  };

  const data = Object.keys(typeCounts).map((key) => ({
    name: displayNames[key] || key,
    count: typeCounts[key],
    rawKey: key,
  })).filter(d => d.count > 0); // Only show types that have > 0 counts

  const hasData = data.length > 0;

  return (
    <Card variant="flat" className="h-[350px] flex flex-col space-y-4">
      <div>
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-500">
          Issue Breakdown by Category
        </h3>
        <p className="text-xs text-zinc-400">Distribution of flagged items across areas</p>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-mono">
            No issues found to display breakdown
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis type="number" stroke="#71717a" fontSize={10} fontFamily="monospace" tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#71717a"
                fontSize={10}
                fontFamily="monospace"
                tickLine={false}
                width={100}
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[entry.rawKey] || "#71717a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
