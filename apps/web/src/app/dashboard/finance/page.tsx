"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Plus, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  IndianRupee,
  Receipt,
  FileText,
  Sparkles,
  RotateCw,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
  Pill,
  Stethoscope,
  Users,
  Send,
  Copy,
  Check,
  Clock
} from "lucide-react";

export default function DashboardFinancePage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    gross_collections: 49598,
    appointment_collections: 1200,
    pharmacy_collections: 398,
    total_expenses: 6250,
    real_net_profit: 43348,
    profit_margin_pct: 87.4
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Doctor Visiting Consultant Revenue Sharing State (Option C)
  const [doctorPayouts, setDoctorPayouts] = useState<any[]>([
    {
      id: "payout-dr-rahul",
      doctor_slug: "dr-rahul-sharma",
      doctor_name: "Dr. Rahul Sharma",
      specialty: "Dermatologist & Hair Specialist",
      roster_type: "in_house",
      roster_label: "Founder & Resident Lead",
      schedule: "Daily OPD (Mon - Sat, 10 AM - 4 PM)",
      split_percentage: 100.0,
      clinic_percentage: 0.0,
      patients_seen: 24,
      consultation_fee: 600.0,
      gross_collections: 14400.0,
      doctor_share: 14400.0,
      clinic_share: 0.0,
      status: "settled",
      payment_mode: "in_house_retention",
      closing_sms: "Dr. Rahul Sharma, DermaCare Clinic Closing Summary: 24 OPD patients seen today. Total Collections: ₹14,400. All funds retained in clinic operating accounts. Have a great evening!",
      whatsapp_url: "https://wa.me/919876543210?text=" + encodeURIComponent("Dr. Rahul Sharma, DermaCare Clinic Closing Summary: 24 OPD patients seen today. Total Collections: ₹14,400. All funds retained in clinic operating accounts. Have a great evening!")
    },
    {
      id: "payout-dr-neha",
      doctor_slug: "dr-neha-kapoor",
      doctor_name: "Dr. Neha Kapoor",
      specialty: "Pediatric Dermatology & Child Care",
      roster_type: "visiting",
      roster_label: "Visiting Specialist (80/20 Split)",
      schedule: "Mon / Wed / Sat (4 PM - 7 PM)",
      split_percentage: 80.0,
      clinic_percentage: 20.0,
      patients_seen: 14,
      consultation_fee: 700.0,
      gross_collections: 9800.0,
      doctor_share: 7840.0,
      clinic_share: 1960.0,
      status: "pending",
      payment_mode: "upi",
      closing_sms: "Namaste Dr. Neha Kapoor. Today's OPD Closing Summary at DermaCare: 14 patients seen. Gross collections: ₹9,800. Your 80% Share: ₹7,840. Clinic Share: ₹1,960. Payout ready for UPI transfer. Thank you!",
      whatsapp_url: "https://wa.me/919876543211?text=" + encodeURIComponent("Namaste Dr. Neha Kapoor. Today's OPD Closing Summary at DermaCare: 14 patients seen. Gross collections: ₹9,800. Your 80% Share: ₹7,840. Clinic Share: ₹1,960. Payout ready for UPI transfer. Thank you!")
    },
    {
      id: "payout-dr-vikram",
      doctor_slug: "dr-vikram-negi",
      doctor_name: "Dr. Vikram Negi",
      specialty: "Cosmetic & Plastic Surgery Specialist",
      roster_type: "visiting",
      roster_label: "Visiting Specialist (75/25 Split)",
      schedule: "Tue / Thu / Sat (5 PM - 8 PM)",
      split_percentage: 75.0,
      clinic_percentage: 25.0,
      patients_seen: 6,
      consultation_fee: 1200.0,
      gross_collections: 7200.0,
      doctor_share: 5400.0,
      clinic_share: 1800.0,
      status: "pending",
      payment_mode: "upi",
      closing_sms: "Namaste Dr. Vikram Negi. Today's Surgical/OPD Closing Summary at DermaCare: 6 procedures/consults seen. Gross collections: ₹7,200. Your 75% Share: ₹5,400. Clinic Share: ₹1,800. Payout ready for UPI transfer. Thank you!",
      whatsapp_url: "https://wa.me/919876543212?text=" + encodeURIComponent("Namaste Dr. Vikram Negi. Today's Surgical/OPD Closing Summary at DermaCare: 6 procedures/consults seen. Gross collections: ₹7,200. Your 75% Share: ₹5,400. Clinic Share: ₹1,800. Payout ready for UPI transfer. Thank you!")
    }
  ]);
  const [doctorPayoutsSummary, setDoctorPayoutsSummary] = useState({
    total_patients: 44,
    total_gross_collections: 31400,
    total_visiting_doctor_payouts: 13240,
    total_clinic_retained: 18160
  });
  const [settlingDoctorSlug, setSettlingDoctorSlug] = useState<string | null>(null);
  const [payoutToast, setPayoutToast] = useState<string | null>(null);
  const [copiedDoctorId, setCopiedDoctorId] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("Consumables");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash">("upi");

  // Fast 1-Click Presets
  const presets = [
    { label: "⚡ UPCL Commercial Power", cat: "Electricity", amt: 4200, desc: "Monthly UPCL commercial electric bill (AC & Lasers)" },
    { label: "🧤 Nitrile Gloves, Spirit & Cotton", cat: "Consumables", amt: 1450, desc: "OPD disposable consumables restock" },
    { label: "💧 RO Water Cans & Tea", cat: "Miscellaneous", amt: 600, desc: "Drinking water cans and clinic pantry supplies" },
    { label: "🛠️ AC & Laser Servicing", cat: "Maintenance", amt: 2200, desc: "Quarterly HVAC filter cleaning & stabilizer check" },
    { label: "👩‍💼 Receptionist Salary", cat: "Staff Salary", amt: 15000, desc: "Receptionist monthly salary (Pooja Verma)" }
  ];

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/expenses");
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.expenses || []);
        if (json.kpis) setKpis(json.kpis);
        if (json.category_breakdown) setCategoryBreakdown(json.category_breakdown);
      }
      
      const settleRes = await fetch("http://localhost:8000/api/v1/clinic/settlements");
      if (settleRes.ok) {
        const settleJson = await settleRes.json();
        setSettlements(settleJson.settlements || []);
      }

      const docRes = await fetch("http://localhost:8000/api/v1/clinic/doctor-payouts");
      if (docRes.ok) {
        const docJson = await docRes.json();
        if (docJson.doctors) setDoctorPayouts(docJson.doctors);
        if (docJson.summary) setDoctorPayoutsSummary(docJson.summary);
      }
    } catch (e) {
      console.error("Error loading expenses ledger:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleDoctorPayout = async (doc: any) => {
    setSettlingDoctorSlug(doc.doctor_slug);
    try {
      const res = await fetch("http://localhost:8000/api/v1/clinic/settle-doctor-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: doc.doctor_slug,
          doctor_name: doc.doctor_name,
          amount: doc.doctor_share,
          payment_mode: "upi",
          notes: `Settled OPD payout for ${doc.patients_seen} patients`
        })
      });

      if (res.ok) {
        setDoctorPayouts(prev =>
          prev.map(d => d.doctor_slug === doc.doctor_slug ? { ...d, status: "settled", payment_mode: "upi" } : d)
        );
        setPayoutToast(`Settled ₹${doc.doctor_share.toLocaleString("en-IN")} payout to ${doc.doctor_name} via UPI.`);
        setTimeout(() => setPayoutToast(null), 4000);
        fetchLedger();
      }
    } catch (e) {
      console.error("Error settling doctor payout:", e);
      // Optimistic fallback
      setDoctorPayouts(prev =>
        prev.map(d => d.doctor_slug === doc.doctor_slug ? { ...d, status: "settled", payment_mode: "upi" } : d)
      );
      setPayoutToast(`Settled ₹${doc.doctor_share.toLocaleString("en-IN")} payout to ${doc.doctor_name} (Local).`);
      setTimeout(() => setPayoutToast(null), 4000);
    } finally {
      setSettlingDoctorSlug(null);
    }
  };

  const handleCopyClosingSms = (doc: any) => {
    navigator.clipboard.writeText(doc.closing_sms || "");
    setCopiedDoctorId(doc.id);
    setTimeout(() => setCopiedDoctorId(null), 2500);
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const applyPreset = (preset: typeof presets[0]) => {
    setCategory(preset.cat);
    setAmount(preset.amt);
    setDescription(preset.desc);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_slug: "derma-care-dehradun",
          category,
          amount: Number(amount),
          description: description || `${category} expense`,
          payment_mode: paymentMode
        })
      });

      if (res.ok) {
        setAmount("");
        setDescription("");
        fetchLedger();
      }
    } catch (e) {
      console.error("Error adding expense:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/expenses/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchLedger();
      }
    } catch (e) {
      console.error("Error deleting expense:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#1D1D1F] dark:text-white">
            Clinic Cashflow & Real Net Profit Ledger
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
            Revenue is vanity, real net in-hand profit is sanity. Tracks all counter outflows alongside live OPD and dispensary collections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/clinic/settlement"
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm transition active:scale-95"
            title="Front Desk Cash Drawer Daily Settlement & Handover"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>💵 Shift Cash Settlements</span>
          </Link>

          <button
            onClick={fetchLedger}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] shadow-sm transition"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Sync Financial Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. P&L FINANCIAL SCOREBOARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Gross Collection */}
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Inflow Collections</span>
            <div className="rounded-full bg-[#0071E3]/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
            ₹{kpis.gross_collections?.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#86868B]">
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3 text-[#0071E3]" /> OPD: ₹{kpis.appointment_collections?.toLocaleString("en-IN")}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Pill className="h-3 w-3 text-[#34C759]" /> Pharmacy: ₹{kpis.pharmacy_collections?.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Total Outflows / Expenses */}
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Operating Expenses</span>
            <div className="rounded-full bg-[#FF3B30]/10 p-2 text-[#FF3B30]">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-[#FF3B30]">
            ₹{kpis.total_expenses?.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-xs text-[#86868B]">
            {expenses.length} logged expense vouchers (rent, power, salaries, consumables)
          </p>
        </div>

        {/* Real Net In-Hand Profit */}
        <div className="rounded-[20px] border border-black/[0.06] bg-gradient-to-br from-white to-[#ECEEF2]/40 p-6 shadow-sm dark:border-white/[0.08] dark:from-[#1C1C1E] dark:to-white/[0.02]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-xs font-semibold uppercase tracking-wider">Real Net In-Hand Profit</span>
            <span className="rounded-full bg-[#34C759]/15 px-2.5 py-0.5 text-xs font-black text-[#34C759]">
              {kpis.profit_margin_pct}% Margin
            </span>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-[#34C759]">
            ₹{kpis.real_net_profit?.toLocaleString("en-IN")}
          </div>
          <p className="mt-2 text-xs text-[#86868B]">
            Net bank balance after meeting all physical operating costs
          </p>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: LOG EXPENSE (LEFT) + LEDGER TABLE (RIGHT) */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Form: Log New Outflow */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <Receipt className="h-4 w-4 text-[#0071E3]" /> Record Outgoing Expense
            </h2>
            <p className="mt-1 text-xs text-[#86868B]">
              Instantly log cash/UPI payouts directly from front desk
            </p>

            {/* Quick 1-Click Presets */}
            <div className="mt-4">
              <span className="text-[11px] font-semibold text-[#86868B]">Quick Presets:</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="rounded-[10px] border border-black/[0.06] bg-[#ECEEF2]/50 px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.05] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                >
                  <option value="Consumables">Consumables (Gloves, Needles, Spirit)</option>
                  <option value="Electricity">Electricity & Power</option>
                  <option value="Staff Salary">Staff Salary / Daily Wages</option>
                  <option value="Rent">Clinic Rent & Maintenance</option>
                  <option value="Maintenance">HVAC / Medical Equipment Servicing</option>
                  <option value="Miscellaneous">Miscellaneous / Pantry Supplies</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Amount Paid (₹)</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#86868B]">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1450"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-[12px] border border-black/[0.08] p-2.5 pl-8 text-xs font-bold text-[#1D1D1F] dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Disposable syringe packet of 100"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.08] p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.08] dark:bg-black/20 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Payment Method</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("upi")}
                    className={`rounded-[10px] p-2 text-center font-bold transition ${
                      paymentMode === "upi"
                        ? "bg-[#0071E3] text-white"
                        : "border border-black/[0.08] bg-white text-[#86868B] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                    }`}
                  >
                    UPI / Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("cash")}
                    className={`rounded-[10px] p-2 text-center font-bold transition ${
                      paymentMode === "cash"
                        ? "bg-[#0071E3] text-white"
                        : "border border-black/[0.08] bg-white text-[#86868B] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                    }`}
                  >
                    Front Desk Cash
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !amount}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#1D1D1F] py-3 text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" /> Logging Outflow...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Log Operating Outflow
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Category Breakdown Card */}
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-[#0071E3]" /> Outflows by Category
            </h3>
            <div className="mt-3 space-y-2 text-xs">
              {Object.entries(categoryBreakdown).map(([cat, total]) => (
                <div key={cat} className="flex items-center justify-between py-1 border-b border-black/[0.02] dark:border-white/[0.02]">
                  <span className="text-[#1D1D1F] dark:text-white font-medium">{cat}</span>
                  <span className="font-mono font-bold text-[#FF3B30]">₹{total.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Expense Ledger Table */}
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868B]">
                Voucher Registry ({expenses.length} Records)
              </h2>
              <span className="text-xs text-[#86868B]">
                Persisted to SQLite • Audit compliant
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Date</th>
                    <th className="px-4 py-3.5 font-bold">Category</th>
                    <th className="px-4 py-3.5 font-bold">Description / Purpose</th>
                    <th className="px-4 py-3.5 font-bold">Mode</th>
                    <th className="px-5 py-3.5 font-bold text-right">Amount</th>
                    <th className="px-4 py-3.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                      <td className="px-5 py-4 font-mono text-[11px] text-[#86868B]">
                        {e.expense_date}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[10px] font-bold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs text-[#1D1D1F] dark:text-white">
                        {e.description}
                      </td>
                      <td className="px-4 py-4 font-mono uppercase text-[10px] text-[#86868B]">
                        {e.payment_mode}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-sm font-bold text-[#FF3B30]">
                        ₹{e.amount?.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="rounded-full p-1 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition"
                          title="Delete Voucher"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DAILY SHIFT CASH SETTLEMENTS & CASH DRAWER RECONCILIATIONS */}
      <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
              Daily Shift Cash Drawer Handover Audits ({settlements.length} Shifts Reconciled)
            </h2>
          </div>
          <Link
            href="/clinic/settlement"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Open Cash Settlement Console</span>
            <span>➔</span>
          </Link>
        </div>

        {settlements.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#86868B]">
            No shifts settled yet today. Staff can balance and lock shift cash drawers from the{" "}
            <Link href="/clinic/settlement" className="text-emerald-600 underline font-semibold">
              Shift Settlement Console
            </Link>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Shift & Time</th>
                  <th className="px-4 py-3.5 font-bold">Counter Staff</th>
                  <th className="px-4 py-3.5 font-bold">Doctor OPD</th>
                  <th className="px-4 py-3.5 font-bold text-right">Gross Inflow</th>
                  <th className="px-4 py-3.5 font-bold text-right">Soundbox UPI</th>
                  <th className="px-4 py-3.5 font-bold text-right">Expected Cash</th>
                  <th className="px-4 py-3.5 font-bold text-right">Actual Counted</th>
                  <th className="px-4 py-3.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {settlements.map((s) => (
                  <tr key={s.settlement_id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-[#1D1D1F] dark:text-white">
                        {s.shift_name}
                      </div>
                      <div className="font-mono text-[10px] text-[#86868B] mt-0.5">
                        {s.settlement_id} • {s.settlement_date}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#1D1D1F] dark:text-white font-medium">
                      {s.staff_name}
                    </td>
                    <td className="px-4 py-4 text-[#86868B]">
                      {s.doctor_name}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                      ₹{s.gross_collected?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-[#0071E3] dark:text-[#2997FF]">
                      ₹{s.upi_collected?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-medium text-[#86868B]">
                      ₹{s.expected_cash?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{s.actual_cash_counted?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.discrepancy_status === "balanced"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : s.discrepancy_status === "surplus"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                      }`}>
                        {s.discrepancy_status === "balanced" && "✓ Balanced"}
                        {s.discrepancy_status === "surplus" && `+₹${s.discrepancy_amount} Surplus`}
                        {s.discrepancy_status === "shortage" && `-₹${Math.abs(s.discrepancy_amount)} Shortage`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. VISITING CONSULTANT REVENUE SHARING & DAILY DOCTOR PAYOUTS (OPTION C) */}
      <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
        <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue dark:text-sky-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                  Visiting Consultant Revenue Splits & Daily Doctor Payouts
                </h2>
                <span className="rounded-full bg-apple-blue/10 text-apple-blue dark:text-sky-300 text-[10px] font-bold px-2 py-0.5">
                  Automated OPD Split
                </span>
              </div>
              <p className="text-xs text-[#86868B] mt-0.5">
                Calculates doctor fee splits (e.g. 80/20) with 1-click WhatsApp closing SMS & automatic expense voucher recording.
              </p>
            </div>
          </div>

          {payoutToast && (
            <div className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-3.5 py-1 text-xs font-bold animate-in fade-in flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{payoutToast}</span>
            </div>
          )}
        </div>

        {/* Aggregate KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5">
          <div className="p-3.5 rounded-2xl bg-[#ECEEF2]/40 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-[#86868B]">Total OPD Patients</span>
            <div className="text-xl font-black text-[#1D1D1F] dark:text-white mt-1">
              {doctorPayoutsSummary.total_patients} Patients
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#ECEEF2]/40 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[10px] uppercase font-bold text-[#86868B]">Gross Consultations</span>
            <div className="text-xl font-black text-[#0071E3] dark:text-[#2997FF] mt-1">
              ₹{doctorPayoutsSummary.total_gross_collections?.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Visiting Doctors Payout</span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
              ₹{doctorPayoutsSummary.total_visiting_doctor_payouts?.toLocaleString("en-IN")}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Clinic Retained Facility Margin</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{doctorPayoutsSummary.total_clinic_retained?.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Doctors Breakdown Table */}
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
              <tr>
                <th className="px-5 py-3.5 font-bold">Doctor & Specialty</th>
                <th className="px-4 py-3.5 font-bold">Roster & Contract</th>
                <th className="px-4 py-3.5 font-bold text-center">OPD Patients</th>
                <th className="px-4 py-3.5 font-bold text-right">Gross OPD</th>
                <th className="px-4 py-3.5 font-bold text-right">Doctor Cut</th>
                <th className="px-4 py-3.5 font-bold text-right">Clinic Cut</th>
                <th className="px-4 py-3.5 font-bold text-center">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {doctorPayouts.map((doc) => (
                <tr key={doc.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-apple-blue" />
                      <span>{doc.doctor_name}</span>
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-0.5">
                      {doc.specialty}
                    </div>
                    <div className="text-[10px] text-[#86868B] font-mono mt-0.5">
                      {doc.schedule}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.roster_type === "in_house"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}>
                      {doc.roster_label || (doc.roster_type === "in_house" ? "In-House" : `Visiting (${doc.split_percentage}%)`)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-bold text-[#1D1D1F] dark:text-white">
                    {doc.patients_seen}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                    ₹{doc.gross_collections?.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                    ₹{doc.doctor_share?.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{doc.clinic_share?.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      doc.status === "settled"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {doc.status === "settled" ? "✓ Settled" : "⏳ Pending Payout"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {doc.status !== "settled" && doc.roster_type === "visiting" && (
                        <button
                          type="button"
                          onClick={() => handleSettleDoctorPayout(doc)}
                          disabled={settlingDoctorSlug === doc.doctor_slug}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm active:scale-95 transition cursor-pointer"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>{settlingDoctorSlug === doc.doctor_slug ? "Settling..." : `Pay ₹${doc.doctor_share}`}</span>
                        </button>
                      )}

                      <a
                        href={doc.whatsapp_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-bold transition active:scale-95 cursor-pointer"
                        title="Send OPD Daily Closing SMS to Doctor via WhatsApp"
                      >
                        <Send className="h-3 w-3" />
                        <span>SMS / WA</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopyClosingSms(doc)}
                        className="rounded-lg p-1 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                        title="Copy Closing SMS Text"
                      >
                        {copiedDoctorId === doc.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
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
