---
name: memory-sync
description: >-
  Memory Sync — AI tự động đọc/ghi memory storage theo context mà không cần user nhớ.
  Write triggers: decisions, bug fixes, architecture, task completion, file edits.
  Read triggers: session start, debug, new task, errors, similar problems.
  NOTE: Skill này KHÔNG liên quan đến /brainstorm workflow. Chức năng: sync memory storage.
version: 2.3.0
trigger: always
priority: 3
formerly: ambient-brain
invocation-type: auto
---

# 💾 Memory Sync Skill — Router

> **Philosophy:** User không nên nhớ để lưu. AI tự biết lúc nào cần đọc, lúc nào cần ghi.

## ⚠️ SCOPE CLARITY

| Skill này LÀM | Skill này KHÔNG làm |
|---------------|---------------------|
| Đọc/ghi `brain/decisions/` & `brain/solutions/` | Chạy brainstorm workflow |
| Load session context | Tư vấn ý tưởng sản phẩm |
| Track decisions & bug fixes | Brainstorm tính năng với user |

→ Brainstorm: dùng `/brainstorm` hoặc `brainstorm-agent` skill.

## 📋 Topic Index

| Topic | Khi nào load | File |
|-------|-------------|------|
| Write Triggers W1-W7 (templates, patterns, examples) | Khi cần hiểu trigger details | `examples/write-triggers-and-examples.md` |

## 📖 MEMORY READ TRIGGERS (Khi nào tự động ĐỌC)

| ID | Trigger | Patterns | Action |
|----|---------|----------|--------|
| R1 | Session Start | Đầu mỗi conversation | Load session.json + active_plans + 3 decisions gần nhất |
| R2 | New Task | "làm feature X", /code, /debug | Query brain/ với task keywords |
| R3 | Error Detected | "error:", "crash", "lỗi", stack trace | Scan brain/solutions/ với error pattern |
| R4 | Architecture Question | "nên dùng gì", "architecture" | Query brain/decisions/ → "Quyết định cũ: ..." |
| R5 | Recurring Problem | Keyword overlap > 2 với memory | Load solution → "Pattern quen..." |

## 💾 MEMORY WRITE TRIGGERS (Khi nào tự động GHI)

| ID | Trigger | Mode | Target |
|----|---------|------|--------|
| W1 | Decision Made | SILENT | `brain/decisions/YYYY-MM-DD-[slug].md` |
| W2 | Bug Fixed | SILENT | `brain/solutions/[error-slug]-[date].md` |
| W3 | Architecture Defined | SILENT | `brain/decisions/arch-[feature]-[date].md` |
| W4 | Task Milestone | SILENT | `brain/session.json` → completed_milestones |
| W5 | /save-brain (manual) | CONFIRM | Rich metadata save |
| W6 | File Edit Tracking | SILENT | `brain/session.json` → files_touched |
| W7 | Brainstorm Artifact | SILENT | Symphony Notes API |

> Đầy đủ templates & detection patterns → `examples/write-triggers-and-examples.md`

## 🧭 SALIENCE SCORING

Chỉ lưu entries có salience ≥ 0.5:

| Type | Score | Action |
|------|-------|--------|
| Architectural decision | 0.95 | Always save |
| Bug fix solution | 0.85 | Always save |
| Tech choice | 0.80 | Always save |
| Pattern discovered | 0.75 | Save if novel |
| Task completion | 0.60 | Save key learnings |
| Code snippet | 0.50 | Save if reusable |
| Conversation detail | 0.20 | Skip |

**Novelty Check:** Nếu memory đã có entry tương tự → Reinforce thay vì tạo mới.

## 🔔 NOTIFICATION

- **QUIET** (default): Silent save, chỉ show "💾" indicator
- **VERBOSE**: Khi user hỏi → show memory entry preview
- **NEVER**: Hỏi "muốn lưu không?" / interrupt flow / spam

## 📁 Memory Structure

```
brain/
├── session.json              # Working state
├── active_plans.json         # Active plans
├── decisions/                # Tech decisions
└── solutions/                # Bug fixes & patterns
```

## 🧩 INTEGRATION

```
Runs BEFORE: awf-session-restore
Runs AFTER:  awf-auto-save (fallback)
Works WITH:  symphony-orchestrator (link với task IDs)
SEPARATE FROM: brainstorm-agent (hoàn toàn độc lập)
```

## Query Algorithm

```
Priority:
1. Exact tag match (filename, feature_name, error_type)
2. Keyword overlap ≥ 2
3. Same time period
4. Recent entries (< 7 ngày)
Return: Top 3 most relevant, inline mention
```

## Self-Evolution Protocol

After each session: append findings to Learnings section. Never remove — only add/refine.

## Learnings

- `invocation-type: auto` for CATALOG.md classification.
- W6 (File Edit Tracking) helps detect when CODEBASE.md needs sync.

---

*memory-sync v2.3.0 — Modular Router Architecture*
