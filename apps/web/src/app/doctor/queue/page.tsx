"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  UserCheck, 
  Clock, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowLeft
} from "lucide-react";

export default function DoctorQueuePage() {
  const [activeDoctor] = useState({
    full_name: "Dr. Rahul Sharma",
    specialization: "Dermatologist",
    clinic_name: "Derma Care Skin & Laser Centre",
    reg_number: "UKMC-8942-2012"
  });

  const activePatient = {
    appointment_number: "APT-DERMA-102",
    token_number: 2,
    patient_name: "Priya Singh",
    patient_phone: "+919123456781",
    patient_age: 24,
    patient_gender: "Female",
    time_slot: "10:30 AM",
    symptoms_description: "Itchy red rashes on forearms and neck for 3 days after applying new cosmetic cream",
    vitals: { bp: "116/74", pulse: 76, temp: 98.6, weight: 58 }
  };

  const upcomingQueue = [
    {
      appointment_number: "APT-DERMA-103",
      token_number: 3,
      patient_name: "Rohit Pant",
      patient_phone: "+919123456782",
      symptoms_description: "Severe hair thinning on crown area and chronic scalp dandruff",
      time_slot: "10:45 AM"
    },
    {
      appointment_number: "APT-WALKIN-104",
      token_number: 4,
      patient_name: "Kavita Joshi",
      patient_phone: "+919876511111",
      symptoms_description: "Facial pigmentation and dark spots around cheekbones",
      time_slot: "11:00 AM (Walk-In)"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  {activeDoctor.full_name}
                </h1>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  Doctor Chamber OPD Console
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {activeDoctor.specialization} • Reg: {activeDoctor.reg_number} • {activeDoctor.clinic_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            OPD Session Active
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* ACTIVE PATIENT HERO CARD */}
        <div className="overflow-hidden rounded-2xl border-2 border-brand-600 bg-white shadow-lg shadow-brand-600/10 dark:bg-slate-900">
          <div className="bg-gradient-to-r from-brand-600 to-teal-700 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 font-black text-xl shadow">
                #{activePatient.token_number}
              </span>
              <div>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Currently in Chamber
                </span>
                <h2 className="text-xl font-black mt-0.5">
                  {activePatient.patient_name}
                </h2>
                <p className="text-xs text-teal-100">
                  {activePatient.patient_age} yrs • {activePatient.patient_gender} • {activePatient.patient_phone}
                </p>
              </div>
            </div>

            <Link
              href={`/doctor/consult/${activePatient.appointment_number}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-brand-700 shadow-md hover:bg-teal-50 transition"
            >
              <FileText className="h-4 w-4 text-brand-600" /> Open Prescription Studio (30s) <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chief Medical Complaint */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Patient Reported Chief Complaint
              </h3>
              <p className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-xs leading-relaxed text-slate-800 dark:border-amber-950 dark:bg-amber-950/20 dark:text-slate-200">
                &ldquo;{activePatient.symptoms_description}&rdquo;
              </p>
            </div>

            {/* Vitals Measured at Reception */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-600" /> Counter Vitals Recorded
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">BP</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activePatient.vitals.bp}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Pulse</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activePatient.vitals.pulse} bpm</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Temp</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activePatient.vitals.temp} °F</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Weight</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activePatient.vitals.weight} kg</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UPCOMING QUEUE IN WAITING LOBBY */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Waiting Lobby Queue ({upcomingQueue.length} Patients)
              </h3>
              <p className="text-xs text-slate-500">Next patients queued by reception desk.</p>
            </div>
            <Link
              href="/clinic/desk"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Open Reception Desk Console
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingQueue.map((item) => (
              <div key={item.appointment_number} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    #{item.token_number}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.patient_name} <span className="text-[11px] font-normal text-slate-500">({item.time_slot})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {item.symptoms_description}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/doctor/consult/${item.appointment_number}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <FileText className="h-3.5 w-3.5 text-brand-600" /> Start Consultation
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
