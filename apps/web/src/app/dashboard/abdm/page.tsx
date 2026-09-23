"use client";

import React, { useState } from "react";
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
  ExternalLink
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";

interface AbhaProfile {
  abha_number: string;
  abha_address: string;
  patient_name: string;
  patient_phone: string;
  status: string;
  verification_method: string;
  created_at?: string;
}

export default function AbdmDashboardPage() {
  const [activeTab, setActiveTab] = useState<"create" | "verify">("create");

  // Form states
  const [patientName, setPatientName] = useState("Vikas Sharma");
  const [patientPhone, setPatientPhone] = useState("+919876543210");
  const [aadhaarLast4, setAadhaarLast4] = useState("4819");
  const [abhaSearch, setAbhaSearch] = useState("91-4819-2041-8891");
  const [loading, setLoading] = useState(false);

  // Result card
  const [generatedAbha, setGeneratedAbha] = useState<AbhaProfile | null>({
    abha_number: "91-4819-2041-8891",
    abha_address: "vikassharma3210@abdm",
    patient_name: "Vikas Sharma",
    patient_phone: "+919876543210",
    status: "verified",
    verification_method: "Aadhaar e-KYC (NHA Sandbox Milestone 1)"
  });

  const handleGenerateAbha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          patient_name: patientName,
          patient_phone: patientPhone,
          aadhaar_last4: aadhaarLast4
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedAbha(data.abha);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAbha = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch("/api/abdm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          abha_number: abhaSearch
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedAbha(data.abha);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 rounded-2xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                Ayushman Bharat Digital Mission (ABDM)
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-semibold">
                  ABHA Gateway M1/M2
                </span>
              </h1>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                National Health Authority (NHA) Ayushman Bharat Health Account (ABHA) creation, Aadhaar e-KYC & FHIR digital linkage
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NHA Sandbox Connected</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Linked ABHA Accounts</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            184
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Patients with verified 14-digit ID</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Aadhaar e-KYC Rate</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-apple-blue">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            92.4%
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">High biometric accuracy</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">FHIR Records Synced</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            412
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Prescriptions & diagnostic orders</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">NHA Compliance</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 font-mono">
            Milestone 2
          </div>
          <div className="mt-2 text-xs text-[#86868B]">HIP/HIU Certified Gateway</div>
        </div>
      </div>

      {/* Main Split: Left Form (Generate/Verify), Right: Official ABHA Smart Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 5 cols */}
        <div className="lg:col-span-5 rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
          <div className="flex items-center gap-2 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "create"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm"
                  : "text-[#86868B]"
              }`}
            >
              Generate New ABHA
            </button>
            <button
              onClick={() => setActiveTab("verify")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "verify"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm"
                  : "text-[#86868B]"
              }`}
            >
              Verify Existing ABHA
            </button>
          </div>

          {activeTab === "create" ? (
            <form onSubmit={handleGenerateAbha} className="space-y-3.5 text-xs pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Aadhaar Linked Mobile</label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Last 4 Digits of Aadhaar</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="e.g. 4819"
                  value={aadhaarLast4}
                  onChange={(e) => setAadhaarLast4(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono text-center tracking-widest text-sm font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[11px]">
                An OTP simulation will verify the citizen against the National Health Authority Sandbox.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>Generate & Issue ABHA Card</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAbha} className="space-y-3.5 text-xs pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Enter 14-Digit ABHA Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 91-4819-2041-8891"
                  value={abhaSearch}
                  onChange={(e) => setAbhaSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>Verify Citizen on NHA Gateway</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Preview: 7 cols - Ayushman Bharat Health Account Card */}
        <div className="lg:col-span-7 space-y-4">
          {generatedAbha ? (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  Official ABHA Smart Card Preview
                </span>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.05] text-xs font-medium hover:bg-black/10 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print ABHA Card
                </button>
              </div>

              {/* ABHA Card Graphic (Government style) */}
              <div className="w-full max-w-lg mx-auto rounded-[24px] border-2 border-emerald-600/40 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0d281e] dark:to-[#091e17] p-6 shadow-2xl text-[#1D1D1F] dark:text-white space-y-4">
                {/* Government Header */}
                <div className="flex justify-between items-center border-b border-emerald-600/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                      🇮🇳
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        National Health Authority • Govt of India
                      </div>
                      <div className="text-xs font-extrabold text-[#1D1D1F] dark:text-white">
                        Ayushman Bharat Health Account (ABHA)
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                    VALID
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex gap-4 items-center">
                  <div className="p-2 rounded-2xl bg-white dark:bg-black/40 border border-emerald-600/20 shadow-sm shrink-0">
                    <QRCodeDisplay
                      value={`https://abdm.gov.in/abha/${generatedAbha.abha_number}`}
                      size={80}
                      level="M"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold">Citizen Name:</span>
                      <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                        {generatedAbha.patient_name}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold">14-Digit ABHA Number:</span>
                      <div className="font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-300 tracking-wider">
                        {generatedAbha.abha_number}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] uppercase font-semibold">ABHA Address:</span>
                      <div className="font-mono text-[11px] text-[#515154] dark:text-[#A1A1A6]">
                        {generatedAbha.abha_address}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-emerald-600/20 flex justify-between items-center text-[10px] text-[#86868B]">
                  <span>{generatedAbha.verification_method}</span>
                  <span className="font-mono">ClinicOS • ABDM Node</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#86868B] rounded-[24px] border border-dashed">
              Generate or verify an ABHA profile to preview official Ayushman Bharat digital card.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
