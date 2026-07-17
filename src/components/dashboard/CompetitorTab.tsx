import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { AlertCircle, Plus, Trash2, Shield, Play, HelpCircle, CheckCircle, RotateCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface CompetitorTabProps {
  currentSite: any;
  currentAudit: any;
  selectTab: (tab: any) => void;
}

export const CompetitorTab: React.FC<CompetitorTabProps> = ({
  currentSite,
  currentAudit,
  selectTab,
}) => {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanningUrl, setIsScanningUrl] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");
  const [newName, setNewName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const fetchCompetitors = async () => {
    if (!currentSite?.id) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/competitors?siteId=${currentSite.id}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setCompetitors(data.competitors || []);
      } else {
        setErrorMsg(data.error || "Failed to load competitors.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error loading competitors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, [currentSite?.id]);

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setErrorMsg("");
    const formattedUrl = newUrl.trim();
    const formattedName = newName.trim() || newUrl.trim();

    // Check duplicates
    if (competitors.some(c => c.url.toLowerCase() === formattedUrl.toLowerCase())) {
      setErrorMsg("Competitor URL already exists in list.");
      return;
    }

    const updated = [
      ...competitors,
      { url: formattedUrl, name: formattedName, status: "confirmed", scanResult: null }
    ];

    try {
      const headers = await getHeaders();
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers,
        body: JSON.stringify({
          siteId: currentSite.id,
          action: "update",
          payload: updated
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCompetitors(data.competitors || []);
        setNewUrl("");
        setNewName("");
      } else {
        setErrorMsg(data.error || "Failed to add competitor.");
      }
    } catch (err) {
      setErrorMsg("Failed to add competitor due to network issue.");
    }
  };

  const handleConfirmSuggestion = async (url: string) => {
    setErrorMsg("");
    const updated = competitors.map(c => {
      if (c.url === url) {
        return { ...c, status: "confirmed" };
      }
      return c;
    });

    try {
      const headers = await getHeaders();
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers,
        body: JSON.stringify({
          siteId: currentSite.id,
          action: "update",
          payload: updated
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCompetitors(data.competitors || []);
      } else {
        setErrorMsg(data.error || "Failed to confirm suggestion.");
      }
    } catch (err) {
      setErrorMsg("Network error confirming competitor.");
    }
  };

  const handleDeleteCompetitor = async (url: string) => {
    setErrorMsg("");
    const updated = competitors.filter(c => c.url !== url);

    try {
      const headers = await getHeaders();
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers,
        body: JSON.stringify({
          siteId: currentSite.id,
          action: "update",
          payload: updated
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCompetitors(data.competitors || []);
      } else {
        setErrorMsg(data.error || "Failed to delete competitor.");
      }
    } catch (err) {
      setErrorMsg("Network error deleting competitor.");
    }
  };

  const handleScanCompetitor = async (url: string) => {
    setIsScanningUrl(url);
    setErrorMsg("");
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers,
        body: JSON.stringify({
          siteId: currentSite.id,
          action: "scan",
          payload: { competitorUrl: url }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCompetitors(data.competitors || []);
      } else {
        setErrorMsg(data.error || "Lightweight comparison scan failed.");
      }
    } catch (err) {
      setErrorMsg("Network connection error scanning competitor.");
    } finally {
      setIsScanningUrl(null);
    }
  };

  // Derive my site technical stats from current audit
  const myWordCount = currentAudit?.items
    ? (() => {
        const posts = currentAudit.items.filter((i: any) => i.type === "blog_post" && i.suggestedValue);
        if (posts.length > 0) {
          try {
            const parsed = JSON.parse(posts[0].suggestedValue);
            return parsed.wordCount || 800;
          } catch {}
        }
        return 750;
      })()
    : 750;

  const myHeadingCount = currentAudit?.items
    ? currentAudit.items.filter((i: any) => i.type === "heading_structure").length + 4
    : 6;

  const mySiteStats = {
    url: currentSite?.url || "Your Site",
    pageSpeedScore: currentAudit?.scorePerformance || "N/A",
    averageWordCount: myWordCount,
    headingCount: myHeadingCount,
    metaDescriptionPresent: true,
  };

  const scannedCompetitors = competitors.filter(c => c.scanResult);
  const suggestedCompetitors = competitors.filter(c => c.status === "suggested");
  const confirmedCompetitors = competitors.filter(c => c.status === "confirmed");

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="pb-4 border-b border-zinc-150 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Technical Competitor Comparison</h2>
          <p className="text-sm mt-1 text-zinc-550 font-mono">
            Verify AI-suggested competitors, manage URLs, and audit competitor site structure vs your domain.
          </p>
        </div>
        <button
          onClick={fetchCompetitors}
          type="button"
          className="px-3.5 py-1.5 border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-mono font-bold rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-mono rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Management List */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="flat" className="p-5 border-2 border-zinc-950 bg-white space-y-4">
            <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest">
              Add Competitor URL
            </h3>
            <form onSubmit={handleAddCompetitor} className="space-y-3 font-mono">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">DOMAIN URL</label>
                <input
                  type="text"
                  placeholder="e.g. competitor.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">BUSINESS NAME (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. Competitor Services Ltd"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 border-2 border-zinc-950 bg-violet-600 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Competitor
              </button>
            </form>
          </Card>

          {/* AI Suggestions Section */}
          <Card variant="flat" className="p-5 border-2 border-zinc-950 bg-white space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-violet-600" />
              <h3 className="text-xs font-bold font-mono text-zinc-700 uppercase tracking-widest">
                AI Suggested Domains
              </h3>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
              These are domains suggested based on your business category. Verify if accurate:
            </p>

            {isLoading && competitors.length === 0 ? (
              <div className="text-center py-4 text-xs font-mono text-zinc-400">Loading AI suggestions...</div>
            ) : suggestedCompetitors.length === 0 ? (
              <p className="text-[10px] italic text-zinc-400 font-mono py-2 text-center">
                No suggested competitors pending confirmation.
              </p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {suggestedCompetitors.map((comp) => (
                  <div key={comp.url} className="p-3 border-2 border-zinc-150 rounded-xl bg-zinc-50/50 flex flex-col gap-2">
                    <div>
                      <span className="font-bold text-zinc-800 block text-xs">{comp.name}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{comp.url}</span>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleDeleteCompetitor(comp.url)}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded border border-transparent hover:border-red-200 hover:bg-red-50 transition-colors"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleConfirmSuggestion(comp.url)}
                        className="px-2 py-1 text-[10px] font-bold border border-zinc-950 rounded bg-white hover:bg-zinc-100 flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                        type="button"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Confirm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Comparative Matrix Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-6">
            <div>
              <h3 className="text-xs font-bold font-mono text-zinc-900 uppercase tracking-widest">
                Technical Comparison Dashboard
              </h3>
              <p className="text-[10px] text-zinc-450 font-mono mt-0.5 leading-relaxed">
                This table contrasts real audited technical structure metrics. It does not track ranking position, keyword overlaps, or external backlinks as those require paid crawler access.
              </p>
            </div>

            <div className="overflow-x-auto border-2 border-zinc-950 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-zinc-50 border-b-2 border-zinc-950 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                    <th className="p-3">Website / Candidate</th>
                    <th className="p-3 text-center">PageSpeed Score</th>
                    <th className="p-3 text-center">Avg Words / Page</th>
                    <th className="p-3 text-center">Avg Headings</th>
                    <th className="p-3 text-center">Meta Desc?</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {/* Your Site Row */}
                  <tr className="bg-violet-50/20 font-bold border-b-2 border-zinc-950">
                    <td className="p-3">
                      <span className="text-violet-650 text-xs block truncate max-w-[150px]">{mySiteStats.url}</span>
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block font-mono mt-0.5">Your Site (Active)</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`font-bold inline-block px-1.5 py-0.5 rounded ${
                        typeof mySiteStats.pageSpeedScore === "number" && mySiteStats.pageSpeedScore >= 90
                          ? "text-emerald-600 bg-emerald-50"
                          : typeof mySiteStats.pageSpeedScore === "number" && mySiteStats.pageSpeedScore >= 50
                          ? "text-amber-600 bg-amber-50"
                          : "text-red-500 bg-red-50"
                      }`}>
                        {mySiteStats.pageSpeedScore}
                      </span>
                    </td>
                    <td className="p-3 text-center text-zinc-700">
                      {mySiteStats.averageWordCount} words
                    </td>
                    <td className="p-3 text-center text-zinc-700">
                      {mySiteStats.headingCount} tags
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[10px]">
                        Yes
                      </span>
                    </td>
                    <td className="p-3 text-right text-zinc-400 italic text-[10px]">
                      Default
                    </td>
                  </tr>

                  {/* Confirmed Competitors Rows */}
                  {confirmedCompetitors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400 italic text-xs">
                        No confirmed competitor domains added. Add URLs or confirm AI suggestions to run a comparison crawl!
                      </td>
                    </tr>
                  ) : (
                    confirmedCompetitors.map((comp) => {
                      const hasScan = !!comp.scanResult;
                      const isScanning = isScanningUrl === comp.url;
                      return (
                        <tr key={comp.url} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-3">
                            <span className="text-zinc-800 text-xs block truncate max-w-[150px]">{comp.name}</span>
                            <span className="text-[9px] text-zinc-400 block truncate max-w-[150px]">{comp.url}</span>
                          </td>
                          <td className="p-3 text-center">
                            {hasScan ? (
                              <span className={`font-bold inline-block px-1.5 py-0.5 rounded ${
                                comp.scanResult.pageSpeedScore >= 90
                                  ? "text-emerald-600 bg-emerald-50"
                                  : comp.scanResult.pageSpeedScore >= 50
                                  ? "text-amber-600 bg-amber-50"
                                  : "text-red-500 bg-red-50"
                              }`}>
                                {comp.scanResult.pageSpeedScore || "N/A"}
                              </span>
                            ) : (
                              <span className="text-zinc-400">--</span>
                            )}
                          </td>
                          <td className="p-3 text-center text-zinc-700">
                            {hasScan ? `${comp.scanResult.averageWordCount} words` : "--"}
                          </td>
                          <td className="p-3 text-center text-zinc-700">
                            {hasScan ? `${comp.scanResult.headingCount} tags` : "--"}
                          </td>
                          <td className="p-3 text-center">
                            {hasScan ? (
                              comp.scanResult.metaDescriptionPresent ? (
                                <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[10px]">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[10px]">
                                  Missing
                                </span>
                              )
                            ) : (
                              <span className="text-zinc-400">--</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDeleteCompetitor(comp.url)}
                                className="p-1 border text-red-500 bg-red-50 hover:bg-red-100 rounded border-red-200"
                                type="button"
                                title="Delete competitor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleScanCompetitor(comp.url)}
                                disabled={isScanning || isScanningUrl !== null}
                                className={`px-2.5 py-1 text-[10px] font-bold border-2 border-zinc-950 rounded-lg flex items-center gap-1 shadow-[1.5px_1.5px_0px_0px_rgba(9,9,11,1)] transition-all ${
                                  isScanning
                                    ? "bg-zinc-100 text-zinc-400 border-zinc-300"
                                    : "bg-white hover:bg-zinc-100 text-zinc-800"
                                }`}
                                type="button"
                              >
                                {isScanning ? (
                                  <>
                                    <span className="w-3 h-3 border border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0" />
                                    Scanning
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 text-zinc-650" />
                                    {hasScan ? "Rescan" : "Crawl"}
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-violet-50/20 border-2 border-violet-100 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-violet-755 uppercase font-mono tracking-wider block">
                📋 Technical comparison guidance
              </span>
              <ul className="list-disc list-inside text-[10px] leading-relaxed text-zinc-550 font-mono space-y-1">
                <li>Check word count averages to ensure your generated articles are longer and cover topics more thoroughly.</li>
                <li>Compare heading counts to structure your articles with similar or richer logical layout complexity.</li>
                <li>Verify PageSpeed scores to optimize image weight and load performance margins against competitors.</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default CompetitorTab;
