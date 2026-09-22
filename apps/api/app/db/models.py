from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, JSON, ForeignKey
from datetime import datetime
from app.db.session import Base


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(String, primary_key=True, index=True)
    phone = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="patient")
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ClinicMembership(Base):
    __tablename__ = "clinic_memberships"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user_accounts.id"), nullable=False, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=False, index=True)
    role = Column(String, nullable=False, default="staff")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    title = Column(String, default="Dr.")
    full_name = Column(String, nullable=False)
    medical_council_reg_number = Column(String, default="UKMC-TEMP-2026")
    medical_council_state = Column(String, default="Uttarakhand Medical Council")
    qualification_summary = Column(String, default="MBBS")
    specialization = Column(String, index=True)
    sub_specializations = Column(JSON, default=list)
    years_of_experience = Column(Integer, default=5)
    languages_spoken = Column(JSON, default=list)
    bio = Column(Text)
    consultation_fee = Column(Float, default=500.0)
    followup_fee = Column(Float, default=200.0)
    followup_validity_days = Column(Integer, default=7)
    services_offered = Column(JSON, default=list)
    verification_status = Column(String, default="verified")
    rating = Column(Float, default=4.9)
    total_reviews = Column(Integer, default=1)
    clinic_id = Column(String, index=True)
    clinic_name = Column(String)
    clinic_slug = Column(String, index=True)
    clinic_address = Column(String)
    opd_timings = Column(String, default="Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM")
    phone = Column(String, default="+919876543210")
    created_at = Column(DateTime, default=datetime.utcnow)

class Clinic(Base):
    __tablename__ = "clinics"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)
    address_line = Column(String)
    city = Column(String, default="Dehradun")
    state = Column(String, default="Uttarakhand")
    postal_code = Column(String, default="248001")
    facilities = Column(JSON, default=list)
    opening_hours = Column(JSON, default=dict)
    status = Column(String, default="active")
    subscription_status = Column(String, default="trial", index=True)
    subscription_plan = Column(String, default="starter")
    subscription_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, index=True)
    appointment_number = Column(String, unique=True, index=True)
    doctor_slug = Column(String, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True, index=True)
    doctor_name = Column(String)
    clinic_name = Column(String)
    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, index=True)
    appointment_date = Column(String, index=True)
    time_slot = Column(String)
    token_number = Column(Integer)
    status = Column(String, default="in_waiting") # in_waiting, in_consultation, completed, cancelled
    fee_amount = Column(Float, default=500.0)
    payment_status = Column(String, default="pending") # pending, paid
    payment_mode = Column(String, default="upi") # upi, cash
    symptoms_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String, primary_key=True, index=True)
    prescription_number = Column(String, unique=True, index=True)
    appointment_number = Column(String, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True, index=True)
    doctor_name = Column(String)
    doctor_reg_number = Column(String)
    clinic_name = Column(String)
    clinic_address = Column(String)
    patient_name = Column(String)
    patient_phone = Column(String, index=True)
    patient_age = Column(Integer, default=28)
    patient_gender = Column(String, default="Male")
    vitals = Column(JSON, default=dict)
    symptoms = Column(JSON, default=list)
    provisional_diagnosis = Column(String)
    items = Column(JSON, default=list)
    instructions = Column(Text)
    followup_date = Column(String, nullable=True)
    digital_signature_hash = Column(String)
    qr_verification_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class PatientDocument(Base):
    __tablename__ = "patient_documents"

    id = Column(String, primary_key=True, index=True)
    patient_phone = Column(String, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True, index=True)
    patient_name = Column(String)
    document_type = Column(String, default="Lab Report") # Lab Report, Blood Test, Radiology X-Ray, Previous Rx, Discharge Summary
    title = Column(String, nullable=False)
    file_name = Column(String)
    file_size_kb = Column(Integer, default=250)
    doctor_notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, index=True)
    doctor_slug = Column(String, index=True)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=True, index=True)
    patient_name = Column(String)
    rating = Column(Float, default=5.0)
    waiting_time_rating = Column(Float, default=5.0)
    bedside_manner_rating = Column(Float, default=5.0)
    comment = Column(Text)
    doctor_reply = Column(Text, nullable=True)
    is_verified_visit = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, index=True)
    clinic_slug = Column(String, index=True, default="derma-care-dehradun")
    category = Column(String)
    title = Column(String)
    amount = Column(Float)
    payment_mode = Column(String, default="cash")
    recorded_by = Column(String, default="Front Desk Reception")
    date = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ClinicWard(Base):
    __tablename__ = "clinic_wards"

    id = Column(String, primary_key=True, index=True)
    clinic_slug = Column(String, index=True, default="derma-care-dehradun")
    name = Column(String, nullable=False)
    ward_type = Column(String, nullable=False) # general, semi_private, private_deluxe, icu, daycare_recovery
    daily_rate = Column(Float, default=1500.0)
    hourly_rate = Column(Float, default=150.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class ClinicBed(Base):
    __tablename__ = "clinic_beds"

    id = Column(String, primary_key=True, index=True)
    clinic_slug = Column(String, index=True, default="derma-care-dehradun")
    ward_id = Column(String, index=True)
    bed_number = Column(String, nullable=False)
    status = Column(String, default="vacant") # vacant, occupied, discharge_pending, maintenance
    current_patient_name = Column(String, nullable=True)
    current_patient_phone = Column(String, nullable=True)
    assigned_doctor_name = Column(String, nullable=True)
    admission_notes = Column(Text, nullable=True)
    admission_timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PharmacyItem(Base):
    __tablename__ = "pharmacy_items"

    id = Column(String, primary_key=True, index=True)
    clinic_slug = Column(String, index=True, default="derma-care-dehradun")
    brand_name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=False, index=True)
    dosage_form = Column(String, default="Tablet")
    strength = Column(String, default="100mg")
    batch_number = Column(String, nullable=False, index=True)
    expiry_date = Column(String, nullable=False, index=True) # YYYY-MM-DD
    current_stock = Column(Integer, default=50)
    reorder_level = Column(Integer, default=15)
    purchase_price = Column(Float, default=30.0)
    mrp = Column(Float, default=65.0)
    selling_price = Column(Float, default=60.0)
    gst_rate = Column(Float, default=12.0)
    hsn_code = Column(String, default="3004")
    manufacturer = Column(String, default="Sun Pharma")
    rack_location = Column(String, default="Rack A-01")
    created_at = Column(DateTime, default=datetime.utcnow)

class PharmacyDispense(Base):
    __tablename__ = "pharmacy_dispenses"

    id = Column(String, primary_key=True, index=True)
    bill_number = Column(String, unique=True, index=True)
    clinic_slug = Column(String, index=True, default="derma-care-dehradun")
    prescription_number = Column(String, nullable=True, index=True)
    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    items = Column(JSON, default=list) # [{item_id, brand_name, batch_number, dosage_form, quantity, unit_price, total, gst_rate}]
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    payment_mode = Column(String, default="upi") # upi, cash, card
    status = Column(String, default="dispensed") # dispensed, pending, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)

class MarketplaceInquiry(Base):
    __tablename__ = "marketplace_inquiries"

    id = Column(String, primary_key=True, index=True)
    inquiry_token = Column(String, unique=True, index=True) # e.g. COS-MED-4912
    inquiry_type = Column(String, index=True) # "medicine" or "lab_test"
    patient_name = Column(String, nullable=False)
    patient_phone = Column(String, nullable=False)
    locality = Column(String, default="Rajpur Road, Dehradun")
    target_entity_name = Column(String, nullable=False) # Pharmacy or Lab Name
    target_entity_phone = Column(String, nullable=False)
    items = Column(JSON, default=list) # [{name, qty, form, price}]
    prescription_preview = Column(Text, nullable=True) # text or base64 data preview
    notes = Column(Text, nullable=True)
    channel = Column(String, default="whatsapp") # "whatsapp", "call", "counter_slip"
    status = Column(String, default="dispatched") # "dispatched", "contacted", "fulfilled"
    created_at = Column(DateTime, default=datetime.utcnow)

class PartnerApplication(Base):
    __tablename__ = "partner_applications"

    id = Column(String, primary_key=True, index=True)
    partner_type = Column(String, index=True) # "pharmacy" or "diagnostic_lab"
    business_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    whatsapp = Column(String, nullable=False)
    locality = Column(String, nullable=False)
    address = Column(String, nullable=False)
    license_number = Column(String, nullable=True) # Drug License or NABL ID
    home_service = Column(Boolean, default=True) # Home delivery / sample collection
    is_verified = Column(Boolean, default=True)
    status = Column(String, default="verified") # "pending", "verified", "rejected"
    created_at = Column(DateTime, default=datetime.utcnow)

class ClinicEodClosing(Base):
    __tablename__ = "clinic_eod_closings"

    id = Column(String, primary_key=True, index=True)
    clinic_slug = Column(String, index=True, default="derma-care-dehradun")
    closing_date = Column(String, index=True) # YYYY-MM-DD
    closed_at = Column(DateTime, default=datetime.utcnow)
    closed_by = Column(String, default="Front Desk Lead")
    counted_cash = Column(Float, default=0.0)
    expected_cash = Column(Float, default=0.0)
    cash_discrepancy = Column(Float, default=0.0)
    gross_collections = Column(Float, default=0.0)
    soundbox_upi = Column(Float, default=0.0)
    total_consultations = Column(Integer, default=0)
    closing_notes = Column(Text, nullable=True)
    audit_hash = Column(String, nullable=False)
    status = Column(String, default="locked")



