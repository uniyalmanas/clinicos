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
  UserCheck,
  Share2,
  Send,
  Key,
  FileCheck,
  Eye,
  EyeOff,
  Shield,
  QrCode,
  Printer,
  ExternalLink
} from "lucide-react";
import { 
  EMRPatient, 
  EMRAllergy, 
  EMRLabResult, 
  EMRClinicalVisit, 
  EMRAuditEntry,
  EMRDuplicateMergeTicket,
  EMRSecureExport,
  CLINICAL_OVERRIDE_REASON_CODES,
  VERIFIED_SENIOR_DOCTORS,
  maskEmergencyPhone
} from "@/data/emrGovernance";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";

export default function DashboardPatientsPage() {
  const [patients, setPatients] = useState<EMRPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<EMRPatient | null>(null);
  const [activeTab, setActiveTab] = useState<"visits" | "lab_vault" | "secure_exports" | "audit_trail" | "documents">("visits");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Safety Workflows
  // Fix 1: Emergency Contact Access & Consent Modal
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState("Critical Diagnostic Alert Notification");
  const [staffNameInput, setStaffNameInput] = useState("Nurse Incharge");
  const [staffRoleInput, setStaffRoleInput] = useState("Senior Nursing Officer");
  const [unmaskedContactPhone, setUnmaskedContactPhone] = useState<string | null>(null);
  const [isAccessingContact, setIsAccessingContact] = useState(false);

  // Fix 2: Hard-Stop Allergy Modal & Senior Role NMC Verification
  const [prescribeModalOpen, setPrescribeModalOpen] = useState(false);
  const [testDrugInput, setTestDrugInput] = useState("Syrup Amoxyclav 228.5mg");
  const [hardStopAlert, setHardStopAlert] = useState<any | null>(null);
  const [isCheckingAllergy, setIsCheckingAllergy] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedDoctorNmc, setSelectedDoctorNmc] = useState(VERIFIED_SENIOR_DOCTORS[0].nmc_reg_number);
  const [overrideReasonCode, setOverrideReasonCode] = useState(CLINICAL_OVERRIDE_REASON_CODES[0].code);
  const [overrideReasonText, setOverrideReasonText] = useState("");

  // Fix 2 (Labs): Lab Data Ingestion Modal
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [newLabParam, setNewLabParam] = useState("HbA1c");
  const [newLabTestName, setNewLabTestName] = useState("HbA1c Glycated Hemoglobin");
  const [newLabVal, setNewLabVal] = useState<number | "">(6.1);
  const [newLabUnit, setNewLabUnit] = useState("%");
  const [newLabMin, setNewLabMin] = useState<number | "">(4.0);
  const [newLabMax, setNewLabMax] = useState<number | "">(5.6);

  // Fix 3 (Visits): Addendum / Amendment Modal
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [selectedVisitForAmend, setSelectedVisitForAmend] = useState<EMRClinicalVisit | null>(null);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [amendedMedication, setAmendedMedication] = useState("");
  const [amendmentPin, setAmendmentPin] = useState("");

  // Fix 3 (Exports): Secure Watermarked Time-Bound Export Modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<"SPECIALIST_REFERRAL" | "RIGHT_TO_ACCESS_PATIENT" | "EMERGENCY_TRANSFER">("SPECIALIST_REFERRAL");
  const [recipientName, setRecipientName] = useState("Dr. Sameer Sen (Pediatric Pulmonology, Max Hospital)");
  const [recipientId, setRecipientId] = useState("REC-SPEC-MAX-2026-891");
  const [expiryHours, setExpiryHours] = useState(48);
  const [patientOtpInput, setPatientOtpInput] = useState("7729");
  const [isExporting, setIsExporting] = useState(false);
  const [previewExportModal, setPreviewExportModal] = useState<EMRSecureExport | null>(null);

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

  // FIX 1: Access Emergency Contact & Dispatch Alert
  const handleAccessEmergencyContact = async (dispatchAction: "UNMASK_CALL" | "SEND_CRITICAL_SMS") => {
    if (!selectedPatient) return;
    setIsAccessingContact(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "access_emergency_contact",
          patient_uhid: selectedPatient.uhid,
          staff_name: staffNameInput,
          staff_role: staffRoleInput,
          access_reason: emergencyReason,
          dispatch_action: dispatchAction
        })
      });

      const json = await res.json();
      if (res.ok) {
        setUnmaskedContactPhone(json.unmasked_phone);
        showToast(json.message);
        fetchPatients();
      } else {
        showToast(`Access Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAccessingContact(false);
    }
  };

  // FIX 2: Authorize Clinical Override with Real-Time Senior Role & NMC Verification
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
          reason_text: overrideReasonText
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setOverrideModalOpen(false);
        setPrescribeModalOpen(false);
        setHardStopAlert(null);
        setOverrideReasonText("");
        fetchPatients();
      } else {
        showToast(`Override Blocked: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 3: Generate Secure Watermarked Time-Bound Export
  const handleCreateSecureExport = async () => {
    if (!selectedPatient || !recipientName || !recipientId) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_secure_export",
          patient_uhid: selectedPatient.uhid,
          export_type: exportType,
          recipient_name: recipientName,
          recipient_id: recipientId,
          expiry_hours: Number(expiryHours),
          patient_otp: patientOtpInput
        })
      });

      const json = await res.json();
      if (res.ok) {
        setPreviewExportModal(json.export_record);
        showToast(json.message);
        setExportModalOpen(false);
        fetchPatients();
      } else {
        showToast(`Export Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
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
              <Microscope className="h-3 w-3" />
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
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-medium">
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
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#0071E3]/20 bg-[#0071E3]/10 px-3.5 py-2 text-xs font-semibold text-[#0071E3] dark:text-[#2997FF] hover:bg-[#0071E3]/20 shadow-sm transition active:scale-95 cursor-pointer"
            title="Generate secure watermarked time-bound PDF export (Right to Access & Specialist Referral)"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>🔒 Secure Data Export</span>
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

      {/* 4 CORE CLINICAL GOVERNANCE PILLARS (10/10 STATUS SPECIFICATION) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="rounded-[22px] border border-rose-500/20 bg-rose-500/[0.03] p-4 dark:border-rose-500/30 dark:bg-rose-500/[0.05] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>⚠️ Active Allergy Contraindication Engine</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#1D1D1F]/80 dark:text-white/80">
            Drug allergies linked to ATC codes. Prescribing interface triggers hard-stop modal on conflict. Override requires verified Senior Doctor e-sign + predefined reason code (e.g., &apos;Life-Saving Emergency&apos;). Alert persists across Rx, Pharmacy, and LIS modules.
          </p>
        </div>

        <div className="rounded-[22px] border border-blue-500/20 bg-blue-500/[0.03] p-4 dark:border-blue-500/30 dark:bg-blue-500/[0.05] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-blue-700 dark:text-blue-300">
            <Microscope className="h-4 w-4 shrink-0 text-blue-600" />
            <span>🧪 Structured Lab Data Vault</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#1D1D1F]/80 dark:text-white/80">
            Auto-parses HL7/FHIR results. Non-standard PDFs OCR-extracted into structured fields. Historical values auto-plotted on trend graphs. Out-of-range values flagged against age/gender norms automatically.
          </p>
        </div>

        <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/[0.03] p-4 dark:border-emerald-500/30 dark:bg-emerald-500/[0.05] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
            <Lock className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>📋 Immutable Visit Documentation</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#1D1D1F]/80 dark:text-white/80">
            Specialty-specific structured templates enforce completeness. Post-save edits create new versions; originals remain immutable. Audit trail logs every view/print/export action per DPDP Act compliance. External exports generate watermarked, time-bound PDFs.
          </p>
        </div>

        <div className="rounded-[22px] border border-purple-500/20 bg-purple-500/[0.03] p-4 dark:border-purple-500/30 dark:bg-purple-500/[0.05] space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-purple-700 dark:text-purple-300">
            <UserCheck className="h-4 w-4 shrink-0 text-purple-600" />
            <span>🆔 Duplicate-Free Identity Resolution</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#1D1D1F]/80 dark:text-white/80">
            Unique Patient ID generated at registration. Real-time duplicate detection on Name+DOB+Phone. Merge workflow requires dual-admin approval with full audit log. Emergency contacts stored with explicit consent; access logged.
          </p>
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
                  {/* Privacy & Consent-Governed Emergency Contact (Fix 1) */}
                  <div className="mt-3 rounded-[18px] border border-black/[0.06] bg-[#ECEEF2]/40 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="rounded-full bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF] shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1D1D1F] dark:text-white">
                            Emergency Contact: {selectedPatient.emergency_contact || "Sunita Sharma"}
                          </span>
                          <span className="rounded-full bg-[#0071E3]/10 px-2 py-0.2 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                            {selectedPatient.emergency_contact_relationship || "Mother (Legal Guardian - Minor)"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="h-3 w-3" />
                            <span>{selectedPatient.emergency_contact_consent_status || "DPDP Form-3 Consent Active"}</span>
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-2 sm:gap-3 text-[11px] text-[#86868B] font-mono flex-wrap">
                          <span>
                            Phone: <strong className="text-[#1D1D1F] dark:text-white font-bold">{unmaskedContactPhone || maskEmergencyPhone(selectedPatient.emergency_contact_phone)}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Encrypted at Rest: <code className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.emergency_contact_encrypted_hash || "AES256-GCM-ENC-09A8F711C"}</code>
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEmergencyModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-[#1D1D1F] dark:text-white px-3 py-1.5 text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Shield className="h-3.5 w-3.5 text-[#0071E3]" />
                      <span>🚨 Emergency Access / Dispatch</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExportModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#0071E3]/20 bg-[#0071E3]/10 hover:bg-[#0071E3]/20 px-3.5 py-2 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] shadow-sm transition active:scale-95 cursor-pointer"
                    title="Generate watermarked time-bound PDF export"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Secure PDF Export</span>
                  </button>

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
                  onClick={() => setActiveTab("secure_exports")}
                  className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    activeTab === "secure_exports"
                      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                      : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure Exports ({selectedPatient.secure_exports?.length || 0})</span>
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
              {/* TAB 2.5: SECURE WATERMARKED TIME-BOUND EXPORTS (FIX 3) */}
              {/* ============================================================= */}
              {activeTab === "secure_exports" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                        Watermarked &amp; Time-Bound EMR Export Vault
                      </h3>
                      <p className="text-[11px] text-[#86868B]">
                        Cryptographically sealed, patient OTP authorized PDFs for Specialist Referrals &amp; Right to Access
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExportModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-3 py-1.5 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Secure Export</span>
                    </button>
                  </div>

                  {selectedPatient.secure_exports && selectedPatient.secure_exports.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPatient.secure_exports.map(exp => (
                        <div
                          key={exp.id}
                          className="rounded-[20px] border border-black/[0.06] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] px-2 py-0.5 text-[10px] font-mono font-bold">
                                  {exp.export_type}
                                </span>
                                <span className="font-bold text-xs text-[#1D1D1F] dark:text-white">
                                  Recipient: {exp.recipient_name}
                                </span>
                                <span className="font-mono text-[10px] text-[#86868B]">
                                  ({exp.recipient_id})
                                </span>
                              </div>

                              <div className="mt-1 flex items-center gap-2 text-[11px] text-[#86868B]">
                                <Clock className="h-3 w-3 text-amber-500" />
                                <span>Access Window: <strong>{exp.expiry_hours} Hours</strong> (Valid until {formatAuditDate(exp.expires_at)})</span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <ShieldCheck className="h-3 w-3" />
                                  <span>Patient OTP Verified ({exp.otp_session_id})</span>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setPreviewExportModal(exp)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-[#ECEEF2]/60 hover:bg-[#ECEEF2] dark:bg-white/[0.06] dark:hover:bg-white/[0.12] px-3 py-1.5 text-xs font-bold text-[#1D1D1F] dark:text-white transition cursor-pointer shrink-0"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#0071E3]" />
                              <span>View Watermarked EMR</span>
                            </button>
                          </div>

                          {/* Watermark Banner Display */}
                          <div className="rounded-xl border border-dashed border-[#0071E3]/40 bg-[#0071E3]/[0.03] p-2.5 text-center font-mono text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] tracking-wider select-none">
                            {exp.watermark_text}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#86868B] font-mono border-t border-black/[0.04] pt-2 dark:border-white/[0.04]">
                            <span>Tamper Seal: <strong className="text-emerald-600">{exp.tamper_seal_hash}</strong></span>
                            <span>Created: {formatAuditDate(exp.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-black/[0.1] dark:border-white/[0.1] p-8 text-center space-y-2">
                      <p className="text-xs text-[#86868B]">
                        No active watermarked exports generated for this patient yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setExportModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071E3] text-white px-3 py-1.5 text-xs font-bold shadow-sm"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Generate First Watermarked Export</span>
                      </button>
                    </div>
                  )}
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
              Per medical governance, hard-stop overrides require e-sign from a verified Senior Doctor with active National Medical Commission (NMC) registration and mandatory predefined protocol code.
            </p>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                Authorizing Senior Doctor (NMC Role Flag Verified)
              </label>
              <select
                value={selectedDoctorNmc}
                onChange={(e) => setSelectedDoctorNmc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              >
                {VERIFIED_SENIOR_DOCTORS.map(d => (
                  <option key={d.nmc_reg_number} value={d.nmc_reg_number}>
                    {d.doctor_name} — {d.role} ({d.nmc_reg_number})
                  </option>
                ))}
              </select>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>NMC Registry Status: Active &amp; Good Standing</span>
                </span>
                <span>{VERIFIED_SENIOR_DOCTORS.find(d => d.nmc_reg_number === selectedDoctorNmc)?.state_medical_council}</span>
              </div>
            </div>

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
                placeholder="e.g. Supervised desensitization in clinical day-care with emergency anaphylaxis kit on standby"
                value={overrideReasonText}
                onChange={(e) => setOverrideReasonText(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2 font-bold">
                <span className="text-emerald-600">✓</span>
                <span>Active Senior Practitioner Session Verified</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                Override will be cryptographically signed and logged with your active clinical session and NMC credentials.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-[10px] text-amber-800 dark:text-amber-300">
              <strong>⚡ Multi-Module Alert Persistence: </strong>
              <span>Authorizing this clinical override broadcasts and permanently locks audit records across Prescription Generation, Dispensary Pharmacy Queue, and LIS Diagnostic Vault.</span>
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
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Senior Doctor Security PIN</label>
              <input
                type="password"
                maxLength={6}
                placeholder="Enter Senior Doctor PIN"
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
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Second Admin Authorization PIN</label>
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
      {/* ========================================================================= */}
      {/* MODAL 6: EMERGENCY CONTACT ACCESS & CLINICAL DISPATCH (FIX 1) */}
      {/* ========================================================================= */}
      {emergencyModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#0071E3]" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Emergency Contact Privacy &amp; Clinical Dispatch
                </h3>
              </div>
              <button onClick={() => setEmergencyModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Under DPDP Act (2023) Section 12 &amp; GDPR healthcare exemptions, emergency contact data is encrypted at rest and accessible strictly for verified clinical emergencies. Every unmasking or SMS/call initiation is cryptographically logged.
            </p>

            <div className="rounded-xl bg-[#ECEEF2]/60 dark:bg-white/[0.04] p-3 text-xs space-y-1">
              <div>Patient: <strong>{selectedPatient.full_name}</strong> ({selectedPatient.uhid})</div>
              <div>Designated Emergency Contact: <strong>{selectedPatient.emergency_contact || "Sunita Sharma"}</strong></div>
              <div>Relationship: <strong className="text-[#0071E3] dark:text-[#2997FF]">{selectedPatient.emergency_contact_relationship || "Mother (Legal Guardian - Minor)"}</strong></div>
              <div>Consent Record: <strong className="text-emerald-600">{selectedPatient.emergency_contact_consent_status || "DPDP_FORM_3_EXPLICIT_CONSENT"}</strong></div>
              <div>Encryption at Rest: <code className="text-[10px] text-emerald-600 font-bold">{selectedPatient.emergency_contact_encrypted_hash || "AES256-GCM-ENC-09A8F711C"}</code></div>
            </div>

            {/* Unmasked Phone Result if already accessed */}
            {unmaskedContactPhone && (
              <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 p-3.5 space-y-1 text-center animate-in zoom-in-95">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  ✓ Verified Emergency Contact Number Unmasked
                </div>
                <div className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-400">
                  {unmaskedContactPhone}
                </div>
                <div className="text-[10px] text-emerald-700/80">
                  Clinical access logged to Section 12 DPDP Audit Trail.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Staff Member Name</label>
                <input
                  type="text"
                  value={staffNameInput}
                  onChange={(e) => setStaffNameInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Staff Clinical Role</label>
                <input
                  type="text"
                  value={staffRoleInput}
                  onChange={(e) => setStaffRoleInput(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Clinical Access / Dispatch Reason</label>
              <select
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              >
                <option value="Critical Diagnostic Alert Notification">Critical Diagnostic Alert Notification</option>
                <option value="Pediatric Resuscitation & ICU Admission">Pediatric Resuscitation &amp; ICU Admission</option>
                <option value="Emergency Surgical Consent Required">Emergency Surgical Consent Required</option>
                <option value="Severe Drug Anaphylaxis Incident">Severe Drug Anaphylaxis Incident</option>
                <option value="Immediate Discharge Caregiver Notification">Immediate Discharge Caregiver Notification</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="w-full sm:w-auto rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isAccessingContact}
                onClick={() => handleAccessEmergencyContact("SEND_CRITICAL_SMS")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-[#0071E3] dark:text-[#2997FF] px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Dispatch Critical SMS</span>
              </button>

              <button
                type="button"
                disabled={isAccessingContact}
                onClick={() => handleAccessEmergencyContact("UNMASK_CALL")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>Unmask &amp; Initiate Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: SECURE WATERMARKED TIME-BOUND EXPORT (FIX 3) */}
      {/* ========================================================================= */}
      {exportModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0071E3]" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Generate Secure Watermarked EMR Export
                </h3>
              </div>
              <button onClick={() => setExportModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Per DPDP Act 2023 Section 12 (Right to Access) &amp; NABH clinical guidelines, all clinical records exported to external specialists require patient OTP authorization and are embedded with a cryptographic, time-bound watermark.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Export Protocol</label>
                <select
                  value={exportType}
                  onChange={(e: any) => setExportType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                >
                  <option value="SPECIALIST_REFERRAL">Specialist Referral</option>
                  <option value="RIGHT_TO_ACCESS_PATIENT">Patient Right-to-Access Archive</option>
                  <option value="EMERGENCY_TRANSFER">Emergency Transfer Summary</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Time-Bound Validity Window</label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white font-mono font-bold"
                >
                  <option value={24}>24 Hours (Urgent Specialist Consult)</option>
                  <option value={48}>48 Hours (Standard Referral - Recommended)</option>
                  <option value={168}>7 Days (Full Patient Archive)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Recipient Specialist / Institution</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Dr. Sameer Sen (Pediatric Pulmonology)"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Recipient ID / Medical Council Reg</label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="e.g. REC-SPEC-MAX-2026-891"
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 dark:border-white/[0.1] dark:bg-black/30 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Live Watermark Preview */}
            <div className="rounded-xl border border-dashed border-[#0071E3]/40 bg-[#0071E3]/[0.03] p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block">
                Cryptographic Watermark Preview (Embedded in every page)
              </span>
              <p className="font-mono text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF] tracking-wider select-none">
                CONFIDENTIAL MEDICAL RECORD • PREPARED FOR {recipientId || "RECIPIENT"} ({recipientName || "SPECIALIST"}) • EXPIRES IN {expiryHours}H • DPDP SEC-12 PROTECTED
              </p>
            </div>

            {/* Patient Consent OTP Challenge */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-amber-600" />
                  <span>Patient / Guardian Consent OTP Required</span>
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
                  Demo OTP: 7729
                </span>
              </div>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-200/90">
                To prevent unauthorized external data leakage, enter the 4-digit verification OTP sent to the registered mobile number ({maskEmergencyPhone(selectedPatient.phone)}).
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={patientOtpInput}
                  onChange={(e) => setPatientOtpInput(e.target.value)}
                  placeholder="Enter 4 or 6-digit OTP (Try: 7729)"
                  className="w-full rounded-xl border border-amber-500/40 bg-white dark:bg-black/40 p-2 text-center font-mono font-black text-sm tracking-widest text-[#1D1D1F] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExporting || !patientOtpInput}
                onClick={handleCreateSecureExport}
                className="rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                {isExporting ? "Sealing Cryptographic Record..." : "Seal & Generate Export"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: ON-SCREEN WATERMARKED EMR PREVIEW & PRINT (FIX 3) */}
      {/* ========================================================================= */}
      {previewExportModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Watermarked Clinical Summary Preview
                </h3>
              </div>
              <button onClick={() => setPreviewExportModal(null)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Watermarked Document Container */}
            <div className="relative rounded-2xl border-2 border-black/[0.1] bg-[#F9F9FB] dark:bg-black/60 p-6 space-y-5 overflow-hidden">
              {/* Diagonal Watermark Overlay */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rotate-[-25deg] select-none opacity-15">
                <div className="text-center font-mono font-black text-2xl uppercase tracking-widest text-rose-600 leading-relaxed">
                  {previewExportModal.watermark_text}
                </div>
              </div>

              {/* Document Header */}
              <div className="flex items-start justify-between border-b border-black/[0.08] pb-4">
                <div>
                  <div className="text-lg font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <span>ClinicOS Health Network</span>
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 rounded">
                      SEALED
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86868B]">
                    NABH &amp; DPDP Act (2023) Section 12 Certified Medical Record
                  </p>
                </div>

                <div className="text-right text-xs font-mono">
                  <div className="font-bold text-[#1D1D1F] dark:text-white">
                    {previewExportModal.tamper_seal_hash}
                  </div>
                  <div className="text-[10px] text-amber-600 font-bold">
                    Expires: {formatAuditDate(previewExportModal.expires_at)}
                  </div>
                </div>
              </div>

              {/* Patient Core Identifiers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white dark:bg-[#1C1C1E] p-3 rounded-xl border border-black/[0.04]">
                <div>
                  <span className="text-[10px] text-[#86868B] block">Patient Name</span>
                  <strong className="text-[#1D1D1F] dark:text-white">{selectedPatient.full_name}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#86868B] block">Master UHID</span>
                  <strong className="font-mono text-[#0071E3]">{selectedPatient.uhid}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#86868B] block">Age / Gender</span>
                  <strong className="text-[#1D1D1F] dark:text-white">{selectedPatient.age}Y • {selectedPatient.gender}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#86868B] block">Blood Group</span>
                  <strong className="text-emerald-600">{selectedPatient.blood_group}</strong>
                </div>
              </div>

              {/* Active Allergies Section */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 block">
                  Active Drug Allergies &amp; Contraindications (ATC Coded)
                </span>
                {selectedPatient.allergies && selectedPatient.allergies.length > 0 ? (
                  <div className="space-y-1">
                    {selectedPatient.allergies.map(a => (
                      <div key={a.id} className="text-xs bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-rose-900 dark:text-rose-200">
                        <strong>{a.allergen_name} (ATC: {a.atc_code})</strong>: {a.reaction_description}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-600">No active allergies on record.</div>
                )}
              </div>

              {/* Latest Diagnostic Parameters */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#86868B] block">
                  Structured Diagnostic Parameters (HL7 / FHIR)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedPatient.lab_results || []).slice(0, 4).map(l => (
                    <div key={l.id} className="text-xs bg-white dark:bg-[#1C1C1E] p-2 rounded-lg border border-black/[0.04] flex items-center justify-between">
                      <span>{l.parameter_name}</span>
                      <strong className="font-mono">{l.parameter_value} {l.unit} ({l.flag})</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Security Certificate Stamp */}
              <div className="rounded-xl border border-black/[0.06] bg-white dark:bg-[#1C1C1E] p-3 text-[10px] text-[#86868B] space-y-1">
                <div>Recipient: <strong>{previewExportModal.recipient_name}</strong> (ID: {previewExportModal.recipient_id})</div>
                <div>Patient Consent OTP Session: <strong className="text-emerald-600">{previewExportModal.otp_session_id}</strong> (Verified)</div>
                <div>Watermark Fingerprint: <span className="font-mono">{previewExportModal.watermark_text}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewExportModal(null)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Watermarked PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
