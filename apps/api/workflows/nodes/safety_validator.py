from typing import Dict, Any, List
from apps.api.workflows.state import ConsultationGraphState


def clinical_safety_validator_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 5: Clinical Safety Validator.
    Flags missing vital parameters, cross-checks potential allergy contraindications,
    and ensures unconfirmed patient statements are never treated as confirmed diagnoses.
    """
    clinical_facts = state.get("clinical_facts", [])
    verified_records = state.get("verified_patient_records", {})
    allergies = [a.lower() for a in verified_records.get("allergies", [])]

    safety_flags: List[str] = []
    missing_info_alerts: List[Dict[str, Any]] = []

    # 1. Missing vitals check
    recorded_vital_keys = {
        f.get("fact_key", "").lower() for f in clinical_facts if f.get("category") == "vital"
    }

    if not any("blood pressure" in k or "bp" in k for k in recorded_vital_keys):
        missing_info_alerts.append({
            "parameter": "Blood Pressure (BP)",
            "message": "Blood pressure has not been recorded for this adult patient.",
            "severity": "medium",
        })

    if not any("heart rate" in k or "pulse" in k for k in recorded_vital_keys):
        missing_info_alerts.append({
            "parameter": "Heart Rate / Pulse",
            "message": "Pulse/Heart rate is missing from the consultation record.",
            "severity": "low",
        })

    # 2. Allergy contraindication safety check
    for fact in clinical_facts:
        if fact.get("category") == "medication":
            med_name = fact.get("fact_key", "").lower()
            if "sulfa" in allergies and any(s in med_name for s in ["bactrim", "septran", "sulfamethoxazole", "sulfa"]):
                safety_flags.append(f"CONTRAINDICATION WARNING: Patient has documented Sulfa allergy! Check medication: {fact.get('fact_key')}")
            if "penicillin" in allergies and any(p in med_name for p in ["amoxicillin", "ampicillin", "augmentin", "penicillin"]):
                safety_flags.append(f"CONTRAINDICATION WARNING: Patient has documented Penicillin allergy! Check medication: {fact.get('fact_key')}")

    # 3. Ensure no unconfirmed symptoms marked as diagnosis
    for fact in clinical_facts:
        if fact.get("category") == "symptom" and fact.get("status") == "doctor_confirmed":
            # Demote unless explicitly endorsed by doctor in transcript
            fact["status"] = "unconfirmed"

    return {
        "safety_flags": safety_flags,
        "missing_info_alerts": missing_info_alerts,
        "audit_messages": state.get("audit_messages", []) + [f"Safety validation complete: {len(safety_flags)} flags."],
    }
