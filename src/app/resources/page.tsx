"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { BookOpen, HelpCircle } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-12">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-xs text-violet-650 font-bold tracking-widest uppercase font-mono">Resources</span>
          <h1 className="text-4xl font-extrabold mt-2 font-mono text-zinc-950">Learning Portal</h1>
        </div>

        <p className="text-sm leading-relaxed text-zinc-650">
          Access our latest updates, articles, and upcoming customer support guides to manage your website's search engine optimizations effectively.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <Link
            href="/blog"
            className="p-6 border-2 border-zinc-950 bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all flex flex-col justify-between h-48"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 border-2 border-zinc-950 rounded-xl bg-zinc-50 flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]">
                <BookOpen className="w-5 h-5 text-violet-505" />
              </div>
              <h3 className="font-extrabold text-sm font-mono text-zinc-900">Blog & News</h3>
              <p className="text-xs text-zinc-650 leading-relaxed">
                Read our articles on local SEO guidelines, WordPress optimization guides, and platform updates.
              </p>
            </div>
            <span className="text-xs text-violet-650 font-mono font-bold uppercase tracking-wider block mt-4">Visit Blog &rarr;</span>
          </Link>

          <div
            className="p-6 border-2 border-zinc-200 bg-zinc-100/50 rounded-2xl flex flex-col justify-between h-48 border-dashed"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 border-2 border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-zinc-400" />
              </div>
              <h3 className="font-bold text-sm font-mono text-zinc-400">User Guides</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Step-by-step documentations on connecting WordPress sites, configuring REST access keys, and diagnosing GSC accounts.
              </p>
            </div>
            <span className="text-xs text-zinc-400 font-mono font-bold uppercase tracking-wider block mt-4">Coming Soon</span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
