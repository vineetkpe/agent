import React, { useState } from "react";
import { Card } from "../ui/Card";
import { AlertCircle, CheckCircle, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface FeedbackTabProps {
  currentSite: any;
}

export const FeedbackTab: React.FC<FeedbackTabProps> = ({ currentSite }) => {
  const [type, setType] = useState<"bug" | "suggestion" | "other">("bug");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg("Please enter a feedback message.");
      return;
    }
    if (message.length > 5000) {
      setErrorMsg("Message exceeds 5000 character limit.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type,
          message: message.trim(),
          pageContext: currentSite ? `Site ID: ${currentSite.id} - URL: ${currentSite.url}` : "Dashboard General",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSubmitted(true);
        setMessage("");
      } else {
        setErrorMsg(data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl mx-auto">
      <div className="pb-4 border-b border-zinc-150">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-605" /> Feedback & Support
        </h2>
        <p className="text-sm mt-1 text-zinc-550 font-mono">
          Report bugs, suggest new capabilities, or get in touch with our tech support team.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs font-mono rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isSubmitted ? (
        <Card variant="flat" className="p-8 border-2 border-zinc-950 bg-white text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase text-zinc-900">Thank You!</h3>
            <p className="text-xs text-zinc-555 font-mono max-w-md mx-auto leading-relaxed">
              Your feedback has been logged successfully. If you reported a bug, we will investigate and notify you once resolved.
            </p>
          </div>
          <button
            onClick={() => setIsSubmitted(false)}
            className="px-4 py-2 border-2 border-zinc-950 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs uppercase rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
            type="button"
          >
            Submit Another Report
          </button>
        </Card>
      ) : (
        <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-550 block">FEEDBACK TYPE</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-zinc-950 rounded-xl focus:outline-none bg-white text-xs"
              >
                <option value="bug">Bug Report / Technical Issue</option>
                <option value="suggestion">Feature Suggestion</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-550 block">MESSAGE DETAILS</label>
              <textarea
                placeholder="Describe your issue or feedback in detail..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={5000}
                className="w-full px-3 py-2 border-2 border-zinc-950 rounded-xl focus:outline-none text-xs resize-none"
                required
              />
              <div className="text-right text-[10px] text-zinc-400">
                {message.length} / 5000 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 border-2 border-zinc-950 bg-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-650 disabled:bg-zinc-100"
            >
              <Send className="w-3.5 h-3.5 inline mr-1" />
              {isSubmitting ? "Submitting..." : "Send Feedback"}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
};
export default FeedbackTab;
