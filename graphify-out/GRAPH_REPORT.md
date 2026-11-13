# Graph Report - medic-sept-2026  (2026-11-13)

## Corpus Check
- 304 files · ~442,030 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 2, (none) 2, .css 1)

## Summary
- 1799 nodes · 4557 edges · 108 communities (89 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f23c4d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ClinicOS — Remediation Plan v2
- book/page.tsx
- dashboard/consult/[id]/page.tsx
- migrate.mjs
- BrowseSpecialtiesSection.tsx
- today/page.tsx
- test_provider_abstraction.py
- sql
- reports.py
- clinic-data.ts
- schema-audit.mjs
- ThemeToggle
- DocSphere / ClinicOS 🩺
- patients/route.ts
- typing
- claims/route.ts
- compilerOptions
- web/package.json
- schedule/page.tsx
- check-in/page.tsx
- seed.mjs
- dependencies
- rateLimit
- Part B — Features worth building
- finance/page.tsx
- react
- PatientMemoryService
- machine-import/route.ts
- middleware.ts
- db.ts
- devDependencies
- manifest.json
- smoke.mjs
- AIClinicalCompanion.tsx
- ref_node_path
- ConsultationSession
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
- logAudit
- next
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
- apiError
- consultations.py
- api-auth.ts
- ConsultationReport
- tailwind.config.ts
- guard
- ask_clinical_companion
- config.py
- logging
- publish/route.ts
- ClinicOS: Architecture & Engineering Reality Audit
- ConsultationRecorder.tsx
- 3.1 Build one guard module
- dashboard/layout.tsx
- token-alert/route.ts
- ClinicOS — Remediation Plan & Feature Roadmap
- ConnectionManager
- supabase.ts
- .get_verified_patient_records
- HybridRetrievalService
- abdm/page.tsx
- consultant/route.ts
- test_auth_invalid_token
- CLINICAL_ROLES
- speaker-attribution.ts
- master/route.ts
- verify/route.ts
- queue/route.ts
- 3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0
- login/route.ts
- doctor-payouts/route.ts
- extract/route.ts
- ref_crypto
- sseBroker
- doctors/[slug]/page.tsx
- inventory/route.ts
- 4. Phase 2 — Patient identity & clinical privacy (4–5 days) 🔴 P0
- whatsapp/route.ts
- generate/route.ts
- whatsapp-dispatch/route.ts

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

## Communities (108 total, 19 thin omitted)

### Community 0 - "ClinicOS — Remediation Plan v2"
Cohesion: 0.04
Nodes (47): getAuthHeaders(), ActiveBooking, 0. How to use this plan, 1. Issue → task traceability, 2. Sequencing and critical path, 3. Decisions needed before Phase 3, 4. Definition of done, 5. Rollout & rollback (+39 more)

### Community 1 - "book/page.tsx"
Cohesion: 0.12
Nodes (25): BookingExperience(), fetchApiDoctors(), BookPage(), DoctorAvatar(), normalizeSpecialty(), Allergy, AuthState, MePatient (+17 more)

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
Cohesion: 0.12
Nodes (23): API, Appointment, bmiCategory(), bpStage(), ConsultationPane(), DashboardTodayPage(), Doctor, MOCK_APPOINTMENTS (+15 more)

### Community 6 - "test_provider_abstraction.py"
Cohesion: 0.14
Nodes (13): BaseEmbeddingProvider, BaseLLMProvider, GroqLLMProvider, LocalDeterministicEmbeddingProvider, OllamaEmbeddingProvider, OllamaLLMProvider, get_embedding_provider(), get_llm_provider() (+5 more)

### Community 7 - "sql"
Cohesion: 0.10
Nodes (26): clinicBedIds(), dynamic, GET(), POST(), VALID_REASON_CODES, clinicBedIds(), dynamic, GET() (+18 more)

### Community 8 - "reports.py"
Cohesion: 0.09
Nodes (9): get_current_user(), get_db(), health_check(), lifespan(), CompanionInteraction, client(), db_session(), mock_current_user() (+1 more)

### Community 9 - "clinic-data.ts"
Cohesion: 0.10
Nodes (32): GET(), dynamic, GET(), dynamic, GET(), ClinicProfilePage(), generateStaticParams(), Props (+24 more)

### Community 10 - "schema-audit.mjs"
Cohesion: 0.10
Nodes (14): connectionString, __dirname, files, FUNCTION_NAMES, main(), missingTables, normalized, RESERVED (+6 more)

### Community 11 - "ThemeToggle"
Cohesion: 0.12
Nodes (20): DoctorConsultIndexPage(), playTokenCallChime(), DoctorQueuePage(), ForDoctorsPage(), DEMO_ROLES, DemoRole, destinationFor(), LoginForm() (+12 more)

### Community 12 - "DocSphere / ClinicOS 🩺"
Cohesion: 0.07
Nodes (26): 1. Status legend, 2. Verified modules, 3. Deferred / not production-ready, 4. Privacy invariants enforced today, 5. How to reproduce the verification, Feature Truth Table, 1. ⚡ Doctor Consultation Studio, 2. 🛏️ Inpatient Wards & Acute Bed Management (+18 more)

### Community 13 - "patients/route.ts"
Cohesion: 0.19
Nodes (18): dynamic, GET(), POST(), DashboardPatientsPage(), AllergyContraindicationCheck, checkAllergyConflict(), CLINICAL_OVERRIDE_REASON_CODES, EMRAllergy (+10 more)

### Community 14 - "typing"
Cohesion: 0.10
Nodes (13): SpeakerAttributor, test_fact_extraction_hindi_terms(), test_fact_extraction_symptoms_and_vitals(), build_consultation_graph(), supervisor_router(), clinical_assistant_node(), extract_clinical_facts_node(), retrieve_patient_context_node() (+5 more)

### Community 15 - "claims/route.ts"
Cohesion: 0.22
Nodes (14): dynamic, GET(), POST(), InsuranceClaim, POPULAR_TPAS, AUTHORIZED_FINANCE_PINS, calculateQuerySla(), FINANCE_OVERRIDE_REASON_CODES (+6 more)

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

### Community 20 - "seed.mjs"
Cohesion: 0.12
Nodes (18): 3. Architecture (as verified, not as documented), Structural findings, P3-1 · Capture the real schema as the baseline, connectionString, credentials, __dirname, future(), host (+10 more)

### Community 21 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, bcryptjs, clsx, jose, jsonwebtoken, leaflet, lucide-react, next (+8 more)

### Community 22 - "rateLimit"
Cohesion: 0.12
Nodes (28): dynamic, PAYMENT_MODES, POST(), cleanPhone(), dynamic, GET(), cleanPhone(), dynamic (+20 more)

### Community 23 - "Part B — Features worth building"
Cohesion: 0.18
Nodes (10): 12. What to cut first, 13. Feature roadmap, 14. Feature sequencing logic, 15. Success metrics for the pilot, 16. Definition of done (per phase), Appendix — full per-handler auth inventory, Part B — Features worth building, v1.1 — "A clinic can run a full day" (weeks 7–10) (+2 more)

### Community 24 - "finance/page.tsx"
Cohesion: 0.28
Nodes (11): DashboardFinancePage(), calculateDenominationTotal(), DenominationBreakdown, DoctorPayout, EXPENSE_APPROVAL_THRESHOLD_INR, ExpenseVoucher, PETTY_CASH_MIN_THRESHOLD_INR, PettyCashFloat (+3 more)

### Community 25 - "react"
Cohesion: 0.10
Nodes (11): AdminTab, COMMON_SPEED_RX_MOLECULES, DashboardOverviewPage(), playTokenCallChime(), MapDoctor, Props, VoiceClinicRecorderProps, SIMPLE_TRANSLATIONS (+3 more)

### Community 26 - "PatientMemoryService"
Cohesion: 0.11
Nodes (8): get_patient_context(), get_patient_memory(), get_patient_timeline(), search_patient_memory(), supersede_fact(), verify_fact(), PatientMemoryService, utcnow()

### Community 27 - "machine-import/route.ts"
Cohesion: 0.31
Nodes (8): dynamic, POST(), PARAM_NAME_MAP, parseASTM(), parseDelimitedFallback(), ParsedMachineResult, parseHL7(), parseMachineData()

### Community 28 - "middleware.ts"
Cohesion: 0.33
Nodes (8): config, forbidden(), middleware(), readRole(), redirectToLogin(), secretKey(), STAFF_ROLES, jose

### Community 29 - "db.ts"
Cohesion: 0.13
Nodes (18): dynamic, GET(), POST(), dynamic, GET(), dynamic, POST(), dynamic (+10 more)

### Community 30 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, postcss, tailwindcss, @types/bcryptjs, @types/jsonwebtoken, @types/node, @types/react, @types/react-dom (+1 more)

### Community 31 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 32 - "smoke.mjs"
Cohesion: 0.06
Nodes (42): 10. Product assessment against the "lightweight but powerful" goal, 11. Prioritized roadmap, 12. How to run and reproduce these results, 13. Bottom line, 1. Executive summary, 2. What this product actually is, 4. Feature inventory & runtime status, 5.1 Pages — 10/10 returned 200 (+34 more)

### Community 33 - "AIClinicalCompanion.tsx"
Cohesion: 0.10
Nodes (38): dynamic, POST(), AIClinicalCompanion(), authHeaders(), BAR_PATTERN, formatTime(), getToken(), Props (+30 more)

### Community 34 - "ref_node_path"
Cohesion: 0.25
Nodes (6): apiDir, __dirname, FORBIDDEN, offenders, root, walk()

### Community 35 - "ConsultationSession"
Cohesion: 0.14
Nodes (13): ClinicalFact, ConsultationSession, FactSourceReference, ClinicalFactRelation, ClinicalFactVersion, ClinicalSource, websocket_consultation_endpoint(), test_patient_timeline_chronological_ordering() (+5 more)

### Community 36 - "scripts"
Cohesion: 0.10
Nodes (20): devDependencies, typescript, typescript, name, private, scripts, audit:passwords, build (+12 more)

### Community 37 - "schemas/__init__.py"
Cohesion: 0.23
Nodes (16): ClinicalFactCreate, ClinicalFactResponse, FactStatusUpdate, ClinicalFactRelationResponse, ClinicalFactVersionResponse, ClinicalSourceCreate, ClinicalSourceResponse, FactSupersedeRequest (+8 more)

### Community 38 - "plans/route.ts"
Cohesion: 0.14
Nodes (18): dynamic, GET(), dynamic, GET(), dynamic, GET(), Json, parseJsonArray() (+10 more)

### Community 39 - "rehab/page.tsx"
Cohesion: 0.16
Nodes (13): ANATOMICAL_LIMITS, CONDITION_PRESETS, formatSafeDate(), formatSessionDate(), HomeworkItem, MODALITY_OPTIONS, PrescribedExercise, ProtocolVersionEntry (+5 more)

### Community 40 - "audit-default-passwords.mjs"
Cohesion: 0.13
Nodes (13): bcryptjs, postgres, DEFAULT_PASSWORDS, __dirname, main(), outIndex, root, shouldFix (+5 more)

### Community 41 - "download_full_library.mjs"
Cohesion: 0.20
Nodes (8): allHumaaans, clinicalDir, clinicalPhotos, doctorsDir, downloadFile(), illustrationsDir, main(), root

### Community 42 - "reception/page.tsx"
Cohesion: 0.11
Nodes (27): API, DoctorCard(), DoctorCardProps, DoctorChamberState, PatientRow(), PatientRowProps, playCheckInChime(), playChime() (+19 more)

### Community 43 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 44 - "test_live_suite.mjs"
Cohesion: 0.31
Nodes (8): assert(), __dirname, main(), missingCredentials, root, sql, testDatabaseSchema(), testHttpEndpoints()

### Community 45 - "design-system.tsx"
Cohesion: 0.12
Nodes (13): BADGE_STYLES, BadgeProps, ButtonProps, ButtonVariant, CardProps, InputProps, MODAL_SIZES, ModalProps (+5 more)

### Community 46 - "logAudit"
Cohesion: 0.07
Nodes (32): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+24 more)

### Community 47 - "next"
Cohesion: 0.09
Nodes (3): dynamic, metadata, next

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
Cohesion: 0.18
Nodes (12): GuardAuth, AuthClinic, AuthContext, AuthDoctor, AuthMembership, AuthorizeResult, AuthUser, getJwtSecret() (+4 more)

### Community 54 - "api.ts"
Cohesion: 0.07
Nodes (22): BedInfo, BedStatus, BillingLedgerEntry, BillingOverrideRecord, CareTask, DischargeInvoice, ShiftHandoverRecord, WardInfo (+14 more)

### Community 55 - "display/waiting-room/page.tsx"
Cohesion: 0.10
Nodes (23): ClinicStandeeRoute(), QRCodeDisplay, DashboardDeskPage(), playTokenCallChime(), DashboardSettingsPage(), Doctor, ShiftGuardrail, TabType (+15 more)

### Community 58 - "apiError"
Cohesion: 0.09
Nodes (25): dynamic, GET(), maskName(), dynamic, GET(), POST(), dynamic, GET() (+17 more)

### Community 59 - "consultations.py"
Cohesion: 0.16
Nodes (16): require_clinic_access(), ClinicalAuditEvent, TranscriptTurn, add_transcript_turn(), confirm_or_edit_fact(), correct_turn_speaker(), create_or_get_consultation_session(), get_consultation_session() (+8 more)

### Community 60 - "api-auth.ts"
Cohesion: 0.08
Nodes (26): dynamic, POST(), dynamic, POST(), dynamic, POST(), cleanPhone(), dynamic (+18 more)

### Community 61 - "ConsultationReport"
Cohesion: 0.26
Nodes (6): ConsultationReport, approve_consultation_reports(), export_printable_reports(), generate_consultation_reports(), get_consultation_reports(), update_consultation_reports()

### Community 64 - "guard"
Cohesion: 0.06
Nodes (37): dynamic, GET(), dynamic, GET(), appUrl(), dynamic, GET(), dynamic (+29 more)

### Community 65 - "ask_clinical_companion"
Cohesion: 0.36
Nodes (4): ask_clinical_companion(), CompanionResponse, DoctorQuestionRequest, ProvenanceSource

### Community 66 - "config.py"
Cohesion: 0.11
Nodes (6): Settings, BaseTranscriptionProvider, DeterministicFallbackProvider, GroqWhisperProvider, OpenAITranscriptionProvider, TranscriptionEngine

### Community 67 - "logging"
Cohesion: 0.22
Nodes (3): BaseSTTProvider, GroqWhisperProvider, LocalWhisperProvider

### Community 68 - "publish/route.ts"
Cohesion: 0.22
Nodes (10): dynamic, POST(), dynamic, POST(), normalisePhone(), hashPassword(), DENY_LIST, MIN_PASSWORD_LENGTH (+2 more)

### Community 69 - "ClinicOS: Architecture & Engineering Reality Audit"
Cohesion: 0.15
Nodes (12): 2. Eradication of Hardcoded Bypass PINs, 3. Concurrency & Queue Token Integrity, 4. Medical Document Security (Vault), 5. Doctor Authority & Prescription Integrity, 6. Payment Integrity (Razorpay HMAC), 7. Canonical Database Baseline, 8. SaaS Business Model & Pricing Alignment, 9. Verification & Operational Status (+4 more)

### Community 70 - "ConsultationRecorder.tsx"
Cohesion: 0.18
Nodes (15): authHeaders(), BAR_PATTERN, ConsultationRecorder(), escapeHtml(), formatTime(), getToken(), Phase, pickRecorderMimeType() (+7 more)

### Community 72 - "3.1 Build one guard module"
Cohesion: 0.25
Nodes (9): authorizeClinicUser(), authorizeSuperAdmin(), createAuthError(), extractAuthToken(), 6. What I fixed during this pass, 1. Authentication vs. Authorization (RBAC), Key Protections, Pipeline Execution Flow (+1 more)

### Community 73 - "dashboard/layout.tsx"
Cohesion: 0.16
Nodes (14): CLINIC_BOTTOM_NAV, CLINIC_CORE_NAV, CLINIC_MGMT_NAV, DashboardLayout(), FUTURE_MODULES, NavItem(), NavItemProps, ROLE_ALLOWLIST (+6 more)

### Community 74 - "token-alert/route.ts"
Cohesion: 0.36
Nodes (8): dynamic, POST(), Delivery, devMode(), isOtpDevMode(), sendMessage(), sendOtp(), whatsappSend()

### Community 75 - "ClinicOS — Remediation Plan & Feature Roadmap"
Cohesion: 0.18
Nodes (11): 0. Executive plan, 10. Risk register, 11. Decisions I need from you, 1. Principles (non-negotiable for this codebase), 2. Phase 0 — Safety net (2 days), 5. Phase 3 — Schema reconciliation & data layer (4–5 days) 🟠 P1, 6. Phase 4 — Financial correctness & audit trail (5 days) 🟠 P1, 7. Phase 5 — Hardening & frontend auth (4–5 days) 🟠 P1 (+3 more)

### Community 77 - "supabase.ts"
Cohesion: 0.50
Nodes (3): supabase, supabaseReady, @supabase/supabase-js

### Community 80 - "abdm/page.tsx"
Cohesion: 0.39
Nodes (7): POST(), AbdmDashboardPage(), ABDM_PURPOSE_CODES, AbdmPatient, ConsentArtefact, isValidVid(), maskAadhaar()

### Community 81 - "consultant/route.ts"
Cohesion: 0.38
Nodes (6): buildDoctorCard(), DoctorRow, dynamic, pickDoctor(), POST(), SPECIALTY_KEYWORDS

### Community 83 - "test_auth_invalid_token"
Cohesion: 0.33
Nodes (4): test_auth_invalid_token(), test_auth_missing_header(), override_get_db(), test_clinic_tenant_authorization_forbidden()

### Community 84 - "CLINICAL_ROLES"
Cohesion: 0.13
Nodes (17): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+9 more)

### Community 85 - "speaker-attribution.ts"
Cohesion: 0.33
Nodes (5): attributeSpeaker(), DOCTOR_PATTERNS, PATIENT_PATTERNS, SpeakerAttributionResult, SpeakerType

### Community 86 - "master/route.ts"
Cohesion: 0.47
Nodes (5): ALLOWED_PLANS, dynamic, GET(), POST(), superAdmin()

### Community 87 - "verify/route.ts"
Cohesion: 0.40
Nodes (5): COUNTER_MODES, dynamic, ONLINE_MODES, POST(), signaturesMatch()

### Community 88 - "queue/route.ts"
Cohesion: 0.47
Nodes (3): dynamic, GET(), maskPatientName()

### Community 89 - "3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0"
Cohesion: 0.33
Nodes (6): 3.2 Classify every handler, 3.3 Fix the worst specific holes first, 3.4 Add defense-in-depth middleware, 3.5 Add rate limiting, 3.6 Exit criteria, 3. Phase 1 — Authorization coverage (5–7 days) 🔴 P0

### Community 90 - "login/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, POST(), AUTH_COOKIE_OPTIONS, verifyPassword()

### Community 91 - "doctor-payouts/route.ts"
Cohesion: 0.60
Nodes (4): dynamic, GET(), POST(), todayIso()

### Community 92 - "extract/route.ts"
Cohesion: 0.50
Nodes (4): dynamic, POST(), regexExtract(), SPECIALTIES

### Community 93 - "ref_crypto"
Cohesion: 0.19
Nodes (15): dynamic, POST(), dynamic, POST(), dynamic, POST(), dynamic, POST() (+7 more)

### Community 95 - "doctors/[slug]/page.tsx"
Cohesion: 0.23
Nodes (9): DoctorProfilePage(), generateStaticParams(), Props, AIReceptionistProps, AIReceptionistWidget(), ChatMessage, DoctorReviewsSection(), ReviewItem (+1 more)

### Community 96 - "inventory/route.ts"
Cohesion: 0.43
Nodes (5): dynamic, dynamic, GET(), numberOrNull(), POST()

### Community 97 - "4. Phase 2 — Patient identity & clinical privacy (4–5 days) 🔴 P0"
Cohesion: 0.40
Nodes (5): 4.1 Replace phone lookup with OTP-verified sessions, 4.2 Rewrite `/api/patients/[phone]`, 4.3 Related privacy fixes, 4.4 Exit criteria, 4. Phase 2 — Patient identity & clinical privacy (4–5 days) 🔴 P0

### Community 98 - "whatsapp/route.ts"
Cohesion: 0.67
Nodes (3): appBaseUrl(), dynamic, POST()

### Community 99 - "generate/route.ts"
Cohesion: 0.67
Nodes (3): cleanPhone(), dynamic, POST()

### Community 100 - "whatsapp-dispatch/route.ts"
Cohesion: 0.67
Nodes (3): appBaseUrl(), dynamic, POST()

## Knowledge Gaps
- **582 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+577 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 782 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `book/page.tsx`, `dashboard/consult/[id]/page.tsx`, `BrowseSpecialtiesSection.tsx`, `today/page.tsx`, `sql`, `clinic-data.ts`, `ThemeToggle`, `patients/route.ts`, `claims/route.ts`, `web/package.json`, `schedule/page.tsx`, `check-in/page.tsx`, `rateLimit`, `finance/page.tsx`, `react`, `machine-import/route.ts`, `middleware.ts`, `db.ts`, `AIClinicalCompanion.tsx`, `plans/route.ts`, `reception/page.tsx`, `logAudit`, `reports/route.ts`, `search/page.tsx`, `api.ts`, `display/waiting-room/page.tsx`, `apiError`, `api-auth.ts`, `guard`, `publish/route.ts`, `dashboard/layout.tsx`, `token-alert/route.ts`, `abdm/page.tsx`, `consultant/route.ts`, `CLINICAL_ROLES`, `master/route.ts`, `verify/route.ts`, `queue/route.ts`, `login/route.ts`, `doctor-payouts/route.ts`, `extract/route.ts`, `ref_crypto`, `doctors/[slug]/page.tsx`, `inventory/route.ts`, `whatsapp/route.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Why does `postgres` connect `audit-default-passwords.mjs` to `migrate.mjs`, `schema-audit.mjs`, `test_live_suite.mjs`, `web/package.json`, `seed.mjs`, `db.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `sql` connect `sql` to `clinic-data.ts`, `patients/route.ts`, `claims/route.ts`, `rateLimit`, `machine-import/route.ts`, `db.ts`, `logAudit`, `reports/route.ts`, `apiError`, `api-auth.ts`, `guard`, `publish/route.ts`, `token-alert/route.ts`, `CLINICAL_ROLES`, `master/route.ts`, `verify/route.ts`, `queue/route.ts`, `login/route.ts`, `doctor-payouts/route.ts`, `ref_crypto`, `inventory/route.ts`, `whatsapp/route.ts`, `generate/route.ts`, `whatsapp-dispatch/route.ts`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `guard()` (e.g. with `3. Deferred / not production-ready` and `3.1 Build one guard module`) actually correct?**
  _`guard()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _582 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ClinicOS — Remediation Plan v2` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._
- **Should `book/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11693548387096774 - nodes in this community are weakly interconnected._