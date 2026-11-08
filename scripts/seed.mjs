#!/usr/bin/env node
/**
 * Local development seed.
 *
 * Creates a realistic, idempotent demo clinic: staff accounts, doctors,
 * patients, today's OPD queue, prescriptions, pharmacy stock, lab orders,
 * inpatient beds, insurance claims and finance rows.
 *
 * Safety:
 *   - Refuses to run against a non-loopback database unless --force is passed.
 *   - Never contains hard-coded passwords: reads SEED_*_PASSWORD from env.
 *   - Idempotent: re-running updates the demo rows instead of duplicating them.
 *
 *   node scripts/seed.mjs
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(path.join(root, "apps", "web", ".env.local"));
loadEnv(path.join(root, ".env.local"));

const connectionString = (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "").trim();
if (!connectionString) {
  console.error("DATABASE_URL (or DIRECT_DATABASE_URL) is not set.");
  process.exit(1);
}

const normalized = connectionString.replace(/^postgres:\/\//, "postgresql://");
const host = (() => {
  try {
    return new URL(normalized).hostname;
  } catch {
    return "";
  }
})();
const isLoopback = /^(?:localhost|127\.0\.0\.1|::1|\[::1\])$/i.test(host);
if (!isLoopback && !process.argv.includes("--force")) {
  console.error(
    `Refusing to seed non-loopback database host "${host}". Pass --force only for a disposable demo database.`
  );
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  console.error("Refusing to seed with NODE_ENV=production. Pass --force for a disposable demo database.");
  process.exit(1);
}

const sql = postgres(normalized, {
  ssl: isLoopback ? false : { rejectUnauthorized: false },
  max: 1,
  prepare: false,
  onnotice: () => {},
});

const uuid = () => crypto.randomUUID();
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata",
});
const future = (days) =>
  new Date(Date.now() + days * 86400000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

const credentials = [];

function passwordFor(key, name) {
  const value = (process.env[key] || "").trim();
  if (value) return value;
  const generated = crypto.randomBytes(12).toString("base64url");
  credentials.push({ name, password: generated });
  return generated;
}

const PASSWORDS = {
  owner: passwordFor("SEED_OWNER_PASSWORD", "Owner"),
  doctor: passwordFor("SEED_DOCTOR_PASSWORD", "Doctor"),
  staff: passwordFor("SEED_STAFF_PASSWORD", "Reception / pharmacist"),
  superadmin: passwordFor("SEED_SUPERADMIN_PASSWORD", "Superadmin"),
};

async function upsertUser({ phone, email, fullName, role, password }) {
  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO user_accounts (
      id, phone, email, password_hash, full_name, role, is_verified, is_active
    ) VALUES (
      ${uuid()}, ${phone}, ${email}, ${hash}, ${fullName}, ${role}, true, true
    )
    ON CONFLICT (phone) DO UPDATE SET
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      is_verified = true,
      is_active = true,
      updated_at = NOW()
    RETURNING id, phone, full_name
  `;
  return rows[0];
}

async function main() {
  // -------------------------------------------------------------------------
  // Accounts
  // -------------------------------------------------------------------------
  const owner = await upsertUser({
    phone: "9876500001",
    email: "owner@docsphere.local",
    fullName: "Dr. Rahul Sharma",
    role: "owner",
    password: PASSWORDS.owner,
  });
  const doctorUser = await upsertUser({
    phone: "9876500002",
    email: "aditi@docsphere.local",
    fullName: "Dr. Aditi Joshi",
    role: "doctor",
    password: PASSWORDS.doctor,
  });
  const reception = await upsertUser({
    phone: "9876500003",
    email: "reception@docsphere.local",
    fullName: "Meera Nair",
    role: "receptionist",
    password: PASSWORDS.staff,
  });
  const pharmacist = await upsertUser({
    phone: "9876500004",
    email: "pharmacy@docsphere.local",
    fullName: "Sanjay Verma",
    role: "staff",
    password: PASSWORDS.staff,
  });
  await upsertUser({
    phone: "9876500000",
    email: "admin@docsphere.local",
    fullName: "Platform Administrator",
    role: "superadmin",
    password: PASSWORDS.superadmin,
  });

  // -------------------------------------------------------------------------
  // Organization + clinic
  // -------------------------------------------------------------------------
  const orgRows = await sql`
    INSERT INTO organizations (
      id, owner_user_id, name, slug, practice_type, plan_type,
      plan_price_inr, max_doctors, subscription_status
    ) VALUES (
      ${uuid()}, ${owner.id}, 'DocSphere Dehradun Network', 'docsphere-dehradun',
      'clinic', 'multi_clinic', 11299, 8, 'active'
    )
    ON CONFLICT (slug) DO UPDATE SET
      owner_user_id = EXCLUDED.owner_user_id,
      name = EXCLUDED.name,
      max_doctors = EXCLUDED.max_doctors,
      subscription_status = 'active'
    RETURNING id
  `;
  const orgId = orgRows[0].id;

  const clinicRows = await sql`
    INSERT INTO clinics (
      id, organization_id, slug, name, practice_type, tagline, about,
      phone, whatsapp_number, email, reg_number, gstin, abdm_facility_id,
      nabl_cert_no, upi_vpa, address_line, city, state, postal_code,
      latitude, longitude, consultation_fee, followup_fee, followup_validity_days,
      doctor_split_percentage, subscription_plan, subscription_status,
      status, is_verified, consultation_fee_default
    ) VALUES (
      ${uuid()}, ${orgId}, 'docsphere-demo-clinic', 'DocSphere Multispecialty Clinic',
      'clinic', 'Zero-markup, doctor-first care in Dehradun',
      'A fully seeded local clinic used to exercise every ClinicOS workflow.',
      '0135-2740001', '919876500001', 'care@docsphere.local',
      'UKMC/CLINIC/2026/0912', '05ABCDE1234F1Z5', 'IN0510001298',
      'NABL-MP-2026-0182', 'docsphere@upi', '12 Rajpur Road, Dalanwala',
      'Dehradun', 'Uttarakhand', '248001', 30.3255, 78.0436,
      800, 400, 7, 80, 'multi_clinic', 'active', 'active', true, 800
    )
    ON CONFLICT (slug) DO UPDATE SET
      organization_id = EXCLUDED.organization_id,
      name = EXCLUDED.name,
      status = 'active',
      is_verified = true,
      phone = EXCLUDED.phone,
      address_line = EXCLUDED.address_line,
      updated_at = NOW()
    RETURNING id, slug, name
  `;
  const clinic = clinicRows[0];

  for (const [user, role] of [
    [owner, "owner"],
    [doctorUser, "doctor"],
    [reception, "receptionist"],
    [pharmacist, "staff"],
  ]) {
    await sql`
      INSERT INTO clinic_memberships (id, clinic_id, user_id, role, is_primary, is_active)
      VALUES (${uuid()}, ${clinic.id}, ${user.id}, ${role}, true, true)
      ON CONFLICT (clinic_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_active = true
    `;
  }

  // -------------------------------------------------------------------------
  // Doctors
  // -------------------------------------------------------------------------
  const doctorSeed = [
    {
      slug: "dr-rahul-sharma",
      full_name: "Dr. Rahul Sharma",
      phone: owner.phone,
      user_id: owner.id,
      specialization: "Dermatology",
      qualification_summary: "MD (Dermatology), FAAD",
      reg: "UKMC-8942-2012",
      exp: 14,
      fee: 1600,
      chamber: "Chamber 1 - Dermatology",
      services: ["Acne & Scar Treatment", "Laser Therapy", "Hair Loss", "Skin Allergy"],
      bio: "Senior dermatologist with 14 years of clinical experience in medical and cosmetic dermatology.",
    },
    {
      slug: "dr-aditi-joshi",
      full_name: "Dr. Aditi Joshi",
      phone: doctorUser.phone,
      user_id: doctorUser.id,
      specialization: "Dentistry",
      qualification_summary: "MDS (Endodontics & Dental Surgery)",
      reg: "UDC-4120-2016",
      exp: 9,
      fee: 1400,
      chamber: "Chamber 2 - Dental Suite",
      services: ["Root Canal", "Scaling & Polishing", "Crowns", "Paediatric Dentistry"],
      bio: "Endodontist focused on painless single-visit root canal therapy.",
    },
    {
      slug: "dr-vikram-sethi",
      full_name: "Dr. Vikram Sethi",
      phone: "9876500005",
      user_id: null,
      specialization: "Pediatrics",
      qualification_summary: "DNB (Pediatrics & Neonatology)",
      reg: "UKMC-7312-2011",
      exp: 16,
      fee: 1500,
      chamber: "Chamber 3 - Child Care",
      services: ["Newborn Care", "Vaccination", "Growth Monitoring", "Child Asthma"],
      bio: "Paediatrician and neonatologist with a special interest in childhood asthma.",
    },
    {
      slug: "dr-neha-kapoor",
      full_name: "Dr. Neha Kapoor",
      phone: "9876500006",
      user_id: null,
      specialization: "Physiotherapy & Rehabilitation",
      qualification_summary: "MPT (Orthopaedics)",
      reg: "UKPT-2210-2018",
      exp: 7,
      fee: 1000,
      chamber: "Rehab Studio",
      services: ["Sports Injury Rehab", "Post-operative Rehab", "Back & Neck Pain", "TENS Therapy"],
      bio: "Orthopaedic physiotherapist running the clinic's rehabilitation programme.",
    },
  ];

  const doctors = {};
  for (const doc of doctorSeed) {
    const rows = await sql`
      INSERT INTO doctors (
        id, slug, full_name, title, specialization, qualification_summary,
        medical_council_reg_number, medical_council_state, years_of_experience,
        languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days,
        doctor_split_percentage, chamber_name, services_offered, verification_status,
        rating, total_reviews, clinic_id, user_id, clinic_name, clinic_slug,
        clinic_address, opd_timings, phone, email, is_active
      ) VALUES (
        ${uuid()}, ${doc.slug}, ${doc.full_name}, 'Dr.', ${doc.specialization},
        ${doc.qualification_summary}, ${doc.reg}, 'Uttarakhand Medical Council',
        ${doc.exp}, ${JSON.stringify(["English", "Hindi"])}::jsonb, ${doc.bio},
        ${doc.fee}, ${Math.round(doc.fee * 0.5)}, 7, 80, ${doc.chamber},
        ${JSON.stringify(doc.services)}::jsonb, 'verified', 4.8, 0,
        ${clinic.id}, ${doc.user_id}, ${clinic.name}, ${clinic.slug},
        '12 Rajpur Road, Dalanwala, Dehradun', '10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM',
        ${doc.phone}, ${doc.slug + "@docsphere.local"}, true
      )
      ON CONFLICT (slug) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        user_id = EXCLUDED.user_id,
        clinic_id = EXCLUDED.clinic_id,
        verification_status = 'verified',
        is_active = true,
        updated_at = NOW()
      RETURNING id, slug, full_name, phone, specialization, medical_council_reg_number
    `;
    doctors[doc.slug] = rows[0];

    await sql`
      INSERT INTO doctor_schedules (
        id, clinic_id, clinic_slug, doctor_slug, doctor_name, specialization,
        chamber_name, working_days, start_time, end_time, slot_duration, is_active
      ) VALUES (
        ${uuid()}, ${clinic.id}, ${clinic.slug}, ${doc.slug}, ${doc.full_name},
        ${doc.specialization}, ${doc.chamber},
        ${JSON.stringify(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])}::jsonb,
        '10:00', '20:00', 15, true
      )
      ON CONFLICT (clinic_id, doctor_slug) DO UPDATE SET
        doctor_name = EXCLUDED.doctor_name,
        chamber_name = EXCLUDED.chamber_name,
        is_active = true,
        updated_at = NOW()
    `;

    await sql`
      INSERT INTO doctor_compensation_contracts (
        id, doctor_id, clinic_id, split_pct, consumables_policy, effective_from, created_by
      ) VALUES (
        ${"seed-cc-" + doc.slug}, ${String(doctors[doc.slug].id)}, ${String(clinic.id)},
        80, 'deduct_actual', CURRENT_DATE - 30, 'seed'
      )
      ON CONFLICT (id) DO UPDATE SET split_pct = 80, effective_from = CURRENT_DATE - 30
    `;
  }

  // -------------------------------------------------------------------------
  // Patients (EMR)
  // -------------------------------------------------------------------------
  const patientSeed = [
    ["UHID-2026-1001", "Aarav Mehta", "9812345601", "1991-04-12", 35, "Male", "O+", ["Penicillin"], ["Hypertension"]],
    ["UHID-2026-1002", "Saanvi Rawat", "9812345602", "1996-08-23", 30, "Female", "B+", [], []],
    ["UHID-2026-1003", "Kabir Singh", "9812345603", "1978-01-09", 48, "Male", "A+", ["Sulfa Drugs"], ["Type 2 Diabetes"]],
    ["UHID-2026-1004", "Ishita Negi", "9812345604", "2016-11-30", 9, "Female", "O-", [], ["Childhood Asthma"]],
    ["UHID-2026-1005", "Rohan Bisht", "9812345605", "1985-06-17", 40, "Male", "AB+", ["Ibuprofen"], []],
    ["UHID-2026-1006", "Meher Kaur", "9812345606", "2002-02-14", 24, "Female", "B-", [], ["PCOS"]],
    ["UHID-2026-1007", "Devansh Pant", "9812345607", "1959-09-05", 67, "Male", "A-", [], ["Osteoarthritis", "Hypertension"]],
    ["UHID-2026-1008", "Anaya Joshi", "9812345608", "2019-12-19", 6, "Female", "O+", ["Dust"], ["Allergic Rhinitis"]],
  ];

  const patients = {};
  for (const [uhid, name, phone, dob, age, gender, blood, allergies, chronic] of patientSeed) {
    const rows = await sql`
      INSERT INTO emr_patients (
        id, uhid, full_name, phone, dob, age, gender, blood_group, city, state,
        chronic_conditions, chronic_allergies, is_duplicate_flagged
      ) VALUES (
        ${uuid()}, ${uhid}, ${name}, ${phone}, ${dob}, ${age}, ${gender}, ${blood},
        'Dehradun', 'Uttarakhand', ${JSON.stringify(chronic)}::jsonb,
        ${JSON.stringify(allergies)}::jsonb, false
      )
      ON CONFLICT (uhid) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        age = EXCLUDED.age,
        blood_group = EXCLUDED.blood_group,
        updated_at = NOW()
      RETURNING uhid, full_name, phone
    `;
    patients[uhid] = rows[0];
  }

  const allergySeed = [
    ["UHID-2026-1001", "Penicillin", "J01CA04", "SEVERE_ANAPHYLAXIS", "Anaphylaxis after oral amoxicillin in 2018."],
    ["UHID-2026-1003", "Sulfa Drugs", "J01EE01", "MODERATE_HIVES", "Generalised urticaria after cotrimoxazole."],
    ["UHID-2026-1005", "Ibuprofen", "M01AE01", "MILD_RASH", "Localised rash after NSAID use."],
    ["UHID-2026-1008", "Dust", "N/A", "MODERATE_HIVES", "Seasonal allergic rhinitis with dust exposure."],
  ];
  for (const [uhid, allergen, atc, severity, description] of allergySeed) {
    const existing = await sql`
      SELECT id FROM emr_allergies WHERE patient_uhid = ${uhid} AND allergen_name = ${allergen} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO emr_allergies (
          id, patient_uhid, allergen_name, atc_code, reaction_severity,
          reaction_description, is_active, logged_by
        ) VALUES (
          ${uuid()}, ${uhid}, ${allergen}, ${atc}, ${severity}, ${description}, true, 'Seed clinician'
        )
      `;
    }
  }

  // -------------------------------------------------------------------------
  // Today's OPD queue + prescription history
  // -------------------------------------------------------------------------
  const queue = [
    ["DEMO-APT-001", "dr-rahul-sharma", "Aarav Mehta", "9812345601", "Male", 35, "09:30", 1, "completed", "paid", "cash", "Recurring acne on cheeks"],
    ["DEMO-APT-002", "dr-rahul-sharma", "Saanvi Rawat", "9812345602", "Female", 30, "09:45", 2, "in_consultation", "paid", "online_upi", "Hair fall and scalp itching"],
    ["DEMO-APT-003", "dr-rahul-sharma", "Rohan Bisht", "9812345605", "Male", 40, "10:00", 3, "waiting", "paid", "counter_soundbox", "Fungal infection on feet"],
    ["DEMO-APT-004", "dr-aditi-joshi", "Kabir Singh", "9812345603", "Male", 48, "10:15", 1, "completed", "paid", "cash", "Tooth sensitivity, upper left molar"],
    ["DEMO-APT-005", "dr-aditi-joshi", "Meher Kaur", "9812345606", "Female", 24, "10:30", 2, "waiting", "paid", "online_upi", "Routine dental cleaning"],
    ["DEMO-APT-006", "dr-vikram-sethi", "Ishita Negi", "9812345604", "Female", 9, "10:45", 1, "calling", "paid", "cash", "Cough and mild fever for 2 days"],
    ["DEMO-APT-007", "dr-vikram-sethi", "Anaya Joshi", "9812345608", "Female", 6, "11:00", 2, "waiting", "pending", "cash", "Sneezing and runny nose"],
    ["DEMO-APT-008", "dr-neha-kapoor", "Devansh Pant", "9812345607", "Male", 67, "11:15", 1, "waiting", "paid", "online_upi", "Knee pain while walking"],
  ];

  for (const [
    number, docSlug, patientName, patientPhone, gender, age, slot, token,
    status, payment, mode, symptoms,
  ] of queue) {
    const doc = doctors[docSlug];
    await sql`
      INSERT INTO appointments (
        id, appointment_number, clinic_id, doctor_id, doctor_slug, doctor_name,
        clinic_name, patient_name, patient_phone, patient_gender, patient_age,
        appointment_date, time_slot, token_number, status, fee_amount,
        payment_status, payment_mode, symptoms_description, source
      ) VALUES (
        ${uuid()}, ${number}, ${clinic.id}, ${doc.id}, ${docSlug}, ${doc.full_name},
        ${clinic.name}, ${patientName}, ${patientPhone}, ${gender}, ${age},
        ${today}, ${slot}, ${token}, ${status}, 800,
        ${payment}, ${mode}, ${symptoms}, 'walk_in'
      )
      ON CONFLICT (appointment_number) DO UPDATE SET
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        appointment_date = EXCLUDED.appointment_date,
        token_number = EXCLUDED.token_number,
        updated_at = NOW()
    `;
  }

  // A small completed-visit history for the consultation screen.
  const history = [
    ["DEMO-HIST-001", "dr-rahul-sharma", "Aarav Mehta", "9812345601", "Male", 35, 2],
    ["DEMO-HIST-002", "dr-aditi-joshi", "Kabir Singh", "9812345603", "Male", 48, 1],
    ["DEMO-HIST-003", "dr-vikram-sethi", "Ishita Negi", "9812345604", "Female", 9, 3],
  ];
  for (const [number, docSlug, patientName, patientPhone, gender, age, token] of history) {
    const doc = doctors[docSlug];
    await sql`
      INSERT INTO appointments (
        id, appointment_number, clinic_id, doctor_id, doctor_slug, doctor_name,
        clinic_name, patient_name, patient_phone, patient_gender, patient_age,
        appointment_date, time_slot, token_number, status, fee_amount,
        payment_status, payment_mode, symptoms_description, source
      ) VALUES (
        ${uuid()}, ${number}, ${clinic.id}, ${doc.id}, ${docSlug}, ${doc.full_name},
        ${clinic.name}, ${patientName}, ${patientPhone}, ${gender}, ${age},
        ${yesterday}, '11:00', ${token}, 'completed', 800, 'paid', 'cash',
        'Follow-up consultation', 'walk_in'
      )
      ON CONFLICT (appointment_number) DO UPDATE SET status = 'completed'
    `;
  }

  const prescriptionSeed = [
    {
      number: "RX-DEMO-1001",
      appointment: "DEMO-APT-001",
      docSlug: "dr-rahul-sharma",
      patient: "Aarav Mehta",
      phone: "9812345601",
      age: 35,
      gender: "Male",
      diagnosis: "Moderate inflammatory acne vulgaris",
      items: [
        { medicine: "ADAPALENE", dose: "0.1% gel", frequency: "0-0-1", duration: 30, timing: "After Food" },
        { medicine: "DOXYCYCLINE", dose: "100 mg", frequency: "1-0-0", duration: 14, timing: "After Food" },
        { medicine: "BENZOYL PEROXIDE", dose: "2.5% wash", frequency: "1-0-0", duration: 30, timing: "After Food" },
      ],
      labs: ["CBC", "LFT"],
    },
    {
      number: "RX-DEMO-1002",
      appointment: "DEMO-APT-004",
      docSlug: "dr-aditi-joshi",
      patient: "Kabir Singh",
      phone: "9812345603",
      age: 48,
      gender: "Male",
      diagnosis: "Reversible pulpitis, 26",
      items: [
        { medicine: "AMOXICILLIN + CLAVULANIC ACID", dose: "625 mg", frequency: "1-0-1", duration: 5, timing: "After Food" },
        { medicine: "PARACETAMOL", dose: "650 mg", frequency: "SOS", duration: 3, timing: "After Food" },
      ],
      labs: [],
    },
  ];

  for (const rx of prescriptionSeed) {
    const doc = doctors[rx.docSlug];
    await sql`
      INSERT INTO prescriptions (
        id, prescription_number, appointment_number, clinic_id, doctor_name,
        doctor_reg_number, clinic_name, clinic_address, patient_name, patient_phone,
        patient_age, patient_gender, vitals, symptoms, provisional_diagnosis,
        diagnosis_codes, items, lab_tests, procedures, diet_advice, clinical_notes,
        instructions, followup_date, digital_signature_hash, qr_verification_code,
        signed_by, dispensed_status
      ) VALUES (
        ${uuid()}, ${rx.number}, ${rx.appointment}, ${clinic.id}, ${doc.full_name},
        ${doc.medical_council_reg_number}, ${clinic.name},
        '12 Rajpur Road, Dalanwala, Dehradun', ${rx.patient}, ${rx.phone},
        ${rx.age}, ${rx.gender}, ${JSON.stringify({ bp: "120/80", pulse: 76, temp: 98.4, spo2: 98, weight: 72 })}::jsonb,
        ${JSON.stringify(["Itching", "Lesions"]) }::jsonb, ${rx.diagnosis},
        ${JSON.stringify([{ code: "L70.0", label: "Acne vulgaris" }])}::jsonb,
        ${JSON.stringify(rx.items)}::jsonb, ${JSON.stringify(rx.labs)}::jsonb,
        '[]'::jsonb, 'Low-glycaemic diet, 3 L water/day', 'No picking lesions.',
        'Apply sunscreen daily. Review in 4 weeks.', ${future(28)},
        ${crypto.createHash("sha256").update(rx.number + rx.patient).digest("hex")},
        ${"RXQ-" + rx.number.slice(-4)}, ${doc.full_name}, 'pending'
      )
      ON CONFLICT (prescription_number) DO UPDATE SET
        items = EXCLUDED.items,
        provisional_diagnosis = EXCLUDED.provisional_diagnosis
    `;
  }

  // -------------------------------------------------------------------------
  // Pharmacy
  // -------------------------------------------------------------------------
  const pharmacySeed = [
    ["DOLO 650", "Paracetamol", "Tablet", "650mg", "B-DOLO-2401", future(540), 320, 40, 18, 30, 12, "A-1"],
    ["AUGMENTIN 625", "Amoxicillin + Clavulanic Acid", "Tablet", "625mg", "B-AUG-2318", future(300), 140, 30, 118, 165, 12, "A-2"],
    ["PAN 40", "Pantoprazole", "Tablet", "40mg", "B-PAN-2210", future(420), 210, 40, 62, 95, 12, "A-3"],
    ["MONTEK LC", "Montelukast + Levocetirizine", "Tablet", "10mg/5mg", "B-MON-2405", future(360), 96, 25, 128, 180, 12, "B-1"],
    ["ADAPALENE GEL", "Adapalene", "Gel", "0.1%", "B-ADA-2411", future(270), 48, 12, 210, 285, 12, "B-2"],
    ["DOXY 100", "Doxycycline", "Capsule", "100mg", "B-DOX-2309", future(240), 75, 20, 54, 82, 12, "B-3"],
    ["BETADINE OINTMENT", "Povidone Iodine", "Ointment", "5%", "B-BET-2402", future(600), 60, 15, 72, 105, 12, "C-1"],
    ["CETIRIZINE 10", "Cetirizine", "Tablet", "10mg", "B-CET-2410", future(480), 180, 35, 12, 24, 12, "C-2"],
    ["SALBUTAMOL INHALER", "Salbutamol", "Inhaler", "100mcg", "B-SAL-2311", future(330), 22, 8, 168, 235, 12, "C-3"],
    ["METFORMIN 500", "Metformin", "Tablet", "500mg", "B-MET-2406", future(390), 240, 50, 22, 38, 12, "D-1"],
    ["TELMA 40", "Telmisartan", "Tablet", "40mg", "B-TEL-2403", future(450), 150, 30, 48, 72, 12, "D-2"],
    ["VITAMIN D3", "Cholecalciferol", "Sachet", "60K IU", "B-VIT-2412", future(510), 80, 20, 28, 45, 12, "D-3"],
  ];

  for (const [brand, generic, form, strength, batch, expiry, stock, reorder, purchase, mrp, gst, rack] of pharmacySeed) {
    const existing = await sql`
      SELECT id FROM pharmacy_items
      WHERE clinic_slug = ${clinic.slug} AND brand_name = ${brand} AND batch_number = ${batch}
      LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO pharmacy_items (
          id, clinic_slug, brand_name, generic_name, dosage_form, strength,
          batch_number, expiry_date, current_stock, reorder_level, purchase_price,
          mrp, selling_price, gst_rate, rack_location, manufacturer, hsn_code,
          supplier_name, supplier_id, supplier_return_window_days, schedule_type
        ) VALUES (
          ${uuid()}, ${clinic.slug}, ${brand}, ${generic}, ${form}, ${strength},
          ${batch}, ${expiry}, ${stock}, ${reorder}, ${purchase}, ${mrp}, ${mrp},
          ${gst}, ${rack}, 'Cipla Healthcare', '3004', 'MedPlus Distributors',
          'SUP-001', 30, 'NON_SCHEDULE'
        )
      `;
    }
  }

  const dispenseRows = await sql`
    INSERT INTO pharmacy_dispenses (
      id, clinic_slug, bill_number, prescription_number, patient_name, patient_phone,
      doctor_name, items, subtotal, discount, gst_amount, total_amount,
      payment_mode, status, net_paid, created_at
    ) VALUES (
      ${uuid()}, ${clinic.slug}, 'PH-DEMO-1001', 'RX-DEMO-1001', 'Aarav Mehta',
      '9812345601', 'Dr. Rahul Sharma',
      ${JSON.stringify([{ item_id: "seed", brand_name: "DOLO 650", quantity: 10, unit_price: 30 }])}::jsonb,
      300, 0, 36, 336, 'cash', 'dispensed', 336, NOW()
    )
    ON CONFLICT (bill_number) DO UPDATE SET total_amount = 336, net_paid = 336
    RETURNING id
  `;
  void dispenseRows;

  // -------------------------------------------------------------------------
  // Lab orders
  // -------------------------------------------------------------------------
  const labSeed = [
    ["LAB-DEMO-2001", "DEMO-APT-001", "RX-DEMO-1001", "Aarav Mehta", "9812345601", 35, "Male", "Dr. Rahul Sharma", "Complete Blood Count (CBC)", "Haematology", "Blood", "EDTA", "completed", true],
    ["LAB-DEMO-2002", "DEMO-APT-004", "RX-DEMO-1002", "Kabir Singh", "9812345603", 48, "Male", "Dr. Aditi Joshi", "Liver Function Test (LFT)", "Biochemistry", "Blood", "SST", "results_entered", false],
    ["LAB-DEMO-2003", "DEMO-APT-006", "RX-DEMO-1002", "Ishita Negi", "9812345604", 9, "Female", "Dr. Vikram Sethi", "HbA1c", "Biochemistry", "Blood", "EDTA", "sample_collected", false],
    ["LAB-DEMO-2004", "DEMO-APT-002", "RX-DEMO-1001", "Saanvi Rawat", "9812345602", 30, "Female", "Dr. Rahul Sharma", "Thyroid Profile (T3/T4/TSH)", "Biochemistry", "Blood", "SST", "ordered", false],
  ];

  const labResults = [
    { parameter: "Haemoglobin", value: 14.2, unit: "g/dL", reference_min: 13.0, reference_max: 17.0, flag: "NORMAL" },
    { parameter: "WBC", value: 7600, unit: "/µL", reference_min: 4000, reference_max: 11000, flag: "NORMAL" },
    { parameter: "Platelets", value: 242000, unit: "/µL", reference_min: 150000, reference_max: 450000, flag: "NORMAL" },
  ];

  for (const [orderNumber, appointment, prescription, patient, phone, age, gender, doctor, test, category, sample, tube, status, critical] of labSeed) {
    const appointmentRow = await sql`
      SELECT id FROM appointments WHERE appointment_number = ${appointment} LIMIT 1
    `;
    const prescriptionRow = await sql`
      SELECT id FROM prescriptions WHERE prescription_number = ${prescription} LIMIT 1
    `;
    await sql`
      INSERT INTO diagnostic_lab_orders (
        id, clinic_slug, order_number, appointment_id, prescription_id, sample_barcode,
        patient_name, patient_phone, patient_age, patient_gender, doctor_name,
        test_name, category, sample_type, vacutainer_tube, fasting_required,
        tat_sla_minutes, status, results, critical_value_alert, verified_by,
        pathologist_reg_no, verified_at
      ) VALUES (
        ${uuid()}, ${clinic.slug}, ${orderNumber},
        ${appointmentRow[0]?.id ?? null}, ${prescriptionRow[0]?.id ?? null},
        ${"BC-" + orderNumber.slice(-4)}, ${patient}, ${phone}, ${age}, ${gender},
        ${doctor}, ${test}, ${category}, ${sample}, ${tube}, true, 240, ${status},
        ${JSON.stringify(status === "completed" ? labResults : [])}::jsonb,
        ${critical}, ${status === "completed" ? "Dr. P. K. Uniyal" : null},
        ${status === "completed" ? "NABL-PATH-2211" : null},
        ${status === "completed" ? new Date().toISOString() : null}
      )
      ON CONFLICT (order_number) DO UPDATE SET
        status = EXCLUDED.status,
        results = EXCLUDED.results,
        updated_at = NOW()
    `;
  }

  // -------------------------------------------------------------------------
  // Inpatient beds
  // -------------------------------------------------------------------------
  const wardSeed = [
    ["General Ward", "general", 1800, 120],
    ["Private Deluxe", "private_deluxe", 4200, 260],
    ["Daycare Recovery", "daycare_recovery", 2400, 160],
    ["ICU", "icu", 7500, 480],
  ];
  const wards = {};
  for (const [name, type, daily, hourly] of wardSeed) {
    const existing = await sql`
      SELECT id FROM clinic_wards WHERE clinic_slug = ${clinic.slug} AND name = ${name} LIMIT 1
    `;
    if (existing.length > 0) {
      wards[name] = existing[0].id;
    } else {
      const rows = await sql`
        INSERT INTO clinic_wards (id, clinic_slug, name, ward_type, daily_rate, hourly_rate, total_beds)
        VALUES (${uuid()}, ${clinic.slug}, ${name}, ${type}, ${daily}, ${hourly}, 3)
        RETURNING id
      `;
      wards[name] = rows[0].id;
    }
  }

  const bedSeed = [
    ["G-101", "General Ward"], ["G-102", "General Ward"], ["G-103", "General Ward"],
    ["P-101", "Private Deluxe"], ["P-102", "Private Deluxe"], ["P-103", "Private Deluxe"],
    ["D-101", "Daycare Recovery"], ["D-102", "Daycare Recovery"],
    ["ICU-01", "ICU"], ["ICU-02", "ICU"],
  ];
  for (const [bedNumber, wardName] of bedSeed) {
    const existing = await sql`
      SELECT id FROM clinic_beds WHERE clinic_slug = ${clinic.slug} AND bed_number = ${bedNumber} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status)
        VALUES (${uuid()}, ${clinic.slug}, ${wards[wardName]}, ${bedNumber}, 'VACANT_CLEAN')
      `;
    }
  }

  // One active admission with charges and care tasks.
  const occupied = await sql`
    SELECT * FROM clinic_beds
    WHERE clinic_slug = ${clinic.slug} AND bed_number = 'P-101'
    LIMIT 1
  `;
  if (occupied.length > 0 && occupied[0].status === "VACANT_CLEAN") {
    const admissionId = uuid();
    await sql`
      INSERT INTO bed_admissions (
        id, clinic_slug, bed_id, bed_number, patient_name, patient_phone,
        doctor_name, admission_type, admission_timestamp, daily_rate, status
      ) VALUES (
        ${admissionId}, ${clinic.slug}, ${occupied[0].id}, 'P-101', 'Devansh Pant',
        '9812345607', 'Dr. Rahul Sharma', 'observation', NOW() - INTERVAL '6 hours',
        4200, 'active'
      )
    `;
    await sql`
      UPDATE clinic_beds SET
        status = 'OCCUPIED_ACTIVE',
        admission_id = ${admissionId},
        current_patient_name = 'Devansh Pant',
        current_patient_phone = '9812345607',
        assigned_doctor_name = 'Dr. Rahul Sharma',
        admission_notes = 'Observation for cellulitis; IV antibiotics started.',
        admission_timestamp = NOW() - INTERVAL '6 hours',
        active_vitals_protocol = 'standard',
        itemized_charges_total = 4200
      WHERE id = ${occupied[0].id}
    `;
    await sql`
      INSERT INTO bed_billing_ledger (
        id, clinic_slug, admission_id, bed_id, bed_number, charge_type,
        description, amount, posted_by, posted_at
      ) VALUES (
        ${uuid()}, ${clinic.slug}, ${admissionId}, ${occupied[0].id}, 'P-101',
        'base_tariff', 'Private Deluxe room charge (first 24h)', 4200,
        'System', NOW() - INTERVAL '6 hours'
      )
    `;
    for (const [type, description, due] of [
      ["vitals_check", "Intake baseline vitals (BP, pulse, SpO2, temperature)", "Within 15 minutes"],
      ["medication_admin", "IV antibiotic dose and line check", "Within 1 hour"],
    ]) {
      await sql`
        INSERT INTO bed_care_tasks (
          id, clinic_slug, bed_id, admission_id, task_type, description,
          due_time, assigned_to, status
        ) VALUES (
          ${uuid()}, ${clinic.slug}, ${occupied[0].id}, ${admissionId}, ${type},
          ${description}, ${due}, 'Duty nurse', 'pending'
        )
      `;
    }
  }

  // -------------------------------------------------------------------------
  // Finance: petty cash, expenses, insurance claims
  // -------------------------------------------------------------------------
  await sql`
    INSERT INTO clinic_petty_cash_float (
      id, clinic_slug, target_float, current_balance, min_threshold,
      last_replenished_at, last_replenished_by, status
    ) VALUES (
      ${uuid()}, ${clinic.slug}, 20000, 12500, 5000, NOW() - INTERVAL '2 days',
      'Meera Nair', 'HEALTHY'
    )
    ON CONFLICT (clinic_slug) DO UPDATE SET
      target_float = 20000,
      current_balance = GREATEST(clinic_petty_cash_float.current_balance, 12500),
      status = 'HEALTHY',
      updated_at = NOW()
  `;

  const expenseSeed = [
    ["Electricity bill - October", "Utilities", 8450, "online_upi"],
    ["Housekeeping consumables", "Consumables", 2150, "cash"],
    ["Clinic internet renewal", "Utilities", 1499, "online_upi"],
  ];
  for (const [title, category, amount, mode] of expenseSeed) {
    const existing = await sql`
      SELECT id FROM expenses WHERE clinic_slug = ${clinic.slug} AND title = ${title} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO expenses (
          id, clinic_slug, title, category, amount, payment_mode, receipt_number,
          date, recorded_by, approval_status, requires_approval, manager_pin_verified,
          ocr_verified, receipt_url, ocr_scanned_amt, ocr_vendor, duplicate_flag
        ) VALUES (
          ${uuid()}, ${clinic.slug}, ${title}, ${category}, ${amount}, ${mode},
          ${"EXP-" + Math.floor(Math.random() * 9000 + 1000)}, ${today},
          'Meera Nair', 'APPROVED', false, true, true, '/receipts/sample_voucher.png',
          ${amount}, 'Authorized Commercial Vendor', false
        )
      `;
    }
  }

  const claimSeed = [
    ["CLM-DEMO-3001", "Devansh Pant", "9812345607", "POL-88231", "Star Health", "Knee replacement - pre-auth", 185000, "pre_auth_submitted"],
    ["CLM-DEMO-3002", "Kabir Singh", "9812345603", "POL-44120", "HDFC ERGO", "Daycare procedure - dental", 32000, "approved"],
  ];
  for (const [claimNumber, patient, phone, policy, tpa, procedure, amount, status] of claimSeed) {
    await sql`
      INSERT INTO insurance_claims (
        id, claim_number, clinic_slug, patient_name, patient_phone, policy_number,
        tpa_company, procedure_code, procedure_name, estimated_amount,
        approved_amount, status, mandatory_docs_checklist, audit_trail
      ) VALUES (
        ${uuid()}, ${claimNumber}, ${clinic.slug}, ${patient}, ${phone}, ${policy},
        ${tpa}, 'PROC-001', ${procedure}, ${amount},
        ${status === "approved" ? amount * 0.9 : null}, ${status},
        ${JSON.stringify([
          { key: "id_proof", label: "Patient ID proof", verified: true },
          { key: "policy_copy", label: "Policy copy", verified: true },
          { key: "pre_auth_form", label: "Pre-auth form", verified: true },
        ])}::jsonb,
        ${JSON.stringify([{ at: new Date().toISOString(), action: "created" }])}::jsonb
      )
      ON CONFLICT (claim_number) DO UPDATE SET status = EXCLUDED.status
    `;
  }

  // -------------------------------------------------------------------------
  // Reviews, documents and an approved consultation report
  // -------------------------------------------------------------------------
  const reviews = [
    ["dr-rahul-sharma", "Aarav Mehta", 5, "Clear explanation and the acne cleared in a month."],
    ["dr-rahul-sharma", "Saanvi Rawat", 5, "Very patient and thorough."],
    ["dr-aditi-joshi", "Kabir Singh", 5, "Painless root canal. Highly recommend."],
    ["dr-vikram-sethi", "Ishita Negi", 4, "Good with children, short waiting time."],
    ["dr-neha-kapoor", "Devansh Pant", 5, "Knee pain improved after four sessions."],
  ];
  for (const [docSlug, patientName, rating, comment] of reviews) {
    const existing = await sql`
      SELECT id FROM reviews WHERE doctor_slug = ${docSlug} AND patient_name = ${patientName} LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO reviews (
          id, clinic_id, doctor_slug, patient_name, rating,
          waiting_time_rating, bedside_manner_rating, comment,
          verified_patient, is_verified_visit
        ) VALUES (
          ${uuid()}, ${clinic.id}, ${docSlug}, ${patientName}, ${rating},
          4.8, 5.0, ${comment}, true, true
        )
      `;
    }
  }

  for (const [phone, name, type, title] of [
    ["9812345601", "Aarav Mehta", "Lab Report", "CBC report - Oct 2026"],
    ["9812345603", "Kabir Singh", "Invoice", "Dental procedure invoice"],
  ]) {
    const existing = await sql`
      SELECT id FROM patient_documents
      WHERE clinic_id::text = ${String(clinic.id)} AND patient_phone = ${phone} AND title = ${title}
      LIMIT 1
    `;
    if (existing.length === 0) {
      await sql`
        INSERT INTO patient_documents (
          id, clinic_id, patient_phone, patient_name, document_type, title,
          file_name, file_size_kb, file_url, storage_path, is_private, doctor_notes
        ) VALUES (
          ${uuid()}, ${clinic.id}, ${phone}, ${name}, ${type}, ${title},
          ${title.toLowerCase().replace(/\s+/g, "-") + ".pdf"}, 240,
          '/demo-documents/sample-report.pdf', 'demo/sample-report.pdf', true,
          'Uploaded during the seeded consultation.'
        )
      `;
    }
  }

  const reportExisting = await sql`
    SELECT id FROM consultation_reports WHERE appointment_number = 'DEMO-APT-002' LIMIT 1
  `;
  if (reportExisting.length === 0) {
    const doc = doctors["dr-rahul-sharma"];
    await sql`
      INSERT INTO consultation_reports (
        id, clinic_id, appointment_number, patient_phone, patient_name,
        doctor_slug, doctor_name, language, duration_seconds, transcript,
        chief_complaints, provisional_diagnosis, vitals, medicines, lab_tests,
        doctor_report, patient_report, status, approved_by, approved_at
      ) VALUES (
        ${uuid()}, ${clinic.id}, 'DEMO-APT-002', '9812345602', 'Saanvi Rawat',
        'dr-rahul-sharma', ${doc.full_name}, 'en', 412,
        'Patient reports increasing hair fall over three months with scalp itching.',
        'Hair fall and scalp itching', 'Telogen effluvium with seborrhoeic scalp',
        ${JSON.stringify({ bp: "118/76", pulse: 72 })}::jsonb,
        ${JSON.stringify([{ medicine: "KETOCONAZOLE SHAMPOO", dose: "2%", frequency: "2x/week" }])}::jsonb,
        ${JSON.stringify(["CBC", "Ferritin", "TSH"])}::jsonb,
        ${JSON.stringify({ assessment: "Telogen effluvium", differentials: ["Iron deficiency", "Thyroid dysfunction"], red_flags: [] })}::jsonb,
        ${JSON.stringify({ summary: "Hair fall is likely stress and nutrition related.", next_steps: ["Blood tests", "Review in 4 weeks"] })}::jsonb,
        'approved', ${owner.id}, NOW()
      )
    `;
  }

  // -------------------------------------------------------------------------
  // Physiotherapy & rehabilitation
  // -------------------------------------------------------------------------
  const rehabPlanId = "11111111-1111-4111-8111-111111111111";
  const rehabPlanId2 = "22222222-2222-4222-8222-222222222222";
  const rehabExercises = [
    {
      name: "Active assisted knee flexion",
      sets: 3,
      reps: "12 reps",
      frequency: "BID",
      resistance: "Gravity",
      precautions: "Stop at pain > 5/10",
    },
    {
      name: "Quadriceps isometric set",
      sets: 3,
      reps: "10 reps × 5s",
      frequency: "TID",
      resistance: "Static isometric",
    },
    {
      name: "Straight leg raise",
      sets: 3,
      reps: "10 reps",
      frequency: "BID",
      resistance: "Bodyweight",
    },
  ];

  await sql`
    INSERT INTO therapy_plans (
      id, clinic_id, clinic_slug, patient_name, patient_phone, referring_doctor,
      therapist_name, approved_by, modification_status, current_version,
      consecutive_pain_spikes, doctor_escalated, condition_diagnosed,
      target_sessions, completed_sessions, start_date, review_date, status,
      goals, target_joint, movement_plane, baseline_rom, target_rom,
      baseline_vas, target_vas, prescribed_exercises, version_history
    ) VALUES (
      ${rehabPlanId}, ${clinic.id}, ${clinic.slug}, 'Devansh Pant', '9812345607',
      'Dr. Rohit Sureka (MS Ortho)', 'Dr. Neha Kapoor (PT)',
      'Dr. Neha Kapoor (PT)', 'approved', '1.1', 0, false,
      'Post-operative knee stiffness (right knee, TKA)',
      12, 4, ${today}, ${future(10)}, 'active',
      'Restore 0-120° knee flexion and independent stair climbing.',
      'Knee', 'Flexion', 62, 120, 7, 2,
      ${JSON.stringify(rehabExercises)}::jsonb,
      ${JSON.stringify([{ version: "1.0", created_at: new Date().toISOString(), created_by: "Dr. Neha Kapoor (PT)", approved_by: "Dr. Neha Kapoor (PT)", change_summary: "Initial post-operative protocol.", status: "superseded" }, { version: "1.1", created_at: new Date().toISOString(), created_by: "Dr. Neha Kapoor (PT)", approved_by: "Dr. Neha Kapoor (PT)", change_summary: "Added quadriceps isometrics at week 2.", status: "active" }])}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      patient_name = EXCLUDED.patient_name,
      completed_sessions = EXCLUDED.completed_sessions,
      updated_at = NOW()
  `;

  await sql`
    INSERT INTO therapy_plans (
      id, clinic_id, clinic_slug, patient_name, patient_phone, referring_doctor,
      therapist_name, approved_by, modification_status, current_version,
      consecutive_pain_spikes, doctor_escalated, condition_diagnosed,
      target_sessions, completed_sessions, start_date, review_date, status,
      goals, target_joint, movement_plane, baseline_rom, target_rom,
      baseline_vas, target_vas, prescribed_exercises, version_history
    ) VALUES (
      ${rehabPlanId2}, ${clinic.id}, ${clinic.slug}, 'Ishita Negi', '9812345604',
      'Dr. Vikram Sethi', 'Dr. Neha Kapoor (PT)', 'Dr. Neha Kapoor (PT)',
      'approved', '1.0', 0, false, 'Cervical posture strain',
      8, 2, ${today}, ${future(14)}, 'active',
      'Reduce neck pain and restore cervical rotation.',
      'Cervical Spine', 'Rotation', 48, 80, 6, 2,
      ${JSON.stringify([{ name: "Chin tuck", sets: 3, reps: "10 reps × 5s", frequency: "TID", resistance: "Bodyweight" }])}::jsonb,
      ${JSON.stringify([{ version: "1.0", created_at: new Date().toISOString(), created_by: "Dr. Neha Kapoor (PT)", approved_by: "Dr. Neha Kapoor (PT)", change_summary: "Initial ergonomic and mobility protocol.", status: "active" }])}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      patient_name = EXCLUDED.patient_name,
      updated_at = NOW()
  `;

  const rehabSessionSeed = [
    [1, 7, 5, 68, "Flexion", "TENS + cryotherapy", "Good (Grade 3/4)", "Tolerated well."],
    [2, 6, 4, 74, "Flexion", "Cryotherapy", "Good (Grade 3/4)", "Improved flexion, minimal swelling."],
    [3, 5, 4, 81, "Flexion", "Ultrasound + cryotherapy", "Good (Grade 4/4)", "Quadriceps activation improving."],
    [4, 5, 3, 88, "Flexion", "Cryotherapy", "Good (Grade 4/4)", "Home exercises consistent."],
  ];
  for (const [num, pre, post, rom, plane, modality, tolerance, notes] of rehabSessionSeed) {
    const sid = `33333333-3333-4333-8333-${String(num).padStart(12, "0")}`;
    await sql`
      INSERT INTO therapy_sessions (
        id, clinic_slug, plan_id, session_number, session_date, pain_score_before,
        pain_score_after, rom_joint, rom_plane, rom_degrees, rom_method,
        rom_laterality, range_of_motion, modality_applied, tolerance_rating,
        exercises_performed, homework_assigned, escalation_flag, therapist_notes
      ) VALUES (
        ${sid}, ${clinic.slug}, ${rehabPlanId}, ${num}, NOW() - ${`${4 - num} days`}::interval,
        ${pre}, ${post}, 'Knee', ${plane}, ${rom}, 'Universal Goniometer (360°)',
        'Right', ${`${plane}: ${rom}°`}, ${modality}, ${tolerance},
        ${JSON.stringify(rehabExercises.map((e) => ({ ...e, status: "complete" })))}::jsonb,
        ${JSON.stringify([{ name: "Heel slides", frequency: "BID", reps: "15 reps" }])}::jsonb,
        false, ${notes}
      )
      ON CONFLICT (id) DO UPDATE SET
        pain_score_before = EXCLUDED.pain_score_before,
        pain_score_after = EXCLUDED.pain_score_after,
        rom_degrees = EXCLUDED.rom_degrees
    `;
  }

  // -------------------------------------------------------------------------
  // ABDM / ABHA registry, consent artefacts and gateway audit
  // -------------------------------------------------------------------------
  const abdmPatientSeed = [
    ["44444444-4444-4444-8444-444444444444", "9812345601", "Aarav Mehta", "91-4819-2041-8891", "XXXX-XXXX-8891"],
    ["55555555-5555-4555-8555-555555555555", "9812345607", "Devansh Pant", "91-7723-5510-4432", "XXXX-XXXX-4432"],
  ];
  for (const [id, phone, name, abha, masked] of abdmPatientSeed) {
    await sql`
      INSERT INTO abdm_patients (
        id, clinic_id, clinic_slug, abha_number, abha_address, patient_name,
        patient_phone, masked_aadhaar, kyc_status, demographic_conflict, gateway_mode
      ) VALUES (
        ${id}, ${clinic.id}, ${clinic.slug}, ${abha},
        ${`${name.toLowerCase().replace(/[^a-z0-9]/g, "")}${phone.slice(-4)}@abdm`},
        ${name}, ${phone}, ${masked}, 'VERIFIED', false, 'SANDBOX_M1_M2'
      )
      ON CONFLICT (id) DO UPDATE SET
        abha_number = EXCLUDED.abha_number,
        kyc_status = 'VERIFIED',
        updated_at = NOW()
    `;
  }

  const consentSeed = [
    ["CA-REQ-2026-1001", "Aarav Mehta", "9812345601", "91-4819-2041-8891", "CAREFUL_EPISODE_MANAGEMENT", "GRANTED"],
    ["CA-REQ-2026-1002", "Devansh Pant", "9812345607", "91-7723-5510-4432", "CAREMANAGEMENT", "REQUESTED"],
  ];
  for (const [requestId, name, phone, abha, purpose, status] of consentSeed) {
    await sql`
      INSERT INTO abdm_consent_artefacts (
        id, clinic_id, clinic_slug, consent_request_id, patient_name, patient_phone,
        abha_number, abha_address, hiu_name, purpose_code, purpose_label,
        date_range_from, date_range_to, expiry_timestamp, status, access_count
      ) VALUES (
        ${uuid()}, ${clinic.id}, ${clinic.slug}, ${requestId}, ${name}, ${phone},
        ${abha}, ${`${name.toLowerCase().replace(/[^a-z0-9]/g, "")}${phone.slice(-4)}@abdm`},
        ${clinic.name}, ${purpose}, ${purpose === "CAREMANAGEMENT" ? "Care management" : "Careful episode management"},
        ${today}, ${future(90)}, ${future(7)}, ${status}, 0
      )
      ON CONFLICT (consent_request_id) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW()
    `;
  }

  const gatewayLogSeed = [
    ["/v2/registration/aadhaar/generateOtp", 200, 180],
    ["/v2/consent/v3/request", 202, 240],
  ];
  await sql`DELETE FROM abdm_gateway_logs WHERE transaction_id LIKE 'TXN-SEED-%'`;
  for (const [endpoint, statusCode, latency] of gatewayLogSeed) {
    await sql`
      INSERT INTO abdm_gateway_logs (
        id, clinic_id, clinic_slug, transaction_id, endpoint, method,
        status_code, latency_ms
      ) VALUES (
        ${uuid()}, ${clinic.id}, ${clinic.slug},
        ${`TXN-SEED-${endpoint.split("/").pop()}`}, ${endpoint}, 'POST',
        ${statusCode}, ${latency}
      )
    `;
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM user_accounts) AS users,
      (SELECT COUNT(*)::int FROM doctors) AS doctors,
      (SELECT COUNT(*)::int FROM emr_patients) AS patients,
      (SELECT COUNT(*)::int FROM appointments WHERE appointment_date = ${today}) AS today_appointments,
      (SELECT COUNT(*)::int FROM pharmacy_items) AS pharmacy_items,
      (SELECT COUNT(*)::int FROM diagnostic_lab_orders) AS lab_orders,
      (SELECT COUNT(*)::int FROM clinic_beds) AS beds
  `;

  console.log("\nSeed complete.");
  console.log(`  Clinic: ${clinic.name} (/${clinic.slug})`);
  console.log(`  Users: ${counts[0].users} | Doctors: ${counts[0].doctors} | Patients: ${counts[0].patients}`);
  console.log(
    `  Today's appointments: ${counts[0].today_appointments} | Pharmacy items: ${counts[0].pharmacy_items} | Lab orders: ${counts[0].lab_orders} | Beds: ${counts[0].beds}`
  );
  console.log("\nLocal sign-in credentials (from SEED_*_PASSWORD env; store them securely):");
  console.log(`  Owner       9876500001  ${process.env.SEED_OWNER_PASSWORD ? "(SEED_OWNER_PASSWORD)" : PASSWORDS.owner}`);
  console.log(`  Doctor      9876500002  ${process.env.SEED_DOCTOR_PASSWORD ? "(SEED_DOCTOR_PASSWORD)" : PASSWORDS.doctor}`);
  console.log(`  Reception   9876500003  ${process.env.SEED_STAFF_PASSWORD ? "(SEED_STAFF_PASSWORD)" : PASSWORDS.staff}`);
  console.log(`  Pharmacist  9876500004  ${process.env.SEED_STAFF_PASSWORD ? "(SEED_STAFF_PASSWORD)" : PASSWORDS.staff}`);
  console.log(`  Superadmin  9876500000  ${process.env.SEED_SUPERADMIN_PASSWORD ? "(SEED_SUPERADMIN_PASSWORD)" : PASSWORDS.superadmin}`);
  if (credentials.length > 0) {
    console.log(
      "\nNo SEED_*_PASSWORD variables were set, so random passwords were generated above."
    );
  }
}

main()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    if (error.detail) console.error(error.detail);
    if (process.env.DEBUG_SEED) console.error(error.stack);
    if (process.env.DEBUG_SEED && error.query) console.error("QUERY:", error.query);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
