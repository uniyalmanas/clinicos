# Graph Report - medic-sept-2026  (2026-11-04)

## Corpus Check
- 194 files · ~344,736 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1034 nodes · 2639 edges · 57 communities (51 shown, 6 thin omitted)
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
- results/route.ts
- inventory/route.ts
- clinic-data.ts
- display/waiting-room/page.tsx
- lucide-react
- DocSphere / ClinicOS 🩺
- patients/route.ts
- pharmacy/page.tsx
- claims/[id]/route.ts
- compilerOptions
- web/package.json
- db.ts
- ledger/route.ts
- test_live_suite.mjs
- dependencies
- sql
- ClinicOS — Remediation Plan & Feature Roadmap
- finance/page.tsx
- search/page.tsx
- dashboard/layout.tsx
- machine-import/route.ts
- middleware.ts
- CLINIC_ROLES
- devDependencies
- manifest.json
- toggle-payment/route.ts
- api.ts
- stream/route.ts
- book/page.tsx
- scripts
- download_full_library.mjs
- fix_superadmin.mjs
- doctors/[slug]/page.tsx
- api-auth.ts
- generate/route.ts
- whatsapp-dispatch/route.ts
- scripts
- guard
- tasks/route.ts
- apiError
- app/layout.tsx
- doctor-payouts/route.ts
- shifts/route.ts
- recall/route.ts
- next.config.mjs
- postcss.config.mjs
- next
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `sql` - 182 edges
2. `apiError()` - 162 edges
3. `guard()` - 156 edges
4. `next` - 133 edges
5. `logAudit()` - 102 edges
6. `react` - 57 edges
7. `lucide-react` - 53 edges
8. `CLINIC_ROLES` - 48 edges
9. `ThemeToggle()` - 33 edges
10. `rateLimit()` - 28 edges

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

## Communities (57 total, 6 thin omitted)

### Community 0 - "auth.ts"
Cohesion: 0.07
Nodes (32): GuardAuth, AuthClinic, AuthContext, AuthDoctor, AuthMembership, authorizeClinicUser(), AuthorizeResult, authorizeSuperAdmin() (+24 more)

### Community 1 - "logAudit"
Cohesion: 0.08
Nodes (27): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+19 more)

### Community 2 - "dashboard/consult/[id]/page.tsx"
Cohesion: 0.07
Nodes (35): DynamicConsultationStudioPage(), PrescribedMedicine, DiagnosticOrder, ParameterResult, QualityControlRun, StandaloneConsultationPage(), CLINICAL_DIAGNOSIS_PROTOCOLS, DiagnosisProtocol (+27 more)

### Community 3 - "migrate.mjs"
Cohesion: 0.19
Nodes (12): args, connectionString, __dirname, dryRun, fileArgIndex, listMigrations(), main(), migrationsDir (+4 more)

### Community 4 - "BrowseSpecialtiesSection.tsx"
Cohesion: 0.07
Nodes (21): HomePage(), PediatricsIcon(), SpecialtiesPage(), BrowseSpecialtiesSection(), BrowseSpecialtiesSectionProps, DentistIcon(), DermatologyIcon(), DiabetologyIcon() (+13 more)

### Community 5 - "today/page.tsx"
Cohesion: 0.08
Nodes (32): API, Appointment, bmiCategory(), bpStage(), DashboardTodayPage(), Doctor, Severity, StatusChip() (+24 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.07
Nodes (28): 10. Product assessment against the "lightweight but powerful" goal, 11. Prioritized roadmap, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 3. Architecture (as verified, not as documented), 4. Feature inventory & runtime status (+20 more)

### Community 7 - "results/route.ts"
Cohesion: 0.13
Nodes (17): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+9 more)

### Community 8 - "inventory/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, dynamic, GET(), numberOrNull(), POST()

### Community 9 - "clinic-data.ts"
Cohesion: 0.13
Nodes (24): ClinicProfilePage(), generateStaticParams(), Props, ClinicSessionTracker(), ClinicDoctorSummary, ClinicProfile, CLINICS_MAP, DEHRADUN_CLINICS (+16 more)

### Community 10 - "display/waiting-room/page.tsx"
Cohesion: 0.11
Nodes (20): ClinicStandeeRoute(), DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType, TariffVersion (+12 more)

### Community 11 - "lucide-react"
Cohesion: 0.15
Nodes (20): ClinicExpensesPage(), DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), destinationFor(), LoginForm(), LoginPage() (+12 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.10
Nodes (20): 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management, 🏗️ 2-Tier Serverless Architecture, 3. 🔬 Diagnostic Pathology & LIS Studio, 4. 🏃 Physiotherapy & Rehabilitation Studio, 5. 🛡️ TPA & Cashless Insurance Desk, 6. 🇮🇳 Ayushman Bharat Digital Mission (ABDM), 7. 💵 Day-Closing EOD Cockpit & Doctor Splits (+12 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.19
Nodes (18): dynamic, GET(), POST(), DashboardPatientsPage(), AllergyContraindicationCheck, checkAllergyConflict(), CLINICAL_OVERRIDE_REASON_CODES, EMRAllergy (+10 more)

### Community 14 - "pharmacy/page.tsx"
Cohesion: 0.25
Nodes (6): PharmacyBatchItem, PharmacyBill, PharmacyBillItem, ReturnChallan, ScheduleH1Log, StockTransfer

### Community 15 - "claims/[id]/route.ts"
Cohesion: 0.17
Nodes (18): dynamic, parseJson(), PATCH(), requireAdmin(), dynamic, GET(), POST(), InsuranceClaim (+10 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "web/package.json"
Cohesion: 0.11
Nodes (17): typescript, name, private, version, config, clsx, postcss, react-dom (+9 more)

### Community 18 - "db.ts"
Cohesion: 0.10
Nodes (16): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin(), dynamic, GET(), dynamic (+8 more)

### Community 19 - "ledger/route.ts"
Cohesion: 0.40
Nodes (5): clinicBedIds(), dynamic, GET(), POST(), VALID_REASON_CODES

### Community 20 - "test_live_suite.mjs"
Cohesion: 0.27
Nodes (7): assert(), __dirname, main(), root, sql, testDatabaseSchema(), testHttpEndpoints()

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, clsx, jose, jsonwebtoken, leaflet, lucide-react, next (+8 more)

### Community 22 - "sql"
Cohesion: 0.06
Nodes (69): dynamic, PAYMENT_MODES, POST(), dynamic, GET(), maskName(), dynamic, GET() (+61 more)

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
Cohesion: 0.24
Nodes (10): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), ROLE_ALLOWLIST, SectionLabel() (+2 more)

### Community 27 - "machine-import/route.ts"
Cohesion: 0.31
Nodes (8): dynamic, POST(), PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "CLINIC_ROLES"
Cohesion: 0.09
Nodes (17): appUrl(), dynamic, GET(), dynamic, GET(), dynamic, POST(), dynamic (+9 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "toggle-payment/route.ts"
Cohesion: 0.50
Nodes (3): ALLOWED_STATUS, dynamic, POST()

### Community 33 - "api.ts"
Cohesion: 0.07
Nodes (21): DENOMINATION_VALUES, PettyExpense, SettlementItem, ShiftSettlementPage(), BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord (+13 more)

### Community 34 - "stream/route.ts"
Cohesion: 0.29
Nodes (4): dynamic, GET(), Listener, sseBroker

### Community 35 - "book/page.tsx"
Cohesion: 0.15
Nodes (22): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), Allergy, AuthState, MePatient (+14 more)

### Community 36 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, typescript, name, private, scripts, build, build:web (+8 more)

### Community 37 - "download_full_library.mjs"
Cohesion: 0.20
Nodes (8): allHumaaans, clinicalDir, clinicalPhotos, doctorsDir, downloadFile(), illustrationsDir, main(), root

### Community 38 - "fix_superadmin.mjs"
Cohesion: 0.29
Nodes (6): bcryptjs, postgres, __dirname, main(), root, sql

### Community 39 - "doctors/[slug]/page.tsx"
Cohesion: 0.23
Nodes (9): DoctorProfilePage(), generateStaticParams(), Props, AIReceptionistProps, AIReceptionistWidget(), ChatMessage, DoctorReviewsSection(), ReviewItem (+1 more)

### Community 40 - "api-auth.ts"
Cohesion: 0.10
Nodes (18): dynamic, GET(), DRUG_INTERACTION_RULES, dynamic, Medication, POST(), ClinicRole, deny() (+10 more)

### Community 41 - "generate/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 42 - "whatsapp-dispatch/route.ts"
Cohesion: 0.67
Nodes (3): appBaseUrl(), dynamic, POST()

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "guard"
Cohesion: 0.11
Nodes (23): dynamic, GET(), dynamic, GET(), POST(), dynamic, POST(), dynamic (+15 more)

### Community 45 - "tasks/route.ts"
Cohesion: 0.50
Nodes (4): clinicBedIds(), dynamic, GET(), POST()

### Community 46 - "apiError"
Cohesion: 0.11
Nodes (23): dynamic, POST(), dynamic, GET(), POST(), dynamic, GET(), dynamic (+15 more)

### Community 48 - "doctor-payouts/route.ts"
Cohesion: 0.60
Nodes (4): dynamic, GET(), POST(), todayIso()

### Community 49 - "shifts/route.ts"
Cohesion: 0.60
Nodes (4): currentOpeningFloat(), dynamic, GET(), POST()

### Community 50 - "recall/route.ts"
Cohesion: 0.50
Nodes (3): dynamic, GET(), POST()

### Community 55 - "next"
Cohesion: 0.07
Nodes (9): AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), MapDoctor, Props, VoiceClinicRecorderProps, next (+1 more)

## Knowledge Gaps
- **409 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+404 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 471 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `logAudit`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `results/route.ts`, `inventory/route.ts`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `lucide-react`, `patients/route.ts`, `pharmacy/page.tsx`, `claims/[id]/route.ts`, `web/package.json`, `db.ts`, `ledger/route.ts`, `sql`, `finance/page.tsx`, `search/page.tsx`, `dashboard/layout.tsx`, `machine-import/route.ts`, `middleware.ts`, `CLINIC_ROLES`, `toggle-payment/route.ts`, `api.ts`, `stream/route.ts`, `book/page.tsx`, `doctors/[slug]/page.tsx`, `api-auth.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`, `guard`, `tasks/route.ts`, `apiError`, `app/layout.tsx`, `doctor-payouts/route.ts`, `shifts/route.ts`, `recall/route.ts`?**
  _High betweenness centrality (0.408) - this node is a cross-community bridge._
- **Why does `react` connect `next` to `api.ts`, `dashboard/consult/[id]/page.tsx`, `book/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `doctors/[slug]/page.tsx`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `lucide-react`, `patients/route.ts`, `pharmacy/page.tsx`, `claims/[id]/route.ts`, `web/package.json`, `finance/page.tsx`, `search/page.tsx`, `dashboard/layout.tsx`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `sql` connect `sql` to `logAudit`, `results/route.ts`, `inventory/route.ts`, `clinic-data.ts`, `patients/route.ts`, `claims/[id]/route.ts`, `db.ts`, `ledger/route.ts`, `machine-import/route.ts`, `CLINIC_ROLES`, `toggle-payment/route.ts`, `book/page.tsx`, `api-auth.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`, `guard`, `tasks/route.ts`, `apiError`, `doctor-payouts/route.ts`, `shifts/route.ts`, `recall/route.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _409 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06951871657754011 - nodes in this community are weakly interconnected._
- **Should `logAudit` be split into smaller, more focused modules?**
  _Cohesion score 0.08232118758434548 - nodes in this community are weakly interconnected._
- **Should `dashboard/consult/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._