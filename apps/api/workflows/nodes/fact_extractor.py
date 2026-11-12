import re
import json
import logging
from typing import Dict, Any, List
import httpx
from apps.api.config import settings
from apps.api.integrations.llm.provider_factory import get_llm_provider
from apps.api.workflows.state import ConsultationGraphState

logger = logging.getLogger("fact_extractor")


def extract_clinical_facts_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 1: Clinical Fact Extractor.
    Extracts structured facts from the latest turn and full transcript,
    preserving exact source quotes and setting appropriate clinical confirmation statuses.
    """
    full_transcript = state.get("full_transcript", "")
    transcript_turns = state.get("transcript_turns", [])
    existing_facts = list(state.get("clinical_facts", []))

    if not full_transcript and transcript_turns:
        full_transcript = "\n".join([f"{t.get('speaker', 'uncertain')}: {t.get('transcript_text', '')}" for t in transcript_turns])

    new_facts: List[Dict[str, Any]] = []

    # 1. Try LLM extraction via provider abstraction (Groq / Ollama)
    llm_extracted = False
    if full_transcript.strip():
        try:
            llm_provider = get_llm_provider()
            if llm_provider.health_check():
                prompt = f"""You are a specialized Clinical Fact Extraction AI for ClinicOS.
Analyze this doctor-patient consultation transcript and extract clinical facts.

TRANSCRIPT:
{full_transcript}

Extract JSON array of facts where each fact has:
- category: one of ["chief_complaint", "symptom", "vital", "allergy", "medication", "examination", "assessment", "investigation", "treatment_plan", "follow_up"]
- fact_key: short identifier (e.g. "Cough", "Blood Pressure", "Montair-LC", "Sulfa Allergy")
- fact_value: object with details (e.g. {{"symptom": "dry cough", "duration": "3 days", "severity": "moderate"}})
- status: "unconfirmed" for patient symptoms, "doctor_confirmed" ONLY if doctor explicitly confirms it. NEVER convert patient statement to confirmed diagnosis.
- exact_quote: verbatim substring from the transcript proving this fact.

Return ONLY a valid JSON array of fact objects."""

                messages = [
                    {"role": "system", "content": "You are a clinical fact extraction engine. Respond with JSON array only."},
                    {"role": "user", "content": prompt},
                ]
                content = llm_provider.chat_completion(
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1024,
                ).strip()

                if content.startswith("```"):
                    content = re.sub(r"^```[a-z]*\n?", "", content)
                    content = re.sub(r"```$", "", content).strip()
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "facts" in parsed:
                    parsed = parsed["facts"]
                if isinstance(parsed, list):
                    new_facts = parsed
                    llm_extracted = True
        except Exception as e:
            logger.warning(f"LLM fact extraction fallback triggered: {e}")

    # 2. Resilient Deterministic Medical Rule-Based Extractor (Fallback & Validation)
    if not llm_extracted:
        text_lower = full_transcript.lower()

        # Vitals extraction
        bp_match = re.search(r"\b(?:bp|blood pressure)\s*(?:is|was)?\s*([0-9]{2,3})\s*(?:/|over)\s*([0-9]{2,3})\b", text_lower)
        if bp_match:
            sys_val, dia_val = bp_match.group(1), bp_match.group(2)
            new_facts.append({
                "category": "vital",
                "fact_key": "Blood Pressure",
                "fact_value": {"systolic": int(sys_val), "diastolic": int(dia_val), "unit": "mmHg"},
                "status": "doctor_confirmed",
                "exact_quote": bp_match.group(0),
            })

        hr_match = re.search(r"\b(?:pulse|heart rate|hr)\s*(?:is|was)?\s*([0-9]{2,3})\b", text_lower)
        if hr_match:
            new_facts.append({
                "category": "vital",
                "fact_key": "Heart Rate",
                "fact_value": {"bpm": int(hr_match.group(1))},
                "status": "doctor_confirmed",
                "exact_quote": hr_match.group(0),
            })

        temp_match = re.search(r"\b(?:temperature|temp)\s*(?:is|was)?\s*([0-9]{2,3}(?:\.[0-9]+)?)\s*(?:f|c|degrees)?\b", text_lower)
        if temp_match:
            new_facts.append({
                "category": "vital",
                "fact_key": "Temperature",
                "fact_value": {"temperature": float(temp_match.group(1)), "unit": "°F"},
                "status": "doctor_confirmed",
                "exact_quote": temp_match.group(0),
            })

        # Symptoms
        symptom_keywords = [
            ("cough", "Cough", "Dry/Productive cough"),
            ("khansi", "Cough", "Cough reported in Hindi"),
            ("fever", "Fever", "Elevated body temperature"),
            ("bukhar", "Fever", "Fever reported in Hindi"),
            ("headache", "Headache", "Cranial pain"),
            ("sir dard", "Headache", "Headache reported in Hindi"),
            ("sore throat", "Sore Throat", "Pharyngeal discomfort"),
            ("gale mein", "Sore Throat", "Throat irritation reported in Hindi"),
            ("chest pain", "Chest Pain", "Thoracic pain / chest congestion"),
            ("chhati mein jalan", "Acidity / Heartburn", "Retrosternal burning reported in Hindi"),
            ("breathlessness", "Dyspnea", "Shortness of breath"),
            ("sans lene mein", "Dyspnea", "Difficulty breathing reported in Hindi"),
        ]

        for kw, key_name, desc in symptom_keywords:
            if kw in text_lower:
                # Find matching quote
                quote_match = re.search(rf"([^.!?\n]*{re.escape(kw)}[^.!?\n]*)", full_transcript, re.IGNORECASE)
                exact = quote_match.group(1).strip() if quote_match else kw
                new_facts.append({
                    "category": "symptom",
                    "fact_key": key_name,
                    "fact_value": {"description": desc, "reported_term": kw},
                    "status": "unconfirmed",
                    "exact_quote": exact,
                })

        # Medications mentioned
        med_keywords = ["paracetamol", "montair", "azithromycin", "pantocid", "ascoril", "augmentin", "cetirizine", "metformin"]
        for med in med_keywords:
            if med in text_lower:
                quote_match = re.search(rf"([^.!?\n]*{re.escape(med)}[^.!?\n]*)", full_transcript, re.IGNORECASE)
                exact = quote_match.group(1).strip() if quote_match else med
                new_facts.append({
                    "category": "medication",
                    "fact_key": med.capitalize(),
                    "fact_value": {"medicine_name": med.capitalize()},
                    "status": "unconfirmed",
                    "exact_quote": exact,
                })

    # Merge facts with deduplication by fact_key
    seen_keys = {f.get("fact_key") for f in existing_facts}
    for nf in new_facts:
        if nf.get("fact_key") not in seen_keys:
            existing_facts.append(nf)
            seen_keys.add(nf.get("fact_key"))

    return {
        "clinical_facts": existing_facts,
        "extracted_facts": new_facts,
        "audit_messages": state.get("audit_messages", []) + [f"Extracted {len(new_facts)} facts."],
    }
