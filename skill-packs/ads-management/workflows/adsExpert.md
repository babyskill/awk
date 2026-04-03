---
description: ⚡ Tối ưu Ads tự động (Expert Mode)
---

# WORKFLOW: /adsExpert - Instant Ads Optimization

> **Expert Mode Only:** Tự động Audit & Optimize tài khoản Google Ads. Không hỏi, chỉ làm & báo cáo. Nội dung phản hồi và báo cáo bằng tiếng Việt

---

## Usage

```bash
/adsExpert [account_id] [--auto-fix]
```

**Examples:**
```bash
/adsExpert 5527743070           # Audit & Report only
/adsExpert 5527743070 --auto-fix # Pause bad ads/keywords automatically
```

---

## Execution Flow

### 1. Data Fetching (Auto)
*Utilizes `mcp-google-ads`*

1.  **Get Currency:** `get_account_currency(customer_id)`
2.  **Get Performance:**
    -   `get_campaign_performance(days=1)` (Yesterday)
    -   `get_campaign_performance(days=7)` (Trend)
    -   `get_ad_performance(days=30)` (Deep Dive)

### 2. Rule-Based Analysis (Auto)

AI tự động check các rules sau:

| Rule ID | Name | Condition | Severity |
|---------|------|-----------|----------|
| R1 | Wasted Spend | Cost > 200k & Conv = 0 | 🔴 Critical |
| R2 | High CPA | CPA > 2x Account Avg | 🟠 Warning |
| R3 | Low CTR | CTR < 1.0% (Search) | 🟡 Info |
| R4 | Limited Budget | Cost ~= Budget | 🟠 Warning |
| R5 | Good Mover | ROAS > 2.0 | 🟢 Opportunity |

### 3. Execution (Action)

**Without `--auto-fix`:**
- Tổng hợp lỗi vào Report.
- Tạo Symphony Tasks cho các lỗi R1, R2.

**With `--auto-fix`:**
- **R1 (Wasted Spend):** Auto-pause Keyword/Ad Group.
- **R2, R3, R4:** Tạo Symphony Task.

### 4. Symphony Integration

```bash
# R1: Wasted Spend -> Critical Task
symphony_create_task(title="Pause Waste: [Keyword] ($$ Spend, 0 Conv)", priority=1)

# R2: High CPA -> Investigation Task
symphony_create_task(title="Investigate High CPA: [Campaign] (CPA: $$)", priority=1)

# R5: Good Mover -> Scale Task
symphony_create_task(title="Scale Up: [Campaign] (ROAS: 2.5)", priority=1)
```

### 5. Report Generation

Tạo file: `reports/ads/[date]_expert_audit.md`

```markdown
# ⚡ Ads Expert Report - [Date]

## 📊 Pulse Check
- Spend Yesterday: 500,000 VND
- Conversions: 10 (CPA: 50,000 VND)
- ROAS: 2.1

## 🚨 Actions Taken (Auto-Fix)
- Paused Keyword: "free download" (Spent 200k, 0 conv)

## 📿 Symphony Tasks Created
1. [P0] Pause Waste: "cheat codes" (Spent 150k, 0 conv) #123
2. [P1] Investigate High CPA: "Competitor Campaign" #124
3. [P1] Scale Up: "Brand Campaign" #125

➡️ **Next:** Review tasks at `/todo`
```

---

## 📜 History Tracking Rule (Bắt buộc)

Sau khi hoàn thành workflow, AI **PHẢI** ghi log vào file `brain/ads_history_log.md` theo format sau:

```markdown
### [YYYY-MM-DD HH:mm] /adsExpert
- **Action:** [Mô tả ngắn gọn hành động đã làm, vd: Auto-fix, Report Only]
- **Target:** [Account ID]
- **Action Details:** [List các hành động auto-fix đã thực hiện]
```

**Lưu ý:** Nếu file không tồn tại, hãy tạo mới.

---

## Analysis Logic (Internal)

### Wasted Spend Query (GAQL)
```sql
SELECT 
  campaign.name, 
  ad_group.name, 
  keyword_view.resource_name, 
  metrics.cost_micros, 
  metrics.conversions 
FROM keyword_view 
WHERE 
  segments.date DURING LAST_30_DAYS 
  AND metrics.cost_micros > 200000000 
  AND metrics.conversions = 0
```

### High CPA Query (GAQL)
```sql
SELECT 
  campaign.name, 
  metrics.cost_micros, 
  metrics.conversions,
  metrics.cost_per_conversion
FROM campaign 
WHERE 
  segments.date DURING LAST_7_DAYS
  AND metrics.conversions > 0
ORDER BY metrics.cost_per_conversion DESC
```

---

## Error Handling

### API Failures
- `get_campaign_performance` fail -> Retry 3 times.
- If fail -> Create Task "Check Google Ads Connection" & Exit.

### No Data
- If Spend = 0 -> "Account inactive. No optimization needed."

---

## ⚠️ NEXT STEPS (Menu):
```
1️⃣ Review tasks (`/todo`)
2️⃣ Chạy Creative Audit (`/ads-creative`)
3️⃣ Chạy Full Audit (`/ads-audit`)
```