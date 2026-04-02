# Agent Instructions

This project uses **Symphony** for task management and issue tracking.

## Quick Reference

```bash
symphony_available_tasks          # Find available work
symphony_claim_task <id>          # Claim a task
symphony_report_progress <id>     # Report progress
symphony_complete_task <id>       # Complete work
symphony_status                   # Check system status
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** — Create tasks for anything that needs follow-up
2. **Run quality gates** (if code changed) — Tests, linters, builds
3. **Update task status** — Complete finished work, update in-progress items
4. **PUSH TO REMOTE** — This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** — Clear stashes, prune remote branches
6. **Verify** — All changes committed AND pushed
7. **Hand off** — Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- If push fails, resolve and retry until it succeeds

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **main-awf** (8625 symbols, 24171 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/main-awf/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/main-awf/context` | Codebase overview, check index freshness |
| `gitnexus://repo/main-awf/clusters` | All functional areas |
| `gitnexus://repo/main-awf/processes` | All execution flows |
| `gitnexus://repo/main-awf/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

## Antigravity Integration

> Antigravity agent detected. Skills installed to `.gemini/antigravity/skills/gitnexus/`.

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.gemini/antigravity/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.gemini/antigravity/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.gemini/antigravity/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.gemini/antigravity/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.gemini/antigravity/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.gemini/antigravity/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- trello-sync:start -->
# Trello Sync — External Team Tracking

This project syncs task progress to Trello board **Appdexter - Code Magic** for PM/QC/Dev visibility.

> Auth: Global Environment Variables (`TRELLO_KEY`, `TRELLO_TOKEN`).
> Config: `"trello"` key in `.project-identity` (fallback: `.trello-config.json`).

## Quick Reference

```bash
# Core commands (powered by awkit v1.3.0+)
awkit trello desc "Mô tả tổng quan dự án..."
awkit trello checklist "Sprint Name"
awkit trello item "Task Name"
awkit trello complete "Task Name"
awkit trello comment "Progress update..."
awkit trello block "Lý do block..."
```

## Model: 1 Card = 1 Project

- **Lists** = team members (Kiên, Huy lớn, etc.) — cards do NOT move between lists.
- **Cards** = projects — each project has exactly ONE card.
- **Checklists** = phases (UI, Code Logic, Sprint...).
- **Checklist Items** = specific tasks/features.

- **MUST assure TRELLO_KEY and TRELLO_TOKEN are available** in the environment.
- **MUST auto-recover** on "credentials not found": run `source ~/.zshrc` → retry (max 2 times). Still failing → tell user to run `awkit init`.
- **MUST add checklist item** when starting a new task on the project card.
- **MUST mark item complete** (`--state complete`) when task finishes.
- **MUST comment** at major milestones (start, 60%, done).
- **MUST use board/list/card NAMES**, not IDs (CLI v1.5 requirement).

## Never Do

- NEVER create a new card for each task — operate on the existing project card.
- NEVER move cards between lists — lists represent team members.
- NEVER generate `.sh` script files for user to run manually.
- NEVER use bare `trello-cli` or `curl` directly for normal updates — use `awkit trello` native commands.
- NEVER block code flow if Trello API fails — log warning and continue.

## Symphony ↔ Trello Mapping

| Symphony Event | Trello Action |
|----------------|---------------|
| `symphony_claim_task` | Add checklist item (incomplete) + comment start |
| `symphony_report_progress` | Comment milestone on card |
| Task BLOCKED | Label "Blocked" + comment details |
| `symphony_complete_task` | Mark item ✅ complete + comment result |
<!-- trello-sync:end -->
