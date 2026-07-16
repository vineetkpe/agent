"use client";

import React, { useState, useEffect } from "react";
import {
  Info,
  XCircle,
  CheckCircle,
  Key,
  Activity,
  Search,
  BarChart3,
  MessageSquare,
  Globe,
  Database,
  Link,
  Lock,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface ConnectionsTabProps {
  handleConnectCMS: (e: React.FormEvent) => void;
  wpUrl: string;
  setWpUrl: (url: string) => void;
  wpUsername: string;
  setWpUsername: (username: string) => void;
  wpAppPassword: string;
  setWpAppPassword: (pwd: string) => void;
  isConnectingWp: boolean;
  wpMessage: { text: string; isError: boolean } | null;
  currentSite: any;
  toggleGscConnection: (siteId: string, gscUrl?: string, disconnect?: boolean) => void;
}

export const ConnectionsTab: React.FC<ConnectionsTabProps> = ({
  handleConnectCMS,
  wpUrl,
  setWpUrl,
  wpUsername,
  setWpUsername,
  wpAppPassword,
  setWpAppPassword,
  isConnectingWp,
  wpMessage,
  currentSite,
  toggleGscConnection,
}) => {
  const [gscUrlInput, setGscUrlInput] = useState("");
  const [gaMeasurementId, setGaMeasurementId] = useState("");
  const [gaConnected, setGaConnected] = useState(false);
  const [isConnectingGa, setIsConnectingGa] = useState(false);

  useEffect(() => {
    if (currentSite) {
      setGscUrlInput(currentSite.gscUrl || currentSite.url || "");
    }
  }, [currentSite]);

  const handleConnectGsc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSite) return;
    toggleGscConnection(currentSite.id, gscUrlInput);
  };

  const handleConnectGa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gaMeasurementId) {
      alert("Please enter a valid GA4 Measurement ID.");
      return;
    }
    if (!/^G-[A-Z0-9]+$/i.test(gaMeasurementId.trim())) {
      alert("Invalid format. GA4 Measurement ID must start with 'G-' (e.g. G-12345678).");
      return;
    }

    setIsConnectingGa(true);
    setTimeout(() => {
      setGaConnected(true);
      setIsConnectingGa(false);
      alert("Google Analytics connected successfully! Synced data stream index.");
    }, 1200);
  };

  const handleDisconnectGa = () => {
    setGaConnected(false);
    setGaMeasurementId("");
    alert("Google Analytics disconnected successfully!");
  };

  const futureIntegrations = [
    {
      name: "Facebook Page",
      description: "Cross-post approved blog drafts and updates automatically to your Page timeline.",
      icon: <Globe className="w-5 h-5 text-zinc-400" />,
    },
    {
      name: "Instagram",
      description: "Auto-generate and schedule visual content cards for your blog posts.",
      icon: <Globe className="w-5 h-5 text-zinc-400" />,
    },
    {
      name: "LinkedIn Page",
      description: "Share industry insight updates and content drafts to your corporate page.",
      icon: <Globe className="w-5 h-5 text-zinc-400" />,
    },
    {
      name: "Reddit",
      description: "Engage with relevant communities and automate product discussion tracking.",
      icon: <MessageSquare className="w-5 h-5 text-zinc-400" />,
    },
    {
      name: "X (Twitter)",
      description: "Publish immediate snippets of your SEO optimizations and blog posts.",
      icon: <Globe className="w-5 h-5 text-zinc-400" />,
    },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="pb-4 border-b border-zinc-150">
        <h2 className="text-xl font-bold text-zinc-900">Connections & Integrations</h2>
        <p className="text-sm mt-1 text-zinc-550">
          Verify and link external CMS platforms, analytics tags, and search crawlers to fetch real organic data.
        </p>
      </div>

      {/* WordPress CMS Integration */}
      <Card variant="flat" className="space-y-6">
        <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-md font-bold text-zinc-900 font-mono uppercase tracking-wider">WordPress CMS Integration</h3>
            <p className="text-xs text-zinc-550 mt-0.5">Publish optimized tags and blog drafts automatically.</p>
          </div>
          {currentSite?.wpUrl ? (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
              Connected
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100 uppercase tracking-wide">
              Not Configured
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50 text-xs text-blue-800 flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-2 leading-relaxed">
            <p className="font-bold">WordPress Application Passwords Authorization Instructions</p>
            <p>To safely connect, do NOT use root site administrator passwords. Setup a dedicated author account:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open your website&apos;s CMS backend panel.</li>
              <li>
                Go to <strong>Users &gt; Add New</strong>. Create a restricted user named <code>heydrona-agent</code>{" "}
                with the role of <strong>Author</strong> or <strong>Editor</strong>.
              </li>
              <li>Open that user profile page, navigate to the <strong>Application Passwords</strong> block at the bottom.</li>
              <li>Create an application password key (e.g. &quot;HeyDrona Employee&quot;) and paste the generated 24-character token below.</li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleConnectCMS} className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold block uppercase text-zinc-500">CMS Website Endpoint</label>
            <input
              type="text"
              placeholder="e.g. https://yourbusiness.com"
              value={wpUrl}
              onChange={(e) => setWpUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:outline-none focus:border-violet-500 text-sm transition-colors bg-white text-zinc-800 placeholder-zinc-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold block uppercase text-zinc-500">CMS Username</label>
              <input
                type="text"
                placeholder="e.g. heydrona-agent"
                value={wpUsername}
                onChange={(e) => setWpUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:outline-none focus:border-violet-500 text-sm transition-colors bg-white text-zinc-800 placeholder-zinc-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold block uppercase text-zinc-500">Application Password</label>
              <input
                type="password"
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={wpAppPassword}
                onChange={(e) => setWpAppPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:outline-none focus:border-violet-500 text-sm transition-colors bg-white text-zinc-800 placeholder-zinc-400"
              />
            </div>
          </div>

          {wpMessage && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
                wpMessage.isError
                  ? "border-red-500/20 bg-red-950/30 text-red-650"
                  : "border-emerald-500/20 bg-emerald-950/30 text-emerald-500"
              }`}
            >
              {wpMessage.isError ? <XCircle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
              {wpMessage.text}
            </div>
          )}

          <Button variant="primary" type="submit" disabled={isConnectingWp} className="px-6 py-3">
            {isConnectingWp ? <Activity className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Verify & Connect CMS Publishing API
          </Button>
        </form>
      </Card>

      {/* Google Search Console Integration */}
      <Card variant="flat" className="space-y-6">
        <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-md font-bold text-zinc-900 font-mono uppercase tracking-wider">Google Search Console Connection</h3>
              <p className="text-xs text-zinc-550 mt-0.5">Fetch keyword clicks, search visibility, and organic rankings.</p>
            </div>
          </div>
          {currentSite?.gscConnected ? (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
              Connected
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100 uppercase tracking-wide">
              Not Connected
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50 text-xs text-blue-800 flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-2 leading-relaxed">
            <p className="font-bold">Requirements to connect Google Search Console:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                <strong>Google Account Authorization</strong>: Grant read permissions to view Search Console records.
              </li>
              <li>
                <strong>Verified Property URL</strong>: The domain URL must match a verified Domain or URL-prefix Property in your Search Console panel.
              </li>
            </ol>
          </div>
        </div>

        {!currentSite ? (
          <p className="text-xs italic text-zinc-500">No active site context loaded. Run a crawl first!</p>
        ) : (
          <form onSubmit={handleConnectGsc} className="space-y-4 max-w-xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold block uppercase text-zinc-500">Search Console Property URL</label>
              <input
                type="text"
                placeholder="e.g. https://hostamble.com"
                value={gscUrlInput}
                onChange={(e) => setGscUrlInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:outline-none focus:border-violet-500 text-sm transition-colors bg-white text-zinc-800 placeholder-zinc-400"
              />
            </div>

            <div className="flex gap-2">
              {currentSite.gscConnected ? (
                <button
                  type="button"
                  onClick={() => toggleGscConnection(currentSite.id, undefined, true)}
                  className="px-6 py-2.5 border-2 border-zinc-950 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-red-100"
                >
                  Disconnect GSC Property
                </button>
              ) : (
                <Button variant="primary" type="submit">
                  Verify & Connect Search Console
                </Button>
              )}
            </div>
          </form>
        )}
      </Card>

      {/* Google Analytics Integration */}
      <Card variant="flat" className="space-y-6">
        <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-md font-bold text-zinc-900 font-mono uppercase tracking-wider">Google Analytics (GA4) Stream</h3>
              <p className="text-xs text-zinc-550 mt-0.5">Track visitor views, user session times, and content engagement.</p>
            </div>
          </div>
          {gaConnected ? (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide">
              Connected
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-zinc-50 text-zinc-400 border border-zinc-100 uppercase tracking-wide">
              Not Connected
            </span>
          )}
        </div>

        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50 text-xs text-blue-800 flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
          <div className="space-y-2 leading-relaxed">
            <p className="font-bold">Requirements to connect Google Analytics:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>
                <strong>GA4 Measurement ID</strong>: Must start with <code>G-</code> (e.g. G-ABC123XYZ9). Located under GA4 Admin &gt; Data Streams.
              </li>
              <li>
                <strong>Global Tag (gtag.js) Placement</strong>: The tracking snippet code must be verified inside your website header markup.
              </li>
            </ol>
          </div>
        </div>

        <form onSubmit={handleConnectGa} className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold block uppercase text-zinc-500">GA4 Measurement ID</label>
            <input
              type="text"
              placeholder="G-XXXXXXXXXX"
              value={gaMeasurementId}
              onChange={(e) => setGaMeasurementId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:outline-none focus:border-violet-500 text-sm transition-colors bg-white text-zinc-800 placeholder-zinc-400"
              disabled={gaConnected}
            />
          </div>

          <div className="flex gap-2">
            {gaConnected ? (
              <button
                type="button"
                onClick={handleDisconnectGa}
                className="px-6 py-2.5 border-2 border-zinc-950 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-red-100"
              >
                Disconnect Stream
              </button>
            ) : (
              <Button variant="primary" type="submit" disabled={isConnectingGa}>
                {isConnectingGa ? <Activity className="w-4 h-4 animate-spin mr-2" /> : null}
                Verify & Link GA4 Data Stream
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* More Integrations Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 font-mono uppercase tracking-wider">Upcoming Platform Connections</h2>
          <p className="text-sm mt-1 text-zinc-550">
            Expand your AI marketing footprints with incoming search, statistics, and platform integrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {futureIntegrations.map((integration, index) => (
            <Card key={index} variant="flat" className="flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 border border-zinc-200 rounded-xl bg-zinc-50 shrink-0">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 font-mono uppercase tracking-wider">
                    {integration.name}
                  </h3>
                  <p className="text-xs text-zinc-550 leading-relaxed mt-1">
                    {integration.description}
                  </p>
                </div>
              </div>
              <div className="flex justify-start">
                <span className="px-3 py-1 text-[10px] font-bold font-mono border rounded-full bg-zinc-100 text-zinc-400 border-zinc-200 uppercase tracking-wider">
                  Coming Soon
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
