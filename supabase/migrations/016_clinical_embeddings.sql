-- ─────────────────────────────────────────────────────────────────────────────
-- 016 · Clinical Embeddings: pgvector Semantic Search for Patient Memory
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS clinical_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fact_id UUID NOT NULL REFERENCES clinical_facts(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    embedding VECTOR(1536),
    model_name TEXT NOT NULL DEFAULT 'nomic-embed-text',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_embeddings_patient
    ON clinical_embeddings(clinic_id, patient_id);

CREATE INDEX IF NOT EXISTS idx_clinical_embeddings_cosine
    ON clinical_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
