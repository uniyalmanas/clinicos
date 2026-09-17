from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from app.api.v1.doctors import SEED_DOCTORS
from app.api.v1.onboarding import DOCTORS_DATABASE
import uuid
import urllib.parse

router = APIRouter(prefix="/appointments", tags=["Appointments & Live Tokens"])

class BookAppointmentRequest(BaseModel):
    doctor_slug: str
    patient_name: str = Field(..., min_length=2, max_length=100)
    patient_phone: str = Field(..., pattern=r"^\+?[1-9]\d{9,14}$")
    appointment_date: Optional[str] = None
    time_slot: Optional[str] = "Walk-In Live Token (Next Available)"
    consultation_type: str = "in_person"
    symptoms_description: Optional[str] = None

# In-memory appointment store preloaded with today's seed appointments
APPOINTMENTS_DB = {
    "APT-DERMA-101": {
        "appointment_number": "APT-DERMA-101",
        "doctor_slug": "dr-rahul-sharma",
        "doctor_name": "Dr. Rahul Sharma",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "patient_name": "Amit Rawat",
        "patient_phone": "+919123456780",
        "appointment_date": str(date.today()),
        "time_slot": "10:15 AM - 10:30 AM",
        "token_number": 1,
        "status": "completed",
        "fee_amount": 600.0,
        "payment_status": "paid",
        "payment_mode": "upi"
    },
    "APT-DERMA-102": {
        "appointment_number": "APT-DERMA-102",
        "doctor_slug": "dr-rahul-sharma",
        "doctor_name": "Dr. Rahul Sharma",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "patient_name": "Priya Singh",
        "patient_phone": "+919123456781",
        "appointment_date": str(date.today()),
        "time_slot": "10:30 AM - 10:45 AM",
        "token_number": 2,
        "status": "in_consultation",
        "fee_amount": 600.0,
        "payment_status": "paid",
        "payment_mode": "cash"
    },
    "APT-DERMA-103": {
        "appointment_number": "APT-DERMA-103",
        "doctor_slug": "dr-rahul-sharma",
        "doctor_name": "Dr. Rahul Sharma",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "patient_name": "Rohit Pant",
        "patient_phone": "+919123456782",
        "appointment_date": str(date.today()),
        "time_slot": "10:45 AM - 11:00 AM",
        "token_number": 3,
        "status": "in_waiting",
        "fee_amount": 600.0,
        "payment_status": "pending",
        "payment_mode": "upi"
    }
}

@router.get("/live-queue")
def get_live_queue(doctor_slug: str = "dr-rahul-sharma"):
    doctor_appointments = [
        apt for apt in APPOINTMENTS_DB.values()
        if apt["doctor_slug"] == doctor_slug and apt["appointment_date"] == str(date.today())
    ]
    doctor_appointments.sort(key=lambda x: x["token_number"])

    current_active_token = 2 # default in consultation
    for apt in doctor_appointments:
        if apt["status"] == "in_consultation":
            current_active_token = apt["token_number"]
            break

    return {
        "doctor_slug": doctor_slug,
        "current_active_token": current_active_token,
        "total_tokens_today": len(doctor_appointments),
        "next_token_available": len(doctor_appointments) + 1,
        "estimated_wait_minutes_per_patient": 12,
        "queue": [
            {
                "token": apt["token_number"],
                "appointment_number": apt["appointment_number"],
                "patient_name": apt["patient_name"] if apt["token_number"] <= current_active_token + 1 else f"{apt['patient_name'][:2]}****",
                "status": apt["status"],
                "time_slot": apt["time_slot"]
            }
            for apt in doctor_appointments
        ]
    }

@router.post("/book")
def book_appointment(payload: BookAppointmentRequest):
    all_docs = {**SEED_DOCTORS, **DOCTORS_DATABASE}
    doc = all_docs.get(payload.doctor_slug)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found.")

    # Calculate next token number for this doctor today
    today_str = payload.appointment_date or str(date.today())
    doctor_appointments = [
        apt for apt in APPOINTMENTS_DB.values()
        if apt["doctor_slug"] == payload.doctor_slug and apt["appointment_date"] == today_str
    ]
    assigned_token = len(doctor_appointments) + 1

    apt_number = f"APT-{payload.doctor_slug[:5].upper()}-{100 + assigned_token}"
    new_appointment = {
        "appointment_number": apt_number,
        "doctor_slug": payload.doctor_slug,
        "doctor_name": doc["full_name"],
        "clinic_name": doc["clinic_name"],
        "patient_name": payload.patient_name,
        "patient_phone": payload.patient_phone,
        "appointment_date": today_str,
        "time_slot": payload.time_slot or f"Token #{assigned_token}",
        "token_number": assigned_token,
        "status": "in_waiting",
        "fee_amount": float(doc["consultation_fee"]),
        "payment_status": "pending",
        "payment_mode": "upi",
        "symptoms_description": payload.symptoms_description
    }

    APPOINTMENTS_DB[apt_number] = new_appointment

    # Construct zero-cost WhatsApp notification deep-link
    wa_message = (
        f"🏥 *Appointment Confirmed - {doc['clinic_name']}*\n"
        f"Hello {payload.patient_name}, your appointment with *{doc['full_name']}* has been booked!\n\n"
        f"🎟️ *Your Token Number:* #{assigned_token}\n"
        f"📅 *Date:* {today_str}\n"
        f"📍 *Clinic Address:* {doc['clinic_address']}\n"
        f"💰 *Consultation Fee:* ₹{doc['consultation_fee']}\n\n"
        f"Please arrive 10 minutes before your token call. Track live queue: https://clinicos.in/book?doctor={payload.doctor_slug}"
    )
    clean_phone = payload.patient_phone.replace("+", "").replace(" ", "").replace("-", "")
    whatsapp_deep_link = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(wa_message)}"

    return {
        "status": "confirmed",
        "appointment": new_appointment,
        "whatsapp_notification_link": whatsapp_deep_link,
        "message": f"Appointment booked! Your Token Number is #{assigned_token}."
    }

@router.get("/{appointment_number}")
def get_appointment(appointment_number: str):
    apt = APPOINTMENTS_DB.get(appointment_number)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")
    return apt
