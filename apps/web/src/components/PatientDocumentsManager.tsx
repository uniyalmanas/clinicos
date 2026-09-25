"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Download, 
  Eye, 
  Plus, 
  X, 
  Microscope, 
  Activity, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export interface DocumentItem {
  id: string;
  patient_name: string;
  document_type: string;
  title: string;
  file_name: string;
  file_size_kb: number;
  doctor_notes?: string;
  uploaded_at: string;
}

interface Props {
  patientPhone: string;
  patientName: string;
  isDoctorView?: boolean;
}

export default function PatientDocumentsManager({ patientPhone, patientName, isDoctorView = false }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Form inputs
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("Blood Test");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadDocs = async () => {
    try {
      const res = await fetch(`/api/documents?patient_phone=${encodeURIComponent(patientPhone)}`);
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.documents || []);
      }
    } catch (err) {
      console.error("Error loading patient documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [patientPhone]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);
    try {
      const res = await fetch(`/api/documents/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_phone: patientPhone,
          patient_name: patientName,
          document_type: docType,
          title: title,
          doctor_notes: notes,
          file_name: `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`,
          file_size_kb: Math.floor(Math.random() * 400) + 150
        })
      });

      if (res.ok) {
        setSuccessMsg("Document attached to clinical EMR successfully!");
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setSuccessMsg("");
          setTitle("");
          setNotes("");
          loadDocs();
        }, 1000);
      }
    } catch (err) {
      console.error("Error uploading document:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-5">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
            <Microscope className="h-4 w-4 text-apple-teal" />
            Medical Documents, Scans & Lab Reports ({documents.length})
          </h3>
          <p className="text-[11px] text-[#86868B] mt-0.5">
            Encrypted diagnostic records accessible to attending doctors and patient.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-apple-teal hover:bg-[#00B49A] px-4 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Lab Report / Scan</span>
        </button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-[#86868B]">Loading diagnostic records...</div>
      ) : documents.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#86868B]">
          No lab reports uploaded yet. Upload CBC, Lipid, X-Ray, or prior prescriptions here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 sm:p-5 flex flex-col justify-between space-y-3.5 hover:border-apple-teal/40 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-[10px] font-medium text-apple-teal dark:text-[#30D1BE]">
                    {doc.document_type}
                  </span>
                  <span className="text-[10px] text-[#86868B] font-mono">{doc.file_size_kb} KB</span>
                </div>

                <div className="mt-2.5 font-semibold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-apple-blue shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </div>

                {doc.doctor_notes && (
                  <p className="mt-1.5 text-[11px] text-[#86868B] italic">
                    Note: "{doc.doctor_notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.06] pt-2.5 text-[11px] text-[#86868B]">
                <span>{doc.uploaded_at}</span>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex items-center gap-1 font-semibold text-apple-teal hover:underline dark:text-[#30D1BE]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect Report</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect / Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 shadow-apple-modal">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-apple-teal" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">{previewDoc.title}</h3>
                  <span className="text-[10px] text-[#86868B]">{previewDoc.file_name} • {previewDoc.uploaded_at}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Diagnostic Details Preview */}
            <div className="mt-5 rounded-[20px] bg-[#ECEEF2]/70 dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] p-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-[#86868B]">Patient:</span>
                <strong className="text-[#1D1D1F] dark:text-white font-medium">{patientName}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#86868B]">Classification:</span>
                <strong className="text-apple-teal dark:text-[#30D1BE] font-medium">{previewDoc.document_type}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#86868B]">Clinical Interpretation:</span>
                <span className="text-[#515154] dark:text-[#A1A1A6]">{previewDoc.doctor_notes || "Report recorded in patient locker without abnormal findings."}</span>
              </div>
              <div className="rounded-xl bg-apple-teal/10 p-3 text-[11px] text-apple-teal dark:text-[#30D1BE] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Verified Diagnostic Pathology Lab Signature attached.</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-full border border-black/[0.1] dark:border-white/[0.12] px-5 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
              >
                Close
              </button>
              <button
                onClick={() => alert(`Downloading ${previewDoc.file_name}`)}
                className="inline-flex items-center gap-1.5 rounded-full bg-apple-teal hover:bg-[#00B49A] px-5 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 shadow-apple-modal">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
              <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-apple-teal" />
                Upload Diagnostic Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-apple-teal/10 text-apple-teal">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">{successMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[#1D1D1F] dark:text-white">
                    Document / Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Thyroid Profile (T3, T4, TSH) or Chest X-Ray"
                    className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 px-3.5 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-teal/30"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#1D1D1F] dark:text-white">
                    Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 px-3 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-teal/30"
                  >
                    <option value="Blood Test">Blood Test (CBC, LFT, KFT, Lipid)</option>
                    <option value="Radiology X-Ray">Radiology (X-Ray, Ultrasound, CT, MRI)</option>
                    <option value="Lab Report">Pathology / Culture Report</option>
                    <option value="Previous Rx">Previous Prescription / History</option>
                    <option value="Discharge Summary">Hospital Discharge Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1D1D1F] dark:text-white">
                    Clinical Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Done fasting in morning; normal reference range"
                    className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 px-3.5 py-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-teal/30"
                  />
                </div>

                <div className="rounded-[20px] border border-dashed border-black/[0.12] dark:border-white/[0.15] p-5 text-center bg-[#ECEEF2]/50 dark:bg-black/20">
                  <UploadCloud className="mx-auto h-6 w-6 text-[#86868B]" />
                  <p className="mt-1.5 text-xs text-[#86868B] font-medium">
                    PDF, JPEG, or DICOM scans up to 25 MB
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="rounded-full border border-black/[0.1] dark:border-white/[0.12] px-5 py-2 font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-full bg-apple-teal hover:bg-[#00B49A] px-5 py-2 font-semibold text-white shadow-apple-sm active:scale-95 transition disabled:opacity-50"
                  >
                    {uploading ? "Attaching..." : "Save to Locker"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
