from datetime import datetime
from typing import Optional, Literal, Dict, Any, List
from pydantic import BaseModel, Field
from apps.api.schemas.clinical_memory import (
    FactCategory,
    FactStatus,
    VerificationStatus,
    ClinicalFactCreate,
    ClinicalFactResponse,
)

SourceType = Literal[
    "DOCTOR_OBSERVED",
    "PATIENT_REPORTED",
    "AI_EXTRACTED",
    "IMPORTED_RECORD",
    "LAB_RESULT",
    "IMAGING",
]

RelationType = Literal[
    "CAUSES",
    "TREATS",
    "CONTRADICTS",
    "SUPERSEDES",
    "EVIDENCE_FOR",
]


class ClinicalSourceCreate(BaseModel):
    clinic_id: str
    patient_id: Optional[str] = None
    encounter_id: Optional[str] = None
    source_type: SourceType
    source_title: str
    source_metadata: Dict[str, Any] = Field(default_factory=dict)


class ClinicalSourceResponse(BaseModel):
    id: str
    clinic_id: str
    patient_id: Optional[str] = None
    encounter_id: Optional[str] = None
    source_type: str
    source_title: str
    source_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = {"from_attributes": True}


class ClinicalFactVersionResponse(BaseModel):
    id: str
    fact_id: str
    version_index: int
    previous_value: Dict[str, Any] = Field(default_factory=dict)
    new_value: Dict[str, Any] = Field(default_factory=dict)
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    previous_verification_status: Optional[str] = None
    new_verification_status: Optional[str] = None
    changed_by: str
    change_reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClinicalFactRelationResponse(BaseModel):
    id: str
    source_fact_id: str
    target_fact_id: str
    relation_type: str
    relation_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = {"from_attributes": True}


class FactVerifyRequest(BaseModel):
    verified: bool  # True -> DOCTOR_VERIFIED, False -> rejected / superseded
    doctor_id: Optional[str] = None
    notes: Optional[str] = None
    corrected_value: Optional[Dict[str, Any]] = None


class FactSupersedeRequest(BaseModel):
    superseded_by_fact_id: Optional[str] = None
    reason: str = "Superseded by newer clinical findings"
    replacement_value: Optional[Dict[str, Any]] = None


class PatientTimelineItem(BaseModel):
    id: str
    item_type: str  # fact, source, encounter
    timestamp: datetime
    title: str
    category: str
    verification_status: str
    summary: str
    details: Dict[str, Any] = Field(default_factory=dict)


class PatientMemoryResponse(BaseModel):
    patient_id: str
    total_facts: int
    verified_count: int
    unverified_count: int
    categorized_facts: Dict[str, List[ClinicalFactResponse]]
    sources: List[ClinicalSourceResponse] = Field(default_factory=list)


class PatientContextSummaryResponse(BaseModel):
    patient_id: str
    allergies: List[str] = Field(default_factory=list)
    active_conditions: List[str] = Field(default_factory=list)
    medications: List[str] = Field(default_factory=list)
    recent_vitals: Dict[str, Any] = Field(default_factory=dict)
    has_unverified_records: bool = False
    verified_facts_count: int = 0
