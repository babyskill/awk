---
description: 🤖 Tự động hóa git workflow hoàn chỉnh (audit → commit → push)
---

# /smart-git-ops - Complete Git Automation

**Tự động hóa toàn bộ:** Audit → Semantic Commit → Push

---

## Phase 1: Pre-Commit Audit

// turbo
```bash
# Run audit to check for issues
echo "🔍 Running pre-commit audit..."
```

**Note:** Nếu audit phát hiện 🔴 Critical issues → DỪNG workflow.

---

## Phase 2: Status & Staging

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

## 🎛️ Configuration

User có thể config trong `.gemini/config.json`:
```json
{
  "smart_git_ops": {
    "auto_approve_timeout": 5,
    "run_audit": true,
    "run_tests_before_push": false
  }
}
```

---

## ⚠️ NEXT STEPS

Sau khi push thành công:
```
1️⃣ Xem commit log (`git log --oneline -3`)
2️⃣ Đóng task Beads liên quan (`bd update <id> --status done`)
3️⃣ Tiếp tục task tiếp theo (`/next`)
```
