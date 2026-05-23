# User Flow Diagrams

The following Mermaid diagrams represent the critical user journeys within MediBrief AI.

## 1. Core Patient Record Processing

This flow covers the primary interaction of a doctor inputting raw medical text and receiving structured insights.

```mermaid
graph TD
    A[Doctor enters Raw Medical Text] --> B{Valid Input?}
    B -- No (<50 or >5000 chars) --> C[Show Error Message]
    B -- Yes --> D[Click 'Analyze']
    D --> E[Show Loading Spinner]
    E --> F[API POST /api/patient/process]
    F --> G{Internal Cache Hit?}
    G -- Yes --> H[Retrieve Cached Result]
    G -- No --> I[Call AI Service via Tunnel]
    I --> J[Preprocess & Expand Abbreviations]
    J --> K[Run NER Extraction - SciSpaCy]
    K --> L[Generate LLM Summary & Timeline - Mistral]
    L --> M[Assemble Result & Apply Rules]
    M --> N[Store in Cache]
    H --> O[Display Results to Doctor]
    N --> O
    O --> P[Render Summary Card]
    O --> Q[Render Timeline]
    O --> R[Render Critical Flags]
```

---

## 2. Source Traceability (Clinician Verification)

This flow illustrates how a doctor verifies a summary claim or critical flag by checking the original source.

```mermaid
graph TD
    A[Doctor views Critical Flags Panel] --> B[Click 'Allergy: Penicillin']
    B --> C[Retrieve 'sourceId' from Flag object]
    C --> D[Lookup 'sourceId' in Sources map]
    D --> E[Highlight corresponding sentence in Input Panel]
    E --> F[Scroll Input Panel to Highlighted Text]
    F --> G[Doctor confirms AI extraction matches original text]
```

---

## 3. Deployment & Communication Flow (Tunneling)

This technical flow shows how the distributed components interact across environments.

```mermaid
sequenceDiagram
    participant User
    participant Vercel as React (Vercel)
    participant Render as Spring Boot (Render)
    participant Tunnel as ngrok / CF Tunnel
    participant AI as FastAPI (Local GPU)
    participant Ollama as Ollama Runtime

    User->>Vercel: Input text + 'Analyze'
    Vercel->>Render: POST /api/patient/process
    Render->>Render: Validate & Hash
    Render->>Tunnel: Forward Request
    Tunnel->>AI: Incoming POST /process
    AI->>AI: Preprocessing & NER
    AI->>Ollama: Prompt Generation
    Ollama-->>AI: LLM Completion (JSON)
    AI-->>Tunnel: Return AI Result
    Tunnel-->>Render: Return AI Result
    Render->>Render: Execute Rule Engine (Flags)
    Render-->>Vercel: Final PatientResponse
    Vercel-->>User: Update Display
```
