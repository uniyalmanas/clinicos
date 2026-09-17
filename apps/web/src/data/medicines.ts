export interface MedicineItem {
  id: string;
  brand_name: string;
  generic_name: string;
  dosage_form: "Tablet" | "Capsule" | "Syrup" | "Cream" | "Drops" | "Gel" | "Lotion" | "Injection";
  strength: string;
  category: "Dermatology" | "Antibiotics" | "Analgesic / Anti-pyretic" | "Gastrointestinal" | "Dental" | "Pediatric" | "Cardio-Diabetic" | "Respiratory";
  common_instructions: string;
}

export const INDIAN_MEDICINES: MedicineItem[] = [
  // Dermatology
  {
    id: "med-001",
    brand_name: "Doxy-100",
    generic_name: "DOXYCYCLINE HYCLATE",
    dosage_form: "Capsule",
    strength: "100 mg",
    category: "Dermatology",
    common_instructions: "Take 1 capsule twice daily after meals with a full glass of water. Avoid lying down immediately."
  },
  {
    id: "med-002",
    brand_name: "Acretin 0.05%",
    generic_name: "TRETINOIN",
    dosage_form: "Cream",
    strength: "0.05% w/w",
    category: "Dermatology",
    common_instructions: "Apply a pea-sized amount at bedtime on clean, dry affected facial areas. Use sunscreen in morning."
  },
  {
    id: "med-003",
    brand_name: "Clindac-A",
    generic_name: "CLINDAMYCIN PHOSPHATE",
    dosage_form: "Gel",
    strength: "1% w/w",
    category: "Dermatology",
    common_instructions: "Apply thinly over active acne lesions in the morning after gentle face wash."
  },
  {
    id: "med-004",
    brand_name: "Cetzine 10",
    generic_name: "CETIRIZINE HYDROCHLORIDE",
    dosage_form: "Tablet",
    strength: "10 mg",
    category: "Dermatology",
    common_instructions: "Take 1 tablet at night after food for allergic itching and urticaria."
  },
  {
    id: "med-005",
    brand_name: "Lulican",
    generic_name: "LULICONAZOLE",
    dosage_form: "Cream",
    strength: "1% w/w",
    category: "Dermatology",
    common_instructions: "Apply once daily on fungal lesions extending 1 inch beyond margin for 2 weeks."
  },
  {
    id: "med-006",
    brand_name: "Tugain 5%",
    generic_name: "MINOXIDIL",
    dosage_form: "Lotion",
    strength: "5% w/v",
    category: "Dermatology",
    common_instructions: "Apply 1 ml twice daily directly to dry scalp in areas of hair loss."
  },
  {
    id: "med-007",
    brand_name: "Scaboma",
    generic_name: "PERMETHRIN",
    dosage_form: "Lotion",
    strength: "5% w/w",
    category: "Dermatology",
    common_instructions: "Apply neck-down over entire body. Wash off after 8 to 12 hours. Repeat after 7 days if required."
  },

  // Antibiotics & Anti-Infectives
  {
    id: "med-008",
    brand_name: "Augmentin 625 Duo",
    generic_name: "AMOXICILLIN + POTASSIUM CLAVULANATE",
    dosage_form: "Tablet",
    strength: "500 mg + 125 mg",
    category: "Antibiotics",
    common_instructions: "Take 1 tablet twice daily at the start of meals for 5 to 7 days."
  },
  {
    id: "med-009",
    brand_name: "Azithral 500",
    generic_name: "AZITHROMYCIN",
    dosage_form: "Tablet",
    strength: "500 mg",
    category: "Antibiotics",
    common_instructions: "Take 1 tablet once daily 1 hour before or 2 hours after meals for 3 consecutive days."
  },
  {
    id: "med-010",
    brand_name: "Taxim-O 200",
    generic_name: "CEFIXIME",
    dosage_form: "Tablet",
    strength: "200 mg",
    category: "Antibiotics",
    common_instructions: "Take 1 tablet twice daily after meals for 5 days."
  },
  {
    id: "med-011",
    brand_name: "Flagyl 400",
    generic_name: "METRONIDAZOLE",
    dosage_form: "Tablet",
    strength: "400 mg",
    category: "Antibiotics",
    common_instructions: "Take 1 tablet thrice daily after food. Strictly avoid alcohol during treatment."
  },

  // Analgesic / Anti-pyretic & Anti-inflammatory
  {
    id: "med-012",
    brand_name: "Dolo 650",
    generic_name: "PARACETAMOL",
    dosage_form: "Tablet",
    strength: "650 mg",
    category: "Analgesic / Anti-pyretic",
    common_instructions: "Take 1 tablet SOS (as needed) for fever or body ache. Maximum 3-4 doses per 24 hours."
  },
  {
    id: "med-013",
    brand_name: "Zerodol-SP",
    generic_name: "ACECLOFENAC + PARACETAMOL + SERRATIOPEPTIDASE",
    dosage_form: "Tablet",
    strength: "100 mg + 325 mg + 15 mg",
    category: "Analgesic / Anti-pyretic",
    common_instructions: "Take 1 tablet twice daily after meals for painful swelling and inflammation."
  },
  {
    id: "med-014",
    brand_name: "Ketorol-DT",
    generic_name: "KETOROLAC TROMETHAMINE",
    dosage_form: "Tablet",
    strength: "10 mg",
    category: "Dental",
    common_instructions: "Disperse 1 tablet in 1 tablespoon of water and swallow immediately for acute dental pain."
  },

  // Gastrointestinal
  {
    id: "med-015",
    brand_name: "Pan-40",
    generic_name: "PANTOPRAZOLE SODIUM",
    dosage_form: "Tablet",
    strength: "40 mg",
    category: "Gastrointestinal",
    common_instructions: "Take 1 tablet empty stomach in the morning 30 minutes before breakfast."
  },
  {
    id: "med-016",
    brand_name: "Omez-D",
    generic_name: "OMEPRAZOLE + DOMPERIDONE",
    dosage_form: "Capsule",
    strength: "20 mg + 10 mg",
    category: "Gastrointestinal",
    common_instructions: "Take 1 capsule empty stomach morning before breakfast for GERD and nausea."
  },
  {
    id: "med-017",
    brand_name: "Eldoper",
    generic_name: "LOPERAMIDE HYDROCHLORIDE",
    dosage_form: "Capsule",
    strength: "2 mg",
    category: "Gastrointestinal",
    common_instructions: "Take 2 capsules initially, then 1 after each loose stool. Max 8 capsules/day."
  },

  // Respiratory & Allergy
  {
    id: "med-018",
    brand_name: "Montair-LC",
    generic_name: "MONTELUKAST SODIUM + LEVOCETIRIZINE",
    dosage_form: "Tablet",
    strength: "10 mg + 5 mg",
    category: "Respiratory",
    common_instructions: "Take 1 tablet at bedtime for chronic allergic rhinitis, coughing, or asthma symptoms."
  },
  {
    id: "med-019",
    brand_name: "Ascoril-D Plus",
    generic_name: "DEXTROMETHORPHAN + PHENYLEPHRINE + CHLORPHENIRAMINE",
    dosage_form: "Syrup",
    strength: "10 mg + 5 mg + 2 mg per 5ml",
    category: "Respiratory",
    common_instructions: "Take 10 ml thrice daily after meals for dry cough and throat irritation."
  },

  // Dental Care
  {
    id: "med-020",
    brand_name: "Clohex Plus",
    generic_name: "CHLORHEXIDINE GLUCONATE",
    dosage_form: "Drops",
    strength: "0.2% w/v",
    category: "Dental",
    common_instructions: "Swish 10 ml undiluted in mouth for 60 seconds twice daily after brushing. Do not swallow."
  },

  // Cardio-Diabetic
  {
    id: "med-021",
    brand_name: "Glycomet-500 SR",
    generic_name: "METFORMIN HYDROCHLORIDE (SUSTAINED RELEASE)",
    dosage_form: "Tablet",
    strength: "500 mg",
    category: "Cardio-Diabetic",
    common_instructions: "Take 1 tablet daily with dinner. Do not crush or chew."
  },
  {
    id: "med-022",
    brand_name: "Telma-40",
    generic_name: "TELMISARTAN",
    dosage_form: "Tablet",
    strength: "40 mg",
    category: "Cardio-Diabetic",
    common_instructions: "Take 1 tablet once daily in the morning with water for essential hypertension."
  }
];

export interface LabTestItem {
  id: string;
  test_name: string;
  category: "Hematology" | "Biochemistry" | "Endocrine" | "Radiology" | "Microbiology";
  sample_type: string;
  turnaround_hours: number;
  fasting_required: boolean;
  mrp_inr: number;
}

export const COMMON_LAB_TESTS: LabTestItem[] = [
  { id: "lab-01", test_name: "Complete Blood Count (CBC + ESR)", category: "Hematology", sample_type: "Whole Blood (EDTA)", turnaround_hours: 6, fasting_required: false, mrp_inr: 350 },
  { id: "lab-02", test_name: "Liver Function Test (LFT with Bilirubin, SGOT, SGPT)", category: "Biochemistry", sample_type: "Serum", turnaround_hours: 8, fasting_required: true, mrp_inr: 650 },
  { id: "lab-03", test_name: "Kidney Function Test (KFT with Urea, Creatinine, Uric Acid)", category: "Biochemistry", sample_type: "Serum", turnaround_hours: 8, fasting_required: false, mrp_inr: 600 },
  { id: "lab-04", test_name: "HbA1c (Glycosylated Hemoglobin)", category: "Endocrine", sample_type: "Whole Blood", turnaround_hours: 6, fasting_required: false, mrp_inr: 500 },
  { id: "lab-05", test_name: "Fasting Blood Sugar (FBS) & PPBS", category: "Biochemistry", sample_type: "Plasma Fluoride", turnaround_hours: 4, fasting_required: true, mrp_inr: 150 },
  { id: "lab-06", test_name: "Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)", category: "Biochemistry", sample_type: "Serum", turnaround_hours: 8, fasting_required: true, mrp_inr: 550 },
  { id: "lab-07", test_name: "Thyroid Profile Total (T3, T4, TSH)", category: "Endocrine", sample_type: "Serum", turnaround_hours: 12, fasting_required: false, mrp_inr: 450 },
  { id: "lab-08", test_name: "Serum IgE (Total Allergy Evaluation)", category: "Biochemistry", sample_type: "Serum", turnaround_hours: 24, fasting_required: false, mrp_inr: 800 },
  { id: "lab-09", test_name: "Urine Routine & Microscopic Examination", category: "Microbiology", sample_type: "Midstream Urine", turnaround_hours: 4, fasting_required: false, mrp_inr: 200 },
  { id: "lab-10", test_name: "Digital X-Ray (Chest PA View)", category: "Radiology", sample_type: "Radiographic Scan", turnaround_hours: 2, fasting_required: false, mrp_inr: 400 }
];
