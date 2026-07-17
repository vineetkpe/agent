import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export type TabType = "overview" | "crawler" | "recommendations" | "content" | "connections" | "sites" | "context" | "performance" | "settings" | "notifications" | "keywords" | "support";

export function useDashboardData() {
  const [siteUrl, setSiteUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStep, setCrawlStep] = useState("");
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [currentAudit, setCurrentAudit] = useState<any>(null);
  const [pastAudits, setPastAudits] = useState<any[]>([]);
  const [allSites, setAllSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [activityLog, setActivityLog] = useState<any[]>([]);

  // Independent scan progress states
  const [aiScanStatus, setAiScanStatus] = useState<"pending" | "running" | "done" | "failed">("pending");
  const [pageSpeedScanStatus, setPageSpeedScanStatus] = useState<"pending" | "running" | "done" | "failed">("pending");
  const [aiScanError, setAiScanError] = useState<string | null>(null);
  const [pageSpeedScanError, setPageSpeedScanError] = useState<string | null>(null);

  const [wpUrl, setWpUrl] = useState("");
  const [wpUsername, setWpUsername] = useState("");
  const [wpAppPassword, setWpAppPassword] = useState("");
  const [isConnectingWp, setIsConnectingWp] = useState(false);
  const [wpMessage, setWpMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [previewBlogPost, setPreviewBlogPost] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [prefilledKeyword, setPrefilledKeyword] = useState<string>("");
  const [uptimeChecks, setUptimeChecks] = useState<any[]>([]);

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getHeaders = async (contentType = "application/json") => {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    if (typeof window !== "undefined") {
      const impToken = localStorage.getItem("impersonation_token");
      if (impToken) {
        headers["x-impersonation-token"] = impToken;
      }
    }

    return headers;
  };

  const fetchInitialData = async (siteIdToLoad?: string, auditIdToLoad?: string) => {
    try {
      const headers = await getHeaders("");
      const params = new URLSearchParams();
      if (siteIdToLoad) params.set("siteId", siteIdToLoad);
      if (auditIdToLoad) params.set("auditId", auditIdToLoad);
      const res = await fetch(`/api/audit?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.site) {
          setCurrentSite(data.site);
          setSiteUrl(data.site.url);
          setWpUrl(data.site.wpUrl || "");
          setWpUsername(data.site.wpUsername || "");
          setSelectedSiteId(data.site.id);
        } else {
          setCurrentSite(null);
          setCurrentAudit(null);
          setPastAudits([]);
        }
        if (data.audit) {
          setCurrentAudit(data.audit);
        } else {
          setCurrentAudit(null);
        }
        if (data.pastAudits) {
          setPastAudits(data.pastAudits);
        }
        if (data.activityLog) {
          setActivityLog(data.activityLog);
        } else {
          setActivityLog([]);
        }
        if (data.allSites) {
          setAllSites(data.allSites);
        }
        if (data.user) {
          setCurrentUser(data.user);
        }
        setUptimeChecks(data.uptimeChecks || []);
      }
    } catch (err) {
      console.error("Failed to load initial data", err);
    }
  };

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const headers = await getHeaders("application/json");
      const res = await fetch("/api/stripe/checkout", { method: "POST", headers });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to trigger Stripe checkout");
      }
    } catch (err) {
      console.error(err);
      alert("Stripe session creation failed.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteUrl) return;

    setIsCrawling(true);
    setErrorMessage("");
    setCrawlStep("Initiating deep crawler...");

    // Set initial states
    setAiScanStatus("running");
    setPageSpeedScanStatus("pending");
    setAiScanError(null);
    setPageSpeedScanError(null);

    try {
      const steps = [
        "Resolving domain headers...",
        "Crawling subpages (up to limit)...",
        "Parsing HTML structure...",
        "Validating meta titles & descriptions...",
        "Analyzing image alternative text tags...",
        "Scanning for broken outbound links...",
        "Analyzing JSON-LD Schema structures...",
        "Feeding data payload to Gemini AI provider...",
        "Generating optimized SEO fixes...",
        "Writing target content blog post drafts...",
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          setCrawlStep(steps[stepIdx]);
          stepIdx++;

          if (stepIdx === 5) {
            setAiScanStatus("running");
            setPageSpeedScanStatus("running");
          }
        }
      }, 900);

      const headers = await getHeaders("application/json");
      const res = await fetch("/api/audit", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: siteUrl, targetKeyword: prefilledKeyword }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Audit failed to run.");
      }

      const data = await res.json();
      if (data.success) {
        // Resolve states
        if (data.audit.aiScanError) {
          setAiScanStatus("failed");
          setAiScanError(data.audit.aiScanError);
        } else {
          setAiScanStatus("done");
        }

        if (data.audit.pageSpeedScanError) {
          setPageSpeedScanStatus("failed");
          setPageSpeedScanError(data.audit.pageSpeedScanError);
        } else {
          setPageSpeedScanStatus("done");
        }

        setCurrentAudit(data.audit);
        setSelectedSiteId(data.audit.siteId);
        setSelectedAuditId(data.audit.id);
        fetchInitialData(data.audit.siteId, data.audit.id);
        setActiveTab("crawler");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during the audit scan.");
      setAiScanStatus("failed");
      setAiScanError(err.message || "Execution timeout or network error.");
      setPageSpeedScanStatus("failed");
      setPageSpeedScanError(err.message || "Execution timeout or network error.");
    } finally {
      setIsCrawling(false);
      setCrawlStep("");
    }
  };

  const handleConnectCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpUrl || !wpUsername || !wpAppPassword) {
      setWpMessage({ text: "All connection fields are required.", isError: true });
      return;
    }

    setIsConnectingWp(true);
    setWpMessage(null);

    try {
      const headers = await getHeaders("application/json");
      const res = await fetch("/api/wordpress/connect", {
        method: "POST",
        headers,
        body: JSON.stringify({
          wpUrl,
          username: wpUsername,
          appPassword: wpAppPassword,
          siteUrl: currentSite?.url || siteUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "CMS connection authorization failed.");
      }

      setWpMessage({ text: "CMS REST API connected and authorized successfully!", isError: false });
      setWpAppPassword("");
      fetchInitialData(selectedSiteId || undefined);
    } catch (err: any) {
      setWpMessage({ text: err.message || "Could not authorize CMS API connection.", isError: true });
    } finally {
      setIsConnectingWp(false);
    }
  };

  const handleActionItem = async (itemId: string, action: "approve" | "reject") => {
    try {
      const headers = await getHeaders("application/json");
      const res = await fetch("/api/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({ itemId, action }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentAudit((prev: any) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((item: any) => {
            if (item.id === itemId) {
              return {
                ...item,
                status: data.status,
                appliedAt: data.item.appliedAt,
                suggestedValue: data.item.suggestedValue,
              };
            }
            return item;
          });
          return { ...prev, items: updatedItems };
        });
      } else {
        alert(data.error || "Failed to process item approval.");
        if (data.item) {
          setCurrentAudit((prev: any) => {
            if (!prev) return prev;
            const updatedItems = prev.items.map((item: any) =>
              item.id === itemId ? { ...item, errorMessage: data.item.errorMessage, status: data.item.status } : item
            );
            return { ...prev, items: updatedItems };
          });
        }
      }
    } catch (err) {
      console.error("Failed to approve/reject item", err);
    }
  };

  const deleteSite = async (siteId: string) => {
    if (!confirm("Are you sure you want to delete this site and all its audit reports? This action cannot be undone.")) {
      return;
    }
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/site/delete", {
        method: "POST",
        headers,
        body: JSON.stringify({ siteId }),
      });
      const data = await res.json();
      if (res.ok) {
        // If the deleted site was selected, pick another or clear
        const remaining = allSites.filter((s) => s.id !== siteId);
        if (selectedSiteId === siteId) {
          if (remaining.length > 0) {
            setSelectedSiteId(remaining[0].id);
          } else {
            setSelectedSiteId(null);
            setCurrentSite(null);
            setCurrentAudit(null);
          }
        }
        setAllSites(remaining);
        await fetchInitialData(selectedSiteId === siteId ? undefined : selectedSiteId || undefined);
      } else {
        alert(data.error || "Failed to delete site.");
      }
    } catch (err) {
      console.error("Failed to delete site", err);
    }
  };

  const toggleGscConnection = async (siteId: string, gscUrl?: string, disconnect?: boolean) => {
    try {
      if (disconnect) {
        const headers = await getHeaders();
        const res = await fetch("/api/site/gsc", {
          method: "POST",
          headers,
          body: JSON.stringify({ siteId, disconnect }),
        });
        const data = await res.json();
        if (res.ok) {
          // Update states locally
          if (currentSite && currentSite.id === siteId) {
            setCurrentSite((prev: any) => ({
              ...prev,
              gscConnected: false,
              gscUrl: null,
            }));
          }
          setAllSites((prev: any[]) =>
            prev.map((s) =>
              s.id === siteId
                ? { ...s, gscConnected: false, gscUrl: null }
                : s
            )
          );
          alert("Google Search Console disconnected successfully!");
        } else {
          alert(data.error || "Failed to disconnect Search Console.");
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token || "";
        const impToken = typeof window !== "undefined" ? localStorage.getItem("impersonation_token") || "" : "";
        
        let connectUrl = `/api/auth/google/connect?siteId=${encodeURIComponent(siteId)}`;
        if (token) {
          connectUrl += `&token=${encodeURIComponent(token)}`;
        }
        if (impToken) {
          connectUrl += `&impersonation_token=${encodeURIComponent(impToken)}`;
        }
        if (gscUrl) {
          connectUrl += `&gscUrl=${encodeURIComponent(gscUrl)}`;
        }
        // Redirect browser to trigger Google OAuth flow
        window.location.href = connectUrl;
      }
    } catch (err) {
      console.error("GSC connection failed", err);
    }
  };

  const addSite = async (url: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch("/api/site/create", {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setAllSites((prev) => [data.site, ...prev]);
        setSelectedSiteId(data.site.id);
        setSelectedAuditId(null);
        setCurrentAudit(null);
        await fetchInitialData(data.site.id);
      } else {
        alert(data.error || "Failed to add new site.");
      }
    } catch (err) {
      console.error("Failed to add site", err);
    }
  };

  useEffect(() => {
    fetchInitialData(selectedSiteId || undefined);
  }, [selectedSiteId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success" || params.get("mock_payment") === "success") {
        setBillingMessage("🎉 Subscription activated successfully! Welcome to Premium!");
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const tab = params.get("tab");
      if (tab === "connections") {
        setActiveTab("connections");
      }

      const successMsg = params.get("success");
      const errorMsg = params.get("error");
      if (successMsg) {
        alert(successMsg);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (errorMsg) {
        alert(errorMsg);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  return {
    siteUrl,
    setSiteUrl,
    isCrawling,
    crawlStep,
    currentSite,
    currentAudit,
    errorMessage,
    activityLog,
    wpUrl,
    setWpUrl,
    wpUsername,
    setWpUsername,
    wpAppPassword,
    setWpAppPassword,
    isConnectingWp,
    wpMessage,
    setWpMessage,
    currentUser,
    isSubscribing,
    billingMessage,
    setBillingMessage,
    copiedId,
    activeTab,
    setActiveTab,
    previewBlogPost,
    setPreviewBlogPost,
    isSidebarOpen,
    setIsSidebarOpen,
    selectTab,
    handleCopyText,
    handleSubscribe,
    handleRunAudit,
    handleConnectCMS,
    handleActionItem,
    pastAudits,
    allSites,
    selectedSiteId,
    setSelectedSiteId,
    selectedAuditId,
    setSelectedAuditId,
    fetchInitialData,
    aiScanStatus,
    setAiScanStatus,
    pageSpeedScanStatus,
    setPageSpeedScanStatus,
    aiScanError,
    setAiScanError,
    pageSpeedScanError,
    setPageSpeedScanError,
    deleteSite,
    toggleGscConnection,
    addSite,
    prefilledKeyword,
    setPrefilledKeyword,
    uptimeChecks,
    setUptimeChecks,
  };
}
