export interface ClinicalVisit {
  visit_id: string;
  visit_date: string;
  doctor_name: string;
  doctor_slug?: string;
  doctor_specialization: string;
  clinic_name: string;
  provisional_diagnosis: string;
  vitals: {
    bp: string;
    pulse: number;
    temp: number;
    weight: number;
    spo2: number;
  };
  symptoms: string;
  prescription_number: string;
  medications_summary: string[];
  lab_orders?: string[];
  followup_advice: string;
}

export interface PatientProfile {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  blood_group: string;
  chronic_allergies: string[];
  known_conditions: string[];
  emergency_contact: string;
  registered_at: string;
  total_visits: number;
  visits: ClinicalVisit[];
}

export const SEED_PATIENTS: PatientProfile[] = [
  {
    id: "pat-101",
    full_name: "Amit Rawat",
    phone: "+919123456780",
    age: 26,
    gender: "Male",
    blood_group: "B+",
    chronic_allergies: ["Sulpha drugs (causes skin rash)"],
    known_conditions: ["Acne-prone skin"],
    emergency_contact: "+919876500001 (Father)",
    registered_at: "2026-06-12",
    total_visits: 3,
    visits: [
      {
        visit_id: "vis-101-3",
        visit_date: "2026-09-16",
        doctor_name: "Dr. Rahul Sharma",
        doctor_slug: "dr-rahul-sharma",
        doctor_specialization: "Dermatologist",
        clinic_name: "Derma Care Skin & Laser Centre",
        provisional_diagnosis: "Moderate to Severe Acne Vulgaris (Grade III)",
        vitals: { bp: "118/78", pulse: 74, temp: 98.4, weight: 64, spo2: 99 },
        symptoms: "Inflamed facial papules and pustules on cheeks and chin for 2 weeks",
        prescription_number: "RX-2026-09-0014",
        medications_summary: ["CAP DOXYCYCLINE 100MG", "TRETINOIN 0.05% CREAM", "CLINDAMYCIN 1% GEL"],
        lab_orders: ["Complete Blood Count (CBC)", "Liver Function Test (LFT)"],
        followup_advice: "Follow up after 14 days. Avoid oily foods and dairy excess."
      },
      {
        visit_id: "vis-101-2",
        visit_date: "2026-07-28",
        doctor_name: "Dr. Rahul Sharma",
        doctor_slug: "dr-rahul-sharma",
        doctor_specialization: "Dermatologist",
        clinic_name: "Derma Care Skin & Laser Centre",
        provisional_diagnosis: "Tinea Cruris (Fungal Infection)",
        vitals: { bp: "120/80", pulse: 78, temp: 98.6, weight: 63, spo2: 98 },
        symptoms: "Itching and ring-shaped erythematous lesions in groin",
        prescription_number: "RX-2026-07-0089",
        medications_summary: ["LULICONAZOLE 1% CREAM", "CETIRIZINE 10MG"],
        followup_advice: "Resolved after 2 weeks of antifungal therapy."
      }
    ]
  },
  {
    id: "pat-102",
    full_name: "Priya Singh",
    phone: "+919123456781",
    age: 24,
    gender: "Female",
    blood_group: "O+",
    chronic_allergies: ["No known drug allergies"],
    known_conditions: ["Contact dermatitis"],
    emergency_contact: "+919876500002 (Mother)",
    registered_at: "2026-08-05",
    total_visits: 2,
    visits: [
      {
        visit_id: "vis-102-1",
        visit_date: "2026-09-17",
        doctor_name: "Dr. Rahul Sharma",
        doctor_slug: "dr-rahul-sharma",
        doctor_specialization: "Dermatologist",
        clinic_name: "Derma Care Skin & Laser Centre",
        provisional_diagnosis: "Allergic Contact Dermatitis (Cosmetic induced)",
        vitals: { bp: "116/74", pulse: 76, temp: 98.6, weight: 58, spo2: 99 },
        symptoms: "Itchy red rashes on forearms and neck for 3 days after applying new cosmetic cream",
        prescription_number: "RX-2026-09-0021",
        medications_summary: ["CETIRIZINE 10MG", "MOMETASONE 0.1% CREAM", "CALAMINE LOTION"],
        followup_advice: "Stop cosmetic cream immediately. Review if erythema persists after 5 days."
      }
    ]
  },
  {
    id: "pat-103",
    full_name: "Rohit Pant",
    phone: "+919123456782",
    age: 32,
    gender: "Male",
    blood_group: "A+",
    chronic_allergies: ["Penicillin (mild hives)"],
    known_conditions: ["Androgenetic Alopecia Grade III"],
    emergency_contact: "+919876500003 (Spouse)",
    registered_at: "2026-09-01",
    total_visits: 1,
    visits: [
      {
        visit_id: "vis-103-1",
        visit_date: "2026-09-15",
        doctor_name: "Dr. Rahul Sharma",
        doctor_slug: "dr-rahul-sharma",
        doctor_specialization: "Dermatologist",
        clinic_name: "Derma Care Skin & Laser Centre",
        provisional_diagnosis: "Androgenetic Alopecia & Seborrheic Dermatitis",
        vitals: { bp: "122/82", pulse: 72, temp: 98.4, weight: 71, spo2: 98 },
        symptoms: "Receding hairline and severe scalp flakes for 6 months",
        prescription_number: "RX-2026-09-0011",
        medications_summary: ["MINOXIDIL 5% LOTION", "KETOCONAZOLE 2% SHAMPOO", "BIOTIN 10MG"],
        lab_orders: ["Serum Ferritin", "Thyroid Profile Total (T3, T4, TSH)"],
        followup_advice: "Scheduled for PRP Hair session evaluation after 1 month."
      }
    ]
  },
  {
    id: "pat-104",
    full_name: "Kavita Joshi",
    phone: "+919876511111",
    age: 29,
    gender: "Female",
    blood_group: "AB+",
    chronic_allergies: ["None"],
    known_conditions: ["Dental pulpitis"],
    emergency_contact: "+919876500004 (Brother)",
    registered_at: "2026-09-10",
    total_visits: 2,
    visits: [
      {
        visit_id: "vis-104-1",
        visit_date: "2026-09-16",
        doctor_name: "Dr. Aditi Joshi",
        doctor_slug: "dr-aditi-joshi",
        doctor_specialization: "Dental Surgeon",
        clinic_name: "Smile Craft Multi-Speciality Dental",
        provisional_diagnosis: "Deep Dentinal Caries #36 with Irreversible Pulpitis",
        vitals: { bp: "114/76", pulse: 80, temp: 98.6, weight: 54, spo2: 99 },
        symptoms: "Severe nocturnal throbbing pain in lower left molar, sensitivity to cold fluids",
        prescription_number: "RX-2026-09-0018",
        medications_summary: ["AMOXICILLIN 500MG", "KETOROLAC-DT 10MG", "CHLORHEXIDINE 0.2% MOUTHWASH"],
        lab_orders: ["Digital X-Ray (IOPA #36)"],
        followup_advice: "Root Canal Treatment (RCT) scheduled for 18th September."
      }
    ]
  }
];
