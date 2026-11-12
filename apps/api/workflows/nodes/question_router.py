import re
from typing import Dict, Any
from apps.api.workflows.state import ConsultationGraphState


def route_doctor_question_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 3: Doctor Question Router.
    Analyzes the doctor's question to determine intent and required knowledge sources.
    """
    query = (state.get("doctor_query") or "").lower().strip()
    
    intent = "conversation_query"
    if any(k in query for k in ["allergy", "allergic", "reaction", "contraindicat"]):
        intent = "allergy_med_query"
    elif any(k in query for k in ["last time", "previous", "history", "past visit", "last visit", "pehle"]):
        intent = "history_query"
    elif any(k in query for k in ["draft", "prescribe", "write", "rx", "notes", "order"]):
        intent = "documentation_assist"
    elif any(k in query for k in ["dose", "guideline", "contraindication", "mechanism", "protocol"]):
        intent = "medical_knowledge"

    return {
        "audit_messages": state.get("audit_messages", []) + [f"Doctor query routed to intent: {intent}"],
    }
