# ClinicOS / DocSphere — Project Report & Functional Test Results

**Repository:** `D:\medic-sept-2026`
**Report date:** 31 October 2026
**Scope:** Full code review, live-database verification, production build, and end-to-end API/functional testing
**Method:** Static analysis of the source tree + `next build` + `next start` against the live Supabase PostgreSQL database + scripted HTTP test suite (80 API routes probed)

---

## 1. Executive summary

ClinicOS is a genuine, large, working full-stack clinic operating system — not a mockup. It builds cleanly, serves 39 pages and 80 API routes, connects to a live 59-table PostgreSQL database, and the core patient journey (discover doctor → book token → live queue → EMR → prescription → pharmacy → settlement) works end to end.

It is **not yet safe to put real patient data into production**, but it is much closer than the repo's own audit documents claim. The gap is not features — it is **authorization coverage**, **schema migration discipline**, and **clinical-data privacy**.

**Verdict:**

| Dimension | Score | Meaning |
|---|---|---|
| Feature completeness | **85%** | Very broad; most advertised modules exist and run |
| Functional demo readiness | **80%** | Passes end-to-end smoke tests |
| Code quality / structure | **70%** | Consistent App Router patterns, but heavy duplication and drift |
| Security & privacy | **35%** | 58 of 80 API routes have no authentication at all |
| Data integrity / DB governance | **40%** | Live DB diverges from `schema.sql`; migrations not applied |
| Ops / deployment readiness | **45%** | No middleware, secrets in repo, dead `apps/api`, no tests in CI |
| **Overall production readiness** | **≈ 45%** | Good pilot product; needs a security sprint before real clinics |

**Single most urgent issue:** `/api/patients/[phone]` returns a patient's clinical history keyed only by a phone number, with no authentication required. Masking is cosmetic — the record (allergies, chronic conditions, prescriptions, documents) is returned to any caller who guesses a 10-digit number. This is a DPDP Act 2023 problem, not a nice-to-have.

---

## 2. What this product actually is

**Intended product (per README):** a zero-markup patient booking network (DocSphere) plus a clinic operating system (ClinicOS), deployed serverless on Vercel + Supabase.

**What the code actually delivers:**

- **Patient side** — doctor/clinic discovery, symptom search, token booking, live OPD queue tracking, patient portal with records and prescriptions, reviews.
- **Clinic side** — front-desk queue ("desk queue", call/complete token, walk-ins), EMR/consult workspace, prescription studio with AI scribe, pharmacy inventory + dispensing + returns/recalls, lab orders + sample accession + QC + critical alerts, inpatient beds with billing ledger and housekeeping, insurance claims, expenses, shift handover, EOD cash-drawer closing with cryptographic seal, doctor payouts and escrow disputes.
- **Platform side** — super-admin console: clinic list, subscription state, manual payment/renewal, suspend/activate.

**Realistic positioning:** it is a strong *single-city pilot product* with unusually deep clinic back-office coverage. It is not yet a compliant multi-tenant SaaS.

---

## 3. Architecture (as verified, not as documented)

```
Next.js 15.1.12 (App Router) + React 19 + TypeScript 5.7 + Tailwind 3.4
        │
        ├── 39 pages (app router, mostly "use client")
        ├── 80 route handlers under src/app/api/**
        └── 14 shared components · ~58,000 lines of TS/TSX in apps/web/src

Data layer
        └── postgres.js client → Supabase PostgreSQL 17.6 (pooler, ssl=require)
            · 59 tables in public schema
            · parameterized tagged templates (good)
            · no ORM, no migration runner actually applied

Auth
        └── bcryptjs + jsonwebtoken (HS256, 7-day expiry)
            · JWT in httpOnly cookie `clinicos_token` AND in localStorage
            · `authorizeClinicUser()` = JWT → live user row → membership → role → clinic
            · `authorizeSuperAdmin()` = JWT → live user row → role re-check

Deployment
        └── Vercel (serverless) + Supabase; .vercel/output present
```

### Structural findings

| Finding | Detail |
|---|---|
| `apps/api` is dead | 3,426 files, but **zero application Python source**. Every `.py` lives inside `apps/api/venv/Lib/site-packages`; the rest is `__pycache__` and a 0.33 MB `clinicos.db`. It is removable ballast and a security liability (it contains `.env` / `.env.local`). |
| No Next.js middleware | `middleware.ts` does not exist. Page protection is **client-side only** — `/dashboard`, `/superadmin`, `/clinic/*` render their shell to anyone, then fetch data. |
| Dual token storage | JWT is written to `localStorage` (10 call sites read `clinicos_token`) *and* an httpOnly cookie. `localStorage` defeats the point of httpOnly and exposes the token to any XSS. |
| In production, cookies are not sent over local HTTP | `AUTH_COOKIE_OPTIONS.secure = true` when `NODE_ENV=production`, which is why all authenticated testing had to use `Authorization: Bearer`. |
| IDs are `character varying`, not `uuid` | `user_accounts.id`, `clinics.id`, `doctors.id`, `clinic_memberships.*`, `appointments.clinic_id` are all `varchar`. Any `::uuid` cast on them throws `operator does not exist: character varying = uuid` at runtime. |
| Schema drift is real | Live DB has `reviews.is_verified_visit` (not `verified_patient`); `patient_documents` had no `file_url`; `clinics` lacks `practice_type`, `organization_id`, `subscription_plan`; `business` / `pharmacy_inventory` / `lab_orders` tables don't exist (real names: `pharmacy_items`, `diagnostic_lab_orders`). |
| Migration 002 never applied | `supabase/migrations/002_organizations_practice_plans.sql` is not in the live DB. Login carries a hand-written `try/catch` fallback for exactly this. |
| Schema is created at runtime | Several routes `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD COLUMN` on every request (reviews, patient_documents). That is a workaround, not a migration strategy. |

---

## 4. Feature inventory & runtime status

| Module | Representative routes | Status |
|---|---|---|
| Doctor & clinic discovery | `/api/doctors`, `/api/clinics` | ✅ Working |
| Appointment booking + token numbering | `/api/appointments/book` | ✅ Working (auth + membership enforced) |
| Live OPD queue | `/api/appointments/live-queue` | ✅ Working (advisory-lock token allocation) |
| Front-desk queue operations | `/api/clinic/desk-queue`, `call-token`, `complete-token`, `walk-in`, `toggle-payment` | ⚠️ Partial — desk-queue works; `toggle-payment`, `walk-in` unauthenticated |
| EMR / patient history | `/api/patients/[phone]` | ⚠️ Works but **unauthenticated** |
| Prescriptions + AI scribe | `/api/prescriptions/generate`, `scribe`, `check-interactions`, `[id]` | ⚠️ Present; AI routes depend on `GROQ_API_KEY` |
| Pharmacy | `inventory`, `dispense`, `bills`, `returns`, `recall`, `transfers`, `cycle-count`, `schedule-h1` | ⚠️ Inventory/bills read OK; several write routes unauthenticated |
| Laboratory | `orders`, `create-order`, `sample-collect`, `accession`, `results`, `qc`, `critical-alert`, `machine-import` | ⚠️ Read OK; write routes unauthenticated |
| Beds / inpatient | `beds/admit`, `discharge`, `clean`, `tasks`, `ledger` | ⚠️ Works; supervisor PIN is **hardcoded** (`7788`, `ADMIN99`, `SUPER2026`, `9900`) |
| Insurance | `/api/insurance/claims`, `/claims/[id]` | ⚠️ Unauthenticated read/write |
| Finance: settlements | `/api/clinic/settlements` | ✅ Secured & tenant-scoped (fixed in this pass) |
| Finance: doctor payouts | `/api/clinic/doctor-payouts` | ✅ Secured & tenant-scoped (fixed in this pass) |
| Finance: EOD closing | `/api/clinic/eod-lock` | ✅ Auth + role-gated, hash-sealed |
| Shift handover | `/api/clinic/shifts` | ✅ Auth + role-gated (owner/admin) |
| Reviews | `/api/reviews` | ✅ Fixed — schema-tolerant, validated, no fake seeding |
| Documents | `/api/documents/upload`, `signed-url` | ⚠️ Upload validates MIME/size; download cookie trust is weak |
| ABDM / FHIR | `/api/abdm`, `/api/abdm/fhir/[id]` | ⚠️ Mock-grade; unauthenticated |
| Platform admin | `/api/admin/master` | ✅ Super-admin only (fixed in this pass) |
| Onboarding | `/api/onboarding/extract`, `publish` | ⚠️ Publishes a clinic + default password `Password@123`; unauthenticated |

---

## 5. Functional test results (executed)

Environment: `next build` → `next start` on `http://localhost:3000`, live Supabase DB, real seeded accounts. All results below are observed HTTP responses, not inferred.

### 5.1 Pages — 10/10 returned 200

`/`, `/login`, `/doctors`, `/clinics`, `/book`, `/patient/portal`, `/for-doctors`, `/dashboard`, `/superadmin`, `/waiting-room`

### 5.2 Public read APIs — 7/7 returned 200

`/api/doctors`, `/api/clinics`, `/api/appointments`, `/api/appointments/live-queue`, `/api/reviews`, `/api/pharmacy/inventory`, `/api/lab/orders`

> Note: these being public is intentional for discovery, but `/api/appointments` returning full appointment rows (names, phones, slots) is a privacy leak.

### 5.3 Authentication

| Test | Expected | Actual | Result |
|---|---|---|---|
| Doctor login (`dr.rahul@clinicos.in`) | 200 + token | 200 + token | ✅ |
| Patient login (`amit.rawat@gmail.com`) | 200 + token | 200 + token | ✅ |
| Staff login (`+919876543214`) | 200 + token | 200 + token | ✅ |
| Wrong password | 401 | 401 | ✅ |
| Missing credentials | 400 | 400 | ✅ |
| `/api/auth/me` with token | 200 + profile | 200 + profile | ✅ |
| `/api/auth/me` anonymous | 401 | 401 | ✅ |

### 5.4 Patient-record masking (privacy)

| Caller | Target | Expected | Actual | Result |
|---|---|---|---|---|
| Anonymous | `9876543210` | masked | `is_masked: true` | ⚠️ Passes masking, but **still leaks the full clinical record** |
| Patient token | own number | unmasked | `is_masked: false` | ✅ |
| Patient token | other patient | masked | `is_masked: true` | ✅ |
| Doctor token | patient | unmasked | `is_masked: false` | ✅ |

> Masking now trusts only a verified JWT (previously any `Bearer` header or forgeable cookie worked). The remaining structural problem is that **the endpoint itself needs no identity at all**.

### 5.5 Tenant & role isolation

| Test | Expected | Actual | Result |
|---|---|---|---|
| Doctor → own clinic settlements | 200 | 200 | ✅ |
| Doctor → other clinic (`heart-care-clinic-868`) | 403 | 403 | ✅ |
| Patient → settlements | 403 | 403 | ✅ |
| Staff → doctor payouts | 200 | 200 | ✅ |
| Anonymous → settlements / payouts | 401 | 401 | ✅ |
| Doctor → admin master | 403 | 403 | ✅ |
| Staff → admin master | 403 | 403 | ✅ |
| Anonymous → admin master | 401 | 401 | ✅ |
| Patient booking without membership | 403 | 403 | ✅ |
| Anonymous booking | 401 | 401 | ✅ |
| Super-admin → admin master | 200 | 200 (KPIs: 22 clinics, 1 paid, 21 trial) | ✅ |

### 5.6 Write flows

| Test | Expected | Actual | Result |
|---|---|---|---|
| Valid review | 200 | 200, `is_verified_visit` computed from completed appointment | ✅ |
| Review rating = 9 | 400 | 400 `rating must be an integer between 1 and 5` | ✅ |
| Document upload, bad MIME | 400 | 400 | ✅ |
| Document upload, 50 MB | 400 | 400 | ✅ |
| Document upload, valid PDF metadata | 200 | 200 | ✅ |
| Doctor books appointment | 200 | 200, `APT-261031-RAHUL-02-…` | ✅ |
| Live queue after booking | count increments | `next_token_available` 2 → 3, waiting 1 → 2 | ✅ |

### 5.7 Database

- Connected to **PostgreSQL 17.6**, database `postgres`, **59 tables**.
- Row counts observed: 9 users, 22 clinics, 22 doctors, 16 appointments, 11 prescriptions, 5 memberships.
- All test artifacts created during testing were deleted afterwards (2 appointments, 2 reviews, 2 documents).

**Test data cleanup: `Cleaned: appointments=2, reviews=2, documents=2`** — the live DB is back to its pre-test state.

---

## 6. What I fixed during this pass

These were real runtime failures and security holes found while testing — not stylistic changes.

| # | File | Change |
|---|---|---|
| 1 | `src/app/api/reviews/route.ts` | Rewrote for schema tolerance (`is_verified_visit` vs `verified_patient`), integer rating validation 1–5, real "verified visit" check against completed appointments, removed fabricated seeded reviews |
| 2 | `src/app/api/documents/upload/route.ts` | Replaced invalid `clinics.is_verified` lookup; `ALTER TABLE` now adds `file_url`, `storage_path`, `is_private` |
| 3 | `src/lib/auth.ts` | Added `authorizeSuperAdmin()` with live DB role re-check; fixed all `::uuid` casts to `::text` on varchar IDs; doctor profile resolved by `phone` (no `user_id` column); nullable clinic address fields |
| 4 | `src/app/api/admin/master/route.ts` | `GET` and `POST` now super-admin only; auth errors return 401/403 instead of 500 |
| 5 | `src/app/api/clinic/settlements/route.ts` | Requires authenticated clinic role, enforces tenant-slug match |
| 6 | `src/app/api/clinic/doctor-payouts/route.ts` | Same auth + tenant scoping; doctors scoped to clinic; removed fake fallback doctor list |
| 7 | `src/app/api/appointments/book/route.ts` | JWT + clinic-membership enforcement retained; `::uuid` → `::text` |
| 8 | `src/app/api/clinic/eod-lock/route.ts` | `::uuid` → `::text` on varchar `clinic_id` |
| 9 | `src/app/api/patients/[phone]/route.ts` | Masking now requires a verified JWT (staff role, or patient's own phone); removed forgeable `x-patient-session` / cookie-substring trust |
| 10 | `src/app/api/auth/login/route.ts` | Accepts `body.email`; graceful fallback when migration 002 columns are absent |

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds (81 prerendered pages, 80 API routes); full smoke suite green.

---

## 7. Security findings (prioritized)

### P0 — must fix before any real patient data

1. **Unauthenticated clinical history lookup.** `/api/patients/[phone]` needs no login. Phone masking does not protect the diagnosis, allergies, prescriptions or documents inside the payload. Any enumeration of 10-digit numbers dumps the clinic's patient database. Fix: require staff JWT with tenant check, or an OTP-verified patient session; return 401 rather than a masked record.
2. **58 of 80 API routes have no authentication check at all.** Includes `POST /api/pharmacy/dispense`, `POST /api/beds/discharge`, `POST /api/insurance/claims`, `PATCH /api/insurance/claims/[id]`, `POST /api/payments/create-order`, `POST /api/clinic/toggle-payment`, `POST /api/clinic/settle-shift`, `POST /api/clinic/petty-cash`, all `lab/*` writes, `POST /api/prescriptions/[id]/whatsapp-dispatch`. Anyone who can reach the deployment can dispense drugs, discharge patients, or create insurance claims.
3. **Live secrets committed in the repo.** `apps/web/.env.local` (DB URL, JWT secret, Supabase keys, Groq key) and `apps/api/.env*` are on disk and not obviously gitignored from history. Rotate every key, purge history, move to Vercel env vars.
4. **Hardcoded supervisor PINs.** `src/app/api/beds/ledger/route.ts` accepts `7788`, `ADMIN99`, `SUPER2026`, `9900`; the beds UI sends `"7788"` directly. This "audit override" gate is decorative.
5. **No server-side page protection.** No `middleware.ts`; `/superadmin`, `/dashboard`, `/clinic/*` are client-guarded only. Data is protected by API auth (where it exists), but route shells and any accidentally unguarded fetch are exposed.

### P1 — fix before onboarding a second clinic

6. **JWT in `localStorage`** across ~10 pages. XSS ⇒ full account takeover, including doctor and super-admin sessions. Use httpOnly cookies exclusively.
7. **Super-admin seed password mismatch.** The `superadmin` account exists but its seeded password is not `Password@123`; positive-path testing required minting a JWT. Password recovery/credential provisioning for platform admins is undocumented.
8. **Onboarding publishes clinics with a fixed default password** `Password@123` (`/api/onboarding/publish`) and is itself unauthenticated — anyone can create a clinic tenant.
9. **Public `/api/appointments`** returns patient names, phones and slots. Should be scoped to staff or reduced to anonymous aggregates.
10. **Weak document-download authorization.** `documents/signed-url` trusts a `clinicos_patient_phone` cookie that the client can set.
11. **Demo/fallback data still in code.** Doctor payout logic derives split percentages from array index (`isFounder = idx === 0 || slug.includes("rahul")`), invents deductions (`idx === 2 ? 400 : 0`), and fabricates settlements. `onboarding/extract` returns simulated data. These will silently produce wrong money numbers in a real clinic.
12. **Rate limiting / lockout absent** on login and OTP-less booking.

### P2 — hardening

13. No CSRF protection on cookie-authenticated mutations.
14. No audit trail on most writes (only EMR has `emr_audit_trail` usage).
15. No request validation library — manual field checks vary by route.
16. Error responses leak Postgres messages (`column "…" does not exist`, constraint names) to clients.

---

## 8. Data & schema governance

The canonical SQL lives in `supabase/schema.sql` and `supabase/migrations/001_canonical_baseline.sql`, but the **live database was evolved outside that system**. Consequences found and worked around:

| Drift | Impact |
|---|---|
| `reviews.is_verified_visit` vs `verified_patient` | `POST /api/reviews` returned 500 until rewritten |
| `patient_documents` missing `file_url` | Upload returned 500 until column ensured |
| `clinics` missing `practice_type`, `organization_id`, `subscription_plan` | Login had to add a `42703` fallback branch |
| `doctors.user_id` does not exist | Doctor authorization failed; now matched by `phone` |
| varchar IDs, code assumed uuid | `operator does not exist: character varying = uuid` on auth, booking, EOD lock, admin master |
| `pharmacy_inventory` / `lab_orders` / `business` tables named in code don't exist | Real tables: `pharmacy_items`, `diagnostic_lab_orders` |
| Migration 002 not applied | Org/practice-plan multi-tenancy advertised but not live |

**Recommendation:** freeze the live schema, generate one idempotent `003_live_reconciliation.sql` from the actual DB, then run migrations in CI. Stop using `CREATE TABLE IF NOT EXISTS` inside request handlers.

---

## 9. Repository hygiene

`git status` shows a large, uncommitted working tree: many deleted pages (`/admin`, `/medicines`, `/lab-tests`, `/partner`, marketplace APIs), deleted packages (`packages/database`, `packages/types`), deleted docs, **plus** the fixes in this pass. Nothing is committed, so there is no clean baseline to roll back to.

Also:
- `apps/api/` — 3,426 dead files (venv + `__pycache__` + stale SQLite DB).
- `.vercel/output/static/packages/database/seed.sql` still ships the old seed with the `Password@123` bcrypt hash even though the source was deleted.
- No test framework, no CI, no lint gate in the build pipeline.

---

## 10. Product assessment against the "lightweight but powerful" goal

**Where it succeeds.** Depth per clinic is excellent for a small Indian clinic: token queue, EMR, prescription, pharmacy, lab, beds, cash reconciliation and doctor payouts in one place is a real differentiator versus aggregator apps. The UX is modern and the modules talk to each other (booking → queue → consult → prescription → pharmacy → settlement).

**Where it misses "lightweight".** The surface area is enormous for a single-clinic product: insurance claims, ABDM/FHIR, inpatient beds with ward housekeeping, LIS QC, rehab plans, cycle counts, HHI schedules. Most are half-wired and unauthenticated. A local clinic will not use 60% of it, but every module is an attack surface and a maintenance cost.

**Recommended product narrowing for v1:**
1. Doctor discovery + booking + live queue (the actual wedge).
2. Front desk: check-in, token call, payment toggle.
3. Consult + prescription (with WhatsApp dispatch).
4. Daily cash closing + doctor payout.
5. Patient portal behind OTP.

Ship those five flawlessly; hide or delete beds, insurance, lab QC, rehab and ABDM until each has auth and tests.

---

## 11. Prioritized roadmap

### Sprint 0 — before any real clinic data (1–2 weeks)
- [ ] Authenticate `/api/patients/[phone]` (staff JWT + tenant, or OTP patient session). Return 401, not masked data.
- [ ] Add an auth wrapper to every one of the 58 unauthenticated routes; default-deny, allow-list public endpoints (`/api/doctors`, `/api/clinics`, `login`, `register`).
- [ ] Rotate all secrets; remove `.env*` from git history; add `.gitignore` enforcement; delete `apps/api`.
- [ ] Replace hardcoded supervisor PINs with per-user credentials + audit rows.
- [ ] Scope `/api/appointments` reads to staff/tenant.
- [ ] Commit the current working tree as a baseline before further edits.

### Sprint 1 — correctness & data (2–3 weeks)
- [ ] Generate and apply `003_live_reconciliation.sql`; add a migration runner to CI.
- [ ] Remove all `CREATE TABLE`/`ALTER TABLE` from request handlers.
- [ ] Delete index-based payout math and fabricated deductions; compute splits from stored contracts.
- [ ] Remove the `Password@123` onboarding default; require invite + password set.
- [ ] Standardize request validation (zod) and error envelopes (no raw PG messages).

### Sprint 2 — hardening (3–4 weeks)
- [ ] Move JWT to httpOnly cookies only; drop `localStorage` token.
- [ ] Add `middleware.ts` for route protection + security headers + CSRF.
- [ ] Add rate limiting/lockout on auth and booking.
- [ ] Add Vitest/Playwright tests for the five v1 flows; run `tsc` + build + tests in CI.
- [ ] Add audit logging to every clinical and financial write.

### Sprint 3 — product focus
- [ ] Hide/delete unused modules (beds, insurance, LIS QC, rehab, ABDM) or finish them properly.
- [ ] Real ABDM sandbox integration or remove the badge.
- [ ] Observability: structured logs, Sentry, uptime checks.

---

## 12. How to run and reproduce these results

```bash
# 1. Install (from repo root)
npm install

# 2. Configure (create apps/web/.env.local)
DATABASE_URL=postgres://...        # Supabase pooler, sslmode=require
JWT_SECRET_KEY=<32+ random chars>
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...                   # optional, AI scribe only

# 3. Type-check, build, run
cd apps/web
npx tsc --noEmit
npm run build
npm run start                      # http://localhost:3000
```

Seed accounts used in testing: `dr.rahul@clinicos.in`, `amit.rawat@gmail.com`, `+919876543214` — password `Password@123`. Note that `secure` cookies are off over local HTTP, so authenticated API testing must send `Authorization: Bearer <access_token>` from the login response.

---

## 13. Bottom line

The engineering work here is real and substantial: 39 pages, 80 API routes, 59 database tables, a working booking-to-settlement loop, and a build that compiles clean. The product has a credible wedge for Dehradun clinics.

But right now the system **trusts the network**. Fifty-eight endpoints accept unauthenticated writes, the patient-history endpoint hands out clinical records to anyone with a phone number, credentials sit in the repo, and the live schema has drifted away from its own migration files. Fix those four things — auth coverage, patient lookup, secrets, and schema reconciliation — and this moves from an impressive prototype to a pilot-ready product. Everything else on the roadmap is secondary to that.
