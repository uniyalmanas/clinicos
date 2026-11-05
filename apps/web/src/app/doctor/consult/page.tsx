"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Stethoscope, 
  Clock, 
  ArrowRight, 
  UserCheck, 
  Plus, 
  FileText, 
  Search, 
  Phone, 
  CheckCircle2, 
  Activity, 
  Volume2, 
  Sparkles, 
  AlertCircle,
  Building2,
  Calendar,
  Ticket,
  ChevronRight,
  ExternalLink
} from "lucide-react";

// Web Audio API chime generator for calling patient
function playTokenCallChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

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
  } catch (err) {
    console.error("Audio chime error:", err);
  }
}

export default function DoctorConsultIndexPage() {
  const router = useRouter();

  const [queue, setQueue] = useState<any[]>([
    {
      appointment_number: "APT-DERMA-102",
      token_number: 12,
      patient_name: "Priya Singh",
      patient_phone: "+91 91234 56781",
      age: 24,
      gender: "F",
      blood_group: "B+",
      chief_complaint: "Cystic Acne & Facial Erythema",
      status: "in_consultation",
      time_slot: "10:30 AM",
      vitals: { bp: "118/76", pulse: 74, spo2: "99%", temp: "98.4°F" },
      allergies: ["Sulpha Drugs"],
      is_walk_in: false,
      fee_amount: 600,
      payment_status: "paid"
    },
    {
      appointment_number: "APT-DERMA-103",
      token_number: 13,
      patient_name: "Rohit Verma",
      patient_phone: "+91 91234 56782",
      age: 46,
      gender: "M",
      blood_group: "O+",
      chief_complaint: "Hypertension review & rash on forearm",
      status: "waiting",
      time_slot: "10:45 AM",
      vitals: { bp: "138/88", pulse: 82, spo2: "98%", temp: "98.6°F" },
      allergies: ["Penicillin G"],
      is_walk_in: false,
      fee_amount: 600,
      payment_status: "pending"
    },
    {
      appointment_number: "APT-DERMA-104",
      token_number: 14,
      patient_name: "Anjali Kumari",
      patient_phone: "+91 98765 11111",
      age: 29,
      gender: "F",
      blood_group: "A+",
      chief_complaint: "Melasma & Pigmentation Consult",
      status: "waiting",
      time_slot: "11:00 AM",
      vitals: { bp: "112/74", pulse: 70, spo2: "100%", temp: "98.2°F" },
      allergies: [],
      is_walk_in: false,
      fee_amount: 1200,
      payment_status: "pending"
    },
    {
      appointment_number: "APT-WALKIN-105",
      token_number: 15,
      patient_name: "Vikram Pandey",
      patient_phone: "+91 98765 22222",
      age: 35,
      gender: "M",
      blood_group: "O-",
      chief_complaint: "Acute Contact Dermatitis (Cement exposure)",
      status: "waiting",
      time_slot: "11:15 AM",
      vitals: { bp: "124/80", pulse: 78, spo2: "99%", temp: "98.6°F" },
      allergies: [],
      is_walk_in: true,
      fee_amount: 600,
      payment_status: "paid"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [calledAlert, setCalledAlert] = useState<string | null>(null);

  // Active In-Room Patient
  const activePatient = queue.find(q => q.status === "in_consultation") || queue[0];
  const waitingPatients = queue.filter(q => q.status === "waiting");

  // Call patient into room
  const handleCallPatient = (patient: any) => {
    playTokenCallChime();
    setQueue(prev => prev.map(p => {
      if (p.token_number === patient.token_number) {
        return { ...p, status: "in_consultation" };
      }
      if (p.status === "in_consultation") {
        return { ...p, status: "completed" };
      }
      return p;
    }));
    setCalledAlert(`🔔 Token #${patient.token_number} (${patient.patient_name}) called into Consultation Room.`);
    setTimeout(() => setCalledAlert(null), 5000);
  };

  const filteredWaiting = waitingPatients.filter(p =>
    p.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patient_phone.includes(searchQuery) ||
    p.appointment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.chief_complaint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#86868B] hover:text-[#0071E3] transition"
            >
              <span>← Clinic Cockpit</span>
            </Link>
            <div className="h-4 w-px bg-black/[0.08] dark:bg-white/[0.1]" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071E3] text-white">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-[#1D1D1F] dark:text-white">
                  OPD Consultation Hub
                </span>
                <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Dr. Rahul Sharma • Chamber 1
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/consult"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            >
              <FileText className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>Prescriptions Archive</span>
            </Link>

            <Link
              href="/doctor/queue"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            >
              <Ticket className="h-3.5 w-3.5 text-amber-600" />
              <span>Live Queue Console</span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Toast Alert */}
        {calledAlert && (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 shadow-apple-card flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Volume2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {calledAlert}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
              CHIME PLAYED
            </span>
          </div>
        )}

        {/* 1. CURRENTLY IN-ROOM PATIENT (HERO CARD) */}
        {activePatient && (
          <div className="rounded-[24px] border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.04] via-white to-white dark:from-emerald-950/20 dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-6 shadow-apple-card relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    CURRENTLY IN CONSULTATION ROOM 1
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                    Token #{activePatient.token_number}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <h2 className="text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
                      {activePatient.patient_name}
                    </h2>
                    <span className="text-xs font-semibold text-[#86868B]">
                      {activePatient.age} Y / {activePatient.gender} • Blood Group: {activePatient.blood_group}
                    </span>
                    <span className="text-xs font-mono text-[#0071E3] dark:text-[#2997FF] font-semibold">
                      {activePatient.patient_phone}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#1D1D1F]/90 dark:text-white/90">
                    Chief Complaint: <span className="font-semibold text-rose-600 dark:text-rose-400">{activePatient.chief_complaint}</span>
                  </p>
                </div>

                {/* Vitals Strip */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 font-mono text-[11px]">
                    BP: <strong className="text-[#1D1D1F] dark:text-white">{activePatient.vitals.bp}</strong>
                  </span>
                  <span className="rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 font-mono text-[11px]">
                    SpO2: <strong className="text-emerald-600 dark:text-emerald-400">{activePatient.vitals.spo2}</strong>
                  </span>
                  <span className="rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 font-mono text-[11px]">
                    Pulse: <strong className="text-[#1D1D1F] dark:text-white">{activePatient.vitals.pulse} bpm</strong>
                  </span>
                  {activePatient.allergies.length > 0 && (
                    <span className="rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 font-semibold text-[11px]">
                      ⚠️ Allergy: {activePatient.allergies.join(", ")}
                    </span>
                  )}
                  <span className="rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 font-semibold text-[11px]">
                    Fee: ₹{activePatient.fee_amount} ({activePatient.payment_status.toUpperCase()})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <Link
                  href={`/doctor/consult/${activePatient.appointment_number}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] px-6 py-3 text-sm font-bold text-white shadow-apple-sm active:scale-95 transition"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>Open Full Consultation Studio</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/consult/${activePatient.appointment_number}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] active:scale-95 transition"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#0071E3]" />
                    <span>Prescription Studio</span>
                  </Link>
                  <button
                    onClick={() => handleCallPatient(activePatient)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition"
                    title="Broadcast Audio Chime Again"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Re-Chime</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. WAITING PATIENTS IN QUEUE */}
        <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              <h3 className="font-bold text-sm tracking-tight text-[#1D1D1F] dark:text-white">
                Waiting Patients Ready for Consultation ({waitingPatients.length})
              </h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search waiting patient..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 py-1.5 pl-8 pr-3 text-xs text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
              />
            </div>
          </div>

          {filteredWaiting.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868B]">
              No waiting patients match your search.
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {filteredWaiting.map(patient => (
                <div
                  key={patient.appointment_number}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] px-2 rounded-xl transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                      #{patient.token_number}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                          {patient.patient_name}
                        </span>
                        <span className="rounded-md bg-black/[0.04] dark:bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-[#86868B]">
                          {patient.age}Y • {patient.gender}
                        </span>
                        <span className="text-xs text-[#86868B] font-mono">
                          {patient.patient_phone}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[#86868B]">
                        Complaint: <strong className="text-[#1D1D1F] dark:text-white font-medium">{patient.chief_complaint}</strong>
                        {patient.vitals.bp && ` • BP: ${patient.vitals.bp}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCallPatient(patient)}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Call into Room</span>
                    </button>

                    <Link
                      href={`/doctor/consult/${patient.appointment_number}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-1.5 text-xs font-bold text-white shadow-apple-xs active:scale-95 transition"
                    >
                      <span>Start Consult</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
