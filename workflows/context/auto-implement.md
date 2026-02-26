---
description: 🤖 Tự động thực thi code từ Spec
---

# /auto-implement - Spec Executor

> **Role:** Antigravity Builder - Đọc specs, code tự động.
> **Input:** `docs/specs/[feature]/` (đã tạo bởi /design-feature)
> **Output:** Production-ready code

---

## Phase 0: Load Specs

### 0.1. Verify Specs Exist
// turbo
```bash
FEATURE=$1  # Pass feature name as argument
[ -d "docs/specs/$FEATURE" ] && echo "✅ Specs found" || echo "❌ No specs"
```

### 0.2. Load All Spec Files
Đọc và parse:
1. `requirements.md` → Hiểu WHAT & WHY
2. `design.md` → Hiểu HOW (architecture, models, UI)
3. `bd list` → Hiểu execution plan (list tasks in JSON format for parsing)

### 0.3. Parse Tasks
Retrieve tasks using `bd list --json`:
- Extract task ID
- Extract description and body
- Extract requirements from body tags

---

## Phase 1: Execution Loop

### 1.1. For Each Uncompleted Task

```
FOR each task WHERE status = "[ ]":
  1. READ task description
  2. READ related design.md section
  3. READ related requirements
  4. GENERATE code
  5. WRITE to specified file
  6. VERIFY (syntax check)
  7. MARK task as complete: `bd close [id]`
  8. REPORT progress
END FOR
```

### 1.2. Execution Rules

**Sequential:** Thực hiện theo thứ tự A → B → C → D → E

**Context Awareness:**
- Đọc existing code trước khi modify
- Không duplicate logic đã có
- Reuse existing components/utils

**Quality Gates:**
- Mỗi task phải pass syntax check
- Nếu fail → stop và report, không continue

---

## Phase 2: Code Generation

### 2.1. Per Task Type

**type: logic** (Models, ViewModels, Services)
```swift
// Auto-generate based on design.md Data Models section
// Include: Codable, Identifiable, validation
// Follow: Clean Architecture patterns
```

**type: ui** (Views, Components)
```swift
// Auto-generate based on Component Hierarchy
// Apply: Design tokens from design.md
// Include: Accessibility labels, animations
```

**type: i18n** (Localization)
```swift
// Scan all created files
// Extract hardcoded strings
// Replace with Localized("key")
```

**type: test** (Unit Tests)
```swift
// Generate tests for ViewModels, Repositories
// Cover: Happy path, error cases
// Target: 80%+ coverage
```

### 2.2. Code Standards

Mọi code phải tuân thủ:
- [ ] No hardcoded strings (use localization)
- [ ] Error handling với do-catch
- [ ] Logging quan trọng actions
- [ ] Input validation
- [ ] Accessibility labels

---

## Phase 3: Progress Tracking

### 3.1. Update Status
Sau mỗi task hoàn thành:
```bash
bd close [id]
```

### 3.2. Progress Report
```
📊 Implementation Progress: [feature]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase A: ██████████ 100% (2/2 tasks)
Phase B: ██████░░░░  60% (3/5 tasks)
Phase C: ░░░░░░░░░░   0% (0/2 tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: 45% complete

✅ Completed: A1, A2, B1, B2, B3
🔄 Current: B4 - Create Item Detail
⏳ Pending: B5, C1, C2, D1, D2, E1, E2
```

---

## Phase 4: Completion

### 4.1. Final Checklist
Khi tất cả tasks `[x]`:
- [ ] All requirements validated
- [ ] Build passes without errors
- [ ] No hardcoded strings
- [ ] Accessibility implemented
- [ ] Tests written and passing

### 4.2. Handover
```
✅ Feature [name] Implementation Complete!

📁 Files Created/Modified:
- Domain/Models/[Feature].swift
- Data/Repositories/[Feature]Repository.swift
- Presentation/[Feature]/[Feature]View.swift
- Presentation/[Feature]/[Feature]ViewModel.swift

📋 Requirements Validated:
- RQ-01 ✅
- RQ-02 ✅

🧪 Tests: 5 passed, 0 failed

Next Steps:
- /run to test on device
- /code-review before merge
```

---

## Error Handling

### Task Fails
```
❌ Task B2 Failed: [error message]

Context:
- File: Presentation/[Feature]/Components/ItemCard.swift
- Line: 45
- Error: Type 'ItemModel' has no member 'subtitle'

Suggested Fix:
- Check design.md for correct property names
- Update ItemModel or fix reference

Options:
1. [Fix and retry] - Auto-attempt fix
2. [Skip] - Continue to next task
3. [Stop] - Pause for manual intervention
```

### Recovery
- Tự động thử sửa lỗi đơn giản (missing import, typo)
- Nếu không sửa được → Stop và báo cáo chi tiết

---

## Usage

```bash
# Execute all pending tasks
/auto-implement user-profile

# Execute specific phase only
/auto-implement user-profile --phase=B

# Dry run (show what would be done)
/auto-implement user-profile --dry-run
```

---

**Success:** Code hoàn chỉnh, validated, ready for testing.
