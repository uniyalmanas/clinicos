"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Building2, 
  Stethoscope, 
  CreditCard, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  RefreshCw, 
  IndianRupee, 
  Zap, 
  ExternalLink, 
  Search, 
  Filter, 
  Check, 
  Ban, 
  MessageCircle, 
  Bed, 
  Calendar, 
  Sparkles, 
  BarChart3, 
  Mail, 
  ChevronRight,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from "lucide-react";

interface ClinicFleetRecord {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  upi_vpa: string;
  status: "active" | "suspended" | string;
  subscription_plan: "starter" | "growth" | "enterprise" | "trial" | string;
  plan_name: string;
  monthly_fee: number;
  subscription_status: "active" | "paid" | "trial" | "due" | "due_soon" | "suspended" | string;
  subscription_expires_at: string;
  days_remaining: number;
  doctor_count: number;
  lead_doctor: string;
  tokens_today: number;
  active_tokens: number;
  completed_tokens: number;
  gmv_today: number;
  all_time_tokens: number;
  all_time_gmv: number;
  total_beds: number;
  occupied_beds: number;
}

interface MasterKPIs {
  total_clinics: number;
  paid_clinics: number;
  trial_clinics: number;
  due_clinics: number;
  suspended_clinics: number;
  monthly_recurring_revenue: number;
  annual_run_rate: number;
  platform_take_rate_revenue_est: number;
  today_network_tokens: number;
  today_network_gmv: number;
  total_beds: number;
  occupied_beds: number;
  network_bed_occupancy_pct: number;
}

export default function SuperAdminPage() {
  const router = useRouter();

  // Authentication gate state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Cockpit state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"fleet" | "billing" | "telemetry">("fleet");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kpis, setKpis] = useState<MasterKPIs | null>(null);
  const [clinics, setClinics] = useState<ClinicFleetRecord[]>([]);

  // Action modals
  const [selectedClinic, setSelectedClinic] = useState<ClinicFleetRecord | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "growth" | "enterprise">("growth");
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // 1. Check if superadmin is already unlocked in this session
  useEffect(() => {
    try {
      const unlocked = sessionStorage.getItem("clinicos_superadmin_unlocked");
      if (unlocked === "true") {
        setIsUnlocked(true);
        const stored = localStorage.getItem("clinicos_user");
        if (stored) setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  // 2. Fetch master data once unlocked
  const fetchMasterData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/master");
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
        setClinics(data.clinics);
      }
    } catch (err) {
      console.error("Failed to load master admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchMasterData();
    }
  }, [isUnlocked]);

  // 3. Password Verification Handler
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const entered = passwordInput.trim();

    if (entered !== "Manas@12") {
      setAuthError("Incorrect password. Please try again.");
      setAuthLoading(false);
      return;
    }

    try {
      // Background sign-in to authenticate session token with Supabase backend
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "superadmin", password: entered })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("clinicos_token", data.access_token);
        const user = {
          id: data.user_id,
          phone: "superadmin",
          full_name: data.full_name || "Super Admin (Manas)",
          role: "super_admin"
        };
        localStorage.setItem("clinicos_user", JSON.stringify(user));
        setCurrentUser(user);
      }
    } catch (err) {
      console.warn("Background JWT sync non-critical warning:", err);
    }

    // Unlock session
    try {
      sessionStorage.setItem("clinicos_superadmin_unlocked", "true");
    } catch (e) {}

    setIsUnlocked(true);
    setAuthLoading(false);
  };

  // 4. Lock / Sign Out Handler
  const handleLock = () => {
    try {
      sessionStorage.removeItem("clinicos_superadmin_unlocked");
      localStorage.removeItem("clinicos_token");
      localStorage.removeItem("clinicos_user");
      document.cookie = "clinicos_token=; path=/; max-age=0";
    } catch (e) {}
    setIsUnlocked(false);
    setPasswordInput("");
    setAuthError(null);
  };

  const handleRecordPayment = async (clinic: ClinicFleetRecord) => {
    try {
      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinic.id,
          clinic_slug: clinic.slug,
          action: "record_payment",
          subscription_plan: selectedPlan,
          extend_days: extendDays
        })
      });
      if (res.ok) {
        setActionSuccessToast(`Payment recorded! Subscription extended by ${extendDays} days for ${clinic.name}.`);
        setPaymentModalOpen(false);
        fetchMasterData();
        setTimeout(() => setActionSuccessToast(null), 4000);
      }
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const handleToggleLock = async (clinic: ClinicFleetRecord) => {
    const newStatus = clinic.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/admin/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinic.id,
          clinic_slug: clinic.slug,
          action: "toggle_lock",
          new_status: newStatus
        })
      });
      if (res.ok) {
        setActionSuccessToast(`Clinic ${clinic.name} ${newStatus === "suspended" ? "suspended" : "activated"}.`);
        fetchMasterData();
        setTimeout(() => setActionSuccessToast(null), 4000);
      }
    } catch (err: any) {
      alert(`Error toggling clinic status: ${err.message}`);
    }
  };

  // Filtered clinic fleet list
  const filteredClinics = clinics.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lead_doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "paid") return matchesSearch && (c.subscription_status === "paid" || c.subscription_status === "active");
    if (statusFilter === "trial") return matchesSearch && c.subscription_status === "trial";
    if (statusFilter === "due") return matchesSearch && (c.subscription_status === "due" || c.subscription_status === "due_soon");
    if (statusFilter === "suspended") return matchesSearch && c.status === "suspended";
    return matchesSearch;
  });

  // -----------------------------------------------------------------
  // RENDER PASSWORD GATE IF NOT UNLOCKED
  // -----------------------------------------------------------------
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
        {/* Top brand bar */}
        <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">DocSphere ClinicOS</span>
              <span className="block text-[10px] text-purple-400 font-mono font-medium">SUPERADMIN MASTER ACCESS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Center password card */}
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              {/* Subtle accent glow */}
              <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

              <div className="relative text-center space-y-3">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shadow-inner">
                  <Lock className="h-7 w-7 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Super Admin Cockpit
                  </h1>
                  <p className="mt-1 text-xs text-slate-400">
                    Master access across 20+ medical centers, SaaS billing & live telemetry.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUnlock} className="mt-8 space-y-4 relative">
                {authError && (
                  <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Enter Master Password</span>
                    <span className="text-[10px] text-slate-500 font-mono">Protected Gate</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoFocus
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-11 text-sm font-mono text-white placeholder-slate-600 shadow-inner focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || !passwordInput}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {authLoading ? "Verifying..." : "Unlock Super Admin Cockpit"}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-500">
                  Direct master route: <span className="font-mono text-purple-400">localhost:3000/superadmin</span>
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-slate-600 py-4">
          DocSphere ClinicOS Multi-Tenant Architecture • Pure 2-Tier Serverless Next.js & Supabase
        </footer>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER MASTER COCKPIT ONCE UNLOCKED
  // -----------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7] p-4 sm:p-8">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                Super Admin Master Cockpit
              </span>
              <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">• localhost:3000/superadmin</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="h-7 w-7 text-purple-600" />
              ClinicOS Multi-Tenant Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
              Fleet oversight of 20+ onboarded medical centers, SaaS recurring revenue, and live network telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={fetchMasterData}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white shadow-sm hover:bg-black/[0.04] transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-purple-600" : ""}`} />
              Sync Live Telemetry
            </button>
            <Link
              href="/admin/verifications"
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white shadow-sm hover:bg-black/[0.04] transition"
            >
              Doctor Licenses
            </Link>
            <Link
              href="/admin/inquiries"
              className="px-3 py-2 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white shadow-sm hover:bg-black/[0.04] transition"
            >
              Inbound Leads
            </Link>
            <ThemeToggle />
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-700 dark:text-purple-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Super Admin (Manas)</span>
            </div>

            <button
              onClick={handleLock}
              className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5"
              title="Lock Cockpit"
            >
              <Lock className="h-3.5 w-3.5" />
              Lock Cockpit
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {actionSuccessToast && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{actionSuccessToast}</span>
            </div>
            <button onClick={() => setActionSuccessToast(null)} className="text-xs underline">Dismiss</button>
          </div>
        )}

        {/* 2. REVENUE & NETWORK TELEMETRY KPIS */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* MRR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <IndianRupee className="h-3 w-3 text-emerald-500" /> Platform MRR
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{kpis?.monthly_recurring_revenue.toLocaleString("en-IN") || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">SaaS Subscriptions</span>
          </div>

          {/* ARR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-blue-500" /> Annual Run Rate
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
              ₹{kpis?.annual_run_rate.toLocaleString("en-IN") || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">ARR Projection</span>
          </div>

          {/* Clinic Count */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <Building2 className="h-3 w-3 text-indigo-500" /> Total Fleet
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
              {kpis?.total_clinics || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">{kpis?.paid_clinics || 0} Paid • {kpis?.trial_clinics || 0} Trial</span>
          </div>

          {/* Today's Network OPD Volume */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <Users className="h-3 w-3 text-amber-500" /> Today OPD Tokens
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
              {kpis?.today_network_tokens || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">Cross-clinic footfall</span>
          </div>

          {/* Inpatient Bed Census */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <Bed className="h-3 w-3 text-purple-500" /> Network Beds
            </span>
            <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
              {kpis?.occupied_beds || 0} / {kpis?.total_beds || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">{kpis?.network_bed_occupancy_pct || 0}% acute census</span>
          </div>

          {/* Network Health / Supabase DB */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <Zap className="h-3 w-3 text-teal-500" /> Supabase DB
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Healthy
            </div>
            <span className="text-[10px] text-[#86868B]">Port 6543 Pooler</span>
          </div>
        </div>

        {/* 3. COCKPIT NAVIGATION TABS */}
        <div className="flex border-b border-black/[0.08] dark:border-white/[0.08] gap-4">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "fleet" 
                ? "border-purple-600 text-purple-600 dark:text-purple-400" 
                : "border-transparent text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Master Fleet ({clinics.length})
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "billing" 
                ? "border-purple-600 text-purple-600 dark:text-purple-400" 
                : "border-transparent text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            SaaS Billing & Fee Collection
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === "telemetry" 
                ? "border-purple-600 text-purple-600 dark:text-purple-400" 
                : "border-transparent text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Live Network Telemetry
          </button>
        </div>

        {/* 4. TAB CONTENT: FLEET */}
        {activeTab === "fleet" && (
          <div className="space-y-4">
            {/* SEARCH & FILTERS BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#86868B]" />
                <input
                  type="text"
                  placeholder="Search clinic, city, doctor or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-none text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-semibold text-[#86868B] mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Status:
                </span>
                {["all", "paid", "trial", "due", "suspended"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      statusFilter === st
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* CLINICS TABLE */}
            <div className="overflow-x-auto rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] dark:text-[#8E8E93] uppercase font-bold text-[10px] tracking-wider border-b border-black/[0.04] dark:border-white/[0.06]">
                  <tr>
                    <th className="py-3.5 px-4">Clinic & Location</th>
                    <th className="py-3.5 px-4">Lead Doctor</th>
                    <th className="py-3.5 px-4">Plan & Fee</th>
                    <th className="py-3.5 px-4">Today Tokens / GMV</th>
                    <th className="py-3.5 px-4">Acute Beds</th>
                    <th className="py-3.5 px-4">Status & Renewal</th>
                    <th className="py-3.5 px-4 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#86868B]">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-purple-600 mb-2" />
                        Synchronizing master multi-tenant fleet metrics...
                      </td>
                    </tr>
                  ) : filteredClinics.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#86868B]">
                        No clinics match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredClinics.map((clinic) => (
                      <tr 
                        key={clinic.id} 
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition ${
                          clinic.status === "suspended" ? "opacity-60 bg-red-500/5" : ""
                        }`}
                      >
                        {/* Clinic & Location */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            {clinic.name}
                          </div>
                          <div className="text-[11px] text-[#86868B] mt-0.5">
                            {clinic.city}, {clinic.state} • <span className="font-mono">{clinic.slug}</span>
                          </div>
                        </td>

                        {/* Lead Doctor */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1">
                            <Stethoscope className="h-3 w-3 text-teal-600 shrink-0" />
                            {clinic.lead_doctor}
                          </div>
                          <div className="text-[10px] text-[#86868B] mt-0.5">
                            {clinic.doctor_count} Doctor{clinic.doctor_count !== 1 ? "s" : ""} on duty
                          </div>
                        </td>

                        {/* Plan & Fee */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1D1D1F] dark:text-white">
                            {clinic.plan_name}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            ₹{clinic.monthly_fee.toLocaleString("en-IN")}/mo
                          </div>
                        </td>

                        {/* Today Tokens / GMV */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1">
                            <Users className="h-3 w-3 text-amber-500" />
                            {clinic.tokens_today} tokens
                          </div>
                          <div className="text-[10px] text-[#86868B]">
                            ₹{clinic.gmv_today.toLocaleString("en-IN")} collected today
                          </div>
                        </td>

                        {/* Acute Beds */}
                        <td className="py-3 px-4">
                          {clinic.total_beds > 0 ? (
                            <div>
                              <span className="font-bold text-[#1D1D1F] dark:text-white">
                                {clinic.occupied_beds} / {clinic.total_beds}
                              </span>
                              <div className="text-[10px] text-[#86868B]">
                                {Math.round((clinic.occupied_beds / clinic.total_beds) * 100)}% occupied
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#86868B]">OPD Only</span>
                          )}
                        </td>

                        {/* Status & Renewal */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              clinic.status === "suspended"
                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                : clinic.subscription_status === "paid" || clinic.subscription_status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : clinic.subscription_status === "trial"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}>
                              {clinic.status === "suspended" ? "SUSPENDED" : clinic.subscription_status}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#86868B] mt-1 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {clinic.days_remaining}d remaining
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedClinic(clinic);
                                setSelectedPlan(clinic.subscription_plan as any || "growth");
                                setPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] transition"
                              title="Record SaaS Payment"
                            >
                              Collect Fee
                            </button>

                            <Link
                              href={`/clinics/${clinic.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#1D1D1F] dark:text-white transition"
                              title="Open Clinic Public Profile"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>

                            <Link
                              href={`/dashboard?clinic_slug=${clinic.slug}`}
                              className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition"
                              title="Impersonate & Open Clinic Dashboard"
                            >
                              Workspace
                            </Link>

                            <button
                              onClick={() => handleToggleLock(clinic)}
                              className={`p-1.5 rounded-lg transition ${
                                clinic.status === "suspended"
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40"
                              }`}
                              title={clinic.status === "suspended" ? "Unsuspend Clinic" : "Suspend Access"}
                            >
                              {clinic.status === "suspended" ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. TAB CONTENT: SAAS BILLING */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* BILLING HERO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                  Total Monthly Recurring Revenue
                </span>
                <div className="text-3xl sm:text-4xl font-black">
                  ₹{kpis?.monthly_recurring_revenue.toLocaleString("en-IN") || 0}
                </div>
                <p className="text-xs opacity-90">
                  Active recurring contracts from {kpis?.paid_clinics || 0} paying medical facilities.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                  Annualized Run Rate (ARR)
                </span>
                <div className="text-3xl sm:text-4xl font-black">
                  ₹{kpis?.annual_run_rate.toLocaleString("en-IN") || 0}
                </div>
                <p className="text-xs opacity-90">
                  Projected 12-month contract value based on live tier distribution.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-700 text-white shadow-xl space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                  Trial Conversion Pipeline
                </span>
                <div className="text-3xl sm:text-4xl font-black">
                  {kpis?.trial_clinics || 0} Clinics
                </div>
                <p className="text-xs opacity-90">
                  Clinics currently under 14-day zero-risk trial ready for onboarding upgrade.
                </p>
              </div>
            </div>

            {/* BILLING LEDGER */}
            <div className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                    Tenant Subscription Ledger & 1-Click WhatsApp Dunning
                  </h3>
                  <p className="text-xs text-[#86868B]">
                    Track renewals, dispatch invoice reminders, and extend subscription terms directly.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Clinic</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Expires In</th>
                      <th className="p-3 text-right">Dunning & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    {clinics.map((c) => (
                      <tr key={c.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="p-3 font-bold text-[#1D1D1F] dark:text-white">
                          {c.name}
                          <div className="text-[10px] text-[#86868B] font-mono">{c.phone}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold">{c.plan_name}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-600">
                          ₹{c.monthly_fee}/mo
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.subscription_status === "paid" || c.subscription_status === "active"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : c.subscription_status === "trial"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                          }`}>
                            {c.subscription_status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`font-mono text-xs ${c.days_remaining <= 5 ? "text-red-500 font-bold" : "text-[#86868B]"}`}>
                            {c.days_remaining} days
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* WhatsApp Dunning Button */}
                            <a
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Namaste from DocSphere ClinicOS Admin! Your ${c.plan_name} subscription for ${c.name} is currently ${c.subscription_status} (${c.days_remaining} days left). To renew or settle monthly dues (₹${c.monthly_fee}), please respond to this message or pay via UPI: ${c.upi_vpa}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition shadow-sm"
                            >
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp Invoice
                            </a>

                            <button
                              onClick={() => {
                                setSelectedClinic(c);
                                setSelectedPlan(c.subscription_plan as any || "growth");
                                setPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 font-bold text-[11px] transition"
                            >
                              Renew
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. TAB CONTENT: TELEMETRY */}
        {activeTab === "telemetry" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* INFRASTRUCTURE MONITOR */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Platform Infrastructure & Edge Topology
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase">
                    100% Operational
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]">
                    <div>
                      <div className="font-bold text-xs">Supabase Transaction Pooler</div>
                      <div className="text-[10px] text-[#86868B] font-mono">aws-1-ap-south-1.pooler.supabase.com:6543</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">CONNECTED</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]">
                    <div>
                      <div className="font-bold text-xs">Vercel Serverless Edge Runtime</div>
                      <div className="text-[10px] text-[#86868B]">Next.js 15 App Router API Handlers</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">LATENCY 28ms</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F7] dark:bg-[#2C2C2E]">
                    <div>
                      <div className="font-bold text-xs">ABDM & FHIR M2 Engine</div>
                      <div className="text-[10px] text-[#86868B]">Ayushman Bharat Digital Health Records</div>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600">COMPLIANT</span>
                  </div>
                </div>
              </div>

              {/* NETWORK BED CENSUS */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Bed className="h-5 w-5 text-purple-500" />
                    Network Acute Inpatient Census
                  </h3>
                  <span className="text-xs font-bold text-purple-600">
                    {kpis?.occupied_beds || 0} Occupied / {kpis?.total_beds || 0} Total
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40">
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span>Network Occupancy Rate</span>
                      <span className="text-purple-600">{kpis?.network_bed_occupancy_pct || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${kpis?.network_bed_occupancy_pct || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <p className="text-xs text-[#86868B]">
                    Real-time bed turnover and triage tracking across polyclinics with emergency day-care observation bays.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. MODAL: RECORD SAAS PAYMENT & EXTEND SUBSCRIPTION */}
      {paymentModalOpen && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Record SaaS Subscription Payment
                </h3>
                <span className="text-xs text-[#86868B]">{selectedClinic.name}</span>
              </div>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#86868B] mb-1">
                  Subscription Plan Tier
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e: any) => setSelectedPlan(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#F5F5F7] dark:bg-[#2C2C2E] border-none text-xs font-bold text-[#1D1D1F] dark:text-white"
                >
                  <option value="starter">Solo Starter (₹999 / mo)</option>
                  <option value="growth">Polyclinic Growth (₹2,499 / mo)</option>
                  <option value="enterprise">Hospital Enterprise (₹4,999 / mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#86868B] mb-1">
                  Extension Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "30 Days", val: 30 },
                    { label: "90 Days (Quarterly)", val: 90 },
                    { label: "365 Days (Annual)", val: 365 }
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      type="button"
                      onClick={() => setExtendDays(dur.val)}
                      className={`p-2 rounded-xl text-xs font-bold transition border ${
                        extendDays === dur.val
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-[#F5F5F7] dark:bg-[#2C2C2E] text-[#86868B] border-transparent"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                Recording payment marks the clinic subscription active and extends access for {extendDays} days.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-xs font-bold text-[#1D1D1F] dark:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRecordPayment(selectedClinic)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition"
              >
                Confirm Payment & Extend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
