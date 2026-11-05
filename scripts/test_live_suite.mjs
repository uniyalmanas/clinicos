import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(path.join(root, "apps", "web", ".env.local"));
loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, ".env"));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL);
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function testDatabaseSchema() {
  console.log("\n--- 1. Testing Supabase Database Schema & Tables ---");
  const requiredTables = [
    "user_accounts",
    "clinics",
    "clinic_memberships",
    "doctors",
    "emr_patients",
    "emr_allergies",
    "emr_clinical_visits",
    "emr_lab_vault",
    "appointments",
    "prescriptions",
    "pharmacy_items",
    "pharmacy_dispenses",
    "patient_documents",
    "expenses",
    "reviews",
    "audit_events",
    "rate_limits",
    "patient_otp_challenges",
    "patient_sessions",
    "patient_consents",
    "doctor_compensation_contracts",
    "payout_ledger",
    "invoice_sequences",
    "invoices",
    "bed_shift_handovers",
    "lis_quality_control_runs",
    "insurance_claims",
    "pharmacy_stock_transfers"
  ];

  const dbTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `;
  const tableNames = new Set(dbTables.map(t => t.table_name));

  for (const table of requiredTables) {
    assert(tableNames.has(table), `Table '${table}' exists in Supabase`);
  }

  // Clear rate limits for clean test execution
  await sql`DELETE FROM rate_limits WHERE key LIKE 'otp:%' OR key LIKE 'auth:login:%';`;

  console.log("\n--- 2. Checking Tenant-Scoping Columns on New Migrations ---");
  const checkColumn = async (table, column) => {
    const cols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = ${table} AND column_name = ${column};
    `;
    assert(cols.length > 0, `Table '${table}' has tenant column '${column}'`);
  };

  await checkColumn("bed_shift_handovers", "clinic_slug");
  await checkColumn("lis_quality_control_runs", "clinic_slug");
  await checkColumn("insurance_claims", "clinic_slug");
  await checkColumn("pharmacy_stock_transfers", "clinic_slug");
  await checkColumn("expenses", "clinic_slug");
  await checkColumn("patient_documents", "clinic_id");
}

async function testHttpEndpoints() {
  console.log("\n--- 3. Testing Public Endpoints (No Auth Needed) ---");

  // 3.1 Public doctors
  const doctorsRes = await fetch(`${BASE_URL}/api/doctors`);
  assert(doctorsRes.status === 200, "GET /api/doctors returns 200 OK");
  const doctorsData = await doctorsRes.json().catch(() => ({}));
  assert(Array.isArray(doctorsData) && doctorsData.length > 0, `GET /api/doctors returns array of doctors (${doctorsData.length})`);

  // 3.2 Public clinics
  const clinicsRes = await fetch(`${BASE_URL}/api/clinics`);
  assert(clinicsRes.status === 200, "GET /api/clinics returns 200 OK");

  // 3.3 Public reviews
  const reviewsRes = await fetch(`${BASE_URL}/api/reviews`);
  assert(reviewsRes.status === 200, "GET /api/reviews returns 200 OK");

  // 3.4 Live queue
  const queueRes = await fetch(`${BASE_URL}/api/appointments/live-queue?doctor_slug=dr-rohit-sureka`);
  assert(queueRes.status === 200, "GET /api/appointments/live-queue?doctor_slug=... returns 200 OK");

  console.log("\n--- 4. Testing Anonymous Access on Protected Endpoints (Must be 401) ---");

  // 4.1 EMR directory
  const patientsAnon = await fetch(`${BASE_URL}/api/patients`);
  assert(patientsAnon.status === 401, "GET /api/patients anonymous request returns 401 Unauthorized");

  // 4.2 Patient phone lookup
  const patientPhoneAnon = await fetch(`${BASE_URL}/api/patients/9123456780`);
  assert(patientPhoneAnon.status === 401, "GET /api/patients/[phone] anonymous request returns 401 Unauthorized");

  // 4.3 Expenses
  const expensesAnon = await fetch(`${BASE_URL}/api/expenses`);
  assert(expensesAnon.status === 401, "GET /api/expenses anonymous request returns 401 Unauthorized");

  // 4.4 Admin Master
  const adminAnon = await fetch(`${BASE_URL}/api/admin/master`);
  assert(adminAnon.status === 401, "GET /api/admin/master anonymous request returns 401 Unauthorized");

  console.log("\n--- 5. Testing Patient OTP Flow & Isolation ---");

  // 5.1 Request OTP for test phone 9123456780
  const otpReqRes = await fetch(`${BASE_URL}/api/patient/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9123456780" })
  });
  assert(otpReqRes.status === 200, "POST /api/patient/auth/request-otp returns 200 OK");
  const otpReqData = await otpReqRes.json().catch(() => ({}));

  // Read OTP code
  let otpCode = otpReqData.dev_otp;
  if (!otpCode) {
    const invalidRes = await fetch(`${BASE_URL}/api/patient/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "9123456780", otp: "000000" })
    });
    assert(invalidRes.status === 400 || invalidRes.status === 401, "POST /api/patient/auth/verify-otp rejects wrong code (400/401)");
  } else {
    const verifyRes = await fetch(`${BASE_URL}/api/patient/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "9123456780", otp: otpCode })
    });
    assert(verifyRes.status === 200, "POST /api/patient/auth/verify-otp returns 200 OK with dev OTP");
    const verifyData = await verifyRes.json().catch(() => ({}));
    const patientToken = verifyData.access_token;
    assert(Boolean(patientToken), "verify-otp returns valid access_token");

    // Test patient /me
    const patientMeRes = await fetch(`${BASE_URL}/api/patient/auth/me`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(patientMeRes.status === 200, "GET /api/patient/auth/me returns 200 OK for verified patient");

    // Test reading own record
    const ownRecordRes = await fetch(`${BASE_URL}/api/patients/9123456780`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(ownRecordRes.status === 200, "GET /api/patients/9123456780 returns 200 OK for own phone");

    // Test reading someone else's record (Privilege escalation attempt)
    const otherRecordRes = await fetch(`${BASE_URL}/api/patients/9876543210`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(otherRecordRes.status === 403, "GET /api/patients/9876543210 returns 403 FORBIDDEN for patient accessing other record");
  }

  console.log("\n--- 6. Testing Staff Authentication & Scoped Actions ---");

  // 6.1 Staff login with seed credentials
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "9876543210",
      password: "Password@123"
    })
  });
  assert(staffLoginRes.status === 200, "POST /api/auth/login returns 200 OK for clinic staff");
  const staffLoginData = await staffLoginRes.json().catch(() => ({}));
  const staffToken = staffLoginData.access_token || staffLoginData.token;
  assert(Boolean(staffToken), "Staff login returns JWT access_token");

  if (staffToken) {
    // 6.2 Staff /api/auth/me
    const staffMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffMeRes.status === 200, "GET /api/auth/me returns 200 OK with staff Bearer token");
    const staffMeData = await staffMeRes.json().catch(() => ({}));
    assert(Boolean(staffMeData.clinic_id), `Staff profile resolved active clinic_id: ${staffMeData.clinic_id}`);

    // 6.3 Staff EMR directory access
    const staffPatientsRes = await fetch(`${BASE_URL}/api/patients`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffPatientsRes.status === 200, "GET /api/patients returns 200 OK for authenticated staff");
    const staffPatientsData = await staffPatientsRes.json().catch(() => ({}));
    assert(Array.isArray(staffPatientsData.patients), `GET /api/patients returns scoped patient array (count: ${staffPatientsData.patients?.length ?? 0})`);

    // 6.4 Staff Expenses access
    const staffExpensesRes = await fetch(`${BASE_URL}/api/expenses`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffExpensesRes.status === 200, "GET /api/expenses returns 200 OK for authenticated staff");

    // 6.5 Staff attempting super-admin route (Must be 403)
    const staffAdminRes = await fetch(`${BASE_URL}/api/admin/master`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert(staffAdminRes.status === 403, "GET /api/admin/master returns 403 FORBIDDEN for regular clinic staff");
  }

  console.log("\n--- 7. Testing Super-Admin Authentication ---");

  // 7.1 Super admin login
  const superLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "superadmin",
      password: "Password@123"
    })
  });
  assert(superLoginRes.status === 200, "POST /api/auth/login returns 200 OK for superadmin");
  const superLoginData = await superLoginRes.json().catch(() => ({}));
  const superToken = superLoginData.access_token || superLoginData.token;
  assert(Boolean(superToken), "Superadmin login returns JWT access_token");

  if (superToken) {
    const superAdminRes = await fetch(`${BASE_URL}/api/admin/master`, {
      headers: { Authorization: `Bearer ${superToken}` }
    });
    assert(superAdminRes.status === 200, "GET /api/admin/master returns 200 OK for superadmin");
    const masterData = await superAdminRes.json().catch(() => ({}));
    assert(Array.isArray(masterData.clinics), `Superadmin master returns clinics fleet (${masterData.clinics?.length ?? 0} clinics)`);
  }

  console.log("\n--- 8. Testing Public Appointment Booking ---");
  const bookRes = await fetch(`${BASE_URL}/api/appointments/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doctor_slug: "dr-rohit-sureka",
      patient_name: "Test Verification Patient",
      patient_phone: "9876543299",
      appointment_date: new Date().toISOString().split("T")[0],
      time_slot: "Live OPD Token",
      consultation_type: "in_person",
      payment_mode: "cash"
    })
  });
  assert(bookRes.status === 200, "POST /api/appointments/book returns 200 OK");
  const bookData = await bookRes.json().catch(() => ({}));
  assert(Boolean(bookData.appointment?.token_number), `Token successfully reserved: #${bookData.appointment?.token_number}`);

  console.log("\n=======================================================");
  console.log(`FINAL TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");
}

async function main() {
  try {
    await testDatabaseSchema();
    await testHttpEndpoints();
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await sql.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

main();
