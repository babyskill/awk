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

## Execution Phase: Delegate to Gemini CLI

Thực thi workflow bằng cách gọi Gemini CLI để tận dụng LLM phân tích chuyên sâu mà không làm ảnh hưởng context của Antigravity. Gemini CLI sẽ tự check file, tính toán delta và cập nhật `CODEBASE.md`.

> [!IMPORTANT]
> CODEBASE.md dùng **compact format** dạng bảng.
> KHÔNG dùng format verbose (multi-line per file).

```bash
gemini -p "Đọc CODEBASE.md, git log (14 ngày gần nhất), và brain/session.json. So sánh để tìm các file mới/bị sửa nhưng chưa có trong CODEBASE.md. Suy luận Layer và Purpose cho mỗi file. Sinh ra Delta dưới dạng bảng (compact format) và APPEND vào CODEBASE.md. Cập nhật ngày Last Updated." --approval-mode auto
```

**Output mong đợi từ Gemini CLI:**
```
✅ CODEBASE.md Synced!

  📊 Added: [K] new entries
  📁 Sections updated: [list]
  🕐 Last Updated: [current date]
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
