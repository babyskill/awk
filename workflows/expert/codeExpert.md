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
/codeExpert                    # Code task tiếp theo (auto-detect từ Symphony)
```

---

## Execution Flow

### 1. Context Detection — `smart_pick()`

**Priority 1: Active Tasks (Symphony)**
```
# Read task mapping from brain
TASK_MAPPING = read brain/active_plans.json

# Check in-progress first
symphony_available_tasks(filter="my")
# If none → Get ready tasks
symphony_available_tasks(filter="ready")
# Auto-claim first ready task
symphony_claim_task(task_id)
```

**Priority 2: Argument**
- Nếu có `phase-XX` → Load phase file
- Nếu có task name → Search trong plan

**Priority 3: Fallback**
```
symphony_available_tasks(filter="ready")
```

### 2. Load Spec/Plan
- Đọc acceptance criteria từ Symphony task
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
- Nếu fail sau 3 lần → Tạo Symphony task "Fix test for [Feature]"

### 5. Update Symphony — `complete_task()`
```
# Complete task with summary
symphony_complete_task(task_id, summary="Completed", files_changed=[...])

# Report progress if partially done
symphony_report_progress(task_id, progress=100)
```

### 6. Report
```
✅ **CODE COMPLETE**

📝 **Task:** Implement Login API
📂 **Files:**
- src/api/auth/login.ts (created)
- src/api/auth/login.test.ts (created)

✅ **Tests:** 5/5 passed

🎵 **Symphony:** Task #123 → Done

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
3. Check Symphony: symphony_available_tasks()
```

### Test Fail (After 3 Retries)
```
⚠️ Auto-fix failed after 3 attempts

🎵 Created task: "Fix test for Login API"

Options:
1. Debug manually: /debugExpert
2. Skip tests: /codeExpert --skip-tests (Not recommended)
3. Continue next task: /codeExpert
```

---

## Integration

- **Symphony:** Auto-update task status via `symphony_complete_task()`
- **Brain:** Auto-save code patterns to knowledge base
- **Git:** Auto-stage changes (optional)
