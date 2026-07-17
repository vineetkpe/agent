import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-2 border-zinc-950 bg-zinc-100 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-605" />
            <span className="font-extrabold text-sm text-zinc-950 font-mono">HeyDrona</span>
          </div>
          <p className="text-xs text-zinc-650 max-w-xs leading-relaxed font-mono">
            Optimizing search relevance and technical health for local business websites.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-12 gap-y-6 text-xs font-bold uppercase tracking-wider font-mono text-zinc-600">
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] text-zinc-400">Product</span>
            <Link href="/#pricing" className="hover:text-zinc-955">Pricing</Link>
            <Link href="/services" className="hover:text-zinc-955">Services</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] text-zinc-400">Company</span>
            <Link href="/company" className="hover:text-zinc-955">About Us</Link>
            <Link href="/blog" className="hover:text-zinc-955">Blog</Link>
            <Link href="/resources" className="hover:text-zinc-955">Resources</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] text-zinc-400">Legal</span>
            <Link href="/privacy" className="hover:text-zinc-955">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-955">Terms of Service</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] text-zinc-400">Support</span>
            <a href="mailto:support@heydrona.com" className="hover:text-zinc-955 lowercase">support@heydrona.com</a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-zinc-250 mt-8 pt-8 flex items-center justify-between font-mono text-xs text-zinc-500">
        <span>&copy; {new Date().getFullYear()} HeyDrona. All rights reserved.</span>
      </div>
    </footer>
  );
};
export default Footer;
