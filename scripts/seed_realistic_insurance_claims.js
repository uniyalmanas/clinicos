const postgres = require('postgres');

const DB_URL = 'postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DB_URL, { ssl: { rejectUnauthorized: false } });

async function seedInsuranceData() {
  try {
    console.log('Seeding governed insurance claims into Supabase...');

    // Clear existing claims to establish clean, governed baseline
    await sql.unsafe(`TRUNCATE TABLE insurance_claims CASCADE;`);

    const now = new Date();
    const twentySixHoursAgo = new Date(Date.now() - 26.5 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
    const fourDaysAgo = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();

    const sampleClaims = [
      {
        id: "2113e020-32f1-492a-a6e9-db2d57187c4e",
        claim_number: "CLM-2026-STAR-8812",
        patient_name: "Sunita Joshi",
        patient_phone: "+91 98765 43299",
        policy_number: "POL-STAR-8874129",
        tpa_company: "Star Health & Allied Insurance",
        procedure_code: "PROC-EMERGENCY-OBS",
        procedure_name: "Acute Emergency IPD Medical Observation & Stabilization",
        package_rate_cap: 18000,
        estimated_amount: 17500,
        approved_amount: 17500,
        package_rate_overrun: false,
        status: "approved",
        approval_ref: "AUTH/STAR/2026/89412",
        submission_date: now.toISOString(),
        remarks: "Pre-authorization granted under standard emergency daycare protocol.",
        mandatory_docs_checklist: JSON.stringify([
          { id: "doc_er_triage_note", label: "Emergency Room Triage note & Glasgow Coma Scale", is_mandatory: true, verified: true, verified_by: "Dr. S. K. Pathak", verified_at: now.toISOString(), file_name: "ER_Triage_Note_SunitaJoshi.pdf" },
          { id: "doc_emergency_vitals_ecg", label: "Emergency ECG & SpO2 vital trend sheet", is_mandatory: true, verified: true, verified_by: "Nurse Supervisor Anita", verified_at: now.toISOString(), file_name: "ECG_Strip_Vitals_12Lead.pdf" },
          { id: "doc_attending_admission_order", label: "Attending Physician Emergency Admission Order", is_mandatory: true, verified: true, verified_by: "Dr. Rahul Sharma", verified_at: now.toISOString(), file_name: "Indoor_Admission_Order.pdf" }
        ]),
        tpa_query_details: JSON.stringify({}),
        settlement_details: JSON.stringify({}),
        audit_trail: JSON.stringify([
          { action: "PRE_AUTH_DRAFTED", timestamp: now.toISOString(), by: "TPA Desk Executive", notes: "Checklist completed with all 3 mandatory clinical records." },
          { action: "PRE_AUTH_SUBMITTED", timestamp: now.toISOString(), by: "System Gateway", notes: "Transmission verified with Hospital ROHINI Code ROHINI-UK-DED-0418." },
          { action: "PRE_AUTH_APPROVED", timestamp: now.toISOString(), by: "Star Health Medical Team", notes: "Sanction letter received for ₹17,500." }
        ])
      },
      {
        id: "5a3a0ea7-16a7-4c62-85af-d269db5f2e21",
        claim_number: "CLM-2026-HDFC-9904",
        patient_name: "Mohan Lal Verma",
        patient_phone: "+91 98765 33445",
        policy_number: "POL-HDFC-991204",
        tpa_company: "HDFC ERGO General Insurance",
        procedure_code: "PROC-CAG-01",
        procedure_name: "Coronary Angiography (CAG) + Daycare Cath Observation",
        package_rate_cap: 25000,
        estimated_amount: 32000,
        approved_amount: 0,
        package_rate_overrun: true,
        package_override_pin: "FIN-9921",
        package_override_reason: "High-Risk Comorbidity (Uncontrolled DM / CKD / Cardiac CAD) requiring ICU / High-Dependency care",
        package_override_by: "Suresh Rawat (Finance Head / Revenue Controller)",
        status: "under_review",
        approval_ref: null,
        submission_date: now.toISOString(),
        remarks: "Package cap ₹25,000 exceeded by ₹7,000 due to diabetic nephropathy contrast hydration protocol. Overridden with Finance Head PIN.",
        mandatory_docs_checklist: JSON.stringify([
          { id: "doc_ecg_12lead", label: "12-Lead ECG Strip showing ST/T ischemia", is_mandatory: true, verified: true, verified_by: "Dr. Arvind Shenoy", verified_at: now.toISOString(), file_name: "ECG_Ischemia_MLVerma.pdf" },
          { id: "doc_2d_echo", label: "2D Echocardiography report with LV Ejection Fraction (EF%)", is_mandatory: true, verified: true, verified_by: "Dr. Arvind Shenoy", verified_at: now.toISOString(), file_name: "2D_Echo_EF48.pdf" },
          { id: "doc_consultant_indoor_note", label: "Attending Cardiologist clinical indoor note", is_mandatory: true, verified: true, verified_by: "Dr. Arvind Shenoy", verified_at: now.toISOString(), file_name: "Cardiology_Requisition.pdf" },
          { id: "doc_baseline_creatinine", label: "Baseline Serum Creatinine / KFT (<48 hrs for contrast dye clearance)", is_mandatory: true, verified: true, verified_by: "Pathologist Dr. Pathak", verified_at: now.toISOString(), file_name: "Serum_Creatinine_1_2.pdf" }
        ]),
        tpa_query_details: JSON.stringify({}),
        settlement_details: JSON.stringify({}),
        audit_trail: JSON.stringify([
          { action: "PACKAGE_RATE_OVERRUN_DETECTED", timestamp: now.toISOString(), by: "System Governance Engine", notes: "Estimate ₹32,000 exceeds agreed tariff cap ₹25,000 (+28%). Direct submission locked." },
          { action: "FINANCE_PIN_OVERRIDE_RECORDED", timestamp: now.toISOString(), by: "Suresh Rawat (Finance Head)", notes: "Authorized under code COMORBIDITY_HIGH_RISK. Difference flagged for co-pay recovery." },
          { action: "PRE_AUTH_SUBMITTED", timestamp: now.toISOString(), by: "TPA Desk", notes: "Sent to HDFC ERGO TPA Portal with digital physician credentials." }
        ])
      },
      {
        id: "7b4c91a2-8921-4f93-bc88-991204a91284",
        claim_number: "CLM-2026-CARE-4419",
        patient_name: "Kamla Devi Rawat",
        patient_phone: "+91 99112 88776",
        policy_number: "POL-CARE-551203",
        tpa_company: "Care Health Insurance (Religare)",
        procedure_code: "PROC-LAP-CHOLE",
        procedure_name: "Laparoscopic Cholecystectomy (Symptomatic Gallstones)",
        package_rate_cap: 59000,
        estimated_amount: 58500,
        approved_amount: 0,
        package_rate_overrun: false,
        status: "query_raised",
        approval_ref: "CARE-QRY-2026-8812",
        submission_date: twentySixHoursAgo,
        remarks: "TPA query received requesting past ultrasound history and duration of biliary colic.",
        mandatory_docs_checklist: JSON.stringify([
          { id: "doc_usg_whole_abdomen", label: "USG Whole Abdomen report confirming cholelithiasis", is_mandatory: true, verified: true, verified_by: "Dr. Sunita Rao", verified_at: twentySixHoursAgo, file_name: "USG_Gallstones_Kamla.pdf" },
          { id: "doc_lft_serum", label: "Liver Function Test (Bilirubin, SGOT, SGPT)", is_mandatory: true, verified: true, verified_by: "Dr. Pathak", verified_at: twentySixHoursAgo, file_name: "LFT_Preop.pdf" },
          { id: "doc_surgeon_admission_note", label: "General Surgeon clinical admission sheet", is_mandatory: true, verified: true, verified_by: "Dr. Rohit Sureka", verified_at: twentySixHoursAgo, file_name: "Surgical_Admission_Consent.pdf" },
          { id: "doc_pac_fitness", label: "Pre-Anesthetic Checkup (PAC) clearance note", is_mandatory: true, verified: true, verified_by: "Dr. Aditi Joshi", verified_at: twentySixHoursAgo, file_name: "PAC_Clearance.pdf" }
        ]),
        tpa_query_details: JSON.stringify({
          query_text: "Please provide clinical clarification: Whether patient had prior episodes of acute cholecystitis before policy inception (14 months ago)? Attach previous OPD prescription slips.",
          query_received_at: twentySixHoursAgo,
          query_type: "PAST_HISTORY",
          assigned_to: "Ritu Negi (TPA Desk Executive)",
          sla_hours_limit: 24,
          escalation_tier: "manager_escalation"
        }),
        settlement_details: JSON.stringify({}),
        audit_trail: JSON.stringify([
          { action: "PRE_AUTH_SUBMITTED", timestamp: twentySixHoursAgo, by: "TPA Desk", notes: "Checklist 100% verified." },
          { action: "TPA_QUERY_RECEIVED", timestamp: twentySixHoursAgo, by: "Care Health Portal", notes: "Query on pre-existing condition duration received." },
          { action: "SLA_ESCALATED_TO_BILLING_MANAGER", timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), by: "SLA Auto-Escalation Engine", notes: "Query unresponded >24 hours (26.5h elapsed). Rejection Risk Score surged to 63%. Alert sent to Billing Manager." }
        ])
      },
      {
        id: "9c81b2ef-3312-4aa1-9f22-110298374a2b",
        claim_number: "CLM-2026-NIVA-7721",
        patient_name: "Col. H. S. Bisht (Retd.)",
        patient_phone: "+91 94120 44551",
        policy_number: "POL-NIVA-882910",
        tpa_company: "Niva Bupa Health Insurance (Max Bupa)",
        procedure_code: "PROC-TKR-UNI",
        procedure_name: "Total Knee Arthroplasty / Replacement (Unilateral)",
        package_rate_cap: 172000,
        estimated_amount: 170000,
        approved_amount: 170000,
        package_rate_overrun: false,
        status: "settled",
        approval_ref: "AUTH/NIVA/TKR/2026/0912",
        submission_date: fourDaysAgo,
        remarks: "Final settlement reconciled. Remittance of ₹1,56,800 received against ₹1,70,000 approved.",
        mandatory_docs_checklist: JSON.stringify([
          { id: "doc_xray_bilateral_ap_lat", label: "Weight-bearing Bilateral Knee X-Rays", is_mandatory: true, verified: true, verified_by: "Dr. Arvind Shenoy", verified_at: fourDaysAgo, file_name: "XRay_TKR_Bisht.pdf" },
          { id: "doc_ortho_evaluation", label: "Orthopedic Surgeon Kellgren-Lawrence Grade note", is_mandatory: true, verified: true, verified_by: "Dr. Arvind Shenoy", verified_at: fourDaysAgo, file_name: "Grade_IV_TKR_Note.pdf" },
          { id: "doc_cardiac_fitness", label: "Cardiac clearance & PAC surgical consent", is_mandatory: true, verified: true, verified_by: "Dr. Sharma", verified_at: fourDaysAgo, file_name: "Cardiac_PAC_Fit.pdf" },
          { id: "doc_implant_invoice_sticker", label: "Implant barcode sticker / specification sheet", is_mandatory: true, verified: true, verified_by: "OT Staff Raj", verified_at: fourDaysAgo, file_name: "Stryker_Triathlon_Sticker.pdf" }
        ]),
        tpa_query_details: JSON.stringify({}),
        settlement_details: JSON.stringify({
          utr_number: "UTR-HDFC-09283741829",
          remittance_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          approved_amount: 170000,
          remitted_amount: 156800,
          shortfall_amount: 13200,
          deductions: [
            {
              code: "DED_NON_PAYABLE_CONSUMABLES",
              reason: "Non-Medical Items / Consumables (PPE kit, disposable suction tubes, drapes)",
              amount: 4200,
              disputed: false
            },
            {
              code: "DED_ROOM_RENT_CAPPING_COPAY",
              reason: "Proportionate room rent sub-limit breach (Single Deluxe vs Twin Sharing policy clause)",
              amount: 9000,
              disputed: true,
              appeal_notes: "Disputed: Patient was admitted directly to HDU post-op as clinically mandated by PAC physician, not elective room upgrade."
            }
          ],
          is_reconciled: true,
          reconciled_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          reconciled_by: "Suresh Rawat (Finance Head)",
          posted_to_ledger: true,
          dispute_status: "dispute_queued"
        }),
        audit_trail: JSON.stringify([
          { action: "PRE_AUTH_APPROVED", timestamp: fourDaysAgo, by: "Niva Bupa TPA", notes: "Approved for full agreed tariff ₹1,70,000." },
          { action: "REMITTANCE_ADVICE_RECEIVED", timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), by: "Bank Feed", notes: "UTR-HDFC-09283741829 received for ₹1,56,800. Shortfall detected: ₹13,200." },
          { action: "REMITTANCE_RECONCILED", timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), by: "Suresh Rawat (Finance Head)", notes: "Shortfall categorized: ₹4,200 non-payable, ₹9,000 proportionate deduction disputed and routed to Grievance Queue." },
          { action: "POSTED_TO_LEDGER", timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), by: "Finance System", notes: "Net reconciled receipt ₹1,56,800 posted to Bed Billing Ledger BED-ICU-02." }
        ])
      }
    ];

    for (const c of sampleClaims) {
      await sql.unsafe(`
        INSERT INTO insurance_claims (
          id, claim_number, patient_name, patient_phone, policy_number,
          tpa_company, procedure_code, procedure_name, package_rate_cap,
          estimated_amount, approved_amount, package_rate_overrun,
          package_override_pin, package_override_reason, package_override_by,
          status, approval_ref, submission_date, remarks,
          mandatory_docs_checklist, tpa_query_details, settlement_details, audit_trail, created_at
        ) VALUES (
          '${c.id}', '${c.claim_number}', '${c.patient_name}', '${c.patient_phone}', '${c.policy_number}',
          '${c.tpa_company}', '${c.procedure_code}', '${c.procedure_name.replace(/'/g, "''")}', ${c.package_rate_cap},
          ${c.estimated_amount}, ${c.approved_amount}, ${c.package_rate_overrun},
          ${c.package_override_pin ? `'${c.package_override_pin}'` : 'NULL'},
          ${c.package_override_reason ? `'${c.package_override_reason.replace(/'/g, "''")}'` : 'NULL'},
          ${c.package_override_by ? `'${c.package_override_by.replace(/'/g, "''")}'` : 'NULL'},
          '${c.status}', ${c.approval_ref ? `'${c.approval_ref}'` : 'NULL'}, '${c.submission_date}',
          '${c.remarks.replace(/'/g, "''")}',
          '${c.mandatory_docs_checklist.replace(/'/g, "''")}'::jsonb,
          '${c.tpa_query_details.replace(/'/g, "''")}'::jsonb,
          '${c.settlement_details.replace(/'/g, "''")}'::jsonb,
          '${c.audit_trail.replace(/'/g, "''")}'::jsonb,
          NOW()
        );
      `);
    }

    console.log('✓ Successfully seeded 4 clinical-grade insurance cases!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedInsuranceData();
