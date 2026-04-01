---
description: 🔍 Codex Conductor — Gọi Codex CLI rà soát code, debug, review logic, và verify refactor
---

# /conductor-codex — Three-Agent Inspector Workflow

> Antigravity gọi Codex CLI (headless, read-only) khi cần rà soát chuyên sâu.
> Codex CHỈ ĐỌC + TẠO BÁO CÁO `.md`. KHÔNG BAO GIỜ sửa code.

// turbo-all

---

## Prerequisites

1. Kiểm tra Codex CLI:
```bash
which codex || echo "NOT_INSTALLED"
```
2. Nếu chưa cài → đề xuất cài:
```bash
npm i -g @openai/codex
```
3. Tạo thư mục report nếu chưa có:
```bash
mkdir -p codex-reports
```

---

## Sub-commands

### `/conductor-codex:debug` — Phân tích root cause bug

1. User mô tả bug (crash, lỗi logic, unexpected behavior)
2. Thông báo: "🔍 Đang gọi Codex CLI phân tích bug..."
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 120 codex "A bug was reported: <BUG_DESCRIPTION>. Analyze the codebase to find the root cause. List: (1) most likely root cause with file:line, (2) contributing factors, (3) suggested fix approach. DO NOT edit any files." --approval-mode suggest -q 2>/dev/null
```
4. Parse output → lưu vào `codex-reports/bug-analysis-<DATE>.md`
5. Tóm tắt findings cho user
6. Nếu critical → Antigravity thực hiện fix

### `/conductor-codex:review` — Pre-commit code review

1. Kiểm tra có uncommitted changes: `git diff --stat`
2. Thông báo: "🔍 Đang gọi Codex CLI review code..."
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 120 codex "Review the uncommitted changes in this repo. Check for: bugs, logic errors, edge cases, thread safety, security issues, performance problems. Rank issues by severity (critical/warning/info). DO NOT edit any files." --approval-mode suggest -q 2>/dev/null
```
4. Parse output → lưu vào `codex-reports/review-<DATE>.md`
5. Tóm tắt: issues found + severity
6. Nếu clean → suggest `git commit`

### `/conductor-codex:logic` — Phân tích logic & edge cases

1. Xác định file/module cần kiểm tra
2. Thông báo: "🔍 Đang gọi Codex CLI kiểm tra logic..."
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 120 codex "Analyze <FILE_OR_MODULE> for logic correctness. Focus on: edge cases (null, empty, boundary), race conditions, error handling gaps, unreachable code, off-by-one errors. List each issue with file:line and severity. DO NOT edit any files." --approval-mode suggest -q 2>/dev/null
```
4. Parse output → lưu vào `codex-reports/logic-analysis-<DATE>.md`
5. Tóm tắt findings cho user

### `/conductor-codex:test` — Generate test cases

1. Xác định feature/module cần test
2. Thông báo: "🔍 Đang gọi Codex CLI generate test cases..."
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 120 codex "Analyze <FILE_OR_MODULE> and generate a comprehensive list of test cases. Include: happy path, edge cases, error cases, boundary values. Format as markdown table with columns: Test Name | Input | Expected Output | Type. DO NOT edit any files." --approval-mode suggest -q 2>/dev/null
```
4. Parse output → lưu vào `codex-reports/test-cases-<DATE>.md`
5. Trình bày test plan cho user

### `/conductor-codex:plan-review` — Review implementation plan

1. Đọc `implementation_plan.md` hiện tại
2. Thông báo: "🔍 Đang gọi Codex CLI review plan..."
3. Gọi CLI:
```bash
cd <PROJECT_ROOT> && timeout 120 codex "Review this implementation plan in the current directory. Find: logic holes, missing error handling, security risks, race conditions, scalability issues, missing edge cases. Rate each issue by severity (critical/warning/info). DO NOT edit any files." --approval-mode suggest -q 2>/dev/null
```
4. Parse output → lưu vào `codex-reports/plan-review-<DATE>.md`
5. Tóm tắt issues → Antigravity cập nhật plan

---

## Fallback Rules

```yaml
cli_not_installed:
  - "⚠️ Codex CLI chưa cài. Chạy: npm i -g @openai/codex"
  - Offer to install automatically

cli_unavailable:
  - "⚠️ Codex CLI không khả dụng, tiếp tục với Antigravity-only"
  - Do NOT block workflow

cli_timeout:
  - "⏳ Codex phân tích quá lâu (>120s), bỏ qua và tiếp tục"

cli_error:
  - Log error
  - Fall back gracefully
  - Suggest: "codex --version" to check installation
```

---

## Communication

Mỗi khi gọi CLI, LUÔN thông báo user:
```
🔍 Đang gọi Codex CLI để [mục đích]...
```

Sau khi nhận kết quả:
```
✅ Codex rà soát xong. Báo cáo: codex-reports/<file>.md
📊 Tóm tắt: [key findings]
```
