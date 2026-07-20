import React from "react";
import { Sparkles, ArrowLeft, Globe, Shield, CreditCard, Cpu, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function HelpCenterPage() {
  const sections = [
    {
      title: "Getting Started",
      icon: <Cpu className="w-5 h-5 text-violet-500" />,
      faqs: [
        {
          q: "What is HeyDrona Growth?",
          a: "HeyDrona is an autonomous AI website optimization platform. It crawls your domains, checks for metadata gaps (titles, descriptions), image alternative tags, sitemaps, broken links, redirect loops, and crawlability blockers. It then suggests optimized fixes and writes relevant SEO article drafts to fill keyword gaps.",
        },
        {
          q: "How does the autonomous agent work?",
          a: "HeyDrona crawls your target site, constructs a structural model, and generates structured recommendations. It will never push modifications to your site without your manual, explicit approval -- ensuring you are always in control of your CMS content.",
        },
      ],
    },
    {
      title: "Connecting WordPress CMS",
      icon: <Globe className="w-5 h-5 text-emerald-500" />,
      faqs: [
        {
          q: "How do I link my WordPress site?",
          a: "Navigate to Setup > Sites & Connections. Enter your WordPress URL, admin username, and an Application Password. Do not use your regular login password; instead, generate a unique Application Password in your WordPress User Profile under Users > Profile > Application Passwords.",
        },
        {
          q: "Is the WordPress connection secure?",
          a: "Yes. All CMS credentials are encrypted using industry-standard AES-256-GCM encryption key models at rest before being saved. Credentials are only decrypted temporarily when pushing approvals or performing rollbacks to WordPress.",
        },
        {
          q: "How do I rollback an applied recommendation?",
          a: "If you need to undo an optimization or article draft, click the 'Rollback' button next to the applied fix on your dashboard. HeyDrona will automatically revert the title/description or delete the drafted post from WordPress.",
        },
      ],
    },
    {
      title: "Understanding Scores & Reports",
      icon: <Shield className="w-5 h-5 text-indigo-500" />,
      faqs: [
        {
          q: "How is the SEO Health Score calculated?",
          a: "Our composite score averages Lighthouse performance, accessibility, and best practices scores. It then applies standard deductions for any unresolved high-severity issues (like insecure pages, redirect chains, or missing sitemaps) to yield an honest health rating.",
        },
        {
          q: "What does the Growth Score indicate?",
          a: "The Growth Score analyzes the trend direction of your optimization actions and integrated search analytics clicks over consecutive scans, showing 'Positive', 'Neutral', or 'Negative' momentum.",
        },
        {
          q: "How do I export PDF/CSV reports?",
          a: "Go to Health > Reports in the sidebar. Select your site, report scope, and format (branded PDF summary or raw CSV spreadsheet) and click Generate to start your instant download.",
        },
      ],
    },
    {
      title: "Billing & Self-Service Portal",
      icon: <CreditCard className="w-5 h-5 text-amber-500" />,
      faqs: [
        {
          q: "How do I upgrade or cancel my plan?",
          a: "Go to Setup > Settings. In the Billing section, you can upgrade your plan or click the self-service billing link to manage invoices. If you decide to cancel, you can click Cancel Subscription, provide feedback, and confirm cancellation in the self-service modal.",
        },
        {
          q: "Will I lose my crawled audit history if I cancel?",
          a: "No. Your historical reports, crawl logs, and connected domains will remain saved, but active crawl scheduling and keyword content generation features will be paused until your plan is renewed.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 selection:bg-violet-500 selection:text-white p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none bg-violet-500/5" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none bg-indigo-500/5" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Back Link */}
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 border-2 border-zinc-950 px-3 py-1.5 rounded-xl bg-white transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>

        {/* Hero Header */}
        <div className="border-2 border-zinc-950 p-8 rounded-3xl bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900">
              Help Center & FAQ
            </h1>
          </div>
          <p className="text-sm mt-2 text-zinc-650 leading-relaxed max-w-2xl font-mono">
            Learn how HeyDrona automates technical crawl optimization audits, keyword research, and WordPress CMS integration.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((sec) => (
            <div
              key={sec.title}
              className="border-2 border-zinc-950 p-6 rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-150">
                {sec.icon}
                <h2 className="font-mono font-extrabold uppercase text-sm tracking-wider text-zinc-900">
                  {sec.title}
                </h2>
              </div>

              <div className="space-y-4">
                {sec.faqs.map((faq, idx) => (
                  <div key={idx} className="space-y-1.5 font-mono text-xs">
                    <h4 className="font-extrabold text-zinc-800 flex gap-2">
                      <span>Q:</span>
                      <span>{faq.q}</span>
                    </h4>
                    <p className="text-zinc-600 leading-relaxed pl-4 border-l border-zinc-200">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Support */}
        <div className="border-2 border-zinc-950 p-6 rounded-2xl bg-zinc-950 text-white text-center font-mono text-xs">
          <p className="font-bold">Need additional support?</p>
          <p className="text-zinc-400 mt-1">Submit a query or bug report directly from the sidebar Feedback menu option.</p>
        </div>
      </div>
    </div>
  );
}
