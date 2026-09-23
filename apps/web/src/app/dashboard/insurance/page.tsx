"use client";

import React, { useState, useEffect } from "react";
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
  Send
} from "lucide-react";

interface InsuranceClaim {
  id: string;
  claim_number: string;
  patient_name: string;
  patient_phone: string;
  policy_number: string;
  tpa_company: string;
  bed_id: string | null;
  bed_number: string | null;
  ward_name: string | null;
  estimated_amount: number;
  approved_amount: number;
  status: "pre_auth_submitted" | "query_raised" | "approved" | "settled" | "rejected";
  approval_ref: string | null;
  submission_date: string;
  remarks: string | null;
}

const POPULAR_TPAS = [
  "Star Health & Allied Insurance",
  "HDFC ERGO General Insurance",
  "ICICI Lombard General Insurance",
  "Care Health Insurance (Religare)",
  "Niva Bupa Health Insurance (Max Bupa)",
  "Bajaj Allianz General Insurance",
  "Tata AIG General Insurance",
  "Aditya Birla Health Insurance",
  "Medi Assist TPA",
  "Paramount Health Services TPA"
];

export default function InsuranceDashboardPage() {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pre_auth: 0,
    query_raised: 0,
    approved: 0,
    settled: 0,
    total_approved_amount: 0
  });
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals
  const [newClaimModal, setNewClaimModal] = useState(false);
  const [updateModalClaim, setUpdateModalClaim] = useState<InsuranceClaim | null>(null);

  // New Claim Form
  const [ptName, setPtName] = useState("");
  const [ptPhone, setPtPhone] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [selectedTpa, setSelectedTpa] = useState(POPULAR_TPAS[0]);
  const [estAmount, setEstAmount] = useState("25000");
  const [claimRemarks, setClaimRemarks] = useState("Emergency IPD admission cashless claim submission.");

  // Update Status Form
  const [updateStatus, setUpdateStatus] = useState<string>("approved");
  const [sanctionAmount, setSanctionAmount] = useState<string>("20000");
  const [approvalRef, setApprovalRef] = useState<string>("");
  const [updateRemarks, setUpdateRemarks] = useState<string>("");

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

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/insurance/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: ptName,
          patient_phone: ptPhone,
          policy_number: policyNo,
          tpa_company: selectedTpa,
          estimated_amount: parseFloat(estAmount) || 0,
          remarks: claimRemarks
        })
      });
      if (res.ok) {
        setNewClaimModal(false);
        setPtName("");
        setPtPhone("");
        setPolicyNo("");
        fetchClaims();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateModalClaim) return;

    try {
      const res = await fetch(`/api/insurance/claims/${updateModalClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updateStatus,
          approved_amount: parseFloat(sanctionAmount) || 0,
          approval_ref: approvalRef,
          remarks: updateRemarks
        })
      });
      if (res.ok) {
        setUpdateModalClaim(null);
        fetchClaims();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openUpdateModal = (claim: InsuranceClaim) => {
    setUpdateModalClaim(claim);
    setUpdateStatus(claim.status);
    setSanctionAmount(claim.approved_amount > 0 ? claim.approved_amount.toString() : claim.estimated_amount.toString());
    setApprovalRef(claim.approval_ref || `AUTH/${claim.tpa_company.split(" ")[0].toUpperCase()}/${Math.floor(10000 + Math.random() * 90000)}`);
    setUpdateRemarks(claim.remarks || "");
  };

  const filteredClaims = claims.filter(c => 
    c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.claim_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tpa_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.policy_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-500/10 dark:bg-sky-500/20 text-sky-500 rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                TPA & Cashless Insurance Desk
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-sky-500/10 text-sky-600 border border-sky-500/20 font-semibold">
                  Marley TPA
                </span>
              </h1>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                Pre-authorization desk, corporate cashless claims, queries resolution & insurer settlements
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchClaims}
            className="p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-black/5"
            title="Refresh Claims"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setNewClaimModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 text-white font-medium text-xs shadow-apple-card hover:bg-sky-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Submit Pre-Auth</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Claims Raised</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.total}
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Cumulative insurance pipeline</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Under TPA Review</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.pre_auth}
          </div>
          <div className="mt-2 text-xs text-amber-600 font-medium">Initial pre-auth pending</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Approved Cashless</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {metrics.approved}
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">Sanctions issued by insurer</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sanctioned Sum</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 font-mono">
            ₹{metrics.total_approved_amount.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Insurer cashless coverage</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl">
          {[
            { id: "all", label: "All Claims" },
            { id: "pre_auth_submitted", label: "Pre-Auth Sent" },
            { id: "query_raised", label: "Query Raised" },
            { id: "approved", label: "Approved" },
            { id: "settled", label: "Settled" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === tab.id
                  ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#86868B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, policy #, or TPA..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Claims Table */}
      <div className="rounded-[22px] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E] shadow-apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] text-[#86868B] uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Claim Ref</th>
                <th className="py-3.5 px-4">Patient Details</th>
                <th className="py-3.5 px-4">Insurer / TPA</th>
                <th className="py-3.5 px-4">Estimated vs Approved</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86868B]">
                    Loading TPA insurance records from Supabase...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#86868B]">
                    No insurance claims found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">
                      {claim.claim_number}
                      <div className="text-[10px] text-[#86868B] font-normal font-sans">
                        {new Date(claim.submission_date).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#86868B]" />
                        {claim.patient_name}
                      </div>
                      <div className="text-[11px] text-[#86868B] font-mono mt-0.5">
                        {claim.patient_phone} • Policy: {claim.policy_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1D1D1F] dark:text-white flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-[#86868B]" />
                        {claim.tpa_company}
                      </div>
                      {claim.approval_ref && (
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Ref: {claim.approval_ref}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs">
                        Est: <span className="font-semibold">₹{claim.estimated_amount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="font-mono text-xs text-emerald-600 font-bold mt-0.5">
                        Apprv: ₹{claim.approved_amount.toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {claim.status === "pre_auth_submitted" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          <Clock className="h-3 w-3" /> Pre-Auth Under Review
                        </span>
                      )}
                      {claim.status === "query_raised" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          <AlertCircle className="h-3 w-3" /> Query Raised
                        </span>
                      )}
                      {claim.status === "approved" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Cashless Approved
                        </span>
                      )}
                      {claim.status === "settled" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-apple-blue border border-blue-500/20">
                          <FileCheck2 className="h-3 w-3" /> Final Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openUpdateModal(claim)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-sm transition"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Submit Pre-Auth Claim */}
      {newClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-sky-500" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Submit Cashless Pre-Auth</h3>
              </div>
              <button onClick={() => setNewClaimModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Joshi"
                  value={ptName}
                  onChange={(e) => setPtName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+919876543299"
                  value={ptPhone}
                  onChange={(e) => setPtPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Health Insurance Policy Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. POL-STAR-8874129"
                  value={policyNo}
                  onChange={(e) => setPolicyNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">TPA / Insurance Payor</label>
                <select
                  value={selectedTpa}
                  onChange={(e) => setSelectedTpa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-sky-500"
                >
                  {POPULAR_TPAS.map((tpa, idx) => (
                    <option key={idx} value={tpa}>{tpa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Estimated Hospitalization Bill (₹)</label>
                <input
                  type="number"
                  required
                  value={estAmount}
                  onChange={(e) => setEstAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Clinical Remarks & Admission Reason</label>
                <textarea
                  rows={2}
                  value={claimRemarks}
                  onChange={(e) => setClaimRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewClaimModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold shadow-sm hover:bg-sky-700 transition"
                >
                  Submit Pre-Auth
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Update Claim Status / Sanction */}
      {updateModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Update Claim Status</h3>
                <div className="text-xs text-[#86868B]">{updateModalClaim.claim_number} • {updateModalClaim.patient_name}</div>
              </div>
              <button onClick={() => setUpdateModalClaim(null)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleUpdateClaim} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Claim Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="pre_auth_submitted">Pre-Auth Submitted (Under Review)</option>
                  <option value="query_raised">Query Raised by TPA</option>
                  <option value="approved">Cashless Sanction Approved</option>
                  <option value="settled">Final Discharge Settled</option>
                  <option value="rejected">Claim Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Sanctioned / Approved Amount (₹)</label>
                <input
                  type="number"
                  value={sanctionAmount}
                  onChange={(e) => setSanctionAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono font-bold text-emerald-600 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">TPA Approval Authorization Ref</label>
                <input
                  type="text"
                  placeholder="e.g. AUTH/STAR/2026/89412"
                  value={approvalRef}
                  onChange={(e) => setApprovalRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">TPA Query / Settlement Notes</label>
                <textarea
                  rows={2}
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUpdateModalClaim(null)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold shadow-sm hover:bg-sky-700 transition"
                >
                  Update Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
