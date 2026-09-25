const postgres = require('postgres');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

async function migrateV4() {
  console.log('--- Migrating Clinic Settings v4: Versioned Tariffs, Shift Guardrails & Safe Offboarding ---');

  // 1. Create clinic_tariff_versions table
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_tariff_versions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_id VARCHAR(100),
      clinic_slug VARCHAR(100) NOT NULL,
      effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 600.00,
      followup_fee NUMERIC(10,2) NOT NULL DEFAULT 300.00,
      followup_validity_days INTEGER NOT NULL DEFAULT 7,
      doctor_split_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00,
      authorized_by VARCHAR(255) DEFAULT 'Clinic Administrator (Admin Session)',
      change_reason TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ clinic_tariff_versions table created or verified');

  // Seed initial version if empty for derma-care-dehradun
  const existingTariffs = await sql`
    SELECT id FROM clinic_tariff_versions WHERE clinic_slug = 'derma-care-dehradun' LIMIT 1
  `;
  if (existingTariffs.length === 0) {
    await sql`
      INSERT INTO clinic_tariff_versions (
        clinic_slug,
        effective_from,
        consultation_fee,
        followup_fee,
        followup_validity_days,
        doctor_split_percentage,
        authorized_by,
        change_reason,
        is_active,
        created_at
      ) VALUES
      (
        'derma-care-dehradun',
        '2026-09-01T00:00:00Z',
        600.00,
        300.00,
        7,
        80.00,
        'Dr. Ananya Sharma (Medical Director, Admin Session)',
        'Fiscal Year 2026 Q3 OPD Tariff Baseline & Specialist Split Agreement',
        true,
        '2026-09-01T00:00:00Z'
      ),
      (
        'derma-care-dehradun',
        '2026-06-01T00:00:00Z',
        500.00,
        250.00,
        5,
        75.00,
        'Clinic Admin (Admin Session)',
        'Historical Base Rate: Summer 2026 OPD Fee Structure (Archived)',
        false,
        '2026-06-01T00:00:00Z'
      );
    `;
    console.log('✓ Seeded historical and active tariff versions for derma-care-dehradun');
  }

  // 2. Create clinic_shift_guardrails table
  await sql`
    CREATE TABLE IF NOT EXISTS clinic_shift_guardrails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_slug VARCHAR(100) NOT NULL,
      chamber_name VARCHAR(100) NOT NULL,
      doctor_slug VARCHAR(100) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      shift_name VARCHAR(100) NOT NULL,
      start_time VARCHAR(20) NOT NULL,
      end_time VARCHAR(20) NOT NULL,
      token_cutoff_minutes INTEGER DEFAULT 30,
      token_capacity INTEGER DEFAULT 25,
      grace_period_mins INTEGER DEFAULT 15,
      auto_cancel_unseen BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ clinic_shift_guardrails table created or verified');

  // Seed shift guardrails for derma-care-dehradun
  const existingShifts = await sql`
    SELECT id FROM clinic_shift_guardrails WHERE clinic_slug = 'derma-care-dehradun' LIMIT 1
  `;
  if (existingShifts.length === 0) {
    await sql`
      INSERT INTO clinic_shift_guardrails (
        clinic_slug,
        chamber_name,
        doctor_slug,
        doctor_name,
        shift_name,
        start_time,
        end_time,
        token_cutoff_minutes,
        token_capacity,
        grace_period_mins,
        auto_cancel_unseen,
        is_active
      ) VALUES
      (
        'derma-care-dehradun',
        'Chamber 1 - OPD Main',
        'dr-ananya-sharma',
        'Dr. Ananya Sharma, MD',
        'Morning OPD',
        '10:00 AM',
        '02:00 PM',
        30,
        25,
        15,
        true,
        true
      ),
      (
        'derma-care-dehradun',
        'Chamber 2 - Laser & Aesthetics',
        'dr-vikram-mehta',
        'Dr. Vikram Mehta, DVD',
        'Morning OPD',
        '10:30 AM',
        '01:30 PM',
        30,
        18,
        15,
        true,
        true
      ),
      (
        'derma-care-dehradun',
        'Chamber 1 - OPD Main',
        'dr-ananya-sharma',
        'Dr. Ananya Sharma, MD',
        'Evening OPD',
        '05:00 PM',
        '08:30 PM',
        30,
        25,
        15,
        true,
        true
      ),
      (
        'derma-care-dehradun',
        'Chamber 3 - Dermatosurgery OT',
        'dr-rohit-gupta',
        'Dr. Rohit Gupta, MS',
        'Evening OPD',
        '05:30 PM',
        '08:00 PM',
        30,
        12,
        15,
        true,
        true
      );
    `;
    console.log('✓ Seeded shift guardrails and chamber rosters for derma-care-dehradun');
  }

  // 3. Extend doctors table for safe offboarding
  await sql`
    ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
    ADD COLUMN IF NOT EXISTS final_settlement_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS final_payout_amount NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS final_settlement_status VARCHAR(50) DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS chamber_name VARCHAR(100) DEFAULT 'Chamber 1 - OPD Main';
  `;
  console.log('✓ doctors table extended with safe offboarding columns');

  // Verify doctors data
  const doctors = await sql`SELECT id, slug, full_name, is_active FROM doctors`;
  console.log(`Found ${doctors.length} doctors:`, doctors.map(d => `${d.full_name} (${d.slug}) [Active: ${d.is_active}]`));

  console.log('--- Migration v4 Completed Successfully ---');
  process.exit(0);
}

migrateV4().catch(err => {
  console.error('Migration v4 error:', err);
  process.exit(1);
});
