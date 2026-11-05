"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  FileText,
  Clock,
  Image,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Download,
  Search,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   PatientVaultPanel — Patient's reports visible to doctor
   
   During consultation, the doctor can see:
   • Past lab reports, prescriptions, scans (from patient vault)
   • Signed URLs (5-min expiry) for secure viewing
   • Allergies & chronic conditions flagged
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
};

const DOC_TYPE_LABELS: Record<string, string> = {
  prescription: "Prescription",
  lab_report: "Lab Report",
  xray: "X-Ray",
  mri: "MRI Scan",
  ultrasound: "Ultrasound",
  discharge_summary: "Discharge Summary",
  other: "Other",
};

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  prescription: FileText,
  lab_report: AlertTriangle,
  xray: Image,
  mri: Image,
  ultrasound: Image,
  discharge_summary: FileText,
  other: FileText,
};

export function PatientVaultPanel({ patientPhone, className }: PatientVaultPanelProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDocs, setOpenDocs] = useState<Record<string, string>>({});

  const loadDocuments = useCallback(async () => {
    if (!patientPhone) return;
    setLoading(true);
    setError(null);
    try {
      const cleanPhone = patientPhone.replace(/[^0-9]/g, "").slice(-10);
      const res = await fetch(
        `/api/documents?patient_phone=${encodeURIComponent(cleanPhone)}`,
        {
          headers: {
            Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : ""}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (err: any) {
      setError(err.message || "Unable to load patient vault.");
    } finally {
      setLoading(false);
    }
  }, [patientPhone]);

  useEffect(() => {
    loadDocuments();
  }, [patientPhone, loadDocuments]);

  const getSignedUrl = useCallback(async (docId: string) => {
    if (openDocs[docId]) return openDocs[docId];
    try {
      const res = await fetch(
        `/api/documents/signed-url?id=${encodeURIComponent(docId)}`,
        {
          headers: {
            Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : ""}`,
          },
        }
      );
      if (!res.ok) throw new Error("Unable to open document");
      const data = await res.json();
      setOpenDocs((prev) => ({ ...prev, [docId]: data.signed_url }));
      return data.signed_url;
    } catch (err: any) {
      setError(err.message || "Document not available.");
      return null;
    }
  }, []);

  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatSize = (kb: number | null | undefined) => {
    if (!kb) return "—";
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const IconForDoc = (docType: string) => {
    return DOC_TYPE_ICONS[docType] ?? FileText;
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 dark:border-white/[0.08] ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 mb-2 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
          <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
            Patient Vault
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          {documents.length} reports
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search reports, prescriptions, labs…"
          className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-3 py-1.5 pl-8 pr-2 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
        />
      </div>

      {/* Loading / Empty */}
      {loading && (
        <div className="h-24 flex flex-col items-center justify-center text-center">
          <div className="h-6 w-6 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin text-[#0071E3] mb-2" />
          <p className="text-xs text-[#86868B] dark:text-[#636366]">Loading vault…</p>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="rounded-xl border border-dashed border-black/[0.06] p-6 text-center text-xs text-[#86868B] dark:border-white/[0.06]">
          <Image className="h-6 w-6 mx-auto mb-2 text-[#86868B] dark:text-[#636366]" />
          <p>No reports in vault yet.</p>
        </div>
      )}

      {/* Document list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
          {filtered.map((doc) => {
            const Icon = IconForDoc(doc.document_type);
            return (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-xl border p-2.5 transition-all hover:border-[#0071E3]/40 dark:hover:border-[#2997FF]/40 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/10 dark:text-[#2997FF]">
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">
                      {doc.title || doc.file_name}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                      <span>{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</span>
                      <span>•</span>
                      <span>{formatSize(doc.file_size_kb)}</span>
                      <span>•</span>
                      <span>{formatDate(doc.uploaded_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => getSignedUrl(doc.id)}
                    disabled={!!openDocs[doc.id]}
                    className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                      openDocs[doc.id]
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "border border-black/[0.08] bg-white text-[#1D1D1F] hover:bg-black/[0.02] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                    }`}
                    title="Open document"
                  >
                    {openDocs[doc.id] ? "Open" : "View"}
                  </button>
                  <ChevronRight className="h-3 w-3 text-[#86868B] dark:text-[#636366] group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50/30 p-2 text-xs text-rose-700 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
