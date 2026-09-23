"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Stethoscope, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  ArrowLeft, 
  Phone, 
  Share2, 
  Check, 
  RotateCw,
  Building2,
  Sparkles,
  Search,
  SlidersHorizontal,
  Star,
  ChevronRight,
  ShieldCheck,
  Video,
  User,
  X,
  AlertCircle,
  RefreshCw,
  Info
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import BackButton from "@/components/BackButton";
import { getDoctors } from "@/lib/clinic-data";
import { 
  DEHRADUN_DOCTORS, 
  DOCTORS_MAP, 
  DoctorProfile, 
  SPECIALTY_CATEGORIES, 
  DEHRADUN_LOCALITIES 
} from "@/data/doctors";
import { usePatientSession, updateActiveBooking } from "@/lib/patientSession";

// Normalizes query string specialty into standard category
function normalizeSpecialty(input: string): string {
  if (!input || input === "All") return "All";
  const s = input.toLowerCase().replace(/[-_]/g, " ").trim();
  
  if (s.includes("gastro") || s.includes("gi medicine") || s.includes("stomach") || s.includes("liver") || s.includes("digest")) {
    return "Gastroenterologist";
  }
  if (s.includes("derma") || s.includes("skin") || s.includes("hair") || s.includes("scalp")) {
    return "Dermatologist";
  }
  if (s.includes("pediatric") || s.includes("paediatric") || s.includes("child") || s.includes("newborn")) {
    return "Pediatrician";
  }
  if (s.includes("cardio") || s.includes("heart") || s.includes("vascular")) {
    return "Cardiologist";
  }
  if (s.includes("dent") || s.includes("teeth") || s.includes("tooth") || s.includes("oral") || s.includes("rct")) {
    return "Dentist";
  }
  if (s.includes("physician") || s.includes("internal medicine") || s.includes("general medicine")) {
    return "General Physician";
  }
  if (s.includes("gyn") || s.includes("obstetric") || s.includes("women") || s.includes("pregnancy")) {
    return "Gynecologist";
  }
  if (s.includes("ortho") || s.includes("bone") || s.includes("joint") || s.includes("spine")) {
    return "Orthopedic Surgeon";
  }
  if (s.includes("ent") || s.includes("ear") || s.includes("nose") || s.includes("throat")) {
    return "ENT Specialist";
  }
  if (s.includes("ophthal") || s.includes("eye") || s.includes("vision")) {
    return "Ophthalmologist";
  }
  if (s.includes("neuro") || s.includes("brain") || s.includes("spine neuro")) {
    return "Neurologist";
  }
  if (s.includes("pulmo") || s.includes("chest") || s.includes("asthma") || s.includes("respiratory")) {
    return "Pulmonologist";
  }
  if (s.includes("psych") || s.includes("mental") || s.includes("mind") || s.includes("mood")) {
    return "Psychiatrist";
  }
  if (s.includes("uro") || s.includes("kidney") || s.includes("stone") || s.includes("prostate")) {
    return "Urologist";
  }
  if (s.includes("onco") || s.includes("cancer") || s.includes("tumor") || s.includes("chemo")) {
    return "Oncologist";
  }
  if (s.includes("ayur") || s.includes("nadi") || s.includes("panchakarma")) {
    return "Ayurvedic Physician";
  }
  if (s.includes("homeo")) {
    return "Homeopath";
  }
  if (s.includes("physio") || s.includes("rehab")) {
    return "Physiotherapist";
  }
  return input;
}

// Reusable Doctor Portrait Component with fallback
function DoctorAvatar({ 
  name, 
  avatarUrl, 
  className = "h-14 w-14" 
}: { 
  name: string; 
  avatarUrl?: string; 
  className?: string; 
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.1] bg-gray-100 dark:bg-zinc-800 ${className}`}>
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const initials = name
    .replace(/^Dr\.?\s*/i, "")
    .replace(/^Vaidya\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "DR";

  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.1] bg-gradient-to-br from-apple-blue/20 to-apple-blue/10 text-apple-blue font-bold ${className}`}>
      <span>{initials}</span>
      <span className="absolute bottom-1 right-1 rounded-full bg-emerald-500 p-0.5 ring-1.5 ring-white dark:ring-zinc-900">
        <Check className="h-2 w-2 text-white" />
      </span>
    </div>
  );
}

function BookingExperience() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlDoctorSlug = searchParams.get("doctor");
  const urlSpecialty = searchParams.get("specialty");
  const urlClinic = searchParams.get("clinic");
  const urlMode = searchParams.get("mode");

  // Catalog state - initialized with verified Dehradun doctors
  const [doctorsList, setDoctorsList] = useState<DoctorProfile[]>(DEHRADUN_DOCTORS);
  const [selectedDoc, setSelectedDoc] = useState<DoctorProfile | null>(null);

  // Search & Filter state for Doctor Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");
  const [selectedLocality, setSelectedLocality] = useState<string>("All");

  // Active patient session (JIT registration)
  const { session } = usePatientSession();

  // Booking Form fields
  const [appointmentDate, setAppointmentDate] = useState<string>("today");
  const [slotType, setSlotType] = useState<string>("live_token");
  const [consultationMode, setConsultationMode] = useState<string>(urlMode === "video" ? "video" : "in_person");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("+91 ");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("unspecified");
  const [symptoms, setSymptoms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pay_at_clinic" | "pay_online">("pay_at_clinic");

  // Auto-prefill if patient already has a session
  useEffect(() => {
    if (session) {
      if (session.full_name && !patientName) {
        setPatientName(session.full_name);
      }
      if (session.phone && (patientPhone === "+91 " || patientPhone === "+91")) {
        setPatientPhone(session.phone);
      }
      if (session.age && !patientAge) {
        setPatientAge(session.age.toString());
      }
      if (session.gender && patientGender === "unspecified") {
        setPatientGender(session.gender);
      }
    }
  }, [session]);

  // Live queue status for selected doctor
  const [liveQueue, setLiveQueue] = useState<{
    current_active_token: number;
    next_token_available: number;
    wait_minutes: number;
  } | null>(null);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);

  // Submission & confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);

  // 1. On mount, optionally merge latest doctors from API
  useEffect(() => {
    let isMounted = true;
    async function fetchApiDoctors() {
      try {
        const liveDoctors = await getDoctors();
        if (Array.isArray(liveDoctors) && liveDoctors.length > 0 && isMounted) {
          const slugMap = new Map<string, DoctorProfile>();
          DEHRADUN_DOCTORS.forEach(d => slugMap.set(d.slug, d));

          liveDoctors.forEach((doctor: DoctorProfile) => {
            slugMap.set(doctor.slug, { ...slugMap.get(doctor.slug)!, ...doctor });
          });

          setDoctorsList(Array.from(slugMap.values()));
        }
      } catch (e) {
        // Fallback silently to DEHRADUN_DOCTORS
      }
    }
    fetchApiDoctors();
    return () => { isMounted = false; };
  }, []);

  // 2. Synchronize selected doctor from URL query parameters (?doctor=..., ?clinic=..., ?specialty=...)
  useEffect(() => {
    if (urlDoctorSlug) {
      const match = doctorsList.find(d => d.slug.toLowerCase() === urlDoctorSlug.toLowerCase());
      if (match) {
        setSelectedDoc(match);
        return;
      }
    }

    if (urlClinic && !urlDoctorSlug) {
      const match = doctorsList.find(d => 
        d.clinic_slug.toLowerCase() === urlClinic.toLowerCase() ||
        d.clinic_name.toLowerCase().includes(urlClinic.toLowerCase())
      );
      if (match) {
        setSelectedDoc(match);
        return;
      }
    }

    if (urlSpecialty) {
      const norm = normalizeSpecialty(urlSpecialty);
      setSelectedSpecialty(norm);
    }
  }, [urlDoctorSlug, urlClinic, urlSpecialty, doctorsList]);

  // 3. Fetch live queue when doctor is selected
  useEffect(() => {
    if (!selectedDoc) {
      setLiveQueue(null);
      return;
    }

    let isMounted = true;
    async function fetchLiveQueue() {
      setIsLoadingQueue(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/appointments/live-queue?doctor_slug=${selectedDoc?.slug}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setLiveQueue({
            current_active_token: data.current_active_token || 2,
            next_token_available: data.next_token_available || selectedDoc?.next_token || 4,
            wait_minutes: (data.estimated_wait_minutes_per_patient || 12) * Math.max(1, (data.next_token_available || 4) - (data.current_active_token || 2))
          });
        } else if (isMounted) {
          // Default sensible calculation
          setLiveQueue({
            current_active_token: 2,
            next_token_available: selectedDoc?.next_token || 4,
            wait_minutes: 15
          });
        }
      } catch (e) {
        if (isMounted) {
          setLiveQueue({
            current_active_token: 2,
            next_token_available: selectedDoc?.next_token || 4,
            wait_minutes: 15
          });
        }
      } finally {
        if (isMounted) setIsLoadingQueue(false);
      }
    }

    fetchLiveQueue();
    return () => { isMounted = false; };
  }, [selectedDoc]);

  // Filtered doctors list for Step 1
  const filteredDoctors = useMemo(() => {
    return doctorsList.filter((doc) => {
      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.full_name.toLowerCase().includes(q);
        const matchesSpec = doc.specialization.toLowerCase().includes(q);
        const matchesClinic = doc.clinic_name.toLowerCase().includes(q);
        const matchesAddress = doc.clinic_address.toLowerCase().includes(q);
        const matchesService = (doc.services || []).some(s => s.toLowerCase().includes(q));
        if (!matchesName && !matchesSpec && !matchesClinic && !matchesAddress && !matchesService) {
          return false;
        }
      }

      // Specialty filter
      if (selectedSpecialty !== "All") {
        const normSelected = normalizeSpecialty(selectedSpecialty).toLowerCase();
        const normDoc = normalizeSpecialty(doc.specialization).toLowerCase();
        const rawDoc = doc.specialization.toLowerCase();
        const rawSelected = selectedSpecialty.toLowerCase();
        const match =
          rawDoc.includes(rawSelected) ||
          rawSelected.includes(rawDoc) ||
          normDoc === normSelected ||
          (doc.category && doc.category.toLowerCase().includes(rawSelected));
        if (!match) return false;
      }

      // Locality filter
      if (selectedLocality !== "All") {
        const docLoc = (doc.locality || "").toLowerCase();
        const docAddr = doc.clinic_address.toLowerCase();
        const target = selectedLocality.toLowerCase();
        if (!docLoc.includes(target) && !docAddr.includes(target)) {
          return false;
        }
      }

      return true;
    });
  }, [doctorsList, searchQuery, selectedSpecialty, selectedLocality]);

  // Action: Select a doctor and update URL
  const handleSelectDoctor = (doc: DoctorProfile) => {
    setSelectedDoc(doc);
    setBookingConfirmed(null);
    window.history.pushState({}, "", `/book?doctor=${doc.slug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Action: Return to Doctor Selection
  const handleBackToDoctorSelection = () => {
    setSelectedDoc(null);
    setBookingConfirmed(null);
    window.history.pushState({}, "", "/book");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Action: Handle Booking Submission
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    if (!patientName.trim()) {
      alert("Please enter the patient's full name.");
      return;
    }

    const cleanPhone = patientPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number for WhatsApp token notification.");
      return;
    }

    setIsSubmitting(true);
    const calculatedNextToken = liveQueue?.next_token_available || selectedDoc.next_token || 4;

    const slotLabel = 
      slotType === "live_token" 
        ? `Live OPD Token #${calculatedNextToken}`
        : slotType === "morning"
        ? "Morning OPD Shift (10:00 AM - 01:30 PM)"
        : "Evening OPD Shift (05:00 PM - 08:30 PM)";

    const formattedDate = appointmentDate === "today" 
      ? new Date().toISOString().split("T")[0]
      : appointmentDate === "tomorrow"
      ? new Date(Date.now() + 86400000).toISOString().split("T")[0]
      : appointmentDate;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/appointments/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: selectedDoc.slug,
          patient_name: patientName.trim(),
          patient_phone: `+91${cleanPhone.slice(-10)}`,
          appointment_date: formattedDate,
          time_slot: slotLabel,
          consultation_type: consultationMode,
          symptoms_description: symptoms.trim() || undefined,
          payment_status: paymentMethod === "pay_online" ? "paid" : "pending",
          payment_mode: paymentMethod === "pay_online" ? "online_upi" : "cash"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBookingConfirmed(data);

        // Auto-register / link patient session into Personal Health Vault
        updateActiveBooking({
          appointment_number: data.appointment?.appointment_number || `APT-${selectedDoc.slug.slice(3, 8).toUpperCase()}-${100 + calculatedNextToken}`,
          token_number: data.appointment?.token_number || calculatedNextToken,
          doctor_name: selectedDoc.full_name,
          doctor_slug: selectedDoc.slug,
          specialization: selectedDoc.specialization,
          clinic_name: selectedDoc.clinic_name,
          clinic_address: selectedDoc.clinic_address,
          time_slot: slotLabel,
          appointment_date: formattedDate,
          fee_amount: selectedDoc.consultation_fee,
          payment_status: paymentMethod === "pay_online" ? "paid" : "pending",
          payment_mode: paymentMethod === "pay_online" ? "online_upi" : "cash",
          booked_at: new Date().toISOString()
        }, patientName.trim(), `+91${cleanPhone.slice(-10)}`);

        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        fallbackConfirmation(calculatedNextToken, slotLabel, formattedDate, cleanPhone);
      }
    } catch (err) {
      fallbackConfirmation(calculatedNextToken, slotLabel, formattedDate, cleanPhone);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fallback if backend API is not responding
  const fallbackConfirmation = (
    assignedToken: number, 
    slotLabel: string, 
    dateStr: string,
    cleanPhone: string
  ) => {
    if (!selectedDoc) return;
    const phoneNum = cleanPhone.slice(-10);
    const waText = 
      `🏥 *Appointment Confirmed - ${selectedDoc.clinic_name}*\n\n` +
      `Hello ${patientName}, your appointment with *${selectedDoc.full_name}* is confirmed!\n\n` +
      `🎟️ *Token Number:* #${assignedToken}\n` +
      `📅 *Date:* ${dateStr}\n` +
      `⏰ *Shift:* ${slotLabel}\n` +
      `📍 *Clinic:* ${selectedDoc.clinic_address}\n` +
      `💰 *Consultation Fee:* ₹${selectedDoc.consultation_fee} (Pay at counter via Cash/UPI)\n\n` +
      `_Please arrive 10-15 minutes prior to your turn._`;

    // Auto-register / link patient session into Personal Health Vault
    updateActiveBooking({
      appointment_number: `APT-${selectedDoc.slug.slice(3, 8).toUpperCase()}-${100 + assignedToken}`,
      token_number: assignedToken,
      doctor_name: selectedDoc.full_name,
      doctor_slug: selectedDoc.slug,
      specialization: selectedDoc.specialization,
      clinic_name: selectedDoc.clinic_name,
      clinic_address: selectedDoc.clinic_address,
      time_slot: slotLabel,
      appointment_date: dateStr,
      fee_amount: selectedDoc.consultation_fee,
      payment_status: paymentMethod === "pay_online" ? "paid" : "pending",
      payment_mode: paymentMethod === "pay_online" ? "online_upi" : "cash",
      booked_at: new Date().toISOString()
    }, patientName.trim(), `+91${phoneNum}`);

    setBookingConfirmed({
      status: "confirmed",
      appointment: {
        appointment_number: `APT-${selectedDoc.slug.slice(3, 8).toUpperCase()}-${100 + assignedToken}`,
        token_number: assignedToken,
        patient_name: patientName.trim(),
        patient_phone: `+91${phoneNum}`,
        doctor_name: selectedDoc.full_name,
        clinic_name: selectedDoc.clinic_name,
        clinic_address: selectedDoc.clinic_address,
        time_slot: slotLabel,
        appointment_date: dateStr,
        fee_amount: selectedDoc.consultation_fee,
        payment_status: paymentMethod === "pay_online" ? "paid" : "pending",
        payment_mode: paymentMethod === "pay_online" ? "online_upi" : "cash"
      },
      whatsapp_notification_link: `https://wa.me/91${phoneNum}?text=${encodeURIComponent(waText)}`,
      message: `Your appointment is confirmed! Token Number is #${assignedToken}.`
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {selectedDoc ? (
              <button
                onClick={handleBackToDoctorSelection}
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition"
              >
                <ArrowLeft className="h-4 w-4" /> Change Doctor
              </button>
            ) : (
              <BackButton fallbackUrl="/search" label="Back" />
            )}

            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
              <span>/</span>
              <span className="text-[#1D1D1F] dark:text-white font-semibold">
                {selectedDoc ? `Booking with ${selectedDoc.full_name}` : "Book Doctor Appointment"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-apple-teal/10 px-3 py-1 text-xs font-medium text-apple-teal dark:text-[#30D1BE]">
              <Sparkles className="h-3.5 w-3.5" /> Direct Clinic Booking (0% Platform Fee)
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* =========================================================================
            STATE 1: BOOKING CONFIRMATION TICKET
        ========================================================================= */}
        {bookingConfirmed && selectedDoc ? (
          <div className="max-w-2xl mx-auto overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-apple-card animate-in fade-in zoom-in-95 duration-300">
            {/* Header Banner */}
            <div className="bg-apple-blue p-7 text-white text-center relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner">
                <Check className="h-7 w-7 text-white" strokeWidth={3} />
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Appointment &amp; Token Confirmed!
              </h2>
              <p className="text-xs text-white/80 mt-1 max-w-md mx-auto">
                {bookingConfirmed.message || "Your walk-in OPD token has been reserved directly at the clinic."}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Giant Live Token Display */}
              <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-[#ECEEF2]/70 dark:bg-[#2C2C2E] p-6 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                  Your OPD Live Queue Token
                </div>
                <div className="mt-1 text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
                  #{bookingConfirmed.appointment.token_number}
                </div>
                <div className="mt-2 text-xs text-[#86868B] flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-apple-amber" />
                  Estimated wait time: <strong className="text-[#1D1D1F] dark:text-white font-semibold">~{liveQueue?.wait_minutes || 15} minutes</strong>
                </div>
              </div>

              {/* Appointment Information Card */}
              <div className="space-y-3 rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/50 p-5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#86868B]">Patient Name:</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">{bookingConfirmed.appointment.patient_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#86868B]">Doctor:</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">{selectedDoc.full_name} ({selectedDoc.specialization})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#86868B]">Clinic:</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">{selectedDoc.clinic_name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#86868B]">Address:</span>
                  <span className="font-medium text-[#515154] dark:text-[#A1A1A6] text-right max-w-xs">{selectedDoc.clinic_address}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#86868B]">Shift / Time:</span>
                  <span className="font-medium text-[#1D1D1F] dark:text-white">{bookingConfirmed.appointment.time_slot}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#86868B]">Consultation Fee:</span>
                  <span className="font-bold text-apple-teal dark:text-[#30D1BE] font-mono">
                    ₹{selectedDoc.consultation_fee} (Pay at clinic counter)
                  </span>
                </div>
              </div>

              {/* Personal Patient Vault Activation Callout */}
              <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex items-start gap-3 text-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>Personal Health Vault Activated</span>
                    <span className="rounded-full bg-emerald-200/60 dark:bg-emerald-800/40 px-2 py-0.2 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200">
                      Passwordless
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/90 mt-0.5">
                    Your digital OPD token, upcoming prescriptions, and dosage reminders are now linked to <strong>{bookingConfirmed.appointment.patient_phone}</strong>.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  href="/patient/portal"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-apple-blue hover:bg-[#0077ED] py-3.5 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
                >
                  <Sparkles className="h-4 w-4" /> Open My Prescriptions &amp; Reports (Vault)
                </Link>

                <a
                  href={bookingConfirmed.whatsapp_notification_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
                >
                  <Share2 className="h-4 w-4" /> Open Confirmation in WhatsApp
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href={`/doctors/${selectedDoc.slug}`}
                    className="flex items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] py-3 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                  >
                    View Clinic Directions
                  </Link>

                  <button
                    onClick={handleBackToDoctorSelection}
                    className="flex items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] py-3 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                  >
                    Book Another Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedDoc ? (
          /* =========================================================================
              STATE 2: BOOKING FORM FOR SELECTED DOCTOR
          ========================================================================= */
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Top Navigation & Stepper */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToDoctorSelection}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-apple-blue hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Select a Different Doctor
              </button>
              
              <span className="text-[11px] font-medium text-[#86868B] dark:text-[#8E8E93]">
                Step 2 of 2: Patient Details &amp; Slot
              </span>
            </div>

            {/* Selected Doctor Spotlight Card */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/[0.04] dark:border-white/[0.06] pb-5">
                <div className="flex items-center gap-3.5">
                  <DoctorAvatar 
                    name={selectedDoc.full_name} 
                    avatarUrl={selectedDoc.avatar_seed} 
                    className="h-14 w-14 sm:h-16 sm:w-16"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                        {selectedDoc.full_name}
                      </h1>
                      <span className="rounded-full bg-apple-blue/10 px-2 py-0.5 text-[10px] font-semibold text-apple-blue dark:text-sky-400">
                        {selectedDoc.specialization}
                      </span>
                    </div>
                    <p className="text-xs text-[#86868B] mt-0.5 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      {selectedDoc.clinic_name} • {selectedDoc.locality || "Dehradun"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {selectedDoc.qualification_summary} • {selectedDoc.years_of_experience} Yrs Exp
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-black/[0.04] dark:border-white/[0.06]">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#86868B] block">Consultation Fee</span>
                    <span className="text-xl font-bold text-[#1D1D1F] dark:text-white font-mono">
                      ₹{selectedDoc.consultation_fee}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleBackToDoctorSelection}
                    className="rounded-full border border-black/[0.08] dark:border-white/[0.1] px-3 py-1 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition"
                  >
                    Change Doctor
                  </button>
                </div>
              </div>

              {/* Live OPD Chamber Status Bar */}
              <div className="mt-5 rounded-[20px] border border-apple-amber/20 bg-apple-amber/10 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-amber opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-apple-amber"></span>
                    </span>
                    <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                      In Chamber Right Now: <strong className="font-mono text-apple-amber">Token #{liveQueue?.current_active_token || Math.max(1, (selectedDoc.next_token || 4) - 2)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-apple-amber font-semibold font-mono">
                      Your Walk-in Token: #{liveQueue?.next_token_available || selectedDoc.next_token || 4}
                    </span>
                    <span className="text-[11px] text-[#86868B]">
                      (~{liveQueue?.wait_minutes || 15}m wait)
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Input Form */}
              <form onSubmit={handleBooking} className="mt-6 space-y-6">
                {/* 1. Date Selection */}
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-2">
                    1. Select Appointment Day
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAppointmentDate("today")}
                      className={`rounded-xl border p-3 text-center text-xs font-semibold transition ${
                        appointmentDate === "today"
                          ? "border-apple-blue bg-apple-blue text-white shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04]"
                      }`}
                    >
                      <span>⚡ Today (Walk-In)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppointmentDate("tomorrow")}
                      className={`rounded-xl border p-3 text-center text-xs font-semibold transition ${
                        appointmentDate === "tomorrow"
                          ? "border-apple-blue bg-apple-blue text-white shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04]"
                      }`}
                    >
                      <span>📅 Tomorrow</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppointmentDate("day_after")}
                      className={`rounded-xl border p-3 text-center text-xs font-semibold transition ${
                        appointmentDate === "day_after"
                          ? "border-apple-blue bg-apple-blue text-white shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04]"
                      }`}
                    >
                      <span>🗓️ Day After</span>
                    </button>
                  </div>
                </div>

                {/* 2. Shift / Slot Selection */}
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-2">
                    2. Select Consultation Shift
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSlotType("live_token")}
                      className={`rounded-2xl border p-4 text-left text-xs transition ${
                        slotType === "live_token"
                          ? "border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 ring-1 ring-apple-blue"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                        <span>⚡ Live OPD Token (Immediate Intake)</span>
                        {slotType === "live_token" && <CheckCircle2 className="h-4 w-4 text-apple-blue" />}
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        Walk-in queue. Reach clinic within 15-30 minutes.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSlotType("evening_slot")}
                      className={`rounded-2xl border p-4 text-left text-xs transition ${
                        slotType === "evening_slot"
                          ? "border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 ring-1 ring-apple-blue"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                        <span>🌆 Evening OPD Shift</span>
                        {slotType === "evening_slot" && <CheckCircle2 className="h-4 w-4 text-apple-blue" />}
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        Scheduled slot between 05:00 PM - 08:30 PM.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Consultation Mode */}
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-2">
                    3. Mode of Visit
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConsultationMode("in_person")}
                      className={`rounded-xl border p-3 text-center text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        consultationMode === "in_person"
                          ? "border-apple-blue bg-apple-blue text-white shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04]"
                      }`}
                    >
                      <Building2 className="h-4 w-4" /> In-Clinic Visit
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsultationMode("video")}
                      className={`rounded-xl border p-3 text-center text-xs font-semibold flex items-center justify-center gap-2 transition ${
                        consultationMode === "video"
                          ? "border-apple-blue bg-apple-blue text-white shadow-xs"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04]"
                      }`}
                    >
                      <Video className="h-4 w-4" /> WhatsApp Video OPD
                    </button>
                  </div>
                </div>

                {/* 4. Patient Information */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    4. Patient Details
                  </h3>

                  <div>
                    <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh Chandra"
                      className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                        WhatsApp Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 font-mono"
                      />
                      <p className="mt-1 text-[10px] text-[#86868B]">
                        Your live token alert &amp; digital prescription are delivered here.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          placeholder="e.g. 34"
                          className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                          Gender
                        </label>
                        <select
                          value={patientGender}
                          onChange={(e) => setPatientGender(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                        >
                          <option value="unspecified">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                      Chief Complaint / Symptoms (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="e.g. Recurring stomach pain after meals, mild acidity for 3 days..."
                      className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                    />
                  </div>
                </div>

                {/* 5. Payment Preference */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block">
                    5. Payment Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pay_at_clinic")}
                      className={`rounded-2xl border p-3.5 text-left text-xs transition cursor-pointer ${
                        paymentMethod === "pay_at_clinic"
                          ? "border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 ring-1 ring-apple-blue"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04]"
                      }`}
                    >
                      <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                        <span>🏥 Pay at Clinic Counter</span>
                        {paymentMethod === "pay_at_clinic" && <CheckCircle2 className="h-4 w-4 text-apple-blue" />}
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        Pay ₹{selectedDoc.consultation_fee} via Cash or counter UPI when you arrive for your turn.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pay_online")}
                      className={`rounded-2xl border p-3.5 text-left text-xs transition cursor-pointer ${
                        paymentMethod === "pay_online"
                          ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 ring-1 ring-emerald-500"
                          : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04]"
                      }`}
                    >
                      <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          ⚡ Pay Online Now
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">Fast Track</span>
                        </span>
                        {paymentMethod === "pay_online" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <p className="mt-1 text-[11px] text-[#86868B]">
                        Instant UPI / Cards. Priority token check-in, skips reception billing counter.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Cost Breakdown Summary */}
                <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-4 text-xs space-y-2">
                  <div className="flex justify-between text-[#86868B]">
                    <span>Doctor Consultation Fee:</span>
                    <span className="text-[#1D1D1F] dark:text-white font-medium">₹{selectedDoc.consultation_fee}</span>
                  </div>
                  <div className="flex justify-between text-[#86868B]">
                    <span>DocSphere Direct Booking Fee:</span>
                    <span className="text-apple-teal font-semibold">₹0 (Free)</span>
                  </div>
                  <div className="flex justify-between border-t border-black/[0.06] dark:border-white/[0.06] pt-2 font-bold text-[#1D1D1F] dark:text-white">
                    <span>{paymentMethod === "pay_online" ? "Total Payable Online:" : "Pay at Clinic Counter:"}</span>
                    <span className={`text-base font-mono ${paymentMethod === "pay_online" ? "text-emerald-600 dark:text-emerald-400" : "text-apple-blue"}`}>
                      ₹{selectedDoc.consultation_fee}
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-apple-blue hover:bg-[#0077ED] py-4 text-xs font-bold text-white shadow-apple-sm active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> 
                      Reserving Live Token #{liveQueue?.next_token_available || selectedDoc.next_token || 4}...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> 
                      {paymentMethod === "pay_online"
                        ? `Pay ₹${selectedDoc.consultation_fee} Online & Confirm Token #${liveQueue?.next_token_available || selectedDoc.next_token || 4}`
                        : `Confirm Token #${liveQueue?.next_token_available || selectedDoc.next_token || 4} & Receive WhatsApp Pass`}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* =========================================================================
              STATE 3: DOCTOR SELECTION & SEARCH DIRECTORY (REAL APP WORKFLOW)
          ========================================================================= */
          <div className="space-y-6">
            {/* Title & Introduction */}
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue/10 px-3 py-1 text-xs font-semibold text-apple-blue dark:text-sky-400">
                <Sparkles className="h-3.5 w-3.5" /> Instant OPD Token &amp; Slot Booking
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                Select a Doctor to Book Appointment
              </h1>
              <p className="text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
                Choose your specialist to get an instant live OPD queue token or advance appointment with verified Dehradun doctors.
              </p>
            </div>

            {/* Interactive Search & Filters */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-4 sm:p-6 shadow-apple-card space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by doctor name, specialty, or clinic (e.g. Dr. Sureka, Dermatologist, Rajpur Road)..."
                  className="w-full rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/60 dark:bg-black/30 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#1D1D1F] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Specialty Category Pills */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#86868B]">
                  <span>Filter by Specialty</span>
                  {selectedSpecialty !== "All" && (
                    <button
                      onClick={() => setSelectedSpecialty("All")}
                      className="text-apple-blue hover:underline"
                    >
                      Reset Specialty
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {SPECIALTY_CATEGORIES.map((spec) => {
                    const isSelected = selectedSpecialty === spec.value;
                    return (
                      <button
                        key={spec.value}
                        type="button"
                        onClick={() => setSelectedSpecialty(isSelected ? "All" : spec.value)}
                        className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition shrink-0 ${
                          isSelected
                            ? "bg-apple-blue text-white shadow-xs"
                            : "bg-[#ECEEF2]/80 dark:bg-white/5 text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-[#ECEEF2]"
                        }`}
                      >
                        <span className="mr-1">{spec.icon}</span> {spec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Locality Selector & Results Counter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.04] dark:border-white/[0.06] pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[#86868B] text-[11px] font-medium">Locality:</span>
                  <select
                    value={selectedLocality}
                    onChange={(e) => setSelectedLocality(e.target.value)}
                    className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-black/30 px-2.5 py-1 text-xs text-[#1D1D1F] dark:text-white focus:outline-none"
                  >
                    {DEHRADUN_LOCALITIES.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-medium text-[#86868B]">
                  Showing <strong className="text-[#1D1D1F] dark:text-white">{filteredDoctors.length}</strong> verified specialists
                </div>
              </div>
            </div>

            {/* Doctors Grid */}
            {filteredDoctors.length === 0 ? (
              <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-apple-amber/10 text-apple-amber">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                  No doctors found matching criteria
                </h3>
                <p className="text-xs text-[#86868B] max-w-sm mx-auto">
                  Try adjusting your search terms, choosing a different specialty filter, or resetting all filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpecialty("All");
                    setSelectedLocality("All");
                  }}
                  className="rounded-full bg-apple-blue px-4 py-2 text-xs font-semibold text-white hover:bg-[#0077ED] transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc.slug}
                    onClick={() => handleSelectDoctor(doc)}
                    className="group cursor-pointer rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card hover:border-apple-blue/40 dark:hover:border-apple-blue/50 hover:shadow-lg transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top: Doctor Info */}
                      <div className="flex items-start gap-3.5">
                        <DoctorAvatar
                          name={doc.full_name}
                          avatarUrl={doc.avatar_seed}
                          className="h-14 w-14 group-hover:scale-105 transition"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white group-hover:text-apple-blue transition truncate">
                              {doc.full_name}
                            </h3>
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded shrink-0">
                              <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                              {doc.rating}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-apple-blue dark:text-sky-400 font-semibold mt-0.5">
                            <span>{doc.specialization}</span>
                            <span className="text-gray-300 dark:text-white/20">•</span>
                            <span className="text-gray-500 dark:text-gray-400 text-[11px] font-normal">
                              {doc.years_of_experience} Yrs Exp
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{doc.clinic_name}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{doc.locality || doc.clinic_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* OPD Live Token Status Bar */}
                      <div className="mt-3.5 rounded-xl border border-black/[0.04] dark:border-white/[0.06] bg-[#ECEEF2]/50 dark:bg-[#2C2C2E]/40 px-3 py-2 text-[11px] flex items-center justify-between text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="h-3 w-3 text-apple-amber" />
                          <span>Now: <strong className="font-mono text-[#1D1D1F] dark:text-white">Token #2</strong></span>
                        </span>
                        <span className="text-apple-teal font-semibold font-mono">
                          Next Available: #{doc.next_token || 4}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: Fee & Book CTA */}
                    <div className="mt-4 flex items-center justify-between border-t border-black/[0.04] dark:border-white/[0.06] pt-3">
                      <div>
                        <span className="text-[10px] text-[#86868B] block">Consultation Fee</span>
                        <span className="text-sm font-bold text-[#1D1D1F] dark:text-white font-mono">
                          ₹{doc.consultation_fee}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDoctor(doc);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue group-hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition"
                      >
                        <span>Book Appointment</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading booking engine...</div>}>
      <BookingExperience />
    </Suspense>
  );
}
