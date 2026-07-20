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
          <p className="text-zinc-500 mt-2">Last updated: July 18, 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">1. Information We Collect</h2>
          <p className="leading-relaxed text-zinc-650">
            We collect only the information required to provide our SEO analysis and CMS integration services. Specifically, we collect and store the following:
          </p>
          <ul className="list-disc pl-6 space-y-2 leading-relaxed text-zinc-650">
            <li><strong>Email address</strong> — collected during account registration via Google OAuth (managed by Supabase Auth).</li>
            <li><strong>Site URLs</strong> — the public web addresses you add to your workspace for crawling and analysis.</li>
            <li><strong>Crawled page body text</strong> — publicly accessible text content retrieved from your site's pages, used solely to generate SEO suggestions and business profile summaries.</li>
            <li><strong>Google OAuth tokens</strong> — access tokens obtained when you connect Google Search Console, stored encrypted in our database, used solely to fetch search performance statistics on your behalf.</li>
            <li><strong>WordPress Application Passwords</strong> — restricted CMS credentials you provide for one-click publishing, stored encrypted (AES-256) in our database. We request Author/Editor-level permissions only; we never request admin credentials.</li>
            <li><strong>User activity logs</strong> — timestamped, metadata-only records of actions performed within the product (e.g., audit runs, publish actions, login events) for security and compliance monitoring. Raw message content is never stored.</li>
          </ul>
          <p className="leading-relaxed text-zinc-650">
            We do <strong>not</strong> collect payment card details (handled entirely by Stripe), primary website database credentials, or any information beyond what is listed above.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">2. How We Use Your Information</h2>
          <p className="leading-relaxed text-zinc-650">
            We use collected data exclusively to:
          </p>
          <ul className="list-disc pl-6 space-y-2 leading-relaxed text-zinc-650">
            <li>Authenticate your identity and manage your account session.</li>
            <li>Crawl and analyse the technical SEO health of your connected website URLs.</li>
            <li>Retrieve Google Search Console search performance statistics on your behalf.</li>
            <li>Generate and present AI-powered SEO recommendations, titles, descriptions, and blog drafts for your review.</li>
            <li>Publish content you explicitly approve to your WordPress CMS via the Application Password you provided.</li>
            <li>Send transactional and billing notification emails (e.g., payment failure warnings, subscription confirmations).</li>
            <li>Monitor product security and detect potential abuse patterns in our internal activity logs.</li>
          </ul>
          <p className="leading-relaxed text-zinc-650">
            We do <strong>not</strong> sell, rent, or share your personal information or site data with any third party for advertising, profiling, or commercial purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">3. Least-Privilege & Data Security</h2>
          <p className="leading-relaxed text-zinc-650">
            We are designed around a least-privilege security model. We do not store primary site passwords. WordPress Application Passwords are encrypted with AES-256 before being persisted in our database. Google OAuth access tokens are stored encrypted and are scoped only to the minimum Search Console read permissions required. All data is transmitted over HTTPS/TLS.
          </p>
          <p className="leading-relaxed text-zinc-650">
            You are responsible for maintaining independent backups of your website. HeyDrona is not liable for data loss resulting from changes you apply via our platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">4. Third-Party Services</h2>
          <p className="leading-relaxed text-zinc-650">
            We integrate with the following third-party services, each governed by their own privacy policies:
          </p>
          <ul className="list-disc pl-6 space-y-2 leading-relaxed text-zinc-650">
            <li><strong>Supabase</strong> — Authentication and database hosting.</li>
            <li><strong>Google APIs</strong> — Google Search Console and Google Analytics data retrieval.</li>
            <li><strong>Stripe</strong> — Payment processing. We never see or store your card details.</li>
            <li><strong>Google AI / Gemini</strong> — AI content and analysis generation. Site content and prompts are submitted to Google's AI APIs in accordance with Google's API usage policies.</li>
            <li><strong>Resend</strong> — Transactional email delivery.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">5. Data Retention & Deletion</h2>
          <p className="leading-relaxed text-zinc-650">
            Your data is retained for as long as your account remains active. If you delete your account or a connected site, associated records (crawl audits, content items, activity logs) are permanently deleted from our database within 30 days. You may request data deletion at any time by emailing <a href="mailto:support@heydrona.com" className="text-violet-600 underline">support@heydrona.com</a>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">6. Governing Law</h2>
          <p className="leading-relaxed text-zinc-650">
            This Privacy Policy is governed by the laws of India. Any disputes relating to data privacy shall be subject to the jurisdiction of the courts in Nagpur, Maharashtra, India.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900">7. Contact Information</h2>
          <p className="leading-relaxed text-zinc-650">
            If you have questions, concerns, or deletion requests regarding this Privacy Policy, please email us at <a href="mailto:support@heydrona.com" className="text-violet-600 underline">support@heydrona.com</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
