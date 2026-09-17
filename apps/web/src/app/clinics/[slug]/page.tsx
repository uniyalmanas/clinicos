import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  Calendar, 
  Stethoscope, 
  Navigation,
  Sparkles
} from "lucide-react";

const SEED_CLINICS: Record<string, any> = {
  "derma-care-dehradun": {
    slug: "derma-care-dehradun",
    name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Dermatology & Cosmetic Laser Solutions",
    about: "State of the art skin clinic specializing in acne, laser hair removal, eczema, and chemical peels with FDA-approved laser technology.",
    phone: "+919876543210",
    whatsapp_number: "+919876543210",
    gstin: "05AAAAA0000A1Z5",
    address_line: "14, Rajpur Road, Near Ashley Hall",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    facilities: ["Full AC", "Laser Suite", "High-speed WiFi", "Wheelchair Accessible", "UPI Soundbox"],
    opening_hours: {
      "Monday - Friday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
      "Saturday": "10:00 AM - 04:00 PM",
      "Sunday": "Closed"
    },
    doctors: [
      {
        full_name: "Dr. Rahul Sharma",
        slug: "dr-rahul-sharma",
        specialization: "Dermatologist",
        qualification_summary: "MBBS, MD (Dermatology)",
        consultation_fee: 600.00
      }
    ]
  },
  "smile-craft-dental": {
    slug: "smile-craft-dental",
    name: "Smile Craft Multi-Speciality Dental",
    tagline: "Gentle, Precision Dental Care & Implants",
    about: "Modern digital dental practice offering painless root canals, invisible aligners, dental implants and pediatric dentistry.",
    phone: "+919876543211",
    whatsapp_number: "+919876543211",
    gstin: "05BBBBB0000B1Z6",
    address_line: "42, EC Road, Near Survey Chowk",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    facilities: ["Full AC", "Digital RVG X-Ray", "Autoclave Sterilization", "WiFi"],
    opening_hours: {
      "Monday - Saturday": "10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM",
      "Sunday": "Emergency Only"
    },
    doctors: [
      {
        full_name: "Dr. Aditi Joshi",
        slug: "dr-aditi-joshi",
        specialization: "Dentist",
        qualification_summary: "BDS, MDS (Endodontics)",
        consultation_fee: 400.00
      }
    ]
  },
  "dron-child-clinic": {
    slug: "dron-child-clinic",
    name: "Dron Child & Newborn Health Centre",
    tagline: "Complete Pediatric Care & Vaccination Hub",
    about: "Dedicated child health clinic offering newborn monitoring, immunizations, and pediatric emergency care.",
    phone: "+919876543212",
    whatsapp_number: "+919876543212",
    gstin: "05CCCCC0000C1Z7",
    address_line: "88, Chakrata Road, Near Ballupur Chowk",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    facilities: ["Vaccine Cold Chain", "Nebulization Station", "Child Play Area", "Full AC"],
    opening_hours: {
      "Monday - Saturday": "09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM",
      "Sunday": "10:00 AM - 01:00 PM"
    },
    doctors: [
      {
        full_name: "Dr. Vikram Sethi",
        slug: "dr-vikram-sethi",
        specialization: "Pediatrician",
        qualification_summary: "MBBS, DCH, DNB",
        consultation_fee: 500.00
      }
    ]
  }
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [
    { slug: "derma-care-dehradun" },
    { slug: "smile-craft-dental" },
    { slug: "dron-child-clinic" },
  ];
}

export default async function ClinicProfilePage({ params }: Props) {
  const { slug } = await params;
  const clinic = SEED_CLINICS[slug] || {
    slug: slug,
    name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Clinical Healthcare",
    about: "Providing modern healthcare services in Dehradun.",
    address_line: "14, Rajpur Road",
    city: "Dehradun",
    state: "Uttarakhand",
    phone: "+919876543210",
    facilities: ["Full AC", "WiFi", "Wheelchair Accessible"],
    opening_hours: { "All Days": "10:00 AM - 08:00 PM" },
    doctors: [
      {
        full_name: "Dr. Rahul Sharma",
        slug: "dr-rahul-sharma",
        specialization: "Dermatologist",
        qualification_summary: "MBBS, MD",
        consultation_fee: 600
      }
    ]
  };

  const fullAddress = `${clinic.address_line}, ${clinic.city}, ${clinic.state}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              Verified Healthcare Facility
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    {clinic.name}
                  </h1>
                  <p className="text-xs text-brand-600 font-medium">
                    {clinic.tagline}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                {fullAddress}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {clinic.facilities.map((f: string, idx: number) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* About the Clinic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                About the Facility
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {clinic.about}
              </p>
            </div>

            {/* Doctors Practicing at this Clinic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Specialists Practicing Here
              </h2>
              <div className="mt-4 space-y-4">
                {clinic.doctors.map((d: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 hover:border-brand-300 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-brand-600 dark:bg-teal-950">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <Link href={`/doctors/${d.slug}`} className="text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white">
                          {d.full_name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {d.specialization} • {d.qualification_summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Fee: ₹{d.consultation_fee}
                      </span>
                      <Link
                        href={`/doctors/${d.slug}`}
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Timings & Location */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-600" /> Clinic Operating Hours
              </h3>
              <div className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {Object.entries(clinic.opening_hours).map(([days, time], idx) => (
                  <div key={idx} className="flex justify-between py-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{days}</span>
                    <span className="text-slate-500">{String(time)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`tel:${clinic.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-700"
                >
                  <Phone className="h-4 w-4" /> Call Clinic Reception
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Navigation className="h-4 w-4 text-blue-600" /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
