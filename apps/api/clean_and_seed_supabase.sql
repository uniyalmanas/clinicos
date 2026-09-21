-- ==========================================================================
-- ClinicOS / DocSphere: Complete Clean & Seed Migration for Supabase
-- Target Project: ClinicFlow (jkixowmebpxwadnuxeil)
-- Paste this entire script into Supabase SQL Editor and click 'RUN'
-- ==========================================================================

-- STEP 1: Wipe all old tables, views, triggers from the previous project
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- STEP 2: Grant standard permissions to Supabase roles
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- STEP 3: Create Tables
CREATE TABLE doctors (
	id VARCHAR NOT NULL, 
	slug VARCHAR, 
	title VARCHAR, 
	full_name VARCHAR NOT NULL, 
	medical_council_reg_number VARCHAR, 
	medical_council_state VARCHAR, 
	qualification_summary VARCHAR, 
	specialization VARCHAR, 
	sub_specializations JSON, 
	years_of_experience INTEGER, 
	languages_spoken JSON, 
	bio TEXT, 
	consultation_fee FLOAT, 
	followup_fee FLOAT, 
	followup_validity_days INTEGER, 
	services_offered JSON, 
	verification_status VARCHAR, 
	rating FLOAT, 
	total_reviews INTEGER, 
	clinic_id VARCHAR, 
	clinic_name VARCHAR, 
	clinic_slug VARCHAR, 
	clinic_address VARCHAR, 
	opd_timings VARCHAR, 
	phone VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_doctors_slug ON doctors (slug);
CREATE INDEX IF NOT EXISTS ix_doctors_specialization ON doctors (specialization);
CREATE INDEX IF NOT EXISTS ix_doctors_clinic_id ON doctors (clinic_id);
CREATE INDEX IF NOT EXISTS ix_doctors_clinic_slug ON doctors (clinic_slug);

CREATE TABLE clinics (
	id VARCHAR NOT NULL, 
	slug VARCHAR, 
	name VARCHAR NOT NULL, 
	phone VARCHAR, 
	address_line VARCHAR, 
	city VARCHAR, 
	state VARCHAR, 
	postal_code VARCHAR, 
	facilities JSON, 
	opening_hours JSON, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_clinics_slug ON clinics (slug);

CREATE TABLE appointments (
	id VARCHAR NOT NULL, 
	appointment_number VARCHAR, 
	doctor_slug VARCHAR, 
	doctor_name VARCHAR, 
	clinic_name VARCHAR, 
	patient_name VARCHAR NOT NULL, 
	patient_phone VARCHAR, 
	appointment_date VARCHAR, 
	time_slot VARCHAR, 
	token_number INTEGER, 
	status VARCHAR, 
	fee_amount FLOAT, 
	payment_status VARCHAR, 
	payment_mode VARCHAR, 
	symptoms_description TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_appointments_appointment_number ON appointments (appointment_number);
CREATE INDEX IF NOT EXISTS ix_appointments_doctor_slug ON appointments (doctor_slug);
CREATE INDEX IF NOT EXISTS ix_appointments_patient_phone ON appointments (patient_phone);
CREATE INDEX IF NOT EXISTS ix_appointments_appointment_date ON appointments (appointment_date);

CREATE TABLE prescriptions (
	id VARCHAR NOT NULL, 
	prescription_number VARCHAR, 
	appointment_number VARCHAR, 
	doctor_name VARCHAR, 
	doctor_reg_number VARCHAR, 
	clinic_name VARCHAR, 
	clinic_address VARCHAR, 
	patient_name VARCHAR, 
	patient_phone VARCHAR, 
	patient_age INTEGER, 
	patient_gender VARCHAR, 
	vitals JSON, 
	symptoms JSON, 
	provisional_diagnosis VARCHAR, 
	items JSON, 
	instructions TEXT, 
	followup_date VARCHAR, 
	digital_signature_hash VARCHAR, 
	qr_verification_code VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_prescriptions_prescription_number ON prescriptions (prescription_number);
CREATE INDEX IF NOT EXISTS ix_prescriptions_appointment_number ON prescriptions (appointment_number);
CREATE INDEX IF NOT EXISTS ix_prescriptions_patient_phone ON prescriptions (patient_phone);

CREATE TABLE patient_documents (
	id VARCHAR NOT NULL, 
	patient_phone VARCHAR, 
	patient_name VARCHAR, 
	document_type VARCHAR, 
	title VARCHAR NOT NULL, 
	file_name VARCHAR, 
	file_size_kb INTEGER, 
	doctor_notes TEXT, 
	uploaded_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_patient_documents_patient_phone ON patient_documents (patient_phone);

CREATE TABLE reviews (
	id VARCHAR NOT NULL, 
	doctor_slug VARCHAR, 
	patient_name VARCHAR, 
	rating FLOAT, 
	waiting_time_rating FLOAT, 
	bedside_manner_rating FLOAT, 
	comment TEXT, 
	doctor_reply TEXT, 
	is_verified_visit BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_reviews_doctor_slug ON reviews (doctor_slug);

CREATE TABLE expenses (
	id VARCHAR NOT NULL, 
	clinic_slug VARCHAR, 
	category VARCHAR, 
	title VARCHAR, 
	amount FLOAT, 
	payment_mode VARCHAR, 
	recorded_by VARCHAR, 
	date VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_expenses_clinic_slug ON expenses (clinic_slug);

CREATE TABLE clinic_wards (
	id VARCHAR NOT NULL, 
	clinic_slug VARCHAR, 
	name VARCHAR NOT NULL, 
	ward_type VARCHAR NOT NULL, 
	daily_rate FLOAT, 
	hourly_rate FLOAT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_clinic_wards_clinic_slug ON clinic_wards (clinic_slug);

CREATE TABLE clinic_beds (
	id VARCHAR NOT NULL, 
	clinic_slug VARCHAR, 
	ward_id VARCHAR, 
	bed_number VARCHAR NOT NULL, 
	status VARCHAR, 
	current_patient_name VARCHAR, 
	current_patient_phone VARCHAR, 
	assigned_doctor_name VARCHAR, 
	admission_notes TEXT, 
	admission_timestamp TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_clinic_beds_clinic_slug ON clinic_beds (clinic_slug);
CREATE INDEX IF NOT EXISTS ix_clinic_beds_ward_id ON clinic_beds (ward_id);

CREATE TABLE pharmacy_items (
	id VARCHAR NOT NULL, 
	clinic_slug VARCHAR, 
	brand_name VARCHAR NOT NULL, 
	generic_name VARCHAR NOT NULL, 
	dosage_form VARCHAR, 
	strength VARCHAR, 
	batch_number VARCHAR NOT NULL, 
	expiry_date VARCHAR NOT NULL, 
	current_stock INTEGER, 
	reorder_level INTEGER, 
	purchase_price FLOAT, 
	mrp FLOAT, 
	selling_price FLOAT, 
	gst_rate FLOAT, 
	hsn_code VARCHAR, 
	manufacturer VARCHAR, 
	rack_location VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_pharmacy_items_clinic_slug ON pharmacy_items (clinic_slug);
CREATE INDEX IF NOT EXISTS ix_pharmacy_items_brand_name ON pharmacy_items (brand_name);
CREATE INDEX IF NOT EXISTS ix_pharmacy_items_generic_name ON pharmacy_items (generic_name);
CREATE INDEX IF NOT EXISTS ix_pharmacy_items_batch_number ON pharmacy_items (batch_number);
CREATE INDEX IF NOT EXISTS ix_pharmacy_items_expiry_date ON pharmacy_items (expiry_date);

CREATE TABLE pharmacy_dispenses (
	id VARCHAR NOT NULL, 
	bill_number VARCHAR, 
	clinic_slug VARCHAR, 
	prescription_number VARCHAR, 
	patient_name VARCHAR NOT NULL, 
	patient_phone VARCHAR, 
	doctor_name VARCHAR, 
	items JSON, 
	subtotal FLOAT, 
	discount FLOAT, 
	gst_amount FLOAT, 
	total_amount FLOAT, 
	payment_mode VARCHAR, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_pharmacy_dispenses_bill_number ON pharmacy_dispenses (bill_number);
CREATE INDEX IF NOT EXISTS ix_pharmacy_dispenses_clinic_slug ON pharmacy_dispenses (clinic_slug);
CREATE INDEX IF NOT EXISTS ix_pharmacy_dispenses_prescription_number ON pharmacy_dispenses (prescription_number);

CREATE TABLE marketplace_inquiries (
	id VARCHAR NOT NULL, 
	inquiry_token VARCHAR, 
	inquiry_type VARCHAR, 
	patient_name VARCHAR NOT NULL, 
	patient_phone VARCHAR NOT NULL, 
	locality VARCHAR, 
	target_entity_name VARCHAR NOT NULL, 
	target_entity_phone VARCHAR NOT NULL, 
	items JSON, 
	prescription_preview TEXT, 
	notes TEXT, 
	channel VARCHAR, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_marketplace_inquiries_inquiry_token ON marketplace_inquiries (inquiry_token);
CREATE INDEX IF NOT EXISTS ix_marketplace_inquiries_inquiry_type ON marketplace_inquiries (inquiry_type);

CREATE TABLE partner_applications (
	id VARCHAR NOT NULL, 
	partner_type VARCHAR, 
	business_name VARCHAR NOT NULL, 
	contact_person VARCHAR NOT NULL, 
	phone VARCHAR NOT NULL, 
	whatsapp VARCHAR NOT NULL, 
	locality VARCHAR NOT NULL, 
	address VARCHAR NOT NULL, 
	license_number VARCHAR, 
	home_service BOOLEAN, 
	is_verified BOOLEAN, 
	status VARCHAR, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_partner_applications_partner_type ON partner_applications (partner_type);

CREATE TABLE clinic_eod_closings (
	id VARCHAR NOT NULL, 
	clinic_slug VARCHAR, 
	closing_date VARCHAR, 
	closed_at TIMESTAMP WITHOUT TIME ZONE, 
	closed_by VARCHAR, 
	counted_cash FLOAT, 
	expected_cash FLOAT, 
	cash_discrepancy FLOAT, 
	gross_collections FLOAT, 
	soundbox_upi FLOAT, 
	total_consultations INTEGER, 
	closing_notes TEXT, 
	audit_hash VARCHAR NOT NULL, 
	status VARCHAR, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_clinic_eod_closings_clinic_slug ON clinic_eod_closings (clinic_slug);
CREATE INDEX IF NOT EXISTS ix_clinic_eod_closings_closing_date ON clinic_eod_closings (closing_date);

-- STEP 4: Seed Verified Clinics, Doctors, Beds & Records
-- Seeding doctors (21 rows)
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('4ee54558-c815-4e62-bc33-5536af99253f', 'dr-rahul-sharma', 'Dr.', 'Dr. Rahul Sharma', 'UKMC-8942-2012', 'Uttarakhand Medical Council', 'MBBS, MD (Dermatology, Venereology & Leprosy)', 'Dermatologist', '["Acne Specialist", "Cosmetic Laser Surgery", "Hair Loss Therapy"]'::json, 12, '["English", "Hindi"]'::json, 'Dr. Rahul Sharma is a senior consultant dermatologist with over 12 years of clinical expertise in treating chronic acne, psoriasis, and laser aesthetic procedures. Committed to personalized, evidence-based skincare.', 600.0, 300.0, 7, '[{"name": "Skin & Scalp Consultation", "fee": 600}, {"name": "Chemical Peel & Acne Treatment", "fee": 1500}, {"name": "Laser Scar Reduction", "fee": 2500}, {"name": "PRP Hair Loss Therapy", "fee": 3500}]'::json, 'verified', 4.9, 142, 'clinic-derma-care-01', 'Derma Care Skin & Laser Centre', 'derma-care-dehradun', '14, Rajpur Road, Near Ashley Hall, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM', '+919876543210', '2026-09-17 05:01:58.847270') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('6f6446b6-7070-4b64-b8cc-ff0dadba01ca', 'dr-aditi-joshi', 'Dr.', 'Dr. Aditi Joshi', 'UDC-4120-2016', 'Uttarakhand Dental Council', 'BDS, MDS (Endodontics)', 'Dentist', '["Painless Root Canal", "Cosmetic Veneers", "Dental Implants"]'::json, 8, '["English", "Hindi", "Garhwali"]'::json, 'Dr. Aditi Joshi is a leading endodontist known for painless single-sitting root canals and digital smile design in Dehradun.', 400.0, 0.0, 7, '[{"name": "Dental Checkup & Digital X-Ray", "fee": 400}, {"name": "Single Sitting Painless RCT", "fee": 3000}, {"name": "Teeth Whitening", "fee": 3500}, {"name": "Dental Implants Consultation", "fee": 800}]'::json, 'verified', 4.8, 98, 'clinic-smile-craft-02', 'Smile Craft Multi-Speciality Dental', 'smile-craft-dental', '42, EC Road, Near Survey Chowk, Dehradun', 'Mon - Sat: 10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM', '+919876543211', '2026-09-17 05:01:58.847274') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('36469cd8-f17b-4bfb-a2d4-9d1ae26b8d5d', 'dr-vikram-sethi', 'Dr.', 'Dr. Vikram Sethi', 'UKMC-6214-2009', 'Uttarakhand Medical Council', 'MBBS, DCH, DNB (Pediatrics)', 'Pediatrician', '["Newborn Intensive Care", "Childhood Asthma", "Vaccination"]'::json, 15, '["English", "Hindi"]'::json, 'Senior child specialist providing gentle, compassionate pediatric healthcare, newborn care, and complete childhood immunization schedules.', 500.0, 200.0, 5, '[{"name": "Child OPD Consultation", "fee": 500}, {"name": "Vaccination Administration", "fee": 200}, {"name": "Growth & Milestones Assessment", "fee": 600}]'::json, 'verified', 4.95, 210, 'clinic-dron-child-03', 'Dron Child & Newborn Health Centre', 'dron-child-clinic', '88, Chakrata Road, Near Ballupur Chowk, Dehradun', 'Mon - Sat: 09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM', '+919876543212', '2026-09-17 05:01:58.847275') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('4970fd42-dc0e-45ea-b0af-5efa77c07906', 'dr-alok-mathur', 'Dr.', 'Dr. Alok Mathur', 'UKMC-5541-2012', 'Uttarakhand Medical Council', 'MBBS, MD', 'Dermatologist', '[]'::json, 14, '["English", "Hindi"]'::json, 'Dr. Alok Mathur is an experienced Dermatologist practicing in Dehradun with 14+ years of clinical expertise. Founder of Skin & Aesthetic Centre on Rajpur Road, dedicated to compassionate, evidence-based patient care.', 600.0, 200.0, 7, '[{"name": "Acne & Scar Treatment", "fee": 600.0}, {"name": "Eczema Management", "fee": 600.0}, {"name": "Psoriasis Care", "fee": 600.0}]'::json, 'verified', 5.0, 1, '4ac15e0b-c18f-4434-8fd4-999c3e4e95dc', 'Skin & Aesthetic Centre', 'skin-aesthetic-centre', 'Rajpur Road, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM', '+919876543299', '2026-09-17 15:04:23.457503') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d4444444-4444-4444-4444-444444444444', 'dr-arvind-rawat', 'Dr.', 'Dr. Arvind Rawat', 'UKMC-4819-2008', 'Uttarakhand Medical Council', 'MBBS, MD (General Medicine)', 'General Physician', '["Internal Medicine", "Diabetes Care", "Hypertension"]'::json, 16, '["English", "Hindi", "Garhwali"]'::json, 'Senior Consultant in Internal Medicine with 16 years of clinical experience managing diabetes reversal protocols, hypertension, viral illnesses, and preventive health audits.', 500.0, 250.0, 7, '[{"name": "General Medicine Consultation", "fee": 500}, {"name": "Diabetes Reversal & Diet Mapping", "fee": 900}, {"name": "ECG + Vitals Screening", "fee": 350}, {"name": "Infection & Viral Treatment Plan", "fee": 500}]'::json, 'verified', 4.92, 184, 'c-doon-family-health', 'Doon Family Health & Diabetes Care', 'doon-family-health', '12, Saharanpur Road, Near Patel Chowk, Dehradun', 'Mon - Sat: 09:00 AM - 01:30 PM, 05:00 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286645') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d5555555-5555-5555-5555-555555555555', 'dr-priya-nair', 'Dr.', 'Dr. Priya Nair', 'UKMC-3912-2010', 'Uttarakhand Medical Council', 'MBBS, MD (Medicine), DM (Cardiology), FACC', 'Cardiologist', '["Interventional Cardiology", "Echocardiography", "Preventive Heart Health"]'::json, 14, '["English", "Hindi", "Malayalam"]'::json, 'Interventional Cardiologist specialized in coronary artery disease, post-angioplasty care, heart failure, 2D Echocardiography, and preventive cardiac wellness.', 800.0, 400.0, 10, '[{"name": "Cardiology Consultation", "fee": 800}, {"name": "2D Color Doppler Echo", "fee": 2200}, {"name": "TMT Stress Test", "fee": 1800}]'::json, 'verified', 4.96, 167, 'c-himalayan-heart-clinic', 'Himalayan Heart & Vascular Clinic', 'himalayan-heart-clinic', '56, Rajpur Road, Opp. Hotel Madhuban, Dehradun', 'Mon - Sat: 11:00 AM - 03:00 PM, 05:30 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286647') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d6666666-6666-6666-6666-666666666666', 'dr-rajesh-semwal', 'Dr.', 'Dr. Rajesh Semwal', 'UKMC-5102-2006', 'Uttarakhand Medical Council', 'MBBS, MS (Orthopedics), MCh (Joint Replacement)', 'Orthopedic Surgeon', '["Robotic Joint Replacement", "Sports Ligament Repair", "Spine Sciatica"]'::json, 18, '["English", "Hindi", "Garhwali"]'::json, 'Renowned orthopedic & spine surgeon specializing in robotic knee and hip joint replacements, sports ligament repairs (ACL/PCL), sciatica, and complex trauma fractures.', 600.0, 300.0, 10, '[{"name": "Orthopedic OPD Consultation", "fee": 600}, {"name": "Joint Injection (Hyaluronic/Steroid)", "fee": 1500}, {"name": "Spine & Sciatica Assessment", "fee": 600}]'::json, 'verified', 4.92, 230, 'c-doon-ortho-spine', 'Doon Ortho & Joint Spine Clinic', 'doon-ortho-spine', '24, Ballupur Chowk, Chakrata Road, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286648') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d7777777-7777-7777-7777-777777777777', 'dr-meenakshi-sundaram', 'Dr.', 'Dr. Meenakshi Sundaram', 'UKMC-7890-2011', 'Uttarakhand Medical Council', 'MBBS, MS (Obstetrics & Gynecology), DGO', 'Gynecologist', '["High-Risk Pregnancy", "PCOS / PCOD Care", "Infertility Workup"]'::json, 15, '["English", "Hindi", "Tamil"]'::json, 'Compassionate obstetrician & gynecologist providing comprehensive prenatal care, high-risk pregnancy management, painless normal deliveries, and holistic PCOS/PCOD reversal.', 600.0, 300.0, 7, '[{"name": "Gynecology & Pregnancy Consultation", "fee": 600}, {"name": "Pap Smear & Cervical Screening", "fee": 800}, {"name": "PCOS Lifestyle & Endocrine Mapping", "fee": 1000}]'::json, 'verified', 4.94, 195, 'c-motherhood-care-dehradun', 'Motherhood Care & Fertility Clinic', 'motherhood-care-dehradun', '31, Dalanwala, Circular Road, Dehradun', 'Mon - Sat: 10:30 AM - 02:30 PM, 05:00 PM - 07:30 PM', '+919876543210', '2026-09-21 18:54:23.286649') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d8888888-8888-8888-8888-888888888888', 'dr-amit-bansal', 'Dr.', 'Dr. Amit Bansal', 'UKMC-6543-2013', 'Uttarakhand Medical Council', 'MBBS, MS (ENT / Otorhinolaryngology)', 'ENT Specialist', '["Endoscopic Sinus Surgery", "Micro Ear Surgery", "Vertigo Tinnitus"]'::json, 11, '["English", "Hindi"]'::json, 'ENT & Head-Neck surgeon with advanced expertise in endoscopic sinus surgery, micro-ear surgery for eardrum perforation, vertigo balance therapy, and pediatric adenoid removal.', 500.0, 200.0, 7, '[{"name": "ENT Consultation & Otoscopy", "fee": 500}, {"name": "Diagnostic Nasal Endoscopy", "fee": 1200}]'::json, 'verified', 4.85, 115, 'c-bansal-ent-centre', 'Bansal ENT & Micro-Ear Care Centre', 'bansal-ent-centre', '18, Subhash Road, Near Clock Tower, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286650') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d9999999-9999-9999-9999-999999999999', 'dr-sunita-bhatt', 'Dr.', 'Dr. Sunita Bhatt', 'UKMC-4921-2010', 'Uttarakhand Medical Council', 'MBBS, MS (Ophthalmology), FICO (UK)', 'Ophthalmologist', '["Blade-Free Cataract", "Lasik Eye Surgery", "Glaucoma Screening"]'::json, 13, '["English", "Hindi"]'::json, 'Consultant Eye Surgeon and Lasik specialist recognized for micro-incision blade-free cataract surgeries, diabetic retinopathy screening, and pediatric vision correction.', 500.0, 250.0, 14, '[{"name": "Comprehensive Eye Exam & Slit Lamp", "fee": 500}, {"name": "Dilated Retina Examination", "fee": 800}]'::json, 'verified', 4.88, 134, 'c-drishti-netralaya', 'Drishti Netralaya & Laser Eye Centre', 'drishti-netralaya', '74, Haridwar Road, Near Rispana Bridge, Dehradun', 'Mon - Sat: 09:30 AM - 01:30 PM, 04:30 PM - 07:30 PM', '+919876543210', '2026-09-21 18:54:23.286651') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'dr-tarun-deep-singh', 'Dr.', 'Dr. Tarun Deep Singh', 'UKMC-3210-2012', 'Uttarakhand Medical Council', 'MBBS, MD (Medicine), DM (Neurology)', 'Neurologist', '["Refractory Migraines", "Stroke Prevention", "Epilepsy"]'::json, 12, '["English", "Hindi", "Punjabi"]'::json, 'Senior Neurologist managing refractory migraines, stroke rehabilitation, epilepsy management, Parkinson''s tremors, peripheral neuropathies, and nerve conduction studies.', 900.0, 500.0, 14, '[{"name": "Neurology Consultation", "fee": 900}, {"name": "Digital EEG (Brain Wave Mapping)", "fee": 2000}]'::json, 'verified', 4.91, 148, 'c-doon-brain-nerve', 'Doon Brain, Spine & Nerve Clinic', 'doon-brain-nerve', '52, GMS Road, Near Kamla Palace, Dehradun', 'Mon - Sat: 11:00 AM - 03:00 PM, 05:00 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286652') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dr-kavita-negi', 'Dr.', 'Dr. Kavita Negi', 'UKMC-7193-2014', 'Uttarakhand Medical Council', 'MBBS, MD (Medicine), DM (Gastroenterology)', 'Gastroenterologist', '["Endoscopy", "Fatty Liver", "IBS & GERD"]'::json, 10, '["English", "Hindi", "Garhwali"]'::json, 'Gastroenterologist and Hepatologist specialized in therapeutic endoscopy, fatty liver disease reversal, chronic acidity (GERD), irritable bowel syndrome (IBS), and gallstones.', 700.0, 350.0, 7, '[{"name": "Gastro Consultation", "fee": 700}, {"name": "Diagnostic Video Endoscopy", "fee": 2800}]'::json, 'verified', 4.87, 122, 'c-gastro-care-dehradun', 'Gastro Care & Liver Health Clinic', 'gastro-care-dehradun', '19, Patel Nagar, Saharanpur Road, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286653') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('dccccccc-cccc-cccc-cccc-cccccccccccc', 'dr-harish-pant', 'Dr.', 'Dr. Harish Pant', 'UKMC-5829-2009', 'Uttarakhand Medical Council', 'MBBS, MD (Pulmonary Medicine), FCCP (USA)', 'Pulmonologist', '["Asthma Care", "Allergy Testing", "COPD Sleep Apnea"]'::json, 14, '["English", "Hindi", "Kumaoni"]'::json, 'Leading chest physician and allergy specialist. Expertise in bronchial asthma, allergic bronchitis, chronic COPD, post-COVID lung recovery, and sleep apnea snoring diagnostics.', 600.0, 300.0, 10, '[{"name": "Chest & Pulmonary Consultation", "fee": 600}, {"name": "Spirometry / PFT Lung Capacity", "fee": 900}]'::json, 'verified', 4.89, 153, 'c-doon-respiratory-clinic', 'Doon Respiratory & Allergy Clinic', 'doon-respiratory-clinic', '65, Chakrata Road, Opp. Kishan Nagar Chowk, Dehradun', 'Mon - Sat: 09:30 AM - 01:30 PM, 05:00 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286654') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dr-ritu-dangwal', 'Dr.', 'Dr. Ritu Dangwal', 'UKMC-8104-2015', 'Uttarakhand Medical Council', 'MBBS, MD (Psychiatry)', 'Psychiatrist', '["Anxiety & Panic", "Depression Therapy", "Sleep Disorders"]'::json, 9, '["English", "Hindi"]'::json, 'Compassionate psychiatrist and mental health advocate specialized in clinical depression, panic and generalized anxiety disorders, adult ADHD, insomnia, and stress burnout.', 800.0, 500.0, 14, '[{"name": "Psychiatric Clinical Consultation (45m)", "fee": 800}, {"name": "Cognitive Stress Counseling", "fee": 1000}]'::json, 'verified', 4.93, 89, 'c-mind-space-clinic', 'Mind Space Mental Wellness Clinic', 'mind-space-clinic', '21, Rajpur Road, Near Orient Cinema, Dehradun', 'Mon - Sat: 11:00 AM - 03:00 PM, 05:00 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286654') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('deeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dr-sanjay-chamoli', 'Dr.', 'Dr. Sanjay Chamoli', 'UKMC-4512-2007', 'Uttarakhand Medical Council', 'MBBS, MS (Surgery), MCh (Urology)', 'Urologist', '["Laser Kidney Stone", "Prostate TURP", "UTI Clinic"]'::json, 15, '["English", "Hindi", "Garhwali"]'::json, 'Senior Urologist and Andrologist with extensive experience in laser kidney stone removal (RIRS/PCNL), enlarged prostate treatment (TURP/HOLEP), and urinary tract infections.', 750.0, 400.0, 10, '[{"name": "Urology Consultation", "fee": 750}, {"name": "Uroflowmetry Test", "fee": 800}]'::json, 'verified', 4.9, 176, 'c-doon-uro-stone', 'Doon Uro-Stone & Laser Centre', 'doon-uro-stone', '38, Saharanpur Road, Near Prince Chowk, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:30 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286655') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('dfffffff-ffff-ffff-ffff-ffffffffffff', 'dr-vivek-thapliyal', 'Dr.', 'Dr. Vivek Thapliyal', 'UKMC-3901-2011', 'Uttarakhand Medical Council', 'MBBS, MD (Medicine), DM (Medical Oncology), ESMO Certified', 'Oncologist', '["Chemotherapy", "Targeted Immunotherapy", "Cancer Screening"]'::json, 13, '["English", "Hindi"]'::json, 'Senior Medical Oncologist specializing in targeted chemotherapy protocols, immunotherapy, comprehensive cancer screenings, second opinions, and palliative symptom care.', 1000.0, 500.0, 14, '[{"name": "Oncology Expert Consultation", "fee": 1000}, {"name": "Chemotherapy Daycare Protocol", "fee": 3500}]'::json, 'verified', 4.95, 110, 'c-doon-cancer-care', 'Doon Comprehensive Cancer Care Clinic', 'doon-cancer-care', '102, Haridwar Road, Near Kargi Chowk, Dehradun', 'Mon - Sat: 11:30 AM - 03:30 PM, 05:30 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286656') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d0000000-0000-0000-0000-000000000001', 'vaidya-rameshwar-prasad', 'Vaidya', 'Vaidya Rameshwar Prasad', 'UBC-2109-2004', 'Uttarakhand Ayurvedic Council', 'BAMS, MD (Ayurveda Panchakarma)', 'Ayurvedic Physician', '["Nadi Pariksha", "Panchakarma Detox", "Joint Disorders"]'::json, 20, '["English", "Hindi", "Sanskrit"]'::json, 'Traditional Ayurvedic Practitioner and Nadi Pariksha diagnostician. Offers classical Panchakarma detox, chronic joint pain therapies, and gut balancing herbal formulations.', 400.0, 200.0, 14, '[{"name": "Ayurvedic Nadi Pariksha Consultation", "fee": 400}, {"name": "Shirodhara Relaxation Therapy", "fee": 1800}]'::json, 'verified', 4.91, 165, 'c-ayurveda-panchakarma-kendra', 'AyurVeda Health & Panchakarma Kendra', 'ayurveda-panchakarma-kendra', '15, Circular Road, Dalanwala, Dehradun', 'Mon - Sat: 08:30 AM - 01:00 PM, 04:30 PM - 07:30 PM', '+919876543210', '2026-09-21 18:54:23.286657') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d0000000-0000-0000-0000-000000000002', 'dr-shalini-verma', 'Dr.', 'Dr. Shalini Verma', 'UHC-3419-2012', 'Uttarakhand Homeopathic Council', 'BHMS, MD (Homeopathy)', 'Homeopath', '["Allergic Rhinitis", "Pediatric Immunity", "Chronic Skin"]'::json, 12, '["English", "Hindi"]'::json, 'Classical Homeopathic Consultant known for gentle, constitutional cures for recurrent allergic rhinitis, childhood recurrent colds, eczema, migraine, and hormonal imbalances.', 350.0, 200.0, 14, '[{"name": "Homeopathic Case Taking & Consultation", "fee": 350}, {"name": "2-Week Medication Pack", "fee": 300}]'::json, 'verified', 4.82, 94, 'c-care-homeopathy-clinic', 'Care Classical Homeopathy Clinic', 'care-homeopathy-clinic', '28, Vasant Vihar, Main Market, Dehradun', 'Mon - Sat: 10:00 AM - 01:30 PM, 05:00 PM - 08:00 PM', '+919876543210', '2026-09-21 18:54:23.286658') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d0000000-0000-0000-0000-000000000003', 'dr-rohan-uniyal', 'Dr.', 'Dr. Rohan Uniyal (PT)', 'UPC-5612-2016', 'Uttarakhand Physiotherapy Council', 'BPT, MPT (Sports Rehab & Musculoskeletal Orthopedics)', 'Physiotherapist', '["Post-Surgical Rehab", "Dry Needling", "Spine Posture"]'::json, 8, '["English", "Hindi", "Garhwali"]'::json, 'Lead Sports Physiotherapist specializing in post-operative knee and hip rehabilitation, dry needling, cervical spondylosis posture correction, and athletic mobility recovery.', 400.0, 350.0, 7, '[{"name": "Physiotherapy Assessment & Consultation", "fee": 400}, {"name": "Electrotherapy + Ultrasound Session", "fee": 500}]'::json, 'verified', 4.94, 145, 'c-active-life-physio', 'Active Life Physio & Sports Rehab', 'active-life-physio', '50, EC Road, Near Dwarika Store, Dehradun', 'Mon - Sat: 08:30 AM - 12:30 PM, 04:30 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286659') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d0000000-0000-0000-0000-000000000004', 'dr-rohit-sureka', 'Dr.', 'Dr Rohit Sureka', 'UKMC-9142-2010', 'Uttarakhand Medical Council', 'MBBS, DNB (General Medicine), DNB (Gastroenterology)', 'Gastroenterology/Gi Medicine Specialist', '["Endoscopy", "Colonoscopy", "Fatty Liver", "IBS"]'::json, 15, '["English", "Hindi"]'::json, 'Senior Consultant Gastroenterologist with over 15 years of clinical expertise in acid peptic disorders, fatty liver, IBS, endoscopy, colonoscopy, and therapeutic digestive care.', 999.0, 500.0, 7, '[{"name": "Gastroenterology Consultation", "fee": 999}, {"name": "Diagnostic Video Endoscopy", "fee": 2500}, {"name": "Colonoscopy Screening", "fee": 4000}]'::json, 'verified', 4.95, 184, 'c-docsphere-gastro-dehradun', 'DocSphere Direct - Gastro Care', 'docsphere-gastro-dehradun', '14, Rajpur Road, Near Ashley Hall, Dehradun', 'Mon - Sat: 09:30 AM - 01:30 PM, 05:00 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286660') ON CONFLICT DO NOTHING;
INSERT INTO doctors (id, slug, title, full_name, medical_council_reg_number, medical_council_state, qualification_summary, specialization, sub_specializations, years_of_experience, languages_spoken, bio, consultation_fee, followup_fee, followup_validity_days, services_offered, verification_status, rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address, opd_timings, phone, created_at) VALUES ('d0000000-0000-0000-0000-000000000005', 'dr-harish-k-c', 'Dr.', 'Dr Harish K C', 'UKMC-7819-2009', 'Uttarakhand Medical Council', 'MBBS, MD (General Medicine), DM (Gastroenterology)', 'Gastroenterology/Gi Medicine Specialist', '["GERD", "Liver Care", "Ulcer Protocol"]'::json, 15, '["English", "Hindi", "Kannada"]'::json, 'Renowned digestive medicine and liver care specialist providing evidence-based management of acid reflux, GERD, pancreatitis, and chronic hepatitis.', 1000.0, 500.0, 7, '[{"name": "Digestive & Gastro OPD", "fee": 1000}, {"name": "Liver Ultrasound Evaluation", "fee": 1800}]'::json, 'verified', 4.88, 125, 'c-docsphere-survey-chowk', 'DocSphere Clinic, Survey Chowk', 'docsphere-survey-chowk', '42, EC Road, Survey Chowk, Dehradun', 'Mon - Sat: 10:00 AM - 02:00 PM, 05:30 PM - 08:30 PM', '+919876543210', '2026-09-21 18:54:23.286661') ON CONFLICT DO NOTHING;

-- Seeding clinics (21 rows)
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('clinic-derma-care-01', 'derma-care-dehradun', 'Derma Care Skin & Laser Centre', '+919876543210', '14, Rajpur Road, Near Ashley Hall', 'Dehradun', 'Uttarakhand', '248001', '["Air Conditioned", "Laser Suite", "Digital Pharmacy", "Wheelchair Friendly", "Parking"]'::json, '{"weekdays": "10:00 AM - 08:30 PM", "sunday": "Closed"}'::json, 'active', '2026-09-17 05:01:58.845667') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('clinic-smile-craft-02', 'smile-craft-dental', 'Smile Craft Multi-Speciality Dental', '+919876543211', '42, EC Road, Near Survey Chowk', 'Dehradun', 'Uttarakhand', '248001', '["Digital RVG X-Ray", "Sterilization Autoclave", "Patient Lounge", "WiFi"]'::json, '{"weekdays": "10:00 AM - 08:00 PM", "sunday": "10:00 AM - 01:00 PM"}'::json, 'active', '2026-09-17 05:01:58.845673') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('4ac15e0b-c18f-4434-8fd4-999c3e4e95dc', 'skin-aesthetic-centre', 'Skin & Aesthetic Centre', '+919876543299', 'Rajpur Road', 'Dehradun', 'Uttarakhand', '248001', '["AC", "Wheelchair Accessible", "WiFi"]'::json, '{"morning": "10:00 AM - 02:00 PM", "evening": "05:00 PM - 08:30 PM"}'::json, 'active', '2026-09-17 15:04:23.450690') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dron-child-clinic', 'Dron Child & Newborn Health Centre', '+919876543212', '88, Chakrata Road, Near Ballupur Chowk', 'Dehradun', 'Uttarakhand', '248001', '["Vaccine Cold Chain", "Nebulization Station", "Child Play Area", "Full AC"]'::json, '{"Monday - Saturday": "09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM", "Sunday": "10:00 AM - 01:00 PM"}'::json, 'active', '2026-09-21 18:54:23.283427') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-doon-family-health', 'doon-family-health', 'Doon Family Health & Diabetes Care', '+919876543210', '12, Saharanpur Road, Near Patel Chowk, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 09:00 AM - 01:30 PM, 05:00 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283431') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-himalayan-heart-clinic', 'himalayan-heart-clinic', 'Himalayan Heart & Vascular Clinic', '+919876543210', '56, Rajpur Road, Opp. Hotel Madhuban, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 11:00 AM - 03:00 PM, 05:30 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283433') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-doon-ortho-spine', 'doon-ortho-spine', 'Doon Ortho & Joint Spine Clinic', '+919876543210', '24, Ballupur Chowk, Chakrata Road, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283434') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-motherhood-care-dehradun', 'motherhood-care-dehradun', 'Motherhood Care & Fertility Clinic', '+919876543210', '31, Dalanwala, Circular Road, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:30 AM - 02:30 PM, 05:00 PM - 07:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283435') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-bansal-ent-centre', 'bansal-ent-centre', 'Bansal ENT & Micro-Ear Care Centre', '+919876543210', '18, Subhash Road, Near Clock Tower, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283436') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-drishti-netralaya', 'drishti-netralaya', 'Drishti Netralaya & Laser Eye Centre', '+919876543210', '74, Haridwar Road, Near Rispana Bridge, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 09:30 AM - 01:30 PM, 04:30 PM - 07:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283437') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-doon-brain-nerve', 'doon-brain-nerve', 'Doon Brain, Spine & Nerve Clinic', '+919876543210', '52, GMS Road, Near Kamla Palace, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 11:00 AM - 03:00 PM, 05:00 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283438') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-gastro-care-dehradun', 'gastro-care-dehradun', 'Gastro Care & Liver Health Clinic', '+919876543210', '19, Patel Nagar, Saharanpur Road, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283438') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-doon-respiratory-clinic', 'doon-respiratory-clinic', 'Doon Respiratory & Allergy Clinic', '+919876543210', '65, Chakrata Road, Opp. Kishan Nagar Chowk, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 09:30 AM - 01:30 PM, 05:00 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283439') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-mind-space-clinic', 'mind-space-clinic', 'Mind Space Mental Wellness Clinic', '+919876543210', '21, Rajpur Road, Near Orient Cinema, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 11:00 AM - 03:00 PM, 05:00 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283440') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-doon-uro-stone', 'doon-uro-stone', 'Doon Uro-Stone & Laser Centre', '+919876543210', '38, Saharanpur Road, Near Prince Chowk, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:00 AM - 02:00 PM, 05:30 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283441') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-doon-cancer-care', 'doon-cancer-care', 'Doon Comprehensive Cancer Care Clinic', '+919876543210', '102, Haridwar Road, Near Kargi Chowk, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 11:30 AM - 03:30 PM, 05:30 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283442') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-ayurveda-panchakarma-kendra', 'ayurveda-panchakarma-kendra', 'AyurVeda Health & Panchakarma Kendra', '+919876543210', '15, Circular Road, Dalanwala, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 08:30 AM - 01:00 PM, 04:30 PM - 07:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283443') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-care-homeopathy-clinic', 'care-homeopathy-clinic', 'Care Classical Homeopathy Clinic', '+919876543210', '28, Vasant Vihar, Main Market, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:00 AM - 01:30 PM, 05:00 PM - 08:00 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283444') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-active-life-physio', 'active-life-physio', 'Active Life Physio & Sports Rehab', '+919876543210', '50, EC Road, Near Dwarika Store, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 08:30 AM - 12:30 PM, 04:30 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283445') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-docsphere-gastro-dehradun', 'docsphere-gastro-dehradun', 'DocSphere Direct - Gastro Care', '+919876543210', '14, Rajpur Road, Near Ashley Hall, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 09:30 AM - 01:30 PM, 05:00 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283446') ON CONFLICT DO NOTHING;
INSERT INTO clinics (id, slug, name, phone, address_line, city, state, postal_code, facilities, opening_hours, status, created_at) VALUES ('c-docsphere-survey-chowk', 'docsphere-survey-chowk', 'DocSphere Clinic, Survey Chowk', '+919876543210', '42, EC Road, Survey Chowk, Dehradun', 'Dehradun', 'Uttarakhand', '248001', '["Full AC", "Digital Records", "Wheelchair Accessible", "UPI Soundbox"]'::json, '{"Monday - Saturday": "Mon - Sat: 10:00 AM - 02:00 PM, 05:30 PM - 08:30 PM", "Sunday": "Closed"}'::json, 'active', '2026-09-21 18:54:23.283447') ON CONFLICT DO NOTHING;

-- Seeding appointments (3 rows)
INSERT INTO appointments (id, appointment_number, doctor_slug, doctor_name, clinic_name, patient_name, patient_phone, appointment_date, time_slot, token_number, status, fee_amount, payment_status, payment_mode, symptoms_description, created_at) VALUES ('46770101-6ca6-4306-996f-99e85d68ea99', 'APT-DERMA-101', 'dr-rahul-sharma', 'Dr. Rahul Sharma', 'Derma Care Skin & Laser Centre', 'Amit Rawat', '+919123456780', '2026-09-17', '10:15 AM - 10:30 AM', 1, 'completed', 600.0, 'paid', 'upi', 'Severe acne flareup on face and neck', '2026-09-17 05:01:58.842513') ON CONFLICT DO NOTHING;
INSERT INTO appointments (id, appointment_number, doctor_slug, doctor_name, clinic_name, patient_name, patient_phone, appointment_date, time_slot, token_number, status, fee_amount, payment_status, payment_mode, symptoms_description, created_at) VALUES ('51064fb5-56d8-42ef-ad0c-b028f97248eb', 'APT-DERMA-102', 'dr-rahul-sharma', 'Dr. Rahul Sharma', 'Derma Care Skin & Laser Centre', 'Priya Singh', '+919123456781', '2026-09-17', '10:30 AM - 10:45 AM', 2, 'in_consultation', 600.0, 'paid', 'cash', 'Facial rash and pigmentation', '2026-09-17 05:01:58.842522') ON CONFLICT DO NOTHING;
INSERT INTO appointments (id, appointment_number, doctor_slug, doctor_name, clinic_name, patient_name, patient_phone, appointment_date, time_slot, token_number, status, fee_amount, payment_status, payment_mode, symptoms_description, created_at) VALUES ('8f2ee12a-b4b4-4c57-af2a-073c61be2c43', 'APT-DERMA-103', 'dr-rahul-sharma', 'Dr. Rahul Sharma', 'Derma Care Skin & Laser Centre', 'Rohit Pant', '+919123456782', '2026-09-17', '10:45 AM - 11:00 AM', 3, 'in_consultation', 600.0, 'pending', 'upi', 'Eczema patches on hands', '2026-09-17 05:01:58.842526') ON CONFLICT DO NOTHING;

-- Seeding prescriptions (1 rows)
INSERT INTO prescriptions (id, prescription_number, appointment_number, doctor_name, doctor_reg_number, clinic_name, clinic_address, patient_name, patient_phone, patient_age, patient_gender, vitals, symptoms, provisional_diagnosis, items, instructions, followup_date, digital_signature_hash, qr_verification_code, created_at) VALUES ('62120a3c-9da1-4992-b797-116e260da5cd', 'RX-2026-09-0014', 'APT-DERMA-101', 'Dr. Rahul Sharma', 'UKMC-8942-2012', 'Derma Care Skin & Laser Centre', '14, Rajpur Road, Dehradun', 'Amit Rawat', '+919123456780', 26, 'Male', '{"bp": "118/78", "pulse": 74, "temp": 98.4, "weight": 64}'::json, '["Cystic acne", "Facial erythema"]'::json, 'Moderate to Severe Acne Vulgaris (Grade III)', '[{"medicine_name": "Tab Doxy-100", "generic_name": "DOXYCYCLINE HYCLATE", "dosage_form": "Capsule", "strength": "100 mg", "dosage_frequency": "1-0-0", "timing_relation": "After Food", "duration_days": 14, "special_instructions": "Take with a full glass of water"}, {"medicine_name": "Epiduo Gel", "generic_name": "ADAPALENE + BENZOYL PEROXIDE", "dosage_form": "Ointment", "strength": "0.1% / 2.5%", "dosage_frequency": "0-0-1", "timing_relation": "At Bedtime", "duration_days": 30, "special_instructions": "Apply pea-sized amount to affected areas only"}]'::json, 'Wash face twice daily with gentle foam cleanser. Do not pick acne lesions.', '2026-09-30', 'a7f3b89091c5e4d28471b3e8c991a03f441582e79601d3cb4198fa0174e50212', 'VERIFY-DERMA-991204', '2026-09-17 05:01:58.851344') ON CONFLICT DO NOTHING;

-- Seeding patient_documents (2 rows)
INSERT INTO patient_documents (id, patient_phone, patient_name, document_type, title, file_name, file_size_kb, doctor_notes, uploaded_at) VALUES ('105ce6c7-ff23-406c-aaa5-5f6aa183f08a', '+919123456780', 'Amit Rawat', 'Blood Test', 'Complete Blood Count (CBC) & Liver Panel', 'cbc_lft_amit_rawat_sep2026.pdf', 420, 'Normal liver enzymes. Suitable for systemic antibiotics.', '2026-09-17 05:01:58.850036') ON CONFLICT DO NOTHING;
INSERT INTO patient_documents (id, patient_phone, patient_name, document_type, title, file_name, file_size_kb, doctor_notes, uploaded_at) VALUES ('0818dda0-69da-4508-b4a9-36d5672e4256', '+919123456780', 'Amit Rawat', 'Radiology X-Ray', 'Chest PA View (Pre-Procedure Clearance)', 'chest_xray_pa_2026.pdf', 860, 'Bilateral clear lung fields.', '2026-09-17 05:01:58.850041') ON CONFLICT DO NOTHING;

-- Seeding reviews (3 rows)
INSERT INTO reviews (id, doctor_slug, patient_name, rating, waiting_time_rating, bedside_manner_rating, comment, doctor_reply, is_verified_visit, created_at) VALUES ('08ecad6a-4589-4d0f-bf99-7ea4dcb79872', 'dr-rahul-sharma', 'Sanjay Negi', 5.0, 4.8, 5.0, 'Dr. Rahul Sharma is very patient and explained the acne treatment options thoroughly. The live token system at the clinic saved me over an hour of waiting!', 'Thank you Sanjay! Glad the token queue made your clinic visit seamless.', TRUE, '2026-09-17 05:01:58.852662') ON CONFLICT DO NOTHING;
INSERT INTO reviews (id, doctor_slug, patient_name, rating, waiting_time_rating, bedside_manner_rating, comment, doctor_reply, is_verified_visit, created_at) VALUES ('30156288-b6a5-4976-a2da-d2a3e4004633', 'dr-rahul-sharma', 'Kavita Uniyal', 5.0, 5.0, 5.0, 'Best dermatologist in Dehradun. The digital prescription with QR code and instant WhatsApp summary is so professional.', 'Much appreciated Kavita. Wishing you great health!', TRUE, '2026-09-17 05:01:58.852666') ON CONFLICT DO NOTHING;
INSERT INTO reviews (id, doctor_slug, patient_name, rating, waiting_time_rating, bedside_manner_rating, comment, doctor_reply, is_verified_visit, created_at) VALUES ('6c847d08-1e40-4ee3-a302-97ef9793bc5b', 'dr-aditi-joshi', 'Manish Bhatt', 5.0, 4.9, 5.0, 'Completely painless single-sitting root canal! Dr. Aditi Joshi made sure I felt zero discomfort. Highly recommended dental clinic in Dehradun.', 'Thank you Manish for your kind words! Keep up the good dental hygiene.', TRUE, '2026-09-17 05:01:58.852667') ON CONFLICT DO NOTHING;

-- Seeding expenses (6 rows)
INSERT INTO expenses (id, clinic_slug, category, title, amount, payment_mode, recorded_by, date, created_at) VALUES ('exp-doc-11fa29', 'derma-care-dehradun', 'Staff Salary', 'Visiting Consultant Payout: Dr. Neha Kapoor (14 OPDs @ 80.0%)', 7840.0, 'upi', 'Front Desk Reception', '2026-09-19', '2026-09-19 16:14:50.027047') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, clinic_slug, category, title, amount, payment_mode, recorded_by, date, created_at) VALUES ('exp-doc-1e5f02', 'derma-care-dehradun', 'Staff Salary', 'Visiting Consultant Payout: Dr. Neha Kapoor (14 OPDs @ 80.0%)', 7840.0, 'upi', 'Front Desk Reception', '2026-09-19', '2026-09-19 16:15:02.318291') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, clinic_slug, category, title, amount, payment_mode, recorded_by, date, created_at) VALUES ('exp-doc-06c7e4', 'derma-care-dehradun', 'Staff Salary', 'Visiting Consultant Payout: Dr. Neha Kapoor (14 OPDs @ 80.0%)', 7840.0, 'upi', 'Front Desk Reception', '2026-09-19', '2026-09-19 17:44:13.527900') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, clinic_slug, category, title, amount, payment_mode, recorded_by, date, created_at) VALUES ('exp-doc-6e8051', 'derma-care-dehradun', 'Staff Salary', 'Visiting Consultant Payout: Dr. Vikram Negi (6 OPDs @ 75.0%)', 5400.0, 'upi', 'Front Desk Reception', '2026-09-19', '2026-09-19 17:44:48.877550') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, clinic_slug, category, title, amount, payment_mode, recorded_by, date, created_at) VALUES ('exp-c27701', 'derma-care-dehradun', 'Electricity', 'Monthly UPCL commercial electric bill (AC & Lasers)', 4200.0, 'upi', 'Front Desk Reception', '2026-09-19', '2026-09-19 17:45:49.723296') ON CONFLICT DO NOTHING;
INSERT INTO expenses (id, clinic_slug, category, title, amount, payment_mode, recorded_by, date, created_at) VALUES ('exp-b2eeff', 'derma-care-dehradun', 'Consumables', 'OPD disposable consumables restock', 1450.0, 'upi', 'Front Desk Reception', '2026-09-19', '2026-09-19 17:46:07.420894') ON CONFLICT DO NOTHING;

-- Seeding clinic_wards (4 rows)
INSERT INTO clinic_wards (id, clinic_slug, name, ward_type, daily_rate, hourly_rate, created_at) VALUES ('ward-daycare-01', 'derma-care-dehradun', 'Daycare Laser & Recovery Suite', 'daycare_recovery', 1400.0, 150.0, '2026-09-17 08:21:08.205922') ON CONFLICT DO NOTHING;
INSERT INTO clinic_wards (id, clinic_slug, name, ward_type, daily_rate, hourly_rate, created_at) VALUES ('ward-deluxe-02', 'derma-care-dehradun', 'Private Deluxe Suite', 'private_deluxe', 3200.0, 300.0, '2026-09-17 08:21:08.205927') ON CONFLICT DO NOTHING;
INSERT INTO clinic_wards (id, clinic_slug, name, ward_type, daily_rate, hourly_rate, created_at) VALUES ('ward-general-03', 'derma-care-dehradun', 'General Observation Ward', 'general', 900.0, 100.0, '2026-09-17 08:21:08.205929') ON CONFLICT DO NOTHING;
INSERT INTO clinic_wards (id, clinic_slug, name, ward_type, daily_rate, hourly_rate, created_at) VALUES ('ward-icu-04', 'derma-care-dehradun', 'Emergency HDU & Monitoring', 'icu', 4500.0, 450.0, '2026-09-17 08:21:08.205931') ON CONFLICT DO NOTHING;

-- Seeding clinic_beds (10 rows)
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('df5e66c9-6079-4f46-ab8a-fd64692f1c5d', 'derma-care-dehradun', 'ward-daycare-01', 'DC-01', 'occupied', 'Amit Rawat', '+919123456780', 'Dr. Rahul Sharma', 'Post-PRP laser therapy recovery. Monitor vitals for 4 hours.', '2026-09-17 05:06:08.199928', '2026-09-17 08:21:08.204065') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('a6a619f0-855f-4224-869a-e77e9b4edaba', 'derma-care-dehradun', 'ward-daycare-01', 'DC-02', 'vacant', NULL, NULL, NULL, NULL, NULL, '2026-09-17 08:21:08.204070') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('d4b98954-d6da-4cc5-ab2f-5e592a1f9906', 'derma-care-dehradun', 'ward-daycare-01', 'DC-03', 'vacant', NULL, NULL, NULL, NULL, NULL, '2026-09-17 08:21:08.204072') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('2d0d20be-7b51-4f78-a7ee-0cf314683385', 'derma-care-dehradun', 'ward-deluxe-02', 'DLX-101', 'occupied', 'Sunita Joshi', '+919876543299', 'Dr. Rahul Sharma', 'Admitted for severe drug-induced urticarial rash and systemic observation.', '2026-09-16 14:21:08.199928', '2026-09-17 08:21:08.204073') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('0722520b-4555-488c-8a01-ebf7ebf45b37', 'derma-care-dehradun', 'ward-deluxe-02', 'DLX-102', 'discharge_pending', 'Pooja Rawat', '+919876511223', 'Dr. Aditi Joshi', 'Post-op jaw observation. Final discharge summary pending doctor sign-off.', '2026-09-16 06:21:08.199928', '2026-09-17 08:21:08.204074') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('2332fb18-31d3-4e4d-99bd-77296fb49cf2', 'derma-care-dehradun', 'ward-general-03', 'GEN-01', 'occupied', 'Rajesh Mehra', '+919876522334', 'Dr. Vikram Sethi', 'Pediatric hydration monitoring and nebulization support.', '2026-09-17 01:36:08.199928', '2026-09-17 08:21:08.204075') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('eb153099-dd10-426a-8ffb-ca5992fe3c4c', 'derma-care-dehradun', 'ward-general-03', 'GEN-02', 'vacant', NULL, NULL, NULL, NULL, NULL, '2026-09-17 08:21:08.204076') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('d5e2e5dd-0360-4dac-ab73-fb94a4ba2f6e', 'derma-care-dehradun', 'ward-general-03', 'GEN-03', 'maintenance', NULL, NULL, NULL, NULL, NULL, '2026-09-17 08:21:08.204077') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('86f84b1c-eee9-4a90-a311-441f2e0e10f4', 'derma-care-dehradun', 'ward-icu-04', 'HDU-01', 'vacant', NULL, NULL, NULL, NULL, NULL, '2026-09-17 08:21:08.204078') ON CONFLICT DO NOTHING;
INSERT INTO clinic_beds (id, clinic_slug, ward_id, bed_number, status, current_patient_name, current_patient_phone, assigned_doctor_name, admission_notes, admission_timestamp, created_at) VALUES ('839b377a-f6ca-4f12-ae04-bb9a2b16550b', 'derma-care-dehradun', 'ward-icu-04', 'HDU-02', 'occupied', 'Mohan Lal Verma', '+919876533445', 'Dr. Rahul Sharma', 'Severe anaphylactoid reaction. Continuous oxygen and SpO2 monitoring.', '2026-09-16 20:51:08.199928', '2026-09-17 08:21:08.204079') ON CONFLICT DO NOTHING;

-- Seeding pharmacy_items (8 rows)
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('39c55326-73b5-49c5-9a15-ae462d6e80ac', 'derma-care-dehradun', 'Doxy-100 L', 'DOXYCYCLINE 100MG + LACTOBACILLUS', 'Capsule', '100mg', 'DX-2026-91', '2026-10-29', 28, 15, 28.0, 65.0, 58.0, 12.0, '3004', 'Dr. Reddy''s Lab', 'Rack A-01', '2026-09-17 11:33:13.170793') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('2f432ab5-8a6c-4151-a446-80b414c6a0c3', 'derma-care-dehradun', 'Retino-A 0.05%', 'TRETINOIN 0.05% W/W GEL', 'Ointment', '0.05%', 'TR-2027-14', '2027-10-02', 4, 10, 110.0, 220.0, 195.0, 12.0, '3004', 'Janssen India', 'Rack A-04', '2026-09-17 11:33:13.170797') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('8486aed3-7140-4408-b07b-eb4be47484c9', 'derma-care-dehradun', 'Cetzine 10', 'CETIRIZINE HYDROCHLORIDE 10MG', 'Tablet', '100mg', 'CT-2027-55', '2027-12-11', 120, 20, 12.0, 35.0, 30.0, 12.0, '3004', 'GSK Pharma', 'Rack B-02', '2026-09-17 11:33:13.170799') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('ac369c14-e180-4a6b-8a09-5d04f8881014', 'derma-care-dehradun', 'Augmentin 625 Duo', 'AMOXICILLIN 500MG + CLAVULANIC ACID 125MG', 'Tablet', '625mg', 'AMX-2026-44', '2027-04-15', 45, 15, 95.0, 210.0, 185.0, 12.0, '3004', 'GlaxoSmithKline', 'Rack B-05', '2026-09-17 11:33:13.170800') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('c87dfa2f-a793-4998-8a58-f60af999b798', 'derma-care-dehradun', 'Dolo 650', 'PARACETAMOL 650MG', 'Tablet', '650mg', 'PCM-2027-80', '2028-05-29', 240, 30, 14.5, 32.0, 29.0, 12.0, '3004', 'Micro Labs', 'Rack C-01', '2026-09-17 11:33:13.170801') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('f8fe2ef0-0393-4818-91bc-bdce4adc954c', 'derma-care-dehradun', 'Momate Cream', 'MOMETASONE FUROATE 0.1% W/W', 'Ointment', '0.1%', 'MF-2026-19', '2026-10-05', 6, 10, 85.0, 175.0, 150.0, 12.0, '3004', 'Glenmark', 'Rack A-08', '2026-09-17 11:33:13.170802') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('a0a032cf-4466-4462-921c-13fb8ab070fc', 'derma-care-dehradun', 'Azithral 500', 'AZITHROMYCIN 500MG', 'Tablet', '500mg', 'AZ-2027-02', '2027-08-03', 40, 10, 62.0, 135.0, 120.0, 12.0, '3004', 'Alembic Pharma', 'Rack B-03', '2026-09-17 11:33:13.170803') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_items (id, clinic_slug, brand_name, generic_name, dosage_form, strength, batch_number, expiry_date, current_stock, reorder_level, purchase_price, mrp, selling_price, gst_rate, hsn_code, manufacturer, rack_location, created_at) VALUES ('cfd56c07-eed1-4dc2-a100-e4e48fe17849', 'derma-care-dehradun', 'Clindac A Gel', 'CLINDAMYCIN PHOSPHATE 1% GEL', 'Ointment', '1%', 'CL-2026-33', '2027-05-15', 5, 12, 90.0, 185.0, 165.0, 12.0, '3004', 'Alkem Labs', 'Rack A-05', '2026-09-17 11:33:13.170804') ON CONFLICT DO NOTHING;

-- Seeding pharmacy_dispenses (2 rows)
INSERT INTO pharmacy_dispenses (id, bill_number, clinic_slug, prescription_number, patient_name, patient_phone, doctor_name, items, subtotal, discount, gst_amount, total_amount, payment_mode, status, created_at) VALUES ('e2447cae-872d-4de2-a25a-06a00bc61f84', 'BILL-PHARM-2026-001', 'derma-care-dehradun', 'RX-2026-09-0014', 'Amit Rawat', '+919123456780', 'Dr. Rahul Sharma', '[{"item_id": "seed-1", "brand_name": "Doxy-100 L", "batch_number": "DX-2026-91", "dosage_form": "Capsule", "quantity": 1, "unit_price": 58.0, "total": 58.0, "gst_rate": 12.0}, {"item_id": "seed-2", "brand_name": "Retino-A 0.05%", "batch_number": "TR-2027-14", "dosage_form": "Ointment", "quantity": 1, "unit_price": 195.0, "total": 195.0, "gst_rate": 12.0}]'::json, 253.0, 13.0, 28.8, 268.8, 'upi', 'dispensed', '2026-09-17 09:33:13.164689') ON CONFLICT DO NOTHING;
INSERT INTO pharmacy_dispenses (id, bill_number, clinic_slug, prescription_number, patient_name, patient_phone, doctor_name, items, subtotal, discount, gst_amount, total_amount, payment_mode, status, created_at) VALUES ('089b75a3-066e-45b1-82c9-bd714c2918bd', 'BILL-PHARM-2026-0002', 'derma-care-dehradun', 'RX-TEST-01', 'Rohit Pant', '+919123456782', 'Dr. Rahul Sharma', '[{"item_id": null, "brand_name": "Doxy-100 L", "batch_number": "DX-2026-91", "dosage_form": "Capsule", "quantity": 2, "unit_price": 58.0, "total": 116.0, "gst_rate": 12.0}]'::json, 116.0, 0.0, 13.92, 129.92, 'upi', 'dispensed', '2026-09-17 11:36:12.093931') ON CONFLICT DO NOTHING;

-- Seeding marketplace_inquiries (1 rows)
INSERT INTO marketplace_inquiries (id, inquiry_token, inquiry_type, patient_name, patient_phone, locality, target_entity_name, target_entity_phone, items, prescription_preview, notes, channel, status, created_at) VALUES ('9fe6fe30-fa66-48ae-846a-b3a9e05ae75c', 'COS-MED-7595', 'medicine', 'Manas Uniyal', '+919876543210', 'Rajpur Road', 'Doon Medicos', '+919876543211', '[{"name": "Augmentin 625 Duo", "qty": 1, "form": "Tablet", "price": 185.0}]'::json, NULL, 'Test delivery', 'whatsapp', 'dispatched', '2026-09-19 08:06:45.633398') ON CONFLICT DO NOTHING;

-- Seeding partner_applications (1 rows)
INSERT INTO partner_applications (id, partner_type, business_name, contact_person, phone, whatsapp, locality, address, license_number, home_service, is_verified, status, created_at) VALUES ('e9914e22-2d1f-4a45-a1fb-6da471af986e', 'pharmacy', 'Doon Medicos & Surgical', 'Gaurav Aggarwal', '+919876543211', '919876543211', 'Rajpur Road', '16 Rajpur Road, Dehradun', 'UK-DDN-20/21-8941', TRUE, TRUE, 'verified', '2026-09-19 08:06:58.744055') ON CONFLICT DO NOTHING;

-- Seeding clinic_eod_closings (1 rows)
INSERT INTO clinic_eod_closings (id, clinic_slug, closing_date, closed_at, closed_by, counted_cash, expected_cash, cash_discrepancy, gross_collections, soundbox_upi, total_consultations, closing_notes, audit_hash, status) VALUES ('eod-20260920-757a', 'derma-care-dehradun', '2026-09-20', '2026-09-19 18:38:40.482847', 'Pooja Verma', 600.0, 600.0, 0.0, 1200.0, 600.0, 3, 'Day closed with real DB tokens.', 'EOD-SEAL-9A98C79E152C', 'locked') ON CONFLICT DO NOTHING;

-- Verification summary
SELECT 'Doctors Count' AS metric, COUNT(*) FROM doctors
UNION ALL
SELECT 'Clinics Count' AS metric, COUNT(*) FROM clinics;