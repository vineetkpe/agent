import React from "react";
import { Globe, Sparkles, FileText, Terminal, TrendingUp, Users } from "lucide-react";

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 border-t-2 border-zinc-950 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 font-sans tracking-tight text-zinc-950">
            An Autonomous Specialist for your Digital Footprint
          </h2>
          <p className="leading-relaxed text-zinc-650 text-sm">
            Why pay consulting fees? HeyDrona executes digital growth skills 24/7. It audits performance, builds pipelines of search relevance, analyzes competitors, and submits weekly summaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Website Crawl */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Deep Site Crawler</h3>
              <span className="text-xs text-yellow-500">⭐⭐⭐⭐⭐</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Crawls your entire website structure. Examines key ranking parameters: missing titles, empty meta descriptions, schema markup irregularities, alt tags, duplicate copy, and links status.
            </p>
          </div>

          {/* Feature 2: AI Recommendations */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">AI Recommendations</h3>
              <span className="text-xs text-yellow-500">⭐⭐⭐⭐⭐</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-655">
              Rather than listing charts, HeyDrona isolates issues, explains why they affect rank, estimates impact, and generates one-click automated edits for your connected CMS.
            </p>
          </div>

          {/* Feature 3: AI Content Gen */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Content Generation</h3>
              <span className="text-xs text-zinc-500">⭐⭐⭐⭐☆</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Finds keyword terms, structures outlines, and drafts articles. Packages articles with custom FAQs, matching schemas, meta tags, and alt descriptions, ready for CMS publishing.
            </p>
          </div>

          {/* Feature 4: Daily Scheduler */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Daily Growth Runs</h3>
              <span className="text-xs text-violet-600 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 font-bold">Active</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Every single day, the agent checks your site: compresses image sizes, updates titles, inserts relevant internal navigation links, checks for broken anchors, and schedules fresh posts.
            </p>
          </div>

          {/* Feature 5: Keyword Tracker */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Keyword Tracker</h3>
              <span className="text-xs text-violet-600 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 font-bold">Historical</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Tracks target keyword indexes, search query placement patterns, and impressions over time to visually verify optimization outcomes and monitor performance curves.
            </p>
          </div>

          {/* Feature 6: Competitor Analyzer */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Competitor Auditing</h3>
              <span className="text-xs text-violet-600 font-mono bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20 font-bold">Comparative</span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Analyzes overlapping competitor search rankings, outlines content gaps, tracks backlink profiles, and crawls competitor landing URLs to compile strategic references.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
export default FeatureGrid;
