import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
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


class ConsultationSession(Base):
    __tablename__ = "consultation_sessions"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    clinic_id = Column(UUID_TYPE, nullable=False)
    patient_id = Column(UUID_TYPE, nullable=True)
    patient_phone = Column(String, nullable=False)
    patient_name = Column(String, nullable=False)
    patient_uhid = Column(String, nullable=True)
    doctor_slug = Column(String, nullable=False)
    doctor_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="active")  # active, paused, finalized, cancelled
    consent_obtained = Column(Boolean, nullable=False, default=False)
    consent_timestamp = Column(DateTime(timezone=True), nullable=True)
    language = Column(String, nullable=False, default="english")  # english, hindi, hinglish
    started_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    finalized_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    turns = relationship("TranscriptTurn", back_populates="session", cascade="all, delete-orphan", order_by="TranscriptTurn.turn_index")
    facts = relationship("ClinicalFact", back_populates="session", cascade="all, delete-orphan")
    interactions = relationship("CompanionInteraction", back_populates="session", cascade="all, delete-orphan")
    audit_events = relationship("ClinicalAuditEvent", back_populates="session", cascade="all, delete-orphan")
    reports = relationship("ConsultationReport", back_populates="session")


class TranscriptTurn(Base):
    __tablename__ = "transcript_turns"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    consultation_id = Column(UUID_TYPE, ForeignKey("consultation_sessions.id", ondelete="CASCADE"), nullable=False)
    turn_index = Column(Integer, nullable=False)
    speaker = Column(String, nullable=False, default="uncertain")  # doctor, patient, uncertain
    speaker_confidence = Column(Float, default=0.50)
    speaker_manually_corrected = Column(Boolean, nullable=False, default=False)
    transcript_text = Column(Text, nullable=False)
    language = Column(String, nullable=False, default="english")
    provider_event_id = Column(String, nullable=True)
    started_at_ms = Column(Integer, nullable=False, default=0)
    ended_at_ms = Column(Integer, nullable=False, default=0)
    processing_status = Column(String, nullable=False, default="completed")  # pending, processing, completed, error
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    session = relationship("ConsultationSession", back_populates="turns")
    source_refs = relationship("FactSourceReference", back_populates="turn", cascade="all, delete-orphan")


class ClinicalFact(Base):
    __tablename__ = "clinical_facts"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    consultation_id = Column(UUID_TYPE, ForeignKey("consultation_sessions.id", ondelete="CASCADE"), nullable=False)
    clinic_id = Column(UUID_TYPE, nullable=True)
    patient_id = Column(UUID_TYPE, nullable=True)
    source_id = Column(UUID_TYPE, ForeignKey("clinical_sources.id", ondelete="SET NULL"), nullable=True)
    category = Column(String, nullable=False)  # chief_complaint, symptom, medical_history, allergy, medication, vital, examination, assessment, investigation, treatment_plan, follow_up, missing_info, uncertain_info
    fact_key = Column(String, nullable=False)
    fact_value = Column(JSON_TYPE, nullable=False, default=dict)
    status = Column(String, nullable=False, default="unconfirmed")  # unconfirmed, doctor_confirmed, corrected, uncertain
    verification_status = Column(String, nullable=False, default="UNVERIFIED")  # UNVERIFIED, DOCTOR_VERIFIED, CONFLICTING, SUPERSEDED
    confidence = Column(Float, default=0.85)
    code_system = Column(String, nullable=True)  # ICD-10, SNOMED-CT, RxNorm, LOINC
    clinical_code = Column(String, nullable=True)
    observed_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    valid_from = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    valid_until = Column(DateTime(timezone=True), nullable=True)
    extracted_by = Column(String, nullable=False, default="ai_ambient_companion")
    verified_by = Column(String, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    session = relationship("ConsultationSession", back_populates="facts")
    sources = relationship("FactSourceReference", back_populates="fact", cascade="all, delete-orphan")
    source = relationship("ClinicalSource", back_populates="facts")
    versions = relationship("ClinicalFactVersion", back_populates="fact", cascade="all, delete-orphan")
    outgoing_relations = relationship(
        "ClinicalFactRelation",
        foreign_keys="ClinicalFactRelation.source_fact_id",
        back_populates="source_fact",
        cascade="all, delete-orphan",
    )
    incoming_relations = relationship(
        "ClinicalFactRelation",
        foreign_keys="ClinicalFactRelation.target_fact_id",
        back_populates="target_fact",
        cascade="all, delete-orphan",
    )


class FactSourceReference(Base):
    __tablename__ = "fact_source_references"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    fact_id = Column(UUID_TYPE, ForeignKey("clinical_facts.id", ondelete="CASCADE"), nullable=False)
    turn_id = Column(UUID_TYPE, ForeignKey("transcript_turns.id", ondelete="CASCADE"), nullable=False)
    exact_quote = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)

    fact = relationship("ClinicalFact", back_populates="sources")
    turn = relationship("TranscriptTurn", back_populates="source_refs")
