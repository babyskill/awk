---
name: symphony-enforcer
description: |
  Mandatory Symphony checkpoint system. Ensures AI never forgets to create,
  update, or complete tasks in Symphony. Enforces progress reporting at every
  milestone and auto-detects task completion without waiting for user confirmation.
  v3.3: Completion Status Protocol, Search-Before-Building, Boil-the-Lake.
metadata:
  stage: core
  version: "3.3"
  replaces: "v2.0"
  requires: symphony-orchestrator
  tags: [symphony, enforcement, checkpoint, task-lifecycle, core, spec-first, auto-next]
agent: Symphony Enforcer
allowed-tools:
  - symphony_create_task
  - symphony_claim_task
  - symphony_complete_task
  - symphony_report_progress
  - symphony_available_tasks
  - symphony_status
trigger: always
invocation-type: auto
priority: 1
---

# Symphony Enforcer v3.3 — Completion Status Protocol + Gstack Principles

> **Purpose:** Đảm bảo AI KHÔNG BAO GIỜ quên cập nhật Symphony.
> **Key Changes v3.3:**
> - **Completion Status Protocol**: 4-status (DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT)
> - **Design Compliance (TP1.5)**: Đối chiếu schema changes vs approved design doc
> - **Pre-Plan Gate**: Đọc spec trước khi plan, hỏi user về constraints
> - **Auto-Lifecycle**: Liên kết task_boundary ↔ Symphony tự động
> - **Auto-Next**: BẮT BUỘC gợi ý next steps sau mỗi task done
> - **Atomic Git Commits**: Tự động commit sau mỗi task done
> **Principle:** AI tự detect completion — user KHÔNG CẦN nói "xong".

---

## ⚠️ Core Rule

```
KHÔNG CÓ NGOẠI LỆ:
- Mọi code/debug/plan task PHẢI qua STRICT STARTUP PROTOCOL
- Mọi milestone PHẢI report progress
- AI tự detect completion và auto-complete task
- Task done → PHẢI atomic git commit trước khi suggest next
- Kết thúc task PHẢI kèm next suggestion
- BỎ QUA BẤT KỲ STEP NÀO = VI PHẠM
```

---

## 🔒 STRICT STARTUP PROTOCOL (BẮT BUỘC)

Mỗi khi bắt đầu task code/debug/plan, AI PHẢI đi qua **5 steps tuần tự**.
KHÔNG được bắt đầu work cho đến khi TẤT CẢ steps ✅.

### Step 1: Project Identity — `.project-identity`

```
→ Kiểm tra: file .project-identity có tồn tại?
→ CÓ  → Đọc projectId, projectName
→ KHÔNG → ⛔ DỪNG. Hỏi user hoặc tạo .project-identity.
→ Output: "📋 Step 1/5: Project Identity ✅ — {projectId}"
```

### Step 2: NeuralMemory Brain — Switch brain

```
→ nmem brain use <projectId>
→ nmem_recap(level=1) — load context
→ Output: "🧠 Step 2/5: Brain ✅ — switched to {projectId}"
```

### Step 3: Spec Alignment — Đọc Project Spec (NEW v3.0)

```
→ Kiểm tra: docs/specs/PROJECT.md tồn tại?
→ CÓ  → Đọc silent: PROJECT.md + TECH-SPEC.md + REQUIREMENTS.md
       → Extract constraints liên quan đến task hiện tại
       → NẾU PLANNING mode:
          - Hỏi user 1-3 câu về constraints/UX cụ thể của feature
          - Ví dụ: "Feature này cần offline support không?"
          - Ví dụ: "UI nên dạng list hay cards?"
       → Output: "📐 Step 3/5: Spec Aligned ✅"
→ KHÔNG → Skip (project chưa /init) → "📐 Step 3/5: No spec — skipped"
```

> **Quan trọng:** Nếu TECH-SPEC.md có "Constraints & Non-Negotiables",
> AI PHẢI tuân thủ chúng trong implementation_plan.md.

### Step 4: Symphony Task — Tạo hoặc nhận task

```
→ symphony_available_tasks(filter="my") → check active tasks
→ CÓ task in_progress phù hợp → dùng tiếp
→ CÓ task ready phù hợp → symphony_claim_task
→ KHÔNG CÓ → symphony_create_task(title) → symphony_claim_task(new_id)
→ Lưu task_id cho TP1-TP4
→ Output: "🎯 Step 4/5: Task ✅ — #sym-XYZ claimed"
```

### Step 5: Confirmation Block

```
🚦 STARTUP PROTOCOL COMPLETE
══════════════════════════════════════
  Step 1: 📋 Project Identity  ✅  {projectId}
  Step 2: 🧠 NeuralMemory      ✅  brain: {projectId}
  Step 3: 📐 Spec Alignment     ✅  {constraints_count} constraints loaded
  Step 4: 🎯 Task              ✅  #sym-XYZ — "{title}"
  Step 5: ✅ READY TO WORK
══════════════════════════════════════
```

> ⛔ **Nếu KHÔNG hiển thị confirmation block = VI PHẠM**

---

## Auto-Lifecycle: task_boundary ↔ Symphony (NEW v3.0)

```
LIÊN KẾT TỰ ĐỘNG:
- task_boundary(PLANNING)  → symphony_create_task (nếu chưa có)
- task_boundary(EXECUTION) → symphony_report_progress(40%)
- task_boundary(VERIFICATION) → symphony_report_progress(80%)
- notify_user(BlockedOnUser=false) → TRIGGER TP2 (completion check)
```

AI PHẢI giữ `current_task_id` xuyên suốt session.
Mỗi lần gọi `task_boundary` với mode mới → đồng thời report progress.

---

## Trigger Points

### TP1: Progress Milestone

**Khi nào:** Milestone xảy ra:
- Chuyển mode: PLANNING → EXECUTION → VERIFICATION
- Gọi `notify_user` (TRƯỚC khi gọi)
- Hoàn thành 1 component/file lớn
- Phát hiện vấn đề cần thay đổi approach

**Action:**
```
symphony_report_progress(
  task_id=current_task,
  progress=estimated_percentage,
  last_action="mô tả ngắn"
)
```

**Progress Guide:**
```
  10% — Task created, đang research/đọc code
  25% — Implementation plan approved
  40% — Bắt đầu code changes
  60% — Code changes xong, đang test
  80% — Tests pass, đang verification
  90% — Walkthrough/docs tạo xong
 100% — Hoàn thành (auto-trigger TP2)
```

**Enforcement:**
- ❌ KHÔNG được gọi `notify_user` mà chưa `report_progress` trước đó
- ❌ KHÔNG được chuyển mode (task_boundary) mà chưa report

---

### TP1.5: Design Compliance Check (NEW v3.2 — Gate 4 Enforcement)

**Khi nào:** Mỗi khi AI sửa file liên quan đến DB/Model/Schema trong EXECUTION mode.

**Trigger signals:**
```
File patterns:
  - **/models/**,  **/entities/**,  **/schemas/**
  - **Migration*, **Schema*, **Model*
  - *.entity.*, *.model.*, *.schema.*
  - Database.swift, AppDatabase.swift, schema.prisma, etc.
```

**Action:**
```
1. Kiểm tra: docs/architecture/<feature>_design.md tồn tại?
   → KHÔNG → ⚠️ Warning: "Đang sửa model file nhưng chưa có approved design.
     Recommend chạy spec-gate trước."
     → Nếu COMPLEX task → ⛔ DỪNG, enforce Gate 2
     → Nếu TRIVIAL/MODERATE → Warning only, tiếp tục

2. Đối chiếu thay đổi vs approved design:
   → Thêm field KHÔNG có trong design? → ⛔ DỪNG
   → Đổi type khác design? → ⛔ DỪNG
   → Xóa field trong design? → ⛔ DỪNG
   → Thêm field CÓ trong design? → ✅ OK

3. Khi DỪNG:
   → Thông báo: "Schema change ngoài approved design detected.
     [field_name] không có trong docs/architecture/<feature>_design.md.
     Quay lại Gate 2 để update design trước nhé."
   → Kích hoạt spec-gate skill để update design doc
   → Sau khi re-approve → tiếp tục code
```

**Enforcement:**
- ❌ KHÔNG tự ý thêm cột/bảng ngoài approved design cho COMPLEX tasks
- ✅ NÊN ghi lại mọi deviation attempt vào NeuralMemory cho future reference

---

### TP2: Task Complete — Completion Status Protocol

**Khi nào:** AI detect ≥2/4 completion signals:

```
Signal 1: Final notify_user với BlockedOnUser=false
Signal 2: Walkthrough artifact đã tạo
Signal 3: Tất cả checklist items trong task.md đã [x]
Signal 4: Verification pass (tests OK, build OK)
```

**Completion Status Protocol (4 statuses):**

```
DONE:
  Điều kiện: Verification pass, không caveats.
  Action: symphony_complete_task với evidence.
  Format: "✅ DONE — {summary}. Build: ✅. Tests: ✅ N/N."

DONE_WITH_CONCERNS:
  Điều kiện: Code hoạt động nhưng có caveats/risks cần biết.
  Action: Complete task NHƯNG ghi rõ concerns.
  Format: "⚠️ DONE_WITH_CONCERNS — {summary}.
    Concerns: [list cụ thể]
    Risk: [mức độ ảnh hưởng]
    Recommendation: [đề xuất xử lý]"
  Ví dụ: "Feature works nhưng chưa handle offline mode."
  Ví dụ: "API call thành công nhưng chưa có retry logic."

BLOCKED:
  Điều kiện: Không thể tiếp tục vì external dependency/blocker.
  Action: KHÔNG complete task. Report + list attempts.
  Format: "🚫 BLOCKED — {reason}.
    Attempted: [list things đã thử]
    Needs: [what's needed to unblock]"
  Ví dụ: "API endpoint return 500, đã retry 3 lần."

NEEDS_CONTEXT:
  Điều kiện: Thiếu thông tin từ user để tiếp tục.
  Action: KHÔNG complete task. Hỏi user cụ thể.
  Format: "❓ NEEDS_CONTEXT — {what's missing}.
    Question: [câu hỏi cụ thể]
    Options: [list options nếu có]"
  Ví dụ: "Cần user clarify: offline-first hay online-only?"
```

⛔ **KHÔNG BAO GIỜ report DONE nếu thực tế là DONE_WITH_CONCERNS hoặc BLOCKED.**

**Action (cho DONE status):**
```
0. ⚡ VERIFICATION GATE (BẮT BUỘC — Iron Law):
   - IDENTIFY: What command proves this task is done?
   - RUN: Execute verification (build, test, lint)
   - READ: Full output, check exit code
   - VERIFY: Does output confirm completion?
   - If NO → FIX trước, KHÔNG complete task
   - If YES → Proceed with evidence
   ⛔ Skip verification = VI PHẠM (xem verification-gate skill)

1. symphony_complete_task(
     task_id=current_task,
     summary="mô tả ngắn + STATUS + VERIFICATION EVIDENCE"
     // ✅ "DONE — Implemented X. Build: ✅ exit 0. Tests: ✅ 47/47."
     // ✅ "DONE_WITH_CONCERNS — Implemented X. Build: ✅. Concerns: no offline support."
     // ❌ "Implemented X" (không status, không evidence)
   )
2. Hiển thị: "✅ SYM #sym-XYZ — {STATUS}"
3. → TRIGGER TP2.5 (Atomic Git Commit)
4. → TRIGGER TP4 (Auto-Next) NGAY LẬP TỨC
```

---

### TP2.5: Atomic Git Commit (NEW v3.1 — BẮT BUỘC)

**Khi nào:** Ngay sau TP2 (task completed), TRƯỚC TP4 (Auto-Next).
Chỉ trigger khi task có code changes (có files_changed).

**Action:**
```
1. Kiểm tra: git status --porcelain
   → Nếu KHÔNG CÓ changes → skip ("📝 No code changes to commit")
   → Nếu CÓ changes → tiếp tục

2. Xác định commit type từ task context:
   → PLANNING/EXECUTION mới → "feat"
   → Debug/fix → "fix"
   → Refactor/cleanup → "refactor"
   → Docs/specs → "docs"

3. Tạo commit message theo Conventional Commits:
   → Format: "{type}({scope}): {task_summary_ngắn}"
   → scope = module/feature name (từ task title)
   → Ví dụ: "feat(auth): implement login with Firebase"
   → Ví dụ: "fix(camera): resolve 10s delay on tab switch"

4. Stage & commit:
   → git add <files_changed từ symphony_complete_task>
   → Nếu không rõ files → git add -A (thận trọng)
   → git commit -m "{message}"

5. Hiển thị:
   🔀 Atomic Commit: {short_hash} — "{message}"
   📁 {N} files changed

6. ⚠️ KHÔNG AUTO-PUSH:
   → Chỉ commit local
   → Push = yêu cầu user confirm hoặc dùng /smart-git-ops
```

**Enforcement:**
- ❌ KHÔNG được auto-push (chỉ commit local)
- ❌ KHÔNG được commit nếu có unresolved merge conflicts
- ❌ KHÔNG được commit files ngoài scope task
- ✅ NÊN commit ngay khi task done — đừng để accumulate
- ✅ Mỗi task = 1 commit (atomic, traceable)

---

### TP3: Abandoned / Context Switch

**Khi nào:**
- User đổi topic sang task khác hoàn toàn
- AI bị lỗi/timeout giữa chừng
- User explicitly nói dừng task

**Action:**
```
symphony_abandon_task(task_id=current_task, reason="...")
```

---

### TP4: Auto-Next Suggestion (NEW v3.0 — BẮT BUỘC)

**Khi nào:** Ngay sau TP2 (task completed). KHÔNG ĐƯỢC BỎ QUA.

**Action:**
```
1. ĐỌC projectId từ .project-identity (đã có từ Step 1)
2. symphony task list -P <projectId> -s ready (CHỈ tasks cùng project)
   ⚠️ TUYỆT ĐỐI KHÔNG dùng filter="ready" không có project filter
   ⚠️ Dùng CLI: symphony task list -P <projectId> -s ready
   ⚠️ Hoặc MCP: symphony_available_tasks + parse project field
3. Lọc top 2-3 ready tasks theo priority
4. Present cho user:

   ➡️ NEXT STEPS ({projectName})
   ─────────────────────────────────
   📋 #sym-A1 — Auth Module (P0, ready)
   📋 #sym-A2 — Dashboard UI (P1, ready)
   
   Bạn muốn tiếp tục với task nào?

5. Nếu KHÔNG CÓ ready tasks trong project hiện tại:
   "✨ Không còn task ready cho {projectName}! Tạo task mới hoặc chuyển phase."
```

**Enforcement:**
- ❌ KHÔNG được kết thúc conversation mà KHÔNG present next suggestion
- ❌ KHÔNG được show tasks từ project khác
- Nếu quên filter projectId → vi phạm nghiêm trọng (cross-project contamination)

---

## XML Task Spec trong Implementation Plans (NEW v3.0)

Khi PLANNING mode tạo `implementation_plan.md`, MỖI task NÊN dùng XML format:

```xml
<task type="auto">
  <name>Task name</name>
  <files>file1.swift, file2.swift</files>
  <spec_ref>REQUIREMENTS.md § R1</spec_ref>
  <depends_on>none</depends_on>
  <action>Specific instructions</action>
  <verify>How to verify completion</verify>
  <done>Expected final state</done>
</task>
```

Template đầy đủ: `~/.gemini/antigravity/templates/specs/task-spec-template.xml`

Lợi ích:
- AI parse chính xác hơn markdown
- `<spec_ref>` ép buộc liên kết với project spec
- `<depends_on>` cho phép wave grouping (parallel execution)
- `<verify>` built-in verification step

---

## Ngoại lệ — Khi nào KHÔNG cần Startup Protocol

```
- Simple Q&A: Câu hỏi đơn giản, giải thích concept
- Quick lookup: Đọc file, search code, không sửa gì
- User nói rõ bỏ qua: "skip symphony", "không cần task"
```

---

## Sync Block Format

```
🎯 SYM #sym-XYZ — 40% → 70% "Implemented auth module"
```

Nếu completed:
```
✅ SYM #sym-XYZ — Done "Auth module with tests"
➡️ Next: #sym-A1 — Dashboard UI (P1)
```

---

## Edge Cases

| Tình huống | Xử lý |
|-----------|--------|
| Project chưa có .project-identity | ⛔ Dừng, tạo file trước |
| Project chưa có docs/specs/ | Skip Step 3, tiếp tục |
| Symphony server down | Start server, retry. Nếu fail → warning + tiếp tục |
| User follow-up nhỏ sau task done | ≤2 file changes → không cần task mới |
| Nhiều task cùng lúc | Track task_id riêng, report đúng task |
| User reopen task đã complete | Claim lại, resume từ progress cuối |
| Không có ready tasks cho TP4 | Gợi ý tạo phase tiếp theo |

---

## Learnings

- AI quên Symphony vì nó là "side task" — strict protocol biến nó thành MAIN flow
- Step-by-step sequential = AI không thể skip
- Confirmation block = visual proof cho user
- User KHÔNG muốn nói "xong" — AI phải tự detect completion
- Pre-Plan Discussion giúp plan đúng hướng từ đầu (learned from GSD)
- XML task format chính xác hơn markdown cho AI parsing (learned from GSD)
- Auto-Next giữ momentum — user không cần tự tìm task tiếp theo
- Spec alignment tránh plan bị lệch khỏi project constraints
- Atomic commits giúp rollback chính xác — 1 task = 1 commit (learned from GSD)
- KHÔNG auto-push — chỉ commit local, push cần user confirm
