"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
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
  ArrowLeft,
  Sparkles,
  Tv,
  Receipt
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

export default function ReceptionDeskPage() {
  const [queue, setQueue] = useState<any[]>([
    {
      appointment_number: "APT-DERMA-101",
      token_number: 1,
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      time_slot: "10:15 AM",
      status: "completed",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi"
    },
    {
      appointment_number: "APT-DERMA-102",
      token_number: 2,
      patient_name: "Priya Singh",
      patient_phone: "+919123456781",
      time_slot: "10:30 AM",
      status: "in_consultation",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "cash"
    },
    {
      appointment_number: "APT-DERMA-103",
      token_number: 3,
      patient_name: "Rohit Pant",
      patient_phone: "+919123456782",
      time_slot: "10:45 AM",
      status: "in_waiting",
      fee_amount: 600,
      payment_status: "pending",
      payment_mode: "upi"
    }
  ]);

  const [activeToken, setActiveToken] = useState<number>(2);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Walk-in form state
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("+91");
  const [newPaymentMode, setNewPaymentMode] = useState<"cash" | "upi">("upi");
  const [newFee, setNewFee] = useState(600);

  // Calculate totals
  const totalTokens = queue.length;
  const waitingCount = queue.filter(q => q.status === "in_waiting").length;
  const cashCollected = queue.filter(q => q.payment_status === "paid" && q.payment_mode === "cash").reduce((acc, q) => acc + q.fee_amount, 0);
  const upiCollected = queue.filter(q => q.payment_status === "paid" && q.payment_mode === "upi").reduce((acc, q) => acc + q.fee_amount, 0);

  // Call Next Token Action
  const handleCallToken = (aptNumber: string, tokenNum: number) => {
    playTokenCallChime();
    setActiveToken(tokenNum);
    setQueue(prev => prev.map(item => {
      if (item.appointment_number === aptNumber) {
        return { ...item, status: "in_consultation" };
      }
      if (item.status === "in_consultation") {
        return { ...item, status: "completed" };
      }
      return item;
    }));

    // Trigger API call in background
    fetch("http://localhost:8000/api/v1/clinic/call-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointment_number: aptNumber })
    }).catch(() => {});
  };

  // Complete Token Action
  const handleCompleteToken = (aptNumber: string) => {
    setQueue(prev => prev.map(item => {
      if (item.appointment_number === aptNumber) {
        return { ...item, status: "completed" };
      }
      return item;
    }));
  };

  // Toggle Payment Mode/Status
  const handleTogglePayment = (aptNumber: string, mode: "cash" | "upi") => {
    setQueue(prev => prev.map(item => {
      if (item.appointment_number === aptNumber) {
        return { ...item, payment_status: "paid", payment_mode: mode };
      }
      return item;
    }));
  };

  // Submit Walk-in
  const handleAddWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || newPatientPhone.length < 10) {
      alert("Please enter patient name and 10-digit phone number.");
      return;
    }

    const assignedToken = queue.length + 1;
    const newApt = {
      appointment_number: `APT-WALKIN-${100 + assignedToken}`,
      token_number: assignedToken,
      patient_name: newPatientName,
      patient_phone: newPatientPhone,
      time_slot: `Walk-In Token #${assignedToken}`,
      status: "in_waiting",
      fee_amount: newFee,
      payment_status: "paid",
      payment_mode: newPaymentMode
    };

    setQueue([...queue, newApt]);
    setNewPatientName("");
    setNewPatientPhone("+91");
    setShowWalkInModal(false);

    // Call API
    fetch("http://localhost:8000/api/v1/clinic/walk-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_name: newApt.patient_name,
        patient_phone: newApt.patient_phone,
        payment_mode: newApt.payment_mode,
        fee_amount: newApt.fee_amount
      })
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* 1. TOP COUNTER BAR */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  Derma Care Skin & Laser
                </h1>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  Counter Desk PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Staff: Pooja Verma • Dr. Rahul Sharma OPD Roster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/display/waiting-room"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800/40 dark:bg-indigo-950/60 dark:text-indigo-300 transition active:scale-95"
              title="Launch Smart TV Waiting Room Wall Display"
            >
              <Tv className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>📺 Waiting Room TV</span>
            </Link>

            <Link
              href="/clinic/settlement"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/60 dark:text-emerald-300 transition active:scale-95"
              title="Close shift and balance cash drawer"
            >
              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>💵 Settle Shift</span>
            </Link>

            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <QrCode className="h-4 w-4 text-brand-600" /> Counter QR Stand
            </button>

            <button
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" /> Admit Walk-In (10s)
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN COUNTER OPERATING CONSOLE */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active In Chamber */}
          <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-950 dark:bg-slate-900">
            <div className="text-xs font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" /> Active in Chamber
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 dark:text-white">
                #{activeToken}
              </span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Inside
              </span>
            </div>
          </div>

          {/* Card 2: Waiting in Lobby */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-500" /> Waiting in Lobby
            </div>
            <div className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
              {waitingCount}
            </div>
          </div>

          {/* Card 3: Total Tokens Today */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today&apos;s Total Tokens
            </div>
            <div className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
              {totalTokens}
            </div>
          </div>

          {/* Card 4: Shift Collections */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm dark:border-emerald-950 dark:bg-emerald-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Shift Cash & UPI
                </div>
                <Link
                  href="/clinic/settlement"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                >
                  Settle ➔
                </Link>
              </div>
              <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{cashCollected + upiCollected}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40">
              <span>UPI: ₹{upiCollected}</span>
              <span>Cash: ₹{cashCollected}</span>
            </div>
          </div>
        </div>

        {/* Token Queue Management Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Live Counter Token Queue
              </h2>
              <p className="text-xs text-slate-500">
                Click &quot;Call Token&quot; to ring the counter chime and summon patient into consultation chamber.
              </p>
            </div>
            <button
              onClick={() => playTokenCallChime()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              <Volume2 className="h-4 w-4 text-brand-600" /> Test Audio Chime
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Token #</th>
                  <th className="py-3.5 px-4">Patient Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Slot</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Fee & Soundbox</th>
                  <th className="py-3.5 px-4 text-right">Counter Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {queue.map((item) => (
                  <tr
                    key={item.appointment_number}
                    className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/30 ${
                      item.status === "in_consultation" ? "bg-teal-50/40 dark:bg-teal-950/20" : ""
                    }`}
                  >
                    {/* Token Number */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white dark:bg-brand-600">
                        #{item.token_number}
                      </span>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {item.patient_name}
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {item.patient_phone}
                    </td>

                    {/* Time Slot */}
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.time_slot}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {item.status === "in_consultation" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-600 animate-pulse"></span>
                          In Chamber
                        </span>
                      ) : item.status === "completed" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <Check className="h-3 w-3" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <Clock className="h-3 w-3" /> In Waiting
                        </span>
                      )}
                    </td>

                    {/* Payment Mode & Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">₹{item.fee_amount}</span>
                        {item.payment_status === "paid" ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            ✓ Paid ({item.payment_mode?.toUpperCase()})
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTogglePayment(item.appointment_number, "upi")}
                              className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              +UPI
                            </button>
                            <button
                              onClick={() => handleTogglePayment(item.appointment_number, "cash")}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-200"
                            >
                              +Cash
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Counter Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "in_waiting" ? (
                        <button
                          onClick={() => handleCallToken(item.appointment_number, item.token_number)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                        >
                          <Volume2 className="h-3.5 w-3.5" /> Call Token
                        </button>
                      ) : item.status === "in_consultation" ? (
                        <button
                          onClick={() => handleCompleteToken(item.appointment_number)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Mark Done
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Checked Out</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 3. WALK-IN ADMISSION MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-600" /> Walk-In Patient Admission
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Issues the next sequential token and logs counter fee collection.
            </p>

            <form onSubmit={handleAddWalkIn} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  placeholder="e.g. Kavita Joshi"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment Mode
                  </label>
                  <select
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="upi">Soundbox UPI</option>
                    <option value="cash">Counter Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Consultation Fee
                  </label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-brand-700"
                >
                  Admit & Issue Token #{queue.length + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. PRINTABLE COUNTER TENT CARD MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reception Counter QR Stand
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Display at the front desk for walk-in patient self-token admission.
            </p>

            <div className="mt-5 mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-brand-500 bg-slate-50 p-4 dark:bg-slate-950">
              <QrCode className="h-36 w-36 text-slate-900 dark:text-white" />
            </div>

            <div className="mt-4 text-xs font-bold text-slate-900 dark:text-white">
              Scan to Join Live Queue & Receive WhatsApp Token
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              clinicos.in/book?doctor=dr-rahul-sharma
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                <Printer className="h-4 w-4" /> Print Acrylic Tent Card
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
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
