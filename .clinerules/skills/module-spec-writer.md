---
name: module-spec-writer
description: >-
  Gate 1.5 — Module Specification Writer. Tạo tài liệu mô tả chi tiết từng module
  của ứng dụng: screens, user flows, business rules, validation, data contracts,
  edge cases. Chạy sau brainstorm (Gate 1) và trước architecture design (Gate 2).
  Đặc biệt critical cho port/migration projects.
  Hỗ trợ auto-detect .kiro/specs modules để bypass khi IDE đã tạo specs.
metadata:
  stage: core
  version: "1.1"
  tags: [gate, spec, module, product-spec, documentation, core, kiro]
  requires: orchestrator
agent: Spec Writer
trigger: conditional
invocation-type: auto
priority: 1
activation_keywords:
  - "module spec"
  - "mô tả module"
  - "screen inventory"
  - "feature spec"
  - "product spec"
  - "mô tả app"
  - "document modules"
---

# Module Spec Writer v1.0 — Gate 1.5: Product Specification

> **Purpose:** Tạo tài liệu mô tả chi tiết từng module/feature của ứng dụng
> ở cấp độ **Product** (screens, flows, rules) — TRƯỚC KHI đi vào thiết kế
> kỹ thuật (DB/API). Đảm bảo AI và user có shared understanding về "app làm gì"
> trước khi bàn "app xây thế nào".
>
> **Problem it solves:**
> - "Nhảy thẳng vào code mà chưa ai mô tả rõ app có bao nhiêu màn hình"
> - "Port app từ iOS sang Android mà không ai document chi tiết app gốc"

---

## ⚠️ SCOPE CLARITY

| Skill này LÀM | Skill này KHÔNG làm |
|---------------|---------------------|
| Mô tả screens, user flows, business rules per module | Thiết kế DB/API (việc của spec-gate) |
| Tạo screen inventory cho toàn app | Viết code |
| Document validation rules & edge cases | Track tasks (việc của symphony-enforcer) |
| Scan existing codebase để auto-generate spec (port projects) | Brainstorm ý tưởng (việc của brainstorm-agent) |
| Yêu cầu user approve module spec | Deploy |

---

## 🚀 ACTIVATION

Skill này được kích hoạt bởi:
1. **Orchestrator auto-trigger:** Khi Gate 1.5 check FAIL (không tìm thấy module specs)
2. **Explicit command:** `/module-spec` hoặc `/product-spec`
3. **Keyword trigger:** "module spec", "mô tả module", "screen inventory"

### Khi nào Gate 1.5 MANDATORY:

```yaml
mandatory_when:
  - complexity: COMPLEX (score ≥6)
  - project_type: port/migration (iOS→Android, Android→iOS)
  - module_count: >3 modules in BRIEF.md
  - explicit_request: user asks for module documentation

skip_when:
  - complexity: TRIVIAL or MODERATE
  - module_count: ≤3 AND not port/migration
  - user_override: "skip spec" or "bỏ qua spec"
  - kiro_specs: .kiro/specs/ chứa ≥2 module folders với requirements.md
    → AUTO-SKIP: "Kiro module specs detected. Gate 1.5 AUTO-PASS."
    → Load .kiro/specs/<module>/requirements.md làm module specs
    → Chuyển thẳng Gate 2
```

---

## 📋 INPUT REQUIREMENTS

```
REQUIRED:
  → BRIEF.md hoặc docs/specs/<feature>.md (output từ Gate 1)
    HOẶC existing codebase (cho port/migration projects)
  → .project-identity (projectId, techStack)

OPTIONAL:
  → CODEBASE.md (project structure overview)
  → KnowledgeItems (existing module documentation)
  → NeuralMemory context (previous decisions)
  → Source codebase (for port/migration — iOS/Android source files)
```

---

## 🔄 PROCESS

### Phase 1: Module Discovery

```
INPUT SOURCE DETECTION (theo thứ tự ưu tiên):

  🔍 KIRO CHECK (HIGHEST PRIORITY):
  A0) Scan .kiro/specs/ folder:
      - Nếu tồn tại ≥2 module folders (mỗi folder có requirements.md):
        → AUTO-PASS Gate 1.5
        → Load từng .kiro/specs/<module>/requirements.md làm module spec
        → Thông báo:
          "🔍 Phát hiện .kiro/specs/ với [N] module specs từ IDE Kiro.
             Modules: [list module names]
             Gate 1.5 AUTO-PASS. Chuyển thẳng Gate 2 (Architecture)."
        → SKIP Phase 2-6, không cần user approve (Kiro đã chốt)
        → Lưu vào NeuralMemory: "Kiro module specs loaded: <list>"
      - Nếu không có → tiếp tục các check bình thường bên dưới

  FALLBACK SOURCES:
  A) Có BRIEF.md → Extract module list từ "TÍNH NĂNG" section
  B) Có existing codebase (port project) → Scan source code structure:
     - iOS: Xcode project groups, Views/, Features/ folders
     - Android: feature/ packages, activities, fragments
     - Đọc CODEBASE.md nếu có
  C) Cả hai → Cross-reference BRIEF với source code

OUTPUT: Danh sách modules cần spec:
  Module 1: [name] — [1-line description]
  Module 2: [name] — [1-line description]
  ...

PRESENT cho user:
  "📋 Em tìm thấy [N] modules cần document:
   1. [Module A] — [description]
   2. [Module B] — [description]
   ...
   Anh xem có đúng/đủ không? Bổ sung/bỏ bớt cứ nói nhé."
```

### Phase 2: Per-Module Spec Generation

Cho MỖI module, tạo spec theo template chuẩn:

```
Quy trình:
1. Gather context:
   - BRIEF.md → extract relevant features
   - Source code (nếu port) → scan screens, ViewModels, models
   - KnowledgeItems → extract existing documentation
   - NeuralMemory → previous decisions

2. Generate spec draft using template (see TEMPLATE section)

3. Self-review checklist (per module):
   - [ ] Tất cả screens đã liệt kê?
   - [ ] Happy path flow rõ ràng?
   - [ ] Error/edge cases đã cover?
   - [ ] Business rules explicit (không implicit)?
   - [ ] Data contracts rõ input/output?
   - [ ] Acceptance criteria testable?
```

### Phase 3: Cross-Module Consistency Check

```
Sau khi TẤT CẢ module specs xong:

1. Dependency graph:
   - Module A depends on Module B? Đã ghi trong cả 2 specs?
   - Circular dependency? → Cảnh báo

2. Shared concepts:
   - User model xuất hiện ở nhiều modules? → Consistent fields?
   - Navigation flow giữa modules logic?

3. Coverage check:
   - Mọi feature trong BRIEF.md đã có module spec?
   - Mọi screen trong source code (port) đã có trong inventory?
```

### Phase 4: Multi-Role Review (AI Simulated)

```
Trước khi gửi bản thảo cho user, AI BẮT BUỘC đóng vai 6 vai trò sau để review chéo:
1. Tech Lead: Tính khả thi kỹ thuật? Có edge cases nào chưa cover?
2. PM: Có phục vụ đúng mục tiêu kinh doanh? Scope creep?
3. UX Designer: Flow có mượt không? Quá nhiều bước? Có nghĩ đến empty states/error states?
4. QA Engineer: Acceptance Criteria đã test được chưa (SMART)? Có đủ rõ ràng?
5. Security/Privacy: Có rò rỉ PII? Có checklist GDPR chưa (riêng đối với data y tế)?
6. DevOps: Có cản trở CI/CD hoặc scaling không?
```

### Phase 5: Present & Approval

```
Present cho user với format:

────────────────────────────────────
📋 MODULE SPECIFICATIONS: <Project Name>
────────────────────────────────────

Đã tạo [N] module specs:

| # | Module | Screens | Flows | Status |
|---|--------|---------|-------|--------|
| 1 | [name] | [count] | [count] | Draft |
| 2 | [name] | [count] | [count] | Draft |

## Cross-Module Notes
- [Note 1: shared concern]
- [Note 2: dependency]

────────────────────────────────────
⏳ Anh review từng file spec nhé. Sửa gì cứ nói.
   Chốt hết thì mình chuyển sang thiết kế kỹ thuật (Gate 2).
────────────────────────────────────
```

### Phase 6: Write & Store

Sau khi user approve:

```
1. Tạo folder: docs/specs/modules/ (nếu chưa có)

2. Write files:
   docs/specs/modules/<module-name>_spec.md  (cho mỗi module)
   docs/specs/modules/MODULE_INDEX.md        (index file)

3. Thêm approval marker cho mỗi file:
   ## Status: Approved
   **Approved by:** User
   **Approved at:** <ISO date>

4. Lưu vào NeuralMemory:
   nmem_remember(
     content="Module specs approved for <project>. Modules: <list>. Total screens: <N>",
     type="decision",
     tags=["module-spec", "<projectId>"]
   )

5. Proceed → orchestrator re-checks Gate 1.5 → PASS → Gate 2
```

---

## 📝 MODULE SPEC TEMPLATE

```markdown
# 📋 Module Spec: [Module Name]

**Project:** [project-name]
**Version:** 1.0
**Created:** [date]
**Status:** Draft | Approved

---

## Overview
[1-2 câu mô tả mục đích module này trong app]

## Dependencies
- **Depends on:** [list modules this depends on]
- **Used by:** [list modules that depend on this]
- **Shared services:** [auth, analytics, etc.]

---

## Screen Inventory

| # | Screen Name | Type | Key Elements | Notes |
|---|------------|------|--------------|-------|
| 1 | [name] | [full/modal/sheet/overlay/tab] | [main UI components] | [optional] |

---

## User Flows

### Flow 1: [Happy Path Name]
**Entry:** [how user gets here]
**Steps:**
1. User [action] → Screen [A]
2. User [action] → System [response]
3. System [shows/navigates] → Screen [B]
4. **End state:** [what user sees/has achieved]

### Flow 2: [Alternative Path / Error Path]
**Trigger:** [what causes this path]
**Steps:**
1. ...

---

## Business Rules

| ID | Rule | Details |
|----|------|---------|
| BR-01 | [rule name] | [full description] |
| BR-02 | [rule name] | [full description] |

---

## Validation Rules

| Field | Condition | Error Message | Screen |
|-------|-----------|---------------|--------|
| [field] | [rule] | [message] | [where] |

---

## Data Contracts

### Input (consumed by this module)
| Data | Type | Source | Required |
|------|------|--------|----------|
| [name] | [type] | [module/API/local] | [yes/no] |

### Output (produced by this module)
| Data | Type | Destination | Trigger |
|------|------|-------------|---------|
| [name] | [type] | [module/API/local] | [when] |

---

## Edge Cases & Error States

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| EC-01 | [scenario] | [what should happen] |
| EC-02 | [scenario] | [what should happen] |

---

## Acceptance Criteria
- [ ] [measurable criterion 1]
- [ ] [measurable criterion 2]
- [ ] [measurable criterion 3]
```

---

## 📄 MODULE INDEX TEMPLATE

```markdown
# 📚 Module Index: [Project Name]

**Total modules:** [N]
**Created:** [date]
**Status:** [All Approved / Some Draft]

| # | Module | Spec File | Screens | Status |
|---|--------|-----------|---------|--------|
| 1 | [name] | [link to spec file] | [count] | Approved |
| 2 | [name] | [link to spec file] | [count] | Draft |

## Dependency Graph
[Module A] → [Module B] → [Module C]
[Module D] → [Module B]

## Shared Services
- **Auth:** Used by [modules]
- **Analytics:** Used by [modules]
- **AI/ML:** Used by [modules]
```

---

## 🔄 PORT/MIGRATION MODE

Khi project là port/migration (iOS→Android, Android→iOS):

```
SPECIAL BEHAVIOR:

  🔍 KIRO-FIRST CHECK (luôn chạy trước):
  0. Scan .kiro/specs/ → nếu có module folders với requirements.md:
     → Dùng Kiro specs làm source of truth
     → SKIP source code scanning (Kiro đã tổng hợp)
     → Cross-reference với source code CHỈ để verify completeness

  FALLBACK (khi không có .kiro/specs):
  1. Scan source codebase TRƯỚC → auto-detect modules
  2. Đọc existing KnowledgeItems cho source project
  3. Cross-reference với BRIEF.md để catch missing modules
  4. Generate specs từ source code structure + knowledge

AUTO-DETECTION SOURCES:
  iOS:
    → Xcode project navigator groups
    → Features/ or Presentation/Views/ folders
    → NavigationStack/TabView structure
    → Existing CODEBASE.md

  Android:
    → feature/ packages
    → Navigation graph (nav_graph.xml)
    → Activity/Fragment inventory
    → Existing CODEBASE.md

  Kiro:
    → .kiro/specs/<module>/requirements.md (pre-generated)
    → .kiro/specs/<module>/design.md (pre-generated)
    → .kiro/specs/<module>/tasks.md (pre-generated)

OUTPUT: Pre-filled module specs with data from source code OR Kiro specs
  → User chỉ cần review + approve, không cần viết từ đầu
```

---

## 🗣️ Communication Style

```
❌ "Module specification documents are required before proceeding."
✅ "Trước khi bắt tay vào thiết kế kỹ thuật, để em mô tả chi tiết
    từng module — screens nào, flow ra sao — để anh em hiểu rõ cùng nhau."

❌ "Please review 8 specification documents."
✅ "Em đã viết xong spec cho 8 modules. Anh xem từng cái nhé,
    sửa gì cứ nói, chốt hết rồi mình chuyển sang thiết kế DB/API."
```

---

## 🚫 Anti-Patterns

```yaml
never_do:
  - Tự approve module specs (user PHẢI approve)
  - Viết spec quá vắn tắt (< 5 screens → cảnh báo "có thiếu screen không?")
  - Skip cross-module consistency check
  - Trộn lẫn product spec với technical spec (DB/API)
  - Bắt đầu Gate 2 khi còn module spec ở status "Draft"
  - Force Gate 1.5 cho TRIVIAL tasks

always_do:
  - Show module list cho user confirm TRƯỚC khi viết spec
  - Chạy cross-module consistency check SAU khi viết hết
  - Ghi acceptance criteria testable (SMART)
  - Scan source code khi port/migration project
  - Tag specs vào NeuralMemory
```

---

## 🧩 Skill Relationships

```
TRIGGERED BY: orchestrator (Gate 1.5 check fail)
DEPENDS ON: brainstorm-agent output (Gate 1 must pass first)
FEEDS INTO: spec-gate (Gate 2 reads module specs to design DB/API)
WORKS WITH:
  - nm-memory-sync (store module decisions)
  - gitnexus-intelligence (scan source codebase structure)
  - KnowledgeItems (read existing project documentation)
```

---

*module-spec-writer v1.1 — Product Specification Gate for AWKit (Kiro Spec Integration)*
