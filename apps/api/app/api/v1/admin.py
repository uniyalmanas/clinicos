from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.api.v1.doctors import SEED_DOCTORS
from app.api.v1.onboarding import DOCTORS_DATABASE
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.db.models import Doctor as DoctorModel

router = APIRouter(prefix="/admin", tags=["SuperAdmin Governance & Analytics"])

class VerifyDoctorRequest(BaseModel):
    doctor_slug: str
    verification_status: str = Field(..., pattern="^(verified|pending|rejected)$")
    admin_notes: Optional[str] = None

class SubscriptionActionRequest(BaseModel):
    clinic_slug: str
    action: str = Field(..., pattern="^(extend_7d|paid_30d|suspend)$")

# In-memory clinic tenants directory for SaaS billing
TENANTS_DB = [
    {
        "clinic_slug": "derma-care-dehradun",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "doctor_name": "Dr. Rahul Sharma",
        "plan": "Solo Pro (₹499/mo)",
        "monthly_rate": 499.0,
        "subscription_status": "active",
        "days_remaining": 26,
        "tokens_today": 4,
        "is_verified": True
    },
    {
        "clinic_slug": "smile-craft-dental",
        "clinic_name": "Smile Craft Multi-Speciality Dental",
        "doctor_name": "Dr. Aditi Joshi",
        "plan": "Solo Pro (₹499/mo)",
        "monthly_rate": 499.0,
        "subscription_status": "active",
        "days_remaining": 18,
        "tokens_today": 3,
        "is_verified": True
    },
    {
        "clinic_slug": "dron-child-clinic",
        "clinic_name": "Dron Child & Newborn Health Centre",
        "doctor_name": "Dr. Vikram Sethi",
        "plan": "Multi-Doctor Clinic (₹1,999/mo)",
        "monthly_rate": 1999.0,
        "subscription_status": "trial",
        "days_remaining": 5,
        "tokens_today": 5,
        "is_verified": True
    }
]

@router.get("/analytics")
def get_platform_analytics():
    # Calculate Verified Paid MRR
    active_tenants = [t for t in TENANTS_DB if t["subscription_status"] == "active"]
    paid_mrr = sum(t["monthly_rate"] for t in active_tenants)
    annual_run_rate = paid_mrr * 12

    return {
        "status": "success",
        "kpis": {
            "verified_paid_mrr": paid_mrr,
            "annual_run_rate": annual_run_rate,
            "total_clinics": len(TENANTS_DB),
            "active_paying_clinics": len(active_tenants),
            "trial_clinics": len([t for t in TENANTS_DB if t["subscription_status"] == "trial"]),
            "total_tokens_processed": 348,
            "ai_tokens_used": 142500,
            "ai_cost_usd": 0.21,
            "ai_cost_inr": 17.50
        },
        "tenants": TENANTS_DB
    }

@router.get("/verifications")
def list_doctor_verifications(db: Session = Depends(get_db)):
    db_docs = db.query(DoctorModel).all()
    results = []
    seen_slugs = set()

    for d in db_docs:
        results.append({
            "slug": d.slug,
            "full_name": d.full_name,
            "specialization": d.specialization,
            "qualification_summary": d.qualification_summary,
            "medical_council_reg_number": d.medical_council_reg_number,
            "medical_council_state": d.medical_council_state,
            "clinic_name": d.clinic_name,
            "verification_status": d.verification_status
        })
        seen_slugs.add(d.slug)

    all_docs = {**SEED_DOCTORS, **DOCTORS_DATABASE}
    for d in all_docs.values():
        if d["slug"] not in seen_slugs:
            results.append({
                "slug": d["slug"],
                "full_name": d["full_name"],
                "specialization": d["specialization"],
                "qualification_summary": d["qualification_summary"],
                "medical_council_reg_number": d["medical_council_reg_number"],
                "medical_council_state": d["medical_council_state"],
                "clinic_name": d["clinic_name"],
                "verification_status": d["verification_status"]
            })
            seen_slugs.add(d["slug"])

    return results

@router.post("/verify")
def verify_doctor(payload: VerifyDoctorRequest, db: Session = Depends(get_db)):
    # 1. Update in SQLite DB if present
    db_doc = db.query(DoctorModel).filter(DoctorModel.slug == payload.doctor_slug).first()
    if db_doc:
        db_doc.verification_status = payload.verification_status
        db.commit()

    # 2. Sync in-memory dicts
    all_docs = {**SEED_DOCTORS, **DOCTORS_DATABASE}
    doc = all_docs.get(payload.doctor_slug)
    if doc:
        doc["verification_status"] = payload.verification_status

    if not db_doc and not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found.")

    name = db_doc.full_name if db_doc else doc["full_name"]
    return {
        "status": "success",
        "doctor_slug": payload.doctor_slug,
        "verification_status": payload.verification_status,
        "message": f"{name} marked as {payload.verification_status.upper()}."
    }

@router.post("/subscription")
def update_subscription(payload: SubscriptionActionRequest):
    tenant = next((t for t in TENANTS_DB if t["clinic_slug"] == payload.clinic_slug), None)
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant clinic not found.")

    if payload.action == "paid_30d":
        tenant["subscription_status"] = "active"
        tenant["days_remaining"] = 30
        msg = f"Subscription extended by 30 days for {tenant['clinic_name']}."
    elif payload.action == "extend_7d":
        tenant["days_remaining"] += 7
        msg = f"Free trial extended by 7 days for {tenant['clinic_name']}."
    else:
        tenant["subscription_status"] = "suspended"
        tenant["days_remaining"] = 0
        msg = f"{tenant['clinic_name']} account suspended."

    return {
        "status": "success",
        "tenant": tenant,
        "message": msg
    }
