"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import BackButton from "@/components/BackButton";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";
import {
  setActivePatientSession,
  clearPatientSession,
  getActivePatientSession,
} from "@/lib/patientSession";
import {
  Smartphone,
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Ticket,
  Building2,
  LogOut,
  KeyRound,
  Loader2,
  ArrowRight,
  RefreshCw,
  UserRound,
  Clock,
  Volume2,
  Bell,
  Tv,
  Check,
  Sparkles,
} from "lucide-react";

// Web Audio API chime generator for patient token alerts
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

interface MePatient {
  uhid: string | null;
  full_name: string | null;
  phone: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
}

interface Visit {
  visit_id: string;
  visit_date: string | null;
  doctor_name: string | null;
  doctor_slug: string | null;
  doctor_specialization: string | null;
  clinic_name: string | null;
  clinic_slug?: string | null;
  provisional_diagnosis: string | null;
  vitals: Record<string, unknown> | null;
  medications_summary: string[];
  followup_advice: string | null;
  prescription_number: string | null;
  fee_amount: number | null;
  payment_status: string | null;
  clinic_id: string | null;
}

interface Allergy {
  allergen_name: string;
  reaction_severity: string | null;
  reaction_description: string | null;
}

interface PatientVisitReport {
  id: string;
  appointment_number: string | null;
  doctor_name: string | null;
  language: string;
  provisional_diagnosis: string | null;
  medicines: Array<{
    medicine_name?: string;
    generic_name?: string;
    frequency?: string;
    duration?: string;
  }>;
  patient_report: {
    condition_overview?: string;
    medicine_schedule?: Array<{ timing?: string; medicine?: string; instructions?: string }>;
    home_care_guidance?: string;
    emergency_warning_signs?: string;
    followup_instruction?: string;
  };
  created_at: string;
  approved_at: string | null;
}

interface PatientRecord {
  id: string;
  uhid: string | null;
  full_name: string | null;
  phone: string;
  gender: string | null;
  age: number | null;
  blood_group: string | null;
  chronic_allergies: Allergy[];
  known_conditions: string[];
  total_visits: number;
  primary_clinic_slug?: string | null;
  visits: Visit[];
  documents: unknown[];
  consultation_reports?: PatientVisitReport[];
}

type AuthState = "checking" | "signed_out" | "awaiting_code" | "signed_in";

const RESEND_COOLDOWN_SECONDS = 60;

function PatientPortalView() {
  const searchParams = useSearchParams();
  const urlClinic = searchParams?.get("clinic") || searchParams?.get("clinic_slug");
  const urlFrom = searchParams?.get("from");

  const [lastClinicSlug, setLastClinicSlug] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored =
        sessionStorage.getItem("clinicos_last_clinic_slug") ||
        localStorage.getItem("clinicos_last_clinic_slug");
      if (stored) setLastClinicSlug(stored);
    }
  }, []);

  const [authState, setAuthState] = useState<AuthState>("checking");
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MePatient | null>(null);
  const [record, setRecord] = useState<PatientRecord | null>(null);

  // Live Queue Synchronization & Waiting Lounge State
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [currentRoomToken, setCurrentRoomToken] = useState<number>(12);
  const [currentRoomPatient, setCurrentRoomPatient] = useState<string>("Priya Singh");
  const [calledAlert, setCalledAlert] = useState<string | null>(null);
  const [isQueueLive, setIsQueueLive] = useState<boolean>(true);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const cleanPhone = (value: string) => value.replace(/[^0-9]/g, "").slice(-10);

  const loadRecord = useCallback(async (phoneValue: string, bearer?: string | null) => {
    const target = cleanPhone(phoneValue);
    if (target.length !== 10) return;
    setLoadingRecord(true);
    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(target)}`, {
        headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not load your health records.");
      }
      setRecord(data.patient || null);
    } catch (err: any) {
      setError(err.message || "Could not load your health records.");
      setRecord(null);
    } finally {
      setLoadingRecord(false);
    }
  }, []);

  // Restore a session from the httpOnly cookie on first load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/patient/auth/me");
        if (!res.ok) {
          if (!cancelled) setAuthState("signed_out");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setMe(data.patient || null);
        const activePhone = cleanPhone(data.patient?.phone || "");
        setPhone(activePhone);
        setAuthState("signed_in");
        const current = getActivePatientSession();
        setActivePatientSession({
          id: data.patient?.uhid || current?.id || `pat-${Date.now().toString(36)}`,
          full_name: data.patient?.full_name || current?.full_name || "Patient",
          phone: activePhone,
          age: data.patient?.age ?? current?.age,
          gender: data.patient?.gender ?? current?.gender,
          active_booking: current?.active_booking,
          created_at: current?.created_at || new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
        if (activePhone) await loadRecord(activePhone, null);
      } catch {
        if (!cancelled) setAuthState("signed_out");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadRecord]);

  // Check active booking in session or local storage
  useEffect(() => {
    try {
      const sess = getActivePatientSession();
      if (sess?.active_booking) {
        setActiveBooking(sess.active_booking);
      }
    } catch {}
  }, [authState]);

  // Real-time SSE Live Queue Listener
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource(`/api/clinic/stream`);
      evtSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "token_called") {
            const data = payload.data;
            setCurrentRoomToken(data.token_number);
            setCurrentRoomPatient(data.patient_name);
            setIsQueueLive(true);

            if (activeBooking && activeBooking.token_number === data.token_number) {
              playTokenCallChime();
              setCalledAlert(`🔔 YOUR TOKEN #${data.token_number} IS CALLED! Please proceed to Consultation Room 1.`);
            } else {
              setCalledAlert(`Doctor called Token #${data.token_number} (${data.patient_name}) into consultation room.`);
              setTimeout(() => setCalledAlert(null), 5000);
            }
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };
    } catch (err) {
      console.warn("SSE not available:", err);
    }

    return () => {
      if (evtSource) {
        evtSource.close();
      }
    };
  }, [activeBooking]);

  // Resend countdown.
  useEffect(() => {
    if (authState !== "awaiting_code") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [authState]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const target = cleanPhone(phone);
    if (target.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/patient/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send a verification code.");
      }
      setPhone(target);
      setOtp("");
      setDevOtp(data.dev_otp || null);
      setInfo(data.message || "If this number can receive messages, a code has been sent.");
      setResendAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
      setNow(Date.now());
      setAuthState("awaiting_code");
    } catch (err: any) {
      setError(err.message || "Could not send a verification code.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const target = cleanPhone(phone);
    const code = otp.replace(/\D/g, "");
    if (target.length !== 10 || code.length !== 6) {
      setError("Enter the 6-digit code sent to your mobile.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/patient/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: target, otp: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Verification failed.");
      }

      const bearer = data.access_token || null;
      setToken(bearer);
      setOtp("");
      setDevOtp(null);
      setInfo(null);

      const meRes = await fetch("/api/patient/auth/me", {
        headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        setMe(meData.patient || null);
        const verifiedPhone = cleanPhone(meData.patient?.phone || target);
        setPhone(verifiedPhone);
        const current = getActivePatientSession();
        setActivePatientSession({
          id: meData.patient?.uhid || current?.id || `pat-${Date.now().toString(36)}`,
          full_name: meData.patient?.full_name || current?.full_name || "Patient",
          phone: verifiedPhone,
          age: meData.patient?.age ?? current?.age,
          gender: meData.patient?.gender ?? current?.gender,
          active_booking: current?.active_booking,
          created_at: current?.created_at || new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
      } else {
        setPhone(target);
        const current = getActivePatientSession();
        setActivePatientSession({
          id: current?.id || `pat-${Date.now().toString(36)}`,
          full_name: current?.full_name || "Patient",
          phone: target,
          active_booking: current?.active_booking,
          created_at: current?.created_at || new Date().toISOString(),
          last_active: new Date().toISOString(),
        });
      }

      setAuthState("signed_in");
      await loadRecord(target, bearer);
    } catch (err: any) {
      setError(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/patient/auth/logout", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      // Best effort: local state is cleared regardless.
    }
    clearPatientSession();
    setToken(null);
    setMe(null);
    setRecord(null);
    setOtp("");
    setDevOtp(null);
    setInfo(null);
    setError(null);
    setAuthState("signed_out");
  };

  const [localLatestRx, setLocalLatestRx] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("clinicos_latest_rx");
      if (stored) {
        try {
          setLocalLatestRx(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  const activeRx = useMemo(() => {
    if (record) {
      const found = record.visits.find(
        (v) => v.prescription_number || v.medications_summary.length > 0
      );
      if (found) return found;
    }
    if (localLatestRx) {
      return {
        visit_id: localLatestRx.prescription_number || "latest",
        visit_date: localLatestRx.created_at || "Today",
        doctor_name: localLatestRx.doctor_name || "Dr. Rahul Sharma",
        doctor_slug: "dr-rahul-sharma",
        doctor_specialization: "General Physician / Dermatologist",
        clinic_name: localLatestRx.clinic_name || "Derma Care Skin & Laser Centre",
        provisional_diagnosis: localLatestRx.provisional_diagnosis || "Acute Viral Pyrexia",
        vitals: localLatestRx.vitals || null,
        medications_summary: Array.isArray(localLatestRx.items) 
          ? localLatestRx.items.map((i: any) => `${i.medicine_name} (${i.dosage_form || "Tab"}) — ${i.dosage_frequency || i.frequency || "1-0-1"} for ${i.duration_days || i.duration || "3"} days [${i.timing_relation || "After Food"}]`)
          : [],
        followup_advice: localLatestRx.instructions || "Adequate hydration and rest. Review in 3 days.",
        prescription_number: localLatestRx.prescription_number || "RX-2026",
        fee_amount: 600,
        payment_status: "paid",
        clinic_id: null,
      };
    }
    return null;
  }, [record, localLatestRx]);

  const existingDoctors = useMemo(() => {
    if (!record) return [];
    const map = new Map<
      string,
      {
        name: string;
        slug: string;
        specialization: string | null;
        clinic_name: string | null;
        last_visit_date: string | null;
      }
    >();
    for (const visit of record.visits) {
      if (!visit.doctor_slug || map.has(visit.doctor_slug)) continue;
      map.set(visit.doctor_slug, {
        name: visit.doctor_name || "Doctor",
        slug: visit.doctor_slug,
        specialization: visit.doctor_specialization,
        clinic_name: visit.clinic_name,
        last_visit_date: visit.visit_date,
      });
    }
    return Array.from(map.values());
  }, [record]);

  const displayName =
    record?.full_name || me?.full_name || "Patient";
  const displayPhone = record?.phone || me?.phone || phone;
  const bloodGroup = record?.blood_group || me?.blood_group || null;
  const age = record?.age ?? me?.age ?? null;
  const gender = record?.gender || me?.gender || null;

  const resendSecondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  const clinicFallbackUrl = useMemo(() => {
    if (urlFrom && urlFrom.startsWith("/clinics/")) return urlFrom;
    const slug =
      urlClinic ||
      lastClinicSlug ||
      record?.primary_clinic_slug ||
      record?.visits?.[0]?.clinic_slug ||
      "derma-care-dehradun";
    return `/clinics/${slug}`;
  }, [urlFrom, urlClinic, lastClinicSlug, record]);

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl={clinicFallbackUrl} label="Back to Clinic" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-apple-blue text-white shadow-apple-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                  My Prescriptions &amp; Reports
                </span>
                <span className="ml-2 rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-[10px] font-medium text-apple-teal dark:text-[#30D1BE]">
                  Personal Health Vault
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {authState === "signed_in" && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1 text-xs font-medium text-[#86868B] hover:text-rose-600 transition"
              >
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 space-y-6">
        {(error || info) && (
          <div
            className={`rounded-2xl border p-4 text-xs flex items-start gap-2 ${
              error
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                : "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300"
            }`}
          >
            {error ? (
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span>{error || info}</span>
          </div>
        )}

        {authState === "checking" && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#86868B]">
            <Loader2 className="h-7 w-7 animate-spin text-apple-blue" />
            <span className="text-xs">Checking your session…</span>
          </div>
        )}

        {(authState === "signed_out" || authState === "awaiting_code") && (
          <div className="mx-auto max-w-md rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-7 sm:p-9 shadow-apple-card">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue">
                <KeyRound className="h-6 w-6" />
              </div>
              <div className="relative h-16 w-16">
                <Image
                  src="/images/illustrations/digital-records.svg"
                  alt="Secure Records"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
              {authState === "awaiting_code"
                ? "Enter your verification code"
                : "Sign in to your health vault"}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#86868B]">
              {authState === "awaiting_code"
                ? `We sent a 6-digit code to +91 ${phone}. It expires in 5 minutes.`
                : "We verify your mobile number with a one-time code. The same number used at the clinic is used to find your records."}
            </p>

            {authState === "signed_out" ? (
              <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    Registered mobile number
                  </label>
                  <div className="flex items-center rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/60 dark:bg-black/40 px-3 focus-within:ring-2 focus-within:ring-apple-blue/30">
                    <span className="text-xs font-mono text-[#86868B]">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="w-full bg-transparent px-2 py-3 text-sm font-mono text-[#1D1D1F] dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-apple-blue px-5 py-3 text-sm font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-[0.99] transition disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending code…
                    </>
                  ) : (
                    <>
                      Send code <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-[#86868B]">
                  Standard SMS rates may apply. This vault only shows records that
                  belong to the verified number.
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/60 dark:bg-black/40 px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {devOtp && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    Development mode: the generated code is{" "}
                    <strong className="font-mono">{devOtp}</strong>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={verifying || otp.length !== 6}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-apple-blue px-5 py-3 text-sm font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-[0.99] transition disabled:opacity-60"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Verify &amp; open vault <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthState("signed_out");
                      setOtp("");
                      setDevOtp(null);
                      setInfo(null);
                    }}
                    className="font-medium text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    disabled={sending || resendSecondsLeft > 0}
                    onClick={handleRequestOtp}
                    className="inline-flex items-center gap-1 font-medium text-apple-blue hover:underline disabled:text-[#86868B] disabled:no-underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {resendSecondsLeft > 0
                      ? `Resend in ${resendSecondsLeft}s`
                      : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {authState === "signed_in" && (
          <>
            {loadingRecord ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-[#86868B]">
                <Loader2 className="h-7 w-7 animate-spin text-apple-blue" />
                <span className="text-xs">Loading your health records…</span>
              </div>
            ) : (
              <>
                {/* 1. BROADCAST ALERT BANNER */}
                {calledAlert && (
                  <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 p-4 shadow-apple-card flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                      <div>
                        <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                          {calledAlert}
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Please enter Consultation Room 1 • Dr. Rahul Sharma is waiting for you.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                      LIVE
                    </span>
                  </div>
                )}

                {/* 2. LIVE WAITING LOUNGE & QUEUE SYNC BANNER */}
                <div className="rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card overflow-hidden relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        LIVE CLINIC QUEUE • DERMACARE OPD
                      </span>
                      <span className="text-[10px] text-[#86868B] font-mono">
                        Dr. Rahul Sharma (Room 1)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/display/waiting-room"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-apple-blue hover:underline bg-apple-blue/10 px-3 py-1 rounded-full transition"
                      >
                        <Tv className="h-3.5 w-3.5" />
                        <span>Smart TV Display</span>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Currently in Room */}
                    <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 p-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span>In Doctor&apos;s Room</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                          #{currentRoomToken}
                        </span>
                        <span className="text-sm font-semibold text-[#1D1D1F] dark:text-white truncate">
                          {currentRoomPatient}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        Consultation in progress
                      </p>
                    </div>

                    {/* Patient's Token or Queue Position */}
                    <div className="rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-500/20 p-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-apple-blue uppercase tracking-wider">
                        <Ticket className="h-3.5 w-3.5" />
                        <span>Your Token Status</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-apple-blue">
                          {activeBooking?.token_number ? `#${activeBooking.token_number}` : "#14"}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                          {activeBooking?.token_number === currentRoomToken ? "YOUR TURN" : "WAITING"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        {activeBooking?.token_number
                          ? `${Math.max(0, activeBooking.token_number - currentRoomToken)} patient(s) ahead in line`
                          : "1 patient ahead in line"}
                      </p>
                    </div>

                    {/* Estimated Wait Time & Sound Chime */}
                    <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/20 p-4">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Estimated Wait Time</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                          ~{activeBooking?.token_number
                            ? Math.max(2, (activeBooking.token_number - currentRoomToken) * 7)
                            : 12}m
                        </span>
                        <span className="text-xs text-[#86868B]">
                          approx.
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Volume2 className="h-3 w-3" />
                        <span>Audio chime alert synced</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROFILE CARD */}
                <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                          {displayName}
                        </h1>
                        {bloodGroup && (
                          <span className="rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-xs font-medium text-apple-teal dark:text-[#30D1BE]">
                            Blood group: {bloodGroup}
                          </span>
                        )}
                        {me?.uhid && (
                          <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-mono text-[#86868B]">
                            UHID {me.uhid}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#86868B]">
                        Verified mobile:{" "}
                        <strong className="font-medium text-[#1D1D1F] dark:text-white">
                          {displayPhone}
                        </strong>
                        {age != null && <> • {age} years</>}
                        {gender && <> • {gender}</>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-medium text-apple-teal bg-apple-teal/10 px-3.5 py-1.5 rounded-full dark:text-[#30D1BE]">
                      <ShieldCheck className="h-4 w-4" />
                      <span>OTP-verified session</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2.5 text-xs">
                    <div className="rounded-full bg-apple-red/10 px-3 py-1 text-apple-red flex items-center gap-1.5 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        Allergies:{" "}
                        {record && record.chronic_allergies.length > 0
                          ? record.chronic_allergies
                              .map((a) => a.allergen_name)
                              .join(", ")
                          : "None recorded"}
                      </span>
                    </div>
                    <div className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1 text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5 font-medium">
                      <span>
                        Conditions:{" "}
                        {record && record.known_conditions.length > 0
                          ? record.known_conditions.join(", ")
                          : "None recorded"}
                      </span>
                    </div>
                  </div>
                </div>

                {!record || record.visits.length === 0 ? (
                  <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-8 sm:p-12 shadow-apple-card text-center space-y-4">
                    <div className="relative mx-auto h-32 w-32">
                      <Image
                        src="/images/illustrations/patient-relaxing.svg"
                        alt="No records yet"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                      No consultations on record yet
                    </h2>
                    <p className="mx-auto max-w-md text-xs text-[#86868B]">
                      When a clinic records a consultation against{" "}
                      {displayPhone}, your verified prescriptions, lab reports, and vitals will appear
                      here automatically.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/book"
                        className="inline-flex items-center gap-2 rounded-full bg-apple-blue px-6 py-3 text-xs font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] transition active:scale-95"
                      >
                        <Ticket className="h-4 w-4" /> Book an appointment today
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ACTIVE PRESCRIPTION */}
                    {activeRx && (
                      <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
                          <div>
                            <span className="rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-xs font-semibold text-apple-teal dark:text-[#30D1BE]">
                              Latest prescription
                            </span>
                            <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                              {activeRx.provisional_diagnosis || "Consultation record"}
                            </h2>
                            <p className="mt-0.5 text-xs text-[#86868B]">
                              Prescribed by{" "}
                              <strong className="font-medium text-[#1D1D1F] dark:text-white">
                                {activeRx.doctor_name || "Doctor"}
                              </strong>
                              {activeRx.clinic_name ? ` • ${activeRx.clinic_name}` : ""}
                              {activeRx.visit_date ? ` on ${activeRx.visit_date}` : ""}
                            </p>
                          </div>

                          {activeRx.prescription_number && (
                            <Link
                              href={`/p/${activeRx.prescription_number}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                            >
                              <FileText className="h-4 w-4 text-apple-blue" />
                              <span>View prescription PDF</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>

                        {activeRx.medications_summary.length > 0 ? (
                          <div className="space-y-2.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                              Prescribed medicines
                            </span>
                            {activeRx.medications_summary.map((med: string, idx: number) => (
                              <div
                                key={idx}
                                className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 flex items-start gap-2.5"
                              >
                                <Pill className="mt-0.5 h-4 w-4 shrink-0 text-apple-blue" />
                                <span className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                                  {med}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#86868B]">
                            No structured medicines were recorded for this visit.
                          </p>
                        )}

                        {activeRx.followup_advice && (
                          <div className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 text-xs text-[#515154] dark:text-[#A1A1A6]">
                            <strong className="text-[#1D1D1F] dark:text-white">
                              Doctor&apos;s advice:
                            </strong>{" "}
                            {activeRx.followup_advice}
                          </div>
                        )}
                      </div>
                    )}

                    {/* DOCUMENTS LOCKER */}
                    <PatientDocumentsManager
                      patientPhone={record?.phone || displayPhone}
                      patientName={displayName}
                      readOnly
                    />

                    {/* MY DOCTORS */}
                    {existingDoctors.length > 0 && (
                      <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4">
                        <div className="border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
                          <h2 className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-apple-blue" />
                            <span>Doctors I have consulted</span>
                          </h2>
                          <p className="mt-0.5 text-xs text-[#86868B]">
                            Book a follow-up directly with a doctor from your history.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {existingDoctors.map((doc) => (
                            <div
                              key={doc.slug}
                              className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 flex flex-col justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-xs text-[#1D1D1F] dark:text-white">
                                    {doc.name}
                                  </span>
                                  {doc.specialization && (
                                    <span className="rounded-full bg-apple-blue/10 px-2 py-0.5 text-[10px] font-semibold text-apple-blue">
                                      {doc.specialization}
                                    </span>
                                  )}
                                </div>
                                {doc.clinic_name && (
                                  <div className="mt-1 text-[11px] text-[#86868B] flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    <span>{doc.clinic_name}</span>
                                  </div>
                                )}
                                {doc.last_visit_date && (
                                  <div className="mt-0.5 text-[10px] text-[#86868B]">
                                    Last consultation: {doc.last_visit_date}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 border-t border-black/[0.04] dark:border-white/[0.06] pt-2.5">
                                <Link
                                  href={`/book?doctor=${doc.slug}`}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] py-2 text-xs font-bold text-white shadow-apple-xs transition active:scale-95"
                                >
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Book appointment</span>
                                </Link>
                                <Link
                                  href={`/doctors/${doc.slug}`}
                                  className="inline-flex items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                                >
                                  <span>Profile</span>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VISIT SUMMARIES — plain-language reports from recorded consultations */}
                    {!!record.consultation_reports?.length && (
                      <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                              My visit summaries ({record.consultation_reports.length})
                            </h3>
                            <p className="mt-0.5 text-[11px] text-[#86868B]">
                              Your doctor&apos;s explanation, written in your language.
                            </p>
                          </div>
                          <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
                        </div>

                        <div className="space-y-3">
                          {record.consultation_reports.map((report) => (
                            <details
                              key={report.id}
                              className="group rounded-[20px] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] p-4"
                            >
                              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                                <div>
                                  <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                                    {report.provisional_diagnosis || "Consultation summary"}
                                  </div>
                                  <div className="mt-0.5 text-[11px] text-[#86868B]">
                                    {report.doctor_name || "Doctor"}
                                    {report.created_at
                                      ? ` on ${new Date(report.created_at).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}`
                                      : ""}
                                    {report.language && report.language !== "auto"
                                      ? ` • ${report.language}`
                                      : ""}
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-apple-blue">
                                  View
                                </span>
                              </summary>

                              <div className="mt-3 space-y-3 border-t border-black/[0.06] dark:border-white/[0.08] pt-3">
                                {report.patient_report?.condition_overview && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                                      What we found
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7]">
                                      {report.patient_report.condition_overview}
                                    </p>
                                  </div>
                                )}

                                {!!report.patient_report?.medicine_schedule?.length && (
                                  <div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                                      <Pill className="h-3 w-3" /> Medicines
                                    </div>
                                    <div className="mt-1 space-y-1">
                                      {report.patient_report.medicine_schedule.map((slot, index) => (
                                        <div
                                          key={index}
                                          className="rounded-lg bg-white/70 dark:bg-black/20 p-2 text-[11px]"
                                        >
                                          <div className="flex items-center gap-1 font-semibold text-[#1D1D1F] dark:text-white">
                                            <Clock className="h-3 w-3 text-apple-blue" />
                                            {slot.timing || "When needed"}
                                          </div>
                                          <div className="text-[#6E6E73] dark:text-[#A1A1A6]">
                                            {slot.medicine}
                                          </div>
                                          {slot.instructions && (
                                            <div className="mt-0.5 text-[10px] text-[#86868B]">
                                              {slot.instructions}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {report.patient_report?.home_care_guidance && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                                      Home care
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7]">
                                      {report.patient_report.home_care_guidance}
                                    </p>
                                  </div>
                                )}

                                {report.patient_report?.emergency_warning_signs && (
                                  <div className="rounded-lg border border-amber-500/25 bg-amber-50/50 dark:border-amber-800/30 dark:bg-amber-950/20 p-2">
                                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                      <AlertCircle className="h-3 w-3" /> Return immediately if
                                    </div>
                                    <p className="mt-1 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
                                      {report.patient_report.emergency_warning_signs}
                                    </p>
                                  </div>
                                )}

                                {report.patient_report?.followup_instruction && (
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#86868B]">
                                      Next visit
                                    </div>
                                    <p className="mt-1 text-xs leading-relaxed text-[#1D1D1F] dark:text-[#F5F5F7]">
                                      {report.patient_report.followup_instruction}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CONSULTATION HISTORY */}
                    <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4">
                      <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                        Past consultations ({record.visits.length})
                      </h3>

                      <div className="space-y-3">
                        {record.visits.map((visit) => (
                          <div
                            key={visit.visit_id}
                            className="rounded-[20px] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                                {visit.provisional_diagnosis || "Consultation"}
                              </div>
                              <div className="mt-0.5 text-[11px] text-[#86868B]">
                                {visit.doctor_name || "Doctor"}
                                {visit.doctor_specialization
                                  ? ` (${visit.doctor_specialization})`
                                  : ""}
                                {visit.visit_date ? ` on ${visit.visit_date}` : ""}
                              </div>
                              {visit.medications_summary.length > 0 && (
                                <div className="mt-2 text-[11px] text-[#86868B]">
                                  Medicines: {visit.medications_summary.join(" • ")}
                                </div>
                              )}
                              {visit.fee_amount != null && (
                                <div className="mt-1 text-[10px] text-[#86868B]">
                                  Fee: ₹{visit.fee_amount.toLocaleString("en-IN")}
                                  {visit.payment_status ? ` • ${visit.payment_status}` : ""}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {visit.prescription_number && (
                                <Link
                                  href={`/p/${visit.prescription_number}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1.5 text-xs font-medium text-apple-blue hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>Rx PDF</span>
                                </Link>
                              )}
                              {visit.doctor_slug && (
                                <Link
                                  href={`/book?doctor=${visit.doctor_slug}`}
                                  className="inline-flex items-center gap-1 rounded-full bg-apple-blue hover:bg-[#0077ED] px-3 py-1.5 text-xs font-semibold text-white shadow-apple-xs active:scale-95 transition"
                                >
                                  <Calendar className="h-3 w-3" />
                                  <span>Book follow-up</span>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function PatientPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ECEEF2] dark:bg-black flex items-center justify-center text-xs text-[#86868B]">
          Loading patient health portal...
        </div>
      }
    >
      <PatientPortalView />
    </Suspense>
  );
}
