import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Medication {
  medicine_name: string;
  generic_name?: string;
}

// Known high-risk clinical drug-drug interactions
const DRUG_INTERACTION_RULES: Array<{
  drugA: string[];
  drugB: string[];
  severity: "CRITICAL" | "MODERATE";
  mechanism: string;
  recommendation: string;
}> = [
  {
    drugA: ["aspirin", "ecospirin", "clopidogrel"],
    drugB: ["warfarin", "heparin", "apixaban", "rivaroxaban"],
    severity: "CRITICAL",
    mechanism: "Synergistic antiplatelet and anticoagulant effect dramatically elevates GI and systemic bleeding risk.",
    recommendation: "Avoid concurrent use unless strictly indicated under continuous PT/INR monitoring."
  },
  {
    drugA: ["methotrexate"],
    drugB: ["ibuprofen", "diclofenac", "naproxen", "aceclofenac"],
    severity: "CRITICAL",
    mechanism: "NSAIDs reduce renal clearance of methotrexate, causing severe methotrexate toxicity and bone marrow suppression.",
    recommendation: "Hold NSAID or substitute with acetaminophen/paracetamol."
  },
  {
    drugA: ["sildenafil", "tadalafil", "vardenafil"],
    drugB: ["nitroglycerin", "isosorbide", "sorbitrate", "monit"],
    severity: "CRITICAL",
    mechanism: "Potentiates hypotensive effects, risking fatal cardiovascular collapse and refractory hypotension.",
    recommendation: "Strictly contraindicated. Concomitant administration is hazardous."
  },
  {
    drugA: ["ciprofloxacin", "levofloxacin", "ofloxacin"],
    drugB: ["antacid", "sucralfate", "iron", "calcium"],
    severity: "MODERATE",
    mechanism: "Chelation reduces fluoroquinolone bioavailability and clinical efficacy.",
    recommendation: "Separate administration by at least 2 hours."
  },
  {
    drugA: ["fluconazole", "ketoconazole", "itraconazole"],
    drugB: ["atorvastatin", "simvastatin"],
    severity: "MODERATE",
    mechanism: "CYP3A4 inhibition elevates statin plasma concentration, raising rhabdomyolysis and myopathy risk.",
    recommendation: "Temporarily pause statin during short antifungal courses or reduce dose."
  }
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { medications = [], patient_allergies = [] } = body;

    const alerts: Array<{
      type: "DRUG_DRUG" | "ALLERGY_OVERRIDE" | "DUPLICATE_THERAPY";
      severity: "CRITICAL" | "MODERATE" | "INFO";
      title: string;
      description: string;
      action_required: boolean;
    }> = [];

    const medNames = (medications as Medication[]).map(m => 
      `${m.medicine_name || ""} ${m.generic_name || ""}`.toLowerCase().trim()
    );

    const allergies = (Array.isArray(patient_allergies) ? patient_allergies : [])
      .map((a: any) => (typeof a === "string" ? a : a.allergen || a.name || "").toLowerCase().trim())
      .filter(Boolean);

    // 1. Check Drug-Allergy Collisions
    for (const allergy of allergies) {
      for (const med of medNames) {
        if (
          (allergy.includes("penicillin") && (med.includes("amoxicillin") || med.includes("augmentin") || med.includes("penicillin") || med.includes("ampicillin"))) ||
          (allergy.includes("sulfa") && (med.includes("bactrim") || med.includes("septran") || med.includes("sulfamethoxazole"))) ||
          (allergy.includes("nsaid") && (med.includes("ibuprofen") || med.includes("diclofenac") || med.includes("aceclofenac") || med.includes("aspirin")))
        ) {
          alerts.push({
            type: "ALLERGY_OVERRIDE",
            severity: "CRITICAL",
            title: `Known Drug Allergy Collision: ${allergy.toUpperCase()}`,
            description: `Patient has documented allergy to ${allergy}. Prescribed medication contains cross-reactive compounds. Dispensing may trigger anaphylaxis.`,
            action_required: true
          });
        }
      }
    }

    // 2. Check Drug-Drug Interactions
    for (let i = 0; i < medNames.length; i++) {
      for (let j = i + 1; j < medNames.length; j++) {
        const med1 = medNames[i];
        const med2 = medNames[j];

        for (const rule of DRUG_INTERACTION_RULES) {
          const matchA1 = rule.drugA.some(d => med1.includes(d));
          const matchB2 = rule.drugB.some(d => med2.includes(d));
          const matchA2 = rule.drugA.some(d => med2.includes(d));
          const matchB1 = rule.drugB.some(d => med1.includes(d));

          if ((matchA1 && matchB2) || (matchA2 && matchB1)) {
            alerts.push({
              type: "DRUG_DRUG",
              severity: rule.severity,
              title: `${rule.severity === "CRITICAL" ? "Severe" : "Moderate"} Interaction: ${rule.drugA[0].toUpperCase()} + ${rule.drugB[0].toUpperCase()}`,
              description: `${rule.mechanism} Recommendation: ${rule.recommendation}`,
              action_required: rule.severity === "CRITICAL"
            });
          }
        }
      }
    }

    const hasCritical = alerts.some(a => a.severity === "CRITICAL");
    const status = hasCritical ? "CRITICAL" : alerts.length > 0 ? "WARNING" : "SAFE";

    return NextResponse.json({
      success: true,
      data: {
        status,
        has_interactions: alerts.length > 0,
        alerts_count: alerts.length,
        alerts,
        checked_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Prescription safety check error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
