-- ============================================================================
-- 004 — FINANCIAL CORRECTNESS: COMPENSATION CONTRACTS + APPEND-ONLY LEDGER
-- Replaces index-based payout heuristics with explicit contracts and a ledger
-- computed from facts (appointments, pharmacy, refunds, approved expenses).
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_compensation_contracts (
    id                TEXT PRIMARY KEY,
    doctor_id         TEXT NOT NULL,
    clinic_id         TEXT NOT NULL,
    split_pct         NUMERIC(5,2) NOT NULL DEFAULT 100,
    consumables_policy TEXT NOT NULL DEFAULT 'deduct_actual',
    fixed_fee_inr     NUMERIC(12,2),
    effective_from    DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to      DATE,
    created_by        TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT doctor_compensation_split_chk CHECK (split_pct >= 0 AND split_pct <= 100)
);
CREATE INDEX IF NOT EXISTS idx_comp_contracts_doctor ON doctor_compensation_contracts (doctor_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_comp_contracts_clinic ON doctor_compensation_contracts (clinic_id, effective_from DESC);

CREATE TABLE IF NOT EXISTS payout_ledger (
    id             TEXT PRIMARY KEY,
    clinic_id      TEXT NOT NULL,
    doctor_id      TEXT NOT NULL,
    period_start   DATE NOT NULL,
    period_end     DATE NOT NULL,
    gross_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions     NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    split_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'pending_approval', 'approved', 'paid', 'void')),
    computed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_by    TEXT,
    approved_at    TIMESTAMPTZ,
    paid_at        TIMESTAMPTZ,
    notes          TEXT,
    UNIQUE (clinic_id, doctor_id, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_doctor ON payout_ledger (doctor_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_payout_ledger_clinic ON payout_ledger (clinic_id, period_start DESC);

-- Immutable receipt numbering per clinic (no gaps, race-safe via a counter row).
CREATE TABLE IF NOT EXISTS invoice_sequences (
    clinic_id      TEXT PRIMARY KEY,
    prefix         TEXT NOT NULL DEFAULT 'INV',
    next_number    INTEGER NOT NULL DEFAULT 1,
    financial_year TEXT,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
    id             TEXT PRIMARY KEY,
    clinic_id      TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    patient_phone  TEXT,
    appointment_id TEXT,
    subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'issued'
                   CHECK (status IN ('draft', 'issued', 'paid', 'void', 'credit_note')),
    issued_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by     TEXT,
    UNIQUE (clinic_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices (clinic_id, issued_at DESC);

-- Seed an explicit 100% contract for existing doctors so no payout is inferred
-- from array position. Clinics can override via the admin UI.
INSERT INTO doctor_compensation_contracts (id, doctor_id, clinic_id, split_pct, created_by)
SELECT
    'cc-' || d.id,
    d.id,
    COALESCE(d.clinic_id, ''),
    100,
    'migration-004'
FROM doctors d
WHERE d.clinic_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM doctor_compensation_contracts c WHERE c.doctor_id = d.id
  );
