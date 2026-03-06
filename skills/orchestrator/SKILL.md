---
name: orchestrator
description: >-
  Intelligent dispatcher — analyzes context, injects project brain, then
  delegates to the right skill or workflow. Always runs first.
invocation-type: auto
version: 2.1.0
trigger: always
priority: 1
---

# Orchestrator Skill v2.1 — Project-Aware + Self-Evolving

> **Role:** First-layer processor. Chạy trước MỌI skill khác.
> **v2.0:** Project Brain Lookup — inject project context trước khi route.
> **v2.1:** Self-Evolution Pattern — tự ghi learnings sau mỗi session.

---

## Execution Order (MANDATORY)

```
Step 1: Project Brain Lookup    ← chạy đầu tiên
Step 2: Intent Detection
Step 3: Route to skill/workflow
Step 4: Self-Evolution          ← ghi learnings nếu có
```

---

## Step 1: Project Brain Lookup (LUÔN CHẠY)

### 1.1 — Đọc `.project-identity`

```yaml
check: Có file .project-identity trong project dir không?

IF EXISTS:
  read: .project-identity
  extract:
    - projectName
    - stage
    - architecture (clean_architecture, mvvm)
    - tech stack (swift, react, node, etc.)

SET: project_context = { name, stage, arch, stack }
```

### 1.2 — Đọc `CODEBASE.md`

```yaml
check: Có file CODEBASE.md trong project dir không?

IF EXISTS:
  read: CODEBASE.md
  extract:
    - layer_map: { layer_name → files[] }
    - feature_areas: { feature → directory }
    - naming_conventions

RULES:
  → KHÔNG scan raw directory nếu CODEBASE.md tồn tại
  → KHÔNG hỏi user về file location — tự suy luận từ codebase_map
```

### 1.3 — Resolve Target từ Request

```yaml
resolve_target(user_request, codebase_map):
  1. Layer match: "crash khi login" → AuthenticationViewModel
  2. Feature match: "water tracking" → Features/Water/
  3. Service match: "camera chậm" → CameraViewModel
  4. Fallback: list top 3 candidates từ CODEBASE.md
```

### 1.4 — Brief Confirm Output (LUÔN HIỂN THỊ)

```
Format:
  "📚 [ProjectName] | [Stage] | [Architecture]
   🗺️  Targeting: [resolved file/layer]"

Nếu file được nhắc KHÔNG có trong CODEBASE.md:
  → Footer: "⚠️ CODEBASE.md có thể outdated — dùng /codebase-sync"
```

---

## Step 2: Intent Detection

```yaml
debug_intent:
  keywords: ["error", "bug", "crash", "fix", "lỗi", "sửa", "fail", "không chạy"]
  action: Execute debug flow với target đã resolve từ Step 1

code_intent:
  keywords: ["implement", "build", "create", "add", "code", "viết", "tạo", "thêm"]
  action: Execute code flow tại target layer/file đã biết

plan_intent:
  keywords: ["plan", "design", "architect", "how to", "strategy", "thiết kế"]
  action: Route to /plan với project context injected

context_intent:
  keywords: ["remember", "save", "continue", "where was I", "nhớ", "tiếp", "recap"]
  action: Route to /recap hoặc /save-brain

ads_intent:
  keywords: ["ads", "campaign", "CPI", "ROAS", "quảng cáo"]
  action: Route to /ads-audit hoặc /adsExpert

image_intent:
  trigger: User gửi ảnh chụp màn hình
  + debug keywords: Route to visual-debug với CODEBASE context
  + design keywords: Route to design-to-ui
  + error screenshot: Route to debug flow
```

---

## Step 3: Routing

### With Project Context (khi đã có CODEBASE.md)

```
→ Không suggest workflow, THỰC HIỆN LUÔN
→ Đi thẳng đến file/layer đã resolve
→ Không hỏi "file này ở đâu?" — đã biết từ CODEBASE.md
```

### Slash Command Detection

```yaml
/plan        → workflows/lifecycle/plan.md
/planExpert  → workflows/lifecycle/planExpert.md
/code        → workflows/lifecycle/code.md
/codeExpert  → workflows/lifecycle/codeExpert.md
/debug       → workflows/lifecycle/debug.md
/debugExpert → workflows/lifecycle/debugExpert.md
/codebase-sync → workflows/context/codebase-sync.md
# ...etc (see GEMINI.md)
```

### Fallback

```
No intent match → Ask clarifying question (max 2 lần)
Still unclear   → Suggest /help
```

---

## Step 4: Self-Evolution Protocol

After each session, if a routing decision was suboptimal or a new intent was discovered:

1. **Record** the finding in the Learnings section below
2. **Update** routing rules in Step 2 if a new keyword pattern should be added
3. **Cross-check** skill catalog (`skills/CATALOG.md`) to ensure new skills are routable

> This ensures the orchestrator improves its routing accuracy over time.

## Learnings

_Findings from past sessions are recorded here. Add new entries as bullet points._

- v2.0: Added project brain lookup — significantly reduces unnecessary questions about file locations.
- v2.1: Added self-evolution pattern — skill now self-improves by recording routing insights.
- `invocation-type` field added to help distinguish auto vs manual skills in routing decisions.

---

## Integration

```yaml
runs_before: awf-session-restore, memory-sync, all workflows
provides_to: [project_context, resolved_target, intent]
receives_from: user_request, active_document
```

---

*orchestrator v2.1 — Project-Aware + Self-Evolving Dispatcher*
*Created by Kien AI*
