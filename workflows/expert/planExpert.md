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

### 4. Sync to Symphony
```
# Step 1: Create root task (1 per plan)
symphony_create_task(title="<Feature Name>", priority=1, description="<feature summary>")

# Step 2: Create phase tasks
for each phase:
  symphony_create_task(title="Phase X: [Name]", description="<phase summary>")

# Step 3: Create subtasks for each phase
for each task in phase:
  symphony_create_task(title="[Task Name]", acceptance="<definition of done>")

# Step 4: Save to brain/active_plans.json
```

### 5. Report
```
✅ **PLAN CREATED**

📁 Location: plans/260130-1025-shopping-cart/
📋 Spec: docs/specs/shopping-cart_spec.md

📊 **Structure:**
- 🏔️ 1 Root Task
- 📦 6 Phases (sequential)
- 📝 42 Subtasks (with acceptance criteria)
- Estimated: 3-4 sessions

🎵 **Symphony:**
- Tasks: symphony_available_tasks()
- Status: symphony_status()

➡️ **Next:** /codeExpert (auto-picks first ready subtask)
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

- **Brain:** Auto-save task mapping to `brain/active_plans.json`
- **Symphony:** Auto-create task hierarchy via `symphony_create_task()`
- **Skill:** Uses `symphony-orchestrator` skill
- **Git:** Auto-commit plan files (optional)
