import uuid
import pytest
import jwt
from fastapi.testclient import TestClient

from apps.api.main import app
from apps.api.config import settings
from apps.api.database import get_db
from apps.api.core.security import ALGORITHM
from apps.api.services.patient_context import patient_context_service


def test_auth_missing_header(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    # Do NOT override get_current_user so real auth executes
    with TestClient(app) as unauthed_client:
        res = unauthed_client.get("/api/consultations/sessions/non-existent-id")
        assert res.status_code == 401
    app.dependency_overrides.clear()


def test_auth_invalid_token(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        res = client.get(
            "/api/consultations/sessions/non-existent-id",
            headers={"Authorization": "Bearer invalid.token.value"},
        )
        assert res.status_code == 401
    app.dependency_overrides.clear()


def test_clinic_tenant_authorization_forbidden(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    clinic_a = str(uuid.uuid4())
    clinic_b = str(uuid.uuid4())

    token_for_clinic_a = jwt.encode(
        {"user_id": "doc-1", "role": "doctor", "clinic_id": clinic_a},
        settings.JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )

    with TestClient(app) as client:
        # Doctor from Clinic A tries to create session in Clinic B
        res = client.post(
            "/api/consultations/sessions",
            headers={"Authorization": f"Bearer {token_for_clinic_a}"},
            json={
                "clinic_id": clinic_b,
                "patient_phone": "+919876543210",
                "patient_name": "Test Patient",
                "doctor_slug": "dr-test",
                "doctor_name": "Dr. Test",
            },
        )
        assert res.status_code == 403
        assert "not authorized" in res.json()["detail"].lower()
    app.dependency_overrides.clear()


def test_no_fabricated_clinical_data_on_empty_record(db_session):
    # Verify patient_context_service returns empty lists rather than hardcoded mock data
    records = patient_context_service.get_verified_patient_records(
        db=db_session,
        patient_phone="+919000000001",
        clinic_id=str(uuid.uuid4()),
    )
    assert records["allergies"] == []
    assert records["medical_history"] == []
    assert "Sulfa Drugs" not in str(records["allergies"])
    assert "Diabetes" not in str(records["medical_history"])
