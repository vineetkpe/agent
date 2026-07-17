import React from "react";
import { Globe, Sparkles, FileText, Activity, ShieldCheck, Database } from "lucide-react";

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 border-t-2 border-zinc-950 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 font-sans tracking-tight text-zinc-950">
            Professional SEO Audits & Easy Implementation
          </h2>
          <p className="leading-relaxed text-zinc-650 text-sm">
            HeyDrona gives you tools to scan your website for SEO health problems and quickly apply optimizations. You maintain full control — no changes are pushed without your explicit approval.
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
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Scans your website links and identifies standard SEO issues: missing title tags, empty meta descriptions, schema markup opportunities, broken links, and images lacking alt text.
            </p>
          </div>

          {/* Feature 2: AI Recommendations */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">AI Recommendations</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-655">
              Instead of complex, confusing spreadsheets, we explain detected issues in plain English, estimate their priority, and generate recommended text fixes that you can apply instantly.
            </p>
          </div>

          {/* Feature 3: AI Content Gen */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-300 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Content Helper</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Generates structure outlines, FAQ lists, and draft articles for your blog. Tailors copy, headings, and descriptions to match SEO best practices before you publish.
            </p>
          </div>

          {/* Feature 4: WordPress CMS integration */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">One-Click CMS Sync</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Connect your WordPress site securely using restricted author credentials. Once connected, you can deploy your approved metadata fixes and blog drafts directly in one click.
            </p>
          </div>

          {/* Feature 5: Google Search Console */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Database className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Search Console Integration</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Sync directly with Google Search Console to pull real search queries, impressions, and click-through rates, helping you spot which pages need immediate optimization.
            </p>
          </div>

          {/* Feature 6: Uptime Checks */}
          <div className="p-8 rounded-2xl border-2 transition-all duration-305 group relative overflow-hidden border-zinc-950 bg-zinc-50/50 hover:border-violet-500/20 hover:bg-white hover:shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border-2 border-zinc-950 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
              <Activity className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-zinc-900 font-mono">Uptime Monitoring</h3>
            </div>
            <p className="text-xs leading-relaxed text-zinc-650">
              Monitors your website constantly to ensure it is online. If your website goes down, we record the downtime details so you can contact your hosting provider.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
