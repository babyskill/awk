---
description: 🚀 Deploy lên Production (Dual-Mode v5.0)
---

# WORKFLOW: /deploy - The Release Manager (Dual-Mode + Symphony)

> **Mode A (Expert):** `/deploy --prod --force` -> Bỏ qua checks, deploy ngay.
> **Mode B (Guided):** `/deploy` -> Pre-flight Checks -> Config -> Deploy -> Verify.

---

## 🅰️ Expert Mode (Direct Execution)

**Usage:**
```bash
/deploy --prod --force --skip-tests
```

**Logic:**
1.  **Safety Check:** (Trừ khi có `--force`)
    -   Check Git clean state.
    -   Check CI/CD status (nếu có).
2.  **Execute:**
    -   Chạy build script (`npm run build`).
    -   Chạy deploy command (Vercel/Docker/AWS).
3.  **Symphony Sync:**
    -   Complete all in-progress tasks: `symphony_complete_task(task_id, summary)`.
    -   Report deployment progress.
4.  **Report:** "✅ Deployed to Production. URL: [Link]"

---

## 🅱️ Guided Mode (Interactive Wizard)

### Phase 1: Pre-Audit & Health Check
1.  **Blocker Check:**
    -   Check `session.json`: Có test nào đang `skipped` không?
    -   Check Symphony: Có task nào `critical` đang mở không?
    -   *If Issue:* ❌ "Khoan! Còn 2 bugs nghiêm trọng chưa fix. Bạn chắc chắn muốn deploy?"

2.  **Environment Check:**
    -   Target: Staging hay Production?
    -   Secrets: `.env` đủ chưa?

### Phase 2: Build & Optimization
1.  **Action:** Chạy build thử nghiệm (`npm run build`).
2.  **SEO & Assets:**
    -   "Có muốn tự động tạo `sitemap.xml` và `robots.txt` không?"
    -   "Ảnh chưa tối ưu, muốn chạy nén ảnh không?"

### Phase 3: Deployment
1.  **Action:** Thực hiện deploy (theo platform detect được: Vercel, Netlify, VPS...).
2.  **Progress:** Hiển thị realtime logs (đơn giản hóa).

### Phase 4: Verification & Handoff
1.  **Smoke Test:**
    -   AI tự truy cập URL vừa deploy.
    -   Check HTTP 200, check JS errors.
2.  **Symphony Release:**
    -   "Tạo Release Note từ các tasks đã làm?"
    -   Action: Complete all related tasks in Symphony.
3.  **Action Menu:**
    ```markdown
    1️⃣ 📢 Thông báo team (Copy release note)
    2️⃣ 💾 Lưu cấu hình deploy (`/save-brain`)
    3️⃣ 🔍 Monitor realtime logs
    ```

---

## 🧠 Brain & Symphony Logic

### 1. Release Tracking
-   Mỗi lần deploy thành công -> Tạo bản ghi trong `brain/releases/`.
-   Nội dung: Version, Date, Commit Hash.

### 2. Deployment Knowledge
-   Lưu các preferences của user (vd: "Luôn dung Vercel", "Luôn skip test ở Staging").
-   Tự động suggest lại vào lần sau.

---

## 🛡️ Resilience Patterns

-   **Rollback Strategy:** Nếu Smoke Test fail -> Tự động gợi ý `/rollback`.
-   **Environment Protection:** Cấm deploy Production vào chiều Thứ 6 (trừ khi `--force`).

---

## ⚠️ NEXT STEPS (Menu số):
```
1️⃣ Monitor logs (`/logs`)
2️⃣ Rollback nhanh (`/rollback`)
3️⃣ Đóng task trong Symphony (`/done`)
```
