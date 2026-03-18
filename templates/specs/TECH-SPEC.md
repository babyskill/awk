# {{PROJECT_NAME}} — Technical Specification

> Created: {{DATE}} | Last Updated: {{DATE}}
> Companion to: PROJECT.md, REQUIREMENTS.md

## Architecture Overview

[1-2 sentences describing the high-level architecture pattern being used.]

```
[Simple ASCII diagram of the system architecture]
```

## Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Language | [e.g., Swift] | [e.g., 6.0] | [Why] |
| Framework | [e.g., SwiftUI] | [e.g., iOS 17+] | [Why] |
| Backend | [e.g., Firebase] | [e.g., v11] | [Why] |
| Database | [e.g., GRDB] | [e.g., 7.x] | [Why] |
| AI/ML | [e.g., Gemini 2.5] | — | [Why] |
| Analytics | [e.g., Firebase Analytics] | — | [Why] |

## Architecture Decisions

### AD-1: [Decision Title]

**Context:** [What problem or question prompted this decision?]
**Decision:** [What was decided]
**Consequences:** [What trade-offs or implications does this have?]
**Alternatives Considered:** [What else was evaluated?]

### AD-2: [Decision Title]

**Context:** [...]  
**Decision:** [...]  
**Consequences:** [...]

## Patterns & Conventions

### Code Organization
```
[Folder structure with descriptions]
```

### Naming Conventions
- Files: [e.g., PascalCase for types, camelCase for functions]
- Modules: [e.g., feature-based grouping]
- Tests: [e.g., Test suffix, describe/it pattern]

### Error Handling
[Standard error handling approach for the project]

### State Management
[How state is managed across the app]

## Constraints & Non-Negotiables

> [!CAUTION]
> These constraints MUST be followed in ALL implementation plans.

1. **[Constraint 1]:** [e.g., All network calls must have offline fallback]
2. **[Constraint 2]:** [e.g., No hardcoded strings — use localization]
3. **[Constraint 3]:** [e.g., All AI calls must respect quota limits]
4. **[Constraint 4]:** [e.g., Minimum iOS 17 / Android 14 support]

## Security Requirements

- Authentication: [e.g., Firebase Auth with Apple/Google Sign-In]
- Data at rest: [e.g., Keychain for sensitive data]
- API keys: [e.g., Firebase Remote Config, never hardcoded]

## Performance Targets

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cold start | < [X]s | Instruments / Profiler |
| API response | < [X]ms | Network logs |
| Memory | < [X]MB | Memory profiler |
| App size | < [X]MB | Archive build |
