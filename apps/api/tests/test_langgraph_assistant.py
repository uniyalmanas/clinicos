import pytest
from apps.api.workflows.graph import consultation_graph


def test_langgraph_doctor_question_workflow():
    initial_state = {
        "session_id": "test-session-123",
        "clinic_id": "clinic-1",
        "patient_phone": "+919876543210",
        "patient_name": "Aarav Mehta",
        "doctor_name": "Dr. Rahul Sharma",
        "action": "doctor_question",
        "doctor_query": "Does the patient have any known drug allergies?",
        "full_transcript": "Patient: I took paracetamol yesterday.",
        "transcript_turns": [],
        "clinical_facts": [],
    }

    result = consultation_graph.invoke(
        initial_state,
        config={"configurable": {"thread_id": "test-session-123"}},
    )

    assistant_resp = result.get("assistant_response")
    assert assistant_resp is not None
    assert "reply" in assistant_resp
    # No allergy was supplied: the assistant must not invent one.
    assert "sulfa" not in assistant_resp["reply"].lower()
    assert "none recorded" in assistant_resp["reply"].lower()

    # Provenance must be honest about the missing record.
    sources = assistant_resp.get("provenance_sources", [])
    assert len(sources) > 0
    assert any(s["source_type"] == "missing_info" for s in sources)


def test_langgraph_dual_report_generation_workflow():
    initial_state = {
        "session_id": "test-session-456",
        "clinic_id": "clinic-1",
        "patient_phone": "+919876543210",
        "patient_name": "Aarav Mehta",
        "doctor_name": "Dr. Rahul Sharma",
        "action": "generate_reports",
        "full_transcript": "Doctor: Your chest sounds clear. Assessment is viral bronchitis. Take Montair-LC at bedtime.",
        "transcript_turns": [],
        "clinical_facts": [
            {"category": "symptom", "fact_key": "Cough", "fact_value": {"description": "Dry cough"}, "status": "unconfirmed"},
            {"category": "vital", "fact_key": "Blood Pressure", "fact_value": {"systolic": 120, "diastolic": 80}, "status": "doctor_confirmed"},
        ],
    }

    result = consultation_graph.invoke(
        initial_state,
        config={"configurable": {"thread_id": "test-session-456"}},
    )

    doc_report = result.get("doctor_report")
    pat_report = result.get("patient_report")

    assert doc_report is not None
    assert "chief_complaint" in doc_report
    assert "doctor_confirmed_assessment" in doc_report
    assert "prescriptions" in doc_report
    assert doc_report["vitals"] == {"Blood Pressure": {"systolic": 120, "diastolic": 80}}
    assert doc_report["prescriptions"] == []
    assert "Not documented" in doc_report["doctor_confirmed_assessment"]

    assert pat_report is not None
    assert "summary_of_discussion" in pat_report
    assert "when_to_seek_urgent_care" in pat_report
    assert "lifestyle_and_home_advice" in pat_report
    assert pat_report["medications"] == []
