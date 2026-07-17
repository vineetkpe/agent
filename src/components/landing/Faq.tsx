import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export const Faq: React.FC = () => {
  const [faqOpen, setFaqOpen] = useState<{ [key: string]: boolean }>({
    faq1: true,
    faq2: false,
    faq3: false,
    faq4: false,
  });

  const toggleFaq = (id: string) => {
    setFaqOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="faq" className="py-24 px-6 max-w-4xl mx-auto w-full border-t-2 border-zinc-950 bg-white">
      <div className="text-center mb-16">
        <span className="text-xs text-violet-600 font-bold tracking-wider uppercase font-mono">
          Frequently Asked Questions
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight mt-1 text-zinc-950 font-mono">Answers & Support</h2>
        <p className="text-sm mt-1.5 text-zinc-555 max-w-xl mx-auto font-sans">
          Everything you need to know about setting up and working with HeyDrona for SEO growth.
        </p>
      </div>

      <div className="space-y-4">
        {/* FAQ 1 */}
        <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white animate-fade-in">
          <button
            onClick={() => toggleFaq("faq1")}
            type="button"
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
          >
            <span>What exactly is HeyDrona?</span>
            {faqOpen.faq1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {faqOpen.faq1 && (
            <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200 font-sans">
              HeyDrona is an AI-powered SEO assistant. It connects to your website and CMS systems, runs deep crawl audits, identifies technical issues, suggests optimized titles/alt descriptions, and drafts blog outline posts for your review and one-click publishing.
            </div>
          )}
        </div>

        {/* FAQ 2 */}
        <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white animate-fade-in">
          <button
            onClick={() => toggleFaq("faq2")}
            type="button"
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
          >
            <span>Is it safe to connect my CMS website backend credentials?</span>
            {faqOpen.faq2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {faqOpen.faq2 && (
            <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-600 border-t border-zinc-200 font-sans">
              Yes, absolutely. We enforce secure **Least Privilege Credentials**. Instead of inputting primary site admin
              credentials, our setup manual instructs you to create a separate user account with restricted
              &quot;Author&quot; or &quot;Editor&quot; permissions and assign a localized application key. The AI assistant can only
              compile drafts for review and cannot edit core system themes or configuration settings.
            </div>
          )}
        </div>

        {/* FAQ 3 */}
        <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white animate-fade-in">
          <button
            onClick={() => toggleFaq("faq3")}
            type="button"
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
          >
            <span>What is the difference between this and traditional tools like Semrush?</span>
            {faqOpen.faq3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {faqOpen.faq3 && (
            <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200 font-sans">
              Traditional tools require you to interpret data, compile spreadsheets, and make complex manual changes. HeyDrona does
              not just report—it simplifies the action. It highlights technical problems, explains why they affect your SEO,
              estimates their priority, and generates correct tags or outlines that you can push live in one click after your review.
            </div>
          )}
        </div>

        {/* FAQ 4 */}
        <div className="border-2 border-zinc-950 rounded-2xl overflow-hidden shadow-retro-sm bg-white animate-fade-in">
          <button
            onClick={() => toggleFaq("faq4")}
            type="button"
            className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-zinc-900 hover:bg-zinc-50 transition-colors font-mono"
          >
            <span>Can I choose which pages are crawled and which are skipped?</span>
            {faqOpen.faq4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {faqOpen.faq4 && (
            <div className="px-6 pb-4 pt-2 text-xs leading-relaxed text-zinc-650 border-t border-zinc-200 font-sans">
              Yes. Our CMS panel allows you to configure exact crawling filters, exclude specific path directories (such
              as admin folders, shopping carts, or thank-you pages), and review each suggested recommendation block
              before pushing edits live.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
export default Faq;
