import React, { useState, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  Info, 
  ArrowUpRight, 
  MapPin, 
  Check, 
  X,
  FileText,
  HelpCircle,
  RefreshCw,
  Compass
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { supabase } from "@/lib/supabaseClient";

interface KeywordResearchTabProps {
  currentSite: any;
  selectTab: (tab: any) => void;
  setPrefilledKeyword: (keyword: string) => void;
}

export const KeywordResearchTab: React.FC<KeywordResearchTabProps> = ({
  currentSite,
  selectTab,
  setPrefilledKeyword,
}) => {
  const [rankingNow, setRankingNow] = useState<any[]>([]);
  const [suggestedOpportunities, setSuggestedOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Subtab switcher
  const [activeSubTab, setActiveSubTab] = useState<"keywords" | "geo">("keywords");

  // Modal generation states
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordType, setKeywordType] = useState<"long-tail" | "short-tail">("long-tail");
  const [geoTarget, setGeoTarget] = useState("");
  
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [generatedArticle, setGeneratedArticle] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);

  // Geo Suggestions Helper Tool States
  const [geoService, setGeoService] = useState("Dentist");
  const [geoCity, setGeoCity] = useState("New York, NY");
  const [builtGeoKeywords, setBuiltGeoKeywords] = useState<string[]>([]);
  const [showGeoGuide, setShowGeoGuide] = useState(false);

  const fetchKeywordsData = async () => {
    if (!currentSite) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const impToken = typeof window !== "undefined" ? localStorage.getItem("impersonation_token") || "" : "";
      if (impToken) {
        headers["x-impersonation-token"] = impToken;
      }

      const res = await fetch(`/api/keywords?siteId=${currentSite.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setRankingNow(data.rankingNow || []);
        setSuggestedOpportunities(data.suggestedOpportunities || []);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to load keywords intelligence data.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred while fetching keyword analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywordsData();
  }, [currentSite]);

  const handleBuildGeoKeywords = () => {
    if (!geoService || !geoCity) return;
    const cityClean = geoCity.trim();
    const serviceClean = geoService.trim();
    
    // Auto generate geo keyword modifier variations
    const list = [
      `${serviceClean} in ${cityClean}`,
      `best ${serviceClean} near ${cityClean}`,
      `affordable ${serviceClean} ${cityClean}`,
      `emergency ${serviceClean} in ${cityClean}`,
      `${serviceClean} reviews ${cityClean}`,
      `top rated ${serviceClean} ${cityClean}`
    ];
    setBuiltGeoKeywords(list);
    setShowGeoGuide(true);
  };

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyword) return;

    setGenerating(true);
    setGenError("");
    setGeneratedArticle(null);
    setValidationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/keywords/generate-content", {
        method: "POST",
        headers,
        body: JSON.stringify({
          siteId: currentSite.id,
          keyword: selectedKeyword,
          keywordType,
          geoTarget
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate blog article.");
      }

      setGeneratedArticle(data.article);
      setValidationResult(data.validation);
    } catch (err: any) {
      setGenError(err.message || "An error occurred during article generation.");
    } finally {
      setGenerating(false);
    }
  };

  if (!currentSite) {
    return (
      <div className="space-y-8 animate-slide-up">
        <Card variant="flat" className="p-16 text-center space-y-6 max-w-2xl mx-auto border-2 border-dashed border-zinc-300 bg-zinc-50/20 rounded-2xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-650">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-zinc-900 font-mono uppercase tracking-wider">
              No Active Site Found
            </h3>
            <p className="text-xs text-zinc-550 leading-relaxed font-mono max-w-md mx-auto">
              Please connect and select a website from the dashboard to run keyword intelligence optimizations.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-zinc-200/50 rounded-2xl w-full" />
        <div className="grid grid-cols-1 gap-6">
          <div className="h-60 bg-zinc-200/50 rounded-2xl" />
          <div className="h-60 bg-zinc-200/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="space-y-8">
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-950/10 text-sm text-red-650 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold">Keyword Intelligence Failure</h4>
            <p className="text-xs text-red-550 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      {/* Top Header */}
      <div className="pb-4 border-b border-zinc-150 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Keyword Research & Local SEO</h2>
          <p className="text-xs mt-1 text-zinc-550">
            Audit organic query rankings, map high-impact keyword variations, and configure localized search guidelines.
          </p>
        </div>
        <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-50 text-violet-650 border-violet-200 shrink-0">
          GSC Connected: {currentSite.gscConnected ? "YES" : "NO"}
        </span>
      </div>

      {/* Subtab Selectors */}
      <div className="flex border-b border-zinc-200 font-mono text-xs font-bold uppercase gap-2">
        <button
          onClick={() => setActiveSubTab("keywords")}
          className={`px-4 py-2 border-b-2 transition-all ${
            activeSubTab === "keywords" 
              ? "border-violet-600 text-violet-650 font-black" 
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          Keyword Analytics
        </button>
        <button
          onClick={() => setActiveSubTab("geo")}
          className={`px-4 py-2 border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === "geo" 
              ? "border-violet-600 text-violet-650 font-black" 
              : "border-transparent text-zinc-400 hover:text-zinc-700"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> SEO & Geo Suggestions
        </button>
      </div>

      {activeSubTab === "keywords" && (
        <div className="space-y-8">
          {/* GSC Not Connected Callout */}
          {!currentSite.gscConnected && (
            <Card variant="flat" className="p-6 bg-amber-50/20 border-amber-200 flex flex-col sm:flex-row gap-4 items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ Google Search Console Not Connected
                </h4>
                <p className="text-xs text-amber-700 leading-relaxed max-w-xl">
                  Connect Search Console in the Connections tab to unlock the "Ranking Now" list, see your real performance metrics, and seed AI suggested variations from terms that are already working.
                </p>
              </div>
              <Button variant="primary" onClick={() => selectTab("connections")} className="shrink-0 text-xs">
                Link Search Console <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Card>
          )}

          {/* Section 1: Ranking Now (GSC Clicks & Impressions) */}
          {currentSite.gscConnected && (
            <Card variant="flat" className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-605" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider">
                      Ranking Now (Search Performance)
                    </h3>
                    <p className="text-[11px] text-zinc-450 font-mono mt-0.5">
                      Organic traffic search queries currently ranking for your verified GSC property.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
                  ✓ Verified
                </span>
              </div>

              <div className="overflow-x-auto">
                {rankingNow.length > 0 ? (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                        <th className="py-2.5 px-3">Keyword Query</th>
                        <th className="py-2.5 px-3">Clicks</th>
                        <th className="py-2.5 px-3">Impressions</th>
                        <th className="py-2.5 px-3">CTR</th>
                        <th className="py-2.5 px-3">Avg. Position</th>
                        <th className="py-2.5 px-3 text-right">Competitiveness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-mono">
                      {rankingNow.map((item: any, idx: number) => {
                        const compStatus = item.position < 10 ? "Already competitive" : "Room to improve";
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3 px-3 text-zinc-805 font-bold">
                              "{item.query}"
                            </td>
                            <td className="py-3 px-3 text-zinc-650">
                              {item.clicks.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-zinc-650">
                              {item.impressions.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-zinc-650">
                              {(item.ctr * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-3 text-violet-650 font-bold">
                              {Number(item.position).toFixed(1)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                                item.position < 10 
                                  ? "bg-red-50 text-red-600 border border-red-100" 
                                  : "bg-emerald-50 text-emerald-605 border border-emerald-100"
                              }`}>
                                {compStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs italic text-zinc-500 py-4 font-mono">No organic search query rankings returned for the GSC URL prefix.</p>
                )}
              </div>
            </Card>
          )}

          {/* Section 2: Suggested Opportunities */}
          <Card variant="flat" className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider">
                    Suggested Content Opportunities
                  </h3>
                  <p className="text-[11px] text-zinc-450 font-mono mt-0.5">
                    AI suggested search opportunities matching your business profile and current rankings.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100 uppercase tracking-wide">
                AI Suggested
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <th className="py-2.5 px-3">Target Keyword</th>
                    <th className="py-2.5 px-3">Search Intent</th>
                    <th className="py-2.5 px-3">Monthly Volume</th>
                    <th className="py-2.5 px-3">SEO Difficulty</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono">
                  {suggestedOpportunities.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="text-zinc-800 font-bold block">"{item.keyword}"</span>
                          <span className="text-[10px] text-zinc-450 font-medium font-sans block">{item.rationale}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-650 border border-violet-100 uppercase tracking-wide">
                          {item.intent}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 flex items-center gap-1">
                        <span>not available yet</span>
                        <div className="relative group shrink-0">
                          <Info className="w-3.5 h-3.5 text-zinc-400 cursor-help" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 bg-zinc-950 text-white text-[9px] leading-relaxed p-2.5 rounded-lg shadow-lg z-50">
                            Real search volume and competition metrics require a Google Ads Keyword Planner API source.
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-500">
                        <span>not available yet</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setSelectedKeyword(item.keyword);
                            setGeneratedArticle(null);
                            setValidationResult(null);
                            setGenError("");
                          }} 
                          className="text-[10px] py-1 px-3"
                        >
                          Generate Content <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "geo" && (
        <div className="space-y-6">
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-150">
              <MapPin className="w-5 h-5 text-violet-605" />
              <div>
                <h3 className="font-bold text-sm text-zinc-805 font-mono uppercase tracking-wider">
                  SEO & Geo-Targeting Suggestions Builder
                </h3>
                <p className="text-[11px] text-zinc-450 font-mono mt-0.5">
                  Generate local keyword variations and learn how to optimize your site for local geographical queries.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs pt-2">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Modifiers Settings</span>
                <div className="space-y-2">
                  <label className="font-bold text-zinc-550 block">Your Service / Niche</label>
                  <input
                    type="text"
                    value={geoService}
                    onChange={(e) => setGeoService(e.target.value)}
                    placeholder="e.g. SEO Audit Services"
                    className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-zinc-550 block">Target City / Location</label>
                  <input
                    type="text"
                    value={geoCity}
                    onChange={(e) => setGeoCity(e.target.value)}
                    placeholder="e.g. Chicago, IL"
                    className="w-full px-3 py-2 rounded-xl border-2 border-zinc-955 bg-white focus:outline-none focus:border-violet-500"
                  />
                </div>
                <Button variant="primary" onClick={handleBuildGeoKeywords} className="w-full">
                  Build Geo Modifiers
                </Button>
              </div>

              {/* Keyword variations list */}
              <div className="space-y-4 md:border-l md:pl-6 border-zinc-150">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Local Target Keywords</span>
                {builtGeoKeywords.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {builtGeoKeywords.map((kw, i) => (
                      <div key={i} className="p-2 border border-zinc-150 rounded-xl bg-zinc-50 flex items-center justify-between gap-2">
                        <span className="text-zinc-800 font-bold font-mono">"{kw}"</span>
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setSelectedKeyword(kw);
                            setGeneratedArticle(null);
                            setValidationResult(null);
                            setGenError("");
                          }} 
                          className="py-0.5 px-2 text-[8px]"
                        >
                          Write Post
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border border-dashed text-center text-zinc-400">
                    Input your service and city details to build localized geo-targeted keyword suggestions.
                  </div>
                )}
              </div>

              {/* Implementation Guide */}
              <div className="space-y-4 md:border-l md:pl-6 border-zinc-150">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Geo Suggestion Guidelines</span>
                <div className="space-y-2 text-[10px] text-zinc-550 leading-relaxed font-sans">
                  <p className="font-mono font-bold text-[11px] text-violet-650">How to target Geo suggestions:</p>
                  <ul className="list-disc pl-4 space-y-1.5 font-mono text-[9px]">
                    <li>
                      <strong>Google Business Profile (GBP)</strong>: Claim and fill your profile with your location and local keywords.
                    </li>
                    <li>
                      <strong>Region service landing pages</strong>: Create specialized sub-pages like <code>/plumbing-{geoCity.toLowerCase().replace(/[\s,]+/g, "-")}</code>.
                    </li>
                    <li>
                      <strong>Schema Markup</strong>: Inject <code>LocalBusiness</code> structured JSON schema markup to declare your local coordinates.
                    </li>
                    <li>
                      <strong>Geo Keywords in Headings</strong>: Embed your location (e.g. {geoCity}) inside the main page H1 title.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Article Generator Modal */}
      {selectedKeyword && (
        <div className="fixed inset-0 bg-zinc-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in font-mono">
          <div className="bg-white border-2 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative space-y-4 animate-scale-up text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-150">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-violet-605 animate-pulse" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-900">SEO Content Generator</h3>
              </div>
              <button 
                onClick={() => setSelectedKeyword(null)}
                className="text-zinc-400 hover:text-zinc-700 font-bold"
              >
                ✕
              </button>
            </div>

            {genError && (
              <div className="p-3 border-2 border-red-955 bg-red-50 text-red-755 rounded-xl font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{genError}</span>
              </div>
            )}

            {!generatedArticle ? (
              // Generator setup form
              <form onSubmit={handleGenerateContent} className="space-y-4">
                <div>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">Target Keyword</span>
                  <p className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 font-bold text-zinc-800">
                    "{selectedKeyword}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-550 uppercase block">Keyword Search Type</label>
                    <select
                      value={keywordType}
                      onChange={(e) => setKeywordType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-955 focus:outline-none bg-white font-mono"
                    >
                      <option value="long-tail">Long-tail (targets local intent, requires min 1200 words)</option>
                      <option value="short-tail">Short-tail (broad categorization, requires min 600 words)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-zinc-550 uppercase block">Geographic Target (Optional)</label>
                    <input
                      type="text"
                      value={geoTarget}
                      onChange={(e) => setGeoTarget(e.target.value)}
                      placeholder="e.g. Chicago, IL or Seattle, WA"
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-955 focus:outline-none bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setSelectedKeyword(null)}
                    disabled={generating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={generating}
                    className="flex items-center gap-1.5"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        Generate Article
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              // Article preview and checks list
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                <div className="lg:col-span-2 space-y-4">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block border-b pb-1">Article Preview</span>
                  <div className="space-y-3 font-sans text-zinc-800">
                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold font-mono uppercase block">Title Tag</span>
                      <p className="text-xs font-bold font-mono text-zinc-900 border p-2 bg-zinc-50 rounded-xl">
                        {generatedArticle.title}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold font-mono uppercase block">Meta Description</span>
                      <p className="text-xs font-mono text-zinc-650 border p-2 bg-zinc-50 rounded-xl leading-relaxed">
                        {generatedArticle.metaDescription}
                      </p>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 font-bold font-mono uppercase block mb-1">Article Content (HTML Body)</span>
                      <div className="border border-zinc-200 rounded-xl p-3 max-h-[300px] overflow-y-auto bg-white text-xs font-mono whitespace-pre-wrap leading-relaxed select-all">
                        {generatedArticle.content}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Validation Checklist */}
                <div className="lg:col-span-1 space-y-4">
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block border-b pb-1">SEO Compliance Checks</span>
                  <div className="p-4 border-2 border-zinc-950 rounded-2xl bg-white space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs pb-1 border-b">
                      <span className="font-bold">Checklist Rule</span>
                      <span className="font-bold">Status</span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                      <span>Title length (50-60 chars)</span>
                      {validationResult.checks.titleLengthPassed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                      <span>Meta description (150-160)</span>
                      {validationResult.checks.metaLengthPassed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                      <span>Word Count ({generatedArticle.wordCount} words)</span>
                      {validationResult.checks.wordCountPassed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                      <span>Single H1 Tag</span>
                      {validationResult.checks.h1CountPassed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                      <span>Internal Links (min 2)</span>
                      {validationResult.checks.internalLinksPassed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100">
                      <span>Outbound links (min 1)</span>
                      {validationResult.checks.externalLinksPassed ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                    </div>

                    {validationResult.passed ? (
                      <div className="p-2 bg-emerald-50 text-emerald-700 text-[10px] rounded-lg border border-emerald-150 leading-relaxed font-sans">
                        ✓ <strong>Compliance Verified</strong>: This article satisfies all criteria for top ranking SEO standards.
                      </div>
                    ) : (
                      <div className="p-2 bg-rose-50 text-rose-700 text-[10px] rounded-lg border border-rose-150 leading-relaxed font-sans">
                        ⚠️ <strong>Compliance Warning</strong>: Check details. You can publish this directly or regenerate with location adjustments.
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-violet-50/50 rounded-2xl border border-violet-100 text-[11px] leading-relaxed">
                    <FileText className="w-4 h-4 text-violet-650 inline mr-1 mb-0.5 shrink-0" />
                    <strong>Draft Saved!</strong> The article has been added as a pending recommendation in your <strong>AI Content Suite</strong> tab where you can review, edit, or auto-apply to WordPress.
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedKeyword(null);
                        setGeneratedArticle(null);
                        setValidationResult(null);
                      }}
                    >
                      Close
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        setSelectedKeyword(null);
                        setGeneratedArticle(null);
                        setValidationResult(null);
                        selectTab("content"); // Redirect to AI Content Suite
                      }}
                    >
                      Go to Content Suite
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
