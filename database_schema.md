# Database Schema & Data Dictionary

MediBrief AI is primarily **stateless**. However, it utilizes a caching layer in the Spring Boot backend to prevent redundant AI processing of identical records.

## Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    PATIENT_RECORD ||--|| CACHED_RESULT : "indexed by SHA-256 hash"
    CACHED_RESULT ||--o{ TIMELINE_EVENT : "contains"
    CACHED_RESULT ||--o{ CLINICAL_FLAG : "contains"
    CACHED_RESULT ||--o{ SOURCE_MAPPING : "contains"

    PATIENT_RECORD {
        string raw_text "50-5000 characters"
        string text_hash "PK - SHA-256 of raw_text"
    }

    CACHED_RESULT {
        string text_hash "FK - Reference to PATIENT_RECORD"
        string summary "3-4 sentence clinical summary"
        datetime timestamp "Time of processing"
        boolean is_expired "Calculated based on TTL (default 1h)"
    }

    TIMELINE_EVENT {
        string id "PK"
        string text_hash "FK"
        string date "Date or approximate period"
        string event "Description of clinical event"
    }

    CLINICAL_FLAG {
        string id "PK"
        string text_hash "FK"
        string type "ALLERGY, CHRONIC_DISEASE, etc."
        string entity "Extracted medical term"
        string severity "HIGH, MEDIUM, LOW"
        string reason "Detailed clinical justification"
        string confidence "AI confidence score"
        string source_id "Link to source sentence"
    }

    SOURCE_MAPPING {
        string source_id "PK"
        string text_hash "FK"
        string original_sentence "Exact sentence from input"
    }
```

---

## Data Dictionary

### Table: `ProcessingCache` (In-Memory ConcurrentHashMap)
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `text_hash` | `String` | **Primary Key** | SHA-256 hash of the input medical text. |
| `response_json` | `JSON / Object` | Not Null | The full `PatientResponse` object containing summary, timeline, and flags. |
| `created_at` | `Long / Timestamp` | Not Null | System time when the result was cached. |

---

### Data Model: `ClinicalFlag`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `type` | `Enum` | [ALLERGY, CHRONIC_DISEASE, ACUTE_EVENT, PAST_PROCEDURE, MEDICATION_NOTE] | The category of the clinical finding. |
| `entity` | `String` | Not Null | The specific medical term found (e.g., "Penicillin"). |
| `severity` | `Enum` | [HIGH, MEDIUM, LOW] | Risk level associated with the finding. |
| `reason` | `String` | Not Null | Explanation for why this flag was raised. |
| `confidence` | `Enum` | [HIGH, MEDIUM, LOW] | AI/Rule engine certainty level. |
| `sourceId` | `String` | Not Null | Unique identifier linking to the source sentence. |

---

### Data Model: `TimelineEvent`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `date` | `String` | Not Null | Timestamp or relative time (e.g., "2018", "6 months ago"). |
| `event` | `String` | Not Null | Description of the medical occurrence. |

---

### Data Model: `SourceMap`
| Key | Value Type | Description |
|---|---|---|
| `entity_id` | `String` | Unique ID of an entity (e.g., `DISEASE_42`). |
| `sentence` | `String` | The exact sentence from the raw text where the entity was found. |
