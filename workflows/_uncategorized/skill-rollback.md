---
description: ⏪ Phục hồi (rollback) các plugins và quy trình (Skills/Workflows) dựa trên snapshot cũ khi lỗi
---

# ⏪ Lùi lại bản hệ thống cũ (AWK Skill Rollback)

> **Mục tiêu:** Kéo lại bản sao của toàn bộ thư mục `skills/` và `global_workflows/` từ những snapshot cũ nhất phòng khi `SKILL.md` hay Code bị hỏng (Regression/Bug). Cứ mỗi session mới thì `awf-version-tracker` tự sinh một file `awk_snapshot_xxx.zip` trên `/.gemini/antigravity/brain/versions`.

---

## Bước 1. Hiển thị danh sách các bản Snapshot gần nhất

Dùng terminal list ra các file snapshot để người dùng xem và quyết định:

```bash
ls -lt ~/.gemini/antigravity/brain/versions/awk_snapshot_*.zip
```
*(Nếu thư mục rỗng, báo cho User biết không có bản snapshots nào. Quá trình Rollback kết thúc).*

## Bước 2. Chọn Snapshot và Rollback

Nếu có file, gợi ý người dùng bản mới nhất không tính bản bị lỗi. Chờ họ xác nhận tên file cụ thể (vd: `awk_snapshot_20260228_153000.zip`).

Sau khi nhận tên file, AI tự động thay thế bằng file ZIP đó với lệnh bash (overwrite everything):

```bash
unzip -o ~/.gemini/antigravity/brain/versions/awk_snapshot_YYYYMMDD_HHMMSS.zip -d ~/.gemini/antigravity/
```

## Bước 3. Xác minh tính toàn vẹn trở lại
Chạy lệnh Health Check để đảm bảo file lùi lại có trạng thái tốt nhất:
```bash
awkit lint
```
Báo cáo: `Đã khôi phục thành công hệ thống Antigravity cho thư mục Skills & Workflows, tất cả cảnh báo đã được dọn dẹp!`
