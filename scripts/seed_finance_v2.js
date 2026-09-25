const postgres = require('postgres');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

async function seed() {
  console.log('--- Seeding Finance v2 Data ---');

  const clinicSlug = 'derma-care-dehradun';

  // 1. Seed or update Petty Cash Float
  const existingFloat = await sql`
    SELECT id FROM clinic_petty_cash_float 
    WHERE clinic_slug = ${clinicSlug} 
    LIMIT 1;
  `;

  if (existingFloat.length === 0) {
    await sql`
      INSERT INTO clinic_petty_cash_float (
        clinic_slug, target_float, current_balance, min_threshold, 
        last_replenished_at, last_replenished_by, status
      ) VALUES (
        ${clinicSlug},
        2000.0,
        1450.0,
        800.0,
        NOW() - INTERVAL '4 hours',
        'Dr. Rahul Sharma (Finance Head)',
        'HEALTHY'
      );
    `;
    console.log('✓ Seeded clinic_petty_cash_float');
  }

  // 2. Seed Petty Cash Ledger if empty
  const ledgerCount = await sql`
    SELECT COUNT(*) AS count FROM clinic_petty_cash_ledger WHERE clinic_slug = ${clinicSlug};
  `;
  if (Number(ledgerCount[0].count) === 0) {
    await sql`
      INSERT INTO clinic_petty_cash_ledger (
        clinic_slug, entry_type, amount, running_balance, 
        source_or_recipient, voucher_id, recorded_by, notes, created_at
      ) VALUES 
      (${clinicSlug}, 'INITIAL_FLOAT', 2000.0, 2000.0, 'Main Safe Counter Transfer', 'VCH-INIT-01', 'Clinic Admin', 'Morning shift float allocation', NOW() - INTERVAL '8 hours'),
      (${clinicSlug}, 'DISBURSEMENT', 250.0, 1750.0, 'Bluedart Courier Express', 'VCH-EXP-901', 'Pooja Verma (Front Desk)', 'Biopsy specimen courier to Oncquest Delhi', NOW() - INTERVAL '5 hours'),
      (${clinicSlug}, 'DISBURSEMENT', 300.0, 1450.0, 'Pantry RO Water & Refreshments', 'VCH-EXP-902', 'Pooja Verma (Front Desk)', 'RO Water Canister Restock (x3 Cans)', NOW() - INTERVAL '3 hours');
    `;
    console.log('✓ Seeded clinic_petty_cash_ledger entries');
  }

  // 3. Seed Shift Handovers if empty
  const shiftCount = await sql`
    SELECT COUNT(*) AS count FROM clinic_shift_handovers WHERE clinic_slug = ${clinicSlug};
  `;
  if (Number(shiftCount[0].count) === 0) {
    await sql`
      INSERT INTO clinic_shift_handovers (
        clinic_slug, shift_name, shift_date, cashier_name, next_cashier_name,
        opening_float, cash_inflow, cash_expenses, expected_cash, counted_cash,
        variance, variance_pct, variance_status, is_pos_locked, variance_reason,
        handover_status, created_at
      ) VALUES 
      (
        ${clinicSlug},
        'Morning Shift (08:00 - 14:00)',
        CURRENT_DATE,
        'Pooja Verma (Front Desk)',
        'Rohit Semwal (Evening Desk)',
        2000.0,
        14200.0,
        450.0,
        15750.0,
        15750.0,
        0.0,
        0.0,
        'BALANCED',
        false,
        'Drawer cash count matches physical currency notes perfectly.',
        'RECONCILED',
        NOW() - INTERVAL '2 hours'
      ),
      (
        ${clinicSlug},
        'Evening Shift (14:00 - 21:00)',
        CURRENT_DATE,
        'Rohit Semwal (Evening Desk)',
        'Night Lock / Safe Deposit',
        2000.0,
        17200.0,
        1450.0,
        17750.0,
        17630.0,
        -120.0,
        0.68,
        'VARIANCE_BREACH',
        true,
        'Physical cash counted: ₹17,630 vs expected ₹17,750 (Shortage of ₹120 > ₹100 threshold). POS Locked pending Manager PIN override.',
        'HANDOVER_SUBMITTED',
        NOW() - INTERVAL '15 minutes'
      );
    `;
    console.log('✓ Seeded clinic_shift_handovers');
  }

  // 4. Seed Doctor Payout Disputes / Escrow
  const disputeCount = await sql`
    SELECT COUNT(*) AS count FROM clinic_doctor_payout_disputes WHERE clinic_slug = ${clinicSlug};
  `;
  if (Number(disputeCount[0].count) === 0) {
    await sql`
      INSERT INTO clinic_doctor_payout_disputes (
        clinic_slug, doctor_slug, doctor_name, dispute_date,
        gross_amount, agreed_split_pct, escrow_amount, dispute_reason,
        status, resolution_notes, resolved_by, created_at
      ) VALUES 
      (
        ${clinicSlug},
        'dr-amit-bhatt',
        'Dr. Amit Bhatt',
        CURRENT_DATE,
        1600.0,
        75.0,
        1200.0,
        'Visiting doctor disputed deduction of ₹350 for carbon peeling laser consumables. Held in Escrow pending case sheet audit.',
        'DISPUTED_ESCROW',
        'Escrow held in operating bank balance. Will reconcile in next payout cycle after Clinical Director review.',
        'Finance Head',
        NOW() - INTERVAL '1 hour'
      );
    `;
    console.log('✓ Seeded clinic_doctor_payout_disputes');
  }

  // 5. Update sample expenses with approval and OCR flags
  await sql`
    UPDATE expenses
    SET 
      requires_approval = CASE WHEN amount > 500 THEN true ELSE false END,
      approval_status = CASE 
        WHEN amount > 500 AND title ILIKE '%Snack%' THEN 'PENDING_APPROVAL' 
        ELSE 'APPROVED' 
      END,
      approved_by = CASE WHEN amount > 500 AND NOT (title ILIKE '%Snack%') THEN 'Dr. Rahul Sharma (Finance Head)' ELSE NULL END,
      manager_pin_verified = CASE WHEN amount > 500 AND NOT (title ILIKE '%Snack%') THEN true ELSE false END,
      ocr_scanned_amt = amount,
      ocr_vendor = CASE 
        WHEN title ILIKE '%UPCL%' THEN 'UPCL Power Corporation' 
        WHEN title ILIKE '%Glove%' THEN 'MedPlus Surgical Supplies' 
        WHEN title ILIKE '%RO%' THEN 'Bisleri Commercial Services' 
        ELSE 'Local Medical Store' 
      END,
      ocr_verified = true,
      duplicate_flag = false
    WHERE clinic_slug = ${clinicSlug} OR clinic_slug IS NULL;
  `;
  console.log('✓ Updated existing expenses with realistic OCR and approval status');

  console.log('--- Seeding finished successfully ---');
  await sql.end();
}

seed().catch(e => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
