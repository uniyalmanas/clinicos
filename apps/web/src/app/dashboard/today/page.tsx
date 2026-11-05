"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Stethoscope,
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
} from "lucide-react";
import { ClinicSyncProvider, useClinicSync } from "@/lib/clinic-sync";
import { VoiceDictation } from "@/components/VoiceDictation";
import { PatientVaultPanel } from "@/components/PatientVaultPanel";
import { MedicineSchedule } from "@/components/MedicineSchedule";
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

const API = {
  get: async (path: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) { const err = await res.json().catch(() => ({ error: "HTTP error" } as any)); throw new Error(err.error || "HTTP error"); }
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
    booked: "bg-blue-50/60 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100/30 dark:border-blue-800/30",
    arrived: "bg-amber-50/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-100/30 dark:border-amber-800/30",
    in_consultation: "bg-emerald-50/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-800/30 animate-pulse",
    completed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
    no_show: "bg-rose-50/60 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100/30 dark:border-rose-800/30",
    confirmed: "bg-blue-50/60 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100/30 dark:border-blue-800/30",
  };
  const labels: Record<string, string> = { booked: "Booked", arrived: "Arrived", in_consultation: "In Chamber", completed: "Completed", no_show: "No-Show", confirmed: "Confirmed" };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${variants[status] || variants.booked}`}>{labels[status] || status}</span>;
}

function VitalsField({ label, value, onChange, unit, placeholder = "-" }: { label: string; value: string; onChange: (v: string) => void; unit?: string; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">{label}</label>
      <div className="flex items-baseline gap-1">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-16 rounded-lg border bg-[#F5F6F9] px-2 py-1.5 text-sm font-mono font-bold text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]" />
        {unit && <span className="text-xs text-[#86868B] dark:text-[#636366]">{unit}</span>}
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
  if (spo2 < 90) alerts.push({ label: `SpO\u2082: Critical Hypoxia (${spo2}%)`, severity: "critical" });
  else if (spo2 < 94) alerts.push({ label: `SpO\u2082: Hypoxia Warning (${spo2}%)`, severity: "high" });
  if (temp > 100.4) alerts.push({ label: `Temp: Fever (${temp}\u00B0F)`, severity: "high" });
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

export default function DashboardTodayPage() {
  const [user, setUser] = useState<any>(null);
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
      } catch { console.error("Failed to load context"); } finally { if (mounted) setLoadingContext(false); }
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
      if (!activeAptId) {
        const n = list.find((a) => a.status === "in_consultation") || list.find((a) => a.status === "arrived" || a.status === "booked" || a.status === "confirmed") || list[0];
        if (n) setActiveAptId(n.id);
      }
    } catch (e: any) { setAppointmentsError(e.message || "Failed"); } finally { setLoadingAppointments(false); }
  }, [doctor?.slug, TODAY_STR, activeAptId]);
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

  return (
    <ClinicSyncProvider>
      <div className="h-full flex flex-col bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
        <header className="h-14 shrink-0 flex items-center justify-between border-b border-white/[0.06] bg-white/80 dark:border-white/[0.07] dark:bg-black/80 backdrop-blur-2xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full p-1.5 hover:bg-white/[0.05] dark:hover:bg-white/[0.08] transition" title="Back to Dashboard">
              <ChevronLeft className="h-4 w-4 text-[#86868B] dark:text-[#636366]" />
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">Chamber {doctor?.specialization ? doctor.specialization.split(" & ")[0] : "General"}</span>
              </div>
              <h1 className="text-sm font-black text-[#1D1D1F] dark:text-white tracking-tight">Today's Consultations \u00b7 {TODAY_DISPLAY}</h1>
              <p className="text-[10px] text-[#86868B] dark:text-[#636366]">{doctor?.full_name || user?.full_name || "Doctor"} \u2022 {doctor?.specialization || "General Practice"} \u2022 {doctor?.medical_council_reg_number ? `NMC ${doctor.medical_council_reg_number}` : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loadingContext ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3]"><RefreshCw className="h-3 w-3" /></div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#121316]"><Calendar className="h-3.5 w-3.5 text-[#86868B] dark:text-[#636366]" /><span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">{appointments.length} Today</span><span className="w-px h-3 bg-black/[0.1] dark:bg-white/[0.1]" /><span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{completedCount} Completed</span></div>
            )}
            <button onClick={handleCallNext} disabled={appointments.length === 0 || loadingAppointments} className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition disabled:opacity-50" title="Call next waiting patient"><Volume2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Call Next</span></button>
            <button onClick={() => setShowHistory(true)} className="rounded-full p-1.5 hover:bg-white/[0.05] dark:hover:bg-white/[0.08] transition" title="Patient History"><History className="h-4 w-4 text-[#86868B] dark:text-[#636366]" /></button>
          </div>
        </header>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-in fade-in"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /><span>{toast}</span><button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white"><X className="h-3.5 w-3.5" /></button></div>
        )}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loadingContext && !user && (
            <div className="flex flex-col items-center justify-center py-20 text-center"><div className="h-10 w-10 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3] mb-3"><RefreshCw className="h-5 w-5" /></div><p className="text-sm text-[#86868B] dark:text-[#636366]">Loading clinic context\u2026</p></div>
          )}
          {!loadingContext && user && appointmentsError && !appointments.length && !doctor && (
            <Card variant="elevated" className="flex flex-col items-center justify-center py-20 text-center border-rose-500/30 bg-rose-50/30 dark:border-rose-800/30 dark:bg-rose-950/20"><AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400 mb-2" /><h3 className="font-bold text-[#1D1D1F] dark:text-white">Unable to load clinic</h3><p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6]">{appointmentsError}</p><Button onClick={loadAppts} className="mt-4 text-xs">Retry</Button></Card>
          )}
          {!loadingContext && user && doctor && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <SchedulePane appointments={appointments} loadingAppointments={loadingAppointments} activeAptId={activeAptId} setActiveAptId={setActiveAptId} setVitals={setVitals} setSoap={setSoap} setSpeedRx={setSpeedRx} TODAY_DISPLAY={TODAY_DISPLAY} />
              <ConsultationPane currentPatient={currentPatient} vitals={vitals} setVitals={setVitals} soap={soap} setSoap={setSoap} speedRx={speedRx} setSpeedRx={setSpeedRx} addMolecule={addMolecule} removeMolecule={removeMolecule} bmi={bmi} sys={sys} dia={dia} hr={hr} spo2={spo2} temp={temp} weight={weight} height={height} handleCompleteVisit={handleCompleteVisit} setShowHistory={setShowHistory} showToast={showToast} />
              {currentPatient && <PatientVaultPanel patientPhone={currentPatient.patient_phone} />}
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

function SchedulePane({ appointments, loadingAppointments, activeAptId, setActiveAptId, setVitals, setSoap, setSpeedRx, TODAY_DISPLAY }: { appointments: Appointment[]; loadingAppointments: boolean; activeAptId: string | null; setActiveAptId: (id: string | null) => void; setVitals: (v: any) => void; setSoap: (v: any) => void; setSpeedRx: (v: any) => void; TODAY_DISPLAY: string }) {
  const waitingCount = appointments.filter((a) => a.status === "arrived" || a.status === "booked" || a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  return (
    <Card variant="elevated">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5 mb-3 dark:border-white/[0.08]">
        <div className="flex items-center gap-2"><LayoutList className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" /><span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">Today's Schedule</span></div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{waitingCount} Waiting</span>
      </div>
      {loadingAppointments ? (
        <div className="flex flex-col items-center justify-center py-8 text-center"><div className="h-8 w-8 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3] mb-3"><RefreshCw className="h-4 w-4" /></div><p className="text-xs text-[#86868B] dark:text-[#636366]">Loading queue\u2026</p></div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/[0.06] p-6 text-center text-xs text-[#86868B] dark:border-white/[0.06]">No appointments scheduled for {TODAY_DISPLAY}.</div>
      ) : (
        <div className="space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
          {appointments.map((apt) => {
            const isActive = apt.id === activeAptId;
            const chipClass = isActive ? "bg-[#0071E3] text-white" : apt.status === "completed" ? "bg-white/[0.1] text-slate-600 dark:bg-white/[0.05] dark:text-slate-400" : "bg-[#F5F6F9] text-[#1D1D1F] dark:bg-[#121316] dark:text-white";
            const rowClass = isActive ? `${String(DESIGN_TOKENS.colors.primaryLight ?? "")} border border-[#0071E3]/30 shadow-sm` : "border-transparent hover:bg-white/[0.02] dark:hover:bg-white/[0.02]";
            return (
              <button key={apt.id} onClick={() => { setActiveAptId(apt.id); setVitals({ systolic: "", diastolic: "", heartRate: "", spo2: "", temperature: "", weight: "", height: "" }); setSoap({ subjective: "", objective: "", assessment: "", plan: "" }); setSpeedRx([]); }} className={`flex items-center justify-between rounded-xl p-2.5 transition-all ${rowClass}`}>
                <div className="flex items-center gap-2.5"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono font-bold text-xs ${chipClass}`}>#{apt.token_number}</span><div className="min-w-0"><div className="font-semibold text-xs text-[#1D1D1F] dark:text-white truncate">{apt.patient_name}</div><div className="text-[10px] text-[#86868B] dark:text-[#636366] truncate">{apt.time_slot}</div></div></div><StatusChip status={apt.status} /></button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" className="p-3 border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/30"><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">In Chamber</div><div className="text-base font-black font-mono text-emerald-800 dark:text-emerald-200">{appointments.find((a) => a.status === "in_consultation")?.patient_name || "\u2014"}</div></Card>
        <Card variant="elevated" className="p-3 border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/30"><div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Waiting</div><div className="text-base font-black font-mono text-blue-800 dark:text-blue-200">{waitingCount}</div></Card>
      </div>
    </Card>
  );
}

function ConsultationPane({ currentPatient, vitals, setVitals, soap, setSoap, speedRx, setSpeedRx, addMolecule, removeMolecule, bmi, sys, dia, hr, spo2, temp, weight, height, handleCompleteVisit, setShowHistory, showToast }: { currentPatient: Appointment | null; vitals: any; setVitals: (v: any) => void; soap: any; setSoap: (v: any) => void; speedRx: any[]; setSpeedRx: (v: any) => void; addMolecule: (mol: any) => void; removeMolecule: (idx: number) => void; bmi: number; sys: number; dia: number; hr: number; spo2: number; temp: number; weight: number; height: number; handleCompleteVisit: () => void; setShowHistory: (v: boolean) => void; showToast: (msg: string) => void }) {
  if (!currentPatient) {
    return (
      <Card variant="elevated" className="flex flex-col items-center justify-center py-12 text-center"><Stethoscope className="h-12 w-12 text-[#86868B] dark:text-[#636366] mb-3" /><h3 className="font-bold text-[#1D1D1F] dark:text-white">No patient selected</h3><p className="text-xs text-[#86868B] dark:text-[#636366] mt-1">Tap a patient from today's schedule on the left to begin consultation.</p></Card>
    );
  }
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-50/40 p-4 dark:bg-emerald-950/20 dark:border-emerald-900/30 space-y-2.5">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className="rounded-md bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">IN CONSULTATION</span><span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">#{currentPatient.token_number}</span><span className="text-xl font-bold text-[#1D1D1F] dark:text-white">{currentPatient.patient_name}</span><span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">{currentPatient.patient_phone ? `+91 ${currentPatient.patient_phone.slice(0, 5)} ${currentPatient.patient_phone.slice(5)}` : "\u2014"}</span></div><div className="flex items-center gap-2 text-xs"><span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full text-[11px]">\u20B9{currentPatient.fee_amount} {currentPatient.payment_mode} \u2713</span></div></div>
      <div onClick={() => setShowHistory(true)} className="rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition"><div className="flex items-center gap-1.5 truncate"><span className="text-amber-600">\u26A0</span><span className="font-bold">Visit #{currentPatient.token_number} \u00b7 {currentPatient.symptoms_description || "Routine follow-up"}</span></div><span className="font-bold text-[10px] text-amber-700 dark:text-amber-300 underline shrink-0">History \u2192</span></div>
      <Card variant="elevated">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3 dark:border-white/[0.08]"><div className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" /><span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">Vitals & Safety</span></div><span className="text-[10px] text-[#86868B] dark:text-[#636366]">Enter before SOAP note</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><VitalsField label="Systolic BP" value={vitals.systolic} onChange={(v) => setVitals((p: any) => ({ ...p, systolic: v }))} unit="mmHg" /><VitalsField label="Diastolic BP" value={vitals.diastolic} onChange={(v) => setVitals((p: any) => ({ ...p, diastolic: v }))} unit="mmHg" /><VitalsField label="Heart Rate" value={vitals.heartRate} onChange={(v) => setVitals((p: any) => ({ ...p, heartRate: v }))} unit="bpm" /><VitalsField label="SpO\u2082" value={vitals.spo2} onChange={(v) => setVitals((p: any) => ({ ...p, spo2: v }))} unit="%" /><VitalsField label="Temperature" value={vitals.temperature} onChange={(v) => setVitals((p: any) => ({ ...p, temperature: v }))} unit="\u00B0F" /><VitalsField label="Weight" value={vitals.weight} onChange={(v) => setVitals((p: any) => ({ ...p, weight: v }))} unit="kg" /><VitalsField label="Height" value={vitals.height} onChange={(v) => setVitals((p: any) => ({ ...p, height: v }))} unit="cm" /></div>
        {height > 0 && weight > 0 && <div className="flex flex-col justify-end"><div className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">BMI</div><div className="text-sm font-bold font-mono text-[#1D1D1F] dark:text-white">{bmi.toFixed(1)}</div></div>}
        {sys > 0 && dia > 0 && hr > 0 && spo2 > 0 && temp > 0 && weight > 0 && height > 0 && <VitalsAlert sys={sys} dia={dia} hr={hr} spo2={spo2} temp={temp} bmi={bmi} />}
      </Card>
      <Card variant="elevated" className="flex flex-col">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3 dark:border-white/[0.08]"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" /><span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">SOAP Clinical Note</span></div><span className="text-[10px] text-[#86868B] dark:text-[#636366]">Subjective \u2022 Objective \u2022 Assessment \u2022 Plan</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5"><label className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">S \u00b7 Subjective (Chief Complaint)</label><textarea value={soap.subjective} onChange={(e) => setSoap((p: any) => ({ ...p, subjective: e.target.value }))} placeholder={currentPatient.symptoms_description || "e.g. Acne flare on cheeks & jawline for 2 weeks."} rows={4} className="w-full rounded-xl border bg-[#F5F6F9] px-3 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3] resize-none" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">O \u00b7 Objective (Vitals & Findings)</label><textarea value={soap.objective} onChange={(e) => setSoap((p: any) => ({ ...p, objective: e.target.value }))} placeholder="Vitals entered above. Physical findings go here." rows={4} className="w-full rounded-xl border bg-[#F5F6F9] px-3 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3] resize-none" /></div>
          <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">A \u00b7 Assessment (Provisional Diagnosis)</label><textarea value={soap.assessment} onChange={(e) => setSoap((p: any) => ({ ...p, assessment: e.target.value }))} placeholder="e.g. Acne Vulgaris Grade II Papulopustular \u2014 follow-up visit" rows={3} className="w-full rounded-xl border bg-[#F5F6F9] px-3 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3] resize-none" /></div>
          <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#A1A1A6] uppercase tracking-wider">P \u00b7 Plan (Treatment & Advice)</label><textarea value={soap.plan} onChange={(e) => setSoap((p: any) => ({ ...p, plan: e.target.value }))} placeholder="e.g. Continue current Rx. Avoid comedogenic products. SPF 30 morning. Review in 2 weeks." rows={3} className="w-full rounded-xl border bg-[#F5F6F9] px-3 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3] resize-none" /></div>
        </div>
      </Card>
      <Card variant="elevated">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3 dark:border-white/[0.08]"><div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" /><span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">Speed Rx Pad (NMC Generic)</span></div><span className="text-[10px] text-[#86868B] dark:text-[#636366]">1-tap generic molecules</span></div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {SPEED_RX_MOLECULES.map((m, i) => {
            const isAdded = speedRx.some((r) => r.generic === m.generic);
            const btnClass = isAdded ? "bg-emerald-600 border-emerald-600 text-white" : "border-white/[0.06] bg-[#F5F6F9] text-[#1D1D1F] hover:border-[#0071E3] hover:bg-white/[0.05] dark:border-white/[0.08] dark:bg-[#2C2C2E] dark:text-white";
            return <button key={i} type="button" onClick={() => addMolecule(m)} disabled={isAdded} className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${btnClass}`}>+ {m.brand}</button>;
          })}
        </div>
        <div className="space-y-1.5">
          {speedRx.map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#F5F6F9] p-2.5 dark:bg-[#121316] border border-white/[0.04] dark:border-white/[0.06]"><div className="flex items-center gap-2 min-w-0"><span className="font-bold text-sm text-[#1D1D1F] dark:text-white truncate">{item.form}. {item.generic}</span><div className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1"><span>Dosage: {item.dose}</span><span>\u2022</span><span>Duration: {item.days}</span></div></div><button type="button" onClick={() => removeMolecule(i)} className="text-slate-400 hover:text-rose-500 p-1"><X className="h-3.5 w-3.5" /></button></div>
          ))}
          {speedRx.length === 0 && <div className="py-4 text-center text-xs text-[#86868B]">Tap a molecule to add.</div>}
        </div>
      </Card>
      {speedRx.length > 0 && <MedicineSchedule medicines={speedRx.map((m) => ({ generic: m.generic, form: m.form, dose: m.dose, days: m.days }))} />}
      <div className="pt-2 border-t border-white/[0.06] dark:border-white/[0.08] space-y-2"><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => window.print()} className="text-xs py-2.5"><Printer className="h-3.5 w-3.5 text-blue-600" /><span>Print \u211E Slip</span></Button><Button variant="outline" onClick={() => showToast(`Cryptographic \u211E PDF dispatched to ${currentPatient.patient_phone} via WhatsApp`)} className="text-xs py-2.5"><Send className="h-3.5 w-3.5 text-emerald-600" /><span>WhatsApp \u211E PDF</span></Button></div><Button variant="success" className="w-full py-3" onClick={handleCompleteVisit}><CheckCircle2 className="h-4 w-4" /><span>Complete Visit & Call Next \u2192</span></Button></div>
    </div>
  );
}



