# DocSphere / ClinicOS 🩺
### Zero-Markup Healthcare Platform & Clinic Operating Infrastructure
**Live Production URL:** [https://medic-sept-2026.vercel.app/](https://medic-sept-2026.vercel.app/)  
**100% Serverless on Vercel + Supabase PostgreSQL (AWS ap-south-1)**

[![Live Production](https://img.shields.io/badge/Production-Live%20on%20Vercel-0071E3?style=flat-square&logo=vercel)](https://medic-sept-2026.vercel.app/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Groq LPU](https://img.shields.io/badge/AI%20Agent-Groq%20LPU%20Engine-F55036?style=flat-square)](https://groq.com/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![ABDM Certified](https://img.shields.io/badge/ABDM-FHIR%20R4%20M1%2FM2-orange?style=flat-square)](https://abdm.gov.in/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌐 Brand Architecture

- **DocSphere (Patient & Consumer Identity)**: Dehradun's verified direct healthcare network. Provides zero-markup appointments, transparent doctor fees (₹0 commission), live counter OPD queue tracking on mobile phones, and tamper-proof digital prescriptions delivered directly via WhatsApp.
- **DocSphere ClinicOS (Provider & Hospital Operating System)**: The full-stack operating infrastructure for independent doctors, multi-chamber polyclinics, and day-care centers. Delivers 30-second digital prescriptions, acoustic counter calling chimes, front-desk reception PWAs, waiting room TV wall displays, and automated 9 PM cash drawer closing reconciliation.

---

## 🚀 Live Patient-First Home Page (9-Step Architecture)

The front page (`/`) implements an uncluttered, patient-first hierarchy optimized for trust and direct access:

1. **Hero: "Zero-Markup Healthcare in Dehradun"**: Real-time search by doctor, specialty, or symptoms (Acne, Dental, Pediatrics) with direct primary CTAs (`Find Doctors in Dehradun` and `Book Appointment Token`).
2. **Simple 4-Step Patient Journey**:
   - `01 Search Verified Doctors`: Browse licensed practitioners with transparent fees across Rajpur Road, EC Road, Chakrata Road, and Haridwar Road.
   - `02 Reserve Live Token`: 100% direct doctor consultation fees with zero aggregator markup or booking commissions.
   - `03 Track Live OPD on Phone`: Real-time mobile ticker showing current chamber token numbers to eliminate waiting room crowds.
   - `04 Direct Care & WhatsApp Rx`: In-person clinical encounter with tamper-proof cryptographic SHA-256 PDF prescriptions delivered to WhatsApp.
3. **DocSphere vs. Traditional Marketplace Aggregators**: Transparent comparison matrix highlighting ₹0 markup, clinical merit discovery (no paid ads/sponsored doctor placements), live token counters, and confidential patient data privacy.
4. **Live Pilot Clinics in Dehradun**: Verified practitioners featuring state council license numbers, consultation fees, and synchronized counter statuses:
   - **Dr. Rahul Sharma**: MD (Dermatology), NMC Reg. `UKMC-8942-2012`, Derma Care Skin & Laser (Rajpur Rd), ₹600 (*Token #2 in room*).
   - **Dr. Aditi Joshi**: MDS (Endodontics & Dental Surgery), `UDC-4120-2016`, Smile Craft Dental (EC Rd), ₹400 (*Token #1 in room*).
   - **Dr. Vikram Sethi**: DNB (Pediatrics & Neonatology), UKMC Reg. `7312`, Dron Child & Newborn (Chakrata Rd), ₹500 (*Next Slot 11:30 AM*).
5. **Top Specialties Catalog**: Top 8 high-demand medical specialties (General Physician, Dermatology, Dentistry, Pediatrics, Orthopaedics, Gynaecology, ENT, Diabetology) with custom SVG vector icons, linked directly to the full 24-specialty directory (`/specialties`).
6. **For Doctors (DocSphere ClinicOS)**: Dedicated provider suite showcasing the 30-second prescription pad, reception desk PWA, and polyclinic multi-chamber hub, backed by an interactive 5-module live sandbox simulator.
7. **Transparent 3-Tier Doctor Pricing**:
   - **₹0 / forever (Starter Doctor)**: Digital profile, Google Maps discovery, up to 30 appointments/month.
   - **₹499 / month (Solo Practice Pro)**: Unlimited live token queues, 30-second Rx studio, WhatsApp PDF dispatch, Soundbox UPI reconciliation.
   - **₹1,999 / month (Multi-Doctor Polyclinic)**: Up to 8 consulting chambers, front-desk reception PWA, drawer audit ledger, acoustic counter chime system.
8. **Modern FAQ Accordions**: Interactive open/close accordion modules answering common questions on zero-markup pricing, app-free mobile token tracking, queue safety, and clinic onboarding.
9. **Minimalist Apple-Styled Footer**: Clean navigation linking to specialties, appointment booking, patient records, and the live production domain (`https://medic-sept-2026.vercel.app/`).

---

## 🤖 DocSphere AI Consultant Agent (Groq LPU Powered)

Built with high-speed Groq LPU inference (`qwen/qwen3.8-27b` / `openai/gpt-oss-20b`) and a resilient clinical rule engine fallback:

- **Floating Patient Assistant**: A compact pill widget (`DocSphere AI: Triage, Planning & Booking`) with active pulse indicators accessible across all devices.
- **3-in-1 Patient Capabilities**:
  1. **Clinical Triage & Specialist Recommendation**: Evaluates patient symptoms and directs them to the correct medical specialty (e.g., toothache ➔ Endodontics, skin lesions ➔ Dermatology, child fever ➔ Pediatrics).
  2. **Visit Care Planning**: Explains what to expect, pre-visit checklist advice, and highlights transparent ₹0-markup fees (₹400–₹600).
  3. **Direct 1-Click Interactive Booking**: Automatically outputs embedded **Doctor Action Cards** in the conversation with doctor qualifications, clinic address, direct consultation fee, and instant 1-click booking link (`/book?doctor=<slug>`).

---

## 🛡️ Superadmin Access Control

- **Superadmin URL**: `/superadmin` (e.g. `https://medic-sept-2026.vercel.app/superadmin`)
- **Direct Password Verification**: Direct master password authentication without unnecessary third-party OAuth/Gmail friction.
- **Master Admin Capabilities**:
  - Global clinic and doctor verification approvals.
  - System-wide inquiries, patient telemetry, and platform analytics.
  - Multi-clinic management and database health monitoring.

---

## 🏗️ 2-Tier Serverless Architecture

ClinicOS runs strictly on a high-speed, 2-tier serverless stack eliminating intermediate API servers and cold starts:

```
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE / SERVERLESS                  │
│                                                              │
│   Next.js 15.1.12 App Router (apps/web)                      │
│   ├── DocSphere Patient Discovery & Booking Portal           │
│   ├── DocSphere AI Consultant Agent (/api/ai/consultant)     │
│   ├── Superadmin Master Console (/superadmin)                │
│   ├── Clinical Workspaces & Doctor Studio UI                 │
│   ├── 45+ Serverless API Routes (/api/*)                     │
│   └── Web Serial Hardware Port Listeners (RS-232 / USB)      │
└──────────────────────────────┬───────────────────────────────┘
                               │ Direct pooled TCP (sub-15ms)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRESQL (AWS ap-south-1)        │
│                                                              │
│   aws-1-ap-south-1.pooler.supabase.com:5432/postgres         │
│   ├── Prescriptions, Patients, Appointments, Vitals          │
│   ├── Inpatient Beds, Wards & Acute Daycare                  │
│   ├── Diagnostic Lab Orders & Pathology Results              │
│   ├── Physical Therapy Plans & Session Logs                  │
│   ├── TPA Cashless Insurance Claims                          │
│   └── Pharmacy Batches & Financial EOD Records               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Complete Clinical Suites in ClinicOS

ClinicOS incorporates battle-tested clinical workflows into a sub-50ms reactive web platform:

### 1. ⚡ Doctor Consultation Studio
*Location:* `apps/web/src/app/dashboard/consult/[id]/page.tsx`
- **Clinical Encounter**: Chronological past visit history, chief complaints, and differential diagnosis.
- **Vital Signs Safety Radar**: AHA/ACC BP staging alerts, SpO2 Hypoxia warnings (<94% alert, <90% critical), and WHO auto-calculating BMI.
- **NMC Generic Standard Prescriptions**: Upper-case generic formulations, standard Indian frequencies (`1-0-1`, `1-0-0`, `0-0-1`, `SOS`), duration in days, and meal timing (`Before/After Food`).
- **Drug Safety Radar**: Real-time Drug-Drug Interaction (DDI) & patient allergy conflict checking.
- **Jan Aushadhi (PMBJP) Cost Savings**: Calculates patient savings (60–80%) when prescribing generic alternatives.
- **Bilingual Hindi Directions**: Automatically translates frequencies and food timings into legible Hindi (*सुबह और रात को भोजन के बाद ५ दिनों के लिए*).
- **AI Clinical Voice & Text Scribe**: Converts doctor's verbal or shorthand clinical dictation into structured fields.
- **Cryptographic SHA-256 Digital Seal & QR**: Tamper-proof digital seal with scannable QR resolving to verified patient portal `/p/[id]`.

### 2. 🛏️ Inpatient Wards & Acute Bed Management
*Location:* `apps/web/src/app/dashboard/beds/page.tsx`
- **Direct Consult Bed Admission**: Doctors can admit acute emergency/observation patients to a bed with 1 click directly inside the consult studio (`/api/beds/admit`).
- **Ward Management**: Real-time status across 4 ward types (`general`, `private_deluxe`, `daycare_recovery`, `icu`).
- **Stay Billing**: Hourly and daily bed fee accrual calculated automatically upon discharge (`/api/beds/discharge`).

### 3. 🔬 Diagnostic Pathology & LIS Studio
*Location:* `apps/web/src/app/dashboard/lab/page.tsx`
- **Phlebotomy Sample Collection**: Nurses and lab technicians record barcode accession numbers, phlebotomist name, and specimen types.
- **Interactive Parameter Worksheet**: Pre-configured templates for common investigations (CBC, LFT, KFT, HbA1c, Lipid, Thyroid) with automatic normal/abnormal evaluation against biological reference intervals (`Normal`, `High ▲`, `Low ▼`, `Critical !`).
- **LIS Machine Serial Cable Parsers (ASTM / HL7)**: Built-in protocol parser (`apps/web/src/lib/lis-parser.ts`) with Web Serial API support (`navigator.serial`) to listen live over RS-232 / USB ports from benchtop analyzers (Sysmex, Mindray, Horiba, Roche) with auto-mapping.
- **Pathologist Verification & Printable Lab Reports**: Formal clinical lab reports with NABL partner header and pathologist digital sign-off.

### 4. 🏃 Physiotherapy & Rehabilitation Studio
*Location:* `apps/web/src/app/dashboard/rehab/page.tsx`
- **Rehab Course Tracker**: Target sessions, completed sessions, and rehabilitation progress bars.
- **Visual VAS Pain Scale**: Tracks pre-session vs. post-session pain scores (1–10) with average reduction metrics.
- **Clinical Exercise Logger**: Log sets and reps for clinical exercises (Codman Pendulum, SLR, McKenzie extensions, Rotator Cuff strengthening, TENS/Ultrasound).
- **Printable Home Exercise Handout**: Branded take-home prescription detailing home exercises with dosage and clinical precautions.

### 5. 🛡️ TPA & Cashless Insurance Desk
*Location:* `apps/web/src/app/dashboard/insurance/page.tsx`
- **Pre-Authorization Pipeline**: Cashless claim submission for admitted inpatient bed cases.
- **Payor & TPA Support**: Pre-configured for Star Health, HDFC ERGO, ICICI Lombard, Care Health, Niva Bupa, Bajaj Allianz, and Medi Assist.
- **Claim Lifecycle**: Track claims from `Pre-Auth Submitted` ➔ `Query Raised` ➔ `Cashless Approved` ➔ `Final Settled`.

### 6. 🇮🇳 Ayushman Bharat Digital Mission (ABDM)
*Location:* `apps/web/src/app/dashboard/abdm/page.tsx`
- **14-Digit ABHA Generation**: Generates compliant Ayushman Bharat Health Account IDs (`XX-XXXX-XXXX-XXXX`) via Aadhaar last-4 e-KYC.
- **ABHA Address Generator**: Creates official `@abdm` digital handles.
- **Official ABHA Smart Card Preview**: Government-styled Ayushman Bharat card with scannable QR and print-ready layout.
- **FHIR R4 Bundle Gateway**: Emits compliant FHIR R4 Bundles (`/api/abdm/fhir/[id]`) with `Composition`, `Patient`, `Practitioner`, and `Condition`.

### 7. 💵 Day-Closing EOD Cockpit & Doctor Splits
*Location:* `apps/web/src/app/dashboard/finance/page.tsx`
- **Cash Drawer Reconciliation**: Soundbox UPI vs Drawer Cash vs Petty Outflows with denomination lock safeguards.
- **Visiting Doctor Splits**: Multi-doctor revenue sharing settlement (e.g. 80/20, 75/25, 70/30) with payout vouchers.
- **Digital Audit Lock & WhatsApp Dispatch**: Tamper-proof EOD closing lock with automated summary dispatch.

### 8. 🎫 Multi-Chamber Outpatient Queue & Front Desk
*Location:* `apps/web/src/app/dashboard/chambers/page.tsx` and `apps/web/src/app/clinic/desk/page.tsx`
- **Live OPD Flow & Chamber Board**: 10/10 operational density with plain language, real-time wait times, and standardized NMC registration credentials.
- **Receptionist Action Controls**: Fast `Next Token`, `Recall`, `Mark No-Show`, and `Emergency Override` buttons within arm's reach.
- **9:29 AM Morning Empty-State**: Friendly zero-state prompt before the first walk-in arrives.
- **Waiting Room Smart TV Display** (`/waiting-room`): Fullscreen queue monitor with Web Audio acoustic bell chimes and live token updates.
- **Front Desk Acrylic Standee Studio** (`/dashboard/standee`): Printable front desk standees with scannable QR for token check-in.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 24)
- Supabase PostgreSQL instance (AWS ap-south-1)
- Optional: Groq Cloud API Key for AI Consultant Agent

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/uniyalmanas/clinicos.git
   cd clinicos
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `apps/web/.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
   JWT_SECRET_KEY="<your-secret-key>"
   GROQ_API_KEY="<your-groq-api-key>"
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Build for production (verified across all 94 routes):
   ```bash
   npm run build
   ```

---

## 🔒 Security & Medical Standards Compliance
- **NMC (National Medical Commission)**: Upper-case generic drug prescribing guidelines and registered doctor credentials.
- **ABDM (Ayushman Bharat Digital Mission)**: FHIR R4 document standard for health record exchange.
- **IRDAI**: Cashless hospitalization pre-authorization format.
- **Digital Signatures**: SHA-256 cryptographic verification seal on all clinical records.
- **DPDP Act Compliant**: Direct confidential doctor-patient relationships without third-party phone number marketing.

---

**Developed for Indian Doctors, Clinics, and Patients.**
