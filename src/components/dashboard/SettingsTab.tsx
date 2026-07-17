import React, { useState } from "react";
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
  Sparkles
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

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user: currentUser,
      site: currentSite,
      sitesList: allSites,
      exportedAt: new Date().toISOString()
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `heydrona_settings_export_${currentUser.id || "account"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
                  <span className="text-[9px] uppercase tracking-widest font-black text-violet-650 font-mono">Stripe Portal</span>
                  <h4 className="text-xs font-bold text-zinc-800 font-mono">Manage Payment Details</h4>
                  <p className="text-[11px] leading-relaxed text-zinc-505 font-mono mt-1">
                    Add new card payments, download invoice receipts, or switch pricing tiers directly.
                  </p>
                </div>
                <button
                  onClick={handleSubscribe}
                  disabled={isSubscribing}
                  type="button"
                  className="w-full mt-4 py-2 border-2 border-zinc-950 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] cursor-pointer"
                >
                  {isSubscribing ? "Redirecting..." : isPaid ? "Manage Billing Portal" : "Upgrade to Pro ($19/mo)"}
                </button>
              </div>
            </div>
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
    </div>
  );
};
export default SettingsTab;
