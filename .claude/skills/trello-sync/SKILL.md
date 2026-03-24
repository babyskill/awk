---
name: trello-sync
description: |
  Hệ thống đồng bộ tiến độ dự án lên Trello sử dụng Trello CLI (v1.5+) + REST API.
  Mỗi dự án = 1 Trello Card. Tiến độ được theo dõi qua Checklists và Comments.
  AI tự động thêm/đánh dấu checklist items khi hoàn thành task.
metadata:
  stage: core
  version: "3.0"
  tags: [trello, sync, project-management, tracking, agile]
agent: Trello Sync Agent
allowed-tools:
  - run_command
trigger: always
invocation-type: auto
priority: 2
---

# Trello Sync v3.0 — Project-Per-Card Protocol

> **Purpose:** Tự động đồng bộ tiến độ dự án lên Trello card tương ứng, giúp team (PM, QC, Dev) theo dõi realtime.
> **Model:** 1 Card = 1 Dự án. Checklist Items = tasks/features. Comments = milestones.
> **Tools:** `trello-cli v1.5` (CLI) + Trello REST API (curl) cho checklist items.

---

## ⚠️ Core Rules

```text
KHÔNG CÓ NGOẠI LỆ:
- 1 Dự án = 1 Trello Card (KHÔNG tạo card mới cho mỗi task).
- Tiến độ = Checklist Items trên card dự án.
- Card KHÔNG di chuyển giữa lists (list = team member, cố định).
- Comment chỉ ở milestone quan trọng, KHÔNG spam.
- KHÔNG ĐƯỢC sinh script file bắt user chạy manual.
```

---

## 🔐 Auth & Config

Bảo mật: API Key và Token được lưu tại Global, cấu hình dự án (Board/List/Card) lưu tại Local.

### 1. Global Credentials (đặt tại `~/.gemini/antigravity/credentials/trello.json`)
```json
{
  "api_key": "YOUR_TRELLO_API_KEY",
  "api_token": "YOUR_TRELLO_API_TOKEN"
}
```

### 2. Local Project Config (đặt file `.trello-config.json` tại root mỗi dự án)
```json
{
  "board": "Appdexter - Code Magic",
  "list": "Kiên",
  "card": "Tên Card Dự Án"
}
```

| Field | Mô tả |
|-------|--------|
| `board` | Tên board (TÊN, không dùng ID) |
| `list` | Tên list chứa card (= team member đang phụ trách) |
| `card` | Tên card dự án (phải khớp chính xác trên Trello) |

### Keychain Bypass & Auth Injection (BẮT BUỘC)

AI là background process, macOS từ chối Keychain access. **Giải pháp:** tự động đọc auth từ Global config và inject ENV trước MỌI lệnh.

```bash
export TRELLO_KEY=$(jq -r .api_key ~/.gemini/antigravity/credentials/trello.json)
export TRELLO_TOKEN=$(jq -r .api_token ~/.gemini/antigravity/credentials/trello.json)
# Sau đó gọi CLI hoặc curl
```

⛔ KHÔNG BAO GIỜ gọi trello-cli/curl mà không export ENV theo cách trên.

---

## 📚 Command Reference

### Trello CLI (v1.5.0 — subcommand dấu `:`)

| Action | Command |
|--------|---------|
| List checklists | `npx --yes trello-cli card:checklists --board "<board>" --list "<list>" --card "<card>"` |
| Tạo checklist mới | `npx --yes trello-cli card:checklist --board "<board>" --list "<list>" --card "<card>" -n "<checklist_name>"` |
| Đánh dấu item ✅ | `npx --yes trello-cli card:check-item --board "<board>" --list "<list>" --card "<card>" --item "<item_name>" --state complete` |
| Bỏ đánh dấu item | `npx --yes trello-cli card:check-item --board "<board>" --list "<list>" --card "<card>" --item "<item_name>" --state incomplete` |
| Comment card | `npx --yes trello-cli card:comment --board "<board>" --list "<list>" --card "<card>" --text "<nội dung>"` |
| Gắn label | `npx --yes trello-cli card:label --board "<board>" --list "<list>" --card "<card>" --label "<label>"` |
| Sync cache | `npx --yes trello-cli sync` |

### REST API (curl — cho thêm checklist items)

CLI v1.5 KHÔNG hỗ trợ thêm item vào checklist. Dùng curl:

**Lấy checklist ID:**
```bash
curl -s "https://api.trello.com/1/cards/<card_id>/checklists?key=$TRELLO_KEY&token=$TRELLO_TOKEN"
```

**Thêm item mới vào checklist:**
```bash
curl -s -X POST "https://api.trello.com/1/checklists/<checklist_id>/checkItems?key=$TRELLO_KEY&token=$TRELLO_TOKEN" \
  -d "name=<item_name>&checked=false"
```

**Lấy card ID từ tên:**
```bash
# Dùng CLI trước để lấy card ID
npx --yes trello-cli card:show --board "<board>" --list "<list>" --card "<card>" --format json
```

> 💡 Nếu gặp board/list/card "not found" → chạy `npx --yes trello-cli sync` trước.

---

## 🔄 Lifecycle & Trigger Points

### Board Structure (Context)

```
Board: Appdexter - Code Magic
├── App cần làm ☘️     ← Backlog (ý tưởng)
├── Kiên               ← Cards = projects assigned to Kiên
├── Huy lớn            ← Cards = projects assigned to Huy lớn
├── Doing              ← Cards actively being worked on
├── Done               ← Completed cards
└── ...
```

Mỗi Card chứa:
- **Description**: Mô tả dự án, link repo
- **Checklists**: Các phase (UI, Code Logic, Infrastructure...)
- **Checklist Items**: Tasks cụ thể trong phase đó

---

### TP1: 🚀 Start Task (Thêm Checklist Item)

**Khi nào:** AI bắt đầu làm task mới (claim Symphony task hoặc user request feature).

**Action:**
```bash
# 1. Đọc config từ Global & Local
export TRELLO_KEY=$(jq -r .api_key ~/.gemini/antigravity/credentials/trello.json)
export TRELLO_TOKEN=$(jq -r .api_token ~/.gemini/antigravity/credentials/trello.json)
BOARD="Appdexter - Code Magic"
LIST="Kiên"
CARD="Tên Card Dự Án"

# 2. Xem checklists hiện tại
npx --yes trello-cli card:checklists --board "$BOARD" --list "$LIST" --card "$CARD"

# 3. Nếu checklist phù hợp chưa có → tạo mới
npx --yes trello-cli card:checklist --board "$BOARD" --list "$LIST" --card "$CARD" -n "Sprint 2026-03"

# 4. Thêm item mới vào checklist (REST API)
# Lấy checklist ID từ step 2
curl -s -X POST "https://api.trello.com/1/checklists/<checklist_id>/checkItems?key=$TRELLO_KEY&token=$TRELLO_TOKEN" \
  -d "name=Feature: Login Flow&checked=false"

# 5. Comment báo bắt đầu
npx --yes trello-cli card:comment --board "$BOARD" --list "$LIST" --card "$CARD" \
  --text "🤖 AI bắt đầu: Login Flow | Symphony: #sym-XXX"
```

---

### TP2: 📈 Report Progress (Comment Milestone)

**Khi nào:** AI đạt milestone quan trọng (40%, 60%, 80%).

```bash
npx --yes trello-cli card:comment --board "$BOARD" --list "$LIST" --card "$CARD" \
  --text "⏳ Progress: Login Flow (60%) — UI done, integrating Firebase Auth."
```

---

### TP3: 🛑 Blocked

**Khi nào:** Task bị chặn, cần human input.

```bash
# Label + Comment
npx --yes trello-cli card:label --board "$BOARD" --list "$LIST" --card "$CARD" --label "Blocked"
npx --yes trello-cli card:comment --board "$BOARD" --list "$LIST" --card "$CARD" \
  --text "⚠️ BLOCKED: API 500 on /auth/login. Cần Backend check."
```

---

### TP4: ✅ Task Done (Đánh dấu Item Complete)

**Khi nào:** Task hoàn thành, verification pass.

```bash
# 1. Đánh dấu checklist item ✅
npx --yes trello-cli card:check-item --board "$BOARD" --list "$LIST" --card "$CARD" \
  --item "Feature: Login Flow" --state complete

# 2. Comment kết quả
npx --yes trello-cli card:comment --board "$BOARD" --list "$LIST" --card "$CARD" \
  --text "✅ DONE: Login Flow | Commit: #$(git rev-parse --short HEAD)"
```

---

## 🔗 Symphony Integration

| Symphony Event | Trello Action |
|----------------|---------------|
| `symphony_claim_task` | Thêm checklist item (incomplete) + Comment start |
| `symphony_report_progress` | Comment milestone |
| Task BLOCKED | Label "Blocked" + Comment |
| `symphony_complete_task` | Mark item ✅ complete + Comment result |

Trong comment, **PHẢI** ghi Symphony Task ID: `Symphony: #sym-XXX`

---

## 🎯 Best Practices

1. **Checklist naming**: Theo phase/sprint (VD: "UI", "Code Logic", "Sprint 2026-03").
2. **Item naming**: Mô tả ngắn gọn feature (VD: "Login Flow", "Firebase Connect").
3. **Minimizing noise**: Comment chỉ ở milestones, KHÔNG spam mỗi dòng code.
4. **Graceful degradation**: CLI/API lỗi → log warning, KHÔNG block code flow.
5. **Always export ENV**: Mọi lệnh PHẢI có `export TRELLO_KEY` + `export TRELLO_TOKEN`.
6. **Sync cache**: Gặp "not found" → `npx --yes trello-cli sync` trước.
7. **Card KHÔNG di chuyển**: Card nằm cố định trong list team member. KHÔNG move card.

---

## Edge Cases

| Tình huống | Xử lý |
|-----------|--------|
| `.trello-config.json` không tồn tại | ⛔ Bỏ qua Trello sync, log cảnh báo, tiếp tục code |
| Card not found | Chạy `sync`, retry. Nếu vẫn lỗi → báo user |
| Checklist chưa có | Tạo checklist mới bằng `card:checklist` |
| Item trùng tên | Dùng `card:checklists` kiểm tra trước khi thêm |
| Rate limit / API error | Log warning, tiếp tục code, KHÔNG block flow |
| Token hết hạn | Báo user refresh trong `.trello-config.json` |
| Dự án chưa có card trên Trello | Báo user tạo card trên board, cập nhật config |

---

## Learnings

- Board "Appdexter - Code Magic": Lists = team members, Cards = projects
- `trello-cli v1.5` dùng subcommand dấu `:` (card:create), KHÔNG dấu cách
- Board/List/Card tham chiếu bằng TÊN, không phải ID
- macOS Keychain block background process → bypass bằng ENV variables
- CLI thiếu `add-check-item` → dùng REST API `POST /1/checklists/{id}/checkItems`
- `card:check-item --state complete|incomplete` để toggle trạng thái
- `card:checklists` hiển thị format `[x] Item` hoặc `[ ] Item` — dễ parse
- KHÔNG sinh script file — phải chạy trực tiếp qua `run_command`
