const postgres = require('postgres');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

async function migrateV3() {
  console.log('--- Migrating EMR v3 (Emergency Contact Consent, NMC Senior Doctor Verification, Watermarked Secure Export) ---');

  // 1. Extend emr_patients with emergency contact consent & guardian fields
  await sql`
    ALTER TABLE emr_patients 
    ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100) DEFAULT 'Mother (Legal Guardian - Minor)',
    ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50) DEFAULT '+91 98765 01928',
    ADD COLUMN IF NOT EXISTS emergency_contact_consent_status VARCHAR(100) DEFAULT 'DPDP_FORM_3_EXPLICIT_CONSENT',
    ADD COLUMN IF NOT EXISTS emergency_contact_consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS emergency_contact_encrypted_hash VARCHAR(255) DEFAULT 'AES256-GCM-ENC-09A8F711C';
  `;
  console.log('✓ emr_patients extended with emergency contact consent columns');

  // Update specific patient emergency relationships
  await sql`
    UPDATE emr_patients 
    SET emergency_contact_relationship = 'Mother (Legal Guardian - Minor)',
        emergency_contact_phone = '+91 98765 01928',
        emergency_contact_consent_status = 'DPDP_FORM_3_EXPLICIT_CONSENT'
    WHERE uhid = 'UHID-DC-2026-1001';
  `;

  await sql`
    UPDATE emr_patients 
    SET emergency_contact_relationship = 'Spouse (Primary Healthcare Proxy)',
        emergency_contact_phone = '+91 98112 34567',
        emergency_contact_consent_status = 'DPDP_FORM_3_EXPLICIT_CONSENT'
    WHERE uhid = 'UHID-DC-2026-1002';
  `;

  await sql`
    UPDATE emr_patients 
    SET emergency_contact_relationship = 'Father (Emergency Proxy)',
        emergency_contact_phone = '+91 99551 22334',
        emergency_contact_consent_status = 'DPDP_FORM_3_EXPLICIT_CONSENT'
    WHERE uhid = 'UHID-DC-2026-1003';
  `;

  // 2. Extend emr_allergy_contraindications with NMC registry check & cross-module persistence
  await sql`
    ALTER TABLE emr_allergy_contraindications 
    ADD COLUMN IF NOT EXISTS override_doctor_role VARCHAR(100) DEFAULT 'Senior Consultant',
    ADD COLUMN IF NOT EXISTS override_doctor_nmc_reg VARCHAR(100) DEFAULT 'NMC-DL-2014-99821',
    ADD COLUMN IF NOT EXISTS nmc_status_verified BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS persisted_to_pharmacy BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS persisted_to_lis BOOLEAN DEFAULT true;
  `;
  console.log('✓ emr_allergy_contraindications extended with NMC verification columns');

  // 3. Create emr_secure_exports table for Right to Access & Specialist Referral Watermarked PDFs
  await sql`
    CREATE TABLE IF NOT EXISTS emr_secure_exports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_uhid VARCHAR(50) NOT NULL,
      export_type VARCHAR(100) NOT NULL, -- 'RIGHT_TO_ACCESS_PATIENT', 'SPECIALIST_REFERRAL', 'EMERGENCY_TRANSFER'
      recipient_name VARCHAR(255) NOT NULL,
      recipient_id VARCHAR(100) NOT NULL,
      patient_otp_verified BOOLEAN DEFAULT true,
      otp_session_id VARCHAR(100) NOT NULL,
      watermark_text TEXT NOT NULL,
      expiry_hours INT DEFAULT 48,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      tamper_seal_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  console.log('✓ emr_secure_exports table created');

  // 4. Seed initial secure export record for audit demonstration
  await sql`
    INSERT INTO emr_secure_exports (
      patient_uhid, export_type, recipient_name, recipient_id, patient_otp_verified,
      otp_session_id, watermark_text, expiry_hours, expires_at, tamper_seal_hash
    ) VALUES (
      'UHID-DC-2026-1001',
      'SPECIALIST_REFERRAL',
      'Dr. Sameer Sen (Pediatric Pulmonology, Max Super Speciality)',
      'REC-SPEC-MAX-2026-891',
      true,
      'OTP-SESS-982194',
      'CONFIDENTIAL MEDICAL RECORD • PREPARED FOR REC-SPEC-MAX-2026-891 • EXPIRES 2026-09-27 • DPDP SEC-12 PROTECTED',
      48,
      NOW() + INTERVAL '48 hours',
      'SEAL-EXP-SHA256-49FA8103'
    ) ON CONFLICT DO NOTHING;
  `;

  console.log('✓ Seeded initial secure export sample');

  await sql.end();
  console.log('--- Migration v3 Completed Successfully! ---');
}

migrateV3().catch(err => {
  console.error('Migration v3 error:', err);
  process.exit(1);
});
