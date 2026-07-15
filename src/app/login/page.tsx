"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight, Activity, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.session) {
        // Redirection handled by router
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans bg-zinc-50 text-zinc-850 px-4 relative selection:bg-violet-500 selection:text-white">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none -z-10 bg-violet-500/5" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none -z-10 bg-indigo-500/5" />

      <div className="w-full max-w-md p-8 border-2 border-zinc-950 bg-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(9,9,11,1)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4 border-2 border-zinc-950">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Welcome Back
          </h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
            Growth Agent Auth Portal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-mono">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-zinc-950 text-sm focus:outline-none focus:border-violet-500 bg-white text-zinc-850 placeholder-zinc-400 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-mono">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-zinc-950 text-sm focus:outline-none focus:border-violet-500 bg-white text-zinc-850 placeholder-zinc-400 transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl border-2 border-red-500/20 bg-red-50 text-xs font-semibold text-red-600 animate-fade-in flex items-center gap-2">
              <span>⚠️</span>
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-white bg-gradient-to-r from-violet-600 to-indigo-500 rounded-xl text-xs font-bold border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 animate-spin" /> Logging In...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-550">
            Don&#39;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-violet-600 hover:text-violet-500 underline"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
