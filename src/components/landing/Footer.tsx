import React from "react";
import { Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t-2 border-zinc-950 bg-zinc-100 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <span className="font-bold text-sm text-zinc-950 font-mono">HeyDrona Growth Platform</span>
        </div>
        <span className="text-xs text-zinc-550 font-mono">
          &copy; 2026 HeyDrona. Built with Next.js & Gemini.
        </span>
      </div>
    </footer>
  );
};
export default Footer;
