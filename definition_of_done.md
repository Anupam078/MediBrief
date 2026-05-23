# Definition of Done (DoD) Checklist

The AI Coding Agent must verify every piece of code and every feature against this 10-point checklist before marking a task as complete.

1.  **[ ] Compliance with Style Guide**: Does the UI follow the defined design tokens (colors, typography, spacing) and use the established component library?
2.  **[ ] API Contract Integrity**: Do all new/modified endpoints exactly match the `api_specification.yaml`?
3.  **[ ] Environment Variable Documentation**: Are all new configurations added to `.env.example` with clear descriptions?
4.  **[ ] Deterministic Rule Logic**: Are critical clinical flags generated via the Java Rule Engine, not solely by the LLM?
5.  **[ ] Source Traceability**: Does every extracted clinical entity link to a valid `sourceId` and a mapped original sentence?
6.  **[ ] Error Resilience**: Are all API calls wrapped in try/catch blocks that return the standardized error JSON format?
7.  **[ ] Test Coverage**: Are unit tests provided for all core processing functions (preprocessing, rules, state actions) as per the `test_plan.md`?
8.  **[ ] Performance Guardrails**: Does the code respect the 5000-character input limit and the 30-second timeout configuration?
9.  **[ ] Linting & Standards**: Does the code pass all ESLint (JS), PEP8 (Python), and Google Style (Java) checks with zero errors?
10. **[ ] Documentation Update**: Have all architectural or system design changes been reflected in the corresponding primary documents (`Architecture.md`, `System_Design.md`)?
