import React, { useState } from "react";
import { Sparkles, Globe, Settings, HeartPulse, FileText, Activity, LogOut, X, Menu, Layers, Database, BarChart2, ChevronUp, Search, MessageSquare, Shield, Clock } from "lucide-react";
import { TabType } from "@/hooks/useDashboardData";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getEffectivePlanLimits } from "@/lib/planLimits";

interface SidebarProps {
  activeTab: TabType;
  selectTab: (tab: TabType) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: any;
  currentSite: any;
  handleSubscribe: () => void;
  isSubscribing: boolean;
  allSites?: any[];
  currentAudit?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  selectTab,
  isSidebarOpen,
  setIsSidebarOpen,
  currentUser,
  currentSite,
  handleSubscribe,
  isSubscribing,
  allSites = [],
  currentAudit = null,
}) => {
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace("/login");
  };

  const sections = [
    {
      title: "Workspace",
      items: [
        { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
        { id: "flow", label: "Agent Flow", icon: <Layers className="w-4 h-4" /> },
      ],
    },
    {
      title: "Growth",
      items: [
        { id: "recommendations", label: "Recommendations", icon: <HeartPulse className="w-4 h-4" />, hasBadge: true },
        { id: "content", label: "Content", icon: <FileText className="w-4 h-4" /> },
        { id: "keywords", label: "Keyword Research", icon: <Search className="w-4 h-4" /> },
        { id: "competitors", label: "Competitors", icon: <Shield className="w-4 h-4" /> },
      ],
    },
    {
      title: "Health",
      items: [
        { id: "performance", label: "Performance", icon: <BarChart2 className="w-4 h-4" /> },
        { id: "uptime", label: "Uptime", icon: <Clock className="w-4 h-4" /> },
      ],
    },
    {
      title: "Setup",
      items: [
        { id: "sites", label: "Sites & Connections", icon: <Globe className="w-4 h-4" /> },
        { id: "settings", label: "Support/Settings", icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/40 z-30 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 w-64 border-r flex flex-col shrink-0 z-40 border-zinc-200 bg-white shadow-xl transition-transform duration-300 md:sticky md:top-0 md:h-screen md:self-start md:translate-x-0 md:shadow-sm md:z-20
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b gap-3 border-zinc-100">
          <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-zinc-900">
              HeyDrona Growth
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1 rounded-xl md:hidden hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            aria-label="Close sidebar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {sections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="px-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono block mb-2">
                {sec.title}
              </span>
              {sec.items.map((item) => {
                const isRecs = item.hasBadge;
                const pendingCount = isRecs && currentAudit?.items
                  ? currentAudit.items.filter((i: any) => i.status === "pending").length
                  : 0;

                return (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id as TabType)}
                    type="button"
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                      activeTab === item.id
                        ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm"
                        : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {isRecs && pendingCount > 0 && (
                      <span className="bg-rose-500 text-white text-[9px] font-black font-mono px-3 py-0.5 rounded-full shadow-sm animate-pulse">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {currentUser?.isAdmin && (
            <Link
              href="/admin"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
            >
              <Settings className="w-4 h-4 text-violet-500" />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* User profile & Menu Trigger */}
        <div className="p-4 border-t border-zinc-200 relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            type="button"
            className="w-full p-2.5 border rounded-xl flex items-center justify-between bg-zinc-50 border-zinc-200 hover:bg-zinc-100 transition-colors shadow-sm text-left font-mono"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-zinc-700 truncate">
                  {currentUser?.email || "User Profile"}
                </span>
                <span className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider">
                  {(() => {
                    const limits = getEffectivePlanLimits(currentUser);
                    return currentUser?.plan 
                      ? currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1) 
                      : currentUser?.subscriptionActive ? "Premium" : "Free";
                  })()} Plan
                </span>
              </div>
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          {isProfileMenuOpen && (
            <div className="absolute bottom-16 left-4 right-4 border-2 border-zinc-950 bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)] z-50 animate-scale-up py-1.5 flex flex-col divide-y divide-zinc-150 font-mono">
              <div className="px-3.5 py-2 flex flex-col gap-0.5 text-[9px] font-bold text-zinc-450 uppercase tracking-widest">
                <span>Account Status</span>
                <span className="text-violet-650 font-mono text-[10px] lowercase normal-case tracking-normal truncate">
                  {currentUser?.email}
                </span>
              </div>

              <div className="flex flex-col p-1.5 gap-1">
                {(!currentUser?.subscriptionActive || (() => {
                  const limits = getEffectivePlanLimits(currentUser);
                  return limits.maxSites !== Infinity && limits.maxSites < 10;
                })()) && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleSubscribe();
                    }}
                    type="button"
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg text-violet-650 hover:bg-violet-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    🚀 Upgrade Plan
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    selectTab("settings");
                  }}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  ⚙️ Settings Page
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    selectTab("context");
                  }}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  👤 Personalise Agent
                </button>
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    alert("Support Desk: email support@heydrona.com for quick assistance!");
                  }}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  ❓ Help & Support
                </button>
              </div>

              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  type="button"
                  className="w-full py-1.5 border rounded-lg text-[11px] font-bold transition-all bg-white border-zinc-300 text-zinc-650 hover:bg-zinc-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
