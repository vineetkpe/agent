"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error telemetry
    console.error("[Global Page Error]:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans text-zinc-800 p-6 selection:bg-violet-500 selection:text-white">
      <div className="max-w-md w-full p-8 rounded-3xl border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] text-center">
        {/* Error Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-zinc-950 flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
          <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
        </div>

        {/* Status Pill */}
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
          Render Exception
        </span>

        {/* Headline */}
        <h2 className="text-2xl font-black font-mono mt-4 mb-2 text-zinc-950 uppercase tracking-tight">
          Oops, something went wrong!
        </h2>

        {/* Explanations */}
        <p className="text-sm text-zinc-550 leading-relaxed mb-8">
          A runtime execution crash was encountered in the client thread. Please trigger the re-renderer fallback below.
        </p>

        {/* Reset button */}
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 px-6 py-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-violet-600 text-white border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    </div>
  );
}
