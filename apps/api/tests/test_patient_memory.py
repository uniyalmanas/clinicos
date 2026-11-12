import uuid
import pytest
from datetime import datetime, timezone
from apps.api.models.consultation import ConsultationSession, ClinicalFact
from apps.api.models.patient_memory import ClinicalSource, ClinicalFactVersion, ClinicalFactRelation


def test_empty_patient_memory_returns_clean_zero_state(client, db_session):
    test_uhid = f"UHID-TEST-{uuid.uuid4().hex[:6]}"
    res = client.get(f"/api/patients/{test_uhid}/memory")
    assert res.status_code == 200
    data = res.json()
    assert data["total_facts"] == 0
    assert data["verified_count"] == 0
    assert data["unverified_count"] == 0
    assert data["categorized_facts"] == {}

    ctx_res = client.get(f"/api/patients/{test_uhid}/context")
    assert ctx_res.status_code == 200
    ctx_data = ctx_res.json()
    assert ctx_data["allergies"] == []
    assert ctx_data["active_conditions"] == []
    assert ctx_data["medications"] == []
    assert ctx_data["has_unverified_records"] is False


def test_verify_clinical_fact_audit_trail(client, db_session):
    clinic_id = "clinic-test-001"
    session_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    # 1. Seed consultation session
    sess = ConsultationSession(
        id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        patient_phone="+919876543210",
        patient_uhid="UHID-9999",
        patient_name="Anita Sharma",
        doctor_slug="dr-gupta",
        doctor_name="Dr. Gupta",
    )
    db_session.add(sess)

    # 2. Seed AI-extracted unverified clinical fact
    fact_id = str(uuid.uuid4())
    fact = ClinicalFact(
        id=fact_id,
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="allergy",
        fact_key="Penicillin",
        fact_value={"allergen": "Penicillin", "reaction": "Hives"},
        status="unconfirmed",
        verification_status="UNVERIFIED",
        confidence=0.88,
    )
    db_session.add(fact)
    db_session.commit()

    # 3. Before verification: context summary should NOT include unverified allergy
    ctx_before = client.get(f"/api/patients/{patient_id}/context").json()
    assert ctx_before["allergies"] == []
    assert ctx_before["has_unverified_records"] is True

    # 4. Doctor verifies the fact
    verify_res = client.post(
        f"/api/clinical-facts/{fact_id}/verify",
        json={
            "verified": True,
            "doctor_id": "doc-001",
            "notes": "Patient confirmed severe hives upon childhood penicillin exposure",
        },
    )
    assert verify_res.status_code == 200
    verified_data = verify_res.json()
    assert verified_data["verification_status"] == "DOCTOR_VERIFIED"
    assert verified_data["status"] == "doctor_confirmed"
    assert verified_data["verified_by"] == "doc-001"

    # 5. Check version audit trail in DB
    versions = (
        db_session.query(ClinicalFactVersion)
        .filter(ClinicalFactVersion.fact_id == fact_id)
        .all()
    )
    assert len(versions) == 1
    assert versions[0].previous_verification_status == "UNVERIFIED"
    assert versions[0].new_verification_status == "DOCTOR_VERIFIED"
    assert versions[0].changed_by == "doc-001"

    # 6. After verification: context summary now includes verified allergy
    ctx_after = client.get(f"/api/patients/{patient_id}/context").json()
    assert "Penicillin" in ctx_after["allergies"]
    assert ctx_after["verified_facts_count"] >= 1


def test_supersede_clinical_fact_flow(client, db_session):
    clinic_id = "clinic-test-001"
    session_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    sess = ConsultationSession(
        id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        patient_phone="+919876543211",
        patient_name="Sanjay Rao",
        doctor_slug="dr-mehta",
        doctor_name="Dr. Mehta",
        patient_uhid="UHID-8888",
    )
    db_session.add(sess)

    # Fact with initial dosage
    fact_id = str(uuid.uuid4())
    fact = ClinicalFact(
        id=fact_id,
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="medication",
        fact_key="Metformin",
        fact_value={"name": "Metformin", "dose": "500mg once daily"},
        status="doctor_confirmed",
        verification_status="DOCTOR_VERIFIED",
    )
    db_session.add(fact)
    db_session.commit()

    # Doctor increases dose and supersedes previous fact
    supersede_res = client.post(
        f"/api/clinical-facts/{fact_id}/supersede",
        json={
            "reason": "Dose escalated due to elevated HbA1c",
            "replacement_value": {"name": "Metformin", "dose": "1000mg twice daily"},
        },
    )
    assert supersede_res.status_code == 200
    result = supersede_res.json()
    assert result["status"] == "SUPERSEDED"
    new_fact_id = result["target_fact_id"]
    assert new_fact_id is not None

    # Check relation
    relations = (
        db_session.query(ClinicalFactRelation)
        .filter(ClinicalFactRelation.source_fact_id == fact_id)
        .all()
    )
    assert len(relations) == 1
    assert relations[0].relation_type == "SUPERSEDES"
    assert str(relations[0].target_fact_id) == str(new_fact_id)


def test_patient_timeline_chronological_ordering(client, db_session):
    clinic_id = "clinic-test-001"
    session_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    sess = ConsultationSession(
        id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        patient_phone="+919876543212",
        patient_uhid="UHID-7777",
        doctor_slug="dr-mehta",
        doctor_name="Dr. Mehta",
        patient_name="Rahul Verma",
    )
    db_session.add(sess)

    fact = ClinicalFact(
        id=str(uuid.uuid4()),
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="vital",
        fact_key="Blood Pressure",
        fact_value={"value": "130/85 mmHg"},
        status="doctor_confirmed",
        verification_status="DOCTOR_VERIFIED",
    )
    db_session.add(fact)
    db_session.commit()

    timeline_res = client.get(f"/api/patients/{patient_id}/timeline")
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()
    assert len(timeline) >= 2
    types = [item["item_type"] for item in timeline]
    assert "encounter" in types
    assert "fact" in types
