# Changelog

All notable changes to AWF will be documented here.

## [6.0.0] - 2026-02-22

### Added
- 🏗️ Unified architecture merging AWF v4 and Antigravity v5
- 📦 npm package distribution with CLI (`awf` command)
- 📂 Categorized workflow organization (lifecycle, context, quality, ui, ads, git, expert)
- 🔌 Skill Packs system (opt-in domain-specific knowledge)
- 🏥 `awf doctor` health check command
- 🔄 Smart sync — flattens categories on install, never overwrites custom files
- 🗃️ Backup system — disabling packs moves to backup, not delete

### Changed
- Merged GEMINI.md rules (best of v4 detail + v5 Beads/MCP)
- Reduced core skills from 282 to 7 curated essentials
- Standardized workflow format with frontmatter + phases

### Removed
- curl/wget install scripts (replaced by npm)
- Persona system (Tuấn/Hà/Mai/Long) — simplified to single assistant
- Duplicate workflow files (save-brain.md vs save_brain.md unified)

### Migration
- See `docs/migration-v5-to-v6.md`
