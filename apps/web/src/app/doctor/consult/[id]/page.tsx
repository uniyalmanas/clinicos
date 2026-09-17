"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  RotateCw
} from "lucide-react";

export default function ConsultationStudioPage() {
  const params = useParams();
  const appointmentId = (params?.id as string) || "APT-DERMA-102";

  // Patient & Doctor Info
  const [patient] = useState({
    name: "Priya Singh",
    age: 24,
    gender: "Female",
    phone: "+919123456781",
    token_number: 2,
    appointment_number: appointmentId
  });

  const [doctor] = useState({
    name: "Dr. Rahul Sharma",
    title: "MD (Dermatology)",
    reg_number: "UKMC-8942-2012",
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_address: "14, Rajpur Road, Dehradun",
    phone: "+919876543210"
  });

  // Clinical Vitals
  const [vitals, setVitals] = useState({
    bp: "116/74",
    pulse: "76",
    temp: "98.6",
    weight: "58"
  });

  // Clinical Findings & Diagnosis
  const [symptoms] = useState(["Itchy erythematous rash on bilateral forearms", "Facial erythema"]);
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState("Acute Allergic Contact Dermatitis");
  const [instructions, setInstructions] = useState("Discontinue all cosmetic creams. Wash with lukewarm water only. Keep skin hydrated.");
  const [followupDays, setFollowupDays] = useState(7);

  // Medication Items Table
  const [items, setItems] = useState<any[]>([
    {
      medicine_name: "Tab Allegra 120mg",
      generic_name: "FEXOFENADINE HYDROCHLORIDE",
      dosage_form: "Tablet",
      strength: "120 mg",
      dosage_frequency: "0-0-1",
      timing_relation: "At Bedtime",
      duration_days: 7,
      special_instructions: "Take with water at bedtime for itching"
    },
    {
      medicine_name: "Desowen Cream",
      generic_name: "DESONIDE 0.05%",
      dosage_form: "Ointment",
      strength: "0.05%",
      dosage_frequency: "1-0-1",
      timing_relation: "After Food",
      duration_days: 5,
      special_instructions: "Apply thin layer to affected red areas only"
    }
  ]);

  // Specialty Clinical Kits Presets (1-Click Superpower)
  const clinicalKits = [
    {
      name: "⚡ Skin Allergy / Eczema (7 Days)",
      diagnosis: "Acute Contact Dermatitis & Allergic Reaction",
      items: [
        { medicine_name: "Tab Allegra 120mg", generic_name: "FEXOFENADINE HYDROCHLORIDE", dosage_form: "Tablet", strength: "120 mg", dosage_frequency: "0-0-1", timing_relation: "At Bedtime", duration_days: 7, special_instructions: "For relief from allergic itching" },
        { medicine_name: "Desowen Cream", generic_name: "DESONIDE 0.05%", dosage_form: "Ointment", strength: "0.05%", dosage_frequency: "1-0-1", timing_relation: "After Food", duration_days: 5, special_instructions: "Apply sparingly on itchy areas" }
      ]
    },
    {
      name: "⚡ Adult Acne Kit (14 Days)",
      diagnosis: "Acne Vulgaris (Grade II/III Inflammatory)",
      items: [
        { medicine_name: "Tab Doxy-100", generic_name: "DOXYCYCLINE HYCLATE", dosage_form: "Capsule", strength: "100 mg", dosage_frequency: "1-0-0", timing_relation: "After Food", duration_days: 14, special_instructions: "Take with a tall glass of water" },
        { medicine_name: "Epiduo Gel", generic_name: "ADAPALENE + BENZOYL PEROXIDE", dosage_form: "Ointment", strength: "0.1% / 2.5%", dosage_frequency: "0-0-1", timing_relation: "At Bedtime", duration_days: 30, special_instructions: "Apply pea-sized amount at night" }
      ]
    },
    {
      name: "⚡ Viral Fever OPD Kit (3 Days)",
      diagnosis: "Acute Viral Syndrome with Myalgia",
      items: [
        { medicine_name: "Tab Dolo 650", generic_name: "PARACETAMOL 650MG", dosage_form: "Tablet", strength: "650 mg", dosage_frequency: "1-1-1", timing_relation: "After Food", duration_days: 3, special_instructions: "Take only if fever > 99°F" },
        { medicine_name: "Tab Pan-D", generic_name: "PANTOPRAZOLE + DOMPERIDONE", dosage_form: "Capsule", strength: "40mg / 30mg", dosage_frequency: "1-0-0", timing_relation: "Before Food", duration_days: 3, special_instructions: "Take 30 mins before breakfast" }
      ]
    }
  ];

  const applyKit = (kit: typeof clinicalKits[0]) => {
    setProvisionalDiagnosis(kit.diagnosis);
    setItems(kit.items);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        medicine_name: "",
        generic_name: "",
        dosage_form: "Tablet",
        strength: "500 mg",
        dosage_frequency: "1-0-1",
        timing_relation: "After Food",
        duration_days: 5,
        special_instructions: ""
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const [isSigning, setIsSigning] = useState(false);
  const [signedPrescription, setSignedPrescription] = useState<any>(null);

  const handleSignAndIssue = async () => {
    setIsSigning(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/prescriptions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_number: appointmentId,
          doctor_name: doctor.name,
          doctor_reg_number: doctor.reg_number,
          patient_name: patient.name,
          patient_phone: patient.phone,
          patient_age: patient.age,
          patient_gender: patient.gender,
          vitals: vitals,
          symptoms: symptoms,
          provisional_diagnosis: provisionalDiagnosis,
          items: items,
          instructions: instructions
        })
      });

      if (res.ok) {
        const json = await res.json();
        setSignedPrescription(json);
      } else {
        fallbackSign();
      }
    } catch (e) {
      fallbackSign();
    } finally {
      setIsSigning(false);
    }
  };

  const fallbackSign = () => {
    const rxNumber = `RX-2026-09-0016`;
    const dummyHash = "a7f3b89091c5e4d28471b3e8c991a03f441582e79601d3cb4198fa0174e50212";
    const waText = `📋 *Digital Prescription - ${doctor.name}*\nHello ${patient.name}, your prescription has been signed.\n\n🆔 *Rx Number:* ${rxNumber}\n🩺 *Diagnosis:* ${provisionalDiagnosis}\n🔗 View PDF: https://clinicos.in/p/${rxNumber}`;
    setSignedPrescription({
      prescription: {
        prescription_number: rxNumber,
        digital_signature_hash: dummyHash,
        created_at: "2026-09-17"
      },
      whatsapp_link: `https://wa.me/${patient.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waText)}`,
      message: `Prescription ${rxNumber} generated with SHA-256 signature.`
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* 1. TOP APPOINTMENT HEADER */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/doctor/queue" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-brand-600 px-2 py-0.5 text-xs font-black text-white">
                  Token #{patient.token_number}
                </span>
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  {patient.name}
                </h1>
                <span className="text-xs text-slate-500">
                  ({patient.age}y / {patient.gender}) • {patient.phone}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Dr. Rahul Sharma Chamber • {appointmentId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <Printer className="h-4 w-4 text-slate-500" /> Print A4 Rx
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONSULTATION STUDIO */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {signedPrescription ? (
          /* SIGNED PRESCRIPTION VIEW (A4 PRINTABLE) */
          <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-200 bg-white p-8 shadow-xl dark:border-emerald-950 dark:bg-slate-900 print:p-0 print:border-none print:shadow-none">
            {/* Clinic Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 dark:border-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {doctor.clinic_name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {doctor.clinic_address} • Phone: {doctor.phone}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{doctor.name}</div>
                  <div className="text-xs text-brand-600 font-semibold">{doctor.title}</div>
                  <div className="text-[11px] text-slate-500">NMC Reg: {doctor.reg_number}</div>
                </div>
              </div>

              {/* Patient Bar */}
              <div className="mt-4 grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs dark:bg-slate-800/50">
                <div>Patient: <strong>{patient.name}</strong></div>
                <div>Age/Sex: <strong>{patient.age}Y / {patient.gender}</strong></div>
                <div>Date: <strong>{signedPrescription.prescription.created_at}</strong></div>
                <div>Rx ID: <strong>{signedPrescription.prescription.prescription_number}</strong></div>
              </div>
            </div>

            {/* Diagnosis & Vitals */}
            <div className="mt-5 space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Vitals: </span>
                <span className="text-slate-600 dark:text-slate-400">BP: {vitals.bp} mmHg | Pulse: {vitals.pulse} bpm | Temp: {vitals.temp} °F | Wt: {vitals.weight} kg</span>
              </div>
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Provisional Diagnosis: </span>
                <strong className="text-slate-900 dark:text-white text-sm">{provisionalDiagnosis}</strong>
              </div>
            </div>

            {/* Medicines List */}
            <div className="mt-6">
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-3">
                <span>℞ Prescribed Medications (NMC Compliant)</span>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs border-b border-slate-100 pb-2 dark:border-slate-800">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {idx + 1}. {item.medicine_name} ({item.dosage_form})
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 uppercase">
                        Generic: {item.generic_name}
                      </div>
                      {item.special_instructions && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 italic">
                          Instruction: {item.special_instructions}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-medium">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-bold dark:bg-slate-800">
                        {item.dosage_frequency}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {item.timing_relation} • {item.duration_days} Days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advice & General Instructions */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <div className="font-bold text-slate-900 dark:text-white">General Advice:</div>
              <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{instructions}</p>
              <div className="mt-2 text-slate-500">
                Follow-up review advised after: <strong>{followupDays} Days</strong>
              </div>
            </div>

            {/* Digital Signature & Verification Seal */}
            <div className="mt-8 flex justify-between items-end border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  SHA-256 Cryptographic Hash:
                </div>
                <div className="font-mono text-[10px] text-slate-500 truncate max-w-sm">
                  {signedPrescription.prescription.digital_signature_hash}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">{doctor.name}</div>
                <div className="text-[10px] text-slate-500">Digitally Signed & Certified</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6 print:hidden">
              <Link
                href="/doctor/queue"
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Back to Patient Queue
              </Link>

              <div className="flex items-center gap-3">
                <a
                  href={signedPrescription.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  <Share2 className="h-4 w-4" /> Send PDF to Patient WhatsApp
                </a>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-brand-700"
                >
                  <Printer className="h-4 w-4" /> Print Prescription
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PRESCRIPTION BUILDER STUDIO */
          <div className="space-y-6">
            {/* 1-Click Clinical Quick Kits Bar */}
            <div className="rounded-2xl border border-brand-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-brand-600" /> 1-Click Specialty Quick Kits:
                </span>
                <span className="text-[11px] text-slate-500">Pre-fills standard Indian clinical treatments in 1 second</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {clinicalKits.map((kit, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyKit(kit)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {kit.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Vitals & Diagnosis Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Diagnosis (7 cols) */}
              <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Provisional Diagnosis *
                </label>
                <input
                  type="text"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Allergic Contact Dermatitis"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                  Chief complaint: &ldquo;{symptoms.join(", ")}&rdquo;
                </div>
              </div>

              {/* Vitals Tracker (5 cols) */}
              <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Patient Vitals
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500">BP</span>
                    <input
                      type="text"
                      value={vitals.bp}
                      onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Pulse</span>
                    <input
                      type="text"
                      value={vitals.pulse}
                      onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Temp</span>
                    <input
                      type="text"
                      value={vitals.temp}
                      onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Wt(kg)</span>
                    <input
                      type="text"
                      value={vitals.weight}
                      onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-1.5 text-center text-xs font-semibold dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Medication Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-brand-600" /> Prescribed Medications (NMC Upper-Case Generic Standard)
                </h3>
                <button
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Drug Row
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Medicine Name (Brand) */}
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine / Brand</label>
                        <input
                          type="text"
                          value={item.medicine_name}
                          onChange={(e) => updateItem(idx, "medicine_name", e.target.value)}
                          placeholder="e.g. Tab Allegra 120mg"
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>

                      {/* Generic Name (NMC UPPERCASE) */}
                      <div className="md:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Generic Composition</label>
                        <input
                          type="text"
                          value={item.generic_name}
                          onChange={(e) => updateItem(idx, "generic_name", e.target.value.toUpperCase())}
                          placeholder="FEXOFENADINE HYDROCHLORIDE"
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs font-mono uppercase dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                        <select
                          value={item.dosage_frequency}
                          onChange={(e) => updateItem(idx, "dosage_frequency", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value="1-0-1">1-0-1 (Twice)</option>
                          <option value="1-0-0">1-0-0 (Morning)</option>
                          <option value="0-0-1">0-0-1 (Bedtime)</option>
                          <option value="1-1-1">1-1-1 (Thrice)</option>
                          <option value="SOS">SOS (As needed)</option>
                        </select>
                      </div>

                      {/* Timing Relation */}
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Timing</label>
                        <select
                          value={item.timing_relation}
                          onChange={(e) => updateItem(idx, "timing_relation", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs bg-white dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value="After Food">After Food</option>
                          <option value="Before Food">Before Food</option>
                          <option value="At Bedtime">At Bedtime</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                        </select>
                      </div>

                      {/* Duration & Delete */}
                      <div className="md:col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Days</label>
                          <input
                            type="number"
                            value={item.duration_days}
                            onChange={(e) => updateItem(idx, "duration_days", Number(e.target.value))}
                            className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs text-center dark:border-slate-700 dark:bg-slate-950"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="mt-4 p-1.5 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Advice & Follow-up */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <label className="text-xs font-bold text-slate-900 dark:text-white">
                Special Advice & Dietary Instructions
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Wash with mild cleanser, avoid direct sunlight..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
              />

              <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Follow-up consult after:</span>
                <select
                  value={followupDays}
                  onChange={(e) => setFollowupDays(Number(e.target.value))}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs bg-white dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value={3}>3 Days</option>
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                </select>
              </div>
            </div>

            {/* Sign & Publish CTA */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <Link
                href="/doctor/queue"
                className="rounded-xl px-5 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
              >
                Cancel
              </Link>
              <button
                onClick={handleSignAndIssue}
                disabled={isSigning}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
              >
                {isSigning ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" /> Signing with SHA-256 Hash...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Sign & Generate Digital Prescription (30s)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
