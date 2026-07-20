import React, { useState } from "react";
import { CheckCircle, XCircle, Sparkles, AlertTriangle, ChevronDown, ChevronUp, Clock, Info } from "lucide-react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface TasksTabProps {
  allUserAuditItems: any[];
  handleActionItem: (itemId: string, action: "approve" | "reject") => void;
  copiedId: string | null;
  handleCopyText: (text: string, id: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  allUserAuditItems,
  handleActionItem,
  copiedId,
  handleCopyText,
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAskAi = (item: any) => {
    const detailText = `How do I resolve this issue?
Type: ${item.type.replace("_", " ")}
Site: ${item.site?.url}
Target URL: ${item.targetUrl}
Current State: ${item.currentValue || "Missing"}
AI Recommendation Suggestion: ${item.suggestedValue || "None"}`;

    window.dispatchEvent(
      new CustomEvent("chatbot:seed", {
        detail: { text: detailText },
      })
    );
  };

  // Group items by priority/status
  const criticalTasks = allUserAuditItems.filter((i) => i.status === "pending" && i.priority === "critical");
  const highTasks = allUserAuditItems.filter((i) => i.status === "pending" && i.priority === "high");
  const mediumTasks = allUserAuditItems.filter((i) => i.status === "pending" && i.priority === "medium");
  const lowTasks = allUserAuditItems.filter((i) => i.status === "pending" && i.priority === "low");
  const completedTasks = allUserAuditItems.filter((i) => i.status === "applied" || i.status === "approved" || i.status === "rolled_back");

  const groups = [
    { title: "Critical Tasks", items: criticalTasks, badgeVariant: "red" as const, colorClass: "text-red-650" },
    { title: "High Priority", items: highTasks, badgeVariant: "violet" as const, colorClass: "text-violet-650" },
    { title: "Medium Priority", items: mediumTasks, badgeVariant: "amber" as const, colorClass: "text-amber-700" },
    { title: "Low Priority", items: lowTasks, badgeVariant: "zinc" as const, colorClass: "text-zinc-500" },
    { title: "Completed Fixes", items: completedTasks, badgeVariant: "emerald" as const, colorClass: "text-emerald-600" },
  ];

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      <div className="border-b pb-4 border-zinc-100">
        <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
          <CheckCircle className="w-5 h-5 text-violet-500" /> SEO Tasks Control Center
        </h2>
        <p className="text-sm mt-1 text-zinc-550">
          A unified action tracker collecting every SEO fix, content recommendation, and structural optimization across all your domains.
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((g) => {
          if (g.items.length === 0) return null;

          return (
            <Card key={g.title} variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150 mb-4">
                <h3 className={`font-mono font-extrabold text-sm uppercase tracking-wider ${g.colorClass}`}>
                  {g.title}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border border-zinc-300 bg-zinc-50 text-zinc-500">
                  {g.items.length} issues
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-950 font-mono font-bold text-zinc-500 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Site / Target</th>
                      <th className="py-2.5 px-3">Recommendation</th>
                      <th className="py-2.5 px-3 text-center">Impact</th>
                      <th className="py-2.5 px-3 text-center">Diff</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {g.items.map((item) => {
                      const isExpanded = !!expandedIds[item.id];
                      const title = `${item.type.replace("_", " ")}`;
                      const cleanUrl = item.targetUrl.replace(/^https?:\/\//i, "");

                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-zinc-50/50 font-mono transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-bold text-zinc-900 truncate max-w-[200px]" title={item.site?.url}>
                                {item.site?.url.replace(/^https?:\/\/(www\.)?/i, "")}
                              </div>
                              <div className="text-[10px] text-zinc-400 truncate max-w-[200px]" title={item.targetUrl}>
                                /{cleanUrl.substring(cleanUrl.indexOf("/"))}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-zinc-805 block capitalize">{title}</span>
                              <span className="text-zinc-500 text-[10px] line-clamp-1">
                                {item.suggestedValue}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">
                              <span className="text-violet-650">{item.impactScore || "--"}/10</span>
                            </td>
                            <td className="py-3 px-3 text-center font-bold">
                              <span className="text-zinc-600">{item.difficultyScore || "--"}/10</span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide inline-block ${
                                item.status === "applied" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                item.status === "rolled_back" ? "bg-zinc-100 text-zinc-500 border border-zinc-200" :
                                item.status === "approved" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                "bg-amber-50 text-amber-500 border border-amber-100"
                              }`}>
                                {item.status === "applied" ? "Applied" :
                                 item.status === "rolled_back" ? "Rolled Back" :
                                 item.status === "approved" ? "Approved" : "Pending"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => toggleExpand(item.id)}
                                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 inline-flex items-center justify-center align-middle"
                                title="Toggle Details"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>

                              {item.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleActionItem(item.id, "reject")}
                                    className="p-1.5 rounded-lg border border-rose-250 bg-rose-50/50 hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center align-middle"
                                    title="Reject"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleActionItem(item.id, "approve")}
                                    className="p-1.5 rounded-lg border border-emerald-250 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 inline-flex items-center justify-center align-middle"
                                    title="Approve"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleAskAi(item)}
                                className="p-1.5 rounded-lg border border-violet-250 bg-violet-50/50 hover:bg-violet-50 text-violet-650 inline-flex items-center justify-center align-middle"
                                title="Ask Growth AI"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="bg-zinc-50/40 p-4 border-b border-zinc-200">
                                <div className="space-y-3 font-mono text-xs leading-relaxed text-zinc-650">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-white rounded-xl border border-zinc-200">
                                      <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider mb-1">Current State</span>
                                      <p className="break-all">{item.currentValue || "Missing or empty attribute"}</p>
                                    </div>
                                    <div className="p-3 bg-violet-50/10 rounded-xl border border-violet-200">
                                      <span className="text-[10px] text-violet-600 font-bold block uppercase tracking-wider mb-1">Suggested Optimization</span>
                                      <p className="break-all">{item.suggestedValue}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
