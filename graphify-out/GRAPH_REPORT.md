# Graph Report - medic-sept-2026  (2026-11-05)

## Corpus Check
- 202 files · ~356,499 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1121 nodes · 2841 edges · 57 communities (50 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41a6563b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.ts
- logAudit
- dashboard/consult/[id]/page.tsx
- migrate.mjs
- BrowseSpecialtiesSection.tsx
- today/page.tsx
- ClinicOS / DocSphere — Project Report & Functional Test Results
- db.ts
- inventory/route.ts
- clinic-data.ts
- display/waiting-room/page.tsx
- react
- DocSphere / ClinicOS 🩺
- patients/route.ts
- request-otp/route.ts
- claims/[id]/route.ts
- compilerOptions
- web/package.json
- schedule/page.tsx
- check-in/page.tsx
- book/page.tsx
- dependencies
- ref_crypto
- ClinicOS — Remediation Plan & Feature Roadmap
- finance/page.tsx
- search/page.tsx
- dashboard/layout.tsx
- lis-parser.ts
- middleware.ts
- apiError
- devDependencies
- manifest.json
- live-queue/route.ts
- api.ts
- call-token/route.ts
- portal/page.tsx
- scripts
- walk-in/route.ts
- tailwind.config.ts
- doctors/[slug]/page.tsx
- check-interactions/route.ts
- generate/route.ts
- reception/page.tsx
- scripts
- guard
- design-system.tsx
- sql
- next
- MedicineSchedule.tsx
- clinic-sync.tsx
- PatientVaultPanel.tsx
- app/layout.tsx
- next.config.mjs
- postcss.config.mjs
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `sql` - 189 edges
2. `apiError()` - 162 edges
3. `guard()` - 156 edges
4. `next` - 139 edges
5. `logAudit()` - 104 edges
6. `react` - 62 edges
7. `lucide-react` - 58 edges
8. `CLINIC_ROLES` - 48 edges
9. `rateLimit()` - 35 edges
10. `ThemeToggle()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1` --references--> `logAudit()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/audit.ts
- `3.1 Build one guard module` --references--> `guard()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `3.1 Build one guard module` --references--> `guardPatient()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `6. What I fixed during this pass` --references--> `authorizeSuperAdmin()`  [INFERRED]
  CLINICOS_ANALYSIS_REPORT.md → apps/web/src/lib/auth.ts
- `Key Protections` --references--> `getJwtSecret()`  [INFERRED]
  PROJECT_REALITY_AUDIT.md → apps/web/src/lib/auth.ts

## Import Cycles
- None detected.

## Communities (57 total, 7 thin omitted)

### Community 0 - "auth.ts"
Cohesion: 0.07
Nodes (34): GuardAuth, AUTH_COOKIE_OPTIONS, AuthClinic, AuthContext, AuthDoctor, AuthMembership, authorizeClinicUser(), AuthorizeResult (+26 more)

### Community 1 - "logAudit"
Cohesion: 0.07
Nodes (34): dynamic, POST(), dynamic, POST(), dynamic, POST(), ALLOWED_STATUS, dynamic (+26 more)

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
Cohesion: 0.15
Nodes (18): API, Appointment, bmiCategory(), bpStage(), ConsultationPane(), DashboardTodayPage(), Doctor, SchedulePane() (+10 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.07
Nodes (28): 10. Product assessment against the "lightweight but powerful" goal, 11. Prioritized roadmap, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 3. Architecture (as verified, not as documented), 4. Feature inventory & runtime status (+20 more)

### Community 7 - "db.ts"
Cohesion: 0.13
Nodes (20): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+12 more)

### Community 8 - "inventory/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, dynamic, GET(), numberOrNull(), POST()

### Community 9 - "clinic-data.ts"
Cohesion: 0.13
Nodes (24): ClinicProfilePage(), generateStaticParams(), Props, ClinicSessionTracker(), ClinicDoctorSummary, ClinicProfile, CLINICS_MAP, DEHRADUN_CLINICS (+16 more)

### Community 10 - "display/waiting-room/page.tsx"
Cohesion: 0.10
Nodes (22): ClinicStandeeRoute(), DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType, TariffVersion (+14 more)

### Community 11 - "react"
Cohesion: 0.12
Nodes (16): ClinicExpensesPage(), DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), OnboardingPage(), PharmacyConsolePage(), PharmacyOrder (+8 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.10
Nodes (20): 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management, 🏗️ 2-Tier Serverless Architecture, 3. 🔬 Diagnostic Pathology & LIS Studio, 4. 🏃 Physiotherapy & Rehabilitation Studio, 5. 🛡️ TPA & Cashless Insurance Desk, 6. 🇮🇳 Ayushman Bharat Digital Mission (ABDM), 7. 💵 Day-Closing EOD Cockpit & Doctor Splits (+12 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.19
Nodes (18): dynamic, GET(), POST(), DashboardPatientsPage(), AllergyContraindicationCheck, checkAllergyConflict(), CLINICAL_OVERRIDE_REASON_CODES, EMRAllergy (+10 more)

### Community 14 - "request-otp/route.ts"
Cohesion: 0.09
Nodes (32): appBaseUrl(), dynamic, POST(), dynamic, POST(), dynamic, GET(), dynamic (+24 more)

### Community 15 - "claims/[id]/route.ts"
Cohesion: 0.19
Nodes (17): dynamic, parseJson(), PATCH(), requireAdmin(), dynamic, GET(), InsuranceClaim, POPULAR_TPAS (+9 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "web/package.json"
Cohesion: 0.12
Nodes (15): typescript, name, private, version, clsx, postcss, react-dom, tailwind-merge (+7 more)

### Community 18 - "schedule/page.tsx"
Cohesion: 0.18
Nodes (16): API, BlockDate(), BlockDateProps, BlockedSlot, DAYS_OF_WEEK, Doctor, DoctorSchedule, DoctorSchedulePage() (+8 more)

### Community 19 - "check-in/page.tsx"
Cohesion: 0.25
Nodes (10): API, CheckInKioskPage(), Doctor, KioskButton(), playCheckInChime(), QrCodeDisplay(), Step, STEP_LABELS (+2 more)

### Community 20 - "book/page.tsx"
Cohesion: 0.36
Nodes (7): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), generateStaticParams(), getDoctors()

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, clsx, jose, jsonwebtoken, leaflet, lucide-react, next (+8 more)

### Community 22 - "ref_crypto"
Cohesion: 0.09
Nodes (43): dynamic, PAYMENT_MODES, POST(), dynamic, POST(), dynamic, POST(), dynamic (+35 more)

### Community 23 - "ClinicOS — Remediation Plan & Feature Roadmap"
Cohesion: 0.06
Nodes (32): 0. Executive plan, 10. Risk register, 11. Decisions I need from you, 12. What to cut first, 13. Feature roadmap, 14. Feature sequencing logic, 15. Success metrics for the pilot, 16. Definition of done (per phase) (+24 more)

### Community 24 - "finance/page.tsx"
Cohesion: 0.28
Nodes (11): DashboardFinancePage(), calculateDenominationTotal(), DenominationBreakdown, DoctorPayout, EXPENSE_APPROVAL_THRESHOLD_INR, ExpenseVoucher, PETTY_CASH_MIN_THRESHOLD_INR, PettyCashFloat (+3 more)

### Community 25 - "search/page.tsx"
Cohesion: 0.24
Nodes (10): ALL_SEARCH_DOCTORS, DoctorPortrait(), normalizeSpecialty(), SearchDiscoveryContent(), SearchDiscoveryPage(), DoctorMapItem, GoogleTerrainMap(), initMap() (+2 more)

### Community 26 - "dashboard/layout.tsx"
Cohesion: 0.16
Nodes (16): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), NavItemProps, ROLE_ALLOWLIST (+8 more)

### Community 27 - "lis-parser.ts"
Cohesion: 0.43
Nodes (6): PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "apiError"
Cohesion: 0.05
Nodes (49): dynamic, GET(), appUrl(), dynamic, GET(), dynamic, GET(), dynamic (+41 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "live-queue/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, GET(), maskName()

### Community 33 - "api.ts"
Cohesion: 0.06
Nodes (27): DENOMINATION_VALUES, PettyExpense, SettlementItem, ShiftSettlementPage(), BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord (+19 more)

### Community 34 - "call-token/route.ts"
Cohesion: 0.18
Nodes (8): dynamic, POST(), dynamic, POST(), dynamic, GET(), Listener, sseBroker

### Community 35 - "portal/page.tsx"
Cohesion: 0.15
Nodes (20): Allergy, AuthState, MePatient, PatientPortalPage(), PatientPortalView(), PatientRecord, playTokenCallChime(), Visit (+12 more)

### Community 36 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, typescript, name, private, scripts, build, build:web (+8 more)

### Community 37 - "walk-in/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 39 - "doctors/[slug]/page.tsx"
Cohesion: 0.18
Nodes (13): DoctorProfilePage(), Props, destinationFor(), LoginForm(), LoginPage(), PatientPrescriptionLockerPage(), SEED_PRESCRIPTIONS, AIReceptionistProps (+5 more)

### Community 40 - "check-interactions/route.ts"
Cohesion: 0.40
Nodes (4): DRUG_INTERACTION_RULES, dynamic, Medication, POST()

### Community 41 - "generate/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 42 - "reception/page.tsx"
Cohesion: 0.17
Nodes (19): API, DoctorCard(), DoctorCardProps, DoctorChamberState, PatientRow(), PatientRowProps, playCheckInChime(), playChime() (+11 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "guard"
Cohesion: 0.10
Nodes (26): GET(), dynamic, GET(), POST(), dynamic, GET(), POST(), todayIso() (+18 more)

### Community 45 - "design-system.tsx"
Cohesion: 0.12
Nodes (14): BADGE_STYLES, BadgeProps, ButtonProps, ButtonVariant, CardProps, InputProps, MODAL_SIZES, ModalProps (+6 more)

### Community 46 - "sql"
Cohesion: 0.11
Nodes (25): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin(), clinicBedIds(), dynamic, GET() (+17 more)

### Community 47 - "next"
Cohesion: 0.08
Nodes (9): dynamic, GET(), AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), MapDoctor, Props (+1 more)

### Community 48 - "MedicineSchedule.tsx"
Cohesion: 0.33
Nodes (6): FREQUENCY_TO_TIMES, Medicine, MedicineSchedule(), MedicineScheduleProps, parseFrequency(), TIME_LABELS

### Community 49 - "clinic-sync.tsx"
Cohesion: 0.29
Nodes (6): ChamberStatus, DoctorChamberState, QueueEvent, SyncContext, SyncContextType, useClinicSync()

### Community 50 - "PatientVaultPanel.tsx"
Cohesion: 0.40
Nodes (4): DOC_TYPE_ICONS, DOC_TYPE_LABELS, Document, PatientVaultPanelProps

## Knowledge Gaps
- **451 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+446 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 515 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `logAudit`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `db.ts`, `inventory/route.ts`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `react`, `patients/route.ts`, `request-otp/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `book/page.tsx`, `ref_crypto`, `finance/page.tsx`, `search/page.tsx`, `dashboard/layout.tsx`, `middleware.ts`, `apiError`, `live-queue/route.ts`, `api.ts`, `call-token/route.ts`, `portal/page.tsx`, `walk-in/route.ts`, `doctors/[slug]/page.tsx`, `check-interactions/route.ts`, `generate/route.ts`, `reception/page.tsx`, `guard`, `sql`, `app/layout.tsx`?**
  _High betweenness centrality (0.441) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `patients/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `book/page.tsx`, `finance/page.tsx`, `search/page.tsx`, `dashboard/layout.tsx`, `api.ts`, `portal/page.tsx`, `doctors/[slug]/page.tsx`, `reception/page.tsx`, `design-system.tsx`, `next`, `MedicineSchedule.tsx`, `clinic-sync.tsx`, `PatientVaultPanel.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `sql` connect `sql` to `live-queue/route.ts`, `logAudit`, `call-token/route.ts`, `walk-in/route.ts`, `db.ts`, `inventory/route.ts`, `generate/route.ts`, `clinic-data.ts`, `guard`, `patients/route.ts`, `request-otp/route.ts`, `claims/[id]/route.ts`, `book/page.tsx`, `ref_crypto`, `apiError`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _451 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06507936507936508 - nodes in this community are weakly interconnected._
- **Should `logAudit` be split into smaller, more focused modules?**
  _Cohesion score 0.06648936170212766 - nodes in this community are weakly interconnected._
- **Should `dashboard/consult/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._