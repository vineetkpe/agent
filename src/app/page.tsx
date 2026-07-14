import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Zap, Sparkles, Activity, FileText, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-850 flex flex-col selection:bg-violet-500 selection:text-white overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[160px] -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-200/80 backdrop-blur-md sticky top-0 z-50 bg-white/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-zinc-950 to-zinc-700 bg-clip-text text-transparent">
              Antigravity SEO
            </span>
            <span className="text-[10px] uppercase tracking-widest bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-full border border-violet-500/20 font-mono">
              Agent V1
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-650">
            <a href="#features" className="hover:text-zinc-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-zinc-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-zinc-750 bg-white border border-zinc-250 hover:border-zinc-350 rounded-xl transition-all hover:bg-zinc-50"
            >
              Log In
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs text-zinc-700 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span>Automate SEO Audits & WordPress Updates</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-750 bg-clip-text text-transparent leading-[1.1] mb-6">
          Your Website Audits and Grows Itself. While You Sleep.
        </h1>

        <p className="text-lg sm:text-xl text-zinc-600 max-w-2xl leading-relaxed mb-10">
          Connect your URL. The AI agent crawls your site, optimizes SEO tags, identifies critical page errors, drafts highly targeting blog content, and applies changes directly to WordPress.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all flex items-center justify-center gap-2"
          >
            Launch Growth Agent <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#how-it-works" 
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-zinc-750 hover:text-zinc-950 bg-white border border-zinc-250 hover:border-zinc-350 rounded-2xl shadow-sm transition-all flex items-center justify-center"
          >
            See How it Works
          </a>
        </div>

        {/* Dashboard Preview / Mock */}
        <div className="mt-20 w-full max-w-5xl rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-50 via-transparent to-transparent -bottom-2 z-10 rounded-2xl pointer-events-none" />
          
          {/* Header Mock */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-zinc-200" />
              <span className="w-3 h-3 rounded-full bg-zinc-200" />
              <span className="w-3 h-3 rounded-full bg-zinc-200" />
            </div>
            <div className="px-3 py-1 rounded-lg bg-zinc-50 border border-zinc-150 text-xs text-zinc-500 font-mono">
              https://yoursalon.com
            </div>
            <span className="text-xs text-violet-600 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-spin" /> Crawl & Audit Active
            </span>
          </div>

          {/* Cards Grid Mock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-xl border border-zinc-150 bg-zinc-50/50">
              <span className="text-xs text-zinc-500 font-medium font-sans">Performance Score</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-emerald-600">92</span>
                <span className="text-xs text-emerald-600 font-semibold">↑ 14%</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[92%]" />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-zinc-150 bg-zinc-50/50">
              <span className="text-xs text-zinc-500 font-medium">SEO Health Index</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-violet-650 font-sans">88%</span>
                <span className="text-xs text-violet-600 font-semibold">Suggestions ready</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-violet-500 h-full rounded-full w-[88%]" />
              </div>
            </div>

            <div className="p-5 rounded-xl border border-zinc-150 bg-zinc-50/50">
              <span className="text-xs text-zinc-500 font-medium">WordPress Integration</span>
              <div className="flex items-center gap-2 mt-2.5 text-zinc-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold">Active & Connected</span>
              </div>
              <span className="text-xs text-zinc-450 block mt-2">Author mode enabled</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 border-t border-zinc-200/80 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
              Everything Your Website Needs to Rank
            </h2>
            <p className="text-zinc-650">
              Traditional agencies charge thousands for what our agent runs hourly. Automated optimization, built for small service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-zinc-100 bg-zinc-50/30 hover:border-violet-500/20 hover:bg-zinc-50/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/5 border border-violet-500/10 flex items-center justify-center text-violet-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">Deep Link Crawler</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Checks all internal pages, maps header hierarchy, verifies meta titles, validates description length, and checks schema compatibility.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-zinc-100 bg-zinc-50/30 hover:border-violet-500/20 hover:bg-zinc-50/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/5 border border-violet-500/10 flex items-center justify-center text-violet-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">AI Content Builder</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Gemini identifies business-relevant search terms and content gaps, drafting blog posts complete with headers and tags, tailored to your site's audience.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-zinc-100 bg-zinc-50/30 hover:border-violet-500/20 hover:bg-zinc-50/60 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-violet-600/5 border border-violet-500/10 flex items-center justify-center text-violet-600 mb-6 group-hover:scale-110 transition-transform shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-900">WordPress REST Pushes</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                No copy-pasting code or formatting blocks. Connect your WordPress account securely, and approve drafts to push them instantly into your dashboard as drafts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-6 border-t border-zinc-200/80 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
              Security First, Full Human Control
            </h2>
            <p className="text-zinc-650">
              Nothing gets updated without your approval. Enjoy the ease of automated drafts with the safety of manual verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 text-zinc-600 font-mono text-sm flex items-center justify-center mb-4 shadow-sm">
                1
              </div>
              <h4 className="font-bold text-zinc-850 mb-2 text-sm">Connect site</h4>
              <p className="text-xs text-zinc-500 max-w-[200px]">Enter your domain. Connect WordPress application details if available.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 text-zinc-600 font-mono text-sm flex items-center justify-center mb-4 shadow-sm">
                2
              </div>
              <h4 className="font-bold text-zinc-850 mb-2 text-sm">Crawling & Auditing</h4>
              <p className="text-xs text-zinc-500 max-w-[200px]">The backend crawls your URLs, checks titles, broken links, speed, and schema.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 text-zinc-600 font-mono text-sm flex items-center justify-center mb-4 shadow-sm">
                3
              </div>
              <h4 className="font-bold text-zinc-850 mb-2 text-sm">AI Generation</h4>
              <p className="text-xs text-zinc-500 max-w-[200px]">Gemini suggests precise fixes and writes 2 custom blog post drafts targeting gaps.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-white border border-zinc-200 text-zinc-600 font-mono text-sm flex items-center justify-center mb-4 shadow-sm">
                4
              </div>
              <h4 className="font-bold text-zinc-850 mb-2 text-sm">Approve to Publish</h4>
              <p className="text-xs text-zinc-500 max-w-[200px]">Review updates on your dashboard. One click pushes drafts live to WordPress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 border-t border-zinc-200/80 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-zinc-900 to-zinc-700 bg-clip-text text-transparent">
              Simple, Affordable Pricing
            </h2>
            <p className="text-zinc-650">
              One straightforward subscription. No hourly consulting fees, no binding lockups, no surprise charges.
            </p>
          </div>

          <div className="w-full max-w-md p-8 rounded-3xl border border-violet-500/20 bg-white shadow-xl relative overflow-hidden flex flex-col text-left">
            <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-1.5 rounded-bl-xl">
              MVP Special
            </div>
            
            <span className="text-xs text-violet-600 font-semibold tracking-wider uppercase mb-2">Unlimited Audits</span>
            <h3 className="text-2xl font-bold text-zinc-900 mb-4">AI Website Growth Partner</h3>
            
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-extrabold text-zinc-900">$19</span>
              <span className="text-sm text-zinc-500">/ month</span>
            </div>

            <p className="text-sm text-zinc-600 mb-8">
              Perfect for local service providers, doctors, contractors, salons, and digital storefronts trying to rank on Google.
            </p>

            <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Unlimited automated SEO site audits</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Automatic meta-tag fixes generation</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>2-3 blog post drafts written per week</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>WordPress application password auto-publish</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0" />
                <span>Weekly automated updates notification</span>
              </li>
            </ul>

            <Link 
              href="/dashboard" 
              className="w-full py-4 text-center text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 rounded-xl transition-all shadow-md shadow-violet-600/10 hover:shadow-lg"
            >
              Get Started Instantly
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200/80 bg-zinc-50 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            <span className="font-semibold text-sm text-zinc-700">Antigravity Growth Agent</span>
          </div>
          <span className="text-xs text-zinc-450 font-mono">
            &copy; 2026 Antigravity. Built with Next.js & Gemini.
          </span>
        </div>
      </footer>
    </div>
  );
}
