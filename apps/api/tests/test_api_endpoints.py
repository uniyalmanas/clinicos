import uuid
import pytest
from apps.api.models.consultation import ConsultationSession, TranscriptTurn, ClinicalFact


def test_consultation_session_create_and_get(client):
    clinic_id = str(uuid.uuid4())
    payload = {
        "clinic_id": clinic_id,
        "patient_phone": "+919123456789",
        "patient_name": "Ramesh Kumar",
        "patient_uhid": "2026-9055",
        "doctor_slug": "dr-rahul-sharma",
        "doctor_name": "Dr. Rahul Sharma",
        "language": "english",
    }

    res = client.post("/api/consultations/sessions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["patient_name"] == "Ramesh Kumar"
    assert data["consent_obtained"] is True
    session_id = data["id"]

    # Get session
    get_res = client.get(f"/api/consultations/sessions/{session_id}")
    assert get_res.status_code == 200
    session_data = get_res.json()
    assert session_data["session"]["patient_name"] == "Ramesh Kumar"


def test_transcript_turn_and_speaker_correction(client, sample_session):
    sess_id = str(sample_session.id)

    # 1. Add turn
    turn_payload = {
        "turn_index": 1,
        "speaker": "uncertain",
        "transcript_text": "I have headache and fever since two days.",
    }
    turn_res = client.post(f"/api/consultations/sessions/{sess_id}/turns", json=turn_payload)
    assert turn_res.status_code == 200
    turn_data = turn_res.json()
    turn_id = turn_data["turn"]["id"]

    # 2. Correct speaker
    corr_payload = {
        "speaker": "patient",
        "reason": "Clear patient complaint",
    }
    corr_res = client.patch(f"/api/consultations/turns/{turn_id}/speaker", json=corr_payload)
    assert corr_res.status_code == 200
    assert corr_res.json()["speaker"] == "patient"


def test_doctor_companion_ask(client, sample_session):
    sess_id = str(sample_session.id)

    query_payload = {
        "question": "What allergies does this patient have?",
    }
    ask_res = client.post(f"/api/companion/ask?session_id={sess_id}", json=query_payload)
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "reply" in data
    assert len(data.get("provenance_sources", [])) > 0


def test_report_generation_and_approval_flow(client, sample_session):
    sess_id = str(sample_session.id)

    # 1. Add turn
    client.post(
        f"/api/consultations/sessions/{sess_id}/turns",
        json={"turn_index": 1, "speaker": "doctor", "transcript_text": "Chest is clear. Assessment is viral rhinitis. Take Montair-LC."},
    )

    # 2. Generate dual reports
    gen_res = client.post(f"/api/consultations/sessions/{sess_id}/generate-reports")
    assert gen_res.status_code == 200
    report_data = gen_res.json()
    assert "doctor_report" in report_data
    assert "patient_report" in report_data

    # 3. Approve reports
    approval_payload = {
        "approved_by_name": "Dr. Rahul Sharma",
    }
    appr_res = client.post(f"/api/consultations/sessions/{sess_id}/reports/approve", json=approval_payload)
    assert appr_res.status_code == 200
    assert appr_res.json()["status_code"] == "approved"
