import React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Globe, Calendar, ArrowRight, Settings, History, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { TabType } from "@/hooks/useDashboardData";

interface SitesTabProps {
  allSites: any[];
  selectedSiteId: string | null;
  setSelectedSiteId: (id: string) => void;
  selectTab: (tab: TabType) => void;
  pastAudits: any[];
  selectedAuditId: string | null;
  setSelectedAuditId: (id: string | null) => void;
  currentAudit: any;
  deleteSite: (id: string) => void;
  toggleGscConnection: (id: string, gscUrl?: string, disconnect?: boolean) => void;
  addSite: (url: string) => void;
  openAddSiteWizard?: () => void;
}

export const SitesTab: React.FC<SitesTabProps> = ({
  allSites,
  selectedSiteId,
  setSelectedSiteId,
  selectTab,
  pastAudits,
  selectedAuditId,
  setSelectedAuditId,
  currentAudit,
  deleteSite,
  toggleGscConnection,
  addSite,
  openAddSiteWizard,
}) => {
  const selectedSite = allSites.find((s) => s.id === selectedSiteId);

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="pb-4 border-b border-zinc-150 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Your Audited Websites</h2>
          <p className="text-sm mt-1 text-zinc-550">
            Manage, inspect, and switch active audit workspaces between all the domains scanned in your account.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (openAddSiteWizard) {
                openAddSiteWizard();
              } else {
                const urlInput = prompt("Enter a new website URL (e.g. hostamble.com):");
                if (urlInput) {
                  addSite(urlInput);
                }
              }
            }}
            type="button"
            className="px-4 py-2 border-2 border-zinc-950 bg-violet-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650/90 shrink-0"
          >
            + Add New Site
          </button>
          <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-50 text-violet-650 border-violet-200 shrink-0">
            {allSites.length} Sites Audited
          </span>
        </div>
      </div>

      {allSites.length === 0 ? (
        <Card variant="flat" className="p-16 text-center text-zinc-505 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-500">
            <Globe className="w-6 h-6" />
          </div>
          <div className="text-lg font-bold">No Audited Sites Found</div>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            You haven't run any domain crawl audits yet. Click "Add New Site" or go to the Site Crawler tab and enter a URL to run your first scan.
          </p>
          <Button variant="primary" onClick={() => selectTab("crawler")}>
            Go to Site Crawler
          </Button>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Sites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allSites.map((site) => {
              const isActive = site.id === selectedSiteId;
              return (
                <Card
                  key={site.id}
                  variant="flat"
                  className={`relative border-2 transition-all duration-250 ${
                    isActive
                      ? "border-violet-600 bg-violet-50/10 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]"
                      : "border-zinc-200 hover:border-zinc-350 bg-white"
                  }`}
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl border shrink-0 ${isActive ? "bg-violet-100 text-violet-650 border-violet-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}>
                          <Globe className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-900 text-sm break-all font-mono">
                            {site.url}
                          </h3>
                          <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Added: {new Date(site.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-violet-600 text-white shadow-sm border border-zinc-950 shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t border-zinc-150 text-xs">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-zinc-500">WP Connection:</span>
                        {site.wpUrl ? (
                          <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Connected
                          </span>
                        ) : (
                          <span className="text-zinc-550 bg-zinc-50 px-2 py-0.5 rounded-md border border-zinc-100">
                            Manual Copy
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-zinc-500">Search Console:</span>
                        {site.gscConnected ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              Connected
                            </span>
                            <button
                              onClick={() => toggleGscConnection(site.id, undefined, true)}
                              className="text-[10px] text-red-500 underline hover:text-red-700 font-bold"
                              type="button"
                            >
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-semibold">
                              Not Connected
                            </span>
                            <button
                              onClick={() => {
                                const urlInput = prompt("Enter your Google Search Console Property URL (optional, defaults to site URL):", site.url);
                                if (urlInput !== null) {
                                  toggleGscConnection(site.id, urlInput);
                                }
                              }}
                              className="text-[10px] text-violet-650 underline hover:text-violet-850 font-bold"
                              type="button"
                            >
                              Connect
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                      <button
                        onClick={() => deleteSite(site.id)}
                        type="button"
                        className="p-1.5 border-2 border-zinc-950 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                        title="Delete Site Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {!isActive ? (
                        <button
                          onClick={() => {
                            setSelectedSiteId(site.id);
                            setSelectedAuditId(null);
                            selectTab("overview");
                          }}
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                        >
                          Activate site
                        </button>
                      ) : (
                        <button
                          onClick={() => selectTab("overview")}
                          type="button"
                          className="px-3.5 py-1.5 rounded-lg border-2 border-zinc-950 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                        >
                          Open Dashboard
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Historical Audit Reports Section */}
          {selectedSite && (
            <Card variant="flat" className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
                <History className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-extrabold font-mono tracking-wider uppercase text-zinc-800">
                    Audit Reports Archive for {selectedSite.url}
                  </h3>
                  <p className="text-[11px] text-zinc-550 font-mono mt-0.5">
                    Click to load and view any historical crawler scores or recommendations.
                  </p>
                </div>
              </div>

              {pastAudits.length === 0 ? (
                <p className="text-xs text-zinc-550 py-4 italic text-center font-mono">
                  No scan reports saved for this site. Run a crawl audit first!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">SEO Score</th>
                        <th className="py-2.5 px-3">Perf Score</th>
                        <th className="py-2.5 px-3">LCP</th>
                        <th className="py-2.5 px-3">CLS</th>
                        <th className="py-2.5 px-3">INP/TBT</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {pastAudits.map((aud) => {
                        const isCurrentActive = currentAudit?.id === aud.id;
                        return (
                          <tr
                            key={aud.id}
                            className={`hover:bg-zinc-50/50 transition-colors ${
                              isCurrentActive ? "bg-violet-50/20 font-bold" : ""
                            }`}
                          >
                            <td className="py-3 px-3 text-zinc-700">
                              {new Date(aud.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-bold ${aud.scoreSeo >= 90 ? "text-emerald-600" : aud.scoreSeo >= 50 ? "text-amber-600" : "text-red-655"}`}>
                                {aud.scoreSeo}%
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`font-bold ${aud.scorePerformance >= 90 ? "text-emerald-600" : aud.scorePerformance >= 50 ? "text-amber-600" : "text-red-655"}`}>
                                {aud.scorePerformance}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-zinc-650">
                              {aud.lcpSeconds !== null ? `${aud.lcpSeconds}s` : "--"}
                            </td>
                            <td className="py-3 px-3 text-zinc-650">
                              {aud.clsScore !== null ? aud.clsScore : "--"}
                            </td>
                            <td className="py-3 px-3 text-zinc-650">
                              {aud.inpMilliseconds !== null ? `${aud.inpMilliseconds}ms` : "--"}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {isCurrentActive ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-650 bg-violet-100 px-2 py-0.5 rounded-md">
                                  <Sparkles className="w-3 h-3 animate-pulse" /> Loaded
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedAuditId(aud.id);
                                    selectTab("overview");
                                  }}
                                  type="button"
                                  className="px-2.5 py-1 text-[10px] border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-800 font-bold rounded shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] transition-all"
                                >
                                  Load Report
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
