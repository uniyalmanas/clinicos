"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Building2, 
  UserCheck, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  FileText, 
  Sparkles,
  Zap,
  IndianRupee,
  BarChart3
} from "lucide-react";

export default function InteractivePlayground() {
  const [activeTab, setActiveTab] = useState<"doctor" | "desk" | "patient" | "expenses" | "admin">("doctor");
  const [chimePlaying, setChimePlaying] = useState(false);

  // Web Audio chime test
  const playChime = () => {
    try {
      setChimePlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 880.00 Hz (A5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);

      setTimeout(() => setChimePlaying(false), 900);
    } catch (e) {
      console.error(e);
      setChimePlaying(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-6xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
          <Sparkles className="h-3.5 w-3.5" /> Interactive Live Sandbox
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
          Test Drive the 5 Core ClinicOS Modules
        </h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Switch roles below to experience how DocSphere runs an Indian clinic end-to-end
        </p>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-[#1E2638] dark:bg-[#0E1422]">
        <button
          onClick={() => setActiveTab("doctor")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "doctor"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#161F36]"
          }`}
        >
          <Stethoscope className="h-4 w-4" /> Doctor Chamber
        </button>

        <button
          onClick={() => setActiveTab("desk")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "desk"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#161F36]"
          }`}
        >
          <Building2 className="h-4 w-4" /> Reception Counter
        </button>

        <button
          onClick={() => setActiveTab("patient")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "patient"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#161F36]"
          }`}
        >
          <Smartphone className="h-4 w-4" /> Patient WhatsApp Locker
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "expenses"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#161F36]"
          }`}
        >
          <IndianRupee className="h-4 w-4" /> Clinic P&L Ledger
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "admin"
              ? "bg-brand-600 text-white shadow-md shadow-brand-600/20"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#161F36]"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Council & SaaS MRR
        </button>
      </div>

      {/* TAB CONTENT CARDS */}
      <div className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-[#1E2638] dark:bg-[#111726] sm:p-8">
        {/* TAB 1: DOCTOR CHAMBER */}
        {activeTab === "doctor" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  Chamber Mode
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  30-Second Prescription Studio & Active OPD Chamber
                </h3>
                <p className="text-xs text-slate-500">
                  Dr. Rahul Sharma (MD Dermatology) • Derma Care Dehradun
                </p>
              </div>
              <Link
                href="/doctor/consult/APT-DERMA-102"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Open Full Doctor Chamber <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Active Patient in Chamber</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Token #2 (In Consultation)
                  </span>
                </div>
                <div className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                  Priya Singh (24Y / Female)
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Symptoms: Itchy red rashes on forearms and neck for 3 days
                </p>
                <div className="mt-3 flex gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900">BP: 116/74</span>
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900">Pulse: 76 bpm</span>
                  <span className="rounded bg-white px-2 py-1 border border-slate-200 dark:border-slate-800 dark:bg-slate-900">Temp: 98.6 °F</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="text-xs font-semibold text-slate-500">1-Click Specialty Clinical Kits</div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    Acne Vulgaris Kit
                  </span>
                  <span className="rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Allergic Dermatitis
                  </span>
                  <span className="rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Tinea Corporis
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> NMC UPPERCASE Generic Compliance
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-600 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" /> SHA-256 Tamper-Proof Cryptographic Hash
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECEPTION COUNTER */}
        {activeTab === "desk" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Reception Console
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Front-Desk PWA: Walk-In Token Dispatch & Audio Chime
                </h3>
                <p className="text-xs text-slate-500">
                  Pooja Verma (Reception Desk) • Derma Care Skin & Laser Centre
                </p>
              </div>
              <Link
                href="/clinic/desk"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Open Full Reception Desk <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-5 dark:border-brand-900/50 dark:bg-brand-950/20">
                <span className="text-xs font-semibold text-brand-800 dark:text-brand-300">Counter Audio Chime</span>
                <div className="mt-2">
                  <button
                    onClick={playChime}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 active:scale-95 transition"
                  >
                    <Volume2 className={`h-4 w-4 ${chimePlaying ? "animate-bounce" : ""}`} />
                    {chimePlaying ? "Playing Chime..." : "Play OPD Call Bell (D5 ➡️ A5)"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  Web Audio API synthesizer rings counter speaker when Token is called.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-500">10s Walk-In Fast Admission</span>
                <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div>Name: <strong>Kavita Joshi</strong></div>
                  <div>Phone: <strong>+91 98765 11111</strong></div>
                  <div>Assigned: <strong className="text-brand-600">Token #4 (Walk-In)</strong></div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-500">Cash & UPI Soundbox Reconciliation</span>
                <div className="mt-2 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div>Total Collected Today: <strong>₹2,400</strong></div>
                  <div>UPI (PhonePe/Paytm): <strong className="text-emerald-600">₹1,800 (3 Txn)</strong></div>
                  <div>Counter Cash: <strong>₹600 (1 Txn)</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PATIENT WHATSAPP LOCKER */}
        {activeTab === "patient" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Patient WhatsApp Delivery
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Passwordless WhatsApp Prescription Locker & Dosage Reminders
                </h3>
                <p className="text-xs text-slate-500">
                  Zero app downloads. Secure direct link sent via WhatsApp.
                </p>
              </div>
              <Link
                href="/p/RX-2026-09-0014"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                View Live Patient Locker <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 dark:border-emerald-950 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Prescription #RX-2026-09-0014</span>
                  <span>14, Rajpur Road</span>
                </div>
                <div className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                  Dr. Rahul Sharma • Derma Care Skin & Laser
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <span className="font-bold">1. TAB CETIRIZINE 10MG</span> (Night after food)
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <span className="font-bold">2. CAP DOXYCYCLINE 100MG</span> (Twice daily after meal)
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 space-y-3">
                <div className="text-xs font-semibold text-slate-500">Convenience Features for Patient</div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>⏰ <strong>Medication Alarms</strong>: 1-tap add to Google Calendar/Reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-600" />
                    <span>💊 <strong>Partner Pharmacy Delivery</strong>: Forward generic list to local Dehradun chemist</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span>📄 <strong>Download A4 PDF</strong>: Always available for insurance or future consults</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLINIC EXPENSES */}
        {activeTab === "expenses" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  Clinic Economics
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Clinic Cashflow & Real Net Profit Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Revenue is vanity, real net in-hand profit is sanity.
                </p>
              </div>
              <Link
                href="/clinic/expenses"
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Open Clinic P&L Ledger <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-500">Gross Collections</span>
                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">₹50,400</div>
                <div className="text-[11px] text-slate-500 mt-1">Cash + Soundbox UPI (Current Month)</div>
              </div>

              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-950 dark:bg-rose-950/20">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Total Operating Expenses</span>
                <div className="mt-2 text-2xl font-bold text-rose-600">₹20,650</div>
                <div className="text-[11px] text-rose-500 mt-1">UPCL power bill, gloves, staff salary</div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-950 dark:bg-emerald-950/20">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Real In-Hand Net Profit</span>
                <div className="mt-2 text-2xl font-bold text-emerald-600">₹29,750</div>
                <div className="text-[11px] text-emerald-600 mt-1">59.0% Net Profit Margin</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPERADMIN & FOUNDER */}
        {activeTab === "admin" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
                  Founder Command Hub
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  State Medical Council Verifications & SaaS MRR Engine
                </h3>
                <p className="text-xs text-slate-500">
                  National Medical Commission compliance and tenant recurring billing.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin/verifications"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <ShieldCheck className="h-4 w-4 text-red-600" /> Verifications
                </Link>
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                >
                  <BarChart3 className="h-4 w-4" /> SaaS MRR
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-500">Verified Paid MRR</span>
                <div className="mt-2 text-2xl font-bold text-emerald-600">₹2,997 / mo</div>
                <div className="text-[11px] text-slate-500 mt-1">ARR Run Rate: ₹35,964</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-500">Medical Council Badge</span>
                <div className="mt-2 text-2xl font-bold text-brand-600">100% Verified</div>
                <div className="text-[11px] text-slate-500 mt-1">Uttarakhand Medical Council (UK-MC)</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <span className="text-xs font-semibold text-slate-500">Software Gross Margin</span>
                <div className="mt-2 text-2xl font-bold text-purple-600">&gt; 98.5%</div>
                <div className="text-[11px] text-slate-500 mt-1">AI compute token cost ~₹17.50</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
