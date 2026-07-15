import React from "react";
import { Sparkles, Globe, Settings, HeartPulse, FileText, Activity, LogOut, X, Menu } from "lucide-react";
import { TabType } from "@/hooks/useDashboardData";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BillingUpgradeBanner } from "./BillingUpgradeBanner";

interface SidebarProps {
  activeTab: TabType;
  selectTab: (tab: TabType) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUser: any;
  currentSite: any;
  handleSubscribe: () => void;
  isSubscribing: boolean;
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
}) => {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      label: "Agent Activity",
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: "crawler",
      label: "Site Crawler (Core)",
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: "recommendations",
      label: "AI Recommendations",
      icon: <HeartPulse className="w-4 h-4" />,
    },
    {
      id: "content",
      label: "AI Content Suite",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: "cms",
      label: "CMS Settings",
      icon: <Settings className="w-4 h-4" />,
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
          fixed inset-y-0 left-0 w-64 border-r flex flex-col shrink-0 z-40 border-zinc-200 bg-white shadow-xl transition-transform duration-300 md:static md:translate-x-0 md:shadow-sm md:z-20
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b gap-3 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-zinc-900">
              HeyDrona Growth
            </span>
          </div>
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
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTab(item.id)}
              type="button"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${
                activeTab === item.id
                  ? "bg-violet-50 border-violet-100 text-violet-755 font-bold shadow-sm"
                  : "text-zinc-550 hover:bg-zinc-100 hover:text-zinc-900 border-transparent"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
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

        {/* Pricing / Status Upgrade */}
        <BillingUpgradeBanner
          currentUser={currentUser}
          handleSubscribe={handleSubscribe}
          isSubscribing={isSubscribing}
        />


        {/* User profile & Logout */}
        <div className="p-4 border-t border-zinc-200">
          <div className="p-3 border rounded-xl flex flex-col gap-2 bg-zinc-50 border-zinc-200 shadow-sm">
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Logged In As
              </span>
              <span className="text-xs font-semibold text-zinc-700 truncate font-mono mt-0.5">
                {currentUser?.email || "loading..."}
              </span>
            </div>
            <button
              onClick={handleLogout}
              type="button"
              className="w-full py-2 border rounded-lg text-xs font-bold transition-all bg-white border-zinc-300 text-zinc-650 hover:bg-zinc-100 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
