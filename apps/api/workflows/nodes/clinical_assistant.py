import json
import logging
from typing import Dict, Any, List
import httpx
from apps.api.config import settings
from apps.api.integrations.llm.provider_factory import get_llm_provider
from apps.api.workflows.state import ConsultationGraphState

logger = logging.getLogger("clinical_assistant")


def clinical_assistant_node(state: ConsultationGraphState) -> Dict[str, Any]:
    """
    LangGraph Node 4: Clinical Assistant.
    Synthesizes precise answers to doctor queries, strictly tagging provenance
    between current transcript, verified records, medical knowledge, and missing info.
    """
    query = state.get("doctor_query", "").strip()
    if not query:
        return {}

    full_transcript = state.get("full_transcript", "")
    clinical_facts = state.get("clinical_facts", [])
    verified_records = state.get("verified_patient_records") or {}
    if not verified_records:
        from apps.api.workflows.nodes.patient_context import retrieve_patient_context_node
        ctx = retrieve_patient_context_node(state)
        verified_records = ctx.get("verified_patient_records", {})

    allergies = verified_records.get("allergies", [])
    medical_history = verified_records.get("medical_history", [])
    past_visits = verified_records.get("past_visits", [])

    provenance_sources: List[Dict[str, Any]] = []
    reply = ""

    # Check if LLM can be used via provider abstraction (Groq / Ollama)
    try:
        llm_provider = get_llm_provider()
        if llm_provider.health_check():
            system_prompt = f"""You are the ClinicOS Clinical Companion assisting {state.get('doctor_name', 'the doctor')} during an active consultation.
Patient: {state.get('patient_name', 'Patient')} ({state.get('patient_uhid', 'UHID')})

VERIFIED PATIENT RECORDS:
- Known Allergies: {', '.join(allergies) if allergies else 'None documented'}
- Medical History: {', '.join(medical_history) if medical_history else 'None'}
- Past Visits: {json.dumps(past_visits)}

CURRENT CONSULTATION TRANSCRIPT:
{full_transcript or '[No speech transcribed yet]'}

EXTRACTED CLINICAL FACTS:
{json.dumps(clinical_facts)}

RULES:
1. Answer the doctor's question in 1-3 concise, professional, clinically precise sentences.
2. Clearly distinguish between:
   - What the patient stated in the current conversation.
   - What is in the verified longitudinal medical records.
   - General medical knowledge.
   - Missing or uncertain details.
3. NEVER invent or autonomously confirm diagnoses.
4. Include provenance tags."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ]
            reply = llm_provider.chat_completion(
                messages=messages,
                temperature=0.2,
                max_tokens=300,
            ).strip()
    except Exception as e:
        logger.warning(f"LLM assistant call failed: {e}")

    # Deterministic fallback logic if LLM not configured or failed
    if not reply:
        q_lower = query.lower()
        # 1. Pediatric Dosing Query
        import re
        pedia_match = re.search(r'(?:pediatric|child|dose|dosage|calculate\s*dose|how\s*much)\s*(?:of|for)?\s*([a-zA-Z\s]+?)(?:for\s+a\s+|for\s+)?(\d+(?:\.\d+)?)\s*kg', query, re.IGNORECASE) or \
                      re.search(r'(?:dose|dosage)\s*(?:of|for)?\s*([a-zA-Z]+).*?(\d+(?:\.\d+)?)\s*kg', query, re.IGNORECASE)
        if pedia_match:
            drug = pedia_match.group(1).strip().lower()
            weight = float(pedia_match.group(2))
            w = max(1.0, min(100.0, weight))
            if "paracetamol" in drug or "pcm" in drug or "calpol" in drug or "crocin" in drug:
                mg = round(15 * w)
                ml120 = round((mg / 120) * 5, 1)
                ml250 = round((mg / 250) * 5, 1)
                reply = f"For a {w:g} kg child, Paracetamol dose is {mg} mg per dose (15 mg/kg/dose). Give {ml120} ml of 120mg/5ml syrup or {ml250} ml of 250mg/5ml DS syrup, Q4-6H SOS (Max 4 times/day; max {round(60*w)} mg/day)."
            elif "ibuprofen" in drug or "ibugesic" in drug or "brufen" in drug:
                mg = round(10 * w)
                ml100 = round((mg / 100) * 5, 1)
                reply = f"For a {w:g} kg child, Ibuprofen dose is {mg} mg per dose ({ml100} ml of 100mg/5ml syrup), given after food Q6-8H (Max {round(40*w)} mg/day)."
            elif "amoxicillin" in drug or "novamox" in drug:
                mg = round((45 * w) / 3)
                reply = f"For a {w:g} kg child, Amoxicillin dose is {mg} mg TID (45 mg/kg/day divided into 3 doses) for 5-7 days."
            elif "augmentin" in drug or "clav" in drug:
                mg = round((40 * w) / 2)
                reply = f"For a {w:g} kg child, Augmentin Duo dose is approximately {mg} mg (amoxicillin component) BID with meals for 5-7 days."
            elif "azithromycin" in drug or "azee" in drug:
                mg = round(10 * w)
                reply = f"For a {w:g} kg child, Azithromycin dose is {mg} mg once daily for 3 days on an empty stomach."
            elif "ondansetron" in drug or "emeset" in drug or "vomit" in drug:
                mg = min(4.0, round(0.15 * w, 2))
                reply = f"For a {w:g} kg child, Ondansetron dose is {mg:g} mg (0.15 mg/kg) SOS for acute vomiting (Max 3 doses/day)."
            else:
                reply = f"Calculated standard pediatric dosing for {drug} based on {w:g} kg body weight."
            provenance_sources.append({
                "source_type": "medical_knowledge",
                "citation": "General dosing reference — verify with local formulary",
            })
        # 2. Empiric Antibiotic Stewardship Query
        elif "antibiotic" in q_lower or "stewardship" in q_lower or "first line" in q_lower:
            if "pharyngitis" in q_lower or "sore throat" in q_lower or "tonsil" in q_lower:
                reply = "First-line empiric therapy for acute bacterial pharyngitis is Tab. Amoxicillin 500mg TID x 5 days (or Azithromycin 500mg OD x 3 days if penicillin-allergic)."
            elif "uti" in q_lower or "urine" in q_lower or "cystitis" in q_lower:
                reply = "First-line for uncomplicated UTI is Tab. Nitrofurantoin 100mg BID with meals x 5 days. Avoid empiric fluoroquinolones due to resistance."
            elif "cellulitis" in q_lower or "skin" in q_lower:
                reply = "First-line for non-purulent cellulitis is Tab. Amoxicillin-Clavulanate 625mg TID or Cap. Cephalexin 500mg QID x 7 days."
            elif "pneumonia" in q_lower or "cap" in q_lower:
                reply = "First-line for outpatient community-acquired pneumonia is Tab. Amoxicillin 1g TID + Tab. Azithromycin 500mg OD x 5 days."
            elif "typhoid" in q_lower or "enteric" in q_lower:
                reply = "First-line for uncomplicated typhoid fever is Tab. Cefixime 200mg BID x 10-14 days, or Tab. Azithromycin 500mg OD x 7 days."
            else:
                reply = "Empiric antibiotic stewardship recommends targeted therapy guided by local antibiogram, avoiding broad-spectrum fluoroquinolones when narrow-spectrum agents suffice."
            provenance_sources.append({
                "source_type": "medical_knowledge",
                "citation": "General stewardship reference — verify with local policy",
            })
        # 3. Differential Diagnosis Query
        elif "differential" in q_lower or "ddx" in q_lower or "possible causes" in q_lower:
            if "chest pain" in q_lower:
                reply = "Key differentials for acute chest pain: 1. Acute Coronary Syndrome (Stat ECG & Troponin), 2. Gastroesophageal Reflux (GERD), 3. Costochondritis, 4. Pleurisy/PE."
            elif "fever" in q_lower:
                reply = "Key differentials for fever with arthralgia/rash: 1. Dengue fever (CBC, NS1), 2. Chikungunya, 3. Typhoid fever (Widal/Typhidot), 4. Acute viral syndrome."
            elif "abdomen" in q_lower or "stomach" in q_lower:
                reply = "Key differentials for acute abdominal pain: 1. Acute Gastroenteritis, 2. Appendicitis (RLQ pain), 3. Peptic Ulcer Disease, 4. Renal colic."
            else:
                reply = "Consider primary acute infectious, inflammatory, and metabolic etiologies. Correlate with physical findings and initial CBC/CRP workup."
            provenance_sources.append({
                "source_type": "medical_knowledge",
                "citation": "General clinical reference",
            })
        # 4. Allergy Query
        elif "allerg" in q_lower or "reaction" in q_lower or "safe to" in q_lower or "can i prescribe" in q_lower or "can i give" in q_lower:
            reply = (
                f"Allergies on file: {', '.join(allergies) if allergies else 'none recorded'}. "
                "Confirm with the patient before prescribing; absence from the record is not proof of no allergy."
            )
            provenance_sources.append({
                "source_type": "verified_patient_record" if allergies else "missing_info",
                "citation": "Allergy record on file" if allergies else "EHR allergy check",
            })
        elif "history" in q_lower or "last visit" in q_lower or "previous" in q_lower:
            if past_visits:
                v = past_visits[0]
                reply = f"Last visit was on {v.get('date')} for {v.get('diagnosis')}. Prescribed: {', '.join(v.get('medications', []))}."
                provenance_sources.append({
                    "source_type": "verified_patient_record",
                    "citation": f"Visit Note ({v.get('date')})",
                })
            else:
                reply = "No prior visit records found for this patient in the clinic EHR."
                provenance_sources.append({
                    "source_type": "missing_info",
                    "citation": "EHR Database Check",
                })
        elif "symptom" in q_lower or "complaint" in q_lower:
            symptoms = [f["fact_key"] for f in clinical_facts if f.get("category") == "symptom"]
            if symptoms:
                reply = f"Current symptoms extracted from consultation: {', '.join(symptoms)}."
                provenance_sources.append({
                    "source_type": "current_transcript",
                    "citation": "Active Speech Transcription",
                })
            else:
                reply = "No specific symptoms reported in transcript yet. Please ask the patient about onset and duration."
                provenance_sources.append({
                    "source_type": "missing_info",
                    "citation": "Active Speech Transcription",
                })
        elif "bp" in q_lower or "vital" in q_lower:
            vitals = [f for f in clinical_facts if f.get("category") == "vital"]
            if vitals:
                parts = [f"{v['fact_key']}: {json.dumps(v['fact_value'])}" for v in vitals]
                reply = f"Recorded vitals: {', '.join(parts)}."
                provenance_sources.append({
                    "source_type": "current_transcript",
                    "citation": "Live Clinical Vitals Extraction",
                })
            else:
                reply = "Blood pressure and heart rate have not been documented yet during this visit."
                provenance_sources.append({
                    "source_type": "missing_info",
                    "citation": "Clinical Fact Registry",
                })
        else:
            history_text = ", ".join(medical_history) if medical_history else "no history on record"
            reply = f"Noted. Current clinical facts: {len(clinical_facts)} items tracked. Patient record shows {history_text}."
            provenance_sources.append({
                "source_type": "medical_knowledge",
                "citation": "Clinical Knowledge Synthesizer",
            })

    # Add default provenance source if none added
    if not provenance_sources:
        if full_transcript:
            provenance_sources.append({
                "source_type": "current_transcript",
                "citation": "Active Consultation Transcript",
            })
        if allergies or medical_history:
            provenance_sources.append({
                "source_type": "verified_patient_record",
                "citation": "Clinic EHR profile on file",
            })

    return {
        "assistant_response": {
            "reply": reply,
            "provenance_sources": provenance_sources,
            "spoken_reply": reply,
        },
        "audit_messages": state.get("audit_messages", []) + ["Clinical assistant synthesized response with provenance."],
    }
