import spacy
import logging

logger = logging.getLogger("medibrief.ner")

try:
    nlp = spacy.load("en_core_sci_md")
except OSError:
    logger.warning("en_core_sci_md model not found! Fallback to en_core_web_sm if available, or text will be empty.")
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        nlp = None

def extract_entities(text: str):
    """
    Extracts clinical entities like Disease, Allergy, Medication, Procedure, etc.
    Returns:
       entities (dict): organized by category.
       sources (dict): entity_id to original sentence map.
    """
    entities = {
        "diseases": [],
        "allergies": [],
        "medications": [],
        "procedures": [],
        "symptoms": []
    }
    sources = {}

    if not nlp:
        logger.error("No SpaCy model loaded. Returning empty entities.")
        return entities, sources

    doc = nlp(text)

    for ent in doc.ents:
        # Generate a unique ID for each entity
        entity_id = f"{ent.label_}_{ent.start}".upper()
        
        entry = {
            "id": entity_id,
            "text": ent.text,
            "label": ent.label_
        }

        # Save source sentence mapping
        try:
            source_sentence = ent.sent.text.strip()
            sources[entity_id] = source_sentence
        except ValueError:
            # Fallback if sentence boundary detection fails
            sources[entity_id] = ent.text

        # Categorize (using sci_spacy labels roughly mapped to our categories)
        # en_core_sci_md uses 'ENTITY' mostly, but we'll try to categorize heuristically if needed.
        # For MVP, we will group them based on standard keywords or accept all as diseases/findings
        label = ent.label_.lower()
        
        # Simple heuristic assignment since true clinical models have specific labels
        ent_text_lower = ent.text.lower()
        if "allergy" in ent_text_lower or "allergic" in ent_text_lower:
            entities["allergies"].append(entry)
        elif any(med in ent_text_lower for med in ["mg", "tablet", "dose", "aspirin", "metformin", "lisinopril", "penicillin"]):
            entities["medications"].append(entry)
        elif any(surg in ent_text_lower for s in ["ectomy", "plasty", "surgery", "procedure"] for surg in s):
             entities["procedures"].append(entry)
        else:
            # Default bucket for SciSpacy "ENTITY"
            entities["diseases"].append(entry)

    return entities, sources
