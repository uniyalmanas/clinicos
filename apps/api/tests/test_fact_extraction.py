import pytest
from apps.api.workflows.nodes.fact_extractor import extract_clinical_facts_node
from apps.api.workflows.state import ConsultationGraphState


def test_fact_extraction_symptoms_and_vitals():
    state: ConsultationGraphState = {
        "full_transcript": "Patient: I have had bad cough and fever for 3 days.\nDoctor: Let me check. Your BP is 120/80 and pulse is 76.",
        "transcript_turns": [],
        "clinical_facts": [],
    }

    result = extract_clinical_facts_node(state)
    facts = result.get("clinical_facts", [])
    extracted_keys = {f["fact_key"] for f in facts}

    assert "Cough" in extracted_keys or "Fever" in extracted_keys
    assert "Blood Pressure" in extracted_keys
    assert "Heart Rate" in extracted_keys

    # Check that vitals are doctor_confirmed and symptoms are unconfirmed
    for f in facts:
        if f["fact_key"] == "Blood Pressure":
            assert f["status"] == "doctor_confirmed"
            assert f["fact_value"]["systolic"] == 120
            assert f["fact_value"]["diastolic"] == 80
        elif f["fact_key"] == "Heart Rate":
            assert f["status"] == "doctor_confirmed"
            assert f["fact_value"]["bpm"] == 76
        elif f["fact_key"] in ["Cough", "Fever"]:
            assert f["status"] == "unconfirmed"  # Patient reported


def test_fact_extraction_hindi_terms():
    state: ConsultationGraphState = {
        "full_transcript": "Mujhe do din se khansi aur bukhar aa raha hai.",
        "transcript_turns": [],
        "clinical_facts": [],
    }

    result = extract_clinical_facts_node(state)
    facts = result.get("clinical_facts", [])
    extracted_keys = {f["fact_key"] for f in facts}

    assert "Cough" in extracted_keys
    assert "Fever" in extracted_keys
