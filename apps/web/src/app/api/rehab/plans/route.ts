import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

const CLINICAL_FALLBACK_PLANS = [
  {
    id: "92fef7ea-f661-4a09-b8ff-29d80d574574",
    patient_name: "Rajesh Mehra",
    patient_phone: "+91 98765 22334",
    referring_doctor: "Dr. Arvind Shenoy (MS Ortho, Joint Replacement)",
    therapist_name: "Dr. Sneha Verma (PT)",
    approved_by: "Dr. Vikram Sethi (Chief PT, MIAP)",
    modification_status: "approved",
    condition_diagnosed: "Frozen Shoulder (Adhesive Capsulitis Stage 2 - Freezing Phase)",
    target_sessions: 10,
    completed_sessions: 4,
    start_date: "2026-09-23T00:00:00.000Z",
    review_date: "2026-10-07T00:00:00.000Z",
    end_date: "2026-10-21T00:00:00.000Z",
    status: "active",
    goals: "Restore glenohumeral abduction to 140° (currently 110°), resolve night throbbing pain (VAS < 2), regain functional overhead reaching.",
    target_joint: "Right Shoulder",
    movement_plane: "Abduction & External Rotation",
    baseline_rom: 65,
    target_rom: 140,
    current_rom: 110,
    baseline_vas: 8,
    target_vas: 2,
    current_vas: 2,
    stagnation_alert: false,
    pain_escalation_alert: false,
    prescribed_exercises: [
      {
        name: "Codman Pendulum Exercises",
        sets: 3,
        reps: "15 reps",
        frequency: "BID (Twice Daily)",
        resistance: "Gravity dependent",
        rest_seconds: 45,
        video_url: "https://youtu.be/codman-shoulder",
        precautions: "Do not tense deltoid; allow gravity oscillation."
      },
      {
        name: "Finger Ladder Wall Climbs",
        sets: 3,
        reps: "10 reps",
        frequency: "TID (3x Daily)",
        resistance: "Bodyweight",
        rest_seconds: 60,
        video_url: "https://youtu.be/finger-ladder",
        precautions: "Stop at initial pain threshold; hold 5s at peak."
      },
      {
        name: "Theraband External Rotations",
        sets: 3,
        reps: "12 reps",
        frequency: "OD (Once Daily)",
        resistance: "Yellow Theraband (Light)",
        rest_seconds: 60,
        video_url: "https://youtu.be/theraband-external-rotation",
        precautions: "Keep elbow pinned against towel roll at ribcage."
      },
      {
        name: "Pulley Overhead Passive Elevation",
        sets: 3,
        reps: "12 reps",
        frequency: "BID (Twice Daily)",
        resistance: "Overhead Rope & Pulley",
        rest_seconds: 45,
        video_url: "https://youtu.be/shoulder-pulley",
        precautions: "Healthy arm does 90% of lifting work."
      }
    ],
    sessions: [
      {
        id: "081a236b-343e-41a6-9fd2-add4b6e82a5f",
        session_number: 1,
        session_date: "2026-09-23T09:01:44.066Z",
        pain_score_before: 8,
        pain_score_after: 6,
        rom_joint: "Right Shoulder",
        rom_plane: "Abduction",
        rom_degrees: 70,
        rom_method: "Universal Goniometer (360°)",
        rom_laterality: "Right",
        range_of_motion: "Abduction: 70°, External Rotation: 25°",
        modality_applied: "TENS (80Hz, 15 min) + Moist Heat Pack",
        tolerance_rating: "Fair (Mild Muscle Guarding)",
        exercises_performed: [
          { name: "Codman Pendulum Exercises", sets: 3, reps: "15 reps" },
          { name: "Finger Ladder Wall Climbs", sets: 3, reps: "10 reps" }
        ],
        homework_assigned: [
          { name: "Codman Pendulums", frequency: "Twice daily morning/night", reps: "15 circles each direction" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Initial clinical assessment. Capsular restriction in infero-posterior quadrant. Grade I-II gentle oscillations tolerated."
      },
      {
        id: "91ae250e-5c4e-43e3-8745-0ba65aa00a1a",
        session_number: 2,
        session_date: "2026-09-23T14:30:00.066Z",
        pain_score_before: 7,
        pain_score_after: 5,
        rom_joint: "Right Shoulder",
        rom_plane: "Abduction",
        rom_degrees: 82,
        rom_method: "Universal Goniometer (360°)",
        rom_laterality: "Right",
        range_of_motion: "Abduction: 82°, External Rotation: 30°",
        modality_applied: "Therapeutic Ultrasound (1MHz, 1.2 W/cm² pulsed)",
        tolerance_rating: "Good (Grade 3/4)",
        exercises_performed: [
          { name: "Pulley Assisted Passive Elevation", sets: 3, reps: "12 reps" },
          { name: "Theraband External Rotations", sets: 3, reps: "10 reps" }
        ],
        homework_assigned: [
          { name: "Warm water fermentation followed by Codman", frequency: "Daily before sleep" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Patient reports less sleep disruption. Joint glide Maitland Grade II applied to anterior and inferior capsule."
      },
      {
        id: "a1058003-74be-402b-9f3b-f57fa9dfff50",
        session_number: 3,
        session_date: "2026-09-24T10:00:00.000Z",
        pain_score_before: 6,
        pain_score_after: 4,
        rom_joint: "Right Shoulder",
        rom_plane: "Abduction",
        rom_degrees: 94,
        rom_method: "Digital Inclinometer",
        rom_laterality: "Right",
        range_of_motion: "Abduction: 94°, External Rotation: 35°",
        modality_applied: "Interferential Therapy (IFT) + Ice wrap post-stretch",
        tolerance_rating: "Good (Grade 3/4)",
        exercises_performed: [
          { name: "Theraband External Rotations", sets: 3, reps: "12 reps" },
          { name: "Finger Ladder Wall Climbs", sets: 3, reps: "12 reps" }
        ],
        homework_assigned: [
          { name: "Active assisted wall slide with towel", frequency: "3x daily, 10 reps" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Significant relief noted in deltoid pain trigger points. Abduction crossed 90° horizontal milestone cleanly."
      },
      {
        id: "c3e73833-3ce3-4e61-8582-37e255c55ec3",
        session_number: 4,
        session_date: "2026-09-25T09:52:27.318Z",
        pain_score_before: 5,
        pain_score_after: 2,
        rom_joint: "Right Shoulder",
        rom_plane: "Abduction",
        rom_degrees: 110,
        rom_method: "Universal Goniometer (360°)",
        rom_laterality: "Right",
        range_of_motion: "Abduction: 110°, External Rotation: 42°",
        modality_applied: "Moist Heat + Maitland Grade III Glenohumeral Glide",
        tolerance_rating: "Excellent",
        exercises_performed: [
          { name: "Codman Pendulum Exercises", sets: 3, reps: "15 reps" },
          { name: "Pulley Overhead Passive Elevation", sets: 2, reps: "12 reps" },
          { name: "Theraband External Rotations", sets: 3, reps: "10 reps" }
        ],
        homework_assigned: [
          { name: "Pectoralis minor stretch in door frame", frequency: "Twice daily, hold 20s" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Excellent clinical milestone: Post-session VAS reduced to 2/10. Active abduction reached 110°. No signs of impingement."
      }
    ]
  },
  {
    id: "f81c92a1-124b-48ae-94d1-817290bc9312",
    patient_name: "Anita Sharma",
    patient_phone: "+91 98112 44556",
    referring_doctor: "Dr. Sunita Rao (DNB Ortho, Spine Specialist)",
    therapist_name: "Dr. Vikram Sethi (Chief PT)",
    approved_by: "Dr. Vikram Sethi (Chief PT, MIAP)",
    modification_status: "approved",
    condition_diagnosed: "Lumbar Disc Herniation with L5 Radiculopathy",
    target_sessions: 12,
    completed_sessions: 2,
    start_date: "2026-09-20T00:00:00.000Z",
    review_date: "2026-10-04T00:00:00.000Z",
    end_date: "2026-10-25T00:00:00.000Z",
    status: "active",
    goals: "Centralization of radiating left calf pain, restore lumbar extension to 25° pain-free, core pelvic stability for sitting >4 hours.",
    target_joint: "Lumbar Spine",
    movement_plane: "Flexion & Extension",
    baseline_rom: 20,
    target_rom: 60,
    current_rom: 40,
    baseline_vas: 8,
    target_vas: 1,
    current_vas: 3,
    stagnation_alert: false,
    pain_escalation_alert: false,
    prescribed_exercises: [
      {
        name: "McKenzie Prone Lumbar Extensions (Press-ups)",
        sets: 3,
        reps: "10 reps",
        frequency: "Every 2 hours while awake",
        resistance: "Bodyweight",
        rest_seconds: 60,
        video_url: "https://youtu.be/mckenzie-extension",
        precautions: "Keep pelvis flat on floor; exhale as you push up."
      },
      {
        name: "Cat-Camel Spinal Mobilization",
        sets: 2,
        reps: "12 reps",
        frequency: "BID (Twice Daily)",
        resistance: "Gentle Active Range",
        rest_seconds: 45,
        video_url: "https://youtu.be/cat-camel",
        precautions: "Do not force through acute lumbar pinch."
      },
      {
        name: "Abdominal Drawing-in Core Activation",
        sets: 3,
        reps: "10 reps × 10s hold",
        frequency: "BID (Twice Daily)",
        resistance: "Isometric Core",
        rest_seconds: 30,
        video_url: "https://youtu.be/core-activation",
        precautions: "Breathe normally while maintaining navel pull."
      }
    ],
    sessions: [
      {
        id: "s-anita-1",
        session_number: 1,
        session_date: "2026-09-20T10:30:00.000Z",
        pain_score_before: 8,
        pain_score_after: 6,
        rom_joint: "Lumbar Spine",
        rom_plane: "Extension",
        rom_degrees: 15,
        rom_method: "Dual Digital Inclinometer",
        rom_laterality: "Bilateral",
        range_of_motion: "Lumbar extension: 15°, SLR Left: 35° positive",
        modality_applied: "Intermittent Lumbar Traction (16 kg) + TENS",
        tolerance_rating: "Fair (Guarding present)",
        exercises_performed: [
          { name: "McKenzie Prone Extensions", sets: 3, reps: "10 reps" },
          { name: "Cat-Camel Spinal Mobilization", sets: 2, reps: "10 reps" }
        ],
        homework_assigned: [
          { name: "Prone lying on pillows for 5 mins every 2 hours", frequency: "Strict adherence" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Initial spine intake. Positive straight leg raise test on left at 35°. Pain radiating down postero-lateral calf. Centralization phenomenon initiated."
      },
      {
        id: "s-anita-2",
        session_number: 2,
        session_date: "2026-09-22T11:00:00.000Z",
        pain_score_before: 6,
        pain_score_after: 3,
        rom_joint: "Lumbar Spine",
        rom_plane: "Extension",
        rom_degrees: 25,
        rom_method: "Dual Digital Inclinometer",
        rom_laterality: "Bilateral",
        range_of_motion: "Lumbar extension: 25°, SLR Left: 55°",
        modality_applied: "Lumbar Traction (18 kg) + Cryotherapy",
        tolerance_rating: "Good (Grade 3/4)",
        exercises_performed: [
          { name: "McKenzie Prone Extensions", sets: 3, reps: "12 reps" },
          { name: "Abdominal Drawing-in Maneuvers", sets: 3, reps: "10 reps" }
        ],
        homework_assigned: [
          { name: "Avoid forward flexion and lifting >2kg", frequency: "Continuous restriction" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Significant peripheralization reversal: Left calf pain has completely retreated to buttock area (true centralization). SLR improved to 55°."
      }
    ]
  },
  {
    id: "b45a71c8-89dd-481e-8fe2-4523910ef118",
    patient_name: "Karan Johar",
    patient_phone: "+91 99201 33221",
    referring_doctor: "Dr. Arvind Shenoy (MS Ortho)",
    therapist_name: "Dr. Sneha Verma (PT)",
    approved_by: "Dr. Vikram Sethi (Chief PT, MIAP)",
    modification_status: "pending_senior_review",
    condition_diagnosed: "Post-Operative ACL Reconstruction (Hamstring Autograft - Week 4)",
    target_sessions: 16,
    completed_sessions: 6,
    start_date: "2026-09-02T00:00:00.000Z",
    review_date: "2026-09-30T00:00:00.000Z",
    end_date: "2026-11-15T00:00:00.000Z",
    status: "active",
    goals: "Achieve 0° terminal knee extension, 120° knee flexion, quad lag elimination during straight leg raise, normalize gait without crutches.",
    target_joint: "Left Knee",
    movement_plane: "Flexion & Extension",
    baseline_rom: 45,
    target_rom: 125,
    current_rom: 92,
    baseline_vas: 7,
    target_vas: 1,
    current_vas: 4,
    stagnation_alert: true,
    pain_escalation_alert: false,
    prescribed_exercises: [
      {
        name: "Passive Prone Knee Hangs (Terminal Extension)",
        sets: 3,
        reps: "5 min hold",
        frequency: "TID (3x Daily)",
        resistance: "Gravity + 1kg ankle cuff",
        rest_seconds: 60,
        video_url: "https://youtu.be/knee-hangs",
        precautions: "Ensure kneecap is off edge of examination table."
      },
      {
        name: "Quadriceps Isometric Sets with Towel Roll",
        sets: 4,
        reps: "15 reps × 5s hold",
        frequency: "QID (4x Daily)",
        resistance: "Max voluntary isometric contraction",
        rest_seconds: 30,
        video_url: "https://youtu.be/quad-sets",
        precautions: "Focus on vastus medialis oblique (VMO) contraction."
      },
      {
        name: "Stationary Bike Oscillations & Wall Slides",
        sets: 3,
        reps: "10 mins",
        frequency: "OD (Daily)",
        resistance: "Zero resistance free spin",
        rest_seconds: 60,
        video_url: "https://youtu.be/bike-acl",
        precautions: "Adjust seat high to avoid exceeding 90° flexion initially."
      }
    ],
    sessions: [
      {
        id: "s-karan-5",
        session_number: 5,
        session_date: "2026-09-21T11:00:00.000Z",
        pain_score_before: 4,
        pain_score_after: 3,
        rom_joint: "Left Knee",
        rom_plane: "Flexion",
        rom_degrees: 90,
        rom_method: "Universal Goniometer (360°)",
        rom_laterality: "Left",
        range_of_motion: "Extension: -2°, Flexion: 90°",
        modality_applied: "Neuromuscular Electrical Stimulation (NMES) to VMO + Cryotherapy",
        tolerance_rating: "Good (Grade 3/4)",
        exercises_performed: [
          { name: "Wall Slides", sets: 3, reps: "12 reps" },
          { name: "Prone Hangs", sets: 3, reps: "5 mins" }
        ],
        homework_assigned: [
          { name: "Terminal knee extension hangs", frequency: "3x daily" }
        ],
        escalation_flag: false,
        escalation_note: "",
        therapist_notes: "Effusion Grade 1+ lingering. Patellar mobilizations superior/inferior performed."
      },
      {
        id: "s-karan-6",
        session_number: 6,
        session_date: "2026-09-24T15:30:00.000Z",
        pain_score_before: 5,
        pain_score_after: 4,
        rom_joint: "Left Knee",
        rom_plane: "Flexion",
        rom_degrees: 92,
        rom_method: "Universal Goniometer (360°)",
        rom_laterality: "Left",
        range_of_motion: "Extension: -2°, Flexion: 92°",
        modality_applied: "Therapeutic Ultrasound to pes anserine + Ice wrap",
        tolerance_rating: "Fair (Hamstring tightness)",
        exercises_performed: [
          { name: "Wall Slides", sets: 3, reps: "12 reps" },
          { name: "Stationary Bike", sets: 2, reps: "8 mins" }
        ],
        homework_assigned: [
          { name: "Continue home icing after exercises", frequency: "BID" }
        ],
        escalation_flag: true,
        escalation_note: "Stagnation alert: ROM plateaued at 90-92° for 2 weeks. Arthrogenic muscle inhibition suspected.",
        therapist_notes: "Clinical Stagnation Flagged: Knee flexion has stalled at ~90° across sessions 4, 5, and 6. Junior PT proposed progression to closed kinetic chain mini-squats; requires Senior PT and Ortho sign-off."
      }
    ]
  }
];

function sanitizePlans(plans: any[]) {
  return plans.map((p) => {
    let sessions = p.sessions;
    if (typeof sessions === "string") {
      try {
        sessions = JSON.parse(sessions);
      } catch {
        sessions = [];
      }
    }
    if (!Array.isArray(sessions)) {
      sessions = [];
    }

    sessions = sessions
      .filter((s: any) => s !== null && typeof s === "object")
      .map((s: any) => {
        let exercises = s.exercises_performed;
        if (typeof exercises === "string") {
          try {
            exercises = JSON.parse(exercises);
            if (typeof exercises === "string") {
              exercises = JSON.parse(exercises);
            }
          } catch {
            exercises = [];
          }
        }
        if (!Array.isArray(exercises)) {
          exercises = [];
        }

        let homework = s.homework_assigned;
        if (typeof homework === "string") {
          try {
            homework = JSON.parse(homework);
          } catch {
            homework = [];
          }
        }
        if (!Array.isArray(homework)) {
          homework = [];
        }

        return {
          id: String(s.id || ""),
          session_number: Number(s.session_number) || 1,
          session_date: s.session_date || new Date().toISOString(),
          pain_score_before: Number(s.pain_score_before) || 5,
          pain_score_after: Number(s.pain_score_after) || 3,
          rom_joint: String(s.rom_joint || p.target_joint || "Joint"),
          rom_plane: String(s.rom_plane || p.movement_plane || "Flexion"),
          rom_degrees: Number(s.rom_degrees) || 90,
          rom_method: String(s.rom_method || "Universal Goniometer (360°)"),
          rom_laterality: String(s.rom_laterality || "Right"),
          range_of_motion: String(s.range_of_motion || `${s.rom_degrees || 90}°`),
          modality_applied: String(s.modality_applied || "TENS + Cryotherapy"),
          tolerance_rating: String(s.tolerance_rating || "Good (Grade 3/4)"),
          exercises_performed: exercises,
          homework_assigned: homework,
          escalation_flag: Boolean(s.escalation_flag),
          escalation_note: String(s.escalation_note || ""),
          therapist_notes: String(s.therapist_notes || "")
        };
      });

    // Parse prescribed_exercises
    let prescribed = p.prescribed_exercises;
    if (typeof prescribed === "string") {
      try {
        prescribed = JSON.parse(prescribed);
      } catch {
        prescribed = [];
      }
    }
    if (!Array.isArray(prescribed) || prescribed.length === 0) {
      prescribed = [
        {
          name: "Active Assisted Range Exercises",
          sets: 3,
          reps: "12 reps",
          frequency: "BID (Twice Daily)",
          resistance: "Bodyweight",
          video_url: "https://youtu.be/rehab-demo"
        }
      ];
    }

    // Determine current ROM & current VAS from latest session
    const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
    const currentRom = latestSession?.rom_degrees || Number(p.current_rom) || Number(p.baseline_rom) || 70;
    const currentVas = latestSession?.pain_score_after !== undefined ? latestSession.pain_score_after : (Number(p.current_vas) || 3);

    // Stagnation Detection: Check if last 3 sessions show no improvement
    let computedStagnation = Boolean(p.stagnation_alert);
    if (sessions.length >= 3) {
      const last3 = sessions.slice(-3);
      const romDiff = Math.abs(last3[2].rom_degrees - last3[0].rom_degrees);
      if (romDiff <= 2) {
        computedStagnation = true;
      }
    }

    // Pain Escalation Detection: Check if latest session jumped by >2 points
    let computedPainEscalation = Boolean(p.pain_escalation_alert);
    if (latestSession && (latestSession.pain_score_after - latestSession.pain_score_before > 2 || latestSession.pain_score_before >= 8)) {
      computedPainEscalation = true;
    }

    return {
      id: String(p.id || ""),
      patient_name: String(p.patient_name || "Unknown Patient"),
      patient_phone: String(p.patient_phone || ""),
      referring_doctor: String(p.referring_doctor || "Dr. Arvind Shenoy (MS Ortho)"),
      therapist_name: String(p.therapist_name || "Dr. Sneha Verma (PT)"),
      approved_by: String(p.approved_by || "Dr. Vikram Sethi (Chief PT, MIAP)"),
      modification_status: p.modification_status || "approved",
      condition_diagnosed: String(p.condition_diagnosed || "Musculoskeletal Disorder"),
      target_sessions: Number(p.target_sessions) || 10,
      completed_sessions: Number(p.completed_sessions) || sessions.length,
      start_date: p.start_date || new Date().toISOString(),
      review_date: p.review_date || new Date(Date.now() + 14 * 86400000).toISOString(),
      end_date: p.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
      status: (p.status === "completed" || p.status === "paused") ? p.status : "active",
      goals: String(p.goals || "Pain reduction and restoration of functional range of motion."),
      target_joint: String(p.target_joint || "Shoulder"),
      movement_plane: String(p.movement_plane || "Abduction"),
      baseline_rom: Number(p.baseline_rom) || 65,
      target_rom: Number(p.target_rom) || 140,
      current_rom: currentRom,
      baseline_vas: Number(p.baseline_vas) || 8,
      target_vas: Number(p.target_vas) || 2,
      current_vas: currentVas,
      stagnation_alert: computedStagnation,
      pain_escalation_alert: computedPainEscalation,
      prescribed_exercises: prescribed,
      sessions
    };
  });
}

export async function GET() {
  try {
    const rawPlans = await db`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'session_number', s.session_number,
              'session_date', s.session_date,
              'pain_score_before', s.pain_score_before,
              'pain_score_after', s.pain_score_after,
              'rom_joint', s.rom_joint,
              'rom_plane', s.rom_plane,
              'rom_degrees', s.rom_degrees,
              'rom_method', s.rom_method,
              'rom_laterality', s.rom_laterality,
              'range_of_motion', s.range_of_motion,
              'modality_applied', s.modality_applied,
              'tolerance_rating', s.tolerance_rating,
              'exercises_performed', s.exercises_performed,
              'homework_assigned', s.homework_assigned,
              'escalation_flag', s.escalation_flag,
              'escalation_note', s.escalation_note,
              'therapist_notes', s.therapist_notes
            ) ORDER BY s.session_number ASC
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as sessions
      FROM therapy_plans p
      LEFT JOIN therapy_sessions s ON s.plan_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    const plansToUse = rawPlans && rawPlans.length > 0 ? rawPlans : CLINICAL_FALLBACK_PLANS;
    return NextResponse.json({ plans: sanitizePlans(plansToUse) });
  } catch (error: any) {
    console.error("Fetch therapy plans error, serving clinical fallbacks:", error);
    return NextResponse.json({ plans: sanitizePlans(CLINICAL_FALLBACK_PLANS), error: error.message });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_name, 
      patient_phone, 
      referring_doctor,
      therapist_name, 
      approved_by,
      condition_diagnosed, 
      target_sessions, 
      start_date,
      review_date,
      end_date,
      goals,
      target_joint,
      movement_plane,
      baseline_rom,
      target_rom,
      baseline_vas,
      target_vas,
      prescribed_exercises
    } = body;

    if (!patient_name || !patient_phone || !condition_diagnosed) {
      return NextResponse.json({ error: "patient_name, patient_phone, and condition_diagnosed are required" }, { status: 400 });
    }

    const safeExercises = Array.isArray(prescribed_exercises) && prescribed_exercises.length > 0
      ? prescribed_exercises
      : [
          { name: "Active Assisted Range of Motion", sets: 3, reps: "12 reps", frequency: "BID", resistance: "Gravity" },
          { name: "Isometric Muscle Activation", sets: 3, reps: "10 reps × 5s", frequency: "TID", resistance: "Static isometric" }
        ];

    const inserted = await db`
      INSERT INTO therapy_plans (
        patient_name,
        patient_phone,
        referring_doctor,
        therapist_name,
        approved_by,
        modification_status,
        condition_diagnosed,
        target_sessions,
        completed_sessions,
        start_date,
        review_date,
        end_date,
        status,
        goals,
        target_joint,
        movement_plane,
        baseline_rom,
        target_rom,
        baseline_vas,
        target_vas,
        stagnation_alert,
        pain_escalation_alert,
        prescribed_exercises
      ) VALUES (
        ${patient_name},
        ${patient_phone},
        ${referring_doctor || "Dr. Arvind Shenoy (MS Ortho)"},
        ${therapist_name || "Dr. Sneha Verma (PT)"},
        ${approved_by || "Dr. Vikram Sethi (Chief PT)"},
        'approved',
        ${condition_diagnosed},
        ${parseInt(target_sessions) || 10},
        0,
        ${start_date || new Date().toISOString().split("T")[0]},
        ${review_date || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]},
        ${end_date || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]},
        'active',
        ${goals || "Pain reduction and restoration of functional range of motion."},
        ${target_joint || "Shoulder"},
        ${movement_plane || "Abduction"},
        ${parseInt(baseline_rom) || 60},
        ${parseInt(target_rom) || 140},
        ${parseInt(baseline_vas) || 8},
        ${parseInt(target_vas) || 2},
        false,
        false,
        ${db.json(safeExercises)}
      ) RETURNING *;
    `;

    return NextResponse.json({ success: true, plan: inserted[0] });
  } catch (error: any) {
    console.error("Create therapy plan error:", error);
    return NextResponse.json({ error: error.message || "Failed to create clinical therapy plan" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      plan_id, 
      action, // 'approve_modifications' | 'complete_plan' | 'pause_plan' | 'resume_plan' | 'dismiss_alert'
      approved_by,
      discharge_notes,
      prescribed_exercises
    } = body;

    if (!plan_id) {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    if (action === "approve_modifications") {
      const updated = await db`
        UPDATE therapy_plans
        SET 
          modification_status = 'approved',
          approved_by = ${approved_by || "Dr. Vikram Sethi (Chief PT)"},
          stagnation_alert = false,
          pain_escalation_alert = false,
          prescribed_exercises = COALESCE(${prescribed_exercises ? db.json(prescribed_exercises) : null}, prescribed_exercises)
        WHERE id = ${plan_id}
        RETURNING *;
      `;
      return NextResponse.json({ success: true, plan: updated[0] });
    }

    if (action === "complete_plan") {
      const updated = await db`
        UPDATE therapy_plans
        SET 
          status = 'completed',
          goals = goals || ' | DISCHARGE SUMMARY: ' || ${discharge_notes || "Functional goals met successfully with restored ROM and VAS <= 2."}
        WHERE id = ${plan_id}
        RETURNING *;
      `;
      return NextResponse.json({ success: true, plan: updated[0] });
    }

    if (action === "dismiss_alert") {
      const updated = await db`
        UPDATE therapy_plans
        SET 
          stagnation_alert = false,
          pain_escalation_alert = false
        WHERE id = ${plan_id}
        RETURNING *;
      `;
      return NextResponse.json({ success: true, plan: updated[0] });
    }

    if (action === "pause_plan") {
      const updated = await db`
        UPDATE therapy_plans SET status = 'paused' WHERE id = ${plan_id} RETURNING *;
      `;
      return NextResponse.json({ success: true, plan: updated[0] });
    }

    if (action === "resume_plan") {
      const updated = await db`
        UPDATE therapy_plans SET status = 'active' WHERE id = ${plan_id} RETURNING *;
      `;
      return NextResponse.json({ success: true, plan: updated[0] });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Update therapy plan error:", error);
    return NextResponse.json({ error: error.message || "Failed to update plan" }, { status: 500 });
  }
}
