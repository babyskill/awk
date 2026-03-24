# AWKit — Antigravity Workflow Kit v1

> **v1.1.9** · Single Source of Truth · Symphony-First · Ambient Memory

AWKit là framework điều phối AI agent chuyên nghiệp. Đây là **nơi duy nhất** chứa toàn bộ workflows, skills, GEMINI.md và cấu hình — không còn phân tán giữa nhiều repo.

---

## 🧠 Gstack Core Principles

AWKit (Antigravity v12+) thực thi 8 nguyên tắc lõi (Gstack-inspired) nhằm đảm bảo AI hoạt động an toàn và hiệu quả:

1. **Anti-sycophancy:** AI phải phản biện các hướng tiếp cận có rủi ro, không đồng ý mù quáng khi có red flags.
2. **Search Before Building (3-layer):** Tìm kiếm NeuralMemory/codebase → Tìm standard libraries/SDKs → Chỉ code mới nếu 2 bước trên thất bại.
3. **Completion Status Protocol:** 4 trạng thái rõ ràng: `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`.
4. **6 Decision Principles:** Complete > Shortcuts, Evidence > Assumptions, Standard > Custom, Explicit > Implicit, Test > Trust, Small > Big.
5. **3-Strike Escalation:** Sau 3 lần thử fix bug thất bại → STOP, báo cáo context và chờ user quyết định.
6. **Scope Freeze:** Khi debugging: KHÔNG sửa code không liên quan, KHÔNG refactor. Chỉ tập trung root cause.
7. **Boil-the-Lake Checklist:** Checklist trước khi báo DONE: error handling, edge cases, logging, cleanup, input validation...
8. **Safety Guardrails:** Chặn auto-run cho các lệnh nguy hiểm (`rm -rf`, `git push --force`, deploy production). Bắt buộc double-confirm.

---

## 🚀 Quick Start

### Cài đặt (3 bước)

```bash
# 1. AWKit Core (CLI + workflows + skills)
npm install -g @leejungkiin/awkit
awkit install

# 2. Symphony (Task Management & Multi-Agent Orchestration)
npm install -g @leejungkiin/awkit-symphony

# 3. NeuralMemory (AI Memory Engine — requires Python >= 3.11)
pip install neural-memory
nmem init

# Verify
awkit doctor
symphony --version
nmem --version
```

> 💡 **Bước 2 & 3 được tự động cài khi chạy `awkit install`** nếu môi trường đầy đủ.
> AI agent cũng tự detect và cài các dependency thiếu khi init session.


## 📦 Commands

| Command | Description |
|---------|-------------|
| `awkit install` | Deploy AWKit vào `~/.gemini/antigravity/` |
| `awkit update` | Update lên version mới nhất |
| `awkit init` | Khởi tạo project mới (tạo .project-identity, CODEBASE.md, etc.) |
| `awkit sync` | Full sync: harvest + install (one shot) |
| `awkit status` | So sánh repo vs installed (diff view) |
| `awkit harvest` | Pull từ `~/.gemini/antigravity/` về repo |
| `awkit doctor` | Kiểm tra sức khoẻ installation |
| `awkit enable-pack <name>` | Kích hoạt skill pack |
| `awkit disable-pack <name>` | Vô hiệu skill pack |
| `awkit list-packs` | Xem danh sách skill packs |
| `awkit tg setup` | Cài đặt Telegram Bot Token, Chat ID & Topic |
| `awkit tg send <msg>` | Gửi tin nhắn qua Telegram |
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
git add -A && git commit -m "chore: sync AWKit v1.1.3"
```



```
main-awf/ (AWKit v1.1.x — Source of Truth)
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
│   ├── symphony-orchestrator/
│   ├── awf-session-restore/
│   └── ...
├── skill-packs/                ← Optional add-ons
│   └── neural-memory/          (Phase 3 - coming soon)
├── schemas/                    ← JSON schemas
├── templates/                  ← Project templates
├── scripts/
│   └── harvest.js              ← Migration: pull from ~/.gemini/
├── VERSION                     → 1.1.9
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

## 📨 Telegram Integration

Bạn có thể cấu hình AWKit gửi thông báo tự động (deploy xong, test pass...) qua Telegram:

```bash
# 1. Setup Bot Token, Chat ID và Message Thread ID (Topic)
awkit tg setup

# 2. Gửi thử tin nhắn kiểm tra
awkit tg send "Hello from AWKit!"

# 3. Gửi đến chat/topic cụ thể
awkit tg send "Hello" --chat -100123456789 --topic 1234
```

## 🧠 GitNexus Code Intelligence

AWKit (từ bản cập nhật tích hợp mới) sử dụng **GitNexus** làm engine cung cấp Code Intelligence & Knowledge Graph cho AI Agent. Sau khi chạy `npm install` AWKit, GitNexus sẽ sẵn sàng để dùng ngay.

Để kích hoạt GitNexus trên bất kỳ project nào anh/chị đang code:

```bash
# 1. Quét toàn bộ project để tạo knowledge graph (chỉ cần chạy lần đầu hoặc khi cấu trúc code thay đổi lớn)
npx @leejungkiin/gitnexus analyze

# 2. Setup MCP servers và skills tự động cho Antigravity và các editors khác:
npx @leejungkiin/gitnexus setup
```

AI agent của hệ thống cũng tự động gọi qua cổng GitNexus bằng MCP Tools để tự phân tích rủi ro trước khi commit!

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
| 5.x | Antigravity v5 | Node.js, Symphony integration |
| 6.x | AWF v6 | main-awf, multiple sources |
| **1.1.x** | **AWKit v1.1.9** | **Single source of truth, Native CLI, Telegram Integration** |

---

*AWKit v1.1.x — Antigravity Workflow Kit · Created by Kien AI*
