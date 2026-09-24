"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  IndianRupee, 
  Volume2, 
  RotateCw, 
  UserX, 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink, 
  AlertTriangle, 
  Lock, 
  Plus, 
  Check, 
  FileText, 
  Send, 
  DollarSign, 
  X, 
  Printer, 
  Pause, 
  Play, 
  History, 
  MessageSquare,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Users
} from "lucide-react";

// Professional Dental Tooth SVG Vector Icon
function DentalToothIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 3C4.24 3 2 5.24 2 8c0 3.25 1.5 6.5 2.5 10 0.5 1.75 1.5 3 2.5 3 1.25 0 2-1.5 2.5-3.5 0.5-2 1-3.5 2.5-3.5s2 1.5 2.5 3.5c0.5 2 1.25 3.5 2.5 3.5 1 0 2-1.25 2.5-3 1-3.5 2.5-6.75 2.5-10 0-2.76-2.24-5-5-5-1.5 0-3 0.75-4.5 2-1.5-1.25-3-2-4.5-2z" />
    </svg>
  );
}

// Clean Web Audio API dual-tone chime generator for acoustic counter alert
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
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, now + 0.18);
    gain2.gain.setValueAtTime(0.28, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.error("Audio chime error:", err);
  }
}

export default function DashboardOverviewPage() {
  // Toast & Sync state
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [secondsSinceSync, setSecondsSinceSync] = useState(3);

  // Financial & Metric state (Obsessive money tracking)
  const [totalCollected, setTotalCollected] = useState(8450);
  const [upiCollected, setUpiCollected] = useState(6650);
  const [cashCollected, setCashCollected] = useState(1800);
  const [openTokensCount, setOpenTokensCount] = useState(3);

  // Chamber 1 state (Dr. Rahul Sharma - Dermatology)
  const [chamber1Paused, setChamber1Paused] = useState(false);
  const [chamber1Current, setChamber1Current] = useState({
    token: 12,
    patientName: "Priya S.",
    ageGender: "24F",
    complaint: "Acne Follow-up",
    visitNumber: 3,
    lastRx: "Itraconazole 200mg (Completed)",
    failedRx: "Fluconazole 150mg (Gastric Distress)",
    paymentStatus: "paid",
    fee: 600,
    inRoomMins: 6
  });

  const [chamber1Queue, setChamber1Queue] = useState([
    { token: 13, patientName: "Rohit V.", ageGender: "41M", complaint: "BP Check", waitMins: 12, status: "waiting", fee: 600, payment: "UPI Paid", isStuck: false },
    { token: 14, patientName: "Anjali K.", ageGender: "29F", complaint: "Laser Consult", waitMins: 25, status: "waiting", fee: 1200, payment: "Cash Pending", isStuck: false },
    { token: 15, patientName: "Vikram P.", ageGender: "50M", complaint: "Eczema", waitMins: 40, status: "waiting", fee: 600, payment: "Cash Pending", isStuck: true }
  ]);

  // Chamber 2 state (Dr. Aditi Joshi - Dental)
  const [chamber2Paused, setChamber2Paused] = useState(false);
  const [chamber2Current, setChamber2Current] = useState({
    token: 5,
    patientName: "Amit R.",
    ageGender: "32M",
    complaint: "RCT Root Canal",
    visitNumber: 1,
    paymentStatus: "pending",
    fee: 4000,
    inRoomMins: 14
  });

  const [chamber2Queue, setChamber2Queue] = useState([
    { token: 6, patientName: "Sneha M.", ageGender: "22F", complaint: "Scaling", waitMins: 5, status: "waiting", fee: 800, payment: "UPI Paid", isStuck: false },
    { token: 7, patientName: "Karan D.", ageGender: "45M", complaint: "Crown Prep", waitMins: 15, status: "waiting", fee: 2500, payment: "Cash Pending", isStuck: false }
  ]);

  // Modal Dialog States
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showStuckModal, setShowStuckModal] = useState(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [showPnlModal, setShowPnlModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState<"chamber-1" | "chamber-2" | null>(null);
  const [showCollectionsBreakdown, setShowCollectionsBreakdown] = useState(false);
  const [showDigestModal, setShowDigestModal] = useState(false);
  const [showCashDrawerModal, setShowCashDrawerModal] = useState(false);

  // New Walk-in form state
  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "F",
    complaint: "",
    fee: 600,
    paymentMode: "UPI"
  });

  // Timer loop for sync seconds counter
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceSync(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showNotification = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4000);
  };

  // Chamber 1 Actions
  const handleCallChamber1Next = () => {
    if (chamber1Queue.length === 0) {
      showNotification("Chamber 1 queue is cleared!");
      return;
    }
    playTokenCallChime();
    const nextPatient = chamber1Queue[0];
    const remaining = chamber1Queue.slice(1);

    setChamber1Current({
      token: nextPatient.token,
      patientName: nextPatient.patientName,
      ageGender: nextPatient.ageGender,
      complaint: nextPatient.complaint,
      visitNumber: 1,
      lastRx: "No prior records (New Patient)",
      failedRx: "None recorded",
      paymentStatus: nextPatient.payment.includes("Paid") ? "paid" : "pending",
      fee: nextPatient.fee,
      inRoomMins: 1
    });

    setChamber1Queue(remaining);
    showNotification(`Called Token #${nextPatient.token} (${nextPatient.patientName}) into Chamber 1`);
  };

  // Chamber 2 Actions
  const handleCallChamber2Next = () => {
    if (chamber2Queue.length === 0) {
      showNotification("Chamber 2 queue is cleared!");
      return;
    }
    playTokenCallChime();
    const nextPatient = chamber2Queue[0];
    const remaining = chamber2Queue.slice(1);

    setChamber2Current({
      token: nextPatient.token,
      patientName: nextPatient.patientName,
      ageGender: nextPatient.ageGender,
      complaint: nextPatient.complaint,
      visitNumber: 1,
      paymentStatus: nextPatient.payment.includes("Paid") ? "paid" : "pending",
      fee: nextPatient.fee,
      inRoomMins: 1
    });

    setChamber2Queue(remaining);
    showNotification(`Called Token #${nextPatient.token} (${nextPatient.patientName}) into Chamber 2`);
  };

  // Toggle Chamber 2 Payment Status (Inline Money Control)
  const handleToggleChamber2Payment = () => {
    if (chamber2Current.paymentStatus === "pending") {
      setChamber2Current(prev => ({ ...prev, paymentStatus: "paid" }));
      setTotalCollected(prev => prev + chamber2Current.fee);
      setUpiCollected(prev => prev + chamber2Current.fee);
      setOpenTokensCount(prev => Math.max(0, prev - 1));
      showNotification(`₹${chamber2Current.fee.toLocaleString("en-IN")} marked PAID via Soundbox UPI for Token #${chamber2Current.token}`);
    } else {
      setChamber2Current(prev => ({ ...prev, paymentStatus: "pending" }));
      setTotalCollected(prev => Math.max(0, prev - chamber2Current.fee));
      setUpiCollected(prev => Math.max(0, prev - chamber2Current.fee));
      setOpenTokensCount(prev => prev + 1);
      showNotification(`Token #${chamber2Current.token} payment flipped to PENDING`);
    }
  };

  // Resolve Stuck Token (Vikram P.)
  const handleResolveStuck = (action: "call_now" | "whatsapp_delay" | "no_show") => {
    setShowStuckModal(false);
    playTokenCallChime();

    if (action === "call_now") {
      const stuckPatient = chamber1Queue.find(p => p.isStuck) || chamber1Queue[2];
      if (!stuckPatient) return;
      const remaining = chamber1Queue.filter(p => p.token !== stuckPatient.token);

      setChamber1Current({
        token: stuckPatient.token,
        patientName: stuckPatient.patientName,
        ageGender: stuckPatient.ageGender,
        complaint: `${stuckPatient.complaint} (Priority Call)`,
        visitNumber: 2,
        lastRx: "Clobetasol 0.05% + Cetirizine 10mg",
        failedRx: "Betamethasone dipropionate",
        paymentStatus: stuckPatient.payment.includes("Paid") ? "paid" : "pending",
        fee: stuckPatient.fee,
        inRoomMins: 1
      });
      setChamber1Queue(remaining);
      showNotification(`Priority Override: Token #${stuckPatient.token} (${stuckPatient.patientName}) called into Chamber 1`);
    } else if (action === "whatsapp_delay") {
      showNotification("WhatsApp delay push sent to Vikram P.: 'Dr. Rahul is in a procedure. Expected call: 11:20 AM.'");
    } else if (action === "no_show") {
      setChamber1Queue(prev => prev.filter(p => !p.isStuck));
      showNotification("Token #15 (Vikram P.) marked No-Show / Stepped Out. Queue cleared.");
    }
  };

  // Add Walk-in Patient to Selected Chamber
  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;

    if (showAddPatientModal === "chamber-1") {
      const newToken = (chamber1Queue.length > 0 ? chamber1Queue[chamber1Queue.length - 1].token : chamber1Current.token) + 1;
      setChamber1Queue(prev => [
        ...prev,
        {
          token: newToken,
          patientName: newPatient.name,
          ageGender: `${newPatient.age}${newPatient.gender}`,
          complaint: newPatient.complaint || "General Consultation",
          waitMins: 10,
          status: "waiting",
          fee: Number(newPatient.fee) || 600,
          payment: newPatient.paymentMode === "UPI" ? "UPI Paid" : "Cash Pending",
          isStuck: false
        }
      ]);
      if (newPatient.paymentMode === "UPI") {
        setTotalCollected(prev => prev + (Number(newPatient.fee) || 600));
        setUpiCollected(prev => prev + (Number(newPatient.fee) || 600));
      } else {
        setOpenTokensCount(prev => prev + 1);
      }
      showNotification(`Added Token #${newToken} (${newPatient.name}) to Chamber 1`);
    } else {
      const newToken = (chamber2Queue.length > 0 ? chamber2Queue[chamber2Queue.length - 1].token : chamber2Current.token) + 1;
      setChamber2Queue(prev => [
        ...prev,
        {
          token: newToken,
          patientName: newPatient.name,
          ageGender: `${newPatient.age}${newPatient.gender}`,
          complaint: newPatient.complaint || "Dental Consult",
          waitMins: 10,
          status: "waiting",
          fee: Number(newPatient.fee) || 800,
          payment: newPatient.paymentMode === "UPI" ? "UPI Paid" : "Cash Pending",
          isStuck: false
        }
      ]);
      if (newPatient.paymentMode === "UPI") {
        setTotalCollected(prev => prev + (Number(newPatient.fee) || 800));
        setUpiCollected(prev => prev + (Number(newPatient.fee) || 800));
      } else {
        setOpenTokensCount(prev => prev + 1);
      }
      showNotification(`Added Token #${newToken} (${newPatient.name}) to Chamber 2`);
    }

    setNewPatient({ name: "", age: "", gender: "F", complaint: "", fee: 600, paymentMode: "UPI" });
    setShowAddPatientModal(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* FLOATING ACTION NOTIFICATION TOAST */}
      {actionToast && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button 
            type="button"
            onClick={() => setActionToast(null)} 
            className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ┌─────────────────────────────────────────────────────────────────────────────┐ */}
      {/* │ CLINIC COMMAND BOARD       │ TOTAL COLLECTED: ₹8,450   │ OPEN: 3           │ */}
      {/* └─────────────────────────────────────────────────────────────────────────────┘ */}
      <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-apple-card flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Live Heartbeat */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-sm tracking-wider">
            CMD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-[#1D1D1F] dark:text-white tracking-tight uppercase">
                Clinic Command Board
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Sync ({secondsSinceSync}s)</span>
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
              Real-time OPD Triage • Clinical Memory Lookup • Soundbox-Reconciled Counter Billing
            </p>
          </div>
        </div>

        {/* Action Counters (Money + Unresolved Tokens) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total Collected Pill (Clickable for CA/Soundbox audit breakdown) */}
          <button
            type="button"
            onClick={() => setShowCollectionsBreakdown(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 transition active:scale-95 cursor-pointer text-left"
            title="Click to view Soundbox vs Cash audit breakdown"
          >
            <div className="p-1 rounded-lg bg-emerald-600 text-white">
              <IndianRupee className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                Total Collected
              </div>
              <div className="text-sm font-black font-mono">
                ₹{totalCollected.toLocaleString("en-IN")}
              </div>
            </div>
          </button>

          {/* Open/Pending Tokens Pill */}
          <button
            type="button"
            onClick={() => setShowCollectionsBreakdown(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-800 dark:text-amber-300 transition active:scale-95 cursor-pointer text-left"
            title="Click to review pending payments"
          >
            <div className="p-1 rounded-lg bg-amber-600 text-white">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">
                Open / Pending
              </div>
              <div className="text-sm font-black font-mono">
                {openTokensCount} Tokens
              </div>
            </div>
          </button>

          {/* 9 PM Daily Digest Nudge Button */}
          <button
            type="button"
            onClick={() => setShowDigestModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1D1D1F] dark:text-white text-xs font-bold transition active:scale-95 cursor-pointer"
            title="Preview 9 PM Doctor WhatsApp Closing Digest"
          >
            <Send className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">9 PM Digest</span>
          </button>

          {/* Direct link to Reception Full Desk */}
          <Link
            href="/dashboard/desk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Desk Console</span>
          </Link>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TWO CHAMBER ACTION COMMAND CARDS                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* 🟢 CHAMBER 1: Dr. Rahul (Dermatology) */}
        <div className={`rounded-3xl border ${chamber1Paused ? "border-amber-400/40 bg-amber-50/10" : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]"} p-5 sm:p-6 shadow-apple-card space-y-4`}>
          {/* Chamber Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${chamber1Paused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`}></span>
                <h2 className="text-sm sm:text-base font-black text-[#1D1D1F] dark:text-white uppercase tracking-tight">
                  Chamber 1: Dr. Rahul (Dermatology)
                </h2>
                {chamber1Paused && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                    PAUSED
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>NMC Reg. UKMC-8942-2012 · MD (Dermatology)</span>
              </div>
            </div>

            <Link
              href="/dashboard/consult/APT-DERMA-102"
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Open ℞ Pad <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* NEXT / IN-ROOM PATIENT HERO BOX */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase">
                  IN ROOM
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  #{chamber1Current.token}
                </span>
                <span className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white">
                  {chamber1Current.patientName} ({chamber1Current.ageGender})
                </span>
                <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  • {chamber1Current.complaint}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  ₹{chamber1Current.fee} UPI Verified
                </span>
                <span className="text-[10px] font-mono text-[#86868B] px-2 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                  {chamber1Current.inRoomMins}m in room
                </span>
              </div>
            </div>

            {/* ⚠️ RETENTION KILLER: THE "3rd Visit" CLINICAL MEMORY BANNER */}
            <div 
              onClick={() => setShowHistoryDrawer(true)}
              className="group p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 transition cursor-pointer flex items-start justify-between gap-3 text-amber-900 dark:text-amber-200"
              title="Click to view full clinical timeline and prior prescriptions"
            >
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                  <span className="underline decoration-amber-500/50 underline-offset-2">
                    {chamber1Current.visitNumber}rd Visit • Last Rx: {chamber1Current.lastRx}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300/80 font-medium">
                  Failed: {chamber1Current.failedRx} → Click to open prior 3-visit Rx timeline
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 text-amber-900 dark:text-amber-100 flex items-center gap-1">
                <History className="h-3 w-3" />
                History
              </span>
            </div>
          </div>

          {/* ACTION BUTTON BAR: [ 📞 Call Token ] [ ➕ Add Patient ] [ ⏸ Pause ] */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCallChamber1Next}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="h-4 w-4" />
              <span>Call Token</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddPatientModal("chamber-1")}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-white font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Patient</span>
            </button>

            <button
              type="button"
              onClick={() => setChamber1Paused(prev => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer ${
                chamber1Paused 
                  ? "bg-amber-600 text-white hover:bg-amber-700" 
                  : "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-white"
              }`}
            >
              {chamber1Paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span>{chamber1Paused ? "Resume" : "Pause"}</span>
            </button>
          </div>

          {/* LIVE QUEUE (NEXT 3 PATIENTS ONLY — NO INFINITE TABLE CLUTTER) */}
          <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-xs font-bold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider">
              <span>Live Queue ({chamber1Queue.length} Waiting)</span>
              <span>Wait Times</span>
            </div>

            <div className="space-y-2">
              {chamber1Queue.slice(0, 3).map((pt) => (
                <div 
                  key={pt.token}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                    pt.isStuck
                      ? "border-red-500/40 bg-red-50/20 dark:bg-red-950/20 text-red-900 dark:text-red-200"
                      : "border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] text-[#1D1D1F] dark:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      #{pt.token}
                    </span>
                    <span className="font-semibold">{pt.patientName}</span>
                    <span className="text-[#86868B] dark:text-[#8E8E93]">• {pt.ageGender} • {pt.complaint}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span>Wait: {pt.waitMins}m</span>
                    {pt.isStuck && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-sans text-[10px] font-black uppercase tracking-wider animate-pulse">
                        ⚠️ STUCK
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {chamber1Queue.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-xs text-[#86868B]">
                  Queue Cleared · No waiting patients for Chamber 1
                </div>
              )}
            </div>

            {/* [ 🚨 Resolve Stuck Token ] Action Button */}
            {chamber1Queue.some(p => p.isStuck) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowStuckModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Resolve Stuck Token (#15 Vikram P. waiting 40m)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 🟢 CHAMBER 2: Dr. Aditi (Dental) */}
        <div className={`rounded-3xl border ${chamber2Paused ? "border-amber-400/40 bg-amber-50/10" : "border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]"} p-5 sm:p-6 shadow-apple-card space-y-4`}>
          {/* Chamber Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${chamber2Paused ? "bg-amber-500" : "bg-blue-500 animate-pulse"}`}></span>
                <h2 className="text-sm sm:text-base font-black text-[#1D1D1F] dark:text-white uppercase tracking-tight">
                  Chamber 2: Dr. Aditi (Dental)
                </h2>
                {chamber2Paused && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                    PAUSED
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] flex items-center gap-1.5">
                <DentalToothIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>Dental Council Reg. UDC-4120-2016 · MDS (Endodontics)</span>
              </div>
            </div>

            <Link
              href="/dashboard/chambers"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              Dental Console <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* NEXT / IN-ROOM PATIENT HERO BOX */}
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-black text-[10px] tracking-wider uppercase">
                  IN ROOM
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                  #{chamber2Current.token}
                </span>
                <span className="text-sm sm:text-base font-bold text-[#1D1D1F] dark:text-white">
                  {chamber2Current.patientName} ({chamber2Current.ageGender})
                </span>
                <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  • {chamber2Current.complaint}
                </span>
              </div>

              <span className="text-[10px] font-mono text-[#86868B] px-2 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] self-start sm:self-center">
                {chamber2Current.inRoomMins}m in room
              </span>
            </div>

            {/* 💳 INLINE PAYMENT STATUS (THE MONEY TRIGGER) */}
            <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
              chamber2Current.paymentStatus === "pending"
                ? "bg-rose-500/10 border-rose-500/25 text-rose-900 dark:text-rose-200"
                : "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200"
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {chamber2Current.paymentStatus === "pending" ? (
                  <>
                    <span className="text-rose-600 dark:text-rose-400 text-sm">💳</span>
                    <span>Payment: Pending (₹{chamber2Current.fee.toLocaleString("en-IN")})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Payment: Paid via Soundbox UPI (₹{chamber2Current.fee.toLocaleString("en-IN")})</span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleToggleChamber2Payment}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition active:scale-95 cursor-pointer shadow-xs ${
                  chamber2Current.paymentStatus === "pending"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {chamber2Current.paymentStatus === "pending" ? "Mark Paid" : "Paid ✓"}
              </button>
            </div>
          </div>

          {/* ACTION BUTTON BAR: [ 📞 Call Token ] [ ✅ Mark Paid ] [ ⏸ Pause ] */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCallChamber2Next}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Volume2 className="h-4 w-4" />
              <span>Call Token</span>
            </button>

            <button
              type="button"
              onClick={handleToggleChamber2Payment}
              className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer ${
                chamber2Current.paymentStatus === "pending"
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{chamber2Current.paymentStatus === "pending" ? "Mark Paid" : "Toggle Paid"}</span>
            </button>

            <button
              type="button"
              onClick={() => setChamber2Paused(prev => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs transition active:scale-95 cursor-pointer ${
                chamber2Paused 
                  ? "bg-amber-600 text-white hover:bg-amber-700" 
                  : "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-[#1D1D1F] dark:text-white"
              }`}
            >
              {chamber2Paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span>{chamber2Paused ? "Resume" : "Pause"}</span>
            </button>
          </div>

          {/* LIVE QUEUE (NEXT 3 PATIENTS ONLY) */}
          <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-xs font-bold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider">
              <span>Live Queue ({chamber2Queue.length} Waiting)</span>
              <span>Wait Times</span>
            </div>

            <div className="space-y-2">
              {chamber2Queue.slice(0, 3).map((pt) => (
                <div 
                  key={pt.token}
                  className="p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs text-[#1D1D1F] dark:text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      #{pt.token}
                    </span>
                    <span className="font-semibold">{pt.patientName}</span>
                    <span className="text-[#86868B] dark:text-[#8E8E93]">• {pt.ageGender} • {pt.complaint}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span>Wait: {pt.waitMins}m</span>
                    <span className="text-[11px] text-[#86868B]">({pt.payment})</span>
                  </div>
                </div>
              ))}

              {chamber2Queue.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-black/[0.08] dark:border-white/[0.08] text-center text-xs text-[#86868B]">
                  Queue Cleared · No waiting patients for Chamber 2
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAddPatientModal("chamber-2")}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Walk-in to Chamber 2</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ⚡ QUICK ACTIONS                                                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">⚡</span>
            <h3 className="text-xs sm:text-sm font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider">
              QUICK ACTIONS
            </h3>
          </div>
          <span className="text-[11px] text-[#86868B] font-mono">Clinical, CA Compliance &amp; Drawer Locks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* [ 🔔 Send WhatsApp Reminders ] */}
          <button
            type="button"
            onClick={() => setShowWhatsappModal(true)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Send className="h-4 w-4 text-emerald-600" />
            <span>🔔 Send WhatsApp Reminders</span>
          </button>

          {/* [ 📄 Print Day Report ] */}
          <button
            type="button"
            onClick={() => setShowPrintReportModal(true)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            <span>📄 Print Day Report</span>
          </button>

          {/* [ 💳 Reconcile Cash Drawer ] */}
          <button
            type="button"
            onClick={() => setShowCashDrawerModal(true)}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-black/[0.06] dark:border-white/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Lock className="h-4 w-4 text-amber-600" />
            <span>💳 Reconcile Cash Drawer</span>
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: RETURNING PATIENT CLINICAL MEMORY DRAWER (THE #1 RETENTION MOAT)   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                    Priya Singh (24F) • Clinical Memory
                  </h3>
                  <p className="text-xs text-[#86868B]">UID: PT-DERMA-912 · Rajpur Road, Dehradun</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Prescription &amp; Clinical Timeline (3 Visits)
              </div>

              {/* Visit 1 */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Visit 1 · 14 Aug 2026</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-[10px] font-bold">Adverse Reaction</span>
                </div>
                <div className="text-[#86868B]">Dx: Tinea Corporis / Erythematous plaque</div>
                <div className="font-mono text-slate-800 dark:text-slate-200">
                  Rx: Fluconazole 150mg 1 tab weekly
                </div>
                <div className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                  ⚠️ Patient called clinic on Day 3 reporting acute gastric distress &amp; nausea. Discontinued.
                </div>
              </div>

              {/* Visit 2 */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Visit 2 · 02 Sep 2026</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-bold">Success / Cleared</span>
                </div>
                <div className="text-[#86868B]">Dx: Switched Antifungal Protocol</div>
                <div className="font-mono text-slate-800 dark:text-slate-200">
                  Rx: Itraconazole 200mg (1-0-1 after food) 21d + Ketoconazole lotion
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                  ✓ Lesions 90% resolved. Well tolerated with no gastric symptoms.
                </div>
              </div>

              {/* Visit 3 (Today) */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-200">Visit 3 · Today (24 Sep 2026)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">Active Consult</span>
                </div>
                <div className="text-blue-800 dark:text-blue-300">Chief Complaint: Acne Vulgaris &amp; Post-Inflammatory Hyperpigmentation</div>
                <div className="font-mono text-blue-900 dark:text-blue-100 font-bold">
                  Doctor Action: Ready to issue ℞ via Studio pad
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <Link
                href="/dashboard/consult/APT-DERMA-102"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
              >
                Open Consultation Pad →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: RESOLVE STUCK TOKEN DIALOG                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showStuckModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Resolve Stuck Token #15
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStuckModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Patient: Vikram P. (50M) • Eczema • Waiting 40 min
              </p>
              <p className="text-[#86868B]">
                Waiting time exceeded clinical threshold (&gt;30m). Choose immediate resolution:
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleResolveStuck("call_now")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span>Call to Chamber 1 Now (Priority Jump)</span>
                </div>
                <span>⚡</span>
              </button>

              <button
                type="button"
                onClick={() => handleResolveStuck("whatsapp_delay")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/20 text-xs font-bold transition active:scale-95 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-600" />
                  <span>Send WhatsApp Delay Alert (+15m)</span>
                </div>
                <span>📲</span>
              </button>

              <button
                type="button"
                onClick={() => handleResolveStuck("no_show")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-white text-xs font-bold transition active:scale-95 cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-red-500" />
                  <span>Mark Patient Stepped Out / No-Show</span>
                </div>
                <span>Skip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: CA-READY PRINT DAY REPORT (DAY CLOSING LOCK)                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Daily Closing Settlement &amp; CA Audit Sheet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintReportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Statement Area */}
            <div className="p-5 rounded-2xl border border-black/[0.1] dark:border-white/[0.1] bg-black/[0.01] dark:bg-white/[0.02] space-y-4 text-xs font-mono">
              <div className="flex justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-3">
                <div>
                  <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">DOCSPHERE CLINIC — RAJPUR ROAD</div>
                  <div className="text-[11px] text-[#86868B]">GSTIN: 05AAACH7409R1ZZ · Audit Batch #EOD-20260924</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">DATE: 24 SEP 2026</div>
                  <div className="text-[11px] text-[#86868B]">SHIFT: 09:00 - 20:00</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[#86868B]">TOTAL FOOTFALL</div>
                  <div className="text-sm font-bold text-[#1D1D1F] dark:text-white">21 Consultations</div>
                </div>
                <div>
                  <div className="text-[#86868B]">AUDIT DISCREPANCIES</div>
                  <div className="text-sm font-bold text-emerald-600">0 (100% Soundbox Matched)</div>
                </div>
              </div>

              <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span>Soundbox UPI Webhook Verified:</span>
                  <span className="font-bold">₹{upiCollected.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Physical Cash in Drawer:</span>
                  <span className="font-bold">₹{cashCollected.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-black/[0.1] dark:border-white/[0.1] pt-2">
                  <span>GROSS CLINIC COLLECTIONS:</span>
                  <span className="text-emerald-600">₹{totalCollected.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 space-y-1 text-[11px] text-[#86868B]">
                <div className="flex justify-between">
                  <span>Dr. Rahul Sharma Payout (70%):</span>
                  <span>₹4,200</span>
                </div>
                <div className="flex justify-between">
                  <span>Dr. Aditi Joshi Payout (70%):</span>
                  <span>₹2,800</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                  <span>Clinic Retained Margin (30%):</span>
                  <span>₹2,535</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  showNotification("Printing CA-Ready Day Closing Report");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: BATCH WHATSAPP QUEUE REMINDERS                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showWhatsappModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 text-emerald-600">
                <Send className="h-5 w-5" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Send WhatsApp Queue Broadcast
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#86868B]">
                This will trigger instant WhatsApp live position updates to all 5 waiting patients:
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-mono text-[11px] space-y-1">
                <p><strong>Sample Message:</strong></p>
                <p>&quot;Namaste Rohit, your Token #13 at Dr. Rahul Sharma&apos;s chamber is 1 token away. Estimated entry: 11:15 AM. Live link: medic-sept-2026.vercel.app/p/TK-13&quot;</p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWhatsappModal(false);
                  showNotification("Dispatched 5 WhatsApp queue alerts to waiting patients!");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Send to 5 Patients Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: P&L & DOCTOR SPLIT MODAL                                          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showPnlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 text-purple-600">
                <TrendingUp className="h-5 w-5" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Today&apos;s Clinic P&amp;L Overview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPnlModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Gross OPD Revenue:</span>
                  <span className="font-mono text-emerald-600">₹{totalCollected.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>Doctor Payouts (Dr. Rahul + Dr. Aditi):</span>
                  <span className="font-mono text-rose-600">-₹5,200</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>Medical Consumables &amp; Sterilization:</span>
                  <span className="font-mono text-rose-600">-₹800</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>Reception &amp; Electricity Pro-rata:</span>
                  <span className="font-mono text-rose-600">-₹450</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-black/[0.08] dark:border-white/[0.08] pt-2">
                  <span>Net Retained Clinic Profit:</span>
                  <span className="font-mono text-emerald-600">
                    ₹{(totalCollected - 6450).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Link
                href="/dashboard/finance"
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
              >
                Full Finance Console →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 6: ADD WALK-IN PATIENT                                               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Add Walk-In Patient ({showAddPatientModal === "chamber-1" ? "Chamber 1" : "Chamber 2"})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPatientModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manas Verma"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Age</label>
                  <input
                    type="number"
                    required
                    placeholder="30"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-medium focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-medium focus:outline-blue-600"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Chief Complaint</label>
                <input
                  type="text"
                  placeholder="e.g. Rash on neck / Tooth pain"
                  value={newPatient.complaint}
                  onChange={(e) => setNewPatient({ ...newPatient, complaint: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">OPD Fee (₹)</label>
                  <input
                    type="number"
                    value={newPatient.fee}
                    onChange={(e) => setNewPatient({ ...newPatient, fee: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-medium focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1D1D1F] dark:text-white mb-1">Payment Mode</label>
                  <select
                    value={newPatient.paymentMode}
                    onChange={(e) => setNewPatient({ ...newPatient, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-medium focus:outline-blue-600"
                  >
                    <option value="UPI">Soundbox UPI (Immediate)</option>
                    <option value="Cash">Cash (Pending at Desk)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Issue Token &amp; Insert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 7: COLLECTIONS & PENDING BREAKDOWN                                    */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showCollectionsBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 text-emerald-600">
                <IndianRupee className="h-5 w-5" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  Live Counter Collections Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectionsBreakdown(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">Soundbox UPI Webhook Verified</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Direct settled to HDFC Bank A/c</div>
                </div>
                <div className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-200">
                  ₹{upiCollected.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex justify-between items-center">
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">Cash in Drawer (Locked)</div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-400">Reconciled at 9 PM shift closing</div>
                </div>
                <div className="font-mono font-black text-sm text-amber-800 dark:text-amber-200">
                  ₹{cashCollected.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
                <div>
                  <div className="font-bold text-rose-900 dark:text-rose-200">Pending / Uncollected OPD Fees</div>
                  <div className="text-[10px] text-rose-700 dark:text-rose-400">{openTokensCount} Patients with pending balance</div>
                </div>
                <div className="font-mono font-black text-sm text-rose-800 dark:text-rose-200">
                  ₹{chamber2Current.paymentStatus === "pending" ? "5,800" : "1,800"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCollectionsBreakdown(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 8: 9 PM DAILY DIGEST NOTIFICATION PREVIEW (RETENTION SECRET)          */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showDigestModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 text-emerald-600">
                <Send className="h-5 w-5" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  9 PM Automated WhatsApp Digest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDigestModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#86868B]">
                This is the automated evening message sent to Dr. Rahul &amp; Dr. Aditi every night at 9:00 PM. It reinforces daily time saved and zero cash leakage:
              </p>

              {/* WhatsApp message card preview */}
              <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-[#0B141A] border border-black/[0.05] dark:border-white/[0.05] text-[#111B21] dark:text-[#E9EDEF] space-y-2">
                <div className="bg-white dark:bg-[#202C33] p-3 rounded-xl shadow-xs space-y-1.5 font-sans">
                  <div className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    DocSphere ClinicOS Daily Digest 🩺
                  </div>
                  <p className="text-xs leading-relaxed">
                    &quot;Dr. Rahul, today you saw <strong>21 patients</strong>.<br />
                    💰 <strong>₹8,450 collected</strong> (₹6,650 UPI + ₹1,800 Cash).<br />
                    ✅ <strong>0 discrepancies</strong> on counter soundbox.<br />
                    ⏱️ Saved ~1.8 hours vs paper registers.<br />
                    Great day! Shift safely closed.&quot;
                  </p>
                  <div className="text-[10px] text-right text-slate-400 font-mono">
                    21:00 ✓✓
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDigestModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDigestModal(false);
                  showNotification("Test WhatsApp Digest dispatched to Dr. Rahul's phone (+91 91234 56780)");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>Test Send to Doctor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 9: RECONCILE CASH DRAWER (ZERO THEFT / 9 PM SHIFT LOCK)               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {showCashDrawerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.1] dark:border-white/[0.1] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2 text-amber-600">
                <Lock className="h-5 w-5" />
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white">
                  9 PM Cash Drawer Reconciliation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCashDrawerModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#86868B]">
                Physical cash in desk drawer must reconcile with tokens issued prior to closing the shift:
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between text-amber-900 dark:text-amber-200">
                  <span>₹500 Notes (3x):</span>
                  <span className="font-bold">₹1,500</span>
                </div>
                <div className="flex justify-between text-amber-900 dark:text-amber-200">
                  <span>₹200 Notes (1x):</span>
                  <span className="font-bold">₹200</span>
                </div>
                <div className="flex justify-between text-amber-900 dark:text-amber-200">
                  <span>₹100 Notes (1x):</span>
                  <span className="font-bold">₹100</span>
                </div>
                <div className="border-t border-amber-500/20 pt-2 flex justify-between font-bold text-xs">
                  <span>PHYSICAL CASH COUNT:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">₹{cashCollected.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-xs">
                  <span>EXPECTED SYSTEM CASH:</span>
                  <span>₹{cashCollected.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>DISCREPANCY / LEAKAGE:</span>
                  <span>₹0.00 (100% Balanced ✓)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCashDrawerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCashDrawerModal(false);
                  showNotification("Cash drawer safely locked at ₹1,800. Shift audit submitted.");
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Confirm &amp; Lock Drawer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
