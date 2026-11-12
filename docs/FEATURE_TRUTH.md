# Feature Truth Table

**Last verified:** 2026-11-08
**Verification commands:** `npm run typecheck`, `npm run build`, `npm run schema:audit`, `node scripts/smoke.mjs`
**Seed data:** `npm run seed` (local only; refuses non-loopback hosts unless `--force`)

This document is the authoritative statement of what this repository actually
ships. The marketing README describes the product vision; where the two
disagree, this table wins.

---

## 1. Status legend

| Status | Meaning |
|---|---|
| **Shipped** | Implemented, tenant-scoped, covered by the smoke suite, and persists to PostgreSQL. |
| **Shipped (external)** | Implemented, but a third-party service is required for the full experience. A deterministic fallback exists where noted. |
| **Sandbox** | Wired end-to-end against local tables, but not connected to a live government/regulatory gateway. |
| **Deferred** | Explicitly out of scope for the current phase; not safe to claim as production-ready. |

---

## 2. Verified modules

| Module | Status | Pages | APIs | Notes |
|---|---|---|---|---|
| Public discovery | Shipped | `/`, `/search`, `/specialties`, `/clinics`, `/clinics/[slug]`, `/doctors/[slug]` | `/api/clinics`, `/api/doctors`, `/api/reviews` | Reads verified doctors and clinics from PostgreSQL. `/doctors` and `/clinics` are intentional 307 redirects to `/search`. |
| Booking | Shipped | `/book` | `/api/appointments/book` | Server-side fee, clinic and doctor resolution. Token allocation uses a transaction-scoped advisory lock. |
| Kiosk check-in | Shipped | `/check-in` | `/api/check-in/public`, `/api/check-in/public/lookup` | Public phone lookup returns `{ known: boolean }` only; the kiosk always collects the name. |
| Live queue & waiting room | Shipped | `/waiting-room`, `/display/waiting-room`, `/patient/portal` | `/api/waiting-room/queue`, `/api/waiting-room/stream`, `/api/clinic/stream`, `/api/clinic/call-token`, `/api/clinic/complete-token` | Public queue and SSE carry token/doctor/status/time plus a masked `patient_display`. No phone, symptoms, fee or payment data. |
| Patient portal | Shipped | `/patient/portal`, `/p/[id]` | `/api/patient/auth/*`, `/api/patients/[phone]` | OTP session, health record, visits, prescriptions, approved consultation reports, documents. Patients can only read their own phone. |
| Reception desk | Shipped | `/dashboard/reception`, `/dashboard/desk`, `/dashboard/chambers`, `/clinic/desk` | `/api/clinic/desk-queue`, `/api/clinic/walk-in`, `/api/clinic/toggle-payment` | Role allowlist applies in the dashboard shell and middleware. |
| Doctor consultation | Shipped | `/doctor/consult`, `/doctor/consult/[id]`, `/dashboard/consult`, `/dashboard/consult/[id]` | `/api/consultations/*`, `/api/prescriptions/*` | Prescription generation, interaction checks, reports. AI scribe/companion require the configured provider key. |
| Finance & billing | Shipped | `/dashboard/finance` | `/api/expenses`, `/api/clinic/eod-summary`, `/api/clinic/eod-lock`, `/api/clinic/shifts`, `/api/clinic/settlements`, `/api/clinic/settlement`, `/api/clinic/settle-shift`, `/api/clinic/petty-cash`, `/api/clinic/doctor-payouts`, `/api/clinic/settle-doctor-payout` | Legacy `/clinic/settlement` and `/clinic/expenses` redirect here. |
| Inpatient / beds | Shipped | `/dashboard/beds` | `/api/beds`, `/api/beds/admit`, `/api/beds/discharge-order`, `/api/beds/discharge`, `/api/beds/clean`, `/api/beds/ledger`, `/api/beds/tasks` | Admit → override → discharge → housekeeping → QA clean cycle is in the smoke suite. Billing overrides require a reason code. |
| Laboratory | Shipped | `/dashboard/lab` | `/api/lab/orders`, `/api/lab/create-order`, `/api/lab/sample-collect`, `/api/lab/accession`, `/api/lab/results`, `/api/lab/qc`, `/api/lab/critical-alert`, `/api/lab/machine-import` | Result verification requires `order_id`, non-empty results, `verified_by` and `pathologist_reg_no`. |
| Pharmacy | Shipped | `/dashboard/pharmacy`, `/pharmacy/console` | `/api/pharmacy/*` | Inventory, batches, dispense, returns, transfers, cycle count, recall, H1 schedule. `pharmacy_items.clinic_id` is intentionally nullable; routes scope by `clinic_slug`. |
| Insurance / TPA | Shipped | `/dashboard/insurance` | `/api/insurance/claims`, `/api/insurance/claims/[id]` | Claims, checklist, audit trail, tenant scoping. |
| Physiotherapy / rehab | Shipped | `/dashboard/rehab` | `/api/rehab/plans`, `/api/rehab/sessions` | Plans, sessions, anatomical ROM limits, gated session closure, protocol version history, pain/stagnation alerts, escalation. |
| ABDM / ABHA | Sandbox | `/dashboard/abdm` | `/api/abdm`, `/api/abdm/fhir/[id]` | Local ABHA registry, consent artefacts, gateway logs, FHIR R4 document bundle. FHIR export requires a verified ABHA already linked in the clinic registry (422 `abha_not_linked`). No live NHA gateway. |
| AI consultant | Shipped (external) | Landing-page assistant, `/api/ai/consultant` | `/api/ai/consultant` | Uses Groq when `GROQ_API_KEY` is set; otherwise a deterministic rule-based matcher recommends a verified doctor from PostgreSQL. |
| Public documents & signed URLs | Shipped | Patient portal, consultation studio | `/api/documents`, `/api/documents/upload`, `/api/documents/signed-url` | Access is scoped to the patient or clinic. |
| WhatsApp notifications | Shipped (external) | Prescription & alert buttons | `/api/notifications/whatsapp`, `/api/prescriptions/[id]/whatsapp-dispatch` | Generates `wa.me` deep links / dispatch records. It is not a WhatsApp Business API integration. |
| Superadmin console | Shipped | `/superadmin`, `/dashboard/admin` | `/api/admin/master` | Global clinic/doctor verification and platform analytics. |
| Clinic onboarding | Shipped | `/onboarding` | `/api/onboarding/*` | OTP-gated publish; tenant is created only after verification. |

---

## 3. Deferred / not production-ready

These are known gaps. They are tracked in `REMEDIATION_PLAN_V2.md`.

| Area | Current state | Risk |
|---|---|---|
| Row-level security | Application-level `guard()` and explicit `clinic_id`/`clinic_slug` filters only | A missed filter is a cross-tenant leak. RLS is the Phase 1 goal. |
| Staff authentication | httpOnly cookie + localStorage user cache | No refresh rotation, no password change/reset, no session revocation list. |
| Patient authentication | OTP + cookie, local session cache | OTP delivery is a development path; no live SMS provider is configured. |
| Rate limiting | Per-process in-memory limiter | Resets on cold start and is not shared across serverless instances. |
| ABDM gateway | Local simulation of M1/M2 | Not connected to NHA; ABHA numbers are sandbox-issued. |
| Payments | Order/verify endpoints exist | No live PSP credentials are checked in; do not treat as a live payment rail. |
| Seed credentials | `.env.local` only, loopback guard | Must never be used outside local development. |
| Legacy routes | `/clinic/settlement`, `/clinic/expenses`, `/clinic/standee`, `/dashboard/standee` | Redirects / legacy UI retained for bookmarks. |

---

## 4. Privacy invariants enforced today

- Public queue (`/api/waiting-room/queue`) returns only `token_number`, `doctor_slug`, `doctor_name`, `patient_display`, `appointment_date`, `time_slot` and `status`.
- Public SSE events (`/api/waiting-room/stream`) use masked names and never include phone, symptoms, fee or payment fields.
- The kiosk lookup (`/api/check-in/public/lookup`) returns `{ known: boolean }` only.
- `/api/patients/[phone]` has no anonymous path.
- ABDM FHIR export never invents an ABHA; it returns `422 abha_not_linked` when the patient is not in the clinic's verified registry.
- Demo fixtures live in `lib/demo-data.ts` and `scripts/seed.mjs`; `npm run check:demo-guards` prevents API routes from importing them directly.

---

## 5. How to reproduce the verification

```bash
# 1. Start the local PostgreSQL instance (see .localdb in the repo root)
# 2. Apply schema and seed
npm run migrate
npm run seed

# 3. Start the app
npm run dev

# 4. In a second terminal
npm run typecheck
npm run build
npm run schema:audit
node scripts/smoke.mjs
```

The smoke suite covers every seeded role, every read API, the main write
workflows (queue, beds, lab, pharmacy, expenses, rehab, ABDM), the public AI
consultant, and both authenticated and public SSR pages.
