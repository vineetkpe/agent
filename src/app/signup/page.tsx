"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Activity, Lock, Mail, CheckCircle, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email || !password || !confirmPassword) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
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
            Create Account
          </h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider font-mono">
            Get started with AI Website Growth
          </p>
        </div>

        {success ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="p-4 rounded-xl border-2 border-emerald-500/20 bg-emerald-50 text-emerald-800 text-sm flex flex-col items-center gap-3">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="font-bold">Confirmation Email Sent!</p>
                <p className="text-xs text-zinc-650 mt-1.5 leading-relaxed">
                  Please check your inbox at <span className="font-semibold text-zinc-800">{email}</span> and click the verification link to confirm your account.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full py-3.5 text-zinc-950 bg-white rounded-xl text-xs font-bold border-2 border-zinc-950 shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] flex items-center justify-center gap-1.5"
            >
              Return to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-zinc-950 text-sm focus:outline-none focus:border-violet-500 bg-white text-zinc-850 placeholder-zinc-400 transition-colors"
                />
              </div>
            </div>

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

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <Activity className="w-4 h-4 animate-spin" /> Registering...
                </>
              ) : (
                <>
                  Register <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
          <p className="text-xs text-zinc-550">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-violet-600 hover:text-violet-500 underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
