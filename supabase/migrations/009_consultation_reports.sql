-- ─────────────────────────────────────────────────────────────────────────────
-- 009 · AI Consultation Reports
--
-- One row per recorded consultation. Holds the raw transcript (for the doctor's
-- audit trail) plus two generated documents:
--
--   doctor_report   clinical language — assessment, differentials, red flags
--   patient_report  plain language    — what the patient should do at home
--
-- Reports are drafts until a clinician approves them. Only approved reports are
-- visible in the patient's vault.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_number TEXT,
    patient_phone TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    doctor_slug TEXT,
    doctor_name TEXT,

    -- Recording metadata. The audio itself is never stored: it is streamed to
    -- the transcription provider and discarded.
    language TEXT NOT NULL DEFAULT 'auto',
    duration_seconds INTEGER,
    transcript TEXT NOT NULL DEFAULT '',

    -- Extracted clinical facts
    chief_complaints TEXT,
    provisional_diagnosis TEXT,
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb,
    lab_tests JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Generated documents
    doctor_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    patient_report JSONB NOT NULL DEFAULT '{}'::jsonb,

    status TEXT NOT NULL DEFAULT 'draft', -- draft | approved
    approved_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT consultation_reports_status_check
        CHECK (status IN ('draft', 'approved'))
);

CREATE INDEX IF NOT EXISTS idx_consultation_reports_clinic
    ON consultation_reports(clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_reports_phone
    ON consultation_reports(patient_phone, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_reports_appointment
    ON consultation_reports(appointment_number);
