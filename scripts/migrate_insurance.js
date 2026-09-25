const postgres = require('postgres');

const DB_URL = 'postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DB_URL, { ssl: { rejectUnauthorized: false } });

async function runMigration() {
  try {
    console.log('Running insurance schema enhancement migration on Supabase...');
    await sql.unsafe(`
      ALTER TABLE insurance_claims 
      ADD COLUMN IF NOT EXISTS procedure_code VARCHAR(50),
      ADD COLUMN IF NOT EXISTS procedure_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS package_rate_cap NUMERIC(12, 2),
      ADD COLUMN IF NOT EXISTS package_rate_overrun BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS package_override_pin VARCHAR(50),
      ADD COLUMN IF NOT EXISTS package_override_reason TEXT,
      ADD COLUMN IF NOT EXISTS package_override_by VARCHAR(100),
      ADD COLUMN IF NOT EXISTS mandatory_docs_checklist JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS tpa_query_details JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS settlement_details JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✓ Migration executed successfully!');
    
    // Check columns
    const cols = await sql.unsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'insurance_claims';
    `);
    console.log('Updated columns:', cols.map(c => c.column_name).join(', '));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();
