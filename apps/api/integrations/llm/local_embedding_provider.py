import math
import hashlib
from typing import List
from apps.api.integrations.llm.base import BaseEmbeddingProvider


class LocalDeterministicEmbeddingProvider(BaseEmbeddingProvider):
    """
    Lightweight, deterministic local embedding provider for tests and offline operation.
    Generates normalized 1536-dimensional embeddings using bag-of-words & sub-word hashing.
    Computes genuine cosine similarity for semantic matching without external API dependencies.
    """
    def __init__(self, dimensions: int = 1536):
        self.dimensions = dimensions

    def embed_text(self, text: str) -> List[float]:
        vec = [0.0] * self.dimensions
        if not text:
            return vec

        words = text.lower().split()
        for i, word in enumerate(words):
            # Primary word hash
            h = int(hashlib.sha256(word.encode("utf-8")).hexdigest(), 16)
            idx = h % self.dimensions
            vec[idx] += 1.0

            # Bigram hash for phrase context
            if i > 0:
                bi = f"{words[i-1]}_{word}"
                bi_h = int(hashlib.md5(bi.encode("utf-8")).hexdigest(), 16)
                bi_idx = bi_h % self.dimensions
                vec[bi_idx] += 0.5

        # L2 Normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]
