---
description: 📈 Tối ưu chiến dịch quảng cáo & giảm CPI (Dual-Mode v5.0)
---

# WORKFLOW: /ads-optimize - The Campaign Optimizer (Dual-Mode)

> **Mục tiêu:** Giảm CPI, tăng ROAS thông qua các action cụ thể (Bid, Negative KW, Scaling).

---

## 🅰️ Expert Mode (Auto-Optimize)

Sử dụng `/adsExpert [id] --optimize` để tự động thực hiện các tối ưu an toàn:
- Add Negative Keywords chắc chắn (click spam).
- Pause Ads có CTR cực thấp (<0.5%).

---

## 🅱️ Guided Mode (Interactive)

### Phase 1: Optimization Goals
User chọn mục tiêu:
1.  **Cut Waste:** Giảm tiền lãng phí (Negative KW, Pause bad ads).
2.  **Scale Up:** Tăng ngân sách cho campaign tốt.
3.  **Revive:** Cứu campaign đang chết dần.

### Phase 2: Analysis & Suggestions

**Scenario 1: Cut Waste**
- Query: Search Terms with High Spend & 0 Conv.
- Query: Display Placements with High Spend & 0 Conv.
- Action: "Thêm [X] từ khóa vào Negative List?"

**Scenario 2: Scale Up**
- Query: Campaigns with CPA < Target & Lost Impression Share (Budget).
- Action: "Tăng ngân sách Campaign [Name] thêm 20%?"

### Phase 3: Action Execution
- AI thực hiện thay đổi thông qua MCP (nếu tool hỗ trợ write).
- Nếu MCP chưa hỗ trợ write (an toàn): -> **Tạo Beads Task hướng dẫn chi tiết.**

### Phase 4: Beads Integration (Task Generation)

**Tạo Action Plan trong Beads:**

```bash
# Example: Cut Waste Plan
bd create "Ads Optimization: Cut Waste [Date]" --priority 1
bd create "Add 5 Negative Keywords" --parent [ParentID] --note "burn, hack, free,..."
bd create "Exclude 10 Mobile App Placements" --parent [ParentID]

# Example: Scale Plan
bd create "Ads Optimization: Scale Up [Date]" --priority 0
bd create "Increase Budget: Campaign A (+20%)" --parent [ParentID]
```

---

## 🔍 GAQL Queries

**Find Good Campaigns (Ready to Scale):**
```sql
SELECT campaign.name, metrics.cost_per_conversion, metrics.search_budget_lost_impression_share
FROM campaign
WHERE segments.date WITHIN LAST_7_DAYS
  AND metrics.cost_per_conversion < 50000000 -- <50k CPA
  AND metrics.search_budget_lost_impression_share > 0.1 -- Lost >10% due to budget
```

---

## 📜 History Tracking Rule (Bắt buộc)

Sau khi hoàn thành workflow, AI **PHẢI** ghi log vào file `brain/ads_history_log.md` theo format sau:

```markdown
### [YYYY-MM-DD HH:mm] /ads-optimize
- **Action:** [Mô tả ngắn gọn hành động đã làm, vd: Cut Waste, Scale Up]
- **Target:** [Campaign ID / Ad Group / Keyword]
- **Outcome:** [Kết quả hoặc Hy vọng đạt được]
```

**Lưu ý:** Nếu file không tồn tại, hãy tạo mới.

---

## 🧠 Brain Integration

- Lưu "Winning optimization" vào Brain. Ví dụ: "Tăng budget vào Thứ 6 thường hiệu quả".

---

## ⚠️ NEXT STEPS:
```
1️⃣ Xác nhận task trong Beads (`/todo`)
2️⃣ Kiểm tra lại Audit (`/ads-audit`)
```
