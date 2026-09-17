from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import PatientDocument
import uuid
import os

router = APIRouter(prefix="/documents", tags=["Patient Medical Documents & Lab Reports"])

class UploadDocumentRequest(BaseModel):
    patient_phone: str
    patient_name: str
    document_type: str = "Lab Report" # Blood Test, Radiology X-Ray, Lab Report, Previous Rx, Discharge Summary
    title: str
    doctor_notes: Optional[str] = None
    file_name: Optional[str] = "medical_report.pdf"
    file_size_kb: Optional[int] = 350

@router.get("")
def get_patient_documents(patient_phone: str = "+919123456780", db: Session = Depends(get_db)):
    docs = db.query(PatientDocument).filter(PatientDocument.patient_phone == patient_phone).order_by(PatientDocument.uploaded_at.desc()).all()
    
    return {
        "status": "success",
        "patient_phone": patient_phone,
        "total_documents": len(docs),
        "documents": [
            {
                "id": d.id,
                "patient_name": d.patient_name,
                "document_type": d.document_type,
                "title": d.title,
                "file_name": d.file_name,
                "file_size_kb": d.file_size_kb,
                "doctor_notes": d.doctor_notes,
                "uploaded_at": d.uploaded_at.strftime("%B %d, %Y") if d.uploaded_at else "Recently"
            }
            for d in docs
        ]
    }

@router.post("/upload")
def upload_patient_document(payload: UploadDocumentRequest, db: Session = Depends(get_db)):
    new_doc = PatientDocument(
        id=str(uuid.uuid4()),
        patient_phone=payload.patient_phone,
        patient_name=payload.patient_name,
        document_type=payload.document_type,
        title=payload.title,
        file_name=payload.file_name or f"{payload.title.lower().replace(' ', '_')}.pdf",
        file_size_kb=payload.file_size_kb or 420,
        doctor_notes=payload.doctor_notes
    )
    db.add(new_doc)
    db.commit()

    return {
        "status": "success",
        "message": f"Document '{payload.title}' uploaded and added to clinical record.",
        "document": {
            "id": new_doc.id,
            "title": new_doc.title,
            "document_type": new_doc.document_type,
            "file_name": new_doc.file_name,
            "file_size_kb": new_doc.file_size_kb
        }
    }
