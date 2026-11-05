-- ============================================================================
-- 007 — INSURANCE CLAIM TENANT SCOPING
-- Insurance claims are not stored with a clinic key. They inherit their tenant
-- from the inpatient bed they are opened against, so add the key and backfill
-- it. Claims with no bed stay un-scoped and are therefore invisible to any
-- clinic (never visible to all clinics). Idempotent.
-- ============================================================================

ALTER TABLE insurance_claims
    ADD COLUMN IF NOT EXISTS clinic_slug VARCHAR(255);

UPDATE insurance_claims c
SET clinic_slug = b.clinic_slug
FROM clinic_beds b
WHERE c.clinic_slug IS NULL
  AND c.bed_id IS NOT NULL
  AND b.id::text = c.bed_id::text;

CREATE INDEX IF NOT EXISTS idx_insurance_claims_clinic
    ON insurance_claims (clinic_slug, created_at DESC);
