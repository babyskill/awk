---
name: code-review
description: Use when completing tasks, implementing features, or before merging. Dispatch structured code review with severity classification. Auto-triggers after task completion in subagent-driven or single-flow execution.
---

<!-- ⚠️ REVIEW GATE — Spec compliance FIRST, then code quality. No merge without review. -->

# Code Review

## Overview

Review early, review often. Catch issues before they cascade.

**Core principle:** Structured review with actionable, severity-classified feedback.

## When to Request Review

**Mandatory:**
- After completing each task in execution flow
- After implementing major feature or fix
- Before merge to main branch
- Before deploy to production

**Optional but valuable:**
- When stuck (fresh perspective helps)
- Before refactoring (baseline check)
- After fixing complex bug

## The Review Process (Execution via Codex CLI)

Thay vì tự đọc diff và đánh giá, Antigravity **BẮT BUỘC** gọi `codex` CLI để thực hiện Code Review nhằm mở rộng Context Window và sử dụng subagent chuyên dụng.

Có 3 chế độ review chính tùy theo bối cảnh:

### 1. Review Toàn Bộ Codebase (Full Review)
Sử dụng khi cần đánh giá tổng thể dự án, review architecture, security, hoặc chuẩn bị big release.
```bash
codex -p "Review toàn bộ codebase. Tập trung kiểm tra tính nhất quán kiến trúc (architecture), rủi ro bảo mật (security) và hiệu suất (performance)." --approval-mode auto
```

### 2. Review Những Thay Đổi (Changes / Diff Review)
Sử dụng khi vừa hoàn thành xong code một tính năng hoặc fix bug (các thay đổi workspace, stashed, unstaged, hoặc dải diff ngắn).
```bash
codex -p "Review những thay đổi hiện tại (git diff/staged). Tập trung kiểm tra logic, edge cases và conventions." --approval-mode auto
```

### 3. Review Commit Cụ Thể (Specific Commit)
Sử dụng khi cần review một nhánh git, PR, hoặc một commit hash cụ thể.
```bash
codex -p "Review commit <commit_hash> (hoặc range main..HEAD). Tập trung đánh giá xem code có giải quyết đúng vấn đề và compliance với Spec không." --approval-mode auto
```

### Cách Xử Lý Output Từ Codex
1. Fix 🔴 **Critical** issues NGAY LẬP TỨC.
2. Fix 🟡 **Important** issues trước khi kết thúc task hoặc chuyển sang Phase mới.
3. Log 🟢 **Minor** issues để cấu trúc lại sau.
4. Proceed nếu Subagent Codex báo "LGTM" hoặc không có issue nào nghiêm trọng.

## Two-Stage Review (Subagent-Driven)

For automated execution, run TWO separate review passes:

### Stage 1: Spec Compliance Review
```
- Does the code implement ALL requirements from the spec/plan?
- Is anything MISSING from the spec?
- Is anything EXTRA that wasn't specified (scope creep)?
- Does behavior match expected output for each requirement?
```

### Stage 2: Code Quality Review
```
- Is the code clean, readable, and well-structured?
- Are there any thread safety issues?
- Is error handling comprehensive?
- Are there performance concerns?
- Does it follow project coding conventions?
- Are there any security vulnerabilities?
```

**Order matters:** Spec compliance FIRST, then code quality. No point reviewing quality of wrong code.

## Self-Review Checklist (Before Requesting External Review)

Before asking for review, verify yourself:

- [ ] All requirements from plan/spec addressed
- [ ] No TODO/FIXME/HACK left unresolved  
- [ ] Error handling for all failure paths
- [ ] No hardcoded values that should be configurable
- [ ] Thread safety for shared state
- [ ] Localization for user-facing strings
- [ ] No print/debugPrint left in production code
- [ ] File sizes < 500 lines

## Integration

**Used by:**
- `single-flow-task-execution` — Review after each task
- `symphony-enforcer` — Review before `symphony_complete_task`

**Related skills:**
- `verification-gate` — Run tests BEFORE requesting review
- `systematic-debugging` — If review reveals bugs

## Anti-Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It's a small change" | Small changes cause big bugs |
| "Tests pass so it's correct" | Tests ≠ requirements. Review catches logic gaps |
| "I'm confident in this code" | Confidence ≠ correctness |
| "No time for review" | 5 min review saves 2 hours debugging |
| "I'll review it later" | Later never comes. Review now |
| "Only I understand this code" | That's exactly why someone else should review |
