---
description: 📊 Tự động phân tích & báo cáo hiệu suất Google Ads hàng ngày (Dual-Mode v5.0)
---

# WORKFLOW: /ads-audit - The Ads Analyst (Dual-Mode + Symphony)

> **Mode A (Expert):** `/adsExpert [id]` -> Auto check & create tasks.
> **Mode B (Guided):** `/ads-audit` -> Chọn Account -> Phân tích -> Hướng dẫn chi tiết.

---

## 🅰️ Expert Mode (Alias)

User gõ `/ads-audit --auto` hoặc `/adsExpert` sẽ kích hoạt workflow Expert.
Xem: `global_workflows/adsExpert.md`.

---

## 🅱️ Guided Mode (Interactive Wizard)

### Phase 1: Context & Selection
1.  **List Accounts:**
    -   Call `mcp-google-ads.list_accounts()`
    -   Hiển thị list cho User chọn (nếu chưa chọn).
2.  **Currency Check:**
    -   Call `mcp-google-ads.get_account_currency(id)`

### Phase 2: Data Acquisition (Visible Steps)
*AI thông báo rõ đang làm gì:*
1.  "Đang lấy dữ liệu hôm qua..." (`get_campaign_performance(days=1)`)
2.  "Đang check xu hướng 7 ngày..." (`get_campaign_performance(days=7)`)
3.  "Đang quét từ khóa lãng phí..." (`run_gaql(...)`)

### Phase 3: Analysis & Insights
1.  **Vital Signs:**
    -   Spend hôm qua vs Trung bình tuần.
    -   CPA hôm qua vs Target.
2.  **Health Check:**
    -   Có campaign nào max budget?
    -   Có từ khóa rác (High spend, 0 conv)?

### Phase 4: Strategy Menu
User nhận được tóm tắt và menu chọn hành động:

```markdown
📊 **Audit Summary:**
- Spend Yesterday: 500k (Cao hơn TB 20%)
- Alerts: ⚠️ 2 Từ khóa rác phát hiện

➡️ **Chiến lược tiếp theo:**
1️⃣ 🧹 Dọn dẹp rác ngay (Review & Pause)
2️⃣ 🎵 Tạo task Symphony để xử lý sau
3️⃣ 📝 Xem báo cáo đầy đủ
4️⃣ 🔍 Phân tích sâu hơn (`/ads-analyst`)
```

### Phase 5: Symphony Integration
- Nếu chọn **2 (Create Task)**:
    - AI tự động tạo các tasks:
        - `symphony_create_task(title="Pause Keyword X (Waste 200k)")`
        - `symphony_create_task(title="Review Campaign Y (CPA too high)")`

---

## 🔍 GAQL Helper (Ẩn)

**Query: Wasted Keywords**
```sql
SELECT keyword_view.resource_name, metrics.cost_micros, metrics.conversions
FROM keyword_view
WHERE segments.date WITHIN LAST_30_DAYS
  AND metrics.cost_micros > 500000000  -- >500k VND
  AND metrics.conversions = 0
```

---

## 📜 History Tracking Rule (Bắt buộc)

Sau khi hoàn thành workflow, AI **PHẢI** ghi log vào file `brain/ads_history_log.md` theo format sau:

```markdown
### [YYYY-MM-DD HH:mm] /ads-audit
- **Action:** [Mô tả ngắn gọn hành động đã làm]
- **Target:** [Campaign ID / Ad Group / Keyword]
- **Before:** [Metrics trước khi optimze - optional]
- **Outcome:** [Kết quả hoặc Hy vọng đạt được]
```

**Lưu ý:** Nếu file không tồn tại, hãy tạo mới.

---

## 🧠 Brain Logic

- **Save Report:** Luôn lưu báo cáo audit vào `reports/ads/audit_[date].md`.
- **Knowledge:** Nếu phát hiện pattern (vd: Thứ 7 luôn đắt), ghi vào Brain (`brain/ads_insights.md`).

---

## ⚠️ NEXT STEPS:
```
1️⃣ Optimize ngay (`/ads-optimize`)
2️⃣ Làm mới Ads (`/ads-creative`)
3️⃣ Check tasks (`/todo`)
```