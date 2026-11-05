import { NextRequest, NextResponse } from "next/server";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import {
  extractClinicalMemoryFromTranscript,
  handleDoctorCommand,
  generateDoctorClinicalReport,
  generatePatientVisitSummary,
} from "@/lib/clinical-companion-service";
import type { ClinicalMemory, HistoricalVisitSummary } from "@/lib/clinical-companion-types";
import type { ConsultationLanguage } from "@/lib/consultation-types";

export const dynamic = "force-dynamic";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-20b";

export async function POST(req: NextRequest) {
  try {
    let doctorName = "Dr. Rahul Sharma";
    let clinicName = "ClinicOS Care Network";

    try {
      const auth = await guard(req, { roles: CLINICAL_ROLES, requireClinic: false });
      if (auth.ok) {
        doctorName = auth.auth.user.full_name || doctorName;
        if (auth.auth.clinic?.name) {
          clinicName = auth.auth.clinic.name;
        }
      }
    } catch {
      // Demo consultation cockpit
    }

    const limit = await rateLimit(rateLimitKey(req, "ai:companion"), 120, 600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json();
    const action = body.action || "process_transcript";
    const memory: ClinicalMemory = body.memory;

    if (!memory) {
      return apiError(400, "Missing current clinical memory state.", "missing_memory");
    }

    // ─────────────────────────────────────────────────────────────
    // 1. DOCTOR COMMAND / CONVERSATION
    // ─────────────────────────────────────────────────────────────
    if (action === "doctor_command") {
      const command = String(body.command || "").trim();
      if (!command) {
        return apiError(400, "Missing command.", "missing_command");
      }
      const historicalVisits: HistoricalVisitSummary[] = body.historical_visits || [];

      // Check if we can enhance command reasoning via Groq LLM if key present
      const groqApiKey = process.env.GROQ_API_KEY;
      if (groqApiKey && (command.startsWith("?") || command.length > 25)) {
        try {
          const sysPrompt = `You are ClinicOS AI Clinical Companion. The doctor is in active consultation with patient ${memory.patient_name} (${memory.patient_uhid}).
Current Memory:
- Diagnosis: ${memory.provisional_diagnosis || "None"}
- Complaints: ${memory.complaints.map(c => c.symptom).join(", ") || "None"}
- Vitals: BP ${memory.vitals.bp_systolic || "?"}/${memory.vitals.bp_diastolic || "?"}, HR ${memory.vitals.heart_rate || "?"}, Temp ${memory.vitals.temperature || "?"}
- Medications: ${memory.medications.map(m => m.medicine_name).join(", ") || "None"}

Respond concisely in 1-2 professional sentences to the doctor. Do not make up facts.`;

          const groqRes = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: GROQ_CHAT_MODEL,
              messages: [
                { role: "system", content: sysPrompt },
                { role: "user", content: command },
              ],
              temperature: 0.2,
              max_tokens: 256,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const aiReply = data?.choices?.[0]?.message?.content?.trim();
            if (aiReply) {
              const localResult = handleDoctorCommand(command, memory, historicalVisits);
              return NextResponse.json({
                status: "success",
                reply: aiReply,
                spokenReply: aiReply,
                updatedMemory: localResult.updatedMemory,
                actionTaken: localResult.actionTaken,
              });
            }
          }
        } catch (e) {
          console.warn("Groq command error, using heuristic engine:", e);
        }
      }

      const result = handleDoctorCommand(command, memory, historicalVisits);
      return NextResponse.json({
        status: "success",
        reply: result.reply,
        spokenReply: result.spokenReply,
        updatedMemory: result.updatedMemory,
        actionTaken: result.actionTaken,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. PROCESS TRANSCRIPT / CHUNK
    // ─────────────────────────────────────────────────────────────
    if (action === "process_transcript" || action === "process_chunk") {
      const transcript = String(body.transcript || body.text || "").trim();
      if (!transcript) {
        return NextResponse.json({
          status: "success",
          updatedMemory: memory,
          clarifications: [],
        });
      }

      const result = extractClinicalMemoryFromTranscript(transcript, memory);
      return NextResponse.json({
        status: "success",
        updatedMemory: result.updatedMemory,
        clarifications: result.clarifications,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 3. GENERATE REPORTS (DOCTOR CLINICAL REPORT + PATIENT SUMMARY)
    // ─────────────────────────────────────────────────────────────
    if (action === "generate_reports") {
      const language = (body.language || "english") as ConsultationLanguage;
      const clinicPhone = body.clinic_phone || "+91 91234 56789";

      const doctorReport = generateDoctorClinicalReport(memory, clinicName);
      const patientSummary = generatePatientVisitSummary(memory, language, clinicName, clinicPhone);

      return NextResponse.json({
        status: "success",
        doctor_report: doctorReport,
        patient_summary: patientSummary,
      });
    }

    return apiError(400, `Unknown action: ${action}`, "invalid_action");
  } catch (error: any) {
    console.error("POST /api/consultations/companion error:", error);
    return apiError(500, "Internal error in AI clinical companion.", "companion_error");
  }
}
