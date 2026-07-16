import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Database, Save, CheckCircle, Info, Sparkles, BookOpen, Layout, ShieldCheck, Target, MessageSquare, Award, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AIContextTabProps {
  currentSite: any;
  currentAudit: any;
  fetchInitialData: (siteId?: string) => Promise<void>;
}

export const AIContextTab: React.FC<AIContextTabProps> = ({
  currentSite,
  currentAudit,
  fetchInitialData,
}) => {
  const [instructions, setInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (currentSite) {
      setInstructions(currentSite.customInstructions || "");
    }
  }, [currentSite]);

  const handleSaveInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSite) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/site/instructions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          siteId: currentSite.id,
          customInstructions: instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save guidelines.");
      }

      setSaveMessage({ text: "AI Agent context instructions updated successfully!", isError: false });
      await fetchInitialData(currentSite.id);
    } catch (err: any) {
      setSaveMessage({ text: err.message || "Failed to persist guidelines.", isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  // Parse discovered business profile
  const businessProfile = currentSite?.businessProfile ? (() => {
    try {
      return JSON.parse(currentSite.businessProfile);
    } catch (e) {
      console.error("Failed to parse businessProfile JSON:", e);
      return null;
    }
  })() : null;

  // Extract site crawled facts
  const crawledCount = currentAudit?.items
    ? new Set(currentAudit.items.map((i: any) => i.targetUrl)).size
    : 0;

  const criticalIssuesCount = currentAudit?.items
    ? currentAudit.items.filter((i: any) => i.status === "pending").length
    : 0;

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="pb-4 border-b border-zinc-150">
        <h2 className="text-xl font-bold text-zinc-900">AI Agent Site Context Repository</h2>
        <p className="text-sm mt-1 text-zinc-550">
          Inspect automatically extracted business details and submit custom SEO guidelines to direct how the growth agent writes recommendation drafts.
        </p>
      </div>

      {!currentSite ? (
        <Card variant="flat" className="p-16 text-center text-zinc-500">
          <p className="text-sm italic">No active site context loaded. Please run a crawl audit first!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Context Editing Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Business Profile Panel */}
            <Card variant="flat" className="p-6 space-y-6 border-2 border-zinc-950 bg-white">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-150">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-violet-650" />
                  <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                    AI Business Intelligence Profile
                  </h3>
                </div>
                {businessProfile ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-violet-100 text-violet-750 border border-violet-250/30 uppercase tracking-wider animate-pulse">
                    {(businessProfile.confidenceScore * 100).toFixed(0)}% Profile Confidence
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-zinc-100 text-zinc-400 border border-zinc-200 uppercase tracking-wider">
                    Profile Missing
                  </span>
                )}
              </div>

              {!businessProfile ? (
                <div className="p-4 rounded-xl border-2 border-dashed border-zinc-300 text-center space-y-2 bg-zinc-50/40">
                  <p className="text-xs font-mono text-zinc-550 leading-relaxed max-w-md mx-auto">
                    We haven&apos;t analyzed this website&apos;s business profile yet. Start a crawl audit to parse visible contents and generate company intelligence.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 text-xs font-mono">
                  {/* Summary */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Company summary</span>
                    <p className="text-zinc-800 leading-relaxed font-sans text-[13px] bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/60 font-medium">
                      {businessProfile.summary}
                    </p>
                  </div>

                  {/* Industry & category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-50 border rounded-xl border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider mb-1">Industry Group</span>
                      <span className="font-extrabold text-zinc-850 text-xs">{businessProfile.industry}</span>
                    </div>
                    <div className="p-3 bg-zinc-50 border rounded-xl border-zinc-200">
                      <span className="text-[10px] text-zinc-400 block uppercase font-bold tracking-wider mb-1">Niche Category</span>
                      <span className="font-extrabold text-zinc-850 text-xs">{businessProfile.category}</span>
                    </div>
                  </div>

                  {/* Products & services */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Discovered Products</span>
                      {businessProfile.products?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {businessProfile.products.map((p: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded-md text-[10px] font-bold bg-white text-zinc-700 border border-zinc-300">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">No products detected</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider">Discovered Services</span>
                      {businessProfile.services?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {businessProfile.services.map((s: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 rounded-md text-[10px] font-bold bg-violet-50 text-violet-650 border border-violet-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">No services detected</span>
                      )}
                    </div>
                  </div>

                  {/* Audience & Tone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-zinc-400" /> Target Audience
                      </span>
                      <p className="text-zinc-700 leading-relaxed text-[11px] font-sans">
                        {businessProfile.targetAudience}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-zinc-400" /> Brand Voice
                      </span>
                      <p className="text-zinc-700 leading-relaxed text-[11px] font-sans">
                        {businessProfile.brandVoice}
                      </p>
                    </div>
                  </div>

                  {/* USPs & Competitors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-zinc-400" /> Unique Selling Points
                      </span>
                      {businessProfile.usps?.length > 0 ? (
                        <ul className="space-y-1 font-sans text-[11px] text-zinc-700">
                          {businessProfile.usps.map((usp: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{usp}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">No explicit USPs detected</span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-450 uppercase block font-bold tracking-wider flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" /> Detected Competitors
                      </span>
                      {businessProfile.competitors?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {businessProfile.competitors.map((c: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">No direct competitors identified</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card variant="shadow" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-violet-650" />
                <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                  AI Growth Directives & Context Guidelines
                </h3>
              </div>

              <p className="text-xs text-zinc-550 leading-relaxed mb-6 font-mono">
                Instruct the AI on target SEO keywords, audience personas, content writing style, or specific sections to focus optimizations on (e.g. <i>&quot;Prioritize blog post content on &apos;Next.js tools&apos;, write in an educational tone&quot;</i>).
              </p>

              <form onSubmit={handleSaveInstructions} className="space-y-4">
                <div>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Enter custom keywords to target, tone preferences, writing style, or optimization priorities..."
                    rows={6}
                    className="w-full p-4 rounded-xl border-2 border-zinc-950 text-xs transition-all focus:outline-none focus:border-violet-500 bg-white text-zinc-800 placeholder-zinc-400 font-mono leading-relaxed"
                  />
                </div>

                {saveMessage && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
                      saveMessage.isError
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {saveMessage.text}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving Directives..." : "Save Agent Directives"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            {/* Visual Agent Crawl Memory Profile */}
            <Card variant="flat" className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                  Discovered Site Metadata
                </h3>
              </div>
              
              <div className="space-y-3.5 text-xs font-mono leading-relaxed">
                <div className="p-3 bg-zinc-50 border rounded-xl border-zinc-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Context URL</span>
                    <span className="font-bold text-zinc-850 break-all">{currentSite.url}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-450 block uppercase">WP Endpoint</span>
                    <span className="font-bold text-zinc-850 break-all">{currentSite.wpUrl || "Not Connected"}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 border rounded-xl border-zinc-200 grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Pages Audited</span>
                    <span className="font-bold text-zinc-850 text-sm">{crawledCount} pages</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Fixes Queue</span>
                    <span className="font-bold text-zinc-850 text-sm">{criticalIssuesCount} items</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block uppercase">Last Scanned</span>
                    <span className="font-bold text-zinc-850 text-sm">
                      {currentAudit ? new Date(currentAudit.createdAt).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Context Explainer Card */}
            <Card variant="flat" className="bg-violet-50/10 border-violet-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-violet-755">
                <Sparkles className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-xs font-mono uppercase tracking-wider">AI Memory Node</h4>
              </div>
              <p className="text-[11px] text-zinc-650 leading-relaxed font-mono">
                Guidelines saved in this context panel are automatically combined with your audit reports and crawl indexes whenever the chatbot is asked a question or when autonomous optimization items are recommended.
              </p>
              <div className="p-3.5 border-2 border-zinc-950 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] space-y-2">
                <h5 className="font-bold text-[10px] uppercase text-zinc-800 font-mono flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Pro-Tip: Target Keywords
                </h5>
                <p className="text-[10px] text-zinc-550 font-mono leading-normal">
                  Write: <i>&quot;Focus on rankings for &apos;best cloud server hosting&apos; and direct content generation towards small business tech buyer guides.&quot;</i>
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
