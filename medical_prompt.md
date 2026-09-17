MASTER PROMPT — BUILD A HEALTHCARE DIGITAL PLATFORM FOR INDEPENDENT DOCTORS, CLINICS & PHARMACIES

You are acting as a senior product architect, UX designer, AI engineer, full-stack engineer, database architect, security engineer, and startup CTO.

I want you to help me design and build a production-oriented healthcare technology platform for India.

IMPORTANT:
This is NOT just a doctor directory.
This is NOT a clone of Practo.
This is NOT merely a clinic website generator.

The vision is to create a digital infrastructure platform for independent doctors, small clinics, pharmacies, diagnostic centres, and patients.

The core idea is:

"Give every independent healthcare provider a professional digital presence, digital clinic infrastructure, patient management tools, discovery, appointments, and AI-powered automation."

The platform should eventually connect:

DOCTORS
      ↓
CLINICS
      ↓
PATIENTS
      ↓
PHARMACIES
      ↓
DIAGNOSTIC CENTRES

The first version should focus on Doctors + Clinics + Patients, while the architecture should allow Pharmacies and Diagnostic Centres to be added later.

==================================================
1. PRODUCT VISION
==================================================

Build a healthcare SaaS + marketplace platform where:

1. Doctors can create professional digital profiles.
2. Clinics can create digital clinic pages.
3. Doctors can manage appointments.
4. Patients can discover doctors and clinics.
5. Patients can book appointments.
6. Doctors can manage patients.
7. Clinics can manage staff.
8. Doctors can maintain consultation records.
9. Doctors can create prescriptions.
10. Patients can access their healthcare documents.
11. The platform integrates maps/location discovery.
12. AI dramatically simplifies onboarding and administrative work.
13. Doctors receive a professional online presence without needing technical knowledge.
14. Clinics can eventually operate much of their daily workflow through the platform.

The platform should be designed primarily for independent doctors and small/medium-sized clinics that may not have sophisticated digital systems.

==================================================
2. PRODUCT POSITIONING
==================================================

Do NOT position the product as:

"Another Practo"

Instead position it as:

"Digital infrastructure for independent healthcare providers."

A doctor should be able to join the platform and go from:

"I don't have a proper digital presence"

to:

"My clinic is online, patients can find me, patients can book appointments, my staff can manage schedules, and I can manage my patients digitally."

The platform should eventually provide:

DIGITAL PRESENCE
+
DISCOVERY
+
APPOINTMENTS
+
PATIENT MANAGEMENT
+
CLINIC MANAGEMENT
+
PAYMENTS
+
COMMUNICATION
+
AI AUTOMATION

==================================================
3. IMPORTANT HEALTHCARE SAFETY PRINCIPLE
==================================================

This platform handles sensitive healthcare information.

Design the architecture with privacy, security, consent, auditability and data minimization in mind.

AI must NOT independently diagnose patients or make autonomous medical decisions.

AI can assist with:

- administrative tasks
- appointment scheduling
- summarization
- information extraction
- drafting content
- patient communication
- clinic onboarding
- document organization
- generating non-clinical summaries
- generating draft notes for doctor review
- generating educational content

Clinical decisions must remain under qualified healthcare professionals.

Any AI-generated clinical content must clearly be treated as a draft/assistive output requiring professional review where appropriate.

Never present AI as a replacement for a doctor.

==================================================
4. USER TYPES
==================================================

Create a robust RBAC system.

Roles:

1. PATIENT
2. DOCTOR
3. CLINIC ADMIN
4. RECEPTIONIST / STAFF
5. PHARMACY
6. DIAGNOSTIC CENTRE
7. PLATFORM ADMIN
8. SUPER ADMIN

For MVP prioritize:

PATIENT
DOCTOR
CLINIC ADMIN
RECEPTIONIST
ADMIN

Design the architecture so Pharmacy and Diagnostic Centre roles can be enabled later.

==================================================
5. DOCTOR ONBOARDING
==================================================

This is one of the most important parts of the product.

The onboarding experience should be extremely easy.

A doctor should NOT have to fill dozens of boring forms manually.

Create an AI-assisted onboarding workflow.

Example:

AI:

"Welcome Doctor. Tell me about yourself and your clinic."

Doctor:

"I am Dr. Rahul Sharma, dermatologist. I have been practicing for 12 years. My clinic is located in Rajpur Road, Dehradun. I treat acne, eczema, psoriasis and hair loss. My consultation fee is ₹500."

The system should extract structured information:

Name:
Dr. Rahul Sharma

Specialization:
Dermatology

Experience:
12 years

Location:
Rajpur Road, Dehradun

Services:
Acne
Eczema
Psoriasis
Hair Loss

Consultation Fee:
₹500

Then ask only for missing information.

Collect:

PERSONAL INFORMATION
- Name
- Profile photo
- Gender
- Languages
- Contact information

PROFESSIONAL INFORMATION
- Medical degree
- Qualifications
- Specialization
- Registration details
- Experience
- Areas of expertise
- Certifications
- Languages spoken

CLINIC INFORMATION
- Clinic name
- Address
- Google Maps location
- Clinic photos
- Working hours
- Consultation fee
- Services
- Facilities
- Emergency information

VERIFICATION
- Professional registration details
- Required documents
- Identity verification where applicable

The onboarding system must support:

manual forms
+
AI conversational onboarding
+
document extraction
+
review
+
verification
+
publish

Never automatically publish sensitive information without provider confirmation.

==================================================
6. AUTOMATIC DOCTOR PROFILE GENERATION
==================================================

After onboarding, AI should generate:

- Professional biography
- Clinic description
- Services
- Areas of expertise
- Frequently asked questions
- Search-friendly profile content
- Appointment information
- Short profile
- Long profile
- Website content
- Social media description

Doctor must be able to edit everything.

Provide:

Generate
Regenerate
Edit
Save
Approve
Publish

buttons.

AI should never fabricate qualifications, experience, registrations, awards, or medical claims.

==================================================
7. DIGITAL DOCTOR PROFILE
==================================================

Every doctor gets a public profile.

Example:

Dr. Rahul Sharma
Dermatologist

⭐ 4.8
12 years experience

📍 Rajpur Road, Dehradun

₹500 Consultation

Languages:
Hindi
English

Services:

Acne Treatment
Eczema Treatment
Hair Loss
Psoriasis

Available:

Today
Tomorrow

BUTTONS:

Book Appointment
Call Clinic
Get Directions
Ask Clinic
View Services

Sections:

About
Experience
Qualifications
Services
Clinic
Availability
Reviews
FAQs
Patient Resources

The profile should be professional, modern and trustworthy.

==================================================
8. DIGITAL CLINIC PAGE
==================================================

Each clinic should have its own public page.

Include:

Clinic name
Logo
Photos
Address
Google Maps
Opening hours
Doctors
Services
Facilities
Consultation fees
Reviews
Contact
Appointment booking

Allow clinics to eventually have custom domains.

Example:

clinicname.platform.com

Later:

www.clinicname.com

==================================================
9. GOOGLE MAPS / LOCATION DISCOVERY
==================================================

Integrate Google Maps.

Use location services for:

- finding nearby doctors
- finding clinics
- finding pharmacies
- finding diagnostic centres
- getting directions
- displaying clinic locations

Create a map-based discovery interface.

Example:

"Doctors near me"

Filters:

Specialization
Distance
Availability
Consultation fee
Rating
Gender
Language
Clinic
Online consultation

Map + list view.

Do not expose exact private residential addresses.

Only display verified/public healthcare facility locations.

Architect the map integration behind a service abstraction so the provider can be changed later if required.

==================================================
10. PATIENT REGISTRATION
==================================================

Patient onboarding should be simple.

Collect:

Name
Date of birth
Gender
Phone
Email
Location
Emergency contact (optional)

Avoid collecting unnecessary sensitive information.

Patient dashboard:

Upcoming appointments
Past appointments
Doctors
Prescriptions
Medical documents
Reports
Invoices
Messages
Follow-ups
Saved doctors
Family members

==================================================
11. PATIENT DISCOVERY
==================================================

Create a marketplace/discovery experience.

Homepage:

Search:

"Find doctors, clinics and healthcare services"

Examples:

Dermatologist near me
Dentist in Dehradun
Pediatrician near me
ENT specialist
Physiotherapist

Filters:

Specialization
Location
Distance
Availability
Price
Rating
Language
Gender
Online consultation
Clinic

Results should show:

Doctor
Specialization
Experience
Rating
Location
Consultation fee
Availability
Book button

==================================================
12. APPOINTMENT SYSTEM
==================================================

Build a complete appointment system.

Doctor controls:

Working hours
Breaks
Days off
Appointment duration
Consultation fee
Maximum daily appointments
Online/offline consultation
Buffer time

Patient:

Select doctor
Select clinic
Select date
Select time
Confirm booking

Statuses:

Requested
Confirmed
Rescheduled
Cancelled
Completed
No-show

Support:

Calendar
Notifications
Reminders
Rescheduling
Cancellation
Waiting list

==================================================
13. DOCTOR DASHBOARD
==================================================

Create a professional dashboard.

Dashboard should display:

Today's appointments
Upcoming appointments
Patients
Revenue
Pending appointments
Follow-ups
Notifications

Navigation:

Dashboard
Appointments
Patients
Calendar
Prescriptions
Medical Records
Clinic
Staff
Messages
Reviews
Analytics
Payments
AI Assistant
Settings

==================================================
14. PATIENT MANAGEMENT
==================================================

Doctors should have a patient management system.

Patient profile:

Name
Age
Contact
Appointments
Consultation history
Notes
Prescriptions
Reports
Uploaded documents
Follow-ups

Allow doctors to add consultation notes.

Create:

Previous Visits
Current Consultation
Follow-up

Use strict permissions.

Doctors should only access records they are authorized to access.

==================================================
15. PRESCRIPTION SYSTEM
==================================================

Create a digital prescription interface.

Doctor can enter:

Medicine
Dosage
Frequency
Duration
Instructions

Generate a structured prescription.

Allow:

Preview
Edit
Approve
Sign/authorize according to the implemented workflow
Share with patient
Download PDF

Do not let AI autonomously prescribe medication.

AI can assist with formatting or extracting information, but the doctor must explicitly approve the prescription.

==================================================
16. MEDICAL DOCUMENTS
==================================================

Patients can upload:

Lab reports
Scans
Prescriptions
Medical documents

Doctors can view authorized documents.

Use:

Secure storage
Access controls
Signed URLs
Encryption where applicable
Audit logging

AI document processing can:

extract text
summarize
classify
organize

But never make unsupported medical conclusions.

==================================================
17. CLINIC MANAGEMENT
==================================================

Clinic administrators should be able to manage:

Doctors
Receptionists
Staff
Appointments
Patients
Services
Working hours
Clinic profile
Billing
Reports

Multi-doctor clinics must be supported.

One clinic:

Doctor A
Doctor B
Doctor C
Receptionist
Admin

==================================================
18. RECEPTIONIST DASHBOARD
==================================================

Receptionist should have:

Today's appointments
Patient search
Book appointment
Reschedule
Cancel
Check-in
Mark completed
Contact patient
View basic appointment information

Receptionists should NOT automatically have access to all sensitive medical records.

Use granular permissions.

==================================================
19. AI RECEPTIONIST
==================================================

Build an AI assistant for clinics.

Example:

Patient:

"I want to book an appointment with Dr Sharma tomorrow."

AI:

"Dr Sharma has appointments at 10:30 AM, 2 PM and 5:30 PM. Which one would you like?"

Patient:

"5:30."

AI:

"Your appointment is booked for tomorrow at 5:30 PM."

The AI should be capable of:

appointment booking
appointment rescheduling
clinic FAQs
doctor availability
clinic timings
location information
basic administrative questions
reminders

The AI must escalate medical questions to qualified professionals.

==================================================
20. AI DOCTOR ASSISTANT
==================================================

Create an AI assistant inside the doctor dashboard.

It can help with:

- summarizing patient-provided documents
- summarizing previous consultations
- drafting consultation notes
- organizing patient information
- drafting patient instructions
- creating follow-up reminders
- creating educational content

Every AI-generated output should be editable and clearly identified as AI-generated.

Doctor approval is required before sending or saving consequential clinical content.

==================================================
21. AI CLINIC CONTENT ASSISTANT
==================================================

Doctor can ask:

"Create a description for my clinic."

"Create an FAQ."

"Create a page explaining our dermatology services."

"Create a short Instagram description."

"Create patient education content about acne."

The AI should generate drafts based only on verified provider information and safe general medical information.

==================================================
22. PHARMACY MODULE
==================================================

Design but initially keep this module modular.

Pharmacies should eventually be able to create:

Pharmacy profile
Location
Opening hours
Contact
Services
Inventory
Medicine availability
Orders
Prescription uploads
Delivery options

Patients can:

Find nearby pharmacies
Upload prescriptions
Request medicines
See pharmacy information

Do not implement unrestricted prescription-drug sales workflows without considering applicable laws and regulations.

==================================================
23. DIAGNOSTIC CENTRE MODULE
==================================================

Future module.

Diagnostic centres can have:

Profile
Location
Tests
Prices
Availability
Appointments
Reports
Patient access

Patients can search:

Blood test
MRI
CT scan
X-ray
Ultrasound
Pathology

==================================================
24. REVIEWS
==================================================

Patients can review doctors and clinics after completed appointments.

Include:

Rating
Written review

Prevent fake/spam reviews.

Only verified interactions should be eligible for reviews.

Doctors can respond.

Admin can moderate according to transparent rules.

==================================================
25. PAYMENTS
==================================================

Architect payments using a payment abstraction.

Support:

Razorpay
Stripe

India-first implementation should support Razorpay.

Payment types:

Appointment payment
Online consultation
Clinic subscription
Premium provider subscription

Never store raw card information.

Payment verification must happen server-side.

==================================================
26. SUBSCRIPTION SYSTEM
==================================================

Create provider plans.

Example:

FREE

Doctor profile
Clinic listing
Basic appointment link

PRO

₹499/month

Appointments
Patient management
Analytics
Digital clinic
AI features

CLINIC

₹1,999/month

Multiple doctors
Staff
Advanced analytics
Clinic management
Automation

ENTERPRISE

Custom pricing

Do not hardcode pricing throughout the application.

Use configurable plans.

==================================================
27. PLATFORM REVENUE
==================================================

Support multiple monetization mechanisms.

1. Provider subscriptions
2. Clinic subscriptions
3. Appointment fees/commissions
4. Premium profiles
5. AI usage
6. Transaction fees
7. Future pharmacy transaction revenue
8. Future diagnostic marketplace revenue

Create an admin-configurable commission system.

==================================================
28. ADMIN DASHBOARD
==================================================

Create a powerful admin dashboard.

Admin can manage:

Users
Doctors
Clinics
Patients
Pharmacies
Diagnostic centres
Courses/services
Appointments
Payments
Subscriptions
Refunds
Reviews
Reports
Verification
AI usage
System settings

Analytics:

Total users
Active doctors
Active clinics
Appointments
Revenue
MRR
New registrations
Retention
AI usage
Provider conversion
Patient activity

==================================================
29. DOCTOR VERIFICATION
==================================================

Create a provider verification workflow.

Statuses:

Pending
Under Review
Verified
Rejected
Suspended

Admin can review submitted credentials.

Never display an unverified doctor as verified.

Clearly distinguish:

Verified professional
Unverified profile

The verification architecture should allow integration with appropriate official registries/APIs later.

==================================================
30. NOTIFICATION SYSTEM
==================================================

Support:

Email
SMS
WhatsApp
Push notifications

Notifications:

Appointment confirmation
Reminder
Cancellation
Reschedule
Prescription available
Follow-up
Payment
Subscription
Provider verification

Create a notification abstraction so providers can be changed later.

==================================================
31. DATABASE
==================================================

Use PostgreSQL.

Design normalized relational schemas for:

users
roles
permissions
doctor_profiles
patient_profiles
clinic_profiles
clinic_staff
provider_verifications
specializations
services
appointments
appointment_slots
patients
consultations
medical_records
prescriptions
prescription_items
documents
document_access
reviews
payments
orders
subscriptions
subscription_plans
notifications
messages
ai_conversations
ai_messages
ai_usage
audit_logs
locations

Future:

pharmacies
pharmacy_inventory
diagnostic_centres
diagnostic_tests
lab_reports

Use:

UUID primary keys
created_at
updated_at
soft deletion where appropriate
indexes
foreign keys
constraints

Design for scale.

==================================================
32. TECH STACK
==================================================

Preferred architecture:

Frontend:

Next.js
React
TypeScript
Tailwind CSS
shadcn/ui

Backend:

Python
FastAPI
Pydantic

Database:

PostgreSQL
SQLAlchemy
Alembic

Caching:

Redis

Background processing:

Celery / appropriate job queue

AI:

Provider abstraction supporting:

Gemini
OpenAI-compatible APIs
Local models where appropriate

Vector search:

pgvector

Storage:

S3-compatible object storage

Authentication:

Secure session/JWT architecture
Google OAuth
Email/password

Payments:

Razorpay abstraction
Stripe abstraction

Maps:

Google Maps Platform abstraction

Deployment:

Docker
Docker Compose

==================================================
33. APPLICATION ARCHITECTURE
==================================================

Use modular architecture.

Suggested structure:

frontend/
backend/
database/
ai/
workers/
infrastructure/
docs/
tests/

Frontend:

app/
components/
features/
lib/
hooks/

Backend:

api/
models/
schemas/
services/
repositories/
auth/
permissions/
ai/
payments/
notifications/
maps/
storage/

AI:

gateway/
agents/
prompts/
rag/
providers/
tools/

Do not tightly couple the application to a single AI provider.

==================================================
34. SECURITY
==================================================

Implement security from the beginning.

Requirements:

RBAC
Permission checks
Input validation
Rate limiting
Secure authentication
Password hashing
Session security
CSRF protection where applicable
XSS protection
SQL injection prevention
Secure file uploads
File type validation
File size limits
Signed URLs
Encryption in transit
Encryption at rest where supported
Audit logs
API authorization
Data access isolation

Never expose private patient data through public APIs.

==================================================
35. PRIVACY
==================================================

Build with privacy-first principles.

Users should understand:

What information is collected
Why it is collected
Who can access it
How it is used

Provide consent mechanisms where appropriate.

Create audit logs for sensitive access.

Support account/data deletion workflows where legally appropriate.

Do not use patient data for AI training by default.

Keep healthcare data logically separated from analytics where appropriate.

==================================================
36. SEARCH
==================================================

Implement powerful search.

Search doctors by:

Name
Specialization
Location
Services
Clinic
Language
Availability

Search clinics by:

Name
Location
Services

Future:

semantic search using embeddings.

Example:

"doctor for recurring skin problems near Rajpur Road"

should retrieve relevant providers.

==================================================
37. SEO
==================================================

Every public doctor and clinic profile should be SEO-friendly.

Generate:

Metadata
OpenGraph
Structured data
Doctor profile schema where appropriate
Clinic schema where appropriate
Location pages
Service pages

URLs should be clean.

Example:

/doctors/dermatologist/dehradun/dr-rahul-sharma

/clinics/dehradun/xyz-clinic

==================================================
38. UX/UI
==================================================

Design should feel:

Professional
Trustworthy
Modern
Minimal
Calm
Healthcare-oriented

Do NOT copy Practo's visual design.

Create an original design system.

Avoid excessive gradients, unnecessary animations and gimmicks.

Use clear typography.

Mobile-first.

Patients will primarily use mobile.

Doctors may use desktop/tablet.

Create separate UX patterns for:

Patient
Doctor
Clinic staff
Admin

==================================================
39. LANDING PAGE
==================================================

Homepage headline concept:

"Your Clinic. Online. Organized. Connected."

Supporting message:

"Everything independent doctors and clinics need to build their digital presence, manage patients, accept appointments and grow their practice."

Primary CTA:

"Join as a Doctor"

Secondary:

"Find a Doctor"

Other sections:

For Doctors
For Clinics
For Patients
How It Works
AI-powered features
Nearby healthcare
Pricing
Trust & Security
FAQ

==================================================
40. MVP
==================================================

DO NOT try to build every future feature immediately.

Build MVP first.

MVP must contain:

Authentication

Doctor onboarding

AI-assisted onboarding

Doctor profile

Clinic profile

Patient registration

Doctor discovery

Location/map integration

Search/filter

Appointment booking

Doctor dashboard

Patient dashboard

Receptionist dashboard

Basic patient management

Basic consultation records

Prescription generation

Notifications

Admin dashboard

Provider verification

Subscription foundation

Basic analytics

Security/RBAC

The architecture must be ready for:

Pharmacies
Diagnostic centres
AI receptionist
advanced AI
payments
marketplace
WhatsApp
mobile application

==================================================
41. MVP DEVELOPMENT ORDER
==================================================

PHASE 1:

Authentication
RBAC
Database
Doctor onboarding
Patient onboarding
Admin

PHASE 2:

Doctor profiles
Clinic profiles
Search
Location
Maps
Discovery

PHASE 3:

Appointments
Calendar
Notifications
Doctor dashboard
Patient dashboard

PHASE 4:

Patient management
Consultations
Prescriptions
Documents

PHASE 5:

Payments
Subscriptions
Revenue
Analytics

PHASE 6:

AI onboarding
AI profile generation
AI receptionist
AI assistant

PHASE 7:

Pharmacy
Diagnostics
Marketplace expansion

==================================================
42. AI ARCHITECTURE
==================================================

Create a centralized AI gateway.

Example:

AI Gateway
|
|-- Onboarding Agent
|-- Profile Generator
|-- Clinic Content Agent
|-- AI Receptionist
|-- Doctor Assistant
|-- Document Processor
|-- Search/RAG
|-- Recommendation Engine

Each agent should have:

Clear system prompt
Tool permissions
Input validation
Output schema
Usage limits
Logging
Error handling
Human escalation

Never give an AI agent unrestricted access to the database.

Use explicit tools.

Example:

book_appointment()
get_doctor_availability()
get_clinic_information()
create_followup()
search_provider()
send_notification()

AI agents should use tools rather than directly modifying database records.

==================================================
43. AI COST CONTROL
==================================================

Create:

AI usage tracking
Token tracking
Per-user limits
Per-provider limits
Model routing
Caching
Rate limiting

Admin should see:

AI requests
Token usage
Cost estimate
Most-used agents
Most-used providers

==================================================
44. ANALYTICS
==================================================

Doctor analytics:

Appointments
Patients
Revenue
New patients
Returning patients
Cancellation rate
Popular services

Clinic analytics:

Doctor performance
Appointments
Revenue
Patient growth
Staff activity

Platform analytics:

MAU
DAU
MRR
ARR
Doctors
Clinics
Patients
Appointments
Conversion
Retention
AI costs

==================================================
45. API DESIGN
==================================================

Use REST APIs.

Example:

/api/v1/auth
/api/v1/doctors
/api/v1/patients
/api/v1/clinics
/api/v1/appointments
/api/v1/prescriptions
/api/v1/documents
/api/v1/search
/api/v1/maps
/api/v1/payments
/api/v1/subscriptions
/api/v1/ai
/api/v1/admin

Use:

Pagination
Filtering
Sorting
Validation
Consistent error responses
Authentication
Authorization

Document APIs with OpenAPI.

==================================================
46. TESTING
==================================================

Create:

Unit tests
Integration tests
API tests
Authentication tests
RBAC tests
Appointment tests
Payment tests
AI tests
Security tests

Critical workflows must be tested.

Example:

Doctor signup
→ verification
→ profile creation
→ patient discovery
→ appointment
→ consultation
→ prescription
→ patient access

==================================================
47. SEED DATA
==================================================

Create development seed data.

Example:

20 doctors
5 clinics
100 patients
multiple specializations
appointments
reviews
services

Use fictional data only.

Never use real patients' medical information.

==================================================
48. ERROR HANDLING
==================================================

Never leave buttons non-functional.

Every important action must have:

Loading state
Success state
Error state
Empty state

Never use fake functionality.

If a backend service is unavailable, display a meaningful error.

==================================================
49. DEVELOPMENT PRINCIPLE
==================================================

This should be a REAL application architecture.

Do NOT create:

fake dashboards
fake AI responses
fake payment success
fake analytics
fake appointments

If something cannot be implemented fully in the current environment:

1. Build the correct interface.
2. Create a clean abstraction.
3. Create the backend contract.
4. Clearly mark the integration point.
5. Provide implementation instructions.

Do not pretend an integration works when it does not.

==================================================
50. STARTUP PRINCIPLE
==================================================

This product will initially target India.

Design for:

Indian Rupees
Indian phone numbers
Indian addresses
Indian cities
Indian healthcare providers
Indian payment systems
Indian languages eventually

However, avoid hardcoding India into every component.

The architecture should support international expansion later.

==================================================
51. FUTURE FEATURES
==================================================

Design extension points for:

Online consultations
Video consultations
WhatsApp AI receptionist
Voice AI receptionist
Pharmacy ordering
Diagnostic booking
Insurance integration
ABDM integration
ABHA-related workflows where legally and technically appropriate
Health record interoperability
Mobile apps
Provider CRM
Marketing automation
Patient loyalty
Family health management
Multi-location clinics
Custom domains
White-label clinic software

Do not implement all of these in MVP.

==================================================
52. BRANDING
==================================================

The product needs an original brand identity.

Do NOT use:

Practo branding
KnowledgeGate branding
Apollo branding
Any competitor's logo
Any competitor's exact UI

The product should look like an independent modern healthcare technology company.

Use a clean professional visual identity.

==================================================
53. WHAT I WANT FROM YOU
==================================================

Do not immediately dump thousands of lines of code.

First act as my CTO.

Start by producing:

1. Product architecture
2. MVP feature map
3. User journeys
4. Database schema
5. API architecture
6. Frontend architecture
7. AI architecture
8. Security architecture
9. Folder structure
10. Development roadmap

Then begin implementation systematically.

For every major implementation step:

Explain:
- What we are building
- Why
- Files/components required
- Backend requirements
- Database changes
- API changes
- Frontend changes
- AI requirements
- Security considerations
- Testing requirements

Then implement it.

==================================================
54. CRITICAL PRODUCT RULE
==================================================

The most important user experience is:

DOCTOR:

Sign up
↓
AI-assisted onboarding
↓
Verification
↓
AI generates professional profile
↓
Doctor reviews
↓
Publish
↓
Clinic appears online
↓
Patients discover doctor
↓
Patient books appointment
↓
Clinic manages appointment
↓
Doctor consults patient
↓
Prescription/records generated
↓
Patient receives records
↓
Follow-up reminder
↓
Doctor retains patient

This complete workflow must feel seamless.

==================================================
55. FINAL PRODUCT VISION
==================================================

Build toward:

"Shopify + Google Business Profile + CRM + appointment system + patient management + AI assistant for independent healthcare providers."

The platform should become the digital operating layer for small and independent healthcare practices.

The core flywheel is:

MORE DOCTORS
↓
MORE HEALTHCARE INFORMATION
↓
MORE PATIENT DISCOVERY
↓
MORE APPOINTMENTS
↓
MORE PATIENTS
↓
MORE VALUE TO DOCTORS
↓
MORE DOCTORS

Build the foundation carefully.

Prioritize:

Trust
Security
Simplicity
Provider onboarding
Patient experience
Reliable appointments
Scalability
AI-assisted workflows

Start by acting as CTO and provide the complete technical/product architecture for the MVP before writing implementation code.