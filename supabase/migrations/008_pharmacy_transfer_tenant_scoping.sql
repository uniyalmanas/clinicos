-- ============================================================================
-- 008 — PHARMACY TRANSFER TENANT SCOPING
-- Inter-branch stock transfers belong to the clinic that owns the source
-- dispensary. Without a clinic key every tenant would see every transfer.
-- Idempotent.
-- ============================================================================

ALTER TABLE pharmacy_stock_transfers
    ADD COLUMN IF NOT EXISTS clinic_slug VARCHAR(255);

-- Backfill from the source item where it still exists.
UPDATE pharmacy_stock_transfers t
SET clinic_slug = i.clinic_slug
FROM pharmacy_items i
WHERE t.clinic_slug IS NULL
  AND t.item_id IS NOT NULL
  AND i.id::text = t.item_id::text;

CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_transfers_clinic
    ON pharmacy_stock_transfers (clinic_slug, created_at DESC);
