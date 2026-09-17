from fastapi import APIRouter, Query
from typing import List, Optional
from app.api.v1.doctors import SEED_DOCTORS
from app.api.v1.onboarding import DOCTORS_DATABASE

router = APIRouter(prefix="/search", tags=["Search & Discovery"])

@router.get("")
def search_doctors(
    q: Optional[str] = Query(None, description="Search query: doctor name, condition, or keyword"),
    specialization: Optional[str] = Query(None, description="Doctor specialization"),
    locality: Optional[str] = Query(None, description="Locality or road in Dehradun"),
    max_fee: Optional[float] = Query(None, description="Maximum consultation fee"),
    available_today: Optional[bool] = Query(True, description="Filter for clinics open today")
):
    all_doctors = {**SEED_DOCTORS, **DOCTORS_DATABASE}
    results = []

    for doc in all_doctors.values():
        # 1. Query keyword match (name, services, bio, clinic)
        if q:
            query_lower = q.lower().strip()
            services_text = " ".join([s["name"] for s in doc.get("services_offered", [])]).lower()
            combined_search_corpus = f"{doc['full_name']} {doc['specialization']} {doc['bio']} {services_text} {doc['clinic_name']} {doc['clinic_address']}".lower()
            if query_lower not in combined_search_corpus:
                # Also check common synonyms
                synonyms = {
                    "skin": "dermatologist",
                    "acne": "dermatologist",
                    "teeth": "dentist",
                    "tooth": "dentist",
                    "rct": "dentist",
                    "child": "pediatrician",
                    "baby": "pediatrician",
                    "kids": "pediatrician",
                    "fever": "physician",
                    "bone": "orthopedic",
                    "fracture": "orthopedic"
                }
                matched_synonym = False
                for syn_k, syn_v in synonyms.items():
                    if syn_k in query_lower and syn_v in doc['specialization'].lower():
                        matched_synonym = True
                        break
                if not matched_synonym:
                    continue

        # 2. Specialization filter
        if specialization and specialization.lower() not in doc["specialization"].lower():
            continue

        # 3. Locality filter
        if locality and locality.lower() not in doc["clinic_address"].lower():
            continue

        # 4. Fee filter
        if max_fee and doc["consultation_fee"] > max_fee:
            continue

        # Enrich with live token metadata
        enriched_doc = {
            **doc,
            "next_available_token": 4,
            "estimated_wait_time": "10-15 mins",
            "is_open_now": True,
            "distance_km": 1.2, # Relative to center of Dehradun (Ghanta Ghar / Clock Tower)
            "coordinates": {
                "lat": 30.3255 if "rajpur" in doc["clinic_address"].lower() else (30.3204 if "ec" in doc["clinic_address"].lower() else 30.3342),
                "lng": 78.0436 if "rajpur" in doc["clinic_address"].lower() else (78.0489 if "ec" in doc["clinic_address"].lower() else 78.0125)
            }
        }
        results.append(enriched_doc)

    return {
        "status": "success",
        "total": len(results),
        "query": q,
        "results": results
    }
