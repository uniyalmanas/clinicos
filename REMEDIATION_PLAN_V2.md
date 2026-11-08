# ClinicOS — Remediation Plan v2

**Created:** 7 November 2026
**Baseline commit:** `865f501`
**Supersedes:** the still-open P0 items in `REMEDIATION_AND_ROADMAP_PLAN.md`
**Inputs:** `CURRENT_STATE_REVIEW` (this session), `CLINICOS_ANALYSIS_REPORT.md` (31 Oct, partly stale)

---

## 0. How to use this plan

- Every task has an ID, the review finding it closes, the files it touches, an **acceptance test**, and a **rollback**.
- Work top-to-bottom. Phases 0–2 are security-critical and should not be mixed with feature work.
- Do not start Phase 3 until the live-schema capture is done; the repo's DDL cannot be trusted.
- Each phase ends at a **gate**. Do not advance with a red gate.

**Global principle for every fix:** *fail closed on identity, fail loud on data.* A clinic can tolerate a 503 for 30 seconds; it cannot tolerate a stranger holding an owner session.

---

## 1. Issue → task traceability

| Review ID | Issue | Task |
|---|---|---|
| A1 | Login/guard fail open on DB error | P0-1 |
| A2 | Onboarding publish takeover | P0-2 |
| A3 | Default credentials, no password reset | P0-3, P1-1 |
| A4 | Public queue leaks name + phone | P2-1 |
| A5 | Unauthenticated message/AI abuse | P2-2 |
| A6 | JWT in localStorage | P1-2 |
| A7 | Role taxonomy drift / duplicate rules | P1-5 |
| A8 | Rate limiter fails open | P1-3 |
| A1b | No token revocation | P1-4 |
| B1 | Missing DDL for ~28 tables | P3-2 |
| B2 | `consultation_fee_default`, `appointments.source` | P3-3 |
| B3 | No RLS, anon key, DB driver in client bundle | P2-3, P4-6 |
| B4 | Contradictory TEXT vs UUID baselines | P3-1 |
| B5 | Runtime `CREATE TABLE` | P3-4 |
| B6 | Token allocation race in `POST /api/appointments` | P3-5 |
| B7 | Silent demo fallbacks in read APIs | P0-4 |
| C2 | Patient live queue uses staff SSE | P4-1 |
| C3 | Check-in "welcome back" broken | P4-2 |
| C4 | Modules orphaned / "Coming Soon" / README gap | P4-3 |
| C5 | Shadowed duplicate pages | P4-4 |
| C6 | `next` vs `redirect` param mismatch | P4-5 |
| C7 | Demo data visible to users | P4-3 |
| C1 | *Corrected:* `/doctors` and `/clinics` **listings** redirect to `/search` by design; detail routes are not shadowed. No fix required beyond confirming in P4-4. | P4-4 |

---

## Phase 0 — Stop the bleeding (target: 1 day)

> **Status (7 Nov 2026): implemented in code, partially verified.**
>
> Shipped: P0-1, P0-2, P0-3, P0-4.
>
> Verified against a running dev server with `DATABASE_URL` empty (so the DB is
> genuinely unreachable):
> - `POST /api/auth/login` → `503 auth_unavailable`, no `Set-Cookie`
> - `GET /api/auth/me` with an invalid token → `401`
> - `GET /api/doctors` and `GET /api/doctors?slug=…` → `503 data_unavailable`
> - `GET /api/health` → `503 { status: "degraded" }`
> - `POST /api/onboarding/publish` (no patient cookie) → `401 phone_verification_required`
> - `POST /api/onboarding/extract` with 5,000 chars → `413 text_too_large`
> - `GET /api/appointments` anonymous → `401`
> - `npm run typecheck`, `npm run build`, `npm run check:demo-guards` → green
>
> Still needs a live database to verify end-to-end:
> - OTP → publish → pending (201) → superadmin `approve_clinic` → doctor listed
> - `409 account_exists` for an existing account with a valid OTP cookie
> - Password rotation of live accounts (`npm run audit:passwords`)
>
> Files added: `lib/demo-data.ts`, `lib/require-db.ts`, `lib/password.ts`,
> `app/api/health/route.ts`, `app/api/onboarding/{request-otp,verify-otp}/route.ts`,
> `scripts/audit-default-passwords.mjs`, `scripts/check-demo-guards.mjs`.

### P0-1 · Fail-closed authentication
**Closes:** A1
**Why:** today, a Postgres outage issues tokens for any password, including `super_admin`.

**Changes**
1. `apps/web/src/app/api/auth/login/route.ts`
   - Delete `DEMO_FALLBACK_ACCOUNTS`, the `isDbDown` branch, and the synthetic-account fallback (lines ~57–185).
   - On query failure return `503 { code: "auth_unavailable" }`. Never sign a token.
   - Keep the dummy-hash timing equalisation for unknown users.
2. `apps/web/src/lib/api-auth.ts`
   - Remove the `isDbConnected` fallback that synthesises `user`, `clinic` (`derma-care-dehradun`) and `doctor` (`doc_default_1`) (lines ~170–197, 244–255, 323–354).
   - On any DB failure return `503 { code: "auth_unavailable" }`.
   - If `effectiveRole` is `doctor` but no linked `doctors` row exists, return `403 { code: "doctor_profile_missing" }` instead of inventing one. Owners and clinic admins may legitimately be non-practising, so `doctor` stays `null` for them (routes that need a prescriber already handle a null doctor).
3. `apps/web/src/lib/db.ts`
   - In production, throw at module init if `DATABASE_URL` is missing/placeholder, instead of connecting to `127.0.0.1`. Keep the build-phase escape hatch via `NEXT_PHASE === "phase-production-build"`.
4. Add `apps/web/src/lib/require-db.ts` with `assertDatabase()` used by the health check.

**Acceptance**
- With `DATABASE_URL` pointed at an unreachable host and `NODE_ENV=production`:
  - `POST /api/auth/login` → `503`, no `Set-Cookie`, no `access_token`.
  - `GET /api/auth/me` with any token → `503`.
- `grep -R "DEMO_FALLBACK_ACCOUNTS\|doc_default_1\|derma-care-dehradun" apps/web/src` returns **zero** matches in auth paths.
- Login with wrong password against a live DB → still `401` (no regression).

**Rollback:** revert the three files; no schema change.

---

### P0-2 · Close the onboarding account-takeover
**Closes:** A2
**Why:** a public POST with a known phone number re-roles that user to `owner` and returns a session.

**Changes**
1. `apps/web/src/app/api/onboarding/publish/route.ts`
   - Require a **patient OTP session** proving the submitted phone: call `guardPatient(req)` and require `auth.phone === normalisePhone(body.phone)`.
   - **Never** `UPDATE` an existing `user_accounts` row. If the phone exists → `409 { code: "account_exists", next: "login_then_add_clinic" }`.
   - Require a client-supplied password (`min 12 chars`, not in deny-list). Remove `Password@123`.
   - Insert `user_accounts.is_verified = true` (phone was proven) but `clinics.status = 'pending'`, `doctors.verification_status = 'pending'`, `doctors.is_active = false`, and **no** `clinic_memberships` until the clinic is activated.
   - Do **not** sign an access token or set a cookie. Return the pending clinic/doctor ids only.
2. `apps/web/src/app/api/onboarding/extract/route.ts`
   - Keep public but hard-cap `raw_text` at 4,000 chars, add a 15 s upstream timeout, and reduce the Groq limit to 10/hour/IP (see P2-2).
3. New `apps/web/src/app/api/onboarding/request-otp/route.ts` and `verify-otp` reuse the existing patient OTP service so the flow is: extract → prove phone → set password → pending review.
4. `apps/web/src/app/onboarding/page.tsx` — replace the "instant session" success screen with "pending verification", add password + confirm fields, remove the `Password@123` copy UI.

**Acceptance**
- `POST /api/onboarding/publish` with `phone` = an existing `super_admin` or owner, no patient cookie → `401`.
- With a valid OTP cookie for that phone → `409`; DB row unchanged (`role`, `is_verified` identical before/after).
- With a valid OTP cookie for a new phone → `201 pending`; no `clinicos_token` in response headers; doctor/clinic `verification_status`/`status` = `pending`; doctor absent from `GET /api/doctors`.
- Superadmin approval (`POST /api/admin/master` action `approve_clinic`) flips status to `active` and lists the doctor.

**Rollback:** revert route + page. Existing tenants are untouched (no data migration).

---

### P0-3 · Remove standing credentials and rotate
**Closes:** A3 (part 1)
**Changes**
1. `apps/web/src/app/login/page.tsx` — delete the `demoAccounts` array and the "Demo Credentials" panel (~lines 43–172).
2. `apps/web/src/app/onboarding/page.tsx` — remove the fixed-password display/copy.
3. `scripts/fix_superadmin.mjs` — delete it, or require `SUPERADMIN_PASSWORD` and refuse any value equal to `Password@123`.
4. `scripts/test_live_suite.mjs` — read credentials from env (`TEST_DOCTOR_PHONE`, `TEST_DOCTOR_PASSWORD`); fail if unset.
5. **Operational:** rotate every account that could still carry `Password@123`:
   ```sql
   -- identify candidates (bcrypt compare must be done in app/script, not SQL)
   SELECT id, phone, full_name, role, is_verified, is_active
   FROM user_accounts WHERE role IN ('owner','clinic_admin','doctor','super_admin','superadmin');
   ```
   Force a reset for each whose hash matches the default (write a one-off `scripts/audit-default-passwords.mjs` using bcrypt.compare, then set a random hash + `must_change_password = true`).

**Acceptance**
- `grep -R "Password@123" --exclude-dir=node_modules .` returns only historical `.md` documents (which should be rewritten or clearly marked historical).
- `/login` page source contains no credential literals.
- Superadmin login with `Password@123` → `401`.

**Rollback:** restore the UI panel (not recommended) or re-run the fix script with an explicit password.

---

### P0-4 · Stop silent demo fallbacks in read paths
**Closes:** B7
**Changes**
1. `apps/web/src/app/api/appointments/route.ts:61-64` — return `503` instead of `[]`.
2. `apps/web/src/app/api/doctors/route.ts:71-79` — only return `DEHRADUN_DOCTORS` when `process.env.NODE_ENV !== "production" && ALLOW_DEMO_DATA === "true"`; otherwise `503`.
3. `apps/web/src/lib/clinic-data.ts` — same guard around fallbacks (see P4-6).
4. Add `scripts/check-demo-guards.mjs` to CI that greps for direct `DEHRADUN_*` imports inside `app/api/**` and fails.

**Acceptance**
- With the DB unreachable, `GET /api/doctors` and `GET /api/appointments` → `503`, not demo data.
- In dev with `ALLOW_DEMO_DATA=true`, they still return fixtures.

**Rollback:** revert four files.

### Gate 0
- [ ] P0-1…P0-4 acceptance tests pass.
- [ ] No default credential exists in the running product.
- [ ] A DB outage cannot mint a token (verified with a blocked host).
- [ ] Deploy to a preview environment and run the smoke suite before production.

---

## Phase 1 — Identity hardening (target: 2 days)

### P1-1 · Password lifecycle
**Closes:** A3 (part 2)
**Changes**
1. New `POST /api/auth/change-password` (guarded): requires `current_password`, enforces 12+ chars, denies known defaults, re-hashes, increments `token_version`.
2. New `POST /api/auth/request-password-reset` + `POST /api/auth/reset-password`: OTP-verified via the existing `patient_otp_challenges`/`sendOtp` service, 5-minute expiry, single use.
3. Add `must_change_password BOOLEAN DEFAULT false` to `user_accounts` (migration 010); login returns `{ must_change_password: true }` and the UI redirects to the change form.
4. Settings page: add a change-password card for staff; add "reset password" action for owners on team members.
5. Password policy helper in `lib/password.ts`: length, deny-list (`Password@123`, phone number, name), optional breach check later.

**Acceptance**
- Change with wrong current password → `401`; with correct → `200`, old token invalid after `token_version` bump (P1-4).
- Reset with expired/used OTP → `401`; with valid OTP → `200`, old sessions revoked.
- Setting `Password@123` → `400 weak_password`.

**Rollback:** remove the new routes and UI card; migration adds a nullable column only.

### P1-2 · Cookie-only sessions
**Closes:** A6
**Changes**
1. `login/page.tsx` and `superadmin/page.tsx` — stop writing `clinicos_token` to `localStorage`; keep only non-sensitive display data (or nothing).
2. `dashboard/layout.tsx` — replace the `localStorage` gate with `GET /api/auth/me`; redirect on 401. Keep the shell-less loading state.
3. `lib/api.ts` — remove `getAuthHeaders()` from localStorage, or restrict it to an explicit dev bearer mode.
4. `handleLogout` — call `POST /api/auth/logout` (create it) to clear the httpOnly cookie; then clear display state.

**Acceptance**
- Fresh login leaves no `clinicos_token` in `localStorage`; page refresh still authenticated via cookie.
- Setting a fake `clinicos_token` in `localStorage` grants no UI and no API access.
- Logout clears the cookie (`Set-Cookie: max-age=0`) and `/api/auth/me` → `401`.

**Rollback:** restore the layout read; cookie remains authoritative, so risk is low.

### P1-3 · Rate limiting that cannot disappear
**Closes:** A8
**Changes**
1. `lib/rate-limit.ts` — add a process-local `Map` fallback used when the DB call fails; on **auth** buckets (`auth:login:*`, `otp:*`) fail **closed** after the fallback also fails.
2. Add a `failClosed` argument or a `strict` wrapper for auth/OTP routes.
3. Add cleanup for stale `rate_limits` rows (a daily `DELETE ... WHERE window_start < now() - interval '1 day'` inside the migration or a cron route guarded by `CRON_SECRET`).
4. Wire the existing `CRON_SECRET` (currently unused) to the cleanup route.

**Acceptance**
- With `rate_limits` table dropped, login still enforces the in-memory limit and returns `429` after N attempts.
- Non-auth endpoints keep the availability-first behaviour.

**Rollback:** revert the helper; no schema change.

### P1-4 · Token revocation
**Closes:** A1b
**Changes**
1. `lib/auth.ts` — include `tv: user.token_version ?? 0` in the JWT.
2. `lib/api-auth.ts` — compare `payload.tv` to the live `user_accounts.token_version`; mismatch → `401`.
3. Increment `token_version` on password change/reset, role change, deactivation.
4. `middleware.ts` — optional fast path: reject tokens whose `tv` is absent and issued after rollout? Keep middleware JWT-only (no DB) but rely on the guard for the real check.

**Acceptance**
- Password change invalidates all existing tokens within one request.
- Deactivating a staff member immediately blocks API access.

**Rollback:** remove the claim/check; existing tokens keep working.

### P1-5 · One role model
**Closes:** A7
**Changes**
1. Define `lib/roles.ts` exporting `CLINIC_ROLES`, `ADMIN_ROLES`, `CLINICAL_ROLES`, display labels, and `canAccessRoute(role, path)`.
2. Delete `ROLE_ALLOWLIST` and the duplicate redirect block in `dashboard/layout.tsx`; use `canAccessRoute`.
3. Remove `front_desk`, `pharmacist`, `lab_tech` or formally add them to the DB check constraint in migration 010 (choose one — recommend removing for now).
4. Align `middleware.ts` `STAFF_ROLES` with `lib/roles.ts`.

**Acceptance**
- A receptionist cannot reach `/dashboard/finance` via URL, nav, or client redirect.
- `grep -R "front_desk\|lab_tech" apps/web/src` returns only the role module if kept.

**Rollback:** revert the layout; roles in DB unchanged.

### Gate 1
- [ ] No tokens in `localStorage`.
- [ ] Password reset works end-to-end with OTP.
- [ ] Revocation verified.
- [ ] Rate-limit fallback tested with the DB table removed.

---

## Phase 2 — Exposure reduction (target: 2 days)

### P2-1 · Minimise the public queue payload
**Closes:** A4
**Changes**
1. `api/waiting-room/queue/route.ts` — return only `token_number`, `doctor_slug`, `doctor_name`, `status`, `time_slot`. Remove `patient_name`, `patient_phone`, `symptoms_description`, `fee_amount`, `appointment_number` from the public response.
2. If the TV needs a name, return `patient_display` = first name + last initial, computed server-side.
3. Update `app/display/waiting-room/page.tsx` types and render.
4. Add `Cache-Control: no-store` and keep the per-IP limit.

**Acceptance**
- `curl -s "/api/waiting-room/queue?clinic_slug=derma-care-dehradun" | grep -E "patient_phone|\"patient_name\""` returns nothing.
- The waiting-room page still renders and updates via SSE.

**Rollback:** revert route + page; no schema change.

### P2-2 · Close unauthenticated messaging / AI abuse
**Closes:** A5
**Changes**
1. `api/clinic/token-alert/route.ts` — only send if an appointment exists for that `clinic_slug + token_number + phone` on today's date; add a per-phone cooldown (1/10 min) in addition to per-IP.
2. `api/onboarding/extract/route.ts` — cap input at 4,000 chars, add `AbortSignal.timeout(15_000)`, 10/hour/IP, and run the regex path first for obvious inputs.
3. `api/lab/machine-import/route.ts` — already secret-gated; add a per-secret timestamp/nonce check and a maximum payload size.
4. Document every public endpoint in `apps/web/src/app/api/README.md` with its abuse control.

**Acceptance**
- Token-alert for a phone that does not own that token → `403`, no outbound message (mock the sender).
- Extract with 100 KB body → `413`/`400`.
- Machine-import replay with the same nonce → `409`.

**Rollback:** revert routes.

### P2-3 · RLS + server-only data layer
**Closes:** B3
**Changes**
1. `lib/supabase.ts` — add `import "server-only"`; split any future browser-safe client into `lib/supabase-browser.ts`.
2. `lib/db.ts` and `lib/clinic-data.ts` — add `import "server-only"`.
3. Migration `010_rls_lockdown.sql`:
   ```sql
   DO $$
   DECLARE r record;
   BEGIN
     FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
       EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
       EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', r.tablename);
     END LOOP;
   END $$;
   REVOKE ALL ON SCHEMA public FROM anon, authenticated;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
   ```
   The app connects as the table owner via the pooler, so RLS does not affect server queries.
4. Storage: keep the `patient-documents` bucket private; verify no public policy exists.
5. Add a CI check that fails if any new migration creates a table without enabling RLS.

**Acceptance**
- `curl "$SUPABASE_URL/rest/v1/prescriptions?select=*" -H "apikey: $ANON"` → `401/403` or `[]`; same for `user_accounts`, `patients`, `patient_documents`.
- `grep -R "NEXT_PUBLIC_SUPABASE" apps/web/src` shows only `lib/supabase.ts` (server-only) and `lib/api.ts` (boolean flag). No DB client in `.next/static`.
- `npm run build` still succeeds (server-only guard proves the import graph is clean).

**Rollback:** migration `010` can be reversed with `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` + re-grant, but do not roll back before verifying the anon exposure is closed.

### Gate 2
- [ ] Anon key cannot read any table.
- [ ] Public queue contains no PII.
- [ ] No public endpoint can send arbitrary messages.
- [ ] Client bundle contains no postgres client and no server secret.

---

## Phase 3 — Schema truth (target: 3 days)

> **Prerequisite:** `pg_dump` or `supabase db dump` access to the live DB. Do not hand-write DDL from memory.

### P3-1 · Capture the real schema as the baseline
**Closes:** B4
**Changes**
1. Run once against production (read-only):
   ```bash
   pg_dump "$DIRECT_DATABASE_URL" --schema-only --no-owner --no-privileges \
     > supabase/migrations/000_live_baseline.sql
   ```
   (or `supabase db dump --schema public -f supabase/migrations/000_live_baseline.sql`).
2. Move `001_canonical_baseline.sql` and `schema.sql` to `supabase/legacy/` with a README explaining they are historical and do **not** reflect production.
3. Update `scripts/migrate.mjs` baseline detection to use `000` (currently checks `001`/`002`).
4. Re-verify migrations 003–009 are idempotent against the dump; fix any `ALTER` that assumes a type (e.g. `clinics.organization_id TEXT` over a `varchar` column is fine, over `uuid` is not).

**Acceptance**
- `createdb clinicos_test && DATABASE_URL=… node scripts/migrate.mjs` → all migrations apply cleanly.
- `npm run build` + smoke test against the fresh DB, including beds/lab/insurance/pharmacy.
- `node scripts/migrate.mjs --status` lists `000` as baselined on production, then 003–009.

**Rollback:** the dump is additive; production is not altered by capturing it.

### P3-2 · Add the missing tables
**Closes:** B1
**Changes**
1. Diff the live dump against the repo's migration set (the dump already contains them, so this task is really about **generating the migration for environments that start from the repo**).
2. Create `supabase/migrations/011_missing_clinical_tables.sql` containing the ~28 missing tables, generated from the live dump, with `IF NOT EXISTS`:
   `emr_patients`, `emr_allergies`, `emr_clinical_visits`, `emr_audit_trail`, `emr_lab_vault`, `emr_duplicate_merges`, `emr_allergy_contraindications`, `emr_secure_exports`, `bed_admissions`, `bed_billing_ledger`, `bed_billing_overrides`, `bed_care_tasks`, `bed_sanitization_logs`, `bed_shift_handovers`, `clinic_beds`, `clinic_wards`, `diagnostic_lab_orders`, `insurance_claims`, `lis_quality_control_runs`, `lis_critical_alert_logs`, `pharmacy_return_challans`, `pharmacy_stock_transfers`, `pharmacy_schedule_h`, `clinic_petty_cash_float`, `clinic_petty_cash_ledger`, `doctor_schedules`, `doctor_blocked_slots`, `clinic_sent_automations`.
3. Add indexes and FKs as they exist in the dump.
4. Add a CI smoke test that boots an empty Postgres, applies all migrations, and runs `SELECT count(*) FROM information_schema.tables`.

**Acceptance**
- Empty DB + migrations → every table the code references exists. Add `scripts/check-table-coverage.mjs` that greps `sql\`...FROM table\`` and asserts each table is in `information_schema`.

### P3-3 · Fix column drift
**Closes:** B2
**Changes**
1. `api/check-in/public/route.ts:69` — replace `consultation_fee_default` with `consultation_fee` (and `COALESCE(..., 0)`).
2. Migration `012_columns.sql`:
   - `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'walk_in';`
   - Any other columns found by the coverage script.
3. Add `scripts/check-column-coverage.mjs` (or rely on the type-checker + a runtime smoke) to catch future drift.

**Acceptance**
- `POST /api/check-in/public` against a fresh DB → `200` with a token.
- The waiting-room display shows the new token within one SSE cycle.

**Rollback:** code change is the safe direction (removing a nonexistent column); the added column is nullable/defaulted.

### P3-4 · Remove runtime DDL
**Closes:** B5
**Changes**
1. Delete `ensureTable()` / `ensureConsultationReportsTable()` from:
   - `api/clinic/trigger-automation/[id]/route.ts`
   - `api/clinic/schedule-automations/route.ts`
   - `api/consultations/reports/route.ts`
   - `api/doctors/schedule/route.ts`
   - `api/doctors/schedules/route.ts`
   - `api/doctors/blocked/route.ts`
2. Ensure those tables are in P3-2's migration.
3. Remove the try/catch that hid a missing table; let it 500 loudly until the migration is applied.

**Acceptance**
- `grep -R "CREATE TABLE" apps/web/src/app/api` returns zero.
- All six routes work against the freshly migrated DB.

**Rollback:** restore the helpers (not recommended).

### P3-5 · Fix token allocation race
**Closes:** B6
**Changes**
1. `api/appointments/route.ts:128-134` — wrap in `sql.begin` and take
   `pg_advisory_xact_lock(hashtext(clinic_id || ':' || doctor_slug || ':' || date))`,
   matching `/book` and `/check-in`.
2. Consider a unique index `(clinic_id, doctor_slug, appointment_date, token_number)` to make the invariant enforceable.

**Acceptance**
- A concurrency script that fires 20 parallel creates gets 20 distinct tokens.
- The unique index rejects a deliberate duplicate insert.

**Rollback:** drop the index if legacy data violates it (dedupe first); the lock change is safe.

### P3-6 · CI drift gate
**Changes**
1. GitHub Actions job `schema`:
   - start Postgres 15 service,
   - `node scripts/migrate.mjs`,
   - run the coverage scripts,
   - `npm run typecheck && npm run build`.
2. Nightly job: dump production schema and diff against `000_live_baseline.sql`; fail if drift is not captured in a new migration.

**Acceptance:** a PR that adds a `sql\`SELECT ... FROM new_table\`` without a migration fails CI.

### Gate 3
- [ ] Fresh DB reproduces production.
- [ ] No runtime DDL.
- [ ] All clinical modules pass a smoke test on the fresh DB.
- [ ] Drift check green.

---

## Phase 4 — Frontend correctness (target: 2.5 days)

### P4-1 · Fix the patient live queue
**Closes:** C2
**Changes**
1. `app/patient/portal/page.tsx:263` — replace `/api/clinic/stream` with
   `/api/waiting-room/stream?clinic_slug=${encodeURIComponent(clinicSlug)}`.
2. Add `clinic_slug` to the `ActiveBooking` type in `lib/patientSession.ts` and populate it from the booking/check-in responses (`appointments/book`, `check-in/public`).
3. Handle `onerror`: reconnect with backoff and fall back to polling `/api/waiting-room/queue` every 20 s.
4. Hide the ticker with a clear message if the clinic slug is unknown.

**Acceptance**
- With a valid patient cookie and an active booking, the portal receives `token_called` events (simulate with `curl -X POST /api/clinic/call-token` as staff).
- No `401` in the network tab for the stream.

**Rollback:** revert the one URL + type; no backend change.

### P4-2 · Fix check-in lookup
**Closes:** C3
**Changes**
1. Remove the phone lookup in `app/check-in/page.tsx:233-269` and always show the details form (simplest, no PII oracle).
2. If a "welcome back" experience is required, add `GET /api/check-in/lookup?clinic_slug&phone` that returns only `{ known: boolean }` (rate-limited, no names, no clinical data) and read `{ known }` — not `patientProfile`.

**Acceptance**
- A new patient completes check-in without seeing an error.
- A returning patient does not have their name pre-filled from an unauthenticated lookup.

**Rollback:** revert the page; endpoint additive.

### P4-3 · Wire the real modules + truth in the README
**Closes:** C4, C7
**Changes**
1. `dashboard/layout.tsx` — add a **Clinical** section (visible to `CLINICAL_ROLES`): Beds (`/dashboard/beds`), Laboratory (`/dashboard/lab`), Insurance (`/dashboard/insurance`), Pharmacy (`/dashboard/pharmacy`).
2. Remove those names from `FUTURE_MODULES`; keep only genuinely unbuilt modules.
3. Waiting-room display: replace hardcoded demo patients with an empty state unless `?demo=1` is present.
4. README: either implement `/dashboard/abdm` + `/dashboard/rehab` or remove the ABDM/FHIR and Physiotherapy sections. Recommended: remove the claims now, track as v1.2 features.
5. Add a `docs/FEATURE_TRUTH.md` table mapping README claims → route/file or "not built".

**Acceptance**
- Every nav item resolves to a page (automated link check).
- No demo patient data renders without `?demo=1`.
- README claim table has no unimplemented routes.

**Rollback:** revert layout/README.

### P4-4 · Retire shadowed pages (low risk)
**Closes:** C5
**Changes**
1. Confirm each `next.config.mjs` redirect still reflects intent:
   - `/clinic/desk` → `/dashboard/desk` ✅
   - `/doctor/consult/:id` → `/dashboard/consult/:id` ✅
   - `/pharmacy/console` → `/dashboard/pharmacy` ✅
   - `/display/waiting-room` → `/waiting-room` ✅ (the target re-exports the source)
   - `/clinic/expenses` and `/clinic/settlement` → `/dashboard/finance` — **decide:** keep the dedicated pages and drop the redirects, or delete the pages.
   - `/doctors` and `/clinics` → `/search` — exact matches; **detail routes are fine.** Verify with `curl -I /doctors/dr-rahul-sharma` in preview.
2. Delete the losing implementation, not both:
   - if `/clinic/settlement` and `/clinic/expenses` are superseded → delete those page files;
   - if they are better → remove the redirects and link them.
3. Delete `/clinic/standee` or `/dashboard/standee` (pick one).
4. Keep `/waiting-room` as the canonical public display and `display/waiting-room` as its implementation.

**Acceptance**
- `npm run build` route list contains no unreachable duplicates.
- Link checker passes; no user-facing 404/redirect loop.

**Rollback:** revert config/pages.

### P4-5 · Redirect parameter + login UX
**Closes:** C6
**Changes**
1. Standardise on `?next=` everywhere; change `dashboard/layout.tsx:512` to `next=`.
2. Sanitize `next` to same-origin paths only (`startsWith("/") && !startsWith("//")`).
3. Show the pending-verification state from P0-2 on the login page.

**Acceptance**
- Expired session → login → returns to the original page.
- `?next=https://evil.example` is ignored.

**Rollback:** revert the two files.

### P4-6 · Server-only booking data
**Closes:** B3 (client bundle)
**Changes**
1. `app/book/page.tsx` — remove the `getDoctors()` call; fetch `/api/doctors` (public, already returns safe fields) in the existing `useEffect`.
2. `app/doctors/[slug]/page.tsx` and `app/clinics/[slug]/page.tsx` are server components; keep `clinic-data.ts` for them but mark it server-only.
3. Remove the static merge; if the API fails, show an error/empty state rather than silent demo data (P0-4).

**Acceptance**
- A doctor created via onboarding (pending) does not appear; after approval, appears on `/book` without a rebuild.
- `.next/static` contains no `postgres` client and no `DATABASE_URL`.

**Rollback:** restore the call; server-only guard prevents the regression from shipping.

### Gate 4
- [ ] Patient live queue updates in the browser.
- [ ] Check-in works for new and returning patients.
- [ ] Every nav item resolves.
- [ ] No demo data without an explicit flag.
- [ ] Booking shows live DB doctors.

---

## Phase 5 — Verification & operations (1.5 days, overlaps Phase 4)

### P5-1 · Automated negative-auth suite
Create `scripts/security-smoke.mjs` with assertions for:
1. DB-down login → `503`, no cookie.
2. Publish takeover → `401/409`, no role change.
3. `Password@123` → `401`.
4. Anon Supabase REST on `patients`, `prescriptions`, `user_accounts` → `401/403`.
5. Waiting-room queue → no `patient_phone`.
6. Cross-tenant access: clinic A token reading clinic B's patient/prescription/document → `403`.
7. Patient token reading another phone's record → `403`.
8. Rate limit after N attempts → `429`.
9. Expired/revoked token → `401`.

Wire it into CI on every PR and as a post-deploy check.

### P5-2 · Smoke suite for every clinical module
Extend the existing `scripts/test_live_suite.mjs` (currently only login/queue) to cover: beds admit/discharge, lab order/collect/result, insurance claim, pharmacy dispense, EOD lock, settlement. Run against the migrated fresh DB.

### P5-3 · Observability
1. Emit structured logs for `auth.denied`, `auth.unavailable`, `cross_tenant_denied`, `rate_limited`.
2. Add an alert on a spike in `auth.unavailable` (DB outage) and `403 cross_tenant_denied` (probing).
3. Add a `/api/health` endpoint (no secrets) returning DB reachability + migration version.

### P5-4 · Docs
- Update README to match P4-3.
- Add `docs/RUNBOOK.md`: rotate secrets, restore DB, approve clinic, handle locked superadmin.
- Add `docs/SECURITY.md`: auth model, tenant model, public endpoints, RLS posture.

---

## 2. Sequencing and critical path

```
P0-1 ─┬─> P0-2 ─> P0-3 ─> P0-4 ── Gate 0 ──> deploy preview
      │
      └─> P1-1 ─> P1-2 ─> P1-4 ─> P1-5 ── Gate 1
                         P1-3
P2-3 (RLS) can run in parallel with P1 after P0-1
P2-1, P2-2 any time after Gate 0
P3-1 ─> P3-2 ─> P3-3 ─> P3-4 ─> P3-5 ─> P3-6 ── Gate 3
P4-1, P4-2, P4-5, P4-6 any time after Gate 1
P4-3, P4-4 after P3-2 (nav depends on working modules)
P5-1, P5-2 written incrementally from Gate 0
```

**Critical path:** P0-1 → P0-2 → P0-3 → Gate 0 → P2-3 → P3-1 → P3-2 → Gate 3.
Everything else can be parallelised across two engineers.

**Estimated effort**

| Phase | Engineer-days | Can be parallel |
|---|---|---|
| 0 | 1 | no |
| 1 | 2 | partly (P1-3) |
| 2 | 2 | yes (P2-1/P2-2 vs P2-3) |
| 3 | 3 | yes (P3-2 generated, P3-3/P3-4/P3-5 independent) |
| 4 | 2.5 | yes (per page) |
| 5 | 1.5 | overlaps |
| **Total** | **12** | **≈ 7–8 calendar days with 2 engineers** |

---

## 3. Decisions needed before Phase 3

1. **Onboarding model.** Recommended: phone-verified self-serve + superadmin KYC approval (P0-2). Alternative: invite-only (slower, safer).
2. **`/clinic/settlement` and `/clinic/expenses`.** Keep the dedicated pages (remove redirects) or delete them in favour of `/dashboard/finance`? Recommended: delete, one finance surface.
3. **ABDM and Physiotherapy.** Build the two missing studios, or remove the claims from README? Recommended: remove claims now, keep the DB fields.
4. **RLS scope.** Lock down all public tables (recommended) vs only PHI tables. All is simpler and safer.
5. **Password reset channel.** WhatsApp OTP (already integrated) vs SMS provider. Recommended: WhatsApp first, SMS fallback behind the same adapter.

---

## 4. Definition of done

- [ ] No unauthenticated path can create a session, change a role, or read PHI.
- [ ] A database outage produces `503`, never a demo identity or demo data in production.
- [ ] The anon key cannot read any table.
- [ ] A fresh database built only from `supabase/migrations/` passes the full smoke suite.
- [ ] The patient journey (discover → book → live queue → portal → prescription) works with real DB data and no 401s.
- [ ] Every sidebar link resolves; no shadowed pages remain.
- [ ] `scripts/security-smoke.mjs` and `scripts/test_live_suite.mjs` are green in CI and after deploy.
- [ ] README claims match shipped routes.

---

## 5. Rollout & rollback

- Ship Phase 0 as a **hotfix** (preview → production) with a DB backup taken first.
- Phase 1–2 behind a preview deployment; run P5-1 against it.
- Phase 3 migrations are additive; take a `pg_dump` before applying and keep it for 7 days.
- Phase 4 is client-only; safe to ship independently.
- Every migration must be idempotent (`IF NOT EXISTS`) and reversible in a documented down-script, even if we never run it.
