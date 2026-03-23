---
description: 🐞 Sửa lỗi & Debug (Dual-Mode v5.0)
---

# WORKFLOW: /debug - The Sherlock Holmes (Dual-Mode + Symphony)

> **Mode A (Expert):** `/debug --auto-fix` -> Tự động phân tích và sửa lỗi.
> **Mode B (Guided):** `/debug` -> Hướng dẫn thu thập thông tin -> Phân tích -> Menu sửa.

---

## ⚠️ Iron Law (from systematic-debugging skill)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

> Bắt buộc: Đọc `~/.gemini/antigravity/skills/systematic-debugging/SKILL.md` trước khi debug.
> 4 phases: Root Cause → Pattern Analysis → Hypothesis → Implementation
> 3-Fix Rule: Sau 3 fix thất bại → question architecture, discuss with user.

---

## 🅰️ Expert Mode (Direct Execution)

**Usage:**
```bash
/debug --auto-fix --file src/components/Cart.tsx
```

**Logic (follows 4-phase systematic debugging):**
1.  **Phase 1 — Root Cause Investigation:**
    -   Đọc error messages/stack traces HOÀN TOÀN (không skip).
    -   Reproduce consistently — exact steps.
    -   `git diff` — check recent changes.
    -   Multi-component: add diagnostic logging ở mỗi boundary.
    -   Trace data flow backward đến source.
2.  **Phase 2 — Pattern Analysis:**
    -   Find similar WORKING code in codebase.
    -   Compare: list EVERY difference.
3.  **Phase 3 — Hypothesis:**
    -   "I think X is root cause because Y"
    -   Test minimally — ONE variable at a time.
4.  **Phase 4 — Implementation:**
    -   Create failing test FIRST.
    -   Implement single fix.
    -   Verify: tests pass, no regressions.
5.  **Symphony Sync:**
    -   Nếu lỗi Critical và không thể auto-fix → `symphony_create_task(title="Fix Critical Bug in Cart.tsx")`.
6.  **NeuralMemory:**
    -   `nmem_remember` root cause + fix + pattern (cho future recall).
7.  **Report:** "✅ Fixed 1 issue. Evidence: [test output]. ⚠️ Created task #456 for manual review."

---

## 🅱️ Guided Mode (Interactive Wizard)

### Phase 1: Error Discovery
1.  **Symptom Check:**
    ```markdown
    Lỗi xảy ra như thế nào?
    1️⃣ Trang trắng toát
    2️⃣ Loading mãi không dừng
    3️⃣ Báo lỗi đỏ
    4️⃣ Nút không hoạt động
    5️⃣ Dữ liệu sai
    ```

2.  **Context Gathering:**
    -   "Lỗi xảy ra khi nào? (Mở app / Sau login / Bấm nút X)"
    -   "Có chụp màn hình hoặc copy error message không?"

### Phase 2: Investigation
1.  **AI Autonomous Analysis:**
    -   Đọc logs, stack trace.
    -   Inspect code liên quan.
    -   Đưa ra 2-3 giả thuyết.

2.  **Hypothesis Menu:**
    ```markdown
    Em nghĩ có 3 nguyên nhân:
    1️⃣ Database chưa bật (Khả năng cao)
    2️⃣ API trả về lỗi 500
    3️⃣ Biến undefined

    Muốn em kiểm tra cái nào trước?
    ```

### Phase 3: Fix Strategy
1.  **Root Cause Explanation:**
    -   Giải thích bằng ngôn ngữ đời thường.
    -   Ví dụ: "Danh sách sản phẩm đang trống nên code bị lỗi khi cố hiển thị."

2.  **Fix Options:**
    ```markdown
    1️⃣ 🔧 Em sửa ngay (Auto-fix)
    2️⃣ 📿 Tạo task Symphony để sửa sau
    3️⃣ 📝 Hướng dẫn anh tự sửa
    4️⃣ 🔍 Điều tra sâu hơn
    ```

### Phase 4: Execution & Verification
1.  **Action:** Thực hiện sửa lỗi.
2.  **Regression Check:** "Chạy lại test để đảm bảo không làm hỏng gì khác."
3.  **Cleanup:** Xóa debug logs đã thêm.

---

## 🧠 Brain & Symphony Logic

### 1. Bug Tracking
-   Mọi lỗi được phát hiện -> Ghi vào `brain/bugs/[date]_[issue].md`.
-   Nếu lỗi Critical -> Auto-create Symphony task với tag `bug` và `high-priority`.

### 2. Knowledge Base
-   Lỗi đã fix -> Lưu vào `brain/solutions/` để tham khảo sau.
-   Pattern lỗi lặp lại -> Gợi ý tạo Rule hoặc Linter.

### 3. Smart Resume
-   Nếu user quay lại debug cùng 1 lỗi -> "Hôm qua anh đang debug lỗi này. Em đã tìm ra [Solution]. Áp dụng không?"

---

## 🛡️ Resilience Patterns

-   **False Fix Detection:** Sau khi sửa, tự động chạy test. Nếu fail -> Rollback ngay.
-   **Unknown Error:** Nếu không tìm ra nguyên nhân sau 3 lần -> Tạo task Symphony "Investigate Unknown Error" và gợi ý user tìm expert.

---

## ⚠️ NEXT STEPS (Menu số):
```
1️⃣ Chạy test toàn bộ (`/test`)
2️⃣ Vẫn còn lỗi? (`/debug` lại)
3️⃣ Xem danh sách bugs (`/todo --label bug`)
```
