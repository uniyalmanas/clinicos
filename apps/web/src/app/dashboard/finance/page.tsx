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
  Stethoscope
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
    } catch (e) {
      console.error("Error loading expenses ledger:", e);
    } finally {
      setIsLoading(false);
    }
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
    </div>
  );
}
