from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ConsultationSessionCreate(BaseModel):
    clinic_id: str
    patient_id: Optional[str] = None
    patient_phone: str
    patient_name: str
    patient_uhid: Optional[str] = None
    doctor_slug: str
    doctor_name: str
    language: str = Field(default="english", description="english, hindi, or hinglish")
    appointment_number: Optional[str] = None


class ConsentUpdate(BaseModel):
    consent_obtained: bool


class ConsultationSessionResponse(BaseModel):
    id: str
    clinic_id: str
    patient_id: Optional[str] = None
    patient_phone: str
    patient_name: str
    patient_uhid: Optional[str] = None
    doctor_slug: str
    doctor_name: str
    status: str
    consent_obtained: bool
    language: str
    started_at: datetime
    finalized_at: Optional[datetime] = None
    turns_count: int = 0
    facts_count: int = 0

    model_config = {"from_attributes": True}
