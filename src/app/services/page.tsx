"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Globe, Sparkles, FileText, Activity, ShieldCheck, Database } from "lucide-react";

export default function ServicesPage() {
  const services = [
    {
      title: "Deep Site Crawler",
      description: "Scans your website links and identifies standard SEO issues: missing title tags, empty meta descriptions, schema markup opportunities, broken links, and images lacking alt text.",
      icon: <Globe className="w-5 h-5 text-violet-500" />,
    },
    {
      title: "AI Recommendations",
      description: "Instead of complex, confusing spreadsheets, we explain detected issues in plain English, estimate their priority, and generate recommended text fixes that you can apply instantly.",
      icon: <Sparkles className="w-5 h-5 text-violet-500" />,
    },
    {
      title: "Content Helper",
      description: "Generates structure outlines, FAQ lists, and draft articles for your blog. Tailors copy, headings, and descriptions to match SEO best practices before you publish.",
      icon: <FileText className="w-5 h-5 text-violet-500" />,
    },
    {
      title: "One-Click CMS Sync",
      description: "Connect your WordPress site securely using restricted author credentials. Once connected, you can deploy your approved metadata fixes and blog drafts directly in one click.",
      icon: <ShieldCheck className="w-5 h-5 text-violet-500" />,
    },
    {
      title: "Search Console Integration",
      description: "Sync directly with Google Search Console to pull real search queries, impressions, and click-through rates, helping you spot which pages need immediate optimization.",
      icon: <Database className="w-5 h-5 text-violet-500" />,
    },
    {
      title: "Uptime Monitoring",
      description: "Monitors your website constantly to ensure it is online. If your website goes down, we record the downtime details so you can contact your hosting provider.",
      icon: <Activity className="w-5 h-5 text-violet-500" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20 w-full space-y-12">
        <div className="border-b-2 border-zinc-950 pb-6">
          <span className="text-xs text-violet-650 font-bold tracking-widest uppercase font-mono">Services</span>
          <h1 className="text-4xl font-extrabold mt-2 font-mono text-zinc-950">Included Features</h1>
        </div>

        <p className="text-sm leading-relaxed text-zinc-650">
          HeyDrona provides a suite of practical tools designed to check website status and apply code and metadata updates quickly. Here is exactly what is included in our plans:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {services.map((svc, i) => (
            <div key={i} className="p-6 border-2 border-zinc-950 bg-white rounded-2xl shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] flex gap-4">
              <div className="w-10 h-10 border-2 border-zinc-950 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]">
                {svc.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm font-mono text-zinc-900">{svc.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-650">{svc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
