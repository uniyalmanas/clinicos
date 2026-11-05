# Graph Report - medic-sept-2026  (2026-11-02)

## Corpus Check
- 189 files · ~337,079 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 997 nodes · 2578 edges · 55 communities (48 shown, 7 thin omitted)
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
- request-otp/route.ts
- ClinicOS / DocSphere — Project Report & Functional Test Results
- sql
- inventory/route.ts
- clinic-data.ts
- display/waiting-room/page.tsx
- ThemeToggle
- DocSphere / ClinicOS 🩺
- patients/route.ts
- pharmacy/page.tsx
- claims/[id]/route.ts
- compilerOptions
- web/package.json
- master/route.ts
- ledger/route.ts
- live-queue/route.ts
- dependencies
- rateLimit
- ClinicOS — Remediation Plan & Feature Roadmap
- finance/page.tsx
- search/page.tsx
- dashboard/layout.tsx
- machine-import/route.ts
- middleware.ts
- guard
- devDependencies
- manifest.json
- db.ts
- beds/page.tsx
- stream/route.ts
- book/page.tsx
- scripts
- BackButton
- SiteHeader.tsx
- doctors/[slug]/page.tsx
- check-interactions/route.ts
- generate/route.ts
- whatsapp-dispatch/route.ts
- scripts
- api/auth/me/route.ts
- settlement/page.tsx
- apiError
- next
- tailwind.config.ts
- next.config.mjs
- postcss.config.mjs
- react
- rules/graphify.md
- workflows/graphify.md

## God Nodes (most connected - your core abstractions)
1. `sql` - 182 edges
2. `apiError()` - 162 edges
3. `guard()` - 156 edges
4. `next` - 132 edges
5. `logAudit()` - 102 edges
6. `react` - 52 edges
7. `lucide-react` - 49 edges
8. `CLINIC_ROLES` - 48 edges
9. `ThemeToggle()` - 33 edges
10. `rateLimit()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1` --references--> `logAudit()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/audit.ts
- `6. What I fixed during this pass` --references--> `authorizeSuperAdmin()`  [INFERRED]
  CLINICOS_ANALYSIS_REPORT.md → apps/web/src/lib/auth.ts
- `3.1 Build one guard module` --references--> `guard()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `3.1 Build one guard module` --references--> `guardPatient()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `Key Protections` --references--> `getJwtSecret()`  [INFERRED]
  PROJECT_REALITY_AUDIT.md → apps/web/src/lib/auth.ts

## Import Cycles
- None detected.

## Communities (55 total, 7 thin omitted)

### Community 0 - "auth.ts"
Cohesion: 0.07
Nodes (32): GuardAuth, AUTH_COOKIE_OPTIONS, AuthClinic, AuthContext, AuthDoctor, AuthMembership, authorizeClinicUser(), AuthorizeResult (+24 more)

### Community 1 - "logAudit"
Cohesion: 0.06
Nodes (42): dynamic, POST(), dynamic, GET(), POST(), dynamic, POST(), dynamic (+34 more)

### Community 2 - "dashboard/consult/[id]/page.tsx"
Cohesion: 0.07
Nodes (35): DynamicConsultationStudioPage(), PrescribedMedicine, DiagnosticOrder, ParameterResult, QualityControlRun, StandaloneConsultationPage(), CLINICAL_DIAGNOSIS_PROTOCOLS, DiagnosisProtocol (+27 more)

### Community 3 - "migrate.mjs"
Cohesion: 0.06
Nodes (33): bcryptjs, postgres, allHumaaans, clinicalDir, clinicalPhotos, doctorsDir, downloadFile(), illustrationsDir (+25 more)

### Community 4 - "BrowseSpecialtiesSection.tsx"
Cohesion: 0.08
Nodes (18): HomePage(), PediatricsIcon(), BrowseSpecialtiesSectionProps, DentistIcon(), DermatologyIcon(), DiabetologyIcon(), EntIcon(), GeneralPhysicianIcon() (+10 more)

### Community 5 - "request-otp/route.ts"
Cohesion: 0.09
Nodes (34): dynamic, GET(), appBaseUrl(), dynamic, POST(), dynamic, POST(), dynamic (+26 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.07
Nodes (29): 10. Product assessment against the "lightweight but powerful" goal, 11. Prioritized roadmap, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 3. Architecture (as verified, not as documented), 4. Feature inventory & runtime status (+21 more)

### Community 7 - "sql"
Cohesion: 0.11
Nodes (26): dynamic, POST(), dynamic, POST(), dynamic, POST(), clinicBedIds(), dynamic (+18 more)

### Community 8 - "inventory/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, dynamic, GET(), numberOrNull(), POST()

### Community 9 - "clinic-data.ts"
Cohesion: 0.13
Nodes (23): ClinicProfilePage(), generateStaticParams(), Props, ClinicSessionTracker(), ClinicDoctorSummary, ClinicProfile, CLINICS_MAP, DEHRADUN_CLINICS (+15 more)

### Community 10 - "display/waiting-room/page.tsx"
Cohesion: 0.12
Nodes (19): ClinicStandeeRoute(), DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType, TariffVersion (+11 more)

### Community 11 - "ThemeToggle"
Cohesion: 0.12
Nodes (16): ClinicExpensesPage(), DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), PatientPrescriptionLockerPage(), SEED_PRESCRIPTIONS, PharmacyConsolePage() (+8 more)

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
Cohesion: 0.19
Nodes (17): dynamic, parseJson(), PATCH(), requireAdmin(), dynamic, GET(), InsuranceClaim, POPULAR_TPAS (+9 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 17 - "web/package.json"
Cohesion: 0.11
Nodes (17): typescript, name, private, version, clsx, jsonwebtoken, postcss, qrcode (+9 more)

### Community 18 - "master/route.ts"
Cohesion: 0.47
Nodes (5): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin()

### Community 19 - "ledger/route.ts"
Cohesion: 0.40
Nodes (5): clinicBedIds(), dynamic, GET(), POST(), VALID_REASON_CODES

### Community 20 - "live-queue/route.ts"
Cohesion: 0.67
Nodes (3): dynamic, GET(), maskName()

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, clsx, jose, jsonwebtoken, leaflet, lucide-react, next (+8 more)

### Community 22 - "rateLimit"
Cohesion: 0.11
Nodes (35): dynamic, PAYMENT_MODES, POST(), dynamic, POST(), dynamic, POST(), dynamic (+27 more)

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

### Community 29 - "guard"
Cohesion: 0.06
Nodes (46): GET(), dynamic, GET(), appUrl(), dynamic, GET(), dynamic, POST() (+38 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "db.ts"
Cohesion: 0.20
Nodes (9): ALLOWED_STATUS, dynamic, POST(), cleanPhone(), dynamic, POST(), createSqlClient(), db (+1 more)

### Community 33 - "beds/page.tsx"
Cohesion: 0.20
Nodes (8): BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord, CareTask, DischargeInvoice, ShiftHandoverRecord, WardInfo

### Community 34 - "stream/route.ts"
Cohesion: 0.29
Nodes (4): dynamic, GET(), Listener, sseBroker

### Community 35 - "book/page.tsx"
Cohesion: 0.13
Nodes (24): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), Allergy, AuthState, MePatient (+16 more)

### Community 36 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, typescript, name, private, scripts, build, build:web (+8 more)

### Community 37 - "BackButton"
Cohesion: 0.39
Nodes (6): destinationFor(), LoginForm(), LoginPage(), OnboardingPage(), BackButton(), BackButtonProps

### Community 38 - "SiteHeader.tsx"
Cohesion: 0.43
Nodes (4): SpecialtiesPage(), BrowseSpecialtiesSection(), SiteHeader(), SiteHeaderProps

### Community 39 - "doctors/[slug]/page.tsx"
Cohesion: 0.22
Nodes (10): DoctorProfilePage(), generateStaticParams(), Props, AIReceptionistProps, AIReceptionistWidget(), ChatMessage, DoctorReviewsSection(), ReviewItem (+2 more)

### Community 40 - "check-interactions/route.ts"
Cohesion: 0.40
Nodes (4): DRUG_INTERACTION_RULES, dynamic, Medication, POST()

### Community 41 - "generate/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 42 - "whatsapp-dispatch/route.ts"
Cohesion: 0.67
Nodes (3): appBaseUrl(), dynamic, POST()

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 45 - "settlement/page.tsx"
Cohesion: 0.33
Nodes (4): DENOMINATION_VALUES, PettyExpense, SettlementItem, ShiftSettlementPage()

### Community 46 - "apiError"
Cohesion: 0.11
Nodes (21): currentOpeningFloat(), dynamic, GET(), POST(), dynamic, GET(), POST(), dynamic (+13 more)

### Community 47 - "next"
Cohesion: 0.10
Nodes (5): AppointmentItem, DEFAULT_POLYCLINIC_DOCTORS, DoctorChamber, metadata, next

### Community 55 - "react"
Cohesion: 0.12
Nodes (9): AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), MapDoctor, Props, VoiceClinicRecorderProps, lucide-react (+1 more)

## Knowledge Gaps
- **389 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+384 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 451 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `logAudit`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `request-otp/route.ts`, `sql`, `inventory/route.ts`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `ThemeToggle`, `patients/route.ts`, `pharmacy/page.tsx`, `claims/[id]/route.ts`, `web/package.json`, `master/route.ts`, `ledger/route.ts`, `live-queue/route.ts`, `rateLimit`, `finance/page.tsx`, `search/page.tsx`, `dashboard/layout.tsx`, `machine-import/route.ts`, `middleware.ts`, `guard`, `db.ts`, `beds/page.tsx`, `stream/route.ts`, `book/page.tsx`, `BackButton`, `SiteHeader.tsx`, `doctors/[slug]/page.tsx`, `check-interactions/route.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`, `api/auth/me/route.ts`, `settlement/page.tsx`, `apiError`, `react`?**
  _High betweenness centrality (0.410) - this node is a cross-community bridge._
- **Why does `sql` connect `sql` to `db.ts`, `logAudit`, `book/page.tsx`, `request-otp/route.ts`, `doctors/[slug]/page.tsx`, `inventory/route.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`, `clinic-data.ts`, `patients/route.ts`, `apiError`, `claims/[id]/route.ts`, `master/route.ts`, `ledger/route.ts`, `live-queue/route.ts`, `rateLimit`, `machine-import/route.ts`, `guard`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Why does `postgres` connect `migrate.mjs` to `db.ts`, `web/package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _389 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06951871657754011 - nodes in this community are weakly interconnected._
- **Should `logAudit` be split into smaller, more focused modules?**
  _Cohesion score 0.06370543541788427 - nodes in this community are weakly interconnected._
- **Should `dashboard/consult/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._