"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL, getAuthHeaders } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Users, 
  Cpu, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowLeft, 
  RefreshCw, 
  IndianRupee,
  Zap,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface TenantRecord {
  clinic_slug: string;
  clinic_name: string;
  doctor_name: string;
  plan: string;
  monthly_rate: number;
  subscription_status: "active" | "trial" | "suspended";
  days_remaining: number;
  tokens_today: number;
  is_verified: boolean;
}

interface AnalyticsData {
  kpis: {
    verified_paid_mrr: number;
    annual_run_rate: number;
    total_clinics: number;
    active_paying_clinics: number;
    trial_clinics: number;
    total_tokens_processed: number;
    ai_tokens_used: number;
    ai_cost_usd: number;
    ai_cost_inr: number;
  };
  tenants: TenantRecord[];
}

const API_BASE = `${API_BASE_URL}/api`;

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    kpis: {
      verified_paid_mrr: 998,
      annual_run_rate: 11976,
      total_clinics: 3,
      active_paying_clinics: 2,
      trial_clinics: 1,
      total_tokens_processed: 348,
      ai_tokens_used: 142500,
      ai_cost_usd: 0.21,
      ai_cost_inr: 17.50
    },
    tenants: [
      {
        clinic_slug: "derma-care-dehradun",
        clinic_name: "Derma Care Skin & Laser Centre",
        doctor_name: "Dr. Rahul Sharma",
        plan: "Solo Pro (₹499/mo)",
        monthly_rate: 499.0,
        subscription_status: "active",
        days_remaining: 26,
        tokens_today: 4,
        is_verified: true
      },
      {
        clinic_slug: "smile-craft-dental",
        clinic_name: "Smile Craft Multi-Speciality Dental",
        doctor_name: "Dr. Aditi Joshi",
        plan: "Solo Pro (₹499/mo)",
        monthly_rate: 499.0,
        subscription_status: "active",
        days_remaining: 18,
        tokens_today: 3,
        is_verified: true
      },
      {
        clinic_slug: "dron-child-clinic",
        clinic_name: "Dron Child & Newborn Health Centre",
        doctor_name: "Dr. Vikram Sethi",
        plan: "Multi-Doctor Clinic (₹1,999/mo)",
        monthly_rate: 1999.0,
        subscription_status: "trial",
        days_remaining: 5,
        tokens_today: 5,
        is_verified: true
      }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/analytics`, { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSubscriptionAction = async (clinicSlug: string, action: "extend_7d" | "paid_30d" | "suspend") => {
    // Optimistic UI updates
    setData(prev => {
      const updatedTenants = prev.tenants.map(t => {
        if (t.clinic_slug === clinicSlug) {
          if (action === "paid_30d") {
            return { ...t, subscription_status: "active" as const, days_remaining: 30 };
          } else if (action === "extend_7d") {
            return { ...t, days_remaining: t.days_remaining + 7 };
          } else {
            return { ...t, subscription_status: "suspended" as const, days_remaining: 0 };
          }
        }
        return t;
      });

      const activeTenants = updatedTenants.filter(t => t.subscription_status === "active");
      const paidMrr = activeTenants.reduce((acc, t) => acc + t.monthly_rate, 0);

      return {
        ...prev,
        kpis: {
          ...prev.kpis,
          verified_paid_mrr: paidMrr,
          annual_run_rate: paidMrr * 12,
          active_paying_clinics: activeTenants.length,
          trial_clinics: updatedTenants.filter(t => t.subscription_status === "trial").length
        },
        tenants: updatedTenants
      };
    });

    const tenantObj = data.tenants.find(t => t.clinic_slug === clinicSlug);
    const clinicName = tenantObj?.clinic_name || "Clinic";

    let actionLabel = "Updated";
    if (action === "paid_30d") actionLabel = "Extended 30 days (Active Paid)";
    if (action === "extend_7d") actionLabel = "Added +7 days Trial";
    if (action === "suspend") actionLabel = "Account Suspended";

    setToastMessage(`${clinicName}: ${actionLabel}`);
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await fetch(`${API_BASE}/admin/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          clinic_slug: clinicSlug,
          action
        })
      });
    } catch (err) {
      console.error("Subscription update failed on server:", err);
    }
  };

  const grossRevenue = data.kpis.verified_paid_mrr;
  const aiCostInr = data.kpis.ai_cost_inr;
  const grossMarginPercent = grossRevenue > 0 ? (((grossRevenue - aiCostInr) / grossRevenue) * 100).toFixed(1) : "99.0";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 1. TOP NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">Founder Master Command</span>
                <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Unit Economics
                </span>
              </div>
              <p className="text-xs text-slate-500">Live SaaS MRR, ARR, AI Compute & Clinic Tenants</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Building2 className="h-4 w-4" />
              Master Fleet & Billing
            </Link>
            <Link
              href="/admin/verifications"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <ShieldCheck className="h-4 w-4 text-red-600" />
              Doctor Verifications
            </Link>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* 2. BODY DASHBOARD */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI METRIC CARDS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* MRR */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Verified Paid MRR</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              ₹{data.kpis.verified_paid_mrr.toLocaleString("en-IN")}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>ARR Run Rate: ₹{data.kpis.annual_run_rate.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* CLINIC TENANTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Clinic Tenants</span>
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {data.kpis.total_clinics}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{data.kpis.active_paying_clinics} Paying</span>
              <span>•</span>
              <span className="font-semibold text-amber-600">{data.kpis.trial_clinics} Trial</span>
            </div>
          </div>

          {/* TOKEN THROUGHPUT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Patient Throughput</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {data.kpis.total_tokens_processed}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>OPD tokens & digital Rx generated</span>
            </div>
          </div>

          {/* AI COMPUTE & GROSS MARGIN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">AI Operations Margin</span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                <Cpu className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {grossMarginPercent}%
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <span>AI cost: ₹{data.kpis.ai_cost_inr.toFixed(2)} ({data.kpis.ai_tokens_used.toLocaleString()} tok)</span>
            </div>
          </div>
        </div>

        {/* UNIT ECONOMICS & PRODUCT COMPARISON */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/50 to-white p-6 shadow-sm dark:border-brand-900/50 dark:bg-slate-900 lg:col-span-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-brand-600" />
              <span>DocSphere Non-Aggregator Economics vs Traditional Medical Marketplaces</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Why independent Indian doctors choose DocSphere: Traditional platforms hijack patient relationships and charge 20% to 30% commission per booking. DocSphere provides a clean, self-hosted clinic operating layer for a flat, predictable fee.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-semibold text-slate-500">Doctor Retained Margin</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">100%</div>
                <p className="mt-1 text-[10px] text-slate-400">Direct patient UPI / Cash. Zero commission taken.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-semibold text-slate-500">Cloud AI Cost per Doctor</div>
                <div className="mt-1 text-2xl font-bold text-purple-600">~ ₹5.80 / mo</div>
                <p className="mt-1 text-[10px] text-slate-400">LLM token cost for onboarding & entity extraction.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="text-[11px] font-semibold text-slate-500">SaaS Gross Margin</div>
                <div className="mt-1 text-2xl font-bold text-brand-600">&gt; 98.5%</div>
                <p className="mt-1 text-[10px] text-slate-400">Virtually zero marginal server cost per patient token.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-slate-900 dark:text-white">Pilot Corridor</h3>
            <p className="mt-1 text-xs text-slate-500">Dehradun, Uttarakhand Medical Hub</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">Rajpur Road Medical Belt</span>
                <span className="font-bold text-brand-600">1 Clinic Active</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">EC Road Diagnostic Corridor</span>
                <span className="font-bold text-brand-600">1 Clinic Active</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">Chakrata Road Health Hub</span>
                <span className="font-bold text-amber-600">1 Clinic Trial</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
              <span className="text-slate-500">State Medical Council</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">Uttarakhand (UK-MC)</span>
            </div>
          </div>
        </div>

        {/* TENANT CLINICS & SUBSCRIPTION ACTIONS TABLE */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Clinic Tenants & Subscriptions</h2>
              <p className="text-xs text-slate-500">Manage billing cycles, trial extensions, and doctor verification state</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold">Clinic & Lead Doctor</th>
                    <th className="px-6 py-3.5 font-semibold">Plan & Rate</th>
                    <th className="px-6 py-3.5 font-semibold">Billing Status</th>
                    <th className="px-6 py-3.5 font-semibold">Days Left</th>
                    <th className="px-6 py-3.5 font-semibold">Today&apos;s OPD Load</th>
                    <th className="px-6 py-3.5 font-semibold text-right">Founder Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.tenants.map(tenant => (
                    <tr key={tenant.clinic_slug} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{tenant.clinic_name}</div>
                            <div className="text-[11px] text-slate-500">{tenant.doctor_name}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{tenant.plan}</div>
                        <div className="text-[10px] text-slate-400">Monthly SaaS billing</div>
                      </td>

                      <td className="px-6 py-4">
                        {tenant.subscription_status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active Paid
                          </span>
                        ) : tenant.subscription_status === "trial" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3.5 w-3.5" /> Free Trial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                            <AlertTriangle className="h-3.5 w-3.5" /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`font-semibold ${tenant.days_remaining <= 5 ? "text-amber-600" : "text-slate-700 dark:text-slate-300"}`}>
                          {tenant.days_remaining} days
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {tenant.tokens_today} tokens
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSubscriptionAction(tenant.clinic_slug, "paid_30d")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                            title="Mark Paid & Add 30 Days"
                          >
                            +30d Paid
                          </button>
                          <button
                            onClick={() => handleSubscriptionAction(tenant.clinic_slug, "extend_7d")}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            title="Extend Trial by 7 Days"
                          >
                            +7d Trial
                          </button>
                          {tenant.subscription_status !== "suspended" && (
                            <button
                              onClick={() => handleSubscriptionAction(tenant.clinic_slug, "suspend")}
                              className="rounded-lg border border-rose-200 bg-white px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:bg-slate-800 dark:text-rose-400"
                              title="Suspend Account"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
