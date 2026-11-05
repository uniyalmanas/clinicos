import { NextRequest, NextResponse } from "next/server";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { WHISPER_LANGUAGE_CODE, type ConsultationLanguage } from "@/lib/consultation-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** A 20-minute consultation is comfortably under the default limit. */
export const maxDuration = 60;

const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

/** Groq rejects files above 25 MB. */
const MAX_AUDIO_BYTES = 24 * 1024 * 1024;

/**
 * Transcribe a consultation recording.
 *
 * The audio is forwarded to Whisper (via Groq) and is not written to disk or
 * to our database. Only the returned transcript is persisted later, by the
 * reports endpoint, and only if the doctor approves the report.
 */
export async function POST(req: NextRequest) {
  try {
    // Recording is a clinical action. Allow the demo cockpit (same convention as
    // /api/prescriptions/scribe) but never skip the rate limit.
    try {
      await guard(req, { roles: CLINICAL_ROLES, requireClinic: false });
    } catch {
      // demo consult mode
    }

    const limit = await rateLimit(rateLimitKey(req, "ai:transcribe"), 40, 600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          status: "unavailable",
          code: "transcription_not_configured",
          message:
            "Automatic transcription is not configured on this deployment. Add GROQ_API_KEY to enable it, or type the consultation notes manually.",
        },
        { status: 503 }
      );
    }

    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || audio.size === 0) {
      return apiError(400, "No audio recording was provided.", "missing_audio");
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return apiError(
        413,
        "Recording is too large. Please keep consultations under 20 minutes, or split the recording.",
        "audio_too_large"
      );
    }

    const requestedLanguage = String(form.get("language") || "auto") as ConsultationLanguage;
    const iso = WHISPER_LANGUAGE_CODE[requestedLanguage];

    const upstream = new FormData();
    upstream.append("file", audio, audio.name || "consultation.webm");
    upstream.append("model", "whisper-large-v3");
    upstream.append("response_format", "verbose_json");
    upstream.append("temperature", "0");
    if (iso) upstream.append("language", iso);

    const res = await fetch(GROQ_TRANSCRIBE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Groq transcription failed:", res.status, detail);
      return NextResponse.json(
        {
          status: "error",
          code: "transcription_failed",
          message:
            "The transcription service could not process this recording. You can retry, or type the notes manually.",
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const transcript = String(data?.text || "").trim();

    if (!transcript) {
      return NextResponse.json(
        {
          status: "empty",
          code: "no_speech_detected",
          message:
            "No speech was detected in the recording. Check the microphone, speak a little closer, and try again.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      status: "success",
      transcript,
      language: data?.language || iso || "auto",
      duration_seconds: data?.duration ? Math.round(Number(data.duration)) : null,
    });
  } catch (error) {
    console.error("POST /api/consultations/transcribe error:", error);
    return apiError(500, "Failed to transcribe the consultation.", "internal_error");
  }
}
