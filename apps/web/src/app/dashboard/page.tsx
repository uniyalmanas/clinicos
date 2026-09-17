"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  Stethoscope, 
  UserCheck, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Volume2, 
  CheckCircle2, 
  Users, 
  QrCode, 
  FileText,
  Sparkles,
  Phone,
  IndianRupee,
  ShieldCheck,
  Pill
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [activeQueue, setActiveQueue] = useState([
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
    },
    {
      token: 4,
      patient_name: "Kavita Joshi",
      phone: "+91 98765 11111",
      doctor: "Dr. Aditi Joshi (Chamber 2)",
      status: "in_consultation",
      time: "11:00 AM",
      fee: 400,
      payment: "UPI Paid"
    },
    {
      token: 5,
      patient_name: "Master Aarav Sethi",
      phone: "+91 98765 22222",
      doctor: "Dr. Vikram Sethi (Visiting)",
      status: "waiting",
      time: "11:15 AM",
      fee: 500,
      payment: "Cash Pending"
    }
  ]);

  return (
    <div className="space-y-6">
      {/* 1. TOP METRIC STATS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Footfall */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#1E2638] dark:bg-[#111726] transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today&apos;s Footfall</span>
            <div className="rounded-xl bg-teal-50 p-2.5 text-brand-600 dark:bg-teal-950/60 dark:text-teal-300 dark:border dark:border-teal-800/40">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            14 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Patients</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+18% higher than last Thursday</span>
          </div>
        </div>

        {/* Live Queue */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#1E2638] dark:bg-[#111726] transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Waiting Queue</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            3 <span className="text-xs font-normal text-slate-500 dark:text-slate-400">In Waiting Area</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Avg. wait time: <strong className="text-slate-700 dark:text-slate-200">11 mins</strong>
          </div>
        </div>

        {/* Collections */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#1E2638] dark:bg-[#111726] transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Collections</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            ₹7,800
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹6,000 UPI</span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-300 font-semibold">₹1,800 Cash</span>
          </div>
        </div>

        {/* Real Net Profit Margin */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#1E2638] dark:bg-[#111726] transition hover:shadow-md">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Net Margin</span>
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/40">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
            61.4%
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Net In-hand after rent, staff & power
          </div>
        </div>
      </div>

      {/* 2. CHAMBER STATUS OVERVIEW */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chamber 1 */}
        <div className="rounded-2xl border border-teal-200/80 bg-white p-6 shadow-sm dark:border-teal-900/40 dark:bg-[#111726]">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 dark:border dark:border-teal-800/40">
                Chamber 1 • Dermatology
              </span>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-white">Dr. Rahul Sharma</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">MD (Derm) • NMC Reg: UKMC-8942-2012</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/40">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Consulting Now
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-[#161F36] dark:border dark:border-[#232E48]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Current Patient:</span>
              <span className="font-bold text-slate-900 dark:text-white">Priya Singh (Token #2)</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Provisional Dx: Allergic Contact Dermatitis</span>
              <span className="font-mono">In Chamber: 8 mins</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Link
              href="/dashboard/consult/APT-DERMA-102"
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition shadow-brand-600/20"
            >
              Open Consultation Pad ℞
            </Link>
            <Link
              href="/dashboard/chambers"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-200 dark:hover:bg-[#1C2846]"
            >
              View Chamber Queue
            </Link>
          </div>
        </div>

        {/* Chamber 2 */}
        <div className="rounded-2xl border border-blue-200/80 bg-white p-6 shadow-sm dark:border-blue-900/40 dark:bg-[#111726]">
          <div className="flex items-start justify-between">
            <div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 dark:border dark:border-blue-800/40">
                Chamber 2 • Dental Care
              </span>
              <h3 className="mt-2 text-lg font-black text-slate-900 dark:text-white">Dr. Aditi Joshi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">MDS (Endodontics) • UDC-4120-2016</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/40">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              Consulting Now
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-[#161F36] dark:border dark:border-[#232E48]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Current Patient:</span>
              <span className="font-bold text-slate-900 dark:text-white">Kavita Joshi (Token #4)</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Provisional Dx: Deep Dentinal Caries (#36)</span>
              <span className="font-mono">In Chamber: 14 mins</span>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Link
              href="/dashboard/chambers"
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Open Dental Chamber 🦷
            </Link>
            <Link
              href="/dashboard/chambers"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-200 dark:hover:bg-[#1C2846]"
            >
              View Chamber Queue
            </Link>
          </div>
        </div>
      </div>

      {/* 3. LIVE PATIENT OPD QUEUE TABLE */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-[#1E2638] dark:bg-[#111726] overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-[#1E2638] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Live OPD Patient Flow</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Real-time status across both consulting chambers</p>
          </div>
          <Link
            href="/dashboard/desk"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-200 dark:hover:bg-[#1C2846]"
          >
            <UserCheck className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            Launch Full Desk Console
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 dark:bg-[#0E1422] dark:border-[#1E2638] dark:text-slate-400">
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
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2638]">
              {activeQueue.map((pt) => (
                <tr key={pt.token} className="hover:bg-slate-50/50 dark:hover:bg-[#161F36]/60 transition">
                  <td className="px-6 py-3.5 font-bold font-mono text-slate-900 dark:text-white">
                    #{pt.token}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{pt.patient_name}</div>
                    <div className="text-[10px] text-slate-400">{pt.phone}</div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">
                    {pt.doctor}
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    {pt.time}
                  </td>
                  <td className="px-6 py-3.5">
                    {pt.status === "in_consultation" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/40">
                        In Chamber
                      </span>
                    ) : pt.status === "waiting" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/40">
                        Waiting in OPD
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-[#1E2638] dark:text-slate-300">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-block font-semibold text-[11px] ${
                      pt.payment.includes("Paid") ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      ₹{pt.fee} • {pt.payment}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={pt.token === 2 ? "/dashboard/consult/APT-DERMA-102" : "/dashboard/desk"}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-[#1E2638] dark:text-slate-200 dark:hover:bg-[#28344D] transition"
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
