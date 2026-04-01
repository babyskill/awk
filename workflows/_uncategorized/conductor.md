---
description: 🎼 CLI Conductor — Gọi Gemini CLI phân tích, lên chiến lược, và review code project-wide
---

# /conductor — Two-Agent Orchestration Workflow

> Antigravity chủ động gọi Gemini CLI (headless) khi cần tầm nhìn toàn project.
> CLI chạy quota pool riêng → nhân đôi AI capacity.

// turbo-all

---

## Sub-commands

### `/conductor:analyze` — Phân tích project-wide

1. Xác định project root (dùng `.project-identity` hoặc `CODEBASE.md`)
2. Thông báo user: "📡 Đang gọi Gemini CLI phân tích cấu trúc project..."
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 60 gemini -p "Analyze the project structure. List main modules, their responsibilities, key files, and dependencies. Be concise." --approval-mode plan 2>/dev/null
```
4. Parse output → tóm tắt cho user
5. Nếu project có `conductor/tracks.md` → cập nhật
6. Nếu chưa có `conductor/` → hỏi user có muốn tạo không

### `/conductor:track` — Tạo/cập nhật strategic track

1. Đọc `conductor/tracks.md` hiện tại (nếu có)
2. User mô tả mục tiêu chiến lược
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 60 gemini -p "Given this project context and goal: <GOAL>. Create a strategic track with: objectives, key milestones, and task breakdown. Current tracks: <EXISTING_TRACKS>" --approval-mode plan 2>/dev/null
```
4. Parse output → ghi vào `conductor/tracks.md`
5. Tạo Symphony tasks từ task breakdown (nếu user đồng ý)

### `/conductor:delegate` — Delegate task cho CLI xử lý

1. Xác định task cần CLI (phân tích, review, generate)
2. Build prompt với context đầy đủ
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 60 gemini -p "<TASK_PROMPT>" --approval-mode plan 2>/dev/null
```
4. Nhận kết quả → tích hợp vào workflow hiện tại
5. Tiếp tục code/debug với insights từ CLI

### `/conductor:review` — Pre-commit review qua CLI

1. Lấy diff: `git diff --staged` hoặc `git diff`
2. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 60 gemini -p "Review these code changes for bugs, security issues, and best practices: $(git diff --staged --stat)" --approval-mode plan 2>/dev/null
```
3. Parse output → báo cáo issues cho user
4. Nếu clean → suggest `git commit`

### `/conductor:setup` — Khởi tạo conductor infrastructure

1. Tạo thư mục `conductor/` tại project root
2. Copy template `conductor-tracks.md` → `conductor/tracks.md`
3. Thêm `conductor/` vào `.gitignore` (nếu user muốn)
4. Thông báo: "✅ Conductor infrastructure ready!"

---

## Fallback Rules

```yaml
cli_unavailable:
  - "⚠️ Gemini CLI không khả dụng, tiếp tục với Antigravity-only mode"
  - Do NOT block workflow

cli_timeout:
  - "⏳ CLI phân tích quá lâu (>60s), bỏ qua và tiếp tục"

cli_error:
  - Log error
  - Fall back gracefully
  - Suggest: "gemini --version" to check installation
```

---

## Communication

Mỗi khi gọi CLI, LUÔN thông báo user:
```
📡 Đang gọi Gemini CLI để [mục đích]...
```

Sau khi nhận kết quả:
```
✅ CLI phân tích xong. Tóm tắt: [key findings]
```
