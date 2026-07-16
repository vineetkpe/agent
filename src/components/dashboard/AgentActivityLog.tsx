import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Activity, Play, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface ActivityLogEntry {
  id: string;
  type: "audit_completed" | "item_approved" | "item_applied" | "item_rejected" | "wp_connected";
  timestamp: string | Date;
  title: string;
  detail?: string;
  link?: string;
}

interface AgentActivityLogProps {
  activityLog: ActivityLogEntry[];
}

function getRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export const AgentActivityLog: React.FC<AgentActivityLogProps> = ({ activityLog = [] }) => {
  const [showAll, setShowAll] = useState(false);

  if (activityLog.length === 0) {
    return (
      <Card variant="flat" className="p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-150 pb-3">
          <Activity className="w-5 h-5 text-zinc-400" />
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-550">
            Agent Activity Log
          </h3>
        </div>
        <p className="text-xs text-zinc-400 italic py-2">No agent actions logged yet. Run an audit scan to begin.</p>
      </Card>
    );
  }

  const displayedEvents = showAll ? activityLog : activityLog.slice(0, 30);
  const hasMore = activityLog.length > 30;

  const getIcon = (type: string) => {
    switch (type) {
      case "audit_completed":
        return <Play className="w-3 h-3 text-indigo-650" />;
      case "item_applied":
        return <CheckCircle2 className="w-3 h-3 text-emerald-655" />;
      case "item_approved":
        return <CheckCircle2 className="w-3 h-3 text-amber-655" />;
      case "item_rejected":
        return <AlertCircle className="w-3 h-3 text-zinc-500" />;
      case "wp_connected":
        return <RefreshCw className="w-3 h-3 text-violet-650" />;
      default:
        return <Activity className="w-3 h-3 text-zinc-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "audit_completed":
        return "bg-indigo-50 border-indigo-200";
      case "item_applied":
        return "bg-emerald-50 border-emerald-250/30";
      case "item_approved":
        return "bg-amber-50 border-amber-250/30";
      case "item_rejected":
        return "bg-zinc-50 border-zinc-200";
      case "wp_connected":
        return "bg-violet-50 border-violet-250/30";
      default:
        return "bg-zinc-50 border-zinc-200";
    }
  };

  return (
    <Card variant="flat" className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-650 animate-pulse" />
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-805">
            Autonomous Agent Activity Log
          </h3>
        </div>
        <span className="text-[10px] uppercase font-bold font-mono text-zinc-400">
          Real-time operations
        </span>
      </div>

      <div className="relative pl-6 border-l-2 border-zinc-200 space-y-6 ml-2 text-xs">
        {displayedEvents.map((event) => (
          <div key={event.id} className="relative group">
            {/* Dot indicator */}
            <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white ${getBgColor(event.type)}`}>
              {getIcon(event.type)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-bold text-zinc-855 font-sans text-xs">
                  {event.title}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {getRelativeTime(event.timestamp)}
                </span>
              </div>
              
              {event.detail && (
                <p className="text-zinc-555 font-mono text-[11px] leading-relaxed break-all">
                  {event.detail}
                </p>
              )}

              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-850 underline font-mono lowercase"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> view published post
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            type="button"
            className="px-4 py-2 border-2 border-zinc-950 bg-white text-zinc-850 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55"
          >
            {showAll ? "Collapse Activities" : `View All ${activityLog.length} Activities`}
          </button>
        </div>
      )}
    </Card>
  );
};
