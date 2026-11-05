/* Shared shapes for AI consultation reports.
   Used by the recorder UI, the vault panel, and the API routes. */

export type ConsultationLanguage =
  | "auto"
  | "hindi"
  | "english"
  | "marathi"
  | "tamil"
  | "telugu"
  | "bengali"
  | "gujarati"
  | "kannada"
  | "malayalam"
  | "punjabi"
  | "urdu"
  | "odia"
  | "assamese";

export const CONSULTATION_LANGUAGES: Array<{ value: ConsultationLanguage; label: string }> = [
  { value: "auto", label: "Auto-detect" },
  { value: "hindi", label: "हिन्दी · Hindi" },
  { value: "english", label: "English" },
  { value: "marathi", label: "मराठी · Marathi" },
  { value: "tamil", label: "தமிழ் · Tamil" },
  { value: "telugu", label: "తెలుగు · Telugu" },
  { value: "bengali", label: "বাংলা · Bengali" },
  { value: "gujarati", label: "ગુજરાતી · Gujarati" },
  { value: "kannada", label: "ಕನ್ನಡ · Kannada" },
  { value: "malayalam", label: "മലയാളം · Malayalam" },
  { value: "punjabi", label: "ਪੰਜਾਬੀ · Punjabi" },
  { value: "urdu", label: "اردو · Urdu" },
  { value: "odia", label: "ଓଡ଼ିଆ · Odia" },
  { value: "assamese", label: "অসমীয়া · Assamese" },
];

/** ISO-639-1 code used by Whisper. `undefined` = auto-detect. */
export const WHISPER_LANGUAGE_CODE: Record<ConsultationLanguage, string | undefined> = {
  auto: undefined,
  hindi: "hi",
  english: "en",
  marathi: "mr",
  tamil: "ta",
  telugu: "te",
  bengali: "bn",
  gujarati: "gu",
  kannada: "kn",
  malayalam: "ml",
  punjabi: "pa",
  urdu: "ur",
  odia: "or",
  assamese: "as",
};

export type MedicineItem = {
  medicine_name?: string;
  generic_name?: string;
  dosage_form?: string;
  strength?: string;
  frequency?: string;
  duration?: string;
  special_instructions?: string;
};

export type DoctorReport = {
  vitals_assessment?: string;
  clinical_summary?: string;
  differential_diagnoses?: string[];
  red_flags?: string[];
};

export type PatientMedicineSlot = {
  timing?: string;
  medicine?: string;
  instructions?: string;
};

export type PatientReport = {
  condition_overview?: string;
  medicine_schedule?: PatientMedicineSlot[];
  home_care_guidance?: string;
  emergency_warning_signs?: string;
  followup_instruction?: string;
};

export type ConsultationReport = {
  id: string;
  appointment_number: string | null;
  patient_phone: string;
  patient_name: string;
  doctor_slug: string | null;
  doctor_name: string | null;
  language: ConsultationLanguage;
  duration_seconds: number | null;
  transcript: string;
  chief_complaints: string | null;
  provisional_diagnosis: string | null;
  vitals: Record<string, unknown>;
  medicines: MedicineItem[];
  lab_tests: string[];
  doctor_report: DoctorReport;
  patient_report: PatientReport;
  status: "draft" | "approved";
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};
