"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Stethoscope,
  ArrowRight,
  FileText,
  Search,
  Volume2,
  AlertCircle,
  Ticket,
  ChevronRight,
} from "lucide-react";
import { getAuthHeaders } from "@/lib/api";
import { resolveSignedInDoctor } from "@/lib/doctor-identity";
import { clinicToday } from "@/lib/clinic-date";

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
    osc2.frequency.setValueAtTime(880.0, now + 0.2);
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

type Doctor = {
  id?: string;
  slug: string;
  full_name: string;
  specialization?: string | null;
  chamber_name?: string | null;
  user_id?: string | null;
  phone?: string | null;
};

type QueueItem = {
  id: string;
  appointment_number: string;
  token_number: number;
  patient_name: string;
  patient_phone: string;
  status: string;
  appointment_date: string;
  time_slot: string;
  fee_amount: number;
  payment_status: string;
  payment_mode: string;
  is_walk_in: boolean;
  doctor_name: string;
  doctor_slug: string;
  symptoms_description?: string | null;
};

const WAITING_STATUSES = new Set(["waiting", "arrived", "booked", "confirmed"]);

async function apiGet(path: string) {
  const res = await fetch(path, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

export default function DoctorConsultIndexPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [calledAlert, setCalledAlert] = useState<string | null>(null);
  const [callingId, setCallingId] = useState<string | null>(null);

  const doctorSlug = doctor?.slug || "";

  const refreshQueue = useCallback(async () => {
    if (!doctorSlug) return;
    try {
      const json = await apiGet(
        `/api/clinic/desk-queue?date=${clinicToday()}`
      );
      const rows: QueueItem[] = Array.isArray(json.queue) ? json.queue : [];
      setQueue(rows.filter((row) => row.doctor_slug === doctorSlug));
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Could not load today's queue.");
    }
  }, [doctorSlug]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await apiGet("/api/auth/me");
        const docs = await apiGet("/api/doctors");
        const list: Doctor[] = Array.isArray(docs) ? docs : docs.doctors || [];
        const matched = resolveSignedInDoctor(me, list);
        if (!mounted) return;
        if (!matched) {
          setError(
            "Your account is not linked to a doctor profile yet. Ask the clinic owner to link your login to your doctor record."
          );
          return;
        }
        setDoctor(matched as Doctor);
      } catch (e: any) {
        if (mounted) {
          setError(
            e?.message ||
              "Could not verify your clinic session. Please sign in again."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!doctorSlug) return;
    refreshQueue();
    const timer = setInterval(refreshQueue, 15000);
    return () => clearInterval(timer);
  }, [doctorSlug, refreshQueue]);

  // Live updates: reception may call a token or register a walk-in.
  useEffect(() => {
    if (!doctorSlug || typeof window === "undefined") return;
    let source: EventSource | null = null;
    try {
      source = new EventSource("/api/clinic/stream");
      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const data = payload?.data || {};
          if (payload.event === "token_called") {
            if (data.doctor_slug && data.doctor_slug !== doctorSlug) return;
            if (data.trigger_chime) playTokenCallChime();
            setCalledAlert(
              `Token #${data.token_number} (${data.patient_display || "patient"}) called into your room.`
            );
            setTimeout(() => setCalledAlert(null), 5000);
            refreshQueue();
          } else if (
            payload.event === "queue_updated" ||
            payload.event === "walk_in_registered" ||
            payload.event === "token_completed"
          ) {
            refreshQueue();
          }
        } catch {}
      };
    } catch {}
    return () => {
      source?.close();
    };
  }, [doctorSlug, refreshQueue]);

  const activePatient = useMemo(
    () => queue.find((q) => q.status === "in_consultation") || null,
    [queue]
  );
  const waitingPatients = useMemo(
    () => queue.filter((q) => WAITING_STATUSES.has(q.status)),
    [queue]
  );

  const handleCallPatient = async (patient: QueueItem) => {
    setCallingId(patient.appointment_number);
    try {
      const res = await fetch("/api/clinic/call-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          appointment_number: patient.appointment_number,
          chamber_name: doctor?.chamber_name || "Chamber 1",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Could not call this token.");
      }
      playTokenCallChime();
      setCalledAlert(
        `Token #${patient.token_number} (${patient.patient_name}) called into consultation.`
      );
      setTimeout(() => setCalledAlert(null), 5000);
      await refreshQueue();
    } catch (e: any) {
      setError(e?.message || "Could not call this token.");
    } finally {
      setCallingId(null);
    }
  };

  const filteredWaiting = waitingPatients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      String(p.patient_name || "").toLowerCase().includes(q) ||
      String(p.patient_phone || "").includes(searchQuery) ||
      String(p.appointment_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/today"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#86868B] hover:text-[#0071E3] transition"
            >
              <span>← Doctor Cockpit</span>
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
                  {doctor
                    ? `${doctor.full_name}${doctor.chamber_name ? ` • ${doctor.chamber_name}` : ""}`
                    : loading
                      ? "Loading…"
                      : "Doctor not linked"}
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
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

        {error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-200">
              {error}
            </span>
          </div>
        )}

        {loading ? (
          <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-12 text-center text-xs text-[#86868B]">
            Loading your consultation room…
          </div>
        ) : !doctor ? null : activePatient ? (
          <div className="rounded-[24px] border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.04] via-white to-white dark:from-emerald-950/20 dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-6 shadow-apple-card relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Currently in consultation
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
                    <span className="text-xs font-mono text-[#0071E3] dark:text-[#2997FF] font-semibold">
                      {activePatient.patient_phone}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-[#1D1D1F]/90 dark:text-white/90">
                    Complaint:{" "}
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {activePatient.symptoms_description || "Not recorded at booking"}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 font-mono text-[11px]">
                    Slot: <strong className="text-[#1D1D1F] dark:text-white">{activePatient.time_slot}</strong>
                  </span>
                  <span className="rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 font-semibold text-[11px]">
                    Fee: ₹{activePatient.fee_amount} ({String(activePatient.payment_status).toUpperCase()})
                  </span>
                  {activePatient.is_walk_in && (
                    <span className="rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 font-semibold text-[11px]">
                      Walk-in
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <Link
                  href={`/dashboard/consult/${activePatient.appointment_number}`}
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
                    disabled={callingId === activePatient.appointment_number}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition disabled:opacity-50"
                    title="Broadcast the token chime again"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Re-Chime</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-8 text-center">
            <UserEmpty />
            <p className="mt-3 text-sm font-semibold text-[#1D1D1F] dark:text-white">
              No patient in the room
            </p>
            <p className="mt-1 text-xs text-[#86868B]">
              Call the next waiting token below when the patient is ready.
            </p>
          </div>
        )}

        {doctor && (
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 py-1.5 pl-8 pr-3 text-xs text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
                />
              </div>
            </div>

            {filteredWaiting.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#86868B]">
                {waitingPatients.length === 0
                  ? "No patients are waiting for you right now. New bookings appear here automatically."
                  : "No waiting patients match your search."}
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {filteredWaiting.map((patient) => (
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
                            {patient.time_slot}
                          </span>
                          {patient.is_walk_in && (
                            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                              WALK-IN
                            </span>
                          )}
                          <span className="text-xs text-[#86868B] font-mono">
                            {patient.patient_phone}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#86868B]">
                          Complaint:{" "}
                          <strong className="text-[#1D1D1F] dark:text-white font-medium">
                            {patient.symptoms_description || "Not recorded at booking"}
                          </strong>
                          {" • "}Fee: ₹{patient.fee_amount} ({String(patient.payment_status).toUpperCase()})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCallPatient(patient)}
                        disabled={callingId === patient.appointment_number}
                        className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 active:scale-95 transition disabled:opacity-50"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>
                          {callingId === patient.appointment_number
                            ? "Calling…"
                            : "Call into Room"}
                        </span>
                      </button>

                      <Link
                        href={`/dashboard/consult/${patient.appointment_number}`}
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
        )}
      </main>
    </div>
  );
}

function UserEmpty() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
      <Stethoscope className="h-6 w-6 text-[#86868B]" />
    </div>
  );
}
