"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Stethoscope,
  Sparkles,
  FileText,
  Printer,
  Send,
  CheckCircle2,
  X,
  ChevronLeft,
  AlertTriangle,
  HeartPulse,
  LayoutList,
  History,
  Volume2,
  RefreshCw,
  Clock,
  User,
  Phone,
  Banknote,
} from "lucide-react";
import { ClinicSyncProvider, useClinicSync } from "@/lib/clinic-sync";
import { MedicineSchedule } from "@/components/MedicineSchedule";
import { ConsultationRecorder, type ConsultationExtraction } from "@/components/ConsultationRecorder";
import { AIClinicalCompanion } from "@/components/AIClinicalCompanion";
import { PatientVaultPanel } from "@/components/PatientVaultPanel";
import { Button, Card, Badge, DESIGN_TOKENS } from "@/components/design-system";

type Appointment = {
  id: string;
  appointment_number: string;
  token_number: number;
  doctor_slug: string;
  patient_name: string;
  patient_phone: string;
  time_slot: string;
  status: "confirmed" | "booked" | "arrived" | "in_consultation" | "completed" | "no_show";
  fee_amount: number;
  payment_status: "paid" | "pending";
  payment_mode: "upi" | "cash";
  symptoms_description?: string;
  is_walk_in?: boolean;
};
type Doctor = {
  id: string;
  slug: string;
  full_name: string;
  specialization: string;
  medical_council_reg_number?: string | null;
  chamber_name?: string | null;
};
type UserContext = {
  id: string;
  phone: string;
  full_name: string;
  role: string;
  clinic_id: string | null;
  clinic_name: string | null;
  clinic_slug: string | null;
};

const SPEED_RX_MOLECULES = [
  { brand: "Dolo 650", generic: "PARACETAMOL 650MG", form: "Tab", dose: "1-0-1", days: "3 Days" },
  { brand: "Cetcip 10", generic: "CETIRIZINE 10MG", form: "Tab", dose: "0-0-1", days: "5 Days" },
  { brand: "Augmentin 625", generic: "AMOXICILLIN 500MG + CLAVULANIC ACID 125MG", form: "Tab", dose: "1-0-1", days: "5 Days" },
  { brand: "Pan 40", generic: "PANTOPRAZOLE 40MG", form: "Tab", dose: "1-0-0 (Empty Stomach)", days: "7 Days" },
  { brand: "Azithral 500", generic: "AZITHROMYCIN 500MG", form: "Tab", dose: "1-0-0", days: "3 Days" },
  { brand: "Allegra 120", generic: "FEXOFENADINE 120MG", form: "Tab", dose: "1-0-0", days: "7 Days" },
  { brand: "Itracol 200", generic: "ITRACONAZOLE 200MG", form: "Cap", dose: "1-0-1", days: "14 Days" },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-001",
    appointment_number: "APT-1001",
    token_number: 101,
    doctor_slug: "dr-001",
    patient_name: "Ramesh Kumar",
    patient_phone: "9876543210",
    time_slot: "09:30 AM",
    status: "arrived",
    fee_amount: 600,
    payment_status: "paid",
    payment_mode: "upi",
    symptoms_description: "Acne flare on cheeks & jawline for 2 weeks",
    is_walk_in: false,
  },
  {
    id: "apt-002",
    appointment_number: "APT-1002",
    token_number: 102,
    doctor_slug: "dr-001",
    patient_name: "Priya Sharma",
    patient_phone: "9876543211",
    time_slot: "10:00 AM",
    status: "booked",
    fee_amount: 600,
    payment_status: "pending",
    payment_mode: "cash",
    symptoms_description: "Routine follow-up - skin check",
  },
  {
    id: "apt-003",
    appointment_number: "APT-1003",
    token_number: 103,
    doctor_slug: "dr-001",
    patient_name: "Amit Patel",
    patient_phone: "9876543212",
    time_slot: "10:30 AM",
    status: "confirmed",
    fee_amount: 800,
    payment_status: "pending",
    payment_mode: "upi",
    symptoms_description: "Hair fall and scalp itching",
  },
];

const API = {
  get: async (path: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "HTTP error" } as any));
      throw new Error(err.error || "HTTP error");
    }
    return res.json();
  },
  post: async (path: string, body: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "HTTP error" } as any));
      throw new Error(err.error || "HTTP error");
    }
    return res.json();
  },
};

function StatusChip({ status }: { status: string }) {
  const variants: Record<string, string> = {
    booked: "bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-bold",
    arrived: "bg-amber-100 text-amber-950 dark:bg-amber-950/80 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 font-black",
    in_consultation: "bg-emerald-600 text-white border-2 border-emerald-500 font-black shadow-xs animate-pulse",
    completed: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold",
    no_show: "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 font-bold",
    confirmed: "bg-sky-100 text-sky-900 dark:bg-sky-950/80 dark:text-sky-200 border border-sky-300 font-bold",
  };
  const labels: Record<string, string> = { booked: "Booked", arrived: "Arrived", in_consultation: "In Chamber", completed: "Completed", no_show: "No-Show", confirmed: "Confirmed" };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] tracking-wide ${variants[status] || variants.booked}`}>{labels[status] || status}</span>;
}

function VitalsField({ label, value, onChange, unit, placeholder = "-" }: { label: string; value: string; onChange: (v: string) => void; unit?: string; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">{label}</label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-20 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1.5 text-sm font-mono font-extrabold text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3] shadow-xs transition"
        />
        {unit && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{unit}</span>}
      </div>
    </div>
  );
}

function VitalsAlert({ sys, dia, hr, spo2, temp, bmi }: { sys: number; dia: number; hr: number; spo2: number; temp: number; bmi: number }) {
  const alerts: Array<{ label: string; severity: "ok" | "low" | "medium" | "high" | "critical" }> = [];
  const s = bpStage(sys, dia);
  if (s.severity !== "ok") alerts.push({ label: `BP: ${s.label}`, severity: s.severity });
  if (hr > 100) alerts.push({ label: `HR: Tachycardia (${hr} bpm)`, severity: "medium" });
  else if (hr < 60) alerts.push({ label: `HR: Bradycardia (${hr} bpm)`, severity: "medium" });
  if (spo2 < 90) alerts.push({ label: `SpO₂: Critical Hypoxia (${spo2}%)`, severity: "critical" });
  else if (spo2 < 94) alerts.push({ label: `SpO₂: Hypoxia Warning (${spo2}%)`, severity: "high" });
  if (temp > 100.4) alerts.push({ label: `Temp: Fever (${temp}°F)`, severity: "high" });
  const b = bmiCategory(bmi);
  if (b.severity !== "ok") alerts.push({ label: `BMI: ${b.label} (${bmi.toFixed(1)})`, severity: b.severity });
  if (alerts.length === 0) return null;
  const c: Record<string, string> = {
    critical: "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-300",
    high: "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-300",
    medium: "bg-orange-500/10 border-orange-500/30 text-orange-900 dark:text-orange-300",
    low: "bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-300",
    ok: "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-300",
  };
  return (
    <div className="mt-3 rounded-xl border p-3 space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><AlertTriangle className="h-3 w-3" /><span>Clinical Safety Alerts</span></div>
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs border ${c[a.severity]}`}>
          <span>{a.label}</span><span className="font-black">{a.severity.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

function bpStage(sys: number, dia: number): { label: string; severity: "ok" | "low" | "medium" | "high" | "critical" } {
  if (sys >= 180 || dia >= 120) return { label: "Hypertensive Crisis", severity: "critical" };
  if (sys >= 140 || dia >= 90) return { label: "Stage 2 Hypertension", severity: "high" };
  if (sys >= 130 || dia >= 80) return { label: "Stage 1 Hypertension", severity: "medium" };
  if (sys >= 120 && dia < 80) return { label: "Elevated", severity: "low" };
  return { label: "Normal", severity: "ok" };
}
function bmiCategory(bmi: number): { label: string; severity: "ok" | "low" | "medium" | "high" | "critical" } {
  if (bmi < 18.5) return { label: "Underweight", severity: "low" };
  if (bmi < 25) return { label: "Normal", severity: "ok" };
  if (bmi < 30) return { label: "Overweight", severity: "medium" };
  return { label: "Obese", severity: "high" };
}

function SchedulePane({ appointments, loadingAppointments, activeAptId, setActiveAptId, setVitals, setSoap, setSpeedRx, TODAY_DISPLAY }: { appointments: Appointment[]; loadingAppointments: boolean; activeAptId: string | null; setActiveAptId: (id: string | null) => void; setVitals: (v: any) => void; setSoap: (v: any) => void; setSpeedRx: (v: any) => void; TODAY_DISPLAY: string }) {
  const [queueTab, setQueueTab] = useState<"waiting" | "all" | "completed">("waiting");
  const waitingCount = appointments.filter((a) => a.status === "arrived" || a.status === "booked" || a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const inChamber = appointments.find((a) => a.status === "in_consultation");

  const displayedAppointments = appointments.filter((a) => {
    if (queueTab === "waiting") return a.status === "arrived" || a.status === "booked" || a.status === "confirmed" || a.status === "in_consultation";
    if (queueTab === "completed") return a.status === "completed";
    return true;
  });

  return (
    <Card variant="elevated" className="flex flex-col h-full border-2 border-slate-200 dark:border-white/[0.1]">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <LayoutList className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Today's Schedule</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-emerald-800 dark:text-emerald-400">{waitingCount} Waiting</span>
        </div>
      </div>

      {/* Quick Stats - Bold High Contrast */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50/70 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">In Chamber</div>
          <div className="text-sm font-black font-mono text-emerald-950 dark:text-emerald-200 truncate mt-0.5">{inChamber?.patient_name || "—"}</div>
        </div>
        <div className="rounded-xl border-2 border-blue-500/30 bg-blue-50/70 p-2.5 dark:border-blue-800/40 dark:bg-blue-950/30">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">Waiting</div>
          <div className="text-base font-black font-mono text-blue-950 dark:text-blue-200 mt-0.5">{waitingCount}</div>
        </div>
      </div>

      {/* Segmented Queue Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/90 dark:bg-white/[0.08] p-1 rounded-xl mb-3">
        <button
          type="button"
          onClick={() => setQueueTab("waiting")}
          className={`flex-1 py-1 text-[11px] font-black rounded-lg transition text-center cursor-pointer ${
            queueTab === "waiting"
              ? "bg-[#0071E3] text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Waiting ({waitingCount})
        </button>
        <button
          type="button"
          onClick={() => setQueueTab("all")}
          className={`flex-1 py-1 text-[11px] font-black rounded-lg transition text-center cursor-pointer ${
            queueTab === "all"
              ? "bg-[#0071E3] text-white shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          type="button"
          onClick={() => setQueueTab("completed")}
          className={`flex-1 py-1 text-[11px] font-black rounded-lg transition text-center cursor-pointer ${
            queueTab === "completed"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
              : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Done ({completedCount})
        </button>
      </div>

      {/* Patient List */}
      {loadingAppointments ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3] mb-3"><RefreshCw className="h-4 w-4" /></div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Loading queue…</p>
        </div>
      ) : displayedAppointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/[0.1] p-6 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Calendar className="h-7 w-7 mx-auto mb-2 text-slate-500" />
          <p className="mb-0.5">No patients in this view.</p>
          <p className="text-[10px] text-slate-500">Scheduled patients appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {displayedAppointments.map((apt) => {
            const isActive = apt.id === activeAptId;
            const chipClass = isActive
              ? "bg-[#0071E3] text-white shadow-xs"
              : apt.status === "completed"
              ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
              : "bg-slate-100 text-slate-900 dark:bg-[#202227] dark:text-white border-2 border-slate-300 dark:border-slate-700";
            const rowClass = isActive
              ? "border-2 border-[#0071E3] bg-blue-50/90 dark:bg-blue-950/50 shadow-xs"
              : "border-2 border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1E2024] hover:border-slate-400 dark:hover:border-slate-600";
            return (
              <button
                key={apt.id}
                onClick={() => {
                  setActiveAptId(apt.id);
                  setVitals({ systolic: "", diastolic: "", heartRate: "", spo2: "", temperature: "", weight: "", height: "" });
                  setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
                  setSpeedRx([]);
                }}
                className={`w-full flex items-center justify-between rounded-xl p-2.5 transition-all text-left cursor-pointer ${rowClass}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono font-black text-xs ${chipClass}`}>
                    #{apt.token_number}
                  </span>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                      {apt.patient_name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                      <span>{apt.time_slot}</span>
                      {apt.is_walk_in && (
                        <span className="bg-blue-600 text-white px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider">
                          Walk-in
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusChip status={apt.status} />
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ConsultationPane({
  currentPatient,
  appointments,
  setActiveAptId,
  vitals,
  setVitals,
  soap,
  setSoap,
  speedRx,
  setSpeedRx,
  addMolecule,
  removeMolecule,
  bmi,
  sys,
  dia,
  hr,
  spo2,
  temp,
  weight,
  height,
  handleCompleteVisit,
  setShowHistory,
  showToast,
  doctorSlug,
  doctorName,
  onConsultationExtracted,
  onReportApproved,
}: {
  currentPatient: Appointment | null;
  appointments?: Appointment[];
  setActiveAptId?: (id: string | null) => void;
  vitals: any;
  setVitals: (v: any) => void;
  soap: any;
  setSoap: (v: any) => void;
  speedRx: any[];
  setSpeedRx: (v: any) => void;
  addMolecule: (mol: any) => void;
  removeMolecule: (idx: number) => void;
  bmi: number;
  sys: number;
  dia: number;
  hr: number;
  spo2: number;
  temp: number;
  weight: number;
  height: number;
  handleCompleteVisit: () => void;
  setShowHistory: (v: boolean) => void;
  showToast: (msg: string) => void;
  doctorSlug?: string | null;
  doctorName?: string | null;
  onConsultationExtracted: (data: ConsultationExtraction) => void;
  onReportApproved: (report: any) => void;
}) {
  const [consultMode, setConsultMode] = useState<"ai_companion" | "speed_pad">("ai_companion");

  if (!currentPatient) {
    const nextPatient = appointments?.find(
      (a) => a.status === "arrived" || a.status === "confirmed" || a.status === "booked"
    );
    const waitingCount = appointments?.filter(
      (a) => a.status === "arrived" || a.status === "confirmed" || a.status === "booked"
    ).length || 0;
    const completedCount = appointments?.filter((a) => a.status === "completed").length || 0;

    return (
      <Card variant="elevated" className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0071E3]/10 dark:bg-[#0071E3]/20 flex items-center justify-center text-[#0071E3] dark:text-[#2997FF]">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">Consultation Chamber Ready</h3>
              <p className="text-[11px] text-[#86868B]">Select a patient from the queue or launch the next consultation</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-0.5">
            ● Chamber Online
          </span>
        </div>

        {nextPatient ? (
          <div className="rounded-xl border border-[#0071E3]/20 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0071E3] font-mono font-bold text-sm text-white shadow-sm">
                #{nextPatient.token_number}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                    Next in Queue
                  </span>
                  <span className="text-[11px] text-[#86868B]">{nextPatient.time_slot}</span>
                </div>
                <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                  {nextPatient.patient_name}
                </h4>
                <p className="text-xs text-[#86868B] truncate max-w-sm">
                  {nextPatient.symptoms_description || "Routine Consultation"}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveAptId?.(nextPatient.id)}
              className="text-xs font-bold px-4 py-2 shrink-0 cursor-pointer shadow-sm"
            >
              Start Consultation
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-black/[0.08] dark:border-white/[0.08] p-5 text-center text-xs text-[#86868B]">
            All scheduled patients for this session have been completed.
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Waiting</div>
            <div className="text-base font-black font-mono text-[#0071E3] dark:text-[#2997FF] mt-0.5">{waitingCount}</div>
          </div>
          <div className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Completed</div>
            <div className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</div>
          </div>
          <div className="rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-2.5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Total Today</div>
            <div className="text-base font-black font-mono text-[#1D1D1F] dark:text-white mt-0.5">{appointments?.length || 0}</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      {/* Patient Header - Bold & High Contrast */}
      <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-xs">
              IN CHAMBER
            </span>
            <span className="font-mono text-lg font-black text-emerald-800 dark:text-emerald-300">
              #{currentPatient.token_number}
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {currentPatient.patient_name}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {currentPatient.patient_phone ? `+91 ${currentPatient.patient_phone}` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white bg-emerald-700 dark:bg-emerald-600 px-2.5 py-1 rounded-md shadow-xs">
              ₹{currentPatient.fee_amount}
            </span>
            <span className="font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700">
              {currentPatient.payment_mode.toUpperCase()}
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          </div>
        </div>
        <div
          onClick={() => setShowHistory(true)}
          className="rounded-lg bg-amber-100/90 p-2.5 text-xs text-amber-950 dark:bg-amber-950/60 dark:text-amber-100 border-2 border-amber-300 dark:border-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-200/90 transition group shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span className="font-bold truncate">
              Visit #{currentPatient.token_number} · {currentPatient.symptoms_description || "Routine follow-up"}
            </span>
          </div>
          <span className="font-bold text-xs text-amber-900 dark:text-amber-200 underline shrink-0 group-hover:opacity-80 ml-2">
            View History →
          </span>
        </div>
      </div>

      {/* Consultation Studio Mode Toggle */}
      <div className="flex items-center justify-between bg-slate-200 dark:bg-[#1E2024] p-1.5 rounded-xl border border-slate-300 dark:border-white/[0.12]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setConsultMode("ai_companion")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              consultMode === "ai_companion"
                ? "bg-[#0071E3] text-white shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Clinical Companion</span>
          </button>
          <button
            type="button"
            onClick={() => setConsultMode("speed_pad")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
              consultMode === "speed_pad"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-bold"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Manual SOAP &amp; Speed Rx</span>
          </button>
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 hidden sm:inline pr-2">
          {consultMode === "ai_companion" ? "Real-time AI listening active" : "Classic chamber pad"}
        </span>
      </div>

      {/* AI Clinical Companion View */}
      {consultMode === "ai_companion" ? (
        <AIClinicalCompanion
          patient={{
            name: currentPatient.patient_name,
            phone: currentPatient.patient_phone,
            appointment_number: currentPatient.appointment_number,
            token_number: currentPatient.token_number,
            symptoms_description: currentPatient.symptoms_description,
          }}
          doctorName={doctorName || "Dr. Rahul Sharma"}
          doctorSlug={doctorSlug || "dr-rahul-sharma"}
          onConsultationCompleted={(report) => {
            onReportApproved(report);
            if (report.provisional_diagnosis) {
              setSoap((prev: any) => ({ ...prev, assessment: report.provisional_diagnosis }));
            }
            if (report.chief_complaints) {
              setSoap((prev: any) => ({ ...prev, subjective: report.chief_complaints }));
            }
            if (report.vitals) {
              setVitals((prev: any) => ({
                ...prev,
                systolic: String((report.vitals as any).bp_systolic || prev.systolic || ""),
                diastolic: String((report.vitals as any).bp_diastolic || prev.diastolic || ""),
                heartRate: String((report.vitals as any).heart_rate || prev.heartRate || ""),
                temperature: String((report.vitals as any).temperature || prev.temperature || ""),
                spo2: String((report.vitals as any).spo2 || prev.spo2 || ""),
              }));
            }
          }}
          showToast={showToast}
        />
      ) : (
        <>
          {/* Classic Consultation Recorder */}
          <ConsultationRecorder
            appointmentNumber={currentPatient.appointment_number}
            patientName={currentPatient.patient_name}
            patientPhone={currentPatient.patient_phone}
            doctorSlug={doctorSlug}
            doctorName={doctorName}
            onExtracted={onConsultationExtracted}
            onApproved={onReportApproved}
            showToast={showToast}
          />

      {/* Vitals & Safety */}
      <Card variant="elevated" className="border-2 border-slate-200 dark:border-white/[0.1]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Vitals &amp; Safety Radar</span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Enter baseline vitals</span>
        </div>
        
        <div className="space-y-3.5">
          {/* Group 1: Hemodynamics */}
          <div>
            <div className="text-[10px] font-extrabold text-[#0071E3] dark:text-[#2997FF] uppercase tracking-wider mb-2">
              🩺 Blood Pressure &amp; Pulse
            </div>
            <div className="grid grid-cols-3 gap-3">
              <VitalsField label="Systolic BP" value={vitals.systolic} onChange={(v) => setVitals((p: any) => ({ ...p, systolic: v }))} unit="mmHg" placeholder="120" />
              <VitalsField label="Diastolic BP" value={vitals.diastolic} onChange={(v) => setVitals((p: any) => ({ ...p, diastolic: v }))} unit="mmHg" placeholder="80" />
              <VitalsField label="Heart Rate" value={vitals.heartRate} onChange={(v) => setVitals((p: any) => ({ ...p, heartRate: v }))} unit="bpm" placeholder="72" />
            </div>
          </div>

          {/* Group 2: Respiration & Core */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06]">
            <div className="text-[10px] font-extrabold text-[#00A389] dark:text-[#30D1BE] uppercase tracking-wider mb-2">
              🫁 Respiration &amp; Temperature
            </div>
            <div className="grid grid-cols-2 gap-3">
              <VitalsField label="SpO₂ Oxygen" value={vitals.spo2} onChange={(v) => setVitals((p: any) => ({ ...p, spo2: v }))} unit="%" placeholder="98" />
              <VitalsField label="Temperature" value={vitals.temperature} onChange={(v) => setVitals((p: any) => ({ ...p, temperature: v }))} unit="°F" placeholder="98.4" />
            </div>
          </div>

          {/* Group 3: Anthropometry */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06]">
            <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
              ⚖️ Body Metrics
            </div>
            <div className="grid grid-cols-2 gap-3">
              <VitalsField label="Weight" value={vitals.weight} onChange={(v) => setVitals((p: any) => ({ ...p, weight: v }))} unit="kg" placeholder="68" />
              <VitalsField label="Height" value={vitals.height} onChange={(v) => setVitals((p: any) => ({ ...p, height: v }))} unit="cm" placeholder="172" />
            </div>
          </div>
        </div>

        {height > 0 && weight > 0 && (
          <div className="mt-3.5 flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Calculated BMI</div>
            <div className="text-base font-black font-mono text-[#0071E3] dark:text-[#2997FF]">{bmi.toFixed(1)} kg/m²</div>
          </div>
        )}
        {sys > 0 && dia > 0 && hr > 0 && spo2 > 0 && temp > 0 && weight > 0 && height > 0 && <VitalsAlert sys={sys} dia={dia} hr={hr} spo2={spo2} temp={temp} bmi={bmi} />}
      </Card>

      {/* SOAP Note */}
      <Card variant="elevated" className="border-2 border-slate-200 dark:border-white/[0.1]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">SOAP Clinical Note</span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Structured OPD Documentation</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/60 font-black text-blue-700 dark:text-blue-300 text-[11px]">S</span>
              <span>Subjective (Chief Complaint)</span>
            </label>
            <textarea value={soap.subjective} onChange={(e) => setSoap((p: any) => ({ ...p, subjective: e.target.value }))} placeholder={currentPatient.symptoms_description || "e.g. Acne flare on cheeks & jawline for 2 weeks."} rows={4} className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071E3] shadow-xs resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-teal-100 dark:bg-teal-900/60 font-black text-teal-700 dark:text-teal-300 text-[11px]">O</span>
              <span>Objective (Findings)</span>
            </label>
            <textarea value={soap.objective} onChange={(e) => setSoap((p: any) => ({ ...p, objective: e.target.value }))} placeholder="Physical examination & clinical findings" rows={4} className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071E3] shadow-xs resize-none" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/60 font-black text-amber-700 dark:text-amber-300 text-[11px]">A</span>
              <span>Assessment (Provisional Diagnosis)</span>
            </label>
            <textarea value={soap.assessment} onChange={(e) => setSoap((p: any) => ({ ...p, assessment: e.target.value }))} placeholder="e.g. Acne Vulgaris Grade II Papulopustular" rows={2} className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071E3] shadow-xs resize-none" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/60 font-black text-emerald-700 dark:text-emerald-300 text-[11px]">P</span>
              <span>Plan (Treatment & Advice)</span>
            </label>
            <textarea value={soap.plan} onChange={(e) => setSoap((p: any) => ({ ...p, plan: e.target.value }))} placeholder="e.g. Continue current Rx. Review in 2 weeks." rows={2} className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0071E3] shadow-xs resize-none" />
          </div>
        </div>
      </Card>

      {/* Speed Rx Pad */}
      <Card variant="elevated" className="border-2 border-slate-200 dark:border-white/[0.1]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-3.5">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Speed Rx Pad (NMC Generic)</span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">1-Tap generic prescriptions</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {SPEED_RX_MOLECULES.map((m, i) => {
            const isAdded = speedRx.some((r) => r.generic === m.generic);
            const btnClass = isAdded
              ? "bg-emerald-600 border-2 border-emerald-600 text-white font-extrabold shadow-xs"
              : "border-2 border-slate-300 bg-slate-100 text-slate-900 hover:border-[#0071E3] hover:bg-white dark:border-slate-700 dark:bg-[#1E2024] dark:text-white dark:hover:border-[#2997FF] font-bold shadow-xs";
            return (
              <button
                key={i}
                type="button"
                onClick={() => addMolecule(m)}
                disabled={isAdded}
                className={`rounded-lg px-3 py-1.5 text-xs transition-all active:scale-95 cursor-pointer ${btnClass}`}
              >
                {isAdded ? "✓ " : "+ "}{m.brand}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {speedRx.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-slate-100 p-3 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{item.form}. {item.generic}</span>
                <div className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">{item.dose}</span>
                  <span>•</span>
                  <span>{item.days}</span>
                </div>
              </div>
              <button type="button" onClick={() => removeMolecule(i)} className="text-slate-500 hover:text-rose-600 p-1 cursor-pointer transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {speedRx.length === 0 && <div className="py-4 text-center text-xs font-bold text-slate-600 dark:text-slate-400">Tap a molecule button above to rapidly prescribe.</div>}
        </div>
      </Card>

      {speedRx.length > 0 && <MedicineSchedule medicines={speedRx.map((m) => ({ generic: m.generic, form: m.form, dose: m.dose, days: m.days }))} />}

      {/* Action Bar */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => window.print()} className="text-xs py-3 font-bold border-2 border-slate-300 dark:border-slate-700">
            <Printer className="h-3.5 w-3.5 text-blue-600" /><span className="ml-1">Print ℞ Slip</span>
          </Button>
          <Button variant="outline" onClick={() => showToast(`Cryptographic ℞ PDF dispatched to ${currentPatient.patient_phone} via WhatsApp`)} className="text-xs py-3 font-bold border-2 border-slate-300 dark:border-slate-700">
            <Send className="h-3.5 w-3.5 text-emerald-600" /><span className="ml-1">WhatsApp ℞ PDF</span>
          </Button>
        </div>
        <Button variant="success" className="w-full py-3.5 font-black text-sm shadow-md" onClick={handleCompleteVisit}>
          <CheckCircle2 className="h-4 w-4" /><span className="ml-2">Complete Visit &amp; Call Next →</span>
        </Button>
      </div>
        </>
      )}
    </div>
  );
}

export default function DashboardTodayPage() {
  const [user, setUser] = useState<UserContext | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [activeAptId, setActiveAptId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [vitals, setVitals] = useState({ systolic: "", diastolic: "", heartRate: "", spo2: "", temperature: "", weight: "", height: "" });
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [speedRx, setSpeedRx] = useState<any[]>([]);
  const [useMockData, setUseMockData] = useState(false);
  // Bumped after a report is approved so the vault panel reloads immediately.
  const [vaultRefreshKey, setVaultRefreshKey] = useState(0);

  const TODAY_STR = new Date().toISOString().split("T")[0];
  const TODAY_DISPLAY = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const currentPatient = appointments.find((a) => a.id === activeAptId) || null;
  const sys = parseInt(vitals.systolic) || 0;
  const dia = parseInt(vitals.diastolic) || 0;
  const hr = parseInt(vitals.heartRate) || 0;
  const spo2 = parseInt(vitals.spo2) || 0;
  const temp = parseFloat(vitals.temperature) || 0;
  const weight = parseFloat(vitals.weight) || 0;
  const height = parseFloat(vitals.height) || 0;
  const bmi = height > 0 ? weight / ((height / 100) ** 2) : 0;
  const waitingCount = appointments.filter((a) => a.status === "arrived" || a.status === "booked" || a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await API.get("/api/auth/me");
        setUser({ id: me.id, phone: me.phone, full_name: me.full_name, role: me.role, clinic_id: me.clinic_id, clinic_name: me.clinic_name, clinic_slug: me.clinic_slug });
        const docs = await API.get("/api/doctors");
        const dList: Doctor[] = Array.isArray(docs) ? docs : (docs.doctors || []);
        const cp = String(me.phone || "").replace(/[^0-9]/g, "").slice(-10);
        const m = dList.find((d) => String(d.medical_council_reg_number || "").includes(cp) || String(d.full_name || "").toLowerCase().includes(me.full_name?.toLowerCase() || "")) || dList[0];
        if (m) setDoctor(m);
      } catch {
        setUseMockData(true);
        // Use mock doctor
        setDoctor({
          id: "dr-001",
          slug: "dr-001",
          full_name: "Dr. Rahul Sharma",
          specialization: "Dermatologist",
          medical_council_reg_number: "NMC-12345",
          chamber_name: "Chamber 1",
        });
        setUser({
          id: "user-001",
          phone: "9876543210",
          full_name: "Dr. Rahul Sharma",
          role: "doctor",
          clinic_id: "clinic-001",
          clinic_name: "Demo Clinic",
          clinic_slug: "demo-clinic",
        });
      } finally {
        if (mounted) setLoadingContext(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const loadAppts = useCallback(async () => {
    if (!doctor?.slug) return;
    setLoadingAppointments(true);
    try {
      const data = await API.get(`/api/appointments?doctor_slug=${doctor.slug}&date=${TODAY_STR}`);
      const list: Appointment[] = Array.isArray(data) ? data : (data.appointments || []);
      setAppointments(list);
      if (!activeAptId && list.length > 0) {
        const n = list.find((a) => a.status === "in_consultation") || list.find((a) => a.status === "arrived" || a.status === "booked" || a.status === "confirmed") || list[0];
        if (n) setActiveAptId(n.id);
      }
    } catch {
      setUseMockData(true);
      setAppointments(MOCK_APPOINTMENTS);
      if (!activeAptId) {
        const n = MOCK_APPOINTMENTS.find((a) => a.status === "arrived") || MOCK_APPOINTMENTS[0];
        setActiveAptId(n.id);
      }
    } finally {
      setLoadingAppointments(false);
    }
  }, [doctor?.slug, TODAY_STR, activeAptId, setUseMockData]);

  useEffect(() => { loadAppts(); const iv = setInterval(loadAppts, 15000); return () => clearInterval(iv); }, [loadAppts]);

  const handleCallNext = useCallback(async () => {
    if (!currentPatient) return;
    try {
      await API.post("/api/clinic/call-token", { appointment_number: currentPatient.appointment_number, chamber_name: doctor?.chamber_name || "Chamber 1" });
      await loadAppts();
      showToast(`Token #${currentPatient.token_number} (${currentPatient.patient_name}) called into Chamber`);
    } catch (e: any) { showToast(`Failed to call token: ${e.message}`); }
  }, [currentPatient, doctor, loadAppts, showToast]);

  const handleCompleteVisit = () => setShowCompleteConfirm(true);

  const confirmCompleteVisit = async () => {
    if (!currentPatient) return;
    setShowCompleteConfirm(false);
    try {
      if (speedRx.length > 0 && currentPatient.appointment_number) {
        await API.post("/api/prescriptions/generate", {
          appointment_number: currentPatient.appointment_number,
          doctor_slug: doctor?.slug || "",
          patient_name: currentPatient.patient_name,
          patient_phone: currentPatient.patient_phone,
          vitals: { systolic: sys || null, diastolic: dia || null, heart_rate: hr || null, spo2: spo2 || null, temperature: temp || null, weight: weight || null, height: height || null, bmi: bmi > 0 ? bmi : null },
          symptoms: [soap.subjective || currentPatient.symptoms_description || ""],
          provisional_diagnosis: soap.assessment || null,
          items: speedRx.map((m) => ({ medicine_name: m.generic, generic_name: m.generic, dosage_form: m.form, dosage_frequency: m.dose, duration_days: parseInt(m.days, 10) || null })),
          instructions: soap.plan || "",
        });
      }
      await API.post("/api/clinic/complete-token", { appointment_number: currentPatient.appointment_number });
      setActiveAptId(null);
      setVitals({ systolic: "", diastolic: "", heartRate: "", spo2: "", temperature: "", weight: "", height: "" });
      setSoap({ subjective: "", objective: "", assessment: "", plan: "" });
      setSpeedRx([]);
      showToast(`Visit completed for ${currentPatient.patient_name}. Rx dispatched via WhatsApp.`);
      await loadAppts();
    } catch (e: any) { showToast(`Failed to complete visit: ${e.message}`); }
  };

  const addMolecule = (m: any) => {
    if (speedRx.some((r) => r.generic === m.generic)) { showToast(`${m.generic} is already prescribed.`); return; }
    setSpeedRx((p) => [...p, m]);
    showToast(`Added ${m.generic}`);
  };
  const removeMolecule = (i: number) => setSpeedRx((p) => p.filter((_, ix) => ix !== i));

  const handleConsultationExtracted = useCallback((data: ConsultationExtraction) => {
    setSoap((prev: any) => ({
      subjective: prev.subjective || data.chiefComplaints || "",
      objective: prev.objective || data.doctorReport?.vitals_assessment || "",
      assessment: prev.assessment || data.diagnosis || "",
      plan: prev.plan || data.patientReport?.followup_instruction || "",
    }));

    if (data.vitals && typeof data.vitals === "object") {
      const raw = data.vitals as Record<string, string | null>;
      const digits = (value: string | null | undefined) => String(value || "").replace(/[^0-9.]/g, "");
      const bpParts = String(raw.bp || "").split("/");
      setVitals((prev: any) => ({
        ...prev,
        systolic: prev.systolic || digits(bpParts[0]),
        diastolic: prev.diastolic || digits(bpParts[1]),
        heartRate: prev.heartRate || digits(raw.pulse),
        spo2: prev.spo2 || digits(raw.spo2),
        temperature: prev.temperature || digits(raw.temp),
        weight: prev.weight || digits(raw.weight),
        height: prev.height || digits(raw.height),
      }));
    }

    if (Array.isArray(data.medicines) && data.medicines.length > 0) {
      setSpeedRx((prev: any[]) => {
        const existing = new Set(prev.map((item) => item.generic));
        const additions = data.medicines!
          .map((medicine) => ({
            brand: medicine.medicine_name || medicine.generic_name || "Medicine",
            generic: medicine.generic_name || medicine.medicine_name || "MEDICINE",
            form: medicine.dosage_form || "Tab",
            dose: medicine.frequency || "1-0-1",
            days: medicine.duration || "3 Days",
          }))
          .filter((medicine) => !existing.has(medicine.generic));
        return [...prev, ...additions];
      });
    }
  }, []);

  const handleReportApproved = useCallback(
    (report: any) => {
      showToast(`Consultation report saved to ${report?.patient_name || "the patient"}'s vault`);
      setVaultRefreshKey((key) => key + 1);
    },
    [showToast]
  );

  return (
    <ClinicSyncProvider>
      <div className="h-full flex flex-col bg-[#E2E6EC] dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100">
        <header className="h-14 shrink-0 flex items-center justify-between border-b-2 border-slate-300 bg-white dark:border-slate-800 dark:bg-[#121417] shadow-xs px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Back to Dashboard">
              <ChevronLeft className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Chamber {doctor?.specialization ? doctor.specialization.split(" & ")[0] : "General"}</span>
              </div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Today's Consultations · {TODAY_DISPLAY}</h1>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{doctor?.full_name || user?.full_name || "Doctor"} • {doctor?.specialization || "General Practice"} • {doctor?.medical_council_reg_number ? `NMC ${doctor.medical_council_reg_number}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loadingContext ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3]"><RefreshCw className="h-3 w-3" /></div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-slate-300 bg-white dark:border-slate-700 dark:bg-[#16181D]">
                <Calendar className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">{appointments.length} Today</span>
                <span className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">{completedCount} Completed</span>
              </div>
            )}
            <button onClick={handleCallNext} disabled={appointments.length === 0 || loadingAppointments} className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition disabled:opacity-50" title="Call next waiting patient"><Volume2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Call Next</span></button>
            <button onClick={() => setShowHistory(true)} className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Patient History"><History className="h-4 w-4 text-slate-700 dark:text-slate-300" /></button>
          </div>
        </header>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-slate-700 animate-in fade-in"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /><span>{toast}</span><button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white"><X className="h-3.5 w-3.5" /></button></div>
        )}
        {useMockData && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-lg">
            Demo mode — using sample data
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loadingContext && !user && (
            <div className="flex flex-col items-center justify-center py-20 text-center"><div className="h-10 w-10 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3] mb-3"><RefreshCw className="h-5 w-5" /></div><p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading clinic context…</p></div>
          )}
          {!loadingContext && user && appointmentsError && !appointments.length && !doctor && (
            <Card variant="elevated" className="flex flex-col items-center justify-center py-20 text-center border-2 border-rose-500/40 bg-rose-50/50 dark:border-rose-800/40 dark:bg-rose-950/30"><AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400 mb-2" /><h3 className="font-bold text-slate-900 dark:text-white">Unable to load clinic</h3><p className="text-sm font-medium text-slate-700 dark:text-slate-300">{appointmentsError}</p><Button onClick={loadAppts} className="mt-4 text-xs">Retry</Button></Card>
          )}
          {!loadingContext && user && doctor && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className={currentPatient ? "lg:col-span-3" : "lg:col-span-5"}>
                <SchedulePane appointments={appointments} loadingAppointments={loadingAppointments} activeAptId={activeAptId} setActiveAptId={setActiveAptId} setVitals={setVitals} setSoap={setSoap} setSpeedRx={setSpeedRx} TODAY_DISPLAY={TODAY_DISPLAY} />
              </div>
              <div className={currentPatient ? "lg:col-span-6" : "lg:col-span-7"}>
                <ConsultationPane
                  currentPatient={currentPatient}
                  appointments={appointments}
                  setActiveAptId={setActiveAptId}
                  vitals={vitals}
                  setVitals={setVitals}
                  soap={soap}
                  setSoap={setSoap}
                  speedRx={speedRx}
                  setSpeedRx={setSpeedRx}
                  addMolecule={addMolecule}
                  removeMolecule={removeMolecule}
                  bmi={bmi}
                  sys={sys}
                  dia={dia}
                  hr={hr}
                  spo2={spo2}
                  temp={temp}
                  weight={weight}
                  height={height}
                  handleCompleteVisit={handleCompleteVisit}
                  setShowHistory={setShowHistory}
                  showToast={showToast}
                  doctorSlug={doctor?.slug}
                  doctorName={doctor?.full_name}
                  onConsultationExtracted={handleConsultationExtracted}
                  onReportApproved={handleReportApproved}
                />
              </div>
              {currentPatient && (
                <div className="lg:col-span-3 order-last lg:order-none space-y-3">
                  <Card variant="elevated" className="p-3.5 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#121417] shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#0071E3] flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0" title={currentPatient.patient_name}>
                        {currentPatient.patient_name
                          ? currentPatient.patient_name
                              .trim()
                              .split(/\s+/)
                              .map((w: string) => w[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : <User className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{currentPatient.patient_name}</div>
                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{currentPatient.patient_phone ? `+91 ${currentPatient.patient_phone}` : "—"}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} fullWidth className="text-xs py-1.5 font-bold border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <History className="h-3.5 w-3.5 mr-1" /> History
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => showToast(`Billing for ${currentPatient.patient_name}: ₹${currentPatient.fee_amount} (${currentPatient.payment_status})`)} fullWidth className="text-xs py-1.5 font-bold border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Banknote className="h-3.5 w-3.5 mr-1" /> Billing
                      </Button>
                    </div>
                  </Card>

                  <PatientVaultPanel
                    patientPhone={currentPatient.patient_phone}
                    refreshKey={vaultRefreshKey}
                  />
                </div>
              )}
            </div>
          )}
        </main>
        {showCompleteConfirm && currentPatient && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-5">
              <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">Complete Visit?</h3></div>
              <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Marking this visit complete will{speedRx.length > 0 ? " generate a prescription, " : ""}advance the queue.</p>
              <div className="flex gap-2"><Button variant="outline" onClick={() => setShowCompleteConfirm(false)} fullWidth>Keep Open</Button><Button variant="success" onClick={confirmCompleteVisit} fullWidth>Complete & Next</Button></div>
            </div>
          </div>
        )}
      </div>
    </ClinicSyncProvider>
  );
}
