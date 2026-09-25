/**
 * TPA & Cashless Insurance Desk: Clinical Governance, Package Rate Tariffs & SLA Engine
 * Standards: IRDAI Master Circular on Health Insurance (2024), GIPSA PPN Tariff Framework
 */

export interface MandatoryDocumentItem {
  id: string;
  label: string;
  is_mandatory: boolean;
  verified: boolean;
  verified_at?: string;
  verified_by?: string;
  file_name?: string;
}

export interface ProcedurePackage {
  code: string;
  name: string;
  category: "Cardiology" | "General Surgery" | "Orthopaedics" | "Oncology" | "Internal Medicine" | "Critical Care";
  mandatory_documents: MandatoryDocumentItem[];
  tpa_rate_caps: Record<string, number>;
  default_stay_days: number;
}

export const PROCEDURE_CATALOG: ProcedurePackage[] = [
  {
    code: "PROC-CAG-01",
    name: "Coronary Angiography (CAG) + Daycare Cath Observation",
    category: "Cardiology",
    default_stay_days: 1,
    tpa_rate_caps: {
      "Star Health & Allied Insurance": 24000,
      "HDFC ERGO General Insurance": 25000,
      "ICICI Lombard General Insurance": 23500,
      "Care Health Insurance (Religare)": 24000,
      "Niva Bupa Health Insurance (Max Bupa)": 24500,
      "Medi Assist TPA": 23000,
      "Paramount Health Services TPA": 22500,
      "Bajaj Allianz General Insurance": 24000,
      "Tata AIG General Insurance": 23500,
      "Aditya Birla Health Insurance": 24000
    },
    mandatory_documents: [
      { id: "doc_ecg_12lead", label: "12-Lead ECG Strip showing ST/T ischemia or chest pain indication", is_mandatory: true, verified: false },
      { id: "doc_2d_echo", label: "2D Echocardiography report with LV Ejection Fraction (EF%)", is_mandatory: true, verified: false },
      { id: "doc_consultant_indoor_note", label: "Attending Cardiologist clinical indoor note & procedure requisition", is_mandatory: true, verified: false },
      { id: "doc_baseline_creatinine", label: "Baseline Serum Creatinine / KFT (<48 hrs for contrast dye clearance)", is_mandatory: true, verified: false }
    ]
  },
  {
    code: "PROC-LAP-CHOLE",
    name: "Laparoscopic Cholecystectomy (Symptomatic Gallstones)",
    category: "General Surgery",
    default_stay_days: 2,
    tpa_rate_caps: {
      "Star Health & Allied Insurance": 58000,
      "HDFC ERGO General Insurance": 62000,
      "ICICI Lombard General Insurance": 60000,
      "Care Health Insurance (Religare)": 59000,
      "Niva Bupa Health Insurance (Max Bupa)": 61000,
      "Medi Assist TPA": 58500,
      "Paramount Health Services TPA": 57000,
      "Bajaj Allianz General Insurance": 60000,
      "Tata AIG General Insurance": 59500,
      "Aditya Birla Health Insurance": 59000
    },
    mandatory_documents: [
      { id: "doc_usg_whole_abdomen", label: "USG Whole Abdomen report confirming cholelithiasis / thickened gallbladder wall", is_mandatory: true, verified: false },
      { id: "doc_lft_serum", label: "Liver Function Test (Bilirubin, SGOT, SGPT) to rule out common bile duct stones", is_mandatory: true, verified: false },
      { id: "doc_surgeon_admission_note", label: "General Surgeon clinical admission sheet with patient informed consent", is_mandatory: true, verified: false },
      { id: "doc_pac_fitness", label: "Pre-Anesthetic Checkup (PAC) clearance note", is_mandatory: true, verified: false }
    ]
  },
  {
    code: "PROC-TKR-UNI",
    name: "Total Knee Arthroplasty / Replacement (Unilateral)",
    category: "Orthopaedics",
    default_stay_days: 4,
    tpa_rate_caps: {
      "Star Health & Allied Insurance": 165000,
      "HDFC ERGO General Insurance": 175000,
      "ICICI Lombard General Insurance": 170000,
      "Care Health Insurance (Religare)": 168000,
      "Niva Bupa Health Insurance (Max Bupa)": 172000,
      "Medi Assist TPA": 165000,
      "Paramount Health Services TPA": 160000,
      "Bajaj Allianz General Insurance": 168000,
      "Tata AIG General Insurance": 166000,
      "Aditya Birla Health Insurance": 167000
    },
    mandatory_documents: [
      { id: "doc_xray_bilateral_ap_lat", label: "Weight-bearing Bilateral Knee X-Rays (AP & Lateral views)", is_mandatory: true, verified: false },
      { id: "doc_ortho_evaluation", label: "Orthopedic Surgeon clinical evaluation with Kellgren-Lawrence Grade III/IV classification", is_mandatory: true, verified: false },
      { id: "doc_cardiac_fitness", label: "Cardiac clearance & PAC high-risk surgical consent", is_mandatory: true, verified: false },
      { id: "doc_implant_invoice_sticker", label: "Implant barcode sticker / specification sheet (Cruciate Retaining / Posterior Stabilized)", is_mandatory: true, verified: false }
    ]
  },
  {
    code: "PROC-DAYCARE-CHEMO",
    name: "Daycare Chemotherapy Cycle + Supportive Antiemetic Infusion",
    category: "Oncology",
    default_stay_days: 1,
    tpa_rate_caps: {
      "Star Health & Allied Insurance": 16000,
      "HDFC ERGO General Insurance": 18000,
      "ICICI Lombard General Insurance": 17500,
      "Care Health Insurance (Religare)": 16500,
      "Niva Bupa Health Insurance (Max Bupa)": 17000,
      "Medi Assist TPA": 16000,
      "Paramount Health Services TPA": 15500,
      "Bajaj Allianz General Insurance": 16500,
      "Tata AIG General Insurance": 16200,
      "Aditya Birla Health Insurance": 16400
    },
    mandatory_documents: [
      { id: "doc_histopathology_biopsy", label: "Histopathology / Biopsy IHC report confirming primary oncological diagnosis", is_mandatory: true, verified: false },
      { id: "doc_oncology_chemo_protocol", label: "Medical Oncologist signed chemotherapy protocol & Body Surface Area (BSA) calculation", is_mandatory: true, verified: false },
      { id: "doc_recent_cbc_lft_kft", label: "Pre-cycle blood counts (Absolute Neutrophil Count ANC > 1500, Platelets > 100k)", is_mandatory: true, verified: false }
    ]
  },
  {
    code: "PROC-DENGUE-PLATELET",
    name: "Severe Dengue Inpatient Management + Platelet Transfusion",
    category: "Internal Medicine",
    default_stay_days: 3,
    tpa_rate_caps: {
      "Star Health & Allied Insurance": 25000,
      "HDFC ERGO General Insurance": 28000,
      "ICICI Lombard General Insurance": 26000,
      "Care Health Insurance (Religare)": 25000,
      "Niva Bupa Health Insurance (Max Bupa)": 26500,
      "Medi Assist TPA": 24000,
      "Paramount Health Services TPA": 23500,
      "Bajaj Allianz General Insurance": 25500,
      "Tata AIG General Insurance": 25000,
      "Aditya Birla Health Insurance": 25000
    },
    mandatory_documents: [
      { id: "doc_dengue_serology", label: "Dengue NS1 Antigen (Day 1-5) or IgM ELISA positive confirmatory report", is_mandatory: true, verified: false },
      { id: "doc_serial_platelet_counts", label: "Serial Platelet trend documentation showing count < 50,000 /cumm or rapid precipitous drop", is_mandatory: true, verified: false },
      { id: "doc_physician_vitals_sheet", label: "Physician indoor clinical chart recording hematocrit, BP, and fluid resuscitation", is_mandatory: true, verified: false }
    ]
  },
  {
    code: "PROC-EMERGENCY-OBS",
    name: "Acute Emergency IPD Medical Observation & Stabilization",
    category: "Critical Care",
    default_stay_days: 1,
    tpa_rate_caps: {
      "Star Health & Allied Insurance": 18000,
      "HDFC ERGO General Insurance": 20000,
      "ICICI Lombard General Insurance": 19000,
      "Care Health Insurance (Religare)": 18500,
      "Niva Bupa Health Insurance (Max Bupa)": 19500,
      "Medi Assist TPA": 18000,
      "Paramount Health Services TPA": 17500,
      "Bajaj Allianz General Insurance": 18500,
      "Tata AIG General Insurance": 18000,
      "Aditya Birla Health Insurance": 18200
    },
    mandatory_documents: [
      { id: "doc_er_triage_note", label: "Emergency Room Triage note & Glasgow Coma Scale / acute vital sheet", is_mandatory: true, verified: false },
      { id: "doc_emergency_vitals_ecg", label: "Emergency ECG, SpO2 trend, and point-of-care lab investigations", is_mandatory: true, verified: false },
      { id: "doc_attending_admission_order", label: "Attending Physician Emergency Admission Order specifying IPD necessity", is_mandatory: true, verified: false }
    ]
  }
];

export const FINANCE_OVERRIDE_REASON_CODES = [
  { code: "COMORBIDITY_HIGH_RISK", label: "High-Risk Comorbidity (Uncontrolled DM / CKD / Cardiac CAD) requiring ICU / High-Dependency care" },
  { code: "ICU_VENTILATOR_EXTENSION", label: "Emergency ICU / Non-Invasive Ventilation (BiPAP) requirement beyond standard ward package" },
  { code: "SPECIALIZED_IMPLANT_STENT", label: "US-FDA Approved Drug-Eluting Stent or High-Flex Prosthesis upgrade requested" },
  { code: "SUPER_SPECIALIST_CROSS_CONSULT", label: "Multi-Disciplinary cross consultation required for patient safety (Nephrology / Pulmonology)" },
  { code: "EMERGENCY_AFTER_HOURS_SURGERY", label: "Emergency unscheduled midnight operative intervention with on-call surgical team" }
];

export const AUTHORIZED_FINANCE_PINS = [
  { pin: "FIN-9921", name: "Suresh Rawat", role: "Finance Head / Revenue Controller" },
  { pin: "8842", name: "Pooja Negi", role: "Hospital Billing Director" },
  { pin: "ADMIN-001", name: "Dr. Vikram Sethi", role: "Medical Superintendent" }
];

export const IRDAI_DEDUCTION_REASON_CODES = [
  { code: "DED_NON_PAYABLE_CONSUMABLES", label: "Non-Medical Items / Consumables (Gloves, Sanitizers, PPE, Thermometer, Syringes)", appealable: false },
  { code: "DED_ROOM_RENT_CAPPING_COPAY", label: "Proportionate Room Rent Capping Breach (Patient admitted in category exceeding policy sub-limit)", appealable: true },
  { code: "DED_CO_PAY_CLAUSE", label: "Mandatory Policy Co-Payment Clause (10% or 20% patient co-share)", appealable: false },
  { code: "DED_INVESTIGATION_UNJUSTIFIED", label: "Disallowed Diagnostic Investigation (Deemed unrelated to primary admission diagnosis)", appealable: true },
  { code: "DED_TARIFF_BENCHMARK_DISALLOWANCE", label: "Tariff billed higher than agreed corporate GIPSA PPN schedule", appealable: true },
  { code: "DED_PHARMACY_MARGIN_DISALLOWANCE", label: "High-cost branded formulation billed where generic equivalent mandated", appealable: false }
];

export interface TpaQueryData {
  query_text: string;
  query_received_at: string;
  query_type: "MEDICAL_NECESSITY" | "BILL_BREAKUP" | "INVESTIGATION_REPORTS" | "PAST_HISTORY" | "DISCHARGE_SUMMARY";
  assigned_to: string;
  sla_hours_limit: number;
  response_text?: string;
  responded_at?: string;
  responded_by?: string;
  dispute_evidence?: string;
}

export interface SettlementData {
  utr_number: string;
  remittance_date: string;
  approved_amount: number;
  remitted_amount: number;
  shortfall_amount: number;
  deductions: Array<{
    code: string;
    reason: string;
    amount: number;
    disputed: boolean;
    appeal_notes?: string;
  }>;
  is_reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  posted_to_ledger: boolean;
  dispute_status?: "none" | "dispute_queued" | "under_arbitration" | "settled_with_tpa";
}

/**
 * Calculates Query SLA Status and Rejection Risk Score
 */
export function calculateQuerySla(queryDetails?: TpaQueryData | null) {
  if (!queryDetails || !queryDetails.query_received_at) {
    return {
      hoursElapsed: 0,
      hoursRemaining: 24,
      escalationTier: "normal",
      statusLabel: "No Active Query",
      riskScore: 0,
      riskLevel: "low",
      isBreached: false
    };
  }

  const receivedAt = new Date(queryDetails.query_received_at).getTime();
  const now = queryDetails.responded_at ? new Date(queryDetails.responded_at).getTime() : Date.now();
  const elapsedMs = Math.max(0, now - receivedAt);
  const hoursElapsed = Math.round((elapsedMs / (1000 * 60 * 60)) * 10) / 10;
  const hoursRemaining = Math.max(0, Math.round((24 - hoursElapsed) * 10) / 10);

  let escalationTier: "normal" | "manager_escalation" | "admin_critical" = "normal";
  let statusLabel = `Active Query (${hoursRemaining}h remaining)`;

  if (hoursElapsed >= 48) {
    escalationTier = "admin_critical";
    statusLabel = `CRITICAL: Escalated to Practice Admin (>48h unresponded)`;
  } else if (hoursElapsed >= 24) {
    escalationTier = "manager_escalation";
    statusLabel = `WARNING: Escalated to Billing Manager (>24h unresponded)`;
  }

  // Calculate dynamic Rejection Risk Score
  // Base 15% + time factor + complexity factor
  let riskScore = 15;
  if (hoursElapsed >= 48) {
    riskScore += 55; // 70%+
  } else if (hoursElapsed >= 24) {
    riskScore += 30; // 45%+
  } else if (hoursElapsed >= 16) {
    riskScore += 15;
  }

  if (queryDetails.query_type === "MEDICAL_NECESSITY" || queryDetails.query_type === "PAST_HISTORY") {
    riskScore += 18;
  }

  riskScore = Math.min(96, Math.max(10, riskScore));

  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  if (riskScore >= 75) riskLevel = "critical";
  else if (riskScore >= 50) riskLevel = "high";
  else if (riskScore >= 30) riskLevel = "medium";

  return {
    hoursElapsed,
    hoursRemaining,
    escalationTier,
    statusLabel,
    riskScore,
    riskLevel,
    isBreached: hoursElapsed >= 24
  };
}
