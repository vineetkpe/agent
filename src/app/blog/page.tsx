"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { BookOpen } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-2xl border-2 border-zinc-955 bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
          <BookOpen className="w-8 h-8 text-violet-650" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold font-mono text-zinc-950">HeyDrona Blog</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-450 font-bold bg-zinc-100 px-3 py-1 rounded border border-zinc-250 inline-block">
            Coming Soon
          </p>
        </div>
        <p className="text-sm leading-relaxed text-zinc-650 text-center max-w-md">
          We are currently preparing educational guides, site auditing tips, and news posts to help you grow your local business search visibility. Check back soon for our first published write-up.
        </p>
      </main>
      <Footer />
    </div>
  );
}
