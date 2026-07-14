"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Globe, Key, CheckCircle, XCircle, ChevronRight, 
  ArrowRight, Activity, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, 
  Info, LayoutGrid, FileText, Settings, HeartPulse, Terminal
} from "lucide-react";

export default function Dashboard() {
  // Site & Audit States
  const [siteUrl, setSiteUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStep, setCrawlStep] = useState("");
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [currentAudit, setCurrentAudit] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // WordPress Connection States
  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [isConnectingWp, setIsConnectingWp] = useState(false);
  const [wpMessage, setWpMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Billing States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");

  // UI Utilities
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"audit" | "wordpress" | "history">("audit");
  const [previewBlogPost, setPreviewBlogPost] = useState<any>(null);

  // Load latest audit and site configurations on mount
  useEffect(() => {
    fetchInitialData();

    // Check URL parameters for billing feedback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success" || params.get("mock_payment") === "success") {
        setBillingMessage("🎉 Subscription activated successfully! Welcome to Premium!");
        // Clean URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        if (data.site) {
          setCurrentSite(data.site);
          setSiteUrl(data.site.url);
          setWpUrl(data.site.wpUrl || "");
          setWpUsername(data.site.wpUsername || "");
        }
        if (data.audit) {
          setCurrentAudit(data.audit);
        }
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to trigger Stripe checkout");
      }
    } catch (err) {
      console.error(err);
      alert("Stripe session creation failed.");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Copy helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Trigger crawling and auditing pipeline
  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteUrl) return;

    setIsCrawling(true);
    setErrorMessage("");
    setCrawlStep("Initiating deep crawler...");

    try {
      // Simulate progress updates for a premium feel
      const steps = [
        "Resolving domain headers...",
        "Crawling subpages (up to limit)...",
        "Parsing HTML structure...",
        "Validating meta titles & descriptions...",
        "Analyzing image alternative text tags...",
        "Scanning for broken outbound links...",
        "Requesting Google PageSpeed score...",
        "Analyzing JSON-LD Schema structures...",
        "Feeding data payload to Gemini AI provider...",
        "Generating optimized SEO fixes...",
        "Writing target content blog post drafts..."
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          setCrawlStep(steps[stepIdx]);
          stepIdx++;
        }
      }, 900);

      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: siteUrl }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Audit failed to run.");
      }

      const data = await res.json();
      if (data.success) {
        setCurrentAudit(data.audit);
        fetchInitialData(); // Reload site and latest references
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during the audit scan.");
    } finally {
      setIsCrawling(false);
      setCrawlStep("");
    }
  };

  // Save WordPress Connection Details
  const handleConnectWordPress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      setWpMessage({ text: "All WordPress connection fields are required.", isError: true });
      return;
    }

    setIsConnectingWp(true);
    setWpMessage(null);

    try {
      const res = await fetch("/api/wordpress/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wpUrl,
          username: wpUsername,
          appPassword: wpAppPassword,
          siteUrl: currentSite?.url || siteUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "WordPress connection failed.");
      }

      setWpMessage({ text: "WordPress connected and authorized successfully!", isError: false });
      setWpAppPassword(""); // Clear password field
      fetchInitialData(); // Refresh connection status badge
    } catch (err: any) {
      setWpMessage({ text: err.message || "Could not authorize WordPress connection.", isError: true });
    } finally {
      setIsConnectingWp(false);
    }
  };

  // Approve or Reject an item
  const handleActionItem = async (itemId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action }),
      });

      const data = await res.json();
      
      // Update local state smoothly to avoid full page reload jitter
      if (res.ok) {
        setCurrentAudit((prev: any) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((item: any) => {
            if (item.id === itemId) {
              return {
                ...item,
                status: data.status,
                appliedAt: data.item.appliedAt,
                suggestedValue: data.item.suggestedValue,
              };
            }
            return item;
          });
          return { ...prev, items: updatedItems };
        });
      } else {
        alert(data.error || "Failed to process item approval.");
        // If it failed but returned an updated item (e.g. error message stored in DB)
        if (data.item) {
          setCurrentAudit((prev: any) => {
            if (!prev) return prev;
            const updatedItems = prev.items.map((item: any) => 
              item.id === itemId ? { ...item, errorMessage: data.item.errorMessage, status: data.item.status } : item
            );
            return { ...prev, items: updatedItems };
          });
        }
      }
    } catch (err) {
      console.error("Failed to approve/reject item", err);
    }
  };

  // Group items by category helper
  const metaFixes = currentAudit?.items?.filter((item: any) => ["meta_title", "meta_description", "schema_markup"].includes(item.type)) || [];
  const contentDrafts = currentAudit?.items?.filter((item: any) => item.type === "blog_post") || [];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex selection:bg-violet-500 selection:text-white">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="w-64 border-r border-neutral-900 bg-neutral-950/80 backdrop-blur-md hidden md:flex flex-col shrink-0">
        <div className="h-16 px-6 flex items-center border-b border-neutral-900 gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-200">Antigravity Growth</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab("audit")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "audit" 
                ? "bg-violet-600/10 border border-violet-500/20 text-violet-400" 
                : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200 border border-transparent"
            }`}
          >
            <LayoutGrid className="w-4.5 h-4.5" />
            SEO & Content Audits
          </button>
          <button 
            onClick={() => setActiveTab("wordpress")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "wordpress" 
                ? "bg-violet-600/10 border border-violet-500/20 text-violet-400" 
                : "text-neutral-400 hover:bg-neutral-900/60 hover:text-neutral-200 border border-transparent"
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            WordPress Connection
          </button>
        </nav>

        {currentUser && !currentUser.subscriptionActive && (
          <div className="p-4 mx-4 mb-4 rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/20 to-indigo-950/20 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center gap-2 text-violet-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Antigravity Premium</span>
            </div>
            <p className="text-[10px] text-neutral-400 leading-relaxed">
              Unlock WordPress auto-apply features and unlimited scans.
            </p>
            <button 
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white rounded-xl text-[11px] font-semibold shadow-md shadow-violet-600/10 transition-all flex items-center justify-center gap-1"
            >
              {isSubscribing ? (
                <>
                  <Activity className="w-3 h-3 animate-spin" /> Upgrading...
                </>
              ) : (
                <>
                  Upgrade to V1 ($19) <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}

        <div className="p-4 border-t border-neutral-900">
          <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-neutral-400 font-mono">SQLite Local Active</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-8 bg-neutral-950/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-neutral-400 text-sm hidden md:inline">Workspace</span>
            <ChevronRight className="w-4 h-4 text-neutral-700 hidden md:inline" />
            <span className="text-sm font-medium text-neutral-200 capitalize">{activeTab} Panel</span>
          </div>

          <div className="flex items-center gap-4">
            {currentSite?.wpUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" /> WordPress Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 text-neutral-400 border border-neutral-700">
                <XCircle className="w-3.5 h-3.5" /> WordPress Unconnected
              </span>
            )}
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-8">
          {billingMessage && (
            <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-sm text-emerald-400 flex items-center justify-between shadow-lg shadow-emerald-500/5">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                {billingMessage}
              </span>
              <button onClick={() => setBillingMessage("")} className="text-neutral-500 hover:text-white text-xs font-semibold p-1">✕</button>
            </div>
          )}
          
          {/* TAB 1: SEO AUDIT & CHECKS */}
          {activeTab === "audit" && (
            <div className="space-y-8">
              {/* Domain Input Form */}
              <section className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/20 backdrop-blur-md">
                <h2 className="text-xl font-bold text-neutral-200 mb-2">Audit New Website</h2>
                <p className="text-sm text-neutral-400 mb-6">Enter your business domain to trigger crawl diagnostics, SEO optimization suggestions, and fresh content drafts.</p>

                <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600" />
                    <input 
                      type="text" 
                      placeholder="e.g. https://yoursalon.com" 
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      disabled={isCrawling}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isCrawling || !siteUrl}
                    className="px-6 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-all disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-600/25 flex items-center justify-center gap-2"
                  >
                    {isCrawling ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      <>
                        Run Diagnostics <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Crawling Progress Indicator */}
                {isCrawling && (
                  <div className="mt-6 p-4 rounded-xl border border-violet-500/10 bg-violet-500/5 flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-violet-400 font-medium flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Growth agent crawling active...
                      </span>
                      <span className="text-neutral-500 font-mono">{crawlStep}</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full animate-[shimmer_2s_infinite] w-[75%] transition-all duration-1000" />
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    {errorMessage}
                  </div>
                )}
              </section>

              {/* Audit Results Dashboard */}
              {currentAudit ? (
                <div className="space-y-8">
                  
                  {/* Performance Indicators */}
                  <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/30">
                      <span className="text-xs text-neutral-400 font-medium">Performance Score</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-4xl font-extrabold ${currentAudit.scorePerformance >= 90 ? "text-emerald-400" : currentAudit.scorePerformance >= 70 ? "text-amber-400" : "text-red-400"}`}>
                          {currentAudit.scorePerformance}
                        </span>
                        <span className="text-xs text-neutral-500">/ 100</span>
                      </div>
                      <span className="text-xs text-neutral-500 block mt-2">Tested page load speeds</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/30">
                      <span className="text-xs text-neutral-400 font-medium">SEO Health Index</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-4xl font-extrabold ${currentAudit.scoreSeo >= 80 ? "text-emerald-400" : currentAudit.scoreSeo >= 50 ? "text-amber-400" : "text-red-400"}`}>
                          {currentAudit.scoreSeo}%
                        </span>
                        <span className="text-xs text-neutral-500">of checks passed</span>
                      </div>
                      <span className="text-xs text-neutral-500 block mt-2">Standard tags & headers</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/30">
                      <span className="text-xs text-neutral-400 font-medium">Broken Links Detected</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-4xl font-extrabold ${metaFixes.filter((i: any) => i.type === "broken_link").length > 0 ? "text-red-400" : "text-emerald-400"}`}>
                          {metaFixes.filter((i: any) => i.type === "broken_link").length}
                        </span>
                        <span className="text-xs text-neutral-500">404 errors found</span>
                      </div>
                      <span className="text-xs text-neutral-500 block mt-2">HEAD/GET status checks</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/30">
                      <span className="text-xs text-neutral-400 font-medium">Missing Alt Image Tags</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-4xl font-extrabold ${metaFixes.filter((i: any) => i.type === "missing_alt").length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {metaFixes.filter((i: any) => i.type === "missing_alt").length}
                        </span>
                        <span className="text-xs text-neutral-500">images without alt</span>
                      </div>
                      <span className="text-xs text-neutral-500 block mt-2">Semantic image checks</span>
                    </div>
                  </section>

                  {/* Fixes and Actions List */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left & Middle Column: SEO Tags Fixes */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                          <HeartPulse className="w-5 h-5 text-violet-400" /> Meta Tags & Schema Fixes
                        </h3>
                        <span className="text-xs text-neutral-500">{metaFixes.length} pending fixes found</span>
                      </div>

                      {metaFixes.length === 0 ? (
                        <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/10 text-center text-neutral-500">
                          No meta tag issues detected. Your header configurations look solid!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {metaFixes.map((item: any) => {
                            const isApproved = item.status === "approved";
                            const isRejected = item.status === "rejected";
                            const currentValParsed = item.currentValue ? JSON.parse(item.currentValue) : null;

                            return (
                              <div key={item.id} className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/30 space-y-4 relative">
                                {/* Title / Badge */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs uppercase font-mono tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full">
                                      {item.type.replace("_", " ")}
                                    </span>
                                    <span className="text-xs text-neutral-500 truncate max-w-xs">{item.targetUrl}</span>
                                  </div>
                                  
                                  {isApproved && (
                                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                      <CheckCircle className="w-3.5 h-3.5" /> Approved
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
                                      <XCircle className="w-3.5 h-3.5" /> Rejected
                                    </span>
                                  )}
                                  {item.status === "pending" && (
                                    <span className="text-xs text-amber-400 font-semibold animate-pulse">Pending Review</span>
                                  )}
                                </div>

                                {/* Visual Diff View */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Current Value */}
                                  <div className="p-3 bg-red-950/10 border border-red-900/25 rounded-xl">
                                    <span className="text-[10px] text-red-400 font-semibold block uppercase mb-1">Current Tag</span>
                                    <p className="text-xs text-neutral-400 line-through leading-relaxed">
                                      {currentValParsed?.title || currentValParsed?.description || currentValParsed?.count || (item.type === "schema_markup" ? "Missing schema.org JSON-LD" : "Empty tag")}
                                    </p>
                                    {currentValParsed?.length && (
                                      <span className="text-[10px] text-neutral-500 font-mono mt-1 block">{currentValParsed.length} characters</span>
                                    )}
                                  </div>

                                  {/* AI Suggested Value */}
                                  <div className="p-3 bg-violet-950/10 border border-violet-900/20 rounded-xl relative group">
                                    <span className="text-[10px] text-violet-400 font-semibold block uppercase mb-1">AI Suggestion</span>
                                    <p className="text-xs text-neutral-200 font-medium leading-relaxed pr-8">
                                      {item.suggestedValue}
                                    </p>
                                    <button 
                                      onClick={() => handleCopyText(item.suggestedValue, item.id)}
                                      className="absolute right-2 top-2 p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Copy code suggestion"
                                    >
                                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <span className="text-[10px] text-neutral-500 font-mono mt-1 block">{item.suggestedValue?.length} characters</span>
                                  </div>
                                </div>

                                {/* Actions Bar */}
                                {item.status === "pending" && (
                                  <div className="flex gap-2 justify-end pt-2">
                                    <button 
                                      onClick={() => handleActionItem(item.id, "reject")}
                                      className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-750 text-neutral-400 hover:text-white transition-colors text-xs font-semibold"
                                    >
                                      Reject Fix
                                    </button>
                                    <button 
                                      onClick={() => handleActionItem(item.id, "approve")}
                                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all text-xs font-semibold flex items-center gap-1.5"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Approve Fix
                                    </button>
                                  </div>
                                )}

                                {/* Copy Box for Approved Meta Fixes */}
                                {isApproved && (
                                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-900 flex items-center justify-between">
                                    <code className="text-xs font-mono text-neutral-400 truncate max-w-md">
                                      {item.type === "schema_markup" ? item.suggestedValue.substring(0, 100) + "..." : item.suggestedValue}
                                    </code>
                                    <button 
                                      onClick={() => handleCopyText(item.suggestedValue, item.id + "-approved")}
                                      className="px-3 py-1 bg-neutral-900 border border-neutral-850 hover:border-neutral-700 rounded-lg text-xs font-semibold text-neutral-300 flex items-center gap-1 transition-colors"
                                    >
                                      {copiedId === item.id + "-approved" ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3.5 h-3.5" /> Copy Code
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Blog Post Drafts */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-neutral-200 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-violet-400" /> AI Blog Drafts
                        </h3>
                        <span className="text-xs text-neutral-500">{contentDrafts.length} posts</span>
                      </div>

                      {contentDrafts.length === 0 ? (
                        <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/10 text-center text-neutral-500">
                          No blog draft generation history. Run a website audit diagnostic scan to trigger drafts.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {contentDrafts.map((item: any) => {
                            const postData = JSON.parse(item.suggestedValue || "{}");
                            const isApplied = item.status === "applied";
                            const isApproved = item.status === "approved";
                            const isPending = item.status === "pending";

                            return (
                              <div key={item.id} className="p-5 rounded-2xl border border-neutral-900 bg-neutral-900/30 hover:border-neutral-850 transition-colors flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                  {isApplied ? (
                                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Pushed live (WP Draft)
                                    </span>
                                  ) : isApproved ? (
                                    <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                                      Ready for review
                                    </span>
                                  )}
                                  <span className="text-[10px] text-neutral-500 font-mono">/{postData.slug || "blog"}</span>
                                </div>

                                <div className="space-y-1">
                                  <h4 className="font-bold text-neutral-200 text-sm leading-snug">{postData.title}</h4>
                                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                                    {postData.content?.replace(/<[^>]*>/g, "").substring(0, 150)}...
                                  </p>
                                </div>

                                {item.errorMessage && (
                                  <div className="p-2 rounded bg-red-950/20 border border-red-900/20 text-[10px] text-red-400 font-mono">
                                    {item.errorMessage}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-2 mt-auto">
                                  <button 
                                    onClick={() => setPreviewBlogPost(postData)}
                                    className="px-3 py-1.5 rounded-lg border border-neutral-850 hover:border-neutral-700 text-xs font-semibold text-neutral-300 transition-colors flex-1"
                                  >
                                    View Draft Content
                                  </button>
                                  
                                  {isPending && (
                                    <>
                                      <button 
                                        onClick={() => handleActionItem(item.id, "reject")}
                                        className="p-2 rounded-lg border border-neutral-850 hover:border-red-950 hover:text-red-400 transition-colors"
                                        title="Reject Draft"
                                      >
                                        <XCircle className="w-4.5 h-4.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleActionItem(item.id, "approve")}
                                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs flex items-center gap-1 shadow-md transition-all"
                                        title="Approve Post"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                                      </button>
                                    </>
                                  )}
                                  
                                  {isApplied && postData.wpLink && (
                                    <a 
                                      href={postData.wpLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
                                    >
                                      Edit in WP <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}

                                  {isApproved && (
                                    <button 
                                      onClick={() => handleCopyText(postData.content, item.id + "-content")}
                                      className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
                                    >
                                      {copiedId === item.id + "-content" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                      Copy HTML
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 rounded-2xl border border-dashed border-neutral-900 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900/50 flex items-center justify-center text-neutral-600 mx-auto">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-300">No Audits Run Yet</h3>
                    <p className="text-neutral-500 text-xs mt-1">Enter your site URL above to perform crawl analysis and content generation.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORDPRESS CONNECTION SETTINGS */}
          {activeTab === "wordpress" && (
            <section className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/20 backdrop-blur-md space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-200 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-violet-400" /> Connect WordPress REST API
                </h2>
                <p className="text-sm text-neutral-400 mt-2">
                  Connect your WordPress dashboard to auto-publish approved blog posts and SEO tag optimizations automatically.
                </p>
              </div>

              {/* Secure Instructions banner */}
              <div className="p-4 rounded-xl border border-yellow-500/10 bg-yellow-500/5 text-xs text-yellow-300/80 leading-relaxed flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-yellow-300">Important Security Principle: Least Privilege</p>
                  <p>Do NOT enter your primary administrator credentials. Follow these instructions:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Log in to your WordPress dashboard.</li>
                    <li>Navigate to <strong>Users &gt; Add New User</strong>. Create a user named <code>antigravity-agent</code> with the role of <strong>Author</strong> or <strong>Editor</strong>.</li>
                    <li>Edit that user, scroll to the bottom, and locate the <strong>Application Passwords</strong> section.</li>
                    <li>Generate a new password (e.g. "Antigravity Audit") and copy the resulting 24-character code. Use it below.</li>
                  </ol>
                  <p className="text-neutral-400 mt-2">This limits permissions. The agent can only edit drafts, preventing full site breaches if credentials leak.</p>
                </div>
              </div>

              <form onSubmit={handleConnectWordPress} className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-semibold block uppercase">WordPress Website URL</label>
                  <input 
                    type="text" 
                    placeholder="e.g. https://yoursite.com"
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold block uppercase">WP Author Username</label>
                    <input 
                      type="text" 
                      placeholder="e.g. agent-editor"
                      value={wpUsername}
                      onChange={(e) => setWpUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold block uppercase">WP Application Password</label>
                    <input 
                      type="password" 
                      placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      value={wpAppPassword}
                      onChange={(e) => setWpAppPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-200 placeholder-neutral-750 focus:outline-none focus:border-violet-500 text-sm transition-colors"
                    />
                  </div>
                </div>

                {wpMessage && (
                  <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
                    wpMessage.isError ? "border-red-500/10 bg-red-500/5 text-red-400" : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400"
                  }`}>
                    {wpMessage.isError ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                    {wpMessage.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isConnectingWp}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm rounded-xl transition-all hover:shadow-lg disabled:bg-neutral-800 disabled:text-neutral-500 flex items-center gap-2"
                >
                  {isConnectingWp ? <Activity className="w-4 h-4 animate-spin" /> : <Key className="w-4.5 h-4.5" />}
                  Authorize & Test WordPress Connection
                </button>
              </form>
            </section>
          )}
        </div>
      </main>

      {/* Blog Post Preview Modal */}
      {previewBlogPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-850 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-violet-400 font-mono block mb-1">Gutenberg Block Content Preview</span>
                <h3 className="font-bold text-neutral-100 text-lg leading-snug">{previewBlogPost.title}</h3>
              </div>
              <button 
                onClick={() => setPreviewBlogPost(null)}
                className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850 transition-all"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 prose prose-invert max-w-none text-neutral-300 text-sm leading-relaxed">
              <div 
                className="space-y-4"
                dangerouslySetInnerHTML={{ __html: previewBlogPost.content }} 
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-850 bg-neutral-950 flex justify-end gap-2">
              <button 
                onClick={() => handleCopyText(previewBlogPost.content, "modal-copy")}
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
              >
                {copiedId === "modal-copy" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy HTML Source
              </button>
              <button 
                onClick={() => setPreviewBlogPost(null)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-xs font-semibold transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
