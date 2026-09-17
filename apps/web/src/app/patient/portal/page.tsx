"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SEED_PATIENTS, PatientProfile } from "@/data/patients";
import { 
  Smartphone, 
  Stethoscope, 
  Clock, 
  Calendar, 
  FileText, 
  Pill, 
  Microscope, 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle2, 
  Bell, 
  Download, 
  Share2, 
  Phone, 
  Send,
  AlertCircle,
  ExternalLink,
  Sparkles
} from "lucide-react";

export default function PatientPortalPage() {
  const [phone, setPhone] = useState("+919123456780");
  const [currentPatient, setCurrentPatient] = useState<PatientProfile>(SEED_PATIENTS[0]);
  const [alarmSetMessage, setAlarmSetMessage] = useState<string | null>(null);
  const [forwardedChemistMsg, setForwardedChemistMsg] = useState<string | null>(null);

  const handlePhoneLookup = (targetPhone: string) => {
    setPhone(targetPhone);
    const found = SEED_PATIENTS.find(p => p.phone === targetPhone) || SEED_PATIENTS[0];
    setCurrentPatient(found);
  };

  const setMedicationAlarm = (medicineName: string, timeStr: string) => {
    setAlarmSetMessage(`⏰ Daily alarm configured for ${medicineName} at ${timeStr}`);
    setTimeout(() => setAlarmSetMessage(null), 4000);
  };

  const forwardToChemist = (rxNumber: string) => {
    setForwardedChemistMsg(`💊 Prescription #${rxNumber} routed to Apollo Pharmacy (Rajpur Road). They will prepare generic generic strips for pickup.`);
    setTimeout(() => setForwardedChemistMsg(null), 5000);
  };

  const activeRx = currentPatient.visits[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* 1. TOP PATIENT PORTAL HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Patient Health Locker</span>
                <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Passwordless WhatsApp Portal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 space-y-6">
        {/* TOAST ALERTS */}
        {alarmSetMessage && (
          <div className="rounded-2xl bg-slate-900 p-4 text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-in fade-in">
            <Bell className="h-4 w-4 text-amber-400" />
            <span>{alarmSetMessage}</span>
          </div>
        )}

        {forwardedChemistMsg && (
          <div className="rounded-2xl bg-emerald-900 p-4 text-xs font-bold text-white shadow-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{forwardedChemistMsg}</span>
          </div>
        )}

        {/* QUICK PATIENT SWITCHER */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-brand-800 dark:text-brand-300">
              Demo Patient Profile Switcher:
            </span>
            <span className="text-slate-500 text-[11px]">Click to view family health records:</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEED_PATIENTS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePhoneLookup(p.phone)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  currentPatient.id === p.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {p.full_name} ({p.gender[0]}, {p.age}y)
              </button>
            ))}
          </div>
        </div>

        {/* PATIENT PROFILE CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentPatient.full_name}
                </h1>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Blood Group: {currentPatient.blood_group}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Registered Mobile: <strong>{currentPatient.phone}</strong> • {currentPatient.age} Years • {currentPatient.gender}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              <span>DPDP Encrypted Locker</span>
            </div>
          </div>

          {/* ACTIVE CLINICAL FLAGS */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-1.5 text-rose-700 dark:border-rose-950 dark:bg-rose-950/20 dark:text-rose-300 flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-4 w-4" />
              <span>Allergies: {currentPatient.chronic_allergies.join(", ") || "None"}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 flex items-center gap-1.5">
              <span>Conditions: {currentPatient.known_conditions.join(", ") || "Healthy"}</span>
            </div>
          </div>
        </div>

        {/* ACTIVE PRESCRIPTION HERO CARD */}
        {activeRx && (
          <div className="rounded-3xl border-2 border-brand-500 bg-white p-6 sm:p-8 shadow-xl shadow-brand-600/10 dark:border-brand-900 dark:bg-slate-900 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  Active Digital Prescription
                </span>
                <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                  {activeRx.provisional_diagnosis}
                </h2>
                <p className="text-xs text-slate-500">
                  Prescribed by <strong>{activeRx.doctor_name}</strong> • {activeRx.clinic_name} on {activeRx.visit_date}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/p/${activeRx.prescription_number}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span>View Verified PDF</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* MEDICINES & ALARM CONTROLS */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daily Dosage Schedule & Alarm Reminders
              </span>

              <div className="space-y-2">
                {activeRx.medications_summary.map((med, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Pill className="h-4 w-4 text-brand-600" />
                        <span>{med}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Take after food with water. Follow complete prescribed course.
                      </div>
                    </div>

                    <button
                      onClick={() => setMedicationAlarm(med, "09:00 PM (Night)")}
                      className="inline-flex items-center gap-1 rounded-xl bg-brand-50 border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300 transition"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Set Daily Alarm</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 1-CLICK PARTNER FULFILLMENT */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-950 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>Partner Pharmacy & Lab Pickup (Dehradun Network)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  Forward prescribed generics to Apollo Pharmacy (Rajpur Road) with zero markup or book home blood sample pickup.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => forwardToChemist(activeRx.prescription_number)}
                  className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition whitespace-nowrap"
                >
                  Forward to Local Chemist
                </button>
                <button
                  onClick={() => alert("Diagnostic home sample collection requested for Dehradun address!")}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
                >
                  Book Lab Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISIT HISTORY TIMELINE */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Past Consultation History ({currentPatient.visits.length} Consultations)
          </h3>

          <div className="space-y-3">
            {currentPatient.visits.map(v => (
              <div
                key={v.visit_id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-850 dark:bg-slate-950/30 flex items-start justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {v.provisional_diagnosis}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Attended by {v.doctor_name} ({v.doctor_specialization}) on {v.visit_date}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                    Medications: {v.medications_summary.join(" • ")}
                  </div>
                </div>

                <Link
                  href={`/p/${v.prescription_number}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                >
                  <FileText className="h-3 w-3" />
                  <span>Rx PDF</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
