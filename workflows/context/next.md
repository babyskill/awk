---
description: ➡️ Không biết làm gì tiếp? (v5.0 - Beads + Brain)
---

# WORKFLOW: /next - The Smart Compass (Beads + Brain Navigator)

> **Mục tiêu:** Phân tích context từ Beads (Tasks) và Brain (Plans/Knowledge) để gợi ý bước tiếp theo CHÍNH XÁC.

---

## Giai đoạn 1: Multi-Source Context Check (Tự động)

### 1.1. Priority 1: Check Beads (Task Tracker)
```bash
bd list --status in_progress
```

**Case A: Có task đang làm dở**
```
📿 **Beads Context:**
Task #123: "Implement Login API" (in_progress)
└─ Started: 2 hours ago
└─ Blocker: None

➡️ **Bước tiếp theo:**
1️⃣ Tiếp tục task này? `/code` (AI sẽ tự load context)
2️⃣ Xem chi tiết task? `bd show 123`
3️⃣ Chuyển sang task khác? `bd list`
```

**Case B: Không có task in_progress**
```bash
bd list --status open
```
→ Hiển thị danh sách tasks đang chờ (ready to start).

### 1.2. Priority 2: Check Brain (Plans & Knowledge)
```
if exists("brain/active_plans.json"):
    → Đọc plan đang active
    → Parse progress từ plan.md
else:
    → Tìm folder plans/ mới nhất
```

**Từ Brain lấy được:**
- Feature đang làm
- Phase hiện tại
- Tasks trong phase (so sánh với Beads)

### 1.3. Priority 3: Check Git State (Fallback)
- `git status` → File nào đang thay đổi?
- `git log -1` → Commit gần nhất?

---

## Giai đoạn 2: Smart Recommendation Engine

### 2.1. Scenario: Fresh Start (Chưa có gì)
```
🧭 **Tình trạng:** Dự án mới, chưa có task nào.

➡️ **Bước tiếp theo:**
1️⃣ Lập kế hoạch: `/plan "Feature Name"`
   → Sẽ tự động tạo tasks trong Beads
2️⃣ Brainstorm ý tưởng: `/brainstorm`
```

### 2.2. Scenario: Có Plan nhưng chưa có Task
```
🧭 **Tình trạng:** Có plan tại `plans/260130-login/` nhưng chưa sync Beads.

➡️ **Bước tiếp theo:**
1️⃣ Sync plan sang Beads? (Em sẽ tạo tasks tự động)
2️⃣ Bắt đầu code luôn? `/code phase-01`
```

### 2.3. Scenario: Có Task Ready (Open)
```
🧭 **Tình trạng:** Có 3 tasks sẵn sàng làm:

📿 **Beads Tasks:**
#101 Setup Database Schema (P0)
#102 Create User Model (P1)
#103 Write API Tests (P2)

➡️ **Bước tiếp theo:**
1️⃣ Làm task #101? `/code` (AI sẽ tự chọn P0)
2️⃣ Chọn task khác? Gõ số task (vd: "102")
```

### 2.4. Scenario: Task In-Progress (Đang làm dở)
```
🧭 **Tình trạng:** Đang làm task #123 "Implement Login API"

📊 **Progress:**
- Brain: Phase 02 - Backend (50%)
- Beads: Task #123 (in_progress, 2h ago)
- Git: 3 files changed

➡️ **Bước tiếp theo:**
1️⃣ Tiếp tục code? `/code` (Resume context)
2️⃣ Gặp lỗi? `/debug`
3️⃣ Xong rồi? `/done "Completed Login API"`
```

### 2.5. Scenario: All Tasks Done (Hoàn thành phase)
```
🧭 **Tình trạng:** Phase 02 hoàn thành! (8/8 tasks ✅)

📊 **Plan Progress:**
████████████░░░░░░░░ 60% (3/5 phases)

➡️ **Bước tiếp theo:**
1️⃣ Bắt đầu Phase 03? `/code phase-03`
2️⃣ Deploy thử? `/deploy --staging`
3️⃣ Lưu kiến thức? `/save-brain`
```

---

## Giai đoạn 3: Contextual Alerts

### 3.1. Blocker Detection
```
⚠️ **Cảnh báo:** Task #123 bị block bởi task #120 (chưa xong).

➡️ **Gợi ý:**
1️⃣ Làm task #120 trước? `/code`
2️⃣ Làm task khác không bị block? (Hiển thị danh sách)
```

### 3.2. Stale Task Warning
```
⚠️ **Nhắc nhở:** Task #115 đang in_progress từ 3 ngày trước.

➡️ **Gợi ý:**
1️⃣ Tiếp tục task này? `/code`
2️⃣ Đóng task (không làm nữa)? `bd update 115 --status cancelled`
```

### 3.3. Knowledge Gap
```
💡 **Gợi ý:** Anh vừa fix bug quan trọng. Lưu lại kiến thức?

➡️ `/save-brain "How to fix N+1 query in Orders"`
```

---

## Output Format (Standard)

```markdown
🧭 **ĐANG Ở ĐÂU:**
[Context từ Beads + Brain + Git]

📿 **BEADS STATUS:**
- In Progress: X tasks
- Ready: Y tasks
- Blocked: Z tasks

🧠 **BRAIN STATUS:**
- Plan: [Name] (Phase X/Y)
- Last Save: [Time]

➡️ **LÀM GÌ TIẾP:**
[Gợi ý cụ thể với lệnh]

💡 **MẸO:**
[Contextual tips]
```

---

## 🛡️ Resilience Patterns

### Beads Unavailable
```
if bd_command_fails:
    → Fallback to Brain only
    → Warning: "Beads không khả dụng. Dùng context từ Brain."
```

### Brain Empty
```
if no_brain_context:
    → Fallback to Git analysis
    → Suggest: "/plan để tạo context mới"
```

### All Sources Fail
```
→ "Em chưa có đủ thông tin. Anh kể sơ đang làm gì nhé?"
→ Hoặc: "/recap để em quét lại dự án"
```
