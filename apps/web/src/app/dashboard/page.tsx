"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Stethoscope, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Users, 
  IndianRupee, 
  Sparkles,
  CheckCircle2
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [activeQueue, setActiveQueue] = useState<any[]>([
    {
      token: 1,
      patient_name: "Amit Rawat",
      phone: "+91 91234 56780",
      doctor: "Dr. Rahul Sharma (Chamber 1)",
      status: "completed",
      time: "10:15 AM",
      fee: 600,
      payment: "UPI Paid"
    },
    {
      token: 2,
      patient_name: "Priya Singh",
      phone: "+91 91234 56781",
      doctor: "Dr. Rahul Sharma (Chamber 1)",
      status: "in_consultation",
      time: "10:30 AM",
      fee: 600,
      payment: "UPI Paid"
    },
    {
      token: 3,
      patient_name: "Rohit Pant",
      phone: "+91 91234 56782",
      doctor: "Dr. Rahul Sharma (Chamber 1)",
      status: "waiting",
      time: "10:45 AM",
      fee: 600,
      payment: "Cash Pending"
    }
  ]);

  const [metrics, setMetrics] = useState({
    footfall: 14,
    waitingCount: 3,
    avgWaitMins: 11,
    grossCollections: 7800,
    upiCollections: 6000,
    cashCollections: 1800,
    marginPct: 61.4,
  });

  const [activeConsultation, setActiveConsultation] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [deskRes, expRes] = await Promise.all([
          fetch("/api/clinic/desk-queue").then(r => r.ok ? r.json() : null),
          fetch("/api/expenses").then(r => r.ok ? r.json() : null),
        ]);

        if (deskRes?.queue && deskRes.queue.length > 0) {
          const mapped = deskRes.queue.map((q: any) => ({
            token: q.token_number,
            appointment_number: q.appointment_number,
            patient_name: q.patient_name,
            phone: q.patient_phone,
            doctor: `${q.doctor_name || "Dr. Rahul Sharma"} (Chamber 1)`,
            status: q.status,
            time: q.time_slot || "Live Queue",
            fee: q.fee_amount || 600,
            payment: q.payment_status === "paid" ? `${(q.payment_mode || "UPI").toUpperCase()} Paid` : "Cash Pending",
          }));
          setActiveQueue(mapped);

          const inConsult = deskRes.queue.find((q: any) => q.status === "in_consultation");
          if (inConsult) setActiveConsultation(inConsult);

          setMetrics(prev => ({
            ...prev,
            footfall: deskRes.queue.length,
            waitingCount: deskRes.waiting_count || prev.waitingCount,
            grossCollections: deskRes.financials?.total_collected || prev.grossCollections,
            upiCollections: deskRes.financials?.upi_collected || prev.upiCollections,
            cashCollections: deskRes.financials?.cash_collected || prev.cashCollections,
          }));
        }

        if (expRes?.kpis) {
          setMetrics(prev => ({
            ...prev,
            grossCollections: expRes.kpis.gross_collections || prev.grossCollections,
            marginPct: expRes.kpis.profit_margin_pct || prev.marginPct,
          }));
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP METRIC STATS (APPLE HEALTH STYLE CARDS) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Footfall */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today&apos;s Footfall</span>
            <div className="rounded-[12px] bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            {metrics.footfall} <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">Patients</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#34C759] dark:text-[#30D158] font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+18% vs last week</span>
          </div>
        </div>

        {/* Live Queue */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Waiting Queue</span>
            <div className="rounded-[12px] bg-[#FF9500]/10 p-2 text-[#FF9500] dark:text-[#FF9F0A]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            {metrics.waitingCount} <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">Waiting</span>
          </div>
          <div className="mt-2.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
            Avg. wait time: <strong className="text-[#1D1D1F] dark:text-white">{metrics.avgWaitMins} mins</strong>
          </div>
        </div>

        {/* Collections */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Collections</span>
            <div className="rounded-[12px] bg-[#34C759]/10 p-2 text-[#34C759] dark:text-[#30D158]">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            ₹{metrics.grossCollections.toLocaleString("en-IN")}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-xs text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[#34C759] dark:text-[#30D158] font-semibold">₹{metrics.upiCollections.toLocaleString("en-IN")} UPI</span>
            <span>•</span>
            <span className="font-semibold text-[#1D1D1F] dark:text-white">₹{metrics.cashCollections.toLocaleString("en-IN")} Cash</span>
          </div>
        </div>

        {/* Real Net Profit Margin */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Net Margin</span>
            <div className="rounded-[12px] bg-[#00A389]/10 p-2 text-[#00A389] dark:text-[#30D1BE]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            {metrics.marginPct}%
          </div>
          <div className="mt-2.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
            Net In-hand after rent & staff
          </div>
        </div>
      </div>

      {/* 2. CHAMBER STATUS OVERVIEW */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chamber 1 */}
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                Chamber 1 • Dermatology
              </span>
              <h3 className="mt-2.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">Dr. Rahul Sharma</h3>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">MD (Derm) • Reg: UKMC-8942-2012</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[#30D158]/10 px-2.5 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
              <span className="h-2 w-2 rounded-full bg-[#30D158] animate-ping"></span>
              In Consultation
            </span>
          </div>

          <div className="mt-4 rounded-[16px] bg-[#ECEEF2]/70 p-3.5 dark:bg-[#2C2C2E]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#86868B] dark:text-[#8E8E93]">Current Patient:</span>
              <span className="font-bold text-[#1D1D1F] dark:text-white">
                {activeConsultation?.patient_name ? `${activeConsultation.patient_name} (Token #${activeConsultation.token_number})` : "Priya Singh (Token #2)"}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#8E8E93]">
              <span>Provisional Dx: Allergic Contact Dermatitis</span>
              <span className="font-mono">In Chamber: 8 mins</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link
              href={`/dashboard/consult/${activeConsultation?.appointment_number || "APT-DERMA-102"}`}
              className="flex-1 rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              Open Consultation Studio ℞
            </Link>
            <Link
              href="/dashboard/chambers"
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.12] dark:bg-[#2C2C2E] dark:text-white"
            >
              Chamber Queue
            </Link>
          </div>
        </div>

        {/* Chamber 2 */}
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                Chamber 2 • Dental Care
              </span>
              <h3 className="mt-2.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">Dr. Aditi Joshi</h3>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">MDS (Endodontics) • UDC-4120-2016</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-[#30D158]/10 px-2.5 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
              <span className="h-2 w-2 rounded-full bg-[#30D158] animate-ping"></span>
              In Consultation
            </span>
          </div>

          <div className="mt-4 rounded-[16px] bg-[#ECEEF2]/70 p-3.5 dark:bg-[#2C2C2E]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#86868B] dark:text-[#8E8E93]">Current Patient:</span>
              <span className="font-bold text-[#1D1D1F] dark:text-white">Kavita Joshi (Token #4)</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#8E8E93]">
              <span>Provisional Dx: Deep Dentinal Caries (#36)</span>
              <span className="font-mono">In Chamber: 14 mins</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Link
              href="/dashboard/chambers"
              className="flex-1 rounded-full bg-[#00A389] py-2.5 text-center text-xs font-bold text-white shadow-apple-sm hover:bg-[#008772] active:scale-95 transition"
            >
              Open Dental Chamber 🦷
            </Link>
            <Link
              href="/dashboard/chambers"
              className="rounded-full border border-black/[0.08] bg-white px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.12] dark:bg-[#2C2C2E] dark:text-white"
            >
              Chamber Queue
            </Link>
          </div>
        </div>
      </div>

      {/* 3. LIVE PATIENT OPD QUEUE TABLE (APPLE GROUPED LIST) */}
      <div className="rounded-[24px] border border-black/[0.06] bg-white shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] overflow-hidden">
        <div className="p-5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white tracking-tight">Live OPD Patient Flow</h2>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">Real-time status across both consulting chambers</p>
          </div>
          <Link
            href="/dashboard/desk"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.12] dark:bg-[#2C2C2E] dark:text-white"
          >
            <UserCheck className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            Launch Full Desk Console
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECEEF2]/60 border-b border-black/[0.05] text-[#86868B] dark:bg-[#2C2C2E]/60 dark:border-white/[0.06] dark:text-[#8E8E93]">
              <tr>
                <th className="px-6 py-3 font-semibold">Token</th>
                <th className="px-6 py-3 font-semibold">Patient Name</th>
                <th className="px-6 py-3 font-semibold">Assigned Chamber</th>
                <th className="px-6 py-3 font-semibold">Arrival Time</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Payment</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {activeQueue.map((pt) => (
                <tr key={pt.token} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition">
                  <td className="px-6 py-3.5 font-bold font-mono text-[#1D1D1F] dark:text-white">
                    #{pt.token}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-[#1D1D1F] dark:text-white">{pt.patient_name}</div>
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">{pt.phone}</div>
                  </td>
                  <td className="px-6 py-3.5 text-[#86868B] dark:text-[#8E8E93]">
                    {pt.doctor}
                  </td>
                  <td className="px-6 py-3.5 text-[#86868B] dark:text-[#8E8E93] font-mono text-[11px]">
                    {pt.time}
                  </td>
                  <td className="px-6 py-3.5">
                    {pt.status === "in_consultation" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#30D158]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#34C759] dark:text-[#30D158]">
                        In Chamber
                      </span>
                    ) : pt.status === "waiting" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#FF9500] dark:text-[#FF9F0A]">
                        Waiting in OPD
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-block font-semibold text-[11px] ${
                      pt.payment.includes("Paid") ? "text-[#34C759] dark:text-[#30D158]" : "text-[#FF9500] dark:text-[#FF9F0A]"
                    }`}>
                      ₹{pt.fee} • {pt.payment}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={pt.status === "in_consultation" ? `/dashboard/consult/${pt.appointment_number || `APT-${pt.token}`}` : `/dashboard/chambers`}
                      className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] font-semibold text-[#1D1D1F] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] transition cursor-pointer"
                    >
                      {pt.status === "in_consultation" ? "Open ℞ Pad" : "Call Next"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
