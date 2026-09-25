-- ============================================================================
-- CLINICOS / DOCSPHERE: MASTER CANONICAL PRODUCTION SCHEMA BASELINE
-- Target: PostgreSQL 15+ (Supabase / Neon DB)
-- Baseline version: 001_canonical_baseline.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CLINICS (TENANT ENTITY)
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

-- 2. DOCTORS (CLINICAL PRACTITIONERS)
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
    clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
    clinic_name TEXT,
    clinic_slug TEXT DEFAULT 'derma-care-dehradun',
    clinic_address TEXT,
    opd_timings TEXT DEFAULT '10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM',
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivation_reason TEXT,
    final_payout_amount NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctors_slug ON doctors(slug);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_slug);

-- 3. EFFECTIVE-DATED TARIFF VERSIONS
CREATE TABLE IF NOT EXISTS doctor_tariffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS idx_doctor_tariffs_slug ON doctor_tariffs(clinic_slug, effective_from);

-- 4. CLINIC SHIFT GUARDRAILS & CHAMBER ALLOCATIONS
CREATE TABLE IF NOT EXISTS clinic_shift_guardrails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 5. APPOINTMENTS & LIVE OPD TOKENS
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number TEXT UNIQUE NOT NULL,
    doctor_slug TEXT NOT NULL,
    clinic_id UUID DEFAULT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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
CREATE INDEX IF NOT EXISTS idx_appointments_date_doc ON appointments(appointment_date, doctor_slug);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(patient_phone);

-- 6. PRESCRIPTIONS & EMR CLINICAL VISITS
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number TEXT UNIQUE NOT NULL,
    appointment_number TEXT REFERENCES appointments(appointment_number) ON DELETE SET NULL,
    patient_phone TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_gender TEXT,
    patient_age INTEGER,
    doctor_slug TEXT,
    doctor_name TEXT NOT NULL,
    doctor_reg_number TEXT,
    clinic_id UUID DEFAULT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    clinic_name TEXT NOT NULL,
    clinic_address TEXT,
    vitals JSONB NOT NULL DEFAULT '{}'::jsonb,
    symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
    provisional_diagnosis TEXT,
    diagnosis_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of medication items
    lab_tests JSONB NOT NULL DEFAULT '[]'::jsonb,
    dietary_advice TEXT,
    instructions TEXT,
    followup_date DATE,
    signed_by TEXT,
    signed_at TIMESTAMPTZ DEFAULT NOW(),
    dispensed_status TEXT DEFAULT 'pending', -- pending, dispensed, partial
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prescriptions_phone ON prescriptions(patient_phone);
CREATE INDEX IF NOT EXISTS idx_prescriptions_rxnum ON prescriptions(prescription_number);

-- 7. IN-HOUSE PHARMACY INVENTORY & DISPENSING
CREATE TABLE IF NOT EXISTS pharmacy_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID DEFAULT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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

CREATE TABLE IF NOT EXISTS pharmacy_dispenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 8. PATIENT VAULT DOCUMENTS (REPORTS & IMAGING)
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_phone TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    clinic_id UUID DEFAULT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size_kb INTEGER DEFAULT 350,
    file_url TEXT,
    doctor_notes TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patient_documents_phone ON patient_documents(patient_phone);

-- 9. DAY CLOSING, CASH DRAWER & SETTLEMENTS
CREATE TABLE IF NOT EXISTS clinic_shift_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_number TEXT NOT NULL UNIQUE,
    clinic_slug TEXT NOT NULL DEFAULT 'derma-care-dehradun',
    shift_name TEXT NOT NULL,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    staff_name TEXT NOT NULL,
    doctor_name TEXT,
    total_patients INTEGER DEFAULT 0,
    gross_collections NUMERIC(10,2) DEFAULT 0,
    upi_amount NUMERIC(10,2) DEFAULT 0,
    cash_expected NUMERIC(10,2) DEFAULT 0,
    petty_cash_expenses NUMERIC(10,2) DEFAULT 0,
    petty_cash_remarks TEXT,
    net_cash_expected NUMERIC(10,2) DEFAULT 0,
    actual_cash_counted NUMERIC(10,2) DEFAULT 0,
    discrepancy NUMERIC(10,2) DEFAULT 0,
    denominations JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT DEFAULT 'SETTLED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_slug TEXT NOT NULL DEFAULT 'derma-care-dehradun',
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Rent, Utilities, Consumables, Salaries, Petty Cash
    amount NUMERIC(10,2) NOT NULL,
    payment_mode TEXT DEFAULT 'cash',
    receipt_number TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    approval_status TEXT DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REVIEWS & PATIENT FEEDBACK
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_slug TEXT NOT NULL,
    clinic_id UUID DEFAULT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
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

-- 11. MARKETPLACE INQUIRIES & PARTNERS
CREATE TABLE IF NOT EXISTS marketplace_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL,
    item_name TEXT,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_address TEXT,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT DEFAULT 'Dehradun',
    specialization TEXT,
    doctor_count INTEGER DEFAULT 1,
    status TEXT DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
