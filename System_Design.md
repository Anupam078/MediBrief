# System_Design.md — MediBrief AI
## Engineering & System Design Document

---

## 1. Request Lifecycle (End-to-End)

### Full Request Trace

```
T=0ms    User clicks "Analyze" in React UI
          │
          │  POST /api/patient/process
          │  Body: { "text": "<raw record>" }
          ▼
T=5ms    Spring Boot DispatcherServlet receives request
          │
          │  PatientController.process()
          ▼
T=6ms    Input Validation
          │  - Not null/empty
          │  - Length >= 50 chars
          │  - Length <= 5000 chars
          │  - Passes → continue
          │  - Fails → return 400 immediately
          ▼
T=8ms    Cache Lookup
          │  - Compute SHA-256 hash of input text
          │  - Check ProcessingCache
          │  - HIT  → return cached response (T=10ms)
          │  - MISS → continue
          ▼
T=10ms   AiServiceClient.process(text)
          │  POST https://<tunnel>/process
          │  Body: { "text": "..." }
          │
          │  [Network: Spring Boot → ngrok tunnel → Local FastAPI]
          ▼
T=50ms   FastAPI receives request
          │
          │  Step 1: Preprocessing (~5ms)
          │    expand_abbreviations(text)
          │    clean_text()
          │
          │  Step 2: NER — SpaCy (~200ms)
          │    nlp(text) → entities, sources
          │
          │  Step 3: LLM — Ollama Mistral 7B (~8–20s)
          │    POST http://localhost:11434/api/generate
          │    Returns: { summary, timeline }
          │
          │  Step 4: Assemble response JSON
          ▼
T=15000ms FastAPI returns:
          │  {
          │    summary, timeline, entities, sources
          │  }
          │  [Network: FastAPI → ngrok → Spring Boot]
          ▼
T=15050ms RuleEngine.generateFlags(entities)
          │  - Allergy entities → HIGH flags
          │  - Chronic diseases → HIGH flags
          │  - Procedures → MEDIUM flags
          │  - Medications → LOW flags
          │  (~2ms)
          ▼
T=15055ms Response Builder
          │  - Merge: summary + timeline + flags + sources
          │  - Store in cache
          │  - Return 200 JSON
          ▼
T=15060ms React receives response
          - Renders Summary Card
          - Renders Timeline
          - Renders Flags Panel
          - Sets up source click handlers
```

---

## 2. Sequence Diagram

```
User        React       SpringBoot     FastAPI      Ollama
 │            │              │             │           │
 │──click──►  │              │             │           │
 │            │──POST /api/──►             │           │
 │            │  /process    │             │           │
 │            │              │──validate───│           │
 │            │              │──cache miss─│           │
 │            │              │──POST /──►  │           │
 │            │              │  process    │           │
 │            │              │             │─preproc──►│
 │            │              │             │◄─────────-│
 │            │              │             │──NER(spacy)
 │            │              │             │──prompt──►│
 │            │              │             │           │──generate
 │            │              │             │           │  (8-20s)
 │            │              │             │◄──result──│
 │            │              │             │──source map
 │            │              │◄─────────── │           │
 │            │              │  {entities, │           │
 │            │              │   summary,  │           │
 │            │              │   timeline, │           │
 │            │              │   sources}  │           │
 │            │              │──rule engine│           │
 │            │              │──build flags│           │
 │            │◄─────────────│             │           │
 │            │  {summary,   │             │           │
 │            │   timeline,  │             │           │
 │            │   flags,     │             │           │
 │            │   sources}   │             │           │
 │◄───render──│              │             │           │
```

---

## 3. Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         SPRING BOOT                             │
│                                                                 │
│  PatientController  ──►  PatientService                         │
│                               │                                 │
│                   ┌───────────┼────────────┐                    │
│                   ▼           ▼            ▼                    │
│           AiServiceClient  RuleEngine  ProcessingCache          │
│                   │                                             │
│                   │  HTTP POST /process                         │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼ (via ngrok)
┌─────────────────────────────────────────────────────────────────┐
│                         FASTAPI AI SERVICE                      │
│                                                                 │
│  /process endpoint                                              │
│       │                                                         │
│       ▼                                                         │
│  preprocessor.py  ──►  ner_extractor.py  ──►  summarizer.py    │
│                              │                     │            │
│                              └─────►  source_mapper.py         │
│                                            │                    │
│                                    ┌───────┴───────┐            │
│                                    ▼               ▼            │
│                              Ollama API        SpaCy NLP        │
│                           (localhost:11434)   (en_core_sci_md)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Models

### PatientRequest
```json
{
  "text": "string (50–5000 chars, required)"
}
```

### AiServiceRequest (Spring Boot → FastAPI)
```json
{
  "text": "string"
}
```

### AiServiceResponse (FastAPI → Spring Boot)
```json
{
  "summary": "string",
  "timeline": [
    { "date": "string", "event": "string" }
  ],
  "entities": {
    "diseases": [
      { "id": "string", "text": "string", "label": "string" }
    ],
    "allergies": [ ... ],
    "medications": [ ... ],
    "procedures": [ ... ],
    "symptoms": [ ... ]
  },
  "sources": {
    "<entity_id>": "string (original sentence)"
  }
}
```

### Flag
```json
{
  "type": "ALLERGY | CHRONIC_DISEASE | ACUTE_EVENT | PAST_PROCEDURE | MEDICATION_NOTE",
  "entity": "string",
  "severity": "HIGH | MEDIUM | LOW",
  "reason": "string",
  "confidence": "HIGH | MEDIUM | LOW",
  "sourceId": "string"
}
```

### PatientResponse (Spring Boot → Frontend)
```json
{
  "summary": "string",
  "timeline": [ { "date": "string", "event": "string" } ],
  "flags": [ Flag ],
  "sources": { "<entity_id>": "string" }
}
```

---

## 5. Fault Tolerance Design

### Failure Scenarios and Handling

| Failure | Detection | Response |
|---|---|---|
| FastAPI service down | HTTP connection refused | Spring Boot catches exception → 503 |
| Ollama not running | requests.ConnectionError in FastAPI | FastAPI catches → returns partial (NER only) with `summary: null` |
| Mistral model slow (>30s) | Spring Boot RestTemplate timeout | Timeout exception → 504 PROCESSING_TIMEOUT |
| Malformed LLM JSON output | json.JSONDecodeError in summarizer.py | Return `{"summary": "", "timeline": []}`, log warning |
| SpaCy model not loaded | ImportError on startup | FastAPI fails to start — surfaced in logs immediately |
| ngrok tunnel expired | DNS resolution error from Render | Backend returns 503; developer must restart tunnel |
| Input too long (>5000 chars) | Spring Boot validation | 400 VALIDATION_ERROR before hitting AI service |

### Timeout Configuration
```properties
# application.properties
ai.service.timeout.connect=5000   # 5s connection timeout
ai.service.timeout.read=30000     # 30s read timeout
```

### Partial Response Strategy
If NER succeeds but LLM fails, return partial response:
```json
{
  "summary": null,
  "timeline": [],
  "flags": [ ... ],  // still generated from entities
  "sources": { ... },
  "partial": true,
  "error": "LLM_UNAVAILABLE"
}
```

---

## 6. Logging Strategy

### Spring Boot Logging
```java
// Log levels per component:
// INFO  - request received, AI call initiated, response sent
// WARN  - cache miss, slow response (>15s)
// ERROR - AI service unreachable, validation failure

log.info("Processing request | textLength={} | hash={}", text.length(), hash);
log.warn("Cache miss | hash={} | calling AI service", hash);
log.error("AI service call failed | error={}", ex.getMessage());
```

### FastAPI Logging
```python
import logging
logger = logging.getLogger("medibrief")

logger.info(f"Processing | text_length={len(text)}")
logger.info(f"NER complete | entities={len(entities)}")
logger.info(f"LLM complete | model={model}")
logger.error(f"LLM failed | error={str(e)}")
```

### Log Fields (Structured)
Every log line should include:
- `timestamp`
- `component` (controller / service / ai_client / fastapi / summarizer)
- `event_type`
- `duration_ms` (for performance tracking)

---

## 7. Security Considerations

### MVP Security Posture

| Risk | Mitigation |
|---|---|
| Patient data exposure | No data persistence; stateless processing |
| Prompt injection via input | Input sanitized; LLM used only for summarization (no action execution) |
| Unauthorized API access | No auth in MVP; acceptable for local/demo use only |
| ngrok tunnel exposure | Tunnel URL is not public-facing (shared only with backend); rotate regularly |
| CORS misconfiguration | Spring Boot CORS configured to allow only Vercel domain |

**Spring Boot CORS Config:**
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://medibrief.vercel.app")
            .allowedMethods("POST", "GET")
            .allowedHeaders("Content-Type");
    }
}
```

### Production Upgrade Path (Post-MVP)
- Add JWT authentication
- HTTPS-only endpoints
- Rate limiting (Spring Boot RateLimiter or API Gateway)
- Input PII scrubbing before logging
- HIPAA/DPDP compliance audit

---

## 8. Scalability Design (Future)

### Current Bottleneck
The AI service is the single bottleneck:
- Single Ollama instance
- Single FastAPI process
- CPU-bound NER + GPU-bound LLM

### Scaling Strategy (Phase 2)

```
Load Balancer
     │
     ├─► FastAPI Instance 1 (Ollama 1)
     ├─► FastAPI Instance 2 (Ollama 2)
     └─► FastAPI Instance 3 (Ollama 3)
```

**Horizontal Scaling Options:**
- Run multiple Ollama instances on different ports
- Use nginx as load balancer for FastAPI workers
- Deploy to GPU-enabled VPS (₹1000–2000/month for RTX3060-class)

**Queue-Based Async Processing (Phase 3):**
```
Spring Boot ──► Redis Queue ──► Worker Pool (FastAPI)
                                      │
                                      ▼
                               Results stored in Redis
                                      │
                               Spring Boot polls / SSE
                                      │
                               Frontend receives result
```

**Caching Scale:**
- Upgrade from in-memory to Redis for shared cache across instances
- Cache TTL: 24 hours for clinical records (low change frequency)

---

## 9. AI Service Decoupling

The FastAPI AI service is intentionally decoupled from the backend to allow:

| Capability | Benefit |
|---|---|
| Independent deployment | AI service updated without touching Spring Boot |
| Model swap | Replace Mistral with any Ollama-compatible model by changing one config value |
| Language swap | FastAPI can be replaced with Node.js or Go service with same API contract |
| Cloud migration | AI service can move to VPS or cloud GPU without any frontend/backend changes |

**Contract stability:** As long as `/process` accepts `{ "text": string }` and returns the defined JSON schema, the rest of the system is unaffected by internal AI changes.

---

## 10. Processing Pipeline State Machine

```
[INPUT RECEIVED]
      │
      ▼
[VALIDATION]
      │
    PASS ──────────────────── FAIL ──► [400 ERROR]
      │
      ▼
[CACHE LOOKUP]
      │
    HIT ──────────────────── RETURN CACHED RESPONSE
      │
    MISS
      │
      ▼
[AI SERVICE CALL]
      │
    SUCCESS                   FAIL ──► [503 ERROR]
      │
      ▼
[NER EXTRACTION]
      │
    SUCCESS                   FAIL ──► [PARTIAL: empty entities]
      │
      ▼
[LLM SUMMARIZATION]
      │
    SUCCESS                   FAIL ──► [PARTIAL: summary=null]
      │
      ▼
[SOURCE MAPPING]
      │
      ▼
[RULE ENGINE → FLAGS]
      │
      ▼
[RESPONSE ASSEMBLY]
      │
      ▼
[CACHE STORE]
      │
      ▼
[200 RETURN TO CLIENT]
```

---

## 11. Environment Configuration

### Spring Boot (application.properties)
```properties
server.port=8080
ai.service.url=${AI_SERVICE_URL:https://abc123.ngrok.io}
ai.service.timeout.connect=5000
ai.service.timeout.read=30000
cache.ttl.seconds=3600
input.max.length=5000
input.min.length=50
```

### FastAPI (.env)
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL_PRIMARY=mistral
OLLAMA_MODEL_FALLBACK=phi3
SPACY_MODEL=en_core_sci_md
MAX_INPUT_LENGTH=5000
LOG_LEVEL=INFO
```

### ngrok Setup
```bash
# Start tunnel pointing to FastAPI
ngrok http 8000

# OR Cloudflare Tunnel (persistent)
cloudflared tunnel --url http://localhost:8000
```

---

## 12. Development Startup Sequence

```bash
# Terminal 1: Start Ollama
ollama serve
ollama pull mistral

# Terminal 2: Start FastAPI AI Service
cd ai-service
pip install -r requirements.txt
python -m spacy download en_core_sci_md
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Start ngrok tunnel
ngrok http 8000
# Copy HTTPS URL → set in Spring Boot application.properties

# Terminal 4: Start Spring Boot
cd backend
./mvnw spring-boot:run

# Terminal 5: Start React Frontend
cd frontend
npm install
npm run dev
```
