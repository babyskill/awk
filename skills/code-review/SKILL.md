---
name: code-review
description: Use when completing tasks, implementing features, or before merging. Dispatch structured code review with severity classification. Auto-triggers after task completion in subagent-driven or single-flow execution.
---

# Code Review

## Overview

Review early, review often. Catch issues before they cascade.

**Core principle:** Structured review with actionable, severity-classified feedback.

## When to Request Review

**Mandatory:**
- After completing each task in execution flow
- After implementing major feature or fix
- Before merge to main branch
- Before deploy to production

**Optional but valuable:**
- When stuck (fresh perspective helps)
- Before refactoring (baseline check)
- After fixing complex bug

## The Review Process

### Step 1: Prepare Context

Gather what the reviewer needs:

```bash
# Get the diff scope
git diff main..HEAD --stat
git log main..HEAD --oneline

# OR for specific task
git diff HEAD~1..HEAD --stat
```

### Step 2: Construct Review Request

Every review request needs:

| Field | Description | Example |
|-------|-------------|---------|
| **WHAT** | What was implemented | "Water reminder notification system" |
| **SPEC** | What it should do | "Send notification every 2h between 8am-10pm" |
| **FILES** | Changed files | `WaterReminderManager.swift`, `NotificationService.swift` |
| **SCOPE** | Review focus | "Logic correctness + thread safety" |

### Step 3: Classify Findings

| Severity | Action | Example |
|----------|--------|---------|
| 🔴 **Critical** | BLOCK — fix immediately | Thread-unsafe shared state, data loss risk |
| 🟡 **Important** | Fix before proceeding | Missing error handling, incomplete validation |
| 🟢 **Minor** | Note for later | Naming convention, code style preference |
| ℹ️ **Suggestion** | Consider but optional | Performance optimization, alternative approach |

### Step 4: Act on Feedback

1. Fix 🔴 Critical issues IMMEDIATELY
2. Fix 🟡 Important issues before proceeding to next task
3. Log 🟢 Minor issues — fix in refactoring pass
4. Evaluate ℹ️ Suggestions — adopt if clear improvement

## Two-Stage Review (Subagent-Driven)

For automated execution, run TWO separate review passes:

### Stage 1: Spec Compliance Review
```
- Does the code implement ALL requirements from the spec/plan?
- Is anything MISSING from the spec?
- Is anything EXTRA that wasn't specified (scope creep)?
- Does behavior match expected output for each requirement?
```

### Stage 2: Code Quality Review
```
- Is the code clean, readable, and well-structured?
- Are there any thread safety issues?
- Is error handling comprehensive?
- Are there performance concerns?
- Does it follow project coding conventions?
- Are there any security vulnerabilities?
```

**Order matters:** Spec compliance FIRST, then code quality. No point reviewing quality of wrong code.

## Self-Review Checklist (Before Requesting External Review)

Before asking for review, verify yourself:

- [ ] All requirements from plan/spec addressed
- [ ] No TODO/FIXME/HACK left unresolved  
- [ ] Error handling for all failure paths
- [ ] No hardcoded values that should be configurable
- [ ] Thread safety for shared state
- [ ] Localization for user-facing strings
- [ ] No print/debugPrint left in production code
- [ ] File sizes < 500 lines

## Integration

**Used by:**
- `single-flow-task-execution` — Review after each task
- `symphony-enforcer` — Review before `symphony_complete_task`

**Related skills:**
- `verification-gate` — Run tests BEFORE requesting review
- `systematic-debugging` — If review reveals bugs

## Anti-Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It's a small change" | Small changes cause big bugs |
| "Tests pass so it's correct" | Tests ≠ requirements. Review catches logic gaps |
| "I'm confident in this code" | Confidence ≠ correctness |
| "No time for review" | 5 min review saves 2 hours debugging |
| "I'll review it later" | Later never comes. Review now |
| "Only I understand this code" | That's exactly why someone else should review |
