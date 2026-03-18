---
description: 📐 Thiết kế đặc tả kỹ thuật trước khi code
---

# /create-spec-architect - Spec Designer

> **Role:** Antigravity Architect - Chỉ thiết kế, KHÔNG code.
> **Output:** `docs/specs/[feature]/` với 2 file (requirements.md, design.md) và init tasks script

---

## Phase 1: Context Check

### 1.1. Verify Project Identity
// turbo
```bash
[ -f ".project-identity" ] && echo "✅ Found" || echo "❌ Missing"
```

### 1.2. Check Existing Specs
// turbo
```bash
[ -d "docs/specs" ] && ls docs/specs/ || echo "No specs yet"
```

---

## Phase 2: Gather Requirements

### 2.1. Ask User
Hỏi người dùng các câu hỏi:
1. **Feature name?** (slug format: `user-profile`, `meal-plan`)
2. **User Story?** "As a [who], I want [what], so that [why]"
3. **Key scenarios?** (Happy path + Edge cases)
4. **Platform?** (iOS/Android/Web/Expo)

### 2.2. Analyze Context
- Đọc `.project-identity` để hiểu tech stack
- Đọc `docs/steering/` nếu có
- Xác định patterns hiện có trong codebase

---

## Phase 3: Create Specs

### 3.1. Create Feature Directory
// turbo
```bash
mkdir -p docs/specs/[feature-name]
```

### 3.2. Requirements Template

**File:** `docs/specs/[feature]/requirements.md`

```markdown
# [Feature] Requirements

## Introduction
[1-2 sentences: What & Why]

## Glossary
- **Term**: Definition

## Requirements

### RQ-01: [Requirement Name]
**Story:** As a [user], I want [action], so that [benefit].

**Criteria:**
1. WHEN [trigger], THEN [behavior]
2. WHEN [error], THEN [handling]
3. WHILE [state], THEN [constraint]

### RQ-02: [Requirement Name]
**Story:** As a [user], I want [action], so that [benefit].

**Criteria:**
1. WHEN [trigger], THEN [behavior]
```

### 3.3. Design Template

**File:** `docs/specs/[feature]/design.md`

```markdown
# [Feature] Design

## Overview
[Architecture approach in 2-3 sentences]

## Component Hierarchy
```
FeatureView
├── HeaderComponent
├── ContentSection
│   ├── ItemList
│   └── ItemDetail
└── ActionButtons
```

## Data Models
```swift
struct Model: Codable, Identifiable {
    let id: UUID
    let property: String
}

enum ViewState {
    case idle, loading, loaded([Model]), error(Error)
}
```

## Key Interfaces
| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| ViewModel | State management | Repository |
| Repository | Data access | API, Cache |

## UI Specs
- **Colors:** [Primary, Secondary, Accent]
- **Typography:** [Title, Body, Caption sizes]
- **Animations:** [Duration, Easing]
```

### 3.4. Task Generation (Symphony)
 
**Script:** `docs/specs/[feature]/init_tasks.sh`
 
```bash
#!/bin/bash
 
# Phase A: Foundation
symphony_create_task(title= "Implement [Feature] - A1: Models" --body "File: Domain/Models/[Feature].swift\nValidates: RQ-01"
symphony_create_task(title= "Implement [Feature] - A2: Repository" --body "File: Data/Repositories/[Feature]Repository.swift\nValidates: RQ-01, RQ-02"
 
# Phase B: UI
symphony_create_task(title= "Implement [Feature] - B1: Main View" --body "File: Presentation/[Feature]/[Feature]View.swift\nValidates: RQ-01"
symphony_create_task(title= "Implement [Feature] - B2: Components" --body "File: Presentation/[Feature]/Components/\nValidates: RQ-01"
 
# Phase C: Logic
symphony_create_task(title= "Implement [Feature] - C1: ViewModel" --body "File: Presentation/[Feature]/[Feature]ViewModel.swift\nValidates: RQ-01, RQ-02"
 
# Phase D: Polish
symphony_create_task(title= "Implement [Feature] - D1: Localization" --body "Type: i18n"
symphony_create_task(title= "Implement [Feature] - D2: Accessibility" --body "Type: a11y"
 
# Phase E: Verify
symphony_create_task(title= "Implement [Feature] - E1: Unit Tests" --body "Type: test"
symphony_create_task(title= "Implement [Feature] - E2: Final Review" --body "Type: checkpoint"
```

---

## Phase 4: Review & Confirm

### 4.1. Summary
Sau khi tạo xong, trình bày:
```
📁 Created: docs/specs/[feature]/
├── requirements.md (X requirements, Y criteria)
├── design.md (Component hierarchy, Models, UI specs)
└── init_tasks.sh (Script to create Symphony tasks)

Ready for implementation with /auto-implement
```

### 4.2. Next Steps
- **Implement now:** `/auto-implement docs/specs/[feature]`
- **Review specs:** Người dùng đọc và chỉnh sửa nếu cần
- **Add more detail:** Bổ sung edge cases, security requirements

---

## Rules

1. **NO CODE** - Chỉ viết documentation
2. **COMPLETE** - Đủ 3 files, không thiếu
3. **TRACEABLE** - Mỗi task link về requirement
4. **ACTIONABLE** - Task đủ chi tiết để AI khác execute

---

**Success:** Bộ specs đầy đủ, sẵn sàng cho `/auto-implement`.