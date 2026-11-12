import json
import base64
import logging
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import jwt

from apps.api.database import get_db, SessionLocal
from apps.api.config import settings
from apps.api.models.consultation import ConsultationSession, TranscriptTurn, ClinicalFact, FactSourceReference
from apps.api.services.audio_transcription import transcription_engine
from apps.api.services.speaker_attribution import speaker_attributor
from apps.api.workflows.graph import consultation_graph

logger = logging.getLogger("ws_audio")
router = APIRouter()

ALGORITHM = "HS256"


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, consultation_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[consultation_id] = websocket

    def disconnect(self, consultation_id: str):
        if consultation_id in self.active_connections:
            del self.active_connections[consultation_id]

    async def send_json(self, consultation_id: str, message: Dict[str, Any]):
        if consultation_id in self.active_connections:
            await self.active_connections[consultation_id].send_text(json.dumps(message))


manager = ConnectionManager()


@router.websocket("/ws/consultation/{consultation_id}")
async def websocket_consultation_endpoint(
    websocket: WebSocket,
    consultation_id: str,
    token: str = Query(default=None),
):
    # Validate JWT before accepting the WebSocket connection.
    # Clients must pass ?token=<bearer_jwt> in the connection URL.
    if not token:
        await websocket.close(code=4001, reason="Authentication token required.")
        return
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        if not (payload.get("user_id") or payload.get("sub")):
            raise jwt.PyJWTError("Missing user identity in token.")
    except jwt.PyJWTError as exc:
        logger.warning(f"WebSocket auth rejected for {consultation_id}: {exc}")
        await websocket.close(code=4001, reason="Invalid or expired authentication token.")
        return

    await manager.connect(consultation_id, websocket)
    db: Session = SessionLocal()

    try:
        # Verify consultation session exists
        session = db.query(ConsultationSession).filter(ConsultationSession.id == consultation_id).first()
        if not session:
            await websocket.send_text(json.dumps({
                "type": "error",
                "code": "session_not_found",
                "message": f"Consultation session {consultation_id} does not exist.",
            }))
            await websocket.close()
            return

        # Notify connected
        await websocket.send_text(json.dumps({
            "type": "connected",
            "consultation_id": consultation_id,
            "consent_obtained": session.consent_obtained,
            "status": session.status,
            "message": "Connected to ClinicOS Realtime Consultation Gateway",
        }))

        while True:
            raw_message = await websocket.receive_text()
            event = json.loads(raw_message)
            event_type = event.get("type", "")

            # 1. Update DPDP consent
            if event_type == "update_consent":
                consent = bool(event.get("consent_obtained", False))
                session.consent_obtained = consent
                db.commit()
                await websocket.send_text(json.dumps({
                    "type": "consent_updated",
                    "consent_obtained": consent,
                }))
                continue

            # 2. Enforce consent before audio recording / speech processing
            if event_type in ["audio_chunk", "transcript_turn"]:
                if not session.consent_obtained:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "code": "consent_required",
                        "message": "Patient recording consent must be recorded before capturing audio.",
                    }))
                    continue

            # 3. Audio chunk processing (binary base64)
            if event_type == "audio_chunk":
                audio_b64 = event.get("audio_data", "")
                mime_type = event.get("mime_type", "audio/webm")
                lang = event.get("language", session.language or "english")

                if audio_b64:
                    audio_bytes = base64.b64decode(audio_b64)
                    transcription = await transcription_engine.transcribe(
                        audio_bytes=audio_bytes,
                        mime_type=mime_type,
                        language=lang,
                    )
                    if transcription and transcription.strip():
                        # Determine speaker
                        prev_turn = db.query(TranscriptTurn).filter(
                            TranscriptTurn.consultation_id == consultation_id
                        ).order_by(TranscriptTurn.turn_index.desc()).first()
                        prev_spk = prev_turn.speaker if prev_turn else "uncertain"
                        speaker, conf = speaker_attributor.attribute_speaker(transcription, prev_spk)

                        turn_count = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == consultation_id).count()
                        new_turn = TranscriptTurn(
                            consultation_id=consultation_id,
                            turn_index=turn_count + 1,
                            speaker=speaker,
                            speaker_confidence=conf,
                            transcript_text=transcription,
                            language=lang,
                        )
                        db.add(new_turn)
                        db.commit()
                        db.refresh(new_turn)

                        # Broadcast completed turn
                        await websocket.send_text(json.dumps({
                            "type": "turn_completed",
                            "turn": {
                                "id": str(new_turn.id),
                                "turn_index": new_turn.turn_index,
                                "speaker": new_turn.speaker,
                                "speaker_confidence": new_turn.speaker_confidence,
                                "transcript_text": new_turn.transcript_text,
                                "language": new_turn.language,
                            },
                        }))

                        # Trigger LangGraph Workflow A in background
                        all_turns = db.query(TranscriptTurn).filter(
                            TranscriptTurn.consultation_id == consultation_id
                        ).order_by(TranscriptTurn.turn_index.asc()).all()
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

                        # Persist extracted facts to DB
                        new_facts = result.get("extracted_facts", [])
                        for nf in new_facts:
                            existing = db.query(ClinicalFact).filter(
                                ClinicalFact.consultation_id == consultation_id,
                                ClinicalFact.fact_key == nf.get("fact_key"),
                            ).first()
                            if not existing:
                                cfact = ClinicalFact(
                                    consultation_id=consultation_id,
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
                                        turn_id=new_turn.id,
                                        exact_quote=nf.get("exact_quote"),
                                    )
                                    db.add(sref)
                        db.commit()

                        # Broadcast updated facts
                        all_facts = db.query(ClinicalFact).filter(ClinicalFact.consultation_id == consultation_id).all()
                        await websocket.send_text(json.dumps({
                            "type": "clinical_memory_updated",
                            "facts": [
                                {
                                    "id": str(f.id),
                                    "category": f.category,
                                    "fact_key": f.fact_key,
                                    "fact_value": f.fact_value,
                                    "status": f.status,
                                    "verification_status": getattr(f, "verification_status", "UNVERIFIED"),
                                    "confidence": f.confidence,
                                }
                                for f in all_facts
                            ],
                            "safety_flags": result.get("safety_flags", []),
                            "missing_info_alerts": result.get("missing_info_alerts", []),
                        }))

            # 4. Direct transcript text turn event (e.g. client speech recognition)
            elif event_type == "transcript_turn":
                text_content = event.get("text", "").strip()
                if text_content:
                    speaker = event.get("speaker")
                    conf = 0.85 if speaker else 0.50
                    if not speaker:
                        prev_turn = db.query(TranscriptTurn).filter(
                            TranscriptTurn.consultation_id == consultation_id
                        ).order_by(TranscriptTurn.turn_index.desc()).first()
                        prev_spk = prev_turn.speaker if prev_turn else "uncertain"
                        speaker, conf = speaker_attributor.attribute_speaker(text_content, prev_spk)

                    turn_count = db.query(TranscriptTurn).filter(TranscriptTurn.consultation_id == consultation_id).count()
                    turn_obj = TranscriptTurn(
                        consultation_id=consultation_id,
                        turn_index=turn_count + 1,
                        speaker=speaker,
                        speaker_confidence=conf,
                        transcript_text=text_content,
                        language=event.get("language", session.language or "english"),
                    )
                    db.add(turn_obj)
                    db.commit()
                    db.refresh(turn_obj)

                    await websocket.send_text(json.dumps({
                        "type": "turn_completed",
                        "turn": {
                            "id": str(turn_obj.id),
                            "turn_index": turn_obj.turn_index,
                            "speaker": turn_obj.speaker,
                            "speaker_confidence": turn_obj.speaker_confidence,
                            "transcript_text": turn_obj.transcript_text,
                            "language": turn_obj.language,
                        },
                    }))

            # 5. Ping / keep-alive
            elif event_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from consultation {consultation_id}")
    except Exception as e:
        logger.error(f"WebSocket error for consultation {consultation_id}: {e}", exc_info=True)
    finally:
        manager.disconnect(consultation_id)
        db.close()
