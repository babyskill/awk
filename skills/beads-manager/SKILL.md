---
name: beads-manager
description: Smart Beads task management with Brain integration
trigger: always
---

# Beads Manager Skill (v5.0)

> **Purpose:** Quản lý tasks trong Beads với Brain context awareness.

---

## Core Functions

### 1. Smart Task Creation

**Auto-Context:**
```bash
# Khi tạo task, tự động:
1. Detect current plan/phase từ Brain
2. Link task to parent phase
3. Set priority based on dependencies
4. Add relevant labels
```

**Example:**
```bash
# User gõ
bd create "Fix login bug"

# Skill auto-enhance
bd create "Fix login bug" \
  --parent $CURRENT_PHASE_TASK \
  --label bug \
  --priority 0 \
  --note "Related to plan: Shopping Cart, Phase 02"
```

---

### 2. Task Status Tracking

**Auto-Update:**
```bash
# Khi workflow hoàn thành
/codeExpert → Auto: bd update $TASK_ID --status done

# Khi gặp blocker
/debugExpert fail → Auto: bd update $TASK_ID --status blocked
```

**Status Sync:**
- `open` → Task mới tạo
- `in_progress` → Đang làm
- `blocked` → Bị chặn bởi task khác
- `done` → Hoàn thành
- `cancelled` → Hủy bỏ

---

### 3. Dependency Management

**Auto-Detect:**
```bash
# Khi tạo task từ plan
Phase 01 → Task A, B, C
Phase 02 → Task D, E (depends on Phase 01)

# Auto-create dependencies
bd dep add D A
bd dep add D B
bd dep add D C
```

**Blocker Alert:**
```bash
# Khi user chọn task bị block
/codeExpert → Check dependencies
→ "Task #125 blocked by #120 (not done yet)"
→ Suggest: "Do task #120 first?"
```

---

### 4. Task Filtering & Search

**Smart Filters:**
```bash
# By status
bd list --status open
bd list --status in_progress

# By label
bd list --label bug
bd list --label feature

# By priority
bd list --priority 0    # Critical
bd list --priority 1    # High
bd list --priority 2    # Normal

# Ready to work (no blockers)
bd ready
```

---

### 5. Task Completion Flow

**When task done:**
```bash
1. bd update $TASK_ID --status done
2. Check if phase complete (all tasks done)
3. If phase complete → Update plan.md progress
4. Suggest next task: bd ready
5. Prompt: "Save knowledge? /save-brain"
```

---

## Integration with Workflows

### `/planExpert` Integration

```bash
# After plan generation
1. Call sync_plan_to_beads.sh
2. Create parent + phase + task hierarchy
3. Set dependencies
4. Report: "Created 42 tasks in Beads"
```

### `/codeExpert` Integration

```bash
# Before coding
1. bd list --status in_progress
2. If found → Resume that task
3. If not → bd ready → Pick P0 task
4. Update task status to in_progress

# After coding
1. Run tests
2. If pass → bd update --status done
3. If fail → bd update --status blocked + create bug task
```

### `/debugExpert` Integration

```bash
# When bug found
1. bd create "Fix: $ERROR_MESSAGE" --label bug --priority 0
2. Link to failing task (if any)
3. After fix → bd update --status done
```

---

## Brain Integration

### Active Plans Tracking

```json
// brain/active_plans.json
{
  "current": {
    "plan_path": "plans/260130-1025-shopping-cart/",
    "feature": "Shopping Cart",
    "beads_parent_id": 456,
    "phases": [
      {
        "name": "Phase 01: Setup",
        "beads_id": 457,
        "status": "done"
      },
      {
        "name": "Phase 02: Backend",
        "beads_id": 458,
        "status": "in_progress",
        "tasks": [123, 124, 125]
      }
    ]
  }
}
```

### Task-Knowledge Linking

```bash
# When save knowledge
/save-brain "How to fix N+1 query"

# Auto-link to current task
→ Save to: brain/solutions/n1-query-fix_#123.md
→ Add reference in task: bd update 123 --note "Solution: brain/solutions/..."
```

---

## Commands Reference

### Basic Commands

```bash
# Create task
bd create "Task name" [--priority 0-2] [--label tag]

# List tasks
bd list [--status STATUS] [--label LABEL]

# Update task
bd update <id> --status STATUS

# Show task details
bd show <id>

# Add dependency
bd dep add <child> <parent>

# Ready tasks (no blockers)
bd ready
```

### Enhanced Commands (via Skill)

```bash
# Smart create (auto-context)
/task "Task name"    # Alias, auto-add context

# Quick status
/todo                # Alias for bd list
/done "Note"         # Mark current task done + save note

# Task navigation
/next                # Show next recommended task
```

---

## Error Handling

### Beads Not Available

```bash
if ! command -v bd &> /dev/null; then
    echo "⚠️ Beads not installed"
    echo "Fallback: Use Brain-only mode"
    # Continue without task tracking
fi
```

### Task Not Found

```bash
bd show 999
→ "❌ Task #999 not found"
→ Suggest: "bd list to see all tasks"
```

### Circular Dependency

```bash
bd dep add A B
bd dep add B A
→ "❌ Circular dependency detected"
→ Suggest: "Remove one dependency"
```

---

## Performance

- **Task Creation:** < 100ms
- **List Tasks:** < 200ms (for 100 tasks)
- **Dependency Check:** < 50ms
- **Brain Sync:** < 500ms

---

## Example Workflow

```bash
# 1. Create plan
/planExpert "Shopping Cart"
→ Creates 42 tasks in Beads

# 2. Check tasks
bd list
→ Shows all tasks with status

# 3. Start coding
/codeExpert
→ Auto-picks task #123 (P0, ready)
→ Updates status to in_progress

# 4. Complete task
→ Tests pass
→ Auto: bd update 123 --status done

# 5. Next task
/next
→ Suggests task #124 (next P0)

# 6. Save knowledge
/save-brain "Login API implementation"
→ Links to task #123
```

---

## Configuration

```json
// brain/preferences.json
{
  "beads": {
    "auto_create": true,
    "auto_update": true,
    "default_priority": 2,
    "labels": ["feature", "bug", "refactor"]
  }
}
```
