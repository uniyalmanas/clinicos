"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Send,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  ShieldCheck,
  FileText,
  Plus,
  Trash2,
  RotateCw,
  Coins,
  Receipt,
  Check,
  Share2,
  Info,
  ChevronRight,
  TrendingDown
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface PettyExpense {
  id: string;
  label: string;
  amount: number;
}

interface SettlementItem {
  id: string;
  settlement_number: string;
  shift_name: string;
  shift_date: string;
  staff_name: string;
  doctor_name: string;
  total_patients: number;
  gross_collections: number;
  upi_amount: number;
  cash_expected: number;
  petty_cash_expenses: number;
  petty_cash_remarks: string;
  net_cash_expected: number;
  actual_cash_counted: number;
  discrepancy: number;
  status: "balanced" | "shortage" | "surplus";
  denominations: Record<string, number>;
  notes: string;
  created_at: string;
}

const DENOMINATION_VALUES = [500, 200, 100, 50, 20, 10];

export default function ShiftSettlementPage() {
  // Shift Metadata
  const [shiftName, setShiftName] = useState("Evening Shift (05:00 PM - 08:30 PM)");
  const [staffName, setStaffName] = useState("Pooja Verma");
  const [doctorName, setDoctorName] = useState("Dr. Rahul Sharma");
  const [doctorPhone, setDoctorPhone] = useState("+919876543210");
  const [clinicName] = useState("Derma Care Skin & Laser Centre");

  // System Tallied Collections (Defaults from current active roster)
  const [totalPatients, setTotalPatients] = useState<number>(42);
  const [grossCollections, setGrossCollections] = useState<number>(25200);
  const [upiAmount, setUpiAmount] = useState<number>(16200);
  const [cashExpected, setCashExpected] = useState<number>(9000);

  // Petty Cash Expenses deducted from drawer
  const [pettyExpenses, setPettyExpenses] = useState<PettyExpense[]>([
    { id: "exp-1", label: "Speed Post for Biopsy Lab Sample", amount: 150 },
    { id: "exp-2", label: "20L RO Drinking Water Jar Restock", amount: 200 },
    { id: "exp-3", label: "Staff Tea & Coffee Supplies", amount: 50 }
  ]);
  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | "">("");

  // Physical Cash Denominations count
  const [counts, setCounts] = useState<Record<number, number>>({
    500: 15,
    200: 4,
    100: 3,
    50: 0,
    20: 0,
    10: 0
  });

  // Notes & Submission states
  const [handoverNotes, setHandoverNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSettlement, setCompletedSettlement] = useState<SettlementItem | null>(null);
  const [pastSettlements, setPastSettlements] = useState<SettlementItem[]>([]);

  // Load current desk data
  useEffect(() => {
    async function loadDeskData() {
      try {
        const res = await fetch(`/api/clinic/desk-queue`);
        if (res.ok) {
          const json = await res.json();
          if (json.collections) {
            const upi = Number(json.collections.upi) || 0;
            const cash = Number(json.collections.cash) || 0;
            const pts = Number(json.total_tokens_today) || 0;
            setUpiAmount(upi);
            setCashExpected(cash);
            setGrossCollections(upi + cash);
            setTotalPatients(pts);
          }
        }
      } catch (e) {
        // Fallback default states remain
      }

      try {
        const stlRes = await fetch(`/api/clinic/settlements`);
        if (stlRes.ok) {
          const stlJson = await stlRes.json();
          if (stlJson.settlements) {
            setPastSettlements(stlJson.settlements);
          }
        }
      } catch (e) {
        // Ignored
      }
    }
    loadDeskData();
  }, []);

  // Total Petty Cash spent from drawer
  const totalPettyCash = useMemo(() => {
    return pettyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [pettyExpenses]);

  // Net Cash Expected to hand over
  const netCashExpected = useMemo(() => {
    return Math.max(0, cashExpected - totalPettyCash);
  }, [cashExpected, totalPettyCash]);

  // Total Actual Physical Cash Counted
  const actualCashCounted = useMemo(() => {
    return DENOMINATION_VALUES.reduce((sum, denom) => {
      const qty = counts[denom] || 0;
      return sum + denom * qty;
    }, 0);
  }, [counts]);

  // Discrepancy: Actual - Expected
  const discrepancy = useMemo(() => {
    return actualCashCounted - netCashExpected;
  }, [actualCashCounted, netCashExpected]);

  const updateCount = (denom: number, val: number) => {
    setCounts(prev => ({
      ...prev,
      [denom]: Math.max(0, val)
    }));
  };

  const addPettyExpense = () => {
    if (!newExpenseLabel.trim() || !newExpenseAmount || Number(newExpenseAmount) <= 0) return;
    setPettyExpenses([
      ...pettyExpenses,
      {
        id: `exp-${Date.now()}`,
        label: newExpenseLabel.trim(),
        amount: Number(newExpenseAmount)
      }
    ]);
    setNewExpenseLabel("");
    setNewExpenseAmount("");
  };

  const removePettyExpense = (id: string) => {
    setPettyExpenses(pettyExpenses.filter(e => e.id !== id));
  };

  // 1-Click Fast Auto-Balance (Presets counts to exact expected cash)
  const autoFillExactCash = () => {
    let target = netCashExpected;
    const newCounts: Record<number, number> = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0 };

    for (const d of DENOMINATION_VALUES) {
      if (target >= d) {
        const qty = Math.floor(target / d);
        newCounts[d] = qty;
        target -= qty * d;
      }
    }
    setCounts(newCounts);
  };

  // Submit Settlement
  const handleSubmitSettlement = async () => {
    setIsSubmitting(true);
    const denomStrings: Record<string, number> = {};
    Object.entries(counts).forEach(([k, v]) => {
      denomStrings[k] = v;
    });

    const payload = {
      clinic_slug: "derma-care-dehradun",
      shift_name: shiftName,
      staff_name: staffName,
      doctor_name: doctorName,
      total_patients: totalPatients,
      gross_collections: grossCollections,
      upi_amount: upiAmount,
      cash_expected: cashExpected,
      petty_cash_expenses: totalPettyCash,
      petty_cash_remarks: pettyExpenses.map(p => `${p.label} (₹${p.amount})`).join(", "),
      net_cash_expected: netCashExpected,
      actual_cash_counted: actualCashCounted,
      discrepancy: discrepancy,
      denominations: denomStrings,
      notes: handoverNotes
    };

    try {
      const res = await fetch(`/api/clinic/settle-shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        setCompletedSettlement(json.settlement);
        setPastSettlements(prev => [json.settlement, ...prev]);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Settlement Error: ${errJson.detail || errJson.error || "Database failed to record shift settlement."}`);
      }
    } catch (e: any) {
      alert(`Network Error: ${e.message || "Failed to connect to clinic ledger server."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const runFallbackSettlement = (payload: any) => {
    const fallback: SettlementItem = {
      id: `stl-local-${Date.now()}`,
      settlement_number: `STL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-E`,
      shift_name: payload.shift_name,
      shift_date: new Date().toISOString().split("T")[0],
      staff_name: payload.staff_name,
      doctor_name: payload.doctor_name,
      total_patients: payload.total_patients,
      gross_collections: payload.gross_collections,
      upi_amount: payload.upi_amount,
      cash_expected: payload.cash_expected,
      petty_cash_expenses: payload.petty_cash_expenses,
      petty_cash_remarks: payload.petty_cash_remarks,
      net_cash_expected: payload.net_cash_expected,
      actual_cash_counted: payload.actual_cash_counted,
      discrepancy: payload.discrepancy,
      status: Math.abs(payload.discrepancy) < 1 ? "balanced" : payload.discrepancy < 0 ? "shortage" : "surplus",
      denominations: payload.denominations,
      notes: payload.notes,
      created_at: new Date().toISOString()
    };
    setCompletedSettlement(fallback);
    setPastSettlements(prev => [fallback, ...prev]);
  };

  // WhatsApp formatted report
  const waShareMessage = useMemo(() => {
    const stl = completedSettlement || {
      settlement_number: "STL-TODAY",
      shift_name: shiftName,
      staff_name: staffName,
      doctor_name: doctorName,
      total_patients: totalPatients,
      gross_collections: grossCollections,
      upi_amount: upiAmount,
      cash_expected: cashExpected,
      petty_cash_expenses: totalPettyCash,
      net_cash_expected: netCashExpected,
      actual_cash_counted: actualCashCounted,
      discrepancy: discrepancy,
      status: Math.abs(discrepancy) < 1 ? "balanced" : discrepancy < 0 ? "shortage" : "surplus"
    };

    const statusIcon = stl.status === "balanced" ? "Exact Match ✅" : stl.status === "shortage" ? `Shortage of ₹${Math.abs(stl.discrepancy)} ⚠️` : `Excess of ₹${stl.discrepancy} ℹ️`;

    return (
      `🏥 *Shift Cash Drawer Settlement — ${clinicName}*\n` +
      `📅 *Date:* ${new Date().toLocaleDateString("en-IN")} | *Shift:* ${stl.shift_name}\n` +
      `👨‍⚕️ *Doctor:* ${stl.doctor_name} | 👩‍💼 *Staff:* ${stl.staff_name}\n\n` +
      `👥 *Patients Consulted:* ${stl.total_patients}\n` +
      `💰 *Gross Collections:* ₹${stl.gross_collections.toLocaleString("en-IN")}\n` +
      `   • Direct UPI / QR Soundbox: ₹${stl.upi_amount.toLocaleString("en-IN")}\n` +
      `   • Gross Cash Collected: ₹${stl.cash_expected.toLocaleString("en-IN")}\n\n` +
      `📉 *Petty Cash Deductions:* ₹${stl.petty_cash_expenses.toLocaleString("en-IN")}\n` +
      `💵 *Net Cash Handed Over:* ₹${stl.actual_cash_counted.toLocaleString("en-IN")}\n` +
      `⚖️ *Discrepancy:* ${statusIcon}\n\n` +
      `🪙 *Denominations:* ${Object.entries(counts).filter(([_, qty]) => qty > 0).map(([d, qty]) => `${qty}x₹${d}`).join(", ") || "None"}\n` +
      `🔒 *DocSphere Verified Settlement Slip*`
    );
  }, [completedSettlement, shiftName, staffName, doctorName, clinicName, totalPatients, grossCollections, upiAmount, cashExpected, totalPettyCash, netCashExpected, actualCashCounted, discrepancy, counts]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans selection:bg-apple-blue selection:text-white">
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]/80 print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/clinic/desk"
              className="inline-flex items-center gap-1.5 rounded-full p-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold">Back to Front Desk</span>
            </Link>
            <div className="h-4 w-px bg-black/[0.1] dark:bg-white/[0.1] hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm font-bold text-[#1D1D1F] dark:text-white">{clinicName}</span>
              <span className="rounded-full bg-apple-blue/10 text-apple-blue text-[10px] font-bold px-2 py-0.5">
                Front Desk Cash Desk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <span className="font-bold text-[#1D1D1F] dark:text-white">Staff: {staffName}</span>
              <div className="text-[10px] text-[#86868B]">Daily Shift Reconciliation</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN SETTLEMENT CONSOLE */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 space-y-8">
        
        {/* COMPLETED SUCCESS BANNER / SLIP */}
        {completedSettlement ? (
          <div className="space-y-6">
            {/* Top Action Ribbon */}
            <div className="rounded-[24px] bg-emerald-500/10 border border-emerald-500/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm print:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-300">
                    Shift Closed &amp; Cash Drawer Reconciled!
                  </h2>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400">
                    Settlement Voucher #{completedSettlement.settlement_number} recorded in clinic finance ledger.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] px-4 py-2 text-xs font-bold shadow-apple-sm hover:opacity-90 active:scale-95 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Handover Slip
                </button>
                <a
                  href={`https://wa.me/${doctorPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waShareMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-apple-sm active:scale-95 transition"
                >
                  <Send className="h-3.5 w-3.5" /> Send WhatsApp to Doctor
                </a>
                <button
                  onClick={() => setCompletedSettlement(null)}
                  className="rounded-full border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition"
                >
                  New Settlement
                </button>
              </div>
            </div>

            {/* PRINTABLE HANDOVER SLIP (Thermal / A4 Half-Sheet Receipt) */}
            <div className="mx-auto max-w-2xl rounded-[32px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-8 sm:p-10 shadow-apple-card print:border-none print:shadow-none print:p-0">
              {/* Slip Header */}
              <div className="text-center border-b-2 border-black dark:border-white pb-4 space-y-1">
                <h3 className="text-xl font-black text-[#1D1D1F] dark:text-white uppercase tracking-tight">
                  {clinicName}
                </h3>
                <div className="text-xs font-bold text-apple-blue uppercase tracking-wider">
                  Front Desk Cash Drawer Handover Voucher
                </div>
                <div className="text-[11px] text-[#86868B]">
                  Shift Voucher: <strong className="font-mono text-[#1D1D1F] dark:text-white">{completedSettlement.settlement_number}</strong> &bull; {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>

              {/* Staff & Doctor details bar */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <span className="text-[#86868B] block">Shift Period:</span>
                  <strong className="text-[#1D1D1F] dark:text-white font-semibold">{completedSettlement.shift_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#86868B] block">Consulting Doctor:</span>
                  <strong className="text-[#1D1D1F] dark:text-white font-semibold">{completedSettlement.doctor_name}</strong>
                </div>
                <div>
                  <span className="text-[#86868B] block">Receptionist (Cashier):</span>
                  <strong className="text-[#1D1D1F] dark:text-white font-semibold">{completedSettlement.staff_name}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#86868B] block">Total Patients Consulted:</span>
                  <strong className="text-[#1D1D1F] dark:text-white font-bold">{completedSettlement.total_patients} Patients</strong>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="py-4 space-y-2.5 text-xs border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#86868B]">Total Consultation Collections:</span>
                  <span className="font-mono text-sm">₹{completedSettlement.gross_collections.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>&bull; Direct UPI / Soundbox Bank Collection:</span>
                  <span className="font-mono">₹{completedSettlement.upi_amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[#86868B]">
                  <span>&bull; Gross Cash Collected at Counter:</span>
                  <span className="font-mono">₹{completedSettlement.cash_expected.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>&bull; Less Petty Cash Counter Expenses:</span>
                  <span className="font-mono">- ₹{completedSettlement.petty_cash_expenses.toLocaleString("en-IN")}</span>
                </div>

                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex justify-between font-bold text-sm text-[#1D1D1F] dark:text-white">
                  <span>Net Physical Cash Handed Over:</span>
                  <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">
                    ₹{completedSettlement.actual_cash_counted.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Discrepancy Status */}
              <div className="py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
                  completedSettlement.status === "balanced"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                    : completedSettlement.status === "shortage"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                      : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                }`}>
                  <span className="flex items-center gap-1.5">
                    {completedSettlement.status === "balanced" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <span>Settlement Status:</span>
                  </span>
                  <span>
                    {completedSettlement.status === "balanced" 
                      ? "Exact Match (₹0 Discrepancy) ✅" 
                      : completedSettlement.status === "shortage" 
                        ? `Shortage of ₹${Math.abs(completedSettlement.discrepancy)} ⚠️`
                        : `Surplus of ₹${completedSettlement.discrepancy} ℹ️`}
                  </span>
                </div>
              </div>

              {/* Denominations breakdown */}
              <div className="py-3 text-[11px] text-[#86868B] border-b border-black/[0.06] dark:border-white/[0.08]">
                <strong className="text-[#1D1D1F] dark:text-white">Counted Currency Notes: </strong>
                {Object.entries(completedSettlement.denominations).filter(([_, q]) => q > 0).map(([d, q]) => (
                  <span key={d} className="mr-2 font-mono">{q} &times; ₹{d}</span>
                ))}
              </div>

              {/* Signatures Block */}
              <div className="pt-10 flex justify-between items-end text-xs">
                <div className="text-center space-y-1">
                  <div className="w-36 border-b border-black dark:border-white mb-1"></div>
                  <div className="font-bold text-[#1D1D1F] dark:text-white">{completedSettlement.staff_name}</div>
                  <div className="text-[10px] text-[#86868B]">Handed Over By (Receptionist)</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-36 border-b border-black dark:border-white mb-1"></div>
                  <div className="font-bold text-[#1D1D1F] dark:text-white">{completedSettlement.doctor_name}</div>
                  <div className="text-[10px] text-[#86868B]">Received By (Doctor / Owner)</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE DAY-CLOSING SETTLEMENT FORM ================= */
          <div className="space-y-8">
            
            {/* Top Overview & Shift Picker */}
            <div className="rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
                      Shift Cash Drawer Settlement
                    </h1>
                  </div>
                  <p className="text-xs text-[#86868B] mt-1">
                    Daily financial handover between Front Desk and Doctor. Reconcile physical cash, petty deductions & UPI collections.
                  </p>
                </div>

                {/* Shift Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    "Evening Shift (05:00 PM - 08:30 PM)",
                    "Morning Shift (10:00 AM - 02:00 PM)",
                    "Full Day Consolidated"
                  ].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShiftName(s)}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition active:scale-95 ${
                        shiftName === s
                          ? "bg-apple-blue text-white shadow-apple-sm"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                      }`}
                    >
                      {s.split(" ")[0]} Shift
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 High-Level Metric Tiles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tile 1: Gross Collections */}
                <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] p-5 space-y-1">
                  <div className="text-xs font-bold text-[#86868B] uppercase tracking-wider flex items-center justify-between">
                    <span>Total Consultations</span>
                    <span className="font-mono text-apple-blue font-bold">{totalPatients} Patients</span>
                  </div>
                  <div className="text-3xl font-black text-[#1D1D1F] dark:text-white font-mono mt-1">
                    ₹{grossCollections.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#86868B]">
                    Calculated from front-desk token fees
                  </div>
                </div>

                {/* Tile 2: Direct UPI */}
                <div className="rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 p-5 space-y-1">
                  <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Direct Bank UPI / Soundbox</span>
                    <span className="rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.2 font-bold">
                      Account
                    </span>
                  </div>
                  <div className="text-3xl font-black text-purple-900 dark:text-purple-200 font-mono mt-1">
                    ₹{upiAmount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-400">
                    Direct credit to doctor&apos;s bank QR code
                  </div>
                </div>

                {/* Tile 3: Expected Cash */}
                <div className="rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-5 space-y-1">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Gross Cash Expected</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] px-2 py-0.2 font-bold">
                      Counter
                    </span>
                  </div>
                  <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-1">
                    ₹{cashExpected.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400">
                    Gross physical cash collected from walk-ins
                  </div>
                </div>
              </div>
            </div>

            {/* DUAL-COLUMN DETAILS: PETTY EXPENSES + DENOMINATIONS TALLY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT: PETTY CASH & NET EXPECTED DEDUCTIONS (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Petty Cash Card */}
                <div className="rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                        Petty Cash Drawer Deductions
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      - ₹{totalPettyCash}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#86868B]">
                    Record any urgent clinic expenses paid out of the physical cash drawer during this shift:
                  </p>

                  {/* Petty Expenses List */}
                  <div className="space-y-2">
                    {pettyExpenses.map(exp => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between rounded-xl bg-black/[0.02] dark:bg-white/[0.04] p-2.5 text-xs"
                      >
                        <span className="font-medium text-[#1D1D1F] dark:text-white">{exp.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{exp.amount}</span>
                          <button
                            type="button"
                            onClick={() => removePettyExpense(exp.id)}
                            className="text-[#86868B] hover:text-red-500 transition p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {pettyExpenses.length === 0 && (
                      <div className="text-center py-4 text-xs text-[#86868B] italic">
                        No petty cash expenses deducted.
                      </div>
                    )}
                  </div>

                  {/* Add Petty Cash Input */}
                  <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newExpenseLabel}
                        onChange={e => setNewExpenseLabel(e.target.value)}
                        placeholder="e.g. Courier / Tea / Disinfectant"
                        className="col-span-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 px-3 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-blue"
                      />
                      <input
                        type="number"
                        value={newExpenseAmount}
                        onChange={e => setNewExpenseAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="₹ Amount"
                        className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 px-3 py-2 text-xs font-mono font-bold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-apple-blue"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addPettyExpense}
                      disabled={!newExpenseLabel.trim() || !newExpenseAmount}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-xs font-bold text-[#1D1D1F] dark:text-white py-2 transition disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Expense Deduction</span>
                    </button>
                  </div>

                  {/* Net Target Calculation Bar */}
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-1">
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <span>Net Cash to Hand Over:</span>
                      <span className="font-mono text-[10px] text-[#86868B]">(₹{cashExpected} - ₹{totalPettyCash})</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                      ₹{netCashExpected.toLocaleString("en-IN")}
                    </div>
                    <p className="text-[10.5px] text-emerald-800/80 dark:text-emerald-400">
                      Physical currency in the drawer must match this exact target.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: PHYSICAL CASH DENOMINATIONS COUNTER (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-6">
                  <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                        <Coins className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                          Physical Currency Note Counter
                        </h3>
                        <p className="text-[11px] text-[#86868B]">
                          Enter count of each note in cash drawer
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={autoFillExactCash}
                      className="inline-flex items-center gap-1 rounded-full bg-apple-blue/10 hover:bg-apple-blue/20 text-apple-blue px-3 py-1 text-xs font-semibold transition active:scale-95"
                    >
                      <span>⚡ Auto-Tally Exact Target</span>
                    </button>
                  </div>

                  {/* Denominations Grid */}
                  <div className="space-y-3">
                    {DENOMINATION_VALUES.map(denom => {
                      const count = counts[denom] || 0;
                      const subtotal = denom * count;

                      return (
                        <div
                          key={denom}
                          className="rounded-2xl border border-black/[0.05] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02] p-3 sm:p-3.5 flex items-center justify-between gap-4"
                        >
                          {/* Note Label */}
                          <div className="flex items-center gap-3 min-w-[90px]">
                            <span className="flex h-8 w-14 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-mono font-black text-xs border border-emerald-500/20">
                              ₹{denom}
                            </span>
                            <span className="text-xs text-[#86868B] font-medium hidden sm:inline">
                              Note
                            </span>
                          </div>

                          {/* Stepper Count Input */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateCount(denom, count - 1)}
                              className="h-8 w-8 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] font-bold text-sm flex items-center justify-center transition active:scale-90"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={count}
                              onChange={e => updateCount(denom, parseInt(e.target.value) || 0)}
                              className="w-16 text-center rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-black/40 py-1.5 font-mono font-bold text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                            />
                            <button
                              type="button"
                              onClick={() => updateCount(denom, count + 1)}
                              className="h-8 w-8 rounded-lg bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] font-bold text-sm flex items-center justify-center transition active:scale-90"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right min-w-[100px]">
                            <div className="font-mono font-black text-sm text-[#1D1D1F] dark:text-white">
                              ₹{subtotal.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[10px] text-[#86868B]">
                              {count} &times; ₹{denom}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* LIVE RECONCILIATION SUMMARY BOX */}
                  <div className="rounded-2xl border p-5 space-y-3 transition-all bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-[#86868B]">Target Net Cash Required:</span>
                      <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                        ₹{netCashExpected.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-[#86868B]">Physical Cash Counted in Drawer:</span>
                      <span className="font-mono font-black text-base text-emerald-600 dark:text-emerald-400">
                        ₹{actualCashCounted.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Discrepancy Status Banner */}
                    <div className={`rounded-xl p-3.5 flex items-center justify-between text-xs font-bold border transition-all ${
                      discrepancy === 0
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                        : discrepancy < 0
                          ? "bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300"
                          : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300"
                    }`}>
                      <div className="flex items-center gap-2">
                        {discrepancy === 0 ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                        )}
                        <div>
                          <div>
                            {discrepancy === 0
                              ? "Exact Match (₹0 Discrepancy)"
                              : discrepancy < 0
                                ? `Cash Shortage of -₹${Math.abs(discrepancy)}`
                                : `Cash Surplus of +₹${discrepancy}`}
                          </div>
                          <div className="font-normal text-[11px] opacity-85">
                            {discrepancy === 0
                              ? "Physical cash matches system records 100%. Drawer balanced."
                              : discrepancy < 0
                                ? "Counter cash is lower than expected. Please recount notes or explain below."
                                : "Extra cash found in drawer. Surplus recorded in ledger."}
                          </div>
                        </div>
                      </div>

                      <span className="rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-white/50 dark:bg-black/40">
                        {discrepancy === 0 ? "BALANCED" : discrepancy < 0 ? "SHORTAGE" : "SURPLUS"}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Remarks */}
                  <div className="space-y-1.5 text-xs">
                    <label className="font-semibold text-[#1D1D1F] dark:text-white">
                      Receptionist Handover Remarks / Audit Notes
                    </label>
                    <textarea
                      rows={2}
                      value={handoverNotes}
                      onChange={e => setHandoverNotes(e.target.value)}
                      placeholder="e.g. Physical cash counted and handed over to Dr. Rahul Sharma in office. Safe box key returned."
                      className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 p-3 text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                    />
                  </div>

                  {/* SUBMIT ACTION BUTTON */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmitSettlement}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-sm font-bold shadow-apple-sm transition active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <RotateCw className="h-5 w-5 animate-spin" />
                          <span>Closing Shift &amp; Sealing Settlement...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-5 w-5" />
                          <span>Close Shift &amp; Handover ₹{actualCashCounted.toLocaleString("en-IN")} to Doctor</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. SETTLEMENT AUDIT TRAIL / PAST SETTLEMENTS */}
        <div className="rounded-[32px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                Past Shift Settlements Audit Trail
              </h3>
              <p className="text-xs text-[#86868B]">
                Historical end-of-shift reconciliation logs for {clinicName}
              </p>
            </div>
            <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1 text-xs font-bold font-mono">
              {pastSettlements.length} Records
            </span>
          </div>

          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] overflow-x-auto">
            {pastSettlements.map(stl => (
              <div key={stl.id} className="py-3.5 flex items-center justify-between text-xs gap-4 min-w-[600px]">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${
                    stl.status === "balanced" 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : "bg-red-500/10 text-red-600"
                  }`}>
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                      <span>{stl.shift_name}</span>
                      <span className="font-mono text-[10px] text-[#86868B]">({stl.settlement_number})</span>
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-0.5">
                      Staff: {stl.staff_name} &bull; Doctor: {stl.doctor_name} &bull; {stl.shift_date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-[11px] text-[#86868B]">Total Collections</div>
                    <div className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                      ₹{stl.gross_collections.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#86868B]">Cash Handed Over</div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{stl.actual_cash_counted.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      stl.status === "balanced"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-500/10 text-red-700 dark:text-red-300"
                    }`}>
                      {stl.status === "balanced" ? "Balanced" : `Diff ₹${stl.discrepancy}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
