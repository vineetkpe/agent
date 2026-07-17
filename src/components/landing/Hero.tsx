import React from "react";
import Link from "next/link";
import { Sparkle, ArrowRight } from "lucide-react";

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-24 pb-20 px-6 w-full text-center flex flex-col items-center overflow-visible">
      {/* Content Container */}
      <div className="max-w-4xl mx-auto flex flex-col items-center relative z-0 w-full">
        {/* Banner Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 text-xs mb-8 transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] bg-gradient-to-r from-violet-50 to-indigo-50 border-zinc-950 text-zinc-705 font-medium hover:scale-[1.02] hover:-rotate-1 cursor-pointer">
          <Sparkle className="w-4 h-4 text-violet-505 animate-spin-slow" />
          <span className="font-semibold tracking-wide font-mono">
            REAL SEO OPTIMIZATION FOR GROWING BUSINESSES
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-8 font-sans text-zinc-950">
          Your website's SEO, fixed.{" "}
          <span className="underline decoration-violet-500 decoration-wavy decoration-3 underline-offset-8 whitespace-nowrap">
            No agency fees
          </span>
          <br className="hidden md:inline" /> and no tech skills needed.
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl max-w-2xl leading-relaxed mb-12 transition-colors duration-300 text-zinc-650">
          HeyDrona scans your site to identify technical SEO errors, drafts high-quality blog outlines targeting key search terms, and gives you one-click fixes you can review and apply instantly.
        </p>

        {/* Hero CTA Buttons with thick borders */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center w-full max-w-2xl px-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl transition-all border-2 border-zinc-950 flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] shrink-0"
          >
            Get Started <ArrowRight className="w-4.5 h-4.5" />
          </Link>
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 text-xs font-bold uppercase tracking-wider font-mono border-2 rounded-xl transition-all flex items-center justify-center bg-white border-zinc-950 text-zinc-955 shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(139,92,246,1)] shrink-0"
          >
            See Pricing
          </a>
        </div>
      </div>
    </section>
  );
};
export default Hero;
