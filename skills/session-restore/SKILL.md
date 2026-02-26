---
name: awf-session-restore
description: Auto-restore context from Beads + Brain on session start
trigger: session_start
---

# AWF Session Restore (v5.0 - Beads + Brain)

> **Purpose:** Tự động khôi phục context khi user quay lại sau khi nghỉ.

---

## Trigger

Skill này tự động chạy khi:
- User mở session mới
- User gõ `/recap`
- AI detect context loss (conversation reset)

---

## Execution Flow

### 1. Multi-Source Context Check

**Priority 1: Beads (Task State)**
```bash
bd list --status in_progress
```

**Output:**
- Tasks đang làm dở
- Tasks blocked
- Tasks ready to start

**Priority 2: Brain (Knowledge & Plans)**
```bash
# Check active plans
cat brain/active_plans.json

# Check recent memories
ls -lt brain/ | head -5
```

**Output:**
- Plan đang active
- Phase hiện tại
- Recent decisions/knowledge

**Priority 3: Git (Code State)**
```bash
git status
git log -1
```

**Output:**
- Files đang thay đổi
- Commit gần nhất

---

### 2. Context Synthesis

Kết hợp 3 nguồn để tạo summary:

```markdown
🧠 **SESSION RESTORED**

📿 **Beads Context:**
- In Progress: Task #123 "Implement Login API" (started 2h ago)
- Blocked: Task #125 (waiting for #120)
- Ready: 3 tasks

🧠 **Brain Context:**
- Active Plan: plans/260130-1025-shopping-cart/
- Current Phase: Phase 02 - Backend (50% complete)
- Last Save: 30 minutes ago

📂 **Git Context:**
- Changed Files: 3 files (src/api/auth/*.ts)
- Last Commit: "feat: add user model" (1 hour ago)

➡️ **SUGGESTED NEXT STEP:**
Continue task #123? `/codeExpert` or `/code`
```

---

### 3. Smart Suggestions

Based on context, suggest appropriate action:

**Case 1: Task In-Progress**
```
➡️ Tiếp tục task #123? 
   `/codeExpert` (Fast) or `/code` (Guided)
```

**Case 2: Task Blocked**
```
⚠️ Task #125 bị block bởi #120

➡️ Làm task #120 trước?
   `/codeExpert` or switch to another task
```

**Case 3: No Active Task**
```
📋 Có 3 tasks ready to start

➡️ Bắt đầu task mới?
   `/next` để xem gợi ý
```

**Case 4: Fresh Start**
```
🆕 Chưa có context

➡️ Bắt đầu dự án mới?
   `/planExpert "Feature"` or `/brainstorm`
```

---

### 4. Memory Persistence

Update session state:

```json
// brain/session.json
{
  "last_session": "2026-01-30T10:00:00Z",
  "working_on": {
    "feature": "Shopping Cart",
    "plan_path": "plans/260130-1025-shopping-cart/",
    "current_phase": "phase-02",
    "current_task": {
      "id": 123,
      "name": "Implement Login API",
      "status": "in_progress"
    }
  },
  "context_sources": {
    "beads": true,
    "brain": true,
    "git": true
  }
}
```

---

## Error Handling

### Beads Unavailable
```
⚠️ Beads không khả dụng

Fallback: Dùng Brain + Git context
```

### Brain Empty
```
⚠️ Brain chưa có context

Gợi ý: `/plan` để tạo context mới
```

### All Sources Fail
```
❌ Không thể khôi phục context

➡️ Bắt đầu lại:
1. `/recap` để quét dự án
2. `/plan` để tạo plan mới
3. Kể cho em biết đang làm gì
```

---

## Integration with Workflows

### Auto-Trigger in Workflows

Các workflows tự động gọi session restore:

```markdown
# In /code workflow
1. Check session.json
2. If no context → Trigger awf-session-restore
3. Resume from restored context
```

### Manual Trigger

User có thể gọi thủ công:

```bash
/recap    # Alias for session restore
```

---

## Performance

- **Execution Time:** < 1 second
- **Sources Checked:** 3 (Beads, Brain, Git)
- **Output:** Concise summary (< 10 lines)

---

## Example Output

```
🧠 **WELCOME BACK!**

📿 **Beads:** Task #123 "Login API" (in_progress, 2h ago)
🧠 **Brain:** Plan "Shopping Cart" - Phase 02 (50%)
📂 **Git:** 3 files changed

➡️ **NEXT:** Continue coding? `/codeExpert`

💡 **TIP:** Gõ `/next` để xem chi tiết hơn
```

---

## Configuration

User có thể customize trong `brain/preferences.json`:

```json
{
  "session_restore": {
    "auto_trigger": true,
    "verbosity": "concise",  // concise | detailed
    "sources": ["beads", "brain", "git"]
  }
}
```
