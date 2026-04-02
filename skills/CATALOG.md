# 📋 AWF Skill Catalog

> Classification of core runtime skills and optional packs.
> Updated: 2026-04-02

---

## Skill Types

| Type | Description | Example |
|------|-------------|---------|
| `auto` | Always active, runs silently without user command | `orchestrator`, `nm-memory-sync` |
| `manual` | User must explicitly invoke via `/command` or keyword | `brainstorm-agent`, `ios-engineer` |

---

## Default Runtime Profile (`awkit install`)

`awkit install` now installs a lean runtime profile instead of the full source skill library.

### Core Lifecycle & Coordination

- `orchestrator`
- `symphony-orchestrator`
- `awf-session-restore`
- `nm-memory-sync`
- `symphony-enforcer`
- `trello-sync`

### Planning & Execution

- `brainstorm-agent`
- `module-spec-writer`
- `spec-gate`
- `visual-design-gate`
- `single-flow-task-execution`

### Quality & Debugging

- `systematic-debugging`
- `verification-gate`
- `code-review`
- `gitnexus-intelligence`

### Meta / Self-Evolution

- `writing-skills`
- `skill-creator`
- `awf-version-tracker`
- `auto-save`
- `awf-adaptive-language`
- `awf-context-help`
- `awf-error-translator`
- `gemini-conductor`
- `codex-conductor`
- `telegram-notify`
- `ship-to-code`

---

## Optional Packs

| Pack | Purpose |
|------|---------|
| `mobile-ios` | iOS, SwiftUI, Xcode, reverse engineering |
| `mobile-android` | Android, Kotlin, Compose, AdMob, APK analysis |
| `marketing` | ASO, App Store marketing, analytics, growth |
| `creator-studio` | Sprites, LucyLab TTS, short-form video workflows |
| `neural-memory` | Memory audit, intake, evolution, extra workflows |
| `superpowers` | Additional execution/TDD/reference skills ported from Superpowers |

---

## Self-Evolution Skills

Skills marked with self-evolution have a `## Learnings` section that accumulates insights:

- ✅ `orchestrator` — routing improvements
- ✅ `nm-memory-sync` — trigger pattern refinements
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
