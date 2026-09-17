"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  UserCheck, 
  Clock, 
  Volume2, 
  Plus, 
  CheckCircle2, 
  CreditCard, 
  Phone, 
  UserPlus, 
  QrCode, 
  Printer, 
  RotateCw, 
  Check, 
  IndianRupee,
  Sparkles,
  ExternalLink,
  Stethoscope
} from "lucide-react";

// Web Audio API chime generator
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
    osc2.frequency.setValueAtTime(880.00, now + 0.2);
    gain2.gain.setValueAtTime(0.3, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.error("Audio chime error:", err);
  }
}

export default function DashboardDeskPage() {
  const [queue, setQueue] = useState<any[]>([
    {
      appointment_number: "APT-DERMA-101",
      token_number: 1,
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      status: "completed",
      time_slot: "10:15 AM - 10:30 AM",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-102",
      token_number: 2,
      patient_name: "Priya Singh",
      patient_phone: "+919123456781",
      status: "in_consultation",
      time_slot: "10:30 AM - 10:45 AM",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-103",
      token_number: 3,
      patient_name: "Rohit Pant",
      patient_phone: "+919123456782",
      status: "waiting",
      time_slot: "10:45 AM - 11:00 AM",
      fee_amount: 600,
      payment_status: "pending",
      payment_mode: "cash",
      is_walk_in: false
    },
    {
      appointment_number: "APT-WALKIN-104",
      token_number: 4,
      patient_name: "Kavita Joshi",
      patient_phone: "+919876511111",
      status: "waiting",
      time_slot: "11:00 AM",
      fee_amount: 600,
      payment_status: "pending",
      payment_mode: "cash",
      is_walk_in: true
    }
  ]);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInFee, setWalkInFee] = useState(600);
  const [walkInPaymentMode, setWalkInPaymentMode] = useState<"cash" | "upi">("upi");
  const [calledTokenMsg, setCalledTokenMsg] = useState<string | null>(null);

  const activeInConsultation = queue.find(q => q.status === "in_consultation");
  const waitingPatients = queue.filter(q => q.status === "waiting");
  const completedPatients = queue.filter(q => q.status === "completed");

  const totalCollectedToday = queue
    .filter(q => q.payment_status === "paid")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  const upiCollected = queue
    .filter(q => q.payment_status === "paid" && q.payment_mode === "upi")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  const cashCollected = queue
    .filter(q => q.payment_status === "paid" && q.payment_mode === "cash")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  const handleCallToken = (tokenNumber: number, patientName: string) => {
    playTokenCallChime();
    setQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.status === "in_consultation") {
          return { ...item, status: "completed" };
        }
        if (item.token_number === tokenNumber) {
          return { ...item, status: "in_consultation" };
        }
        return item;
      })
    );

    setCalledTokenMsg(`Calling Token #${tokenNumber}: ${patientName}`);
    setTimeout(() => setCalledTokenMsg(null), 4000);
  };

  const handleTogglePayment = (tokenNumber: number) => {
    setQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.token_number === tokenNumber) {
          const nextStatus = item.payment_status === "paid" ? "pending" : "paid";
          return { ...item, payment_status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleAdmitWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;

    const nextTokenNum = Math.max(...queue.map(q => q.token_number), 0) + 1;
    const newAppointment = {
      appointment_number: `APT-WALKIN-${100 + nextTokenNum}`,
      token_number: nextTokenNum,
      patient_name: walkInName,
      patient_phone: walkInPhone,
      status: "waiting",
      time_slot: "Immediate Walk-In",
      fee_amount: walkInFee,
      payment_status: "paid",
      payment_mode: walkInPaymentMode,
      is_walk_in: true
    };

    setQueue([...queue, newAppointment]);
    setShowWalkInModal(false);
    setWalkInName("");
    setWalkInPhone("");

    setCalledTokenMsg(`Admitted Walk-In Token #${nextTokenNum} (${walkInName})`);
    setTimeout(() => setCalledTokenMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MODAL TRIGGERS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
            Reception Desk Counter Console PWA
          </h1>
          <p className="text-xs text-[#86868B] mt-0.5">
            Counter staff: Pooja Verma • Dr. Rahul Sharma OPD Roster
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
          >
            <QrCode className="h-4 w-4 text-apple-blue" />
            <span>Counter QR Stand</span>
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Admit Walk-In (10s)</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERT */}
      {calledTokenMsg && (
        <div className="rounded-full bg-[#1D1D1F] text-white px-5 py-3 text-xs font-medium shadow-apple-card flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-apple-teal animate-pulse" />
            <span>{calledTokenMsg}</span>
          </div>
          <span className="text-[#86868B] font-normal text-[11px]">Audio Chime Broadcasted</span>
        </div>
      )}

      {/* 2. RECONCILIATION & COUNTER METRICS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-teal dark:text-[#30D1BE] uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4" /> Active in Chamber
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            {activeInConsultation ? `Token #${activeInConsultation.token_number}` : "Chamber Idle"}
          </div>
          <p className="mt-1 text-xs text-[#86868B] truncate">
            {activeInConsultation ? activeInConsultation.patient_name : "Waiting for next patient"}
          </p>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-amber dark:text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Waiting in Lounge
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            {waitingPatients.length} Patients
          </div>
          <p className="mt-1 text-xs text-[#86868B]">
            Est. wait: {waitingPatients.length * 12} mins
          </p>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-teal dark:text-[#30D1BE] uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Soundbox UPI
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            ₹{upiCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-apple-teal dark:text-[#30D1BE] font-medium">
            Direct Bank Settlement
          </p>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4" /> Cash in Drawer
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            ₹{cashCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-[#86868B]">
            Total Gross: ₹{totalCollectedToday.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 3. COUNTER QUEUE TABLE */}
      <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-apple-card overflow-hidden">
        <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
            Counter Live Tokens ({queue.length})
          </span>
          <span className="text-xs text-[#86868B]">
            1-Click Call Bell plays dual-harmonic speaker tone
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F7]/80 dark:bg-[#2C2C2E]/60 border-b border-black/[0.04] dark:border-white/[0.06] text-[#86868B] font-medium">
              <tr>
                <th className="px-5 py-3.5">Token</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Fee & Reconciliation</th>
                <th className="px-5 py-3.5 text-right">Counter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {queue.map(item => (
                <tr key={item.token_number} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition">
                  <td className="px-5 py-4 font-bold font-mono text-base text-[#1D1D1F] dark:text-white">
                    #{item.token_number}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                      <span>{item.patient_name}</span>
                      {item.is_walk_in && (
                        <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-[#86868B]">
                          Walk-In
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#86868B] mt-0.5">{item.time_slot}</div>
                  </td>
                  <td className="px-5 py-4 text-[#86868B] font-mono">
                    {item.patient_phone}
                  </td>
                  <td className="px-5 py-4">
                    {item.status === "in_consultation" ? (
                      <span className="rounded-full bg-apple-teal/10 text-apple-teal dark:text-[#30D1BE] px-2.5 py-0.5 text-[11px] font-medium">
                        In Chamber
                      </span>
                    ) : item.status === "waiting" ? (
                      <span className="rounded-full bg-apple-amber/10 text-apple-amber dark:text-[#FF9F0A] px-2.5 py-0.5 text-[11px] font-medium">
                        Waiting
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-normal text-[#86868B]">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleTogglePayment(item.token_number)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition active:scale-95 ${
                        item.payment_status === "paid"
                          ? "bg-apple-teal/10 text-apple-teal hover:bg-apple-teal/20 dark:text-[#30D1BE]"
                          : "bg-apple-amber/10 text-apple-amber hover:bg-apple-amber/20 dark:text-[#FF9F0A]"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      ₹{item.fee_amount} ({item.payment_mode.toUpperCase()}) • {item.payment_status}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {item.status === "waiting" ? (
                      <button
                        onClick={() => handleCallToken(item.token_number, item.patient_name)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] px-3.5 py-1.5 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Call Token
                      </button>
                    ) : item.status === "in_consultation" ? (
                      <Link
                        href="/dashboard/consult/APT-DERMA-102"
                        className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                      >
                        <span>Open ℞ Studio</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[#86868B] font-medium">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WALK-IN MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 shadow-apple-modal">
            <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-apple-blue" />
              10-Second Walk-In Admission
            </h3>
            <p className="text-xs text-[#86868B] mt-1">
              Assigns the next available live token number immediately
            </p>

            <form onSubmit={handleAdmitWalkIn} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#1D1D1F] dark:text-white">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] dark:text-white">Mobile Number (WhatsApp Delivery)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 font-mono text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#1D1D1F] dark:text-white">Consultation Fee</label>
                  <input
                    type="number"
                    value={walkInFee}
                    onChange={e => setWalkInFee(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 font-mono text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#1D1D1F] dark:text-white">Payment Mode</label>
                  <select
                    value={walkInPaymentMode}
                    onChange={e => setWalkInPaymentMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  >
                    <option value="upi">UPI (PhonePe / Soundbox)</option>
                    <option value="cash">Counter Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 rounded-full border border-black/[0.1] dark:border-white/[0.12] py-2.5 font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-apple-blue py-2.5 font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
                >
                  Confirm & Admit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR STAND MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 text-center shadow-apple-modal">
            <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
              Counter Stand QR
            </h3>
            <p className="text-xs text-[#86868B] mt-1">
              Place at reception counter for 1-tap patient token self-check-in
            </p>
            <div className="mx-auto my-6 flex h-44 w-44 items-center justify-center rounded-[20px] bg-[#F5F5F7] p-3 border border-black/[0.04] dark:bg-[#2C2C2E] dark:border-white/[0.06]">
              <QrCode className="h-36 w-36 text-[#1D1D1F] dark:text-white" />
            </div>
            <div className="text-xs font-mono font-medium text-apple-blue">
              clinicos.in/book?doctor=dr-rahul-sharma
            </div>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-full bg-[#1D1D1F] dark:bg-white py-2.5 text-xs font-semibold text-white dark:text-[#1D1D1F] shadow-apple-sm active:scale-95 transition"
              >
                <Printer className="inline h-3.5 w-3.5 mr-1" /> Print Stand
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 rounded-full border border-black/[0.1] dark:border-white/[0.12] py-2.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
