-- ============================================================================
-- CLINICOS / DOCSPHERE: SEED DATA SPECIFICATION
-- Pilot Testbed: Dehradun, Uttarakhand (Rajpur Road, EC Road, Chakrata Road)
-- Realistic Doctors, Clinics, Patients, Tokens, Prescriptions & Expenses
-- ============================================================================

-- A. USERS (Doctors, Receptionists, Patients)
-- Password for all seed users is: Password@123 (bcrypt: $2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW)
INSERT INTO users (id, phone, email, password_hash, full_name, role, is_active, is_verified) VALUES
-- 1. Doctor Rahul Sharma (Dermatologist)
('11111111-1111-1111-1111-111111111111', '+919876543210', 'dr.rahul@clinicos.in', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Dr. Rahul Sharma', 'doctor', true, true),
-- 2. Doctor Aditi Joshi (Dentist)
('22222222-2222-2222-2222-222222222222', '+919876543211', 'dr.aditi@clinicos.in', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Dr. Aditi Joshi', 'doctor', true, true),
-- 3. Doctor Vikram Sethi (Pediatrician)
('33333333-3333-3333-3333-333333333333', '+919876543212', 'dr.vikram@clinicos.in', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Dr. Vikram Sethi', 'doctor', true, true),
-- 4. Doctor Meenakshi Negi (General Physician / Diabetologist)
('44444444-4444-4444-4444-444444444444', '+919876543213', 'dr.meenakshi@clinicos.in', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Dr. Meenakshi Negi', 'doctor', true, true),
-- 5. Receptionist Staff (Pooja Verma at Derma Care)
('55555555-5555-5555-5555-555555555555', '+919876543214', 'pooja@dermacare.in', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Pooja Verma', 'staff', true, true),
-- 6. Patients
('66666666-6666-6666-6666-666666666661', '+919123456780', 'amit.rawat@gmail.com', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Amit Rawat', 'patient', true, true),
('66666666-6666-6666-6666-666666666662', '+919123456781', 'priya.singh@gmail.com', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Priya Singh', 'patient', true, true),
('66666666-6666-6666-6666-666666666663', '+919123456782', 'rohit.pant@gmail.com', '$2b$12$e8w8G185YFmHqGvGkJ0fNuWkX/5zXgN1K0qjX8d8XQo8tYd5vJ8xW', 'Rohit Pant', 'patient', true, true)
ON CONFLICT (phone) DO NOTHING;

-- B. CLINICS
INSERT INTO clinics (id, slug, name, owner_user_id, tagline, about, phone, whatsapp_number, gstin, address_line, city, state, postal_code, latitude, longitude, facilities, opening_hours, is_verified, status) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'derma-care-dehradun', 'Derma Care Skin & Laser Centre', '11111111-1111-1111-1111-111111111111', 'Advanced Dermatology & Cosmetic Laser Solutions', 'State of the art skin clinic specializing in acne, laser hair removal, eczema and chemical peels.', '+919876543210', '+919876543210', '05AAAAA0000A1Z5', '14, Rajpur Road, Near Ashley Hall', 'Dehradun', 'Uttarakhand', '248001', 30.3255, 78.0436, ARRAY['AC', 'Laser Studio', 'WiFi', 'Wheelchair Accessible'], '{"monday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM", "tuesday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM", "wednesday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM", "thursday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM", "friday": "10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM", "saturday": "10:00 AM - 04:00 PM"}', true, 'active'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'smile-craft-dental', 'Smile Craft Multi-Speciality Dental', '22222222-2222-2222-2222-222222222222', 'Gentle, Precision Dental Care & Implants', 'Modern digital dental practice offering painless root canals, invisible aligners, dental implants and pediatric dentistry.', '+919876543211', '+919876543211', '05BBBBB0000B1Z6', '42, EC Road, Near Survey Chowk', 'Dehradun', 'Uttarakhand', '248001', 30.3204, 78.0489, ARRAY['AC', 'Digital RVG X-Ray', 'Autoclave Sterilization', 'WiFi'], '{"monday_to_saturday": "10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM"}', true, 'active'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dron-child-clinic', 'Dron Child & Newborn Health Centre', '33333333-3333-3333-3333-333333333333', 'Complete Pediatric Care & Vaccination Hub', 'Dedicated child health clinic offering newborn monitoring, immunizations, and pediatric emergency care.', '+919876543212', '+919876543212', '05CCCCC0000C1Z7', '88, Chakrata Road, Near Ballupur Chowk', 'Dehradun', 'Uttarakhand', '248001', 30.3342, 78.0125, ARRAY['AC', 'Vaccine Cold Chain', 'Nebulization Station', 'Play Area'], '{"monday_to_saturday": "09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM"}', true, 'active')
ON CONFLICT (slug) DO NOTHING;

-- C. DOCTOR PROFILES
INSERT INTO doctor_profiles (id, user_id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews) VALUES
('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'dr-rahul-sharma', 'Dr.', 'Dr. Rahul Sharma', 'UKMC-8942-2012', 'Uttarakhand Medical Council', 'MBBS, MD (Dermatology, Venereology & Leprosy)', 'Dermatologist', ARRAY['Acne Specialist', 'Cosmetic Laser Surgery', 'Hair Loss Therapy'], 12, ARRAY['English', 'Hindi'], 'Dr. Rahul Sharma is a senior consultant dermatologist with over 12 years of clinical expertise in treating chronic acne, psoriasis, and laser aesthetic procedures.', 600.00, 300.00, 7, '[{"name": "Skin Consultation", "fee": 600}, {"name": "Chemical Peel", "fee": 1500}, {"name": "Laser Scar Reduction", "fee": 2500}]', 'verified', 4.9, 142),
('d2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'dr-aditi-joshi', 'Dr.', 'Dr. Aditi Joshi', 'UDC-4120-2016', 'Uttarakhand Dental Council', 'BDS, MDS (Conservative Dentistry & Endodontics)', 'Dentist', ARRAY['Painless Root Canal', 'Cosmetic Veneers', 'Dental Implants'], 8, ARRAY['English', 'Hindi', 'Garhwali'], 'Dr. Aditi Joshi is a leading endodontist known for painless single-sitting root canals and smile makeovers in Dehradun.', 400.00, 0.00, 7, '[{"name": "Dental Checkup & Consultation", "fee": 400}, {"name": "Single Sitting RCT", "fee": 3000}, {"name": "Teeth Whitening", "fee": 3500}]', 'verified', 4.8, 98),
('d3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'dr-vikram-sethi', 'Dr.', 'Dr. Vikram Sethi', 'UKMC-6214-2009', 'Uttarakhand Medical Council', 'MBBS, DCH, DNB (Pediatrics)', 'Pediatrician', ARRAY['Newborn Intensive Care', 'Childhood Asthma', 'Vaccination Schedule'], 15, ARRAY['English', 'Hindi'], 'Senior child specialist providing gentle, compassionate pediatric healthcare and complete vaccination support.', 500.00, 200.00, 5, '[{"name": "Pediatric Consultation", "fee": 500}, {"name": "Vaccination Administration", "fee": 200}, {"name": "Growth & Milestones Assessment", "fee": 600}]', 'verified', 4.95, 210)
ON CONFLICT (slug) DO NOTHING;

-- D. CLINIC-DOCTOR RELATIONSHIP
INSERT INTO clinic_doctors (clinic_id, doctor_id, is_primary_owner, opd_schedules) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', true, '[{"day": "Monday", "shifts": [{"start_time": "10:00", "end_time": "14:00", "slot_duration_minutes": 15, "max_tokens": 16}, {"start_time": "17:00", "end_time": "20:30", "slot_duration_minutes": 15, "max_tokens": 14}]}]'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd2222222-2222-2222-2222-222222222222', true, '[{"day": "Monday", "shifts": [{"start_time": "10:00", "end_time": "13:30", "slot_duration_minutes": 20, "max_tokens": 10}, {"start_time": "16:30", "end_time": "20:00", "slot_duration_minutes": 20, "max_tokens": 10}]}]'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'd3333333-3333-3333-3333-333333333333', true, '[{"day": "Monday", "shifts": [{"start_time": "09:30", "end_time": "13:00", "slot_duration_minutes": 15, "max_tokens": 14}, {"start_time": "17:00", "end_time": "20:30", "slot_duration_minutes": 15, "max_tokens": 14}]}]')
ON CONFLICT (clinic_id, doctor_id) DO NOTHING;

-- E. TODAY'S LIVE APPOINTMENTS & TOKENS
INSERT INTO appointments (id, appointment_number, clinic_id, doctor_id, patient_id, appointment_date, time_slot, token_number, consultation_type, status, fee_amount, payment_status, payment_mode, symptoms_description) VALUES
('ap000001-0001-0001-0001-000000000001', 'APT-DERMA-101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666661', CURRENT_DATE, '10:15 AM - 10:30 AM', 1, 'in_person', 'completed', 600.00, 'paid', 'upi', 'Severe cystic acne breakouts on face for 3 months'),
('ap000002-0002-0002-0002-000000000002', 'APT-DERMA-102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666662', CURRENT_DATE, '10:30 AM - 10:45 AM', 2, 'in_person', 'in_consultation', 600.00, 'paid', 'cash', 'Itchy red rashes on forearms and neck'),
('ap000003-0003-0003-0003-000000000003', 'APT-DERMA-103', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd1111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666663', CURRENT_DATE, '10:45 AM - 11:00 AM', 3, 'in_person', 'in_waiting', 600.00, 'pending', 'upi', 'Sudden hair shedding and scalp dandruff')
ON CONFLICT (appointment_number) DO NOTHING;

-- F. CONSULTATION & PRESCRIPTION (For Token #1)
INSERT INTO consultations (id, appointment_id, patient_id, doctor_id, clinic_id, vitals, symptoms, clinical_findings, provisional_diagnosis, investigation_advised, followup_date, is_signed) VALUES
('cs000001-0001-0001-0001-000000000001', 'ap000001-0001-0001-0001-000000000001', '66666666-6666-6666-6666-666666666661', 'd1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '{"bp": "118/78", "pulse": 74, "temp": 98.4, "weight": 64}', ARRAY['Cystic acne', 'Facial erythema', 'Oily skin'], 'Multiple inflammatory papules and nodules across bilateral cheeks with hyperpigmentation.', 'Moderate to Severe Acne Vulgaris (Grade III)', ARRAY['Serum Testosterone (if persistent)', 'Liver Function Test (Baseline)'], CURRENT_DATE + INTERVAL '14 days', true)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO prescriptions (id, prescription_number, consultation_id, patient_id, doctor_id, clinic_id, instructions, digital_signature_hash, qr_verification_code) VALUES
('rx000001-0001-0001-0001-000000000001', 'RX-2026-09-0014', 'cs000001-0001-0001-0001-000000000001', '66666666-6666-6666-6666-666666666661', 'd1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wash face with mild foaming cleanser twice daily. Avoid picking or squeezing lesions. Use non-comedogenic sunscreen SPF 50 during daytime.', 'a7f3b89091c5e4d28471b3e8c991a03f441582e79601d3cb4198fa0174e50212', 'VERIFY-DERMA-991204')
ON CONFLICT (prescription_number) DO NOTHING;

INSERT INTO prescription_items (prescription_id, medicine_name, generic_name, dosage_form, strength, dosage_frequency, timing_relation, duration_days, special_instructions) VALUES
('rx000001-0001-0001-0001-000000000001', 'Tab Doxy-100', 'DOXYCYCLINE HYCLATE', 'Capsule', '100 mg', '1-0-0', 'After Food', 14, 'Take with a full glass of water, do not lie down immediately after taking'),
('rx000001-0001-0001-0001-000000000001', 'Epiduo Gel', 'ADAPALENE + BENZOYL PEROXIDE', 'Ointment', '0.1% / 2.5%', '0-0-1', 'At Bedtime', 30, 'Apply pea-sized amount to affected areas only after moisturizer'),
('rx000001-0001-0001-0001-000000000001', 'Cetaphil Gentle Cleanser', 'NON-SOAP CLEANSING LOTION', 'Syrup', '250 ml', '1-0-1', 'Before Food', 60, 'Gentle circular motion for 30 seconds then rinse with lukewarm water');

-- G. CLINIC DAILY EXPENSES
INSERT INTO clinic_expenses (clinic_id, category, amount, expense_date, description, payment_mode, created_by) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Electricity', 4200.00, CURRENT_DATE - INTERVAL '2 days', 'Commercial UPCL power bill for August', 'upi', '11111111-1111-1111-1111-111111111111'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Consumables', 1450.00, CURRENT_DATE - INTERVAL '1 day', 'Disposable gloves, surgical spirit, cotton rolls', 'cash', '55555555-5555-5555-5555-555555555555'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Staff Salary', 15000.00, CURRENT_DATE - INTERVAL '5 days', 'Receptionist monthly salary (Pooja Verma)', 'upi', '11111111-1111-1111-1111-111111111111');
