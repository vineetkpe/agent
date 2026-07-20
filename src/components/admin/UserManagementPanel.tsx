import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Users, Search, RefreshCw, Star, Trash2, Eye, ShieldAlert, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UserEntry {
  id: string;
  email: string;
  name?: string | null;
  subscriptionActive: boolean;
  suspended: boolean;
  isAdmin: boolean;
  createdAt: string;
  siteCount: number;
  latestAuditDate: string | null;
  plan?: string | null;
  planSource?: string | null;
  planActivatedAt?: string | null;
}

export const UserManagementPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedUserData, setExpandedUserData] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchUsers = async (query = "") => {
    try {
      setLoading(true);
      setFeedback(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      if (query) params.set("q", query);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to query users registry.");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to load users.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setLoadingDetail(true);
      setExpandedUserData(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user diagnostic details.");
      }

      const data = await res.json();
      setExpandedUserData(data);
    } catch (err: any) {
      alert(err.message || "Failed to load user details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdatePlan = async (user: UserEntry, newPlan: string | null) => {
    try {
      setActionLoading(`plan-${user.id}`);
      setFeedback(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user plan.");
      }

      const resData = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { 
          ...u, 
          plan: resData.user.plan, 
          subscriptionActive: resData.user.subscriptionActive, 
          planSource: resData.user.planSource,
          planActivatedAt: resData.user.planActivatedAt 
        } : u))
      );
      setFeedback({
        text: `Successfully updated plan for ${user.email} to ${newPlan ? newPlan.toUpperCase() : "None (Free)"}.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedback({ text: err.message || "Request failed.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateSubscription = async (user: UserEntry) => {
    try {
      setActionLoading(`deactivate-${user.id}`);
      setFeedback(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "deactivate_subscription" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deactivate subscription.");
      }

      const resData = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { 
          ...u, 
          plan: resData.user.plan, 
          subscriptionActive: resData.user.subscriptionActive, 
          planSource: resData.user.planSource,
          planActivatedAt: resData.user.planActivatedAt 
        } : u))
      );
      setFeedback({
        text: `Successfully deactivated subscription for ${user.email}.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedback({ text: err.message || "Request failed.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (user: UserEntry) => {
    try {
      setActionLoading(`suspend-${user.id}`);
      setFeedback(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ suspended: !user.suspended }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle suspension.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, suspended: !u.suspended } : u))
      );
      setFeedback({
        text: `Account for ${user.email} is now ${!user.suspended ? "suspended and blocked immediately" : "re-activated"}.`,
        isError: false,
      });
    } catch (err: any) {
      setFeedback({ text: err.message || "Request failed.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user: UserEntry) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete user ${user.email}? All sites, audits, and configurations will be irreversibly deleted.`)) {
      return;
    }

    try {
      setActionLoading(`delete-${user.id}`);
      setFeedback(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user.");
      }

      setFeedback({ text: `User ${user.email} deleted successfully.`, isError: false });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      if (expandedUserId === user.id) {
        setExpandedUserId(null);
        setExpandedUserData(null);
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Delete request failed.", isError: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (user: UserEntry) => {
    const reason = prompt(`Reason for impersonating user ${user.email} (mandatory for audit trail):`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert("A valid audit explanation is required to initiate impersonation.");
      return;
    }

    try {
      setActionLoading(`impersonate-${user.id}`);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/impersonate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ targetUserId: user.id, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Impersonation request failed.");
      }

      const data = await res.json();
      if (data.token) {
        localStorage.setItem("impersonation_token", data.token);
        localStorage.setItem("impersonation_target_email", user.email);
        localStorage.setItem("impersonation_target_id", user.id);
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      alert(err.message || "Failed to initialize impersonation session.");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRowExpand = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setExpandedUserData(null);
    } else {
      setExpandedUserId(userId);
      fetchUserDetails(userId);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Card variant="flat" className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-150 pb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-650" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-850">
            Registered Users Registry
          </h3>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-zinc-950 text-xs rounded-xl focus:outline-none focus:border-violet-500 bg-white text-zinc-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 border-2 border-zinc-950 bg-white text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55 shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border-2 text-xs flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] ${
          feedback.isError ? "border-red-950 bg-red-50 text-red-750" : "border-emerald-950 bg-emerald-50 text-emerald-755"
        }`}>
          {feedback.isError ? (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-655" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-650" />
          )}
          <div>
            <p className="font-bold uppercase tracking-wider text-[9px] font-mono">
              {feedback.isError ? "System Warning" : "Action Completed"}
            </p>
            <p className="mt-0.5 font-mono">{feedback.text}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-violet-650 animate-spin" />
            <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-zinc-400">
              Retrieving database user registry...
            </span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <p className="text-xs text-zinc-400 font-mono py-6 text-center italic">No registered users found.</p>
      ) : (
        <div className="overflow-x-auto border-2 border-zinc-950 rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-950 bg-zinc-50 font-mono font-bold uppercase tracking-wider text-[10px] text-zinc-600">
                <th className="p-4"></th>
                <th className="p-4">Email Account</th>
                <th className="p-4">Status</th>
                <th className="p-4">Sites Registered</th>
                <th className="p-4">Latest Crawl</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-950 bg-white font-mono text-[11px] text-zinc-700">
              {users.map((user) => {
                const isExpanded = expandedUserId === user.id;
                return (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-zinc-50/50">
                      <td className="p-4">
                        <button
                          onClick={() => toggleRowExpand(user.id)}
                          className="p-1 rounded hover:bg-zinc-150 transition-colors text-zinc-500"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                      <td className="p-4 break-all">
                        <div className="font-bold text-zinc-900">{user.email}</div>
                        {user.name && (
                          <div className="text-[10px] text-zinc-400 font-normal mt-0.5">{user.name}</div>
                        )}
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex flex-wrap gap-1.5">
                          {user.isAdmin && (
                            <Badge variant="violet" className="text-[8px] px-1.5 py-0 uppercase">Admin</Badge>
                          )}
                          {user.suspended && (
                            <Badge variant="zinc" className="text-[8px] px-1.5 py-0 uppercase bg-red-100 text-red-700 border-red-200">Suspended</Badge>
                          )}
                          {user.plan ? (
                            <Badge variant="emerald" className="text-[8px] px-1.5 py-0 uppercase bg-emerald-100 text-emerald-800 border-emerald-200">
                              {user.plan} ({user.planSource || "stripe"})
                            </Badge>
                          ) : user.subscriptionActive ? (
                            <Badge variant="emerald" className="text-[8px] px-1.5 py-0 uppercase">Premium</Badge>
                          ) : (
                            <Badge variant="zinc" className="text-[8px] px-1.5 py-0 uppercase">Free</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-zinc-900">{user.siteCount}</td>
                      <td className="p-4">
                        {user.latestAuditDate ? new Date(user.latestAuditDate).toLocaleDateString() : "Never"}
                      </td>
                      <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <select
                          value={user.plan || ""}
                          onChange={(e) => handleUpdatePlan(user, e.target.value || null)}
                          disabled={actionLoading !== null}
                          className="px-2 py-1 border-2 border-zinc-950 bg-white text-zinc-800 font-bold text-[9px] uppercase tracking-wider rounded-lg focus:outline-none transition-all disabled:opacity-50 inline-block align-middle"
                        >
                          <option value="">None (Free)</option>
                          <option value="starter">Starter</option>
                          <option value="growth">Growth</option>
                          <option value="agency">Agency</option>
                        </select>

                        <button
                          onClick={() => handleDeactivateSubscription(user)}
                          disabled={actionLoading !== null || (!user.subscriptionActive && !user.plan)}
                          className="px-2 py-1 border-2 border-zinc-950 bg-zinc-100 text-zinc-850 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-200 disabled:opacity-50 inline-block align-middle"
                          title="Deactivate Subscription"
                        >
                          Deactivate
                        </button>

                        <button
                          onClick={() => handleToggleSuspend(user)}
                          disabled={actionLoading === `suspend-${user.id}`}
                          className="px-2 py-1 border-2 border-zinc-950 bg-white text-zinc-800 font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55 flex-inline items-center gap-1 disabled:opacity-50"
                        >
                          <ShieldAlert className={`w-2.5 h-2.5 inline mr-0.5 ${user.suspended ? "text-red-500" : "text-zinc-500"}`} />
                          {user.suspended ? "Unsuspend" : "Suspend"}
                        </button>

                        <button
                          onClick={() => handleImpersonate(user)}
                          disabled={actionLoading === `impersonate-${user.id}` || user.suspended}
                          className="px-2 py-1 border-2 border-zinc-950 bg-violet-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-750 flex-inline items-center gap-1 disabled:opacity-50"
                          title="Impersonate and view dashboard as user"
                        >
                          <Eye className="w-2.5 h-2.5 inline mr-0.5" />
                          View As User
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionLoading === `delete-${user.id}`}
                          className="px-2 py-1 border-2 border-zinc-950 bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] hover:bg-rose-700 flex-inline items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-2.5 h-2.5 inline" />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable details segment */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/50">
                        <td colSpan={7} className="p-4 border-b-2 border-zinc-950">
                          {loadingDetail ? (
                            <div className="flex items-center gap-2 p-4 justify-center">
                              <RefreshCw className="w-4 h-4 text-violet-600 animate-spin" />
                              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
                                Fetching user detail profile...
                              </span>
                            </div>
                          ) : !expandedUserData ? (
                            <p className="text-xs text-zinc-400 font-mono text-center py-2">Failed to load details.</p>
                          ) : (
                            <div className="space-y-4 animate-fade-in font-mono text-xs">
                              {/* Summary telemetries */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-3 border-2 border-zinc-950 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
                                  <span className="text-[9px] uppercase text-zinc-400 font-bold">User Identity</span>
                                  <p className="font-bold text-zinc-900 mt-0.5 truncate">{expandedUserData.user?.id}</p>
                                </div>
                                <div className="p-3 border-2 border-zinc-950 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
                                  <span className="text-[9px] uppercase text-zinc-400 font-bold">API Operations Count</span>
                                  <p className="font-bold text-zinc-900 mt-0.5">{expandedUserData.apiUsageCount} logged calls</p>
                                </div>
                                <div className="p-3 border-2 border-zinc-950 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
                                  <span className="text-[9px] uppercase text-zinc-400 font-bold">Sites Crawled</span>
                                  <p className="font-bold text-zinc-900 mt-0.5">{expandedUserData.sites?.length} domains</p>
                                </div>
                                <div className="p-3 border-2 border-zinc-950 bg-white rounded-xl shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
                                  <span className="text-[9px] uppercase text-zinc-400 font-bold">Account Plan</span>
                                  <p className="font-bold text-zinc-900 mt-0.5">
                                    {expandedUserData.user?.plan 
                                      ? `${expandedUserData.user.plan.toUpperCase()} (${expandedUserData.user.planSource || 'stripe'})`
                                      : expandedUserData.user?.subscriptionActive ? "Premium" : "Free standard tier"}
                                  </p>
                                </div>
                              </div>

                              {/* Sites list */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-[10px] uppercase text-zinc-500 tracking-wider">Registered Sites</h4>
                                {expandedUserData.sites?.length === 0 ? (
                                  <p className="text-zinc-400 italic text-[11px]">No websites registered.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {expandedUserData.sites.map((site: any) => (
                                      <div key={site.id} className="p-3 border border-zinc-300 rounded-xl bg-white flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Globe className="w-3.5 h-3.5 text-zinc-400" />
                                          <span className="font-bold text-zinc-900">{site.url}</span>
                                          {site.wpUrl && <Badge variant="emerald" className="text-[8px] px-1 py-0">WordPress Connected</Badge>}
                                        </div>
                                        <div className="text-right text-[10px] text-zinc-400">
                                          <span>{site.audits?.length} crawls | Last: {site.audits?.[0] ? new Date(site.audits[0].createdAt).toLocaleDateString() : "Never"}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
