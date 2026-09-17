"use client";

import React, { useState } from "react";
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
  Sparkles
} from "lucide-react";

export default function DashboardFinancePage() {
  const [expenses, setExpenses] = useState<any[]>([
    {
      id: "exp-001",
      category: "Electricity",
      amount: 4200,
      expense_date: "2026-09-15",
      description: "Commercial UPCL power bill for August (Air Conditioners & Lasers)",
      payment_mode: "upi"
    },
    {
      id: "exp-002",
      category: "Consumables",
      amount: 1450,
      expense_date: "2026-09-16",
      description: "Disposable nitrile gloves, surgical spirit, cotton rolls, disinfectant",
      payment_mode: "cash"
    },
    {
      id: "exp-003",
      category: "Staff Salary",
      amount: 15000,
      expense_date: "2026-09-10",
      description: "Receptionist monthly salary (Pooja Verma)",
      payment_mode: "upi"
    }
  ]);

  const [grossCollections, setGrossCollections] = useState(50400);

  // Form state
  const [category, setCategory] = useState("Consumables");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash">("upi");

  // Fast 1-Click Presets
  const presets = [
    { label: "⚡ UPCL Commercial Power", cat: "Electricity", amt: 4200, desc: "Monthly UPCL commercial electric bill" },
    { label: "🧤 Gloves, Spirit & Cotton", cat: "Consumables", amt: 1450, desc: "OPD disposable consumables restock" },
    { label: "💧 RO Water Cans & Tea", cat: "Miscellaneous", amt: 600, desc: "Drinking water cans and clinic pantry supplies" },
    { label: "🛠️ AC & Laser Servicing", cat: "Maintenance", amt: 2200, desc: "Quarterly HVAC filter cleaning & stabilizer check" }
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setCategory(preset.cat);
    setAmount(preset.amt);
    setDescription(preset.desc);
  };

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netInHandProfit = grossCollections - totalExpenses;
  const netProfitMargin = grossCollections > 0 ? ((netInHandProfit / grossCollections) * 100).toFixed(1) : "0";

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    const newRecord = {
      id: `exp-${Date.now()}`,
      category,
      amount: Number(amount),
      expense_date: new Date().toISOString().split("T")[0],
      description: description || `${category} expense`,
      payment_mode: paymentMode
    };

    setExpenses([newRecord, ...expenses]);
    setAmount("");
    setDescription("");
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Clinic Cashflow & Real Net Profit Ledger
        </h1>
        <p className="text-xs text-slate-500">
          Revenue is vanity, real net in-hand profit is sanity. Tracks all counter outflows alongside collections.
        </p>
      </div>

      {/* 2. P&L FINANCIAL SCOREBOARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Gross Collection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Collections</span>
            <div className="rounded-lg bg-teal-50 p-2 text-brand-600 dark:bg-teal-950 dark:text-brand-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ₹{grossCollections.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Direct Bank UPI & Cash (Zero Aggregator Cuts)
          </p>
        </div>

        {/* Total Clinic Expenses */}
        <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-950 dark:bg-slate-900">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Operating Outflows</span>
            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-rose-600">
            ₹{totalExpenses.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Staff salary, UPCL electricity, disposables
          </p>
        </div>

        {/* Real In-Hand Profit */}
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-xs font-bold uppercase tracking-wider">Real In-Hand Net Profit</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-400">
            ₹{netInHandProfit.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{netProfitMargin}% Net Profit Margin</span>
          </div>
        </div>
      </div>

      {/* 3. LOG NEW EXPENSE FORM & PRESETS */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-600" />
            Record Clinic Outflow
          </h2>

          {/* 1-Click Presets */}
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-500">1-Tap Dehradun Clinic Presets:</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddExpense} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="Electricity">Electricity (UPCL Commercial)</option>
                <option value="Consumables">Consumables (Gloves, Syringes, Cotton)</option>
                <option value="Staff Salary">Staff Salary (Reception / Helper)</option>
                <option value="Rent">Clinic Property Rent</option>
                <option value="Maintenance">HVAC / Laser Maintenance</option>
                <option value="Miscellaneous">Tea, Water & Pantry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Amount (₹ INR)</label>
              <input
                type="number"
                required
                placeholder="e.g. 1500"
                value={amount}
                onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Description / Vendor</label>
              <input
                type="text"
                placeholder="e.g. 10 boxes latex examination gloves"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
            >
              Add Expense Record
            </button>
          </form>
        </div>

        {/* EXPENSE LOG TABLE */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Outflow Log ({expenses.length})</span>
            <span className="text-xs font-bold text-rose-600">Total: ₹{totalExpenses.toLocaleString("en-IN")}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 dark:bg-slate-800/50 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {exp.category}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {exp.description}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                      {exp.expense_date}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                      ₹{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Delete Record"
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
  );
}
