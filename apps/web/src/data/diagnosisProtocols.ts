export interface ProtocolMedication {
  medicine_name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  frequency: string;
  duration: string;
  special_instructions: string;
}

export interface DiagnosisProtocol {
  id: string;
  diagnosis_name: string;
  icd10_code: string;
  specialty: string;
  typical_complaints: string;
  recommended_lab_test_ids: string[]; // e.g. ["lab-01", "lab-05"]
  medications: ProtocolMedication[];
  clinical_advice: string;
  followup_days: number;
  alert_warnings?: string[];
}

export const CLINICAL_DIAGNOSIS_PROTOCOLS: DiagnosisProtocol[] = [
  {
    id: "diag-01",
    diagnosis_name: "Acute Gastroenteritis / Acute Diarrheal Illness",
    icd10_code: "A09.9",
    specialty: "General Medicine / Emergency",
    typical_complaints: "Frequent watery stools (5-6 episodes), nausea, abdominal cramps, mild fever for 1 day.",
    recommended_lab_test_ids: ["lab-01", "lab-03"], // CBC, KFT
    medications: [
      {
        medicine_name: "Oflox-OZ",
        generic_name: "OFLOXACIN + ORNIDAZOLE",
        dosage_form: "Tablet",
        strength: "200 mg + 500 mg",
        frequency: "1-0-1 (Twice Daily)",
        duration: "3 Days",
        special_instructions: "Take after meals. Drink plenty of water."
      },
      {
        medicine_name: "Redotil 100",
        generic_name: "RACECADOTRIL",
        dosage_form: "Capsule",
        strength: "100 mg",
        frequency: "1-1-1 (Thrice Daily)",
        duration: "2 Days",
        special_instructions: "Take before food until stool consistency normalizes."
      },
      {
        medicine_name: "Emeset 4",
        generic_name: "ONDANSETRON",
        dosage_form: "Tablet",
        strength: "4 mg",
        frequency: "1-0-0 (SOS for vomiting)",
        duration: "2 Days",
        special_instructions: "Take 30 mins before food if nausea or vomiting occurs."
      },
      {
        medicine_name: "Electral ORS Sachet",
        generic_name: "ORAL REHYDRATION SALTS (WHO FORMULA)",
        dosage_form: "Powder / Sachet",
        strength: "21.8g Sachet",
        frequency: "Sip throughout day",
        duration: "3 Days",
        special_instructions: "Dissolve entire sachet in 1 liter clean drinking water. Consume within 24 hours."
      }
    ],
    clinical_advice: "Strict hydration protocol. Light khichdi, curd, banana, coconut water. Strictly avoid oily, spicy street food, and caffeine.",
    followup_days: 3,
    alert_warnings: ["Watch for dehydration signs: dry tongue, sunken eyes, decreased urine output."]
  },
  {
    id: "diag-02",
    diagnosis_name: "Enteric Fever / Suspected Typhoid",
    icd10_code: "A01.0",
    specialty: "General Medicine",
    typical_complaints: "Step-ladder fever up to 102°F with evening rise, dull headache, body aches, loss of appetite, and coated tongue for 5 days.",
    recommended_lab_test_ids: ["lab-01", "lab-02"], // CBC, LFT
    medications: [
      {
        medicine_name: "Taxim-O 200",
        generic_name: "CEFIXIME",
        dosage_form: "Tablet",
        strength: "200 mg",
        frequency: "1-0-1 (Twice Daily)",
        duration: "7 Days",
        special_instructions: "Take strictly after food. Complete the full 7-day course even if fever subsides."
      },
      {
        medicine_name: "Dolo 650",
        generic_name: "PARACETAMOL",
        dosage_form: "Tablet",
        strength: "650 mg",
        frequency: "1-1-1 (SOS for temp > 100°F)",
        duration: "5 Days",
        special_instructions: "Maintain at least 6 hours gap between two doses. Max 3-4 tablets/day."
      },
      {
        medicine_name: "Pan-40",
        generic_name: "PANTOPRAZOLE",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0 (Morning Empty Stomach)",
        duration: "7 Days",
        special_instructions: "Take 30 minutes before morning tea/breakfast."
      }
    ],
    clinical_advice: "Rest mandatory. Lukewarm sponge bath if temperature exceeds 101°F. Boiled cooled water only. Review Typhoid IgG/IgM or Blood Culture if fever persists past Day 3.",
    followup_days: 5,
    alert_warnings: ["Caution: If severe abdominal pain, bloody stools, or persistent vomiting develops, visit emergency immediately."]
  },
  {
    id: "diag-03",
    diagnosis_name: "Acute Upper Respiratory Tract Infection (Viral URTI / Bronchitis)",
    icd10_code: "J06.9",
    specialty: "General Medicine / Pulmonology",
    typical_complaints: "Sore throat, rhinorrhea (runny nose), dry hacking cough, low-grade fever, malaise for 3 days.",
    recommended_lab_test_ids: ["lab-01"], // CBC
    medications: [
      {
        medicine_name: "Augmentin 625 Duo",
        generic_name: "AMOXICILLIN + CLAVULANIC ACID",
        dosage_form: "Tablet",
        strength: "500 mg + 125 mg",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        special_instructions: "Take at start of meals to prevent stomach upset. Complete full 5-day course."
      },
      {
        medicine_name: "Montair-LC",
        generic_name: "LEVOCETIRIZINE + MONTELUKAST",
        dosage_form: "Tablet",
        strength: "5 mg + 10 mg",
        frequency: "0-0-1 (At Bedtime)",
        duration: "5 Days",
        special_instructions: "Take at night. Helps relieve nasal congestion and airway bronchospasm."
      },
      {
        medicine_name: "Ascoril-D Plus",
        generic_name: "DEXTROMETHORPHAN + PHENYLEPHRINE + CHLORPHENIRAMINE",
        dosage_form: "Syrup",
        strength: "10 ml",
        frequency: "10 ml thrice daily",
        duration: "5 Days",
        special_instructions: "Take after meals. Avoid driving immediately if drowsiness occurs."
      },
      {
        medicine_name: "Dolo 650",
        generic_name: "PARACETAMOL",
        dosage_form: "Tablet",
        strength: "650 mg",
        frequency: "1-0-1 (SOS for fever / headache)",
        duration: "3 Days",
        special_instructions: "Take after food with water."
      }
    ],
    clinical_advice: "Steam inhalation twice daily for 10 mins. Warm saline gargles thrice daily. Drink lukewarm water. Avoid cold beverages and ice creams.",
    followup_days: 5
  },
  {
    id: "diag-04",
    diagnosis_name: "Type 2 Diabetes Mellitus (Uncontrolled Hyperglycemia)",
    icd10_code: "E11.65",
    specialty: "Internal Medicine / Diabetology",
    typical_complaints: "Polyuria (frequent urination), polydipsia (excessive thirst), general fatigue, blurred vision. Random blood sugar elevated.",
    recommended_lab_test_ids: ["lab-04", "lab-05", "lab-03"], // HbA1c, FBS/PPBS, KFT
    medications: [
      {
        medicine_name: "Glycomet-500 SR",
        generic_name: "METFORMIN HYDROCHLORIDE (SUSTAINED RELEASE)",
        dosage_form: "Tablet",
        strength: "500 mg",
        frequency: "1-0-1 (With Meals)",
        duration: "30 Days",
        special_instructions: "Take with lunch and dinner. Swallow whole, do not crush."
      },
      {
        medicine_name: "Januvia 50",
        generic_name: "SITAGLIPTIN",
        dosage_form: "Tablet",
        strength: "50 mg",
        frequency: "1-0-0 (Once Daily)",
        duration: "30 Days",
        special_instructions: "Take in the morning with or without food."
      }
    ],
    clinical_advice: "Strict low glycemic index diet. Avoid white sugar, potatoes, white rice, maida, and sweets. 30 mins brisk walking daily. Maintain home glucometer log (Fasting and 2hr Post-meal).",
    followup_days: 14,
    alert_warnings: ["Educate patient on Hypoglycemia symptoms: sweating, tremors, palpitations. Keep glucose powder or candy handy."]
  },
  {
    id: "diag-05",
    diagnosis_name: "Essential Hypertension (Stage 1 / Stage 2)",
    icd10_code: "I10",
    specialty: "Cardiology / Internal Medicine",
    typical_complaints: "Occipital morning headache, dizziness, neck stiffness, resting blood pressure persistently elevated above 140/90 mmHg.",
    recommended_lab_test_ids: ["lab-03", "lab-06"], // KFT with electrolytes, Lipid Profile
    medications: [
      {
        medicine_name: "Telma-40",
        generic_name: "TELMISARTAN",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0 (Morning Daily)",
        duration: "30 Days",
        special_instructions: "Take every morning at the same fixed time with water."
      },
      {
        medicine_name: "Amlong 2.5",
        generic_name: "AMLODIPINE",
        dosage_form: "Tablet",
        strength: "2.5 mg",
        frequency: "0-0-1 (Night Daily)",
        duration: "30 Days",
        special_instructions: "Take at bedtime. Watch for pedal swelling."
      }
    ],
    clinical_advice: "DASH Diet: strictly reduce dietary salt (< 3g/day). Avoid pickles, papad, processed namkeen. Daily 40 mins aerobic exercise. Monitor and log home BP every morning.",
    followup_days: 14,
    alert_warnings: ["Do not discontinue anti-hypertensives abruptly. If BP exceeds 180/110 with chest pain or blurring of vision, seek immediate ER care."]
  },
  {
    id: "diag-06",
    diagnosis_name: "Acid Peptic Disease (GERD & Dyspepsia)",
    icd10_code: "K21.9",
    specialty: "Gastroenterology",
    typical_complaints: "Retrosternal burning sensation (heartburn), postprandial acid regurgitation, bloating, upper epigastric heaviness after meals.",
    recommended_lab_test_ids: [],
    medications: [
      {
        medicine_name: "Pantocid-DSR",
        generic_name: "PANTOPRAZOLE + DOMPERIDONE (SR)",
        dosage_form: "Capsule",
        strength: "40 mg + 30 mg",
        frequency: "1-0-0 (Morning Empty Stomach)",
        duration: "14 Days",
        special_instructions: "Strictly 30 minutes before morning breakfast with plain water."
      },
      {
        medicine_name: "Mucaine Gel",
        generic_name: "OXETACAINE + ALUMINIUM HYDROXIDE + MAGNESIUM HYDROXIDE",
        dosage_form: "Syrup / Gel",
        strength: "10 ml",
        frequency: "10 ml SOS after food",
        duration: "7 Days",
        special_instructions: "Take 10 ml 15 mins after heavy meals or at bedtime for acute burning. Do not drink water immediately."
      }
    ],
    clinical_advice: "Small frequent meals. Avoid lying down for 2 hours post meals. Elevate head end of bed by 6 inches. Strictly avoid fried snacks, raw onions, excess tea/coffee, and alcohol.",
    followup_days: 14
  },
  {
    id: "diag-07",
    diagnosis_name: "Allergic Contact Dermatitis / Urticaria",
    icd10_code: "L23.9",
    specialty: "Dermatology",
    typical_complaints: "Intensely pruritic, erythematous raised wheals / papules on forearms, neck, and trunk with burning sensation.",
    recommended_lab_test_ids: ["lab-01", "lab-08"], // CBC, Serum IgE
    medications: [
      {
        medicine_name: "Cetzine 10",
        generic_name: "CETIRIZINE HYDROCHLORIDE",
        dosage_form: "Tablet",
        strength: "10 mg",
        frequency: "0-0-1 (At Bedtime)",
        duration: "7 Days",
        special_instructions: "Take at night after food. Avoid driving if drowsiness occurs."
      },
      {
        medicine_name: "Elocon 0.1% Cream",
        generic_name: "MOMETASONE FUROATE",
        dosage_form: "Cream",
        strength: "0.1% w/w",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        special_instructions: "Apply thin layer sparingly only on inflamed patches. Do not apply near eyes."
      },
      {
        medicine_name: "Calamine Lotion",
        generic_name: "CALAMINE + ZINC OXIDE",
        dosage_form: "Lotion",
        strength: "100 ml",
        frequency: "Apply SOS for soothing",
        duration: "7 Days",
        special_instructions: "Shake well and dab with cotton on itchy areas as needed."
      }
    ],
    clinical_advice: "Strictly avoid hot showers and scented soaps. Wear loose cotton garments. Avoid suspected triggers (new cosmetics, artificial jewelry, synthetic detergents).",
    followup_days: 7
  },
  {
    id: "diag-08",
    diagnosis_name: "Dental Pulpitis & Periapical Infection",
    icd10_code: "K04.0",
    specialty: "Dental Surgery",
    typical_complaints: "Continuous throbbing pain in tooth radiating to ear and jaw, hypersensitivity to hot/cold, localized gingival tenderness.",
    recommended_lab_test_ids: ["lab-10"], // Digital X-Ray
    medications: [
      {
        medicine_name: "Augmentin 625 Duo",
        generic_name: "AMOXICILLIN + CLAVULANIC ACID",
        dosage_form: "Tablet",
        strength: "500 mg + 125 mg",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        special_instructions: "Take with food to control underlying bacterial odontogenic infection."
      },
      {
        medicine_name: "Ketorol-DT",
        generic_name: "KETOROLAC TROMETHAMINE",
        dosage_form: "Tablet",
        strength: "10 mg",
        frequency: "1-0-1 (SOS for acute pain)",
        duration: "3 Days",
        special_instructions: "Disperse tablet in 1 tablespoon water and drink immediately. Take after food."
      },
      {
        medicine_name: "Clohex Mouthwash",
        generic_name: "CHLORHEXIDINE GLUCONATE 0.2%",
        dosage_form: "Mouthwash",
        strength: "0.2% w/v",
        frequency: "10 ml twice daily",
        duration: "7 Days",
        special_instructions: "Swish 10 ml undiluted for 60 seconds after brushing. Do not swallow."
      }
    ],
    clinical_advice: "Avoid chewing hard food on affected side. Warm saline rinses 4 times daily. Root Canal Treatment (RCT) evaluation required once acute inflammation subsides.",
    followup_days: 3
  }
];
