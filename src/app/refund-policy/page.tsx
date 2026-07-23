"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-8 font-mono text-xs">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-[10px] text-violet-650 font-bold tracking-widest uppercase block">Legal Documentation</span>
          <h1 className="text-3xl font-extrabold mt-2 uppercase text-zinc-905">Refund Policy</h1>
          <p className="text-zinc-500 mt-2">Last updated: July 24, 2026</p>
        </div>

        <div className="p-4 rounded-xl border-2 border-amber-955 bg-amber-50 text-amber-900 leading-relaxed font-bold">
          ⚠️ Founder Review Notice: Please review and confirm the exact refund timeline and policy terms below prior to commercial launch.
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">1. Subscription Plans & Cancellation</h2>
          <p className="leading-relaxed text-zinc-650">
            HeyDrona operates as a self-service software-as-a-service (SaaS) subscription platform billed on a monthly or annual cycle. You may cancel your subscription at any time directly through your billing portal settings (`/dashboard`). When you cancel, your account remains active until the end of your current paid billing period, and no further recurring charges will be processed.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">2. Refund Terms</h2>
          <p className="leading-relaxed text-zinc-650">
            Because our AI growth agents immediately consume third-party crawling, API generation, and server resources upon account setup:
          </p>
          <ul className="list-disc pl-6 space-y-2 leading-relaxed text-zinc-650">
            <li><strong>Initial 7-Day Window</strong> — If you are dissatisfied with your subscription within 7 calendar days of your initial purchase, you may request a full refund by contacting support.</li>
            <li><strong>Monthly Renewals</strong> — Recurring monthly renewal charges are non-refundable once processed, but cancellation takes effect at the period end so you retain full access for the paid duration.</li>
            <li><strong>Annual Subscriptions</strong> — Annual plan cancellations submitted within 14 days of purchase or renewal are eligible for a prorated refund minus one month's standard usage fee.</li>
            <li><strong>Billing Errors</strong> — If you experience duplicate charges, incorrect plan tiers, or technical billing errors caused by platform failure, we will issue a full refund upon verification.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">3. Requesting a Refund</h2>
          <p className="leading-relaxed text-zinc-650">
            To request a refund, please contact us at <a href="mailto:support@heydrona.com" className="text-violet-650 underline">support@heydrona.com</a> or submit a message via our <a href="/contact" className="text-violet-650 underline">Contact Page</a> with your account email address and invoice ID. Approved refunds are processed back to the original Stripe payment method within 5-10 business days.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
