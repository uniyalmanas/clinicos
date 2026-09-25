"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INDIAN_MEDICINES, COMMON_LAB_TESTS, MedicineItem, LabTestItem } from "@/data/medicines";
import { API_BASE_URL } from "@/lib/api";
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
  Bed,
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
  X,
  Mic,
  AlertOctagon,
  Globe,
  IndianRupee,
  ShieldAlert,
  Info,
  SlidersHorizontal,
  BookmarkPlus,
  Zap,
  CheckCheck,
  RotateCcw,
  Sliders,
  Save,
  Scale,
  HeartPulse,
  Flame,
  History,
  Calendar,
  Star,
  MessageSquare,
  ExternalLink,
  Copy,
  Download
} from "lucide-react";

import QRCodeDisplay from "@/components/QRCodeDisplay";
import PatientDocumentsManager from "@/components/PatientDocumentsManager";
import BackButton from "@/components/BackButton";
import {
  evaluatePrescriptionSafety,
  translateDirectionsToHindi,
  getJanAushadhiSavings,
  InteractionAlert,
  InteractionCheckResult
} from "@/data/prescriptionHelpers";
import {
  PRESET_RX_COMBOS,
  RxComboItem,
  getStoredCustomCombos,
  saveCustomComboToStorage,
  deleteCustomComboFromStorage
} from "@/data/rxCombos";
import { CLINICAL_DIAGNOSIS_PROTOCOLS, DiagnosisProtocol } from "@/data/diagnosisProtocols";
import { SEED_PATIENTS } from "@/data/patients";


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
  const router = useRouter();
  const params = useParams();
  const appointmentId = (params?.id as string) || "APT-DERMA-102";
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [patientFee, setPatientFee] = useState<number>(600);
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSavingAndNext, setIsSavingAndNext] = useState(false);
  const [nextPatientNotice, setNextPatientNotice] = useState<{ token: number; name: string; appointment_number: string } | null>(null);

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
  const [showScribeModal, setShowScribeModal] = useState(false);
  const [dictationInput, setDictationInput] = useState("");
  const [isScribing, setIsScribing] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [scribeSuccessMessage, setScribeSuccessMessage] = useState<string | null>(null);

  // Inpatient Bed Admission State (Marley Health Integration)
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [admitNotes, setAdmitNotes] = useState<string>("");
  const [isAdmittingBed, setIsAdmittingBed] = useState(false);
  const [admitSuccessMsg, setAdmitSuccessMsg] = useState<string | null>(null);

  const [doctor, setDoctor] = useState({
    name: "Dr. Rahul Sharma",
    slug: "dr-rahul-sharma",
    title: "MBBS, MD (Dermatology)",
    reg_number: "UKMC-8942-2012",
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    phone: "+919876543210"
  });

  // Fetch real appointment details if available
  useEffect(() => {
    async function loadAppointment() {
      setIsLoadingPatient(true);

      try {
        const queueRes = await fetch(`/api/clinic/desk-queue`);
        const appointmentsRes = await fetch(`/api/appointments`);

        const queueJson = queueRes.ok ? await queueRes.json() : null;
        const appointmentsJson = appointmentsRes.ok ? await appointmentsRes.json() : null;

        const candidates: any[] = [
          ...(Array.isArray(queueJson?.queue) ? queueJson.queue : []),
          ...(Array.isArray(appointmentsJson) ? appointmentsJson : [])
        ];

        const match = candidates.find((a: any) => {
          const normalizedId = String(appointmentId ?? "").trim();
          const tokenId = Number(normalizedId);
          const appointmentNumber = String(a?.appointment_number || "").trim();
          const patientPhone = String(a?.patient_phone || "").trim();
          const patientName = String(a?.patient_name || "").trim();

          if (!normalizedId) return false;
          if (appointmentNumber && appointmentNumber === normalizedId) return true;
          if (!Number.isNaN(tokenId) && Number(a?.token_number) === tokenId) return true;
          if (patientPhone && normalizedId.replace(/\D/g, "") === patientPhone.replace(/\D/g, "")) return true;
          if (patientName && normalizedId.toLowerCase() === patientName.toLowerCase()) return true;
          return false;
        });

        if (match) {
          setPatient(prev => ({
            ...prev,
            name: match.patient_name || prev.name,
            phone: match.patient_phone || prev.phone,
            token_number: match.token_number || prev.token_number,
            appointment_number: match.appointment_number || prev.appointment_number,
            allergies: prev.allergies,
          }));

          if (match.symptoms_description) {
            setChiefComplaints(match.symptoms_description);
          }

          if (match.fee_amount !== undefined) {
            setPatientFee(Number(match.fee_amount));
          }

          if (match.doctor_name) {
            setDoctor(prev => ({
              ...prev,
              name: match.doctor_name,
              slug: match.doctor_slug || prev.slug,
              clinic_name: match.clinic_name || prev.clinic_name,
              reg_number: match.doctor_slug?.includes("aditi") ? "UDC-4120-2016" : (match.doctor_slug?.includes("vikram") ? "UKMC-7812-2008" : prev.reg_number),
              title: match.doctor_slug?.includes("aditi") ? "BDS, MDS (Endodontics)" : (match.doctor_slug?.includes("vikram") ? "MS, MCh (Plastic Surgery)" : prev.title)
            }));
          }
        }
      } catch (e) {
        // Fallback to initial state
      } finally {
        setIsLoadingPatient(false);
      }
    }
    loadAppointment();
  }, [appointmentId]);

  // Fetch real patient clinical memory from PostgreSQL (past visits, diagnosis, baseline vitals, allergies)
  useEffect(() => {
    const cleanPh = patient.phone.replace(/[^0-9]/g, "").slice(-10);
    if (cleanPh.length === 10) {
      setIsLoadingHistory(true);
      fetch(`/api/patients/${cleanPh}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.patient) {
            setPatientHistory(data.patient);
            if (data.patient.chronic_allergies && data.patient.chronic_allergies.length > 0) {
              setPatient(p => ({ ...p, allergies: data.patient.chronic_allergies.join(", ") }));
            }
          }
        })
        .catch(err => console.error("Error loading patient memory:", err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [patient.phone]);

  // Clinical Vitals with Quick-Pad Safety Radar
  const [vitals, setVitals] = useState({
    bp: "116/74",
    pulse: "76",
    temp: "98.6",
    weight: "58",
    height: "165", // cm
    spo2: "99",
    sugar: "98" // mg/dL
  });

  // Real-time BMI Auto-Calculation
  const calculatedBmi = useMemo(() => {
    const w = parseFloat(vitals.weight);
    const h = parseFloat(vitals.height) / 100;
    if (w > 0 && h > 0) {
      const bmi = parseFloat((w / (h * h)).toFixed(1));
      let category = "Normal";
      let badgeClass = "text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300";
      if (bmi < 18.5) {
        category = "Underweight";
        badgeClass = "text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
      } else if (bmi >= 25 && bmi < 30) {
        category = "Overweight";
        badgeClass = "text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300";
      } else if (bmi >= 30) {
        category = "Obese";
        badgeClass = "text-red-700 bg-red-100 border-red-300 dark:bg-red-950/60 dark:text-red-300";
      }
      return { val: bmi, category, badgeClass };
    }
    return null;
  }, [vitals.weight, vitals.height]);

  // Real-time Blood Pressure Radar
  const bpStatus = useMemo(() => {
    const parts = vitals.bp.split("/");
    if (parts.length === 2) {
      const sys = parseInt(parts[0]);
      const dia = parseInt(parts[1]);
      if (!isNaN(sys) && !isNaN(dia)) {
        if (sys >= 160 || dia >= 100) return { label: "⚠️ Stage 2 HTN", badgeClass: "text-red-700 bg-red-100 border-red-300 dark:bg-red-950/70 dark:text-red-300 animate-pulse", alert: true };
        if (sys >= 140 || dia >= 90) return { label: "Stage 1 HTN", badgeClass: "text-orange-700 bg-orange-100 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300", alert: false };
        if (sys >= 120 || dia >= 80) return { label: "Pre-HTN", badgeClass: "text-amber-700 bg-amber-100 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300", alert: false };
        if (sys >= 90 && dia >= 60) return { label: "Normal BP", badgeClass: "text-emerald-700 bg-emerald-100 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300", alert: false };
        return { label: "Hypotension", badgeClass: "text-blue-700 bg-blue-100 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300", alert: false };
      }
    }
    return null;
  }, [vitals.bp]);

  // Real-time Pulse Radar
  const pulseStatus = useMemo(() => {
    const p = parseInt(vitals.pulse);
    if (!isNaN(p)) {
      if (p > 100) return { label: "Tachycardia", badgeClass: "text-red-600 font-bold" };
      if (p < 60 && p > 30) return { label: "Bradycardia", badgeClass: "text-amber-600 font-bold" };
      return { label: "Normal", badgeClass: "text-emerald-600" };
    }
    return null;
  }, [vitals.pulse]);

  // Real-time SpO2 Radar
  const spo2Status = useMemo(() => {
    const s = parseInt(vitals.spo2);
    if (!isNaN(s)) {
      if (s < 94) return { label: "⚠️ Hypoxia", badgeClass: "text-red-600 font-bold" };
      return { label: "Normal", badgeClass: "text-emerald-600" };
    }
    return null;
  }, [vitals.spo2]);

  // Real-time Blood Sugar Radar
  const sugarStatus = useMemo(() => {
    const s = parseInt(vitals.sugar);
    if (!isNaN(s)) {
      if (s >= 200) return { label: "Hyperglycemia (≥200)", badgeClass: "text-red-600 font-bold" };
      if (s >= 140) return { label: "Impaired (140-199)", badgeClass: "text-amber-600 font-bold" };
      return { label: "Normal (<140)", badgeClass: "text-emerald-600" };
    }
    return null;
  }, [vitals.sugar]);

  // Past Patient Record & 1-Click Past Visit Clone (Combines PostgreSQL memory + Seed patients)
  const pastPatientRecord = useMemo(() => {
    return SEED_PATIENTS.find(
      p => p.phone.replace(/\D/g, "").includes(patient.phone.replace(/\D/g, "")) ||
           p.full_name.toLowerCase() === patient.name.toLowerCase()
    );
  }, [patient.phone, patient.name]);

  const lastClinicalVisit = useMemo(() => {
    if (patientHistory && patientHistory.visits && patientHistory.visits.length > 0) {
      return patientHistory.visits[0];
    }
    if (pastPatientRecord && pastPatientRecord.visits && pastPatientRecord.visits.length > 0) {
      return pastPatientRecord.visits[0];
    }
    return null;
  }, [patientHistory, pastPatientRecord]);

  const clonePreviousRx = (extendDuration: boolean = false) => {
    if (!lastClinicalVisit) return;
    
    if (lastClinicalVisit.provisional_diagnosis) {
      setProvisionalDiagnosis(lastClinicalVisit.provisional_diagnosis);
    }
    if (lastClinicalVisit.symptoms) {
      setChiefComplaints(lastClinicalVisit.symptoms);
    }
    if (lastClinicalVisit.followup_advice) {
      setFollowupAdvice(lastClinicalVisit.followup_advice);
    }
    if (lastClinicalVisit.vitals) {
      setVitals(prev => ({
        ...prev,
        bp: lastClinicalVisit.vitals.bp || prev.bp,
        pulse: String(lastClinicalVisit.vitals.pulse || prev.pulse),
        temp: String(lastClinicalVisit.vitals.temp || prev.temp),
        weight: String(lastClinicalVisit.vitals.weight || prev.weight),
        spo2: String(lastClinicalVisit.vitals.spo2 || prev.spo2)
      }));
    }

    const clonedMeds: PrescribedMedicine[] = (lastClinicalVisit.medications_summary || []).map((summaryStr: string, idx: number) => {
      // Find matching medicine from catalog or preserve EXACT medicine written by doctor
      const cleanName = summaryStr.replace(/^(CAP|TAB|SYR|CREAM|LOTION|GEL|OINT)\s+/i, "").trim();
      const detectedForm = summaryStr.match(/^(CAP|TAB|SYR|CREAM|LOTION|GEL|OINT)/i)?.[0] || "Tablet";
      const normalizedForm = detectedForm.toUpperCase().startsWith("CAP") ? "Capsule"
        : detectedForm.toUpperCase().startsWith("TAB") ? "Tablet"
        : detectedForm.toUpperCase().startsWith("SYR") ? "Syrup"
        : detectedForm.toUpperCase().startsWith("CREAM") ? "Cream"
        : detectedForm.toUpperCase().startsWith("OINT") ? "Ointment"
        : "Tablet";

      const matched = INDIAN_MEDICINES.find(m => 
        cleanName.toLowerCase().includes(m.brand_name.toLowerCase()) || 
        m.generic_name.toLowerCase().includes(cleanName.toLowerCase())
      );

      if (matched) {
        return {
          id: `rx-cloned-${Date.now()}-${idx}`,
          medicine_name: matched.brand_name,
          generic_name: matched.generic_name,
          dosage_form: matched.dosage_form,
          strength: matched.strength,
          frequency: "1-0-1 (Twice Daily)",
          duration: extendDuration ? "30 Days (Chronic Refill)" : "14 Days",
          special_instructions: matched.common_instructions
        };
      }

      // Exact drug preservation - NEVER invent random medicines from the catalog
      return {
        id: `rx-cloned-${Date.now()}-${idx}`,
        medicine_name: cleanName,
        generic_name: cleanName,
        dosage_form: normalizedForm,
        strength: "Standard",
        frequency: "1-0-1 (Twice Daily)",
        duration: extendDuration ? "30 Days (Chronic Refill)" : "14 Days",
        special_instructions: "As directed in previous consultation"
      };
    });

    setPrescribedItems(clonedMeds);
    setComboToast(`🔁 Cloned ${clonedMeds.length} medicines from previous visit (${lastClinicalVisit.visit_date}) in 0.1s!`);
    setTimeout(() => setComboToast(null), 4500);
  };

  // Clinical Diagnosis Protocols State
  const [showProtocolDrawer, setShowProtocolDrawer] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState("All");

  const applyDiagnosisProtocol = (protocol: DiagnosisProtocol) => {
    setProvisionalDiagnosis(`${protocol.diagnosis_name} [${protocol.icd10_code}]`);
    setChiefComplaints(protocol.typical_complaints);
    setFollowupAdvice(protocol.clinical_advice);

    if (protocol.recommended_lab_test_ids && protocol.recommended_lab_test_ids.length > 0) {
      setSelectedLabs(prev => Array.from(new Set([...prev, ...protocol.recommended_lab_test_ids])));
    }

    if (protocol.medications && protocol.medications.length > 0) {
      const mapped: PrescribedMedicine[] = protocol.medications.map((m, idx) => ({
        id: `protocol-${Date.now()}-${idx}`,
        medicine_name: m.medicine_name,
        generic_name: m.generic_name,
        dosage_form: m.dosage_form,
        strength: m.strength,
        frequency: m.frequency,
        duration: m.duration,
        special_instructions: m.special_instructions
      }));
      setPrescribedItems(mapped);
    }

    setComboToast(`⚡ Loaded Protocol "${protocol.diagnosis_name}" (<0.1s)!`);
    setTimeout(() => setComboToast(null), 4500);
  };


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

  // Language & Clinical Safety States
  const [languageMode, setLanguageMode] = useState<"en" | "bilingual" | "hi">("bilingual");
  const [safetyReport, setSafetyReport] = useState<InteractionCheckResult>(() => 
    evaluatePrescriptionSafety([
      { medicine_name: "Cetzine 10", generic_name: "CETIRIZINE HYDROCHLORIDE" },
      { medicine_name: "Clindac-A", generic_name: "CLINDAMYCIN PHOSPHATE" }
    ], "No known drug allergies reported")
  );

  // Re-evaluate safety whenever prescribed medicines or patient allergies change
  useEffect(() => {
    const local = evaluatePrescriptionSafety(
      prescribedItems.map(p => ({ medicine_name: p.medicine_name, generic_name: p.generic_name })),
      patient.allergies
    );
    setSafetyReport(local);

    const medsPayload = prescribedItems.map(p => ({
      medicine_name: p.medicine_name,
      generic_name: p.generic_name
    }));

    fetch(`/api/prescriptions/check-interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medications: medsPayload,
        patient_allergies: patient.allergies
      })
    })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json && json.data) {
          setSafetyReport(json.data);
        }
      })
      .catch(() => {
        // Fallback populated locally
      });
  }, [prescribedItems, patient.allergies]);

  // Total Generic Cost Savings Calculation
  const totalGenericSavings = useMemo(() => {
    let totalBrand = 0;
    let totalGeneric = 0;
    let count = 0;

    for (const item of prescribedItems) {
      const comp = getJanAushadhiSavings(item.generic_name, item.medicine_name);
      if (comp) {
        totalBrand += comp.brand_mrp;
        totalGeneric += comp.generic_mrp;
        count++;
      }
    }

    const saved = totalBrand - totalGeneric;
    const pct = totalBrand > 0 ? Math.round((saved / totalBrand) * 100) : 0;
    return { count, totalBrand, totalGeneric, saved, pct };
  }, [prescribedItems]);

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

  // Open Bed Admission Modal (Marley Health Inpatient Protocol)
  const openAdmitModal = async () => {
    setShowAdmitModal(true);
    setAdmitNotes(`Inpatient observation for ${provisionalDiagnosis}. Baseline Vitals: BP ${vitals.bp}, Pulse ${vitals.pulse}, SpO2 ${vitals.spo2}%.`);
    try {
      const res = await fetch(`/api/beds`);
      if (res.ok) {
        const data = await res.json();
        const vacBeds = (data.beds || []).filter((b: any) => b.status === "vacant");
        setAvailableBeds(vacBeds);
        if (vacBeds.length > 0 && !selectedBedId) {
          setSelectedBedId(vacBeds[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load beds:", e);
    }
  };

  const handleConfirmBedAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId) {
      alert("Please select a vacant bed");
      return;
    }
    setIsAdmittingBed(true);
    try {
      const res = await fetch(`/api/beds/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bed_id: selectedBedId,
          patient_name: patient.name,
          patient_phone: patient.phone,
          assigned_doctor_name: doctor.name,
          admission_notes: admitNotes
        })
      });

      if (res.ok) {
        setShowAdmitModal(false);
        const bedInfo = availableBeds.find(b => b.id === selectedBedId);
        setAdmitSuccessMsg(`✓ Patient ${patient.name} admitted to ${bedInfo?.ward_name || "Ward"} (Bed ${bedInfo?.bed_number || ""})! Inpatient record and bed occupancy updated.`);
        setTimeout(() => setAdmitSuccessMsg(null), 5000);
      } else {
        alert("Failed to admit patient to bed.");
      }
    } catch (err) {
      console.error("Error admitting patient to bed:", err);
      alert("Network error admitting patient.");
    } finally {
      setIsAdmittingBed(false);
    }
  };

  // Specialty Quick Kits
  const applySpecialtyKit = (kitType: "acne" | "dermatitis" | "fungal" | "fever" | "ddi_test" | "allergy_test") => {
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
    } else if (kitType === "ddi_test") {
      setProvisionalDiagnosis("Coronary Artery Disease & Erectile Dysfunction (Simulated DDI)");
      setPrescribedItems([
        {
          id: `rx-${Date.now()}-1`,
          medicine_name: "Nitrocontin 2.6",
          generic_name: "NITROGLYCERIN",
          dosage_form: "Tablet",
          strength: "2.6 mg",
          frequency: "1-0-1 (After Food)",
          duration: "30 Days",
          special_instructions: "Swallow whole with water. Do not crush."
        },
        {
          id: `rx-${Date.now()}-2`,
          medicine_name: "Silagra 50",
          generic_name: "SILDENAFIL",
          dosage_form: "Tablet",
          strength: "50 mg",
          frequency: "0-0-1 (SOS)",
          duration: "10 Days",
          special_instructions: "Take 1 hour before planned activity."
        }
      ]);
    } else if (kitType === "allergy_test") {
      setPatient(prev => ({ ...prev, allergies: "Penicillin & Beta-Lactam Allergy" }));
      setProvisionalDiagnosis("Bacterial Tonsillitis (Simulated Allergy Conflict)");
      setPrescribedItems([
        {
          id: `rx-${Date.now()}-1`,
          medicine_name: "Augmentin 625 Duo",
          generic_name: "AMOXICILLIN + POTASSIUM CLAVULANATE",
          dosage_form: "Tablet",
          strength: "625 mg",
          frequency: "1-0-1 (After Meals)",
          duration: "5 Days",
          special_instructions: "Take at the start of meals."
        }
      ]);
    }
  };

  // Signed Prescription State
  const [signedPrescription, setSignedPrescription] = useState<any | null>(null);

  // --- WHATSAPP PDF PRESCRIPTION DISPATCH & PAPER FORMAT STATE ---
  const [rxPaperFormat, setRxPaperFormat] = useState<"a4" | "a5">("a4");
  const [showWhatsAppDispatchModal, setShowWhatsAppDispatchModal] = useState<boolean>(false);
  const [dispatchRecipientType, setDispatchRecipientType] = useState<"patient" | "attendant" | "chemist">("patient");
  const [dispatchPhone, setDispatchPhone] = useState<string>("");
  const [dispatchAttendantName, setDispatchAttendantName] = useState<string>("");
  const [dispatchTemplate, setDispatchTemplate] = useState<"standard" | "bilingual_hindi" | "chemist_order">("standard");
  const [dispatchCustomNote, setDispatchCustomNote] = useState<string>("");
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  const handleExecuteWhatsAppDispatch = async () => {
    if (!signedPrescription) return;
    setIsDispatching(true);
    const targetPhone = dispatchPhone || patient.phone;
    const rxNumber = signedPrescription.prescription_number || "RX-2026-09-0014";

    try {
      const res = await fetch(`/api/prescriptions/${rxNumber}/whatsapp-dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_phone: targetPhone,
          recipient_type: dispatchRecipientType,
          attendant_name: dispatchAttendantName || undefined,
          template_type: dispatchTemplate,
          custom_note: dispatchCustomNote || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.whatsapp_url) {
          window.open(data.whatsapp_url, "_blank");
        }
        setDispatchFeedback(`Dispatched official PDF link to ${targetPhone} via WhatsApp!`);
        setTimeout(() => setDispatchFeedback(null), 4000);
        setShowWhatsAppDispatchModal(false);
      } else {
        const cleanPh = targetPhone.replace(/[^0-9]/g, "");
        const fallbackMsg = `Namaste! Here is the official NMC-signed prescription #${rxNumber} from ${doctor.name} at ${doctor.clinic_name}:\nhttp://localhost:3000/p/${rxNumber}`;
        window.open(`https://wa.me/${cleanPh}?text=${encodeURIComponent(fallbackMsg)}`, "_blank");
        setShowWhatsAppDispatchModal(false);
      }
    } catch (err) {
      const cleanPh = targetPhone.replace(/[^0-9]/g, "");
      const fallbackMsg = `Namaste! Here is the official NMC-signed prescription #${rxNumber} from ${doctor.name} at ${doctor.clinic_name}:\nhttp://localhost:3000/p/${rxNumber}`;
      window.open(`https://wa.me/${cleanPh}?text=${encodeURIComponent(fallbackMsg)}`, "_blank");
      setShowWhatsAppDispatchModal(false);
    } finally {
      setIsDispatching(false);
    }
  };

  // Automated WhatsApp Follow-up & Review Booster (Option B)
  const [scheduledAutomations, setScheduledAutomations] = useState<any[]>([]);
  const [automationSuccessToast, setAutomationSuccessToast] = useState<string | null>(null);


  const initAutomations = (rxNumber: string) => {
    const cleanPh = patient.phone.replace(/[^0-9]/g, "");
    const rxMsg = `Namaste ${patient.name},\nYour digital prescription from ${doctor.name} at ${doctor.clinic_name} is ready.\n\n📄 View & Download Rx: http://localhost:3000/prescriptions/${rxNumber}\n💊 Please take medicines as advised after meals.\n\nWishing you good health!`;
    const reviewMsg = `Namaste ${patient.name}! We hope you are recovering well after your visit with ${doctor.name} at ${doctor.clinic_name}. ⭐\n\nIf you had a reassuring experience, could you take 15 seconds to support our doctor with a 5-star Google review? It helps patients like you find quality care:\n👉 https://g.page/r/derma-care-dehradun/review\n\nThank you for trusting ${doctor.clinic_name}!`;
    const followupMsg = `Namaste ${patient.name}, gentle reminder from ${doctor.clinic_name}:\nYour consultation follow-up validity with ${doctor.name} expires in 48 hours.\n\nIf you need a re-evaluation or test review, tap here to view queue & reserve your priority token:\n👉 http://localhost:3000/doctors/dr-rahul-sharma`;

    setScheduledAutomations([
      {
        id: `auto-rx-${Date.now()}`,
        trigger_type: "rx_dispatch",
        title: "Instant Rx WhatsApp Dispatch",
        badge: "Immediate (0 Min)",
        status: "sent",
        message_text: rxMsg,
        whatsapp_url: `https://wa.me/${cleanPh}?text=${encodeURIComponent(rxMsg)}`
      },
      {
        id: `auto-rev-${Date.now()}`,
        trigger_type: "google_review",
        title: "Google 5-Star Review Booster",
        badge: "Today at 19:30 PM",
        status: "scheduled",
        message_text: reviewMsg,
        whatsapp_url: `https://wa.me/${cleanPh}?text=${encodeURIComponent(reviewMsg)}`
      },
      {
        id: `auto-flw-${Date.now()}`,
        trigger_type: "followup_reminder",
        title: "Follow-Up Validity Expiry Alert",
        badge: "Day 5 Reminder",
        status: "scheduled",
        message_text: followupMsg,
        whatsapp_url: `https://wa.me/${cleanPh}?text=${encodeURIComponent(followupMsg)}`
      }
    ]);
  };

  // --- 1-TAP DOCTOR'S PERSONAL RX COMBOS STATE ---
  const [customCombos, setCustomCombos] = useState<RxComboItem[]>([]);
  const [selectedComboFilter, setSelectedComboFilter] = useState<string>("All");
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [showSaveComboModal, setShowSaveComboModal] = useState<boolean>(false);
  const [newComboTitle, setNewComboTitle] = useState<string>("");
  const [newComboSpecialty, setNewComboSpecialty] = useState<"Dermatology" | "General Medicine" | "Pediatrics" | "Dental" | "Custom">("Dermatology");
  const [newComboTag, setNewComboTag] = useState<string>("");

  // Load custom combos from localStorage
  useEffect(() => {
    setCustomCombos(getStoredCustomCombos());
  }, []);

  const allAvailableCombos = useMemo(() => {
    return [...customCombos, ...PRESET_RX_COMBOS];
  }, [customCombos]);

  const filteredCombos = useMemo(() => {
    if (selectedComboFilter === "All") return allAvailableCombos;
    if (selectedComboFilter === "Custom") return customCombos;
    return allAvailableCombos.filter(c => c.specialty === selectedComboFilter);
  }, [allAvailableCombos, customCombos, selectedComboFilter]);

  const applyRxCombo = (combo: RxComboItem) => {
    if (combo.diagnosis) setProvisionalDiagnosis(combo.diagnosis);
    if (combo.complaints) setChiefComplaints(combo.complaints);
    if (combo.followup) setFollowupAdvice(combo.followup);
    if (combo.labs && combo.labs.length > 0) setSelectedLabs(combo.labs);

    if (combo.medicines && combo.medicines.length > 0) {
      const mapped: PrescribedMedicine[] = combo.medicines.map((m, idx) => ({
        id: `rx-combo-${Date.now()}-${idx}`,
        medicine_name: m.medicine_name,
        generic_name: m.generic_name,
        dosage_form: m.dosage_form,
        strength: m.strength,
        frequency: m.frequency,
        duration: m.duration,
        special_instructions: m.special_instructions
      }));
      setPrescribedItems(mapped);
    }

    setComboToast(`⚡ Applied "${combo.title}" in 0.2s! (${combo.medicines.length} medicines, doses & instructions loaded)`);
    setTimeout(() => setComboToast(null), 4500);
  };

  const handleSaveCurrentAsCombo = () => {
    if (!newComboTitle.trim()) return;
    const newCombo: RxComboItem = {
      id: `custom-combo-${Date.now()}`,
      title: newComboTitle.trim(),
      specialty: newComboSpecialty,
      tag: newComboTag.trim() || newComboTitle.trim().slice(0, 10),
      badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700/50",
      diagnosis: provisionalDiagnosis,
      complaints: chiefComplaints,
      medicines: prescribedItems.map(p => ({
        medicine_name: p.medicine_name,
        generic_name: p.generic_name,
        dosage_form: p.dosage_form,
        strength: p.strength,
        frequency: p.frequency,
        duration: p.duration,
        special_instructions: p.special_instructions
      })),
      labs: selectedLabs,
      followup: followupAdvice,
      isCustom: true
    };

    const updated = saveCustomComboToStorage(newCombo);
    setCustomCombos(updated);
    setShowSaveComboModal(false);
    setNewComboTitle("");
    setNewComboTag("");
    setComboToast(`★ Saved "${newCombo.title}" to your personal 1-Tap combos library!`);
    setTimeout(() => setComboToast(null), 4000);
  };

  const handleDeleteCustomCombo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomComboFromStorage(id);
    setCustomCombos(updated);
  };

  // --- PHYSICAL LETTERHEAD PRINTER CALIBRATOR STATE ---
  const [letterheadMode, setLetterheadMode] = useState<"blank_paper" | "preprinted">("blank_paper");
  const [topMarginMm, setTopMarginMm] = useState<number>(65); // 65mm default top blank space for doctor's stationery
  const [bottomMarginMm, setBottomMarginMm] = useState<number>(25); // 25mm default bottom blank space
  const [sideMarginMm, setSideMarginMm] = useState<number>(15); // 15mm default side margin
  const [showPatientBarInLetterhead, setShowPatientBarInLetterhead] = useState<boolean>(true);
  const [showPaperGuideSilhouette, setShowPaperGuideSilhouette] = useState<boolean>(true);
  const [showCalibratorDrawer, setShowCalibratorDrawer] = useState<boolean>(false);
  const [calibrationSaveFeedback, setCalibrationSaveFeedback] = useState<string | null>(null);

  // Load printer calibration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clinicos_letterhead_calibration_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.letterheadMode) setLetterheadMode(parsed.letterheadMode);
        if (typeof parsed.topMarginMm === "number") setTopMarginMm(parsed.topMarginMm);
        if (typeof parsed.bottomMarginMm === "number") setBottomMarginMm(parsed.bottomMarginMm);
        if (typeof parsed.sideMarginMm === "number") setSideMarginMm(parsed.sideMarginMm);
        if (typeof parsed.showPatientBarInLetterhead === "boolean") setShowPatientBarInLetterhead(parsed.showPatientBarInLetterhead);
      }
    } catch (e) {
      console.error("Failed loading letterhead calibration", e);
    }
  }, []);

  const handleSaveCalibration = () => {
    try {
      const settings = {
        letterheadMode,
        topMarginMm,
        bottomMarginMm,
        sideMarginMm,
        showPatientBarInLetterhead
      };
      localStorage.setItem("clinicos_letterhead_calibration_v1", JSON.stringify(settings));
      setCalibrationSaveFeedback("Printer margins saved as default for this clinic!");
      setTimeout(() => setCalibrationSaveFeedback(null), 3500);
    } catch (e) {
      console.error("Failed saving letterhead calibration", e);
    }
  };

  // AI Scribe Handler
  const handleRunAIScribe = async (customText?: string) => {
    const textToProcess = customText || dictationInput;
    if (!textToProcess.trim()) return;

    setIsScribing(true);
    try {
      const res = await fetch(`/api/prescriptions/scribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dictation_text: textToProcess })
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        if (data.vitals) {
          setVitals(prev => ({
            ...prev,
            bp: data.vitals.bp || prev.bp,
            pulse: data.vitals.pulse || prev.pulse,
            temp: data.vitals.temp || prev.temp,
            weight: data.vitals.weight || prev.weight,
            spo2: data.vitals.spo2 || prev.spo2
          }));
        }
        if (data.chief_complaints) setChiefComplaints(data.chief_complaints);
        if (data.provisional_diagnosis) setProvisionalDiagnosis(data.provisional_diagnosis);
        if (data.followup_advice) setFollowupAdvice(data.followup_advice);
        if (data.medicines && data.medicines.length > 0) {
          const mappedMeds: PrescribedMedicine[] = data.medicines.map((m: any, idx: number) => ({
            id: `rx-ai-${Date.now()}-${idx}`,
            medicine_name: m.medicine_name,
            generic_name: m.generic_name,
            dosage_form: m.dosage_form || "Tablet",
            strength: m.strength || "",
            frequency: m.frequency || "1-0-1",
            duration: m.duration || "5 Days",
            special_instructions: m.special_instructions || "Take after meals"
          }));
          setPrescribedItems(mappedMeds);
        }

        setShowScribeModal(false);
        setScribeSuccessMessage("AI Clinical Scribe parsed and populated vitals, diagnosis, and prescription items!");
        setTimeout(() => setScribeSuccessMessage(null), 5000);
      }
    } catch (e) {
      console.error("AI Scribe error:", e);
    } finally {
      setIsScribing(false);
    }
  };

  const handleSignPrescription = async () => {
    setIsSigning(true);
    const rxNumber = `RX-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const payload = {
        appointment_number: patient.appointment_number,
        doctor_slug: doctor.slug || "dr-rahul-sharma",
        doctor_name: doctor.name,
        doctor_reg_number: doctor.reg_number,
        clinic_name: doctor.clinic_name,
        clinic_address: doctor.clinic_address,
        patient_name: patient.name,
        patient_phone: patient.phone,
        patient_age: patient.age,
        patient_gender: patient.gender,
        vitals: vitals,
        symptoms: [chiefComplaints],
        provisional_diagnosis: provisionalDiagnosis,
        items: prescribedItems.map(p => ({
          medicine_name: p.medicine_name,
          generic_name: p.generic_name,
          dosage_form: p.dosage_form,
          strength: p.strength,
          dosage_frequency: p.frequency,
          timing_relation: "After Food",
          duration_days: parseInt(p.duration) || 5,
          special_instructions: p.special_instructions
        })),
        instructions: followupAdvice,
        followup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        lab_tests: COMMON_LAB_TESTS.filter(l => selectedLabs.includes(l.id)).map(l => ({
          test_name: l.test_name,
          category: l.category,
          instructions: l.fasting_required ? "Fasting Required (10-12 hrs)" : "Random sample"
        })),
        procedures: [],
        clinical_notes: `Chief Complaints: ${chiefComplaints}. Vitals: BP ${vitals.bp}, Pulse ${vitals.pulse}, SpO2 ${vitals.spo2}%. Diagnosis: ${provisionalDiagnosis}. Advice: ${followupAdvice}`,
        diet_advice: followupAdvice
      };

      const res = await fetch(`/api/prescriptions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        const rxNum = json.prescription?.prescription_number || rxNumber;
        setSignedPrescription({
          ...json.prescription,
          labs: COMMON_LAB_TESTS.filter(l => selectedLabs.includes(l.id))
        });
        initAutomations(rxNum);

        // Schedule WhatsApp automations & Notify clinic desk that token is completed
        await Promise.all([
          fetch(`/api/clinic/complete-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ appointment_number: patient.appointment_number })
          }).catch(() => {}),
          fetch(`/api/clinic/toggle-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointment_number: patient.appointment_number,
              payment_status: "paid",
              payment_mode: "upi"
            })
          }).catch(() => {}),
          fetch(`/api/clinic/schedule-automations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointment_number: patient.appointment_number,
              patient_name: patient.name,
              patient_phone: patient.phone,
              doctor_name: doctor.name,
              doctor_slug: "dr-rahul-sharma",
              clinic_name: doctor.clinic_name,
              prescription_id: rxNum,
              followup_days: 7
            })
          }).then(r => r.json()).then(data => {
            if (data.automations) setScheduledAutomations(data.automations);
          }).catch(() => {})
        ]);
      } else {
        runFallbackSigning();
      }
    } catch (e) {
      runFallbackSigning();
    } finally {
      setIsSigning(false);
    }
  };

  const runFallbackSigning = () => {
    const rxNumber = `RX-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const shaSignature = "d384b6" + Math.random().toString(36).substring(2, 10) + "7a9e1" + Math.random().toString(36).substring(2, 8) + "fc710e";

    const rxData = {
      prescription_number: rxNumber,
      signed_at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      digital_signature_hash: shaSignature,
      qr_verification_code: `VERIFY-DRRAHUL-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      doctor_name: doctor.name,
      doctor_reg_number: doctor.reg_number,
      qualification_summary: doctor.title,
      clinic_name: doctor.clinic_name,
      clinic_address: doctor.clinic_address,
      patient_name: patient.name,
      patient_phone: patient.phone,
      patient_age: patient.age,
      patient_gender: patient.gender,
      vitals: vitals,
      provisional_diagnosis: provisionalDiagnosis,
      symptoms: [chiefComplaints],
      items: prescribedItems.map(p => ({
        medicine_name: p.medicine_name,
        generic_name: p.generic_name,
        dosage_form: p.dosage_form,
        strength: p.strength,
        dosage_frequency: p.frequency,
        timing_relation: "After Food",
        duration_days: parseInt(p.duration) || 5,
        special_instructions: p.special_instructions
      })),
      labs: COMMON_LAB_TESTS.filter(l => selectedLabs.includes(l.id)),
      instructions: followupAdvice,
      followup_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    };

    initAutomations(rxNumber);
    setSignedPrescription(rxData);
  };

  // Play Acoustic Chime when calling or transitioning patients
  const playCallChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.frequency.setValueAtTime(880.00, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);
    } catch (e) {}
  };

  // Continuous Clinic Loop: ⚡ SAVE & NEXT PATIENT (Steps 10-14)
  const handleSaveAndNext = async () => {
    setIsSavingAndNext(true);
    try {
      // 1. Sign Prescription & create SHA-256 seal
      await handleSignPrescription();

      // 2. Fetch queue to locate the next waiting patient
      const qRes = await fetch(`/api/clinic/desk-queue`);
      let nextApt: any = null;
      if (qRes.ok) {
        const qJson = await qRes.json();
        const waitingList = (qJson.queue || []).filter(
          (a: any) =>
            (a.status === "waiting" || a.status === "in_waiting" || a.status === "confirmed") &&
            String(a.appointment_number).trim() !== String(patient.appointment_number).trim() &&
            Number(a.token_number) !== Number(patient.token_number)
        );
        if (waitingList.length > 0) {
          nextApt = waitingList[0];
        }
      }

      if (nextApt) {
        setNextPatientNotice({
          token: nextApt.token_number,
          name: nextApt.patient_name,
          appointment_number: nextApt.appointment_number
        });

        // 3. Automatically call next token on server
        try {
          await fetch(`/api/clinic/call-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointment_number: nextApt.appointment_number,
              chamber_name: doctor.clinic_name
            })
          });
        } catch (e) {}

        playCallChime();

        // 4. Smoothly advance to next patient's consultation studio
        setTimeout(() => {
          router.push(`/dashboard/consult/${nextApt.appointment_number}`);
        }, 1100);
      } else {
        setComboToast("🎉 All waiting patients in queue attended! Excellent work Doctor.");
        setTimeout(() => setComboToast(null), 5000);
      }
    } catch (err) {
      console.error("Save & next error:", err);
    } finally {
      setIsSavingAndNext(false);
    }
  };

  // Advance to next patient from Signed Prescription view
  const handleAdvanceToNextPatient = async () => {
    try {
      const qRes = await fetch(`/api/clinic/desk-queue`);
      let nextApt: any = null;
      if (qRes.ok) {
        const qJson = await qRes.json();
        const waitingList = (qJson.queue || []).filter(
          (a: any) =>
            (a.status === "waiting" || a.status === "in_waiting" || a.status === "confirmed") &&
            String(a.appointment_number).trim() !== String(patient.appointment_number).trim() &&
            Number(a.token_number) !== Number(patient.token_number)
        );
        if (waitingList.length > 0) nextApt = waitingList[0];
      }

      if (nextApt) {
        setNextPatientNotice({
          token: nextApt.token_number,
          name: nextApt.patient_name,
          appointment_number: nextApt.appointment_number
        });

        try {
          await fetch(`/api/clinic/call-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appointment_number: nextApt.appointment_number,
              chamber_name: doctor.clinic_name
            })
          });
        } catch (e) {}

        playCallChime();

        setTimeout(() => {
          router.push(`/dashboard/consult/${nextApt.appointment_number}`);
        }, 1000);
      } else {
        alert("🎉 All waiting patients have been attended! Returning to Chambers.");
        router.push(`/dashboard/chambers`);
      }
    } catch (e) {
      router.push(`/dashboard/chambers`);
    }
  };

  // Keyboard Shortcut: Ctrl + Enter (or Cmd + Enter) triggers "Save & Next"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isSigning && !isSavingAndNext) {
          handleSaveAndNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSigning, isSavingAndNext, prescribedItems, provisionalDiagnosis, chiefComplaints, vitals, patient]);

  const cleanPhone = patient.phone.replace(/[^0-9]/g, "");
  const waShareText = `🏥 *Prescription - ${doctor.clinic_name}*\nHello ${patient.name}, Dr. Rahul Sharma has signed your prescription (#${signedPrescription?.prescription_number || "RX-2026"}).\nView & Download: http://localhost:3000/p/${signedPrescription?.prescription_number || "RX-2026-09-0014"}`;

  return (
    <div className="space-y-6">
      {/* 1. TOP APPOINTMENT PATIENT BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-apple-card">
        <div className="flex items-center gap-3.5">
          <BackButton fallbackUrl="/dashboard" label="Queue" />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-apple-blue font-mono text-xl font-bold text-white shadow-apple-sm">
            #{patient.token_number}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">{patient.name}</h1>
              {isLoadingPatient && (
                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                  Live queue
                </span>
              )}
              <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {patient.age}Y / {patient.gender}
              </span>
              <span className="rounded-full bg-apple-teal/10 text-apple-teal dark:text-[#30D1BE] px-2.5 py-0.5 text-[11px] font-medium">
                Token In Consultation
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#86868B]">
              <span>Phone: {patient.phone}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span>Allergy Flag:</span>
                <select
                  value={patient.allergies}
                  onChange={e => setPatient(prev => ({ ...prev, allergies: e.target.value }))}
                  className="rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] px-2 py-0.5 text-xs font-semibold text-apple-teal dark:text-[#30D1BE] focus:outline-none focus:ring-1 focus:ring-apple-teal cursor-pointer"
                >
                  <option value="No known drug allergies reported">No known drug allergies reported</option>
                  <option value="Penicillin & Beta-Lactam Allergy">Penicillin & Beta-Lactam Allergy</option>
                  <option value="Sulfa / Sulfonamide Allergy">Sulfa / Sulfonamide Allergy</option>
                  <option value="NSAID / Aspirin Intolerance">NSAID / Aspirin Intolerance</option>
                  <option value="Cephalosporin Hypersensitivity">Cephalosporin Hypersensitivity</option>
                </select>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AI Clinical Scribe Button */}
          <button
            onClick={() => setShowScribeModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Voice Scribe</span>
          </button>

          {/* Clinical Tools */}
          <button
            onClick={() => setShowDocsModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] transition active:scale-95 cursor-pointer"
          >
            <Microscope className="h-3.5 w-3.5 text-apple-teal" />
            <span>Patient Documents & Labs</span>
          </button>

          <button
            onClick={() => openAdmitModal()}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-3.5 py-1.5 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition active:scale-95 cursor-pointer"
            title="Admit patient to Inpatient Ward or Daycare Observation Bed"
          >
            <Bed className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Admit to Bed</span>
          </button>
        </div>
      </div>

      {/* Bed Admission Success Notification Banner */}
      {admitSuccessMsg && (
        <div className="rounded-[18px] bg-indigo-500/10 border border-indigo-500/30 px-4 py-3 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" /> {admitSuccessMsg}
          </span>
          <button onClick={() => setAdmitSuccessMsg(null)} className="text-[#86868B] hover:text-[#1D1D1F]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Scribe Success Notification Banner */}
      {scribeSuccessMessage && (
        <div className="rounded-[18px] bg-[#34C759]/10 border border-[#34C759]/30 px-4 py-3 text-xs font-semibold text-[#34C759] flex items-center justify-between shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> {scribeSuccessMessage}
          </span>
          <button onClick={() => setScribeSuccessMessage(null)} className="text-[#86868B] hover:text-[#1D1D1F]">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1-Tap Combo Applied Toast Banner */}
      {comboToast && (
        <div className="rounded-[20px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-5 py-3 text-xs font-semibold flex items-center justify-between shadow-apple-md animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-300 fill-amber-300 animate-pulse flex-shrink-0" />
            <span>{comboToast}</span>
          </span>
          <button onClick={() => setComboToast(null)} className="text-white/80 hover:text-white ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Save Current as Combo Modal */}
      {showSaveComboModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-modal">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  Save Current Rx as 1-Tap Combo Pack
                </h3>
              </div>
              <button
                onClick={() => setShowSaveComboModal(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-[#86868B]">
                Save this exact combination of medicines, dosages, diagnosis, and advice into your private 1-Tap library for instant &lt;15s recall in future consultations.
              </p>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                  Combo Title / Clinical Scenario *
                </label>
                <input
                  type="text"
                  value={newComboTitle}
                  onChange={e => setNewComboTitle(e.target.value)}
                  placeholder="e.g. Dr. Rahul's Resistant Melasma & Sunscreen Protocol"
                  className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 p-3 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Specialty Category
                  </label>
                  <select
                    value={newComboSpecialty}
                    onChange={e => setNewComboSpecialty(e.target.value as any)}
                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2.5 font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dental">Dental</option>
                    <option value="Custom">Custom / General</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Short Tag Label
                  </label>
                  <input
                    type="text"
                    value={newComboTag}
                    onChange={e => setNewComboTag(e.target.value)}
                    placeholder="e.g. Melasma"
                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 p-2.5 font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Items Summary Preview */}
              <div className="rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] p-3.5 border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="font-semibold text-[#86868B] text-[11px] uppercase tracking-wider">
                  Included in this Pack ({prescribedItems.length} Medicines):
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {prescribedItems.map((m, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[#1D1D1F] dark:text-white">
                        {idx + 1}. {m.medicine_name} ({m.dosage_form})
                      </span>
                      <span className="font-mono text-[#86868B]">{m.frequency} • {m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveComboModal(false)}
                  className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newComboTitle.trim()}
                  onClick={handleSaveCurrentAsCombo}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-5 py-2 text-xs font-bold text-white shadow-apple-sm disabled:opacity-50 transition active:scale-95"
                >
                  <BookmarkPlus className="h-4 w-4" />
                  <span>Save to My Library</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marley Health Inpatient Ward / Bed Admission Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-modal">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  Direct Inpatient Admission (Marley Protocol)
                </h3>
              </div>
              <button
                onClick={() => setShowAdmitModal(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBedAdmission} className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 border border-indigo-200/50 dark:border-indigo-800/40">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                  Admitting: {patient.name} ({patient.phone})
                </div>
                <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300 mt-0.5">
                  Assigned Consultant: {doctor.name} • Immediate Clinical Transfer
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white block mb-1.5">
                  Select Vacant Inpatient Bed / Daycare Unit *
                </label>
                {availableBeds.length === 0 ? (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 p-3 text-amber-800 dark:text-amber-300">
                    No vacant beds available currently. Check Bed Matrix on dashboard.
                  </div>
                ) : (
                  <select
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2.5 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {availableBeds.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.ward_name} — Bed #{b.bed_number} (₹{b.daily_rate}/day or ₹{b.hourly_rate}/hr)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                  Admission Indication &amp; Clinical Notes *
                </label>
                <textarea
                  rows={3}
                  value={admitNotes}
                  onChange={(e) => setAdmitNotes(e.target.value)}
                  placeholder="Reason for inpatient admission, monitoring instructions..."
                  className="w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex justify-end items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#86868B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdmittingBed || availableBeds.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-apple-sm disabled:opacity-50 transition active:scale-95 cursor-pointer"
                >
                  {isAdmittingBed ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      <span>Admitting Patient...</span>
                    </>
                  ) : (
                    <>
                      <Bed className="h-4 w-4" />
                      <span>Confirm Inpatient Admission</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Clinical Voice & Dictation Scribe Modal */}
      {showScribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-modal">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  AI Clinical Consultation Scribe
                </h3>
              </div>
              <button
                onClick={() => setShowScribeModal(false)}
                className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-[#86868B]">
                Dictate or type unstructured doctor notes. Our clinical parser extracts Vitals, Diagnosis, and UPPERCASE generic medications automatically:
              </p>

              {/* Sample Dictation Chips */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold text-[#86868B] self-center">Try Samples:</span>
                <button
                  type="button"
                  onClick={() => setDictationInput("Patient 24 female with acute severe urticaria and facial itching for 2 days. BP 120/80, pulse 76. Start Bilastine 20mg once daily at night for 7 days, Calamine lotion application, and advise review after 7 days.")}
                  className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-white"
                >
                  Urticaria & Itching
                </button>
                <button
                  type="button"
                  onClick={() => setDictationInput("Patient with Grade II inflammatory acne with pustules on cheeks for 3 weeks. BP 118/74. Prescribe Doxy-100 capsule once daily after food for 14 days and Clindac-A gel at night. Review in 2 weeks.")}
                  className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-white"
                >
                  Cystic Acne
                </button>
                <button
                  type="button"
                  onClick={() => setDictationInput("Fever 101F, body ache, dry cough for 3 days. Temp 101, pulse 88, BP 110/72. Acute viral pharyngitis. Start Dolo 650mg TDS SOS for 3 days, Pan-40 before breakfast for 5 days. Blood test advised: CBC.")}
                  className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:text-white"
                >
                  Viral Fever & CBC
                </button>
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  value={dictationInput}
                  onChange={(e) => setDictationInput(e.target.value)}
                  placeholder="e.g. Patient 24F with severe itchy rash on arms after cosmetic cream. BP 118/74, pulse 76. Diagnosed with Allergic Contact Dermatitis. Give Cetzine 10mg night for 5 days, Momate cream morning for 7 days..."
                  className="w-full rounded-[16px] border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-black/40 p-3.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-[#86868B]">
                  <Mic className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Speech-to-text / Audio dictation enabled</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScribeModal(false)}
                    className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#86868B]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isScribing || !dictationInput.trim()}
                    onClick={() => handleRunAIScribe()}
                    className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition"
                  >
                    {isScribing ? (
                      <>
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Analyzing & Extracting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Extract & Populate Rx</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          {/* PRINT & LETTERHEAD CONTROLS TOOLBAR */}
          <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 shadow-apple-card space-y-4 print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Stationery Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wider">
                  Stationery Mode:
                </span>
                <div className="inline-flex rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/80 dark:bg-black/40 p-1">
                  <button
                    type="button"
                    onClick={() => setLetterheadMode("blank_paper")}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      letterheadMode === "blank_paper"
                        ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
                        : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    📄 Plain A4 Sheet (Full Digital Header)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLetterheadMode("preprinted")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                      letterheadMode === "preprinted"
                        ? "bg-white text-apple-blue shadow-apple-sm dark:bg-[#2C2C2E] dark:text-sky-300"
                        : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>🩺 Doctor Pre-Printed Letterhead</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {letterheadMode === "preprinted" && (
                  <button
                    type="button"
                    onClick={() => setShowCalibratorDrawer(!showCalibratorDrawer)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold border transition ${
                      showCalibratorDrawer
                        ? "bg-apple-blue/10 border-apple-blue/30 text-apple-blue dark:text-sky-300"
                        : "border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.05]"
                    }`}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>{showCalibratorDrawer ? "Close Margin Drawer" : "Calibrate Margins"}</span>
                    <span className="font-mono text-[10px] bg-black/[0.06] dark:bg-white/[0.1] px-1.5 py-0.2 rounded">
                      Top: {topMarginMm}mm
                    </span>
                  </button>
                )}

                {/* Paper Size Format Toggle */}
                <div className="inline-flex rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] p-0.5">
                  <button
                    type="button"
                    onClick={() => setRxPaperFormat("a4")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      rxPaperFormat === "a4"
                        ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                        : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                  >
                    A4 Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => setRxPaperFormat("a5")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      rxPaperFormat === "a5"
                        ? "bg-white text-apple-blue shadow-sm dark:bg-[#2C2C2E] dark:text-sky-300 font-bold"
                        : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                    title="A5 Doctor Prescription Pad (Compact 148x210mm)"
                  >
                    A5 Pad
                  </button>
                </div>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1D1D1F] dark:bg-white px-4 py-2 text-xs font-bold text-white dark:text-[#1D1D1F] hover:opacity-90 shadow-apple-sm active:scale-95 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Rx
                </button>

                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-600/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-700 dark:text-blue-300 px-4 py-2 text-xs font-bold shadow-apple-sm active:scale-95 transition"
                  title="Export official NMC-signed vector PDF"
                >
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </button>

                <button
                  onClick={() => {
                    setDispatchPhone(patient.phone);
                    setShowWhatsAppDispatchModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition cursor-pointer"
                  title="Dispatch prescription PDF link via WhatsApp to patient or attendant"
                >
                  <Send className="h-3.5 w-3.5" /> WhatsApp Dispatch
                </button>

                <button
                  onClick={handleAdvanceToNextPatient}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-2 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition cursor-pointer"
                  title="Call and advance to next waiting patient in queue"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>⚡ Next Patient ➔</span>
                </button>

                <button
                  onClick={() => setSignedPrescription(null)}
                  className="rounded-full border border-black/[0.1] dark:border-white/[0.12] px-3.5 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
                >
                  Edit
                </button>
              </div>
            </div>

            {dispatchFeedback && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" />
                <span>{dispatchFeedback}</span>
              </div>
            )}

            {/* ₹500 CONSULTATION BILL & DYNAMIC UPI QR / SOUNDBOX RECONCILIATION CARD */}
            <div className="rounded-[24px] border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.06] via-teal-500/[0.04] to-emerald-500/[0.02] dark:from-emerald-950/30 dark:to-teal-950/20 p-5 shadow-apple-card space-y-4 print:hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex-shrink-0 font-bold font-mono">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Official Consultation Bill Created
                      </span>
                      <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-500/20">
                        Bill #INV-2026-09-{String(patient.token_number || 1).padStart(4, "0")}
                      </span>
                      <span className="rounded-full bg-blue-500/10 text-blue-700 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5">
                        Auto-Recorded in EOD Ledger
                      </span>
                    </div>
                    <div className="text-sm font-black text-[#1D1D1F] dark:text-white mt-0.5">
                      ₹{patientFee} OPD Consultation Fee ({doctor.name})
                    </div>
                  </div>
                </div>

                {/* UPI Intent & Soundbox status */}
                <div className="flex items-center gap-3">
                  <div className="text-right text-xs">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 justify-end">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Soundbox Reconciled
                    </div>
                    <div className="text-[10px] text-[#86868B] font-mono">
                      UPI ID: {doctor.slug?.includes("aditi") ? "joshi.dental@icici" : "dermacare@icici"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-1 border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
                    <QRCodeDisplay
                      value={`upi://pay?pa=dermacare@icici&pn=DermaCareClinic&am=${patientFee}&cu=INR&tn=Consultation-Token-${patient.token_number}`}
                      size={48}
                      level="M"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* Letterhead Calibrator Drawer */}
            {letterheadMode === "preprinted" && showCalibratorDrawer && (
              <div className="rounded-2xl border border-apple-blue/20 bg-apple-blue/[0.03] dark:bg-apple-blue/[0.08] p-4.5 space-y-4 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b border-apple-blue/15 pb-2.5">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-apple-blue dark:text-sky-300" />
                    <span className="font-bold text-[#1D1D1F] dark:text-white text-xs">
                      Doctor&apos;s Physical Letterhead Calibrator
                    </span>
                    <span className="text-[10px] text-[#86868B]">
                      (Aligns printout with pre-printed clinic stationery)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {calibrationSaveFeedback && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCheck className="h-3.5 w-3.5" />
                        {calibrationSaveFeedback}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveCalibration}
                      className="inline-flex items-center gap-1 rounded-lg bg-apple-blue hover:bg-[#0077ED] text-white px-3 py-1 text-[11px] font-semibold shadow-apple-sm transition active:scale-95"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save as Default</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Top Blank Margin Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#1D1D1F] dark:text-white">Top Header Blank Space:</span>
                      <span className="font-mono text-apple-blue dark:text-sky-300">
                        {topMarginMm} mm ({(topMarginMm / 25.4).toFixed(1)}″)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      value={topMarginMm}
                      onChange={e => setTopMarginMm(Number(e.target.value))}
                      className="w-full h-1.5 bg-black/[0.1] dark:bg-white/[0.15] rounded-lg appearance-none cursor-pointer accent-apple-blue"
                    />
                    <div className="flex justify-between text-[10px] text-[#86868B]">
                      <span>20 mm (Min)</span>
                      <span>65 mm (Standard Pad)</span>
                      <span>120 mm (Large Logo)</span>
                    </div>
                  </div>

                  {/* Bottom Footer Blank Margin Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#1D1D1F] dark:text-white">Bottom Footer Blank Space:</span>
                      <span className="font-mono text-apple-blue dark:text-sky-300">
                        {bottomMarginMm} mm ({(bottomMarginMm / 25.4).toFixed(1)}″)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={60}
                      value={bottomMarginMm}
                      onChange={e => setBottomMarginMm(Number(e.target.value))}
                      className="w-full h-1.5 bg-black/[0.1] dark:bg-white/[0.15] rounded-lg appearance-none cursor-pointer accent-apple-blue"
                    />
                    <div className="flex justify-between text-[10px] text-[#86868B]">
                      <span>10 mm</span>
                      <span>25 mm (Standard)</span>
                      <span>60 mm</span>
                    </div>
                  </div>

                  {/* Side Padding Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#1D1D1F] dark:text-white">Side Margin Padding:</span>
                      <span className="font-mono text-apple-blue dark:text-sky-300">
                        {sideMarginMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      value={sideMarginMm}
                      onChange={e => setSideMarginMm(Number(e.target.value))}
                      className="w-full h-1.5 bg-black/[0.1] dark:bg-white/[0.15] rounded-lg appearance-none cursor-pointer accent-apple-blue"
                    />
                    <div className="flex justify-between text-[10px] text-[#86868B]">
                      <span>10 mm</span>
                      <span>15 mm</span>
                      <span>30 mm</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5 pt-1 border-t border-apple-blue/10 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1D1D1F] dark:text-white">
                    <input
                      type="checkbox"
                      checked={showPaperGuideSilhouette}
                      onChange={e => setShowPaperGuideSilhouette(e.target.checked)}
                      className="rounded text-apple-blue focus:ring-apple-blue cursor-pointer"
                    />
                    <span>Show Pre-Printed Paper Silhouette (Preview Guide Only)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-[#1D1D1F] dark:text-white">
                    <input
                      type="checkbox"
                      checked={showPatientBarInLetterhead}
                      onChange={e => setShowPatientBarInLetterhead(e.target.checked)}
                      className="rounded text-apple-blue focus:ring-apple-blue cursor-pointer"
                    />
                    <span>Print Patient Details Bar (Uncheck if your pad has pre-printed lines)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ⚡ OPTION B: AUTOMATED PATIENT WHATSAPP & GOOGLE REVIEW BOOSTER ENGINE */}
          <div className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.04] via-teal-500/[0.02] to-sky-500/[0.04] dark:from-emerald-950/20 dark:to-sky-950/20 p-5 sm:p-6 shadow-apple-card space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/15 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                      Automated Patient WhatsApp & Google Review Engine
                    </h3>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 border border-emerald-500/20">
                      ⚡ 3 Scheduled Triggers
                    </span>
                  </div>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Automations queued for <strong className="text-[#1D1D1F] dark:text-white">{patient.name}</strong> ({patient.phone}). Drives Google Reviews & repeat clinic visits.
                  </p>
                </div>
              </div>

              {automationSuccessToast && (
                <div className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-3.5 py-1 text-xs font-bold animate-in fade-in flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{automationSuccessToast}</span>
                </div>
              )}
            </div>

            {/* The 3 Stage Pipeline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Trigger 1: Rx Dispatch */}
              <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E] p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] px-2 py-0.5">
                      1. Immediate (0 Min)
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Ready / Sent
                    </span>
                  </div>
                  <div className="font-bold text-xs text-[#1D1D1F] dark:text-white">
                    📄 Digital Rx PDF & Dosage Guide
                  </div>
                  <p className="text-[11px] text-[#86868B] leading-relaxed line-clamp-3">
                    Dispatches the digital Rx PDF link, medicine dosages & lifestyle advice directly via WhatsApp so patient never loses the slip.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(scheduledAutomations[0]?.message_text || waShareText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 shadow-apple-sm transition active:scale-95 cursor-pointer"
                >
                  <Send className="h-3 w-3" /> Open in WhatsApp
                </a>
              </div>

              {/* Trigger 2: Google 5-Star Booster */}
              <div className="rounded-2xl border border-amber-500/20 bg-white dark:bg-[#2C2C2E] p-4 flex flex-col justify-between space-y-3 relative overflow-hidden">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px] px-2 py-0.5">
                      2. Today at 19:30 PM
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Auto-Queued
                    </span>
                  </div>
                  <div className="font-bold text-xs text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>Google 5-Star Review Booster</span>
                  </div>
                  <p className="text-[11px] text-[#86868B] leading-relaxed line-clamp-3">
                    Evening sentiment prompt asking how patient is feeling and inviting a 5-star Google Maps review with direct 1-tap link.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(scheduledAutomations[1]?.message_text || `Namaste ${patient.name}! If you had a reassuring experience with ${doctor.name}, please leave us a 5-star Google review: https://g.page/r/derma-care-dehradun/review`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold py-2 transition active:scale-95 cursor-pointer"
                >
                  <Send className="h-3 w-3 text-amber-600" /> Test Send Review Prompt
                </a>
              </div>

              {/* Trigger 3: 48h Follow-up Reminder */}
              <div className="rounded-2xl border border-indigo-500/20 bg-white dark:bg-[#2C2C2E] p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] px-2 py-0.5">
                      3. Day 5 Follow-Up Alert
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> 48h Expiry Warning
                    </span>
                  </div>
                  <div className="font-bold text-xs text-[#1D1D1F] dark:text-white">
                    🔁 Follow-Up Validity Warning
                  </div>
                  <p className="text-[11px] text-[#86868B] leading-relaxed line-clamp-3">
                    Reminds patient 48h before free review period lapses to prevent no-shows and drive return clinic footfall.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(scheduledAutomations[2]?.message_text || `Namaste ${patient.name}, your follow-up with ${doctor.name} expires in 48h. Reserve token: http://localhost:3000/doctors/dr-rahul-sharma`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-500/20 text-xs font-bold py-2 transition active:scale-95 cursor-pointer"
                >
                  <Send className="h-3 w-3 text-indigo-600" /> Test Send Reminder
                </a>
              </div>
            </div>
          </div>

          {/* Printable A4 Letterhead Box */}
          <div 
            style={{ 
              paddingLeft: letterheadMode === "preprinted" ? `${sideMarginMm}mm` : undefined, 
              paddingRight: letterheadMode === "preprinted" ? `${sideMarginMm}mm` : undefined 
            }}
            className="mx-auto max-w-3xl rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-8 sm:p-12 shadow-apple-card print:border-none print:shadow-none print:p-0 transition-all"
          >
            {/* Header: Digital Letterhead OR Calibrated Pre-Printed Blank Spacer */}
            {letterheadMode === "blank_paper" ? (
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
            ) : (
              <div 
                style={{ height: `${topMarginMm}mm` }} 
                className="w-full relative transition-all flex items-center justify-center print:border-none"
              >
                {showPaperGuideSilhouette && (
                  <div className="print:hidden absolute inset-x-0 inset-y-1 border-2 border-dashed border-apple-blue/30 rounded-2xl bg-apple-blue/[0.03] flex flex-col items-center justify-center p-3 text-center">
                    <div className="flex items-center gap-1.5 font-bold text-apple-blue dark:text-sky-300 text-xs">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Pre-Printed Letterhead Header Zone ({topMarginMm} mm / {(topMarginMm / 25.4).toFixed(1)}″)</span>
                    </div>
                    <span className="text-[10px] text-[#86868B] mt-0.5 max-w-md">
                      Your pre-printed clinic stationery logo, address, and doctor credentials will occupy this blank space on physical paper.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Patient Details Bar */}
            {(letterheadMode === "blank_paper" || showPatientBarInLetterhead) && (
              <div className="mt-4 grid grid-cols-4 gap-2 bg-[#ECEEF2]/70 p-3 rounded-xl text-xs dark:bg-[#2C2C2E]/60 text-[#1D1D1F] dark:text-white">
                <div>Patient: <strong>{patient.name}</strong></div>
                <div>Age/Sex: <strong>{patient.age}Y / {patient.gender}</strong></div>
                <div>Rx Date: <strong>{new Date().toLocaleDateString("en-IN")}</strong></div>
                <div>Rx Number: <strong className="font-mono">{signedPrescription.prescription_number}</strong></div>
              </div>
            )}

            {/* Vitals */}
            {(letterheadMode === "blank_paper" || showPatientBarInLetterhead) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#86868B] font-mono">
                <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">BP: {vitals.bp} mmHg</span>
                <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Pulse: {vitals.pulse} bpm</span>
                <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Temp: {vitals.temp} °F</span>
                {vitals.spo2 && <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">SpO₂: {vitals.spo2}%</span>}
                {vitals.height && <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Ht: {vitals.height} cm</span>}
                <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">Wt: {vitals.weight} kg</span>
                {calculatedBmi && (
                  <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold">
                    BMI: {calculatedBmi.val} ({calculatedBmi.category})
                  </span>
                )}
                {vitals.sugar && <span className="bg-[#ECEEF2]/70 px-2.5 py-1 rounded-lg dark:bg-[#2C2C2E]">RBS Sugar: {vitals.sugar} mg/dL</span>}
              </div>
            )}

            {/* Provisional Diagnosis */}
            <div className="mt-5 text-xs">
              <span className="font-semibold text-[#86868B]">Provisional Diagnosis: </span>
              <strong className="text-[#1D1D1F] dark:text-white text-sm">
                {signedPrescription.provisional_diagnosis || signedPrescription.diagnosis}
              </strong>
            </div>

            {/* Prescribed Medications */}
            <div className="mt-6">
              <div className="text-sm font-bold text-[#1D1D1F] dark:text-white border-b border-black/[0.06] dark:border-white/[0.08] pb-1 mb-4 flex items-center justify-between">
                <span>℞ Prescribed Medications (NMC UPPERCASE Generic Standards)</span>
                <span className="text-[10px] text-[#86868B] font-normal">Valid with verified digital signature</span>
              </div>

              <div className="space-y-4">
                {signedPrescription.items.map((item: PrescribedMedicine, idx: number) => {
                  const hindiDirections = translateDirectionsToHindi(item.frequency, item.duration, item.special_instructions);
                  return (
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
                        {languageMode !== "en" && (
                          <div className="mt-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[11px] text-amber-900 dark:text-amber-200">
                            <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                              <span>🇮🇳 खुराक निर्देश (Hindi):</span>
                              <span className="font-normal">{hindiDirections.frequency_hi} • {hindiDirections.duration_hi}</span>
                            </div>
                            {hindiDirections.instructions_hi && (
                              <div className="text-[10.5px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                                सलाह: {hindiDirections.instructions_hi}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-apple-blue font-mono">{item.frequency}</div>
                        <div className="text-[11px] text-[#86868B]">Duration: {item.duration}</div>
                      </div>
                    </div>
                  );
                })}
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

            {/* Signature Block & Verification QR */}
            <div className="mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-t-2 border-[#1D1D1F] pt-5 dark:border-white gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white p-1.5 shadow-sm">
                  <QRCodeDisplay
                    value={typeof window !== "undefined" ? `${window.location.origin}/p/${signedPrescription.prescription_number || "RX-2026-09-0014"}` : `https://clinicos.vercel.app/p/${signedPrescription.prescription_number || "RX-2026-09-0014"}`}
                    size={72}
                    level="M"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-apple-teal text-xs font-semibold dark:text-[#30D1BE]">
                    <ShieldCheck className="h-4 w-4" /> NMC Cryptographically Signed
                  </div>
                  <div className="font-mono text-[9px] text-[#86868B] break-all max-w-[220px]">
                    SHA-256: {signedPrescription.signature_hash || signedPrescription.digital_signature_hash || "d384b67a9e1fc710e"}
                  </div>
                  <div className="text-[10px] text-[#86868B]">
                    Scan QR to verify authentic NMC prescription on Clinicos
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{doctor.name}</div>
                <div className="text-xs text-[#86868B]">{doctor.title}</div>
                <div className="text-[10px] text-[#86868B] font-mono">Reg: {doctor.reg_number}</div>
                <div className="inline-block mt-1 rounded border border-emerald-600/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                  ✓ Digitally Verified
                </div>
              </div>
            </div>

            {/* Calibrated Bottom Pre-Printed Margin Spacer */}
            {letterheadMode === "preprinted" && (
              <div 
                style={{ height: `${bottomMarginMm}mm` }} 
                className="w-full relative transition-all flex items-center justify-center print:border-none mt-4"
              >
                {showPaperGuideSilhouette && (
                  <div className="print:hidden absolute inset-x-0 inset-y-1 border-2 border-dashed border-black/[0.12] dark:border-white/[0.12] rounded-xl bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-center text-center p-1">
                    <span className="text-[10px] text-[#86868B] font-medium">
                      Pre-Printed Letterhead Footer Reserved Space ({bottomMarginMm} mm / {(bottomMarginMm / 25.4).toFixed(1)}″)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WHATSAPP PDF PRESCRIPTION DISPATCH MODAL */}
          {showWhatsAppDispatchModal && signedPrescription && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-150">
              <div className="w-full max-w-xl rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-modal space-y-4">
                <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                      <Send className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                        WhatsApp PDF Prescription Dispatch
                      </h3>
                      <p className="text-[10px] text-[#86868B]">
                        Instant delivery of official digital Rx with vector PDF viewer
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWhatsAppDispatchModal(false)}
                    className="rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Recipient Target Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#86868B] block">
                    Deliver Prescription To:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "patient", label: "Patient", desc: patient.name },
                      { id: "attendant", label: "Attendant / Relative", desc: "Guardian" },
                      { id: "chemist", label: "Partner Chemist", desc: "Empanelled Network" },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setDispatchRecipientType(r.id as any);
                          if (r.id === "patient") setDispatchPhone(patient.phone);
                          if (r.id === "chemist") setDispatchTemplate("chemist_order");
                        }}
                        className={`rounded-xl p-2.5 text-left border transition ${
                          dispatchRecipientType === r.id
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold"
                            : "border-black/[0.06] dark:border-white/[0.08] bg-[#ECEEF2]/40 dark:bg-white/[0.02] text-[#86868B]"
                        }`}
                      >
                        <div className="text-xs">{r.label}</div>
                        <div className="text-[10px] font-normal truncate opacity-80">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Phone & Optional Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-[#86868B] block">
                      Recipient WhatsApp Mobile Number
                    </label>
                    <input
                      type="text"
                      value={dispatchPhone}
                      onChange={e => setDispatchPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2.5 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  {dispatchRecipientType === "attendant" && (
                    <div>
                      <label className="text-[11px] font-semibold text-[#86868B] block">
                        Attendant / Relative Name
                      </label>
                      <input
                        type="text"
                        value={dispatchAttendantName}
                        onChange={e => setDispatchAttendantName(e.target.value)}
                        placeholder="e.g. Ramesh Rawat (Father)"
                        className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2.5 font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  )}
                </div>

                {/* Template Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868B] block">
                    Message Content Template:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "standard", title: "Standard Clinical", badge: "Official Rx" },
                      { id: "bilingual_hindi", title: "Hindi + English", badge: "🇮🇳 मरीज निर्देश" },
                      { id: "chemist_order", title: "Chemist Order", badge: "💊 Express Pickup" }
                    ].map(tmpl => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setDispatchTemplate(tmpl.id as any)}
                        className={`rounded-xl p-2.5 text-left border transition ${
                          dispatchTemplate === tmpl.id
                            ? "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold"
                            : "border-black/[0.06] dark:border-white/[0.08] text-[#86868B]"
                        }`}
                      >
                        <div>{tmpl.title}</div>
                        <div className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400 mt-0.5">{tmpl.badge}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Doctor Note */}
                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block">
                    Custom Doctor / Clinic Note (Optional):
                  </label>
                  <input
                    type="text"
                    value={dispatchCustomNote}
                    onChange={e => setDispatchCustomNote(e.target.value)}
                    placeholder="e.g., Please apply gel strictly at bedtime; come for review in 7 days."
                    className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Save Local PDF</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowWhatsAppDispatchModal(false)}
                      className="rounded-full border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-xs font-semibold text-[#86868B]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isDispatching}
                      onClick={handleExecuteWhatsAppDispatch}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isDispatching ? (
                        <>
                          <RotateCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Open WhatsApp & Send PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Print Stylesheet for Physical Letterhead Margins */}
          <style jsx global>{`
            @media print {
              @page {
                size: ${rxPaperFormat === "a5" ? "A5 portrait" : "A4 portrait"};
                margin-top: ${letterheadMode === "preprinted" ? `${topMarginMm}mm` : "12mm"} !important;
                margin-bottom: ${letterheadMode === "preprinted" ? `${bottomMarginMm}mm` : "12mm"} !important;
                margin-left: ${letterheadMode === "preprinted" ? `${sideMarginMm}mm` : "15mm"} !important;
                margin-right: ${letterheadMode === "preprinted" ? `${sideMarginMm}mm` : "15mm"} !important;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>
        </div>
      ) : (

        /* ================= DRAFTING CONSULTATION STUDIO ================= */
        <div className="space-y-5">
          {/* DRUG ALLERGY WARNING BANNER */}
          {patient.allergies && !patient.allergies.toLowerCase().includes("no known drug") && (
            <div className="rounded-[22px] border-2 border-red-500/50 bg-red-500/10 dark:bg-red-950/40 p-4 text-xs font-semibold text-red-700 dark:text-red-300 flex items-center justify-between shadow-apple-sm animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="h-5 w-5 text-red-600 flex-shrink-0 animate-pulse" />
                <div>
                  <div className="font-bold text-sm text-red-800 dark:text-red-200">
                    ⚠️ CLINICAL DRUG ALLERGY RECORDED: {patient.allergies}
                  </div>
                  <div className="text-[11px] text-red-700/90 dark:text-red-300/80 mt-0.5">
                    High-risk cross-sensitivity radar is active. Beta-lactams & high-risk triggers will be evaluated on sign.
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider flex-shrink-0">
                Safety Locked
              </span>
            </div>
          )}

          {/* CLINICAL MEMORY: RETURNING PATIENT RECORD (HISTORY ALREADY VISIBLE) */}
          {lastClinicalVisit && (
            <div className="rounded-[28px] border border-apple-blue/20 bg-gradient-to-r from-apple-blue/[0.06] via-indigo-500/[0.04] to-purple-500/[0.04] dark:from-apple-blue/15 dark:to-purple-950/20 p-5 shadow-apple-card space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-apple-blue/15 text-apple-blue dark:text-sky-300 flex-shrink-0">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-apple-blue dark:text-sky-400">
                        🔁 Clinical Memory: Returning Patient Record
                      </span>
                      <span className="rounded-full bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue dark:text-sky-300 text-[10px] font-bold px-2.5 py-0.5 border border-apple-blue/20">
                        Prior Visit: {lastClinicalVisit.visit_date}
                      </span>
                      <span className="text-[10px] text-[#86868B]">
                        by {lastClinicalVisit.doctor_name}
                      </span>
                      {patientHistory?.total_visits && (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 font-mono">
                          {patientHistory.total_visits} Total Visits
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-white mt-1">
                      Prior Diagnosis: {lastClinicalVisit.provisional_diagnosis || "General Outpatient Assessment"}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#86868B] flex-wrap">
                      {lastClinicalVisit.vitals && (
                        <span className="font-mono bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded text-[10px]">
                          Baseline: BP {lastClinicalVisit.vitals.bp || "120/80"} • Pulse {lastClinicalVisit.vitals.pulse || "76"} • Wt {lastClinicalVisit.vitals.weight || "60"}kg
                        </span>
                      )}
                      <span>Past Meds:</span>
                      {lastClinicalVisit.medications_summary?.map((m: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-white/10 font-mono text-[10px] text-[#1D1D1F] dark:text-gray-200 border border-black/[0.05] dark:border-white/[0.08]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => clonePreviousRx(false)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 text-xs font-bold shadow-apple-sm transition active:scale-95 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>🔄 Reuse Previous Rx</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => clonePreviousRx(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.1] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] px-3.5 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer"
                    title="Clone prescription with 30-day extended duration for chronic refill"
                  >
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span>📅 Extend 30 Days</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT: CLINICAL INPUTS & EXAMINATIONS */}
          <div className="lg:col-span-4 space-y-6">
            {/* Vitals Recording - Upgraded Quick-Pad with Safety Radar */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-apple-blue" /> Vitals Quick-Pad & Radar
                </h2>
                {bpStatus && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${bpStatus.badgeClass}`}>
                    {bpStatus.label}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* Blood Pressure */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#86868B]">BP (mmHg)</label>
                    <HeartPulse className="h-3 w-3 text-red-500" />
                  </div>
                  <input
                    type="text"
                    value={vitals.bp}
                    onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                    placeholder="120/80"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Pulse */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#86868B]">Pulse (bpm)</label>
                    {pulseStatus && <span className={`text-[10px] ${pulseStatus.badgeClass}`}>{pulseStatus.label}</span>}
                  </div>
                  <input
                    type="text"
                    value={vitals.pulse}
                    onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                    placeholder="72"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* SpO2 */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#86868B]">SpO2 (%)</label>
                    {spo2Status && <span className={`text-[10px] ${spo2Status.badgeClass}`}>{spo2Status.label}</span>}
                  </div>
                  <input
                    type="text"
                    value={vitals.spo2}
                    onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                    placeholder="98"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Temp */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#86868B]">Temp (°F)</label>
                    <Flame className="h-3 w-3 text-orange-500" />
                  </div>
                  <input
                    type="text"
                    value={vitals.temp}
                    onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                    placeholder="98.6"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="font-semibold text-[#86868B]">Height (cm)</label>
                  <input
                    type="text"
                    value={vitals.height}
                    onChange={e => setVitals({ ...vitals, height: e.target.value })}
                    placeholder="165"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="font-semibold text-[#86868B]">Weight (kg)</label>
                  <input
                    type="text"
                    value={vitals.weight}
                    onChange={e => setVitals({ ...vitals, weight: e.target.value })}
                    placeholder="60"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>

                {/* Blood Sugar */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#86868B]">Random Blood Sugar (mg/dL)</label>
                    {sugarStatus && <span className={`text-[10px] ${sugarStatus.badgeClass}`}>{sugarStatus.label}</span>}
                  </div>
                  <input
                    type="text"
                    value={vitals.sugar}
                    onChange={e => setVitals({ ...vitals, sugar: e.target.value })}
                    placeholder="98"
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
              </div>

              {/* Real-time BMI pill */}
              {calculatedBmi && (
                <div className="rounded-xl border p-2.5 flex items-center justify-between text-xs bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.04] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[#0071E3]" />
                    <span className="text-[#86868B]">Calculated BMI:</span>
                    <strong className="font-mono text-sm">{calculatedBmi.val} kg/m²</strong>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${calculatedBmi.badgeClass}`}>
                    {calculatedBmi.category}
                  </span>
                </div>
              )}
            </div>

            {/* Chief Complaints & Diagnosis with 1-Click Clinical Protocols */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  Diagnosis & Examination
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProtocolDrawer(!showProtocolDrawer)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/20 transition active:scale-95 cursor-pointer"
                >
                  <Zap className="h-3 w-3 fill-[#0071E3]" />
                  <span>{showProtocolDrawer ? "Hide Protocols" : "⚡ Load Protocol"}</span>
                </button>
              </div>

              {/* Protocol Quick Chips Drawer */}
              {showProtocolDrawer && (
                <div className="rounded-2xl border border-[#0071E3]/20 bg-[#0071E3]/5 dark:bg-[#0071E3]/10 p-3.5 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#0071E3] uppercase tracking-wider">
                      Standard OPD Protocols (1-Tap Auto Fill)
                    </span>
                    <span className="text-[10px] text-[#86868B]">{CLINICAL_DIAGNOSIS_PROTOCOLS.length} Templates</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {CLINICAL_DIAGNOSIS_PROTOCOLS.map(proto => (
                      <div
                        key={proto.id}
                        onClick={() => applyDiagnosisProtocol(proto)}
                        className="p-2 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] hover:border-[#0071E3] cursor-pointer transition flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                            <span>{proto.diagnosis_name}</span>
                            <span className="text-[10px] text-[#86868B] font-mono">[{proto.icd10_code}]</span>
                          </div>
                          <div className="text-[10px] text-[#86868B]">
                            {proto.medications.length} Meds • {proto.recommended_lab_test_ids.length} Labs • Review {proto.followup_days}d
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-lg flex-shrink-0">
                          1-Tap Apply
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            {/* 🔁 REPEAT PATIENT HISTORY & 1-CLICK PAST VISIT CLONE BAR */}
            {lastClinicalVisit && lastClinicalVisit.medications_summary && lastClinicalVisit.medications_summary.length > 0 && (
              <div className="rounded-[28px] border border-apple-blue/20 bg-gradient-to-r from-apple-blue/[0.06] via-indigo-500/[0.04] to-purple-500/[0.04] dark:from-apple-blue/15 dark:to-purple-950/20 p-5 shadow-apple-card space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-apple-blue/15 text-apple-blue dark:text-sky-300 flex-shrink-0">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-apple-blue dark:text-sky-400">
                          🔁 Returning Patient History Detected
                        </span>
                        <span className="rounded-full bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue dark:text-sky-300 text-[10px] font-bold px-2.5 py-0.5 border border-apple-blue/20">
                          Last Visit: {lastClinicalVisit.visit_date}
                        </span>
                        <span className="text-[10px] text-[#86868B]">
                          by {lastClinicalVisit.doctor_name}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[#1D1D1F] dark:text-white mt-1">
                        Prior Diagnosis: {lastClinicalVisit.provisional_diagnosis || "General Consultation"}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#86868B] flex-wrap">
                        <span>Past Meds:</span>
                        {lastClinicalVisit.medications_summary?.map((m: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-white/10 font-mono text-[10px] text-[#1D1D1F] dark:text-gray-200 border border-black/[0.05] dark:border-white/[0.08]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => clonePreviousRx(false)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] text-white px-4 py-2 text-xs font-bold shadow-apple-sm transition active:scale-95 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span>⚡ Repeat Last Rx</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => clonePreviousRx(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.1] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] px-3.5 py-2 text-xs font-semibold transition active:scale-95 cursor-pointer"
                      title="Clone prescription with 30-day extended duration for chronic refill"
                    >
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>📅 Extend 30 Days</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 1-TAP DOCTOR RX COMBOS CARD PANEL */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 sm:p-6 shadow-apple-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <Zap className="h-5 w-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                        ⚡ 1-Tap Doctor Rx Combos
                      </h2>
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5">
                        &lt;15s Prescribing
                      </span>
                    </div>
                    <p className="text-[11px] text-[#86868B]">
                      1-Click drug packs for 80% recurring OPD cases. Auto-fills medicines, frequencies & Hindi instructions.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSaveComboModal(true)}
                  disabled={prescribedItems.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 disabled:opacity-40 self-start sm:self-auto"
                >
                  <BookmarkPlus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>★ Save Current as My Combo</span>
                </button>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {(["All", "Dermatology", "General Medicine", "Dental", "Pediatrics", "Custom"] as const).map(cat => {
                  const count = cat === "All" 
                    ? allAvailableCombos.length 
                    : cat === "Custom" 
                      ? customCombos.length 
                      : allAvailableCombos.filter(c => c.specialty === cat).length;
                  const isSelected = selectedComboFilter === cat;

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedComboFilter(cat)}
                      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition active:scale-95 flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-apple-blue text-white shadow-apple-sm"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                      }`}
                    >
                      <span>{cat === "Custom" ? "★ My Saved" : cat}</span>
                      <span className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected ? "bg-white/20 text-white" : "bg-black/[0.06] dark:bg-white/[0.1]"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Combos Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
                {filteredCombos.map(combo => (
                  <div
                    key={combo.id}
                    className="group relative rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-white dark:hover:bg-[#2C2C2E] p-3.5 transition-all hover:shadow-apple-sm flex flex-col justify-between space-y-2.5 hover:border-apple-blue/30"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${combo.badgeColor || "bg-blue-100 text-blue-700"}`}>
                          {combo.tag}
                        </span>
                        <div className="flex items-center gap-1">
                          {combo.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomCombo(combo.id, e)}
                              className="text-[#86868B] hover:text-red-600 transition p-0.5"
                              title="Delete this custom preset"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          <span className="text-[10px] text-[#86868B] font-mono">
                            {combo.medicines.length} Drugs
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs text-[#1D1D1F] dark:text-white line-clamp-1 group-hover:text-apple-blue transition-colors">
                        {combo.title}
                      </h4>

                      <div className="text-[11px] text-[#86868B] line-clamp-2 mt-1">
                        {combo.medicines.map(m => m.medicine_name).join(" + ")}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                      <span className="text-[10px] text-[#86868B] italic truncate max-w-[110px]">
                        {combo.specialty}
                      </span>
                      <button
                        type="button"
                        onClick={() => applyRxCombo(combo)}
                        className="inline-flex items-center gap-1 rounded-xl bg-apple-blue hover:bg-[#0077ED] text-white px-2.5 py-1 text-[11px] font-semibold shadow-apple-sm active:scale-95 transition"
                      >
                        <Zap className="h-3 w-3 fill-white" />
                        <span>1-Tap Apply</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-card space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4 gap-3">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Pill className="h-5 w-5 text-apple-blue" />
                    Digital Prescription Builder (NMC Compliant)
                  </h2>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Search 500+ Indian medicines by brand or generic molecule name
                  </p>
                </div>

                {/* Regional Language Directions Toggle */}
                <div className="flex items-center gap-1 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/30 p-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLanguageMode("en")}
                    className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                      languageMode === "en"
                        ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                        : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguageMode("bilingual")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                      languageMode === "bilingual"
                        ? "bg-white text-apple-blue shadow-sm dark:bg-[#2C2C2E] dark:text-sky-300"
                        : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    <Globe className="h-3 w-3" />
                    <span>🇮🇳 English + हिन्दी</span>
                    <span className="rounded-full bg-apple-teal/15 text-apple-teal dark:text-[#30D1BE] text-[9px] font-bold px-1.5 py-0.2">
                      Rec
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguageMode("hi")}
                    className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
                      languageMode === "hi"
                        ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                        : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    🇮🇳 हिन्दी
                  </button>
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

              {/* 1. CLINICAL SAFETY & DDI RADAR BANNER */}
              {safetyReport.total_alerts > 0 ? (
                <div className={`rounded-2xl p-4 border transition-all ${
                  safetyReport.severe_alerts > 0 
                    ? "bg-red-500/10 border-red-500/30 text-red-950 dark:text-red-200" 
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-red-500/15 dark:border-red-500/20">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertOctagon className={`h-5 w-5 ${safetyReport.severe_alerts > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`} />
                      <span>
                        {safetyReport.severe_alerts > 0 
                          ? `Severe Clinical Contraindication (${safetyReport.severe_alerts} Alert${safetyReport.severe_alerts > 1 ? 's' : ''})`
                          : `Clinical Caution: Drug Interaction Detected (${safetyReport.moderate_alerts})`}
                      </span>
                    </div>
                    <span className="rounded-full bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      Pharmacopeia Alert
                    </span>
                  </div>

                  <div className="space-y-3">
                    {safetyReport.alerts.map((alert, aIdx) => (
                      <div key={aIdx} className="rounded-xl bg-white/90 dark:bg-black/50 p-3.5 border border-black/[0.04] dark:border-white/[0.08] text-xs space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4 text-red-500" />
                            {alert.title}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                            alert.severity === "SEVERE" 
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}>
                            {alert.severity}
                          </span>
                        </div>

                        <p className="text-[#515154] dark:text-[#A1A1A6] text-[11.5px] leading-relaxed">
                          {alert.description}
                        </p>

                        <div className="rounded-lg bg-red-500/5 dark:bg-red-500/15 border border-red-500/15 p-2 text-[11px] text-red-800 dark:text-red-300">
                          <strong>Clinical Recommendation:</strong> {alert.clinical_advice}
                        </div>

                        {alert.drug_b && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const offending = prescribedItems.find(p => 
                                  p.generic_name.toUpperCase().includes(alert.drug_b!) || 
                                  p.medicine_name.toUpperCase().includes(alert.drug_b!)
                                );
                                if (offending) removeMedicine(offending.id);
                              }}
                              className="rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold px-3 py-1 shadow-sm transition active:scale-95"
                            >
                              Remove Conflicting Drug ({alert.drug_b})
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold">Clinical Safety Radar:</span>
                    <span>All {prescribedItems.length} medications verified safe against allergies & known drug interactions.</span>
                  </div>
                  <span className="rounded-full bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                    VERIFIED SAFE
                  </span>
                </div>
              )}

              {/* 2. JAN AUSHADHI GENERIC SAVINGS SUMMARY */}
              {totalGenericSavings.count > 0 && (
                <div className="rounded-2xl bg-emerald-600/10 border border-emerald-500/20 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Jan Aushadhi Generic Cost Advantage: </span>
                      <span>Patient will save approximately <strong className="text-emerald-700 dark:text-emerald-300 font-bold">₹{totalGenericSavings.saved} ({totalGenericSavings.pct}% savings)</strong> across {totalGenericSavings.count} medicine(s) by opting for generic molecules.</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-1 whitespace-nowrap self-start sm:self-auto shadow-sm">
                    PMBJP Generic Compliant
                  </span>
                </div>
              )}

              {/* PRESCRIBED MEDICINES LIST */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  Prescription Items ({prescribedItems.length})
                </div>

                {prescribedItems.map((item, idx) => {
                  const hindiDirections = translateDirectionsToHindi(item.frequency, item.duration, item.special_instructions);
                  const janAushadhiComp = getJanAushadhiSavings(item.generic_name, item.medicine_name);

                  return (
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
                          {janAushadhiComp && (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              <span>Jan Aushadhi Generic Alternative: <strong>₹{janAushadhiComp.generic_mrp}</strong> vs Branded MRP ₹{janAushadhiComp.brand_mrp} (Save {janAushadhiComp.savings_percentage}%)</span>
                            </div>
                          )}
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
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#86868B]">Dosage Frequency</label>
                            <div className="flex items-center gap-1">
                              {["1-0-1", "1-0-0", "0-0-1", "1-1-1", "SOS"].map(freq => (
                                <button
                                  key={freq}
                                  type="button"
                                  onClick={() => {
                                    const updated = prescribedItems.map(p => p.id === item.id ? { ...p, frequency: `${freq} (After Food)` } : p);
                                    setPrescribedItems(updated);
                                  }}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white hover:bg-apple-blue hover:text-white transition cursor-pointer"
                                >
                                  {freq}
                                </button>
                              ))}
                            </div>
                          </div>
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
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#86868B]">Duration</label>
                            <div className="flex items-center gap-1">
                              {["3 Days", "5 Days", "7 Days", "14 Days", "30 Days"].map(dur => (
                                <button
                                  key={dur}
                                  type="button"
                                  onClick={() => {
                                    const updated = prescribedItems.map(p => p.id === item.id ? { ...p, duration: dur } : p);
                                    setPrescribedItems(updated);
                                  }}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white hover:bg-apple-blue hover:text-white transition cursor-pointer"
                                >
                                  {dur.replace(" Days", "d")}
                                </button>
                              ))}
                            </div>
                          </div>
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
                          <div className="flex items-center justify-between">
                            <label className="font-semibold text-[#86868B]">Instructions / Timing</label>
                            <div className="flex items-center gap-1">
                              {["After Food", "Before Food", "At Bedtime", "With Warm Water"].map(timing => (
                                <button
                                  key={timing}
                                  type="button"
                                  onClick={() => {
                                    const updated = prescribedItems.map(p => p.id === item.id ? { ...p, special_instructions: timing } : p);
                                    setPrescribedItems(updated);
                                  }}
                                  className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white hover:bg-apple-blue hover:text-white transition cursor-pointer"
                                >
                                  {timing}
                                </button>
                              ))}
                            </div>
                          </div>
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

                      {/* Regional Hindi Direction Card */}
                      {languageMode !== "en" && (
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-950 dark:text-amber-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5 text-amber-600" />
                              🇮🇳 मरीज के लिए खुराक निर्देश (Hindi Directions):
                            </span>
                            <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">Auto-translated for patient compliance</span>
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-[12px]">
                            {hindiDirections.frequency_hi} • {hindiDirections.duration_hi}
                          </div>
                          {hindiDirections.instructions_hi && (
                            <div className="text-[11px] text-amber-800/90 dark:text-amber-300">
                              सलाह: {hindiDirections.instructions_hi}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 text-xs text-[#86868B]">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>₹{patientFee} Bill &amp; UPI QR Auto-Attached</span>
                  </div>
                  <span>•</span>
                  <span>SHA-256 Activated</span>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Standard Sign & Review */}
                  <button
                    type="button"
                    onClick={handleSignPrescription}
                    disabled={isSigning || isSavingAndNext}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-black/[0.1] dark:border-white/[0.15] bg-white dark:bg-[#2C2C2E] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] px-5 py-3 text-xs font-bold text-[#1D1D1F] dark:text-white shadow-sm active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="h-4 w-4 text-apple-blue" />
                    <span>Sign &amp; Review Rx</span>
                  </button>

                  {/* ⚡ SAVE & NEXT PATIENT (Continuous Clinic Loop) */}
                  <button
                    type="button"
                    onClick={handleSaveAndNext}
                    disabled={isSigning || isSavingAndNext}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 px-6 py-3 text-xs font-bold text-white shadow-apple-md active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                    title="Sign prescription, record ₹500 bill, dispatch WhatsApp, and call next patient (Ctrl + Enter)"
                  >
                    {isSavingAndNext ? (
                      <>
                        <RotateCw className="h-4 w-4 animate-spin" />
                        <span>Saving, Dispatching &amp; Calling Next...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-white text-white" />
                        <span>⚡ Save &amp; Next Patient ➔</span>
                        <span className="rounded bg-white/20 px-1.5 py-0.2 text-[10px] font-mono text-white/90">
                          Ctrl + ↵
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Floating Transition Modal for Next Patient (Zero Interruption) */}
      {nextPatientNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-[28px] border border-emerald-500/30 shadow-apple-modal text-center space-y-4 max-w-sm w-full mx-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Prescription Signed &amp; Dispatched!</h3>
              <p className="text-xs text-[#86868B] mt-1">₹{patientFee} Bill created &amp; auto-recorded in clinic EOD ledger.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-apple-blue/10 border border-apple-blue/20">
              <div className="text-[10px] font-bold text-apple-blue uppercase tracking-wider">Calling Next Patient</div>
              <div className="text-lg font-black text-[#1D1D1F] dark:text-white mt-0.5">
                Token #{nextPatientNotice.token} • {nextPatientNotice.name}
              </div>
            </div>
            <div className="text-[11px] text-[#86868B] flex items-center justify-center gap-1.5 animate-pulse">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-apple-blue" />
              <span>Opening Consultation Studio...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
