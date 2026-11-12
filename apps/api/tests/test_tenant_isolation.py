import uuid
import pytest
from apps.api.models.consultation import ConsultationSession


def test_tenant_data_isolation(client, db_session):
    clinic_a = str(uuid.uuid4())
    clinic_b = str(uuid.uuid4())

    # Create session for Clinic A
    payload_a = {
        "clinic_id": clinic_a,
        "patient_phone": "+919876543210",
        "patient_name": "Patient Clinic A",
        "doctor_slug": "dr-rahul-sharma",
        "doctor_name": "Dr. Rahul Sharma",
    }
    res_a = client.post("/api/consultations/sessions", json=payload_a)
    assert res_a.status_code == 200
    sess_a_id = res_a.json()["id"]

    # Verify session A is scoped to Clinic A
    db_sess_a = db_session.query(ConsultationSession).filter(ConsultationSession.id == sess_a_id).first()
    assert str(db_sess_a.clinic_id) == clinic_a

    # Create session for Clinic B with different patient
    payload_b = {
        "clinic_id": clinic_b,
        "patient_phone": "+919999888877",
        "patient_name": "Patient Clinic B",
        "doctor_slug": "dr-ananya-verma",
        "doctor_name": "Dr. Ananya Verma",
    }
    res_b = client.post("/api/consultations/sessions", json=payload_b)
    assert res_b.status_code == 200
    sess_b_id = res_b.json()["id"]

    db_sess_b = db_session.query(ConsultationSession).filter(ConsultationSession.id == sess_b_id).first()
    assert str(db_sess_b.clinic_id) == clinic_b

    # Ensure no cross-tenant bleeding
    assert str(db_sess_a.clinic_id) != str(db_sess_b.clinic_id)
    assert db_sess_a.patient_phone != db_sess_b.patient_phone
