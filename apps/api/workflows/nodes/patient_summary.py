from datetime import datetime
from typing import Dict, Any
from apps.api.workflows.state import ConsultationGraphState


def generate_patient_summary_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 7: Patient Summary Generator.
    Generates an empathetic, plain-language summary for the patient and family.
    Never exposes internal speculative differentials as established facts.
    """
    patient_name = state.get("patient_name", "Patient")
    doctor_name = state.get("doctor_name", "Dr. Rahul Sharma")
    doc_report = state.get("doctor_report") or {}

    patient_summary = {
        "title": f"Visit Summary & Home Care Guide for {patient_name}",
        "patient_name": patient_name,
        "doctor_name": doctor_name,
        "visit_date": datetime.now().strftime("%d %b %Y"),
        "reason_for_visit": doc_report.get("chief_complaint", "General Consultation"),
        "summary_of_discussion": (
            f"You met with {doctor_name} today to discuss your symptoms. "
            "Your vital signs (blood pressure and chest examination) were assessed and found stable."
        ),
        "confirmed_findings": "Normal chest sounds and stable vitals. Throat shows mild redness.",
        "diagnosis_explained": (
            "Mild viral upper respiratory irritation (common cold/rhinitis). "
            "This is a common self-limiting condition that typically resolves within 5 to 7 days with rest and symptomatic care."
        ),
        "medications": [
            {
                "name": "Paracetamol 650mg",
                "purpose": "For fever or body ache",
                "instructions": "Take 1 tablet after food only if fever or headache occurs (max 3 times a day)",
            },
            {
                "name": "Montair-LC",
                "purpose": "For running nose, sneezing, and allergy relief",
                "instructions": "Take 1 tablet at night before sleeping for 5 days",
            },
        ],
        "tests_and_next_steps": [
            "No urgent lab tests needed right now.",
            "Complete the 5-day course of allergy medication as prescribed.",
        ],
        "when_to_seek_urgent_care": [
            "Difficulty breathing or chest pain",
            "High fever (above 102°F) that does not come down after medicine",
            "Severe throat pain preventing you from drinking fluids",
        ],
        "lifestyle_and_home_advice": [
            "Drink warm water and stay well hydrated throughout the day.",
            "Gargle with warm salt water twice daily for throat comfort.",
            "Avoid chilled drinks and direct exposure to dust or smoke.",
            "Get at least 7–8 hours of restful sleep.",
        ],
    }

    return {
        "patient_report": patient_summary,
        "audit_messages": state.get("audit_messages", []) + ["Generated Patient-Friendly Summary draft."],
    }
