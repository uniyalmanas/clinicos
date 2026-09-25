/**
 * ABDM Master Governance Specification & NHA Gateway Architecture
 * Standards: ABDM Milestone M1/M2/M3, UIDAI Aadhaar Act (2016) Section 29, DPDP Act (2023)
 */

export interface ConsentArtefact {
  id: string;
  consent_request_id: string;
  consent_artefact_id?: string | null;
  patient_name: string;
  patient_phone: string;
  abha_number: string;
  abha_address: string;
  hiu_name: string;
  purpose_code: string;
  purpose_label: string;
  date_range_from: string;
  date_range_to: string;
  expiry_timestamp: string;
  status: "REQUESTED" | "GRANTED" | "DENIED" | "REVOKED" | "EXPIRED";
  ca_token_hash?: string | null;
  otp_verified_at?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  access_count: number;
  last_accessed_at?: string | null;
  created_at: string;
}

export interface AbdmPatient {
  id: string;
  abha_number: string;
  abha_address: string;
  patient_name: string;
  patient_phone: string;
  masked_aadhaar: string;
  vid_reference?: string | null;
  kyc_status: "VERIFIED" | "PENDING_NHA_SYNC" | "CONFLICT_FLAGGED";
  demographic_conflict: boolean;
  conflict_details?: string | null;
  nha_sync_attempts: number;
  gateway_mode: "SANDBOX_M1_M2" | "PRODUCTION_NHA_GATEWAY" | "OFFLINE_QUEUE_FALLBACK";
  created_at: string;
}

export const ABDM_PURPOSE_CODES = [
  { 
    code: "CAREFUL_EPISODE_MANAGEMENT", 
    label: "Care Management & Clinical Inpatient Consultation",
    default_validity_days: 7,
    description: "Permits attending physician to review longitudinal history for current consultation episode."
  },
  { 
    code: "DIAGNOSTIC_PATHOLOGY_ACCESS", 
    label: "Diagnostic Investigation & LIS Synchronization",
    default_validity_days: 3,
    description: "Permits pathologist and phlebotomist to link specimen test results to national health locker."
  },
  { 
    code: "PHARMACY_DISPENSING_VERIFICATION", 
    label: "Prescription Verification & Safe Dispensing",
    default_validity_days: 1,
    description: "Enables pharmacist to verify tamper-proof digital prescription and Schedule H1 drugs."
  },
  { 
    code: "EMERGENCY_ACCESS_OVERRIDE", 
    label: "Emergency Care (24-Hour Critical Override)",
    default_validity_days: 1,
    description: "Emergency Department acute access under Good Samaritan medical necessity provisions."
  }
];

/**
 * Mask raw Aadhaar string to strictly UIDAI-compliant format (XXXX-XXXX-1234)
 */
export function maskAadhaar(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 4) {
    const last4 = digits.slice(-4);
    return `XXXX-XXXX-${last4}`;
  }
  return "XXXX-XXXX-0000";
}

/**
 * Validates Virtual ID (VID) per UIDAI 16-digit specification
 */
export function isValidVid(vid: string): boolean {
  const clean = vid.replace(/[\s-]/g, "");
  return /^\d{16}$/.test(clean);
}
