from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
from app.api.v1.appointments import APPOINTMENTS_DB

router = APIRouter(prefix="/clinic", tags=["Clinic Front Desk & Operations"])

class WalkInRequest(BaseModel):
    clinic_slug: str = "derma-care-dehradun"
    doctor_slug: str = "dr-rahul-sharma"
    patient_name: str = Field(..., min_length=2, max_length=100)
    patient_phone: str = Field(..., pattern=r"^\+?[1-9]\d{9,14}$")
    payment_mode: str = "upi" # 'cash' or 'upi'
    fee_amount: float = 600.0

class UpdatePaymentRequest(BaseModel):
    appointment_number: str
    payment_status: str # 'paid' or 'pending'
    payment_mode: str   # 'cash' or 'upi'

class CallTokenRequest(BaseModel):
    appointment_number: str

@router.get("/desk-queue")
def get_desk_queue(clinic_slug: str = "derma-care-dehradun", doctor_slug: Optional[str] = None):
    today_str = str(date.today())
    queue = []
    
    cash_total = 0.0
    upi_total = 0.0
    waiting_count = 0
    in_chamber_token = None

    for apt in APPOINTMENTS_DB.values():
        if apt.get("appointment_date") == today_str:
            if doctor_slug and apt.get("doctor_slug") != doctor_slug:
                continue
            
            queue.append(apt)
            if apt.get("payment_status") == "paid":
                if apt.get("payment_mode") == "cash":
                    cash_total += apt.get("fee_amount", 0.0)
                else:
                    upi_total += apt.get("fee_amount", 0.0)
            
            if apt.get("status") == "in_waiting":
                waiting_count += 1
            elif apt.get("status") == "in_consultation":
                in_chamber_token = apt.get("token_number")

    queue.sort(key=lambda x: x["token_number"])

    return {
        "status": "success",
        "clinic_slug": clinic_slug,
        "date": today_str,
        "active_chamber_token": in_chamber_token or (queue[0]["token_number"] if queue else None),
        "waiting_count": waiting_count,
        "total_tokens_today": len(queue),
        "collections": {
            "cash": cash_total,
            "upi": upi_total,
            "total": cash_total + upi_total
        },
        "queue": queue
    }

@router.post("/call-token")
def call_token(payload: CallTokenRequest):
    apt = APPOINTMENTS_DB.get(payload.appointment_number)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment token not found.")

    # Mark any previous in_consultation as completed
    for other in APPOINTMENTS_DB.values():
        if other["doctor_slug"] == apt["doctor_slug"] and other["status"] == "in_consultation":
            other["status"] = "completed"

    # Set current to in_consultation
    apt["status"] = "in_consultation"

    return {
        "status": "success",
        "called_token": apt["token_number"],
        "patient_name": apt["patient_name"],
        "doctor_name": apt["doctor_name"],
        "message": f"Token #{apt['token_number']} ({apt['patient_name']}) called to chamber."
    }

@router.post("/complete-token")
def complete_token(payload: CallTokenRequest):
    apt = APPOINTMENTS_DB.get(payload.appointment_number)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment token not found.")

    apt["status"] = "completed"
    return {
        "status": "success",
        "completed_token": apt["token_number"],
        "message": f"Token #{apt['token_number']} marked completed."
    }

@router.post("/walk-in")
def register_walk_in(payload: WalkInRequest):
    today_str = str(date.today())
    existing = [a for a in APPOINTMENTS_DB.values() if a["doctor_slug"] == payload.doctor_slug and a["appointment_date"] == today_str]
    assigned_token = len(existing) + 1

    apt_number = f"APT-WALKIN-{100 + assigned_token}"
    new_apt = {
        "appointment_number": apt_number,
        "doctor_slug": payload.doctor_slug,
        "doctor_name": "Dr. Rahul Sharma",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "patient_name": payload.patient_name,
        "patient_phone": payload.patient_phone,
        "appointment_date": today_str,
        "time_slot": f"Walk-In Token #{assigned_token}",
        "token_number": assigned_token,
        "status": "in_waiting",
        "fee_amount": payload.fee_amount,
        "payment_status": "paid",
        "payment_mode": payload.payment_mode
    }
    APPOINTMENTS_DB[apt_number] = new_apt

    return {
        "status": "success",
        "appointment": new_apt,
        "message": f"Walk-in registered! Token #{assigned_token} issued to {payload.patient_name}."
    }

@router.post("/update-payment")
def update_payment(payload: UpdatePaymentRequest):
    apt = APPOINTMENTS_DB.get(payload.appointment_number)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    apt["payment_status"] = payload.payment_status
    apt["payment_mode"] = payload.payment_mode

    return {
        "status": "success",
        "appointment_number": apt["appointment_number"],
        "payment_status": apt["payment_status"],
        "payment_mode": apt["payment_mode"]
    }
