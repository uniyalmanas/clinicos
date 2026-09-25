const postgres = require('postgres');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

async function migrate() {
  console.log('--- Migrating EMR v2 (Allergy Hard-Stop, Lab Trending, Immutable Visits, Duplicate Guard) ---');

  // 1. emr_patients
  await sql`
    CREATE TABLE IF NOT EXISTS emr_patients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      uhid VARCHAR(50) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      dob DATE,
      age INT NOT NULL,
      gender VARCHAR(20) NOT NULL,
      blood_group VARCHAR(10) DEFAULT 'B+',
      emergency_contact VARCHAR(255),
      identity_hash VARCHAR(255) NOT NULL,
      is_duplicate_flagged BOOLEAN DEFAULT false,
      merged_into_uhid VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_patients table ready');

  // 2. emr_allergies
  await sql`
    CREATE TABLE IF NOT EXISTS emr_allergies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_uhid VARCHAR(50) NOT NULL,
      allergen_name VARCHAR(255) NOT NULL,
      atc_code VARCHAR(50) NOT NULL,
      reaction_severity VARCHAR(50) NOT NULL,
      reaction_description TEXT,
      is_active BOOLEAN DEFAULT true,
      logged_by VARCHAR(255) DEFAULT 'Dr. Rahul Sharma',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_allergies table ready');

  // 3. emr_allergy_contraindications
  await sql`
    CREATE TABLE IF NOT EXISTS emr_allergy_contraindications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_uhid VARCHAR(50) NOT NULL,
      prescribed_drug VARCHAR(255) NOT NULL,
      conflicting_allergy VARCHAR(255) NOT NULL,
      atc_code VARCHAR(50) NOT NULL,
      action_taken VARCHAR(50) NOT NULL, -- 'HARD_STOP_BLOCKED', 'CLINICAL_OVERRIDE_APPROVED'
      override_reason_code VARCHAR(100),
      override_reason_text TEXT,
      override_doctor_name VARCHAR(255),
      override_doctor_pin_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_allergy_contraindications table ready');

  // 4. emr_lab_vault
  await sql`
    CREATE TABLE IF NOT EXISTS emr_lab_vault (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_uhid VARCHAR(50) NOT NULL,
      test_name VARCHAR(255) NOT NULL,
      parameter_name VARCHAR(255) NOT NULL,
      parameter_value NUMERIC NOT NULL,
      unit VARCHAR(50) NOT NULL,
      reference_min NUMERIC NOT NULL,
      reference_max NUMERIC NOT NULL,
      flag VARCHAR(50) NOT NULL, -- 'NORMAL', 'HIGH', 'CRITICAL_HIGH', 'LOW', 'CRITICAL_LOW'
      report_date DATE NOT NULL,
      lab_source VARCHAR(255) NOT NULL,
      raw_document_url TEXT,
      ocr_confidence NUMERIC DEFAULT 99.2,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_lab_vault table ready');

  // 5. emr_clinical_visits
  await sql`
    CREATE TABLE IF NOT EXISTS emr_clinical_visits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_uhid VARCHAR(50) NOT NULL,
      visit_number VARCHAR(100) NOT NULL,
      version INT NOT NULL DEFAULT 1,
      is_latest BOOLEAN DEFAULT true,
      specialty_template VARCHAR(100) NOT NULL,
      visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
      doctor_name VARCHAR(255) NOT NULL,
      doctor_specialization VARCHAR(255) NOT NULL,
      provisional_diagnosis VARCHAR(255) NOT NULL,
      vitals JSONB NOT NULL,
      subjective_notes TEXT NOT NULL,
      objective_findings TEXT NOT NULL,
      assessment_plan TEXT NOT NULL,
      prescribed_medications JSONB NOT NULL,
      amendment_reason TEXT,
      amended_by VARCHAR(255),
      tamper_seal_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_clinical_visits table ready');

  // 6. emr_audit_trail
  await sql`
    CREATE TABLE IF NOT EXISTS emr_audit_trail (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_uhid VARCHAR(50) NOT NULL,
      action_type VARCHAR(50) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_role VARCHAR(100) NOT NULL,
      details TEXT,
      ip_address VARCHAR(50) DEFAULT '127.0.0.1',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_audit_trail table ready');

  // 7. emr_duplicate_merges
  await sql`
    CREATE TABLE IF NOT EXISTS emr_duplicate_merges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_uhid VARCHAR(50) NOT NULL,
      target_uhid VARCHAR(50) NOT NULL,
      primary_phone VARCHAR(50) NOT NULL,
      similarity_score NUMERIC NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING_DUAL_ADMIN',
      approver_1 VARCHAR(255),
      approver_2 VARCHAR(255),
      reconciliation_notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_duplicate_merges table ready');

  console.log('--- Migration completed successfully ---');
  await sql.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
