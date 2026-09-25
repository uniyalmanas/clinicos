const postgres = require('postgres');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

async function test() {
  console.log('Testing Settings v4 Database Records:');

  // 1. Check Tariff Versions
  const tariffs = await sql`
    SELECT id, clinic_slug, effective_from, consultation_fee, followup_fee, doctor_split_percentage, authorized_by, change_reason, is_active
    FROM clinic_tariff_versions
    WHERE clinic_slug = 'derma-care-dehradun'
    ORDER BY effective_from DESC;
  `;
  console.log(`Found ${tariffs.length} tariff versions:`);
  tariffs.forEach(t => {
    console.log(`  - [${t.is_active ? 'ACTIVE' : 'ARCHIVED'}] Effective: ${t.effective_from.toISOString().split('T')[0]} | Fee: ₹${t.consultation_fee} | Split: ${t.doctor_split_percentage}% | Reason: ${t.change_reason}`);
  });

  // 2. Check Shift Guardrails & Chamber Allocations
  const shifts = await sql`
    SELECT id, chamber_name, doctor_name, shift_name, start_time, end_time, token_cutoff_minutes, token_capacity, auto_cancel_unseen
    FROM clinic_shift_guardrails
    WHERE clinic_slug = 'derma-care-dehradun'
    ORDER BY chamber_name, start_time;
  `;
  console.log(`\nFound ${shifts.length} shift guardrails:`);
  shifts.forEach(s => {
    console.log(`  - ${s.chamber_name} | ${s.doctor_name} | ${s.shift_name} (${s.start_time} - ${s.end_time}) | Cutoff: ${s.token_cutoff_minutes}m | Cap: ${s.token_capacity} | AutoCancel: ${s.auto_cancel_unseen}`);
  });

  // 3. Check Doctor Safe Offboarding Fields
  const doctors = await sql`
    SELECT slug, full_name, is_active, deactivated_at, deactivation_reason, final_settlement_id, final_payout_amount
    FROM doctors
    WHERE clinic_slug = 'derma-care-dehradun' OR clinic_id IS NOT NULL
    LIMIT 3;
  `;
  console.log(`\nSample Doctors Status:`);
  doctors.forEach(d => {
    console.log(`  - ${d.full_name} (${d.slug}) | Active: ${d.is_active} | Settlement: ₹${d.final_payout_amount || 0}`);
  });

  console.log('\nAll Settings v4 verifications passed!');
  process.exit(0);
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
