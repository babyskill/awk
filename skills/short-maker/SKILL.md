---
name: short-maker
description: |
  Đạo diễn sản xuất video quảng cáo App (App Promo) bằng AI. Tự động hóa quy trình viết kịch bản AIDA,
  tạo UI Storyboard Preview (JSON + HTML), gọi Google Flow (Veo 3) render video và LucyLab đọc thoại.
  Hỗ trợ Mimic Mode bóc tách nội dung trending từ YouTube/TikTok.
metadata:
  stage: workflow
  version: "1.0"
  requires: "google-flow-cli (embedded), youtube-transcript-api, yt-dlp, ffmpeg"
  tags: [video, marketing, ads, app-promo, veo, gflow, tiktok, youtube, shorts]
trigger: explicit
activation_keywords:
  - "/short"
  - "/promo"
  - "/mimic"
  - "làm video tiktok"
  - "chạy video flow"
---

# 🎬 Short Maker (App Promo Video Director)

> **Mục tiêu**: Tối đa hóa traffic miễn phí từ Video ngắn (TikTok, YouTube Shorts, Reels)
> bằng cách tự động sản xuất video quảng cáo App với cấu trúc AIDA hoặc copy (Mimic) hook viral.

## 📡 Chế độ hoạt động (Triggers)

- **Original Mode (`/promo`, `/short`)**: User nhập [Tên App + Tính năng]. AI đóng vai Giám đốc Marketing, lên kịch bản AIDA.
- **Mimic Mode (`/mimic`)**: User cung cấp [Link YouTube/TikTok]. AI trích xuất transcript, phân tích Hook/Pacing, sau đó clone cấu trúc kịch bản đó nhưng áp dụng cho App của user.

## 🧱 Quy trình hoạt động (Mandatory Flow)

**Bảo vệ Credit**: Mọi video Veo 3 đều tốn 20 credit. TUYỆT ĐỐI không gọi `gflow generate-video` khi chưa có xác nhận từ người dùng qua bước Storyboard.

1. **Giai đoạn Setup (Authentication)**: AI CẦN PHẢI KIỂM TRA QUYỀN TRUY CẬP TRƯỚC:
   - **Với Google Flow**: Kiểm tra xem file `~/.gflow/env` đã tồn tại chưa. Nếu chưa có (hoặc người dùng chưa auth), AI phải hướng dẫn người dùng chạy lệnh `cd ~/.gemini/antigravity/skills/short-maker/scripts/google-flow-cli && PYTHONPATH=. python3 gflow/cli/main.py auth` và đợi họ xác nhận đã đăng nhập thành công.
   - *(Lưu ý: Authentication của LucyLab TTS được kiểm tra và xử lý tự động khi gọi skill `lucylab-tts`)*.
2. **Giai đoạn Bootstrap**: Tạo thư mục dự án `outputs/<project-name>`, khởi tạo các file môi trường.

3. **Giai đoạn Kịch Bản**: Sinh kịch bản `script.md` theo cấu trúc Prompt Templates. Xác định danh sách các cảnh (scenes) và lời thoại tương ứng. Nhạc nền lấy từ Pixabay/Tiengdong.com hoặc TikTok Trends (độ dài mặc định 30s).
4. **Giai đoạn Concept (0 Cost)**: 
   - Sinh file `outputs/<project>/storyboard.json` từ kịch bản.
   - Gọi lệnh `cd ~/.gemini/antigravity/skills/short-maker/scripts/google-flow-cli && PYTHONPATH=. python3 gflow/cli/main.py generate-image` định dạng 16:9 cho từng cảnh.
   - Copy `templates/storyboard.html` sang thư mục output để Preview.
   - Yêu cầu người dùng mở `storyboard.html` để duyệt.
5. **Giai đoạn Sản Xuất (20 Cost / Scene)**:
   - Nhận lệnh "OK/Duyệt" từ user.
   - Gọi lệnh `cd ~/.gemini/antigravity/skills/short-maker/scripts/google-flow-cli && PYTHONPATH=. python3 gflow/cli/main.py generate-video` sử dụng các prompt đã chốt từ ảnh tĩnh.
6. **Giai đoạn Hậu Kỳ**:
   - Gọi skill `lucylab-tts` (script `~/.gemini/antigravity/skills/lucylab-tts/scripts/lucylab_tts.py`) để tạo TTS track.
   - Xài `ffmpeg` mix Video (`.mp4`), Voiceover, và Background Music.

## 📁 Định dạng Output Convention

Toàn bộ tài nguyên được lưu tại: `outputs/<project-name>/`
- `script.md`
- `storyboard.json` (Trạng thái và metadata từng cảnh)
- `storyboard.html` (Tool preview)
- `storyboard/scene-01.png`
- `segments/scene-01.mp4`
- `audio/voice.mp3` & `audio/bgm.mp3`
- `final/promo-final.mp4`
