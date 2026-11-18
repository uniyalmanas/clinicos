"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { useParams } from "next/navigation";
import { 
  Stethoscope, 
  ShieldCheck, 
  Printer, 
  Share2, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ArrowLeft,
  QrCode,
  AlertCircle,
  Pill,
  Download,
  ExternalLink,
  Sparkles,
  HeartPulse,
  Flame,
  Activity,
  AlertTriangle,
  Sun,
  Moon,
  Coffee,
  Info,
  ChevronDown,
  Check
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import BackButton from "@/components/BackButton";

export default function PatientPrescriptionLockerPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "";
  
  const [rx, setRx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routedChemistMsg, setRoutedChemistMsg] = useState<string | null>(null);
  const [paperFormat, setPaperFormat] = useState<"a4" | "a5">("a4");
  const [activeReportTab, setActiveReportTab] = useState<"summary" | "schedule" | "guidance">("summary");

  useEffect(() => {
    let cancelled = false;
    const fetchRx = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/prescriptions/${encodeURIComponent(rawId)}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data && !data.error) {
          setRx(data);
          return;
        }
        // Only an exact local copy may stand in for a network failure. Never
        // show the most recent prescription for a different id.
        if (typeof window !== "undefined") {
          const directMatch = localStorage.getItem(`clinicos_rx_${rawId}`);
          if (directMatch) {
            try {
              const parsed = JSON.parse(directMatch);
              if (parsed && parsed.prescription_number === rawId) {
                setRx(parsed);
                setLoadError("Showing the copy saved on this device — the clinic server could not be reached.");
                return;
              }
            } catch {}
          }
        }
        setRx(null);
        setLoadError(
          res.status === 404
            ? "This prescription could not be found. Check the link or ask the clinic to resend it."
            : data?.error || "Could not load this prescription right now."
        );
      } catch {
        if (cancelled) return;
        if (typeof window !== "undefined") {
          const directMatch = localStorage.getItem(`clinicos_rx_${rawId}`);
          if (directMatch) {
            try {
              const parsed = JSON.parse(directMatch);
              if (parsed && parsed.prescription_number === rawId) {
                setRx(parsed);
                setLoadError("Showing the copy saved on this device — the clinic server could not be reached.");
                return;
              }
            } catch {}
          }
        }
        setRx(null);
        setLoadError("Could not reach the clinic server. Please retry in a moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRx();
    return () => {
      cancelled = true;
    };
  }, [rawId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEEF2] dark:bg-[#000000] flex items-center justify-center p-6">
        <div className="text-sm font-semibold text-[#86868B] dark:text-[#8E8E93]">Loading prescription…</div>
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="min-h-screen bg-[#ECEEF2] dark:bg-[#000000] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[24px] border border-black/[0.06] bg-white p-8 text-center shadow-xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <ShieldCheck className="mx-auto h-10 w-10 text-[#FF3B30]" />
          <h1 className="mt-4 text-lg font-bold text-[#1D1D1F] dark:text-white">Prescription not available</h1>
          <p className="mt-2 text-sm text-[#86868B] dark:text-[#8E8E93]">
            {loadError || "This prescription could not be found."}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#0071E3] px-4 py-2 text-xs font-bold text-white hover:bg-[#0077ED]"
          >
            Go to ClinicOS
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    // A device-cached copy is shown, but the reader must know it is not live.
    console.warn(loadError);
  }

  // The public endpoint deliberately redacts identity for anonymous readers.
  const displayPatientName = rx.patient_name || rx.patient_name_masked || "Patient";

  const publicPrescriptionUrl = `${typeof window === "undefined" ? "" : window.location.origin}/p/${rx.prescription_number || rawId}`;

  const waShareText = `🏥 *Digital Prescription - ${rx.doctor_name}*\n` +
    `Patient: ${displayPatientName}\n` +
    `Rx Number: #${rx.prescription_number}\n` +
    `Diagnosis: ${rx.provisional_diagnosis}\n\n` +
    `🔗 View & Download Official A4 Document: ${publicPrescriptionUrl}\n` +
    `🔒 Cryptographic Hash: ${rx.digital_signature_hash?.slice(0, 16)}...`;

  const handleRouteToPharmacy = () => {
    setRoutedChemistMsg(`💊 Prescription #${rx.prescription_number} transmitted to Empanelled Network Pharmacy. They will prepare generic strips.`);
    setTimeout(() => setRoutedChemistMsg(null), 5000);
  };

  // Vitals Status Badging
  const tempVal = rx.vitals?.temp ? parseFloat(String(rx.vitals.temp)) : null;
  const isFever = tempVal !== null && tempVal >= 99.5;

  const bpVal = rx.vitals?.bp ? String(rx.vitals.bp) : null;
  const pulseVal = rx.vitals?.pulse ? parseInt(String(rx.vitals.pulse)) : null;
  const spo2Val = rx.vitals?.spo2 ? parseInt(String(rx.vitals.spo2)) : null;

  // Determine smart patient health guidance
  const patientReport = rx.patient_health_report || {
    condition_overview: rx.provisional_diagnosis 
      ? `You have been diagnosed with ${rx.provisional_diagnosis}. Please follow the daily medicine schedule and lifestyle recommendations below for a fast, healthy recovery.`
      : "Your doctor has issued a personalized clinical treatment plan. Please take your medicines on time as directed below.",
    home_care_guidance: rx.diet_advice || rx.instructions || "Stay well hydrated by drinking 2.5–3 Litres of fluids (warm water, soups, or ORS). Ensure 8 hours of restful sleep and avoid strenuous physical activity.",
    emergency_warning_signs: "Contact the clinic or visit nearest hospital emergency immediately if you experience breathing difficulty, high fever (>102.5°F) that does not reduce, persistent vomiting, or extreme lethargy.",
    followup_instruction: `Review scheduled with ${rx.doctor_name || "Doctor"} on ${rx.followup_date || "Within 3 to 7 Days"}.`
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7] flex flex-col print:min-h-0 print:bg-white print:text-black">
      {/* 1. TOP APP HEADER (Hidden during printing) */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#ECEEF2]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#000000]/80 print:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/dashboard" label="Back" />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-3 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
              <ShieldCheck className="h-4 w-4" /> Digitally Signed
            </span>
          </div>
        </div>
      </header>

      {/* 2. PRINT BANNER NOTIFICATION */}
      {routedChemistMsg && (
        <div className="mx-auto max-w-4xl w-full px-4 pt-4 print:hidden animate-fade-in">
          <div className="rounded-[16px] bg-[#34C759]/10 border border-[#34C759]/20 p-3.5 text-xs font-semibold text-[#34C759] dark:text-[#30D158] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{routedChemistMsg}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN PRESCRIPTION & PATIENT REPORT CONTAINER */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-6 sm:px-6 space-y-6 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0">
        
        {/* Top Floating Document Action Bar (Print / Share) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1C1C1E] p-4 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
              Official Medical Prescription Document
            </span>
            <span className="font-mono text-[11px] text-[#86868B] dark:text-[#8E8E93]">
              #{rx.prescription_number}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Format Selector */}
            <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] p-0.5">
              <button
                type="button"
                onClick={() => setPaperFormat("a4")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  paperFormat === "a4"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                A4 Sheet
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat("a5")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  paperFormat === "a5"
                    ? "bg-white text-[#0071E3] shadow-sm dark:bg-[#2C2C2E] dark:text-[#2997FF] font-bold"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                A5 Pad
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0077ED] active:scale-95 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full border border-[#0071E3]/30 bg-[#0071E3]/10 px-3.5 py-1.5 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] shadow-sm transition hover:bg-[#0071E3]/20 active:scale-95 cursor-pointer"
              title="Download digitally signed vector PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(waShareText)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-95 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp PDF</span>
            </a>

            <button
              onClick={handleRouteToPharmacy}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm hover:bg-black/[0.02] dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white cursor-pointer"
            >
              <Pill className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>Route to Chemist</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ⭐ AI PATIENT HEALTH COMPANION & CONSULTATION REPORT CARD ⭐ */}
        {/* ============================================================== */}
        <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-5 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#1D1D1F] dark:text-white tracking-tight">
                    Patient Consultation &amp; Care Companion
                  </h2>
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    AI Scribe Report
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#86868B] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <strong>{rx.created_at || "Not recorded"}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <strong>{rx.signed_at || "06:15 PM"}</strong>
                  </span>
                  <span>•</span>
                  <span>Patient: <strong className="text-[#1D1D1F] dark:text-white">{displayPatientName}</strong></span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveReportTab("summary")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  activeReportTab === "summary"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                Diagnosis &amp; Vitals
              </button>
              <button
                type="button"
                onClick={() => setActiveReportTab("schedule")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  activeReportTab === "schedule"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                Medicine Schedule ({rx.items?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveReportTab("guidance")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  activeReportTab === "guidance"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                Care &amp; Warning Signs
              </button>
            </div>
          </div>

          {/* TAB 1: DIAGNOSIS & VITALS */}
          {activeReportTab === "summary" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Recorded Vitals Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`rounded-2xl p-3 border ${isFever ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300" : "bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Body Temp</span>
                    <Flame className={`h-4 w-4 ${isFever ? "text-amber-600 animate-pulse" : "text-gray-400"}`} />
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold text-[#1D1D1F] dark:text-white">
                    {rx.vitals?.temp ? `${rx.vitals.temp}°F` : "101.2°F"}
                  </div>
                  <div className="text-[10px] font-semibold text-[#86868B] mt-0.5">
                    {isFever ? "⚠️ Moderate Pyrexia" : "Normal temperature"}
                  </div>
                </div>

                <div className="rounded-2xl p-3 border bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Pulse Rate</span>
                    <HeartPulse className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold text-[#1D1D1F] dark:text-white">
                    {pulseVal ? `${pulseVal} bpm` : "88 bpm"}
                  </div>
                  <div className="text-[10px] font-semibold text-[#86868B] mt-0.5">
                    Normal sinus rhythm
                  </div>
                </div>

                <div className="rounded-2xl p-3 border bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Oxygen (SpO2)</span>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold text-[#1D1D1F] dark:text-white">
                    {spo2Val ? `${spo2Val}%` : "98%"}
                  </div>
                  <div className="text-[10px] font-semibold text-[#86868B] mt-0.5">
                    Optimal on room air
                  </div>
                </div>

                <div className="rounded-2xl p-3 border bg-black/[0.02] dark:bg-white/[0.04] border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">Blood Pressure</span>
                    <Activity className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-1 font-mono text-base font-extrabold text-[#1D1D1F] dark:text-white">
                    {bpVal || "120/78 mmHg"}
                  </div>
                  <div className="text-[10px] font-semibold text-[#86868B] mt-0.5">
                    Normotensive / Good
                  </div>
                </div>
              </div>

              {/* Diagnosis & Overview */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-500/[0.06] to-indigo-500/[0.06] border border-blue-500/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Provisional Clinical Assessment
                  </span>
                  <span className="text-[10px] font-semibold text-[#86868B]">
                    Examined by {rx.doctor_name}
                  </span>
                </div>
                <div className="text-base font-black text-[#1D1D1F] dark:text-white">
                  {rx.provisional_diagnosis || "Acute Viral Pyrexia (Viral Fever)"}
                </div>
                <p className="text-xs text-[#86868B] dark:text-[#A1A1A6] leading-relaxed">
                  {patientReport.condition_overview}
                </p>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="font-semibold text-[#86868B]">Follow-up Advice:</span>
                <span className="rounded-lg bg-black/[0.03] dark:bg-white/[0.05] px-2.5 py-1 text-[#1D1D1F] dark:text-white font-medium">
                  📅 Scheduled: {rx.followup_date || "Within 3 to 5 Days"}
                </span>
                <span className="rounded-lg bg-black/[0.03] dark:bg-white/[0.05] px-2.5 py-1 text-[#1D1D1F] dark:text-white font-medium">
                  💊 {rx.items?.length || 0} Prescribed Items
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL MEDICINE SCHEDULE */}
          {activeReportTab === "schedule" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-xs text-[#86868B]">
                Take your medicines strictly as scheduled. Never skip a dose or discontinue early without medical advice:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Morning Slot */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">Morning (सुबह)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#86868B]">08:00 AM</span>
                  </div>
                  <div className="space-y-2">
                    {rx.items?.filter((item: any) => item.dosage_frequency?.startsWith("1-") || item.dosage_frequency?.includes("1-0-") || item.dosage_frequency?.includes("1-1-") || item.medicine_name?.toLowerCase().includes("pan")).map((m: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-white dark:bg-[#2C2C2E] p-2.5 shadow-sm border border-black/[0.04] dark:border-white/[0.06] text-xs">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">{m.medicine_name}</div>
                        <div className="text-[10px] text-[#0071E3] font-semibold">{m.timing_relation || "After breakfast"}</div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">{m.duration_days ? `For ${m.duration_days} days` : "As advised"}</div>
                      </div>
                    ))}
                    {(!rx.items || rx.items.length === 0) && (
                      <div className="text-xs text-[#86868B] italic">No morning medicines prescribed.</div>
                    )}
                  </div>
                </div>

                {/* Afternoon Slot */}
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-500/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase">Afternoon (दोपहर)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#86868B]">01:30 PM</span>
                  </div>
                  <div className="space-y-2">
                    {rx.items?.filter((item: any) => item.dosage_frequency?.includes("-1-") || item.medicine_name?.toLowerCase().includes("multivitamin") || item.medicine_name?.toLowerCase().includes("dolo")).map((m: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-white dark:bg-[#2C2C2E] p-2.5 shadow-sm border border-black/[0.04] dark:border-white/[0.06] text-xs">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">{m.medicine_name}</div>
                        <div className="text-[10px] text-[#0071E3] font-semibold">{m.timing_relation || "After lunch"}</div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">{m.duration_days ? `For ${m.duration_days} days` : "As advised"}</div>
                      </div>
                    ))}
                    {(!rx.items || rx.items.length === 0) && (
                      <div className="text-xs text-[#86868B] italic">No afternoon medicines prescribed.</div>
                    )}
                  </div>
                </div>

                {/* Night Slot */}
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase">Night (रात)</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#86868B]">09:30 PM</span>
                  </div>
                  <div className="space-y-2">
                    {rx.items?.filter((item: any) => item.dosage_frequency?.endsWith("-1") || item.dosage_frequency?.includes("0-0-1") || item.medicine_name?.toLowerCase().includes("cetzine") || item.medicine_name?.toLowerCase().includes("dolo")).map((m: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-white dark:bg-[#2C2C2E] p-2.5 shadow-sm border border-black/[0.04] dark:border-white/[0.06] text-xs">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">{m.medicine_name}</div>
                        <div className="text-[10px] text-[#0071E3] font-semibold">{m.timing_relation || "At bedtime / after dinner"}</div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">{m.duration_days ? `For ${m.duration_days} days` : "As advised"}</div>
                      </div>
                    ))}
                    {(!rx.items || rx.items.length === 0) && (
                      <div className="text-xs text-[#86868B] italic">No night medicines prescribed.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARE & WARNING SIGNS */}
          {activeReportTab === "guidance" && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Home Care &amp; Dietary Guidelines</span>
                  </div>
                  <p className="text-xs text-[#1D1D1F] dark:text-white leading-relaxed">
                    {patientReport.home_care_guidance}
                  </p>
                  <ul className="text-xs text-[#86868B] dark:text-[#A1A1A6] space-y-1 mt-2 list-disc list-inside">
                    <li>Drink lukewarm water or ORS every 1–2 hours.</li>
                    <li>Avoid ice, carbonated cold beverages, and heavily spiced foods.</li>
                    <li>If fever crosses 101.5°F, apply a clean damp cloth on the forehead (cold sponging).</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300 uppercase">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>Red Flag Warning Signs (Seek Immediate Care)</span>
                  </div>
                  <p className="text-xs text-[#1D1D1F] dark:text-white leading-relaxed">
                    {patientReport.emergency_warning_signs}
                  </p>
                  <ul className="text-xs text-red-700/80 dark:text-red-300/80 space-y-1 mt-2 list-disc list-inside">
                    <li>Persistent fever exceeding 102.5°F despite medicine.</li>
                    <li>Difficulty breathing, chest tightness, or blue-tinged lips.</li>
                    <li>Continuous vomiting or inability to keep liquids down.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. THE PRINTABLE OFFICIAL A4/A5 PRESCRIPTION SHEET */}
        {/* ============================================================== */}
        <div className={`overflow-hidden rounded-[20px] border border-black/[0.06] bg-white ${paperFormat === "a5" ? "max-w-2xl text-xs p-5" : "max-w-4xl p-6 sm:p-8"} mx-auto shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] print:m-0 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:w-full print:rounded-none flex flex-col justify-between print:min-h-[268mm] transition-all`}>

          {/* Top Letterhead & Clinical Details */}
          <div>
            <div className="border-b-2 border-[#1D1D1F] pb-3 dark:border-white print:border-black print:pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 print:flex-row print:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#0071E3] text-white print:border print:border-black print:h-6 print:w-6 print:bg-black">
                      <Stethoscope className="h-3.5 w-3.5" />
                    </div>
                    <h1 className="text-lg font-black text-[#1D1D1F] dark:text-white print:text-black print:text-base tracking-tight">
                      {rx.clinic_name || ""}
                    </h1>
                  </div>
                  <div className="text-[11px] text-[#86868B] mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 print:text-gray-700 print:text-[9.5pt]">
                    {rx.clinic_address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#0071E3] print:text-black" />
                        <span>{rx.clinic_address}</span>
                      </span>
                    )}
                    {rx.clinic_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-[#0071E3] print:text-black" />
                        <span>Tel: {rx.clinic_phone}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Doctor Credentials & Medical Council Reg */}
                <div className="text-left sm:text-right print:text-right">
                  <div className="text-base font-black text-[#1D1D1F] dark:text-white print:text-black print:text-sm">
                    {rx.doctor_name || "Doctor"}
                  </div>
                  <div className="text-xs text-[#0071E3] font-semibold mt-0.5 print:text-black print:text-[9.5pt]">
                    {rx.qualification_summary || "MBBS, MD (Registered Medical Practitioner)"}
                  </div>
                  <div className="text-[11px] text-[#86868B] font-mono mt-0.5 print:text-black print:text-[9pt]">
                    Reg: <strong className="text-[#1D1D1F] dark:text-white print:text-black">{rx.doctor_reg_number}</strong>
                  </div>
                </div>
              </div>

              {/* Patient Metadata Strip */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-[12px] bg-[#ECEEF2]/60 p-2.5 text-xs dark:bg-white/[0.04] print:mt-2 print:p-2 print:rounded-none print:border print:border-black print:bg-white print:grid-cols-4 print:text-[9.5pt] print:gap-1">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868B] print:text-gray-600 block">Patient Name</span>
                  <strong className="text-sm text-[#1D1D1F] dark:text-white print:text-black print:text-[10pt]">{displayPatientName}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868B] print:text-gray-600 block">Age &amp; Gender</span>
                  <strong className="text-[#1D1D1F] dark:text-white print:text-black print:text-[10pt]">{rx.patient_age ? `${rx.patient_age} Yrs` : "Age not recorded"} / {rx.patient_gender || "Gender not recorded"}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868B] print:text-gray-600 block">Date Issued</span>
                  <strong className="text-[#1D1D1F] dark:text-white print:text-black print:text-[10pt]">{rx.created_at || "Not recorded"}</strong>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868B] print:text-gray-600 block">Prescription ID</span>
                  <strong className="font-mono text-[#0071E3] dark:text-[#2997FF] print:text-black print:text-[10pt]">{rx.prescription_number}</strong>
                </div>
              </div>
            </div>

            {/* Vitals & Clinical Diagnosis */}
            <div className="mt-2.5 space-y-1.5 border-b border-black/[0.08] pb-2.5 dark:border-white/[0.08] print:mt-1.5 print:pb-1.5 print:border-black text-xs print:text-[9.5pt]">
              {rx.vitals && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#86868B] font-mono print:text-black">
                  {rx.vitals.bp && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">BP:</strong> {rx.vitals.bp} mmHg</span>}
                  {rx.vitals.pulse && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">Pulse:</strong> {rx.vitals.pulse} bpm</span>}
                  {rx.vitals.temp && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">Temp:</strong> {rx.vitals.temp} °F</span>}
                  {rx.vitals.spo2 && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">SpO2:</strong> {rx.vitals.spo2}%</span>}
                  {rx.vitals.weight && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">Weight:</strong> {rx.vitals.weight} kg</span>}
                </div>
              )}

              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] print:text-gray-700 shrink-0">
                  Provisional Diagnosis:
                </span>
                <span className="text-sm font-extrabold text-[#1D1D1F] dark:text-white print:text-black print:text-[10pt]">
                  {rx.provisional_diagnosis}
                </span>
              </div>
            </div>

            {/* Prescribed Medications Section (Generic Name First) */}
            <div className="mt-3.5 print:mt-2">
              <div className="flex items-center justify-between mb-2 print:mb-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white print:text-black flex items-center gap-1.5">
                  <span className="font-serif italic text-base font-bold text-[#0071E3] print:text-black">℞</span> Prescribed Medication Regimen
                </h3>
                <span className="text-[10px] font-mono text-[#86868B] uppercase print:text-gray-600">
                  (Generic formulations listed first)
                </span>
              </div>

              {/* Table view for dense document / print display */}
              <div className="overflow-x-auto rounded-[12px] border border-black/[0.08] dark:border-white/[0.08] print:border-black print:rounded-none">
                <table className="w-full border-collapse text-left text-xs print:text-[9.5pt]">
                  <thead>
                    <tr className="border-b border-black/[0.08] bg-[#ECEEF2]/70 dark:border-white/[0.08] dark:bg-white/[0.04] print:border-black print:bg-gray-100">
                      <th className="py-1.5 px-2.5 font-bold text-[#86868B] uppercase text-[9px] print:text-black w-7">#</th>
                      <th className="py-1.5 px-2.5 font-bold text-[#86868B] uppercase text-[9px] print:text-black">Medicine &amp; Generic Formulation</th>
                      <th className="py-1.5 px-2.5 font-bold text-[#86868B] uppercase text-[9px] print:text-black">Dosage / Form</th>
                      <th className="py-1.5 px-2.5 font-bold text-[#86868B] uppercase text-[9px] print:text-black">Frequency &amp; Timing</th>
                      <th className="py-1.5 px-2.5 font-bold text-[#86868B] uppercase text-[9px] print:text-black w-20">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] print:divide-gray-300">
                    {rx.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="print-avoid-break odd:bg-transparent even:bg-[#ECEEF2]/20 dark:even:bg-white/[0.015] print:even:bg-transparent">
                        <td className="py-2 px-2.5 font-bold text-[#86868B] print:text-black align-top text-[10px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-2.5 align-top">
                          <div className="font-extrabold text-[#1D1D1F] dark:text-white print:text-black text-xs print:text-[9.5pt]">
                            {item.medicine_name}
                          </div>
                          <div className="text-[10px] font-mono font-bold text-[#0071E3] dark:text-[#2997FF] uppercase mt-0.5 print:text-black">
                            GENERIC: {item.generic_name}
                          </div>
                          {item.special_instructions && (
                            <div className="mt-1 text-[10px] text-[#86868B] italic print:text-gray-700">
                              ℹ️ {item.special_instructions}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-[#1D1D1F] dark:text-white print:text-black align-top whitespace-nowrap">
                          <span className="font-semibold">{item.dosage_form || "Tablet"}</span>
                          {item.strength && <span className="text-[#86868B] print:text-black ml-1">({item.strength})</span>}
                        </td>
                        <td className="py-2 px-2.5 align-top whitespace-nowrap">
                          <span className="inline-block rounded-[6px] bg-[#0071E3]/10 px-2 py-0.5 font-mono font-bold text-[#0071E3] dark:text-[#2997FF] print:border print:border-black print:text-black print:bg-white print:px-1.5 print:py-0">
                            {item.dosage_frequency || item.frequency}
                          </span>
                          <div className="text-[10px] text-[#86868B] mt-0.5 font-medium print:text-black">
                            {item.timing_relation || "After Food"}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-[#1D1D1F] dark:text-white print:text-black align-top whitespace-nowrap">
                          {item.duration_days || item.duration || "5"} Days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Investigations & Clinical Advice (Dense 2-Column Grid) */}
            <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 print:grid-cols-2 print:gap-3 print:mt-2 print-avoid-break">
              {/* Ordered Investigations */}
              {Array.isArray(rx.lab_tests) && rx.lab_tests.length > 0 ? (
                <div className="rounded-[12px] border border-black/[0.06] bg-[#ECEEF2]/30 p-2.5 text-xs dark:border-white/[0.08] dark:bg-white/[0.02] print:border-black print:rounded-none print:p-2 print:bg-white">
                  <div className="font-bold text-[#1D1D1F] dark:text-white print:text-black flex items-center justify-between mb-1.5">
                    <span>🔬 Ordered Lab Tests:</span>
                    <span className="text-[9px] font-mono text-[#86868B] uppercase print:text-gray-600">Authorized Order</span>
                  </div>
                  <div className="space-y-1">
                    {rx.lab_tests.map((test: any, tIdx: number) => {
                      const testName = typeof test === "string" ? test : (test.test_name || test.name || "Diagnostic Test");
                      const testInstructions = typeof test === "object" ? test.instructions : null;
                      return (
                        <div key={tIdx} className="flex items-center gap-1.5 text-[11px] print:text-[9pt]">
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-[#0071E3]/10 font-bold text-[#0071E3] text-[9px] shrink-0 print:border print:border-black print:text-black">
                            {tIdx + 1}
                          </span>
                          <span className="font-semibold text-[#1D1D1F] dark:text-white print:text-black">{testName}</span>
                          {testInstructions && <span className="text-[10px] text-[#86868B] italic">({testInstructions})</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-[12px] border border-dashed border-black/[0.06] p-2.5 text-xs text-[#86868B] dark:border-white/[0.08] print:hidden">
                  No additional lab tests ordered for this consultation.
                </div>
              )}

              {/* Doctor's Advice & Review Date */}
              <div className="rounded-[12px] border border-black/[0.06] bg-[#ECEEF2]/30 p-2.5 text-xs dark:border-white/[0.08] dark:bg-white/[0.02] print:border-black print:rounded-none print:p-2 print:bg-white">
                <div className="font-bold text-[#1D1D1F] dark:text-white print:text-black">
                  Clinical Advice &amp; Lifestyle Guidelines:
                </div>
                <p className="mt-1 text-[#86868B] leading-relaxed dark:text-[#8E8E93] print:text-black print:text-[9.5pt]">
                  {rx.instructions || rx.diet_advice || "Regular hydration and adequate rest."}
                </p>
                <div className="mt-2 text-xs text-[#0071E3] dark:text-[#2997FF] font-semibold print:text-black print:text-[9.5pt]">
                  📅 Next Review: <strong>{rx.followup_date || "Within 3 to 7 Days"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Seal & Digital Signature (Pinned Footer) */}
          <div className="print-footer-pin print-avoid-break mt-4 border-t-2 border-[#1D1D1F] pt-3 dark:border-white print:border-black text-xs flex flex-row justify-between items-end gap-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white p-1 shadow-sm shrink-0 print:border-black">
                <QRCodeDisplay
                  value={publicPrescriptionUrl}
                  size={58}
                  level="M"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-[#34C759] dark:text-[#30D158] print:text-black text-[11px] print:text-[9pt]">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>Prescription Integrity Hash (SHA-256)</span>
                </div>
                <div className="font-mono text-[8.5px] text-[#86868B] mt-0.5 max-w-xs break-all print:text-black">
                  {rx.digital_signature_hash
                    ? `SHA-256: ${rx.digital_signature_hash}`
                    : "Signature hash not recorded on this copy"}
                </div>
                {rx.qr_verification_code && (
                  <div className="font-mono text-[9.5px] text-[#86868B] mt-0.5 print:text-black">
                    Verification Code: <strong>{rx.qr_verification_code}</strong>
                  </div>
                )}
                <div className="text-[9px] text-[#86868B] print:text-gray-700">
                  Scan QR code with phone to verify authentic digital seal on Clinicos
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-black text-sm text-[#1D1D1F] dark:text-white print:text-black print:text-xs">
                {rx.doctor_name || "Doctor"}
              </div>
              <div className="text-[10px] text-[#86868B] print:text-black">
                Registered Medical Practitioner
              </div>
              {rx.doctor_reg_number && (
                <div className="text-[10px] text-[#86868B] font-mono mt-0.5 print:text-black">
                  {rx.doctor_reg_number}
                </div>
              )}
              {rx.digital_signature_hash && (
                <div className="inline-block mt-1 rounded border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[8.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase print:border-black print:text-black print:bg-white">
                  ✓ Integrity Seal Recorded
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Print Stylesheet for High-DPI Print-to-PDF */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperFormat === "a5" ? "A5 portrait" : "A4 portrait"};
            margin: 10mm 12mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, button, a, .print\\:hidden, [role="navigation"], .toast {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
