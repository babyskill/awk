# Skill Trigger Index

> ⚠️ TRƯỚC mọi side-effect, scan bảng này → load skill tương ứng TRƯỚC khi act.
> Check THEN act — never act THEN check.

| Skill | Trigger | Path | Pri |
|:---|:---|:---|:---|
| orchestrator | Mọi request (routing) | orchestrator/SKILL.md | 🔴 |
| symphony-enforcer | Task create/update/complete, progress report | symphony-enforcer/SKILL.md | 🔴 |
| symphony-orchestrator | Session start, server check | symphony-orchestrator/SKILL.md | 🔴 |
| awf-session-restore | Session start, init chain | awf-session-restore/SKILL.md | 🔴 |
| nm-memory-sync | Session start/end, debug, errors | nm-memory-sync/SKILL.md | 🟡 |
| verification-gate | Task completion, commit, deploy, success claims | verification-gate/SKILL.md | 🟡 |
| code-review | Task completion, before merge | code-review/SKILL.md | 🟡 |
| spec-gate | Gate 2 architecture design | spec-gate/SKILL.md | 🟡 |
| brainstorm-agent | `/brainstorm`, ý tưởng, ideation | brainstorm-agent/SKILL.md | 🟢 |
| skill-creator | `/create-agent-skill`, tạo/sửa skill | skill-creator/SKILL.md | 🟢 |
| gitnexus-intelligence | Refactoring, impact analysis, pre-commit | gitnexus-intelligence/SKILL.md | 🟢 |
| ship-to-code | Code porting, migration, language translation | ship-to-code/SKILL.md | 🟢 |
| visual-design-gate | Gate 2.5 UI/UX design sync | visual-design-gate/SKILL.md | 🟢 |
| module-spec-writer | Gate 1.5 COMPLEX + >3 modules | module-spec-writer/SKILL.md | 🟢 |

## File Guards

| File pattern | PHẢI đọc lại | Lý do |
|:---|:---|:---|
| `symphony/**/*.json` | `symphony-enforcer/SKILL.md` | Task integrity |
| `.project-identity` | `orchestrator/SKILL.md` | Project config |
| `**/SKILL.md` | `skill-creator/SKILL.md` | Skill format |
| `GEMINI.md` | N/A (self-referencing) | Core rules |
