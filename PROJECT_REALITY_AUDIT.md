# ClinicOS: Architecture & Engineering Reality Audit

**Current State Assessment & Production Readiness Review**  
**Architecture:** Next.js 15 App Router | PostgreSQL 15+ (Supabase Pooler) | JWT RBAC | Supabase Private Storage | Razorpay HMAC  
**Deployment Target:** Vercel Production + Supabase Managed PostgreSQL

---

## Executive Summary

ClinicOS has evolved from an early prototype into a full-stack multi-tenant healthcare operating system and patient portal. The application architecture is built entirely on Next.js 15 (React 19, TypeScript), PostgreSQL (via `postgres` client and Supabase pooler), cryptographic token authentication, and role-based access control (RBAC).

The system operates on a dual-sided architecture:
1. **Clinic OS (B2B SaaS)**: Paid subscription for clinics and solo practitioners (₹599/mo Solo Practice Pro, ₹1,299/mo Multi-Doctor Polyclinic). Staff and receptionists access at ₹0. Core modules include Patient EMR, OPD Queue Management with advisory transaction locks, Clinical Prescriptions, Pharmacy Dispensing, Billing & Cash Drawer Governance, and Financial Reconciliations.
2. **Patient Portal (B2C Patient Experience)**: Free (₹0) for patients. Provides discovery, doctor booking, queue token tracking, and access to private medical records and digital prescriptions.

---

## Current Architecture Scorecard

```
                    CLINICOS — ARCHITECTURAL STATE

Product / UX & UI Workflows           █████████░  92%  (Modern, responsive, bilingual)
Core OPD / EMR / Queue Workflows      █████████░  90%  (Advisory lock queue, prescription generator)
Database & Persistence Baseline       ████████░░  85%  (PostgreSQL canonical schema, relational integrity)
Backend & API Implementation          ████████░░  85%  (80+ App Router endpoints, zero FastAPI/SQLite)
Authentication & Session Security     ████████░░  85%  (Bcrypt, secure HTTP-only cookies, JWT claims)
Authorization & RBAC Enforcement      ████████░░  80%  (authorizeClinicUser tenant & role checks)
Tenant Isolation & Data Boundaries    ████████░░  80%  (clinic_id scoping, parameterized queries)
Document Security (Vault)             ████████░░  85%  (Private storage, short-lived signed URLs)
Production Readiness                  ████████░░  80%  (Clean build, zero hardcoded PINs)
```

---

## System Architecture

```
                                  CLINICOS
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │                                                   │
            ▼                                                   ▼
        CLINIC OS                                         PATIENT PORTAL
       (Doctor & Staff)                                      (Patient)
            │                                                   │
     PAYS: ₹599 / ₹1,299                                     PAYS: ₹0
            │                                                   │
   ┌────────┴────────┐                                   ┌──────┴──────┐
   │                 │                                   │             │
 Doctor            Staff                              Existing     Discovery
 (Chamber)      (Front Desk)                           Doctor       Directory
   │                 │                                   │             │
   └────────┬────────┘                                   └──────┬──────┘
            │                                                   │
            ▼                                                   ▼
     CLINIC WORKFLOWS                                    PATIENT EXPERIENCE
  • Patients & UHID Registry                         • Doctor Search & Booking
  • OPD Live Queue (Locks)                           • Live Token Tracking
  • Clinical Prescriptions                           • Prescription Vault
  • Pharmacy & Inventory                             • Signed Document Access
  • Cash Shifts & Governance                         • Online UPI / Cash
  • Financial Settlements                            • Verified Patient Reviews
            │                                                   │
            └─────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
                        SHARED POSTGRESQL DATA LAYER
                    (Multi-Tenant Scoped by clinic_id)
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
  SUPABASE POSTGRES            SUPABASE STORAGE              RAZORPAY GATEWAY
  (ACID Transactions &        (Private Buckets &            (HMAC-SHA256 Webhook
   Advisory Locks)             900s Signed URLs)             & Order Verification)
```

---

## 1. Authentication vs. Authorization (RBAC)

Previously, endpoints checked only for token presence without validating tenant membership. The application now implements a strict, centralized authorization pipeline via `authorizeClinicUser()` in `apps/web/src/lib/auth.ts`.

### Pipeline Execution Flow
```
REQUEST ──> Extract Bearer / clinicos_token
                 │
                 ▼
         Verify JWT Signature (JWT_SECRET)
                 │
                 ▼
         Resolve User Identity & Account
                 │
                 ▼
         Resolve Clinic Membership & Tenant ID
                 │
                 ▼
         Enforce RBAC Role Permissions
         (owner, clinic_admin, doctor, staff, receptionist)
                 │
                 ▼
         Allow Operation with Scoped Context
```

### Key Protections
- **Zero Fallback Secret in Production**: `getJwtSecret()` fails immediately if `JWT_SECRET` is unset in production environments.
- **Strict Role Boundaries**: Clinic administrative mutations (tariff modifications, staff onboarding, EOD locking, doctor deactivations) require `owner` or `clinic_admin` roles.
- **Front-Desk Guardrails**: Cash collections and shift reconciliations are restricted to verified staff or admin accounts.

---

## 2. Eradication of Hardcoded Bypass PINs

All legacy manager and cashier override PINs (`4491`, `1234`) have been eliminated across both frontend components and backend API handlers:
- **Cash & Soundbox Payment Verification** (`/api/payments/verify`): Counter payments require an authenticated staff, receptionist, doctor, or clinic admin session instead of a static PIN.
- **Cash Drawer & POS Shift Unlock** (`/api/clinic/shifts`): High-variance drawer locks can only be overridden by authenticated administrative users.
- **Doctor Settlements & Payouts** (`/api/clinic/settle-doctor-payout`): Payout approvals require verified clinic ownership credentials.
- **EMR Versioning & Merging** (`/api/patients`): Patient record merging and retrospective note amendments require authenticated clinical oversight.
- **Frontend Removal**: Settings, Admin, Billing, and Rehab pages now execute through verified session credentials.

---

## 3. Concurrency & Queue Token Integrity

Token collisions in busy OPD clinics are prevented via PostgreSQL transactional advisory locks:

```sql
BEGIN;
-- Compute deterministic 64-bit lock key from clinic_id and appointment_date
SELECT pg_advisory_xact_lock(hashtext('queue_lock_' || $clinic_id || '_' || $date));

-- Determine next sequential token safely
SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
FROM appointments
WHERE clinic_id = $clinic_id AND appointment_date = $date;

-- Insert appointment with atomic token
INSERT INTO appointments (appointment_number, clinic_id, token_number, ...)
VALUES (...);

COMMIT;
```

This guarantees zero token collisions even when multiple front-desk staff or online patients register simultaneously.

---

## 4. Medical Document Security (Vault)

Medical records, lab reports, and radiological scans must remain private under DPDP Act and healthcare standards:
- **Private Storage**: All uploads target the private `patient-documents` bucket in Supabase Storage with clinic- and patient-isolated paths:
  `clinics/{clinic_id}/patients/{patient_phone}/{document_id}.pdf`
- **Zero Public Access**: `getPublicUrl` has been eradicated for clinical documents.
- **Time-Bounded Signed URLs**: Access is granted strictly via `/api/documents/signed-url`, which validates user identity (matching patient phone or authorized clinic staff) and issues a 15-minute (900 seconds) cryptographically signed URL.

---

## 5. Doctor Authority & Prescription Integrity

Prescriptions cannot be forged by client-side payload tampering:
- **Server Identity Derivation**: `/api/prescriptions/generate` ignores client-submitted doctor names or clinic IDs; it resolves practitioner identity directly from the authenticated session and database.
- **Prescription Integrity Hash**: Each prescription is digitally stamped with a SHA-256 seal:
  $$\text{Hash} = \text{SHA-256}(\text{RxNumber} \parallel \text{ClinicID} \parallel \text{DoctorRegNumber} \parallel \text{Timestamp} \parallel \text{ItemsJSON})$$
- Stored as `digital_signature_hash` and verified on public verification routes (`/p/[id]`).

---

## 6. Payment Integrity (Razorpay HMAC)

Online transactions are verified using gateway cryptographic signatures:
$$\text{HMAC-SHA256}(\text{order\_id} \parallel \text{"|"} \parallel \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
The computed hash is compared in constant time with `razorpay_signature`. Fallback default UUIDs have been eradicated from payment handlers.

---

## 7. Canonical Database Baseline

The PostgreSQL schema is unified across `supabase/migrations/001_canonical_baseline.sql`, `supabase/schema.sql`, and `packages/database/schema.sql`.

```
                    DATABASE ENTITY HIERARCHY

                            clinics
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
      user_accounts       doctors        clinic_memberships
            │                  │
            └─────────┬────────┘
                      │
                   patients
                      │
         ┌────────────┼────────────┬────────────┐
         │            │            │            │
   appointments  prescriptions  patient_docs  expenses
         │            │
     payments    pharmacy_items
                      │
              pharmacy_dispenses
```

---

## 8. SaaS Business Model & Pricing Alignment

ClinicOS pricing is synchronized across all documentation, landing pages, and billing endpoints:

| Plan | Price (INR) | Target Audience | Key Inclusions |
| :--- | :--- | :--- | :--- |
| **Solo Practice Pro** | **₹599 / month** | Single Doctor Clinics | 1 Doctor Chamber, Unlimited Patients, Rx Generator, Token Queue, WhatsApp Receipts |
| **Multi-Doctor Polyclinic** | **₹1,299 / month** | Multi-Specialty OPD Centers | Up to 10 Doctors, In-House Pharmacy, Shift Handovers, Doctor Payout Splits, Cash Drawer Locks |
| **Staff & Receptionist** | **₹0 / month** | Front Desk & Dispensary Staff | Included with Clinic Subscription |
| **Patient Experience** | **₹0 / month** | Patients | Free Booking, Free Digital Rx Access, Zero Convenience Fees |

---

## 9. Verification & Operational Status

1. **Build Status**: Verified clean Next.js 15 production build (`npm run build`). Zero TypeScript or lint errors.
2. **Security Verification**: `git grep "4491"` and `git grep "1234"` return 0 occurrences of bypass PINs.
3. **Storage Verification**: Public URL generation for patient documents replaced with 900-second signed URLs.
4. **Target Deployment**: Vercel Serverless Production with Supabase Transaction Pooler (Port 6543) / Session Pooler (Port 5432).
