"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { SEED_PATIENTS, PatientProfile } from "@/data/patients";
import { usePatientSession } from "@/lib/patientSession";
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
  Sparkles,
  Ticket,
  Building2,
  MapPin,
  ChevronRight,
  LogOut,
  Search,
  Check
} from "lucide-react";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";
import BackButton from "@/components/BackButton";

export default function PatientPortalPage() {
  const { session, isLoggedIn, logout, login } = usePatientSession();
  
  // State for phone input lookup
  const [lookupPhone, setLookupPhone] = useState("");
  const [phone, setPhone] = useState("+919123456780");
  const [currentPatient, setCurrentPatient] = useState<PatientProfile>(SEED_PATIENTS[0]);
  const [alarmSetMessage, setAlarmSetMessage] = useState<string | null>(null);
  const [forwardedChemistMsg, setForwardedChemistMsg] = useState<string | null>(null);

  // Unique care team / existing doctors from patient's clinical history (Existing Doctor funnel)
  const existingDoctors = useMemo(() => {
    const map = new Map<string, {
      name: string;
      slug: string;
      specialization: string;
      clinic_name: string;
      last_visit_date: string;
    }>();

    for (const v of currentPatient.visits || []) {
      const slug = v.doctor_slug || v.doctor_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!map.has(slug)) {
        map.set(slug, {
          name: v.doctor_name,
          slug: slug,
          specialization: v.doctor_specialization,
          clinic_name: v.clinic_name,
          last_visit_date: v.visit_date
        });
      }
    }
    return Array.from(map.values());
  }, [currentPatient.visits]);

  // Synchronize from live database or session on mount
  useEffect(() => {
    async function syncPatient() {
      const activePhone = session?.phone || phone;
      if (!activePhone) return;

      const cleanPhone = activePhone.replace(/[^0-9]/g, "");
      try {
        const res = await fetch(`/api/patients/${encodeURIComponent(cleanPhone)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.patient && json.patient.visits?.length > 0) {
            setCurrentPatient(json.patient);
            setPhone(json.patient.phone);
            return;
          }
        }
      } catch (e) {
        // Fallback to seed or session
      }

      const match = SEED_PATIENTS.find(p => p.phone.replace(/[^0-9]/g, "") === cleanPhone);
      if (match) {
        setCurrentPatient(match);
      }
    }
    syncPatient();
  }, [session]);

  const handlePhoneLookup = async (targetPhone: string) => {
    setPhone(targetPhone);
    const cleanTarget = targetPhone.replace(/[^0-9]/g, "");

    try {
      const res = await fetch(`/api/patients/${encodeURIComponent(cleanTarget)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.patient) {
          setCurrentPatient(json.patient);
          login({
            id: json.patient.id,
            full_name: json.patient.full_name,
            phone: json.patient.phone,
            age: json.patient.age,
            gender: json.patient.gender,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          });
          return;
        }
      }
    } catch (e) {
      // Fallback
    }

    const found = SEED_PATIENTS.find(p => p.phone.replace(/[^0-9]/g, "") === cleanTarget) || SEED_PATIENTS[0];
    setCurrentPatient(found);
    login({
      id: found.id,
      full_name: found.full_name,
      phone: found.phone,
      age: found.age,
      gender: found.gender,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
    });
  };

  const handleManualPhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupPhone.trim()) {
      handlePhoneLookup(lookupPhone.trim());
      setLookupPhone("");
    }
  };

  const setMedicationAlarm = (medicineName: string, timeStr: string) => {
    setAlarmSetMessage(`⏰ Daily alarm configured for ${medicineName} at ${timeStr}`);
    setTimeout(() => setAlarmSetMessage(null), 4000);
  };

  const forwardToChemist = (rxNumber: string) => {
    setForwardedChemistMsg(`💊 Prescription #${rxNumber} routed to City Care Pharmacy (Rajpur Road). Generic strips will be prepared for pickup.`);
    setTimeout(() => setForwardedChemistMsg(null), 5000);
  };

  const activeRx = currentPatient.visits[0];

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      {/* 1. TOP PATIENT PORTAL HEADER */}
      <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/" label="Back" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-apple-blue text-white shadow-apple-sm">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-[#1D1D1F] dark:text-white">My Prescriptions &amp; Reports</span>
                <span className="ml-2 rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-[10px] font-medium text-apple-teal dark:text-[#30D1BE]">
                  Personal Health Vault
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => logout()}
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1 text-xs font-medium text-[#86868B] hover:text-rose-600 transition"
              >
                <LogOut className="h-3 w-3" /> Switch Patient
              </button>
            )}
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

        {/* =====================================================================
            TODAY'S ACTIVE OPD TOKEN CALLOUT (If booked via JIT flow)
        ===================================================================== */}
        {session?.active_booking && (
          <div className="rounded-[28px] border border-apple-amber/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 p-6 shadow-apple-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white font-mono font-bold text-2xl shadow-sm">
                  #{session.active_booking.token_number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-300">
                      ⚡ Active OPD Live Token
                    </span>
                    <span className="text-[11px] text-[#86868B] font-mono">
                      {session.active_booking.appointment_number}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    Consultation with {session.active_booking.doctor_name}
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    {session.active_booking.clinic_name} • {session.active_booking.clinic_address}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Shift: <strong>{session.active_booking.time_slot}</strong> • Fee: ₹{session.active_booking.fee_amount} (Pay at clinic counter)
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2">
                <Link
                  href={`/book?doctor=${session.active_booking.doctor_slug}`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Track Chamber Queue</span>
                </Link>

                <Link
                  href="/book"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-4 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-black/[0.03] transition"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Book Another Doctor</span>
                </Link>
              </div>
            </div>
          </div>
        )}

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
                Registered WhatsApp: <strong className="text-[#1D1D1F] dark:text-white font-medium">{currentPatient.phone}</strong> • {currentPatient.age} Years • {currentPatient.gender}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-apple-teal bg-apple-teal/10 px-3.5 py-1.5 rounded-full dark:text-[#30D1BE]">
              <ShieldCheck className="h-4 w-4" />
              <span>DPDP Encrypted Vault</span>
            </div>
          </div>

          {/* ACTIVE CLINICAL FLAGS */}
          <div className="mt-4 flex flex-wrap gap-2.5 text-xs">
            <div className="rounded-full bg-apple-red/10 px-3 py-1 text-apple-red flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Allergies: {currentPatient.chronic_allergies.length > 0 ? currentPatient.chronic_allergies.join(", ") : "None Recorded"}</span>
            </div>
            <div className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1 text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-1.5 font-medium">
              <span>Conditions: {currentPatient.known_conditions.length > 0 ? currentPatient.known_conditions.join(", ") : "Healthy Profile"}</span>
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
                Daily Dosage Schedule &amp; Alarm Reminders
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
                      className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue dark:text-sky-300 px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 cursor-pointer"
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
                  <span>Partner Pharmacy &amp; Lab Pickup (Dehradun Network)</span>
                </div>
                <p className="text-[11px] text-[#86868B] mt-0.5">
                  Forward prescribed generics to City Care Pharmacy (Rajpur Road) with zero markup or book home blood sample pickup.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => forwardToChemist(activeRx.prescription_number)}
                  className="rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition whitespace-nowrap cursor-pointer"
                >
                  Forward to Local Chemist
                </button>
                <button
                  onClick={() => alert("Diagnostic home sample collection requested for Dehradun address!")}
                  className="rounded-full border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition whitespace-nowrap cursor-pointer"
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

        {/* =====================================================================
            PATIENT PORTAL: EXISTING DOCTORS (Direct Booking into Doctor's Clinic)
        ===================================================================== */}
        {existingDoctors.length > 0 && (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
              <div>
                <h2 className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-apple-blue" />
                  <span>My ClinicOS Doctors</span>
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Instant 1-click token &amp; follow-up booking directly with your clinic doctors
                </p>
              </div>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
              >
                <Search className="h-3.5 w-3.5 text-apple-teal" />
                <span>Find More Doctors (Discovery)</span>
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {existingDoctors.map((doc) => (
                <div
                  key={doc.slug}
                  className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1D1D1F] dark:text-white">
                        {doc.name}
                      </span>
                      <span className="rounded-full bg-apple-blue/10 px-2 py-0.5 text-[10px] font-semibold text-apple-blue">
                        {doc.specialization}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{doc.clinic_name}</span>
                    </div>
                    <div className="text-[10px] text-[#86868B] mt-0.5">
                      Last Consultation: {doc.last_visit_date}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <Link
                      href={`/book?doctor=${doc.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] py-2 text-xs font-bold text-white shadow-apple-xs transition active:scale-95"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Book Appointment</span>
                    </Link>
                    <Link
                      href={`/doctors/${doc.slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    >
                      <span>Clinic Profile</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISIT HISTORY TIMELINE */}
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4">
          <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
            Past Consultation History ({currentPatient.visits.length} Consultations)
          </h3>

          <div className="space-y-3">
            {currentPatient.visits.map(v => (
              <div
                key={v.visit_id}
                className="rounded-[20px] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/40 border border-black/[0.04] dark:border-white/[0.06] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/p/${v.prescription_number}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1.5 text-xs font-medium text-apple-blue hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Rx PDF</span>
                  </Link>
                  <Link
                    href={`/book?doctor=${v.doctor_slug || 'dr-rahul-sharma'}`}
                    className="inline-flex items-center gap-1 rounded-full bg-apple-blue hover:bg-[#0077ED] px-3 py-1.5 text-xs font-semibold text-white shadow-apple-xs active:scale-95 transition"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>Book Follow-up</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK FAMILY MEMBER SWITCHER & LOOKUP */}
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#1D1D1F] dark:text-white">
              Family Member Health Vault Switcher:
            </span>
            <span className="text-[#86868B] text-[11px]">Instant 1-click passwordless access:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SEED_PATIENTS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePhoneLookup(p.phone)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition active:scale-95 cursor-pointer ${
                  currentPatient.phone === p.phone
                    ? "bg-apple-blue text-white shadow-apple-sm"
                    : "border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                }`}
              >
                {p.full_name} ({p.gender[0]}, {p.age}y)
              </button>
            ))}
          </div>

          {/* Manual Phone Lookup Form */}
          <form onSubmit={handleManualPhoneSubmit} className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-2">
            <input
              type="tel"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              placeholder="Lookup by mobile number (+91 98765 43210)..."
              className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/60 dark:bg-black/40 px-3 py-1.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 font-mono"
            />
            <button
              type="submit"
              className="rounded-xl bg-apple-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0077ED] transition"
            >
              Lookup Vault
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
