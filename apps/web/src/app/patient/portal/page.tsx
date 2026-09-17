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
import PatientDocumentsManager from "@/components/PatientDocumentsManager";

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
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      {/* 1. TOP PATIENT PORTAL HEADER */}
      <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full p-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-apple-blue text-white shadow-apple-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-[#1D1D1F] dark:text-white">Patient Health Locker</span>
                <span className="ml-2 rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-[10px] font-medium text-apple-teal dark:text-[#30D1BE]">
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
          <div className="rounded-full bg-[#1D1D1F] text-white px-5 py-3 text-xs font-medium shadow-apple-card flex items-center gap-2 animate-in fade-in">
            <Bell className="h-4 w-4 text-apple-amber" />
            <span>{alarmSetMessage}</span>
          </div>
        )}

        {forwardedChemistMsg && (
          <div className="rounded-full bg-emerald-900 text-white px-5 py-3 text-xs font-medium shadow-apple-card flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{forwardedChemistMsg}</span>
          </div>
        )}

        {/* QUICK PATIENT SWITCHER */}
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1D1D1F] dark:text-white">
              Demo Patient Profile Switcher:
            </span>
            <span className="text-[#86868B] text-[11px]">Click to view family health records:</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SEED_PATIENTS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePhoneLookup(p.phone)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition active:scale-95 ${
                  currentPatient.id === p.id
                    ? "bg-apple-blue text-white shadow-apple-sm"
                    : "border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                }`}
              >
                {p.full_name} ({p.gender[0]}, {p.age}y)
              </button>
            ))}
          </div>
        </div>

        {/* PATIENT PROFILE CARD */}
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                  {currentPatient.full_name}
                </h1>
                <span className="rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-xs font-medium text-apple-teal dark:text-[#30D1BE]">
                  Blood Group: {currentPatient.blood_group}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#86868B]">
                Registered Mobile: <strong className="text-[#1D1D1F] dark:text-white font-medium">{currentPatient.phone}</strong> • {currentPatient.age} Years • {currentPatient.gender}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-apple-teal bg-apple-teal/10 px-3.5 py-1.5 rounded-full dark:text-[#30D1BE]">
              <ShieldCheck className="h-4 w-4" />
              <span>DPDP Encrypted Locker</span>
            </div>
          </div>

          {/* ACTIVE CLINICAL FLAGS */}
          <div className="mt-4 flex flex-wrap gap-2.5 text-xs">
            <div className="rounded-full bg-apple-red/10 px-3 py-1 text-apple-red flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Allergies: {currentPatient.chronic_allergies.join(", ") || "None"}</span>
            </div>
            <div className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1 text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5 font-medium">
              <span>Conditions: {currentPatient.known_conditions.join(", ") || "Healthy"}</span>
            </div>
          </div>
        </div>

        {/* ACTIVE PRESCRIPTION HERO CARD */}
        {activeRx && (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
              <div>
                <span className="rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-xs font-semibold text-apple-teal dark:text-[#30D1BE]">
                  Active Digital Prescription
                </span>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                  {activeRx.provisional_diagnosis}
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Prescribed by <strong>{activeRx.doctor_name}</strong> • {activeRx.clinic_name} on {activeRx.visit_date}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/p/${activeRx.prescription_number}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                >
                  <FileText className="h-4 w-4 text-apple-blue" />
                  <span>View Verified PDF</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* MEDICINES & ALARM CONTROLS */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Daily Dosage Schedule & Alarm Reminders
              </span>

              <div className="space-y-2.5">
                {activeRx.medications_summary.map((med, idx) => (
                  <div
                    key={idx}
                    className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-2">
                        <Pill className="h-4 w-4 text-apple-blue" />
                        <span>{med}</span>
                      </div>
                      <div className="text-[11px] text-[#86868B] mt-0.5">
                        Take after food with water. Follow complete prescribed course.
                      </div>
                    </div>

                    <button
                      onClick={() => setMedicationAlarm(med, "09:00 PM (Night)")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue dark:text-sky-300 px-3.5 py-1.5 text-xs font-semibold transition active:scale-95"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Set Daily Alarm</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 1-CLICK PARTNER FULFILLMENT */}
            <div className="rounded-[24px] bg-[#ECEEF2]/70 dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-apple-teal" />
                  <span>Partner Pharmacy & Lab Pickup (Dehradun Network)</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">
                  Forward prescribed generics to Apollo Pharmacy (Rajpur Road) with zero markup or book home blood sample pickup.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => forwardToChemist(activeRx.prescription_number)}
                  className="rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition whitespace-nowrap"
                >
                  Forward to Local Chemist
                </button>
                <button
                  onClick={() => alert("Diagnostic home sample collection requested for Dehradun address!")}
                  className="rounded-full border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition whitespace-nowrap"
                >
                  Book Lab Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MEDICAL DOCUMENTS & LAB REPORTS LOCKER */}
        <PatientDocumentsManager 
          patientPhone={currentPatient.phone}
          patientName={currentPatient.full_name}
        />

        {/* VISIT HISTORY TIMELINE */}
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
            Past Consultation History ({currentPatient.visits.length} Consultations)
          </h3>

          <div className="space-y-3">
            {currentPatient.visits.map(v => (
              <div
                key={v.visit_id}
                className="rounded-[20px] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] p-4 flex items-start justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                    {v.provisional_diagnosis}
                  </div>
                  <div className="text-[11px] text-[#86868B] mt-0.5">
                    Attended by {v.doctor_name} ({v.doctor_specialization}) on {v.visit_date}
                  </div>
                  <div className="mt-2 text-[11px] text-[#86868B]">
                    Medications: {v.medications_summary.join(" • ")}
                  </div>
                </div>

                <Link
                  href={`/p/${v.prescription_number}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1.5 text-xs font-medium text-apple-blue hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
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
