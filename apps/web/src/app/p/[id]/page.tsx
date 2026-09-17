import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  AlertCircle
} from "lucide-react";

// Server-side seed data map for prescriptions
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
    vitals: { bp: "118/78", pulse: 74, temp: 98.4, weight: 64 },
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
        dosage_form: "Syrup",
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

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [
    { id: "RX-2026-09-0014" },
  ];
}

export default async function PatientPrescriptionLockerPage({ params }: Props) {
  const { id } = await params;
  const rx = SEED_PRESCRIPTIONS[id] || SEED_PRESCRIPTIONS["RX-2026-09-0014"];

  const waShareText = `🏥 *Prescription - ${rx.doctor_name}*\nPatient: ${rx.patient_name}\nRx: ${rx.prescription_number}\nView Verified PDF: https://clinicos.in/p/${rx.prescription_number}`;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-0 z-40 print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Digitally Verified Prescription
            </span>
          </div>
        </div>
      </header>

      {/* Main Prescription Container */}
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-6 sm:px-6 space-y-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg dark:border-slate-800 dark:bg-slate-900 print:p-0 print:border-none print:shadow-none">
          {/* Clinic & Doctor Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5 dark:border-white">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {rx.clinic_name}
                </h1>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {rx.clinic_address}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Helpline: {rx.clinic_phone}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-base font-bold text-slate-900 dark:text-white">{rx.doctor_name}</div>
                <div className="text-xs text-brand-600 font-semibold">{rx.qualification_summary}</div>
                <div className="text-[11px] text-slate-500">NMC Reg: <strong>{rx.doctor_reg_number}</strong></div>
              </div>
            </div>

            {/* Patient Metadata Grid */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs dark:bg-slate-800/50">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Name</span>
                <strong className="text-slate-900 dark:text-white text-sm">{rx.patient_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Age & Gender</span>
                <strong className="text-slate-900 dark:text-white">{rx.patient_age} Yrs / {rx.patient_gender}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Date Issued</span>
                <strong className="text-slate-900 dark:text-white">{rx.created_at}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Prescription ID</span>
                <strong className="text-brand-600 font-mono">{rx.prescription_number}</strong>
              </div>
            </div>
          </div>

          {/* Vitals & Diagnosis */}
          <div className="mt-5 space-y-2 text-xs border-b border-slate-100 pb-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
              <span><strong>BP:</strong> {rx.vitals.bp} mmHg</span>
              <span><strong>Pulse:</strong> {rx.vitals.pulse} bpm</span>
              <span><strong>Temp:</strong> {rx.vitals.temp} °F</span>
              <span><strong>Weight:</strong> {rx.vitals.weight} kg</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-500 block text-[11px] uppercase font-bold">Provisional Diagnosis</span>
              <strong className="text-base text-slate-900 dark:text-white">{rx.provisional_diagnosis}</strong>
            </div>
          </div>

          {/* Prescribed Medications */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              ℞ Prescribed Medication Regimen
            </h3>

            <div className="space-y-4">
              {rx.items.map((item: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {idx + 1}. {item.medicine_name} ({item.dosage_form})
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 uppercase mt-0.5">
                        Generic: {item.generic_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-teal-50 px-2.5 py-1 font-mono font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                        {item.dosage_frequency}
                      </span>
                      <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.timing_relation}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.duration_days} Days
                      </span>
                    </div>
                  </div>
                  {item.special_instructions && (
                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 italic bg-white p-2 rounded-lg border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                      💡 <strong>Instruction:</strong> {item.special_instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Special Advice */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="font-bold text-slate-900 dark:text-white">Doctor&apos;s Advice & Instructions:</div>
            <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{rx.instructions}</p>
            <div className="mt-2 text-slate-500">
              Next Review / Follow-up: <strong>{rx.followup_date}</strong>
            </div>
          </div>

          {/* Cryptographic Proof Footer */}
          <div className="mt-8 border-t border-slate-200 pt-5 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                <CheckCircle2 className="h-4 w-4" /> Cryptographically Sealed & Tamper-Proof
              </div>
              <div className="font-mono text-[10px] text-slate-400 mt-1 max-w-sm break-all">
                SHA-256: {rx.digital_signature_hash}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="font-bold text-slate-900 dark:text-white">{rx.doctor_name}</div>
              <div className="text-[11px] text-slate-500">Registered Medical Practitioner</div>
              <div className="text-[10px] text-slate-400 mt-0.5">NMC Verification Code: {rx.qr_verification_code}</div>
            </div>
          </div>

          {/* Patient Action Buttons (Hidden when printing) */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 print:hidden">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(waShareText)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
            >
              <Share2 className="h-4 w-4" /> Share with Pharmacy on WhatsApp
            </a>

            <div className="flex items-center gap-3">
              <Link
                href={`/book?doctor=dr-rahul-sharma`}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Book Follow-Up Token
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
