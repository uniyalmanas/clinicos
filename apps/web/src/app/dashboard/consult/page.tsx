"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Download, 
  Printer, 
  Share2, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  ExternalLink, 
  Stethoscope, 
  Pill, 
  Sparkles,
  ArrowRight,
  Filter
} from "lucide-react";
import { clinicToday } from "@/lib/clinic-date";

export default function PrescriptionsArchivePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPrescriptions = async () => {
      try {
        const res = await fetch("/api/prescriptions", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setLoadError(json?.error || "Could not load the prescription register.");
          setPrescriptions([]);
          return;
        }
        setPrescriptions(Array.isArray(json.prescriptions) ? json.prescriptions : []);
        setLoadError(null);
      } catch (err) {
        if (!cancelled) {
          setLoadError("Could not reach the prescription register. Check your connection.");
          setPrescriptions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadPrescriptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const todayIso = clinicToday();

  const doctorFilters = useMemo(() => {
    const seen = new Map<string, string>();
    prescriptions.forEach((rx) => {
      if (rx.doctor_slug && !seen.has(rx.doctor_slug)) {
        seen.set(rx.doctor_slug, rx.doctor_name);
      }
    });
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
  }, [prescriptions]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1-Click Excel CSV Export
  const handleExportCsv = () => {
    try {
      if (prescriptions.length === 0) {
        showToast("No prescriptions to export yet.");
        return;
      }
      const headers = ["Rx Number", "Date", "Token", "Patient Name", "Phone", "Age", "Gender", "Doctor", "Provisional Diagnosis", "Medicines", "Consultation Fee", "Payment Status"];
      const rows = prescriptions.map(rx => [
        rx.rx_id,
        rx.date,
        rx.token_number ?? "",
        `"${rx.patient_name}"`,
        rx.patient_phone,
        rx.age ?? "",
        rx.gender ?? "",
        `"${rx.doctor_name}"`,
        `"${rx.provisional_diagnosis || ""}"`,
        `"${(rx.medications || []).join(" | ")}"`,
        rx.fee_amount ?? "",
        rx.payment_status ?? ""
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Clinic_Prescriptions_Register_${clinicToday()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("✓ Prescriptions Register exported to .CSV for Excel");
    } catch {
      showToast("Export error");
    }
  };

  const filteredRx = prescriptions.filter(rx => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      String(rx.rx_id || "").toLowerCase().includes(query) ||
      String(rx.patient_name || "").toLowerCase().includes(query) ||
      String(rx.patient_phone || "").includes(searchQuery) ||
      String(rx.provisional_diagnosis || "").toLowerCase().includes(query) ||
      (rx.medications || []).some((m: string) => String(m).toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (selectedFilter === "today") return rx.date_iso === todayIso;
    if (selectedFilter !== "all") return rx.doctor_slug === selectedFilter;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-[#1D1D1F] border border-white/10 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold tracking-wider uppercase">
              RX ARCHIVE
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Clinic Prescription Register
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Digital prescription vault • Direct WhatsApp re-dispatch • Generic Jan Aushadhi comparison
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#151618] px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs transition"
            title="Export all prescription records to .CSV for Excel"
          >
            <Download className="h-3.5 w-3.5 text-[#0071E3]" />
            <span>Export to Excel (.CSV)</span>
          </button>

          <Link
            href="/doctor/consult"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Consultation</span>
          </Link>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setSelectedFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              selectedFilter === "all"
                ? "bg-[#0071E3] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300"
            }`}
          >
            All Prescriptions ({prescriptions.length})
          </button>
          <button
            onClick={() => setSelectedFilter("today")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              selectedFilter === "today"
                ? "bg-[#0071E3] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300"
            }`}
          >
            Today ({prescriptions.filter(p => p.date_iso === todayIso).length})
          </button>
          {doctorFilters.map((doc) => (
            <button
              key={doc.slug}
              onClick={() => setSelectedFilter(doc.slug)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                selectedFilter === doc.slug
                  ? "bg-[#0071E3] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300"
              }`}
            >
              {doc.name}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, diagnosis, medicine..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#151618] py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 shadow-xs focus:outline-none focus:border-[#0071E3] focus:ring-1 focus:ring-[#0071E3]"
          />
        </div>
      </div>

      {/* Prescription Register Table */}
      <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#151618] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.08] text-[11px] uppercase font-semibold text-slate-500">
              <tr>
                <th className="py-2.5 px-4">Rx ID & Date</th>
                <th className="py-2.5 px-4">Patient Details</th>
                <th className="py-2.5 px-4">Doctor</th>
                <th className="py-2.5 px-4">Diagnosis</th>
                <th className="py-2.5 px-4">Prescribed Medicines</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-xs text-slate-400">
                    Loading prescription register…
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-xs text-rose-600 dark:text-rose-400">
                    {loadError}
                  </td>
                </tr>
              ) : filteredRx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-xs text-slate-400">
                    {prescriptions.length === 0
                      ? "No prescriptions yet. Completed consultations appear here automatically."
                      : "No prescriptions match this filter."}
                  </td>
                </tr>
              ) : filteredRx.map(rx => (
                <tr key={rx.rx_id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-[#0071E3] dark:text-[#2997FF]">
                      {rx.rx_id}
                    </span>
                    <div className="text-[11px] text-slate-400">{rx.date}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {rx.patient_name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {rx.age}Y • {rx.gender} • <span className="font-mono">{rx.patient_phone}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {rx.doctor_name}
                    </div>
                    <div className="text-[10px] text-slate-400">{rx.specialization}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                      {rx.provisional_diagnosis}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      {rx.medications.map((m: string, idx: number) => (
                        <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          • {m}
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/p/${rx.rx_id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/[0.1] px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-xs transition"
                        title="View Public Digital Rx PDF"
                      >
                        <ExternalLink className="h-3 w-3 text-[#0071E3]" />
                        <span>View</span>
                      </Link>

                      <a
                        href={`https://wa.me/${rx.patient_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Namaste ${rx.patient_name}, your digital prescription ${rx.rx_id} from ${rx.doctor_name} is available here: ${origin}/p/${rx.rx_id}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-100 transition shadow-xs"
                        title="Re-send prescription via WhatsApp"
                      >
                        <Share2 className="h-3 w-3" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
