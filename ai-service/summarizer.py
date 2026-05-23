import requests
import json
import logging

logger = logging.getLogger("medibrief.summarizer")

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_PRIMARY = "mistral"
MODEL_FALLBACK = "phi3"

def call_ollama(preprocessed_text: str, model: str = MODEL_PRIMARY) -> dict:
    prompt = f"""
You are a clinical assistant. Your task is to analyze the provided patient medical record 
and return ONLY a valid JSON object. Do not include any explanation, preamble, or markdown.

Return this exact structure:
{{
  "summary": "<3-4 sentence clinical summary of the patient>",
  "timeline": [
    {{ "date": "<date or period>", "event": "<clinical event description>" }}
  ]
}}

Rules:
- Summary must be factual, dense, and doctor-facing.
- Timeline must be chronological. Use approximate dates if exact dates are absent.
- Do NOT hallucinate. Only include information present in the text.
- If no timeline can be constructed, return an empty array for "timeline".

Patient Record:
\"\"\"
{preprocessed_text}
\"\"\"
"""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        raw_response = response.json().get("response", "{}")
        return json.loads(raw_response)
    except Exception as e:
        logger.error(f"Ollama call failed for model {model}: {str(e)}")
        raise e

def summarize_with_fallback(text: str) -> dict:
    try:
        logger.info(f"Calling Ollama with {MODEL_PRIMARY}")
        return call_ollama(text, MODEL_PRIMARY)
    except Exception:
        logger.warning(f"{MODEL_PRIMARY} failed. Falling back to {MODEL_FALLBACK}")
        try:
            return call_ollama(text, MODEL_FALLBACK)
        except Exception as fallback_err:
            logger.error("All models failed for summarization.")
            return {"summary": None, "timeline": []}
