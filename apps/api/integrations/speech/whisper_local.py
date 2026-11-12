import logging
from apps.api.integrations.speech.base import BaseSTTProvider

logger = logging.getLogger("whisper_local")


class LocalWhisperProvider(BaseSTTProvider):
    """
    Fallback STT provider when cloud API is offline or when running in local-only privacy mode.
    Can integrate with local whisper.cpp or pywhisper.
    """
    def __init__(self, model_name: str = "base"):
        self.model_name = model_name

    async def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "en",
        prompt: str = "",
    ) -> str:
        logger.info(f"Local STT processing chunk of {len(audio_bytes)} bytes ({language})")
        # In mock or fallback environment, returns empty or diagnostic string if whisper binary not active
        return ""
