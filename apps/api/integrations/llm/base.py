from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLMProvider(ABC):
    @abstractmethod
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        response_format: Optional[Dict[str, Any]] = None,
        max_tokens: int = 1500,
    ) -> str:
        """
        Executes a chat completion request and returns the string response.
        """
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """
        Returns True if the provider service is accessible and configured.
        """
        pass


class BaseEmbeddingProvider(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """
        Generates a vector embedding for a single text string.
        """
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generates vector embeddings for a batch of text strings.
        """
        pass
