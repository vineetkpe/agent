import React, { useEffect, useState } from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Cpu, RefreshCw, Save, Sparkles, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export const AppSettingsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States
  const [aiProvider, setAiProvider] = useState("");
  const [auditCooldownMinutes, setAuditCooldownMinutes] = useState<number | string>("");

  // Environment fallback variables (from server)
  const [envAiProvider, setEnvAiProvider] = useState("gemini");
  const [envAuditCooldownMinutes, setEnvAuditCooldownMinutes] = useState<number | string>(5);

  // Telemetry metadata
  const [effectiveProvider, setEffectiveProvider] = useState("");
  const [providerSource, setProviderSource] = useState("");
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
      setEffectiveCooldown(settings.auditCooldownMinutes);
      setCooldownSource(settings.auditCooldownMinutesSource);
      setEnvAiProvider(settings.envAiProvider || "gemini");
      setEnvAuditCooldownMinutes(settings.envAuditCooldownMinutes !== null && settings.envAuditCooldownMinutes !== undefined ? settings.envAuditCooldownMinutes : 5);

      // Load DB values into fields
      const raw = settings.rawDbSettings;
      setAiProvider(raw?.aiProvider || "");
      setAuditCooldownMinutes(raw?.auditCooldownMinutes !== null && raw?.auditCooldownMinutes !== undefined ? raw.auditCooldownMinutes : "");
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
          auditCooldownMinutes: auditCooldownMinutes !== "" ? parseInt(auditCooldownMinutes as string, 10) : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save application settings.");
      }

      setSuccessMsg("Settings updated successfully! Bypasses and active provider updates take effect immediately.");
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
              System Configuration Panel
            </h3>
          </div>
          <span className="text-[9px] uppercase font-bold font-mono text-zinc-400">
            Settings override console
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

          <div className="pt-4 border-t border-zinc-150 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 border-2 border-zinc-955 bg-violet-650 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-violet-750 flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Configuration Settings
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
