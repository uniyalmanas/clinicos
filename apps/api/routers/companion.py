import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from apps.api.database import get_db
from apps.api.core.security import get_current_user
from apps.api.models.consultation import ConsultationSession, TranscriptTurn, ClinicalFact
from apps.api.models.companion import CompanionInteraction
from apps.api.schemas.companion import DoctorQuestionRequest, CompanionResponse
from apps.api.workflows.graph import consultation_graph
from apps.api.services.patient_context import patient_context_service

router = APIRouter(prefix="/api/companion", tags=["companion"])


@router.post("/ask", response_model=CompanionResponse)
def ask_clinical_companion(
    session_id: str,
    payload: DoctorQuestionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    # 1. Fetch transcript & facts
    turns = db.query(TranscriptTurn).filter(
        TranscriptTurn.consultation_id == session_id
    ).order_by(TranscriptTurn.turn_index.asc()).all()
    full_tx = "\n".join([f"{t.speaker}: {t.transcript_text}" for t in turns])

    facts = db.query(ClinicalFact).filter(ClinicalFact.consultation_id == session_id).all()
    facts_list = [
        {"category": f.category, "fact_key": f.fact_key, "fact_value": f.fact_value, "status": f.status}
        for f in facts
    ]

    # 2. Fetch longitudinal patient context
    verified_context = patient_context_service.get_verified_patient_records(
        db, session.patient_phone, str(session.clinic_id)
    )

    # 3. Invoke LangGraph Workflow B: Doctor-Initiated Assistant
    graph_state = {
        "session_id": str(session.id),
        "clinic_id": str(session.clinic_id),
        "patient_phone": session.patient_phone,
        "patient_name": session.patient_name,
        "patient_uhid": session.patient_uhid,
        "doctor_name": session.doctor_name,
        "action": "doctor_question",
        "doctor_query": payload.question,
        "full_transcript": full_tx,
        "transcript_turns": [{"speaker": t.speaker, "transcript_text": t.transcript_text} for t in turns],
        "clinical_facts": facts_list,
        "verified_patient_records": verified_context,
    }

    result = consultation_graph.invoke(
        graph_state,
        config={"configurable": {"thread_id": str(session.id)}},
    )

    assistant_resp = result.get("assistant_response") or {
        "reply": "I am reviewing the patient's records and transcript.",
        "provenance_sources": [],
    }

    # 4. Save interaction in audit table
    interaction = CompanionInteraction(
        consultation_id=session.id,
        query_type="doctor_question",
        doctor_query=payload.question,
        companion_response=assistant_resp.get("reply", ""),
        provenance_sources=assistant_resp.get("provenance_sources", []),
    )
    db.add(interaction)
    db.commit()

    return CompanionResponse(
        reply=assistant_resp.get("reply", ""),
        provenance_sources=assistant_resp.get("provenance_sources", []),
        updated_memory={"clinical_facts": facts_list},
        spoken_reply=assistant_resp.get("spoken_reply"),
    )
