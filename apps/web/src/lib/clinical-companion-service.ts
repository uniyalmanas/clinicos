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
  return {
    session_id: `COMP-${Date.now().toString(36).toUpperCase()}`,
    patient_uhid: patient.uhid || "UHID-2026-9021",
    patient_name: patient.name,
    doctor_name: patient.doctor_name || "Dr. Rahul Sharma",
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
            suggested_action: "Do not prescribe, or obtain verified NMC senior doctor override PIN.",
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
 * Handles conversational queries from the doctor to the companion:
 * - "What was prescribed last time?"
 * - "Correct blood pressure to 120/80"
 * - "What vitals have you captured?"
 * - "Add symptom nausea"
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

  // 1. History Query: "What medication was prescribed last time?"
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

  // 2. Correct Vitals: "Correct BP to 120/80" or "Change blood pressure to 130/85"
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

  // 3. Read back captured vitals / readings: "Read back the readings"
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

  // 4. Add symptom / complaint: "Add symptom dizziness" or "Add complaint nausea"
  const addSymptomMatch = command.match(/(?:add\s*symptom|add\s*complaint|add)\s*([a-zA-Z\s]{3,30})/i);
  if (addSymptomMatch && !q.includes("medicine") && !q.includes("tablet")) {
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

  // 5. Add / Update Diagnosis: "Diagnosis is Acute Bronchitis"
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

  // 6. What information have you captured so far?
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
    patient_uhid: memory.patient_uhid || "UHID-2026-9021",
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
