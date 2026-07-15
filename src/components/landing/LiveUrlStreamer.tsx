import React, { useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Badge } from "../ui/Badge";

export const LiveUrlStreamer: React.FC = () => {
  const [streamActive, setStreamActive] = useState(true);
  const [streamSpeed, setStreamSpeed] = useState(1);
  const [streamLogs, setStreamLogs] = useState<string[]>([
    "GET /pricing [200 OK] - Speed: 180ms - Found meta description tag (too short).",
    "GET /contact [404 Not Found] - Broken outbound anchor link target discovered!",
    "GET /blog/seo-checklist [200 OK] - Speed: 320ms - Missing Article structured markup.",
    "GET /services/renovation [200 OK] - Speed: 290ms - Meta title too long (78 characters).",
    "GET /assets/hero-banner.png [200 OK] - Speed: 980ms - Heavy file asset: 9.4MB.",
    "GET /faq [200 OK] - Speed: 150ms - Schema structures validated.",
    "GET /about-our-team [200 OK] - Speed: 240ms - Missing alt tag on image: profile-1.jpg.",
    "GET /services/plumbing [200 OK] - Speed: 340ms - Internal link network parsed.",
  ]);

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
      "GET /services/plumbing [200 OK] - Speed: 340ms - Internal link network parsed.",
    ];

    const interval = setInterval(() => {
      const randomLine = urlsPool[Math.floor(Math.random() * urlsPool.length)];
      const timestamp = new Date().toLocaleTimeString();
      setStreamLogs((prev) => [...prev.slice(-30), `[${timestamp}] ${randomLine}`]);
    }, 2000 / streamSpeed);

    return () => clearInterval(interval);
  }, [streamActive, streamSpeed]);

  return (
    <section id="streamer" className="py-16 px-6 max-w-6xl mx-auto w-full border-t-2 border-zinc-200">
      {/* Demo Badge */}
      <div className="flex justify-start mb-2">
        <Badge variant="amber">Interactive Demo -- Illustrative</Badge>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-xs text-violet-605 font-bold tracking-wider uppercase font-mono">
            Real-time HTTP Monitoring
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950 font-mono">
            Live URL Crawler Streamer
          </h2>
          <p className="text-sm mt-1.5 text-zinc-550 leading-relaxed max-w-2xl font-sans">
            Observe search bot crawling activity as our growth employee scans subpage targets for metadata gaps, slow assets, alt properties, and broken outbound anchor paths.
          </p>
        </div>

        {/* Controls Bar with high contrast buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setStreamActive(!streamActive)}
            type="button"
            className="px-4 py-2 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-white border-zinc-950 text-zinc-950 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
          >
            {streamActive ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause Crawler
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-violet-600" /> Resume Crawler
              </>
            )}
          </button>

          {/* Speed Multipliers */}
          <div className="flex items-center border-2 border-zinc-950 rounded-xl overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <button
              onClick={() => setStreamSpeed(1)}
              type="button"
              className={`px-3 py-2 text-xs font-mono font-bold transition-all ${
                streamSpeed === 1 ? "bg-violet-600 text-white" : "text-zinc-650 hover:bg-zinc-100"
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setStreamSpeed(2)}
              type="button"
              className={`px-3 py-2 text-xs font-mono font-bold border-l-2 border-zinc-950 transition-all ${
                streamSpeed === 2 ? "bg-violet-600 text-white" : "text-zinc-650 hover:bg-zinc-100"
              }`}
            >
              2x
            </button>
            <button
              onClick={() => setStreamSpeed(5)}
              type="button"
              className={`px-3 py-2 text-xs font-mono font-bold border-l-2 border-zinc-950 transition-all ${
                streamSpeed === 5 ? "bg-violet-600 text-white" : "text-zinc-650 hover:bg-zinc-100"
              }`}
            >
              5x
            </button>
          </div>
        </div>
      </div>

      {/* Live Stream Panel */}
      <div className="rounded-2xl border-2 border-zinc-950 bg-zinc-900 overflow-hidden shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
        <div className="bg-zinc-950 px-4 py-2 border-b-2 border-zinc-950 flex items-center justify-between text-zinc-400 font-mono text-[10px]">
          <span>Activity Status: {streamActive ? "CRAWLING ACTIVE" : "CRAWLER PAUSED"}</span>
          <span>Speed rate: {streamSpeed}x interval</span>
        </div>

        <div className="p-4 font-mono text-xs text-amber-500 h-64 overflow-y-auto space-y-2 scrollbar-thin">
          {streamLogs.map((log, index) => (
            <div key={index} className="flex gap-2 items-start animate-fade-in">
              <span className="text-zinc-500 font-mono font-bold">[Worker]</span>
              <p className="leading-relaxed">{log}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default LiveUrlStreamer;
