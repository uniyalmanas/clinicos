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
  Cable
} from "lucide-react";
import { COMMON_LAB_TESTS } from "@/data/medicines";

interface ParameterResult {
  parameter: string;
  value: number | string;
  unit: string;
  reference_range: string;
  status: "normal" | "high" | "low" | "critical";
}

interface DiagnosticOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  test_name: string;
  category: string;
  sample_type: string;
  fasting_required: boolean;
  status: "ordered" | "sample_collected" | "completed";
  sample_collected_at: string | null;
  sample_collector_name: string | null;
  results: ParameterResult[];
  pathologist_notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

export default function LabDashboardPage() {
  const [orders, setOrders] = useState<DiagnosticOrder[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, ordered: 0, in_progress: 0, completed: 0 });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [sampleModalOrder, setSampleModalOrder] = useState<DiagnosticOrder | null>(null);
  const [collectorName, setCollectorName] = useState("Sister Rekha (Phlebotomist)");
  const [resultModalOrder, setResultModalOrder] = useState<DiagnosticOrder | null>(null);
  const [reportModalOrder, setReportModalOrder] = useState<DiagnosticOrder | null>(null);
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [machineStream, setMachineStream] = useState("");
  const [selectedTargetOrder, setSelectedTargetOrder] = useState("");
  const [serialStatus, setSerialStatus] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // New Order Form state
  const [newPtName, setNewPtName] = useState("");
  const [newPtPhone, setNewPtPhone] = useState("");
  const [newDocName, setNewDocName] = useState("Dr. Rahul Sharma");
  const [selectedTestId, setSelectedTestId] = useState(COMMON_LAB_TESTS[0].id);

  // Result entry form state
  const [resultParams, setResultParams] = useState<ParameterResult[]>([]);
  const [pathNotes, setPathNotes] = useState("All parameters evaluated and verified.");
  const [pathologistName, setPathologistName] = useState("Dr. S. K. Pathak (MD Pathologist)");

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

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  // Phlebotomy Sample Collection
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
        setSampleModalOrder(null);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Result Entry modal with prefilled standard template parameters
  const openResultEntry = (order: DiagnosticOrder) => {
    setResultModalOrder(order);
    if (order.results && order.results.length > 0) {
      setResultParams(order.results);
      setPathNotes(order.pathologist_notes || "All parameters evaluated and verified.");
      return;
    }

    // Generate intelligent default template parameters based on test name
    const lower = order.test_name.toLowerCase();
    let template: ParameterResult[] = [];

    if (lower.includes("cbc") || lower.includes("blood count")) {
      template = [
        { parameter: "Hemoglobin", value: "13.8", unit: "g/dL", reference_range: "13.0 - 17.0", status: "normal" },
        { parameter: "Total Leukocyte Count (TLC)", value: "7200", unit: "/cumm", reference_range: "4000 - 11000", status: "normal" },
        { parameter: "Platelet Count", value: "250000", unit: "/cumm", reference_range: "150000 - 450000", status: "normal" },
        { parameter: "Neutrophils", value: "62", unit: "%", reference_range: "40 - 75", status: "normal" },
        { parameter: "Lymphocytes", value: "30", unit: "%", reference_range: "20 - 45", status: "normal" },
        { parameter: "ESR (Westergren)", value: "10", unit: "mm/1st hr", reference_range: "0 - 15", status: "normal" }
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
      template = [
        { parameter: "Blood Urea", value: "24", unit: "mg/dL", reference_range: "15 - 45", status: "normal" },
        { parameter: "Serum Creatinine", value: "0.9", unit: "mg/dL", reference_range: "0.7 - 1.3", status: "normal" },
        { parameter: "Uric Acid", value: "5.2", unit: "mg/dL", reference_range: "3.5 - 7.2", status: "normal" }
      ];
    } else if (lower.includes("sugar") || lower.includes("fbs")) {
      template = [
        { parameter: "Fasting Blood Sugar (FBS)", value: "95", unit: "mg/dL", reference_range: "70 - 100", status: "normal" }
      ];
    } else if (lower.includes("hba1c")) {
      template = [
        { parameter: "HbA1c (Glycosylated Hemoglobin)", value: "5.6", unit: "%", reference_range: "< 5.7 (Normal)", status: "normal" },
        { parameter: "Estimated Average Glucose (eAG)", value: "114", unit: "mg/dL", reference_range: "90 - 120", status: "normal" }
      ];
    } else {
      template = [
        { parameter: "Primary Investigation Finding", value: "Normal / Negative", unit: "Result", reference_range: "Negative / Normal", status: "normal" }
      ];
    }

    setResultParams(template);
    setPathNotes("Sample analyzed using automated benchtop analyzer and verified under microscopic review.");
  };

  // Save Results & Finalize Report
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
          verified_by: pathologistName
        })
      });
      if (res.ok) {
        setResultModalOrder(null);
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
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
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

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
    setMachineStream(`MSH|^~\\&|MINDRAY^BC-5000|LAB|CLINICOS|HOSPITAL|20260923143000||ORU^R01|MSG0001|P|2.3.1
PID|1||+919123456782||Rohit Pant||19940710|M
OBR|1|LAB-2026-003||CBC^Complete Blood Count
OBX|1|NM|WBC^Total Leukocyte Count||8.1|/cumm|4000-11000|N|||F
OBX|2|NM|HGB^Hemoglobin||15.1|g/dL|13.0-17.0|N|||F
OBX|3|NM|PLT^Platelet Count||210000|/cumm|150000-450000|N|||F
OBX|4|NM|ESR^ESR Westergren||8|mm/1st hr|0-15|N|||F`);
  };

  const handleConnectWebSerial = async () => {
    try {
      if (typeof window === "undefined" || !("serial" in navigator)) {
        alert("Web Serial API is not supported in this browser environment. Please use Google Chrome/Microsoft Edge or paste raw ASTM/HL7 stream.");
        return;
      }
      setSerialStatus("Requesting COM port access...");
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialStatus("Connected! Listening to RS-232 analyzer port...");

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      let accumulated = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          accumulated += value;
          setMachineStream(accumulated);
        }
      }
    } catch (e: any) {
      setSerialStatus(`Serial error: ${e.message}`);
    }
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
        setMachineModalOpen(false);
        setMachineStream("");
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
    o.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.patient_phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue rounded-2xl">
              <Microscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                Diagnostic Pathology & LIS Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                  Marley LIS
                </span>
              </h1>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                Phlebotomy sample accessioning, quantitative reference ranges & pathologist verified reporting
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-black/5"
            title="Refresh Orders"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setMachineModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium text-xs hover:bg-purple-500/20 transition"
          >
            <Cpu className="h-4 w-4" />
            <span>Machine Import (ASTM/HL7)</span>
          </button>
          <button
            onClick={() => setNewOrderModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-apple-blue text-white font-medium text-xs shadow-apple-card hover:bg-blue-600 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Lab Order</span>
          </button>
        </div>
      </div>

      {/* 4 Apple-Health Style Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Diagnostic Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-apple-blue">
              <FlaskConical className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.total}
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Cumulative requisition queue</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Awaiting Phlebotomy</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.ordered}
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">Pending sample collection</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Analytical Testing</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Microscope className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.in_progress}
          </div>
          <div className="mt-2 text-xs text-purple-600 font-medium">Specimen processing on bench</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verified Reports</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.completed}
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">Pathologist signed & ready</div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl">
          {[
            { id: "all", label: "All Orders" },
            { id: "ordered", label: "Awaiting Sample" },
            { id: "sample_collected", label: "In Testing" },
            { id: "completed", label: "Verified Reports" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#86868B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, order #, or test..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-apple-blue"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-[22px] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[#86868B] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Test Profile</th>
                <th className="py-3.5 px-4">Sample Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86868B]">
                    Loading diagnostic records from Supabase...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86868B]">
                    No diagnostic lab orders found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-apple-blue dark:text-sky-400">
                      {order.order_number}
                      <div className="text-[10px] text-[#86868B] font-normal font-sans">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#86868B]" />
                        {order.patient_name}
                      </div>
                      <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                        {order.patient_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1D1D1F] dark:text-white">
                        {order.test_name}
                      </div>
                      <div className="text-[11px] text-[#86868B] flex items-center gap-2 mt-0.5">
                        <span>{order.category}</span>
                        {order.fasting_required && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-semibold">
                            Fasting Req.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#515154] dark:text-[#A1A1A6]">
                      <div>{order.sample_type}</div>
                      {order.sample_collected_at && (
                        <div className="text-[10.5px] text-[#86868B] mt-0.5">
                          Coll by: {order.sample_collector_name}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.status === "ordered" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Awaiting Sample
                        </span>
                      )}
                      {order.status === "sample_collected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          <FlaskConical className="h-3 w-3" /> Testing In Progress
                        </span>
                      )}
                      {order.status === "completed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Verified Report
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {order.status === "ordered" && (
                        <button
                          onClick={() => setSampleModalOrder(order)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-medium text-xs hover:bg-amber-600 transition shadow-sm"
                        >
                          Collect Sample
                        </button>
                      )}
                      {order.status === "sample_collected" && (
                        <button
                          onClick={() => openResultEntry(order)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-medium text-xs hover:bg-purple-700 transition shadow-sm"
                        >
                          Enter Results
                        </button>
                      )}
                      {order.status === "completed" && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openResultEntry(order)}
                            className="px-2.5 py-1 rounded-lg border border-black/[0.08] dark:border-white/[0.1] text-xs hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setReportModalOrder(order)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition shadow-sm"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Report</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Phlebotomy Sample Collection */}
      {sampleModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Specimen Sample Collection</h3>
              </div>
              <button onClick={() => setSampleModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                <div className="font-semibold">{sampleModalOrder.test_name}</div>
                <div className="text-[11px] mt-0.5">Required Specimen: <strong>{sampleModalOrder.sample_type}</strong></div>
                {sampleModalOrder.fasting_required && (
                  <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Confirm 10-12 hr fasting status with patient.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Name & Ref</label>
                <input
                  type="text"
                  disabled
                  value={`${sampleModalOrder.patient_name} (${sampleModalOrder.order_number})`}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Collecting Phlebotomist / Staff</label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={(e) => setCollectorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs outline-none focus:border-apple-blue"
                />
              </div>

              <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1D1D1F] dark:text-white">Sample Barcode ID</div>
                  <div className="text-[10px] text-[#86868B] font-mono">SPEC-{sampleModalOrder.order_number.replace("LAB-", "")}-V1</div>
                </div>
                <QrCode className="h-7 w-7 text-[#1D1D1F] dark:text-white" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setSampleModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCollectSample}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition"
              >
                Confirm Sample Collected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Enter Quantitative Results & Pathologist Sign-Off */}
      {resultModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-purple-600" />
                  Pathology Results Entry & Verification
                </h3>
                <div className="text-xs text-[#86868B] mt-0.5">
                  {resultModalOrder.test_name} • {resultModalOrder.patient_name} ({resultModalOrder.order_number})
                </div>
              </div>
              <button onClick={() => setResultModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#86868B] font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5 w-28">Measured Value</th>
                      <th className="p-2.5 w-20">Unit</th>
                      <th className="p-2.5">Reference Interval</th>
                      <th className="p-2.5 w-24">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {resultParams.map((param, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-[#1D1D1F] dark:text-white">
                          {param.parameter}
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => {
                              const updated = [...resultParams];
                              updated[idx].value = e.target.value;
                              setResultParams(updated);
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-black/[0.1] dark:border-white/[0.15] bg-white dark:bg-[#2C2C2E] font-mono text-xs font-bold outline-none focus:border-purple-500"
                          />
                        </td>
                        <td className="p-2.5 text-[#86868B]">{param.unit}</td>
                        <td className="p-2.5 text-[#86868B] font-mono text-[11px]">{param.reference_range}</td>
                        <td className="p-2.5">
                          <select
                            value={param.status}
                            onChange={(e) => {
                              const updated = [...resultParams];
                              updated[idx].status = e.target.value as any;
                              setResultParams(updated);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border outline-none ${
                              param.status === "normal"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : param.status === "high"
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : param.status === "low"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            <option value="normal">Normal</option>
                            <option value="high">High (▲)</option>
                            <option value="low">Low (▼)</option>
                            <option value="critical">Critical (!)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Pathologist Interpretive Notes</label>
                <textarea
                  rows={2}
                  value={pathNotes}
                  onChange={(e) => setPathNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Verifying Pathologist Name</label>
                <input
                  type="text"
                  value={pathologistName}
                  onChange={(e) => setPathologistName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setResultModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResults}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Verify & Sign Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Diagnostic Lab Report */}
      {reportModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-[28px] border border-black/[0.08] bg-white p-8 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08] print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-apple-blue">
                Verified Clinical Laboratory Report
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.05] text-xs font-medium hover:bg-black/10"
                >
                  <Printer className="h-4 w-4" /> Print Report
                </button>
                <button onClick={() => setReportModalOrder(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </div>
            </div>

            {/* Diagnostic Report Content */}
            <div className="mt-6 space-y-6">
              {/* Lab Header */}
              <div className="flex justify-between items-start border-b-2 border-[#1D1D1F] dark:border-white pb-4">
                <div>
                  <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white">CLINICOS DIAGNOSTICS & PATHOLOGY</h2>
                  <p className="text-xs text-[#86868B]">NABL Accredited Standard Partner Laboratory • Dehradun, UK</p>
                  <p className="text-[11px] text-[#86868B] mt-0.5">Phone: +91 98765 43210 • Email: lab@clinicos.health</p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-apple-blue">{reportModalOrder.order_number}</div>
                  <div className="text-[11px] text-[#86868B]">
                    Date: {new Date(reportModalOrder.verified_at || reportModalOrder.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-xs">
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Patient Name</div>
                  <div className="font-bold text-[#1D1D1F] dark:text-white mt-0.5">{reportModalOrder.patient_name}</div>
                </div>
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Contact</div>
                  <div className="font-mono text-[#1D1D1F] dark:text-white mt-0.5">{reportModalOrder.patient_phone}</div>
                </div>
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Ref. Doctor</div>
                  <div className="font-semibold text-[#1D1D1F] dark:text-white mt-0.5">{reportModalOrder.doctor_name}</div>
                </div>
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Sample Specimen</div>
                  <div className="text-[#1D1D1F] dark:text-white mt-0.5">{reportModalOrder.sample_type}</div>
                </div>
              </div>

              {/* Investigation Title */}
              <div className="text-center py-2 bg-apple-blue/5 dark:bg-apple-blue/10 border-y border-apple-blue/15 text-apple-blue font-bold text-sm uppercase tracking-wide">
                Department of {reportModalOrder.category} • {reportModalOrder.test_name}
              </div>

              {/* Results Table */}
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.1] dark:border-white/[0.1] text-[#86868B] font-bold uppercase text-[10.5px]">
                    <th className="py-2">Test Parameter</th>
                    <th className="py-2 text-right">Result Value</th>
                    <th className="py-2 px-3">Unit</th>
                    <th className="py-2">Biological Reference Interval</th>
                    <th className="py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {reportModalOrder.results.map((r, i) => (
                    <tr key={i} className="py-2">
                      <td className="py-2 font-medium text-[#1D1D1F] dark:text-white">{r.parameter}</td>
                      <td className="py-2 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">{r.value}</td>
                      <td className="py-2 px-3 text-[#86868B]">{r.unit}</td>
                      <td className="py-2 font-mono text-[11px] text-[#515154] dark:text-[#A1A1A6]">{r.reference_range}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === "normal"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pathologist Notes & Signatures */}
              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
                <div className="text-[11px] text-[#86868B]">Pathologist Comments:</div>
                <div className="mt-1 font-medium text-[#1D1D1F] dark:text-white italic">
                  &ldquo;{reportModalOrder.pathologist_notes}&rdquo;
                </div>
              </div>

              {/* Digital Signature Block */}
              <div className="pt-6 flex justify-between items-end border-t-2 border-[#1D1D1F] dark:border-white">
                <div className="text-[10px] text-[#86868B] space-y-0.5">
                  <div>* Tests conducted using automated calibration standards.</div>
                  <div>* Please correlate clinically with patient symptoms.</div>
                  <div className="font-mono text-apple-teal mt-1">Digital SHA-256 Verified Pathology Seal</div>
                </div>

                <div className="text-right">
                  <div className="font-serif italic font-bold text-base text-[#1D1D1F] dark:text-white">
                    {reportModalOrder.verified_by || "Dr. S. K. Pathak, MD"}
                  </div>
                  <div className="text-[10px] text-[#86868B] uppercase tracking-wider font-semibold">
                    Consultant Pathologist & Lab Director
                  </div>
                </div>
              </div>
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
                <Plus className="h-5 w-5 text-apple-blue" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Create Diagnostic Lab Order</h3>
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
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-apple-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Mobile Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={newPtPhone}
                  onChange={(e) => setNewPtPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-apple-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Referring Doctor</label>
                <input
                  type="text"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-apple-blue"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Select Diagnostic Profile</label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-apple-blue"
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
                  className="px-5 py-2 rounded-xl bg-apple-blue text-white text-xs font-semibold shadow-sm hover:bg-blue-600 transition"
                >
                  Generate Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Machine Serial Analyzer Import (ASTM / HL7 / RS-232) */}
      {machineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">
                  Analyzer Machine Serial Import (ASTM / HL7)
                </h3>
              </div>
              <button onClick={() => setMachineModalOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={handleConnectWebSerial}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition"
              >
                <Cable className="h-4 w-4" />
                <span>Connect Live COM Port (Web Serial)</span>
              </button>
              <button
                type="button"
                onClick={loadSampleAstm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] font-medium hover:bg-black/5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Load Sample ASTM (Sysmex)</span>
              </button>
              <button
                type="button"
                onClick={loadSampleHl7}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] font-medium hover:bg-black/5"
              >
                <Zap className="h-3.5 w-3.5 text-blue-500" />
                <span>Load Sample HL7 (Mindray)</span>
              </button>
            </div>

            {serialStatus && (
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-300 text-xs font-mono">
                {serialStatus}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                Target Lab Requisition Ref (Optional - extracted from stream if present)
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
                <span>Parse & Ingest Into LIS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
