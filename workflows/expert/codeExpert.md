---
description: 💻 Code ngay lập tức (Expert Mode)
---

# WORKFLOW: /codeExpert - Instant Coding

> **Expert Mode Only:** Code ngay dựa trên spec/plan, không hỏi gì cả.

---

## Usage

```bash
/codeExpert [target]
```

**Examples:**
```bash
/codeExpert phase-01           # Code toàn bộ phase 01
/codeExpert "Login API"        # Code task cụ thể
/codeExpert                    # Code task tiếp theo (auto-detect từ Beads)
```

---

## Execution Flow

### 1. Context Detection — `smart_pick()` (v6.5)

**Priority 1: Active Epic (Hierarchical)**
```bash
# Read epic from brain
EPIC_ID=$(cat brain/active_plans.json | jq -r '.current.epic_id // empty')

if [ -n "$EPIC_ID" ]; then
  # Check in-progress first
  bd list --status in_progress --parent $EPIC_ID --json
  # If none → Get ready (unblocked) tasks
  bd ready --parent $EPIC_ID --json --limit 5
  # Auto-claim first ready task
  bd update <id> --claim
fi
```

**Priority 2: Argument**
- Nếu có `phase-XX` → Load phase file
- Nếu có task name → Search trong plan

**Priority 3: Legacy Flat (no epic)**
```bash
bd list --status in_progress
bd ready --limit 5
```

### 2. Load Spec/Plan
- Đọc acceptance criteria từ task metadata (`bd show <id> --json`)
- Đọc spec từ `docs/specs/` hoặc phase file

### 3. Execute (Zero Questions)
- Viết code theo spec
- Tự động thêm:
  - Input validation
  - Error handling
  - Type safety
  - Comments (minimal, code tự giải thích)

### 4. Auto-Test
- Chạy test liên quan (nếu có)
- Fix lỗi tự động (max 3 lần)
- Nếu fail sau 3 lần → Tạo Beads task "Fix test for [Feature]"

### 5. Update Beads — `cascade_complete()` (v6.5)
```bash
# Close task with reason + suggest next
bd close <task-id> --reason "Completed" --suggest-next

# Auto-close parent phase/epic if all children done
bd epic close-eligible
```

### 6. Report
```
✅ **CODE COMPLETE**

📝 **Task:** Implement Login API
📂 **Files:**
- src/api/auth/login.ts (created)
- src/api/auth/login.test.ts (created)

✅ **Tests:** 5/5 passed

📿 **Beads:** Task #123 → Done

➡️ **Next:** /codeExpert (Auto-pick next task)
```

---

## Assumptions (Expert Mode)

AI sẽ tự động quyết định:
- ✅ File structure (theo project conventions)
- ✅ Naming conventions (camelCase/PascalCase based on language)
- ✅ Error handling strategy (try-catch + logging)
- ✅ Test coverage (critical paths only)

**Không hỏi về code quality level.** Mặc định: **PRODUCTION**.

---

## Error Handling

### No Context
```
❌ Error: No active task or plan found

Suggestions:
1. Create plan first: /planExpert "Feature"
2. Specify target: /codeExpert "Task Name"
3. Check Beads: bd list
```

### Test Fail (After 3 Retries)
```
⚠️ Auto-fix failed after 3 attempts

📿 Created task: #456 "Fix test for Login API"

Options:
1. Debug manually: /debugExpert
2. Skip tests: /codeExpert --skip-tests (Not recommended)
3. Continue next task: /codeExpert
```

---

## Integration

- **Beads:** Auto-update task status
- **Brain:** Auto-save code patterns to knowledge base
- **Git:** Auto-stage changes (optional)
