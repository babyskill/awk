---
name: writing-skills
description: Use when creating or modifying AWKit skills and workflows. Applies TDD methodology to process documentation. Ensures skills are testable, anti-rationalization-proof, and follow consistent structure.
---

# Writing Skills

## Overview

Writing skills IS Test-Driven Development applied to process documentation.

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.

## What is a Skill?

A **skill** is a reference guide for proven techniques, patterns, or tools.

**Skills ARE:** Reusable techniques, patterns, tools, reference guides
**Skills are NOT:** Narratives about how you solved a problem once

## Standard Skill Structure

Every AWKit skill MUST follow this structure:

```markdown
---
name: skill-name
description: When to use + auto-trigger description (for CATALOG.md matching)
---

# Skill Title

## Overview (1-2 sentences — what + why)
## The Iron Law (core rule, no exceptions — for discipline skills)
## When to Use / When NOT to Use
## The Process (step by step)
## Red Flags — STOP (catch rationalization)
## Anti-Rationalization Table (excuse → reality)
## Integration (related skills + workflows)
```

**Required sections:** Overview, When to Use, The Process
**Recommended for discipline skills:** Iron Law, Red Flags, Anti-Rationalization Table

## When to Create a Skill

**Create when:**
- Technique wasn't intuitively obvious
- You'd reference this again across projects
- Pattern applies broadly (not project-specific)
- An agent repeatedly makes the same mistake

**Don't create for:**
- One-off solutions
- Standard practices well-documented elsewhere
- Project-specific conventions (put in GEMINI.md or docs/specs/)

## Skill Types

### Rigid Skills (Follow Exactly)
- `verification-gate` — No shortcuts for verification
- `systematic-debugging` — 4-phase process mandatory
- TDD enforcement — RED-GREEN-REFACTOR cycle

### Flexible Skills (Adapt Principles)
- `brainstorm-agent` — Adapt questions to context
- `ios-engineer` — Apply patterns per project needs

**The skill itself tells you which type it is.**

## Key Writing Principles

### 1. Token Efficiency (Critical)
- Every token competes for agent context
- Use tables over paragraphs for rules
- Use bullet points over prose
- Eliminate redundancy ruthlessly

### 2. Bulletproofing Against Rationalization
- Agents are smart and WILL find loopholes under pressure
- Close every loophole explicitly
- Build rationalization table with common excuses
- Create Red Flags list

### 3. Cross-Referencing
- Link related skills: `**Related:** verification-gate, systematic-debugging`
- Note integration points: "Used by single-flow-task-execution"
- Reference workflows: `/debug`, `/code`, `/deploy`

## Checklist: Before Publishing Skill

- [ ] SKILL.md follows standard structure
- [ ] `name` and `description` in frontmatter
- [ ] When to Use is clear and specific
- [ ] Process steps are numbered and unambiguous
- [ ] Anti-rationalization table covers common excuses
- [ ] Integration section lists related skills/workflows
- [ ] File < 500 lines
- [ ] No narrative/story sections — only reference content
- [ ] Updated CATALOG.md entry

## Integration

**Related:**
- `awf-version-tracker` — Auto-snapshot skill changes
- CATALOG.md — Skill registry

**Workflows:**
- `/skill-health` — Check skill system health
- `/skill-rollback` — Rollback broken skill changes
