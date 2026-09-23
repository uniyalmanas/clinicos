"use client";

import React, { useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { useRouter } from "next/navigation";
import { 
  Stethoscope, 
  Building2, 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Lock, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  UserCheck,
  Zap,
  BarChart3
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BackButton from "@/components/BackButton";

const API_BASE = "/api";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+919876543210");
  const [password, setPassword] = useState("Password@123");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Invalid login credentials.");
      }

      const data = await res.json();
      localStorage.setItem("clinicos_token", data.access_token);
      const user = {
        id: data.user_id,
        phone: data.phone,
        full_name: data.full_name,
        role: data.role,
        clinic_id: data.clinic_id || null,
        clinic_name: data.clinic_name || null,
        clinic_slug: data.clinic_slug || null,
      };
      localStorage.setItem("clinicos_user", JSON.stringify(user));

      // Role-based canonical routing
      if (data.role === "doctor") {
        router.push("/dashboard");
      } else if (data.role === "staff") {
        router.push("/dashboard/desk");
      } else if (data.role === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (userRole: "doctor" | "staff" | "superadmin" | "admin", targetUrl: string) => {
    let credentials = { phone: "+919876543210", password: "Password@123" };
    if (userRole === "doctor") {
      setPhone("+919876543210");
      setPassword("Password@123");
      credentials = { phone: "+919876543210", password: "Password@123" };
    } else if (userRole === "staff") {
      setPhone("+919876543214");
      setPassword("Password@123");
      credentials = { phone: "+919876543214", password: "Password@123" };
    } else {
      setPhone("superadmin");
      setPassword("Manas@12");
      credentials = { phone: "superadmin", password: "Manas@12" };
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Account login failed.");
      }
      const data = await res.json();
      localStorage.setItem("clinicos_token", data.access_token);
      localStorage.setItem("clinicos_user", JSON.stringify({
        id: data.user_id,
        phone: data.phone,
        full_name: data.full_name,
        role: data.role,
        clinic_id: data.clinic_id || null,
        clinic_name: data.clinic_name || null,
        clinic_slug: data.clinic_slug || null,
      }));
      router.push(targetUrl);
    } catch (err: any) {
      setErrorMessage(err.message || "Account login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* 1. TOP NAV */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/" label="Back" />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">DocSphere ClinicOS</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* 2. LOGIN CARD & QUICK ROLES */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Sign in to Your Clinic Portal
            </h1>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Access your live OPD queue, counter reception desk, or platform analytics
            </p>
          </div>

          {/* 1-CLICK DEMO ROLE SHORTCUTS */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-800 dark:text-brand-300">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span>1-Click Interactive Demo Sign-in:</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs("doctor", "/dashboard")}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-500 hover:bg-brand-50/30 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-brand-600 dark:bg-teal-950">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Rahul Sharma (ClinicOS Dashboard)</div>
                    <div className="text-[10px] text-slate-500">Live OPD Queue, Chambers, Dynamic Rx 2.0 & P&L</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs("staff", "/dashboard/desk")}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-500 hover:bg-brand-50/30 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Pooja Verma (Counter Reception Desk)</div>
                    <div className="text-[10px] text-slate-500">10s Walk-in Token Generator & Audio Chime</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/patient/portal"
                  className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 text-left shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">Patient Hub</div>
                      <div className="text-[9px] text-slate-500">Health Locker</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
                </Link>

                <Link
                  href="/pharmacy/console"
                  className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/50 p-2.5 text-left shadow-sm transition hover:border-purple-500 hover:bg-purple-50 dark:border-purple-900/50 dark:bg-purple-950/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">Chemist Terminal</div>
                      <div className="text-[9px] text-slate-500">Rx Fulfillment</div>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-purple-600" />
                </Link>
              </div>

              <button
                type="button"
                onClick={() => quickLoginAs("superadmin", "/admin")}
                className="flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-left shadow-sm transition hover:border-purple-500 hover:bg-purple-50 dark:border-purple-900/50 dark:bg-purple-950/20"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Master Super Admin (superadmin)</div>
                    <div className="text-[10px] text-slate-500">Fleet Control, SaaS Billing & Telemetry • Pass: Manas@12</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full dark:border-slate-800"></div>
            <span className="bg-slate-50 px-3 text-[11px] uppercase font-semibold text-slate-400 dark:bg-slate-950">
              Or Sign In with Credentials
            </span>
          </div>

          {/* CREDENTIALS FORM */}
          <form onSubmit={handleLogin} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile Number, Username, or Email
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPhone("superadmin");
                    setPassword("Manas@12");
                  }}
                  className="text-[10px] text-purple-600 hover:underline font-semibold"
                >
                  Fill superadmin
                </button>
              </div>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="superadmin or +919876543210"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 focus:outline-none disabled:opacity-50 transition"
            >
              {loading ? "Authenticating..." : "Sign In to ClinicOS"}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Don&apos;t have a clinic account yet?{" "}
            <Link href="/onboarding" className="font-semibold text-brand-600 hover:underline">
              Join as a Doctor in &lt; 60s
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
