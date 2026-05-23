import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from preprocessor import expand_abbreviations
from ner_extractor import extract_entities
from summarizer import summarize_with_fallback

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("medibrief.main")

app = FastAPI(title="MediBrief AI - AI Service")

class ProcessRequest(BaseModel):
    text: str = Field(..., min_length=20, max_length=15000, description="Raw unstructured patient medical record.")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "detail": str(exc)}
    )

@app.post("/process")
async def process_record(req: ProcessRequest):
    logger.info(f"Processing request | text_length={len(req.text)}")
    
    # Step 1: Preprocess
    clean_text = expand_abbreviations(req.text)
    
    # Step 2: NER (Entity Extraction + Source Mapping)
    entities, sources = extract_entities(clean_text)
    logger.info(f"NER complete | extract_count={sum(len(v) for v in entities.values())}")
    
    # Step 3: LLM Summarization & Timeline
    llm_output = summarize_with_fallback(clean_text)
    
    is_partial = False
    if llm_output.get("summary") is None:
        is_partial = True
    
    logger.info("Assembly complete. Returning response.")
    
    return {
        "summary": llm_output.get("summary", ""),
        "timeline": llm_output.get("timeline", []),
        "entities": entities,
        "sources": sources,
        "partial": is_partial
    }
