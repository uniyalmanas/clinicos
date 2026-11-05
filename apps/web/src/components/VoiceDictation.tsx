"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   VoiceDictation — Doctor's microphone for consultation
   
   Features:
   • Web Speech API — tap to dictate, real-time transcript
   • Simple words translation — toggles medical jargon → patient-friendly Hindi/English
   • Sends dictation to /api/prescriptions/scribe → returns structured medicines + schedule
   • Works offline via fallback parser (no GROQ key needed)
   ───────────────────────────────────────────────────────── */

type VoiceDictationProps = {
  onScribed: (data: any) => void;
  placeholder?: string;
  className?: string;
};

const SIMPLE_TRANSLATIONS: Record<string, string> = {
  // Medical → Simple English/Hinglish
  "hypertension": "High blood pressure (हाई ब्लड प्रेशर)",
  "diabetes": "High sugar (शुगर अधिक)",
  "tachycardia": "Fast heartbeat (धड़कन तेज)",
  "bradycardia": "Slow heartbeat (धड़कन धीमी)",
  "hypoxia": "Low oxygen in blood (ऑक्सीजन कम)",
  "pyrexia": "Fever (बुखार)",
  "urticaria": "Skin rash / Allergy (त्वचा पर दाने या एलर्जी)",
  "pharyngitis": "Sore throat (गले में दर्द)",
  "dyspepsia": "Indigestion / Acidity (पाचन खराब / गैस)",
  "urticarial": "Allergic rash (एलर्जी के दाने)",
  "epistaxis": "Nosebleed (नाक से खून)",
  "myalgia": "Body pain (शरीर में दर्द)",
  "cephalgia": "Headache (सिर दर्द)",
  "gastritis": "Stomach inflammation (पेट में जलन)",
  "bronchospasm": "Breathing difficulty / Wheezing (सांस लेने में तकलीफ)",
  "edema": "Swelling (सूजन)",
  "pruritus": "Itching (खुजली)",
};

export function VoiceDictation({ onScribed, placeholder = "Tap mic and speak your diagnosis & treatment…", className }: VoiceDictationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isScribing, setIsScribing] = useState(false);
  const [simpleMode, setSimpleMode] = useState(true);
  const [scribedData, setScribedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError("Your browser doesn't support voice dictation. Use typing instead.");
      return;
    }
    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN"; // Indian English
    rec.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + " ";
        } else {
          interimTranscript += transcriptPart;
        }
      }
      setTranscript((finalTranscript || interimTranscript).trim());
    };
    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access.");
      } else {
        setError("Voice error: " + event.error);
      }
    };
    rec.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = rec;
    return () => {
      rec.stop();
    };
  }, []);

  const simpleTranslate = useCallback((text: string): string => {
    if (!simpleMode) return text;
    let result = text;
    Object.entries(SIMPLE_TRANSLATIONS).forEach(([medical, simple]) => {
      const regex = new RegExp(medical, "gi");
      result = result.replace(regex, simple);
    });
    return result;
  }, [simpleMode]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    setIsScribing(false);
    setScribedData(null);
    recognitionRef.current.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleScribe = useCallback(async () => {
    if (!transcript.trim()) return;
    setIsScribing(true);
    setError(null);
    try {
      const res = await fetch("/api/prescriptions/scribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : ""}`,
        },
        body: JSON.stringify({ dictation_text: transcript }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Scribe failed");
      }
      const data = await res.json();
      setScribedData(data.data);
      onScribed(data.data);
    } catch (err: any) {
      setError(err.message || "Failed to generate prescription from voice.");
    } finally {
      setIsScribing(false);
    }
  }, [transcript, onScribed]);

  const clear = useCallback(() => {
    setTranscript("");
    setScribedData(null);
    setError(null);
    setIsScribing(false);
  }, []);

  // Play confirmation chime when listening starts
  useEffect(() => {
    if (isListening && !audioRef.current) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {}
    }
  }, [isListening]);

  return (
    <div className={`rounded-2xl border p-4 space-y-3 dark:border-white/[0.08] ${className || ""}`}>
      {/* Header: Mic toggle + Simple mode */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isScribing}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              isListening
                ? "bg-rose-500 text-white shadow-rose-500/30"
                : "bg-[#F5F6F9] text-[#1D1D1F] hover:bg-black/[0.02] dark:bg-[#121316] dark:text-white"
            }`}
            title={isListening ? "Stop dictation" : "Start dictation (Mic)"}
          >
            {isListening ? (
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            <span>{isListening ? "Listening…" : "Mic"}</span>
          </button>

          <button
            onClick={() => setSimpleMode((p) => !p)}
            className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all"
          >
            <span>{simpleMode ? "Simple words" : "Medical terms"}</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs border border-rose-500/30 bg-rose-50/30 text-rose-700 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Transcript area */}
      <div className="relative group">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={placeholder}
          rows={3}
          readOnly={isListening}
          className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3 py-2.5 text-sm text-[#1D1D1F] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3] resize-none"
          disabled={isListening}
        />
        {isListening && (
          <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0071E3] text-white text-[10px] animate-pulse">
            <Volume2 className="h-2.5 w-2.5" />
          </div>
        )}
      </div>

      {/* Simple translation preview */}
      {simpleMode && transcript.trim() && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-50/40 p-2.5 dark:bg-emerald-950/20 dark:border-emerald-900/30">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
            <span>Patient-friendly version</span>
          </div>
          <p className="text-xs text-[#1D1D1F] dark:text-white leading-relaxed">
            {simpleTranslate(transcript)}
          </p>
        </div>
      )}

      {/* Action: Generate prescription from voice */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleScribe}
          disabled={!transcript.trim() || isScribing}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
            !transcript.trim() || isScribing
              ? "bg-black/[0.04] text-[#86868B] cursor-not-allowed dark:bg-white/[0.04] dark:text-[#636366]"
              : "bg-emerald-600 text-white shadow-emerald-600/25 hover:bg-emerald-700 active:scale-95"
          }`}
        >
          {isScribing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Scribing…</span>
            </>
          ) : (
            <>
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Create Prescription</span>
            </>
          )}
        </button>

        <button
          onClick={clear}
          className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#86868B] hover:text-rose-500 dark:text-[#636366] dark:hover:text-rose-400 transition"
        >
          Clear
        </button>
      </div>

      {/* Scribed result preview */}
      {scribedData && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/20 dark:border-emerald-900/30 space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-100/30 pb-1 dark:border-emerald-800/30">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Scribed from voice
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {scribedData.model || "clinicos-parser"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Diagnosis:</span>
              <span className="font-semibold text-[#1D1D1F] dark:text-white truncate max-w-[180px]">
                {scribedData.provisional_diagnosis}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Medicines:</span>
              <span className="font-semibold text-[#1D1D1F] dark:text-white">
                {scribedData.medicines?.length} prescribed
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Follow-up:</span>
              <span className="font-semibold text-[#1D1D1F] dark:text-white">
                {scribedData.followup_advice?.slice(0, 60)}…
              </span>
            </div>
          </div>
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      )}
    </div>
  );
}
