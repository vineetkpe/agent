import React, { useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Globe, Shield, Sparkles, CheckCircle, Clock, ChevronRight, X, AlertCircle } from "lucide-react";

interface AddSiteFlowProps {
  onClose: () => void;
  currentUser: any;
  currentSite: any;
  toggleGscConnection: (siteId: string, gscUrl?: string) => void;
  handleConnectCMS: (e: React.FormEvent) => void;
  wpUrl: string;
  setWpUrl: (url: string) => void;
  wpUsername: string;
  setWpUsername: (username: string) => void;
  wpAppPassword: string;
  setWpAppPassword: (pwd: string) => void;
  isConnectingWp: boolean;
  wpMessage: { text: string; isError: boolean } | null;
  fetchInitialData: (siteId?: string) => Promise<void>;
}

export const AddSiteFlow: React.FC<AddSiteFlowProps> = ({
  onClose,
  currentUser,
  currentSite,
  toggleGscConnection,
  handleConnectCMS,
  wpUrl,
  setWpUrl,
  wpUsername,
  setWpUsername,
  wpAppPassword,
  setWpAppPassword,
  isConnectingWp,
  wpMessage,
  fetchInitialData,
}) => {
  const [step, setStep] = useState<"url" | "crawl" | "form" | "connections" | "finish">("url");
  const [siteUrlInput, setSiteUrlInput] = useState("");
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null);
  const [crawlProgress, setCrawlProgress] = useState("");
  const [isThinContent, setIsThinContent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Business Context Form States
  const [industry, setIndustry] = useState("");
  const [services, setServices] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [cityServiceArea, setCityServiceArea] = useState("");
  const [description, setDescription] = useState("");
  const [isSavingContext, setIsSavingContext] = useState(false);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteUrlInput) return;

    setErrorMsg("");
    setStep("crawl");
    setCrawlProgress("Initializing deep crawler...");

    const steps = [
      "Resolving domain headers...",
      "Crawling subpages (checking depth)...",
      "Parsing HTML content structure...",
      "Analyzing body word counts & SPA layout...",
    ];

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < steps.length) {
        setCrawlProgress(steps[idx]);
        idx++;
      }
    }, 1200);

    try {
      const res = await fetch("/api/site/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrlInput }),
      });
      clearInterval(interval);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add website.");
      }

      setCreatedSiteId(data.site.id);
      setIsThinContent(data.isThin);

      // Auto load initial data for new site
      await fetchInitialData(data.site.id);

      if (data.isThin) {
        setStep("form");
      } else {
        setStep("connections");
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || "Failed to crawl site. Verify domain is active.");
      setStep("url");
    }
  };

  const handleSaveContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdSiteId) return;

    setIsSavingContext(true);
    setErrorMsg("");

    try {
      const servicesList = services.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`/api/site/${createdSiteId}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          services: servicesList,
          targetAudience,
          cityServiceArea,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save business profile.");
      }

      await fetchInitialData(createdSiteId);
      setStep("connections");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save context.");
    } finally {
      setIsSavingContext(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
      <Card variant="flat" className="bg-white border-2 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] max-w-xl w-full relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b-2 border-zinc-950 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs shadow-[1.5px_1.5px_0px_0px_rgba(9,9,11,1)] border border-zinc-950">
              ⚡
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                Setup Autonomous Agent
              </h3>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                Onboarding Step {step === "url" ? "1" : step === "crawl" ? "2" : step === "form" ? "3" : "4"} of 5
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded hover:bg-zinc-200 border border-transparent hover:border-zinc-350"
          >
            <X className="w-4 h-4 text-zinc-650" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border-2 border-rose-250 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter URL */}
          {step === "url" && (
            <form onSubmit={handleCreateSite} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-450 block">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="e.g. yourbusiness.com"
                    value={siteUrlInput}
                    onChange={(e) => setSiteUrlInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none focus:ring-0 placeholder:text-zinc-400"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Our crawler will automatically scan pages to generate custom business intelligence scopes.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 border-2 border-zinc-950 bg-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650"
              >
                Scan Domain & Begin <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </form>
          )}

          {/* STEP 2: Crawl Loading */}
          {step === "crawl" && (
            <div className="py-8 text-center space-y-4">
              <Clock className="w-10 h-10 text-violet-650 animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest block">
                  Executing crawler pipeline
                </span>
                <p className="text-xs text-zinc-650">
                  {crawlProgress}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Business Context Short Form */}
          {step === "form" && (
            <form onSubmit={handleSaveContext} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-250 text-amber-800 text-[10px] rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Thin Content Detected:</strong> Our crawler couldn't extract enough facts automatically. Please provide brief details so we build an accurate SEO writing template.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-550 block">INDUSTRY</label>
                  <input
                    type="text"
                    placeholder="e.g. Legal, Plumbing, HVAC"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-550 block">CITY / SERVICE AREA</label>
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX"
                    value={cityServiceArea}
                    onChange={(e) => setCityServiceArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-550 block">SERVICES OFFERED (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  placeholder="e.g. Residential Repairs, Leak Detection, Pipe Replacement"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-550 block">TARGET AUDIENCE</label>
                <input
                  type="text"
                  placeholder="e.g. Local homeowners, small businesses"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-550 block">2-3 SENTENCE BUSINESS DESCRIPTION</label>
                <textarea
                  placeholder="Briefly tell us what makes your services unique..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs border-2 border-zinc-950 rounded-xl focus:outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSavingContext}
                className="w-full py-3 border-2 border-zinc-950 bg-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650 disabled:bg-zinc-100"
              >
                {isSavingContext ? "Saving Context..." : "Save Context & Continue"} <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </form>
          )}

          {/* STEP 4: Tool Connections */}
          {step === "connections" && (
            <div className="space-y-6">
              <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[10px] rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Setup Success!</strong> Business profile successfully configured. Connect optionally to begin execution.
                </span>
              </div>

              <div className="space-y-4">
                {/* Google Search Console & GA4 (One Flow) */}
                <div className="p-4 border-2 border-zinc-950 rounded-xl flex items-center justify-between bg-zinc-50/50">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-zinc-900 block">Google Analytics & Search Console</span>
                    <span className="text-[10px] text-zinc-500 block">Connect traffic stats and index rankings</span>
                  </div>
                  {currentSite?.gscConnected ? (
                    <span className="px-2.5 py-1 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => toggleGscConnection(createdSiteId || "")}
                      className="px-3 py-1.5 text-[10px] font-bold border-2 border-zinc-950 bg-white hover:bg-zinc-100 rounded-xl shadow-[1.5px_1.5px_0px_0px_rgba(9,9,11,1)]"
                      type="button"
                    >
                      Connect Google
                    </button>
                  )}
                </div>

                {/* WordPress Connection */}
                <div className="p-4 border-2 border-zinc-950 rounded-xl space-y-4 bg-zinc-50/50">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-zinc-900 block">WordPress Publication</span>
                      <span className="text-[10px] text-zinc-500 block">Auto publish articles straight to WordPress</span>
                    </div>
                    {currentSite?.wpUrl ? (
                      <span className="px-2.5 py-1 text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg">
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-400 font-mono">Not Setup</span>
                    )}
                  </div>

                  {!currentSite?.wpUrl && (
                    <form onSubmit={handleConnectCMS} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500">WORDPRESS URL</label>
                          <input
                            type="text"
                            placeholder="e.g. hostamble.com"
                            value={wpUrl}
                            onChange={(e) => setWpUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-300 rounded focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-500">USERNAME</label>
                          <input
                            type="text"
                            placeholder="admin"
                            value={wpUsername}
                            onChange={(e) => setWpUsername(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-300 rounded focus:outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-zinc-500">WORDPRESS APPLICATION PASSWORD</label>
                        <input
                          type="password"
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={wpAppPassword}
                          onChange={(e) => setWpAppPassword(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[11px] border border-zinc-300 rounded focus:outline-none"
                          required
                        />
                      </div>

                      {wpMessage && (
                        <p className={`text-[10px] font-mono ${wpMessage.isError ? "text-rose-600" : "text-emerald-600"}`}>
                          {wpMessage.text}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isConnectingWp}
                        className="px-4 py-1.5 border-2 border-zinc-950 bg-violet-600 text-white font-bold text-[10px] rounded-lg shadow-[1.5px_1.5px_0px_0px_rgba(9,9,11,1)]"
                      >
                        {isConnectingWp ? "Connecting..." : "Authorize WordPress"}
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("finish")}
                  className="w-full py-3 border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]"
                  type="button"
                >
                  Skip Connections
                </button>
                <button
                  onClick={() => setStep("finish")}
                  className="w-full py-3 border-2 border-zinc-950 bg-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650"
                  type="button"
                >
                  Finish Setup
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Finish */}
          {step === "finish" && (
            <div className="py-8 text-center space-y-5">
              <div className="w-12 h-12 bg-emerald-50 rounded-full border border-emerald-250 flex items-center justify-center text-emerald-600 mx-auto">
                🎉
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-zinc-900 uppercase">Onboarding Completed!</h3>
                <p className="text-[11px] text-zinc-550 leading-relaxed font-mono max-w-sm mx-auto">
                  Your new website workspace is fully active and structured. Run crawler audits at any time to generate targeted SEO suggestions!
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 border-2 border-zinc-950 bg-violet-600 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650"
                type="button"
              >
                Go to Workspace Dashboard
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
export default AddSiteFlow;
