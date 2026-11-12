# Graph Report - medic-sept-2026  (2026-11-12)

## Corpus Check
- 289 files · ~439,722 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1717 nodes · 4334 edges · 97 communities (79 shown, 18 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 144 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9465458`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Phase 4 — Frontend correctness (target: 2.5 days)
- portal/page.tsx
- dashboard/consult/[id]/page.tsx
- migrate.mjs
- BrowseSpecialtiesSection.tsx
- today/page.tsx
- ClinicOS / DocSphere — Project Report & Functional Test Results
- sql
- reports.py
- book/page.tsx
- schema-audit.mjs
- ThemeToggle
- DocSphere / ClinicOS 🩺
- patients/route.ts
- graph.py
- claims/route.ts
- compilerOptions
- web/package.json
- schedule/page.tsx
- check-in/page.tsx
- seed.mjs
- dependencies
- audit.ts
- ClinicOS — Remediation Plan & Feature Roadmap
- finance/page.tsx
- react
- PatientMemoryService
- machine-import/route.ts
- middleware.ts
- api-auth.ts
- devDependencies
- manifest.json
- smoke.mjs
- AIClinicalCompanion.tsx
- fix_superadmin.mjs
- models/__init__.py
- scripts
- schemas/__init__.py
- plans/route.ts
- rehab/page.tsx
- audit-default-passwords.mjs
- download_full_library.mjs
- reception/page.tsx
- scripts
- test_live_suite.mjs
- design-system.tsx
- call-token/route.ts
- app/layout.tsx
- reports/route.ts
- search/page.tsx
- PatientVaultPanel.tsx
- auth.ts
- next.config.mjs
- postcss.config.mjs
- api.ts
- display/waiting-room/page.tsx
- rules/graphify.md
- workflows/graphify.md
- Phase 1 — Identity hardening (target: 2 days)
- consultations.py
- ClinicOS — Remediation Plan v2
- ConsultationReport
- tailwind.config.ts
- guard
- ask_clinical_companion
- Phase 3 — Schema truth (target: 3 days)
- token/route.ts
- password.ts
- ClinicOS: Architecture & Engineering Reality Audit
- ConsultationRecorder.tsx
- 3.1 Build one guard module
- 5. Functional test results (executed)
- notifications.ts
- client
- ConnectionManager
- supabase.ts
- .get_verified_patient_records
- 11. Prioritized roadmap
- test_auth_invalid_token
- logAudit
- speaker-attribution.ts
- 7. Security findings (prioritized)
- Phase 0 — Stop the bleeding (target: 1 day)
- Phase 2 — Exposure reduction (target: 2 days)
- Phase 5 — Verification & operations (1.5 days, overlaps Phase 4)
- ref_crypto
- doctors/[slug]/page.tsx
- inventory/route.ts

## God Nodes (most connected - your core abstractions)
1. `sql` - 210 edges
2. `apiError()` - 189 edges
3. `guard()` - 185 edges
4. `next` - 157 edges
5. `logAudit()` - 125 edges
6. `react` - 64 edges
7. `lucide-react` - 60 edges
8. `CLINIC_ROLES` - 55 edges
9. `rateLimit()` - 43 edges
10. `rateLimitKey()` - 39 edges

## Surprising Connections (you probably didn't know these)
- `3. Deferred / not production-ready` --references--> `guard()`  [INFERRED]
  docs/FEATURE_TRUTH.md → apps/web/src/lib/api-auth.ts
- `6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1` --references--> `logAudit()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/audit.ts
- `P4-6 · Server-only booking data` --references--> `getDoctors()`  [INFERRED]
  REMEDIATION_PLAN_V2.md → apps/web/src/lib/clinic-data.ts
- `P1-1 · Password lifecycle` --references--> `sendOtp()`  [INFERRED]
  REMEDIATION_PLAN_V2.md → apps/web/src/lib/notifications.ts
- `P0-1 · Fail-closed authentication` --references--> `assertDatabase()`  [INFERRED]
  REMEDIATION_PLAN_V2.md → apps/web/src/lib/require-db.ts

## Import Cycles
- None detected.

## Communities (97 total, 18 thin omitted)

### Community 0 - "Phase 4 — Frontend correctness (target: 2.5 days)"
Cohesion: 0.22
Nodes (9): ActiveBooking, Gate 4, P4-1 · Fix the patient live queue, P4-2 · Fix check-in lookup, P4-3 · Wire the real modules + truth in the README, P4-4 · Retire shadowed pages (low risk), P4-5 · Redirect parameter + login UX, P4-6 · Server-only booking data (+1 more)

### Community 1 - "portal/page.tsx"
Cohesion: 0.15
Nodes (20): Allergy, AuthState, MePatient, PatientPortalPage(), PatientPortalView(), PatientRecord, PatientVisitReport, playTokenCallChime() (+12 more)

### Community 2 - "dashboard/consult/[id]/page.tsx"
Cohesion: 0.07
Nodes (36): DynamicConsultationStudioPage(), PrescribedMedicine, QRCodeDisplay, DiagnosticOrder, ParameterResult, QualityControlRun, StandaloneConsultationPage(), CLINICAL_DIAGNOSIS_PROTOCOLS (+28 more)

### Community 3 - "migrate.mjs"
Cohesion: 0.16
Nodes (14): args, connectionString, __dirname, dryRun, fileArgIndex, isLoopback, listMigrations(), main() (+6 more)

### Community 4 - "BrowseSpecialtiesSection.tsx"
Cohesion: 0.08
Nodes (18): HomePage(), PediatricsIcon(), BrowseSpecialtiesSectionProps, DentistIcon(), DermatologyIcon(), DiabetologyIcon(), EntIcon(), GeneralPhysicianIcon() (+10 more)

### Community 5 - "today/page.tsx"
Cohesion: 0.09
Nodes (25): API, Appointment, bmiCategory(), bpStage(), Doctor, MOCK_APPOINTMENTS, SchedulePane(), SPEED_RX_MOLECULES (+17 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.20
Nodes (9): 10. Product assessment against the "lightweight but powerful" goal, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 4. Feature inventory & runtime status, 8. Data & schema governance, 9. Repository hygiene (+1 more)

### Community 7 - "sql"
Cohesion: 0.06
Nodes (60): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin(), dynamic, GET(), maskName() (+52 more)

### Community 8 - "reports.py"
Cohesion: 0.09
Nodes (7): Settings, get_current_user(), get_db(), health_check(), lifespan(), CompanionInteraction, test_tenant_data_isolation()

### Community 9 - "book/page.tsx"
Cohesion: 0.10
Nodes (33): dynamic, GET(), dynamic, GET(), BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar() (+25 more)

### Community 10 - "schema-audit.mjs"
Cohesion: 0.10
Nodes (14): connectionString, __dirname, files, FUNCTION_NAMES, main(), missingTables, normalized, RESERVED (+6 more)

### Community 11 - "ThemeToggle"
Cohesion: 0.12
Nodes (20): DoctorConsultIndexPage(), playTokenCallChime(), ForDoctorsPage(), DEMO_ROLES, DemoRole, destinationFor(), LoginForm(), LoginPage() (+12 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.07
Nodes (26): 1. Status legend, 2. Verified modules, 3. Deferred / not production-ready, 4. Privacy invariants enforced today, 5. How to reproduce the verification, Feature Truth Table, 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management (+18 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.19
Nodes (18): dynamic, GET(), POST(), DashboardPatientsPage(), AllergyContraindicationCheck, checkAllergyConflict(), CLINICAL_OVERRIDE_REASON_CODES, EMRAllergy (+10 more)

### Community 14 - "graph.py"
Cohesion: 0.06
Nodes (18): BaseTranscriptionProvider, DeterministicFallbackProvider, GroqWhisperProvider, OpenAITranscriptionProvider, TranscriptionEngine, SpeakerAttributor, test_fact_extraction_hindi_terms(), test_fact_extraction_symptoms_and_vitals() (+10 more)

### Community 15 - "claims/route.ts"
Cohesion: 0.24
Nodes (13): dynamic, GET(), InsuranceClaim, POPULAR_TPAS, AUTHORIZED_FINANCE_PINS, calculateQuerySla(), FINANCE_OVERRIDE_REASON_CODES, IRDAI_DEDUCTION_REASON_CODES (+5 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "web/package.json"
Cohesion: 0.12
Nodes (16): typescript, name, private, version, clsx, postcss, qrcode, react-dom (+8 more)

### Community 18 - "schedule/page.tsx"
Cohesion: 0.18
Nodes (16): API, BlockDate(), BlockDateProps, BlockedSlot, DAYS_OF_WEEK, Doctor, DoctorSchedule, DoctorSchedulePage() (+8 more)

### Community 19 - "check-in/page.tsx"
Cohesion: 0.25
Nodes (10): API, CheckInKioskPage(), Doctor, KioskButton(), playCheckInChime(), QrCodeDisplay(), Step, STEP_LABELS (+2 more)

### Community 20 - "seed.mjs"
Cohesion: 0.13
Nodes (17): 3. Architecture (as verified, not as documented), Structural findings, connectionString, credentials, __dirname, future(), host, isLoopback (+9 more)

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, clsx, jose, jsonwebtoken, leaflet, lucide-react, next (+8 more)

### Community 22 - "audit.ts"
Cohesion: 0.06
Nodes (61): buildDoctorCard(), DoctorRow, dynamic, pickDoctor(), POST(), SPECIALTY_KEYWORDS, dynamic, PAYMENT_MODES (+53 more)

### Community 23 - "ClinicOS — Remediation Plan & Feature Roadmap"
Cohesion: 0.06
Nodes (32): 0. Executive plan, 10. Risk register, 11. Decisions I need from you, 12. What to cut first, 13. Feature roadmap, 14. Feature sequencing logic, 15. Success metrics for the pilot, 16. Definition of done (per phase) (+24 more)

### Community 24 - "finance/page.tsx"
Cohesion: 0.28
Nodes (11): DashboardFinancePage(), calculateDenominationTotal(), DenominationBreakdown, DoctorPayout, EXPENSE_APPROVAL_THRESHOLD_INR, ExpenseVoucher, PETTY_CASH_MIN_THRESHOLD_INR, PettyCashFloat (+3 more)

### Community 25 - "react"
Cohesion: 0.09
Nodes (14): ClinicProfilePage(), Props, AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), ClinicSessionTracker(), MapDoctor (+6 more)

### Community 26 - "PatientMemoryService"
Cohesion: 0.13
Nodes (6): get_patient_context(), get_patient_memory(), get_patient_timeline(), supersede_fact(), PatientMemoryService, utcnow()

### Community 27 - "machine-import/route.ts"
Cohesion: 0.31
Nodes (8): dynamic, POST(), PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "api-auth.ts"
Cohesion: 0.08
Nodes (28): dynamic, GET(), POST(), dynamic, GET(), dynamic, POST(), dynamic (+20 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "smoke.mjs"
Cohesion: 0.24
Nodes (16): ACCOUNTS, BASE, check(), __dirname, finish(), get(), idsFrom(), login() (+8 more)

### Community 33 - "AIClinicalCompanion.tsx"
Cohesion: 0.10
Nodes (38): dynamic, POST(), AIClinicalCompanion(), authHeaders(), BAR_PATTERN, formatTime(), getToken(), Props (+30 more)

### Community 34 - "fix_superadmin.mjs"
Cohesion: 0.14
Nodes (11): bcryptjs, apiDir, __dirname, FORBIDDEN, offenders, root, walk(), __dirname (+3 more)

### Community 35 - "models/__init__.py"
Cohesion: 0.32
Nodes (5): ClinicalFactRelation, ClinicalFactVersion, ClinicalSource, test_supersede_clinical_fact_flow(), test_verify_clinical_fact_audit_trail()

### Community 36 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, typescript, typescript, name, private, scripts, audit:passwords, build (+12 more)

### Community 37 - "schemas/__init__.py"
Cohesion: 0.21
Nodes (17): verify_fact(), ClinicalFactCreate, ClinicalFactResponse, FactStatusUpdate, ClinicalFactRelationResponse, ClinicalFactVersionResponse, ClinicalSourceCreate, ClinicalSourceResponse (+9 more)

### Community 38 - "plans/route.ts"
Cohesion: 0.14
Nodes (19): dynamic, GET(), dynamic, GET(), POST(), dynamic, GET(), Json (+11 more)

### Community 39 - "rehab/page.tsx"
Cohesion: 0.16
Nodes (13): ANATOMICAL_LIMITS, CONDITION_PRESETS, formatSafeDate(), formatSessionDate(), HomeworkItem, MODALITY_OPTIONS, PrescribedExercise, ProtocolVersionEntry (+5 more)

### Community 40 - "audit-default-passwords.mjs"
Cohesion: 0.20
Nodes (8): postgres, DEFAULT_PASSWORDS, __dirname, main(), outIndex, root, shouldFix, sql

### Community 41 - "download_full_library.mjs"
Cohesion: 0.20
Nodes (8): allHumaaans, clinicalDir, clinicalPhotos, doctorsDir, downloadFile(), illustrationsDir, main(), root

### Community 42 - "reception/page.tsx"
Cohesion: 0.14
Nodes (25): API, DoctorCard(), DoctorCardProps, DoctorChamberState, PatientRow(), PatientRowProps, playCheckInChime(), playChime() (+17 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "test_live_suite.mjs"
Cohesion: 0.31
Nodes (8): assert(), __dirname, main(), missingCredentials, root, sql, testDatabaseSchema(), testHttpEndpoints()

### Community 45 - "design-system.tsx"
Cohesion: 0.08
Nodes (27): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), NavItemProps, ROLE_ALLOWLIST (+19 more)

### Community 46 - "call-token/route.ts"
Cohesion: 0.22
Nodes (6): dynamic, POST(), dynamic, POST(), Listener, sseBroker

### Community 48 - "reports/route.ts"
Cohesion: 0.54
Nodes (7): asArray(), asObject(), cleanPhone(), dynamic, GET(), POST(), serialise()

### Community 49 - "search/page.tsx"
Cohesion: 0.24
Nodes (10): ALL_SEARCH_DOCTORS, DoctorPortrait(), normalizeSpecialty(), SearchDiscoveryContent(), SearchDiscoveryPage(), DoctorMapItem, GoogleTerrainMap(), initMap() (+2 more)

### Community 50 - "PatientVaultPanel.tsx"
Cohesion: 0.25
Nodes (10): Modal(), DOC_TYPE_ICONS, DOC_TYPE_LABELS, Document, escapeHtml(), formatDate(), formatSize(), PatientVaultPanel() (+2 more)

### Community 51 - "auth.ts"
Cohesion: 0.15
Nodes (14): GuardAuth, AUTH_COOKIE_OPTIONS, AuthClinic, AuthContext, AuthDoctor, AuthMembership, AuthorizeResult, AuthUser (+6 more)

### Community 54 - "api.ts"
Cohesion: 0.07
Nodes (22): BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord, CareTask, DischargeInvoice, ShiftHandoverRecord, WardInfo (+14 more)

### Community 55 - "display/waiting-room/page.tsx"
Cohesion: 0.09
Nodes (27): ClinicStandeeRoute(), AbdmDashboardPage(), DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType (+19 more)

### Community 58 - "Phase 1 — Identity hardening (target: 2 days)"
Cohesion: 0.25
Nodes (8): getAuthHeaders(), Gate 1, P1-1 · Password lifecycle, P1-2 · Cookie-only sessions, P1-3 · Rate limiting that cannot disappear, P1-4 · Token revocation, P1-5 · One role model, Phase 1 — Identity hardening (target: 2 days)

### Community 59 - "consultations.py"
Cohesion: 0.12
Nodes (21): require_clinic_access(), ClinicalAuditEvent, ClinicalFact, ConsultationSession, FactSourceReference, TranscriptTurn, add_transcript_turn(), confirm_or_edit_fact() (+13 more)

### Community 60 - "ClinicOS — Remediation Plan v2"
Cohesion: 0.25
Nodes (7): 0. How to use this plan, 1. Issue → task traceability, 2. Sequencing and critical path, 3. Decisions needed before Phase 3, 4. Definition of done, 5. Rollout & rollback, ClinicOS — Remediation Plan v2

### Community 61 - "ConsultationReport"
Cohesion: 0.26
Nodes (6): ConsultationReport, approve_consultation_reports(), export_printable_reports(), generate_consultation_reports(), get_consultation_reports(), update_consultation_reports()

### Community 64 - "guard"
Cohesion: 0.05
Nodes (55): dynamic, GET(), dynamic, GET(), appUrl(), dynamic, GET(), dynamic (+47 more)

### Community 65 - "ask_clinical_companion"
Cohesion: 0.36
Nodes (4): ask_clinical_companion(), CompanionResponse, DoctorQuestionRequest, ProvenanceSource

### Community 66 - "Phase 3 — Schema truth (target: 3 days)"
Cohesion: 0.25
Nodes (8): Gate 3, P3-1 · Capture the real schema as the baseline, P3-2 · Add the missing tables, P3-3 · Fix column drift, P3-4 · Remove runtime DDL, P3-5 · Fix token allocation race, P3-6 · CI drift gate, Phase 3 — Schema truth (target: 3 days)

### Community 68 - "password.ts"
Cohesion: 0.40
Nodes (4): DENY_LIST, MIN_PASSWORD_LENGTH, PasswordContext, passwordPolicyError()

### Community 69 - "ClinicOS: Architecture & Engineering Reality Audit"
Cohesion: 0.15
Nodes (12): 2. Eradication of Hardcoded Bypass PINs, 3. Concurrency & Queue Token Integrity, 4. Medical Document Security (Vault), 5. Doctor Authority & Prescription Integrity, 6. Payment Integrity (Razorpay HMAC), 7. Canonical Database Baseline, 8. SaaS Business Model & Pricing Alignment, 9. Verification & Operational Status (+4 more)

### Community 70 - "ConsultationRecorder.tsx"
Cohesion: 0.17
Nodes (16): authHeaders(), BAR_PATTERN, ConsultationRecorder(), escapeHtml(), formatTime(), getToken(), Phase, pickRecorderMimeType() (+8 more)

### Community 72 - "3.1 Build one guard module"
Cohesion: 0.25
Nodes (9): authorizeClinicUser(), authorizeSuperAdmin(), createAuthError(), extractAuthToken(), 6. What I fixed during this pass, 1. Authentication vs. Authorization (RBAC), Key Protections, Pipeline Execution Flow (+1 more)

### Community 73 - "5. Functional test results (executed)"
Cohesion: 0.25
Nodes (8): 5.1 Pages — 10/10 returned 200, 5.2 Public read APIs — 7/7 returned 200, 5.3 Authentication, 5.4 Patient-record masking (privacy), 5.5 Tenant & role isolation, 5.6 Write flows, 5.7 Database, 5. Functional test results (executed)

### Community 74 - "notifications.ts"
Cohesion: 0.52
Nodes (6): Delivery, devMode(), isOtpDevMode(), sendMessage(), sendOtp(), whatsappSend()

### Community 75 - "client"
Cohesion: 0.33
Nodes (4): client(), db_session(), mock_current_user(), sample_session()

### Community 77 - "supabase.ts"
Cohesion: 0.50
Nodes (3): supabase, supabaseReady, @supabase/supabase-js

### Community 81 - "11. Prioritized roadmap"
Cohesion: 0.40
Nodes (5): 11. Prioritized roadmap, Sprint 0 — before any real clinic data (1–2 weeks), Sprint 1 — correctness & data (2–3 weeks), Sprint 2 — hardening (3–4 weeks), Sprint 3 — product focus

### Community 83 - "test_auth_invalid_token"
Cohesion: 0.33
Nodes (4): test_auth_invalid_token(), test_auth_missing_header(), override_get_db(), test_clinic_tenant_authorization_forbidden()

### Community 84 - "logAudit"
Cohesion: 0.06
Nodes (46): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+38 more)

### Community 85 - "speaker-attribution.ts"
Cohesion: 0.33
Nodes (5): attributeSpeaker(), DOCTOR_PATTERNS, PATIENT_PATTERNS, SpeakerAttributionResult, SpeakerType

### Community 86 - "7. Security findings (prioritized)"
Cohesion: 0.50
Nodes (4): 7. Security findings (prioritized), P0 — must fix before any real patient data, P1 — fix before onboarding a second clinic, P2 — hardening

### Community 87 - "Phase 0 — Stop the bleeding (target: 1 day)"
Cohesion: 0.33
Nodes (6): Gate 0, P0-1 · Fail-closed authentication, P0-2 · Close the onboarding account-takeover, P0-3 · Remove standing credentials and rotate, P0-4 · Stop silent demo fallbacks in read paths, Phase 0 — Stop the bleeding (target: 1 day)

### Community 89 - "Phase 2 — Exposure reduction (target: 2 days)"
Cohesion: 0.40
Nodes (5): Gate 2, P2-1 · Minimise the public queue payload, P2-2 · Close unauthenticated messaging / AI abuse, P2-3 · RLS + server-only data layer, Phase 2 — Exposure reduction (target: 2 days)

### Community 91 - "Phase 5 — Verification & operations (1.5 days, overlaps Phase 4)"
Cohesion: 0.40
Nodes (5): P5-1 · Automated negative-auth suite, P5-2 · Smoke suite for every clinical module, P5-3 · Observability, P5-4 · Docs, Phase 5 — Verification & operations (1.5 days, overlaps Phase 4)

### Community 93 - "ref_crypto"
Cohesion: 0.15
Nodes (18): cleanPhone(), dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic (+10 more)

### Community 95 - "doctors/[slug]/page.tsx"
Cohesion: 0.24
Nodes (9): DoctorProfilePage(), Props, AIReceptionistProps, AIReceptionistWidget(), ChatMessage, DoctorReviewsSection(), ReviewItem, ReviewsData (+1 more)

### Community 96 - "inventory/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, dynamic, GET(), numberOrNull(), POST()

## Knowledge Gaps
- **582 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+577 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 752 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `guard` to `portal/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `sql`, `book/page.tsx`, `ThemeToggle`, `patients/route.ts`, `claims/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `audit.ts`, `finance/page.tsx`, `react`, `machine-import/route.ts`, `middleware.ts`, `api-auth.ts`, `AIClinicalCompanion.tsx`, `plans/route.ts`, `reception/page.tsx`, `design-system.tsx`, `call-token/route.ts`, `app/layout.tsx`, `reports/route.ts`, `search/page.tsx`, `api.ts`, `display/waiting-room/page.tsx`, `token/route.ts`, `403/page.tsx`, `clinic/desk/page.tsx`, `expenses/page.tsx`, `logAudit`, `settlement/page.tsx`, `clinics/page.tsx`, `ref_crypto`, `doctors/[slug]/page.tsx`, `inventory/route.ts`, `doctors/page.tsx`, `patient/page.tsx`?**
  _High betweenness centrality (0.238) - this node is a cross-community bridge._
- **Why does `postgres` connect `audit-default-passwords.mjs` to `fix_superadmin.mjs`, `migrate.mjs`, `schema-audit.mjs`, `test_live_suite.mjs`, `web/package.json`, `logAudit`, `seed.mjs`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `portal/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `book/page.tsx`, `ThemeToggle`, `patients/route.ts`, `claims/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `finance/page.tsx`, `AIClinicalCompanion.tsx`, `rehab/page.tsx`, `reception/page.tsx`, `design-system.tsx`, `search/page.tsx`, `PatientVaultPanel.tsx`, `api.ts`, `display/waiting-room/page.tsx`, `ConsultationRecorder.tsx`, `doctors/[slug]/page.tsx`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `guard()` (e.g. with `3. Deferred / not production-ready` and `3.1 Build one guard module`) actually correct?**
  _`guard()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _582 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `portal/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14666666666666667 - nodes in this community are weakly interconnected._
- **Should `dashboard/consult/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07030527289546716 - nodes in this community are weakly interconnected._