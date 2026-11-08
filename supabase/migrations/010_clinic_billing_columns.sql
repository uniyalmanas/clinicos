-- ============================================================================
-- 010 — CLINIC BILLING / SUBSCRIPTION COLUMNS
-- Columns read by the public check-in flow and the superadmin console.
-- Idempotent.
-- ============================================================================

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS consultation_fee_default NUMERIC(10,2) DEFAULT 600.00;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Keep the default in sync with the clinic's current consultation fee.
UPDATE clinics
SET consultation_fee_default = COALESCE(consultation_fee_default, consultation_fee, 600.00)
WHERE consultation_fee_default IS NULL;
