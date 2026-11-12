import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from apps.api.database import Base

UUID_TYPE = String(36).with_variant(PG_UUID(as_uuid=True), "postgresql")
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid_str():
    return str(uuid.uuid4())


class ConsultationReport(Base):
    __tablename__ = "consultation_reports"

    id = Column(UUID_TYPE, primary_key=True, default=gen_uuid_str)
    clinic_id = Column(UUID_TYPE, nullable=False)
    session_id = Column(UUID_TYPE, ForeignKey("consultation_sessions.id", ondelete="SET NULL"), nullable=True)
    appointment_number = Column(String, nullable=True)
    patient_phone = Column(String, nullable=False)
    patient_name = Column(String, nullable=False)
    doctor_slug = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    language = Column(String, nullable=False, default="auto")
    duration_seconds = Column(Integer, nullable=True)
    transcript = Column(Text, nullable=False, default="")
    chief_complaints = Column(Text, nullable=True)
    provisional_diagnosis = Column(Text, nullable=True)
    vitals = Column(JSON_TYPE, nullable=False, default=dict)
    medicines = Column(JSON_TYPE, nullable=False, default=list)
    lab_tests = Column(JSON_TYPE, nullable=False, default=list)
    doctor_report = Column(JSON_TYPE, nullable=False, default=dict)
    patient_report = Column(JSON_TYPE, nullable=False, default=dict)
    status = Column(String, nullable=False, default="draft")
    approved_by = Column(UUID_TYPE, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow)

    session = relationship("ConsultationSession", back_populates="reports")
