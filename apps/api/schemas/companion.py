from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

ProvenanceCategory = Literal[
    "current_transcript",
    "verified_patient_record",
    "medical_knowledge",
    "missing_info",
]


class ProvenanceSource(BaseModel):
    source_type: ProvenanceCategory
    citation: str
    quote: Optional[str] = None


class DoctorQuestionRequest(BaseModel):
    question: str
    historical_visits: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class CompanionResponse(BaseModel):
    reply: str
    provenance_sources: List[ProvenanceSource] = Field(default_factory=list)
    updated_memory: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = Field(default_factory=list)
    spoken_reply: Optional[str] = None
