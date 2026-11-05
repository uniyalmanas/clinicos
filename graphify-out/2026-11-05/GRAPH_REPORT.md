# Graph Report - medic-sept-2026  (2026-11-05)

## Corpus Check
- 207 files · ~365,248 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1162 nodes · 2956 edges · 66 communities (60 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 44 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c219aa1d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- 3.1 Build one guard module
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
- lucide-react
- DocSphere / ClinicOS 🩺
- patients/route.ts
- request-otp/route.ts
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
- react
- dashboard/layout.tsx
- machine-import/route.ts
- middleware.ts
- guard
- devDependencies
- manifest.json
- sql
- settlement/page.tsx
- ConsultationRecorder.tsx
- doctors/[slug]/page.tsx
- scripts
- audit.ts
- reports/route.ts
- book/page.tsx
- CLINIC_ROLES
- dashboard/standee/page.tsx
- reception/page.tsx
- scripts
- api-auth.ts
- design-system.tsx
- apiError
- next
- ledger/route.ts
- clinic-sync.tsx
- PatientVaultPanel.tsx
- 3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0
- next.config.mjs
- postcss.config.mjs
- beds/page.tsx
- api.ts
- rules/graphify.md
- workflows/graphify.md
- tasks/route.ts
- 5. Functional test results (executed)
- doctor-payouts/route.ts
- toggle-payment/route.ts
- tailwind.config.ts
- 11. Prioritized roadmap
- 7. Security findings (prioritized)

## God Nodes (most connected - your core abstractions)
1. `sql` - 193 edges
2. `apiError()` - 167 edges
3. `guard()` - 161 edges
4. `next` - 141 edges
5. `logAudit()` - 107 edges
6. `react` - 63 edges
7. `lucide-react` - 59 edges
8. `CLINIC_ROLES` - 48 edges
9. `rateLimit()` - 37 edges
10. `tooManyRequests()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1` --references--> `logAudit()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/audit.ts
- `3.1 Build one guard module` --references--> `guard()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `3.1 Build one guard module` --references--> `guardPatient()`  [INFERRED]
  REMEDIATION_AND_ROADMAP_PLAN.md → apps/web/src/lib/api-auth.ts
- `Key Protections` --references--> `getJwtSecret()`  [INFERRED]
  PROJECT_REALITY_AUDIT.md → apps/web/src/lib/auth.ts
- `6. What I fixed during this pass` --references--> `authorizeSuperAdmin()`  [INFERRED]
  CLINICOS_ANALYSIS_REPORT.md → apps/web/src/lib/auth.ts

## Import Cycles
- None detected.

## Communities (66 total, 6 thin omitted)

### Community 0 - "3.1 Build one guard module"
Cohesion: 0.25
Nodes (9): authorizeClinicUser(), authorizeSuperAdmin(), createAuthError(), extractAuthToken(), 6. What I fixed during this pass, 1. Authentication vs. Authorization (RBAC), Key Protections, Pipeline Execution Flow (+1 more)

### Community 1 - "logAudit"
Cohesion: 0.09
Nodes (22): POST(), dynamic, POST(), dynamic, POST(), dynamic, POST(), POST() (+14 more)

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
Cohesion: 0.13
Nodes (21): API, Appointment, bmiCategory(), bpStage(), ConsultationPane(), DashboardTodayPage(), Doctor, MOCK_APPOINTMENTS (+13 more)

### Community 6 - "ClinicOS / DocSphere — Project Report & Functional Test Results"
Cohesion: 0.17
Nodes (11): 10. Product assessment against the "lightweight but powerful" goal, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 3. Architecture (as verified, not as documented), 4. Feature inventory & runtime status, 8. Data & schema governance (+3 more)

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
Cohesion: 0.12
Nodes (19): DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType, TariffVersion, API (+11 more)

### Community 11 - "lucide-react"
Cohesion: 0.13
Nodes (18): ClinicExpensesPage(), DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), OnboardingPage(), PharmacyConsolePage(), PharmacyOrder (+10 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.10
Nodes (20): 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management, 🏗️ 2-Tier Serverless Architecture, 3. 🔬 Diagnostic Pathology & LIS Studio, 4. 🏃 Physiotherapy & Rehabilitation Studio, 5. 🛡️ TPA & Cashless Insurance Desk, 6. 🇮🇳 Ayushman Bharat Digital Mission (ABDM), 7. 💵 Day-Closing EOD Cockpit & Doctor Splits (+12 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.07
Nodes (45): dynamic, GET(), POST(), DashboardPatientsPage(), Allergy, AuthState, MePatient, PatientPortalPage() (+37 more)

### Community 14 - "request-otp/route.ts"
Cohesion: 0.14
Nodes (23): dynamic, POST(), dynamic, POST(), dynamic, POST(), normalisePhone(), patientCookieOptions() (+15 more)

### Community 15 - "claims/[id]/route.ts"
Cohesion: 0.21
Nodes (15): dynamic, parseJson(), PATCH(), requireAdmin(), InsuranceClaim, POPULAR_TPAS, AUTHORIZED_FINANCE_PINS, calculateQuerySla() (+7 more)

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
Cohesion: 0.06
Nodes (64): dynamic, PAYMENT_MODES, POST(), dynamic, POST(), dynamic, POST(), dynamic (+56 more)

### Community 23 - "ClinicOS — Remediation Plan & Feature Roadmap"
Cohesion: 0.07
Nodes (26): 0. Executive plan, 10. Risk register, 11. Decisions I need from you, 12. What to cut first, 13. Feature roadmap, 14. Feature sequencing logic, 15. Success metrics for the pilot, 16. Definition of done (per phase) (+18 more)

### Community 24 - "finance/page.tsx"
Cohesion: 0.28
Nodes (11): DashboardFinancePage(), calculateDenominationTotal(), DenominationBreakdown, DoctorPayout, EXPENSE_APPROVAL_THRESHOLD_INR, ExpenseVoucher, PETTY_CASH_MIN_THRESHOLD_INR, PettyCashFloat (+3 more)

### Community 25 - "react"
Cohesion: 0.10
Nodes (7): AdminTab, MapDoctor, Props, VoiceClinicRecorderProps, SIMPLE_TRANSLATIONS, VoiceDictationProps, react

### Community 26 - "dashboard/layout.tsx"
Cohesion: 0.15
Nodes (16): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), NavItemProps, ROLE_ALLOWLIST (+8 more)

### Community 27 - "machine-import/route.ts"
Cohesion: 0.31
Nodes (8): dynamic, POST(), PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "guard"
Cohesion: 0.10
Nodes (22): dynamic, GET(), dynamic, GET(), DELETE(), dynamic, GET(), POST() (+14 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "sql"
Cohesion: 0.14
Nodes (20): currentOpeningFloat(), dynamic, GET(), POST(), dynamic, GET(), POST(), dynamic (+12 more)

### Community 33 - "settlement/page.tsx"
Cohesion: 0.33
Nodes (4): DENOMINATION_VALUES, PettyExpense, SettlementItem, ShiftSettlementPage()

### Community 34 - "ConsultationRecorder.tsx"
Cohesion: 0.16
Nodes (18): authHeaders(), BAR_PATTERN, ConsultationRecorder(), escapeHtml(), formatTime(), getToken(), Phase, pickRecorderMimeType() (+10 more)

### Community 35 - "doctors/[slug]/page.tsx"
Cohesion: 0.23
Nodes (9): DoctorProfilePage(), generateStaticParams(), Props, AIReceptionistProps, AIReceptionistWidget(), ChatMessage, DoctorReviewsSection(), ReviewItem (+1 more)

### Community 36 - "scripts"
Cohesion: 0.12
Nodes (16): devDependencies, typescript, typescript, name, private, scripts, build, build:web (+8 more)

### Community 37 - "audit.ts"
Cohesion: 0.11
Nodes (16): dynamic, dynamic, POST(), dynamic, GET(), cleanPhone(), dynamic, POST() (+8 more)

### Community 38 - "reports/route.ts"
Cohesion: 0.50
Nodes (8): asArray(), asObject(), cleanPhone(), dynamic, ensureConsultationReportsTable(), GET(), POST(), serialise()

### Community 39 - "book/page.tsx"
Cohesion: 0.24
Nodes (11): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), destinationFor(), LoginForm(), LoginPage() (+3 more)

### Community 40 - "CLINIC_ROLES"
Cohesion: 0.09
Nodes (17): appUrl(), dynamic, GET(), dynamic, POST(), dynamic, GET(), dynamic (+9 more)

### Community 41 - "dashboard/standee/page.tsx"
Cohesion: 0.38
Nodes (5): ClinicStandeeRoute(), PaperFormat, StandeeGeneratorPage(), StandeePurpose, VisualTheme

### Community 42 - "reception/page.tsx"
Cohesion: 0.15
Nodes (22): API, DoctorCard(), DoctorCardProps, DoctorChamberState, PatientRow(), PatientRowProps, playCheckInChime(), playChime() (+14 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "api-auth.ts"
Cohesion: 0.08
Nodes (22): dynamic, dynamic, POST(), dynamic, POST(), dynamic, GET(), dynamic (+14 more)

### Community 45 - "design-system.tsx"
Cohesion: 0.12
Nodes (13): BADGE_STYLES, BadgeProps, ButtonProps, ButtonVariant, CardProps, InputProps, MODAL_SIZES, ModalProps (+5 more)

### Community 46 - "apiError"
Cohesion: 0.08
Nodes (27): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin(), dynamic, GET(), maskName() (+19 more)

### Community 47 - "next"
Cohesion: 0.10
Nodes (5): COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), metadata, next

### Community 48 - "ledger/route.ts"
Cohesion: 0.40
Nodes (5): clinicBedIds(), dynamic, GET(), POST(), VALID_REASON_CODES

### Community 49 - "clinic-sync.tsx"
Cohesion: 0.29
Nodes (6): ChamberStatus, DoctorChamberState, QueueEvent, SyncContext, SyncContextType, useClinicSync()

### Community 50 - "PatientVaultPanel.tsx"
Cohesion: 0.31
Nodes (8): DOC_TYPE_ICONS, DOC_TYPE_LABELS, Document, escapeHtml(), formatDate(), formatSize(), PatientVaultPanel(), PatientVaultPanelProps

### Community 51 - "3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0"
Cohesion: 0.33
Nodes (6): 3.2 Classify every handler, 3.3 Fix the worst specific holes first, 3.4 Add defense-in-depth middleware, 3.5 Add rate limiting, 3.6 Exit criteria, 3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0

### Community 54 - "beds/page.tsx"
Cohesion: 0.20
Nodes (8): BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord, CareTask, DischargeInvoice, ShiftHandoverRecord, WardInfo

### Community 55 - "api.ts"
Cohesion: 0.10
Nodes (12): AppointmentItem, DEFAULT_POLYCLINIC_DOCTORS, DoctorChamber, PharmacyBatchItem, PharmacyBill, PharmacyBillItem, ReturnChallan, ScheduleH1Log (+4 more)

### Community 58 - "tasks/route.ts"
Cohesion: 0.50
Nodes (4): clinicBedIds(), dynamic, GET(), POST()

### Community 59 - "5. Functional test results (executed)"
Cohesion: 0.25
Nodes (8): 5.1 Pages — 10/10 returned 200, 5.2 Public read APIs — 7/7 returned 200, 5.3 Authentication, 5.4 Patient-record masking (privacy), 5.5 Tenant & role isolation, 5.6 Write flows, 5.7 Database, 5. Functional test results (executed)

### Community 60 - "doctor-payouts/route.ts"
Cohesion: 0.60
Nodes (4): dynamic, GET(), POST(), todayIso()

### Community 61 - "toggle-payment/route.ts"
Cohesion: 0.50
Nodes (3): ALLOWED_STATUS, dynamic, POST()

### Community 64 - "11. Prioritized roadmap"
Cohesion: 0.40
Nodes (5): 11. Prioritized roadmap, Sprint 0 — before any real clinic data (1–2 weeks), Sprint 1 — correctness & data (2–3 weeks), Sprint 2 — hardening (3–4 weeks), Sprint 3 — product focus

### Community 65 - "7. Security findings (prioritized)"
Cohesion: 0.50
Nodes (4): 7. Security findings (prioritized), P0 — must fix before any real patient data, P1 — fix before onboarding a second clinic, P2 — hardening

## Knowledge Gaps
- **462 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+457 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 527 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `logAudit`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `db.ts`, `inventory/route.ts`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `lucide-react`, `patients/route.ts`, `request-otp/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `rateLimit`, `finance/page.tsx`, `react`, `dashboard/layout.tsx`, `machine-import/route.ts`, `middleware.ts`, `guard`, `sql`, `settlement/page.tsx`, `doctors/[slug]/page.tsx`, `audit.ts`, `reports/route.ts`, `book/page.tsx`, `CLINIC_ROLES`, `dashboard/standee/page.tsx`, `reception/page.tsx`, `api-auth.ts`, `apiError`, `ledger/route.ts`, `beds/page.tsx`, `api.ts`, `tasks/route.ts`, `doctor-payouts/route.ts`, `toggle-payment/route.ts`?**
  _High betweenness centrality (0.444) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `lucide-react`, `patients/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `finance/page.tsx`, `dashboard/layout.tsx`, `settlement/page.tsx`, `ConsultationRecorder.tsx`, `doctors/[slug]/page.tsx`, `book/page.tsx`, `dashboard/standee/page.tsx`, `reception/page.tsx`, `design-system.tsx`, `next`, `clinic-sync.tsx`, `PatientVaultPanel.tsx`, `beds/page.tsx`, `api.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `lucide-react` to `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `clinic-data.ts`, `display/waiting-room/page.tsx`, `patients/route.ts`, `claims/[id]/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `finance/page.tsx`, `react`, `dashboard/layout.tsx`, `settlement/page.tsx`, `ConsultationRecorder.tsx`, `doctors/[slug]/page.tsx`, `book/page.tsx`, `dashboard/standee/page.tsx`, `reception/page.tsx`, `design-system.tsx`, `next`, `PatientVaultPanel.tsx`, `beds/page.tsx`, `api.ts`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _462 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `logAudit` be split into smaller, more focused modules?**
  _Cohesion score 0.08866995073891626 - nodes in this community are weakly interconnected._
- **Should `dashboard/consult/[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._
- **Should `migrate.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06448202959830866 - nodes in this community are weakly interconnected._