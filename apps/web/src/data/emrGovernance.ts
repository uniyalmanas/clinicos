/**
 * EMR Governance Specification & Clinical Safety Engine
 * Patient EMR Directory & Health History
 * 
 * Implements:
 * - Fix 1: Active Allergy Contraindication Engine with ATC code cross-checks & Hard-Stop Blocking
 * - Fix 2: Structured Lab Data Vault with HL7/FHIR parsing & historical trending
 * - Fix 3: Immutable Versioned Visit Notes (SOAP) & DPDP Access Audit Trail
 * - Fix 4: Biometric/Phone-based Unique Patient ID (UHID) & Dual-Admin Duplicate Resolution
 */

export interface EMRPatient {
  id: string;
  uhid: string;
  full_name: string;
  phone: string;
  dob: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  blood_group: string;
  emergency_contact: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_consent_status?: string;
  emergency_contact_consent_date?: string;
  emergency_contact_encrypted_hash?: string;
  identity_hash: string;
  is_duplicate_flagged: boolean;
  merged_into_uhid?: string | null;
  allergies?: EMRAllergy[];
  visits?: EMRClinicalVisit[];
  lab_results?: EMRLabResult[];
  audit_trail?: EMRAuditEntry[];
  duplicate_tickets?: EMRDuplicateMergeTicket[];
  secure_exports?: EMRSecureExport[];
}

export interface EMRAllergy {
  id: string;
  patient_uhid: string;
  allergen_name: string;
  atc_code: string;
  reaction_severity: "SEVERE_ANAPHYLAXIS" | "MODERATE_HIVES" | "MILD_RASH";
  reaction_description: string;
  is_active: boolean;
  logged_by: string;
  created_at: string;
}

export interface AllergyContraindicationCheck {
  conflict_found: boolean;
  is_hard_stop: boolean;
  conflicting_allergy?: EMRAllergy;
  prescribed_drug: string;
  atc_code: string;
  warning_title: string;
  warning_message: string;
  severity: "CRITICAL_FATAL_RISK" | "HIGH_WARNING" | "MODERATE";
}

export interface EMRLabResult {
  id: string;
  patient_uhid: string;
  test_name: string;
  parameter_name: string;
  parameter_value: number;
  unit: string;
  reference_min: number;
  reference_max: number;
  flag: "NORMAL" | "HIGH" | "CRITICAL_HIGH" | "LOW" | "CRITICAL_LOW";
  report_date: string;
  lab_source: string;
  raw_document_url?: string;
  ocr_confidence?: number;
}

export interface EMRClinicalVisit {
  id: string;
  patient_uhid: string;
  visit_number: string;
  version: number;
  is_latest: boolean;
  specialty_template: "GENERAL_SOAP" | "DERMATOLOGY_FITZPATRICK" | "PEDIATRIC_GROWTH" | "DENTAL_ODONTOGRAM";
  visit_date: string;
  doctor_name: string;
  doctor_specialization: string;
  provisional_diagnosis: string;
  vitals: {
    bp?: string;
    pulse?: number;
    temp?: number;
    weight?: number;
    spo2?: number;
    head_circ_cm?: number;
    growth_percentile?: string;
    fitzpatrick_skin_type?: string;
  };
  subjective_notes: string;
  objective_findings: string;
  assessment_plan: string;
  prescribed_medications: Array<{
    medicine: string;
    dose: string;
    route: string;
  }>;
  amendment_reason?: string | null;
  amended_by?: string | null;
  tamper_seal_hash: string;
  created_at: string;
}

export interface EMRAuditEntry {
  id: string;
  patient_uhid: string;
  action_type: 
    | "VIEW_RECORD" 
    | "EDIT_NOTE" 
    | "EXPORT_PDF" 
    | "PRINT_SUMMARY" 
    | "OVERRIDE_ALLERGY" 
    | "MERGE_PATIENT" 
    | "EMERGENCY_CONTACT_ACCESSED" 
    | "EMERGENCY_DISPATCH_INITIATED" 
    | "EXPORT_WATERMARKED_EMR" 
    | "NMC_CREDENTIAL_VERIFIED";
  user_name: string;
  user_role: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface EMRSecureExport {
  id: string;
  patient_uhid: string;
  export_type: "RIGHT_TO_ACCESS_PATIENT" | "SPECIALIST_REFERRAL" | "EMERGENCY_TRANSFER";
  recipient_name: string;
  recipient_id: string;
  patient_otp_verified: boolean;
  otp_session_id: string;
  watermark_text: string;
  expiry_hours: number;
  expires_at: string;
  tamper_seal_hash: string;
  created_at: string;
}

export interface SeniorDoctorCredential {
  doctor_name: string;
  role: "Senior Consultant" | "Medical Director" | "Head of Department";
  nmc_reg_number: string;
  state_medical_council: string;
  specialization: string;
  is_active: boolean;
  pin: string;
}

export const VERIFIED_SENIOR_DOCTORS: SeniorDoctorCredential[] = [
  {
    doctor_name: "Dr. Rahul Sharma",
    role: "Senior Consultant",
    nmc_reg_number: "NMC-DL-2014-99821",
    state_medical_council: "Delhi Medical Council (DMC)",
    specialization: "Internal Medicine & Critical Care",
    is_active: true,
    pin: "4491"
  },
  {
    doctor_name: "Dr. Neha Kapoor",
    role: "Head of Department",
    nmc_reg_number: "NMC-MH-2011-88412",
    state_medical_council: "Maharashtra Medical Council (MMC)",
    specialization: "Pediatrics & Neonatology",
    is_active: true,
    pin: "5512"
  }
];

export function maskEmergencyPhone(phone?: string): string {
  if (!phone) return "+91 ••••• •••••";
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.length >= 10) {
    return `+91 ${clean.slice(-10, -5)} •••••`;
  }
  return "+91 ••••• •••••";
}

export interface EMRDuplicateMergeTicket {
  id: string;
  source_uhid: string;
  target_uhid: string;
  primary_phone: string;
  similarity_score: number;
  status: "PENDING_DUAL_ADMIN" | "APPROVED_MERGED" | "REJECTED";
  approver_1: string;
  approver_2?: string | null;
  reconciliation_notes: string;
  created_at: string;
}

// ATC Codes and Drug Classes with high cross-reactivity
export const HIGH_RISK_ATC_CLASSES: Record<string, { class_name: string; cross_reactive_drugs: string[] }> = {
  "J01CA04": {
    class_name: "Penicillins & Beta-Lactams",
    cross_reactive_drugs: ["Amoxicillin", "Amoxyclav", "Ampicillin", "Augmentin", "Piperacillin", "Penicillin V", "Penicillin G"]
  },
  "J01EE01": {
    class_name: "Sulphonamides (Sulpha Antimicrobials)",
    cross_reactive_drugs: ["Bactrim", "Sulfamethoxazole", "Septran", "Sulfadiazine", "Cotrimoxazole"]
  },
  "M01AE01": {
    class_name: "Non-Steroidal Anti-Inflammatory Drugs (NSAIDs)",
    cross_reactive_drugs: ["Ibuprofen", "Brufen", "Diclofenac", "Naproxen", "Ketorolac", "Aspirin"]
  },
  "J01FA09": {
    class_name: "Macrolides",
    cross_reactive_drugs: ["Clarithromycin", "Erythromycin", "Azithromycin"]
  }
};

export const CLINICAL_OVERRIDE_REASON_CODES = [
  { code: "LIFE_SAVING_EMERGENCY", label: "Life-Saving Emergency (Immediate resuscitation / no viable spectrum alternative)" },
  { code: "DESENSITIZATION_PROTOCOL", label: "Supervised Desensitization Protocol (ICU / Clinical Day-Care monitoring)" },
  { code: "NO_VIABLE_ALTERNATIVE", label: "Severe Refractory Infection: Benefit Outweighs Risk (Microbiology sensitivity verified)" },
  { code: "PREVIOUS_TOLERANCE_VERIFIED", label: "Negative Allergy Challenge Test Confirmed by Allergist" },
  { code: "PATIENT_INFORMED_CONSENT", label: "Informed Clinical Consent Executed with Patient / Legal Guardian" }
];

export function checkAllergyConflict(drugName: string, patientAllergies: EMRAllergy[]): AllergyContraindicationCheck | null {
  const cleanDrug = drugName.toLowerCase().trim();

  for (const allergy of patientAllergies) {
    if (!allergy.is_active) continue;

    // Check ATC code matches
    const atcInfo = HIGH_RISK_ATC_CLASSES[allergy.atc_code];
    const isConflict = 
      cleanDrug.includes(allergy.allergen_name.toLowerCase()) ||
      (atcInfo && atcInfo.cross_reactive_drugs.some(d => cleanDrug.includes(d.toLowerCase())));

    if (isConflict) {
      const isSevere = allergy.reaction_severity === "SEVERE_ANAPHYLAXIS";
      return {
        conflict_found: true,
        is_hard_stop: true, // Always a hard stop blocking modal
        conflicting_allergy: allergy,
        prescribed_drug: drugName,
        atc_code: allergy.atc_code,
        warning_title: isSevere ? "🚨 FATAL CONTRAINDICATION: HARD-STOP ACTIVE" : "⚠️ ALLERGY CONTRAINDICATION DETECTED",
        warning_message: `Patient has documented allergy to ${allergy.allergen_name} (ATC: ${allergy.atc_code}) with reaction: "${allergy.reaction_description}". Prescribing ${drugName} carries severe risk of ${isSevere ? "fatal anaphylaxis & airway compromise" : "acute drug reaction"}.`,
        severity: isSevere ? "CRITICAL_FATAL_RISK" : "HIGH_WARNING"
      };
    }
  }

  return null;
}
