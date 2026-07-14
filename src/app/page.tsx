import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Sparkles, Activity, FileText, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-violet-500 selection:text-white overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[160px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-neutral-800/50 backdrop-blur-md sticky top-0 z-50 bg-neutral-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Antigravity SEO
            </span>
            <span className="text-[10px] uppercase tracking-widest bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20 font-mono">
              Agent V1
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all hover:bg-neutral-850"
            >
              Log In
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-xl shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800/80 text-xs text-neutral-300 mb-8 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span>Automate SEO Audits & WordPress Updates</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-[1.1] mb-6">
          Your Website Audits and Grows Itself. While You Sleep.
        </h1>

        <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl leading-relaxed mb-10">
          Connect your URL. The AI agent crawls your site, optimizes SEO tags, identifies critical page errors, drafts highly targeting blog content, and applies changes directly to WordPress.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-2xl shadow-xl shadow-violet-600/30 hover:shadow-violet-600/40 hover:scale-[1.03] transition-all flex items-center justify-center gap-2"
          >
            Launch Growth Agent <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#how-it-works" 
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-neutral-300 hover:text-white bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 rounded-2xl backdrop-blur-sm transition-all flex items-center justify-center"
          >
            See How it Works
          </a>
        </div>

        {/* Dashboard Preview / Mock */}
        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-neutral-800/80 bg-neutral-900/40 p-4 backdrop-blur-sm shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent -bottom-2 z-10 rounded-2xl pointer-events-none" />
          
          {/* Header Mock */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60 mb-6">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-neutral-800" />
              <span className="w-3 h-3 rounded-full bg-neutral-800" />
              <span className="w-3 h-3 rounded-full bg-neutral-800" />
            </div>
            <div className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800/80 text-xs text-neutral-500 font-mono">
              https://yoursalon.com
            </div>
            <span className="text-xs text-violet-400 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-spin" /> Crawl & Audit Active
            </span>
          </div>

          {/* Cards Grid Mock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-xl border border-neutral-850 bg-neutral-900/60">
              <span className="text-xs text-neutral-400 font-medium">Performance Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-emerald-400">92</span>
                <span className="text-xs text-emerald-500 font-semibold">↑ 14%</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[92%]" />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-neutral-850 bg-neutral-900/60">
              <span className="text-xs text-neutral-400 font-medium">SEO Health Index</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-violet-400">88%</span>
                <span className="text-xs text-violet-400 font-semibold">New suggestions ready</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full w-[88%]" />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-neutral-850 bg-neutral-900/60">
              <span className="text-xs text-neutral-400 font-medium">WordPress Integration</span>
              <div className="flex items-center gap-2 mt-2.5 text-neutral-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-semibold">Active & Configured</span>
              </div>
              <span className="text-xs text-neutral-500 block mt-2">Author mode enabled</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 border-t border-neutral-900 bg-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Everything Your Website Needs to Rank
            </h2>
            <p className="text-neutral-400">
              Traditional agencies charge thousands for what our agent runs hourly. Automated optimization, built for small service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/20 hover:border-violet-500/20 hover:bg-neutral-900/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-100">Deep Link Crawler</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Checks all internal pages, maps header hierarchy, verifies meta titles, validates description length, and checks schema compatibility.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/20 hover:border-violet-500/20 hover:bg-neutral-900/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-100">AI Content Builder</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Gemini identifies business-relevant search terms and content gaps, drafting blog posts complete with headers and tags, tailored to your site's audience.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-neutral-900 bg-neutral-900/20 hover:border-violet-500/20 hover:bg-neutral-900/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-neutral-100">WordPress REST Pushes</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                No copy-pasting code or formatting blocks. Connect your WordPress account securely, and approve drafts to push them instantly into your dashboard as drafts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 border-t border-neutral-900 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Security First, Full Human Control
            </h2>
            <p className="text-neutral-400">
              Nothing gets updated without your approval. Enjoy the ease of automated drafts with the safety of manual verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-semibold text-neutral-100 mb-2">Connect site</h4>
              <p className="text-xs text-neutral-400 max-w-[200px]">Enter your domain. Connect WordPress application details if available.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-semibold text-neutral-100 mb-2">Crawling & Auditing</h4>
              <p className="text-xs text-neutral-400 max-w-[200px]">The backend crawls your URLs, checks titles, broken links, speed, and schema.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-semibold text-neutral-100 mb-2">AI Generation</h4>
              <p className="text-xs text-neutral-400 max-w-[200px]">Gemini suggests precise fixes and writes 2 custom blog post drafts targeting gaps.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-sm flex items-center justify-center mb-4">
                4
              </div>
              <h4 className="font-semibold text-neutral-100 mb-2">Approve to Publish</h4>
              <p className="text-xs text-neutral-400 max-w-[200px]">Review updates on your dashboard. One click pushes drafts live to WordPress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-neutral-900 bg-neutral-950">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-transparent">
              Simple, Affordable Pricing
            </h2>
            <p className="text-neutral-400">
              One straightforward subscription. No hourly consulting fees, no binding lockups, no surprise charges.
            </p>
          </div>

          <div className="w-full max-w-md p-8 rounded-3xl border border-violet-500/20 bg-neutral-900/50 backdrop-blur-md relative overflow-hidden flex flex-col text-left">
            <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-1.5 rounded-bl-xl">
              MVP Special
            </div>
            
            <span className="text-xs text-violet-400 font-semibold tracking-wider uppercase mb-2">Unlimited Audits</span>
            <h3 className="text-2xl font-bold text-neutral-100 mb-4">AI Website Growth Partner</h3>
            
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold text-neutral-100">$19</span>
              <span className="text-sm text-neutral-400">/ month</span>
            </div>

            <p className="text-sm text-neutral-400 mb-8">
              Perfect for local service providers, doctors, contractors, salons, and digital storefronts trying to rank on Google.
            </p>

            <ul className="space-y-4 mb-8 flex-1 text-sm text-neutral-300">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                <span>Unlimited automated SEO site audits</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                <span>Automatic meta-tag fixes generation</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                <span>2-3 blog post drafts written per week</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                <span>WordPress application password auto-publish</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                <span>Weekly automated updates notification</span>
              </li>
            </ul>

            <Link 
              href="/dashboard" 
              className="w-full py-4 text-center text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-xl transition-all shadow-lg shadow-violet-600/20"
            >
              Get Started Instantly
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-900 bg-neutral-950 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="font-semibold text-sm text-neutral-300">Antigravity Growth Agent</span>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            &copy; 2026 Antigravity. Built with Next.js & Gemini.
          </span>
        </div>
      </footer>
    </div>
  );
}
