-- ============================================================================
-- 003 — SECURITY FOUNDATION, PATIENT IDENTITY, LIVE-SCHEMA RECONCILIATION
-- Idempotent. Safe to run against the existing production database.
--
-- This migration supersedes 002_organizations_practice_plans.sql (never applied
-- to production). All identifiers in this database are TEXT/VARCHAR — never
-- cast to uuid.
-- ============================================================================

-- ── 1. Audit trail (append-only) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_events (
    id          TEXT PRIMARY KEY,
    actor_id    TEXT,
    actor_role  TEXT,
    clinic_id   TEXT,
    action      TEXT NOT NULL,
    entity      TEXT,
    entity_id   TEXT,
    before      JSONB,
    after       JSONB,
    ip          TEXT,
    user_agent  TEXT,
    request_id  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON audit_events (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_clinic  ON audit_events (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON audit_events (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_events (action, created_at DESC);

-- ── 2. Rate limiting (fixed window, atomic upsert in rate-limit.ts) ─────────
CREATE TABLE IF NOT EXISTS rate_limits (
    key           TEXT PRIMARY KEY,
    window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
    count         INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);

-- ── 3. Session revocation ──────────────────────────────────────────────────
ALTER TABLE user_accounts ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- ── 4. Patient identity: OTP challenges + sessions ─────────────────────────
CREATE TABLE IF NOT EXISTS patient_otp_challenges (
    id           TEXT PRIMARY KEY,
    phone        TEXT NOT NULL,
    otp_hash     TEXT NOT NULL,
    attempts     INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON patient_otp_challenges (phone, created_at DESC);

CREATE TABLE IF NOT EXISTS patient_sessions (
    id          TEXT PRIMARY KEY,
    phone       TEXT NOT NULL,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    user_agent  TEXT,
    ip          TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_sessions_phone ON patient_sessions (phone, created_at DESC);

-- ── 5. DPDP consent capture ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_consents (
    id          TEXT PRIMARY KEY,
    phone       TEXT NOT NULL,
    purpose     TEXT NOT NULL,
    granted     BOOLEAN NOT NULL DEFAULT true,
    source      TEXT,
    granted_at  TIMESTAMPTZ,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patient_consents_phone ON patient_consents (phone, created_at DESC);

-- ── 6. Data-subject requests (DPDP access / erasure) ───────────────────────
CREATE TABLE IF NOT EXISTS patient_data_requests (
    id          TEXT PRIMARY KEY,
    phone       TEXT NOT NULL,
    kind        TEXT NOT NULL CHECK (kind IN ('export', 'erasure')),
    status      TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    notes       TEXT
);
CREATE INDEX IF NOT EXISTS idx_patient_data_requests_phone ON patient_data_requests (phone, requested_at DESC);

-- ── 7. Live-schema reconciliation ──────────────────────────────────────────
-- organizations (from the abandoned 002) with TEXT identifiers to match live.
CREATE TABLE IF NOT EXISTS organizations (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    slug                TEXT UNIQUE,
    practice_type       TEXT NOT NULL DEFAULT 'solo',
    plan_type           TEXT NOT NULL DEFAULT 'solo_practice',
    plan_price_inr      INTEGER,
    max_doctors         INTEGER DEFAULT 1,
    subscription_status TEXT DEFAULT 'active',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS practice_type TEXT NOT NULL DEFAULT 'solo';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reg_number TEXT;

CREATE INDEX IF NOT EXISTS idx_clinics_org ON clinics (organization_id);
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics (slug);

-- reviews: live column is is_verified_visit
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_visit BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS doctor_reply TEXT;

-- patient documents: storage metadata
ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT true;

-- appointments: lookup + queue indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_phone ON appointments (patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments (doctor_slug, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments (clinic_id, appointment_date);

-- prescriptions: patient lookup
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_phone ON prescriptions (patient_phone);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic ON prescriptions (clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions (prescription_number);

-- membership lookups used on every guarded request
CREATE INDEX IF NOT EXISTS idx_memberships_user_active ON clinic_memberships (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_memberships_clinic_active ON clinic_memberships (clinic_id, is_active);

-- expenses tenant scoping
CREATE INDEX IF NOT EXISTS idx_expenses_clinic_slug ON expenses (clinic_slug);

-- ── 8. Backfill is_verified_visit from the old column when present ─────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reviews' AND column_name = 'verified_patient'
    ) THEN
        EXECUTE 'UPDATE reviews SET is_verified_visit = COALESCE(verified_patient, false)
                 WHERE is_verified_visit IS DISTINCT FROM COALESCE(verified_patient, false)';
    END IF;
END $$;
