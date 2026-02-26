# Brain Router — Decision Logic

> AI sử dụng file này để quyết định: READ, WRITE, hoặc SKIP brain cho mỗi input.

---

## Routing Decision Tree

```
USER_INPUT received
       │
       ▼
[1. Session Start?] ──YES──▶ READ: session.json + active_plans + recent decisions
       │ NO
       ▼
[2. Error detected?] ──YES──▶ READ: brain/solutions/ (error pattern match)
       │ NO                   Then: proceed with debug, WRITE solution if fixed
       ▼
[3. Command: /plan, /code, /debug?] ──YES──▶ READ: feature-relevant entries
       │ NO
       ▼
[4. File/Feature/Task mentioned?] ──YES──▶ READ: tag match for that file/feature
       │ NO
       ▼
[5. Decision signal detected?] ──YES──▶ WRITE: brain/decisions/ (silent)
       │ NO
       ▼
[6. Resolution signal detected?] ──YES──▶ WRITE: brain/solutions/ (silent)
       │ NO
       ▼
[7. Workflow end?] ──YES──▶ WRITE: architecture/milestone summary (silent)
       │ NO
       ▼
[8. Every 10 turns?] ──YES──▶ CONSOLIDATE: check missed saves
       │ NO
       ▼
    SKIP (normal processing)
```

---

## Signal Detection Patterns

### 🔴 WRITE Signals

#### Decision Signals
```yaml
high_confidence:
  - "ta sẽ dùng {X}"
  - "quyết định dùng {X}"
  - "chọn {X} vì {reason}"
  - "best approach là {X}"
  - "we'll go with {X}"
  - "decided: {X}"

medium_confidence (chỉ save nếu AI vừa propose):
  - "ok", "được", "đồng ý"      # + context: AI vừa suggest architecture
  - "làm vậy đi", "Kien Ok"    # + context: AI vừa propose approach
  - "alright", "sounds good"    # + context: technical decision context

low_confidence (SKIP - too vague):
  - "ok" alone in casual chat
  - "được" in non-technical context
```

#### Resolution Signals
```yaml
high_confidence:
  - "works now", "fixed it", "chạy rồi"
  - "problem solved", "issue resolved"
  - "xong rồi", "ổn rồi", "ngon"
  - "tests pass", "build success"

medium_confidence:
  - "ok rồi" sau debug session
  - "done" sau coding task
  - emoji: ✅ sau error discussion

requires_context: True  # Chỉ save nếu đang trong debug/fix context
```

### 🔵 READ Signals

#### Auto-Read Triggers
```yaml
session_start:
  detect: First message of conversation
  load: session.json, active_plans.json, decisions (last 3)
  
error_context:
  detect: error pattern in message
  patterns:
    - "error:", "Error:", "failed", "exception"
    - "crash", "lỗi", "không chạy", "bug"
    - Stack trace format (indented lines with "at ")
  query: brain/solutions/ with error keywords
  
task_context:
  detect: Specific file/feature mentioned + action verb
  patterns:
    - "{verb} {filename}.{ext}"
    - "feature {name}", "implement {name}"
    - /code, /debug, /plan commands
  query: brain/* with filename or feature name as tags
  
architecture_question:
  detect: Design/approach question
  patterns:
    - "nên dùng gì", "best approach"
    - "how to design", "architecture for"
    - "which pattern", "chọn giữa"
  query: brain/decisions/ with topic keywords
```

---

## Context Accumulator

Brain Router maintains internal context per conversation:

```json
{
  "conversation_context": {
    "turn_count": 0,
    "current_feature": null,
    "current_files": [],
    "current_task_id": null,
    "recent_errors": [],
    "decisions_made": [],
    "solutions_found": [],
    "last_brain_read": null,
    "last_brain_write": null,
    "brain_entries_loaded": []
  }
}
```

**Updated each turn** to maintain routing accuracy with accumulated context.

---

## Anti-Patterns (When NOT to read/write)

```yaml
never_read:
  - Casual greeting ("xin chào", "hi", "how are you")
  - Pure question about general knowledge (not project-specific)
  - Already read brain this turn (deduplicate)

never_write:
  - Salience < 0.5 (see SKILL.md scoring)
  - Already have identical/similar entry (within 24h)
  - Casual conversation, non-technical decisions
  - User says "never mind", "bỏ qua", "thôi"

rate_limits:
  max_reads_per_turn: 1
  max_writes_per_turn: 2
  min_write_interval_seconds: 30  # Avoid duplicate rapid saves
```

---

## Output Format for Brain Reads

When brain read finds relevant content:

```
✅ Inline mention (default):
"💡 Nhớ ra: [1-2 sentence summary]. Áp dụng vào đây..."

✅ Decision reminder:
"📋 Đã quyết định [X] lúc [date]. Vẫn dùng?"

✅ Solution reference:
"🔍 Đã giải quyết lỗi tương tự: [root_cause + fix in 1 line]"

❌ Never dump full file content
❌ Never show raw markdown formatting
❌ Never mention "reading from brain" explicitly
```

---

*brain-router v1.0.0 — Routing logic for ambient-brain skill*
