"use client";

import React, { useState } from "react";
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

export default function PrescriptionsArchivePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "today" | "dr-rahul" | "dr-aditi">("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [prescriptions, setPrescriptions] = useState<any[]>([
    {
      rx_id: "RX-2026-09-1024",
      date: "02 Nov 2026",
      appointment_number: "APT-DERMA-101",
      token_number: 11,
      patient_name: "Amit Rawat",
      patient_phone: "+91 91234 56780",
      age: 32,
      gender: "M",
      doctor_name: "Dr. Rahul Sharma",
      doctor_slug: "dr-rahul-sharma",
      specialization: "Dermatologist",
      provisional_diagnosis: "Tinea Corporis & Fungal Folliculitis",
      medications: [
        "ITRACONAZOLE 200MG (1-0-1 After food • 14 days)",
        "LEVOCETIRIZINE 5MG (0-0-1 Night • 7 days)",
        "LULICONAZOLE CREAM 1% (Apply twice daily • 2 weeks)"
      ],
      fee_amount: 600,
      payment_status: "paid"
    },
    {
      rx_id: "RX-2026-09-1025",
      date: "02 Nov 2026",
      appointment_number: "APT-DERMA-102",
      token_number: 12,
      patient_name: "Priya Singh",
      patient_phone: "+91 91234 56781",
      age: 24,
      gender: "F",
      doctor_name: "Dr. Rahul Sharma",
      doctor_slug: "dr-rahul-sharma",
      specialization: "Dermatologist",
      provisional_diagnosis: "Acne Vulgaris (Grade II Papulopustular)",
      medications: [
        "DOXYCYCLINE 100MG (0-1-0 After food • 21 days)",
        "BENZOYL PEROXIDE 2.5% GEL (Apply pea-size at night)",
        "CLINDAMYCIN 1% GEL (Morning application)"
      ],
      fee_amount: 600,
      payment_status: "paid"
    },
    {
      rx_id: "RX-2026-09-1023",
      date: "01 Nov 2026",
      appointment_number: "APT-DENT-089",
      token_number: 8,
      patient_name: "Kavita Bisht",
      patient_phone: "+91 98765 43210",
      age: 41,
      gender: "F",
      doctor_name: "Dr. Aditi Joshi",
      doctor_slug: "dr-aditi-joshi",
      specialization: "Dental Surgeon",
      provisional_diagnosis: "Periapical Abscess (Tooth #46)",
      medications: [
        "AMOXICILLIN + CLAVULANIC ACID 625MG (1-0-1 After food • 5 days)",
        "ACECLOFENAC + PARACETAMOL (1-0-1 SOS for pain)",
        "CHLORHEXIDINE 0.2% MOUTHWASH (Rinse twice daily)"
      ],
      fee_amount: 500,
      payment_status: "paid"
    },
    {
      rx_id: "RX-2026-09-1022",
      date: "01 Nov 2026",
      appointment_number: "APT-DERMA-088",
      token_number: 9,
      patient_name: "Suresh Chandra",
      patient_phone: "+91 94120 55443",
      age: 58,
      gender: "M",
      doctor_name: "Dr. Rahul Sharma",
      doctor_slug: "dr-rahul-sharma",
      specialization: "Dermatologist",
      provisional_diagnosis: "Chronic Plaque Psoriasis (Extensor aspects)",
      medications: [
        "METHOTREXATE 7.5MG (Weekly once on Sunday after breakfast)",
        "FOLIC ACID 5MG (Take on Tuesday & Friday)",
        "HALOBETASOL + SALICYLIC ACID OINTMENT (Apply at night)"
      ],
      fee_amount: 600,
      payment_status: "paid"
    }
  ]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1-Click Excel CSV Export
  const handleExportCsv = () => {
    try {
      const headers = ["Rx Number", "Date", "Token", "Patient Name", "Phone", "Age", "Gender", "Doctor", "Provisional Diagnosis", "Medicines", "Consultation Fee"];
      const rows = prescriptions.map(rx => [
        rx.rx_id,
        rx.date,
        rx.token_number,
        `"${rx.patient_name}"`,
        rx.patient_phone,
        rx.age,
        rx.gender,
        `"${rx.doctor_name}"`,
        `"${rx.provisional_diagnosis}"`,
        `"${rx.medications.join(" | ")}"`,
        rx.fee_amount
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Clinic_Prescriptions_Register_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("✓ Prescriptions Register exported to .CSV for Excel");
    } catch {
      showToast("Export error");
    }
  };

  const filteredRx = prescriptions.filter(rx => {
    const matchesSearch =
      rx.rx_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patient_phone.includes(searchQuery) ||
      rx.provisional_diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.medications.some((m: string) => m.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedFilter === "dr-rahul") return rx.doctor_slug === "dr-rahul-sharma";
    if (selectedFilter === "dr-aditi") return rx.doctor_slug === "dr-aditi-joshi";
    if (selectedFilter === "today") return rx.date === "02 Nov 2026";
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
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black tracking-wider uppercase">
              RX ARCHIVE
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Clinic Prescription Register
            </h1>
          </div>
          <p className="text-xs text-[#86868B] mt-0.5">
            Digital NMC-compliant prescription vault • Direct WhatsApp re-dispatch • Jan Aushadhi generic tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-4 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] shadow-sm active:scale-95 transition"
            title="Export all prescription records to .CSV for Excel"
          >
            <Download className="h-3.5 w-3.5 text-[#0071E3]" />
            <span>Export to Excel (.CSV)</span>
          </button>

          <Link
            href="/doctor/consult"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition"
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
            className={`rounded-full px-3 py-1 font-semibold transition ${
              selectedFilter === "all"
                ? "bg-[#0071E3] text-white"
                : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#8E8E93]"
            }`}
          >
            All Prescriptions ({prescriptions.length})
          </button>
          <button
            onClick={() => setSelectedFilter("today")}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              selectedFilter === "today"
                ? "bg-[#0071E3] text-white"
                : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#8E8E93]"
            }`}
          >
            Today ({prescriptions.filter(p => p.date === "02 Nov 2026").length})
          </button>
          <button
            onClick={() => setSelectedFilter("dr-rahul")}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              selectedFilter === "dr-rahul"
                ? "bg-[#0071E3] text-white"
                : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#8E8E93]"
            }`}
          >
            Dr. Rahul Sharma
          </button>
          <button
            onClick={() => setSelectedFilter("dr-aditi")}
            className={`rounded-full px-3 py-1 font-semibold transition ${
              selectedFilter === "dr-aditi"
                ? "bg-[#0071E3] text-white"
                : "bg-black/[0.04] text-[#86868B] hover:text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#8E8E93]"
            }`}
          >
            Dr. Aditi Joshi
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B]" />
          <input
            type="text"
            placeholder="Search patient, diagnosis, medicine..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] py-1.5 pl-8 pr-3 text-xs text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30"
          />
        </div>
      </div>

      {/* Prescription Register Table */}
      <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F7] dark:bg-black/30 border-b border-black/[0.04] dark:border-white/[0.06] text-[10px] uppercase font-bold text-[#86868B]">
              <tr>
                <th className="py-3 px-4">Rx ID & Date</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Diagnosis</th>
                <th className="py-3 px-4">Prescribed Medicines</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {filteredRx.map(rx => (
                <tr key={rx.rx_id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#0071E3] dark:text-[#2997FF]">
                      {rx.rx_id}
                    </span>
                    <div className="text-[11px] text-[#86868B]">{rx.date}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1D1D1F] dark:text-white">
                      {rx.patient_name}
                    </div>
                    <div className="text-[11px] text-[#86868B]">
                      {rx.age}Y • {rx.gender} • <span className="font-mono">{rx.patient_phone}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#1D1D1F] dark:text-white">
                      {rx.doctor_name}
                    </div>
                    <div className="text-[10px] text-[#86868B]">{rx.specialization}</div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {rx.provisional_diagnosis}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="space-y-0.5">
                      {rx.medications.map((m: string, idx: number) => (
                        <div key={idx} className="text-[11px] text-[#515154] dark:text-[#A1A1A6] truncate">
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
                        className="inline-flex items-center gap-1 rounded-lg border border-black/[0.08] dark:border-white/[0.1] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] transition"
                        title="View Public Digital Rx PDF"
                      >
                        <ExternalLink className="h-3 w-3 text-[#0071E3]" />
                        <span>View</span>
                      </Link>

                      <a
                        href={`https://wa.me/${rx.patient_phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Namaste ${rx.patient_name}, your digital prescription ${rx.rx_id} from ${rx.doctor_name} is available here: https://medic-sept-2026.vercel.app/p/${rx.rx_id}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
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
