---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills — Router

## Overview

**Writing skills IS Test-Driven Development applied to process documentation.**

Write test cases (pressure scenarios), watch them fail (baseline), write the skill, watch tests pass, refactor (close loopholes).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

**REQUIRED BACKGROUND:** `.agent/skills/test-driven-development/SKILL.md`

## What is a Skill?

**Skills are:** Reusable techniques, patterns, tools, reference guides
**Skills are NOT:** Narratives about how you solved a problem once

### Skill Types
- **Technique** — Concrete method with steps (condition-based-waiting)
- **Pattern** — Way of thinking about problems (flatten-with-flags)
- **Reference** — API docs, syntax guides, tool documentation

## 📋 Topic Index — Load deep dives as needed

| Topic | When | File |
|-------|------|------|
| Search Optimization (CSO) | Writing description, naming skills | `examples/cso-optimization.md` |
| TDD Methodology | Testing skills RED-GREEN-REFACTOR | `examples/tdd-for-skills.md` |
| Anti-rationalization | Bulletproofing discipline skills | `examples/anti-rationalization.md` |

## SKILL.md Structure

**Frontmatter (YAML):** Only `name` and `description` supported (max 1024 chars)
- `name`: Letters, numbers, hyphens only
- `description`: "Use when..." — triggers only, **NEVER summarize workflow**

```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name
## Overview — Core principle in 1-2 sentences
## When to Use — Symptoms, use cases, when NOT to use
## Core Pattern — Before/after comparison
## Quick Reference — Table or bullets
## Implementation — Inline code or link to file
## Common Mistakes — What goes wrong + fixes
```

## Directory Structure

```
skills/skill-name/
  SKILL.md              # Main reference (required)
  examples/             # Deep-dive topics (JIT load)
  references/           # Heavy API docs (100+ lines)
  scripts/              # Executable tools
```

## Code Examples

**One excellent example beats many mediocre ones.** Don't implement in 5+ languages.

Good example: Complete, runnable, well-commented WHY, from real scenario, ready to adapt.

## Flowchart Usage

**Use ONLY for:** Non-obvious decision points, process loops, "A vs B" decisions.
**Never for:** Reference material, code examples, linear instructions.

## The Iron Law

```
NO SKILL WITHOUT A FAILING TEST FIRST
```

No exceptions — not for "simple additions", not for "documentation updates". Delete means delete.

## Skill Creation Checklist (TDD Adapted)

**RED Phase — Write Failing Test:**
- [ ] Create pressure scenarios (3+ combined pressures for discipline skills)
- [ ] Run scenarios WITHOUT skill — document baseline verbatim
- [ ] Identify patterns in rationalizations/failures

**GREEN Phase — Write Minimal Skill:**
- [ ] Name: letters, numbers, hyphens only
- [ ] YAML frontmatter: `name` + `description` (max 1024 chars)
- [ ] Description starts with "Use when..." (no workflow summary)
- [ ] Keywords throughout for search
- [ ] Address specific baseline failures from RED
- [ ] One excellent example
- [ ] Run scenarios WITH skill — verify compliance

**REFACTOR Phase — Close Loopholes:**
- [ ] Identify NEW rationalizations from testing
- [ ] Add explicit counters (if discipline skill)
- [ ] Build rationalization table
- [ ] Re-test until bulletproof

**Quality Checks:**
- [ ] Flowchart only if decision non-obvious
- [ ] Quick reference table
- [ ] Common mistakes section
- [ ] No narrative storytelling

## STOP: Before Moving to Next Skill

After writing ANY skill, complete deployment process first. Do NOT batch-create without testing each.

## Discovery Workflow

1. **Encounters problem** → 2. **Finds SKILL** (description matches) → 3. **Scans overview** → 4. **Reads patterns** → 5. **Loads example** (only when implementing)

Optimize for this flow — searchable terms early and often.

---

*writing-skills — Modular Router Architecture (TDD for Documentation)*
