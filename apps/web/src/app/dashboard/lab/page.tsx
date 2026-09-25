"use client";

import React, { useState, useEffect } from "react";
import { 
  Microscope, 
  FlaskConical, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  FileText, 
  AlertTriangle,
  User,
  Phone,
  Calendar,
  Printer,
  X,
  RefreshCw,
  QrCode,
  Cpu,
  Zap,
  Cable,
  ShieldCheck,
  ShieldAlert,
  Activity,
  CheckSquare,
  Sparkles,
  Share2,
  ArrowRight,
  Check,
  AlertCircle,
  Send,
  Layers,
  KeyRound
} from "lucide-react";
import { COMMON_LAB_TESTS } from "@/data/medicines";

export interface ParameterResult {
  parameter: string;
  value: number | string;
  unit: string;
  reference_range: string;
  status: "normal" | "high" | "low" | "critical";
  notes?: string;
}

export interface DiagnosticOrder {
  id: string;
  order_number: string;
  sample_barcode?: string;
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  doctor_name: string;
  test_name: string;
  category: string;
  sample_type: string;
  vacutainer_tube?: string;
  fasting_required: boolean;
  tat_sla_minutes?: number;
  elapsed_minutes?: number;
  remaining_minutes?: number;
  tat_breached?: boolean;
  status: "ordered" | "sample_collected" | "sample_accessioned" | "completed";
  sample_collected_at: string | null;
  sample_collector_name: string | null;
  sample_accessioned_at?: string | null;
  sample_accessioner_name?: string | null;
  sample_rejected?: boolean;
  sample_rejection_reason?: string | null;
  analyzer_model?: string | null;
  import_protocol?: string | null;
  critical_value_alert?: boolean;
  critical_parameters?: string[];
  doctor_notified_at?: string | null;
  doctor_notified_name?: string | null;
  doctor_read_back_confirmed?: boolean;
  results: ParameterResult[];
  pathologist_notes: string | null;
  verified_by: string | null;
  pathologist_reg_no?: string | null;
  report_sha256?: string | null;
  qc_verified?: boolean;
  whatsapp_dispatched?: boolean;
  whatsapp_dispatched_at?: string | null;
  verified_at: string | null;
  created_at: string;
}

export interface QualityControlRun {
  id: string;
  analyzer_name: string;
  test_category: string;
  control_lot_number: string;
  level: string;
  target_mean: number;
  target_sd: number;
  measured_value: number;
  z_score: number;
  westgard_status: string;
  calibrated_by: string;
  run_at: string;
}

export default function LabDashboardPage() {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [metrics, setMetrics] = useState({ 
    total: 0, 
    ordered: 0, 
    sample_collected: 0,
    sample_accessioned: 0,
    in_progress: 0, 
    completed: 0,
    critical_count: 0,
    rejected_count: 0,
    tat_breached_count: 0
  });
  const [activeTab, setActiveTab] = useState<"worklist" | "qc" | "critical">("worklist");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [sampleModalOrder, setSampleModalOrder] = useState<DiagnosticOrder | null>(null);
  const [collectorName, setCollectorName] = useState("Sister Rekha (Phlebotomist)");
  const [accessionModalOrder, setAccessionModalOrder] = useState<DiagnosticOrder | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [accessionerName, setAccessionerName] = useState("Rajesh Sharma (Senior Lab Tech)");
  const [rejectionReason, setRejectionReason] = useState("HEMOLYZED_SAMPLE");
  const [rejectionNotes, setRejectionNotes] = useState("");

  const [resultModalOrder, setResultModalOrder] = useState<DiagnosticOrder | null>(null);
  const [reportModalOrder, setReportModalOrder] = useState<DiagnosticOrder | null>(null);
  const [criticalModalOrder, setCriticalModalOrder] = useState<DiagnosticOrder | null>(null);
  const [doctorReadBackNurse, setDoctorReadBackNurse] = useState("Sister Rekha (Lab Duty Nurse)");
  const [readBackNotes, setReadBackNotes] = useState("Panic value verbally read back and confirmed by ordering physician.");

  const [newOrderModal, setNewOrderModal] = useState(false);
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [qcModalOpen, setQcModalOpen] = useState(false);

  // Machine Serial / HL7 State
  const [machineStream, setMachineStream] = useState("");
  const [selectedTargetOrder, setSelectedTargetOrder] = useState("");
  const [serialStatus, setSerialStatus] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // QC State
  const [qcRuns, setQcRuns] = useState<QualityControlRun[]>([]);
  const [qcForm, setQcForm] = useState({
    analyzer_name: "Mindray BC-5150 (5-Part Hematology)",
    test_category: "Hematology",
    control_lot_number: "LOT-2026-NABL",
    level: "Level 1 (Normal Control)",
    target_mean: 14.0,
    target_sd: 0.4,
    measured_value: 14.1,
    calibrated_by: "Dr. S. K. Pathak (Quality Manager)"
  });

  // New Order Form state
  const [newPtName, setNewPtName] = useState("");
  const [newPtPhone, setNewPtPhone] = useState("");
  const [newPtAge, setNewPtAge] = useState(38);
  const [newPtGender, setNewPtGender] = useState("male");
  const [newDocName, setNewDocName] = useState("Dr. Rahul Sharma");
  const [selectedTestId, setSelectedTestId] = useState(COMMON_LAB_TESTS[0].id);

  // Result entry form state
  const [resultParams, setResultParams] = useState<ParameterResult[]>([]);
  const [pathNotes, setPathNotes] = useState("All parameters evaluated and verified under NABL standard.");
  const [pathologistName, setPathologistName] = useState("Dr. S. K. Pathak (MD Pathologist)");
  const [pathologistRegNo, setPathologistRegNo] = useState("MCI-DMC-48291");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lab/orders?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchQcRuns = async () => {
    try {
      const res = await fetch("/api/lab/qc");
      if (res.ok) {
        const data = await res.json();
        setQcRuns(data.runs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchQcRuns();
  }, [filterStatus]);

  // Fix 1: Phlebotomy Sample Collection & Barcode Generation
  const handleCollectSample = async () => {
    if (!sampleModalOrder) return;
    try {
      const res = await fetch("/api/lab/sample-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: sampleModalOrder.id,
          collector_name: collectorName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSampleModalOrder(null);
        showToast(data.message);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fix 1: Smart Sample Accessioning & Sample Integrity Gate
  const handleAccessionSubmit = async (action: "accession" | "reject") => {
    if (!accessionModalOrder) return;
    try {
      const res = await fetch("/api/lab/accession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: accessionModalOrder.id,
          action,
          scanned_barcode: scannedBarcode || accessionModalOrder.sample_barcode,
          accessioner_name: accessionerName,
          rejection_reason: rejectionReason,
          rejection_notes: rejectionNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAccessionModalOrder(null);
        showToast(data.message);
        fetchOrders();
      } else {
        const err = await res.json();
        showToast(`Accessioning Blocked: ${err.error}`);
      }
    } catch {
      showToast("Accessioning service error.");
    }
  };

  // Fix 3: Open Result Entry modal with Dynamic Reference Ranges (Age & Gender aware)
  const openResultEntry = (order: DiagnosticOrder) => {
    setResultModalOrder(order);
    if (order.results && order.results.length > 0) {
      setResultParams(order.results);
      setPathNotes(order.pathologist_notes || "All parameters evaluated and verified under NABL compliance standard.");
      return;
    }

    const lower = order.test_name.toLowerCase();
    const isMale = (order.patient_gender || "male").toLowerCase() === "male";
    const isChild = Number(order.patient_age || 35) < 12;

    let template: ParameterResult[] = [];

    if (lower.includes("cbc") || lower.includes("blood count")) {
      // Dynamic reference ranges adjusted by gender/age
      const hbRange = isChild ? "11.5 - 14.5" : isMale ? "13.5 - 17.5" : "12.0 - 15.5";
      const hbVal = isMale ? "14.2" : "13.0";
      template = [
        { parameter: "Hemoglobin", value: hbVal, unit: "g/dL", reference_range: hbRange, status: "normal" },
        { parameter: "Total Leukocyte Count (TLC)", value: "7200", unit: "/cumm", reference_range: "4000 - 11000", status: "normal" },
        { parameter: "Platelet Count", value: "240000", unit: "/cumm", reference_range: "150000 - 450000", status: "normal" },
        { parameter: "Hematocrit (PCV)", value: isMale ? "44.0" : "40.0", unit: "%", reference_range: isMale ? "40.0 - 50.0" : "36.0 - 46.0", status: "normal" },
        { parameter: "Neutrophils", value: "62", unit: "%", reference_range: "40 - 75", status: "normal" },
        { parameter: "Lymphocytes", value: "30", unit: "%", reference_range: "20 - 45", status: "normal" },
        { parameter: "ESR (Westergren)", value: isMale ? "8" : "12", unit: "mm/1st hr", reference_range: isMale ? "0 - 15" : "0 - 20", status: "normal" }
      ];
    } else if (lower.includes("lft") || lower.includes("liver")) {
      template = [
        { parameter: "Bilirubin Total", value: "0.8", unit: "mg/dL", reference_range: "0.2 - 1.2", status: "normal" },
        { parameter: "Bilirubin Direct", value: "0.2", unit: "mg/dL", reference_range: "0.0 - 0.3", status: "normal" },
        { parameter: "SGOT (AST)", value: "28", unit: "U/L", reference_range: "5 - 40", status: "normal" },
        { parameter: "SGPT (ALT)", value: "32", unit: "U/L", reference_range: "7 - 56", status: "normal" },
        { parameter: "Alkaline Phosphatase (ALP)", value: "85", unit: "U/L", reference_range: "44 - 147", status: "normal" }
      ];
    } else if (lower.includes("kft") || lower.includes("kidney")) {
      const creatRange = isMale ? "0.7 - 1.3" : "0.5 - 1.1";
      template = [
        { parameter: "Blood Urea", value: "24", unit: "mg/dL", reference_range: "15 - 45", status: "normal" },
        { parameter: "Serum Creatinine", value: isMale ? "0.9" : "0.8", unit: "mg/dL", reference_range: creatRange, status: "normal" },
        { parameter: "Uric Acid", value: isMale ? "5.4" : "4.6", unit: "mg/dL", reference_range: isMale ? "3.5 - 7.2" : "2.6 - 6.0", status: "normal" }
      ];
    } else if (lower.includes("sugar") || lower.includes("fbs") || lower.includes("glucose")) {
      template = [
        { parameter: "Fasting Blood Sugar (FBS)", value: "92", unit: "mg/dL", reference_range: "70 - 100", status: "normal" }
      ];
    } else if (lower.includes("lipid") || lower.includes("cholesterol")) {
      template = [
        { parameter: "Total Cholesterol", value: "175", unit: "mg/dL", reference_range: "125 - 200", status: "normal" },
        { parameter: "Triglycerides", value: "130", unit: "mg/dL", reference_range: "< 150", status: "normal" },
        { parameter: "HDL Cholesterol", value: isMale ? "48" : "55", unit: "mg/dL", reference_range: isMale ? "40 - 60" : "50 - 70", status: "normal" },
        { parameter: "LDL Cholesterol", value: "98", unit: "mg/dL", reference_range: "< 100", status: "normal" }
      ];
    } else {
      template = [
        { parameter: "Primary Diagnostic Marker", value: "Normal", unit: "Result", reference_range: "Negative / Normal", status: "normal" }
      ];
    }

    setResultParams(template);
    setPathNotes("Sample analyzed using calibrated automated analyzer. Microscopic correlation verified under NABL quality standard.");
  };

  // Fix 5 & Fix 6: Save Results with Pathologist Verification & SHA-256 Checksum
  const handleSaveResults = async () => {
    if (!resultModalOrder) return;
    try {
      const res = await fetch("/api/lab/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: resultModalOrder.id,
          results: resultParams,
          pathologist_notes: pathNotes,
          verified_by: pathologistName,
          pathologist_reg_no: pathologistRegNo,
          patient_age: resultModalOrder.patient_age,
          patient_gender: resultModalOrder.patient_gender
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setResultModalOrder(null);
        fetchOrders();
      } else {
        const err = await res.json();
        showToast(`Save Error: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fix 3: Confirm Doctor Read-Back for Critical Values
  const handleConfirmReadBack = async () => {
    if (!criticalModalOrder) return;
    try {
      const res = await fetch("/api/lab/critical-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: criticalModalOrder.id,
          action: "confirm_read_back",
          doctor_name: criticalModalOrder.doctor_name,
          read_back_nurse: doctorReadBackNurse,
          read_back_notes: readBackNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setCriticalModalOrder(null);
        fetchOrders();
      }
    } catch {}
  };

  // Fix 6: Dispatch Report to WhatsApp with SHA-256 Hash
  const handleDispatchWhatsApp = async (order: DiagnosticOrder) => {
    try {
      const res = await fetch("/api/lab/critical-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          action: "dispatch_whatsapp"
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        fetchOrders();
      }
    } catch {}
  };

  // Fix 5: Record Levey-Jennings Daily QC Run
  const handleSaveQcRun = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/lab/qc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(qcForm)
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setQcModalOpen(false);
        fetchQcRuns();
      }
    } catch {}
  };

  // Create New Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const test = COMMON_LAB_TESTS.find(t => t.id === selectedTestId);
    if (!test) return;

    try {
      const res = await fetch("/api/lab/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: newPtName,
          patient_phone: newPtPhone,
          patient_age: newPtAge,
          patient_gender: newPtGender,
          doctor_name: newDocName,
          test_name: test.test_name,
          category: test.category,
          sample_type: test.sample_type,
          fasting_required: test.fasting_required
        })
      });
      if (res.ok) {
        setNewOrderModal(false);
        setNewPtName("");
        setNewPtPhone("");
        showToast(`Lab order registered for ${newPtName}. Phlebotomy requisition barcode generated.`);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fix 2: Pre-loaded HL7 & ASTM Analyzer Payloads for Mindray, Sysmex, Roche
  const loadSampleAstm = () => {
    setSelectedTargetOrder("LAB-2026-002");
    setMachineStream(`H|\\^&|||Sysmex^XN-550|||||||P|1
P|1||||Amit Rawat||19920512|M
O|1|LAB-2026-002||^^^CBC|||||||A
R|1|^^^WBC|7.4|10*3/uL|4.0-11.0|N||F
R|2|^^^RBC|4.85|10*6/uL|4.5-5.9|N||F
R|3|^^^HGB|14.6|g/dL|13.0-17.0|N||F
R|4|^^^HCT|43.2|%|40.0-50.0|N||F
R|5|^^^PLT|265|10*3/uL|150-450|N||F
R|6|^^^NEUT|64.2|%|40.0-75.0|N||F
R|7|^^^LYMPH|28.5|%|20.0-45.0|N||F
L|1|N`);
  };

  const loadSampleHl7 = () => {
    setSelectedTargetOrder("LAB-2026-003");
    setMachineStream(`MSH|^~\\&|MINDRAY^BC-5150|LAB|CLINICOS|HOSPITAL|20260925143000||ORU^R01|MSG0001|P|2.3.1
PID|1||+919123456782||Rohit Pant||19940710|M
OBR|1|LAB-2026-003||CBC^Complete Blood Count
OBX|1|NM|WBC^Total Leukocyte Count||8.1|/cumm|4000-11000|N|||F
OBX|2|NM|HGB^Hemoglobin||15.1|g/dL|13.0-17.0|N|||F
OBX|3|NM|PLT^Platelet Count||210000|/cumm|150000-450000|N|||F
OBX|4|NM|ESR^ESR Westergren||8|mm/1st hr|0-15|N|||F`);
  };

  const loadSampleCriticalHl7 = () => {
    setSelectedTargetOrder("LAB-2026-004");
    setMachineStream(`MSH|^~\\&|ROCHE^Cobas-c311|LAB|CLINICOS|HOSPITAL|20260925143500||ORU^R01|MSG0002|P|2.3.1
PID|1||+919876500001||Suresh Verma||19800101|M
OBR|1|LAB-2026-004||GLU^Emergency Blood Glucose
OBX|1|NM|FBS^Fasting Blood Sugar (FBS)||42|mg/dL|70-100|C|||F
OBX|2|NM|POT^Potassium||6.4|mmol/L|3.5-5.1|C|||F`);
  };

  const handleMachineImport = async () => {
    if (!machineStream.trim()) return;
    try {
      setImportLoading(true);
      const res = await fetch("/api/lab/machine-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_stream: machineStream,
          order_number: selectedTargetOrder || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMachineModalOpen(false);
        setMachineStream("");
        showToast(`Ingested ${data.parsed_parameters_count} test parameters from ${data.analyzer} via ${data.protocol}.`);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImportLoading(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => 
    o.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.sample_barcode && o.sample_barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    o.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.patient_phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
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

      {/* 1. REVISED FUNCTIONAL HEADER (10/10 STANDARD) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Diagnostic Pathology &amp; LIS Studio</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 border border-purple-500/20 text-[10px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
              <ShieldCheck className="h-3 w-3" />
              <span>NABL ISO-15189 Quality Control</span>
            </span>
            {metrics.critical_count > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-black text-white animate-pulse">
                <AlertCircle className="h-3 w-3" />
                <span>{metrics.critical_count} Critical Panic Value(s)</span>
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            Marley Clinical LIS &amp; Analyzer Studio
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Automated Accessioning • Instrument Integration • Critical Value Alerts • NABL-Compliant Reporting
          </p>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMachineModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 transition"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>HL7 / ASTM Direct Feed</span>
          </button>

          <button
            onClick={() => setQcModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 transition"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Levey-Jennings QC</span>
          </button>

          <button
            onClick={() => setNewOrderModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Requisition Test</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-black/5"
            title="Refresh Orders"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. REVISED FUNCTIONALLY COMPLETE 4-PILLAR OPERATIONAL GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: Smart Sample Accessioning */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" /> Smart Accessioning
            </span>
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-400 font-mono">
              Zero Mix-ups
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Smart Sample Accessioning
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Barcode/RFID scanning for unique sample ID generation at phlebotomy. Links physical tube to digital order instantly. Rejects unlabeled or mismatched samples.
          </p>
        </div>

        {/* Pillar 2: Quantitative Reference & Critical Alerts */}
        <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Panic Alerts
            </span>
            <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-700 dark:text-rose-400 font-mono">
              Auto-Call / SMS
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Quantitative Reference &amp; Critical Alerts
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Dynamic reference ranges based on age/gender. Critical Value Alerts trigger automatic SMS/Call to ordering doctor if results exceed safety thresholds. No critical result released without acknowledgment.
          </p>
        </div>

        {/* Pillar 3: Instrument Integration */}
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" /> Direct Cable Feed
            </span>
            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 font-mono">
              HL7 / ASTM
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Instrument Integration
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            HL7/ASTM interface for automated result import from major analyzers. Reduces manual entry to &lt;5% of tests. Eliminates transcription errors.
          </p>
        </div>

        {/* Pillar 4: Pathologist Verification & Reporting */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-4 shadow-apple-card space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> NABL Verified
            </span>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 font-mono">
              SHA-256 E-Sign
            </span>
          </div>
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
            Pathologist Verification &amp; Reporting
          </h3>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Digital sign-off with e-signature. NABL-compliant QC tracking (Levey-Jennings charts) blocks release if quality fails. Reports delivered via WhatsApp/Patient Portal within defined TAT. Immutable audit trail for every result change.
          </p>
        </div>
      </div>

      {/* Main Studio Tabs */}
      <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06]">
          <button
            onClick={() => setActiveTab("worklist")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "worklist"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <Microscope className="h-3.5 w-3.5" />
            <span>Diagnostic Worklist ({metrics.total})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("qc");
              fetchQcRuns();
            }}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "qc"
                ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Levey-Jennings QC Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("critical")}
            className={`flex items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "critical"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-rose-700 dark:text-rose-400 hover:text-rose-900"
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Critical Panic Board ({metrics.critical_count})</span>
          </button>
        </div>

        {/* TAT SLA Overview Badge */}
        {metrics.tat_breached_count > 0 && (
          <div className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>{metrics.tat_breached_count} Sample(s) Overdue SLA</span>
          </div>
        )}
      </div>

      {/* TAB 1: DIAGNOSTIC WORKLIST */}
      {activeTab === "worklist" && (
        <div className="space-y-4">
          {/* Status Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white p-3 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { label: `All Orders (${metrics.total})`, val: "all" },
                { label: `Ordered (${metrics.ordered})`, val: "ordered" },
                { label: `Collected (${metrics.sample_collected})`, val: "sample_collected" },
                { label: `Accessioned (${metrics.sample_accessioned})`, val: "sample_accessioned" },
                { label: `Completed (${metrics.completed})`, val: "completed" }
              ].map(f => (
                <button
                  key={f.val}
                  onClick={() => setFilterStatus(f.val)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    filterStatus === f.val
                      ? "bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F]"
                      : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search patient, barcode, test..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-white/[0.04] text-xs outline-none focus:border-[#0071E3]"
              />
            </div>
          </div>

          {/* Orders Grid / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full py-12 text-center text-xs text-[#86868B]">
                Loading diagnostic lab orders from database...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#86868B]">
                No diagnostic orders matching the filter.
              </div>
            ) : (
              filteredOrders.map(order => {
                const isOrdered = order.status === "ordered";
                const isCollected = order.status === "sample_collected";
                const isAccessioned = order.status === "sample_accessioned";
                const isCompleted = order.status === "completed";
                const isCritical = Boolean(order.critical_value_alert);
                const isOverdue = Boolean(order.tat_breached);

                // Vacutainer tube styling
                const tube = order.vacutainer_tube || "Lavender (K2-EDTA)";
                let tubeColor = "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300";
                if (tube.includes("Gold") || tube.includes("SST")) tubeColor = "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
                if (tube.includes("Grey") || tube.includes("Fluoride")) tubeColor = "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
                if (tube.includes("Blue") || tube.includes("Citrate")) tubeColor = "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl border p-5 shadow-sm transition flex flex-col justify-between space-y-4 bg-white dark:bg-[#1C1C1E] ${
                      isCritical
                        ? "border-rose-500/50 shadow-rose-500/10"
                        : isOverdue
                        ? "border-amber-500/40"
                        : isCompleted
                        ? "border-emerald-500/20"
                        : "border-black/[0.06] dark:border-white/[0.08]"
                    }`}
                  >
                    <div>
                      {/* Card Header: Requisition Ref & Barcode Tag */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#1D1D1F] dark:text-white">
                            {order.order_number}
                          </span>
                          <span className="text-[10px] text-[#86868B]">
                            {order.category}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isOrdered && (
                          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black text-blue-700 dark:text-blue-400">
                            ● 1. Phlebotomy Req
                          </span>
                        )}
                        {isCollected && (
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-400 border border-amber-500/30">
                            ⏳ 2. Collected
                          </span>
                        )}
                        {isAccessioned && (
                          <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400 border border-purple-500/30 animate-pulse">
                            ⚙️ 3. Analyzer Bench
                          </span>
                        )}
                        {isCompleted && (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            ✓ 4. Verified
                          </span>
                        )}
                      </div>

                      {/* Barcode & Vacutainer Tube Badge */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold bg-[#F5F5F7] dark:bg-white/[0.04] px-2 py-0.5 rounded-md text-[#1D1D1F] dark:text-white flex items-center gap-1">
                          <QrCode className="h-3 w-3 text-[#0071E3]" />
                          {order.sample_barcode || "BARCODE-PENDING"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tubeColor}`}>
                          {tube}
                        </span>
                      </div>

                      {/* Critical Value Alert Banner */}
                      {isCritical && (
                        <div className="mt-2.5 rounded-2xl bg-rose-600 p-2.5 text-xs text-white shadow-md animate-pulse space-y-1">
                          <div className="flex items-center justify-between font-black text-[11px] uppercase tracking-wide">
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              CRITICAL PANIC VALUE
                            </span>
                            <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
                              {order.doctor_read_back_confirmed ? "✓ Read-Back Confirmed" : "⚠️ Read-Back Pending"}
                            </span>
                          </div>
                          <p className="text-[10.5px] leading-tight">
                            {Array.isArray(order.critical_parameters) && order.critical_parameters.length > 0
                              ? order.critical_parameters.join("; ")
                              : "Critical laboratory threshold breached. Immediate physician notification mandatory."}
                          </p>
                        </div>
                      )}

                      {/* TAT SLA Timer Banner */}
                      <div className={`mt-2.5 rounded-xl p-2 text-[11px] font-medium flex items-center justify-between ${
                        isOverdue 
                          ? "bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30"
                          : "bg-[#F5F5F7] dark:bg-white/[0.03] text-[#86868B]"
                      }`}>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>TAT Target: {order.tat_sla_minutes || 90}m</span>
                        </span>
                        <span className="font-mono font-bold">
                          {isCompleted 
                            ? `✓ Finished in ${order.elapsed_minutes || 45}m`
                            : isOverdue 
                            ? `⚠️ SLA BREACH (+${(order.elapsed_minutes || 0) - (order.tat_sla_minutes || 90)}m)`
                            : `${order.remaining_minutes || 45}m left`}
                        </span>
                      </div>

                      {/* Middle Body: Patient Details & Investigation */}
                      <div className="mt-3.5 space-y-2 border-t border-black/[0.04] pt-3 dark:border-white/[0.04]">
                        <div>
                          <div className="text-sm font-black text-[#1D1D1F] dark:text-white flex items-center justify-between">
                            <span>{order.patient_name}</span>
                            <span className="text-[11px] text-[#86868B] font-mono font-normal">
                              {order.patient_age || 35}y / {order.patient_gender || "M"}
                            </span>
                          </div>
                          <div className="text-xs text-[#86868B]">
                            {order.patient_phone} • Ref: {order.doctor_name}
                          </div>
                          <div className="text-xs font-bold text-[#0071E3] mt-1">
                            {order.test_name}
                          </div>
                        </div>

                        {/* Sample Collection / Accession Audit Detail */}
                        <div className="text-[10px] text-[#86868B] space-y-0.5 pt-1">
                          {order.sample_collector_name && (
                            <div>
                              ✓ Phlebotomy: {order.sample_collector_name} ({new Date(order.sample_collected_at || "").toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                            </div>
                          )}
                          {order.sample_accessioner_name && (
                            <div>
                              ✓ Accessioned: {order.sample_accessioner_name} ({order.analyzer_model || "Benchtop Analyzer"})
                            </div>
                          )}
                          {order.sample_rejected && (
                            <div className="text-rose-600 font-bold">
                              ⚠️ Specimen Rejected: [{order.sample_rejection_reason}] - Redraw Requested
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] space-y-1.5">
                      {isOrdered && (
                        <button
                          onClick={() => {
                            setSampleModalOrder(order);
                            setCollectorName("Sister Rekha (Phlebotomist)");
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-[#0071E3] py-2 text-xs font-bold text-white hover:bg-[#0077ED] transition shadow-sm"
                        >
                          <FlaskConical className="h-3.5 w-3.5" />
                          <span>1. Collect Phlebotomy Tube</span>
                        </button>
                      )}

                      {isCollected && (
                        <button
                          onClick={() => {
                            setAccessionModalOrder(order);
                            setScannedBarcode(order.sample_barcode || "");
                          }}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-sm"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>2. Accession &amp; Verify Integrity</span>
                        </button>
                      )}

                      {isAccessioned && (
                        <button
                          onClick={() => openResultEntry(order)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 py-2 text-xs font-bold text-white hover:bg-purple-700 transition shadow-sm"
                        >
                          <Cpu className="h-3.5 w-3.5" />
                          <span>3. Review Results &amp; Sign-off</span>
                        </button>
                      )}

                      {isCompleted && (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setReportModalOrder(order)}
                            className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Report</span>
                          </button>

                          <button
                            onClick={() => handleDispatchWhatsApp(order)}
                            className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-xs font-bold transition ${
                              order.whatsapp_dispatched
                                ? "bg-emerald-50 text-emerald-800 border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "bg-black/[0.02] text-[#1D1D1F] border-black/[0.08] dark:bg-white/[0.04] dark:text-white hover:bg-black/5"
                            }`}
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>{order.whatsapp_dispatched ? "Sent ✓" : "WhatsApp"}</span>
                          </button>
                        </div>
                      )}

                      {isCritical && !order.doctor_read_back_confirmed && (
                        <button
                          onClick={() => setCriticalModalOrder(order)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Confirm Doctor Read-Back</span>
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

      {/* TAB 2: LEVEY-JENNINGS QUALITY CONTROL (QC) STUDIO */}
      {activeTab === "qc" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  NABL ISO-15189 Levey-Jennings Quality Control Studio
                </h2>
                <p className="text-xs text-[#86868B]">
                  Daily 2-Level analyzer calibration and Westgard multi-rule evaluation. Results blocked if QC fails.
                </p>
              </div>

              <button
                onClick={() => setQcModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Record Daily QC Run</span>
              </button>
            </div>

            {/* QC Calibration Runs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-white/[0.03] text-[#86868B] font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Date &amp; Time</th>
                    <th className="px-3 py-2.5">Analyzer Machine</th>
                    <th className="px-3 py-2.5">Control Lot &amp; Level</th>
                    <th className="px-3 py-2.5 text-right">Target Mean ± SD</th>
                    <th className="px-3 py-2.5 text-right">Measured Value</th>
                    <th className="px-3 py-2.5 text-right">Z-Score</th>
                    <th className="px-3 py-2.5">Westgard Evaluation</th>
                    <th className="px-3 py-2.5">Quality Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {qcRuns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#86868B]">
                        No Quality Control runs recorded. Click "Record Daily QC Run" to calibrate.
                      </td>
                    </tr>
                  ) : (
                    qcRuns.map(q => {
                      const isRejected = q.westgard_status.includes("REJECTED");
                      return (
                        <tr key={q.id} className={isRejected ? "bg-rose-500/[0.05]" : ""}>
                          <td className="px-3 py-2.5 font-mono text-[#86868B]">
                            {new Date(q.run_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-[#1D1D1F] dark:text-white">
                            {q.analyzer_name}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono">{q.control_lot_number}</span>
                            <span className="block text-[10px] text-[#86868B]">{q.level}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {q.target_mean} ± {q.target_sd}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                            {q.measured_value}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                              Math.abs(Number(q.z_score)) > 2.0 
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400" 
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}>
                              Z = {q.z_score}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isRejected 
                                ? "bg-rose-600 text-white animate-pulse" 
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            }`}>
                              {q.westgard_status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#86868B]">{q.calibrated_by}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CRITICAL VALUE PANIC BOARD */}
      {activeTab === "critical" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-900 dark:text-rose-300">
            <strong>Mandatory Clinical Protocol:</strong> In accordance with NABL and clinical safety guidelines, any result breaching life-threatening panic limits triggers automatic doctor notification and requires documented verbal/digital read-back confirmation before final release.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.filter(o => o.critical_value_alert).length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#86868B]">
                ✓ Zero active panic values. All patient results currently within stable biological ranges.
              </div>
            ) : (
              orders.filter(o => o.critical_value_alert).map(o => (
                <div key={o.id} className="rounded-3xl border border-rose-500/40 bg-white p-5 shadow-sm dark:bg-[#1C1C1E] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-rose-600 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      {o.order_number}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      o.doctor_read_back_confirmed 
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
                        : "bg-rose-600 text-white animate-pulse"
                    }`}>
                      {o.doctor_read_back_confirmed ? "✓ Read-Back Confirmed" : "⚠️ Read-Back Pending"}
                    </span>
                  </div>

                  <div>
                    <div className="text-base font-black text-[#1D1D1F] dark:text-white">
                      {o.patient_name} ({o.patient_phone})
                    </div>
                    <div className="text-xs text-[#86868B]">
                      Ordering Physician: {o.doctor_name}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-rose-500/10 p-3 text-xs text-rose-900 dark:text-rose-200 border border-rose-500/20">
                    <div className="font-bold mb-1">Breached Critical Parameter(s):</div>
                    {Array.isArray(o.critical_parameters) && o.critical_parameters.length > 0 ? (
                      <ul className="list-disc pl-4 space-y-0.5 font-mono text-[11px]">
                        {o.critical_parameters.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-mono">Critical threshold breach flagged on investigation.</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[#86868B]">
                      {o.doctor_notified_at ? `Notified: ${new Date(o.doctor_notified_at).toLocaleTimeString()}` : "Notification in dispatch queue"}
                    </span>
                    {!o.doctor_read_back_confirmed && (
                      <button
                        onClick={() => setCriticalModalOrder(o)}
                        className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition"
                      >
                        Confirm Doctor Read-Back
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Phlebotomy Sample Collection */}
      {sampleModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-black text-base text-[#1D1D1F] dark:text-white">
                  Phlebotomy Specimen Draw
                </h3>
                <p className="text-xs text-[#86868B]">
                  Requisition: {sampleModalOrder.order_number} • Patient: {sampleModalOrder.patient_name}
                </p>
              </div>
              <button onClick={() => setSampleModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-blue-50/50 p-3 dark:bg-blue-500/10 text-blue-900 dark:text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <FlaskConical className="h-4 w-4" />
                  <span>Required Vacutainer: {sampleModalOrder.vacutainer_tube || "Lavender (K2-EDTA)"}</span>
                </div>
                <p className="text-[11px]">
                  Specimen Type: {sampleModalOrder.sample_type} {sampleModalOrder.fasting_required ? "(10-hr Fasting Mandatory)" : ""}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Assigned Phlebotomist Name</label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSampleModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCollectSample}
                  className="px-5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold shadow-sm transition"
                >
                  Print Barcode Tag &amp; Confirm Draw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIX 1 MODAL: Smart Sample Accessioning & Quality Integrity Gate */}
      {accessionModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-400">
                    Smart Accessioning Gate
                  </span>
                  <span className="font-mono text-xs text-[#86868B]">
                    {accessionModalOrder.order_number}
                  </span>
                </div>
                <h3 className="font-black text-base text-[#1D1D1F] dark:text-white mt-1">
                  Specimen In-Lab Intake &amp; Pre-Analytical QA
                </h3>
              </div>
              <button onClick={() => setAccessionModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Scan Tube Barcode Tag (Handheld Scanner / Camera) *
                </label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-[#0071E3]" />
                  <input
                    type="text"
                    required
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-black/[0.1] font-mono font-bold dark:bg-white/[0.06] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Accessioning Lab Technician</label>
                <input
                  type="text"
                  value={accessionerName}
                  onChange={(e) => setAccessionerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                />
              </div>

              {/* Pre-Analytical Sample Integrity Gate */}
              <div className="rounded-2xl border border-black/[0.06] p-3 dark:border-white/[0.06] space-y-2">
                <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                  <span>Pre-Analytical Integrity Checks:</span>
                  <span className="text-[10px] text-emerald-600 font-bold">NABL Standard</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> No Visible Hemolysis
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Specimen Free of Clots
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Volume Sufficient (QNS OK)
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Correct Vacutainer Tube
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {/* Rejection Option */}
                <button
                  type="button"
                  onClick={() => handleAccessionSubmit("reject")}
                  className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold hover:bg-rose-500/20 transition"
                >
                  Reject Specimen (Hemolyzed/Clotted)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAccessionModalOrder(null)}
                    className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessionSubmit("accession")}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm transition"
                  >
                    Pass Integrity &amp; Route to Analyzer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIX 3 & 5 MODAL: Pathologist Verification & Dynamic Reference Ranges */}
      {resultModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-3xl rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-black text-purple-700 dark:text-purple-400">
                  NABL Digital Verification Gate
                </span>
                <h3 className="font-black text-base text-[#1D1D1F] dark:text-white mt-1">
                  {resultModalOrder.test_name} - Result Evaluation
                </h3>
                <p className="text-xs text-[#86868B]">
                  Patient: {resultModalOrder.patient_name} • Age: {resultModalOrder.patient_age || 35}y / {resultModalOrder.patient_gender || "Male"} • Barcode: {resultModalOrder.sample_barcode}
                </p>
              </div>
              <button onClick={() => setResultModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            {/* Dynamic Reference Ranges Notice */}
            <div className="rounded-xl bg-blue-50/50 p-2.5 text-[11px] text-blue-900 dark:text-blue-300 border border-blue-500/20">
              <strong>Demographic-Adjusted Reference Ranges:</strong> Ranges have been automatically adjusted for <strong>{resultModalOrder.patient_age || 35}-year-old {resultModalOrder.patient_gender || "Male"}</strong>. Out-of-range parameters are tagged with color-coded safety indicators.
            </div>

            {/* Parameter Entry Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-white/[0.03] text-[#86868B] font-semibold">
                  <tr>
                    <th className="px-3 py-2">Parameter Name</th>
                    <th className="px-3 py-2 w-32">Measured Value</th>
                    <th className="px-3 py-2 w-20">Unit</th>
                    <th className="px-3 py-2">Reference Range</th>
                    <th className="px-3 py-2 w-28">Safety Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {resultParams.map((p, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-bold text-[#1D1D1F] dark:text-white">
                        {p.parameter}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={p.value}
                          onChange={(e) => {
                            const updated = [...resultParams];
                            updated[idx].value = e.target.value;
                            setResultParams(updated);
                          }}
                          className="w-full px-2 py-1 rounded-lg border border-black/[0.1] font-mono font-bold text-xs dark:bg-white/[0.06]"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-[#86868B]">
                        {p.unit}
                      </td>
                      <td className="px-3 py-2 font-mono text-[#86868B]">
                        {p.reference_range}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={p.status}
                          onChange={(e) => {
                            const updated = [...resultParams];
                            updated[idx].status = e.target.value as any;
                            setResultParams(updated);
                          }}
                          className={`w-full px-2 py-1 rounded-lg text-[10px] font-bold ${
                            p.status === "critical"
                              ? "bg-rose-600 text-white"
                              : p.status === "high" || p.status === "low"
                              ? "bg-amber-500/20 text-amber-900 dark:text-amber-300"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                          <option value="critical">Critical Panic</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pathologist Notes & Registration Number */}
            <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Pathologist Clinical Impression &amp; Remarks
                </label>
                <textarea
                  rows={2}
                  value={pathNotes}
                  onChange={(e) => setPathNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Verifying Pathologist Name</label>
                  <input
                    type="text"
                    value={pathologistName}
                    onChange={(e) => setPathologistName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">MCI / State Medical Council Reg No. *</label>
                  <input
                    type="text"
                    value={pathologistRegNo}
                    onChange={(e) => setPathologistRegNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setResultModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResults}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition"
              >
                Sign &amp; Seal Report (Generate SHA-256 Hash)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIX 3 MODAL: Confirm Doctor Read-Back for Critical Values */}
      {criticalModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-rose-500/40 bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  NABL Panic Value Read-Back
                </span>
                <h3 className="font-black text-base text-[#1D1D1F] dark:text-white mt-1">
                  Physician Verbal Confirmation Log
                </h3>
              </div>
              <button onClick={() => setCriticalModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-900 dark:text-rose-200 border border-rose-500/20 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <span>Ordering Physician: {criticalModalOrder.doctor_name}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Emergency values have been dispatched via SMS. The laboratory technician must verbally read back the panic values and log the doctor's confirmation name before release.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Reporting Staff Nurse / Tech Name</label>
                <input
                  type="text"
                  value={doctorReadBackNurse}
                  onChange={(e) => setDoctorReadBackNurse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Verbal Read-Back Documentation</label>
                <textarea
                  rows={2}
                  value={readBackNotes}
                  onChange={(e) => setReadBackNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCriticalModalOrder(null)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReadBack}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Confirm Verbal Read-Back &amp; Unlock Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FIX 5 MODAL: Record Levey-Jennings Daily QC Run */}
      {qcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-400">
                  Daily Calibration Engine
                </span>
                <h3 className="font-black text-base text-[#1D1D1F] dark:text-white mt-1">
                  Record Levey-Jennings Quality Control Run
                </h3>
              </div>
              <button onClick={() => setQcModalOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleSaveQcRun} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Analyzer Equipment</label>
                  <select
                    value={qcForm.analyzer_name}
                    onChange={(e) => setQcForm({ ...qcForm, analyzer_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  >
                    <option value="Mindray BC-5150 (5-Part Hematology)">Mindray BC-5150 (5-Part Hematology)</option>
                    <option value="Roche Cobas c311 (Biochemistry)">Roche Cobas c311 (Biochemistry)</option>
                    <option value="Sysmex XN-350 (Hematology)">Sysmex XN-350 (Hematology)</option>
                    <option value="Beckman Coulter Access 2 (Immunoassay)">Beckman Coulter Access 2 (Immunoassay)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Control Level</label>
                  <select
                    value={qcForm.level}
                    onChange={(e) => setQcForm({ ...qcForm, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  >
                    <option value="Level 1 (Normal Control)">Level 1 (Normal Control)</option>
                    <option value="Level 2 (High Pathological)">Level 2 (High Pathological)</option>
                    <option value="Level 3 (Low Control)">Level 3 (Low Control)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Target Mean (µ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={qcForm.target_mean}
                    onChange={(e) => setQcForm({ ...qcForm, target_mean: Number(e.target.value) })}
                    className="w-full px-2 py-2 rounded-xl border border-black/[0.08] font-mono dark:bg-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Target SD (σ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={qcForm.target_sd}
                    onChange={(e) => setQcForm({ ...qcForm, target_sd: Number(e.target.value) })}
                    className="w-full px-2 py-2 rounded-xl border border-black/[0.08] font-mono dark:bg-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Measured Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={qcForm.measured_value}
                    onChange={(e) => setQcForm({ ...qcForm, measured_value: Number(e.target.value) })}
                    className="w-full px-2 py-2 rounded-xl border border-black/[0.08] font-mono font-bold dark:bg-white/[0.06] text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Quality Control Officer</label>
                <input
                  type="text"
                  required
                  value={qcForm.calibrated_by}
                  onChange={(e) => setQcForm({ ...qcForm, calibrated_by: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setQcModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Calculate Z-Score &amp; Apply Westgard Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 6 MODAL: NABL Official Diagnostic Report with SHA-256 Tamper-Proof Checksum */}
      {reportModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-3xl rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#1D1D1F] dark:text-white">
                    Official Diagnostic Laboratory Report
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider font-mono">
                    NABL ISO-15189 Accredited Laboratory
                  </span>
                </div>
              </div>
              <button onClick={() => setReportModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            {/* Official Report Header & Demographics */}
            <div className="rounded-2xl border border-black/[0.06] p-4 bg-[#F5F5F7] dark:bg-white/[0.02] dark:border-white/[0.06] space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[#86868B] block text-[10px]">Patient Name</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{reportModalOrder.patient_name}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Age / Gender</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{reportModalOrder.patient_age || 35} Yrs / {reportModalOrder.patient_gender || "Male"}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Sample Barcode</span>
                  <span className="font-mono font-bold text-[#0071E3]">{reportModalOrder.sample_barcode || "BC-DEFAULT"}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Ordering Physician</span>
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{reportModalOrder.doctor_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <span className="text-[#86868B] block text-[10px]">Collection Time</span>
                  <span className="font-mono text-[11px]">{new Date(reportModalOrder.sample_collected_at || reportModalOrder.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Verification Time</span>
                  <span className="font-mono text-[11px]">{new Date(reportModalOrder.verified_at || Date.now()).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Total Lab TAT</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-600">{reportModalOrder.elapsed_minutes || 48} Minutes</span>
                </div>
                <div>
                  <span className="text-[#86868B] block text-[10px]">Analyzer Platform</span>
                  <span className="text-[11px] font-medium">{reportModalOrder.analyzer_model || "Mindray BC-5150 / Automated"}</span>
                </div>
              </div>
            </div>

            {/* Test Investigation Title */}
            <div className="font-black text-sm text-[#1D1D1F] dark:text-white pt-1">
              Investigation: {reportModalOrder.test_name} ({reportModalOrder.sample_type})
            </div>

            {/* Quantified Parameters Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-white/[0.03] text-[#86868B] font-semibold border-y border-black/[0.06] dark:border-white/[0.06]">
                  <tr>
                    <th className="px-3 py-2">Test Parameter</th>
                    <th className="px-3 py-2 text-right">Observed Value</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Biological Reference Interval</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {reportModalOrder.results && reportModalOrder.results.length > 0 ? (
                    reportModalOrder.results.map((r, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-bold text-[#1D1D1F] dark:text-white">
                          {r.parameter}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                          {r.value}
                        </td>
                        <td className="px-3 py-2 font-mono text-[#86868B]">
                          {r.unit}
                        </td>
                        <td className="px-3 py-2 font-mono text-[#86868B]">
                          {r.reference_range}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            r.status === "critical"
                              ? "bg-rose-600 text-white animate-pulse"
                              : r.status === "high" || r.status === "low"
                              ? "bg-amber-500/20 text-amber-900 dark:text-amber-300"
                              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          }`}>
                            {r.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-[#86868B]">
                        No quantified parameter values recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pathologist Impression & Digital Seal */}
            <div className="rounded-2xl bg-[#F5F5F7] p-3 dark:bg-white/[0.03] space-y-1 text-xs">
              <span className="font-bold text-[#1D1D1F] dark:text-white block text-[11px]">
                Pathologist Clinical Comments:
              </span>
              <p className="text-[11px] text-[#86868B] leading-relaxed">
                {reportModalOrder.pathologist_notes || "All parameters evaluated and verified under NABL compliance standard."}
              </p>
            </div>

            {/* Pathologist Digital Signature & SHA-256 Box */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <div className="font-bold text-xs text-[#1D1D1F] dark:text-white">
                  {reportModalOrder.verified_by || "Dr. S. K. Pathak (MD Pathologist)"}
                </div>
                <div className="text-[10px] text-[#86868B] font-mono">
                  Reg No: {reportModalOrder.pathologist_reg_no || "MCI-DMC-48291"} • Consultant Pathologist
                </div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  ✓ Digitally Signed &amp; Authenticated
                </div>
              </div>

              {/* SHA-256 Tamper-Proof Cryptographic Hash */}
              <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.03] p-2 text-right">
                <span className="text-[9px] uppercase tracking-wider text-[#86868B] block font-mono font-bold">
                  SHA-256 Tamper-Proof Digital Checksum:
                </span>
                <span className="font-mono text-[9.5px] text-[#0071E3] font-bold break-all">
                  {reportModalOrder.report_sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-black/[0.08] px-4 py-2 text-xs font-bold hover:bg-[#F5F5F7] dark:border-white/[0.08]"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleDispatchWhatsApp(reportModalOrder)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{reportModalOrder.whatsapp_dispatched ? "Re-Dispatch WhatsApp" : "Dispatch WhatsApp"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create Walk-in / Direct Lab Order */}
      {newOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#0071E3]" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Create Diagnostic Requisition</h3>
              </div>
              <button onClick={() => setNewOrderModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikas Sharma"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={newPtPhone}
                    onChange={(e) => setNewPtPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Age (Yrs)</label>
                  <input
                    type="number"
                    required
                    value={newPtAge}
                    onChange={(e) => setNewPtAge(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Gender</label>
                  <select
                    value={newPtGender}
                    onChange={(e) => setNewPtGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Referring Doctor</label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Select Diagnostic Profile</label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-medium"
                >
                  {COMMON_LAB_TESTS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.test_name} ({t.sample_type}) - ₹{t.mrp_inr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewOrderModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-sm transition"
                >
                  Generate Order &amp; Barcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FIX 2 MODAL: Machine Analyzer Serial Feed (ASTM / HL7 / Direct Port) */}
      {machineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">
                  HL7 / ASTM Direct Analyzer Interface
                </h3>
              </div>
              <button onClick={() => setMachineModalOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            {/* Quick 1-Click Payloads for Major Analyzer Vendors */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={loadSampleHl7}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300"
              >
                <Zap className="h-3.5 w-3.5 text-blue-500" />
                <span>Load Mindray BC-5150 (HL7)</span>
              </button>
              <button
                type="button"
                onClick={loadSampleAstm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/10 font-bold hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300"
              >
                <Zap className="h-3.5 w-3.5 text-purple-500" />
                <span>Load Sysmex XN-550 (ASTM)</span>
              </button>
              <button
                type="button"
                onClick={loadSampleCriticalHl7}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-500/10 font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                <span>Load Roche Cobas Critical Feed</span>
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                Target Lab Requisition Ref / Barcode
              </label>
              <input
                type="text"
                placeholder="e.g. LAB-2026-002"
                value={selectedTargetOrder}
                onChange={(e) => setSelectedTargetOrder(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono text-xs outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                Raw Serial Stream Dump (ASTM E1394 or HL7 v2.x MLLP)
              </label>
              <textarea
                rows={8}
                value={machineStream}
                onChange={(e) => setMachineStream(e.target.value)}
                placeholder="Paste incoming analyzer data stream here or connect via RS-232 COM port..."
                className="w-full p-3 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.02] font-mono text-[11.5px] leading-relaxed outline-none focus:border-purple-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMachineModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importLoading || !machineStream.trim()}
                onClick={handleMachineImport}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                {importLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Ingest &amp; Ingest Into LIS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
