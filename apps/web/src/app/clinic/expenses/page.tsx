"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Plus, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  ArrowLeft,
  IndianRupee,
  Receipt,
  FileText
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function ClinicExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([
    {
      id: "exp-001",
      category: "Electricity",
      amount: 4200,
      expense_date: "2026-09-15",
      description: "Commercial UPCL power bill for August (AC & Lasers)",
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

  // Gross collection estimate (Cash + UPI)
  const [grossCollections] = useState(50400);

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

  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const netProfit = grossCollections - totalExpenses;
  const marginPct = grossCollections > 0 ? ((netProfit / grossCollections) * 100).toFixed(1) : 0;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    const newRecord = {
      id: `exp-${Date.now().toString().slice(-4)}`,
      category,
      amount: Number(amount),
      expense_date: new Date().toISOString().split("T")[0],
      description: description || category,
      payment_mode: paymentMode
    };

    setExpenses([newRecord, ...expenses]);
    setAmount("");
    setDescription("");

    // Backend sync in background
    fetch(`/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: newRecord.category,
        amount: newRecord.amount,
        description: newRecord.description,
        payment_mode: newRecord.payment_mode
      })
    }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/clinic/desk" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  Clinic Cashflow & Real Net Profit Ledger
                </h1>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Derma Care Dehradun
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Revenue is vanity, real net profit is sanity. Tracks all counter outflows alongside collections.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/clinic/desk"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Open Reception Desk
            </Link>
          </div>
        </div>
      </header>

      {/* Main Ledger Console */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* KPI Financial Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Collections */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gross OPD Collections
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              ₹{grossCollections.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-semibold">
              Cash & Soundbox UPI receipts
            </div>
          </div>

          {/* Total Expenses */}
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm dark:border-red-950 dark:bg-red-950/20">
            <div className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="h-4 w-4" /> Total Operating Expenses
            </div>
            <div className="mt-2 text-3xl font-black text-red-600 dark:text-red-400">
              ₹{totalExpenses.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Rent, electricity, salary, gloves
            </div>
          </div>

          {/* Real Net In-Hand Profit */}
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Real Net In-Hand Profit
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{netProfit.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Actual cash pocketed by clinic owner
            </div>
          </div>

          {/* Net Profit Margin */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Profit Margin %
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              {marginPct}%
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Operating efficiency
            </div>
          </div>
        </div>

        {/* Quick Log Form & Presets Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-brand-600" /> Log Daily Clinic Overhead Expense
            </h3>
            <span className="text-[11px] text-slate-500">Quick 1-Click presets below</span>
          </div>

          {/* Preset Buttons */}
          <div className="mb-4 flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                ⚡ {p.label} (₹{p.amt})
              </button>
            ))}
          </div>

          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="Electricity">Electricity & Power</option>
                <option value="Consumables">Medical Consumables</option>
                <option value="Staff Salary">Staff Salaries</option>
                <option value="Rent">Premises Rent</option>
                <option value="Maintenance">Equipment Maintenance</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Amount (₹) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="4200"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="md:col-span-4">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. UPCL power bill, nitrile gloves"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Paid Via</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="upi">UPI / GPay</option>
                <option value="cash">Counter Cash</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-700"
              >
                + Log
              </button>
            </div>
          </form>
        </div>

        {/* Expense History Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
            Permanent Outflow Register ({expenses.length} Entries)
          </div>

          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-500">{e.expense_date}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{e.description}</td>
                  <td className="py-3 px-4 uppercase font-mono text-[10px] text-slate-500">{e.payment_mode}</td>
                  <td className="py-3 px-4 text-right font-bold text-red-600 dark:text-red-400">
                    -₹{e.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
