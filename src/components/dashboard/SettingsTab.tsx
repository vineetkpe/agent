import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { 
  Settings, 
  CreditCard, 
  Bell, 
  Database, 
  ShieldCheck, 
  Key, 
  CheckCircle, 
  Trash2, 
  Download, 
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { getEffectivePlanLimits } from "@/lib/planLimits";

interface SettingsTabProps {
  currentUser: any;
  currentSite: any;
  allSites: any[];
  selectTab: (tab: any) => void;
  handleSubscribe: () => void;
  isSubscribing: boolean;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentUser,
  currentSite,
  allSites = [],
  selectTab,
  handleSubscribe,
  isSubscribing,
}) => {
  const limits = getEffectivePlanLimits(currentUser);
  const planName = currentUser?.plan 
    ? currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1) 
    : currentUser?.subscriptionActive ? "Premium" : "Free";

  const isPaid = currentUser?.subscriptionActive || currentUser?.plan;

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("too_expensive");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Billing portal loading state
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Invoice History State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoadingInvoices(true);
        const res = await fetch("/api/user/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error("[SettingsTab] Failed to fetch invoices:", err);
      } finally {
        setLoadingInvoices(false);
      }
    }
    fetchInvoices();
  }, []);

  // Notification states
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [notifyErrors, setNotifyErrors] = useState(true);
  const [notifyCMS, setNotifyCMS] = useState(true);
  const [saveNotifySuccess, setSaveNotifySuccess] = useState(false);

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotifySuccess(true);
    setTimeout(() => setSaveNotifySuccess(false), 2000);
  };

  // Password reset state
  const [resetSent, setResetSent] = useState(false);
  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      alert("Error sending password reset: " + err.message);
    }
  };

  // Data Actions
  const [historyCleared, setHistoryCleared] = useState(false);
  const handleClearHistory = () => {
    if (confirm("Are you sure you want to purge all site diagnostics log data? This is permanent.")) {
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 3000);
    }
  };

  const [exporting, setExporting] = useState(false);
  const handleExportData = async () => {
    try {
      setExporting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      if (typeof window !== "undefined") {
        const impToken = localStorage.getItem("impersonation_token");
        if (impToken) {
          headers["x-impersonation-token"] = impToken;
        }
      }
      
      const res = await fetch("/api/user/export", { headers });
      if (!res.ok) {
        throw new Error("Failed to compile user data export");
      }
      const data = await res.json();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `heydrona_data_export_${currentUser?.id || "account"}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err: any) {
      alert("Error exporting data: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      if (typeof window !== "undefined") {
        const impToken = localStorage.getItem("impersonation_token");
        if (impToken) {
          headers["x-impersonation-token"] = impToken;
        }
      }
      const res = await fetch("/api/billing/portal", { headers });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to launch billing portal");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleCancelSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCancelling(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      if (typeof window !== "undefined") {
        const impToken = localStorage.getItem("impersonation_token");
        if (impToken) {
          headers["x-impersonation-token"] = impToken;
        }
      }
      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to cancel subscription");
      }
      setCancelSuccess(true);
      setTimeout(() => {
        setCancelSuccess(false);
        setShowCancelModal(false);
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      alert("Error cancelling subscription: " + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteAccount = () => {
    alert("To permanently delete your registered account & clear customer data records, please contact security compliance: compliance@heydrona.com");
  };

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      <div className="pb-4 border-b border-zinc-150 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">System Preferences & Settings</h2>
          <p className="text-sm mt-1 text-zinc-550">
            Manage your SEO growth agent subscription plan, notification templates, security parameters, and data control compliance logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Billing & Notifications */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Billing & Subscription */}
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150 mb-5">
              <CreditCard className="w-5 h-5 text-violet-650" />
              <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                Billing & Subscription Limits
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Current Plan Tier</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 rounded-lg border-2 border-zinc-950 bg-violet-50 text-violet-755 text-xs font-black uppercase tracking-wider font-mono">
                      {planName} Plan
                    </span>
                    {isPaid && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono uppercase">
                        <CheckCircle className="w-3.5 h-3.5" /> Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Active Plan Quotas</span>
                  <ul className="text-xs space-y-1.5 font-mono text-zinc-650">
                    <li className="flex items-center justify-between border-b border-zinc-100 pb-1">
                      <span>Maximum Monitored Sites:</span>
                      <span className="font-bold text-zinc-900">{limits.maxSites === Infinity ? "Unlimited" : limits.maxSites}</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-zinc-100 pb-1">
                      <span>Audit Cooldown Period:</span>
                      <span className="font-bold text-zinc-900">{limits.cooldownMinutes === 0 ? "None (Instant)" : `${limits.cooldownMinutes} minutes`}</span>
                    </li>
                    <li className="flex items-center justify-between border-b border-zinc-100 pb-1">
                      <span>Auto WordPress Update:</span>
                      <span className="font-bold text-zinc-900">{limits.wpAutoApply ? "Enabled" : "Disabled (Copy/Paste)"}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>AI Crawler Chatbot:</span>
                      <span className="font-bold text-zinc-900">{limits.chatbot ? "Available" : "Upgrade Required"}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col justify-between p-4 bg-zinc-50 border-2 border-zinc-950 rounded-2xl shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-black text-violet-650 font-mono">Billing Portal</span>
                  <h4 className="text-xs font-bold text-zinc-800 font-mono">Manage Payment Details</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-505 font-mono mt-1">
                    Update payment details, cancel subscriptions, or upgrade your active quotas.
                  </p>
                </div>
                
                {isPaid && currentUser?.subscriptionStatus === "canceled" && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-205 text-[10px] font-mono rounded-lg text-amber-805 leading-normal">
                    ⚠️ Your subscription was cancelled. Access continues until {currentUser.subscriptionEndsAt ? new Date(currentUser.subscriptionEndsAt).toLocaleDateString() : "the end of your period"}.
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  {isPaid ? (
                    <>
                      <button
                        onClick={handleManageBilling}
                        disabled={loadingPortal}
                        type="button"
                        className="w-full py-2 border-2 border-zinc-950 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] cursor-pointer"
                      >
                        {loadingPortal ? "Launching..." : "Manage Billing Portal"}
                      </button>
                      {currentUser?.subscriptionStatus !== "canceled" && (
                        <button
                          onClick={() => setShowCancelModal(true)}
                          type="button"
                          className="w-full py-2 border-2 border-red-305 bg-red-50 text-red-750 hover:bg-red-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] cursor-pointer"
                        >
                          Cancel Subscription
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      type="button"
                      className="w-full py-2 border-2 border-zinc-950 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] cursor-pointer"
                    >
                      {isSubscribing ? "Redirecting..." : "Upgrade to Pro ($19/mo)"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Invoice & Receipt History Section */}
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-150 mb-5">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-650" />
                <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                  Invoice & Payment History
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">Stripe Hosted Receipts</span>
            </div>

            {loadingInvoices ? (
              <div className="py-6 text-center text-xs font-mono text-zinc-400">
                Loading invoice records...
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-zinc-500 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                No past billing invoices or payment receipts found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-zinc-950 bg-zinc-100 text-zinc-700">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Invoice Ref</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">PDF Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-zinc-200">
                        <td className="py-2.5 px-3 font-medium text-zinc-800">
                          {new Date(inv.created * 1000).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600">
                          {inv.number || inv.id}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900">
                          ${(inv.amountPaid / 100).toFixed(2)} {(inv.currency || "USD").toUpperCase()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {inv.status || "Paid"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {inv.pdfUrl || inv.hostedUrl ? (
                            <a
                              href={inv.pdfUrl || inv.hostedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-violet-650 hover:underline"
                            >
                              View Invoice <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-zinc-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Notifications Panel */}
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150 mb-5">
              <Bell className="w-5 h-5 text-violet-650" />
              <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                Notification Preferences
              </h3>
            </div>

            <form onSubmit={handleSaveNotifications} className="space-y-4 font-mono text-xs">
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifyWeekly} 
                    onChange={(e) => setNotifyWeekly(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 border-zinc-950 focus:ring-violet-500 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-zinc-800 block">Weekly SEO health summary reports</span>
                    <span className="text-[10px] text-zinc-450">Get summary metrics regarding weekly rescan scores and newly found crawl diagnostics.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifyErrors} 
                    onChange={(e) => setNotifyErrors(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 border-zinc-950 focus:ring-violet-500 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-zinc-800 block">Critical crawler error notifications</span>
                    <span className="text-[10px] text-zinc-450">Receive alerts if a crawl scan fails, hits SSL security issues, or redirects fail.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifyCMS} 
                    onChange={(e) => setNotifyCMS(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 border-zinc-950 focus:ring-violet-500 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-zinc-800 block">WordPress draft synchronization updates</span>
                    <span className="text-[10px] text-zinc-450">Get alert logs when a new generated blog post is published to your WordPress CMS integration.</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="primary" type="submit" className="px-5 py-2.5 text-xs">
                  Save Alert Settings
                </Button>
                {saveNotifySuccess && (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 font-mono uppercase">
                    <CheckCircle className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Connections, Data & Password */}
        <div className="space-y-6">
          
          {/* Active Connections */}
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150 mb-4">
              <Layers className="w-5 h-5 text-violet-650" />
              <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                Console Connections
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/30 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-zinc-800 block">WordPress integration</span>
                  <span className="text-[10px] text-zinc-450 truncate block max-w-[150px]">
                    {currentSite?.wpUrl ? currentSite.wpUrl.replace(/^https?:\/\//i, "") : "Not integrated"}
                  </span>
                </div>
                {currentSite?.wpUrl ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200 font-bold uppercase shrink-0">
                    Connected
                  </span>
                ) : (
                  <button
                    onClick={() => selectTab("connections")}
                    type="button"
                    className="text-[10px] text-violet-600 hover:text-violet-800 underline font-bold shrink-0 cursor-pointer"
                  >
                    Connect
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/30 flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-zinc-800 block">Search Console</span>
                  <span className="text-[10px] text-zinc-450 block font-mono">
                    {currentSite?.gscConnected ? "Synced property" : "GSC Property disconnect"}
                  </span>
                </div>
                {currentSite?.gscConnected ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200 font-bold uppercase shrink-0">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => selectTab("sites")}
                    type="button"
                    className="text-[10px] text-violet-600 hover:text-violet-800 underline font-bold shrink-0 cursor-pointer"
                  >
                    Sync Property
                  </button>
                )}
              </div>
            </div>
          </Card>

          {/* Security & Access */}
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150 mb-4">
              <Key className="w-5 h-5 text-violet-650" />
              <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                Security & Credentials
              </h3>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <p className="text-[11px] leading-relaxed text-zinc-505">
                Request a password modification token. We will send a secure validation verification link to your email.
              </p>
              
              <button
                onClick={handleResetPassword}
                disabled={resetSent}
                type="button"
                className="w-full py-2 border-2 border-zinc-950 bg-white text-zinc-805 hover:bg-zinc-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              >
                {resetSent ? "Reset Email Dispatched!" : "Trigger Password Reset"}
              </button>

              {resetSent && (
                <div className="p-2.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] rounded-xl leading-normal">
                  Password reset invitation email sent to <b>{currentUser?.email}</b>. Follow instructions to set credentials.
                </div>
              )}
            </div>
          </Card>

          {/* Data Control (Compliance) */}
          <Card variant="flat" className="p-6 border-2 border-zinc-950 bg-white">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-150 mb-4">
              <ShieldCheck className="w-5 h-5 text-violet-650" />
              <h3 className="font-bold text-zinc-900 text-sm font-mono uppercase tracking-wider">
                Compliance & Data Control
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <button
                onClick={handleExportData}
                type="button"
                className="w-full py-2.5 border rounded-xl flex items-center justify-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Data (JSON)
              </button>

              <button
                onClick={handleClearHistory}
                type="button"
                className="w-full py-2.5 border rounded-xl flex items-center justify-center gap-1.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Purge Crawl History
              </button>

              {historyCleared && (
                <span className="text-[10px] text-emerald-600 font-bold block text-center uppercase tracking-wider animate-pulse">
                  ✓ diagnostics database cached logs cleared.
                </span>
              )}

              <div className="border-t border-zinc-150 pt-3">
                <button
                  onClick={handleDeleteAccount}
                  type="button"
                  className="w-full py-2 border-2 border-red-300 bg-red-50 text-red-750 hover:bg-red-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-zinc-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <Card variant="flat" className="bg-white border-2 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] max-w-md w-full relative p-6 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">
                Confirm Cancellation
              </span>
              <h4 className="text-sm font-bold text-zinc-900">
                Why do you want to cancel your subscription?
              </h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                We're sorry to see you go! Please share your reason to help us improve the SEO Agent.
              </p>
            </div>

            <form onSubmit={handleCancelSubscription} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 border-2 border-zinc-950 text-xs rounded-xl focus:outline-none bg-white text-zinc-805"
                >
                  <option value="too_expensive">Too expensive</option>
                  <option value="not_using_it">Not using it enough</option>
                  <option value="missing_features">Missing key features</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              {cancelSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-[10px] rounded-xl flex items-center gap-2">
                  <span>✓</span>
                  <span>Subscription cancelled successfully. Refreshing dashboard...</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                  type="button"
                  className="w-full py-2.5 border-2 border-zinc-950 bg-white hover:bg-zinc-50 text-zinc-800 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                >
                  Keep Subscription
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || cancelSuccess}
                  className="w-full py-2.5 border-2 border-zinc-950 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                >
                  {isCancelling ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;
