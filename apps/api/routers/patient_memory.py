from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from apps.api.database import get_db
from apps.api.core.security import get_current_user, require_clinic_access
from apps.api.services.patient_memory import PatientMemoryService
from apps.api.services.hybrid_retrieval import HybridRetrievalService
from apps.api.schemas.clinical_memory import ClinicalFactResponse
from apps.api.schemas.patient_memory import (
    PatientMemoryResponse,
    PatientTimelineItem,
    PatientContextSummaryResponse,
    FactVerifyRequest,
    FactSupersedeRequest,
)

router = APIRouter(prefix="/api", tags=["Patient Memory & Longitudinal Clinical Facts"])


@router.get("/patients/{patient_identifier}/memory", response_model=PatientMemoryResponse)
def get_patient_memory(
    patient_identifier: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns full longitudinal memory for a patient including all clinical facts,
    categorized and annotated with provenance and verification status.
    """
    clinic_id = current_user.get("clinic_id") or "default_clinic"
    return PatientMemoryService.get_patient_memory(db, clinic_id, patient_identifier)


@router.get("/patients/{patient_identifier}/timeline", response_model=List[PatientTimelineItem])
def get_patient_timeline(
    patient_identifier: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns a unified chronological timeline of encounters and clinical facts.
    """
    clinic_id = current_user.get("clinic_id") or "default_clinic"
    return PatientMemoryService.get_patient_timeline(db, clinic_id, patient_identifier)


@router.get("/patients/{patient_identifier}/context", response_model=PatientContextSummaryResponse)
def get_patient_context(
    patient_identifier: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns verified longitudinal context (allergies, medical conditions, medications, vitals)
    for AI companion prompting. Empty if no verified facts exist.
    """
    clinic_id = current_user.get("clinic_id") or "default_clinic"
    return PatientMemoryService.get_patient_context_summary(db, clinic_id, patient_identifier)


@router.get("/patients/{patient_identifier}/search")
def search_patient_memory(
    patient_identifier: str,
    q: str,
    top_k: int = 5,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Executes hybrid semantic search (Reciprocal Rank Fusion of keyword and vector embeddings)
    across the patient's longitudinal facts.
    """
    clinic_id = current_user.get("clinic_id") or "default_clinic"
    return HybridRetrievalService.search_patient_facts(
        db=db,
        clinic_id=clinic_id,
        patient_identifier=patient_identifier,
        query=q,
        top_k=top_k,
    )


@router.post("/clinical-facts/{fact_id}/verify", response_model=ClinicalFactResponse)
@router.post("/facts/{fact_id}/verify", response_model=ClinicalFactResponse)
def verify_fact(
    fact_id: str,
    payload: FactVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Physician verifies or rejects an AI-extracted clinical fact.
    Maintains immutable version audit trail.
    """
    clinic_id = current_user.get("clinic_id") or "default_clinic"
    doctor_id = payload.doctor_id or current_user.get("user_id") or "doctor"

    fact = PatientMemoryService.verify_clinical_fact(
        db=db,
        clinic_id=clinic_id,
        fact_id=fact_id,
        verified=payload.verified,
        doctor_id=doctor_id,
        notes=payload.notes,
        corrected_value=payload.corrected_value,
    )

    source_quotes = [s.exact_quote for s in fact.sources if s.exact_quote]
    return ClinicalFactResponse(
        id=str(fact.id),
        consultation_id=str(fact.consultation_id),
        clinic_id=str(fact.clinic_id) if fact.clinic_id else clinic_id,
        patient_id=str(fact.patient_id) if fact.patient_id else None,
        source_id=str(fact.source_id) if fact.source_id else None,
        category=fact.category,
        fact_key=fact.fact_key,
        fact_value=fact.fact_value or {},
        status=fact.status,
        verification_status=fact.verification_status or "UNVERIFIED",
        confidence=fact.confidence or 0.85,
        code_system=fact.code_system,
        clinical_code=fact.clinical_code,
        observed_at=fact.observed_at or fact.created_at,
        valid_from=fact.valid_from or fact.created_at,
        valid_until=fact.valid_until,
        extracted_by=fact.extracted_by or "ai_ambient_companion",
        verified_by=fact.verified_by,
        verified_at=fact.verified_at,
        source_quotes=source_quotes,
        created_at=fact.created_at,
    )


@router.post("/clinical-facts/{fact_id}/supersede")
@router.post("/facts/{fact_id}/supersede")
def supersede_fact(
    fact_id: str,
    payload: FactSupersedeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Marks a clinical fact as superseded by a newer fact or updated value.
    Creates semantic relation and version record.
    """
    clinic_id = current_user.get("clinic_id") or "default_clinic"
    doctor_id = current_user.get("user_id") or "doctor"

    return PatientMemoryService.supersede_clinical_fact(
        db=db,
        clinic_id=clinic_id,
        fact_id=fact_id,
        superseded_by_fact_id=payload.superseded_by_fact_id,
        reason=payload.reason,
        replacement_value=payload.replacement_value,
        doctor_id=doctor_id,
    )
