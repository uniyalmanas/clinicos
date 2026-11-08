-- ============================================================================
-- 002 — DOMAIN SCHEMA (INPATIENT, LAB, PHARMACY, EMR, SCHEDULING, FINANCE)
--
-- The canonical baseline (001) only defines the core tenant/clinical tables.
-- The application, however, reads and writes the operational domain tables
-- below. This migration creates them from the queries the API routes actually
-- execute, and adds the columns missing from the baseline tables.
--
-- Idempotent: safe to run against an existing database.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. SCHEDULING
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id       TEXT NOT NULL,
    clinic_slug     TEXT NOT NULL,
    doctor_slug     TEXT NOT NULL,
    doctor_name     TEXT NOT NULL,
    specialization  TEXT,
    chamber_name    TEXT,
    working_days    JSONB NOT NULL DEFAULT '[]'::jsonb,
    start_time      TEXT NOT NULL DEFAULT '09:00',
    end_time        TEXT NOT NULL DEFAULT '17:00',
    slot_duration   INTEGER NOT NULL DEFAULT 15,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_id, doctor_slug)
);
CREATE INDEX IF NOT EXISTS idx_ds_clinic ON doctor_schedules (clinic_id);

CREATE TABLE IF NOT EXISTS doctor_blocked_slots (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id   TEXT NOT NULL,
    clinic_slug TEXT NOT NULL,
    doctor_slug TEXT NOT NULL,
    date        TEXT NOT NULL,
    start_time  TEXT,
    end_time    TEXT,
    reason      TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'blocked',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dbs_clinic ON doctor_blocked_slots (clinic_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_dbs_doctor ON doctor_blocked_slots (doctor_slug, date DESC);

-- ---------------------------------------------------------------------------
-- 2. INPATIENT WARDS & BEDS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_wards (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug TEXT NOT NULL,
    name        TEXT NOT NULL,
    ward_type   TEXT NOT NULL DEFAULT 'general',
    daily_rate  NUMERIC(12,2) NOT NULL DEFAULT 0,
    hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_beds  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinic_wards_slug ON clinic_wards (clinic_slug);

CREATE TABLE IF NOT EXISTS clinic_beds (
    id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug                 TEXT NOT NULL,
    ward_id                     TEXT,
    bed_number                  TEXT NOT NULL,
    status                      TEXT NOT NULL DEFAULT 'VACANT_CLEAN',
    admission_id                TEXT,
    current_patient_name        TEXT,
    current_patient_phone       TEXT,
    assigned_doctor_name        TEXT,
    admission_notes             TEXT,
    admission_timestamp         TIMESTAMPTZ,
    discharge_ordered_at        TIMESTAMPTZ,
    doctor_discharge_signed     BOOLEAN NOT NULL DEFAULT false,
    sanitization_hk_logged      BOOLEAN NOT NULL DEFAULT false,
    sanitization_hk_at          TIMESTAMPTZ,
    sanitization_hk_by          TEXT,
    sanitization_nurse_qa       BOOLEAN NOT NULL DEFAULT false,
    sanitization_nurse_at       TIMESTAMPTZ,
    sanitization_nurse_by       TEXT,
    active_vitals_protocol      TEXT,
    last_vitals_logged_at       TIMESTAMPTZ,
    last_vitals_json            JSONB,
    vitals_breach_alert         BOOLEAN NOT NULL DEFAULT false,
    itemized_charges_total      NUMERIC(12,2) NOT NULL DEFAULT 0,
    breach_tier                 INTEGER NOT NULL DEFAULT 0,
    breach_triggered_at         TIMESTAMPTZ,
    breach_acknowledged         BOOLEAN NOT NULL DEFAULT false,
    breach_acknowledged_at      TIMESTAMPTZ,
    breach_acknowledged_by      TEXT,
    breach_intervention_log     TEXT,
    breach_escalation_history   JSONB,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinic_beds_slug ON clinic_beds (clinic_slug, bed_number);
CREATE INDEX IF NOT EXISTS idx_clinic_beds_admission ON clinic_beds (admission_id);

CREATE TABLE IF NOT EXISTS bed_admissions (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug         TEXT NOT NULL,
    bed_id              TEXT,
    bed_number          TEXT,
    patient_name        TEXT NOT NULL,
    patient_phone       TEXT,
    doctor_name         TEXT,
    admission_type      TEXT NOT NULL DEFAULT 'observation',
    admission_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    daily_rate          NUMERIC(12,2) NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'active',
    discharge_ordered_at TIMESTAMPTZ,
    doctor_signoff      BOOLEAN NOT NULL DEFAULT false,
    discharged_at       TIMESTAMPTZ,
    proration_type      TEXT,
    room_charge         NUMERIC(12,2),
    consumables_charge  NUMERIC(12,2),
    total_bill          NUMERIC(12,2),
    discharge_checklist JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bed_admissions_clinic ON bed_admissions (clinic_slug, admission_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bed_admissions_bed ON bed_admissions (bed_id);

CREATE TABLE IF NOT EXISTS bed_billing_ledger (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug     TEXT,
    admission_id    TEXT,
    bed_id          TEXT,
    bed_number      TEXT,
    charge_type     TEXT NOT NULL,
    description     TEXT NOT NULL,
    amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
    source_order_ref TEXT,
    posted_by       TEXT,
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bed_ledger_bed ON bed_billing_ledger (bed_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_bed_ledger_admission ON bed_billing_ledger (admission_id, posted_at DESC);

CREATE TABLE IF NOT EXISTS bed_billing_overrides (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug             TEXT,
    admission_id            TEXT,
    bed_id                  TEXT,
    bed_number              TEXT,
    supervisor_name         TEXT NOT NULL,
    supervisor_pin_verified BOOLEAN NOT NULL DEFAULT false,
    reason_code             TEXT,
    original_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    adjusted_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    adjustment_delta        NUMERIC(12,2) NOT NULL DEFAULT 0,
    waiver_notes            TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bed_overrides_bed ON bed_billing_overrides (bed_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bed_care_tasks (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug             TEXT,
    bed_id                  TEXT NOT NULL,
    admission_id            TEXT,
    task_type               TEXT NOT NULL,
    description             TEXT NOT NULL,
    due_time                TEXT,
    threshold_criteria      TEXT,
    assigned_to             TEXT,
    status                  TEXT NOT NULL DEFAULT 'pending',
    shift_carryover_count   INTEGER NOT NULL DEFAULT 0,
    carried_over_from_shift TEXT,
    carried_over_to_nurse   TEXT,
    completed_at            TIMESTAMPTZ,
    completed_by_esign      TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bed_tasks_bed ON bed_care_tasks (bed_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bed_tasks_status ON bed_care_tasks (status, created_at);

CREATE TABLE IF NOT EXISTS bed_sanitization_logs (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug         TEXT,
    bed_id              TEXT NOT NULL,
    bed_number          TEXT,
    hk_staff_name       TEXT,
    disinfection_method TEXT,
    hk_completed_at     TIMESTAMPTZ,
    nurse_qa_name       TEXT,
    nurse_qa_esign      TEXT,
    nurse_verified_at   TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'pending_qa',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bed_sanitization_bed ON bed_sanitization_logs (bed_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bed_shift_handovers (
    id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug                 TEXT,
    outgoing_nurse_name         TEXT,
    incoming_nurse_name         TEXT,
    shift_name                  TEXT NOT NULL,
    ward_id                     TEXT,
    carried_over_tasks_count    INTEGER NOT NULL DEFAULT 0,
    active_breach_alerts_count  INTEGER NOT NULL DEFAULT 0,
    handover_notes              TEXT,
    incoming_esign              TEXT,
    handed_over_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tasks_snapshot              JSONB,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bed_shift_handovers_clinic ON bed_shift_handovers (clinic_slug, handed_over_at DESC);

-- ---------------------------------------------------------------------------
-- 3. INSURANCE / TPA CLAIMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_claims (
    id                        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    claim_number              TEXT UNIQUE NOT NULL,
    clinic_slug               TEXT,
    patient_name              TEXT NOT NULL,
    patient_phone             TEXT,
    policy_number             TEXT,
    tpa_company               TEXT,
    procedure_code            TEXT,
    procedure_name            TEXT,
    package_rate_cap          NUMERIC(12,2),
    package_rate_overrun      NUMERIC(12,2),
    package_override_pin      TEXT,
    package_override_reason   TEXT,
    package_override_by       TEXT,
    bed_id                    TEXT,
    estimated_amount          NUMERIC(12,2),
    approved_amount           NUMERIC(12,2),
    status                    TEXT NOT NULL DEFAULT 'pre_auth_submitted',
    remarks                   TEXT,
    mandatory_docs_checklist  JSONB NOT NULL DEFAULT '{}'::jsonb,
    tpa_query_details         JSONB NOT NULL DEFAULT '{}'::jsonb,
    settlement_details        JSONB NOT NULL DEFAULT '{}'::jsonb,
    audit_trail               JSONB NOT NULL DEFAULT '[]'::jsonb,
    submission_date           TIMESTAMPTZ,
    approval_ref              TEXT,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_clinic ON insurance_claims (clinic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. DIAGNOSTIC LAB / LIS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnostic_lab_orders (
    id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug                 TEXT,
    order_number                TEXT UNIQUE NOT NULL,
    appointment_id              TEXT,
    prescription_id             TEXT,
    sample_barcode              TEXT,
    patient_name                TEXT NOT NULL,
    patient_phone               TEXT,
    patient_age                 INTEGER,
    patient_gender              TEXT,
    doctor_name                 TEXT,
    test_name                   TEXT NOT NULL,
    category                    TEXT,
    sample_type                 TEXT,
    vacutainer_tube             TEXT,
    fasting_required            BOOLEAN,
    tat_sla_minutes             INTEGER,
    status                      TEXT NOT NULL DEFAULT 'ordered',
    sample_collected_at         TIMESTAMPTZ,
    sample_collector_name       TEXT,
    sample_accessioned_at       TIMESTAMPTZ,
    sample_accessioner_name     TEXT,
    sample_rejected             BOOLEAN NOT NULL DEFAULT false,
    sample_rejection_reason     TEXT,
    results                     JSONB NOT NULL DEFAULT '[]'::jsonb,
    pathologist_notes           TEXT,
    analyzer_model              TEXT,
    import_protocol             TEXT,
    critical_value_alert        BOOLEAN NOT NULL DEFAULT false,
    critical_parameters         JSONB NOT NULL DEFAULT '[]'::jsonb,
    report_sha256               TEXT,
    qc_verified                 BOOLEAN NOT NULL DEFAULT false,
    verified_by                 TEXT,
    pathologist_reg_no          TEXT,
    verified_at                 TIMESTAMPTZ,
    doctor_notified_at          TIMESTAMPTZ,
    doctor_notified_name        TEXT,
    doctor_read_back_confirmed  BOOLEAN NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON diagnostic_lab_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_orders_appointment ON diagnostic_lab_orders (appointment_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_prescription ON diagnostic_lab_orders (prescription_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_barcode ON diagnostic_lab_orders (sample_barcode);

CREATE TABLE IF NOT EXISTS lis_critical_alert_logs (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id        TEXT,
    order_number    TEXT,
    patient_name    TEXT,
    doctor_name     TEXT,
    doctor_phone    TEXT,
    parameter_name  TEXT,
    critical_value  TEXT,
    reference_limit TEXT,
    channel         TEXT NOT NULL DEFAULT 'manual_log',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lis_alerts_order ON lis_critical_alert_logs (order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lis_quality_control_runs (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug         TEXT,
    analyzer_name       TEXT NOT NULL,
    test_category       TEXT NOT NULL,
    control_lot_number  TEXT,
    level               TEXT,
    target_mean         NUMERIC(12,4),
    target_sd           NUMERIC(12,4),
    measured_value      NUMERIC(12,4),
    z_score             NUMERIC(8,4),
    westgard_status     TEXT,
    calibrated_by       TEXT,
    run_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lis_qc_clinic ON lis_quality_control_runs (clinic_slug, run_at DESC);

-- ---------------------------------------------------------------------------
-- 5. PHARMACY OPERATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacy_return_challans (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    challan_number      TEXT UNIQUE NOT NULL,
    clinic_slug         TEXT NOT NULL,
    supplier_name       TEXT,
    batch_number        TEXT,
    brand_name          TEXT,
    quantity            INTEGER NOT NULL DEFAULT 0,
    unit_purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_debit_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'issued',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pharmacy_returns_clinic ON pharmacy_return_challans (clinic_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS pharmacy_stock_transfers (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug     TEXT,
    transfer_number TEXT UNIQUE NOT NULL,
    from_outlet     TEXT,
    to_outlet       TEXT,
    item_id         TEXT,
    brand_name      TEXT,
    batch_number    TEXT,
    quantity        INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'in_transit',
    dispatched_by   TEXT,
    received_by     TEXT,
    received_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_transfers_clinic ON pharmacy_stock_transfers (clinic_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS pharmacy_schedule_h1_logs (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    bill_number         TEXT,
    clinic_slug         TEXT NOT NULL,
    patient_name        TEXT,
    patient_phone       TEXT,
    patient_address     TEXT,
    doctor_name         TEXT,
    doctor_reg_number   TEXT,
    drug_name           TEXT NOT NULL,
    batch_number        TEXT,
    quantity            INTEGER NOT NULL DEFAULT 0,
    pharmacist_name     TEXT,
    dispensed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pharmacy_h1_clinic ON pharmacy_schedule_h1_logs (clinic_slug, dispensed_at DESC);

-- ---------------------------------------------------------------------------
-- 6. EMR / DPDP PATIENT RECORDS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emr_patients (
    id                              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    uhid                            TEXT UNIQUE NOT NULL,
    full_name                       TEXT NOT NULL,
    phone                           TEXT NOT NULL,
    dob                             DATE,
    age                             INTEGER,
    gender                          TEXT,
    blood_group                     TEXT,
    email                           TEXT,
    address                         TEXT,
    city                            TEXT,
    state                           TEXT,
    emergency_contact               TEXT,
    emergency_contact_relationship  TEXT,
    emergency_contact_phone         TEXT,
    emergency_contact_consent_status TEXT,
    emergency_contact_consent_date  TIMESTAMPTZ,
    emergency_contact_encrypted_hash TEXT,
    identity_hash                   TEXT,
    chronic_conditions              JSONB NOT NULL DEFAULT '[]'::jsonb,
    chronic_allergies               JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes                           TEXT,
    is_duplicate_flagged            BOOLEAN NOT NULL DEFAULT false,
    merged_into_uhid                TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_patients_phone ON emr_patients (phone);
CREATE INDEX IF NOT EXISTS idx_emr_patients_uhid ON emr_patients (uhid);

CREATE TABLE IF NOT EXISTS emr_allergies (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_uhid          TEXT NOT NULL,
    allergen_name         TEXT NOT NULL,
    atc_code              TEXT,
    reaction_severity     TEXT,
    reaction_description  TEXT,
    is_active             BOOLEAN NOT NULL DEFAULT true,
    logged_by             TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_allergies_uhid ON emr_allergies (patient_uhid, is_active);

CREATE TABLE IF NOT EXISTS emr_allergy_contraindications (
    id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_uhid                TEXT NOT NULL,
    prescribed_drug             TEXT NOT NULL,
    conflicting_allergy         TEXT,
    atc_code                    TEXT,
    action_taken                TEXT NOT NULL,
    override_reason_code        TEXT,
    override_reason_text        TEXT,
    override_doctor_name        TEXT,
    override_doctor_role        TEXT,
    override_doctor_nmc_reg     TEXT,
    nmc_status_verified         BOOLEAN NOT NULL DEFAULT false,
    persisted_to_pharmacy       BOOLEAN NOT NULL DEFAULT false,
    persisted_to_lis            BOOLEAN NOT NULL DEFAULT false,
    override_doctor_pin_verified BOOLEAN NOT NULL DEFAULT false,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_contra_uhid ON emr_allergy_contraindications (patient_uhid, created_at DESC);

CREATE TABLE IF NOT EXISTS emr_clinical_visits (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_uhid            TEXT NOT NULL,
    visit_number            TEXT NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    is_latest               BOOLEAN NOT NULL DEFAULT true,
    specialty_template      TEXT,
    visit_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    doctor_name             TEXT,
    doctor_specialization   TEXT,
    provisional_diagnosis   TEXT,
    vitals                  JSONB NOT NULL DEFAULT '{}'::jsonb,
    subjective_notes        TEXT,
    objective_findings      TEXT,
    assessment_plan         TEXT,
    prescribed_medications  JSONB NOT NULL DEFAULT '[]'::jsonb,
    amendment_reason        TEXT,
    amended_by              TEXT,
    tamper_seal_hash        TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_visits_uhid ON emr_clinical_visits (patient_uhid, visit_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_emr_visits_version ON emr_clinical_visits (patient_uhid, visit_number, version);

CREATE TABLE IF NOT EXISTS emr_audit_trail (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_uhid  TEXT NOT NULL,
    action_type   TEXT NOT NULL,
    user_name     TEXT,
    user_role     TEXT,
    details       JSONB,
    ip_address    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_audit_uhid ON emr_audit_trail (patient_uhid, created_at DESC);

CREATE TABLE IF NOT EXISTS emr_duplicate_merges (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    source_uhid           TEXT NOT NULL,
    target_uhid           TEXT NOT NULL,
    primary_phone         TEXT,
    similarity_score      NUMERIC(5,2),
    status                TEXT NOT NULL DEFAULT 'PENDING_DUAL_ADMIN',
    approver_1            TEXT,
    approver_2            TEXT,
    reconciliation_notes  TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_merges_source ON emr_duplicate_merges (source_uhid);
CREATE INDEX IF NOT EXISTS idx_emr_merges_target ON emr_duplicate_merges (target_uhid);

CREATE TABLE IF NOT EXISTS emr_lab_vault (
    id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_uhid      TEXT NOT NULL,
    test_name         TEXT NOT NULL,
    parameter_name    TEXT NOT NULL,
    parameter_value   NUMERIC(14,4),
    unit              TEXT,
    reference_min     NUMERIC(14,4),
    reference_max     NUMERIC(14,4),
    flag              TEXT,
    report_date       DATE,
    lab_source        TEXT,
    raw_document_url  TEXT,
    ocr_confidence    NUMERIC(5,2),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_lab_uhid ON emr_lab_vault (patient_uhid, report_date DESC);

CREATE TABLE IF NOT EXISTS emr_secure_exports (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    patient_uhid          TEXT NOT NULL,
    export_type           TEXT NOT NULL,
    recipient_name        TEXT,
    recipient_id          TEXT,
    patient_otp_verified  BOOLEAN NOT NULL DEFAULT false,
    otp_session_id        TEXT,
    watermark_text        TEXT,
    expiry_hours          INTEGER,
    expires_at            TIMESTAMPTZ,
    tamper_seal_hash      TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_emr_exports_uhid ON emr_secure_exports (patient_uhid, created_at DESC);

-- ---------------------------------------------------------------------------
-- 7. CLINIC CASH / AUTOMATIONS / SHIFT SETTLEMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clinic_petty_cash_float (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug           TEXT NOT NULL UNIQUE,
    target_float          NUMERIC(12,2) NOT NULL DEFAULT 0,
    current_balance       NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_threshold         NUMERIC(12,2) NOT NULL DEFAULT 800,
    last_replenished_at   TIMESTAMPTZ,
    last_replenished_by   TEXT,
    status                TEXT NOT NULL DEFAULT 'DEPLETED',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_petty_cash_ledger (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug         TEXT NOT NULL,
    entry_type          TEXT NOT NULL,
    amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
    running_balance     NUMERIC(12,2) NOT NULL DEFAULT 0,
    source_or_recipient TEXT,
    voucher_id          TEXT,
    recorded_by         TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_petty_ledger_clinic ON clinic_petty_cash_ledger (clinic_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS clinic_sent_automations (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id           TEXT NOT NULL,
    clinic_slug         TEXT NOT NULL,
    appointment_number  TEXT,
    patient_name        TEXT,
    patient_phone       TEXT NOT NULL,
    trigger_type        TEXT NOT NULL,
    message_text        TEXT NOT NULL,
    whatsapp_url        TEXT,
    sent_by             TEXT NOT NULL,
    sent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_csa_clinic ON clinic_sent_automations (clinic_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS settlements (
    id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    settlement_number     TEXT UNIQUE NOT NULL,
    clinic_slug           TEXT NOT NULL,
    shift_name            TEXT,
    shift_date            DATE NOT NULL DEFAULT CURRENT_DATE,
    staff_name            TEXT,
    doctor_name           TEXT,
    total_patients        INTEGER NOT NULL DEFAULT 0,
    gross_collections     NUMERIC(12,2) NOT NULL DEFAULT 0,
    upi_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
    cash_expected         NUMERIC(12,2) NOT NULL DEFAULT 0,
    petty_cash_expenses   NUMERIC(12,2) NOT NULL DEFAULT 0,
    petty_cash_remarks    TEXT,
    net_cash_expected     NUMERIC(12,2) NOT NULL DEFAULT 0,
    actual_cash_counted   NUMERIC(12,2) NOT NULL DEFAULT 0,
    discrepancy           NUMERIC(12,2) NOT NULL DEFAULT 0,
    denominations         JSONB,
    notes                 TEXT,
    status                TEXT NOT NULL DEFAULT 'SETTLED',
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settlements_clinic ON settlements (clinic_slug, shift_date DESC);

-- ---------------------------------------------------------------------------
-- 8. BASELINE TABLE COLUMN RECONCILIATION
--    (columns the API reads/writes that 001 did not declare)
-- ---------------------------------------------------------------------------
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT;

ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS clinic_slug TEXT;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS brand_name TEXT;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2);
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS mrp NUMERIC(12,2);
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS selling_price NUMERIC(12,2);
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2);
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS supplier_return_window_days INTEGER;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS recall_reason TEXT;
ALTER TABLE pharmacy_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- The legacy columns were NOT NULL but the API no longer writes them.
ALTER TABLE pharmacy_items ALTER COLUMN medicine_name DROP NOT NULL;
ALTER TABLE pharmacy_items ALTER COLUMN generic_name DROP NOT NULL;
ALTER TABLE pharmacy_items ALTER COLUMN mrp_inr DROP NOT NULL;
ALTER TABLE pharmacy_items ALTER COLUMN purchase_price_inr DROP NOT NULL;

ALTER TABLE pharmacy_dispenses ADD COLUMN IF NOT EXISTS clinic_slug TEXT;
ALTER TABLE pharmacy_dispenses ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE pharmacy_dispenses ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE pharmacy_dispenses ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE pharmacy_dispenses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'dispensed';
ALTER TABLE pharmacy_dispenses ALTER COLUMN patient_phone DROP NOT NULL;
ALTER TABLE pharmacy_dispenses ALTER COLUMN net_paid DROP NOT NULL;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ocr_scanned_amt NUMERIC(12,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ocr_vendor TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS duplicate_flag BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS counted_cash NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS cash_discrepancy NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS gross_collections NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS soundbox_upi NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS total_consultations INTEGER NOT NULL DEFAULT 0;
ALTER TABLE clinic_eod_closings ADD COLUMN IF NOT EXISTS closing_notes TEXT;

ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS next_cashier_name TEXT;
ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS cash_inflow NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS cash_expenses NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS variance_pct NUMERIC(8,2);
ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS variance_reason TEXT;
ALTER TABLE clinic_shift_handovers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE clinic_shift_handovers ALTER COLUMN staff_name DROP NOT NULL;
ALTER TABLE clinic_shift_handovers ALTER COLUMN clinic_slug SET DEFAULT 'derma-care-dehradun';

-- Backfill the new pharmacy columns from the legacy baseline columns.
UPDATE pharmacy_items SET brand_name = COALESCE(brand_name, medicine_name) WHERE brand_name IS NULL;
UPDATE pharmacy_items SET purchase_price = COALESCE(purchase_price, purchase_price_inr) WHERE purchase_price IS NULL;
UPDATE pharmacy_items SET mrp = COALESCE(mrp, mrp_inr) WHERE mrp IS NULL;
UPDATE pharmacy_items SET selling_price = COALESCE(selling_price, mrp, mrp_inr) WHERE selling_price IS NULL;

-- Helpful indexes for tenant-scoped reads.
CREATE INDEX IF NOT EXISTS idx_appointments_source ON appointments (source);
CREATE INDEX IF NOT EXISTS idx_pharmacy_items_clinic_slug ON pharmacy_items (clinic_slug);
CREATE INDEX IF NOT EXISTS idx_pharmacy_dispenses_clinic_slug ON pharmacy_dispenses (clinic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_slug ON expenses (clinic_slug, date DESC);
CREATE INDEX IF NOT EXISTS idx_eod_clinic_slug ON clinic_eod_closings (clinic_slug, closing_date DESC);
