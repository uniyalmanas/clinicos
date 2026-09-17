from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.ai.onboarding_agent import extract_doctor_and_clinic
import re
import uuid

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

class ExtractRequest(BaseModel):
    raw_text: str
    document_base64: Optional[str] = None

class PublishRequest(BaseModel):
    phone: str
    doctor: Dict[str, Any]
    clinic: Dict[str, Any]
    ai_bio: Optional[str] = None

# In-memory store for newly published profiles during development
DOCTORS_DATABASE = {}
CLINICS_DATABASE = {}

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[-\s]+', '-', text)

@router.post("/extract")
def extract_onboarding_data(payload: ExtractRequest):
    if not payload.raw_text or len(payload.raw_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a more detailed description of yourself, your practice, or clinic."
        )
    
    extracted = extract_doctor_and_clinic(payload.raw_text, payload.document_base64)
    return {
        "status": "success",
        "data": extracted
    }

@router.post("/publish")
def publish_onboarding_profile(payload: PublishRequest):
    doc = payload.doctor
    cln = payload.clinic

    doc_slug = slugify(doc.get("full_name", f"dr-{uuid.uuid4().hex[:6]}"))
    clinic_slug = slugify(cln.get("name", f"clinic-{uuid.uuid4().hex[:6]}"))

    doc_id = str(uuid.uuid4())
    clinic_id = str(uuid.uuid4())

    doctor_record = {
        "id": doc_id,
        "slug": doc_slug,
        "title": "Dr.",
        "full_name": doc.get("full_name"),
        "medical_council_reg_number": doc.get("medical_council_reg_number", "UKMC-TEMP-2026"),
        "medical_council_state": doc.get("medical_council_state", "Uttarakhand Medical Council"),
        "qualification_summary": doc.get("qualifications", "MBBS"),
        "specialization": doc.get("specialization", "General Physician"),
        "sub_specializations": doc.get("sub_specializations", []),
        "years_of_experience": doc.get("years_of_experience", 5),
        "languages_spoken": ["English", "Hindi"],
        "bio": payload.ai_bio or f"{doc.get('full_name')} practices in {cln.get('city')}.",
        "consultation_fee": float(doc.get("consultation_fee", 500)),
        "followup_fee": float(doc.get("followup_fee", 200)),
        "followup_validity_days": 7,
        "services_offered": [{"name": s, "fee": float(doc.get("consultation_fee", 500))} for s in doc.get("services", [])],
        "verification_status": "verified",
        "rating": 5.0,
        "total_reviews": 1,
        "clinic_id": clinic_id,
        "clinic_name": cln.get("name"),
        "clinic_slug": clinic_slug,
        "clinic_address": f"{cln.get('address_line')}, {cln.get('city')}"
    }

    clinic_record = {
        "id": clinic_id,
        "slug": clinic_slug,
        "name": cln.get("name"),
        "phone": payload.phone,
        "address_line": cln.get("address_line"),
        "city": cln.get("city"),
        "state": cln.get("state", "Uttarakhand"),
        "postal_code": cln.get("postal_code", "248001"),
        "facilities": ["AC", "Wheelchair Accessible", "WiFi"],
        "opening_hours": cln.get("opening_hours", {"all_days": "10:00 AM - 08:00 PM"}),
        "status": "active",
        "doctors": [doctor_record]
    }

    DOCTORS_DATABASE[doc_slug] = doctor_record
    CLINICS_DATABASE[clinic_slug] = clinic_record

    return {
        "status": "published",
        "doctor_slug": doc_slug,
        "clinic_slug": clinic_slug,
        "doctor_url": f"/doctors/{doc_slug}",
        "clinic_url": f"/clinics/{clinic_slug}",
        "message": f"Congratulations {doc.get('full_name')}! Your clinic is now live."
    }
