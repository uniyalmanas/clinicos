-- ============================================================================
-- CLINICOS / DOCSPHERE: MASTER CANONICAL PRODUCTION DATABASE SCHEMA
-- Target: PostgreSQL 15+ (Supabase / Neon DB / AWS RDS)
-- Architecture Hierarchy:
--   CLINIC (TENANT ROOT)
--     ├── (USER_ACCOUNTS, CLINIC_MEMBERSHIPS, DOCTORS, STAFF)
--     └── PATIENTS
--           ├── APPOINTMENTS & TOKENS (QUEUE)
--           ├── VISITS & EMR CLINICAL NOTES
--           ├── PATIENT_DOCUMENTS (VAULT / PRIVATE STORAGE)
--           ├── PRESCRIPTIONS & MEDICATIONS
--           ├── PHARMACY ITEMS & DISPENSING
--           └── PAYMENTS & BILLING
--                 └── FINANCE & LEDGERS (EXPENSES, SHIFTS, CLOSINGS, SETTLEMENTS)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CLINICS (TENANT ENTITY ROOT)
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT,
    about TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    email TEXT,
    reg_number TEXT,
    gstin TEXT,
    abdm_facility_id TEXT,
    nabl_cert_no TEXT,
    upi_vpa TEXT,
    address_line TEXT,
    city TEXT NOT NULL DEFAULT 'Dehradun',
    state TEXT NOT NULL DEFAULT 'Uttarakhand',
    postal_code TEXT DEFAULT '248001',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    facilities JSONB NOT NULL DEFAULT '["Full AC", "Waiting Lounge", "WiFi", "Wheelchair Accessible", "Digital Prescriptions"]'::jsonb,
    opening_hours JSONB NOT NULL DEFAULT '{"Monday - Saturday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM", "Sunday": "Closed"}'::jsonb,
    consultation_fee NUMERIC(10,2) DEFAULT 600.00,
    followup_fee NUMERIC(10,2) DEFAULT 300.00,
    followup_validity_days INTEGER DEFAULT 7,
    doctor_split_percentage NUMERIC(5,2) DEFAULT 80.00,
    subscription_plan TEXT DEFAULT 'growth',
    subscription_status TEXT DEFAULT 'active',
    status TEXT NOT NULL DEFAULT 'active',
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city);

-- 2. USER ACCOUNTS & CLINIC MEMBERSHIPS (AUTHENTICATION & RBAC)
CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'clinic_admin', 'staff', 'receptionist', 'owner', 'superadmin')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON user_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON user_accounts(email);

CREATE TABLE IF NOT EXISTS clinic_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'clinic_admin', 'doctor', 'staff', 'receptionist')),
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_clinic ON clinic_memberships(clinic_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON clinic_memberships(user_id);

-- 3. DOCTORS (CLINICAL PRACTITIONERS)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    title TEXT DEFAULT 'Dr.',
    specialization TEXT NOT NULL,
    qualification_summary TEXT,
    medical_council_reg_number TEXT,
    medical_council_state TEXT DEFAULT 'Uttarakhand Medical Council',
    years_of_experience INTEGER NOT NULL DEFAULT 5,
    languages_spoken JSONB NOT NULL DEFAULT '["English", "Hindi"]'::jsonb,
    bio TEXT,
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 600.00,
    followup_fee NUMERIC(10,2) NOT NULL DEFAULT 300.00,
    followup_validity_days INTEGER NOT NULL DEFAULT 7,
    doctor_split_percentage NUMERIC(5,2) DEFAULT 80.00,
    chamber_name TEXT DEFAULT 'Chamber 1 - OPD Main',
    services_offered JSONB NOT NULL DEFAULT '["General Consultation"]'::jsonb,
    verification_status TEXT NOT NULL DEFAULT 'verified',
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    clinic_name TEXT,
    clinic_slug TEXT DEFAULT 'derma-care-dehradun',
    clinic_address TEXT,
    opd_timings TEXT DEFAULT '10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM',
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    final_settlement_id TEXT,
    final_payout_amount NUMERIC(10,2),
    final_settlement_status TEXT DEFAULT 'NONE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON doctors(slug);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);

-- 4. PATIENTS (MASTER PATIENT REGISTRY)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uhid TEXT UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    dob DATE,
    gender TEXT,
    blood_group TEXT,
    allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
    chronic_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    city TEXT DEFAULT 'Dehradun',
    primary_clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    user_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(primary_clinic_id);

-- 5. EFFECTIVE-DATED TARIFF VERSIONS
CREATE TABLE IF NOT EXISTS clinic_tariff_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL,
    effective_from TIMESTAMPTZ NOT NULL,
    consultation_fee NUMERIC(10,2) NOT NULL,
    followup_fee NUMERIC(10,2) NOT NULL,
    followup_validity_days INTEGER NOT NULL DEFAULT 7,
    doctor_split_percentage NUMERIC(5,2) NOT NULL DEFAULT 80.00,
    authorized_by TEXT NOT NULL,
    change_reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinic_tariffs ON clinic_tariff_versions(clinic_slug, effective_from);

-- 6. CLINIC SHIFT GUARDRAILS & CHAMBERS
CREATE TABLE IF NOT EXISTS clinic_shift_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL,
    chamber_name TEXT NOT NULL,
    doctor_slug TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    shift_name TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    token_cutoff_minutes INTEGER DEFAULT 30,
    token_capacity INTEGER DEFAULT 25,
    grace_period_mins INTEGER DEFAULT 15,
    auto_cancel_unseen BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shift_guardrails ON clinic_shift_guardrails(clinic_slug, chamber_name);

-- 7. APPOINTMENTS & LIVE OPD QUEUE TOKENS
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number TEXT UNIQUE NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    doctor_slug TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_gender TEXT DEFAULT 'Male',
    patient_age INTEGER DEFAULT 30,
    appointment_date DATE NOT NULL,
    time_slot TEXT NOT NULL,
    token_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting', -- waiting, calling, completed, cancelled, no-show
    fee_amount NUMERIC(10,2) NOT NULL DEFAULT 600.00,
    payment_status TEXT NOT NULL DEFAULT 'paid', -- paid, pending, refunded
    payment_mode TEXT NOT NULL DEFAULT 'cash', -- cash, online_upi, counter_soundbox
    symptoms_description TEXT,
    prescription_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_token ON appointments(appointment_date, doctor_slug, token_number);

-- 8. PRESCRIPTIONS (CLINICAL ENCOUNTERS)
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number TEXT UNIQUE NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    appointment_number TEXT REFERENCES appointments(appointment_number) ON DELETE SET NULL,
    patient_phone TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_gender TEXT,
    patient_age INTEGER,
    doctor_slug TEXT,
    doctor_name TEXT NOT NULL,
    doctor_reg_number TEXT,
    clinic_name TEXT NOT NULL,
    clinic_address TEXT,
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    provisional_diagnosis TEXT,
    diagnosis_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Standardized medications array
    lab_tests JSONB NOT NULL DEFAULT '[]'::jsonb,
    procedures JSONB NOT NULL DEFAULT '[]'::jsonb,
    diet_advice TEXT,
    clinical_notes TEXT,
    instructions TEXT,
    followup_date DATE,
    digital_signature_hash TEXT, -- Prescription Integrity Hash (SHA-256)
    qr_verification_code TEXT,
    signed_by TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    dispensed_status TEXT DEFAULT 'pending', -- pending, dispensed, partial
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic ON prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_phone ON prescriptions(patient_phone);
CREATE INDEX IF NOT EXISTS idx_prescriptions_rxnum ON prescriptions(prescription_number);

-- 9. IN-HOUSE PHARMACY INVENTORY & DISPENSING
CREATE TABLE IF NOT EXISTS pharmacy_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    dosage_form TEXT NOT NULL DEFAULT 'Tablet', -- Tablet, Syrup, Ointment, Injection
    strength TEXT NOT NULL DEFAULT '500mg',
    manufacturer TEXT,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 20,
    mrp_inr NUMERIC(10,2) NOT NULL,
    purchase_price_inr NUMERIC(10,2) NOT NULL,
    schedule_type TEXT DEFAULT 'NON_SCHEDULE', -- SCHEDULE_H, SCHEDULE_H1, NARCOTIC
    rack_location TEXT DEFAULT 'Shelf A-1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pharmacy_items_clinic ON pharmacy_items(clinic_id);

CREATE TABLE IF NOT EXISTS pharmacy_dispenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    bill_number TEXT UNIQUE NOT NULL,
    prescription_number TEXT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    doctor_name TEXT,
    total_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    net_paid NUMERIC(10,2) NOT NULL,
    payment_mode TEXT DEFAULT 'cash',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    dispensed_by TEXT DEFAULT 'Chief Pharmacist',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. PATIENT VAULT DOCUMENTS (PRIVATE MEDICAL STORAGE)
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_phone TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_kb INTEGER DEFAULT 350,
    file_url TEXT,
    storage_path TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    doctor_notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patient_documents_clinic ON patient_documents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_phone ON patient_documents(patient_phone);

-- 11. FINANCE & CASH DRAWER GOVERNANCE
CREATE TABLE IF NOT EXISTS clinic_shift_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL DEFAULT 'derma-care-dehradun',
    shift_name TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    doctor_name TEXT,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening_float NUMERIC(10,2) DEFAULT 2000.00,
    expected_cash NUMERIC(10,2) NOT NULL,
    counted_cash NUMERIC(10,2) NOT NULL,
    variance NUMERIC(10,2) NOT NULL,
    variance_percentage NUMERIC(5,2) DEFAULT 0,
    variance_status TEXT DEFAULT 'BALANCED',
    is_pos_locked BOOLEAN DEFAULT false,
    manager_override_by TEXT,
    manager_override_pin TEXT,
    notes TEXT,
    handover_status TEXT DEFAULT 'RECONCILED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shift_handovers_clinic ON clinic_shift_handovers(clinic_slug, shift_date);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL DEFAULT 'derma-care-dehradun',
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Rent, Utilities, Consumables, Salaries, Petty Cash
    amount NUMERIC(10,2) NOT NULL,
    payment_mode TEXT DEFAULT 'cash',
    receipt_number TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by TEXT DEFAULT 'Front Desk Lead',
    approved_by TEXT,
    approval_status TEXT DEFAULT 'APPROVED',
    requires_approval BOOLEAN DEFAULT false,
    manager_pin_verified BOOLEAN DEFAULT true,
    ocr_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_clinic ON expenses(clinic_slug, date);

CREATE TABLE IF NOT EXISTS clinic_eod_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL,
    closing_date DATE NOT NULL,
    closing_time TIMESTAMPTZ DEFAULT NOW(),
    closed_by TEXT NOT NULL,
    total_appointments INTEGER DEFAULT 0,
    total_gross_revenue NUMERIC(10,2) DEFAULT 0,
    cash_revenue NUMERIC(10,2) DEFAULT 0,
    upi_revenue NUMERIC(10,2) DEFAULT 0,
    total_expenses NUMERIC(10,2) DEFAULT 0,
    net_operating_profit NUMERIC(10,2) DEFAULT 0,
    actual_cash_deposited NUMERIC(10,2) DEFAULT 0,
    cash_variance NUMERIC(10,2) DEFAULT 0,
    audit_hash TEXT NOT NULL,
    status TEXT DEFAULT 'LOCKED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_slug, closing_date)
);

CREATE TABLE IF NOT EXISTS clinic_doctor_payout_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    clinic_slug TEXT NOT NULL,
    doctor_slug TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    dispute_date DATE NOT NULL DEFAULT CURRENT_DATE,
    gross_amount NUMERIC(10,2) NOT NULL,
    agreed_split_pct NUMERIC(5,2) NOT NULL,
    escrow_amount NUMERIC(10,2) NOT NULL,
    dispute_reason TEXT NOT NULL,
    status TEXT DEFAULT 'DISPUTED_ESCROW', -- DISPUTED_ESCROW, RESOLVED_RELEASED, RESOLVED_ADJUSTED
    resolved_by TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. REVIEWS & PATIENT FEEDBACK
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_slug TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    waiting_time_rating NUMERIC(3,2) DEFAULT 5.0,
    bedside_manner_rating NUMERIC(3,2) DEFAULT 5.0,
    comment TEXT,
    doctor_reply TEXT,
    verified_patient BOOLEAN DEFAULT true,
    is_verified_visit BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_doctor ON reviews(doctor_slug);
