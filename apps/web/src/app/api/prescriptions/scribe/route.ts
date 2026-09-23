import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dictation = (body.dictation_text || "").trim();

    if (!dictation) {
      return NextResponse.json({ error: "No dictation text provided" }, { status: 400 });
    }

    // Clinical Scribe Heuristic / Rule-based parser
    const vitals: Record<string, string> = {};
    
    // BP extraction
    const bpMatch = dictation.match(/\b(?:bp|blood pressure)\s*(?:is|:)?\s*(\d{2,3}\s*\/\s*\d{2,3})\b/i) || dictation.match(/\b(\d{2,3}\/\d{2,3})\b/);
    if (bpMatch) vitals.bp = bpMatch[1].replace(/\s+/g, "");

    // Pulse extraction
    const pulseMatch = dictation.match(/\b(?:pulse|heart rate|hr)\s*(?:is|:)?\s*(\d{2,3})\b/i);
    if (pulseMatch) vitals.pulse = pulseMatch[1];

    // Temp extraction
    const tempMatch = dictation.match(/\b(?:temp|temperature|fever)\s*(?:is|:)?\s*(\d{2,3}(?:\.\d)?)\b/i);
    if (tempMatch) vitals.temp = tempMatch[1];

    // SpO2 extraction
    const spo2Match = dictation.match(/\b(?:spo2|oxygen|o2)\s*(?:is|:)?\s*(\d{2,3})\b/i);
    if (spo2Match) vitals.spo2 = spo2Match[1];

    // Weight extraction
    const wtMatch = dictation.match(/\b(?:weight|wt)\s*(?:is|:)?\s*(\d{2,3}(?:\.\d)?)\s*(?:kg)?\b/i);
    if (wtMatch) vitals.weight = wtMatch[1];

    // Medicines extraction
    const medicines: any[] = [];
    const lower = dictation.toLowerCase();

    if (lower.includes("doxy") || lower.includes("doxycycline")) {
      medicines.push({
        medicine_name: "Tab Doxy-100",
        generic_name: "DOXYCYCLINE HYCLATE",
        dosage_form: "Capsule",
        strength: "100 mg",
        frequency: "1-0-1",
        duration: "14 Days",
        special_instructions: "Take with full glass of water after food."
      });
    }

    if (lower.includes("clindamycin") || lower.includes("clindac")) {
      medicines.push({
        medicine_name: "Clindac-A Gel",
        generic_name: "CLINDAMYCIN PHOSPHATE",
        dosage_form: "Gel",
        strength: "1% w/w",
        frequency: "1-0-0",
        duration: "14 Days",
        special_instructions: "Apply thin layer on lesions in morning."
      });
    }

    if (lower.includes("dolo") || lower.includes("paracetamol") || lower.includes("fever")) {
      medicines.push({
        medicine_name: "Dolo 650",
        generic_name: "PARACETAMOL",
        dosage_form: "Tablet",
        strength: "650 mg",
        frequency: "1-1-1",
        duration: "3 Days",
        special_instructions: "Take SOS if temp exceeds 99°F."
      });
    }

    if (lower.includes("pantoprazole") || lower.includes("pan-40") || lower.includes("acidity")) {
      medicines.push({
        medicine_name: "Pan-40",
        generic_name: "PANTOPRAZOLE SODIUM",
        dosage_form: "Tablet",
        strength: "40 mg",
        frequency: "1-0-0",
        duration: "5 Days",
        special_instructions: "Take empty stomach 30 mins before breakfast."
      });
    }

    if (lower.includes("cetirizine") || lower.includes("cetzine") || lower.includes("allergy") || lower.includes("itch")) {
      medicines.push({
        medicine_name: "Cetzine 10",
        generic_name: "CETIRIZINE HYDROCHLORIDE",
        dosage_form: "Tablet",
        strength: "10 mg",
        frequency: "0-0-1",
        duration: "5 Days",
        special_instructions: "Take at bedtime for itching relief."
      });
    }

    // Chief complaints & Diagnosis heuristics
    let chief_complaints = dictation.length > 80 ? dictation.slice(0, 100) + "..." : dictation;
    let provisional_diagnosis = "Clinical Evaluation";
    if (lower.includes("acne") || lower.includes("pimples")) provisional_diagnosis = "Acne Vulgaris";
    else if (lower.includes("rash") || lower.includes("eczema") || lower.includes("dermatitis")) provisional_diagnosis = "Allergic Contact Dermatitis";
    else if (lower.includes("fungal") || lower.includes("tinea") || lower.includes("ringworm")) provisional_diagnosis = "Tinea Corporis Infection";
    else if (lower.includes("fever") || lower.includes("cough") || lower.includes("cold")) provisional_diagnosis = "Acute Upper Respiratory Infection";

    return NextResponse.json({
      status: "success",
      data: {
        vitals,
        chief_complaints,
        provisional_diagnosis,
        followup_advice: "Follow up after 7 days or sooner if symptoms persist.",
        medicines
      }
    });
  } catch (error: any) {
    console.error("POST /api/prescriptions/scribe error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse dictation" }, { status: 500 });
  }
}
