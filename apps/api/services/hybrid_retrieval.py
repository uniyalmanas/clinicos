import math
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from apps.api.models.consultation import ClinicalFact, ConsultationSession
from apps.api.models.embedding import ClinicalEmbedding
from apps.api.integrations.llm.provider_factory import get_embedding_provider
from apps.api.services.patient_memory import PatientMemoryService

logger = logging.getLogger("hybrid_retrieval")


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


class HybridRetrievalService:
    @classmethod
    def index_fact_embedding(cls, db: Session, fact: ClinicalFact, embedding_provider=None) -> ClinicalEmbedding:
        """
        Generates and persists embedding for a clinical fact if not present.
        """
        existing = db.query(ClinicalEmbedding).filter(ClinicalEmbedding.fact_id == fact.id).first()
        if existing:
            return existing

        provider = embedding_provider or get_embedding_provider()
        val_str = str(fact.fact_value) if fact.fact_value else ""
        text_content = f"{fact.category} {fact.fact_key}: {val_str}"
        vec = provider.embed_text(text_content)

        emb_record = ClinicalEmbedding(
            fact_id=fact.id,
            patient_id=fact.patient_id,
            clinic_id=fact.clinic_id,
            text_content=text_content,
            embedding=vec,
            model_name="local-hybrid-v1",
        )
        db.add(emb_record)
        db.commit()
        db.refresh(emb_record)
        return emb_record

    @classmethod
    def search_patient_facts(
        cls,
        db: Session,
        clinic_id: str,
        patient_identifier: str,
        query: str,
        top_k: int = 5,
        rrf_k: int = 60,
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval:
        1. BM25 / Keyword rank
        2. Vector semantic similarity rank
        3. Reciprocal Rank Fusion (RRF)
        """
        resolved_pid = PatientMemoryService.resolve_patient_id(db, patient_identifier)
        query_clean = query.strip().lower()
        if not query_clean:
            return []

        # 1. Fetch patient facts
        facts = (
            db.query(ClinicalFact)
            .filter(
                (ClinicalFact.patient_id == resolved_pid)
                | (
                    ClinicalFact.consultation_id.in_(
                        db.query(ConsultationSession.id).filter(
                            (ConsultationSession.patient_id == resolved_pid)
                            | (ConsultationSession.patient_uhid == patient_identifier)
                        )
                    )
                )
            )
            .all()
        )

        if not facts:
            return []

        # 2. Keyword matching & score
        query_tokens = query_clean.split()
        keyword_scores: Dict[str, float] = {}

        for fact in facts:
            score = 0.0
            fact_str = f"{fact.category} {fact.fact_key} {str(fact.fact_value)}".lower()
            for token in query_tokens:
                if token in fact.fact_key.lower():
                    score += 3.0  # Exact key match receives boost
                elif token in fact.category.lower():
                    score += 1.5
                elif token in fact_str:
                    score += 1.0
            if score > 0:
                keyword_scores[str(fact.id)] = score

        # Rank by keyword descending
        sorted_keyword_ids = sorted(keyword_scores.keys(), key=lambda fid: keyword_scores[fid], reverse=True)
        keyword_ranks = {fid: rank + 1 for rank, fid in enumerate(sorted_keyword_ids)}

        # 3. Vector semantic search
        emb_provider = get_embedding_provider()
        query_vec = emb_provider.embed_text(query_clean)

        semantic_scores: Dict[str, float] = {}
        for fact in facts:
            emb_record = db.query(ClinicalEmbedding).filter(ClinicalEmbedding.fact_id == fact.id).first()
            if not emb_record:
                emb_record = cls.index_fact_embedding(db, fact, emb_provider)
            sim = cosine_similarity(query_vec, emb_record.embedding)
            semantic_scores[str(fact.id)] = sim

        # Rank by semantic similarity descending
        sorted_semantic_ids = sorted(semantic_scores.keys(), key=lambda fid: semantic_scores[fid], reverse=True)
        semantic_ranks = {fid: rank + 1 for rank, fid in enumerate(sorted_semantic_ids)}

        # 4. Reciprocal Rank Fusion (RRF)
        all_candidate_ids = set(keyword_ranks.keys()) | set(semantic_ranks.keys())
        rrf_scores: Dict[str, float] = {}

        for fid in all_candidate_ids:
            score = 0.0
            if fid in keyword_ranks:
                score += 1.0 / (rrf_k + keyword_ranks[fid])
            if fid in semantic_ranks:
                score += 1.0 / (rrf_k + semantic_ranks[fid])
            rrf_scores[fid] = score

        # 5. Sort final results
        ranked_fids = sorted(all_candidate_ids, key=lambda fid: rrf_scores[fid], reverse=True)[:top_k]

        fact_map = {str(f.id): f for f in facts}
        results: List[Dict[str, Any]] = []

        for fid in ranked_fids:
            f = fact_map.get(fid)
            if not f:
                continue
            results.append({
                "fact_id": str(f.id),
                "category": f.category,
                "fact_key": f.fact_key,
                "fact_value": f.fact_value,
                "verification_status": f.verification_status,
                "confidence": f.confidence,
                "rrf_score": round(rrf_scores[fid], 4),
                "keyword_rank": keyword_ranks.get(fid),
                "semantic_rank": semantic_ranks.get(fid),
                "semantic_similarity": round(semantic_scores.get(fid, 0.0), 4),
            })

        return results
