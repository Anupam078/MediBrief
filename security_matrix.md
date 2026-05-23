# Security & Permissions Matrix

While the MediBrief AI MVP is initially stateless and does not require authentication, the following matrix defines the **Permission Policy** for future production integration and local developer access.

## 1. User Roles

| Role | Description |
|---|---|
| **Clinician (Doctor/Resident)** | Primary user who inputs records and reviews summaries. |
| **Nurse / Admin Staff** | Secondary user who prepares records for clinician review. |
| **System Admin** | Manages service infrastructure, model configurations, and cache clearing. |
| **Guest (Unauthenticated)** | Restricted access (view only, limited processing attempts). |

## 2. Action Permissions Matrix

| Action | API Endpoint | Clinician | Admin Staff | System Admin | Guest |
|---|---|---|---|---|---|
| **Process New Record** | `POST /api/patient/process` | ✅ | ✅ | ✅ | ⚠️ (Limit 3) |
| **Clear Processing Cache** | `DELETE /api/admin/cache` | ❌ | ❌ | ✅ | ❌ |
| **View System Health** | `/actuator/health` | ❌ | ❌ | ✅ | ❌ |
| **Update AI Model** | `POST /api/admin/model` | ❌ | ❌ | ✅ | ❌ |
| **Download Data Snippet** | `GET /api/patient/export` | ✅ | ❌ | ✅ | ❌ |

✅ = Allowed | ❌ = Denied | ⚠️ = Throttled

---

## 3. Infrastructure Security (MVP)

### CORS Policy
- **Spring Boot**: Only allows requests originating from the Vercel production domain (`https://medibrief.vercel.app`).
- **FastAPI**: Only allows requests from the Spring Boot server IP or the local tunnel host.

### Input Sanitization
- All raw text input via `POST /api/patient/process` is trimmed and sanitized for control characters in `preprocessor.py` to prevent basic prompt injection or malformed data issues.

### Privacy Policy
- **No Persistence**: No patient-identifiable data (PII) is stored in any database.
- **In-Memory Cache**: The `ProcessingCache` stores the SHA-256 hash of the text, not the text itself if possible, or is explicitly cleared every session.
- **Local Inference**: All medical records stay within the local developer environment (via ngrok to FastAPI) and are never sent to external AI providers (OpenAI, Anthropic).
