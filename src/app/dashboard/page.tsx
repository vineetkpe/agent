"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { CrawlerTab } from "@/components/dashboard/CrawlerTab";
import { RecommendationsTab } from "@/components/dashboard/RecommendationsTab";
import { ContentTab } from "@/components/dashboard/ContentTab";
import { ConnectionsTab } from "@/components/dashboard/ConnectionsTab";
import { Chatbot } from "@/components/dashboard/Chatbot";
import { SitesTab } from "@/components/dashboard/SitesTab";
import { AIContextTab } from "@/components/dashboard/AIContextTab";
import { PerformanceTab } from "@/components/dashboard/PerformanceTab";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { ChevronRight, Menu } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [planLimitError, setPlanLimitError] = useState<{ message: string; type?: string } | null>(null);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch(...args);
      if (response.status === 402 || response.status === 403) {
        const clone = response.clone();
        clone.json().then(data => {
          if (data && (data.error === "plan_limit" || data.error === "upgrade_required")) {
            window.dispatchEvent(new CustomEvent("plan-limit-exceeded", {
              detail: {
                message: data.message || "You have reached your plan limits.",
                type: data.error,
              }
            }));
          }
        }).catch(() => {});
      }
      return response;
    };

    const handlePlanLimit = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPlanLimitError(customEvent.detail);
    };

    window.addEventListener("plan-limit-exceeded", handlePlanLimit);

    return () => {
      window.fetch = originalFetch;
      window.removeEventListener("plan-limit-exceeded", handlePlanLimit);
    };
  }, []);

  const handleDismissOnboarding = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/user/onboarding", { method: "POST", headers });
      if (res.ok) {
        await data.fetchInitialData(data.selectedSiteId || undefined);
      }
    } catch (err) {
      console.error("Failed to dismiss onboarding:", err);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthenticated(false);
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const data = useDashboardData();

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest font-mono">
            Checking Session...
          </span>
        </div>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-violet-500 selection:text-white relative bg-zinc-50 text-zinc-800">
      <ImpersonationBanner />
      <div className="flex-1 flex relative">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none -z-10 bg-violet-500/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none -z-10 bg-indigo-500/3" />

      <Sidebar
        activeTab={data.activeTab}
        selectTab={data.selectTab}
        isSidebarOpen={data.isSidebarOpen}
        setIsSidebarOpen={data.setIsSidebarOpen}
        currentUser={data.currentUser}
        currentSite={data.currentSite}
        handleSubscribe={data.handleSubscribe}
        isSubscribing={data.isSubscribing}
        allSites={data.allSites}
        currentAudit={data.currentAudit}
      />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 border-zinc-200 bg-white/75 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => data.setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl md:hidden hover:bg-zinc-100 text-zinc-650 transition-colors"
              aria-label="Open sidebar"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm hidden md:inline text-zinc-400 font-mono uppercase tracking-wider">Workspace</span>
            <ChevronRight className="w-4 h-4 hidden md:inline text-zinc-300" />
            <span className="text-sm font-semibold capitalize text-zinc-850 font-mono">
              {data.activeTab === "connections" ? "Connections" : data.activeTab}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {data.allSites && data.allSites.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono hidden sm:inline">Active Site:</span>
                <select
                  value={data.selectedSiteId || ""}
                  onChange={(e) => {
                    data.setSelectedSiteId(e.target.value);
                    data.setSelectedAuditId(null);
                  }}
                  className="px-2.5 py-1 text-xs font-bold border-2 border-zinc-950 bg-white rounded-lg focus:outline-none shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]"
                >
                  {data.allSites.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.url.replace(/^https?:\/\//i, "")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {data.currentSite?.wpUrl ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm font-mono">
                CMS Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-zinc-100 text-zinc-500 border-zinc-200 font-mono">
                CMS Disconnected
              </span>
            )}

            <NotificationBell selectTab={data.selectTab} />
          </div>
        </header>

        {/* Tab Content Box */}
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8">
          {data.billingMessage && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50 text-sm text-emerald-800 flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                {data.billingMessage}
              </span>
              <button
                onClick={() => data.setBillingMessage("")}
                className="text-zinc-400 hover:text-zinc-800 text-xs font-semibold p-1"
                type="button"
              >
                ✕
              </button>
            </div>
          )}

          {data.activeTab === "overview" && (
            <div className="space-y-6 animate-slide-up">
              {!data.currentUser?.onboardingCompletedAt && (
                <OnboardingChecklist
                  currentUser={data.currentUser}
                  allSites={data.allSites}
                  currentSite={data.currentSite}
                  currentAudit={data.currentAudit}
                  selectTab={data.selectTab}
                  onDismiss={handleDismissOnboarding}
                />
              )}
              <OverviewTab
                currentSite={data.currentSite}
                currentAudit={data.currentAudit}
                selectTab={data.selectTab}
                pastAudits={data.pastAudits}
                activityLog={data.activityLog}
              />
            </div>
          )}

          {data.activeTab === "crawler" && (
            <CrawlerTab
              handleRunAudit={data.handleRunAudit}
              siteUrl={data.siteUrl}
              setSiteUrl={data.setSiteUrl}
              isCrawling={data.isCrawling}
              crawlStep={data.crawlStep}
              errorMessage={data.errorMessage}
              currentAudit={data.currentAudit}
              currentSite={data.currentSite}
              selectTab={data.selectTab}
              aiScanStatus={data.aiScanStatus}
              pageSpeedScanStatus={data.pageSpeedScanStatus}
              aiScanError={data.aiScanError}
              pageSpeedScanError={data.pageSpeedScanError}
            />
          )}

          {data.activeTab === "recommendations" && (
            <RecommendationsTab
              currentAudit={data.currentAudit}
              handleActionItem={data.handleActionItem}
              handleCopyText={data.handleCopyText}
              copiedId={data.copiedId}
              currentSite={data.currentSite}
              selectTab={data.selectTab}
            />
          )}

          {data.activeTab === "content" && (
            <ContentTab
              currentAudit={data.currentAudit}
              handleActionItem={data.handleActionItem}
              previewBlogPost={data.previewBlogPost}
              setPreviewBlogPost={data.setPreviewBlogPost}
              handleCopyText={data.handleCopyText}
              copiedId={data.copiedId}
              selectTab={data.selectTab}
            />
          )}

          {data.activeTab === "connections" && (
            <ConnectionsTab
              handleConnectCMS={data.handleConnectCMS}
              wpUrl={data.wpUrl}
              setWpUrl={data.setWpUrl}
              wpUsername={data.wpUsername}
              setWpUsername={data.setWpUsername}
              wpAppPassword={data.wpAppPassword}
              setWpAppPassword={data.setWpAppPassword}
              isConnectingWp={data.isConnectingWp}
              wpMessage={data.wpMessage}
              currentSite={data.currentSite}
              toggleGscConnection={data.toggleGscConnection}
            />
          )}

          {data.activeTab === "sites" && (
            <SitesTab
              allSites={data.allSites}
              selectedSiteId={data.selectedSiteId}
              setSelectedSiteId={data.setSelectedSiteId}
              selectTab={data.selectTab}
              pastAudits={data.pastAudits}
              selectedAuditId={data.selectedAuditId}
              setSelectedAuditId={data.setSelectedAuditId}
              currentAudit={data.currentAudit}
              deleteSite={data.deleteSite}
              toggleGscConnection={data.toggleGscConnection}
              addSite={data.addSite}
            />
          )}

          {data.activeTab === "context" && (
            <AIContextTab
              currentSite={data.currentSite}
              currentAudit={data.currentAudit}
              fetchInitialData={data.fetchInitialData}
              selectTab={data.selectTab}
            />
          )}

          {data.activeTab === "performance" && (
            <PerformanceTab
              pastAudits={data.pastAudits}
              currentAudit={data.currentAudit}
              currentSite={data.currentSite}
              selectTab={data.selectTab}
            />
          )}
        </div>
      </main>
      </div>
      <Chatbot currentSite={data.currentSite} />

      {planLimitError && (
        <div className="fixed inset-0 bg-zinc-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border-2 border-zinc-950 rounded-2xl shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] p-6 max-w-md w-full relative space-y-4 animate-scale-up font-mono">
            <div className="flex items-center gap-2 text-violet-650">
              <span className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-base">
                ⚠️
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider">Plan Limit Reached</h3>
            </div>
            <p className="text-xs text-zinc-650 leading-relaxed">
              {planLimitError.message}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setPlanLimitError(null)}
                className="flex-1 py-2.5 border-2 border-zinc-950 bg-white text-zinc-800 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-55"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setPlanLimitError(null);
                  router.push("/#pricing");
                }}
                className="flex-1 py-2.5 border-2 border-zinc-950 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-750"
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
