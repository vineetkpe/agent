import React, { useState } from "react";
import { Activity, Clock, ShieldCheck, Play, Pause, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { getEffectivePlanLimits } from "@/lib/planLimits";
import { supabase } from "@/lib/supabaseClient";

interface UptimeWidgetProps {
  currentSite: any;
  uptimeChecks: any[];
  currentUser: any;
  onRefresh: () => void;
}

interface Incident {
  start: Date;
  end: Date | null;
  durationMinutes: number | null;
  error: string;
}

export const UptimeWidget: React.FC<UptimeWidgetProps> = ({
  currentSite,
  uptimeChecks = [],
  currentUser,
  onRefresh,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const limits = getEffectivePlanLimits(currentUser);

  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/site/uptime-toggle", {
        method: "POST",
        headers,
        body: JSON.stringify({ siteId: currentSite.id, enabled }),
      });
      if (res.ok) {
        onRefresh();
      } else {
        alert("Failed to update uptime preferences.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(false);
    }
  };

  // 1. Plan check
  if (!limits.uptimeMonitoring) {
    return (
      <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-150">
          <Activity className="w-5 h-5 text-zinc-400" />
          <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider">
            Uptime Monitoring
          </h3>
        </div>
        <div className="py-4 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
          <p className="text-xs text-zinc-550 leading-relaxed font-mono max-w-md mx-auto">
            Uptime checks are currently limited to premium tiers. Upgrade to Starter or above to track response latency and server outages every 5 minutes.
          </p>
        </div>
      </Card>
    );
  }

  // 2. Disabled state
  if (!currentSite?.uptimeMonitoringEnabled) {
    return (
      <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-400" />
            <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider">
              Uptime Monitoring
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-100 text-zinc-450 border border-zinc-200 uppercase tracking-wide font-mono">
            Paused
          </span>
        </div>
        <div className="py-4 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
          <p className="text-xs text-zinc-550 leading-relaxed font-mono max-w-md mx-auto">
            Uptime monitoring is currently disabled for this site. Enable checks to begin tracking latency and availability.
          </p>
          <Button
            variant="primary"
            onClick={() => handleToggle(true)}
            disabled={isToggling}
            className="text-xs"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" /> Enable Uptime Checks
          </Button>
        </div>
      </Card>
    );
  }

  // 3. Waiting for checks state
  if (uptimeChecks.length === 0) {
    return (
      <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-650" />
            <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider">
              Uptime Monitoring
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-100 uppercase tracking-wide font-mono animate-pulse">
            Active / Waiting
          </span>
        </div>
        <div className="py-6 text-center space-y-4">
          <Clock className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-zinc-800 font-mono uppercase tracking-wide">
              Waiting for first check...
            </p>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-mono max-w-md mx-auto">
              Please ensure your cron job is configured at <strong>cron-job.org</strong> pointing to:
              <br />
              <code className="text-[10px] text-violet-600 bg-violet-50 px-1 py-0.5 rounded border mt-1 inline-block select-all">
                {window.location.origin}/api/cron/uptime-check
              </code>
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => handleToggle(false)}
            disabled={isToggling}
            className="text-[10px] py-1"
          >
            <Pause className="w-3 h-3 mr-1" /> Pause Checks
          </Button>
        </div>
      </Card>
    );
  }

  // 4. Calculate real uptime stats
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const checks7d = uptimeChecks.filter((c) => new Date(c.checkedAt) >= sevenDaysAgo);
  const checks30d = uptimeChecks.filter((c) => new Date(c.checkedAt) >= thirtyDaysAgo);

  const calculateUptimePercent = (checks: any[]) => {
    if (checks.length === 0) return 100;
    const ups = checks.filter((c) => c.isUp).length;
    return (ups / checks.length) * 100;
  };

  const uptime7d = calculateUptimePercent(checks7d);
  const uptime30d = calculateUptimePercent(checks30d);

  const responseTimes = uptimeChecks.filter((c) => c.isUp && c.responseTimeMs !== null);
  const avgLatency = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((sum, c) => sum + (c.responseTimeMs || 0), 0) / responseTimes.length)
    : 0;

  // 5. Calculate Incident list (grouping consecutive failures)
  const chronologicalChecks = [...uptimeChecks].sort(
    (a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime()
  );

  const incidents: Incident[] = [];
  let currentIncident: Incident | null = null;

  for (const check of chronologicalChecks) {
    if (!check.isUp) {
      if (!currentIncident) {
        currentIncident = {
          start: new Date(check.checkedAt),
          end: null,
          durationMinutes: null,
          error: check.errorMessage || `HTTP status code: ${check.statusCode || "Error"}`,
        };
      }
    } else {
      if (currentIncident) {
        currentIncident.end = new Date(check.checkedAt);
        const diffMs = currentIncident.end.getTime() - currentIncident.start.getTime();
        currentIncident.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
        incidents.push(currentIncident);
        currentIncident = null;
      }
    }
  }

  if (currentIncident) {
    const diffMs = Date.now() - currentIncident.start.getTime();
    currentIncident.durationMinutes = Math.max(1, Math.round(diffMs / 60000));
    incidents.push(currentIncident);
  }

  const latestIncidents = incidents.reverse().slice(0, 5);
  const isCurrentlyUp = currentSite.currentUptimeStatus === "up";

  return (
    <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-650 animate-pulse" />
          <div>
            <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider">
              Uptime & Response Latency
            </h3>
            {currentSite.lastUptimeCheckAt && (
              <p className="text-[10px] text-zinc-450 font-mono mt-0.5">
                Last checked: {new Date(currentSite.lastUptimeCheckAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wide font-mono flex items-center gap-1 ${
            isCurrentlyUp 
              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
              : "bg-rose-50 text-rose-600 border-rose-100"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isCurrentlyUp ? "bg-emerald-500 animate-ping" : "bg-rose-500 animate-ping"}`} />
            {isCurrentlyUp ? "Operational" : "Outage"}
          </span>

          <button
            onClick={() => handleToggle(false)}
            disabled={isToggling}
            className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
            title="Pause checking"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 border-b border-zinc-100 pb-5">
        <div>
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono block">7d Uptime</span>
          <span className="text-md font-extrabold text-zinc-800 font-mono mt-1 block">
            {uptime7d.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono block">30d Uptime</span>
          <span className="text-md font-extrabold text-zinc-800 font-mono mt-1 block">
            {uptime30d.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono block">Avg Latency</span>
          <span className="text-md font-extrabold text-violet-650 font-mono mt-1 block">
            {avgLatency}ms
          </span>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3 font-mono text-[11px]">
        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Outage Incident History</span>
        {latestIncidents.length > 0 ? (
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {latestIncidents.map((incident, idx) => (
              <div key={idx} className="p-2 border border-zinc-150 rounded-lg flex items-center justify-between gap-3 bg-zinc-50/50">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-zinc-700">Downtime</span>
                    <span className="text-[9px] text-zinc-450">({incident.start.toLocaleDateString()})</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 truncate max-w-xs">{incident.error}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-rose-600 block">
                    {incident.end ? `${incident.durationMinutes}m` : "Active Outage"}
                  </span>
                  <span className="text-[9px] text-zinc-400 block">
                    {incident.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 border border-dashed border-zinc-200 rounded-lg text-center text-zinc-450 font-mono text-[10px] flex items-center justify-center gap-1.5 bg-zinc-50/20">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> All pings successful — no incident recorded
          </div>
        )}
      </div>
    </Card>
  );
};
