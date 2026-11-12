from datetime import datetime
from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, Field

FactCategory = Literal[
    "chief_complaint",
    "symptom",
    "medical_history",
    "allergy",
    "medication",
    "vital",
    "examination",
    "assessment",
    "investigation",
    "treatment_plan",
    "follow_up",
    "missing_info",
    "uncertain_info",
]

FactStatus = Literal["unconfirmed", "doctor_confirmed", "corrected", "uncertain"]
VerificationStatus = Literal["UNVERIFIED", "DOCTOR_VERIFIED", "CONFLICTING", "SUPERSEDED"]


class ClinicalFactCreate(BaseModel):
    category: FactCategory
    fact_key: str
    fact_value: Dict[str, Any]
    status: FactStatus = "unconfirmed"
    verification_status: VerificationStatus = "UNVERIFIED"
    confidence: float = 0.85
    source_turn_id: Optional[str] = None
    exact_quote: Optional[str] = None


class FactStatusUpdate(BaseModel):
    status: FactStatus
    verification_status: Optional[VerificationStatus] = None
    corrected_value: Optional[Dict[str, Any]] = None


class ClinicalFactResponse(BaseModel):
    id: str
    consultation_id: str
    clinic_id: Optional[str] = None
    patient_id: Optional[str] = None
    source_id: Optional[str] = None
    category: str
    fact_key: str
    fact_value: Dict[str, Any]
    status: str
    verification_status: str = "UNVERIFIED"
    confidence: float
    code_system: Optional[str] = None
    clinical_code: Optional[str] = None
    observed_at: Optional[datetime] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    extracted_by: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    source_quotes: List[str] = Field(default_factory=list)
    created_at: datetime

    model_config = {"from_attributes": True}
