---
description: [Short description of the workflow]
---

# WORKFLOW: /[command] - Dual-Mode (v5.0)

> **Mode A (Expert):** `/[command] [args] [flags]` -> Execute immediately.
> **Mode B (Guided):** `/[command]` -> Interactive step-by-step wizard.

---

## 🅰️ Expert Mode (Direct Execution)

**Flags:**
- `--auto`: Auto-confirm all prompts.
- `--fast`: Skip detailed improvements/reviews.
- `--verbose`: Show detailed logs.

**Usage:**
```bash
/[command] "Title" --auto
```

**Logic:**
1. Parse arguments.
2. If critical info missing -> Error.
3. If valid -> Execute core logic silently.
4. Report final result.

---

## 🅱️ Guided Mode (Interactive Wizard)

### Phase 1: Context & Setup
1. **Understand Intent:**
   - "Bạn muốn làm gì với [Command]?"
   - (AI analyzes context from `.project-identity` & `.beads`)

2. **Configuration:**
   - [Question 1]
   - [Question 2]

3. **Menu:**
   ```markdown
   1️⃣ Tiếp tục (Start Phase 2)
   2️⃣ Thay đổi cấu hình
   3️⃣ Hủy bỏ
   ```

### Phase 2: Execution & Analysis
1. **Core Action:**
   - performing_step_1...
   - performing_step_2...

2. **Progress Update:**
   - "Đang thực hiện..."

3. **Menu:**
   ```markdown
   1️⃣ Xem kết quả chi tiết
   2️⃣ Tiếp tục sang Phase 3
   3️⃣ Retry (Thử lại)
   ```

### Phase 3: Completion & Handoff
1. **Final Report:**
   - Summary of changes.
   - Locations of artifacts.

2. **Memory Sync:**
   - Auto-sync with Beads (Task) & Brain (Knowledge).

3. **Next Steps Menu:**
   ```markdown
   1️⃣ ✅ Hoàn tất & Lưu (`/done`)
   2️⃣ 🚀 Tiếp tục task khác (`/next`)
   3️⃣ 🔄 Chạy lại (`/redo`)
   ```

---

## 🧠 Brain & Beads Integration

- **Input:** Check `bd list --status in_progress` to resume context.
- **Output:**
  - Create/Update Beads task.
  - Create Brain memory file if knowledge is valuable.
