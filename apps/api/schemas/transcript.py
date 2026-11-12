from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

SpeakerType = Literal["doctor", "patient", "uncertain"]


class TranscriptTurnCreate(BaseModel):
    turn_index: int
    speaker: SpeakerType = "uncertain"
    speaker_confidence: float = 0.50
    transcript_text: str
    language: str = "english"
    provider_event_id: Optional[str] = None
    started_at_ms: int = 0
    ended_at_ms: int = 0


class SpeakerCorrectionRequest(BaseModel):
    speaker: SpeakerType
    reason: Optional[str] = None


class TranscriptTurnResponse(BaseModel):
    id: str
    consultation_id: str
    turn_index: int
    speaker: str
    speaker_confidence: float
    speaker_manually_corrected: bool
    transcript_text: str
    language: str
    provider_event_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
