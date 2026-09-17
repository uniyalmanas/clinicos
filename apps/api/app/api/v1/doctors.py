from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.api.v1.onboarding import DOCTORS_DATABASE

router = APIRouter(prefix="/doctors", tags=["Doctors"])

SEED_DOCTORS = {
    "dr-rahul-sharma": {
        "id": "d1111111-1111-1111-1111-111111111111",
        "slug": "dr-rahul-sharma",
        "title": "Dr.",
        "full_name": "Dr. Rahul Sharma",
        "medical_council_reg_number": "UKMC-8942-2012",
        "medical_council_state": "Uttarakhand Medical Council",
        "qualification_summary": "MBBS, MD (Dermatology, Venereology & Leprosy)",
        "specialization": "Dermatologist",
        "sub_specializations": ["Acne Specialist", "Cosmetic Laser Surgery", "Hair Loss Therapy"],
        "years_of_experience": 12,
        "languages_spoken": ["English", "Hindi"],
        "bio": "Dr. Rahul Sharma is a senior consultant dermatologist with over 12 years of clinical expertise in treating chronic acne, psoriasis, and laser aesthetic procedures. Committed to evidence-based skincare.",
        "consultation_fee": 600.00,
        "followup_fee": 300.00,
        "followup_validity_days": 7,
        "services_offered": [
            {"name": "Skin Consultation", "fee": 600},
            {"name": "Chemical Peel & Acne Treatment", "fee": 1500},
            {"name": "Laser Scar Reduction", "fee": 2500},
            {"name": "PRP Hair Loss Therapy", "fee": 3500}
        ],
        "verification_status": "verified",
        "rating": 4.9,
        "total_reviews": 142,
        "clinic_name": "Derma Care Skin & Laser Centre",
        "clinic_slug": "derma-care-dehradun",
        "clinic_address": "14, Rajpur Road, Near Ashley Hall, Dehradun",
        "opd_timings": "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM"
    },
    "dr-aditi-joshi": {
        "id": "d2222222-2222-2222-2222-222222222222",
        "slug": "dr-aditi-joshi",
        "title": "Dr.",
        "full_name": "Dr. Aditi Joshi",
        "medical_council_reg_number": "UDC-4120-2016",
        "medical_council_state": "Uttarakhand Dental Council",
        "qualification_summary": "BDS, MDS (Conservative Dentistry & Endodontics)",
        "specialization": "Dentist",
        "sub_specializations": ["Painless Root Canal", "Cosmetic Veneers", "Dental Implants"],
        "years_of_experience": 8,
        "languages_spoken": ["English", "Hindi", "Garhwali"],
        "bio": "Dr. Aditi Joshi is a leading endodontist known for painless single-sitting root canals and digital smile design in Dehradun.",
        "consultation_fee": 400.00,
        "followup_fee": 0.00,
        "followup_validity_days": 7,
        "services_offered": [
            {"name": "Dental Checkup & Digital X-Ray", "fee": 400},
            {"name": "Single Sitting Painless RCT", "fee": 3000},
            {"name": "Teeth Whitening", "fee": 3500},
            {"name": "Dental Implants Consultation", "fee": 800}
        ],
        "verification_status": "verified",
        "rating": 4.8,
        "total_reviews": 98,
        "clinic_name": "Smile Craft Multi-Speciality Dental",
        "clinic_slug": "smile-craft-dental",
        "clinic_address": "42, EC Road, Near Survey Chowk, Dehradun",
        "opd_timings": "Mon - Sat: 10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM"
    },
    "dr-vikram-sethi": {
        "id": "d3333333-3333-3333-3333-333333333333",
        "slug": "dr-vikram-sethi",
        "title": "Dr.",
        "full_name": "Dr. Vikram Sethi",
        "medical_council_reg_number": "UKMC-6214-2009",
        "medical_council_state": "Uttarakhand Medical Council",
        "qualification_summary": "MBBS, DCH, DNB (Pediatrics)",
        "specialization": "Pediatrician",
        "sub_specializations": ["Newborn Intensive Care", "Childhood Asthma", "Vaccination"],
        "years_of_experience": 15,
        "languages_spoken": ["English", "Hindi"],
        "bio": "Senior child specialist providing gentle, compassionate pediatric healthcare, newborn care, and complete childhood immunization schedules.",
        "consultation_fee": 500.00,
        "followup_fee": 200.00,
        "followup_validity_days": 5,
        "services_offered": [
            {"name": "Child OPD Consultation", "fee": 500},
            {"name": "Vaccination Administration", "fee": 200},
            {"name": "Growth & Milestones Assessment", "fee": 600}
        ],
        "verification_status": "verified",
        "rating": 4.95,
        "total_reviews": 210,
        "clinic_name": "Dron Child & Newborn Health Centre",
        "clinic_slug": "dron-child-clinic",
        "clinic_address": "88, Chakrata Road, Near Ballupur Chowk, Dehradun",
        "opd_timings": "Mon - Sat: 09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM"
    }
}

@router.get("", response_model=List[dict])
def list_doctors(specialization: Optional[str] = None, city: Optional[str] = None):
    results = []
    # Combine seed and dynamic doctors
    all_docs = {**SEED_DOCTORS, **DOCTORS_DATABASE}
    for doc in all_docs.values():
        if specialization and specialization.lower() not in doc["specialization"].lower():
            continue
        results.append(doc)
    return results

@router.get("/{slug}")
def get_doctor_profile(slug: str):
    all_docs = {**SEED_DOCTORS, **DOCTORS_DATABASE}
    doc = all_docs.get(slug)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found.")
    return doc
