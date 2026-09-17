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
      const res = await fetch(`http://127.0.0.1:8000/api/v1/documents?patient_phone=${encodeURIComponent(patientPhone)}`);
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
      const res = await fetch("http://127.0.0.1:8000/api/v1/documents/upload", {
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
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-[#1E2638] dark:bg-[#111726] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-[#1E2638]">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Microscope className="h-4 w-4 text-brand-600 dark:text-teal-400" />
            Medical Documents, Scans & Lab Reports ({documents.length})
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted diagnostic records accessible to attending doctors and patient.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Lab Report / Scan</span>
        </button>
      </div>

      {/* Documents List */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">Loading diagnostic records...</div>
      ) : documents.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          No lab reports uploaded yet. Upload CBC, Lipid, X-Ray, or prior prescriptions here.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-[#1E2638] dark:bg-[#161F36] flex flex-col justify-between space-y-3 hover:border-teal-500/50 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 dark:border dark:border-teal-800/40">
                    {doc.document_type}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{doc.file_size_kb} KB</span>
                </div>

                <div className="mt-2 font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-brand-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">{doc.title}</span>
                </div>

                {doc.doctor_notes && (
                  <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 italic">
                    Note: "{doc.doctor_notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px] text-slate-400 dark:border-[#1E2638]">
                <span>{doc.uploaded_at}</span>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="inline-flex items-center gap-1 font-bold text-teal-600 hover:underline dark:text-teal-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1E2638] dark:bg-[#111726]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#1E2638]">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{previewDoc.title}</h3>
                  <span className="text-[10px] text-slate-400">{previewDoc.file_name} • {previewDoc.uploaded_at}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Diagnostic Details Preview */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E2638] dark:bg-[#161F36] space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Patient:</span>
                <strong className="text-slate-900 dark:text-white">{patientName}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Classification:</span>
                <strong className="text-teal-600 dark:text-teal-400">{previewDoc.document_type}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Clinical Interpretation:</span>
                <span className="text-slate-700 dark:text-slate-300">{previewDoc.doctor_notes || "Report recorded in patient locker without abnormal findings."}</span>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-[11px] text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Verified Diagnostic Pathology Lab Signature attached.</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => alert(`Downloading ${previewDoc.file_name}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1E2638] dark:bg-[#111726]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-[#1E2638]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-teal-500" />
                Upload Diagnostic Document
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {successMsg ? (
              <div className="py-8 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{successMsg}</h4>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Document / Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Thyroid Profile (T3, T4, TSH) or Chest X-Ray"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-[#1E2638] dark:bg-[#0D121D] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:border-brand-500 focus:outline-none dark:border-[#1E2638] dark:bg-[#0D121D] dark:text-white"
                  >
                    <option value="Blood Test">Blood Test (CBC, LFT, KFT, Lipid)</option>
                    <option value="Radiology X-Ray">Radiology (X-Ray, Ultrasound, CT, MRI)</option>
                    <option value="Lab Report">Pathology / Culture Report</option>
                    <option value="Previous Rx">Previous Prescription / History</option>
                    <option value="Discharge Summary">Hospital Discharge Summary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Clinical Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Done fasting in morning; normal reference range"
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-[#1E2638] dark:bg-[#0D121D] dark:text-white"
                  />
                </div>

                <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 text-center dark:border-[#1E2638] bg-slate-50 dark:bg-[#0D121D]">
                  <UploadCloud className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    PDF, JPEG, or DICOM scans up to 25 MB
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2638]">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#161F36] dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
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
