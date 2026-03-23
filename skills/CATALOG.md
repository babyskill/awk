# 📋 AWF Skill Catalog

> Classification of all skills by type, trigger, and priority.
> Updated: 2026-03-06

---

## Skill Types

| Type | Description | Example |
|------|-------------|---------|
| `auto` | Always active, runs silently without user command | `orchestrator`, `memory-sync` |
| `manual` | User must explicitly invoke via `/command` or keyword | `brainstorm-agent`, `ios-engineer` |

---

## Active Skills

| # | Skill | Type | Trigger | Priority | Version | Status |
|---|-------|------|---------|----------|---------|--------|
| 1 | `orchestrator` | `auto` | Always (first) | 1 | 2.1.0 | ✅ Active |
| 2 | `awf-session-restore` | `auto` | Session start | 2 | — | ✅ Active |
| 3 | `memory-sync` | `auto` | Always | 3 | 2.2.0 | ✅ Active |
| 4 | `symphony-orchestrator` | `auto` | Always | 4 | 1.0.0 | ✅ Active |
| 5 | `brainstorm-agent` | `manual` | `/brainstorm`, keywords | 5 | 1.0.0 | ✅ Active |
| 6 | `awf-error-translator` | `auto` | Error detected | 6 | — | ✅ Active |
| 7 | `awf-adaptive-language` | `auto` | Always | 7 | — | ✅ Active |
| 8 | `ios-engineer` | `manual` | iOS tasks | — | — | ✅ Active |
| 9 | `smali-to-kotlin` | `manual` | `/reverse-android` | 8 | — | ✅ Active |
| 10 | `smali-to-swift` | `manual` | `/reverse-ios` | 9 | — | ✅ Active |
| 11 | `awf-context-help` | `auto` | `/help`, stuck | — | — | ✅ Active |
| 12 | `auto-save` | `auto` | Session end | — | — | ✅ Background |
| 13 | `awf-version-tracker` | `auto` | Skill changes | — | — | ✅ Background |

---

## Quality & Discipline Skills (Superpowers-Inspired)

> Skills ported and adapted from [obra/superpowers](https://github.com/obra/superpowers) framework.
> Integrated into AWKit with NeuralMemory + Symphony extensions.

| # | Skill | Type | Trigger | Priority | Status |
|---|-------|------|---------|----------|--------|
| 14 | `verification-gate` | `auto` | Task completion, commit, deploy | 1 | ✅ Active |
| 15 | `systematic-debugging` | `auto` | `/debug`, error detected, test failures | 2 | ✅ Active |
| 16 | `code-review` | `auto` | Task completion, before merge | 3 | ✅ Active |
| 17 | `writing-skills` | `manual` | Creating/modifying skills | — | ✅ Active |


---

## NeuralMemory Skill Pack (Optional Upgrade)

When NeuralMemory is installed, these skills provide enhanced capabilities:

| # | Skill | Type | Replaces | Trigger |
|---|-------|------|----------|---------|
| 1 | `nm-memory-sync` | `auto` | `memory-sync` | Session start, debug, errors |
| 2 | `nm-memory-intake` | `manual` | — | `/memory-intake` |
| 3 | `nm-memory-audit` | `manual` | — | `/memory-audit` |
| 4 | `nm-memory-evolution` | `manual` | — | `/memory-evolution` |

---

## Self-Evolution Skills

Skills marked with self-evolution have a `## Learnings` section that accumulates insights:

- ✅ `orchestrator` — routing improvements
- ✅ `memory-sync` — trigger pattern refinements
- ✅ `symphony-orchestrator` — task management optimizations

---

## Removed (Legacy Duplicates)

These were deleted in v2.2 cleanup — canonical versions are listed above:

| Removed | Replaced By | Reason |
|---------|------------|--------|
| `ambient-brain/` | `memory-sync/` | v1.0 → v2.2 upgrade |
| `adaptive-language/` | `awf-adaptive-language/` | Naming standardization |
| `context-help/` | `awf-context-help/` | Naming standardization |
| `error-translator/` | `awf-error-translator/` | Naming standardization |
| `session-restore/` | `awf-session-restore/` | Naming standardization |
| `beads-manager/` | `symphony-orchestrator/` | Migrated to Symphony for task management |
