from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, JSON
from datetime import datetime
from app.db.session import Base

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
    created_at = Column(DateTime, default=datetime.utcnow)

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, index=True)
    appointment_number = Column(String, unique=True, index=True)
    doctor_slug = Column(String, index=True)
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
