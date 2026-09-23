"use client";

import React, { useState, useEffect } from "react";
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
  Clock,
  Microscope,
  FolderLock,
  Layers,
  RotateCw
} from "lucide-react";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";
import { API_BASE_URL } from "@/lib/api";

export default function DashboardPatientsPage() {
  const [patients, setPatients] = useState<PatientProfile[]>(SEED_PATIENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile>(SEED_PATIENTS[0]);
  const [activeTab, setActiveTab] = useState<"emr" | "documents">("emr");
  const [isLoading, setIsLoading] = useState(false);

  // Sync real patient EMR records from database
  useEffect(() => {
    async function loadRealPatients() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/patients");
        if (res.ok) {
          const json = await res.json();
          if (json.patients && json.patients.length > 0) {
            setPatients(json.patients);
            setSelectedPatient(json.patients[0]);
          }
        }
      } catch (e) {
        // Fallback to seed
      } finally {
        setIsLoading(false);
      }
    }
    loadRealPatients();
  }, []);

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
          <h1 className="text-xl font-black text-[#1D1D1F] dark:text-white">
            Patient EMR Directory & Health History
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
            Complete electronic medical records, visit notes, diagnostic lab vault, and chronic drug allergy flags
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Search by name, phone, condition..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-[14px] border border-black/[0.08] bg-white py-2 pl-10 pr-3 text-xs text-[#1D1D1F] placeholder-[#86868B] shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN EMR WORKSPACE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: PATIENTS LIST */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-[#86868B] uppercase tracking-wider px-1">
            Registered Patients ({filteredPatients.length})
          </div>

          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredPatients.map(pt => {
              const isSelected = selectedPatient.id === pt.id;
              return (
                <div
                  key={pt.id}
                  onClick={() => setSelectedPatient(pt)}
                  className={`cursor-pointer rounded-[20px] border p-4 transition ${
                    isSelected
                      ? "border-[#0071E3] bg-white shadow-sm ring-2 ring-[#0071E3]/20 dark:bg-[#1C1C1E]"
                      : "border-black/[0.06] bg-white hover:border-black/[0.12] dark:border-white/[0.08] dark:bg-[#1C1C1E]/60 dark:hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                        <span>{pt.full_name}</span>
                        <span className="rounded-[6px] bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]">
                          {pt.age}Y • {pt.gender[0]}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-[#86868B]">
                        <Phone className="h-3 w-3 text-[#86868B]" />
                        <span>{pt.phone}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#0071E3]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                      {pt.total_visits} Visits
                    </span>
                  </div>

                  {pt.chronic_allergies.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold text-[#FF3B30]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>{pt.chronic_allergies[0]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CLINICAL EMR PROFILE & DIAGNOSTIC VAULT */}
        <div className="lg:col-span-7 space-y-6">
          {/* Patient Overview Card */}
          <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] pb-5 dark:border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white">
                    {selectedPatient.full_name}
                  </h2>
                  <span className="rounded-full bg-[#0071E3]/10 px-2.5 py-0.5 text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">
                    Blood Group: {selectedPatient.blood_group}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#86868B]">
                  {selectedPatient.gender} • {selectedPatient.age} Years • Registered {selectedPatient.registered_at}
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/dashboard/consult/APT-DERMA-102?patient=${selectedPatient.id}`}
                  className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
                >
                  <Stethoscope className="h-4 w-4" /> Start New Consult ℞
                </Link>
              </div>
            </div>

            {/* Medical Alert Flags */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-[16px] border border-[#FF3B30]/20 bg-[#FF3B30]/5 p-3.5 dark:border-[#FF3B30]/30">
                <div className="font-bold text-[#FF3B30] flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-[#FF3B30]" />
                  <span>Drug Allergies & Contraindications</span>
                </div>
                <div className="text-[#FF3B30] text-[11px] font-medium">
                  {selectedPatient.chronic_allergies.join(", ") || "No known drug allergies reported."}
                </div>
              </div>

              <div className="rounded-[16px] border border-black/[0.06] bg-[#ECEEF2]/40 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>Known Clinical History</span>
                </div>
                <div className="text-[#86868B] text-[11px]">
                  {selectedPatient.known_conditions.join(", ") || "No chronic medical conditions."}
                </div>
              </div>
            </div>

            {/* Navigation Tabs for Right Pane */}
            <div className="mt-6 flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06]">
              <button
                onClick={() => setActiveTab("emr")}
                className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === "emr"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Consultation Timeline ({selectedPatient.visits.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("documents")}
                className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === "documents"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                <Microscope className="h-3.5 w-3.5" />
                <span>Diagnostic Vault & Lab Reports</span>
              </button>
            </div>

            {/* TAB CONTENT 1: VISIT TIMELINE */}
            {activeTab === "emr" && (
              <div className="mt-5 space-y-4">
                {selectedPatient.visits.map((vis) => (
                  <div
                    key={vis.visit_id}
                    className="rounded-[20px] border border-black/[0.06] bg-[#ECEEF2]/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02] space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <span>{vis.provisional_diagnosis}</span>
                          <span className="text-[10px] font-normal text-[#86868B] font-mono">
                            {vis.visit_date}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#86868B] mt-0.5">
                          Attended by: <strong>{vis.doctor_name}</strong> ({vis.doctor_specialization}) • {vis.clinic_name}
                        </div>
                      </div>
                      <Link
                        href={`/p/${vis.prescription_number}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-[8px] border border-black/[0.08] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0071E3] hover:bg-black/[0.02] dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-[#2997FF]"
                      >
                        <FileText className="h-3 w-3" />
                        <span>View Rx</span>
                      </Link>
                    </div>

                    {/* Vitals snapshot */}
                    <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#86868B]">
                      <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                        BP: {vis.vitals.bp}
                      </span>
                      <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                        Pulse: {vis.vitals.pulse} bpm
                      </span>
                      <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                        SpO2: {vis.vitals.spo2}%
                      </span>
                      <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                        Wt: {vis.vitals.weight} kg
                      </span>
                    </div>

                    {/* Medications prescribed */}
                    <div className="rounded-[14px] bg-white p-3 border border-black/[0.04] dark:bg-[#1C1C1E] dark:border-white/[0.04] text-xs">
                      <div className="text-[11px] font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1 mb-1">
                        <Pill className="h-3 w-3 text-[#0071E3]" /> Prescribed Medications:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#86868B]">
                        {vis.medications_summary.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {vis.followup_advice && (
                      <div className="text-[11px] text-[#86868B] italic">
                        Follow-up note: {vis.followup_advice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT 2: DIAGNOSTIC LAB VAULT & DOCUMENTS */}
            {activeTab === "documents" && (
              <div className="mt-5">
                <PatientDocumentsManager 
                  patientPhone={selectedPatient.phone} 
                  patientName={selectedPatient.full_name} 
                  isDoctorView={true} 
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
