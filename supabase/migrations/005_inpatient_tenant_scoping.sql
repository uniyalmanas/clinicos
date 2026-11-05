-- ============================================================================
-- 005 — INPATIENT TENANT SCOPING
-- Adds a clinic_slug to shift handover records so every inpatient read and
-- write can be constrained to the caller's clinic. Idempotent.
-- ============================================================================

ALTER TABLE bed_shift_handovers
    ADD COLUMN IF NOT EXISTS clinic_slug VARCHAR(255);

-- Backfill from the ward the handover refers to.
UPDATE bed_shift_handovers h
SET clinic_slug = w.clinic_slug
FROM clinic_wards w
WHERE h.clinic_slug IS NULL
  AND h.ward_id IS NOT NULL
  AND w.id::text = h.ward_id::text;

-- Backfill from the beds referenced in the snapshot when the ward is absent.
UPDATE bed_shift_handovers h
SET clinic_slug = b.clinic_slug
FROM clinic_beds b
WHERE h.clinic_slug IS NULL
  AND h.tasks_snapshot IS NOT NULL
  AND b.id::text IN (
      SELECT (task->>'bed_id')
      FROM jsonb_array_elements(h.tasks_snapshot::jsonb) AS task
  );

CREATE INDEX IF NOT EXISTS idx_bed_shift_handovers_clinic
    ON bed_shift_handovers (clinic_slug, handed_over_at DESC);
