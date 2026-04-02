---
description: 🔀 Hướng dẫn quy trình chuẩn Git (Feature Branch -> Rebase -> PR)
---

# 🔀 Quy trình Git Rebase (Senior Assistant)

Quy trình này đóng vai trò như một Senior Developer hướng dẫn bạn làm quen và tuân thủ quy trình Git chuyên nghiệp: **Nhánh tính năng (Feature Branch) -> Rebase -> Pull Request**. Có khả năng tự động review code, cảnh báo rủi ro, và giải quyết xung đột (conflict) một cách an toàn.

Áp dụng TỐT cho toàn bộ các framework hay ngôn ngữ làm việc nhóm.

## Giai đoạn 1: Khởi tạo Nhánh Tính năng (Branching)

Trợ lý kiểm tra và hướng dẫn bạn tạo nhánh đúng quy chuẩn trước khi bắt tay vào code.

1. Lấy trạng thái mới nhất từ remote server:
   `git fetch origin`
2. Kiểm tra nhánh bạn đang đứng hiện tại:
   `git branch --show-current`
3. Đảm bảo nhánh hiện tại là `master` hoặc `main` và update code mới nhất:
   `git pull origin main` (hoặc `master`)
4. Tạo và chuyển sang nhánh tính năng riêng tư:
   `git checkout -b feature/ten-tinh-nang`

> [!TIP] 
> Luôn code trên nhánh mang tên `feature/*`, `bugfix/*` hoặc `chore/*`. Không bao giờ code và commit trực tiếp lên nhánh `master` hay `main`.

## Giai đoạn 2: Phát triển & Kiểm tra (Code & Review)

Sau khi code xong ở local, AI đóng vai trò review trước khi bạn commit.

1. Xem lại những files đã sửa đê xác nhận lần cuối:
   `git status`
2. Review chi tiết các thay đổi của dòng code:
   `git diff`
3. **Tiêu chuẩn Review tự động từ Trợ lý AI**:
   - Quét tìm hardcode credential hoặc API key.
   - Code có đáp ứng Clean Code không? Có tiềm ẩn memory leak không?
   - Cảnh báo với các khối lệnh ẩn chứa risk nhưng không wrap `try-catch` / xử lý ngoại lệ.
4. Ghi nhận commit (Nên dùng Convention Commits):
   `git add .`
   `git commit -m "feat: [Nhập tóm tắt công việc bạn đã hoàn thiện]"`

## Giai đoạn 3: Quy trình Rebase (Quan trọng nhất)

Quy trình Rebase thay vì Merge giúp giữ cho [Linear Git History] (lịch sử git thẳng, sạch) thay vì tạo ra "Merge commit" rườm rà chồng chéo.

1. Gọi lại lệnh fetch data toàn bộ remote origin xuống:
   `git fetch origin`
2. Chạy lệnh Rebase update với nhánh chính:
   `git rebase origin/main` 

> [!IMPORTANT]
> **Tại sao cần Rebase?** Rebase sẽ kéo những commit mới nhất của đồng nghiệp khác (những người đã chốt tính năng và đẩy lên server ở giữa lúc bạn đang code) lên trước, sau đó nối đoạn code mới của bạn lên ĐẦU đường dây đỏ. Nó giúp việc xem qua lịch sử phát triển dự án rất mượt mà.

## Giai đoạn 4: Giải quyết Xung đột (Resolve Conflicts)

Nếu terminal báo **Merge conflict in...** (tức là 2 người củng sửa vào 1 biến/hàm/file cấu hình)

1. **DỪNG LẠI!** Bạn không cần hoảng. Hãy copy ném phần code đang có dải tag `<<<<<<< HEAD`, `=======`, `>>>>>>>` của file bị xung đột lên cho tôi.
2. Trợ lý sẽ đóng vai trò hòa giải -> Phân tích luồng logic của ứng dụng để gộp trơn tru cả 2 thành phần.
   - Nhạy cảm đặc biệt: Trợ lý có kinh nghiệm handle không làm "vỡ" cấu trúc các file hệ thống (`package.json`, `project.pbxproj`, `.yml` v.v..), giữ nguyên vẹn các UUID tham chiếu.
3. Sau khi chép lại file đã được chỉnh sửa chuẩn xác, add file:
   `git add [tên file đã sửa conflict]`
4. Tiếp tục quá trình Rebase:
   `git rebase --continue`

*(Nếu cần thoát vòng lặp lỗi nguy hiểm khi đang Rebase mà không biết xử lý, hãy chạy: `git rebase --abort`)*

## Giai đoạn 5: Đẩy Code & Tạo Pull Request (PR)

1. Sau khi thành công rebase, toàn bộ nhánh tính năng của bạn đã đủ ổn và "clean" để đẩy ngược lên Remote Repository:
   `git push --force-with-lease origin feature/ten-tinh-nang`
   *(Tham số `--force-with-lease` là cực kỳ quan trọng, nó thay thế `--force` thông thường, để bảo vệ trong case có ai đó cũng đang push lên nhánh `feature/ ten-tinh-nang` của riêng bạn từ 1 máy khác)*
2. Lên hệ thống Git của công ty (GitHub/GitLab/Bitbucket...) bấm tạo "New Pull Request".
3. **Trợ lý tự soạn PR Description ngắn gọn, rành mạch:**
   - Bạn có thể nói tôi: "Tạo PR cho thay đổi này".
   - Tôi sẽ bóp tắt các commits để tóm gọn tính năng bạn làm -> Liệt kê Checklist cho QA và Team Review.

---
// turbo
Bước 1 và 3 có thể tự động chạy ngầm nếu bạn đồng ý. Các bước 2, 4 và 5 cần chủ đích của con người thao tác.
