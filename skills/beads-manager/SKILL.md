---
name: beads-manager
description: Smart Beads task management with Brain integration
trigger: always
---

# Beads Manager Skill (v6.5) — Hierarchical Epic Architecture

> **Purpose:** Quản lý tasks trong Beads với 3-level hierarchy (Epic → Phase → Subtask),
> Brain context awareness, và structured JSON output.
>
> **Requires:** Beads CLI v0.47+ (`bd version` to check)

---

## Architecture Overview

```
🏔️ EPIC (bd create -t epic)           ← 1 per /plan or /planExpert
├── 📦 Phase Task (--parent <epic>)    ← Groups of related work
│   ├── 📝 Subtask (--parent <phase>)  ← Atomic unit of work (~15-30 min)
│   ├── 📝 Subtask
│   └── 📝 Subtask
├── 📦 Phase Task
│   ├── 📝 Subtask
│   └── 📝 Subtask
└── ...
```

**Key Principles:**
- 1 Epic = 1 Feature/Plan
- Phase = sequential group (dependencies between phases)
- Subtask = smallest unit AI executes in 1 session
- All commands use `--json` for structured output
- `bd ready --parent <epic>` = intelligent task selection

---

## Core Functions

### 1. `plan_to_beads()` — Plan → Beads Sync

**Trigger:** When `/planExpert` or `/plan` finishes generating plan files.

**Process:**

```bash
# Step 1: Create epic (root node)
EPIC_ID=$(bd create "Feature Name" -t epic -p 1 \
  --description "Full feature description" \
  --acceptance "High-level acceptance criteria" \
  --design "Architecture approach (Clean Arch, MVVM, etc.)" \
  --json | jq -r '.id')

# Step 2: Create phase tasks as children of epic
PHASE1_ID=$(bd create "Phase 1: Setup & Config" \
  --parent $EPIC_ID -p 1 \
  --description "Project scaffolding and configuration" \
  --json | jq -r '.id')

PHASE2_ID=$(bd create "Phase 2: Backend API" \
  --parent $EPIC_ID -p 1 \
  --description "RESTful API endpoints" \
  --json | jq -r '.id')

# Step 3: Create subtasks as children of phases
bd create "Setup project structure" \
  --parent $PHASE1_ID -p 2 \
  --acceptance "Directory structure matches architecture" \
  --json

bd create "Configure database" \
  --parent $PHASE1_ID -p 2 \
  --acceptance "DB configured, migrations ready" \
  --json

# Step 4: Set inter-phase dependencies
bd dep add $PHASE2_ID $PHASE1_ID   # Phase 2 depends on Phase 1
bd dep add $PHASE3_ID $PHASE2_ID   # Phase 3 depends on Phase 2

# Step 5: Save to brain
# → Update brain/active_plans.json with epic mapping
```

**Rules:**
- Mỗi `/planExpert` hoặc `/plan` tạo **đúng 1 epic**
- Epic chứa metadata tổng quan (acceptance + design)
- Caps: max 8 phases/epic, max 5 subtasks/phase
- Every subtask MUST have `--acceptance` criteria

**Output Report:**
```
✅ PLAN CREATED — "Shopping Cart Feature"

🏔️ Epic: bd-a3f8 (Shopping Cart Feature)
├── 📦 bd-b1c2 Phase 1: Setup & Config (3 subtasks)
├── 📦 bd-d3e4 Phase 2: Backend API (3 subtasks)
├── 📦 bd-f5g6 Phase 3: Frontend UI (2 subtasks)
└── 📦 bd-h7i8 Phase 4: Testing (2 subtasks)

📊 Total: 1 epic, 4 phases, 10 subtasks
📿 Dependencies: Phase 1 → 2 → 3 → 4

➡️ Next: /codeExpert (starts first ready subtask)
```

---

### 2. `smart_pick()` — Intelligent Task Selection

**Trigger:** Session start, `/codeExpert`, `/next`

**Process:**

```bash
# Step 1: Get current epic from brain
EPIC_ID=$(cat brain/active_plans.json | jq -r '.current.epic_id')

# Step 2: Check in-progress first
IN_PROGRESS=$(bd list --status in_progress --parent $EPIC_ID --json)
if [ "$IN_PROGRESS" != "[]" ]; then
  # Resume existing task
  echo "🔁 Resuming: $(echo $IN_PROGRESS | jq -r '.[0].title')"
  exit 0
fi

# Step 3: Get ready (unblocked) tasks
READY=$(bd ready --parent $EPIC_ID --json --limit 5)

# Step 4: Auto-claim first ready task
TASK_ID=$(echo $READY | jq -r '.[0].id')
bd update $TASK_ID --claim
```

**Output:**
```
🎯 Working on: bd-x1y2 "Configure database"
   📦 Phase: Phase 1: Setup & Config
   ✅ Acceptance: DB configured, migrations ready
   📋 Design: Use Room/SQLite with migration support
```

**Fallback (no epic):**
```bash
# Legacy flat mode for backward compatibility
bd list --status in_progress --json
# or
bd ready --json --limit 5
```

---

### 3. `cascade_complete()` — Smart Completion

**Trigger:** When a task/subtask is completed.

**Process:**

```bash
# Step 1: Close the subtask
bd close <subtask-id> --reason "Completed" --suggest-next

# Step 2: Check if parent phase can be auto-closed
bd epic close-eligible
# → Auto-detects and closes phases/epics where all children are done

# Step 3: Update brain/active_plans.json
# → Mark completed phases, update progress
```

**Example Cascade:**
```
Close bd-z1 (last subtask of Phase 1)
  ✅ bd-z1 closed — "Setup project structure"
  ✅ bd-b1c2 auto-closed — Phase 1: Setup & Config (all 3/3 subtasks done)
  → Next ready: bd-x2y3 "Create Cart model" (Phase 2, now unblocked)
```

**Rules:**
- Auto-close phase when ALL its subtasks are done
- Auto-close epic when ALL its phases are done
- Always `--suggest-next` to show what's unblocked
- No user confirmation needed (low friction)

---

### 4. `progress_dashboard()` — Visual Progress

**Trigger:** `/todo`, session start, after each task completion.

**Process:**

```bash
# Get epic status
bd epic status --json
# Get hierarchy tree
bd list --parent $EPIC_ID --tree
```

**Output:**
```
🏔️ Shopping Cart Feature [████████░░] 60%

✅ Phase 1: Setup & Config [3/3] — DONE
🔵 Phase 2: Backend API [1/3] — IN PROGRESS
   ✅ bd-x2y3 Create Cart model
   🔵 bd-x3y4 Cart CRUD API ← CURRENT
   ⬜ bd-x4y5 Payment integration
⬜ Phase 3: Frontend UI [0/2] — BLOCKED (by Phase 2)
⬜ Phase 4: Testing [0/2] — BLOCKED (by Phase 3)
```

**Fallback (no epic):**
```bash
# Legacy mode
bd list --status open --limit 10
bd list --status in_progress
```

---

### 5. `track_metadata()` — Rich Task Data

**Trigger:** When creating or updating any task.

**Fields to use:**

| Flag | Purpose | Example |
|------|---------|---------| 
| `--description` | Detailed task description | "Implement REST endpoints for cart CRUD" |
| `--acceptance` | Definition of Done (DoD) | "All 4 endpoints return correct status codes" |
| `--design` | Architecture / implementation approach | "Repository pattern + Use Cases" |
| `--notes` | Runtime findings, blockers | "Found N+1 query issue, need optimization" |
| `--body-file` | Link to detailed spec file | "docs/specs/cart-api.md" |

**Example:**
```bash
bd create "Implement Cart API" \
  --parent $PHASE_ID -p 1 \
  --description "REST endpoints: GET/POST/PUT/DELETE /api/cart" \
  --acceptance "All CRUD ops work, validation on input, 401 for unauth" \
  --design "Repository pattern, DTOs for request/response" \
  --json
```

---

## Integration with Workflows

### `/planExpert` Integration

```bash
# After plan generation — replaces flat loop
1. bd create "<feature>" -t epic -p 1 --json           # Create epic
2. For each phase: bd create "<phase>" --parent <epic> --json  # Phases
3. For each task: bd create "<task>" --parent <phase> --acceptance "..." --json  # Subtasks
4. bd dep add <phase-N+1> <phase-N>                     # Sequential deps
5. Save epic mapping → brain/active_plans.json
6. Report tree view
```

### `/codeExpert` Integration

```bash
# Before coding — replaces manual bd list
1. smart_pick() → Get current or next ready task from epic
2. Load acceptance criteria as DoD
3. Code against acceptance criteria

# After coding — replaces bd update --status done
1. cascade_complete() → Close task + auto-close parent if eligible
2. Suggest next ready task
```

### `/plan` (Guided Mode) Integration

Same as `/planExpert` but phases/tasks created incrementally as user confirms each phase.

---

## Brain Integration

### `active_plans.json` Schema (v6.5)

```json
{
  "current": {
    "epic_id": "bd-a3f8",
    "feature": "Shopping Cart",
    "plan_path": "plans/260301-2109-shopping-cart/",
    "phases": [
      {
        "beads_id": "bd-b1c2",
        "name": "Phase 1: Setup & Config",
        "subtasks": ["bd-c1d2", "bd-c3d4", "bd-c5d6"],
        "status": "done",
        "depends_on": null
      },
      {
        "beads_id": "bd-d3e4",
        "name": "Phase 2: Backend API",
        "subtasks": ["bd-e1f2", "bd-e3f4", "bd-e5f6"],
        "status": "in_progress",
        "depends_on": "bd-b1c2"
      }
    ]
  },
  "plans": []
}
```

### Task-Knowledge Linking

```bash
# When saving knowledge during a task
/save-brain "How to fix N+1 query"
→ Save to: brain/solutions/n1-query-fix.md
→ Update task notes: bd update <id> --notes "Solution: brain/solutions/..."
```

---

## Gate Updates Reference

### Gate 0 — Session Start

```bash
# Check active epic
EPIC_ID=$(cat brain/active_plans.json | jq -r '.current.epic_id // empty')

if [ -n "$EPIC_ID" ]; then
  # Hierarchical mode
  bd epic status --json            # Epic progress
  bd list --parent $EPIC_ID --tree # Tree view
else
  # Legacy flat mode
  bd list --status in_progress
  bd list --status open --limit 3
fi
```

### Gate 1 — Before Coding

```bash
if [ -n "$EPIC_ID" ]; then
  smart_pick()  # From epic hierarchy
else
  # Legacy: create flat task
  bd create "[task summary]" --priority 1
  bd update <id> --status in_progress
fi
```

### Gate 2 — After Completion

```bash
if [ -n "$EPIC_ID" ]; then
  cascade_complete()  # Close + auto-cascade + suggest next
else
  bd update <id> --status done
  bd list --status open --limit 3
fi
```

---

## Backward Compatibility

```
Detection logic:
  1. Read brain/active_plans.json
  2. If "current.epic_id" exists → Hierarchical mode (v6.5)
  3. If "current.epic_id" missing → Legacy flat mode (v5.0)
  4. All legacy bd commands continue to work

No breaking changes. Existing flat tasks are unaffected.
```

---

## Error Handling

### Beads Not Available

```bash
if ! command -v bd &> /dev/null; then
    echo "⚠️ Beads CLI not installed"
    echo "Fallback: Brain-only mode (active_plans.json tracking)"
fi
```

### Beads Version Too Old

```bash
BD_VERSION=$(bd version 2>/dev/null | grep -oP '\d+\.\d+\.\d+')
# Require 0.47+ for --parent, -t epic, --json, bd epic
if [ "$(printf '%s\n' "0.47.0" "$BD_VERSION" | sort -V | head -n1)" != "0.47.0" ]; then
    echo "⚠️ Beads $BD_VERSION too old. Need 0.47+. Falling back to flat mode."
fi
```

### No Active Epic

```bash
# Graceful fallback to legacy flat mode
# All functions check for epic_id first, fall back to flat commands
```

---

## Commands Quick Reference

| Command | v5.0 (Old) | v6.5 (New) |
|---------|------------|------------|
| Create plan tasks | `bd create` loop | `bd create -t epic` + `--parent` hierarchy |
| Pick next task | `bd list --status open` | `bd ready --parent <epic> --json` |
| Claim task | `bd update --status in_progress` | `bd update --claim` |
| Complete task | `bd update --status done` | `bd close --reason --suggest-next` |
| Close phase | Manual | `bd epic close-eligible` (auto) |
| View progress | `bd list` | `bd list --parent <epic> --tree` |
| Epic status | N/A | `bd epic status --json` |

---

## Configuration

```json
// brain/preferences.json
{
  "beads": {
    "auto_create": true,
    "auto_update": true,
    "default_priority": 2,
    "max_phases_per_epic": 8,
    "max_subtasks_per_phase": 5,
    "use_hierarchy": true,
    "labels": ["feature", "bug", "refactor", "chore"]
  }
}
```
