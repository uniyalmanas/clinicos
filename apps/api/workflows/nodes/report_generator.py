from datetime import datetime
from typing import Dict, Any, List
from apps.api.workflows.state import ConsultationGraphState


def _fact_text(fact: Dict[str, Any]) -> str:
    """Render a fact value without inventing clinical detail."""
    value = fact.get("fact_value")
    if isinstance(value, dict):
        parts = [f"{k}: {v}" for k, v in value.items() if v not in (None, "")]
        return "; ".join(parts) or "Not documented"
    if value in (None, ""):
        return "Not documented"
    return str(value)


def generate_doctor_report_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 6: Doctor Report Generator.
    Assembles a comprehensive, structured clinical report for clinician review and sign-off.
    """
    patient_name = state.get("patient_name", "Patient")
    patient_uhid = state.get("patient_uhid") or ""
    doctor_name = state.get("doctor_name", "Clinician")
    full_transcript = state.get("full_transcript", "")
    clinical_facts = state.get("clinical_facts", []) or []
    verified_records = state.get("verified_patient_records") or {}
    if not verified_records:
        from apps.api.workflows.nodes.patient_context import retrieve_patient_context_node
        ctx = retrieve_patient_context_node(state)
        verified_records = ctx.get("verified_patient_records", {})

    def facts_of(category: str):
        return [f for f in clinical_facts if f.get("category") == category]

    symptoms = [f.get("fact_key", "") for f in facts_of("symptom")]
    chief_complaint = ", ".join(symptoms) if symptoms else "Not documented in this consultation"

    vitals = {f.get("fact_key", "Vital"): f.get("fact_value") for f in facts_of("vital")}

    medications_found = [
        {"name": f.get("fact_key", "Medicine"), "instructions": _fact_text(f)}
        for f in facts_of("medication")
    ]

    # Provenance source quotes
    source_quotes = [f.get("exact_quote") for f in clinical_facts if f.get("exact_quote")]

    doctor_report = {
        "title": "Clinical Consultation Summary (Draft)",
        "patient_name": patient_name,
        "patient_uhid": patient_uhid,
        "doctor_name": doctor_name,
        "consultation_date": datetime.now().strftime("%d %b %Y"),
        "chief_complaint": chief_complaint,
        "history_of_present_illness": f"Symptoms recorded in this consultation: {chief_complaint}.",
        "relevant_medical_history": verified_records.get("medical_history") or ["Not on record"],
        "allergies": verified_records.get("allergies") or ["Not on record"],
        "vitals": vitals,
        "examination_findings": [
            f"{f.get('fact_key', 'Examination')}: {_fact_text(f)}" for f in facts_of("examination")
        ] or ["Not documented in this consultation"],
        "doctor_confirmed_assessment": ", ".join(
            f.get("fact_key", "") for f in facts_of("assessment")
            if f.get("status") == "doctor_confirmed"
        ) or "Not documented — clinician review required",
        "differential_diagnoses": [f.get("fact_key", "") for f in facts_of("differential")],
        "investigations_ordered": [f.get("fact_key", "") for f in facts_of("investigation")],
        "treatment_plan": [_fact_text(f) for f in facts_of("treatment_plan")],
        "prescriptions": medications_found,
        "follow_up_instructions": "; ".join(_fact_text(f) for f in facts_of("follow_up"))
        or "Not documented in this consultation",
        "red_flag_warnings": [f.get("fact_key", "") for f in facts_of("red_flag")],
        "source_references": source_quotes[:5],
    }

    return {
        "doctor_report": doctor_report,
        "audit_messages": state.get("audit_messages", []) + ["Generated Doctor Clinical Report draft."],
    }
