import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from apps.api.database import Base

UUID_TYPE = String(36).with_variant(PG_UUID(as_uuid=True), "postgresql")
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid_str():
    return str(uuid.uuid4())


class ClinicalSource(Base):
    __tablename__ = "clinical_sources"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    clinic_id = Column(UUID_TYPE, nullable=False)
    patient_id = Column(UUID_TYPE, nullable=True)
    encounter_id = Column(UUID_TYPE, ForeignKey("consultation_sessions.id", ondelete="SET NULL"), nullable=True)
    source_type = Column(String(50), nullable=False)  # DOCTOR_OBSERVED, PATIENT_REPORTED, AI_EXTRACTED, IMPORTED_RECORD, LAB_RESULT, IMAGING
    source_title = Column(String, nullable=False)
    source_metadata = Column(JSON_TYPE, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    # Relationships
    encounter = relationship("ConsultationSession")
    facts = relationship("ClinicalFact", back_populates="source")


class ClinicalFactVersion(Base):
    __tablename__ = "clinical_fact_versions"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    fact_id = Column(UUID_TYPE, ForeignKey("clinical_facts.id", ondelete="CASCADE"), nullable=False)
    version_index = Column(Integer, nullable=False, default=1)
    previous_value = Column(JSON_TYPE, nullable=False, default=dict)
    new_value = Column(JSON_TYPE, nullable=False, default=dict)
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    previous_verification_status = Column(String, nullable=True)
    new_verification_status = Column(String, nullable=True)
    changed_by = Column(String, nullable=False)
    change_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    fact = relationship("ClinicalFact", back_populates="versions")


class ClinicalFactRelation(Base):
    __tablename__ = "clinical_fact_relations"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    source_fact_id = Column(UUID_TYPE, ForeignKey("clinical_facts.id", ondelete="CASCADE"), nullable=False)
    target_fact_id = Column(UUID_TYPE, ForeignKey("clinical_facts.id", ondelete="CASCADE"), nullable=False)
    relation_type = Column(String(50), nullable=False)  # CAUSES, TREATS, CONTRADICTS, SUPERSEDES, EVIDENCE_FOR
    relation_metadata = Column("metadata", JSON_TYPE, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    source_fact = relationship("ClinicalFact", foreign_keys=[source_fact_id], back_populates="outgoing_relations")
    target_fact = relationship("ClinicalFact", foreign_keys=[target_fact_id], back_populates="incoming_relations")
