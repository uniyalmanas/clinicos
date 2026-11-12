import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from apps.api.database import get_db
from apps.api.core.security import get_current_user, require_clinic_access
from apps.api.models.consultation import (
    ConsultationSession,
    TranscriptTurn,
    ClinicalFact,
    FactSourceReference,
)
from apps.api.models.companion import ClinicalAuditEvent
from apps.api.schemas.consultation import (
    ConsultationSessionCreate,
    ConsentUpdate,
    ConsultationSessionResponse,
)
from apps.api.schemas.transcript import (
    TranscriptTurnCreate,
    SpeakerCorrectionRequest,
    TranscriptTurnResponse,
)
from apps.api.schemas.clinical_memory import (
    ClinicalFactCreate,
    FactStatusUpdate,
    ClinicalFactResponse,
)
from apps.api.services.audio_transcription import transcription_engine
from apps.api.services.speaker_attribution import speaker_attributor
from apps.api.workflows.graph import consultation_graph

router = APIRouter(prefix="/api/consultations", tags=["consultations"])


@router.post("/sessions", response_model=ConsultationSessionResponse)
def create_or_get_consultation_session(
    payload: ConsultationSessionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_clinic_access(str(payload.clinic_id), current_user)
    clinic_id_val = str(payload.clinic_id)
    pat_id_val = str(payload.patient_id) if payload.patient_id else None

    # Check for active session scoped to this clinic, doctor and patient
    existing = db.query(ConsultationSession).filter(
        ConsultationSession.clinic_id == clinic_id_val,
        ConsultationSession.doctor_slug == payload.doctor_slug,
        ConsultationSession.patient_phone == payload.patient_phone,
        ConsultationSession.status == "active",
    ).first()

    if existing:
        turns_c = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == existing.id).count()
        facts_c = db.query(ClinicalFact).filter(ClinicalFact.consultation_id == existing.id).count()
        return ConsultationSessionResponse(
            id=str(existing.id),
            clinic_id=str(existing.clinic_id),
            patient_id=str(existing.patient_id) if existing.patient_id else None,
            patient_phone=existing.patient_phone,
            patient_name=existing.patient_name,
            patient_uhid=existing.patient_uhid,
            doctor_slug=existing.doctor_slug,
            doctor_name=existing.doctor_name,
            status=existing.status,
            consent_obtained=existing.consent_obtained,
            language=existing.language,
            started_at=existing.started_at,
            turns_count=turns_c,
            facts_count=facts_c,
        )

    clinic_id_val = str(payload.clinic_id)
    pat_id_val = str(payload.patient_id) if payload.patient_id else None

    session = ConsultationSession(
        id=str(uuid.uuid4()),
        clinic_id=clinic_id_val,
        patient_id=pat_id_val,
        patient_phone=payload.patient_phone,
        patient_name=payload.patient_name,
        patient_uhid=payload.patient_uhid,
        doctor_slug=payload.doctor_slug,
        doctor_name=payload.doctor_name,
        language=payload.language,
        status="active",
        consent_obtained=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return ConsultationSessionResponse(
        id=str(session.id),
        clinic_id=str(session.clinic_id),
        patient_id=str(session.patient_id) if session.patient_id else None,
        patient_phone=session.patient_phone,
        patient_name=session.patient_name,
        patient_uhid=session.patient_uhid,
        doctor_slug=session.doctor_slug,
        doctor_name=session.doctor_name,
        status=session.status,
        consent_obtained=session.consent_obtained,
        language=session.language,
        started_at=session.started_at,
        turns_count=0,
        facts_count=0,
    )


@router.get("/sessions/{id}")
def get_consultation_session(
    id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    turns = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == id).order_by(TranscriptTurn.turn_index.asc()).all()
    facts = db.query(ClinicalFact).filter(ClinicalFact.consultation_id == id).all()

    return {
        "session": {
            "id": str(session.id),
            "clinic_id": str(session.clinic_id),
            "patient_phone": session.patient_phone,
            "patient_name": session.patient_name,
            "patient_uhid": session.patient_uhid,
            "doctor_name": session.doctor_name,
            "doctor_slug": session.doctor_slug,
            "status": session.status,
            "consent_obtained": session.consent_obtained,
            "language": session.language,
            "started_at": session.started_at,
        },
        "turns": [
            {
                "id": str(t.id),
                "turn_index": t.turn_index,
                "speaker": t.speaker,
                "speaker_confidence": t.speaker_confidence,
                "speaker_manually_corrected": t.speaker_manually_corrected,
                "transcript_text": t.transcript_text,
                "language": t.language,
                "created_at": t.created_at,
            }
            for t in turns
        ],
        "facts": [
            {
                "id": str(f.id),
                "category": f.category,
                "fact_key": f.fact_key,
                "fact_value": f.fact_value,
                "status": f.status,
                "verification_status": getattr(f, "verification_status", "UNVERIFIED"),
                "confidence": f.confidence,
                "source_quotes": [s.exact_quote for s in f.sources if s.exact_quote],
            }
            for f in facts
        ],
    }


@router.post("/sessions/{id}/consent")
def update_session_consent(
    id: str,
    payload: ConsentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    session.consent_obtained = payload.consent_obtained
    db.commit()

    # Log audit event
    audit = ClinicalAuditEvent(
        consultation_id=session.id,
        clinic_id=session.clinic_id,
        actor_name=session.doctor_name,
        action="consent_updated",
        details={"consent_obtained": payload.consent_obtained},
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "consent_obtained": session.consent_obtained}


@router.post("/sessions/{id}/turns")
def add_transcript_turn(
    id: str,
    payload: TranscriptTurnCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    if not session.consent_obtained:
        raise HTTPException(status_code=400, detail="Recording consent is required before logging transcript turns.")

    speaker = payload.speaker
    conf = payload.speaker_confidence
    if speaker == "uncertain":
        prev = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == id).order_by(TranscriptTurn.turn_index.desc()).first()
        prev_spk = prev.speaker if prev else "uncertain"
        speaker, conf = speaker_attributor.attribute_speaker(payload.transcript_text, prev_spk)

    turn = TranscriptTurn(
        consultation_id=session.id,
        turn_index=payload.turn_index,
        speaker=speaker,
        speaker_confidence=conf,
        transcript_text=payload.transcript_text,
        language=payload.language,
        provider_event_id=payload.provider_event_id,
        started_at_ms=payload.started_at_ms,
        ended_at_ms=payload.ended_at_ms,
    )
    db.add(turn)
    db.commit()
    db.refresh(turn)

    # Trigger LangGraph Workflow A (fact extraction & safety validation)
    all_turns = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == id).order_by(TranscriptTurn.turn_index.asc()).all()
    full_tx = "\n".join([f"{t.speaker}: {t.transcript_text}" for t in all_turns])

    graph_state = {
        "session_id": str(session.id),
        "clinic_id": str(session.clinic_id),
        "patient_phone": session.patient_phone,
        "patient_name": session.patient_name,
        "doctor_name": session.doctor_name,
        "action": "process_turn",
        "full_transcript": full_tx,
        "transcript_turns": [{"speaker": t.speaker, "transcript_text": t.transcript_text} for t in all_turns],
    }
    result = consultation_graph.invoke(
        graph_state,
        config={"configurable": {"thread_id": str(session.id)}},
    )

    # Persist extracted facts
    for nf in result.get("extracted_facts", []):
        existing = db.query(ClinicalFact).filter(
            ClinicalFact.consultation_id == session.id,
            ClinicalFact.fact_key == nf.get("fact_key"),
        ).first()
        if not existing:
            cfact = ClinicalFact(
                consultation_id=session.id,
                category=nf.get("category", "symptom"),
                fact_key=nf.get("fact_key", "Fact"),
                fact_value=nf.get("fact_value", {}),
                status=nf.get("status", "unconfirmed"),
            )
            db.add(cfact)
            db.flush()
            if nf.get("exact_quote"):
                sref = FactSourceReference(
                    fact_id=cfact.id,
                    turn_id=turn.id,
                    exact_quote=nf.get("exact_quote"),
                )
                db.add(sref)
    db.commit()

    all_facts = db.query(ClinicalFact).filter(ClinicalFact.consultation_id == id).all()

    return {
        "status": "success",
        "turn": {
            "id": str(turn.id),
            "turn_index": turn.turn_index,
            "speaker": turn.speaker,
            "speaker_confidence": turn.speaker_confidence,
            "transcript_text": turn.transcript_text,
        },
        "facts": [
            {
                "id": str(f.id),
                "category": f.category,
                "fact_key": f.fact_key,
                "fact_value": f.fact_value,
                "status": f.status,
                "verification_status": getattr(f, "verification_status", "UNVERIFIED"),
            }
            for f in all_facts
        ],
        "safety_flags": result.get("safety_flags", []),
        "missing_info_alerts": result.get("missing_info_alerts", []),
    }


@router.patch("/turns/{turn_id}/speaker")
def correct_turn_speaker(
    turn_id: str,
    payload: SpeakerCorrectionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    turn = db.query(TranscriptTurn).filter(TranscriptTurn.id == turn_id).first()
    if not turn:
        raise HTTPException(status_code=404, detail="Transcript turn not found.")

    turn.speaker = payload.speaker
    turn.speaker_manually_corrected = True
    turn.speaker_confidence = 1.0
    db.commit()

    # Log audit event
    audit = ClinicalAuditEvent(
        consultation_id=turn.consultation_id,
        clinic_id=turn.session.clinic_id,
        actor_name=turn.session.doctor_name,
        action="speaker_corrected",
        details={"turn_id": turn_id, "new_speaker": payload.speaker, "reason": payload.reason},
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "turn_id": turn_id, "speaker": turn.speaker}


@router.post("/sessions/{id}/audio-chunk")
async def upload_audio_chunk(
    id: str,
    audio: UploadFile = File(...),
    language: str = Form("auto"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    session = db.query(ConsultationSession).filter(ConsultationSession.id == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Consultation session not found.")

    if not session.consent_obtained:
        raise HTTPException(status_code=400, detail="Patient recording consent is required before uploading audio.")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio chunk received.")

    text = await transcription_engine.transcribe(
        audio_bytes=audio_bytes,
        mime_type=audio.content_type or "audio/webm",
        language=language if language != "auto" else session.language,
    )

    if not text:
        return {"status": "empty", "transcript": ""}

    prev = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == id).order_by(TranscriptTurn.turn_index.desc()).first()
    prev_spk = prev.speaker if prev else "uncertain"
    speaker, conf = speaker_attributor.attribute_speaker(text, prev_spk)

    turn_count = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == id).count()
    new_turn = TranscriptTurn(
        consultation_id=session.id,
        turn_index=turn_count + 1,
        speaker=speaker,
        speaker_confidence=conf,
        transcript_text=text,
        language=session.language,
    )
    db.add(new_turn)
    db.commit()
    db.refresh(new_turn)

    return {
        "status": "success",
        "turn": {
            "id": str(new_turn.id),
            "turn_index": new_turn.turn_index,
            "speaker": new_turn.speaker,
            "speaker_confidence": new_turn.speaker_confidence,
            "transcript_text": new_turn.transcript_text,
        },
    }


@router.patch("/facts/{fact_id}/confirm")
def confirm_or_edit_fact(
    fact_id: str,
    payload: FactStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    fact = db.query(ClinicalFact).filter(ClinicalFact.id == fact_id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Clinical fact not found.")

    fact.status = payload.status
    if payload.verification_status:
        fact.verification_status = payload.verification_status
    elif payload.status == "doctor_confirmed":
        fact.verification_status = "DOCTOR_VERIFIED"
    if payload.corrected_value:
        fact.fact_value = payload.corrected_value
    db.commit()

    return {
        "status": "success",
        "fact_id": fact_id,
        "status": fact.status,
        "verification_status": fact.verification_status,
        "fact_value": fact.fact_value,
    }
