"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Calendar,
  Clock,
  Stethoscope,
  IndianRupee,
  QrCode,
  Printer,
  Sparkles,
  Lock,
  Activity,
  RefreshCw,
  Ticket,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// API helpers (public, no auth)
// ─────────────────────────────────────────────────────────

const API = {
  get: async (path: string) => {
    const res = await fetch(path);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  post: async (path: string, body: any) => {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Check-in failed");
    }
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Doctor = {
  id: string;
  slug: string;
  full_name: string;
  specialization: string;
  consultation_fee: number;
  chamber_name: string;
};

type Step = "welcome" | "phone" | "details" | "doctor" | "confirm";

const STEP_LABELS: Record<Step, string> = {
  welcome: "Welcome",
  phone: "Mobile Number",
  details: "Your Details",
  doctor: "Choose Doctor",
  confirm: "Your Token",
};

// ─────────────────────────────────────────────────────────
// Audio chime
// ─────────────────────────────────────────────────────────

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
// Big touch-friendly button
// ─────────────────────────────────────────────────────────

function KioskButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  fullWidth = true,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const base = "rounded-2xl px-8 py-4 text-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700 dark:bg-indigo-600",
    secondary: "bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50 dark:bg-[#1C1C1E] dark:text-indigo-400 dark:border-indigo-400 dark:hover:bg-indigo-900/20",
    outline: "bg-white text-[#1D1D1F] border border-black/[0.1] hover:bg-gray-50 dark:bg-[#1C1C1E] dark:text-white dark:border-white/[0.1] dark:hover:bg-white/[0.05]",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Progress stepper
// ─────────────────────────────────────────────────────────

const STEP_ORDER: Step[] = ["welcome", "phone", "details", "doctor", "confirm"];

function Stepper({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-between mb-8 px-4">
      {STEP_ORDER.map((step, idx) => {
        const isDone = STEP_ORDER.indexOf(currentStep) > idx;
        const isActive = step === currentStep;
        return (
          <div key={step} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              isDone
                ? "bg-emerald-600 text-white"
                : isActive
                ? "bg-indigo-600 text-white shadow-indigo-600/40"
                : "bg-gray-100 text-gray-400 dark:bg-white/[0.05] dark:text-gray-500"
            }`}>
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              isDone
                ? "text-emerald-600 dark:text-emerald-400"
                : isActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400 dark:text-gray-500"
            }`}>
              {STEP_LABELS[step]}
            </span>
            {idx < STEP_ORDER.length - 1 && (
              <div className={`w-px h-3 ${
                isDone ? "bg-emerald-600" : "bg-gray-200 dark:bg-white/[0.1]"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Kiosk Page
// ─────────────────────────────────────────────────────────

export default function CheckInKioskPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [clinicSlug, setClinicSlug] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Phone step
  const [phone, setPhone] = useState("");
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [phoneFeedback, setPhoneFeedback] = useState<string | null>(null);

  // Details step
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [complaint, setComplaint] = useState("");

  // Doctor step
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash">("upi");

  // Confirm step
  const [tokenResult, setTokenResult] = useState<any>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // ── Init: read clinic from URL ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("clinic") || "";
    if (slug) {
      setClinicSlug(slug);
      loadDoctors(slug);
    }
  }, []);

  const loadDoctors = useCallback(async (slug: string) => {
    setLoadingDoctors(true);
    try {
      const data = await API.get(`/api/check-in/public?clinic_slug=${encodeURIComponent(slug)}`);
      setClinicName(data.clinic?.name || "Clinic");
      setDoctors(data.doctors || []);
    } catch (err: any) {
      console.error("Failed to load doctors:", err);
    } finally {
      setLoadingDoctors(false);
    }
  }, []);

  // ── Phone lookup ──
  const handlePhoneChange = async (value: string) => {
    setPhone(value);
    const clean = value.replace(/\D/g, "").slice(-10);
    if (clean.length === 10) {
      setSearchingPhone(true);
      setPhoneFeedback("Checking your records…");
      try {
        // Try public patient lookup (we use the same endpoint; if it requires auth,
        // we fall back gracefully and treat as new patient)
        const res = await fetch(`/api/patients/${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          const profile = data.patientProfile;
          if (profile?.full_name) {
            setFoundPatient(profile);
            setName(profile.full_name || "");
            setPhoneFeedback(`Welcome back, ${profile.full_name}!`);
          } else {
            setFoundPatient(null);
            setPhoneFeedback("New patient — please enter your details below.");
          }
        } else {
          setFoundPatient(null);
          setPhoneFeedback("New patient — please enter your details below.");
        }
      } catch {
        setFoundPatient(null);
        setPhoneFeedback("New patient — please enter your details below.");
      } finally {
        setSearchingPhone(false);
      }
    } else {
      setFoundPatient(null);
      setPhoneFeedback(null);
    }
  };

  // ── Check-in ──
  const handleCheckIn = async () => {
    if (!clinicSlug || !selectedDoctor || !name || !phone || !paymentMode) return;
    setCheckingIn(true);
    setCheckInError(null);
    try {
      const clean = phone.replace(/\D/g, "").slice(-10);
      const data = await API.post("/api/check-in/public", {
        clinic_slug: clinicSlug,
        doctor_slug: selectedDoctor.slug,
        patient_name: name.trim(),
        patient_phone: clean,
        age: age || null,
        gender: gender || null,
        complaint: complaint || null,
        payment_mode: paymentMode,
      });
      setTokenResult(data);
      playCheckInChime();
      setStep("confirm");
    } catch (err: any) {
      setCheckInError(err.message || "Check-in failed. Please ask the receptionist for help.");
    } finally {
      setCheckingIn(false);
    }
  };

  // ── Reset ──
  const resetCheckIn = () => {
    setStep("welcome");
    setPhone("");
    setName("");
    setAge("");
    setGender("");
    setComplaint("");
    setSelectedDoctor(null);
    setPaymentMode("upi");
    setTokenResult(null);
    setFoundPatient(null);
    setPhoneFeedback(null);
    setCheckInError(null);
  };

  const formattedPhone = phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* ── Header ── */}
      <header className="border-b border-black/[0.06] bg-white/90 dark:border-white/[0.08] dark:bg-black/90 sticky top-0 z-20 backdrop-blur px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-[#1D1D1F] dark:text-white tracking-tight">DocSphere</span>
              <span className="text-[10px] text-[#86868B] dark:text-[#636366]">Self Check-in Kiosk</span>
            </div>
          </Link>

          {clinicSlug && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.05]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[#1D1D1F] dark:text-white font-semibold">Clinic Open</span>
              </div>
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">{clinicName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-6">
        {/* ── Progress Stepper ── */}
        {step !== "welcome" && <Stepper currentStep={step} />}

        {/* ── Step Content ── */}
        {step === "welcome" && (
          <div className="text-center py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 mx-auto mb-6 shadow-indigo-600/20">
              <Activity className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white mb-2">Welcome</h1>
            <p className="text-lg text-[#6E6E73] dark:text-[#A1A1A6] mb-8">
              Check yourself in for your appointment. Skip the queue — get your token in seconds.
            </p>

            <div className="flex flex-col items-center gap-4">
              <div className="relative w-full max-w-md">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" />
                <input
                  type="text"
                  placeholder="Clinic code or name (e.g. derma-care)"
                  value={clinicSlug}
                  onChange={(e) => {
                    setClinicSlug(e.target.value);
                    if (e.target.value) loadDoctors(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-black/[0.08] bg-white px-4 pl-12 py-4 text-lg font-semibold text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                />
                {loadingDoctors && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>
            </div>

            {doctors.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-[#636366] mb-3">
                  Available doctors at {clinicName}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctors.map((d) => (
                    <button
                      key={d.slug}
                      onClick={() => {
                        setSelectedDoctor(d);
                        setStep("phone");
                      }}
                      className="w-full rounded-2xl border border-black/[0.06] bg-white p-4 hover:border-indigo-600/50 hover:shadow-indigo-600/10 transition-all dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#1D1D1F] dark:text-white">{d.full_name}</div>
                          <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">{d.specialization}</div>
                        </div>
                        <span className="rounded-full bg-indigo-600/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          ₹{d.consultation_fee}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-[#86868B] dark:text-[#636366]">
                        {d.chamber_name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ChevronLeft
                onClick={() => setStep("welcome")}
                className="h-5 w-5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#636366] dark:hover:text-white"
              />
              <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">Mobile Number</h2>
            </div>
            <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
              Enter your mobile number. If you've visited before, we'll pull up your records.
            </p>

            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" />
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="98765 43210"
                autoFocus
                className="w-full rounded-2xl border border-black/[0.08] bg-white pl-14 pr-4 py-4 text-xl font-mono font-semibold text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
              />
            </div>

            {phone.length >= 10 && phone.length <= 13 && (
              <KioskButton
                variant="secondary"
                onClick={() => {
                  const clean = phone.replace(/\D/g, "").slice(-10);
                  if (clean.length === 10) setStep("details");
                }}
                disabled={phone.replace(/\D/g, "").length < 10}
              >
                {searchingPhone ? <RefreshCw className="h-5 w-5 animate-spin mr-2" /> : null}
                Continue
              </KioskButton>
            )}

            {searchingPhone && (
              <div className="rounded-xl border border-indigo-600/20 bg-indigo-50/40 p-3 dark:bg-indigo-950/20 dark:border-indigo-900/30">
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 animate-pulse">
                  <Activity className="h-3 w-3" />
                  <span>Checking your records…</span>
                </div>
              </div>
            )}

            {phoneFeedback && (
              <div className={`rounded-xl p-3 text-xs ${
                foundPatient
                  ? "bg-emerald-50/40 border border-emerald-500/20 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-300"
                  : "bg-blue-50/40 border border-blue-500/20 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-300"
              }`}>
                {phoneFeedback}
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ChevronLeft
                onClick={() => setStep("phone")}
                className="h-5 w-5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#636366] dark:hover:text-white"
              />
              <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">Your Details</h2>
            </div>
            <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
              {foundPatient ? "Confirm your details before check-in." : "Please enter your details for your first visit."}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  defaultValue={foundPatient?.full_name || ""}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-lg text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="30"
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-lg text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-lg text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6] mb-1">
                  Reason for Visit
                </label>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="e.g. Skin rash, fever, follow-up"
                  rows={3}
                  className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-lg text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <KioskButton
                variant="outline"
                onClick={() => setStep("phone")}
              >
                Back
              </KioskButton>
              <KioskButton
                variant="primary"
                onClick={() => {
                  if (!name) return;
                  setStep("doctor");
                }}
                disabled={!name}
              >
                Next
              </KioskButton>
            </div>
          </div>
        )}

        {step === "doctor" && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ChevronLeft
                onClick={() => setStep("details")}
                className="h-5 w-5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#636366] dark:hover:text-white"
              />
              <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">Choose Doctor</h2>
            </div>
            <p className="text-[#6E6E73] dark:text-[#A1A1A6]">
              Select the doctor you want to see. Fees shown are for today's consultation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((d) => {
                const isSelected = selectedDoctor?.slug === d.slug;
                return (
                  <button
                    key={d.slug}
                    onClick={() => setSelectedDoctor(isSelected ? null : d)}
                    className={`w-full rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/40 dark:border-indigo-400 dark:bg-indigo-900/20 shadow-indigo-600/10"
                        : "border-black/[0.06] bg-white hover:border-indigo-600/50 dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#1D1D1F] dark:text-white">{d.full_name}</div>
                        <div className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">{d.specialization}</div>
                        <div className="mt-1 text-[11px] text-[#86868B] dark:text-[#636366]">
                          {d.chamber_name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-indigo-600 dark:text-indigo-400">₹{d.consultation_fee}</div>
                        <div className="text-[10px] text-[#86868B] dark:text-[#636366]">consultation</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/20">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-xs font-bold">Selected</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-indigo-600/20 bg-indigo-50/40 p-3 dark:bg-indigo-950/20 dark:border-indigo-900/30">
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                <Lock className="h-3 w-3" />
                <span>Payment</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMode === "upi"}
                    onChange={() => setPaymentMode("upi")}
                    className="rounded border-indigo-600 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-xs font-semibold">UPI / Soundbox</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={paymentMode === "cash"}
                    onChange={() => setPaymentMode("cash")}
                    className="rounded border-amber-600 text-amber-600 focus:ring-amber-600"
                  />
                  <span className="text-xs font-semibold">Cash at Counter</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <KioskButton
                variant="outline"
                onClick={() => setStep("details")}
              >
                Back
              </KioskButton>
              <KioskButton
                variant="primary"
                onClick={handleCheckIn}
                disabled={checkingIn || !selectedDoctor}
              >
                {checkingIn ? <Activity className="h-5 w-5 animate-spin mr-2" /> : null}
                Get My Token
              </KioskButton>
            </div>

            {checkInError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-50/30 p-3 text-xs text-rose-700 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                {checkInError}
              </div>
            )}
          </div>
        )}

        {step === "confirm" && tokenResult && (
          <div className="text-center py-12">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 mx-auto mb-6 shadow-emerald-500/20">
              <Ticket className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black text-[#1D1D1F] dark:text-white mb-2">You're Checked In!</h1>
            <p className="text-lg text-[#6E6E73] dark:text-[#A1A1A6] mb-8">
              Your token has been generated. Please wait in the lounge.
            </p>

            {/* Token Card */}
            <div className="rounded-3xl border-2 border-black p-8 dark:border-white bg-white dark:bg-[#1C1C1E] shadow-2xl mx-auto max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  {tokenResult.appointment.clinic_name}
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  TODAY
                </span>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-[10px] font-bold uppercase text-[#6E6E73] dark:text-[#A1A1A6]">
                    Doctor
                  </div>
                  <div className="text-lg font-bold text-[#1D1D1F] dark:text-white">
                    {tokenResult.appointment.doctor_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase text-[#6E6E73] dark:text-[#A1A1A6]">
                    Fee
                  </div>
                  <div className="text-lg font-bold text-[#1D1D1F] dark:text-white">
                    ₹{tokenResult.appointment.fee_amount}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-black/20 pt-6 dark:border-white/[0.1]">
                <div className="flex flex-col items-center">
                  <div className="text-[10px] font-bold uppercase text-[#6E6E73] dark:text-[#A1A1A6]">
                    Your Token
                  </div>
                  <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    #{tokenResult.appointment.token_number}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[10px] font-bold uppercase text-[#6E6E73] dark:text-[#A1A1A6]">
                    Status
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Waiting
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="mt-6 flex flex-col items-center">
                <QrCodeDisplay
                  value={`https://medic-sept-2026.vercel.app/waiting-room?clinic=${clinicSlug}&token=${tokenResult.appointment.token_number}`}
                  size={160}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  showDownloadBtn={false}
                  centerBadgeText="TOKEN"
                />
                <p className="mt-2 text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                  Scan to see your place in queue
                </p>
              </div>
            </div>

            {tokenResult.is_free_followup && (
              <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-50/40 p-4 text-center dark:bg-emerald-950/20 dark:border-emerald-900/30">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  🎉 Free Follow-up — within 7 days of your last visit
                </span>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <KioskButton
                variant="outline"
                onClick={() => {
                  window.print();
                }}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Token Slip
              </KioskButton>
              <KioskButton
                variant="secondary"
                onClick={resetCheckIn}
              >
                Check In Another Patient
              </KioskButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// QR Code Display (inline component)
// ─────────────────────────────────────────────────────────

function QrCodeDisplay({
  value,
  size = 128,
  level = "H",
  fgColor = "#000000",
  bgColor = "#FFFFFF",
  showDownloadBtn = false,
  downloadFilename = "qrcode",
  centerBadgeText = "",
}: {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  fgColor?: string;
  bgColor?: string;
  showDownloadBtn?: boolean;
  downloadFilename?: string;
  centerBadgeText?: string;
}) {
  // Simple QR using a data URI via goqr.me API (client-side, no server call)
  // Fallback: render a placeholder if QR lib unavailable
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    // Use the QR server API to generate a QR code image
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&ecc=${level}&color=${fgColor.replace("#", "")}&bgcolor=${bgColor.replace("#", "")}&margin=0`;
    setQrDataUrl(qrUrl);
  }, [value, size, level, fgColor, bgColor]);

  if (!qrDataUrl) return null;

  return (
    <div className="relative inline-block">
      <img
        src={qrDataUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg border border-black/[0.05] dark:border-white/[0.05]"
      />
      {centerBadgeText && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#1D1D1F] dark:bg-[#1C1C1E] dark:text-white border border-black/[0.05] dark:border-white/[0.05] shadow-sm">
          {centerBadgeText}
        </div>
      )}
    </div>
  );
}
