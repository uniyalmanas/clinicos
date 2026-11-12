# Graph Report - medic-sept-2026  (2026-11-08)

## Corpus Check
- 241 files · ~414,219 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1419 nodes · 3548 edges · 87 communities (81 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9465458`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ClinicOS — Remediation Plan v2
- book/page.tsx
- dashboard/consult/[id]/page.tsx
- migrate.mjs
- BrowseSpecialtiesSection.tsx
- today/page.tsx
- ClinicOS / DocSphere — Project Report & Functional Test Results
- audit.ts
- CLINIC_ROLES
- clinic-data.ts
- schema-audit.mjs
- ThemeToggle
- DocSphere / ClinicOS 🩺
- patients/route.ts
- ref_crypto
- claims/[id]/route.ts
- compilerOptions
- web/package.json
- schedule/page.tsx
- check-in/page.tsx
- seed.mjs
- dependencies
- rateLimit
- ClinicOS — Remediation Plan & Feature Roadmap
- finance/page.tsx
- react
- dashboard/layout.tsx
- machine-import/route.ts
- middleware.ts
- guardPatient
- devDependencies
- manifest.json
- smoke.mjs
- AIClinicalCompanion.tsx
- fix_superadmin.mjs
- doctors/[slug]/page.tsx
- scripts
- logAudit
- plans/route.ts
- rehab/page.tsx
- audit-default-passwords.mjs
- download_full_library.mjs
- reception/page.tsx
- scripts
- test_live_suite.mjs
- design-system.tsx
- apiError
- next
- display/waiting-room/page.tsx
- search/page.tsx
- PatientVaultPanel.tsx
- auth.ts
- next.config.mjs
- postcss.config.mjs
- api.ts
- BackButton
- rules/graphify.md
- workflows/graphify.md
- guard
- MedicineSchedule.tsx
- sql
- clinic-sync.tsx
- tailwind.config.ts
- public/route.ts
- ledger/route.ts
- api-auth.ts
- whatsapp/route.ts
- publish/route.ts
- ClinicOS: Architecture & Engineering Reality Audit
- ConsultationRecorder.tsx
- beds/page.tsx
- 3.1 Build one guard module
- 5. Functional test results (executed)
- consultant/route.ts
- dashboard/standee/page.tsx
- master/route.ts
- verify/route.ts
- login/route.ts
- tasks/route.ts
- doctor-payouts/route.ts
- 11. Prioritized roadmap
- toggle-payment/route.ts
- walk-in/route.ts
- generate/route.ts
- whatsapp-dispatch/route.ts
- 7. Security findings (prioritized)

## God Nodes (most connected - your core abstractions)
1. `sql` - 210 edges
2. `apiError()` - 189 edges
3. `guard()` - 185 edges
4. `next` - 156 edges
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

## Communities (87 total, 6 thin omitted)

### Community 0 - "ClinicOS — Remediation Plan v2"
Cohesion: 0.04
Nodes (48): getAuthHeaders(), ActiveBooking, 0. How to use this plan, 1. Issue → task traceability, 2. Sequencing and critical path, 3. Decisions needed before Phase 3, 4. Definition of done, 5. Rollout & rollback (+40 more)

### Community 1 - "book/page.tsx"
Cohesion: 0.13
Nodes (23): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), Allergy, AuthState, MePatient (+15 more)

### Community 2 - "dashboard/consult/[id]/page.tsx"
Cohesion: 0.07
Nodes (35): DynamicConsultationStudioPage(), PrescribedMedicine, DiagnosticOrder, ParameterResult, QualityControlRun, StandaloneConsultationPage(), CLINICAL_DIAGNOSIS_PROTOCOLS, DiagnosisProtocol (+27 more)

### Community 3 - "migrate.mjs"
Cohesion: 0.16
Nodes (14): args, connectionString, __dirname, dryRun, fileArgIndex, isLoopback, listMigrations(), main() (+6 more)

### Community 4 - "BrowseSpecialtiesSection.tsx"
Cohesion: 0.08
Nodes (18): HomePage(), PediatricsIcon(), BrowseSpecialtiesSectionProps, DentistIcon(), DermatologyIcon(), DiabetologyIcon(), EntIcon(), GeneralPhysicianIcon() (+10 more)

### Community 5 - "today/page.tsx"
Cohesion: 0.18
Nodes (16): API, Appointment, bmiCategory(), bpStage(), ConsultationPane(), DashboardTodayPage(), Doctor, MOCK_APPOINTMENTS (+8 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.20
Nodes (9): 10. Product assessment against the "lightweight but powerful" goal, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 4. Feature inventory & runtime status, 8. Data & schema governance, 9. Repository hygiene (+1 more)

### Community 7 - "audit.ts"
Cohesion: 0.09
Nodes (24): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+16 more)

### Community 8 - "CLINIC_ROLES"
Cohesion: 0.10
Nodes (19): appUrl(), dynamic, GET(), dynamic, GET(), dynamic, dynamic, GET() (+11 more)

### Community 9 - "clinic-data.ts"
Cohesion: 0.10
Nodes (32): dynamic, GET(), dynamic, GET(), ClinicProfilePage(), generateStaticParams(), Props, generateStaticParams() (+24 more)

### Community 10 - "schema-audit.mjs"
Cohesion: 0.10
Nodes (14): connectionString, __dirname, files, FUNCTION_NAMES, main(), missingTables, normalized, RESERVED (+6 more)

### Community 11 - "ThemeToggle"
Cohesion: 0.18
Nodes (12): DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), PharmacyConsolePage(), PharmacyOrder, ClinicFleetRecord, MasterKPIs (+4 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.07
Nodes (26): 1. Status legend, 2. Verified modules, 3. Deferred / not production-ready, 4. Privacy invariants enforced today, 5. How to reproduce the verification, Feature Truth Table, 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management (+18 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.19
Nodes (18): dynamic, GET(), POST(), DashboardPatientsPage(), AllergyContraindicationCheck, checkAllergyConflict(), CLINICAL_OVERRIDE_REASON_CODES, EMRAllergy (+10 more)

### Community 14 - "ref_crypto"
Cohesion: 0.19
Nodes (15): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+7 more)

### Community 15 - "claims/[id]/route.ts"
Cohesion: 0.17
Nodes (18): dynamic, parseJson(), PATCH(), requireAdmin(), dynamic, GET(), POST(), InsuranceClaim (+10 more)

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

### Community 22 - "rateLimit"
Cohesion: 0.13
Nodes (27): dynamic, PAYMENT_MODES, POST(), cleanPhone(), dynamic, GET(), dynamic, maxDuration (+19 more)

### Community 23 - "ClinicOS — Remediation Plan & Feature Roadmap"
Cohesion: 0.06
Nodes (32): 0. Executive plan, 10. Risk register, 11. Decisions I need from you, 12. What to cut first, 13. Feature roadmap, 14. Feature sequencing logic, 15. Success metrics for the pilot, 16. Definition of done (per phase) (+24 more)

### Community 24 - "finance/page.tsx"
Cohesion: 0.28
Nodes (11): DashboardFinancePage(), calculateDenominationTotal(), DenominationBreakdown, DoctorPayout, EXPENSE_APPROVAL_THRESHOLD_INR, ExpenseVoucher, PETTY_CASH_MIN_THRESHOLD_INR, PettyCashFloat (+3 more)

### Community 25 - "react"
Cohesion: 0.10
Nodes (11): AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), MapDoctor, Props, VoiceClinicRecorderProps, SIMPLE_TRANSLATIONS (+3 more)

### Community 26 - "dashboard/layout.tsx"
Cohesion: 0.16
Nodes (14): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), NavItemProps, ROLE_ALLOWLIST (+6 more)

### Community 27 - "machine-import/route.ts"
Cohesion: 0.31
Nodes (8): dynamic, POST(), PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "guardPatient"
Cohesion: 0.11
Nodes (17): dynamic, GET(), POST(), dynamic, GET(), ALLOWED_MIMETYPES, dynamic, POST() (+9 more)

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
Nodes (41): dynamic, POST(), asArray(), asObject(), cleanPhone(), dynamic, GET(), POST() (+33 more)

### Community 34 - "fix_superadmin.mjs"
Cohesion: 0.14
Nodes (11): bcryptjs, apiDir, __dirname, FORBIDDEN, offenders, root, walk(), __dirname (+3 more)

### Community 35 - "doctors/[slug]/page.tsx"
Cohesion: 0.25
Nodes (8): DoctorProfilePage(), Props, AIReceptionistProps, AIReceptionistWidget(), ChatMessage, DoctorReviewsSection(), ReviewItem, ReviewsData

### Community 36 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, typescript, typescript, name, private, scripts, audit:passwords, build (+12 more)

### Community 37 - "logAudit"
Cohesion: 0.10
Nodes (19): dynamic, POST(), dynamic, POST(), DELETE(), dynamic, GET(), POST() (+11 more)

### Community 38 - "plans/route.ts"
Cohesion: 0.16
Nodes (19): dynamic, GET(), POST(), dynamic, GET(), Json, parseJsonArray(), POST() (+11 more)

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
Cohesion: 0.16
Nodes (21): API, DoctorCard(), DoctorCardProps, DoctorChamberState, PatientRow(), PatientRowProps, playCheckInChime(), playChime() (+13 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "test_live_suite.mjs"
Cohesion: 0.31
Nodes (8): assert(), __dirname, main(), missingCredentials, root, sql, testDatabaseSchema(), testHttpEndpoints()

### Community 45 - "design-system.tsx"
Cohesion: 0.12
Nodes (13): BADGE_STYLES, BadgeProps, ButtonProps, ButtonVariant, CardProps, InputProps, MODAL_SIZES, ModalProps (+5 more)

### Community 46 - "apiError"
Cohesion: 0.08
Nodes (26): dynamic, GET(), dynamic, GET(), POST(), dynamic, GET(), POST() (+18 more)

### Community 47 - "next"
Cohesion: 0.09
Nodes (6): metadata, SpecialtiesPage(), BrowseSpecialtiesSection(), SiteHeader(), SiteHeaderProps, next

### Community 48 - "display/waiting-room/page.tsx"
Cohesion: 0.28
Nodes (7): API, ChamberStatus, Doctor, playHospitalChime(), QueuePatient, speakBilingualAnnouncement(), WaitingRoomSmartDisplayPage()

### Community 49 - "search/page.tsx"
Cohesion: 0.24
Nodes (10): ALL_SEARCH_DOCTORS, DoctorPortrait(), normalizeSpecialty(), SearchDiscoveryContent(), SearchDiscoveryPage(), DoctorMapItem, GoogleTerrainMap(), initMap() (+2 more)

### Community 50 - "PatientVaultPanel.tsx"
Cohesion: 0.25
Nodes (10): Modal(), DOC_TYPE_ICONS, DOC_TYPE_LABELS, Document, escapeHtml(), formatDate(), formatSize(), PatientVaultPanel() (+2 more)

### Community 51 - "auth.ts"
Cohesion: 0.15
Nodes (13): GuardAuth, AUTH_COOKIE_OPTIONS, AuthClinic, AuthContext, AuthDoctor, AuthMembership, AuthorizeResult, AuthUser (+5 more)

### Community 54 - "api.ts"
Cohesion: 0.12
Nodes (10): AppointmentItem, DEFAULT_POLYCLINIC_DOCTORS, DoctorChamber, PharmacyBatchItem, PharmacyBill, PharmacyBillItem, ReturnChallan, ScheduleH1Log (+2 more)

### Community 55 - "BackButton"
Cohesion: 0.12
Nodes (19): DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType, TariffVersion, DEMO_ROLES (+11 more)

### Community 58 - "guard"
Cohesion: 0.08
Nodes (27): dynamic, GET(), dynamic, GET(), dynamic, GET(), dynamic, GET() (+19 more)

### Community 59 - "MedicineSchedule.tsx"
Cohesion: 0.33
Nodes (6): FREQUENCY_TO_TIMES, Medicine, MedicineSchedule(), MedicineScheduleProps, parseFrequency(), TIME_LABELS

### Community 60 - "sql"
Cohesion: 0.18
Nodes (14): dynamic, GET(), maskName(), dynamic, GET(), POST(), dynamic, POST() (+6 more)

### Community 61 - "clinic-sync.tsx"
Cohesion: 0.29
Nodes (6): ChamberStatus, DoctorChamberState, QueueEvent, SyncContext, SyncContextType, useClinicSync()

### Community 64 - "public/route.ts"
Cohesion: 0.14
Nodes (13): cleanPhone(), dynamic, GET(), POST(), dynamic, POST(), dynamic, GET() (+5 more)

### Community 65 - "ledger/route.ts"
Cohesion: 0.11
Nodes (16): clinicBedIds(), dynamic, GET(), POST(), VALID_REASON_CODES, dynamic, POST(), dynamic (+8 more)

### Community 66 - "api-auth.ts"
Cohesion: 0.11
Nodes (16): dynamic, GET(), dynamic, GET(), ClinicRole, deny(), GuardClinic, GuardOptions (+8 more)

### Community 67 - "whatsapp/route.ts"
Cohesion: 0.25
Nodes (11): dynamic, POST(), appBaseUrl(), dynamic, POST(), Delivery, devMode(), isOtpDevMode() (+3 more)

### Community 68 - "publish/route.ts"
Cohesion: 0.22
Nodes (10): dynamic, POST(), dynamic, POST(), normalisePhone(), hashPassword(), DENY_LIST, MIN_PASSWORD_LENGTH (+2 more)

### Community 69 - "ClinicOS: Architecture & Engineering Reality Audit"
Cohesion: 0.15
Nodes (12): 2. Eradication of Hardcoded Bypass PINs, 3. Concurrency & Queue Token Integrity, 4. Medical Document Security (Vault), 5. Doctor Authority & Prescription Integrity, 6. Payment Integrity (Razorpay HMAC), 7. Canonical Database Baseline, 8. SaaS Business Model & Pricing Alignment, 9. Verification & Operational Status (+4 more)

### Community 70 - "ConsultationRecorder.tsx"
Cohesion: 0.24
Nodes (11): authHeaders(), BAR_PATTERN, ConsultationExtraction, ConsultationRecorder(), escapeHtml(), formatTime(), getToken(), Phase (+3 more)

### Community 71 - "beds/page.tsx"
Cohesion: 0.20
Nodes (8): BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord, CareTask, DischargeInvoice, ShiftHandoverRecord, WardInfo

### Community 72 - "3.1 Build one guard module"
Cohesion: 0.29
Nodes (8): authorizeClinicUser(), authorizeSuperAdmin(), createAuthError(), extractAuthToken(), 6. What I fixed during this pass, 1. Authentication vs. Authorization (RBAC), Pipeline Execution Flow, 3.1 Build one guard module

### Community 73 - "5. Functional test results (executed)"
Cohesion: 0.25
Nodes (8): 5.1 Pages — 10/10 returned 200, 5.2 Public read APIs — 7/7 returned 200, 5.3 Authentication, 5.4 Patient-record masking (privacy), 5.5 Tenant & role isolation, 5.6 Write flows, 5.7 Database, 5. Functional test results (executed)

### Community 74 - "consultant/route.ts"
Cohesion: 0.38
Nodes (6): buildDoctorCard(), DoctorRow, dynamic, pickDoctor(), POST(), SPECIALTY_KEYWORDS

### Community 75 - "dashboard/standee/page.tsx"
Cohesion: 0.38
Nodes (5): ClinicStandeeRoute(), PaperFormat, StandeeGeneratorPage(), StandeePurpose, VisualTheme

### Community 76 - "master/route.ts"
Cohesion: 0.47
Nodes (5): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin()

### Community 77 - "verify/route.ts"
Cohesion: 0.40
Nodes (5): COUNTER_MODES, dynamic, ONLINE_MODES, POST(), signaturesMatch()

### Community 78 - "login/route.ts"
Cohesion: 0.60
Nodes (4): dynamic, POST(), signAccessToken(), verifyPassword()

### Community 79 - "tasks/route.ts"
Cohesion: 0.50
Nodes (4): clinicBedIds(), dynamic, GET(), POST()

### Community 80 - "doctor-payouts/route.ts"
Cohesion: 0.60
Nodes (4): dynamic, GET(), POST(), todayIso()

### Community 81 - "11. Prioritized roadmap"
Cohesion: 0.40
Nodes (5): 11. Prioritized roadmap, Sprint 0 — before any real clinic data (1–2 weeks), Sprint 1 — correctness & data (2–3 weeks), Sprint 2 — hardening (3–4 weeks), Sprint 3 — product focus

### Community 82 - "toggle-payment/route.ts"
Cohesion: 0.50
Nodes (3): ALLOWED_STATUS, dynamic, POST()

### Community 83 - "walk-in/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 84 - "generate/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 85 - "whatsapp-dispatch/route.ts"
Cohesion: 0.67
Nodes (3): appBaseUrl(), dynamic, POST()

### Community 86 - "7. Security findings (prioritized)"
Cohesion: 0.50
Nodes (4): 7. Security findings (prioritized), P0 — must fix before any real patient data, P1 — fix before onboarding a second clinic, P2 — hardening

## Knowledge Gaps
- **574 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+569 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 651 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `book/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `audit.ts`, `CLINIC_ROLES`, `clinic-data.ts`, `ThemeToggle`, `patients/route.ts`, `ref_crypto`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `rateLimit`, `finance/page.tsx`, `react`, `dashboard/layout.tsx`, `machine-import/route.ts`, `middleware.ts`, `guardPatient`, `AIClinicalCompanion.tsx`, `doctors/[slug]/page.tsx`, `logAudit`, `plans/route.ts`, `reception/page.tsx`, `apiError`, `display/waiting-room/page.tsx`, `search/page.tsx`, `api.ts`, `BackButton`, `guard`, `sql`, `public/route.ts`, `ledger/route.ts`, `api-auth.ts`, `whatsapp/route.ts`, `publish/route.ts`, `beds/page.tsx`, `consultant/route.ts`, `dashboard/standee/page.tsx`, `master/route.ts`, `verify/route.ts`, `login/route.ts`, `tasks/route.ts`, `doctor-payouts/route.ts`, `toggle-payment/route.ts`, `walk-in/route.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`?**
  _High betweenness centrality (0.396) - this node is a cross-community bridge._
- **Why does `postgres` connect `audit-default-passwords.mjs` to `fix_superadmin.mjs`, `migrate.mjs`, `schema-audit.mjs`, `test_live_suite.mjs`, `web/package.json`, `seed.mjs`, `sql`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `sql` connect `sql` to `audit.ts`, `CLINIC_ROLES`, `clinic-data.ts`, `patients/route.ts`, `ref_crypto`, `claims/[id]/route.ts`, `rateLimit`, `machine-import/route.ts`, `guardPatient`, `AIClinicalCompanion.tsx`, `logAudit`, `apiError`, `guard`, `public/route.ts`, `ledger/route.ts`, `api-auth.ts`, `whatsapp/route.ts`, `publish/route.ts`, `master/route.ts`, `verify/route.ts`, `login/route.ts`, `tasks/route.ts`, `doctor-payouts/route.ts`, `toggle-payment/route.ts`, `walk-in/route.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `guard()` (e.g. with `3. Deferred / not production-ready` and `3.1 Build one guard module`) actually correct?**
  _`guard()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _574 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ClinicOS — Remediation Plan v2` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._
- **Should `book/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13227513227513227 - nodes in this community are weakly interconnected._