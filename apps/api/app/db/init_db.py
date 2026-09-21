from app.db.session import engine, SessionLocal, Base
from app.db.models import (
    Doctor, Clinic, Appointment, Prescription, PatientDocument, Review, Expense, 
    ClinicWard, ClinicBed, PharmacyItem, PharmacyDispense
)
from datetime import date, datetime, timedelta
import uuid

def init_database(custom_engine=None, custom_session_factory=None):
    active_engine = custom_engine if custom_engine is not None else engine
    Base.metadata.create_all(bind=active_engine)
    db = custom_session_factory() if custom_session_factory is not None else SessionLocal()

    try:
        # Check if doctors are already seeded
        if db.query(Doctor).count() == 0:
            doc1 = Doctor(
                id=str(uuid.uuid4()),
                slug="dr-rahul-sharma",
                title="Dr.",
                full_name="Dr. Rahul Sharma",
                medical_council_reg_number="UKMC-8942-2012",
                medical_council_state="Uttarakhand Medical Council",
                qualification_summary="MBBS, MD (Dermatology, Venereology & Leprosy)",
                specialization="Dermatologist",
                sub_specializations=["Acne Specialist", "Cosmetic Laser Surgery", "Hair Loss Therapy"],
                years_of_experience=12,
                languages_spoken=["English", "Hindi"],
                bio="Dr. Rahul Sharma is a senior consultant dermatologist with over 12 years of clinical expertise in treating chronic acne, psoriasis, and laser aesthetic procedures. Committed to personalized, evidence-based skincare.",
                consultation_fee=600.0,
                followup_fee=300.0,
                followup_validity_days=7,
                services_offered=[
                    {"name": "Skin & Scalp Consultation", "fee": 600},
                    {"name": "Chemical Peel & Acne Treatment", "fee": 1500},
                    {"name": "Laser Scar Reduction", "fee": 2500},
                    {"name": "PRP Hair Loss Therapy", "fee": 3500}
                ],
                verification_status="verified",
                rating=4.9,
                total_reviews=142,
                clinic_id="clinic-derma-care-01",
                clinic_name="Derma Care Skin & Laser Centre",
                clinic_slug="derma-care-dehradun",
                clinic_address="14, Rajpur Road, Near Ashley Hall, Dehradun",
                opd_timings="Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
                phone="+919876543210"
            )

            doc2 = Doctor(
                id=str(uuid.uuid4()),
                slug="dr-aditi-joshi",
                title="Dr.",
                full_name="Dr. Aditi Joshi",
                medical_council_reg_number="UDC-4120-2016",
                medical_council_state="Uttarakhand Dental Council",
                qualification_summary="BDS, MDS (Endodontics)",
                specialization="Dentist",
                sub_specializations=["Painless Root Canal", "Cosmetic Veneers", "Dental Implants"],
                years_of_experience=8,
                languages_spoken=["English", "Hindi", "Garhwali"],
                bio="Dr. Aditi Joshi is a leading endodontist known for painless single-sitting root canals and digital smile design in Dehradun.",
                consultation_fee=400.0,
                followup_fee=0.0,
                followup_validity_days=7,
                services_offered=[
                    {"name": "Dental Checkup & Digital X-Ray", "fee": 400},
                    {"name": "Single Sitting Painless RCT", "fee": 3000},
                    {"name": "Teeth Whitening", "fee": 3500},
                    {"name": "Dental Implants Consultation", "fee": 800}
                ],
                verification_status="verified",
                rating=4.8,
                total_reviews=98,
                clinic_id="clinic-smile-craft-02",
                clinic_name="Smile Craft Multi-Speciality Dental",
                clinic_slug="smile-craft-dental",
                clinic_address="42, EC Road, Near Survey Chowk, Dehradun",
                opd_timings="Mon - Sat: 10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM",
                phone="+919876543211"
            )

            doc3 = Doctor(
                id=str(uuid.uuid4()),
                slug="dr-vikram-sethi",
                title="Dr.",
                full_name="Dr. Vikram Sethi",
                medical_council_reg_number="UKMC-6214-2009",
                medical_council_state="Uttarakhand Medical Council",
                qualification_summary="MBBS, DCH, DNB (Pediatrics)",
                specialization="Pediatrician",
                sub_specializations=["Newborn Intensive Care", "Childhood Asthma", "Vaccination"],
                years_of_experience=15,
                languages_spoken=["English", "Hindi"],
                bio="Senior child specialist providing gentle, compassionate pediatric healthcare, newborn care, and complete childhood immunization schedules.",
                consultation_fee=500.0,
                followup_fee=200.0,
                followup_validity_days=5,
                services_offered=[
                    {"name": "Child OPD Consultation", "fee": 500},
                    {"name": "Vaccination Administration", "fee": 200},
                    {"name": "Growth & Milestones Assessment", "fee": 600}
                ],
                verification_status="verified",
                rating=4.95,
                total_reviews=210,
                clinic_id="clinic-dron-child-03",
                clinic_name="Dron Child & Newborn Health Centre",
                clinic_slug="dron-child-clinic",
                clinic_address="88, Chakrata Road, Near Ballupur Chowk, Dehradun",
                opd_timings="Mon - Sat: 09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM",
                phone="+919876543212"
            )

            db.add_all([doc1, doc2, doc3])

        # Seed Clinics
        if db.query(Clinic).count() == 0:
            cln1 = Clinic(
                id="clinic-derma-care-01",
                slug="derma-care-dehradun",
                name="Derma Care Skin & Laser Centre",
                phone="+919876543210",
                address_line="14, Rajpur Road, Near Ashley Hall",
                city="Dehradun",
                state="Uttarakhand",
                postal_code="248001",
                facilities=["Air Conditioned", "Laser Suite", "Digital Pharmacy", "Wheelchair Friendly", "Parking"],
                opening_hours={"weekdays": "10:00 AM - 08:30 PM", "sunday": "Closed"}
            )
            cln2 = Clinic(
                id="clinic-smile-craft-02",
                slug="smile-craft-dental",
                name="Smile Craft Multi-Speciality Dental",
                phone="+919876543211",
                address_line="42, EC Road, Near Survey Chowk",
                city="Dehradun",
                state="Uttarakhand",
                postal_code="248001",
                facilities=["Digital RVG X-Ray", "Sterilization Autoclave", "Patient Lounge", "WiFi"],
                opening_hours={"weekdays": "10:00 AM - 08:00 PM", "sunday": "10:00 AM - 01:00 PM"}
            )
            db.add_all([cln1, cln2])

        # Seed Appointments for today
        today_str = str(date.today())
        if db.query(Appointment).count() == 0:
            apt1 = Appointment(
                id=str(uuid.uuid4()),
                appointment_number="APT-DERMA-101",
                doctor_slug="dr-rahul-sharma",
                doctor_name="Dr. Rahul Sharma",
                clinic_name="Derma Care Skin & Laser Centre",
                patient_name="Amit Rawat",
                patient_phone="+919123456780",
                appointment_date=today_str,
                time_slot="10:15 AM - 10:30 AM",
                token_number=1,
                status="completed",
                fee_amount=600.0,
                payment_status="paid",
                payment_mode="upi",
                symptoms_description="Severe acne flareup on face and neck"
            )
            apt2 = Appointment(
                id=str(uuid.uuid4()),
                appointment_number="APT-DERMA-102",
                doctor_slug="dr-rahul-sharma",
                doctor_name="Dr. Rahul Sharma",
                clinic_name="Derma Care Skin & Laser Centre",
                patient_name="Priya Singh",
                patient_phone="+919123456781",
                appointment_date=today_str,
                time_slot="10:30 AM - 10:45 AM",
                token_number=2,
                status="in_consultation",
                fee_amount=600.0,
                payment_status="paid",
                payment_mode="cash",
                symptoms_description="Facial rash and pigmentation"
            )
            apt3 = Appointment(
                id=str(uuid.uuid4()),
                appointment_number="APT-DERMA-103",
                doctor_slug="dr-rahul-sharma",
                doctor_name="Dr. Rahul Sharma",
                clinic_name="Derma Care Skin & Laser Centre",
                patient_name="Rohit Pant",
                patient_phone="+919123456782",
                appointment_date=today_str,
                time_slot="10:45 AM - 11:00 AM",
                token_number=3,
                status="in_waiting",
                fee_amount=600.0,
                payment_status="pending",
                payment_mode="upi",
                symptoms_description="Eczema patches on hands"
            )
            db.add_all([apt1, apt2, apt3])

        # Seed Prescriptions
        if db.query(Prescription).count() == 0:
            rx1 = Prescription(
                id=str(uuid.uuid4()),
                prescription_number="RX-2026-09-0014",
                appointment_number="APT-DERMA-101",
                doctor_name="Dr. Rahul Sharma",
                doctor_reg_number="UKMC-8942-2012",
                clinic_name="Derma Care Skin & Laser Centre",
                clinic_address="14, Rajpur Road, Dehradun",
                patient_name="Amit Rawat",
                patient_phone="+919123456780",
                patient_age=26,
                patient_gender="Male",
                vitals={"bp": "118/78", "pulse": 74, "temp": 98.4, "weight": 64},
                symptoms=["Cystic acne", "Facial erythema"],
                provisional_diagnosis="Moderate to Severe Acne Vulgaris (Grade III)",
                items=[
                    {
                        "medicine_name": "Tab Doxy-100",
                        "generic_name": "DOXYCYCLINE HYCLATE",
                        "dosage_form": "Capsule",
                        "strength": "100 mg",
                        "dosage_frequency": "1-0-0",
                        "timing_relation": "After Food",
                        "duration_days": 14,
                        "special_instructions": "Take with a full glass of water"
                    },
                    {
                        "medicine_name": "Epiduo Gel",
                        "generic_name": "ADAPALENE + BENZOYL PEROXIDE",
                        "dosage_form": "Ointment",
                        "strength": "0.1% / 2.5%",
                        "dosage_frequency": "0-0-1",
                        "timing_relation": "At Bedtime",
                        "duration_days": 30,
                        "special_instructions": "Apply pea-sized amount to affected areas only"
                    }
                ],
                instructions="Wash face twice daily with gentle foam cleanser. Do not pick acne lesions.",
                followup_date="2026-09-30",
                digital_signature_hash="a7f3b89091c5e4d28471b3e8c991a03f441582e79601d3cb4198fa0174e50212",
                qr_verification_code="VERIFY-DERMA-991204"
            )
            db.add(rx1)

        # Seed Patient Documents (Lab tests, Scans)
        if db.query(PatientDocument).count() == 0:
            doc_lab1 = PatientDocument(
                id=str(uuid.uuid4()),
                patient_phone="+919123456780",
                patient_name="Amit Rawat",
                document_type="Blood Test",
                title="Complete Blood Count (CBC) & Liver Panel",
                file_name="cbc_lft_amit_rawat_sep2026.pdf",
                file_size_kb=420,
                doctor_notes="Normal liver enzymes. Suitable for systemic antibiotics."
            )
            doc_lab2 = PatientDocument(
                id=str(uuid.uuid4()),
                patient_phone="+919123456780",
                patient_name="Amit Rawat",
                document_type="Radiology X-Ray",
                title="Chest PA View (Pre-Procedure Clearance)",
                file_name="chest_xray_pa_2026.pdf",
                file_size_kb=860,
                doctor_notes="Bilateral clear lung fields."
            )
            db.add_all([doc_lab1, doc_lab2])

        # Seed Reviews
        if db.query(Review).count() == 0:
            rev1 = Review(
                id=str(uuid.uuid4()),
                doctor_slug="dr-rahul-sharma",
                patient_name="Sanjay Negi",
                rating=5.0,
                waiting_time_rating=4.8,
                bedside_manner_rating=5.0,
                comment="Dr. Rahul Sharma is very patient and explained the acne treatment options thoroughly. The live token system at the clinic saved me over an hour of waiting!",
                doctor_reply="Thank you Sanjay! Glad the token queue made your clinic visit seamless.",
                is_verified_visit=True
            )
            rev2 = Review(
                id=str(uuid.uuid4()),
                doctor_slug="dr-rahul-sharma",
                patient_name="Kavita Uniyal",
                rating=5.0,
                waiting_time_rating=5.0,
                bedside_manner_rating=5.0,
                comment="Best dermatologist in Dehradun. The digital prescription with QR code and instant WhatsApp summary is so professional.",
                doctor_reply="Much appreciated Kavita. Wishing you great health!",
                is_verified_visit=True
            )
            rev3 = Review(
                id=str(uuid.uuid4()),
                doctor_slug="dr-aditi-joshi",
                patient_name="Manish Bhatt",
                rating=5.0,
                waiting_time_rating=4.9,
                bedside_manner_rating=5.0,
                comment="Completely painless single-sitting root canal! Dr. Aditi Joshi made sure I felt zero discomfort. Highly recommended dental clinic in Dehradun.",
                doctor_reply="Thank you Manish for your kind words! Keep up the good dental hygiene.",
                is_verified_visit=True
            )
            db.add_all([rev1, rev2, rev3])

        # Seed Expenses
        if db.query(Expense).count() == 0:
            exp1 = Expense(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                category="Medical Consumables",
                title="Disposable Syringes & Latex Gloves Box",
                amount=850.0,
                payment_mode="cash",
                recorded_by="Front Desk Reception",
                date=today_str
            )
            exp2 = Expense(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                category="Utilities & Maintenance",
                title="OPD RO Purifier Filter Replacement",
                amount=600.0,
                payment_mode="upi",
                recorded_by="Clinic Administrator",
                date=today_str
            )
            db.add_all([exp1, exp2])

        # Seed Inpatient Wards & Beds
        if db.query(ClinicWard).count() == 0:
            ward1_id = "ward-daycare-01"
            ward2_id = "ward-deluxe-02"
            ward3_id = "ward-general-03"
            ward4_id = "ward-icu-04"

            w1 = ClinicWard(
                id=ward1_id,
                clinic_slug="derma-care-dehradun",
                name="Daycare Laser & Recovery Suite",
                ward_type="daycare_recovery",
                daily_rate=1400.0,
                hourly_rate=150.0
            )
            w2 = ClinicWard(
                id=ward2_id,
                clinic_slug="derma-care-dehradun",
                name="Private Deluxe Suite",
                ward_type="private_deluxe",
                daily_rate=3200.0,
                hourly_rate=300.0
            )
            w3 = ClinicWard(
                id=ward3_id,
                clinic_slug="derma-care-dehradun",
                name="General Observation Ward",
                ward_type="general",
                daily_rate=900.0,
                hourly_rate=100.0
            )
            w4 = ClinicWard(
                id=ward4_id,
                clinic_slug="derma-care-dehradun",
                name="Emergency HDU & Monitoring",
                ward_type="icu",
                daily_rate=4500.0,
                hourly_rate=450.0
            )
            db.add_all([w1, w2, w3, w4])

            # Seed Beds
            now = datetime.utcnow()
            bed1 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward1_id,
                bed_number="DC-01",
                status="occupied",
                current_patient_name="Amit Rawat",
                current_patient_phone="+919123456780",
                assigned_doctor_name="Dr. Rahul Sharma",
                admission_notes="Post-PRP laser therapy recovery. Monitor vitals for 4 hours.",
                admission_timestamp=now - timedelta(hours=3, minutes=15)
            )
            bed2 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward1_id,
                bed_number="DC-02",
                status="vacant"
            )
            bed3 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward1_id,
                bed_number="DC-03",
                status="vacant"
            )
            bed4 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward2_id,
                bed_number="DLX-101",
                status="occupied",
                current_patient_name="Sunita Joshi",
                current_patient_phone="+919876543299",
                assigned_doctor_name="Dr. Rahul Sharma",
                admission_notes="Admitted for severe drug-induced urticarial rash and systemic observation.",
                admission_timestamp=now - timedelta(hours=18)
            )
            bed5 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward2_id,
                bed_number="DLX-102",
                status="discharge_pending",
                current_patient_name="Pooja Rawat",
                current_patient_phone="+919876511223",
                assigned_doctor_name="Dr. Aditi Joshi",
                admission_notes="Post-op jaw observation. Final discharge summary pending doctor sign-off.",
                admission_timestamp=now - timedelta(hours=26)
            )
            bed6 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward3_id,
                bed_number="GEN-01",
                status="occupied",
                current_patient_name="Rajesh Mehra",
                current_patient_phone="+919876522334",
                assigned_doctor_name="Dr. Vikram Sethi",
                admission_notes="Pediatric hydration monitoring and nebulization support.",
                admission_timestamp=now - timedelta(hours=6, minutes=45)
            )
            bed7 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward3_id,
                bed_number="GEN-02",
                status="vacant"
            )
            bed8 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward3_id,
                bed_number="GEN-03",
                status="maintenance"
            )
            bed9 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward4_id,
                bed_number="HDU-01",
                status="vacant"
            )
            bed10 = ClinicBed(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                ward_id=ward4_id,
                bed_number="HDU-02",
                status="occupied",
                current_patient_name="Mohan Lal Verma",
                current_patient_phone="+919876533445",
                assigned_doctor_name="Dr. Rahul Sharma",
                admission_notes="Severe anaphylactoid reaction. Continuous oxygen and SpO2 monitoring.",
                admission_timestamp=now - timedelta(hours=11, minutes=30)
            )
            db.add_all([bed1, bed2, bed3, bed4, bed5, bed6, bed7, bed8, bed9, bed10])

        # Seed Pharmacy Items & Batches
        if db.query(PharmacyItem).count() == 0:
            today = date.today()
            
            pharm1 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Doxy-100 L",
                generic_name="DOXYCYCLINE 100MG + LACTOBACILLUS",
                dosage_form="Capsule",
                strength="100mg",
                batch_number="DX-2026-91",
                expiry_date=str(today + timedelta(days=42)), # Expiring soon (<60d)
                current_stock=30,
                reorder_level=15,
                purchase_price=28.0,
                mrp=65.0,
                selling_price=58.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="Dr. Reddy's Lab",
                rack_location="Rack A-01"
            )

            pharm2 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Retino-A 0.05%",
                generic_name="TRETINOIN 0.05% W/W GEL",
                dosage_form="Ointment",
                strength="0.05%",
                batch_number="TR-2027-14",
                expiry_date=str(today + timedelta(days=380)),
                current_stock=4, # Low stock alert!
                reorder_level=10,
                purchase_price=110.0,
                mrp=220.0,
                selling_price=195.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="Janssen India",
                rack_location="Rack A-04"
            )

            pharm3 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Cetzine 10",
                generic_name="CETIRIZINE HYDROCHLORIDE 10MG",
                dosage_form="Tablet",
                strength="100mg",
                batch_number="CT-2027-55",
                expiry_date=str(today + timedelta(days=450)),
                current_stock=120,
                reorder_level=20,
                purchase_price=12.0,
                mrp=35.0,
                selling_price=30.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="GSK Pharma",
                rack_location="Rack B-02"
            )

            pharm4 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Augmentin 625 Duo",
                generic_name="AMOXICILLIN 500MG + CLAVULANIC ACID 125MG",
                dosage_form="Tablet",
                strength="625mg",
                batch_number="AMX-2026-44",
                expiry_date=str(today + timedelta(days=210)),
                current_stock=45,
                reorder_level=15,
                purchase_price=95.0,
                mrp=210.0,
                selling_price=185.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="GlaxoSmithKline",
                rack_location="Rack B-05"
            )

            pharm5 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Dolo 650",
                generic_name="PARACETAMOL 650MG",
                dosage_form="Tablet",
                strength="650mg",
                batch_number="PCM-2027-80",
                expiry_date=str(today + timedelta(days=620)),
                current_stock=240,
                reorder_level=30,
                purchase_price=14.5,
                mrp=32.0,
                selling_price=29.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="Micro Labs",
                rack_location="Rack C-01"
            )

            pharm6 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Momate Cream",
                generic_name="MOMETASONE FUROATE 0.1% W/W",
                dosage_form="Ointment",
                strength="0.1%",
                batch_number="MF-2026-19",
                expiry_date=str(today + timedelta(days=18)), # Critical Expiry (<30d)
                current_stock=6, # Low stock too
                reorder_level=10,
                purchase_price=85.0,
                mrp=175.0,
                selling_price=150.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="Glenmark",
                rack_location="Rack A-08"
            )

            pharm7 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Azithral 500",
                generic_name="AZITHROMYCIN 500MG",
                dosage_form="Tablet",
                strength="500mg",
                batch_number="AZ-2027-02",
                expiry_date=str(today + timedelta(days=320)),
                current_stock=40,
                reorder_level=10,
                purchase_price=62.0,
                mrp=135.0,
                selling_price=120.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="Alembic Pharma",
                rack_location="Rack B-03"
            )

            pharm8 = PharmacyItem(
                id=str(uuid.uuid4()),
                clinic_slug="derma-care-dehradun",
                brand_name="Clindac A Gel",
                generic_name="CLINDAMYCIN PHOSPHATE 1% GEL",
                dosage_form="Ointment",
                strength="1%",
                batch_number="CL-2026-33",
                expiry_date=str(today + timedelta(days=240)),
                current_stock=5, # Low stock alert!
                reorder_level=12,
                purchase_price=90.0,
                mrp=185.0,
                selling_price=165.0,
                gst_rate=12.0,
                hsn_code="3004",
                manufacturer="Alkem Labs",
                rack_location="Rack A-05"
            )

            db.add_all([pharm1, pharm2, pharm3, pharm4, pharm5, pharm6, pharm7, pharm8])

        # Seed Sample Pharmacy Dispense Bill
        if db.query(PharmacyDispense).count() == 0:
            bill1 = PharmacyDispense(
                id=str(uuid.uuid4()),
                bill_number="BILL-PHARM-2026-001",
                clinic_slug="derma-care-dehradun",
                prescription_number="RX-2026-09-0014",
                patient_name="Amit Rawat",
                patient_phone="+919123456780",
                doctor_name="Dr. Rahul Sharma",
                items=[
                    {
                        "item_id": "seed-1",
                        "brand_name": "Doxy-100 L",
                        "batch_number": "DX-2026-91",
                        "dosage_form": "Capsule",
                        "quantity": 1,
                        "unit_price": 58.0,
                        "total": 58.0,
                        "gst_rate": 12.0
                    },
                    {
                        "item_id": "seed-2",
                        "brand_name": "Retino-A 0.05%",
                        "batch_number": "TR-2027-14",
                        "dosage_form": "Ointment",
                        "quantity": 1,
                        "unit_price": 195.0,
                        "total": 195.0,
                        "gst_rate": 12.0
                    }
                ],
                subtotal=253.0,
                discount=13.0,
                gst_amount=28.8,
                total_amount=268.8,
                payment_mode="upi",
                status="dispensed",
                created_at=datetime.utcnow() - timedelta(hours=2)
            )
            db.add(bill1)

        db.commit()
        print("ClinicOS Database initialized and seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error initializing DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
