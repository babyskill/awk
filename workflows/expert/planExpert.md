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

### 4. Sync to Beads (Hierarchical — v6.5)
```bash
# Step 1: Create epic (1 per plan)
EPIC_ID=$(bd create "<Feature Name>" -t epic -p 1 \
  --description "<feature summary>" \
  --acceptance "<high-level acceptance>" \
  --design "<architecture approach>" \
  --json | jq -r '.id')

# Step 2: Create phase tasks as children of epic
for each phase:
  PHASE_ID=$(bd create "Phase X: [Name]" \
    --parent $EPIC_ID -p 1 \
    --description "<phase summary>" \
    --json | jq -r '.id')

  # Step 3: Create subtasks as children of phase
  for each task in phase:
    bd create "[Task Name]" \
      --parent $PHASE_ID -p 2 \
      --acceptance "<definition of done>" \
      --json

# Step 4: Set inter-phase dependencies
bd dep add $PHASE2_ID $PHASE1_ID  # Sequential phases

# Step 5: Save to brain/active_plans.json
# → { "current": { "epic_id": $EPIC_ID, "feature": "...", "phases": [...] } }
```

### 5. Report
```
✅ **PLAN CREATED**

📁 Location: plans/260130-1025-shopping-cart/
📋 Spec: docs/specs/shopping-cart_spec.md

📊 **Structure:**
- 🏔️ 1 Epic
- 📦 6 Phases (sequential dependencies)
- 📝 42 Subtasks (with acceptance criteria)
- Estimated: 3-4 sessions

📿 **Beads (Hierarchical):**
- Epic: bd-xxxx
- Tree: bd list --parent bd-xxxx --tree
- Ready: bd ready --parent bd-xxxx

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

- **Brain:** Auto-save epic mapping to `brain/active_plans.json` (with epic_id + phase IDs)
- **Beads:** Auto-create epic → phase → subtask hierarchy with dependencies
- **Skill:** Uses `plan_to_beads()` from `beads-manager` skill v6.5
- **Git:** Auto-commit plan files (optional)
