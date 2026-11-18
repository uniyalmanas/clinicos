import os
import sys
import uuid
import pytest
from pathlib import Path

# Add root directory to sys.path so 'apps.api' imports resolve properly
root_dir = str(Path(__file__).resolve().parent.parent.parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from apps.api.database import Base, get_db
from apps.api.core.security import get_current_user
from apps.api.main import app
from apps.api.models.consultation import ConsultationSession
from apps.api.config import settings


@pytest.fixture(autouse=True)
def disable_external_llm(monkeypatch):
    """Keep the suite hermetic: never call Gemini/Groq/Ollama during tests."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "off", raising=False)

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Create tables once for test suite
Base.metadata.create_all(bind=test_engine)


def mock_current_user():
    return {
        "user_id": "test-user-001",
        "role": "superadmin",
        "clinic_id": "clinic-test-001",
    }


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = mock_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_session(db_session):
    sess = ConsultationSession(
        id=str(uuid.uuid4()),
        clinic_id=str(uuid.uuid4()),
        patient_phone="+919876543210",
        patient_name="Aarav Mehta",
        patient_uhid="2026-9021",
        doctor_slug="dr-rahul-sharma",
        doctor_name="Dr. Rahul Sharma",
        status="active",
        consent_obtained=True,
        language="english",
    )
    db_session.add(sess)
    db_session.commit()
    db_session.refresh(sess)
    return sess
