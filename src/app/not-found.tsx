import React from "react";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans text-zinc-800 p-6 selection:bg-violet-500 selection:text-white">
      <div className="max-w-md w-full p-8 rounded-3xl border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] text-center">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-zinc-950 flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
          <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />
        </div>

        {/* Status Pill */}
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Page Omission
        </span>

        {/* Headline */}
        <h2 className="text-2xl font-black font-mono mt-4 mb-2 text-zinc-950 uppercase tracking-tight">
          404 - Not Found
        </h2>

        {/* Explanations */}
        <p className="text-sm text-zinc-550 leading-relaxed mb-8">
          The requested page node is not active or has been skipped by our router structure. Please check the URL pattern and retry.
        </p>

        {/* Home Button link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-violet-600 text-white border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] transition-all"
        >
          <Home className="w-4 h-4" /> Go back home
        </Link>
      </div>
    </div>
  );
}
