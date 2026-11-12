from typing import TypedDict, List, Dict, Any, Optional


class ConsultationGraphState(TypedDict, total=False):
    # Identifiers
    session_id: str
    clinic_id: str
    patient_phone: str
    patient_name: str
    patient_uhid: Optional[str]
    doctor_name: str
    language: str

    # Workflow Action ('process_turn', 'doctor_question', 'generate_reports')
    action: str

    # Conversation & Transcript Turns
    transcript_turns: List[Dict[str, Any]]
    latest_turn: Optional[Dict[str, Any]]
    full_transcript: str

    # Clinical Memory Facts
    clinical_facts: List[Dict[str, Any]]
    extracted_facts: List[Dict[str, Any]]

    # Verified Patient Records (Longitudinal History)
    verified_patient_records: Dict[str, Any]

    # Doctor-Initiated Q&A
    doctor_query: Optional[str]
    assistant_response: Optional[Dict[str, Any]]

    # Generated Reports & Summaries
    doctor_report: Optional[Dict[str, Any]]
    patient_report: Optional[Dict[str, Any]]

    # Safety Validation & Missing Info Alerts
    safety_flags: List[str]
    missing_info_alerts: List[Dict[str, Any]]
    
    # Audit log
    audit_messages: List[str]
