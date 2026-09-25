const postgres = require('postgres');

const DB_URL = 'postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DB_URL, { ssl: { rejectUnauthorized: false } });

async function runAbdmMigration() {
  try {
    console.log('Running ABDM schema enhancement migration on Supabase...');

    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS abdm_patients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        abha_number VARCHAR(25) UNIQUE NOT NULL,
        abha_address VARCHAR(100) UNIQUE NOT NULL,
        patient_name VARCHAR(150) NOT NULL,
        patient_phone VARCHAR(25) NOT NULL,
        masked_aadhaar VARCHAR(20) NOT NULL,
        vid_reference VARCHAR(30),
        kyc_status VARCHAR(30) DEFAULT 'VERIFIED',
        demographic_conflict BOOLEAN DEFAULT FALSE,
        conflict_details TEXT,
        nha_sync_attempts INT DEFAULT 1,
        gateway_mode VARCHAR(20) DEFAULT 'SANDBOX_M1_M2',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS abdm_consent_artefacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        consent_request_id VARCHAR(100) UNIQUE NOT NULL,
        consent_artefact_id VARCHAR(100),
        patient_name VARCHAR(150) NOT NULL,
        patient_phone VARCHAR(25) NOT NULL,
        abha_number VARCHAR(25) NOT NULL,
        abha_address VARCHAR(100) NOT NULL,
        hiu_name VARCHAR(150) DEFAULT 'DocSphere Dehradun Polyclinic',
        purpose_code VARCHAR(50) DEFAULT 'CAREFUL_EPISODE_MANAGEMENT',
        purpose_label VARCHAR(150) DEFAULT 'Clinical Consultation & Inpatient Treatment',
        date_range_from TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
        date_range_to TIMESTAMPTZ DEFAULT NOW(),
        expiry_timestamp TIMESTAMPTZ NOT NULL,
        status VARCHAR(30) DEFAULT 'GRANTED',
        ca_token_hash TEXT,
        otp_verified_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        revoked_by VARCHAR(100),
        access_count INT DEFAULT 0,
        last_accessed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS abdm_gateway_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id VARCHAR(100) NOT NULL,
        endpoint VARCHAR(150) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INT NOT NULL,
        latency_ms INT NOT NULL,
        retry_count INT DEFAULT 0,
        is_fallback_mode BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('✓ ABDM tables successfully created on Supabase!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runAbdmMigration();
