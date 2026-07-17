"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function CompanyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-12">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-xs text-violet-650 font-bold tracking-widest uppercase font-mono">Company</span>
          <h1 className="text-4xl font-extrabold mt-2 font-mono text-zinc-950">About HeyDrona</h1>
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-bold font-mono text-zinc-900">What HeyDrona Is</h2>
          <p className="text-sm leading-relaxed text-zinc-650">
            HeyDrona is a streamlined SEO audit and content outline platform built to help local businesses achieve search engine presence. We crawl your web pages to spot broken links, missing meta descriptions, duplicate title tags, and image alt text omissions, suggesting direct corrections you can apply with one click.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-bold font-mono text-zinc-900">Who It's For</h2>
          <p className="text-sm leading-relaxed text-zinc-650">
            We built this tool specifically for dentists, plumbers, salons, and local service providers. These business owners often cannot afford a $2,000/month agency contract, and do not have the technical expertise to perform complex SEO updates. HeyDrona provides a clear, high-contrast dashboard to fix technical mistakes without writing code.
          </p>
        </section>

        <section className="p-8 border-2 border-zinc-950 rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] space-y-4">
          <h3 className="text-lg font-bold font-mono text-zinc-900">Note from the Founder</h3>
          <p className="text-xs leading-relaxed text-zinc-650 italic">
            &quot;HeyDrona was born out of frustration. I saw small business owners overpaying marketing agencies thousands of dollars a month for basic SEO check-ups that could easily be automated. We don't claim to be an automated agency, and we won't pretend we have hundreds of team members. It is just me building a tool to keep your website healthy and structured for search visibility. I hope it saves you time and marketing spend.&quot;
          </p>
          <div className="pt-2 text-xs font-mono font-bold text-zinc-700">
            — Vineet, Founder of HeyDrona
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
