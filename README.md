# AWKit — Antigravity Workflow Kit v1.0

> **v1.0.0** · Single Source of Truth · Beads-First · Ambient Memory

AWKit là framework điều phối AI agent chuyên nghiệp. Đây là **nơi duy nhất** chứa toàn bộ workflows, skills, GEMINI.md và cấu hình — không còn phân tán giữa nhiều repo.

---

## 🚀 Quick Start

### Cài đặt nhanh qua NPM (Khuyên dùng)
```bash
npm install -g @leejungkiin/awkit
awkit install
awkit doctor
```


## 📦 Commands

| Command | Description |
|---------|-------------|
| `awkit install` | Deploy AWKit vào `~/.gemini/antigravity/` |
| `awkit update` | Update lên version mới nhất |
| `awkit sync` | Full sync: harvest + install (one shot) |
| `awkit status` | So sánh repo vs installed (diff view) |
| `awkit harvest` | Pull từ `~/.gemini/antigravity/` về repo |
| `awkit doctor` | Kiểm tra sức khoẻ installation |
| `awkit enable-pack <name>` | Kích hoạt skill pack |
| `awkit disable-pack <name>` | Vô hiệu skill pack |
| `awkit list-packs` | Xem danh sách skill packs |
| `awkit version` | Show version |

### Typical Workflow

```bash
# 1. Check what's out of sync
awkit status

# 2a. You edited in ~/.gemini/ → pull back to repo
awkit harvest

# 2b. You edited in repo → deploy to ~/.gemini/
awkit install

# 2c. Both directions (full round-trip)
awkit sync

# 3. Commit the snapshot
git add -A && git commit -m "chore: sync AWKit v7.0"
```



```
main-awf/ (AWKit v7.0 — Source of Truth)
├── bin/
│   ├── awk.js                  ← CLI entry point
│   └── awf.js                  ← (legacy, kept for reference)
├── core/
│   ├── GEMINI.md               ← Master AI config (v6.4+)
│   ├── AGENTS.md               ← Agent rules
│   └── orchestrator.md         ← Orchestrator skill
├── workflows/                  ← 75+ workflows, categorized
│   ├── lifecycle/              plan, code, debug, deploy...
│   ├── context/                recap, next, save-brain...
│   ├── quality/                audit, performance, ux...
│   ├── ui/                     visualize, design-to-ui...
│   ├── ads/                    ads-audit, optimize...
│   ├── mobile/                 maestro, turbo-build...
│   ├── expert/                 planExpert, codeExpert...
│   ├── git/                    commit, hotfix, rollback...
│   ├── roles/                  tech-lead, pm, qa...
│   ├── meta/                   customize, file-protection...
│   └── _uncategorized/         misc files
├── skills/                     ← 10+ skills (auto-activate)
│   ├── orchestrator/
│   ├── memory-sync/
│   ├── brainstorm-agent/
│   ├── beads-manager/
│   ├── awf-session-restore/
│   └── ...
├── skill-packs/                ← Optional add-ons
│   └── neural-memory/          (Phase 3 - coming soon)
├── schemas/                    ← JSON schemas
├── templates/                  ← Project templates
├── scripts/
│   └── harvest.js              ← Migration: pull from ~/.gemini/
├── VERSION                     → 1.0.0
└── package.json                (@leejungkiin/awkit)
```

## 🌾 Harvest (Migration)

Nếu bạn chỉnh sửa trực tiếp trong `~/.gemini/antigravity/` và muốn sync về repo:

```bash
# Xem trước (không thay đổi file)
node scripts/harvest.js --dry-run

# Thực thi harvest
node scripts/harvest.js
```

## 🔄 Workflow

```
main-awf/ (edit here)
    │
    ▼  awkit install
~/.gemini/antigravity/ (runtime)
    │
    ▼  AI reads from here
Gemini / Claude / Any AI
```

## 📦 Skill Packs

```bash
awkit list-packs
awkit enable-pack neural-memory
awkit enable-pack ios-dev
```

## 🏗️ Versioning

| Version | Name | Notes |
|---------|------|-------|
| 4.x | AWF v4 | Shell-based, `awf-` prefix skills |
| 5.x | Antigravity v5 | Node.js, Beads integration |
| 6.x | AWF v6 | main-awf, multiple sources |
| **1.0** | **AWKit v1.0** | **Single source of truth, this repo** |

---

*AWKit v1.0 — Antigravity Workflow Kit · Created by Kien AI*
