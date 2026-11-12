import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from apps.api.database import Base

UUID_TYPE = String(36).with_variant(PG_UUID(as_uuid=True), "postgresql")
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid_str():
    return str(uuid.uuid4())


class ClinicalEmbedding(Base):
    __tablename__ = "clinical_embeddings"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    fact_id = Column(UUID_TYPE, ForeignKey("clinical_facts.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID_TYPE, nullable=True)
    clinic_id = Column(UUID_TYPE, nullable=True)
    text_content = Column(Text, nullable=False)
    embedding = Column(JSON_TYPE, nullable=False, default=list)
    model_name = Column(String(100), nullable=False, default="nomic-embed-text")
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    fact = relationship("ClinicalFact")
