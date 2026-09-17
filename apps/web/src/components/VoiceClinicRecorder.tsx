"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  Square, 
  Languages, 
  Volume2, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Radio
} from "lucide-react";

interface VoiceClinicRecorderProps {
  value: string;
  onChange: (text: string) => void;
  className?: string;
}

export default function VoiceClinicRecorder({
  value,
  onChange,
  className = ""
}: VoiceClinicRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveInterim, setLiveInterim] = useState("");
  const [selectedLang, setSelectedLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [justRecorded, setJustRecorded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const baseTextRef = useRef<string>("");
  const isRecordingRef = useRef<boolean>(false);

  // Check Web Speech API support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      setSpeechSupported(hasSupport);
    }
  }, []);

  // Subtle acoustic feedback for mic start/stop
  const playChime = (type: "start" | "stop") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "start") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch {
      // AudioContext muted/unsupported
    }
  };

  // Start voice recognition
  const startRecording = () => {
    setErrorMessage(null);
    setJustRecorded(false);

    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not natively supported in this browser. Use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;
      recognitionRef.current = recognition;

      // If the existing text is a sample preset, clear it so the doctor's voice starts fresh
      const isSamplePreset = value.includes("I am Dr. Alok Mathur") || 
                             value.includes("I am Dr. Sunita Rawat") || 
                             value.includes("I am Dr. Harish Pant");
      if (isSamplePreset) {
        baseTextRef.current = "";
        onChange("");
      } else {
        baseTextRef.current = value || "";
      }

      recognition.onstart = () => {
        setIsRecording(true);
        isRecordingRef.current = true;
        setRecordingSeconds(0);
        playChime("start");

        timerRef.current = setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";

        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + " ";
          } else {
            interimChunk += transcript;
          }
        }

        setLiveInterim(interimChunk);

        const prefix = baseTextRef.current.trim() ? `${baseTextRef.current.trim()} ` : "";
        const combined = `${prefix}${finalChunk}${interimChunk}`.trim();
        if (combined) {
          onChange(combined);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access was blocked. Please permit microphone access in your browser address bar.");
        } else if (event.error !== "no-speech") {
          setErrorMessage(`Audio note error: ${event.error || "Recording interrupted"}`);
        }
        stopRecording();
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          // If ended unexpectedly while still marked recording, stop cleanly
          stopRecording();
        }
      };

      recognition.start();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initiate microphone");
      stopRecording();
    }
  };

  // Stop recording
  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setLiveInterim("");
    playChime("stop");

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (recordingSeconds > 1 || value.trim().length > 20) {
      setJustRecorded(true);
      setTimeout(() => setJustRecorded(false), 6000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Simulated Voice dictation sample for testing when no mic is available
  const handleSimulatedDictation = () => {
    const sample = "I am Dr. Alok Mathur, Senior Dermatologist with 14 years experience. My clinic is Skin & Aesthetic Centre on Rajpur Road, Dehradun. Registration number UKMC-5541-2012. Consultation fee is 600 rupees. I treat chronic acne, eczema, psoriasis, and provide laser cosmetic care. OPD timings are Monday to Saturday 10am to 2pm and 5pm to 8:30pm.";
    onChange(sample);
    setJustRecorded(true);
    setTimeout(() => setJustRecorded(false), 5000);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Voice Control Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 active:scale-95 transition"
            >
              <Mic className="h-4 w-4 animate-pulse" />
              <span>Record Voice Note</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-black active:scale-95 transition dark:bg-red-600 dark:hover:bg-red-700"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span>Stop Recording ({formatTime(recordingSeconds)})</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <Languages className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as any)}
              disabled={isRecording}
              aria-label="Speech recognition language"
              className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="en-IN">🇮🇳 English (India)</option>
              <option value="hi-IN">🇮🇳 हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* Status / Quick Sample */}
        <div className="flex items-center gap-2 text-xs">
          {isRecording ? (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold animate-pulse text-[11px]">
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-ping" />
              <span>Listening to Doctor...</span>
              {/* Animated Sound Wave Bars */}
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: "150ms" }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: "300ms" }} />
                <span className="w-1 bg-red-500 rounded-full animate-bounce h-3" style={{ animationDelay: "75ms" }} />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSimulatedDictation}
              className="text-[11px] text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 underline decoration-dotted transition"
            >
              Simulate Voice Sample
            </button>
          )}

          {value && !isRecording && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Clear transcription text"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Live Interim Transcript Bubble while recording */}
      {isRecording && liveInterim && (
        <div className="rounded-lg border border-red-200 bg-red-50/70 p-2 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 animate-fadeIn">
          <span className="font-semibold mr-1.5">Transcribing:</span>
          <span className="italic">“{liveInterim}”</span>
        </div>
      )}

      {/* Success Notification after recording */}
      {justRecorded && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Voice recorded and filled into clinic description! Click <strong>Synthesize Profile with AI</strong> below.</span>
        </div>
      )}

      {/* Error / Fallback Notification */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!speechSupported && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>Web Speech API is best supported in Google Chrome, Microsoft Edge, and Safari on desktop and mobile.</span>
        </div>
      )}
    </div>
  );
}
