---
description: 📝 Thiết kế tính năng (Expert Mode - Zero Questions)
---

# WORKFLOW: /planExpert - Instant Plan Generation

> **Expert Mode Only:** Tạo plan ngay lập tức, không hỏi gì cả.

---

## Usage

```bash
/planExpert "Feature Name"
```

**Example:**
```bash
/planExpert "E-commerce Shopping Cart"
```

---

## Execution Flow

### 1. Parse Input
- Extract feature name from argument.
- If missing → Error: "Usage: /planExpert \"Feature Name\""

### 2. Auto-Generate Spec
- Tạo `docs/specs/[feature-slug]_spec.md` với:
  - Executive Summary
  - User Stories (3-5 stories cơ bản)
  - Database Design (ERD chuẩn)
  - API Contract (RESTful endpoints)
  - UI Components (danh sách components)

### 3. Auto-Generate Phases
- Tạo `plans/[YYMMDD]-[HHMM]-[feature-slug]/`
- Số phases tự động dựa trên complexity:
  - Simple: 4 phases (Setup → Backend → Frontend → Test)
  - Medium: 6 phases (+ Database + Integration)
  - Complex: 8+ phases (+ Auth + Deploy + Monitoring)

### 4. Sync to Beads
```bash
for each phase:
  bd create "Phase X: [Name]" --priority [0-2]
  
for each task in phase:
  bd create "[Task Name]" --parent [Phase ID]
```

### 5. Report
```
✅ **PLAN CREATED**

📁 Location: plans/260130-1025-shopping-cart/
📋 Spec: docs/specs/shopping-cart_spec.md

📊 **Structure:**
- 6 Phases
- 42 Tasks
- Estimated: 3-4 sessions

📿 **Beads:**
- Created 6 phase tasks
- Created 42 sub-tasks
- Ready to start: bd list

➡️ **Next:** /codeExpert phase-01
```

---

## Assumptions (Expert Mode)

AI sẽ tự động quyết định:
- ✅ Tech stack (dựa trên `.project-identity`)
- ✅ Database schema (chuẩn 3NF)
- ✅ API design (RESTful best practices)
- ✅ UI components (Material/Tailwind based on project)
- ✅ Test strategy (Unit + Integration)

**Không hỏi gì cả.** Nếu cần customize → Dùng `/plan` (Guided Mode).

---

## Error Handling

### Missing Feature Name
```
❌ Error: Feature name required
Usage: /planExpert "Feature Name"
```

### Duplicate Plan
```
⚠️ Warning: Plan for "Shopping Cart" already exists at plans/260128-1430-shopping-cart/

Options:
1. Overwrite? /planExpert "Shopping Cart" --force
2. Create new version? (Auto-append v2)
```

---

## Integration

- **Brain:** Auto-save to `brain/active_plans.json`
- **Beads:** Auto-create tasks with dependencies
- **Git:** Auto-commit plan files (optional)
