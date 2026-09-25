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
  FileText,
  KeyRound,
  ShieldAlert,
  UserCheck,
  ArrowRight
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
  breach_tier?: number;
  breach_triggered_at?: string | null;
  breach_acknowledged?: boolean;
  breach_acknowledged_at?: string | null;
  breach_acknowledged_by?: string | null;
  breach_intervention_log?: string | null;
  breach_escalation_history?: any[];
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
  bed_number?: string;
  admission_id?: string;
  task_type: string;
  description: string;
  due_time: string;
  threshold_criteria?: string;
  status: "pending" | "completed";
  assigned_to: string;
  completed_at?: string;
  completed_by_esign?: string;
  shift_carryover_count?: number;
  carried_over_from_shift?: string;
  carried_over_to_nurse?: string;
}

export interface BillingLedgerEntry {
  id: string;
  admission_id?: string;
  bed_id: string;
  bed_number: string;
  charge_type: string;
  description: string;
  amount: number;
  source_order_ref: string;
  posted_by: string;
  posted_at: string;
}

export interface BillingOverrideRecord {
  id: string;
  admission_id?: string;
  bed_id: string;
  bed_number: string;
  supervisor_name: string;
  supervisor_pin_verified?: boolean;
  reason_code: string;
  original_amount: number;
  adjusted_amount: number;
  adjustment_delta: number;
  waiver_notes: string;
  created_at: string;
}

export interface ShiftHandoverRecord {
  id: string;
  outgoing_nurse_name: string;
  incoming_nurse_name: string;
  shift_name: string;
  ward_id?: string;
  carried_over_tasks_count: number;
  active_breach_alerts_count: number;
  handover_notes: string;
  incoming_esign: string;
  handed_over_at: string;
  tasks_snapshot?: any;
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
  const [activeTab, setActiveTab] = useState<"matrix" | "ledger">("matrix");
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

  // Fix 1: Alert Escalation Pathway & Intervention Modal
  const [acknowledgeModalBed, setAcknowledgeModalBed] = useState<BedInfo | null>(null);
  const [ackInterventionForm, setAckInterventionForm] = useState({
    intervention_log: "",
    acknowledged_by: "Sister Sunita (Duty Nurse)",
    rechecked_spo2: 98,
    rechecked_bp: "120/80",
    rechecked_pulse: 76
  });
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Fix 2: Governed Billing Override Modal & Ledger Sub-Tab
  const [billingLedger, setBillingLedger] = useState<BillingLedgerEntry[]>([]);
  const [overridesList, setOverridesList] = useState<BillingOverrideRecord[]>([]);
  const [ledgerSubTab, setLedgerSubTab] = useState<"ledger" | "overrides">("ledger");
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTargetBed, setOverrideTargetBed] = useState<BedInfo | null>(null);
  const [overrideForm, setOverrideForm] = useState({
    supervisor_name: "Dr. Meenakshi Sundaram (MS)",
    supervisor_pin: "7788",
    reason_code: "ICU_TRANSFER",
    original_amount: 3200,
    adjusted_amount: 1600,
    waiver_notes: "Emergency transfer to ICU; ward tariff prorated and capped by MS."
  });

  // Fix 3: Bedside Consumable Modal with Anti-Double-Post Protection
  const [chargeModalBed, setChargeModalBed] = useState<BedInfo | null>(null);
  const [chargeForm, setChargeForm] = useState({
    description: "IV Cannula 20G + NS 500ml Infusion Kit",
    amount: 180,
    charge_type: "consumable",
    nurse_name: "Duty Nurse"
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{
    detected: boolean;
    message: string;
    previousCharge?: any;
  } | null>(null);

  // Fix 4: Shift Handover & Task Carry-Over Modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverForm, setHandoverForm] = useState({
    outgoing_nurse_name: "Sister Sunita (Duty Sister - Morning)",
    incoming_nurse_name: "Sister Priyanka (Duty Sister - Evening)",
    shift_name: "Morning -> Evening (14:00 IST)",
    handover_notes: "All beds reviewed. 2 patients post-procedure, vitals stable. IV fluids continuing on DC-01.",
    incoming_esign: "ESIGN-PRIYANKA-RN-4912"
  });
  const [allPendingTasks, setAllPendingTasks] = useState<CareTask[]>([]);
  const [handoverHistory, setHandoverHistory] = useState<ShiftHandoverRecord[]>([]);
  const [selectedHandoverPrint, setSelectedHandoverPrint] = useState<ShiftHandoverRecord | null>(null);

  // Discharge Order & Settlement Modals
  const [dischargeSettlementBed, setDischargeSettlementBed] = useState<BedInfo | null>(null);
  const [dischargeChecklist, setDischargeChecklist] = useState({
    doctor_signoff: true,
    pharmacy_reconciled: true,
    billing_settled: true,
    transport_ready: true
  });
  const [dischargePaymentMode, setDischargePaymentMode] = useState<"upi" | "cash">("upi");
  const [completedInvoice, setCompletedInvoice] = useState<DischargeInvoice | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Live timer for escalation countdown & elapsed duration
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Load Billing Ledger & Overrides
  const fetchLedger = async () => {
    setIsLoadingLedger(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/ledger`);
      if (res.ok) {
        const data = await res.json();
        setBillingLedger(data.ledger || []);
        setOverridesList(data.overrides || []);
      }
    } catch {} finally {
      setIsLoadingLedger(false);
    }
  };

  // Load pending tasks across ward for shift handover
  const fetchTasksAndHandovers = async () => {
    try {
      const resTasks = await fetch(`${API_BASE_URL}/api/v1/beds/tasks`);
      if (resTasks.ok) {
        const data = await resTasks.json();
        const pending = (data.tasks || []).filter((t: CareTask) => t.status === "pending");
        setAllPendingTasks(pending);
      }
      const resHandovers = await fetch(`${API_BASE_URL}/api/v1/beds/tasks?view=handovers`);
      if (resHandovers.ok) {
        const data = await resHandovers.json();
        setHandoverHistory(data.handovers || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchBeds();
    fetchLedger();
    fetchTasksAndHandovers();
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
        fetchTasksAndHandovers();
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
          staff_name: hkForm.staff_name,
          disinfection_method: hkForm.disinfection_method
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setSanitizationStep("nurse_qa");
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
          action: "nurse_qa_signoff",
          nurse_name: nurseQaForm.nurse_name,
          esign: nurseQaForm.esign
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

  // 3. Discharge Order Initiate
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

  // Fix 1: Acknowledge Breach & Log Clinical Intervention
  const handleAcknowledgeBreach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acknowledgeModalBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "acknowledge_breach",
          bed_id: acknowledgeModalBed.id,
          acknowledged_by: ackInterventionForm.acknowledged_by,
          intervention_log: ackInterventionForm.intervention_log,
          rechecked_vitals: {
            spo2: ackInterventionForm.rechecked_spo2,
            bp: ackInterventionForm.rechecked_bp,
            pulse: ackInterventionForm.rechecked_pulse
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setAcknowledgeModalBed(null);
        fetchBeds();
      } else {
        const err = await res.json();
        showToast(`Acknowledgment Failed: ${err.error}`);
      }
    } catch {
      showToast("Service error acknowledging breach alert.");
    }
  };

  // Fix 2: Apply Governed Billing Override Handler
  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTargetBed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: overrideTargetBed.id,
          admission_id: overrideTargetBed.admission_id,
          supervisor_name: overrideForm.supervisor_name,
          supervisor_pin: overrideForm.supervisor_pin,
          reason_code: overrideForm.reason_code,
          original_amount: overrideForm.original_amount,
          adjusted_amount: overrideForm.adjusted_amount,
          waiver_notes: overrideForm.waiver_notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setOverrideModalOpen(false);
        fetchBeds();
        fetchLedger();
      } else {
        const err = await res.json();
        showToast(`Override Blocked: ${err.error}`);
      }
    } catch {
      showToast("Service error processing governed override.");
    }
  };

  // Fix 3: Bedside Charge Capture Handler (with Concurrency Row-Locking & Dup Guard)
  const handlePostBedsideCharge = async (e: React.FormEvent, confirmDuplicate: boolean = false) => {
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
          nurse_name: chargeForm.nurse_name,
          confirm_duplicate: confirmDuplicate
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setChargeModalBed(null);
        setDuplicateWarning(null);
        fetchBeds();
        fetchLedger();
      } else if (res.status === 409) {
        const err = await res.json();
        setDuplicateWarning({
          detected: true,
          message: err.error,
          previousCharge: err.previous_charge
        });
      } else {
        const err = await res.json();
        showToast(`Charge Posting Failed: ${err.error}`);
      }
    } catch {}
  };

  // Fix 4: Shift Handover & Task Carry-Over Handler
  const handleExecuteShiftHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/beds/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "shift_handover",
          outgoing_nurse_name: handoverForm.outgoing_nurse_name,
          incoming_nurse_name: handoverForm.incoming_nurse_name,
          shift_name: handoverForm.shift_name,
          handover_notes: handoverForm.handover_notes,
          incoming_esign: handoverForm.incoming_esign
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setHandoverModalOpen(false);
        fetchBeds();
        fetchTasksAndHandovers();
      } else {
        const err = await res.json();
        showToast(`Handover Incomplete: ${err.error}`);
      }
    } catch {
      showToast("Handover service error.");
    }
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

        {/* Navigation & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Shift Handover Action Button */}
          <button
            onClick={() => {
              fetchTasksAndHandovers();
              setHandoverModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95 transition"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Shift Handover</span>
            {allPendingTasks.length > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-mono">
                {allPendingTasks.length} Pending
              </span>
            )}
          </button>

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
              onClick={() => {
                setActiveTab("ledger");
                fetchLedger();
              }}
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

        {/* Pillar 2: Automated Stay Billing Engine (Updated with Governed Overrides & Row-Locking) */}
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
            Tariff auto-posts daily at 00:00. Consumables post via bedside entry (inherits row-locking; duplicate scans within 60s flagged). Discharge before 12:00 = half-day; after 12:00 = full-day. Overrides require Supervisor PIN + Reason Code, logged separately for audit. Immutable ledger links every debit.
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

        {/* Pillar 4: Structured Care Protocols (Updated with Tiered Escalation & Shift Handover) */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Clinical Tasks
            </span>
            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 font-mono">
              Escalation Ladder
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Structured Care Protocols
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Auto-scheduled vitals with threshold breach alerts (SpO2 &lt;92%). Tiered escalation: Nurse PWA → Charge Nurse SMS → Doctor Call if unacknowledged in 60s. Uncompleted tasks auto-carry over at shift handover with mandatory incoming nurse sign-off. Discharge checklist gates bed release.
          </p>
        </div>
      </div>

      {/* TAB 1: BED MATRIX MAP */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Status KPI Chips & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-3.5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveStatusFilter("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeStatusFilter === "all"
                    ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]"
                    : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                All Beds ({metrics.total_beds})
              </button>

              <button
                onClick={() => setActiveStatusFilter("OCCUPIED_ACTIVE")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeStatusFilter === "OCCUPIED_ACTIVE"
                    ? "bg-blue-600 text-white"
                    : "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Active ({metrics.occupied_active_count})</span>
              </button>

              <button
                onClick={() => setActiveStatusFilter("OCCUPIED_PENDING_DISCHARGE")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeStatusFilter === "OCCUPIED_PENDING_DISCHARGE"
                    ? "bg-purple-600 text-white"
                    : "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100"
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>Discharge Pending ({metrics.discharge_pending_count})</span>
              </button>

              <button
                onClick={() => setActiveStatusFilter("VACANT_CLEAN")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeStatusFilter === "VACANT_CLEAN"
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Vacant Clean ({metrics.vacant_clean_count})</span>
              </button>

              <button
                onClick={() => setActiveStatusFilter("VACANT_DIRTY")}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeStatusFilter === "VACANT_DIRTY"
                    ? "bg-amber-600 text-white"
                    : "text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Vacant Dirty ({metrics.vacant_dirty_count})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#86868B]">
              <span>Occupancy Rate:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {metrics.occupancy_rate_percent}%
              </span>
            </div>
          </div>

          {/* Ward Matrix Bed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBeds.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#86868B]">
                No beds matching the active status filter.
              </div>
            ) : (
              filteredBeds.map(bed => {
                const isClean = bed.status === "VACANT_CLEAN";
                const isDirty = bed.status === "VACANT_DIRTY";
                const isActive = bed.status === "OCCUPIED_ACTIVE";
                const isPendingDischarge = bed.status === "OCCUPIED_PENDING_DISCHARGE";
                const isMaint = bed.status === "MAINTENANCE";

                // Escalation seconds elapsed
                let breachSecondsElapsed = 0;
                if (bed.vitals_breach_alert && bed.breach_triggered_at) {
                  breachSecondsElapsed = Math.max(0, Math.floor((nowTime - new Date(bed.breach_triggered_at).getTime()) / 1000));
                }
                const isTier2 = (bed.breach_tier || 1) >= 2 || breachSecondsElapsed >= 60;

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

                      {/* Fix 1: Vitals Threshold Breach Alert & Escalation Ladder Widget */}
                      {bed.vitals_breach_alert && (
                        <div className={`mt-2.5 rounded-2xl p-3 text-xs text-white shadow-md border ${
                          isTier2 
                            ? "bg-rose-600 border-rose-700 animate-pulse" 
                            : "bg-red-500 border-red-600"
                        } space-y-2`}>
                          <div className="flex items-center justify-between">
                            <span className="font-black flex items-center gap-1.5 tracking-wide uppercase text-[10px]">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              {isTier2 ? "🚨 Tier 2 Auto-Escalated" : "⚠️ Tier 1 Alert Active"}
                            </span>
                            <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold">
                              {breachSecondsElapsed}s elapsed
                            </span>
                          </div>

                          <p className="text-[11px] leading-tight font-medium">
                            {isTier2 
                              ? "Unacknowledged for > 60s! Auto-dispatched SMS to Ward Charge Nurse & Doctor Emergency Call."
                              : "SpO2/BP breach! Tier 1 Alert dispatched to assigned Nurse PWA. Auto-escalating to Doctor Call in 60s."}
                          </p>

                          <button
                            onClick={() => {
                              setAcknowledgeModalBed(bed);
                              setAckInterventionForm({
                                intervention_log: "",
                                acknowledged_by: "Sister Sunita (Duty Nurse)",
                                rechecked_spo2: bed.last_vitals?.spo2 || 98,
                                rechecked_bp: bed.last_vitals?.bp || "120/80",
                                rechecked_pulse: bed.last_vitals?.pulse || 76
                              });
                            }}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white text-[#1D1D1F] py-1.5 text-xs font-black hover:bg-white/90 shadow-sm transition"
                          >
                            <Activity className="h-3.5 w-3.5 text-rose-600" />
                            <span>Acknowledge &amp; Log Intervention</span>
                          </button>
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
                              setDuplicateWarning(null);
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

      {/* TAB 2: IMMUTABLE STAY BILLING LEDGER & GOVERNED OVERRIDES */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  Inpatient Stay Billing Ledger &amp; CA Audit Overrides
                </h2>
                <p className="text-xs text-[#86868B]">
                  Immutable ledger of daily tariff debits &amp; bedside entries. Tariff overrides require Supervisor PIN + Reason Code.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Apply Governed Override Button */}
                <button
                  onClick={() => {
                    const firstOccupied = beds.find(b => b.status === "OCCUPIED_ACTIVE" || b.status === "OCCUPIED_PENDING_DISCHARGE");
                    setOverrideTargetBed(firstOccupied || beds[0] || null);
                    setOverrideModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Apply Governed Override</span>
                </button>

                <button
                  onClick={fetchLedger}
                  className="flex items-center gap-1.5 rounded-xl bg-[#F5F5F7] px-3.5 py-1.5 text-xs font-bold hover:bg-[#E5E5EA] dark:bg-white/[0.06] dark:text-white"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs: Immutable Ledger vs CA Audit Overrides */}
            <div className="flex items-center gap-2 border-b border-black/[0.06] pb-2 dark:border-white/[0.06]">
              <button
                onClick={() => setLedgerSubTab("ledger")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  ledgerSubTab === "ledger"
                    ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]"
                    : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                Immutable Admission Debits ({billingLedger.length})
              </button>
              <button
                onClick={() => setLedgerSubTab("overrides")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  ledgerSubTab === "overrides"
                    ? "bg-amber-600 text-white"
                    : "text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                }`}
              >
                <KeyRound className="h-3 w-3" />
                <span>CA Audit Overrides &amp; Waivers ({overridesList.length})</span>
              </button>
            </div>

            {/* Sub Tab 1: Immutable Ledger Table */}
            {ledgerSubTab === "ledger" && (
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
                      billingLedger.map(entry => {
                        const isOverride = entry.charge_type === "supervisor_override";
                        return (
                          <tr key={entry.id} className={isOverride ? "bg-amber-500/[0.04]" : ""}>
                            <td className="px-3 py-2.5 font-mono text-[#86868B]">
                              {new Date(entry.posted_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">{entry.bed_number}</span>
                              <span className="block text-[10px] text-[#86868B]">{entry.admission_id || "Direct Bed"}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold capitalize ${
                                isOverride 
                                  ? "bg-amber-500/20 text-amber-900 dark:text-amber-300 font-mono" 
                                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              }`}>
                                {entry.charge_type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-medium">{entry.description}</td>
                            <td className="px-3 py-2.5 text-[#86868B]">{entry.posted_by}</td>
                            <td className={`px-3 py-2.5 text-right font-mono font-bold ${
                              isOverride ? "text-amber-700 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                            }`}>
                              ₹{entry.amount}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub Tab 2: CA Audit Overrides Table */}
            {ledgerSubTab === "overrides" && (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-500/20">
                  <strong>Statutory CA Audit Ledger:</strong> Every tariff adjustment, goodwill concession, or ICU transfer waiver is segregated here with Supervisor PIN verification and reason code to satisfy external audit compliance.
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F7] dark:bg-white/[0.03] text-[#86868B] font-semibold">
                      <tr>
                        <th className="px-3 py-2.5">Timestamp</th>
                        <th className="px-3 py-2.5">Bed &amp; Admission</th>
                        <th className="px-3 py-2.5">Reason Code</th>
                        <th className="px-3 py-2.5">Authorizing Supervisor</th>
                        <th className="px-3 py-2.5">Audit Justification Notes</th>
                        <th className="px-3 py-2.5 text-right">Original → Adjusted</th>
                        <th className="px-3 py-2.5 text-right">Adjustment Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {overridesList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-[#86868B]">
                            Zero billing overrides recorded. All room and consumable billing running strictly on automated formulas.
                          </td>
                        </tr>
                      ) : (
                        overridesList.map(ov => (
                          <tr key={ov.id}>
                            <td className="px-3 py-2.5 font-mono text-[#86868B]">
                              {new Date(ov.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                            </td>
                            <td className="px-3 py-2.5 font-mono font-bold text-[#1D1D1F] dark:text-white">
                              Bed {ov.bed_number}
                              <span className="block text-[10px] text-[#86868B]">{ov.admission_id}</span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-900 dark:text-amber-300 font-mono">
                                {ov.reason_code}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-[#1D1D1F] dark:text-white font-medium">
                              {ov.supervisor_name}
                              <span className="block text-[10px] text-emerald-600 font-bold">✓ PIN Verified</span>
                            </td>
                            <td className="px-3 py-2.5 text-[#86868B] max-w-xs">{ov.waiver_notes}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-[#86868B]">
                              ₹{ov.original_amount} → ₹{ov.adjusted_amount}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                              ₹{ov.adjustment_delta}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Dual-Verified Sanitization
                </h3>
                <p className="text-xs text-[#86868B]">
                  Bed {sanitizationBed.bed_number} ({sanitizationBed.ward_name})
                </p>
              </div>
              <button onClick={() => setSanitizationBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper Header */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-center">
              <div className={`p-2 rounded-xl border ${
                sanitizationStep === "hk"
                  ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                  : sanitizationBed.sanitization_hk_logged
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10"
                  : "border-black/[0.06] text-[#86868B]"
              }`}>
                Step 1: Housekeeping QR
              </div>
              <div className={`p-2 rounded-xl border ${
                sanitizationStep === "nurse_qa"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-black/[0.06] text-[#86868B]"
              }`}>
                Step 2: Nurse QA Spot-Check
              </div>
            </div>

            {/* Step 1: Housekeeping Log Form */}
            {sanitizationStep === "hk" && (
              <form onSubmit={handleHousekeepingSubmit} className="space-y-3 text-xs">
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
                  <label className="text-[#86868B] block mb-1 font-semibold">Disinfection Method Executed</label>
                  <input
                    type="text"
                    required
                    value={hkForm.disinfection_method}
                    onChange={e => setHkForm({ ...hkForm, disinfection_method: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  />
                </div>
                <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-500/20">
                  QR scan verified bed physical tag. Submitting records UV completion timestamp and begins 30-min Nurse QA window.
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
                    className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700"
                  >
                    Log UV Cycle &amp; Request Nurse QA
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Nurse QA Sign-off Form */}
            {sanitizationStep === "nurse_qa" && (
              <form onSubmit={handleNurseQaSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Staff Nurse Performing Spot-Check</label>
                  <input
                    type="text"
                    required
                    value={nurseQaForm.nurse_name}
                    onChange={e => setNurseQaForm({ ...nurseQaForm, nurse_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Clinical QA Digital Signature E-Sign</label>
                  <input
                    type="text"
                    required
                    value={nurseQaForm.esign}
                    onChange={e => setNurseQaForm({ ...nurseQaForm, esign: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-mono text-[11px]"
                  />
                </div>
                <div className="rounded-xl bg-emerald-500/10 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                  I certify that the bed surface, linen change, and UV cycle have been physically verified according to infection control standards.
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
                    className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
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
                <strong>Threshold Criteria &amp; Escalation:</strong> SpO2 &lt; 92% triggers Tier 1 Nurse PWA alert, auto-escalating to Ward Charge Nurse SMS + Doctor Call after 60s if unacknowledged.
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

      {/* FIX 1 MODAL: ACKNOWLEDGE BREACH & LOG MANDATORY INTERVENTION */}
      {acknowledgeModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4 border border-rose-500/30">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                    Tiered Escalation Ladder
                  </span>
                  <span className="font-mono text-xs text-[#86868B]">
                    Bed {acknowledgeModalBed.bed_number}
                  </span>
                </div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mt-1">
                  Acknowledge Clinical Breach &amp; Log Intervention
                </h3>
              </div>
              <button onClick={() => setAcknowledgeModalBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-rose-500/10 p-3 text-xs text-rose-800 dark:text-rose-300 border border-rose-500/20 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Mandatory Intervention Protocol Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                An alert cannot be dismissed passively. Clinical safety requires entering the exact therapeutic intervention performed (or re-checking vitals) before the escalation ladder is cleared.
              </p>
            </div>

            <form onSubmit={handleAcknowledgeBreach} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">
                  Quick Clinical Intervention Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "O2 Therapy 4L/min via Nasal Cannula",
                    "Emergency Airway Suction & Repositioning",
                    "IV Labetalol 20mg administered as ordered",
                    "Attending Physician Bedside Assessment Performed",
                    "Paracetamol 1g Infusion for Febrile Spike"
                  ].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAckInterventionForm({ ...ackInterventionForm, intervention_log: preset })}
                      className="rounded-lg bg-[#F5F5F7] px-2.5 py-1 text-[11px] font-medium hover:bg-[#E5E5EA] dark:bg-white/[0.06] dark:hover:bg-white/10"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">
                  Intervention Action Taken (Mandatory minimum 5 chars) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Started high-flow O2 @ 4L/min, checked airway, notified Dr. Rahul Sharma."
                  value={ackInterventionForm.intervention_log}
                  onChange={e => setAckInterventionForm({ ...ackInterventionForm, intervention_log: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Recheck SpO2 (%)</label>
                  <input
                    type="number"
                    value={ackInterventionForm.rechecked_spo2}
                    onChange={e => setAckInterventionForm({ ...ackInterventionForm, rechecked_spo2: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-1.5 font-mono font-bold dark:bg-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Recheck BP</label>
                  <input
                    type="text"
                    value={ackInterventionForm.rechecked_bp}
                    onChange={e => setAckInterventionForm({ ...ackInterventionForm, rechecked_bp: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-1.5 font-mono font-bold dark:bg-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Recheck Pulse</label>
                  <input
                    type="number"
                    value={ackInterventionForm.rechecked_pulse}
                    onChange={e => setAckInterventionForm({ ...ackInterventionForm, rechecked_pulse: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-1.5 font-mono font-bold dark:bg-white/[0.06]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Attending Staff Nurse Signature</label>
                <input
                  type="text"
                  required
                  value={ackInterventionForm.acknowledged_by}
                  onChange={e => setAckInterventionForm({ ...ackInterventionForm, acknowledged_by: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAcknowledgeModalBed(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md transition"
                >
                  Clear Alert &amp; Log Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 2 MODAL: GOVERNED BILLING OVERRIDE (SUPERVISOR PIN) */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4 border border-amber-500/30">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                    CA Audit Governed Override
                  </span>
                  {overrideTargetBed && (
                    <span className="font-mono text-xs text-[#86868B]">
                      Bed {overrideTargetBed.bed_number}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mt-1">
                  Apply Governed Tariff Override
                </h3>
              </div>
              <button onClick={() => setOverrideModalOpen(false)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-300 border border-amber-500/20 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Statutory Override Governance</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Unauthorized tariff adjustments are rejected. Adjustments require an authorized Supervisor PIN and a valid reason code (e.g., ICU Transfer, Insurance waiver). Overrides are logged into a separate CA audit table.
              </p>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Select Target Bed</label>
                  <select
                    value={overrideTargetBed?.id || ""}
                    onChange={e => {
                      const b = beds.find(x => x.id === e.target.value) || null;
                      setOverrideTargetBed(b);
                      if (b) {
                        setOverrideForm({
                          ...overrideForm,
                          original_amount: b.accrued_charge,
                          adjusted_amount: Math.round(b.accrued_charge * 0.5)
                        });
                      }
                    }}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  >
                    {beds.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.bed_number} - {b.current_patient_name || b.status} (₹{b.accrued_charge})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Reason Code *</label>
                  <select
                    value={overrideForm.reason_code}
                    onChange={e => setOverrideForm({ ...overrideForm, reason_code: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  >
                    <option value="ICU_TRANSFER">ICU_TRANSFER (Transfer to ICU - Prorate Ward)</option>
                    <option value="INSURANCE_WAIVER">INSURANCE_WAIVER (TPA Co-Pay Waiver)</option>
                    <option value="GOODWILL_DISCOUNT">GOODWILL_DISCOUNT (Medical Director Concession)</option>
                    <option value="DISPUTED_HOURS">DISPUTED_HOURS (Doctor Discharge Delay)</option>
                    <option value="CLINICAL_TOLERANCE">CLINICAL_TOLERANCE (Procedural Exception)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Original Total (₹)</label>
                  <input
                    type="number"
                    value={overrideForm.original_amount}
                    onChange={e => setOverrideForm({ ...overrideForm, original_amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Adjusted Total (₹)</label>
                  <input
                    type="number"
                    value={overrideForm.adjusted_amount}
                    onChange={e => setOverrideForm({ ...overrideForm, adjusted_amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.1] px-2 py-2 dark:bg-white/[0.06] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Ledger Delta</label>
                  <div className="w-full rounded-xl border border-black/[0.1] px-2 py-2 font-mono font-bold bg-[#F5F5F7] dark:bg-white/[0.04] text-amber-700 dark:text-amber-400">
                    ₹{overrideForm.adjusted_amount - overrideForm.original_amount}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Authorizing Supervisor Name</label>
                  <input
                    type="text"
                    required
                    value={overrideForm.supervisor_name}
                    onChange={e => setOverrideForm({ ...overrideForm, supervisor_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  />
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Supervisor PIN (Auth) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter Supervisor PIN (7788)"
                    value={overrideForm.supervisor_pin}
                    onChange={e => setOverrideForm({ ...overrideForm, supervisor_pin: e.target.value })}
                    className="w-full rounded-xl border border-amber-500/40 px-3 py-2 dark:bg-white/[0.06] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">CA Audit Waiver Justification Notes *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail the clinical or administrative reason for this tariff override for external auditors..."
                  value={overrideForm.waiver_notes}
                  onChange={e => setOverrideForm({ ...overrideForm, waiver_notes: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition"
                >
                  Authorize &amp; Post CA Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 3 MODAL: BEDSIDE CONSUMABLE CHARGE CAPTURE (With Concurrency Row-Locking & Dup Guard) */}
      {chargeModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Bedside Consumable Charge Entry
                </h3>
                <p className="text-xs text-[#86868B]">
                  Bed {chargeModalBed.bed_number} • Patient: {chargeModalBed.current_patient_name}
                </p>
              </div>
              <button onClick={() => setChargeModalBed(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Concurrency Row-Locking Notice */}
            <div className="rounded-xl bg-purple-500/10 p-2.5 text-[11px] text-purple-900 dark:text-purple-300 border border-purple-500/20">
              <strong>Pharmacy-Grade Concurrency:</strong> Bedside ledger posting inherits pessimistic row-level locking. Duplicate barcode scans within 60s trigger anti-double-post protection.
            </div>

            {/* Anti-Double-Post Warning Banner */}
            {duplicateWarning && (
              <div className="rounded-2xl bg-amber-500/15 p-3.5 border border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-2 animate-in fade-in">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Potential Double-Post Flagged</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {duplicateWarning.message}
                </p>
                <button
                  type="button"
                  onClick={e => handlePostBedsideCharge(e, true)}
                  className="w-full rounded-xl bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm"
                >
                  Confirm Secondary Unit (Supervisor Override)
                </button>
              </div>
            )}

            <form onSubmit={e => handlePostBedsideCharge(e, false)} className="space-y-3.5 text-xs">
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
                    setDuplicateWarning(null);
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

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Nurse E-Sign</label>
                <input
                  type="text"
                  required
                  value={chargeForm.nurse_name}
                  onChange={e => setChargeForm({ ...chargeForm, nurse_name: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
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
                  Post Debit (Row-Lock Verified)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 4 MODAL: MANDATORY SHIFT HANDOVER & TASK CARRY-OVER */}
      {handoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4 max-h-[90vh] overflow-y-auto border border-purple-500/30">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                    Inpatient Nursing Governance
                  </span>
                  <span className="text-xs text-[#86868B] font-bold">
                    Zero Tasks Dropped
                  </span>
                </div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mt-1">
                  Mandatory Shift Handover &amp; Care Task Transfer
                </h3>
              </div>
              <button onClick={() => setHandoverModalOpen(false)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-purple-500/10 p-3 text-xs text-purple-900 dark:text-purple-300 border border-purple-500/20 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 shrink-0 text-purple-600" />
                <span>Shift Handover Carry-Over Rule</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Structured care tasks never vanish at shift change. Any uncompleted vitals, nebulization, or wound dressing orders automatically carry over to the incoming nurse roster with dual e-signature audit trail.
              </p>
            </div>

            {/* Uncompleted Tasks Auto-Carrying Over */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1F] dark:text-white">
                <span>Uncompleted Care Tasks Auto-Transferring:</span>
                <span className="font-mono text-purple-600">
                  {allPendingTasks.length} Task(s) Active
                </span>
              </div>

              {allPendingTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 p-3 text-center text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  ✓ All scheduled care tasks for the active shift have been fully completed and signed.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {allPendingTasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#F5F5F7] p-2.5 dark:bg-white/[0.04] text-xs">
                      <div>
                        <span className="font-bold text-[#1D1D1F] dark:text-white">
                          Bed {t.bed_number || "Ward"}: {t.description}
                        </span>
                        <span className="block text-[10px] text-[#86868B]">
                          Due: {t.due_time} • Currently Assigned: {t.assigned_to}
                        </span>
                      </div>
                      <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-400 font-mono">
                        Auto-Carryover
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleExecuteShiftHandover} className="space-y-3.5 text-xs pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Outgoing Staff Nurse (Clocking Out)</label>
                  <input
                    type="text"
                    required
                    value={handoverForm.outgoing_nurse_name}
                    onChange={e => setHandoverForm({ ...handoverForm, outgoing_nurse_name: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                  />
                </div>

                <div>
                  <label className="text-[#86868B] block mb-1 font-semibold">Incoming Staff Nurse (Taking Charge) *</label>
                  <input
                    type="text"
                    required
                    value={handoverForm.incoming_nurse_name}
                    onChange={e => setHandoverForm({ ...handoverForm, incoming_nurse_name: e.target.value })}
                    className="w-full rounded-xl border border-purple-500/40 px-3 py-2 dark:bg-white/[0.06] font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Shift Transition</label>
                <select
                  value={handoverForm.shift_name}
                  onChange={e => setHandoverForm({ ...handoverForm, shift_name: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06] font-medium"
                >
                  <option value="Morning -> Evening (14:00 IST)">Morning Shift → Evening Shift (14:00 IST)</option>
                  <option value="Evening -> Night (22:00 IST)">Evening Shift → Night Shift (22:00 IST)</option>
                  <option value="Night -> Morning (08:00 IST)">Night Shift → Morning Shift (08:00 IST)</option>
                </select>
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Shift Handover Clinical Notes &amp; Observations</label>
                <textarea
                  rows={2}
                  value={handoverForm.handover_notes}
                  onChange={e => setHandoverForm({ ...handoverForm, handover_notes: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.1] px-3 py-2 dark:bg-white/[0.06]"
                />
              </div>

              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Incoming Nurse Mandatory Digital Sign-off (E-Sign) *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Registered Nurse E-Signature (e.g. ESIGN-PRIYANKA-RN-4912)"
                  value={handoverForm.incoming_esign}
                  onChange={e => setHandoverForm({ ...handoverForm, incoming_esign: e.target.value })}
                  className="w-full rounded-xl border border-purple-500/40 px-3 py-2 dark:bg-white/[0.06] font-mono text-[11px] font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandoverModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white hover:opacity-95 shadow-md"
                >
                  Complete Handover &amp; Transfer Care Tasks
                </button>
              </div>
            </form>

            {/* Recent Handover History */}
            {handoverHistory.length > 0 && (
              <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
                <div className="text-xs font-bold text-[#86868B]">Recent Shift Handover Audit Trail:</div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {handoverHistory.slice(0, 3).map(h => (
                    <div key={h.id} className="rounded-xl bg-[#F5F5F7] p-2 dark:bg-white/[0.03] text-[11px] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#1D1D1F] dark:text-white">
                          {h.outgoing_nurse_name} → {h.incoming_nurse_name}
                        </span>
                        <span className="block text-[10px] text-[#86868B]">
                          {h.shift_name} • {new Date(h.handed_over_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-purple-700 dark:text-purple-400">
                        {h.carried_over_tasks_count} Tasks Transferred
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

            <div className="rounded-xl bg-purple-500/10 p-3 text-xs text-purple-900 dark:text-purple-300 border border-purple-500/20 space-y-1">
              <div className="font-bold">4-Point Discharge Compliance Gates</div>
              <p className="text-[11px] leading-relaxed">
                Bed release is strictly blocked until all clinical and financial gates are satisfied.
              </p>
            </div>

            <form onSubmit={handleFinalDischarge} className="space-y-3.5 text-xs">
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-[#F5F5F7] dark:hover:bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={dischargeChecklist.doctor_signoff}
                    onChange={e => setDischargeChecklist({ ...dischargeChecklist, doctor_signoff: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-[#1D1D1F] dark:text-white">Gate 1: Attending Doctor Sign-off</div>
                    <div className="text-[10px] text-[#86868B]">Clinical discharge summary completed and digitally signed by Dr. {dischargeSettlementBed.assigned_doctor_name}</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-[#F5F5F7] dark:hover:bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={dischargeChecklist.pharmacy_reconciled}
                    onChange={e => setDischargeChecklist({ ...dischargeChecklist, pharmacy_reconciled: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-[#1D1D1F] dark:text-white">Gate 2: Pharmacy Medication Reconciliation</div>
                    <div className="text-[10px] text-[#86868B]">Unopened medicines returned to pharmacy; discharge medication kit dispensed.</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-[#F5F5F7] dark:hover:bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={dischargeChecklist.billing_settled}
                    onChange={e => setDischargeChecklist({ ...dischargeChecklist, billing_settled: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-[#1D1D1F] dark:text-white">Gate 3: Billing Ledger Settlement (Prorated)</div>
                    <div className="text-[10px] text-[#86868B]">Room tariff (pre/post 12:00 rule) + itemized bedside charges reconciled.</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-xl border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-[#F5F5F7] dark:hover:bg-white/[0.02]">
                  <input
                    type="checkbox"
                    checked={dischargeChecklist.transport_ready}
                    onChange={e => setDischargeChecklist({ ...dischargeChecklist, transport_ready: e.target.checked })}
                    className="h-4 w-4 rounded text-purple-600 focus:ring-0"
                  />
                  <div>
                    <div className="font-bold text-[#1D1D1F] dark:text-white">Gate 4: Transport &amp; Patient Escort Ready</div>
                    <div className="text-[10px] text-[#86868B]">Attendant present, wheelchair/stretcher transfer arranged.</div>
                  </div>
                </label>
              </div>

              {/* Settlement Summary */}
              <div className="rounded-xl bg-[#F5F5F7] p-3 dark:bg-white/[0.04] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#86868B]">
                  <span>Stay Hours &amp; Proration:</span>
                  <span className="font-mono">{dischargeSettlementBed.stay_hours}h ({dischargeSettlementBed.stay_hours <= 12 ? "Hourly" : "12:00 Proration Rule"})</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>Room Base Tariff:</span>
                  <span className="font-mono">₹{dischargeSettlementBed.accrued_base_charge}</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>Itemized Consumables:</span>
                  <span className="font-mono">₹{dischargeSettlementBed.itemized_ledger_charge}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-black/[0.06] dark:border-white/[0.06] font-black text-sm text-[#1D1D1F] dark:text-white">
                  <span>Total Payable:</span>
                  <span className="text-emerald-600 font-mono">₹{dischargeSettlementBed.accrued_charge}</span>
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="text-[#86868B] block mb-1 font-semibold">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDischargePaymentMode("upi")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      dischargePaymentMode === "upi"
                        ? "border-[#0071E3] bg-blue-50 text-[#0071E3] dark:bg-blue-500/10"
                        : "border-black/[0.08] dark:border-white/[0.08]"
                    }`}
                  >
                    UPI / QR Soundbox
                  </button>
                  <button
                    type="button"
                    onClick={() => setDischargePaymentMode("cash")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      dischargePaymentMode === "cash"
                        ? "border-[#0071E3] bg-blue-50 text-[#0071E3] dark:bg-blue-500/10"
                        : "border-black/[0.08] dark:border-white/[0.08]"
                    }`}
                  >
                    Cash / Card Counter
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
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                >
                  Confirm Discharge &amp; Lock to VACANT_DIRTY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: GENERATED INPATIENT DISCHARGE INVOICE */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.08]">
              <div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                  Settled Inpatient Tax Invoice
                </span>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white mt-1">
                  {completedInvoice.receipt_number}
                </h3>
              </div>
              <button onClick={() => setCompletedInvoice(null)} className="text-[#86868B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F5F5F7] p-3 dark:bg-white/[0.04]">
                <div>
                  <span className="text-[#86868B] block text-[10px]">Patient Name</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{completedInvoice.patient_name}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Bed &amp; Ward</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">Bed {completedInvoice.bed_number} ({completedInvoice.ward_name})</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Admission → Discharge</span>
                  <span className="font-mono">{completedInvoice.admission_time} → {completedInvoice.discharge_time}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Total Stay Duration</span>
                  <span className="font-mono font-bold">{completedInvoice.total_stay_hours} Hours</span>
                </div>
              </div>

              <div className="space-y-1.5 border-y border-black/[0.06] py-2.5 dark:border-white/[0.06]">
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Room Charges ({completedInvoice.billing_basis}):</span>
                  <span className="font-mono font-medium">₹{completedInvoice.room_charges}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868B]">Bedside Consumables &amp; Nursing Charges:</span>
                  <span className="font-mono font-medium">₹{completedInvoice.consumables_charges}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-black/[0.04] dark:border-white/[0.04] font-black text-sm text-[#1D1D1F] dark:text-white">
                  <span>Grand Total Paid:</span>
                  <span className="text-emerald-600 font-mono">₹{completedInvoice.total_amount}</span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                <strong>Next Bed State Machine Rule:</strong> Bed {completedInvoice.bed_number} has transitioned to <code>VACANT_DIRTY</code>. All admission attempts are hard-blocked until dual sanitization QA verification is logged.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] px-4 py-2 font-bold hover:bg-[#F5F5F7] dark:border-white/[0.08]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedInvoice(null)}
                  className="rounded-xl bg-[#0071E3] px-5 py-2 font-bold text-white hover:bg-[#0077ED]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
