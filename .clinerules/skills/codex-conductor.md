---
name: codex-conductor
description: >-
  Three-Agent Flow — Antigravity proactively invokes Codex CLI (headless)
  for debugging, code review, logic verification, and plan auditing.
  Codex is READ-ONLY: it inspects and reports to .md files, never edits code.
metadata:
  stage: core
  version: "1.0"
  requires: codex (npm i -g @openai/codex)
  tags: [conductor, codex, debug, review, logic, verification, delegation]
agent: Inspector
trigger: conditional
invocation-type: auto
priority: 5
---

# 🔍 Codex Conductor Skill

> **Purpose:** Antigravity gọi Codex CLI qua terminal khi cần rà soát logic, debug, hoặc review code chuyên sâu.
> **Key Benefit:** Codex cực mạnh rule compliance + logic analysis. Output = báo cáo `.md`, KHÔNG sửa code.

---

## ⚠️ Core Principle

```
Antigravity (IDE) = Executor — code, implement, create
Gemini CLI        = Strategist — analysis, architecture, planning
Codex CLI         = Inspector — debug, review, verify, test

   ┌──────────────────────────────────────────────┐
   │  Codex CHỈ RÀ SOÁT + TẠO BÁO CÁO (.md)     │
   │  TUYỆT ĐỐI KHÔNG ĐƯỢC SỬA CODE              │
   └──────────────────────────────────────────────┘
```

---

## 🔧 Prerequisites

Trước khi gọi Codex CLI, kiểm tra:

```bash
# Check if codex is installed
which codex || command -v codex
```

```yaml
if_not_installed:
  option_1: "npm i -g @openai/codex"
  option_2: Ask user to install manually
  message: "⚠️ Codex CLI chưa cài. Chạy: npm i -g @openai/codex"
```

---

## 🎯 Trigger Conditions

Kích hoạt khi Antigravity nhận diện task cần thế mạnh Codex:

```yaml
auto_trigger:
  high_confidence:
    - Bug report from user (crash, unexpected behavior)
    - Pre-commit code review (>3 files changed)
    - Logic verification (race conditions, edge cases)
    - Implementation plan review (find holes in plan)
    - Refactor verification (ensure no regression)

  medium_confidence (confirm before invoking):
    - Test case generation for new feature
    - Security audit
    - Performance bottleneck analysis

  never_trigger:
    - Simple questions / explanations
    - UI-only changes (styling, layout)
    - Documentation edits
    - Tasks Antigravity can handle alone easily
```

---

## 🔧 CLI Invocation Pattern

### Mode 1: Quick Analysis (read + stream response)

```bash
cd <PROJECT_ROOT> && timeout 120 codex \
  "<PROMPT>. DO NOT edit any files. Output your analysis as text." \
  --approval-mode suggest \
  -q 2>/dev/null
```

| Flag | Purpose |
|------|---------|
| `"prompt"` | Single-prompt mode — reads cwd, streams response, exits |
| `--approval-mode suggest` | Read-only: can browse files, won't make changes |
| `-q` | Quiet mode — no TUI, output to stdout |

### Mode 2: Deep Inspection (exec with JSON output)

```bash
cd <PROJECT_ROOT> && timeout 180 codex exec \
  "<PROMPT>. DO NOT edit any files. Output your findings as structured text." \
  --json 2>/dev/null
```

| Flag | Purpose |
|------|---------|
| `exec` | Non-interactive scripting mode |
| `--json` | Structured JSON output for parsing |

### Safety Rules

```yaml
safety:
  - Codex TUYỆT ĐỐI KHÔNG ĐƯỢC sửa code. CHỈ đọc + báo cáo.
  - ALWAYS use --approval-mode suggest (read-only mode).
  - ALWAYS inject "DO NOT edit any files" in every prompt.
  - Timeout: 120s for quick analysis, 180s for deep inspection.
  - If CLI fails → gracefully fallback to Antigravity-only mode.
  - NEVER pass secrets/tokens in prompt.
  - Working directory: ALWAYS set to project root.
  - Output: ALWAYS save to .md report file.
```

---

## 📋 Use Cases & Prompt Templates

### 1. Bug Root Cause Analysis

```bash
codex "A bug was reported: <BUG_DESCRIPTION>. \
Analyze the codebase to find the root cause. \
List: (1) most likely root cause with file:line, \
(2) contributing factors, (3) suggested fix approach. \
DO NOT edit any files." \
--approval-mode suggest -q
```

**When:** User reports a bug, crash, or unexpected behavior.
**Report to:** `codex-reports/bug-analysis-<date>.md`

### 2. Pre-Commit Code Review

```bash
codex "Review the uncommitted changes in this repo. \
Check for: bugs, logic errors, edge cases, thread safety, \
security issues, performance problems, naming inconsistencies. \
Rank issues by severity (critical/warning/info). \
DO NOT edit any files." \
--approval-mode suggest -q
```

**When:** Before committing changes across >3 files.
**Report to:** `codex-reports/review-<date>.md`

### 3. Logic & Edge Case Analysis

```bash
codex "Analyze <FILE_OR_MODULE> for logic correctness. \
Focus on: edge cases (null, empty, boundary), race conditions, \
error handling gaps, unreachable code, off-by-one errors. \
List each issue with file:line and severity. \
DO NOT edit any files." \
--approval-mode suggest -q
```

**When:** Complex logic that needs verification.
**Report to:** `codex-reports/logic-analysis-<date>.md`

### 4. Test Case Generation

```bash
codex "Analyze <FILE_OR_MODULE> and generate a comprehensive \
list of test cases. Include: happy path, edge cases, error cases, \
boundary values, concurrent scenarios. Format as markdown table. \
DO NOT edit any files." \
--approval-mode suggest -q
```

**When:** New feature needs test coverage planning.
**Report to:** `codex-reports/test-cases-<date>.md`

### 5. Implementation Plan Review

```bash
codex "Review this implementation plan: <PLAN_CONTENT>. \
Find: logic holes, missing error handling, security risks, \
race conditions, scalability issues, missing edge cases. \
Rate each issue by severity. \
DO NOT edit any files." \
--approval-mode suggest -q
```

**When:** After Antigravity creates an implementation plan.
**Report to:** `codex-reports/plan-review-<date>.md`

### 6. Refactor Verification

```bash
codex "Compare the recent changes in this repo against the \
original code. Verify: (1) no behavioral regression, \
(2) all original edge cases still handled, \
(3) no new bugs introduced. List any regressions found. \
DO NOT edit any files." \
--approval-mode suggest -q
```

**When:** After refactoring to ensure no regression.
**Report to:** `codex-reports/refactor-verify-<date>.md`

---

## 🔄 Integration Flow

```
1. Antigravity detects trigger condition
2. Check Codex CLI: which codex || prompt install
3. Thông báo user: "🔍 Đang gọi Codex CLI để [mục đích]..."
4. Build prompt with project context
5. Run: run_command("cd <ROOT> && timeout 120 codex '<prompt>' --approval-mode suggest -q")
6. Capture output
7. Save report to codex-reports/<type>-<date>.md
8. Summarize key findings for user
9. Act on findings (Antigravity executes fixes if needed)
```

### Output Handling

```yaml
on_success:
  - Parse Codex output (text or JSON)
  - Save full report to codex-reports/<type>-<date>.md
  - Extract key findings + severity
  - Present summary to user
  - If critical issues found → suggest fixes

on_timeout:
  - Log: "⏳ Codex analysis timed out (>120s), proceeding with Antigravity"
  - Fall back to Antigravity-only analysis

on_error:
  - Log: "⚠️ Codex CLI invocation failed"
  - Check: "codex --version" → suggest install if missing
  - Fall back gracefully — CLI is enhancement, not dependency

on_not_installed:
  - Ask user: "Codex CLI chưa cài. Cài bằng: npm i -g @openai/codex?"
  - If yes → run install → retry
  - If no → fall back to Antigravity-only
```

---

## 📁 Report Output Structure

```
<project_root>/
└── codex-reports/          # Gitignored recommended
    ├── bug-analysis-2026-03-21.md
    ├── review-2026-03-21.md
    ├── logic-analysis-2026-03-21.md
    ├── test-cases-2026-03-21.md
    ├── plan-review-2026-03-21.md
    └── refactor-verify-2026-03-21.md
```

---

## 🚫 Anti-Patterns

```yaml
never_do:
  - Let Codex edit source code (EVER)
  - Use --approval-mode auto or full-access (ALWAYS use suggest)
  - Pass sensitive data (API keys, tokens) in prompts
  - Block on CLI response indefinitely (always use timeout)
  - Call CLI more than 3 times per task (diminishing returns)
  - Ignore CLI output — if you called it, use the result
  - Call Codex for tasks Antigravity handles well alone

always_do:
  - Mention to user: "🔍 Đang gọi Codex CLI [mục đích]..."
  - Include "DO NOT edit any files" in EVERY prompt
  - Use --approval-mode suggest (read-only)
  - Save reports to codex-reports/ directory
  - Summarize findings before acting on them
  - Fall back gracefully if CLI unavailable
  - Check codex installation before first use
```

---

## 🤝 Three-Agent Collaboration

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────┐
    │   Antigravity    │ ← Primary: plan, code, implement
    │   (IDE Agent)    │
    └───┬─────────┬───┘
        │         │
   Strategy?   Debug/Review?
        │         │
        ▼         ▼
  ┌──────────┐ ┌──────────┐
  │ Gemini   │ │ Codex    │
  │ CLI      │ │ CLI      │
  │ ────────── │ ────────── │
  │ Architect │ │ Inspector│
  │ .md only  │ │ .md only │
  └──────────┘ └──────────┘
```

---

## 🧩 Skill Relationships

```
Uses:      run_command (to invoke codex CLI)
Enhances:  /debug, /code, /refactor, /plan workflows
Saves to:  codex-reports/*.md
Parallel:  gemini-conductor (different role, can coexist)
Independent of: NeuralMemory (CLI has its own context)
```

---

*codex-conductor v1.0 — Three-Agent Flow Inspector for Antigravity*
