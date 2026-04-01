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

### 4. Fallback
```
No match → Ask clarifying question (max 2 times)
Still unclear → Suggest `/help`
```

## Auto-Activation
This skill is always active. It runs as the first layer before any other processing.
