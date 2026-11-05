# ClinicOS — Remediation Plan & Feature Roadmap

**Companion to:** `CLINICOS_ANALYSIS_REPORT.md`
**Date:** 31 October 2026
**Assumption:** one senior full-stack engineer, existing stack (Next.js 15 App Router, postgres.js, Supabase, Vercel). Effort is in **dev-days**; calendar estimates assume ~5 productive days/week.

---

## 0. Executive plan

The work splits into two tracks that must not be mixed:

| Track | Goal | Duration | Gate |
|---|---|---|---|
| **A. Remediation** | Make the existing product safe for real patient data | 5–6 weeks | Security gate: no unauthenticated PHI or money endpoints |
| **B. Features** | Make it worth paying for | 10–14 weeks after A | Product gate: one clinic can run a full day without a spreadsheet |

**Sequencing rule:** do not build a single new feature until Phase 1 (auth) and Phase 2 (patient privacy) are done. Every new feature added before that inherits the same holes and doubles the cleanup cost.

**Current baseline (measured, not estimated):**

| Metric | Value |
|---|---|
| Route files / exported handlers | 80 / 106 |
| Handlers with **no auth call at all** | **81 (76%)** |
| Non-GET handlers with no auth call | **48** |
| Pages | 39 |
| TS/TSX LOC in `apps/web/src` | ~57,900 |
| Live DB tables | 59 |
| Tables in `schema.sql` that match live | partial — drift confirmed |
| Automated tests | **0** |
| CI pipeline | **none** |

---

## 1. Principles (non-negotiable for this codebase)

1. **Default deny.** A route is private unless explicitly listed as public. Today it is the opposite.
2. **Tenant comes from the token, never from a query parameter or body.** `?clinic_slug=` is a filter to validate, not an identity.
3. **One auth path.** No route reads `Authorization` or cookies by hand. Everything goes through one guard module.
4. **No DDL at request time.** `CREATE TABLE` / `ALTER TABLE` inside handlers is banned after Phase 3.
5. **No fabricated data.** If the database has no rows, return zero — never invent doctors, payouts, or reviews.
6. **Money and clinical writes are append-only + audited.** No silent `UPDATE` without an audit row.
7. **Migrations are the only way schema changes.** If it isn't in `supabase/migrations`, it doesn't exist.

---

## 2. Phase 0 — Safety net (2 days)

Nothing else is safe until this exists.

| # | Task | Detail | Done when |
|---|---|---|---|
| 0.1 | Commit the current tree | Working tree has ~40 modified/deleted files and zero commits of the fixes. Commit as `chore: baseline before security sprint`. | `git log` shows a clean baseline |
| 0.2 | Create `security/p0-auth` branch | All remediation on a branch; deploy to a staging Vercel project | Branch + staging URL exist |
| 0.3 | Rotate every secret | `JWT_SECRET_KEY`, `DATABASE_URL` password, Supabase anon+service keys, `GROQ_API_KEY`, any WhatsApp/Razorpay keys | Old keys revoked; app runs on new keys |
| 0.4 | Purge secrets from git history | `git filter-repo --path apps/web/.env.local --invert-paths` (and `apps/api/.env*`). Add `.env*` + `!.env.example` to `.gitignore` | `git log --all -- '**/.env*'` returns nothing |
| 0.5 | Delete `apps/api` | 3,426 files of venv + `__pycache__` + stale SQLite; no application source. Also removes a second copy of secrets | Directory gone; build still passes |
| 0.6 | Delete `.vercel/output/static/packages/database/seed.sql` | Build artifact still ships the `Password@123` bcrypt hash | File gone from repo and build output |
| 0.7 | Add `.env.example` | Document every required variable, no values | New dev can boot from it |
| 0.8 | Staging database | Supabase branch DB or a second project. Never test against production data again | Staging DB reachable; seed script runs on it |

**Exit test:** fresh clone → copy `.env.example` → `npm i` → `npm run build` succeeds, no secrets in `git grep`.

---

## 3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0

This is the single highest-risk area: **81 of 106 handlers have no auth call.** Anyone who can reach the deployment can dispense drugs, discharge patients, create insurance claims, patch clinic records, and toggle payments.

### 3.1 Build one guard module

New file `apps/web/src/lib/api-auth.ts`:

```ts
export type Role =
  | "owner" | "clinic_admin" | "doctor" | "staff" | "receptionist"
  | "patient" | "super_admin";

export type GuardOptions = {
  roles?: Role[];                 // allowed clinic roles
  allowPatientSelf?: (req: NextRequest) => string | null; // phone the patient may read
  requireVerifiedDoctor?: boolean;
  audit?: { action: string; entity: string };  // optional audit hook
};

// Returns { ok: true, auth } or { ok: false, response }
export async function guard(req: NextRequest, opts?: GuardOptions): Promise<GuardResult>;
```

Rules it enforces, in order:

1. Extract token from `Authorization: Bearer` **or** `clinicos_token` cookie (one place, replacing `extractAuthToken` duplication).
2. Verify JWT signature/expiry (`HS256`).
3. Load the user from `user_accounts` by `id::text` — reject if missing or `is_active = false` (live revocation).
4. Load the active `clinic_memberships` row for the target clinic.
5. **Resolve the target clinic from the token/membership, not from `?clinic_slug`.** If a slug/ID is supplied, it must equal the member's clinic or return 403.
6. Check role against `opts.roles`.
7. Return `{ user, membership, clinic, doctor }`.

Also add a **patient** variant (`guardPatient`) for Phase 2, and keep `authorizeSuperAdmin` as a thin wrapper over `guard({ roles: ["super_admin"] })`.

Delete the near-duplicate logic in `src/lib/auth.ts` (`authorizeClinicUser` stays as a compatibility wrapper that calls `guard`).

### 3.2 Classify every handler

The full per-method inventory is appended in §14. The policy to apply:

| Class | Access | Handlers | Notes |
|---|---|---|---|
| **A. Public (allowlist)** | none | `GET /api/doctors`, `GET /api/clinics`, `GET /api/reviews`, `GET /api/appointments/live-queue`, `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/reviews` | Must return **only** non-PHI fields |
| **B. Public but minimized** | none | `GET /api/appointments` | Replace full rows with counts/slots, or move to staff-only |
| **C. Staff (any clinic role)** | token + membership | `desk-queue`, `clinic/admin GET`, `automations`, `eod-summary`, `shifts GET`, `petty-cash GET`, `settlement GET`, `stream`, `token-alert`, `pharmacy/* GET`, `lab/orders GET`, `prescriptions/[id] GET`, `patients GET`, `documents GET` | Read-only operational data |
| **D. Clinic admin / owner** | token + role | `settlement POST`, `settle-shift`, `petty-cash POST`, `schedule-automations`, `trigger-automation`, `clinics PATCH`, `expenses DELETE`, `shifts POST`, `eod-lock` | Money + tenant config |
| **E. Clinical staff (doctor/staff)** | token + role | `pharmacy/dispense`, `pharmacy/returns`, `pharmacy/recall`, `lab/* writes`, `prescriptions/*`, `beds/*`, `insurance/claims`, `documents POST`, `patients POST` | Clinical writes |
| **F. Patient self (Phase 2)** | patient JWT | `patients/[phone]` (own), `documents/signed-url` (own), `prescriptions/[id]` (own) | Phone must match token |
| **G. Super admin** | token + role | `admin/master`, `clinics POST`, `onboarding/publish`, `onboarding/extract` | Platform actions |
| **H. Machine / webhook** | shared secret header | `notifications/whatsapp`, `payments/verify`, `lab/machine-import`, `clinic/token-alert` | HMAC or `X-Webhook-Secret`, constant-time compare |
| **I. Delete** | — | `abdm/*` (mock), `rehab/*`, `ai/consultant` (or make staff-only) | See §12 |

### 3.3 Fix the worst specific holes first

Do these before the mechanical sweep — they are exploitable today:

| Route | Current behaviour | Fix |
|---|---|---|
| `PATCH /api/clinics` | **Unauthenticated** — anyone can edit any clinic's profile | owner/admin + tenant match |
| `POST /api/clinics` | Auth exists but role unchecked | super_admin only |
| `POST /api/clinic/toggle-payment` | **Unauthenticated** — mark any appointment paid/unpaid | staff + tenant |
| `POST /api/payments/create-order` | **Unauthenticated** — create payment orders | staff or patient-self |
| `POST /api/clinic/settle-shift`, `POST /api/clinic/petty-cash` | **Unauthenticated** cash movements | owner/admin |
| `POST /api/insurance/claims`, `PATCH /api/insurance/claims/[id]` | **Unauthenticated** claim creation/approval | staff + tenant; approval = owner |
| `POST /api/beds/discharge`, `/admit`, `/discharge-order` | **Unauthenticated** patient discharge | clinical staff + tenant |
| `POST /api/pharmacy/dispense` | **Unauthenticated** drug dispensing | pharmacist/staff + tenant |
| `POST /api/prescriptions/[id]/whatsapp-dispatch` | **Unauthenticated** PHI exfiltration | staff + tenant |
| `GET /api/clinic/admin` | **Unauthenticated** — leaks GSTIN, registration numbers, staff list | staff + tenant |
| `GET /api/clinic/shifts` | **Unauthenticated** cash drawer totals for any `?clinic_slug` | staff + tenant |
| `GET /api/clinic/desk-queue`, `eod-summary`, `settlement`, `petty-cash`, `automations` | Same pattern | staff + tenant |
| `POST /api/onboarding/publish` | Creates a clinic tenant with default password `Password@123` | super-admin invite flow |
| `GET /api/patients` | Patient list, unauthenticated | staff + tenant |
| `GET /api/prescriptions/[id]` | Prescription PHI by ID | staff, or patient-self |
| `DELETE /api/expenses` | Anyone can delete expenses | owner/admin + tenant |

### 3.4 Add defense-in-depth middleware

New `apps/web/src/middleware.ts`:

- Matcher: `/dashboard/:path*`, `/clinic/:path*`, `/superadmin/:path*`, `/patient/portal`.
- Verify JWT with **`jose`** (edge-compatible; `jsonwebtoken` is not usable in Next 15.1 edge middleware).
- Unauthenticated → redirect to `/login?next=…`; wrong role → `/403`.
- This is a UX/defense layer, **not** the security boundary — the API guards in 3.1 remain authoritative.

### 3.5 Add rate limiting

Minimum viable, no new infra: a `rate_limits` table (`key`, `window_start`, `count`) with an atomic upsert, or Upstash Redis if available.

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 5 / 15 min / IP + 5 / 15 min / identifier |
| `POST /api/auth/register` | 3 / hour / IP |
| `POST /api/appointments` (public) | 10 / hour / IP |
| OTP request (Phase 2) | 3 / hour / phone, 60 s resend cooldown |
| Everything else | 120 / min / user |

### 3.6 Exit criteria

- [ ] `grep -L "guard(" **/route.ts` returns only the class-A allowlist.
- [ ] Automated test matrix: for each non-public handler, anonymous → 401, wrong-tenant → 403, wrong-role → 403, correct role → 2xx.
- [ ] No route reads `cookie` or `authorization` directly (enforced by lint rule `no-restricted-syntax`).
- [ ] `?clinic_slug=` can never widen access — verified by cross-tenant tests on every clinic route.

**Effort:** 5–7 days (mechanical, but 106 handlers at ~15–25 min each plus the guard and tests).

---

## 4. Phase 2 — Patient identity & clinical privacy (4–5 days) 🔴 P0

Today `/api/patients/[phone]` returns allergies, chronic conditions, prescriptions and document references to **any anonymous caller** who supplies a 10-digit number. Masking a phone number does not protect the diagnosis. This is a DPDP Act 2023 exposure.

### 4.1 Replace phone lookup with OTP-verified sessions

New tables (migration `003`):

```sql
CREATE TABLE patient_otp_challenges (
  id            text PRIMARY KEY,
  phone         text NOT NULL,
  otp_hash      text NOT NULL,
  attempts      int  NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL,
  consumed_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON patient_otp_challenges (phone, created_at DESC);

CREATE TABLE patient_sessions (
  id            text PRIMARY KEY,
  phone         text NOT NULL,
  token_hash    text NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

New endpoints:

| Endpoint | Behaviour |
|---|---|
| `POST /api/patient/auth/request-otp` | 6-digit OTP, hashed at rest, 5-min TTL, 3/hour/phone, 60 s cooldown, generic response (no phone enumeration) |
| `POST /api/patient/auth/verify-otp` | Max 5 attempts, single-use, issues `aud=patient` JWT (30 days) in httpOnly cookie + returns token for API clients |
| `POST /api/patient/auth/logout` | Revokes session row |

### 4.2 Rewrite `/api/patients/[phone]`

- No token → **401**, not a masked record.
- Patient JWT → only if `token.phone` matches `[phone]`.
- Clinic JWT → only if the patient has an appointment/document/prescription **at that clinic**.
- Super admin → allowed, audited.
- Every access writes an `audit_events` row (`action = "patient_record.view"`).

### 4.3 Related privacy fixes

| Item | Fix |
|---|---|
| `documents/signed-url` trusts `clinicos_patient_phone` cookie | Require patient JWT or staff JWT; signed URL TTL ≤ 5 min |
| `GET /api/appointments` returns names + phones publicly | Staff-only, or return `{doctor_slug, date, booked_count}` only |
| `reviews` accepts a name with no proof of visit | Keep verified-visit flag; consider requiring the phone of a completed visit |
| No consent capture | Add `patient_consents` (phone, purpose, granted_at, revoked_at, source) and surface in the portal |
| No data export/erasure | Add `POST /api/patient/data-export` and an erasure request flow (DPDP rights) |

### 4.4 Exit criteria

- [ ] Anonymous `/api/patients/9876543210` → 401.
- [ ] Patient A cannot read patient B (403).
- [ ] Doctor from clinic X cannot read a patient who never visited clinic X (403).
- [ ] OTP brute force locked after 5 attempts; 3/hour cap verified.
- [ ] `audit_events` contains a row for every record view.

**Effort:** 4–5 days including the WhatsApp/SMS OTP provider wiring (or a console-log stub for staging).

---

## 5. Phase 3 — Schema reconciliation & data layer (4–5 days) 🟠 P1

The live DB has drifted from `supabase/schema.sql`; migration `002` was never applied; routes create tables at request time.

| # | Task | Detail |
|---|---|---|
| 3.1 | Dump the live schema | `pg_dump --schema-only` against production → `supabase/live_schema.sql` (reference only) |
| 3.2 | Diff | Compare live vs `001_canonical_baseline.sql`; list every column/type/index difference |
| 3.3 | Write `003_live_reconciliation.sql` | Idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS`, type fixes, missing indexes, `verified_patient` → `is_verified_visit` cleanup, `patient_documents.file_url` |
| 3.4 | Apply `002_organizations_practice_plans.sql` | Or delete it and remove the login fallback branch — pick one, don't leave both |
| 3.5 | Migration runner | `scripts/migrate.mjs` + `schema_migrations(version, applied_at)` table; run in CI before deploy |
| 3.6 | Remove runtime DDL | Every `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` in `src/app/api/**` (`reviews`, `documents/upload`, others) |
| 3.7 | Fix the varchar/uuid class of bugs permanently | Document in `supabase/README.md`: **all IDs are `text`**; ban `::uuid` casts via lint/grep in CI |
| 3.8 | Generate DB types | `supabase gen types` or hand-written `src/lib/db-types.ts`; replace `any` in hot paths |
| 3.9 | Fix wrong table names | `pharmacy_inventory` → `pharmacy_items`, `lab_orders` → `diagnostic_lab_orders`, `business` → remove |

**Exit criteria:** fresh staging DB restored from migrations + seed equals live schema (column-level diff empty); app boots with zero `42P07`/`42701`/`42703` notices.

**Effort:** 4–5 days.

---

## 6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1

Current payout logic is fabricated: split percentage derived from array index (`isFounder = idx === 0 || slug.includes("rahul")`), invented deductions (`idx === 2 ? 400 : 0`), fabricated refunds. In a real clinic this produces wrong money.

| # | Task | Detail |
|---|---|---|
| 4.1 | `doctor_compensation_contracts` table | `doctor_id`, `clinic_id`, `split_pct`, `consumables_policy`, `effective_from`, `effective_to`, `created_by` |
| 4.2 | `payout_ledger` (append-only) | `id, clinic_id, doctor_id, period_start, period_end, gross, deductions, net, status, computed_at, approved_by` |
| 4.3 | Recompute payouts from facts | Appointments + pharmacy dispenses + refunds + approved expenses — no index heuristics |
| 4.4 | Admin UI to set contracts | Replace the hardcoded defaults; require owner role |
| 4.5 | `audit_events` table + `logAudit()` | `actor_id, actor_role, clinic_id, action, entity, entity_id, before, after, ip, ua, created_at` |
| 4.6 | Audit every clinical/financial write | Dispense, discharge, payment toggle, settlement, payout, expense delete, prescription edit |
| 4.7 | Reconciliation report | Daily expected vs counted cash, per shift, per payment mode; variance reasons required above threshold |
| 4.8 | Immutable receipts | Sequential invoice numbers per clinic (no gaps), GST fields, credit notes |

**Exit criteria:** a seeded scenario with 3 doctors, mixed cash/UPI, one refund and one consumable produces exactly the expected payout; every money mutation has an audit row; no code path uses array position to decide money.

**Effort:** 5 days.

---

## 7. Phase 5 — Hardening & frontend auth (4–5 days) 🟠 P1

| # | Task | Detail |
|---|---|---|
| 5.1 | Cookies only | Remove JWT from `localStorage` (10 sites). Use httpOnly + `SameSite=Lax` + `Secure`; access via `/api/auth/me` on boot |
| 5.2 | CSRF | Double-submit token for cookie-auth mutations; reject `Origin` mismatch |
| 5.3 | Input validation | `zod` schemas per route; reject unknown fields; cap string lengths |
| 5.4 | Error envelope | `{ error: { code, message, request_id } }`; never leak Postgres messages |
| 5.5 | Security headers | CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` in `next.config.js` |
| 5.6 | Replace hardcoded PINs | `beds/ledger` `7788/ADMIN99/SUPER2026/9900` → per-user credential + audit row; UI stops sending a literal |
| 5.7 | File upload scanning | MIME + magic-byte check + size cap (exists partially); virus scan hook or quarantine bucket |
| 5.8 | Session revocation | `token_version` on `user_accounts`; bump on password change/logout-all |

**Exit criteria:** XSS payload cannot read a token (none in JS storage); CSRF test fails without token; every 4xx/5xx has a machine-readable code.

**Effort:** 4–5 days.

---

## 8. Phase 6 — CI, tests, observability (3 days + ongoing) 🟡 P1

| # | Task | Detail |
|---|---|---|
| 6.1 | GitHub Actions | `npm ci` → `tsc --noEmit` → `next build` → `vitest` → deploy preview |
| 6.2 | Auth matrix test | Table-driven: every route × {anon, patient, staff, doctor, owner, superadmin, cross-tenant} |
| 6.3 | E2E (Playwright) | 5 critical journeys: book → queue → consult → prescribe → dispense → settle; patient OTP login; staff check-in; payout approval; super-admin suspend |
| 6.4 | Seed/fixtures | Deterministic seed on staging; no production credentials in CI |
| 6.5 | Observability | Sentry (client+server), structured JSON logs with `request_id`, `/api/health` (DB ping + version) |
| 6.6 | Backups | Daily Supabase PITR; quarterly restore drill; document RPO/RTO |
| 6.7 | Dependency hygiene | `npm audit` gate; pin Next.js; Dependabot |

**Exit criteria:** PR cannot merge if build or auth-matrix tests fail; staging deploy is automatic; a failed request can be traced by `request_id`.

---

## 9. Timeline & gates

```
Week 1   Phase 0 (safety net)          Phase 1 starts (guard + 20 worst routes)
Week 2   Phase 1 complete (all 81)     Auth matrix green
Week 3   Phase 2 (patient OTP+privacy)  Privacy tests green        ← PILOT GATE
Week 4   Phase 3 (schema reconcile)     Fresh-DB boot green
Week 5   Phase 4 (money + audit)        Reconciliation green
Week 6   Phase 5 (hardening)            Phase 6 (CI)              ← REAL-DATA GATE
```

**Pilot gate (end of week 3):** one clinic may use it with real patients, because no endpoint returns PHI without identity.
**Real-data gate (end of week 6):** money is correct, writes are audited, schema is reproducible.

After week 6, feature work begins.

---

## 10. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Auth sweep breaks the frontend | High | Do it route-by-route with the auth matrix; keep a `DEV_BYPASS` flag that is **impossible** in production (`NODE_ENV !== "production"` + explicit env) |
| Patient OTP depends on WhatsApp provider approval | Medium | Ship SMS fallback + staging console OTP; abstract behind `sendOtp(phone)` |
| Production DB migration causes downtime | High | Take a snapshot, run `003` on staging first, additive-only changes, deploy guard against old columns |
| Live clinic is already using the app | High | Freeze writes during cutover, announce a maintenance window, keep a read-only mode |
| One engineer, broad scope | High | Enforce the phase gates; cut features (§12) rather than skip security |
| Financial rewrite changes historical numbers | Medium | Recompute into new ledger tables; never mutate historical payouts in place |
| ABDM/insurance scope creep | Medium | Explicitly out of scope until week 14 |

---

## 11. Decisions I need from you

1. **Target segment:** solo practitioners (₹1,599/mo tier) or multi-doctor polyclinics (₹11,299/mo)? This changes scheduling, seats, and payout complexity.
2. **Geography:** Dehradun-only pilot, or multi-city from day one? Affects tenancy and onboarding.
3. **ABDM/ABHA:** real integration now, or remove the badge and revisit at week 14?
4. **Payments:** Razorpay (code already assumes it) or another provider?
5. **Notifications:** WhatsApp Cloud API, a BSP (Interakt/Gupshup), or SMS-first?
6. **Team/timeline:** is it just you, or can a second engineer take the Phase 1 mechanical sweep in parallel?

---

# Part B — Features worth building

## 12. What to cut first

Breadth is the product's biggest liability. Every half-wired module is an unaudited attack surface and a support burden. Recommend hiding behind a feature flag (or deleting) until each earns its place:

| Module | Verdict | Reason |
|---|---|---|
| `abdm`, `abdm/fhir` | **Delete or flag** | Mock-grade, unauthenticated, no real ABDM sandbox |
| `rehab/*` | **Delete** | 4 handlers, no UI depth, duplicates therapy planning |
| `insurance/*` | **Flag** | Valuable later, but claims workflow without auth/audit is dangerous |
| `beds/*`, ward housekeeping | **Flag** | Deep but niche; only sell if a day-care client demands it |
| `lab/qc`, `machine-import` | **Flag** | LIS-grade features for a clinic product; keep orders + results only |
| `marketplace`, `medicines`, `lab-tests`, `partner` | Already deleted | Keep deleted; the zero-markup story doesn't need a marketplace |
| `ai/consultant` | **Flag or staff-only** | Costs money per call, unauthenticated today |

**Keep and polish (the wedge):** discovery → booking → live queue → front desk → consult/prescription → pharmacy → cash closing → doctor payout.

---

## 13. Feature roadmap

### v1.1 — "A clinic can run a full day" (weeks 7–10)

These are not nice-to-haves; without them a real front desk keeps a paper register alongside the app.

| # | Feature | Why it's necessary | Scope | Effort |
|---|---|---|---|---|
| 1 | **Appointment lifecycle** | Today a booking can't be moved or cancelled. Reception does it by phone and the queue desyncs | `PATCH /api/appointments/[id]` (reschedule/cancel/no-show), status machine, slot capacity, doctor leave/blocked slots, waitlist | 5 d |
| 2 | **Doctor schedule & chamber management** | Multi-chamber polyclinics need per-day, per-chamber slot templates and conflict detection | `doctor_schedules`, `schedule_exceptions`, conflict check on booking, UI in `/dashboard/chambers` | 4 d |
| 3 | **Notification engine** | Patients don't install apps; WhatsApp is the channel. Reminders are the #1 no-show lever | Provider abstraction, templates (confirm/reminder/token-called/report-ready/payment-link), outbox table + retry worker, delivery status, opt-out | 5 d |
| 4 | **Payments & reconciliation** | Cash-only is a blocker for UPI-first patients; the existing payment routes are unauthenticated stubs | Razorpay live, UPI intent, refunds, webhook with HMAC, daily settlement vs gateway report | 5 d |
| 5 | **GST billing & receipts** | Clinics need invoices for corporate/insurance patients | Sequential invoice numbers, GST breakup, credit notes, day book, printable receipt, expense approval | 4 d |
| 6 | **Staff & role management UI** | Memberships exist in the DB but the admin UI was deleted; owners can't invite or revoke staff | Invite by phone, role matrix, deactivate, login history, force logout | 3 d |
| 7 | **Subscription enforcement** | `subscription_status` is displayed but never enforced; trials never expire | Plan limits (doctors, chambers, seats), trial countdown, grace period, read-only when expired, dunning reminders | 3 d |
| 8 | **Tenant onboarding with verification** | Anyone can currently create a clinic with `Password@123` | Invite-only, doctor council-reg verification, clinic KYC docs, approval queue, no default passwords | 4 d |
| 9 | **Data export & backup** | Clinics ask "can I get my data out?" before signing; also a DPDP expectation | Per-clinic CSV/JSON export, prescription PDF archive, restore runbook | 3 d |

**v1.1 total: ~36 dev-days (~7–8 weeks for one engineer).** Ship in two releases: 1–4 first (the daily loop), then 5–9.

### v1.2 — "Why choose this over a paper register" (weeks 11–14)

| # | Feature | Differentiator | Effort |
|---|---|---|---|
| 10 | **WhatsApp-first patient journey** | Book, get token, see queue position, receive prescription PDF and lab report — no app install. This is the actual moat in India | 5 d (reuses #3) |
| 11 | **Offline-first front desk PWA** | Clinics lose connectivity; a desk that keeps working is a trust signal. Queue writes in IndexedDB, sync on reconnect with conflict rules | 6 d |
| 12 | **Hinglish voice → SOAP note** | Doctor speaks, note + prescription draft appears. Extends existing scribe route; adds review-before-sign | 5 d |
| 13 | **Prescription safety panel** | Drug–drug interaction + allergy cross-check surfaced before signing; existing `check-interactions` is unused in UI | 3 d |
| 14 | **Patient timeline** | One screen: visits, prescriptions, labs, documents, payments. Reduces "where is my report?" calls | 3 d |
| 15 | **Clinic analytics** | Daily ops: footfall, no-show rate, avg wait, revenue per doctor, collection rate, top diagnoses. Owners pay for this | 4 d |
| 16 | **Doctor payout transparency** | Doctor sees their own ledger and disputes in-app — removes the monthly argument | 3 d |
| 17 | **Lab report delivery + critical-value escalation** | Report PDF to patient WhatsApp; abnormal values page the doctor | 4 d |
| 18 | **Inventory reorder & expiry intelligence** | Auto purchase suggestions, expiry/recall alerts, supplier ledger. Extends existing pharmacy tables | 4 d |
| 19 | **Review response & verified-visit badge** | Clinic replies publicly; only completed visits can review (partly built) | 2 d |
| 20 | **Multi-branch org view** | Migration 002 already models organizations; consolidated dashboard, shared patient identity across branches | 5 d |

### v1.3 — Bets (weeks 15+)

| Feature | When it makes sense |
|---|---|
| Teleconsult (video + e-prescription + payment) | After the in-clinic loop is rock solid |
| ABDM/ABHA linkage (real sandbox) | If you need hospital/insurer interoperability or government pilots |
| Insurance/TPA claim automation | When a clinic with meaningful claim volume asks |
| Referral network between clinics | Once you have 10+ clinics in one city |
| No-show prediction & smart overbooking | Once you have 3+ months of appointment history |
| Patient family accounts | High demand in Indian households; moderate effort |
| Population-health dashboards | Only for a chain/hospital buyer |
| EMI / financing | Partnership play, not core |

---

## 14. Feature sequencing logic

```
Auth (P1) ──► Patient identity (P2) ──► Schema (P3) ──► Money/Audit (P4) ──► Hardening (P5) ──► CI (P6)
                                                                                    │
                                                                                    ▼
                                    Appointment lifecycle ──► Notifications ──► Payments ──► Billing
                                                     │                │
                                                     ▼                ▼
                                          Doctor schedules      WhatsApp journey
                                                     │
                                                     ▼
                                        Staff admin ──► Subscription enforcement ──► Onboarding/KYC
                                                     │
                                                     ▼
                                        Analytics ──► Payout transparency ──► Org/multi-branch
```

Dependencies that matter:
- Notifications (#3) is a **hard dependency** for OTP, reminders, prescription delivery, lab reports, payment links. Build the outbox+templates once.
- Payments (#4) must land before billing (#5) — reconciliation needs a real gateway feed.
- Staff admin (#6) before subscription enforcement (#7) — you need someone to manage seats.
- Analytics (#15) only after audit events (#4.5) exist, otherwise numbers are guesses.

---

## 15. Success metrics for the pilot

Instrument these from day one; they tell you whether the product is actually working.

| Metric | Target by week 12 |
|---|---|
| Booking → show-up rate | ≥ 75% (reminders should lift this) |
| Avg patient wait time | ≤ 15 min, visible live |
| Token accuracy (screen vs reality) | ≥ 98% |
| Consult → prescription sent | ≤ 2 min |
| Cash variance at EOD | < 1% of collections |
| Payout disputes per month | 0 |
| Front-desk actions without a spreadsheet | 100% of daily ops |
| Unauthenticated PHI endpoints | **0** (hard gate) |
| Auth matrix test coverage | 100% of handlers |
| p95 API latency | < 400 ms |

---

## 16. Definition of done (per phase)

A phase is done only when all four are true:

1. **Code** — merged to `main`, reviewed, no `TODO` left in the touched paths.
2. **Tests** — automated coverage for the new behaviour, including the negative cases (401/403).
3. **Docs** — `README`/`supabase/README` updated; new env vars in `.env.example`.
4. **Evidence** — a short runbook or recorded test output proving the acceptance criteria.

---

## Appendix — full per-handler auth inventory

`AUTH` = the handler calls an auth/verification helper; `NONE` = no check at all.

| Route | Method | Auth |
|---|---|---|
| `/abdm` | GET, POST | NONE |
| `/abdm/fhir/[id]` | GET | NONE |
| `/admin/master` | GET, POST | AUTH |
| `/ai/consultant` | POST | NONE |
| `/appointments` | GET, POST | NONE |
| `/appointments/book` | POST | AUTH |
| `/appointments/live-queue` | GET | NONE (intended public) |
| `/auth/login` | POST | NONE (intended public) |
| `/auth/me` | GET | AUTH |
| `/auth/register` | POST | NONE (intended public, needs rate limit) |
| `/beds` | GET | NONE |
| `/beds/admit` | POST | NONE |
| `/beds/clean` | POST | NONE |
| `/beds/discharge` | POST | NONE |
| `/beds/discharge-order` | POST | NONE |
| `/beds/ledger` | GET, POST | NONE |
| `/beds/tasks` | GET, POST | NONE |
| `/clinic/admin` | GET | NONE |
| `/clinic/admin` | POST | AUTH |
| `/clinic/automations` | GET | NONE |
| `/clinic/call-token` | POST | AUTH |
| `/clinic/complete-token` | POST | AUTH |
| `/clinic/desk-queue` | GET | NONE |
| `/clinic/doctor-payouts` | GET, POST | AUTH |
| `/clinic/eod-lock` | POST | AUTH |
| `/clinic/eod-summary` | GET | NONE |
| `/clinic/petty-cash` | GET, POST | NONE |
| `/clinic/schedule-automations` | POST | NONE |
| `/clinic/settle-doctor-payout` | POST | AUTH |
| `/clinic/settle-shift` | POST | NONE |
| `/clinic/settlement` | GET, POST | NONE |
| `/clinic/settlements` | GET | AUTH |
| `/clinic/shifts` | GET | NONE |
| `/clinic/shifts` | POST | AUTH |
| `/clinic/stream` | GET | NONE |
| `/clinic/toggle-payment` | POST | NONE |
| `/clinic/token-alert` | GET, POST | NONE |
| `/clinic/trigger-automation/[id]` | POST | NONE |
| `/clinic/walk-in` | POST | AUTH |
| `/clinics` | GET | NONE (intended public) |
| `/clinics` | PATCH | NONE ⚠️ |
| `/clinics` | POST | AUTH |
| `/doctors` | GET | NONE (intended public) |
| `/documents` | GET, POST | AUTH |
| `/documents/signed-url` | GET | AUTH (weak) |
| `/documents/upload` | POST | AUTH |
| `/expenses` | DELETE | NONE ⚠️ |
| `/expenses` | GET | NONE |
| `/expenses` | POST | AUTH |
| `/insurance/claims` | GET, POST | NONE |
| `/insurance/claims/[id]` | PATCH | NONE |
| `/lab/accession` | POST | NONE |
| `/lab/create-order` | POST | NONE |
| `/lab/critical-alert` | POST | NONE |
| `/lab/machine-import` | POST | NONE |
| `/lab/orders` | GET | NONE |
| `/lab/qc` | GET, POST | NONE |
| `/lab/results` | POST | NONE |
| `/lab/sample-collect` | POST | NONE |
| `/notifications/whatsapp` | POST | NONE |
| `/onboarding/extract` | POST | NONE |
| `/onboarding/publish` | POST | NONE |
| `/patients` | GET | NONE |
| `/patients` | POST | AUTH |
| `/patients/[phone]` | GET | AUTH (masking only — still P0) |
| `/payments/create-order` | POST | NONE |
| `/payments/verify` | POST | AUTH |
| `/pharmacy/bills` | GET | NONE |
| `/pharmacy/cycle-count` | POST | NONE |
| `/pharmacy/dispense` | POST | NONE |
| `/pharmacy/inventory` | GET, POST | NONE |
| `/pharmacy/inventory/[id]/stock` | PUT | NONE |
| `/pharmacy/inventory/add-batch` | POST | NONE |
| `/pharmacy/inventory/adjust-stock` | POST | NONE |
| `/pharmacy/prescriptions-queue` | GET | NONE |
| `/pharmacy/recall` | GET, POST | NONE |
| `/pharmacy/returns` | GET, POST | NONE |
| `/pharmacy/schedule-h1` | GET | NONE |
| `/pharmacy/transfers` | GET, POST | NONE |
| `/prescriptions/[id]` | GET | NONE |
| `/prescriptions/[id]/whatsapp-dispatch` | POST | NONE |
| `/prescriptions/check-interactions` | POST | NONE |
| `/prescriptions/generate` | POST | AUTH |
| `/prescriptions/scribe` | POST | AUTH |
| `/rehab/plans` | GET, POST, PUT | NONE |
| `/rehab/sessions` | POST | NONE |
| `/reviews` | GET, POST | NONE (intended public, needs rate limit) |
