from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import asyncio
import json
import uuid

from app.api.v1.appointments import APPOINTMENTS_DB
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.db.models import Appointment

router = APIRouter(prefix="/clinic", tags=["Clinic Front Desk & Real-Time Operations"])

# Connected SSE subscribers for real-time token broadcasting
SUBSCRIBERS: List[asyncio.Queue] = []

async def broadcast_event(event_type: str, data: Dict[str, Any]):
    """Broadcast real-time token event to all connected front-desk and waiting-room screens"""
    payload = json.dumps({
        "event": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    })
    disconnected = []
    for q in SUBSCRIBERS:
        try:
            await q.put(payload)
        except Exception:
            disconnected.append(q)
    for q in disconnected:
        if q in SUBSCRIBERS:
            SUBSCRIBERS.remove(q)

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

@router.get("/stream")
async def token_events_stream():
    """
    Server-Sent Events (SSE) stream.
    Clients connect to receive live token call alerts, acoustic chime triggers, and queue changes.
    """
    queue = asyncio.Queue()
    SUBSCRIBERS.append(queue)

    async def event_generator():
        try:
            # Welcome handshake event
            init_msg = json.dumps({"event": "connected", "message": "Connected to DocSphere Real-Time Token Broadcast"})
            yield f"data: {init_msg}\n\n"

            while True:
                # Wait for token event broadcast
                data = await queue.get()
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in SUBSCRIBERS:
                SUBSCRIBERS.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/desk-queue")
def get_desk_queue(
    clinic_slug: str = "derma-care-dehradun", 
    doctor_slug: Optional[str] = None,
    db: Session = Depends(get_db)
):
    today_str = str(date.today())
    
    # Query database appointments
    db_query = db.query(Appointment).filter(Appointment.appointment_date == today_str)
    if doctor_slug:
        db_query = db_query.filter(Appointment.doctor_slug == doctor_slug)
    db_apts = db_query.all()

    # Sync into memory store if needed
    for apt in db_apts:
        if apt.appointment_number not in APPOINTMENTS_DB:
            APPOINTMENTS_DB[apt.appointment_number] = {
                "appointment_number": apt.appointment_number,
                "doctor_slug": apt.doctor_slug,
                "doctor_name": apt.doctor_name,
                "clinic_name": apt.clinic_name,
                "patient_name": apt.patient_name,
                "patient_phone": apt.patient_phone,
                "appointment_date": apt.appointment_date,
                "time_slot": apt.time_slot,
                "token_number": apt.token_number,
                "status": apt.status,
                "fee_amount": apt.fee_amount,
                "payment_status": apt.payment_status,
                "payment_mode": apt.payment_mode
            }

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
            
            if apt.get("status") in ["waiting", "in_waiting"]:
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
async def call_token(payload: CallTokenRequest, db: Session = Depends(get_db)):
    apt = APPOINTMENTS_DB.get(payload.appointment_number)
    if not apt:
        # Check DB
        db_apt = db.query(Appointment).filter(Appointment.appointment_number == payload.appointment_number).first()
        if not db_apt:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment token not found.")
        apt = {
            "appointment_number": db_apt.appointment_number,
            "doctor_slug": db_apt.doctor_slug,
            "doctor_name": db_apt.doctor_name,
            "patient_name": db_apt.patient_name,
            "token_number": db_apt.token_number,
            "status": db_apt.status
        }
        APPOINTMENTS_DB[payload.appointment_number] = apt

    # Mark any previous in_consultation as completed
    for other in APPOINTMENTS_DB.values():
        if other["doctor_slug"] == apt["doctor_slug"] and other["status"] == "in_consultation":
            other["status"] = "completed"

    # Set current to in_consultation
    apt["status"] = "in_consultation"

    # Sync to DB
    db_rec = db.query(Appointment).filter(Appointment.appointment_number == payload.appointment_number).first()
    if db_rec:
        db_rec.status = "in_consultation"
        db.commit()

    # Real-time Broadcast to all waiting rooms & front desk screens
    await broadcast_event("token_called", {
        "token_number": apt["token_number"],
        "appointment_number": apt["appointment_number"],
        "patient_name": apt["patient_name"],
        "doctor_name": apt.get("doctor_name", "Dr. Rahul Sharma"),
        "trigger_chime": True,
        "status": "in_consultation"
    })

    return {
        "status": "success",
        "called_token": apt["token_number"],
        "patient_name": apt["patient_name"],
        "doctor_name": apt.get("doctor_name", "Dr. Rahul Sharma"),
        "message": f"Token #{apt['token_number']} ({apt['patient_name']}) called to chamber."
    }

@router.post("/complete-token")
async def complete_token(payload: CallTokenRequest, db: Session = Depends(get_db)):
    apt = APPOINTMENTS_DB.get(payload.appointment_number)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment token not found.")

    apt["status"] = "completed"

    db_rec = db.query(Appointment).filter(Appointment.appointment_number == payload.appointment_number).first()
    if db_rec:
        db_rec.status = "completed"
        db.commit()

    await broadcast_event("token_completed", {
        "token_number": apt["token_number"],
        "appointment_number": apt["appointment_number"],
        "patient_name": apt["patient_name"],
        "status": "completed"
    })

    return {
        "status": "success",
        "completed_token": apt["token_number"],
        "message": f"Token #{apt['token_number']} marked completed."
    }

@router.post("/walk-in")
async def register_walk_in(payload: WalkInRequest, db: Session = Depends(get_db)):
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

    # Persist to database
    db_apt = Appointment(
        id=str(uuid.uuid4()),
        appointment_number=apt_number,
        doctor_slug=payload.doctor_slug,
        doctor_name="Dr. Rahul Sharma",
        clinic_name="Derma Care Skin & Laser Centre",
        patient_name=payload.patient_name,
        patient_phone=payload.patient_phone,
        appointment_date=today_str,
        time_slot=f"Walk-In Token #{assigned_token}",
        token_number=assigned_token,
        status="in_waiting",
        fee_amount=payload.fee_amount,
        payment_status="paid",
        payment_mode=payload.payment_mode
    )
    db.add(db_apt)
    db.commit()

    # Broadcast new walk-in token to all waiting screens
    await broadcast_event("walk_in_registered", {
        "token_number": assigned_token,
        "appointment_number": apt_number,
        "patient_name": payload.patient_name,
        "status": "in_waiting"
    })

    return {
        "status": "success",
        "appointment": new_apt,
        "message": f"Walk-in registered! Token #{assigned_token} issued to {payload.patient_name}."
    }

@router.post("/update-payment")
async def update_payment(payload: UpdatePaymentRequest, db: Session = Depends(get_db)):
    apt = APPOINTMENTS_DB.get(payload.appointment_number)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found.")

    apt["payment_status"] = payload.payment_status
    apt["payment_mode"] = payload.payment_mode

    db_rec = db.query(Appointment).filter(Appointment.appointment_number == payload.appointment_number).first()
    if db_rec:
        db_rec.payment_status = payload.payment_status
        db_rec.payment_mode = payload.payment_mode
        db.commit()

    await broadcast_event("payment_updated", {
        "appointment_number": apt["appointment_number"],
        "payment_status": payload.payment_status,
        "payment_mode": payload.payment_mode
    })

    return {
        "status": "success",
        "appointment_number": apt["appointment_number"],
        "payment_status": apt["payment_status"],
        "payment_mode": apt["payment_mode"]
    }
