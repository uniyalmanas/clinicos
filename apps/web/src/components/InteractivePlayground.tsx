"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  ArrowRight, 
  Volume2, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Sparkles,
  Zap,
  IndianRupee,
  BarChart3
} from "lucide-react";

export default function InteractivePlayground() {
  const [activeTab, setActiveTab] = useState<"doctor" | "desk" | "patient" | "expenses" | "admin">("doctor");
  const [chimePlaying, setChimePlaying] = useState(false);

  // Web Audio chime test (Apple-grade dual sine oscillator)
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
        <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3.5 py-1 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white">
          <Sparkles className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
          <span>Interactive Live Sandbox</span>
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white sm:text-3xl">
          Test Drive the 5 Core ClinicOS Modules
        </h2>
        <p className="mt-1.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
          Experience how DocSphere runs an Indian clinic end-to-end with zero lag
        </p>
      </div>

      {/* APPLE SEGMENTED CONTROL TABS */}
      <div className="flex overflow-x-auto rounded-full border border-black/[0.06] bg-black/[0.03] p-1 shadow-inner dark:border-white/[0.08] dark:bg-white/[0.06]">
        <button
          onClick={() => setActiveTab("doctor")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "doctor"
              ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <Stethoscope className="h-3.5 w-3.5 text-[#00A389] dark:text-[#30D1BE]" /> Doctor Chamber
        </button>

        <button
          onClick={() => setActiveTab("desk")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "desk"
              ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" /> Reception Desk
        </button>

        <button
          onClick={() => setActiveTab("patient")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "patient"
              ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5 text-[#FF9500] dark:text-[#FF9F0A]" /> WhatsApp Locker
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "expenses"
              ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <IndianRupee className="h-3.5 w-3.5 text-[#30D158]" /> Clinic P&L
        </button>

        <button
          onClick={() => setActiveTab("admin")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "admin"
              ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-[#AF52DE]" /> Council & MRR
        </button>
      </div>

      {/* SQUIRCLE CARD CONTAINER */}
      <div className="mt-4 rounded-[28px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] sm:p-8">
        {/* TAB 1: DOCTOR CHAMBER */}
        {activeTab === "doctor" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.05] pb-4 dark:border-white/[0.06]">
              <div>
                <span className="rounded-full bg-[#00A389]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00A389] dark:bg-[#00A389]/20 dark:text-[#30D1BE]">
                  Chamber Mode
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  30-Second Prescription Studio & Active OPD Chamber
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Dr. Rahul Sharma (MD Dermatology) • Derma Care Dehradun
                </p>
              </div>
              <Link
                href="/dashboard/consult/APT-DERMA-102"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
              >
                Open Full Doctor Chamber <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Active Patient in Chamber</span>
                  <span className="rounded-full bg-[#30D158]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#30D158] dark:bg-[#30D158]/20">
                    Token #2 (In Consultation)
                  </span>
                </div>
                <div className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Priya Singh (24Y / Female)
                </div>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Symptoms: Itchy red rashes on forearms and neck for 3 days
                </p>
                <div className="mt-3 flex gap-2 text-[11px] font-mono text-[#1D1D1F] dark:text-white">
                  <span className="rounded-xl bg-white px-2.5 py-1 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08]">BP: 116/74</span>
                  <span className="rounded-xl bg-white px-2.5 py-1 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08]">Pulse: 76 bpm</span>
                  <span className="rounded-xl bg-white px-2.5 py-1 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08]">Temp: 98.6 °F</span>
                </div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <div className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">1-Click Specialty Clinical Kits</div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#00A389]/15 px-3 py-1 text-xs font-bold text-[#00A389] dark:bg-[#00A389]/20 dark:text-[#30D1BE]">
                    Acne Vulgaris Kit
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1D1D1F] border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08] dark:text-[#8E8E93]">
                    Allergic Dermatitis
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1D1D1F] border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08] dark:text-[#8E8E93]">
                    Tinea Corporis
                  </span>
                </div>
                <div className="border-t border-black/[0.05] dark:border-white/[0.06] pt-3 text-xs text-[#86868B] dark:text-[#8E8E93] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#30D158] font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> NMC UPPERCASE Generic Compliance
                  </div>
                  <div className="flex items-center gap-1.5 text-[#0071E3] dark:text-[#2997FF] font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> SHA-256 Tamper-Proof Cryptographic Hash
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECEPTION COUNTER */}
        {activeTab === "desk" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.05] pb-4 dark:border-white/[0.06]">
              <div>
                <span className="rounded-full bg-[#0071E3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0071E3] dark:bg-[#0071E3]/20 dark:text-[#2997FF]">
                  Reception Console
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  Front-Desk PWA: Walk-In Token Dispatch & Audio Chime
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Pooja Verma (Reception Desk) • Derma Care Skin & Laser Centre
                </p>
              </div>
              <Link
                href="/dashboard/desk"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
              >
                Open Full Reception Desk <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#0071E3] dark:text-[#2997FF]">Counter Audio Chime</span>
                <div className="mt-3">
                  <button
                    onClick={playChime}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
                  >
                    <Volume2 className={`h-4 w-4 ${chimePlaying ? "animate-bounce" : ""}`} />
                    {chimePlaying ? "Playing Chime..." : "Ring Call Bell (D5 ➡️ A5)"}
                  </button>
                </div>
                <p className="mt-2.5 text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                  Web Audio API synthesizer rings counter speaker when Token is called.
                </p>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">10s Walk-In Fast Admission</span>
                <div className="mt-2.5 text-xs text-[#1D1D1F] dark:text-white space-y-1">
                  <div>Name: <strong>Kavita Joshi</strong></div>
                  <div>Phone: <strong>+91 98765 11111</strong></div>
                  <div>Assigned: <strong className="text-[#0071E3] dark:text-[#2997FF]">Token #4 (Walk-In)</strong></div>
                </div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Soundbox Reconciliation</span>
                <div className="mt-2.5 text-xs text-[#1D1D1F] dark:text-white space-y-1">
                  <div>Total Collected Today: <strong>₹2,400</strong></div>
                  <div>UPI (PhonePe/Paytm): <strong className="text-[#30D158]">₹1,800 (3 Txn)</strong></div>
                  <div>Counter Cash: <strong>₹600 (1 Txn)</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PATIENT WHATSAPP LOCKER */}
        {activeTab === "patient" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.05] pb-4 dark:border-white/[0.06]">
              <div>
                <span className="rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF9500] dark:bg-[#FF9F0A]/20 dark:text-[#FF9F0A]">
                  Patient WhatsApp Delivery
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  Passwordless WhatsApp Prescription Locker & Dosage Reminders
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Zero app downloads. Secure direct link sent via WhatsApp.
                </p>
              </div>
              <Link
                href="/patient/portal"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
              >
                View Live Patient Locker <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-semibold text-[#00A389] dark:text-[#30D1BE]">
                  <span>Prescription #RX-2026-09-0014</span>
                  <span>14, Rajpur Road</span>
                </div>
                <div className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">
                  Dr. Rahul Sharma • Derma Care Skin & Laser
                </div>
                <div className="mt-3 space-y-2 text-xs text-[#1D1D1F] dark:text-white">
                  <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08]">
                    <span className="font-bold">1. TAB CETIRIZINE 10MG</span> (Night after food)
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08]">
                    <span className="font-bold">2. CAP DOXYCYCLINE 100MG</span> (Twice daily after meal)
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <div className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Convenience Features for Patient</div>
                <ul className="space-y-2.5 text-xs text-[#1D1D1F] dark:text-white">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>⏰ <strong>Medication Alarms</strong>: 1-tap add to Google Calendar/Reminders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
                    <span>💊 <strong>Partner Pharmacy Delivery</strong>: Forward generic list to local Dehradun chemist</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#00A389] dark:text-[#30D1BE]" />
                    <span>📄 <strong>Download A4 PDF</strong>: Always available for insurance or future consults</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLINIC EXPENSES */}
        {activeTab === "expenses" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.05] pb-4 dark:border-white/[0.06]">
              <div>
                <span className="rounded-full bg-[#AF52DE]/10 px-2.5 py-0.5 text-xs font-semibold text-[#AF52DE]">
                  Clinic Economics
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  Clinic Cashflow & Real Net Profit Ledger
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Revenue is vanity, real net in-hand profit is sanity.
                </p>
              </div>
              <Link
                href="/clinic/expenses"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
              >
                Open Clinic P&L Ledger <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Gross Collections</span>
                <div className="mt-2 text-2xl font-bold font-mono text-[#1D1D1F] dark:text-white">₹50,400</div>
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">Cash + Soundbox UPI (Current Month)</div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A]">Total Operating Expenses</span>
                <div className="mt-2 text-2xl font-bold font-mono text-[#FF3B30] dark:text-[#FF453A]">₹20,650</div>
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">UPCL power bill, gloves, staff salary</div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#30D158]">Real In-Hand Net Profit</span>
                <div className="mt-2 text-2xl font-bold font-mono text-[#30D158]">₹29,750</div>
                <div className="text-[11px] text-[#30D158] mt-1 font-medium">59.0% Net Profit Margin</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SUPERADMIN & FOUNDER */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/[0.05] pb-4 dark:border-white/[0.06]">
              <div>
                <span className="rounded-full bg-[#FF3B30]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FF3B30] dark:text-[#FF453A]">
                  Founder Command Hub
                </span>
                <h3 className="mt-1.5 text-lg font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  State Medical Council Verifications & SaaS MRR Engine
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  National Medical Commission compliance and tenant recurring billing.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/admin/verifications"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.02] dark:border-white/[0.12] dark:bg-[#2C2C2E] dark:text-white active:scale-95 transition"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#FF3B30]" /> Verifications
                </Link>
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> SaaS MRR
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Verified Paid MRR</span>
                <div className="mt-2 text-2xl font-bold font-mono text-[#30D158]">₹2,997 / mo</div>
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">ARR Run Rate: ₹35,964</div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Medical Council Badge</span>
                <div className="mt-2 text-2xl font-bold font-mono text-[#0071E3] dark:text-[#2997FF]">100% Verified</div>
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">Uttarakhand Medical Council (UK-MC)</div>
              </div>

              <div className="rounded-[20px] bg-[#ECEEF2]/60 p-5 dark:bg-[#2C2C2E]/60 border border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Software Gross Margin</span>
                <div className="mt-2 text-2xl font-bold font-mono text-[#AF52DE]">&gt; 98.5%</div>
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1">AI compute token cost ~₹17.50</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
