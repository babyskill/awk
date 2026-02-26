---
description: 📤 Commit & push code an toàn
---

# /git-commit-workflow - Commit Message Standards

## 🎯 Mục đích
Tạo commit message chuẩn semantic và thực hiện git operations an toàn.

## 📋 Prerequisite
**BẮT BUỘC:** Phải chạy `/audit` trước khi commit.

---

## Phase 1: Stage Changes

// turbo
```bash
# Check status
git status

# Stage files (avoid git add .)
git add <specific-files>

# Verify staged changes
git diff --staged
```

---

## Phase 2: Generate Commit Message

**Format:** `<type>(<scope>): <description>`

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no behavior change)
- `style`: Formatting, whitespace
- `docs`: Documentation only
- `test`: Add/update tests
- `chore`: Maintenance, dependencies

### Examples:
```
feat(auth): implement biometric login
fix(payment): resolve subscription renewal issue
refactor(analytics): extract tracking logic to service
docs(readme): update installation instructions
```

---

## Phase 3: Commit & Push

// turbo
```bash
# Commit with semantic message
git commit -m "<generated-message>"

# Pull rebase if needed (shared branch)
git pull --rebase origin <branch>

# Push
git push origin <branch>
```

---

## 🤖 Agent Rules

1. **NEVER commit broken code**
2. **ALWAYS suggest commit message** and wait for user confirmation
3. **IF `/audit` not run yet** → Run it first
4. **Auto-generate semantic commit message** based on changed files
