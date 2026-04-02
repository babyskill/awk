# AWKit Lean Runtime + Clean Install Report

Date: 2026-04-02
Project: `main-awf`
Scope: lean skill runtime, optional pack activation, install-state tracking, generated artifact cleanup

## Goal

Reduce default skill/token footprint in AWKit runtime and stop `awkit install` from dirtying the repo with generated Cline/Claude artifacts unless that multi-platform regeneration is explicitly requested.

## What Changed

### 1. Core runtime now has an explicit default manifest

- Added [core/skill-runtime-manifest.json](/Users/trungkientn/Dev/NodeJS/main-awf/core/skill-runtime-manifest.json).
- Default profile is now `core`.
- Default runtime contains 26 cross-project skills only.
- Domain-heavy skills are no longer part of the default runtime and are expected to come from packs.

### 2. Install pipeline now respects `core + enabled packs`

- Updated [bin/awk.js](/Users/trungkientn/Dev/NodeJS/main-awf/bin/awk.js) to:
  - read the runtime manifest
  - install only selected core skills by default
  - persist enabled pack state per platform
  - restore enabled packs during reinstall
  - archive managed optional skills that are no longer part of the desired runtime
  - resolve pack skills from either `skill-packs/<pack>/skills/` or source `skills/` via `pack.json.skills`
  - include profile and enabled packs in `status` and `doctor`
- Updated generators so derived platforms can receive filtered skill sets:
  - [bin/codex-generators.js](/Users/trungkientn/Dev/NodeJS/main-awf/bin/codex-generators.js)
  - [bin/claude-generators.js](/Users/trungkientn/Dev/NodeJS/main-awf/bin/claude-generators.js)
  - [bin/cline-generators.js](/Users/trungkientn/Dev/NodeJS/main-awf/bin/cline-generators.js)

### 3. Packs are now cleaner and more intentional

- Updated [skill-packs/neural-memory/pack.json](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/neural-memory/pack.json):
  - `auto_install: false`
  - explicit `skills` list
- Added new pack:
  - [skill-packs/creator-studio/pack.json](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/creator-studio/pack.json)
  - [skill-packs/creator-studio/README.md](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/creator-studio/README.md)

### 4. Runtime guidance was updated for lean routing

- Updated [core/orchestrator.md](/Users/trungkientn/Dev/NodeJS/main-awf/core/orchestrator.md) and [skills/orchestrator/SKILL.md](/Users/trungkientn/Dev/NodeJS/main-awf/skills/orchestrator/SKILL.md) to recommend enabling domain packs on demand.
- Updated [skills/CATALOG.md](/Users/trungkientn/Dev/NodeJS/main-awf/skills/CATALOG.md) to reflect `core runtime + optional packs`.
- Synced `writing-skills` to the lean router structure:
  - [skills/writing-skills/SKILL.md](/Users/trungkientn/Dev/NodeJS/main-awf/skills/writing-skills/SKILL.md)
  - [skills/writing-skills/examples/anti-rationalization.md](/Users/trungkientn/Dev/NodeJS/main-awf/skills/writing-skills/examples/anti-rationalization.md)
  - [skills/writing-skills/examples/cso-optimization.md](/Users/trungkientn/Dev/NodeJS/main-awf/skills/writing-skills/examples/cso-optimization.md)
  - [skills/writing-skills/examples/tdd-for-skills.md](/Users/trungkientn/Dev/NodeJS/main-awf/skills/writing-skills/examples/tdd-for-skills.md)
- Synced the `superpowers` copies to avoid stale heavy variants and bad path references:
  - [skill-packs/superpowers/skills/writing-skills/SKILL.md](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/superpowers/skills/writing-skills/SKILL.md)
  - [skill-packs/superpowers/skills/writing-skills/examples/cso-optimization.md](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/superpowers/skills/writing-skills/examples/cso-optimization.md)
  - [skill-packs/superpowers/skills/writing-skills/examples/tdd-for-skills.md](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/superpowers/skills/writing-skills/examples/tdd-for-skills.md)
  - [skill-packs/superpowers/skills/single-flow-task-execution/SKILL.md](/Users/trungkientn/Dev/NodeJS/main-awf/skill-packs/superpowers/skills/single-flow-task-execution/SKILL.md)

### 5. `awkit install` no longer dirties Cline/Claude by default

- Updated [bin/awk.js](/Users/trungkientn/Dev/NodeJS/main-awf/bin/awk.js) so interactive install now defaults to the active platform instead of `All of the above`.
- `awkit install` now behaves as active-platform-first.
- `awkit install --all` is the explicit opt-in path for regenerating every supported platform.
- Updated [README.md](/Users/trungkientn/Dev/NodeJS/main-awf/README.md) to document this behavior.

## Repo Cleanliness Work Done In This Session

- Restored generated files back to `HEAD` after earlier multi-platform install noise:
  - [CLAUDE.md](/Users/trungkientn/Dev/NodeJS/main-awf/CLAUDE.md)
  - `.clinerules/skills/*.md` generated files
- Re-ran `node bin/awk.js install` after the default change.
- Verified that the default install targeted only Antigravity and did not re-dirty `CLAUDE.md` or `.clinerules/*`.

## Verification

Commands run:

```bash
node --check bin/awk.js
git diff --check -- .gitignore README.md bin/awk.js bin/claude-generators.js bin/cline-generators.js bin/codex-generators.js core/orchestrator.md skill-packs/neural-memory/pack.json skill-packs/superpowers/skills/single-flow-task-execution/SKILL.md skill-packs/superpowers/skills/writing-skills/SKILL.md skill-packs/superpowers/skills/writing-skills/examples/cso-optimization.md skill-packs/superpowers/skills/writing-skills/examples/tdd-for-skills.md skills/CATALOG.md skills/orchestrator/SKILL.md skills/writing-skills/SKILL.md core/skill-runtime-manifest.json skill-packs/creator-studio/pack.json skill-packs/creator-studio/README.md skills/writing-skills/examples/anti-rationalization.md skills/writing-skills/examples/cso-optimization.md skills/writing-skills/examples/tdd-for-skills.md
node bin/awk.js install
node bin/awk.js status
git status --short
```

Observed results:

- `node --check bin/awk.js`: passed
- `git diff --check`: passed
- `node bin/awk.js install`: defaulted to `Antigravity (Gemini Code Assist)` and completed with `26 active skills`
- `node bin/awk.js status`: `Skills: 26 skills`, `Perfect sync`, `Profile: core`, `Optional packs: none`
- `git status --short`: no regenerated `CLAUDE.md` or `.clinerules/*` changes after the final install verification

## Files Intentionally Left Untouched

These were already dirty or unrelated to the skill-runtime/install cleanup and were not reverted:

- [package.json](/Users/trungkientn/Dev/NodeJS/main-awf/package.json)
- [neural-memory-ref](/Users/trungkientn/Dev/NodeJS/main-awf/neural-memory-ref)
- [skills/short-maker/scripts/google-flow-cli](/Users/trungkientn/Dev/NodeJS/main-awf/skills/short-maker/scripts/google-flow-cli)

## Trade-off

This repo now favors source-of-truth cleanliness over constantly regenerating tracked Cline/Claude artifacts. That keeps normal `awkit install` lightweight and avoids noisy diffs, but it also means cross-platform generated copies are only refreshed when explicitly requested with `awkit install --all` or a platform-specific install target.
