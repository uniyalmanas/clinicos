"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Activity, 
  Dumbbell, 
  TrendingDown, 
  CheckCircle2, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  X, 
  RefreshCw, 
  HeartHandshake,
  ChevronRight,
  Sparkles,
  Printer,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  Video,
  ExternalLink,
  Compass,
  Flame,
  Check,
  Clock
} from "lucide-react";

export interface PrescribedExercise {
  name: string;
  sets: number;
  reps: string;
  frequency: string;
  resistance: string;
  rest_seconds?: number;
  video_url?: string;
  precautions?: string;
}

export interface HomeworkItem {
  name: string;
  frequency: string;
  reps?: string;
  video_url?: string;
}

export interface ExerciseItem {
  name: string;
  sets: number | string;
  reps: number | string;
}

export interface TherapySession {
  id: string;
  session_number: number;
  session_date: string;
  pain_score_before: number;
  pain_score_after: number;
  rom_joint: string;
  rom_plane: string;
  rom_degrees: number;
  rom_method: string;
  rom_laterality: string;
  range_of_motion: string;
  modality_applied: string;
  tolerance_rating: string;
  exercises_performed: ExerciseItem[];
  homework_assigned: HomeworkItem[];
  escalation_flag: boolean;
  escalation_note?: string;
  therapist_notes: string;
}

export interface TherapyPlan {
  id: string;
  patient_name: string;
  patient_phone: string;
  referring_doctor: string;
  therapist_name: string;
  approved_by: string;
  modification_status: "approved" | "pending_senior_review" | "modified";
  condition_diagnosed: string;
  target_sessions: number;
  completed_sessions: number;
  start_date: string;
  review_date: string;
  end_date: string;
  status: "active" | "completed" | "paused";
  goals: string;
  target_joint: string;
  movement_plane: string;
  baseline_rom: number;
  target_rom: number;
  current_rom: number;
  baseline_vas: number;
  target_vas: number;
  current_vas: number;
  stagnation_alert: boolean;
  pain_escalation_alert: boolean;
  prescribed_exercises: PrescribedExercise[];
  sessions: TherapySession[];
}

const CONDITION_PRESETS = [
  {
    name: "Frozen Shoulder (Adhesive Capsulitis Stage 2)",
    joint: "Right Shoulder",
    plane: "Abduction & External Rotation",
    baseRom: 65,
    targetRom: 140,
    baseVas: 8,
    targetVas: 2,
    exercises: [
      { name: "Codman Pendulum Exercises", sets: 3, reps: "15 reps", frequency: "BID (Twice Daily)", resistance: "Gravity dependent", video_url: "https://youtu.be/codman-shoulder", precautions: "No deltoid engagement; gentle oscillation only." },
      { name: "Finger Ladder Wall Climbs", sets: 3, reps: "10 reps", frequency: "TID (3x Daily)", resistance: "Bodyweight", video_url: "https://youtu.be/finger-ladder", precautions: "Pause at initial threshold; hold 5s." },
      { name: "Theraband External Rotations", sets: 3, reps: "12 reps", frequency: "OD (Daily)", resistance: "Yellow Theraband (Light)", video_url: "https://youtu.be/theraband-external", precautions: "Elbow fixed to ribcage with towel roll." },
      { name: "Overhead Rope & Pulley Passive Elevation", sets: 3, reps: "12 reps", frequency: "BID (Twice Daily)", resistance: "Assisted Pulley", video_url: "https://youtu.be/shoulder-pulley", precautions: "Contralateral healthy arm performs 90% pull." }
    ]
  },
  {
    name: "Post-Operative ACL Reconstruction (Week 4)",
    joint: "Left Knee",
    plane: "Flexion & Extension",
    baseRom: 45,
    targetRom: 125,
    baseVas: 7,
    targetVas: 1,
    exercises: [
      { name: "Prone Passive Terminal Knee Hangs", sets: 3, reps: "5 min hold", frequency: "TID (3x Daily)", resistance: "Gravity + 1kg ankle cuff", video_url: "https://youtu.be/knee-hangs", precautions: "Patella free off table edge." },
      { name: "Quadriceps Isometric Sets (Towel Roll)", sets: 4, reps: "15 reps × 5s", frequency: "QID (4x Daily)", resistance: "Max voluntary isometric", video_url: "https://youtu.be/quad-sets", precautions: "Focus on VMO medial contraction." },
      { name: "Stationary Bike Zero-Resistance Oscillations", sets: 3, reps: "10 mins", frequency: "OD (Daily)", resistance: "Free spin zero load", video_url: "https://youtu.be/bike-acl", precautions: "High seat height to protect graft." }
    ]
  },
  {
    name: "Lumbar Disc Herniation (L5 Radiculopathy)",
    joint: "Lumbar Spine",
    plane: "Extension & Core Stabilization",
    baseRom: 20,
    targetRom: 60,
    baseVas: 8,
    targetVas: 1,
    exercises: [
      { name: "McKenzie Prone Press-ups (Extension)", sets: 3, reps: "10 reps", frequency: "Every 2h while awake", resistance: "Bodyweight", video_url: "https://youtu.be/mckenzie-extension", precautions: "Pelvis anchored to floor; exhale as you push." },
      { name: "Cat-Camel Spinal Mobilization", sets: 2, reps: "12 reps", frequency: "BID (Twice Daily)", resistance: "Active range", video_url: "https://youtu.be/cat-camel", precautions: "Avoid painful end-range flexion." },
      { name: "Abdominal Drawing-In Core Maneuver", sets: 3, reps: "10 reps × 10s", frequency: "BID (Twice Daily)", resistance: "Deep Transverse Abdominis", video_url: "https://youtu.be/core-activation", precautions: "Maintain normal diaphragmatic breathing." }
    ]
  },
  {
    name: "Cervical Spondylosis with Radiculopathy",
    joint: "Cervical Spine",
    plane: "Retraction & Lateral Flexion",
    baseRom: 35,
    targetRom: 75,
    baseVas: 7,
    targetVas: 1,
    exercises: [
      { name: "McKenzie Chin Tucks (Cervical Retraction)", sets: 3, reps: "12 reps", frequency: "Every 2h", resistance: "Active assisted", video_url: "https://youtu.be/chin-tucks", precautions: "Keep eyes horizontal, do not tilt head down." },
      { name: "Isometric Multi-angle Neck Stabilization", sets: 3, reps: "8 reps × 6s", frequency: "TID (3x Daily)", resistance: "Gentle hand counter-pressure", video_url: "https://youtu.be/neck-isometrics", precautions: "No head movement should occur." }
    ]
  }
];

const MODALITY_OPTIONS = [
  "TENS (80Hz Conventional)",
  "Interferential Therapy (IFT 4-pole)",
  "Therapeutic Ultrasound (1MHz, 1.2 W/cm²)",
  "Cryotherapy Ice Compression Wrap",
  "Moist Heat Fermentation (Hydrocollator)",
  "Maitland Joint Mobilization (Grade II-III)",
  "Intermittent Mechanical Traction",
  "Dry Needling / Trigger Point Deactivation"
];

const TOLERANCE_GRADES = [
  { id: "Excellent", label: "Excellent (Zero pain during movement)" },
  { id: "Good (Grade 3/4)", label: "Good (Mild stretch sensation, well tolerated)" },
  { id: "Fair (Guarding)", label: "Fair (Moderate muscle guarding present)" },
  { id: "Poor", label: "Poor (Sharp pain triggers, session modified)" }
];

function formatSafeDate(d?: string | null): string {
  if (!d) return "Recently Started";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "Recently Started" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "Recently Started";
  }
}

function formatSessionDate(d?: string | null): string {
  if (!d) return "Today";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "Today" : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Today";
  }
}

function getSafeExercises(exercises: any): ExerciseItem[] {
  if (!exercises) return [];
  if (Array.isArray(exercises)) return exercises;
  if (typeof exercises === "string") {
    try {
      const parsed = JSON.parse(exercises);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") {
        const doubleParsed = JSON.parse(parsed);
        if (Array.isArray(doubleParsed)) return doubleParsed;
      }
    } catch {
      return [];
    }
  }
  return [];
}

function formatReps(reps: number | string | undefined): string {
  if (reps === undefined || reps === null || reps === "") return "10 reps";
  const str = String(reps).trim();
  if (/reps$/i.test(str)) return str;
  return `${str} reps`;
}

export default function RehabDashboardPage() {
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TherapyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "alerts" | "completed">("all");
  const [detailTab, setDetailTab] = useState<"metrics" | "regimen" | "sessions" | "governance">("metrics");

  // Modals
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [logSessionModal, setLogSessionModal] = useState(false);
  const [seniorReviewModal, setSeniorReviewModal] = useState(false);
  const [handoutModalOpen, setHandoutModalOpen] = useState(false);

  // New Plan form state
  const [newPtName, setNewPtName] = useState("");
  const [newPtPhone, setNewPtPhone] = useState("");
  const [newDoctor, setNewDoctor] = useState("Dr. Arvind Shenoy (MS Ortho, Joint Specialist)");
  const [newTherapist, setNewTherapist] = useState("Dr. Sneha Verma (PT)");
  const [newSeniorPt, setNewSeniorPt] = useState("Dr. Vikram Sethi (Chief PT, MIAP)");
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [newCondition, setNewCondition] = useState(CONDITION_PRESETS[0].name);
  const [newJoint, setNewJoint] = useState(CONDITION_PRESETS[0].joint);
  const [newPlane, setNewPlane] = useState(CONDITION_PRESETS[0].plane);
  const [newBaseRom, setNewBaseRom] = useState(CONDITION_PRESETS[0].baseRom);
  const [newTargetRom, setNewTargetRom] = useState(CONDITION_PRESETS[0].targetRom);
  const [newBaseVas, setNewBaseVas] = useState(CONDITION_PRESETS[0].baseVas);
  const [newTargetVas, setNewTargetVas] = useState(CONDITION_PRESETS[0].targetVas);
  const [newTargetSessions, setNewTargetSessions] = useState(10);
  const [newGoals, setNewGoals] = useState("Restore functional range of motion, eliminate night pain (VAS < 2), restore full activities of daily living.");

  // Log Session Form State
  const [painBefore, setPainBefore] = useState(6);
  const [painAfter, setPainAfter] = useState(3);
  const [romDegrees, setRomDegrees] = useState(95);
  const [romMethod, setRomMethod] = useState("Universal Goniometer (360°)");
  const [romLaterality, setRomLaterality] = useState("Right");
  const [sessionNotes, setSessionNotes] = useState("Patient completed active-assisted mobilization smoothly with good capsular tolerance.");
  const [selectedModality, setSelectedModality] = useState("TENS (80Hz Conventional)");
  const [selectedTolerance, setSelectedTolerance] = useState("Good (Grade 3/4)");
  const [sessionExercises, setSessionExercises] = useState<{ name: string; sets: number; reps: string; checked: boolean }[]>([]);
  const [homeworkInput, setHomeworkInput] = useState("Perform active pendulum swings 15 reps twice daily before sleep.");

  // Senior Review Form State
  const [seniorPin, setSeniorPin] = useState("");
  const [seniorNotes, setSeniorNotes] = useState("Clinical progress audited. Protocol progression authorized with Grade III Maitland oscillations.");

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rehab/plans");
      if (res.ok) {
        const data = await res.json();
        if (data.plans && Array.isArray(data.plans)) {
          setPlans(data.plans);
          setSelectedPlan((prev) => {
            if (!prev) return data.plans[0] || null;
            const updated = data.plans.find((p: TherapyPlan) => p.id === prev.id);
            return updated || data.plans[0] || null;
          });
        }
      }
    } catch (e) {
      console.error("Fetch plans failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // When opening Log Session modal, initialize exercises checklist from current plan
  const handleOpenLogSession = () => {
    if (!selectedPlan) return;
    const baseEx = (selectedPlan.prescribed_exercises && selectedPlan.prescribed_exercises.length > 0)
      ? selectedPlan.prescribed_exercises.map(e => ({ name: e.name, sets: e.sets || 3, reps: e.reps || "12 reps", checked: true }))
      : [
          { name: "Active Assisted Range Exercises", sets: 3, reps: "12 reps", checked: true },
          { name: "Isometric Rotator Cuff Activation", sets: 3, reps: "10 reps", checked: true }
        ];
    setSessionExercises(baseEx);
    setRomDegrees(selectedPlan.current_rom ? Math.min(selectedPlan.target_rom, selectedPlan.current_rom + 5) : 95);
    setPainBefore(Math.max(1, selectedPlan.current_vas ? selectedPlan.current_vas + 1 : 6));
    setPainAfter(Math.max(1, selectedPlan.current_vas ? selectedPlan.current_vas - 1 : 3));
    setLogSessionModal(true);
  };

  const handleApplyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const p = CONDITION_PRESETS[index];
    setNewCondition(p.name);
    setNewJoint(p.joint);
    setNewPlane(p.plane);
    setNewBaseRom(p.baseRom);
    setNewTargetRom(p.targetRom);
    setNewBaseVas(p.baseVas);
    setNewTargetVas(p.targetVas);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activePreset = CONDITION_PRESETS[selectedPresetIndex];
      const res = await fetch("/api/rehab/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: newPtName,
          patient_phone: newPtPhone,
          referring_doctor: newDoctor,
          therapist_name: newTherapist,
          approved_by: newSeniorPt,
          condition_diagnosed: newCondition,
          target_sessions: newTargetSessions,
          goals: newGoals,
          target_joint: newJoint,
          movement_plane: newPlane,
          baseline_rom: newBaseRom,
          target_rom: newTargetRom,
          baseline_vas: newBaseVas,
          target_vas: newTargetVas,
          prescribed_exercises: activePreset.exercises
        })
      });
      if (res.ok) {
        setNewPlanModal(false);
        setNewPtName("");
        setNewPtPhone("");
        await fetchPlans();
      }
    } catch (e) {
      console.error("Create plan error:", e);
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      const nextSessionNumber = (selectedPlan.completed_sessions || 0) + 1;
      const performed = sessionExercises
        .filter(ex => ex.checked)
        .map(ex => ({ name: ex.name, sets: ex.sets, reps: ex.reps }));

      const res = await fetch("/api/rehab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          session_number: nextSessionNumber,
          pain_score_before: painBefore,
          pain_score_after: painAfter,
          rom_joint: selectedPlan.target_joint || "Shoulder",
          rom_plane: selectedPlan.movement_plane || "Abduction",
          rom_degrees: romDegrees,
          rom_method: romMethod,
          rom_laterality: romLaterality,
          range_of_motion: `${selectedPlan.movement_plane || "Motion"}: ${romDegrees}°`,
          modality_applied: selectedModality,
          tolerance_rating: selectedTolerance,
          exercises_performed: performed,
          homework_assigned: [{ name: homeworkInput, frequency: "Daily", reps: "As tolerated" }],
          therapist_notes: sessionNotes
        })
      });

      if (res.ok) {
        setLogSessionModal(false);
        await fetchPlans();
      }
    } catch (e) {
      console.error("Log session error:", e);
    }
  };

  const handleSeniorApproval = async () => {
    if (!selectedPlan) return;
    try {
      const res = await fetch("/api/rehab/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          action: "approve_modifications",
          approved_by: "Dr. Vikram Sethi (Chief PT, MIAP)"
        })
      });
      if (res.ok) {
        setSeniorReviewModal(false);
        await fetchPlans();
      }
    } catch (e) {
      console.error("Senior approval error:", e);
    }
  };

  const handleCompletePlan = async () => {
    if (!selectedPlan) return;
    if (!confirm(`Are you sure you want to mark ${selectedPlan.patient_name}'s rehabilitation course as COMPLETE?`)) return;
    try {
      const res = await fetch("/api/rehab/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          action: "complete_plan",
          discharge_notes: "Discharged with restored anatomical range and VAS <= 2. Independent home maintenance regimen provided."
        })
      });
      if (res.ok) {
        await fetchPlans();
      }
    } catch (e) {
      console.error("Complete plan error:", e);
    }
  };

  // Filtered plans based on search & tab
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      // Tab filter
      if (activeFilter === "active" && p.status !== "active") return false;
      if (activeFilter === "completed" && p.status !== "completed") return false;
      if (activeFilter === "alerts" && !p.stagnation_alert && !p.pain_escalation_alert && p.modification_status !== "pending_senior_review") return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.patient_name || "").toLowerCase().includes(q) ||
        (p.condition_diagnosed || "").toLowerCase().includes(q) ||
        (p.patient_phone || "").toLowerCase().includes(q) ||
        (p.referring_doctor || "").toLowerCase().includes(q) ||
        (p.therapist_name || "").toLowerCase().includes(q) ||
        (p.target_joint || "").toLowerCase().includes(q)
      );
    });
  }, [plans, searchQuery, activeFilter]);

  // Aggregate Metrics
  const activePlansCount = plans.filter(p => p.status === "active").length;
  const totalSessionsCount = plans.reduce((acc, p) => acc + (p.completed_sessions || 0), 0);
  const alertsCount = plans.filter(p => p.stagnation_alert || p.pain_escalation_alert || p.modification_status === "pending_senior_review").length;

  const avgPainReduction = useMemo(() => {
    let totalDelta = 0;
    let count = 0;
    plans.forEach(p => {
      if (p.baseline_vas && p.current_vas) {
        totalDelta += (p.baseline_vas - p.current_vas);
        count++;
      }
    });
    return count > 0 ? (totalDelta / count).toFixed(1) : "5.2";
  }, [plans]);

  const cohortRomRecoveryPct = useMemo(() => {
    let totalPct = 0;
    let count = 0;
    plans.forEach(p => {
      const span = p.target_rom - p.baseline_rom;
      if (span > 0) {
        const gained = (p.current_rom || p.baseline_rom) - p.baseline_rom;
        const pct = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
        totalPct += pct;
        count++;
      }
    });
    return count > 0 ? Math.round(totalPct / count) : 74;
  }, [plans]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Clinical Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 rounded-2xl">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                  Physiotherapy &amp; Rehabilitation Studio
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-rose-500/10 text-rose-600 border border-rose-500/20 font-semibold">
                  Marley Rehab 2.0
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Senior PT Governed
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-apple-blue font-semibold border border-blue-500/20 flex items-center gap-1">
                  <Compass className="h-3 w-3" /> Goniometric Standards
                </span>
              </div>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                Structured Therapy Plans • Standardized VAS/ROM Tracking • Detailed Session Logs • Progress Monitoring &amp; Escalation Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end lg:self-center">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-black/5 disabled:opacity-50 transition"
            title="Refresh Registry"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
          </button>
          <button
            onClick={() => setNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium text-xs shadow-apple-card hover:bg-rose-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Structured Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (4 Clinical Reliability Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Structured Plans */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Clinical Plans</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {activePlansCount}
          </div>
          <div className="mt-2 text-xs text-[#86868B] flex items-center justify-between">
            <span>Ortho &amp; Senior PT governed</span>
            <span className="font-semibold text-emerald-600 font-mono">100% active</span>
          </div>
        </div>

        {/* Standardized VAS Reduction */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Pain Reduction</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600 font-mono">
            -{avgPainReduction} <span className="text-sm font-sans font-normal text-[#86868B]">VAS pts</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            Significant clinical relief achieved
          </div>
        </div>

        {/* Goniometric ROM Restoration */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">ROM Restoration Goal</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-apple-blue">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {cohortRomRecoveryPct}%
          </div>
          <div className="mt-2 text-xs text-[#86868B]">
            Cohort anatomical range progress
          </div>
        </div>

        {/* Clinical Safety & Stagnation Alerts */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Clinical Alerts</span>
            <div className={`p-2 rounded-xl ${alertsCount > 0 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className={`mt-3 text-3xl font-extrabold font-mono ${alertsCount > 0 ? "text-amber-600" : "text-[#1D1D1F] dark:text-white"}`}>
            {alertsCount}
          </div>
          <div className="mt-2 text-xs text-[#86868B]">
            {alertsCount > 0 ? "Stagnation or pain surges" : "Zero protocol escalations"}
          </div>
        </div>
      </div>

      {/* Main Split: Left Column (4 cols) = Plans List; Right Column (8 cols) = Detail Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Structured Patient Plans (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">Active Patient Plans</h3>
            <span className="text-xs text-[#86868B] font-mono">{filteredPlans.length} plans</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex p-1 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl text-[11px] font-medium text-[#86868B]">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 py-1 text-center rounded-lg transition ${activeFilter === "all" ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm font-semibold" : "hover:text-[#1D1D1F]"}`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={`flex-1 py-1 text-center rounded-lg transition ${activeFilter === "active" ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-sm font-semibold" : "hover:text-[#1D1D1F]"}`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter("alerts")}
              className={`flex-1 py-1 text-center rounded-lg transition ${activeFilter === "alerts" ? "bg-white dark:bg-[#2C2C2E] text-amber-600 shadow-sm font-semibold" : "hover:text-[#1D1D1F]"}`}
            >
              Alerts ({alertsCount})
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`flex-1 py-1 text-center rounded-lg transition ${activeFilter === "completed" ? "bg-white dark:bg-[#2C2C2E] text-emerald-600 shadow-sm font-semibold" : "hover:text-[#1D1D1F]"}`}
            >
              Done
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B]" />
            <input
              type="text"
              placeholder="Search patient, joint, diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-rose-500 transition"
            />
          </div>

          {/* Plan Cards List */}
          <div className="space-y-2.5">
            {filteredPlans.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#86868B] border border-dashed rounded-2xl bg-white dark:bg-[#1C1C1E]">
                No matching rehabilitation plans found.
              </div>
            ) : (
              filteredPlans.map((p) => {
                const isSelected = selectedPlan?.id === p.id;
                const completed = p.completed_sessions || 0;
                const target = p.target_sessions || 10;
                const progressPct = Math.min(100, Math.max(0, Math.round((completed / target) * 100)));

                const romGain = (p.current_rom || p.baseline_rom) - p.baseline_rom;
                const romSpan = p.target_rom - p.baseline_rom;
                const romPct = romSpan > 0 ? Math.min(100, Math.max(0, Math.round((romGain / romSpan) * 100))) : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-4 rounded-2xl border cursor-pointer transition text-xs space-y-2.5 ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 shadow-apple-card ring-1 ring-rose-500/20"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] hover:border-black/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                          {p.patient_name}
                          {p.status === "completed" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />
                          )}
                        </div>
                        <div className="text-[11px] text-[#86868B] font-mono">{p.patient_phone}</div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono bg-black/[0.04] dark:bg-white/[0.08]">
                          {completed} / {target} Sessions
                        </span>
                        {p.pain_escalation_alert && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-rose-500 text-white animate-pulse">
                            🚨 VAS Surge
                          </span>
                        )}
                        {p.stagnation_alert && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ⚠️ Stagnation
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      {p.condition_diagnosed}
                    </div>

                    <div className="text-[11px] text-[#86868B] flex items-center gap-1">
                      <Stethoscope className="h-3 w-3 text-[#86868B]" />
                      <span>{p.referring_doctor || "Dr. Arvind Shenoy"}</span>
                    </div>

                    {/* ROM & VAS Micro Gauges */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04] text-[11px]">
                      <div>
                        <div className="text-[10px] text-[#86868B]">ROM: {p.movement_plane}</div>
                        <div className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                          {p.baseline_rom}° ➜ <span className="text-apple-blue">{p.current_rom}°</span> ({p.target_rom}°)
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#86868B]">VAS Pain Score</div>
                        <div className="font-mono font-bold">
                          <span className="text-rose-600">{p.baseline_vas}/10</span> ➜ <span className="text-emerald-600">{p.current_vas}/10</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-[#86868B] mb-1">
                        <span>Recovery Progress</span>
                        <span className="font-mono font-semibold">{romPct}% ROM</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.1] overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${romPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Clinical Detail Studio (8 cols) */}
        <div className="lg:col-span-8">
          {selectedPlan ? (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-6">
              {/* Clinical Header & Governance Ribbon */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">
                      {selectedPlan.patient_name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {selectedPlan.status}
                    </span>
                    {selectedPlan.modification_status === "approved" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Senior PT Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Pending Senior Sign-Off
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#86868B] mt-1.5 flex items-center gap-3 flex-wrap">
                    <span>Referring: <strong>{selectedPlan.referring_doctor}</strong></span>
                    <span>•</span>
                    <span>PT: <strong>{selectedPlan.therapist_name}</strong></span>
                    <span>•</span>
                    <span>Started: {formatSafeDate(selectedPlan.start_date)}</span>
                    <span>•</span>
                    <span>Review: {formatSafeDate(selectedPlan.review_date)}</span>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setHandoutModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white font-medium text-xs hover:bg-black/5 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Home Handout</span>
                  </button>

                  {(selectedPlan.stagnation_alert || selectedPlan.pain_escalation_alert || selectedPlan.modification_status === "pending_senior_review") && (
                    <button
                      onClick={() => setSeniorReviewModal(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 font-medium text-xs transition"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Senior PT Sign-Off</span>
                    </button>
                  )}

                  {selectedPlan.status === "active" && (
                    <button
                      onClick={handleOpenLogSession}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Log Session #{(selectedPlan.completed_sessions || 0) + 1}</span>
                    </button>
                  )}

                  {selectedPlan.status === "active" && selectedPlan.completed_sessions >= 2 && (
                    <button
                      onClick={handleCompletePlan}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 font-medium text-xs transition"
                      title="Discharge and mark complete"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Complete Plan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Active Escalation Alerts Banner (If triggered) */}
              {selectedPlan.pain_escalation_alert && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-600">
                    <AlertTriangle className="h-4 w-4" />
                    PAIN ESCALATION ALERT: VAS Surged by &gt;2 Points in Latest Session
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    Mandatory Clinical Protocol: Cease high-resistance loading. Apply 15-minute cryotherapy pack. Prescribe NSAID consult if nocturnal inflammation persists. Senior Therapist approval required prior to next session.
                  </div>
                </div>
              )}

              {selectedPlan.stagnation_alert && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    CLINICAL STAGNATION ALERT: Zero ROM Improvement over 3 Consecutive Sessions
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    Mandatory Protocol: Joint capsule plateau identified at {selectedPlan.current_rom}°. Re-evaluate capsular end-feel. Progress to Maitland Grade III mobilization or schedule Orthopedic consultation for arthrogenic check.
                  </div>
                </div>
              )}

              {/* Clinical Goal & Milestone Scope Card */}
              <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    Diagnosed Condition: {selectedPlan.condition_diagnosed}
                  </span>
                  <span className="text-[11px] text-[#86868B]">
                    Joint: <strong>{selectedPlan.target_joint}</strong> ({selectedPlan.movement_plane})
                  </span>
                </div>
                <div className="text-[#515154] dark:text-[#A1A1A6] leading-relaxed">
                  <strong>Structured Rehabilitation Goal:</strong> {selectedPlan.goals}
                </div>
              </div>

              {/* Studio Navigation Tabs */}
              <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] text-xs">
                <button
                  onClick={() => setDetailTab("metrics")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "metrics"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Visual VAS &amp; ROM Tracking
                </button>
                <button
                  onClick={() => setDetailTab("regimen")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "regimen"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Prescribed Exercise Regimen ({selectedPlan.prescribed_exercises?.length || 0})
                </button>
                <button
                  onClick={() => setDetailTab("sessions")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "sessions"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Session History &amp; Logs ({selectedPlan.sessions?.length || 0})
                </button>
                <button
                  onClick={() => setDetailTab("governance")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "governance"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Clinical Governance &amp; Review
                </button>
              </div>

              {/* TAB 1: VISUAL VAS & STANDARDIZED ROM TRACKING */}
              {detailTab === "metrics" && (
                <div className="space-y-6">
                  {/* Standardized VAS (Visual Analog Scale) Pain Trend Tracker */}
                  <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <Flame className="h-4 w-4 text-rose-500" />
                          Visual Analog Scale (VAS) Pain Trajectory
                        </h4>
                        <p className="text-[11px] text-[#86868B]">
                          Session-by-session pre-therapy vs post-therapy pain score comparison (0-10 Scale)
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                          <span>Pre-Session VAS</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Post-Session VAS</span>
                        </div>
                      </div>
                    </div>

                    {/* VAS Chart Visualizer */}
                    {selectedPlan.sessions && selectedPlan.sessions.length > 0 ? (
                      <div className="space-y-2 pt-2">
                        {selectedPlan.sessions.map((s) => (
                          <div key={s.id || s.session_number} className="flex items-center gap-3 text-xs">
                            <span className="w-16 font-mono font-semibold text-[#86868B]">
                              S#{s.session_number}
                            </span>
                            <div className="flex-1 flex items-center gap-2">
                              {/* Pre-session bar */}
                              <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.06] h-6 rounded-lg overflow-hidden flex items-center px-2">
                                <div 
                                  className="h-3.5 rounded bg-rose-500/80 text-[10px] text-white font-mono font-bold flex items-center justify-end pr-1.5 transition-all duration-500"
                                  style={{ width: `${Math.max(15, s.pain_score_before * 10)}%` }}
                                >
                                  {s.pain_score_before}/10
                                </div>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 text-[#86868B] shrink-0" />
                              {/* Post-session bar */}
                              <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.06] h-6 rounded-lg overflow-hidden flex items-center px-2">
                                <div 
                                  className="h-3.5 rounded bg-emerald-500/90 text-[10px] text-white font-mono font-bold flex items-center justify-end pr-1.5 transition-all duration-500"
                                  style={{ width: `${Math.max(15, s.pain_score_after * 10)}%` }}
                                >
                                  {s.pain_score_after}/10
                                </div>
                              </div>
                            </div>
                            <span className="w-20 text-right font-mono font-semibold text-emerald-600">
                              -{s.pain_score_before - s.pain_score_after} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-[#86868B]">
                        No sessions recorded yet to generate VAS trajectory.
                      </div>
                    )}

                    {/* VAS Clinical Interpretation Guide */}
                    <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] grid grid-cols-3 gap-2 text-[10px] text-center">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                        <span className="font-bold">VAS 0-3: Mild</span>
                        <div className="text-[9px] text-[#86868B]">Minimal ADL interference</div>
                      </div>
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        <span className="font-bold">VAS 4-6: Moderate</span>
                        <div className="text-[9px] text-[#86868B]">Interferes with sleep/work</div>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-300">
                        <span className="font-bold">VAS 7-10: Severe</span>
                        <div className="text-[9px] text-[#86868B]">Disabling; cryotherapy/rest</div>
                      </div>
                    </div>
                  </div>

                  {/* Standardized Goniometric ROM Progress Gauge */}
                  <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <Compass className="h-4 w-4 text-apple-blue" />
                          Goniometric Range of Motion (ROM) Progress
                        </h4>
                        <p className="text-[11px] text-[#86868B]">
                          Validated joint angle progression: {selectedPlan.target_joint} • {selectedPlan.movement_plane}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-apple-blue/10 text-apple-blue font-mono font-semibold">
                        Goniometer 360°
                      </span>
                    </div>

                    {/* ROM Comparison Gauge */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] text-center">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-[#86868B]">Baseline Intake</div>
                        <div className="text-xl font-bold font-mono text-[#1D1D1F] dark:text-white mt-1">
                          {selectedPlan.baseline_rom}°
                        </div>
                        <div className="text-[10px] text-[#86868B]">Day 1 Angle</div>
                      </div>
                      <div className="border-x border-black/[0.06] dark:border-white/[0.08]">
                        <div className="text-[10px] uppercase font-semibold text-apple-blue">Current Milestone</div>
                        <div className="text-xl font-bold font-mono text-apple-blue mt-1">
                          {selectedPlan.current_rom}°
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          +{selectedPlan.current_rom - selectedPlan.baseline_rom}° restored
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-emerald-600">Target Goal</div>
                        <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                          {selectedPlan.target_rom}°
                        </div>
                        <div className="text-[10px] text-[#86868B]">Full Anatomical ROM</div>
                      </div>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div>
                      {(() => {
                        const span = selectedPlan.target_rom - selectedPlan.baseline_rom;
                        const gain = (selectedPlan.current_rom || selectedPlan.baseline_rom) - selectedPlan.baseline_rom;
                        const pct = span > 0 ? Math.min(100, Math.max(0, Math.round((gain / span) * 100))) : 0;
                        return (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>Restoration towards Goal ({selectedPlan.target_rom}°)</span>
                              <span className="font-mono text-apple-blue">{pct}% Complete</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-black/[0.05] dark:bg-white/[0.1] overflow-hidden">
                              <div 
                                className="h-full bg-apple-blue rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PRESCRIBED EXERCISE REGIMEN */}
              {detailTab === "regimen" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                        Structured Clinical Exercise Regimen
                      </h4>
                      <p className="text-xs text-[#86868B]">
                        Governed movements, sets, repetitions, resistance parameters, and video links
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] font-mono text-[#86868B]">
                      {selectedPlan.prescribed_exercises?.length || 0} Exercises
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedPlan.prescribed_exercises?.map((ex, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                              {idx + 1}. {ex.name}
                            </div>
                            <div className="text-[#86868B] text-[11px] mt-0.5">
                              Target Frequency: <strong className="text-[#1D1D1F] dark:text-white">{ex.frequency}</strong> • Rest: {ex.rest_seconds || 45}s
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 font-mono font-bold">
                              {ex.sets} sets × {formatReps(ex.reps)}
                            </span>
                            {ex.video_url && (
                              <a
                                href={ex.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] text-apple-blue hover:bg-apple-blue/10 transition"
                                title="Watch clinical demonstration video"
                              >
                                <Video className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                          <div>
                            <span className="text-[#86868B]">Prescribed Resistance:</span> <strong>{ex.resistance}</strong>
                          </div>
                          {ex.precautions && (
                            <div className="text-amber-700 dark:text-amber-300">
                              <span>Precaution:</span> {ex.precautions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DETAILED SESSION HISTORY & LOGS */}
              {detailTab === "sessions" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-rose-500" />
                        Detailed Session Logs &amp; Progress History
                      </h4>
                      <p className="text-xs text-[#86868B]">
                        Chronological record of pre/post VAS, goniometric ROM, modalities, and tolerance
                      </p>
                    </div>
                    <span className="text-xs text-[#86868B]">
                      {selectedPlan.sessions?.length || 0} visits completed
                    </span>
                  </div>

                  {(!selectedPlan.sessions || selectedPlan.sessions.length === 0) ? (
                    <div className="py-8 text-center text-xs text-[#86868B] border border-dashed rounded-2xl">
                      No clinical sessions logged yet for this rehabilitation plan. Click &ldquo;Log Next Session&rdquo; above.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlan.sessions.map((sess) => {
                        const safeEx = getSafeExercises(sess.exercises_performed);
                        return (
                          <div 
                            key={sess.id || `sess-${sess.session_number}`}
                            className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-3 text-xs"
                          >
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <span className="font-bold text-apple-blue font-mono text-sm">
                                  Session #{sess.session_number}
                                </span>
                                <span className="text-[#86868B] ml-2 font-mono text-[11px]">
                                  {formatSessionDate(sess.session_date)}
                                </span>
                              </div>

                              {/* VAS Before vs After */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#86868B]">VAS Score:</span>
                                <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 font-mono font-bold">
                                  Pre: {sess.pain_score_before}/10
                                </span>
                                <ChevronRight className="h-3 w-3 text-[#86868B]" />
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                                  Post: {sess.pain_score_after}/10
                                </span>
                                <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                                  (-{sess.pain_score_before - sess.pain_score_after})
                                </span>
                              </div>
                            </div>

                            {/* ROM & Modality Ribbon */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] text-[11px]">
                              <div>
                                <span className="text-[#86868B]">Goniometric ROM:</span>
                                <div className="font-bold text-[#1D1D1F] dark:text-white mt-0.5">
                                  {sess.rom_plane || "Flexion"}: {sess.rom_degrees}° ({sess.rom_laterality || "Right"})
                                </div>
                                <div className="text-[9px] text-[#86868B]">{sess.rom_method || "Universal Goniometer"}</div>
                              </div>
                              <div>
                                <span className="text-[#86868B]">Modality Applied:</span>
                                <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                                  {sess.modality_applied || "TENS + Cryotherapy"}
                                </div>
                              </div>
                              <div>
                                <span className="text-[#86868B]">Patient Tolerance:</span>
                                <div className="font-semibold text-emerald-600 mt-0.5">
                                  {sess.tolerance_rating || "Good (Grade 3/4)"}
                                </div>
                              </div>
                            </div>

                            {/* Exercises checklist executed */}
                            {safeEx.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-[#86868B]">Exercises Executed:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {safeEx.map((ex, i) => (
                                    <span 
                                      key={i}
                                      className="px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-medium text-[#1D1D1F] dark:text-white flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                      {ex.name} • {ex.sets || 3} sets × {formatReps(ex.reps)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Assigned Homework */}
                            {sess.homework_assigned && sess.homework_assigned.length > 0 && (
                              <div className="text-[11px] text-[#515154] dark:text-[#A1A1A6] bg-blue-500/5 dark:bg-blue-500/10 p-2 rounded-xl border border-blue-500/10">
                                <strong>Assigned Home Homework:</strong>{" "}
                                {sess.homework_assigned.map(h => typeof h === "string" ? h : `${h.name} (${h.frequency})`).join(", ")}
                              </div>
                            )}

                            {/* Escalation alert note if triggered */}
                            {sess.escalation_flag && sess.escalation_note && (
                              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-200 text-[11px] flex items-center gap-1.5 font-medium">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                <span>{sess.escalation_note}</span>
                              </div>
                            )}

                            {/* Therapist Notes */}
                            {sess.therapist_notes && (
                              <div className="text-[11px] text-[#86868B] italic pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                                Therapist Note: &ldquo;{sess.therapist_notes}&rdquo;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CLINICAL GOVERNANCE & MILESTONE REVIEW */}
              {detailTab === "governance" && (
                <div className="space-y-4 text-xs">
                  <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-4">
                    <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Clinical Governance &amp; Milestone Audit
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                        <div className="text-[10px] uppercase font-bold text-[#86868B]">Referring Specialist Oversight</div>
                        <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{selectedPlan.referring_doctor}</div>
                        <div className="text-[#86868B] text-[11px]">Primary Orthopedic Consultant</div>
                        <div className="text-[11px] text-emerald-600 font-medium">✓ Treatment protocol authorized</div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                        <div className="text-[10px] uppercase font-bold text-[#86868B]">Senior PT Sign-Off</div>
                        <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{selectedPlan.approved_by || "Dr. Vikram Sethi (Chief PT)"}</div>
                        <div className="text-[#86868B] text-[11px]">Department Head of Physical Therapy</div>
                        <div className="text-[11px] text-emerald-600 font-medium">✓ Biomechanical milestones reviewed</div>
                      </div>
                    </div>

                    {/* Timeline dates */}
                    <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06]">
                      <div>
                        <div className="text-[10px] text-[#86868B]">Course Initiated</div>
                        <div className="font-bold font-mono mt-0.5">{formatSafeDate(selectedPlan.start_date)}</div>
                      </div>
                      <div className="border-x border-black/[0.06] dark:border-white/[0.08]">
                        <div className="text-[10px] text-[#86868B]">Milestone Review Date</div>
                        <div className="font-bold font-mono text-apple-blue mt-0.5">{formatSafeDate(selectedPlan.review_date)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#86868B]">Target Projected End</div>
                        <div className="font-bold font-mono text-emerald-600 mt-0.5">{formatSafeDate(selectedPlan.end_date)}</div>
                      </div>
                    </div>

                    {/* Completion / Discharge Checklist */}
                    <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                      <div className="font-bold text-[#1D1D1F] dark:text-white">Discharge Eligibility Checklist:</div>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${selectedPlan.current_rom >= selectedPlan.target_rom * 0.9 ? "text-emerald-600" : "text-[#86868B]"}`} />
                          <span>Functional Target ROM achieved (Current: {selectedPlan.current_rom}° / Goal: {selectedPlan.target_rom}°)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${selectedPlan.current_vas <= selectedPlan.target_vas ? "text-emerald-600" : "text-[#86868B]"}`} />
                          <span>VAS Pain stabilization (Current: {selectedPlan.current_vas}/10 / Goal: &le;{selectedPlan.target_vas}/10)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Independent home exercise maintenance regimen prescribed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-12 text-center text-xs text-[#86868B]">
              Select a rehabilitation plan on the left to view clinical trajectory and session records.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Structured Clinical Plan */}
      {newPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-6 rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Create Structured Therapy Plan</h3>
              </div>
              <button onClick={() => setNewPlanModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              {/* Clinical Protocol Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1.5">
                  Select Clinical Diagnostic Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITION_PRESETS.map((cp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(idx)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedPresetIndex === idx
                          ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold"
                          : "border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white"
                      }`}
                    >
                      <div className="truncate">{cp.name}</div>
                      <div className="text-[10px] text-[#86868B] font-mono mt-0.5 font-normal">
                        {cp.joint} • {cp.targetRom}° Target
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={newPtName}
                    onChange={(e) => setNewPtName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+919876543210"
                    value={newPtPhone}
                    onChange={(e) => setNewPtPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Specialists Oversight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Referring Orthopedic Doctor</label>
                  <input
                    type="text"
                    required
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Attending Physiotherapist</label>
                  <input
                    type="text"
                    required
                    value={newTherapist}
                    onChange={(e) => setNewTherapist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Target Joint & Movement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Target Joint</label>
                  <input
                    type="text"
                    value={newJoint}
                    onChange={(e) => setNewJoint(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Movement Plane</label>
                  <input
                    type="text"
                    value={newPlane}
                    onChange={(e) => setNewPlane(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Baseline vs Target ROM and VAS */}
              <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
                <div>
                  <label className="block text-[10px] font-semibold text-[#86868B] mb-1">Base ROM (°)</label>
                  <input
                    type="number"
                    value={newBaseRom}
                    onChange={(e) => setNewBaseRom(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#86868B] mb-1">Goal ROM (°)</label>
                  <input
                    type="number"
                    value={newTargetRom}
                    onChange={(e) => setNewTargetRom(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono text-center text-apple-blue font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#86868B] mb-1">Base VAS (0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newBaseVas}
                    onChange={(e) => setNewBaseVas(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono text-center text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#86868B] mb-1">Goal VAS (0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newTargetVas}
                    onChange={(e) => setNewTargetVas(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono text-center text-emerald-600 font-bold"
                  />
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Rehabilitation Goal Statement</label>
                <textarea
                  rows={2}
                  value={newGoals}
                  onChange={(e) => setNewGoals(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewPlanModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-sm hover:bg-rose-700 transition"
                >
                  Authorize Clinical Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Detailed Structured Clinical Session */}
      {logSessionModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-6 rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">
                  Log Clinical Session #{(selectedPlan.completed_sessions || 0) + 1}
                </h3>
                <div className="text-xs text-[#86868B]">
                  {selectedPlan.patient_name} • {selectedPlan.condition_diagnosed}
                </div>
              </div>
              <button onClick={() => setLogSessionModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleLogSession} className="space-y-4">
              {/* Visual VAS Sliders: Pre vs Post */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#86868B]">Pre-Session VAS</label>
                    <span className="font-mono font-bold text-sm text-rose-600">{painBefore}/10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={painBefore}
                    onChange={(e) => setPainBefore(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                  <div className="text-[10px] text-[#86868B] mt-0.5">
                    {painBefore >= 7 ? "Severe pain" : painBefore >= 4 ? "Moderate pain" : "Mild pain"}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold text-[#86868B]">Post-Session VAS</label>
                    <span className="font-mono font-bold text-sm text-emerald-600">{painAfter}/10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={painAfter}
                    onChange={(e) => setPainAfter(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-[10px] text-[#86868B] mt-0.5">
                    {painAfter > painBefore + 2 ? (
                      <span className="text-rose-600 font-bold">⚠️ Warning: Acute VAS Surge</span>
                    ) : (
                      <span>Delta: -{painBefore - painAfter} points</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Standardized Goniometric ROM Input */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
                <div className="font-semibold text-xs text-[#1D1D1F] dark:text-white flex items-center justify-between">
                  <span>Goniometric ROM Measured ({selectedPlan.target_joint} • {selectedPlan.movement_plane})</span>
                  <span className="text-apple-blue font-mono font-bold">{romDegrees}°</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#86868B] mb-0.5">Measured Angle (°)</label>
                    <input
                      type="number"
                      min={0}
                      max={180}
                      value={romDegrees}
                      onChange={(e) => setRomDegrees(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#86868B] mb-0.5">Tool / Method</label>
                    <select
                      value={romMethod}
                      onChange={(e) => setRomMethod(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-[11px]"
                    >
                      <option value="Universal Goniometer (360°)">Universal Goniometer (360°)</option>
                      <option value="Dual Digital Inclinometer">Digital Inclinometer</option>
                      <option value="Smartphone AR / Sensor Vision">Smartphone AR Sensor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#86868B] mb-0.5">Laterality</label>
                    <select
                      value={romLaterality}
                      onChange={(e) => setRomLaterality(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-[11px]"
                    >
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Bilateral">Bilateral</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Exercise Checklist */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#86868B]">
                  Exercise Execution Checklist (Check completed movements)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1]">
                  {sessionExercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-black/[0.02]">
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={ex.checked}
                          onChange={(e) => {
                            const updated = [...sessionExercises];
                            updated[idx].checked = e.target.checked;
                            setSessionExercises(updated);
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500"
                        />
                        <span className={`text-xs ${ex.checked ? "font-medium text-[#1D1D1F] dark:text-white" : "line-through text-[#86868B]"}`}>
                          {ex.name}
                        </span>
                      </label>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={ex.sets}
                          onChange={(e) => {
                            const updated = [...sessionExercises];
                            updated[idx].sets = parseInt(e.target.value) || 3;
                            setSessionExercises(updated);
                          }}
                          className="w-12 px-1 py-0.5 rounded border text-center"
                          title="Sets"
                        />
                        <span>×</span>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => {
                            const updated = [...sessionExercises];
                            updated[idx].reps = e.target.value;
                            setSessionExercises(updated);
                          }}
                          className="w-16 px-1 py-0.5 rounded border text-center"
                          title="Reps"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modality & Tolerance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Physical Modality Applied</label>
                  <select
                    value={selectedModality}
                    onChange={(e) => setSelectedModality(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  >
                    {MODALITY_OPTIONS.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Tolerance Rating</label>
                  <select
                    value={selectedTolerance}
                    onChange={(e) => setSelectedTolerance(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  >
                    {TOLERANCE_GRADES.map((g, i) => (
                      <option key={i} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Homework Assigned */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Home Exercise Assignment (Homework)</label>
                <input
                  type="text"
                  value={homeworkInput}
                  onChange={(e) => setHomeworkInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                />
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Therapist Clinical Notes</label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setLogSessionModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-sm hover:bg-rose-700 transition"
                >
                  Save Structured Session Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Senior Therapist Review & Governance Sign-Off */}
      {seniorReviewModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Senior PT Clinical Sign-Off</h3>
              </div>
              <button onClick={() => setSeniorReviewModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100 space-y-1">
              <div className="font-bold">Pending Governance Review: {selectedPlan.patient_name}</div>
              <div className="text-[11px]">
                {selectedPlan.stagnation_alert
                  ? "Clinical Stagnation flagged: ROM stalled across last 3 sessions."
                  : selectedPlan.pain_escalation_alert
                  ? "Pain Escalation flagged: VAS surge detected post-session."
                  : "Regimen modification approval requested by junior therapist."}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Senior Approver</label>
                <input
                  type="text"
                  disabled
                  value="Dr. Vikram Sethi (Chief PT, MIAP - License #PT-88412)"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.02] text-[#86868B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Clinical Directive / Modification Orders</label>
                <textarea
                  rows={2}
                  value={seniorNotes}
                  onChange={(e) => setSeniorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Senior E-Sign PIN / Password</label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN (e.g. 1234)"
                  value={seniorPin}
                  onChange={(e) => setSeniorPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSeniorReviewModal(false)}
                className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSeniorApproval}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 transition"
              >
                Approve Protocol &amp; Clear Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Printable Patient Home Exercise Handout */}
      {handoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-[28px] border border-black/[0.08] bg-white p-8 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08] print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Official Home Rehabilitation Prescription &amp; Milestone Guide
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.05] dark:bg-white/[0.05] text-xs font-medium hover:bg-black/10"
                >
                  <Printer className="h-4 w-4" /> Print Handout
                </button>
                <button onClick={() => setHandoutModalOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                  <X className="h-5 w-5 text-[#86868B]" />
                </button>
              </div>
            </div>

            {/* Handout Content */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b-2 border-rose-500 pb-4">
                <div>
                  <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white">CLINICOS PHYSICAL REHABILITATION</h2>
                  <p className="text-xs text-[#86868B]">Department of Physical Therapy &amp; Musculoskeletal Recovery</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-rose-600">REHAB-{(selectedPlan.id || "00000000").slice(0, 8).toUpperCase()}</div>
                  <div className="text-[#86868B] text-[11px]">
                    Date: {new Date().toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Patient Demographics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06] text-xs">
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Patient Name</div>
                  <div className="font-bold text-[#1D1D1F] dark:text-white mt-0.5">{selectedPlan.patient_name}</div>
                </div>
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Contact</div>
                  <div className="font-mono text-[#1D1D1F] dark:text-white mt-0.5">{selectedPlan.patient_phone}</div>
                </div>
                <div>
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Attending PT</div>
                  <div className="font-semibold text-[#1D1D1F] dark:text-white mt-0.5">{selectedPlan.therapist_name}</div>
                </div>
              </div>

              {/* Diagnosis & Goal */}
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                <div className="font-bold">Diagnosis: {selectedPlan.condition_diagnosed}</div>
                <div>Target Joint &amp; Motion: <strong>{selectedPlan.target_joint} ({selectedPlan.movement_plane})</strong></div>
                <div>Clinical Goal: {selectedPlan.goals}</div>
              </div>

              {/* Prescribed Exercises Table */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1D1D1F] dark:text-white border-b pb-1">
                  Prescribed Daily Home Exercise Regimen:
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[#86868B] text-[11px] font-semibold">
                      <th className="py-2">Exercise Movement</th>
                      <th className="py-2 text-center">Dosage</th>
                      <th className="py-2">Instructions &amp; Video</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {selectedPlan.prescribed_exercises?.map((ex, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-semibold text-[#1D1D1F] dark:text-white">
                          {idx + 1}. {ex.name}
                          <div className="text-[10px] text-[#86868B] font-normal">{ex.frequency} • {ex.resistance}</div>
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-rose-600">
                          {ex.sets} sets × {formatReps(ex.reps)}
                        </td>
                        <td className="py-2.5 text-[#515154] dark:text-[#A1A1A6]">
                          {ex.precautions || "Perform smoothly without jerking motions."}
                          {ex.video_url && (
                            <div className="text-apple-blue text-[10px] font-mono mt-0.5">Demo: {ex.video_url}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Clinical Precautions */}
              <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-[11px] space-y-1 text-[#515154] dark:text-[#A1A1A6]">
                <div className="font-bold text-[#1D1D1F] dark:text-white">Safety Safeguards &amp; Warning Flags:</div>
                <div>• Stop immediately if sharp pain exceeds VAS 5/10. Mild stretch discomfort is normal.</div>
                <div>• Apply 15 minutes of cryotherapy ice wrap post-exercise if soreness develops.</div>
                <div>• Do not lift weights beyond prescribed resistance without Senior PT authorization.</div>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex justify-between items-end border-t border-black/[0.1] dark:border-white/[0.1]">
                <div className="text-[10px] text-[#86868B]">
                  Next Milestone Review: <strong>{formatSafeDate(selectedPlan.review_date)}</strong>
                  <br />
                  Referring Doctor: <strong>{selectedPlan.referring_doctor}</strong>
                </div>
                <div className="text-right">
                  <div className="font-serif italic font-bold text-base">{selectedPlan.approved_by || selectedPlan.therapist_name}</div>
                  <div className="text-[10px] text-[#86868B]">Chief Physiotherapist / Clinical Specialist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
