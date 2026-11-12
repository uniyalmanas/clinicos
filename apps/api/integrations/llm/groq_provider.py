import logging
from typing import List, Dict, Any, Optional
import httpx
from apps.api.config import settings
from apps.api.integrations.llm.base import BaseLLMProvider

logger = logging.getLogger("groq_provider")


class GroqLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        self.model = model or settings.GROQ_CHAT_MODEL or "llama-3.3-70b-versatile"
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        response_format: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1500,
    ) -> str:
        if not self.api_key:
            raise ValueError("GROQ_API_KEY is not configured.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        with httpx.Client(timeout=20.0) as client:
            res = client.post(self.api_url, headers=headers, json=payload)
            if res.status_code != 200:
                logger.error(f"Groq API error {res.status_code}: {res.text}")
                raise RuntimeError(f"Groq API error {res.status_code}: {res.text}")
            data = res.json()
            return data["choices"][0]["message"]["content"]

    def health_check(self) -> bool:
        return bool(self.api_key)
