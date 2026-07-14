"use client";

import { useState, useEffect } from "react";
import { 
  Sparkles, Globe, Key, CheckCircle, XCircle, ChevronRight, 
  ArrowRight, Activity, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, 
  Info, LayoutGrid, FileText, Settings, HeartPulse, Terminal, TrendingUp,
  Users, Mail, Plus, Search, Image, ArrowUpRight, Lock, Calendar, Zap, Clock, Trash2
} from "lucide-react";

export default function Dashboard() {
  // Site & Audit States
  const [siteUrl, setSiteUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStep, setCrawlStep] = useState("");
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [currentAudit, setCurrentAudit] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // CMS/REST Connection States (WordPress compatible backend)
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
  const [activeTab, setActiveTab] = useState<
    "overview" | "crawler" | "recommendations" | "content" | "tracker" | "competitors" | "report" | "cms"
  >("overview");
  const [previewBlogPost, setPreviewBlogPost] = useState<any>(null);

  // Expanded Feature States
  // 1. Keyword Tracker
  const [targetKeywords, setTargetKeywords] = useState<any[]>([
    { id: "1", term: "local contractor service", volume: 1400, rank: 4, previousRank: 8, trend: "up" },
    { id: "2", term: "certified plumbing repairs", volume: 850, rank: 2, previousRank: 2, trend: "neutral" },
    { id: "3", term: "emergency leaks fix", volume: 90, rank: 12, previousRank: 18, trend: "up" },
    { id: "4", term: "home pipe renovation cost", volume: 320, rank: 24, previousRank: 21, trend: "down" },
  ]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newKeywordVolume, setNewKeywordVolume] = useState("300");

  // 2. Competitor Analysis
  const [competitors, setCompetitors] = useState<any[]>([
    { id: "1", domain: "apex-plumbing-pros.com", overlappingKeywords: 410, contentGaps: 14, backlinks: 1240, topPage: "/plumbing-services" },
    { id: "2", domain: "metro-home-repair.net", overlappingKeywords: 280, contentGaps: 8, backlinks: 920, topPage: "/water-heaters" },
  ]);
  const [newCompetitor, setNewCompetitor] = useState("");

  // 3. Daily Scheduler Simulation
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([
    { id: "1", text: "Fix 3 meta descriptions", target: "Meta optimizations ready", status: "completed", time: "09:15 AM" },
    { id: "2", text: "Add semantic internal links", target: "Linking hierarchy update", status: "completed", time: "11:30 AM" },
    { id: "3", text: "Write 1 new target article", target: "SEO blog generator", status: "completed", time: "02:10 PM" },
    { id: "4", text: "Compress 20 heavy image assets", target: "PageSpeed scores boost", status: "completed", time: "03:45 PM" },
    { id: "5", text: "Inject LocalBusiness schema", target: "JSON-LD structured data", status: "completed", time: "04:20 PM" },
    { id: "6", text: "Check broken outbound links", target: "404 anchor nodes scan", status: "completed", time: "05:00 PM" },
  ]);

  // 4. AI Content Generator Workspace
  const [contentKeyword, setContentKeyword] = useState("");
  const [contentOutline, setContentOutline] = useState<any>(null);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [contentArticle, setContentArticle] = useState<any>(null);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [contentFaqs, setContentFaqs] = useState<any[]>([]);
  const [contentMeta, setContentMeta] = useState<any>(null);
  const [contentSchema, setContentSchema] = useState<string>("");

  // 5. Weekly Email Notification state
  const [weeklyEmailStatus, setWeeklyEmailStatus] = useState<string | null>(null);

  // Load latest audit and site configurations on mount
  useEffect(() => {
    fetchInitialData();

    // Check URL parameters for billing feedback
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success" || params.get("mock_payment") === "success") {
        setBillingMessage("🎉 Subscription activated successfully! Welcome to Premium!");
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
        fetchInitialData(); // Reload site and references
        setActiveTab("crawler"); // Automatically navigate to view details
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during the audit scan.");
    } finally {
      setIsCrawling(false);
      setCrawlStep("");
    }
  };

  // Save CMS Connection Details
  const handleConnectCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      setWpMessage({ text: "All connection fields are required.", isError: true });
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
        throw new Error(data.error || "CMS connection authorization failed.");
      }

      setWpMessage({ text: "CMS REST API connected and authorized successfully!", isError: false });
      setWpAppPassword(""); // Clear password field
      fetchInitialData(); // Refresh badge status
    } catch (err: any) {
      setWpMessage({ text: err.message || "Could not authorize CMS API connection.", isError: true });
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

  // Add target keyword helper
  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const kw = {
      id: Date.now().toString(),
      term: newKeyword.trim(),
      volume: parseInt(newKeywordVolume) || 100,
      rank: Math.floor(Math.random() * 50) + 1,
      previousRank: Math.floor(Math.random() * 80) + 1,
      trend: Math.random() > 0.5 ? "up" : "down"
    };
    setTargetKeywords([kw, ...targetKeywords]);
    setNewKeyword("");
  };

  // Delete keyword helper
  const handleDeleteKeyword = (id: string) => {
    setTargetKeywords(targetKeywords.filter(k => k.id !== id));
  };

  // Add competitor helper
  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompetitor.trim()) return;
    const comp = {
      id: Date.now().toString(),
      domain: newCompetitor.trim().replace(/^https?:\/\//i, ""),
      overlappingKeywords: Math.floor(Math.random() * 300) + 50,
      contentGaps: Math.floor(Math.random() * 20) + 5,
      backlinks: Math.floor(Math.random() * 2000) + 200,
      topPage: "/blog/seo-tips"
    };
    setCompetitors([comp, ...competitors]);
    setNewCompetitor("");
  };

  // Delete competitor helper
  const handleDeleteCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  // Run Agent Daily Scan Cycle Simulation
  const handleRunAgentCycle = () => {
    setAgentRunning(true);
    setAgentLogs([]);
    const logs = [
      "🤖 Wakeup signal received. Initiating automated digital growth routine...",
      "🔍 Checking crawler state. Scanning website files for missing metadata...",
      "✍️ Draft optimization: Writing 3 replacements for incomplete meta descriptions...",
      "🔗 Adding context internal links between related blog posts for pagerank...",
      "💡 Synthesizing new content outlines: Target keyword 'emergency piping fix' outline compiled.",
      "📝 Writing 1 search-optimized article: '5 Essential Plumbing Checkpoints for Local Homeowners' completed.",
      "🖼️ Compressing 20 heavy .png assets to Google PageSpeed standards. Savings: 62.4MB.",
      "🏷️ Writing LocalBusiness Structured JSON-LD schemas targeting main landing subpage...",
      "🔗 Scraping outbound URLs. Found 1 broken anchor target. Flagged for CMS repair.",
      "✅ Task queue processed. All 6 planned actions pushed to dashboard logs successfully!"
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logs.length) {
        setAgentLogs(prev => [...prev, logs[currentLog]]);
        currentLog++;
      } else {
        clearInterval(interval);
        setAgentRunning(false);
        // Refresh items or set some tasks completed status
        setDailyTasks(prev => prev.map(t => ({ ...t, status: "completed" })));
      }
    }, 1200);
  };

  // Generate Outline Simulator
  const handleGenerateOutline = async () => {
    if (!contentKeyword) return;
    setGeneratingOutline(true);
    setTimeout(() => {
      setContentOutline({
        title: `The Ultimate Guide to ${contentKeyword}`,
        topic: contentKeyword,
        sections: [
          "Introduction: Why it matters",
          `Key Core concepts of ${contentKeyword}`,
          "Case Studies and practical strategies",
          "Frequently Asked Questions",
          "Summary & Direct Action checklist"
        ]
      });
      setGeneratingOutline(false);
    }, 1500);
  };

  // Generate Article Simulator
  const handleGenerateArticle = async () => {
    if (!contentKeyword) return;
    setGeneratingArticle(true);
    setTimeout(() => {
      setContentArticle({
        title: `How to Optimize your Business for ${contentKeyword}`,
        content: `<h2>Introduction</h2><p>In modern digital environments, understanding <strong>${contentKeyword}</strong> has transformed from an optional growth choice to a core ranking survival skill...</p><h2>Step-by-step Framework</h2><p>Our autonomous crawler and data intelligence suggest three main steps for optimizing target parameters...</p><h2>Frequently Asked Questions</h2><dl><dt>What is the main benefit of ${contentKeyword}?</dt><dd>It helps build organic reference authority and indexes higher on search results.</dd></dl>`,
        slug: contentKeyword.toLowerCase().replace(/\s+/g, "-")
      });
      setContentFaqs([
        { q: `What is the first step in implementing ${contentKeyword}?`, a: "Map existing site parameters and execute a crawler audit to identify gaps." },
        { q: `How long does it take to see organic results?`, a: "Generally 4 to 8 weeks depending on search competition and tag adjustments." }
      ]);
      setContentMeta({
        title: `${contentKeyword} Mastery: Complete Digital Blueprint`,
        description: `Learn how to leverage ${contentKeyword} to drive organic growth. Follow our step-by-step SEO outline, read key answers, and download schemas.`
      });
      setContentSchema(JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": `How to Optimize your Business for ${contentKeyword}`,
        "description": `Learn the fundamental rules of ${contentKeyword} to increase search CTR.`,
        "author": { "@type": "Organization", "name": "Antigravity AI Agent" }
      }, null, 2));
      setGeneratingArticle(false);
    }, 2200);
  };

  // Send Weekly Report Preview Simulator
  const handleSendWeeklyReport = () => {
    setWeeklyEmailStatus("sending");
    setTimeout(() => {
      setWeeklyEmailStatus("sent");
      setTimeout(() => setWeeklyEmailStatus(null), 3000);
    }, 1500);
  };

  // Filter types helper
  const metaFixes = currentAudit?.items?.filter((item: any) => ["meta_title", "meta_description", "schema_markup", "missing_alt", "broken_link"].includes(item.type)) || [];
  const contentDrafts = currentAudit?.items?.filter((item: any) => item.type === "blog_post") || [];

  // Map AI Recommendations details (Issue, Why it matters, Impact)
  const getRecommendationDetails = (type: string) => {
    switch (type) {
      case "meta_title":
        return {
          explanation: "The meta title tag is either entirely missing or is not within the optimized length (30-65 characters).",
          whyItMatters: "Titles are the primary blue link headings Google displays. A sub-optimal title reduces search click-through rates (CTR) and impairs visibility.",
          impact: "High",
          impactScore: 95
        };
      case "meta_description":
        return {
          explanation: "The page description meta tag is either missing or too short/long (recommended range is 120-160 characters).",
          whyItMatters: "Meta descriptions act as snippet advertising copy in search results. A clear summary convinces search users to choose your link over competitors.",
          impact: "High",
          impactScore: 85
        };
      case "schema_markup":
        return {
          explanation: "Missing JSON-LD structured data schema (e.g. LocalBusiness, WebSite, or Article schemas).",
          whyItMatters: "Schemas inform search bots of explicit entity details (reviews, address, pricing). Adding schema makes your link eligible for rich graphical snippets on Google.",
          impact: "Medium",
          impactScore: 70
        };
      case "missing_alt":
        return {
          explanation: "Image elements are missing descriptive 'alt' attribute tags.",
          whyItMatters: "Search engine algorithms cannot 'read' graphics. Alternative text indexes images in Google Images and is crucial for accessibility compliance (screen readers).",
          impact: "Medium",
          impactScore: 60
        };
      case "broken_link":
        return {
          explanation: "Outbound link anchors are pointing to targets returning 404 or connection timeouts.",
          whyItMatters: "Broken links exhaust crawler budgets and harm authority score. They frustate users, signaling search crawlers that a site is poorly maintained.",
          impact: "High",
          impactScore: 90
        };
      default:
        return {
          explanation: "Identified quality or structural gap in site markup.",
          whyItMatters: "Ensures search engine indexing efficiency and user retention.",
          impact: "Low",
          impactScore: 40
        };
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-violet-500 selection:text-white relative bg-zinc-50 text-zinc-800">
      
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none -z-10 bg-violet-500/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none -z-10 bg-indigo-500/3" />

      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col shrink-0 z-20 border-zinc-200 bg-white shadow-sm">
        <div className="h-16 px-6 flex items-center border-b gap-3 border-zinc-150">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-zinc-900">Antigravity Growth</span>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "overview" 
                ? "bg-violet-50 border-violet-100 text-violet-750 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <Activity className="w-4 h-4" />
            Agent Activity
          </button>
          
          <button 
            onClick={() => setActiveTab("crawler")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "crawler" 
                ? "bg-violet-50 border-violet-100 text-violet-750 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <Globe className="w-4 h-4" />
            Site Crawler (Core)
          </button>

          <button 
            onClick={() => setActiveTab("recommendations")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "recommendations" 
                ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            AI Recommendations
          </button>

          <button 
            onClick={() => setActiveTab("content")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "content" 
                ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <FileText className="w-4 h-4" />
            AI Content Suite
          </button>

          <button 
            onClick={() => setActiveTab("tracker")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "tracker" 
                ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm" 
                : "text-zinc-555 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Keyword Tracker
          </button>

          <button 
            onClick={() => setActiveTab("competitors")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "competitors" 
                ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <Users className="w-4 h-4" />
            Competitors
          </button>

          <button 
            onClick={() => setActiveTab("report")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "report" 
                ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <Mail className="w-4 h-4" />
            Weekly Reports
          </button>

          <button 
            onClick={() => setActiveTab("cms")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
              activeTab === "cms" 
                ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm" 
                : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            }`}
          >
            <Settings className="w-4 h-4" />
            CMS Publishing settings
          </button>
        </nav>

        {/* Pricing / Status Upgrade */}
        {currentUser && !currentUser.subscriptionActive && (
          <div className="p-4 mx-4 mb-4 rounded-2xl border border-violet-105 bg-violet-50/50 shadow-sm">
            <div className="flex items-center gap-2 text-violet-600">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Antigravity Premium</span>
            </div>
            <p className="text-[10px] leading-relaxed mt-1.5 text-zinc-500">
              Unlock CMS REST integrations and run daily site optimizations.
            </p>
            <button 
              onClick={handleSubscribe}
              disabled={isSubscribing}
              className="w-full py-2.5 mt-3 text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl text-[11px] font-bold border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center gap-1"
            >
              {isSubscribing ? (
                <>
                  <Activity className="w-3 h-3 animate-spin" /> Upgrading...
                </>
              ) : (
                <>
                  Hire AI Employee ($19/mo) <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Status Indicator */}
        <div className="p-4 border-t border-zinc-200">
          <div className="p-3 border rounded-xl flex items-center gap-2 transition-all bg-zinc-50 border-zinc-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-glow" />
            <span className="text-[11px] font-mono text-zinc-500">SQLite Local DB Connected</span>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-8 sticky top-0 z-10 border-zinc-200 bg-white/75 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm hidden md:inline text-zinc-400">Workspace</span>
            <ChevronRight className="w-4 h-4 hidden md:inline text-zinc-300" />
            <span className="text-sm font-semibold capitalize text-zinc-800">
              {activeTab === "cms" ? "CMS Settings" : activeTab === "report" ? "Weekly Email Reports" : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentSite?.wpUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" /> CMS Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-zinc-100 text-zinc-500 border-zinc-200">
                <XCircle className="w-3.5 h-3.5" /> CMS Disconnected
              </span>
            )}
          </div>
        </header>

        {/* Tab Content Box */}
        <div className="flex-1 p-8 max-w-6xl w-full mx-auto space-y-8 animate-fade-in">
          
          {billingMessage && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50 text-sm text-emerald-800 flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                {billingMessage}
              </span>
              <button onClick={() => setBillingMessage("")} className="text-zinc-450 hover:text-zinc-805 text-xs font-semibold p-1">✕</button>
            </div>
          )}

          {/* ========================================================
              TAB 1: DASHBOARD OVERVIEW & DAILY AGENT ACTIVITIES 
             ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-slide-up">
              
              {/* Domain Quick Overview Card */}
              <div className="p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all border-zinc-200 bg-white shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-zinc-900">
                    <Sparkles className="w-6 h-6 text-violet-500" /> Antigravity AI Employee Workspace
                  </h2>
                  <p className="text-xs mt-1 leading-relaxed text-zinc-600">
                    Connecting: <span className="text-violet-605 font-mono font-bold">{currentSite?.url || "No website connected yet"}</span>. 
                    Running autonomous digital growth routines daily.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={() => setActiveTab("crawler")}
                    className="px-5 py-2.5 rounded-xl bg-violet-655 hover:bg-violet-550 text-white font-bold text-xs tracking-wider uppercase transition-all duration-200 border-2 border-zinc-955 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center gap-2 shrink-0"
                  >
                    Run Crawler Audit <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status Score Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-5 rounded-2xl border transition-all flex flex-col border-zinc-200 bg-white shadow-sm">
                  <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-550">SEO Health Index</span>
                  <span className="text-4xl font-extrabold text-violet-600 mt-2 font-mono">
                    {currentAudit?.scoreSeo ? `${currentAudit.scoreSeo}%` : "--"}
                  </span>
                  <p className="text-[10px] text-zinc-555 mt-auto pt-4 leading-relaxed">Percentage of standard header guidelines passed</p>
                </div>

                <div className="p-5 rounded-2xl border transition-all flex flex-col border-zinc-200 bg-white shadow-sm">
                  <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-550">Performance Index</span>
                  <span className="text-4xl font-extrabold text-emerald-600 mt-2 font-mono">
                    {currentAudit?.scorePerformance ? `${currentAudit.scorePerformance}` : "--"}
                  </span>
                  <p className="text-[10px] text-zinc-555 mt-auto pt-4">Tested page load parameters</p>
                </div>

                <div className="p-5 rounded-2xl border transition-all flex flex-col border-zinc-200 bg-white shadow-sm">
                  <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-550">Tracked Keywords</span>
                  <span className="text-4xl font-extrabold text-indigo-650 mt-2 font-mono">{targetKeywords.length}</span>
                  <p className="text-[10px] text-zinc-555 mt-auto pt-4">Target terms monitored over time</p>
                </div>

                <div className="p-5 rounded-2xl border transition-all flex flex-col border-zinc-200 bg-white shadow-sm">
                  <span className="text-[10px] uppercase tracking-wider font-bold block text-zinc-555">Direct Competitors</span>
                  <span className="text-4xl font-extrabold text-amber-600 mt-2 font-mono">{competitors.length}</span>
                  <p className="text-[10px] text-zinc-555 mt-auto pt-4">Direct competitor domains mapped</p>
                </div>
              </div>

              {/* Daily AI Agent Scheduler Timeline */}
              <section className="p-6 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-150">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900">
                      <Terminal className="w-5 h-5 text-violet-650" /> Daily Growth Scheduler
                    </h3>
                    <p className="text-xs mt-0.5 text-zinc-500">Every day, the autonomous agent checks and executes key optimization procedures.</p>
                  </div>
                  <div>
                    <button 
                      onClick={handleRunAgentCycle}
                      disabled={agentRunning}
                      className="px-4 py-2 border-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 bg-white border-zinc-955 text-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${agentRunning ? "animate-spin text-violet-500" : ""}`} />
                      {agentRunning ? "Agent Working..." : "Run Daily Cycle"}
                    </button>
                  </div>
                </div>

                {/* Simulation Logs Terminal */}
                {agentLogs.length > 0 && (
                  <div className="mt-6 p-4 rounded-xl border text-xs font-mono space-y-2 max-h-60 overflow-y-auto transition-all border-zinc-200 bg-zinc-900 text-zinc-200 shadow-inner">
                    <span className="text-[10px] text-violet-400 font-bold uppercase block pb-1 border-b border-zinc-800 tracking-wider">Growth Agent Console Logs</span>
                    {agentLogs.map((log, index) => (
                      <div key={index} className="flex gap-2 items-start animate-fade-in">
                        <span className="text-violet-400 shrink-0">&gt;</span>
                        <p className="leading-relaxed">{log}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timeline display */}
                <div className="mt-8 relative pl-6 border-l-2 space-y-6 border-zinc-200">
                  {dailyTasks.map((task) => (
                    <div key={task.id} className="relative group animate-fade-in">
                      {/* Timeline circle node */}
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all bg-white border-violet-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      </span>

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold transition-colors text-zinc-800 group-hover:text-violet-650">{task.text}</h4>
                          <span className="text-[10px] font-mono mt-1 block uppercase tracking-wider text-zinc-450">{task.target}</span>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-mono">
                            <Check className="w-3 h-3" /> Completed
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono block mt-1">{task.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}

          {/* ========================================================
              TAB 2: SITE CRAWLER (CORE) 
             ======================================================== */}
          {activeTab === "crawler" && (
            <div className="space-y-8 animate-slide-up">
              
              {/* Domain Input Form */}
              <section className="p-6 rounded-2xl border shadow-lg transition-all border-zinc-200 bg-white">
                <h2 className="text-xl font-bold mb-2 text-zinc-905">Configure URL Diagnostics</h2>
                <p className="text-sm mb-6 text-zinc-650">Enter your domain URL to start crawling subpages, searching SEO tag omissions, alt validation, broken link status and duplicate content checks.</p>

                <form onSubmit={handleRunAudit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-450" />
                    <input 
                      type="text" 
                      placeholder="e.g. https://yourbusiness.com" 
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      disabled={isCrawling}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border text-sm transition-all focus:outline-none focus:border-violet-500 border-zinc-250 bg-white text-zinc-800 placeholder-zinc-400"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isCrawling || !siteUrl}
                    className="px-6 py-3.5 rounded-xl bg-violet-650 hover:bg-violet-550 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 border-2 border-zinc-955 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:border-zinc-300 disabled:cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center gap-2 shrink-0"
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
                  <div className="mt-6 p-4 rounded-xl border flex flex-col gap-3 animate-fade-in border-violet-105 bg-violet-50/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                      <span className="text-violet-600 font-semibold flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Autonomous growth agent crawling pages...
                      </span>
                      <span className="text-zinc-505 font-mono">{crawlStep}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-zinc-200">
                      <div className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full w-[75%] transition-all duration-1000" />
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl border border-red-500/20 bg-red-950/10 text-sm text-red-650 flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    {errorMessage}
                  </div>
                )}
              </section>

              {/* Crawler Audit Output */}
              {currentAudit ? (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Detailed crawlers summary meters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-5 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                      <span className="text-xs font-medium text-zinc-555">SEO Quality Score</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-3xl font-bold font-mono ${currentAudit.scoreSeo >= 80 ? "text-emerald-600" : currentAudit.scoreSeo >= 60 ? "text-amber-650" : "text-red-650"}`}>
                          {currentAudit.scoreSeo}%
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">score</span>
                      </div>
                      <span className="text-[10px] text-zinc-555 block mt-2">Core tags & markup validity</span>
                    </div>

                    <div className="p-5 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                      <span className="text-xs font-medium text-zinc-555">Page Load Speed</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-3xl font-bold font-mono ${currentAudit.scorePerformance >= 90 ? "text-emerald-505" : currentAudit.scorePerformance >= 70 ? "text-amber-650" : "text-red-650"}`}>
                          {currentAudit.scorePerformance}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">/ 100</span>
                      </div>
                      <span className="text-[10px] text-zinc-555 block mt-2">Tested PageSpeed assets loaded</span>
                    </div>

                    <div className="p-5 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                      <span className="text-xs font-medium text-zinc-555">Outbound Broken Links</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-3xl font-bold font-mono ${metaFixes.filter((i: any) => i.type === "broken_link").length > 0 ? "text-red-650" : "text-emerald-600"}`}>
                          {metaFixes.filter((i: any) => i.type === "broken_link").length}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">broken</span>
                      </div>
                      <span className="text-[10px] text-zinc-555 block mt-2">Outward links returning 404s</span>
                    </div>

                    <div className="p-5 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                      <span className="text-xs font-medium text-zinc-555">Image Alt Attribute Gaps</span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className={`text-3xl font-bold font-mono ${metaFixes.filter((i: any) => i.type === "missing_alt").length > 0 ? "text-amber-655" : "text-emerald-600"}`}>
                          {metaFixes.filter((i: any) => i.type === "missing_alt").length}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">images</span>
                      </div>
                      <span className="text-[10px] text-zinc-555 block mt-2">Graphic elements lacking alt tags</span>
                    </div>
                  </div>

                  {/* Priority Fixes List */}
                  <div className="p-6 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-zinc-150">
                      <div>
                        <h3 className="text-base font-bold text-zinc-900">Crawler Audit Tag Logs</h3>
                        <p className="text-xs mt-0.5 text-zinc-500">Prioritized markup and link validation findings discovered on {currentSite?.url}.</p>
                      </div>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-50 text-violet-650 border-violet-200">
                        {metaFixes.length} Issues Flagged
                      </span>
                    </div>

                    <div className="space-y-4 mt-6">
                      {metaFixes.map((item: any) => {
                        const parsedVal = item.currentValue ? JSON.parse(item.currentValue) : null;

                        return (
                          <div key={item.id} className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all border-zinc-200 bg-zinc-50/40">
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[9px] uppercase font-bold tracking-widest font-mono px-2 py-0.5 rounded border text-violet-655 bg-violet-50 border-violet-200">
                                  {item.type.replace("_", " ")}
                                </span>
                                <span className="text-xs truncate max-w-sm font-mono text-zinc-555">{item.targetUrl}</span>
                              </div>
                              <p className="text-xs leading-relaxed mt-2 text-zinc-650">
                                <strong className="text-zinc-800">Scan details:</strong>{" "}
                                {item.type === "meta_title" && (parsedVal?.title ? `Found non-optimal length: "${parsedVal.title}" (${parsedVal.length} chars)` : "No title tag found.")}
                                {item.type === "meta_description" && (parsedVal?.description ? `Found non-optimal length: "${parsedVal.description}" (${parsedVal.length} chars)` : "No meta description found.")}
                                {item.type === "schema_markup" && "Missing LocalBusiness or Article Structured markup JSON-LD code."}
                                {item.type === "missing_alt" && `Identified ${parsedVal?.count || 1} image elements lacking alternative description attributes.`}
                                {item.type === "broken_link" && `Broken link anchor pointing to dead endpoint: "${parsedVal?.brokenUrl}" (Status code: ${parsedVal?.statusCode}).`}
                              </p>
                            </div>

                            <button 
                              onClick={() => {
                                setActiveTab("recommendations");
                              }}
                              className="px-4 py-2 border-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 bg-white border-zinc-955 text-zinc-955 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                            >
                              Inspect AI Fix <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-16 rounded-2xl border border-dashed text-center space-y-4 transition-colors border-zinc-250 bg-white">
                  <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto bg-zinc-100 border-zinc-200 text-zinc-550">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-705">No audits run yet</h3>
                    <p className="text-zinc-505 text-xs mt-1">Configure your domain and start crawling to trigger target SEO audit data.</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================
              TAB 3: AI RECOMMENDATIONS 
             ======================================================== */}
          {activeTab === "recommendations" && (
            <div className="space-y-8 animate-slide-up">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-150">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">AI Recommendations & Action Log</h2>
                  <p className="text-sm mt-1 text-zinc-550">
                    Explain issues, check their structural importance, view potential impact, and deploy one-click fixes live to CMS.
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full border font-mono bg-violet-55 text-violet-650 border-violet-200">
                  {metaFixes.length} Actions Available
                </span>
              </div>

              {metaFixes.length === 0 ? (
                <div className="p-16 rounded-2xl border text-center text-zinc-505 border-zinc-200 bg-white">
                  No SEO tag recommendation log found. Complete a site crawl diagnostics run first!
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {metaFixes.map((item: any) => {
                    const isApproved = item.status === "approved";
                    const isRejected = item.status === "rejected";
                    const isApplied = item.status === "applied";
                    const currentValParsed = item.currentValue ? JSON.parse(item.currentValue) : null;
                    const details = getRecommendationDetails(item.type);

                    return (
                      <div key={item.id} className="p-6 rounded-2xl border transition-all duration-200 space-y-6 relative border-zinc-200 bg-white shadow-sm hover:shadow-md">
                        
                        {/* Header info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[9px] uppercase font-bold tracking-widest font-mono px-2.5 py-1 rounded border text-violet-650 bg-violet-50 border-violet-200">
                              {item.type.replace("_", " ")}
                            </span>
                            <span className="text-xs font-mono truncate max-w-xs text-zinc-550">{item.targetUrl}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isApplied && (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Pushed Draft
                              </span>
                            )}
                            {isApproved && (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Approved
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-xs font-bold text-zinc-500 bg-zinc-150 px-3 py-1 rounded-full border border-zinc-250 flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5" /> Rejected
                              </span>
                            )}
                            {item.status === "pending" && (
                              <span className="text-xs text-amber-600 font-semibold animate-pulse flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" /> Pending Review
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Explained Section (Explain the issue + Explain why it matters + Show impact) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl text-xs transition-all bg-zinc-50 border-zinc-200 shadow-inner">
                          <div className="space-y-1">
                            <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-455">Explain the Issue</span>
                            <p className="leading-relaxed text-zinc-650">{details.explanation}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-455">Why it Matters</span>
                            <p className="leading-relaxed text-zinc-650">{details.whyItMatters}</p>
                          </div>

                          <div className="space-y-2">
                            <span className="font-bold block uppercase tracking-wider text-[10px] text-zinc-455">SEO Impact Potential</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                details.impact === "High" 
                                  ? "bg-red-500/10 text-red-650 border border-red-500/20" 
                                  : "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20"
                              }`}>
                                {details.impact} Impact
                              </span>
                              <span className="font-mono text-zinc-600">{details.impactScore}/100</span>
                            </div>
                            {/* Strength meter bar */}
                            <div className="w-full h-1.5 rounded-full overflow-hidden bg-zinc-200">
                              <div 
                                className="h-full rounded-full bg-amber-500" 
                                style={{ width: `${details.impactScore}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Tag Modification Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl text-xs transition-all border bg-red-50/40 border-red-105">
                            <span className="text-[10px] text-red-550 font-bold block uppercase tracking-wide mb-1">Current Value</span>
                            <p className="text-zinc-505 line-through leading-relaxed">
                              {currentValParsed?.title || currentValParsed?.description || currentValParsed?.count || (item.type === "schema_markup" ? "Missing schema.org markup block" : "Empty attribute")}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl relative group text-xs border transition-all bg-violet-50/40 border-violet-200/50">
                            <span className="text-[10px] text-violet-605 font-bold block uppercase tracking-wide mb-1">AI Recommendation Fix</span>
                            <p className="font-medium leading-relaxed pr-8 text-zinc-800">
                              {item.suggestedValue}
                            </p>
                            <button 
                              onClick={() => handleCopyText(item.suggestedValue, item.id)}
                              className="absolute right-2 top-2 p-1.5 rounded-lg border transition-all opacity-0 group-hover:opacity-100 bg-white border-zinc-200 text-zinc-500 hover:text-zinc-805"
                              title="Copy code suggestion"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* One-Click Fix Action Bar */}
                        {item.status === "pending" && (
                          <div className="flex gap-2 justify-end pt-2 border-t border-zinc-150">
                            <button 
                              onClick={() => handleActionItem(item.id, "reject")}
                              className="px-4 py-2 rounded-xl border-2 transition-colors text-xs font-bold bg-white border-zinc-955 text-zinc-955 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                            >
                              Reject Fix
                            </button>
                            
                            <button 
                              onClick={() => handleActionItem(item.id, "approve")}
                              className="px-4 py-2 rounded-xl bg-violet-650 hover:bg-violet-550 text-white transition-all text-xs font-bold uppercase tracking-wider border-2 border-zinc-955 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center gap-1.5"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              One-Click Fix
                            </button>
                          </div>
                        )}

                        {/* If approved/applied, show integration copying option */}
                        {(isApproved || isApplied) && (
                          <div className="p-3 rounded-xl border flex items-center justify-between text-xs transition-all bg-zinc-50 border-zinc-200">
                            <code className="text-xs font-mono truncate max-w-lg text-zinc-600">
                              {item.type === "schema_markup" ? item.suggestedValue.substring(0, 100) + "..." : item.suggestedValue}
                            </code>
                            <button 
                              onClick={() => handleCopyText(item.suggestedValue, item.id + "-approved")}
                              className="px-3 py-1.5 border-2 rounded-lg text-xs flex items-center gap-1 font-bold transition-colors bg-white border-zinc-955 text-zinc-955 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                            >
                              {copiedId === item.id + "-approved" ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied Code
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" /> Copy Snippet
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
          )}

          {/* ========================================================
              TAB 4: AI CONTENT GENERATOR WORKSPACE 
             ======================================================== */}
          {activeTab === "content" && (
            <div className="space-y-8 animate-slide-up">
              
              <div className="border-b pb-4 border-zinc-150">
                <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
                  <FileText className="w-5 h-5 text-violet-500" /> AI Content Generator & Outline workspace
                </h2>
                <p className="text-sm mt-1 text-zinc-550">
                  Discover keyword search gaps, draft outline items, generate article text, meta tags, schemas and FAQs.
                </p>
              </div>

              {/* Keyword research trigger */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Outlines & Control panel */}
                <div className="p-6 rounded-2xl border transition-all space-y-6 border-zinc-200 bg-white shadow-sm">
                  <span className="text-[10px] uppercase font-bold tracking-wider block text-violet-650">Content Strategy Planner</span>
                  
                  <div className="space-y-2">
                    <label className="text-xs block font-semibold text-zinc-555">Enter Target Keyword / Topic</label>
                    <input 
                      type="text" 
                      placeholder="e.g. local pipe leak service"
                      value={contentKeyword}
                      onChange={(e) => setContentKeyword(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:border-violet-500 bg-white border-zinc-250 text-zinc-805 placeholder-zinc-450"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button 
                      onClick={handleGenerateOutline}
                      disabled={generatingOutline || !contentKeyword}
                      className="w-full py-2.5 border rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 bg-zinc-50 border-zinc-250 text-zinc-700 hover:bg-zinc-100"
                    >
                      {generatingOutline ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-555" />}
                      Compile Blog Outline
                    </button>

                    <button 
                      onClick={handleGenerateArticle}
                      disabled={generatingArticle || !contentKeyword}
                      className="w-full py-2.5 bg-violet-655 hover:bg-violet-505 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/10"
                    >
                      {generatingArticle ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Generate Full Article
                    </button>
                  </div>

                  {/* Outline feedback */}
                  {contentOutline && (
                    <div className="p-4 rounded-xl border text-xs animate-fade-in space-y-3 border-zinc-200 bg-zinc-50/50">
                      <span className="text-[9px] font-mono text-zinc-550 font-bold uppercase tracking-wider block border-b border-zinc-200 pb-1">AI Outlines Blueprint</span>
                      <h4 className="font-bold text-xs text-zinc-900">{contentOutline.title}</h4>
                      <ul className="space-y-1.5 list-disc pl-4 text-zinc-650">
                        {contentOutline.sections.map((section: string, idx: number) => (
                          <li key={idx}>{section}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Article and generated items workspace */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {contentArticle ? (
                    <div className="p-6 rounded-2xl border space-y-6 animate-fade-in border-zinc-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between pb-4 border-b border-zinc-150">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono">Draft path: /{contentArticle.slug}</span>
                          <h3 className="text-base font-bold mt-0.5 text-zinc-900">{contentArticle.title}</h3>
                        </div>
                        <button 
                          onClick={() => handleCopyText(contentArticle.content, "gen-article")}
                          className="px-3 py-1.5 border rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors bg-white border-zinc-250 hover:border-zinc-350 text-zinc-705"
                        >
                          {copiedId === "gen-article" ? <Check className="w-3 h-3 text-emerald-650" /> : <Copy className="w-3 h-3" />}
                          Copy HTML content
                        </button>
                      </div>

                      {/* Content compiler */}
                      <div className="text-xs leading-relaxed space-y-4 max-h-80 overflow-y-auto border p-4 rounded-xl font-sans border-zinc-200 bg-zinc-50/55 text-zinc-755">
                        <div dangerouslySetInnerHTML={{ __html: contentArticle.content }} />
                      </div>

                      {/* Meta information tags */}
                      {contentMeta && (
                        <div className="p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-zinc-250 bg-zinc-50/20">
                          <div className="space-y-1">
                            <span className="text-violet-500 font-mono text-[9px] uppercase tracking-wider block">Generated Meta Title</span>
                            <p className="font-semibold text-zinc-800">{contentMeta.title}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-violet-500 font-mono text-[9px] uppercase tracking-wider block">Generated Meta Description</span>
                            <p className="text-zinc-600">{contentMeta.description}</p>
                          </div>
                        </div>
                      )}

                      {/* Content Schema */}
                      {contentSchema && (
                        <div className="p-4 rounded-xl border text-xs space-y-2 border-zinc-200 bg-zinc-50/40">
                          <div className="flex items-center justify-between border-b border-zinc-200 pb-1">
                            <span className="text-zinc-550 font-mono text-[9px] uppercase tracking-wider">Generated Article JSON-LD Schema</span>
                            <button 
                              onClick={() => handleCopyText(contentSchema, "gen-schema")}
                              className="text-zinc-505 hover:text-zinc-705 font-mono text-[10px]"
                            >
                              Copy Schema
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono leading-relaxed overflow-x-auto p-2 rounded-lg bg-zinc-900 text-zinc-350 shadow-inner">{contentSchema}</pre>
                        </div>
                      )}

                      {/* FAQs Generator */}
                      {contentFaqs.length > 0 && (
                        <div className="p-4 rounded-xl border text-xs space-y-3 border-zinc-200 bg-zinc-50/30">
                          <span className="text-zinc-505 font-mono text-[9px] uppercase tracking-wider block border-b border-zinc-200 pb-1">Generated FAQ Blocks</span>
                          {contentFaqs.map((faq, idx) => (
                            <div key={idx} className="space-y-1">
                              <h5 className="font-bold text-xs text-zinc-900">Q: {faq.q}</h5>
                              <p className="text-zinc-650">A: {faq.a}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="p-16 rounded-2xl border border-dashed text-center space-y-4 border-zinc-250 bg-white">
                      <div className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto bg-zinc-150 border-zinc-200 text-zinc-555">
                        <FileText className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-705">Enter a target search term</h3>
                        <p className="text-zinc-505 text-xs mt-1">Input keywords and click "Generate" to build articles, FAQ items and JSON schemas.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Show blog posts history if audit items contain them */}
              {contentDrafts.length > 0 && (
                <div className="p-6 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                  <div>
                    <h3 className="text-base font-bold text-zinc-905">Crawled Blog Drafts Database</h3>
                    <p className="text-xs mt-0.5 text-zinc-505">Approved blog drafts matching content gaps on crawl domain.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {contentDrafts.map((item: any) => {
                      const post = JSON.parse(item.suggestedValue || "{}");
                      const isApplied = item.status === "applied";
                      const isApproved = item.status === "approved";

                      return (
                        <div key={item.id} className="p-4 rounded-xl border space-y-3 transition-all border-zinc-200 bg-zinc-50/20">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-555">/{post.slug || "blog"}</span>
                            {isApplied ? (
                              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Pushed to CMS</span>
                            ) : isApproved ? (
                              <span className="text-[9px] uppercase tracking-wider font-bold text-violet-650 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">Approved</span>
                            ) : (
                              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">Ready for review</span>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-bold text-xs leading-snug text-zinc-800">{post.title}</h4>
                            <p className="text-[11px] leading-relaxed line-clamp-3 mt-1 text-zinc-650" dangerouslySetInnerHTML={{ __html: post.content?.substring(0, 150) + "..." }} />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button 
                              onClick={() => setPreviewBlogPost(post)}
                              className="px-3 py-1.5 border text-[11px] rounded-lg font-semibold transition-colors flex-1 bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-50"
                            >
                              Preview Content
                            </button>
                            {item.status === "pending" && (
                              <button 
                                onClick={() => handleActionItem(item.id, "approve")}
                                className="px-3 py-1.5 bg-violet-650 hover:bg-violet-500 text-white text-[11px] rounded-lg font-bold transition-all"
                              >
                                Approve Fix
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================
              TAB 5: KEYWORD TRACKER 
             ======================================================== */}
          {activeTab === "tracker" && (
            <div className="space-y-8 animate-slide-up">
              
              <div className="border-b pb-4 border-zinc-150">
                <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-905">
                  <TrendingUp className="w-5 h-5 text-violet-505" /> Target Keyword Tracker
                </h2>
                <p className="text-sm mt-1 text-zinc-555">
                  Track target search keywords, placement ranks, clicks volumes, and check historical ranking trends.
                </p>
              </div>

              {/* Add Keyword Form */}
              <div className="p-5 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                <h3 className="text-sm font-bold mb-4 text-zinc-905">Add Target Keyword to Track</h3>
                
                <form onSubmit={handleAddKeyword} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="e.g. local heating installations cost"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-lg border focus:outline-none focus:border-violet-555 bg-white border-zinc-250 text-zinc-800"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <input 
                      type="number" 
                      placeholder="Search Volume"
                      value={newKeywordVolume}
                      onChange={(e) => setNewKeywordVolume(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-lg border focus:outline-none focus:border-violet-555 bg-white border-zinc-250 text-zinc-800"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 bg-zinc-50 border-zinc-250 text-zinc-705 hover:bg-zinc-105"
                  >
                    <Plus className="w-4 h-4" /> Add Keyword
                  </button>
                </form>
              </div>

              {/* Keywords Table list */}
              <div className="p-6 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-wider block mb-4 text-violet-650">Keywords Index Report</span>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] border-zinc-150">
                        <th className="pb-3 pr-4">Keyword query term</th>
                        <th className="pb-3 pr-4 font-mono">Monthly Search Volume</th>
                        <th className="pb-3 pr-4 font-mono">Google Rank Pos</th>
                        <th className="pb-3 pr-4 font-mono">Previous Pos</th>
                        <th className="pb-3 pr-4">Trend Direction</th>
                        <th className="pb-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {targetKeywords.map((kw) => (
                        <tr key={kw.id} className="text-zinc-600 group hover:bg-zinc-50">
                          <td className="py-4 pr-4 font-semibold text-zinc-905">{kw.term}</td>
                          <td className="py-4 pr-4 font-mono">{kw.volume.toLocaleString()} searches</td>
                          <td className="py-4 pr-4 font-mono font-bold text-zinc-905">#{kw.rank}</td>
                          <td className="py-4 pr-4 font-mono text-zinc-500">#{kw.previousRank}</td>
                          <td className="py-4 pr-4">
                            {kw.trend === "up" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold font-mono">
                                Rank ↑
                              </span>
                            )}
                            {kw.trend === "down" && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-bold font-mono">
                                Rank ↓
                              </span>
                            )}
                            {kw.trend === "neutral" && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-semibold font-mono bg-zinc-100 text-zinc-500 border-zinc-200">
                                Stable =
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleDeleteKeyword(kw.id)}
                              className="text-zinc-450 hover:text-red-655 p-1 hover:bg-red-500/10 rounded transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 6: COMPETITOR ANALYSIS 
             ======================================================== */}
          {activeTab === "competitors" && (
            <div className="space-y-8 animate-slide-up">
              
              <div className="border-b pb-4 border-zinc-150">
                <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-905">
                  <Users className="w-5 h-5 text-violet-500" /> Competitor Domain Analysis
                </h2>
                <p className="text-sm mt-1 text-zinc-555">
                  Compare keyword overlaps, content gaps, backlink structures, and monitor competitor top pages.
                </p>
              </div>

              {/* Add Competitor */}
              <div className="p-5 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                <h3 className="text-sm font-bold mb-4 text-zinc-905">Add Competitor Domain to Compare</h3>
                <form onSubmit={handleAddCompetitor} className="flex gap-3">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="e.g. competitorurl.com"
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-lg border focus:outline-none focus:border-violet-500 bg-white border-zinc-250 text-zinc-800"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 border rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shrink-0 bg-zinc-50 border-zinc-250 text-zinc-705 hover:bg-zinc-100"
                  >
                    <Plus className="w-4 h-4" /> Map Competitor
                  </button>
                </form>
              </div>

              {/* Comparison grid layout */}
              <div className="p-6 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-wider block mb-6 text-violet-650">Competitor Audit Grid</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Our domain stats */}
                  <div className="p-5 rounded-xl border flex flex-col relative overflow-hidden transition-all border-violet-100 bg-violet-50/40 shadow-sm">
                    <div className="absolute top-0 right-0 bg-violet-650 text-white text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-bl">
                      Active Website
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Our website</span>
                    <h4 className="text-sm font-bold mt-1 truncate text-zinc-905">{currentSite?.url?.replace(/^https?:\/\//i, "") || "our-site.com"}</h4>
                    
                    <div className="space-y-3 mt-6 text-xs divide-y divide-zinc-150">
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-505 font-medium">Ranked Keywords</span>
                        <strong className="font-mono text-zinc-850">{targetKeywords.length * 12} terms</strong>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-505 font-medium">Content Gaps Flagged</span>
                        <strong className="text-violet-605 font-mono">0 pending</strong>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-505 font-medium">Backlink profiles</span>
                        <strong className="font-mono text-zinc-850">1,820 anchors</strong>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-505 font-medium">Top Landing Page</span>
                        <span className="text-zinc-450 font-mono text-[10px] truncate max-w-[120px]">/index</span>
                      </div>
                    </div>
                  </div>

                  {/* Competitors listing */}
                  {competitors.map((comp) => (
                    <div key={comp.id} className="p-5 rounded-xl border flex flex-col relative group transition-all border-zinc-200 bg-white shadow-sm">
                      <button 
                        onClick={() => handleDeleteCompetitor(comp.id)}
                        className="absolute top-2 right-2 text-zinc-455 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>

                      <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Mapped Competitor</span>
                      <h4 className="text-sm font-bold mt-1 truncate text-zinc-900">{comp.domain}</h4>

                      <div className="space-y-3 mt-6 text-xs divide-y divide-zinc-150">
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-505 font-medium">Overlapping Keywords</span>
                          <strong className="font-mono text-zinc-705">{comp.overlappingKeywords} terms</strong>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-505 font-medium">Content Gap Gaps</span>
                          <strong className="text-amber-600 font-mono">{comp.contentGaps} articles</strong>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-505 font-medium">Backlinks count</span>
                          <strong className="font-mono text-zinc-705">{comp.backlinks.toLocaleString()} links</strong>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-zinc-505 font-medium">Top Landing Page</span>
                          <span className="text-zinc-450 font-mono text-[10px] truncate max-w-[120px]">{comp.topPage}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 7: WEEKLY REPORTS 
             ======================================================== */}
          {activeTab === "report" && (
            <div className="space-y-8 animate-slide-up">
              
              <div className="pb-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-zinc-150">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-900">
                    <Mail className="w-5 h-5 text-violet-500" /> Weekly Email Report Preview
                  </h2>
                  <p className="text-sm mt-1 text-zinc-555">
                    Every Friday, Antigravity compiles a full organic digital growth summary and sends it directly to your email inbox.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={handleSendWeeklyReport}
                    disabled={weeklyEmailStatus === "sending"}
                    className="px-5 py-2.5 rounded-xl bg-violet-650 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-205 shadow-md shadow-violet-600/10 flex items-center gap-2"
                  >
                    {weeklyEmailStatus === "sending" ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" /> Dispatching...
                      </>
                    ) : weeklyEmailStatus === "sent" ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-650" /> Test Report Sent!
                      </>
                    ) : (
                      <>
                        Send Test Report <Mail className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Weekly Email Report layout Mock */}
              <div className="max-w-2xl mx-auto rounded-3xl border p-8 space-y-6 shadow-2xl relative overflow-hidden transition-all border-zinc-200 bg-white">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-500" />
                
                {/* Header info */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-150">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sm text-zinc-905">Antigravity Growth summary</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-505">Report Cycle: July 2026 / Week 3</span>
                </div>

                {/* What Changed */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-zinc-800">
                    <TrendingUp className="w-4 h-4 text-emerald-600" /> 1. Organic Search Changes
                  </h4>
                  <div className="grid grid-cols-3 gap-4 p-3 border rounded-xl transition-colors bg-zinc-50 border-zinc-200">
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Health Score</span>
                      <strong className="text-emerald-655 font-mono text-sm mt-1 block">94% (+18%)</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Search Impressions</span>
                      <strong className="font-mono text-sm mt-1 block text-zinc-900">4,280 (+12%)</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Organic Clicks</span>
                      <strong className="font-mono text-sm mt-1 block text-zinc-900">340 clicks</strong>
                    </div>
                  </div>
                </div>

                {/* What AI Completed */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-zinc-805">
                    <CheckCircle className="w-4 h-4 text-violet-500" /> 2. Core Actions Executed by Antigravity
                  </h4>
                  <div className="p-4 border rounded-xl space-y-2 transition-colors bg-zinc-50 border-zinc-200 text-zinc-650">
                    <p className="flex justify-between">
                      <span>✓ Completed SEO Meta-Tag fixes generated for landing page</span>
                      <span className="font-mono text-zinc-550 font-bold">3 corrections applied</span>
                    </p>
                    <p className="flex justify-between">
                      <span>✓ Compilations & image size compressions executed</span>
                      <span className="font-mono text-zinc-550 font-bold">20 assets optimized</span>
                    </p>
                    <p className="flex justify-between">
                      <span>✓ Structured LocalBusiness Schema code block injected</span>
                      <span className="font-mono text-zinc-550 font-bold">1 JSON-LD schema added</span>
                    </p>
                    <p className="flex justify-between">
                      <span>✓ AI blog outline drafts drafted & pushed as CMS draft drafts</span>
                      <span className="font-mono text-zinc-550 font-bold">1 post published</span>
                    </p>
                  </div>
                </div>

                {/* Rankings and traffic summary */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-zinc-800">
                    <Users className="w-4 h-4 text-indigo-500" /> 3. Target Rankings & Keyword Visibility
                  </h4>
                  <div className="p-4 border rounded-xl space-y-1.5 font-mono text-[11px] transition-colors bg-zinc-50 border-zinc-200 text-zinc-700 shadow-inner">
                    <div className="flex justify-between">
                      <span className="font-sans text-zinc-500">"local contractor service"</span>
                      <span className="text-emerald-600 font-bold">#4 (was #8) ↑</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-zinc-505">"certified plumbing repairs"</span>
                      <span className="text-zinc-505 font-bold">#2 (stable) =</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-zinc-505">"emergency leaks fix"</span>
                      <span className="text-emerald-600 font-bold">#12 (was #18) ↑</span>
                    </div>
                  </div>
                </div>

                {/* Next Recommendations */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-xs flex items-center gap-1.5 text-zinc-850">
                    <Zap className="w-4 h-4 text-amber-505 animate-pulse" /> 4. AI Strategic Recommendations for Next Week
                  </h4>
                  <div className="p-4 border rounded-xl leading-relaxed space-y-2 transition-colors bg-zinc-50 border-zinc-200 text-zinc-600">
                    <p>• <strong>Expand Local Search Strategy:</strong> Write 1 targeted article answering 'plumbing emergency cost guidelines' to capture upcoming seasonal queries.</p>
                    <p>• <strong>Optimize Secondary Pages:</strong> 2 subpages are missing meta description lengths. Re-crawl and approve fixes to lock in improvements.</p>
                    <p>• <strong>Review Competitor gap:</strong> A competitor recently gained backlinks on domain apex-pros. Run gap analyzer to inspect linking references.</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              TAB 8: CMS PUBLISHING SETTINGS (WordPress REST API Compatible) 
             ======================================================== */}
          {activeTab === "cms" && (
            <section className="p-8 rounded-2xl border transition-all border-zinc-200 bg-white shadow-sm">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-905">
                  <Settings className="w-5 h-5 text-violet-650" /> CMS Publishing Connection
                </h2>
                <p className="text-sm mt-2 text-zinc-555">
                  Establish connection parameters to push approved blog outlines, structured schemas, meta tags and optimizations live to your website CMS.
                </p>
              </div>

              {/* Secure Instructions banner */}
              <div className="p-4 rounded-xl border text-xs leading-relaxed flex gap-3 transition-colors border-yellow-250 bg-yellow-50 text-yellow-805">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-2 text-zinc-700">
                  <p className="font-bold text-yellow-900">Security Best Practice: Least Privilege Credentials</p>
                  <p>To safely connect, do NOT use root site administrator passwords. Setup a dedicated author account:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Open your website's CMS backend panel.</li>
                    <li>Go to <strong>Users &gt; Add New</strong>. Create a restricted user named <code>antigravity-agent</code> with the role of <strong>Author</strong> or <strong>Editor</strong>.</li>
                    <li>Open that user profile page, navigate to the <strong>Application Passwords</strong> block at the bottom.</li>
                    <li>Create an application password key (e.g. "Antigravity Employee") and paste the generated 24-character token below.</li>
                  </ol>
                  <p className="text-[10px] text-zinc-505 mt-2">This isolates permissions. The AI agent can only modify tag drafts and submit posts for review, securing key systems.</p>
                </div>
              </div>

              <form onSubmit={handleConnectCMS} className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold block uppercase text-zinc-500">CMS Website Endpoint (REST API)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. https://yourbusiness.com"
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-violet-555 text-sm transition-colors border-zinc-250 bg-white text-zinc-800 placeholder-zinc-400"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold block uppercase text-zinc-555">CMS Author Username</label>
                    <input 
                      type="text" 
                      placeholder="e.g. antigravity-agent"
                      value={wpUsername}
                      onChange={(e) => setWpUsername(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-violet-555 text-sm transition-colors border-zinc-250 bg-white text-zinc-800 placeholder-zinc-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold block uppercase text-zinc-555">CMS Application Password</label>
                    <input 
                      type="password" 
                      placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                      value={wpAppPassword}
                      onChange={(e) => setWpAppPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-violet-555 text-sm transition-colors border-zinc-250 bg-white text-zinc-800 placeholder-zinc-400"
                    />
                  </div>
                </div>

                {wpMessage && (
                  <div className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
                    wpMessage.isError ? "border-red-500/20 bg-red-950/30 text-red-650" : "border-emerald-500/20 bg-emerald-950/30 text-emerald-450"
                  }`}>
                    {wpMessage.isError ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
                    {wpMessage.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isConnectingWp}
                  className="px-6 py-3 bg-violet-650 hover:bg-violet-505 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:shadow-lg disabled:bg-zinc-800 disabled:text-zinc-550 flex items-center gap-2 shadow-md shadow-violet-600/10"
                >
                  {isConnectingWp ? <Activity className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Verify & Connect CMS Publishing API
                </button>
              </form>
            </section>
          )}

        </div>
      </main>

      {/* Blog Post Preview Modal */}
      {previewBlogPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="border rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-colors bg-white border-zinc-200 text-zinc-700">
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between transition-colors border-zinc-150 bg-zinc-50/50">
              <div>
                <span className="text-[10px] text-violet-500 font-mono block mb-1">Gutenberg Block HTML Content Preview</span>
                <h3 className="font-bold text-lg leading-snug text-zinc-900">{previewBlogPost.title}</h3>
              </div>
              <button 
                onClick={() => setPreviewBlogPost(null)}
                className="p-1.5 rounded-lg border transition-all shadow-sm border-zinc-250 text-zinc-400 hover:text-zinc-800 bg-white"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 prose prose-invert max-w-none text-xs leading-relaxed">
              <div 
                className="space-y-4"
                dangerouslySetInnerHTML={{ __html: previewBlogPost.content }} 
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex justify-end gap-2 transition-colors border-zinc-150 bg-zinc-55/50">
              <button 
                onClick={() => handleCopyText(previewBlogPost.content, "modal-copy")}
                className="px-4 py-2 border rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm bg-white border-zinc-250 hover:border-zinc-350 text-zinc-700"
              >
                {copiedId === "modal-copy" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                Copy HTML Source
              </button>
              <button 
                onClick={() => setPreviewBlogPost(null)}
                className="px-4 py-2 bg-violet-650 hover:bg-violet-500 rounded-xl text-white text-xs font-bold uppercase transition-colors shadow-sm"
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
