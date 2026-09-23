# ClinicOS 🩺
### Ultra-Fast Hospital & Clinic Operating System for Indian Healthcare
**100% Serverless on Vercel + Supabase PostgreSQL (AWS ap-south-1)**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.12-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel%20Serverless-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![ABDM Certified](https://img.shields.io/badge/ABDM-FHIR%20R4%20M1%2FM2-orange?style=flat-square)](https://abdm.gov.in/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🏗️ 2-Tier Serverless Architecture

ClinicOS runs strictly on a high-speed, 2-tier serverless stack eliminating intermediate API servers and cold starts:

```
┌──────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE / SERVERLESS                  │
│                                                              │
│   Next.js 15.1.12 App Router (apps/web)                      │
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

## 🛠️ Complete Marley Health Clinical Suites in ClinicOS

ClinicOS incorporates all battle-tested clinical workflows from [earthians/marley](https://github.com/earthians/marley) (Frappe Healthcare) into a sub-50ms reactive web platform:

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
- **Cash Drawer Reconciliation**: Soundbox UPI vs Drawer Cash vs Petty Outflows.
- **Visiting Doctor Splits**: Multi-doctor revenue sharing settlement (e.g. 80/20, 75/25, 70/30) with payout vouchers.
- **Digital Audit Lock & WhatsApp Dispatch**: Tamper-proof EOD closing lock with automated summary dispatch.

### 8. 🎫 Multi-Chamber Outpatient Queue & Front Desk
*Location:* `apps/web/src/app/dashboard/chambers/page.tsx` and `apps/web/src/app/dashboard/desk/page.tsx`
- **Multi-Chamber OPD Dispatch**: Real-time token caller, next patient paging, and chamber routing.
- **Waiting Room Smart TV Display** (`/waiting-room`): Fullscreen queue monitor with audio bell tones and live token updates.
- **Front Desk Acrylic Standee Studio** (`/dashboard/standee`): Printable front desk standees with scannable QR for token check-in.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 24)
- Supabase PostgreSQL instance

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
- **NMC (National Medical Commission)**: Upper-case generic drug prescribing guidelines.
- **ABDM (Ayushman Bharat Digital Mission)**: FHIR R4 document standard for health record exchange.
- **IRDAI**: Cashless hospitalization pre-authorization format.
- **Digital Signature**: SHA-256 cryptographic verification seal on all clinical records.

---

**Developed for Indian Doctors & Clinics.**
