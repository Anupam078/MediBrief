# Architecture.md — MediBrief AI
## Clinical Decision Support System

---

## 1. System Overview

MediBrief AI is a multi-tier, modular system that ingests raw, unstructured patient medical records and returns structured clinical insights. The architecture is designed around **separation of concerns**: the frontend handles presentation, the backend handles orchestration and business logic, and the AI service handles all ML/NLP processing.

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                        │
│              React Frontend (Vercel)                     │
│   - Patient record input                                 │
│   - Summary / Timeline / Flags / Source display          │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS (REST)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                          │
│           Spring Boot API Server (Render)                │
│   - Input validation                                     │
│   - AI service orchestration                             │
│   - Rule-based critical flag engine                      │
│   - Response composition                                 │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP (REST)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                   AI SERVICE LAYER                       │
│         Python FastAPI Microservice (Local)              │
│   - Text preprocessing                                   │
│   - NER via SpaCy / SciSpaCy                             │
│   - Summarization + Timeline via Ollama (Mistral 7B)     │
│   - Source mapping                                       │
└────────────────────────┬─────────────────────────────────┘
                         │ Local IPC
                         ▼
┌──────────────────────────────────────────────────────────┐
│                  MODEL RUNTIME LAYER                     │
│                  Ollama (Local)                          │
│   - Mistral 7B (primary)                                 │
│   - Phi-3 (fallback)                                     │
│   - SpaCy / SciSpaCy (NER)                               │
└──────────────────────────────────────────────────────────┘
```

**Tunnel Layer (Dev/MVP Deployment):**
```
Backend (Render) ──► ngrok/Cloudflare Tunnel ──► AI Service (Local Machine)
```

---

## 3. Component Breakdown

### 3.1 React Frontend
| Responsibility | Detail |
|---|---|
| Input interface | Text area or file upload for raw patient records |
| API consumer | POSTs to Spring Boot `/api/patient/process` |
| Result renderer | Summary card, Timeline view, Critical Flags panel, Source highlighting |
| State management | Local React state or lightweight store (Zustand/Context) |

### 3.2 Spring Boot Backend
| Responsibility | Detail |
|---|---|
| REST API | Exposes `POST /api/patient/process` |
| Validation | Input length check, null/empty guard, sanitization |
| AI orchestration | Calls FastAPI `POST /process` with raw text |
| Rule engine | Applies severity flags to extracted entities |
| Response builder | Merges AI output + rule flags into final JSON |
| Optional | In-memory caching (ConcurrentHashMap or Redis) |

### 3.3 Python FastAPI AI Service
| Responsibility | Detail |
|---|---|
| Preprocessing | Abbreviation expansion, noise removal |
| NER | SpaCy/SciSpaCy entity extraction |
| Summarization | Ollama prompt invocation (Mistral 7B) |
| Source mapping | Sentence-level traceability per entity |
| Output | Structured JSON |

### 3.4 Ollama Model Runtime
| Responsibility | Detail |
|---|---|
| Model serving | Runs quantized Mistral 7B locally |
| Inference | Accepts prompt strings, returns completions |
| Fallback | Phi-3 for lower VRAM / faster response |

---

## 4. Communication Flow

```
[User] 
  │
  │  POST /api/patient/process  { "text": "..." }
  ▼
[Spring Boot]
  │  Validate → Call AI Service
  │  POST /process  { "text": "..." }
  ▼
[FastAPI AI Service]
  │  Preprocess → NER → Summarize → Source Map
  │  Return:
  │  {
  │    "summary": "...",
  │    "timeline": [...],
  │    "entities": { "diseases": [...], "allergies": [...], ... },
  │    "sources": { "entity_id": "original sentence", ... }
  │  }
  ▼
[Spring Boot]
  │  Apply Rule Engine → Generate flags
  │  Compose final response
  │  Return:
  │  {
  │    "summary": "...",
  │    "timeline": [...],
  │    "flags": [...],
  │    "sources": { ... }
  │  }
  ▼
[React Frontend]
  │  Render all sections
  ▼
[User sees structured clinical view]
```

---

## 5. Separation of Concerns

| Layer | Owns | Does NOT Own |
|---|---|---|
| Frontend | Rendering, UX interaction | Any business logic or AI logic |
| Spring Boot | Orchestration, rules, validation | Model inference, NLP |
| FastAPI | NLP pipeline, summarization, NER | Severity rules, response formatting |
| Ollama | Model inference | Any application logic |

---

## 6. Data Flow Pipeline

```
Raw Text Input
     │
     ▼
[Preprocessing]
  - Expand abbreviations (DM→Diabetes, HTN→Hypertension)
  - Strip noise, normalize whitespace
     │
     ▼
[NER — SpaCy/SciSpaCy]
  - Extract: diseases, allergies, medications, procedures
  - Output: { "diseases": [...], "allergies": [...], ... }
     │
     ▼
[LLM Summarization — Mistral 7B via Ollama]
  - Generate 3–4 sentence summary
  - Generate chronological timeline
  - Output: { "summary": "...", "timeline": [...] }
     │
     ▼
[Source Mapping]
  - Map each entity → originating sentence
  - Output: { "entity_id": "source_text" }
     │
     ▼
[Rule Engine — Spring Boot]
  - Allergy → HIGH severity
  - Chronic disease → HIGH
  - Past surgery → MEDIUM
  - Medication note → LOW
  - Output: flags[]
     │
     ▼
[Final Structured Response]
  {
    summary, timeline, flags, sources
  }
```

---

## 7. Deployment Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│  Vercel (Free)  │────▶│  Render (Free)   │────▶│  Local Dev Machine    │
│  React App      │     │  Spring Boot API │     │  FastAPI + Ollama     │
└─────────────────┘     └──────────────────┘     │  (via ngrok tunnel)   │
                                                  └───────────────────────┘
```

**Hardware Requirements (AI Service Host):**
- CPU: Ryzen 7 (or equivalent)
- GPU: RTX 2050 4GB VRAM (for quantized Mistral 7B)
- RAM: 16GB minimum

---

## 8. Key Architectural Principles

- **AI is a Service, not a Library**: FastAPI is fully decoupled; can be replaced or upgraded independently.
- **Rule Engine Complements LLM**: Critical flags are deterministic Java rules, not LLM-generated — ensures reliability.
- **Traceability by Design**: Every entity carries its source sentence through the entire pipeline.
- **No External AI APIs**: All inference is local via Ollama — privacy-first, cost-zero.
- **Stateless AI Service**: FastAPI holds no session state; every request is self-contained.
