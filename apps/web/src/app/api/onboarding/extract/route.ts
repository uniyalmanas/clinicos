import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { chatComplete, llmConfigured } from "@/lib/llm";

export const dynamic = "force-dynamic";

const EXTRACT_SYSTEM_PROMPT = `You are a data-entry assistant for a medical clinic onboarding form in India.
Extract ONLY what the supplied text actually says. Return ONLY valid JSON (no markdown, no explanation):
{
  "doctor": {
    "full_name": "string — only if a doctor name is written, else \"\"",
    "specialization": "string — only if a specialty is written, else \"\"",
    "qualifications": "string — only if qualifications are written, else \"\"",
    "medical_council_reg_number": "string — only if a registration number is written, else \"\"",
    "medical_council_state": "string — only if a council/state is written, else \"\"",
    "years_of_experience": number — 0 if not stated,
    "consultation_fee": number — 0 if not stated,
    "followup_fee": number — 0 if not stated,
    "services": ["only services explicitly listed"]
  },
  "clinic": {
    "name": "string — only if a clinic name is written, else \"\"",
    "address_line": "string — only if an address is written, else \"\"",
    "city": "string — only if a city is written, else \"\"",
    "state": "string — only if a state is written, else \"\"",
    "postal_code": "string — only if a PIN code is written, else \"\"",
    "opening_hours": {
      "morning": "exact written range or \"\"",
      "evening": "exact written range or \"\""
    }
  },
  "ai_bio": "string — one or two sentences restating only the extracted facts; \"\" if there is not enough information"
}
Hard rules:
- Never invent a name, registration number, qualification, experience, fee, address, city, state, PIN code, or timing.
- Do not infer or guess a medical council registration number under any circumstance.
- Do not fill in services that were not written.
- Leave a field as "" or 0 when the source text does not contain it.`;

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

const STATE_FOR_CITY: Record<string, string> = {
  dehradun: "Uttarakhand", haridwar: "Uttarakhand", rishikesh: "Uttarakhand",
  haldwani: "Uttarakhand", delhi: "Delhi", noida: "Uttar Pradesh",
  gurugram: "Haryana", mumbai: "Maharashtra", pune: "Maharashtra",
  bengaluru: "Karnataka", bangalore: "Karnataka", hyderabad: "Telangana",
  chennai: "Tamil Nadu", kolkata: "West Bengal", jaipur: "Rajasthan",
  lucknow: "Uttar Pradesh", chandigarh: "Chandigarh",
};

function normText(value: unknown) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function presentInSource(value: unknown, source: string) {
  const v = normText(value);
  return Boolean(v) && normText(source).includes(v);
}

/**
 * Drop anything the model returned that is not literally supported by the
 * pasted text. Model output is treated as untrusted data-entry, not truth.
 */
function sanitiseAgainstSource(result: any, rawText: string) {
  const keep = (value: unknown) =>
    presentInSource(value, rawText) ? String(value) : "";
  const doctor = result.doctor || {};
  const clinic = result.clinic || {};

  doctor.full_name = keep(doctor.full_name);
  doctor.specialization = keep(doctor.specialization);
  doctor.qualifications = keep(doctor.qualifications);
  doctor.medical_council_reg_number = keep(doctor.medical_council_reg_number);
  doctor.medical_council_state = /council/i.test(rawText)
    ? keep(doctor.medical_council_state)
    : "";
  doctor.services = Array.isArray(doctor.services)
    ? doctor.services.filter((s: unknown) => presentInSource(s, rawText))
    : [];

  const years = Number(doctor.years_of_experience) || 0;
  doctor.years_of_experience = presentInSource(years, rawText) ? years : 0;
  const fee = Number(doctor.consultation_fee) || 0;
  doctor.consultation_fee = presentInSource(fee, rawText) ? fee : 0;
  const followup = Number(doctor.followup_fee) || 0;
  doctor.followup_fee = presentInSource(followup, rawText) ? followup : 0;

  clinic.name = keep(clinic.name);
  clinic.address_line = keep(clinic.address_line);
  clinic.city = keep(clinic.city);
  clinic.state = keep(clinic.state);
  clinic.postal_code = keep(clinic.postal_code);
  if (clinic.city) {
    const mapped = STATE_FOR_CITY[String(clinic.city).toLowerCase()];
    if (!clinic.state && mapped) clinic.state = mapped;
  }
  const hours = clinic.opening_hours || {};
  clinic.opening_hours = {
    morning: keep(hours.morning),
    evening: keep(hours.evening),
  };

  return {
    doctor: {
      full_name: doctor.full_name || "",
      specialization: doctor.specialization || "",
      qualifications: doctor.qualifications || "",
      medical_council_reg_number: doctor.medical_council_reg_number || "",
      medical_council_state: doctor.medical_council_state || "",
      years_of_experience: doctor.years_of_experience || 0,
      consultation_fee: doctor.consultation_fee || 0,
      followup_fee: doctor.followup_fee || 0,
      services: doctor.services || [],
    },
    clinic: {
      name: clinic.name || "",
      address_line: clinic.address_line || "",
      city: clinic.city || "",
      state: clinic.state || "",
      postal_code: clinic.postal_code || "",
      opening_hours: clinic.opening_hours,
    },
    ai_bio: "",
  };
}

function regexExtract(rawText: string) {
  // Strictly extractive: each field is only filled when it is literally present
  // in the pasted text. Nothing is defaulted or synthesised.
  const nameMatch = rawText.match(/\bDr\.?\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,3})/i);
  const fullName = nameMatch ? `Dr. ${nameMatch[1].trim()}` : "";

  const regMatch = rawText.match(/\b([A-Z]{2,6}-?\d{3,8}(?:-\d{2,4})?)\b/);
  const regNumber = regMatch ? regMatch[1].toUpperCase() : "";

  const expMatch = rawText.match(/(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)/i);
  const experience = expMatch ? Number.parseInt(expMatch[1], 10) : 0;

  const feeMatch =
    rawText.match(/(?:fee|charges|consultation)[:\s]*₹?\s*(\d{3,5})/i) ||
    rawText.match(/₹\s*(\d{3,5})/);
  const consultationFee = feeMatch ? Number.parseInt(feeMatch[1], 10) : 0;

  const followupMatch = rawText.match(/follow[\s-]?up[:\s]*₹?\s*(\d{3,5})/i);
  const followupFee = followupMatch ? Number.parseInt(followupMatch[1], 10) : 0;

  const qualificationMatch = rawText.match(
    /\b((?:MBBS|BDS|MDS|MD|MS|DM|MCh|DNB|BAMS|BHMS)(?:\s*\([^)]*\))?(?:,\s*(?:MBBS|BDS|MDS|MD|MS|DM|MCh|DNB|BAMS|BHMS)(?:\s*\([^)]*\))?)*)/i
  );
  const qualifications = qualificationMatch ? qualificationMatch[1].trim() : "";

  const specialty = SPECIALTIES.find((s) => s.test.test(rawText));

  const clinicMatch = rawText.match(
    /(?:clinic(?:\s+name)?|centre|center|hospital|care|practice)[:\s]+([A-Za-z0-9\s&'-]+?)(?=\s+(?:on|near|at|road|street|\.|$))/i
  );
  const clinicName = clinicMatch ? clinicMatch[1].trim() : "";

  const addressMatch = rawText.match(
    /(?:on|at|near)\s+([A-Za-z0-9\s,.-]{3,80}?(?:road|street|nagar|colony|chowk|marg|place))/i
  );
  const addressLine = addressMatch ? addressMatch[1].trim() : "";

  const cityMatch = rawText.match(
    /\b(Dehradun|Delhi|Mumbai|Bengaluru|Bangalore|Pune|Hyderabad|Chennai|Kolkata|Jaipur|Lucknow|Noida|Gurugram|Chandigarh|Haridwar|Rishikesh|Haldwani)\b/i
  );
  const city = cityMatch ? cityMatch[1] : "";

  // A state is only assigned when the city came from the text; this is a
  // lookup of the city the user wrote, not an invented location.
  const state = city ? STATE_FOR_CITY[city.toLowerCase()] || "" : "";

  const postalMatch = rawText.match(/\b(\d{6})\b/);
  const postalCode = postalMatch ? postalMatch[1] : "";

  const timeRanges = rawText.match(
    /\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*(?:-|–|to)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)/gi
  ) || [];

  const bioParts: string[] = [];
  if (fullName) {
    bioParts.push(`${fullName}${specialty ? ` is a ${specialty.value}` : ""}.`);
  }
  if (clinicName) {
    bioParts.push(`Practises at ${clinicName}${city ? `, ${city}` : ""}.`);
  }

  return {
    doctor: {
      full_name: fullName,
      specialization: specialty ? specialty.value : "",
      qualifications,
      medical_council_reg_number: regNumber,
      medical_council_state: "",
      years_of_experience: experience,
      consultation_fee: consultationFee,
      followup_fee: followupFee,
      services: [],
    },
    clinic: {
      name: clinicName,
      address_line: addressLine,
      city,
      state,
      postal_code: postalCode,
      opening_hours: { morning: timeRanges[0] || "", evening: timeRanges[1] || "" },
    },
    ai_bio: bioParts.join(" "),
  };
}

function missingFields(data: any) {
  const missing: string[] = [];
  if (!data?.doctor?.full_name) missing.push("doctor name");
  if (!data?.doctor?.specialization) missing.push("specialization");
  if (!data?.doctor?.qualifications) missing.push("qualifications");
  if (!data?.doctor?.medical_council_reg_number) missing.push("council registration number");
  if (!data?.doctor?.consultation_fee) missing.push("consultation fee");
  if (!data?.clinic?.name) missing.push("clinic name");
  if (!data?.clinic?.address_line) missing.push("clinic address");
  if (!data?.clinic?.city) missing.push("city");
  if (!data?.clinic?.state) missing.push("state");
  return missing;
}

function buildBio(doctor: any, clinic: any) {
  const parts: string[] = [];
  if (doctor.full_name) {
    parts.push(`${doctor.full_name}${doctor.specialization ? ` — ${doctor.specialization}` : ""}.`);
  }
  if (doctor.qualifications) {
    parts.push(`Qualifications: ${doctor.qualifications}.`);
  }
  if (clinic.name) {
    parts.push(`Practises at ${clinic.name}${clinic.city ? `, ${clinic.city}` : ""}.`);
  }
  return parts.join(" ");
}

function extractionPayload(data: any, extra: Record<string, any> = {}) {
  const missing = missingFields(data);
  return {
    status: "success",
    ...extra,
    needs_review: missing.length > 0,
    missing_fields: missing,
    data,
  };
}

export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "onboarding:extract"), 10, 3600);
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

    // Cap the input so a single request cannot burn an unbounded amount of
    // upstream tokens or memory. 4,000 characters is more than a full profile.
    const MAX_RAW_TEXT = 4000;
    if (rawText.length > MAX_RAW_TEXT) {
      return apiError(
        413,
        `raw_text must be ${MAX_RAW_TEXT} characters or fewer.`,
        "text_too_large"
      );
    }

    const fallback = regexExtract(rawText);

    // Try the configured AI provider first — fall back to regex if unavailable.
    if (!llmConfigured()) {
      return NextResponse.json(extractionPayload(fallback, { source: "regex" }));
    }

    try {
      const ai = await chatComplete({
        messages: [
          { role: "system", content: EXTRACT_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract clinic and doctor information from this text:\n\n"${rawText}"`,
          },
        ],
        temperature: 0.1,
        maxTokens: 1500,
        responseFormat: { type: "json_object" },
        timeoutMs: 15_000,
      });

      if (!ai?.text) {
        console.warn("AI extraction unavailable, using regex fallback");
        return NextResponse.json(extractionPayload(fallback, { source: "regex" }));
      }

      const rawContent = ai.text;
      let parsed: any;
      try { parsed = JSON.parse(rawContent); } catch {
        return NextResponse.json(extractionPayload(fallback, { source: "regex" }));
      }

      const aiResult = sanitiseAgainstSource(
        {
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
          ai_bio: "",
        },
        rawText
      );
      aiResult.ai_bio = buildBio(aiResult.doctor, aiResult.clinic);

      return NextResponse.json(
        extractionPayload(aiResult, {
          source: "ai",
          model: ai.model,
          provider: ai.provider,
        })
      );
    } catch (aiErr) {
      console.warn("AI extraction failed, using regex fallback:", aiErr);
      return NextResponse.json(extractionPayload(fallback, { source: "regex" }));
    }
  } catch (error: any) {
    console.error("Extraction error:", error);
    return apiError(500, "Failed to extract information.", "internal_error");
  }
}
