-- ─────────────────────────────────────────────────────────────────────────────
-- 014 · Verification Status on Clinical Facts
--
-- Supports:
--   Explicit physician verification lifecycle on extracted clinical facts.
--   Prevents AI hallucinations from being treated as authoritative medical facts.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE clinical_facts
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
  CHECK (verification_status IN ('UNVERIFIED', 'DOCTOR_VERIFIED', 'CONFLICTING', 'SUPERSEDED'));

COMMENT ON COLUMN clinical_facts.verification_status IS
  'UNVERIFIED: AI-extracted, not reviewed. DOCTOR_VERIFIED: physician confirmed. CONFLICTING: contradicts another fact. SUPERSEDED: replaced by newer fact.';

CREATE INDEX IF NOT EXISTS idx_clinical_facts_verification
  ON clinical_facts(consultation_id, verification_status);
