/**
 * ClinicOS AI Clinical Companion — Core Data Contracts
 * 
 * Strict typing for:
 * 1. Structured Clinical Memory (Symptoms, Vitals, History, Exam, Diagnosis, Rx, Followup)
 * 2. Conversational interaction with doctor (Text & Voice)
 * 3. Intelligent Clarification & Conflict Engine
 * 4. Dual-Report Generation (Doctor Clinical Report + Patient-Friendly Visit Summary)
 */

import type { ConsultationLanguage } from "./consultation-types";

export type ClinicalFieldStatus =
  | "captured"
  | "needs_verification"
  | "doctor_confirmed"
  | "corrected"
  | "missing"
  | "conflicting";

export interface ClinicalMemoryEntry<T = any> {
  id: string;
  field: string;
  value: T;
  raw_transcript_segment?: string;
  timestamp: string; // ISO string
  speaker?: "doctor" | "patient" | "companion";
  confidence: number; // 0.0 - 1.0
  status: ClinicalFieldStatus;
  notes?: string;
}

export interface PatientVitalsMemory {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null; // bpm
  temperature?: number | null; // Fahrenheit
  spo2?: number | null; // %
  weight?: number | null; // kg
  height?: number | null; // cm
  bmi?: number | null;
}

export interface MedicationMemoryItem {
  id: string;
  medicine_name: string;
  generic_name: string;
  dosage_form: "Tablet" | "Capsule" | "Syrup" | "Cream" | "Drops" | "Gel" | "Lotion" | "Injection";
  strength: string;
  frequency: string; // e.g. "1-0-1" or "Once daily"
  duration: string; // e.g. "5 Days"
  timing: "Before Food" | "After Food" | "Empty Stomach" | "At Bedtime" | "SOS";
  special_instructions?: string;
  status: ClinicalFieldStatus;
  catalogue_match_id?: string;
  contraindication_warning?: string | null;
}

export interface PatientComplaintItem {
  id: string;
  symptom: string;
  duration?: string;
  severity?: "Mild" | "Moderate" | "Severe";
  notes?: string;
  status: ClinicalFieldStatus;
}

export interface ClinicalMemory {
  session_id: string;
  patient_id?: string;
  patient_uhid?: string;
  patient_name: string;
  doctor_name: string;
  complaints: PatientComplaintItem[];
  vitals: PatientVitalsMemory;
  medical_history: string[];
  allergies: string[];
  examination_findings: string[];
  provisional_diagnosis: string;
  confirmed_diagnosis: string;
  medications: MedicationMemoryItem[];
  lab_investigations: string[];
  follow_up: {
    recommended_date?: string;
    instructions?: string;
    emergency_warnings?: string[];
  };
  last_updated: string;
}

export type CompanionInteractionMode = "silent" | "assistant" | "voice_companion";

export interface ClarificationAlert {
  id: string;
  field: string;
  severity: "high" | "medium" | "low";
  question: string;
  rationale: string;
  suggested_action?: string;
  resolved: boolean;
}

export interface CompanionChatMessage {
  id: string;
  sender: "doctor" | "companion" | "system";
  text: string;
  timestamp: string;
  audio_url?: string;
  action_type?: "clarification" | "history_lookup" | "rx_update" | "vitals_update" | "report_preview";
  data_payload?: any;
}

/**
 * Report A: Doctor's Professional Clinical Report (EMR Standard)
 */
export interface DoctorClinicalReport {
  patient_uhid: string;
  patient_name: string;
  age_gender: string;
  consultation_date: string;
  doctor_name: string;
  clinic_name: string;
  chief_complaints: string;
  history_of_present_illness: string;
  medical_history_allergies: string;
  vitals_hemodynamics: string;
  examination_findings: string;
  assessment_diagnosis: string;
  differential_diagnoses: string[];
  prescribed_medications: Array<{
    name: string;
    generic: string;
    strength: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  investigations_advised: string[];
  clinical_plan_red_flags: string[];
  doctor_notes: string;
}

/**
 * Report B: Patient-Friendly Visit Summary (Simple Language, 10 clear sections)
 */
export interface PatientVisitSummary {
  language: ConsultationLanguage;
  section_1_visit_details: {
    patient_name: string;
    doctor_name: string;
    clinic_name: string;
    date: string;
  };
  section_2_why_you_visited: string;
  section_3_what_you_told_doctor: string;
  section_4_what_doctor_found: string;
  section_5_your_diagnosis: {
    diagnosis_name: string;
    plain_language_explanation: string;
  };
  section_6_your_medicines: Array<{
    timing_label: string; // e.g. "Morning (सुबह)"
    medicine_line: string; // e.g. "Tab Dolo 650mg - 1 Tablet"
    instructions: string; // e.g. "Take after breakfast with water"
  }>;
  section_7_what_you_should_do: string[];
  section_8_your_follow_up: {
    date_or_interval: string;
    special_advice: string;
  };
  section_9_important_things_to_remember: string[]; // Red flags when to contact clinic immediately
  section_10_contact_info: {
    clinic_name: string;
    phone: string;
    emergency_line: string;
  };
}

export interface HistoricalVisitSummary {
  date: string;
  doctor_name: string;
  diagnosis: string;
  medications: string[];
  vitals?: string;
  notes?: string;
}
