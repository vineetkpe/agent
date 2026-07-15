import React from "react";
import { Globe, Activity, ArrowRight, AlertTriangle, HeartPulse, ArrowUpRight, Check } from "lucide-react";
import { Card } from "../ui/Card";

interface CrawlerTabProps {
  handleRunAudit: (e: React.FormEvent) => void;
  siteUrl: string;
  setSiteUrl: (url: string) => void;
  isCrawling: boolean;
  crawlStep: string;
  errorMessage: string;
  currentAudit: any;
  currentSite: any;
  selectTab: (tab: any) => void;
}

export const CrawlerTab: React.FC<CrawlerTabProps> = ({
  handleRunAudit,
  siteUrl,
  setSiteUrl,
  isCrawling,
  crawlStep,
  errorMessage,
  currentAudit,
  currentSite,
  selectTab,
}) => {
  const metaFixes =
    currentAudit?.items?.filter((item: any) =>
      ["meta_title", "meta_description", "schema_markup", "missing_alt", "broken_link"].includes(item.type)
    ) || [];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Domain Input Form */}
      <Card variant="shadow">
        <h2 className="text-xl font-bold mb-2 text-zinc-900">Configure URL Diagnostics</h2>
        <p className="text-sm mb-6 text-zinc-650">
          Enter your domain URL to start crawling subpages, searching SEO tag omissions, alt validation, broken link status, and duplicate content checks.
        </p>

        <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="e.g. https://yourbusiness.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              disabled={isCrawling}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-zinc-950 text-sm transition-all focus:outline-none focus:border-violet-500 bg-white text-zinc-800 placeholder-zinc-400"
            />
          </div>
          <button
            type="submit"
            disabled={isCrawling || !siteUrl}
            className="px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 border-2 border-zinc-950 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center gap-2 shrink-0 animate-fade-in"
          >
            {isCrawling ? (
              <>
                <Activity className="w-4 h-4 animate-spin" /> Crawling...
              </>
            ) : (
              <>
                Start Crawler Audit <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Progress Animation */}
        {isCrawling && (
          <div className="mt-6 p-4 rounded-xl border flex flex-col gap-3 animate-fade-in border-violet-100 bg-violet-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
              <span className="text-violet-600 font-semibold flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 animate-spin" /> Autonomous growth agent crawling pages...
              </span>
              <span className="text-zinc-500 font-mono">{crawlStep}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-200">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full w-[75%] transition-all duration-1000" />
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-950/10 text-sm text-red-600 flex items-center gap-2 animate-fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {errorMessage}
          </div>
        )}
      </Card>

      {/* Crawler Audit Output */}
      {currentAudit ? (
        <div className="space-y-8 animate-fade-in">
          {/* Detailed crawlers summary meters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <Card variant="flat">
              <span className="text-xs font-medium text-zinc-550">SEO Quality Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-bold font-mono ${
                    currentAudit.scoreSeo >= 80
                      ? "text-emerald-600"
                      : currentAudit.scoreSeo >= 60
                      ? "text-amber-650"
                      : "text-red-600"
                  }`}
                >
                  {currentAudit.scoreSeo}%
                </span>
                <span className="text-xs text-zinc-500 font-medium">score</span>
              </div>
              <span className="text-[10px] text-zinc-550 block mt-2">Core tags & markup validity</span>
            </Card>

            <Card variant="flat">
              <span className="text-xs font-medium text-zinc-555">Page Load Speed</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-bold font-mono ${
                    currentAudit.scorePerformance >= 90
                      ? "text-emerald-600"
                      : currentAudit.scorePerformance >= 70
                      ? "text-amber-650"
                      : "text-red-600"
                  }`}
                >
                  {currentAudit.scorePerformance}
                </span>
                <span className="text-xs text-zinc-500 font-medium">/ 100</span>
              </div>
              <span className="text-[10px] text-zinc-555 block mt-2">Tested PageSpeed assets loaded</span>
            </Card>

            <Card variant="flat">
              <span className="text-xs font-medium text-zinc-550">Outbound Broken Links</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-bold font-mono ${
                    metaFixes.filter((i: any) => i.type === "broken_link").length > 0
                      ? "text-red-600"
                      : "text-emerald-600"
                  }`}
                >
                  {metaFixes.filter((i: any) => i.type === "broken_link").length}
                </span>
                <span className="text-xs text-zinc-500 font-medium">broken</span>
              </div>
              <span className="text-[10px] text-zinc-555 block mt-2">Outward links returning 404s</span>
            </Card>

            <Card variant="flat">
              <span className="text-xs font-medium text-zinc-550">Image Alt Attribute Gaps</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span
                  className={`text-3xl font-bold font-mono ${
                    metaFixes.filter((i: any) => i.type === "missing_alt").length > 0
                      ? "text-amber-655"
                      : "text-emerald-600"
                  }`}
                >
                  {metaFixes.filter((i: any) => i.type === "missing_alt").length}
                </span>
                <span className="text-xs text-zinc-500 font-medium">images</span>
              </div>
              <span className="text-[10px] text-zinc-555 block mt-2">Graphic elements lacking alt tags</span>
            </Card>
          </div>

          {/* Priority Fixes List */}
          <Card variant="flat">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Crawler Audit Tag Logs</h3>
                <p className="text-xs mt-0.5 text-zinc-500">
                  Prioritized markup and link validation findings discovered on {currentSite?.url}.
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-50 text-violet-600 border-violet-200">
                {metaFixes.length} Issues Flagged
              </span>
            </div>

            <div className="space-y-4 mt-6">
              {metaFixes.map((item: any) => {
                const parsedVal = item.currentValue ? JSON.parse(item.currentValue) : null;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border-zinc-200 bg-zinc-50/40"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[9px] uppercase font-bold tracking-widest font-mono px-2 py-0.5 rounded border text-violet-600 bg-violet-50 border-violet-200">
                          {item.type.replace("_", " ")}
                        </span>
                        <span className="text-xs truncate max-w-sm font-mono text-zinc-500">
                          {item.targetUrl}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed mt-2 text-zinc-650">
                        <strong className="text-zinc-800">Scan details:</strong>{" "}
                        {item.type === "meta_title" &&
                          (parsedVal?.title
                            ? `Found non-optimal length: "${parsedVal.title}" (${parsedVal.length} chars)`
                            : "No title tag found.")}
                        {item.type === "meta_description" &&
                          (parsedVal?.description
                            ? `Found non-optimal length: "${parsedVal.description}" (${parsedVal.length} chars)`
                            : "No meta description found.")}
                        {item.type === "schema_markup" &&
                          "Missing LocalBusiness or Article Structured markup JSON-LD code."}
                        {item.type === "missing_alt" &&
                          `Identified ${
                            parsedVal?.count || 1
                          } image elements lacking alternative description attributes.`}
                        {item.type === "broken_link" &&
                          `Broken link anchor pointing to dead endpoint: "${parsedVal?.brokenUrl}" (Status code: ${parsedVal?.statusCode}).`}
                      </p>
                    </div>

                    <button
                      onClick={() => selectTab("recommendations")}
                      type="button"
                      className="px-4 py-2 border-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 bg-white border-zinc-950 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                    >
                      Inspect AI Fix
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      ) : (
        <Card variant="flat" className="p-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto bg-zinc-100 border-zinc-200 text-zinc-550">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-700">No audits run yet</h3>
            <p className="text-zinc-550 text-xs mt-1">
              Configure your domain and start crawling to trigger target SEO audit data.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
