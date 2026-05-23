# PRD.md — MediBrief AI
## Product Requirements Document

---

## 1. Problem Statement

Doctors and clinical staff spend a disproportionate amount of time parsing long, unstructured patient records before making clinical decisions. This creates three concrete problems:

1. **Information overload** — Patient histories span pages of free-form text with no structure.
2. **Missed critical data** — Allergies, chronic conditions, and drug interactions buried in paragraphs are frequently overlooked.
3. **Cognitive load and time cost** — Reading and mentally organizing patient notes consumes 5–15 minutes per patient in busy outpatient or emergency settings.

**MediBrief AI** addresses these problems by converting raw medical text into a structured, actionable clinical overview — instantly.

---

## 2. Target Users

### Primary User: Attending Physician / Resident Doctor
- Reviews patient records before consultations
- Needs rapid orientation to a patient's clinical history
- Operates in time-constrained environments (OPD, ICU, ER)

### Secondary User: Clinic Administrator / Healthcare Staff
- Manages patient intake and record preparation
- May pre-process records before physician review

### Out of Scope (MVP):
- Patients themselves
- Insurance/billing personnel
- Multi-provider collaborative workflows

---

## 3. User Journeys

### Journey 1: Quick Patient Orientation (Primary Flow)
```
1. Doctor opens MediBrief AI web app
2. Pastes raw patient record text into input field
3. Clicks "Analyze"
4. Within 15–30 seconds, sees:
   - 3–4 sentence clinical summary
   - Chronological timeline of events
   - Color-coded critical flags (HIGH/MEDIUM/LOW)
5. Clicks any flag → source sentence highlighted in original text
6. Doctor makes informed clinical decision faster
```

### Journey 2: Allergy Check Before Prescribing
```
1. Doctor is about to prescribe medication
2. Quickly pastes patient notes → clicks Analyze
3. HIGH severity ALLERGY flag appears immediately
4. Doctor sees: "Penicillin — Documented anaphylactic reaction"
5. Doctor avoids prescribing contraindicated drug
```

### Journey 3: Surgical History Review
```
1. Pre-operative team reviews patient record
2. MediBrief surfaces PAST_PROCEDURE flags
3. Timeline shows surgical events chronologically
4. Team adjusts anesthesia or surgical plan accordingly
```

---

## 4. Feature Definitions

### Feature 1: Smart Patient Summary

**Description:** Generate a 3–4 sentence clinician-facing summary of the patient's medical record.

**Acceptance Criteria:**
- Summary must be factual, derived only from input text (no hallucinations)
- Must include: patient demographics (if present), key conditions, current medications, recent events
- Must complete within 30 seconds on target hardware
- Summary must not exceed 5 sentences

**Input:** Raw unstructured text (plain text)
**Output:** String (rendered as a summary card in UI)

---

### Feature 2: Chronological Timeline

**Description:** Extract and order key clinical events (diagnoses, procedures, medications started) by date or approximate period.

**Acceptance Criteria:**
- Events sorted chronologically (oldest first)
- If no explicit date: infer approximate period (e.g., "childhood", "3 years ago", "2019")
- Each event includes: date/period + description
- If no timeline can be constructed: display empty state with message

**Output format:**
```json
[
  { "date": "2015", "event": "Diagnosed with Hypertension" },
  { "date": "2019", "event": "Appendectomy performed" }
]
```

---

### Feature 3: Critical Flagging

**Description:** Identify and classify high-risk clinical entities with severity levels.

**Flag Types:**
| Type | Trigger | Default Severity |
|---|---|---|
| ALLERGY | Any allergy entity extracted | HIGH |
| CHRONIC_DISEASE | Known chronic condition detected | HIGH |
| ACUTE_EVENT | Recent acute episode (MI, stroke, etc.) | HIGH |
| PAST_PROCEDURE | Surgical or invasive history | MEDIUM |
| MEDICATION_NOTE | Active or discontinued medications | LOW |

**Flag Schema:**
```json
{
  "type": "ALLERGY",
  "entity": "Penicillin",
  "severity": "HIGH",
  "reason": "Documented anaphylactic reaction",
  "confidence": "HIGH",
  "sourceId": "ALLERGY_34"
}
```

**Severity Color Coding (UI):**
- HIGH → Red
- MEDIUM → Orange / Amber
- LOW → Yellow / Blue

**Acceptance Criteria:**
- All allergies must surface as HIGH with specific reason
- Chronic diseases surfaced with contextual reason
- No flag should be generated for entities not in the source text

---

### Feature 4: Source Highlighting (Traceability)

**Description:** Each extracted entity and flag links to the originating sentence in the input text.

**Behavior:**
- User clicks any flag or entity
- Corresponding sentence in original input is highlighted/underscored
- Tooltip or side panel shows the source sentence

**Acceptance Criteria:**
- Every flag must have a `sourceId` mapping to a source sentence
- Source sentence must be the exact sentence from input text
- Highlighting must be visually distinct and accessible

---

## 5. UX Expectations

### Layout (Single Page Application)
```
┌──────────────────────────────────────────────────────┐
│  [MediBrief AI]                         [Help] [Info] │
├────────────────────────┬─────────────────────────────┤
│  INPUT PANEL           │  RESULTS PANEL               │
│                        │                              │
│  [Patient Record       │  [Summary Card]              │
│   Text Area]           │                              │
│                        │  [Timeline View]             │
│  [Analyze Button]      │                              │
│                        │  [Critical Flags]            │
│  [Clear] [Sample]      │  🔴 Allergy: Penicillin     │
│                        │  🟠 Chronic: Hypertension   │
│                        │                              │
│                        │  [Source: highlighted text]  │
└────────────────────────┴─────────────────────────────┘
```

### Interaction Rules
- Analyze button disabled while processing
- Loading spinner during AI processing
- Results appear section by section (summary first, then timeline, then flags)
- Clicking a flag scrolls to and highlights the source sentence
- "Sample Record" button loads demo text for testing

### Accessibility
- Severity indicated by both color AND icon/label (not color alone)
- Keyboard navigable flags list
- Screen-reader-friendly summary card

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Response time (end-to-end) | < 30 seconds on target hardware |
| Input text limit | 5000 characters max |
| Minimum input length | 50 characters |
| Availability (MVP) | Best-effort (student deployment) |
| Privacy | No patient data stored; stateless processing |
| Supported browsers | Chrome, Firefox, Edge (latest 2 versions) |
| Mobile | Responsive layout (usable but not primary) |

---

## 7. Constraints and Assumptions

### Constraints
- No external paid AI APIs (privacy + cost)
- All model inference must run locally on developer machine
- Target hardware: 16GB RAM, 4GB VRAM (RTX 2050)
- Backend and frontend deployed on free tiers (Render, Vercel)
- AI service exposed via tunnel (ngrok / Cloudflare Tunnel)

### Assumptions
- Input is English-language medical text
- Input is provided manually (copy-paste) in MVP; file upload is future scope
- No authentication or user accounts in MVP
- No patient data persistence — each session is stateless
- Model latency 10–25 seconds is acceptable for MVP
- Doctors using the tool are technically comfortable with web apps

---

## 8. Out of Scope (MVP)

- PDF / DICOM / HL7 file upload
- Multi-patient comparison
- Drug interaction checking
- Prescription generation
- EHR system integration (FHIR)
- User authentication and role management
- Multi-language support
- Audit trails and compliance (HIPAA/DPDP)
- Mobile native apps

---

## 9. Success Metrics

| Metric | MVP Target |
|---|---|
| Summary accuracy | Clinically coherent summary in >90% of test records |
| Allergy detection rate | >95% recall on explicit allergy mentions |
| End-to-end latency | <30s median on target hardware |
| Flag relevance | <10% false positive flags in manual review |
| Source traceability | 100% of flags have valid source sentence |
| User task time (demo) | Doctor oriented to patient in <60s vs. 5–15min baseline |

---

## 10. Future Scope (Post-MVP)

| Feature | Priority |
|---|---|
| PDF / HL7 file upload | High |
| Drug interaction checker | High |
| Multi-patient dashboard | Medium |
| FHIR/EHR integration | Medium |
| Fine-tuned clinical LLM | Low (resource-intensive) |
| Embeddings-based semantic search across records | Low |
| Role-based access + audit logs | High (for production) |
