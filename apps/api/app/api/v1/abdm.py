"""
Ayushman Bharat Digital Mission (ABDM) M1 National Health Stack Router
Handles ABHA (Ayushman Bharat Health Account) creation, Aadhaar OTP verification, 
and National Health Authority (NHA) health locker linking.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import random
import uuid

router = APIRouter(prefix="/abdm", tags=["ABDM & ABHA National Health Authority"])

class GenerateOTPRequest(BaseModel):
    id_type: str = "aadhaar"  # "aadhaar" or "mobile"
    id_value: str             # 12-digit Aadhaar or 10-digit mobile
    patient_name: Optional[str] = "Priya Singh"

class VerifyOTPRequest(BaseModel):
    txn_id: str
    otp: str
    patient_name: str
    phone: str
    gender: Optional[str] = "Female"
    year_of_birth: Optional[int] = 1999

class ABHALinkRequest(BaseModel):
    abha_number: str
    appointment_number: str

# In-memory ABDM transaction cache
ABDM_TXN_CACHE: Dict[str, Dict[str, Any]] = {}
REGISTERED_ABHA_DB: Dict[str, Dict[str, Any]] = {
    "91-4521-8890-1234": {
        "abha_number": "91-4521-8890-1234",
        "abha_address": "priya.singh@abdm",
        "name": "Priya Singh",
        "gender": "Female",
        "dob": "1999-04-12",
        "phone": "+919123456781",
        "verification_status": "VERIFIED_NHA",
        "linked_records_count": 4,
        "created_at": "2024-02-15T10:00:00Z"
    }
}

@router.post("/generate-otp")
def generate_abdm_otp(payload: GenerateOTPRequest):
    val = payload.id_value.replace(" ", "").replace("-", "")
    if payload.id_type == "aadhaar" and len(val) != 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aadhaar number must be exactly 12 digits."
        )
    if payload.id_type == "mobile" and len(val) != 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be exactly 10 digits."
        )

    txn_id = f"TXN-ABDM-{uuid.uuid4().hex[:8].upper()}"
    demo_otp = "123456" # Standard sandbox test OTP for ABDM sandbox

    masked_target = f"XXXX-XXXX-{val[-4:]}" if payload.id_type == "aadhaar" else f"+91-XXXXXX{val[-4:]}"

    ABDM_TXN_CACHE[txn_id] = {
        "id_type": payload.id_type,
        "id_value": val,
        "patient_name": payload.patient_name,
        "demo_otp": demo_otp,
        "created_at": datetime.utcnow().isoformat()
    }

    return {
        "status": "success",
        "message": f"ABDM Aadhaar OTP dispatched to mobile linked with {masked_target}. In sandbox mode, enter test OTP: 123456",
        "data": {
            "txn_id": txn_id,
            "masked_target": masked_target,
            "test_otp": demo_otp
        }
    }

@router.post("/verify-otp")
def verify_abdm_otp(payload: VerifyOTPRequest):
    cached = ABDM_TXN_CACHE.get(payload.txn_id)
    if not cached and payload.otp != "123456":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired ABDM transaction. Please request a new OTP."
        )

    if payload.otp not in ["123456", cached.get("demo_otp") if cached else ""]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. For sandbox simulation, enter 123456."
        )

    # Generate official 14-digit ABHA ID formatted as XX-XXXX-XXXX-XXXX
    p1 = str(random.randint(10, 99))
    p2 = str(random.randint(1000, 9999))
    p3 = str(random.randint(1000, 9999))
    p4 = str(random.randint(1000, 9999))
    generated_abha = f"{p1}-{p2}-{p3}-{p4}"

    slug_name = payload.patient_name.lower().replace(" ", ".")
    abha_address = f"{slug_name}{random.randint(10, 99)}@abdm"

    record = {
        "abha_number": generated_abha,
        "abha_address": abha_address,
        "name": payload.patient_name,
        "gender": payload.gender or "Female",
        "dob": f"{payload.year_of_birth or 1999}-01-01",
        "phone": payload.phone,
        "verification_status": "VERIFIED_NHA",
        "kyc_verified": True,
        "health_locker_status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat()
    }

    REGISTERED_ABHA_DB[generated_abha] = record

    return {
        "status": "success",
        "message": "ABHA Number generated successfully and certified under Ayushman Bharat Digital Mission (M1 Milestone).",
        "data": record
    }

@router.get("/lookup/{abha_identifier}")
def lookup_abha_profile(abha_identifier: str):
    clean_id = abha_identifier.strip()
    match = REGISTERED_ABHA_DB.get(clean_id)
    if not match:
        # Check by address
        for rec in REGISTERED_ABHA_DB.values():
            if rec.get("abha_address") == clean_id:
                match = rec
                break

    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ABHA profile not found for identifier: {abha_identifier}"
        )

    return {
        "status": "success",
        "data": match
    }

@router.post("/link-appointment")
def link_abha_to_appointment(payload: ABHALinkRequest):
    match = REGISTERED_ABHA_DB.get(payload.abha_number)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Specified ABHA account not registered."
        )

    return {
        "status": "success",
        "message": f"Linked ABHA #{payload.abha_number} to OPD Appointment #{payload.appointment_number}.",
        "data": {
            "appointment_number": payload.appointment_number,
            "abha_number": payload.abha_number,
            "abha_address": match["abha_address"],
            "hip_synced": True,
            "consent_status": "GRANTED"
        }
    }
