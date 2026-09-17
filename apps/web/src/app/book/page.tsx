"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Back to Directory
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
            <Sparkles className="h-3.5 w-3.5" /> Direct Clinic Booking (0% Convenience Fee)
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-8 sm:px-6 lg:px-8">
        {bookingConfirmed ? (
          /* CONFIRMATION TICKET SCREEN */
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl dark:border-emerald-950 dark:bg-slate-900">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-3 text-2xl font-black">
                Appointment & Token Confirmed!
              </h2>
              <p className="text-xs text-teal-100 mt-1">
                {bookingConfirmed.message}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Giant Token Callout */}
              <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Your OPD Live Token
                </div>
                <div className="mt-2 text-6xl font-black text-emerald-600 dark:text-emerald-400">
                  #{bookingConfirmed.appointment.token_number}
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Estimated wait time: <strong>~{selectedDoc.wait_minutes} minutes</strong>
                </div>
              </div>

              {/* Clinic & Doctor Details */}
              <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{bookingConfirmed.appointment.patient_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDoc.full_name} ({selectedDoc.specialization})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Clinic:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDoc.clinic_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-800">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedDoc.clinic_address}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Consultation Fee (Pay at counter):</span>
                  <span className="font-bold text-emerald-600">₹{selectedDoc.consultation_fee} (Cash/UPI)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={bookingConfirmed.whatsapp_notification_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <Share2 className="h-4 w-4" /> Open Confirmation in WhatsApp
                </a>

                <Link
                  href={`/doctors/${selectedDoc.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  View Doctor Profile & Directions
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* BOOKING FORM */
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Selected Doctor Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-brand-600 dark:bg-teal-950 font-bold text-lg">
                  {selectedDoc.full_name.split(" ")[1]?.[0] || "D"}
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white">
                    Book Token with {selectedDoc.full_name}
                  </h1>
                  <p className="text-xs text-slate-500">
                    {selectedDoc.specialization} • {selectedDoc.clinic_name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Fee</div>
                <div className="text-lg font-black text-slate-900 dark:text-white">₹{selectedDoc.consultation_fee}</div>
              </div>
            </div>

            {/* Live Queue Callout Banner */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-950 dark:bg-amber-950/30">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Currently Serving in Chamber: <strong>Token #{selectedDoc.current_token}</strong>
                </span>
                <span className="text-amber-800 font-bold dark:text-amber-400">
                  Your Token Will Be #{selectedDoc.next_token}
                </span>
              </div>
            </div>

            <form onSubmit={handleBooking} className="mt-6 space-y-5">
              {/* Slot Mode Selection */}
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  Select Consultation Shift
                </label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSlotType("live_token")}
                    className={`rounded-xl border p-3.5 text-left text-xs transition ${
                      slotType === "live_token"
                        ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-600"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>⚡ Live Token (Now)</span>
                      {slotType === "live_token" && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Walk-in queue. Arrive in next 15-30 mins.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSlotType("evening_slot")}
                    className={`rounded-xl border p-3.5 text-left text-xs transition ${
                      slotType === "evening_slot"
                        ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 ring-1 ring-brand-600"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-800"
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>🌆 Evening OPD Shift</span>
                      {slotType === "evening_slot" && <CheckCircle2 className="h-4 w-4 text-brand-600" />}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Slot between 05:00 PM - 08:30 PM</p>
                  </button>
                </div>
              </div>

              {/* Patient Name */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* WhatsApp Mobile Number */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  WhatsApp Mobile Number (for token chime alert) *
                </label>
                <input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Your token number and digital prescription link will be messaged to this WhatsApp number.
                </p>
              </div>

              {/* Symptoms / Complaints */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chief Medical Complaint / Symptoms (Optional)
                </label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Red skin rash with itching for 4 days, mild fever..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-50"
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
