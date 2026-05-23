# Coding Standards & Linting Rules

MediBrief AI is a multi-language project (Java, Python, JavaScript). To maintain consistency, all AI-generated code must adhere to these standards.

## 1. ESLint Configuration (Frontend)

File: `frontend/.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "no-unused-vars": "warn",
    "prefer-const": "error",
    "arrow-body-style": ["error", "as-needed"]
  }
}
```

## 2. General House Rules

### Naming Conventions
- **JavaScript/React**: `camelCase` for variables and functions; `PascalCase` for components and classes.
- **Java (Spring Boot)**: `camelCase` for fields and methods; `PascalCase` for classes; `UPPER_SNAKE_CASE` for constants.
- **Python (FastAPI)**: `snake_case` for variables and functions; `PascalCase` for Pydantic models.

### Architectural Patterns

1.  **Early Returns**: Prefer guard clauses over deeply nested `if/else` blocks.
2.  **Stateless First**: Avoid maintaining session state in the backend logic. Every request should contain all necessary context.
3.  **Explicit DTOs**: Never expose internal entities (if any) directly to the API. Use dedicated Request/Response DTOs.
4.  **Error Handling**: Never "swallow" exceptions. Always log and return a structured error response.

### File Structure
- **React**: Group by type (`components/`, `services/`, `hooks/`).
- **Spring Boot**: Standard Maven/Gradle layout (`controller/`, `service/`, `model/`, `client/`).
- **FastAPI**: Single-level module structure for small services (`main.py`, `preprocessor.py`, `models/`).

## 3. Python Linting (PEP 8)
- Use `black` for formatting.
- Line length: 88 characters (Black default).
- Imports: Standard library first, then third-party, then local modules.

## 4. Java Styling
- Follow **Google Java Style Guide**.
- Standard 4-space indentation.
- Use Lombok annotations (`@Data`, `@Builder`, `@Slf4j`) to reduce boilerplate.
