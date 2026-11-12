from abc import ABC, abstractmethod


class BaseSTTProvider(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/webm",
        language: str = "en",
        prompt: str = "",
    ) -> str:
        """
        Transcribes speech audio bytes into text.
        """
        pass
