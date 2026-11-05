"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Loader2,
  ShieldCheck,
  Sparkles,
  FileText,
  HeartPulse,
  CheckCircle2,
  X,
  Printer,
  Send,
  RotateCcw,
  ChevronDown,
  AlertTriangle,
  Stethoscope,
  Languages,
  Pill,
  Clock,
} from "lucide-react";
import { Button, Card } from "@/components/design-system";
import {
  CONSULTATION_LANGUAGES,
  type ConsultationLanguage,
  type ConsultationReport,
  type DoctorReport,
  type MedicineItem,
  type PatientReport,
} from "@/lib/consultation-types";

type Phase =
  | "idle"
  | "recording"
  | "transcribing"
  | "scribing"
  | "review"
  | "saving"
  | "saved";

type ScribeResult = {
  vitals?: Record<string, string | null>;
  chief_complaints?: string;
  provisional_diagnosis?: string;
  medicines?: MedicineItem[];
  lab_tests?: string[];
  diet_advice?: string;
  followup_advice?: string;
  clinical_report_doctor?: DoctorReport;
  patient_health_report?: PatientReport;
};

export type ConsultationExtraction = {
  diagnosis?: string;
  chiefComplaints?: string;
  vitals?: Record<string, string | null>;
  medicines?: MedicineItem[];
  doctorReport?: DoctorReport;
  patientReport?: PatientReport;
};

type Props = {
  appointmentNumber: string;
  patientName: string;
  patientPhone: string;
  doctorSlug?: string | null;
  doctorName?: string | null;
  onExtracted?: (data: ConsultationExtraction) => void;
  onApproved?: (report: ConsultationReport) => void;
  showToast?: (message: string) => void;
};

const BAR_PATTERN = [0.35, 0.6, 0.45, 0.85, 0.55, 0.95, 0.7, 0.4, 0.8, 0.5, 0.9, 0.65, 0.35, 0.75, 0.5, 0.85, 0.6, 0.4];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ConsultationRecorder({
  appointmentNumber,
  patientName,
  patientPhone,
  doctorSlug,
  doctorName,
  onExtracted,
  onApproved,
  showToast,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [language, setLanguage] = useState<ConsultationLanguage>("auto");
  const [consent, setConsent] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [doctorReport, setDoctorReport] = useState<DoctorReport>({});
  const [patientReport, setPatientReport] = useState<PatientReport>({});
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [labTests, setLabTests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"doctor" | "patient">("doctor");
  const [savedReport, setSavedReport] = useState<ConsultationReport | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const secondsRef = useRef(0);
  const discardRef = useRef(false);

  const toast = showToast || (() => {});

  const stopMedia = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      discardRef.current = true;
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      stopMedia();
    };
  }, [stopMedia]);

  // Reset everything when a different patient is selected.
  useEffect(() => {
    setPhase("idle");
    setTranscript("");
    setDetectedLanguage(null);
    setDiagnosis("");
    setChiefComplaints("");
    setDoctorReport({});
    setPatientReport({});
    setMedicines([]);
    setLabTests([]);
    setSavedReport(null);
    setError(null);
    setNotice(null);
    setSeconds(0);
  }, [appointmentNumber]);

  const monitorLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i += 1) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setLevel(Math.min(1, rms * 4.5));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const transcribe = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      setPhase("transcribing");
      setError(null);
      setNotice(null);

      try {
        const extension = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
        const form = new FormData();
        form.append("audio", blob, `consultation.${extension}`);
        form.append("language", language);

        const res = await fetch("/api/consultations/transcribe", {
          method: "POST",
          headers: authHeaders(),
          body: form,
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || data.error || "Transcription failed.");
        }

        const text = String(data.transcript || "").trim();
        setTranscript(text);
        setDetectedLanguage(data.language || null);
        await scribe(text, durationSeconds);
      } catch (err: any) {
        const message = err?.message || "Could not transcribe this recording.";
        setError(message);
        // Let the doctor type the notes instead of losing the consultation.
        setPhase("review");
        setNotice(
          "Type or paste what was discussed below, then tap “Generate reports”. Nothing was lost."
        );
      }
    },
    // scribe is defined below and stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

  const scribe = useCallback(
    async (text: string, durationSeconds: number) => {
      if (!text.trim()) {
        setPhase("review");
        return;
      }
      setPhase("scribing");
      setError(null);
      try {
        const res = await fetch("/api/prescriptions/scribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ dictation_text: text, language }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Failed to generate the report.");
        }
        const result: ScribeResult = data.data || {};
        setDiagnosis(result.provisional_diagnosis || "");
        setChiefComplaints(result.chief_complaints || "");
        setDoctorReport(result.clinical_report_doctor || {});
        setPatientReport(result.patient_health_report || {});
        setMedicines(Array.isArray(result.medicines) ? result.medicines : []);
        setLabTests(Array.isArray(result.lab_tests) ? result.lab_tests : []);
        setPhase("review");
        // The heuristic parser cannot translate. Never let a doctor believe an
        // English draft is already in the patient's language.
        const usedFallback =
          String(data.model || "").includes("fallback") ||
          data.model === "clinicos-clinical-parser";
        setNotice(
          usedFallback && language !== "english"
            ? "AI translation is unavailable right now, so the patient copy was drafted in English. Please translate it before approving, or add GROQ_API_KEY."
            : null
        );
        onExtracted?.({
          diagnosis: result.provisional_diagnosis,
          chiefComplaints: result.chief_complaints,
          vitals: result.vitals,
          medicines: result.medicines,
          doctorReport: result.clinical_report_doctor,
          patientReport: result.patient_health_report,
        });
        toast("Consultation notes drafted — review before sharing");
      } catch (err: any) {
        setError(err?.message || "Failed to generate the report.");
        setPhase("review");
      }
      void durationSeconds;
    },
    [language, onExtracted, toast]
  );

  const startRecording = useCallback(async () => {
    setError(null);
    setNotice(null);
    if (!consent) {
      setError("Please confirm the patient has agreed to this consultation being recorded.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot access the microphone. Please use Chrome, Edge, or Safari on a phone.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        monitorLevel();
      }

      const mimeType = pickRecorderMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        stopMedia();
        if (discardRef.current) {
          setPhase("idle");
          return;
        }
        if (blob.size < 1200) {
          setError("The recording was too short. Please try again and speak for a few seconds.");
          setPhase("idle");
          return;
        }
        void transcribe(blob, secondsRef.current);
      };

      recorderRef.current = recorder;
      recorder.start(1000);
      secondsRef.current = 0;
      setSeconds(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);
    } catch (err: any) {
      stopMedia();
      setError(
        err?.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow microphone access in your browser settings."
          : err?.message || "Could not start recording."
      );
      setPhase("idle");
    }
  }, [consent, monitorLevel, seconds, stopMedia, transcribe]);

  const stopRecording = useCallback((discard = false) => {
    discardRef.current = discard;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (discard) {
      stopMedia();
      setPhase("idle");
      setSeconds(0);
    }
  }, [stopMedia]);

  const regenerate = useCallback(() => {
    void scribe(transcript, seconds);
  }, [scribe, transcript, seconds]);

  const approve = useCallback(async () => {
    if (!transcript.trim()) {
      setError("A transcript is required before the report can be approved.");
      return;
    }
    setPhase("saving");
    setError(null);
    try {
      const res = await fetch("/api/consultations/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          appointment_number: appointmentNumber,
          patient_name: patientName,
          patient_phone: patientPhone,
          doctor_slug: doctorSlug || null,
          doctor_name: doctorName || null,
          language,
          duration_seconds: seconds || null,
          transcript,
          chief_complaints: chiefComplaints || null,
          provisional_diagnosis: diagnosis || null,
          medicines,
          lab_tests: labTests,
          doctor_report: doctorReport,
          patient_report: patientReport,
          status: "approved",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to save the report.");
      }
      setSavedReport(data.report || null);
      setPhase("saved");
      toast(`Report approved and saved to ${patientName}'s vault`);
      if (data.report) onApproved?.(data.report);
    } catch (err: any) {
      setError(err?.message || "Failed to save the report.");
      setPhase("review");
    }
  }, [
    appointmentNumber,
    chiefComplaints,
    diagnosis,
    doctorName,
    doctorReport,
    doctorSlug,
    labTests,
    language,
    medicines,
    patientName,
    patientPhone,
    patientReport,
    seconds,
    toast,
    transcript,
    onApproved,
  ]);

  const shareOnWhatsApp = useCallback(() => {
    const phone = patientPhone.replace(/[^0-9]/g, "").slice(-10);
    const overview = patientReport.condition_overview || diagnosis || "Your consultation report";
    const followUp = patientReport.followup_instruction ? `\n\nNext step: ${patientReport.followup_instruction}` : "";
    const text = `Namaste ${patientName},\n\nYour consultation summary from today:\n${overview}${followUp}\n\nA full copy is saved in your Clinic OS patient vault.`;
    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }, [diagnosis, patientName, patientPhone, patientReport]);

  const printReport = useCallback(() => {
    const meds = (patientReport.medicine_schedule || [])
      .map(
        (slot) =>
          `<tr><td>${escapeHtml(slot.timing || "")}</td><td>${escapeHtml(slot.medicine || "")}</td><td>${escapeHtml(slot.instructions || "")}</td></tr>`
      )
      .join("");

    const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Consultation Report — ${escapeHtml(patientName)}</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1d1d1f; margin: 40px; line-height: 1.55; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #6e6e73; margin: 24px 0 8px; }
        .meta { color: #6e6e73; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { border: 1px solid #e5e5ea; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f5f6f9; }
        .box { border: 1px solid #e5e5ea; border-radius: 10px; padding: 12px 14px; font-size: 13px; }
        .warn { border-color: #f5c2c7; background: #fff5f5; }
        @media print { body { margin: 16mm; } }
      </style></head><body>
      <h1>Consultation Report</h1>
      <div class="meta">${escapeHtml(patientName)} · ${escapeHtml(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }))}${doctorName ? ` · ${escapeHtml(doctorName)}` : ""}</div>
      <h2>What we found</h2>
      <div class="box">${escapeHtml(patientReport.condition_overview || diagnosis || "")}</div>
      ${
        meds
          ? `<h2>Your medicines</h2><table><thead><tr><th>When</th><th>Medicine</th><th>How to take</th></tr></thead><tbody>${meds}</tbody></table>`
          : ""
      }
      ${patientReport.home_care_guidance ? `<h2>Home care</h2><div class="box">${escapeHtml(patientReport.home_care_guidance)}</div>` : ""}
      ${patientReport.emergency_warning_signs ? `<h2>Return immediately if</h2><div class="box warn">${escapeHtml(patientReport.emergency_warning_signs)}</div>` : ""}
      ${patientReport.followup_instruction ? `<h2>Next visit</h2><div class="box">${escapeHtml(patientReport.followup_instruction)}</div>` : ""}
      </body></html>`;

    // `noopener` makes window.open() return null, so keep the blank same-origin
    // window referencable until we have written and printed the report.
    const win = window.open("", "_blank");
    if (!win) {
      toast("Allow pop-ups to print the report.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }, [diagnosis, doctorName, patientName, patientReport, toast]);

  const reset = useCallback(() => {
    setPhase("idle");
    setTranscript("");
    setDetectedLanguage(null);
    setDiagnosis("");
    setChiefComplaints("");
    setDoctorReport({});
    setPatientReport({});
    setMedicines([]);
    setLabTests([]);
    setSavedReport(null);
    setError(null);
    setNotice(null);
    setSeconds(0);
    setConsent(false);
  }, []);

  const isBusy = phase === "transcribing" || phase === "scribing" || phase === "saving";
  const isRecording = phase === "recording";
  const languageLabel =
    CONSULTATION_LANGUAGES.find((item) => item.value === language)?.label || "Auto-detect";

  const recordButtonClass = isRecording
    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
    : "bg-[#0071E3] text-white shadow-lg shadow-blue-600/25 hover:bg-[#0077ED]";
  const tabDoctorClass =
    activeTab === "doctor"
      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
      : "text-[#6E6E73] dark:text-[#A1A1A6]";
  const tabPatientClass =
    activeTab === "patient"
      ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
      : "text-[#6E6E73] dark:text-[#A1A1A6]";

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3 mb-4 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
              AI Consultation Scribe
            </div>
            <div className="text-[10px] text-[#86868B] dark:text-[#636366]">
              Record once. Doctor gets clinical notes, patient gets plain words.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2 py-1 text-[10px] dark:border-white/[0.08] dark:bg-[#121316]">
            <Languages className="h-3 w-3 text-[#0071E3] dark:text-[#2997FF]" />
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value as ConsultationLanguage)}
              disabled={isRecording || isBusy}
              className="bg-transparent text-[10px] font-semibold text-[#1D1D1F] focus:outline-none dark:text-white"
            >
              {CONSULTATION_LANGUAGES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <span className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Audio not stored
          </span>
        </div>
      </div>

      {/* Recorder */}
      {(phase === "idle" || phase === "recording") && (
        <div className="flex flex-col items-center py-2">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <>
                <span className="absolute h-24 w-24 rounded-full bg-rose-500/20 animate-ping" />
                <span className="absolute h-20 w-20 rounded-full bg-rose-500/10" />
              </>
            )}
            <button
              type="button"
              onClick={isRecording ? () => stopRecording(false) : startRecording}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-95 ${recordButtonClass}`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRecording ? "bg-rose-500 animate-pulse" : "bg-[#C7C7CC] dark:bg-[#48484A]"
              }`}
            />
            <span className="font-mono text-sm font-bold text-[#1D1D1F] dark:text-white">
              {formatTime(seconds)}
            </span>
            <span className="text-[10px] text-[#86868B] dark:text-[#636366]">
              {isRecording ? "Listening to both voices…" : "Tap the microphone to begin"}
            </span>
          </div>

          {/* Level meter */}
          <div className="mt-3 flex h-10 items-end gap-[3px]" aria-hidden="true">
            {BAR_PATTERN.map((weight, index) => {
              const height = isRecording ? 5 + level * 32 * weight : 5;
              return (
                <span
                  key={index}
                  className={`w-[3px] rounded-full transition-all duration-75 ${
                    isRecording ? "bg-rose-500" : "bg-[#D1D1D6] dark:bg-[#3A3A3C]"
                  }`}
                  style={{ height: `${Math.max(4, height)}px` }}
                />
              );
            })}
          </div>

          {isRecording ? (
            <div className="mt-3 flex items-center gap-2">
              <Button variant="outline" onClick={() => stopRecording(true)} className="text-xs">
                <X className="h-3.5 w-3.5" />
                Discard
              </Button>
              <Button variant="primary" onClick={() => stopRecording(false)} className="text-xs">
                <Square className="h-3 w-3" />
                Stop &amp; write report
              </Button>
            </div>
          ) : (
            <label className="mt-3 flex max-w-md items-start gap-2 rounded-xl border border-black/[0.06] bg-[#F5F6F9] p-2.5 text-[10px] leading-relaxed text-[#6E6E73] dark:border-white/[0.08] dark:bg-[#121316] dark:text-[#A1A1A6]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[#0071E3]"
              />
              <span>
                The patient has been told this conversation will be recorded so their visit
                summary can be written. Audio is transcribed once and never stored.
              </span>
            </label>
          )}
        </div>
      )}

      {/* Busy states */}
      {isBusy && (
        <div className="flex flex-col items-center py-8 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#0071E3] dark:text-[#2997FF]" />
          <p className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">
            {phase === "transcribing"
              ? `Transcribing in ${languageLabel}…`
              : phase === "scribing"
              ? "Writing the clinical and patient reports…"
              : "Saving to the patient’s vault…"}
          </p>
          <p className="mt-1 text-[10px] text-[#86868B] dark:text-[#636366]">
            {phase === "transcribing"
              ? "Usually 10–30 seconds for a full consultation."
              : "Two documents are being prepared from the same conversation."}
          </p>
        </div>
      )}

      {/* Saved */}
      {phase === "saved" && savedReport && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                Report approved and saved to {patientName}’s vault
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                This visit now appears in the patient’s history, so the next doctor already
                knows what was found and what was prescribed.
              </p>
              {savedReport.patient_report?.condition_overview && (
                <div className="mt-3 rounded-xl border border-emerald-500/20 bg-white/70 p-3 text-xs leading-relaxed text-[#1D1D1F] dark:bg-black/20 dark:text-[#F5F5F7]">
                  {savedReport.patient_report.condition_overview}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="outline" onClick={printReport} className="text-xs">
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button variant="outline" onClick={shareOnWhatsApp} className="text-xs">
              <Send className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
            <Button variant="outline" onClick={() => setPhase("review")} className="text-xs">
              <FileText className="h-3.5 w-3.5" />
              View report
            </Button>
            <Button variant="ghost" onClick={reset} className="text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        </div>
      )}

      {/* Review */}
      {phase === "review" && (
        <div className="space-y-4">
          {notice && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-500/25 bg-blue-50/50 p-2.5 text-[11px] text-blue-800 dark:border-blue-800/30 dark:bg-blue-950/20 dark:text-blue-200">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* Transcript */}
          <details className="group rounded-xl border border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#121316]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-[11px] font-bold text-[#1D1D1F] dark:text-white">
              <span className="flex items-center gap-1.5">
                <Mic className="h-3 w-3 text-[#0071E3] dark:text-[#2997FF]" />
                Transcript
                {detectedLanguage && (
                  <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#6E6E73] dark:bg-white/[0.08] dark:text-[#A1A1A6]">
                    {detectedLanguage}
                  </span>
                )}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#86868B] transition group-open:rotate-180" />
            </summary>
            <div className="space-y-2 px-3 pb-3">
              <textarea
                value={transcript}
                onChange={(event) => setTranscript(event.target.value)}
                rows={5}
                placeholder="Type or paste the consultation here, e.g. “Patient has fever for three days, BP 120 over 80…”"
                className="w-full resize-none rounded-lg border border-black/[0.08] bg-white px-2.5 py-2 text-xs leading-relaxed text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#1C1C1E] dark:text-white"
              />
              <Button
                variant="outline"
                onClick={regenerate}
                disabled={!transcript.trim()}
                className="text-[11px]"
              >
                <Sparkles className="h-3 w-3" />
                Re-generate reports from transcript
              </Button>
            </div>
          </details>

          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-[#F5F6F9] p-1 dark:bg-[#121316]">
            <button
              type="button"
              onClick={() => setActiveTab("doctor")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${tabDoctorClass}`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              Doctor report
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("patient")}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${tabPatientClass}`}
            >
              <HeartPulse className="h-3.5 w-3.5" />
              Patient copy · {languageLabel.split("·")[0].trim()}
            </button>
          </div>

          {activeTab === "doctor" ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Provisional diagnosis
                </label>
                <input
                  value={diagnosis}
                  onChange={(event) => setDiagnosis(event.target.value)}
                  placeholder="e.g. Acute viral pharyngitis"
                  className="mt-1 w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-2 text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Clinical summary
                </label>
                <textarea
                  value={doctorReport.clinical_summary || ""}
                  onChange={(event) =>
                    setDoctorReport((prev) => ({ ...prev, clinical_summary: event.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-2 text-xs leading-relaxed text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Vitals assessment
                </label>
                <textarea
                  value={doctorReport.vitals_assessment || ""}
                  onChange={(event) =>
                    setDoctorReport((prev) => ({ ...prev, vitals_assessment: event.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-2 text-xs leading-relaxed text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>

              {!!doctorReport.differential_diagnoses?.length && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                    Differentials
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {doctorReport.differential_diagnoses.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!!doctorReport.red_flags?.length && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-50/50 p-2.5 dark:border-amber-800/30 dark:bg-amber-950/20">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    Red flags to watch
                  </div>
                  <ul className="mt-1 space-y-0.5 text-[11px] text-amber-900 dark:text-amber-200">
                    {doctorReport.red_flags.map((flag, index) => (
                      <li key={index}>• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {medicines.length > 0 && (
                <div className="rounded-xl border border-black/[0.06] p-2.5 dark:border-white/[0.08]">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                    <Pill className="h-3 w-3" />
                    Medicines extracted ({medicines.length})
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {medicines.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 rounded-lg bg-[#F5F6F9] px-2 py-1.5 text-[11px] dark:bg-[#121316]"
                      >
                        <span className="font-semibold text-[#1D1D1F] dark:text-white">
                          {item.medicine_name || item.generic_name || "Medicine"}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                          {item.frequency || "—"} · {item.duration || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-violet-500/25 bg-violet-50/50 p-2.5 text-[11px] leading-relaxed text-violet-800 dark:border-violet-800/30 dark:bg-violet-950/20 dark:text-violet-200">
                <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  This copy is written for the patient in {languageLabel}. No medical jargon unless
                  it is explained in the same sentence.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  What the patient should understand
                </label>
                <textarea
                  value={patientReport.condition_overview || ""}
                  onChange={(event) =>
                    setPatientReport((prev) => ({ ...prev, condition_overview: event.target.value }))
                  }
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-2 text-xs leading-relaxed text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>

              {!!patientReport.medicine_schedule?.length && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                    <Clock className="h-3 w-3" />
                    Medicine schedule
                  </div>
                  <div className="mt-1.5 space-y-1">
                    {patientReport.medicine_schedule.map((slot, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-black/[0.06] p-2 text-[11px] dark:border-white/[0.08]"
                      >
                        <div className="font-bold text-[#1D1D1F] dark:text-white">
                          {slot.timing || "When needed"}
                        </div>
                        <div className="text-[#6E6E73] dark:text-[#A1A1A6]">{slot.medicine}</div>
                        {slot.instructions && (
                          <div className="mt-0.5 text-[10px] text-[#86868B] dark:text-[#636366]">
                            {slot.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Home care
                </label>
                <textarea
                  value={patientReport.home_care_guidance || ""}
                  onChange={(event) =>
                    setPatientReport((prev) => ({ ...prev, home_care_guidance: event.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-2 text-xs leading-relaxed text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Come back immediately if
                </label>
                <textarea
                  value={patientReport.emergency_warning_signs || ""}
                  onChange={(event) =>
                    setPatientReport((prev) => ({
                      ...prev,
                      emergency_warning_signs: event.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-1 w-full resize-none rounded-lg border border-amber-500/25 bg-amber-50/40 px-2.5 py-2 text-xs leading-relaxed text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73] dark:text-[#A1A1A6]">
                  Next visit
                </label>
                <input
                  value={patientReport.followup_instruction || ""}
                  onChange={(event) =>
                    setPatientReport((prev) => ({ ...prev, followup_instruction: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:ring-1 focus:ring-[#0071E3] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Approve bar */}
          <div className="flex flex-col gap-2 border-t border-black/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
            <button
              type="button"
              onClick={reset}
              className="text-[11px] font-semibold text-[#86868B] hover:text-rose-500 dark:text-[#636366]"
            >
              Discard draft
            </button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={regenerate} disabled={!transcript.trim()} className="text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
              <Button variant="success" onClick={approve} disabled={!transcript.trim()} className="text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve &amp; save to vault
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-50/50 p-2.5 text-[11px] leading-relaxed text-rose-800 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </Card>
  );
}
