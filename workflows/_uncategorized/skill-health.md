---
description: 🩺 Kiểm tra tình trạng độ bền và sự ổn định của hệ thống quy trình (Health Monitoring)
---

# 🩺 AWK Skill & Workflow Health Check

> **Workflow này tính toán độ "Health" (khỏe mạnh) của các agentic workflows dựa trên dữ liệu từ Beads và Linting.**
> - Phát hiện Token Creep (khi SKILL.md phình to).
> - Phát hiện High Correction Rate (khi 1 Bead in_progress quá lâu hoặc có comment phàn nàn).

---

## 1. Kiểm tra kích thước và lạm phát Rules (Token Creep)
Chạy lệnh phân tích chất lượng codebase (`awkit lint`) để bắt các Workflow có dòng lệnh vượt giới hạn 500 lines:

```bash
awkit lint || true
```
Nếu có cảnh báo, khuyên User sử dụng `/refactor` để chẻ nhỏ files nhằm tiết kiệm Context Window.

## 2. Kiểm tra hiệu suất chạy (Beads-Driven)
Lấy top 5 Beads (Tasks) mới nhất ở trạng thái `done` hoặc `in_progress` để đánh giá thời gian chênh lệch:

```bash
bd list --status done --limit 5
bd list --status in_progress
```

**Phân tích của hệ thống AI**:
- Task nào tốn quá nhiều cuộc hội thoại liên tục (High Correction Rate) hay bị Re-open?
- Task nào đóng/mở nhanh gọn?
- Suy luận kỹ năng (Skill / Workflow) nào đang bị thoái hoá so với trước đây cần được viết lại. (Khả năng do Prompt/Instructions chưa cụ thể).

## 3. Khôi phục nếu bị lỗi nặng
Nếu Workflow đang quá khổ hoặc gây bug tốn thời gian, AI cần khuyến cáo User chạy`/skill-rollback <Tên_Workflow>` để kéo bản snapshot tại lịch sử cũ thông qua `awf-version-tracker`.
