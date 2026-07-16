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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl">
          {/* Starter Plan */}
          <div className="w-full p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden flex flex-col text-left transition-all duration-300 bg-white border-zinc-950 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
            <span className="text-xs text-violet-650 font-semibold tracking-wider uppercase mb-2 font-mono">Starter</span>
            <h3 className="text-2xl font-extrabold mb-4 text-zinc-900 font-mono">Starter Plan</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black tracking-tight text-zinc-900 font-mono">$19</span>
              <span className="text-zinc-500 font-medium">/ month</span>
            </div>
            <p className="text-xs mb-8 leading-relaxed text-zinc-650 min-h-[40px]">
              1 website, manual audits (24h cooldown), full AI fixes, WordPress one-click apply, AI chat assistant
            </p>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>1 website</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Manual audits (24h cooldown)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Full AI fixes</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>WordPress one-click apply</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>AI chat assistant</span>
              </li>
            </ul>
            <Link
              href="/signup?plan=starter"
              className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-wider font-mono text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Choose Starter
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="w-full p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden flex flex-col text-left transition-all duration-300 bg-white border-zinc-950 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] ring-2 ring-violet-600 ring-offset-2">
            <div className="absolute top-0 right-0 bg-violet-650 text-white text-[9px] uppercase tracking-widest font-bold px-4 py-1 border-l-2 border-b-2 border-zinc-950 font-mono">
              Most Popular
            </div>
            <span className="text-xs text-violet-650 font-semibold tracking-wider uppercase mb-2 font-mono">Growth</span>
            <h3 className="text-2xl font-extrabold mb-4 text-zinc-900 font-mono">Growth Plan</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black tracking-tight text-zinc-900 font-mono">$49</span>
              <span className="text-zinc-500 font-medium">/ month</span>
            </div>
            <p className="text-xs mb-8 leading-relaxed text-zinc-650 min-h-[40px]">
              Up to 3 websites, everything in Starter, weekly automatic re-scan + email digest, downloadable PDF SEO reports
            </p>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Up to 3 websites</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Everything in Starter</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Weekly automatic re-scan</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Email digests</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Downloadable PDF SEO reports</span>
              </li>
            </ul>
            <Link
              href="/signup?plan=growth"
              className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-650 to-indigo-650 rounded-xl transition-all border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              Choose Growth
            </Link>
          </div>

          {/* Agency Plan */}
          <div className="w-full p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden flex flex-col text-left transition-all duration-300 bg-white border-zinc-950 shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
            <span className="text-xs text-violet-650 font-semibold tracking-wider uppercase mb-2 font-mono">Agency</span>
            <h3 className="text-2xl font-extrabold mb-4 text-zinc-900 font-mono">Agency Plan</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-black tracking-tight text-zinc-900 font-mono">$99</span>
              <span className="text-zinc-500 font-medium">/ month</span>
            </div>
            <p className="text-xs mb-8 leading-relaxed text-zinc-650 min-h-[40px]">
              Up to 10 websites, everything in Growth, white-label PDF reports (your logo, not ours), fastest audit cooldown
            </p>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-zinc-700">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Up to 10 websites</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Everything in Growth</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>White-label PDF reports (your logo)</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Fastest audit cooldown (60m)</span>
              </li>
            </ul>
            <Link
              href="/signup?plan=agency"
              className="w-full py-3.5 text-center text-xs font-bold uppercase tracking-wider font-mono text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition-all border-2 border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              Choose Agency
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Pricing;
