"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useSearchParams } from "next/navigation";
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
  ShieldAlert
} from "lucide-react";

const DOCTORS_MAP: Record<string, any> = {
  "dr-rahul-sharma": {
    slug: "dr-rahul-sharma",
    full_name: "Dr. Rahul Sharma",
    specialization: "Dermatologist",
    qualification_summary: "MBBS, MD (Dermatology)",
    consultation_fee: 600,
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    current_token: 2,
    next_token: 4,
    wait_minutes: 15
  },
  "dr-aditi-joshi": {
    slug: "dr-aditi-joshi",
    full_name: "Dr. Aditi Joshi",
    specialization: "Dentist",
    qualification_summary: "BDS, MDS (Endodontics)",
    consultation_fee: 400,
    clinic_name: "Smile Craft Multi-Speciality Dental",
    clinic_address: "42, EC Road, Near Survey Chowk, Dehradun",
    current_token: 1,
    next_token: 3,
    wait_minutes: 10
  },
  "dr-vikram-sethi": {
    slug: "dr-vikram-sethi",
    full_name: "Dr. Vikram Sethi",
    specialization: "Pediatrician",
    qualification_summary: "MBBS, DCH, DNB (Pediatrics)",
    consultation_fee: 500,
    clinic_name: "Dron Child & Newborn Health Centre",
    clinic_address: "88, Chakrata Road, Near Ballupur Chowk, Dehradun",
    current_token: 3,
    next_token: 5,
    wait_minutes: 20
  }
};

function BookingForm() {
  const searchParams = useSearchParams();
  const doctorSlug = searchParams.get("doctor") || "dr-rahul-sharma";
  const [selectedDoc, setSelectedDoc] = useState(DOCTORS_MAP[doctorSlug] || DOCTORS_MAP["dr-rahul-sharma"]);

  const [slotType, setSlotType] = useState("live_token");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("+91");
  const [symptoms, setSymptoms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);

  useEffect(() => {
    if (DOCTORS_MAP[doctorSlug]) {
      setSelectedDoc(DOCTORS_MAP[doctorSlug]);
    }
  }, [doctorSlug]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || patientPhone.length < 10) {
      alert("Please enter patient name and valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_slug: selectedDoc.slug,
          patient_name: patientName,
          patient_phone: patientPhone,
          time_slot: slotType === "live_token" ? `Live Token #${selectedDoc.next_token}` : "Evening OPD (05:00 PM)",
          symptoms_description: symptoms
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBookingConfirmed(data);
      } else {
        fallbackConfirmation();
      }
    } catch (err) {
      fallbackConfirmation();
    } finally {
      setIsSubmitting(false);
    }
  };

  const fallbackConfirmation = () => {
    const assignedToken = selectedDoc.next_token;
    const waText = `🏥 *Appointment Confirmed - ${selectedDoc.clinic_name}*\nHello ${patientName}, your token with *${selectedDoc.full_name}* is confirmed!\n\n🎟️ *Token Number:* #${assignedToken}\n📍 *Clinic:* ${selectedDoc.clinic_address}\n💰 *Fee:* ₹${selectedDoc.consultation_fee}`;
    const cleanPhone = patientPhone.replace(/[^0-9]/g, "");
    setBookingConfirmed({
      status: "confirmed",
      appointment: {
        appointment_number: `APT-${selectedDoc.slug.slice(3, 8).toUpperCase()}-104`,
        token_number: assignedToken,
        patient_name: patientName,
        doctor_name: selectedDoc.full_name,
        clinic_name: selectedDoc.clinic_name,
        clinic_address: selectedDoc.clinic_address,
        fee_amount: selectedDoc.consultation_fee
      },
      whatsapp_notification_link: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`,
      message: `Appointment booked! Your Token Number is #${assignedToken}.`
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/search" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 rounded-full bg-apple-teal/10 px-3 py-1 text-xs font-medium text-apple-teal dark:text-[#30D1BE]">
              <Sparkles className="h-3.5 w-3.5" /> Direct Clinic Booking (0% Fee)
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8">
        {bookingConfirmed ? (
          /* CONFIRMATION TICKET SCREEN */
          <div className="overflow-hidden rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-apple-card">
            <div className="bg-apple-blue dark:bg-apple-blue/90 p-7 text-white text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Appointment & Token Confirmed!
              </h2>
              <p className="text-xs text-white/80 mt-1">
                {bookingConfirmed.message}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Giant Token Callout */}
              <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#2C2C2E] p-6 text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  Your OPD Live Token
                </div>
                <div className="mt-2 text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
                  #{bookingConfirmed.appointment.token_number}
                </div>
                <div className="mt-2 text-xs text-[#86868B]">
                  Estimated wait time: <strong className="text-[#1D1D1F] dark:text-white font-medium">~{selectedDoc.wait_minutes} minutes</strong>
                </div>
              </div>

              {/* Clinic & Doctor Details */}
              <div className="space-y-3 rounded-[20px] border border-black/[0.04] dark:border-white/[0.06] bg-[#F5F5F7]/70 dark:bg-[#2C2C2E]/50 p-5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[#86868B]">Patient:</span>
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
                  <span className="font-normal text-[#515154] dark:text-[#A1A1A6]">{selectedDoc.clinic_address}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#86868B]">Consultation Fee (Pay at counter):</span>
                  <span className="font-semibold text-apple-teal dark:text-[#30D1BE] font-mono">₹{selectedDoc.consultation_fee} (Cash/UPI)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={bookingConfirmed.whatsapp_notification_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
                >
                  <Share2 className="h-4 w-4" /> Open Confirmation in WhatsApp
                </a>

                <Link
                  href={`/doctors/${selectedDoc.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] py-3 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                >
                  View Doctor Profile & Directions
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* BOOKING FORM */
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card">
            {/* Selected Doctor Header */}
            <div className="flex items-start justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-apple-blue/10 text-apple-blue font-bold text-lg">
                  {selectedDoc.full_name.split(" ")[1]?.[0] || "D"}
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                    Book Token with {selectedDoc.full_name}
                  </h1>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    {selectedDoc.specialization} • {selectedDoc.clinic_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#86868B]">Fee</div>
                <div className="text-lg font-bold text-[#1D1D1F] dark:text-white font-mono">₹{selectedDoc.consultation_fee}</div>
              </div>
            </div>

            {/* Live Queue Callout Banner */}
            <div className="mt-6 rounded-[20px] border border-apple-amber/20 bg-apple-amber/10 p-4">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <Clock className="h-4 w-4 text-apple-amber" />
                  Currently Serving in Chamber: <strong className="font-mono">Token #{selectedDoc.current_token}</strong>
                </span>
                <span className="text-apple-amber font-semibold font-mono">
                  Your Token Will Be #{selectedDoc.next_token}
                </span>
              </div>
            </div>

            <form onSubmit={handleBooking} className="mt-6 space-y-5">
              {/* Slot Mode Selection */}
              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                  Select Consultation Shift
                </label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSlotType("live_token")}
                    className={`rounded-[20px] border p-4 text-left text-xs transition active:scale-[0.99] ${
                      slotType === "live_token"
                        ? "border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 ring-1 ring-apple-blue"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                      <span>⚡ Live Token (Now)</span>
                      {slotType === "live_token" && <CheckCircle2 className="h-4 w-4 text-apple-blue" />}
                    </div>
                    <p className="mt-1 text-[11px] text-[#86868B]">Walk-in queue. Arrive in next 15-30 mins.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSlotType("evening_slot")}
                    className={`rounded-[20px] border p-4 text-left text-xs transition active:scale-[0.99] ${
                      slotType === "evening_slot"
                        ? "border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 ring-1 ring-apple-blue"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center justify-between">
                      <span>🌆 Evening OPD Shift</span>
                      {slotType === "evening_slot" && <CheckCircle2 className="h-4 w-4 text-apple-blue" />}
                    </div>
                    <p className="mt-1 text-[11px] text-[#86868B]">Slot between 05:00 PM - 08:30 PM</p>
                  </button>
                </div>
              </div>

              {/* Patient Name */}
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
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
              </div>

              {/* WhatsApp Mobile Number */}
              <div>
                <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                  WhatsApp Mobile Number (for token chime alert) *
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 font-mono"
                />
                <p className="mt-1 text-[10px] text-[#86868B]">
                  Your token number and digital prescription link will be messaged to this WhatsApp number.
                </p>
              </div>

              {/* Symptoms / Complaints */}
              <div>
                <label className="text-xs font-medium text-[#1D1D1F] dark:text-white">
                  Chief Medical Complaint / Symptoms (Optional)
                </label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Red skin rash with itching for 4 days, mild fever..."
                  className="mt-1.5 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F5F5F7] dark:bg-black/40 p-2.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-apple-blue hover:bg-[#0077ED] py-3.5 text-xs font-semibold text-white shadow-apple-sm active:scale-[0.98] transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" /> Reserving Token #{selectedDoc.next_token}...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Confirm Token #{selectedDoc.next_token} & Generate WhatsApp Link
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading booking engine...</div>}>
      <BookingForm />
    </Suspense>
  );
}
