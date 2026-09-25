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

  // Modals
  const [newClaimModal, setNewClaimModal] = useState(false);
  const [queryModalClaim, setQueryModalClaim] = useState<InsuranceClaim | null>(null);
  const [settleModalClaim, setSettleModalClaim] = useState<InsuranceClaim | null>(null);
  const [viewAuditClaim, setViewAuditClaim] = useState<InsuranceClaim | null>(null);

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
          verified_by: "TPA Desk Officer (Manas)"
        })
      });
      if (res.ok) {
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  TPA & Cashless Insurance Desk
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    IRDAI & GIPSA Governed
                  </span>
                </h1>
                <p className="text-sm text-slate-400 font-medium">
                  Validated Pre-Authorization • Package Rate Governance • SLA-Tracked Queries • Automated Settlement Reconciliation
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchClaims()}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button 
              onClick={() => {
                resetNewClaimForm();
                handleProcedureChange(PROCEDURE_CATALOG[0].code);
                setNewClaimModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              New Pre-Auth Requisition
            </button>
          </div>
        </div>

        {/* 4 Pillars Governance Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <CheckSquare className="w-4 h-4" />
              Pre-Auth Validation Engine
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mandatory document checklist enforced per procedure code. Zero incomplete dossiers submitted.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
              <Scale className="w-4 h-4" />
              Package Rate Compliance
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time validation against agreed corporate caps. Overrun requires Finance Head PIN + Reason.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs mb-1">
              <Clock className="w-4 h-4" />
              Query SLA Resolution Engine
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Strict 24h countdown. Escalates to Billing Mgr at 24h, Practice Admin at 48h with Risk Score.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              Settlement Reconciliation
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Remittance UTR matched against approvals. IRDAI deduction codes, dispute queue & ledger credit.
            </p>
          </div>
        </div>

        {/* Metrics Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 font-medium">Total Dossiers</span>
            <div className="text-2xl font-bold text-white mt-1">{metrics.total}</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 font-medium">Pre-Auth / Review</span>
            <div className="text-2xl font-bold text-blue-400 mt-1">{metrics.pre_auth}</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Active Queries
            </span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{metrics.query_raised}</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-rose-300 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              SLA Breached
            </span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.sla_breached_count}</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-emerald-300 font-medium">Approved Sanctions</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">₹{metrics.total_approved_amount.toLocaleString()}</div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5">
            <span className="text-xs text-purple-300 font-medium">Dispute Queue</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">{metrics.disputed_count}</div>
          </div>
        </div>

        {/* Filter Navigation & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
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
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, policy, procedure..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Claims Operational Grid */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              Loading governed cashless dossiers...
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-16 bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-400">
              <ShieldCheck className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              No insurance claims found matching current criteria.
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
                  className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-all shadow-md"
                >
                  {/* Top Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs font-semibold text-blue-400">
                        {c.claim_number}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white text-base">{c.patient_name}</h3>
                          <span className="text-xs text-slate-400">({c.patient_phone})</span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-slate-300 font-medium">{c.tpa_company}</span>
                          <span>•</span>
                          <span>Policy: <strong className="text-slate-200 font-mono">{c.policy_number}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badges */}
                      {c.status === "draft" && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 text-xs font-medium border border-slate-600">
                          Draft (Incomplete)
                        </span>
                      )}
                      {(c.status === "pre_auth_submitted" || c.status === "under_review") && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          Pre-Auth Under Review
                        </span>
                      )}
                      {c.status === "query_raised" && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Query Active (Action Req.)
                        </span>
                      )}
                      {c.status === "approved" && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Pre-Auth Approved
                        </span>
                      )}
                      {c.status === "settled" && (
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                          Settlement Reconciled
                        </span>
                      )}

                      {/* Package Rate Overrun Indicator */}
                      {c.package_rate_overrun && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 text-[11px] font-medium border border-amber-800/80 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-amber-400" />
                          Rate Overrun (Authorized)
                        </span>
                      )}

                      <button
                        onClick={() => setExpandedClaimId(isExpanded ? null : c.id)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-colors ml-2"
                        title={isExpanded ? "Collapse Details" : "Expand Details"}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Operational Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Clinical Procedure & Package:</span>
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span className="font-mono text-blue-400 bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900">
                          {c.procedure_code || "PROC-EMERGENCY"}
                        </span>
                        <span className="truncate">{c.procedure_name || "Emergency Medical IPD"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Financial Tariff Governance:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">
                          Est: <strong className="text-white">₹{c.estimated_amount.toLocaleString()}</strong>
                        </span>
                        <span>/</span>
                        <span className="text-slate-400">
                          Agreed Cap: <strong className="text-slate-200">₹{c.package_rate_cap.toLocaleString()}</strong>
                        </span>
                        {c.approved_amount > 0 && (
                          <span className="text-emerald-400 ml-1 font-semibold">
                            (Sanction: ₹{c.approved_amount.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-1">Mandatory Record Checklist:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isDocsComplete 
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800" 
                            : "bg-amber-950/60 text-amber-300 border-amber-800"
                        }`}>
                          {verifiedDocsCount}/{docs.length} Records Verified
                        </span>
                        {isDocsComplete ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Dossier
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5" /> Submission Halted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE QUERY SLA RADAR (Fix 3) */}
                  {c.status === "query_raised" && c.sla_info && (
                    <div className={`mt-2 p-3.5 rounded-xl border ${
                      c.sla_info.escalationTier === "admin_critical"
                        ? "bg-rose-950/40 border-rose-600/70"
                        : c.sla_info.escalationTier === "manager_escalation"
                        ? "bg-amber-950/40 border-amber-600/70"
                        : "bg-slate-900 border-slate-700"
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${
                              c.sla_info.escalationTier === "admin_critical" ? "text-rose-400 animate-bounce" : "text-amber-400"
                            }`} />
                            <span className="font-semibold text-white text-xs uppercase tracking-wide">
                              {c.sla_info.statusLabel}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              c.sla_info.riskLevel === "critical" 
                                ? "bg-rose-600 text-white" 
                                : c.sla_info.riskLevel === "high"
                                ? "bg-amber-500 text-slate-950"
                                : "bg-blue-600 text-white"
                            }`}>
                              Rejection Risk: {c.sla_info.riskScore}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 italic">
                            "{queryData.query_text || "Clinical justification requested by TPA medical referee."}"
                          </p>
                          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                            <span>Assigned: <strong>{queryData.assigned_to || "TPA Desk"}</strong></span>
                            <span>•</span>
                            <span>Elapsed: <strong>{c.sla_info.hoursElapsed} hrs</strong> (24h SLA)</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setQueryModalClaim(c);
                            setQueryResponseText("");
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 shadow"
                        >
                          Resolve Query & Attach Evidence
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SETTLEMENT & RECONCILIATION SUMMARY (Fix 4) */}
                  {c.status === "settled" && settleData.is_reconciled && (
                    <div className="mt-2 p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/50 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 text-purple-300 font-semibold">
                            <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                            Remittance Reconciled (UTR: <span className="font-mono text-white">{settleData.utr_number}</span>)
                            {settleData.posted_to_ledger && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                                ✓ Credited to Bed Ledger
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-slate-300 mt-1.5">
                            <span>Approved: <strong>₹{settleData.approved_amount?.toLocaleString()}</strong></span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">Net Remitted: ₹{settleData.remitted_amount?.toLocaleString()}</span>
                            <span>•</span>
                            <span className="text-rose-400 font-semibold">Shortfall: ₹{settleData.shortfall_amount?.toLocaleString()}</span>
                          </div>
                        </div>

                        {settleData.dispute_status === "dispute_queued" && (
                          <span className="px-2.5 py-1 rounded bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/40">
                            Disputed Deductions in Grievance Queue
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PACKAGE OVERRUN ALERT BANNER (Fix 2) */}
                  {c.package_rate_overrun && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Package Rate Cap Exceeded: Authorized by <strong>{c.package_override_by || "Finance Head"}</strong> with Reason: <em>"{c.package_override_reason || "COMORBIDITY_HIGH_RISK"}"</em>
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[10px]">PIN AUDITED</span>
                    </div>
                  )}

                  {/* EXPANDABLE DRILLDOWN DRAWER */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-700/80 space-y-4">
                      {/* Section 1: Mandatory Document Checklist (Interactive) */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                          Mandatory Clinical Records Checklist ({c.procedure_code})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {docs.map(doc => (
                            <div 
                              key={doc.id}
                              className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                                doc.verified 
                                  ? "bg-slate-900/90 border-emerald-900/60 text-slate-200" 
                                  : "bg-slate-900/90 border-amber-900/50 text-slate-400"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {doc.verified ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                                )}
                                <div>
                                  <div className="font-medium text-slate-200">{doc.label}</div>
                                  {doc.verified && (
                                    <div className="text-[10px] text-emerald-400 mt-0.5">
                                      Verified by {doc.verified_by || "TPA Officer"} {doc.file_name ? `• ${doc.file_name}` : ""}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {!doc.verified && (
                                <button
                                  onClick={() => verifyDocInClaim(c.id, doc.id)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition-colors shrink-0"
                                >
                                  Verify Document
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 2: Audit Trail */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <History className="w-3.5 h-3.5 text-purple-400" />
                          Clinical & Regulatory Audit Trail
                        </h4>
                        <div className="bg-slate-900 rounded-xl p-3 border border-slate-700/60 space-y-2 text-xs">
                          {(c.audit_trail || []).map((entry, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                              <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">
                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-300 font-mono text-[11px]">{entry.action}</span>
                                <span className="text-slate-500 text-[11px]"> by {entry.by}</span>
                                <div className="text-slate-400 text-[11px] mt-0.5">{entry.notes}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        {c.status === "draft" && (
                          <button
                            onClick={() => submitPreAuthDossier(c)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-md transition-all"
                          >
                            Validate Dossier & Submit Pre-Auth
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
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs shadow-md transition-all flex items-center gap-2"
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW PRE-AUTH REQUISITION (Fix 1 & Fix 2)                         */}
      {/* ========================================================================= */}
      {newClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-850">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-lg">New Cashless Pre-Authorization Requisition</h3>
              </div>
              <button onClick={() => setNewClaimModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {submitError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600 text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Validation Blocked:</strong>
                    {submitError}
                  </div>
                </div>
              )}

              {/* Patient & Policy Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Pant"
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Patient Phone *</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={ptPhone}
                    onChange={(e) => setPtPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* TPA & Policy Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Payor / TPA Organization *</label>
                  <select
                    value={selectedTpa}
                    onChange={(e) => handleTpaChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {POPULAR_TPAS.map(tpa => (
                      <option key={tpa} value={tpa}>{tpa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Health Insurance Policy / UHID No *</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-STAR-992810"
                    value={policyNo}
                    onChange={(e) => setPolicyNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Clinical Procedure Selection */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Procedure & Corporate Package Specification *
                </label>
                <select
                  value={selectedProcCode}
                  onChange={(e) => handleProcedureChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  {PROCEDURE_CATALOG.map(proc => (
                    <option key={proc.code} value={proc.code}>
                      [{proc.code}] {proc.name} — ({proc.category}, Est. {proc.default_stay_days}d stay)
                    </option>
                  ))}
                </select>
              </div>

              {/* FIX 2: Corporate Package Rate Governance */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Tariff Compliance & Agreed Package Cap:</span>
                  <span className="font-mono text-sm text-blue-400 font-bold">
                    Agreed Cap: ₹{negotiatedCap.toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Estimated Admission Cost (₹) *</label>
                  <input
                    type="number"
                    value={estAmount}
                    onChange={(e) => setEstAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {isOverrun && (
                  <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-600/80 space-y-2.5 text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      PACKAGE RATE OVERRUN DETECTED (+₹{overrunDiff.toLocaleString()})
                    </div>
                    <p className="text-[11px] text-amber-300/90 leading-relaxed">
                      Estimated ₹{numEstAmount.toLocaleString()} exceeds negotiated {selectedTpa} agreed tariff of ₹{negotiatedCap.toLocaleString()}. Insurer will disallow this difference unless approved by Finance Head with valid Clinical Reason Code.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Finance Head PIN (e.g. FIN-9921 or 8842) *
                        </label>
                        <input
                          type="password"
                          placeholder="Enter Finance PIN"
                          value={overridePin}
                          onChange={(e) => setOverridePin(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-600/70 rounded text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Override Reason Code *
                        </label>
                        <select
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-600/70 rounded text-white text-[11px]"
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

              {/* FIX 1: Mandatory Document Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    Mandatory Dossier Checklist ({activeProcedure.code})
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {formChecklist.filter(d => d.verified).length} of {formChecklist.length} Verified
                  </span>
                </div>

                <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                  {formChecklist.map(doc => (
                    <div 
                      key={doc.id}
                      onClick={() => toggleChecklistDoc(doc.id)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                        doc.verified 
                          ? "bg-slate-800 border-emerald-500/60 text-emerald-300" 
                          : "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {doc.verified ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <span className="font-medium">{doc.label}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        doc.verified ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700 text-slate-400"
                      }`}>
                        {doc.verified ? "Verified ✓" : "Required"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clinical Remarks */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Clinical Remarks & Admission Diagnosis</label>
                <textarea
                  rows={2}
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                  placeholder="Clinical presentation, provisional diagnosis, planned intervention..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-700 bg-slate-850 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCreateClaim(true)}
                disabled={submittingClaim}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Save as Draft Dossier
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewClaimModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateClaim(false)}
                  disabled={submittingClaim}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submittingClaim ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Validate & Submit Pre-Auth
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: QUERY RESOLUTION SLA CONSOLE (Fix 3)                             */}
      {/* ========================================================================= */}
      {queryModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-850">
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">TPA Query Resolution Console (24h SLA)</h3>
              </div>
              <button onClick={() => setQueryModalClaim(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <div className="text-slate-400 text-[11px] mb-1">
                  Query from <strong>{queryModalClaim.tpa_company}</strong> for Claim #{queryModalClaim.claim_number}:
                </div>
                <div className="font-medium text-white text-xs italic">
                  "{queryModalClaim.tpa_query_details?.query_text || "Clinical justification requested."}"
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Attending Doctor Clinical Clarification *
                </label>
                <textarea
                  rows={4}
                  value={queryResponseText}
                  onChange={(e) => setQueryResponseText(e.target.value)}
                  placeholder="State clinical justification, onset of symptoms, pre-operative investigations..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attending Clinician Sign-Off</label>
                <input
                  type="text"
                  value={queryResponder}
                  onChange={(e) => setQueryResponder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attached Clinical Evidence Dossier</label>
                <input
                  type="text"
                  value={queryEvidence}
                  onChange={(e) => setQueryEvidence(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-850 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setQueryModalClaim(null)}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveQuery}
                disabled={submittingQuery || !queryResponseText}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
              >
                {submittingQuery ? "Transmitting..." : "Transmit Clarification to TPA Portal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SETTLEMENT & DEDUCTION RECONCILIATION (Fix 4)                    */}
      {/* ========================================================================= */}
      {settleModalClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-slate-850">
              <div className="flex items-center gap-2 text-purple-400">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">Remittance Advice Settlement & Deduction Reconciliation</h3>
              </div>
              <button onClick={() => setSettleModalClaim(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-900 rounded-xl border border-slate-700">
                <div>
                  <span className="text-slate-400 text-[11px]">Approved Sanction Amount:</span>
                  <div className="text-xl font-bold text-emerald-400">₹{settleModalClaim.approved_amount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">TPA Payor:</span>
                  <div className="text-sm font-semibold text-white">{settleModalClaim.tpa_company}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bank Remittance UTR Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR-HDFC-991204812"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Net Remitted Amount Received (₹) *</label>
                  <input
                    type="number"
                    value={remittedAmount}
                    onChange={(e) => setRemittedAmount(e.target.value)}
                    placeholder="e.g. 156800"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Live Shortfall Calculation */}
              {remittedAmount && parseFloat(remittedAmount) < settleModalClaim.approved_amount && (
                <div className="p-3 bg-rose-950/40 border border-rose-600/70 rounded-xl flex items-center justify-between text-xs text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>
                      Shortfall / Deductions Detected: <strong>₹{(settleModalClaim.approved_amount - parseFloat(remittedAmount)).toLocaleString()}</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-rose-400 font-semibold">Categorization Required</span>
                </div>
              )}

              {/* Deductions Itemizer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    IRDAI Shortfall Deduction Itemization
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addDeductionRow("DED_NON_PAYABLE_CONSUMABLES")}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px]"
                    >
                      + Consumables
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeductionRow("DED_ROOM_RENT_CAPPING_COPAY")}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px]"
                    >
                      + Room Rent Capping
                    </button>
                    <button
                      type="button"
                      onClick={() => addDeductionRow("DED_CO_PAY_CLAUSE")}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px]"
                    >
                      + Co-Pay
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {deductionRows.length === 0 ? (
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-dashed border-slate-700 text-center text-slate-400 text-xs">
                      No deductions added. If net remittance matches approved amount (₹{settleModalClaim.approved_amount.toLocaleString()}), proceed directly to post.
                    </div>
                  ) : (
                    deductionRows.map((row, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-200 font-mono text-[11px]">{row.code}</span>
                          <button 
                            type="button"
                            onClick={() => removeDeductionRow(idx)}
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={row.reason}
                            onChange={(e) => updateDeductionRow(idx, "reason", e.target.value)}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-200 text-xs"
                          />
                          <input
                            type="number"
                            value={row.amount}
                            onChange={(e) => updateDeductionRow(idx, "amount", parseFloat(e.target.value) || 0)}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-white font-bold text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`disp-${idx}`}
                            checked={row.disputed}
                            onChange={(e) => updateDeductionRow(idx, "disputed", e.target.checked)}
                            className="rounded border-slate-700"
                          />
                          <label htmlFor={`disp-${idx}`} className="text-amber-400 font-medium text-[11px] cursor-pointer">
                            Dispute this deduction (Route to TPA Grievance Queue)
                          </label>
                        </div>
                        {row.disputed && (
                          <input
                            type="text"
                            placeholder="Mandatory appeal justification & clinical grounds..."
                            value={row.appeal_notes || ""}
                            onChange={(e) => updateDeductionRow(idx, "appeal_notes", e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-amber-600/60 rounded text-amber-200 text-xs"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reconciliation Sign-Off</label>
                <input
                  type="text"
                  value={reconciledBy}
                  onChange={(e) => setReconciledBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-850 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSettleModalClaim(null)}
                className="px-4 py-2 text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSettleReconciliation}
                disabled={submittingSettle || !utrNumber || !remittedAmount}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs shadow-md transition-all disabled:opacity-50"
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
