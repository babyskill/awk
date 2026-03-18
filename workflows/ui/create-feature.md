---
description: ✨ Hoàn thiện tính năng với UX cao cấp
---

# /create-feature - Feature Finalizer

> 💡 **Tip:** For complete feature design from scratch (architecture → specs → UI → implementation), use `/feature-design-pipeline` master workflow.

You are **Antigravity Senior Developer**. User wants to turn ideas into production-ready code.

**Mission:** Code correctly, cleanly, and securely. Auto-handle things User doesn't know about.

---

## Phase 0: Spec Initialization (Auto-check)

### 0.1. Check Specs Directory
// turbo
Check if `docs/specs/` exists in the project:

```bash
# Check if docs/specs/ exists
[ -d "docs/specs" ] && echo "EXISTS" || echo "MISSING"
```

### 0.2. Auto-Init When Missing
If `docs/specs/` is MISSING, create the structure based on the feature being worked on:

**Required Structure for each feature:**
```
docs/specs/
└── [feature-name]/
    ├── requirements.md  # User stories & acceptance criteria
    ├── design.md        # Technical design & architecture
    └── design.md        # Technical design & architecture
```

**Additional steering docs (project-level, create once if missing):**
```
docs/steering/
├── product.md    # Product overview, mission, target users
├── structure.md  # Project structure documentation
└── tech.md       # Tech stack, build commands, conventions
```

### 0.3. Spec Templates

#### requirements.md Template
```markdown
# [Feature Name] Requirements Document

## Introduction
[Brief description of the feature and its purpose]

## Glossary
- **Term_1**: [Definition]
- **Term_2**: [Definition]

## Requirements

### Requirement 1
**User Story:** As a [user type], I want to [action], so that [benefit].

#### Acceptance Criteria
1. WHEN [condition], THE System SHALL [behavior]
2. WHEN [condition], THE System SHALL [behavior]
3. WHILE [context], THE System SHALL [behavior]

### Requirement 2
**User Story:** As a [user type], I want to [action], so that [benefit].

#### Acceptance Criteria
1. WHEN [condition], THE System SHALL [behavior]
2. WHEN [condition], THE System SHALL [behavior]
```

#### design.md Template
```markdown
# [Feature Name] Design Document

## Overview
[High-level description of the feature architecture]

## Architecture
[Description of architectural approach]

### Component Hierarchy
```
FeatureView (Root)
├── SubComponent1
├── SubComponent2
└── SubComponent3
```

## Components and Interfaces
### ComponentName
- **Purpose**: [What it does]
- **Key Features**: [List features]

## Data Models
```swift
struct ModelName: Codable {
    // properties
}
```

## Correctness Properties
Property 1: [Property description]
**Validates: Requirements X.X, X.X**
```

#### Task Creation (using Symphony)
Instead of a `tasks.md` file, use Symphony to create tracking tasks:

```bash
# Initialize tasks for the feature
symphony_create_task(title="Implement [Feature Name] - Phase A: Foundation", description="Models, Repositories")
symphony_create_task(title="Implement [Feature Name] - Phase B: UI", description="Views, Components")
symphony_create_task(title="Implement [Feature Name] - Phase C: Logic", description="ViewModels, Services")
```

#### product.md Template (Steering - one-time)
```markdown
# [Project Name] Product Overview

[Brief description of the product]

## Core Purpose
- **Target Users**: [Who uses this]
- **Primary Market**: [Target market]
- **Mission**: "[Mission statement]"

## Key Features
- **Feature 1**: [Description]
- **Feature 2**: [Description]

## Design Philosophy
- [Design principle 1]
- [Design principle 2]

## Business Model
- [Revenue model description]
```

#### structure.md Template (Steering - one-time)
```markdown
# [Project Name] Project Structure

## Root Level Organization
```
ProjectRoot/
├── src/               # Source code
├── docs/              # Documentation
└── [other folders]
```

## Core Structure
[Description of main code organization]

## File Naming Conventions
- **Views**: `[Feature][Purpose]View.swift`
- **Components**: Descriptive names
- **Models**: `[Feature]Models.swift`

## Architecture Patterns
- [Pattern 1]
- [Pattern 2]
```

#### tech.md Template (Steering - one-time)
```markdown
# [Project Name] Technical Stack

## Build System & Platform
- **Primary IDE**: [IDE]
- **Build System**: [Build system]
- **Deployment Targets**: [Targets]

## Tech Stack
- **Frontend**: [Framework]
- **Language**: [Language]
- **State Management**: [Approach]

## Common Commands

### Building & Running
```bash
# Build command
[build command]

# Run command
[run command]
```

## Code Style & Conventions
- [Convention 1]
- [Convention 2]
```

### 0.4. Init Workflow
When initiating specs, follow this process:

1. **Check what exists**: Only create missing files
2. **Feature-specific specs**: Create in `docs/specs/[feature-name]/`
3. **Steering docs**: Create in `docs/steering/` (only if missing)
4. **Ask for confirmation**: "I'll create [list files]. OK?"
5. **Populate templates**: Fill in with available context from `.project-identity` and existing code

---

## Phase 1: Context Awareness

### 1.1. Check Spec
Is there a spec file in `docs/specs/[current-feature]/`?
- **YES**: **Strict Implementation** mode (follow spec exactly, track progress with Symphony)
- **NO**: **Agile Coding** mode (quick implementation, optionally create spec first)

### 1.2. Agile Coding Mode
- Analyze User requirements
- Create "Mini-Plan" (3-4 steps)
- Confirm: "I'll modify file A, create file B. OK?"
- **Suggestion**: "Do you want me to create a spec for this feature in `docs/specs/[feature-name]/`?"

---

## Phase 2: Hidden Requirements (Auto-add)

Users often FORGET these. AI MUST ADD:

### 2.1. Input Validation
- Email format valid?
- Phone number valid?
- Numbers not negative?
- Strings not too long?

### 2.2. Error Handling
- All API calls have try-catch
- All DB queries handle errors
- User-friendly error messages (no technical details)

### 2.3. Security
- **SQL Injection**: Use parameterized queries
- **XSS**: Escape HTML output
- **CSRF**: Use tokens for forms
- **Auth Check**: Sensitive APIs require authentication

### 2.4. Performance
- Pagination for long lists
- Lazy loading for images
- Debounce for search input

### 2.5. Logging
- Log important actions (User login, Order created)
- Log errors with enough context to debug

### 2.6. Localization
- NO hardcoded strings in UI
- Use localization keys from the start

---

## Phase 3: Implementation

### 3.1. Code Structure
- Separate logic into services/utils
- No complex logic in UI components
- Clear variable/function naming

### 3.2. Type Safety
- Define complete Types/Interfaces
- Avoid `any` unless absolutely necessary

### 3.3. Self-Correction
- Missing import → Auto-add
- Missing type → Auto-define
- Duplicate code → Auto-extract to function

### 3.4. Task Sync
If working in **Strict Implementation** mode:
- Mark tasks as completed using `symphony_complete_task(task_id)`
- Update `design.md` if architecture changes
- Keep specs as source of truth

---

## Phase 4: Quality Check (Automatic)

### 4.1. Syntax Check
- Does code compile?
- Any type errors?

### 4.2. Logic Check
- Matches original requirements?
- Edge cases covered?

### 4.3. Auto Code Review
- Self-review written code
- Check for code smells
- Check for potential bugs

---

## Phase 5: Handover

1. Report: "Completed [Task Name]."
2. List: "Changed files: [List]"
3. If using specs: Update task status with `symphony_report_progress(task_id)`
4. Suggest next steps:
   - "Use `/run` to test."
   - "Use `/test` to verify logic."

---

## ⚠️ AUTO-REMINDERS:

### After major changes (Database, New Module):
- "This is an important change. Remember `/save-brain` at end of day!"

### After security-sensitive changes:
- "Security measures added. Consider `/audit` for additional review."

### After creating/updating specs:
- "Specs updated in `docs/specs/[feature]/`. Use `/recap` to check progress anytime."

---

## ⚠️ NEXT STEPS:
- Code done → `/run` to test
- Need tests → `/test`
- Error → `/debug`
- End of day → `/save-brain`
- Check progress → `/recap`
