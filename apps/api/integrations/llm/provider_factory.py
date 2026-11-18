import logging
from typing import List, Dict, Any, Optional

from apps.api.config import settings
from apps.api.integrations.llm.base import BaseLLMProvider, BaseEmbeddingProvider
from apps.api.integrations.llm.gemini_provider import GeminiLLMProvider
from apps.api.integrations.llm.groq_provider import GroqLLMProvider
from apps.api.integrations.llm.ollama_provider import (
    OllamaLLMProvider,
    OllamaEmbeddingProvider,
)
from apps.api.integrations.llm.local_embedding_provider import (
    LocalDeterministicEmbeddingProvider,
)

logger = logging.getLogger("provider_factory")


class ChainLLMProvider(BaseLLMProvider):
    """
    Tries each provider in order and returns the first successful answer.

    This gives the clinical workflow a real fallback path: a Gemini outage or
    a retired model name degrades to Groq, then to local Ollama, instead of
    silently dropping to the deterministic rule engine.
    """

    def __init__(self, providers: List[BaseLLMProvider]):
        self.providers = [p for p in providers if p is not None]

    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        response_format: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1500,
    ) -> str:
        errors: List[str] = []
        for provider in self.providers:
            name = provider.__class__.__name__
            try:
                if not provider.health_check():
                    continue
                return provider.chat_completion(
                    messages=messages,
                    temperature=temperature,
                    response_format=response_format,
                    max_tokens=max_tokens,
                )
            except Exception as exc:  # noqa: BLE001 - we want to try the next vendor
                logger.warning("%s failed, trying next provider: %s", name, exc)
                errors.append(f"{name}: {exc}")

        if errors:
            raise RuntimeError("All LLM providers failed — " + " | ".join(errors))
        raise RuntimeError(
            "No LLM provider is configured. Set GEMINI_API_KEY or GROQ_API_KEY, "
            "or run a local Ollama instance."
        )

    def health_check(self) -> bool:
        return any(p.health_check() for p in self.providers)


def get_llm_provider(preference: Optional[str] = None) -> BaseLLMProvider:
    """
    Returns the active LLM provider chain.

    Preference order:
      - ``gemini`` → Gemini, Groq, Ollama
      - ``groq``   → Groq, Gemini, Ollama
      - ``ollama`` → Ollama, Gemini, Groq
      - anything else / unset → Gemini, Groq, Ollama (auto)

    Gemini is preferred by default when an API key is present.
    """
    provider_type = (preference if preference is not None else settings.LLM_PROVIDER or "").lower()

    gemini = lambda: GeminiLLMProvider()  # noqa: E731
    groq = lambda: GroqLLMProvider()  # noqa: E731
    ollama = lambda: OllamaLLMProvider()  # noqa: E731

    if provider_type == "llama":
        # Backwards-compatible alias used by older deployments.
        provider_type = "groq"

    if provider_type in ("off", "disabled", "none"):
        # Operational kill-switch: force deterministic/heuristic responses.
        # Also used by the test suite so tests never call a paid API.
        return ChainLLMProvider([])

    if provider_type == "gemini":
        chain = [gemini(), groq(), ollama()]
    elif provider_type == "groq":
        chain = [groq(), gemini(), ollama()]
    elif provider_type == "ollama":
        chain = [ollama(), gemini(), groq()]
    else:
        chain = [gemini(), groq(), ollama()]

    return ChainLLMProvider(chain)


def get_embedding_provider(preference: Optional[str] = None) -> BaseEmbeddingProvider:
    """
    Returns the active embedding provider.

    Options: 'ollama' or 'local'. Gemini/Groq are chat providers only here.
    """
    pref = (preference or settings.EMBEDDING_PROVIDER or "local").lower()

    if pref == "ollama":
        return OllamaEmbeddingProvider()

    return LocalDeterministicEmbeddingProvider(dimensions=1536)
