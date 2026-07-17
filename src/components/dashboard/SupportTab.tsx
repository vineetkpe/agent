import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { 
  MessageSquare, 
  Send, 
  Plus, 
  ChevronRight, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  CornerDownRight,
  User,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  authorUserId: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
  author: {
    email: string;
    role: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high";
  assignedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export const SupportTab: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTickets = async (selectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/support/tickets", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load tickets.");
      }

      const data = await res.json();
      setTickets(data.tickets || []);

      if (selectId) {
        const found = data.tickets.find((t: Ticket) => t.id === selectId);
        if (found) setSelectedTicket(found);
      } else if (selectedTicket) {
        const found = data.tickets.find((t: Ticket) => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    } catch (err: any) {
      setError(err.message || "Failed to query support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ subject, message, priority }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to open ticket.");
      }

      setSuccess("Support ticket created successfully!");
      setSubject("");
      setMessage("");
      setPriority("normal");
      setIsCreating(false);
      await fetchTickets(data.ticket.id);
    } catch (err: any) {
      setError(err.message || "Failed to create ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSubmitting(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/support/tickets", { // Post reply uses shared endpoint
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyText,
          isInternalNote: false, // Customers can never write internal notes
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      setReplyText("");
      await fetchTickets(selectedTicket.id);
    } catch (err: any) {
      setError(err.message || "Failed to send reply.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up pb-12">
      <div className="pb-4 border-b border-zinc-150 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Customer Support Center</h2>
          <p className="text-xs mt-1 text-zinc-550">
            Open a diagnostic ticket, report dashboard bugs, or query custom optimizations directly with support.
          </p>
        </div>
        {!isCreating && (
          <Button
            variant="primary"
            onClick={() => {
              setIsCreating(true);
              setSelectedTicket(null);
            }}
            className="text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Open Support Ticket
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 border-2 border-red-955 bg-red-50 text-xs text-red-755 rounded-xl font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 border-2 border-emerald-955 bg-emerald-50 text-xs text-emerald-755 rounded-xl font-mono flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
            Ticket History
          </span>

          {loading && tickets.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-5 h-5 text-violet-600 animate-spin mx-auto" />
            </div>
          ) : tickets.length === 0 ? (
            <Card variant="flat" className="p-6 text-center text-zinc-500 font-mono text-xs border-dashed">
              No active support tickets opened.
            </Card>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isActive = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTicket(t);
                      setIsCreating(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                      isActive 
                        ? "border-zinc-950 bg-violet-50/30 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" 
                        : "border-zinc-150 hover:border-zinc-950 bg-white"
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">#{t.id.slice(0, 8)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                          t.priority === "high" 
                            ? "bg-rose-50 text-rose-600 border border-rose-100" 
                            : t.priority === "normal"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-zinc-100 text-zinc-600"
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-900 truncate font-mono">{t.subject}</h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                      t.status === "open"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        : t.status === "in_progress"
                        ? "bg-blue-50 text-blue-600 border border-blue-100"
                        : t.status === "resolved"
                        ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        : "bg-red-50 text-red-600 border border-red-100"
                    }`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Work Area */}
        <div className="lg:col-span-2">
          {isCreating ? (
            <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-150">
                <h3 className="font-bold text-sm text-zinc-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-violet-600" /> Open New Support Ticket
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 font-mono"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-550 uppercase block">Ticket Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. SEO Audit failover error during WordPress publish step"
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-955 focus:outline-none focus:border-violet-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-550 uppercase block">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-955 focus:outline-none focus:border-violet-500 bg-white"
                  >
                    <option value="low">Low - General query</option>
                    <option value="normal">Normal - Operational issues</option>
                    <option value="high">High - Feature blockages</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-550 uppercase block">Detailed Message Description</label>
                  <textarea
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue, including sitemaps or page URLs, so our support agents can quickly resolve your ticket..."
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-zinc-955 focus:outline-none focus:border-violet-500 bg-white"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Opening..." : "Submit Ticket"}
                  </Button>
                </div>
              </form>
            </Card>
          ) : selectedTicket ? (
            <Card variant="flat" className="border-2 border-zinc-955 bg-white flex flex-col h-[550px]">
              {/* Ticket Top bar */}
              <div className="p-4 border-b border-zinc-150 flex items-center justify-between shrink-0 bg-zinc-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-450 font-bold font-mono uppercase tracking-wider">
                      Ticket #{selectedTicket.id.slice(0, 8)}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                      selectedTicket.priority === "high" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-zinc-100 text-zinc-650"
                    }`}>
                      {selectedTicket.priority} Priority
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-800 font-mono">{selectedTicket.subject}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                  selectedTicket.status === "open"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : selectedTicket.status === "in_progress"
                    ? "bg-blue-50 text-blue-600 border border-blue-100"
                    : selectedTicket.status === "resolved"
                    ? "bg-zinc-100 text-zinc-600 border border-zinc-200"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                  {selectedTicket.status.replace("_", " ")}
                </span>
              </div>

              {/* Messages Timeline */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-zinc-50/20">
                {selectedTicket.messages.map((msg) => {
                  const isStaff = msg.author.role === "support" || msg.author.role === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isStaff ? "justify-start" : "justify-end"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs border ${
                        isStaff 
                          ? "bg-violet-50/40 text-zinc-850 border-violet-100 rounded-tl-none" 
                          : "bg-white text-zinc-800 border-zinc-200 rounded-tr-none shadow-sm"
                      }`}>
                        <div className="flex items-center justify-between gap-6 pb-1 border-b border-zinc-100 mb-1.5 text-[9px] font-mono text-zinc-450">
                          <span className="font-bold flex items-center gap-1">
                            {isStaff ? (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5 text-violet-650" /> Representative
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-zinc-400" /> You
                              </>
                            )}
                          </span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed font-mono text-[11px]">{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== "closed" ? (
                <form onSubmit={handleSendReply} className="p-3 border-t border-zinc-150 shrink-0 bg-white flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type message reply to support..."
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-zinc-955 text-xs font-mono focus:outline-none focus:border-violet-500 bg-white"
                  />
                  <Button type="submit" variant="primary" disabled={submitting} className="py-2 px-3">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              ) : (
                <div className="p-3 border-t border-zinc-150 shrink-0 bg-zinc-50 text-center text-[10px] font-mono text-zinc-450">
                  This ticket has been marked as Closed.
                </div>
              )}
            </Card>
          ) : (
            <Card variant="flat" className="p-12 text-center text-zinc-400 font-mono text-xs border-dashed flex flex-col items-center justify-center h-[350px] gap-2">
              <MessageSquare className="w-8 h-8 text-zinc-350" />
              <span>Select a support ticket from the history list to view message threads, or create a new issue.</span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
