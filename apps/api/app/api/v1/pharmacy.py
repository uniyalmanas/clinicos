from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import uuid

from app.db.session import get_db
from app.db.models import PharmacyItem, PharmacyDispense, Prescription
from app.api.v1.auth import require_active_tenant

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"], dependencies=[Depends(require_active_tenant)])

class PharmacyItemCreate(BaseModel):
    clinic_slug: str = "derma-care-dehradun"
    brand_name: str
    generic_name: str
    dosage_form: str = "Tablet"
    strength: Optional[str] = "100mg"
    batch_number: str
    expiry_date: str # YYYY-MM-DD
    current_stock: int = 50
    reorder_level: int = 15
    purchase_price: float = 30.0
    mrp: float = 65.0
    selling_price: float = 60.0
    gst_rate: float = 12.0
    hsn_code: Optional[str] = "3004"
    manufacturer: Optional[str] = "Sun Pharma"
    rack_location: Optional[str] = "Rack A-01"

class StockAdjustRequest(BaseModel):
    new_stock: int

class BillItemSchema(BaseModel):
    item_id: Optional[str] = None
    brand_name: str
    batch_number: str
    dosage_form: str = "Tablet"
    quantity: int = 1
    unit_price: float
    total: float
    gst_rate: float = 12.0

class DispenseRequest(BaseModel):
    clinic_slug: str = "derma-care-dehradun"
    prescription_number: Optional[str] = None
    patient_name: str
    patient_phone: Optional[str] = None
    doctor_name: Optional[str] = None
    items: List[BillItemSchema]
    discount: float = 0.0
    payment_mode: str = "upi"

def enrich_item(item: PharmacyItem):
    today = date.today()
    try:
        exp = datetime.strptime(item.expiry_date, "%Y-%m-%d").date()
        days_to_expiry = (exp - today).days
    except Exception:
        days_to_expiry = 365

    return {
        "id": item.id,
        "clinic_slug": item.clinic_slug,
        "brand_name": item.brand_name,
        "generic_name": item.generic_name,
        "dosage_form": item.dosage_form,
        "strength": item.strength,
        "batch_number": item.batch_number,
        "expiry_date": item.expiry_date,
        "days_to_expiry": days_to_expiry,
        "is_expiring_soon": days_to_expiry <= 60,
        "is_expired": days_to_expiry <= 0,
        "current_stock": item.current_stock,
        "reorder_level": item.reorder_level,
        "is_low_stock": item.current_stock <= item.reorder_level,
        "purchase_price": item.purchase_price,
        "mrp": item.mrp,
        "selling_price": item.selling_price,
        "gst_rate": item.gst_rate,
        "hsn_code": item.hsn_code,
        "manufacturer": item.manufacturer,
        "rack_location": item.rack_location,
        "created_at": item.created_at.isoformat() if item.created_at else None
    }

@router.get("/inventory")
def get_inventory(
    clinic_slug: str = "derma-care-dehradun", 
    filter_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PharmacyItem).filter(PharmacyItem.clinic_slug == clinic_slug)
    raw_items = query.all()

    enriched = [enrich_item(item) for item in raw_items]

    # Calculate summary metrics
    total_skus = len(enriched)
    total_stock_units = sum(i["current_stock"] for i in enriched)
    total_inventory_mrp = sum(i["current_stock"] * i["mrp"] for i in enriched)
    low_stock_count = sum(1 for i in enriched if i["is_low_stock"])
    expiring_soon_count = sum(1 for i in enriched if i["is_expiring_soon"])

    filtered = enriched
    if filter_type == "expiring_soon":
        filtered = [i for i in enriched if i["is_expiring_soon"]]
    elif filter_type == "low_stock":
        filtered = [i for i in enriched if i["is_low_stock"]]

    return {
        "status": "success",
        "summary": {
            "total_skus": total_skus,
            "total_stock_units": total_stock_units,
            "total_inventory_mrp": round(total_inventory_mrp, 2),
            "low_stock_count": low_stock_count,
            "expiring_soon_count": expiring_soon_count
        },
        "items": filtered
    }

@router.post("/inventory")
def add_inventory_item(payload: PharmacyItemCreate, db: Session = Depends(get_db)):
    new_item = PharmacyItem(
        id=str(uuid.uuid4()),
        clinic_slug=payload.clinic_slug,
        brand_name=payload.brand_name,
        generic_name=payload.generic_name.upper(),
        dosage_form=payload.dosage_form,
        strength=payload.strength,
        batch_number=payload.batch_number.upper(),
        expiry_date=payload.expiry_date,
        current_stock=payload.current_stock,
        reorder_level=payload.reorder_level,
        purchase_price=payload.purchase_price,
        mrp=payload.mrp,
        selling_price=payload.selling_price,
        gst_rate=payload.gst_rate,
        hsn_code=payload.hsn_code,
        manufacturer=payload.manufacturer,
        rack_location=payload.rack_location
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"status": "success", "item": enrich_item(new_item)}

@router.put("/inventory/{item_id}/stock")
def update_stock(item_id: str, payload: StockAdjustRequest, db: Session = Depends(get_db)):
    item = db.query(PharmacyItem).filter(PharmacyItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pharmacy item not found")
    
    item.current_stock = payload.new_stock
    db.commit()
    return {"status": "success", "item": enrich_item(item)}

@router.get("/prescriptions-queue")
def get_prescriptions_queue(clinic_slug: str = "derma-care-dehradun", db: Session = Depends(get_db)):
    # Fetch all prescriptions
    prescriptions = db.query(Prescription).order_by(Prescription.created_at.desc()).all()
    
    # Also fetch existing dispense bill prescription numbers to flag dispensed status
    dispenses = db.query(PharmacyDispense).filter(PharmacyDispense.clinic_slug == clinic_slug).all()
    dispensed_rx_numbers = {d.prescription_number for d in dispenses if d.prescription_number}

    queue = []
    for rx in prescriptions:
        queue.append({
            "id": rx.id,
            "prescription_number": rx.prescription_number,
            "patient_name": rx.patient_name,
            "patient_phone": rx.patient_phone,
            "doctor_name": rx.doctor_name,
            "items": rx.items or [],
            "diagnosis": rx.provisional_diagnosis,
            "instructions": rx.instructions,
            "created_at": rx.created_at.isoformat() if rx.created_at else None,
            "is_dispensed": rx.prescription_number in dispensed_rx_numbers
        })

    return {"status": "success", "queue": queue}

@router.post("/dispense")
def dispense_prescription(payload: DispenseRequest, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="At least one medicine item is required to dispense a prescription.")

    if payload.discount < 0:
        raise HTTPException(status_code=400, detail="Discount cannot be negative.")

    prescription = None
    if payload.prescription_number:
        prescription = db.query(Prescription).filter(
            Prescription.prescription_number == payload.prescription_number
        ).first()
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found.")

        existing_dispense = db.query(PharmacyDispense).filter(
            PharmacyDispense.prescription_number == payload.prescription_number,
            PharmacyDispense.status == "dispensed"
        ).first()
        if existing_dispense:
            raise HTTPException(status_code=409, detail="This prescription has already been dispensed.")

    subtotal = sum(i.total for i in payload.items)
    gst_total = sum(round((i.total * (i.gst_rate / 100)), 2) for i in payload.items)
    total_amount = round(subtotal - payload.discount + gst_total, 2)

    # Generate sequential Bill Number
    bill_count = db.query(PharmacyDispense).count() + 1
    bill_number = f"BILL-PHARM-2026-{bill_count:04d}"

    inventory_updates = []
    requested_by_item: Dict[str, int] = {}
    for item in payload.items:
        # Match by id or batch_number
        db_item = None
        if item.item_id:
            db_item = db.query(PharmacyItem).filter(PharmacyItem.id == item.item_id).first()
        if not db_item and item.batch_number:
            db_item = db.query(PharmacyItem).filter(PharmacyItem.batch_number == item.batch_number).first()

        if not db_item:
            raise HTTPException(status_code=404, detail=f"Inventory batch not found for {item.brand_name}.")
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"Quantity must be positive for {item.brand_name}.")
        requested_by_item[db_item.id] = requested_by_item.get(db_item.id, 0) + item.quantity
        if db_item.current_stock < requested_by_item[db_item.id]:
            raise HTTPException(status_code=409, detail=f"Insufficient stock for {db_item.brand_name}.")
        if db_item.expiry_date <= str(date.today()):
            raise HTTPException(status_code=409, detail=f"Cannot dispense expired batch {db_item.batch_number}.")

        inventory_updates.append((db_item, item.quantity))

    # Apply stock deductions only after every item has passed validation.
    for db_item, quantity in inventory_updates:
        db_item.current_stock -= quantity

    new_bill = PharmacyDispense(
        id=str(uuid.uuid4()),
        bill_number=bill_number,
        clinic_slug=payload.clinic_slug,
        prescription_number=payload.prescription_number,
        patient_name=payload.patient_name,
        patient_phone=payload.patient_phone,
        doctor_name=payload.doctor_name,
        items=[i.dict() for i in payload.items],
        subtotal=round(subtotal, 2),
        discount=round(payload.discount, 2),
        gst_amount=gst_total,
        total_amount=total_amount,
        payment_mode=payload.payment_mode,
        status="dispensed",
        created_at=datetime.utcnow()
    )

    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)

    return {
        "status": "success",
        "bill": {
            "id": new_bill.id,
            "bill_number": new_bill.bill_number,
            "prescription_number": new_bill.prescription_number,
            "patient_name": new_bill.patient_name,
            "patient_phone": new_bill.patient_phone,
            "doctor_name": new_bill.doctor_name,
            "items": new_bill.items,
            "subtotal": new_bill.subtotal,
            "discount": new_bill.discount,
            "gst_amount": new_bill.gst_amount,
            "total_amount": new_bill.total_amount,
            "payment_mode": new_bill.payment_mode,
            "status": new_bill.status,
            "created_at": new_bill.created_at.isoformat()
        }
    }

@router.get("/bills")
def get_bills(clinic_slug: str = "derma-care-dehradun", db: Session = Depends(get_db)):
    bills = db.query(PharmacyDispense).filter(PharmacyDispense.clinic_slug == clinic_slug).order_by(PharmacyDispense.created_at.desc()).all()
    return {
        "status": "success",
        "bills": [
            {
                "id": b.id,
                "bill_number": b.bill_number,
                "prescription_number": b.prescription_number,
                "patient_name": b.patient_name,
                "patient_phone": b.patient_phone,
                "doctor_name": b.doctor_name,
                "items": b.items,
                "subtotal": b.subtotal,
                "discount": b.discount,
                "gst_amount": b.gst_amount,
                "total_amount": b.total_amount,
                "payment_mode": b.payment_mode,
                "status": b.status,
                "created_at": b.created_at.isoformat() if b.created_at else None
            }
            for b in bills
        ]
    }
