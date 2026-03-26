---
name: symphony-enforcer
description: |
  Mandatory Symphony checkpoint system. Ensures AI never forgets to create,
  update, or complete tasks in Symphony. Enforces progress reporting at every
  milestone and auto-detects task completion without waiting for user confirmation.
  v3.5: UI-First Three-Phase Execution with User Test Checkpoints.
metadata:
  stage: core
  version: "3.6"
  replaces: "v3.5"
  requires: symphony-orchestrator
  tags: [symphony, enforcement, checkpoint, task-lifecycle, core, spec-first, auto-next, kiro, ui-first, user-test]
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

# Symphony Enforcer v3.6 — UI-First Three-Phase Execution + Legacy Cleanup

> **Purpose:** Đảm bảo AI KHÔNG BAO GIỜ quên cập nhật Symphony.
> **Key Changes v3.6:**
> - **Step 0.5: Legacy Artifact Cleanup**: Auto-detect stale `.symphony/tasks.json` and warn user
> - **Gate 4 Three-Phase Execution**: Phase A (Infra) → Phase B (UI Shell + User Test) → Phase C (Logic + User Test)
> - **TP1.7: User Test Checkpoint**: Trigger dừng lại cho user test trên device thật
> - **UI-First Task Ordering**: UI tasks PHẢI đi trước logic tasks trong Symphony
> - Kế thừa tất cả features v3.5 (Kiro, Completion Status, Design Compliance).
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
- BỎ QUA BẤT BẤT KỲ STEP NÀO = VI PHẠM
```

---

## 🔒 STRICT STARTUP PROTOCOL (BẮT BUỘC)

Mỗi khi bắt đầu task code/debug/plan, AI PHẢI đi qua **6 steps tuần tự**.
KHÔNG được bắt đầu work cho đến khi TẤT CẢ steps ✅.

### Step 0.5: Legacy Artifact Cleanup (AUTO — v3.6)

```
→ Kiểm tra: .symphony/tasks.json tồn tại?
→ CÓ  → ⚠️ CẢNH BÁO: "Legacy tasks.json detected. Symphony uses SQLite DB — this file is stale."
       → Khuyên user xoá: "rm .symphony/tasks.json"
       → KHÔNG tự xoá (safety guardrail) — chỉ cảnh báo.
       → Ghi log vào NeuralMemory: "Legacy tasks.json found at {project}, warned user."
→ KHÔNG → ✅ Clean (no legacy artifacts)
→ Output: "🧹 Step 0.5: Legacy Check ✅ — No stale artifacts"
```

> **Lý do:** Symphony v2+ sử dụng SQLite DB (`symphony.db`) làm single source of truth.
> File `tasks.json` là di sản từ phiên bản cũ (pre-SQLite). Nếu tồn tại song song sẽ gây
> "split-brain" — một nửa tool đọc JSON, một nửa đọc DB → dữ liệu lệch pha.

### Step 1: Project Identity — `.project-identity`

```
→ Kiểm tra: file .project-identity có tồn tại?
→ CÓ  → Đọc projectId, projectName
→ KHÔNG → ⛔ DỪNG. Hỏi user hoặc tạo .project-identity.
→ Output: "📋 Step 1/6: Project Identity ✅ — {projectId}"
```

### Step 2: NeuralMemory Brain — Switch brain

```
→ nmem brain use <projectId>
→ nmem_recap(level=1) — load context
→ Output: "🧠 Step 2/6: Brain ✅ — switched to {projectId}"
```

### Step 3: Spec Alignment — Đọc Project Spec (v3.4 + Kiro)

```
→ CHECK 1 (Kiro — HIGHEST PRIORITY): .kiro/specs/ tồn tại?
  → CÓ → Load specs từ .kiro/specs/:
     - .kiro/specs/<project>/requirements.md → project spec
     - .kiro/specs/<module>/requirements.md → module specs
     - .kiro/specs/<module>/design.md → architecture
     - .kiro/specs/<module>/tasks.md → task breakdown (cho Step 4)
     → Extract constraints liên quan đến task hiện tại
     → Output: "📐 Step 3/6: Kiro Specs Loaded ✅ — {N} modules, {M} design docs"

→ CHECK 2 (fallback): docs/specs/PROJECT.md tồn tại?
  → CÓ  → Đọc silent: PROJECT.md + TECH-SPEC.md + REQUIREMENTS.md
         → Extract constraints liên quan đến task hiện tại
         → NẾU PLANNING mode:
            - Hỏi user 1-3 câu về constraints/UX cụ thể của feature
            - Ví dụ: "Feature này cần offline support không?"
         → Output: "📐 Step 3/6: Spec Aligned ✅"
  → KHÔNG → Skip (project chưa /init) → "📐 Step 3/6: No spec — skipped"
```

> **Quan trọng:** Nếu .kiro/specs hoặc TECH-SPEC.md có "Constraints & Non-Negotiables",
> AI PHẢI tuân thủ chúng trong implementation_plan.md.

### Step 4: Symphony Task — Tạo hoặc nhận task

```
→ CHECK 1 (Kiro tasks): .kiro/specs/<module>/tasks.md tồn tại?
  → CÓ + chưa import → Parse task items từ tasks.md:
     - Group theo module name
     - Đánh tag kèm module name
     → ⛔ CẢNH BÁO: KHÔNG đồng bộ hàng loạt các item nhỏ này lên Trello (để tránh rác board). Chỉ đồng bộ lên cấp module hoặc feature lớn.
     → Output: "🎯 Step 4/6: Kiro Tasks Imported ✅ — {N} tasks created"
     → Claim task phù hợp nhất với user request
  → CÓ + đã import → symphony_available_tasks → claim task phù hợp

→ CHECK 2 (fallback): symphony_available_tasks(filter="my") → check active tasks
  → CÓ task in_progress phù hợp → dùng tiếp
  → CÓ task ready phù hợp → symphony_claim_task
  → KHÔNG CÓ → symphony_create_task(title) → symphony_claim_task(new_id)
→ Lưu task_id cho TP1-TP4
→ Output: "🎯 Step 4/6: Task ✅ — #sym-XYZ claimed"
```

### Step 5: Confirmation Block

```
🚦 STARTUP PROTOCOL COMPLETE
══════════════════════════════════════
  Step 0.5: 🧹 Legacy Check     ✅  No stale artifacts
  Step 1:   📋 Project Identity  ✅  {projectId}
  Step 2:   🧠 NeuralMemory      ✅  brain: {projectId}
  Step 3:   📐 Spec Alignment     ✅  {constraints_count} constraints loaded
  Step 4:   🎯 Task              ✅  #sym-XYZ — "{title}"
  Step 5:   ✅ READY TO WORK
══════════════════════════════════════
```

> ⛔ **Nếu KHÔNG hiển thị confirmation block = VI PHẠM**

---

## Auto-Lifecycle: task_boundary ↔ Symphony (v3.5)

```
LIÊN KẾT TỰ ĐỘNG:
- task_boundary(PLANNING)  → symphony_create_task (nếu chưa có)
- task_boundary(EXECUTION) → symphony_report_progress(40%)
- task_boundary(VERIFICATION) → symphony_report_progress(80%)
- notify_user(BlockedOnUser=false) → TRIGGER TP2 (completion check)

THREE-PHASE MAPPING (Gate 4 — COMPLEX tasks với UI):
- Phase A done (build OK)     → report_progress(25%) + checkpoint build
- Phase B done (UI mock)      → report_progress(45%) + TRIGGER TP1.7 (User Test)
- Phase C per-feature done    → report_progress(50-85%) + TRIGGER TP1.7 (User Test)
- Phase C all features done   → report_progress(90%) → Gate 5
```

AI PHẢI giữ `current_task_id` xuyên suốt session.
Mỗi lần gọi `task_boundary` với mode mới → đồng thời report progress.

---

## 🚨 Three-Phase Auto-Enforcement Protocol (BẮT BUỘC — v3.5)

> **Vấn đề:** AI không tự chủ động dùng Three-Phase nếu không bị ép.
> **Giải pháp:** Auto-detect + auto-announce + auto-enforce.

### Phase State Tracking

AI PHẢI duy trì trạng thái phase hiện tại xuyên suốt Gate 4:

```
current_phase = "A" | "B" | "C" | "none"
phase_b_confirmed = false | true
checkpoint_count = 0
```

### Auto-Detection: Khi nào kích hoạt Three-Phase?

Tại đầu Gate 4 (EXECUTION bắt đầu), AI PHẢI tự kiểm tra:

```
1. Task được triage là COMPLEX?
2. Task có UI component? (detect qua):
   → Symphony task title chứa: screen, view, UI, layout, dashboard, form
   → Implementation plan mentions: Composable, Fragment, Activity, Screen, View
   → Design doc tồn tại (docs/design/ hoặc docs/architecture/ có UI sections)
   → Spec references: wireframe, mockup, screenshot
   → Platform: Android/iOS/React Native/Flutter (hầu hết có UI)

Nếu CẢ HAI điều kiện thỏa:
   → BẮT BUỘC kích hoạt Three-Phase
   → Hiển thị Phase Announcement Block
```

### Phase Announcement Block (BẮT BUỘC)

Khi kích hoạt Three-Phase, AI PHẢI hiển thị:

```
🎯 THREE-PHASE EXECUTION ACTIVATED
══════════════════════════════════════
🏗️ Phase A: Infrastructure Setup
   → {list tasks for Phase A}
🎨 Phase B: UI Shell (Mock Data)
   → {list tasks for Phase B}
   → 🧪 USER TEST sau phase này
⚡ Phase C: Logic Integration
   → {list tasks for Phase C}
   → 🧪 USER TEST mỗi feature
══════════════════════════════════════
Bắt đầu Phase A...
```

### Phase Transition Triggers (TỰ ĐỘNG)

AI PHẢI tự động phát hiện khi chuyển phase:

```yaml
auto_triggers:
  phase_a_to_b:
    signal: Tất cả [INFRA] tasks đã done + build OK
    action: |
      - Announce: "🏗️ Phase A ✅ — Build thành công. Chuyển sang Phase B (UI Shell)."
      - Set current_phase = "B"
      - Bắt đầu code UI tasks

  phase_b_to_checkpoint:
    signal: Tất cả [UI] tasks đã done
    action: |
      - ⛔ DẪNG CODE NGAY LẬP TỨC
      - TRIGGER TP1.7 (User Test Checkpoint)
      - CHỊ user confirm "✅ OK" trước khi làm bất cứ gì khác
      - KHÔNG được tự ý skip bước này

  checkpoint_to_phase_c:
    signal: User confirmed "✅" hoặc "OK"
    action: |
      - Set phase_b_confirmed = true
      - Set current_phase = "C"
      - Announce: "🎨 Phase B ✅ — UI đã được duyệt. Chuyển sang Phase C (Logic)."
      - Bắt đầu code [LOGIC] tasks

  phase_c_per_feature:
    signal: 1 feature [LOGIC] đã done + có UI impact
    action: |
      - TRIGGER TP1.7 (mini checkpoint)
      - Batch các features nhỏ lại nếu có thể
```

### Enforcement Rules

```
❌ VI PHạM NẶNG:
  - Code logic (Phase C) khi phase_b_confirmed = false
  - Skip Phase Announcement Block
  - Code UI và Logic lẫn lộn trong cùng 1 lượt (phải tách rõ phase)
  - Tự giả vờ user confirm để skip checkpoint
  - Không hiển thị Phase Announcement khi Three-Phase activated

✅ BẮT BUỘC:
  - Luôn announce phase transition rõ ràng
  - Luôn tạo hướng dẫn test CỤ THỂ (không chung chung)
  - Luôn dùng notify_user(BlockedOnUser=true) cho checkpoints
  - Ghi lại phase state vào NeuralMemory khi chuyển phase
```

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

**Progress Guide (Three-Phase Model):**
```
  10% — Task created, đang research/đọc code
  20% — Implementation plan approved
  25% — Phase A done (build OK, dependencies ready)
  30% — Phase B bắt đầu (UI shell coding)
  45% — Phase B done → USER TEST CHECKPOINT #1 (UI review)
  50% — Phase C bắt đầu (logic integration)
  50-85% — Phase C per-feature (each feature = +5-10%)
  85% — Phase C done, đang final verification
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

### TP1.7: User Test Checkpoint (NEW v3.5 — Gate 4 Three-Phase)

**Khi nào:** Trigger ở 2 thời điểm chính trong Gate 4:

1. **Phase B → C Transition (BẮT BUỘC cho COMPLEX):**
   - ALL UI screens đã code xong với mock data
   - Navigation hoạt động full flow
   - App build và chạy OK trên emulator/device

2. **Sau mỗi feature trong Phase C (COMPLEX tasks):**
   - Feature X đã thay mock bằng real data
   - Feature works end-to-end trên device

**Điều kiện kích hoạt:**
```
COMPLEX + có UI component → BẮT BUỘC TP1.7
MODERATE + có UI component → OPTIONAL (recommend cho hardware features: camera, GPS, sensors)
TRIVIAL → SKIP
Backend-only tasks → SKIP
```

**Action:**
```
1. Report progress trước: symphony_report_progress(current_task, progress)

2. Present User Test Checkpoint:

   🧪 USER TEST CHECKPOINT #{N}
   ══════════════════════════════════════
   📱 Phase: {B|C} — {phase_name}
   📋 Đã code xong: {summary of completed work}
   📁 Files changed: {N} files
   
   🔍 Hướng dẫn test:
     1. {step 1 — cụ thể, actionable}
     2. {step 2 — expected behavior}
     3. {step 3 — edge case to check}
   
   ⏳ Anh test xong reply:
     ✅ OK — tiếp tục
     ⚠️ Issue: {mô tả} — tôi sẽ fix trước khi đi tiếp
   ══════════════════════════════════════

3. Gọi notify_user(BlockedOnUser=true) — DỪNG và CHỜ user response

4. User response handling:
   → "OK" / "✅" → Tiếp tục phase tiếp / feature tiếp
   → "Issue: ..." → Fix issue → re-run checkpoint
   → "Skip" → Ghi note concern, tiếp tục (DONE_WITH_CONCERNS later)
```

**Test Guidance Generation:**
```
AI PHẢI tạo hướng dẫn test CỤ THỂ cho từng checkpoint:

Phase B Examples (UI):
  - "Mở app → bấm tab Health → xem Dashboard có hiển thị 4 cards không?"
  - "Quay ngang màn hình → layout có bể không?"
  - "Bấm nút Camera → xem preview có xuất hiện không?"

Phase C Examples (Logic):
  - "Mở Health Dashboard → data thật có load lên không? (nếu có wifi)"
  - "Chụp ảnh thức ăn → kết quả AI có trả về trong 5s không?"
  - "Bấm Save → quay lại list → record mới có xuất hiện không?"
```

**Enforcement:**
- ❌ KHÔNG được chuyển từ Phase B → Phase C mà chưa có user confirm (COMPLEX)
- ❌ KHÔNG được skip checkpoint cho hardware-related features (Camera, GPS, Sensors)
- ✅ NÊN batch các features nhỏ lại thành 1 checkpoint (tránh quá nhiều interrupt)
- ✅ Checkpoint cho logic KHÔNG cần nếu feature là pure-backend/invisible

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
- Three-Phase WORKS vì AI CHỦ ĐỘNG announce — không chờ user gọi (learned from FitWitness v12.3)
- User test sớm bắt lỗi sớm — code logic trên UI sai = double wasted (learned from FitWitness v12.3)
