# Brain Entry Templates

> Các template chuẩn để lưu vào brain/ — dùng cho cả auto-save và manual /save-brain.

---

## Template 1: Decision (brain/decisions/)

**Filename:** `brain/decisions/YYYY-MM-DD-[slug].md`

```markdown
---
date: 2026-02-22
type: decision
topic: [brief topic, e.g., "Database choice for neural-brain"]
feature: [which feature/project this belongs to]
tags: [tech, architecture, database, ...]
salience: 0.90
---

# Decision: [Topic]

## What was decided
[Clear statement of the decision]

## Why this approach
[Rationale — key reasons]

## Alternatives considered
- **[Option A]**: [Why rejected]
- **[Option B]**: [Why rejected]

## Trade-offs
- ✅ [Pro 1]
- ✅ [Pro 2]
- ⚠️ [Con/caveat]

## Context
[Additional context: task ID, feature, constraints]
```

---

## Template 2: Solution (brain/solutions/)

**Filename:** `brain/solutions/YYYY-MM-DD-[slug].md`

```markdown
---
date: 2026-02-22
type: solution
error_pattern: [e.g., "TypeError: Cannot read property of undefined"]
files_affected: [e.g., "activation.js, store.js"]
tags: [javascript, sqlite, null-check, ...]
salience: 0.85
---

# Solution: [Error Pattern]

## The Error
```
[Paste exact error or describe the bug]
```

## Root Cause
[Why this happened — 1-2 sentences]

## The Fix
[Step-by-step or code snippet showing the solution]

```js
// Before (broken)
code here

// After (fixed)
code here
```

## How to Prevent
[Rule or pattern to avoid this in future]

## Context
[What feature/task was being worked on when this occurred]
```

---

## Template 3: Architecture (brain/decisions/)

**Filename:** `brain/decisions/arch-[feature]-[date].md`

```markdown
---
date: 2026-02-22
type: architecture
feature: [feature name, e.g., "neural-brain"]
tags: [architecture, design, ...]
salience: 0.95
---

# Architecture: [Feature Name]

## Overview
[Brief description of what was designed]

## Structure
```
[directory tree or component diagram]
```

## Key Decisions
1. [Decision 1 + rationale]
2. [Decision 2 + rationale]
3. [Decision 3 + rationale]

## Tech Choices
| Component | Choice | Reason |
|-----------|--------|--------|
| [Layer]   | [Tech] | [Why]  |

## Data Flow
[How data flows through the system]

## Open Questions
- [ ] [Question to resolve later]
```

---

## Template 4: Session (brain/session.json)

**Auto-updated by ambient-brain skill.**

```json
{
  "last_updated": "2026-02-22T16:56:00+07:00",
  "working_on": {
    "project": "main-awf",
    "feature": "neural-brain + ambient-brain skill",
    "phase": "implementation",
    "current_task_id": null,
    "current_files": ["skills/ambient-brain/SKILL.md"]
  },
  "recent_decisions": [
    {
      "ref": "decisions/2026-02-22-use-better-sqlite3.md",
      "summary": "Use better-sqlite3 for neural brain storage"
    }
  ],
  "recent_solutions": [],
  "active_context": {
    "neural_brain_port": "Planning phase - studying Python source",
    "ambient_brain": "Implementing skill files"
  },
  "completed_milestones": [],
  "context_checkpoints": []
}
```

---

## Template 5: Active Plans (brain/active_plans.json)

```json
{
  "plans": [
    {
      "id": "neural-brain-nodejs-port",
      "title": "Port neural-memory to Node.js for main-awf",
      "status": "planning",
      "phases": [
        { "id": "p1", "name": "Study Python source", "status": "done" },
        { "id": "p2", "name": "Build SQLite schema", "status": "next" },
        { "id": "p3", "name": "Core data structures", "status": "pending" },
        { "id": "p4", "name": "Spreading activation engine", "status": "pending" },
        { "id": "p5", "name": "Public API integration", "status": "pending" }
      ],
      "created": "2026-02-22",
      "last_updated": "2026-02-22"
    },
    {
      "id": "ambient-brain-skill",
      "title": "Ambient Brain Sync skill for AWF",
      "status": "implementing",
      "phases": [
        { "id": "p1", "name": "Design & brainstorm", "status": "done" },
        { "id": "p2", "name": "Create skill files", "status": "in_progress" },
        { "id": "p3", "name": "Update GEMINI.md", "status": "next" },
        { "id": "p4", "name": "Deploy to antigravity", "status": "pending" },
        { "id": "p5", "name": "Test with real workflow", "status": "pending" }
      ],
      "created": "2026-02-22",
      "last_updated": "2026-02-22"
    }
  ]
}
```

---

*brain-templates v1.0.0 — Standard formats for consistent brain storage*
