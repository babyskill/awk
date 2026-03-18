---
description: Quét toàn bộ dự án để đánh giá mức độ hoàn thiện, phát hiện logic thiếu sót, và tạo báo cáo tổng quan kèm đề xuất test Maestro.
---

# Project Comprehensive Audit Workflow 🕵️‍♂️

## 1. Khởi động & Nhận diện 🚩
1.  **Đọc ngữ cảnh dự án**:
    -   Đọc file `.project-identity` (nếu có) để hiểu Tech Stack và Roadmap.
    -   Đọc file `App.swift` hoặc `SceneDelegate.swift` để xác định điểm entry của ứng dụng.
2.  **Bản đồ cấu trúc**:
    -   Dùng `list_dir` (recursive hoặc depth=3) để nắm cấu trúc thư mục chính: `Core`, `Features`, `UI`, `Services`, `Models`.
    -   Xác định mô hình kiến trúc đang dùng (MVVM, VIPER, TCA, v.v.).

## 2. Quét độ hoàn thiện (Static Analysis) 🔍
1.  **Tìm "Nợ kỹ thuật" & Placeholder**:
    -   Dùng `grep_search` tìm các từ khóa: `TODO`, `FIXME`, `fatalError`, `print(`, `Coming soon`, `placeholder`.
    -   Phát hiện các function/class rỗng hoặc chưa implement logic.
2.  **Kiểm tra tính kết nối**:
    -   View có ViewModel không?
    -   Service có được inject vào ViewModel không? (Kiểm tra xem có hardcode singleton không mong muốn không).
3.  **Kiểm tra tài nguyên**:
    -   Kiểm tra `Assets.xcassets` (sơ bộ) xem có ảnh thiếu hay tên không chuẩn không.

## 3. Phân tích chức năng (Feature Gap Analysis) 🧩
Dựa trên cấu trúc thư mục và code thực tế, lập bảng so sánh:
-   **Tính năng đã có**: (Ví dụ: Auth, Home, Settings).
-   **Trạng thái**:
    -   🟢 **Done**: Logic đầy đủ, UI hoàn thiện.
    -   🟡 **In Progress**: Có UI nhưng logic mock/hardcode.
    -   🔴 **Missing**: Có trong plan/identity nhưng chưa thấy code.
    -   ⚪️ **Unknown**: Code rác, không rõ mục đích.

## 4. Kiểm thử giao diện thực tế (Maestro Integration) 📱
*Bước này yêu cầu Maestro đã được cài đặt (`brew install maestro`).*

1.  **Đề xuất kịch bản test (Test Plan)**:
    -   Dựa trên các màn hình đã quét được, đề xuất 1 flow kiểm thử chính (Critical Path). Ví dụ: `Login -> Home -> Detail -> Back`.
2.  **Tạo/Chạy Maestro Flow**:
    -   Tạo file tạm `audit_flow.yaml`.
    -   Chạy lệnh: `maestro test audit_flow.yaml`. (Nếu user đồng ý và môi trường sẵn sàng).
    -   *Lưu ý: Nếu không chạy được Maestro, chuyển sang phân tích code tĩnh sâu hơn.*

## 5. Báo cáo & Đề xuất (Final Report) bằng tiếng Việt 📝
Tổng hợp kết quả thành báo cáo Markdown:

### 📊 Báo cáo tiến độ dự án [Tên Dự Án]
| Tính năng | Trạng thái | Ghi chú (Lỗi/Thiếu/Cần tối ưu) |
| :--- | :--- | :--- |
| Authentication | 🟢 Done | Đã có login/register, chưa có forgot password |
| User Profile | 🟡 Partial | UI xong, chưa lưu data xuống DB |
| ... | ... | ... |

### 🛠 Đề xuất hành động
1.  **Ưu tiên cao**: [Các crash tiềm ẩn, logic sai].
2.  **Cần làm ngay**: [Các tính năng còn đang dang dở].
3.  **Tối ưu**: [Refactor code rác, UI chưa mượt].

### 🤖 Lệnh tiếp theo
- `symphony_create_task(title="Fix logic ABC")`
- `/create-feature "Tên tính năng còn thiếu"`