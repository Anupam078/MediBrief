# MediBrief

MediBrief is a clinical decision support platform that turns unstructured patient notes into structured insights for review. It combines a Python AI service, a Spring Boot backend, and a React frontend into one workflow for triage, summary, and flagging support.

## What It Does

- Accepts patient notes and clinical text as input.
- Extracts relevant entities and summary signals from the AI service.
- Applies backend rule logic to produce flags and timeline-style output.
- Presents the analysis in a browser-based interface for quick review.

## Project Layout

- [ai-service](ai-service): Python NLP and summarization service.
- [backend](backend): Spring Boot API that orchestrates analysis and rule evaluation.
- [frontend](frontend): React application for submitting notes and viewing results.
- [api_specification.yaml](api_specification.yaml): API contract for the system.
- [master_execution_plan.md](master_execution_plan.md): End-to-end implementation and rollout plan.

## Tech Stack

- Python for the AI/NLP service.
- Spring Boot and Java 21 for the backend.
- React 19 and Vite for the frontend.
- Zustand for lightweight client state management.

## Status

This repository contains the initial MediBrief release. The current version is [v0.1.0](RELEASE_NOTES.md), which establishes the full project structure and the first working implementation of the platform.

## Getting Started

Use the repo root as the starting point, then run each service from its own folder.

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI Service

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

## Release Notes

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for the first published version of MediBrief.

## Notes

- The documentation files in the repository describe the design, delivery plan, and supporting standards for the system.
- If you are setting this up locally, review the backend and frontend configuration files before connecting the services together.
