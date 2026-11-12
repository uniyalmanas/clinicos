"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Shield,
  Loader2,
  Sparkles,
  ClipboardList,
  Pill,
  FlaskConical,
  Tv,
  QrCode,
  CheckCircle2,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BackButton from "@/components/BackButton";

const API_BASE = "/api";

interface DemoRole {
  id: string;
  label: string;
  roleTitle: string;
  name: string;
  phone: string;
  destination: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: "doctor",
    label: "Doctor OPD Chamber",
    roleTitle: "Consultation, Rx, AI Scribe & Clinical Queue",
    name: "Dr. Aditi Joshi (Senior Physician)",
    phone: "9876500002",
    destination: "/dashboard/today",
    badge: "OPD Live",
    badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300/60",
    icon: Stethoscope,
  },
  {
    id: "reception",
    label: "Front Desk & Reception",
    roleTitle: "Patient Queue, Tokens, Triage & Registrations",
    name: "Meera Nair (Front Desk)",
    phone: "9876500003",
    destination: "/dashboard/desk",
    badge: "Queue Desk",
    badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300/60",
    icon: ClipboardList,
  },
  {
    id: "owner",
    label: "Clinic Director / Owner",
    roleTitle: "Analytics, Financials, Staff & Clinic Settings",
    name: "Dr. Rahul Sharma (Director)",
    phone: "9876500001",
    destination: "/dashboard",
    badge: "Admin & Analytics",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300/60",
    icon: Building2,
  },
  {
    id: "pharmacy",
    label: "In-House Pharmacy",
    roleTitle: "Prescription Dispensing & Drug Inventory",
    name: "Sanjay Verma (Pharmacist)",
    phone: "9876500004",
    destination: "/dashboard/pharmacy",
    badge: "Dispensing",
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/60",
    icon: Pill,
  },
  {
    id: "lab",
    label: "Diagnostic Pathology Lab",
    roleTitle: "Diagnostic Orders, Specimen & Test Results",
    name: "Dr. Neha Kapoor (Pathologist)",
    phone: "9876500005",
    destination: "/dashboard/lab",
    badge: "Diagnostics",
    badgeColor: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300/60",
    icon: FlaskConical,
  },
];

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
  const [activeDemoId, setActiveDemoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeLogin = async (loginPhone: string, loginPass: string, isDemo = false, targetDestination?: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: loginPhone,
          password: loginPass,
          is_demo: isDemo,
        }),
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

      const safeNext =
        nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
          ? nextUrl
          : null;
      router.push(safeNext || targetDestination || destinationFor(data.role));
    } catch (err: any) {
      setErrorMessage(err.message || "Login failed. Please check credentials.");
      setLoading(false);
      setActiveDemoId(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(phone, password, false);
  };

  const handleDemoTap = async (role: DemoRole) => {
    setActiveDemoId(role.id);
    await executeLogin(role.phone, "Password@123", true, role.destination);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 dark:bg-blue-950/40 dark:border-blue-900/40 text-[11px] font-medium text-[#0071E3] dark:text-[#2997FF]">
          <Building2 className="h-3.5 w-3.5" />
          <span>Clinical Provider Portal • DocSphere Multispecialty Clinic</span>
          {nextUrl && <span className="text-slate-400">• Redirect: {nextUrl}</span>}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Sign in to ClinicOS
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Experience the live digital clinic workflow or sign in with your clinic credentials
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 border border-rose-200/80 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* 1-Tap Demo Showcase Card */}
      <div className="rounded-xl border-2 border-blue-500/30 bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/20 dark:via-[#151618] dark:to-[#151618] p-4 sm:p-5 shadow-sm dark:border-blue-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>1-Tap Demo Roles</span>
                <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-950 px-1.5 py-0.5 rounded">
                  DocSphere Demo Clinic
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click any role below to instantly log in and experience that workflow:
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMO_ROLES.map((role) => {
            const Icon = role.icon;
            const isThisLoading = loading && activeDemoId === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => handleDemoTap(role)}
                disabled={loading}
                className="group relative flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xs transition text-left dark:border-white/[0.08] dark:bg-[#111113] dark:hover:border-blue-500 disabled:opacity-50 cursor-pointer"
              >
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                  {isThisLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate">
                      {role.label}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${role.badgeColor}`}
                    >
                      {role.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
                    {role.name}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {role.roleTitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Public Displays */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Live Public Patient Displays:
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/waiting-room"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-medium text-slate-700 dark:text-slate-200 transition"
            >
              <Tv className="h-3 w-3 text-blue-500" />
              <span>Smart TV Queue ↗</span>
            </Link>
            <Link
              href="/check-in?clinic=docsphere-demo-clinic"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-[11px] font-medium text-slate-700 dark:text-slate-200 transition"
            >
              <QrCode className="h-3 w-3 text-emerald-500" />
              <span>Lobby Kiosk Check-In ↗</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Manual Password Login Card */}
      <form
        onSubmit={handleManualLogin}
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#151618] space-y-3.5"
      >
        <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-white/[0.05]">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Sign in with phone or custom credentials
          </span>
          <span className="text-[10px] text-slate-400">
            Demo password: <code className="font-mono font-semibold text-slate-600 dark:text-slate-300">Password@123</code>
          </span>
        </div>

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
              placeholder="e.g. 9876500002 or dr.rahul@clinicos.in"
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
          {loading && !activeDemoId ? (
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
