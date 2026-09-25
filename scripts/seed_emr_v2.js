const postgres = require('postgres');
const { createHash } = require('crypto');

const connectionString = "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";
const sql = postgres(connectionString);

function hashIdentity(name, dob, phone) {
  const norm = `${name.toLowerCase().replace(/[^a-z]/g, "")}|${dob}|${phone.replace(/\D/g, "").slice(-10)}`;
  return createHash('sha256').update(norm).digest('hex');
}

async function seed() {
  console.log('--- Seeding EMR v2 Clinical Data ---');

  // Clear existing records to ensure fresh seed
  await sql`DELETE FROM emr_duplicate_merges;`;
  await sql`DELETE FROM emr_audit_trail;`;
  await sql`DELETE FROM emr_clinical_visits;`;
  await sql`DELETE FROM emr_lab_vault;`;
  await sql`DELETE FROM emr_allergy_contraindications;`;
  await sql`DELETE FROM emr_allergies;`;
  await sql`DELETE FROM emr_patients;`;

  // 1. Seed Patients
  const patients = [
    {
      uhid: 'UHID-DC-2026-1001',
      full_name: 'Aarav Sharma',
      phone: '+91 98765 22110',
      dob: '2022-03-14',
      age: 4,
      gender: 'Male',
      blood_group: 'B+',
      emergency_contact: '+91 98765 22111 (Mother - Sunita Sharma)'
    },
    {
      uhid: 'UHID-DC-2026-1002',
      full_name: 'Amit Rawat',
      phone: '+91 91234 56780',
      dob: '2000-06-12',
      age: 26,
      gender: 'Male',
      blood_group: 'B+',
      emergency_contact: '+91 98765 00001 (Father - K. S. Rawat)'
    },
    {
      uhid: 'UHID-DC-2026-1003',
      full_name: 'Priya Singh',
      phone: '+91 91234 56781',
      dob: '2002-08-05',
      age: 24,
      gender: 'Female',
      blood_group: 'O+',
      emergency_contact: '+91 98765 00002 (Mother - Manju Singh)'
    },
    {
      uhid: 'UHID-DC-2026-1004',
      full_name: 'Rohit Pant',
      phone: '+91 91234 56782',
      dob: '1994-01-20',
      age: 32,
      gender: 'Male',
      blood_group: 'A+',
      emergency_contact: '+91 98765 00003 (Spouse - Deepa Pant)'
    },
    {
      uhid: 'UHID-DC-2026-1009',
      full_name: 'Amit K. Rawat',
      phone: '+91 91234 56780', // Same phone as Amit Rawat - triggers duplicate detection
      dob: '2000-06-12',
      age: 26,
      gender: 'Male',
      blood_group: 'B+',
      emergency_contact: '+91 98765 00001'
    }
  ];

  for (const p of patients) {
    const idHash = hashIdentity(p.full_name, p.dob, p.phone);
    const isDup = p.uhid === 'UHID-DC-2026-1009';

    await sql`
      INSERT INTO emr_patients (
        uhid, full_name, phone, dob, age, gender, blood_group,
        emergency_contact, identity_hash, is_duplicate_flagged
      ) VALUES (
        ${p.uhid}, ${p.full_name}, ${p.phone}, ${p.dob}, ${p.age}, ${p.gender},
        ${p.blood_group}, ${p.emergency_contact}, ${idHash}, ${isDup}
      );
    `;
  }
  console.log('✓ Seeded 5 emr_patients with UPI identity hashes');

  // 2. Seed Active Allergies with ATC Codes
  await sql`
    INSERT INTO emr_allergies (
      patient_uhid, allergen_name, atc_code, reaction_severity, reaction_description, logged_by
    ) VALUES 
    ('UHID-DC-2026-1001', 'Amoxicillin / Penicillin Group', 'J01CA04', 'SEVERE_ANAPHYLAXIS', 'Severe laryngeal edema, acute urticaria and bronchospasm within 15 min of oral suspension ingestion.', 'Dr. Neha Kapoor (Pediatric Lead)'),
    ('UHID-DC-2026-1002', 'Sulphonamides (Sulpha Drugs)', 'J01EE01', 'MODERATE_HIVES', 'Severe generalized maculopapular rash, pruritus and facial puffiness following co-trimoxazole.', 'Dr. Rahul Sharma'),
    ('UHID-DC-2026-1004', 'Penicillin G / V', 'J01CE01', 'MODERATE_HIVES', 'Urticarial wheals and mild lip swelling.', 'Dr. Rahul Sharma');
  `;
  console.log('✓ Seeded active allergy contraindications with ATC codes');

  // 3. Seed Hard-Stop Contraindication Audit Records
  await sql`
    INSERT INTO emr_allergy_contraindications (
      patient_uhid, prescribed_drug, conflicting_allergy, atc_code, action_taken,
      override_reason_code, override_reason_text, override_doctor_name, override_doctor_pin_verified
    ) VALUES 
    (
      'UHID-DC-2026-1001',
      'SYRUP AMOXYCLAV 228.5MG',
      'Amoxicillin / Penicillin Group (ATC: J01CA04)',
      'J01CA04',
      'HARD_STOP_BLOCKED',
      NULL,
      'System triggered immediate Hard-Stop lock. Blocked prescription generation to prevent pediatric anaphylaxis. Replaced with Azithromycin 100mg.',
      'Dr. Rahul Sharma',
      false
    ),
    (
      'UHID-DC-2026-1002',
      'TAB BACTRIM DS (SULPHAMETHOXAZOLE)',
      'Sulphonamides (Sulpha Drugs) (ATC: J01EE01)',
      'J01EE01',
      'CLINICAL_OVERRIDE_APPROVED',
      'DESENSITIZATION_PROTOCOL',
      'Supervised oral desensitization protocol in clinical day-care. Emergency resuscitation tray on standby.',
      'Dr. Rahul Sharma (Senior Consultant)',
      true
    );
  `;
  console.log('✓ Seeded allergy contraindication engine events');

  // 4. Seed Structured Lab Vault Data (HL7 / FHIR Ingestion)
  const labData = [
    // Amit Rawat (UHID-DC-2026-1002) - HbA1c trending
    { uhid: 'UHID-DC-2026-1002', test: 'HbA1c Glycated Hemoglobin', param: 'HbA1c', val: 8.4, unit: '%', min: 4.0, max: 5.6, flag: 'CRITICAL_HIGH', date: '2026-03-10', src: 'Marley LIS (HL7 v2.5.1 / FHIR)' },
    { uhid: 'UHID-DC-2026-1002', test: 'HbA1c Glycated Hemoglobin', param: 'HbA1c', val: 7.6, unit: '%', min: 4.0, max: 5.6, flag: 'HIGH', date: '2026-06-15', src: 'Marley LIS (HL7 v2.5.1 / FHIR)' },
    { uhid: 'UHID-DC-2026-1002', test: 'HbA1c Glycated Hemoglobin', param: 'HbA1c', val: 6.4, unit: '%', min: 4.0, max: 5.6, flag: 'HIGH', date: '2026-09-16', src: 'Marley LIS (HL7 v2.5.1 / FHIR)' },
    
    // Renal & Hepatic trending
    { uhid: 'UHID-DC-2026-1002', test: 'Kidney Function Test (KFT)', param: 'Serum Creatinine', val: 1.15, unit: 'mg/dL', min: 0.7, max: 1.2, flag: 'NORMAL', date: '2026-09-16', src: 'Marley LIS (HL7 v2.5.1 / FHIR)' },
    { uhid: 'UHID-DC-2026-1002', test: 'Liver Function Test (LFT)', param: 'Serum Bilirubin (Total)', val: 0.9, unit: 'mg/dL', min: 0.2, max: 1.2, flag: 'NORMAL', date: '2026-09-16', src: 'Marley LIS (HL7 v2.5.1 / FHIR)' },
    { uhid: 'UHID-DC-2026-1002', test: 'Complete Blood Count (CBC)', param: 'Platelet Count', val: 245, unit: 'x10^3/uL', min: 150, max: 450, flag: 'NORMAL', date: '2026-09-16', src: 'DocSphere AI OCR Report Parser' },
    
    // Priya Singh (UHID-DC-2026-1003) - Allergy testing
    { uhid: 'UHID-DC-2026-1003', test: 'Allergy Serology Panel', param: 'Total Serum IgE', val: 490, unit: 'IU/mL', min: 0, max: 100, flag: 'CRITICAL_HIGH', date: '2026-09-17', src: 'Marley LIS (HL7 v2.5.1 / FHIR)' }
  ];

  for (const l of labData) {
    await sql`
      INSERT INTO emr_lab_vault (
        patient_uhid, test_name, parameter_name, parameter_value, unit,
        reference_min, reference_max, flag, report_date, lab_source
      ) VALUES (
        ${l.uhid}, ${l.test}, ${l.param}, ${l.val}, ${l.unit},
        ${l.min}, ${l.max}, ${l.flag}, ${l.date}, ${l.src}
      );
    `;
  }
  console.log('✓ Seeded structured lab vault records with reference ranges');

  // 5. Seed Versioned Immutable Clinical Visits
  await sql`
    INSERT INTO emr_clinical_visits (
      patient_uhid, visit_number, version, is_latest, specialty_template,
      visit_date, doctor_name, doctor_specialization, provisional_diagnosis,
      vitals, subjective_notes, objective_findings, assessment_plan,
      prescribed_medications, amendment_reason, amended_by, tamper_seal_hash
    ) VALUES 
    (
      'UHID-DC-2026-1001',
      'VIS-PEDIATRIC-2026-081',
      1,
      true,
      'PEDIATRIC_GROWTH',
      CURRENT_DATE - INTERVAL '2 days',
      'Dr. Neha Kapoor',
      'Pediatric Dermatology & Child Care',
      'Acute Atopic Dermatitis with Secondary Pyoderma',
      ${JSON.stringify({ bp: "98/62", pulse: 96, temp: 99.1, weight: 16.2, spo2: 99, head_circ_cm: 50.5, growth_percentile: "50th percentile" })},
      'Child presented with severe pruritic excoriations over bilateral antecubital and popliteal fossae for 5 days. Unable to sleep due to intense scratching.',
      'Erythematous plaques with honey-colored crusted excoriations. Bilateral cervical lymphadenopathy non-tender. Lungs clear, abdomen soft.',
      '1. Strict avoidance of Beta-lactam antibiotics due to documented anaphylaxis.\n2. Prescribed oral Azithromycin 100mg once daily for 5 days.\n3. Mild topical Hydrocortisone 1% + Fusidic acid ointment twice daily for 7 days.\n4. Cetirizine syrup 2.5ml at bedtime.',
      ${JSON.stringify([
        { medicine: "SYRUP AZITHROMYCIN 100MG/5ML", dose: "5ml once daily x 5 days", route: "Oral" },
        { medicine: "FUSIDIC ACID + HYDROCORTISONE OINT", dose: "Apply thin layer BD x 7 days", route: "Topical" },
        { medicine: "SYRUP CETIRIZINE 5MG/5ML", dose: "2.5ml at night x 7 days", route: "Oral" }
      ])},
      NULL,
      NULL,
      'SEAL-EMR-SHA256-A8F1902C4E'
    ),
    (
      'UHID-DC-2026-1002',
      'VIS-DERMA-2026-140',
      1,
      false,
      'DERMATOLOGY_FITZPATRICK',
      CURRENT_DATE - INTERVAL '9 days',
      'Dr. Rahul Sharma',
      'Dermatology & Skin Specialist',
      'Moderate to Severe Acne Vulgaris (Grade III)',
      ${JSON.stringify({ bp: "118/78", pulse: 74, temp: 98.4, weight: 64, spo2: 99, fitzpatrick_skin_type: "Type IV (Wheatish)" })},
      'Patient reports 2-week flare of painful cystic nodules across cheeks and chin. Aggravated by humidity and gym sweating.',
      'Multiple inflammatory papules and 4 closed cysts on cheeks. No comedones on back. Dermoscopy confirms follicular plugging without scarring.',
      '1. Initiated Cap Doxycycline 100mg BD x 14 days.\n2. Clindamycin 1% gel in morning.\n3. Tretinoin 0.05% cream at night.',
      ${JSON.stringify([
        { medicine: "CAP DOXYCYCLINE 100MG", dose: "1 Cap BD after meals x 14 days", route: "Oral" },
        { medicine: "CLINDAMYCIN 1% TOPICAL GEL", dose: "Apply in morning", route: "Topical" }
      ])},
      NULL,
      NULL,
      'SEAL-EMR-SHA256-118A98FC01'
    ),
    (
      'UHID-DC-2026-1002',
      'VIS-DERMA-2026-140',
      2,
      true,
      'DERMATOLOGY_FITZPATRICK',
      CURRENT_DATE - INTERVAL '8 days',
      'Dr. Rahul Sharma',
      'Dermatology & Skin Specialist',
      'Moderate to Severe Acne Vulgaris (Grade III) - Amended',
      ${JSON.stringify({ bp: "118/78", pulse: 74, temp: 98.4, weight: 64, spo2: 99, fitzpatrick_skin_type: "Type IV (Wheatish)" })},
      'Patient reports 2-week flare of painful cystic nodules across cheeks and chin. Aggravated by humidity and gym sweating.',
      'Multiple inflammatory papules and 4 closed cysts on cheeks. No comedones on back. Dermoscopy confirms follicular plugging without scarring.',
      'Amended: Added Sunscreen SPF 50 gel application 20 minutes prior to outdoor sun exposure to prevent post-inflammatory hyperpigmentation while on Doxycycline.',
      ${JSON.stringify([
        { medicine: "CAP DOXYCYCLINE 100MG", dose: "1 Cap BD after meals x 14 days", route: "Oral" },
        { medicine: "CLINDAMYCIN 1% TOPICAL GEL", dose: "Apply in morning", route: "Topical" },
        { medicine: "BROAD SPECTRUM GEL SUNSCREEN SPF 50", dose: "Apply mornings and 20 min before sun exposure", route: "Topical" }
      ])},
      'Added broad-spectrum non-comedogenic sunscreen to mitigate photosensitivity risks associated with oral tetracyclines.',
      'Dr. Rahul Sharma (Senior Consultant)',
      'SEAL-EMR-SHA256-42EFB1893D'
    );
  `;
  console.log('✓ Seeded versioned immutable clinical visits with amendment seals');

  // 6. Seed DPDP Act Compliance Audit Trail
  await sql`
    INSERT INTO emr_audit_trail (
      patient_uhid, action_type, user_name, user_role, details, ip_address
    ) VALUES 
    ('UHID-DC-2026-1001', 'VIEW_RECORD', 'Dr. Neha Kapoor', 'Senior Consultant', 'Full pediatric EMR reviewed prior to outpatient consultation', '192.168.1.104'),
    ('UHID-DC-2026-1001', 'HARD_STOP_BLOCKED', 'System Security Gateway', 'Prescription Guard', 'Hard-stop prevented Amoxicillin generation due to severe penicillin anaphylaxis record', '127.0.0.1'),
    ('UHID-DC-2026-1002', 'EDIT_NOTE', 'Dr. Rahul Sharma', 'Clinical Director', 'Created signed Addendum v2.0 for visit VIS-DERMA-2026-140', '192.168.1.101'),
    ('UHID-DC-2026-1002', 'EXPORT_PDF', 'Pooja Verma', 'Front Desk Lead', 'Patient authorized health record PDF export per Section 12 of DPDP Act (2023)', '192.168.1.108');
  `;
  console.log('✓ Seeded DPDP access audit trail entries');

  // 7. Seed Duplicate Merge Ticket
  await sql`
    INSERT INTO emr_duplicate_merges (
      source_uhid, target_uhid, primary_phone, similarity_score, status,
      approver_1, reconciliation_notes
    ) VALUES (
      'UHID-DC-2026-1009',
      'UHID-DC-2026-1002',
      '+91 91234 56780',
      92.4,
      'PENDING_DUAL_ADMIN',
      'Pooja Verma (Registration Desk)',
      'Duplicate patient profile detected via Name+DOB+Phone composite match. Both entries represent Amit Rawat. Requires Dr. Rahul Sharma second admin approval to reconcile and merge.'
    );
  `;
  console.log('✓ Seeded duplicate merge ticket');

  console.log('--- EMR v2 seeding completed successfully ---');
  await sql.end();
}

seed().catch(e => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
