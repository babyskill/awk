---
description: 🔄 Đồng bộ thủ công Project Status lên Trello Card (tuân thủ quy tắc Anti-Spam)
---

# 🔄 Trello Sync Workflow (`/trello-sync`)

Quy trình này hướng dẫn AI đồng bộ thủ công mức độ hoàn thành của dự án hiện tại lên Trello Card, dựa trên dữ liệu từ thiết kế, Kiro Specs, hoặc Symphony tasks.

## 🎯 Mục đích
Được sử dụng khi người dùng muốn ép (force) AI cập nhật tiến độ tổng thể lên Trello, hoặc khi AI cần tổng kết (summarize) status sau một Sprint/Milestone quan trọng.

## 📋 Hướng dẫn thực thi

### Bước 1: Thu thập ngữ cảnh hiện tại
1. Kiểm tra trạng thái dự án hiện tại (đọc `Symphony` tasks, `.kiro/specs/tasks.md` hoặc các file spec nội bộ).
2. Tóm tắt lại các **module hoặc tính năng lớn** (High-level features) đã hoàn thành, đang làm, và chưa làm.

### Bước 2: Load Trello Configuration
1. Đảm bảo shell đã có sẵn `TRELLO_KEY` và `TRELLO_TOKEN` (từ biến môi trường máy). CLI đã tự động thừa hưởng.
2. Đọc file `.trello-config.json` tại thư mục gốc của dự án để lấy thông tin `<board>`, `<list>`, và `<card>`.
3. Nếu file cấu hình không tồn tại, báo lỗi và yêu cầu user tạo cấu hình hoặc chạy `/init`.

### Bước 3: Cập nhật Trello (Cân bằng giữa Chi tiết và Tối giản)
> **⛔ CẢNH BÁO QUAN TRỌNG:**
> Đừng "spam" tạo checklist item cho các task code le te. Nhưng cũng ĐỪNG quá trống rỗng. Hãy cập nhật Card Description và Comment đầy đủ ý nghĩa cho Quản lý dự án.

1. Hãy sử dụng thư viện native CLI `awkit trello`. Không dùng lệnh `trello-cli` thuần hay script Python/Bash.
2. **Cập nhật Mô tả (Description)** tổng quan của dự án (cực kỳ quan trọng để Quản lý nắm bắt):
   ```bash
   awkit trello desc "**Tech Stack:** Kotlin, Compose... **Hiện trạng:** Đang làm module Foundation..."
   ```
3. CHỈ đồng bộ tên Milestone / Module / Feature lớn vào Checklist Item.
4. **Thêm Checklist mới** (nếu module đó chưa có checklist riêng):
   ```bash
   awkit trello checklist "<Milestone / Module Name>"
   ```
5. **Thêm item mới vào Checklist** (Task mới):
   ```bash
   awkit trello item "<Feature Name>"
   ```
6. **Mark done một item** (Module lớn đã xong):
   ```bash
   awkit trello complete "<Feature Name>"
   ```
7. **Thêm Comment** tổng kết milestone:
   ```bash
   awkit trello comment "🎯 Milestone Update: Chúng ta đã hoàn thành feature..."
   ```

### Bước 4: Hoàn tất
1. Tóm tắt lại với user về các module/tính năng đã được sync thành công lên Trello card.
2. Gợi ý Next step: Gọi `/next` hoặc `/code` để tiếp tục làm việc.
