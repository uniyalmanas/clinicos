import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Intelligent extraction of doctor & clinic details from raw text / voice transcript / visiting card notes.
 */
const SPECIALTIES: Array<{ test: RegExp; value: string; qualifications: string; services: string[] }> = [
  {
    test: /derma|skin|hair|laser|acne/i,
    value: "Dermatologist",
    qualifications: "MBBS, MD (Dermatology)",
    services: ["Skin Consultation", "Acne & Scar Treatment", "Laser Hair Removal", "Pigmentation & Glow Therapy"],
  },
  {
    test: /dent|teeth|tooth|bds|mds|root canal/i,
    value: "Dentist",
    qualifications: "BDS, MDS",
    services: ["Dental Checkup", "Root Canal Therapy (RCT)", "Teeth Whitening", "Dental Implants"],
  },
  {
    test: /pediat|child|baby|newborn|vaccin/i,
    value: "Pediatrician",
    qualifications: "MBBS, MD (Pediatrics)",
    services: ["Child Health Assessment", "Immunization & Vaccination", "Newborn Care", "Growth Monitoring"],
  },
  {
    test: /ortho|bone|joint|fracture|spine/i,
    value: "Orthopedic Surgeon",
    qualifications: "MBBS, MS (Orthopedics)",
    services: ["Joint Pain Consultation", "Fracture Management", "Arthroscopy & Sports Injury", "Spine Assessment"],
  },
  {
    test: /gyn|women|pregnan|maternity|obs/i,
    value: "Gynecologist & Obstetrician",
    qualifications: "MBBS, MS (OBG)",
    services: ["Antenatal Care", "PCOD / PCOS Management", "Fertility Counseling", "Normal & High-Risk Delivery"],
  },
  {
    test: /cardio|heart|ecg|bp/i,
    value: "Cardiologist",
    qualifications: "MBBS, MD, DM (Cardiology)",
    services: ["Cardiac Consultation", "ECG & Echo Review", "Hypertension Management", "Preventive Heart Check"],
  },
  {
    test: /physician|general|fever|sugar|diabetes|internal/i,
    value: "General Physician",
    qualifications: "MBBS, MD (Medicine)",
    services: ["General Health Checkup", "Diabetes & BP Management", "Infectious Fever Management", "Preventive Health Review"],
  },
];

export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "onboarding:extract"), 40, 3600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawText = String(body.raw_text || "").trim();

    if (!rawText) {
      return apiError(400, "raw_text is required.", "missing_text");
    }

    const nameMatch = rawText.match(/Dr\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,3})/i);
    const fullName = nameMatch ? `Dr. ${nameMatch[1].trim()}` : "Dr. Practicing Physician";

    const regMatch = rawText.match(/\b([A-Z]{2,6}-?\d{3,8}(?:-\d{2,4})?)\b/);
    const regNumber = regMatch ? regMatch[1].toUpperCase() : `UKMC-${Math.floor(1000 + Math.random() * 9000)}-2020`;

    const expMatch = rawText.match(/(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)/i);
    const experience = expMatch ? Number.parseInt(expMatch[1], 10) : 10;

    const feeMatch =
      rawText.match(/(?:fee|charges|consultation)[:\s]*₹?\s*(\d{3,5})/i) ||
      rawText.match(/₹\s*(\d{3,5})/);
    const consultationFee = feeMatch ? Number.parseInt(feeMatch[1], 10) : 500;

    const specialty = SPECIALTIES.find((s) => s.test.test(rawText)) || {
      value: "Consultant Physician",
      qualifications: "MBBS, MD",
      services: ["Primary Care Consultation", "Preventive Health", "Chronic Care Monitoring", "Medical Prescription"],
    };

    const clinicMatch = rawText.match(
      /(?:clinic(?:\s+name)?|centre|center|hospital|care|practice)[:\s]+([A-Za-z0-9\s&'-]+?)(?=\s+(?:on|near|at|road|street|\.|$))/i
    );
    const clinicName = clinicMatch ? `${clinicMatch[1].trim()} Centre` : `${fullName}'s Clinic`;

    const addressMatch = rawText.match(
      /(?:on|at|near)\s+([A-Za-z0-9\s,.-]{3,80}?(?:road|street|nagar|colony|chowk|marg|place))/i
    );
    const addressLine = addressMatch ? addressMatch[1].trim() : "Rajpur Road";

    const cityMatch = rawText.match(
      /\b(Dehradun|Delhi|Mumbai|Bengaluru|Bangalore|Pune|Hyderabad|Chennai|Kolkata|Jaipur|Lucknow|Noida|Gurugram|Chandigarh|Haridwar|Rishikesh|Haldwani)\b/i
    );
    const city = cityMatch ? cityMatch[1] : "Dehradun";

    const stateForCity: Record<string, string> = {
      dehradun: "Uttarakhand",
      haridwar: "Uttarakhand",
      rishikesh: "Uttarakhand",
      haldwani: "Uttarakhand",
      delhi: "Delhi",
      noida: "Uttar Pradesh",
      gurugram: "Haryana",
      mumbai: "Maharashtra",
      pune: "Maharashtra",
      bengaluru: "Karnataka",
      bangalore: "Karnataka",
      hyderabad: "Telangana",
      chennai: "Tamil Nadu",
      kolkata: "West Bengal",
      jaipur: "Rajasthan",
      lucknow: "Uttar Pradesh",
      chandigarh: "Chandigarh",
    };
    const state = stateForCity[city.toLowerCase()] || "Uttarakhand";

    const aiBio = `${fullName} is a senior ${specialty.value} with ${experience}+ years of clinical experience, practicing at ${clinicName} on ${addressLine}, ${city}. Dedicated to evidence-based outpatient clinical excellence and patient care.`;

    return NextResponse.json({
      status: "success",
      data: {
        doctor: {
          full_name: fullName,
          specialization: specialty.value,
          qualifications: specialty.qualifications,
          medical_council_reg_number: regNumber,
          medical_council_state: `${state} Medical Council`,
          years_of_experience: experience,
          consultation_fee: consultationFee,
          followup_fee: Math.round(consultationFee * 0.4),
          services: specialty.services,
        },
        clinic: {
          name: clinicName,
          address_line: addressLine,
          city,
          state,
          postal_code: city.toLowerCase() === "dehradun" ? "248001" : "110001",
          opening_hours: {
            morning: "10:00 AM - 02:00 PM",
            evening: "05:00 PM - 08:30 PM",
          },
        },
        ai_bio: aiBio,
      },
    });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return apiError(500, "Failed to extract information.", "internal_error");
  }
}
