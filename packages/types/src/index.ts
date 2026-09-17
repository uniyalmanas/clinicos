// ============================================================================
// CLINICOS / DOCSPHERE - CANONICAL DOMAIN TYPES
// ============================================================================

export type UserRole = 
  | 'patient' 
  | 'doctor' 
  | 'clinic_admin' 
  | 'staff' 
  | 'pharmacy' 
  | 'diagnostic' 
  | 'admin' 
  | 'superadmin';

export interface User {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  abha_number?: string;
  abha_address?: string;
  created_at: string;
  updated_at: string;
}

export interface Clinic {
  id: string;
  slug: string;
  name: string;
  owner_user_id: string;
  tagline?: string;
  about?: string;
  phone: string;
  whatsapp_number?: string;
  gstin?: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  logo_url?: string;
  cover_photo_url?: string;
  facilities: string[];
  opening_hours: Record<string, string>;
  is_verified: boolean;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  full_name: string;
  medical_council_reg_number: string;
  medical_council_state: string;
  qualification_summary: string;
  specialization: string;
  sub_specializations: string[];
  years_of_experience: number;
  languages_spoken: string[];
  bio?: string;
  consultation_fee: number;
  followup_fee: number;
  followup_validity_days: number;
  services_offered: {
    name: string;
    description?: string;
    fee?: number;
  }[];
  verification_status: 'pending' | 'verified' | 'rejected';
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface ClinicDoctor {
  id: string;
  clinic_id: string;
  doctor_id: string;
  is_primary_owner: boolean;
  consultation_fee_override?: number;
  opd_schedules: {
    day: string; // 'Monday' | 'Tuesday' etc.
    shifts: {
      start_time: string; // '09:00'
      end_time: string;   // '13:00'
      slot_duration_minutes: number;
      max_tokens: number;
    }[];
  }[];
}

export interface PatientProfile {
  id: string;
  user_id: string;
  gender: 'male' | 'female' | 'other';
  dob?: string;
  blood_group?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 
  | 'requested' 
  | 'confirmed' 
  | 'in_waiting' 
  | 'in_consultation' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

export type PaymentStatus = 'pending' | 'paid' | 'waived';
export type PaymentMode = 'cash' | 'upi' | 'online';

export interface Appointment {
  id: string;
  appointment_number: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  patient_name?: string;
  patient_phone?: string;
  appointment_date: string;
  time_slot?: string;
  token_number: number;
  consultation_type: 'in_person' | 'video' | 'emergency';
  status: AppointmentStatus;
  fee_amount: number;
  payment_status: PaymentStatus;
  payment_mode?: PaymentMode;
  symptoms_description?: string;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  vitals: {
    bp?: string;
    pulse?: number;
    temp?: number;
    weight?: number;
    spo2?: number;
  };
  symptoms: string[];
  clinical_findings?: string;
  provisional_diagnosis: string;
  investigation_advised?: string[];
  followup_date?: string;
  is_signed: boolean;
  created_at: string;
}

export interface PrescriptionItem {
  id?: string;
  prescription_id?: string;
  medicine_name: string;
  generic_name: string;
  dosage_form: 'Tablet' | 'Capsule' | 'Syrup' | 'Ointment' | 'Injection' | 'Drops';
  strength?: string;
  dosage_frequency: string; // '1-0-1', '0-0-1'
  timing_relation: 'Before Food' | 'After Food' | 'With Food' | 'At Bedtime';
  duration_days: number;
  special_instructions?: string;
}

export interface Prescription {
  id: string;
  prescription_number: string;
  consultation_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  instructions?: string;
  digital_signature_hash: string;
  pdf_url?: string;
  qr_verification_code: string;
  created_at: string;
  items: PrescriptionItem[];
}

export interface ClinicExpense {
  id: string;
  clinic_id: string;
  category: 'Electricity' | 'Staff Salary' | 'Rent' | 'Consumables' | 'Maintenance' | 'Miscellaneous';
  amount: number;
  expense_date: string;
  description?: string;
  payment_mode: PaymentMode;
  created_by: string;
  created_at: string;
}

export type WardType = 'general' | 'semi_private' | 'private_deluxe' | 'icu' | 'daycare_recovery';
export type BedStatus = 'vacant' | 'occupied' | 'discharge_pending' | 'maintenance';

export interface ClinicWard {
  id: string;
  clinic_id: string;
  name: string;
  ward_type: WardType;
  daily_rate: number;
  hourly_rate: number;
  total_beds?: number;
  occupied_beds?: number;
  created_at?: string;
}

export interface ClinicBed {
  id: string;
  clinic_id: string;
  ward_id: string;
  ward_name?: string;
  ward_type?: WardType;
  bed_number: string;
  status: BedStatus;
  current_patient_name?: string;
  current_patient_phone?: string;
  assigned_doctor_name?: string;
  admission_notes?: string;
  admission_timestamp?: string;
  daily_rate?: number;
  hourly_rate?: number;
  accrued_charge?: number;
  stay_hours?: number;
  created_at?: string;
}

export interface MedicalAuditLog {
  id: string;
  clinic_id: string;
  accessed_by: string;
  patient_id: string;
  record_type: 'emr_view' | 'rx_download' | 'lab_report_view';
  ip_address?: string;
  accessed_at: string;
}

// AI Extracted Onboarding Schema
export interface AIOnboardingResult {
  doctor: {
    full_name: string;
    specialization: string;
    qualifications: string;
    medical_council_reg_number?: string;
    medical_council_state?: string;
    years_of_experience: number;
    consultation_fee: number;
    services: string[];
  };
  clinic: {
    name: string;
    address_line: string;
    city: string;
    state: string;
    postal_code?: string;
    opening_hours: Record<string, string>;
  };
  ai_bio: string;
  missing_fields: string[];
  status: 'ready_for_review' | 'needs_clarification';
}

export interface PharmacyBatchItem {
  id: string;
  clinic_slug: string;
  brand_name: string;
  generic_name: string;
  dosage_form: 'Tablet' | 'Capsule' | 'Syrup' | 'Ointment' | 'Injection' | 'Drops';
  strength?: string;
  batch_number: string;
  expiry_date: string; // YYYY-MM-DD
  days_to_expiry?: number;
  is_expiring_soon?: boolean;
  is_expired?: boolean;
  current_stock: number;
  reorder_level: number;
  is_low_stock?: boolean;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  gst_rate: number; // 5, 12, 18
  hsn_code?: string;
  manufacturer?: string;
  rack_location?: string;
  created_at?: string;
}

export interface PharmacyBillItem {
  item_id: string;
  brand_name: string;
  batch_number: string;
  dosage_form: string;
  quantity: number;
  unit_price: number;
  total: number;
  gst_rate: number;
}

export interface PharmacyBill {
  id: string;
  bill_number: string;
  clinic_slug: string;
  prescription_number?: string;
  patient_name: string;
  patient_phone?: string;
  doctor_name?: string;
  items: PharmacyBillItem[];
  subtotal: number;
  discount: number;
  gst_amount: number;
  total_amount: number;
  payment_mode: 'cash' | 'upi' | 'card';
  status: 'dispensed' | 'pending' | 'cancelled';
  created_at: string;
}
