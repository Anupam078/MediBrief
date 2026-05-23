# Master Execution Plan: MediBrief AI (Zero to Deployment)

This document serves as the authoritative roadmap for building the **MediBrief AI** Clinical Decision Support System. It is structured sequentially to resolve architectural dependencies, starting from the local AI core up to the cloud-deployed frontend.

---

## Phase 1: Local Environment & Infrastructure Initialization
**Goal**: Prepare the developer machine and baseline project structures.

### Step 1: System Dependencies & Directories
- [ ] **[MANUAL]** Install Core Runtimes:
    - [ ] `node -v` (Verify Node.js 18+)
    - [ ] `java -version` (Verify Java 17/21)
    - [ ] `python --version` (Verify Python 3.10+)
- [ ] **[AI-CODE]** Create Root Directory Structure:
    - Create `ai-service/`, `backend/`, and `frontend/` directories.
    - Create a global `.gitignore` and `README.md`.

### Step 2: AI Runtime Setup (Ollama)
- [ ] **[MANUAL]** Install [Ollama](https://ollama.com/download).
- [ ] **[MANUAL]** Pull Models:
    - `ollama pull mistral`
    - `ollama pull phi3`
- [ ] **[MANUAL]** Test Inference:
    - Run `ollama run mistral "Hello"` to verify the model is responsive.

### Step 3: Service Scaffolding
- [ ] **[MANUAL]** Initialize Spring Boot:
    - Go to [start.spring.io](https://start.spring.io/).
    - Project: **Maven**, Language: **Java**, Version: **3.2+**.
    - Dependencies: `Spring Web`, `Validation`, `Lombok`, `Spring Configuration Processor`.
    - Extract into the `backend/` folder.
- [ ] **[MANUAL]** Initialize React:
    - Command: `npx create-vite@latest frontend --template react`
    - Command: `cd frontend && npm install`
- [ ] **[MANUAL]** Initialize FastAPI:
    - Command: `cd ai-service && python -m venv venv`
    - Command: `source venv/bin/activate` (or version for Windows).

---

## Phase 2: The FastAPI & AI Service (The NLP Core)
**Goal**: Build the extraction engine. **Status**: **BLOCKER** for Phase 3.

### Step 1: Environment & Models
- [ ] **[AI-CODE]** Create `ai-service/requirements.txt` with `fastapi`, `uvicorn`, `spacy`, `scispacy`, `requests`.
- [ ] **[MANUAL]** Install SciSpaCy model:
    - `pip install https://s3-us-west-2.amazonaws.com/ai2-s2-scispacy/releases/v0.5.3/en_core_sci_md-0.5.3.tar.gz`

### Step 2: Implementation
- [ ] **[AI-CODE]** Implement `preprocessor.py` (Abbreviation expansion logic).
- [ ] **[AI-CODE]** Implement `ner_extractor.py` (SpaCy entity extraction & source mapping).
- [ ] **[AI-CODE]** Implement `summarizer.py` (Ollama API calls for Summary/Timeline).
- [ ] **[AI-CODE]** Implement `main.py` (FastAPI routes and error handlers).

### Step 3: Verification
- [ ] **[AI-CODE]** Create `test_ai_service.py` to run local endpoint tests.

---

## Phase 3: The Spring Boot Backend (The Rule Engine & Orchestrator)
**Goal**: Build the business logic and API bridge.

### Step 1: Configuration
- [ ] **[AI-CODE]** Configure `application.yml` and `.env` (based on [.env.example](file:///c:/Users/ASUS/Desktop/MediBrief/.env.example)).
- [ ] **[AI-CODE]** Implement CORS configurations for Vercel.

### Step 2: Core Logic
- [ ] **[AI-CODE]** Create DTOs (`PatientRequest`, `PatientResponse`, `AiResponse`, `Flag`).
- [ ] **[AI-CODE]** Implement `AiServiceClient.java` using RestTemplate/WebClient.
- [ ] **[AI-CODE]** Implement `RuleEngine.java` (Deterministic clinical flagging).
- [ ] **[AI-CODE]** Implement `PatientService.java` (Orchestration & Caching).
- [ ] **[AI-CODE]** Implement `PatientController.java` (REST Endpoint).

---

## Phase 4: The React Frontend (The UI Layer)
**Goal**: Premium interface for record analysis.

### Step 1: Foundation
- [ ] **[MANUAL]** Install CSS dependencies: `npm install -D tailwindcss postcss autoprefixer`.
- [ ] **[AI-CODE]** Implement `index.css` using the Design Tokens from [style_guide.md](file:///c:/Users/ASUS/Desktop/MediBrief/style_guide.md).

### Step 2: State & API
- [ ] **[AI-CODE]** Implement `useAnalysisStore` (State Management).
- [ ] **[AI-CODE]** Implement `api.js` service for backend communication.

### Step 3: UI Components
- [ ] **[AI-CODE]** Build `InputPanel` (Textarea + Analyze button with loading).
- [ ] **[AI-CODE]** Build `ResultsPanel` (SummaryCard, Timeline view).
- [ ] **[AI-CODE]** Build `FlagsPanel` (Color-coded severity cards).
- [ ] **[AI-CODE]** Implement Source Highlighting logic (Syncing clicks to `InputPanel`).

---

## Phase 5: Integration, ngrok Tunneling, & Testing
**Goal**: Full system connectivity.

### Step 1: Connectivity
- [ ] **[MANUAL]** Start ngrok tunnel: `ngrok http 8000`.
- [ ] **[MANUAL]** Update `AI_SERVICE_URL` in backend `.env` with the ngrok URL.

### Step 2: E2E Validation
- [ ] **[AI-CODE]** Run a "Smoke Test": Input "Patient John D. allergic to Penicillin" and verify `ALLERGY` flag in UI.

---

## Phase 6: Pre-Deployment Preparation
**Goal**: Launch to cloud.

### Step 1: Scripts
- [ ] **[AI-CODE]** Create `Procfile` for Render (Java).
- [ ] **[AI-CODE]** Configure `vercel.json` for React.
- [ ] **[MANUAL]** Set production environment variables in Vercel and Render dashboards.

Master Execution Plan complete. Please review the [MANUAL] tasks in Phase 1. Whenever you are ready, type 'Execute Phase 1, Step 1' and I will provide the commands/code for that specific step.
