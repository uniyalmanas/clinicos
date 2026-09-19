export interface DiagnosticLabTest {
  id: string;
  code: string;
  name: string;
  category: "Routine Blood" | "Diabetes & Metabolic" | "Heart & Lipid" | "Liver & Kidney" | "Vitamins & Hormones" | "Full Body Checkup";
  sample_type: string; // e.g. "Blood (Serum)", "Urine", "Plasma"
  fasting_required: boolean;
  fasting_instructions: string;
  turnaround_time: string; // e.g. "Same Day (4-6 Hours)"
  parameters_count: number;
  description: string;
  mrp: number;
  direct_price: number; // 0% commission direct price
  discount_percent: number;
  popular: boolean;
  sample_report_parameters: string[];
}

export interface DiagnosticLabCenter {
  id: string;
  slug: string;
  name: string;
  nabl_accredited: boolean;
  locality: string;
  address: string;
  phone: string;
  whatsapp: string;
  free_home_collection: boolean;
  home_collection_charge: number;
  report_turnaround: string;
  rating: number;
  total_reviews: number;
  is_verified_partner: boolean;
  timing: string;
}

export const DIAGNOSTIC_LAB_TESTS: DiagnosticLabTest[] = [
  {
    id: "test-001",
    code: "CBC-01",
    name: "Complete Blood Count (CBC) with ESR",
    category: "Routine Blood",
    sample_type: "Blood (EDTA Whole Blood)",
    fasting_required: false,
    fasting_instructions: "No fasting required. Random blood sample.",
    turnaround_time: "4 - 6 Hours (Same Day)",
    parameters_count: 24,
    description: "Evaluates overall health and detects a wide range of disorders including anemia, acute infections, platelet count, and leukemia.",
    mrp: 450,
    direct_price: 280,
    discount_percent: 38,
    popular: true,
    sample_report_parameters: ["Hemoglobin", "Total RBC", "WBC Count", "Platelet Count", "Neutrophils", "Lymphocytes", "ESR"]
  },
  {
    id: "test-002",
    code: "LFT-02",
    name: "Liver Function Test (LFT) Comprehensive",
    category: "Liver & Kidney",
    sample_type: "Blood (Serum)",
    fasting_required: true,
    fasting_instructions: "8-10 hours overnight fasting recommended.",
    turnaround_time: "6 Hours (Same Day)",
    parameters_count: 11,
    description: "Measures enzymes, proteins, and bilirubin levels to assess liver inflammation, jaundice, fatty liver, and drug toxicity.",
    mrp: 850,
    direct_price: 490,
    discount_percent: 42,
    popular: true,
    sample_report_parameters: ["Bilirubin Total/Direct", "SGOT (AST)", "SGPT (ALT)", "Alkaline Phosphatase", "Total Protein", "Albumin/Globulin Ratio"]
  },
  {
    id: "test-003",
    code: "KFT-03",
    name: "Kidney Function Test (KFT / RFT) with Electrolytes",
    category: "Liver & Kidney",
    sample_type: "Blood (Serum)",
    fasting_required: true,
    fasting_instructions: "8 hours fasting. Avoid heavy protein intake before test.",
    turnaround_time: "6 Hours (Same Day)",
    parameters_count: 9,
    description: "Screening of renal health measuring Urea, Serum Creatinine, Uric Acid, Calcium, and Sodium/Potassium electrolyte balance.",
    mrp: 900,
    direct_price: 520,
    discount_percent: 42,
    popular: true,
    sample_report_parameters: ["Serum Creatinine", "Blood Urea Nitrogen (BUN)", "Uric Acid", "Sodium", "Potassium", "Chloride"]
  },
  {
    id: "test-004",
    code: "LIPID-04",
    name: "Lipid Profile Comprehensive (Cholesterol & Triglycerides)",
    category: "Heart & Lipid",
    sample_type: "Blood (Serum)",
    fasting_required: true,
    fasting_instructions: "10-12 hours strict overnight fasting. Only water allowed.",
    turnaround_time: "6 - 8 Hours",
    parameters_count: 8,
    description: "Evaluates risk of coronary cardiovascular disease, arterial blockages, stroke, and dyslipidemia.",
    mrp: 800,
    direct_price: 450,
    discount_percent: 44,
    popular: true,
    sample_report_parameters: ["Total Cholesterol", "HDL (Good Cholesterol)", "LDL (Bad Cholesterol)", "Triglycerides", "VLDL", "Chol/HDL Ratio"]
  },
  {
    id: "test-005",
    code: "HBA1C-05",
    name: "HbA1c (Glycated Hemoglobin) + Avg Blood Glucose",
    category: "Diabetes & Metabolic",
    sample_type: "Blood (EDTA Whole Blood)",
    fasting_required: false,
    fasting_instructions: "No fasting needed. Reflects 3-month average blood sugar control.",
    turnaround_time: "4 - 6 Hours",
    parameters_count: 2,
    description: "Gold standard diagnostic marker for detecting Diabetes Mellitus and monitoring 90-day glycemic trend.",
    mrp: 600,
    direct_price: 350,
    discount_percent: 42,
    popular: true,
    sample_report_parameters: ["HbA1c (%)", "Estimated Average Glucose (eAG)"]
  },
  {
    id: "test-006",
    code: "THYROID-06",
    name: "Thyroid Profile Total (T3, T4, TSH)",
    category: "Vitamins & Hormones",
    sample_type: "Blood (Serum)",
    fasting_required: false,
    fasting_instructions: "Morning sample preferred before taking thyroid medication.",
    turnaround_time: "Same Day Evening",
    parameters_count: 3,
    description: "Checks thyroid gland metabolism for Hypothyroidism or Hyperthyroidism, fatigue, weight shifts, and mood changes.",
    mrp: 650,
    direct_price: 320,
    discount_percent: 51,
    popular: true,
    sample_report_parameters: ["Total Triiodothyronine (T3)", "Total Thyroxine (T4)", "Thyroid Stimulating Hormone (TSH)"]
  },
  {
    id: "test-007",
    code: "VIT-07",
    name: "Vitamin D3 (25-OH) & Vitamin B12 Combo",
    category: "Vitamins & Hormones",
    sample_type: "Blood (Serum)",
    fasting_required: false,
    fasting_instructions: "Non-fasting blood sample.",
    turnaround_time: "12 - 24 Hours",
    parameters_count: 2,
    description: "Evaluates bone density, chronic bone/back pain, muscle weakness, nerve tingling, memory, and general energy levels.",
    mrp: 2200,
    direct_price: 1150,
    discount_percent: 48,
    popular: true,
    sample_report_parameters: ["25-Hydroxy Vitamin D3", "Vitamin B12 Cyanocobalamin"]
  },
  {
    id: "test-008",
    code: "FULLBODY-08",
    name: "Full Body Health Checkup Platinum (85+ Parameters)",
    category: "Full Body Checkup",
    sample_type: "Blood & Urine",
    fasting_required: true,
    fasting_instructions: "10-12 hours overnight fasting mandatory.",
    turnaround_time: "Same Day Evening (Online Report)",
    parameters_count: 85,
    description: "Complete health wellness screen including CBC, LFT, KFT, Lipid Profile, Thyroid TSH, HbA1c, Vitamin D/B12, Urine Routine, Iron profile.",
    mrp: 4500,
    direct_price: 1899,
    discount_percent: 58,
    popular: true,
    sample_report_parameters: ["CBC (24)", "LFT (11)", "KFT (9)", "Lipid (8)", "Thyroid (3)", "HbA1c", "Vit D & B12", "Urine Routine (18)"]
  },
  {
    id: "test-009",
    code: "DENGUE-09",
    name: "Dengue NS1 Antigen + IgG/IgM + Platelets",
    category: "Routine Blood",
    sample_type: "Blood (Serum)",
    fasting_required: false,
    fasting_instructions: "No fasting needed. Immediate emergency reporting.",
    turnaround_time: "2 - 3 Hours (Stat)",
    parameters_count: 4,
    description: "Rapid differential detection of Dengue viral infection and real-time platelet count tracking during acute fever episodes.",
    mrp: 1200,
    direct_price: 750,
    discount_percent: 38,
    popular: true,
    sample_report_parameters: ["Dengue NS1 Antigen", "Dengue IgM", "Dengue IgG", "Platelet Count"]
  }
];

export const DEHRADUN_LABS: DiagnosticLabCenter[] = [
  {
    id: "lab-001",
    slug: "dr-lal-pathlabs-rajpur",
    name: "Dr. Lal PathLabs National Reference Partner",
    nabl_accredited: true,
    locality: "Rajpur Road",
    address: "28, Rajpur Road, Opp. St. Joseph's Academy, Dehradun",
    phone: "+919876543221",
    whatsapp: "919876543221",
    free_home_collection: true,
    home_collection_charge: 0,
    report_turnaround: "4 - 6 Hours (WhatsApp & Online)",
    rating: 4.92,
    total_reviews: 580,
    is_verified_partner: true,
    timing: "07:00 AM - 08:30 PM (Daily)"
  },
  {
    id: "lab-002",
    slug: "srl-agilus-chakrata-rd",
    name: "SRL Diagnostics / Agilus Diagnostics",
    nabl_accredited: true,
    locality: "Chakrata Road / Ballupur",
    address: "102, Chakrata Road, Near Kishan Nagar Chowk, Dehradun",
    phone: "+919876543222",
    whatsapp: "919876543222",
    free_home_collection: true,
    home_collection_charge: 0,
    report_turnaround: "6 Hours",
    rating: 4.88,
    total_reviews: 412,
    is_verified_partner: true,
    timing: "07:00 AM - 08:00 PM"
  },
  {
    id: "lab-003",
    slug: "doon-pathology-ec-road",
    name: "Doon Pathology & Molecular Diagnostics",
    nabl_accredited: true,
    locality: "EC Road / Survey Chowk",
    address: "35, EC Road, Opp. Dwarika Store, Dehradun",
    phone: "+919876543223",
    whatsapp: "919876543223",
    free_home_collection: true,
    home_collection_charge: 0,
    report_turnaround: "Same Day by 5 PM",
    rating: 4.85,
    total_reviews: 320,
    is_verified_partner: true,
    timing: "07:30 AM - 09:00 PM"
  },
  {
    id: "lab-004",
    slug: "max-lab-dehradun",
    name: "Max Lab Specialist Diagnostics",
    nabl_accredited: true,
    locality: "Mussoorie Diversion / Malsi",
    address: "Max Super Speciality Hospital Road, Malsi, Dehradun",
    phone: "+919876543224",
    whatsapp: "919876543224",
    free_home_collection: true,
    home_collection_charge: 0,
    report_turnaround: "4 - 8 Hours",
    rating: 4.95,
    total_reviews: 640,
    is_verified_partner: true,
    timing: "24x7 Emergency Services"
  }
];
