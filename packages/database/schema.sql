-- ============================================================================
-- CLINICOS / DOCSPHERE: MASTER POSTGRESQL DDL SPECIFICATION
-- Target: PostgreSQL 16+ with extensions pgcrypto, uuid-ossp, vector
-- Standards: NMC Medical Practice Guidelines (2020), DPDP Act (2023/2024)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'clinic_admin', 'staff', 'admin', 'superadmin')),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    abha_number VARCHAR(14) UNIQUE,
    abha_address VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. CLINICS (TENANT ENTITY)
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    owner_user_id UUID NOT NULL REFERENCES users(id),
    tagline VARCHAR(255),
    about TEXT,
    phone VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    gstin VARCHAR(15),
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_maps_url TEXT,
    logo_url TEXT,
    cover_photo_url TEXT,
    facilities TEXT[] DEFAULT ARRAY['WiFi', 'AC', 'Wheelchair Accessible'],
    opening_hours JSONB NOT NULL DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_geo ON clinics(latitude, longitude);

-- 3. DOCTOR PROFILES
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(20) DEFAULT 'Dr.',
    full_name VARCHAR(150) NOT NULL,
    medical_council_reg_number VARCHAR(100) NOT NULL,
    medical_council_state VARCHAR(100) NOT NULL,
    qualification_summary VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    sub_specializations TEXT[],
    years_of_experience INT DEFAULT 0,
    languages_spoken TEXT[] DEFAULT ARRAY['English', 'Hindi'],
    bio TEXT,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    followup_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    followup_validity_days INT DEFAULT 7,
    services_offered JSONB DEFAULT '[]',
    verification_status VARCHAR(30) DEFAULT 'verified' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctor_specialization ON doctor_profiles(specialization);
CREATE INDEX IF NOT EXISTS idx_doctor_slug ON doctor_profiles(slug);

-- 4. CLINIC-DOCTOR ROSTER & SCHEDULES
CREATE TABLE IF NOT EXISTS clinic_doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    is_primary_owner BOOLEAN DEFAULT FALSE,
    consultation_fee_override NUMERIC(10, 2),
    opd_schedules JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(clinic_id, doctor_id)
);

-- 5. PATIENT PROFILES
CREATE TABLE IF NOT EXISTS patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    dob DATE,
    blood_group VARCHAR(10),
    allergies TEXT[],
    chronic_conditions TEXT[],
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. APPOINTMENTS & LIVE TOKENS
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50),
    token_number INT NOT NULL,
    consultation_type VARCHAR(20) DEFAULT 'in_person' CHECK (consultation_type IN ('in_person', 'video', 'emergency')),
    status VARCHAR(30) DEFAULT 'confirmed' CHECK (status IN ('requested', 'confirmed', 'in_waiting', 'in_consultation', 'completed', 'cancelled', 'no_show')),
    fee_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived')),
    payment_mode VARCHAR(30) CHECK (payment_mode IN ('cash', 'upi', 'online')),
    symptoms_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);

-- 7. CLINICAL CONSULTATIONS
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    vitals JSONB DEFAULT '{}',
    symptoms TEXT[],
    clinical_findings TEXT,
    provisional_diagnosis TEXT NOT NULL,
    investigation_advised TEXT[],
    followup_date DATE,
    is_signed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRESCRIPTIONS (NMC COMPLIANT)
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    consultation_id UUID UNIQUE NOT NULL REFERENCES consultations(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    instructions TEXT,
    digital_signature_hash VARCHAR(128) NOT NULL,
    pdf_url TEXT,
    qr_verification_code VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_name VARCHAR(200) NOT NULL,
    generic_name VARCHAR(200) NOT NULL,
    dosage_form VARCHAR(50) NOT NULL,
    strength VARCHAR(50),
    dosage_frequency VARCHAR(50) NOT NULL,
    timing_relation VARCHAR(50) NOT NULL,
    duration_days INT NOT NULL,
    special_instructions TEXT
);

-- 9. CLINIC OPERATIONAL EXPENSES
CREATE TABLE IF NOT EXISTS clinic_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    payment_mode VARCHAR(30) DEFAULT 'upi',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DPDP MEDICAL AUDIT LOGS
CREATE TABLE IF NOT EXISTS medical_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id),
    accessed_by UUID NOT NULL REFERENCES users(id),
    patient_id UUID NOT NULL REFERENCES users(id),
    record_type VARCHAR(50) NOT NULL,
    ip_address INET,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AI AUDITING & COST CONTROLS
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id),
    user_id UUID REFERENCES users(id),
    agent_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    estimated_cost_usd NUMERIC(8, 6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
