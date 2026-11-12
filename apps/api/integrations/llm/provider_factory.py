import logging
from typing import Optional
from apps.api.config import settings
from apps.api.integrations.llm.base import BaseLLMProvider, BaseEmbeddingProvider
from apps.api.integrations.llm.groq_provider import GroqLLMProvider
from apps.api.integrations.llm.ollama_provider import OllamaLLMProvider, OllamaEmbeddingProvider
from apps.api.integrations.llm.local_embedding_provider import LocalDeterministicEmbeddingProvider

logger = logging.getLogger("provider_factory")


def get_llm_provider(preference: Optional[str] = None) -> BaseLLMProvider:
    """
    Returns the active LLM provider.
    Prefers preference, then settings.LLM_PROVIDER.
    Falls back gracefully between Groq and local Ollama.
    """
    provider_type = (preference or settings.LLM_PROVIDER or "groq").lower()

    if provider_type == "ollama":
        provider = OllamaLLMProvider()
        if provider.health_check():
            return provider
        logger.info("Ollama requested but not reachable, checking Groq fallback.")
        if settings.GROQ_API_KEY:
            return GroqLLMProvider()
        return provider  # Return anyway for structured errors

    # Default to Groq
    if settings.GROQ_API_KEY:
        return GroqLLMProvider()

    # If Groq has no key, check if local Ollama is active
    ollama = OllamaLLMProvider()
    if ollama.health_check():
        logger.info("Groq API key not set; automatically falling back to local Ollama.")
        return ollama

    return GroqLLMProvider()


def get_embedding_provider(preference: Optional[str] = None) -> BaseEmbeddingProvider:
    """
    Returns the active embedding provider.
    Options: 'ollama', 'local', 'openai'
    """
    pref = (preference or settings.EMBEDDING_PROVIDER or "local").lower()

    if pref == "ollama":
        ollama_emb = OllamaEmbeddingProvider()
        return ollama_emb

    # Default robust deterministic local embedding provider
    return LocalDeterministicEmbeddingProvider(dimensions=1536)
