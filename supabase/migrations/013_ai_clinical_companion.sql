-- ─────────────────────────────────────────────────────────────────────────────
-- 013 · AI Clinical Companion Schema
--
-- Supports:
--   1. consultation_sessions: Real-time consultation sessions with DPDP consent
--   2. transcript_turns: Structured speaker turns with attribution provenance
--   3. clinical_facts: Extracted clinical memory with source references
--   4. fact_source_references: Traceability from extracted facts to transcript turns
--   5. companion_interactions: Doctor Q&A audit trail and provenance sources
--   6. clinical_audit_events: Tamper-evident clinical compliance events
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consultation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_phone TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_uhid TEXT,
    doctor_slug TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, paused, finalized, cancelled
    consent_obtained BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    language TEXT NOT NULL DEFAULT 'english', -- english, hindi, hinglish
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT consultation_sessions_status_check
        CHECK (status IN ('active', 'paused', 'finalized', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_clinic
    ON consultation_sessions(clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_sessions_patient
    ON consultation_sessions(patient_phone, status);

CREATE TABLE IF NOT EXISTS transcript_turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    turn_index INTEGER NOT NULL,
    speaker TEXT NOT NULL DEFAULT 'uncertain', -- doctor, patient, uncertain
    speaker_confidence NUMERIC(3,2) DEFAULT 0.50,
    speaker_manually_corrected BOOLEAN NOT NULL DEFAULT FALSE,
    transcript_text TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'english',
    provider_event_id TEXT,
    started_at_ms INTEGER NOT NULL DEFAULT 0,
    ended_at_ms INTEGER NOT NULL DEFAULT 0,
    processing_status TEXT NOT NULL DEFAULT 'completed', -- pending, processing, completed, error
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcript_turns_consultation
    ON transcript_turns(consultation_id, turn_index ASC);

CREATE TABLE IF NOT EXISTS clinical_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- chief_complaint, symptom, medical_history, allergy, medication, vital, examination, assessment, investigation, treatment_plan, follow_up, missing_info, uncertain_info
    fact_key TEXT NOT NULL,
    fact_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'unconfirmed', -- unconfirmed, doctor_confirmed, corrected, uncertain
    confidence NUMERIC(3,2) DEFAULT 0.85,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT clinical_facts_status_check
        CHECK (status IN ('unconfirmed', 'doctor_confirmed', 'corrected', 'uncertain'))
);

CREATE INDEX IF NOT EXISTS idx_clinical_facts_consultation
    ON clinical_facts(consultation_id, category);

CREATE TABLE IF NOT EXISTS fact_source_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fact_id UUID NOT NULL REFERENCES clinical_facts(id) ON DELETE CASCADE,
    turn_id UUID NOT NULL REFERENCES transcript_turns(id) ON DELETE CASCADE,
    exact_quote TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fact_source_refs_fact
    ON fact_source_references(fact_id);

CREATE TABLE IF NOT EXISTS companion_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    query_type TEXT NOT NULL DEFAULT 'doctor_question', -- doctor_question, proactive_alert, documentation_draft
    doctor_query TEXT NOT NULL,
    companion_response TEXT NOT NULL,
    provenance_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companion_interactions_consultation
    ON companion_interactions(consultation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS clinical_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES consultation_sessions(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    actor_type TEXT NOT NULL DEFAULT 'doctor',
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL, -- consent_given, audio_started, audio_paused, audio_stopped, speaker_corrected, fact_confirmed, fact_edited, report_generated, report_approved
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_events_consultation
    ON clinical_audit_events(consultation_id, created_at DESC);

-- Link consultation_reports to consultation_sessions if column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultation_reports' AND column_name = 'session_id'
    ) THEN
        ALTER TABLE consultation_reports 
        ADD COLUMN session_id UUID REFERENCES consultation_sessions(id) ON DELETE SET NULL;
    END IF;
END $$;
