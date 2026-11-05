-- ============================================================================
-- 006 — LAB QUALITY CONTROL TENANT SCOPING
-- QC runs are per-analyzer and per-clinic; without a clinic key every clinic
-- would see every other clinic's runs. Idempotent.
-- ============================================================================

ALTER TABLE lis_quality_control_runs
    ADD COLUMN IF NOT EXISTS clinic_slug VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_lis_qc_clinic
    ON lis_quality_control_runs (clinic_slug, run_at DESC);
