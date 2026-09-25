-- ============================================================================
-- CLINICOS: ORGANIZATIONS & PRACTICE TYPE PLANS HIERARCHY
-- Target: PostgreSQL 15+ (Supabase)
-- Architecture:
--   ACCOUNT (user_accounts)
--     └── ORGANIZATION (organizations)
--           ├── SOLO PLAN (1 Doctor - ₹599/mo)
--           └── CLINIC PLAN (Multiple Doctors - ₹1,299/mo)
--                 └── CLINIC (clinics)
--                       ├── DOCTORS (doctors)
--                       ├── STAFF (clinic_memberships: receptionist, nurse, accountant)
--                       └── PATIENTS & CLINIC DATA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (SUBSCRIBER BUSINESS ENTITY)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    practice_type TEXT NOT NULL DEFAULT 'solo' CHECK (practice_type IN ('solo', 'clinic')),
    plan_type TEXT NOT NULL DEFAULT 'solo_practice' CHECK (plan_type IN ('solo_practice', 'multi_clinic', 'starter', 'growth', 'enterprise')),
    plan_price_inr NUMERIC(10,2) NOT NULL DEFAULT 599.00,
    max_doctors INTEGER NOT NULL DEFAULT 1,
    subscription_status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);

-- 2. ADD ORGANIZATION REFERENCES & PRACTICE TYPE TO CLINICS
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinics' AND column_name = 'organization_id'
    ) THEN 
        ALTER TABLE clinics ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinics' AND column_name = 'practice_type'
    ) THEN 
        ALTER TABLE clinics ADD COLUMN practice_type TEXT NOT NULL DEFAULT 'solo' CHECK (practice_type IN ('solo', 'clinic'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinics_org ON clinics(organization_id);

-- 3. MIGRATE / SEED DEFAULT ORGANIZATIONS FOR EXISTING CLINICS
-- Derma Care (Polyclinic Multi-Doctor)
INSERT INTO organizations (id, name, slug, practice_type, plan_type, plan_price_inr, max_doctors, subscription_status)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Derma Care Healthcare Group',
    'derma-care-group',
    'clinic',
    'multi_clinic',
    1299.00,
    10,
    'active'
) ON CONFLICT (slug) DO UPDATE 
SET practice_type = 'clinic', plan_type = 'multi_clinic', plan_price_inr = 1299.00, max_doctors = 10;

-- Link Derma Care Clinic to Multi-Doctor Organization
UPDATE clinics 
SET organization_id = '11111111-1111-1111-1111-111111111111', practice_type = 'clinic'
WHERE slug = 'derma-care-dehradun';

-- Default Solo Practice Organization for standalone practices
INSERT INTO organizations (id, name, slug, practice_type, plan_type, plan_price_inr, max_doctors, subscription_status)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Solo Practice Network',
    'solo-practice-network',
    'solo',
    'solo_practice',
    599.00,
    1,
    'active'
) ON CONFLICT (slug) DO NOTHING;

UPDATE clinics 
SET organization_id = '22222222-2222-2222-2222-222222222222', practice_type = 'solo'
WHERE organization_id IS NULL;
