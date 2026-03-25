---
name: orchestrator
description: Intelligent dispatcher — analyzes context and delegates to the right skill or workflow
---

# Orchestrator Skill

## Purpose
Route user requests to the correct workflow or skill based on context analysis.

## Routing Logic

### 1. Slash Command Detection
```
User input starts with `/` → Load workflow file directly
  /plan     → workflows/lifecycle/plan.md
  /code     → workflows/lifecycle/code.md
  /debug    → workflows/lifecycle/debug.md
  ...etc (see GEMINI.md § 2)
```

### 2. Intent Detection (No slash command)
```yaml
code_intent:
  keywords: ["implement", "build", "create", "add", "code", "fix", "viết", "tạo"]
  action: Suggest `/code` or `/codeExpert`

debug_intent:
  keywords: ["error", "bug", "crash", "fix", "lỗi", "sửa", "fail"]
  action: Suggest `/debug` or `/debugExpert`

plan_intent:
  keywords: ["plan", "design", "architect", "how to", "strategy", "thiết kế"]
  action: Suggest `/plan` or `/planExpert`

context_intent:
  keywords: ["remember", "save", "continue", "where was I", "nhớ", "tiếp"]
  action: Suggest `/recap` or `/save-brain`

ads_intent:
  keywords: ["ads", "campaign", "CPI", "ROAS", "quảng cáo"]
  action: Suggest `/ads-audit` or `/adsExpert`
```

### 3. Skill Pack Check
```
If user request involves iOS-specific → Check if mobile-ios pack enabled
If not enabled → Suggest: "awf enable-pack mobile-ios"
```

### 3.5. Gate 4 Three-Phase Routing (v12.3 — AUTO-ENFORCE)

> ⚠️ AI PHẢI CHỦ ĐỘNG kích hoạt — KHÔNG chờ user gọi.
> Khi detect COMPLEX + UI → TỰ ĐỘNG announce Phase Announcement Block.

```yaml
gate4_triage:
  trigger: After Gate 3 (tasks created), before execution begins
  auto_activate: true  # AI proactively triggers, no user command needed
  
  complex_with_ui:
    condition: complexity == COMPLEX AND task has UI components
    action: Enforce Three-Phase Execution
    phases:
      - Phase A: Infrastructure (dependencies, DI, navigation skeleton)
        → Must build successfully before Phase B
      - Phase B: UI Shell (all screens with mock data)
        → TRIGGER TP1.7: User Test Checkpoint (MANDATORY)
        → User must confirm UI OK before Phase C
      - Phase C: Logic Integration (per feature)
        → TRIGGER TP1.7: after each feature (batch small ones)
    task_ordering: UI tasks MUST be grouped before logic tasks in Symphony
  
  moderate_with_ui:
    condition: complexity == MODERATE AND task has UI components
    action: Phase A+C merged, Phase B optional (recommend for hardware features)
  
  trivial_or_backend:
    condition: complexity == TRIVIAL OR no UI components
    action: Skip phases, code straight through (no checkpoints)
  
  detect_ui_components:
    signals:
      - Task mentions: screen, view, layout, UI, button, form, navigation
      - Files include: *.xml (Android), *.swift (iOS views), *.compose, *.tsx
      - Spec references: wireframe, mockup, design, screenshot
```

### 4. Fallback
```
No match → Ask clarifying question (max 2 times)
Still unclear → Suggest `/help`
```

## Auto-Activation
This skill is always active. It runs as the first layer before any other processing.
