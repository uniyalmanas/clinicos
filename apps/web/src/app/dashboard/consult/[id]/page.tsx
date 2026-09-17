"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { INDIAN_MEDICINES, COMMON_LAB_TESTS, MedicineItem, LabTestItem } from "@/data/medicines";
import { 
  Stethoscope, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Printer, 
  Share2, 
  ShieldCheck, 
  ArrowLeft, 
  Check, 
  Clock, 
  QrCode,
  RotateCw,
  Search,
  Activity,
  Microscope,
  AlertTriangle,
  Pill,
  Send,
  X
} from "lucide-react";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";

interface PrescribedMedicine {
  id: string;
  medicine_name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  frequency: string;
  duration: string;
  special_instructions: string;
}

export default function DynamicConsultationStudioPage() {
  const params = useParams();
  const appointmentId = (params?.id as string) || "APT-DERMA-102";

  // Patient Demographic Information
  const [patient, setPatient] = useState({
    name: "Priya Singh",
    age: 24,
    gender: "Female",
    phone: "+919123456781",
    token_number: 2,
    appointment_number: appointmentId,
    allergies: "No known drug allergies reported",
    blood_group: "O+"
  });

  const [showDocsModal, setShowDocsModal] = useState(false);

  const [doctor] = useState({
    name: "Dr. Rahul Sharma",
    title: "MBBS, MD (Dermatology)",
    reg_number: "UKMC-8942-2012",
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    phone: "+919876543210"
  });

  // Clinical Vitals
  const [vitals, setVitals] = useState({
    bp: "116/74",
    pulse: "76",
    temp: "98.6",
    weight: "58",
    spo2: "99",
    sugar: "98"
  });

  // Diagnosis & Complaints
  const [chiefComplaints, setChiefComplaints] = useState(
    "Itchy red erythematous papules on both forearms and neck for 3 days following application of cosmetic cream."
  );
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState(
    "Allergic Contact Dermatitis (Cosmetic-induced)"
  );
  const [followupAdvice, setFollowupAdvice] = useState(
    "Review after 7 days if itching or lesions persist. Strictly avoid scented cosmetics and soap on affected areas."
  );

  // Medicines List
  const [prescribedItems, setPrescribedItems] = useState<PrescribedMedicine[]>([
    {
      id: "rx-1",
      medicine_name: "Cetzine 10",
      generic_name: "CETIRIZINE HYDROCHLORIDE",
      dosage_form: "Tablet",
      strength: "10 mg",
      frequency: "0-0-1 (At Bedtime)",
      duration: "5 Days",
      special_instructions: "Take after food with water. May cause mild drowsiness."
    },
    {
      id: "rx-2",
      medicine_name: "Clindac-A",
      generic_name: "CLINDAMYCIN PHOSPHATE",
      dosage_form: "Gel",
      strength: "1% w/w",
      frequency: "1-0-1 (Twice Daily)",
      duration: "7 Days",
      special_instructions: "Apply thin layer over active lesions after gentle face wash."
    }
  ]);

  // Lab Orders
  const [selectedLabs, setSelectedLabs] = useState<string[]>(["lab-01", "lab-08"]); // CBC & IgE

  // Medicine Search & Auto-complete state
  const [medSearch, setMedSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredMedicines = useMemo(() => {
    if (!medSearch.trim()) return [];
    const q = medSearch.toLowerCase();
    return INDIAN_MEDICINES.filter(
      m => m.brand_name.toLowerCase().includes(q) || m.generic_name.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [medSearch]);

  const handleSelectMedicine = (med: MedicineItem) => {
    const newItem: PrescribedMedicine = {
      id: `rx-${Date.now()}`,
      medicine_name: med.brand_name,
      generic_name: med.generic_name,
      dosage_form: med.dosage_form,
      strength: med.strength,
      frequency: "1-0-1 (After Meals)",
      duration: "5 Days",
      special_instructions: med.common_instructions
    };

    setPrescribedItems([...prescribedItems, newItem]);
    setMedSearch("");
    setShowDropdown(false);
  };

  const removeMedicine = (id: string) => {
    setPrescribedItems(prescribedItems.filter(item => item.id !== id));
  };

  const toggleLabTest = (labId: string) => {
    if (selectedLabs.includes(labId)) {
      setSelectedLabs(selectedLabs.filter(id => id !== labId));
    } else {
      setSelectedLabs([...selectedLabs, labId]);
    }
  };

  // Specialty Quick Kits
  const applySpecialtyKit = (kitType: "acne" | "dermatitis" | "fungal" | "fever") => {
    if (kitType === "acne") {
      setProvisionalDiagnosis("Moderate Acne Vulgaris (Grade II)");
      setPrescribedItems([
        {
          id: `rx-${Date.now()}-1`,
          medicine_name: "Doxy-100",
          generic_name: "DOXYCYCLINE HYCLATE",
          dosage_form: "Capsule",
          strength: "100 mg",
          frequency: "1-0-1 (After Food)",
          duration: "14 Days",
          special_instructions: "Drink with full glass of water. Avoid sun exposure."
        },
        {
          id: `rx-${Date.now()}-2`,
          medicine_name: "Clindac-A",
          generic_name: "CLINDAMYCIN PHOSPHATE",
          dosage_form: "Gel",
          strength: "1% w/w",
          frequency: "1-0-0 (Morning)",
          duration: "14 Days",
          special_instructions: "Apply thinly over inflammatory papules."
        }
      ]);
    } else if (kitType === "fungal") {
      setProvisionalDiagnosis("Tinea Corporis (Ringworm infection)");
      setPrescribedItems([
        {
          id: `rx-${Date.now()}-1`,
          medicine_name: "Lulican",
          generic_name: "LULICONAZOLE",
          dosage_form: "Cream",
          strength: "1% w/w",
          frequency: "0-0-1 (Night)",
          duration: "14 Days",
          special_instructions: "Apply 1 inch beyond active margin. Keep area dry."
        },
        {
          id: `rx-${Date.now()}-2`,
          medicine_name: "Cetzine 10",
          generic_name: "CETIRIZINE HYDROCHLORIDE",
          dosage_form: "Tablet",
          strength: "10 mg",
          frequency: "0-0-1 (Night)",
          duration: "5 Days",
          special_instructions: "For relief from pruritus/itching."
        }
      ]);
    } else if (kitType === "fever") {
      setProvisionalDiagnosis("Acute Viral Upper Respiratory Infection");
      setPrescribedItems([
        {
          id: `rx-${Date.now()}-1`,
          medicine_name: "Dolo 650",
          generic_name: "PARACETAMOL",
          dosage_form: "Tablet",
          strength: "650 mg",
          frequency: "1-1-1 (SOS Fever)",
          duration: "3 Days",
          special_instructions: "Take if temp > 99°F. Gap of min 6 hours between doses."
        },
        {
          id: `rx-${Date.now()}-2`,
          medicine_name: "Pan-40",
          generic_name: "PANTOPRAZOLE SODIUM",
          dosage_form: "Tablet",
          strength: "40 mg",
          frequency: "1-0-0 (Empty Stomach)",
          duration: "5 Days",
          special_instructions: "Take 30 mins before breakfast."
        }
      ]);
    }
  };

  // Signed Prescription State
  const [signedPrescription, setSignedPrescription] = useState<any | null>(null);

  const handleSignPrescription = () => {
    const rxNumber = `RX-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const shaSignature = "d384b6" + Math.random().toString(36).substring(2, 10) + "7a9e1" + Math.random().toString(36).substring(2, 8) + "fc710e";

    const rxData = {
      prescription_number: rxNumber,
      signed_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      signature_hash: shaSignature,
      doctor: doctor,
      patient: patient,
      vitals: vitals,
      diagnosis: provisionalDiagnosis,
      complaints: chiefComplaints,
      items: prescribedItems,
      labs: COMMON_LAB_TESTS.filter(l => selectedLabs.includes(l.id)),
      followup: followupAdvice
    };

    setSignedPrescription(rxData);
  };

  const cleanPhone = patient.phone.replace(/[^0-9]/g, "");
  const waShareText = `🏥 *Prescription - ${doctor.clinic_name}*\nHello ${patient.name}, Dr. Rahul Sharma has signed your prescription (#${signedPrescription?.prescription_number || "RX-2026"}).\nView & Download: https://clinicos.in/p/${signedPrescription?.prescription_number || "RX-2026-09-0021"}`;

  return (
    <div className="space-y-6">
      {/* 1. TOP APPOINTMENT PATIENT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-apple-card">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-apple-blue font-mono text-xl font-bold text-white shadow-apple-sm">
            #{patient.token_number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{patient.name}</h1>
              <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {patient.age}Y / {patient.gender}
              </span>
              <span className="rounded-full bg-apple-teal/10 text-apple-teal dark:text-[#30D1BE] px-2.5 py-0.5 text-[11px] font-medium">
                Token In Consultation
              </span>
            </div>
            <p className="text-xs text-[#86868B] mt-0.5">
              Phone: {patient.phone} • Allergy Flag: <strong className="text-apple-teal dark:text-[#30D1BE] font-medium">{patient.allergies}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Specialty Kits */}
          <span className="text-[11px] font-medium text-[#86868B] hidden lg:inline">Specialty Presets:</span>
          <button
            onClick={() => applySpecialtyKit("acne")}
            className="rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition active:scale-95"
          >
            Acne Kit
          </button>
          <button
            onClick={() => applySpecialtyKit("fungal")}
            className="rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition active:scale-95"
          >
            Fungal Kit
          </button>
          <button
            onClick={() => applySpecialtyKit("fever")}
            className="rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition active:scale-95"
          >
            Viral Fever
          </button>
          <button
            onClick={() => setShowDocsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-apple-teal/10 text-apple-teal dark:text-[#30D1BE] px-3.5 py-1.5 text-xs font-medium hover:bg-apple-teal/20 transition active:scale-95"
          >
            <Microscope className="h-3.5 w-3.5" />
            <span>Patient Lab Reports</span>
          </button>
        </div>
      </div>

      {/* Patient Documents Drawer Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-modal max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3.5">
              <div className="flex items-center gap-2">
                <Microscope className="h-5 w-5 text-apple-teal" />
                <h3 className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                  Diagnostic History: {patient.name} ({patient.phone})
                </h3>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <PatientDocumentsManager patientPhone={patient.phone} patientName={patient.name} isDoctorView={true} />
            </div>
          </div>
        </div>
      )}

      {/* 2. SIGNED Rx VIEW OR DRAFTING STUDIO */}
      {signedPrescription ? (
        /* ================= A4 SIGNED PRESCRIPTION VIEW ================= */
        <div className="space-y-6">
          <div className="rounded-[20px] bg-apple-teal/10 dark:bg-apple-teal/15 border border-apple-teal/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-apple-teal dark:text-[#30D1BE]">
              <ShieldCheck className="h-5 w-5" />
              <span>Prescription Signed & Sealed with SHA-256 Cryptographic Hash</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-[#1D1D1F] hover:opacity-90 active:scale-95 transition"
              >
                <Printer className="h-3.5 w-3.5" /> Print A4 Sheet
              </button>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waShareText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-apple-sm active:scale-95 transition"
              >
                <Send className="h-3.5 w-3.5" /> Dispatch to WhatsApp
              </a>
              <button
                onClick={() => setSignedPrescription(null)}
                className="rounded-full border border-black/[0.1] dark:border-white/[0.12] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
              >
                Edit Prescription
              </button>
            </div>
          </div>

          {/* Printable A4 Letterhead Box */}
          <div className="mx-auto max-w-3xl rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-8 sm:p-12 shadow-apple-card print:border-none print:shadow-none print:p-0">
            {/* Header Letterhead */}
            <div className="border-b-2 border-[#1D1D1F] pb-5 dark:border-white flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                  {doctor.clinic_name}
                </h2>
                <p className="text-xs text-[#86868B] mt-1">{doctor.clinic_address}</p>
                <p className="text-xs text-[#86868B]">Helpline: {doctor.phone}</p>
              </div>

              <div className="text-right">
                <div className="text-base font-bold text-[#1D1D1F] dark:text-white">{doctor.name}</div>
                <div className="text-xs text-apple-blue font-semibold">{doctor.title}</div>
                <div className="text-[11px] text-[#86868B]">State Council Reg: <strong className="font-medium text-[#1D1D1F] dark:text-white">{doctor.reg_number}</strong></div>
              </div>
            </div>

            {/* Patient Details Bar */}
            <div className="mt-4 grid grid-cols-4 gap-2 bg-[#ECEEF2]/70 p-3 rounded-xl text-xs dark:bg-[#2C2C2E]/60 text-[#1D1D1F] dark:text-white">
              <div>Patient: <strong>{patient.name}</strong></div>
              <div>Age/Sex: <strong>{patient.age}Y / {patient.gender}</strong></div>
              <div>Rx Date: <strong>{new Date().toLocaleDateString("en-IN")}</strong></div>
              <div>Rx Number: <strong className="font-mono">{signedPrescription.prescription_number}</strong></div>
            </div>

            {/* Vitals */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#86868B] font-mono">
              <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">BP: {vitals.bp} mmHg</span>
              <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Pulse: {vitals.pulse} bpm</span>
              <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Temp: {vitals.temp} °F</span>
              <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Weight: {vitals.weight} kg</span>
            </div>

            {/* Provisional Diagnosis */}
            <div className="mt-5 text-xs">
              <span className="font-semibold text-[#86868B]">Provisional Diagnosis: </span>
              <strong className="text-[#1D1D1F] dark:text-white text-sm">{signedPrescription.diagnosis}</strong>
            </div>

            {/* Prescribed Medications */}
            <div className="mt-6">
              <div className="text-sm font-bold text-[#1D1D1F] dark:text-white border-b border-black/[0.06] dark:border-white/[0.08] pb-1 mb-4 flex items-center justify-between">
                <span>℞ Prescribed Medications (NMC UPPERCASE Generic Standards)</span>
                <span className="text-[10px] text-[#86868B] font-normal">Valid with verified digital signature</span>
              </div>

              <div className="space-y-4">
                {signedPrescription.items.map((item: PrescribedMedicine, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
                    <div>
                      <div className="font-bold text-[#1D1D1F] dark:text-white text-sm">
                        {idx + 1}. {item.medicine_name} ({item.dosage_form}) - {item.strength}
                      </div>
                      <div className="text-[11px] font-mono text-apple-blue dark:text-sky-400 uppercase">
                        Generic: <strong>{item.generic_name}</strong>
                      </div>
                      <div className="text-[11px] text-[#86868B] italic mt-0.5">
                        Instructions: {item.special_instructions}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-apple-blue font-mono">{item.frequency}</div>
                      <div className="text-[11px] text-[#86868B]">Duration: {item.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lab Orders */}
            {signedPrescription.labs.length > 0 && (
              <div className="mt-6 rounded-2xl bg-apple-blue/5 p-4 border border-apple-blue/15 dark:bg-apple-blue/10 dark:border-apple-blue/20 text-xs">
                <div className="font-semibold text-apple-blue dark:text-sky-300 flex items-center gap-1.5 mb-2">
                  <Microscope className="h-4 w-4" /> Recommended Diagnostic Lab Tests:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {signedPrescription.labs.map((lab: LabTestItem) => (
                    <div key={lab.id} className="text-[11px] text-[#515154] dark:text-[#A1A1A6]">
                      • {lab.test_name} ({lab.sample_type})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Note */}
            <div className="mt-6 text-xs text-[#86868B] border-t border-black/[0.04] dark:border-white/[0.06] pt-3">
              <strong className="text-[#1D1D1F] dark:text-white">Follow-up Advice:</strong> {signedPrescription.followup}
            </div>

            {/* Signature Block */}
            <div className="mt-10 flex justify-between items-end border-t-2 border-[#1D1D1F] pt-6 dark:border-white">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-apple-teal text-xs font-semibold dark:text-[#30D1BE]">
                  <ShieldCheck className="h-4 w-4" /> NMC Cryptographically Signed
                </div>
                <div className="font-mono text-[9px] text-[#86868B] break-all max-w-xs">
                  SHA-256: {signedPrescription.signature_hash}
                </div>
                <div className="text-[10px] text-[#86868B]">
                  Timestamp: {signedPrescription.signed_at} • DocSphere Health Ledger
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{doctor.name}</div>
                <div className="text-xs text-[#86868B]">{doctor.title}</div>
                <div className="text-[10px] text-[#86868B]">Consultant Physician</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= DRAFTING CONSULTATION STUDIO ================= */
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT: CLINICAL INPUTS & EXAMINATIONS */}
          <div className="lg:col-span-4 space-y-6">
            {/* Vitals Recording */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-apple-blue" /> Patient Clinical Vitals
              </h2>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <label className="font-medium text-[#86868B]">Blood Pressure</label>
                  <input
                    type="text"
                    value={vitals.bp}
                    onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                    placeholder="120/80"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#86868B]">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={vitals.pulse}
                    onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                    placeholder="72"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#86868B]">Temp (°F)</label>
                  <input
                    type="text"
                    value={vitals.temp}
                    onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                    placeholder="98.6"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#86868B]">Weight (kg)</label>
                  <input
                    type="text"
                    value={vitals.weight}
                    onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                    placeholder="65"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaints & Diagnosis */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                Diagnosis & Examination
              </h2>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-medium text-[#86868B]">Provisional Diagnosis</label>
                  <input
                    type="text"
                    value={provisionalDiagnosis}
                    onChange={e => setProvisionalDiagnosis(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                <div>
                  <label className="font-medium text-[#86868B]">Chief Symptoms / Clinical Notes</label>
                  <textarea
                    rows={3}
                    value={chiefComplaints}
                    onChange={e => setChiefComplaints(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  ></textarea>
                </div>

                <div>
                  <label className="font-medium text-[#86868B]">Follow-up Advice / Diet Plan</label>
                  <textarea
                    rows={2}
                    value={followupAdvice}
                    onChange={e => setFollowupAdvice(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Diagnostic Lab Tests Checklist */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                <Microscope className="h-4 w-4 text-apple-blue" /> Order Diagnostic Lab Tests
              </h2>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {COMMON_LAB_TESTS.map(lab => {
                  const isChecked = selectedLabs.includes(lab.id);
                  return (
                    <div
                      key={lab.id}
                      onClick={() => toggleLabTest(lab.id)}
                      className={`cursor-pointer rounded-xl p-2.5 text-xs flex items-center justify-between transition ${
                        isChecked
                          ? "bg-apple-blue/10 border border-apple-blue/25 text-apple-blue dark:bg-apple-blue/20 dark:text-sky-300 font-semibold"
                          : "bg-[#ECEEF2]/70 hover:bg-black/[0.05] text-[#515154] dark:bg-[#2C2C2E] dark:text-[#A1A1A6] dark:hover:bg-[#3A3A3C]"
                      }`}
                    >
                      <span>{lab.test_name}</span>
                      <span className="text-[10px] font-mono font-medium">₹{lab.mrp_inr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: DYNAMIC PRESCRIPTION PAD & MEDICINE SEARCH */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-card space-y-5">
              <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Pill className="h-5 w-5 text-apple-blue" />
                    Digital Prescription Builder (NMC Compliant)
                  </h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Search 500+ Indian medicines by brand or generic molecule name
                  </p>
                </div>
              </div>

              {/* DYNAMIC MEDICINE AUTO-SUGGEST SEARCH */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#86868B]" />
                  <input
                    type="text"
                    value={medSearch}
                    onChange={e => {
                      setMedSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Type medicine name (e.g. Dolo, Augmentin, Doxy, Cetzine, Pan, Azithral)..."
                    className="w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 py-2.5 pl-10 pr-4 text-xs font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Auto-suggest dropdown */}
                {showDropdown && filteredMedicines.length > 0 && (
                  <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] shadow-apple-modal">
                    <div className="p-2.5 bg-[#ECEEF2]/70 text-[10px] font-bold text-[#86868B] uppercase tracking-wider dark:bg-[#2C2C2E]">
                      Indian Pharmacopeia Database Matches
                    </div>
                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06] max-h-60 overflow-y-auto">
                      {filteredMedicines.map(med => (
                        <div
                          key={med.id}
                          onClick={() => handleSelectMedicine(med)}
                          className="cursor-pointer p-3.5 text-xs hover:bg-apple-blue/5 dark:hover:bg-apple-blue/10 transition flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                              <span>{med.brand_name}</span>
                              <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 text-[10px] text-[#86868B]">
                                {med.dosage_form} • {med.strength}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-apple-blue dark:text-sky-400 uppercase mt-0.5">
                              Generic: {med.generic_name}
                            </div>
                          </div>
                          <span className="rounded-full bg-apple-blue px-3 py-1 text-[10px] font-semibold text-white shadow-apple-sm active:scale-95 transition">
                            + Add to Rx
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRESCRIBED MEDICINES LIST */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  Prescription Items ({prescribedItems.length})
                </div>

                {prescribedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-4 sm:p-5 space-y-3.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <span>{idx + 1}. {item.medicine_name}</span>
                          <span className="rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-[10px] font-semibold text-apple-teal dark:text-[#30D1BE]">
                            {item.dosage_form}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-semibold text-apple-blue dark:text-sky-400 uppercase mt-0.5">
                          Generic Molecule: {item.generic_name} ({item.strength})
                        </div>
                      </div>

                      <button
                        onClick={() => removeMedicine(item.id)}
                        className="rounded-full p-1.5 text-[#86868B] hover:text-apple-red hover:bg-apple-red/10 transition"
                        title="Remove Medicine"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                      <div>
                        <label className="font-medium text-[#86868B]">Dosage Frequency</label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={e => {
                            const updated = prescribedItems.map(p => p.id === item.id ? { ...p, frequency: e.target.value } : p);
                            setPrescribedItems(updated);
                          }}
                          className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-black/40 p-2.5 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-[#86868B]">Duration</label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={e => {
                            const updated = prescribedItems.map(p => p.id === item.id ? { ...p, duration: e.target.value } : p);
                            setPrescribedItems(updated);
                          }}
                          className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-black/40 p-2.5 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="font-medium text-[#86868B]">Instructions for Patient</label>
                        <input
                          type="text"
                          value={item.special_instructions}
                          onChange={e => {
                            const updated = prescribedItems.map(p => p.id === item.id ? { ...p, special_instructions: e.target.value } : p);
                            setPrescribedItems(updated);
                          }}
                          className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#86868B]">
                  <ShieldCheck className="h-4 w-4 text-apple-blue" />
                  <span>NMC Generic Standards & SHA-256 Signature Activated</span>
                </div>

                <button
                  onClick={handleSignPrescription}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-apple-blue hover:bg-[#0077ED] px-7 py-3.5 text-sm font-semibold text-white shadow-apple-sm active:scale-[0.98] transition"
                >
                  <ShieldCheck className="h-5 w-5" />
                  Sign Prescription & Generate Official Rx
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
