"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-8 font-mono text-xs">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-[10px] text-violet-650 font-bold tracking-widest uppercase block">Legal Documentation</span>
          <h1 className="text-3xl font-extrabold mt-2 uppercase text-zinc-905">Privacy Policy</h1>
          <p className="text-zinc-500 mt-2">Last updated: July 17, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">1. Information We Collect</h2>
          <p className="leading-relaxed text-zinc-650">
            We collect the email address you provide upon registration. Additionally, when you authorize Google Search Console or connect your website details (including URLs, WP usernames, and restricted CMS application keys), we collect and store those variables to retrieve crawl configurations, search performance statistics, and publish authorized outlines.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">2. How We Use Information</h2>
          <p className="leading-relaxed text-zinc-650">
            We utilize collected credentials to fetch search performance indices, diagnose on-page HTML errors, generate priority SEO fix suggestions, and upload drafts you approve directly to your site. We do not sell your personal or site data to third parties, and we do not use GSC data for any advertising purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">3. Least-Privilege & Data Security</h2>
          <p className="leading-relaxed text-zinc-650">
            We do not store primary site passwords. We request localized CMS application passwords with limited access (such as Editor/Author roles). Your Google OAuth tokens are encrypted before being saved.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">4. Third-Party Integrations</h2>
          <p className="leading-relaxed text-zinc-650">
            Our search diagnostics board connects with Google APIs for site index querying and with Stripe for payment processing. Refer to Google and Stripe privacy rules for terms concerning those channels.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">5. Contact Information</h2>
          <p className="leading-relaxed text-zinc-650">
            If you have questions about this privacy statement, please email us at support@heydrona.com.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
