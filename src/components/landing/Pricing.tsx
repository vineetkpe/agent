import React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 px-6 border-t-2 border-zinc-950 bg-zinc-50">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs text-violet-600 font-bold tracking-widest uppercase font-mono">Pricing Plans</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mt-2 mb-4 tracking-tight text-zinc-900 font-mono">
            Streamlined, Affordable Scaling
          </h2>
          <p className="text-zinc-650 text-sm">
            Deploy your dedicated Growth Employee for less than the cost of a single hourly consulting call.
          </p>
        </div>

        <div className="w-full max-w-md p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden flex flex-col text-left transition-all duration-300 bg-white border-zinc-950 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
          <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 border-l-2 border-b-2 border-zinc-950 font-mono">
            V1 Launch Special
          </div>

          <span className="text-xs text-violet-600 font-semibold tracking-wider uppercase mb-2 font-mono">
            Autonomous Agent
          </span>
          <h3 className="text-2xl font-extrabold mb-4 text-zinc-900 font-mono">AI Web Growth Employee</h3>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-5xl font-black tracking-tight text-zinc-900 font-mono">$19</span>
            <span className="text-zinc-500 font-medium">/ month</span>
          </div>

          <p className="text-sm mb-8 leading-relaxed text-zinc-600">
            Perfect for startups, businesses, local agencies, and store owners seeking to systematically rank on search
            platforms.
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
            href="/signup"
            className="w-full py-4 text-center text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl transition-all border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Get Started Instantly
          </Link>
        </div>
      </div>
    </section>
  );
};
export default Pricing;
