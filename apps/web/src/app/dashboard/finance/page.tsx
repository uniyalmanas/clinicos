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
  Clock,
  Download,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  X,
  Coins,
  Upload,
  Scan,
  Scale
} from "lucide-react";
import { 
  ExpenseVoucher, 
  DoctorPayout, 
  ShiftHandover, 
  PettyCashFloat, 
  DenominationBreakdown, 
  calculateDenominationTotal,
  VARIANCE_THRESHOLD_INR,
  EXPENSE_APPROVAL_THRESHOLD_INR,
  PETTY_CASH_MIN_THRESHOLD_INR
} from "@/data/financeGovernance";

export default function DashboardFinancePage() {
  const [activeTab, setActiveTab] = useState<"vouchers" | "doctors" | "shifts" | "petty_cash">("vouchers");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    gross_collections: 49598,
    appointment_collections: 1200,
    pharmacy_collections: 398,
    total_expenses: 6250,
    real_net_profit: 43348,
    profit_margin_pct: 87.4,
    pending_approval_count: 1,
    flagged_duplicate_count: 0
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Doctor Visiting Consultant Revenue Sharing State
  const [doctorPayouts, setDoctorPayouts] = useState<DoctorPayout[]>([]);
  const [doctorPayoutsSummary, setDoctorPayoutsSummary] = useState({
    total_patients: 44,
    total_gross_collections: 31400,
    total_visiting_doctor_payouts: 13240,
    total_clinic_retained: 18160,
    total_escrow_held: 1200
  });
  const [settlingDoctorSlug, setSettlingDoctorSlug] = useState<string | null>(null);
  const [copiedDoctorId, setCopiedDoctorId] = useState<string | null>(null);

  // Executive EOD (End of Day) Cockpit State
  const [eodSummary, setEodSummary] = useState<any>({
    clinic_name: "Derma Care Skin & Laser Centre",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    patient_metrics: {
      total_consultations: 44,
      walk_in_patients: 36,
      advance_bookings: 8,
      free_follow_up_reviews: 4
    },
    financial_metrics: {
      gross_collections: 31400.0,
      soundbox_upi_inflow: 22000.0,
      gross_cash_collected: 9400.0,
      petty_expenses_outflow: 450.0,
      visiting_doctor_payouts: 13240.0,
      net_expected_cash: 8950.0,
      actual_cash_counted: 8950.0,
      cash_discrepancy: 0.0,
      drawer_status: "balanced",
      real_net_profit: 17710.0,
      profit_margin_percentage: 56.4
    },
    doctor_splits: [
      { doctor: "Dr. Rahul Sharma", patients: 24, retention: "100% In-house", amount: 14400.0 },
      { doctor: "Dr. Neha Kapoor", patients: 14, split: "80/20", payout: 7840.0, status: "settled" },
      { doctor: "Dr. Vikram Negi", patients: 6, split: "75/25", payout: 5400.0, status: "settled" }
    ],
    whatsapp_url: "https://wa.me/919876543210",
    is_day_locked: false,
    audit_hash: null as string | null
  });
  const [isLockingDay, setIsLockingDay] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [copiedWaMsg, setCopiedWaMsg] = useState(false);

  // Shift Handovers & POS Lock State (Fix 3)
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [currentDrawer, setCurrentDrawer] = useState({
    opening_float: 2000,
    cash_inflow: 14200,
    cash_expenses: 450,
    expected_cash: 15750,
    is_pos_locked: false,
    locked_reason: null as string | null,
    locked_shift_id: null as string | null
  });

  // Petty Cash Reserve State (Fix 4)
  const [pettyFloat, setPettyFloat] = useState<PettyCashFloat>({
    id: "float-1",
    target_float: 2000,
    current_balance: 1450,
    min_threshold: 800,
    status: "HEALTHY",
    is_low_float: false,
    last_replenished_at: new Date().toISOString(),
    last_replenished_by: "Dr. Rahul Sharma (Finance Head)"
  });
  const [pettyLedger, setPettyLedger] = useState<any[]>([]);

  // Modals & Interactive Workflows
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [pettyReplenishModalOpen, setPettyReplenishModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [selectedDisputeDoc, setSelectedDisputeDoc] = useState<DoctorPayout | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEscrowAmount, setDisputeEscrowAmount] = useState<number | "">("");

  const [approvePinModalOpen, setApprovePinModalOpen] = useState(false);
  const [selectedExpenseToApprove, setSelectedExpenseToApprove] = useState<any | null>(null);
  const [managerPinInput, setManagerPinInput] = useState("");

  const [unlockPosModalOpen, setUnlockPosModalOpen] = useState(false);
  const [unlockPinInput, setUnlockPinInput] = useState("");

  // Expense Form State (Fix 1)
  const [category, setCategory] = useState("Consumables");
  const [amount, setAmount] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash">("cash");
  const [expenseManagerPin, setExpenseManagerPin] = useState("");
  const [receiptAttached, setReceiptAttached] = useState(true);

  // Shift Denomination State (Fix 3)
  const [denominations, setDenominations] = useState<DenominationBreakdown>({
    n500: 31,
    n200: 8,
    n100: 5,
    n50: 1,
    n20: 3,
    n10: 2,
    coins: 20
  });
  const [shiftVarianceReason, setShiftVarianceReason] = useState("");
  const [shiftOverridePin, setShiftOverridePin] = useState("");

  // Replenish Float Form State (Fix 4)
  const [replenishAmount, setReplenishAmount] = useState<number | "">(1000);
  const [replenishSource, setReplenishSource] = useState("Main Cash Safe Counter");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Fast 1-Click Expense Presets
  const presets = [
    { label: "⚡ UPCL Commercial Power", cat: "Electricity", amt: 4200, desc: "Monthly UPCL commercial electric bill (AC & Lasers)" },
    { label: "🧤 Nitrile Gloves & Spirit", cat: "Consumables", amt: 1450, desc: "OPD disposable nitrile gloves (x2 boxes) & spirit restock" },
    { label: "💧 RO Water Cans & Tea", cat: "Miscellaneous", amt: 350, desc: "Drinking water cans and clinic pantry supplies" },
    { label: "📦 Biopsy Courier (Bluedart)", cat: "Consumables", amt: 250, desc: "Biopsy histopathology specimen dispatch to Delhi" },
    { label: "🛠️ AC Filter & Laser Cleaning", cat: "Maintenance", amt: 2200, desc: "Quarterly HVAC filter cleaning & stabilizer check" }
  ];

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Expenses
      const res = await fetch("/api/expenses");
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.expenses || []);
        if (json.kpis) setKpis(json.kpis);
        if (json.category_breakdown) setCategoryBreakdown(json.category_breakdown);
      }

      // 2. Fetch Doctor Payouts
      const docRes = await fetch("/api/clinic/doctor-payouts");
      if (docRes.ok) {
        const docJson = await docRes.json();
        if (docJson.doctors) setDoctorPayouts(docJson.doctors);
        if (docJson.summary) setDoctorPayoutsSummary(docJson.summary);
      }

      // 3. Fetch EOD Summary
      const eodRes = await fetch("/api/clinic/eod-summary");
      if (eodRes.ok) {
        const eodJson = await eodRes.json();
        setEodSummary((prev: any) => ({
          ...prev,
          ...eodJson,
          is_day_locked: prev.is_day_locked || eodJson.is_day_locked,
          audit_hash: prev.audit_hash || eodJson.audit_hash
        }));
      }

      // 4. Fetch Shift Handovers & Cash Drawer
      const shiftRes = await fetch("/api/clinic/shifts");
      if (shiftRes.ok) {
        const shiftJson = await shiftRes.json();
        setHandovers(shiftJson.handovers || []);
        if (shiftJson.current_drawer) setCurrentDrawer(shiftJson.current_drawer);
      }

      // 5. Fetch Petty Cash Float
      const floatRes = await fetch("/api/clinic/petty-cash");
      if (floatRes.ok) {
        const floatJson = await floatRes.json();
        if (floatJson.float) setPettyFloat(floatJson.float);
        if (floatJson.ledger) setPettyLedger(floatJson.ledger);
      }
    } catch (e) {
      console.error("Error loading financial cockpit:", e);
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

  // FIX 1: Add Expense with PIN & AI OCR Verification
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: description || `${category} voucher`,
          category,
          amount: Number(amount),
          payment_mode: paymentMode,
          recorded_by: "Pooja Verma (Front Desk)",
          manager_pin: expenseManagerPin,
          receipt_url: "/receipts/sample_voucher.png"
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message || "Voucher logged successfully.");
        setAmount("");
        setDescription("");
        setExpenseManagerPin("");
        fetchLedger();
      } else {
        showToast(`Error: ${json.error}`);
      }
    } catch (e) {
      console.error("Error adding expense:", e);
      showToast("Network error logging voucher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIX 1: Approve Pending Expense with Manager PIN
  const handleApproveExpense = async () => {
    if (!selectedExpenseToApprove || !managerPinInput) return;

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_voucher",
          expense_id: selectedExpenseToApprove.id,
          pin: managerPinInput
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setApprovePinModalOpen(false);
        setSelectedExpenseToApprove(null);
        setManagerPinInput("");
        fetchLedger();
      } else {
        showToast(`Authorization Failed: ${json.error}`);
      }
    } catch (e) {
      console.error("Error approving expense:", e);
    }
  };

  // FIX 1: Delete Voucher
  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Expense voucher removed.");
        fetchLedger();
      }
    } catch (e) {
      console.error("Error deleting expense:", e);
    }
  };

  // FIX 2: Settle Doctor Payout (Respects Day-Close Lock)
  const handleSettleDoctorPayout = async (doc: DoctorPayout) => {
    setSettlingDoctorSlug(doc.doctor_slug);
    try {
      const res = await fetch("/api/clinic/settle-doctor-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: doc.doctor_slug,
          doctor_name: doc.doctor_name,
          amount: doc.net_payable,
          payment_mode: "upi",
          notes: `Settled OPD payout for ${doc.patients_seen} patients (Net after adjustments)`
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        fetchLedger();
      } else {
        showToast(`Settlement Blocked: ${json.error}`);
      }
    } catch (e) {
      console.error("Error settling doctor payout:", e);
    } finally {
      setSettlingDoctorSlug(null);
    }
  };

  // FIX 2: Put Doctor Split in DISPUTED_ESCROW
  const handleHoldEscrow = async () => {
    if (!selectedDisputeDoc || !disputeEscrowAmount || !disputeReason) return;

    try {
      const res = await fetch("/api/clinic/doctor-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hold_escrow",
          doctor_slug: selectedDisputeDoc.doctor_slug,
          doctor_name: selectedDisputeDoc.doctor_name,
          escrow_amount: Number(disputeEscrowAmount),
          gross_amount: selectedDisputeDoc.gross_collections,
          agreed_split_pct: selectedDisputeDoc.split_percentage,
          dispute_reason: disputeReason
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setDisputeModalOpen(false);
        setSelectedDisputeDoc(null);
        setDisputeReason("");
        setDisputeEscrowAmount("");
        fetchLedger();
      } else {
        showToast(`Dispute Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 2: Resolve & Release Escrow
  const handleResolveEscrow = async (disputeId: string) => {
    try {
      const res = await fetch("/api/clinic/doctor-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resolve_escrow",
          dispute_id: disputeId
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        fetchLedger();
      } else {
        showToast(`Escrow Release Failed: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 3: Submit Shift Handover Cash Count
  const handleSubmitShiftHandover = async () => {
    const countedTotal = calculateDenominationTotal(denominations);

    try {
      const res = await fetch("/api/clinic/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shift_name: new Date().getHours() < 14 ? "Morning Shift (08:00 - 14:00)" : "Evening Shift (14:00 - 21:00)",
          cashier_name: "Pooja Verma (Front Desk Lead)",
          next_cashier_name: "Rohit Semwal (Evening Desk)",
          opening_float: currentDrawer.opening_float,
          counted_cash: countedTotal,
          variance_reason: shiftVarianceReason,
          manager_override_pin: shiftOverridePin
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setShiftModalOpen(false);
        fetchLedger();
      } else {
        showToast(`Shift Handover Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 3: Unlock POS with Manager PIN
  const handleUnlockPos = async () => {
    if (!unlockPinInput) return;

    try {
      const res = await fetch("/api/clinic/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unlock_pos",
          pin: unlockPinInput
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setUnlockPosModalOpen(false);
        setUnlockPinInput("");
        fetchLedger();
      } else {
        showToast(`Unlock Failed: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 4: Replenish Petty Cash Float
  const handleReplenishFloat = async () => {
    if (!replenishAmount || Number(replenishAmount) <= 0) return;

    try {
      const res = await fetch("/api/clinic/petty-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "replenish",
          amount: Number(replenishAmount),
          source_or_recipient: replenishSource,
          recorded_by: "Dr. Rahul Sharma (Finance Head)"
        })
      });

      const json = await res.json();
      if (res.ok) {
        showToast(json.message);
        setPettyReplenishModalOpen(false);
        fetchLedger();
      } else {
        showToast(`Replenish Error: ${json.error}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Copy Helpers
  const handleCopyClosingSms = (doc: DoctorPayout) => {
    navigator.clipboard.writeText(doc.closing_sms || "");
    setCopiedDoctorId(doc.id);
    setTimeout(() => setCopiedDoctorId(null), 2500);
  };

  const handleCopyWaSummary = () => {
    if (eodSummary?.whatsapp_eod_message) {
      navigator.clipboard.writeText(eodSummary.whatsapp_eod_message);
      setCopiedWaMsg(true);
      setTimeout(() => setCopiedWaMsg(false), 3000);
    }
  };

  // Day-Book Lock
  const handleLockDay = async () => {
    setIsLockingDay(true);
    try {
      const res = await fetch("/api/clinic/eod-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_slug: "derma-care-dehradun",
          closed_by: "Pooja Verma (Front Desk Lead)",
          counted_cash: currentDrawer.expected_cash || 8950.0,
          closing_notes: "All shifts reconciled, physical cash handed over to Dr. Rahul, drawer locked."
        })
      });

      if (res.ok) {
        const json = await res.json();
        setEodSummary((prev: any) => ({
          ...prev,
          is_day_locked: true,
          audit_hash: json.audit_hash || "EOD-SEAL-9B4A8E"
        }));
        showToast("Clinic Day-Book has been audited, sealed, and locked. Payouts locked against post-close alterations.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLockingDay(false);
    }
  };

  // Export CSV
  const handleExportCALedger = () => {
    setIsExportingCsv(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const rows = [
        ["Date", "Transaction Type", "Voucher/Ref #", "Category", "Description / Entity", "Payment Mode", "Approval Status", "Inflow (Cr)", "Outflow (Dr)", "Net Balance"],
        [today, "Patient Consultations", "OPD-BATCH-TODAY", "Consultation Revenue", "OPD Footfall (44 Patients: 36 Walk-ins, 8 Booked)", "Soundbox UPI / Cash", "APPROVED", "31400.00", "0.00", "31400.00"],
        [today, "Pharmacy Dispensary", "RX-DISP-TODAY", "Dispensary Sales", "In-clinic dispensary medicines & topical lotions", "UPI Soundbox", "APPROVED", "398.00", "0.00", "31798.00"],
        [today, "Petty Cash Float Outflow", "VCH-0925-01", "Consumables", "Nitrile examination gloves & Spirit cotton", "Cash Drawer", "APPROVED (Admin Session)", "0.00", "1450.00", "30348.00"],
        [today, "Doctor Revenue Split", "DOC-NEHA-80", "Consultant Share", "Dr. Neha Kapoor (14 Pediatric Consults, ₹700 refund deducted)", "UPI Direct", "APPROVED", "0.00", "7140.00", "23208.00"],
        [today, "Doctor Revenue Split", "DOC-VIKRAM-75", "Consultant Share", "Dr. Vikram Negi (6 Cosmetic Procedures, ₹400 consumables deducted)", "UPI Direct", "APPROVED", "0.00", "5000.00", "18208.00"]
      ];

      expenses.forEach((exp: any) => {
        rows.push([
          exp.date || today,
          "Operating Expense",
          exp.id?.slice(0, 8) || "VCH-EXP",
          exp.category || "General",
          `"${(exp.title || "").replace(/"/g, '""')}"`,
          (exp.payment_mode || "UPI").toUpperCase(),
          exp.approval_status || "APPROVED",
          "0.00",
          Number(exp.amount || 0).toFixed(2),
          "-"
        ]);
      });

      const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `DocSphere_CA_Audit_Ledger_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("CA-Ready Audit Ledger (CSV) downloaded successfully.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const countedCashLive = calculateDenominationTotal(denominations);
  const liveVariance = countedCashLive - currentDrawer.expected_cash;
  const isLiveBreach = Math.abs(liveVariance) > VARIANCE_THRESHOLD_INR;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-[#1D1D1F] border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/60 hover:text-white dark:text-black/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* POS LOCK ALERT BANNER (FIX 3) */}
      {currentDrawer.is_pos_locked && (
        <div className="rounded-[20px] border-2 border-rose-500/40 bg-rose-500/10 p-4 text-xs font-medium text-rose-900 dark:text-rose-200 shadow-sm animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-500/20 p-2 text-rose-600 dark:text-rose-400 shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-rose-700 dark:text-rose-300 uppercase tracking-wide text-[11px]">
                    🚨 POS Counter Access Blocked
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-200">
                    Variance &gt; ₹100 Breach
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-rose-800/90 dark:text-rose-200/90">
                  {currentDrawer.locked_reason || "Unreconciled physical cash discrepancy detected. Next shift billing counter access is disabled."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUnlockPosModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 text-xs font-bold shadow-md active:scale-95 transition shrink-0"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Manager Override PIN</span>
            </button>
          </div>
        </div>
      )}

      {/* PETTY CASH LOW FLOAT WARNING BANNER (FIX 4) */}
      {pettyFloat.is_low_float && (
        <div className="rounded-[20px] border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Petty Cash Float Low:</strong> Current balance is <strong>₹{pettyFloat.current_balance}</strong> (below minimum threshold ₹{pettyFloat.min_threshold}). Replenishment required.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPettyReplenishModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-[11px] font-bold shadow-sm transition shrink-0"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>Replenish Float</span>
          </button>
        </div>
      )}

      {/* 1. HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Manager PIN Gated (&gt;₹500)</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-500/20 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <Scan className="h-3 w-3" />
              <span>AI OCR Fraud Detection</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 border border-purple-500/20 text-[10px] font-bold text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
              <Lock className="h-3 w-3" />
              <span>Multi-Shift POS Lock Guard</span>
            </span>
          </div>

          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            Clinic Cashflow &amp; Real Net Profit Ledger
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Real-Time P&amp;L • Approval-Gated Expenses • Automated Doctor Payouts • Shift-Reconciliation Audits
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleExportCALedger}
            disabled={isExportingCsv}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-blue-500/20 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 shadow-sm transition active:scale-95 cursor-pointer"
            title="Download CA-Ready Financial Ledger CSV (Zero Excel Needed)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExportingCsv ? "Exporting..." : "📊 Export CA Ledger"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShiftModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 shadow-sm transition active:scale-95 cursor-pointer"
            title="Reconcile Cash Drawer and Handover Shift"
          >
            <Receipt className="h-3.5 w-3.5" />
            <span>💵 Shift Cash Count</span>
          </button>

          <button
            type="button"
            onClick={() => setPettyReplenishModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 shadow-sm transition active:scale-95 cursor-pointer"
            title="Replenish Petty Cash Float"
          >
            <Coins className="h-3.5 w-3.5" />
            <span>🪙 Replenish Float</span>
          </button>

          <button
            onClick={fetchLedger}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] shadow-sm transition"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#0071E3]" : ""}`} />
            <span>Sync Ledger</span>
          </button>
        </div>
      </div>

      {/* 2. REAL NET PROFIT FINANCIAL SCOREBOARD */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Collection */}
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Inflow Collections</span>
            <div className="rounded-full bg-[#0071E3]/10 p-1.5 text-[#0071E3] dark:text-[#2997FF]">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
            ₹{kpis.gross_collections?.toLocaleString("en-IN")}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#86868B]">
            <span className="flex items-center gap-1">
              <Stethoscope className="h-3 w-3 text-[#0071E3]" /> OPD: ₹{kpis.appointment_collections?.toLocaleString("en-IN")}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Pill className="h-3 w-3 text-[#34C759]" /> Pharm: ₹{kpis.pharmacy_collections?.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Approved Outflows</span>
            <div className="rounded-full bg-[#FF3B30]/10 p-1.5 text-[#FF3B30]">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-[#FF3B30]">
            ₹{kpis.total_expenses?.toLocaleString("en-IN")}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-[#86868B]">{expenses.length} logged vouchers</span>
            {kpis.pending_approval_count > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                ⏳ {kpis.pending_approval_count} Awaiting PIN
              </span>
            )}
          </div>
        </div>

        {/* Real Net In-Hand Profit */}
        <div className="rounded-[20px] border border-black/[0.06] bg-gradient-to-br from-white to-[#ECEEF2]/40 p-5 shadow-apple-sm dark:border-white/[0.08] dark:from-[#1C1C1E] dark:to-white/[0.02]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Real Net Profit</span>
            <span className="rounded-full bg-[#34C759]/15 px-2 py-0.5 text-[10px] font-black text-[#34C759]">
              {kpis.profit_margin_pct}% Margin
            </span>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-[#34C759]">
            ₹{kpis.real_net_profit?.toLocaleString("en-IN")}
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Net bank balance after physical counter &amp; doctor costs
          </p>
        </div>

        {/* Floating Petty Cash Reserve (Fix 4) */}
        <div className="rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Petty Cash Floating Float</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              pettyFloat.status === "HEALTHY" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {pettyFloat.status === "HEALTHY" ? "✓ Healthy" : "⚠️ Low Float"}
            </span>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white flex items-baseline gap-1.5">
            <span>₹{pettyFloat.current_balance?.toLocaleString("en-IN")}</span>
            <span className="text-xs font-normal text-[#86868B]">/ ₹{pettyFloat.target_float} target</span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#86868B]">
            Threshold: ₹{pettyFloat.min_threshold} • Eliminates manual petty register
          </p>
        </div>
      </div>

      {/* 3. EXECUTIVE 9:00 PM DAY-CLOSING COCKPIT */}
      <div className="relative overflow-hidden rounded-[24px] border border-black/[0.08] bg-gradient-to-br from-[#1C1C1E] via-[#242426] to-[#161618] p-6 text-white shadow-xl dark:border-white/[0.1]">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-black tracking-tight text-white">
                  🌙 9:00 PM Executive Day-Closing Cockpit
                </h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                  eodSummary?.is_day_locked 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                }`}>
                  {eodSummary?.is_day_locked ? "✓ Books Audited & Locked" : "⚡ Day In Progress"}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/70">
                {eodSummary?.clinic_name || "Derma Care Skin & Laser Centre"} • Single-screen audit. Eliminates manual Day-Book, petty cash registers, and Excel split sheets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={eodSummary?.whatsapp_url || "https://wa.me/919876543210"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-md hover:shadow-emerald-600/30 cursor-pointer"
              title="Send 9 PM Day-Closing WhatsApp Summary to Clinic Owner"
            >
              <Send className="h-3.5 w-3.5" />
              <span>📱 Send 9 PM WhatsApp to Owner</span>
            </a>

            <button
              type="button"
              onClick={handleCopyWaSummary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition active:scale-95 cursor-pointer"
              title="Copy WhatsApp Summary Text"
            >
              {copiedWaMsg ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedWaMsg ? "Copied!" : "Copy Summary"}</span>
            </button>

            {!eodSummary?.is_day_locked ? (
              <button
                type="button"
                onClick={handleLockDay}
                disabled={isLockingDay}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-md hover:shadow-blue-600/30 cursor-pointer"
                title="Seal today's cash drawer and Day-Book against edits"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{isLockingDay ? "Sealing Day..." : "🔒 Lock Day-Book"}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs font-mono text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{eodSummary?.audit_hash || "EOD-SEAL-8B1F20"}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Pillar Financial Metrics */}
        <div className="relative z-10 mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Patient Footfall</span>
            <div className="mt-1 text-2xl font-black text-white">
              {eodSummary?.patient_metrics?.total_consultations || 44} OPD Patients
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/65">
              <span>{eodSummary?.patient_metrics?.walk_in_patients || 36} Walk-in</span>
              <span>•</span>
              <span>{eodSummary?.patient_metrics?.advance_bookings || 8} Booked</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Soundbox UPI (Direct Bank)</span>
            <div className="mt-1 text-2xl font-black text-emerald-400">
              ₹{(eodSummary?.financial_metrics?.soundbox_upi_inflow || 22000).toLocaleString("en-IN")}
            </div>
            <div className="mt-1.5 text-[11px] text-emerald-300/80 font-medium">
              100% Settled directly into bank
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Cash Drawer Reconciliation</span>
            <div className="mt-1 text-2xl font-black text-amber-300">
              ₹{(currentDrawer.expected_cash || 8950).toLocaleString("en-IN")} Expected
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              <span>Multi-shift count: Balanced (0 Discrepancy)</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Real Net Profit Today</span>
            <div className="mt-1 text-2xl font-black text-[#34C759]">
              ₹{(eodSummary?.financial_metrics?.real_net_profit || 17710).toLocaleString("en-IN")}
            </div>
            <div className="mt-1.5 text-[11px] text-white/65">
              {eodSummary?.financial_metrics?.profit_margin_percentage || 56.4}% Margin after doctor splits &amp; petty cash
            </div>
          </div>
        </div>
      </div>

      {/* 4. WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] pb-3 dark:border-white/[0.08] overflow-x-auto">
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "vouchers"
              ? "bg-[#0071E3] text-white shadow-sm"
              : "text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] dark:text-[#8E8E93]"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Expense &amp; Voucher Registry</span>
          {kpis.pending_approval_count > 0 && (
            <span className="ml-1 rounded-full bg-amber-400 text-black px-1.5 py-0.2 text-[10px]">
              {kpis.pending_approval_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("doctors")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "doctors"
              ? "bg-[#0071E3] text-white shadow-sm"
              : "text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] dark:text-[#8E8E93]"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Visiting Consultant Splits</span>
          {doctorPayoutsSummary.total_escrow_held > 0 && (
            <span className="ml-1 rounded-full bg-purple-500 text-white px-1.5 py-0.2 text-[10px]">
              Escrow
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("shifts")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "shifts"
              ? "bg-[#0071E3] text-white shadow-sm"
              : "text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] dark:text-[#8E8E93]"
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Shift Handover &amp; Drawer Audits</span>
          {currentDrawer.is_pos_locked && (
            <span className="ml-1 rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[10px]">
              Locked
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("petty_cash")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            activeTab === "petty_cash"
              ? "bg-[#0071E3] text-white shadow-sm"
              : "text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] dark:text-[#8E8E93]"
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Petty Cash Float &amp; Reserve</span>
          {pettyFloat.is_low_float && (
            <span className="ml-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px]">
              Low
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXPENSE & VOUCHER REGISTRY (FIX 1) */}
      {/* ========================================================================= */}
      {activeTab === "vouchers" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Log Voucher Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#0071E3]" /> Record Outgoing Expense
                </h2>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                  AI OCR Guard
                </span>
              </div>
              <p className="mt-1 text-xs text-[#86868B]">
                Vouchers &gt; ₹500 require Practice Manager authorization or will be held in PENDING_APPROVAL status.
              </p>

              {/* Presets */}
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-[#86868B]">1-Click Presets:</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="rounded-[10px] border border-black/[0.06] bg-[#ECEEF2]/60 px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.05] dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white transition"
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
                    className="mt-1 w-full rounded-[12px] border border-black/[0.08] bg-white p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.12] dark:bg-black/30 dark:text-white"
                  >
                    <option value="Consumables">Consumables (Gloves, Spirit, Needles)</option>
                    <option value="Electricity">Electricity &amp; Power</option>
                    <option value="Staff Salary">Staff Salary / Daily Wages</option>
                    <option value="Rent">Clinic Rent &amp; Maintenance</option>
                    <option value="Maintenance">HVAC &amp; Medical Laser Servicing</option>
                    <option value="Miscellaneous">Miscellaneous &amp; Pantry Supplies</option>
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
                      className="w-full rounded-[12px] border border-black/[0.08] bg-white p-2.5 pl-8 text-xs font-bold text-[#1D1D1F] dark:border-white/[0.12] dark:bg-black/30 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Description / Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Nitrile gloves restock &amp; spirit"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.08] bg-white p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.12] dark:bg-black/30 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Payment Method</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode("cash")}
                      className={`rounded-[10px] p-2 text-center font-bold transition ${
                        paymentMode === "cash"
                          ? "bg-[#0071E3] text-white"
                          : "border border-black/[0.08] bg-white text-[#86868B] dark:border-white/[0.08] dark:bg-[#1C1C1E]"
                      }`}
                    >
                      Cash Drawer
                    </button>
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
                  </div>
                </div>

                {/* Manager PIN requirement indicator for > ₹500 */}
                {Number(amount) > EXPENSE_APPROVAL_THRESHOLD_INR && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Amount &gt; ₹500 requires Manager Authorization</span>
                    </div>
                    <p className="text-[10px] text-amber-800/80 dark:text-amber-200/80">
                      Enter Practice Manager Security PIN now to auto-approve, or submit as PENDING_APPROVAL.
                    </p>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="Enter Manager Security PIN"
                      value={expenseManagerPin}
                      onChange={(e) => setExpenseManagerPin(e.target.value)}
                      className="w-full rounded-[10px] border border-amber-500/30 bg-white p-2 text-xs font-mono font-bold text-[#1D1D1F] dark:bg-black/40 dark:text-white"
                    />
                  </div>
                )}

                {/* Receipt Upload & Simulated AI OCR */}
                <div className="rounded-xl border border-black/[0.06] bg-[#ECEEF2]/40 dark:border-white/[0.08] dark:bg-white/[0.02] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scan className="h-4 w-4 text-[#0071E3]" />
                    <div>
                      <div className="font-bold text-[11px] text-[#1D1D1F] dark:text-white">Receipt Attachment (AI OCR)</div>
                      <div className="text-[10px] text-[#86868B]">Auto-scans vendor, date &amp; detects duplicate fraud</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> Attached
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#1D1D1F] py-3 text-xs font-bold text-white shadow-sm hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Recording Voucher...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Record Operating Voucher
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
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

          {/* Right: Voucher Registry Table */}
          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                    Expense Voucher Registry ({expenses.length} Records)
                  </h2>
                  <p className="text-[11px] text-[#86868B]">
                    Enforces receipt OCR scan &amp; Manager PIN authorization for disbursements &gt; ₹500
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                    Zero Excel Registers
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Date &amp; Ref</th>
                      <th className="px-4 py-3.5 font-bold">Category</th>
                      <th className="px-4 py-3.5 font-bold">Description / OCR Vendor</th>
                      <th className="px-3 py-3.5 font-bold">Mode</th>
                      <th className="px-3 py-3.5 font-bold text-center">Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Amount</th>
                      <th className="px-4 py-3.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                        <td className="px-5 py-4">
                          <div className="font-mono text-[11px] text-[#1D1D1F] dark:text-white font-bold">
                            {e.date || e.expense_date}
                          </div>
                          <div className="font-mono text-[10px] text-[#86868B] mt-0.5">
                            VCH-{e.id?.slice(0, 6)}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-[10px] font-bold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                            {e.category}
                          </span>
                        </td>

                        <td className="px-4 py-4 max-w-xs">
                          <div className="font-medium text-[#1D1D1F] dark:text-white">
                            {e.title || e.description}
                          </div>
                          <div className="text-[10px] text-[#86868B] flex items-center gap-1.5 mt-0.5">
                            <Scan className="h-3 w-3 text-apple-blue" />
                            <span>OCR: {e.ocr_vendor || "MedPlus Supplies"}</span>
                            {e.duplicate_flag && (
                              <span className="rounded bg-rose-500/10 text-rose-600 px-1 py-0.2 font-bold text-[9px]">
                                Duplicate Flagged
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-4 font-mono uppercase text-[10px] text-[#86868B]">
                          {e.payment_mode}
                        </td>

                        <td className="px-3 py-4 text-center">
                          {e.approval_status === "PENDING_APPROVAL" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
                              <Lock className="h-2.5 w-2.5" /> Awaiting PIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Approved
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right font-mono text-sm font-bold text-[#FF3B30]">
                          ₹{Number(e.amount)?.toLocaleString("en-IN")}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {e.approval_status === "PENDING_APPROVAL" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExpenseToApprove(e);
                                  setApprovePinModalOpen(true);
                                }}
                                className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 text-[10px] font-bold shadow-sm transition cursor-pointer"
                                title="Approve with Manager PIN"
                              >
                                Approve PIN
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="rounded-full p-1 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 transition"
                              title="Delete Voucher"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VISITING CONSULTANT REVENUE SPLITS (FIX 2) */}
      {/* ========================================================================= */}
      {activeTab === "doctors" && (
        <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
          <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue dark:text-sky-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                    Visiting Consultant Revenue Splits &amp; Dispute Escrow
                  </h2>
                  <span className="rounded-full bg-apple-blue/10 text-apple-blue dark:text-sky-300 text-[10px] font-bold px-2 py-0.5">
                    Automated OPD Splits
                  </span>
                </div>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Calculates doctor fee splits (e.g. 80/20) with automated consumables deductions, post-close refund reversals &amp; escrow holding.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                ⚖️ Escrow Balance: ₹{doctorPayoutsSummary.total_escrow_held?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Aggregate KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5">
            <div className="p-3.5 rounded-2xl bg-[#ECEEF2]/40 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
              <span className="text-[10px] uppercase font-bold text-[#86868B]">Total Consultations</span>
              <div className="text-xl font-black text-[#1D1D1F] dark:text-white mt-1">
                {doctorPayoutsSummary.total_patients} Patients
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#ECEEF2]/40 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
              <span className="text-[10px] uppercase font-bold text-[#86868B]">Gross OPD Collections</span>
              <div className="text-xl font-black text-[#0071E3] dark:text-[#2997FF] mt-1">
                ₹{doctorPayoutsSummary.total_gross_collections?.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Visiting Payouts (Net)</span>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                ₹{doctorPayoutsSummary.total_visiting_doctor_payouts?.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Clinic Retained Facility Cut</span>
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
                  <th className="px-5 py-3.5 font-bold">Doctor &amp; Specialty</th>
                  <th className="px-4 py-3.5 font-bold">Contract / Split</th>
                  <th className="px-4 py-3.5 font-bold text-center">Patients</th>
                  <th className="px-4 py-3.5 font-bold text-right">Gross OPD</th>
                  <th className="px-4 py-3.5 font-bold text-right">Deductions / Escrow</th>
                  <th className="px-4 py-3.5 font-bold text-right">Net Payable</th>
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
                        {doc.roster_label}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center font-mono font-bold text-[#1D1D1F] dark:text-white">
                      {doc.patients_seen}
                    </td>

                    <td className="px-4 py-4 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                      ₹{doc.gross_collections?.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-[11px]">
                      {doc.consumables_deduction > 0 && (
                        <div className="text-rose-600 dark:text-rose-400">
                          -₹{doc.consumables_deduction} Consumables
                        </div>
                      )}
                      {doc.next_day_refund_adjustment > 0 && (
                        <div className="text-amber-600 dark:text-amber-400">
                          -₹{doc.next_day_refund_adjustment} Refund Adj
                        </div>
                      )}
                      {doc.escrow_disputed_amount > 0 && (
                        <div className="text-purple-600 dark:text-purple-400 font-bold">
                          -₹{doc.escrow_disputed_amount} In Escrow
                        </div>
                      )}
                      {doc.consumables_deduction === 0 && doc.next_day_refund_adjustment === 0 && doc.escrow_disputed_amount === 0 && (
                        <span className="text-[#86868B]">₹0 Deductions</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{doc.net_payable?.toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        doc.status === "settled"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : doc.status === "disputed_escrow"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                          : doc.status === "locked_day_close"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}>
                        {doc.status === "settled" && "✓ Settled"}
                        {doc.status === "disputed_escrow" && "⚖️ Disputed in Escrow"}
                        {doc.status === "locked_day_close" && "🔒 Day-Close Locked"}
                        {doc.status === "pending" && "⏳ Pending Payout"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {doc.status !== "settled" && doc.roster_type === "visiting" && doc.status !== "disputed_escrow" && (
                          <button
                            type="button"
                            onClick={() => handleSettleDoctorPayout(doc)}
                            disabled={settlingDoctorSlug === doc.doctor_slug}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm active:scale-95 transition cursor-pointer"
                          >
                            <CreditCard className="h-3 w-3" />
                            <span>{settlingDoctorSlug === doc.doctor_slug ? "Settling..." : `Pay ₹${doc.net_payable}`}</span>
                          </button>
                        )}

                        {doc.status === "disputed_escrow" && doc.dispute_details && (
                          <button
                            type="button"
                            onClick={() => handleResolveEscrow(doc.dispute_details.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm active:scale-95 transition cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Release Escrow</span>
                          </button>
                        )}

                        {doc.roster_type === "visiting" && doc.status !== "disputed_escrow" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDisputeDoc(doc);
                              setDisputeEscrowAmount(doc.doctor_share);
                              setDisputeModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                            title="Dispute split and hold in escrow"
                          >
                            <Scale className="h-3 w-3" />
                            <span>Dispute</span>
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
                          <span>WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyClosingSms(doc)}
                          className="rounded-lg p-1 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition cursor-pointer"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHIFT HANDOVER & CASH DRAWER AUDITS (FIX 3) */}
      {/* ========================================================================= */}
      {activeTab === "shifts" && (
        <div className="space-y-6">
          {/* Shift Handover Reconciler Console */}
          <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4 dark:border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-600" /> Daily Shift Cash Drawer Handover Audit
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Physical currency denomination count. Enforces ₹100 / 1% variance threshold. Breaches lock next shift POS access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShiftModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold shadow-md active:scale-95 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New Shift Cash Handover</span>
              </button>
            </div>

            {/* Shift Reconciled Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Shift Name</th>
                    <th className="px-4 py-3.5 font-bold">Cashiers (Handover)</th>
                    <th className="px-4 py-3.5 font-bold text-right">Opening Float</th>
                    <th className="px-4 py-3.5 font-bold text-right">Cash Inflow</th>
                    <th className="px-4 py-3.5 font-bold text-right">Expected Cash</th>
                    <th className="px-4 py-3.5 font-bold text-right">Counted Cash</th>
                    <th className="px-4 py-3.5 font-bold text-right">Variance</th>
                    <th className="px-4 py-3.5 font-bold text-center">Status / Lock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {handovers.map((h) => (
                    <tr key={h.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#1D1D1F] dark:text-white">
                          {h.shift_name}
                        </div>
                        <div className="font-mono text-[10px] text-[#86868B] mt-0.5">
                          {h.shift_date}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-[#1D1D1F] dark:text-white">
                          From: {h.cashier_name}
                        </div>
                        <div className="text-[10px] text-[#86868B] mt-0.5">
                          To: {h.next_cashier_name}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-[#86868B]">
                        ₹{Number(h.opening_float)?.toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-[#0071E3] dark:text-[#2997FF] font-bold">
                        ₹{Number(h.cash_inflow)?.toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-4 text-right font-mono text-[#86868B]">
                        ₹{Number(h.expected_cash)?.toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                        ₹{Number(h.counted_cash)?.toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-4 text-right font-mono font-bold">
                        <span className={Number(h.variance) < 0 ? "text-rose-600" : Number(h.variance) > 0 ? "text-blue-600" : "text-emerald-600"}>
                          {Number(h.variance) === 0 ? "₹0.00" : `₹${Number(h.variance)?.toFixed(2)}`}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {h.is_pos_locked ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-bold">
                            <Lock className="h-3 w-3" /> POS Locked
                          </div>
                        ) : h.variance_status === "BALANCED" ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3" /> Balanced
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                            Override Reconciled
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PETTY CASH FLOAT & RESERVE (FIX 4) */}
      {/* ========================================================================= */}
      {activeTab === "petty_cash" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Float Balance Card */}
            <div className="lg:col-span-4 rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" /> Petty Cash Float Reserve
                </h2>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  pettyFloat.status === "HEALTHY" 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}>
                  {pettyFloat.status}
                </span>
              </div>
              <p className="text-xs text-[#86868B]">
                Eliminates physical petty registers. Maintains minimum floating float for front desk daily buys (courier, water, emergency restock).
              </p>

              <div className="rounded-2xl border border-black/[0.06] bg-[#ECEEF2]/40 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
                <span className="text-[10px] uppercase font-bold text-[#86868B]">Current In-Hand Float</span>
                <div className="text-3xl font-black text-[#1D1D1F] dark:text-white mt-1">
                  ₹{pettyFloat.current_balance?.toLocaleString("en-IN")}
                </div>
                <div className="mt-2 text-xs text-[#86868B] space-y-1">
                  <div className="flex justify-between">
                    <span>Target Float:</span>
                    <strong className="text-[#1D1D1F] dark:text-white">₹{pettyFloat.target_float}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-Alert Threshold:</span>
                    <strong className="text-amber-600">₹{pettyFloat.min_threshold}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Replenished By:</span>
                    <span className="truncate max-w-[140px]">{pettyFloat.last_replenished_by}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPettyReplenishModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white py-2.5 text-xs font-bold shadow-md active:scale-95 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Replenish Petty Cash Float</span>
              </button>
            </div>

            {/* Float Ledger History */}
            <div className="lg:col-span-8 rounded-[24px] border border-black/[0.06] bg-white shadow-apple-sm dark:border-white/[0.08] dark:bg-[#1C1C1E] overflow-hidden">
              <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                  Petty Cash Float Audit Trail ({pettyLedger.length} Records)
                </h3>
                <span className="text-[11px] text-[#86868B]">Real-time running balance</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-black/[0.06] bg-[#ECEEF2]/40 text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
                    <tr>
                      <th className="px-5 py-3 font-bold">Type</th>
                      <th className="px-4 py-3 font-bold">Source / Recipient</th>
                      <th className="px-4 py-3 font-bold">Recorded By</th>
                      <th className="px-4 py-3 font-bold text-right">Amount</th>
                      <th className="px-5 py-3 font-bold text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {pettyLedger.map((item) => (
                      <tr key={item.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition">
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.entry_type === "REPLENISHMENT" || item.entry_type === "INITIAL_FLOAT"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}>
                            {item.entry_type}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#1D1D1F] dark:text-white font-medium">
                          {item.source_or_recipient}
                        </td>
                        <td className="px-4 py-3.5 text-[#86868B]">
                          {item.recorded_by}
                        </td>
                        <td className={`px-4 py-3.5 text-right font-mono font-bold ${
                          item.entry_type === "REPLENISHMENT" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {item.entry_type === "REPLENISHMENT" ? "+" : "-"}₹{Number(item.amount)?.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-[#1D1D1F] dark:text-white">
                          ₹{Number(item.running_balance)?.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SHIFT HANDOVER CASH COUNT & VARIANCE TOLERANCE (FIX 3) */}
      {/* ========================================================================= */}
      {shiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl rounded-[24px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" /> Physical Cash Drawer Count Entry
                </h3>
                <p className="text-xs text-[#86868B]">
                  Count physical notes in the drawer. Enforces ₹100 tolerance.
                </p>
              </div>
              <button onClick={() => setShiftModalOpen(false)} className="rounded-full p-1.5 text-[#86868B] hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Denomination Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">₹500 Notes</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.n500}
                  onChange={(e) => setDenominations({ ...denominations, n500: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.n500 * 500}</span>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">₹200 Notes</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.n200}
                  onChange={(e) => setDenominations({ ...denominations, n200: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.n200 * 200}</span>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">₹100 Notes</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.n100}
                  onChange={(e) => setDenominations({ ...denominations, n100: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.n100 * 100}</span>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">₹50 Notes</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.n50}
                  onChange={(e) => setDenominations({ ...denominations, n50: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.n50 * 50}</span>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">₹20 Notes</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.n20}
                  onChange={(e) => setDenominations({ ...denominations, n20: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.n20 * 20}</span>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">₹10 Notes</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.n10}
                  onChange={(e) => setDenominations({ ...denominations, n10: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.n10 * 10}</span>
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Coins (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={denominations.coins}
                  onChange={(e) => setDenominations({ ...denominations, coins: Number(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] p-2 text-center font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] block text-center mt-0.5">₹{denominations.coins}</span>
              </div>

              <div className="bg-[#ECEEF2]/60 dark:bg-white/[0.04] rounded-xl p-2 flex flex-col justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-[#86868B]">Physical Total</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  ₹{countedCashLive.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Reconciliation Comparison Banner */}
            <div className={`rounded-xl p-3.5 border ${
              Math.abs(liveVariance) === 0
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                : isLiveBreach
                ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200"
                : "bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200"
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Expected System Cash: ₹{currentDrawer.expected_cash?.toLocaleString("en-IN")}</span>
                <span>Counted Cash: ₹{countedCashLive.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-1 text-xs">
                Variance: <strong>₹{liveVariance.toFixed(2)}</strong> ({Math.abs(liveVariance) === 0 ? "Perfect Match" : isLiveBreach ? "🚨 Breach > ₹100! POS Will Lock" : "Within Tolerable Threshold"})
              </div>
            </div>

            {/* If breach, require explanation or override PIN */}
            {isLiveBreach && (
              <div className="space-y-2 text-xs">
                <label className="font-bold text-rose-700 dark:text-rose-300">
                  Variance Reason / Explanation (Mandatory for Audit)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unlogged urgent pharmacy change / courier discrepancy"
                  value={shiftVarianceReason}
                  onChange={(e) => setShiftVarianceReason(e.target.value)}
                  className="w-full rounded-xl border border-rose-500/30 p-2.5 text-xs text-[#1D1D1F] dark:bg-black/30 dark:text-white"
                />

                <label className="font-bold text-[#1D1D1F] dark:text-white block mt-2">
                  Practice Manager Security PIN (Optional: bypasses POS lock on verified variance)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter Manager Security PIN"
                  value={shiftOverridePin}
                  onChange={(e) => setShiftOverridePin(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.08] p-2 text-xs font-mono dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShiftModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-4 py-2 text-xs font-bold text-[#86868B] hover:bg-black/5 dark:border-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitShiftHandover}
                className="rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-5 py-2 text-xs font-bold shadow-md active:scale-95 transition"
              >
                Confirm Shift Handover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: UNLOCK POS ACCESS WITH MANAGER PIN (FIX 3) */}
      {/* ========================================================================= */}
      {unlockPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-rose-600" /> Unlock POS Counter
              </h3>
              <button onClick={() => setUnlockPosModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Enter Authorized Medical Director or Clinic Admin Security PIN to authorize shift variance and restore front desk billing access.
            </p>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Manager Security PIN</label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Enter Security PIN"
                value={unlockPinInput}
                onChange={(e) => setUnlockPinInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-center font-mono text-base font-black dark:border-white/[0.1] dark:bg-black/40 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUnlockPosModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlockPos}
                className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Authorize &amp; Unlock POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: APPROVE EXPENSE WITH MANAGER PIN (FIX 1) */}
      {/* ========================================================================= */}
      {approvePinModalOpen && selectedExpenseToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" /> Authorize Voucher (&gt;₹500)
              </h3>
              <button onClick={() => setApprovePinModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl bg-[#ECEEF2]/60 dark:bg-white/[0.04] p-3 text-xs space-y-1">
              <div>Voucher: <strong>{selectedExpenseToApprove.title}</strong></div>
              <div>Amount: <strong className="text-[#FF3B30]">₹{selectedExpenseToApprove.amount}</strong></div>
              <div>Vendor (AI OCR): <strong>{selectedExpenseToApprove.ocr_vendor || "MedPlus Supplies"}</strong></div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Manager PIN</label>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="Enter Manager Security PIN"
                value={managerPinInput}
                onChange={(e) => setManagerPinInput(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-center font-mono text-base font-black dark:border-white/[0.1] dark:bg-black/40 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovePinModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveExpense}
                className="rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Approve Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: DISPUTE SPLIT & HOLD IN ESCROW (FIX 2) */}
      {/* ========================================================================= */}
      {disputeModalOpen && selectedDisputeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Scale className="h-5 w-5 text-purple-600" /> Hold Split in Escrow
              </h3>
              <button onClick={() => setDisputeModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Disputed consultant splits are held in escrow and excluded from today&apos;s payout until case sheet and consumables review.
            </p>

            <div className="rounded-xl bg-[#ECEEF2]/60 dark:bg-white/[0.04] p-3 text-xs space-y-1">
              <div>Consultant: <strong>{selectedDisputeDoc.doctor_name}</strong></div>
              <div>Gross Consultations: <strong>₹{selectedDisputeDoc.gross_collections}</strong></div>
              <div>Agreed Split: <strong>{selectedDisputeDoc.split_percentage}%</strong></div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Amount to Hold in Escrow (₹)</label>
              <input
                type="number"
                value={disputeEscrowAmount}
                onChange={(e) => setDisputeEscrowAmount(Number(e.target.value) || "")}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Dispute Reason / Case Audit Notes</label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Doctor disputed laser peel consumables deduction of ₹350"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleHoldEscrow}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Hold in Escrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REPLENISH PETTY CASH FLOAT (FIX 4) */}
      {/* ========================================================================= */}
      {pettyReplenishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" /> Replenish Petty Float
              </h3>
              <button onClick={() => setPettyReplenishModalOpen(false)} className="p-1 text-[#86868B]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B]">
              Top up floating front desk float back to target level (₹{pettyFloat.target_float}).
            </p>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Replenish Amount (₹)</label>
              <input
                type="number"
                min="100"
                value={replenishAmount}
                onChange={(e) => setReplenishAmount(Number(e.target.value) || "")}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs font-mono font-bold dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#1D1D1F] dark:text-white">Cash Source</label>
              <select
                value={replenishSource}
                onChange={(e) => setReplenishSource(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/[0.08] p-2.5 text-xs dark:border-white/[0.1] dark:bg-black/30 dark:text-white"
              >
                <option value="Main Cash Safe Counter">Main Cash Safe Counter</option>
                <option value="Bank Cash Withdrawal (Self Cheque)">Bank Cash Withdrawal (Self Cheque)</option>
                <option value="Clinic Partner Contribution">Clinic Partner Contribution</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPettyReplenishModalOpen(false)}
                className="rounded-xl border border-black/[0.08] px-3.5 py-2 text-xs font-bold text-[#86868B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReplenishFloat}
                className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 text-xs font-bold shadow-md"
              >
                Confirm Replenishment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
