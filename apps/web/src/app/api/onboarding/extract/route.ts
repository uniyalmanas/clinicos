import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";

const EXTRACT_SYSTEM_PROMPT = `You are a medical clinic onboarding assistant for India.
Extract doctor and clinic information from the given text and return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "doctor": {
    "full_name": "string (e.g. Dr. Ramesh Sharma)",
    "specialization": "string (e.g. General Physician, Cardiologist)",
    "qualifications": "string (e.g. MBBS, MD)",
    "medical_council_reg_number": "string or null",
    "medical_council_state": "string (e.g. Uttarakhand Medical Council)",
    "years_of_experience": number,
    "consultation_fee": number,
    "followup_fee": number,
    "services": ["service 1", "service 2"]
  },
  "clinic": {
    "name": "string",
    "address_line": "string",
    "city": "string",
    "state": "string",
    "postal_code": "string or null",
    "opening_hours": {
      "morning": "HH:MM AM - HH:MM PM",
      "evening": "HH:MM PM - HH:MM PM"
    }
  },
  "ai_bio": "string (2-3 sentence professional bio)"
}
Rules:
- If a field is not mentioned, use a reasonable default (never null for required strings).
- Consultation fee default: 500 INR if not mentioned.
- For Indian cities, infer the correct state.
- Generate 3-5 relevant services based on the specialization.`;

// ─── Regex fallback ───────────────────────────────────────────────────────────

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

function regexExtract(rawText: string) {
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
    dehradun: "Uttarakhand", haridwar: "Uttarakhand", rishikesh: "Uttarakhand",
    haldwani: "Uttarakhand", delhi: "Delhi", noida: "Uttar Pradesh",
    gurugram: "Haryana", mumbai: "Maharashtra", pune: "Maharashtra",
    bengaluru: "Karnataka", bangalore: "Karnataka", hyderabad: "Telangana",
    chennai: "Tamil Nadu", kolkata: "West Bengal", jaipur: "Rajasthan",
    lucknow: "Uttar Pradesh", chandigarh: "Chandigarh",
  };
  const state = stateForCity[city.toLowerCase()] || "Uttarakhand";

  return {
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
      opening_hours: { morning: "10:00 AM - 02:00 PM", evening: "05:00 PM - 08:30 PM" },
    },
    ai_bio: `${fullName} is a senior ${specialty.value} with ${experience}+ years of clinical experience, practicing at ${clinicName} on ${addressLine}, ${city}. Dedicated to evidence-based outpatient clinical excellence and patient care.`,
  };
}

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

    const fallback = regexExtract(rawText);

    // Try Groq AI for smarter extraction — fall back to regex if unavailable
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ status: "success", source: "regex", data: fallback });
    }

    try {
      const groqResponse = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_CHAT_MODEL,
          messages: [
            { role: "system", content: EXTRACT_SYSTEM_PROMPT },
            { role: "user", content: `Extract clinic and doctor information from this text:\n\n"${rawText}"` },
          ],
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }),
      });

      if (!groqResponse.ok) {
        console.warn("Groq API error on onboarding extract, using regex fallback");
        return NextResponse.json({ status: "success", source: "regex", data: fallback });
      }

      const groqData = await groqResponse.json();
      const rawContent = groqData?.choices?.[0]?.message?.content || "{}";
      let parsed: any;
      try { parsed = JSON.parse(rawContent); } catch {
        return NextResponse.json({ status: "success", source: "regex", data: fallback });
      }

      const aiResult = {
        doctor: {
          full_name: parsed.doctor?.full_name || fallback.doctor.full_name,
          specialization: parsed.doctor?.specialization || fallback.doctor.specialization,
          qualifications: parsed.doctor?.qualifications || fallback.doctor.qualifications,
          medical_council_reg_number: parsed.doctor?.medical_council_reg_number || fallback.doctor.medical_council_reg_number,
          medical_council_state: parsed.doctor?.medical_council_state || fallback.doctor.medical_council_state,
          years_of_experience: Number(parsed.doctor?.years_of_experience) || fallback.doctor.years_of_experience,
          consultation_fee: Number(parsed.doctor?.consultation_fee) || fallback.doctor.consultation_fee,
          followup_fee: Number(parsed.doctor?.followup_fee) || fallback.doctor.followup_fee,
          services: Array.isArray(parsed.doctor?.services) && parsed.doctor.services.length > 0
            ? parsed.doctor.services : fallback.doctor.services,
        },
        clinic: {
          name: parsed.clinic?.name || fallback.clinic.name,
          address_line: parsed.clinic?.address_line || fallback.clinic.address_line,
          city: parsed.clinic?.city || fallback.clinic.city,
          state: parsed.clinic?.state || fallback.clinic.state,
          postal_code: parsed.clinic?.postal_code || fallback.clinic.postal_code,
          opening_hours: parsed.clinic?.opening_hours || fallback.clinic.opening_hours,
        },
        ai_bio: parsed.ai_bio || fallback.ai_bio,
      };

      return NextResponse.json({ status: "success", source: "ai", data: aiResult });
    } catch (groqErr) {
      console.warn("Groq extraction failed, using regex fallback:", groqErr);
      return NextResponse.json({ status: "success", source: "regex", data: fallback });
    }
  } catch (error: any) {
    console.error("Extraction error:", error);
    return apiError(500, "Failed to extract information.", "internal_error");
  }
}
