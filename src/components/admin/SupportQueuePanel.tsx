import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { 
  MessageSquare, 
  User, 
  ShieldCheck, 
  Send, 
  AlertCircle, 
  Lock, 
  Briefcase, 
  Globe, 
  CornerDownRight, 
  Plus, 
  RefreshCw,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  id: string;
  email: string;
  plan: string | null;
  subscriptionActive: boolean;
  suspended: boolean;
  role: string;
  createdAt: string;
  _count?: {
    sites: number;
  };
}

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
  user: UserProfile;
  messages: Message[];
}

export const SupportQueuePanel: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all"); // 'all' | 'me' | 'unassigned'

  // Staff lists (for assignment)
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [currentStaffUser, setCurrentStaffUser] = useState<UserProfile | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCurrentStaff = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Decrypt token or fetch profile
      const res = await fetch("/api/audit", { // Shared endpoint that exposes current user details
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentStaffUser(data.user);
      }
    } catch {}
  };

  const fetchStaffMembers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Filter users to only support and admin staff
        const staff = (data.users || []).filter((u: any) => u.role === "support" || u.role === "admin");
        setStaffList(staff);
      }
    } catch {}
  };

  const fetchTickets = async (selectId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (assignmentFilter) params.set("assignment", assignmentFilter);

      const res = await fetch(`/api/admin/support/tickets?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load support ticket queue.");
      }

      const data = await res.json();
      setTickets(data.tickets || []);

      if (selectId) {
        const found = data.tickets.find((t: Ticket) => t.id === selectId);
        if (found) setSelectedTicket(found);
      } else if (selectedTicket) {
        const found = data.tickets.find((t: Ticket) => t.id === selectedTicket.id);
        if (found) {
          setSelectedTicket(found);
        } else {
          setSelectedTicket(null);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load support ticket queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStaff();
    fetchStaffMembers();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, assignmentFilter]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      setSubmitting(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyText,
          isInternalNote: isInternalNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save comment.");
      }

      setReplyText("");
      setIsInternalNote(false);
      await fetchTickets(selectedTicket.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      setSubmitting(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/support/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status.");
      }

      await fetchTickets(selectedTicket.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTo = async (staffId: string | null) => {
    if (!selectedTicket) return;
    try {
      setSubmitting(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/support/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          assignedToUserId: staffId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update assignment.");
      }

      await fetchTickets(selectedTicket.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStaffEmail = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const staff = staffList.find((s) => s.id === userId);
    return staff ? staff.email : `Staff User #${userId.slice(0, 5)}`;
  };

  const isAdmin = currentStaffUser?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 font-mono uppercase tracking-wider">
            Customer Support Tickets Queue
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Track user issue tickets, coordinate responses, and document internal staff comments.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border-2 border-zinc-950 bg-white font-mono text-xs focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border-2 border-zinc-950 bg-white font-mono text-xs focus:outline-none"
          >
            <option value="all">All Assignments</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 border-2 border-red-955 bg-red-50 text-xs text-red-755 rounded-xl font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ticket List queue */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
            Queue ({tickets.length} Tickets)
          </span>

          {loading && tickets.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-5 h-5 text-violet-600 animate-spin mx-auto" />
            </div>
          ) : tickets.length === 0 ? (
            <Card variant="flat" className="p-6 text-center text-zinc-500 font-mono text-xs border-dashed">
              No tickets matched active filters.
            </Card>
          ) : (
            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isActive = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all block ${
                      isActive 
                        ? "border-zinc-950 bg-violet-50/30 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]" 
                        : "border-zinc-150 hover:border-zinc-950 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-400 font-mono">#{t.id.slice(0, 8)}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                        t.priority === "high" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-zinc-100 text-zinc-650"
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 truncate font-mono mb-1">{t.subject}</h4>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100">
                      <span className="text-[9px] font-mono text-zinc-450 truncate max-w-[120px]">
                        Owner: {t.user.email}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                        t.status === "open" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main Work Area */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Message thread */}
              <div className="md:col-span-2 space-y-4">
                <Card variant="flat" className="border-2 border-zinc-955 bg-white flex flex-col h-[550px]">
                  {/* Subject details */}
                  <div className="p-4 border-b border-zinc-150 bg-zinc-50/50 flex items-center justify-between shrink-0">
                    <div className="space-y-1">
                      <span className="text-[10px] text-zinc-450 font-bold font-mono">
                        TICKET #{selectedTicket.id.slice(0, 8)}
                      </span>
                      <h3 className="font-bold text-xs text-zinc-800 font-mono">{selectedTicket.subject}</h3>
                    </div>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/10">
                    {selectedTicket.messages.map((msg) => {
                      const isStaff = msg.author.role === "support" || msg.author.role === "admin";
                      const internal = msg.isInternalNote;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isStaff ? "justify-start" : "justify-end"}`}
                        >
                          <div className={`max-w-[85%] rounded-xl p-3 text-xs border ${
                            internal 
                              ? "bg-amber-50 text-amber-900 border-amber-250 rounded-tl-none" 
                              : isStaff
                              ? "bg-violet-50/30 text-zinc-800 border-violet-100 rounded-tl-none"
                              : "bg-white text-zinc-800 border-zinc-200 rounded-tr-none shadow-sm"
                          }`}>
                            <div className="flex items-center justify-between gap-6 pb-1 border-b border-zinc-100 mb-1.5 text-[9px] font-mono text-zinc-450">
                              <span className="font-bold flex items-center gap-1">
                                {internal ? (
                                  <>
                                    <Lock className="w-3 h-3 text-amber-600" /> Internal Staff Note
                                  </>
                                ) : isStaff ? (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-violet-650" /> Rep ({msg.author.email})
                                  </>
                                ) : (
                                  <>
                                    <User className="w-3 h-3 text-zinc-400" /> Client
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

                  {/* Reply form */}
                  <form onSubmit={handleSendReply} className="p-3 border-t border-zinc-150 bg-white space-y-3 shrink-0">
                    <div className="flex items-center gap-4 text-[10px] font-mono">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="isInternalNote"
                          checked={!isInternalNote}
                          onChange={() => setIsInternalNote(false)}
                          className="accent-violet-600"
                        />
                        <span className="text-zinc-650 font-bold">Public Response (Email Client)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="isInternalNote"
                          checked={isInternalNote}
                          onChange={() => setIsInternalNote(true)}
                          className="accent-amber-600"
                        />
                        <span className="text-amber-700 font-bold">Private Internal Note</span>
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={isInternalNote ? "Write staff-only note..." : "Write response to client..."}
                        className="flex-1 px-3 py-2 rounded-xl border-2 border-zinc-955 text-xs font-mono focus:outline-none focus:border-violet-500 bg-white"
                      />
                      <Button type="submit" variant="primary" disabled={submitting} className="py-2 px-3">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>

              {/* Client detail panel */}
              <div className="md:col-span-1 space-y-4">
                <Card variant="flat" className="p-4 border-2 border-zinc-955 bg-white space-y-4">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-450 block border-b pb-1">
                    Client Telemetry Info
                  </span>

                  <div className="space-y-3 font-mono text-[11px] text-zinc-650">
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Email Address</span>
                      <span className="text-zinc-900 font-bold select-all">{selectedTicket.user.email}</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Plan / Billing status</span>
                      <span className="text-zinc-900 font-bold uppercase">{selectedTicket.user.plan || "free"}</span>
                      <Badge variant={selectedTicket.user.subscriptionActive ? "emerald" : "zinc"} className="text-[8px] ml-1 uppercase">
                        {selectedTicket.user.subscriptionActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Registered Sites</span>
                      <span className="text-zinc-900 font-bold">{selectedTicket.user._count?.sites || 0} Connected</span>
                    </div>

                    <div>
                      <span className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider">Account Creation Date</span>
                      <span className="text-zinc-900">{new Date(selectedTicket.user.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* WP password check -- confirm it is secure */}
                    <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-450 leading-relaxed">
                      <Lock className="w-3.5 h-3.5 text-zinc-400 inline mr-1 mb-0.5" />
                      Encrypted credentials, refresh tokens, and Stripe customer tokens are structurally omitted from support logs to prevent credential leakage.
                    </div>
                  </div>
                </Card>

                {/* Ticket controls */}
                <Card variant="flat" className="p-4 border-2 border-zinc-955 bg-white space-y-4">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-450 block border-b pb-1">
                    Ticket Controls
                  </span>

                  <div className="space-y-4 font-mono text-xs">
                    {/* Status Select */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-450 uppercase block">Ticket Status</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={submitting}
                        className="w-full px-2.5 py-1.5 rounded-xl border-2 border-zinc-955 focus:outline-none bg-white font-mono"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Assignment Select */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-zinc-450 uppercase block">Assigned Staff Representative</label>
                      {isAdmin ? (
                        // Admins can assign to anyone
                        <select
                          value={selectedTicket.assignedToUserId || ""}
                          onChange={(e) => handleAssignTo(e.target.value || null)}
                          disabled={submitting}
                          className="w-full px-2.5 py-1.5 rounded-xl border-2 border-zinc-955 focus:outline-none bg-white font-mono"
                        >
                          <option value="">Unassigned</option>
                          {staffList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.email} ({s.role})
                            </option>
                          ))}
                        </select>
                      ) : (
                        // Support representatives can only self-assign or unassign
                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-500">
                            Assigned: <strong>{getStaffEmail(selectedTicket.assignedToUserId)}</strong>
                          </p>
                          {selectedTicket.assignedToUserId === currentStaffUser?.id ? (
                            <Button
                              variant="secondary"
                              onClick={() => handleAssignTo(null)}
                              disabled={submitting}
                              className="w-full py-1 text-[10px]"
                            >
                              Unassign Myself
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={() => handleAssignTo(currentStaffUser?.id || null)}
                              disabled={submitting}
                              className="w-full py-1 text-[10px]"
                            >
                              Assign to Myself
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <Card variant="flat" className="p-12 text-center text-zinc-400 font-mono text-xs border-dashed flex flex-col items-center justify-center h-[400px] gap-2">
              <MessageSquare className="w-8 h-8 text-zinc-350" />
              <span>Select a support ticket from the active list queue to handle responses and view client details.</span>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
