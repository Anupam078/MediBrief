# State Management Document

MediBrief AI uses a combination of client-side React state for UI reactivity and server-side caching for performance optimization.

## 1. Frontend State (React / Zustand)

The frontend maintains a centralized state to manage the lifecycle of a patient record analysis.

### Store Name: `useAnalysisStore`

| State Property | Type | Default | Description |
|---|---|---|---|
| `inputText` | `string` | `""` | The raw medical text entered by the user. |
| `isAnalyzing` | `boolean` | `false` | Loading state during API calls. |
| `analysisResult` | `PatientResponse` | `null` | The processed data (summary, timeline, flags). |
| `activeSourceId` | `string` | `null` | The ID of the currently highlighted entity/flag. |
| `errorMessage` | `string` | `null` | Current error message to display in UI. |

### Actions (Mutations)

- `setInputText(text: string)`: Updates the raw input text.
- `startAnalysis()`: Sets `isAnalyzing` to `true` and clears previous results/errors.
- `setResult(data: PatientResponse)`: Stores the API response and sets `isAnalyzing` to `false`.
- `setError(msg: string)`: Sets the error message and resets `isAnalyzing`.
- `highlightSource(sourceId: string)`: Sets the `activeSourceId` for UI highlighting.
- `reset()`: Returns the store to its initial state.

---

## 2. Backend State (Spring Boot)

The backend is **stateless** across requests but maintains a **Persistent Caching Layer** to avoid redundant AI processing.

### Processing Cache (`ProcessingCache.java`)

- **Implementation**: `ConcurrentHashMap<String, CachedResult>`
- **Storage Strategy**:
    - **Key**: `SHA-256(raw_text)`
    - **Value**: `PatientResponse` + `creation_timestamp`
- **Eviction Policy**:
    - **TTL**: 1 hour (configurable).
    - **Cleanup**: On-demand check during lookup (`isExpired()`).

### Rule Engine (Derived State)

- The Rule Engine does not store state. It computes `flags` on-the-fly from the `entities` returned by the AI service.

---

## 3. Data Flow Pattern

1. **User Input**: User types in `InputPanel` → updates `inputText` in `useAnalysisStore`.
2. **Execution**: User clicks "Analyze" → `startAnalysis()` action → `POST /api/patient/process`.
3. **Optimistic Cache Check**: 
    - Backend hashes input.
    - If hash exists in `ProcessingCache` and not expired → Return cached response immediately.
    - Else → Call AI Service.
4. **Resolution**: 
    - Success → `setResult(data)` → UI sections (Summary, Timeline, Flags) re-render.
    - Failure → `setError(msg)` → Error toast/alert displayed.
5. **Interaction**: User clicks a `Flag` → `highlightSource(id)` → `SourceHighlight` component scrolls to and highlights the corresponding sentence.
