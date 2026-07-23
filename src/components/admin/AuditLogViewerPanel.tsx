import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Search, Filter, RefreshCw, ChevronLeft, ChevronRight, FileText, UserCheck, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface LogEntry {
  id: string;
  logSource: "admin" | "user";
  action: string;
  userId?: string;
  actorUserId?: string;
  actorRole?: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export const AuditLogViewerPanel: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [logType, setLogType] = useState<"all" | "admin" | "user">("all");
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (logType !== "all") params.set("logType", logType);
      if (search.trim()) params.set("search", search.trim());
      if (userId.trim()) params.set("userId", userId.trim());
      if (action.trim()) params.set("action", action.trim());
      params.set("page", String(page));
      params.set("limit", "15");

      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch activity logs.");
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, logType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <Card variant="flat" className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-150 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-650" />
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800">
                System Audit & Activity Logs
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                Searchable, filterable ledger of admin actions and user activities ({totalCount} total entries)
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="px-3 py-1.5 border-2 border-zinc-955 bg-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-50 flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filter Controls */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Log Type
            </label>
            <select
              value={logType}
              onChange={(e) => {
                setLogType(e.target.value as any);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 text-xs font-mono bg-white focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Logs (Admin & User)</option>
              <option value="admin">Admin Actions Only</option>
              <option value="user">User Activity Only</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Search Keywords
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Action, IP, metadata..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border-2 border-zinc-955 text-xs font-mono bg-white focus:outline-none focus:border-violet-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              User ID Filter
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Exact User UUID..."
              className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 text-xs font-mono bg-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Action Name
              </label>
              <input
                type="text"
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="e.g. login, wp_publish..."
                className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 text-xs font-mono bg-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 border-2 border-zinc-955 bg-violet-650 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-750 flex items-center gap-1 shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 rounded-xl border-2 border-red-955 bg-red-50 text-xs font-mono text-red-755">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <div className="overflow-x-auto border-2 border-zinc-955 rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-zinc-955 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-600">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">User / Actor ID</th>
                <th className="py-2.5 px-4">Metadata / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-650" />
                    Fetching log entries...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-zinc-400">
                    No log entries match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={`${log.logSource}-${log.id}`} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap text-zinc-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Badge
                        variant={log.logSource === "admin" ? "violet" : "zinc"}
                        className="text-[9px] font-mono px-2 py-0.5"
                      >
                        {log.logSource === "admin" ? (
                          <span className="flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Admin Log
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> User Activity
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 font-bold text-zinc-800">{log.action}</td>
                    <td className="py-2.5 px-4 text-zinc-600 text-[11px] truncate max-w-[140px]">
                      {log.logSource === "admin" ? log.actorUserId : log.userId || "Anonymous"}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-600 text-[11px] max-w-xs truncate">
                      {log.metadata ? (
                        <span className="text-zinc-500 font-mono text-[10px]" title={JSON.stringify(log.metadata)}>
                          {JSON.stringify(log.metadata)}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between mt-4 pt-2">
          <span className="text-xs font-mono text-zinc-500">
            Page <span className="font-bold text-zinc-800">{page}</span> of{" "}
            <span className="font-bold text-zinc-800">{totalPages}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1 border-2 border-zinc-955 bg-white text-xs font-mono font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-50 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1 border-2 border-zinc-955 bg-white text-xs font-mono font-bold rounded-lg shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-50 disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
