# DocSphere / ClinicOS 🩺

> **Digital Operating Infrastructure & Healthcare ERP for Independent Doctors, Clinics & Pharmacies**  
> *"Shopify for Independent Healthcare"* — Giving every healthcare practitioner a verified digital presence, live counter token management, clinical consultation suite, and NMC-compliant digital prescription engine.

---

## 🏥 Overview

In India, healthcare software is broken into two extremes:
1. **Aggregators (e.g. Practo, Lybrate):** They pit doctors against each other, display competitor ads on doctors' profiles, hijack search traffic, and charge high lead commissions.
2. **Enterprise Hospital ERPs:** Complex desktop software designed for 500-bed hospital chains that require weeks of training and expensive licensing.

**DocSphere / ClinicOS** is the digital operating layer for independent healthcare providers. Doctors own 100% of their patient relationships, retain all consultation fees directly via UPI or cash, and manage daily operations without needing technical expertise.

---

## ✨ Key Capabilities & Modules

### 1. 🩺 Doctor Clinical Chamber Studio
- **Consultation Workspace:** Record clinical vitals (BP, Pulse, Temperature, SpO2, Blood Sugar, Weight), chief complaints, and provisional diagnosis.
- **NMC-Compliant Prescription Generator:** Pre-loaded with Indian pharmacopeia, enforcing UPPERCASE generic salt names (e.g., `DOXYCYCLINE HYCLATE`), dosage forms, frequencies, and durations.
- **Tamper-Proof Audit Trail:** Generates cryptographic SHA-256 digital signature hashes and QR verification codes for every prescription.
- **Integrated Patient Document Vault:** View past lab reports, blood tests, radiology scans, and prior prescriptions in one click.

### 2. 🏢 Clinic Front Desk Reception Console
- **Live Counter Token Desk:** Walk-in patient registration and token queue management.
- **Acoustic Token Call Chime:** Dual-sine wave browser audio chime (587.33 Hz / 880 Hz) for waiting room callouts without external hardware.
- **Cash & UPI Reconciliation:** Real-time reconciliation of cash vs. UPI fee collections.

### 3. 👥 Zero-App Patient Portal & Discovery
- **No App Download Required:** Patients view live counter positions, estimated wait times, and digital prescriptions on WhatsApp or web.
- **Interactive Local Discovery:** Canvas-based clinic mapping with distance, travel time, and queue status (piloted in Dehradun: Rajpur Rd, EC Rd, Chakrata Rd).
- **Self-Serve Records:** Passwordless mobile lookup for past visit timelines, medicine alarms, and 1-click pharmacy routing.

### 4. 🤖 60-Second AI Onboarding & Receptionist
- **Conversational AI Onboarding:** Powered by Gemini 2.0 Flash (with intelligent heuristic fallback) to parse doctor natural language bio or visiting cards into structured clinic profiles.
- **AI Clinic Receptionist Widget:** Embedded floating assistant answering patient questions on OPD timings, consultation fees, clinic directions, and token booking.

### 5. 💰 Daily Cash Flow & Expense Ledger
- **Financial Cockpit:** Track OPD collections against daily overheads (commercial electricity, disposable consumables, staff salaries, equipment maintenance).
- **Net Daily / Monthly Balance:** Instant financial pulse for independent practitioners.

### 6. 💊 Pharmacy & Diagnostic Dispensary
- **Partner Dispensary Queue:** Streamlined routing of digital prescriptions to local chemists (e.g., Apollo Pharmacy, Sanjeevani Medicos) and diagnostic labs.

---

## 🏗️ Monorepo Architecture

```
clinicos-monorepo/
├── apps/
│   ├── api/             # FastAPI (Python 3.12+) Async REST Gateway & AI Engine
│   └── web/             # Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
├── packages/
│   ├── database/        # Canonical SQL schema & seed datasets
│   └── types/           # Shared TypeScript domain definitions & interfaces
```

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Apple Human Interface Design principles
- **Backend:** FastAPI, Python 3.12+, Pydantic v2, Uvicorn
- **Database & ORM:** SQLite (`clinicos.db`) / PostgreSQL with SQLAlchemy
- **Security:** JWT authentication, bcrypt password hashing, SHA-256 tamper-proof prescription signatures

---

## 🚀 Getting Started

### Prerequisites
- **Node.js:** v18.18+ or v20+
- **Python:** 3.11+ or 3.12+

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/uniyalmanas/clinicos.git
cd clinicos

# Install web and workspace dependencies
npm install
```

### 2. Run Backend API
```bash
# Start the FastAPI engine (runs on http://localhost:8000)
npm run dev:api
```
Interactive API documentation will be available at:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

### 3. Run Frontend Web Application
```bash
# In a separate terminal, launch the Next.js dev server (runs on http://localhost:3000)
npm run dev:web
```

---

## 🔒 Healthcare Regulatory Compliance
- **NMC (National Medical Commission) Adherence:** Prominent display of State Medical Council Registration Numbers and mandatory generic chemical naming.
- **Data Isolation:** Clinic-level multi-tenant data boundaries.
- **ABDM (Ayushman Bharat Digital Mission) Ready:** Structured data schema prepared for ABHA ID linkage and M1/M2/M3 compliance.

---

## 📄 License
Private & Proprietary. All rights reserved.
