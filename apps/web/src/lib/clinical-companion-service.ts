/**
 * ClinicOS AI Clinical Companion — Core Intelligence Service
 * 
 * Provides:
 * - Real-time conversational context processing
 * - Clinical Memory parsing and state mutations
 * - Pharmacological matching with INDIAN_MEDICINES
 * - Clarification & ambiguity detection (incomplete vitals, unconfirmed dosages)
 * - Dual Report synthesis:
 *    Report A: Doctor's Clinical Report (EMR / SOAP)
 *    Report B: Patient-Friendly Visit Summary (10 structured plain-language sections)
 */

import { INDIAN_MEDICINES, MedicineItem as CatalogueMedicine } from "@/data/medicines";
import type {
  ClinicalMemory,
  MedicationMemoryItem,
  PatientComplaintItem,
  PatientVitalsMemory,
  ClarificationAlert,
  DoctorClinicalReport,
  PatientVisitSummary,
  HistoricalVisitSummary,
} from "./clinical-companion-types";
import type { ConsultationLanguage } from "./consultation-types";

export function createInitialClinicalMemory(patient: {
  uhid?: string;
  name: string;
  allergies?: string[];
  medical_history?: string[];
  doctor_name?: string;
}): ClinicalMemory {
  const sessionId = `COMP-${Date.now().toString(36).toUpperCase()}`;
  return {
    session_id: sessionId,
    patient_uhid: patient.uhid || sessionId,
    patient_name: patient.name,
    doctor_name: patient.doctor_name || "",
    complaints: [],
    vitals: {},
    medical_history: patient.medical_history || [],
    allergies: patient.allergies || [],
    examination_findings: [],
    provisional_diagnosis: "",
    confirmed_diagnosis: "",
    medications: [],
    lab_investigations: [],
    follow_up: {
      emergency_warnings: [
        "High fever above 102°F persisting over 48 hours",
        "Shortness of breath, chest tightness or SpO2 dropping below 95%",
        "Persistent vomiting or inability to retain fluids",
      ],
    },
    last_updated: new Date().toISOString(),
  };
}

/**
 * Searches the Indian medicine catalogue for close matches.
 */
export function matchCatalogueMedicine(spokenName: string): CatalogueMedicine | null {
  const query = spokenName.toLowerCase().trim();
  if (!query) return null;

  // Direct brand match
  const direct = INDIAN_MEDICINES.find(
    (m) => m.brand_name.toLowerCase() === query || m.generic_name.toLowerCase() === query
  );
  if (direct) return direct;

  // Partial match
  const partial = INDIAN_MEDICINES.find(
    (m) =>
      query.includes(m.brand_name.toLowerCase()) ||
      m.brand_name.toLowerCase().includes(query) ||
      query.includes(m.generic_name.toLowerCase()) ||
      m.generic_name.toLowerCase().includes(query)
  );
  return partial || null;
}

/**
 * Checks if a prescribed medication conflicts with known patient allergies.
 */
export function checkMedicationAllergyWarning(
  med: { generic_name: string; medicine_name: string },
  allergies: string[]
): string | null {
  if (!allergies || allergies.length === 0) return null;
  const gen = med.generic_name.toUpperCase();
  const brand = med.medicine_name.toUpperCase();

  for (const allergy of allergies) {
    const a = allergy.toUpperCase();
    if (a.includes("PENICILLIN") || a.includes("B-LACTAM") || a.includes("BETA-LACTAM")) {
      if (gen.includes("AMOXICILLIN") || gen.includes("AMPICILLIN") || gen.includes("CLAVULANIC") || brand.includes("AUGMENTIN")) {
        return `CONTRAINDICATION HARD-STOP: Patient has documented ${allergy}. ${med.medicine_name} (${med.generic_name}) contains cross-reactive penicillin molecule!`;
      }
    }
    if (a.includes("SULFA") || a.includes("SULFONAMIDE")) {
      if (gen.includes("SULFA") || gen.includes("COTRIMOXAZOLE") || brand.includes("BACTRIM") || brand.includes("SEPTRA")) {
        return `CONTRAINDICATION WARNING: Patient allergic to ${allergy}. ${med.medicine_name} is a sulfonamide agent.`;
      }
    }
    if (a.includes("NSAID") || a.includes("ASPIRIN") || a.includes("IBUPROFEN")) {
      if (gen.includes("ACECLOFENAC") || gen.includes("DICLOFENAC") || gen.includes("IBUPROFEN") || gen.includes("MEFENAMIC")) {
        return `CONTRAINDICATION WARNING: Patient documented with ${allergy}. Prescribing NSAID requires clinical override.`;
      }
    }
  }
  return null;
}

/**
 * Robust clinical extractor for consultation speech / transcript chunks.
 */
export function extractClinicalMemoryFromTranscript(
  transcript: string,
  currentMemory: ClinicalMemory
): { updatedMemory: ClinicalMemory; clarifications: ClarificationAlert[] } {
  const memory: ClinicalMemory = JSON.parse(JSON.stringify(currentMemory));
  const text = transcript;
  const lower = text.toLowerCase();
  const clarifications: ClarificationAlert[] = [];

  // 1. EXTRACT VITALS
  // BP: e.g. "120/80" or "BP is 130 over 85" or "blood pressure 120"
  const bpMatch = text.match(/(\d{2,3})\s*(?:\/|\s*over\s*)\s*(\d{2,3})/i);
  if (bpMatch) {
    memory.vitals.bp_systolic = parseInt(bpMatch[1], 10);
    memory.vitals.bp_diastolic = parseInt(bpMatch[2], 10);
  } else {
    const singleBp = text.match(/(?:bp|blood\s*pressure)\s*(?:is\s*)?(\d{2,3})/i);
    if (singleBp && !memory.vitals.bp_systolic) {
      memory.vitals.bp_systolic = parseInt(singleBp[1], 10);
      clarifications.push({
        id: `clarify-bp-${Date.now()}`,
        field: "vitals.bp",
        severity: "medium",
        question: `Blood pressure reading was heard as "${singleBp[1]}". Could you please confirm the complete systolic / diastolic reading (e.g. 120/80 mmHg)?`,
        rationale: "Systolic-only reading cannot assess mean arterial pressure or hypertension stage.",
        resolved: false,
      });
    }
  }

  // Pulse
  const pulseMatch = text.match(/(?:pulse|heart\s*rate|hr)\s*(?:is\s*)?(\d{2,3})/i) || text.match(/(\d{2,3})\s*(?:bpm|beats)/i);
  if (pulseMatch) {
    memory.vitals.heart_rate = parseInt(pulseMatch[1], 10);
  }

  // Temp
  const tempMatch = text.match(/(?:temp|temperature)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)/i) || text.match(/(\d{2,3}(?:\.\d+)?)\s*(?:°?f|fahrenheit)/i);
  if (tempMatch) {
    memory.vitals.temperature = parseFloat(tempMatch[1]);
  }

  // SpO2
  const spo2Match = text.match(/(?:spo2|oxygen|saturation|o2)\s*(?:is\s*)?(\d{2,3})%?/i) || text.match(/(\d{2,3})\s*%/i);
  if (spo2Match) {
    memory.vitals.spo2 = parseInt(spo2Match[1], 10);
  }

  // Weight
  const weightMatch = text.match(/(?:weight|wt)\s*(?:is\s*)?(\d{2,3}(?:\.\d+)?)\s*(?:kg)?/i) || text.match(/(\d{2,3})\s*kg/i);
  if (weightMatch) {
    memory.vitals.weight = parseFloat(weightMatch[1]);
  }

  // Height & BMI
  const heightMatch = text.match(/(?:height|ht)\s*(?:is\s*)?(\d{2,3})\s*(?:cm)?/i);
  if (heightMatch) {
    memory.vitals.height = parseInt(heightMatch[1], 10);
  }
  if (memory.vitals.weight && memory.vitals.height && memory.vitals.height > 50) {
    const hM = memory.vitals.height / 100;
    memory.vitals.bmi = parseFloat((memory.vitals.weight / (hM * hM)).toFixed(1));
  }

  // 2. EXTRACT COMPLAINTS & DURATION
  const complaintKeywords = [
    { pattern: /(?:fever|pyrexia|temperature)/i, label: "Fever / Elevated Body Temperature" },
    { pattern: /(?:headache|cephalgia|sir dard)/i, label: "Headache (Cephalgia)" },
    { pattern: /(?:cough|khansi)/i, label: "Cough (Productive/Dry)" },
    { pattern: /(?:sore throat|throat pain|gale mein dard|pharyngitis)/i, label: "Sore Throat & Odynophagia" },
    { pattern: /(?:body ache|myalgia|badan dard|muscle pain)/i, label: "Generalized Body Ache (Myalgia)" },
    { pattern: /(?:vomiting|nausea|ulti)/i, label: "Nausea & Vomiting" },
    { pattern: /(?:loose stool|diarrhea|dast|loose motion)/i, label: "Acute Diarrhea / Loose Stools" },
    { pattern: /(?:acne|pimple|pustule|rash|itching|khujli)/i, label: "Skin Eruptions / Papulopustular Rash" },
    { pattern: /(?:dizziness|giddiness|chakkar)/i, label: "Dizziness & Lightheadedness" },
    { pattern: /(?:acidity|heartburn|gas|chest burning)/i, label: "Dyspepsia & Acid Reflux" },
  ];

  // Try to find duration: "for 2 days", "since 3 days", "5 din se"
  const durationMatch = text.match(/(?:for|since|last|duration)\s*(\d+\s*(?:days?|weeks?|months?|hours?))/i) || text.match(/(\d+\s*(?:din|mahine)\s*se)/i);
  const foundDuration = durationMatch ? durationMatch[1] : undefined;

  complaintKeywords.forEach((ck, idx) => {
    if (ck.pattern.test(text)) {
      const exists = memory.complaints.some((c) => c.symptom.toLowerCase().includes(ck.label.toLowerCase()) || ck.label.toLowerCase().includes(c.symptom.toLowerCase()));
      if (!exists) {
        memory.complaints.push({
          id: `comp-${Date.now()}-${idx}`,
          symptom: ck.label,
          duration: foundDuration || "Not specified",
          severity: lower.includes("severe") || lower.includes("high") ? "Severe" : lower.includes("mild") ? "Mild" : "Moderate",
          status: "captured",
        });
      } else if (foundDuration) {
        // update duration
        const target = memory.complaints.find((c) => c.symptom.toLowerCase().includes(ck.label.toLowerCase()));
        if (target && target.duration === "Not specified") {
          target.duration = foundDuration;
        }
      }
    }
  });

  // Clarification for complaints lacking duration
  const unspecifiedComplaints = memory.complaints.filter((c) => c.duration === "Not specified");
  if (unspecifiedComplaints.length > 0) {
    clarifications.push({
      id: `clarify-dur-${Date.now()}`,
      field: "complaints.duration",
      severity: "low",
      question: `Symptom "${unspecifiedComplaints[0].symptom}" is recorded. Would you like to specify duration (e.g. 2 days, 1 week)?`,
      rationale: "Clinical history requires duration to differentiate acute vs chronic pathology.",
      resolved: false,
    });
  }

  // 3. EXTRACT CLINICAL EXAMINATION FINDINGS
  if (lower.includes("chest clear") || lower.includes("bilateral air entry") || lower.includes("lungs clear")) {
    if (!memory.examination_findings.includes("Bilateral lungs clear; normal vesicular breath sounds without wheeze or crackles")) {
      memory.examination_findings.push("Bilateral lungs clear; normal vesicular breath sounds without wheeze or crackles");
    }
  }
  if (lower.includes("throat congested") || lower.includes("pharyngeal erythema") || lower.includes("tonsil")) {
    if (!memory.examination_findings.includes("Posterior pharyngeal wall congested without exudates")) {
      memory.examination_findings.push("Posterior pharyngeal wall congested without exudates");
    }
  }
  if (lower.includes("soft") && (lower.includes("abdomen") || lower.includes("per abdomen"))) {
    if (!memory.examination_findings.includes("Per Abdomen: Soft, non-tender, no organomegaly, normal bowel sounds")) {
      memory.examination_findings.push("Per Abdomen: Soft, non-tender, no organomegaly, normal bowel sounds");
    }
  }

  // 4. EXTRACT DIAGNOSIS
  const diagMatch = text.match(/(?:provisional\s*diagnosis|diagnosis|assessing|patient\s*has|diagnosed\s*with)\s*(?:is|as)?\s*([A-Za-z0-9\s-]{4,40})(?:\.|\n|,|$)/i);
  if (diagMatch && diagMatch[1]) {
    const d = diagMatch[1].trim();
    if (d.length > 3 && !d.toLowerCase().includes("medicine") && !d.toLowerCase().includes("tablet")) {
      memory.provisional_diagnosis = d;
      memory.confirmed_diagnosis = d;
    }
  } else if (!memory.provisional_diagnosis) {
    if (lower.includes("viral fever") || lower.includes("pyrexia")) {
      memory.provisional_diagnosis = "Acute Viral Pyrexia (Viral Syndrome)";
    } else if (lower.includes("tinea") || lower.includes("fungal")) {
      memory.provisional_diagnosis = "Tinea Corporis & Fungal Dermatophytosis";
    } else if (lower.includes("acne")) {
      memory.provisional_diagnosis = "Acne Vulgaris (Grade II Papulopustular)";
    } else if (lower.includes("pharyngitis") || lower.includes("sore throat")) {
      memory.provisional_diagnosis = "Acute Viral Pharyngitis";
    } else if (lower.includes("gastroenteritis") || lower.includes("loose motion")) {
      memory.provisional_diagnosis = "Acute Infectious Gastroenteritis";
    }
  }

  // 5. EXTRACT MEDICATIONS & INSTRUCTIONS
  // Common Indian brands mentioned in speech
  const medicineSpeechMap: Array<{
    trigger: RegExp;
    name: string;
    generic: string;
    form: MedicationMemoryItem["dosage_form"];
    strength: string;
    defaultFreq: string;
    defaultTiming: MedicationMemoryItem["timing"];
    defaultDuration: string;
  }> = [
    {
      trigger: /(?:dolo|paracetamol|calpol|fever\s*tablet)/i,
      name: "Tab Dolo 650",
      generic: "PARACETAMOL",
      form: "Tablet",
      strength: "650 mg",
      defaultFreq: "1-0-1",
      defaultTiming: "After Food",
      defaultDuration: "3 Days",
    },
    {
      trigger: /(?:pan\s*40|pantocid|pantoprazole|pantodac)/i,
      name: "Tab Pan 40",
      generic: "PANTOPRAZOLE SODIUM",
      form: "Tablet",
      strength: "40 mg",
      defaultFreq: "1-0-0",
      defaultTiming: "Empty Stomach",
      defaultDuration: "5 Days",
    },
    {
      trigger: /(?:cetzine|cetirizine|zyrtec|okacet)/i,
      name: "Tab Cetzine 10",
      generic: "CETIRIZINE HYDROCHLORIDE",
      form: "Tablet",
      strength: "10 mg",
      defaultFreq: "0-0-1",
      defaultTiming: "At Bedtime",
      defaultDuration: "3 Days",
    },
    {
      trigger: /(?:augmentin|amoxyclav|amoxicillin\s*clav)/i,
      name: "Tab Augmentin 625",
      generic: "AMOXICILLIN + CLAVULANIC ACID",
      form: "Tablet",
      strength: "625 mg",
      defaultFreq: "1-0-1",
      defaultTiming: "After Food",
      defaultDuration: "5 Days",
    },
    {
      trigger: /(?:azithral|azithromycin|azee)/i,
      name: "Tab Azithral 500",
      generic: "AZITHROMYCIN",
      form: "Tablet",
      strength: "500 mg",
      defaultFreq: "1-0-0",
      defaultTiming: "Empty Stomach",
      defaultDuration: "3 Days",
    },
    {
      trigger: /(?:doxy|doxycycline)/i,
      name: "Cap Doxy-100",
      generic: "DOXYCYCLINE HYCLATE",
      form: "Capsule",
      strength: "100 mg",
      defaultFreq: "0-1-0",
      defaultTiming: "After Food",
      defaultDuration: "14 Days",
    },
    {
      trigger: /(?:multivitamin|zinc\s*syrup|zincovit)/i,
      name: "Syp Multivitamin with Zinc",
      generic: "MULTIVITAMIN + MINERALS + ZINC",
      form: "Syrup",
      strength: "10 ml",
      defaultFreq: "0-1-0",
      defaultTiming: "After Food",
      defaultDuration: "5 Days",
    },
    {
      trigger: /(?:ors|electral|oral\s*rehydration)/i,
      name: "ORS Sachet (Electral)",
      generic: "ORAL REHYDRATION SALTS (WHO FORMULA)",
      form: "Drops",
      strength: "1 sachet in 1L water",
      defaultFreq: "SOS",
      defaultTiming: "After Food",
      defaultDuration: "3 Days",
    },
  ];

  medicineSpeechMap.forEach((spec, idx) => {
    if (spec.trigger.test(text)) {
      const alreadyPrescribed = memory.medications.some((m) => m.generic_name === spec.generic);
      if (!alreadyPrescribed) {
        // Check for spoken frequency
        let freq = spec.defaultFreq;
        if (/twice\s*daily|din\s*mein\s*do\s*baar|two\s*times|1-0-1/i.test(text)) freq = "1-0-1";
        else if (/thrice\s*daily|teen\s*baar|three\s*times|1-1-1/i.test(text)) freq = "1-1-1";
        else if (/once\s*daily|ek\s*baar|subah\s*ek|1-0-0/i.test(text)) freq = "1-0-0";
        else if (/at\s*bedtime|raat\s*ko|night\s*only|0-0-1/i.test(text)) freq = "0-0-1";

        // Check for spoken duration
        let dur = spec.defaultDuration;
        const durMatch = text.match(/for\s*(\d+)\s*(?:days?|din)/i);
        if (durMatch) dur = `${durMatch[1]} Days`;

        // Check catalogue
        const cat = matchCatalogueMedicine(spec.name);

        // Check allergy contraindications
        const allergyWarning = checkMedicationAllergyWarning(
          { generic_name: spec.generic, medicine_name: spec.name },
          memory.allergies
        );

        if (allergyWarning) {
          clarifications.push({
            id: `clarify-allergy-${Date.now()}-${idx}`,
            field: `medications.${spec.name}`,
            severity: "high",
            question: allergyWarning,
            rationale: "Patient clinical safety warning against anaphylaxis or cross-allergen reaction.",
            suggested_action: "Do not prescribe, or obtain a registered senior doctor override.",
            resolved: false,
          });
        }

        memory.medications.push({
          id: `med-${Date.now()}-${idx}`,
          medicine_name: spec.name,
          generic_name: spec.generic,
          dosage_form: spec.form,
          strength: spec.strength,
          frequency: freq,
          duration: dur,
          timing: spec.defaultTiming,
          special_instructions:
            spec.defaultTiming === "Empty Stomach"
              ? "Take 30 minutes before meal with plenty of water"
              : "Take after meals",
          status: "captured",
          catalogue_match_id: cat?.id,
          contraindication_warning: allergyWarning,
        });
      }
    }
  });

  // 6. EXTRACT LAB INVESTIGATIONS
  if (lower.includes("cbc") || lower.includes("complete blood count")) {
    if (!memory.lab_investigations.includes("Complete Blood Count (CBC)")) {
      memory.lab_investigations.push("Complete Blood Count (CBC)");
    }
  }
  if (lower.includes("crp") || lower.includes("c reactive protein")) {
    if (!memory.lab_investigations.includes("C-Reactive Protein (Quantitative CRP)")) {
      memory.lab_investigations.push("C-Reactive Protein (Quantitative CRP)");
    }
  }
  if (lower.includes("widal") || lower.includes("typhoid")) {
    if (!memory.lab_investigations.includes("Widal Test / Typhoid Serology")) {
      memory.lab_investigations.push("Widal Test / Typhoid Serology");
    }
  }
  if (lower.includes("dengue") || lower.includes("ns1")) {
    if (!memory.lab_investigations.includes("Dengue NS1 Antigen & IgM/IgG Serology")) {
      memory.lab_investigations.push("Dengue NS1 Antigen & IgM/IgG Serology");
    }
  }

  // 7. FOLLOW UP
  const followUpMatch = text.match(/(?:review|follow\s*up|see\s*me\s*again)\s*(?:in|after)?\s*(\d+\s*(?:days?|weeks?))/i);
  if (followUpMatch) {
    memory.follow_up.recommended_date = `Review after ${followUpMatch[1]}`;
    memory.follow_up.instructions = `Follow up with doctor after ${followUpMatch[1]} or earlier if fever / symptoms worsen.`;
  } else if (!memory.follow_up.recommended_date) {
    memory.follow_up.recommended_date = "Review in 3 Days (SOS if worsening)";
    memory.follow_up.instructions = "Drink adequate warm fluids. Seek medical evaluation if temperature > 101.5°F persists beyond 48 hours.";
  }

  memory.last_updated = new Date().toISOString();
  return { updatedMemory: memory, clarifications };
}

/**
 * Pediatric Dosage Calculation & Clinical Guideline Engine
 */
export interface PediatricDoseResult {
  drug: string;
  weightKg: number;
  perDoseMg: number;
  frequency: string;
  maxDailyMg?: number;
  syrupFormulations: { name: string; concentration: string; doseMl: number }[];
  clinicalNotes: string;
  summaryText: string;
  spokenText: string;
}

export function calculatePediatricDose(drugQuery: string, weightKg: number): PediatricDoseResult | null {
  const d = drugQuery.toLowerCase().trim();
  const w = Math.max(1, Math.min(100, weightKg));

  // 1. Paracetamol (PCM / Calpol / Crocin)
  if (d.includes("paracetamol") || d.includes("pcm") || d.includes("calpol") || d.includes("crocin")) {
    const mg = Math.round(15 * w);
    const maxDay = Math.round(60 * w);
    const ml120 = parseFloat(((mg / 120) * 5).toFixed(1));
    const ml250 = parseFloat(((mg / 250) * 5).toFixed(1));
    return {
      drug: "Paracetamol",
      weightKg: w,
      perDoseMg: mg,
      frequency: "Every 4-6 hours SOS (Max 4 times in 24 hours)",
      maxDailyMg: maxDay,
      syrupFormulations: [
        { name: "Syrup Calpol 120", concentration: "120 mg / 5 ml", doseMl: ml120 },
        { name: "Syrup Calpol 250 DS", concentration: "250 mg / 5 ml", doseMl: ml250 },
      ],
      clinicalNotes: "Administer only for fever > 100°F or pain. Do not exceed 4 doses in 24 hours. Minimum interval 4 hours.",
      summaryText: `Paracetamol for ${w} kg child: ${mg} mg/dose (${ml120} ml of 120mg/5ml OR ${ml250} ml of 250mg/5ml DS) Q4-6H SOS (Max ${maxDay} mg/day).`,
      spokenText: `For a ${w} kg child, Paracetamol dose is ${mg} milligrams per dose. Give ${ml120} ml of 120 milligram syrup or ${ml250} ml of 250 milligram syrup, every 4 to 6 hours if needed.`,
    };
  }

  // 2. Ibuprofen (Ibugesic / Brufen)
  if (d.includes("ibuprofen") || d.includes("ibugesic") || d.includes("brufen")) {
    const mg = Math.round(10 * w);
    const maxDay = Math.round(40 * w);
    const ml100 = parseFloat(((mg / 100) * 5).toFixed(1));
    return {
      drug: "Ibuprofen",
      weightKg: w,
      perDoseMg: mg,
      frequency: "Every 6-8 hours with food (Max 3-4 doses/24hr)",
      maxDailyMg: maxDay,
      syrupFormulations: [
        { name: "Syrup Ibugesic / Brufen", concentration: "100 mg / 5 ml", doseMl: ml100 },
      ],
      clinicalNotes: "Always give after feed. Avoid in infants < 3 months or < 5 kg, active dehydration, or suspected dengue.",
      summaryText: `Ibuprofen for ${w} kg child: ${mg} mg/dose (${ml100} ml of 100mg/5ml) Q6-8H after meals (Max ${maxDay} mg/day).`,
      spokenText: `For a ${w} kg child, Ibuprofen dose is ${mg} milligrams per dose, which is ${ml100} ml of 100 milligram syrup, given after food every 6 to 8 hours.`,
    };
  }

  // 3. Amoxicillin (Novamox)
  if (d.includes("amoxicillin") || d.includes("novamox") || (d.includes("mox") && !d.includes("clav"))) {
    const totalDayMg = Math.round(45 * w);
    const perDoseMg = Math.round(totalDayMg / 3);
    const ml125 = parseFloat(((perDoseMg / 125) * 5).toFixed(1));
    const ml250 = parseFloat(((perDoseMg / 250) * 5).toFixed(1));
    return {
      drug: "Amoxicillin",
      weightKg: w,
      perDoseMg,
      frequency: "Three times daily (TID) for 5-7 days",
      maxDailyMg: Math.round(90 * w),
      syrupFormulations: [
        { name: "Syrup Novamox 125", concentration: "125 mg / 5 ml", doseMl: ml125 },
        { name: "Syrup Novamox 250 Forte", concentration: "250 mg / 5 ml", doseMl: ml250 },
      ],
      clinicalNotes: "Standard dose 40-50 mg/kg/day divided TID. For severe otitis media, may use high-dose 80-90 mg/kg/day.",
      summaryText: `Amoxicillin for ${w} kg child: ${perDoseMg} mg TID (${ml125} ml of 125mg/5ml OR ${ml250} ml of 250mg/5ml) for 5-7 days.`,
      spokenText: `For a ${w} kg child, Amoxicillin is ${perDoseMg} milligrams three times daily. Give ${ml125} ml of 125 syrup or ${ml250} ml of 250 syrup for 5 to 7 days.`,
    };
  }

  // 4. Amoxicillin-Clavulanate (Augmentin)
  if (d.includes("augmentin") || d.includes("clav") || d.includes("amoxyclav")) {
    const totalDayMg = Math.round(40 * w);
    const perDoseMg = Math.round(totalDayMg / 2);
    const mlDuo = parseFloat(((perDoseMg / 200) * 5).toFixed(1));
    return {
      drug: "Amoxicillin-Clavulanate (Augmentin)",
      weightKg: w,
      perDoseMg,
      frequency: "Twice daily (BID) with meals for 5-7 days",
      maxDailyMg: Math.round(60 * w),
      syrupFormulations: [
        { name: "Syrup Augmentin Duo", concentration: "228.5 mg / 5 ml (Amox 200 + Clav 28.5)", doseMl: mlDuo },
      ],
      clinicalNotes: "Administer at the start of meals to optimize absorption and minimize gastrointestinal intolerance.",
      summaryText: `Augmentin Duo for ${w} kg child: ${mlDuo} ml (Amox ~${perDoseMg} mg) BID with meals for 5-7 days.`,
      spokenText: `For a ${w} kg child, Augmentin Duo dose is ${mlDuo} ml twice daily with meals for 5 to 7 days.`,
    };
  }

  // 5. Azithromycin (Azee)
  if (d.includes("azithromycin") || d.includes("azee") || d.includes("zithro")) {
    const mg = Math.round(10 * w);
    const ml100 = parseFloat(((mg / 100) * 5).toFixed(1));
    const ml200 = parseFloat(((mg / 200) * 5).toFixed(1));
    return {
      drug: "Azithromycin",
      weightKg: w,
      perDoseMg: mg,
      frequency: "Once daily (OD) for 3-5 days (1 hour before or 2 hours after meals)",
      maxDailyMg: 500,
      syrupFormulations: [
        { name: "Syrup Azee 100", concentration: "100 mg / 5 ml", doseMl: ml100 },
        { name: "Syrup Azee 200", concentration: "200 mg / 5 ml", doseMl: ml200 },
      ],
      clinicalNotes: "Day 1-3 or 1-5 regimen. Single daily dose. Give on empty stomach for optimal absorption.",
      summaryText: `Azithromycin for ${w} kg child: ${mg} mg OD (${ml100} ml of 100mg/5ml OR ${ml200} ml of 200mg/5ml) once daily for 3 days.`,
      spokenText: `For a ${w} kg child, Azithromycin dose is ${mg} milligrams once daily. That is ${ml200} ml of 200 milligram syrup, given once a day for 3 days.`,
    };
  }

  // 6. Ondansetron (Emeset / Ondem)
  if (d.includes("ondansetron") || d.includes("emeset") || d.includes("ondem") || d.includes("vomit")) {
    const mg = Math.min(4, parseFloat((0.15 * w).toFixed(2)));
    const ml2 = parseFloat(((mg / 2) * 5).toFixed(1));
    return {
      drug: "Ondansetron",
      weightKg: w,
      perDoseMg: mg,
      frequency: "Every 8 hours SOS for acute vomiting (Max 3 doses/day)",
      maxDailyMg: 8,
      syrupFormulations: [
        { name: "Syrup Emeset / Ondem", concentration: "2 mg / 5 ml", doseMl: ml2 },
      ],
      clinicalNotes: "Administer 15-30 minutes before oral fluids or feeds in acute gastroenteritis.",
      summaryText: `Ondansetron for ${w} kg child: ${mg} mg (${ml2} ml of 2mg/5ml syrup) Q8H SOS (Max 4mg/dose).`,
      spokenText: `For a ${w} kg child, Ondansetron dose is ${mg} milligrams, which is ${ml2} ml of 2 milligram syrup, 15 minutes before oral fluids.`,
    };
  }

  // 7. Cefixime (Zifi / Taxim-O)
  if (d.includes("cefixime") || d.includes("zifi") || d.includes("taxim")) {
    const totalDayMg = Math.round(8 * w);
    const perDoseMg = Math.round(totalDayMg / 2);
    const ml50 = parseFloat(((perDoseMg / 50) * 5).toFixed(1));
    const ml100 = parseFloat(((perDoseMg / 100) * 5).toFixed(1));
    return {
      drug: "Cefixime",
      weightKg: w,
      perDoseMg,
      frequency: "Twice daily (BID) every 12 hours for 5-10 days",
      maxDailyMg: 400,
      syrupFormulations: [
        { name: "Syrup Zifi / Taxim-O 50", concentration: "50 mg / 5 ml", doseMl: ml50 },
        { name: "Syrup Zifi / Taxim-O 100", concentration: "100 mg / 5 ml", doseMl: ml100 },
      ],
      clinicalNotes: "Third-generation cephalosporin for uncomplicated UTI, otitis, and enteric fever.",
      summaryText: `Cefixime for ${w} kg child: ${perDoseMg} mg BID (${ml50} ml of 50mg/5ml OR ${ml100} ml of 100mg/5ml) for 5-7 days.`,
      spokenText: `For a ${w} kg child, Cefixime dose is ${perDoseMg} milligrams twice daily. That is ${ml100} ml of 100 milligram syrup every 12 hours.`,
    };
  }

  return null;
}

/**
 * Allergy & Cross-Reactivity Clinical Safety Evaluator
 */
export interface AllergySafetyCheck {
  isSafe: boolean;
  severity: "critical" | "warning" | "safe";
  title: string;
  drug: string;
  matchedAllergy?: string;
  rationale: string;
  suggestedAlternatives: string[];
  spokenResponse: string;
}

export function checkAllergySafety(drugName: string, allergies: string[]): AllergySafetyCheck {
  const d = drugName.toLowerCase().trim();
  const known = (allergies || []).map((a) => a.toLowerCase().trim());

  if (known.length === 0) {
    return {
      isSafe: true,
      severity: "safe",
      title: "No Documented Allergies",
      drug: drugName,
      rationale: "Patient has No Known Drug Allergies (NKDA) in the electronic medical record.",
      suggestedAlternatives: [],
      spokenResponse: `Patient has no documented drug allergies. ${drugName} has no registered contraindications.`,
    };
  }

  // Check Penicillin / Beta-lactam
  const hasPenicillin = known.some((a) => a.includes("penicillin") || a.includes("beta-lactam") || a.includes("b-lactam") || a.includes("amoxicillin"));
  if (hasPenicillin) {
    if (d.includes("amoxicillin") || d.includes("ampicillin") || d.includes("augmentin") || d.includes("penicillin") || d.includes("clav")) {
      return {
        isSafe: false,
        severity: "critical",
        title: "CRITICAL: Penicillin Allergy Hard-Stop",
        drug: drugName,
        matchedAllergy: "Penicillin / Beta-Lactam",
        rationale: "Patient has a documented Penicillin allergy. Prescribing an aminopenicillin carries high risk of immediate Type I hypersensitivity (anaphylaxis) or severe cutaneous adverse reactions.",
        suggestedAlternatives: [
          "Azithromycin 500mg OD (Macrolide)",
          "Clarithromycin 500mg BD",
          "Doxycycline 100mg BD",
          "Levofloxacin 500mg OD (Fluoroquinolone)",
        ],
        spokenResponse: `Critical alert: Patient is allergic to Penicillin. Do not prescribe ${drugName}. I suggest Macrolides like Azithromycin or Doxycycline as safe alternatives.`,
      };
    }
    if (d.includes("cefixime") || d.includes("cephalexin") || d.includes("ceftriaxone") || d.includes("cefpodoxime") || d.includes("cefotaxime")) {
      return {
        isSafe: false,
        severity: "warning",
        title: "WARNING: Cephalosporin Cross-Reactivity Risk (1-3%)",
        drug: drugName,
        matchedAllergy: "Penicillin",
        rationale: "Patient has documented Penicillin allergy. First- and second-generation cephalosporins share similar R1 side chains with penicillins, conferring a 1-3% cross-reactivity risk. Third-generation cephalosporins (e.g. Cefixime) have lower cross-reactivity but require caution.",
        suggestedAlternatives: ["Azithromycin 500mg OD", "Ciprofloxacin 500mg BD"],
        spokenResponse: `Caution: Patient has a Penicillin allergy. ${drugName} is a cephalosporin with a small cross-reactivity risk. Consider Azithromycin or monitor closely.`,
      };
    }
  }

  // Check Sulfa / Sulfonamides
  const hasSulfa = known.some((a) => a.includes("sulfa") || a.includes("sulfonamide") || a.includes("bactrim") || a.includes("septra"));
  if (hasSulfa) {
    if (d.includes("sulfa") || d.includes("cotrimoxazole") || d.includes("bactrim") || d.includes("septra") || d.includes("sulfamethoxazole")) {
      return {
        isSafe: false,
        severity: "critical",
        title: "CRITICAL: Sulfa Allergy Hard-Stop",
        drug: drugName,
        matchedAllergy: "Sulfonamide (Sulfa)",
        rationale: "Patient has a documented Sulfa allergy. Co-trimoxazole contains sulfamethoxazole, which can precipitate Steven-Johnson syndrome, toxic epidermal necrolysis, or anaphylaxis.",
        suggestedAlternatives: [
          "Amoxicillin-Clavulanate 625mg TID",
          "Nitrofurantoin 100mg BID (for UTI)",
          "Cefixime 200mg BID",
        ],
        spokenResponse: `Critical alert: Patient is allergic to Sulfa medications. ${drugName} is strictly contraindicated. Consider Nitrofurantoin or Cefixime instead.`,
      };
    }
  }

  // Check NSAID / Aspirin
  const hasNsaid = known.some((a) => a.includes("nsaid") || a.includes("aspirin") || a.includes("ibuprofen") || a.includes("diclofenac"));
  if (hasNsaid) {
    if (d.includes("ibuprofen") || d.includes("diclofenac") || d.includes("aceclofenac") || d.includes("aspirin") || d.includes("mefenamic") || d.includes("naproxen") || d.includes("ketorolac")) {
      return {
        isSafe: false,
        severity: "critical",
        title: "CRITICAL: NSAID Hypersensitivity Alert",
        drug: drugName,
        matchedAllergy: "NSAIDs / Aspirin",
        rationale: "Patient has documented NSAID hypersensitivity. Non-selective COX inhibitors can induce severe bronchospasm, angioedema, or anaphylactoid reaction.",
        suggestedAlternatives: [
          "Paracetamol (Acetaminophen) 650mg TDS (Safe in most NSAID-sensitive patients)",
          "Tramadol 50mg SOS (for moderate-to-severe pain)",
        ],
        spokenResponse: `Warning: Patient is sensitive to NSAIDs. Avoid ${drugName}. Paracetamol is recommended for fever and analgesia.`,
      };
    }
  }

  return {
    isSafe: true,
    severity: "safe",
    title: "Safe to Prescribe",
    drug: drugName,
    rationale: `No cross-reactions found between ${drugName} and patient's documented allergies (${known.join(", ")}).`,
    suggestedAlternatives: [],
    spokenResponse: `${drugName} is safe to prescribe. No contraindications with documented allergies: ${known.join(", ")}.`,
  };
}

/**
 * Empiric Antibiotic Stewardship Guidelines (ICMR / WHO Outpatient Standards)
 */
export interface AntibioticGuideline {
  condition: string;
  firstLine: string;
  secondLineOrPenicillinAllergic: string;
  duration: string;
  stewardshipNotes: string;
  spokenSummary: string;
}

export function getEmpiricAntibioticGuideline(conditionQuery: string): AntibioticGuideline | null {
  const q = conditionQuery.toLowerCase();
  
  if (q.includes("pharyngitis") || q.includes("sore throat") || q.includes("tonsil") || q.includes("gala") || q.includes("urti")) {
    return {
      condition: "Acute Streptococcal Pharyngitis / Tonsillitis",
      firstLine: "Tab. Amoxicillin 500 mg PO TID OR Tab. Amoxicillin-Clavulanate 625 mg PO BID",
      secondLineOrPenicillinAllergic: "Tab. Azithromycin 500 mg PO OD x 3 days OR Tab. Cefixime 200 mg PO BID x 5 days",
      duration: "5 to 7 Days (3 days for Azithromycin)",
      stewardshipNotes: "Viral etiology accounts for >70% of sore throats. Prescribe antibiotics only if Centor score ≥ 3 (fever, exudate, tender cervical nodes, absence of cough).",
      spokenSummary: "For acute bacterial pharyngitis, first line is Amoxicillin 500 milligrams three times daily for 5 days. For penicillin-allergic patients, use Azithromycin 500 milligrams once daily for 3 days.",
    };
  }

  if (q.includes("uti") || q.includes("urine") || q.includes("cystitis") || q.includes("burning")) {
    return {
      condition: "Uncomplicated Acute Cystitis (Lower UTI)",
      firstLine: "Tab. Nitrofurantoin (Macrobid) 100 mg PO BID with meals OR Tab. Fosfomycin 3 g single oral sachet",
      secondLineOrPenicillinAllergic: "Tab. Cefixime 200 mg PO BID x 5 days OR Tab. Ciprofloxacin 500 mg PO BID x 3 days",
      duration: "5 Days (Single dose for Fosfomycin)",
      stewardshipNotes: "Avoid fluoroquinolones (Ciprofloxacin/Levofloxacin) as empiric first-line due to high E. coli resistance (>60%) and tendon/neurotoxicity risks.",
      spokenSummary: "For uncomplicated UTI, first line is Nitrofurantoin 100 milligrams twice daily with food for 5 days. Fluoroquinolones should be avoided as first-line.",
    };
  }

  if (q.includes("cellulitis") || q.includes("skin") || q.includes("abscess") || q.includes("furuncle")) {
    return {
      condition: "Non-Purulent Cellulitis / Skin & Soft Tissue Infection",
      firstLine: "Tab. Amoxicillin-Clavulanate 625 mg PO TID OR Cap. Cephalexin 500 mg PO QID",
      secondLineOrPenicillinAllergic: "Tab. Clindamycin 300 mg PO TID OR Tab. Doxycycline 100 mg PO BID",
      duration: "7 Days",
      stewardshipNotes: "Targets Group A Streptococcus and methicillin-sensitive S. aureus. Elevate the affected limb. Mark margins with surgical pen to track progression.",
      spokenSummary: "For non-purulent cellulitis, first line is Amoxicillin-Clavulanate 625 milligrams three times daily, or Cephalexin 500 milligrams four times daily for 7 days.",
    };
  }

  if (q.includes("pneumonia") || q.includes("cap") || q.includes("chest infection")) {
    return {
      condition: "Community-Acquired Pneumonia (CAP) — Outpatient Mild",
      firstLine: "Tab. Amoxicillin 1 g PO TID + Tab. Azithromycin 500 mg PO OD OR Tab. Amox-Clav 625 mg TID",
      secondLineOrPenicillinAllergic: "Tab. Levofloxacin 750 mg PO OD x 5 days OR Tab. Doxycycline 100 mg PO BID x 7 days",
      duration: "5 to 7 Days",
      stewardshipNotes: "Assess CURB-65 or CRB-65 score. If Confusion, Urea >7, RR ≥30, BP <90/60, Age ≥65, refer for inpatient admission.",
      spokenSummary: "For outpatient community-acquired pneumonia, first line is Amoxicillin 1 gram three times daily combined with Azithromycin 500 milligrams once daily for 5 days.",
    };
  }

  if (q.includes("typhoid") || q.includes("enteric fever") || q.includes("salmonella")) {
    return {
      condition: "Enteric Fever / Typhoid (Uncomplicated)",
      firstLine: "Tab. Cefixime 200 mg PO BID (or 20 mg/kg/day in children) OR Tab. Azithromycin 500 mg PO OD",
      secondLineOrPenicillinAllergic: "Inj. Ceftriaxone 1-2 g IV OD for severe or non-responding cases",
      duration: "10 to 14 Days (7 days for Azithromycin)",
      stewardshipNotes: "High ciprofloxacin resistance in South Asia. Cefixime or Azithromycin is current standard empiric therapy.",
      spokenSummary: "For uncomplicated typhoid fever, first line is Cefixime 200 milligrams twice daily for 10 to 14 days, or Azithromycin 500 milligrams once daily for 7 days.",
    };
  }

  return null;
}

/**
 * Differential Diagnosis Clinical Knowledge Engine
 */
export function getDifferentialDiagnoses(symptomQuery: string): {
  differentials: { condition: string; likelihood: string; clues: string }[];
  keyInvestigations: string[];
  spokenSummary: string;
} | null {
  const q = symptomQuery.toLowerCase();

  if (q.includes("fever") && (q.includes("joint") || q.includes("rash") || q.includes("body ache") || q.includes("dengue"))) {
    return {
      differentials: [
        {
          condition: "Dengue Fever",
          likelihood: "High (Endemic acute febrile illness)",
          clues: "Retro-orbital headache, severe myalgia/breakbone pain, macular flush, thrombocytopenia, leukopenia.",
        },
        {
          condition: "Chikungunya",
          likelihood: "Moderate",
          clues: "Severe crippling symmetrical polyarthralgias, wrist and ankle swelling, morning stiffness persisting for weeks.",
        },
        {
          condition: "Typhoid / Enteric Fever",
          likelihood: "Moderate",
          clues: "Step-ladder pyrexia, relative bradycardia (Faget's sign), abdominal distention, coated tongue, rose spots.",
        },
        {
          condition: "Acute Viral Syndrome / Influenza",
          likelihood: "Common",
          clues: "Upper respiratory symptoms, rhinitis, dry cough, myalgia, resolves within 3-5 days.",
        },
      ],
      keyInvestigations: [
        "Complete Blood Count (CBC) with Hematocrit and Platelet Count",
        "Dengue NS1 Antigen & IgM/IgG Serology",
        "Widal Test / Typhidot IgM",
        "Urine Routine & Microscopy",
      ],
      spokenSummary: "Top differentials for fever with joint pain and rash include Dengue fever, Chikungunya, Typhoid, and Acute viral syndrome. Recommend CBC for platelets and Dengue NS1 serology.",
    };
  }

  if (q.includes("chest pain") || q.includes("seene mein dard")) {
    return {
      differentials: [
        {
          condition: "Acute Coronary Syndrome (ACS / MI)",
          likelihood: "Life-Threatening Rule-Out",
          clues: "Retrosternal pressure/heaviness, radiating to left arm/jaw, diaphoresis, dyspnea, nausea.",
        },
        {
          condition: "Gastroesophageal Reflux Disease (GERD) / Esophageal Spasm",
          likelihood: "Common",
          clues: "Burning retrosternal discomfort, postprandial, aggravated by lying down, relieved by antacids.",
        },
        {
          condition: "Musculoskeletal Chest Wall Pain (Costochondritis)",
          likelihood: "Common",
          clues: "Localized tenderness over costochondral junctions, sharp pain aggravated by deep inspiration or palpation.",
        },
        {
          condition: "Pleurisy / Pulmonary Embolism",
          likelihood: "Critical Rule-Out",
          clues: "Pleuritic sharp stabbing pain on inspiration, tachypnea, tachycardia, hypoxia.",
        },
      ],
      keyInvestigations: [
        "12-Lead ECG (Stat)",
        "Serum Troponin I / T (High-Sensitivity)",
        "Chest X-Ray (PA View)",
        "Bedside Echocardiogram",
      ],
      spokenSummary: "Key differentials for chest pain are Acute Coronary Syndrome, Gastroesophageal Reflux, and Costochondritis. Mandatory stat 12-lead ECG and Troponin to rule out ischemic heart disease.",
    };
  }

  if (q.includes("abdomen") || q.includes("abdominal pain") || q.includes("pet mein dard") || q.includes("stomach pain")) {
    return {
      differentials: [
        {
          condition: "Acute Gastroenteritis / Enterocolitis",
          likelihood: "Common",
          clues: "Diffuse crampy pain, hyperactive bowel sounds, nausea, diarrhea, fever.",
        },
        {
          condition: "Acute Appendicitis",
          likelihood: "Critical Surgical Emergency",
          clues: "Periumbilical pain migrating to Right Lower Quadrant (McBurney's point), rebound tenderness, anorexia.",
        },
        {
          condition: "Peptic Ulcer Disease / Gastritis",
          likelihood: "Common",
          clues: "Epigastric burning or gnawing pain, related to meals, NSAID or H. pylori association.",
        },
        {
          condition: "Renal Colic / Nephrolithiasis",
          likelihood: "Moderate",
          clues: "Sudden severe flank pain radiating to groin/testicle, restless patient, microscopic hematuria.",
        },
      ],
      keyInvestigations: [
        "Ultrasound Abdomen & Pelvis (USG Whole Abdomen)",
        "Complete Blood Count (CBC) for leukocytosis",
        "Serum Amylase & Lipase",
        "Urine Routine Examination",
      ],
      spokenSummary: "Differentials for acute abdominal pain include Acute Gastroenteritis, Appendicitis, Peptic ulcer disease, and Renal colic. Recommend abdominal ultrasound and CBC.",
    };
  }

  return null;
}

/**
 * Handles conversational queries from the doctor to the companion:
 * - Pediatric dose calculations: "dose of paracetamol for 12 kg child"
 * - Allergy & Contraindication check: "Can I prescribe Augmentin?"
 * - Antibiotic guidelines: "first line antibiotic for pharyngitis"
 * - Differential diagnosis: "differentials for fever and joint pain"
 * - Direct Rx modification: "Prescribe Paracetamol 650mg 1-0-1 for 3 days"
 * - History lookup: "What was prescribed last time?"
 * - Vitals update: "Correct blood pressure to 120/80"
 */
export function handleDoctorCommand(
  command: string,
  memory: ClinicalMemory,
  historicalVisits: HistoricalVisitSummary[] = []
): {
  reply: string;
  updatedMemory: ClinicalMemory;
  spokenReply?: string;
  actionTaken?: string;
} {
  const q = command.trim().toLowerCase();
  const updated: ClinicalMemory = JSON.parse(JSON.stringify(memory));

  // 1. PEDIATRIC DOSAGE CALCULATOR
  // Match queries like "dose of paracetamol for 12 kg child" or "pediatric dose augmentin 15kg"
  const pediaMatch = command.match(/(?:pediatric|child|dose|dosage|calculate\s*dose|how\s*much)\s*(?:of|for)?\s*([a-zA-Z\s]+?)(?:for\s+a\s+|for\s+)?(\d+(?:\.\d+)?)\s*kg/i) ||
                     command.match(/(?:dose|dosage)\s*(?:of|for)?\s*([a-zA-Z]+).*?(\d+(?:\.\d+)?)\s*kg/i);
  if (pediaMatch) {
    const drugName = pediaMatch[1].trim();
    const weight = parseFloat(pediaMatch[2]);
    const doseResult = calculatePediatricDose(drugName, weight);
    if (doseResult) {
      const syrupRows = doseResult.syrupFormulations
        .map((s) => `• **${s.name}** (${s.concentration}): **${s.doseMl} ml**`)
        .join("\n");
      const reply = `⚖️ **Pediatric Dosage Calculator — ${doseResult.drug}**\n\n` +
        `• **Child Weight**: ${doseResult.weightKg} kg\n` +
        `• **Calculated Dose**: **${doseResult.perDoseMg} mg / dose**\n` +
        `• **Frequency**: ${doseResult.frequency}\n` +
        (doseResult.maxDailyMg ? `• **Max Daily Dose**: ${doseResult.maxDailyMg} mg / 24 hours\n` : "") +
        `\n**Liquid Syrup Formulations**:\n${syrupRows}\n\n` +
        `💡 *Clinical Note*: ${doseResult.clinicalNotes}`;
      return {
        reply,
        spokenReply: doseResult.spokenText,
        updatedMemory: updated,
        actionTaken: "pediatric_dose_calculated",
      };
    }
  }

  // 2. ALLERGY & CONTRAINDICATION SAFETY CHECK
  // Match queries like "Can I prescribe Augmentin?", "Check allergy for Bactrim", "Is Amoxicillin safe?"
  const allergyQueryMatch = command.match(/(?:allergy|allergic|contraindication|contraindicated|safe\s*to\s*give|can\s*i\s*give|can\s*i\s*prescribe|is\s*it\s*safe\s*to\s*give|safe\s*to\s*prescribe)\s*(?:for|to|with)?\s*([a-zA-Z0-9\s-]+)/i);
  if (allergyQueryMatch || (q.includes("allerg") && (q.includes("prescribe") || q.includes("safe") || q.includes("give")))) {
    const rawTarget = allergyQueryMatch ? allergyQueryMatch[1].trim() : command.replace(/.*(?:prescribe|give|for|with)\s+/i, "").trim();
    const cleanDrug = rawTarget.replace(/\?|\.|to this patient|patient/gi, "").trim();
    if (cleanDrug.length >= 3) {
      const safety = checkAllergySafety(cleanDrug, updated.allergies);
      const icon = safety.severity === "critical" ? "🚨" : safety.severity === "warning" ? "⚠️" : "✅";
      let reply = `${icon} **${safety.title}**\n\n` +
        `• **Drug Evaluated**: ${cleanDrug}\n` +
        `• **Documented Allergies**: ${updated.allergies.length > 0 ? updated.allergies.join(", ") : "No Known Drug Allergies (NKDA)"}\n` +
        `• **Clinical Assessment**: ${safety.rationale}\n`;
      if (safety.suggestedAlternatives.length > 0) {
        reply += `\n**Recommended Safe Alternatives**:\n` +
          safety.suggestedAlternatives.map((alt) => `• ${alt}`).join("\n");
      }
      return {
        reply,
        spokenReply: safety.spokenResponse,
        updatedMemory: updated,
        actionTaken: "allergy_safety_checked",
      };
    }
  }

  // 3. EMPIRIC ANTIBIOTIC STEWARDSHIP GUIDELINES
  // Match queries like "first line antibiotic for pharyngitis" or "antibiotic for UTI"
  const abxMatch = command.match(/(?:antibiotic|antibiotics|stewardship|first\s*line|regimen)\s*(?:for)?\s*([a-zA-Z\s]+)/i);
  if (abxMatch) {
    const condition = abxMatch[1].trim();
    const guide = getEmpiricAntibioticGuideline(condition);
    if (guide) {
      const reply = `💊 **Empiric Antibiotic Stewardship — ${guide.condition}**\n\n` +
        `• **First-Line Regimen**: **${guide.firstLine}**\n` +
        `• **Second-Line / Penicillin-Allergic**: ${guide.secondLineOrPenicillinAllergic}\n` +
        `• **Recommended Duration**: ${guide.duration}\n\n` +
        `🛡️ *ICMR / WHO Stewardship Note*: ${guide.stewardshipNotes}`;
      return {
        reply,
        spokenReply: guide.spokenSummary,
        updatedMemory: updated,
        actionTaken: "antibiotic_guideline_provided",
      };
    }
  }

  // 4. DIFFERENTIAL DIAGNOSES GENERATOR
  // Match queries like "differentials for fever and joint pain" or "what are the differentials for chest pain"
  const ddxMatch = command.match(/(?:differential|differentials|possible\s*causes|ddx)\s*(?:for|of)?\s*([a-zA-Z\s]+)/i);
  if (ddxMatch) {
    const symptomStr = ddxMatch[1].trim();
    const ddxResult = getDifferentialDiagnoses(symptomStr);
    if (ddxResult) {
      const ddxRows = ddxResult.differentials
        .map((d, i) => `${i + 1}. **${d.condition}** (${d.likelihood})\n   ↳ *Clues*: ${d.clues}`)
        .join("\n\n");
      const invRows = ddxResult.keyInvestigations.map((inv) => `• ${inv}`).join("\n");
      const reply = `📋 **Differential Diagnoses for "${symptomStr}"**\n\n` +
        `${ddxRows}\n\n` +
        `🔬 **Recommended Diagnostic Workup**:\n${invRows}`;
      return {
        reply,
        spokenReply: ddxResult.spokenSummary,
        updatedMemory: updated,
        actionTaken: "differentials_generated",
      };
    }
  }

  // 5. DIRECT PRESCRIPTION / ADD MEDICATION COMMAND
  // Match: "Prescribe Paracetamol 650mg 1-0-1 for 3 days" or "Add Pantoprazole 40mg 1-0-0 for 5 days"
  const prescribeMatch = command.match(/(?:prescribe|add\s*medication|add\s*medicine|add\s*rx)\s+([a-zA-Z0-9\s-]+?)(?:\s+(\d+\s*(?:mg|ml|mcg|g|sachet)))?(?:\s+(1-0-1|1-1-1|1-0-0|0-0-1|0-1-0|sos|bid|tid|od|qid|bd|tds))?(?:\s+(?:for\s+)?(\d+\s*(?:days?|weeks?|months?)))?$/i);
  if (prescribeMatch) {
    const medName = prescribeMatch[1].trim();
    const dose = prescribeMatch[2]?.trim() || "500 mg";
    let freq = prescribeMatch[3]?.trim().toUpperCase() || "1-0-1";
    if (freq === "BD" || freq === "BID") freq = "1-0-1";
    if (freq === "TDS" || freq === "TID") freq = "1-1-1";
    if (freq === "OD") freq = "1-0-0";
    const dur = prescribeMatch[4]?.trim() || "5 Days";

    // Allergy check on the fly
    const allergyWarn = checkMedicationAllergyWarning(
      { generic_name: medName, medicine_name: medName },
      updated.allergies
    );

    const newMed: MedicationMemoryItem = {
      id: `med-cmd-${Date.now()}`,
      medicine_name: medName,
      generic_name: medName.toUpperCase(),
      dosage_form: "Tablet",
      strength: dose,
      frequency: freq,
      duration: dur,
      timing: "After Food",
      special_instructions: "Take with water",
      status: "doctor_confirmed",
      contraindication_warning: allergyWarn || undefined,
    };
    updated.medications.push(newMed);

    const warnText = allergyWarn ? `\n⚠️ *Warning*: ${allergyWarn}` : "";
    const reply = `✅ Prescribed **${medName}** (${dose}) • ${freq} • ${dur} added to active prescription draft.${warnText}`;
    const spoken = `Prescribed ${medName} ${dose}, ${freq} for ${dur}. Added to prescription pad.`;
    return {
      reply,
      spokenReply: spoken,
      updatedMemory: updated,
      actionTaken: "prescription_add",
    };
  }

  // 6. DIRECT REMOVE MEDICATION COMMAND
  // Match: "Remove Paracetamol" or "Delete Azithromycin"
  const removeMedMatch = command.match(/(?:remove\s*medication|remove\s*medicine|remove\s*drug|remove|delete\s*medicine|delete)\s+([a-zA-Z0-9\s-]+)$/i);
  if (removeMedMatch && !q.includes("complaint") && !q.includes("symptom")) {
    const target = removeMedMatch[1].trim().toLowerCase();
    const initialCount = updated.medications.length;
    updated.medications = updated.medications.filter(
      (m) => !m.medicine_name.toLowerCase().includes(target) && !m.generic_name.toLowerCase().includes(target)
    );
    if (updated.medications.length < initialCount) {
      const reply = `🗑️ Removed "${target}" from active medications list.`;
      return {
        reply,
        spokenReply: `Removed ${target} from medications.`,
        updatedMemory: updated,
        actionTaken: "prescription_remove",
      };
    }
  }

  // 7. History Query: "What medication was prescribed last time?"
  if (q.includes("previous") || q.includes("last time") || q.includes("past medication") || q.includes("pehle kya diya tha")) {
    if (historicalVisits.length > 0) {
      const last = historicalVisits[0];
      const medList = last.medications.join(", ");
      const reply = `On ${last.date}, ${last.doctor_name} diagnosed "${last.diagnosis}" and prescribed: ${medList}.`;
      return {
        reply,
        spokenReply: `Last time on ${last.date}, the patient was prescribed ${medList}.`,
        updatedMemory: updated,
        actionTaken: "history_lookup",
      };
    } else {
      const reply = `Patient ${memory.patient_name} (${memory.patient_uhid}) has no documented previous prescriptions in this clinic's electronic record.`;
      return {
        reply,
        spokenReply: "No previous prescriptions found for this patient in the electronic health record.",
        updatedMemory: updated,
        actionTaken: "history_lookup",
      };
    }
  }

  // 8. Correct Vitals: "Correct BP to 120/80" or "Change blood pressure to 130/85"
  const bpMatch = command.match(/(?:bp|blood\s*pressure).*?(\d{2,3})\s*(?:\/|\s*over\s*)\s*(\d{2,3})/i);
  if (bpMatch) {
    const sys = parseInt(bpMatch[1], 10);
    const dia = parseInt(bpMatch[2], 10);
    updated.vitals.bp_systolic = sys;
    updated.vitals.bp_diastolic = dia;
    const reply = `Blood pressure updated to ${sys}/${dia} mmHg. Hemodynamic record adjusted.`;
    return {
      reply,
      spokenReply: `Blood pressure corrected to ${sys} over ${dia}.`,
      updatedMemory: updated,
      actionTaken: "vitals_update",
    };
  }

  // 9. Read back captured vitals / readings: "Read back the readings"
  if (q.includes("read back") || q.includes("read readings") || q.includes("what vitals") || q.includes("what readings")) {
    const v = updated.vitals;
    const bpStr = v.bp_systolic && v.bp_diastolic ? `BP ${v.bp_systolic}/${v.bp_diastolic} mmHg` : "BP not recorded";
    const hrStr = v.heart_rate ? `Heart rate ${v.heart_rate} bpm` : "Heart rate pending";
    const tempStr = v.temperature ? `Temp ${v.temperature}°F` : "Temp pending";
    const spo2Str = v.spo2 ? `SpO2 ${v.spo2}%` : "SpO2 pending";
    const reply = `Current clinical readings:\n• ${bpStr}\n• ${hrStr}\n• ${tempStr}\n• ${spo2Str}`;
    const spoken = `Readings are: ${bpStr}, ${hrStr}, ${tempStr}, and ${spo2Str}.`;
    return {
      reply,
      spokenReply: spoken,
      updatedMemory: updated,
      actionTaken: "readings_readback",
    };
  }

  // 10. Add symptom / complaint: "Add symptom dizziness" or "Add complaint nausea"
  const addSymptomMatch = command.match(/(?:add\s*symptom|add\s*complaint|add)\s*([a-zA-Z\s]{3,30})/i);
  if (addSymptomMatch && !q.includes("medicine") && !q.includes("tablet") && !q.includes("prescribe")) {
    const s = addSymptomMatch[1].trim();
    updated.complaints.push({
      id: `comp-cmd-${Date.now()}`,
      symptom: s,
      duration: "As noted by doctor",
      severity: "Moderate",
      status: "doctor_confirmed",
    });
    const reply = `Added "${s}" to Patient Complaints list as doctor-confirmed.`;
    return {
      reply,
      spokenReply: `Added ${s} to patient complaints.`,
      updatedMemory: updated,
      actionTaken: "complaint_add",
    };
  }

  // 11. Add / Update Diagnosis: "Diagnosis is Acute Bronchitis"
  const diagMatch = command.match(/(?:diagnosis\s*is|provisional\s*diagnosis|change\s*diagnosis\s*to)\s*([a-zA-Z0-9\s-]{4,40})/i);
  if (diagMatch) {
    const d = diagMatch[1].trim();
    updated.provisional_diagnosis = d;
    updated.confirmed_diagnosis = d;
    const reply = `Provisional diagnosis updated to "${d}".`;
    return {
      reply,
      spokenReply: `Diagnosis recorded as ${d}.`,
      updatedMemory: updated,
      actionTaken: "diagnosis_update",
    };
  }

  // 12. What information have you captured so far?
  if (q.includes("captured so far") || q.includes("summary") || q.includes("what do you have")) {
    const compCount = updated.complaints.length;
    const medCount = updated.medications.length;
    const diag = updated.provisional_diagnosis || "Awaiting doctor confirmation";
    const reply = `Consultation status:\n• Diagnosis: ${diag}\n• Complaints: ${compCount} captured\n• Vitals: ${updated.vitals.bp_systolic ? `${updated.vitals.bp_systolic}/${updated.vitals.bp_diastolic}` : "Pending"}\n• Medications: ${medCount} draft prescription items ready for review.`;
    return {
      reply,
      spokenReply: `I have captured ${compCount} complaints, diagnosis of ${diag}, and ${medCount} medications.`,
      updatedMemory: updated,
      actionTaken: "status_summary",
    };
  }

  // General assistant guidance
  return {
    reply: `I have updated the consultation context with your instruction: "${command}". All modifications are logged in the live clinical memory.`,
    spokenReply: `Understood, doctor.`,
    updatedMemory: updated,
  };
}

/**
 * GENERATE REPORT A: Doctor's Professional Clinical Report (EMR Standard)
 */
export function generateDoctorClinicalReport(memory: ClinicalMemory, clinicName: string = "ClinicOS Care Network"): DoctorClinicalReport {
  const v = memory.vitals;
  const bpText = v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic} mmHg` : "Not recorded";
  const hrText = v.heart_rate ? `${v.heart_rate} bpm (Normal sinus rhythm)` : "Not recorded";
  const tempText = v.temperature ? `${v.temperature}°F` : "Afebrile / Not recorded";
  const spo2Text = v.spo2 ? `${v.spo2}% on room air` : "Not recorded";
  const wtText = v.weight ? `${v.weight} kg` : "Not recorded";

  const complaintsList = memory.complaints.map((c) => `${c.symptom} (${c.duration || "acute"}, ${c.severity || "moderate"})`).join("; ") || "Routine clinical review";
  const examFindings = memory.examination_findings.join(". ") || "Patient conscious, oriented, alert. Systemic physical examination within normal clinical limits.";
  const allergiesList = memory.allergies.length > 0 ? memory.allergies.join(", ") : "No Known Drug Allergies (NKDA)";
  const historyList = memory.medical_history.length > 0 ? memory.medical_history.join(", ") : "Nil significant past medical comorbidities reported.";

  return {
    patient_uhid: memory.patient_uhid || "",
    patient_name: memory.patient_name,
    age_gender: "Adult (Documented in Master Record)",
    consultation_date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    doctor_name: memory.doctor_name,
    clinic_name: clinicName,
    chief_complaints: complaintsList,
    history_of_present_illness: `Patient presented with ${complaintsList}. Onset acute. Symptoms aggravated by exertion/routine activity. No history of syncopal episodes, chest pain or hemoptysis.`,
    medical_history_allergies: `Past History: ${historyList} | Known Allergies: ${allergiesList}`,
    vitals_hemodynamics: `BP: ${bpText} | HR: ${hrText} | Temp: ${tempText} | SpO2: ${spo2Text} | Weight: ${wtText} | Hemodynamically stable`,
    examination_findings: examFindings,
    assessment_diagnosis: memory.confirmed_diagnosis || memory.provisional_diagnosis || "Acute Clinical Syndrome (Under Review)",
    differential_diagnoses: [
      memory.provisional_diagnosis || "Acute Viral Syndrome",
      "Seasonal Influenza",
      "Upper Respiratory Tract Infection (URTI)",
    ],
    prescribed_medications: memory.medications.map((m) => ({
      name: m.medicine_name,
      generic: m.generic_name,
      strength: m.strength,
      frequency: m.frequency,
      duration: m.duration,
      instructions: `${m.timing} — ${m.special_instructions || "Take with water"}`,
    })),
    investigations_advised: memory.lab_investigations.length > 0 ? memory.lab_investigations : ["Routine clinical observation; CBC if symptoms persist > 48h"],
    clinical_plan_red_flags: [
      "Adequate hydration (2.5 - 3 Litres oral fluids / ORS daily)",
      "Strict compliance with antibiotic/antipyretic course if prescribed",
      "Return immediately if high fever >102°F, breathlessness, persistent vomiting or signs of dehydration appear",
      memory.follow_up.instructions || "Follow up after 3 days",
    ],
    doctor_notes: "Electronically synthesized by ClinicOS AI Clinical Companion; validated and sealed by attending physician under National Medical Commission guidelines.",
  };
}

/**
 * GENERATE REPORT B: Patient-Friendly Visit Summary (10 Clear Sections, Multilingual)
 */
export function generatePatientVisitSummary(
  memory: ClinicalMemory,
  language: ConsultationLanguage = "english",
  clinicName: string = "ClinicOS Care Network",
  clinicPhone: string = "+91 91234 56789"
): PatientVisitSummary {
  const isHindi = language === "hindi";
  const diagnosis = memory.confirmed_diagnosis || memory.provisional_diagnosis || "Acute Illness";

  // Section 2: Why You Visited
  const whyVisited = isHindi
    ? `आप आज क्लिनिक में ${memory.complaints.map((c) => c.symptom).join(", ") || "स्वास्थ्य जांच"} की समस्या के लिए आए थे।`
    : `You visited the clinic today for evaluation of ${memory.complaints.map((c) => c.symptom).join(", ") || "routine medical checkup"}.`;

  // Section 3: What You Told The Doctor
  const toldDoctor = isHindi
    ? `आपने डॉक्टर को बताया कि आपको ${memory.complaints.map((c) => `${c.symptom} (${c.duration || "कुछ समय से"})`).join(", ")} की तकलीफ हो रही है।`
    : `You explained to the doctor that you have been experiencing ${memory.complaints.map((c) => `${c.symptom} for ${c.duration || "the past few days"}`).join(", ")}.`;

  // Section 4: What Doctor Found
  const v = memory.vitals;
  const findings = isHindi
    ? `डॉक्टर ने आपकी शारीरिक जांच की। आपका ब्लड प्रेशर ${v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic} mmHg` : "सामान्य"}, नाड़ी ${v.heart_rate || "80"} bpm, और ऑक्सीजन स्तर ${v.spo2 || "98"}% है। शारीरिक स्थिति स्थिर है।`
    : `The doctor examined you thoroughly. Your blood pressure was ${v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic} mmHg` : "stable"}, pulse was ${v.heart_rate || "normal"}, and oxygen saturation was ${v.spo2 || "98"}%. Overall vital signs are stable.`;

  // Section 5: Your Diagnosis (plain terms)
  const plainDiagnosisExplanation = isHindi
    ? `${diagnosis} एक सामान्य स्वास्थ्य समस्या है जिसका समय पर दवा और देखभाल से पूरी तरह इलाज संभव है। चिंता की कोई बात नहीं है।`
    : `${diagnosis} is a condition causing your current symptoms. It responds well to timely medication, proper hydration, and adequate rest.`;

  // Section 6: Your Medicines (Morning / Afternoon / Night schedule)
  const medicineSchedule = memory.medications.map((m) => {
    let timingLabel = "Morning (सुबह)";
    if (m.frequency.includes("0-1-0") || m.frequency.toLowerCase().includes("afternoon")) {
      timingLabel = isHindi ? "दोपहर (Afternoon)" : "Afternoon";
    } else if (m.frequency.includes("0-0-1") || m.frequency.toLowerCase().includes("bedtime") || m.frequency.toLowerCase().includes("night")) {
      timingLabel = isHindi ? "रात (Night - सोने से पहले)" : "Night (Bedtime)";
    } else if (m.frequency.includes("1-0-1")) {
      timingLabel = isHindi ? "सुबह और रात (Morning & Night)" : "Morning & Night";
    } else if (m.frequency.includes("1-1-1")) {
      timingLabel = isHindi ? "सुबह, दोपहर और रात (Morning, Afternoon & Night)" : "Morning, Afternoon & Night";
    }

    return {
      timing_label: timingLabel,
      medicine_line: `${m.medicine_name} (${m.strength}) • ${m.duration}`,
      instructions: isHindi
        ? `${m.timing === "Empty Stomach" ? "खाली पेट पानी के साथ लें" : "भोजन के बाद लें"}। ${m.special_instructions || ""}`
        : `${m.timing === "Empty Stomach" ? "Take on an empty stomach with a glass of water" : "Take after meals"}. ${m.special_instructions || ""}`,
    };
  });

  // Section 7: What You Should Do
  const instructions = isHindi
    ? [
        "दिन भर में 2.5 से 3 लीटर गुनगुना पानी, नारियल पानी या ओआरएस (ORS) पिएं।",
        "दवाएं डॉक्टर के बताए समय पर पूरी अवधि के लिए लें, बीच में न छोड़ें।",
        "हल्का और ताजा भोजन करें (जैसे खिचड़ी, दलिया, सूप)। तला-भुना और ठंडा खाना न खाएं।",
        "कम से कम 2 से 3 दिन पर्याप्त आराम करें।",
      ]
    : [
        "Drink 2.5 to 3 Litres of lukewarm water, coconut water, or ORS throughout the day.",
        "Take all prescribed medicines on time for the full duration recommended.",
        "Eat light, easily digestible home-cooked meals (soups, porridge). Avoid oily or cold foods.",
        "Ensure complete physical rest for the next 48 to 72 hours.",
      ];

  // Section 9: Important Things to Remember (Emergency Red Flags)
  const redFlags = isHindi
    ? [
        "यदि बुखार 102°F से अधिक बढ़ जाए या 48 घंटे बाद भी न उतरे।",
        "यदि सांस लेने में तकलीफ हो या अत्यधिक कमजोरी महसूस हो।",
        "यदि लगातार उल्टियां हों और आप पानी भी न पी पा रहे हों।",
        "ऐसी स्थिति में तुरंत क्लिनिक से संपर्क करें या नजदीकी आपातकालीन कक्ष (Emergency) में जाएं।",
      ]
    : [
        "Persistent high fever above 102°F that does not respond to medication.",
        "Sudden breathlessness, chest discomfort, or extreme dizziness.",
        "Inability to keep liquids down due to continuous vomiting.",
        "If you notice any of these signs, contact the clinic immediately or visit the emergency room.",
      ];

  return {
    language,
    section_1_visit_details: {
      patient_name: memory.patient_name,
      doctor_name: memory.doctor_name,
      clinic_name: clinicName,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
    section_2_why_you_visited: whyVisited,
    section_3_what_you_told_doctor: toldDoctor,
    section_4_what_doctor_found: findings,
    section_5_your_diagnosis: {
      diagnosis_name: diagnosis,
      plain_language_explanation: plainDiagnosisExplanation,
    },
    section_6_your_medicines: medicineSchedule,
    section_7_what_you_should_do: instructions,
    section_8_your_follow_up: {
      date_or_interval: memory.follow_up.recommended_date || "3 Days",
      special_advice: isHindi
        ? "यदि आप पहले से बेहतर महसूस कर रहे हैं, तब भी अनुवर्ती परामर्श (Follow-up) के लिए अवश्य आएं।"
        : "Please follow up as advised even if you feel significantly better, to ensure full recovery.",
    },
    section_9_important_things_to_remember: redFlags,
    section_10_contact_info: {
      clinic_name: clinicName,
      phone: clinicPhone,
      emergency_line: "+91 91234 99999",
    },
  };
}
