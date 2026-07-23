import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Cpu, RefreshCw, Save, CheckCircle, AlertTriangle, Power, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export const AppSettingsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // System States
  const [aiProvider, setAiProvider] = useState("");
  const [aiProviderPriority, setAiProviderPriority] = useState("");
  const [auditCooldownMinutes, setAuditCooldownMinutes] = useState<number | string>("");
  const [autoPublishEnabled, setAutoPublishEnabled] = useState<boolean>(true);

  // Provider Cost Rates (per 1M tokens)
  const [geminiInputRate, setGeminiInputRate] = useState<number | string>(0.15);
  const [geminiOutputRate, setGeminiOutputRate] = useState<number | string>(0.60);
  const [groqInputRate, setGroqInputRate] = useState<number | string>(0.59);
  const [groqOutputRate, setGroqOutputRate] = useState<number | string>(0.79);
  const [openrouterInputRate, setOpenrouterInputRate] = useState<number | string>(0.80);
  const [openrouterOutputRate, setOpenrouterOutputRate] = useState<number | string>(0.80);

  // Environment fallback variables
  const [envAiProvider, setEnvAiProvider] = useState("gemini");
  const [envAiProviderPriority, setEnvAiProviderPriority] = useState("gemini,groq,openrouter");
  const [envAuditCooldownMinutes, setEnvAuditCooldownMinutes] = useState<number | string>(5);

  // Telemetry metadata
  const [effectiveProvider, setEffectiveProvider] = useState("");
  const [providerSource, setProviderSource] = useState("");
  const [effectivePriority, setEffectivePriority] = useState("");
  const [prioritySource, setPrioritySource] = useState("");
  const [effectiveCooldown, setEffectiveCooldown] = useState<number | null>(null);
  const [cooldownSource, setCooldownSource] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load application settings.");
      }

      const data = await res.json();
      const settings = data.settings;

      setEffectiveProvider(settings.aiProvider);
      setProviderSource(settings.aiProviderSource);
      setEffectivePriority(settings.aiProviderPriority);
      setPrioritySource(settings.aiProviderPrioritySource);
      setEffectiveCooldown(settings.auditCooldownMinutes);
      setCooldownSource(settings.auditCooldownMinutesSource);
      setAutoPublishEnabled(settings.autoPublishEnabled !== undefined ? settings.autoPublishEnabled : true);
      setEnvAiProvider(settings.envAiProvider || "gemini");
      setEnvAiProviderPriority(settings.envAiProviderPriority || "gemini,groq,openrouter");
      setEnvAuditCooldownMinutes(settings.envAuditCooldownMinutes !== null && settings.envAuditCooldownMinutes !== undefined ? settings.envAuditCooldownMinutes : 5);

      // Load DB values into fields
      const raw = settings.rawDbSettings;
      setAiProvider(raw?.aiProvider || "");
      setAiProviderPriority(raw?.aiProviderPriority || "");
      setAuditCooldownMinutes(raw?.auditCooldownMinutes !== null && raw?.auditCooldownMinutes !== undefined ? raw.auditCooldownMinutes : "");
      setGeminiInputRate(raw?.geminiInputRate ?? 0.15);
      setGeminiOutputRate(raw?.geminiOutputRate ?? 0.60);
      setGroqInputRate(raw?.groqInputRate ?? 0.59);
      setGroqOutputRate(raw?.groqOutputRate ?? 0.79);
      setOpenrouterInputRate(raw?.openrouterInputRate ?? 0.80);
      setOpenrouterOutputRate(raw?.openrouterOutputRate ?? 0.80);
    } catch (err: any) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          aiProvider: aiProvider || null,
          aiProviderPriority: aiProviderPriority || null,
          auditCooldownMinutes: auditCooldownMinutes !== "" ? parseInt(auditCooldownMinutes as string, 10) : null,
          autoPublishEnabled,
          geminiInputRate: geminiInputRate !== "" ? parseFloat(geminiInputRate as string) : 0.15,
          geminiOutputRate: geminiOutputRate !== "" ? parseFloat(geminiOutputRate as string) : 0.60,
          groqInputRate: groqInputRate !== "" ? parseFloat(groqInputRate as string) : 0.59,
          groqOutputRate: groqOutputRate !== "" ? parseFloat(groqOutputRate as string) : 0.79,
          openrouterInputRate: openrouterInputRate !== "" ? parseFloat(openrouterInputRate as string) : 0.80,
          openrouterOutputRate: openrouterOutputRate !== "" ? parseFloat(openrouterOutputRate as string) : 0.80,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save application settings.");
      }

      setSuccessMsg("Settings and Killswitch updated successfully! Changes take effect immediately.");
      await fetchSettings();
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 text-violet-650 animate-spin" />
          <span className="text-[10px] uppercase font-bold font-mono tracking-wider text-zinc-400">
            Querying Application Settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card variant="flat" className="p-6">
        <div className="flex items-center justify-between border-b border-zinc-150 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-650" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800">
              System Configuration & Feature Switches
            </h3>
          </div>
          <span className="text-[9px] uppercase font-bold font-mono text-zinc-400">
            Platform control console
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border-2 border-red-955 bg-red-50 text-xs text-red-755 flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[9px] font-mono text-red-800">Configuration Error</p>
              <p className="mt-0.5 font-mono">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl border-2 border-emerald-955 bg-emerald-50 text-xs text-emerald-755 flex items-start gap-2.5 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[9px] font-mono text-emerald-800">Success</p>
              <p className="mt-0.5 font-mono">{successMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* KILLSWITCH-1: Auto-Publish Control */}
          <div className="p-4 rounded-xl border-2 border-zinc-955 bg-amber-50/50 space-y-3 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className={`w-4 h-4 ${autoPublishEnabled ? "text-emerald-600" : "text-red-600"}`} />
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800">
                    Auto-Publish Platform Killswitch
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-500">
                    Instantly pause or resume platform-wide low-risk auto-publishing without a deploy
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoPublishEnabled(!autoPublishEnabled)}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl border-2 border-zinc-955 transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] ${
                  autoPublishEnabled
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {autoPublishEnabled ? "ACTIVE (Auto-Apply On)" : "PAUSED (Auto-Apply Disabled)"}
              </button>
            </div>
          </div>

          {/* AI Provider Settings */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold tracking-wider text-zinc-550 uppercase block">
              Active AI Generation Provider
            </label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-955 text-sm focus:outline-none focus:border-violet-500 bg-white font-mono"
            >
              <option value="">Default (Fallback to Env Var: {envAiProvider})</option>
              <option value="gemini">Gemini (Google Deepmind)</option>
              <option value="groq">Groq (Llama 3 / Mixtral)</option>
              <option value="openrouter">OpenRouter (Claude / GPT)</option>
            </select>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-400 font-mono">
                Effective value: <span className="font-bold underline text-violet-650">{effectiveProvider}</span>
              </span>
              <Badge variant={providerSource === "database" ? "emerald" : "zinc"} className="text-[8px] px-1.5 py-0.5 uppercase font-mono">
                {providerSource}
              </Badge>
            </div>
          </div>

          {/* AI Provider Priority Chain */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold tracking-wider text-zinc-550 uppercase block">
              AI Fallback priority chain (comma-separated, e.g. gemini,groq)
            </label>
            <input
              type="text"
              value={aiProviderPriority}
              onChange={(e) => setAiProviderPriority(e.target.value)}
              placeholder={`Default (Env priority: ${envAiProviderPriority})`}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-955 text-sm focus:outline-none focus:border-violet-500 bg-white font-mono"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-400 font-mono">
                Effective value: <span className="font-bold underline text-violet-650">{effectivePriority}</span>
              </span>
              <Badge variant={prioritySource === "database" ? "emerald" : "zinc"} className="text-[8px] px-1.5 py-0.5 uppercase font-mono">
                {prioritySource}
              </Badge>
            </div>
          </div>

          {/* Audit Cooldown Settings */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold tracking-wider text-zinc-550 uppercase block">
              Site Crawl Audit Cooldown (Minutes)
            </label>
            <input
              type="number"
              value={auditCooldownMinutes}
              onChange={(e) => setAuditCooldownMinutes(e.target.value)}
              placeholder={`Default (Env default: ${envAuditCooldownMinutes})`}
              className="w-full px-4 py-3 rounded-xl border-2 border-zinc-955 text-sm focus:outline-none focus:border-violet-500 bg-white font-mono"
              min={0}
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-zinc-400 font-mono">
                Effective value: <span className="font-bold underline text-violet-650">{effectiveCooldown} minutes</span>
              </span>
              <Badge variant={cooldownSource === "database" ? "emerald" : "zinc"} className="text-[8px] px-1.5 py-0.5 uppercase font-mono">
                {cooldownSource}
              </Badge>
            </div>
          </div>

          {/* Admin Configurable Provider Cost Rates */}
          <div className="p-4 rounded-xl border-2 border-zinc-955 bg-white space-y-4 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800">
                AI Provider Token Cost Rates ($ per 1 Million Tokens)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="font-bold text-zinc-800 block">Gemini</span>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block">Input Rate ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={geminiInputRate}
                    onChange={(e) => setGeminiInputRate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-zinc-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block">Output Rate ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={geminiOutputRate}
                    onChange={(e) => setGeminiOutputRate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-zinc-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="font-bold text-zinc-800 block">Groq</span>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block">Input Rate ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={groqInputRate}
                    onChange={(e) => setGroqInputRate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-zinc-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block">Output Rate ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={groqOutputRate}
                    onChange={(e) => setGroqOutputRate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-zinc-300 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <span className="font-bold text-zinc-800 block">OpenRouter</span>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block">Input Rate ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openrouterInputRate}
                    onChange={(e) => setOpenrouterInputRate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-zinc-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase block">Output Rate ($/1M)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={openrouterOutputRate}
                    onChange={(e) => setOpenrouterOutputRate(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-zinc-300 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-150 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 border-2 border-zinc-955 bg-violet-650 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-750 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save System Settings & Killswitch
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
