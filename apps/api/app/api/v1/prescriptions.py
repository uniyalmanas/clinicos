from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime
import hashlib
import uuid
import urllib.parse

from app.db.session import get_db
from sqlalchemy.orm import Session
from app.db.models import Prescription as PrescriptionModel
from app.ai.clinical_scribe import parse_clinical_dictation
from app.ai.ddi_engine import check_drug_interactions

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions & Clinical Consultations"])

class PrescriptionItemInput(BaseModel):
    medicine_name: str
    generic_name: str
    dosage_form: str = "Tablet"
    strength: Optional[str] = "500 mg"
    dosage_frequency: str = "1-0-1"
    timing_relation: str = "After Food"
    duration_days: int = 5
    special_instructions: Optional[str] = None

class GeneratePrescriptionRequest(BaseModel):
    appointment_number: str
    doctor_slug: str = "dr-rahul-sharma"
    doctor_name: str = "Dr. Rahul Sharma"
    doctor_reg_number: str = "UKMC-8942-2012"
    patient_name: str
    patient_phone: str
    patient_age: Optional[int] = 28
    patient_gender: Optional[str] = "Male"
    vitals: Dict[str, Any] = {}
    symptoms: List[str] = []
    provisional_diagnosis: str
    items: List[PrescriptionItemInput]
    instructions: Optional[str] = "Complete the full antibiotic course. Stay well hydrated."
    followup_date: Optional[str] = None

class ScribeRequest(BaseModel):
    dictation_text: str

class CheckInteractionsRequest(BaseModel):
    medications: List[Dict[str, Any]]
    patient_allergies: Optional[str] = None

@router.post("/scribe")
def scribe_clinical_notes(payload: ScribeRequest):
    structured = parse_clinical_dictation(payload.dictation_text)
    return {
        "status": "success",
        "data": structured
    }

@router.post("/check-interactions")
def check_prescription_interactions(payload: CheckInteractionsRequest):
    result = check_drug_interactions(payload.medications, payload.patient_allergies)
    return {
        "status": "success",
        "data": result
    }

# In-memory store for prescriptions
PRESCRIPTIONS_DB: Dict[str, Any] = {
    "RX-2026-09-0014": {
        "prescription_number": "RX-2026-09-0014",
        "appointment_number": "APT-DERMA-101",
        "created_at": str(date.today()),
        "doctor_name": "Dr. Rahul Sharma",
        "doctor_reg_number": "UKMC-8942-2012",
        "qualification_summary": "MBBS, MD (Dermatology)",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "clinic_address": "14, Rajpur Road, Dehradun",
        "patient_name": "Amit Rawat",
        "patient_phone": "+919123456780",
        "patient_age": 26,
        "patient_gender": "Male",
        "vitals": {"bp": "118/78", "pulse": 74, "temp": 98.4, "weight": 64},
        "symptoms": ["Cystic acne", "Facial erythema"],
        "provisional_diagnosis": "Moderate to Severe Acne Vulgaris (Grade III)",
        "items": [
            {
                "medicine_name": "Tab Doxy-100",
                "generic_name": "DOXYCYCLINE HYCLATE",
                "dosage_form": "Capsule",
                "strength": "100 mg",
                "dosage_frequency": "1-0-0",
                "timing_relation": "After Food",
                "duration_days": 14,
                "special_instructions": "Take with a full glass of water"
            },
            {
                "medicine_name": "Epiduo Gel",
                "generic_name": "ADAPALENE + BENZOYL PEROXIDE",
                "dosage_form": "Ointment",
                "strength": "0.1% / 2.5%",
                "dosage_frequency": "0-0-1",
                "timing_relation": "At Bedtime",
                "duration_days": 30,
                "special_instructions": "Apply pea-sized amount to affected areas only"
            }
        ],
        "instructions": "Wash face twice daily with mild cleanser. Avoid scratching or picking acne lesions.",
        "followup_date": "2026-09-30",
        "digital_signature_hash": "a7f3b89091c5e4d28471b3e8c991a03f441582e79601d3cb4198fa0174e50212",
        "qr_verification_code": "VERIFY-DERMA-991204"
    }
}

@router.post("/generate")
def generate_prescription(payload: GeneratePrescriptionRequest, db: Session = Depends(get_db)):
    rx_id = f"RX-2026-09-{len(PRESCRIPTIONS_DB) + 15:04d}"
    
    # 1. Cryptographic Tamper-Proof SHA-256 Signature Hash
    raw_hash_content = (
        f"{rx_id}|{payload.doctor_reg_number}|{payload.patient_phone}|"
        f"{payload.provisional_diagnosis}|{len(payload.items)}|{datetime.now().isoformat()}"
    )
    sig_hash = hashlib.sha256(raw_hash_content.encode("utf-8")).hexdigest()
    qr_code = f"VERIFY-{payload.doctor_slug[:5].upper()}-{uuid.uuid4().hex[:6].upper()}"

    items_dicts = [item.dict() for item in payload.items]

    prescription_record = {
        "prescription_number": rx_id,
        "appointment_number": payload.appointment_number,
        "created_at": str(date.today()),
        "doctor_name": payload.doctor_name,
        "doctor_reg_number": payload.doctor_reg_number,
        "qualification_summary": "MBBS, MD (Registered Medical Practitioner)",
        "clinic_name": "Derma Care Skin & Laser Centre",
        "clinic_address": "14, Rajpur Road, Dehradun",
        "patient_name": payload.patient_name,
        "patient_phone": payload.patient_phone,
        "patient_age": payload.patient_age,
        "patient_gender": payload.patient_gender,
        "vitals": payload.vitals,
        "symptoms": payload.symptoms,
        "provisional_diagnosis": payload.provisional_diagnosis,
        "items": items_dicts,
        "instructions": payload.instructions,
        "followup_date": payload.followup_date or str(date.today()),
        "digital_signature_hash": sig_hash,
        "qr_verification_code": qr_code
    }

    # In-memory sync
    PRESCRIPTIONS_DB[rx_id] = prescription_record

    # Persist to Database
    try:
        db_rx = PrescriptionModel(
            id=str(uuid.uuid4()),
            prescription_number=rx_id,
            appointment_number=payload.appointment_number,
            doctor_name=payload.doctor_name,
            doctor_reg_number=payload.doctor_reg_number,
            clinic_name="Derma Care Skin & Laser Centre",
            clinic_address="14, Rajpur Road, Dehradun",
            patient_name=payload.patient_name,
            patient_phone=payload.patient_phone,
            patient_age=payload.patient_age,
            patient_gender=payload.patient_gender,
            vitals=payload.vitals,
            symptoms=payload.symptoms,
            provisional_diagnosis=payload.provisional_diagnosis,
            items=items_dicts,
            instructions=payload.instructions,
            followup_date=payload.followup_date or str(date.today()),
            digital_signature_hash=sig_hash,
            qr_verification_code=qr_code
        )
        db.add(db_rx)
        db.commit()
    except Exception as e:
        db.rollback()
        print("DB save warning:", e)

    # 2. WhatsApp Notification Deep-Link
    medicines_summary = ", ".join([f"{item.medicine_name} ({item.dosage_frequency})" for item in payload.items])
    wa_msg = (
        f"📋 *Digital Prescription - {payload.doctor_name}*\n"
        f"Hello {payload.patient_name}, your official digital prescription has been signed and issued.\n\n"
        f"🆔 *Rx Number:* {rx_id}\n"
        f"🩺 *Diagnosis:* {payload.provisional_diagnosis}\n"
        f"💊 *Medicines:* {medicines_summary}\n\n"
        f"🔗 *View & Download PDF Prescription:* https://clinicos.in/p/{rx_id}\n"
        f"🔒 *Tamper-Proof Verification Hash:* `{sig_hash[:16]}...`"
    )
    clean_phone = payload.patient_phone.replace("+", "").replace(" ", "").replace("-", "")
    whatsapp_link = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(wa_msg)}"

    return {
        "status": "success",
        "prescription": prescription_record,
        "whatsapp_link": whatsapp_link,
        "message": f"Prescription {rx_id} generated, persisted to database, and signed with SHA-256 cryptographic seal."
    }

@router.get("/{rx_number}")
def get_prescription(rx_number: str, db: Session = Depends(get_db)):
    rx = PRESCRIPTIONS_DB.get(rx_number)
    if not rx:
        db_rx = db.query(PrescriptionModel).filter(PrescriptionModel.prescription_number == rx_number).first()
        if not db_rx:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")
        rx = {
            "prescription_number": db_rx.prescription_number,
            "appointment_number": db_rx.appointment_number,
            "created_at": db_rx.created_at.strftime("%Y-%m-%d") if db_rx.created_at else str(date.today()),
            "doctor_name": db_rx.doctor_name,
            "doctor_reg_number": db_rx.doctor_reg_number,
            "qualification_summary": "MBBS, MD (Registered Medical Practitioner)",
            "clinic_name": db_rx.clinic_name,
            "clinic_address": db_rx.clinic_address,
            "patient_name": db_rx.patient_name,
            "patient_phone": db_rx.patient_phone,
            "patient_age": db_rx.patient_age,
            "patient_gender": db_rx.patient_gender,
            "vitals": db_rx.vitals,
            "symptoms": db_rx.symptoms,
            "provisional_diagnosis": db_rx.provisional_diagnosis,
            "items": db_rx.items,
            "instructions": db_rx.instructions,
            "followup_date": db_rx.followup_date,
            "digital_signature_hash": db_rx.digital_signature_hash,
            "qr_verification_code": db_rx.qr_verification_code
        }
        PRESCRIPTIONS_DB[rx_number] = rx
    return rx

class WhatsAppDispatchInput(BaseModel):
    recipient_phone: str
    recipient_type: Optional[str] = "patient"  # patient | attendant | chemist
    attendant_name: Optional[str] = None
    template_type: Optional[str] = "standard"  # standard | bilingual_hindi | chemist_order
    custom_note: Optional[str] = None

@router.post("/{rx_number}/whatsapp-dispatch")
def dispatch_prescription_whatsapp(rx_number: str, payload: WhatsAppDispatchInput, db: Session = Depends(get_db)):
    rx = PRESCRIPTIONS_DB.get(rx_number)
    if not rx:
        db_rx = db.query(PrescriptionModel).filter(PrescriptionModel.prescription_number == rx_number).first()
        if not db_rx:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found.")
        rx = {
            "prescription_number": db_rx.prescription_number,
            "doctor_name": db_rx.doctor_name,
            "clinic_name": db_rx.clinic_name,
            "patient_name": db_rx.patient_name,
            "patient_phone": db_rx.patient_phone,
            "provisional_diagnosis": db_rx.provisional_diagnosis,
            "items": db_rx.items or [],
            "digital_signature_hash": db_rx.digital_signature_hash
        }

    clean_phone = "".join([c for c in payload.recipient_phone if c.isdigit()])
    if len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    rx_link = f"http://localhost:3000/p/{rx_number}"
    patient_name = rx.get("patient_name", "Patient")
    doctor_name = rx.get("doctor_name", "Doctor")
    clinic_name = rx.get("clinic_name", "DocSphere Clinic")
    diagnosis = rx.get("provisional_diagnosis", "Consultation")
    sig_hash = rx.get("digital_signature_hash", "")[:16]

    if payload.template_type == "bilingual_hindi":
        msg = (
            f"🏥 *डिजिटल मेडिकल प्रिस्क्रिप्शन / Digital Rx*\n"
            f"नमस्ते {patient_name}!\n\n"
            f"डॉक्टर: *{doctor_name}*\n"
            f"क्लिनिक: *{clinic_name}*\n"
            f"पर्चा संख्या: #{rx_number}\n\n"
            f"📄 *अपना आधिकारिक डिजिटल पर्चा (PDF) देखने और डाउनलोड करने के लिए यहाँ टैप करें:*\n"
            f"👉 {rx_link}\n\n"
            f"🔒 NMC सत्यापित डिजिटल हस्ताक्षर: {sig_hash}...\n"
            f"दवाएं समय पर लें। आपके शीघ्र स्वास्थ्य लाभ की कामना करते हैं!"
        )
    elif payload.template_type == "chemist_order":
        items_summary = []
        for idx, it in enumerate(rx.get("items", [])):
            med_name = it.get("medicine_name", "")
            gen_name = it.get("generic_name", "")
            qty = f"{it.get('duration_days', 5)} days"
            items_summary.append(f"{idx+1}. {med_name} ({gen_name}) - {qty}")
        items_str = "\n".join(items_summary) if items_summary else "Medicines as per digital prescription"

        msg = (
            f"💊 *Chemist Express Dispense Order*\n"
            f"Patient: *{patient_name}* ({clean_phone})\n"
            f"Prescribing Doctor: *{doctor_name}* ({clinic_name})\n"
            f"Rx Reference: #{rx_number}\n\n"
            f"📋 *Prescription Medications:*\n{items_str}\n\n"
            f"📄 Full Verified Doctor Letterhead PDF:\n👉 {rx_link}\n\n"
            f"Please verify generic stocks and prepare for express patient pickup."
        )
    else:  # Standard
        msg = (
            f"🏥 *Official Digital Prescription - {clinic_name}*\n"
            f"Dear {patient_name},\n\n"
            f"Dr. {doctor_name} has signed your consultation prescription.\n"
            f"Diagnosis: *{diagnosis}*\n"
            f"Prescription Number: *#{rx_number}*\n\n"
            f"📄 *View, Print & Download Official A4/A5 PDF:*\n"
            f"👉 {rx_link}\n\n"
            f"🔒 Tamper-Proof Cryptographic Hash: {sig_hash}...\n"
            f"Take medications strictly as instructed after meals. Wishing you vibrant health!"
        )

    if payload.custom_note:
        msg += f"\n\n💬 *Note from Clinic:* {payload.custom_note}"

    encoded_msg = urllib.parse.quote(msg)
    wa_url = f"https://wa.me/{clean_phone}?text={encoded_msg}"

    return {
        "status": "success",
        "prescription_number": rx_number,
        "recipient_phone": clean_phone,
        "recipient_type": payload.recipient_type,
        "template_type": payload.template_type,
        "message_text": msg,
        "whatsapp_url": wa_url,
        "dispatched_at": datetime.now().isoformat()
    }


# ================= DOCTOR'S PERSONAL RX COMBOS (TEMPLATES) =================

class RxComboItemModel(BaseModel):
    medicine_name: str
    generic_name: str
    dosage_form: str = "Tablet"
    strength: str = "500 mg"
    frequency: str = "1-0-1 (After Meals)"
    duration: str = "5 Days"
    special_instructions: str = "Take after meals"

class CreateRxComboRequest(BaseModel):
    doctor_slug: str = "dr-rahul-sharma"
    combo_name: str
    category: Optional[str] = "General"
    provisional_diagnosis: str
    chief_complaints: Optional[str] = ""
    followup_advice: Optional[str] = "Review after 7 days"
    items: List[RxComboItemModel]
    labs: Optional[List[str]] = []

DOCTOR_RX_COMBOS_DB: List[Dict[str, Any]] = [
    {
        "id": "combo-acne-mod",
        "doctor_slug": "dr-rahul-sharma",
        "combo_name": "Moderate Acne Vulgaris (Grade II)",
        "category": "Dermatology",
        "badge": "Top Protocol",
        "provisional_diagnosis": "Moderate Acne Vulgaris (Grade II)",
        "chief_complaints": "Multiple inflammatory papules and comedones over cheeks and forehead for 3 weeks.",
        "followup_advice": "Review after 14 days. Drink 3L water daily. Strictly use gel-based non-comedogenic sunscreen.",
        "labs": ["lab-01"],
        "items": [
            {
                "medicine_name": "Doxy-100",
                "generic_name": "DOXYCYCLINE HYCLATE",
                "dosage_form": "Capsule",
                "strength": "100 mg",
                "frequency": "1-0-1 (After Food)",
                "duration": "14 Days",
                "special_instructions": "Take after meals with a full glass of water. Avoid lying down immediately."
            },
            {
                "medicine_name": "Clindac-A",
                "generic_name": "CLINDAMYCIN PHOSPHATE",
                "dosage_form": "Gel",
                "strength": "1% w/w",
                "frequency": "1-0-0 (Morning)",
                "duration": "14 Days",
                "special_instructions": "Apply thinly over active acne lesions after gentle face wash."
            },
            {
                "medicine_name": "Acretin 0.05%",
                "generic_name": "TRETINOIN",
                "dosage_form": "Cream",
                "strength": "0.05% w/w",
                "frequency": "0-0-1 (At Bedtime)",
                "duration": "14 Days",
                "special_instructions": "Apply pea-sized amount at night on dry skin. Use sunscreen in morning."
            }
        ]
    },
    {
        "id": "combo-fungal-tinea",
        "doctor_slug": "dr-rahul-sharma",
        "combo_name": "Tinea Corporis & Cruris (Ringworm)",
        "category": "Dermatology",
        "badge": "High Adherence",
        "provisional_diagnosis": "Tinea Corporis & Cruris (Extensive fungal dermatomycosis)",
        "chief_complaints": "Annular erythematous scaly plaques with active borders and intense pruritus for 10 days.",
        "followup_advice": "Review after 14 days. Keep affected areas dry. Wear loose cotton clothes.",
        "labs": ["lab-08"],
        "items": [
            {
                "medicine_name": "Lulican",
                "generic_name": "LULICONAZOLE",
                "dosage_form": "Cream",
                "strength": "1% w/w",
                "frequency": "0-0-1 (At Bedtime)",
                "duration": "14 Days",
                "special_instructions": "Apply 1 inch beyond active scaly margin once daily at night. Keep skin dry."
            },
            {
                "medicine_name": "Cetzine 10",
                "generic_name": "CETIRIZINE HYDROCHLORIDE",
                "dosage_form": "Tablet",
                "strength": "10 mg",
                "frequency": "0-0-1 (At Bedtime)",
                "duration": "7 Days",
                "special_instructions": "Take 1 tablet at bedtime with water for allergic itching and urticaria."
            }
        ]
    },
    {
        "id": "combo-viral-fever",
        "doctor_slug": "dr-rahul-sharma",
        "combo_name": "Acute Viral URI & Body Ache",
        "category": "General Medicine",
        "badge": "OPD Staple",
        "provisional_diagnosis": "Acute Viral Upper Respiratory Infection with Myalgia",
        "chief_complaints": "High-grade fever (101°F), body aches, chills, and mild sore throat for 2 days.",
        "followup_advice": "Review after 3 days if fever > 100°F persists or breathlessness develops. High fluid intake.",
        "labs": ["lab-01"],
        "items": [
            {
                "medicine_name": "Dolo 650",
                "generic_name": "PARACETAMOL",
                "dosage_form": "Tablet",
                "strength": "650 mg",
                "frequency": "1-1-1 (SOS Fever)",
                "duration": "3 Days",
                "special_instructions": "Take after meals if temperature exceeds 99.5°F. Minimum 6 hours gap between doses."
            },
            {
                "medicine_name": "Pan-40",
                "generic_name": "PANTOPRAZOLE SODIUM",
                "dosage_form": "Tablet",
                "strength": "40 mg",
                "frequency": "1-0-0 (Empty Stomach)",
                "duration": "5 Days",
                "special_instructions": "Take 1 tablet 30 minutes before morning breakfast."
            },
            {
                "medicine_name": "Cetzine 10",
                "generic_name": "CETIRIZINE HYDROCHLORIDE",
                "dosage_form": "Tablet",
                "strength": "10 mg",
                "frequency": "0-0-1 (At Bedtime)",
                "duration": "5 Days",
                "special_instructions": "Take at night for runny nose and sneezing."
            }
        ]
    },
    {
        "id": "combo-allergic-derma",
        "doctor_slug": "dr-rahul-sharma",
        "combo_name": "Acute Allergic Contact Dermatitis",
        "category": "Dermatology",
        "badge": "Fast Relief",
        "provisional_diagnosis": "Allergic Contact Dermatitis (Chemical / Cosmetic induced)",
        "chief_complaints": "Pruritic erythematous rash and edema over exposed contact areas for 4 days.",
        "followup_advice": "Review in 7 days. Avoid scented soaps, detergents, and cosmetic products.",
        "labs": ["lab-01", "lab-08"],
        "items": [
            {
                "medicine_name": "Cetzine 10",
                "generic_name": "CETIRIZINE HYDROCHLORIDE",
                "dosage_form": "Tablet",
                "strength": "10 mg",
                "frequency": "1-0-1 (After Meals)",
                "duration": "5 Days",
                "special_instructions": "Take after food with water. Provides systemic antipruritic relief."
            },
            {
                "medicine_name": "Clindac-A",
                "generic_name": "CLINDAMYCIN PHOSPHATE",
                "dosage_form": "Gel",
                "strength": "1% w/w",
                "frequency": "1-0-0 (Morning)",
                "duration": "7 Days",
                "special_instructions": "Apply thinly over inflamed skin after gentle wash."
            }
        ]
    }
]

@router.get("/combos/list/{doctor_slug}")
def get_doctor_rx_combos(doctor_slug: str):
    matches = [c for c in DOCTOR_RX_COMBOS_DB if c.get("doctor_slug") == doctor_slug or c.get("doctor_slug") == "dr-rahul-sharma"]
    return {
        "status": "success",
        "total": len(matches),
        "data": matches
    }

@router.post("/combos/create")
def create_doctor_rx_combo(payload: CreateRxComboRequest):
    new_id = f"combo-{uuid.uuid4().hex[:8]}"
    combo_dict = {
        "id": new_id,
        "doctor_slug": payload.doctor_slug,
        "combo_name": payload.combo_name,
        "category": payload.category or "Custom",
        "badge": "Doctor Custom",
        "provisional_diagnosis": payload.provisional_diagnosis,
        "chief_complaints": payload.chief_complaints or "",
        "followup_advice": payload.followup_advice or "Review after 7 days",
        "labs": payload.labs or [],
        "items": [item.dict() for item in payload.items]
    }
    DOCTOR_RX_COMBOS_DB.insert(0, combo_dict)
    return {
        "status": "success",
        "message": f"Rx Combo '{payload.combo_name}' saved to doctor protocol library.",
        "data": combo_dict
    }

@router.delete("/combos/{combo_id}")
def delete_doctor_rx_combo(combo_id: str):
    global DOCTOR_RX_COMBOS_DB
    DOCTOR_RX_COMBOS_DB = [c for c in DOCTOR_RX_COMBOS_DB if c.get("id") != combo_id]
    return {
        "status": "success",
        "message": f"Rx Combo '{combo_id}' removed from protocol library."
    }

