import React from "react";
import { Info, XCircle, CheckCircle, Key, Activity } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface CmsSettingsTabProps {
  handleConnectCMS: (e: React.FormEvent) => void;
  wpUrl: string;
  setWpUrl: (url: string) => void;
  wpUsername: string;
  setWpUsername: (username: string) => void;
  wpAppPassword: string;
  setWpAppPassword: (pwd: string) => void;
  isConnectingWp: boolean;
  wpMessage: { text: string; isError: boolean } | null;
}

export const CmsSettingsTab: React.FC<CmsSettingsTabProps> = ({
  handleConnectCMS,
  wpUrl,
  setWpUrl,
  wpUsername,
  setWpUsername,
  wpAppPassword,
  setWpAppPassword,
  isConnectingWp,
  wpMessage,
}) => {
  return (
    <Card variant="flat" className="space-y-6">
      <div className="pb-4 border-b border-zinc-100">
        <h2 className="text-xl font-bold text-zinc-900">CMS Integration settings</h2>
        <p className="text-sm mt-1 text-zinc-550">
          Link your WordPress REST API endpoints to enable one-click publishing of optimized tags and blog post drafts.
        </p>
      </div>

      <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-50 text-xs text-blue-800 flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
        <div className="space-y-2 leading-relaxed">
          <p className="font-bold">WordPress Application Passwords Authorization Instructions</p>
          <p>To safely connect, do NOT use root site administrator passwords. Setup a dedicated author account:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Open your website&#39;s CMS backend panel.</li>
            <li>
              Go to <strong>Users &gt; Add New</strong>. Create a restricted user named <code>heydrona-agent</code>{" "}
              with the role of <strong>Author</strong> or <strong>Editor</strong>.
            </li>
            <li>Open that user profile page, navigate to the <strong>Application Passwords</strong> block at the bottom.</li>
            <li>Create an application password key (e.g. &quot;HeyDrona Employee&quot;) and paste the generated 24-character token below.</li>
          </ol>
          <p className="text-[10px] text-zinc-500 mt-2">
            This isolates permissions. The AI agent can only modify tag drafts and submit posts for review, securing key systems.
          </p>
        </div>
      </div>

      <form onSubmit={handleConnectCMS} className="space-y-4 max-w-xl">
        <div className="space-y-1">
          <label className="text-xs font-semibold block uppercase text-zinc-500">
            CMS Website Endpoint (REST API)
          </label>
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
            <label className="text-xs font-semibold block uppercase text-zinc-500">CMS Author Username</label>
            <input
              type="text"
              placeholder="e.g. heydrona-agent"
              value={wpUsername}
              onChange={(e) => setWpUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-200 focus:outline-none focus:border-violet-500 text-sm transition-colors bg-white text-zinc-800 placeholder-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold block uppercase text-zinc-500">CMS Application Password</label>
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
                ? "border-red-500/20 bg-red-950/30 text-red-600"
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
  );
};
