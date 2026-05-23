# Error Handling & Logging Strategy

MediBrief AI implements a multi-tier error handling strategy to ensure that failures in the AI pipeline are gracefully managed and diagnosed.

## 1. Standard Error Response (JSON)

All API layers (Spring Boot and FastAPI) must return errors in this consistent format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description of the error.",
  "timestamp": "2025-01-01T10:00:00Z",
  "path": "/api/source/path",
  "detail": "Optional technical stack trace or sub-error (dev only)."
}
```

## 2. Error Code Matrix

| Error Code | HTTP Status | Origin | Description |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Spring Boot | Input text is too short (<50) or too long (>5000). |
| `AI_SERVICE_UNAVAILABLE` | 503 | Spring Boot | Backend cannot connect to FastAPI via the tunnel. |
| `PROCESSING_TIMEOUT` | 504 | Spring Boot | AI processing exceeded the 30s threshold. |
| `LLM_PARSE_ERROR` | 500 | FastAPI | Ollama returned malformed JSON that couldn't be cleaned. |
| `MODEL_NOT_READY` | 503 | FastAPI | Ollama is running but the specific model (Mistral) failed to load. |
| `INTERNAL_SYSTEM_ERROR` | 500 | Both | Unexpected runtime exceptions / null pointers. |

---

## 3. Logging Strategy

### Global Traceability
Every request to the backend must be logged with a unique session identifier (or the hash of the input) to trace it through the FastAPI logs.

### Layer 1: Spring Boot (Logback/SLF4J)
- **Level: INFO** - Log start of request, cache hit/miss, and total duration.
- **Level: WARN** - Log slow processing (>15s) and validation failures.
- **Level: ERROR** - Log all 5xx responses with stack traces.
- **Pattern**: `[%d] [%thread] %-5level %logger{36} - %msg%n`

### Layer 2: FastAPI (Python Logging)
- **Level: INFO** - Log each pipeline step: Preprocessing → NER → LLM → Source Mapping.
- **Level: ERROR** - Log Ollama connection failures and SpaCy model load errors.
- **Pattern**: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`

### Layer 3: React Frontend (Console)
- **Production**: Silence all `console.log` except for high-level Error alerts (`console.error`).
- **Development**: Log full API response and state changes in the `analysisStore`.

---

## 4. Partial Failure Policy

If the AI Service fails partially, the system should follow the **"Best Effort Highlight"** rule:
- **LLM Fails / NER Succeeds**: Return `summary: null`, `timeline: []`, but include `flags` and `sources` from NER.
- **NER Fails / LLM Succeeds**: Return `summary` and `timeline`, but empty `flags`.
- **UI Indication**: Show a subtle "Partial Result" banner if any core component (summary or flags) is missing.
