"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SEED_PATIENTS, PatientProfile } from "@/data/patients";
import { 
  Users, 
  Search, 
  Phone, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  Stethoscope, 
  CheckCircle2, 
  ArrowRight, 
  Share2, 
  HeartHandshake,
  Activity,
  Plus,
  Pill,
  Clock
} from "lucide-react";

export default function DashboardPatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>(SEED_PATIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile>(SEED_PATIENTS[0]);

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.known_conditions.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Patient EMR Directory & Health History
          </h1>
          <p className="text-xs text-slate-500">
            Complete electronic medical records, previous visit notes, and chronic drug allergy flags
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, condition..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN EMR WORKSPACE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: PATIENTS LIST */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Registered Patients ({filteredPatients.length})
          </div>

          <div className="space-y-2">
            {filteredPatients.map(pt => {
              const isSelected = selectedPatient.id === pt.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt)}
                  className={`cursor-pointer rounded-2xl border p-4 transition ${
                    isSelected
                      ? "border-brand-600 bg-white shadow-md shadow-brand-600/10 ring-1 ring-brand-600 dark:bg-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{pt.full_name}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {pt.age}Y • {pt.gender[0]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{pt.phone}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      {pt.total_visits} Visits
                    </span>
                  </div>

                  {pt.chronic_allergies.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{pt.chronic_allergies[0]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CLINICAL EMR PROFILE */}
        <div className="lg:col-span-7 space-y-6">
          {/* Patient Overview Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {selectedPatient.full_name}
                  </h2>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    Blood Group: {selectedPatient.blood_group}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedPatient.gender} • {selectedPatient.age} Years • Registered on {selectedPatient.registered_at}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/consult/APT-DERMA-102?patient=${selectedPatient.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
                >
                  <Stethoscope className="h-4 w-4" /> Start New Consult ℞
                </Link>
              </div>
            </div>

            {/* Medical Alert Flags */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-950 dark:bg-rose-950/20">
                <div className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                  <span>Drug Allergies & Contraindications</span>
                </div>
                <div className="text-rose-700 dark:text-rose-300 text-[11px]">
                  {selectedPatient.chronic_allergies.join(", ") || "No known drug allergies reported."}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-brand-600" />
                  <span>Known Clinical History</span>
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {selectedPatient.known_conditions.join(", ") || "No chronic medical conditions."}
                </div>
              </div>
            </div>

            {/* VISIT TIMELINE */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Previous Consultation Timeline ({selectedPatient.visits.length} Recorded)
              </h3>

              <div className="space-y-4">
                {selectedPatient.visits.map((vis) => (
                  <div
                    key={vis.visit_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{vis.provisional_diagnosis}</span>
                          <span className="text-[10px] font-normal text-slate-500 font-mono">
                            {vis.visit_date}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Attended by: <strong>{vis.doctor_name}</strong> ({vis.doctor_specialization}) • {vis.clinic_name}
                        </div>
                      </div>
                      <Link
                        href={`/p/${vis.prescription_number}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-brand-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Rx PDF</span>
                      </Link>
                    </div>

                    {/* Vitals snapshot */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      <span className="rounded bg-white px-2 py-0.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        BP: {vis.vitals.bp}
                      </span>
                      <span className="rounded bg-white px-2 py-0.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        Pulse: {vis.vitals.pulse} bpm
                      </span>
                      <span className="rounded bg-white px-2 py-0.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        SpO2: {vis.vitals.spo2}%
                      </span>
                      <span className="rounded bg-white px-2 py-0.5 border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                        Wt: {vis.vitals.weight} kg
                      </span>
                    </div>

                    {/* Medications prescribed */}
                    <div className="rounded-xl bg-white p-3 border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-xs">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                        <Pill className="h-3 w-3 text-brand-600" /> Prescribed Medications:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                        {vis.medications_summary.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {vis.followup_advice && (
                      <div className="text-[11px] text-slate-500 italic">
                        Follow-up note: {vis.followup_advice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
