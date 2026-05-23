# MVP_TECH_DOC.md — MediBrief AI
## Technical Implementation Guide

---

## 1. AI Pipeline (Step-by-Step)

### Step 1: Text Preprocessing

**Location:** FastAPI service — `preprocessor.py`

**Operations:**
- Lowercase normalization (optional, preserve for NER)
- Abbreviation expansion via static dictionary
- Remove redundant whitespace, control characters
- Sentence tokenization (for source mapping)

**Abbreviation Dictionary (sample):**
```python
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
    for abbr, expansion in ABBREV_MAP.items():
        text = re.sub(r'\b' + re.escape(abbr) + r'\b', expansion, text)
    return text
```

---

### Step 2: Named Entity Recognition (NER)

**Tool:** SpaCy with `en_core_sci_md` (SciSpaCy biomedical model)

**Why SpaCy/SciSpaCy:**
- Pre-trained on biomedical corpora (MIMIC, PubMed)
- Fast inference (CPU-only viable)
- Supports custom entity types
- Sentence boundary detection built-in

**Entity Types Extracted:**
| Label | Examples |
|---|---|
| DISEASE | Diabetes, Hypertension, Asthma |
| ALLERGY | Penicillin allergy, Latex allergy |
| MEDICATION | Metformin, Aspirin, Lisinopril |
| PROCEDURE | Appendectomy, Angioplasty |
| SYMPTOM | Chest pain, Dyspnea |

**Implementation:**
```python
import spacy

nlp = spacy.load("en_core_sci_md")

def extract_entities(text: str) -> dict:
    doc = nlp(text)
    entities = {
        "diseases": [],
        "allergies": [],
        "medications": [],
        "procedures": [],
        "symptoms": []
    }
    sources = {}

    for ent in doc.ents:
        entity_id = f"{ent.label_}_{ent.start}"
        entry = {
            "id": entity_id,
            "text": ent.text,
            "label": ent.label_,
            "start_char": ent.start_char,
            "end_char": ent.end_char
        }
        source_sentence = ent.sent.text.strip()
        sources[entity_id] = source_sentence

        label = ent.label_.lower()
        if label in entities:
            entities[label].append(entry)

    return entities, sources
```

---

### Step 3: Summarization + Timeline Generation

**Model:** Mistral 7B via Ollama
**Fallback:** Phi-3 (use when VRAM < 4GB or latency > threshold)

**Why Mistral 7B:**
- Strong instruction-following capability
- Runs on 4GB VRAM with Q4 quantization
- Good at structured JSON output when prompted correctly

**Ollama Setup:**
```bash
ollama pull mistral
ollama pull phi3   # fallback
```

**Prompt Design:**

System prompt (injected into Ollama request):
```
You are a clinical assistant. Your task is to analyze the provided patient medical record 
and return ONLY a valid JSON object. Do not include any explanation, preamble, or markdown.

Return this exact structure:
{
  "summary": "<3-4 sentence clinical summary of the patient>",
  "timeline": [
    { "date": "<date or period>", "event": "<clinical event description>" }
  ]
}

Rules:
- Summary must be factual, dense, and doctor-facing.
- Timeline must be chronological. Use approximate dates if exact dates are absent.
- Do NOT hallucinate. Only include information present in the text.
- If no timeline can be constructed, return an empty array for "timeline".
```

**API Call to Ollama:**
```python
import requests, json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_PRIMARY = "mistral"
MODEL_FALLBACK = "phi3"

def call_ollama(preprocessed_text: str, model: str = MODEL_PRIMARY) -> dict:
    prompt = f"""
Patient Record:
\"\"\"
{preprocessed_text}
\"\"\"

Analyze the above and return the JSON structure as instructed.
"""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "format": "json"
    }
    response = requests.post(OLLAMA_URL, json=payload, timeout=120)
    response.raise_for_status()
    raw = response.json().get("response", "{}")
    return json.loads(raw)

def summarize_with_fallback(text: str) -> dict:
    try:
        return call_ollama(text, MODEL_PRIMARY)
    except Exception:
        return call_ollama(text, MODEL_FALLBACK)
```

---

### Step 4: Source Mapping

**Purpose:** Every extracted entity links to the exact original sentence from the input text.

**Structure:**
```json
{
  "DISEASE_12": "Patient has a history of Diabetes Mellitus diagnosed in 2018.",
  "ALLERGY_34": "Known allergy to Penicillin — documented anaphylactic reaction.",
  "MEDICATION_56": "Currently on Metformin 500mg twice daily."
}
```

**Implementation:** Populated during NER step (Step 2) using SpaCy's `.sent` attribute per entity.

---

### Step 5: FastAPI Endpoint Assembly

**Full `/process` handler:**
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class ProcessRequest(BaseModel):
    text: str

@app.post("/process")
async def process_record(req: ProcessRequest):
    if not req.text or len(req.text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Input text too short.")

    # Step 1
    clean_text = expand_abbreviations(req.text)

    # Step 2
    entities, sources = extract_entities(clean_text)

    # Step 3
    llm_output = summarize_with_fallback(clean_text)

    # Step 4: sources already populated in Step 2

    return {
        "summary": llm_output.get("summary", ""),
        "timeline": llm_output.get("timeline", []),
        "entities": entities,
        "sources": sources
    }
```

---

## 2. API Contracts

### 2.1 Frontend → Spring Boot

**Request:**
```
POST /api/patient/process
Content-Type: application/json

{
  "text": "Patient John D., 58M. History of HTN and DM. Allergic to Penicillin..."
}
```

**Response (200 OK):**
```json
{
  "summary": "58-year-old male with longstanding hypertension and type 2 diabetes, currently on antihypertensive and glucose-lowering therapy. Known penicillin allergy with documented anaphylaxis. Underwent appendectomy in 2019 with unremarkable recovery.",
  "timeline": [
    { "date": "2015", "event": "Diagnosed with Hypertension" },
    { "date": "2018", "event": "Diagnosed with Type 2 Diabetes Mellitus" },
    { "date": "2019", "event": "Appendectomy performed" },
    { "date": "2023", "event": "Started Metformin 500mg twice daily" }
  ],
  "flags": [
    {
      "type": "ALLERGY",
      "entity": "Penicillin",
      "severity": "HIGH",
      "reason": "Documented anaphylactic reaction",
      "confidence": "HIGH"
    },
    {
      "type": "CHRONIC_DISEASE",
      "entity": "Hypertension",
      "severity": "HIGH",
      "reason": "Chronic condition requiring ongoing management",
      "confidence": "HIGH"
    },
    {
      "type": "PAST_PROCEDURE",
      "entity": "Appendectomy",
      "severity": "MEDIUM",
      "reason": "Surgical history relevant for future procedures",
      "confidence": "MEDIUM"
    }
  ],
  "sources": {
    "ALLERGY_34": "Known allergy to Penicillin — documented anaphylactic reaction.",
    "DISEASE_12": "Patient has a history of Hypertension diagnosed in 2015.",
    "PROCEDURE_78": "Patient underwent appendectomy in 2019."
  }
}
```

**Error Response (400):**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Input text must be at least 50 characters.",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

**Error Response (503):**
```json
{
  "error": "AI_SERVICE_UNAVAILABLE",
  "message": "Could not connect to AI processing service.",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

---

### 2.2 Spring Boot → FastAPI

**Request:**
```
POST /process
Content-Type: application/json

{
  "text": "Patient John D., 58M. History of HTN and DM..."
}
```

**Response (200 OK):**
```json
{
  "summary": "...",
  "timeline": [...],
  "entities": {
    "diseases": [
      { "id": "DISEASE_12", "text": "Hypertension", "label": "DISEASE" }
    ],
    "allergies": [
      { "id": "ALLERGY_34", "text": "Penicillin", "label": "ALLERGY" }
    ],
    "medications": [...],
    "procedures": [...],
    "symptoms": [...]
  },
  "sources": {
    "DISEASE_12": "Patient has a history of Hypertension.",
    "ALLERGY_34": "Known allergy to Penicillin."
  }
}
```

---

## 3. Backend — Spring Boot Responsibilities

### 3.1 Controller
```java
@RestController
@RequestMapping("/api/patient")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @PostMapping("/process")
    public ResponseEntity<PatientResponse> process(@RequestBody @Valid PatientRequest request) {
        PatientResponse response = patientService.processRecord(request.getText());
        return ResponseEntity.ok(response);
    }
}
```

### 3.2 Service
```java
@Service
public class PatientService {

    @Autowired
    private AiServiceClient aiServiceClient;

    @Autowired
    private RuleEngine ruleEngine;

    public PatientResponse processRecord(String rawText) {
        AiResponse aiResponse = aiServiceClient.process(rawText);
        List<Flag> flags = ruleEngine.generateFlags(aiResponse.getEntities());
        return PatientResponse.builder()
            .summary(aiResponse.getSummary())
            .timeline(aiResponse.getTimeline())
            .flags(flags)
            .sources(aiResponse.getSources())
            .build();
    }
}
```

### 3.3 AI Service Client
```java
@Component
public class AiServiceClient {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiResponse process(String text) {
        Map<String, String> body = Map.of("text", text);
        return restTemplate.postForObject(
            aiServiceUrl + "/process",
            body,
            AiResponse.class
        );
    }
}
```

---

## 4. Rule Engine Logic

**Location:** Spring Boot — `RuleEngine.java`

**Rules:**
```java
public List<Flag> generateFlags(Entities entities) {
    List<Flag> flags = new ArrayList<>();

    for (Entity allergy : entities.getAllergies()) {
        flags.add(Flag.builder()
            .type("ALLERGY")
            .entity(allergy.getText())
            .severity("HIGH")
            .reason("Allergy detected — potential life-threatening risk")
            .confidence("HIGH")
            .sourceId(allergy.getId())
            .build());
    }

    for (Entity disease : entities.getDiseases()) {
        String severity = isChronicDisease(disease.getText()) ? "HIGH" : "MEDIUM";
        flags.add(Flag.builder()
            .type("CHRONIC_DISEASE")
            .entity(disease.getText())
            .severity(severity)
            .reason("Chronic condition with ongoing management implications")
            .build());
    }

    for (Entity procedure : entities.getProcedures()) {
        flags.add(Flag.builder()
            .type("PAST_PROCEDURE")
            .entity(procedure.getText())
            .severity("MEDIUM")
            .reason("Surgical history relevant for clinical decisions")
            .build());
    }

    return flags;
}

private boolean isChronicDisease(String name) {
    Set<String> CHRONIC = Set.of("diabetes", "hypertension", "asthma",
        "copd", "ckd", "coronary artery disease", "heart failure");
    return CHRONIC.stream().anyMatch(name.toLowerCase()::contains);
}
```

---

## 5. Error Handling

| Scenario | Action |
|---|---|
| Empty/short input | Return 400 with `VALIDATION_ERROR` |
| AI service unreachable | Return 503 with `AI_SERVICE_UNAVAILABLE` |
| Ollama model not loaded | FastAPI returns 500; Spring Boot propagates 503 |
| LLM returns malformed JSON | FastAPI catches parse error, returns partial result |
| Timeout (>30s) | Spring Boot returns 504 with `PROCESSING_TIMEOUT` |
| NER model not loaded | Log error, return empty entities, continue with LLM |

**FastAPI global error handler:**
```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "detail": str(exc)}
    )
```

---

## 6. Performance Optimization

### 6.1 Caching (Spring Boot)
```java
// In-memory cache using ConcurrentHashMap
// Key: SHA-256 hash of input text
// TTL: configurable (default 1 hour)

@Component
public class ProcessingCache {
    private final Map<String, CachedResult> cache = new ConcurrentHashMap<>();

    public Optional<PatientResponse> get(String textHash) {
        CachedResult result = cache.get(textHash);
        if (result != null && !result.isExpired()) return Optional.of(result.getResponse());
        return Optional.empty();
    }

    public void put(String textHash, PatientResponse response) {
        cache.put(textHash, new CachedResult(response, System.currentTimeMillis()));
    }
}
```

### 6.2 Input Size Limit
- Maximum input: **5000 characters** (configurable)
- Rationale: Prevents VRAM overflow on 4GB GPU; Mistral 7B context window ~8K tokens

### 6.3 Model Selection Strategy
```python
def select_model(text_length: int) -> str:
    if text_length > 3000:
        return MODEL_PRIMARY   # Mistral for richer context
    return MODEL_FALLBACK      # Phi-3 for speed
```

### 6.4 Async Processing (Future)
- Spring Boot `@Async` + CompletableFuture for non-blocking AI calls
- FastAPI native async already handles concurrent requests via uvicorn

---

## 7. Project Structure

### FastAPI Service
```
ai-service/
├── main.py                  # FastAPI app + routes
├── preprocessor.py          # Abbreviation expansion, text cleaning
├── ner_extractor.py         # SpaCy NER pipeline
├── summarizer.py            # Ollama LLM calls
├── source_mapper.py         # Entity → sentence mapping
├── models/
│   └── schemas.py           # Pydantic request/response models
├── config.py                # Env vars, model names
└── requirements.txt
```

### Spring Boot Service
```
backend/
├── src/main/java/com/medibrief/
│   ├── controller/
│   │   └── PatientController.java
│   ├── service/
│   │   ├── PatientService.java
│   │   └── RuleEngine.java
│   ├── client/
│   │   └── AiServiceClient.java
│   ├── model/
│   │   ├── PatientRequest.java
│   │   ├── PatientResponse.java
│   │   ├── Flag.java
│   │   └── AiResponse.java
│   └── cache/
│       └── ProcessingCache.java
└── src/main/resources/
    └── application.properties
```

### React Frontend
```
frontend/
├── src/
│   ├── components/
│   │   ├── InputPanel.jsx
│   │   ├── SummaryCard.jsx
│   │   ├── Timeline.jsx
│   │   ├── FlagsPanel.jsx
│   │   └── SourceHighlight.jsx
│   ├── services/
│   │   └── api.js
│   └── App.jsx
└── package.json
```

---

## 8. Dependencies

### FastAPI (requirements.txt)
```
fastapi==0.110.0
uvicorn==0.29.0
pydantic==2.6.0
spacy==3.7.4
https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.3/en_core_sci_md-0.5.3.tar.gz
requests==2.31.0
```

### Spring Boot (pom.xml - key deps)
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

### application.properties
```properties
ai.service.url=https://<ngrok-id>.ngrok.io
server.port=8080
spring.application.name=medibrief-backend
```
