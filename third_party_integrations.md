# Third-Party Integration Docs (Snippets)

MediBrief AI relies on several external components and services to achieve clinical intelligence. Below are the key integration points and implementation snippets.

## 1. Ollama (Model Runtime)

- **Service**: Local LLM inference engine.
- **Base URL**: `http://localhost:11434/api/generate`
- **Models Used**: `mistral` (Primary), `phi3` (Fallback).
- **Inference Code (Python)**:
```python
import requests

def call_ollama(prompt: str, model="mistral"):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    response = requests.post("http://localhost:11434/api/generate", json=payload)
    return response.json().get("response")
```

---

## 2. SciSpaCy (NLP Model)

- **Service**: Specialized biomedical NER models.
- **Package**: `en_core_sci_md` (Version 0.5.3+)
- **Integration (Python)**:
```python
import spacy
nlp = spacy.load("en_core_sci_md")

def extract_clinical_entities(text: str):
    doc = nlp(text)
    return [{"text": ent.text, "label": ent.label_} for ent in doc.ents]
```

---

## 3. ngrok (Secure Tunneling)

- **Service**: Reverse proxy to expose the local FastAPI service to the Render-deployed Spring Boot backend.
- **CLI Command**:
```bash
ngrok http 8000
```
- **Configuration**: Ensure the HTTPS tunnel URL is copied and set as `AI_SERVICE_URL` in the Spring Boot `application.properties`.

---

## 4. Deployment Environment (Vercel & Render)

### Frontend (Vercel)
- **Repo**: Connected directly to GitHub.
- **Domain**: `https://medibrief.vercel.app`
- **Configuration**: Must set `VITE_API_BASE_URL` in Vercel Environment Variables.

### Backend (Render)
- **Service Type**: Web Service (Docker or Native Java).
- **Configuration**:
    - **Environment Variable**: `AI_SERVICE_URL` (Points to current ngrok tunnel).
    - **Port**: Default 8080.

---

## 5. Authorization Headers (Internal)

Currently, the communication between Spring Boot and FastAPI is unauthenticated (private tunnel). In production, use a shared secret:
```http
POST /process HTTP/1.1
Authorization: Bearer <SHARED_SECRET_KEY>
Content-Type: application/json
```
