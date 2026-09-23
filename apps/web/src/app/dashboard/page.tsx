"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Building2, 
  Stethoscope, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Users, 
  IndianRupee, 
  Sparkles,
  CheckCircle2,
  Volume2,
  RotateCw,
  UserX,
  Zap,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Wifi,
  WifiOff
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
    gain1.gain.setValueAtTime(0.3, now);
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
    gain2.gain.setValueAtTime(0.3, now + 0.18);
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
  // Liveness & Telemetry State
  const [secondsSinceSync, setSecondsSinceSync] = useState(2);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState("Just now");
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Chamber 1 Live Telemetry & Queue
  const [chamber1, setChamber1] = useState({
    id: "chamber-1",
    chamberName: "Chamber 1 • Dermatology",
    doctorName: "Dr. Rahul Sharma",
    qualification: "MD (Dermatology)",
    councilReg: "NMC Reg. UKMC-8942-2012",
    councilName: "Uttarakhand Medical Council",
    inRoomToken: 2,
    inRoomPatient: "Priya Singh",
    inRoomDiagnosis: "Allergic Contact Dermatitis",
    inRoomTimeMins: 8,
    nextToken: 3,
    nextPatient: "Rohit Pant",
    waitingCount: 5,
    waitingRange: "#3 – #7",
    estWaitMins: 18,
    consultationStudioUrl: "/dashboard/consult/APT-DERMA-102"
  });

  // Chamber 2 Live Telemetry & Queue
  const [chamber2, setChamber2] = useState({
    id: "chamber-2",
    chamberName: "Chamber 2 • Dental Care",
    doctorName: "Dr. Aditi Joshi",
    qualification: "MDS (Endodontics)",
    councilReg: "State Dental Council Reg. UDC-4120-2016",
    councilName: "Uttarakhand Dental Council",
    inRoomToken: 1,
    inRoomPatient: "Kavita Joshi",
    inRoomDiagnosis: "Deep Dentinal Caries (#36)",
    inRoomTimeMins: 14,
    nextToken: 2,
    nextPatient: "Suresh Rawat",
    waitingCount: 3,
    waitingRange: "#2 – #4",
    estWaitMins: 12,
    consultationStudioUrl: "/dashboard/chambers"
  });

  const [activeQueue, setActiveQueue] = useState<any[]>([
    {
      token: 1,
      patient_name: "Amit Rawat",
      phone: "+91 91234 56780",
      doctor: "Dr. Rahul Sharma (Chamber 1)",
      status: "completed",
      time: "10:15 AM",
      fee: 600,
      payment: "UPI Paid"
    },
    {
      token: 2,
      patient_name: "Priya Singh",
      phone: "+91 91234 56781",
      doctor: "Dr. Rahul Sharma (Chamber 1)",
      status: "in_consultation",
      time: "10:30 AM",
      fee: 600,
      payment: "UPI Paid"
    },
    {
      token: 3,
      patient_name: "Rohit Pant",
      phone: "+91 91234 56782",
      doctor: "Dr. Rahul Sharma (Chamber 1)",
      status: "waiting",
      time: "10:45 AM",
      fee: 600,
      payment: "Cash Pending"
    },
    {
      token: 4,
      patient_name: "Kavita Joshi",
      phone: "+91 98765 11111",
      doctor: "Dr. Aditi Joshi (Chamber 2)",
      status: "in_consultation",
      time: "11:00 AM",
      fee: 500,
      payment: "UPI Paid"
    },
    {
      token: 5,
      patient_name: "Suresh Rawat",
      phone: "+91 98765 22222",
      doctor: "Dr. Aditi Joshi (Chamber 2)",
      status: "waiting",
      time: "11:15 AM",
      fee: 500,
      payment: "Cash Pending"
    }
  ]);

  const [metrics, setMetrics] = useState({
    footfall: 14,
    waitingCount: 8,
    avgWaitMins: 15,
    grossCollections: 7800,
    upiCollections: 6000,
    cashCollections: 1800,
    marginPct: 61.4,
  });

  // 1. Seconds counter & connectivity listener
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceSync(prev => prev + 1);
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 2. Fetch live data
  const loadData = useCallback(async (manual = false) => {
    if (manual) setIsSyncing(true);
    try {
      const [deskRes, expRes] = await Promise.all([
        fetch("/api/clinic/desk-queue").then(r => r.ok ? r.json() : null),
        fetch("/api/expenses").then(r => r.ok ? r.json() : null),
      ]);

      if (deskRes?.queue && deskRes.queue.length > 0) {
        const mapped = deskRes.queue.map((q: any) => ({
          token: q.token_number,
          appointment_number: q.appointment_number,
          patient_name: q.patient_name,
          phone: q.patient_phone,
          doctor: `${q.doctor_name || "Dr. Rahul Sharma"} (Chamber 1)`,
          status: q.status,
          time: q.time_slot || "Live Queue",
          fee: q.fee_amount || 600,
          payment: q.payment_status === "paid" ? `${(q.payment_mode || "UPI").toUpperCase()} Paid` : "Cash Pending",
        }));
        setActiveQueue(mapped);

        const inConsult = deskRes.queue.find((q: any) => q.status === "in_consultation");
        if (inConsult) {
          setChamber1(prev => ({
            ...prev,
            inRoomToken: inConsult.token_number,
            inRoomPatient: inConsult.patient_name,
          }));
        }
      }

      if (expRes?.kpis) {
        setMetrics(prev => ({
          ...prev,
          grossCollections: expRes.kpis.gross_collections || prev.grossCollections,
          marginPct: expRes.kpis.profit_margin_pct || prev.marginPct,
        }));
      }

      setIsOnline(true);
      setSecondsSinceSync(0);
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      console.warn("Live fetch timeout or offline:", e);
      setIsOnline(false);
    } finally {
      if (manual) setIsSyncing(false);
    }
  }, []);

  // Periodic polling every 12 seconds
  useEffect(() => {
    loadData();
    const pollInterval = setInterval(() => {
      loadData();
    }, 12000);
    return () => clearInterval(pollInterval);
  }, [loadData]);

  // Operational Action 1: Call Next Token
  const handleCallNext = (chamberId: "chamber-1" | "chamber-2") => {
    playTokenCallChime();
    if (chamberId === "chamber-1") {
      const calledToken = chamber1.nextToken;
      const calledPatient = chamber1.nextPatient;
      const newNext = calledToken + 1;
      const newWait = Math.max(0, chamber1.waitingCount - 1);

      setChamber1(prev => ({
        ...prev,
        inRoomToken: calledToken,
        inRoomPatient: calledPatient,
        inRoomTimeMins: 1,
        nextToken: newNext,
        nextPatient: `Patient #${newNext}`,
        waitingCount: newWait,
        waitingRange: newWait > 0 ? `#${newNext} – #${newNext + newWait - 1}` : "Queue Cleared",
        estWaitMins: Math.max(0, prev.estWaitMins - 6)
      }));

      // Update table status
      setActiveQueue(prev => prev.map(p => {
        if (p.token === calledToken) return { ...p, status: "in_consultation" };
        if (p.token === chamber1.inRoomToken) return { ...p, status: "completed" };
        return p;
      }));

      setActionToast(`🔔 Called Token #${calledToken} (${calledPatient}) into Chamber 1`);
    } else {
      const calledToken = chamber2.nextToken;
      const calledPatient = chamber2.nextPatient;
      const newNext = calledToken + 1;
      const newWait = Math.max(0, chamber2.waitingCount - 1);

      setChamber2(prev => ({
        ...prev,
        inRoomToken: calledToken,
        inRoomPatient: calledPatient,
        inRoomTimeMins: 1,
        nextToken: newNext,
        nextPatient: `Patient #${newNext}`,
        waitingCount: newWait,
        waitingRange: newWait > 0 ? `#${newNext} – #${newNext + newWait - 1}` : "Queue Cleared",
        estWaitMins: Math.max(0, prev.estWaitMins - 5)
      }));

      setActiveQueue(prev => prev.map(p => {
        if (p.token === calledToken) return { ...p, status: "in_consultation" };
        if (p.token === chamber2.inRoomToken) return { ...p, status: "completed" };
        return p;
      }));

      setActionToast(`🔔 Called Token #${calledToken} (${calledPatient}) into Chamber 2`);
    }

    setTimeout(() => setActionToast(null), 4000);
  };

  // Operational Action 2: Recall Active Token (Re-rings acoustic bell)
  const handleRecall = (chamberId: "chamber-1" | "chamber-2") => {
    playTokenCallChime();
    const token = chamberId === "chamber-1" ? chamber1.inRoomToken : chamber2.inRoomToken;
    const name = chamberId === "chamber-1" ? chamber1.inRoomPatient : chamber2.inRoomPatient;
    const room = chamberId === "chamber-1" ? "Chamber 1" : "Chamber 2";

    setActionToast(`📢 Recalled Token #${token} (${name}) to ${room} with acoustic chime`);
    setTimeout(() => setActionToast(null), 4000);
  };

  // Operational Action 3: Mark No-Show / Absent
  const handleNoShow = (chamberId: "chamber-1" | "chamber-2") => {
    playTokenCallChime();
    if (chamberId === "chamber-1") {
      const skipped = chamber1.inRoomToken;
      const nextToken = chamber1.nextToken;
      const nextName = chamber1.nextPatient;

      setChamber1(prev => ({
        ...prev,
        inRoomToken: nextToken,
        inRoomPatient: nextName,
        nextToken: nextToken + 1,
        nextPatient: `Patient #${nextToken + 1}`,
        waitingCount: Math.max(0, prev.waitingCount - 1),
        waitingRange: prev.waitingCount > 1 ? `#${nextToken + 1} – #${nextToken + prev.waitingCount - 1}` : "Queue Cleared"
      }));

      setActionToast(`⚠️ Token #${skipped} marked No-Show. Advanced Chamber 1 to Token #${nextToken}.`);
    } else {
      const skipped = chamber2.inRoomToken;
      const nextToken = chamber2.nextToken;
      const nextName = chamber2.nextPatient;

      setChamber2(prev => ({
        ...prev,
        inRoomToken: nextToken,
        inRoomPatient: nextName,
        nextToken: nextToken + 1,
        nextPatient: `Patient #${nextToken + 1}`,
        waitingCount: Math.max(0, prev.waitingCount - 1),
        waitingRange: prev.waitingCount > 1 ? `#${nextToken + 1} – #${nextToken + prev.waitingCount - 1}` : "Queue Cleared"
      }));

      setActionToast(`⚠️ Token #${skipped} marked No-Show. Advanced Chamber 2 to Token #${nextToken}.`);
    }

    setTimeout(() => setActionToast(null), 4000);
  };

  // Operational Action 4: Emergency Priority Override
  const handleEmergencyPriority = (chamberId: "chamber-1" | "chamber-2") => {
    playTokenCallChime();
    const emgToken = 99;
    const emgName = "Emergency Walk-In";

    if (chamberId === "chamber-1") {
      setChamber1(prev => ({
        ...prev,
        nextToken: emgToken,
        nextPatient: "Emergency Triage Patient",
        waitingCount: prev.waitingCount + 1,
      }));
      setActionToast(`⚡ Emergency Override! Token #EMG inserted as next priority for Chamber 1.`);
    } else {
      setChamber2(prev => ({
        ...prev,
        nextToken: emgToken,
        nextPatient: "Emergency Triage Patient",
        waitingCount: prev.waitingCount + 1,
      }));
      setActionToast(`⚡ Emergency Override! Token #EMG inserted as next priority for Chamber 2.`);
    }

    setTimeout(() => setActionToast(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* NOTIFICATION TOAST */}
      {actionToast && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="text-slate-400 hover:text-white text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. TOP METRIC STATS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Footfall */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today&apos;s Footfall</span>
            <div className="rounded-[12px] bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            {metrics.footfall} <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">Patients</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#34C759] dark:text-[#30D158] font-semibold">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+18% vs last week</span>
          </div>
        </div>

        {/* Live Queue */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Waiting Queue</span>
            <div className="rounded-[12px] bg-[#FF9500]/10 p-2 text-[#FF9500] dark:text-[#FF9F0A]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#FF9500] dark:text-[#FF9F0A] font-mono tracking-tight">
            {chamber1.waitingCount + chamber2.waitingCount} <span className="text-xs font-normal text-[#86868B] dark:text-[#8E8E93]">Patients</span>
          </div>
          <div className="mt-2.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
            Across both chambers ({chamber1.waitingCount} Derm · {chamber2.waitingCount} Dental)
          </div>
        </div>

        {/* Gross Collections */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Collections</span>
            <div className="rounded-[12px] bg-[#34C759]/10 p-2 text-[#34C759] dark:text-[#30D158]">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono tracking-tight">
            ₹{metrics.grossCollections.toLocaleString("en-IN")}
          </div>
          <div className="mt-2.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
            ₹{metrics.upiCollections} UPI • ₹{metrics.cashCollections} Cash
          </div>
        </div>

        {/* Operating Margin */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] transition hover:shadow-apple-sm">
          <div className="flex items-center justify-between text-[#86868B] dark:text-[#8E8E93]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Operating Margin</span>
            <div className="rounded-[12px] bg-[#AF52DE]/10 p-2 text-[#AF52DE] dark:text-[#BF5AF2]">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#AF52DE] dark:text-[#BF5AF2] font-mono tracking-tight">
            {metrics.marginPct}%
          </div>
          <div className="mt-2.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
            Net In-hand after rent &amp; split
          </div>
        </div>
      </div>

      {/* 2. LIVE OPD CHAMBER FLOW BOARD (OPERATIONAL RECEPTION CONTROL HEADER) */}
      <div className="space-y-4">
        {/* HEADER BAR WITH TELEMETRY & LIVENESS INDICATOR */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-card">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                LIVE OPD FLOW
              </span>

              {/* Liveness Pulse Indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {isOnline ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Sync · Updated {secondsSinceSync}s ago</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                    <span className="text-amber-600 dark:text-amber-400">Offline · Last synced {lastSyncTime}</span>
                  </>
                )}
              </div>

              <span className="text-[11px] text-[#86868B] hidden md:inline">
                Acoustic Chime: Active
              </span>
            </div>
            <h2 className="text-lg font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Real-Time Consulting Chambers Command Board
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
              Operational queue telemetry, token caller, recall, and emergency bypass across both active chambers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-bold text-[#1D1D1F] dark:text-white transition active:scale-95"
              title="Refresh queue"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-blue-600" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
            <Link
              href="/dashboard/desk"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-xs font-bold text-white shadow-apple-sm transition active:scale-95"
            >
              <UserCheck className="h-4 w-4" />
              <span>Reception Desk</span>
            </Link>
          </div>
        </div>

        {/* TWO CHAMBER CARDS WITH CLEAR VISUAL HIERARCHY */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* CHAMBER 1: DERMATOLOGY */}
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 sm:p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
            {/* Visual Priority 1: Tokens First! */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">IN ROOM</span>
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    #{chamber1.inRoomToken}
                  </span>
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    {chamber1.inRoomPatient}
                  </span>
                </div>

                <div className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  <span className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Next Up</span>
                  <span className="font-bold font-mono text-[#1D1D1F] dark:text-white">#{chamber1.nextToken}</span> ({chamber1.nextPatient})
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  In Consultation ({chamber1.inRoomTimeMins}m)
                </span>
              </div>
            </div>

            {/* Queue Census & Wait Time Telemetry */}
            <div className="flex items-center justify-between text-xs py-2 px-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span>Waiting: <strong className="font-mono text-blue-600 dark:text-blue-400">{chamber1.waitingCount}</strong> ({chamber1.waitingRange})</span>
                <span className="text-[#86868B]">•</span>
                <span>Est. Wait: <strong className="font-mono text-amber-600 dark:text-amber-400">~{chamber1.estWaitMins} min</strong></span>
              </div>
              <span className="text-[11px] text-[#86868B] font-mono hidden sm:inline">
                {chamber1.inRoomDiagnosis}
              </span>
            </div>

            {/* Visual Priority 2 & 3: Doctor Name & Verified Credentials */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-teal-600 shrink-0" />
                  {chamber1.doctorName}
                  <span className="text-xs font-normal text-[#86868B]">· {chamber1.qualification}</span>
                </h3>
                <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{chamber1.councilReg}</span>
                  <span className="opacity-75">({chamber1.councilName})</span>
                </div>
              </div>

              <Link
                href={chamber1.consultationStudioUrl}
                className="text-[11px] font-bold text-[#0071E3] hover:underline flex items-center gap-1"
              >
                Chamber ℞ <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Operational Action Bar (Reception Control Panel) */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleCallNext("chamber-1")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                title="Call next waiting patient with audio bell"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Call Next
              </button>

              <button
                type="button"
                onClick={() => handleRecall("chamber-1")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-bold text-xs transition active:scale-95"
                title="Re-ring chime for current token in waiting hall"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Recall
              </button>

              <button
                type="button"
                onClick={() => handleNoShow("chamber-1")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] dark:text-white font-semibold text-xs transition active:scale-95"
                title="Mark absent and advance queue"
              >
                <UserX className="h-3.5 w-3.5 text-red-500" />
                No-Show
              </button>

              <button
                type="button"
                onClick={() => handleEmergencyPriority("chamber-1")}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 font-bold text-xs transition active:scale-95"
                title="Emergency walk-in priority override"
              >
                <Zap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                Priority
              </button>
            </div>
          </div>

          {/* CHAMBER 2: DENTAL CARE */}
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 sm:p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
            {/* Visual Priority 1: Tokens First! */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300">IN ROOM</span>
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    #{chamber2.inRoomToken}
                  </span>
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    {chamber2.inRoomPatient}
                  </span>
                </div>

                <div className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                  <span className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Next Up</span>
                  <span className="font-bold font-mono text-[#1D1D1F] dark:text-white">#{chamber2.nextToken}</span> ({chamber2.nextPatient})
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  In Consultation ({chamber2.inRoomTimeMins}m)
                </span>
              </div>
            </div>

            {/* Queue Census & Wait Time Telemetry */}
            <div className="flex items-center justify-between text-xs py-2 px-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span>Waiting: <strong className="font-mono text-blue-600 dark:text-blue-400">{chamber2.waitingCount}</strong> ({chamber2.waitingRange})</span>
                <span className="text-[#86868B]">•</span>
                <span>Est. Wait: <strong className="font-mono text-amber-600 dark:text-amber-400">~{chamber2.estWaitMins} min</strong></span>
              </div>
              <span className="text-[11px] text-[#86868B] font-mono hidden sm:inline">
                {chamber2.inRoomDiagnosis}
              </span>
            </div>

            {/* Visual Priority 2 & 3: Doctor Name & Verified Credentials */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <span className="text-base">🦷</span>
                  {chamber2.doctorName}
                  <span className="text-xs font-normal text-[#86868B]">· {chamber2.qualification}</span>
                </h3>
                <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{chamber2.councilReg}</span>
                  <span className="opacity-75">({chamber2.councilName})</span>
                </div>
              </div>

              <Link
                href={chamber2.consultationStudioUrl}
                className="text-[11px] font-bold text-[#00A389] hover:underline flex items-center gap-1"
              >
                Dental Chamber <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {/* Operational Action Bar (Reception Control Panel) */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => handleCallNext("chamber-2")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
                title="Call next waiting patient with audio bell"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Call Next
              </button>

              <button
                type="button"
                onClick={() => handleRecall("chamber-2")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 font-bold text-xs transition active:scale-95"
                title="Re-ring chime for current token in waiting hall"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Recall
              </button>

              <button
                type="button"
                onClick={() => handleNoShow("chamber-2")}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] dark:text-white font-semibold text-xs transition active:scale-95"
                title="Mark absent and advance queue"
              >
                <UserX className="h-3.5 w-3.5 text-red-500" />
                No-Show
              </button>

              <button
                type="button"
                onClick={() => handleEmergencyPriority("chamber-2")}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 font-bold text-xs transition active:scale-95"
                title="Emergency walk-in priority override"
              >
                <Zap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                Priority
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIVE PATIENT OPD QUEUE TABLE (APPLE GROUPED LIST) */}
      <div className="rounded-[24px] border border-black/[0.06] bg-white shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] overflow-hidden">
        <div className="p-5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F] dark:text-white tracking-tight">Today&apos;s Active OPD Roster</h2>
            <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">Individual patient arrivals, token status, and consultation billing</p>
          </div>
          <Link
            href="/dashboard/desk"
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.12] dark:bg-[#2C2C2E] dark:text-white"
          >
            <UserCheck className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            Launch Full Desk Console
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECEEF2]/60 border-b border-black/[0.05] text-[#86868B] dark:bg-[#2C2C2E]/60 dark:border-white/[0.06] dark:text-[#8E8E93]">
              <tr>
                <th className="px-6 py-3 font-semibold">Token</th>
                <th className="px-6 py-3 font-semibold">Patient Name</th>
                <th className="px-6 py-3 font-semibold">Assigned Chamber</th>
                <th className="px-6 py-3 font-semibold">Arrival Time</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Payment</th>
                <th className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">
              {activeQueue.map((pt) => (
                <tr key={pt.token} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition">
                  <td className="px-6 py-3.5 font-bold font-mono text-[#1D1D1F] dark:text-white">
                    #{pt.token}
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-[#1D1D1F] dark:text-white">{pt.patient_name}</div>
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">{pt.phone}</div>
                  </td>
                  <td className="px-6 py-3.5 text-[#86868B] dark:text-[#8E8E93]">
                    {pt.doctor}
                  </td>
                  <td className="px-6 py-3.5 text-[#86868B] dark:text-[#8E8E93] font-mono text-[11px]">
                    {pt.time}
                  </td>
                  <td className="px-6 py-3.5">
                    {pt.status === "in_consultation" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#30D158]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#34C759] dark:text-[#30D158]">
                        In Chamber
                      </span>
                    ) : pt.status === "waiting" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF9500]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#FF9500] dark:text-[#FF9F0A]">
                        Waiting in OPD
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[11px] font-semibold text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-block font-semibold text-[11px] ${
                      pt.payment.includes("Paid") ? "text-[#34C759] dark:text-[#30D158]" : "text-[#FF9500] dark:text-[#FF9F0A]"
                    }`}>
                      ₹{pt.fee} • {pt.payment}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link
                      href={pt.status === "in_consultation" ? `/dashboard/consult/${pt.appointment_number || `APT-${pt.token}`}` : `/dashboard/chambers`}
                      className="inline-flex items-center gap-1 rounded-full bg-black/[0.04] px-3 py-1 text-[11px] font-semibold text-[#1D1D1F] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.14] transition cursor-pointer"
                    >
                      {pt.status === "in_consultation" ? "Open ℞ Pad" : "Call Next"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
