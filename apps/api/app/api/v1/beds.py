from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import math
import uuid

from app.db.session import get_db
from sqlalchemy.orm import Session
from app.db.models import ClinicWard, ClinicBed

router = APIRouter(prefix="/beds", tags=["Inpatient Beds & Ward Matrix"])

# Pydantic Schemas
class AdmitPatientRequest(BaseModel):
    bed_id: str
    patient_name: str = Field(..., min_length=2, max_length=150)
    patient_phone: str = Field(..., min_length=10, max_length=20)
    assigned_doctor_name: str = "Dr. Rahul Sharma"
    admission_notes: Optional[str] = "Routine clinical observation."

class DischargePatientRequest(BaseModel):
    bed_id: str
    payment_mode: str = "upi" # upi or cash
    mark_as_maintenance: bool = False # if sanitization is needed before next patient

class UpdateBedStatusRequest(BaseModel):
    bed_id: str
    status: str # vacant, occupied, discharge_pending, maintenance

class TransferBedRequest(BaseModel):
    from_bed_id: str
    to_bed_id: str
    reason: Optional[str] = "Patient requested room upgrade."

@router.get("")
def get_beds_and_wards(
    clinic_slug: str = "derma-care-dehradun", 
    ward_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Fetch wards
    wards_query = db.query(ClinicWard).filter(ClinicWard.clinic_slug == clinic_slug)
    if ward_type and ward_type != "all":
        wards_query = wards_query.filter(ClinicWard.ward_type == ward_type)
    wards = wards_query.all()
    wards_map = {w.id: w for w in wards}

    # Fetch beds
    beds_query = db.query(ClinicBed).filter(ClinicBed.clinic_slug == clinic_slug)
    if ward_type and ward_type != "all":
        bed_ward_ids = [w.id for w in wards]
        beds_query = beds_query.filter(ClinicBed.ward_id.in_(bed_ward_ids))
    beds = beds_query.all()

    now = datetime.utcnow()
    total_beds = len(beds)
    occupied_count = 0
    vacant_count = 0
    discharge_pending_count = 0
    maintenance_count = 0
    estimated_daily_revenue = 0.0

    beds_output = []
    for b in beds:
        ward = wards_map.get(b.ward_id)
        ward_name = ward.name if ward else "General Ward"
        w_type = ward.ward_type if ward else "general"
        d_rate = ward.daily_rate if ward else 1000.0
        h_rate = ward.hourly_rate if ward else 100.0

        stay_hours = 0.0
        accrued_charge = 0.0

        if b.status in ["occupied", "discharge_pending"]:
            if b.status == "occupied":
                occupied_count += 1
            else:
                discharge_pending_count += 1
            
            estimated_daily_revenue += d_rate

            if b.admission_timestamp:
                elapsed_seconds = max(0, (now - b.admission_timestamp).total_seconds())
                stay_hours = round(elapsed_seconds / 3600, 1)
                
                # If under 12 hours, charge hourly, else per full/half day
                if stay_hours <= 12:
                    accrued_charge = round(stay_hours * h_rate, 2)
                else:
                    days = math.ceil(stay_hours / 24)
                    accrued_charge = round(days * d_rate, 2)
        elif b.status == "vacant":
            vacant_count += 1
        elif b.status == "maintenance":
            maintenance_count += 1

        beds_output.append({
            "id": b.id,
            "clinic_slug": b.clinic_slug,
            "ward_id": b.ward_id,
            "ward_name": ward_name,
            "ward_type": w_type,
            "bed_number": b.bed_number,
            "status": b.status,
            "current_patient_name": b.current_patient_name,
            "current_patient_phone": b.current_patient_phone,
            "assigned_doctor_name": b.assigned_doctor_name,
            "admission_notes": b.admission_notes,
            "admission_timestamp": b.admission_timestamp.isoformat() if b.admission_timestamp else None,
            "daily_rate": d_rate,
            "hourly_rate": h_rate,
            "stay_hours": stay_hours,
            "accrued_charge": accrued_charge,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })

    # Sort beds by bed number
    beds_output.sort(key=lambda x: x["bed_number"])

    occupancy_rate = round((occupied_count + discharge_pending_count) / total_beds * 100, 1) if total_beds > 0 else 0.0

    return {
        "status": "success",
        "clinic_slug": clinic_slug,
        "metrics": {
            "total_beds": total_beds,
            "occupied_count": occupied_count,
            "vacant_count": vacant_count,
            "discharge_pending_count": discharge_pending_count,
            "maintenance_count": maintenance_count,
            "occupancy_rate_percent": occupancy_rate,
            "estimated_daily_revenue": estimated_daily_revenue
        },
        "wards": [
            {
                "id": w.id,
                "name": w.name,
                "ward_type": w.ward_type,
                "daily_rate": w.daily_rate,
                "hourly_rate": w.hourly_rate,
                "total_beds": len([b for b in beds if b.ward_id == w.id]),
                "occupied_beds": len([b for b in beds if b.ward_id == w.id and b.status in ["occupied", "discharge_pending"]])
            }
            for w in wards
        ],
        "beds": beds_output
    }

@router.post("/admit")
def admit_patient(req: AdmitPatientRequest, db: Session = Depends(get_db)):
    bed = db.query(ClinicBed).filter(ClinicBed.id == req.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found.")
    
    if bed.status == "occupied":
        raise HTTPException(status_code=400, detail=f"Bed {bed.bed_number} is already occupied.")

    bed.status = "occupied"
    bed.current_patient_name = req.patient_name
    bed.current_patient_phone = req.patient_phone
    bed.assigned_doctor_name = req.assigned_doctor_name
    bed.admission_notes = req.admission_notes
    bed.admission_timestamp = datetime.utcnow()

    db.commit()
    db.refresh(bed)

    return {
        "status": "success",
        "message": f"Patient {req.patient_name} admitted to Bed {bed.bed_number}",
        "bed_id": bed.id,
        "bed_number": bed.bed_number,
        "admission_timestamp": bed.admission_timestamp.isoformat()
    }

@router.post("/discharge")
def discharge_patient(req: DischargePatientRequest, db: Session = Depends(get_db)):
    bed = db.query(ClinicBed).filter(ClinicBed.id == req.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found.")
    
    if bed.status == "vacant":
        raise HTTPException(status_code=400, detail=f"Bed {bed.bed_number} is already vacant.")

    ward = db.query(ClinicWard).filter(ClinicWard.id == bed.ward_id).first()
    daily_rate = ward.daily_rate if ward else 1000.0
    hourly_rate = ward.hourly_rate if ward else 100.0

    now = datetime.utcnow()
    stay_hours = 1.0
    if bed.admission_timestamp:
        elapsed = (now - bed.admission_timestamp).total_seconds()
        stay_hours = max(1.0, round(elapsed / 3600, 1))

    # Billing calculation
    if stay_hours <= 12:
        total_bill = round(stay_hours * hourly_rate, 2)
        billing_basis = f"{stay_hours} hours @ ₹{hourly_rate}/hr"
    else:
        days = math.ceil(stay_hours / 24)
        total_bill = round(days * daily_rate, 2)
        billing_basis = f"{days} day(s) @ ₹{daily_rate}/day"

    receipt_code = f"DISC-{bed.bed_number}-{uuid.uuid4().hex[:6].upper()}"

    discharge_summary = {
        "receipt_number": receipt_code,
        "patient_name": bed.current_patient_name,
        "patient_phone": bed.current_patient_phone,
        "assigned_doctor": bed.assigned_doctor_name,
        "bed_number": bed.bed_number,
        "ward_name": ward.name if ward else "General Ward",
        "admission_time": bed.admission_timestamp.strftime("%Y-%m-%d %I:%M %p") if bed.admission_timestamp else "N/A",
        "discharge_time": now.strftime("%Y-%m-%d %I:%M %p"),
        "total_stay_hours": stay_hours,
        "billing_basis": billing_basis,
        "room_charges": total_bill,
        "payment_mode": req.payment_mode.upper(),
        "payment_status": "PAID"
    }

    # Reset bed
    bed.status = "maintenance" if req.mark_as_maintenance else "vacant"
    bed.current_patient_name = None
    bed.current_patient_phone = None
    bed.assigned_doctor_name = None
    bed.admission_notes = None
    bed.admission_timestamp = None

    db.commit()

    return {
        "status": "success",
        "message": f"Patient discharged from Bed {bed.bed_number}. Receipt generated.",
        "invoice": discharge_summary
    }

@router.post("/status")
def update_bed_status(req: UpdateBedStatusRequest, db: Session = Depends(get_db)):
    bed = db.query(ClinicBed).filter(ClinicBed.id == req.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found.")
    
    bed.status = req.status
    if req.status in ["vacant", "maintenance"]:
        bed.current_patient_name = None
        bed.current_patient_phone = None
        bed.admission_timestamp = None

    db.commit()
    db.refresh(bed)

    return {
        "status": "success",
        "message": f"Bed {bed.bed_number} status updated to {req.status}",
        "bed_number": bed.bed_number,
        "new_status": bed.status
    }
