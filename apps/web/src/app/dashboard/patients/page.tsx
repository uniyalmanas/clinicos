"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Activity,
  Plus,
  Pill,
  Clock,
  Microscope,
  Layers,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  TrendingDown,
  TrendingUp,
  Download,
  X,
  History,
  Scale,
  Sparkles,
  UserCheck
} from "lucide-react";
import { 
  EMRPatient, 
  EMRAllergy, 
  EMRLabResult, 
  EMRClinicalVisit, 
  EMRAuditEntry,
  EMRDuplicateMergeTicket,
  CLINICAL_OVERRIDE_REASON_CODES
} from "@/data/emrGovernance";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";

export default function DashboardPatientsPage() {
  const [patients, setPatients] = useState<EMRPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<EMRPatient | null>(null);
  const [activeTab, setActiveTab] = useState<"visits" | "lab_vault" | "audit_trail" | "documents">("visits");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Safety Workflows
  // Fix 1: Hard-Stop Allergy Modal
  const [prescribeModalOpen, setPrescribeModalOpen] = useState(false);
  const [testDrugInput, setTestDrugInput] = useState("Syrup Amoxyclav 228.5mg");
  const [hardStopAlert, setHardStopAlert] = useState<any | null>(null);
  const [isCheckingAllergy, setIsCheckingAllergy] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReasonCode, setOverrideReasonCode] = useState(CLINICAL_OVERRIDE_REASON_CODES[0].code);
  const [overrideReasonText, setOverrideReasonText] = useState("");
  const [doctorPinInput, setDoctorPinInput] = useState("");

  // Fix 2: Lab Data Ingestion Modal
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [newLabParam, setNewLabParam] = useState("HbA1c");
  const [newLabTestName, setNewLabTestName] = useState("HbA1c Glycated Hemoglobin");
  const [newLabVal, setNewLabVal] = useState<number | "">(6.1);
  const [newLabUnit, setNewLabUnit] = useState("%");
  const [newLabMin, setNewLabMin] = useState<number | "">(4.0);
  const [newLabMax, setNewLabMax] = useState<number | "">(5.6);

  // Fix 3: Addendum / Amendment Modal
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [selectedVisitForAmend, setSelectedVisitForAmend] = useState<EMRClinicalVisit | null>(null);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [amendedMedication, setAmendedMedication] = useState("");
  const [amendmentPin, setAmendmentPin] = useState("");

  // Fix 4: Dual-Admin Merge Modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [selectedMergeTicket, setSelectedMergeTicket] = useState<EMRDuplicateMergeTicket | null>(null);
  const [mergeAdminPin, setMergeAdminPin] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const json = await res.json();
        const ptList = json.patients || [];
        setPatients(ptList);
        if (ptList.length > 0) {
          // If no patient selected or current selected is not in list, pick the first
          if (!selectedPatient) {
            setSelectedPatient(ptList[0]);
          } else {
            const updated = ptList.find((p: EMRPatient) => p.uhid === selectedPatient.uhid);
            if (updated) setSelectedPatient(updated);
          }
        }
      }
    } catch (e) {
      console.error("Error loading EMR directory:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.uhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.allergies?.some(a => a.allergen_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // FIX 1: Test Prescribe Drug & Trigger Hard-Stop Check
  const handleTestPrescribe = async () => {
    if (!selectedPatient || !testDrugInput) return;
    setIsCheckingAllergy(true);
    setHardStopAlert(null);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check_allergy",
          patient_uhid: selectedPatient.uhid,
          drug_name: testDrugInput
        })
      });

      const json = await res.json();
      if (json.blocked) {
        setHardStopAlert(json.conflict);
      } else {
        showToast("✓ Safety Check Passed: No active drug contraindications found.");
        setPrescribeModalOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingAllergy(false);
    }
  };

  // FIX 1: Authorize Clinical Override
  const handleAuthorizeOverride = async () => {
    if (!selectedPatient || !hardStopAlert) return;

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override_allergy",
          patient_uhid: selectedPatient.uhid,
          prescribed_drug: hardStopAlert.prescribed_drug,
          conflicting_allergy: hardStopAlert.conflicting_allergy?.allergen_name || "Documented Allergy",
          atc_code: hardStopAlert.atc_code,
          reason_code: overrideReasonCode,
          reason_text: overrideReasonText,
          doctor_name: "Dr. Rahul Sharma (Clinical Director)",
          doctor_pin: doctorPinInput
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setOverrideModalOpen(false);
        setPrescribeModalOpen(false);
        setHardStopAlert(null);
        setDoctorPinInput("");
        setOverrideReasonText("");
        fetchPatients();
      } else {
        showToast(`Override Blocked: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 2: Ingest Structured Lab Result
  const handleIngestLab = async () => {
    if (!selectedPatient || !newLabParam || newLabVal === "") return;

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ingest_lab_report",
          patient_uhid: selectedPatient.uhid,
          test_name: newLabTestName,
          parameter_name: newLabParam,
          parameter_value: Number(newLabVal),
          unit: newLabUnit,
          reference_min: Number(newLabMin),
          reference_max: Number(newLabMax),
          report_date: new Date().toISOString().split("T")[0],
          lab_source: "Marley LIS (HL7 v2.5.1 / FHIR Ingestion)"
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setLabModalOpen(false);
        fetchPatients();
      } else {
        showToast(`Ingestion Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 3: Submit Signed Amendment Addendum
  const handleSignAmendment = async () => {
    if (!selectedPatient || !selectedVisitForAmend || !amendmentReason) return;

    try {
      let currentMeds: any[] = [];
      if (Array.isArray(selectedVisitForAmend.prescribed_medications)) {
        currentMeds = [...selectedVisitForAmend.prescribed_medications];
      } else if (typeof selectedVisitForAmend.prescribed_medications === "string") {
        try {
          const parsed = JSON.parse(selectedVisitForAmend.prescribed_medications);
          if (Array.isArray(parsed)) currentMeds = [...parsed];
        } catch {}
      }

      const updatedMedications = [...currentMeds];
      if (amendedMedication) {
        updatedMedications.push({
          medicine: amendedMedication,
          dose: "Amended as per clinical review",
          route: "Oral / Topical"
        });
      }

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_visit_version",
          patient_uhid: selectedPatient.uhid,
          visit_number: selectedVisitForAmend.visit_number,
          doctor_name: "Dr. Rahul Sharma",
          doctor_specialization: selectedVisitForAmend.doctor_specialization,
          provisional_diagnosis: `${selectedVisitForAmend.provisional_diagnosis} (Amended)`,
          vitals: selectedVisitForAmend.vitals,
          subjective_notes: selectedVisitForAmend.subjective_notes,
          objective_findings: selectedVisitForAmend.objective_findings,
          assessment_plan: `${selectedVisitForAmend.assessment_plan}\n\n[Addendum]: ${amendmentReason}`,
          prescribed_medications: updatedMedications,
          amendment_reason: amendmentReason,
          manager_pin: amendmentPin
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setAmendmentModalOpen(false);
        setSelectedVisitForAmend(null);
        setAmendmentReason("");
        setAmendedMedication("");
        setAmendmentPin("");
        fetchPatients();
      } else {
        showToast(`Amendment Rejected: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 4: Approve Dual-Admin Merge
  const handleApproveMerge = async () => {
    if (!selectedMergeTicket || !mergeAdminPin) return;

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_duplicate_merge",
          ticket_id: selectedMergeTicket.id,
          approver_2: "Dr. Rahul Sharma (Medical Director)",
          pin: mergeAdminPin
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setMergeModalOpen(false);
        setSelectedMergeTicket(null);
        setMergeAdminPin("");
        fetchPatients();
      } else {
        showToast(`Merge Failed: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export DPDP Audit Log (CSV)
  const handleExportAuditCsv = () => {
    if (!selectedPatient) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const rows = [
        ["Timestamp", "Patient UHID", "Patient Name", "Action Type", "User Name", "Staff Role", "IP Address", "Details"],
        ...(selectedPatient.audit_trail || []).map(a => [
          a.created_at,
          selectedPatient.uhid,
          `"${selectedPatient.full_name}"`,
          a.action_type,
          `"${a.user_name}"`,
          `"${a.user_role}"`,
          a.ip_address || "127.0.0.1",
          `"${(a.details || "").replace(/"/g, '""')}"`
        ])
      ];

      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `DPDP_Audit_Log_${selectedPatient.uhid}_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("DPDP Act Section 12 Compliant Audit Log exported to CSV.");
    } catch (e) {
      console.error(e);
    }
  };

  // Safe deterministic audit date formatter (eliminates SSR hydration mismatch)
  const formatAuditDate = (dateVal?: string | Date | null) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const pad = (n: number) => n.toString().padStart(2, "0");
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const dd = pad(d.getDate());
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const mon = months[d.getMonth()] || pad(d.getMonth() + 1);
      const yyyy = d.getFullYear();
      return `${hh}:${mm} • ${dd} ${mon} ${yyyy}`;
    } catch {
      return String(dateVal);
    }
  };

  // Group lab results by parameter for historical trending
  const labParamsMap = new Map<string, EMRLabResult[]>();
  if (selectedPatient?.lab_results && Array.isArray(selectedPatient.lab_results)) {
    for (const r of selectedPatient.lab_results) {
      if (!r || !r.parameter_name) continue;
      const arr = labParamsMap.get(r.parameter_name) || [];
      arr.push(r);
      labParamsMap.set(r.parameter_name, arr);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-[#1D1D1F] border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/60 hover:text-white dark:text-black/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & PILLARS */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 border border-rose-500/20 text-[10px] font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              <ShieldAlert className="h-3 w-3" />
              <span>Hard-Stop Allergy Blocking</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-500/20 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <Activity className="h-3 w-3" />
              <span>HL7 / FHIR Structured Labs</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Lock className="h-3 w-3" />
              <span>Immutable Visit Versions</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 border border-purple-500/20 text-[10px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
              <UserCheck className="h-3 w-3" />
              <span>UPI Identity Resolution</span>
            </span>
          </div>

          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            Patient EMR Directory &amp; Health History
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Hard-Stop Allergy Blocking • Structured Lab Trending • Immutable Visit Audit Trail • Duplicate-Free Identity
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setPrescribeModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 shadow-sm transition active:scale-95 cursor-pointer"
            title="Test prescribing drug against patient allergy contraindications"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>⚠️ Test Allergy Hard-Stop</span>
          </button>

          <button
            type="button"
            onClick={() => setLabModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-blue-500/20 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 shadow-sm transition active:scale-95 cursor-pointer"
            title="Ingest structured lab report via HL7 / FHIR parser"
          >
            <Microscope className="h-3.5 w-3.5" />
            <span>🧪 Ingest Lab Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] shadow-sm transition active:scale-95 cursor-pointer"
            title="Export DPDP Section 12 compliant audit log"
          >
            <Download className="h-3.5 w-3.5" />
            <span>DPDP Audit Log</span>
          </button>

          <button
            onClick={fetchPatients}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] shadow-sm transition"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#0071E3]" : ""}`} />
            <span>Sync EMR</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CLINICAL EMR WORKSPACE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: REGISTERED PATIENT DIRECTORY */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#86868B] uppercase tracking-wider">
              Master Directory ({filteredPatients.length})
            </span>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search UHID, name, allergy..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-[10px] border border-black/[0.08] bg-white py-1.5 pl-8 pr-2.5 text-xs text-[#1D1D1F] placeholder-[#86868B] shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
            {filteredPatients.map(pt => {
              const isSelected = selectedPatient?.uhid === pt.uhid;
              const hasSevereAllergy = pt.allergies?.some(a => a.reaction_severity === "SEVERE_ANAPHYLAXIS");
              const hasDuplicateFlag = pt.is_duplicate_flagged;

              return (
                <div
                  key={pt.uhid}
                  onClick={() => setSelectedPatient(pt)}
                  className={`cursor-pointer rounded-[20px] border p-4 transition ${
                    isSelected
                      ? "border-[#0071E3] bg-white shadow-apple-sm ring-2 ring-[#0071E3]/20 dark:bg-[#1C1C1E]"
                      : "border-black/[0.06] bg-white hover:border-black/[0.12] dark:border-white/[0.08] dark:bg-[#1C1C1E]/60 dark:hover:border-white/[0.15]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>{pt.full_name}</span>
                        <span className="rounded-[6px] bg-black/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]">
                          {pt.age}Y • {pt.gender[0]} • {pt.blood_group}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-[#86868B]">
                        <span className="font-mono text-[10px] text-[#0071E3] dark:text-[#2997FF] font-bold">
                          {pt.uhid}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-[#86868B]" />
                          <span>{pt.phone}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-[#0071E3]/10 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                        {pt.visits?.length || 1} Visits
                      </span>

                      {pt.lab_results && pt.lab_results.length > 0 && (
                        <span className="text-[10px] text-[#86868B]">
                          {pt.lab_results.length} Labs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Active Allergy Badges (Fix 1) */}
                  {pt.allergies && pt.allergies.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      {pt.allergies.map(a => (
                        <span
                          key={a.id}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            a.reaction_severity === "SEVERE_ANAPHYLAXIS"
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>{a.allergen_name} ({a.atc_code})</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Duplicate Flag Alert (Fix 4) */}
                  {hasDuplicateFlag && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                      <Users className="h-3 w-3" />
                      <span>Potential Duplicate Match (Dual-Admin Review Required)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CLINICAL EMR PROFILE & ACTIVE SAFETY ENGINE */}
        <div className="lg:col-span-7 space-y-6">
          {selectedPatient ? (
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-5">
              {/* DUPLICATE WARNING BANNER (FIX 4) */}
              {selectedPatient.is_duplicate_flagged && selectedPatient.duplicate_tickets && selectedPatient.duplicate_tickets.length > 0 && selectedPatient.duplicate_tickets[0] && (
                <div className="rounded-[20px] border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-900 dark:text-purple-200 shadow-sm animate-in fade-in space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div>
                        <div className="font-bold text-[12px] flex items-center gap-1.5">
                          <span>🚨 Duplicate Identity Flagged: {selectedPatient.duplicate_tickets[0]?.similarity_score}% Match</span>
                          <span className="rounded bg-purple-500/20 px-1.5 py-0.2 text-[10px]">
                            {selectedPatient.duplicate_tickets[0]?.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-purple-800/90 dark:text-purple-200/90">
                          {selectedPatient.duplicate_tickets[0]?.reconciliation_notes}
                        </p>
                      </div>
                    </div>

                    {selectedPatient.duplicate_tickets[0]?.status === "PENDING_DUAL_ADMIN" && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMergeTicket(selectedPatient.duplicate_tickets![0]);
                          setMergeModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Dual-Admin Merge</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-black/[0.04] pb-5 dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-2xl font-black text-[#1D1D1F] dark:text-white">
                      {selectedPatient.full_name}
                    </h2>
                    <span className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 px-2.5 py-0.5 rounded-full">
                      {selectedPatient.uhid}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Blood Group: {selectedPatient.blood_group}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#86868B]">
                    {selectedPatient.gender} • {selectedPatient.age} Years (DOB: {selectedPatient.dob || "Recorded"}) • Phone: {selectedPatient.phone}
                  </p>
                  <p className="text-[11px] text-[#86868B] mt-0.5">
                    Emergency Contact: <strong className="text-[#1D1D1F] dark:text-white font-medium">{selectedPatient.emergency_contact}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTestDrugInput("Syrup Amoxyclav 228.5mg");
                      setPrescribeModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Stethoscope className="h-4 w-4" />
                    <span>Prescribe ℞ (Safety Guard)</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE ALLERGY CONTRAINDICATION ENGINE BANNER (FIX 1) */}
              <div className="rounded-[20px] border border-rose-500/30 bg-rose-500/10 p-4 space-y-2 dark:border-rose-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Active Allergy Contraindication Engine (ATC Coded)</span>
                  </div>
                  <span className="rounded-full bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5">
                    Hard-Stop Active
                  </span>
                </div>

                {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedPatient.allergies.map(al => (
                      <div key={al.id} className="text-xs text-rose-900 dark:text-rose-200 bg-white/60 dark:bg-black/40 p-2.5 rounded-xl border border-rose-500/20">
                        <div className="flex items-center justify-between">
                          <strong className="text-rose-700 dark:text-rose-300">
                            {al.allergen_name} [ATC: {al.atc_code}]
                          </strong>
                          <span className="text-[10px] font-mono font-bold text-rose-600">
                            {al.reaction_severity}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5 text-[#1D1D1F] dark:text-white/80">
                          {al.reaction_description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    ✓ No active drug allergies recorded in system.
                  </div>
                )}
              </div>

              {/* Workspace Sub-Tabs */}
              <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06] overflow-x-auto">
                <button
                  onClick={() => setActiveTab("visits")}
                  className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    activeTab === "visits"
                      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                      : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Immutable Visits ({selectedPatient.visits?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("lab_vault")}
                  className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    activeTab === "lab_vault"
                      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                      : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  }`}
                >
                  <Microscope className="h-3.5 w-3.5" />
                  <span>Lab Vault &amp; Trending ({selectedPatient.lab_results?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("audit_trail")}
                  className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    activeTab === "audit_trail"
                      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                      : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>DPDP Audit Trail ({selectedPatient.audit_trail?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab("documents")}
                  className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    activeTab === "documents"
                      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                      : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Uploaded Documents</span>
                </button>
              </div>

              {/* ============================================================= */}
              {/* TAB 1: IMMUTABLE VISIT NOTES WITH SPECIALTY TEMPLATES (FIX 3) */}
              {/* ============================================================= */}
              {activeTab === "visits" && (
                <div className="space-y-4">
                  {selectedPatient.visits && selectedPatient.visits.length > 0 ? (
                    selectedPatient.visits.map(vis => (
                      <div
                        key={vis.id}
                        className="rounded-[20px] border border-black/[0.06] bg-[#ECEEF2]/30 p-4 dark:border-white/[0.06] dark:bg-white/[0.02] space-y-3"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <div className="font-bold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-2">
                              <span>{vis.provisional_diagnosis}</span>
                              <span className="rounded-full bg-[#0071E3]/15 text-[#0071E3] dark:text-[#2997FF] px-2 py-0.2 text-[10px] font-mono font-bold">
                                v{vis.version}.0 {vis.version > 1 ? "Signed Addendum" : "Original"}
                              </span>
                              <span className="text-[10px] text-[#86868B] font-mono">
                                {vis.visit_date}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#86868B] mt-0.5">
                              Attended by: <strong>{vis.doctor_name}</strong> ({vis.doctor_specialization})
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                              {vis.tamper_seal_hash}
                            </span>

                            {vis.is_latest && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVisitForAmend(vis);
                                  setAmendmentModalOpen(true);
                                }}
                                className="rounded-lg bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-[#1D1D1F] dark:text-white px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                              >
                                + Addendum v{vis.version + 1}.0
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Specialty Template Vitals */}
                        {(() => {
                          let vitalsObj: any = vis.vitals;
                          if (typeof vitalsObj === "string") {
                            try { vitalsObj = JSON.parse(vitalsObj); } catch { vitalsObj = {}; }
                          }
                          if (!vitalsObj || typeof vitalsObj !== "object") vitalsObj = {};

                          return (
                            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#86868B]">
                              {vitalsObj.bp && (
                                <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                                  BP: {vitalsObj.bp}
                                </span>
                              )}
                              {vitalsObj.pulse && (
                                <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                                  Pulse: {vitalsObj.pulse} bpm
                                </span>
                              )}
                              {vitalsObj.spo2 && (
                                <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                                  SpO2: {vitalsObj.spo2}%
                                </span>
                              )}
                              {vitalsObj.weight && (
                                <span className="rounded-[6px] bg-white px-2 py-0.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.06]">
                                  Weight: {vitalsObj.weight} kg
                                </span>
                              )}
                              {vitalsObj.head_circ_cm && (
                                <span className="rounded-[6px] bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2 py-0.5 border border-purple-500/20 font-bold">
                                  Head Circ: {vitalsObj.head_circ_cm} cm (Pediatric)
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Subjective & Objective SOAP */}
                        <div className="text-xs space-y-1 text-[#1D1D1F] dark:text-white/90">
                          <div>
                            <strong className="text-[#86868B] text-[11px] uppercase">Subjective: </strong>
                            <span>{vis.subjective_notes}</span>
                          </div>
                          <div>
                            <strong className="text-[#86868B] text-[11px] uppercase">Objective: </strong>
                            <span>{vis.objective_findings}</span>
                          </div>
                          <div>
                            <strong className="text-[#86868B] text-[11px] uppercase">Plan: </strong>
                            <span className="whitespace-pre-line">{vis.assessment_plan}</span>
                          </div>
                        </div>

                        {/* Prescribed Medications */}
                        {(() => {
                          let medsArr: any[] = [];
                          if (Array.isArray(vis.prescribed_medications)) {
                            medsArr = vis.prescribed_medications;
                          } else if (typeof vis.prescribed_medications === "string") {
                            try {
                              const parsed = JSON.parse(vis.prescribed_medications);
                              if (Array.isArray(parsed)) medsArr = parsed;
                            } catch {}
                          }

                          if (!medsArr || medsArr.length === 0) return null;

                          return (
                            <div className="rounded-[14px] bg-white p-3 border border-black/[0.04] dark:bg-[#1C1C1E] dark:border-white/[0.04] text-xs">
                              <div className="text-[11px] font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1 mb-1">
                                <Pill className="h-3 w-3 text-[#0071E3]" /> Prescribed Medications:
                              </div>
                              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#86868B]">
                                {medsArr.map((m: any, idx: number) => (
                                  <li key={idx}>
                                    <strong className="text-[#1D1D1F] dark:text-white font-medium">{m.medicine}</strong> ({m.dose})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })()}

                        {/* Amendment Addendum Details */}
                        {vis.amendment_reason && (
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-900 dark:text-amber-200">
                            <strong>Amendment Addendum: </strong>
                            <span>{vis.amendment_reason}</span>
                            <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-0.5">
                              Signed by: {vis.amended_by}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-xs text-[#86868B]">
                      No recorded visits yet.
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 2: STRUCTURED LAB DATA VAULT & TRENDING (FIX 2) */}
              {/* ============================================================= */}
              {activeTab === "lab_vault" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                        HL7 / FHIR Diagnostic Parameter Vault
                      </h3>
                      <p className="text-[11px] text-[#86868B]">
                        Automated extraction, reference norm validation, and longitudinal trend plotting
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLabModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ingest Lab Result</span>
                    </button>
                  </div>

                  {/* Parameter Trend Cards */}
                  {Array.from(labParamsMap.entries()).map(([paramName, results]) => {
                    if (!results || results.length === 0) return null;
                    const latest = results[results.length - 1];
                    if (!latest) return null;
                    const isHigh = latest.flag === "HIGH" || latest.flag === "CRITICAL_HIGH";
                    const isLow = latest.flag === "LOW" || latest.flag === "CRITICAL_LOW";

                    return (
                      <div
                        key={paramName}
                        className="rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                                {paramName}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                latest.flag === "NORMAL"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              }`}>
                                {latest.flag}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#86868B]">
                              Ref Range: {latest.reference_min} - {latest.reference_max} {latest.unit} • Source: {latest.lab_source}
                            </span>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-black font-mono text-[#1D1D1F] dark:text-white">
                              {latest.parameter_value} {latest.unit}
                            </div>
                            <span className="text-[10px] text-[#86868B] font-mono">
                              {latest.report_date}
                            </span>
                          </div>
                        </div>

                        {/* Historical Trend Graph Progression */}
                        {results.length > 1 && (
                          <div className="rounded-xl bg-[#ECEEF2]/40 dark:bg-white/[0.02] p-3 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-[#86868B] flex items-center gap-1">
                              <TrendingDown className="h-3.5 w-3.5 text-emerald-500" /> Longitudinal Trend Progression ({results.length} Measurements)
                            </span>

                            <div className="grid grid-cols-3 gap-2">
                              {results.map((r, idx) => (
                                <div key={r.id} className="rounded-lg bg-white dark:bg-[#1C1C1E] p-2 border border-black/[0.04] dark:border-white/[0.04] text-center">
                                  <div className="text-[10px] font-mono text-[#86868B]">{r.report_date}</div>
                                  <div className="text-sm font-bold font-mono text-[#1D1D1F] dark:text-white mt-0.5">
                                    {r.parameter_value} {r.unit}
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase ${
                                    r.flag === "NORMAL" ? "text-emerald-600" : "text-rose-600"
                                  }`}>
                                    {r.flag}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 3: DPDP ACT COMPLIANT ACCESS AUDIT TRAIL (FIX 3) */}
              {/* ============================================================= */}
              {activeTab === "audit_trail" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                        DPDP Act (2023) Section 12 Access Audit Trail
                      </h3>
                      <p className="text-[11px] text-[#86868B]">
                        Immutable cryptographic log tracking every view, print, edit, and export action
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportAuditCsv}
                      className="inline-flex items-center gap-1 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] px-3 py-1.5 text-xs font-bold text-[#1D1D1F] dark:text-white transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                        <tr>
                          <th className="px-4 py-3 font-bold">Timestamp</th>
                          <th className="px-3 py-3 font-bold">Action</th>
                          <th className="px-4 py-3 font-bold">User &amp; Role</th>
                          <th className="px-5 py-3 font-bold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                        {selectedPatient.audit_trail?.map(a => (
                          <tr key={a.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                            <td className="px-4 py-3 font-mono text-[10px] text-[#86868B]">
                              {formatAuditDate(a.created_at)}
                            </td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold font-mono">
                                {a.action_type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <strong className="text-[#1D1D1F] dark:text-white font-medium">{a.user_name}</strong>
                              <div className="text-[10px] text-[#86868B]">{a.user_role}</div>
                            </td>
                            <td className="px-5 py-3 text-[11px] text-[#86868B]">
                              {a.details}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* TAB 4: UPLOADED DOCUMENTS & VAULT */}
              {/* ============================================================= */}
              {activeTab === "documents" && (
                <div className="pt-2">
                  <PatientDocumentsManager 
                    patientPhone={selectedPatient.phone} 
                    patientName={selectedPatient.full_name} 
                    isDoctorView={true} 
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-12 text-xs text-[#86868B]">
              Select a patient from directory to view EMR history.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: HARD-STOP ALLERGY CONTRAINDICATION ENGINE (FIX 1) */}
      {/* ========================================================================= */}
      {prescribeModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Active Drug Contraindication Guard
                </h3>
              </div>
              <button onClick={() => setPrescribeModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Cross-references prescribed drugs against patient ATC allergy codes in real-time. Prevents accidental contraindications.
            </p>

            <div className="rounded-xl bg-[#ECEEF2]/60 dark:bg-white/[0.04] p-3 text-xs space-y-1">
              <div>Patient: <strong>{selectedPatient.full_name}</strong> ({selectedPatient.uhid})</div>
              <div>Age: <strong>{selectedPatient.age} Years</strong></div>
              <div>Documented Allergies: <strong className="text-rose-600">{selectedPatient.allergies?.map(a => a.allergen_name).join(", ") || "None"}</strong></div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                Enter Drug to Prescribe (Try: &apos;Amoxyclav&apos;, &apos;Amoxicillin&apos;, &apos;Bactrim&apos;, or &apos;Paracetamol&apos;)
              </label>
              <input
                type="text"
                value={testDrugInput}
                onChange={(e) => setTestDrugInput(e.target.value)}
                placeholder="e.g. Syrup Amoxyclav 228.5mg"
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs font-bold text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            {/* HARD-STOP CONFLICT BANNER IF DETECTED */}
            {hardStopAlert && (
              <div className="rounded-2xl border-2 border-rose-600 bg-rose-500/10 p-4 space-y-3 animate-in shake">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-full bg-rose-600 p-1.5 text-white shrink-0 animate-pulse">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-rose-700 dark:text-rose-300 text-xs">
                      {hardStopAlert.warning_title}
                    </h4>
                    <p className="mt-1 text-xs text-rose-900 dark:text-rose-100 font-medium">
                      {hardStopAlert.warning_message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    <span>Clinical Override (PIN Required)</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPrescribeModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTestPrescribe}
                disabled={isCheckingAllergy}
                className="rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                {isCheckingAllergy ? "Checking ATC Registry..." : "Verify & Check Safety"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CLINICAL OVERRIDE FOR ALLERGY HARD-STOP (FIX 1) */}
      {/* ========================================================================= */}
      {overrideModalOpen && hardStopAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Clinical Override Authorization
                </h3>
              </div>
              <button onClick={() => setOverrideModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Per medical governance, hard-stop overrides require mandatory clinical reason code and Senior Doctor PIN e-signature. Logged permanently in DPDP audit trail.
            </p>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Override Protocol / Reason Code</label>
              <select
                value={overrideReasonCode}
                onChange={(e) => setOverrideReasonCode(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              >
                {CLINICAL_OVERRIDE_REASON_CODES.map(r => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Clinical Justification &amp; Monitoring Safeguards</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Oral desensitization under ICU supervision with resuscitation kit ready"
                value={overrideReasonText}
                onChange={(e) => setOverrideReasonText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Senior Doctor PIN (e.g. 4491)</label>
              <input
                type="password"
                maxLength={6}
                placeholder="Enter Senior Doctor PIN"
                value={doctorPinInput}
                onChange={(e) => setDoctorPinInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold text-sm dark:border-white/[0.1] dark:bg-black/40 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAuthorizeOverride}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Sign &amp; Release Hard-Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INGEST STRUCTURED LAB DATA (FIX 2) */}
      {/* ========================================================================= */}
      {labModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-[#0071E3]" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Ingest Structured Lab Report (HL7 / FHIR)
                </h3>
              </div>
              <button onClick={() => setLabModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Parameter Name</label>
                <input
                  type="text"
                  value={newLabParam}
                  onChange={(e) => setNewLabParam(e.target.value)}
                  placeholder="e.g. HbA1c"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Measured Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={newLabVal}
                  onChange={(e) => setNewLabVal(Number(e.target.value) || "")}
                  placeholder="e.g. 6.4"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Unit</label>
                <input
                  type="text"
                  value={newLabUnit}
                  onChange={(e) => setNewLabUnit(e.target.value)}
                  placeholder="e.g. % or mg/dL"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Ref Range (Min - Max)</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    value={newLabMin}
                    onChange={(e) => setNewLabMin(Number(e.target.value) || "")}
                    className="w-1/2 rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={newLabMax}
                    onChange={(e) => setNewLabMax(Number(e.target.value) || "")}
                    className="w-1/2 rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLabModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIngestLab}
                className="rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Ingest &amp; Plot Trend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SIGN VISIT AMENDMENT ADDENDUM (FIX 3) */}
      {/* ========================================================================= */}
      {amendmentModalOpen && selectedVisitForAmend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Sign Addendum v{selectedVisitForAmend.version + 1}.0
                </h3>
              </div>
              <button onClick={() => setAmendmentModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Medical records are immutable. Post-save edits create a new cryptographically sealed revision. The original entry remains untouched.
            </p>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Amendment Rationale</label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Added non-comedogenic sunscreen to mitigate photosensitivity risks"
                value={amendmentReason}
                onChange={(e) => setAmendmentReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Added / Modified Medication (Optional)</label>
              <input
                type="text"
                placeholder="e.g. BROAD SPECTRUM GEL SUNSCREEN SPF 50"
                value={amendedMedication}
                onChange={(e) => setAmendedMedication(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Senior Doctor PIN (e.g. 4491)</label>
              <input
                type="password"
                maxLength={6}
                placeholder="Enter PIN 4491"
                value={amendmentPin}
                onChange={(e) => setAmendmentPin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold text-sm dark:border-white/[0.1] dark:bg-black/40 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAmendmentModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSignAmendment}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Seal &amp; Sign Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DUAL-ADMIN MERGE DUPLICATE IDENTITY (FIX 4) */}
      {/* ========================================================================= */}
      {mergeModalOpen && selectedMergeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Dual-Admin Record Merge Approval
                </h3>
              </div>
              <button onClick={() => setMergeModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Merging identities consolidates longitudinal records, clinical notes, and lab reports into primary master UHID ({selectedMergeTicket.target_uhid}).
            </p>

            <div className="rounded-xl bg-purple-500/10 p-3 text-xs space-y-1 text-purple-900 dark:text-purple-200">
              <div>Source Duplicate: <strong>{selectedMergeTicket.source_uhid}</strong></div>
              <div>Primary Master Record: <strong>{selectedMergeTicket.target_uhid}</strong></div>
              <div>Similarity Score: <strong>{selectedMergeTicket.similarity_score}% Match</strong></div>
              <div>First Approver: <strong>{selectedMergeTicket.approver_1}</strong></div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Second Admin PIN (Medical Director PIN: 4491)</label>
              <input
                type="password"
                maxLength={6}
                placeholder="Enter Second Admin PIN"
                value={mergeAdminPin}
                onChange={(e) => setMergeAdminPin(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold text-sm dark:border-white/[0.1] dark:bg-black/40 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMergeModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveMerge}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Authorize Identity Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
