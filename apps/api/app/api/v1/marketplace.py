from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import random

from app.db.session import get_db
from app.db.models import MarketplaceInquiry, PartnerApplication

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

# ============================================================================
# SCHEMAS
# ============================================================================

class InquiryItem(BaseModel):
    name: str
    qty: int = 1
    form: Optional[str] = "Tablet"
    price: Optional[float] = 0.0

class CreateInquiryRequest(BaseModel):
    inquiry_type: str # "medicine" or "lab_test"
    patient_name: str
    patient_phone: str
    locality: str = "Rajpur Road, Dehradun"
    target_entity_name: str # Pharmacy or Lab Name
    target_entity_phone: str
    items: List[InquiryItem] = []
    prescription_preview: Optional[str] = None
    notes: Optional[str] = None
    channel: str = "whatsapp" # "whatsapp", "call", "counter_slip"

class UpdateInquiryStatusRequest(BaseModel):
    status: str # "dispatched", "contacted", "fulfilled", "cancelled"

class PartnerJoinRequest(BaseModel):
    partner_type: str # "pharmacy" or "diagnostic_lab"
    business_name: str
    contact_person: str
    phone: str
    whatsapp: str
    locality: str
    address: str
    license_number: Optional[str] = None
    home_service: bool = True

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
def create_inquiry(req: CreateInquiryRequest, db: Session = Depends(get_db)):
    prefix = "COS-MED" if req.inquiry_type == "medicine" else "COS-LAB"
    token_num = random.randint(1000, 9999)
    inquiry_token = f"{prefix}-{token_num}"

    new_inquiry = MarketplaceInquiry(
        id=str(uuid.uuid4()),
        inquiry_token=inquiry_token,
        inquiry_type=req.inquiry_type,
        patient_name=req.patient_name,
        patient_phone=req.patient_phone,
        locality=req.locality,
        target_entity_name=req.target_entity_name,
        target_entity_phone=req.target_entity_phone,
        items=[item.model_dump() for item in req.items],
        prescription_preview=req.prescription_preview,
        notes=req.notes,
        channel=req.channel,
        status="dispatched",
        created_at=datetime.utcnow()
    )
    db.add(new_inquiry)
    db.commit()
    db.refresh(new_inquiry)
    return {
        "success": True,
        "inquiry_token": new_inquiry.inquiry_token,
        "id": new_inquiry.id,
        "status": new_inquiry.status,
        "target_entity": new_inquiry.target_entity_name,
        "channel": new_inquiry.channel
    }

@router.get("/inquiries")
def list_inquiries(
    inquiry_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MarketplaceInquiry)
    if inquiry_type:
        query = query.filter(MarketplaceInquiry.inquiry_type == inquiry_type)
    if status_filter:
        query = query.filter(MarketplaceInquiry.status == status_filter)
    
    inquiries = query.order_by(MarketplaceInquiry.created_at.desc()).all()
    return [
        {
            "id": inq.id,
            "inquiry_token": inq.inquiry_token,
            "inquiry_type": inq.inquiry_type,
            "patient_name": inq.patient_name,
            "patient_phone": inq.patient_phone,
            "locality": inq.locality,
            "target_entity_name": inq.target_entity_name,
            "target_entity_phone": inq.target_entity_phone,
            "items": inq.items,
            "prescription_preview": inq.prescription_preview,
            "notes": inq.notes,
            "channel": inq.channel,
            "status": inq.status,
            "created_at": inq.created_at.isoformat() if inq.created_at else None
        }
        for inq in inquiries
    ]

@router.patch("/inquiries/{inquiry_id}/status")
def update_inquiry_status(
    inquiry_id: str,
    req: UpdateInquiryStatusRequest,
    db: Session = Depends(get_db)
):
    inquiry = db.query(MarketplaceInquiry).filter(MarketplaceInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    inquiry.status = req.status
    db.commit()
    return {"success": True, "id": inquiry.id, "status": inquiry.status}

@router.post("/partners", status_code=status.HTTP_201_CREATED)
def register_partner(req: PartnerJoinRequest, db: Session = Depends(get_db)):
    partner = PartnerApplication(
        id=str(uuid.uuid4()),
        partner_type=req.partner_type,
        business_name=req.business_name,
        contact_person=req.contact_person,
        phone=req.phone,
        whatsapp=req.whatsapp,
        locality=req.locality,
        address=req.address,
        license_number=req.license_number,
        home_service=req.home_service,
        is_verified=True, # Auto-verify initial pilot partners with instant badge
        status="verified",
        created_at=datetime.utcnow()
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return {
        "success": True,
        "id": partner.id,
        "business_name": partner.business_name,
        "is_verified": partner.is_verified,
        "status": partner.status,
        "message": f"Namaste {partner.contact_person}! Your {partner.partner_type} profile is verified on ClinicOS."
    }

@router.get("/partners")
def list_partners(
    partner_type: Optional[str] = None,
    locality: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PartnerApplication)
    if partner_type:
        query = query.filter(PartnerApplication.partner_type == partner_type)
    if locality:
        query = query.filter(PartnerApplication.locality.ilike(f"%{locality}%"))
    
    partners = query.order_by(PartnerApplication.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "partner_type": p.partner_type,
            "business_name": p.business_name,
            "contact_person": p.contact_person,
            "phone": p.phone,
            "whatsapp": p.whatsapp,
            "locality": p.locality,
            "address": p.address,
            "license_number": p.license_number,
            "home_service": p.home_service,
            "is_verified": p.is_verified,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in partners
    ]

@router.patch("/partners/{partner_id}/verify")
def verify_partner(partner_id: str, db: Session = Depends(get_db)):
    partner = db.query(PartnerApplication).filter(PartnerApplication.id == partner_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    partner.is_verified = True
    partner.status = "verified"
    db.commit()
    return {"success": True, "id": partner.id, "status": partner.status}
