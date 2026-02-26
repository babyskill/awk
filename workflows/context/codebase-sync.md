---
description: Đồng bộ CODEBASE.md với codebase thực tế — cập nhật delta, không rewrite toàn bộ
---

# /codebase-sync Workflow

> **Mục đích:** Giữ CODEBASE.md luôn up-to-date với codebase thực tế.
> **Nguyên tắc:** Chỉ append/update delta — không xóa thông tin cũ.
> **Trigger:** Gate 2 (file mới tạo), user gõ /codebase-sync, hoặc AI thấy outdated.

---

## Triggers (Khi nào chạy)

```
AUTO triggers:
  - Gate 2 hoàn thành + needs_codebase_sync = true trong session.json
  - AI biết file không có trong CODEBASE.md (từ orchestrator W6 flag)

MANUAL trigger:
  - User gõ: /codebase-sync
```

---

## Phase 1: Assess Current State

```bash
# 1. Đọc CODEBASE.md hiện tại
cat CODEBASE.md

# 2. Check git: files changed/added gần đây (14 ngày)
git log --since="14 days ago" --name-only --pretty=format: | sort -u | grep -v '^$'

# 3. Lấy session file edits từ memory-sync W6
cat brain/session.json | grep files_touched_this_session

# 4. Check new files không có trong CODEBASE.md
# AI tự compare danh sách git + session với entries trong CODEBASE.md
```

**Output:**
```
📊 CODEBASE Sync Assessment:
  - Files in CODEBASE.md: [N files documented]
  - New/changed files (14d): [M files]
  - Missing from CODEBASE.md: [K files listed]
  - Last updated: [date from CODEBASE.md]
```

---

## Phase 2: Generate Delta

Với mỗi file thiếu trong CODEBASE.md, AI tự suy luận:

```yaml
for each missing_file:
  1. Xác định layer:
     - App/ → App Layer
     - Core/Domain/ → Domain Layer
     - Core/Data/ → Data Layer
     - Core/Services/ → Services Layer
     - Features/[X]/ → Features Layer
     - Presentation/Views/ → Views
     - Presentation/ViewModels/ → ViewModels

  2. Xác định responsibility từ:
     - Filename (AuthenticationViewModel → Auth UI logic)
     - Directory (Core/Domain/UseCases → Business logic)
     - Content (nếu cần, đọc file — chỉ khi không đủ context)

  3. Generate entry:
     - File: path/to/File.swift
     - Layer: [layer name]
     - Purpose: [1-line description]
     - Key exports: [main class/struct/func]

  4. Xác định section trong CODEBASE.md phù hợp để append
```

---

## Phase 3: Update CODEBASE.md

```yaml
MO:
  - APPEND vào đúng section, không xóa gì cũ
  - Update "Last Updated" timestamp
  - Nếu thêm feature mới → thêm section mới

Format mỗi entry thêm vào:
  #### [FileName.swift]
  **Layer:** [Layer name]
  **Purpose:** [Description]
  **Key class/struct:** `ClassName`

Footer update:
  **Last Updated**: [current date]
  **Sync:** Auto-updated via /codebase-sync
```

**Preview trước khi apply:**
```
📝 Sẽ thêm [K] entries vào CODEBASE.md:
  + Core/Services/PushNotificationService.swift → Services Layer
  + Features/WeeklyGoal/ViewModels/WeeklyGoalViewModel.swift → Features
  + Presentation/Views/Dashboard/CombinedDashboardHeader.swift → Views

Apply? [auto-yes nếu < 10 entries / confirm nếu lớn hơn]
```

---

## Phase 4: Update Session State

```json
// brain/session.json — reset sau khi sync
{
  "codebase_last_synced": "2026-02-24T08:35:00Z",
  "files_touched_this_session": [],
  "needs_codebase_sync": false
}
```

---

## Output Summary

```
✅ CODEBASE.md Synced!

  📊 Added: [K] new entries
  📁 Sections updated: [list]
  🕐 Last Updated: 2026-02-24

💡 Next: AI sẽ dùng CODEBASE.md mới trong session tiếp theo
   → Không cần scan cấu trúc thủ công nữa
```

---

## Error Handling

```yaml
No CODEBASE.md found:
  → AI tạo mới từ đầu bằng cách scan project structure
  → Template dựa theo architecture trong .project-identity

No .git found:
  → Fallback: dùng session.json files_touched_this_session
  → Scan core directories thủ công (App/, Core/, Features/, Presentation/)

CODEBASE.md quá outdated (> 30 ngày):
  → Warn: "CODEBASE.md rất cũ, nên rebuild toàn bộ?"
  → Option A: Rebuild full (scan toàn bộ)
  → Option B: Chỉ update delta 14 ngày gần nhất
```

---

*codebase-sync v1.0 — Delta-based CODEBASE.md Synchronizer*
*Created by Kien AI*
