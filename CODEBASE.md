# AWKit — Codebase Map

> **Source of Truth:** `/Users/trungkientn/Dev/NodeJS/main-awf`
> **Runtime Target:** `~/.gemini/antigravity/`
> **Last Updated:** 2026-03-10

---

## ⚠️ DEVELOPMENT PRIORITY (CRITICAL)

```
⛔ HARD RULE — KHÔNG ĐƯỢC VI PHẠM:

1. LUÔN sửa file trong main-awf/ TRƯỚC
2. SAU ĐÓ sync sang ~/.gemini/antigravity/ bằng `awkit install`
3. KHÔNG BAO GIỜ sửa trực tiếp trong ~/.gemini/antigravity/ khi đang có main-awf workspace

Flow:
  Edit main-awf/ → awkit install → ~/.gemini/antigravity/ (runtime)

Reverse (nếu có thay đổi ở runtime bởi session khác):
  awkit harvest → kéo về main-awf/ → review → awkit install

Check sync:
  awkit status → hiển thị diff giữa main-awf và runtime
```

---

## 📁 Directory Structure

```
main-awf/
├── bin/                    # CLI entry points
│   └── awk.js              # Main CLI (awkit command)
├── core/                   # Core config files (deployed to ~/.gemini/antigravity/)
│   ├── GEMINI.md           # Master AI config — THE most important file
│   ├── AGENTS.md           # Agent definitions
│   └── orchestrator.md     # Orchestrator logic
├── workflows/              # 75+ workflow definitions (.md files)
│   ├── plan.md, code.md    # Lifecycle workflows
│   ├── debug.md, deploy.md # Dev workflows
│   ├── recap.md, next.md   # Context workflows
│   └── ...                 # See full list in workflows/
├── skills/                 # Auto-activate skill modules
│   ├── orchestrator/       # Priority 1 — Intent dispatcher
│   ├── awf-session-restore/ # Priority 2 — Session restore
│   ├── nm-memory-sync/     # Priority 3 — NeuralMemory sync
│   ├── symphony-orchestrator/ # Priority 0 — Preflight
│   └── ...                 # See full list in skills/
├── skill-packs/            # Optional add-on packs
├── symphony/               # Symphony task management system
│   ├── src/                # Server source (Express + SQLite)
│   ├── dashboard/          # React dashboard
│   └── cli/                # CLI tools
├── templates/              # Project templates
├── schemas/                # JSON schemas
├── scripts/                # Build scripts (harvest.js)
├── docs/                   # Documentation
├── package.json            # npm package config (@leejungkiin/awkit)
└── .project-identity       # Project metadata
```

---

## 🔄 Sync Mapping

| main-awf/ path | → Runtime path (~/.gemini/) |
|---|---|
| `core/GEMINI.md` | `antigravity/GEMINI.md` → **also** `GEMINI.md` |
| `workflows/` | `antigravity/global_workflows/` |
| `skills/` | `antigravity/skills/` |
| `templates/` | `antigravity/templates/` |
| `schemas/` | `antigravity/schemas/` |
| `symphony/` | `antigravity/symphony/` |

---

## 🎯 Key Files to Know

| File | Purpose | Edit Priority |
|---|---|---|
| `core/GEMINI.md` | Master AI config, gates, rules | **main-awf FIRST** |
| `skills/*/SKILL.md` | Skill definitions | **main-awf FIRST** |
| `workflows/*.md` | Workflow definitions | **main-awf FIRST** |
| `symphony/src/` | Symphony server code | **main-awf FIRST** |
| `bin/awk.js` | CLI entry point | **main-awf FIRST** |
| `package.json` | npm package config | **main-awf FIRST** |

---

## 📋 CLI Commands

```bash
awkit install     # Deploy main-awf → ~/.gemini/antigravity
awkit harvest     # Pull ~/.gemini/antigravity → main-awf
awkit sync        # harvest + install (bidirectional)
awkit status      # Show diff
awkit doctor      # Health check
awkit version     # Show version
```
