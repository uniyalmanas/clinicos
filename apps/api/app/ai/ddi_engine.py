"""
AI Drug-Drug Interaction (DDI) & Allergy Contraindication Safety Engine
Evaluates combinations of generic medications and patient allergies against clinical pharmacopeia guidelines.
"""

from typing import List, Dict, Any, Optional
import re

# Severity Levels
SEVERITY_SEVERE = "SEVERE"     # Red - Do not administer or require immediate intervention
SEVERITY_MODERATE = "MODERATE" # Amber - Monitor closely, adjust timing or dosage
SEVERITY_MILD = "MILD"         # Blue - Minor clinical relevance

# Knowledge Base of Drug-Drug Interactions
KNOWN_INTERACTIONS: List[Dict[str, Any]] = [
    {
        "drugs": ["SILDENAFIL", "NITROGLYCERIN"],
        "severity": SEVERITY_SEVERE,
        "title": "Fatal Hypotension Warning",
        "description": "Co-administration of PDE5 inhibitors (Sildenafil/Tadalafil) with organic nitrates causes profound, life-threatening systemic vasodilation and circulatory collapse.",
        "clinical_advice": "Absolute contraindication. Discontinue nitrates for at least 24 hours prior to PDE5 inhibitor use, or select non-nitrate antianginal therapy."
    },
    {
        "drugs": ["TADALAFIL", "ISOSORBIDE MONONITRATE"],
        "severity": SEVERITY_SEVERE,
        "title": "Severe Nitrate Vasodilatory Collapse",
        "description": "Potentiation of hypotensive effects resulting in acute syncope and myocardial hypoperfusion.",
        "clinical_advice": "Absolute contraindication. Avoid combination."
    },
    {
        "drugs": ["METHOTREXATE", "DICLOFENAC"],
        "severity": SEVERITY_SEVERE,
        "title": "Methotrexate Toxicity & Bone Marrow Suppression",
        "description": "NSAIDs competitively inhibit renal clearance of methotrexate, causing dangerous serum accumulation and severe hematological toxicity.",
        "clinical_advice": "Avoid concurrent NSAID use with moderate to high-dose Methotrexate. Use Paracetamol for pain control."
    },
    {
        "drugs": ["METHOTREXATE", "IBUPROFEN"],
        "severity": SEVERITY_SEVERE,
        "title": "Methotrexate Toxicity & Bone Marrow Suppression",
        "description": "NSAIDs competitively inhibit renal clearance of methotrexate, causing dangerous serum accumulation and severe hematological toxicity.",
        "clinical_advice": "Avoid concurrent NSAID use with moderate to high-dose Methotrexate. Use Paracetamol for pain control."
    },
    {
        "drugs": ["CLOPIDOGREL", "OMEPRAZOLE"],
        "severity": SEVERITY_SEVERE,
        "title": "Diminished Antiplatelet Efficacy (Stent Thrombosis Risk)",
        "description": "Omeprazole inhibits CYP2C19 enzyme required to metabolize Clopidogrel into its active metabolite, diminishing antiplatelet protection.",
        "clinical_advice": "Substitute Omeprazole with Pantoprazole or Rabeprazole, which exhibit negligible CYP2C19 inhibition."
    },
    {
        "drugs": ["WARFARIN", "ASPIRIN"],
        "severity": SEVERITY_SEVERE,
        "title": "Extreme Gastrointestinal & Major Hemorrhage Risk",
        "description": "Synergistic inhibition of coagulation cascade and platelet aggregation dramatically increases risk of major internal bleeding.",
        "clinical_advice": "Unless strictly indicated for mechanical heart valves or post-PCI, avoid dual therapy. Monitor INR closely."
    },
    {
        "drugs": ["RAMIPRIL", "SPIRONOLACTONE"],
        "severity": SEVERITY_SEVERE,
        "title": "Life-Threatening Hyperkalemia Risk",
        "description": "Concurrent ACE inhibitor and potassium-sparing diuretic inhibits aldosterone secretion, leading to severe potassium retention and cardiac arrhythmias.",
        "clinical_advice": "Regularly monitor serum potassium and renal function. Avoid over-the-counter potassium supplements."
    },
    {
        "drugs": ["TELMISARTAN", "SPIRONOLACTONE"],
        "severity": SEVERITY_SEVERE,
        "title": "Hyperkalemia & Arrhythmia Hazard",
        "description": "ARBs and potassium-sparing diuretics synergistically retain potassium in renal distal tubules.",
        "clinical_advice": "Measure serum potassium within 1 week of initiating dual therapy."
    },
    {
        "drugs": ["CIPROFLOXACIN", "AZITHROMYCIN"],
        "severity": SEVERITY_SEVERE,
        "title": "Additive QT Prolongation & Torsades de Pointes",
        "description": "Concurrent fluoroquinolone and macrolide therapy delays cardiac ventricular repolarization, escalating risk of fatal ventricular arrhythmias.",
        "clinical_advice": "Avoid concurrent administration. Replace one agent with a beta-lactam or alternative class."
    },
    {
        "drugs": ["DOXYCYCLINE", "ISOTRETINOIN"],
        "severity": SEVERITY_SEVERE,
        "title": "Pseudotumor Cerebri (Benign Intracranial Hypertension)",
        "description": "Co-administration of oral retinoids and tetracyclines is associated with dangerously elevated intracranial pressure.",
        "clinical_advice": "Absolute contraindication in dermatology practice. Never prescribe Isotretinoin alongside Doxycycline or Minocycline."
    },
    {
        "drugs": ["TRAMADOL", "SERTRALINE"],
        "severity": SEVERITY_SEVERE,
        "title": "Serotonin Syndrome & Seizure Threshold Reduction",
        "description": "Both agents elevate synaptic serotonin and lower seizure threshold, precipitating hyperthermia, clonus, and agitation.",
        "clinical_advice": "Avoid combination or substitute Tramadol with Paracetamol/Codeine under supervision."
    },
    {
        "drugs": ["DOXYCYCLINE", "CALCIUM"],
        "severity": SEVERITY_MODERATE,
        "title": "Chelation & Impaired Antibiotic Absorption",
        "description": "Divalent and trivalent cations (calcium, iron, magnesium) form insoluble chelates with tetracyclines, drastically reducing bioavailability.",
        "clinical_advice": "Separate ingestion by at least 2 to 3 hours."
    },
    {
        "drugs": ["CIPROFLOXACIN", "ANTACID"],
        "severity": SEVERITY_MODERATE,
        "title": "Cation Chelation & Reduced Quinolone Bioavailability",
        "description": "Aluminum and magnesium antacids decrease fluoroquinolone absorption by up to 80%.",
        "clinical_advice": "Administer Ciprofloxacin 2 hours before or 6 hours after antacids."
    },
    {
        "drugs": ["ATORVASTATIN", "ITRACONAZOLE"],
        "severity": SEVERITY_MODERATE,
        "title": "Statin Accumulation & Rhabdomyolysis Risk",
        "description": "Strong CYP3A4 inhibitors (azoles) impair statin metabolism, elevating serum levels and risking acute myopathy.",
        "clinical_advice": "Temporarily withhold Atorvastatin during oral antifungal therapy, or substitute with Rosuvastatin at lower dosage."
    },
    {
        "drugs": ["METFORMIN", "CONTRAST"],
        "severity": SEVERITY_MODERATE,
        "title": "Risk of Metformin-Associated Lactic Acidosis",
        "description": "Iodinated radiocontrast media can induce acute renal impairment, impairing metformin clearance.",
        "clinical_advice": "Hold Metformin on the day of contrast imaging and resume after 48 hours following normal serum creatinine check."
    }
]

# Knowledge Base for Allergy Triggers
ALLERGY_FAMILIES: Dict[str, Dict[str, Any]] = {
    "penicillin": {
        "keywords": ["penicillin", "amoxicillin", "ampicillin", "augmentin", "piperacillin", "clavulanate"],
        "severity": SEVERITY_SEVERE,
        "title": "Severe Penicillin / Beta-Lactam Hypersensitivity",
        "description": "Patient has a documented Penicillin allergy. Administering aminopenicillins poses high risk of anaphylaxis, urticaria, or angioedema.",
        "clinical_advice": "Substitute with Macrolides (Azithromycin), Fluoroquinolones, or Doxycycline."
    },
    "sulfa": {
        "keywords": ["sulfa", "sulfamethoxazole", "bactrim", "septran", "sulfasalazine", "silver sulfadiazine"],
        "severity": SEVERITY_SEVERE,
        "title": "Sulfonamide Allergy Warning",
        "description": "Patient has documented Sulfa allergy. Risk of Stevens-Johnson syndrome (SJS) or severe cutaneous drug reactions.",
        "clinical_advice": "Select non-sulfonamide antimicrobial alternatives."
    },
    "nsaid": {
        "keywords": ["nsaid", "aspirin", "ibuprofen", "diclofenac", "aceclofenac", "naproxen", "combiflam"],
        "severity": SEVERITY_SEVERE,
        "title": "NSAID / Aspirin Induced Bronchospasm or Anaphylaxis",
        "description": "Patient has documented NSAID intolerance. Potential for severe asthma exacerbation, angioedema, or GI ulceration.",
        "clinical_advice": "Use Paracetamol (Acetaminophen) for analgesia/antipyresis."
    },
    "cephalosporin": {
        "keywords": ["cephalosporin", "cefixime", "cefpodoxime", "ceftriaxone", "cefuroxime"],
        "severity": SEVERITY_MODERATE,
        "title": "Cephalosporin Cross-Reactivity Risk",
        "description": "Patient has recorded sensitivity to cephalosporin antibiotics.",
        "clinical_advice": "Avoid first/second generation cephalosporins; verify cross-reactivity tolerance."
    }
}

def normalize_text(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[^a-zA-Z0-9\s]', ' ', text).upper()

def check_drug_interactions(
    medications: List[Dict[str, str]], 
    patient_allergies: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates a list of prescribed medications for pairwise interactions and allergy flags.
    Each medication dict should have: {"medicine_name": "...", "generic_name": "..."}
    """
    alerts: List[Dict[str, Any]] = []
    
    # Extract uppercase generic and brand names
    med_entries = []
    for m in medications:
        b_name = normalize_text(m.get("medicine_name", ""))
        g_name = normalize_text(m.get("generic_name", ""))
        med_entries.append({
            "original_id": m.get("id"),
            "brand": b_name,
            "generic": g_name,
            "combined": f"{b_name} {g_name}"
        })

    # 1. Pairwise Drug-Drug Interactions
    n = len(med_entries)
    for i in range(n):
        for j in range(i + 1, n):
            m1 = med_entries[i]["combined"]
            m2 = med_entries[j]["combined"]

            for rule in KNOWN_INTERACTIONS:
                d1 = rule["drugs"][0]
                d2 = rule["drugs"][1]

                match_forward = (d1 in m1 and d2 in m2)
                match_reverse = (d2 in m1 and d1 in m2)

                if match_forward or match_reverse:
                    alerts.append({
                        "type": "DRUG_INTERACTION",
                        "severity": rule["severity"],
                        "drug_a": med_entries[i]["generic"] or med_entries[i]["brand"],
                        "drug_b": med_entries[j]["generic"] or med_entries[j]["brand"],
                        "title": rule["title"],
                        "description": rule["description"],
                        "clinical_advice": rule["clinical_advice"]
                    })

    # 2. Allergy Contraindications Check
    if patient_allergies:
        norm_allergies = patient_allergies.lower()
        for family_key, family_meta in ALLERGY_FAMILIES.items():
            if family_key in norm_allergies:
                for entry in med_entries:
                    text = entry["combined"].lower()
                    triggered = any(kw in text for kw in family_meta["keywords"])
                    if triggered:
                        alerts.append({
                            "type": "ALLERGY_CONTRAINDICATION",
                            "severity": family_meta["severity"],
                            "drug_a": entry["generic"] or entry["brand"],
                            "allergy_trigger": family_key.capitalize(),
                            "title": family_meta["title"],
                            "description": family_meta["description"],
                            "clinical_advice": family_meta["clinical_advice"]
                        })

    # Summary metric
    severe_count = sum(1 for a in alerts if a["severity"] == SEVERITY_SEVERE)
    moderate_count = sum(1 for a in alerts if a["severity"] == SEVERITY_MODERATE)

    return {
        "is_safe": len(alerts) == 0,
        "total_alerts": len(alerts),
        "severe_alerts": severe_count,
        "moderate_alerts": moderate_count,
        "alerts": alerts
    }
