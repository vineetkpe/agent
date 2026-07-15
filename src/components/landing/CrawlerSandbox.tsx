import React, { useState } from "react";
import { Globe, Sparkles, Activity } from "lucide-react";
import { Badge } from "../ui/Badge";

export const CrawlerSandbox: React.FC = () => {
  const [nodes, setNodes] = useState([
    {
      id: "home",
      label: "Home Page",
      url: "/",
      x: 120,
      y: 150,
      status: "error",
      error: "Duplicate meta description.",
      why: "Hurts canonical authority & lowers search click-through rate.",
      impact: "High",
      impactScore: 90,
      anim: "animate-float-1",
    },
    {
      id: "blog",
      label: "Blog Index",
      url: "/blog",
      x: 260,
      y: 70,
      status: "warning",
      error: "Missing schema JSON-LD.",
      why: "Prevents search engines from displaying rich snippets (stars, FAQ) in search queries.",
      impact: "Medium",
      impactScore: 65,
      anim: "animate-float-2",
    },
    {
      id: "contact",
      label: "Contact",
      url: "/contact",
      x: 380,
      y: 220,
      status: "error",
      error: "Broken outward links.",
      why: "Exhausts crawler budgets and triggers search quality downgrades.",
      impact: "High",
      impactScore: 85,
      anim: "animate-float-3",
    },
    {
      id: "pricing",
      label: "Pricing",
      url: "/pricing",
      x: 500,
      y: 110,
      status: "warning",
      error: "Images lacking alt text.",
      why: "Search crawlers cannot index graphics. Crucial for Google Images rankings.",
      impact: "Medium",
      impactScore: 50,
      anim: "animate-float-1",
    },
  ]);

  const [activeNode, setActiveNode] = useState<any>(null);
  const [fixingNodeId, setFixingNodeId] = useState<string | null>(null);
  const [agentVelocity, setAgentVelocity] = useState(2);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    "🤖 Growth Employee initialized. Listening for targets...",
    "🔍 Analyzing website root elements...",
    "⚠️ Found 4 crawl anomalies. Select nodes above to repair.",
  ]);
  const [seoScore, setSeoScore] = useState(58);

  const handleFixNode = (id: string) => {
    if (fixingNodeId) return;
    setFixingNodeId(id);

    setSandboxLogs((prev) => [
      ...prev,
      `🔧 [Growth Agent] Connecting CMS API and fetching sitemap variables for ${id}...`,
      `⚙️ [Growth Agent] Compiling optimized tag markup structure for ${id}...`,
    ]);

    setTimeout(() => {
      setNodes((prev) =>
        prev.map((node) => {
          if (node.id === id) {
            return { ...node, status: "fixed" };
          }
          return node;
        })
      );

      setSandboxLogs((prev) => [
        ...prev,
        `✓ [Growth Agent] Pushed tag optimization patch live to CMS for ${id}!`,
      ]);
      setSeoScore((prev) => Math.min(prev + 10.5, 100));
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
    setSandboxLogs((prev) => [...prev, `👀 Inspected: ${node.label} (${node.url})`]);
  };

  return (
    <section id="sandbox" className="py-16 px-6 max-w-6xl mx-auto w-full relative">
      {/* Handwritten script annotation pointing to widget */}
      <div className="absolute -top-6 left-10 md:left-24 rotate-[-3deg] z-10 pointer-events-none hidden sm:block animate-pulse">
        <span className="font-caveat text-violet-600 text-lg md:text-xl block">
          ✏️ This is our live crawler simulation! Hover over nodes and click to fix!
        </span>
        <svg
          className="w-16 h-8 text-violet-500 mt-1 ml-6"
          fill="none"
          viewBox="0 0 100 50"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M10 10 C 30 40, 70 40, 90 20" />
          <path d="M80 20 L90 20 L85 30" />
        </svg>
      </div>

      {/* Demo Badge */}
      <div className="flex justify-start mb-2">
        <Badge variant="amber">Interactive Demo -- Illustrative</Badge>
      </div>

      {/* Interactive Sandbox Card */}
      <div className="rounded-3xl border-2 p-6 md:p-8 flex flex-col lg:grid lg:grid-cols-3 gap-8 relative transition-all duration-300 bg-white border-zinc-950 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
        {/* Left Column: Metrics & Slider Controls */}
        <div className="space-y-6 lg:border-r-2 lg:pr-8 lg:border-zinc-950">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono block text-violet-600">
              CRAWLER DIAGNOSTICS BOARD
            </span>
            <h3 className="text-xl font-extrabold mt-1 leading-snug text-zinc-950">Simulated Site Map</h3>
            <p className="text-xs mt-1.5 leading-relaxed text-zinc-550">
              The agent is currently crawling page nodes, analyzing meta variables, broken link tags, and missing image alt tags.
            </p>
          </div>

          {/* Health score dial */}
          <div className="p-4 rounded-2xl border-2 transition-all bg-zinc-50 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 font-mono">
                SEO Health Score
              </span>
              <span className="text-xs text-emerald-605 font-bold font-mono">
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
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider font-mono text-zinc-650">
              <span>Agent Velocity</span>
              <span className="text-violet-600">{agentVelocity}x speed</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={agentVelocity}
              onChange={(e) => setAgentVelocity(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-violet-600 border border-zinc-350"
            />
            <span className="text-[10px] block leading-relaxed text-zinc-400">
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
              <animateMotion dur={`${6 / agentVelocity}s`} repeatCount="indefinite" path="M120 150 L260 70 L500 110 L380 220 Z" />
            </circle>
            <circle r="4" fill="#6366f1" className="animate-pulse">
              <animateMotion dur={`${8 / agentVelocity}s`} repeatCount="indefinite" path="M380 220 L120 150 L260 70" />
            </circle>
          </svg>

          {/* Displaying floating interactive nodes */}
          {nodes.map((node) => {
            const isWarning = node.status === "warning";
            const isError = node.status === "error";
            const isFixed = node.status === "fixed";

            const speedStyle = {
              animationDuration: `${parseFloat((5 / agentVelocity).toFixed(1))}s`,
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
                  ...speedStyle,
                }}
                type="button"
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] border-zinc-950 focus:outline-none ${
                  node.anim
                } ${
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
                  {isFixed && <span className="text-emerald-500">✓</span>}
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
                  <span className="font-bold text-xs uppercase tracking-wider font-mono text-zinc-900">
                    {activeNode.label}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider font-mono border px-2 py-0.5 rounded ${
                      activeNode.status === "fixed"
                        ? "text-emerald-600 border-emerald-500/20 bg-emerald-50/50"
                        : activeNode.status === "error"
                        ? "text-red-605 border-red-500/20 bg-red-50/50 animate-pulse"
                        : "text-amber-600 border-amber-500/20 bg-amber-50/50"
                    }`}
                  >
                    {activeNode.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-650">
                  <strong>Crawler Omission:</strong>{" "}
                  {activeNode.status === "fixed" ? "No issues detected. Tag is optimized." : activeNode.error}
                </p>
                {activeNode.status !== "fixed" && (
                  <p className="text-[10px] italic text-zinc-400">
                    <strong>Why it matters:</strong> {activeNode.why}
                  </p>
                )}
              </div>

              {activeNode.status !== "fixed" && (
                <button
                  onClick={() => handleFixNode(activeNode.id)}
                  disabled={fixingNodeId === activeNode.id}
                  type="button"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shrink-0 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
                >
                  {fixingNodeId === activeNode.id ? "Fixing..." : "Apply AI Fix"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Retro console */}
      <div className="mt-8 rounded-xl border-2 border-zinc-950 overflow-hidden shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] bg-zinc-950 transition-all duration-300">
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
          <span className="text-[9px] font-mono text-zinc-505 uppercase font-bold">bash / run_audit.sh</span>
        </div>

        {/* Console Output Canvas */}
        <div className="p-4 font-mono text-xs text-emerald-500 min-h-[160px] max-h-[220px] overflow-y-auto space-y-2.5 scrollbar-thin">
          {sandboxLogs.map((log, index) => (
            <div key={index} className="flex gap-2 items-start animate-fade-in leading-relaxed">
              <span className="text-violet-400 font-bold shrink-0">root@heydrona:~$</span>
              <p>{log}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default CrawlerSandbox;
