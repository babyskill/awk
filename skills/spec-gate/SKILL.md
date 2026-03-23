---
name: spec-gate
description: >-
  Gate 2 — Architecture & Data Design Gate. Chốt thiết kế kỹ thuật (DB Schema,
  API Contract, State Machine) TRƯỚC KHI cho phép code. Bắt buộc user approve
  thiết kế để tránh "vừa làm vừa sửa database". Auto-triggered bởi orchestrator
  khi Gate 2 chưa thỏa mãn.
metadata:
  stage: core
  version: "1.0"
  tags: [gate, architecture, database, design, spec-first, core]
  requires: orchestrator
agent: Architect
trigger: conditional
invocation-type: auto
priority: 2
activation_keywords:
  - "thiết kế database"
  - "schema design"
  - "data model"
  - "API design"
  - "architect"
---

# Spec Gate v1.0 — Architecture & Data Design Gate

> **Purpose:** Chốt thiết kế kỹ thuật (DB Schema, API Contract, State Machine) 
> TRƯỚC KHI viết code. Đảm bảo tất cả persistence changes đã được suy nghĩ kỹ
> và user đã approve trước khi AI bắt tay implement.
>
> **Problem it solves:** "Vừa làm vừa sửa database dẫn tới lung tung"

---

## ⚠️ SCOPE CLARITY

| Skill này LÀM | Skill này KHÔNG làm |
|---------------|---------------------|
| Phác thảo Data Model (tables, fields, indexes) | Viết code |
| Thiết kế API Contract (endpoints, request/response) | Tạo BRIEF/spec (việc của brainstorm-agent) |
| Vẽ State Machine diagram (nếu cần) | Track tasks (việc của symphony-enforcer) |
| Checklist tự kiểm tra thiết kế | Deploy |
| Yêu cầu user approve design | Sửa lỗi |

---

## 🚀 ACTIVATION

Skill này được kích hoạt bởi:
1. **Orchestrator auto-trigger:** Khi Gate 2 check FAIL (không tìm thấy design doc đã approved)
2. **Explicit command:** `/architect` hoặc `/design-db`
3. **Keyword trigger:** "thiết kế database", "schema design", "data model"

---

## 📋 INPUT REQUIREMENTS

Trước khi chạy, PHẢI có:

```
REQUIRED:
  → docs/specs/<feature>.md HOẶC BRIEF.md (output từ Gate 1)
  → .project-identity (projectId, techStack)

OPTIONAL:
  → docs/specs/TECH-SPEC.md (project-level constraints)
  → Existing DB schema (nếu project đã có database)
  → NeuralMemory context (decisions trước đó về architecture)
```

---

## 🔄 PROCESS

### Phase 1: Context Gathering (Silent)

```
1. Đọc BRIEF.md / spec document → Extract:
   - Core entities (Users, Orders, Products...)
   - Relationships (1-N, N-N)
   - Business rules (unique constraints, validation rules)
   - Flows requiring state tracking

2. Đọc .project-identity → Extract:
   - Tech stack (SQL? NoSQL? ORM?)
   - Coding standards
   - Existing patterns

3. Đọc TECH-SPEC.md nếu có → Extract constraints:
   - Database choice (PostgreSQL, Firestore, GRDB, Realm...)
   - Performance requirements
   - Offline-first requirements
   - Migration strategy

4. NeuralMemory recall → Previous architecture decisions
```

### Phase 2: Data Model Design

```
Cho MỖI entity phát hiện từ spec:

TABLE/COLLECTION: <name>
├── Fields:
│   ├── id: <type> (PK)
│   ├── field_1: <type> [NOT NULL | OPTIONAL]
│   ├── field_2: <type> [DEFAULT: <value>]
│   └── ...
├── Indexes:
│   ├── idx_<name>_<field> (purpose)
│   └── ...
├── Relationships:
│   ├── belongs_to: <table> (FK: <field>)
│   └── has_many: <table>
└── Constraints:
    ├── UNIQUE: <fields>
    └── CHECK: <condition>
```

### Phase 3: API Contract Design (nếu có API)

```
Cho MỖI endpoint cần thiết:

ENDPOINT: [METHOD] /api/<path>
├── Purpose: <mô tả ngắn>
├── Auth: <required | optional | public>
├── Request:
│   ├── Headers: <required headers>
│   ├── Params: <path/query params>
│   └── Body: { field: type, ... }
├── Response:
│   ├── 200: { field: type, ... }
│   ├── 400: { error: "validation message" }
│   └── 500: { error: "server error" }
└── Notes: <edge cases, rate limiting, etc.>
```

### Phase 4: State Machine (nếu có stateful flows)

```
Cho flows có trạng thái chuyển đổi (order lifecycle, booking flow...):

STATE MACHINE: <name>
  [initial] → [state_1] → [state_2] → [final]
       ↓           ↓
    [error]    [cancelled]

Transitions:
  initial → state_1: trigger=<event>, guard=<condition>
  state_1 → state_2: trigger=<event>
  any → cancelled: trigger=user_cancel
```

### Phase 5: Self-Review Checklist

**TRƯỚC KHI present cho user, AI PHẢI tự kiểm tra:**

```yaml
checklist:
  data_integrity:
    - [ ] Mọi entity có Primary Key?
    - [ ] Foreign Keys đúng direction?
    - [ ] Không có circular dependencies?
    - [ ] Cascade delete rules đã define?

  performance:
    - [ ] Indexes cho frequent queries?
    - [ ] N+1 query potential identified?
    - [ ] Pagination strategy cho list endpoints?
    - [ ] Caching strategy nếu cần?

  consistency:
    - [ ] Chuẩn với .project-identity tech stack?
    - [ ] Chuẩn với TECH-SPEC.md constraints?
    - [ ] Naming convention thống nhất?
    - [ ] Date/time format thống nhất?

  edge_cases:
    - [ ] Concurrent access handling?
    - [ ] Null/empty value handling?
    - [ ] Soft delete vs hard delete?
    - [ ] Offline-first sync strategy (nếu mobile)?

  security:
    - [ ] PII data identified + encrypted?
    - [ ] Auth rules per endpoint?
    - [ ] Input validation cho mọi user input?
```

### Phase 6: Present & Approval

```
Present cho user với format:

───────────────────────────────────
📐 ARCHITECTURE DESIGN: <Feature Name>
───────────────────────────────────

## Data Model
[Phase 2 output]

## API Endpoints  
[Phase 3 output — nếu có]

## State Machine
[Phase 4 output — nếu có]

## Self-Review ✅
[Phase 5 checklist results]

## Concerns & Trade-offs
- [Concern 1]: [Mô tả + recommendation]
- [Concern 2]: [Mô tả + recommendation]

───────────────────────────────────
⏳ Chờ anh approve thiết kế này trước khi code nhé.
   Sửa gì cứ nói, tôi update lại.
───────────────────────────────────
```

### Phase 7: Write Design Doc

Sau khi user approve:

```
1. Tạo folder nếu chưa có: docs/architecture/
2. Write file: docs/architecture/<feature>_design.md
3. Nội dung = Phase 6 output + approval marker:
   
   ## Status: Approved
   **Approved by:** User
   **Approved at:** <ISO date>
   **Conversation:** <conversation-id>

4. Lưu vào NeuralMemory:
   nmem_remember(
     content="Architecture design for <feature> approved. Schema: <summary>",
     type="decision",
     tags=["architecture", "<projectId>", "<feature>"]
   )

5. Proceed → orchestrator re-checks Gate 2 → PASS → Gate 3
```

---

## 🔙 DESIGN DEVIATION PROTOCOL

Khi AI đang code (Gate 4) và phát hiện cần sửa schema khác approved design:

```
1. ⛔ DỪNG CODE NGAY LẬP TỨC
2. Thông báo user:
   "Phát hiện cần thêm/sửa [field/table] ngoài thiết kế đã duyệt.
    Để tôi quay lại update design doc trước nhé."
3. Mở lại design doc
4. Highlight phần cần thay đổi + lý do
5. Yêu cầu user re-approve
6. Update marker: "## Status: Approved (Revision 2)"
7. Tiếp tục code
```

---

## 🗣️ Communication Style

```
❌ "Architecture document required. Please provide data model specification."
✅ "Đã hiểu yêu cầu! Giờ để tôi phác thảo cấu trúc database cho anh xem 
    trước — kinh nghiệm cho thấy nếu chốt DB sớm sẽ tiết kiệm rất nhiều 
    thời gian sửa lại sau."

❌ "Design review requires your explicit approval."
✅ "Anh xem thiết kế này có ổn không? Sửa gì cứ nói, tôi update lại. 
    Chốt xong là bắt tay code luôn."
```

---

## 🚫 Anti-Patterns

```yaml
never_do:
  - Tự approve design (user PHẢI approve)
  - Skip self-review checklist
  - Design quá chi tiết cho trivial features (orchestrator đã filter)
  - Bắt đầu code trước khi có approval marker
  - Phớt lờ TECH-SPEC.md constraints

always_do:
  - Đọc ALL input sources trước khi design
  - Chạy self-review checklist 100%
  - Highlight trade-offs và concerns
  - Ghi lại decisions vào NeuralMemory
  - Kiểm tra consistency với existing schema
```

---

## 🧩 Skill Relationships

```
TRIGGERED BY: orchestrator (Gate 2 check fail)
DEPENDS ON: brainstorm-agent output (Gate 1 must pass first)
FEEDS INTO: symphony-enforcer (Gate 3 reads design doc to create tasks)
WORKS WITH: nm-memory-sync (store architectural decisions)
```

---

*spec-gate v1.0 — Architecture & Data Design Gate for AWKit*
