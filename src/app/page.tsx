"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, CheckCircle2, Shield, Zap, Sparkles, Activity, FileText, 
  Globe, TrendingUp, Users, Mail, Terminal, HeartPulse, Sparkle,
  XCircle, AlertTriangle, Play, Pause, ChevronDown, ChevronUp, Copy, Check
} from "lucide-react";

export default function Home() {
  // Crawler Sandbox Simulation States
  const [nodes, setNodes] = useState([
    { id: "home", label: "Home Page", url: "/", x: 120, y: 150, status: "error", error: "Duplicate meta description.", why: "Hurts canonical authority & lowers search click-through rate.", impact: "High", impactScore: 90, anim: "animate-float-1" },
    { id: "blog", label: "Blog Index", url: "/blog", x: 260, y: 70, status: "warning", error: "Missing schema JSON-LD.", why: "Prevents search engines from displaying rich snippets (stars, FAQ) in search queries.", impact: "Medium", impactScore: 65, anim: "animate-float-2" },
    { id: "contact", label: "Contact", url: "/contact", x: 380, y: 220, status: "error", error: "Broken outward links.", why: "Exhausts crawler budgets and triggers search quality downgrades.", impact: "High", impactScore: 85, anim: "animate-float-3" },
    { id: "pricing", label: "Pricing", url: "/pricing", x: 500, y: 110, status: "warning", error: "Images lacking alt text.", why: "Search crawlers cannot index graphics. Crucial for Google Images rankings.", impact: "Medium", impactScore: 50, anim: "animate-float-1" }
  ]);

  const [activeNode, setActiveNode] = useState<any>(null);
  const [fixingNodeId, setFixingNodeId] = useState<string | null>(null);
  const [agentVelocity, setAgentVelocity] = useState(2); // 1 to 5 slider
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    "🤖 Growth Employee initialized. Listening for targets...",
    "🔍 Analyzing website root elements...",
    "⚠️ Found 4 crawl anomalies. Select nodes above to repair."
  ]);
  const [seoScore, setSeoScore] = useState(58);

  // 1. Live Crawler URL Streamer States
  const [streamActive, setStreamActive] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState(1); // 1x, 2x, 3x
  const [streamLogs, setStreamLogs] = useState<string[]>([
    "GET /index.html [200 OK] - Speed: 140ms - Title validation passed.",
    "GET /about [200 OK] - Speed: 210ms - Missing image ALT attributes."
  ]);

  // 2. Outline Editor Simulator States
  const [activeKeyword, setActiveKeyword] = useState<"plumber" | "insulation" | "renovation">("plumber");
  const [editorText, setEditorText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // 3. 7-Day Scheduler States
  const [selectedDay, setSelectedDay] = useState<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun">("mon");

  // 4. FAQ Accordion States
  const [faqOpen, setFaqOpen] = useState<{ [key: string]: boolean }>({
    faq1: true,
    faq2: false,
    faq3: false,
    faq4: false
  });

  const toggleFaq = (id: string) => {
    setFaqOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Node Sandbox Fix triggers
  const handleFixNode = (id: string) => {
    if (fixingNodeId) return;
    setFixingNodeId(id);
    
    setSandboxLogs(prev => [
      ...prev,
      `🔧 [Growth Agent] Connecting CMS API and fetching sitemap variables for ${id}...`,
      `⚙️ [Growth Agent] Compiling optimized tag markup structure for ${id}...`
    ]);

    setTimeout(() => {
      setNodes(prev => prev.map(node => {
        if (node.id === id) {
          return { ...node, status: "fixed" };
        }
        return node;
      }));

      setSandboxLogs(prev => [
        ...prev,
        `✓ [Growth Agent] Pushed tag optimization patch live to CMS for ${id}!`
      ]);
      setSeoScore(prev => Math.min(prev + 10.5, 100));
      setFixingNodeId(null);
      
      setActiveNode((prev: any) => {
        if (prev && prev.id === id) {
          return { ...prev, status: "fixed" };
        }
        return prev;
      });
    }, 1200);
  };

  const handleNodeHover = (node: any) => {
    setActiveNode(node);
    setSandboxLogs(prev => [
      ...prev,
      `👀 Inspected: ${node.label} (${node.url})`
    ]);
  };

  // 1. Live Crawler URL Streamer loop
  useEffect(() => {
    if (!streamActive) return;

    const urlsPool = [
      "GET /pricing [200 OK] - Speed: 180ms - Found meta description tag (too short).",
      "GET /contact [404 Not Found] - Broken outbound anchor link target discovered!",
      "GET /blog/seo-checklist [200 OK] - Speed: 320ms - Missing Article structured markup.",
      "GET /services/renovation [200 OK] - Speed: 290ms - Meta title too long (78 characters).",
      "GET /assets/hero-banner.png [200 OK] - Speed: 980ms - Heavy file asset: 9.4MB.",
      "GET /faq [200 OK] - Speed: 150ms - Schema structures validated.",
      "GET /about-our-team [200 OK] - Speed: 240ms - Missing alt tag on image: profile-1.jpg.",
      "GET /services/plumbing [200 OK] - Speed: 340ms - Internal link network parsed."
    ];

    const interval = setInterval(() => {
      const randomLine = urlsPool[Math.floor(Math.random() * urlsPool.length)];
      const timestamp = new Date().toLocaleTimeString();
      setStreamLogs(prev => [...prev.slice(-30), `[${timestamp}] ${randomLine}`]);
    }, 2000 / streamSpeed);

    return () => clearInterval(interval);
  }, [streamActive, streamSpeed]);

  // 2. Outline Editor simulator typewriter loop
  useEffect(() => {
    setIsTyping(true);
    setEditorText("");

    const outlines = {
      plumber: `TITLE: 5 Emergency Plumbing Fixes for Local Homeowners
SLUG: emergency-plumbing-fixes
METADATA: Clear guidance on stopping leaks and pressure failures.

AI OUTLINE STRUCTURE:
1. Introduction: The cost of ignoring pipe leaks.
2. Step-by-step: Mending a burst pipe with sealing tape.
3. Troubleshooting water heater warning lights.
4. When to call a certified emergency service immediately.
5. FAQ: How to locate your main shut-off valves.

[Agent Status: Draft complete, validated JSON-LD schema, ready to push!]`,
      insulation: `TITLE: How Attic Insulation Slashes Monthly Cooling Bills
SLUG: attic-insulation-cooling-cost
METADATA: Reviewing R-value metrics and installation methods.

AI OUTLINE STRUCTURE:
1. Understanding heat transfer through roofs.
2. What is R-Value? Choosing fiberglass vs spray foam.
3. Safety considerations: Airflow and mold prevention.
4. ROI Calculator: Average timeline to break even.
5. FAQ: Can you layer fresh insulation over old sheets?

[Agent Status: Outlines compiled, compressed 4 graphics, ready for CMS!]`,
      renovation: `TITLE: 3 Structural Checks Before Renovating Your Kitchen
SLUG: structural-checks-kitchen-renovation
METADATA: Avoid expensive repair disasters by reviewing load bearings.

AI OUTLINE STRUCTURE:
1. Load-bearing walls vs partition drywall frames.
2. Mapping plumbing lines and electrical outlets before tearing walls.
3. Ventilation routing specs for professional ranges.
4. Setting a realistic contingency budget buffer (15%).
5. FAQ: Do you need a permit to remove partition studs?

[Agent Status: Draft review complete, FAQ markup ready to inject!]`
    };

    const targetText = outlines[activeKeyword];
    let idx = 0;
    
    // Quick typing interval simulating agent writing outline
    const timer = setInterval(() => {
      if (idx < targetText.length) {
        setEditorText(targetText.substring(0, idx + 15));
        idx += 15;
      } else {
        setEditorText(targetText);
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [activeKeyword]);

  // Get scheduler timeline actions
  const getSchedulerActions = (day: string) => {
    switch (day) {
      case "mon":
        return [
          { time: "09:00 AM", text: "Crawler wakes up. Scans main sitemap URLs for crawl errors.", status: "Done" },
          { time: "11:30 AM", text: "Audits meta descriptions on 3 secondary pages. Generates suggestions.", status: "Done" },
          { time: "03:00 PM", text: "Compiles local competitor backlink gaps. Flags 2 referral opportunities.", status: "Done" }
        ];
      case "tue":
        return [
          { time: "10:00 AM", text: "Scans outbound links for 404 targets. Replaces 1 broken anchor tag.", status: "Done" },
          { time: "01:30 PM", text: "Injects semantic internal links within blog archive database.", status: "Done" },
          { time: "04:15 PM", text: "Compresses 12 heavy png assets. Reduces page load time by 320ms.", status: "Done" }
        ];
      case "wed":
        return [
          { time: "09:15 AM", text: "Performs target keyword tracking lookup. Compares rankings placement.", status: "Done" },
          { time: "02:00 PM", text: "Researches content gaps. Selects high-intent search query and compiles outline.", status: "Done" },
          { time: "05:00 PM", text: "Writes full article draft with integrated FAQ JSON-LD schemas.", status: "Done" }
        ];
      case "thu":
        return [
          { time: "11:00 AM", text: "Inbound backlink quality evaluation. Audits incoming referral nodes.", status: "Done" },
          { time: "03:30 PM", text: "Prepares weekly email growth digest template. Validates ranking differences.", status: "Done" },
          { time: "06:00 PM", text: "Verifies connected CMS REST API connection handshake.", status: "Done" }
        ];
      case "fri":
        return [
          { time: "08:30 AM", text: "Auto-deploys approved meta tag patches live to connected website.", status: "Done" },
          { time: "12:00 PM", text: "Publishes generated blog post article as Gutenberg draft.", status: "Done" },
          { time: "04:00 PM", text: "Dispatches weekly Growth employee report email to site owner.", status: "Done" }
        ];
      default:
        return [
          { time: "09:00 AM", text: "Background crawler listening mode active. Validating site headers.", status: "Done" },
          { time: "02:00 PM", text: "Scans core security logs. Confirms DB backups are verified.", status: "Done" }
        ];
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 flex flex-col selection:bg-violet-500 selection:text-white overflow-x-hidden font-sans relative retro-grid bg-zinc-50 text-zinc-800">
      
      {/* Background glow overlay */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] -z-10 pointer-events-none transition-opacity duration-300 bg-violet-550/5" />
      
      {/* Header */}
      <header className="border-b-2 sticky top-0 z-50 transition-colors duration-300 border-zinc-950 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center border-2 border-zinc-950 shadow-retro-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight font-mono text-zinc-955">
              Antigravity<span className="text-violet-500">.</span>
            </span>
            <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-mono font-bold transition-all border-2 bg-zinc-150 text-violet-650 border-zinc-950 shadow-retro-sm">
              AI GROWTH WORKER v1
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider font-mono text-zinc-555">
            <a href="#sandbox" className="transition-colors hover:text-zinc-955">Diagnostics Board</a>
            <a href="#streamer" className="transition-colors hover:text-zinc-955">Live URL Streamer</a>
            <a href="#editor" className="transition-colors hover:text-zinc-955">AI Outline Editor</a>
            <a href="#scheduler" className="transition-colors hover:text-zinc-955">7-Day Logs</a>
            <a href="#faq" className="transition-colors hover:text-zinc-955">FAQ Panel</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-mono border-2 rounded-xl transition-all shadow-retro-sm text-zinc-950 bg-white border-zinc-950 hover:bg-zinc-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
            >
              Sign In
            </Link>
            
            <Link 
              href="/dashboard" 
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-650 to-indigo-550 rounded-xl transition-all flex items-center gap-2 border-2 border-zinc-950 shadow-retro-primary hover:scale-[1.02] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Hire Agent <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-xs mb-8 transition-all duration-305 shadow-retro-sm bg-white border-zinc-950 text-zinc-705 font-medium">
          <Sparkle className="w-4 h-4 text-violet-500 animate-spin-slow" />
          <span className="font-semibold tracking-wide font-mono">RETENTION ENGINE FOR WEB TRAFFIC GROWTH</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.05] mb-8 font-sans text-zinc-950">
          Your first autonomous <span className="underline decoration-violet-500 decoration-wavy decoration-3 underline-offset-8">AI Employee</span> for digital growth.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl max-w-3xl leading-relaxed mb-12 transition-colors duration-300 text-zinc-650">
          Connect your URL and your CMS. Antigravity crawls your pages, fixes metadata errors, targets keyword gaps, writes SEO outline copy, and publishes drafts instantly.
        </p>

        {/* Hero CTA Buttons with thick borders */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-md">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-650 to-indigo-550 rounded-xl transition-all border-2 border-zinc-950 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
          >
            Deploy AI Growth Worker <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <a 
            href="#sandbox" 
            className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-wider font-mono border-2 rounded-xl transition-all flex items-center justify-center bg-white border-zinc-955 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(139,92,246,1)]"
          >
            Run Interactive Sandbox
          </a>
        </div>
      </section>

      {/* ========================================================
          SECTION 1: INTERACTIVE CRAWLER SANDBOX
         ======================================================== */}
      <section id="sandbox" className="py-16 px-6 max-w-6xl mx-auto w-full relative">
        
        {/* Handwritten script annotation pointing to widget */}
        <div className="absolute -top-6 left-10 md:left-24 rotate-[-3deg] z-10 pointer-events-none hidden sm:block animate-pulse">
          <span className="font-caveat text-violet-605 text-lg md:text-xl block">
            ✏️ This is our live crawler simulation! Hover over nodes and click to fix!
          </span>
          <svg className="w-16 h-8 text-violet-550 mt-1 ml-6" fill="none" viewBox="0 0 100 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 10 C 30 40, 70 40, 90 20" />
            <path d="M80 20 L90 20 L85 30" />
          </svg>
        </div>

        {/* Interactive Sandbox Card */}
        <div className="rounded-3xl border-2 p-6 md:p-8 flex flex-col lg:grid lg:grid-cols-3 gap-8 relative transition-all duration-300 bg-white border-zinc-950 shadow-retro-md">
          
          {/* Left Column: Metrics & Slider Controls */}
          <div className="space-y-6 lg:border-r-2 lg:pr-8 lg:border-zinc-950">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono block text-violet-650">
                CRAWLER DIAGNOSTICS BOARD
              </span>
              <h3 className="text-xl font-extrabold mt-1 leading-snug text-zinc-955">
                Simulated Site Map
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed text-zinc-550">
                The agent is currently crawling page nodes, analyzing meta variables, broken link tags, and missing image alt tags.
              </p>
            </div>

            {/* Health score dial */}
            <div className="p-4 rounded-2xl border-2 transition-all bg-zinc-50 border-zinc-950 shadow-retro-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 font-mono">SEO Health Score</span>
                <span className="text-xs text-emerald-600 font-bold font-mono">
                  {seoScore === 100 ? "✓ 100% Correct" : `Fix remaining: ${Math.round(100 - seoScore)}%`}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black font-mono tracking-tight text-violet-500">
                  {Math.round(seoScore)}%
                </span>
                <span className="text-xs text-zinc-400 font-medium">crawled status</span>
              </div>
              <div className="w-full h-3 rounded-full mt-3 overflow-hidden border border-zinc-950 bg-zinc-200">
                <div 
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${seoScore}%` }}
                />
              </div>
            </div>

            {/* Agent Velocity slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono text-zinc-600">
                <span>Agent Velocity</span>
                <span className="text-violet-650">{agentVelocity}x speed</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={agentVelocity}
                onChange={(e) => setAgentVelocity(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-violet-650 border border-zinc-350"
              />
              <span className="text-[10px] block leading-relaxed text-zinc-450">
                Adjust slider to control crawler float movement rate and scanner parsing frequency in real-time.
              </span>
            </div>
          </div>

          {/* Middle Column: Interactive Node Map Canvas */}
          <div className="relative h-[320px] rounded-2xl border-2 bg-zinc-950 border-dashed border-zinc-950 overflow-hidden flex items-center justify-center lg:col-span-2 shadow-inner">
            
            {/* Connecting SVG lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d="M120 150 L260 70 L500 110 L380 220 Z" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="2" fill="none" />
              <path d="M120 150 L380 220" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="2" strokeDasharray="5 5" fill="none" />
              
              {/* Pulsing dots crawling along paths */}
              <circle r="4" fill="#8b5cf6" className="animate-pulse">
                <animateMotion 
                  dur={`${6 / agentVelocity}s`} 
                  repeatCount="indefinite" 
                  path="M120 150 L260 70 L500 110 L380 220 Z" 
                />
              </circle>
              <circle r="4" fill="#6366f1" className="animate-pulse">
                <animateMotion 
                  dur={`${8 / agentVelocity}s`} 
                  repeatCount="indefinite" 
                  path="M380 220 L120 150 L260 70" 
                />
              </circle>
            </svg>

            {/* Displaying floating interactive nodes */}
            {nodes.map((node) => {
              const isWarning = node.status === "warning";
              const isError = node.status === "error";
              const isFixed = node.status === "fixed";
              
              const speedStyle = {
                animationDuration: `${parseFloat((5 / agentVelocity).toFixed(1))}s`
              };

              return (
                <button
                  key={node.id}
                  onClick={() => handleNodeHover(node)}
                  onMouseEnter={() => handleNodeHover(node)}
                  style={{ 
                    position: "absolute", 
                    left: `${node.x}px`, 
                    top: `${node.y}px`,
                    ...speedStyle 
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] border-zinc-950 focus:outline-none ${node.anim} ${
                    isFixed 
                      ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                      : isError 
                        ? "bg-red-500 text-white shadow-red-500/20 animate-pulse-glow" 
                        : "bg-amber-500 text-white shadow-amber-500/20"
                  }`}
                >
                  <Globe className="w-5 h-5 text-white" />
                  
                  {/* Status badge indicator on the top-right of the node */}
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-900 border-2 border-zinc-950 flex items-center justify-center font-black text-[9px] text-white">
                    {isFixed && <span className="text-emerald-450">✓</span>}
                    {isError && <span className="text-red-500">!</span>}
                    {isWarning && <span className="text-amber-500">?</span>}
                  </span>
                </button>
              );
            })}

            {/* Info tooltip / Inspector overlays inside map */}
            {activeNode && (
              <div className="absolute bottom-3 left-3 right-3 p-4 rounded-xl border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 border-zinc-950 bg-white shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider font-mono text-zinc-900">{activeNode.label}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider font-mono border px-2 py-0.5 rounded ${
                      activeNode.status === "fixed" 
                        ? "text-emerald-600 border-emerald-500/20 bg-emerald-50/50" 
                        : activeNode.status === "error" 
                          ? "text-red-650 border-red-500/20 bg-red-50/50 animate-pulse" 
                          : "text-amber-600 border-amber-500/20 bg-amber-50/50"
                    }`}>
                      {activeNode.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-650">
                    <strong>Crawler Omission:</strong> {activeNode.status === "fixed" ? "No issues detected. Tag is optimized." : activeNode.error}
                  </p>
                  {activeNode.status !== "fixed" && (
                    <p className="text-[10px] italic text-zinc-450">
                      <strong>Why it matters:</strong> {activeNode.why}
                    </p>
                  )}
                </div>

                {activeNode.status !== "fixed" && (
                  <button
                    onClick={() => handleFixNode(activeNode.id)}
                    disabled={fixingNodeId === activeNode.id}
                    className="px-4 py-2 bg-violet-650 hover:bg-violet-550 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                  >
                    {fixingNodeId === activeNode.id ? "Fixing..." : "Apply AI Fix"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            REDESIGNED VINTAGE TERMINAL CONSOLE (HIGH CONTRAST)
           ======================================================== */}
        <div className="mt-8 rounded-xl border-2 border-zinc-950 overflow-hidden shadow-retro-md bg-zinc-950 transition-all duration-300">
          
          {/* Header Bar */}
          <div className="bg-zinc-900 px-4 py-2 border-b-2 border-zinc-950 flex items-center justify-between">
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-red-500 mr-2 border border-zinc-950" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2 border border-zinc-950" />
              <span className="w-3 h-3 rounded-full bg-green-500 border border-zinc-950" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-300">
              GROWTH AGENT CONSOLE TERMINAL
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">bash / run_audit.sh</span>
          </div>

          {/* Console Output Canvas */}
          <div className="p-4 font-mono text-xs text-emerald-450 min-h-[160px] max-h-[220px] overflow-y-auto space-y-2.5 scrollbar-thin">
            {sandboxLogs.map((log, index) => (
              <div key={index} className="flex gap-2 items-start animate-fade-in leading-relaxed">
                <span className="text-violet-400 font-bold shrink-0">root@antigravity:~$</span>
                <p>{log}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          NEW SECTION 2: LIVE CRAWLER URL STREAMER
         ======================================================== */}
      <section id="streamer" className="py-16 px-6 max-w-6xl mx-auto w-full border-t-2 border-zinc-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <span className="text-xs text-violet-650 font-bold tracking-wider uppercase font-mono">Real-time HTTP Monitoring</span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950">Live URL Crawler Streamer</h2>
            <p className="text-sm mt-1.5 text-zinc-550 leading-relaxed max-w-2xl">
              Observe search bot crawling activity as our growth employee scans subpage targets for metadata gaps, slow assets, alt properties, and broken outbound anchor paths.
            </p>
          </div>

          {/* Controls Bar with high contrast buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button 
              onClick={() => setStreamActive(!streamActive)}
              className="px-4 py-2 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-white border-zinc-950 text-zinc-950 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              {streamActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Crawler
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-violet-605" /> Resume Crawler
                </>
              )}
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center border-2 border-zinc-950 rounded-xl overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <button 
                onClick={() => setStreamSpeed(1)}
                className={`px-3 py-2 text-xs font-mono font-bold transition-all ${streamSpeed === 1 ? "bg-violet-600 text-white" : "text-zinc-650 hover:bg-zinc-100"}`}
              >
                1x
              </button>
              <button 
                onClick={() => setStreamSpeed(2)}
                className={`px-3 py-2 text-xs font-mono font-bold border-l-2 border-zinc-950 transition-all ${streamSpeed === 2 ? "bg-violet-600 text-white" : "text-zinc-650 hover:bg-zinc-100"}`}
              >
                2x
              </button>
              <button 
                onClick={() => setStreamSpeed(5)}
                className={`px-3 py-2 text-xs font-mono font-bold border-l-2 border-zinc-950 transition-all ${streamSpeed === 5 ? "bg-violet-600 text-white" : "text-zinc-650 hover:bg-zinc-100"}`}
              >
                5x
              </button>
            </div>
          </div>
        </div>

        {/* Live Stream Panel */}
        <div className="rounded-2xl border-2 border-zinc-950 bg-zinc-900 overflow-hidden shadow-retro-md">
          <div className="bg-zinc-950 px-4 py-2 border-b-2 border-zinc-950 flex items-center justify-between text-zinc-450 font-mono text-[10px]">
            <span>Activity Status: {streamActive ? "CRAWLING ACTIVE" : "CRAWLER PAUSED"}</span>
            <span>Speed rate: {streamSpeed}x interval</span>
          </div>

          <div className="p-4 font-mono text-xs text-amber-500 h-64 overflow-y-auto space-y-2 scrollbar-thin">
            {streamLogs.map((log, index) => (
              <div key={index} className="flex gap-2 items-start animate-fade-in">
                <span className="text-zinc-550">[Worker]</span>
                <p className="leading-relaxed">{log}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          NEW SECTION 3: AI OUTLINE EDITOR SIMULATOR
         ======================================================== */}
      <section id="editor" className="py-16 px-6 max-w-6xl mx-auto w-full border-t-2 border-zinc-200">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs text-violet-650 font-bold tracking-wider uppercase font-mono">Autonomous Content Blueprinting</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950">AI Outline Live Editor Simulator</h2>
          <p className="text-sm mt-1.5 text-zinc-550 leading-relaxed">
            Select a target keyword query on the left, and watch the growth employee compile SEO headings, FAQs, and article drafts in the editor workspace in real-time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Keyword selector cards */}
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500 block">Select Search Intent Query:</span>
            
            <button
              onClick={() => setActiveKeyword("plumber")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1 shadow-retro-sm ${
                activeKeyword === "plumber"
                  ? "bg-violet-50 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-white border-zinc-205 hover:border-zinc-350"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider font-mono text-violet-650">Keyword Group A</span>
                <span className="text-[10px] font-mono text-zinc-450">Vol: 1,400/mo</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-905 mt-1">"emergency plumbing fixes"</h4>
              <p className="text-[11px] leading-relaxed text-zinc-550 mt-1">Targets urgent residential pipe repair volume.</p>
            </button>

            <button
              onClick={() => setActiveKeyword("insulation")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1 shadow-retro-sm ${
                activeKeyword === "insulation"
                  ? "bg-violet-50 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-white border-zinc-205 hover:border-zinc-350"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider font-mono text-violet-650">Keyword Group B</span>
                <span className="text-[10px] font-mono text-zinc-455">Vol: 850/mo</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-905 mt-1">"attic insulation cooling cost"</h4>
              <p className="text-[11px] leading-relaxed text-zinc-550 mt-1">Targets homeowners seeking energy audit upgrades.</p>
            </button>

            <button
              onClick={() => setActiveKeyword("renovation")}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-1 shadow-retro-sm ${
                activeKeyword === "renovation"
                  ? "bg-violet-50 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-white border-zinc-205 hover:border-zinc-350"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider font-mono text-violet-650">Keyword Group C</span>
                <span className="text-[10px] font-mono text-zinc-455">Vol: 320/mo</span>
              </div>
              <h4 className="font-bold text-sm text-zinc-905 mt-1">"structural kitchen checks"</h4>
              <p className="text-[11px] leading-relaxed text-zinc-550 mt-1">Targets kitchen framing and permit queries.</p>
            </button>
          </div>

          {/* Typewriting workspace editor */}
          <div className="lg:col-span-2 rounded-2xl border-2 border-zinc-950 bg-white overflow-hidden shadow-retro-md">
            
            {/* Editor Top Bar */}
            <div className="bg-zinc-900 px-4 py-2 border-b-2 border-zinc-950 flex items-center justify-between text-white">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-violet-405 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Growth Article Generator Pad</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-450 uppercase">
                {isTyping ? "Writing draft..." : "Compilation finished"}
              </span>
            </div>

            {/* Document page */}
            <div className="p-6 min-h-[300px] max-h-[380px] overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-800 bg-zinc-50/50">
              {isTyping && (
                <div className="flex items-center gap-2 text-violet-605 mb-4 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                  <span>AI Employee writing outline. Validating search intent vectors...</span>
                </div>
              )}
              <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-705 leading-relaxed">
                {editorText}
              </pre>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          NEW SECTION 4: 7-DAY SCHEDULE TIMELINE
         ======================================================== */}
      <section id="scheduler" className="py-16 px-6 max-w-6xl mx-auto w-full border-t-2 border-zinc-200">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs text-violet-650 font-bold tracking-wider uppercase font-mono">Autonomous Action Schedule</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-955">7-Day Growth Agent Logs</h2>
          <p className="text-sm mt-1.5 text-zinc-550 leading-relaxed">
            Click on any day of the week below to inspect the hour-by-hour task list the AI Employee executes automatically to drive traffic.
          </p>
        </div>

        {/* Day Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {[
            { id: "mon", label: "Monday" },
            { id: "tue", label: "Tuesday" },
            { id: "wed", label: "Wednesday" },
            { id: "thu", label: "Thursday" },
            { id: "fri", label: "Friday" },
            { id: "sat", label: "Saturday" },
            { id: "sun", label: "Sunday" }
          ].map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id as any)}
              className={`py-3 px-4 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono text-center transition-all shadow-retro-sm ${
                selectedDay === day.id
                  ? "bg-violet-650 border-zinc-950 text-white shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] translate-x-[-2px] translate-y-[-2px]"
                  : "bg-white border-zinc-205 text-zinc-755 hover:border-zinc-350"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* Day Schedule timeline list */}
        <div className="rounded-2xl border-2 p-6 border-zinc-950 bg-white shadow-retro-md">
          <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500 block mb-6">
            Agent timeline Checklist for {selectedDay.toUpperCase()}
          </span>

          <div className="relative pl-6 border-l-2 border-zinc-950 space-y-6">
            {getSchedulerActions(selectedDay).map((action, idx) => (
              <div key={idx} className="relative group animate-fade-in">
                <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full flex items-center justify-center border-2 bg-white border-zinc-955">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-450 block uppercase tracking-wide">{action.time}</span>
                    <h4 className="font-bold text-sm text-zinc-800 mt-0.5">{action.text}</h4>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 self-start sm:self-center">
                    ✓ {action.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-24 px-6 border-t-2 border-zinc-950 bg-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 font-sans tracking-tight text-zinc-955">
              An Autonomous Specialist for your Digital Footprint
            </h2>
            <p className="leading-relaxed text-zinc-600">
              Why pay consulting fees? Antigravity executes digital growth skills 24/7. It audits performance, builds pipelines of search relevance, analyzes competitors, and submits weekly summaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1: Website Crawl */}
            <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-retro-md">
              <div className="w-12 h-12 rounded-xl bg-violet-655/10 border-2 border-zinc-950 flex items-center justify-center text-violet-555 mb-6 group-hover:scale-110 transition-transform shadow-retro-sm">
                <Globe className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Deep Site Crawler</h3>
                <span className="text-xs text-yellow-550">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-605">
                Crawls your entire website structure. Examines key ranking parameters: missing titles, empty meta descriptions, schema markup irregularities, alt tags, duplicate copy, and links status.
              </p>
            </div>

            {/* Feature 2: AI Recommendations */}
            <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-955 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-retro-md">
              <div className="w-12 h-12 rounded-xl bg-violet-655/10 border-2 border-zinc-955 flex items-center justify-center text-violet-555 mb-6 group-hover:scale-110 transition-transform shadow-retro-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-zinc-900 font-mono">AI Recommendations</h3>
                <span className="text-xs text-yellow-550">⭐⭐⭐⭐⭐</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-605">
                Rather than listing charts, Antigravity isolates issues, explains why they affect rank, estimates impact, and generates one-click automated edits for your connected CMS.
              </p>
            </div>

            {/* Feature 3: AI Content Gen */}
            <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-955 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-retro-md">
              <div className="w-12 h-12 rounded-xl bg-violet-655/10 border-2 border-zinc-955 flex items-center justify-center text-violet-555 mb-6 group-hover:scale-110 transition-transform shadow-retro-sm">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Content Generation</h3>
                <span className="text-xs text-zinc-500">⭐⭐⭐⭐☆</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-605">
                Finds keyword terms, structures outlines, and drafts articles. Packages articles with custom FAQs, matching schemas, meta tags, and alt descriptions, ready for CMS publishing.
              </p>
            </div>

            {/* Feature 4: Daily Scheduler */}
            <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-955 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-retro-md">
              <div className="w-12 h-12 rounded-xl bg-violet-655/10 border-2 border-zinc-955 flex items-center justify-center text-violet-555 mb-6 group-hover:scale-110 transition-transform shadow-retro-sm">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Daily Growth Runs</h3>
                <span className="text-xs text-violet-605 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">Active</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-605">
                Every single day, the agent checks your site: compresses image sizes, updates titles, inserts relevant internal navigation links, checks for broken anchors, and schedules fresh posts.
              </p>
            </div>

            {/* Feature 5: Keyword Tracker */}
            <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-955 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-retro-md">
              <div className="w-12 h-12 rounded-xl bg-violet-655/10 border-2 border-zinc-955 flex items-center justify-center text-violet-555 mb-6 group-hover:scale-110 transition-transform shadow-retro-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-zinc-905 font-mono">Keyword Tracker</h3>
                <span className="text-xs text-violet-605 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">Historical</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-605">
                Tracks target keyword indexes, search query placement patterns, and impressions over time to visually verify optimization outcomes and monitor performance curves.
              </p>
            </div>

            {/* Feature 6: Competitor Analyzer */}
            <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-955 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-retro-md">
              <div className="w-12 h-12 rounded-xl bg-violet-655/10 border-2 border-zinc-955 flex items-center justify-center text-violet-555 mb-6 group-hover:scale-110 transition-transform shadow-retro-sm">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Competitor Analysis</h3>
                <span className="text-xs text-zinc-500">⭐⭐⭐⭐☆</span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-605">
                Compares target domain profiles against direct brand competitors. Checks content density gaps, key reference terms, anchor authority structures, and most clicked pages.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-24 px-6 border-t-2 border-zinc-950 bg-zinc-100/50">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 font-sans tracking-tight text-zinc-955">
              Set Clear Goals, Approve Final Pushes
            </h2>
            <p className="text-zinc-600">
              Antigravity runs tasks safely in the background. Review recommendations and confirm publishing updates with full administrative control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-retro-sm transition-all bg-white border-zinc-950 text-zinc-705 font-bold">
                01
              </div>
              <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">Configure URL & CMS</h4>
              <p className="text-xs leading-relaxed text-zinc-600">Enter your landing domain. Optionally establish REST connection credentials for safe publishing.</p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-retro-sm transition-all bg-white border-zinc-955 text-zinc-705 font-bold">
                02
              </div>
              <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">Automated Audit</h4>
              <p className="text-xs leading-relaxed text-zinc-600">The crawler runs through subpages, auditing elements, titles, speeds, and links.</p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-retro-sm transition-all bg-white border-zinc-955 text-zinc-705 font-bold">
                03
              </div>
              <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">Review Explanations</h4>
              <p className="text-xs leading-relaxed text-zinc-600">Read AI descriptions, check why metrics matter, and review generated blog outlines.</p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl border-2 font-mono text-base flex items-center justify-center mb-6 shadow-retro-sm transition-all bg-white border-zinc-955 text-zinc-705 font-bold">
                04
              </div>
              <h4 className="font-extrabold mb-2 text-zinc-900 font-mono">One-Click Deploy</h4>
              <p className="text-xs leading-relaxed text-zinc-600">Click "Apply" to instantly push blog updates and metadata live to your CMS.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t-2 border-zinc-955 bg-zinc-50">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs text-violet-605 font-bold tracking-widest uppercase font-mono">Pricing Plans</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-4 tracking-tight text-zinc-900 font-mono">
              Streamlined, Affordable Scaling
            </h2>
            <p className="text-zinc-600 text-sm">
              Deploy your dedicated Growth Employee for less than the cost of a single hourly consulting call.
            </p>
          </div>

          <div className="w-full max-w-md p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden flex flex-col text-left transition-all duration-300 bg-white border-zinc-950 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
            <div className="absolute top-0 right-0 bg-violet-650 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 border-l-2 border-b-2 border-zinc-955 font-mono">
              V1 Launch Special
            </div>
            
            <span className="text-xs text-violet-605 font-semibold tracking-wider uppercase mb-2 font-mono">Autonomous Agent</span>
            <h3 className="text-2xl font-extrabold mb-4 text-zinc-900 font-mono">AI Web Growth Employee</h3>
            
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black tracking-tight text-zinc-900 font-mono">$19</span>
              <span className="text-zinc-500 font-medium">/ month</span>
            </div>

            <p className="text-sm mb-8 leading-relaxed text-zinc-600">
              Perfect for startups, businesses, local agencies, and store owners seeking to systematically rank on search platforms.
            </p>

            <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Unlimited crawling & deep audits</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>AI Recommendations & One-Click Fixes</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Keyword tracking dashboard & historical charts</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Weekly summary reports via email</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>CMS connection for automated draft pushing</span>
              </li>
            </ul>

            <Link 
              href="/dashboard" 
              className="w-full py-4 text-center text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl transition-all border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Get Started Instantly
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================
          NEW SECTION 5: INTERACTIVE FAQ ACCORDION
         ======================================================== */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto w-full border-t-2 border-zinc-955 bg-white">
        <div className="text-center mb-16">
          <span className="text-xs text-violet-650 font-bold tracking-wider uppercase font-mono">Frequently Asked Questions</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950 font-mono">Answers & Support</h2>
          <p className="text-sm mt-1.5 text-zinc-550 max-w-xl mx-auto">
            Everything you need to know about setting up and working with an autonomous AI employee for SEO growth.
          </p>
        </div>

        <div className="space-y-4">
          
          {/* FAQ 1 */}
          <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white">
            <button 
              onClick={() => toggleFaq("faq1")}
              className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
            >
              <span>What exactly is an AI growth employee?</span>
              {faqOpen.faq1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {faqOpen.faq1 && (
              <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200">
                An AI growth employee is a virtual staff agent that runs 24/7. It connects directly to your web domains and CMS systems. It performs deep crawl audits, identifies code omissions, generates optimized titles/alt descriptions, maps keywords, and drafts and uploads complete outline blog pages autonomously.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white">
            <button 
              onClick={() => toggleFaq("faq2")}
              className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
            >
              <span>Is it safe to connect my CMS website backend credentials?</span>
              {faqOpen.faq2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {faqOpen.faq2 && (
              <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200">
                Yes, absolutely. We enforce secure **Least Privilege Credentials**. Instead of inputting primary site admin credentials, our setup manual instructs you to create a separate user account with restricted "Author" or "Editor" permissions and assign a localized application key. The AI employee can only compile drafts for review and cannot edit core system themes or configuration settings.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white">
            <button 
              onClick={() => toggleFaq("faq3")}
              className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
            >
              <span>What is the difference between this and traditional tools like Semrush?</span>
              {faqOpen.faq3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {faqOpen.faq3 && (
              <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200">
                Traditional tools require you to interpret data, compile sheets, and manually perform edits. Antigravity does not just report—it takes action. It isolates crawl gaps, explains why they reduce organic click value, estimates impact metrics, generates correct replacement tags, and pushes drafts with one click.
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white">
            <button 
              onClick={() => toggleFaq("faq4")}
              className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
            >
              <span>Can I choose which pages are crawled and which are skipped?</span>
              {faqOpen.faq4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {faqOpen.faq4 && (
              <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200">
                Yes. Our CMS panel allows you to configure exact crawling filters, exclude specific path directories (such as admin folders, shopping carts, or thank-you pages), and review each suggested recommendation block before pushing edits live.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-zinc-950 bg-zinc-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-650" />
            <span className="font-bold text-sm text-zinc-955 font-mono">Antigravity Growth Platform</span>
          </div>
          <span className="text-xs text-zinc-550 font-mono">
            &copy; 2026 Antigravity. Built with Next.js & Gemini.
          </span>
        </div>
      </footer>
    </div>
  );
}
