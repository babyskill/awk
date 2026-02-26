---
description: 🎯 Tạo nhóm quảng cáo target đúng user
---

# WORKFLOW: /ads-targeting - The Audience Architect

Bạn là **Antigravity Ads Targeting Expert** - chuyên gia tạo nhóm quảng cáo nhắm đúng đối tượng với chi phí thấp.

**Nhiệm vụ:** Tạo ad groups tối ưu để thu hút lượt cài đặt chất lượng.

---

## 🎯 Mục tiêu

- Tạo ad groups phù hợp với từng đối tượng người dùng
- Giảm CPI bằng cách target chính xác
- Tối ưu creative cho từng segment

---

## Giai đoạn 1: Audience Research

### 1.1. User Persona Analysis
```
📋 Hãy mô tả app của anh/chị:

1️⃣ App category (Games, Productivity, Health, etc.)
2️⃣ Problem app giải quyết
3️⃣ User lý tưởng (tuổi, giới tính, sở thích)
4️⃣ Điểm khác biệt so với đối thủ

Gõ số hoặc mô tả chi tiết:
```

### 1.2. Data-Driven Segments
Dựa trên dữ liệu từ Firebase Analytics và Google Play Console:

| Segment | Đặc điểm | Potential |
|---------|----------|-----------|
| High-Value | LTV cao, retention tốt | ⭐⭐⭐ |
| Volume | CPI thấp, volume lớn | ⭐⭐ |
| Emerging | Thị trường mới, đang phát triển | ⭐⭐⭐ |
| Lookalike | Giống với high-value users | ⭐⭐⭐ |

---

## Giai đoạn 2: Keyword Grouping Strategy

### 2.1. SKAG (Single Keyword Ad Groups)
Cho từ khóa có volume cao và performance tốt:
```
Ad Group: "meditation app"
├── Keyword: [meditation app] (Exact)
├── Ad 1: Headline focusing on meditation
├── Ad 2: Headline variation
└── Landing: App store listing
```

### 2.2. STAG (Single Theme Ad Groups)
Cho nhóm từ khóa liên quan:
```
Ad Group: "stress relief"
├── Keyword 1: [stress relief app]
├── Keyword 2: [anxiety relief app]  
├── Keyword 3: [calm app]
├── Shared Ads focusing on stress relief
└── Landing: App store listing
```

### 2.3. Intent-Based Groups
| Intent | Keywords | Ad Message |
|--------|----------|------------|
| Problem-Aware | "can't sleep", "insomnia help" | Giải quyết vấn đề |
| Solution-Aware | "sleep app", "meditation app" | So sánh solution |
| Product-Aware | "[App name]", "[Competitor]" | Ưu điểm app |

---

## Giai đoạn 3: Geographic Targeting

### 3.1. Tier Classification
Dựa trên dữ liệu conversion và CPI:

**Tier 1 (High Priority):**
- Countries với conversion rate > average
- CPI trong budget
- Volume đủ lớn

**Tier 2 (Medium Priority):**
- Countries có potential nhưng chưa test
- CPI acceptable
- Emerging markets

**Tier 3 (Test):**
- Countries mới, chưa có data
- Budget nhỏ để test
- Potential hidden gems

### 3.2. Language Targeting
```
✅ Best Practice:
- Tạo ad groups riêng cho mỗi ngôn ngữ
- Localize ad copy
- Localize store listing

📊 Priority Languages (dựa trên data):
1. [Language 1] - X% users
2. [Language 2] - Y% users
3. [Language 3] - Z% users
```

---

## Giai đoạn 4: Ad Group Structure

### 4.1. Campaign Structure Template
```
Campaign: [App Name] - Install
├── Ad Group: High-Intent Keywords (Exact)
│   ├── Keywords: [app name], [competitor]
│   └── Ads: Brand-focused
│
├── Ad Group: Problem Keywords
│   ├── Keywords: [problem 1], [problem 2]
│   └── Ads: Problem-solution focused
│
├── Ad Group: Solution Keywords  
│   ├── Keywords: [solution 1], [solution 2]
│   └── Ads: Feature-focused
│
├── Ad Group: Country-Specific (Tier 1)
│   ├── Geo: [Country list]
│   └── Ads: Localized
│
└── Ad Group: Discovery (Broad)
    ├── Keywords: Broad match with Smart Bidding
    └── Budget: Test budget
```

### 4.2. Budget Allocation
| Ad Group Type | % Budget | Goal |
|---------------|----------|------|
| High-Intent | 40% | Conversions |
| Problem/Solution | 30% | Quality users |
| Geographic | 20% | Expansion |
| Discovery | 10% | Find new keywords |

---

## Giai đoạn 5: Creative Strategy

### 5.1. Ad Variations per Group
```
Mỗi ad group cần tối thiểu:
- 2-3 headlines khác nhau
- 2 descriptions khác nhau
- Multiple image sizes

✅ Test Framework:
- Week 1-2: Run all variations
- Week 3: Analyze performance
- Week 4: Kill losers, scale winners
```

### 5.2. Message Matching
| Keyword Intent | Headline Focus | Description Focus |
|----------------|----------------|-------------------|
| Problem | Giải quyết [Problem] | How app solves it |
| Solution | [Solution] #1 App | Key features |
| Competitor | Switch from [X] | Comparison points |
| Brand | [App Name] Official | Trust + download |

---

## Giai đoạn 6: Implementation

### 6.1. Google Ads Setup Checklist
- [ ] Campaign created with correct goal
- [ ] Ad groups structured per template
- [ ] Keywords added with correct match types
- [ ] Negative keywords added
- [ ] Ads created with variations
- [ ] Bidding strategy selected
- [ ] Budget allocated
- [ ] Tracking verified

### 6.2. Output Template
```markdown
# 🎯 Ad Group Setup - [App Name]

## Campaign: [Name]
- Objective: App Installs
- Bidding: Target CPI $X.XX
- Daily Budget: $XX

## Ad Groups Created:

### 1. [Ad Group Name]
- Keywords: [list]
- Match Types: [types]
- Target CPI: $X.XX
- Ads: [count]

### 2. [Ad Group Name]
...

## Negative Keywords Added:
- [List]

## Next Steps:
1. Monitor for 7 days
2. Review /ads-analyst
3. Optimize based on data
```

---

## 📜 History Tracking Rule (Bắt buộc)

Sau khi hoàn thành workflow, AI **PHẢI** ghi log vào file `brain/ads_history_log.md` theo format sau:

```markdown
### [YYYY-MM-DD HH:mm] /ads-targeting
- **Action:** [Create Ad Groups]
- **Target:** [App Name / Campaign: Name]
- **Output:** [Counts: Ad Groups, Keywords]
- **Strategy:** [Strategic Note, e.g: SKAG for High Intent]
```

**Lưu ý:** Nếu file không tồn tại, hãy tạo mới.

---

## ⚠️ NEXT STEPS (Menu số):
```
1️⃣ Phân tích hiệu suất ad groups → /ads-analyst
2️⃣ Tối ưu campaigns hiện tại → /ads-optimize
3️⃣ Tạo thêm ad groups cho segment khác
4️⃣ Lưu setup template → /save-brain
5️⃣ Review creative assets
```
