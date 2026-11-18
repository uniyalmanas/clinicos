#!/usr/bin/env node
/**
 * Cross-role "holy triad" end-to-end test.
 *
 * Proves the full hand-off chain works between the three real actors:
 *
 *   patient books publicly
 *     -> reception sees it on the desk queue, takes payment, calls the token
 *       -> doctor sees the live token, consults, issues a prescription
 *         -> pharmacy sees the Rx, dispenses it, stock decrements
 *           -> patient logs in by OTP and sees the visit + prescription
 *
 * It also asserts the authorization boundary between the roles, so a bug in
 * `api-auth.ts` (e.g. a role silently gaining clinical write access) fails the
 * suite instead of passing quietly.
 *
 * Requires the dev server on BASE_URL (default http://localhost:3000), a
 * seeded database, and OTP_DEV_MODE=true for the patient login leg.
 *
 *   node scripts/triad-e2e.mjs
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

const BASE = (process.env.TRIAD_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const CLINIC_SLUG = process.env.TRIAD_CLINIC_SLUG || "docsphere-demo-clinic";

// The seeded doctor login is Dr. Aditi Joshi; book her so the doctor sees the
// token in their own live queue and can legally issue the prescription.
const DOCTOR_SLUG = process.env.TRIAD_DOCTOR_SLUG || "dr-aditi-joshi";

const ACCOUNTS = {
  owner: { phone: "9876500001", password: process.env.SEED_OWNER_PASSWORD },
  doctor: { phone: "9876500002", password: process.env.SEED_DOCTOR_PASSWORD },
  reception: { phone: "9876500003", password: process.env.SEED_STAFF_PASSWORD },
  pharmacist: { phone: "9876500004", password: process.env.SEED_STAFF_PASSWORD },
};

const results = [];
let failures = 0;

function record(name, ok, detail = "") {
  if (!ok) failures += 1;
  results.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  const suffix = detail ? `  ${String(detail).slice(0, 400)}` : "";
  console.log(`[${mark}] ${name}${suffix}`);
}

function check(name, condition, detail = "") {
  record(name, Boolean(condition), condition ? "" : detail);
  return Boolean(condition);
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

  const text = await res.text();
  const setCookie = res.headers.getSetCookie?.() || [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json, cookie };
}

async function login(role) {
  const account = ACCOUNTS[role];
  if (!account?.password) {
    check(`login:${role}`, false, "missing SEED_*_PASSWORD");
    return null;
  }
  const { res, json, cookie, text } = await request(null, "POST", "/api/auth/login", {
    phone: account.phone,
    password: account.password,
  });
  const ok = res.status === 200 && Boolean(cookie);
  check(`login:${role}`, ok, `${res.status} ${text.slice(0, 200)}`);
  return ok ? { cookie, json } : null;
}

// Clinic-local dates. The booking route and the desk queue both interpret
// YYYY-MM-DD in the clinic time zone, so a UTC date would book the wrong day
// between 00:00 and 05:30 IST.
const CLINIC_TZ = process.env.CLINIC_TIME_ZONE || "Asia/Kolkata";
const isoInClinicTz = (date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TZ }).format(date);
const today = () => isoInClinicTz(new Date());
const dayOffset = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return isoInClinicTz(d);
};

function freshPhone() {
  // 10 digits, starts with 9. Random enough to dodge the per-phone booking and
  // OTP rate limits across repeated runs.
  let digits = "9";
  for (let i = 0; i < 9; i += 1) digits += Math.floor(Math.random() * 10);
  return digits;
}

function maskedLike(fullName, display) {
  if (!display || !fullName) return false;
  const first = String(fullName).trim().split(/\s+/)[0];
  if (!String(display).startsWith(first)) return false;
  // Any surname characters beyond the first must be masked.
  return String(display).length >= first.length;
}

async function main() {
  console.log(`Triad E2E -> ${BASE}\n`);

  // ── 0. Preconditions ─────────────────────────────────────────────────────
  const health = await request(null, "GET", "/api/health");
  if (!check("precondition:web + db healthy", health.res.status === 200, health.text.slice(0, 200))) {
    finish();
    return;
  }

  const reception = await login("reception");
  const doctor = await login("doctor");
  const pharmacist = await login("pharmacist");
  if (!reception || !doctor || !pharmacist) {
    finish();
    return;
  }

  const phone = freshPhone();
  const patientName = `Triad Patient ${phone.slice(-4)}`;
  const symptoms = "Itchy rash on both arms for one week";

  // ── 1. Patient books publicly, unauthenticated ───────────────────────────
  console.log("\n-- 1. patient books (public) --");
  const booking = await request(null, "POST", "/api/appointments/book", {
    doctor_slug: DOCTOR_SLUG,
    patient_name: patientName,
    patient_phone: phone,
    appointment_date: today(),
    time_slot: "Triad test slot",
    symptoms_description: symptoms,
    payment_mode: "cash",
  });
  const apt = booking.json?.appointment;
  const booked = check(
    "book: 200 + appointment_number",
    booking.res.status === 200 && Boolean(apt?.appointment_number),
    `${booking.res.status} ${booking.text.slice(0, 300)}`
  );
  if (!booked) {
    finish();
    return;
  }
  const aptNumber = apt.appointment_number;
  const token = Number(apt.token_number);
  check("book: starts unpaid", apt.payment_status === "pending", apt.payment_status);
  check("book: fee from doctor record", Number(apt.fee_amount) === 1400, apt.fee_amount);
  check("book: clinic slug exposed for portal", apt.clinic_slug === CLINIC_SLUG, apt.clinic_slug);
  check("book: status confirmed", apt.status === "confirmed", apt.status);

  // ── 2. Reception desk ────────────────────────────────────────────────────
  console.log("\n-- 2. reception desk --");
  const desk1 = await request(reception, "GET", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  const queued = desk1.json?.queue?.find((q) => q.appointment_number === aptNumber);
  check("desk: booking appears", desk1.res.status === 200 && Boolean(queued), `${desk1.res.status} ${desk1.text.slice(0, 200)}`);
  check("desk: mapped to waiting", queued?.status === "waiting", queued?.status);
  check("desk: payment still pending", queued?.payment_status === "pending", queued?.payment_status);
  check("desk: token visible", Number(queued?.token_number) === token, queued?.token_number);

  const deskToday = await request(
    reception,
    "GET",
    `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}&date=${today()}`
  );
  check(
    "desk: ?date=today scopes to today",
    Boolean(deskToday.json?.queue?.find((q) => q.appointment_number === aptNumber)),
    deskToday.text.slice(0, 200)
  );
  const deskYesterday = await request(
    reception,
    "GET",
    `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}&date=${dayOffset(-1)}`
  );
  check(
    "desk: ?date=yesterday excludes today's visit",
    !deskYesterday.json?.queue?.some((q) => q.appointment_number === aptNumber),
    "yesterday's queue contained today's appointment"
  );
  const deskAll = await request(
    reception,
    "GET",
    `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}&date=all`
  );
  check(
    "desk: ?date=all includes history",
    Boolean(deskAll.json?.queue?.find((q) => q.appointment_number === aptNumber)),
    deskAll.text.slice(0, 200)
  );

  const pay = await request(reception, "POST", "/api/clinic/toggle-payment", {
    appointment_number: aptNumber,
    payment_status: "paid",
    payment_mode: "cash",
  });
  check(
    "reception: payment taken",
    pay.res.status === 200 && pay.json?.appointment?.payment_status === "paid",
    `${pay.res.status} ${pay.text.slice(0, 200)}`
  );

  const desk2 = await request(reception, "GET", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  const paidQueued = desk2.json?.queue?.find((q) => q.appointment_number === aptNumber);
  check("desk: payment reflected", paidQueued?.payment_status === "paid", paidQueued?.payment_status);
  check(
    "desk: financials include visit",
    Number(desk2.json?.financials?.total_collected || 0) >= 1400,
    JSON.stringify(desk2.json?.financials)
  );

  const call = await request(reception, "POST", "/api/clinic/call-token", {
    appointment_number: aptNumber,
    chamber_name: "Chamber 2 - Dental Suite",
  });
  check(
    "reception: token called",
    call.res.status === 200 && call.json?.appointment?.status === "in_consultation",
    `${call.res.status} ${call.text.slice(0, 200)}`
  );

  // ── 3. Public displays see it, without PII ───────────────────────────────
  console.log("\n-- 3. public queue privacy --");
  const pub = await request(null, "GET", `/api/waiting-room/queue?clinic_slug=${CLINIC_SLUG}`);
  const pubRow = pub.json?.queue?.find((q) => q.token_number === token && q.doctor_slug === DOCTOR_SLUG);
  check("public queue: 200 + token visible", pub.res.status === 200 && Boolean(pubRow), pub.res.status);
  check("public queue: status in_consultation", pubRow?.status === "in_consultation", pubRow?.status);
  check("public queue: name is masked", maskedLike(patientName, pubRow?.patient_display), pubRow?.patient_display);
  check(
    "public queue: no full name / phone leak",
    !pub.text.includes(patientName) && !pub.text.includes(phone),
    "public queue leaked identity"
  );

  const live = await request(null, "GET", `/api/appointments/live-queue?doctor_slug=${DOCTOR_SLUG}`);
  check(
    "public live-queue: active token matches",
    live.res.status === 200 && Number(live.json?.current_active_token) === token,
    `${live.res.status} ${live.text.slice(0, 200)}`
  );

  // ── 4. Doctor consults and prescribes ────────────────────────────────────
  console.log("\n-- 4. doctor consults --");
  const docDesk = await request(doctor, "GET", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  const docRow = docDesk.json?.queue?.find((q) => q.appointment_number === aptNumber);
  check("doctor: sees the called token", docRow?.status === "in_consultation", docRow?.status);

  const docLive = await request(doctor, "GET", `/api/appointments/live-queue?doctor_slug=${DOCTOR_SLUG}`);
  check(
    "doctor: own live-queue shows token",
    Number(docLive.json?.current_active_token) === token,
    docLive.text.slice(0, 200)
  );

  const beforeRx = await request(doctor, "GET", `/api/patients/${phone}`);
  check("doctor: can open patient chart", beforeRx.res.status === 200, beforeRx.res.status);

  const rxPayload = {
    appointment_number: aptNumber,
    doctor_slug: DOCTOR_SLUG,
    patient_name: patientName,
    patient_phone: phone,
    patient_age: 34,
    patient_gender: "Female",
    vitals: { bp: "118/76", pulse: "78", temp: "98.4 F", spo2: "99%" },
    symptoms: [symptoms],
    provisional_diagnosis: "Contact dermatitis",
    items: [
      {
        medicine_name: "Tab Cetirizine 10mg",
        generic_name: "CETIRIZINE",
        dosage_form: "Tablet",
        strength: "10mg",
        dosage_frequency: "0-0-1",
        timing_relation: "after food",
        duration_days: 5,
      },
      {
        medicine_name: "Adapalene Gel 0.1%",
        generic_name: "ADAPALENE",
        dosage_form: "Gel",
        strength: "0.1%",
        dosage_frequency: "0-0-1",
        timing_relation: "at night",
        duration_days: 14,
      },
    ],
    instructions: "Avoid scratching. Apply sunscreen daily.",
    followup_date: today(),
    lab_tests: ["Complete Blood Count (CBC)"],
    clinical_notes: "No systemic involvement.",
    diet_advice: "Hydrate well.",
  };
  const rxRes = await request(doctor, "POST", "/api/prescriptions/generate", rxPayload);
  const rx = rxRes.json?.prescription;
  check(
    "doctor: prescription issued",
    rxRes.res.status === 200 && Boolean(rx?.prescription_number),
    `${rxRes.res.status} ${rxRes.text.slice(0, 300)}`
  );
  if (!check("doctor: prescription ready", Boolean(rx?.prescription_number), "no Rx number")) {
    finish();
    return;
  }
  const rxNumber = rx.prescription_number;
  check("doctor: own name on Rx", rx.doctor_name === "Dr. Aditi Joshi", rx.doctor_name);
  check("doctor: Rx tied to appointment", rx.appointment_number === aptNumber, rx.appointment_number);
  check("doctor: integrity seal present", Boolean(rx.integrity_hash), "missing integrity hash");
  check("doctor: items preserved", Array.isArray(rx.items) && rx.items.length === 2, JSON.stringify(rx.items));

  const register = await request(
    doctor,
    "GET",
    `/api/prescriptions?date=${today()}&limit=500`
  );
  const registerRow = register.json?.prescriptions?.find((p) => p.rx_id === rxNumber);
  check(
    "doctor: Rx in today's register",
    register.res.status === 200 && Boolean(registerRow),
    `${register.res.status} ${register.text.slice(0, 200)}`
  );
  check(
    "doctor: register keeps doctor slug",
    registerRow?.doctor_slug === DOCTOR_SLUG,
    registerRow?.doctor_slug
  );
  check(
    "doctor: register shows specialty",
    Boolean(registerRow?.specialization),
    registerRow?.specialization
  );
  // The tests the doctor ordered must reach the diagnostics desk automatically.
  check(
    "doctor: lab order handed off",
    rx.lab_orders_created === 1,
    `lab_orders_created=${rx.lab_orders_created}`
  );
  const labWorklist = await request(doctor, "GET", "/api/lab/orders?status=ordered");
  const labOrder = labWorklist.json?.orders?.find(
    (o) => o.test_name === "Complete Blood Count (CBC)" && o.patient_phone === phone
  );
  check(
    "lab: ordered test appears on worklist",
    labWorklist.res.status === 200 && Boolean(labOrder),
    `${labWorklist.res.status} ${labWorklist.text.slice(0, 200)}`
  );
  check(
    "lab: order linked to prescription",
    Boolean(labOrder?.prescription_id) && Boolean(labOrder?.appointment_id),
    `rx=${labOrder?.prescription_id} apt=${labOrder?.appointment_id}`
  );

  const registerOld = await request(
    doctor,
    "GET",
    "/api/prescriptions?date=1999-01-01&limit=500"
  );
  check(
    "doctor: register date filter excludes other days",
    !registerOld.json?.prescriptions?.some((p) => p.rx_id === rxNumber),
    "old-date register contained today's Rx"
  );

  const deskAfter = await request(doctor, "GET", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  const completedRow = deskAfter.json?.queue?.find((q) => q.appointment_number === aptNumber);
  check("doctor: visit completed", completedRow?.status === "completed", completedRow?.status);

  // ── 5. Pharmacy dispenses ────────────────────────────────────────────────
  console.log("\n-- 5. pharmacy --");
  const rxQueue = await request(pharmacist, "GET", "/api/pharmacy/prescriptions-queue");
  const pharmacyRx = rxQueue.json?.queue?.find((q) => q.prescription_number === rxNumber);
  check(
    "pharmacy: Rx appears in queue",
    rxQueue.res.status === 200 && Boolean(pharmacyRx),
    `${rxQueue.res.status} ${rxQueue.text.slice(0, 200)}`
  );
  check("pharmacy: queue links patient", pharmacyRx?.patient_phone === phone, pharmacyRx?.patient_phone);

  const inventory = await request(pharmacist, "GET", "/api/pharmacy/inventory");
  const stockItem = (inventory.json?.items || []).find(
    (i) => !i.is_recalled && Number(i.current_stock) >= 2 && i.schedule_type !== "Schedule H1"
  );
  if (!check("pharmacy: has dispensable stock", Boolean(stockItem), "no dispensable item")) {
    finish();
    return;
  }
  const stockBefore = Number(stockItem.current_stock);

  const dispense = await request(pharmacist, "POST", "/api/pharmacy/dispense", {
    prescription_number: rxNumber,
    patient_name: patientName,
    patient_phone: phone,
    items: [
      {
        item_id: stockItem.id,
        brand_name: stockItem.brand_name,
        batch_number: stockItem.batch_number,
        quantity: 2,
        unit_price: Number(stockItem.selling_price ?? stockItem.mrp ?? 0),
        schedule_type: stockItem.schedule_type,
      },
    ],
    payment_mode: "cash",
  });
  check(
    "pharmacy: dispensed",
    dispense.res.status === 200 && Boolean(dispense.json?.bill?.bill_number),
    `${dispense.res.status} ${dispense.text.slice(0, 300)}`
  );
  check(
    "pharmacy: bill bound to Rx",
    dispense.json?.bill?.prescription_number === rxNumber,
    dispense.json?.bill?.prescription_number
  );

  const inventoryAfter = await request(pharmacist, "GET", "/api/pharmacy/inventory");
  const stockAfter = (inventoryAfter.json?.items || []).find((i) => i.id === stockItem.id);
  check(
    "pharmacy: stock decremented",
    Number(stockAfter?.current_stock) === stockBefore - 2,
    `${stockBefore} -> ${stockAfter?.current_stock}`
  );

  // ── 6. Patient sees the record ───────────────────────────────────────────
  console.log("\n-- 6. patient portal (OTP) --");
  const otpReq = await request(null, "POST", "/api/patient/auth/request-otp", { phone });
  const devOtp = otpReq.json?.dev_otp;
  check(
    "patient: OTP issued (dev mode)",
    otpReq.res.status === 200 && Boolean(devOtp),
    `${otpReq.res.status} ${otpReq.text.slice(0, 200)}`
  );
  if (!devOtp) {
    finish();
    return;
  }

  const verify = await request(null, "POST", "/api/patient/auth/verify-otp", { phone, otp: devOtp });
  const patientCookie = verify.cookie;
  check(
    "patient: OTP verified",
    verify.res.status === 200 && Boolean(patientCookie),
    `${verify.res.status} ${verify.text.slice(0, 200)}`
  );
  if (!patientCookie) {
    finish();
    return;
  }
  const patient = { cookie: patientCookie };

  const me = await request(patient, "GET", "/api/patient/auth/me");
  check(
    "patient: session resolved",
    me.res.status === 200 && me.json?.ok === true && me.json?.patient?.phone === phone,
    `${me.res.status} ${me.text.slice(0, 300)}`
  );

  const record = await request(patient, "GET", `/api/patients/${phone}`);
  const visit = record.json?.patient?.visits?.find((v) => v.visit_id === aptNumber);
  check(
    "patient: sees own visit",
    record.res.status === 200 && Boolean(visit),
    `${record.res.status} ${record.text.slice(0, 300)}`
  );
  check("patient: visit shows paid", visit?.payment_status === "paid", visit?.payment_status);
  check("patient: visit links Rx", visit?.prescription_number === rxNumber, visit?.prescription_number);
  check(
    "patient: medications listed",
    (visit?.medications_summary || []).some((m) => m.includes("Cetirizine")),
    JSON.stringify(visit?.medications_summary)
  );
  check(
    "patient: diagnosis visible",
    visit?.provisional_diagnosis === "Contact dermatitis",
    visit?.provisional_diagnosis
  );
  check(
    "patient: unsigned lab report not released",
    Array.isArray(record.json?.patient?.lab_reports) &&
      record.json.patient.lab_reports.length === 0,
    JSON.stringify(record.json?.patient?.lab_reports)
  );

  // ── 6b. Lab leg: collect -> accession -> sign -> patient sees report ─────
  console.log("\n-- 6b. diagnostics (collect, accession, sign) --");
  if (!labOrder?.id) {
    check("lab: order id available", false, "no lab order to work");
  } else {
    const collected = await request(doctor, "POST", "/api/lab/sample-collect", {
      order_id: labOrder.id,
    });
    const collectedOrder = collected.json?.order;
    check(
      "lab: sample collected",
      collected.res.status === 200 && collectedOrder?.status === "sample_collected",
      `${collected.res.status} ${collected.text.slice(0, 200)}`
    );
    check(
      "lab: collector is the signed-in user",
      collectedOrder?.sample_collector_name === "Dr. Aditi Joshi",
      collectedOrder?.sample_collector_name
    );
    check(
      "lab: vacutainer derived from test",
      String(collectedOrder?.vacutainer_tube || "").includes("EDTA"),
      collectedOrder?.vacutainer_tube
    );
    check(
      "lab: barcode recorded",
      Boolean(collectedOrder?.sample_barcode),
      collectedOrder?.sample_barcode
    );

    const accessioned = await request(doctor, "POST", "/api/lab/accession", {
      order_id: labOrder.id,
      action: "accession",
      scanned_barcode: collectedOrder?.sample_barcode,
    });
    check(
      "lab: sample accessioned",
      accessioned.res.status === 200 &&
        accessioned.json?.order?.status === "sample_accessioned",
      `${accessioned.res.status} ${accessioned.text.slice(0, 200)}`
    );

    const signed = await request(doctor, "POST", "/api/lab/results", {
      order_id: labOrder.id,
      pathologist_reg_no: "UDC-4120-2016",
      pathologist_notes: "Reviewed against analyser printout.",
      results: [
        {
          parameter: "Hemoglobin",
          value: "12.8",
          unit: "g/dL",
          reference_range: "12.0-15.5",
        },
        {
          parameter: "Total Leukocyte Count",
          value: "7400",
          unit: "/cumm",
          reference_range: "4000-11000",
        },
        {
          parameter: "Platelet Count",
          value: "245000",
          unit: "/cumm",
          reference_range: "150000-450000",
        },
      ],
    });
    check(
      "lab: report signed and completed",
      signed.res.status === 200 && signed.json?.order?.status === "completed",
      `${signed.res.status} ${signed.text.slice(0, 200)}`
    );
    check(
      "lab: signature carries real registration",
      signed.json?.order?.pathologist_reg_no === "UDC-4120-2016",
      signed.json?.order?.pathologist_reg_no
    );
    check(
      "lab: report has tamper seal",
      typeof signed.json?.report_sha256 === "string" &&
        signed.json.report_sha256.length === 64,
      signed.json?.report_sha256
    );

    const recordAfter = await request(patient, "GET", `/api/patients/${phone}`);
    const labReport = (recordAfter.json?.patient?.lab_reports || []).find(
      (r) => r.order_number === labOrder.order_number
    );
    check(
      "patient: verified lab report released",
      recordAfter.res.status === 200 && Boolean(labReport),
      `${recordAfter.res.status} ${recordAfter.text.slice(0, 200)}`
    );
    check(
      "patient: lab report has verifier",
      labReport?.verified_by === "Dr. Aditi Joshi" &&
        labReport?.pathologist_reg_no === "UDC-4120-2016",
      `${labReport?.verified_by} / ${labReport?.pathologist_reg_no}`
    );
    check(
      "patient: lab report shows parameters",
      (labReport?.results || []).length === 3 &&
        (labReport?.results || []).some((r) => r.parameter === "Hemoglobin"),
      JSON.stringify(labReport?.results)
    );
    check(
      "patient: lab report linked to visit",
      labReport?.appointment_id === labOrder.appointment_id,
      `${labReport?.appointment_id} vs ${labOrder.appointment_id}`
    );
    check(
      "patient: lab report carries seal",
      labReport?.report_sha256 === signed.json?.report_sha256,
      labReport?.report_sha256
    );
  }

  // ── 7. Role separation / authorization boundary ──────────────────────────
  console.log("\n-- 7. authorization boundary --");
  const anonDesk = await request(null, "GET", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  check("anon: staff desk queue rejected", anonDesk.res.status === 401, anonDesk.res.status);

  const patientDesk = await request(patient, "GET", `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}`);
  check("patient: staff endpoints rejected", patientDesk.res.status === 401, patientDesk.res.status);

  const patientAppointments = await request(patient, "GET", "/api/appointments");
  check("patient: appointment list rejected", patientAppointments.res.status === 401, patientAppointments.res.status);

  const crossRecord = await request(patient, "GET", "/api/patients/9812345601");
  check(
    "patient: cannot read another chart",
    crossRecord.res.status === 403,
    `${crossRecord.res.status} ${crossRecord.text.slice(0, 200)}`
  );

  const receptionRx = await request(reception, "POST", "/api/prescriptions/generate", rxPayload);
  check(
    "receptionist: cannot issue prescription",
    receptionRx.res.status === 403,
    `${receptionRx.res.status} ${receptionRx.text.slice(0, 200)}`
  );

  const anonDispense = await request(null, "POST", "/api/pharmacy/dispense", {
    items: [{ brand_name: "x", quantity: 1 }],
  });
  check("anon: cannot dispense", anonDispense.res.status === 401, anonDispense.res.status);

  // ── 8. Queue controls + 1-tap demo identity ──────────────────────────────
  console.log("\n-- 8. queue controls & demo identity --");
  const qPhone = freshPhone();
  const qName = `Triad Queue ${qPhone.slice(-4)}`;
  const qBook = await request(null, "POST", "/api/appointments/book", {
    doctor_slug: DOCTOR_SLUG,
    patient_name: qName,
    patient_phone: qPhone,
    appointment_date: today(),
    time_slot: "Triad queue-control slot",
    symptoms_description: "Queue-control check",
    payment_mode: "cash",
  });
  const qApt = qBook.json?.appointment;
  if (
    check(
      "queue-control: second booking created",
      qBook.res.status === 200 && Boolean(qApt?.appointment_number),
      `${qBook.res.status} ${qBook.text.slice(0, 300)}`
    )
  ) {
    const qNum = qApt.appointment_number;

    const noShow = await request(reception, "POST", "/api/clinic/update-appointment", {
      appointment_number: qNum,
      status: "no_show",
    });
    check(
      "queue-control: no-show persisted",
      noShow.res.status === 200 && noShow.json?.appointment?.status === "no_show",
      `${noShow.res.status} ${noShow.text.slice(0, 200)}`
    );
    const deskNoShow = await request(
      reception,
      "GET",
      `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}&date=${today()}`
    );
    check(
      "queue-control: desk shows no-show",
      deskNoShow.json?.queue?.find((q) => q.appointment_number === qNum)?.status === "no_show",
      "no-show did not survive the desk poll"
    );

    const backToWaiting = await request(
      reception,
      "POST",
      "/api/clinic/update-appointment",
      { appointment_number: qNum, status: "waiting" }
    );
    check(
      "queue-control: waiting restored",
      backToWaiting.json?.appointment?.status === "waiting",
      backToWaiting.text.slice(0, 200)
    );

    // 1-tap demo login uses the real doctors row, so the signature carries the
    // true specialty and council registration number.
    const demoLogin = await request(null, "POST", "/api/auth/login", {
      phone: "9876500002",
      password: "Password@123",
    });
    check(
      "demo: doctor 1-tap login",
      demoLogin.res.status === 200 &&
        Boolean(demoLogin.cookie) &&
        demoLogin.json?.role === "doctor",
      `${demoLogin.res.status} ${demoLogin.text.slice(0, 200)}`
    );
    const demoDoctor = { cookie: demoLogin.cookie };
    const demoRxPayload = {
      appointment_number: qNum,
      patient_name: qName,
      patient_phone: qPhone,
      patient_age: 29,
      provisional_diagnosis: "Demo identity check",
      items: [],
    };
    const demoRx = await request(
      demoDoctor,
      "POST",
      "/api/prescriptions/generate",
      demoRxPayload
    );
    check(
      "demo: doctor signs as real profile",
      demoRx.res.status === 200 &&
        demoRx.json?.prescription?.doctor_name === "Dr. Aditi Joshi" &&
        demoRx.json?.prescription?.doctor_slug === DOCTOR_SLUG,
      `${demoRx.res.status} ${demoRx.text.slice(0, 300)}`
    );
    check(
      "demo: real council registration",
      demoRx.json?.prescription?.doctor_reg_number === "UDC-4120-2016",
      demoRx.json?.prescription?.doctor_reg_number
    );

    const transfer = await request(reception, "POST", "/api/clinic/update-appointment", {
      appointment_number: qNum,
      target_doctor_slug: "dr-vikram-sethi",
    });
    check(
      "queue-control: transfer persisted",
      transfer.res.status === 200 &&
        transfer.json?.appointment?.doctor_slug === "dr-vikram-sethi" &&
        transfer.json?.appointment?.doctor_name === "Dr. Vikram Sethi",
      `${transfer.res.status} ${transfer.text.slice(0, 200)}`
    );
    check(
      "queue-control: transfer reallocates token",
      Number(transfer.json?.appointment?.token_number) >= 1,
      transfer.json?.appointment?.token_number
    );
    const deskTransfer = await request(
      reception,
      "GET",
      `/api/clinic/desk-queue?clinic_slug=${CLINIC_SLUG}&date=${today()}`
    );
    check(
      "queue-control: desk shows transfer",
      deskTransfer.json?.queue?.find((q) => q.appointment_number === qNum)?.doctor_slug ===
        "dr-vikram-sethi",
      "transfer did not survive the desk poll"
    );

    const crossSign = await request(
      demoDoctor,
      "POST",
      "/api/prescriptions/generate",
      demoRxPayload
    );
    check(
      "doctor: cannot sign another doctor's appointment",
      crossSign.res.status === 409,
      `${crossSign.res.status} ${crossSign.text.slice(0, 200)}`
    );
  }

  finish();
}

function finish() {
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  console.log(`\n${passed}/${total} checks passed, ${failures} failed.`);
  if (failures > 0) {
    console.log("\nFailed checks:");
    for (const r of results.filter((x) => !x.ok)) {
      console.log(` - ${r.name}: ${r.detail}`);
    }
  }
  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Triad E2E crashed:", err);
  process.exit(1);
});
