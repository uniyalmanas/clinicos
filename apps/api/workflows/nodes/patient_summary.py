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
    doctor_name = state.get("doctor_name", "Clinician")
    doc_report = state.get("doctor_report") or {}

    reason_for_visit = doc_report.get("chief_complaint") or "Not documented in this consultation"
    findings = doc_report.get("examination_findings") or []
    assessment = doc_report.get("doctor_confirmed_assessment") or "Not documented"
    medicines = doc_report.get("prescriptions") or []
    investigations = doc_report.get("investigations_ordered") or []
    follow_up = doc_report.get("follow_up_instructions") or ""
    red_flags = doc_report.get("red_flag_warnings") or []
    home_advice = doc_report.get("treatment_plan") or []

    patient_summary = {
        "title": f"Visit Summary & Home Care Guide for {patient_name}",
        "patient_name": patient_name,
        "doctor_name": doctor_name,
        "visit_date": datetime.now().strftime("%d %b %Y"),
        "reason_for_visit": reason_for_visit,
        "summary_of_discussion": (
            "This draft is assembled only from findings recorded during the consultation. "
            "Review it with the doctor before sharing."
        ),
        "confirmed_findings": "; ".join(findings) if findings else "Not documented in this consultation",
        "diagnosis_explained": assessment,
        "medications": [
            {
                "name": m.get("name", "Medicine"),
                "purpose": "As recorded in the consultation",
                "instructions": m.get("instructions") or m.get("dosage") or "Not documented",
            }
            for m in medicines
        ],
        "tests_and_next_steps": list(investigations) + ([follow_up] if follow_up else []),
        "when_to_seek_urgent_care": list(red_flags),
        "lifestyle_and_home_advice": list(home_advice),
    }

    return {
        "patient_report": patient_summary,
        "audit_messages": state.get("audit_messages", []) + ["Generated Patient-Friendly Summary draft."],
    }
