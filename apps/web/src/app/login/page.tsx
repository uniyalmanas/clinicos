"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
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
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* Left / Login Form */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-3 py-1 text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">
              Doctor &amp; Staff Access
            </span>
            {nextUrl && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                • Target: {nextUrl}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign in to Your Clinic Portal
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Access your live OPD queue, Speed Rx studio, reception desk, or closing ledger
          </p>
        </div>

        {/* Quick Demo Login Pills */}
        <div className="rounded-2xl border border-black/[0.06] bg-gray-50/70 p-3.5 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
              Quick Demo Logins (1-Click Fill)
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Live Verified
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {demoAccounts.map((acc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickFill(acc.identifier, acc.pass)}
                className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-2 text-left hover:border-[#0071E3] hover:shadow-xs dark:border-white/[0.08] dark:bg-[#1E2024] dark:hover:border-[#2997FF] transition"
              >
                <div className="relative h-7 w-7 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-white/10">
                  <Image
                    src={acc.avatar}
                    alt={acc.label}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-[#1D1D1F] dark:text-white truncate">
                    {acc.label}
                  </div>
                  <div className="text-[9px] text-[#86868B] truncate">
                    {acc.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-apple-card dark:border-slate-800 dark:bg-[#1C1C1E] space-y-4"
        >
          {errorMessage && (
            <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mobile Number / Email
            </label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                autoComplete="username"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +919876543210 or dr.rahul@clinicos.in"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
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
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#0071E3] py-3.5 text-xs font-bold text-white shadow-apple-sm hover:bg-[#0077ED] focus:outline-none disabled:opacity-50 transition active:scale-98"
          >
            {loading ? "Authenticating Session..." : "Sign In to ClinicOS"}
          </button>
        </form>

        {/* Onboarding Callout Link */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Link
            href="/onboarding"
            className="flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0071E3] transition">
                  New Doctor or Chamber?
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Launch your verified digital practice workspace in under 60 seconds
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#0071E3] group-hover:translate-x-1 transition" />
          </Link>
        </div>

        {/* Patient Health Vault Link */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <Link
            href="/patient/portal"
            className="flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Are you a patient?
                </div>
                <div className="text-[10px] text-slate-500">
                  Sign in to Patient Health Vault with a one-time OTP
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-emerald-600" />
          </Link>
        </div>
      </div>

      {/* Right / Visual Showcase Card */}
      <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-8 shadow-apple-card text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative h-48 w-48 mb-4">
          <Image
            src="/images/illustrations/login-healthcare.svg"
            alt="ClinicOS Professional"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Professional Clinic OS
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
          The unified operating system for independent Indian doctors. Fast OPD queues, NMC generic prescribing, and 9 PM cash closing.
        </p>

        <div className="mt-6 w-full space-y-2 text-left text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 p-2.5 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>0% Commission • 100% Doctor Autonomy</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/5 p-2.5 text-slate-700 dark:text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Instant WhatsApp Cryptographic Rx</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/for-doctors" label="Back to Provider Suite" />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3] text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">DocSphere ClinicOS</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-xs text-slate-500">Loading sign in portal...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
