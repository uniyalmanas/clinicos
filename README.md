# DocSphere / ClinicOS 🩺
### Digital Operating Infrastructure & Healthcare ERP for Independent Doctors, Clinics & Pharmacies

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![NMC Compliant](https://img.shields.io/badge/NMC-Compliant-0071E3?style=for-the-badge&logo=shield)](https://www.nmc.org.in/)
[![ABDM Ready](https://img.shields.io/badge/ABDM-M1%20Ready-34C759?style=for-the-badge)](https://abdm.gov.in/)

---

## 📑 Table of Contents
1. [Product Vision & Core Philosophy](#-product-vision--core-philosophy)
2. [Target Audience & Ecosystem](#-target-audience--ecosystem)
3. [All Features Built & Progress Made](#-all-features-built--progress-made)
   - [Clinical Chamber Studio (Doctor Consultation)](#1-doctor-clinical-chamber-studio--consultation-room)
   - [Clinic Front Desk & Live Token Desk](#2-clinic-front-desk-reception-console--token-desk)
   - [Zero-App Patient Portal & Discovery](#3-zero-app-patient-portal--discovery-experience)
   - [60-Second AI Onboarding Wizard](#4-60-second-ai-onboarding-wizard--assistant)
   - [AI Clinic Receptionist Widget](#5-ai-clinic-receptionist-widget)
   - [Clinic Cash Flow & Expense Ledger](#6-clinic-cash-flow--expense-ledger)
   - [In-House & Partner Pharmacy / Lab Dispensary](#7-in-house-pharmacy-batch-inventory-expiry-radar--pos-dispense)
   - [Platform Administration & NMC Verification](#8-platform-administration--nmc-verification)
   - [Verified Patient Reviews & Reputation System](#9-verified-patient-reviews--reputation-system)
   - [Inpatient Bed & Ward Management Matrix](#10-inpatient-bed--ward-management-matrix)
   - [Patient EMR Directory & Diagnostic Lab Reports Vault](#11-patient-emr-directory--diagnostic-lab-reports-vault)
4. [Design System & Apple HIG UI/UX](#-design-system--apple-hig-uiux)
5. [Monorepo Architecture & Codebase Map](#-monorepo-architecture--codebase-map)
6. [Backend API Reference](#-backend-api-reference)
7. [Healthcare Regulatory Compliance & Security](#-healthcare-regulatory-compliance--security)
8. [Dehradun Pilot Implementation](#-dehradun-pilot-implementation)
9. [Developer Quickstart & Installation](#-developer-quickstart--installation)
10. [Roadmap & Production Milestones](#-roadmap--production-milestones)

---

## 🏥 Product Vision & Core Philosophy

In India, healthcare software is broken into two extremes:
1. **Aggregators (e.g. Practo, Lybrate):** They pit doctors against each other, display competitor ads directly on doctor profiles, hijack organic search traffic, and charge high per-lead commissions.
2. **Bloated Enterprise Hospital ERPs:** Expensive, complex desktop software designed for 500-bed hospital chains that require weeks of staff training and cost lakhs of rupees.

### 💡 The Solution: "Shopify for Independent Healthcare"
**DocSphere / ClinicOS** provides the **digital operating layer for independent healthcare providers**:
- **Zero Commission & Direct Payments:** Doctors keep 100% of consultation fees paid directly via UPI or cash.
- **Brand Ownership:** Every doctor and clinic gets their own verified profile, sub-domain, and private booking URL.
- **Instant 60-Second Onboarding:** AI turns natural language bios or visiting cards into full clinic websites with zero tech setup.
- **Offline-Resilient & Lightweight:** Fast web application running on any laptop, tablet, or phone with no app download required for patients.

```
                           THE HEALTHCARE ECOSYSTEM FLYWHEEL
                                 ┌──────────────────┐
                                 │  INDEPENDENT     │
                                 │  DOCTORS/CLINICS │
                                 └────────┬─────────┘
                                          │ AI Onboarding (< 60s)
                                          ▼
                                 ┌──────────────────┐
                                 │ DIGITAL PRESENCE │
                                 │ & PRIVATE URL    │
                                 └────────┬─────────┘
                                          │ Maps & Local SEO Discovery
                                          ▼
                                 ┌──────────────────┐
                                 │ PATIENTS & TOKEN │
                                 │ APPOINTMENTS     │
                                 └────────┬─────────┘
                                          │ Consultation & Digital Rx
                                          ▼
   ┌────────────────────────────────────────────────────────────────────────┐
   │                       CLINIC OPERATING ENGINE                          │
   │  [Digital Rx] ──► [In-House Pharmacy] ──► [Expense & Cashflow Ledger]  │
   └──────────────────────────────────────┬─────────────────────────────────┘
                                          │ Direct WhatsApp Engagement
                                          ▼
                                 ┌──────────────────┐
                                 │ PATIENT RETENTION│
                                 │ & FOLLOW-UPS     │
                                 └──────────────────┘
```

---

## 🎯 Target Audience & Ecosystem

| Stakeholder | Key Value Delivered |
| :--- | :--- |
| **Independent Doctors** | Dedicated clinical consultation room, NMC-compliant digital prescriptions, direct UPI collections, patient history vault, verified credentials. |
| **Small & Medium Clinics** | Walk-in counter token generation, multi-chamber queue coordination, acoustic chime bell, daily cash flow vs. expense tracking. |
| **Patients** | Real-time token tracking (no crowded waiting rooms), zero app download, digital tamper-proof prescriptions on WhatsApp, medication dosage alarms. |
| **Pharmacies & Diagnostic Labs** | Direct digital prescription feed from doctors, order dispatch tracking, generic substitution support, sample collection logging. |
| **Platform Administrators** | Verification of State Medical Council registration numbers, fraud mitigation, platform-wide analytics. |

---

## 🚀 All Features Built & Progress Made

### 1. 🩺 Doctor Clinical Chamber Studio & Consultation Room
*Location:* [`apps/web/src/app/dashboard/consult/[id]/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/consult/%5Bid%5D/page.tsx) & [`doctor/consult/[id]`](file:///D:/medic-sept-2026/apps/web/src/app/doctor/consult/%5Bid%5D/page.tsx)

- **Comprehensive Patient Demographic & Clinical Header:** Token indicator, patient age, gender, contact number, blood group, and allergy alerts.
- **AI Clinical Voice & Dictation Scribe (`POST /api/v1/prescriptions/scribe`):**
  - Doctors can dictate or type unstructured clinical findings.
  - Powered by Gemini 2.0 Flash with clinical heuristic parsing, automatically extracting Vitals, Chief Complaints, Provisional Diagnosis, Investigations, and UPPERCASE generic pharmacopeia medications in < 1 second.
- **Clinical Vitals Grid:** Real-time logging of Blood Pressure (Systolic/Diastolic), Pulse Rate (bpm), Body Temperature (°F), SpO2 (%), Blood Sugar (mg/dL), and Body Weight (kg).
- **Chief Complaints & Diagnosis:** Multi-symptom tagger with clinical severity notes and provisional diagnosis editor.
- **NMC-Compliant Indian Pharmacopeia Prescription Writer:**
  - Integrated Indian medicine formulary (`data/medicines.ts`) covering Dermatology, Antibiotics, Analgesics, Gastrointestinal, Dental, Pediatrics, and Cardio-Diabetic.
  - **Mandatory Uppercase Generic Chemical Names:** Automatically highlights the chemical formulation (e.g. `DOXYCYCLINE HYCLATE`, `AMOXICILLIN + CLAVULANIC ACID`, `PARACETAMOL`) alongside the brand name in adherence to NMC directives.
  - Dosage format selection (Tablets, Capsules, Syrups, Ointments, Injections), exact strengths, frequencies (`1-0-1`, `0-0-1`, etc.), relation to meals (`Before Food`, `After Food`, `At Bedtime`), and duration.
  - Special patient instructions per item (e.g., *"Take with full glass of water, avoid lying down immediately"*).
- **Cryptographic Tamper-Proofing & Unified Database Persistence:**
  - Persists directly to SQLite database (`prescriptions` table).
  - Generates a **SHA-256 digital signature hash** derived from the doctor’s credentials, patient ID, diagnosis, and medicine array.
  - Generates an instant **QR Verification Code** for chemist and audit authentication.
  - Automatically notifies the Clinic Desk (`/api/v1/clinic/complete-token`) to advance the token sequence in real-time.
- **Integrated Patient Document Vault:**
  - Instant access to patient lab reports, blood panels, and past prescriptions via `PatientDocumentsManager`.
- **1-Click WhatsApp & SMS Dispatch:**
  - Generates a pre-filled `wa.me` intent URL to send the digital prescription link directly to the patient's WhatsApp.
  - High-fidelity printable layout formatted for physical A4 clinic letterhead printers (`/p/[id]`).

---

### 2. 🏢 Clinic Front Desk Reception Console & Token Desk
*Location:* [`apps/web/src/app/dashboard/desk/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/desk/page.tsx) & [`clinic/desk`](file:///D:/medic-sept-2026/apps/web/src/app/clinic/desk/page.tsx)

- **Walk-in Patient Quick Check-In:** Fast 10-second intake capturing patient name, mobile number, doctor selection, and fee payment.
- **Real-Time Token Synchronization Engine (Server-Sent Events / SSE):**
  - Asynchronous event broadcast over `GET /api/v1/clinic/stream`.
  - Instantly updates waiting rooms, patient screens, and receptionist terminals whenever a doctor calls or completes a token.
- **Built-in Web Audio Acoustic Chime Bell:**
  - Built-in dual-sine wave oscillator (Tone 1: 587.33 Hz D5 + Tone 2: 880.00 Hz A5) running directly in the browser.
  - Eliminates the need for expensive token display hardware or voice intercoms in clinic waiting areas.
- **Counter Cash & UPI Reconciler:**
  - Tracks collections split between Cash and UPI with instantaneous total tallies for end-of-day desk closure.
- **Chamber & Schedule Manager:**
  - Configurable OPD shifts (Morning / Evening) and doctor chamber allocation across polyclinics (`dashboard/chambers`).

---

### 3. 👥 Zero-App Patient Portal & Discovery Experience
*Location:* [`apps/web/src/app/patient/portal/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/patient/portal/page.tsx), [`p/[id]/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/p/%5Bid%5D/page.tsx), and [`book/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/book/page.tsx)

- **Zero-Friction Advance Booking (`/book`):**
  - Instant view of current token being served, next available token, and estimated waiting time in minutes.
  - Transparent consultation fee display with clinic address and doctor qualifications.
- **Interactive Local Discovery & Clinic Map (`InteractiveClinicMap.tsx`):**
  - High-performance canvas-based simulation of medical corridors (seeded for Dehradun: Rajpur Road, EC Road, Chakrata Road).
  - Interactive doctor cards with live token load, travel distance, estimated drive time, and specialty tags.
- **Patient Self-Serve Health Portal (`/patient/portal`):**
  - Passwordless phone lookup — patients view active prescriptions without remembering passwords or downloading an app.
  - **Medication Schedule Alarms:** Interactive daily alarms for morning, afternoon, and bedtime dosages.
  - **Chemist Forwarding:** 1-click routing of prescription items to partner pharmacies (e.g., Apollo Pharmacy) for express pickup.
- **Public Digital Prescription Verification Page (`/p/[id]`):**
  - Publicly accessible, responsive digital prescription viewer with SHA-256 cryptographic verification banner.
  - Integrated QR code, doctor qualification details, vitals readout, and print/save actions.

---

### 4. ⚡ 60-Second AI Onboarding Wizard & Assistant
*Location:* [`apps/web/src/app/onboarding/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/onboarding/page.tsx) & [`apps/api/app/ai/onboarding_agent.py`](file:///D:/medic-sept-2026/apps/api/app/ai/onboarding_agent.py)

- **Zero Manual Forms:** Doctor types or speaks a raw text description or uploads a photo of their visiting card/letterhead.
- **Multimodal Gemini Vision OCR:** Decodes doctor visiting cards, signboards, and printed letterheads directly into structured credentials and clinic address.
- **Information Extracted Automatically:**
  - Doctor full name, degrees (MBBS, MD, BDS, MDS), and specialties.
  - State Medical Council registration numbers (e.g. `UKMC-5541-2012`).
  - Clinic name, street address, landmarks, and city.
  - Consultation fees & follow-up validity days.
  - Morning and evening OPD timings.
- **AI Professional Biography Synthesizer:** Crafts patient-friendly, SEO-optimized professional summaries.
- **1-Click Profile Publication:**
  - Commits directly to database tables (`doctors` and `clinics`) and generates the live doctor and clinic URLs immediately.
- **Conversational Ingestion:**
  - Doctors or clinic staff simply type or dictate an unstructured description, or paste their visiting card / WhatsApp bio.
- **Hybrid Intelligence Engine:**
  - Direct integration with **Google Gemini 2.0 Flash** for state-of-the-art medical entity extraction.
  - Built-in **intelligent heuristic fallback regex engine** guaranteeing offline and zero-API-key local test execution.
- **Structured Extraction Output:**
  - Doctor Name, Specialization (Dermatology, Dentistry, Pediatrics, Orthopedics, etc.), Qualifications, State Medical Council Registration Number, Years of Experience, Consultation Fee, Services with pricing, Clinic Address, Locality, and Morning/Evening OPD timings.
- **AI Professional Clinic Bio Generator:**
  - Automatically writes a patient-friendly, SEO-optimized clinic bio with in-place editing before publishing.
- **1-Click Profile Publication:**
  - Commits directly to database tables and generates the live doctor and clinic URLs immediately.

---

### 5. 💬 AI Clinic Receptionist Widget
*Location:* [`apps/web/src/components/AIReceptionistWidget.tsx`](file:///D:/medic-sept-2026/apps/web/src/components/AIReceptionistWidget.tsx)

- Floating patient assistant embedded on doctor profiles (`/doctors/[slug]`).
- Answers inquiries regarding:
  - OPD consultation timings and days.
  - First-visit consultation fees and follow-up policies.
  - Clinic address, landmarks, and navigation directions.
  - Doctor qualifications and specializations.
- Provides dynamic action buttons to deep-link directly into the live token booking flow.

---

### 6. 💰 Clinic Cash Flow & Expense Ledger
*Location:* [`apps/web/src/app/dashboard/finance/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/finance/page.tsx) & [`apps/api/app/api/v1/expenses.py`](file:///D:/medic-sept-2026/apps/api/app/api/v1/expenses.py)

- **Database-Backed Financial Cockpit:** Real-time reconciliation between daily OPD gross patient collections, in-house pharmacy sales, and clinic operating expenses directly persisted to SQLite.
- **Granular Expense Categories:**
  - UPCL Commercial Electricity & HVAC.
  - OPD Consumables (disposable nitrile gloves, surgical spirit, cotton rolls, disinfectant).
  - Clinic Staff Salaries (receptionists, nursing assistants).
  - Medical Equipment Servicing (lasers, dental chairs, autoclaves).
- **Fast 1-Click Presets & Real-Time Deletion:** Instant logging of common overheads with instant voucher deletion.
- **Real Net In-Hand Profit & Margins:** Calculates real net profit percentages after meeting all physical operating costs.

---

### 7. 💊 In-House Pharmacy Batch Inventory, Expiry Radar & POS Dispense
*Location:* [`apps/web/src/app/dashboard/pharmacy/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/pharmacy/page.tsx) & [`apps/api/app/api/v1/pharmacy.py`](file:///D:/medic-sept-2026/apps/api/app/api/v1/pharmacy.py)

- **Batch Inventory & Expiry Countdown Radar:**
  - Tracks brand names, generic formulations, strength, batch numbers, and expiry dates (`YYYY-MM-DD`).
  - **Dynamic Expiry Countdown:** Flags batches expiring within 60 days (amber warning) and within 30 days (critical red alert).
  - **Low-Stock Detection:** Real-time alerts when current stock falls below reorder thresholds.
- **Computerized Prescription Dispense & POS Billing:**
  - Doctor prescriptions emitted in chambers appear automatically in the clinic dispensary feed.
  - 1-Click counter dispense automatically deducts items from matching inventory batch stock.
  - Pre-calculates GST slabs (5%, 12%, 18%) and applies discounts.
  - Generates official, printable GST Tax Invoices with clinic letterhead, GSTIN, and payment mode breakdowns.
- **External Partner Deliveries:** Optional routing to partner hubs (Apollo Pharmacy, Dr. Lal PathLabs) for home delivery.

---

### 8. 🛡️ Platform Administration & NMC Verification
*Location:* [`apps/web/src/app/admin/verifications/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/admin/verifications/page.tsx) & [`apps/api/app/api/v1/admin.py`](file:///D:/medic-sept-2026/apps/api/app/api/v1/admin.py)

- **NMC Verification Queue:** Admin approval workflow verifying doctor identity, degrees, and State Medical Council registration numbers before public directory indexing.
- **SQLite Database Synchronization:** Approvals and rejections are committed directly to `DoctorModel` in the database with optimistic UI updates.
- **Platform Analytics:** Real-time metrics on total onboarded doctors, active clinics, patient appointments booked, and gross consultation volumes.

---

### 9. ⭐ Verified Patient Reviews & Reputation System
*Location:* [`apps/web/src/components/DoctorReviewsSection.tsx`](file:///D:/medic-sept-2026/apps/web/src/components/DoctorReviewsSection.tsx) & [`apps/api/app/api/v1/reviews.py`](file:///D:/medic-sept-2026/apps/api/app/api/v1/reviews.py)

- **Anti-Fraud Verified Visit Badges:** Only patients with recorded appointment tokens can leave verified reviews.
- **Multi-Vector Ratings:** Overall satisfaction, waiting time experience, and bedside manner scores.
- **Doctor Public Replies:** Enables doctors to professionally respond to patient feedback.

---

### 10. 🛏️ Inpatient Bed & Ward Management Matrix
*Location:* [`apps/web/src/app/dashboard/beds/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/beds/page.tsx) & [`apps/api/app/api/v1/beds.py`](file:///D:/medic-sept-2026/apps/api/app/api/v1/beds.py)

- **Live Ward Floorplan Matrix:** Real-time visualization across General Wards, Semi-Private Rooms, Deluxe AC Suites, Daycare Recovery, and HDU/ICU.
- **Color-Coded Lifecycle States:** Vacant (Green), Occupied (Blue), Discharge Pending (Amber), and Maintenance/Sanitization (Gray).
- **Patient Admission Flow:** Direct admission capturing patient name, phone, attending doctor, clinical notes, and admission timestamp.
- **Stay Duration & Billing Engine:** Automatically computes hours/days stayed and accrued room charges based on daily and hourly ward tariff rates.
- **Instant Discharge Receipt:** Generates printable discharge summary and invoice upon patient checkout.

---

### 11. 📁 Patient EMR Directory & Diagnostic Lab Reports Vault
*Location:* [`apps/web/src/app/dashboard/patients/page.tsx`](file:///D:/medic-sept-2026/apps/web/src/app/dashboard/patients/page.tsx) & [`apps/web/src/components/PatientDocumentsManager.tsx`](file:///D:/medic-sept-2026/apps/web/src/components/PatientDocumentsManager.tsx)

- **Unified Patient Health Records (PHR):** Combines registered OPD walk-ins, consultation notes, and chronic drug allergy flags.
- **Dual-Pane Clinical Workspace:** Instant switching between previous consultation visit timelines and the diagnostic document vault.
- **Diagnostic Document Locker:** Upload and view blood panels, radiology X-rays, pathology reports, and past prescription PDFs with doctor annotations.

---

## 🎨 Design System & Apple HIG UI/UX

DocSphere features an interface inspired by **Apple Health** and the **Apple Human Interface Guidelines (HIG)**:
* **Dual Palette Architecture:**
  * **Light Mode:** Uses an Apple neutral canvas (`#ECEEF2`) to eliminate eye-straining white glare under clinic tube-lighting.
  * **Dark Mode:** Deep obsidian slate (`#000000` / `#1C1C1E`) with subtle zinc borders (`#2C2C2E`).
* **Glassmorphic Navigation:** `backdrop-blur-2xl` translucent headers with high-clarity iconography.
* **Typography Hierarchy:**
  * **Primary:** `Plus Jakarta Sans` for clean, professional clinical readability.
  * **Monospace:** `JetBrains Mono` for registration numbers, timestamps, token numbers, and cryptographic SHA-256 hashes.
* **Acoustic Feedback:** Web Audio API sound generator for waiting room token rings.

---

## 🏗️ Monorepo Architecture & Codebase Map

```
clinicos-monorepo/
├── apps/
│   ├── api/                                # FastAPI Async Python API Backend
│   │   ├── app/
│   │   │   ├── ai/
│   │   │   │   └── onboarding_agent.py     # Gemini 2.0 & Heuristic Medical NLP Extractor
│   │   │   ├── api/v1/                     # Modular API Routers
│   │   │   │   ├── admin.py                # Platform admin & verifications
│   │   │   │   ├── appointments.py         # Appointment booking & token queue
│   │   │   │   ├── auth.py                 # JWT authentication & OTP schemas
│   │   │   │   ├── clinic.py               # Reception desk operations
│   │   │   │   ├── clinics.py              # Clinic public profiles
│   │   │   │   ├── doctors.py              # Doctor public profiles
│   │   │   │   ├── documents.py            # Patient document vault
│   │   │   │   ├── expenses.py             # Clinic financial ledger
│   │   │   │   ├── health.py               # Health probe endpoint
│   │   │   │   ├── onboarding.py           # 60s AI doctor onboarding endpoint
│   │   │   │   ├── prescriptions.py        # NMC-compliant Rx generator
│   │   │   │   ├── reviews.py              # Verified patient reviews
│   │   │   │   └── search.py               # Doctor/clinic search engine
│   │   │   ├── core/
│   │   │   │   ├── config.py               # App configuration & settings
│   │   │   │   └── security.py             # JWT, bcrypt hashing utilities
│   │   │   ├── db/
│   │   │   │   ├── clinicos.db             # Pre-seeded SQLite database
│   │   │   │   ├── init_db.py              # Automatic DB schema & seed runner
│   │   │   │   ├── models.py               # SQLAlchemy ORM models
│   │   │   │   └── session.py              # Database engine & session maker
│   │   │   └── schemas/                    # Pydantic v2 validation models
│   │   ├── main.py                         # FastAPI App Factory & Middleware
│   │   └── requirements.txt                # Python backend dependencies
│   │
│   └── web/                                # Next.js 15 App Router Frontend
│       ├── public/                         # Static assets & icons
│       └── src/
│           ├── app/
│           │   ├── admin/                  # Admin verifications & analytics
│           │   ├── book/                   # Live appointment & token booking flow
│           │   ├── clinic/                 # Clinic desk & expense pages
│           │   ├── clinics/[slug]/         # Clinic public profiles
│           │   ├── dashboard/              # Full Clinic ERP Cockpit
│           │   │   ├── chambers/           # OPD shift & room scheduler
│           │   │   ├── consult/[id]/       # Doctor consultation room & Rx writer
│           │   │   ├── desk/               # Reception desk token queue
│           │   │   ├── finance/            # Expense & cashflow ledger
│           │   │   ├── patients/           # EMR Patient directory
│           │   │   ├── pharmacy/           # Dispensary & lab orders
│           │   │   └── settings/           # Clinic profile & billing settings
│           │   ├── doctor/                 # Standalone doctor queue & consult
│           │   ├── doctors/[slug]/         # Doctor public verified profiles
│           │   ├── login/                  # Staff & Doctor authentication
│           │   ├── onboarding/             # 60-Second AI Onboarding Wizard
│           │   ├── p/[id]/                 # Public Digital Rx with SHA-256 verify
│           │   ├── patient/portal/         # Patient records & alarm portal
│           │   ├── pharmacy/console/       # In-house pharmacy dispensing desk
│           │   ├── search/                 # Doctor & clinic directory search
│           │   ├── layout.tsx              # Root HTML & theme provider
│           │   └── page.tsx                # Apple HIG Landing page & playground
│           ├── components/
│           │   ├── AIReceptionistWidget.tsx    # Floating conversational assistant
│           │   ├── DoctorReviewsSection.tsx    # Verified reviews & doctor replies
│           │   ├── InteractiveClinicMap.tsx    # Canvas clinic geolocation map
│           │   ├── InteractiveHeroSearch.tsx   # Instant specialty & locality search
│           │   ├── InteractivePlayground.tsx   # Live product interactive demo
│           │   ├── PatientDocumentsManager.tsx # Document & lab report manager
│           │   └── ThemeToggle.tsx             # Light/Dark mode switcher
│           └── data/
│               ├── medicines.ts            # Indian pharmacopeia formulary
│               └── patients.ts             # Pilot patient records & histories
│
└── packages/
    ├── database/                           # Canonical database schema & migrations
    │   ├── schema.sql                      # SQL schema for PostgreSQL / SQLite
    │   └── seed.sql                        # Production seed fixtures
    └── types/                              # Canonical TypeScript domain types
        └── src/index.ts                    # Shared interfaces across monorepo
```

---

## ⚡ Backend API Reference

All API routes are served under the `/api/v1` namespace:

| Prefix | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Register new doctor/clinic user |
| | `POST` | `/api/v1/auth/login` | Login and receive JWT access token |
| | `GET` | `/api/v1/auth/me` | Fetch authenticated user profile |
| **Onboarding** | `POST` | `/api/v1/onboarding/extract` | AI entity extraction from doctor bios (Gemini 2.0) |
| | `POST` | `/api/v1/onboarding/publish` | 1-Click publish doctor & clinic profile to DB |
| **Doctors** | `GET` | `/api/v1/doctors` | List verified doctors with filters |
| | `GET` | `/api/v1/doctors/{slug}` | Fetch detailed doctor profile & services |
| **Clinics** | `GET` | `/api/v1/clinics` | List registered clinics |
| | `GET` | `/api/v1/clinics/{slug}` | Fetch clinic profile & associated doctors |
| **Search** | `GET` | `/api/v1/search` | Multi-parameter search by specialty, city, and fees |
| **Appointments**| `POST` | `/api/v1/appointments/book` | Book advance slot or walk-in appointment |
| | `GET` | `/api/v1/appointments/my-queue` | Get live queue tokens by date & doctor |
| **Clinic Desk** | `GET` | `/api/v1/clinic/stream` | Server-Sent Events (SSE) live token broadcast |
| | `GET` | `/api/v1/clinic/desk-queue` | Front desk counter token list & cash reconciler |
| | `POST` | `/api/v1/clinic/walk-in` | Instant counter walk-in token generator |
| | `POST` | `/api/v1/clinic/call-token` | Call token with real-time SSE broadcast & chime |
| | `POST` | `/api/v1/clinic/complete-token` | Mark token consultation completed |
| **Inpatient Beds** | `GET` | `/api/v1/beds` | Bed & Ward occupancy matrix with accrued charges |
| | `POST` | `/api/v1/beds/admit` | Admit patient to bed with doctor & clinical notes |
| | `POST` | `/api/v1/beds/discharge` | Discharge patient & calculate stay invoice bill |
| | `POST` | `/api/v1/beds/status` | Quick toggle bed status (vacant, maintenance) |
| **Prescriptions**| `POST`| `/api/v1/prescriptions/generate` | Generate NMC-compliant prescription with SHA-256 |
| | `GET` | `/api/v1/prescriptions/{rx_number}`| View tamper-proof prescription record |
| | `POST` | `/api/v1/prescriptions/scribe` | AI Clinical Voice & Dictation Scribe parser |
| **Pharmacy** | `GET` | `/api/v1/pharmacy/inventory` | In-house batch inventory with days-to-expiry countdown radar |
| | `POST` | `/api/v1/pharmacy/inventory` | Add new medicine batch / SKU to dispensary |
| | `PUT` | `/api/v1/pharmacy/inventory/{id}/stock` | Adjust physical verified stock count |
| | `GET` | `/api/v1/pharmacy/prescriptions-queue` | Prescriptions awaiting dispensary fulfillment |
| | `POST` | `/api/v1/pharmacy/dispense` | POS dispense with automatic stock deduction & GST invoice |
| | `GET` | `/api/v1/pharmacy/bills` | Fetch past dispensary tax invoices |
| **Documents** | `GET` | `/api/v1/documents` | Fetch patient lab reports & records |
| | `POST` | `/api/v1/documents/upload` | Upload new medical document with notes |
| **Reviews** | `GET` | `/api/v1/reviews` | Fetch doctor reviews and satisfaction metrics |
| | `POST` | `/api/v1/reviews` | Submit verified patient review |
| **Expenses** | `GET` | `/api/v1/expenses` | Daily clinic expense ledger & P&L balance |
| | `POST` | `/api/v1/expenses` | Record new clinic operating expense voucher |
| | `DELETE`| `/api/v1/expenses/{id}` | Delete operating expense voucher |
| **Admin** | `GET` | `/api/v1/admin/verifications` | View doctor NMC credential requests (SQLite synced) |
| | `POST` | `/api/v1/admin/verify` | Approve or reject doctor registration in database |
| | `GET` | `/api/v1/admin/analytics` | Platform ARR, MRR, tenant status & token metrics |

---

## 🔒 Healthcare Regulatory Compliance & Security

* **National Medical Commission (NMC) 2023 Directives:**
  * Prominent display of verified State Medical Council registration numbers on all digital prescriptions.
  * Uppercase generic pharmacopeia salt naming enforced in the prescription studio.
* **Tamper-Proof Audit Trail:**
  * Every generated prescription computes a SHA-256 cryptographic signature that changes if any item is altered.
* **Multi-Tenant Data Isolation:**
  * Clinic tenant boundaries isolate patient records. Receptionists see queue metadata without unauthorized access to clinical diagnostic notes.
* **Ayushman Bharat Digital Mission (ABDM) Ready:**
  * Canonical database schema incorporates `abha_number` and `abha_address` fields for Milestone 1 (M1) national health ID linkage.

---

## 📍 Dehradun Pilot Implementation

The platform is initialized with realistic healthcare data from the **Dehradun Medical Pilot**:
* **Derma Care Skin & Laser Centre:** Dr. Rahul Sharma (MBBS, MD Dermatology) — 14, Rajpur Road.
* **Smile Craft Multi-Speciality Dental:** Dr. Aditi Joshi (BDS, MDS Endodontics) — 42, EC Road.
* **Dron Child & Newborn Health Centre:** Dr. Vikram Sethi (MBBS, DCH, DNB Pediatrics) — 88, Chakrata Road.
* **Partner Hubs:** Apollo Pharmacy (Rajpur Road), Dr. Lal PathLabs (Survey Chowk), Sanjeevani Medicos (EC Road).

---

## 💻 Developer Quickstart & Installation

### Prerequisites
- **Node.js:** v18.18+ or v20+
- **Python:** 3.11+ or 3.12+
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/uniyalmanas/clinicos.git
cd clinicos
```

### 2. Install Dependencies
```bash
# Install workspace npm packages
npm install

# Setup Python Virtual Environment for FastAPI API
cd apps/api
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
cd ../..
```

### 3. Launch Development Servers
DocSphere includes convenient monorepo scripts:

```bash
# Terminal 1: Launch FastAPI Backend (runs on http://localhost:8000)
npm run dev:api

# Terminal 2: Launch Next.js Web App (runs on http://localhost:3000)
npm run dev:web
```

* Frontend Web Application: [http://localhost:3000](http://localhost:3000)
* Interactive Swagger API Docs: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
* ReDoc API Reference: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

---

## 🛣️ Roadmap & Production Milestones

- [x] **Milestone 1:** Core Monorepo Setup (Next.js 15, FastAPI, SQLite/PostgreSQL schema).
- [x] **Milestone 2:** Apple HIG UI/UX overhaul across all screens (Canvas light mode, Obsidian dark mode).
- [x] **Milestone 3:** NMC-compliant digital prescription creator with generic drug formatting & SHA-256 signatures.
- [x] **Milestone 4:** Front desk counter token desk with dual-sine browser audio chime bell.
- [x] **Milestone 5:** Zero-app patient portal, digital Rx viewer, and dosage alarms.
- [x] **Milestone 6:** 60-Second AI Onboarding Wizard (Gemini 2.0 Flash + multimodal visiting card OCR).
- [x] **Milestone 7:** Inpatient Bed & Ward Management Matrix (`/dashboard/beds`) with admissions & stay billing.
- [x] **Milestone 8:** Server-Sent Events (SSE) live token stream (`/api/v1/clinic/stream`) for real-time chamber-desk chime alerts.
- [x] **Milestone 9:** In-House Pharmacy Batch Inventory, Expiry Radar & POS Dispense Billing Terminal (`/dashboard/pharmacy`).
- [x] **Milestone 10:** Doctor Consultation Studio with AI Clinical Voice & Dictation Scribe (`/dashboard/consult/[id]`).
- [x] **Milestone 11:** Database-backed Clinic Cashflow Ledger, Real Net Profit P&L, and Expense Vouchers (`/dashboard/finance`).
- [x] **Milestone 12:** Patient EMR Directory with Embedded Diagnostic Lab Reports Vault (`/dashboard/patients`).
- [x] **Milestone 13:** Platform Administration & Doctor State Medical Council Verification (`/admin/verifications`).
- [ ] **Milestone 14:** Official Meta WhatsApp Cloud API webhooks for automated PDF dispatch and appointment notifications.
- [ ] **Milestone 15:** Ayushman Bharat Digital Mission (ABDM) Milestone 1 (M1) Sandbox certification.
- [ ] **Milestone 16:** Next.js Edge Middleware for custom doctor subdomains (`dr-rahul.clinicos.in`).

---

## 📄 License
Private & Proprietary. All rights reserved © 2026 DocSphere / ClinicOS.
