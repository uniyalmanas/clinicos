#!/usr/bin/env node
/**
 * Authenticated end-to-end smoke test.
 *
 * Logs in as each seeded role, then exercises every read API and the safe
 * write APIs. Fails (non-zero exit) on any 5xx, any unexpected 4xx, or any
 * SSR page that does not render.
 *
 * The dev server must be running on BASE_URL (default http://localhost:3000)
 * and the database must be seeded (`npm run seed`).
 *
 *   node scripts/smoke.mjs
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

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

loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, "apps", "web", ".env.local"));

const BASE = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const ACCOUNTS = {
  owner: { phone: "9876500001", password: process.env.SEED_OWNER_PASSWORD },
  doctor: { phone: "9876500002", password: process.env.SEED_DOCTOR_PASSWORD },
  reception: { phone: "9876500003", password: process.env.SEED_STAFF_PASSWORD },
  pharmacist: { phone: "9876500004", password: process.env.SEED_STAFF_PASSWORD },
  superadmin: { phone: "9876500000", password: process.env.SEED_SUPERADMIN_PASSWORD },
};

const CLINIC_SLUG = "docsphere-demo-clinic";
const PATIENT_PHONE = "9812345601";

const results = [];
let failures = 0;

function record(kind, name, status, detail) {
  const ok = status >= 200 && status < 300;
  if (!ok) failures += 1;
  results.push({ kind, name, status, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  const suffix = detail && !ok ? `  ${detail.slice(0, 300)}` : "";
  console.log(`[${mark}] ${String(status).padStart(3)} ${kind.padEnd(5)} ${name}${suffix}`);
}

async function request(session, method, pathname, body) {
  const headers = { accept: "application/json" };
  if (session?.cookie) headers.cookie = session.cookie;
  if (body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });

  let text = "";
  try {
    text = await res.text();
  } catch {
    text = "";
  }
  return { res, text };
}

async function login(role) {
  const account = ACCOUNTS[role];
  if (!account?.password) {
    record("auth", role, 0, "missing SEED_*_PASSWORD for this role");
    return null;
  }
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ phone: account.phone, password: account.password }),
  });
  const text = await res.text();
  const setCookie = res.headers.getSetCookie?.() || [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  record("auth", `login:${role}`, res.status, text);
  if (res.status !== 200 || !cookie) return null;
  let json = {};
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { cookie, json };
}

async function get(session, name, pathname) {
  const { res, text } = await request(session, "GET", pathname);
  let detail = text;
  if (res.status >= 300) {
    try {
      const j = JSON.parse(text);
      detail = j.error || j.message || text;
    } catch {
      /* keep raw */
    }
  }
  record("GET", name, res.status, detail);
  return { res, text };
}

async function post(session, name, pathname, body) {
  const { res, text } = await request(session, "POST", pathname, body ?? {});
  let detail = text;
  if (res.status >= 300) {
    try {
      const j = JSON.parse(text);
      detail = j.error || j.message || text;
    } catch {
      /* keep raw */
    }
  }
  record("POST", name, res.status, detail);
  return { res, text };
}

async function put(session, name, pathname, body) {
  const { res, text } = await request(session, "PUT", pathname, body ?? {});
  let detail = text;
  if (res.status >= 300) {
    try {
      const j = JSON.parse(text);
      detail = j.error || j.message || text;
    } catch {
      /* keep raw */
    }
  }
  record("PUT", name, res.status, detail);
  return { res, text };
}

async function page(session, name, pathname) {
  const { res, text } = await request(session, "GET", pathname);
  const okHtml =
    res.status === 200 &&
    (/<html/i.test(text) || /<!DOCTYPE html/i.test(text)) &&
    !/Application error: a server-side exception/i.test(text);
  const status = okHtml ? res.status : res.status === 200 ? 599 : res.status;
  record("PAGE", name, status, okHtml ? "" : text.slice(0, 400));
}

function idsFrom(result, key) {
  try {
    const json = JSON.parse(result.text);
    if (key) return json?.[key] || [];
    if (Array.isArray(json)) return json;
    return json?.data || json?.items || json?.orders || json?.beds || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log(`Smoke test against ${BASE}\n`);

  // ---------------------------------------------------------------- health
  await get(null, "/api/health", "/api/health");

  // ---------------------------------------------------------------- logins
  const sessions = {};
  for (const role of Object.keys(ACCOUNTS)) {
    sessions[role] = await login(role);
  }
  if (!sessions.owner) {
    console.error("\nOwner login failed; cannot run the clinic smoke suite.");
    return finish();
  }

  const owner = sessions.owner;

  // ------------------------------------------------------------ read APIs
  await get(owner, "/api/auth/me", "/api/auth/me");
  await get(owner, "/api/clinics", "/api/clinics");
  await get(owner, "/api/doctors", "/api/doctors");
  await get(owner, "/api/appointments", "/api/appointments");
  await get(
    owner,
    "/api/appointments/live-queue",
    `/api/appointments/live-queue?doctor_slug=dr-rahul-sharma`
  );
  await get(owner, "/api/waiting-room/queue", `/api/waiting-room/queue?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/patients", "/api/patients");
  await get(owner, "/api/patients/[phone]", `/api/patients/${PATIENT_PHONE}`);
  await get(owner, "/api/reviews", "/api/reviews");
  await get(owner, "/api/documents", "/api/documents");
  await get(owner, "/api/prescriptions/[id]", "/api/prescriptions/RX-DEMO-1001");

  const beds = await get(owner, "/api/beds", "/api/beds");
  const bedRows = idsFrom(beds, "beds");
  const firstBedId = bedRows[0]?.id;
  if (firstBedId) {
    await get(owner, "/api/beds/ledger", `/api/beds/ledger?bed_id=${firstBedId}`);
    await get(owner, "/api/beds/tasks", `/api/beds/tasks?bed_id=${firstBedId}`);
  }

  await get(owner, "/api/lab/orders", "/api/lab/orders");
  await get(owner, "/api/lab/qc", "/api/lab/qc");

  await get(owner, "/api/pharmacy/inventory", "/api/pharmacy/inventory");
  await get(owner, "/api/pharmacy/bills", "/api/pharmacy/bills");
  await get(owner, "/api/pharmacy/prescriptions-queue", "/api/pharmacy/prescriptions-queue");
  await get(owner, "/api/pharmacy/returns", "/api/pharmacy/returns");
  await get(owner, "/api/pharmacy/transfers", "/api/pharmacy/transfers");
  await get(owner, "/api/pharmacy/schedule-h1", "/api/pharmacy/schedule-h1");

  await get(owner, "/api/insurance/claims", "/api/insurance/claims");

  await get(owner, "/api/clinic/admin", `/api/clinic/admin?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/desk-queue", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/settlements", `/api/clinic/settlements?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/settlement", `/api/clinic/settlement?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/petty-cash", `/api/clinic/petty-cash?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/eod-summary", `/api/clinic/eod-summary?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/shifts", `/api/clinic/shifts?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/automations", `/api/clinic/automations?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/clinic/doctor-payouts", `/api/clinic/doctor-payouts?clinic_slug=${CLINIC_SLUG}`);
  await get(owner, "/api/doctors/schedules", "/api/doctors/schedules");
  await get(owner, "/api/doctors/blocked", "/api/doctors/blocked");
  await get(owner, "/api/expenses", "/api/expenses");
  await get(owner, "/api/consultations/reports", "/api/consultations/reports");
  await get(owner, "/api/rehab/plans", "/api/rehab/plans");
  await get(owner, "/api/abdm", "/api/abdm");
  await get(owner, "/api/abdm/fhir/[id]", "/api/abdm/fhir/DEMO-APT-001");

  // Public endpoints.
  await get(null, "public /check-in", `/api/check-in/public?clinic_slug=${CLINIC_SLUG}`);

  // Superadmin console.
  if (sessions.superadmin) {
    await get(sessions.superadmin, "/api/admin/master", "/api/admin/master");
  } else {
    record("GET", "/api/admin/master", 0, "no superadmin session");
  }

  // Doctor-scoped view.
  if (sessions.doctor) {
    await get(sessions.doctor, "doctor /api/auth/me", "/api/auth/me");
    await get(sessions.doctor, "doctor /api/appointments", "/api/appointments");
  }
  if (sessions.reception) {
    await get(sessions.reception, "reception /api/auth/me", "/api/auth/me");
    await get(
      sessions.reception,
      "reception /api/clinic/desk-queue",
      `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`
    );
  }
  if (sessions.pharmacist) {
    await get(
      sessions.pharmacist,
      "pharmacist /api/pharmacy/inventory",
      "/api/pharmacy/inventory"
    );
  }

  // ----------------------------------------------------------- write APIs
  // Queue transitions on the seeded token.
  await post(owner, "/api/clinic/call-token", "/api/clinic/call-token", {
    appointment_number: "DEMO-APT-003",
  });
  await post(owner, "/api/clinic/toggle-payment", "/api/clinic/toggle-payment", {
    appointment_number: "DEMO-APT-003",
  });
  await post(owner, "/api/clinic/complete-token", "/api/clinic/complete-token", {
    appointment_number: "DEMO-APT-003",
  });

  // Beds: admit into a vacant bed, post a charge, then discharge.
  const vacant = bedRows.find((b) => b.status === "VACANT_CLEAN");
  if (vacant) {
    const admitted = await post(owner, "/api/beds/admit", "/api/beds/admit", {
      bed_id: vacant.id,
      patient_name: "Smoke Test Patient",
      patient_phone: "9800000000",
      assigned_doctor_name: "Dr. Rahul Sharma",
      admission_type: "observation",
    });
    let admissionId;
    try {
      const json = JSON.parse(admitted.text);
      admissionId = json?.admission?.id || json?.admission_id || json?.id;
    } catch {
      /* ignore */
    }
    if (admissionId) {
      await post(owner, "/api/beds/ledger", "/api/beds/ledger", {
        admission_id: admissionId,
        bed_id: vacant.id,
        reason_code: "GOODWILL_DISCOUNT",
        original_amount: 400,
        adjusted_amount: 250,
        waiver_notes: "Smoke test billing override",
      });
      await post(owner, "/api/beds/discharge-order", "/api/beds/discharge-order", {
        admission_id: admissionId,
        bed_id: vacant.id,
      });
      await post(owner, "/api/beds/discharge", "/api/beds/discharge", {
        admission_id: admissionId,
        bed_id: vacant.id,
        doctor_signoff: true,
        pharmacy_reconciled: true,
        billing_settled: true,
        transport_ready: true,
      });
      // Return the bed to a clean, reusable state.
      await post(owner, "/api/beds/clean", "/api/beds/clean", {
        bed_id: vacant.id,
        action: "housekeeping_log",
        disinfection_method: "Terminal disinfection (smoke test)",
      });
      await post(owner, "/api/beds/clean", "/api/beds/clean", {
        bed_id: vacant.id,
        action: "nurse_qa",
        nurse_qa_esign: "Smoke Test Nurse",
      });
    }
  }

  // Lab lifecycle on a freshly created order (keeps the test idempotent).
  const apts = await get(owner, "/api/appointments", "/api/appointments");
  const aptRows = idsFrom(apts);
  const apt = aptRows[0];
  if (apt) {
    const created = await post(owner, "/api/lab/create-order", "/api/lab/create-order", {
      appointment_id: apt.id,
      patient_name: apt.patient_name,
      patient_phone: apt.patient_phone,
      patient_age: apt.patient_age,
      patient_gender: apt.patient_gender,
      doctor_name: apt.doctor_name,
      test_name: "Smoke Test Basic Panel",
      category: "Biochemistry",
      sample_type: "Blood",
      vacutainer_tube: "SST",
      fasting_required: true,
      tat_sla_minutes: 240,
    });
    let orderId;
    try {
      orderId = JSON.parse(created.text)?.order?.id;
    } catch {
      /* ignore */
    }
    if (orderId) {
      await post(owner, "/api/lab/sample-collect", "/api/lab/sample-collect", {
        order_id: orderId,
        collector_name: "Smoke Test Phlebotomist",
      });
      await post(owner, "/api/lab/accession", "/api/lab/accession", {
        order_id: orderId,
        accessioner_name: "Smoke Test Accessioner",
      });
      await post(owner, "/api/lab/results", "/api/lab/results", {
        order_id: orderId,
        results: [
          { parameter: "Glucose (F)", value: 92, unit: "mg/dL", reference_min: 70, reference_max: 100, flag: "NORMAL" },
        ],
        pathologist_notes: "Smoke test verification.",
        verified_by: "Dr. Smoke Pathologist",
        pathologist_reg_no: "NABL-SMOKE-001",
      });
    }
  }

  // Pharmacy stock adjustment.
  const inventory = await get(owner, "/api/pharmacy/inventory", "/api/pharmacy/inventory");
  const items = idsFrom(inventory, "items");
  if (items[0]?.id) {
    await post(owner, "/api/pharmacy/inventory/adjust-stock", "/api/pharmacy/inventory/adjust-stock", {
      item_id: items[0].id,
      new_stock: Number(items[0].current_stock) || 0,
      reason: "Smoke test stock reconciliation",
    });
  }

  // Expense create.
  await post(owner, "/api/expenses", "/api/expenses", {
    title: "Smoke test expense",
    category: "Consumables",
    amount: 120,
    payment_mode: "cash",
  });

  // Rehab: create a plan, log a session, then walk the protocol workflow.
  const rehabPlan = await post(owner, "/api/rehab/plans", "/api/rehab/plans", {
    patient_name: "Smoke Test Rehab Patient",
    patient_phone: "9800000001",
    referring_doctor: "Dr. Rohit Sureka",
    therapist_name: "Dr. Neha Kapoor (PT)",
    approved_by: "Dr. Neha Kapoor (PT)",
    condition_diagnosed: "Smoke test knee stiffness",
    target_sessions: 6,
    target_joint: "Knee",
    movement_plane: "Flexion",
    baseline_rom: 60,
    target_rom: 120,
    baseline_vas: 7,
    target_vas: 2,
    prescribed_exercises: [
      { name: "Heel slides", sets: 3, reps: "12", frequency: "BID", resistance: "Bodyweight" },
    ],
  });
  let rehabPlanId;
  try {
    rehabPlanId = JSON.parse(rehabPlan.text)?.plan?.id;
  } catch {
    /* ignore */
  }
  if (rehabPlanId) {
    await post(owner, "/api/rehab/sessions", "/api/rehab/sessions", {
      plan_id: rehabPlanId,
      session_number: 1,
      pain_score_before: 6,
      pain_score_after: 4,
      rom_joint: "Knee",
      rom_plane: "Flexion",
      rom_degrees: 72,
      rom_method: "Universal Goniometer (360°)",
      rom_laterality: "Right",
      modality_applied: "Cryotherapy",
      tolerance_rating: "Good (Grade 3/4)",
      exercises_performed: [{ name: "Heel slides", sets: 3, reps: "12", status: "complete" }],
      homework_assigned: [{ name: "Quad sets", frequency: "TID" }],
      therapist_notes: "Smoke test session.",
    });
    await put(owner, "/api/rehab/plans", "/api/rehab/plans", {
      plan_id: rehabPlanId,
      action: "propose_modification",
      change_summary: "Smoke test protocol bump.",
      created_by: "Smoke Test PT",
    });
    await put(owner, "/api/rehab/plans", "/api/rehab/plans", {
      plan_id: rehabPlanId,
      action: "approve_modifications",
      approved_by: "Smoke Test Senior PT",
    });
    await put(owner, "/api/rehab/plans", "/api/rehab/plans", {
      plan_id: rehabPlanId,
      action: "complete_plan",
      discharge_notes: "Smoke test discharge.",
    });
  }

  // ABDM: registry lookup, consent grant and revoke.
  await post(owner, "/api/abdm", "/api/abdm", {
    action: "registry_check",
    patient_phone: PATIENT_PHONE,
  });
  const consent = await post(owner, "/api/abdm", "/api/abdm", {
    action: "request_consent",
    patient_name: "Aarav Mehta",
    patient_phone: PATIENT_PHONE,
    abha_number: "91-4819-2041-8891",
    purpose_code: "CAREFUL_EPISODE_MANAGEMENT",
    validity_days: 7,
  });
  let consentRequestId;
  try {
    consentRequestId = JSON.parse(consent.text)?.consent_request?.consent_request_id;
  } catch {
    /* ignore */
  }
  if (consentRequestId) {
    await post(owner, "/api/abdm", "/api/abdm", {
      action: "verify_consent_otp",
      consent_request_id: consentRequestId,
      otp_code: "123456",
    });
    await post(owner, "/api/abdm", "/api/abdm", {
      action: "revoke_consent",
      consent_request_id: consentRequestId,
    });
  }

  // Public AI consultant.
  await post(null, "public /api/ai/consultant", "/api/ai/consultant", {
    message: "I have an itchy skin rash and acne. Which doctor should I see?",
    history: [],
  });

  // ------------------------------------------------------------- SSR pages
  const pages = [
    "/dashboard/today",
    "/dashboard/desk",
    "/dashboard/patients",
    "/dashboard/beds",
    "/dashboard/lab",
    "/dashboard/pharmacy",
    "/dashboard/insurance",
    "/dashboard/rehab",
    "/dashboard/abdm",
    "/dashboard/finance",
    "/dashboard/settings",
    "/search",
    "/waiting-room",
  ];
  for (const p of pages) await page(owner, p, p);

  if (sessions.superadmin) {
    await page(sessions.superadmin, "/superadmin", "/superadmin");
  }

  await finish();
}

function finish() {
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${total} checks passed, ${failures} failed.`);
  if (failures > 0) {
    console.log("\nFailures:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(`  ${r.status} ${r.kind} ${r.name}${r.detail ? ` — ${r.detail.slice(0, 300)}` : ""}`);
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exitCode = 1;
});
