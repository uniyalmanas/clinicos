import uuid
import pytest
from apps.api.models.consultation import ConsultationSession, ClinicalFact
from apps.api.integrations.llm.groq_provider import GroqLLMProvider
from apps.api.integrations.llm.ollama_provider import OllamaLLMProvider
from apps.api.integrations.llm.local_embedding_provider import LocalDeterministicEmbeddingProvider
from apps.api.integrations.llm.provider_factory import get_llm_provider, get_embedding_provider
from apps.api.services.hybrid_retrieval import HybridRetrievalService, cosine_similarity


def test_groq_llm_provider_configuration():
    provider = GroqLLMProvider(api_key="mock-key-123", model="llama-3.3-70b-versatile")
    assert provider.health_check() is True
    assert provider.model == "llama-3.3-70b-versatile"

    no_key_provider = GroqLLMProvider(api_key="")
    assert no_key_provider.health_check() is False


def test_ollama_llm_provider_configuration():
    provider = OllamaLLMProvider(base_url="http://localhost:11434", model="llama3.2:3b")
    assert provider.model == "llama3.2:3b"
    assert provider.base_url == "http://localhost:11434"


def test_provider_factory_selection():
    ollama = get_llm_provider(preference="ollama")
    assert isinstance(ollama, (OllamaLLMProvider, GroqLLMProvider))

    embedding_prov = get_embedding_provider(preference="local")
    assert isinstance(embedding_prov, LocalDeterministicEmbeddingProvider)


def test_semantic_embedding_cosine_similarity():
    provider = LocalDeterministicEmbeddingProvider(dimensions=1536)

    vec_cough_1 = provider.embed_text("symptom dry cough and sore throat")
    vec_cough_2 = provider.embed_text("patient complains of severe cough and throat pain")
    vec_fracture = provider.embed_text("orthopedic fracture of right femur on x-ray")

    sim_cough = cosine_similarity(vec_cough_1, vec_cough_2)
    sim_unrelated = cosine_similarity(vec_cough_1, vec_fracture)

    assert sim_cough > sim_unrelated
    assert sim_cough > 0.35
    assert sim_unrelated < 0.1


def test_hybrid_retrieval_and_rrf_scoring(client, db_session):
    clinic_id = "clinic-test-001"
    session_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())

    sess = ConsultationSession(
        id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        patient_phone="+919988776655",
        patient_uhid="UHID-HYBRID-01",
        doctor_slug="dr-kapoor",
        doctor_name="Dr. Kapoor",
        patient_name="Pooja Patel",
    )
    db_session.add(sess)

    # Fact 1: Penicillin Allergy
    f1 = ClinicalFact(
        id=str(uuid.uuid4()),
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="allergy",
        fact_key="Penicillin",
        fact_value={"allergen": "Penicillin", "reaction": "Anaphylactic rash and urticaria"},
        verification_status="DOCTOR_VERIFIED",
    )
    # Fact 2: Hypertension
    f2 = ClinicalFact(
        id=str(uuid.uuid4()),
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="medical_history",
        fact_key="Essential Hypertension",
        fact_value={"condition": "Hypertension stage 2", "since": "3 years"},
        verification_status="DOCTOR_VERIFIED",
    )
    # Fact 3: Diabetes
    f3 = ClinicalFact(
        id=str(uuid.uuid4()),
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="medical_history",
        fact_key="Type 2 Diabetes Mellitus",
        fact_value={"condition": "Diabetes", "hba1c": 7.4},
        verification_status="DOCTOR_VERIFIED",
    )
    db_session.add_all([f1, f2, f3])
    db_session.commit()

    # Search for allergy
    results = HybridRetrievalService.search_patient_facts(
        db=db_session,
        clinic_id=clinic_id,
        patient_identifier=patient_id,
        query="penicillin allergy and rash",
        top_k=3,
    )

    assert len(results) > 0
    top_result = results[0]
    assert top_result["fact_id"] == str(f1.id)
    assert top_result["category"] == "allergy"
    assert top_result["rrf_score"] > 0
    assert top_result["keyword_rank"] == 1
    assert "semantic_similarity" in top_result


def test_hybrid_search_api_endpoint(client, db_session):
    clinic_id = "clinic-test-001"
    session_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())
    uhid = f"UHID-{uuid.uuid4().hex[:6]}"

    sess = ConsultationSession(
        id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        patient_phone="+919988776656",
        patient_uhid=uhid,
        doctor_slug="dr-kapoor",
        doctor_name="Dr. Kapoor",
        patient_name="Sunil Joshi",
    )
    db_session.add(sess)

    fact = ClinicalFact(
        id=str(uuid.uuid4()),
        consultation_id=session_id,
        clinic_id=clinic_id,
        patient_id=patient_id,
        category="symptom",
        fact_key="Migraine",
        fact_value={"symptom": "Unilateral throbbing headache with photophobia"},
        verification_status="DOCTOR_VERIFIED",
    )
    db_session.add(fact)
    db_session.commit()

    res = client.get(f"/api/patients/{uhid}/search?q=headache+photophobia&top_k=3")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert data[0]["fact_id"] == str(fact.id)
    assert data[0]["category"] == "symptom"
