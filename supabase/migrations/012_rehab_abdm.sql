-- ============================================================================
-- 012 — PHYSIOTHERAPY REHABILITATION & ABDM / ABHA GATEWAY
--
-- Restores the two clinical modules that the UI and README expose but that were
-- dropped from the schema. Every table is clinic-scoped so the API routes can
-- enforce tenant isolation.
-- Idempotent.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. PHYSIOTHERAPY & REHABILITATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS therapy_plans (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id               TEXT,
    clinic_slug             TEXT NOT NULL,
    patient_name            TEXT NOT NULL,
    patient_phone           TEXT NOT NULL,
    patient_uhid            TEXT,
    referring_doctor        TEXT,
    therapist_name          TEXT,
    approved_by             TEXT,
    modification_status     TEXT NOT NULL DEFAULT 'approved',
    current_version         TEXT NOT NULL DEFAULT '1.0',
    consecutive_pain_spikes INTEGER NOT NULL DEFAULT 0,
    doctor_escalated        BOOLEAN NOT NULL DEFAULT false,
    doctor_escalation_reason TEXT,
    condition_diagnosed     TEXT NOT NULL,
    target_sessions         INTEGER NOT NULL DEFAULT 10,
    completed_sessions      INTEGER NOT NULL DEFAULT 0,
    start_date              DATE NOT NULL DEFAULT CURRENT_DATE,
    review_date             DATE,
    end_date                DATE,
    status                  TEXT NOT NULL DEFAULT 'active',
    goals                   TEXT,
    target_joint            TEXT,
    movement_plane          TEXT,
    baseline_rom            NUMERIC(6,2),
    target_rom              NUMERIC(6,2),
    current_rom             NUMERIC(6,2),
    baseline_vas            NUMERIC(4,1),
    target_vas              NUMERIC(4,1),
    current_vas             NUMERIC(4,1),
    stagnation_alert        BOOLEAN NOT NULL DEFAULT false,
    pain_escalation_alert   BOOLEAN NOT NULL DEFAULT false,
    prescribed_exercises    JSONB NOT NULL DEFAULT '[]'::jsonb,
    version_history         JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_therapy_plans_clinic ON therapy_plans (clinic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_therapy_plans_phone ON therapy_plans (patient_phone);

CREATE TABLE IF NOT EXISTS therapy_sessions (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_slug         TEXT NOT NULL,
    plan_id             TEXT NOT NULL REFERENCES therapy_plans(id) ON DELETE CASCADE,
    session_number      INTEGER NOT NULL DEFAULT 1,
    session_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pain_score_before   INTEGER,
    pain_score_after    INTEGER,
    rom_joint           TEXT,
    rom_plane           TEXT,
    rom_degrees         NUMERIC(6,2),
    rom_method          TEXT,
    rom_laterality      TEXT,
    range_of_motion     TEXT,
    modality_applied    TEXT,
    tolerance_rating    TEXT,
    exercises_performed JSONB NOT NULL DEFAULT '[]'::jsonb,
    homework_assigned   JSONB NOT NULL DEFAULT '[]'::jsonb,
    escalation_flag     BOOLEAN NOT NULL DEFAULT false,
    escalation_note     TEXT,
    therapist_notes     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_plan ON therapy_sessions (plan_id, session_number);
CREATE INDEX IF NOT EXISTS idx_therapy_sessions_clinic ON therapy_sessions (clinic_slug, session_date DESC);

-- ---------------------------------------------------------------------------
-- 2. ABDM / ABHA REGISTRY, CONSENT AND GATEWAY AUDIT
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS abdm_patients (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id           TEXT,
    clinic_slug         TEXT NOT NULL,
    abha_number         TEXT NOT NULL,
    abha_address        TEXT,
    patient_name        TEXT NOT NULL,
    patient_phone       TEXT NOT NULL,
    masked_aadhaar      TEXT,
    vid_reference       TEXT,
    kyc_status          TEXT NOT NULL DEFAULT 'VERIFIED',
    demographic_conflict BOOLEAN NOT NULL DEFAULT false,
    conflict_details    TEXT,
    nha_sync_attempts   INTEGER NOT NULL DEFAULT 0,
    gateway_mode        TEXT NOT NULL DEFAULT 'SANDBOX_M1_M2',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abdm_patients_clinic ON abdm_patients (clinic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abdm_patients_phone ON abdm_patients (patient_phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_abdm_patients_abha ON abdm_patients (clinic_slug, abha_number);

CREATE TABLE IF NOT EXISTS abdm_consent_artefacts (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id           TEXT,
    clinic_slug         TEXT NOT NULL,
    consent_request_id  TEXT UNIQUE NOT NULL,
    consent_artefact_id TEXT,
    patient_name        TEXT NOT NULL,
    patient_phone       TEXT,
    abha_number         TEXT NOT NULL,
    abha_address        TEXT,
    hiu_name            TEXT,
    purpose_code        TEXT NOT NULL,
    purpose_label       TEXT,
    date_range_from     DATE,
    date_range_to       DATE,
    expiry_timestamp    TIMESTAMPTZ,
    status              TEXT NOT NULL DEFAULT 'REQUESTED',
    ca_token_hash       TEXT,
    otp_verified_at     TIMESTAMPTZ,
    revoked_at          TIMESTAMPTZ,
    revoked_by          TEXT,
    access_count        INTEGER NOT NULL DEFAULT 0,
    last_accessed_at    TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abdm_consent_clinic ON abdm_consent_artefacts (clinic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abdm_consent_status ON abdm_consent_artefacts (status);

CREATE TABLE IF NOT EXISTS abdm_gateway_logs (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_id       TEXT,
    clinic_slug     TEXT,
    transaction_id  TEXT,
    endpoint        TEXT NOT NULL,
    method          TEXT NOT NULL DEFAULT 'POST',
    status_code     INTEGER,
    latency_ms      INTEGER,
    payload_summary JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_abdm_logs_clinic ON abdm_gateway_logs (clinic_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_abdm_logs_txn ON abdm_gateway_logs (transaction_id);
