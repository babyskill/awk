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
- **Mô tả Card (Description)** BẮT BUỘC phải được update chứa cái nhìn tổng thể về dự án (Mục tiêu, Tech Stack, Tình trạng chung) để Quản lý dễ nắm bắt.
- **Trello (PM View) vs Kiro (Dev View):** Trello là màn hình dành cho Quản lý (PM, QC), còn `.kiro/specs/tasks.md` là nơi để AI/Dev làm việc. Hai khái niệm này hoàn toàn khác nhau.
- Tiến độ = Checklist Items trên card dự án. CHỈ ghi lại các task ở mức High-level / Module / Tính năng lớn. KHÔNG BAO GIỜ bứng nguyên các task kỹ thuật chi tiết (VD: "Tạo file `BloodPressureViewModel.kt`") lên Trello.
- **Cách đồng bộ task lên Trello hợp lý:** AI PHẢI tổng hợp, chuyển đổi các task chi tiết từ `.kiro/specs/tasks.md` thành các ĐẦU VIỆC NGHIỆP VỤ (Business Features) để PM hiểu được (VD từ hàng chục file code -> chuyển thành checklist item: "Hoàn thiện màn hình Huyết áp" hoặc "Tính năng tích hợp Camera AI").
- BẮT BUỘC ĐỒNG BỘ TOÀN BỘ DANH SÁCH TASK TỔNG HỢP: Checklist của dự án cần liệt kê TOÀN BỘ các "Features" (cả những cái sẽ làm và đã làm xong) để PM nắm được tổng quan tiến độ đang ở đâu, thay vì chỉ tạo mỗi cái tên đề mục Module.
- ⛔ TUYỆT ĐỐI CẤM sử dụng script để đồng bộ (bulk-sync) hàng loạt từng dòng text từ `tasks.md` sang Trello. Nếu vi phạm sẽ gây rác hệ thống (spam Trello board).
- Card KHÔNG di chuyển giữa lists (list = team member, cố định).
- Comment ở milestone quan trọng PHẢI bao gồm các quyết định kỹ thuật cốt lõi hoặc nguyên nhân gốc rễ. KHÔNG spam mỗi dòng code thành 1 comment.
```

---

## 🔐 Auth & Config

Credentials được lưu dưới dạng **environment variables** (`TRELLO_KEY`, `TRELLO_TOKEN`) trong shell profile (`~/.zshrc` hoặc `~/.bashrc`). Cấu hình dự án (Board/List/Card) lưu tại `.trello-config.json` ở root mỗi dự án.

### 1. Global Credentials (Environment Variables)

User setup lần đầu qua **interactive wizard** khi chạy `awkit init`:
- CLI tự hỏi API Key → tạo link authorize token → hỏi Token → lưu vào `~/.zshrc`.
- Nếu user đã setup rồi, CLI tự skip bước này.

### 2. Local Project Config (`.trello-config.json` tại root dự án)
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

### 🔄 Credential Auto-Recovery (BẮT BUỘC cho AI)

Khi `awkit trello` báo **"Trello credentials not found"**, AI PHẢI thực hiện:

```text
Lần 1: chạy `source ~/.zshrc` → retry lệnh awkit trello
Lần 2: chạy `source ~/.zshrc` → retry lệnh awkit trello
Lần 3 (vẫn lỗi): báo user "Trello chưa được cấu hình. Vui lòng chạy awkit init để setup lại."
```

> ⚠️ KHÔNG được tự tạo script, tự inject biến, hay tự sửa file `.zshrc`. CHỈ dùng `source` và `awkit init`.

### Tự Động Hóa Qua `awkit trello` (BẮT BUỘC)

AI không cần tự inject ENV hay tìm kiếm cấu hình. Công cụ lệnh `awkit trello` v1.3.0+ sẽ TỰ ĐỘNG đọc từ env vars và `.trello-config.json`. MỌI thao tác Trello phải đi qua `awkit trello`.
---

## 📚 Command Reference

### AWKit Trello CLI (Native, Zero Config Needed in Bash)

Công cụ `awkit` đã cung cấp sẵn các lệnh native quản lý Trello. Phải ƯU TIÊN SỬ DỤNG.

| Action | Command |
|--------|---------|
| Cập nhật mô tả (desc) | `awkit trello desc "<text>"` |
| Comment milestone | `awkit trello comment "<text>"` |
| Thêm checklist item | `awkit trello item "<name>"` |
| Check ✅ hoàn thành | `awkit trello complete "<name>"` |
| Báo Blocked / Lỗi | `awkit trello block "<reason>"` |
| Tạo checklist mới | `awkit trello checklist "<name>"` |

> 💡 Nếu gặp board/list/card "not found", cấu hình có thể sai, báo user kiểm tra lại `.trello-config.json`.

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

### TP1: 🚀 Start Task / Start Project (Description + Checklist)

**Khi nào:** AI bắt đầu project mới hoặc làm task lớn mới (claim Symphony task).

**Action:**
```bash
# Update Card Description với thông tin cực kỳ rõ ràng cho Quản lý (PM) dự án
awkit trello desc "**Trạng thái:** Đang phát triển. **Công nghệ:** Kotlin, Jetpack Compose, Room. **Tiến độ hiện tại:** ... (Tóm tắt sơ lược)"

# 1. Tạo checklist (nếu cần, ví dụ Sprint)
awkit trello checklist "Sprint 2026-03"

# 2. Thêm item mới vào checklist
awkit trello item "Feature: Login Flow"

# 3. Comment báo bắt đầu
awkit trello comment "🤖 AI bắt đầu: Login Flow | Symphony: #sym-XXX"
```

---

### TP2: 📈 Report Progress (Comment Milestone)

**Khi nào:** AI đạt milestone quan trọng (40%, 60%, 80%) hoặc hoàn thành cụm tính năng.

**Action:** Cung cấp thông tin CHUYÊN MÔN nhưng RÕ RÀNG cho PM:
```bash
awkit trello comment "⏳ Progress: Login Flow (60%) — UI hoàn thiện. QUYẾT ĐỊNH KỸ THUẬT: Đã chọn SQLite/Room thay vì Firebase để đảm bảo Offline-first theo spec."
```

---

### TP3: 🛑 Blocked

**Khi nào:** Task bị chặn, cần human input.

```bash
# Label + Comment
awkit trello block "API 500 on /auth/login. Cần Backend check."
```

---

### TP4: ✅ Task Done (Đánh dấu Item Complete)

**Khi nào:** Task hoàn thành, verification pass.

```bash
# 1. Đánh dấu checklist item ✅
awkit trello complete "Feature: Login Flow"

# 2. Comment kết quả
awkit trello comment "✅ DONE: Login Flow | Commit: #$(git rev-parse --short HEAD)"
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

1. **Checklist naming**: Theo phase/module lớn (VD: "Module: fw-01-foundation", "Sprint 2026-03").
2. **Item naming**: Mô tả tính năng lớn (VD: "Login Flow", "Firebase Integration"). KHÔNG ĐƯA CÁC ĐẦU MỤC CODE LEVEL VÀO ĐÂY (VD: "Thêm nút bấm", "Sửa CSS", v.v.).
3. **Minimizing noise**: Comment chỉ ở milestones, KHÔNG spam mỗi dòng code. Cấm bulk-sync checklist item từ `tasks.md`.
4. **Graceful degradation**: CLI/API lỗi → log warning, KHÔNG block code flow.
5. **Dùng lệnh Native**: Luôn luôn gọi `awkit trello <lệnh>` thay vì `trello-cli` thủ công.
6. **Card KHÔNG di chuyển**: Card nằm cố định trong list team member. KHÔNG move card.

---

## Edge Cases

| Tình huống | Xử lý |
|-----------|--------|
| `.trello-config.json` không tồn tại | ⛔ Bỏ qua Trello sync, log cảnh báo, tiếp tục code |
| **Credentials not found** | `source ~/.zshrc` → retry (max 2 lần). Vẫn lỗi → báo user chạy `awkit init` |
| Card not found | Chạy `sync`, retry. Nếu vẫn lỗi → báo user |
| Checklist chưa có | Tạo checklist mới bằng `awkit trello checklist` |
| Item trùng tên | Dùng `card:checklists` kiểm tra trước khi thêm |
| Rate limit / API error | Log warning, tiếp tục code, KHÔNG block flow. CLI tự retry 429. |
| Token hết hạn | Báo user chạy `awkit init` để setup lại credential mới |
| Dự án chưa có card trên Trello | Báo user tạo card trên board, cập nhật `.trello-config.json` |

---

## Learnings

- Board "Appdexter - Code Magic": Lists = team members, Cards = projects
- Tool native CLI `awkit trello` cho phép update thông tin dự án thẳng từ CLI mà không cần inject variables lằng nhằng.
- KHÔNG sinh script file mồ côi `trello_sync_kiro.py` — phải chạy trực tiếp qua `awkit trello`
