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

## AUTO-COMMIT RULE

**After a successful build (0 errors)**, commit immediately — do NOT wait for session end.

```bash
git add -A
git commit -m "fix: <concise description>"   # conventional commit format
git push                                       # non-force push, safe to auto-run
```

**Rules:**
- Commit NGAY sau build 0 errors — không gom lại cuối session.
- `git push` (non-force) được phép chạy tự động.
- Push fail → `git pull --rebase && git push` (retry 1 lần).
- Vẫn fail → báo user, KHÔNG force push.
