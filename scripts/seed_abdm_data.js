const postgres = require('postgres');

const DB_URL = 'postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DB_URL, { ssl: { rejectUnauthorized: false } });

async function seedAbdmData() {
  try {
    console.log('Seeding governed ABDM data into Supabase...');

    await sql.unsafe(`TRUNCATE TABLE abdm_patients CASCADE;`);
    await sql.unsafe(`TRUNCATE TABLE abdm_consent_artefacts CASCADE;`);

    const now = new Date();
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Seed Patients
    await sql.unsafe(`
      INSERT INTO abdm_patients (
        id, abha_number, abha_address, patient_name, patient_phone,
        masked_aadhaar, vid_reference, kyc_status, demographic_conflict,
        conflict_details, nha_sync_attempts, gateway_mode, created_at
      ) VALUES 
      (
        'a1111111-1111-1111-1111-111111111111',
        '91-4819-2041-8891',
        'vikassharma3210@abdm',
        'Vikas Sharma',
        '+91 98765 43210',
        'XXXX-XXXX-4819',
        '9102-4819-2019-3312',
        'VERIFIED',
        false,
        NULL,
        1,
        'SANDBOX_M1_M2',
        NOW()
      ),
      (
        'a2222222-2222-2222-2222-222222222222',
        '14-9912-4018-7721',
        'priyasingh9123@abdm',
        'Priya Singh',
        '+91 91234 56781',
        'XXXX-XXXX-7721',
        '8812-4412-9901-7721',
        'VERIFIED',
        false,
        NULL,
        1,
        'SANDBOX_M1_M2',
        NOW()
      ),
      (
        'a3333333-3333-3333-3333-333333333333',
        '33-1029-4481-9012',
        'rameshpant@abdm',
        'Ramesh Chandra Pant',
        '+91 94120 88219',
        'XXXX-XXXX-9012',
        '7721-9901-4412-9012',
        'CONFLICT_FLAGGED',
        true,
        'Registry Name Mismatch: Aadhaar records \"Ramesh C. Pant\", NHA token reports \"Ramesh Chandra Pant\". Manual NHA ticket #NHA-UK-4419 generated for biometric resolution.',
        2,
        'SANDBOX_M1_M2',
        NOW()
      ),
      (
        'a4444444-4444-4444-4444-444444444444',
        '55-9012-3312-6612',
        'anitadevi44@abdm',
        'Anita Devi',
        '+91 98112 44556',
        'XXXX-XXXX-6612',
        '6612-4412-8812-3312',
        'PENDING_NHA_SYNC',
        false,
        'NHA Gateway timeout (HTTP 504). Saved in offline queue with Pending Verification status. Exponential backoff retry scheduled.',
        3,
        'OFFLINE_QUEUE_FALLBACK',
        NOW()
      );
    `);

    // 2. Seed Consent Artefacts
    await sql.unsafe(`
      INSERT INTO abdm_consent_artefacts (
        id, consent_request_id, consent_artefact_id, patient_name,
        patient_phone, abha_number, abha_address, hiu_name, purpose_code,
        purpose_label, expiry_timestamp, status, ca_token_hash,
        otp_verified_at, revoked_at, revoked_by, access_count, last_accessed_at, created_at
      ) VALUES
      (
        'c1111111-1111-1111-1111-111111111111',
        'CA-REQ-2026-9912',
        'CA-ART-NHA-991204812',
        'Vikas Sharma',
        '+91 98765 43210',
        '91-4819-2041-8891',
        'vikassharma3210@abdm',
        'DocSphere Dehradun Polyclinic',
        'CAREFUL_EPISODE_MANAGEMENT',
        'Clinical Consultation & Inpatient Treatment',
        '${sevenDaysLater}',
        'GRANTED',
        'sha256-ca-token-991204-verified-nha-sig',
        '${twoHoursAgo}',
        NULL,
        NULL,
        4,
        NOW(),
        NOW()
      ),
      (
        'c2222222-2222-2222-2222-222222222222',
        'CA-REQ-2026-4419',
        NULL,
        'Priya Singh',
        '+91 91234 56781',
        '14-9912-4018-7721',
        'priyasingh9123@abdm',
        'DocSphere Diagnostic Pathology Lab',
        'DIAGNOSTIC_PATHOLOGY_ACCESS',
        'Diagnostic Pathology & LIS Investigation Records',
        '${sevenDaysLater}',
        'REQUESTED',
        NULL,
        NULL,
        NULL,
        NULL,
        0,
        NULL,
        NOW()
      ),
      (
        'c3333333-3333-3333-3333-333333333333',
        'CA-REQ-2026-1102',
        'CA-ART-NHA-110294812',
        'Ramesh Chandra Pant',
        '+91 94120 88219',
        '33-1029-4481-9012',
        'rameshpant@abdm',
        'DocSphere Dehradun Polyclinic',
        'CAREFUL_EPISODE_MANAGEMENT',
        'Clinical Consultation & Treatment Records',
        '${oneDayAgo}',
        'REVOKED',
        'sha256-revoked-token-lock',
        '${oneDayAgo}',
        '${oneDayAgo}',
        'Patient Self via ABHA PHR App',
        1,
        '${oneDayAgo}',
        '${oneDayAgo}'
      );
    `);

    console.log('✓ ABDM realistic governance cases seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedAbdmData();
