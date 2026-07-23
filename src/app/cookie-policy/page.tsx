"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-8 font-mono text-xs">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-[10px] text-violet-650 font-bold tracking-widest uppercase block">Legal Documentation</span>
          <h1 className="text-3xl font-extrabold mt-2 uppercase text-zinc-905">Cookie Policy</h1>
          <p className="text-zinc-500 mt-2">Last updated: July 24, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">1. What Are Cookies</h2>
          <p className="leading-relaxed text-zinc-650">
            Cookies are small text files placed on your device when you visit websites. They are widely used to make websites work efficiently, provide secure authentication, and remember user preferences across sessions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">2. Cookies We Use</h2>
          <p className="leading-relaxed text-zinc-650">
            HeyDrona uses strictly necessary and functional cookies only. We do <strong>not</strong> use cross-site tracking cookies, third-party advertising cookies, or data-broker profiling tools.
          </p>
          <ul className="list-disc pl-6 space-y-2 leading-relaxed text-zinc-650">
            <li><strong>Essential Session Cookies</strong> — Managed via Supabase Auth (`sb-access-token`, `sb-refresh-token`) to maintain your authenticated login session securely across page loads.</li>
            <li><strong>Functional Preference Cookies</strong> — Small local storage keys used to store active workspace state and UI preferences within the dashboard.</li>
            <li><strong>Security & Anti-Abuse Cookies</strong> — Temporary CSRF and rate-limiting markers used to protect API routes against automated spam and unauthorized requests.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">3. Third-Party Services</h2>
          <p className="leading-relaxed text-zinc-650">
            When you interact with integrated billing or authentication providers (such as Stripe for payments or Google for OAuth sign-in), those services may set their own essential cookies governed by their respective privacy policies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">4. Managing Cookies</h2>
          <p className="leading-relaxed text-zinc-650">
            You can choose to block or delete cookies through your browser settings. However, disabling essential authentication cookies will prevent you from signing in or managing your account dashboard.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">5. Contact Us</h2>
          <p className="leading-relaxed text-zinc-650">
            If you have questions about our Cookie Policy, please contact us at <a href="mailto:support@heydrona.com" className="text-violet-650 underline">support@heydrona.com</a> or via our <a href="/contact" className="text-violet-650 underline">Contact Page</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
