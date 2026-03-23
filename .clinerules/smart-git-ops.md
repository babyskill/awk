---
description: 🤖 Tự động hóa git workflow hoàn chỉnh (audit → commit → push → telegram report)
---

# /smart-git-ops - Complete Git Automation

**Tự động hóa toàn bộ:** Audit → Semantic Commit → Push → Telegram Report

---

## Phase 1: Pre-Commit Audit

// turbo
```bash
# Run audit to check for issues
echo "🔍 Running pre-commit audit..."
```

**Note:** Nếu audit phát hiện 🔴 Critical issues → DỪNG workflow.

---

## Phase 2: Status & Smart Staging

// turbo
```bash
git status
git diff --stat

# Auto-stage known safe paths
git add src/ app/ lib/ docs/ tests/ *.swift *.kt *.ts *.tsx
```

---

## Phase 3: Generate Semantic Commit

**Logic:**
1. Phân tích thay đổi từ `git diff --staged`
2. Tự động tạo commit message theo format: `type(scope): subject`
3. Hiển thị message → User xác nhận (timeout 5s = auto-approve)

**Example Output:**
```
📝 Proposed commit message:
   feat(social): add following list view with real-time sync

   ✅ Accept (Enter) | ❌ Edit (E)
```

---

## Phase 4: Commit

// turbo
```bash
git commit -m "<generated-message>"
```

---

## Phase 5: Pre-Push Verification (Optional)

```bash
# Optional: Run quick build/lint if configured
# Skip for docs-only changes
```

---

## Phase 6: Push

// turbo
```bash
git pull --rebase origin HEAD 2>/dev/null || true
git push origin HEAD
```

---

## Phase 7: Telegram Report 📨

**Mục đích:** Sau khi push thành công, tự động tóm tắt các thay đổi và gửi báo cáo vào Telegram group.

**Logic:**
1. Lấy thông tin commit vừa push:
   ```bash
   COMMIT_HASH=$(git log -1 --format='%h')
   COMMIT_MSG=$(git log -1 --format='%s')
   BRANCH=$(git branch --show-current)
   AUTHOR=$(git log -1 --format='%an')
   FILES_CHANGED=$(git diff --stat HEAD~1 HEAD | tail -1)
   REPO_NAME=$(basename $(git rev-parse --show-toplevel))
   ```

2. Tạo message tóm tắt (Markdown):
   ```
   🚀 *Git Push Report*
   
   📦 *Repo:* `{REPO_NAME}`
   🌿 *Branch:* `{BRANCH}`
   🔖 *Commit:* `{COMMIT_HASH}`
   👤 *Author:* {AUTHOR}
   
   📝 *Message:* {COMMIT_MSG}
   📊 *Changes:* {FILES_CHANGED}
   🕐 *Time:* {timestamp}
   ```

3. Gửi qua `awkit tg send`:
   // turbo
   ```bash
   awkit tg send --parse-mode md "<generated-report>"
   ```

**Fallback:** Nếu `awkit tg send` fail (chưa config), hiển thị hướng dẫn:
```
⚠️ Telegram chưa được cấu hình. Chạy: awkit tg setup
```

---

## 🎛️ Configuration

User có thể config trong `.gemini/config.json`:
```json
{
  "smart_git_ops": {
    "auto_approve_timeout": 5,
    "run_audit": true,
    "run_tests_before_push": false,
    "telegram_report": true
  }
}
```

---

## ⚠️ NEXT STEPS

Sau khi push & report thành công:
```
1️⃣ Xem commit log (`git log --oneline -3`)
2️⃣ Đóng task trong Symphony (`symphony_complete_task(task_id)`)
3️⃣ Tiếp tục task tiếp theo (`/next`)
```
