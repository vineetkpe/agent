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
          <p className="text-zinc-500 mt-2">Last updated: July 18, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">1. Acceptance of Terms</h2>
          <p className="leading-relaxed text-zinc-650">
            By creating an account, establishing CMS synchronization, or utilizing HeyDrona's site auditing diagnostics tools, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, do not use the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">2. Description of Services</h2>
          <p className="leading-relaxed text-zinc-650">
            HeyDrona provides technical website crawler scans, PageSpeed analytics score reporting, SEO description and title generation recommendations, Google Search Console analytics dashboards, and WordPress integration helpers. All AI-generated changes are presented as suggestions and are only applied to your website upon your manual, explicit click-approval. HeyDrona is a productivity and analysis tool — it does not guarantee specific search engine rankings, organic traffic volumes, or business outcomes.
          </p>
          <p className="leading-relaxed text-zinc-650 italic border-l-2 border-amber-400 pl-4 bg-amber-50 py-2 pr-2 rounded-r-lg">
            <strong>SEO Disclaimer:</strong> Search engine rankings are determined by third-party platforms (Google, Bing, etc.) using proprietary, unpublished algorithms subject to change at any time. No SEO tool, including HeyDrona, can guarantee specific ranking positions, traffic levels, or revenue outcomes. Results vary depending on competition, domain authority, content quality, and factors entirely outside our control.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">3. User Responsibility & Content Safety</h2>
          <p className="leading-relaxed text-zinc-650">
            You maintain full responsibility for all credentials connected, optimization fixes applied, and AI-drafted blog content published to your CMS domain. You are solely responsible for reviewing AI-generated content before publishing. We make no representation that our AI-generated suggestions are accurate, complete, or free of error. You are responsible for maintaining independent backups of your website content and database before applying any AI-generated changes. HeyDrona is not liable for any data loss, CMS disruptions, or site performance issues arising from applied changes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">4. Subscriptions, Payments & Grace Period</h2>
          <p className="leading-relaxed text-zinc-650">
            Paid subscription plans are billed in advance on a recurring monthly or annual schedule via Stripe. If a payment fails, your account enters a <strong>7-day grace period</strong> during which full access is maintained and our billing provider will automatically retry the charge. If payment is not resolved within the grace period, access may be restricted to the free tier. You may cancel your subscription at any time via the Settings page in your dashboard. Cancellation takes effect at the end of the current billing cycle. Refunds are handled on a case-by-case basis at our sole discretion. To request a refund, contact support@heydrona.com within 7 days of charge.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">5. Liability Limitation</h2>
          <p className="leading-relaxed text-zinc-650">
            To the maximum extent permitted by applicable law, HeyDrona's total cumulative liability to you for any claim arising out of or related to these Terms or the Services shall not exceed the total fees you paid to HeyDrona in the <strong>three (3) months immediately preceding the event giving rise to the claim</strong>. In no event shall HeyDrona be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data loss, or business interruption.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">6. Dispute Resolution & Governing Law</h2>
          <p className="leading-relaxed text-zinc-650">
            These Terms are governed by the laws of India. Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be resolved exclusively through binding arbitration. Arbitration proceedings shall be conducted in English and shall be seated in Nagpur, Maharashtra, India. The arbitrator's decision shall be final and binding, and may be enforced in any court of competent jurisdiction. Each party shall bear its own legal costs unless the arbitrator determines otherwise.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">7. Changes to Terms</h2>
          <p className="leading-relaxed text-zinc-650">
            We reserve the right to revise these Terms of Service at any time. We will provide notice of significant changes by updating the "Last updated" date above and, where reasonably practicable, by notifying you by email. Your continued use of the platform after updates have been posted constitutes acceptance of those changes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">8. Contact</h2>
          <p className="leading-relaxed text-zinc-650">
            For questions about these Terms, email us at <a href="mailto:support@heydrona.com" className="text-violet-600 underline">support@heydrona.com</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
