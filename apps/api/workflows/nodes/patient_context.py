import logging
from typing import Dict, Any
from apps.api.workflows.state import ConsultationGraphState

logger = logging.getLogger("patient_context_node")


def retrieve_patient_context_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 2: Patient Context Retrieval.
    Ensures verified longitudinal records (Allergies, Chronic Conditions, Past Visits)
    are loaded into the graph state for safe cross-referencing.
    """
    records = state.get("verified_patient_records")
    if records and isinstance(records, dict):
        return {"verified_patient_records": records}

    # No longitudinal records were supplied. Use only identities present in the
    # graph state; never populate allergies, history or visits with invented
    # examples — fabricated allergies can suppress real safety warnings.
    records = {
        "patient_name": state.get("patient_name", "Patient"),
        "patient_phone": state.get("patient_phone", ""),
        "patient_uhid": state.get("patient_uhid") or "",
        "allergies": [],
        "medical_history": [],
        "past_visits": [],
    }

    return {
        "verified_patient_records": records,
        "audit_messages": state.get("audit_messages", [])
        + ["No verified longitudinal records on file for this patient."],
    }
