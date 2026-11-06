"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  FileText,
  Image,
  AlertTriangle,
  ChevronRight,
  Download,
  Search,
  Stethoscope,
  Pill,
  Printer,
  Send,
  Clock,
  Calendar,
  ShieldCheck,
  Languages,
} from "lucide-react";
import { Modal } from "@/components/design-system";
import type { ConsultationReport } from "@/lib/consultation-types";

/* ─────────────────────────────────────────────────────────
   PatientVaultPanel — the patient's living medical record

   Two kinds of history, in one place:
   • Visit reports — AI consultation summaries (doctor + patient copies)
   • Files         — lab reports, scans, discharge summaries

   Doctors see this during a consultation; patients see the same
   reports through their portal.
   ───────────────────────────────────────────────────────── */

type Document = {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  file_size_kb?: number | null;
  uploaded_at: string;
  patient_name: string;
};

type PatientVaultPanelProps = {
  patientPhone: string;
  className?: string;
  /** Change this value to force a reload (e.g. after a report is approved). */
  refreshKey?: number;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  prescription: "Prescription",
  lab_report: "Lab Report",
  xray: "X-Ray",
  mri: "MRI Scan",
  ultrasound: "Ultrasound",
  discharge_summary: "Discharge Summary",
  consultation_report: "Visit Report",
  other: "Other",
};

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  prescription: FileText,
  lab_report: AlertTriangle,
  xray: Image,
  mri: Image,
  ultrasound: Image,
  discharge_summary: FileText,
  consultation_report: Stethoscope,
  other: FileText,
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatSize(kb: number | null | undefined) {
  if (!kb) return "—";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function PatientVaultPanel({
  patientPhone,
  className,
  refreshKey = 0,
}: PatientVaultPanelProps) {
  const [tab, setTab] = useState<"reports" | "files">("reports");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [reports, setReports] = useState<ConsultationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDocs, setOpenDocs] = useState<Record<string, string>>({});
  const [activeReport, setActiveReport] = useState<ConsultationReport | null>(null);
  const [reportView, setReportView] = useState<"patient" | "doctor">("patient");

  const cleanPhone = patientPhone.replace(/[^0-9]/g, "").slice(-10);

  const authHeaders = useCallback((): Record<string, string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const load = useCallback(async () => {
    if (cleanPhone.length !== 10) return;
    setLoading(true);
    setError(null);
    try {
      const [docRes, reportRes] = await Promise.all([
        fetch(`/api/documents?patient_phone=${encodeURIComponent(cleanPhone)}`, {
          headers: authHeaders(),
        }),
        fetch(`/api/consultations/reports?patient_phone=${encodeURIComponent(cleanPhone)}`, {
          headers: authHeaders(),
        }),
      ]);

      if (docRes.ok) {
        const data = await docRes.json();
        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      }
      if (reportRes.ok) {
        const data = await reportRes.json();
        setReports(Array.isArray(data.reports) ? data.reports : []);
      } else if (reportRes.status !== 403) {
        // Reports may not be enabled until migration 009 is applied; the file
        // list should still load.
        setReports([]);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load the patient vault.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, cleanPhone]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const getSignedUrl = useCallback(
    async (docId: string) => {
      if (openDocs[docId]) return openDocs[docId];
      try {
        const res = await fetch(`/api/documents/signed-url?id=${encodeURIComponent(docId)}`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Unable to open document");
        const data = await res.json();
        setOpenDocs((prev) => ({ ...prev, [docId]: data.signed_url }));
        window.open(data.signed_url, "_blank", "noopener,noreferrer");
        return data.signed_url;
      } catch (err: any) {
        setError(err?.message || "Document not available.");
        return null;
      }
    },
    [authHeaders, openDocs]
  );

  const printReport = useCallback((report: ConsultationReport) => {
    const patient = report.patient_report || {};
    const meds = (patient.medicine_schedule || [])
      .map(
        (slot) =>
          `<tr><td>${escapeHtml(slot.timing || "")}</td><td>${escapeHtml(slot.medicine || "")}</td><td>${escapeHtml(slot.instructions || "")}</td></tr>`
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Visit Report — ${escapeHtml(report.patient_name)}</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1d1d1f; margin: 40px; line-height: 1.55; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6e6e73; margin: 24px 0 8px; }
        .meta { color: #6e6e73; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #e5e5ea; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f5f6f9; }
        .box { border: 1px solid #e5e5ea; border-radius: 10px; padding: 12px 14px; font-size: 13px; }
        .warn { border-color: #f5c2c7; background: #fff5f5; }
        @media print { body { margin: 16mm; } }
      </style></head><body>
      <h1>Visit Report</h1>
      <div class="meta">${escapeHtml(report.patient_name)} · ${escapeHtml(formatDate(report.created_at))}${report.doctor_name ? ` · ${escapeHtml(report.doctor_name)}` : ""}</div>
      <h2>What we found</h2>
      <div class="box">${escapeHtml(patient.condition_overview || report.provisional_diagnosis || "")}</div>
      ${meds ? `<h2>Medicines</h2><table><thead><tr><th>When</th><th>Medicine</th><th>How to take</th></tr></thead><tbody>${meds}</tbody></table>` : ""}
      ${patient.home_care_guidance ? `<h2>Home care</h2><div class="box">${escapeHtml(patient.home_care_guidance)}</div>` : ""}
      ${patient.emergency_warning_signs ? `<h2>Return immediately if</h2><div class="box warn">${escapeHtml(patient.emergency_warning_signs)}</div>` : ""}
      ${patient.followup_instruction ? `<h2>Next visit</h2><div class="box">${escapeHtml(patient.followup_instruction)}</div>` : ""}
      </body></html>`;

    // `noopener` makes window.open() return null, so keep the blank same-origin
    // window referencable until we have written and printed the report.
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }, []);

  const shareReport = useCallback((report: ConsultationReport) => {
    const phone = report.patient_phone.replace(/[^0-9]/g, "").slice(-10);
    const overview = report.patient_report?.condition_overview || report.provisional_diagnosis || "";
    const followUp = report.patient_report?.followup_instruction
      ? `\n\nNext step: ${report.patient_report.followup_instruction}`
      : "";
    const text = `Namaste ${report.patient_name},\n\nYour visit summary (${formatDate(report.created_at)}):\n${overview}${followUp}\n\nThe full report is saved in your Clinic OS vault.`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }, []);

  const query = searchQuery.toLowerCase();
  const filteredReports = reports.filter(
    (report) =>
      !query ||
      report.patient_name.toLowerCase().includes(query) ||
      String(report.provisional_diagnosis || "").toLowerCase().includes(query) ||
      String(report.doctor_name || "").toLowerCase().includes(query)
  );
  const filteredDocuments = documents.filter(
    (doc) =>
      !query ||
      doc.title.toLowerCase().includes(query) ||
      doc.file_name.toLowerCase().includes(query) ||
      doc.document_type.toLowerCase().includes(query)
  );

  const reportTabClass =
    tab === "reports"
      ? "flex-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-900 shadow-xs dark:bg-[#20242B] dark:text-white"
      : "flex-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white";
  const filesTabClass =
    tab === "files"
      ? "flex-1 rounded-lg bg-white px-3 py-1.5 text-[11px] font-extrabold text-slate-900 shadow-xs dark:bg-[#20242B] dark:text-white"
      : "flex-1 rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white";

  const activePatient = activeReport?.patient_report || {};
  const activeDoctor = activeReport?.doctor_report || {};

  return (
    <>
      <div className={`rounded-2xl border-2 border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-[#121417] shadow-sm ${className || ""}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2.5 mb-2.5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Patient Vault
            </span>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
            {reports.length + documents.length} items
          </span>
        </div>

        {/* Tabs */}
        <div className="mb-2.5 flex items-center gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
          <button type="button" onClick={() => setTab("reports")} className={reportTabClass}>
            Visit reports
            {reports.length > 0 && <span className="ml-1 text-[9px] opacity-80">({reports.length})</span>}
          </button>
          <button type="button" onClick={() => setTab("files")} className={filesTabClass}>
            Files
            {documents.length > 0 && <span className="ml-1 text-[9px] opacity-80">({documents.length})</span>}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={tab === "reports" ? "Search visits, diagnosis…" : "Search reports, labs…"}
            className="w-full rounded-lg border-2 border-slate-300 bg-white py-1.5 pl-8 pr-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:border-[#0071E3]"
          />
        </div>

        {loading && (
          <div className="flex h-24 flex-col items-center justify-center text-center">
            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3]" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Loading vault…</p>
          </div>
        )}

        {/* Visit reports */}
        {!loading && tab === "reports" && (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {filteredReports.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <Stethoscope className="mx-auto mb-2 h-6 w-6 text-slate-500 dark:text-slate-400" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">No visit summaries yet.</p>
                <p className="mt-1 text-[11px]">Record a consultation and approve the report to start the history.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => {
                    setActiveReport(report);
                    setReportView("patient");
                  }}
                  className="group flex w-full items-start justify-between gap-2 rounded-xl border-2 border-slate-200 p-2.5 text-left transition hover:border-[#0071E3] dark:border-slate-800 dark:hover:border-[#2997FF] bg-slate-50/60 dark:bg-slate-900/40"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                      <Stethoscope className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                        {report.provisional_diagnosis || "Consultation summary"}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(report.created_at)}</span>
                        {report.doctor_name && (
                          <>
                            <span>·</span>
                            <span className="truncate">{report.doctor_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF]" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Files */}
        {!loading && tab === "files" && (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {filteredDocuments.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <Image className="mx-auto mb-2 h-6 w-6 text-slate-500 dark:text-slate-400" />
                <p className="font-semibold text-slate-800 dark:text-slate-200">No files in the vault yet.</p>
              </div>
            ) : (
              filteredDocuments.map((doc) => {
                const Icon = DOC_TYPE_ICONS[doc.document_type] ?? FileText;
                return (
                  <div
                    key={doc.id}
                    className="group flex items-center justify-between rounded-xl border-2 border-slate-200 p-2.5 transition hover:border-[#0071E3] dark:border-slate-800 dark:hover:border-[#2997FF] bg-slate-50/60 dark:bg-slate-900/40"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/10 dark:text-[#2997FF]">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-slate-900 dark:text-white">
                          {doc.title || doc.file_name}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          <span>{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                          <span>·</span>
                          <span>{formatSize(doc.file_size_kb)}</span>
                          <span>·</span>
                          <span>{formatDate(doc.uploaded_at)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => getSignedUrl(doc.id)}
                      className="flex shrink-0 items-center gap-1 rounded-lg border-2 border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-xs"
                      title="Open document"
                    >
                      <Download className="h-3 w-3" />
                      View
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {error && (
          <div className="mt-2 flex items-start gap-1 rounded-lg border border-rose-500/30 bg-rose-50/30 p-2 text-[11px] text-rose-700 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-2 flex items-center gap-1 text-[9px] text-[#86868B] dark:text-[#636366]">
          <ShieldCheck className="h-2.5 w-2.5" />
          Private to this patient and their care team
        </div>
      </div>

      {/* Report modal */}
      <Modal
        open={!!activeReport}
        onClose={() => setActiveReport(null)}
        title={activeReport ? `Visit Report · ${formatDate(activeReport.created_at)}` : "Visit Report"}
        size="xl"
      >
        {activeReport && (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {activeReport.provisional_diagnosis || "Consultation summary"}
                </div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {activeReport.patient_name}
                  {activeReport.doctor_name ? ` · ${activeReport.doctor_name}` : ""}
                  {activeReport.duration_seconds
                    ? ` · ${Math.round(activeReport.duration_seconds / 60)} min consult`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReportView("patient")}
                  className={
                    reportView === "patient"
                      ? "rounded-lg bg-white px-3 py-1 text-xs font-extrabold text-slate-900 shadow-xs dark:bg-[#20242B] dark:text-white"
                      : "rounded-lg px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }
                >
                  Patient copy
                </button>
                <button
                  type="button"
                  onClick={() => setReportView("doctor")}
                  className={
                    reportView === "doctor"
                      ? "rounded-lg bg-white px-3 py-1 text-xs font-extrabold text-slate-900 shadow-xs dark:bg-[#20242B] dark:text-white"
                      : "rounded-lg px-3 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }
                >
                  Clinical note
                </button>
              </div>
            </div>

            {reportView === "patient" ? (
              <div className="space-y-3.5 text-slate-900 dark:text-slate-100">
                <div className="flex items-start gap-2 rounded-xl bg-violet-500/10 border-2 border-violet-500/20 p-2.5 text-xs font-bold text-violet-800 dark:text-violet-300">
                  <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Written in the language the patient chose: {activeReport.language}
                </div>

                {activePatient.condition_overview && (
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      What we found
                    </div>
                    <p className="rounded-xl border-2 border-slate-200 p-3 text-xs font-medium leading-relaxed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {activePatient.condition_overview}
                    </p>
                  </div>
                )}

                {!!activePatient.medicine_schedule?.length && (
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      <Pill className="h-3.5 w-3.5 text-[#0071E3]" /> Medicines
                    </div>
                    <div className="space-y-1.5">
                      {activePatient.medicine_schedule.map((slot, index) => (
                        <div
                          key={index}
                          className="rounded-xl border-2 border-slate-200 p-2.5 text-xs dark:border-slate-800 bg-white dark:bg-slate-900/50"
                        >
                          <div className="flex items-center gap-1.5 font-extrabold text-slate-900 dark:text-white">
                            <Clock className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                            {slot.timing || "When needed"}
                          </div>
                          <div className="mt-1 font-bold text-slate-800 dark:text-slate-200">{slot.medicine}</div>
                          {slot.instructions && (
                            <div className="mt-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                              {slot.instructions}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePatient.home_care_guidance && (
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Home care
                    </div>
                    <p className="rounded-xl border-2 border-slate-200 p-3 text-xs font-medium leading-relaxed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {activePatient.home_care_guidance}
                    </p>
                  </div>
                )}

                {activePatient.emergency_warning_signs && (
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> Return immediately if
                    </div>
                    <p className="rounded-xl border-2 border-amber-500/40 bg-amber-50/70 p-3 text-xs font-semibold leading-relaxed text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
                      {activePatient.emergency_warning_signs}
                    </p>
                  </div>
                )}

                {activePatient.followup_instruction && (
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Next visit
                    </div>
                    <p className="rounded-xl border-2 border-slate-200 p-3 text-xs font-medium leading-relaxed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {activePatient.followup_instruction}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3.5 text-slate-900 dark:text-slate-100">
                <div>
                  <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Clinical summary
                  </div>
                  <p className="rounded-xl border-2 border-slate-200 p-3 text-xs font-medium leading-relaxed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    {activeDoctor.clinical_summary || "—"}
                  </p>
                </div>
                {activeDoctor.vitals_assessment && (
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Vitals assessment
                    </div>
                    <p className="rounded-xl border-2 border-slate-200 p-3 text-xs font-medium leading-relaxed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      {activeDoctor.vitals_assessment}
                    </p>
                  </div>
                )}
                {!!activeDoctor.differential_diagnoses?.length && (
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Differentials
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeDoctor.differential_diagnoses.map((item, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-800 dark:text-blue-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {!!activeDoctor.red_flags?.length && (
                  <div>
                    <div className="mb-1 text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Red flags
                    </div>
                    <ul className="rounded-xl border-2 border-amber-500/40 bg-amber-50/70 p-3 text-xs font-semibold text-amber-950 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
                      {activeDoctor.red_flags.map((flag, index) => (
                        <li key={index}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {!!activeReport.medicines.length && (
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      <Pill className="h-3.5 w-3.5 text-[#0071E3]" /> Prescribed generics
                    </div>
                    <div className="space-y-1.5">
                      {activeReport.medicines.map((medicine, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        >
                          <span>
                            {medicine.medicine_name || medicine.generic_name || "Medicine"}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                            {medicine.frequency || "—"} · {medicine.duration || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <details className="rounded-xl border-2 border-slate-200 p-2.5 dark:border-slate-800">
                  <summary className="cursor-pointer text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Raw transcript (audit trail)
                  </summary>
                  <p className="mt-2 whitespace-pre-wrap text-xs font-mono leading-relaxed text-slate-700 dark:text-slate-300">
                    {activeReport.transcript || "—"}
                  </p>
                </details>
              </div>
            )}

            <div className="flex items-center gap-2 border-t-2 border-slate-200 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => printReport(activeReport)}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
              <button
                type="button"
                onClick={() => shareReport(activeReport)}
                className="inline-flex items-center gap-1.5 rounded-lg border-2 border-emerald-600/30 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs"
              >
                <Send className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Send on WhatsApp
              </button>
              <span className="ml-auto text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Approved {formatDate(activeReport.approved_at || activeReport.created_at)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
