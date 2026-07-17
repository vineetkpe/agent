import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="border-b-2 sticky top-0 z-50 transition-colors duration-300 border-zinc-950 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight font-mono text-zinc-950">
            HeyDrona<span className="text-violet-500">.</span>
          </span>
          <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded font-mono font-bold border-2 bg-zinc-100 text-violet-600 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            SaaS Platform
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider font-mono text-zinc-500">
          <Link href="/#pricing" className="transition-colors hover:text-zinc-950">Pricing</Link>
          <Link href="/company" className="transition-colors hover:text-zinc-950">Company</Link>
          <Link href="/services" className="transition-colors hover:text-zinc-950">Services</Link>
          <Link href="/resources" className="transition-colors hover:text-zinc-950">Resources</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-mono border-2 rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] text-zinc-950 bg-white border-zinc-950 hover:bg-zinc-50 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
          >
            Sign In
          </Link>

          <Link
            href="/signup"
            className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-mono text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl transition-all flex items-center gap-2 border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:scale-[1.02] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
export default Header;
