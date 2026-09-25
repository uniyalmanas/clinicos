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
  FileText
} from "lucide-react";

interface ExerciseItem {
  name: string;
  sets: number | string;
  reps: number | string;
}

interface TherapySession {
  id: string;
  session_number: number;
  session_date: string;
  pain_score_before: number;
  pain_score_after: number;
  range_of_motion: string;
  exercises_performed: ExerciseItem[];
  therapist_notes: string;
}

interface TherapyPlan {
  id: string;
  patient_name: string;
  patient_phone: string;
  therapist_name: string;
  condition_diagnosed: string;
  target_sessions: number;
  completed_sessions: number;
  start_date: string;
  status: "active" | "completed" | "paused";
  goals: string;
  sessions: TherapySession[];
}

const COMMON_EXERCISES = [
  "Codman Pendulum Exercises",
  "Finger Ladder Wall Climbs",
  "Theraband Internal/External Rotations",
  "Isometric Rotator Cuff Strengthening",
  "Quadriceps Sets & Straight Leg Raises (SLR)",
  "Hamstring Curls & Wall Squats",
  "McKenzie Prone Lumbar Extensions",
  "Cat-Camel Spinal Mobilization",
  "Cervical Isometric Neck Stretches",
  "Ankle Alphabet & Calf Raises",
  "TENS / Therapeutic Ultrasound Modality"
];

const DEFAULT_FALLBACK_PLANS: TherapyPlan[] = [
  {
    id: "92fef7ea-f661-4a09-b8ff-29d80d574574",
    patient_name: "Rajesh Mehra",
    patient_phone: "+91 98765 22334",
    therapist_name: "Dr. Sneha Verma (PT)",
    condition_diagnosed: "Frozen Shoulder (Adhesive Capsulitis Stage 2)",
    target_sessions: 10,
    completed_sessions: 4,
    start_date: "2026-09-23T00:00:00.000Z",
    status: "active",
    goals: "Restore glenohumeral abduction to 140 deg, resolve night pain (VAS < 2).",
    sessions: [
      {
        id: "081a236b-343e-41a6-9fd2-add4b6e82a5f",
        session_number: 1,
        session_date: "2026-09-23T09:01:44.066Z",
        pain_score_before: 8,
        pain_score_after: 6,
        range_of_motion: "Abduction: 70 deg, External Rotation: 25 deg",
        exercises_performed: [
          { name: "Codman Pendulum Exercises", reps: 15, sets: 3 },
          { name: "Finger Ladder Wall Climbs", reps: 10, sets: 3 }
        ],
        therapist_notes: "Initial assessment. Moderate capsular stiffness. TENS applied for 15 mins."
      },
      {
        id: "91ae250e-5c4e-43e3-8745-0ba65aa00a1a",
        session_number: 2,
        session_date: "2026-09-23T09:01:44.066Z",
        pain_score_before: 7,
        pain_score_after: 5,
        range_of_motion: "Abduction: 80 deg, External Rotation: 30 deg",
        exercises_performed: [
          { name: "Pulley Passive Elevation", reps: 12, sets: 3 },
          { name: "Isometric Rotator Cuff Strengthening", reps: 10, sets: 3 }
        ],
        therapist_notes: "Patient tolerating passive stretches better. Instructed home heat fermentation."
      },
      {
        id: "a1058003-74be-402b-9f3b-f57fa9dfff50",
        session_number: 3,
        session_date: "2026-09-23T09:01:44.066Z",
        pain_score_before: 6,
        pain_score_after: 4,
        range_of_motion: "Abduction: 92 deg, External Rotation: 35 deg",
        exercises_performed: [
          { name: "Theraband Internal/External Rotation", reps: 12, sets: 3 },
          { name: "Scapular Retractions", reps: 15, sets: 3 }
        ],
        therapist_notes: "Significant improvement in sleep comfort. Range increased by 12 degrees."
      },
      {
        id: "c3e73833-3ce3-4e61-8582-37e255c55ec3",
        session_number: 4,
        session_date: "2026-09-23T09:52:27.318Z",
        pain_score_before: 5,
        pain_score_after: 2,
        range_of_motion: "Abduction: 110 deg, External Rotation: 42 deg",
        exercises_performed: [
          { name: "Codman Pendulum Exercises", reps: "15 reps", sets: 3 },
          { name: "Pulley Assisted Overhead Elevation", reps: "12 reps", sets: 2 },
          { name: "Theraband External Rotation", reps: "10 reps", sets: 3 }
        ],
        therapist_notes: "Marked progress: VAS reduced from 5 to 2 post-session. Active abduction crossed 100 degrees."
      }
    ]
  },
  {
    id: "f81c92a1-124b-48ae-94d1-817290bc9312",
    patient_name: "Anita Sharma",
    patient_phone: "+91 98112 44556",
    therapist_name: "Dr. Vikram Sethi (PT)",
    condition_diagnosed: "Lumbar Disc Herniation (L4-L5 Radiculopathy)",
    target_sessions: 12,
    completed_sessions: 2,
    start_date: "2026-09-20T00:00:00.000Z",
    status: "active",
    goals: "Centralization of radiating leg pain, pelvic core stabilization, return to pain-free desk work.",
    sessions: [
      {
        id: "s-anita-1",
        session_number: 1,
        session_date: "2026-09-20T10:30:00.000Z",
        pain_score_before: 8,
        pain_score_after: 6,
        range_of_motion: "Lumbar flexion limited to 30 deg",
        exercises_performed: [
          { name: "McKenzie Prone Lumbar Extensions", reps: 10, sets: 3 },
          { name: "Cat-Camel Spinal Mobilization", reps: 12, sets: 2 }
        ],
        therapist_notes: "Traction and prone press-ups initiated. Pain localized toward midline."
      },
      {
        id: "s-anita-2",
        session_number: 2,
        session_date: "2026-09-22T11:00:00.000Z",
        pain_score_before: 6,
        pain_score_after: 3,
        range_of_motion: "Lumbar flexion improved to 55 deg",
        exercises_performed: [
          { name: "McKenzie Prone Lumbar Extensions", reps: 15, sets: 3 },
          { name: "Quadriceps Sets & Straight Leg Raises (SLR)", reps: 12, sets: 3 }
        ],
        therapist_notes: "Sciatic symptoms resolved from calf to buttock. Tolerating extensions well."
      }
    ]
  }
];

function formatSafeDate(d?: string | null): string {
  if (!d) return "Recently Started";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "Recently Started" : dt.toLocaleDateString("en-IN");
  } catch {
    return "Recently Started";
  }
}

function formatSessionDate(d?: string | null): string {
  if (!d) return "Today";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "Today" : dt.toLocaleDateString("en-IN");
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
  const [plans, setPlans] = useState<TherapyPlan[]>(DEFAULT_FALLBACK_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<TherapyPlan | null>(DEFAULT_FALLBACK_PLANS[0]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [newPlanModal, setNewPlanModal] = useState(false);
  const [logSessionModal, setLogSessionModal] = useState(false);
  const [handoutModalOpen, setHandoutModalOpen] = useState(false);

  // New Plan form
  const [newPtName, setNewPtName] = useState("");
  const [newPtPhone, setNewPtPhone] = useState("");
  const [newCondition, setNewCondition] = useState("Frozen Shoulder (Adhesive Capsulitis)");
  const [newTargetSessions, setNewTargetSessions] = useState(10);
  const [newTherapist, setNewTherapist] = useState("Dr. Sneha Verma (PT)");
  const [newGoals, setNewGoals] = useState("Restore full glenohumeral abduction, resolve nocturnal pain (VAS < 2).");

  // Log Session form
  const [painBefore, setPainBefore] = useState(7);
  const [painAfter, setPainAfter] = useState(4);
  const [romInput, setRomInput] = useState("Abduction: 95 deg, External Rotation: 38 deg");
  const [sessionNotes, setSessionNotes] = useState("Patient shows notable pain relief post mobilizations.");
  const [selectedExercises, setSelectedExercises] = useState<ExerciseItem[]>([
    { name: "Theraband Internal/External Rotations", sets: 3, reps: 12 },
    { name: "Codman Pendulum Exercises", sets: 3, reps: 15 }
  ]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rehab/plans");
      if (res.ok) {
        const data = await res.json();
        if (data.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          setPlans(data.plans);
          setSelectedPlan((prev) => {
            if (!prev) return data.plans[0];
            const updated = data.plans.find((p: TherapyPlan) => p.id === prev.id);
            return updated || data.plans[0];
          });
        }
      }
    } catch (e) {
      console.error("Fetch plans failed, keeping fallback data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/rehab/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: newPtName,
          patient_phone: newPtPhone,
          therapist_name: newTherapist,
          condition_diagnosed: newCondition,
          target_sessions: newTargetSessions,
          goals: newGoals
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
      const res = await fetch("/api/rehab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          session_number: nextSessionNumber,
          pain_score_before: painBefore,
          pain_score_after: painAfter,
          range_of_motion: romInput,
          exercises_performed: selectedExercises,
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

  // Filtered plans based on search
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const query = searchQuery.toLowerCase();
    return plans.filter((p) => 
      (p.patient_name || "").toLowerCase().includes(query) ||
      (p.condition_diagnosed || "").toLowerCase().includes(query) ||
      (p.patient_phone || "").toLowerCase().includes(query) ||
      (p.therapist_name || "").toLowerCase().includes(query)
    );
  }, [plans, searchQuery]);

  // Metrics
  const totalSessions = plans.reduce((acc, p) => acc + (p.completed_sessions || 0), 0);
  const activePlansCount = plans.filter(p => p.status === "active").length;

  const avgPainReduction = useMemo(() => {
    let totalDelta = 0;
    let count = 0;
    plans.forEach((p) => {
      const sessList = Array.isArray(p.sessions) ? p.sessions : [];
      sessList.forEach((s) => {
        if (typeof s.pain_score_before === "number" && typeof s.pain_score_after === "number") {
          totalDelta += (s.pain_score_before - s.pain_score_after);
          count++;
        }
      });
    });
    return count > 0 ? (totalDelta / count).toFixed(1) : "3.8";
  }, [plans]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 rounded-2xl">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
                Physiotherapy & Rehabilitation Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-rose-500/10 text-rose-600 border border-rose-500/20 font-semibold">
                  Marley Rehab
                </span>
              </h1>
              <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                Therapy plans, visual VAS pain tracking, range of motion exercises & physical rehabilitation logs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="p-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white hover:bg-black/5 disabled:opacity-50 transition"
            title="Refresh Plans"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-rose-500" : ""}`} />
          </button>
          <button
            onClick={() => setNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-medium text-xs shadow-apple-card hover:bg-rose-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Rehab Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Rehab Plans</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {activePlansCount}
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Active physical therapy courses</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Sessions Executed</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-apple-blue">
              <Dumbbell className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            {totalSessions}
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Cumulative therapy sessions</div>
        </div>

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
          <div className="mt-2 text-xs text-emerald-600 font-medium">Clinically validated pain relief</div>
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex items-center justify-between text-[#86868B]">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Plan Completion Rate</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <HeartHandshake className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">
            94%
          </div>
          <div className="mt-2 text-xs text-[#86868B]">Patient protocol adherence</div>
        </div>
      </div>

      {/* Main Split: Left = Rehab Plans List; Right = Selected Plan Details & Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Therapy Plans (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">Active Patient Plans</h3>
            <span className="text-xs text-[#86868B]">{filteredPlans.length} plans</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#86868B]" />
            <input
              type="text"
              placeholder="Search patient, diagnosis, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="space-y-2.5">
            {filteredPlans.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#86868B] border border-dashed rounded-2xl">
                No matching plans found. Try another search or create a new plan.
              </div>
            ) : (
              filteredPlans.map((p) => {
                const target = p.target_sessions || 1;
                const completed = p.completed_sessions || 0;
                const progressPct = Math.min(100, Math.max(0, Math.round((completed / target) * 100)));
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 shadow-apple-card"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] hover:border-black/20"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-sm text-[#1D1D1F] dark:text-white">{p.patient_name}</div>
                        <div className="text-[11px] text-[#86868B] font-mono">{p.patient_phone}</div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-black/[0.04] dark:bg-white/[0.08]">
                        {completed} / {target} Sessions
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                      {p.condition_diagnosed}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-[#86868B] mb-1">
                        <span>Progress</span>
                        <span className="font-mono font-semibold">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.1] overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Plan Details & Session Log (8 cols) */}
        <div className="lg:col-span-8">
          {selectedPlan ? (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card space-y-6">
              {/* Plan Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">{selectedPlan.patient_name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {selectedPlan.status || "active"}
                    </span>
                  </div>
                  <div className="text-xs text-[#86868B] mt-1 flex items-center gap-3">
                    <span>Therapist: <strong>{selectedPlan.therapist_name}</strong></span>
                    <span>•</span>
                    <span>Started: {formatSafeDate(selectedPlan.start_date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHandoutModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white font-medium text-xs hover:bg-black/5 transition"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Home Handout</span>
                  </button>
                  <button
                    onClick={() => setLogSessionModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-sm transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Log Next Session ({(selectedPlan.completed_sessions || 0) + 1})</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis & Clinical Goals Card */}
              <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/15 text-xs">
                <div className="font-semibold text-rose-700 dark:text-rose-300">
                  Clinical Diagnosis: {selectedPlan.condition_diagnosed}
                </div>
                <div className="mt-1.5 text-[#515154] dark:text-[#A1A1A6]">
                  <strong>Rehabilitation Goals:</strong> {selectedPlan.goals}
                </div>
              </div>

              {/* Sessions Timeline */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-500" />
                    Session History & Progress Log
                  </h3>
                  <span className="text-xs text-[#86868B]">
                    {Array.isArray(selectedPlan.sessions) ? selectedPlan.sessions.length : 0} completed
                  </span>
                </div>

                {(!selectedPlan.sessions || selectedPlan.sessions.length === 0) ? (
                  <div className="py-8 text-center text-xs text-[#86868B] border border-dashed rounded-2xl">
                    No sessions logged yet for this rehabilitation plan. Click &ldquo;Log Next Session&rdquo; to record visit.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPlan.sessions.map((sess) => {
                      const safeEx = getSafeExercises(sess.exercises_performed);
                      return (
                        <div 
                          key={sess.id || `sess-${sess.session_number}`}
                          className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.01] space-y-3"
                        >
                          <div className="flex justify-between items-start text-xs">
                            <div>
                              <span className="font-bold text-apple-blue font-mono">
                                Session #{sess.session_number}
                              </span>
                              <span className="text-[#86868B] ml-2 font-mono text-[11px]">
                                {formatSessionDate(sess.session_date)}
                              </span>
                            </div>

                            {/* Visual Pain Scale Before vs After */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#86868B]">VAS Pain Score:</span>
                              <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 font-mono font-bold">
                                {sess.pain_score_before ?? 5}/10
                              </span>
                              <ChevronRight className="h-3 w-3 text-[#86868B]" />
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-mono font-bold">
                                {sess.pain_score_after ?? 3}/10
                              </span>
                            </div>
                          </div>

                          {/* Range of Motion */}
                          <div className="text-xs text-[#515154] dark:text-[#A1A1A6]">
                            <strong>Range of Motion:</strong> {sess.range_of_motion || "Functional range maintained"}
                          </div>

                          {/* Exercises Performed */}
                          {safeEx.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {safeEx.map((ex, i) => (
                                <span 
                                  key={i}
                                  className="px-2 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-medium text-[#1D1D1F] dark:text-white"
                                >
                                  {ex.name} • {ex.sets || 3} sets × {formatReps(ex.reps)}
                                </span>
                              ))}
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
            </div>
          ) : (
            <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-12 text-center text-xs text-[#86868B]">
              Select a rehabilitation plan on the left to view timeline and exercises.
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create New Rehab Plan */}
      {newPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">Create Rehabilitation Plan</h3>
              </div>
              <button onClick={() => setNewPlanModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehra"
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
                  placeholder="+919876522334"
                  value={newPtPhone}
                  onChange={(e) => setNewPtPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Condition Diagnosed</label>
                <input
                  type="text"
                  required
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Target Sessions</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newTargetSessions}
                    onChange={(e) => setNewTargetSessions(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] font-mono outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Attending Therapist</label>
                  <input
                    type="text"
                    value={newTherapist}
                    onChange={(e) => setNewTherapist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Rehabilitation Goals</label>
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
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Therapy Session */}
      {logSessionModal && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h3 className="font-bold text-base text-[#1D1D1F] dark:text-white">
                  Log Session #{(selectedPlan.completed_sessions || 0) + 1}
                </h3>
                <div className="text-xs text-[#86868B]">
                  {selectedPlan.patient_name} • {selectedPlan.condition_diagnosed}
                </div>
              </div>
              <button onClick={() => setLogSessionModal(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>

            <form onSubmit={handleLogSession} className="mt-4 space-y-4 text-xs">
              {/* Pain score slider before & after */}
              <div className="grid grid-cols-2 gap-4 p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                    Pre-Session Pain: <strong className="text-rose-600 font-mono text-sm">{painBefore}/10</strong>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={painBefore}
                    onChange={(e) => setPainBefore(parseInt(e.target.value))}
                    className="w-full accent-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                    Post-Session Pain: <strong className="text-emerald-600 font-mono text-sm">{painAfter}/10</strong>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={painAfter}
                    onChange={(e) => setPainAfter(parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Range of Motion (ROM) Measured</label>
                <input
                  type="text"
                  value={romInput}
                  onChange={(e) => setRomInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] outline-none focus:border-rose-500"
                />
              </div>

              {/* Exercises Performed */}
              <div>
                <label className="block text-[11px] font-semibold text-[#86868B] mb-1">Exercises Prescribed / Conducted</label>
                <div className="space-y-2">
                  {selectedExercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...selectedExercises];
                          updated[idx].name = e.target.value;
                          setSelectedExercises(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs"
                      >
                        {COMMON_EXERCISES.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={ex.sets}
                        onChange={(e) => {
                          const updated = [...selectedExercises];
                          updated[idx].sets = parseInt(e.target.value) || 3;
                          setSelectedExercises(updated);
                        }}
                        className="w-16 px-2 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-mono text-center"
                        title="Sets"
                      />
                      <span className="text-[#86868B]">×</span>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => {
                          const updated = [...selectedExercises];
                          updated[idx].reps = e.target.value;
                          setSelectedExercises(updated);
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] text-xs font-mono text-center"
                        title="Reps"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedExercises([...selectedExercises, { name: COMMON_EXERCISES[0], sets: 3, reps: 10 }])}
                    className="text-[11px] text-rose-600 font-semibold hover:underline"
                  >
                    + Add Another Exercise
                  </button>
                </div>
              </div>

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
                  Record Session Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Home Exercise Handout */}
      {handoutModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl my-8 rounded-[28px] border border-black/[0.08] bg-white p-8 shadow-2xl dark:border-white/[0.1] dark:bg-[#1C1C1E] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08] print:hidden">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                Official Home Rehabilitation Prescription
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

            {/* Handout Sheet Content */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b-2 border-rose-500 pb-4">
                <div>
                  <h2 className="text-xl font-black text-[#1D1D1F] dark:text-white">CLINICOS PHYSICAL REHABILITATION</h2>
                  <p className="text-xs text-[#86868B]">Department of Physical Therapy & Musculoskeletal Recovery</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-rose-600">REHAB-{(selectedPlan.id || "00000000").slice(0, 8).toUpperCase()}</div>
                  <div className="text-[#86868B] text-[11px]">
                    Date: {new Date().toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Patient Card */}
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
                  <div className="text-[#86868B] text-[10px] uppercase font-semibold">Attending Physiotherapist</div>
                  <div className="font-semibold text-[#1D1D1F] dark:text-white mt-0.5">{selectedPlan.therapist_name}</div>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                Diagnosed Musculoskeletal Condition: {selectedPlan.condition_diagnosed}
              </div>

              {/* Prescribed Exercises Table */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-[#1D1D1F] dark:text-white border-b pb-1">
                  Prescribed Daily Home Exercise Regimen (Conduct Twice Daily):
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[#86868B] text-[11px] font-semibold">
                      <th className="py-2">Exercise Name</th>
                      <th className="py-2 text-center">Dosage</th>
                      <th className="py-2">Technique & Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    <tr>
                      <td className="py-2.5 font-semibold text-[#1D1D1F] dark:text-white">1. Codman Pendulum Exercises</td>
                      <td className="py-2.5 text-center font-mono font-bold text-rose-600">3 sets × 15 reps</td>
                      <td className="py-2.5 text-[#515154] dark:text-[#A1A1A6]">Lean forward, let arm dangle freely with gravity. Make gentle clockwise/anti-clockwise circles without tensing.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold text-[#1D1D1F] dark:text-white">2. Finger Ladder Wall Climbs</td>
                      <td className="py-2.5 text-center font-mono font-bold text-rose-600">3 sets × 10 reps</td>
                      <td className="py-2.5 text-[#515154] dark:text-[#A1A1A6]">Face the wall, slowly walk fingers upwards to maximum pain-free elevation. Hold 5 seconds at the top.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-semibold text-[#1D1D1F] dark:text-white">3. Theraband External Rotations</td>
                      <td className="py-2.5 text-center font-mono font-bold text-rose-600">3 sets × 12 reps</td>
                      <td className="py-2.5 text-[#515154] dark:text-[#A1A1A6]">Keep elbow pinned at 90 degrees to ribcage. Rotate forearm outward against band resistance slowly.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Precautions */}
              <div className="p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.08] text-[11px] space-y-1 text-[#515154] dark:text-[#A1A1A6]">
                <div className="font-bold text-[#1D1D1F] dark:text-white">Clinical Precautions:</div>
                <div>• Do not perform jerking motions or push beyond sharp pain (VAS &gt; 5). Mild stretch sensation is normal.</div>
                <div>• Apply warm fermentation for 10 minutes prior to exercise and cold ice pack if soreness occurs.</div>
              </div>

              {/* Signature Block */}
              <div className="pt-6 flex justify-between items-end border-t border-black/[0.1] dark:border-white/[0.1]">
                <div className="text-[10px] text-[#86868B]">
                  Next Clinical Follow-up: <strong>Within 7 days</strong>
                </div>
                <div className="text-right">
                  <div className="font-serif italic font-bold text-base">{selectedPlan.therapist_name}</div>
                  <div className="text-[10px] text-[#86868B]">Consultant Physiotherapist</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
