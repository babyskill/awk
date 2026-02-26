# WORKFLOW: /ads-plan - Lập kế hoạch & Preview Quảng cáo

Bạn là **Antigravity Ads Planner** - lập kế hoạch quảng cáo chi tiết với preview trước khi deploy.

---

## 🎯 MỤC TIÊU

- Lập kế hoạch chi tiết cho chiến dịch quảng cáo
- Tạo mẫu quảng cáo (text + images + video concepts)
- Preview để user duyệt trước khi upload
- Export ra định dạng có thể upload bằng CLI tool

---

## PHASE 1: KHỞI TẠO KẾ HOẠCH

### 1.1 Thu thập thông tin
```
📱 Input:
1. Store URL hoặc mô tả app
2. Target audience
3. Budget dự kiến
4. Số lượng ads cần tạo (min 5)
5. Ngôn ngữ target
```

### 1.2 Tạo Plan Directory
```
📂 Tạo thư mục kế hoạch:

→ Tạo folder: ./ads_plan_[app_name]_[date]/
  ├── plan.json          # Kế hoạch tổng thể
  ├── text_assets.json   # Text assets
  ├── images/            # Ảnh đã generate
  ├── videos/            # Video concepts
  └── preview.html       # Preview page
```

---

## PHASE 2: LẬP KẾ HOẠCH CHI TIẾT

### 2.1 Cấu trúc plan.json
```json
{
  "app_name": "[App Name]",
  "customer_id": "[Google Ads Customer ID]",
  "campaign_id": "[Target Campaign ID]",
  "created_at": "[ISO Date]",
  "status": "draft",
  
  "ad_groups": [
    {
      "id": "ag_1",
      "name": "[Ad Group Name]",
      "angle": "AIDA|PAS|BAB",
      "language": "en|ja|th|...",
      "status": "pending"
    }
  ],
  
  "text_assets": {
    "ag_1": {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "...", "..."]
    }
  },
  
  "image_assets": {
    "ag_1": [
      {"path": "images/ag1_lifestyle.png", "concept": "Lifestyle", "size": "1024x1024"},
      {"path": "images/ag1_ui.png", "concept": "UI", "size": "1200x628"}
    ]
  },
  
  "video_concepts": {
    "ag_1": [
      {"description": "15s video showing...", "storyboard": "..."}
    ]
  }
}
```

### 2.2 Tạo Text Assets
```
✍️ Cho mỗi Ad Group, tạo:
- 5+ Headlines (30 chars)
- 5+ Descriptions (90 chars)

Lưu vào text_assets.json với format:
{
  "ag_1": {
    "headlines": [...],
    "descriptions": [...]
  },
  "ag_2": {...}
}
```

---

## PHASE 3: TẠO HÌNH ẢNH

### 3.1 Generate Images
```
🖼️ Sử dụng generate_image:

Cho mỗi Ad Group, tạo tối thiểu 5 ảnh:
1. Lifestyle (1:1)
2. Lifestyle (1.91:1)
3. UI Showcase (1:1)
4. Emotional (4:5)
5. Feature Focus (1.91:1)

Lưu vào folder: ./ads_plan_xxx/images/
Naming: [ad_group_id]_[concept]_[size].png
```

### 3.2 Video Concepts (Optional)
```
🎬 Tạo storyboard cho video ads:

{
  "duration": "15s",
  "scenes": [
    {"time": "0-3s", "visual": "Hook scene", "text": "..."},
    {"time": "3-8s", "visual": "Demo", "text": "..."},
    {"time": "8-12s", "visual": "Benefits", "text": "..."},
    {"time": "12-15s", "visual": "CTA", "text": "Download Now"}
  ]
}

(Video generation sẽ cần tool khác hoặc manual)
```

---

## PHASE 4: TẠO PREVIEW

### 4.1 Generate Preview HTML
```html
<!-- preview.html template -->
Tạo file HTML hiển thị:
- Tất cả Ad Groups
- Text assets (Headlines, Descriptions)
- Image previews
- Video concepts (storyboard)
- Checkbox để approve/reject từng item
```

### 4.2 Preview Format
```
📱 Preview hiển thị như ad thực tế:
- Mobile frame mockup
- Text overlay trên image
- Multiple variations
```

---

## PHASE 5: DUYỆT & EXPORT

### 5.1 User Review
```
✅ User mở preview.html và đánh dấu:
- [x] Approve ad group 1
- [ ] Reject ad group 2 (cần sửa)
- [x] Approve ad group 3
...
```

### 5.2 Export approved.json
```json
{
  "approved_at": "[ISO Date]",
  "ad_groups": ["ag_1", "ag_3"],
  "excluded": ["ag_2"],
  "ready_to_upload": true
}
```

---

## PHASE 6: UPLOAD VIA CLI

### 6.1 Sử dụng CLI Tool
```bash
# Upload tất cả approved ads
npx ads-uploader upload ./ads_plan_xxx/

# Upload 1 ad group cụ thể
npx ads-uploader upload ./ads_plan_xxx/ --group ag_1

# Dry run (preview without upload)
npx ads-uploader upload ./ads_plan_xxx/ --dry-run
```

---

## 📊 OUTPUT FILES

```
./ads_plan_[app]_[date]/
├── plan.json           # Master plan
├── text_assets.json    # All text
├── approved.json       # User approval
├── images/
│   ├── ag1_lifestyle_1024.png
│   ├── ag1_ui_1200x628.png
│   └── ...
├── videos/
│   └── storyboards.json
└── preview.html        # Visual preview
```

---

## 📜 History Tracking Rule (Bắt buộc)

Sau khi hoàn thành workflow, AI **PHẢI** ghi log vào file `brain/ads_history_log.md` theo format sau:

```markdown
### [YYYY-MM-DD HH:mm] /ads-plan
- **Action:** [Plan Creation]
- **Target:** [App Name]
- **Plan Status:** [Draft / Approved]
- **Path:** [Path to plan.json]
```

**Lưu ý:** Nếu file không tồn tại, hãy tạo mới.

---

## 💡 SỬ DỤNG

```
/ads-plan
```

Quy trình:
1. AI thu thập thông tin app
2. AI tạo plan.json + text assets
3. AI generate images
4. AI tạo preview.html
5. User review & approve
6. User chạy CLI để upload
