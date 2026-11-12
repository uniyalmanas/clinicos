import re
from typing import Tuple, Literal

SpeakerType = Literal["doctor", "patient", "uncertain"]

# Doctor linguistic patterns (English, Hindi, Hinglish)
DOCTOR_PATTERNS = [
    r"\b(let me check|let me examine|take a deep breath|breathe in|open your mouth)\b",
    r"\b(since when|how many days|kitne din se|kab se ho raha hai)\b",
    r"\b(any fever|bukhar hai kya|kisi dawa se allergy|any history of)\b",
    r"\b(i am prescribing|prescribing|dawa likh raha hoon|ye tablet|ye syrup|ye goli)\b",
    r"\b(take this|take it|twice a day|once daily|after food|before food|khana khane ke baad|khali pet)\b",
    r"\b(come back|follow up|review after|paanch din baad|ek hafte baad)\b",
    r"\b(get this blood test|cbc|x-ray|ultrasound karwa lijiye)\b",
    r"\b(your bp is|pulse is|oxygen is|temperature is)\b",
]

# Patient linguistic patterns (English, Hindi, Hinglish)
PATIENT_PATTERNS = [
    r"\b(i have|i feel|i am having|suffering from)\b",
    r"\b(mujhe|mere|meri|hamare|humko)\b",
    r"\b(dard ho raha|dard hai|pain in|ache in)\b",
    r"\b(bukhar aa raha|khansi aa rahi|chhati mein jalan|chakkar aa rahe|kamzori lag rahi)\b",
    r"\b(kal raat se|do din se|teen din se|since yesterday|since two days)\b",
    r"\b(i took|goli li thi|dawa khai thi|paracetamol liya tha)\b",
    r"\b(cannot sleep|bhookh nahi lag rahi|neend nahi aati)\b",
]


class SpeakerAttributor:
    @staticmethod
    def attribute_speaker(text: str, previous_speaker: SpeakerType = "uncertain") -> Tuple[SpeakerType, float]:
        clean = text.lower().strip()
        if not clean or len(clean.split()) < 2:
            return "uncertain", 0.40

        doc_score = 0
        pat_score = 0

        for pattern in DOCTOR_PATTERNS:
            if re.search(pattern, clean, re.IGNORECASE):
                doc_score += 1

        for pattern in PATIENT_PATTERNS:
            if re.search(pattern, clean, re.IGNORECASE):
                pat_score += 1

        # Check questions vs statements
        if "?" in text:
            doc_score += 0.5  # In clinical consultations, doctors ask >70% of questions

        if doc_score > pat_score and doc_score >= 1.0:
            confidence = min(0.95, 0.65 + (doc_score * 0.10))
            return "doctor", round(confidence, 2)

        if pat_score > doc_score and pat_score >= 1.0:
            confidence = min(0.95, 0.65 + (pat_score * 0.10))
            return "patient", round(confidence, 2)

        # Alternation heuristic if previous was clear
        if previous_speaker == "doctor" and pat_score >= 0.5:
            return "patient", 0.60
        elif previous_speaker == "patient" and doc_score >= 0.5:
            return "doctor", 0.60

        # Never assign uncertain text without clear indication
        return "uncertain", 0.50


speaker_attributor = SpeakerAttributor()
