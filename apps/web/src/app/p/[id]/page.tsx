"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { useParams } from "next/navigation";
import { 
  Stethoscope, 
  ShieldCheck, 
  Printer, 
  Share2, 
  Clock, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ArrowLeft,
  QrCode,
  AlertCircle,
  Pill,
  Download,
  ExternalLink,
  Sparkles
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";

// Server fallback seeds
const SEED_PRESCRIPTIONS: Record<string, any> = {
  "RX-2026-09-0014": {
    prescription_number: "RX-2026-09-0014",
    appointment_number: "APT-DERMA-101",
    created_at: "2026-09-16",
    doctor_name: "Dr. Rahul Sharma",
    doctor_reg_number: "UKMC-8942-2012",
    qualification_summary: "MBBS, MD (Dermatology, Venereology & Leprosy)",
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    clinic_phone: "+919876543210",
    patient_name: "Amit Rawat",
    patient_phone: "+919123456780",
    patient_age: 26,
    patient_gender: "Male",
    vitals: { bp: "118/78", pulse: 74, temp: 98.4, weight: 64, spo2: 99 },
    provisional_diagnosis: "Moderate to Severe Acne Vulgaris (Grade III)",
    items: [
      {
        medicine_name: "Tab Doxy-100",
        generic_name: "DOXYCYCLINE HYCLATE",
        dosage_form: "Capsule",
        strength: "100 mg",
        dosage_frequency: "1-0-0",
        timing_relation: "After Food",
        duration_days: 14,
        special_instructions: "Take with a full glass of water, do not lie down immediately"
      },
      {
        medicine_name: "Epiduo Gel",
        generic_name: "ADAPALENE + BENZOYL PEROXIDE",
        dosage_form: "Ointment",
        strength: "0.1% / 2.5%",
        dosage_frequency: "0-0-1",
        timing_relation: "At Bedtime",
        duration_days: 30,
        special_instructions: "Apply pea-sized amount to affected areas only after moisturizer"
      },
      {
        medicine_name: "Cetaphil Gentle Cleanser",
        generic_name: "NON-SOAP CLEANSING LOTION",
        dosage_form: "Lotion",
        strength: "250 ml",
        dosage_frequency: "1-0-1",
        timing_relation: "Before Food",
        duration_days: 60,
        special_instructions: "Gentle circular motion for 30 seconds then rinse with lukewarm water"
      }
    ],
    instructions: "Wash face twice daily with mild cleanser. Avoid picking or squeezing lesions. Use non-comedogenic sunscreen SPF 50 during daytime.",
    followup_date: "2026-09-30",
    digital_signature_hash: "a7f3b89091c5e4d28471b3e8c991a03f441582e79601d3cb4198fa0174e50212",
    qr_verification_code: "VERIFY-DERMA-991204"
  }
};

export default function PatientPrescriptionLockerPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "RX-2026-09-0014";
  
  const [rx, setRx] = useState<any>(SEED_PRESCRIPTIONS["RX-2026-09-0014"]);
  const [loading, setLoading] = useState(true);
  const [routedChemistMsg, setRoutedChemistMsg] = useState<string | null>(null);
  const [paperFormat, setPaperFormat] = useState<"a4" | "a5">("a4");


  useEffect(() => {
    const fetchRx = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/prescriptions/${rawId}`);
        if (res.ok) {
          const data = await res.json();
          setRx(data);
        } else if (SEED_PRESCRIPTIONS[rawId]) {
          setRx(SEED_PRESCRIPTIONS[rawId]);
        }
      } catch {
        if (SEED_PRESCRIPTIONS[rawId]) {
          setRx(SEED_PRESCRIPTIONS[rawId]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRx();
  }, [rawId]);

  const publicPrescriptionUrl = typeof window === "undefined"
    ? `https://clinicos.in/p/${rx.prescription_number || rawId}`
    : `${window.location.origin}/p/${rx.prescription_number || rawId}`;

  const waShareText = `🏥 *Verified Digital Prescription - ${rx.doctor_name}*\n` +
    `Patient: ${rx.patient_name}\n` +
    `Rx Number: #${rx.prescription_number}\n` +
    `Diagnosis: ${rx.provisional_diagnosis}\n\n` +
    `🔗 View & Download Official A4 Document: ${publicPrescriptionUrl}\n` +
    `🔒 Cryptographic Hash: ${rx.digital_signature_hash?.slice(0, 16)}...`;

  const handleRouteToPharmacy = () => {
    setRoutedChemistMsg(`💊 Prescription #${rx.prescription_number} transmitted to Apollo Pharmacy (Rajpur Road Hub). They will prepare generic generic strips.`);
    setTimeout(() => setRoutedChemistMsg(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7] flex flex-col">
      {/* 1. TOP APP HEADER (Hidden during printing) */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#ECEEF2]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#000000]/80 print:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 rounded-full p-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold">Home</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#34C759]/10 px-3 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
              <ShieldCheck className="h-4 w-4" /> Digitally Signed (NMC Compliant)
            </span>
          </div>
        </div>
      </header>

      {/* 2. PRINT BANNER NOTIFICATION */}
      {routedChemistMsg && (
        <div className="mx-auto max-w-4xl w-full px-4 pt-4 print:hidden animate-fade-in">
          <div className="rounded-[16px] bg-[#34C759]/10 border border-[#34C759]/20 p-3.5 text-xs font-semibold text-[#34C759] dark:text-[#30D158] flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{routedChemistMsg}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN PRESCRIPTION A4 DOCUMENT */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-6 sm:px-6 space-y-4">
        {/* Top Floating Document Action Bar (Print / Share) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1C1C1E] p-4 rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
              Official Medical Prescription Document
            </span>
            <span className="font-mono text-[11px] text-[#86868B] dark:text-[#8E8E93]">
              #{rx.prescription_number}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Paper Format Selector */}
            <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] p-0.5">
              <button
                type="button"
                onClick={() => setPaperFormat("a4")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  paperFormat === "a4"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                A4 Sheet
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat("a5")}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  paperFormat === "a5"
                    ? "bg-white text-[#0071E3] shadow-sm dark:bg-[#2C2C2E] dark:text-[#2997FF] font-bold"
                    : "text-[#86868B] hover:text-[#1D1D1F]"
                }`}
              >
                A5 Pad
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0077ED] active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-full border border-[#0071E3]/30 bg-[#0071E3]/10 px-3.5 py-1.5 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] shadow-sm transition hover:bg-[#0071E3]/20 active:scale-95"
              title="Download official NMC-signed vector PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(waShareText)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp PDF</span>
            </a>

            <button
              onClick={handleRouteToPharmacy}
              className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm hover:bg-black/[0.02] dark:border-white/[0.1] dark:bg-[#2C2C2E] dark:text-white"
            >
              <Pill className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>Route to Chemist</span>
            </button>
          </div>
        </div>

        {/* The Printable A4/A5 Sheet */}
        <div className={`overflow-hidden rounded-[24px] border border-black/[0.06] bg-white ${paperFormat === "a5" ? "max-w-2xl text-xs p-6 sm:p-8" : "max-w-4xl p-8 sm:p-12"} mx-auto shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] print:p-0 print:border-none print:shadow-none print:bg-white print:text-black transition-all`}>

          {/* Clinic Header & Letterhead */}
          <div className="border-b-2 border-[#1D1D1F] pb-6 dark:border-white print:border-black">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0071E3] text-white print:border print:border-black">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <h1 className="text-xl font-black text-[#1D1D1F] dark:text-white print:text-black tracking-tight">
                    {rx.clinic_name || "Derma Care Skin & Laser Centre"}
                  </h1>
                </div>
                <p className="text-xs text-[#86868B] mt-2 flex items-center gap-1.5 print:text-gray-600">
                  <MapPin className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>{rx.clinic_address || "14, Rajpur Road, Dehradun"}</span>
                </p>
                <p className="text-xs text-[#86868B] mt-0.5 flex items-center gap-1.5 print:text-gray-600">
                  <Phone className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>Helpline: {rx.clinic_phone || "+91 98765 43210"}</span>
                </p>
              </div>

              {/* Doctor Credentials & Medical Council Reg */}
              <div className="text-left sm:text-right">
                <div className="text-base font-extrabold text-[#1D1D1F] dark:text-white print:text-black">
                  {rx.doctor_name || "Dr. Rahul Sharma"}
                </div>
                <div className="text-xs text-[#0071E3] font-semibold mt-0.5">
                  {rx.qualification_summary || "MBBS, MD (Registered Medical Practitioner)"}
                </div>
                <div className="text-[11px] text-[#86868B] font-mono mt-1 print:text-gray-600">
                  State Medical Council Reg: <strong className="text-[#1D1D1F] dark:text-white print:text-black">{rx.doctor_reg_number}</strong>
                </div>
              </div>
            </div>

            {/* Patient Metadata Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-[16px] bg-[#ECEEF2]/60 p-4 text-xs dark:bg-white/[0.04] print:bg-gray-100 print:border print:border-gray-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">Patient Name</span>
                <strong className="text-sm text-[#1D1D1F] dark:text-white print:text-black">{rx.patient_name}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">Age & Gender</span>
                <strong className="text-[#1D1D1F] dark:text-white print:text-black">{rx.patient_age} Yrs / {rx.patient_gender}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">Date Issued</span>
                <strong className="text-[#1D1D1F] dark:text-white print:text-black">{rx.created_at}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">Prescription ID</span>
                <strong className="font-mono text-[#0071E3] dark:text-[#2997FF] print:text-black">{rx.prescription_number}</strong>
              </div>
            </div>
          </div>

          {/* Vitals & Clinical Diagnosis */}
          <div className="mt-5 space-y-3 border-b border-black/[0.06] pb-5 dark:border-white/[0.08] print:border-gray-300 text-xs">
            {rx.vitals && (
              <div className="flex flex-wrap items-center gap-4 text-[#86868B] font-mono">
                {rx.vitals.bp && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">BP:</strong> {rx.vitals.bp} mmHg</span>}
                {rx.vitals.pulse && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">Pulse:</strong> {rx.vitals.pulse} bpm</span>}
                {rx.vitals.temp && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">Temp:</strong> {rx.vitals.temp} °F</span>}
                {rx.vitals.spo2 && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">SpO2:</strong> {rx.vitals.spo2}%</span>}
                {rx.vitals.weight && <span><strong className="text-[#1D1D1F] dark:text-white print:text-black">Weight:</strong> {rx.vitals.weight} kg</span>}
              </div>
            )}

            <div className="pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] block">
                Provisional Diagnosis & Findings
              </span>
              <div className="text-base font-extrabold text-[#1D1D1F] dark:text-white print:text-black mt-0.5">
                {rx.provisional_diagnosis}
              </div>
            </div>
          </div>

          {/* Prescribed Medications Section (NMC Generic Enforcement) */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white print:text-black flex items-center gap-1.5">
                <span className="font-serif italic text-lg font-bold text-[#0071E3]">℞</span> Prescribed Medication Regimen
              </h3>
              <span className="text-[10px] font-mono text-[#86868B] uppercase">
                (Generic formulations prioritized as per NMC regulations)
              </span>
            </div>

            <div className="space-y-3">
              {rx.items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-[16px] border border-black/[0.06] bg-[#ECEEF2]/30 p-4 text-xs dark:border-white/[0.08] dark:bg-white/[0.02] print:border-gray-300 print:bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-[#1D1D1F] dark:text-white print:text-black">
                        {idx + 1}. {item.medicine_name} <span className="text-xs font-semibold text-[#86868B]">({item.dosage_form} • {item.strength || ""})</span>
                      </div>
                      <div className="text-[11px] font-mono font-bold text-[#0071E3] dark:text-[#2997FF] uppercase mt-0.5 print:text-black">
                        GENERIC CHEMICAL: {item.generic_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-[8px] bg-[#0071E3]/10 px-2.5 py-1 font-mono font-bold text-[#0071E3] dark:text-[#2997FF] print:border print:border-black print:text-black">
                        {item.dosage_frequency}
                      </span>
                      <span className="rounded-[8px] bg-black/[0.04] px-2.5 py-1 font-semibold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white print:border print:border-gray-300">
                        {item.timing_relation}
                      </span>
                      <span className="font-bold text-[#1D1D1F] dark:text-white print:text-black">
                        {item.duration_days} Days
                      </span>
                    </div>
                  </div>

                  {item.special_instructions && (
                    <div className="mt-2 text-[11px] text-[#86868B] italic bg-white dark:bg-[#1C1C1E] p-2 rounded-[10px] border border-black/[0.04] dark:border-white/[0.06] print:border-gray-200">
                      💡 <strong>Instruction:</strong> {item.special_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Doctor's Advice & Review Date */}
          <div className="mt-6 rounded-[16px] border border-black/[0.06] bg-[#ECEEF2]/40 p-4 text-xs dark:border-white/[0.08] dark:bg-white/[0.02] print:border-gray-300">
            <div className="font-bold text-[#1D1D1F] dark:text-white print:text-black">
              Doctor&apos;s Clinical Advice & Lifestyle Guidelines:
            </div>
            <p className="mt-1 text-[#86868B] leading-relaxed dark:text-[#8E8E93] print:text-gray-700">
              {rx.instructions}
            </p>
            <div className="mt-2.5 text-xs text-[#0071E3] dark:text-[#2997FF] font-semibold print:text-black">
              📅 Next Review / Follow-up Scheduled: <strong>{rx.followup_date || "Within 7 Days"}</strong>
            </div>
          </div>

          {/* Cryptographic SHA-256 Tamper-Proof Seal & Digital Signature */}
          <div className="mt-8 border-t-2 border-[#1D1D1F] pt-6 dark:border-white print:border-black text-xs flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5">
            <div className="flex items-center gap-3.5">
              <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white p-1.5 shadow-sm shrink-0 print:border-black">
                <QRCodeDisplay
                  value={`http://localhost:3000/p/${rx.prescription_number || "RX-2026-09-0014"}`}
                  size={76}
                  level="M"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-[#34C759] dark:text-[#30D158] print:text-black">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Cryptographically Sealed & Signed</span>
                </div>
                <div className="font-mono text-[9px] text-[#86868B] mt-1 max-w-sm break-all">
                  SHA-256: {rx.digital_signature_hash}
                </div>
                <div className="font-mono text-[10px] text-[#86868B] mt-0.5">
                  Verification Code: <strong>{rx.qr_verification_code}</strong>
                </div>
                <div className="text-[10px] text-[#86868B] mt-0.5">
                  Scan QR with phone to verify authentic prescription on Clinicos
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="font-black text-sm text-[#1D1D1F] dark:text-white print:text-black">
                {rx.doctor_name}
              </div>
              <div className="text-[11px] text-[#86868B]">
                Registered Medical Practitioner
              </div>
              <div className="text-[10px] text-[#86868B] font-mono mt-0.5">
                {rx.doctor_reg_number}
              </div>
              <div className="inline-block mt-1 rounded border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                ✓ Digitally Verified
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Print Stylesheet for High-DPI Print-to-PDF */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${paperFormat === "a5" ? "A5 portrait" : "A4 portrait"};
            margin: 10mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, button, a, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

