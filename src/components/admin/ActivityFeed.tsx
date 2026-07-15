import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Globe, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  status: string;
  targetUrl: string;
  createdAt: string;
  email: string;
}

interface ActivityFeedProps {
  activity: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activity }) => {
  // Utility for time-ago formatting
  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "blog_post":
        return <FileText className="w-4 h-4 text-violet-500" />;
      case "broken_link":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Globe className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getBadgeVariant = (status: string): "violet" | "emerald" | "amber" | "red" | "zinc" | undefined => {
    switch (status) {
      case "applied":
        return "emerald";
      case "approved":
        return "violet";
      case "rejected":
        return "red";
      default:
        return "zinc";
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-rose-600 block">
          Telemetry Activity
        </span>
        <h3 className="text-lg font-extrabold text-zinc-950 font-mono">Recent Operations Feed</h3>
      </div>

      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1.5 scrollbar-thin">
        {activity.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
            <p className="text-xs text-zinc-400 font-mono">No recent activity logs found.</p>
          </div>
        ) : (
          activity.map((act) => (
            <div
              key={act.id}
              className="p-3.5 border-2 border-zinc-950 rounded-xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-zinc-50 border-2 border-zinc-950 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] shrink-0 mt-0.5">
                  {getIconForType(act.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-900 truncate" title={act.email}>
                      {act.email}
                    </span>
                    <span className="text-[10px] text-zinc-450 font-mono">({timeAgo(act.createdAt)})</span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-1 truncate" title={act.targetUrl}>
                    {act.type.toUpperCase()}: {act.targetUrl}
                  </p>
                </div>
              </div>

              <Badge variant={getBadgeVariant(act.status)} className="shrink-0 self-start sm:self-center">
                {act.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
export default ActivityFeed;
