from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.api.v1.onboarding import CLINICS_DATABASE

router = APIRouter(prefix="/clinics", tags=["Clinics"])

SEED_CLINICS = {
    "derma-care-dehradun": {
        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "slug": "derma-care-dehradun",
        "name": "Derma Care Skin & Laser Centre",
        "tagline": "Advanced Dermatology & Cosmetic Laser Solutions",
        "about": "State of the art skin clinic specializing in acne, laser hair removal, eczema, and chemical peels with FDA-approved laser technology.",
        "phone": "+919876543210",
        "whatsapp_number": "+919876543210",
        "gstin": "05AAAAA0000A1Z5",
        "address_line": "14, Rajpur Road, Near Ashley Hall",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "postal_code": "248001",
        "latitude": 30.3255,
        "longitude": 78.0436,
        "facilities": ["Full AC", "Laser Suite", "High-speed WiFi", "Wheelchair Accessible", "UPI Soundbox"],
        "opening_hours": {
            "Monday - Friday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
            "Saturday": "10:00 AM - 04:00 PM",
            "Sunday": "Closed"
        },
        "status": "active",
        "doctors": [
            {
                "full_name": "Dr. Rahul Sharma",
                "slug": "dr-rahul-sharma",
                "specialization": "Dermatologist",
                "qualification_summary": "MBBS, MD (Dermatology)",
                "consultation_fee": 600.00
            }
        ]
    },
    "smile-craft-dental": {
        "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        "slug": "smile-craft-dental",
        "name": "Smile Craft Multi-Speciality Dental",
        "tagline": "Gentle, Precision Dental Care & Implants",
        "about": "Modern digital dental practice offering painless root canals, invisible aligners, dental implants and pediatric dentistry.",
        "phone": "+919876543211",
        "whatsapp_number": "+919876543211",
        "gstin": "05BBBBB0000B1Z6",
        "address_line": "42, EC Road, Near Survey Chowk",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "postal_code": "248001",
        "latitude": 30.3204,
        "longitude": 78.0489,
        "facilities": ["Full AC", "Digital RVG X-Ray", "Autoclave Sterilization", "WiFi"],
        "opening_hours": {
            "Monday - Saturday": "10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM",
            "Sunday": "Emergency Only"
        },
        "status": "active",
        "doctors": [
            {
                "full_name": "Dr. Aditi Joshi",
                "slug": "dr-aditi-joshi",
                "specialization": "Dentist",
                "qualification_summary": "BDS, MDS (Endodontics)",
                "consultation_fee": 400.00
            }
        ]
    },
    "dron-child-clinic": {
        "id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        "slug": "dron-child-clinic",
        "name": "Dron Child & Newborn Health Centre",
        "tagline": "Complete Pediatric Care & Vaccination Hub",
        "about": "Dedicated child health clinic offering newborn monitoring, immunizations, and pediatric emergency care.",
        "phone": "+919876543212",
        "whatsapp_number": "+919876543212",
        "gstin": "05CCCCC0000C1Z7",
        "address_line": "88, Chakrata Road, Near Ballupur Chowk",
        "city": "Dehradun",
        "state": "Uttarakhand",
        "postal_code": "248001",
        "latitude": 30.3342,
        "longitude": 78.0125,
        "facilities": ["Vaccine Cold Chain", "Nebulization Station", "Child Play Area", "Full AC"],
        "opening_hours": {
            "Monday - Saturday": "09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM",
            "Sunday": "10:00 AM - 01:00 PM"
        },
        "status": "active",
        "doctors": [
            {
                "full_name": "Dr. Vikram Sethi",
                "slug": "dr-vikram-sethi",
                "specialization": "Pediatrician",
                "qualification_summary": "MBBS, DCH, DNB",
                "consultation_fee": 500.00
            }
        ]
    }
}

def get_all_clinics_map() -> dict:
    clinics = dict(SEED_CLINICS)
    clinics.update(CLINICS_DATABASE)
    
    from app.api.v1.doctors import SEED_DOCTORS
    for doc in SEED_DOCTORS.values():
        c_slug = doc.get("clinic_slug")
        if c_slug and c_slug not in clinics:
            clinics[c_slug] = {
                "id": f"c-{c_slug}",
                "slug": c_slug,
                "name": doc.get("clinic_name", "Medical Centre"),
                "tagline": f"Specialized {doc.get('specialization', 'Medical')} Care Clinic",
                "about": f"Verified clinical centre providing evidence-based {doc.get('specialization', 'healthcare')} services in Dehradun.",
                "phone": doc.get("phone", "+919876543210"),
                "whatsapp_number": doc.get("phone", "+919876543210"),
                "address_line": doc.get("clinic_address", "Dehradun"),
                "city": "Dehradun",
                "state": "Uttarakhand",
                "postal_code": "248001",
                "facilities": ["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"],
                "opening_hours": {
                    "Monday - Saturday": doc.get("opd_timings", "10:00 AM - 08:00 PM"),
                    "Sunday": "Closed"
                },
                "status": "active",
                "doctors": [
                    {
                        "full_name": doc.get("full_name"),
                        "slug": doc.get("slug"),
                        "specialization": doc.get("specialization"),
                        "qualification_summary": doc.get("qualification_summary"),
                        "consultation_fee": doc.get("consultation_fee")
                    }
                ]
            }
    return clinics

@router.get("", response_model=List[dict])
def list_clinics():
    all_clinics = get_all_clinics_map()
    return list(all_clinics.values())

@router.get("/{slug}")
def get_clinic_profile(slug: str):
    all_clinics = get_all_clinics_map()
    clinic = all_clinics.get(slug)
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic profile not found.")
    return clinic
