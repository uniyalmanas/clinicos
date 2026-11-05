"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Shield,
  Loader2,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BackButton from "@/components/BackButton";

const API_BASE = "/api";

function destinationFor(role: string): string {
  if (role === "super_admin") return "/superadmin";
  if (role === "staff" || role === "receptionist") return "/dashboard/desk";
  if (role === "patient") return "/patient/portal";
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get("next");

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Demo Accounts for 1-Click login
  const demoAccounts = [
    {
      label: "Dr. Rahul Sharma",
      role: "Lead Physician",
      identifier: "dr.rahul@clinicos.in",
      pass: "Password@123",
      avatar: "/images/doctors/dr-rahul-sharma.jpg",
    },
    {
      label: "Dr. Aditi Joshi",
      role: "Pediatrician",
      identifier: "dr.aditi@clinicos.in",
      pass: "Password@123",
      avatar: "/images/doctors/dr-aditi-joshi.jpg",
    },
    {
      label: "Pooja Verma",
      role: "Front Desk Reception",
      identifier: "pooja@dermacare.in",
      pass: "Password@123",
      avatar: "/images/doctors/pooja-reception.jpg",
    },
  ];

  const handleQuickFill = (identifier: string, pass: string) => {
    setPhone(identifier);
    setPassword(pass);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || "Invalid login credentials.");
      }

      const data = await res.json();
      localStorage.setItem("clinicos_token", data.access_token);
      localStorage.setItem(
        "clinicos_user",
        JSON.stringify({
          id: data.user_id,
          phone: data.phone,
          full_name: data.full_name,
          role: data.role,
          clinic_id: data.clinic_id || null,
          clinic_name: data.clinic_name || null,
          clinic_slug: data.clinic_slug || null,
          practice_type: data.practice_type || null,
          subscription_plan: data.subscription_plan || null,
          organization_id: data.organization_id || null,
        })
      );

      router.push(nextUrl && nextUrl.startsWith("/") ? nextUrl : destinationFor(data.role));
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 dark:bg-blue-950/40 dark:border-blue-900/40 text-[11px] font-medium text-[#0071E3] dark:text-[#2997FF]">
          <Building2 className="h-3.5 w-3.5" />
          <span>Clinical Provider Portal</span>
          {nextUrl && <span className="text-slate-400">• Redirect: {nextUrl}</span>}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Sign in to ClinicOS
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Access your live OPD queue, electronic health records, and chamber operations
        </p>
      </div>

      {/* Quick Demo Credentials */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#151618] shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Demo Credentials (1-Click Fill)
          </span>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Verified
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {demoAccounts.map((acc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickFill(acc.identifier, acc.pass)}
              className="flex items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/60 p-2 text-left hover:border-[#0071E3] hover:bg-white dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-[#2997FF] dark:hover:bg-white/[0.04] transition cursor-pointer"
            >
              <div className="relative h-7 w-7 rounded-md overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                <Image
                  src={acc.avatar}
                  alt={acc.label}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {acc.label}
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  {acc.role}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Auth Card */}
      <form
        onSubmit={handleLogin}
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151618] space-y-3.5"
      >
        {errorMessage && (
          <div className="rounded-lg bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
            {errorMessage}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Mobile Number or Email
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              required
              autoComplete="username"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210 or dr.rahul@clinicos.in"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 shadow-xs focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#111113] dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-medium text-[#0071E3] hover:underline dark:text-[#2997FF] flex items-center gap-1"
            >
              {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              <span>{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 shadow-xs focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#111113] dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#0071E3] py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0077ED] focus:outline-none disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Authenticating Session...</span>
            </>
          ) : (
            <span>Sign In to ClinicOS</span>
          )}
        </button>
      </form>

      {/* Secondary Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Link
          href="/onboarding"
          className="rounded-lg border border-slate-200/80 bg-white p-3 hover:border-blue-400 dark:border-white/[0.08] dark:bg-[#151618] dark:hover:border-blue-600 transition flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-[#0071E3] transition">
              New Practice Setup
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Setup doctor chamber in 60s
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition" />
        </Link>

        <Link
          href="/patient/portal"
          className="rounded-lg border border-slate-200/80 bg-white p-3 hover:border-emerald-400 dark:border-white/[0.08] dark:bg-[#151618] dark:hover:border-emerald-600 transition flex items-center justify-between group"
        >
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
              Patient Health Vault
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Access visit reports via OTP
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        </Link>
      </div>

      {/* Compliance Strip */}
      <div className="pt-2 flex items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3 text-slate-400" />
          <span>256-Bit Encrypted</span>
        </span>
        <span>•</span>
        <span>DPDP Act 2023 Compliant</span>
        <span>•</span>
        <span>NMC Telemedicine Guidelines</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0C0D0E] flex flex-col font-sans">
      <header className="h-16 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#0C0D0E]/90 flex items-center">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/for-doctors" label="Back to Provider Suite" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0071E3] text-white shadow-xs">
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">ClinicOS</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="text-xs text-slate-500">Loading sign in portal...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
