"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  FileCheck2, 
  Clock, 
  IndianRupee, 
  Plus, 
  Search, 
  User, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  X,
  CreditCard,
  Send,
  AlertTriangle,
  FileText,
  FileQuestion,
  Lock,
  Unlock,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Ban,
  CheckSquare,
  Square,
  UploadCloud,
  FileSpreadsheet
} from "lucide-react";

import {
  PROCEDURE_CATALOG,
  ProcedurePackage,
  FINANCE_OVERRIDE_REASON_CODES,
  AUTHORIZED_FINANCE_PINS,
  IRDAI_DEDUCTION_REASON_CODES,
  calculateQuerySla,
  MandatoryDocumentItem,
  TpaQueryData,
  SettlementData
} from "@/data/insuranceGovernance";

interface InsuranceClaim {
  id: string;
  claim_number: string;
  patient_name: string;
  patient_phone: string;
  policy_number: string;
  tpa_company: string;
  procedure_code: string;
  procedure_name: string;
  package_rate_cap: number;
  package_rate_overrun: boolean;
  package_override_pin: string | null;
  package_override_reason: string | null;
  package_override_by: string | null;
  bed_id: string | null;
  bed_number: string | null;
  ward_name: string | null;
  estimated_amount: number;
  approved_amount: number;
  status: "draft" | "pre_auth_submitted" | "under_review" | "query_raised" | "approved" | "settled" | "rejected";
  approval_ref: string | null;
  submission_date: string;
  remarks: string | null;
  mandatory_docs_checklist: MandatoryDocumentItem[];
  tpa_query_details: TpaQueryData;
  settlement_details: SettlementData;
  audit_trail: Array<{ action: string; timestamp: string; by: string; notes: string }>;
  sla_info?: ReturnType<typeof calculateQuerySla> | null;
  docs_summary?: { total: number; verified: number; is_complete: boolean };
}

const POPULAR_TPAS = [
  "Star Health & Allied Insurance",
  "HDFC ERGO General Insurance",
  "ICICI Lombard General Insurance",
  "Care Health Insurance (Religare)",
  "Niva Bupa Health Insurance (Max Bupa)",
  "Medi Assist TPA",
  "Paramount Health Services TPA",
  "Bajaj Allianz General Insurance",
  "Tata AIG General Insurance",
  "Aditya Birla Health Insurance"
];

export default function InsuranceDashboardPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pre_auth: 0,
    query_raised: 0,
    approved: 0,
    settled: 0,
    total_approved_amount: 0,
    sla_breached_count: 0,
    disputed_count: 0,
    total_remitted_amount: 0
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [newClaimModal, setNewClaimModal] = useState(false);
  const [queryModalClaim, setQueryModalClaim] = useState<InsuranceClaim | null>(null);
  const [settleModalClaim, setSettleModalClaim] = useState<InsuranceClaim | null>(null);

  // New Claim Form State
  const [ptName, setPtName] = useState("");
  const [ptPhone, setPtPhone] = useState("+91 ");
  const [policyNo, setPolicyNo] = useState("");
  const [selectedTpa, setSelectedTpa] = useState(POPULAR_TPAS[0]);
  const [selectedProcCode, setSelectedProcCode] = useState(PROCEDURE_CATALOG[0].code);
  const [estAmount, setEstAmount] = useState<string>(String(PROCEDURE_CATALOG[0].tpa_rate_caps[POPULAR_TPAS[0]] || 25000));
  const [claimRemarks, setClaimRemarks] = useState("");
  const [formChecklist, setFormChecklist] = useState<MandatoryDocumentItem[]>(
    PROCEDURE_CATALOG[0].mandatory_documents.map(d => ({ ...d, verified: false }))
  );
  const [overridePin, setOverridePin] = useState("");
  const [overrideReason, setOverrideReason] = useState(FINANCE_OVERRIDE_REASON_CODES[0].code);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Query Response State
  const [queryResponseText, setQueryResponseText] = useState("");
  const [queryResponder, setQueryResponder] = useState("Dr. Arvind Shenoy (Cardiology Consultant)");
  const [queryEvidence, setQueryEvidence] = useState("Clinical indoor chart + daily vitals progress sheet attached");
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Settlement Reconciliation Form State
  const [utrNumber, setUtrNumber] = useState("");
  const [remittanceDate, setRemittanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [remittedAmount, setRemittedAmount] = useState<string>("");
  const [reconciledBy, setReconciledBy] = useState("Suresh Rawat (Finance Head)");
  const [deductionRows, setDeductionRows] = useState<Array<{ code: string; reason: string; amount: number; disputed: boolean; appeal_notes?: string }>>([]);
  const [submittingSettle, setSubmittingSettle] = useState(false);

  const activeProcedure = PROCEDURE_CATALOG.find(p => p.code === selectedProcCode) || PROCEDURE_CATALOG[0];
  const negotiatedCap = activeProcedure.tpa_rate_caps[selectedTpa] || 25000;
  const numEstAmount = parseFloat(estAmount) || 0;
  const isOverrun = numEstAmount > negotiatedCap;
  const overrunDiff = Math.max(0, numEstAmount - negotiatedCap);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/insurance/claims?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [filterStatus]);

  // Update procedure-dependent defaults in New Claim Modal
  const handleProcedureChange = (code: string) => {
    setSelectedProcCode(code);
    const proc = PROCEDURE_CATALOG.find(p => p.code === code);
    if (proc) {
      const cap = proc.tpa_rate_caps[selectedTpa] || 25000;
      setEstAmount(String(cap));
      setFormChecklist(proc.mandatory_documents.map(d => ({ ...d, verified: false })));
      setSubmitError(null);
    }
  };

  const handleTpaChange = (tpa: string) => {
    setSelectedTpa(tpa);
    const cap = activeProcedure.tpa_rate_caps[tpa] || 25000;
    setEstAmount(String(cap));
    setSubmitError(null);
  };

  const toggleChecklistDoc = (docId: string) => {
    setFormChecklist(prev => prev.map(d => d.id === docId ? { ...d, verified: !d.verified } : d));
  };

  // Direct In-Line Document Verification
  const verifyDocInClaim = async (claimId: string, docId: string) => {
    try {
      const res = await fetch(`/api/insurance/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_doc",
          doc_id: docId,
          verified_by: "TPA Desk Officer"
        })
      });
      if (res.ok) {
        showToast("Clinical document verified and recorded in audit log.");
        await fetchClaims();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Pre-Auth from Draft / Incomplete State
  const submitPreAuthDossier = async (claim: InsuranceClaim) => {
    try {
      const missing = (claim.mandatory_docs_checklist || []).filter(d => d.is_mandatory && !d.verified);
      if (missing.length > 0) {
        alert(`Cannot submit pre-auth: Missing verified records (${missing.map(d => d.label).join(", ")}). Verify all mandatory documents first.`);
        return;
      }

      const res = await fetch(`/api/insurance/claims/${claim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_pre_auth",
          package_override_pin: claim.package_override_pin,
          package_override_reason: claim.package_override_reason
        })
      });

      if (res.ok) {
        showToast("Pre-auth dossier validated & submitted to TPA.");
        await fetchClaims();
      } else {
        const err = await res.json();
        alert(err.error || "Submission failed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create New Claim (Save Draft or Submit)
  const handleCreateClaim = async (asDraft: boolean) => {
    setSubmitError(null);
    if (!ptName || !ptPhone || !policyNo) {
      setSubmitError("Please fill all mandatory patient & policy fields.");
      return;
    }

    if (!asDraft) {
      const missingDocs = formChecklist.filter(d => d.is_mandatory && !d.verified);
      if (missingDocs.length > 0) {
        setSubmitError(`Submission Blocked: ${missingDocs.length} mandatory clinical documents are unverified. Complete the checklist or Save as Draft.`);
        return;
      }

      if (isOverrun && !overridePin) {
        setSubmitError(`Package Overrun: Estimate exceeds agreed cap of ₹${negotiatedCap.toLocaleString()} by ₹${overrunDiff.toLocaleString()}. Finance Head PIN is mandatory.`);
        return;
      }
    }

    setSubmittingClaim(true);
    try {
      const res = await fetch("/api/insurance/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: ptName,
          patient_phone: ptPhone,
          policy_number: policyNo,
          tpa_company: selectedTpa,
          procedure_code: selectedProcCode,
          estimated_amount: numEstAmount,
          remarks: claimRemarks,
          mandatory_docs_checklist: formChecklist,
          package_override_pin: isOverrun ? overridePin : null,
          package_override_reason: isOverrun ? overrideReason : null,
          as_draft: asDraft
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to create claim");
        return;
      }

      setNewClaimModal(false);
      resetNewClaimForm();
      showToast(asDraft ? "Draft saved successfully." : "Pre-authorization submitted to TPA.");
      await fetchClaims();
    } catch (e: any) {
      setSubmitError(e.message || "Failed to connect to server");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const resetNewClaimForm = () => {
    setPtName("");
    setPtPhone("+91 ");
    setPolicyNo("");
    setClaimRemarks("");
    setOverridePin("");
    setSubmitError(null);
  };

  // Submit Query Response
  const handleResolveQuery = async () => {
    if (!queryModalClaim || !queryResponseText) return;
    setSubmittingQuery(true);
    try {
      const res = await fetch(`/api/insurance/claims/${queryModalClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond_query",
          response_text: queryResponseText,
          responded_by: queryResponder,
          dispute_evidence: queryEvidence
        })
      });
      if (res.ok) {
        setQueryModalClaim(null);
        setQueryResponseText("");
        showToast("Clinical clarification & evidence transmitted to TPA.");
        await fetchClaims();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to respond to query");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingQuery(false);
    }
  };

  // Settle Remittance Reconciliation
  const handleSettleReconciliation = async () => {
    if (!settleModalClaim || !utrNumber || !remittedAmount) {
      alert("Please provide UTR Number and Remitted Amount.");
      return;
    }

    setSubmittingSettle(true);
    try {
      const res = await fetch(`/api/insurance/claims/${settleModalClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reconcile_settlement",
          utr_number: utrNumber,
          remittance_date: remittanceDate,
          remitted_amount: parseFloat(remittedAmount),
          deductions: deductionRows,
          reconciled_by: reconciledBy
        })
      });

      if (res.ok) {
        setSettleModalClaim(null);
        setUtrNumber("");
        setRemittedAmount("");
        setDeductionRows([]);
        showToast("Remittance reconciled and posted to billing ledger.");
        await fetchClaims();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to reconcile settlement");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingSettle(false);
    }
  };

  const addDeductionRow = (code: string) => {
    const template = IRDAI_DEDUCTION_REASON_CODES.find(c => c.code === code);
    setDeductionRows(prev => [
      ...prev,
      {
        code,
        reason: template?.label || code,
        amount: 1500,
        disputed: false,
        appeal_notes: ""
      }
    ]);
  };

  const removeDeductionRow = (index: number) => {
    setDeductionRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateDeductionRow = (index: number, field: string, val: any) => {
    setDeductionRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: val } : row));
  };

  const filteredClaims = claims.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.patient_name.toLowerCase().includes(q) ||
      c.policy_number.toLowerCase().includes(q) ||
      c.claim_number.toLowerCase().includes(q) ||
      c.tpa_company.toLowerCase().includes(q) ||
      (c.procedure_name || "").toLowerCase().includes(q)
    );
  });

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>IRDAI &amp; GIPSA Governed</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Zero-Leakage Assurance</span>
            </span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            TPA &amp; Cashless Insurance Desk
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Validated Pre-Authorization • Package Rate Governance • SLA-Tracked Queries • Automated Settlement Reconciliation
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchClaims()}
            className="flex items-center gap-1.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition shadow-apple-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#0071E3]" : "text-[#86868B] dark:text-[#8E8E93]"}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => {
              resetNewClaimForm();
              handleProcedureChange(PROCEDURE_CATALOG[0].code);
              setNewClaimModal(true);
            }}
            className="flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Pre-Auth Requisition</span>
          </button>
        </div>
      </div>

      {/* 4 Pillars Governance Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1">
            <CheckSquare className="h-4 w-4" />
            <span>Pre-Auth Validation</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Mandatory clinical document checklist per procedure code. Zero incomplete dossiers submitted.
          </p>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs mb-1">
            <Scale className="h-4 w-4" />
            <span>Package Rate Governance</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Real-time validation against agreed corporate caps. Overruns require Finance Head PIN + Reason.
          </p>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs mb-1">
            <Clock className="h-4 w-4" />
            <span>Query SLA Resolution</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Strict 24h countdown. Auto-escalation to Billing Mgr (24h) and Practice Admin (48h) with Risk Score.
          </p>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs mb-1">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Settlement Reconciliation</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Remittance UTR matched against approvals. IRDAI deduction codes, dispute queue &amp; ledger credit.
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Total Dossiers</span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">{metrics.total}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Pre-Auth / Review</span>
          <div className="text-xl sm:text-2xl font-black text-[#0071E3] dark:text-[#2997FF] mt-1">{metrics.pre_auth}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Active Queries
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{metrics.query_raised}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            SLA Breached
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{metrics.sla_breached_count}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Approved Sanctions</span>
          <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
            ₹{metrics.total_approved_amount.toLocaleString()}
          </div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400">Dispute Queue</span>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{metrics.disputed_count}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06] overflow-x-auto w-full md:w-auto">
          {[
            { id: "all", label: "All Claims" },
            { id: "pre_auth_submitted", label: "Pre-Auth In Flight" },
            { id: "query_raised", label: "Queries (Action Req.)" },
            { id: "approved", label: "Approved (Pending Remittance)" },
            { id: "settled", label: "Reconciled Settlements" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`rounded-[10px] px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition ${
                filterStatus === tab.id
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] dark:text-[#8E8E93]" />
          <input
            type="text"
            placeholder="Search patient, policy, procedure..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[14px] text-xs text-[#1D1D1F] dark:text-white placeholder-[#86868B] dark:placeholder-[#8E8E93] focus:outline-none focus:border-[#0071E3] shadow-apple-sm"
          />
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-[#86868B] dark:text-[#8E8E93] shadow-apple-sm">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#0071E3] mb-3" />
            <span className="text-xs font-medium">Loading governed cashless dossiers...</span>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-16 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-[#86868B] dark:text-[#8E8E93] shadow-apple-sm">
            <ShieldCheck className="h-10 w-10 mx-auto text-[#86868B] dark:text-[#8E8E93] mb-3" />
            <span className="text-xs font-medium">No insurance claims found matching current criteria.</span>
          </div>
        ) : (
          filteredClaims.map((c) => {
            const queryData = c.tpa_query_details || {};
            const settleData = c.settlement_details || {};
            const docs = c.mandatory_docs_checklist || [];
            const verifiedDocsCount = docs.filter(d => d.verified).length;
            const isDocsComplete = docs.length > 0 && verifiedDocsCount === docs.length;
            const isExpanded = expandedClaimId === c.id;

            return (
              <div 
                key={c.id}
                className="rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-apple-sm hover:shadow-apple-md transition"
              >
                {/* Top Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="px-3 py-1.5 rounded-[10px] bg-[#ECEEF2] dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06] font-mono text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">
                      {c.claim_number}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1D1D1F] dark:text-white text-base">{c.patient_name}</h3>
                        <span className="text-xs text-[#86868B] dark:text-[#8E8E93] font-medium">({c.patient_phone})</span>
                      </div>
                      <div className="text-xs text-[#86868B] dark:text-[#8E8E93] flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-[#1D1D1F] dark:text-slate-200">{c.tpa_company}</span>
                        <span>•</span>
                        <span>Policy: <strong className="font-mono text-[#1D1D1F] dark:text-slate-200">{c.policy_number}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Badges */}
                    {c.status === "draft" && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 text-xs font-bold">
                        Draft (Incomplete)
                      </span>
                    )}
                    {(c.status === "pre_auth_submitted" || c.status === "under_review") && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30 text-xs font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Pre-Auth Under Review
                      </span>
                    )}
                    {c.status === "query_raised" && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Query Active (Action Req.)
                      </span>
                    )}
                    {c.status === "approved" && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Pre-Auth Approved
                      </span>
                    )}
                    {c.status === "settled" && (
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Settlement Reconciled
                      </span>
                    )}

                    {/* Package Rate Overrun Indicator */}
                    {c.package_rate_overrun && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1">
                        <Scale className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Rate Overrun (Authorized)
                      </span>
                    )}

                    <button
                      onClick={() => setExpandedClaimId(isExpanded ? null : c.id)}
                      className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white rounded-[10px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition ml-2"
                      title={isExpanded ? "Collapse Details" : "Expand Details"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3.5 text-xs">
                  <div>
                    <span className="text-[#86868B] dark:text-[#8E8E93] block mb-1 font-medium">Clinical Procedure &amp; Package:</span>
                    <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                      <span className="font-mono text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 px-1.5 py-0.5 rounded-[6px]">
                        {c.procedure_code || "PROC-EMERGENCY"}
                      </span>
                      <span className="truncate">{c.procedure_name || "Emergency Medical IPD"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[#86868B] dark:text-[#8E8E93] block mb-1 font-medium">Tariff Governance:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#1D1D1F] dark:text-slate-200">
                        Est: <strong className="font-bold">₹{c.estimated_amount.toLocaleString()}</strong>
                      </span>
                      <span className="text-[#86868B]">/</span>
                      <span className="text-[#86868B] dark:text-[#8E8E93]">
                        Cap: <strong className="text-[#1D1D1F] dark:text-slate-200 font-semibold">₹{c.package_rate_cap.toLocaleString()}</strong>
                      </span>
                      {c.approved_amount > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-1 font-bold">
                          (Sanction: ₹{c.approved_amount.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#86868B] dark:text-[#8E8E93] block mb-1 font-medium">Mandatory Record Checklist:</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isDocsComplete 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" 
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                      }`}>
                        {verifiedDocsCount}/{docs.length} Records Verified
                      </span>
                      {isDocsComplete ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Dossier
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px] font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" /> Submission Halted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTIVE QUERY SLA RADAR (Fix 3) */}
                {c.status === "query_raised" && c.sla_info && (
                  <div className={`mt-2 p-3.5 rounded-[14px] border ${
                    c.sla_info.escalationTier === "admin_critical"
                      ? "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/60"
                      : c.sla_info.escalationTier === "manager_escalation"
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/60"
                      : "bg-[#F5F5F7] border-black/[0.06] dark:bg-[#2C2C2E] dark:border-white/[0.08]"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${
                            c.sla_info.escalationTier === "admin_critical" 
                              ? "text-rose-600 dark:text-rose-400 animate-bounce" 
                              : "text-amber-600 dark:text-amber-400"
                          }`} />
                          <span className="font-bold text-[#1D1D1F] dark:text-white text-xs uppercase tracking-wide">
                            {c.sla_info.statusLabel}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                            c.sla_info.riskLevel === "critical" 
                              ? "bg-rose-600 text-white" 
                              : c.sla_info.riskLevel === "high"
                              ? "bg-amber-500 text-black font-black"
                              : "bg-[#0071E3] text-white"
                          }`}>
                            Rejection Risk: {c.sla_info.riskScore}%
                          </span>
                        </div>
                        <p className="text-xs text-[#1D1D1F] dark:text-slate-300 mt-1 italic">
                          "{queryData.query_text || "Clinical justification requested by TPA medical referee."}"
                        </p>
                        <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-1 flex items-center gap-3">
                          <span>Assigned: <strong className="text-[#1D1D1F] dark:text-white">{queryData.assigned_to || "TPA Desk"}</strong></span>
                          <span>•</span>
                          <span>Elapsed: <strong className="text-[#1D1D1F] dark:text-white">{c.sla_info.hoursElapsed} hrs</strong> (24h SLA)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setQueryModalClaim(c);
                          setQueryResponseText("");
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-[10px] text-xs transition shrink-0 shadow-sm"
                      >
                        Resolve Query &amp; Attach Evidence
                      </button>
                    </div>
                  </div>
                )}

                {/* SETTLEMENT & RECONCILIATION SUMMARY (Fix 4) */}
                {c.status === "settled" && settleData.is_reconciled && (
                  <div className="mt-2 p-3.5 rounded-[14px] bg-purple-50/70 border border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/40 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold">
                          <FileSpreadsheet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          Remittance Reconciled (UTR: <span className="font-mono text-[#1D1D1F] dark:text-white">{settleData.utr_number}</span>)
                          {settleData.posted_to_ledger && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2 py-0.5 rounded-[6px] font-bold">
                              ✓ Credited to Bed Ledger
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[#86868B] dark:text-[#8E8E93] mt-1.5">
                          <span>Approved: <strong className="text-[#1D1D1F] dark:text-white font-bold">₹{settleData.approved_amount?.toLocaleString()}</strong></span>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Net Remitted: ₹{settleData.remitted_amount?.toLocaleString()}</span>
                          <span>•</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">Shortfall: ₹{settleData.shortfall_amount?.toLocaleString()}</span>
                        </div>
                      </div>

                      {settleData.dispute_status === "dispute_queued" && (
                        <span className="px-2.5 py-1 rounded-[8px] bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800">
                          Disputed Deductions in Grievance Queue
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* PACKAGE OVERRUN ALERT BANNER (Fix 2) */}
                {c.package_rate_overrun && (
                  <div className="mt-2 p-2.5 rounded-[12px] bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        Package Rate Cap Exceeded: Authorized by <strong>{c.package_override_by || "Finance Head"}</strong> with Reason: <em>"{c.package_override_reason || "COMORBIDITY_HIGH_RISK"}"</em>
                      </span>
                    </div>
                    <span className="font-mono text-[#86868B] dark:text-[#8E8E93] text-[10px] font-semibold">PIN AUDITED</span>
                  </div>
                )}

                {/* EXPANDABLE DRILLDOWN DRAWER */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-4">
                    {/* Mandatory Document Checklist */}
                    <div>
                      <h4 className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                        Mandatory Clinical Records Checklist ({c.procedure_code})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {docs.map(doc => (
                          <div 
                            key={doc.id}
                            className={`p-3 rounded-[14px] border text-xs flex items-center justify-between gap-3 ${
                              doc.verified 
                                ? "bg-[#F5F5F7] dark:bg-[#2C2C2E] border-emerald-500/30 text-[#1D1D1F] dark:text-white" 
                                : "bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/60 border-amber-500/30 text-[#86868B] dark:text-[#8E8E93]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {doc.verified ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                              )}
                              <div>
                                <div className="font-bold text-[#1D1D1F] dark:text-white">{doc.label}</div>
                                {doc.verified && (
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                                    Verified by {doc.verified_by || "TPA Officer"} {doc.file_name ? `• ${doc.file_name}` : ""}
                                  </div>
                                )}
                              </div>
                            </div>

                            {!doc.verified && (
                              <button
                                onClick={() => verifyDocInClaim(c.id, doc.id)}
                                className="px-2.5 py-1 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[8px] text-[11px] font-bold transition shrink-0 shadow-sm"
                              >
                                Verify Document
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Audit Trail */}
                    <div>
                      <h4 className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Clinical &amp; Regulatory Audit Trail
                      </h4>
                      <div className="rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] p-3.5 border border-black/[0.04] dark:border-white/[0.06] space-y-2 text-xs">
                        {(c.audit_trail || []).map((entry, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 border-b border-black/[0.04] dark:border-white/[0.06] pb-2 last:border-0 last:pb-0">
                            <span className="font-mono text-[10px] text-[#86868B] dark:text-[#8E8E93] shrink-0 mt-0.5">
                              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div>
                              <span className="font-bold text-[#1D1D1F] dark:text-white font-mono text-[11px]">{entry.action}</span>
                              <span className="text-[#86868B] dark:text-[#8E8E93] text-[11px]"> by {entry.by}</span>
                              <div className="text-[#86868B] dark:text-[#8E8E93] text-[11px] mt-0.5">{entry.notes}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {c.status === "draft" && (
                        <button
                          onClick={() => submitPreAuthDossier(c)}
                          className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold rounded-[12px] text-xs shadow-sm transition"
                        >
                          Validate Dossier &amp; Submit Pre-Auth
                        </button>
                      )}

                      {c.status === "approved" && (
                        <button
                          onClick={() => {
                            setSettleModalClaim(c);
                            setUtrNumber("");
                            setRemittedAmount(String(c.approved_amount));
                            setDeductionRows([]);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-[12px] text-xs shadow-sm transition flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Reconcile Remittance Advice (UTR)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW PRE-AUTH REQUISITION (APPLE OS UNIFORMITY)                   */}
      {/* ========================================================================= */}
      {newClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-black text-[#1D1D1F] dark:text-white text-base">New Cashless Pre-Authorization Requisition</h3>
              </div>
              <button 
                onClick={() => setNewClaimModal(false)} 
                className="p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {submitError && (
                <div className="p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Validation Blocked:</strong>
                    {submitError}
                  </div>
                </div>
              )}

              {/* Patient & Policy Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Patient Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Pant"
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Patient Phone *</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={ptPhone}
                    onChange={(e) => setPtPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              {/* TPA & Policy Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Payor / TPA Organization *</label>
                  <select
                    value={selectedTpa}
                    onChange={(e) => handleTpaChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-semibold focus:outline-none focus:border-[#0071E3]"
                  >
                    {POPULAR_TPAS.map(tpa => (
                      <option key={tpa} value={tpa}>{tpa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Health Policy / UHID No *</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-STAR-992810"
                    value={policyNo}
                    onChange={(e) => setPolicyNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-mono font-bold focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              {/* Procedure Code */}
              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">
                  Procedure &amp; Corporate Package Specification *
                </label>
                <select
                  value={selectedProcCode}
                  onChange={(e) => handleProcedureChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-bold focus:outline-none focus:border-[#0071E3]"
                >
                  {PROCEDURE_CATALOG.map(proc => (
                    <option key={proc.code} value={proc.code}>
                      [{proc.code}] {proc.name} — ({proc.category}, Est. {proc.default_stay_days}d stay)
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Rate Governance Box */}
              <div className="p-4 rounded-[16px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1D1D1F] dark:text-white">Agreed Tariff Compliance &amp; Cap:</span>
                  <span className="font-mono text-sm text-[#0071E3] dark:text-[#2997FF] font-black">
                    Agreed Cap: ₹{negotiatedCap.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-[#86868B] dark:text-[#8E8E93] mb-1 font-semibold">Estimated Admission Cost (₹) *</label>
                  <input
                    type="number"
                    value={estAmount}
                    onChange={(e) => setEstAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-black text-sm focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                {isOverrun && (
                  <div className="p-3.5 rounded-[12px] bg-amber-50 border border-amber-300 dark:bg-amber-950/30 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2.5">
                    <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      PACKAGE RATE OVERRUN DETECTED (+₹{overrunDiff.toLocaleString()})
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Estimated ₹{numEstAmount.toLocaleString()} exceeds negotiated {selectedTpa} agreed tariff of ₹{negotiatedCap.toLocaleString()}. Insurer will disallow this difference unless approved by Finance Head with valid Clinical Reason Code.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-[#1D1D1F] dark:text-white mb-1">
                          Finance Head PIN (e.g. FIN-9921 or 8842) *
                        </label>
                        <input
                          type="password"
                          placeholder="Enter Finance PIN"
                          value={overridePin}
                          onChange={(e) => setOverridePin(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-amber-500/50 rounded-[10px] text-[#1D1D1F] dark:text-white font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#1D1D1F] dark:text-white mb-1">
                          Override Reason Code *
                        </label>
                        <select
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#1C1C1E] border border-amber-500/50 rounded-[10px] text-[#1D1D1F] dark:text-white text-[11px] font-semibold"
                        >
                          {FINANCE_OVERRIDE_REASON_CODES.map(r => (
                            <option key={r.code} value={r.code}>{r.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Document Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[#1D1D1F] dark:text-white font-bold uppercase tracking-wider text-[11px]">
                    Mandatory Dossier Checklist ({activeProcedure.code})
                  </label>
                  <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-semibold">
                    {formChecklist.filter(d => d.verified).length} of {formChecklist.length} Verified
                  </span>
                </div>

                <div className="space-y-2 bg-[#F5F5F7] dark:bg-[#2C2C2E] p-3.5 rounded-[16px] border border-black/[0.04] dark:border-white/[0.06]">
                  {formChecklist.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => toggleChecklistDoc(doc.id)}
                      className={`p-3 rounded-[12px] border text-xs flex items-center justify-between gap-3 cursor-pointer select-none transition ${
                        doc.verified 
                          ? "bg-white dark:bg-[#1C1C1E] border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-sm" 
                          : "bg-white/60 dark:bg-[#1C1C1E]/60 border-black/[0.06] dark:border-white/[0.08] text-[#1D1D1F] dark:text-slate-300 hover:border-black/[0.12]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {doc.verified ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-[#86868B] dark:text-[#8E8E93] shrink-0" />
                        )}
                        <span className="font-semibold">{doc.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-[6px] font-bold ${
                        doc.verified 
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" 
                          : "bg-[#ECEEF2] text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]"
                      }`}>
                        {doc.verified ? "Verified ✓" : "Required"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Clinical Remarks &amp; Admission Notes</label>
                <textarea
                  rows={2}
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                  placeholder="Clinical presentation, provisional diagnosis, planned intervention..."
                  className="w-full px-3.5 py-2 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCreateClaim(true)}
                disabled={submittingClaim}
                className="px-4 py-2 bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white rounded-[12px] text-xs font-bold shadow-sm transition hover:bg-black/[0.02]"
              >
                Save as Draft Dossier
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewClaimModal(false)}
                  className="px-3.5 py-2 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateClaim(false)}
                  disabled={submittingClaim}
                  className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-[12px] text-xs font-bold shadow-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {submittingClaim ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Validate &amp; Submit Pre-Auth
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUERY RESOLUTION SLA CONSOLE (APPLE UNIFORMITY)                  */}
      {/* ========================================================================= */}
      {queryModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[24px] w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516]">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-black text-[#1D1D1F] dark:text-white text-base">TPA Query Resolution Console (24h SLA)</h3>
              </div>
              <button 
                onClick={() => setQueryModalClaim(null)} 
                className="p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06]">
                <div className="text-[#86868B] dark:text-[#8E8E93] text-[11px] mb-1 font-medium">
                  Query from <strong>{queryModalClaim.tpa_company}</strong> for Claim #{queryModalClaim.claim_number}:
                </div>
                <div className="font-semibold text-[#1D1D1F] dark:text-white text-xs italic">
                  "{queryModalClaim.tpa_query_details?.query_text || "Clinical justification requested."}"
                </div>
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">
                  Attending Doctor Clinical Clarification *
                </label>
                <textarea
                  rows={4}
                  value={queryResponseText}
                  onChange={(e) => setQueryResponseText(e.target.value)}
                  placeholder="State clinical justification, onset of symptoms, pre-operative investigations..."
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Attending Clinician Sign-Off</label>
                <input
                  type="text"
                  value={queryResponder}
                  onChange={(e) => setQueryResponder(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Attached Clinical Evidence Dossier</label>
                <input
                  type="text"
                  value={queryEvidence}
                  onChange={(e) => setQueryEvidence(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setQueryModalClaim(null)}
                className="px-4 py-2 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveQuery}
                disabled={submittingQuery || !queryResponseText}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-[12px] text-xs shadow-sm transition disabled:opacity-50"
              >
                {submittingQuery ? "Transmitting..." : "Transmit Clarification to TPA Portal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SETTLEMENT RECONCILIATION (APPLE UNIFORMITY)                     */}
      {/* ========================================================================= */}
      {settleModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516]">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-black text-[#1D1D1F] dark:text-white text-base">Remittance Advice Settlement &amp; Deduction Reconciliation</h3>
              </div>
              <button 
                onClick={() => setSettleModalClaim(null)} 
                className="p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[16px] border border-black/[0.04] dark:border-white/[0.06]">
                <div>
                  <span className="text-[#86868B] dark:text-[#8E8E93] text-[11px] font-medium">Approved Sanction Amount:</span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{settleModalClaim.approved_amount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[#86868B] dark:text-[#8E8E93] text-[11px] font-medium">TPA Payor:</span>
                  <div className="text-sm font-bold text-[#1D1D1F] dark:text-white">{settleModalClaim.tpa_company}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Bank Remittance UTR Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-HDFC-991204812"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Net Remitted Amount Received (₹) *</label>
                  <input
                    type="number"
                    value={remittedAmount}
                    onChange={(e) => setRemittedAmount(e.target.value)}
                    placeholder="e.g. 156800"
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-black text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Live Shortfall Calculation */}
              {remittedAmount && parseFloat(remittedAmount) < settleModalClaim.approved_amount && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800 rounded-[14px] flex items-center justify-between text-xs text-rose-800 dark:text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>
                      Shortfall / Deductions Detected: <strong className="font-black">₹{(settleModalClaim.approved_amount - parseFloat(remittedAmount)).toLocaleString()}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] font-bold">Categorization Required</span>
                </div>
              )}

              {/* Deductions Itemizer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider text-[11px]">
                    IRDAI Shortfall Deduction Itemization
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addDeductionRow("DED_NON_PAYABLE_CONSUMABLES")}
                      className="px-2.5 py-1 bg-[#ECEEF2] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-white rounded-[8px] text-[11px] font-bold hover:bg-black/[0.06] dark:hover:bg-white/[0.12] transition"
                    >
                      + Consumables
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeductionRow("DED_ROOM_RENT_CAPPING_COPAY")}
                      className="px-2.5 py-1 bg-[#ECEEF2] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-white rounded-[8px] text-[11px] font-bold hover:bg-black/[0.06] dark:hover:bg-white/[0.12] transition"
                    >
                      + Room Rent Capping
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeductionRow("DED_CO_PAY_CLAUSE")}
                      className="px-2.5 py-1 bg-[#ECEEF2] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-white rounded-[8px] text-[11px] font-bold hover:bg-black/[0.06] dark:hover:bg-white/[0.12] transition"
                    >
                      + Co-Pay
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {deductionRows.length === 0 ? (
                    <div className="p-3.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[14px] border border-dashed border-black/[0.1] dark:border-white/[0.15] text-center text-[#86868B] dark:text-[#8E8E93] text-xs">
                      No deductions added. If net remittance matches approved amount (₹{settleModalClaim.approved_amount.toLocaleString()}), proceed directly to post.
                    </div>
                  ) : (
                    deductionRows.map((row, idx) => (
                      <div key={idx} className="p-3.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] rounded-[14px] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#1D1D1F] dark:text-white font-mono text-[11px]">{row.code}</span>
                          <button 
                            type="button"
                            onClick={() => removeDeductionRow(idx)}
                            className="text-[#86868B] hover:text-rose-600 dark:hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={row.reason}
                            onChange={(e) => updateDeductionRow(idx, "reason", e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[10px] text-[#1D1D1F] dark:text-white text-xs"
                          />
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => updateDeductionRow(idx, "amount", parseFloat(e.target.value) || 0)}
                            className="px-3 py-1.5 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[10px] text-[#1D1D1F] dark:text-white font-bold text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`disp-${idx}`}
                            checked={row.disputed}
                            onChange={(e) => updateDeductionRow(idx, "disputed", e.target.checked)}
                            className="rounded"
                          />
                          <label htmlFor={`disp-${idx}`} className="text-amber-700 dark:text-amber-400 font-bold text-[11px] cursor-pointer">
                            Dispute this deduction (Route to TPA Grievance Queue)
                          </label>
                        </div>
                        {row.disputed && (
                          <input
                            type="text"
                            placeholder="Mandatory appeal justification & clinical grounds..."
                            value={row.appeal_notes || ""}
                            onChange={(e) => updateDeductionRow(idx, "appeal_notes", e.target.value)}
                            className="w-full px-3 py-1.5 bg-white dark:bg-[#1C1C1E] border border-amber-500/50 rounded-[10px] text-amber-800 dark:text-amber-200 text-xs"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1.5">Reconciliation Sign-Off</label>
                <input
                  type="text"
                  value={reconciledBy}
                  onChange={(e) => setReconciledBy(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white text-xs font-semibold"
                />
              </div>
            </div>

            <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSettleModalClaim(null)}
                className="px-4 py-2 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSettleReconciliation}
                disabled={submittingSettle || !utrNumber || !remittedAmount}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-[12px] text-xs shadow-sm transition disabled:opacity-50"
              >
                {submittingSettle ? "Reconciling..." : "Finalize Reconciliation & Post to Ledger"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
