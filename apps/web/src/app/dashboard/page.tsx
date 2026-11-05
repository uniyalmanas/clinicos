"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Volume2,
  Plus,
  Check,
  Printer,
  Pause,
  Play,
  History,
  AlertCircle,
  CheckCircle2,
  Search,
  Download,
  IndianRupee,
  ShieldCheck,
  Send,
  Lock,
  X,
  FileText,
  AlertTriangle,
  UserX,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  Tv,
} from "lucide-react";

// Web Audio API dual-tone chime generator for acoustic counter alert
function playTokenCallChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.16);
    gain2.gain.setValueAtTime(0.28, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.16);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.error("Audio chime error:", err);
  }
}

// Preset Indian generic molecules for 1-tap Speed Rx
const COMMON_SPEED_RX_MOLECULES = [
  { brand: "Dolo 650", generic: "PARACETAMOL 650MG", form: "Tab", defaultDose: "1-0-1", defaultDays: "3 Days" },
  { brand: "Cetcip 10", generic: "CETIRIZINE 10MG", form: "Tab", defaultDose: "0-0-1", defaultDays: "5 Days" },
  { brand: "Augmentin 625", generic: "AMOXICILLIN 500MG + CLAVULANIC ACID 125MG", form: "Tab", defaultDose: "1-0-1", defaultDays: "5 Days" },
  { brand: "Pan 40", generic: "PANTOPRAZOLE 40MG", form: "Tab", defaultDose: "1-0-0 (Empty Stomach)", defaultDays: "7 Days" },
  { brand: "Azithral 500", generic: "AZITHROMYCIN 500MG", form: "Tab", defaultDose: "1-0-0", defaultDays: "3 Days" },
  { brand: "Allegra 120", generic: "FEXOFENADINE 120MG", form: "Tab", defaultDose: "1-0-0", defaultDays: "7 Days" },
  { brand: "Itracol 200", generic: "ITRACONAZOLE 200MG", form: "Cap", defaultDose: "1-0-1", defaultDays: "14 Days" },
];

export default function DashboardOverviewPage() {
  // Practice Plan state (Solo 1-Dr vs Clinic Multi-Dr)
  const [practiceType, setPracticeType] = useState<"solo" | "clinic">("solo");
  const [opdPaused, setOpdPaused] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "waiting" | "completed">("all");

  // In-Room Active Patient
  const [currentPatient, setCurrentPatient] = useState({
    token: 12,
    patientName: "Priya Singh",
    ageGender: "24F",
    phone: "+919876543211",
    complaint: "Acne Vulgaris & Hyperpigmentation",
    visitNumber: 3,
    lastRx: "Itraconazole 200mg (1-0-1) - Well Tolerated",
    failedRx: "Fluconazole 150mg (Reported Gastric Distress)",
    fee: 600,
    paymentMode: "UPI",
    paymentStatus: "paid",
    inRoomMins: 6,
  });

  // Live Queue & Day Register Table (Excel Sheet Replacement Data)
  const [dayRegister, setDayRegister] = useState([
    { token: 11, time: "10:15 AM", patientName: "Amit Rawat", ageGender: "38M", phone: "+919123456780", complaint: "Follow-up BP Check", fee: 500, paymentMode: "UPI", paymentStatus: "paid", status: "completed" },
    { token: 12, time: "10:30 AM", patientName: "Priya Singh", ageGender: "24F", phone: "+919876543211", complaint: "Acne Vulgaris Follow-up", fee: 600, paymentMode: "UPI", paymentStatus: "paid", status: "in_consultation" },
    { token: 13, time: "10:45 AM", patientName: "Rohit Verma", ageGender: "41M", phone: "+919876543212", complaint: "Skin Rash & Itching", fee: 600, paymentMode: "UPI", paymentStatus: "paid", status: "waiting", waitMins: 14, isStuck: false },
    { token: 14, time: "11:00 AM", patientName: "Anjali Kapoor", ageGender: "29F", phone: "+919876543213", complaint: "Facial Pigmentation", fee: 1200, paymentMode: "Cash", paymentStatus: "pending", status: "waiting", waitMins: 22, isStuck: false },
    { token: 15, time: "11:15 AM", patientName: "Vikram Pant", ageGender: "52M", phone: "+919876543214", complaint: "Chronic Eczema Flare", fee: 600, paymentMode: "Cash", paymentStatus: "pending", status: "waiting", waitMins: 38, isStuck: true },
    { token: 16, time: "11:30 AM", patientName: "Sunita Devi", ageGender: "61F", phone: "+919876543215", complaint: "Joint Pain & Psoriasis", fee: 600, paymentMode: "UPI", paymentStatus: "paid", status: "waiting", waitMins: 8, isStuck: false },
  ]);

  // Speed Rx Pad Active Prescriptions for Current In-Room Patient
  const [activeSpeedRx, setActiveSpeedRx] = useState<Array<{ generic: string; form: string; dose: string; days: string }>>([
    { generic: "ITRACONAZOLE 200MG", form: "Cap", dose: "1-0-1", days: "14 Days" },
    { generic: "CETIRIZINE 10MG", form: "Tab", dose: "0-0-1", days: "5 Days" },
  ]);

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [showCashDrawerModal, setShowCashDrawerModal] = useState(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [showStuckModal, setShowStuckModal] = useState(false);

  // Walk-in form state
  const [newWalkin, setNewWalkin] = useState({
    name: "",
    age: "",
    gender: "F",
    phone: "",
    complaint: "General Consultation",
    fee: 600,
    paymentMode: "UPI",
  });

  // Physical Cash Denomination Calculator
  const [denominations, setDenominations] = useState({
    d500: 3, // 1500
    d200: 1, // 200
    d100: 1, // 100
    d50: 0,
    d20: 0,
    d10: 0,
  });

  // Read stored user
  useEffect(() => {
    try {
      const u = localStorage.getItem("clinicos_user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.practice_type === "clinic" || parsed.practice_type === "solo") {
          setPracticeType(parsed.practice_type);
        }
      }
    } catch {}
  }, []);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  // Financial aggregates calculated directly from the live register
  const { totalRevenue, upiTotal, cashTotal, pendingTotal } = useMemo(() => {
    let total = 0;
    let upi = 0;
    let cash = 0;
    let pending = 0;

    dayRegister.forEach((item) => {
      if (item.paymentStatus === "paid") {
        total += item.fee;
        if (item.paymentMode === "UPI") upi += item.fee;
        else cash += item.fee;
      } else {
        pending += item.fee;
      }
    });

    return { totalRevenue: total, upiTotal: upi, cashTotal: cash, pendingTotal: pending };
  }, [dayRegister]);

  // Physical cash counted in drawer
  const countedCash = useMemo(() => {
    return (
      denominations.d500 * 500 +
      denominations.d200 * 200 +
      denominations.d100 * 100 +
      denominations.d50 * 50 +
      denominations.d20 * 20 +
      denominations.d10 * 10
    );
  }, [denominations]);

  // Filtered queue items
  const waitingPatients = useMemo(() => {
    return dayRegister.filter((p) => p.status === "waiting");
  }, [dayRegister]);

  // Filtered register rows for the Excel View
  const filteredRegister = useMemo(() => {
    return dayRegister.filter((p) => {
      const matchesSearch =
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.token).includes(searchQuery) ||
        p.complaint.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "waiting") return matchesSearch && p.status === "waiting";
      if (activeTab === "completed") return matchesSearch && p.status === "completed";
      return matchesSearch;
    });
  }, [dayRegister, searchQuery, activeTab]);

  // Call Next Token Action
  const handleCallNext = () => {
    if (waitingPatients.length === 0) {
      showToast("All waiting patients have been consulted!");
      return;
    }

    playTokenCallChime();
    const nextPt = waitingPatients[0];

    // Mark current patient as completed
    setDayRegister((prev) =>
      prev.map((p) => {
        if (p.token === currentPatient.token) {
          return { ...p, status: "completed" };
        }
        if (p.token === nextPt.token) {
          return { ...p, status: "in_consultation" };
        }
        return p;
      })
    );

    setCurrentPatient({
      token: nextPt.token,
      patientName: nextPt.patientName,
      ageGender: nextPt.ageGender,
      phone: nextPt.phone,
      complaint: nextPt.complaint,
      visitNumber: 1,
      lastRx: "First consultation (No prior adverse history)",
      failedRx: "None recorded",
      fee: nextPt.fee,
      paymentMode: nextPt.paymentMode,
      paymentStatus: nextPt.paymentStatus,
      inRoomMins: 1,
    });

    // Reset Speed Rx pad with starter combo
    setActiveSpeedRx([
      { generic: "PARACETAMOL 650MG", form: "Tab", dose: "1-0-1", days: "3 Days" },
    ]);

    showToast(`Token #${nextPt.token} (${nextPt.patientName}) called into Chamber`);
  };

  // Add 1-tap Molecule to Rx pad
  const handleAddMolecule = (mol: (typeof COMMON_SPEED_RX_MOLECULES)[0]) => {
    if (activeSpeedRx.some((m) => m.generic === mol.generic)) {
      showToast(`${mol.generic} is already in the prescription.`);
      return;
    }
    setActiveSpeedRx((prev) => [
      ...prev,
      { generic: mol.generic, form: mol.form, dose: mol.defaultDose, days: mol.defaultDays },
    ]);
    showToast(`Added ${mol.generic}`);
  };

  const handleRemoveMolecule = (index: number) => {
    setActiveSpeedRx((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Complete & Advance Queue
  const handleCompleteAndNext = () => {
    showToast(`Saved ℞ for Token #${currentPatient.token} (${currentPatient.patientName}) & dispatched WhatsApp PDF`);
    handleCallNext();
  };

  // Toggle Payment Status
  const handleTogglePayment = (tokenNum: number) => {
    setDayRegister((prev) =>
      prev.map((p) => {
        if (p.token === tokenNum) {
          const nextStatus = p.paymentStatus === "paid" ? "pending" : "paid";
          showToast(`Token #${tokenNum} payment marked ${nextStatus.toUpperCase()}`);
          return { ...p, paymentStatus: nextStatus };
        }
        return p;
      })
    );
  };

  // Add Walk-in Patient to Register
  const handleAddWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalkin.name.trim()) return;

    const maxToken = dayRegister.reduce((max, p) => Math.max(max, p.token), 10);
    const newToken = maxToken + 1;
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const newEntry = {
      token: newToken,
      time: nowStr,
      patientName: newWalkin.name,
      ageGender: `${newWalkin.age || "30"}${newWalkin.gender}`,
      phone: newWalkin.phone || "+919876543299",
      complaint: newWalkin.complaint || "General Consultation",
      fee: Number(newWalkin.fee) || 600,
      paymentMode: newWalkin.paymentMode,
      paymentStatus: newWalkin.paymentMode === "UPI" ? "paid" : "pending",
      status: "waiting",
      waitMins: 5,
      isStuck: false,
    };

    setDayRegister((prev) => [...prev, newEntry]);
    playTokenCallChime();
    showToast(`Added Walk-in Token #${newToken} (${newWalkin.name})`);

    setNewWalkin({
      name: "",
      age: "",
      gender: "F",
      phone: "",
      complaint: "General Consultation",
      fee: 600,
      paymentMode: "UPI",
    });
    setShowWalkinModal(false);
  };

  // Export Daily Register to Real Excel / CSV File
  const handleExportCSV = () => {
    const headers = [
      "Token Number",
      "Check-In Time",
      "Patient Name",
      "Age / Gender",
      "Phone",
      "Chief Complaint",
      "Fee (INR)",
      "Payment Mode",
      "Payment Status",
      "Consultation Status",
    ];

    const rows = dayRegister.map((p) => [
      p.token,
      p.time,
      `"${p.patientName}"`,
      p.ageGender,
      p.phone,
      `"${p.complaint}"`,
      p.fee,
      p.paymentMode,
      p.paymentStatus.toUpperCase(),
      p.status.toUpperCase(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `DocSphere_ClinicOS_Daily_Register_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Downloaded official Daily Register (.CSV) for Microsoft Excel");
  };

  return (
    <div className="h-full flex flex-col space-y-3 font-sans pb-4">
      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-in fade-in">
          <Volume2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionToast}</span>
          <button
            onClick={() => setActionToast(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* TOP HEADER COCKPIT BAR (COMPACT & NEAT) */}
      <header className="rounded-2xl border border-black/[0.06] bg-white px-4 py-2.5 dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0071E3] text-white font-bold text-xs shadow-xs">
            OPD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-[#1D1D1F] dark:text-white tracking-tight">
                Chamber Cockpit · Dr. Rahul Sharma
              </h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Operational
              </span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] border border-blue-500/20">
                MD (Medicine) · NMC Verified
              </span>
            </div>
            <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">
              Derma Care Skin &amp; Laser Centre • Rajpur Road, Dehradun
            </p>
          </div>
        </div>

        {/* Quick Operational Links */}
        <div className="flex items-center gap-2">
          {/* Waiting Room TV Link */}
          <Link
            href="/waiting-room"
            target="_blank"
            className="inline-flex items-center gap-1 rounded-xl border border-black/[0.06] bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] transition"
            title="Open Waiting Lounge TV Board"
          >
            <Tv className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
            <span className="hidden sm:inline">Waiting TV</span>
          </Link>

          {/* Front Desk Token Counter */}
          <Link
            href="/dashboard/desk"
            className="inline-flex items-center gap-1 rounded-xl border border-black/[0.06] bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-100 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] transition"
            title="Open Receptionist Desk"
          >
            <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Reception Desk</span>
          </Link>

          {/* New Walk-in Button */}
          <button
            type="button"
            onClick={() => setShowWalkinModal(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Walk-in</span>
          </button>

          {/* Call Next Patient Primary Action */}
          <button
            type="button"
            onClick={handleCallNext}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Call Next</span>
          </button>
        </div>
      </header>

      {/* 3-COLUMN HIGH-DENSITY OPERATING GRID (100% SPACE UTILIZATION) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-stretch">
        
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* PANE 1: COMPACT LIVE OPD QUEUE (lg:col-span-3)                                */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        <section className="lg:col-span-3 rounded-2xl border border-black/[0.06] bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                  OPD Queue ({waitingPatients.length} Waiting)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpdPaused(!opdPaused)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                  opdPaused
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 dark:bg-white/10 text-[#6E6E73] dark:text-[#A1A1A6]"
                }`}
              >
                {opdPaused ? "Resume" : "Pause"}
              </button>
            </div>

            {/* Waiting List Cards */}
            <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
              {waitingPatients.map((pt) => (
                <div
                  key={pt.token}
                  className={`rounded-xl border p-2.5 text-xs transition ${
                    pt.isStuck
                      ? "border-red-500/30 bg-red-50/30 dark:bg-red-950/20"
                      : "border-black/[0.05] bg-[#F5F6F9] dark:border-white/[0.06] dark:bg-[#121316]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#0071E3] dark:text-[#2997FF]">
                        #{pt.token}
                      </span>
                      <span className="font-bold text-[#1D1D1F] dark:text-white">
                        {pt.patientName}
                      </span>
                      <span className="text-[10px] text-[#86868B]">({pt.ageGender})</span>
                    </div>

                    <span className="font-mono text-[10px] text-[#86868B]">
                      {pt.waitMins}m wait
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[#6E6E73] dark:text-[#A1A1A6] truncate max-w-[150px]">
                      {pt.complaint}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        pt.paymentStatus === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {pt.paymentMode} {pt.paymentStatus === "paid" ? "Paid" : "Due"}
                    </span>
                  </div>

                  {pt.isStuck && (
                    <div className="mt-2 flex items-center justify-between border-t border-red-500/20 pt-1.5 text-[10px]">
                      <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Waiting &gt; 35m
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowStuckModal(true)}
                        className="font-bold text-red-600 underline hover:text-red-700"
                      >
                        Priority Call
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {waitingPatients.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-[#86868B] dark:border-white/10">
                  All waiting tokens cleared!
                </div>
              )}
            </div>
          </div>

          {/* Bottom Queue Helper */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[#86868B]">
            <span>Soundbox bell connected</span>
            <button
              onClick={() => {
                playTokenCallChime();
                showToast("Acoustic calling bell test chime played");
              }}
              className="text-[#0071E3] font-bold hover:underline"
            >
              Test Chime 🔔
            </button>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* PANE 2: ACTIVE IN-ROOM PATIENT COCKPIT & SPEED RX STUDIO (lg:col-span-5)      */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        <section className="lg:col-span-5 rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Active Patient Demographics Bar */}
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/40 p-3.5 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                    IN ROOM
                  </span>
                  <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                    #{currentPatient.token}
                  </span>
                  <span className="text-base font-bold text-[#1D1D1F] dark:text-white">
                    {currentPatient.patientName}
                  </span>
                  <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                    ({currentPatient.ageGender})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] bg-white/70 dark:bg-black/40 px-2 py-1 rounded-full text-[#6E6E73] dark:text-[#A1A1A6]">
                    {currentPatient.inRoomMins}m in room
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full text-[11px]">
                    ₹{currentPatient.fee} {currentPatient.paymentMode} ✓
                  </span>
                </div>
              </div>

              {/* Clinical Memory Alert Strip (Visit 3) */}
              <div
                onClick={() => setShowHistoryModal(true)}
                className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-900 dark:text-amber-200 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-amber-600">⚠️</span>
                  <span className="font-bold">
                    Visit #{currentPatient.visitNumber} · Prior Rx: {currentPatient.lastRx}
                  </span>
                </div>
                <span className="font-bold text-[10px] text-amber-700 dark:text-amber-300 underline shrink-0">
                  Timeline →
                </span>
              </div>
            </div>

            {/* Embedded Speed Rx Studio */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                    Speed Rx Pad (NMC Generic Molecules)
                  </span>
                </div>
                <Link
                  href="/dashboard/consult/APT-DERMA-102"
                  className="text-[11px] font-bold text-[#0071E3] hover:underline flex items-center gap-0.5"
                >
                  Full Rx Studio <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* 1-Tap Quick Molecules Chips */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SPEED_RX_MOLECULES.slice(0, 5).map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddMolecule(m)}
                    className="rounded-lg border border-black/[0.06] bg-gray-50 px-2 py-1 text-[11px] font-semibold text-[#1D1D1F] hover:border-[#0071E3] hover:bg-blue-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:hover:border-[#2997FF] transition"
                  >
                    + {m.brand} ({m.generic.split(" ")[0]})
                  </button>
                ))}
              </div>

              {/* Prescribed Items Table in Active Pad */}
              <div className="rounded-xl border border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#121316] p-2 space-y-1.5">
                {activeSpeedRx.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-white p-2 text-xs shadow-2xs dark:bg-[#1C1C1E] border border-black/[0.04] dark:border-white/[0.06]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#1D1D1F] dark:text-white">
                        {item.form}. {item.generic}
                      </div>
                      <div className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        Dosage: <strong className="text-[#1D1D1F] dark:text-white">{item.dose}</strong> • Duration: {item.days}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMolecule(idx)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Remove from Rx"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {activeSpeedRx.length === 0 && (
                  <div className="py-4 text-center text-xs text-[#86868B]">
                    Click any molecule above or type to add medicines to this prescription.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar: Print, WhatsApp, Complete & Call Next */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast("Sending prescription to thermal chamber printer");
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] bg-white py-2 text-xs font-bold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white dark:hover:bg-white/10 transition active:scale-95"
              >
                <Printer className="h-3.5 w-3.5 text-blue-600" />
                <span>Print ℞ Slip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`Dispatched cryptographic ℞ PDF to ${currentPatient.phone} via WhatsApp`);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] bg-white py-2 text-xs font-bold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white dark:hover:bg-white/10 transition active:scale-95"
              >
                <Send className="h-3.5 w-3.5 text-emerald-600" />
                <span>WhatsApp ℞ PDF</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCompleteAndNext}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black text-white shadow-md transition active:scale-98"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Visit &amp; Call Next Patient →</span>
            </button>
          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────────────────────── */}
        {/* PANE 3: THE EXCEL REPLACEMENT REGISTER & 9 PM CASH CLOSING (lg:col-span-4)   */}
        {/* ───────────────────────────────────────────────────────────────────────────── */}
        <section className="lg:col-span-4 rounded-2xl border border-black/[0.06] bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-2xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            {/* Financial Headliners */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Total Collected
                </span>
                <span className="text-base font-black font-mono text-emerald-800 dark:text-emerald-200">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  UPI: ₹{upiTotal} • Cash: ₹{cashTotal}
                </span>
              </div>

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                    Cash in Drawer
                  </span>
                  <span className="text-base font-black font-mono text-amber-800 dark:text-amber-200">
                    ₹{cashTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCashDrawerModal(true)}
                  className="text-[10px] font-bold text-amber-800 dark:text-amber-300 underline text-left"
                >
                  9 PM Denomination Lock →
                </button>
              </div>
            </div>

            {/* Daily Register Table (The Excel Replacement) Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                Daily Register ({dayRegister.length} Patients)
              </span>

              {/* 1-Click Excel CSV Export Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition"
                title="Download CSV formatted for Microsoft Excel"
              >
                <Download className="h-3 w-3" />
                <span>Export .CSV</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2 text-xs">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name, token #..."
                  className="w-full rounded-lg border border-black/[0.06] bg-[#F5F6F9] py-1.5 pl-8 pr-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/10 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-2 py-1 rounded ${activeTab === "all" ? "bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white shadow-2xs" : "text-gray-500"}`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("waiting")}
                  className={`px-2 py-1 rounded ${activeTab === "waiting" ? "bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white shadow-2xs" : "text-gray-500"}`}
                >
                  Waiting
                </button>
              </div>
            </div>

            {/* Excel-style Compact Data Grid */}
            <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
              <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F6F9] dark:bg-[#16171B] text-[10px] font-bold text-[#86868B] uppercase tracking-wider sticky top-0 border-b border-black/[0.04] dark:border-white/[0.06]">
                    <tr>
                      <th className="py-1.5 px-2">Tk#</th>
                      <th className="py-1.5 px-2">Patient</th>
                      <th className="py-1.5 px-2 text-right">Fee</th>
                      <th className="py-1.5 px-2 text-right">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {filteredRegister.map((r) => (
                      <tr
                        key={r.token}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition"
                      >
                        <td className="py-1.5 px-2 font-mono font-bold text-[#0071E3] dark:text-[#2997FF]">
                          #{r.token}
                        </td>
                        <td className="py-1.5 px-2">
                          <div className="font-semibold text-[#1D1D1F] dark:text-white truncate max-w-[110px]">
                            {r.patientName}
                          </div>
                          <div className="text-[10px] text-[#86868B] truncate max-w-[110px]">
                            {r.complaint}
                          </div>
                        </td>
                        <td className="py-1.5 px-2 font-mono text-right font-bold text-[#1D1D1F] dark:text-white">
                          ₹{r.fee}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(r.token)}
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                              r.paymentStatus === "paid"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            }`}
                          >
                            {r.paymentMode} {r.paymentStatus === "paid" ? "✓" : "Due"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bottom EOD Closing Trigger Bar */}
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowPrintReportModal(true)}
              className="text-[#0071E3] font-bold hover:underline flex items-center gap-1"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Day CA Audit</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCashDrawerModal(true)}
              className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-3 py-1.5 shadow-2xs transition"
            >
              Lock 9 PM Drawer 🔒
            </button>
          </div>
        </section>

      </div>

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CLINICAL TIMELINE (PATIENT MEMORY)                                  */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-black/[0.08] bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                  Priya Singh (24F) · 3-Visit History
                </h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="rounded-xl border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/20 p-3 space-y-1">
                <div className="flex justify-between font-bold text-rose-800 dark:text-rose-300">
                  <span>Visit 1 · 14 Aug 2026</span>
                  <span>Adverse Reaction</span>
                </div>
                <div className="text-[11px] text-rose-700 dark:text-rose-400">
                  Rx: Fluconazole 150mg &bull; Patient called with acute gastric pain. Discontinued.
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 p-3 space-y-1">
                <div className="flex justify-between font-bold text-emerald-800 dark:text-emerald-300">
                  <span>Visit 2 · 02 Sep 2026</span>
                  <span>Protocol Success</span>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Rx: Itraconazole 200mg (1-0-1) + Ketoconazole lotion &bull; Lesions 90% resolved. Well tolerated.
                </div>
              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-3 space-y-1">
                <div className="flex justify-between font-bold text-blue-800 dark:text-blue-300">
                  <span>Visit 3 · Today</span>
                  <span>Acne Consultation</span>
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-400">
                  Prescription ready via embedded Speed Rx pad.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-xl bg-[#0071E3] px-4 py-2 text-xs font-bold text-white hover:bg-[#0077ED]"
              >
                Return to Chamber
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: ADD WALK-IN PATIENT MODAL                                            */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                  Add Walk-In Patient to Queue
                </h3>
              </div>
              <button onClick={() => setShowWalkinModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddWalkinSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newWalkin.name}
                  onChange={(e) => setNewWalkin({ ...newWalkin, name: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3 py-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={newWalkin.age}
                    onChange={(e) => setNewWalkin({ ...newWalkin, age: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3 py-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Gender</label>
                  <select
                    value={newWalkin.gender}
                    onChange={(e) => setNewWalkin({ ...newWalkin, gender: e.target.value })}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-2 py-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">OPD Fee</label>
                  <input
                    type="number"
                    value={newWalkin.fee}
                    onChange={(e) => setNewWalkin({ ...newWalkin, fee: Number(e.target.value) })}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-2 py-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Skin Allergy / Fungal infection"
                  value={newWalkin.complaint}
                  onChange={(e) => setNewWalkin({ ...newWalkin, complaint: e.target.value })}
                  className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3 py-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Payment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWalkin({ ...newWalkin, paymentMode: "UPI" })}
                    className={`rounded-xl py-2 font-bold text-xs border ${newWalkin.paymentMode === "UPI" ? "border-emerald-600 bg-emerald-500/10 text-emerald-700" : "border-gray-200"}`}
                  >
                    Soundbox UPI (Immediate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewWalkin({ ...newWalkin, paymentMode: "Cash" })}
                    className={`rounded-xl py-2 font-bold text-xs border ${newWalkin.paymentMode === "Cash" ? "border-amber-600 bg-amber-500/10 text-amber-700" : "border-gray-200"}`}
                  >
                    Physical Cash (Pending)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Issue Token &amp; Enqueue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: 9 PM CASH DRAWER DENOMINATION LOCK                                   */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showCashDrawerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                  9 PM Cash Drawer Denomination Audit
                </h3>
              </div>
              <button onClick={() => setShowCashDrawerModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
              Count the physical currency notes in the receptionist cash drawer before shift closing:
            </p>

            <div className="rounded-xl border border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#121316] p-3 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span>₹500 Notes:</span>
                <input
                  type="number"
                  min="0"
                  value={denominations.d500}
                  onChange={(e) => setDenominations({ ...denominations, d500: Number(e.target.value) || 0 })}
                  className="w-16 rounded border px-2 py-1 text-right font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>₹200 Notes:</span>
                <input
                  type="number"
                  min="0"
                  value={denominations.d200}
                  onChange={(e) => setDenominations({ ...denominations, d200: Number(e.target.value) || 0 })}
                  className="w-16 rounded border px-2 py-1 text-right font-bold"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>₹100 Notes:</span>
                <input
                  type="number"
                  min="0"
                  value={denominations.d100}
                  onChange={(e) => setDenominations({ ...denominations, d100: Number(e.target.value) || 0 })}
                  className="w-16 rounded border px-2 py-1 text-right font-bold"
                />
              </div>

              <div className="border-t border-black/[0.08] pt-2 flex justify-between font-bold text-xs">
                <span>Counted Cash:</span>
                <span className="text-emerald-700 dark:text-emerald-400">₹{countedCash.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold text-xs">
                <span>System Expected Cash:</span>
                <span>₹{cashTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-600">
                <span>Discrepancy:</span>
                <span>
                  {countedCash === cashTotal
                    ? "₹0.00 (100% Balanced ✓)"
                    : `₹${(countedCash - cashTotal).toLocaleString("en-IN")} (Audit Flag)`}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCashDrawerModal(false)}
                className="rounded-xl px-4 py-2 font-bold text-xs text-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCashDrawerModal(false);
                  showToast("Cash drawer locked at ₹1,800. Shift audit submitted to Platform ledger.");
                }}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700"
              >
                Confirm &amp; Lock Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: CA-READY AUDIT DAY REPORT                                            */}
      {/* ───────────────────────────────────────────────────────────────────────────── */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-black/[0.08] bg-white p-5 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                  Daily Closing &amp; CA Audit Sheet
                </h3>
              </div>
              <button onClick={() => setShowPrintReportModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-black/[0.08] p-4 text-xs font-mono space-y-2 dark:border-white/[0.08]">
              <div className="font-bold">DERMA CARE SKIN &amp; LASER CENTRE</div>
              <div className="text-[11px] text-[#86868B]">GSTIN: 05AAACH7409R1ZZ · Audit Batch #EOD-20261102</div>
              <div className="border-t pt-2 flex justify-between">
                <span>Total OPD Consultations:</span>
                <span className="font-bold">{dayRegister.length} Patients</span>
              </div>
              <div className="flex justify-between">
                <span>Soundbox UPI Verified:</span>
                <span className="font-bold">₹{upiTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash in Drawer:</span>
                <span className="font-bold">₹{cashTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t pt-1 flex justify-between font-bold text-sm text-emerald-600">
                <span>GROSS COLLECTIONS:</span>
                <span>₹{totalRevenue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintReportModal(false)}
                className="rounded-xl px-4 py-2 font-bold text-xs text-gray-500"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast("Printing official CA closing statement");
                }}
                className="rounded-xl bg-[#0071E3] px-4 py-2 text-xs font-bold text-white hover:bg-[#0077ED] flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
