# Test Plan & Coverage Requirements

MediBrief AI follows a **"Pyramid Testing"** model, with a focus on high unit test coverage for the deterministic rule engine and integration tests for the AI pipeline.

## 1. Testing Strategy

### Layer 1: Spring Boot (Backend)
- **Framework**: JUnit 5, Mockito, AssertJ.
- **Unit Tests**:
    - **`RuleEngineTest.java`**: Verify that specific entities (Allergy, Disease) trigger the correct flag types and severity levels.
    - **`PatientServiceTest.java`**: Mock `AiServiceClient` and verify result merging and caching logic.
- **Integration Tests**:
    - **`PatientControllerIT.java`**: Use `@SpringBootTest` and `MockMvc` to verify the `/api/patient/process` endpoint, including validation error handling (400) and service unavailability (503).

### Layer 2: FastAPI (AI Service)
- **Framework**: Pytest.
- **Unit Tests**:
    - **`test_preprocessor.py`**: Verify abbreviation expansion and text cleaning with a suite of medical string samples.
    - **`test_ner_extractor.py`**: Verify entity extraction (Mock the SciSpaCy model where possible or use small test strings).
- **Integration Tests**:
    - **`test_main.py`**: Verify the `/process` endpoint using `TestClient`. Mock the `Ollama` API to avoid slow/flaky local LLM calls.

### Layer 3: React (Frontend)
- **Framework**: Vitest, React Testing Library.
- **Unit Tests**:
    - **`useAnalysisStore.test.js`**: Verify state transitions (loading → success, loading → error).
- **Component Tests**:
    - **`SummaryCard.test.jsx`**: Verify rendering of summary text and loading pulse.
    - **`FlagsPanel.test.jsx`**: Verify that clicking a flag calls the highlight function.

---

## 2. Critical Path Coverage

The following functions **require 100% unit test coverage**:
- `RuleEngine.generateFlags()` (Java)
- `preprocessor.expand_abbreviations()` (Python)
- `useAnalysisStore.actions` (JS/TS)

---

## 3. Naming Conventions

- **Java**: `{ClassName}Test.java` (Unit), `{ClassName}IT.java` (Integration).
- **Python**: `test_{module_name}.py`.
- **React**: `{ComponentName}.test.jsx`.

---

## 4. Test Environment Requirements

- **Local Development**: Vitest/JUnit should run with no external dependencies.
- **Mocking Strategy**:
    - **Ollama**: Must be mocked by intercepting `http://localhost:11434`.
    - **SciSpaCy**: Use the `en_core_sci_md` model if available, otherwise mock the `nlp(text)` output.
    - **API**: Use `msw` (Mock Service Worker) for frontend integration tests.
