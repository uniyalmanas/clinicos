-- ─────────────────────────────────────────────────────────────────────────────
-- 015 · Patient Memory Engine: Longitudinal Clinical Memory & Provenance
--
-- Supports:
--   1. clinical_sources: Documented sources (encounters, imports, lab reports)
--   2. clinical_facts: Elevated from session-scoped to longitudinal patient-scoped
--   3. clinical_fact_versions: Immutable audit trail for fact corrections
--   4. clinical_fact_relations: Semantic links between facts (causation, supersession)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Clinical Sources
CREATE TABLE IF NOT EXISTS clinical_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES consultation_sessions(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL, -- DOCTOR_OBSERVED, PATIENT_REPORTED, AI_EXTRACTED, IMPORTED_RECORD, LAB_RESULT, IMAGING
    source_title TEXT NOT NULL,
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT clinical_sources_type_check
        CHECK (source_type IN (
            'DOCTOR_OBSERVED',
            'PATIENT_REPORTED',
            'AI_EXTRACTED',
            'IMPORTED_RECORD',
            'LAB_RESULT',
            'IMAGING'
        ))
);

CREATE INDEX IF NOT EXISTS idx_clinical_sources_patient
    ON clinical_sources(clinic_id, patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clinical_sources_encounter
    ON clinical_sources(encounter_id);

-- 2. Elevate clinical_facts to Patient-Scoped
ALTER TABLE clinical_facts
    ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES clinical_sources(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS code_system TEXT, -- ICD-10, SNOMED-CT, RxNorm, LOINC
    ADD COLUMN IF NOT EXISTS clinical_code TEXT,
    ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS extracted_by TEXT DEFAULT 'ai_ambient_companion',
    ADD COLUMN IF NOT EXISTS verified_by TEXT,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Backfill clinic_id and patient_id on existing clinical_facts from consultation_sessions
UPDATE clinical_facts cf
SET 
    clinic_id = cs.clinic_id,
    patient_id = cs.patient_id
FROM consultation_sessions cs
WHERE cf.consultation_id = cs.id
  AND (cf.clinic_id IS NULL OR cf.patient_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_clinical_facts_patient_memory
    ON clinical_facts(clinic_id, patient_id, category, verification_status);

CREATE INDEX IF NOT EXISTS idx_clinical_facts_timeline
    ON clinical_facts(patient_id, observed_at DESC);

-- 3. Clinical Fact Versions (Audit & History)
CREATE TABLE IF NOT EXISTS clinical_fact_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fact_id UUID NOT NULL REFERENCES clinical_facts(id) ON DELETE CASCADE,
    version_index INTEGER NOT NULL DEFAULT 1,
    previous_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    new_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_status TEXT,
    new_status TEXT,
    previous_verification_status TEXT,
    new_verification_status TEXT,
    changed_by TEXT NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_fact_versions_fact
    ON clinical_fact_versions(fact_id, version_index DESC);

-- 4. Clinical Fact Relations (Semantic Linking)
CREATE TABLE IF NOT EXISTS clinical_fact_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_fact_id UUID NOT NULL REFERENCES clinical_facts(id) ON DELETE CASCADE,
    target_fact_id UUID NOT NULL REFERENCES clinical_facts(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL, -- CAUSES, TREATS, CONTRADICTS, SUPERSEDES, EVIDENCE_FOR
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT clinical_fact_relations_type_check
        CHECK (relation_type IN ('CAUSES', 'TREATS', 'CONTRADICTS', 'SUPERSEDES', 'EVIDENCE_FOR'))
);

CREATE INDEX IF NOT EXISTS idx_clinical_fact_relations_source
    ON clinical_fact_relations(source_fact_id);

CREATE INDEX IF NOT EXISTS idx_clinical_fact_relations_target
    ON clinical_fact_relations(target_fact_id);
