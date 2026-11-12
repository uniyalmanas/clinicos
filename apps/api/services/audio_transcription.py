import io
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional
import httpx
from apps.api.config import settings

logger = logging.getLogger("audio_transcription")

MEDICAL_CONTEXT_HINTS = (
    "Clinical terms: BP, Blood Pressure, Pulse, SpO2, Temperature, Rhinitis, Bronchitis, "
    "Pharyngitis, Diabetes Mellitus, Hypertension, Montelukast, Levocetirizine, Paracetamol, "
    "Azithromycin, Amoxicillin, Metformin, Telmisartan, Pantoprazole, CBC, LFT, KFT, ECG. "
    "Hindi/Hinglish terms: bukhar, khansi, gala kharab, gale mein dard, sir dard, pet dard, "
    "chhati mein jalan, sans phoolna, kamzori, thakan, chakkar aana, ulti, dast, "
    "dawa, goli, subah, sham, khali pet, khane ke baad, din mein do bar."
)


class BaseTranscriptionProvider(ABC):
    @abstractmethod
    async def transcribe_chunk(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "auto",
        prompt: Optional[str] = None,
    ) -> str:
        pass


class GroqWhisperProvider(BaseTranscriptionProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe_chunk(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "auto",
        prompt: Optional[str] = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not set.")

        ext = "webm"
        if "wav" in mime_type:
            ext = "wav"
        elif "mp4" in mime_type or "m4a" in mime_type:
            ext = "m4a"
        elif "ogg" in mime_type:
            ext = "ogg"

        files = {
            "file": (f"audio_chunk.{ext}", audio_bytes, mime_type),
        }
        data = {
            "model": "whisper-large-v3",
            "response_format": "verbose_json",
            "temperature": "0",
            "prompt": (prompt or "") + " " + MEDICAL_CONTEXT_HINTS,
        }

        if language == "hindi":
            data["language"] = "hi"
        elif language == "english":
            data["language"] = "en"

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            res = await client.post(self.url, headers=headers, data=data, files=files)
            if res.status_code != 200:
                logger.error(f"Groq Whisper transcription failed: {res.status_code} - {res.text}")
                raise RuntimeError(f"Groq Whisper error {res.status_code}: {res.text}")
            result = res.json()
            return result.get("text", "").strip()


class OpenAITranscriptionProvider(BaseTranscriptionProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.openai.com/v1/audio/transcriptions"

    async def transcribe_chunk(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "auto",
        prompt: Optional[str] = None,
    ) -> str:
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY is not set.")

        files = {
            "file": ("audio_chunk.webm", audio_bytes, mime_type),
        }
        data = {
            "model": "whisper-1",
            "response_format": "json",
            "prompt": (prompt or "") + " " + MEDICAL_CONTEXT_HINTS,
        }
        if language in ["hindi", "hi"]:
            data["language"] = "hi"
        elif language in ["english", "en"]:
            data["language"] = "en"

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            res = await client.post(self.url, headers=headers, data=data, files=files)
            if res.status_code != 200:
                logger.error(f"OpenAI transcription failed: {res.status_code} - {res.text}")
                raise RuntimeError(f"OpenAI error {res.status_code}: {res.text}")
            return res.json().get("text", "").strip()


class DeterministicFallbackProvider(BaseTranscriptionProvider):
    async def transcribe_chunk(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "auto",
        prompt: Optional[str] = None,
    ) -> str:
        # Graceful fallback when no keys are available or in test mock mode
        return "[Audio chunk captured — Live transcription ready]"


class TranscriptionEngine:
    def __init__(self):
        self.groq_provider = GroqWhisperProvider(settings.GROQ_API_KEY) if settings.GROQ_API_KEY else None
        self.openai_provider = OpenAITranscriptionProvider(settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        self.fallback = DeterministicFallbackProvider()

    async def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "auto",
        prompt: Optional[str] = None,
    ) -> str:
        # 1. Try Groq Whisper (fastest inference for bilingual medical speech)
        if self.groq_provider:
            try:
                text = await self.groq_provider.transcribe_chunk(audio_bytes, mime_type, language, prompt)
                if text:
                    return text
            except Exception as e:
                logger.warning(f"Groq provider failed, falling back: {e}")

        # 2. Try OpenAI Whisper
        if self.openai_provider:
            try:
                text = await self.openai_provider.transcribe_chunk(audio_bytes, mime_type, language, prompt)
                if text:
                    return text
            except Exception as e:
                logger.warning(f"OpenAI provider failed, falling back: {e}")

        # 3. Deterministic fallback
        return await self.fallback.transcribe_chunk(audio_bytes, mime_type, language, prompt)


transcription_engine = TranscriptionEngine()
