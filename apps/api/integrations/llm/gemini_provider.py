import logging
import os
from typing import List, Dict, Any, Optional
import httpx

from apps.api.config import settings
from apps.api.integrations.llm.base import BaseLLMProvider

logger = logging.getLogger("gemini_provider")


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini via the OpenAI-compatible REST endpoint.

    This keeps the provider interface identical to Groq/Ollama, so callers in
    the LangGraph workflow do not need to know which vendor answered.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL or "gemini-2.5-flash"
        self.api_url = (
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
        )

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        response_format: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1500,
    ) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            # Gemini 2.5 counts hidden thinking toward max_tokens. Lowering the
            # effort keeps the visible clinical answer from being truncated.
            "reasoning_effort": os.getenv("GEMINI_REASONING_EFFORT", "none"),
        }
        if response_format:
            payload["response_format"] = response_format

        with httpx.Client(timeout=30.0) as client:
            res = client.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if res.status_code != 200:
                logger.error(f"Gemini API error {res.status_code}: {res.text}")
                raise RuntimeError(f"Gemini API error {res.status_code}: {res.text}")
            data = res.json()
            return data["choices"][0]["message"]["content"]

    def health_check(self) -> bool:
        return bool(self.api_key)
