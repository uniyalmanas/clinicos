"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  ChevronRight
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
  status: "active" | "suspended";
  subscription_plan: "starter" | "growth" | "enterprise" | "trial";
  plan_name: string;
  monthly_fee: number;
  subscription_status: "active" | "paid" | "trial" | "due" | "suspended";
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

export default function SuperAdminMasterPage() {
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
    fetchMasterData();
  }, []);

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
    if (!confirm(`Are you sure you want to ${newStatus === "suspended" ? "SUSPEND" : "REACTIVATE"} ${clinic.name}?`)) return;

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
        setActionSuccessToast(`${clinic.name} is now ${newStatus.toUpperCase()}.`);
        fetchMasterData();
        setTimeout(() => setActionSuccessToast(null), 4000);
      }
    } catch (err: any) {
      alert(`Error toggling clinic lock: ${err.message}`);
    }
  };

  const getWhatsAppInvoiceUrl = (clinic: ClinicFleetRecord) => {
    const text = encodeURIComponent(
      `Hello ${clinic.lead_doctor},\n\nThis is an official invoice reminder from *ClinicOS Digital Healthcare Infrastructure*.\n\n` +
      `🏢 Clinic: *${clinic.name}*\n` +
      `📋 SaaS Plan: *${clinic.plan_name}* (₹${clinic.monthly_fee}/month)\n` +
      `⏳ Current Status: *${clinic.subscription_status.toUpperCase()}* (${clinic.days_remaining} days remaining)\n` +
      `💳 Platform Fee Due: *₹${clinic.monthly_fee}*\n\n` +
      `Kindly complete the renewal to ensure continuous patient token queuing, digital prescriptions, and bed management.\n\n` +
      `UPI ID for payment: *clinicos@icici*\n\n` +
      `Thank you for powering your clinic with ClinicOS!`
    );
    const cleanPhone = clinic.phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const filteredClinics = clinics.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lead_doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "paid") return matchesSearch && (c.subscription_status === "paid" || c.subscription_status === "active");
    if (statusFilter === "trial") return matchesSearch && c.subscription_status === "trial";
    if (statusFilter === "due") return matchesSearch && (c.subscription_status === "due" || c.days_remaining <= 5);
    if (statusFilter === "suspended") return matchesSearch && c.status === "suspended";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7] p-4 sm:p-8">
      {/* 1. TOP HEADER & NAVIGATION */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-black/[0.08] dark:border-white/[0.08] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Super Admin Master Cockpit
              </span>
              <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">• Platform Master Controller</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1D1D1F] dark:text-white flex items-center gap-2.5">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
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
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
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
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {kpis?.occupied_beds || 0} / {kpis?.total_beds || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">{kpis?.network_bed_occupancy_pct || 0}% Occupancy</span>
          </div>

          {/* Platform Tech Take-Rate */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-1">
            <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-500" /> Platform Tech Fee
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              ₹{kpis?.platform_take_rate_revenue_est || 0}
            </div>
            <span className="text-[10px] text-[#86868B]">₹10/ticket take-rate</span>
          </div>
        </div>

        {/* 3. NAVIGATION TABS */}
        <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={() => setActiveTab("fleet")}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "fleet" 
                ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Master Fleet ({clinics.length})
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "billing" 
                ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            SaaS Billing & Fee Collection Ledger
          </button>

          <button
            onClick={() => setActiveTab("telemetry")}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === "telemetry" 
                ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Live Network Telemetry
          </button>
        </div>

        {/* 4. SEARCH & FILTERS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Search clinic name, slug, lead doctor, or city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-black/[0.08] bg-white pl-10 pr-4 py-2.5 text-xs shadow-sm focus:border-blue-500 focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {["all", "paid", "trial", "due", "suspended"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  statusFilter === status
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white dark:bg-[#1C1C1E] text-[#86868B] border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.04]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* 5. TAB CONTENT */}
        {activeTab === "fleet" && (
          <div className="rounded-3xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E] overflow-hidden shadow-apple-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] bg-black/[0.02] dark:border-white/[0.08] dark:bg-white/[0.02] text-[#86868B] font-semibold">
                    <th className="p-4">Clinic & Specialty</th>
                    <th className="p-4">Lead Practitioner</th>
                    <th className="p-4">Subscription Plan</th>
                    <th className="p-4">Today OPD / GMV</th>
                    <th className="p-4">Bed Census</th>
                    <th className="p-4">Access Status</th>
                    <th className="p-4 text-right">Master Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                  {filteredClinics.map((clinic) => {
                    const isSuspended = clinic.status === "suspended";
                    return (
                      <tr key={clinic.id} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition">
                        <td className="p-4">
                          <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                            <span>{clinic.name}</span>
                            {clinic.subscription_status === "paid" && (
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500" title="Paid Active" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                            /{clinic.slug} • {clinic.city}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-[#1D1D1F] dark:text-white">{clinic.lead_doctor}</div>
                          <div className="text-[11px] text-[#86868B] font-mono">{clinic.phone}</div>
                        </td>

                        <td className="p-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            clinic.subscription_plan === "enterprise"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              : clinic.subscription_plan === "growth"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {clinic.plan_name} (₹{clinic.monthly_fee}/mo)
                          </span>
                          <div className="text-[10px] text-[#86868B] mt-0.5">
                            {clinic.days_remaining} days left
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-bold text-[#1D1D1F] dark:text-white">
                            {clinic.tokens_today} Tokens
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                            ₹{clinic.gmv_today.toLocaleString("en-IN")}
                          </div>
                        </td>

                        <td className="p-4">
                          {clinic.total_beds > 0 ? (
                            <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                              {clinic.occupied_beds} / {clinic.total_beds}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#86868B] italic">Outpatient OPD</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isSuspended 
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : clinic.subscription_status === "paid" || clinic.subscription_status === "active"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              isSuspended ? "bg-rose-500" : clinic.subscription_status === "paid" || clinic.subscription_status === "active" ? "bg-emerald-500" : "bg-amber-500"
                            }`} />
                            {isSuspended ? "Suspended" : clinic.subscription_status.toUpperCase()}
                          </span>
                        </td>

                        <td className="p-4 text-right space-x-1">
                          {/* JUMP INTO CLINIC WORKSPACE BUTTON */}
                          <Link
                            href={`/dashboard?clinic_slug=${clinic.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[11px] hover:bg-blue-100 transition shadow-sm"
                            title="Jump directly into this clinic's EMR & queue workspace"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open Workspace
                          </Link>

                          {/* RECORD PAYMENT / RENEW */}
                          <button
                            onClick={() => {
                              setSelectedClinic(clinic);
                              setSelectedPlan(clinic.subscription_plan as any || "growth");
                              setPaymentModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-100 transition shadow-sm"
                            title="Record SaaS fee payment from doctor"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Billing
                          </button>

                          {/* SUSPEND / UNLOCK */}
                          <button
                            onClick={() => handleToggleLock(clinic)}
                            className={`p-1.5 rounded-lg transition ${
                              isSuspended
                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
                            }`}
                            title={isSuspended ? "Reactivate Clinic" : "Suspend Access"}
                          >
                            {isSuspended ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SAAS BILLING & FEE COLLECTION LEDGER */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-2">
                <span className="text-xs font-bold text-[#86868B]">Paid Active Clinics</span>
                <div className="text-3xl font-black text-emerald-600">{kpis?.paid_clinics || 0} / {kpis?.total_clinics || 0}</div>
                <p className="text-[11px] text-[#86868B]">Generating recurring SaaS cash inflow</p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-2">
                <span className="text-xs font-bold text-[#86868B]">Trial / Free Pilots</span>
                <div className="text-3xl font-black text-amber-500">{kpis?.trial_clinics || 0}</div>
                <p className="text-[11px] text-[#86868B]">Ready for conversion to paid SaaS</p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-2">
                <span className="text-xs font-bold text-[#86868B]">Suspended Accounts</span>
                <div className="text-3xl font-black text-rose-500">{kpis?.suspended_clinics || 0}</div>
                <p className="text-[11px] text-[#86868B]">Access locked pending subscription fee</p>
              </div>
            </div>

            <div className="rounded-3xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E] p-6 shadow-apple-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Clinic Subscription Invoicing & WhatsApp Dunning Desk
              </h3>
              <p className="text-xs text-[#86868B]">
                Dispatch official payment requests and renewal links directly to clinic owners via WhatsApp.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClinics.map((clinic) => (
                  <div key={clinic.id} className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-[#1D1D1F] dark:text-white text-xs">{clinic.name}</div>
                        <div className="text-[10px] text-[#86868B]">{clinic.lead_doctor}</div>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-600">
                        ₹{clinic.monthly_fee}/mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#86868B]">Expires:</span>
                      <span className="font-bold text-[#1D1D1F] dark:text-white">
                        {new Date(clinic.subscription_expires_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
                        {" "}({clinic.days_remaining}d left)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getWhatsAppInvoiceUrl(clinic)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition shadow-sm"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Send WA Invoice
                      </a>

                      <button
                        onClick={() => {
                          setSelectedClinic(clinic);
                          setSelectedPlan(clinic.subscription_plan as any || "growth");
                          setPaymentModalOpen(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.08] font-bold text-[11px] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] transition"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE NETWORK TELEMETRY */}
        {activeTab === "telemetry" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Infrastructure & Database Connectivity
              </h3>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <span>Database Cluster</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase PostgreSQL (AWS Mumbai)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <span>Pooler Protocol</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">Port 6543 (Transaction Mode)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <span>Edge Compute Tier</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">Vercel Serverless (iad1 / bom1)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <span>Total Active Routes</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">94 Monitored Endpoints</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm space-y-4">
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Bed className="h-4 w-4 text-purple-500" />
                Network Acute Bed Census Telemetry
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-200">Total Acute Beds Across Network</div>
                    <div className="text-[11px] text-purple-700 dark:text-purple-400">General Wards, HDU, Daycare Suites</div>
                  </div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-300">
                    {kpis?.occupied_beds || 0} / {kpis?.total_beds || 0}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] text-xs space-y-2">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#86868B]">Network Occupancy Rate:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-white">{kpis?.network_bed_occupancy_pct || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${kpis?.network_bed_occupancy_pct || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. PAYMENT / RENEWAL MODAL */}
      {paymentModalOpen && selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1C1C1E] p-6 shadow-2xl border border-black/[0.08] dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                Record SaaS Payment & Renew Clinic
              </h3>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] text-xs space-y-1">
              <div className="font-bold text-[#1D1D1F] dark:text-white">{selectedClinic.name}</div>
              <div className="text-[11px] text-[#86868B]">Doctor: {selectedClinic.lead_doctor} ({selectedClinic.phone})</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Select SaaS Plan Tier</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { key: "starter", name: "Solo", fee: 999 },
                    { key: "growth", name: "Growth", fee: 2499 },
                    { key: "enterprise", name: "Hospital", fee: 4999 }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedPlan(p.key as any)}
                      className={`p-2.5 rounded-xl border text-center transition ${
                        selectedPlan === p.key
                          ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold"
                          : "border-black/[0.08] dark:border-white/[0.08] text-[#86868B]"
                      }`}
                    >
                      <div className="text-[11px]">{p.name}</div>
                      <div className="text-xs font-mono font-bold mt-0.5">₹{p.fee}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Extend Access Duration</label>
                <select
                  value={extendDays}
                  onChange={e => setExtendDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] bg-white dark:bg-[#2C2C2E] p-2.5 text-xs dark:text-white"
                >
                  <option value={30}>30 Days (1 Month Renewal)</option>
                  <option value={90}>90 Days (Quarterly Renewal)</option>
                  <option value={180}>180 Days (Half-Year Renewal)</option>
                  <option value={365}>365 Days (Annual SaaS Pass)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleRecordPayment(selectedClinic)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              Confirm Payment & Mark as Active
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
