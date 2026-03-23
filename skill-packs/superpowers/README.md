# 🦸 Superpowers Skill Pack

> Structured development workflows ported from Claude Code Superpowers.

Origin: [skainguyen1412/antigravity-superpowers](https://github.com/skainguyen1412/antigravity-superpowers)

---

## Install

```bash
awk enable-pack superpowers
```

Installs 13 skills into `~/.gemini/antigravity/skills/`:

| # | Skill | Purpose |
|---|-------|---------|
| 1 | `brainstorming` | Design-first exploration before creative work |
| 2 | `executing-plans` | Load and execute plans with review checkpoints |
| 3 | `finishing-a-development-branch` | Structured branch completion: merge/PR/keep/discard |
| 4 | `receiving-code-review` | Technical evaluation of review feedback |
| 5 | `requesting-code-review` | Structured review pass before merge |
| 6 | `single-flow-task-execution` | **One-task-at-a-time with two-stage review loop** |
| 7 | `systematic-debugging` | Root cause analysis before fixing |
| 8 | `test-driven-development` | Red-Green-Refactor TDD cycle |
| 9 | `using-git-worktrees` | Isolated workspaces via git worktrees |
| 10 | `using-superpowers` | Skill-first routing and loading |
| 11 | `verification-before-completion` | Evidence-based completion claims |
| 12 | `writing-plans` | Create bite-sized implementation plans |
| 13 | `writing-skills` | TDD-based skill authoring |

---

## Key Feature: Two-Stage Review Loop

The `single-flow-task-execution` skill introduces a disciplined review process:

1. **Implement** → Self-review → Commit
2. **Spec compliance review** → "Did we build what was requested?"
3. **Code quality review** → "Is the code clean and maintainable?"
4. Both pass → Next task

This prevents the common failure of "code is clean but doesn't match requirements."

---

## Overlap with AWF Skills

| Superpowers Skill | AWF Equivalent | Recommendation |
|-------------------|---------------|----------------|
| `brainstorming` | `brainstorm-agent` | AWF version is more comprehensive (3 modes, Vietnamese) |
| `using-superpowers` | `orchestrator` | AWF version has Symphony + NeuralMemory integration |

Both versions can coexist — they have different names and slightly different trigger patterns.

---

*Superpowers Skill Pack for AWK · Ported from Claude Code*
