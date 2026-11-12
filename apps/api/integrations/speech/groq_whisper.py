import logging
import httpx
from typing import Optional
from apps.api.config import settings
from apps.api.integrations.speech.base import BaseSTTProvider

logger = logging.getLogger("groq_whisper")


class GroqWhisperProvider(BaseSTTProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.url = "https://api.groq.com/openai/v1/audio/transcriptions"

    async def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "en",
        prompt: str = "",
    ) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not set.")

        ext = "webm" if "webm" in mime_type else "wav"
        files = {
            "file": (f"audio.{ext}", audio_bytes, mime_type),
        }
        data = {
            "model": "whisper-large-v3-turbo",
            "language": language,
            "response_format": "json",
            "temperature": "0.0",
        }
        if prompt:
            data["prompt"] = prompt

        headers = {"Authorization": f"Bearer {self.api_key}"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            res = await client.post(self.url, headers=headers, files=files, data=data)
            if res.status_code != 200:
                logger.error(f"Groq Whisper transcription failed: {res.status_code} - {res.text}")
                raise RuntimeError(f"Groq Whisper error {res.status_code}: {res.text}")
            return res.json().get("text", "").strip()
