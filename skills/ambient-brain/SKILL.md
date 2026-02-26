---
name: ambient-brain
description: >-
  Ambient Brain Sync — AI tự động đọc/ghi brain theo context mà không cần user nhớ.
  Write triggers: decisions, bug fixes, architecture, task completion.
  Read triggers: session start, debug, new task, errors, similar problems.
version: 1.0.0
trigger: always
priority: high
---

# 🧠 Ambient Brain Sync

> **Philosophy:** User không nên nhớ để lưu. AI phải tự biết lúc nào cần đọc, lúc nào cần ghi.

---

## Core Principle: "Ambient Memory"

```
Traditional: User làm việc → nhớ → gõ /save-brain → AI lưu (FAIL khi quên)
Ambient:     User làm việc → AI tự nhận ra ký ức quan trọng → Tự lưu & tự đọc
```

---

## 📖 BRAIN READ TRIGGERS (Khi nào tự động ĐỌC)

### R1: Session Start (LUÔN LUÔN)
**Điều kiện:** Đầu mỗi conversation mới
```
Action:
1. Đọc brain/session.json → Working context
2. Đọc brain/active_plans.json → Active plan
3. Đọc brain/decisions/ → 3 decisions gần nhất
4. Output: Hiển thị "🧠 Brain loaded: [summary]"
```

### R2: New Task / Feature Work
**Điều kiện:** User mention file/feature/task cụ thể, hoặc dùng /code, /debug, /plan
```
Patterns:
- "làm feature X", "sửa file Y", "implement Z"
- /code, /codeExpert, /debug, /debugExpert, /plan, /planExpert

Action:
1. Query brain/decisions/ với keywords từ task
2. Query brain/solutions/ với filename/feature name
3. Nếu tìm thấy liên quan: "💡 Nhớ ra: [relevant context]"
4. Inject vào working context
```

### R3: Error / Bug Encounter
**Điều kiện:** Error message xuất hiện trong conversation
```
Patterns (detect any of):
- "error:", "Error:", "ERROR", "failed:", "exception"  
- "không chạy", "lỗi", "crash", "bug"
- Terminal output có stack trace

Action:
1. Extract error type/keywords
2. Query brain/solutions/ với error pattern
3. Nếu tìm thấy: "🔍 Đã gặp lỗi này trước: [solution summary]"
4. Trình bày solution từ brain trước khi debug mới
```

### R4: Architectural Decision Needed
**Điều kiện:** User hỏi về design, approach, architecture
```
Patterns:
- "nên dùng gì", "best approach", "how to design"
- "chọn giữa X và Y", "architecture", "pattern"

Action:
1. Query brain/decisions/ với topic
2. Nếu tìm thấy: "📋 Quyết định cũ: [relevant decision]"
3. Hỏi: "Vẫn dùng approach này hay muốn thay đổi?"
```

### R5: Recurring Similar Problem
**Điều kiện:** Task/error giống với brain entries (keyword overlap > 2)
```
Action:
1. Tự động load solution từ brain
2. Hiển thị: "🔁 Pattern quen: Đã giải quyết tương tự lúc [date]"
3. Gợi ý dùng lại solution
```

---

## 💾 BRAIN WRITE TRIGGERS (Khi nào tự động GHI)

### W1: Decision Made (SILENT AUTO-SAVE)
**Điều kiện:** AI hoặc user đưa ra quyết định kỹ thuật
```
Patterns detect decision:
- "quyết định dùng...", "ta sẽ dùng...", "chọn approach..."
- "best way is...", "we'll use...", "decided to..."
- User confirm sau khi AI suggest: "ok", "được", "đồng ý", "làm vậy đi"
  (nhưng chỉ sau khi AI vừa đề xuất architecture/approach)

Action (SILENT - không hỏi user):
1. Extract: what, why, alternatives_considered
2. Save to: brain/decisions/YYYY-MM-DD-[slug].md
3. Update: brain/session.json với decision reference
4. Log internally (không notify user trừ khi được hỏi)

Template:
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

### W2: Bug Fixed / Solution Found
**Điều kiện:** Sau khi fix xong bug được confirm
```
Patterns detect resolution:
- "works now", "fixed", "chạy rồi", "ok rồi", "xong"
- User sau khi test: "ổn rồi", "pass", "ngon"
- "solved by", "the fix was"

Action (SILENT):
1. Capture: error_pattern, root_cause, solution_steps, files_changed
2. Save to: brain/solutions/[error-slug]-[date].md
3. Tag với: filename, error_type, feature

Template:
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

### W3: Architecture / Pattern Defined  
**Điều kiện:** Sau workflow /plan, /planExpert, /brainstorm hoàn thành; hoặc spec file được tạo
```
Action (SILENT):
1. Capture: feature_name, tech_choices, structure, reasoning
2. Save to: brain/decisions/arch-[feature]-[date].md
3. Link to Bead task ID nếu có
```

### W4: Task Milestone Completed
**Điều kiện:** `bd update --status done` hoặc user tuyên bố xong 1 giai đoạn lớn
```
Patterns:
- "bd update ... --status done"
- "xong phase", "hoàn thành feature", "done với X"

Action (SILENT):
1. Capture: task_name, what_was_built, key_learnings
2. Append to: brain/session.json → completed_milestones
3. Nếu có learnings quan trọng → Save to brain/solutions/
```

### W5: Explicit Save Request
**Điều kiện:** User gõ /save-brain "title" (vẫn support manual)
```
Action (FULL SAVE - có confirm):
1. Synthesize toàn bộ conversation context
2. User confirm nội dung trước khi lưu
3. Save với rich metadata
4. Notify: "💾 Đã lưu vào brain: [title]"
```

---

## 🔄 BRAIN SYNC PROTOCOL

### Sync Frequency
```
IMMEDIATE (real-time):
- W1 Decision made → save trong 1 turn
- W2 Bug fixed → save ngay khi detect resolution

DEFERRED (end of workflow):
- W3 Architecture → save khi workflow hoàn thành  
- W4 Task completion → save khi task đóng

PERIODIC:
- Mỗi 10 turns → Check if anything worth saving missed
- End of session → Final consolidation save
```

### File Structure
```
brain/
├── session.json              # Current working state (auto-updated)
├── active_plans.json         # Plans đang active (auto-updated)  
├── decisions/
│   ├── 2026-02-22-use-sqlite.md
│   ├── 2026-02-22-arch-neural-brain.md
│   └── ...
└── solutions/
    ├── 2026-02-22-fts5-error-fix.md
    ├── 2026-02-22-activation-algorithm.md
    └── ...
```

---

## 🧭 SALIENCE SCORING (Độ quan trọng)

AI tự đánh giá trước khi lưu — chỉ lưu những gì có salience ≥ 0.5:

```
salience_map:
  architectural_decision:  0.95  # Always save
  bug_fix_solution:        0.85  # Always save  
  tech_choice:             0.80  # Always save
  pattern_discovered:      0.75  # Save if novel
  task_completion:         0.60  # Save key learnings
  code_snippet:            0.50  # Save if reusable
  conversation_detail:     0.20  # Skip
  casual_chat:             0.05  # Never save
```

**Novelty Check:** Nếu brain đã có entry tương tự → Reinforce (tăng salience) thay vì tạo mới.

---

## 🔔 NOTIFICATION BEHAVIOR

```
QUIET MODE (default):
- Silent save: Không notify
- Chỉ show indicator nhỏ: "💾" ở cuối message khi có relevant brain read

VERBOSE MODE (khi user hỏi):  
- Explain what was saved/loaded
- Show brain entry preview

NEVER:
- Hỏi "Bạn có muốn lưu không?" → Chỉ lưu im lặng
- Interrupt flow để confirm save
- Spam thông báo lưu
```

---

## 🧩 INTEGRATION WITH EXISTING SKILLS

```
Runs BEFORE: session-restore (cung cấp data)
Runs AFTER:  auto-save (fallback nếu ambient bỏ sót)
Works WITH:  beads-manager (link brain entries với Bead IDs)
Enhances:    error-translator (thêm historical context)
```

---

## 📝 BRAIN QUERY ALGORITHM

Khi đọc brain, AI tự tìm kiếm theo priority:

```
1. Exact tag match (filename, feature_name, error_type)
2. Keyword overlap trong content (>= 2 keywords)  
3. Same time period (cùng feature đang làm)
4. Recent entries (< 7 ngày)

Return: Top 3 most relevant entries
Format: Inline mention, không dump toàn bộ content
```

---

## ⚡ ACTIVATION EXAMPLES

### Example 1: Auto-Read on Error
```
User: "Ứng dụng bị crash với lỗi 'TypeError: Cannot read property of undefined'"
AI internal: [BRAIN READ TRIGGER R3 detected]
AI scans: brain/solutions/ với "TypeError undefined"  
AI finds: "2026-02-15-undefined-null-fix.md"
AI responds: "🔍 Nhớ ra: Lỗi này gặp lần trước do null check thiếu 
             trong UserService. Fix: optional chaining + default value.
             Áp dụng vào đây..."
```

### Example 2: Auto-Write on Decision
```
User: "Ok, ta dùng better-sqlite3 cho neural brain"
AI internal: [BRAIN WRITE TRIGGER W1 detected]
AI saves silently: brain/decisions/2026-02-22-use-better-sqlite3.md
AI responds normally (không mention save)
```

### Example 3: Auto-Read on New Task
```
User: "Giờ làm phần activation.js"  
AI internal: [BRAIN READ TRIGGER R2 detected - filename mention]
AI scans: brain/* với "activation"
AI finds: "arch-neural-brain-2026-02-22.md" 
AI responds: "💡 Từ plan trước: activation.js dùng heap-based BFS với 
             sigmoid decay. Bắt đầu với SpreadingActivation class..."
```

---

*ambient-brain v1.0.0 — Auto Memory Sync for AWF*
*Created by Kien AI*
