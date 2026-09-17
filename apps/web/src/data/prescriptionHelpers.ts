/**
 * Clinical Safety, Hindi Translation & Jan Aushadhi Cost-Saving Helpers
 * Powering Apollo/HealthPlix-grade safety and accessibility in Clinicos.
 */

export interface InteractionAlert {
  type: "DRUG_INTERACTION" | "ALLERGY_CONTRAINDICATION";
  severity: "SEVERE" | "MODERATE" | "MILD";
  drug_a: string;
  drug_b?: string;
  allergy_trigger?: string;
  title: string;
  description: string;
  clinical_advice: string;
}

export interface InteractionCheckResult {
  is_safe: boolean;
  total_alerts: number;
  severe_alerts: number;
  moderate_alerts: number;
  alerts: InteractionAlert[];
}

export interface GenericCostComparison {
  generic_name: string;
  brand_name: string;
  brand_mrp: number;
  generic_mrp: number;
  savings_percentage: number;
}

// 1. KNOWN DRUG-DRUG INTERACTIONS KNOWLEDGE BASE
export const KNOWN_DDI: Array<{
  drugs: [string, string];
  severity: "SEVERE" | "MODERATE";
  title: string;
  description: string;
  clinical_advice: string;
}> = [
  {
    drugs: ["SILDENAFIL", "NITROGLYCERIN"],
    severity: "SEVERE",
    title: "Fatal Hypotension Warning",
    description: "Co-administration of PDE5 inhibitors (Sildenafil/Tadalafil) with organic nitrates causes profound, life-threatening systemic vasodilation and circulatory collapse.",
    clinical_advice: "Absolute contraindication. Discontinue nitrates for at least 24 hours prior to PDE5 inhibitor use, or select non-nitrate antianginal therapy."
  },
  {
    drugs: ["TADALAFIL", "ISOSORBIDE MONONITRATE"],
    severity: "SEVERE",
    title: "Severe Nitrate Vasodilatory Collapse",
    description: "Potentiation of hypotensive effects resulting in acute syncope and myocardial hypoperfusion.",
    clinical_advice: "Absolute contraindication. Avoid combination."
  },
  {
    drugs: ["METHOTREXATE", "DICLOFENAC"],
    severity: "SEVERE",
    title: "Methotrexate Toxicity & Bone Marrow Suppression",
    description: "NSAIDs competitively inhibit renal clearance of methotrexate, causing dangerous serum accumulation and severe hematological toxicity.",
    clinical_advice: "Avoid concurrent NSAID use with moderate to high-dose Methotrexate. Use Paracetamol for pain control."
  },
  {
    drugs: ["METHOTREXATE", "IBUPROFEN"],
    severity: "SEVERE",
    title: "Methotrexate Toxicity & Bone Marrow Suppression",
    description: "NSAIDs competitively inhibit renal clearance of methotrexate, causing dangerous serum accumulation and severe hematological toxicity.",
    clinical_advice: "Avoid concurrent NSAID use with moderate to high-dose Methotrexate. Use Paracetamol for pain control."
  },
  {
    drugs: ["CLOPIDOGREL", "OMEPRAZOLE"],
    severity: "SEVERE",
    title: "Diminished Antiplatelet Efficacy (Stent Thrombosis Risk)",
    description: "Omeprazole inhibits CYP2C19 enzyme required to metabolize Clopidogrel into its active metabolite, diminishing antiplatelet protection.",
    clinical_advice: "Substitute Omeprazole with Pantoprazole or Rabeprazole, which exhibit negligible CYP2C19 inhibition."
  },
  {
    drugs: ["WARFARIN", "ASPIRIN"],
    severity: "SEVERE",
    title: "Extreme Gastrointestinal & Major Hemorrhage Risk",
    description: "Synergistic inhibition of coagulation cascade and platelet aggregation dramatically increases risk of major internal bleeding.",
    clinical_advice: "Unless strictly indicated for mechanical heart valves or post-PCI, avoid dual therapy. Monitor INR closely."
  },
  {
    drugs: ["RAMIPRIL", "SPIRONOLACTONE"],
    severity: "SEVERE",
    title: "Life-Threatening Hyperkalemia Risk",
    description: "Concurrent ACE inhibitor and potassium-sparing diuretic inhibits aldosterone secretion, leading to severe potassium retention and cardiac arrhythmias.",
    clinical_advice: "Regularly monitor serum potassium and renal function. Avoid over-the-counter potassium supplements."
  },
  {
    drugs: ["TELMISARTAN", "SPIRONOLACTONE"],
    severity: "SEVERE",
    title: "Hyperkalemia & Arrhythmia Hazard",
    description: "ARBs and potassium-sparing diuretics synergistically retain potassium in renal distal tubules.",
    clinical_advice: "Measure serum potassium within 1 week of initiating dual therapy."
  },
  {
    drugs: ["CIPROFLOXACIN", "AZITHROMYCIN"],
    severity: "SEVERE",
    title: "Additive QT Prolongation & Torsades de Pointes",
    description: "Concurrent fluoroquinolone and macrolide therapy delays cardiac ventricular repolarization, escalating risk of fatal ventricular arrhythmias.",
    clinical_advice: "Avoid concurrent administration. Replace one agent with a beta-lactam or alternative class."
  },
  {
    drugs: ["DOXYCYCLINE", "ISOTRETINOIN"],
    severity: "SEVERE",
    title: "Pseudotumor Cerebri (Benign Intracranial Hypertension)",
    description: "Co-administration of oral retinoids and tetracyclines is associated with dangerously elevated intracranial pressure.",
    clinical_advice: "Absolute contraindication in dermatology practice. Never prescribe Isotretinoin alongside Doxycycline or Minocycline."
  },
  {
    drugs: ["TRAMADOL", "SERTRALINE"],
    severity: "SEVERE",
    title: "Serotonin Syndrome & Seizure Threshold Reduction",
    description: "Both agents elevate synaptic serotonin and lower seizure threshold, precipitating hyperthermia, clonus, and agitation.",
    clinical_advice: "Avoid combination or substitute Tramadol with Paracetamol/Codeine under supervision."
  },
  {
    drugs: ["DOXYCYCLINE", "CALCIUM"],
    severity: "MODERATE",
    title: "Chelation & Impaired Antibiotic Absorption",
    description: "Divalent and trivalent cations (calcium, iron, magnesium) form insoluble chelates with tetracyclines, drastically reducing bioavailability.",
    clinical_advice: "Separate ingestion by at least 2 to 3 hours."
  },
  {
    drugs: ["CIPROFLOXACIN", "ANTACID"],
    severity: "MODERATE",
    title: "Cation Chelation & Reduced Quinolone Bioavailability",
    description: "Aluminum and magnesium antacids decrease fluoroquinolone absorption by up to 80%.",
    clinical_advice: "Administer Ciprofloxacin 2 hours before or 6 hours after antacids."
  },
  {
    drugs: ["ATORVASTATIN", "ITRACONAZOLE"],
    severity: "MODERATE",
    title: "Statin Accumulation & Rhabdomyolysis Risk",
    description: "Strong CYP3A4 inhibitors (azoles) impair statin metabolism, elevating serum levels and risking acute myopathy.",
    clinical_advice: "Temporarily withhold Atorvastatin during oral antifungal therapy, or substitute with Rosuvastatin at lower dosage."
  },
  {
    drugs: ["METFORMIN", "CONTRAST"],
    severity: "MODERATE",
    title: "Risk of Metformin-Associated Lactic Acidosis",
    description: "Iodinated radiocontrast media can induce acute renal impairment, impairing metformin clearance.",
    clinical_advice: "Hold Metformin on the day of contrast imaging and resume after 48 hours following normal serum creatinine check."
  }
];

// 2. ALLERGY CONTRAINDICATION FAMILIES
export const ALLERGY_FAMILIES: Record<string, {
  keywords: string[];
  severity: "SEVERE" | "MODERATE";
  title: string;
  description: string;
  clinical_advice: string;
}> = {
  penicillin: {
    keywords: ["penicillin", "amoxicillin", "ampicillin", "augmentin", "piperacillin", "clavulanate"],
    severity: "SEVERE",
    title: "Severe Penicillin / Beta-Lactam Hypersensitivity",
    description: "Patient has a documented Penicillin allergy. Administering aminopenicillins poses high risk of anaphylaxis, urticaria, or angioedema.",
    clinical_advice: "Substitute with Macrolides (Azithromycin), Fluoroquinolones, or Doxycycline."
  },
  sulfa: {
    keywords: ["sulfa", "sulfamethoxazole", "bactrim", "septran", "sulfasalazine", "silver sulfadiazine"],
    severity: "SEVERE",
    title: "Sulfonamide Allergy Warning",
    description: "Patient has documented Sulfa allergy. Risk of Stevens-Johnson syndrome (SJS) or severe cutaneous drug reactions.",
    clinical_advice: "Select non-sulfonamide antimicrobial alternatives."
  },
  nsaid: {
    keywords: ["nsaid", "aspirin", "ibuprofen", "diclofenac", "aceclofenac", "naproxen", "combiflam"],
    severity: "SEVERE",
    title: "NSAID / Aspirin Induced Bronchospasm or Anaphylaxis",
    description: "Patient has documented NSAID intolerance. Potential for severe asthma exacerbation, angioedema, or GI ulceration.",
    clinical_advice: "Use Paracetamol (Acetaminophen) for analgesia/antipyresis."
  },
  cephalosporin: {
    keywords: ["cephalosporin", "cefixime", "cefpodoxime", "ceftriaxone", "cefuroxime"],
    severity: "MODERATE",
    title: "Cephalosporin Cross-Reactivity Risk",
    description: "Patient has recorded sensitivity to cephalosporin antibiotics.",
    clinical_advice: "Avoid first/second generation cephalosporins; verify cross-reactivity tolerance."
  }
};

// 3. JAN AUSHADHI GENERIC PRICING COMPARISON MATRIX
export const JAN_AUSHADHI_PRICING: Record<string, { brand_mrp: number; generic_mrp: number }> = {
  "AMOXICILLIN": { brand_mrp: 210, generic_mrp: 52 },
  "AMOXICILLIN + POTASSIUM CLAVULANATE": { brand_mrp: 205, generic_mrp: 54 },
  "PARACETAMOL": { brand_mrp: 32, generic_mrp: 11 },
  "PANTOPRAZOLE SODIUM": { brand_mrp: 142, generic_mrp: 28 },
  "PANTOPRAZOLE": { brand_mrp: 142, generic_mrp: 28 },
  "DOXYCYCLINE HYCLATE": { brand_mrp: 125, generic_mrp: 24 },
  "DOXYCYCLINE": { brand_mrp: 125, generic_mrp: 24 },
  "CETIRIZINE HYDROCHLORIDE": { brand_mrp: 45, generic_mrp: 9 },
  "CETIRIZINE": { brand_mrp: 45, generic_mrp: 9 },
  "AZITHROMYCIN": { brand_mrp: 135, generic_mrp: 42 },
  "ATORVASTATIN": { brand_mrp: 110, generic_mrp: 18 },
  "METFORMIN": { brand_mrp: 65, generic_mrp: 12 },
  "ACECLOFENAC + PARACETAMOL": { brand_mrp: 85, generic_mrp: 22 },
  "CLOPIDOGREL": { brand_mrp: 130, generic_mrp: 35 },
  "TELMISARTAN": { brand_mrp: 95, generic_mrp: 20 }
};

export function getJanAushadhiSavings(genericName: string, brandName: string): GenericCostComparison | null {
  if (!genericName) return null;
  const upper = genericName.toUpperCase().trim();
  
  for (const [key, price] of Object.entries(JAN_AUSHADHI_PRICING)) {
    if (upper.includes(key) || key.includes(upper)) {
      const savings = Math.round(((price.brand_mrp - price.generic_mrp) / price.brand_mrp) * 100);
      return {
        generic_name: genericName,
        brand_name: brandName,
        brand_mrp: price.brand_mrp,
        generic_mrp: price.generic_mrp,
        savings_percentage: savings
      };
    }
  }
  return null;
}

// 4. CLIENT-SIDE INSTANT DDI & ALLERGY CHECK WITH API FALLBACK
export function evaluatePrescriptionSafety(
  medications: Array<{ medicine_name: string; generic_name: string }>,
  patientAllergies?: string
): InteractionCheckResult {
  const alerts: InteractionAlert[] = [];

  const normalizedMeds = medications.map(m => {
    const brand = (m.medicine_name || "").toUpperCase().replace(/[^A-Z0-9\s]/g, " ");
    const generic = (m.generic_name || "").toUpperCase().replace(/[^A-Z0-9\s]/g, " ");
    return {
      originalBrand: m.medicine_name,
      originalGeneric: m.generic_name,
      combined: `${brand} ${generic}`.trim()
    };
  });

  // Check pairwise interactions
  const n = normalizedMeds.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const m1 = normalizedMeds[i].combined;
      const m2 = normalizedMeds[j].combined;

      for (const rule of KNOWN_DDI) {
        const d1 = rule.drugs[0];
        const d2 = rule.drugs[1];

        if ((m1.includes(d1) && m2.includes(d2)) || (m2.includes(d1) && m1.includes(d2))) {
          alerts.push({
            type: "DRUG_INTERACTION",
            severity: rule.severity,
            drug_a: normalizedMeds[i].originalGeneric || normalizedMeds[i].originalBrand,
            drug_b: normalizedMeds[j].originalGeneric || normalizedMeds[j].originalBrand,
            title: rule.title,
            description: rule.description,
            clinical_advice: rule.clinical_advice
          });
        }
      }
    }
  }

  // Check allergies
  if (patientAllergies && patientAllergies.trim()) {
    const normAllergy = patientAllergies.toLowerCase();
    for (const [key, rule] of Object.entries(ALLERGY_FAMILIES)) {
      if (normAllergy.includes(key)) {
        for (const m of normalizedMeds) {
          const text = m.combined.toLowerCase();
          if (rule.keywords.some(kw => text.includes(kw))) {
            alerts.push({
              type: "ALLERGY_CONTRAINDICATION",
              severity: rule.severity,
              drug_a: m.originalGeneric || m.originalBrand,
              allergy_trigger: key.charAt(0).toUpperCase() + key.slice(1),
              title: rule.title,
              description: rule.description,
              clinical_advice: rule.clinical_advice
            });
          }
        }
      }
    }
  }

  const severeCount = alerts.filter(a => a.severity === "SEVERE").length;
  const moderateCount = alerts.filter(a => a.severity === "MODERATE").length;

  return {
    is_safe: alerts.length === 0,
    total_alerts: alerts.length,
    severe_alerts: severeCount,
    moderate_alerts: moderateCount,
    alerts
  };
}

// 5. REGIONAL HINDI DOSAGE DIRECTIONS TRANSLATOR
const FREQUENCY_HINDI_MAP: Record<string, string> = {
  "1-0-1": "दिन में 2 बार (सुबह 1, रात 1)",
  "1-0-1 (after meals)": "दिन में 2 बार, खाना खाने के बाद (सुबह 1, रात 1)",
  "1-0-1 (twice daily)": "दिन में 2 बार (सुबह 1, रात 1)",
  "1-0-1 (after food)": "दिन में 2 बार, भोजन के बाद (सुबह 1, रात 1)",
  "1-0-0": "दिन में 1 बार, सुबह (सुबह 1)",
  "1-0-0 (morning)": "दिन में 1 बार, सुबह (सुबह 1)",
  "1-0-0 (empty stomach)": "दिन में 1 बार, सुबह खाली पेट (सुबह 1)",
  "0-0-1": "दिन में 1 बार, रात को (रात 1)",
  "0-0-1 (at bedtime)": "दिन में 1 बार, रात को सोते समय (रात 1)",
  "0-0-1 (night)": "दिन में 1 बार, रात को भोजन के बाद (रात 1)",
  "1-1-1": "दिन में 3 बार (सुबह 1, दोपहर 1, रात 1)",
  "1-1-1 (after food)": "दिन में 3 बार, खाना खाने के बाद (सुबह 1, दोपहर 1, रात 1)",
  "1-1-1 (sos fever)": "ज़रूरत पड़ने पर बुखार के लिए (कम से कम 6 घंटे के अंतराल पर)",
  "sos": "ज़रूरत पड़ने पर"
};

const INSTRUCTION_HINDI_KEYWORDS: Array<{ en: string; hi: string }> = [
  { en: "take after food with water", hi: "भोजन के बाद पानी के साथ लें" },
  { en: "take after meals with a full glass of water", hi: "भोजन के बाद पूरे एक गिलास पानी के साथ लें" },
  { en: "avoid lying down immediately", hi: "दवा लेने के तुरंत बाद न लेटें" },
  { en: "take 30 mins before breakfast", hi: "नाश्ते से 30 मिनट पहले लें" },
  { en: "drink with full glass of water", hi: "पूरे एक गिलास पानी के साथ पिएं" },
  { en: "avoid sun exposure", hi: "सीधी धूप से बचें" },
  { en: "for relief from pruritus/itching", hi: "खुजली और जलन से राहत के लिए" },
  { en: "may cause mild drowsiness", hi: "हल्की सुस्ती आ सकती है" },
  { en: "apply thin layer over active lesions", hi: "प्रभावित स्थान पर हल्की परत लगाएं" },
  { en: "after gentle face wash", hi: "हल्के से चेहरा धोने के बाद" },
  { en: "apply a pea-sized amount at bedtime", hi: "रात को मटर के दाने जितना लगाएं" },
  { en: "use sunscreen in morning", hi: "सुबह सनस्क्रीन का उपयोग करें" },
  { en: "keep area dry", hi: "उस जगह को सूखा रखें" },
  { en: "strictly avoid alcohol", hi: "शराब का सेवन बिल्कुल न करें" },
  { en: "complete the full course", hi: "दवा का पूरा कोर्स समाप्त करें" }
];

export function translateDirectionsToHindi(
  frequency: string,
  duration: string,
  specialInstructions?: string
): { frequency_hi: string; duration_hi: string; instructions_hi: string } {
  // Translate Frequency
  const cleanFreq = (frequency || "").trim().toLowerCase();
  let freqHi = FREQUENCY_HINDI_MAP[cleanFreq];
  if (!freqHi) {
    for (const [key, val] of Object.entries(FREQUENCY_HINDI_MAP)) {
      if (cleanFreq.includes(key)) {
        freqHi = val;
        break;
      }
    }
  }
  if (!freqHi) {
    if (cleanFreq.includes("1-0-1")) freqHi = "दिन में 2 बार (सुबह 1, रात 1)";
    else if (cleanFreq.includes("1-1-1")) freqHi = "दिन में 3 बार (सुबह 1, दोपहर 1, रात 1)";
    else if (cleanFreq.includes("1-0-0")) freqHi = "दिन में 1 बार, सुबह (सुबह 1)";
    else if (cleanFreq.includes("0-0-1")) freqHi = "दिन में 1 बार, रात को सोते समय (रात 1)";
    else freqHi = frequency; // fallback to original
  }

  // Translate Duration
  const daysMatch = duration.match(/(\d+)\s*days?/i);
  let durHi = duration;
  if (daysMatch) {
    durHi = `${daysMatch[1]} दिनों के लिए`;
  } else if (/week/i.test(duration)) {
    const weeksMatch = duration.match(/(\d+)\s*weeks?/i);
    durHi = weeksMatch ? `${weeksMatch[1]} हफ्तों के लिए` : "1 हफ्ते के लिए";
  }

  // Translate Special Instructions
  let instHi = "";
  if (specialInstructions && specialInstructions.trim()) {
    const lower = specialInstructions.toLowerCase();
    const matchedPhrases: string[] = [];

    for (const pair of INSTRUCTION_HINDI_KEYWORDS) {
      if (lower.includes(pair.en.toLowerCase())) {
        matchedPhrases.push(pair.hi);
      }
    }

    if (matchedPhrases.length > 0) {
      instHi = matchedPhrases.join("। ") + "।";
    } else {
      // General heuristic
      instHi = specialInstructions;
    }
  }

  return {
    frequency_hi: freqHi,
    duration_hi: durHi,
    instructions_hi: instHi
  };
}
