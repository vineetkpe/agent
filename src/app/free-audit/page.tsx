"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Sparkles, ArrowRight, Search, CheckCircle2, AlertTriangle, ShieldCheck, Lock, RefreshCw } from "lucide-react";

interface TeaserIssue {
  type: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

interface AuditResult {
  url: string;
  score: number;
  teaserIssues: TeaserIssue[];
  totalIssuesCount: number;
  hiddenCount: number;
}

export default function FreeAuditPage() {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/public/free-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to run free website audit.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while auditing the site.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full space-y-12">
        {/* Hero Banner */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-zinc-955 bg-violet-50 text-violet-700 font-mono text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <Sparkles className="w-3.5 h-3.5" /> Instant Free Diagnostic
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-mono tracking-tight text-zinc-955 uppercase">
            Free Instant SEO Audit
          </h1>
          <p className="text-sm md:text-base text-zinc-600 max-w-xl mx-auto font-mono">
            Test your website's technical SEO health instantly. Get a real computed mini-score and uncover actionable issues in seconds.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="p-6 md:p-8 rounded-3xl border-2 border-zinc-955 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-700">
              Enter Website URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="e.g. https://yourbusiness.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 border-zinc-955 text-sm font-mono focus:outline-none focus:border-violet-600 bg-white"
                />
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-4" />
              </div>
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="px-6 py-3.5 border-2 border-zinc-955 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Scanning Site...
                  </>
                ) : (
                  <>
                    Run Free Audit <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] font-mono text-zinc-400">
              ⚡ Free public scan • No credit card or registration required
            </p>
          </form>

          {error && (
            <div className="mt-6 p-4 rounded-xl border-2 border-red-955 bg-red-50 text-xs font-mono text-red-755 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[10px]">Audit Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Results Container */}
        {result && (
          <div className="space-y-8 animate-fade-in">
            {/* Score Banner */}
            <div className="p-8 rounded-3xl border-2 border-zinc-955 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                  Target Domain Audited
                </span>
                <h3 className="text-xl font-mono font-bold text-zinc-900 truncate max-w-md">
                  {result.url}
                </h3>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Real-time Computed Mini Scan
                </div>
              </div>

              {/* Mini Score Gauge */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-zinc-955 bg-zinc-950 text-white min-w-[160px] shadow-[4px_4px_0px_0px_rgba(124,58,237,1)]">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                  SEO Health Score
                </span>
                <span
                  className={`text-5xl font-mono font-black mt-1 ${
                    result.score >= 80 ? "text-emerald-400" : result.score >= 60 ? "text-amber-400" : "text-rose-400"
                  }`}
                >
                  {result.score}/100
                </span>
              </div>
            </div>

            {/* Found Issues Teaser */}
            <div className="p-8 rounded-3xl border-2 border-zinc-955 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] space-y-6">
              <div className="flex items-center justify-between border-b-2 border-zinc-955 pb-4">
                <div>
                  <h3 className="text-base font-mono font-bold uppercase text-zinc-900">
                    Detected Page Diagnostics
                  </h3>
                  <p className="text-xs font-mono text-zinc-500">
                    Showing top detected issues from instant scan
                  </p>
                </div>
                <span className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border border-zinc-300 bg-zinc-100 text-zinc-700">
                  {result.totalIssuesCount} Total Issues Found
                </span>
              </div>

              <div className="space-y-4">
                {result.teaserIssues.length === 0 ? (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    No critical basic issues detected on your homepage! Your page title, meta description, H1 structure, and viewport look healthy.
                  </div>
                ) : (
                  result.teaserIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border-2 border-zinc-955 bg-zinc-50 flex items-start gap-3 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                    >
                      <AlertTriangle
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          issue.severity === "high"
                            ? "text-rose-500"
                            : issue.severity === "medium"
                            ? "text-amber-500"
                            : "text-blue-500"
                        }`}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-mono font-bold uppercase text-zinc-900">
                            {issue.title}
                          </h4>
                          <span
                            className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                              issue.severity === "high"
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-600">{issue.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Locked Issues Teaser */}
              {result.hiddenCount > 0 && (
                <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-400 bg-zinc-100/70 text-center space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-center gap-2 text-zinc-600 font-mono text-xs font-bold uppercase">
                    <Lock className="w-4 h-4 text-violet-650" /> +{result.hiddenCount} Additional SEO Issues Locked
                  </div>
                  <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto">
                    Our full Digital Growth Employee agent analyzes multi-page schema markup, keyword opportunities, broken links, and automatically deploys fixes to WordPress.
                  </p>
                </div>
              )}

              {/* Call To Action */}
              <div className="p-6 rounded-2xl border-2 border-zinc-955 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-center space-y-4 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
                <h4 className="text-lg font-mono font-black uppercase">
                  Fix These Issues Automatically & Rank Higher
                </h4>
                <p className="text-xs font-mono text-violet-100 max-w-lg mx-auto leading-relaxed">
                  Sign up for HeyDrona to run full site-wide audits, connect Google Search Console & WordPress, and let AI growth agents publish automated fixes.
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-zinc-955 bg-white text-zinc-955 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-100 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  Start Free Trial <ArrowRight className="w-4 h-4 text-violet-650" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
