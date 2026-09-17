"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ExternalLink, 
  Filter, 
  ArrowLeft,
  Building2,
  Stethoscope,
  BarChart3,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface DoctorRecord {
  slug: string;
  full_name: string;
  specialization: string;
  qualification_summary: string;
  medical_council_reg_number: string;
  medical_council_state: string;
  clinic_name: string;
  verification_status: "verified" | "pending" | "rejected";
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

export default function AdminVerificationsPage() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([
    {
      slug: "dr-rahul-sharma",
      full_name: "Dr. Rahul Sharma",
      specialization: "Dermatologist & Hair Transplant Specialist",
      qualification_summary: "MBBS, MD (Dermatology) - AIIMS Rishikesh",
      medical_council_reg_number: "UK-MC-14892",
      medical_council_state: "Uttarakhand Medical Council",
      clinic_name: "Derma Care Skin & Laser Centre",
      verification_status: "verified"
    },
    {
      slug: "dr-aditi-joshi",
      full_name: "Dr. Aditi Joshi",
      specialization: "Dental Surgeon & Implantologist",
      qualification_summary: "BDS, MDS (Prosthodontics) - Seema Dental College",
      medical_council_reg_number: "UK-DC-08921",
      medical_council_state: "Uttarakhand Dental Council",
      clinic_name: "Smile Craft Multi-Speciality Dental",
      verification_status: "verified"
    },
    {
      slug: "dr-vikram-sethi",
      full_name: "Dr. Vikram Sethi",
      specialization: "Senior Paediatrician & Neonatologist",
      qualification_summary: "MBBS, MD (Paediatrics) - PGI Chandigarh",
      medical_council_reg_number: "UK-MC-20114",
      medical_council_state: "Uttarakhand Medical Council",
      clinic_name: "Dron Child & Newborn Health Centre",
      verification_status: "pending"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/verifications`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDoctors(data);
        }
      }
    } catch (e) {
      console.error("Failed to load verification list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleVerify = async (slug: string, newStatus: "verified" | "rejected") => {
    // Optimistic UI update
    setDoctors(prev =>
      prev.map(d => (d.slug === slug ? { ...d, verification_status: newStatus } : d))
    );

    const docName = doctors.find(d => d.slug === slug)?.full_name || "Doctor";
    setToastMessage(`${docName} status updated to ${newStatus.toUpperCase()}`);
    setTimeout(() => setToastMessage(null), 4000);

    try {
      await fetch(`${API_BASE}/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: slug,
          verification_status: newStatus,
          admin_notes: `Processed by SuperAdmin at ${new Date().toLocaleTimeString()}`
        })
      });
    } catch (err) {
      console.error("Error updating status on server:", err);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = 
      doc.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.medical_council_reg_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clinic_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || doc.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countVerified = doctors.filter(d => d.verification_status === "verified").length;
  const countPending = doctors.filter(d => d.verification_status === "pending").length;
  const countRejected = doctors.filter(d => d.verification_status === "rejected").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 1. TOP SUPERADMIN NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">Platform Governance</span>
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 dark:bg-red-950 dark:text-red-300">
                  SuperAdmin
                </span>
              </div>
              <p className="text-xs text-slate-500">NMC Medical Registration & Doctor Compliance Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <BarChart3 className="h-4 w-4 text-brand-600" />
              SaaS MRR Analytics
            </Link>
            <button
              onClick={fetchDoctors}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-brand-600" : ""}`} />
              Sync
            </button>
          </div>
        </div>
      </header>

      {/* TOAST ALERT */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* 2. BODY CONTENT */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-500">Total Registered</span>
            <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{doctors.length}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <Stethoscope className="h-3.5 w-3.5 text-brand-600" /> Dehradun Pilot Doctors
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Verified & Active</span>
            <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{countVerified}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Blue badge active on profile
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Pending Review</span>
            <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{countPending}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> Awaiting council cross-check
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
            <span className="text-xs font-medium text-red-800 dark:text-red-300">Rejected / Flagged</span>
            <div className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">{countRejected}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> Requires council audit
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name, reg number, specialization..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs dark:border-slate-800 dark:bg-slate-900">
              {["all", "verified", "pending", "rejected"].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition ${
                    statusFilter === st
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DOCTORS TABLE */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Doctor Details</th>
                  <th className="px-6 py-3.5 font-semibold">Council Reg. Number</th>
                  <th className="px-6 py-3.5 font-semibold">Clinic & Location</th>
                  <th className="px-6 py-3.5 font-semibold">Verification Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">SuperAdmin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDoctors.map(doc => (
                  <tr key={doc.slug} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                          {doc.full_name.split(" ").slice(1).map(n => n[0]).join("") || "DR"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            {doc.full_name}
                            {doc.verification_status === "verified" && (
                              <span title="Council Verified">
                                <ShieldCheck className="h-4 w-4 text-brand-600" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{doc.specialization}</p>
                          <p className="text-[10px] text-slate-400">{doc.qualification_summary}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {doc.medical_council_reg_number}
                      </div>
                      <div className="text-[11px] text-slate-500">{doc.medical_council_state}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {doc.clinic_name}
                      </div>
                      <div className="text-[11px] text-slate-400">Dehradun Hub</div>
                    </td>

                    <td className="px-6 py-4">
                      {doc.verification_status === "verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : doc.verification_status === "pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock className="h-3.5 w-3.5" /> Pending Audit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.verification_status !== "verified" ? (
                          <button
                            onClick={() => handleVerify(doc.slug, "verified")}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(doc.slug, "rejected")}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:bg-slate-800 dark:text-red-400"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Revoke Badge
                          </button>
                        )}

                        <Link
                          href={`/doctors/${doc.slug}`}
                          target="_blank"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="View Public Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NMC MEDICAL DISCLAIMER BOX */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-600 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                National Medical Commission (NMC) Telemedicine Practice Guidelines & DPDP Compliance
              </p>
              <p>
                Every independent doctor registered on DocSphere ClinicOS must hold a valid State Medical Council or National Medical Commission registration. Verifications ensure patients see authentic registration numbers on all digital prescriptions (e.g. SHA-256 tamper-proof PDFs), complying with Indian healthcare statutes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
