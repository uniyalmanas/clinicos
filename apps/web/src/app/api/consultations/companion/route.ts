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
import { chatComplete } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // This route generates clinical reports, so it requires a real clinician.
    const auth = await guard(req, { roles: CLINICAL_ROLES, requireClinic: false });
    if (!auth.ok) return auth.response;
    const clinicName = auth.auth.clinic?.name || "";

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

      // Enhance command reasoning with the configured LLM provider.
      if (command.startsWith("?") || command.length > 25) {
        try {
          const sysPrompt = `You are ClinicOS AI Clinical Companion. The doctor is in active consultation with patient ${memory.patient_name} (${memory.patient_uhid}).
Current Memory:
- Diagnosis: ${memory.provisional_diagnosis || "None"}
- Complaints: ${memory.complaints.map(c => c.symptom).join(", ") || "None"}
- Vitals: BP ${memory.vitals.bp_systolic || "?"}/${memory.vitals.bp_diastolic || "?"}, HR ${memory.vitals.heart_rate || "?"}, Temp ${memory.vitals.temperature || "?"}
- Medications: ${memory.medications.map(m => m.medicine_name).join(", ") || "None"}

Respond concisely in 1-2 professional sentences to the doctor. Do not make up facts.`;

          const ai = await chatComplete({
            messages: [
              { role: "system", content: sysPrompt },
              { role: "user", content: command },
            ],
            temperature: 0.2,
            maxTokens: 256,
          });

          if (ai?.text) {
            const localResult = handleDoctorCommand(command, memory, historicalVisits);
            return NextResponse.json({
              status: "success",
              reply: ai.text,
              spokenReply: ai.text,
              provider: ai.provider,
              model: ai.model,
              updatedMemory: localResult.updatedMemory,
              actionTaken: localResult.actionTaken,
            });
          }
        } catch (e) {
          console.warn("AI command error, using heuristic engine:", e);
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
      const clinicPhone = body.clinic_phone || auth.auth.clinic?.phone || "";

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
