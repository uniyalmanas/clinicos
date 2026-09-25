"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { 
  Bed, 
  Building2, 
  UserPlus, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Phone, 
  Stethoscope, 
  IndianRupee, 
  RotateCw, 
  Sparkles, 
  Printer, 
  Share2, 
  X,
  Filter,
  Check,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  Lock,
  Unlock,
  ClipboardList,
  Syringe,
  CheckSquare,
  Square,
  Thermometer,
  Heart,
  Scale,
  Calendar,
  FileText
} from "lucide-react";

export type BedStatus = 
  | "VACANT_CLEAN" 
  | "VACANT_DIRTY" 
  | "OCCUPIED_ACTIVE" 
  | "OCCUPIED_PENDING_DISCHARGE" 
  | "MAINTENANCE";

export interface WardInfo {
  id: string;
  name: string;
  ward_type: string;
  daily_rate: number;
  hourly_rate: number;
  total_beds: number;
  occupied_beds: number;
}

export interface BedInfo {
  id: string;
  clinic_slug: string;
  ward_id: string;
  ward_name: string;
  ward_type: string;
  bed_number: string;
  status: BedStatus;
  admission_id?: string | null;
  current_patient_name?: string | null;
  current_patient_phone?: string | null;
  assigned_doctor_name?: string | null;
  admission_notes?: string | null;
  admission_timestamp?: string | null;
  discharge_ordered_at?: string | null;
  doctor_discharge_signed?: boolean;
  is_escalated?: boolean;
  escalation_minutes?: number;
  daily_rate: number;
  hourly_rate: number;
  stay_hours: number;
  accrued_base_charge: number;
  itemized_ledger_charge: number;
  accrued_charge: number;
  // Dual-Verified Sanitization
  sanitization_hk_logged?: boolean;
  sanitization_hk_at?: string | null;
  sanitization_hk_by?: string | null;
  sanitization_nurse_qa?: boolean;
  sanitization_nurse_at?: string | null;
  sanitization_nurse_by?: string | null;
  // Clinical Protocols
  active_vitals_protocol?: string;
  last_vitals_logged_at?: string | null;
  last_vitals?: {
    bp: string;
    pulse: number;
    spo2: number;
    temp: number;
    pain_scale?: number;
    breach?: boolean;
    breachReasons?: string[];
  };
  vitals_breach_alert?: boolean;
  pending_care_tasks_count?: number;
  completed_care_tasks_count?: number;
}

export interface DischargeInvoice {
  receipt_number: string;
  admission_id: string;
  patient_name: string;
  patient_phone: string;
  assigned_doctor: string;
  bed_number: string;
  ward_name: string;
  admission_time: string;
  discharge_time: string;
  total_stay_hours: number;
  billing_basis: string;
  room_charges: number;
  consumables_charges: number;
  itemized_ledger_items: Array<{ description: string; amount: number; type: string; time: string }>;
  total_amount: number;
  payment_mode: string;
  payment_status: string;
  next_bed_state: string;
}

export interface CareTask {
  id: string;
  bed_id: string;
  admission_id?: string;
  task_type: string;
  description: string;
  due_time: string;
  threshold_criteria?: string;
  status: "pending" | "completed";
  assigned_to: string;
  completed_at?: string;
  completed_by_esign?: string;
}

export interface BillingLedgerEntry {
  id: string;
  admission_id: string;
  bed_number: string;
  charge_type: string;
  description: string;
  amount: number;
  source_order_ref: string;
  posted_by: string;
  posted_at: string;
}

export default function DashboardBedsPage() {
  const [beds, setBeds] = useState<BedInfo[]>([]);
  const [wards, setWards] = useState<WardInfo[]>([]);
  const [metrics, setMetrics] = useState({
    total_beds: 10,
    occupied_count: 4,
    occupied_active_count: 3,
    discharge_pending_count: 1,
    vacant_clean_count: 4,
    vacant_dirty_count: 1,
    vacant_count: 5,
    maintenance_count: 1,
    occupancy_rate_percent: 40.0,
    estimated_daily_revenue: 10000.0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matrix" | "tasks" | "ledger">("matrix");
  const [activeWardFilter, setActiveWardFilter] = useState("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");

  // Notifications / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [admitModalBed, setAdmitModalBed] = useState<BedInfo | null>(null);
  const [admitForm, setAdmitForm] = useState({
    patient_name: "",
    patient_phone: "+91 9",
    assigned_doctor_name: "Dr. Rahul Sharma",
    admission_type: "post_op_recovery",
    admission_notes: "Post-treatment monitoring & recovery protocol",
    vitals_protocol: "q4h"
  });

  // Sanitization Modals
  const [sanitizationBed, setSanitizationBed] = useState<BedInfo | null>(null);
  const [sanitizationStep, setSanitizationStep] = useState<"hk" | "nurse_qa">("hk");
  const [hkForm, setHkForm] = useState({
    staff_name: "Ramesh Kumar (Housekeeping Lead)",
    disinfection_method: "UV-C 30-min Cycle + Sodium Hypochlorite 1% Wipe"
  });
  const [nurseQaForm, setNurseQaForm] = useState({
    nurse_name: "Sister Sunita (Duty Sister)",
    esign: "ESIGN-NURSE-QA-VERIFIED"
  });

  // Vitals & Care Tasks Modal
  const [vitalsModalBed, setVitalsModalBed] = useState<BedInfo | null>(null);
  const [vitalsForm, setVitalsForm] = useState({
    bp: "120/80",
    pulse: 74,
    spo2: 98,
    temp: 98.4,
    pain_scale: 1,
    nurse_name: "Sister Sunita (Duty Nurse)"
  });
  const [bedTasks, setBedTasks] = useState<CareTask[]>([]);

  // Bedside Charge Capture Modal
  const [chargeModalBed, setChargeModalBed] = useState<BedInfo | null>(null);
  const [chargeForm, setChargeForm] = useState({
    description: "IV Cannula 20G + NS 500ml Infusion Kit",
    amount: 180,
    charge_type: "consumable",
    nurse_name: "Duty Nurse"
  });

  // Discharge Order & Settlement Modals
  const [dischargeOrderBed, setDischargeOrderBed] = useState<BedInfo | null>(null);
  const [dischargeSettlementBed, setDischargeSettlementBed] = useState<BedInfo | null>(null);
  const [dischargeChecklist, setDischargeChecklist] = useState({
    doctor_signoff: true,
    pharmacy_reconciled: true,
    billing_settled: true,
    transport_ready: true
  });
  const [dischargePaymentMode, setDischargePaymentMode] = useState<"upi" | "cash">("upi");
  const [completedInvoice, setCompletedInvoice] = useState<DischargeInvoice | null>(null);

  // Billing Ledger State (Tab 3)
  const [billingLedger, setBillingLedger] = useState<BillingLedgerEntry[]>([]);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Load beds from API with fallback
  const fetchBeds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds`);
      if (res.ok) {
        const data = await res.json();
        setBeds(data.beds || []);
        setWards(data.wards || []);
        setMetrics(data.metrics || metrics);
      } else {
        loadFallbackBeds();
      }
    } catch (err) {
      loadFallbackBeds();
    } finally {
      setLoading(false);
    }
  };

  // Load Billing Ledger
  const fetchLedger = async () => {
    setIsLoadingLedger(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/ledger`);
      if (res.ok) {
        const data = await res.json();
        setBillingLedger(data.ledger || []);
      }
    } catch {} finally {
      setIsLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchBeds();
    fetchLedger();
  }, []);

  const loadFallbackBeds = () => {
    const fallbackWards: WardInfo[] = [
      { id: "ward-1", name: "Daycare Recovery Suite", ward_type: "daycare_recovery", daily_rate: 1400, hourly_rate: 150, total_beds: 3, occupied_beds: 1 },
      { id: "ward-2", name: "Private Deluxe Suite", ward_type: "private_deluxe", daily_rate: 3200, hourly_rate: 300, total_beds: 2, occupied_beds: 2 },
      { id: "ward-3", name: "General Observation Ward", ward_type: "general", daily_rate: 900, hourly_rate: 100, total_beds: 3, occupied_beds: 1 },
      { id: "ward-4", name: "Emergency HDU & Monitoring", ward_type: "icu", daily_rate: 4500, hourly_rate: 450, total_beds: 2, occupied_beds: 1 }
    ];

    const fallbackBeds: BedInfo[] = [
      {
        id: "bed-01",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-1",
        ward_name: "Daycare Recovery Suite",
        ward_type: "daycare_recovery",
        bed_number: "DC-01",
        status: "OCCUPIED_ACTIVE",
        admission_id: "ADM-DC01-9481",
        current_patient_name: "Amit Rawat",
        current_patient_phone: "+919123456780",
        assigned_doctor_name: "Dr. Rahul Sharma",
        admission_notes: "Post-PRP laser therapy recovery. Monitor vitals for 4 hours.",
        admission_timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
        daily_rate: 1400,
        hourly_rate: 150,
        stay_hours: 3.5,
        accrued_base_charge: 525,
        itemized_ledger_charge: 180,
        accrued_charge: 705,
        active_vitals_protocol: "q4h",
        last_vitals: { bp: "118/76", pulse: 72, spo2: 99, temp: 98.4 },
        pending_care_tasks_count: 1,
        completed_care_tasks_count: 2
      },
      {
        id: "bed-02",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-1",
        ward_name: "Daycare Recovery Suite",
        ward_type: "daycare_recovery",
        bed_number: "DC-02",
        status: "VACANT_CLEAN",
        daily_rate: 1400,
        hourly_rate: 150,
        stay_hours: 0,
        accrued_base_charge: 0,
        itemized_ledger_charge: 0,
        accrued_charge: 0,
        sanitization_hk_logged: true,
        sanitization_nurse_qa: true
      },
      {
        id: "bed-03",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-1",
        ward_name: "Daycare Recovery Suite",
        ward_type: "daycare_recovery",
        bed_number: "DC-03",
        status: "VACANT_DIRTY",
        daily_rate: 1400,
        hourly_rate: 150,
        stay_hours: 0,
        accrued_base_charge: 0,
        itemized_ledger_charge: 0,
        accrued_charge: 0,
        sanitization_hk_logged: false,
        sanitization_nurse_qa: false
      },
      {
        id: "bed-04",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-2",
        ward_name: "Private Deluxe Suite",
        ward_type: "private_deluxe",
        bed_number: "DLX-101",
        status: "OCCUPIED_ACTIVE",
        admission_id: "ADM-DLX101-8120",
        current_patient_name: "Sunita Joshi",
        current_patient_phone: "+919876543299",
        assigned_doctor_name: "Dr. Rahul Sharma",
        admission_notes: "Admitted for severe drug-induced urticarial rash and systemic observation.",
        admission_timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        daily_rate: 3200,
        hourly_rate: 300,
        stay_hours: 18.0,
        accrued_base_charge: 3200,
        itemized_ledger_charge: 450,
        accrued_charge: 3650,
        active_vitals_protocol: "q4h",
        last_vitals: { bp: "124/82", pulse: 78, spo2: 98, temp: 98.6 },
        pending_care_tasks_count: 2,
        completed_care_tasks_count: 3
      },
      {
        id: "bed-05",
        clinic_slug: "derma-care-dehradun",
        ward_id: "ward-2",
        ward_name: "Private Deluxe Suite",
        ward_type: "private_deluxe",
        bed_number: "DLX-102",
        status: "OCCUPIED_PENDING_DISCHARGE",
        admission_id: "ADM-DLX102-7711",
        current_patient_name: "Pooja Rawat",
        current_patient_phone: "+919876511223",
        assigned_doctor_name: "Dr. Aditi Joshi",
        admission_notes: "Post-op jaw observation. Final discharge summary pending doctor sign-off.",
        admission_timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
        discharge_ordered_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
        doctor_discharge_signed: false,
        is_escalated: true,
        escalation_minutes: 150,
        daily_rate: 3200,
        hourly_rate: 300,
        stay_hours: 26.0,
        accrued_base_charge: 6400,
        itemized_ledger_charge: 600,
        accrued_charge: 7000,
        pending_care_tasks_count: 0,
        completed_care_tasks_count: 4
      }
    ];

    setWards(fallbackWards);
    setBeds(fallbackBeds);
  };

  // 1. Admission Handler
  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitModalBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: admitModalBed.id,
          patient_name: admitForm.patient_name,
          patient_phone: admitForm.patient_phone,
          assigned_doctor_name: admitForm.assigned_doctor_name,
          admission_type: admitForm.admission_type,
          admission_notes: admitForm.admission_notes,
          vitals_protocol: admitForm.vitals_protocol
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAdmitModalBed(null);
        showToast(data.message);
        fetchBeds();
        fetchLedger();
      } else {
        const err = await res.json();
        showToast(`Admission Blocked: ${err.error}`);
      }
    } catch {
      showToast("Admission service error.");
    }
  };

  // 2. Dual-Verification Sanitization Handlers
  const handleHousekeepingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizationBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: sanitizationBed.id,
          action: "housekeeping_log",
          hk_staff_name: hkForm.staff_name,
          disinfection_method: hkForm.disinfection_method
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setSanitizationBed(null);
        fetchBeds();
      }
    } catch {}
  };

  const handleNurseQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitizationBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/clean`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: sanitizationBed.id,
          action: "nurse_qa",
          nurse_qa_name: nurseQaForm.nurse_name,
          nurse_qa_esign: nurseQaForm.esign
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setSanitizationBed(null);
        fetchBeds();
      } else {
        const err = await res.json();
        showToast(`Verification Failed: ${err.error}`);
      }
    } catch {}
  };

  // 3. Initiate Discharge Order (Freezes billing meter)
  const handleInitiateDischargeOrder = async (bed: BedInfo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/discharge-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: bed.id,
          ordered_by: "Dr. Rahul Sharma",
          doctor_signoff: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        fetchBeds();
      }
    } catch {}
  };

  // 4. Final Discharge Settlement & Gate Release
  const handleFinalDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dischargeSettlementBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/discharge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: dischargeSettlementBed.id,
          payment_mode: dischargePaymentMode,
          doctor_signoff: dischargeChecklist.doctor_signoff,
          pharmacy_reconciled: dischargeChecklist.pharmacy_reconciled,
          billing_settled: dischargeChecklist.billing_settled,
          transport_ready: dischargeChecklist.transport_ready
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCompletedInvoice(data.invoice);
        setDischargeSettlementBed(null);
        showToast(data.message);
        fetchBeds();
      } else {
        const err = await res.json();
        showToast(`Discharge Gate Blocked: ${err.error}`);
      }
    } catch {}
  };

  // 5. Vitals Log Handler (with Threshold Alerts)
  const handleLogVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalsModalBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "log_vitals",
          bed_id: vitalsModalBed.id,
          bp: vitalsForm.bp,
          pulse: vitalsForm.pulse,
          spo2: vitalsForm.spo2,
          temp: vitalsForm.temp,
          pain_scale: vitalsForm.pain_scale,
          nurse_name: vitalsForm.nurse_name
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setVitalsModalBed(null);
        fetchBeds();
      }
    } catch {}
  };

  // 6. Bedside Charge Capture Handler
  const handlePostBedsideCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeModalBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post_charge",
          bed_id: chargeModalBed.id,
          charge_description: chargeForm.description,
          charge_amount: chargeForm.amount,
          charge_type: chargeForm.charge_type,
          nurse_name: chargeForm.nurse_name
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setChargeModalBed(null);
        fetchBeds();
        fetchLedger();
      }
    } catch {}
  };

  // Filter beds
  const filteredBeds = beds.filter(bed => {
    const matchesWard = activeWardFilter === "all" || bed.ward_id === activeWardFilter || bed.ward_type === activeWardFilter;
    const matchesStatus = activeStatusFilter === "all" || bed.status === activeStatusFilter;
    return matchesWard && matchesStatus;
  });

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

      {/* 1. REVISED FUNCTIONAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Inpatient Bed Matrix &amp; Wards</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Dual-Verification Sanitization Active</span>
            </span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            State-Machine Inpatient Bed Operations
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Strict State Transitions • Automated Stay Billing &amp; Proration • Verified Sanitization • Structured Care Tasks
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06] shrink-0">
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "matrix"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <Bed className="h-3.5 w-3.5" />
            <span>Bed Matrix Map</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "ledger"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Stay Billing Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. REVISED FUNCTIONALLY COMPLETE 4-PILLAR OPERATIONAL GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: System-Enforced Bed States */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Strict State Machine
            </span>
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-400 font-mono">
              Zero Ghost Beds
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            System-Enforced Bed States
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            <code>VACANT_DIRTY</code> auto-blocks admission until dual sanitization verification. <code>PENDING_DISCHARGE</code> freezes billing and escalates after 2 hours without doctor sign-off.
          </p>
        </div>

        {/* Pillar 2: Automated Stay Billing Engine */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5" /> Automated Billing
            </span>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 font-mono">
              12:00 Proration
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Automated Stay Billing Engine
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Ward tariff auto-posts daily at 00:00. Consumables post via bedside entry. Discharge before 12:00 = half-day charge; after 12:00 = full-day. Immutable ledger links every debit.
          </p>
        </div>

        {/* Pillar 3: Dual-Verified Sanitization */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Tamper-Proof Clean
            </span>
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400 font-mono">
              Dual E-Sign
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Dual-Verified Sanitization
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Housekeeping scans bed QR &amp; logs UV cycle completion. Nurse completes spot-check QA e-sign within 30 minutes. Bed unlocks to <code>VACANT_CLEAN</code> only when both pass.
          </p>
        </div>

        {/* Pillar 4: Structured Clinical Tasks */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Clinical Tasks
            </span>
            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 font-mono">
              q4h Vitals
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Structured Care Protocols
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Replaces free-text notes with assigned care protocols. Auto-scheduled vitals with threshold breach alerts (SpO2 &lt;92%). Discharge checklist gates bed release.
          </p>
        </div>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <span className="text-[11px] font-medium text-[#86868B]">Total Licensed Beds</span>
          <div className="mt-1 text-2xl font-black text-[#1D1D1F] dark:text-white">{metrics.total_beds}</div>
          <span className="text-[10px] text-[#86868B]">Across 4 specialized wards</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/30 p-4 shadow-sm dark:bg-emerald-500/5">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Ready for Admission</span>
          <div className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">{metrics.vacant_clean_count}</div>
          <span className="text-[10px] text-emerald-600">VACANT_CLEAN (QA Passed)</span>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/30 p-4 shadow-sm dark:bg-amber-500/5">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Sanitization Pending</span>
          <div className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-400">{metrics.vacant_dirty_count}</div>
          <span className="text-[10px] text-amber-600">VACANT_DIRTY (Blocked)</span>
        </div>

        <div className="rounded-2xl border border-blue-500/30 bg-blue-50/30 p-4 shadow-sm dark:bg-blue-500/5">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Active Inpatients</span>
          <div className="mt-1 text-2xl font-black text-blue-700 dark:text-blue-400">{metrics.occupied_active_count}</div>
          <span className="text-[10px] text-blue-600">{metrics.occupancy_rate_percent}% Occupancy</span>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-50/30 p-4 shadow-sm dark:bg-purple-500/5">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">Discharge Pending</span>
          <div className="mt-1 text-2xl font-black text-purple-700 dark:text-purple-400">{metrics.discharge_pending_count}</div>
          <span className="text-[10px] text-purple-600">Billing Meter Frozen</span>
        </div>
      </div>

      {/* TAB 1: BED MATRIX MAP */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-[#86868B] mr-2">Filter Ward:</span>
              <button
                onClick={() => setActiveWardFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeWardFilter === "all" ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]" : "text-[#86868B] hover:bg-[#F5F5F7]"
                }`}
              >
                All Wards
              </button>
              {wards.map(w => (
                <button
                  key={w.id}
                  onClick={() => setActiveWardFilter(w.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activeWardFilter === w.id ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]" : "text-[#86868B] hover:bg-[#F5F5F7]"
                  }`}
                >
                  {w.name} ({w.occupied_beds}/{w.total_beds})
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activeStatusFilter}
                onChange={e => setActiveStatusFilter(e.target.value)}
                className="rounded-xl border border-black/[0.1] bg-[#F5F5F7] px-3 py-1.5 text-xs font-bold text-[#1D1D1F] dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-white"
              >
                <option value="all">All States</option>
                <option value="VACANT_CLEAN">VACANT_CLEAN (Ready)</option>
                <option value="VACANT_DIRTY">VACANT_DIRTY (Blocked)</option>
                <option value="OCCUPIED_ACTIVE">OCCUPIED_ACTIVE</option>
                <option value="OCCUPIED_PENDING_DISCHARGE">PENDING_DISCHARGE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          {/* Bed Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-[#86868B]">
                <RotateCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0071E3]" />
                Loading state-machine inpatient bed telemetry...
              </div>
            ) : filteredBeds.length === 0 ? (
              <div className="col-span-full py-12 text-center text-[#86868B]">
                No beds matching current filter.
              </div>
            ) : (
              filteredBeds.map(bed => {
                const isClean = bed.status === "VACANT_CLEAN";
                const isDirty = bed.status === "VACANT_DIRTY";
                const isActive = bed.status === "OCCUPIED_ACTIVE";
                const isPendingDischarge = bed.status === "OCCUPIED_PENDING_DISCHARGE";
                const isMaint = bed.status === "MAINTENANCE";

                return (
                  <div
                    key={bed.id}
                    className={`rounded-3xl border p-5 shadow-sm transition flex flex-col justify-between space-y-4 ${
                      isClean
                        ? "border-emerald-500/20 bg-white dark:bg-[#1C1C1E]"
                        : isDirty
                        ? "border-amber-500/30 bg-amber-500/[0.03] dark:bg-[#1C1C1E]"
                        : isActive
                        ? "border-blue-500/30 bg-white dark:bg-[#1C1C1E]"
                        : isPendingDischarge
                        ? "border-purple-500/30 bg-purple-500/[0.02] dark:bg-[#1C1C1E]"
                        : "border-zinc-300 bg-zinc-50 dark:bg-zinc-900"
                    }`}
                  >
                    <div>
                      {/* Bed Header & State Machine Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-[#1D1D1F] dark:text-white">
                            {bed.bed_number}
                          </span>
                          <span className="text-[10px] text-[#86868B] font-medium">
                            {bed.ward_name}
                          </span>
                        </div>

                        {/* State Badge */}
                        {isClean && (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            ✓ VACANT_CLEAN
                          </span>
                        )}
                        {isDirty && (
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                            ⚠️ VACANT_DIRTY
                          </span>
                        )}
                        {isActive && (
                          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-400 border border-blue-500/20">
                            ● OCCUPIED_ACTIVE
                          </span>
                        )}
                        {isPendingDischarge && (
                          <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 border border-purple-500/30">
                            ⏳ PENDING_DISCHARGE
                          </span>
                        )}
                        {isMaint && (
                          <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                            MAINTENANCE
                          </span>
                        )}
                      </div>

                      {/* Escalation Alert if > 2 hours pending doctor sign-off */}
                      {bed.is_escalated && (
                        <div className="mt-2.5 rounded-xl bg-rose-500/15 p-2 text-[11px] font-black text-rose-700 dark:text-rose-400 border border-rose-500/30 animate-pulse flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 shrink-0" />
                          <span>ESCALATED: Pending Doctor Sign-off for {bed.escalation_minutes} mins (&gt;2h SLA breach)</span>
                        </div>
                      )}

                      {/* Vitals Threshold Breach Alert */}
                      {bed.vitals_breach_alert && (
                        <div className="mt-2.5 rounded-xl bg-rose-600 p-2 text-[11px] font-black text-white shadow-sm flex items-center gap-1.5">
                          <Activity className="h-4 w-4 shrink-0" />
                          <span>CLINICAL ALERT: Critical vitals threshold breached!</span>
                        </div>
                      )}

                      {/* Middle Body: Patient & Clinical Information */}
                      {(isActive || isPendingDischarge) ? (
                        <div className="mt-3.5 space-y-2 border-t border-black/[0.04] pt-3 dark:border-white/[0.04]">
                          <div>
                            <div className="text-sm font-black text-[#1D1D1F] dark:text-white">
                              {bed.current_patient_name}
                            </div>
                            <div className="text-xs text-[#86868B]">
                              {bed.current_patient_phone} • Dr. {bed.assigned_doctor_name}
                            </div>
                            <div className="text-[10px] font-mono text-[#0071E3] mt-0.5">
                              ID: {bed.admission_id}
                            </div>
                          </div>

                          {/* Stay Billing Engine Counter */}
                          <div className="rounded-xl bg-[#F5F5F7] p-2.5 dark:bg-white/[0.04] text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-[#86868B]">Stay Duration:</span>
                              <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                                {bed.stay_hours} Hours {isPendingDischarge ? "(Meter Frozen)" : ""}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#86868B]">Room Base Tariff:</span>
                              <span className="font-mono font-medium">₹{bed.accrued_base_charge}</span>
                            </div>
                            {bed.itemized_ledger_charge > 0 && (
                              <div className="flex justify-between text-purple-700 dark:text-purple-400">
                                <span>Bedside Consumables:</span>
                                <span className="font-mono font-medium">+₹{bed.itemized_ledger_charge}</span>
                              </div>
                            )}
                            <div className="flex justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04] font-black text-[#1D1D1F] dark:text-white">
                              <span>Total Accrued:</span>
                              <span className="text-emerald-600 font-mono">₹{bed.accrued_charge}</span>
                            </div>
                          </div>

                          {/* Structured Vitals Snippet */}
                          {bed.last_vitals && (
                            <div className="flex items-center justify-between text-[11px] font-mono rounded-lg bg-blue-50/50 px-2.5 py-1.5 text-blue-900 dark:bg-blue-500/10 dark:text-blue-300">
                              <span>BP: <strong>{bed.last_vitals.bp}</strong></span>
                              <span>HR: <strong>{bed.last_vitals.pulse}</strong></span>
                              <span>SpO2: <strong className={bed.last_vitals.spo2 < 92 ? "text-rose-600 font-black" : ""}>{bed.last_vitals.spo2}%</strong></span>
                              <span>Temp: <strong>{bed.last_vitals.temp}°F</strong></span>
                            </div>
                          )}
                        </div>
                      ) : isDirty ? (
                        <div className="mt-3.5 space-y-2 border-t border-black/[0.04] pt-3 dark:border-white/[0.04]">
                          <div className="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-400 border border-amber-500/20 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5" /> Admission Gate Locked
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              Patient discharged. Requires dual-verification (Housekeeping UV cycle + Nurse QA e-sign) before re-admission.
                            </p>
                            <div className="pt-1 text-[10px] space-y-0.5">
                              <div className={bed.sanitization_hk_logged ? "text-emerald-700 font-bold" : "text-[#86868B]"}>
                                {bed.sanitization_hk_logged ? `✓ Housekeeping Completed by ${bed.sanitization_hk_by}` : "○ Step 1: Housekeeping UV cycle pending"}
                              </div>
                              <div className={bed.sanitization_nurse_qa ? "text-emerald-700 font-bold" : "text-[#86868B]"}>
                                {bed.sanitization_nurse_qa ? `✓ Nurse QA Signed by ${bed.sanitization_nurse_by}` : "○ Step 2: Nurse QA spot-check sign-off pending"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3.5 space-y-1.5 border-t border-black/[0.04] pt-3 dark:border-white/[0.04] text-xs text-[#86868B]">
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                            <Sparkles className="h-3.5 w-3.5" /> Sanitization Verified &amp; QA Passed
                          </div>
                          <p className="text-[11px]">Ready for immediate clinical admission.</p>
                          <p className="text-[10px] text-[#86868B]">Tariff: ₹{bed.daily_rate}/day (₹{bed.hourly_rate}/h)</p>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                      {isClean && (
                        <button
                          onClick={() => {
                            setAdmitModalBed(bed);
                            setAdmitForm({
                              patient_name: "",
                              patient_phone: "+91 9",
                              assigned_doctor_name: "Dr. Rahul Sharma",
                              admission_type: "post_op_recovery",
                              admission_notes: "Clinical monitoring & post-treatment recovery",
                              vitals_protocol: "q4h"
                            });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0071E3] py-2 text-xs font-bold text-white hover:bg-[#0077ED] transition shadow-sm"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Admit Patient</span>
                        </button>
                      )}

                      {isDirty && (
                        <div className="space-y-1.5">
                          {!bed.sanitization_hk_logged ? (
                            <button
                              onClick={() => {
                                setSanitizationBed(bed);
                                setSanitizationStep("hk");
                              }}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>1. Log Housekeeping UV Cycle</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSanitizationBed(bed);
                                setSanitizationStep("nurse_qa");
                              }}
                              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>2. Nurse QA Spot-Check E-sign</span>
                            </button>
                          )}

                          <button
                            disabled
                            className="w-full py-1 text-[10px] font-bold text-[#86868B] cursor-not-allowed text-center"
                          >
                            🔒 Admission Gate Blocked Until QA Sign-off
                          </button>
                        </div>
                      )}

                      {isActive && (
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => {
                              setVitalsModalBed(bed);
                              setVitalsForm({
                                bp: bed.last_vitals?.bp || "120/80",
                                pulse: bed.last_vitals?.pulse || 74,
                                spo2: bed.last_vitals?.spo2 || 98,
                                temp: bed.last_vitals?.temp || 98.4,
                                pain_scale: bed.last_vitals?.pain_scale || 1,
                                nurse_name: "Sister Sunita (Duty Nurse)"
                              });
                            }}
                            className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] py-2 text-[11px] font-bold text-[#1D1D1F] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-white/[0.06] transition text-center"
                          >
                            Vitals / Tasks
                          </button>

                          <button
                            onClick={() => {
                              setChargeModalBed(bed);
                            }}
                            className="rounded-xl border border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/10 py-2 text-[11px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 transition text-center"
                          >
                            + Consumable
                          </button>

                          <button
                            onClick={() => handleInitiateDischargeOrder(bed)}
                            className="rounded-xl bg-orange-600 py-2 text-[11px] font-bold text-white hover:bg-orange-700 transition shadow-sm text-center"
                          >
                            Order Discharge
                          </button>
                        </div>
                      )}

                      {isPendingDischarge && (
                        <button
                          onClick={() => {
                            setDischargeSettlementBed(bed);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Release Bed &amp; Settle Invoice</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IMMUTABLE STAY BILLING LEDGER */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Inpatient Stay Billing &amp; Consumables Ledger
                </h2>
                <p className="text-xs text-[#86868B]">
                  Immutable audit trail linking every ward tariff debit and bedside consumable scan to source order, user, and timestamp
                </p>
              </div>
              <button
                onClick={fetchLedger}
                className="flex items-center gap-1.5 rounded-xl bg-[#F5F5F7] px-3.5 py-1.5 text-xs font-bold hover:bg-[#E5E5EA] dark:bg-white/[0.06] dark:text-white"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Refresh Ledger</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-white/[0.03] text-[#86868B] font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Bed / Admission ID</th>
                    <th className="px-3 py-2.5">Charge Type</th>
                    <th className="px-3 py-2.5">Item Description</th>
                    <th className="px-3 py-2.5">Posted By</th>
                    <th className="px-3 py-2.5 text-right">Debit Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {billingLedger.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#86868B]">
                        No active stay ledger records found.
                      </td>
                    </tr>
                  ) : (
                    billingLedger.map(entry => (
                      <tr key={entry.id}>
                        <td className="px-3 py-2.5 font-mono text-[#86868B]">
                          {new Date(entry.posted_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">{entry.bed_number}</span>
                          <span className="block text-[10px] text-[#86868B]">{entry.admission_id || "Direct Bed"}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 capitalize">
                            {entry.charge_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium">{entry.description}</td>
                        <td className="px-3 py-2.5 text-[#86868B]">{entry.posted_by}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{entry.amount}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SYSTEM-ENFORCED ADMISSION MODAL */}
      {admitModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Inpatient Bed Admission Gate
                </h3>
                <p className="text-xs text-[#86868B]">
                  Admitting to Bed {admitModalBed.bed_number} ({admitModalBed.ward_name})
                </p>
              </div>
              <button onClick={() => setAdmitModalBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-400 border border-emerald-500/20">
              ✓ <strong>Sanitization Verified:</strong> Bed {admitModalBed.bed_number} passed dual-verification (Housekeeping UV cycle + Nurse QA spot-check). System unlocks patient intake.
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Joshi"
                    value={admitForm.patient_name}
                    onChange={e => setAdmitForm({ ...admitForm, patient_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Patient Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={admitForm.patient_phone}
                    onChange={e => setAdmitForm({ ...admitForm, patient_phone: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Attending Doctor</label>
                  <select
                    value={admitForm.assigned_doctor_name}
                    onChange={e => setAdmitForm({ ...admitForm, assigned_doctor_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  >
                    <option>Dr. Rahul Sharma</option>
                    <option>Dr. Aditi Joshi</option>
                    <option>Dr. Vikram Sethi</option>
                    <option>Dr. Priya Bansal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Vitals Monitoring Protocol</label>
                  <select
                    value={admitForm.vitals_protocol}
                    onChange={e => setAdmitForm({ ...admitForm, vitals_protocol: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  >
                    <option value="q4h">q4h (Standard 4-Hourly Monitoring)</option>
                    <option value="q2h_icu">q2h HDU / High-Acuity ICU Protocol</option>
                    <option value="q8h_general">q8h General Stable Observation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Admission Reason &amp; Care Directives</label>
                <textarea
                  rows={2}
                  value={admitForm.admission_notes}
                  onChange={e => setAdmitForm({ ...admitForm, admission_notes: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
              </div>

              <div className="rounded-xl bg-[#F5F5F7] p-3 dark:bg-white/[0.04] text-[11px] text-[#86868B] space-y-1">
                <div className="flex justify-between font-bold text-[#1D1D1F] dark:text-white">
                  <span>Day 1 Base Tariff Auto-Debit:</span>
                  <span>₹{admitModalBed.daily_rate}</span>
                </div>
                <p>Immutable ledger entry will be posted upon admission confirmation. Intake vitals scheduled immediately.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdmitModalBed(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0071E3] px-5 py-2 text-xs font-bold text-white hover:bg-[#0077ED] shadow-sm"
                >
                  Confirm Admission &amp; Start Billing Meter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DUAL-VERIFICATION SANITIZATION WORKFLOW */}
      {sanitizationBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Dual-Verified Bed Sanitization
                </h3>
                <p className="text-xs text-[#86868B]">
                  Bed {sanitizationBed.bed_number} • State: VACANT_DIRTY
                </p>
              </div>
              <button onClick={() => setSanitizationBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sanitizationStep === "hk" ? (
              <form onSubmit={handleHousekeepingSubmit} className="space-y-3.5 text-xs">
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-400 border border-amber-500/20 text-[11px]">
                  <strong>Step 1 of 2:</strong> Housekeeping staff scans bed QR &amp; logs chemical/UV terminal disinfection. Bed will remain in VACANT_DIRTY awaiting Nurse QA spot-check.
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Housekeeping Staff Name</label>
                  <input
                    type="text"
                    required
                    value={hkForm.staff_name}
                    onChange={e => setHkForm({ ...hkForm, staff_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  />
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Disinfection Method</label>
                  <select
                    value={hkForm.disinfection_method}
                    onChange={e => setHkForm({ ...hkForm, disinfection_method: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  >
                    <option>UV-C 30-min Cycle + Sodium Hypochlorite 1% Wipe</option>
                    <option>Terminal Hydrogen Peroxide Vapor (HPV) Disinfection</option>
                    <option>Formalin Fogging + Quaternary Ammonium Surface Scrub</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSanitizationBed(null)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm"
                  >
                    Log Terminal Disinfection
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleNurseQaSubmit} className="space-y-3.5 text-xs">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 text-[11px]">
                  <strong>Step 2 of 2:</strong> Duty Sister performs physical spot-check (linen, suction, oxygen outlet, surface cleanliness) within 30 min and e-signs to unlock bed.
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Nurse In-Charge QA Name</label>
                  <input
                    type="text"
                    required
                    value={nurseQaForm.nurse_name}
                    onChange={e => setNurseQaForm({ ...nurseQaForm, nurse_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  />
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Nurse Electronic Signature Pin</label>
                  <input
                    type="text"
                    required
                    value={nurseQaForm.esign}
                    onChange={e => setNurseQaForm({ ...nurseQaForm, esign: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSanitizationBed(null)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                  >
                    Pass QA &amp; Unlock to VACANT_CLEAN
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: VITALS PROTOCOL & CLINICAL CARE TASKS */}
      {vitalsModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Bedside Vitals &amp; Care Protocol
                </h3>
                <p className="text-xs text-[#86868B]">
                  Bed {vitalsModalBed.bed_number} • Patient: {vitalsModalBed.current_patient_name}
                </p>
              </div>
              <button onClick={() => setVitalsModalBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleLogVitals} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">BP (mmHg)</label>
                  <input
                    type="text"
                    required
                    value={vitalsForm.bp}
                    onChange={e => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Pulse (bpm)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.pulse}
                    onChange={e => setVitalsForm({ ...vitalsForm, pulse: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={vitalsForm.spo2}
                    onChange={e => setVitalsForm({ ...vitalsForm, spo2: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={vitalsForm.temp}
                    onChange={e => setVitalsForm({ ...vitalsForm, temp: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/50 p-2.5 dark:bg-blue-500/10 text-[11px] text-blue-900 dark:text-blue-300">
                <strong>Threshold Criteria:</strong> SpO2 &lt; 92% triggers immediate Code Blue hypoxia alert; BP &gt; 160/100 triggers hypertensive notification to attending doctor.
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Recording Nurse Signature</label>
                <input
                  type="text"
                  required
                  value={vitalsForm.nurse_name}
                  onChange={e => setVitalsForm({ ...vitalsForm, nurse_name: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVitalsModalBed(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0071E3] px-5 py-2 text-xs font-bold text-white hover:bg-[#0077ED]"
                >
                  Record Vitals &amp; Check Thresholds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BEDSIDE CONSUMABLE CHARGE CAPTURE */}
      {chargeModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Bedside Consumable Charge Capture
                </h3>
                <p className="text-xs text-[#86868B]">
                  Bed {chargeModalBed.bed_number} • Patient: {chargeModalBed.current_patient_name}
                </p>
              </div>
              <button onClick={() => setChargeModalBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePostBedsideCharge} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Select Nursing Consumable / Procedure</label>
                <select
                  value={chargeForm.description}
                  onChange={e => {
                    const desc = e.target.value;
                    let price = 180;
                    if (desc.includes("Nebulization")) price = 120;
                    if (desc.includes("Wound Dressing")) price = 350;
                    if (desc.includes("Catheter")) price = 400;
                    if (desc.includes("Oxygen")) price = 250;
                    setChargeForm({ ...chargeForm, description: desc, amount: price });
                  }}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                >
                  <option value="IV Cannula 20G + NS 500ml Infusion Kit">IV Cannula 20G + NS 500ml Infusion Kit (₹180)</option>
                  <option value="Nebulization Chamber + Levolin Respule">Nebulization Chamber + Levolin Respule (₹120)</option>
                  <option value="Sterile Post-Op Wound Dressing Kit">Sterile Post-Op Wound Dressing Kit (₹350)</option>
                  <option value="High-Flow Oxygen Therapy (2 Hours)">High-Flow Oxygen Therapy (2 Hours) (₹250)</option>
                  <option value="Foley Catheterization Insertion Kit">Foley Catheterization Insertion Kit (₹400)</option>
                </select>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Debit Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={chargeForm.amount}
                  onChange={e => setChargeForm({ ...chargeForm, amount: Number(e.target.value) })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-mono font-bold text-base"
                />
              </div>

              <div className="rounded-xl bg-[#F5F5F7] p-2.5 dark:bg-white/[0.04] text-[10px] text-[#86868B]">
                Immutable Ledger: This charge will be atomically appended to the patient's inpatient stay billing ledger.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChargeModalBed(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                >
                  Post Debit to Stay Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DISCHARGE CHECKLIST GATES & SETTLEMENT */}
      {dischargeSettlementBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Discharge Checklist Gates &amp; Settlement
                </h3>
                <p className="text-xs text-[#86868B]">
                  Bed {dischargeSettlementBed.bed_number} • Patient: {dischargeSettlementBed.current_patient_name}
                </p>
              </div>
              <button onClick={() => setDischargeSettlementBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Checklist Gates */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F5F7] p-3.5 dark:bg-white/[0.04] space-y-2 text-xs">
              <span className="font-bold text-[#1D1D1F] dark:text-white block mb-1">
                Mandatory Clinical &amp; Administrative Gates:
              </span>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dischargeChecklist.doctor_signoff}
                  onChange={e => setDischargeChecklist({ ...dischargeChecklist, doctor_signoff: e.target.checked })}
                  className="h-4 w-4 rounded text-purple-600"
                />
                <span className={dischargeChecklist.doctor_signoff ? "font-bold text-[#1D1D1F] dark:text-white" : "text-[#86868B]"}>
                  1. Attending Doctor Clinical Discharge Sign-off &amp; Summary
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dischargeChecklist.pharmacy_reconciled}
                  onChange={e => setDischargeChecklist({ ...dischargeChecklist, pharmacy_reconciled: e.target.checked })}
                  className="h-4 w-4 rounded text-purple-600"
                />
                <span className={dischargeChecklist.pharmacy_reconciled ? "font-bold text-[#1D1D1F] dark:text-white" : "text-[#86868B]"}>
                  2. Pharmacy Medication Reconciliation &amp; Take-Home Counseling
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dischargeChecklist.billing_settled}
                  onChange={e => setDischargeChecklist({ ...dischargeChecklist, billing_settled: e.target.checked })}
                  className="h-4 w-4 rounded text-purple-600"
                />
                <span className={dischargeChecklist.billing_settled ? "font-bold text-[#1D1D1F] dark:text-white" : "text-[#86868B]"}>
                  3. Inpatient Stay Billing Balance Settled (Room Tariff + Consumables)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dischargeChecklist.transport_ready}
                  onChange={e => setDischargeChecklist({ ...dischargeChecklist, transport_ready: e.target.checked })}
                  className="h-4 w-4 rounded text-purple-600"
                />
                <span className={dischargeChecklist.transport_ready ? "font-bold text-[#1D1D1F] dark:text-white" : "text-[#86868B]"}>
                  4. Patient Escort / Safe Transport Confirmed
                </span>
              </label>
            </div>

            {/* Bill Preview */}
            <div className="rounded-xl border border-black/[0.06] p-3 text-xs space-y-1 dark:border-white/[0.08]">
              <div className="flex justify-between">
                <span className="text-[#86868B]">Room Base Charges (Proration Rule):</span>
                <span className="font-mono font-medium">₹{dischargeSettlementBed.accrued_base_charge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Bedside Itemized Consumables:</span>
                <span className="font-mono font-medium">₹{dischargeSettlementBed.itemized_ledger_charge}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-black/[0.04] text-sm font-black text-[#1D1D1F] dark:text-white">
                <span>Final Settlement Amount:</span>
                <span className="text-emerald-600 font-mono">₹{dischargeSettlementBed.accrued_charge}</span>
              </div>
            </div>

            <form onSubmit={handleFinalDischarge} className="space-y-3 text-xs">
              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDischargePaymentMode("upi")}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      dischargePaymentMode === "upi" ? "bg-[#0071E3] text-white" : "bg-[#F5F5F7] text-[#86868B]"
                    }`}
                  >
                    UPI / QR Soundbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setDischargePaymentMode("cash")}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      dischargePaymentMode === "cash" ? "bg-[#0071E3] text-white" : "bg-[#F5F5F7] text-[#86868B]"
                    }`}
                  >
                    Cash Front-Desk
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDischargeSettlementBed(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!dischargeChecklist.doctor_signoff || !dischargeChecklist.billing_settled}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm disabled:opacity-50"
                >
                  Release Bed to VACANT_DIRTY &amp; Issue Memo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: PRINTABLE INPATIENT DISCHARGE SUMMARY & CASH MEMO */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="text-center border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div className="inline-flex rounded-full bg-emerald-500/10 p-2 text-emerald-600 mb-2">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                Inpatient Stay Bill &amp; Discharge Summary
              </h3>
              <p className="text-xs text-[#86868B]">
                DocSphere ClinicOS • GSTIN: 05AAACH8419L1Z5
              </p>
              <p className="font-mono text-xs font-bold text-[#0071E3] mt-1">
                {completedInvoice.receipt_number}
              </p>
            </div>

            <div className="text-xs space-y-1">
              <p>Patient: <strong>{completedInvoice.patient_name}</strong> ({completedInvoice.patient_phone})</p>
              <p>Attending: <strong>{completedInvoice.assigned_doctor}</strong> • Ward: {completedInvoice.ward_name} (Bed {completedInvoice.bed_number})</p>
              <p>Duration: <strong>{completedInvoice.total_stay_hours}h</strong> ({completedInvoice.admission_time} ➔ {completedInvoice.discharge_time})</p>
              <p className="text-[#86868B]">Billing Rule: {completedInvoice.billing_basis}</p>
            </div>

            <div className="border-t border-b border-black/[0.06] py-2 dark:border-white/[0.08] space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>Room Charges:</span>
                <span className="font-mono">₹{completedInvoice.room_charges}</span>
              </div>
              {completedInvoice.consumables_charges > 0 && (
                <div className="flex justify-between font-bold text-purple-700 dark:text-purple-400">
                  <span>Bedside Consumables &amp; Nursing:</span>
                  <span className="font-mono">₹{completedInvoice.consumables_charges}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-base font-black text-[#1D1D1F] dark:text-white">
              <span>Total Paid &amp; Settled:</span>
              <span className="text-emerald-600 font-mono">₹{completedInvoice.total_amount}</span>
            </div>

            <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-400 border border-amber-500/20">
              <strong>State Machine Notice:</strong> Bed {completedInvoice.bed_number} has transitioned to <code>VACANT_DIRTY</code>. Admissions remain locked until dual sanitization verification.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCompletedInvoice(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-[#1D1D1F] px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-[#1D1D1F]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Discharge Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
