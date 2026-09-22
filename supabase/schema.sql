-- Core tenant/product schema for DocSphere / ClinicOS
-- This is the production-ready baseline for Vercel + Supabase deployment.
-- No authentication is assumed yet; role and ownership can be added later.

create extension if not exists "uuid-ossp";

create table if not exists clinics (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  tagline text,
  about text,
  phone text,
  whatsapp_number text,
  email text,
  address_line text,
  city text not null default 'Dehradun',
  state text not null default 'Uttarakhand',
  postal_code text,
  latitude double precision,
  longitude double precision,
  facilities jsonb not null default '[]'::jsonb,
  opening_hours jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinics_city on clinics(city);
create index if not exists idx_clinics_slug on clinics(slug);

create table if not exists doctors (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  full_name text not null,
  title text default 'Dr.',
  specialization text not null,
  qualification_summary text,
  medical_council_reg_number text,
  medical_council_state text,
  years_of_experience integer not null default 0,
  languages_spoken jsonb not null default '[]'::jsonb,
  bio text,
  consultation_fee numeric(10,2) not null default 500,
  followup_fee numeric(10,2) not null default 200,
  followup_validity_days integer not null default 7,
  services_offered jsonb not null default '[]'::jsonb,
  verification_status text not null default 'verified',
  rating numeric(3,2) not null default 5,
  total_reviews integer not null default 0,
  clinic_id uuid references clinics(id) on delete set null,
  clinic_name text,
  clinic_slug text,
  clinic_address text,
  opd_timings text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_doctors_specialization on doctors(specialization);
create index if not exists idx_doctors_clinic on doctors(clinic_id);

create table if not exists patients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text,
  email text,
  dob date,
  gender text,
  blood_group text,
  allergies jsonb not null default '[]'::jsonb,
  chronic_conditions jsonb not null default '[]'::jsonb,
  emergency_contact_name text,
  emergency_contact_phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  appointment_number text unique not null,
  clinic_id uuid references clinics(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  patient_name text not null,
  patient_phone text,
  appointment_date date not null,
  time_slot text,
  token_number integer not null,
  consultation_type text not null default 'in_person',
  status text not null default 'in_waiting',
  fee_amount numeric(10,2) not null default 0,
  payment_status text not null default 'pending',
  payment_mode text not null default 'upi',
  symptoms_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointments_date on appointments(appointment_date);
create index if not exists idx_appointments_doctor on appointments(doctor_id);

create table if not exists consultations (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid references appointments(id) on delete cascade,
  patient_id uuid references patients(id) on delete set null,
  doctor_id uuid references doctors(id) on delete cascade,
  clinic_id uuid references clinics(id) on delete cascade,
  vitals jsonb not null default '{}'::jsonb,
  symptoms jsonb not null default '[]'::jsonb,
  clinical_findings text,
  provisional_diagnosis text,
  investigations_advised jsonb not null default '[]'::jsonb,
  followup_date date,
  is_signed boolean not null default false,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prescriptions (
  id uuid primary key default uuid_generate_v4(),
  prescription_number text unique not null,
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid references patients(id) on delete set null,
  doctor_id uuid references doctors(id) on delete set null,
  clinic_id uuid references clinics(id) on delete set null,
  patient_name text,
  patient_phone text,
  doctor_name text,
  clinic_name text,
  clinic_address text,
  vitals jsonb not null default '{}'::jsonb,
  symptoms jsonb not null default '[]'::jsonb,
  provisional_diagnosis text,
  items jsonb not null default '[]'::jsonb,
  instructions text,
  followup_date date,
  digital_signature_hash text,
  qr_verification_code text,
  created_at timestamptz not null default now()
);

create table if not exists patient_documents (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  patient_name text,
  patient_phone text,
  document_type text,
  title text not null,
  file_name text,
  file_url text,
  file_size_kb integer,
  doctor_notes text,
  uploaded_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade,
  category text not null,
  title text not null,
  amount numeric(12,2) not null default 0,
  payment_mode text not null default 'upi',
  recorded_by text,
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists pharmacy_items (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade,
  brand_name text not null,
  generic_name text,
  dosage_form text,
  strength text,
  batch_number text,
  expiry_date date,
  current_stock integer not null default 0,
  reorder_level integer not null default 0,
  purchase_price numeric(10,2) not null default 0,
  mrp numeric(10,2),
  selling_price numeric(10,2),
  gst_rate numeric(5,2) default 0,
  hsn_code text,
  manufacturer text,
  rack_location text,
  created_at timestamptz not null default now()
);

create table if not exists pharmacy_dispenses (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade,
  bill_number text unique not null,
  prescription_number text,
  patient_name text not null,
  patient_phone text,
  doctor_name text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_mode text not null default 'upi',
  status text not null default 'dispensed',
  created_at timestamptz not null default now()
);

create table if not exists settlements (
  id uuid primary key default uuid_generate_v4(),
  clinic_id uuid references clinics(id) on delete cascade,
  settlement_date date not null default current_date,
  counted_cash numeric(12,2) not null default 0,
  expected_cash numeric(12,2) not null default 0,
  cash_discrepancy numeric(12,2) not null default 0,
  gross_collections numeric(12,2) not null default 0,
  soundbox_upi numeric(12,2) not null default 0,
  total_consultations integer not null default 0,
  closing_notes text,
  audit_hash text,
  status text not null default 'locked',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references doctors(id) on delete cascade,
  patient_name text,
  rating numeric(3,2) not null default 5,
  waiting_time_rating numeric(3,2) default 5,
  bedside_manner_rating numeric(3,2) default 5,
  comment text,
  doctor_reply text,
  is_verified_visit boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null,
  entity_id text,
  action text not null,
  details jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
