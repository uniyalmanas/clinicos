import logging
from typing import List, Dict, Any, Optional
import httpx
from apps.api.config import settings
from apps.api.integrations.llm.base import BaseLLMProvider, BaseEmbeddingProvider

logger = logging.getLogger("ollama_provider")


class OllamaLLMProvider(BaseLLMProvider):
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434").rstrip("/")
        self.model = model or settings.OLLAMA_MODEL or "llama3.2:3b"

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        response_format: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1500,
    ) -> str:
        url = f"{self.base_url}/api/chat"
        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if response_format and response_format.get("type") == "json_object":
            payload["format"] = "json"

        with httpx.Client(timeout=30.0) as client:
            res = client.post(url, json=payload)
            if res.status_code != 200:
                logger.error(f"Ollama error {res.status_code}: {res.text}")
                raise RuntimeError(f"Ollama error {res.status_code}: {res.text}")
            data = res.json()
            return data.get("message", {}).get("content", "")

    def health_check(self) -> bool:
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                return res.status_code == 200
        except Exception:
            return False


class OllamaEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL or "http://localhost:11434").rstrip("/")
        self.model = model or settings.EMBEDDING_MODEL or "nomic-embed-text"

    def embed_text(self, text: str) -> List[float]:
        url = f"{self.base_url}/api/embeddings"
        payload = {"model": self.model, "prompt": text}
        with httpx.Client(timeout=15.0) as client:
            res = client.post(url, json=payload)
            if res.status_code != 200:
                logger.error(f"Ollama embedding error: {res.status_code} - {res.text}")
                raise RuntimeError(f"Ollama embedding error: {res.text}")
            return res.json().get("embedding", [])

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]
