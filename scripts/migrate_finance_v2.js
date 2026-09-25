const postgres = require('postgres');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

async function migrate() {
  console.log('--- Migrating Finance v2 (Cashflow, P&L, Shift Reconciliation, Petty Cash) ---');

  // 1. Inspect & enhance expenses table
  await sql`
    ALTER TABLE expenses 
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'APPROVED',
    ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS manager_pin_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS ocr_scanned_amt NUMERIC,
    ADD COLUMN IF NOT EXISTS ocr_vendor VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ocr_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS duplicate_flag BOOLEAN DEFAULT false;
  `;
  console.log('✓ Expenses table schema updated with approval & OCR fields');

  // 2. Create clinic_shift_handovers table for Multi-Shift Cash Drawer Reconciliation
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_shift_handovers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_slug VARCHAR(255) NOT NULL DEFAULT 'derma-care-dehradun',
      shift_name VARCHAR(100) NOT NULL,
      shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
      cashier_name VARCHAR(255) NOT NULL,
      next_cashier_name VARCHAR(255),
      opening_float NUMERIC NOT NULL DEFAULT 2000.0,
      cash_inflow NUMERIC NOT NULL DEFAULT 0.0,
      cash_expenses NUMERIC NOT NULL DEFAULT 0.0,
      expected_cash NUMERIC NOT NULL DEFAULT 2000.0,
      counted_cash NUMERIC NOT NULL DEFAULT 2000.0,
      variance NUMERIC NOT NULL DEFAULT 0.0,
      variance_pct NUMERIC NOT NULL DEFAULT 0.0,
      variance_status VARCHAR(50) NOT NULL DEFAULT 'BALANCED',
      is_pos_locked BOOLEAN NOT NULL DEFAULT false,
      variance_reason TEXT,
      manager_override_pin VARCHAR(50),
      manager_override_by VARCHAR(255),
      handover_status VARCHAR(50) NOT NULL DEFAULT 'RECONCILED',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ clinic_shift_handovers table verified/created');

  // 3. Create clinic_petty_cash_float table
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_petty_cash_float (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_slug VARCHAR(255) NOT NULL DEFAULT 'derma-care-dehradun' UNIQUE,
      target_float NUMERIC NOT NULL DEFAULT 2000.0,
      current_balance NUMERIC NOT NULL DEFAULT 2000.0,
      min_threshold NUMERIC NOT NULL DEFAULT 800.0,
      last_replenished_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_replenished_by VARCHAR(255) DEFAULT 'Clinic Administrator',
      status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ clinic_petty_cash_float table verified/created');

  // 4. Create clinic_petty_cash_ledger table
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_petty_cash_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_slug VARCHAR(255) NOT NULL DEFAULT 'derma-care-dehradun',
      entry_type VARCHAR(50) NOT NULL, -- 'DISBURSEMENT', 'REPLENISHMENT', 'INITIAL_FLOAT'
      amount NUMERIC NOT NULL,
      running_balance NUMERIC NOT NULL,
      source_or_recipient VARCHAR(255) NOT NULL,
      voucher_id VARCHAR(255),
      recorded_by VARCHAR(255) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ clinic_petty_cash_ledger table verified/created');

  // 5. Create clinic_doctor_payout_disputes table
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_doctor_payout_disputes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_slug VARCHAR(255) NOT NULL DEFAULT 'derma-care-dehradun',
      doctor_slug VARCHAR(255) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      dispute_date DATE NOT NULL DEFAULT CURRENT_DATE,
      gross_amount NUMERIC NOT NULL,
      agreed_split_pct NUMERIC NOT NULL,
      escrow_amount NUMERIC NOT NULL,
      dispute_reason TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'DISPUTED_ESCROW', -- 'DISPUTED_ESCROW', 'RESOLVED_RELEASED', 'ADJUSTED'
      resolution_notes TEXT,
      resolved_by VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ clinic_doctor_payout_disputes table verified/created');

  console.log('--- Migration completed successfully ---');
  await sql.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
