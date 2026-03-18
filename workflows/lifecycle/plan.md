---
description: 📝 Thiết kế tính năng (Dual-Mode v5.0)
---

# WORKFLOW: /plan - The Logic Architect v3 (Dual-Mode + Symphony)

> **Mode A (Expert):** `/plan "Feature Name" --auto` -> Tạo plan chuẩn ngay lập tức.
> **Mode B (Guided):** `/plan` -> Dẫn dắt từng bước Socratic.

---

## 🅰️ Expert Mode (Direct Execution)

**Usage:**
```bash
/plan "E-commerce Cart" --auto
```

**Logic:**
1.  **Analyze Intent:** Extract feature name from args.
2.  **Generate Spec:** Create `docs/specs/ecommerce-cart_spec.md` with standard sections.
3.  **Generate Phases:** Create `plans/[timestamp]-ecommerce-cart/` with 4-6 standard phases.
4.  **Sync Symphony:** Auto-create tasks in Symphony for each phase.
5.  **Report:** "✅ Plan created at `plans/...`. 6 tasks synced to Symphony."

---

## 🅱️ Guided Mode (Interactive Wizard)

### Phase 1: Vibe Capture & Context
1.  **Understand Intent:** "Mô tả ý tưởng của bạn đi? (Nói tự nhiên thôi)"
2.  **Socratic Questions:** (Based on previous Logic Architect v2 logic)
    -   Auth? Files? Notifications? Payment?
    -   *New:* "Có cần tạo task trong Symphony luôn không?"

### Phase 2: Architecture & Flow
1.  **Visualize:** Vẽ sơ đồ Mermaid (Flowchart/Entity Relationship).
2.  **Confirm:** "Luồng đi như vậy đúng ý anh chưa?"
3.  **Menu:**
    ```markdown
    1️⃣ ✅ Đúng rồi, chốt plan!
    2️⃣ ✏️ Sửa lại luồng
    3️⃣ 🔙 Quay lại bước 1
    ```

### Phase 3: Plan Generation
1.  **Action:** Tạo folder structure và file markdown (như v2).
2.  **Sync Symphony:** (Nếu user đồng ý ở Phase 1)
    -   `symphony_create_task(title="<Feature>", priority=1)` → Create root task
    -   Loop qua từng Phase → `symphony_create_task(title="Phase X", ...)`
    -   Loop qua từng Step → `symphony_create_task(title="<Step>", acceptance="...")`

### Phase 4: Handoff
1.  **Report:** Hiển thị chi tiết Plan và Link Symphony.
2.  **Next Steps Menu:**
    ```markdown
    1️⃣ 🚀 Bắt đầu code ngay (`/code phase-01`)
    2️⃣ 👁️ Xem trước UI (`/visualize`)
    3️⃣ 🎵 Xem danh sách task (`/todo`)
    4️⃣ 🔄 Chỉnh sửa lại plan
    ```

---

## 🧠 Brain & Symphony Integration Details

### 1. Auto-Sync Logic
Khi tạo plan, hệ thống sẽ:
1.  `symphony_create_task(title="<Feature>", priority=1)` → Create root task
2.  For each phase: `symphony_create_task(title="Phase X", ...)`
3.  For each task: `symphony_create_task(title="Task", acceptance="...")`
4.  Ghi task mapping → `brain/active_plans.json`

### 2. Context Retention
-   Lưu task IDs vào `brain/active_plans.json`.
-   Khi User gõ `/next`, hệ thống dùng `symphony_available_tasks(filter="ready")` để suggest task.

---

## 🛡️ Resilience Patterns

-   **Duplicate Plan:** Nếu folder đã tồn tại -> Hỏi "Ghi đè (Overwrite) hay Tạo bản sao (Copy)?"
-   **Symphony Error:** Nếu Symphony unavailable -> Vẫn tạo file MD, báo warning "Task tracking disabled".

---

## ⚠️ NEXT STEPS (Menu số):
```
1️⃣ Bắt đầu code Phase 1? `/code phase-01`
2️⃣ Muốn xem UI trước? `/visualize`
3️⃣ Cần chỉnh sửa plan? Nói em biết cần sửa gì
4️⃣ Xem toàn bộ plan? Em show `plan.md`
```
