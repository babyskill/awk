---
description: ➡️ Không biết làm gì tiếp? (v5.0 - Symphony + Brain)
---

# WORKFLOW: /next - The Smart Compass (Symphony + Brain Navigator)

> **Mục tiêu:** Phân tích context từ Symphony (Tasks) và Brain (Plans/Knowledge) để gợi ý bước tiếp theo CHÍNH XÁC.

---

## Giai đoạn 1: Multi-Source Context Check (Tự động)

### 1.1. Priority 1: Check Symphony (Task Tracker)
```
symphony_available_tasks(filter="my")
```

**Case A: Có task đang làm dở**
```
🎵 **Symphony Context:**
Task #123: "Implement Login API" (in_progress)
└─ Started: 2 hours ago
└─ Blocker: None

➡️ **Bước tiếp theo:**
1️⃣ Tiếp tục task này? `/code` (AI sẽ tự load context)
2️⃣ Xem chi tiết task? `symphony_workspace_status(task_id)`
3️⃣ Chuyển sang task khác? `symphony_available_tasks(filter="ready")`
```

**Case B: Không có task in_progress**
```
symphony_available_tasks(filter="ready")
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
- Tasks trong phase (so sánh với Symphony)

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
   → Sẽ tự động tạo tasks trong Symphony
2️⃣ Brainstorm ý tưởng: `/brainstorm`
```

### 2.2. Scenario: Có Plan nhưng chưa có Task
```
🧭 **Tình trạng:** Có plan tại `plans/260130-login/` nhưng chưa sync Symphony.

➡️ **Bước tiếp theo:**
1️⃣ Sync plan sang Symphony? (Em sẽ tạo tasks tự động)
2️⃣ Bắt đầu code luôn? `/code phase-01`
```

### 2.3. Scenario: Có Task Ready (Open)
```
🧭 **Tình trạng:** Có 3 tasks sẵn sàng làm:

🎵 **Symphony Tasks:**
#101 Setup Database Schema (P1 - High)
#102 Create User Model (P2 - Medium)
#103 Write API Tests (P3 - Low)

➡️ **Bước tiếp theo:**
1️⃣ Làm task #101? `/code` (AI sẽ tự chọn P1)
2️⃣ Chọn task khác? Gõ số task (vd: "102")
```

### 2.4. Scenario: Task In-Progress (Đang làm dở)
```
🧭 **Tình trạng:** Đang làm task #123 "Implement Login API"

📊 **Progress:**
- Brain: Phase 02 - Backend (50%)
- Symphony: Task #123 (in_progress, 2h ago)
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
2️⃣ Bỏ task (không làm nữa)? `symphony_abandon_task(task_id, reason)`
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
[Context từ Symphony + Brain + Git]

🎵 **SYMPHONY STATUS:**
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

### Symphony Unavailable
```
if symphony_command_fails:
    → Fallback to Brain only
    → Warning: "Symphony không khả dụng. Dùng context từ Brain."
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
