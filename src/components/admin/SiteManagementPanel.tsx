import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Globe, RefreshCw, Trash2, Search, Zap, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SiteEntry {
  id: string;
  url: string;
  wpUrl: string | null;
  wpUsername: string | null;
  createdAt: string;
  ownerEmail: string;
  auditCount: number;
  latestAuditDate: string | null;
}

export const SiteManagementPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchSites = async (query = "") => {
    try {
      setLoading(true);
      setFeedback(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      if (query) params.set("q", query);

      const res = await fetch(`/api/admin/sites?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch websites list.");
      }

      const data = await res.json();
      setSites(data.sites || []);
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to load sites.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleResetCooldown = async (siteId: string, siteUrl: string) => {
    try {
      setActionLoading(`cooldown-${siteId}`);
      setFeedback(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/sites/${siteId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "resetCooldown" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset cooldown.");
      }

      setFeedback({ text: `Crawl audit cooldown reset successfully for ${siteUrl}!`, isError: false });
    } catch (err: any) {
      setFeedback({ text: err.message || "Bypass request failed.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSite = async (siteId: string, siteUrl: string) => {
    if (!confirm(`Are you sure you want to delete ${siteUrl}? All audits and recommendations will be permanently cascade deleted.`)) {
      return;
    }

    try {
      setActionLoading(`delete-${siteId}`);
      setFeedback(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/sites/${siteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete site.");
      }

      setFeedback({ text: `Website ${siteUrl} was successfully deleted.`, isError: false });
      setSites((prev) => prev.filter((s) => s.id !== siteId));
    } catch (err: any) {
      setFeedback({ text: err.message || "Delete request failed.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSites(searchTerm);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  return (
    <Card variant="flat" className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-violet-650" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-850">
            Registered Websites Control Console
          </h3>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search website URLs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-zinc-950 text-xs rounded-xl focus:outline-none focus:border-violet-500 bg-white text-zinc-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 border-2 border-zinc-950 bg-white text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55 shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border-2 text-xs flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] ${
          feedback.isError ? "border-red-950 bg-red-50 text-red-750" : "border-emerald-950 bg-emerald-50 text-emerald-755"
        }`}>
          {feedback.isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-650" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-650" />
          )}
          <div>
            <p className="font-bold uppercase tracking-wider text-[9px] font-mono">
              {feedback.isError ? "Operation Error" : "Success"}
            </p>
            <p className="mt-0.5 font-mono">{feedback.text}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-violet-650 animate-spin" />
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-zinc-400">
              Retrieving registered websites...
            </span>
          </div>
        </div>
      ) : sites.length === 0 ? (
        <p className="text-xs text-zinc-400 font-mono py-6 text-center italic">No registered sites found.</p>
      ) : (
        <div className="overflow-x-auto border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-950 bg-zinc-50 font-mono font-bold uppercase tracking-wider text-[10px] text-zinc-600">
                <th className="p-4">Website URL</th>
                <th className="p-4">Owner Email</th>
                <th className="p-4">CMS Connection</th>
                <th className="p-4">Audits Executed</th>
                <th className="p-4">Latest Crawl</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-950 bg-white font-mono text-[11px] text-zinc-700">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-zinc-50/50">
                  <td className="p-4 font-bold text-zinc-900 break-all">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-850 underline"
                    >
                      {site.url} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-4">{site.ownerEmail}</td>
                  <td className="p-4">
                    {site.wpUrl ? (
                      <span className="inline-flex flex-col gap-0.5">
                        <Badge variant="emerald" className="text-[8px] px-1 py-0 uppercase">WordPress</Badge>
                        <span className="text-[9px] text-zinc-400 truncate max-w-[120px]" title={site.wpUrl}>
                          {site.wpUsername}@{site.wpUrl.replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                    ) : (
                      <Badge variant="zinc" className="text-[8px] px-1 py-0 uppercase">None</Badge>
                    )}
                  </td>
                  <td className="p-4 text-center font-bold text-zinc-900">{site.auditCount}</td>
                  <td className="p-4">
                    {site.latestAuditDate ? new Date(site.latestAuditDate).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleResetCooldown(site.id, site.url)}
                      disabled={actionLoading === `cooldown-${site.id}`}
                      className="px-2 py-1.5 border-2 border-zinc-950 bg-white text-zinc-800 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55 flex-inline items-center gap-1 disabled:opacity-50"
                    >
                      <Zap className="w-2.5 h-2.5 inline mr-1 text-amber-500" />
                      Reset Cooldown
                    </button>

                    <button
                      onClick={() => handleDeleteSite(site.id, site.url)}
                      disabled={actionLoading === `delete-${site.id}`}
                      className="px-2 py-1.5 border-2 border-zinc-950 bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] hover:bg-rose-700 flex-inline items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-2.5 h-2.5 inline mr-1" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
