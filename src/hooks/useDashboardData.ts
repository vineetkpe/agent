import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export type TabType = "overview" | "crawler" | "recommendations" | "content" | "cms";

export function useDashboardData() {
  const [siteUrl, setSiteUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStep, setCrawlStep] = useState("");
  const [currentSite, setCurrentSite] = useState<any>(null);
  const [currentAudit, setCurrentAudit] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

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
    return headers;
  };

  const fetchInitialData = async () => {
    try {
      const headers = await getHeaders("");
      const res = await fetch("/api/audit", { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.site) {
          setCurrentSite(data.site);
          setSiteUrl(data.site.url);
          setWpUrl(data.site.wpUrl || "");
          setWpUsername(data.site.wpUsername || "");
        }
        if (data.audit) {
          setCurrentAudit(data.audit);
        }
        if (data.user) {
          setCurrentUser(data.user);
        }
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

    try {
      const steps = [
        "Resolving domain headers...",
        "Crawling subpages (up to limit)...",
        "Parsing HTML structure...",
        "Validating meta titles & descriptions...",
        "Analyzing image alternative text tags...",
        "Scanning for broken outbound links...",
        "Requesting Google PageSpeed score...",
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
        }
      }, 900);

      const headers = await getHeaders("application/json");
      const res = await fetch("/api/audit", {
        method: "POST",
        headers,
        body: JSON.stringify({ url: siteUrl }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Audit failed to run.");
      }

      const data = await res.json();
      if (data.success) {
        setCurrentAudit(data.audit);
        fetchInitialData();
        setActiveTab("crawler");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during the audit scan.");
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
      fetchInitialData();
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

  useEffect(() => {
    fetchInitialData();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success" || params.get("mock_payment") === "success") {
        setBillingMessage("🎉 Subscription activated successfully! Welcome to Premium!");
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
  };
}
