---
name: orchestrator
description: >-
  Intelligent dispatcher — analyzes context, injects project brain, then
  delegates to the right skill or workflow. Always runs first.
version: 2.0.0
trigger: always
priority: 1
---

# Orchestrator Skill v2.0 — Project-Aware

> **Role:** First-layer processor. Chạy trước MỌI skill khác.
> **New in v2.0:** Project Brain Lookup — inject project context trước khi route.

---

## Execution Order (MANDATORY)

```
Step 1: Project Brain Lookup    ← MỚI — chạy đầu tiên
Step 2: Intent Detection
Step 3: Route to skill/workflow
```

---

## Step 1: Project Brain Lookup (LUÔN CHẠY)

Trước khi làm bất cứ điều gì, orchestrator phải load project context:

### 1.1 — Đọc `.project-identity`

```yaml
check: Có file .project-identity trong project dir không?

IF EXISTS:
  read: .project-identity
  extract:
    - projectName
    - stage (stage3_development, etc.)
    - architecture (clean_architecture, mvvm)
    - tech stack (swift, react, node, etc.)
    - currentWork / nextMilestones

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
    - data_flow_diagrams

SET: codebase_map = { layers, features, conventions }

RULES:
  → KHÔNG scan raw directory nếu CODEBASE.md tồn tại
  → KHÔNG hỏi user về file location — tự suy luận từ codebase_map
```

### 1.3 — Resolve Target từ Request

```yaml
# Khi user đề cập feature/bug/area:
resolve_target(user_request, codebase_map):
  keywords = extract_keywords(user_request)
  
  # Match theo thứ tự ưu tiên:
  1. Layer match: "crash khi login" → AuthenticationViewModel, AuthUseCases
  2. Feature match: "water tracking" → Features/Water/
  3. Service match: "camera chậm" → CameraViewModel + Core/Services/
  4. Fallback: "không rõ" → list top 3 candidates từ CODEBASE.md
```

### 1.4 — Brief Confirm Output (LUÔN HIỂN THỊ)

```
Format:
  "📚 [ProjectName] | [Stage] | [Architecture]
   🗺️  Targeting: [resolved file/layer]"

Example:
  "📚 FitBite Witness | Stage 3 Development | Clean Architecture + MVVM
   🗺️  Targeting: AuthenticationViewModel → SignInUseCase"

Nếu CODEBASE.md không có:
  "📚 [ProjectName] — CODEBASE.md chưa có, đang scan cấu trúc..."

Nếu file được nhắc đến KHÔNG có trong CODEBASE.md:
  → Thực hiện xong, thêm footer: "⚠️ CODEBASE.md có thể outdated — dùng /codebase-sync"
```

---

## Step 2: Intent Detection

Sau khi có project context, detect intent từ request:

```yaml
debug_intent:
  keywords: ["error", "bug", "crash", "fix", "lỗi", "sửa", "fail", "không chạy"]
  + image: [screenshot of error/crash]
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

### Without Project Context

```
→ Route bình thường theo intent
→ Suggest workflow phù hợp
→ Có thể hỏi clarifying question (max 2 lần)
```

### Slash Command Detection

```yaml
# User gõ /command → Load workflow file trực tiếp
/plan        → global_workflows/plan.md
/planExpert  → global_workflows/planExpert.md
/code        → global_workflows/code.md
/codeExpert  → global_workflows/codeExpert.md
/debug       → global_workflows/debug.md
/debugExpert → global_workflows/debugExpert.md
/codebase-sync → global_workflows/codebase-sync.md  # MỚI
# ...etc (see GEMINI.md)
```

### Fallback

```
No intent match → Ask clarifying question (max 2 lần)
Still unclear   → Suggest /help
```

---

## Integration

```yaml
runs_before: awf-session-restore, memory-sync, all workflows
provides_to: [project_context, resolved_target, intent]
receives_from: user_request, active_document

# Khi có CODEBASE.md → memory-sync R2 chỉ cần query với resolved_target
# thay vì query toàn bộ brain/
```

---

*orchestrator v2.0 — Project-Aware Dispatcher*
*Created by Kien AI*
