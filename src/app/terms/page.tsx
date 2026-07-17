"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-8 font-mono text-xs">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-[10px] text-violet-650 font-bold tracking-widest uppercase block">Legal Documentation</span>
          <h1 className="text-3xl font-extrabold mt-2 uppercase text-zinc-905">Terms of Service</h1>
          <p className="text-zinc-500 mt-2">Last updated: July 17, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">1. Acceptance of Terms</h2>
          <p className="leading-relaxed text-zinc-650">
            By creating an account, establishing CMS synchronization, or utilizing HeyDrona's site auditing diagnostics tools, you agree to comply with and be bound by these Terms of Service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">2. Description of Services</h2>
          <p className="leading-relaxed text-zinc-650">
            HeyDrona provides technical website crawler scans, PageSpeed analytics score reporting, SEO description and title generation recommendations, GSC analytics dashboard, and WordPress integration helpers. All changes are generated as suggestions and are only applied to your website upon your manual, explicit click-approval.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">3. User Responsibility & Content Safety</h2>
          <p className="leading-relaxed text-zinc-650">
            You maintain full responsibility for credentials connected, optimization fixes applied, and AI outline blog drafts published to your CMS domain. We provide no guarantee that search engine indices or ranking trajectories will improve, and we are not liable for any ranking fluctuations, crawl budget exhaustion, or site performance errors.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">4. Subscriptions & Refunds</h2>
          <p className="leading-relaxed text-zinc-650">
            Paid subscription plans are billed in advance on a recurring monthly or annual schedule via Stripe. You may cancel your subscription at any time within your billing panel. Refunds are handled on a case-by-case basis.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">5. Changes to Terms</h2>
          <p className="leading-relaxed text-zinc-650">
            We reserve the right to revise these Terms of Service at any time. Your continued use of the platform after updates have been posted constitutes acceptance of those changes.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
