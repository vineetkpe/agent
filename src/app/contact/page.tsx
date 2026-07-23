"use client";

import React, { useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { Mail, Send, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send contact message.");
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-800 font-sans selection:bg-violet-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full space-y-10">
        {/* Page Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-zinc-955 bg-violet-50 text-violet-700 font-mono text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <Mail className="w-3.5 h-3.5" /> Get In Touch
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-mono tracking-tight text-zinc-955 uppercase">
            Contact Our Team
          </h1>
          <p className="text-xs md:text-sm text-zinc-600 max-w-md mx-auto font-mono">
            Have a question about subscriptions, custom setups, or WordPress integrations? Send us a message directly.
          </p>
        </div>

        {/* Form Card */}
        <div className="p-6 md:p-8 rounded-3xl border-2 border-zinc-955 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)]">
          {success ? (
            <div className="p-8 text-center space-y-4 font-mono">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border-2 border-zinc-955 flex items-center justify-center mx-auto shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 uppercase">Message Received</h3>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto leading-relaxed">
                Thank you for reaching out. We have dispatched your message to our admin team and will respond to your email as soon as possible.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2.5 border-2 border-zinc-955 bg-zinc-955 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[2px_2px_0px_0px_rgba(124,58,237,1)] hover:bg-zinc-800 transition-all"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 font-mono">
              {error && (
                <div className="p-4 rounded-xl border-2 border-red-955 bg-red-50 text-xs text-red-755 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase text-[9px]">Submission Error</p>
                    <p className="mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-zinc-955 text-xs bg-white focus:outline-none focus:border-violet-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-zinc-955 text-xs bg-white focus:outline-none focus:border-violet-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                  Inquiry Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-zinc-955 text-xs bg-white focus:outline-none focus:border-violet-600"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Sales">Sales & Subscriptions</option>
                  <option value="Support">Technical Support</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 block">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  required
                  rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-zinc-955 text-xs bg-white focus:outline-none focus:border-violet-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 border-2 border-zinc-955 bg-violet-650 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-750 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              >
                {loading ? "Dispatching Message..." : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
