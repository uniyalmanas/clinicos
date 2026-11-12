export type SpeakerType = "doctor" | "patient" | "uncertain";

export interface SpeakerAttributionResult {
  speaker: SpeakerType;
  confidence: number;
}

// Doctor linguistic patterns (English, Hindi, Hinglish)
const DOCTOR_PATTERNS = [
  /\b(let me check|let me examine|take a deep breath|breathe in|open your mouth|jeebh dikhaiye|saans lijiye)\b/i,
  /\b(since when|how many days|kitne din se|kab se ho raha hai|kahan dard hai|kya takleef hai)\b/i,
  /\b(any fever|bukhar hai kya|kisi dawa se allergy|any history of|koi bimari pehle se)\b/i,
  /\b(i am prescribing|prescribing|dawa likh raha hoon|ye tablet|ye syrup|ye goli|ye injection)\b/i,
  /\b(take this|take it|twice a day|once daily|after food|before food|khana khane ke baad|khali pet|subah shaam|raat ko)\b/i,
  /\b(come back|follow up|review after|paanch din baad|ek hafte baad|teen din baad review|agar aaram na mile to)\b/i,
  /\b(get this blood test|cbc|x-ray|ultrasound karwa lijiye|test karwayiye|report aane par)\b/i,
  /\b(your bp is|pulse is|oxygen is|temperature is|blood pressure|spo2)\b/i,
  /\b(relax|don't worry|chinta mat kijiye|pani zyada peeyiye|aaram kijiye)\b/i,
];

// Patient linguistic patterns (English, Hindi, Hinglish)
const PATIENT_PATTERNS = [
  /\b(i have|i feel|i am having|suffering from|i have been having)\b/i,
  /\b(mujhe|mere|meri|hamare|humko|mera sir|mere gale mein|pet mein)\b/i,
  /\b(dard ho raha|dard hai|pain in|ache in|chubhan ho rahi|jalan ho rahi)\b/i,
  /\b(bukhar aa raha|khansi aa rahi|chhati mein jalan|chakkar aa rahe|kamzori lag rahi|dast lage hain|ulti jaisa)\b/i,
  /\b(kal raat se|do din se|teen din se|since yesterday|since two days|parson se|subah se)\b/i,
  /\b(i took|goli li thi|dawa khai thi|paracetamol liya tha|doctor sahab maine)\b/i,
  /\b(cannot sleep|bhookh nahi lag rahi|neend nahi aati|khana hazam nahi hota)\b/i,
  /\b(throat is hurting|fever is very high|cough with phlegm)\b/i,
];

export function attributeSpeaker(
  text: string,
  previousSpeaker: SpeakerType = "uncertain"
): SpeakerAttributionResult {
  const clean = text.toLowerCase().trim();
  if (!clean || clean.split(/\s+/).length < 2) {
    return { speaker: "uncertain", confidence: 0.4 };
  }

  let docScore = 0;
  let patScore = 0;

  for (const pattern of DOCTOR_PATTERNS) {
    if (pattern.test(clean)) {
      docScore += 1;
    }
  }

  for (const pattern of PATIENT_PATTERNS) {
    if (pattern.test(clean)) {
      patScore += 1;
    }
  }

  // Doctor asks >70% of questions in clinical consultations
  if (text.includes("?")) {
    docScore += 0.5;
  }

  if (docScore > patScore && docScore >= 1.0) {
    const confidence = Math.min(0.95, 0.65 + docScore * 0.1);
    return { speaker: "doctor", confidence: Math.round(confidence * 100) / 100 };
  }

  if (patScore > docScore && patScore >= 1.0) {
    const confidence = Math.min(0.95, 0.65 + patScore * 0.1);
    return { speaker: "patient", confidence: Math.round(confidence * 100) / 100 };
  }

  // Alternation heuristic if previous was clear
  if (previousSpeaker === "doctor" && patScore >= 0.5) {
    return { speaker: "patient", confidence: 0.65 };
  } else if (previousSpeaker === "patient" && docScore >= 0.5) {
    return { speaker: "doctor", confidence: 0.65 };
  }

  // Fallback heuristic: Default questions to doctor, statements of feeling/illness to patient
  if (text.includes("?") || clean.startsWith("how") || clean.startsWith("what") || clean.startsWith("kya")) {
    return { speaker: "doctor", confidence: 0.58 };
  }

  return { speaker: "uncertain", confidence: 0.5 };
}
