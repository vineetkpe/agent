import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { supabase } from "@/lib/supabaseClient";
import { Search, AlertTriangle, ShieldCheck, Mail, Calendar, CheckSquare, MessageSquare, Clock, Filter, Eye } from "lucide-react";

export const ActivityFeedbackPanel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState("");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("");

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    setErrorMsg("");
    try {
      const headers = await getHeaders();
      const query = new URLSearchParams({
        search,
        action: actionFilter,
        dateFrom,
        dateTo
      }).toString();
      const res = await fetch(`/api/admin/activity?${query}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setSuspiciousUsers(data.suspiciousUsers || []);
      } else {
        setErrorMsg(data.error || "Failed to load activity logs.");
      }
    } catch (err) {
      setErrorMsg("Network error loading logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/feedback", { headers });
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.feedback || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleUpdateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ feedbackId, status: newStatus }),
      });
      if (res.ok) {
        fetchFeedback();
        fetchLogs(); // refresh activity feed log too
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchFeedback();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const filteredFeedbacks = feedbacks.filter((f) => {
    if (feedbackTypeFilter && f.type !== feedbackTypeFilter) return false;
    if (feedbackStatusFilter && f.status !== feedbackStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-slide-up font-mono text-xs">
      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-800 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: Suspicious Flags and General Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters */}
        <div className="lg:col-span-2">
          <Card variant="flat" className="p-5 border-2 border-zinc-950 bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <Filter className="w-4.5 h-4.5 text-violet-605" />
              <h3 className="font-bold text-sm uppercase text-zinc-900">Search Activity Filters</h3>
            </div>
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">SEARCH USER (EMAIL/ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. user@example.com"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-zinc-950 rounded-xl focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">ACTION TYPE</label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-zinc-950 rounded-xl focus:outline-none bg-white text-xs"
                  >
                    <option value="">All Actions</option>
                    <option value="login">Logins</option>
                    <option value="audit_run">Audit Scans</option>
                    <option value="chat_message">Chat Messages</option>
                    <option value="wp_connect">WordPress Connects</option>
                    <option value="wp_publish">WordPress Publishes</option>
                    <option value="plan_upgrade">Plan Upgrades</option>
                    <option value="plan_cancel">Plan Cancellations</option>
                    <option value="site_created">Site Created</option>
                    <option value="site_deleted">Site Deleted</option>
                    <option value="feedback_submitted">Feedback Submits</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">DATE FROM</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-zinc-950 rounded-xl focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">DATE TO</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-zinc-950 rounded-xl focus:outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingLogs}
                className="w-full py-2 border-2 border-zinc-950 bg-zinc-950 text-white font-extrabold uppercase rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(139,92,246,1)] hover:bg-zinc-800"
              >
                {loadingLogs ? "Searching..." : "Apply Filters"}
              </button>
            </form>
          </Card>
        </div>

        {/* Suspicious Chat Indicators */}
        <div className="lg:col-span-1">
          <Card variant="flat" className="p-5 border-2 border-zinc-950 bg-white space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-600 border-b border-rose-100 pb-2">
                <AlertTriangle className="w-4.5 h-4.5" />
                <h3 className="font-bold text-sm uppercase text-rose-800">Suspicious Chat Flags</h3>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Users triggering heuristic prompt injection patterns in the chatbot. Keep monitored for security compliance.
              </p>

              <div className="space-y-2 overflow-y-auto max-h-[160px] divide-y divide-zinc-100">
                {suspiciousUsers.length === 0 ? (
                  <div className="text-center text-zinc-400 py-6 text-[10px]">No suspicious flags detected.</div>
                ) : (
                  suspiciousUsers.map((user) => (
                    <div key={user.userId} className="py-2 flex items-center justify-between">
                      <div className="truncate max-w-[150px]">
                        <span className="font-bold text-zinc-800 block text-[11px] truncate">{user.email}</span>
                        <span className="text-[9px] text-zinc-400 block truncate">{user.userId}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 font-extrabold text-[10px]">
                        {user.suspiciousCount} Flag(s)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-100 text-[9px] text-zinc-400">
              * Flags record occurrences of keywords like "ignore previous" or "system prompt" within the chat logs.
            </div>
          </Card>
        </div>
      </div>

      {/* Grid: Timelines and Feeds */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* User Activity Logs timeline */}
        <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
            <Clock className="w-4.5 h-4.5 text-zinc-500" />
            <h3 className="font-bold text-sm uppercase text-zinc-900">User Activity Chronology</h3>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 divide-y divide-zinc-100">
            {loadingLogs ? (
              <div className="text-center py-10 text-zinc-400">Querying DB logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-zinc-400">No matching activities found.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="pt-3 first:pt-0 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-zinc-900 text-xs">{log.userEmail}</span>
                      <span className="text-[9px] text-zinc-400 block truncate font-sans max-w-sm">{log.userId}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded border border-zinc-950 font-black text-[9px] uppercase tracking-wider bg-zinc-50">
                      {log.action}
                    </span>
                  </div>

                  <div className="text-[10px] text-zinc-555 space-y-1 bg-zinc-50/50 p-2.5 border border-zinc-150 rounded-lg">
                    <div className="flex justify-between font-mono">
                      <span>IP: {log.ipAddress || "N/A"}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.metadata && (
                      <div className="mt-1 text-[9px] text-zinc-405 font-mono break-all leading-tight bg-zinc-900 text-zinc-300 p-1.5 rounded">
                        <strong>Meta:</strong> {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Feedback management feed */}
        <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-150 pb-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4.5 h-4.5 text-violet-605" />
              <h3 className="font-bold text-sm uppercase text-zinc-900">User Bug Reports & Suggestions</h3>
            </div>
            
            {/* Filter selectors */}
            <div className="flex gap-2">
              <select
                value={feedbackTypeFilter}
                onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                className="px-2 py-1 border border-zinc-300 rounded text-[9px] font-mono bg-white"
              >
                <option value="">All Types</option>
                <option value="bug">Bugs</option>
                <option value="suggestion">Suggestions</option>
                <option value="other">Others</option>
              </select>
              <select
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                className="px-2 py-1 border border-zinc-300 rounded text-[9px] font-mono bg-white"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 divide-y divide-zinc-100">
            {loadingFeedback ? (
              <div className="text-center py-10 text-zinc-400">Loading feedbacks...</div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-10 text-zinc-400">No feedback submissions found.</div>
            ) : (
              filteredFeedbacks.map((f) => (
                <div key={f.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-zinc-900 block">{f.userEmail}</span>
                      <span className="text-[9px] text-zinc-450 mt-0.5 block">
                        Submitted: {new Date(f.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-2 items-center">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        f.type === "bug" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                        f.type === "suggestion" ? "bg-sky-100 text-sky-800 border border-sky-200" :
                        "bg-zinc-100 text-zinc-700 border border-zinc-200"
                      }`}>
                        {f.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        f.status === "resolved" ? "bg-emerald-500 text-white" :
                        f.status === "reviewed" ? "bg-amber-500 text-white" :
                        "bg-zinc-300 text-zinc-700"
                      }`}>
                        {f.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 border border-zinc-150 p-3 rounded-xl font-mono text-[11px] leading-relaxed text-zinc-800">
                    <p className="whitespace-pre-wrap">{f.message}</p>
                    {f.pageContext && (
                      <p className="mt-2 text-[9px] text-zinc-450 border-t border-zinc-150 pt-1">
                        <strong>Page context:</strong> {f.pageContext}
                      </p>
                    )}
                    {f.resolvedAt && (
                      <p className="mt-1 text-[9px] text-emerald-600 font-bold">
                        Resolved: {new Date(f.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 text-[9px]">
                    <button
                      onClick={() => handleUpdateFeedbackStatus(f.id, "reviewed")}
                      disabled={f.status === "reviewed"}
                      className="px-2.5 py-1 border border-zinc-950 bg-white hover:bg-zinc-100 rounded text-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                      type="button"
                    >
                      Mark Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateFeedbackStatus(f.id, "resolved")}
                      disabled={f.status === "resolved"}
                      className="px-2.5 py-1 border border-zinc-950 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                      type="button"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default ActivityFeedbackPanel;
