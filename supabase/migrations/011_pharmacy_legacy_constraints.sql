-- ============================================================================
-- 011 — PHARMACY LEGACY CONSTRAINT RECONCILIATION
--
-- `pharmacy_items.clinic_id` was declared NOT NULL by the baseline, but every
-- pharmacy API route scopes stock by `clinic_slug` and does not write a legacy
-- clinic UUID. Drop the stale constraint so inserts succeed, and backfill the
-- UUID for any pre-existing rows that can be matched by slug.
-- Idempotent.
-- ============================================================================

ALTER TABLE pharmacy_items ALTER COLUMN clinic_id DROP NOT NULL;

UPDATE pharmacy_items i
SET clinic_id = c.id
FROM clinics c
WHERE i.clinic_id IS NULL
  AND i.clinic_slug = c.slug;

CREATE INDEX IF NOT EXISTS idx_pharmacy_items_clinic ON pharmacy_items (clinic_id);
