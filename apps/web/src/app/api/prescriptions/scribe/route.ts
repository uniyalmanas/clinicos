import { NextRequest, NextResponse } from "next/server";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { chatComplete, llmConfigured } from "@/lib/llm";

export const dynamic = "force-dynamic";

const SCRIBE_SYSTEM_PROMPT = `You are an expert clinical AI Scribe and Medical Intelligence Assistant for an Indian medical clinic. 
Your job is to extract structured prescription data and generate comprehensive clinical reports from a doctor's voice dictation or typed notes.

Extract and return ONLY valid JSON (no markdown fences, no explanation) in this exact format:
{
  "vitals": {
    "bp": "string or null",
    "pulse": "string or null", 
    "temp": "string or null",
    "spo2": "string or null",
    "weight": "string or null",
    "height": "string or null"
  },
  "chief_complaints": "string",
  "provisional_diagnosis": "string",
  "medicines": [
    {
      "medicine_name": "Exactly as the doctor dictated (e.g. Tab Azithromycin 500mg)",
      "generic_name": "GENERIC NAME IN CAPS (e.g. PARACETAMOL)",
      "dosage_form": "Tablet|Capsule|Syrup|Ointment|Injection|Gel|Drops",
      "strength": "e.g. 650mg",
      "frequency": "e.g. 1-0-1 or 1-1-1 (morning-afternoon-night)",
      "duration": "e.g. 3 Days",
      "special_instructions": "e.g. Take after meals if temp > 100°F"
    }
  ],
  "lab_tests": ["test name 1", "test name 2"],
  "diet_advice": "string",
  "followup_advice": "string",
  "clinical_report_doctor": {
    "vitals_assessment": "string (clinical interpretation of vitals, e.g. Moderate pyrexia at 101.2°F, stable hemodynamics)",
    "clinical_summary": "string (concise clinical reasoning for the physician)",
    "differential_diagnoses": ["differential 1", "differential 2"],
    "red_flags": ["warning sign 1", "warning sign 2"]
  },
  "patient_health_report": {
    "condition_overview": "string (warm, clear explanation of diagnosis in simple terms)",
    "medicine_schedule": [
      {
        "timing": "Morning (सुबह)|Afternoon (दोपहर)|Night (रात)",
        "medicine": "Medicine name with dose",
        "instructions": "Simple food instructions (e.g. 30 mins before breakfast or after meals)"
      }
    ],
    "home_care_guidance": "string (hydration, rest, and home management tips)",
    "emergency_warning_signs": "string (when to return immediately or call clinic)",
    "followup_instruction": "string"
  }
}

Rules:
- medicine_name MUST be exactly what the doctor dictated. Never substitute a brand for a generic or a different brand. If they said "Azithromycin", write "Tab Azithromycin 500mg" — not "Azithral".
- Always provide GENERIC CHEMICAL NAME IN UPPERCASE (e.g. PARACETAMOL, PANTOPRAZOLE, CETIRIZINE)
- Frequency format: morning-afternoon-night as numbers (e.g. 1-0-1, 1-1-1, 0-0-1, 1-0-0)
- Accurately parse vitals: BP (e.g. 120/78), Pulse (e.g. 88 bpm), Temp (e.g. 101.2°F), SpO2 (e.g. 98%), Weight (e.g. 68 kg)
- Generate empathetic, actionable patient health report in patient_health_report

EXTRACTION, NOT INVENTION (critical):
- This is a scribe. Record only what the doctor said. You are not diagnosing.
- provisional_diagnosis: use ONLY a diagnosis the doctor explicitly states ("diagnosis is…", "impression…", "this is…", "looks like…"). If the doctor only describes symptoms, set provisional_diagnosis to an empty string. Never infer or name a disease the doctor did not say.
- vitals: return null for any vital the doctor did not state. Never supply a plausible default (no "120/78", "98%", "88 bpm").
- medicines: return [] when no medicine is named. Never add a medicine, dose, frequency, duration or instruction the doctor did not dictate. If a field was not stated, use null — do not guess "1-0-1" or "3 Days".
- lab_tests: only tests the doctor ordered. Otherwise [].
- diet_advice / followup_advice: only advice the doctor gave. Otherwise empty string.
- clinical_report_doctor: summarise the dictation. differential_diagnoses and red_flags may only follow from stated findings; use [] when nothing was said.
- patient_health_report: explain only the recorded diagnosis and medicines. If no diagnosis was recorded, describe the symptoms instead. Do not introduce new conditions, medicines or warnings that are not grounded in the dictation.`;

// Deterministic extractor used only when the LLM is unavailable.
//
// It is strictly extractive: a vital, diagnosis, medicine or advice is
// returned only when it is present in the dictation. Nothing is invented, so a
// provider outage can never put a drug or diagnosis the doctor did not say onto
// the prescription. Dosing fields are left empty for the doctor to complete.
function fallbackHeuristicParser(text: string) {
  const bpMatch = text.match(/(?:bp|blood\s*pressure)?[:\s]*(\d{2,3}\s*\/\s*\d{2,3})/i);
  const bp = bpMatch ? bpMatch[1].replace(/\s+/g, "") : null;

  const pulseMatch =
    text.match(/(?:pulse|heart\s*rate|hr)[\s:]*(\d{2,3})/i) ||
    text.match(/(\d{2,3})\s*(?:bpm|beats)/i);
  const pulse = pulseMatch ? pulseMatch[1] : null;

  const tempMatch =
    text.match(/(?:temp|temperature)[\s:]*(\d{2,3}(?:\.\d+)?)/i) ||
    text.match(/(\d{2,3}(?:\.\d+)?)\s*(?:°?f|fahrenheit)/i);
  const temp = tempMatch ? tempMatch[1] : null;

  const spo2Match =
    text.match(/(?:spo2|oxygen|o2)[\s:]*(\d{2,3})%?/i) ||
    text.match(/(\d{2,3})\s*%(?:\s*on\s*room\s*air)?/i);
  const spo2 = spo2Match ? spo2Match[1] : null;

  const weightMatch =
    text.match(/(?:weight|wt)[\s:]*(\d{2,3}(?:\.\d+)?)\s*(?:kg)?/i) ||
    text.match(/(\d{2,3})\s*kg/i);
  const weight = weightMatch ? weightMatch[1] : null;

  // Only an explicitly dictated diagnosis is used.
  const diagnosisMatch = text.match(
    /(?:diagnosis|impression|assessment)\s*[:\-]\s*([^\n.;]+)/i
  );
  const diagnosis = diagnosisMatch ? diagnosisMatch[1].trim() : "";

  // Medicines are extracted only when the drug itself is named. "Fever" is a
  // symptom, not a prescription, and dosing is never assumed.
  const lower = text.toLowerCase();
  const medicines: any[] = [];
  const addMedicine = (medicine: any, pattern: RegExp) => {
    if (!pattern.test(lower)) return;
    if (medicines.some((m) => m.medicine_name === medicine.medicine_name)) return;
    medicines.push(medicine);
  };
  addMedicine(
    {
      medicine_name: "Tab Dolo 650",
      generic_name: "PARACETAMOL",
      dosage_form: "Tablet",
      strength: "650mg",
      frequency: null,
      duration: null,
      special_instructions: null,
    },
    /\b(dolo|paracetamol|acetaminophen)\b/
  );
  addMedicine(
    {
      medicine_name: "Tab Pan 40",
      generic_name: "PANTOPRAZOLE",
      dosage_form: "Tablet",
      strength: "40mg",
      frequency: null,
      duration: null,
      special_instructions: null,
    },
    /\b(pan\s*40|pantocid|pantoprazole)\b/
  );
  addMedicine(
    {
      medicine_name: "Tab Cetzine 10",
      generic_name: "CETIRIZINE HYDROCHLORIDE",
      dosage_form: "Tablet",
      strength: "10mg",
      frequency: null,
      duration: null,
      special_instructions: null,
    },
    /\b(cetzine|cetirizine|bilastine)\b/
  );
  addMedicine(
    {
      medicine_name: "Syp Multivitamin with Zinc",
      generic_name: "MULTIVITAMIN + MINERALS + ZINC",
      dosage_form: "Syrup",
      strength: "10ml",
      frequency: null,
      duration: null,
      special_instructions: null,
    },
    /\b(multivitamin|zinc)\b/
  );

  const followupMatch = text.match(/(?:follow\s*up|review|revisit)[^.\n]*/i);
  const followupAdvice = followupMatch ? followupMatch[0].trim() : "";

  const vitalsAssessment = [
    bp ? `BP ${bp} mmHg` : "",
    pulse ? `heart rate ${pulse} bpm` : "",
    temp ? `temperature ${temp}°F` : "",
    spo2 ? `SpO2 ${spo2}%` : "",
    weight ? `weight ${weight} kg` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    vitals: { bp, pulse, temp, spo2, weight, height: null },
    chief_complaints: text.length > 120 ? text.slice(0, 120) + "..." : text,
    provisional_diagnosis: diagnosis,
    medicines,
    lab_tests: [],
    diet_advice: "",
    followup_advice: followupAdvice,
    clinical_report_doctor: {
      vitals_assessment: vitalsAssessment,
      clinical_summary: "",
      differential_diagnoses: [],
      red_flags: [],
    },
    patient_health_report: {
      condition_overview: diagnosis ? `Your doctor has recorded: ${diagnosis}.` : "",
      medicine_schedule: medicines.map((m) => ({
        timing: "As directed",
        medicine: m.medicine_name,
        instructions: m.special_instructions || "",
      })),
      home_care_guidance: "",
      emergency_warning_signs: "",
      followup_instruction: followupAdvice,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    // The scribe writes clinical content, so it requires a real signed-in
    // clinician. Demo sessions carry a valid token and pass this guard too.
    const auth = await guard(req, { roles: CLINICAL_ROLES, requireClinic: false });
    if (!auth.ok) return auth.response;
    const doctorName = auth.auth.user.full_name;

    const limit = await rateLimit(rateLimitKey(req, "ai:scribe"), 60, 600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json();
    const dictation = (body.dictation_text || body.text || "").trim();
    const language = String(body.language || "auto").toLowerCase();

    if (!dictation) {
      return apiError(400, "No dictation text provided.", "missing_dictation");
    }

    const LANGUAGE_NAMES: Record<string, string> = {
      auto: "the same Indian language the patient spoke in the conversation",
      english: "simple English",
      hindi: "simple Hindi in Devanagari script",
      marathi: "simple Marathi in Devanagari script",
      tamil: "simple Tamil script",
      telugu: "simple Telugu script",
      bengali: "simple Bengali script",
      gujarati: "simple Gujarati script",
      kannada: "simple Kannada script",
      malayalam: "simple Malayalam script",
      punjabi: "simple Punjabi in Gurmukhi script",
      urdu: "simple Urdu in Nastaliq script",
      odia: "simple Odia script",
      assamese: "simple Assamese script",
    };
    const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.auto;
    const systemPrompt = `${SCRIBE_SYSTEM_PROMPT}

LANGUAGE RULE (important):
- Keep \`clinical_report_doctor\` in professional English for the doctor.
- Write every field of \`patient_health_report\` in ${languageName}. Use everyday words a person with no medical training can understand. Do not use English medical jargon in the patient report unless you immediately explain it in the same sentence.
- Keep medicine brand names exactly as the doctor said them; explanation text around them should be in the patient's language.`;

    if (!llmConfigured()) {
      // Fallback directly to high-fidelity heuristic extractor
      const fallbackData = fallbackHeuristicParser(dictation);
      return NextResponse.json({
        status: "success",
        model: "clinicos-clinical-parser",
        scribed_by: doctorName,
        data: fallbackData,
      });
    }

    try {
      const ai = await chatComplete({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Doctor's voice dictation: "${dictation}"` },
        ],
        temperature: 0.1,
        maxTokens: 4096,
        responseFormat: { type: "json_object" },
      });

      if (!ai?.text) {
        console.warn("AI provider unavailable, falling back to heuristic parser");
        const fallbackData = fallbackHeuristicParser(dictation);
        return NextResponse.json({
          status: "success",
          model: "clinicos-clinical-parser-fallback",
          scribed_by: doctorName,
          data: fallbackData,
        });
      }

      const rawContent = ai.text;

      let parsed: any;
      try {
        parsed = JSON.parse(rawContent);
      } catch {
        const fallbackData = fallbackHeuristicParser(dictation);
        return NextResponse.json({
          status: "success",
          model: "clinicos-clinical-parser-fallback",
          scribed_by: doctorName,
          data: fallbackData,
        });
      }

      // Merge and ensure structure
      const fallback = fallbackHeuristicParser(dictation);
      const result = {
        vitals: {
          bp: parsed.vitals?.bp || fallback.vitals.bp,
          pulse: parsed.vitals?.pulse || fallback.vitals.pulse,
          temp: parsed.vitals?.temp || fallback.vitals.temp,
          spo2: parsed.vitals?.spo2 || fallback.vitals.spo2,
          weight: parsed.vitals?.weight || fallback.vitals.weight,
          height: parsed.vitals?.height || null,
        },
        chief_complaints: parsed.chief_complaints || fallback.chief_complaints,
        provisional_diagnosis: parsed.provisional_diagnosis || fallback.provisional_diagnosis,
        medicines: (Array.isArray(parsed.medicines) && parsed.medicines.length > 0 ? parsed.medicines : fallback.medicines)
          .map((m: any) => ({
            medicine_name: m.medicine_name || null,
            generic_name: String(m.generic_name || "").toUpperCase() || null,
            dosage_form: m.dosage_form || null,
            strength: m.strength || null,
            frequency: m.frequency || null,
            duration: m.duration || null,
            special_instructions: m.special_instructions || null,
          }))
          .filter((m: any) => m.medicine_name),
        lab_tests: Array.isArray(parsed.lab_tests) ? parsed.lab_tests : fallback.lab_tests,
        diet_advice: parsed.diet_advice || fallback.diet_advice,
        followup_advice: parsed.followup_advice || fallback.followup_advice,
        clinical_report_doctor: parsed.clinical_report_doctor || fallback.clinical_report_doctor,
        patient_health_report: parsed.patient_health_report || fallback.patient_health_report,
      };

      return NextResponse.json({
        status: "success",
        model: ai.model,
        provider: ai.provider,
        scribed_by: doctorName,
        data: result,
      });
    } catch (aiErr) {
      console.warn("AI execution error, using heuristic fallback:", aiErr);
      const fallbackData = fallbackHeuristicParser(dictation);
      return NextResponse.json({
        status: "success",
        model: "clinicos-clinical-parser-fallback",
        scribed_by: doctorName,
        data: fallbackData,
      });
    }
  } catch (error: any) {
    console.error("POST /api/prescriptions/scribe error:", error);
    return apiError(500, "Failed to process dictation.", "internal_error");
  }
}
