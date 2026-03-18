---
description: 📦 Decompile APK/XAPK/JAR/AAR Android và phân tích cấu trúc + trích xuất API
---

# /decompile — Android Reverse Engineering & API Extraction

// turbo-all

## Workflow

### 1. Xác định file target

Nếu user cung cấp đường dẫn file → dùng luôn.
Nếu không → hỏi user đường dẫn đến file `.apk`, `.xapk`, `.jar`, hoặc `.aar`.

### 2. Kiểm tra & cài đặt dependencies

```bash
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/check-deps.sh
```

Parse output tìm `INSTALL_REQUIRED:` và `INSTALL_OPTIONAL:`.

**Nếu thiếu required deps**, cài từng cái:
```bash
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/install-dep.sh java
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/install-dep.sh jadx
```

**Nếu thiếu optional deps** (vineflower, dex2jar), hỏi user có muốn cài không. Khuyến nghị cài cả hai.

Sau khi cài, chạy lại `check-deps.sh` để verify. KHÔNG tiếp tục nếu required deps chưa OK.

### 3. Decompile

```bash
# APK/XAPK → dùng jadx (xử lý resources tốt)
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/decompile.sh <file>

# JAR/AAR + có Fernflower → ưu tiên fernflower
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/decompile.sh --engine fernflower <file>

# Nếu jadx có warnings hoặc muốn chất lượng cao nhất → chạy cả hai
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/decompile.sh --engine both <file>

# Cho app bị obfuscate → thêm --deobf
bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/decompile.sh --deobf <file>
```

### 4. Phân tích cấu trúc

1. Đọc `AndroidManifest.xml` từ resources directory
2. Nếu XAPK, review `xapk-manifest.json`
3. List package structure top-level
4. Xác định Activity chính, Application class, architecture pattern
5. Báo cáo summary cho user

### 5. Đề xuất bước tiếp theo

Hỏi user muốn làm gì tiếp:
- **Trace call flows**: "Tôi có thể theo luồng thực thi từ Activity đến API calls"
- **Extract APIs**: "Tôi có thể tìm tất cả HTTP endpoints và tài liệu hóa"
  ```bash
  bash ~/.gemini/antigravity/skills/android-re-analyzer/scripts/find-api-calls.sh <output>/sources/
  ```
- **Phân tích class cụ thể**: "Chỉ cho tôi class hoặc feature cần phân tích"
- **Rebuild app**: "Muốn rebuild thành Kotlin hiện đại? → chuyển sang skill `smali-to-kotlin`"
