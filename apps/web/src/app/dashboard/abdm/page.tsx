"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  CheckCircle2, 
  QrCode, 
  Search, 
  User, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  Printer, 
  RefreshCw, 
  Sparkles,
  ExternalLink,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  KeyRound,
  FileCheck,
  CheckSquare,
  Square,
  X,
  AlertCircle,
  FileText,
  Send,
  Zap,
  RotateCw,
  Ban,
  ShieldAlert
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { 
  ConsentArtefact, 
  AbdmPatient, 
  ABDM_PURPOSE_CODES,
  maskAadhaar,
  isValidVid
} from "@/data/abdmGovernance";

export default function AbdmDashboardPage() {
  const [activeTab, setActiveTab] = useState<"kyc" | "consent" | "conflicts">("kyc");
  const [patients, setPatients] = useState<AbdmPatient[]>([]);
  const [consents, setConsents] = useState<ConsentArtefact[]>([]);
  const [metrics, setMetrics] = useState({
    total_registered: 0,
    verified_kyc: 0,
    pending_sync: 0,
    conflicts_count: 0,
    active_consents: 0,
    revoked_consents: 0
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states - Registration & sandbox identity
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [aadhaarInput, setAadhaarInput] = useState("");
  const [selectedGatewayMode, setSelectedGatewayMode] = useState<"sandbox" | "timeout_fallback">("sandbox");
  const [registryMatch, setRegistryMatch] = useState<any>(null);
  const [checkingRegistry, setCheckingRegistry] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Active ABHA Card display
  const [selectedPatientCard, setSelectedPatientCard] = useState<AbdmPatient | null>(null);

  // Consent Request Form Modal
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentPtName, setConsentPtName] = useState("");
  const [consentPtPhone, setConsentPtPhone] = useState("");
  const [consentAbha, setConsentAbha] = useState("");
  const [consentPurpose, setConsentPurpose] = useState(ABDM_PURPOSE_CODES[0].code);
  const [consentValidityDays, setConsentValidityDays] = useState(7);
  const [requestingConsent, setRequestingConsent] = useState(false);
  const [consentOtpInputs, setConsentOtpInputs] = useState<Record<string, string>>({});

  // Syncing Queue
  const [syncingQueue, setSyncingQueue] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAbdmData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/abdm");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        setConsents(data.consents || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.patients?.length > 0 && !selectedPatientCard) {
          setSelectedPatientCard(data.patients[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbdmData();
  }, []);

  // FIX 3: Pre-Creation Registry Check
  const handleCheckRegistry = async () => {
    setCheckingRegistry(true);
    setRegistryMatch(null);
    try {
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registry_check",
          patient_phone: patientPhone,
          aadhaar_input: aadhaarInput
        })
      });
      const data = await res.json();
      if (data.match_found) {
        setRegistryMatch(data.patient);
        showToast("Existing local ABDM record found for this clinic.");
      } else {
        setRegistryMatch(false);
        showToast("No local ABDM record found. A sandbox record can be created.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingRegistry(false);
    }
  };

  // FIX 2: Generate a sandbox verification code
  const handleRequestOtp = async () => {
    if (!aadhaarInput) {
      alert("Please provide a 4-digit reference, 12-digit Aadhaar, or 16-digit VID.");
      return;
    }
    try {
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          aadhaar_input: aadhaarInput,
          patient_phone: patientPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        showToast(data.message || `Sandbox code generated for ${data.masked_aadhaar}.`);
      } else {
        alert(data.error || "Failed to generate a sandbox code");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 2 & FIX 4: Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingKyc(true);
    try {
      const masked = maskAadhaar(aadhaarInput);
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_otp_create_abha",
          patient_name: patientName,
          patient_phone: patientPhone,
          masked_aadhaar: masked,
          otp_code: otpCode,
          simulate_gateway_failure: selectedGatewayMode === "timeout_fallback"
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setSelectedPatientCard(data.patient);
        setOtpSent(false);
        setRegistryMatch(null);
        await fetchAbdmData();
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingKyc(false);
    }
  };

  // FIX 1: Initiate Consent Request
  const handleCreateConsentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestingConsent(true);
    try {
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_consent",
          patient_name: consentPtName,
          patient_phone: consentPtPhone,
          abha_number: consentAbha,
          purpose_code: consentPurpose,
          validity_days: consentValidityDays
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setConsentModalOpen(false);
        await fetchAbdmData();
      } else {
        alert(data.error || "Failed to create consent request");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRequestingConsent(false);
    }
  };

  // FIX 1: Grant Consent with a sandbox consent code
  const handleGrantConsent = async (requestId: string) => {
    const otp = (consentOtpInputs[requestId] || "").replace(/\D/g, "");
    if (otp.length !== 6) {
      showToast("Enter the 6-digit sandbox consent code.");
      return;
    }
    try {
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_consent_otp",
          consent_request_id: requestId,
          otp_code: otp
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        setConsentOtpInputs((prev) => ({ ...prev, [requestId]: "" }));
        await fetchAbdmData();
      } else {
        showToast(data.error || "Could not record the consent code.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 1: 1-Click Revoke Consent
  const handleRevokeConsent = async (requestId: string) => {
    if (!confirm("Revoke this sandbox consent record? The local access token is locked immediately.")) return;
    try {
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke_consent",
          consent_request_id: requestId,
          revoked_by: "Clinic staff (sandbox)"
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        await fetchAbdmData();
      } else {
        showToast(data.error || "Could not revoke this consent record.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 4: Process Offline Sync Queue
  const handleSyncOfflineQueue = async () => {
    setSyncingQueue(true);
    try {
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_offline_queue" })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        await fetchAbdmData();
      } else {
        showToast(data.error || "Could not re-check the pending queue.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingQueue(false);
    }
  };

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

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 border border-orange-500/20 text-[11px] font-black uppercase tracking-wider text-orange-700 dark:bg-orange-500/10 dark:text-orange-400">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span>ABDM Sandbox Simulator</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>DPDP-aligned data handling</span>
            </span>
          </div>
          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            Ayushman Bharat Digital Mission (ABDM) Sandbox
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
            Sandbox workflow • Consent artefacts • Masked identifiers • Duplicate checks • Offline fallback
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchAbdmData()}
            className="flex items-center gap-1.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition shadow-apple-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#0071E3]" : "text-[#86868B] dark:text-[#8E8E93]"}`} />
            <span>Refresh Gateway</span>
          </button>

          <button 
            onClick={() => setConsentModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Request Consent Token</span>
          </button>
        </div>
      </div>

      {/* Sandbox disclosure */}
      <div className="rounded-[14px] border border-orange-500/25 bg-orange-500/5 px-4 py-2.5 text-[11px] text-orange-800 dark:text-orange-300">
        <strong>Sandbox environment: </strong>
        No UIDAI or NHA gateway is configured on this deployment. Codes, ABHA-style identifiers and consent artefacts are simulated locally and are not valid outside this demo.
      </div>

      {/* 4 Pillars Governance Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs mb-1">
            <Lock className="h-4 w-4" />
            <span>Dynamic Consent Engine</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Time-bound, purpose-specific consent records. Local health data is only released against an active consent record.
          </p>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Masked Identity Handling</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Stores strictly masked (XXXX-XXXX-1234) or 16-digit VID references. Raw Aadhaar is never persisted.
          </p>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1">
            <RotateCw className="h-4 w-4" />
            <span>Pre-Creation Duplicate Check</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Checks this clinic&apos;s local ABDM records before creation. Re-links an existing record to prevent fragmentation.
          </p>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-bold text-xs mb-1">
            <Zap className="h-4 w-4" />
            <span>Resilient Offline Queue</span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Records that cannot be verified are kept in a pending queue so the registration desk is never blocked.
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Registered Citizens</span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">{metrics.total_registered}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Sandbox KYC records</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{metrics.verified_kyc}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Active Consents
          </span>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{metrics.active_consents}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Revoked Tokens</span>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{metrics.revoked_consents}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Local Mismatches</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{metrics.conflicts_count}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400">Pending Verification</span>
          <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{metrics.pending_sync}</div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06] overflow-x-auto w-full sm:w-auto">
        <button
          onClick={() => setActiveTab("kyc")}
          className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-xs font-bold transition ${
            activeTab === "kyc"
              ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Sandbox Identity Records</span>
        </button>

        <button
          onClick={() => setActiveTab("consent")}
          className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-xs font-bold transition ${
            activeTab === "consent"
              ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Consent Records ({consents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("conflicts")}
          className={`flex items-center gap-2 rounded-[10px] px-4 py-2 text-xs font-bold transition ${
            activeTab === "conflicts"
              ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
              : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>Pending Queue &amp; Mismatches ({metrics.conflicts_count + metrics.pending_sync})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SANDBOX IDENTITY RECORDS                                          */}
      {/* ========================================================================= */}
      {activeTab === "kyc" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: sandbox identity console */}
          <div className="lg:col-span-7 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-sm space-y-5">
            <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <h2 className="text-base font-black text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <span>Sandbox ABDM Record Builder</span>
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                Pre-creation duplicate check, sandbox code entry, and zero raw Aadhaar storage.
              </p>
            </div>

            <form onSubmit={handleCompleteRegistration} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">Citizen Full Name *</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">Mobile Linked with Aadhaar *</label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                  />
                </div>
              </div>

              {/* FIX 3: Registry Check Trigger */}
              <div className="p-3.5 rounded-[14px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1D1D1F] dark:text-white">Pre-Creation Duplicate Check:</div>
                  <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                    Checks this clinic&apos;s local ABDM records before creating a new one.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckRegistry}
                  disabled={checkingRegistry}
                  className="px-3.5 py-2 rounded-[10px] bg-white dark:bg-[#1C1C1E] text-[#0071E3] dark:text-[#2997FF] border border-black/[0.08] dark:border-white/[0.12] font-bold text-xs shadow-apple-sm hover:bg-black/[0.02]"
                >
                  {checkingRegistry ? "Checking local records..." : "Check Records"}
                </button>
              </div>

              {registryMatch && (
                <div className="p-3.5 rounded-[14px] bg-blue-50 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="w-4 h-4" />
                    Existing Local ABDM Record Found:
                  </div>
                  <div className="text-xs">
                    ABHA ID: <strong className="font-mono text-[#0071E3] dark:text-[#2997FF]">{registryMatch.abha_number}</strong> ({registryMatch.abha_address})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatientCard(registryMatch);
                      showToast(`Existing local record linked for ${registryMatch.patient_name}. Duplicate prevented.`);
                    }}
                    className="px-3 py-1.5 bg-[#0071E3] text-white font-bold rounded-[8px] text-[11px]"
                  >
                    Link Existing Local Record (Recommended)
                  </button>
                </div>
              )}

              {/* FIX 2: masked Aadhaar / VID input */}
              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">
                  Aadhaar Reference / 16-Digit VID *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aadhaarInput}
                    onChange={(e) => setAadhaarInput(e.target.value)}
                    placeholder="Enter last 4 digits (e.g. 4819) or 16-digit VID"
                    className="flex-1 px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-mono focus:outline-none focus:border-[#0071E3]"
                  />
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="px-4 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold rounded-[12px] transition shrink-0"
                  >
                    {otpSent ? "New sandbox code" : "Generate sandbox code"}
                  </button>
                </div>
                <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-1">
                  🔒 Raw Aadhaar is never stored. Only the masked reference (XXXX-XXXX-1234) is retained.
                </p>
              </div>

              {/* OTP Input & Gateway Simulation Mode */}
              {otpSent && (
                <div className="p-4 rounded-[16px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                  <div>
                    <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">
                      Enter 6-Digit Sandbox Code *
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit sandbox code"
                      className="w-full px-3.5 py-2 bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[10px] text-[#1D1D1F] dark:text-white font-mono font-bold text-center tracking-widest text-base"
                    />
                  </div>

                  {/* FIX 4: Gateway Mode & Fallback Simulator */}
                  <div>
                    <label className="block text-[#86868B] dark:text-[#8E8E93] font-semibold mb-1 text-[11px]">
                      Sandbox gateway mode:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGatewayMode("sandbox")}
                        className={`p-2 rounded-[10px] border text-left transition ${
                          selectedGatewayMode === "sandbox"
                            ? "bg-white dark:bg-[#1C1C1E] border-[#0071E3] text-[#0071E3] font-bold shadow-sm"
                            : "border-black/[0.06] dark:border-white/[0.08] text-[#86868B]"
                        }`}
                      >
                        <div className="text-[11px]">Standard sandbox</div>
                        <div className="text-[10px] text-[#86868B]">Simulated verification</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGatewayMode("timeout_fallback")}
                        className={`p-2 rounded-[10px] border text-left transition ${
                          selectedGatewayMode === "timeout_fallback"
                            ? "bg-amber-50 dark:bg-amber-950/30 border-amber-500 text-amber-700 dark:text-amber-300 font-bold shadow-sm"
                            : "border-black/[0.06] dark:border-white/[0.08] text-[#86868B]"
                        }`}
                      >
                        <div className="text-[11px]">Simulate 504 Timeout</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400">Offline Queue Fallback</div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingKyc || !otpSent}
                className="w-full py-3 bg-[#0071E3] hover:bg-[#0077ED] text-white font-black rounded-[14px] text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingKyc ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Create Sandbox ABDM Record</span>
              </button>
            </form>
          </div>

          {/* Right Card: Sandbox ABDM Record Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-apple-sm">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3 mb-4">
                <span className="text-xs font-black text-[#1D1D1F] dark:text-white uppercase tracking-wider">
                  Sandbox ABDM Record Preview
                </span>
                <span className="text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] bg-[#0071E3]/10 px-2 py-0.5 rounded-[6px]">
                  Not a government document
                </span>
              </div>

              {selectedPatientCard ? (
                <div className="rounded-[18px] overflow-hidden border border-black/[0.1] dark:border-white/[0.12] bg-gradient-to-b from-[#FFF9F2] to-white dark:from-[#1E1914] dark:to-[#141416] p-5 shadow-md relative">
                  {/* National Tricolor Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#FF9933]">
                        Sandbox simulation
                      </div>
                      <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                        Simulated ABDM record
                      </div>
                    </div>
                    <div className="h-7 w-7 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center text-xs font-black">
                      🇮🇳
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 my-4 items-center">
                    <div className="col-span-2 space-y-2">
                      <div>
                        <span className="text-[9px] text-[#86868B] dark:text-[#8E8E93] uppercase font-bold">Citizen Name</span>
                        <div className="text-sm font-black text-[#1D1D1F] dark:text-white truncate">
                          {selectedPatientCard.patient_name}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#86868B] dark:text-[#8E8E93] uppercase font-bold">Simulated Identifier</span>
                        <div className="text-base font-black font-mono text-[#0071E3] dark:text-[#2997FF] tracking-wider">
                          {selectedPatientCard.abha_number}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#86868B] dark:text-[#8E8E93] uppercase font-bold">Simulated Address</span>
                        <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          {selectedPatientCard.abha_address}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.1]">
                      <QRCodeDisplay 
                        value={`SANDBOX-ABDM|${selectedPatientCard.abha_number}`}
                        size={84}
                      />
                      <span className="text-[8px] font-bold text-[#86868B] mt-1">Sandbox QR</span>
                    </div>
                  </div>

                  <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3 flex items-center justify-between text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                    <span>Masked Aadhaar: <strong className="font-mono text-[#1D1D1F] dark:text-white">{selectedPatientCard.masked_aadhaar}</strong></span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ● {selectedPatientCard.kyc_status}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-[#86868B] text-xs">
                  Select or register a citizen to preview a sandbox ABDM record.
                </div>
              )}
            </div>

            {/* Quick Link Citizen List */}
            <div className="rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm space-y-2">
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white block mb-1">
                Recent Sandbox Records ({patients.length})
              </span>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {patients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientCard(p)}
                    className={`p-2.5 rounded-[12px] border text-xs flex items-center justify-between cursor-pointer transition ${
                      selectedPatientCard?.id === p.id
                        ? "bg-[#0071E3]/10 border-[#0071E3]/40 text-[#0071E3] font-bold"
                        : "bg-[#F5F5F7] dark:bg-[#2C2C2E] border-transparent text-[#1D1D1F] dark:text-white hover:border-black/[0.08]"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{p.patient_name}</div>
                      <div className="text-[10px] font-mono text-[#86868B] dark:text-[#8E8E93]">{p.abha_number}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-[6px] font-bold ${
                      p.kyc_status === "VERIFIED" 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
                    }`}>
                      {p.kyc_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONSENT RECORDS                                                   */}
      {/* ========================================================================= */}
      {activeTab === "consent" && (
        <div className="space-y-4">
          <div className="rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-apple-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#1D1D1F] dark:text-white">
                Consent Records
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                Each local health-data release is checked against an unexpired consent record before access is allowed.
              </p>
            </div>
            <button
              onClick={() => setConsentModalOpen(true)}
              className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold text-xs rounded-[12px] shadow-sm transition"
            >
              + Create Consent Request
            </button>
          </div>

          <div className="space-y-3">
            {consents.map(c => {
              const isExpired = new Date(c.expiry_timestamp) < new Date();
              const isRevoked = c.status === "REVOKED";
              const isGranted = c.status === "GRANTED" && !isExpired && !isRevoked;

              return (
                <div 
                  key={c.id}
                  className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm text-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-[8px] bg-[#ECEEF2] dark:bg-white/[0.08] font-mono text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                        {c.consent_request_id}
                      </div>
                      <div>
                        <strong className="text-sm font-bold text-[#1D1D1F] dark:text-white">{c.patient_name}</strong>
                        <span className="text-[#86868B] dark:text-[#8E8E93] ml-1.5 font-mono">({c.abha_number})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isGranted && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Token Granted Locally
                        </span>
                      )}
                      {c.status === "REQUESTED" && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 font-bold text-[11px] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          Awaiting Sandbox Consent Code
                        </span>
                      )}
                      {isRevoked && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-bold text-[11px] flex items-center gap-1.5">
                          <Ban className="w-3.5 h-3.5" />
                          Access Revoked (Locked)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div>
                      <span className="text-[#86868B] dark:text-[#8E8E93] block">Clinical Purpose:</span>
                      <strong className="text-[#1D1D1F] dark:text-white font-semibold">{c.purpose_label}</strong>
                    </div>

                    <div>
                      <span className="text-[#86868B] dark:text-[#8E8E93] block">Expiry Schedule:</span>
                      <strong className="text-[#1D1D1F] dark:text-white font-semibold">
                        {new Date(c.expiry_timestamp).toLocaleDateString()} ({Math.max(0, Math.round((new Date(c.expiry_timestamp).getTime() - Date.now()) / (1000 * 3600 * 24)))} days left)
                      </strong>
                    </div>

                    <div>
                      <span className="text-[#86868B] dark:text-[#8E8E93] block">Audit Log &amp; Token:</span>
                      <span className="font-mono text-[#0071E3] dark:text-[#2997FF] truncate block">
                        {c.consent_artefact_id || "Awaiting Token Signature"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-black/[0.04] dark:border-white/[0.06] pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[#86868B]">
                      HDP Access Count: <strong>{c.access_count} times</strong> {c.revoked_by ? `• Revoked by ${c.revoked_by}` : ""}
                    </span>

                    <div className="flex items-center gap-2">
                      {c.status === "REQUESTED" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={consentOtpInputs[c.consent_request_id] || ""}
                            onChange={(e) =>
                              setConsentOtpInputs((prev) => ({
                                ...prev,
                                [c.consent_request_id]: e.target.value.replace(/\D/g, "").slice(0, 6),
                              }))
                            }
                            placeholder="6-digit code"
                            className="w-24 px-2 py-1.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[8px] font-mono text-center text-[11px] font-bold text-[#1D1D1F] dark:text-white"
                          />
                          <button
                            onClick={() => handleGrantConsent(c.consent_request_id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[8px] text-[11px]"
                          >
                            Record Sandbox Consent
                          </button>
                        </div>
                      )}

                      {isGranted && (
                        <button
                          onClick={() => handleRevokeConsent(c.consent_request_id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-[8px] text-[11px] shadow-sm flex items-center gap-1.5"
                        >
                          <Lock className="w-3 h-3" />
                          <span>1-Click Revoke Consent (Lock Access)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PENDING QUEUE & DEMOGRAPHIC MISMATCHES                            */}
      {/* ========================================================================= */}
      {activeTab === "conflicts" && (
        <div className="space-y-4">
          <div className="rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 shadow-apple-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-[#1D1D1F] dark:text-white">
                Pending Queue &amp; Demographic Conflict Resolver
              </h2>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                Keeps unverified records in a pending queue so the registration desk is never blocked, and flags demographic mismatches.
              </p>
            </div>

            <button
              onClick={handleSyncOfflineQueue}
              disabled={syncingQueue || metrics.pending_sync === 0}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-xs rounded-[12px] shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              <RotateCw className={`h-3.5 w-3.5 ${syncingQueue ? "animate-spin" : ""}`} />
              <span>Re-check Pending Queue</span>
            </button>
          </div>

          <div className="space-y-3">
            {patients.filter(p => p.demographic_conflict || p.kyc_status === "PENDING_NHA_SYNC").map(p => (
              <div
                key={p.id}
                className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-[#1D1D1F] dark:text-white">{p.patient_name}</strong>
                    <span className="font-mono text-[#86868B] dark:text-[#8E8E93]">({p.patient_phone})</span>
                  </div>

                  {p.demographic_conflict ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-bold text-[11px] border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Demographic mismatch flagged
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 font-bold text-[11px] border border-orange-300 dark:border-orange-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-orange-500" />
                      Pending verification
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-[12px] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-[#1D1D1F] dark:text-slate-300 leading-relaxed">
                  {p.conflict_details}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#86868B]">
                  <span>Masked Identity: <strong className="font-mono text-[#1D1D1F] dark:text-white">{p.masked_aadhaar}</strong></span>
                  <span>Gateway Mode: <strong className="font-mono text-[#0071E3] dark:text-[#2997FF]">{p.gateway_mode}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW TIME-BOUND CONSENT REQUEST                                     */}
      {/* ========================================================================= */}
      {consentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#151516]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[10px] bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-black text-[#1D1D1F] dark:text-white text-base">New Sandbox Consent Record</h3>
              </div>
              <button 
                onClick={() => setConsentModalOpen(false)}
                className="p-1.5 rounded-full text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConsentRequest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">Citizen Full Name *</label>
                <input
                  type="text"
                  value={consentPtName}
                  onChange={(e) => setConsentPtName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">ABHA Number *</label>
                <input
                  type="text"
                  value={consentAbha}
                  onChange={(e) => setConsentAbha(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-mono font-bold focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">Clinical Purpose Code *</label>
                <select
                  value={consentPurpose}
                  onChange={(e) => setConsentPurpose(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-semibold focus:outline-none focus:border-[#0071E3]"
                >
                  {ABDM_PURPOSE_CODES.map(p => (
                    <option key={p.code} value={p.code}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#1D1D1F] dark:text-white font-bold mb-1">Record Validity (Days) *</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={consentValidityDays}
                  onChange={(e) => setConsentValidityDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3.5 py-2.5 bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.12] rounded-[12px] text-[#1D1D1F] dark:text-white font-bold focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              <div className="p-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setConsentModalOpen(false)}
                  className="px-4 py-2 text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingConsent}
                  className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white font-bold rounded-[12px] text-xs shadow-sm transition disabled:opacity-50"
                >
                  {requestingConsent ? "Saving..." : "Create Sandbox Consent Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
