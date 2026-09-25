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
  Clock,
  Lock,
  GitBranch,
  ShieldAlert,
  Send,
  AlertOctagon
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

export interface ProtocolVersionEntry {
  version: string;
  created_at: string;
  created_by: string;
  approved_by: string;
  change_summary: string;
  status: "active" | "pending_approval" | "superseded";
}

export interface HomeworkItem {
  name: string;
  frequency: string;
  reps?: string;
  video_url?: string;
}

export interface SessionExerciseExecution {
  name: string;
  sets: number;
  reps: string;
  status: "complete" | "modified" | "skipped";
  reason_code?: string;
  modification_note?: string;
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
  exercises_performed: SessionExerciseExecution[];
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
  current_version: string;
  consecutive_pain_spikes: number;
  doctor_escalated: boolean;
  doctor_escalation_reason: string;
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
  version_history: ProtocolVersionEntry[];
  prescribed_exercises: PrescribedExercise[];
  sessions: TherapySession[];
}

const ANATOMICAL_LIMITS: Record<string, { max: number; min: number }> = {
  "shoulder": { min: 0, max: 180 },
  "knee": { min: -10, max: 150 },
  "lumbar spine": { min: 0, max: 75 },
  "cervical spine": { min: 0, max: 85 },
  "hip": { min: 0, max: 130 },
  "ankle": { min: 0, max: 55 }
};

const SKIPPED_REASONS = [
  "ACUTE_PAIN_TRIGGER (VAS > 6)",
  "JOINT_EFFUSION_SWELLING",
  "MUSCLE_GUARDING_SPASM",
  "PATIENT_FATIGUE_EXHAUSTION",
  "TIME_CONSTRAINT",
  "CONTRAINDICATION_DISCOVERED"
];

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
  "Dry Needling / Myofascial Release"
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

export default function RehabDashboardPage() {
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TherapyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "alerts" | "completed">("all");
  const [detailTab, setDetailTab] = useState<"governance" | "metrics" | "regimen" | "sessions">("governance");

  // Modals
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [logSessionModal, setLogSessionModal] = useState(false);
  const [adjustProtocolModal, setAdjustProtocolModal] = useState(false);
  const [seniorReviewModal, setSeniorReviewModal] = useState(false);
  const [handoutModalOpen, setHandoutModalOpen] = useState(false);
  const [doctorReferralModal, setDoctorReferralModal] = useState(false);

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
  const [sessionNotes, setSessionNotes] = useState("Session conducted with careful active-assisted tracking.");
  const [selectedModality, setSelectedModality] = useState("TENS (80Hz Conventional)");
  const [selectedTolerance, setSelectedTolerance] = useState("Good (Grade 3/4)");
  const [sessionExecutions, setSessionExecutions] = useState<SessionExerciseExecution[]>([]);
  const [homeworkInput, setHomeworkInput] = useState("Perform active pendulum swings 15 reps twice daily before sleep.");
  const [gatedClosureError, setGatedClosureError] = useState<string | null>(null);

  // Adjust Protocol Form State
  const [modExercises, setModExercises] = useState<PrescribedExercise[]>([]);
  const [modChangeSummary, setModChangeSummary] = useState("");

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

  // Open Log Session modal with gated checklist
  const handleOpenLogSession = () => {
    if (!selectedPlan) return;
    setGatedClosureError(null);
    const baseEx: SessionExerciseExecution[] = (selectedPlan.prescribed_exercises && selectedPlan.prescribed_exercises.length > 0)
      ? selectedPlan.prescribed_exercises.map(e => ({ 
          name: e.name, 
          sets: e.sets || 3, 
          reps: e.reps || "12 reps", 
          status: "complete" as const,
          reason_code: "" 
        }))
      : [
          { name: "Active Assisted Range Exercises", sets: 3, reps: "12 reps", status: "complete", reason_code: "" },
          { name: "Isometric Rotator Cuff Activation", sets: 3, reps: "10 reps", status: "complete", reason_code: "" }
        ];

    setSessionExecutions(baseEx);
    setRomDegrees(selectedPlan.current_rom ? Math.min(selectedPlan.target_rom, selectedPlan.current_rom + 5) : 95);
    setPainBefore(Math.max(1, selectedPlan.current_vas ? selectedPlan.current_vas + 1 : 6));
    setPainAfter(Math.max(1, selectedPlan.current_vas ? selectedPlan.current_vas - 1 : 3));
    setLogSessionModal(true);
  };

  // Open Adjust Protocol modal
  const handleOpenAdjustProtocol = () => {
    if (!selectedPlan) return;
    setModExercises(JSON.parse(JSON.stringify(selectedPlan.prescribed_exercises || [])));
    setModChangeSummary("Progressed resistance parameters & added targeted active range movements.");
    setAdjustProtocolModal(true);
  };

  // Check Anatomical Limits
  const anatomicalLimitCheck = useMemo(() => {
    if (!selectedPlan) return { valid: true, error: "" };
    const jointKey = (selectedPlan.target_joint || "shoulder").toLowerCase();
    const matched = Object.entries(ANATOMICAL_LIMITS).find(([k]) => jointKey.includes(k));
    if (matched) {
      const { min, max } = matched[1];
      if (romDegrees > max || romDegrees < min) {
        return { 
          valid: false, 
          error: `Input Rejected: ${romDegrees}° exceeds physiological maximum for ${selectedPlan.target_joint} (Max: ${max}°, Min: ${min}°). Entry blocked to preserve clinical data integrity.` 
        };
      }
    }
    return { valid: true, error: "" };
  }, [selectedPlan, romDegrees]);

  // Gated Closure Check in Modal
  const isGatedClosureValid = useMemo(() => {
    if (!sessionExecutions || sessionExecutions.length === 0) return false;
    for (const ex of sessionExecutions) {
      if (ex.status === "skipped" && (!ex.reason_code || !ex.reason_code.trim())) {
        return false;
      }
    }
    return anatomicalLimitCheck.valid && Boolean(romMethod && romMethod.trim());
  }, [sessionExecutions, anatomicalLimitCheck, romMethod]);

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!isGatedClosureValid) {
      setGatedClosureError("Gated Session Closure Error: All exercises must be verified. Skipped movements require a mandatory Reason Code.");
      return;
    }

    try {
      const nextSessionNumber = (selectedPlan.completed_sessions || 0) + 1;
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
          exercises_performed: sessionExecutions,
          homework_assigned: [{ name: homeworkInput, frequency: "Daily", reps: "As tolerated" }],
          therapist_notes: sessionNotes
        })
      });

      if (res.ok) {
        setLogSessionModal(false);
        await fetchPlans();
        // Automatically open home exercise PDF handout upon closure
        setHandoutModalOpen(true);
      } else {
        const err = await res.json();
        setGatedClosureError(err.error || "Failed to commit session closure.");
      }
    } catch (e: any) {
      setGatedClosureError(e.message || "Failed to log session.");
    }
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

  const handleProposeProtocolModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    try {
      const res = await fetch("/api/rehab/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          action: "propose_modification",
          created_by: selectedPlan.therapist_name,
          change_summary: modChangeSummary,
          prescribed_exercises: modExercises
        })
      });
      if (res.ok) {
        setAdjustProtocolModal(false);
        await fetchPlans();
      }
    } catch (e) {
      console.error("Propose modification error:", e);
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
          approved_by: "Dr. Vikram Sethi (Chief PT, MIAP - License #PT-88412)"
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

  const handleEscalateToDoctor = async () => {
    if (!selectedPlan) return;
    try {
      const res = await fetch("/api/rehab/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          action: "escalate_to_doctor",
          reason: `Case referral to ${selectedPlan.referring_doctor}: Clinical plateau / consecutive pain surges observed. Re-evaluation of joint biomechanics requested.`
        })
      });
      if (res.ok) {
        setDoctorReferralModal(false);
        await fetchPlans();
      }
    } catch (e) {
      console.error("Escalate error:", e);
    }
  };

  const handleCompletePlan = async () => {
    if (!selectedPlan) return;
    if (!confirm(`Mark ${selectedPlan.patient_name}'s rehabilitation course as COMPLETE? Discharge summary will be committed to immutable patient record.`)) return;
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

  // Filtered plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (activeFilter === "active" && p.status !== "active") return false;
      if (activeFilter === "completed" && p.status !== "completed") return false;
      if (activeFilter === "alerts" && !p.stagnation_alert && !p.pain_escalation_alert && p.modification_status !== "pending_senior_review" && !p.doctor_escalated) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (p.patient_name || "").toLowerCase().includes(q) ||
        (p.condition_diagnosed || "").toLowerCase().includes(q) ||
        (p.patient_phone || "").toLowerCase().includes(q) ||
        (p.referring_doctor || "").toLowerCase().includes(q) ||
        (p.target_joint || "").toLowerCase().includes(q)
      );
    });
  }, [plans, searchQuery, activeFilter]);

  // Aggregate Metrics
  const activePlansCount = plans.filter(p => p.status === "active").length;
  const alertsCount = plans.filter(p => p.stagnation_alert || p.pain_escalation_alert || p.modification_status === "pending_senior_review" || p.doctor_escalated).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header Bar */}
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
                  Marley Rehab Core
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Senior PT Governed
                </span>
              </div>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-medium">
                Version-Controlled Protocols • Threshold-Based Alerts • Validated Clinical Inputs • Automated Discharge Criteria
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

      {/* THE 4 OPERATIONAL GOVERNANCE PILLARS (Top Operational Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Version-Controlled Protocols */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
              <GitBranch className="h-4 w-4" /> Versioned Protocols
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-rose-500/10 text-rose-600 font-semibold">
              v1.0 - v2.0
            </span>
          </div>
          <div className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
            Structured &amp; Versioned Plans
          </div>
          <p className="text-[11px] text-[#86868B] leading-relaxed">
            Plans initiated by doctor or senior PT. Core exercise modifications require Senior Therapist e-sign. Immutable version history tracks every protocol change.
          </p>
        </div>

        {/* Pillar 2: Validated VAS/ROM Capture */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-apple-blue flex items-center gap-1.5">
              <Compass className="h-4 w-4" /> Validated Inputs
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-500/10 text-apple-blue font-semibold">
              Anatomical Bounds
            </span>
          </div>
          <div className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
            Validated VAS/ROM Capture
          </div>
          <p className="text-[11px] text-[#86868B] leading-relaxed">
            ROM inputs validated against anatomical limits per joint (max 180° for shoulder). Mandatory measurement tool (Goniometer/Sensor). Auto-alert on consecutive pain spikes.
          </p>
        </div>

        {/* Pillar 3: Gated Session Closure */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <Lock className="h-4 w-4" /> Gated Closure
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-600 font-semibold">
              Zero Unchecked
            </span>
          </div>
          <div className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
            Gated Session Closure
          </div>
          <p className="text-[11px] text-[#86868B] leading-relaxed">
            Session cannot close until all exercises are marked Complete, Skipped, or Modified. Skipped items require mandatory Reason Code. Auto-generates patient home PDF.
          </p>
        </div>

        {/* Pillar 4: Automated Progress Escalation */}
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] space-y-2">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Auto-Escalation
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-600 font-semibold">
              Ortho Referral
            </span>
          </div>
          <div className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
            Progress Monitoring &amp; Alerts
          </div>
          <p className="text-[11px] text-[#86868B] leading-relaxed">
            Stagnation detection: If ROM/VAS shows zero improvement over 2 weeks, auto-escalates to referring doctor. Discharge criteria evaluated automatically at review date.
          </p>
        </div>
      </div>

      {/* Main Split: Left Column (4 cols) = Plans; Right Column (8 cols) = Detail Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Patient Plans (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">Structured Therapy Registry</h3>
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
              Active ({activePlansCount})
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
              placeholder="Search patient, doctor, diagnosis, joint..."
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
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-black/[0.04] dark:bg-white/[0.08] text-[#86868B]">
                            v{p.current_version || "1.0"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#86868B] font-mono">{p.patient_phone}</div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono bg-black/[0.04] dark:bg-white/[0.08]">
                          {completed} / {target} Sessions
                        </span>
                        {p.doctor_escalated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                            🚨 Ortho Escalated
                          </span>
                        )}
                        {p.modification_status === "pending_senior_review" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ⏳ Sign-Off Pending
                          </span>
                        )}
                        {p.stagnation_alert && !p.doctor_escalated && (
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
                      <span>{p.referring_doctor}</span>
                    </div>

                    {/* ROM & VAS Indicators */}
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
                        <span>Recovery Goal ({p.target_rom}°)</span>
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
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      Protocol v{selectedPlan.current_version || "1.0"}
                    </span>
                    {selectedPlan.modification_status === "approved" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Senior PT Approved
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Modifications Pending Sign-Off
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-[#86868B] mt-1.5 flex items-center gap-3 flex-wrap">
                    <span>Referring: <strong>{selectedPlan.referring_doctor}</strong></span>
                    <span>•</span>
                    <span>PT: <strong>{selectedPlan.therapist_name}</strong></span>
                    <span>•</span>
                    <span>Review Milestone: <strong>{formatSafeDate(selectedPlan.review_date)}</strong></span>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setHandoutModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white font-medium text-xs hover:bg-black/5 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Home PDF</span>
                  </button>

                  <button
                    onClick={handleOpenAdjustProtocol}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white font-medium text-xs hover:bg-black/5 transition"
                    title="Propose modification to prescribed exercises"
                  >
                    <GitBranch className="h-3.5 w-3.5 text-rose-500" />
                    <span>Adjust Protocol</span>
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
                </div>
              </div>

              {/* CRITICAL DOCTOR ESCALATION BANNER (If triggered) */}
              {selectedPlan.doctor_escalated && (
                <div className="p-4 rounded-2xl bg-rose-600/10 border-2 border-rose-600/30 text-rose-950 dark:text-rose-100 text-xs space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold flex items-center gap-1.5 text-rose-600 text-sm">
                      <AlertOctagon className="h-4 w-4" />
                      CRITICAL CASE ESCALATED TO REFERRING DOCTOR
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-600 text-white font-bold">
                      DOCTOR DISPATCH ACTIVE
                    </span>
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    <strong>Escalation Directive:</strong> {selectedPlan.doctor_escalation_reason || "Case escalated due to persistent clinical plateau or consecutive acute pain surges."}
                  </div>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={() => setDoctorReferralModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium text-[11px] hover:bg-rose-700 flex items-center gap-1"
                    >
                      <Send className="h-3 w-3" /> View Doctor WhatsApp Referral
                    </button>
                    <button
                      onClick={() => setSeniorReviewModal(true)}
                      className="px-3 py-1.5 rounded-lg border border-black/[0.1] bg-white dark:bg-[#2C2C2E] text-[11px] font-medium"
                    >
                      Acknowledge &amp; Authorize Plan Adjustment
                    </button>
                  </div>
                </div>
              )}

              {/* Studio Navigation Tabs */}
              <div className="flex border-b border-black/[0.06] dark:border-white/[0.08] text-xs">
                <button
                  onClick={() => setDetailTab("governance")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "governance"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Protocol Governance &amp; Version History
                </button>
                <button
                  onClick={() => setDetailTab("metrics")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "metrics"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Validated VAS/ROM Tracking
                </button>
                <button
                  onClick={() => setDetailTab("regimen")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "regimen"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Core Prescribed Protocol ({selectedPlan.prescribed_exercises?.length || 0})
                </button>
                <button
                  onClick={() => setDetailTab("sessions")}
                  className={`pb-2.5 px-4 font-semibold transition border-b-2 ${
                    detailTab === "sessions"
                      ? "border-rose-600 text-rose-600"
                      : "border-transparent text-[#86868B] hover:text-[#1D1D1F]"
                  }`}
                >
                  Session Execution Logs ({selectedPlan.sessions?.length || 0})
                </button>
              </div>

              {/* TAB 1: PROTOCOL GOVERNANCE & VERSION HISTORY */}
              {detailTab === "governance" && (
                <div className="space-y-5 text-xs">
                  {/* Governance Overview Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Referring Specialist</div>
                      <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{selectedPlan.referring_doctor}</div>
                      <div className="text-[11px] text-[#86868B]">Primary Orthopedic Consultant</div>
                      <div className="text-[11px] text-emerald-600 font-semibold pt-1">
                        ✓ Initial medical diagnosis &amp; range target authorized
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-[#86868B]">Senior PT Governance Oversight</div>
                      <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{selectedPlan.approved_by}</div>
                      <div className="text-[11px] text-[#86868B]">Chief Physiotherapist (License Verified)</div>
                      <div className="text-[11px] text-emerald-600 font-semibold pt-1">
                        ✓ Biomechanical loading &amp; progression governed
                      </div>
                    </div>
                  </div>

                  {/* Immutable Protocol Version History */}
                  <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                          <GitBranch className="h-4 w-4 text-rose-500" />
                          Immutable Protocol Version History
                        </h4>
                        <p className="text-[11px] text-[#86868B]">
                          Audited change-log: Previous plan versions are immutable to protect patient safety.
                        </p>
                      </div>
                      <button
                        onClick={handleOpenAdjustProtocol}
                        className="text-xs px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] hover:bg-black/5 font-semibold text-rose-600"
                      >
                        + Propose Modification
                      </button>
                    </div>

                    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {selectedPlan.version_history?.map((ver, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-start text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.08]">
                                Version {ver.version}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                ver.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : ver.status === "pending_approval"
                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                  : "bg-black/[0.04] text-[#86868B]"
                              }`}>
                                {ver.status.replace("_", " ")}
                              </span>
                            </div>
                            <div className="mt-1 text-[#515154] dark:text-[#A1A1A6]">
                              {ver.change_summary}
                            </div>
                            <div className="text-[10px] text-[#86868B] mt-0.5">
                              Created by {ver.created_by} • Approved: {ver.approved_by}
                            </div>
                          </div>
                          <span className="text-[10px] text-[#86868B] font-mono">
                            {formatSafeDate(ver.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Automated Discharge Eligibility */}
                  <div className="p-4 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                    <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                      Automated Discharge Criteria Evaluation
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${selectedPlan.current_rom >= selectedPlan.target_rom * 0.9 ? "text-emerald-600" : "text-[#86868B]"}`} />
                        <span>Functional Target ROM achieved (Current: {selectedPlan.current_rom}° / Target Goal: {selectedPlan.target_rom}°)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${selectedPlan.current_vas <= selectedPlan.target_vas ? "text-emerald-600" : "text-[#86868B]"}`} />
                        <span>VAS Pain threshold stabilization (Current: {selectedPlan.current_vas}/10 / Goal: &le;{selectedPlan.target_vas}/10)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Independent home exercise maintenance regimen generated</span>
                      </div>
                    </div>

                    {selectedPlan.status === "active" && (
                      <div className="pt-2">
                        <button
                          onClick={handleCompletePlan}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-sm hover:bg-emerald-700 transition"
                        >
                          Commit Official Discharge &amp; Archive Course
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: VALIDATED VAS/ROM TRACKING */}
              {detailTab === "metrics" && (
                <div className="space-y-6">
                  {/* Standardized VAS Trajectory */}
                  <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <Flame className="h-4 w-4 text-rose-500" />
                          Validated VAS Pain Score Trajectory (0-10)
                        </h4>
                        <p className="text-[11px] text-[#86868B]">
                          Auto-alert rule: Triggered if Post-Session VAS &gt; Pre-Session VAS +2 points for 2 consecutive sessions.
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-mono font-bold">
                        Consecutive Spikes: {selectedPlan.consecutive_pain_spikes || 0}
                      </span>
                    </div>

                    {/* VAS Chart */}
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
                  </div>

                  {/* Standardized Goniometric ROM Progress Gauge */}
                  <div className="p-5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <Compass className="h-4 w-4 text-apple-blue" />
                          Standardized Goniometric ROM Tracker
                        </h4>
                        <p className="text-[11px] text-[#86868B]">
                          Validated inputs against physiological limit for {selectedPlan.target_joint} ({selectedPlan.movement_plane})
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-xl bg-apple-blue/10 text-apple-blue font-mono font-semibold">
                        Goniometer 360° Mandatory
                      </span>
                    </div>

                    {/* ROM Comparison Gauge */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] text-center">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-[#86868B]">Baseline Intake</div>
                        <div className="text-xl font-bold font-mono text-[#1D1D1F] dark:text-white mt-1">
                          {selectedPlan.baseline_rom}°
                        </div>
                        <div className="text-[10px] text-[#86868B]">Day 1 Value</div>
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
                        <div className="text-[10px] text-[#86868B]">Physiological Limit</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CORE PRESCRIBED PROTOCOL */}
              {detailTab === "regimen" && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                        Governed Core Movement Prescriptions (v{selectedPlan.current_version})
                      </h4>
                      <p className="text-[#86868B]">
                        Modifications require Senior PT license sign-off and append to version history.
                      </p>
                    </div>
                    <button
                      onClick={handleOpenAdjustProtocol}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-medium text-xs shadow-sm hover:bg-rose-700 transition"
                    >
                      Adjust Protocol
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedPlan.prescribed_exercises?.map((ex, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">
                              {idx + 1}. {ex.name}
                            </div>
                            <div className="text-[#86868B] text-[11px] mt-0.5">
                              Frequency: <strong className="text-[#1D1D1F] dark:text-white">{ex.frequency}</strong> • Rest: {ex.rest_seconds || 45}s
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 font-mono font-bold">
                              {ex.sets} sets × {ex.reps}
                            </span>
                            {ex.video_url && (
                              <a
                                href={ex.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] text-apple-blue hover:bg-apple-blue/10 transition"
                                title="Watch clinical demo"
                              >
                                <Video className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                          <div>
                            <span className="text-[#86868B]">Resistance:</span> <strong>{ex.resistance}</strong>
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

              {/* TAB 4: SESSION EXECUTION LOGS */}
              {detailTab === "sessions" && (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-rose-500" />
                        Gated Session Execution Audit
                      </h4>
                      <p className="text-[#86868B]">
                        Each session is locked upon gated verification of all movements, pre/post VAS, and goniometer audit.
                      </p>
                    </div>
                    <span className="text-xs text-[#86868B]">
                      {selectedPlan.sessions?.length || 0} completed
                    </span>
                  </div>

                  {(!selectedPlan.sessions || selectedPlan.sessions.length === 0) ? (
                    <div className="py-8 text-center text-xs text-[#86868B] border border-dashed rounded-2xl">
                      No clinical sessions committed yet. Click &ldquo;Log Session&rdquo; to start.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlan.sessions.map((sess) => (
                        <div 
                          key={sess.id || `sess-${sess.session_number}`}
                          className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-3"
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

                            {/* VAS Badge */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#86868B]">VAS Delta:</span>
                              <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 font-mono font-bold">
                                {sess.pain_score_before}/10
                              </span>
                              <ChevronRight className="h-3 w-3 text-[#86868B]" />
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                                {sess.pain_score_after}/10
                              </span>
                            </div>
                          </div>

                          {/* ROM & Modality */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] text-[11px]">
                            <div>
                              <span className="text-[#86868B]">Goniometric ROM:</span>
                              <div className="font-bold text-[#1D1D1F] dark:text-white mt-0.5">
                                {sess.rom_plane || "Abduction"}: {sess.rom_degrees}° ({sess.rom_laterality || "Right"})
                              </div>
                              <div className="text-[9px] text-[#86868B]">{sess.rom_method}</div>
                            </div>
                            <div>
                              <span className="text-[#86868B]">Modality Applied:</span>
                              <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                                {sess.modality_applied}
                              </div>
                            </div>
                            <div>
                              <span className="text-[#86868B]">Tolerance Rating:</span>
                              <div className="font-semibold text-emerald-600 mt-0.5">
                                {sess.tolerance_rating}
                              </div>
                            </div>
                          </div>

                          {/* Gated Exercises Executed */}
                          {sess.exercises_performed && sess.exercises_performed.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-[#86868B]">Verified Movement Execution:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {sess.exercises_performed.map((ex, i) => (
                                  <span 
                                    key={i}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 ${
                                      ex.status === "skipped"
                                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                                        : ex.status === "modified"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white"
                                    }`}
                                  >
                                    {ex.status === "skipped" ? (
                                      <X className="h-3 w-3 text-rose-600 shrink-0" />
                                    ) : (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                                    )}
                                    <span>{ex.name}</span>
                                    {ex.status === "skipped" && (
                                      <span className="font-mono text-[9px] font-bold uppercase">
                                        [SKIPPED: {ex.reason_code}]
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {sess.therapist_notes && (
                            <div className="text-[11px] text-[#86868B] italic pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
                              Therapist Note: &ldquo;{sess.therapist_notes}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-12 text-center text-xs text-[#86868B]">
              Select a rehabilitation plan on the left to inspect protocol governance.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Structured Plan */}
      {newPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-6 rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Create Structured Therapy Plan (v1.0)</h3>
              </div>
              <button onClick={() => setNewPlanModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              {/* Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1.5">Diagnostic Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONDITION_PRESETS.map((cp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPresetIndex(idx);
                        setNewCondition(cp.name);
                        setNewJoint(cp.joint);
                        setNewPlane(cp.plane);
                        setNewBaseRom(cp.baseRom);
                        setNewTargetRom(cp.targetRom);
                        setNewBaseVas(cp.baseVas);
                        setNewTargetVas(cp.targetVas);
                      }}
                      className={`p-2 rounded-xl border text-left transition ${
                        selectedPresetIndex === idx
                          ? "border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold"
                          : "border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white"
                      }`}
                    >
                      <div className="truncate">{cp.name}</div>
                      <div className="text-[10px] text-[#86868B] font-mono">{cp.joint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={newPtName}
                    onChange={(e) => setNewPtName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
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
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono"
                  />
                </div>
              </div>

              {/* Doctors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Referring Orthopedic Doctor</label>
                  <input
                    type="text"
                    required
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Senior Approver PT</label>
                  <input
                    type="text"
                    required
                    value={newSeniorPt}
                    onChange={(e) => setNewSeniorPt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E]"
                  />
                </div>
              </div>

              {/* ROM / VAS */}
              <div className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04]">
                <div>
                  <label className="block text-[10px] text-[#86868B] mb-1">Base ROM (°)</label>
                  <input
                    type="number"
                    value={newBaseRom}
                    onChange={(e) => setNewBaseRom(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868B] mb-1">Target ROM (°)</label>
                  <input
                    type="number"
                    value={newTargetRom}
                    onChange={(e) => setNewTargetRom(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border text-center font-mono text-apple-blue font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868B] mb-1">Base VAS</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newBaseVas}
                    onChange={(e) => setNewBaseVas(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border text-center font-mono text-rose-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#86868B] mb-1">Goal VAS</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={newTargetVas}
                    onChange={(e) => setNewTargetVas(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 rounded-lg border text-center font-mono text-emerald-600 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
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
                  Commit Version 1.0 Protocol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GATED SESSION CLOSURE */}
      {logSessionModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl my-6 rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  Gated Session Closure #{(selectedPlan.completed_sessions || 0) + 1}
                </h3>
                <div className="text-xs text-[#86868B]">
                  {selectedPlan.patient_name} • Protocol v{selectedPlan.current_version}
                </div>
              </div>
              <button onClick={() => setLogSessionModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            {/* Error display if gated check fails */}
            {gatedClosureError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{gatedClosureError}</span>
              </div>
            )}

            {!anatomicalLimitCheck.valid && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{anatomicalLimitCheck.error}</span>
              </div>
            )}

            <form onSubmit={handleLogSession} className="space-y-4">
              {/* VAS Pre vs Post */}
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04]">
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
                  {painAfter > painBefore + 2 && (
                    <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                      ⚠️ Acute Pain Spike (+{painAfter - painBefore} pts)
                    </div>
                  )}
                </div>
              </div>

              {/* Goniometric ROM with Physiological Bound Checks */}
              <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] space-y-2">
                <div className="font-semibold text-xs flex justify-between items-center">
                  <span>Goniometric ROM Input ({selectedPlan.target_joint})</span>
                  <span className={`font-mono font-bold ${anatomicalLimitCheck.valid ? "text-apple-blue" : "text-rose-600"}`}>
                    {romDegrees}°
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#86868B] mb-0.5">Measured Angle (°)</label>
                    <input
                      type="number"
                      value={romDegrees}
                      onChange={(e) => setRomDegrees(parseInt(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-lg border text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#86868B] mb-0.5">Method (Mandatory)</label>
                    <select
                      value={romMethod}
                      onChange={(e) => setRomMethod(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border text-[11px]"
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
                      className="w-full px-2 py-1.5 rounded-lg border text-[11px]"
                    >
                      <option value="Right">Right</option>
                      <option value="Left">Left</option>
                      <option value="Bilateral">Bilateral</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Gated Exercise Checklist with Complete / Modified / Skipped + Reason Code */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-[#86868B]">
                    Gated Movement Execution Checklist (All must be accounted for)
                  </label>
                  <span className="text-[10px] text-emerald-600 font-mono font-semibold">
                    100% Gated Enforcement
                  </span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1]">
                  {sessionExecutions.map((ex, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                          {ex.name}
                        </span>

                        {/* Tri-state status buttons */}
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...sessionExecutions];
                              updated[idx].status = "complete";
                              updated[idx].reason_code = "";
                              setSessionExecutions(updated);
                            }}
                            className={`px-2 py-0.5 rounded font-semibold transition ${
                              ex.status === "complete"
                                ? "bg-emerald-600 text-white"
                                : "bg-black/[0.05] dark:bg-white/[0.05] text-[#86868B]"
                            }`}
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...sessionExecutions];
                              updated[idx].status = "modified";
                              setSessionExecutions(updated);
                            }}
                            className={`px-2 py-0.5 rounded font-semibold transition ${
                              ex.status === "modified"
                                ? "bg-amber-600 text-white"
                                : "bg-black/[0.05] dark:bg-white/[0.05] text-[#86868B]"
                            }`}
                          >
                            Modified
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...sessionExecutions];
                              updated[idx].status = "skipped";
                              if (!updated[idx].reason_code) updated[idx].reason_code = SKIPPED_REASONS[0];
                              setSessionExecutions(updated);
                            }}
                            className={`px-2 py-0.5 rounded font-semibold transition ${
                              ex.status === "skipped"
                                ? "bg-rose-600 text-white"
                                : "bg-black/[0.05] dark:bg-white/[0.05] text-[#86868B]"
                            }`}
                          >
                            Skipped
                          </button>
                        </div>
                      </div>

                      {/* If Skipped, MANDATORY REASON CODE */}
                      {ex.status === "skipped" && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-rose-600 font-bold shrink-0">Reason Code:</span>
                          <select
                            value={ex.reason_code}
                            onChange={(e) => {
                              const updated = [...sessionExecutions];
                              updated[idx].reason_code = e.target.value;
                              setSessionExecutions(updated);
                            }}
                            className="flex-1 px-2 py-1 rounded border border-rose-300 dark:border-rose-900 bg-white dark:bg-[#2C2C2E] text-[10px] font-mono text-rose-700 dark:text-rose-300"
                          >
                            {SKIPPED_REASONS.map((r, ri) => (
                              <option key={ri} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Dosage details */}
                      <div className="text-[10px] text-[#86868B] font-mono">
                        Target Dosage: {ex.sets} sets × {ex.reps}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modality & Tolerance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Modality Applied</label>
                  <select
                    value={selectedModality}
                    onChange={(e) => setSelectedModality(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border text-xs"
                  >
                    {MODALITY_OPTIONS.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Tolerance</label>
                  <select
                    value={selectedTolerance}
                    onChange={(e) => setSelectedTolerance(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border text-xs"
                  >
                    <option value="Excellent">Excellent (Pain-free)</option>
                    <option value="Good (Grade 3/4)">Good (Grade 3/4 tolerated)</option>
                    <option value="Fair (Guarding)">Fair (Mild Guarding/Spasm)</option>
                    <option value="Poor (Terminated)">Poor (Terminated Early)</option>
                  </select>
                </div>
              </div>

              {/* Homework */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Home Exercise PDF Assignment
                </label>
                <input
                  type="text"
                  value={homeworkInput}
                  onChange={(e) => setHomeworkInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-rose-500"
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
                  disabled={!isGatedClosureValid}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 transition disabled:opacity-40"
                >
                  Verify &amp; Commit Session Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADJUST PROTOCOL (PLAN MODIFICATION WORKFLOW) */}
      {adjustProtocolModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg my-6 rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <GitBranch className="h-4 w-4 text-rose-500" />
                  Propose Protocol Adjustment
                </h3>
                <div className="text-xs text-[#86868B]">
                  Increments version to v{parseFloat(selectedPlan.current_version || "1.0") + 0.1} • Requires Senior PT e-sign
                </div>
              </div>
              <button onClick={() => setAdjustProtocolModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleProposeProtocolModification} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                  Clinical Rationale for Protocol Modification
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Patient cleared for closed kinetic chain load progression; increased Theraband resistance."
                  value={modChangeSummary}
                  onChange={(e) => setModChangeSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#86868B]">
                  Core Exercises to Prescribe
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-xl">
                  {modExercises.map((ex, i) => (
                    <div key={i} className="p-2 rounded-lg bg-black/[0.02] space-y-1">
                      <div className="font-bold text-xs">{ex.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span>Sets/Reps:</span>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) => {
                              const updated = [...modExercises];
                              updated[i].reps = e.target.value;
                              setModExercises(updated);
                            }}
                            className="w-full px-2 py-0.5 rounded border mt-0.5"
                          />
                        </div>
                        <div>
                          <span>Resistance:</span>
                          <input
                            type="text"
                            value={ex.resistance}
                            onChange={(e) => {
                              const updated = [...modExercises];
                              updated[i].resistance = e.target.value;
                              setModExercises(updated);
                            }}
                            className="w-full px-2 py-0.5 rounded border mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAdjustProtocolModal(false)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-sm hover:bg-rose-700 transition"
                >
                  Submit for Senior PT Sign-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: SENIOR PT SIGN-OFF */}
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
                {selectedPlan.doctor_escalated
                  ? "Doctor Escalation active: Review Orthopedic recommendations."
                  : selectedPlan.stagnation_alert
                  ? "Clinical Stagnation flagged: 2-week plateau requires protocol evolution."
                  : selectedPlan.pain_escalation_alert
                  ? "Pain Escalation flagged: VAS surge detected post-session."
                  : "Junior therapist submitted protocol adjustment for authorization."}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Chief Physiotherapist</label>
                <input
                  type="text"
                  disabled
                  value="Dr. Vikram Sethi (Chief PT, MIAP - License #PT-88412)"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] text-[#86868B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Clinical Directive / Orders</label>
                <textarea
                  rows={2}
                  value={seniorNotes}
                  onChange={(e) => setSeniorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Senior E-Sign PIN</label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN (e.g. 1234)"
                  value={seniorPin}
                  onChange={(e) => setSeniorPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border font-mono outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSeniorReviewModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSeniorApproval}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm hover:bg-emerald-700 transition"
              >
                Authorize Protocol &amp; Clear Alerts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DOCTOR REFERRAL DISPATCH */}
      {doctorReferralModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Ortho Case Escalation Dispatch</h3>
              </div>
              <button onClick={() => setDoctorReferralModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/[0.02] border space-y-1 font-mono text-[11px]">
              <div><strong>Recipient:</strong> {selectedPlan.referring_doctor}</div>
              <div><strong>Patient:</strong> {selectedPlan.patient_name} ({selectedPlan.patient_phone})</div>
              <div><strong>Joint:</strong> {selectedPlan.target_joint} ({selectedPlan.movement_plane})</div>
              <div><strong>Issue:</strong> Stagnation &gt; 2 weeks / VAS surge</div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-900 dark:text-blue-100 text-[11px] leading-relaxed">
              &ldquo;Dr. Shenoy, patient {selectedPlan.patient_name} has hit an anatomical plateau at {selectedPlan.current_rom}° across 3 consecutive sessions. Case referred for clinical re-evaluation.&rdquo;
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDoctorReferralModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleEscalateToDoctor}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-sm hover:bg-rose-700 transition"
              >
                Send Dispatch via WhatsApp / SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: PRINTABLE HOME EXERCISE PDF HANDOUT */}
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
                  <Printer className="h-4 w-4" /> Print PDF Handout
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

              {/* Patient Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border text-xs">
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

              {/* Diagnosis */}
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                <div className="font-bold">Diagnosis: {selectedPlan.condition_diagnosed}</div>
                <div>Target Joint &amp; Motion: <strong>{selectedPlan.target_joint} ({selectedPlan.movement_plane})</strong></div>
                <div>Clinical Milestone Goal: {selectedPlan.goals}</div>
              </div>

              {/* Prescribed Movements Table */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1D1D1F] dark:text-white border-b pb-1">
                  Prescribed Daily Home Exercise Regimen (v{selectedPlan.current_version}):
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[#86868B] text-[11px] font-semibold">
                      <th className="py-2">Exercise Movement</th>
                      <th className="py-2 text-center">Dosage</th>
                      <th className="py-2">Instructions &amp; Video Link</th>
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
                          {ex.sets} sets × {ex.reps}
                        </td>
                        <td className="py-2.5 text-[#515154] dark:text-[#A1A1A6]">
                          {ex.precautions || "Perform smoothly without jerking motions."}
                          {ex.video_url && (
                            <div className="text-apple-blue text-[10px] font-mono mt-0.5">Video: {ex.video_url}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Safety Safeguards */}
              <div className="p-3 rounded-xl border text-[11px] space-y-1 text-[#515154] dark:text-[#A1A1A6]">
                <div className="font-bold text-[#1D1D1F] dark:text-white">Clinical Precautions:</div>
                <div>• Stop immediately if sharp pain exceeds VAS 5/10. Mild stretch discomfort is normal.</div>
                <div>• Apply 15 minutes of cryotherapy ice wrap post-exercise if soreness develops.</div>
                <div>• Do not advance resistance without Senior PT authorization.</div>
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
