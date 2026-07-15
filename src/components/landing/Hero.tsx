import React from "react";
import Link from "next/link";
import { Sparkle, ArrowRight } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-24 pb-20 px-6 w-full text-center flex flex-col items-center overflow-visible">
      {/* Floating Decorative Badges for Desktop */}
      <div className="hidden xl:block absolute left-[3%] 2xl:left-[8%] top-[60%] -translate-y-1/2 w-56 p-4 bg-white border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] rotate-[-4deg] hover:rotate-0 hover:scale-105 transition-all duration-300 z-10 select-none">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-extrabold tracking-widest font-mono text-zinc-500 uppercase">
            CRAWLER STATUS
          </span>
        </div>
        <p className="text-sm font-black text-zinc-950 font-sans">SEO Audit Score: 94%</p>
        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">4 issues fixed automatically</p>
      </div>

      <div className="hidden xl:block absolute right-[3%] 2xl:right-[8%] top-[60%] -translate-y-1/2 w-56 p-4 bg-white border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] rotate-[4deg] hover:rotate-0 hover:scale-105 transition-all duration-300 z-10 select-none">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkle className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
          <span className="text-[9px] font-extrabold tracking-widest font-mono text-zinc-500 uppercase">
            INTEGRATION SYNC
          </span>
        </div>
        <p className="text-sm font-black text-zinc-950 font-sans">CMS Sync: Connected</p>
        <p className="text-[9px] text-zinc-400 font-mono mt-0.5">API connection active</p>
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-0 w-full">
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-xs mb-8 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] bg-gradient-to-r from-violet-50 to-indigo-50 border-zinc-950 text-zinc-700 font-medium hover:scale-[1.02] hover:-rotate-1 cursor-pointer">
          <Sparkle className="w-4 h-4 text-violet-500 animate-spin-slow" />
          <span className="font-semibold tracking-wide font-mono">
            RETENTION ENGINE FOR WEB TRAFFIC GROWTH
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8 font-sans text-zinc-950">
          Your first autonomous{" "}
          <span className="underline decoration-violet-500 decoration-wavy decoration-3 underline-offset-8 whitespace-nowrap">
            AI Employee
          </span>
          <br className="hidden md:inline" /> for digital growth.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-12 transition-colors duration-300 text-zinc-600">
          Connect your URL and your CMS. HeyDrona crawls your pages, fixes metadata errors, targets keyword gaps,
          writes SEO outline copy, and publishes drafts instantly.
        </p>

        {/* Hero CTA Buttons with thick borders */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-2xl px-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl transition-all border-2 border-zinc-950 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] shrink-0"
          >
            Deploy AI Growth Worker <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <a
            href="#sandbox"
            className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-wider font-mono border-2 rounded-xl transition-all flex items-center justify-center bg-white border-zinc-950 text-zinc-950 shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(139,92,246,1)] shrink-0"
          >
            Run Interactive Sandbox
          </a>
        </div>
      </div>
    </section>
  );
};
export default Hero;
