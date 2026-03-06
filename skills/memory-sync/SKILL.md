---
name: memory-sync
description: >-
  Memory Sync — AI tự động đọc/ghi memory storage theo context mà không cần user nhớ.
  Write triggers: decisions, bug fixes, architecture, task completion, file edits.
  Read triggers: session start, debug, new task, errors, similar problems.
  NOTE: Skill này KHÔNG liên quan đến /brainstorm workflow. Chức năng: sync memory storage.
version: 2.2.0
trigger: always
priority: 3
formerly: ambient-brain
invocation-type: auto
---

# 💾 Memory Sync Skill

> **Philosophy:** User không nên nhớ để lưu. AI phải tự biết lúc nào cần đọc, lúc nào cần ghi vào memory storage.
> **Renamed from:** `ambient-brain` → `memory-sync` (v2.0.0) để tránh nhầm lẫn với `/brainstorm` workflow.
> **v2.2:** Self-Evolution Pattern — tự ghi learnings sau mỗi session.

---

## ⚠️ SCOPE CLARITY (Đọc trước)

Skill này CHỈ xử lý **memory storage sync** (đọc/ghi brain files).

| Skill này LÀM | Skill này KHÔNG làm |
|---------------|---------------------|
| Đọc/ghi `brain/decisions/` | Chạy brainstorm workflow |
| Đọc/ghi `brain/solutions/` | Tư vấn ý tưởng sản phẩm |
| Load session context | Research thị trường |
| Track decisions & bug fixes | Brainstorm tính năng với user |

→ Để brainstorm ý tưởng: dùng `/brainstorm` workflow hoặc `brainstorm-agent` skill.

---

## Core Principle: "Ambient Memory"

```
Traditional: User làm việc → nhớ → gõ /save-brain → AI lưu (FAIL khi quên)
Memory Sync: User làm việc → AI tự nhận ra ký ức quan trọng → Tự lưu & tự đọc
```

---

## 📖 MEMORY READ TRIGGERS (Khi nào tự động ĐỌC)

### R1: Session Start (LUÔN LUÔN)
**Điều kiện:** Đầu mỗi conversation mới
```
Action:
1. Đọc brain/session.json → Working context
2. Đọc brain/active_plans.json → Active plan
3. Đọc brain/decisions/ → 3 decisions gần nhất
4. Output: Hiển thị "🧠 Memory loaded: [summary]"
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
4. Trình bày solution từ memory trước khi debug mới
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
**Điều kiện:** Task/error giống với memory entries (keyword overlap > 2)
```
Action:
1. Tự động load solution từ memory
2. Hiển thị: "🔁 Pattern quen: Đã giải quyết tương tự lúc [date]"
3. Gợi ý dùng lại solution
```

---

## 💾 MEMORY WRITE TRIGGERS (Khi nào tự động GHI)

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
**Điều kiện:** Sau workflow /plan, /planExpert hoàn thành; HOẶC file spec/BRIEF.md được tạo
```
⚠️ KHÔNG trigger khi đang chạy /brainstorm (chỉ trigger KHI HOÀN THÀNH)
Detection: file docs/BRIEF.md tồn tại mới → W3 trigger

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
4. Notify: "💾 Đã lưu vào memory: [title]"
```

### W6: File Edit Tracking (MỚI)
**Điều kiện:** AI tạo/sửa file trong session
```
Patterns detect:
- AI creates new file
- AI edits existing file (multi_replace_file_content / write_to_file)
- File không có trong CODEBASE.md

Action (SILENT):
1. Ghi lại: filename, layer (nếu biết), feature_area, timestamp
2. Append to: brain/session.json → files_touched_this_session: []
3. Nếu file mới (chưa có trong CODEBASE.md):
   → Flag: needs_codebase_sync = true
   → Cuối session/task: gợi ý user chạy /codebase-sync

Template saved to session:
  {
    "file": "path/to/file",
    "action": "created|modified",
    "layer": "Presentation|Core|Features",
    "feature_area": "Authentication|Dashboard",
    "timestamp": "ISO date",
    "in_codebase_md": true|false
  }
```

---

## 🔄 MEMORY SYNC PROTOCOL

### Sync Frequency
```
IMMEDIATE (real-time):
- W1 Decision made → save trong 1 turn
- W2 Bug fixed → save ngay khi detect resolution

DEFERRED (end of workflow):
- W3 Architecture → save khi workflow hoàn thành (file BRIEF.md tạo xong)
- W4 Task completion → save khi task đóng

PERIODIC:
- Mỗi 10 turns → Check if anything worth saving missed
- End of session → Final consolidation save
```

### Memory File Structure
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

**Novelty Check:** Nếu memory đã có entry tương tự → Reinforce (tăng salience) thay vì tạo mới.

---

## 🔔 NOTIFICATION BEHAVIOR

```
QUIET MODE (default):
- Silent save: Không notify
- Chỉ show indicator nhỏ: "💾" ở cuối message khi có relevant memory read

VERBOSE MODE (khi user hỏi):
- Explain what was saved/loaded
- Show memory entry preview

NEVER:
- Hỏi "Bạn có muốn lưu không?" → Chỉ lưu im lặng
- Interrupt flow để confirm save
- Spam thông báo lưu
```

---

## 🧩 INTEGRATION WITH OTHER SKILLS

```
Runs BEFORE: awf-session-restore (cung cấp data)
Runs AFTER:  awf-auto-save (fallback nếu memory-sync bỏ sót)
Works WITH:  beads-manager (link memory entries với Bead IDs)
Works WITH:  orchestrator (nhận resolved_target → query focused hơn)
Enhances:    awf-error-translator (thêm historical context)
SEPARATE FROM: brainstorm-agent (hoàn toàn độc lập — brainstorm-agent xử lý ý tưởng)

# Khi orchestrator đã resolve target:
# memory-sync R2 chỉ query brain/ với resolved_target keywords
# thay vì query toàn bộ → nhanh hơn và chính xác hơn
```

---

## 📝 MEMORY QUERY ALGORITHM

Khi đọc memory, AI tự tìm kiếm theo priority:

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
AI internal: [MEMORY READ TRIGGER R3 detected]
AI scans: brain/solutions/ với "TypeError undefined"
AI finds: "2026-02-15-undefined-null-fix.md"
AI responds: "🔍 Nhớ ra: Lỗi này gặp lần trước do null check thiếu
             trong UserService. Fix: optional chaining + default value.
             Áp dụng vào đây..."
```

### Example 2: Auto-Write on Decision
```
User: "Ok, ta dùng better-sqlite3 cho neural brain"
AI internal: [MEMORY WRITE TRIGGER W1 detected]
AI saves silently: brain/decisions/2026-02-22-use-better-sqlite3.md
AI responds normally (không mention save)
```

### Example 3: Auto-Read on New Task
```
User: "Giờ làm phần activation.js"
AI internal: [MEMORY READ TRIGGER R2 detected - filename mention]
AI scans: brain/* với "activation"
AI finds: "arch-neural-brain-2026-02-22.md"
AI responds: "💡 Từ plan trước: activation.js dùng heap-based BFS với
             sigmoid decay. Bắt đầu với SpreadingActivation class..."
```

### Example 4: /brainstorm workflow — KHÔNG trigger W3 prematurely
```
User: "/brainstorm"
AI internal: [memory-sync SKIP — /brainstorm workflow đang chạy, chưa có BRIEF.md]
AI: [Chạy brainstorm workflow bình thường, hỏi ý tưởng user]
...
[Sau khi BRIEF.md được tạo]
AI internal: [MEMORY WRITE TRIGGER W3 detected — BRIEF.md exists]
AI saves silently: brain/decisions/arch-[feature]-[date].md
```

---

## Self-Evolution Protocol

After each session, if a memory trigger pattern was missed or a new write/read pattern was discovered:
1. Append finding to the Learnings section below
2. Update trigger patterns or salience scores if needed
3. Never remove existing learnings — only add or refine

## Learnings

_Findings from past sessions. Add new entries as bullet points._

- `invocation-type: auto` field added to frontmatter for CATALOG.md skill classification.
- W6 (File Edit Tracking) helps detect when CODEBASE.md needs sync — proactive rather than reactive.

---

*memory-sync v2.2.0 — Auto Memory Sync for AWF (Project-Aware, Self-Evolving)*
*Created by Kien AI*
