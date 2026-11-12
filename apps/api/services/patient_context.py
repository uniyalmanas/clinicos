import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger("patient_context")


class PatientContextService:
    @staticmethod
    def get_verified_patient_records(db: Session, patient_phone: str, clinic_id: str) -> Dict[str, Any]:
        """
        Retrieves verified longitudinal medical records for the patient:
        - Demographics
        - Documented allergies
        - Chronic conditions / past medical history
        - Past visits and diagnoses
        - Prior medication regimens
        """
        records: Dict[str, Any] = {
            "patient_name": "",
            "patient_phone": patient_phone,
            "patient_uhid": "",
            "allergies": [],
            "medical_history": [],
            "past_visits": [],
            "past_medications": [],
        }

        try:
            # 1. Fetch patient profile
            pat_row = db.execute(
                text(
                    "SELECT id, full_name, phone, uhid, gender, allergies, chronic_conditions "
                    "FROM patients WHERE phone = :phone LIMIT 1"
                ),
                {"phone": patient_phone},
            ).mappings().first()

            if pat_row:
                records["patient_name"] = pat_row.get("full_name") or ""
                records["patient_uhid"] = pat_row.get("uhid") or ""
                
                # Allergies array
                allergies = pat_row.get("allergies")
                if isinstance(allergies, list):
                    records["allergies"] = allergies
                elif isinstance(allergies, str) and allergies.strip():
                    records["allergies"] = [allergies.strip()]

                # Medical history array
                med_hist = pat_row.get("chronic_conditions")
                if isinstance(med_hist, list):
                    records["medical_history"] = med_hist
                elif isinstance(med_hist, str) and med_hist.strip():
                    records["medical_history"] = [med_hist.strip()]

            # 2. Fetch past prescriptions
            rx_rows = db.execute(
                text(
                    "SELECT id, doctor_name, provisional_diagnosis, items, vitals, created_at "
                    "FROM prescriptions WHERE patient_phone = :phone "
                    "ORDER BY created_at DESC LIMIT 5"
                ),
                {"phone": patient_phone},
            ).mappings().all()

            for rx in rx_rows:
                items = rx.get("items") or []
                med_names = []
                if isinstance(items, list):
                    for it in items:
                        if isinstance(it, dict) and it.get("name"):
                            med_names.append(it["name"])
                        elif isinstance(it, str):
                            med_names.append(it)

                records["past_visits"].append({
                    "date": rx.get("created_at").strftime("%d %b %Y") if rx.get("created_at") else "Recent",
                    "doctor_name": rx.get("doctor_name") or "Clinic Doctor",
                    "diagnosis": rx.get("provisional_diagnosis") or "General Consultation",
                    "medications": med_names,
                    "vitals": rx.get("vitals") or {},
                })

            # 3. Fetch past approved consultation reports
            report_rows = db.execute(
                text(
                    "SELECT id, doctor_name, provisional_diagnosis, created_at, status "
                    "FROM consultation_reports WHERE patient_phone = :phone AND status = 'approved' "
                    "ORDER BY created_at DESC LIMIT 5"
                ),
                {"phone": patient_phone},
            ).mappings().all()

            for rep in report_rows:
                records["past_visits"].append({
                    "date": rep.get("created_at").strftime("%d %b %Y") if rep.get("created_at") else "Past Visit",
                    "doctor_name": rep.get("doctor_name") or "Consultant",
                    "diagnosis": rep.get("provisional_diagnosis") or "Clinical Consultation",
                    "medications": [],
                    "vitals": {},
                })

        except Exception as e:
            db.rollback()
            logger.warning(f"Error querying patient context from DB: {e}")

        # Return empty lists when no data is on record.
        # The UI must prompt the doctor to confirm allergy and history with the patient.
        # DO NOT fabricate clinical data — fabricated allergies can suppress real allergy
        # warnings and fabricated diagnoses can bias AI clinical note generation.

        return records


patient_context_service = PatientContextService()
