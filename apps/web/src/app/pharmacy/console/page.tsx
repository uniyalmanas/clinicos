"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Pill, 
  Microscope, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Phone, 
  ExternalLink, 
  MapPin, 
  ShieldCheck, 
  ArrowLeft, 
  Search, 
  Check, 
  Sparkles,
  Printer,
  FileText
} from "lucide-react";

export default function PharmacyConsolePage() {
  const [orders, setOrders] = useState([
    {
      order_id: "ORD-PHARM-881",
      prescription_number: "RX-2026-09-0014",
      patient_name: "Amit Rawat",
      patient_phone: "+91 91234 56780",
      doctor_name: "Dr. Rahul Sharma (MD Derm)",
      doctor_council_reg: "UKMC-8942-2012",
      clinic_name: "Derma Care Skin & Laser Centre (14, Rajpur Road)",
      items: [
        { name: "CAP DOXYCYCLINE 100MG", qty: "10 capsules", instructions: "1-0-1 After Food" },
        { name: "TRETINOIN 0.05% CREAM", qty: "1 tube (20g)", instructions: "0-0-1 Night" },
        { name: "CLINDAMYCIN 1% GEL", qty: "1 tube (15g)", instructions: "1-0-0 Morning" }
      ],
      order_status: "ready_for_pickup",
      signature_hash: "d384b6f79a9e1fc710e",
      total_inr: 340,
      timestamp: "10:40 AM Today"
    },
    {
      order_id: "ORD-PHARM-882",
      prescription_number: "RX-2026-09-0021",
      patient_name: "Priya Singh",
      patient_phone: "+91 91234 56781",
      doctor_name: "Dr. Rahul Sharma (MD Derm)",
      doctor_council_reg: "UKMC-8942-2012",
      clinic_name: "Derma Care Skin & Laser Centre (14, Rajpur Road)",
      items: [
        { name: "TAB CETIRIZINE 10MG", qty: "10 tablets", instructions: "0-0-1 Night" },
        { name: "CLINDAMYCIN 1% GEL", qty: "1 tube (15g)", instructions: "1-0-1 Twice Daily" }
      ],
      order_status: "pending_assembly",
      signature_hash: "a99c42b10ef7831d490",
      total_inr: 185,
      timestamp: "11:15 AM Today"
    }
  ]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const updateStatus = (orderId: string, nextStatus: string, label: string) => {
    setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: nextStatus } : o));
    setToastMsg(`Order #${orderId}: ${label}`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] flex flex-col">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-[#1E2638] dark:bg-[#0E1422]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#18233C] dark:text-slate-400">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Partner Chemist Console</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/40">
                    Apollo Pharmacy Rajpur Road
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Zero-Commission Generic Medicine Fulfillment Hub</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* TOAST ALERT */}
        {toastMsg && (
          <div className="rounded-2xl bg-slate-900 p-4 text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* METRICS */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#1E2638] dark:bg-[#111726]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Incoming Orders Today</span>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{orders.length}</div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">From Derma Care & Smile Craft clinics</p>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-[#111726]">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Ready for Counter Pickup</span>
            <div className="mt-2 text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {orders.filter(o => o.order_status === "ready_for_pickup").length}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Patients notified via WhatsApp</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#1E2638] dark:bg-[#111726]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NMC Generic Compliance</span>
            <div className="mt-2 text-3xl font-black text-brand-600 dark:text-brand-400">100%</div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All generic molecules verified</p>
          </div>
        </div>

        {/* ORDERS LIST */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-slate-500">
            Pending Prescription Orders
          </h2>

          <div className="space-y-4">
            {orders.map(order => (
              <div
                key={order.order_id}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-[#1E2638] dark:bg-[#111726] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-[#1E2638]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {order.order_id}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 dark:bg-[#1E2638] dark:text-slate-300">
                        Rx #{order.prescription_number}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        order.order_status === "ready_for_pickup"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/40"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/40"
                      }`}>
                        {order.order_status === "ready_for_pickup" ? "Ready for Counter Pickup" : "Awaiting Packaging"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Patient: <strong>{order.patient_name}</strong> ({order.patient_phone}) • Received at {order.timestamp}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Prescribed by {order.doctor_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Reg: {order.doctor_council_reg} • {order.clinic_name}
                    </div>
                  </div>
                </div>

                {/* ITEMS TABLE */}
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-[#161F36] dark:border-[#232E48]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Generic Molecules to Dispense:
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900 dark:text-white font-mono">{item.name}</strong>
                          <span className="text-slate-500 dark:text-slate-400 ml-2 font-normal">({item.instructions})</span>
                        </div>
                        <span className="rounded-lg bg-white px-2.5 py-0.5 font-bold text-slate-700 border border-slate-200 dark:bg-[#0D121D] dark:border-[#1E2638] dark:text-slate-200 font-mono text-[11px]">
                          {item.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SIGNATURE & CHEMIST ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Cryptographic Signature Valid: <strong className="font-mono text-[10px]">{order.signature_hash}</strong></span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(order.order_id, "ready_for_pickup", "Marked Ready for Pickup")}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                    >
                      <Check className="inline h-3.5 w-3.5 mr-1" /> Ready for Pickup
                    </button>
                    <button
                      onClick={() => updateStatus(order.order_id, "dispatched", "Dispatched for Doorstep Delivery")}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-200 dark:hover:bg-[#1C2846]"
                    >
                      <Truck className="inline h-3.5 w-3.5 mr-1" /> Out for Delivery
                    </button>
                    <Link
                      href={`/p/${order.prescription_number}`}
                      target="_blank"
                      className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-300"
                      title="View Verified Prescription"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
