"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Search,
  Filter,
  ArrowRight
} from "lucide-react";

export default function DashboardPharmacyPage() {
  const [orders, setOrders] = useState([
    {
      order_id: "ORD-PHARM-881",
      prescription_number: "RX-2026-09-0014",
      patient_name: "Amit Rawat",
      patient_phone: "+91 91234 56780",
      partner_name: "Apollo Pharmacy (Rajpur Road Hub)",
      type: "pharmacy",
      items_summary: "DOXYCYCLINE 100MG (10 caps), TRETINOIN 0.05% CREAM (1 tube)",
      order_status: "ready_for_pickup",
      time: "10:40 AM Today",
      amount_est: 340
    },
    {
      order_id: "ORD-LAB-912",
      prescription_number: "RX-2026-09-0014",
      patient_name: "Amit Rawat",
      patient_phone: "+91 91234 56780",
      partner_name: "Dr. Lal PathLabs (Survey Chowk)",
      type: "diagnostic",
      items_summary: "Complete Blood Count (CBC), Liver Function Test (LFT)",
      order_status: "sample_collected",
      time: "09:30 AM Today",
      amount_est: 950
    },
    {
      order_id: "ORD-PHARM-882",
      prescription_number: "RX-2026-09-0021",
      patient_name: "Priya Singh",
      patient_phone: "+91 91234 56781",
      partner_name: "Sanjeevani Medicos (EC Road)",
      type: "pharmacy",
      items_summary: "CETIRIZINE 10MG (1 strip), MOMETASONE 0.1% CREAM",
      order_status: "dispatched",
      time: "11:15 AM Today",
      amount_est: 185
    }
  ]);

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(o => o.order_id === orderId ? { ...o, order_status: newStatus } : o));
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Pharmacy & Diagnostic Partner Orders
          </h1>
          <p className="text-xs text-slate-500">
            Fulfill generic medications and home lab sample collections across Dehradun with 0% commissions
          </p>
        </div>

        <Link
          href="/pharmacy/console"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <Pill className="h-4 w-4" />
          <span>Launch Partner Chemist Terminal</span>
          <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </Link>
      </div>

      {/* 2. PARTNERS OVERVIEW */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-950 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Apollo Pharmacy (Rajpur Road)</div>
              <div className="text-[11px] text-slate-500">Walk-In & 30m Doorstep Delivery</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-emerald-600 font-semibold border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span>● Connected Live</span>
            <span>4 Orders Fulfilled Today</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-950 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Microscope className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Dr. Lal PathLabs (Survey Chowk)</div>
              <div className="text-[11px] text-slate-500">NABL Accredited Diagnostics</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-blue-600 font-semibold border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span>● Connected Live</span>
            <span>2 Samples Collected</span>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-white p-5 shadow-sm dark:border-purple-950 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950 dark:text-purple-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">Zero Aggregator Cuts</div>
              <div className="text-[11px] text-slate-500">100% Retained by Chemist & Patient</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-purple-600 font-semibold border-t border-slate-100 pt-2.5 dark:border-slate-800">
            <span>UPPERCASE Generic Compliance</span>
            <span>NMC Approved</span>
          </div>
        </div>
      </div>

      {/* 3. ORDERS QUEUE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Fulfillment Streams ({orders.length})
          </span>
          <span className="text-xs text-slate-500">
            Updated live via WhatsApp Webhook
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Partner</th>
                <th className="px-5 py-3 font-semibold">Prescribed Items</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Chemist Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map(ord => (
                <tr key={ord.order_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {ord.order_id}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{ord.patient_name}</div>
                    <div className="text-[10px] text-slate-400">{ord.patient_phone}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                      {ord.type === "pharmacy" ? (
                        <Pill className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Microscope className="h-3.5 w-3.5 text-blue-600" />
                      )}
                      <span>{ord.partner_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{ord.time}</div>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                    {ord.items_summary}
                  </td>
                  <td className="px-5 py-3.5">
                    {ord.order_status === "ready_for_pickup" ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Ready for Counter Pickup
                      </span>
                    ) : ord.order_status === "sample_collected" ? (
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        Sample In Transit to Lab
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Dispatched to Patient
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {ord.order_status !== "ready_for_pickup" && (
                        <button
                          onClick={() => updateOrderStatus(ord.order_id, "ready_for_pickup")}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                          Mark Ready
                        </button>
                      )}
                      <Link
                        href={`/p/${ord.prescription_number}`}
                        target="_blank"
                        className="rounded-lg border border-slate-200 p-1 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        title="View Original Prescription"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
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
