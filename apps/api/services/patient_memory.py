import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from apps.api.models.consultation import ClinicalFact, ConsultationSession
from apps.api.models.patient_memory import ClinicalSource, ClinicalFactVersion, ClinicalFactRelation
from apps.api.schemas.clinical_memory import ClinicalFactResponse
from apps.api.schemas.patient_memory import (
    ClinicalSourceResponse,
    PatientTimelineItem,
    PatientMemoryResponse,
    PatientContextSummaryResponse,
)

logger = logging.getLogger("patient_memory")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PatientMemoryService:
    @staticmethod
    def resolve_patient_id(db: Session, patient_id_or_uhid: str) -> str:
        """
        Resolves patient ID whether supplied as a UUID or UHID string.
        """
        try:
            row = db.execute(
                text("SELECT id FROM patients WHERE id = :val OR uhid = :val LIMIT 1"),
                {"val": patient_id_or_uhid},
            ).mappings().first()
            if row and row.get("id"):
                return str(row["id"])
        except Exception:
            # If patients table is not available in test env, check consultation_sessions
            pass

        try:
            cs_row = db.execute(
                text("SELECT patient_id FROM consultation_sessions WHERE patient_id = :val OR patient_uhid = :val LIMIT 1"),
                {"val": patient_id_or_uhid},
            ).mappings().first()
            if cs_row and cs_row.get("patient_id"):
                return str(cs_row["patient_id"])
        except Exception:
            pass

        return patient_id_or_uhid

    @classmethod
    def get_patient_memory(cls, db: Session, clinic_id: str, patient_id_or_uhid: str) -> PatientMemoryResponse:
        """
        Retrieves all longitudinal clinical facts and sources for a patient in a clinic.
        """
        resolved_pid = cls.resolve_patient_id(db, patient_id_or_uhid)

        # 1. Fetch facts (patient-scoped or matching consultation sessions of this patient)
        facts = (
            db.query(ClinicalFact)
            .filter(
                (ClinicalFact.patient_id == resolved_pid)
                | (
                    ClinicalFact.consultation_id.in_(
                        db.query(ConsultationSession.id).filter(
                            (ConsultationSession.patient_id == resolved_pid)
                            | (ConsultationSession.patient_uhid == patient_id_or_uhid)
                        )
                    )
                )
            )
            .order_by(ClinicalFact.created_at.desc())
            .all()
        )

        # 2. Fetch sources
        sources = (
            db.query(ClinicalSource)
            .filter(
                (ClinicalSource.patient_id == resolved_pid)
                | (ClinicalSource.clinic_id == clinic_id)
            )
            .order_by(ClinicalSource.created_at.desc())
            .all()
        )

        categorized: Dict[str, List[ClinicalFactResponse]] = {}
        verified_count = 0
        unverified_count = 0

        for f in facts:
            source_quotes = [s.exact_quote for s in f.sources if s.exact_quote]
            fact_resp = ClinicalFactResponse(
                id=str(f.id),
                consultation_id=str(f.consultation_id),
                clinic_id=str(f.clinic_id) if f.clinic_id else clinic_id,
                patient_id=str(f.patient_id) if f.patient_id else resolved_pid,
                source_id=str(f.source_id) if f.source_id else None,
                category=f.category,
                fact_key=f.fact_key,
                fact_value=f.fact_value or {},
                status=f.status,
                verification_status=f.verification_status or "UNVERIFIED",
                confidence=f.confidence or 0.85,
                code_system=f.code_system,
                clinical_code=f.clinical_code,
                observed_at=f.observed_at or f.created_at,
                valid_from=f.valid_from or f.created_at,
                valid_until=f.valid_until,
                extracted_by=f.extracted_by or "ai_ambient_companion",
                verified_by=f.verified_by,
                verified_at=f.verified_at,
                source_quotes=source_quotes,
                created_at=f.created_at,
            )

            if fact_resp.verification_status == "DOCTOR_VERIFIED":
                verified_count += 1
            elif fact_resp.verification_status == "UNVERIFIED":
                unverified_count += 1

            cat = f.category or "other"
            if cat not in categorized:
                categorized[cat] = []
            categorized[cat].append(fact_resp)

        sources_resp = [
            ClinicalSourceResponse(
                id=str(s.id),
                clinic_id=str(s.clinic_id),
                patient_id=str(s.patient_id) if s.patient_id else None,
                encounter_id=str(s.encounter_id) if s.encounter_id else None,
                source_type=s.source_type,
                source_title=s.source_title,
                source_metadata=s.source_metadata or {},
                created_at=s.created_at,
            )
            for s in sources
        ]

        return PatientMemoryResponse(
            patient_id=resolved_pid,
            total_facts=len(facts),
            verified_count=verified_count,
            unverified_count=unverified_count,
            categorized_facts=categorized,
            sources=sources_resp,
        )

    @classmethod
    def get_patient_timeline(cls, db: Session, clinic_id: str, patient_id_or_uhid: str) -> List[PatientTimelineItem]:
        """
        Constructs a chronological clinical timeline of all facts and encounters.
        """
        resolved_pid = cls.resolve_patient_id(db, patient_id_or_uhid)
        timeline: List[PatientTimelineItem] = []

        # 1. Add encounters
        encounters = (
            db.query(ConsultationSession)
            .filter(
                (ConsultationSession.patient_id == resolved_pid)
                | (ConsultationSession.patient_uhid == patient_id_or_uhid)
            )
            .order_by(ConsultationSession.created_at.desc())
            .all()
        )
        for enc in encounters:
            timeline.append(
                PatientTimelineItem(
                    id=str(enc.id),
                    item_type="encounter",
                    timestamp=enc.created_at,
                    title=f"Clinical Consultation - {enc.doctor_name or 'Physician'}",
                    category="encounter",
                    verification_status="DOCTOR_VERIFIED",
                    summary=f"Consultation encounter recorded with {enc.patient_name or 'Patient'}",
                    details={
                        "doctor_name": enc.doctor_name,
                        "patient_name": enc.patient_name,
                        "session_id": str(enc.id),
                    },
                )
            )

        # 2. Add clinical facts
        facts = (
            db.query(ClinicalFact)
            .filter(
                (ClinicalFact.patient_id == resolved_pid)
                | (
                    ClinicalFact.consultation_id.in_(
                        db.query(ConsultationSession.id).filter(
                            (ConsultationSession.patient_id == resolved_pid)
                            | (ConsultationSession.patient_uhid == patient_id_or_uhid)
                        )
                    )
                )
            )
            .order_by(ClinicalFact.observed_at.desc())
            .all()
        )

        for f in facts:
            val_str = ""
            if isinstance(f.fact_value, dict):
                val_str = f.fact_value.get("text") or f.fact_value.get("value") or str(f.fact_value)
            else:
                val_str = str(f.fact_value)

            timeline.append(
                PatientTimelineItem(
                    id=str(f.id),
                    item_type="fact",
                    timestamp=f.observed_at or f.created_at,
                    title=f"{f.category.replace('_', ' ').title()}: {f.fact_key}",
                    category=f.category,
                    verification_status=f.verification_status or "UNVERIFIED",
                    summary=f"{f.fact_key}: {val_str}",
                    details={
                        "fact_key": f.fact_key,
                        "fact_value": f.fact_value,
                        "confidence": f.confidence,
                        "verified_by": f.verified_by,
                        "extracted_by": f.extracted_by,
                    },
                )
            )

        # Sort combined timeline descending by timestamp
        timeline.sort(key=lambda x: x.timestamp, reverse=True)
        return timeline

    @staticmethod
    def verify_clinical_fact(
        db: Session,
        clinic_id: str,
        fact_id: str,
        verified: bool,
        doctor_id: str,
        notes: Optional[str] = None,
        corrected_value: Optional[Dict[str, Any]] = None,
    ) -> ClinicalFact:
        """
        Physician verifies, corrects, or marks an AI-extracted fact as rejected/superseded.
        Maintains an immutable audit log in clinical_fact_versions.
        """
        fact = db.query(ClinicalFact).filter(ClinicalFact.id == fact_id).first()
        if not fact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical fact not found",
            )

        # Record version history
        old_value = fact.fact_value.copy() if isinstance(fact.fact_value, dict) else {"val": fact.fact_value}
        old_status = fact.status
        old_ver_status = fact.verification_status

        # Determine version index
        last_version = (
            db.query(ClinicalFactVersion)
            .filter(ClinicalFactVersion.fact_id == fact_id)
            .order_by(ClinicalFactVersion.version_index.desc())
            .first()
        )
        new_version_index = (last_version.version_index + 1) if last_version else 1

        # Determine new values
        new_value = corrected_value if corrected_value is not None else old_value
        new_ver_status = "DOCTOR_VERIFIED" if verified else "SUPERSEDED"
        new_status = "corrected" if corrected_value is not None else ("doctor_confirmed" if verified else "uncertain")

        version_record = ClinicalFactVersion(
            fact_id=fact.id,
            version_index=new_version_index,
            previous_value=old_value,
            new_value=new_value,
            previous_status=old_status,
            new_status=new_status,
            previous_verification_status=old_ver_status,
            new_verification_status=new_ver_status,
            changed_by=doctor_id,
            change_reason=notes or ("Physician verification" if verified else "Rejected by physician"),
            created_at=utcnow(),
        )
        db.add(version_record)

        # Update fact
        fact.fact_value = new_value
        fact.status = new_status
        fact.verification_status = new_ver_status
        fact.verified_by = doctor_id
        fact.verified_at = utcnow()
        fact.updated_at = utcnow()

        db.commit()
        db.refresh(fact)
        return fact

    @staticmethod
    def supersede_clinical_fact(
        db: Session,
        clinic_id: str,
        fact_id: str,
        superseded_by_fact_id: Optional[str] = None,
        reason: str = "Superseded by newer clinical findings",
        replacement_value: Optional[Dict[str, Any]] = None,
        doctor_id: str = "doctor",
    ) -> Dict[str, Any]:
        """
        Marks an existing fact as superseded and creates a semantic relation linking to the newer fact.
        """
        fact = db.query(ClinicalFact).filter(ClinicalFact.id == fact_id).first()
        if not fact:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical fact not found",
            )

        target_id = superseded_by_fact_id

        # If a replacement value is provided without a target fact, create a new verified replacement fact
        if replacement_value and not target_id:
            new_fact = ClinicalFact(
                consultation_id=fact.consultation_id,
                clinic_id=fact.clinic_id or clinic_id,
                patient_id=fact.patient_id,
                category=fact.category,
                fact_key=fact.fact_key,
                fact_value=replacement_value,
                status="doctor_confirmed",
                verification_status="DOCTOR_VERIFIED",
                confidence=1.0,
                code_system=fact.code_system,
                clinical_code=fact.clinical_code,
                extracted_by="physician_replacement",
                verified_by=doctor_id,
                verified_at=utcnow(),
                observed_at=utcnow(),
                valid_from=utcnow(),
            )
            db.add(new_fact)
            db.flush()
            target_id = str(new_fact.id)

        # Update original fact status
        old_val = fact.fact_value.copy() if isinstance(fact.fact_value, dict) else {}
        fact.verification_status = "SUPERSEDED"
        fact.valid_until = utcnow()
        fact.updated_at = utcnow()

        # Add version
        db.add(
            ClinicalFactVersion(
                fact_id=fact.id,
                version_index=999,
                previous_value=old_val,
                new_value=old_val,
                previous_verification_status="DOCTOR_VERIFIED",
                new_verification_status="SUPERSEDED",
                changed_by=doctor_id,
                change_reason=reason,
                created_at=utcnow(),
            )
        )

        # If target fact exists, record relation
        if target_id:
            relation = ClinicalFactRelation(
                source_fact_id=fact.id,
                target_fact_id=target_id,
                relation_type="SUPERSEDES",
                relation_metadata={"reason": reason, "created_by": doctor_id},
                created_at=utcnow(),
            )
            db.add(relation)

        db.commit()
        db.refresh(fact)

        return {
            "superseded_fact_id": str(fact.id),
            "status": fact.verification_status,
            "target_fact_id": target_id,
            "reason": reason,
        }

    @classmethod
    def get_patient_context_summary(cls, db: Session, clinic_id: str, patient_id_or_uhid: str) -> PatientContextSummaryResponse:
        """
        Returns clean, verified patient context for ambient AI prompts.
        Strictly returns empty collections when no records exist — no hallucinations or mock data.
        """
        memory = cls.get_patient_memory(db, clinic_id, patient_id_or_uhid)

        allergies: List[str] = []
        conditions: List[str] = []
        medications: List[str] = []
        vitals: Dict[str, Any] = {}

        # Only include DOCTOR_VERIFIED facts for high-stakes clinical prompts
        for fact in memory.categorized_facts.get("allergy", []):
            if fact.verification_status == "DOCTOR_VERIFIED":
                val = fact.fact_value.get("allergen") or fact.fact_value.get("text") or fact.fact_key
                allergies.append(str(val))

        for fact in memory.categorized_facts.get("medical_history", []):
            if fact.verification_status == "DOCTOR_VERIFIED":
                val = fact.fact_value.get("condition") or fact.fact_value.get("text") or fact.fact_key
                conditions.append(str(val))

        for fact in memory.categorized_facts.get("medication", []):
            if fact.verification_status == "DOCTOR_VERIFIED":
                val = fact.fact_value.get("name") or fact.fact_value.get("text") or fact.fact_key
                medications.append(str(val))

        for fact in memory.categorized_facts.get("vital", []):
            k = fact.fact_key
            v = fact.fact_value.get("value") or fact.fact_value
            vitals[k] = v

        return PatientContextSummaryResponse(
            patient_id=memory.patient_id,
            allergies=allergies,
            active_conditions=conditions,
            medications=medications,
            recent_vitals=vitals,
            has_unverified_records=memory.unverified_count > 0,
            verified_facts_count=memory.verified_count,
        )
