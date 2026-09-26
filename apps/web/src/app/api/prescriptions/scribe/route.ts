import { NextRequest, NextResponse } from "next/server";
import { authorizeClinicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SCRIBE_SYSTEM_PROMPT = `You are a clinical AI Scribe for an Indian medical clinic. 
Your job is to extract structured prescription data from a doctor's voice dictation or typed notes.

Extract and return ONLY valid JSON (no markdown, no explanation) in this exact format:
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
      "medicine_name": "Brand Name (e.g. Tab Dolo 650)",
      "generic_name": "GENERIC NAME IN CAPS",
      "dosage_form": "Tablet|Capsule|Syrup|Ointment|Injection|Gel|Drops",
      "strength": "e.g. 500mg",
      "frequency": "e.g. 1-0-1 (morning-afternoon-night)",
      "duration": "e.g. 5 Days",
      "special_instructions": "e.g. After food"
    }
  ],
  "lab_tests": ["test name 1", "test name 2"],
  "diet_advice": "string",
  "followup_advice": "string"
}

Rules:
- Use standard Indian pharmacy brand names when possible
- Frequency format: morning-afternoon-night as numbers (e.g. 1-0-1, 0-0-1)
- If a field is not mentioned, use null for vitals, empty array for lists, empty string for text
- For diagnosis, use standard medical terminology
- Extract ALL medicines mentioned, even generic ones`;

export async function POST(req: NextRequest) {
  try {
    // 🔐 Auth Guard — only authenticated clinic users can use AI Scribe
    let auth;
    try {
      auth = await authorizeClinicUser(req, {
        requiredRoles: ["owner", "clinic_admin", "doctor", "superadmin"],
      });
    } catch (authErr: any) {
      return NextResponse.json(
        { error: "Unauthorized: Valid doctor or clinic session required for AI Scribe.", detail: authErr.message },
        { status: authErr.status || 401 }
      );
    }

    const body = await req.json();
    const dictation = (body.dictation_text || body.text || "").trim();

    if (!dictation) {
      return NextResponse.json({ error: "No dictation text provided" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "AI Scribe is not configured. GROQ_API_KEY missing." }, { status: 503 });
    }

    // Call GROQ LLaMA API
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: SCRIBE_SYSTEM_PROMPT },
          { role: "user", content: `Doctor's dictation: "${dictation}"` },
        ],
        temperature: 0.1,       // Low temperature for consistent structured output
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("GROQ API error:", errText);
      return NextResponse.json(
        { error: "AI Scribe service temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData?.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      console.error("GROQ returned non-JSON:", rawContent);
      return NextResponse.json(
        { error: "AI could not parse dictation. Please try rephrasing." },
        { status: 422 }
      );
    }

    // Normalize and sanitize the AI output
    const result = {
      vitals: {
        bp: parsed.vitals?.bp || null,
        pulse: parsed.vitals?.pulse || null,
        temp: parsed.vitals?.temp || null,
        spo2: parsed.vitals?.spo2 || null,
        weight: parsed.vitals?.weight || null,
        height: parsed.vitals?.height || null,
      },
      chief_complaints: parsed.chief_complaints || dictation.slice(0, 150),
      provisional_diagnosis: parsed.provisional_diagnosis || "Clinical Evaluation",
      medicines: (parsed.medicines || []).map((m: any) => ({
        medicine_name: m.medicine_name || "Medicine",
        generic_name: (m.generic_name || "").toUpperCase(),
        dosage_form: m.dosage_form || "Tablet",
        strength: m.strength || "",
        frequency: m.frequency || "1-0-1",
        duration: m.duration || "5 Days",
        special_instructions: m.special_instructions || "As directed",
      })),
      lab_tests: Array.isArray(parsed.lab_tests) ? parsed.lab_tests : [],
      diet_advice: parsed.diet_advice || "",
      followup_advice: parsed.followup_advice || "Follow up after 7 days or sooner if symptoms persist.",
    };

    return NextResponse.json({
      status: "success",
      model: "llama3-8b-8192",
      scribed_by: auth.user.full_name,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/prescriptions/scribe error:", error);
    return NextResponse.json({ error: error.message || "Failed to process dictation" }, { status: 500 });
  }
}
