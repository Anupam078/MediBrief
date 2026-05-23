import re

ABBREV_MAP = {
    "DM": "Diabetes Mellitus",
    "HTN": "Hypertension",
    "MI": "Myocardial Infarction",
    "CABG": "Coronary Artery Bypass Graft",
    "SOB": "Shortness of Breath",
    "Hx": "History",
    "Rx": "Prescription",
    "Dx": "Diagnosis",
    "Fx": "Fracture",
    "w/": "with",
    "c/o": "complains of",
    "h/o": "history of",
    "b/l": "bilateral",
    "NKDA": "No Known Drug Allergies",
    "BP": "Blood Pressure",
    "HR": "Heart Rate",
    "T2DM": "Type 2 Diabetes Mellitus",
    "CKD": "Chronic Kidney Disease",
    "CAD": "Coronary Artery Disease",
    "COPD": "Chronic Obstructive Pulmonary Disease"
}

def expand_abbreviations(text: str) -> str:
    """Expand common medical abbreviations based on a static dictionary."""
    for abbr, expansion in ABBREV_MAP.items():
        # Match standalone abbreviations as exact words
        text = re.sub(r'\b' + re.escape(abbr) + r'\b', expansion, text)
    
    # Simple clean up of extra whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text
