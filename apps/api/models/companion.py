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


class CompanionInteraction(Base):
    __tablename__ = "companion_interactions"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    consultation_id = Column(UUID_TYPE, ForeignKey("consultation_sessions.id", ondelete="CASCADE"), nullable=False)
    query_type = Column(String, nullable=False, default="doctor_question")
    doctor_query = Column(Text, nullable=False)
    companion_response = Column(Text, nullable=False)
    provenance_sources = Column(JSON_TYPE, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    session = relationship("ConsultationSession", back_populates="interactions")


class ClinicalAuditEvent(Base):
    __tablename__ = "clinical_audit_events"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    consultation_id = Column(UUID_TYPE, ForeignKey("consultation_sessions.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(UUID_TYPE, nullable=False)
    actor_type = Column(String, nullable=False, default="doctor")
    actor_name = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(JSON_TYPE, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    session = relationship("ConsultationSession", back_populates="audit_events")
