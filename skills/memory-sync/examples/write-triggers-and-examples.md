# Memory Write Trigger Details & Templates

## W1: Decision Made (SILENT AUTO-SAVE)

**Patterns detect decision:**
- "quyết định dùng...", "ta sẽ dùng...", "chọn approach..."
- "best way is...", "we'll use...", "decided to..."
- User confirm sau khi AI suggest: "ok", "được", "đồng ý"

**Action (SILENT):**
1. Extract: what, why, alternatives_considered
2. Save to: `brain/decisions/YYYY-MM-DD-[slug].md`
3. Update: `brain/session.json` với decision reference

**File Template:**
```yaml
---
date: [ISO date]
topic: [decision topic]
decision: [what was decided]
rationale: [why this approach]
alternatives: [other options considered]
context: [feature/task this belongs to]
tags: [relevant tags]
---
```

---

## W2: Bug Fixed / Solution Found (SILENT)

**Patterns:** "works now", "fixed", "chạy rồi", "ok rồi", "xong"

**Action:** Capture error_pattern, root_cause, solution_steps, files_changed.
Save to `brain/solutions/[error-slug]-[date].md`

**File Template:**
```yaml
---
date: [ISO date]
error_pattern: [what the error looked like]
root_cause: [why it happened]
solution: [how it was fixed]
files: [which files were changed]
prevent: [how to avoid in future]
tags: [file, error_type, feature]
---
```

---

## W3: Architecture / Pattern Defined (SILENT)

**Trigger:** Khi /plan hoặc /planExpert hoàn thành, hoặc BRIEF.md được tạo.
⚠️ KHÔNG trigger khi đang chạy /brainstorm (chỉ khi HOÀN THÀNH).

Save to `brain/decisions/arch-[feature]-[date].md`

---

## W4: Task Milestone Completed (SILENT)

**Patterns:** "bd update ... --status done", "xong phase", "hoàn thành feature"

Append to `brain/session.json` → completed_milestones

---

## W5: Explicit Save Request

User gõ `/save-brain "title"` → Full save có confirm.

---

## W6: File Edit Tracking

Track tất cả files AI tạo/sửa trong session.

**Append to session:**
```json
{
  "file": "path/to/file",
  "action": "created|modified",
  "layer": "Presentation|Core|Features",
  "feature_area": "Authentication|Dashboard",
  "timestamp": "ISO date",
  "in_codebase_md": true|false
}
```

Nếu file mới không có trong CODEBASE.md → flag `needs_codebase_sync = true`

---

## W7: Brainstorm / Analysis Artifact Persist

**Trigger:** BRIEF.md hoặc analysis document tạo xong.

POST metadata vào Symphony Notes API:
```bash
curl -X POST http://localhost:3100/api/notes -H 'Content-Type: application/json' -d '{
  "projectId": "<project-id>",
  "type": "brainstorm",
  "title": "<artifact-title>",
  "content": "<summary-2-3-lines>",
  "filePath": "<path-to-file>",
  "conversationId": "<conversation-id>"
}'
```

⚠️ Nếu Symphony server offline → skip silently

---

## Activation Examples

### Example 1: Auto-Read on Error
```
User: "Crash với TypeError: Cannot read property of undefined"
AI: [R3 triggered] → scans brain/solutions/
AI: "🔍 Lỗi này gặp trước — fix: optional chaining + default value"
```

### Example 2: Auto-Write on Decision
```
User: "Ok, ta dùng better-sqlite3"
AI: [W1 triggered] → saves silently
```

### Example 3: Auto-Read on New Task
```
User: "Giờ làm phần activation.js"
AI: [R2 triggered] → "💡 Plan trước: activation.js dùng heap-based BFS"
```
