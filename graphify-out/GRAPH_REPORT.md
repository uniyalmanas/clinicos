# Graph Report - medic-sept-2026  (2026-11-06)

## Corpus Check
- 214 files · ~379,351 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1212 nodes · 3169 edges · 77 communities (63 shown, 14 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `edcfc1ba`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getJwtSecret
- portal/page.tsx
- dashboard/consult/[id]/page.tsx
- migrate.mjs
- BrowseSpecialtiesSection.tsx
- today/page.tsx
- ClinicOS / DocSphere — Project Report & Functional Test Results
- db.ts
- inventory/route.ts
- book/page.tsx
- dashboard/standee/page.tsx
- react
- DocSphere / ClinicOS 🩺
- patients/route.ts
- reports/route.ts
- claims/[id]/route.ts
- compilerOptions
- web/package.json
- schedule/page.tsx
- check-in/page.tsx
- ClinicOS: Architecture & Engineering Reality Audit
- dependencies
- rateLimit
- ClinicOS — Remediation Plan & Feature Roadmap
- finance/page.tsx
- next
- dashboard/layout.tsx
- lis-parser.ts
- middleware.ts
- apiError
- devDependencies
- manifest.json
- api-auth.ts
- AIClinicalCompanion.tsx
- ConsultationRecorder.tsx
- doctors/[slug]/page.tsx
- scripts
- logAudit
- guard
- settlement/page.tsx
- whatsapp-dispatch/route.ts
- clinic/stream/route.ts
- reception/page.tsx
- scripts
- ref_crypto
- design-system.tsx
- CLINIC_ROLES
- app/layout.tsx
- check-interactions/route.ts
- search/page.tsx
- PatientVaultPanel.tsx
- auth.ts
- next.config.mjs
- postcss.config.mjs
- beds/page.tsx
- api.ts
- rules/graphify.md
- workflows/graphify.md
- sql
- 5. Functional test results (executed)
- live-queue/route.ts
- automations/route.ts
- tailwind.config.ts
- 11. Prioritized roadmap
- 7. Security findings (prioritized)
- settlement/route.ts
- walk-in/route.ts
- recall/route.ts
- prescriptions/[id]/route.ts
- VoiceDictation.tsx
- supabase.ts
- api/auth/me/route.ts
- desk-queue/route.ts
- settlements/route.ts
- doctors/route.ts
- schedule-h1/route.ts

## God Nodes (most connected - your core abstractions)
1. `sql` - 212 edges
2. `apiError()` - 179 edges
3. `guard()` - 173 edges
4. `next` - 145 edges
5. `logAudit()` - 118 edges
6. `react` - 64 edges
7. `lucide-react` - 60 edges
8. `CLINIC_ROLES` - 51 edges
9. `rateLimit()` - 39 edges
10. `tooManyRequests()` - 36 edges

## Surprising Connections (you probably didn't know these)
- `6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1` --references--> `logAudit()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/audit.ts
- `3.1 Build one guard module` --references--> `guard()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `3.1 Build one guard module` --references--> `guardPatient()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `6. What I fixed during this pass` --references--> `authorizeSuperAdmin()`  [INFERRED]
  CLINICOS_ANALYSIS_REPORT.md → apps/web/src/lib/auth.ts
- `1. Authentication vs. Authorization (RBAC)` --references--> `authorizeClinicUser()`  [INFERRED]
  PROJECT_REALITY_AUDIT.md → apps/web/src/lib/auth.ts

## Import Cycles
- None detected.

## Communities (77 total, 14 thin omitted)

### Community 0 - "getJwtSecret"
Cohesion: 0.40
Nodes (5): getJwtSecret(), verifyAccessToken(), 1. Authentication vs. Authorization (RBAC), Key Protections, Pipeline Execution Flow

### Community 1 - "portal/page.tsx"
Cohesion: 0.16
Nodes (19): Allergy, AuthState, MePatient, PatientPortalPage(), PatientPortalView(), PatientRecord, PatientVisitReport, playTokenCallChime() (+11 more)

### Community 2 - "dashboard/consult/[id]/page.tsx"
Cohesion: 0.07
Nodes (35): DynamicConsultationStudioPage(), PrescribedMedicine, DiagnosticOrder, ParameterResult, QualityControlRun, StandaloneConsultationPage(), CLINICAL_DIAGNOSIS_PROTOCOLS, DiagnosisProtocol (+27 more)

### Community 3 - "migrate.mjs"
Cohesion: 0.06
Nodes (33): bcryptjs, postgres, allHumaaans, clinicalDir, clinicalPhotos, doctorsDir, downloadFile(), illustrationsDir (+25 more)

### Community 4 - "BrowseSpecialtiesSection.tsx"
Cohesion: 0.08
Nodes (18): HomePage(), PediatricsIcon(), BrowseSpecialtiesSectionProps, DentistIcon(), DermatologyIcon(), DiabetologyIcon(), EntIcon(), GeneralPhysicianIcon() (+10 more)

### Community 5 - "today/page.tsx"
Cohesion: 0.12
Nodes (23): API, Appointment, bmiCategory(), bpStage(), ConsultationPane(), DashboardTodayPage(), Doctor, MOCK_APPOINTMENTS (+15 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.17
Nodes (11): 10. Product assessment against the "lightweight but powerful" goal, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 3. Architecture (as verified, not as documented), 4. Feature inventory & runtime status, 8. Data & schema governance (+3 more)

### Community 7 - "db.ts"
Cohesion: 0.11
Nodes (23): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+15 more)

### Community 8 - "inventory/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, dynamic, GET(), numberOrNull(), POST()

### Community 9 - "book/page.tsx"
Cohesion: 0.12
Nodes (27): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), ClinicProfilePage(), generateStaticParams(), Props (+19 more)

### Community 10 - "dashboard/standee/page.tsx"
Cohesion: 0.38
Nodes (5): ClinicStandeeRoute(), PaperFormat, StandeeGeneratorPage(), StandeePurpose, VisualTheme

### Community 11 - "react"
Cohesion: 0.14
Nodes (17): ClinicExpensesPage(), DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), PharmacyConsolePage(), PharmacyOrder, SpecialtiesPage() (+9 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.10
Nodes (20): 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management, 🏗️ 2-Tier Serverless Architecture, 3. 🔬 Diagnostic Pathology & LIS Studio, 4. 🏃 Physiotherapy & Rehabilitation Studio, 5. 🛡️ TPA & Cashless Insurance Desk, 6. 🇮🇳 Ayushman Bharat Digital Mission (ABDM), 7. 💵 Day-Closing EOD Cockpit & Doctor Splits (+12 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.19
Nodes (18): dynamic, GET(), POST(), DashboardPatientsPage(), AllergyContraindicationCheck, checkAllergyConflict(), CLINICAL_OVERRIDE_REASON_CODES, EMRAllergy (+10 more)

### Community 14 - "reports/route.ts"
Cohesion: 0.09
Nodes (37): asArray(), asObject(), cleanPhone(), dynamic, ensureConsultationReportsTable(), GET(), POST(), serialise() (+29 more)

### Community 15 - "claims/[id]/route.ts"
Cohesion: 0.19
Nodes (17): dynamic, parseJson(), PATCH(), requireAdmin(), dynamic, GET(), InsuranceClaim, POPULAR_TPAS (+9 more)

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

### Community 20 - "ClinicOS: Architecture & Engineering Reality Audit"
Cohesion: 0.15
Nodes (12): 2. Eradication of Hardcoded Bypass PINs, 3. Concurrency & Queue Token Integrity, 4. Medical Document Security (Vault), 5. Doctor Authority & Prescription Integrity, 6. Payment Integrity (Razorpay HMAC), 7. Canonical Database Baseline, 8. SaaS Business Model & Pricing Alignment, 9. Verification & Operational Status (+4 more)

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, clsx, jose, jsonwebtoken, leaflet, lucide-react, next (+8 more)

### Community 22 - "rateLimit"
Cohesion: 0.07
Nodes (50): dynamic, PAYMENT_MODES, POST(), dynamic, POST(), dynamic, POST(), dynamic (+42 more)

### Community 23 - "ClinicOS — Remediation Plan & Feature Roadmap"
Cohesion: 0.06
Nodes (32): 0. Executive plan, 10. Risk register, 11. Decisions I need from you, 12. What to cut first, 13. Feature roadmap, 14. Feature sequencing logic, 15. Success metrics for the pilot, 16. Definition of done (per phase) (+24 more)

### Community 24 - "finance/page.tsx"
Cohesion: 0.28
Nodes (11): DashboardFinancePage(), calculateDenominationTotal(), DenominationBreakdown, DoctorPayout, EXPENSE_APPROVAL_THRESHOLD_INR, ExpenseVoucher, PETTY_CASH_MIN_THRESHOLD_INR, PettyCashFloat (+3 more)

### Community 25 - "next"
Cohesion: 0.07
Nodes (9): AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), MapDoctor, Props, VoiceClinicRecorderProps, lucide-react (+1 more)

### Community 26 - "dashboard/layout.tsx"
Cohesion: 0.16
Nodes (14): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), NavItemProps, ROLE_ALLOWLIST (+6 more)

### Community 27 - "lis-parser.ts"
Cohesion: 0.43
Nodes (6): PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "apiError"
Cohesion: 0.11
Nodes (21): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin(), dynamic, GET(), POST() (+13 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "api-auth.ts"
Cohesion: 0.17
Nodes (10): ClinicRole, deny(), GuardClinic, GuardOptions, GuardResult, normalizeRole(), PATIENT_COOKIE_NAME, PatientAuth (+2 more)

### Community 33 - "AIClinicalCompanion.tsx"
Cohesion: 0.16
Nodes (28): dynamic, POST(), AIClinicalCompanion(), authHeaders(), BAR_PATTERN, formatTime(), getToken(), Props (+20 more)

### Community 34 - "ConsultationRecorder.tsx"
Cohesion: 0.16
Nodes (17): authHeaders(), BAR_PATTERN, ConsultationRecorder(), escapeHtml(), formatTime(), getToken(), Phase, pickRecorderMimeType() (+9 more)

### Community 35 - "doctors/[slug]/page.tsx"
Cohesion: 0.16
Nodes (15): DoctorProfilePage(), Props, destinationFor(), LoginForm(), LoginPage(), OnboardingPage(), AIReceptionistProps, AIReceptionistWidget() (+7 more)

### Community 36 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, typescript, name, private, scripts, build, build:web (+8 more)

### Community 37 - "logAudit"
Cohesion: 0.06
Nodes (35): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+27 more)

### Community 38 - "guard"
Cohesion: 0.20
Nodes (12): GET(), dynamic, GET(), POST(), dynamic, GET(), PATCH(), POST() (+4 more)

### Community 39 - "settlement/page.tsx"
Cohesion: 0.33
Nodes (4): DENOMINATION_VALUES, PettyExpense, SettlementItem, ShiftSettlementPage()

### Community 40 - "whatsapp-dispatch/route.ts"
Cohesion: 0.67
Nodes (3): appBaseUrl(), dynamic, POST()

### Community 42 - "reception/page.tsx"
Cohesion: 0.13
Nodes (25): API, DoctorCard(), DoctorCardProps, DoctorChamberState, PatientRow(), PatientRowProps, playCheckInChime(), playChime() (+17 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "ref_crypto"
Cohesion: 0.09
Nodes (22): clinicBedIds(), dynamic, GET(), POST(), VALID_REASON_CODES, dynamic, GET(), POST() (+14 more)

### Community 45 - "design-system.tsx"
Cohesion: 0.11
Nodes (15): BADGE_STYLES, BadgeProps, ButtonProps, ButtonVariant, CardProps, Input(), InputProps, MODAL_SIZES (+7 more)

### Community 46 - "CLINIC_ROLES"
Cohesion: 0.15
Nodes (9): dynamic, GET(), dynamic, GET(), dynamic, GET(), dynamic, GET() (+1 more)

### Community 48 - "check-interactions/route.ts"
Cohesion: 0.40
Nodes (4): DRUG_INTERACTION_RULES, dynamic, Medication, POST()

### Community 49 - "search/page.tsx"
Cohesion: 0.24
Nodes (10): ALL_SEARCH_DOCTORS, DoctorPortrait(), normalizeSpecialty(), SearchDiscoveryContent(), SearchDiscoveryPage(), DoctorMapItem, GoogleTerrainMap(), initMap() (+2 more)

### Community 50 - "PatientVaultPanel.tsx"
Cohesion: 0.29
Nodes (9): Modal(), DOC_TYPE_ICONS, DOC_TYPE_LABELS, Document, escapeHtml(), formatDate(), formatSize(), PatientVaultPanel() (+1 more)

### Community 51 - "auth.ts"
Cohesion: 0.14
Nodes (17): GuardAuth, AUTH_COOKIE_OPTIONS, AuthClinic, AuthContext, AuthDoctor, AuthMembership, authorizeClinicUser(), AuthorizeResult (+9 more)

### Community 54 - "beds/page.tsx"
Cohesion: 0.20
Nodes (8): BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord, CareTask, DischargeInvoice, ShiftHandoverRecord, WardInfo

### Community 55 - "api.ts"
Cohesion: 0.07
Nodes (29): AppointmentItem, DEFAULT_POLYCLINIC_DOCTORS, DoctorChamber, DashboardDeskPage(), playTokenCallChime(), PharmacyBatchItem, PharmacyBill, PharmacyBillItem (+21 more)

### Community 58 - "sql"
Cohesion: 0.13
Nodes (24): clinicBedIds(), dynamic, GET(), POST(), dynamic, ensureTable(), GET(), POST() (+16 more)

### Community 59 - "5. Functional test results (executed)"
Cohesion: 0.25
Nodes (8): 5.1 Pages — 10/10 returned 200, 5.2 Public read APIs — 7/7 returned 200, 5.3 Authentication, 5.4 Patient-record masking (privacy), 5.5 Tenant & role isolation, 5.6 Write flows, 5.7 Database, 5. Functional test results (executed)

### Community 60 - "live-queue/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, GET(), maskName()

### Community 61 - "automations/route.ts"
Cohesion: 0.67
Nodes (3): appUrl(), dynamic, GET()

### Community 64 - "11. Prioritized roadmap"
Cohesion: 0.40
Nodes (5): 11. Prioritized roadmap, Sprint 0 — before any real clinic data (1–2 weeks), Sprint 1 — correctness & data (2–3 weeks), Sprint 2 — hardening (3–4 weeks), Sprint 3 — product focus

### Community 65 - "7. Security findings (prioritized)"
Cohesion: 0.50
Nodes (4): 7. Security findings (prioritized), P0 — must fix before any real patient data, P1 — fix before onboarding a second clinic, P2 — hardening

### Community 66 - "settlement/route.ts"
Cohesion: 0.50
Nodes (3): dynamic, GET(), POST()

### Community 67 - "walk-in/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 68 - "recall/route.ts"
Cohesion: 0.50
Nodes (3): dynamic, GET(), POST()

### Community 69 - "prescriptions/[id]/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, GET(), parse()

### Community 71 - "supabase.ts"
Cohesion: 0.50
Nodes (3): supabase, supabaseReady, @supabase/supabase-js

## Knowledge Gaps
- **470 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+465 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 535 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `portal/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `db.ts`, `inventory/route.ts`, `book/page.tsx`, `dashboard/standee/page.tsx`, `react`, `patients/route.ts`, `reports/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `rateLimit`, `finance/page.tsx`, `dashboard/layout.tsx`, `middleware.ts`, `apiError`, `api-auth.ts`, `AIClinicalCompanion.tsx`, `doctors/[slug]/page.tsx`, `logAudit`, `guard`, `settlement/page.tsx`, `whatsapp-dispatch/route.ts`, `clinic/stream/route.ts`, `reception/page.tsx`, `ref_crypto`, `CLINIC_ROLES`, `app/layout.tsx`, `check-interactions/route.ts`, `search/page.tsx`, `beds/page.tsx`, `api.ts`, `sql`, `live-queue/route.ts`, `automations/route.ts`, `settlement/route.ts`, `walk-in/route.ts`, `recall/route.ts`, `prescriptions/[id]/route.ts`, `api/auth/me/route.ts`, `desk-queue/route.ts`, `settlements/route.ts`, `doctors/route.ts`, `schedule-h1/route.ts`?**
  _High betweenness centrality (0.420) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `portal/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `book/page.tsx`, `dashboard/standee/page.tsx`, `patients/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `finance/page.tsx`, `next`, `dashboard/layout.tsx`, `AIClinicalCompanion.tsx`, `ConsultationRecorder.tsx`, `doctors/[slug]/page.tsx`, `settlement/page.tsx`, `reception/page.tsx`, `design-system.tsx`, `search/page.tsx`, `PatientVaultPanel.tsx`, `beds/page.tsx`, `api.ts`, `VoiceDictation.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `next` to `portal/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `book/page.tsx`, `dashboard/standee/page.tsx`, `react`, `patients/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `finance/page.tsx`, `dashboard/layout.tsx`, `AIClinicalCompanion.tsx`, `ConsultationRecorder.tsx`, `doctors/[slug]/page.tsx`, `settlement/page.tsx`, `reception/page.tsx`, `design-system.tsx`, `search/page.tsx`, `PatientVaultPanel.tsx`, `beds/page.tsx`, `api.ts`, `VoiceDictation.tsx`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _470 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard/consult/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._
- **Should `migrate.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06448202959830866 - nodes in this community are weakly interconnected._
- **Should `BrowseSpecialtiesSection.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07965860597439545 - nodes in this community are weakly interconnected._