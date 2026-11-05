"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  AlertCircle,
  Clock,
  HeartPulse,
  LayoutList,
  History,
  Volume2,
  RefreshCw,
  UserPlus,
  Phone,
  IndianRupee,
  Users,
  Banknote,
  Lock,
  RotateCw,
  Activity,
  Sparkles,
  ShieldAlert,
  Trash2,
  Edit3,
  Loader2,
  Bell,
  ChevronRight,
  User,
} from "lucide-react";
import {
  Button,
  Card,
  Input,
  Badge,
  Modal,
  SectionHeader,
  DESIGN_TOKENS,
} from "@/components/design-system";
import { ClinicSyncProvider, useClinicSync } from "@/lib/clinic-sync";

// ─────────────────────────────────────────────────────────
// API helpers (public, no auth)
// ─────────────────────────────────────────────────────────

const API = {
  get: async (path: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  post: async (path: string, body: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Request failed");
    }
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type DoctorChamberState = {
  doctorSlug: string;
  doctorName: string;
  specialization: string;
  chamberName: string;
  status: "idle" | "with_patient" | "completed" | "away";
  currentPatient?: {
    tokenNumber: number;
    patientName: string;
    appointmentNumber: string;
  } | null;
  waitingCount: number;
  lastUpdated: string;
};

type QueuePatient = {
  id: string;
  appointment_number: string;
  token_number: number;
  doctor_slug: string;
  patient_name: string;
  patient_phone: string;
  status: "confirmed" | "booked" | "arrived" | "in_consultation" | "completed" | "no_show";
  fee_amount: number;
  payment_status: "paid" | "pending";
  payment_mode: "upi" | "cash";
  symptoms_description?: string;
  time_slot: string;
  is_walk_in: boolean;
};

type ShiftState = {
  isOpen: boolean;
  cashFloat: number;
  openedAt: string | null;
  openedBy: string | null;
};

// ─────────────────────────────────────────────────────────
// Status Chip
// ─────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const variants: Record<string, string> = {
    booked: "bg-blue-50/60 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100/30 dark:border-blue-800/30",
    arrived: "bg-amber-50/60 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-100/30 dark:border-amber-800/30",
    in_consultation: "bg-emerald-50/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-800/30 animate-pulse",
    completed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
    no_show: "bg-rose-50/60 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100/30 dark:border-rose-800/30",
    confirmed: "bg-blue-50/60 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-100/30 dark:border-blue-800/30",
    idle: "bg-emerald-50/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-800/30",
    away: "bg-slate-50/60 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60",
    with_patient: "bg-emerald-50/60 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-100/30 dark:border-emerald-800/30 animate-pulse",
  };
  const labels: Record<string, string> = {
    booked: "Booked",
    arrived: "Arrived",
    in_consultation: "In Chamber",
    completed: "Completed",
    no_show: "No-Show",
    confirmed: "Confirmed",
    idle: "Idle",
    away: "Away",
    with_patient: "With Patient",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${variants[status] || variants.booked}`}>
      {labels[status] || status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Audio
// ─────────────────────────────────────────────────────────

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [[587.33, now], [880, now + 0.18]].forEach(([freq, start]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch {}
}

function playCheckInChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    [[659.25, now], [783.99, now + 0.15], [1046.5, now + 0.3]].forEach(([freq, start]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.8);
    });
  } catch {}
}

// ─────────────────────────────────────────────────────────
// Doctor Card — per-doctor chamber status with actions
// ─────────────────────────────────────────────────────────

type DoctorCardProps = {
  doctor: DoctorChamberState;
  queue: QueuePatient[];
  onCallNext: (patient: QueuePatient) => void;
  onSetAway: (doctor: DoctorChamberState) => void;
  onSetIdle: (doctor: DoctorChamberState) => void;
  onTransfer: (patient: QueuePatient, targetDoctorSlug: string) => void;
};

function DoctorCard({ doctor, queue, onCallNext, onSetAway, onSetIdle, onTransfer }: DoctorCardProps) {
  const docQueue = queue.filter((q) => q.doctor_slug === doctor.doctorSlug);
  const waiting = docQueue.filter((q) => q.status === "arrived" || q.status === "booked" || q.status === "confirmed");
  const inConsult = docQueue.find((q) => q.status === "in_consultation");
  const completed = docQueue.filter((q) => q.status === "completed").length;

  const isAway = doctor.status === "away";
  const isIdle = doctor.status === "idle";
  const isWithPatient = doctor.status === "with_patient";

  return (
    <Card variant="elevated" className="transition-all hover:shadow-xl cursor-pointer">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isAway ? "bg-slate-400" : isWithPatient ? "bg-emerald-500 animate-pulse" : isIdle ? "bg-blue-500" : "bg-slate-400"}`} />
          <span className="font-bold text-xs text-[#1D1D1F] dark:text-white">{doctor.doctorName}</span>
          <span className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">{doctor.specialization}</span>
        </div>
        <StatusChip status={doctor.status} />
      </div>

      {/* Chamber info */}
      <div className="text-[10px] text-[#86868B] dark:text-[#636366] mb-2">
        {doctor.chamberName} • {doctor.doctorSlug.replace(/^dr-/, "").slice(0, 3).toUpperCase()}
      </div>

      {/* Current patient */}
      {inConsult || doctor.currentPatient ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-2 mb-2 dark:bg-emerald-950/20 dark:border-emerald-900/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              {inConsult?.patient_name || doctor.currentPatient?.patientName}
            </span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400">
              #{inConsult?.token_number || doctor.currentPatient?.tokenNumber}
            </span>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            {inConsult?.symptoms_description || "In consultation"}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200/60 bg-slate-50/50 p-2 mb-2 dark:border-slate-800/30 dark:bg-slate-950/30 text-center text-[10px] text-slate-400 dark:text-slate-500">
          Chamber vacant
        </div>
      )}

      {/* Waiting list */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-[#1D1D1F] dark:text-white uppercase tracking-wider">
            Waiting ({waiting.length})
          </span>
          {waiting.length > 0 && completed > 0 && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{completed} done</span>
          )}
        </div>
        {waiting.length === 0 ? (
          <div className="text-[10px] text-[#86868B] dark:text-[#636366]">None</div>
        ) : (
          waiting.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border p-1.5 text-xs dark:border-white/[0.06]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-[10px] text-[#0071E3] dark:text-[#2997FF]">
                  #{p.token_number}
                </span>
                <span className="font-semibold text-[#1D1D1F] dark:text-white truncate max-w-[80px]">
                  {p.patient_name}
                </span>
                <span className={`text-[10px] font-bold border rounded-full px-1 py-0.5 ${
                  p.payment_status === "paid"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                }`}>
                  {p.payment_status === "paid" ? "Paid" : "Due"}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCallNext(p);
                }}
                className="text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] hover:underline px-1.5 py-0.5"
              >
                Call
              </button>
            </div>
          ))
        )}
      </div>

      {/* Doctor actions */}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {isAway ? (
          <Button variant="success" size="sm" onClick={() => onSetIdle(doctor)} fullWidth>
            Mark Available
          </Button>
        ) : isWithPatient ? (
          <Button variant="secondary" size="sm" onClick={() => onSetAway(doctor)} fullWidth>
            Mark Away
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onSetAway(doctor)} fullWidth>
            Mark Away
          </Button>
        )}
        {waiting.length > 0 && isIdle ? (
          <Button variant="primary" size="sm" onClick={() => onCallNext(waiting[0])} fullWidth>
            Call Next
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Patient Row — unified queue row with actions
// ─────────────────────────────────────────────────────────

type PatientRowProps = {
  patient: QueuePatient;
  doctorName: string;
  onCall: (p: QueuePatient) => void;
  onComplete: (p: QueuePatient) => void;
  onTogglePayment: (p: QueuePatient) => void;
  onNoShow: (p: QueuePatient) => void;
  onTransfer: (p: QueuePatient, targetDoctorSlug: string) => void;
  doctors: DoctorChamberState[];
};

function PatientRow({ patient, doctorName, onCall, onComplete, onTogglePayment, onNoShow, onTransfer, doctors }: PatientRowProps) {
  const targetDoctors = doctors.filter((d) => d.doctorSlug !== patient.doctor_slug && d.status !== "away");
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="group flex items-center justify-between rounded-xl border p-2.5 transition-all hover:border-[#0071E3]/40 dark:hover:border-[#2997FF]/40 dark:bg-[#121316] bg-white dark:border-white/[0.06]">
      {/* Left: patient info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono font-bold text-xs ${
          patient.status === "completed"
            ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            : patient.status === "in_consultation"
            ? "bg-emerald-500 text-white"
            : "bg-[#F5F6F9] text-[#1D1D1F] dark:bg-[#1C1C1E] dark:text-white"
        }`}>
          #{patient.token_number}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white truncate">
            {patient.patient_name}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
            <span>{doctorName}</span>
            <span>•</span>
            <span>{patient.time_slot}</span>
            {patient.is_walk_in && <span className="bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded text-[9px] font-bold">Walk-in</span>}
          </div>
        </div>
      </div>

      {/* Middle: status + payment */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <StatusChip status={patient.status} />
        <button
          onClick={() => onTogglePayment(patient)}
          className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition ${
            patient.payment_status === "paid"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 animate-pulse"
          }`}
          title="Toggle payment"
        >
          {patient.payment_status === "paid" ? "Paid ✓" : "Due ⏳"}
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {patient.status === "arrived" || patient.status === "booked" || patient.status === "confirmed" ? (
          <Button variant="success" size="sm" onClick={() => onCall(patient)} fullWidth>
            <Volume2 className="h-3 w-3" /> Call
          </Button>
        ) : patient.status === "in_consultation" ? (
          <Button variant="success" size="sm" onClick={() => onComplete(patient)} fullWidth>
            <CheckCircle2 className="h-3 w-3" /> Complete
          </Button>
        ) : (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">Done</span>
        )}

        {patient.status !== "completed" && patient.status !== "no_show" && (
          <Button variant="danger" size="sm" onClick={() => onNoShow(patient)} fullWidth>
            <AlertCircle className="h-3 w-3" />
          </Button>
        )}

        {targetDoctors.length > 0 && patient.status !== "completed" && patient.status !== "no_show" ? (
          <Button variant="outline" size="sm" onClick={() => setTransferOpen(true)} fullWidth>
            <ShieldAlert className="h-3 w-3" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Walk-in Check-in Modal
// ─────────────────────────────────────────────────────────

type WalkinModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string; doctorSlug: string; fee: number; paymentMode: "upi" | "cash"; complaint: string }) => void;
  doctors: DoctorChamberState[];
  loading: boolean;
};

function WalkinModal({ open, onClose, onSubmit, doctors, loading }: WalkinModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorSlug, setDoctorSlug] = useState<string | null>(null);
  const [fee, setFee] = useState(600);
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash">("upi");
  const [complaint, setComplaint] = useState("General Consultation");
  const [searching, setSearching] = useState(false);
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableDoctors = doctors.filter((d) => d.status !== "away");

  const handlePhoneChange = async (value: string) => {
    setPhone(value);
    const clean = value.replace(/\D/g, "").slice(-10);
    if (clean.length === 10) {
      setSearching(true);
      setFeedback("Checking patient history…");
      try {
        const res = await fetch(`/api/patients/${clean}`, {
          headers: {
            Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : ""}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const profile = data.patientProfile;
          if (profile?.full_name) {
            setFoundPatient(profile);
            setName(profile.full_name);
            const lastVisit = profile.visits?.[0];
            const visitCount = profile.total_visits || profile.visits?.length || 1;
            if (lastVisit?.visit_date) {
              const daysDiff = (Date.now() - new Date(lastVisit.visit_date).getTime()) / (1000 * 60 * 60 * 24);
              if (daysDiff <= 7) {
                setFee(0);
                setFeedback(`✅ Returning patient — Free follow-up (within 7 days) • ${visitCount} visits`);
              } else if (daysDiff <= 14) {
                setFee(300);
                setFeedback(`✅ Returning patient — ₹300 follow-up • ${visitCount} visits`);
              } else {
                setFee(600);
                setFeedback(`✅ Returning patient — ₹600 consultation • ${visitCount} visits`);
              }
            }
          } else {
            setFoundPatient(null);
            setFeedback("✨ New patient — enter details to create record");
          }
        }
      } catch {
        setFoundPatient(null);
        setFeedback(null);
      } finally {
        setSearching(false);
      }
    } else {
      setFoundPatient(null);
      setFeedback(null);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Walk-in Check-in" size="lg">
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!name || !phone || !doctorSlug) return;
        onSubmit({
          name,
          phone,
          doctorSlug,
          fee,
          paymentMode,
          complaint,
        });
      }} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1 flex items-center gap-2">
            <Phone className="h-3 w-3" />
            1. Patient Mobile Number
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full rounded-xl border border-black/[0.08] bg-white pl-10 pr-4 py-2.5 text-sm font-mono text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
            />
          </div>
        </div>

        {searching && (
          <div className="flex items-center gap-2 text-xs text-[#0071E3] dark:text-[#2997FF] animate-pulse">
            <RotateCw className="h-3 w-3 animate-spin" />
            <span>Checking clinic memory…</span>
          </div>
        )}

        {feedback && (
          <div className={`p-2 rounded-lg border text-xs ${
            foundPatient
              ? "bg-emerald-50/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-blue-50/10 border-blue-500/20 text-blue-700 dark:text-blue-300"
          }`}>
            {feedback}
          </div>
        )}

        <div>
          <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1 flex items-center gap-2">
            <User className="h-3 w-3" />
            2. Patient Full Name{foundPatient && <span className="text-emerald-600 text-[10px] font-bold ml-1">(from records)</span>}
          </label>
          <input
            type="text"
            required
            disabled={!!foundPatient}
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Consultation Fee</label>
            <input
              type="number"
              required
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm font-mono text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
            />
          </div>
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value as any)}
              className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
            >
              <option value="upi">UPI (Soundbox)</option>
              <option value="cash">Counter Cash</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">3. Assign Doctor</label>
          <select
            required
            value={doctorSlug || ""}
            onChange={(e) => setDoctorSlug(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
          >
            <option value="">Select chamber…</option>
            {availableDoctors.map((d) => (
              <option key={d.doctorSlug} value={d.doctorSlug}>
                {d.doctorName} — {d.chamberName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Chief Complaint</label>
          <input
            type="text"
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="e.g. Skin rash, fever, follow-up"
            className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading || !name || !phone || !doctorSlug} fullWidth>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            <span>Generate Token</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// Shift Control Panel
// ─────────────────────────────────────────────────────────

type ShiftPanelProps = {
  shift: ShiftState;
  onOpenShift: (float: number) => void;
  onCloseShift: (countedCash: number) => void;
};

function ShiftPanel({ shift, onOpenShift, onCloseShift }: ShiftPanelProps) {
  const [countedCash, setCountedCash] = useState(shift.cashFloat);

  if (shift.isOpen) {
    return (
      <Card variant="elevated" className="border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/30">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
            <Clock className="h-3 w-3" />
            Shift Open
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            Float: ₹{shift.cashFloat}
          </span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Opened by:</span>
            <span className="text-[#1D1D1F] dark:text-white font-semibold">{shift.openedBy || "Receptionist"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Opened at:</span>
            <span className="text-[#1D1D1F] dark:text-white font-semibold">{shift.openedAt || "—"}</span>
          </div>
        </div>
        <Button variant="danger" onClick={() => onCloseShift(countedCash)} fullWidth>
          Close Shift & Count Cash
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/30">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
          <Lock className="h-3 w-3" />
          Shift Closed
        </span>
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between">
          <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Set cash float:</span>
          <input
            type="number"
            value={countedCash}
            onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
            className="w-20 rounded border border-black/[0.08] bg-white px-2 py-1 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
          />
        </div>
      </div>
      <Button variant="primary" onClick={() => onOpenShift(countedCash)} fullWidth>
        Start Shift
      </Button>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Inner reception content — consumes ClinicSync context
// ─────────────────────────────────────────────────────────

function ReceptionInner() {
  const [doctors, setDoctors] = useState<DoctorChamberState[]>([
    {
      doctorSlug: "dr-rahul-sharma",
      doctorName: "Dr. Rahul Sharma",
      specialization: "Dermatologist",
      chamberName: "Chamber 1 • Room 101",
      status: "idle",
      waitingCount: 0,
      lastUpdated: new Date().toISOString(),
    },
    {
      doctorSlug: "dr-aditi-joshi",
      doctorName: "Dr. Aditi Joshi",
      specialization: "Dental Surgeon",
      chamberName: "Chamber 2 • Dental Chair 1",
      status: "idle",
      waitingCount: 0,
      lastUpdated: new Date().toISOString(),
    },
    {
      doctorSlug: "dr-vikram-sethi",
      doctorName: "Dr. Vikram Sethi",
      specialization: "Pediatrician",
      chamberName: "Chamber 3 • Room 103",
      status: "idle",
      waitingCount: 0,
      lastUpdated: new Date().toISOString(),
    },
  ]);

  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [shift, setShift] = useState<ShiftState>({ isOpen: false, cashFloat: 0, openedAt: null, openedBy: null });
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDoctor, setFilterDoctor] = useState<string | null>(null);

  const { chambers: syncChambers, setChamberStatus, connected } = useClinicSync();

  const displayDoctors = useMemo(() => {
    if (syncChambers.length > 0) return syncChambers;
    return doctors;
  }, [syncChambers, doctors]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadQueue = async () => {
      try {
        const data = await API.get("/api/clinic/desk-queue");
        const q: QueuePatient[] = Array.isArray(data.queue) ? data.queue : [];
        setQueue(q);
      } catch {
        // Keep local mock
      }
    };
    loadQueue();
    const interval = setInterval(loadQueue, 15000);
    return () => clearInterval(interval);
  }, []);

  const TODAY_STR = new Date().toISOString().split("T")[0];
  const waitingCount = queue.filter(
    (q) => q.status === "arrived" || q.status === "booked" || q.status === "confirmed"
  ).length;
  const inConsultCount = queue.filter((q) => q.status === "in_consultation").length;
  const completedCount = queue.filter((q) => q.status === "completed").length;
  const totalCollected = queue
    .filter((q) => q.payment_status === "paid")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  const filteredQueue = queue.filter((p) => {
    if (filterDoctor && p.doctor_slug !== filterDoctor) return false;
    const q = searchQuery.toLowerCase();
    return (
      p.patient_name.toLowerCase().includes(q) ||
      p.patient_phone.includes(q) ||
      String(p.token_number).includes(q) ||
      p.appointment_number.toLowerCase().includes(q)
    );
  });

  const doctorMap = new Map(displayDoctors.map((d) => [d.doctorSlug, d]));

  const handleCallNext = useCallback(
    (patient: QueuePatient) => {
      const doctor = displayDoctors.find((d) => d.doctorSlug === patient.doctor_slug);
      if (!doctor) {
        showToast(`No doctor found for this patient`);
        return;
      }
      playChime();
      showToast(`Calling Token #${patient.token_number} (${patient.patient_name}) to ${doctor.chamberName}`);

      setQueue((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, status: "in_consultation" } : p
        )
      );

      API.post("/api/clinic/call-token", {
        appointment_number: patient.appointment_number,
        chamber_name: doctor.chamberName,
      }).catch(() => {});

      setChamberStatus(doctor.doctorSlug, "with_patient", {
        tokenNumber: patient.token_number,
        patientName: patient.patient_name,
        appointmentNumber: patient.appointment_number,
      });
    },
    [queue, displayDoctors, setChamberStatus, showToast]
  );

  const handleComplete = useCallback(
    (patient: QueuePatient) => {
      setQueue((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, status: "completed" } : p
        )
      );
      API.post("/api/clinic/complete-token", {
        appointment_number: patient.appointment_number,
      }).catch(() => {});
      setChamberStatus(patient.doctor_slug, "idle");
      showToast(`Visit completed for ${patient.patient_name}`);
    },
    [setChamberStatus, showToast]
  );

  const handleTogglePayment = useCallback(
    (patient: QueuePatient) => {
      const nextStatus = patient.payment_status === "paid" ? "pending" : "paid";
      setQueue((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, payment_status: nextStatus } : p
        )
      );
      API.post("/api/clinic/toggle-payment", {
        appointment_number: patient.appointment_number,
        payment_status: nextStatus,
      }).catch(() => {});
      showToast(`Payment marked ${nextStatus} for ${patient.patient_name}`);
    },
    [showToast]
  );

  const handleNoShow = useCallback(
    (patient: QueuePatient) => {
      setQueue((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, status: "no_show" } : p
        )
      );
      showToast(`${patient.patient_name} marked as no-show`);
    },
    [showToast]
  );

  const handleTransfer = useCallback(
    (patient: QueuePatient, targetDoctorSlug: string) => {
      setQueue((prev) =>
        prev.map((p) =>
          p.id === patient.id ? { ...p, doctor_slug: targetDoctorSlug } : p
        )
      );
      const targetDoctor = displayDoctors.find((d) => d.doctorSlug === targetDoctorSlug);
      if (targetDoctor) {
        setChamberStatus(targetDoctor.doctorSlug, targetDoctor.status, targetDoctor.currentPatient);
      }
      showToast(`${patient.patient_name} transferred to ${targetDoctor?.doctorName}`);
    },
    [queue, displayDoctors, setChamberStatus, showToast]
  );

  const handleSetAway = useCallback(
    (doctor: DoctorChamberState) => {
      setChamberStatus(doctor.doctorSlug, "away");
      showToast(`${doctor.doctorName} marked as away`);
    },
    [setChamberStatus, showToast]
  );

  const handleSetIdle = useCallback(
    (doctor: DoctorChamberState) => {
      setChamberStatus(doctor.doctorSlug, "idle");
      showToast(`${doctor.doctorName} marked as available`);
    },
    [setChamberStatus, showToast]
  );

  const handleOpenShift = useCallback((float: number) => {
    setShift({
      isOpen: true,
      cashFloat: float,
      openedAt: new Date().toLocaleString("en-IN"),
      openedBy: "Front Desk",
    });
    showToast(`Shift opened with ₹${float} cash float`);
  }, [showToast]);

  const handleCloseShift = useCallback((counted: number) => {
    setShift({ isOpen: false, cashFloat: 0, openedAt: null, openedBy: null });
    showToast(`Shift closed. Counted: ₹${counted}. Variance: ₹${counted - totalCollected}`);
  }, [totalCollected, showToast]);

  const handleWalkinSubmit = useCallback(
    (data: { name: string; phone: string; doctorSlug: string; fee: number; paymentMode: "upi" | "cash"; complaint: string }) => {
      setWalkinLoading(true);
      API.post("/api/clinic/walk-in", {
        patient_name: data.name,
        patient_phone: data.phone,
        doctor_slug: data.doctorSlug,
        fee_amount: data.fee,
        payment_mode: data.paymentMode,
        symptoms_description: data.complaint,
      })
        .then((res: any) => {
          const newApt = res.appointment || {
            id: `walkin-${Date.now()}`,
            appointment_number: `APT-WALKIN-${Math.floor(Math.random() * 9000) + 1000}`,
            token_number: Math.max(...queue.map((q) => q.token_number), 0) + 1,
            doctor_slug: data.doctorSlug,
            patient_name: data.name,
            patient_phone: data.phone,
            status: "arrived",
            fee_amount: data.fee,
            payment_status: data.paymentMode === "upi" ? "paid" : "pending",
            payment_mode: data.paymentMode,
            symptoms_description: data.complaint,
            time_slot: "Immediate Walk-In",
            is_walk_in: true,
          };
          setQueue((prev) => [...prev, newApt]);
          setChamberStatus(data.doctorSlug, "idle", undefined);
          playCheckInChime();
          showToast(`Token #${newApt.token_number} generated for ${data.name}`);
        })
        .catch(() => {
          showToast("Walk-in check-in failed — using local fallback");
          const newToken = Math.max(...queue.map((q) => q.token_number), 0) + 1;
          setQueue((prev) => [
            ...prev,
            {
              id: `walkin-local-${Date.now()}`,
              appointment_number: `APT-WALKIN-${newToken}`,
              token_number: newToken,
              doctor_slug: data.doctorSlug,
              patient_name: data.name,
              patient_phone: data.phone,
              status: "arrived",
              fee_amount: data.fee,
              payment_status: data.paymentMode === "upi" ? "paid" : "pending",
              payment_mode: data.paymentMode,
              symptoms_description: data.complaint,
              time_slot: "Immediate Walk-In",
              is_walk_in: true,
            },
          ]);
          showToast(`Token #${newToken} generated for ${data.name} (local)`);
        })
        .finally(() => {
          setWalkinLoading(false);
          setWalkinOpen(false);
        });
    },
    [queue, setChamberStatus, showToast]
  );

  return (
    <div className="h-full flex flex-col bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* ── TOP HEADER ── */}
      <header className="h-14 shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-white/90 dark:border-white/[0.08] dark:bg-black/90 sticky top-0 z-20 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-lg p-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition">
            <ChevronLeft className="h-4 w-4 text-[#86868B] dark:text-[#636366]" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-[#1D1D1F] dark:text-white tracking-tight">Reception Command Center</span>
                <span className="text-[10px] text-[#86868B] dark:text-[#636366]">Front Desk · {TODAY_STR}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShiftPanel shift={shift} onOpenShift={handleOpenShift} onCloseShift={handleCloseShift} />
          <Button variant="primary" onClick={() => setWalkinOpen(true)} fullWidth>
            <UserPlus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Walk-in</span>
          </Button>
          <span className="w-px h-4 bg-black/[0.1] dark:bg-white/[0.1]" />
          <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
            connected
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 animate-pulse"
          }`}>
            {connected ? "Live Sync" : "Reconnecting…"}
          </span>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* ── ROW 1: DOCTOR AVAILABILITY BOARD ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {displayDoctors.map((doc) => {
            const docQueue = queue.filter((q) => q.doctor_slug === doc.doctorSlug);
            const waiting = docQueue.filter(
              (q) => q.status === "arrived" || q.status === "booked" || q.status === "confirmed"
            ).length;
            const inConsult = docQueue.find((q) => q.status === "in_consultation");
            return (
              <DoctorCard
                key={doc.doctorSlug}
                doctor={doc}
                queue={queue}
                onCallNext={handleCallNext}
                onSetAway={handleSetAway}
                onSetIdle={handleSetIdle}
                onTransfer={handleTransfer}
              />
            );
          })}
        </div>

        {/* ── ROW 2: METRICS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Card variant="elevated" className="p-4">
            <div className="text-[10px] font-bold uppercase text-[#6E6E73] dark:text-[#A1A1A6] mb-2">Total Queue</div>
            <div className="text-2xl font-black font-mono text-[#1D1D1F] dark:text-white">{queue.length}</div>
          </Card>
          <Card variant="elevated" className="p-4 border-amber-500/30">
            <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 mb-2">Waiting</div>
            <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">{waitingCount}</div>
          </Card>
          <Card variant="elevated" className="p-4 border-emerald-500/30">
            <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-2">In Chamber</div>
            <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">{inConsultCount}</div>
          </Card>
          <Card variant="elevated" className="p-4 border-blue-500/30">
            <div className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 mb-2">Collected</div>
            <div className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400">₹{totalCollected.toLocaleString("en-IN")}</div>
          </Card>
        </div>

        {/* ── ROW 3: UNIFIED PATIENT QUEUE ── */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-0 dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-4 mb-4 px-5 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                Unified Patient Queue ({filteredQueue.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterDoctor || ""}
                onChange={(e) => setFilterDoctor(e.target.value || null)}
                className="rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2 py-1 text-[10px] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
              >
                <option value="">All Doctors</option>
                {displayDoctors.map((d) => (
                  <option key={d.doctorSlug} value={d.doctorSlug}>{d.doctorName}</option>
                ))}
              </select>
              <div className="relative">
                <Activity className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient, token, phone…"
                  className="w-48 rounded-lg border border-black/[0.08] bg-[#F5F6F9] pl-8 pr-2 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-[#0071E3]/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/[0.06] p-12 text-center text-xs text-[#86868B] dark:border-white/[0.06]">
                <Activity className="h-8 w-8 mx-auto mb-2 text-[#86868B] dark:text-[#636366]" />
                <p>No patients in queue.</p>
              </div>
            ) : (
              filteredQueue.map((patient) => {
                const doc = doctorMap.get(patient.doctor_slug);
                return (
                  <PatientRow
                    key={patient.id}
                    patient={patient}
                    doctorName={doc?.doctorName || "Unknown Doctor"}
                    onCall={handleCallNext}
                    onComplete={handleComplete}
                    onTogglePayment={handleTogglePayment}
                    onNoShow={handleNoShow}
                    onTransfer={handleTransfer}
                    doctors={displayDoctors}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Walk-in Modal */}
        {walkinOpen && (
          <WalkinModal
            open={walkinOpen}
            onClose={() => setWalkinOpen(false)}
            onSubmit={handleWalkinSubmit}
            doctors={displayDoctors}
            loading={walkinLoading}
          />
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Reception Command Center — wraps inner content in ClinicSyncProvider
// ─────────────────────────────────────────────────────────

export default function ReceptionCommandCenter() {
  return (
    <ClinicSyncProvider>
      <ReceptionInner />
    </ClinicSyncProvider>
  );
}
