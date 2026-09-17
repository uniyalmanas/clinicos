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
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Reception Desk Counter Console PWA
          </h1>
          <p className="text-xs text-slate-500">
            Counter staff: Pooja Verma • Dr. Rahul Sharma OPD Roster
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <QrCode className="h-4 w-4 text-brand-600" />
            <span>Counter QR Stand</span>
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Admit Walk-In (10s)</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERT */}
      {calledTokenMsg && (
        <div className="rounded-2xl bg-slate-900 p-4 text-xs font-bold text-white shadow-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-400 animate-bounce" />
            <span>{calledTokenMsg}</span>
          </div>
          <span className="text-slate-400 font-normal text-[11px]">Audio Chime Broadcasted</span>
        </div>
      )}

      {/* 2. RECONCILIATION & COUNTER METRICS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-950 dark:bg-slate-900">
          <div className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4" /> Active in Chamber
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {activeInConsultation ? `Token #${activeInConsultation.token_number}` : "Chamber Idle"}
          </div>
          <p className="mt-1 text-xs text-slate-500 truncate">
            {activeInConsultation ? activeInConsultation.patient_name : "Waiting for next patient"}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-950 dark:bg-slate-900">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Waiting in Lounge
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {waitingPatients.length} Patients
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Est. wait: {waitingPatients.length * 12} mins
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-950 dark:bg-slate-900">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Soundbox UPI
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ₹{upiCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-semibold">
            Direct Bank Settlement
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="h-4 w-4" /> Cash in Drawer
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ₹{cashCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Total Gross: ₹{totalCollectedToday.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 3. COUNTER QUEUE TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Counter Live Tokens ({queue.length})
          </span>
          <span className="text-xs text-slate-500">
            1-Click Call Bell plays dual-harmonic speaker tone
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Token</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Fee & Reconciliation</th>
                <th className="px-5 py-3 font-semibold text-right">Counter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {queue.map(item => (
                <tr key={item.token_number} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-5 py-3.5 font-bold font-mono text-base text-slate-900 dark:text-white">
                    #{item.token_number}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{item.patient_name}</span>
                      {item.is_walk_in && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Walk-In
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.time_slot}</div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-mono">
                    {item.patient_phone}
                  </td>
                  <td className="px-5 py-3.5">
                    {item.status === "in_consultation" ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        In Chamber
                      </span>
                    ) : item.status === "waiting" ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Waiting
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => handleTogglePayment(item.token_number)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        item.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      ₹{item.fee_amount} ({item.payment_mode.toUpperCase()}) • {item.payment_status}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {item.status === "waiting" ? (
                      <button
                        onClick={() => handleCallToken(item.token_number, item.patient_name)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Call Token
                      </button>
                    ) : item.status === "in_consultation" ? (
                      <Link
                        href="/dashboard/consult/APT-DERMA-102"
                        className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950 dark:text-brand-300"
                      >
                        <span>Open ℞ Studio</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Done</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-600" />
              10-Second Walk-In Admission
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Assigns the next available live token number immediately
            </p>

            <form onSubmit={handleAdmitWalkIn} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mobile Number (WhatsApp Delivery)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Consultation Fee</label>
                  <input
                    type="number"
                    value={walkInFee}
                    onChange={e => setWalkInFee(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Payment Mode</label>
                  <select
                    value={walkInPaymentMode}
                    onChange={e => setWalkInPaymentMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="upi">UPI (PhonePe / Soundbox)</option>
                    <option value="cash">Counter Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-600 py-2.5 font-bold text-white shadow-sm hover:bg-brand-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Counter Stand QR
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Place at reception counter for 1-tap patient token self-check-in
            </p>
            <div className="mx-auto my-6 flex h-44 w-44 items-center justify-center rounded-2xl bg-slate-100 p-3 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <QrCode className="h-36 w-36 text-slate-900 dark:text-white" />
            </div>
            <div className="text-xs font-mono font-bold text-brand-600">
              clinicos.in/book?doctor=dr-rahul-sharma
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-slate-900 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900"
              >
                <Printer className="inline h-3.5 w-3.5 mr-1" /> Print Stand
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
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
