import pytest
from apps.api.services.speaker_attribution import speaker_attributor


def test_doctor_speaker_attribution_english():
    text = "Since when have you been having this fever? Let me examine your chest."
    speaker, conf = speaker_attributor.attribute_speaker(text)
    assert speaker == "doctor"
    assert conf >= 0.65


def test_patient_speaker_attribution_english():
    text = "I have severe throat pain and I cannot sleep since yesterday."
    speaker, conf = speaker_attributor.attribute_speaker(text)
    assert speaker == "patient"
    assert conf >= 0.65


def test_doctor_speaker_attribution_hindi_hinglish():
    text = "Aapko bukhar kitne din se hai? Dawa likh raha hoon, khana khane ke baad lijiye."
    speaker, conf = speaker_attributor.attribute_speaker(text)
    assert speaker == "doctor"
    assert conf >= 0.65


def test_patient_speaker_attribution_hindi_hinglish():
    text = "Mujhe do din se bukhar aa raha hai aur kal raat se chhati mein jalan ho rahi hai."
    speaker, conf = speaker_attributor.attribute_speaker(text)
    assert speaker == "patient"
    assert conf >= 0.65


def test_uncertain_speaker_attribution_on_ambiguous_short_phrases():
    # Ambiguous short phrase should never be assigned to a speaker without indication
    text = "Yes okay."
    speaker, conf = speaker_attributor.attribute_speaker(text)
    assert speaker == "uncertain"
    assert conf <= 0.60
