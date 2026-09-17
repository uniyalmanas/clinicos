export interface PrescribedMedicineTemplate {
  medicine_name: string;
  generic_name: string;
  dosage_form: string;
  strength: string;
  frequency: string;
  duration: string;
  special_instructions: string;
}

export interface RxComboItem {
  id: string;
  title: string;
  specialty: "Dermatology" | "General Medicine" | "Pediatrics" | "Dental" | "Custom";
  tag: string;
  badgeColor?: string;
  diagnosis: string;
  complaints: string;
  medicines: PrescribedMedicineTemplate[];
  labs: string[];
  followup: string;
  isCustom?: boolean;
}

export const PRESET_RX_COMBOS: RxComboItem[] = [
  // --- DERMATOLOGY ---
  {
    id: "combo-derma-01",
    title: "Grade-II Inflammatory Acne",
    specialty: "Dermatology",
    tag: "Acne",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
    diagnosis: "Moderate Acne Vulgaris with Inflammatory Papules (Grade II)",
    complaints: "Recurrent facial pustules, oily skin and comedones on forehead & cheeks for 4 weeks.",
    medicines: [
      {
        medicine_name: "Doxy-100",
        generic_name: "DOXYCYCLINE HYCLATE",
        dosage_form: "Capsule",
        strength: "100 mg",
        frequency: "1-0-1 (After Food)",
        duration: "14 Days",
        special_instructions: "Take with a full glass of water. Do not lie down immediately for 30 mins."
      },
      {
        medicine_name: "Clindac-A",
        generic_name: "CLINDAMYCIN PHOSPHATE",
        dosage_form: "Gel",
        strength: "1% w/w",
        frequency: "1-0-0 (Morning)",
        duration: "14 Days",
        special_instructions: "Apply thin layer over active inflammatory pimples after gentle face wash."
      },
      {
        medicine_name: "Acretin 0.05%",
        generic_name: "TRETINOIN",
        dosage_form: "Cream",
        strength: "0.05% w/w",
        frequency: "0-0-1 (At Bedtime)",
        duration: "21 Days",
        special_instructions: "Apply pea-sized amount at bedtime on clean dry skin. Must use SPF-50 sunscreen during day."
      }
    ],
    labs: [],
    followup: "Review after 14 days to monitor clearance of inflammatory lesions. Avoid harsh physical facial scrubs."
  },
  {
    id: "combo-derma-02",
    title: "Tinea Corporis & Cruris (Fungal Ringworm)",
    specialty: "Dermatology",
    tag: "Fungal",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
    diagnosis: "Tinea Corporis & Tinea Cruris (Dermatophytosis)",
    complaints: "Annular erythematous scaling plaques with intense pruritus in groin folds and trunk for 2 weeks.",
    medicines: [
      {
        medicine_name: "Lulican",
        generic_name: "LULICONAZOLE",
        dosage_form: "Cream",
        strength: "1% w/w",
        frequency: "0-0-1 (Night)",
        duration: "14 Days",
        special_instructions: "Apply 1 inch beyond the active red border. Keep the skin folds strictly dry."
      },
      {
        medicine_name: "Cetzine 10",
        generic_name: "CETIRIZINE HYDROCHLORIDE",
        dosage_form: "Tablet",
        strength: "10 mg",
        frequency: "0-0-1 (At Bedtime)",
        duration: "7 Days",
        special_instructions: "Take at night for intense itching. May cause mild drowsiness."
      }
    ],
    labs: ["lab-01"],
    followup: "Review after 14 days. Wear loose cotton undergarments. Wash clothes in hot water and iron inside out."
  },
  {
    id: "combo-derma-03",
    title: "Allergic Contact Dermatitis / Urticaria",
    specialty: "Dermatology",
    tag: "Allergy",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40",
    diagnosis: "Acute Allergic Contact Dermatitis & Pruritus",
    complaints: "Intense itching, red erythematous wheals and skin burning after exposure to chemical cosmetic product.",
    medicines: [
      {
        medicine_name: "Cetzine 10",
        generic_name: "CETIRIZINE HYDROCHLORIDE",
        dosage_form: "Tablet",
        strength: "10 mg",
        frequency: "0-0-1 (At Bedtime)",
        duration: "5 Days",
        special_instructions: "Take 1 tablet after dinner to suppress histamine itching response."
      },
      {
        medicine_name: "Pan-40",
        generic_name: "PANTOPRAZOLE SODIUM",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0 (Empty Stomach)",
        duration: "5 Days",
        special_instructions: "Take 30 minutes before breakfast with water."
      }
    ],
    labs: ["lab-08"],
    followup: "Review after 5 days. Immediately discontinue suspect cosmetic creams, perfumes and scented soaps."
  },
  {
    id: "combo-derma-04",
    title: "Androgenetic Alopecia (Hair Fall)",
    specialty: "Dermatology",
    tag: "Hair",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/40",
    diagnosis: "Early Androgenetic Alopecia (Norwood Grade II/III)",
    complaints: "Progressive bitemporal hair thinning and excessive shedding during washing for 3 months.",
    medicines: [
      {
        medicine_name: "Tugain 5%",
        generic_name: "MINOXIDIL",
        dosage_form: "Lotion",
        strength: "5% w/v",
        frequency: "1-0-1 (Twice Daily)",
        duration: "30 Days",
        special_instructions: "Apply 1 ml directly to dry scalp in thinning areas using dropper. Wash hands after application."
      }
    ],
    labs: ["lab-01", "lab-07"],
    followup: "Review in 6 weeks. Initial mild shedding during weeks 2-4 is expected as new hair cycles begin."
  },

  // --- GENERAL MEDICINE / GP ---
  {
    id: "combo-gp-01",
    title: "Acute Viral URTI & Bodyache",
    specialty: "General Medicine",
    tag: "Viral URTI",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
    diagnosis: "Acute Viral Upper Respiratory Tract Infection (URTI)",
    complaints: "Sore throat, low-grade fever (100.4°F), body aches, watery nasal discharge and dry cough for 2 days.",
    medicines: [
      {
        medicine_name: "Dolo 650",
        generic_name: "PARACETAMOL",
        dosage_form: "Tablet",
        strength: "650 mg",
        frequency: "1-1-1 (After Food SOS)",
        duration: "3 Days",
        special_instructions: "Take if temp > 99.5°F or for body ache. Minimum 6 hour gap between tablets."
      },
      {
        medicine_name: "Pan-40",
        generic_name: "PANTOPRAZOLE SODIUM",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0 (Empty Stomach)",
        duration: "5 Days",
        special_instructions: "Take 1 tablet in morning before breakfast."
      },
      {
        medicine_name: "Montair-LC",
        generic_name: "MONTELUKAST SODIUM + LEVOCETIRIZINE",
        dosage_form: "Tablet",
        strength: "10 mg + 5 mg",
        frequency: "0-0-1 (At Bedtime)",
        duration: "5 Days",
        special_instructions: "Take at bedtime for runny nose, sneezing, and airway inflammation."
      }
    ],
    labs: ["lab-01"],
    followup: "Review in 3 days if fever does not subside or if breathlessness occurs. Warm salt water gargles thrice daily."
  },
  {
    id: "combo-gp-02",
    title: "Acute Gastroenteritis & Dehydration",
    specialty: "General Medicine",
    tag: "Gastro",
    badgeColor: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800/40",
    diagnosis: "Acute Infective Gastroenteritis with Mild Dehydration",
    complaints: "Frequent watery stools (5-6 times), abdominal colicky cramping, and mild nausea since morning.",
    medicines: [
      {
        medicine_name: "Omez-D",
        generic_name: "OMEPRAZOLE + DOMPERIDONE",
        dosage_form: "Capsule",
        strength: "20 mg + 10 mg",
        frequency: "1-0-1 (Before Food)",
        duration: "3 Days",
        special_instructions: "Take 30 mins before breakfast and dinner for nausea and abdominal spasm."
      },
      {
        medicine_name: "Eldoper",
        generic_name: "LOPERAMIDE HYDROCHLORIDE",
        dosage_form: "Capsule",
        strength: "2 mg",
        frequency: "1-0-1 (After Stool SOS)",
        duration: "2 Days",
        special_instructions: "Take after unformed watery stool. Stop as soon as motions normalize. Max 4 capsules/day."
      }
    ],
    labs: ["lab-01", "lab-03"],
    followup: "Hydrate actively with WHO-ORS (Electral) solution. Eat curd-rice, bananas, and light khichdi. Return immediately if blood in stool."
  },
  {
    id: "combo-gp-03",
    title: "Essential Hypertension Routine Starter",
    specialty: "General Medicine",
    tag: "Cardio",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
    diagnosis: "Essential Hypertension (Stage-1 Uncomplicated)",
    complaints: "Occipital morning headache, occasional dizziness. Recorded clinic BP 148/92 mmHg.",
    medicines: [
      {
        medicine_name: "Telma-40",
        generic_name: "TELMISARTAN",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0 (Morning)",
        duration: "30 Days",
        special_instructions: "Take 1 tablet every morning at the same time with water. Do not miss doses."
      }
    ],
    labs: ["lab-03", "lab-06", "lab-09"],
    followup: "Log morning & evening BP readings in diary for 7 days. Low salt diet (<5g/day). Review in 14 days."
  },

  // --- DENTAL ---
  {
    id: "combo-dent-01",
    title: "Acute Periapical Abscess (Pre-RCT)",
    specialty: "Dental",
    tag: "Dental Pain",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40",
    diagnosis: "Acute Irreversible Pulpitis with Periapical Periodontitis",
    complaints: "Severe throbbing tooth pain radiating to ear on chewing hot food in lower right molar (Tooth #46).",
    medicines: [
      {
        medicine_name: "Augmentin 625",
        generic_name: "AMOXICILLIN + CLAVULANIC ACID",
        dosage_form: "Tablet",
        strength: "500 mg + 125 mg",
        frequency: "1-0-1 (After Food)",
        duration: "5 Days",
        special_instructions: "Complete the full 5-day course. Take after food to prevent stomach upset."
      },
      {
        medicine_name: "Zerodol-SP",
        generic_name: "ACECLOFENAC + PARACETAMOL + SERRATIOPEPTIDASE",
        dosage_form: "Tablet",
        strength: "100 mg + 325 mg + 15 mg",
        frequency: "1-0-1 (After Food)",
        duration: "3 Days",
        special_instructions: "For severe throbbing toothache and swelling. Take strictly after meals."
      },
      {
        medicine_name: "Pan-40",
        generic_name: "PANTOPRAZOLE SODIUM",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0 (Empty Stomach)",
        duration: "5 Days",
        special_instructions: "Gastric protection before breakfast."
      },
      {
        medicine_name: "Clohex Plus",
        generic_name: "CHLORHEXIDINE GLUCONATE",
        dosage_form: "Drops",
        strength: "0.2% w/v",
        frequency: "1-0-1 (After Brushing)",
        duration: "7 Days",
        special_instructions: "Swish 10 ml mouthwash undiluted for 60 seconds after brushing. Spit out, do not swallow."
      }
    ],
    labs: ["lab-10"],
    followup: "Report back in 3 days once acute infection subsides for Root Canal Therapy (RCT) biomechanical preparation."
  },

  // --- PEDIATRICS ---
  {
    id: "combo-ped-01",
    title: "Pediatric Viral Pharyngitis & Fever",
    specialty: "Pediatrics",
    tag: "Child Fever",
    badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800/40",
    diagnosis: "Pediatric Acute Viral Pharyngitis & Pyrexia",
    complaints: "Child irritable with fever (101.2°F), throat pain on swallowing and refusal to eat for 24 hours.",
    medicines: [
      {
        medicine_name: "Dolo 650",
        generic_name: "PARACETAMOL",
        dosage_form: "Syrup",
        strength: "250 mg / 5ml",
        frequency: "1-1-1 (SOS Fever > 100°F)",
        duration: "3 Days",
        special_instructions: "Dose calculated as per body weight (15 mg/kg). Gap of minimum 6 hours between doses."
      },
      {
        medicine_name: "Ascoril-D Plus",
        generic_name: "DEXTROMETHORPHAN + PHENYLEPHRINE + CHLORPHENIRAMINE",
        dosage_form: "Syrup",
        strength: "10 mg + 5 mg + 2 mg per 5ml",
        frequency: "1-0-1 (After Meals)",
        duration: "4 Days",
        special_instructions: "5 ml twice daily for persistent nighttime throat cough."
      }
    ],
    labs: ["lab-01"],
    followup: "Tepid sponging if temperature crosses 101°F. Encourage plenty of fluids (coconut water, soups). Review in 48 hours."
  }
];

// Helper functions for doctor custom presets (using LocalStorage)
const CUSTOM_COMBOS_STORAGE_KEY = "clinicos_doctor_custom_combos_v1";

export function getStoredCustomCombos(): RxComboItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_COMBOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed reading custom combos", e);
    return [];
  }
}

export function saveCustomComboToStorage(combo: RxComboItem): RxComboItem[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getStoredCustomCombos();
    const updated = [combo, ...existing.filter(c => c.id !== combo.id)];
    localStorage.setItem(CUSTOM_COMBOS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed saving custom combo", e);
    return [];
  }
}

export function deleteCustomComboFromStorage(id: string): RxComboItem[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getStoredCustomCombos();
    const updated = existing.filter(c => c.id !== id);
    localStorage.setItem(CUSTOM_COMBOS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed deleting custom combo", e);
    return [];
  }
}
