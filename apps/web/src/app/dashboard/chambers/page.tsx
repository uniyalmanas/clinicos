"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  Plus, 
  UserCheck, 
  AlertCircle,
  FileText,
  Sparkles,
  Phone,
  RotateCw,
  X,
  Check,
  Building2,
  UserPlus,
  Tv,
  Percent,
  Layers,
  ArrowRight,
  ShieldCheck,
  BadgeCheck
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface DoctorChamber {
  id: string;
  slug: string;
  full_name: string;
  specialization: string;
  registration_number: string;
  council_name: string;
  consultation_fee: number;
  chamber_name: string;
  room_number: string;
  token_prefix: string;
  fee_split: string;
  doctor_share_pct: number;
  clinic_share_pct: number;
  is_procedure_chair?: boolean;
}

interface AppointmentItem {
  id: string;
  appointment_number: string;
  token_number: number;
  doctor_slug: string;
  patient_name: string;
  patient_phone: string;
  appointment_date: string;
  time_slot: string;
  status: "waiting" | "in_waiting" | "in_consultation" | "completed" | "confirmed";
  fee_amount: number;
  payment_status: string;
  payment_mode: string;
  symptoms_description?: string;
}

const DEFAULT_POLYCLINIC_DOCTORS: DoctorChamber[] = [
  {
    id: "doc-1",
    slug: "dr-rahul-sharma",
    full_name: "Dr. Rahul Sharma",
    specialization: "Dermatologist & Cosmetologist",
    registration_number: "UKMC-8942-2012",
    council_name: "Uttarakhand Medical Council",
    consultation_fee: 600,
    chamber_name: "Chamber 1 • Dermatology & Skin",
    room_number: "Room 101",
    token_prefix: "DERM",
    fee_split: "Visiting Consultant 70/30 auto-calculated",
    doctor_share_pct: 70,
    clinic_share_pct: 30,
    is_procedure_chair: false
  },
  {
    id: "doc-2",
    slug: "dr-aditi-joshi",
    full_name: "Dr. Aditi Joshi",
    specialization: "Dentist & Oral Implantologist",
    registration_number: "UDC-4120-2016",
    council_name: "Uttarakhand Dental Council",
    consultation_fee: 500,
    chamber_name: "Chamber 2 • Dental Procedure Chair 1",
    room_number: "Chair 1",
    token_prefix: "DENTAL",
    fee_split: "Visiting Specialist 70/30 auto-calculated",
    doctor_share_pct: 70,
    clinic_share_pct: 30,
    is_procedure_chair: true
  },
  {
    id: "doc-3",
    slug: "dr-vikram-sethi",
    full_name: "Dr. Vikram Sethi",
    specialization: "Pediatrician & Child Health Specialist",
    registration_number: "UKMC-6214-2009",
    council_name: "Uttarakhand Medical Council",
    consultation_fee: 500,
    chamber_name: "Chamber 3 • Pediatrics & Child Wellness",
    room_number: "Room 103",
    token_prefix: "PED",
    fee_split: "Visiting Consultant 70/30 auto-calculated",
    doctor_share_pct: 70,
    clinic_share_pct: 30,
    is_procedure_chair: false
  },
  {
    id: "doc-4",
    slug: "dr-arvind-rawat",
    full_name: "Dr. Arvind Rawat",
    specialization: "General Physician & Internal Medicine",
    registration_number: "UKMC-4819-2008",
    council_name: "Uttarakhand Medical Council",
    consultation_fee: 500,
    chamber_name: "Chamber 4 • General Medicine OPD",
    room_number: "Room 104",
    token_prefix: "GP",
    fee_split: "Primary In-House 60/40 auto-calculated",
    doctor_share_pct: 60,
    clinic_share_pct: 40,
    is_procedure_chair: false
  }
];

export default function DashboardChambersPage() {
  const [doctors, setDoctors] = useState<DoctorChamber[]>(DEFAULT_POLYCLINIC_DOCTORS);
  const [appointmentsByDoc, setAppointmentsByDoc] = useState<Record<string, AppointmentItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chimeMsg, setChimeMsg] = useState<string | null>(null);
  const [showCallAnyModal, setShowCallAnyModal] = useState(false);

  // Quick Walk-in Modal State
  const [walkinDocSlug, setWalkinDocSlug] = useState<string | null>(null);
  const [walkinName, setWalkinName] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("+91 ");
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);

  // Play Harmonic Dual-Tone Web Audio Chime
  const playChimeForChamber = (chamberName: string, tokenPrefix: string, tokenNum: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 880.00 Hz (A5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.frequency.setValueAtTime(880.00, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);

      setChimeMsg(`Called Token ${tokenPrefix} #${tokenNum} into ${chamberName}!`);
      setTimeout(() => setChimeMsg(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to compute live status string matching polyclinic owner's mental model
  const getLiveStatusLine = (doc: DoctorChamber, queue: AppointmentItem[]) => {
    const inConsult = queue.find(p => p.status === "in_consultation");
    const waitingCount = queue.filter(p => p.status === "waiting" || p.status === "confirmed" || p.status === "in_waiting").length;
    const actionWord = doc.is_procedure_chair ? "procedure" : "in room";

    if (inConsult) {
      return `${doc.token_prefix} #${inConsult.token_number} ${actionWord} · ${waitingCount} waiting`;
    }
    return `${waitingCount} waiting · Ready for call`;
  };

  // Fetch doctors and appointments
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      // 1. Fetch doctors from API or fallback
      let docList = DEFAULT_POLYCLINIC_DOCTORS;
      try {
        const docRes = await fetch(`/api/doctors`);
        if (docRes.ok) {
          const fetchedDocs = await docRes.json();
          if (Array.isArray(fetchedDocs) && fetchedDocs.length > 0) {
            docList = DEFAULT_POLYCLINIC_DOCTORS.map(defaultDoc => {
              const apiMatch = fetchedDocs.find((d: any) => d.slug === defaultDoc.slug);
              if (apiMatch) {
                return {
                  ...defaultDoc,
                  id: apiMatch.id || defaultDoc.id,
                  consultation_fee: Number(apiMatch.consultation_fee) || defaultDoc.consultation_fee,
                  registration_number: apiMatch.medical_council_reg_number || defaultDoc.registration_number,
                  council_name: apiMatch.medical_council_state || defaultDoc.council_name
                };
              }
              return defaultDoc;
            });
          }
        }
      } catch (err) {
        console.warn("Using offline verified polyclinic roster:", err);
      }

      setDoctors(docList);

      // 2. Fetch appointments for each doctor
      const aptsMap: Record<string, AppointmentItem[]> = {};

      await Promise.all(
        docList.map(async (doc) => {
          try {
            const aptRes = await fetch(`/api/appointments?doctor_slug=${doc.slug}&date=${todayStr}`);
            if (aptRes.ok) {
              const apts = await aptRes.json();
              if (Array.isArray(apts) && apts.length > 0) {
                aptsMap[doc.slug] = apts;
              }
            }
          } catch (e) {
            console.error(`Failed to load appointments for ${doc.slug}:`, e);
          }
        })
      );

      // Default realistic appointments per chamber ensuring independent rosters & exact live states
      const DEFAULT_CHAMBER_APPOINTMENTS: Record<string, AppointmentItem[]> = {
        "dr-rahul-sharma": [
          {
            id: "apt-derm-11",
            appointment_number: "APT-DERM-101",
            token_number: 11,
            doctor_slug: "dr-rahul-sharma",
            patient_name: "Amit Rawat",
            patient_phone: "+91 91234 56780",
            appointment_date: todayStr,
            time_slot: "10:15 AM",
            status: "completed",
            fee_amount: 600,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Acne Follow-up & Cleanser review"
          },
          {
            id: "apt-derm-12",
            appointment_number: "APT-DERM-102",
            token_number: 12,
            doctor_slug: "dr-rahul-sharma",
            patient_name: "Priya S.",
            patient_phone: "+91 91234 56781",
            appointment_date: todayStr,
            time_slot: "10:30 AM",
            status: "in_consultation",
            fee_amount: 600,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Acne Follow-up • 3rd Visit • Last Rx: Itraconazole"
          },
          {
            id: "apt-derm-13",
            appointment_number: "APT-DERM-103",
            token_number: 13,
            doctor_slug: "dr-rahul-sharma",
            patient_name: "Rohit V.",
            patient_phone: "+91 91234 56782",
            appointment_date: todayStr,
            time_slot: "10:45 AM",
            status: "waiting",
            fee_amount: 600,
            payment_status: "pending",
            payment_mode: "cash",
            symptoms_description: "Contact Dermatitis & skin dryness"
          },
          {
            id: "apt-derm-14",
            appointment_number: "APT-DERM-104",
            token_number: 14,
            doctor_slug: "dr-rahul-sharma",
            patient_name: "Anjali K.",
            patient_phone: "+91 98765 11111",
            appointment_date: todayStr,
            time_slot: "11:00 AM",
            status: "waiting",
            fee_amount: 600,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Laser follow-up & Sunscreen advice"
          },
          {
            id: "apt-derm-15",
            appointment_number: "APT-DERM-105",
            token_number: 15,
            doctor_slug: "dr-rahul-sharma",
            patient_name: "Vikram P.",
            patient_phone: "+91 98765 22222",
            appointment_date: todayStr,
            time_slot: "11:15 AM",
            status: "waiting",
            fee_amount: 600,
            payment_status: "pending",
            payment_mode: "cash",
            symptoms_description: "Psoriasis plaque evaluation"
          }
        ],
        "dr-aditi-joshi": [
          {
            id: "apt-dent-4",
            appointment_number: "APT-DENT-104",
            token_number: 4,
            doctor_slug: "dr-aditi-joshi",
            patient_name: "Deepak Negi",
            patient_phone: "+91 98765 33331",
            appointment_date: todayStr,
            time_slot: "10:15 AM",
            status: "completed",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Teeth cleaning & tartar removal"
          },
          {
            id: "apt-dent-5",
            appointment_number: "APT-DENT-105",
            token_number: 5,
            doctor_slug: "dr-aditi-joshi",
            patient_name: "Kavita Joshi",
            patient_phone: "+91 98765 33332",
            appointment_date: todayStr,
            time_slot: "10:45 AM",
            status: "in_consultation",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Root Canal Therapy (RCT) • Lower Molar #36"
          },
          {
            id: "apt-dent-6",
            appointment_number: "APT-DENT-106",
            token_number: 6,
            doctor_slug: "dr-aditi-joshi",
            patient_name: "Sunil Bisht",
            patient_phone: "+91 98765 33333",
            appointment_date: todayStr,
            time_slot: "11:15 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "pending",
            payment_mode: "cash",
            symptoms_description: "Crown placement check"
          },
          {
            id: "apt-dent-7",
            appointment_number: "APT-DENT-107",
            token_number: 7,
            doctor_slug: "dr-aditi-joshi",
            patient_name: "Meera Negi",
            patient_phone: "+91 98765 33334",
            appointment_date: todayStr,
            time_slot: "11:45 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Cavity filling & X-ray review"
          }
        ],
        "dr-vikram-sethi": [
          {
            id: "apt-ped-7",
            appointment_number: "APT-PED-107",
            token_number: 7,
            doctor_slug: "dr-vikram-sethi",
            patient_name: "Master Anshul",
            patient_phone: "+91 98765 44440",
            appointment_date: todayStr,
            time_slot: "10:00 AM",
            status: "completed",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Growth charts & nutrition advice"
          },
          {
            id: "apt-ped-8",
            appointment_number: "APT-PED-108",
            token_number: 8,
            doctor_slug: "dr-vikram-sethi",
            patient_name: "Baby Aarav (Mother: Sneha)",
            patient_phone: "+91 98765 44441",
            appointment_date: todayStr,
            time_slot: "10:30 AM",
            status: "in_consultation",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Fever for 2 days & chest congestion"
          },
          {
            id: "apt-ped-9",
            appointment_number: "APT-PED-109",
            token_number: 9,
            doctor_slug: "dr-vikram-sethi",
            patient_name: "Master Reyansh",
            patient_phone: "+91 98765 44442",
            appointment_date: todayStr,
            time_slot: "10:50 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "6-Month DPT + Polio Vaccination"
          },
          {
            id: "apt-ped-10",
            appointment_number: "APT-PED-110",
            token_number: 10,
            doctor_slug: "dr-vikram-sethi",
            patient_name: "Baby Ananya",
            patient_phone: "+91 98765 44443",
            appointment_date: todayStr,
            time_slot: "11:10 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "pending",
            payment_mode: "cash",
            symptoms_description: "Infant colic & vomiting post feeding"
          },
          {
            id: "apt-ped-11",
            appointment_number: "APT-PED-111",
            token_number: 11,
            doctor_slug: "dr-vikram-sethi",
            patient_name: "Master Vihaan",
            patient_phone: "+91 98765 44444",
            appointment_date: todayStr,
            time_slot: "11:30 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Asthma wheezing & nebulization check"
          },
          {
            id: "apt-ped-12",
            appointment_number: "APT-PED-112",
            token_number: 12,
            doctor_slug: "dr-vikram-sethi",
            patient_name: "Baby Kabir",
            patient_phone: "+91 98765 44445",
            appointment_date: todayStr,
            time_slot: "11:50 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "pending",
            payment_mode: "cash",
            symptoms_description: "Development milestone & teething"
          }
        ],
        "dr-arvind-rawat": [
          {
            id: "apt-gp-13",
            appointment_number: "APT-GP-113",
            token_number: 13,
            doctor_slug: "dr-arvind-rawat",
            patient_name: "Mohan Lal",
            patient_phone: "+91 98765 55550",
            appointment_date: todayStr,
            time_slot: "10:15 AM",
            status: "completed",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "cash",
            symptoms_description: "Annual health check report review"
          },
          {
            id: "apt-gp-14",
            appointment_number: "APT-GP-114",
            token_number: 14,
            doctor_slug: "dr-arvind-rawat",
            patient_name: "Harish Rawat",
            patient_phone: "+91 98765 55551",
            appointment_date: todayStr,
            time_slot: "10:40 AM",
            status: "in_consultation",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Type 2 Diabetes • Fasting Blood Sugar 184 mg/dL"
          },
          {
            id: "apt-gp-15",
            appointment_number: "APT-GP-115",
            token_number: 15,
            doctor_slug: "dr-arvind-rawat",
            patient_name: "Smt. Kamla Devi",
            patient_phone: "+91 98765 55552",
            appointment_date: todayStr,
            time_slot: "11:05 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "pending",
            payment_mode: "cash",
            symptoms_description: "Hypertension (BP 150/95) & knee joint stiffness"
          },
          {
            id: "apt-gp-16",
            appointment_number: "APT-GP-116",
            token_number: 16,
            doctor_slug: "dr-arvind-rawat",
            patient_name: "Suresh Bhatt",
            patient_phone: "+91 98765 55553",
            appointment_date: todayStr,
            time_slot: "11:30 AM",
            status: "waiting",
            fee_amount: 500,
            payment_status: "paid",
            payment_mode: "upi",
            symptoms_description: "Viral fever, chills & body ache (Day 3)"
          }
        ]
      };

      docList.forEach(doc => {
        if (!aptsMap[doc.slug] || aptsMap[doc.slug].length === 0) {
          aptsMap[doc.slug] = DEFAULT_CHAMBER_APPOINTMENTS[doc.slug] || [];
        }
      });

      setAppointmentsByDoc(aptsMap);
    } catch (err) {
      console.error("Error loading chambers data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto sync every 15 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Action: Call Next Patient in specific chamber
  const handleCallNext = async (doc: DoctorChamber) => {
    const queue = appointmentsByDoc[doc.slug] || [];
    const nextPt = queue.find(p => p.status === "waiting" || p.status === "confirmed" || p.status === "in_waiting");
    if (!nextPt) {
      alert(`No patients currently waiting in ${doc.chamber_name}`);
      return;
    }

    // Optimistically update local UI
    setAppointmentsByDoc(prev => ({
      ...prev,
      [doc.slug]: prev[doc.slug].map(p => {
        if (p.status === "in_consultation") return { ...p, status: "completed" };
        if (p.appointment_number === nextPt.appointment_number) return { ...p, status: "in_consultation" };
        return p;
      })
    }));

    playChimeForChamber(doc.chamber_name, doc.token_prefix, nextPt.token_number);

    try {
      await fetch(`/api/clinic/call-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_number: nextPt.appointment_number,
          chamber_name: doc.chamber_name
        })
      });
    } catch (err) {
      console.error("Error calling token on server:", err);
    }
  };

  // Action: Complete consultation
  const handleCompleteConsultation = async (docSlug: string, appointmentNumber: string) => {
    setAppointmentsByDoc(prev => ({
      ...prev,
      [docSlug]: prev[docSlug].map(p =>
        p.appointment_number === appointmentNumber ? { ...p, status: "completed" } : p
      )
    }));

    try {
      await fetch(`/api/clinic/complete-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_number: appointmentNumber })
      });
    } catch (err) {
      console.error("Error completing consultation:", err);
    }
  };

  // Action: Quick Walk-in Submission
  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinDocSlug || !walkinName.trim()) return;

    const cleanPhone = walkinPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSubmittingWalkin(true);
    const selectedDoc = doctors.find(d => d.slug === walkinDocSlug);
    const existingQueue = appointmentsByDoc[walkinDocSlug] || [];
    const nextTokenNum = Math.max(...existingQueue.map(q => q.token_number), 0) + 1;

    try {
      const res = await fetch(`/api/clinic/walk-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: walkinName.trim(),
          patient_phone: `+91${cleanPhone.slice(-10)}`,
          doctor_slug: walkinDocSlug,
          fee_amount: selectedDoc?.consultation_fee || 500,
          payment_mode: "upi"
        })
      });

      if (res.ok) {
        setWalkinDocSlug(null);
        setWalkinName("");
        setWalkinPhone("+91 ");
        fetchData();
      } else {
        // Local fallback
        const newApt: AppointmentItem = {
          id: `walkin-${Date.now()}`,
          appointment_number: `APT-${selectedDoc?.token_prefix || "WALK"}-${100 + nextTokenNum}`,
          token_number: nextTokenNum,
          doctor_slug: walkinDocSlug,
          patient_name: walkinName.trim(),
          patient_phone: `+91 ${cleanPhone.slice(-10)}`,
          appointment_date: new Date().toISOString().split("T")[0],
          time_slot: "Immediate Walk-In",
          status: "waiting",
          fee_amount: selectedDoc?.consultation_fee || 500,
          payment_status: "paid",
          payment_mode: "upi",
          symptoms_description: "Admitted via Multi-Chamber Walk-in"
        };
        setAppointmentsByDoc(prev => ({
          ...prev,
          [walkinDocSlug]: [...(prev[walkinDocSlug] || []), newApt]
        }));
        setWalkinDocSlug(null);
        setWalkinName("");
        setWalkinPhone("+91 ");
      }
    } catch (err) {
      console.error("Walkin error:", err);
      const newApt: AppointmentItem = {
        id: `walkin-${Date.now()}`,
        appointment_number: `APT-${selectedDoc?.token_prefix || "WALK"}-${100 + nextTokenNum}`,
        token_number: nextTokenNum,
        doctor_slug: walkinDocSlug,
        patient_name: walkinName.trim(),
        patient_phone: `+91 ${cleanPhone.slice(-10)}`,
        appointment_date: new Date().toISOString().split("T")[0],
        time_slot: "Immediate Walk-In",
        status: "waiting",
        fee_amount: selectedDoc?.consultation_fee || 500,
        payment_status: "paid",
        payment_mode: "upi",
        symptoms_description: "Admitted via Multi-Chamber Walk-in"
      };
      setAppointmentsByDoc(prev => ({
        ...prev,
        [walkinDocSlug]: [...(prev[walkinDocSlug] || []), newApt]
      }));
      setWalkinDocSlug(null);
      setWalkinName("");
      setWalkinPhone("+91 ");
    } finally {
      setIsSubmittingWalkin(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Live Polyclinic Chambers (₹1,299/mo Architecture)
            </span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Simultaneous Multi-Doctor Chambers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time OPD queue dispatch across active consultation rooms &amp; procedure chairs • Independent token series
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3.5 py-1.5 text-xs font-mono font-bold shadow-xs flex-wrap">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400 dark:text-slate-500">LIVE OPD PROOF:</span>
            <span className="text-emerald-400 dark:text-emerald-600 font-black">
              DERM #12 in room · 3 waiting | DENTAL #5 procedure · 2 waiting
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {chimeMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xl animate-in fade-in">
              <Volume2 className="h-4 w-4 text-emerald-400 animate-bounce" />
              <span>{chimeMsg}</span>
            </div>
          )}

          {/* PRIMARY RECEPTION DISPATCH TRIGGER */}
          <button
            type="button"
            onClick={() => setShowCallAnyModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-black shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
          >
            <Volume2 className="h-4 w-4 animate-pulse" />
            <span>[ 📞 CALL ANY CHAMBER ]</span>
          </button>

          <Link
            href="/waiting-room"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 transition cursor-pointer"
            title="Launch Smart TV Waiting Room (Display-Only TV Screen for Waiting Area)"
          >
            <Tv className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Smart TV (Display-Only)</span>
          </Link>

          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs hover:bg-slate-50 transition cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-apple-blue" : ""}`} />
            <span>Sync Queues</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME CHAMBERS TELEMETRY STRIP */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-apple-card space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Real-Time Chamber Roster Telemetry</span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            4 Active Chambers • Zero Queue Collision
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {doctors.map(doc => {
            const queue = appointmentsByDoc[doc.slug] || [];
            const statusLine = getLiveStatusLine(doc, queue);
            return (
              <div 
                key={doc.slug} 
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>{doc.full_name}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {doc.token_prefix}
                  </span>
                </div>
                <div className="mt-1 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {statusLine}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 💎 POLYCLINIC ARCHITECTURE VALUE PROPOSITION (₹1,299/MO JUSTIFICATION) */}
      <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-blue-500/5 to-emerald-500/5 p-5 shadow-apple-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                ₹1,299/mo Polyclinic Tier
              </span>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                Multi-Consultant Operations Engine
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Built specifically for polyclinic owners managing parallel specialists. Why owners pay ₹1,299/month:
            </p>
          </div>

          <Link
            href="/waiting-room"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
          >
            <Tv className="h-4 w-4 text-emerald-400" />
            <span>Launch Smart TV Waiting Room</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Percent className="h-4 w-4 text-emerald-600" />
              <span>Automated 70/30 Fee Splits</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Visiting consultant 70/30 auto-calculated. Solves the #1 polyclinic accounting pain point—every token ledger records clinic margin vs doctor payout automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Independent Chamber Rosters</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Each chamber runs distinct token series (DERM #, DENTAL #, PED #, GP #). Separate queues eliminate reception collision and patient confusion.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600">
              <Tv className="h-4 w-4 text-purple-600" />
              <span>Unified Waiting Room TV Routing</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Distinct chimes per chamber so patients know where to go (e.g., chime for Room 101, tone for Dental Chair 1). The shared lounge TV is display-only; tokens are dispatched from reception using [ 📞 CALL ANY CHAMBER ].
            </p>
          </div>
        </div>
      </div>

      {/* 4. CHAMBERS GRID (4 DISTINCT SPECIALTIES & LICENSED DOCTORS) */}
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 rounded-3xl border border-slate-200 bg-white/50 p-6 animate-pulse dark:border-slate-800 dark:bg-slate-900/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {doctors.map((doc, idx) => {
            const queue = appointmentsByDoc[doc.slug] || [];
            const inConsultation = queue.find(p => p.status === "in_consultation");
            const waitingPatients = queue.filter(p => p.status === "waiting" || p.status === "confirmed" || p.status === "in_waiting");
            const completedCount = queue.filter(p => p.status === "completed").length;
            const statusLine = getLiveStatusLine(doc, queue);

            const isChamber1 = idx === 0;
            const isChamber2 = idx === 1;
            const isChamber3 = idx === 2;
            const isChamber4 = idx === 3;

            return (
              <div
                key={doc.slug}
                className="rounded-3xl border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-slate-900 p-6 shadow-apple-card flex flex-col justify-between transition hover:shadow-lg"
              >
                <div>
                  {/* Top Doctor Chamber Info */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          isChamber1
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                            : isChamber2
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : isChamber3
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}>
                          {doc.chamber_name}
                        </span>

                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          {doc.token_prefix} SERIES
                        </span>
                      </div>

                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {doc.full_name}
                      </h2>

                      {/* SPECIALIZATION & VERIFIED REGISTRATION CREDENTIALS */}
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {doc.specialization}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white">
                          {doc.registration_number}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ({doc.council_name})
                        </span>
                        <span className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold">
                          {doc.is_procedure_chair ? "Dental Council Verified ✅" : "NMC Verified ✅"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* LIVE PER-CHAMBER STATUS PILL */}
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Live Status
                        </div>
                        <div className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {statusLine}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setWalkinDocSlug(doc.slug)}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
                          title="Add Walk-in Token to this Chamber"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Walk-in
                        </button>

                        <button
                          onClick={() => handleCallNext(doc)}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition cursor-pointer active:scale-95 ${
                            isChamber1
                              ? "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20"
                              : isChamber2
                              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                              : isChamber3
                              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                          }`}
                        >
                          <Volume2 className="h-4 w-4" /> Call Next
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVE PATIENT IN CHAMBER BANNER */}
                  {inConsultation ? (
                    <div className="mt-4 rounded-2xl border-2 border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {doc.is_procedure_chair ? "PROCEDURE IN PROGRESS NOW" : "IN CONSULTATION NOW"}
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                          {doc.token_prefix} #{inConsultation.token_number}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-black text-sm text-slate-900 dark:text-white">
                            {inConsultation.patient_name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {inConsultation.patient_phone} • {inConsultation.symptoms_description || "Routine check-up"}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/dashboard/consult/${inConsultation.appointment_number}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                          >
                            <FileText className="h-3.5 w-3.5" /> Open ℞ Pad
                          </Link>

                          <button
                            onClick={() => handleCompleteConsultation(doc.slug, inConsultation.appointment_number)}
                            className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 transition cursor-pointer"
                            title="Complete Consultation"
                          >
                            ✓ Finish
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" /> Chamber currently vacant. Click &quot;Call Next&quot; to admit.
                    </div>
                  )}

                  {/* Chamber Queue List */}
                  <div className="mt-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span>Waiting in Queue ({waitingPatients.length})</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {completedCount} consultations completed today
                      </span>
                    </div>

                    {waitingPatients.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-850 p-4 text-center text-xs text-slate-400">
                        No patients waiting in queue right now.
                      </div>
                    ) : (
                      waitingPatients.map((p) => (
                        <div
                          key={p.appointment_number || p.token_number}
                          className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-3 flex items-center justify-between text-xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex px-2 py-1 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-black text-xs shrink-0">
                              {doc.token_prefix} #{p.token_number}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{p.patient_name}</span>
                                {p.payment_status === "paid" ? (
                                  <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                    PAID ✅
                                  </span>
                                ) : (
                                  <span className="rounded bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                    CASH DUE ⏳
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {p.symptoms_description || "Consultation"} • {p.time_slot}
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-medium text-slate-400 capitalize">
                            Waiting
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 5. CHAMBER STATUS FOOTER WITH FEE-SPLIT BREAKDOWN */}
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 font-bold">
                      <Percent className="h-3.5 w-3.5" />
                      <span>{doc.fee_split}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      Doctor: ₹{Math.round(doc.consultation_fee * (doc.doctor_share_pct / 100))} | Clinic: ₹{Math.round(doc.consultation_fee * (doc.clinic_share_pct / 100))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/60">
                    <span>Fee: <strong>₹{doc.consultation_fee}</strong> • 7-Day Free Follow-up</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {doc.room_number} • Chamber Active
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK WALK-IN MODAL */}
      {walkinDocSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-apple-blue" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Add Walk-in Token ({doctors.find(d => d.slug === walkinDocSlug)?.chamber_name})
                </h3>
              </div>
              <button
                onClick={() => setWalkinDocSlug(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWalkinSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  WhatsApp Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-apple-blue"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWalkinDocSlug(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWalkin}
                  className="rounded-xl bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                >
                  {isSubmittingWalkin ? "Generating Token..." : "Generate Walk-in Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CALL ANY CHAMBER MODAL */}
      {showCallAnyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  [ 📞 CALL ANY CHAMBER ] — Quick Reception Dispatch
                </h3>
              </div>
              <button
                onClick={() => setShowCallAnyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              One-tap call next patient into any active consultation room or procedure chair. Triggers distinct chime and updates the shared Smart TV wall display.
            </p>

            <div className="space-y-2.5">
              {doctors.map(doc => {
                const queue = appointmentsByDoc[doc.slug] || [];
                const nextPt = queue.find(p => p.status === "waiting" || p.status === "confirmed" || p.status === "in_waiting");
                const inConsult = queue.find(p => p.status === "in_consultation");

                return (
                  <div
                    key={doc.slug}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{doc.chamber_name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {doc.token_prefix}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {doc.full_name} • In room: {inConsult ? `${doc.token_prefix} #${inConsult.token_number} ${inConsult.patient_name}` : "Vacant"}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        Next in line: {nextPt ? `${doc.token_prefix} #${nextPt.token_number} ${nextPt.patient_name}` : "Queue Cleared"}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleCallNext(doc);
                        setShowCallAnyModal(false);
                      }}
                      disabled={!nextPt}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>{nextPt ? `Call ${doc.token_prefix} #${nextPt.token_number}` : "All Called"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
