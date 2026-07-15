"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import KpiCards from "@/components/admin/KpiCards";
import SignupsChart from "@/components/admin/SignupsChart";
import UsageBreakdown from "@/components/admin/UsageBreakdown";
import UsersTable from "@/components/admin/UsersTable";
import ActivityFeed from "@/components/admin/ActivityFeed";

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.status === 403) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.statusText}`);
      }

      const data = await res.json();
      setStats(data);
      setIsAuthorized(true);
    } catch (err: any) {
      console.error("[Admin Stats Loading Error]:", err);
      setError(err.message || "Failed to load telemetry stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans text-zinc-800 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center border-2 border-zinc-950 animate-bounce shadow-[2px_2px_0px_0px_rgba(9,9,11,1)]">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider animate-pulse">
            Retrieving System Analytics...
          </p>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans text-zinc-800 p-6">
        <div className="max-w-md w-full p-8 rounded-3xl border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-zinc-950 flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Access Denied
          </span>
          <h2 className="text-2xl font-black font-mono mt-4 mb-2 text-zinc-950">403 Forbidden</h2>
          <p className="text-sm text-zinc-550 leading-relaxed mb-8">
            You do not have administrative privileges. Admin registration must match the configured environment variables.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-zinc-950 text-white shadow-[3px_3px_0px_0px_rgba(99,102,241,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(99,102,241,1)] transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center font-sans text-zinc-800 p-6">
        <div className="max-w-md w-full p-8 rounded-3xl border-2 border-zinc-950 bg-white shadow-[6px_6px_0px_0px_rgba(9,9,11,1)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border-2 border-zinc-950 flex items-center justify-center mx-auto mb-6 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)]">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-black font-mono mb-2 text-zinc-950">Initialization Failed</h2>
          <p className="text-sm text-zinc-550 leading-relaxed mb-8">{error}</p>
          <button
            onClick={fetchStats}
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-violet-600 text-white border-zinc-950 shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800 selection:bg-violet-500 selection:text-white p-6 md:p-8 space-y-8">
      {/* Header section */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-950 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-lg border-2 border-zinc-950 flex items-center justify-center bg-white shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:bg-zinc-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-700" />
            </Link>
            <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-violet-605">
              System Settings Console
            </span>
          </div>
          <h1 className="text-3xl font-black font-mono mt-2 tracking-tight text-zinc-950">
            Administrative Telemetry Dashboard
          </h1>
        </div>

        <button
          onClick={fetchStats}
          type="button"
          className="px-4 py-2.5 border-2 rounded-xl text-xs font-bold uppercase tracking-wider font-mono bg-white border-zinc-950 text-zinc-705 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)]"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* KPI indicators */}
        <KpiCards stats={stats} />

        {/* Signup charts and Usage metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <SignupsChart signups={stats.signupsLast30Days} />
          <UsageBreakdown usage={stats.apiUsageLast30Days} />
        </div>

        {/* Users registry list and recent logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UsersTable users={stats.usersList} totalUsers={stats.totalUsers} />
          <ActivityFeed activity={stats.recentActivity} />
        </div>
      </div>
    </div>
  );
}
