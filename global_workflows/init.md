---
description: ✨ Khởi tạo dự án chuẩn Antigravity (v5.0 - Spec-First + CLI Hybrid)
---

# WORKFLOW: /init - The Antigravity Orchestrator (v5.0)

> **Mission:** Thiết lập "Hệ điều hành phát triển" (OS for Development) với Spec-First approach.
> **Key Change v5.0:** Tạo Project-Level Spec (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, TECH-SPEC.md) ngay từ đầu.
> **Hybrid:** CLI scaffolds → AI fills content through brainstorm.

---

## 🚀 Giai đoạn 0: Environment & MCP Check

1.  **MCP Status Check**:
    *   `firebase-mcp-server`: [Check] → Nếu thiếu, hỏi user có cần Backend/Auth không?
    *   `maestro`: [Check] → Nếu thiếu, warn "Sẽ không thể chạy test UI tự động".
    *   `ios-simulator`: [Check] → Nếu là dự án Mobile, yêu cầu bật Simulator.

2.  **Dev Environment**: Node/Ruby/Java/Swift versions.

---

## ⚡ Giai đoạn 1: Context Awareness & Smart Adoption

**Kịch bản A: Thư mục trống (New Project)**
*   Chạy quy trình phỏng vấn **Vision Capture**.
*   Hỏi: "Anh muốn dùng template có sẵn không?" (Clean Arch, Boilerplate).

**Kịch bản B: Thư mục có Code (Adoption Mode)**
*   AI quét cấu trúc hiện tại.
*   Tự động điền `.project-identity`.
*   Đề xuất chuẩn hóa theo Antigravity Workflow.

---

## 🧠 Giai đoạn 2: Project Skeleton

1.  **Generate `.project-identity`** (Bắt buộc):
    *   Copy template từ `~/.gemini/antigravity/templates/project-identity/[platform].json`.
    *   Customize: Thay thế `{{DATE}}`, `projectName` bằng thông tin thực tế.

2.  **Create Standard Ecosystem**:
    ```bash
    mkdir -p docs/specs
    mkdir -p docs/architecture/decisions
    mkdir -p .planning/research
    cp ~/.gemini/antigravity/templates/configs/trello-config.json .trello-config.json
    ```

3.  **App Structure (Platform-Specific)**:
    *   Đọc template từ `~/.gemini/antigravity/templates/structures/[platform].txt`.
    *   Tạo folder tree tương ứng.

4.  **Git Setup**: `.gitignore` thông minh theo stack.

---

## 📐 Giai đoạn 3: Project Spec Generation (NEW — Spec-First)

> **Đây là bước mới quan trọng nhất.** AI brainstorm với user để tạo ra "hiến pháp" của dự án.
> Tất cả feature-level planning SAU NÀY phải tuân theo spec này.

### 3.1. Copy Templates
```bash
# CLI tự động copy templates vào project
cp ~/.gemini/antigravity/templates/specs/PROJECT.md docs/specs/PROJECT.md
cp ~/.gemini/antigravity/templates/specs/requirements-template.md docs/specs/REQUIREMENTS.md
cp ~/.gemini/antigravity/templates/specs/ROADMAP.md docs/specs/ROADMAP.md
cp ~/.gemini/antigravity/templates/specs/TECH-SPEC.md docs/specs/TECH-SPEC.md
```

### 3.2. AI Fills Content (Brainstorm Session)

AI **chủ động** brainstorm với user để fill từng file:

1.  **PROJECT.md** — Hỏi về vision, goals, target audience, success metrics.
    *   "Dự án này giải quyết vấn đề gì?"
    *   "Ai là người dùng chính?"
    *   "Thành công sẽ trông như thế nào?"

2.  **REQUIREMENTS.md** — Hỏi về features, scope, priorities.
    *   "Features nào BẮT BUỘC có trong v1?"
    *   "Có features nào nên để v2?"
    *   Dùng user story format: "As a [user], I want [action] so that [benefit]"

3.  **ROADMAP.md** — Tự động sinh từ requirements.
    *   Chia phases dựa trên priority + dependencies.
    *   Mỗi phase có Definition of Done rõ ràng.

4.  **TECH-SPEC.md** — Hỏi về architecture constraints.
    *   "Có yêu cầu offline-first không?"
    *   "AI model nào sẽ dùng?"
    *   Ghi nhận Architecture Decisions (AD-1, AD-2...).

### 3.3. Review & Confirm
*   AI present tổng kết spec cho user review trước khi lưu.
*   User approve → spec trở thành "source of truth".

---

## 🎨 Giai đoạn 4: Visual Vision (Optional)

1.  **Brainstorm UI Concept** dựa trên spec vừa tạo.
2.  **Generate Mockup** via `generate_image` tool.
3.  Hiển thị cho user: "App trông sẽ như thế này!"

---

## 🔗 Giai đoạn 5: Handover — Symphony + Next Steps

1.  **Register project trong Symphony**:
    ```bash
    symphony project register --id <projectId> --name "<projectName>"
    ```

2.  **Tạo initial tasks từ ROADMAP.md Phase 1**:
    *   Mỗi feature trong Phase 1 → 1 Symphony task (status: ready).

3.  **Present next steps (Bao gồm hướng dẫn công cụ mới)**:
    ```text
    🎉 SETUP COMPLETE!
    
    📐 Specs created:
       + docs/specs/PROJECT.md
       + docs/specs/REQUIREMENTS.md
       + docs/specs/ROADMAP.md
       + docs/specs/TECH-SPEC.md
    
    🎯 Symphony tasks created from Phase 1:
       📋 #sym-A1 — [Feature 1] (ready)
       📋 #sym-A2 — [Feature 2] (ready)
       
    🛠️ Advanced Tools Ready:
       + 🧠 NeuralMemory: Tự động ghi nhớ context. Dùng /save-brain nếu cần lưu chủ đích.
       + 🚦 5-Gate System: Tự động phân luồng Spec → Architecture → Code. Bypass workflow tự động.
       + 🕸️ GitNexus: Bắt buộc chạy `npx gitnexus analyze` trước khi code để kiểm soát blast radius.
       + 🎼 Symphony: Quản lý task tự động. Dùng `/next` để AI tự tìm việc và làm tiếp.
       + 👨‍✈️ Conductor: Dùng `/conductor` khi cần hỏi ý kiến AI thứ 2 để review kiến trúc.
    
    ➡️ Next: Pick a feature to start PLANNING mode, or run `/next` to let AI decide!
    ```

---

## 📝 Example Execution

```text
Antigravity Initializer v5.0
----------------------------
✅ Checking Environment... OK
✅ Checking MCPs... Firebase (ON), Maestro (ON)
📂 Project detected: Empty folder

🤖 Let's build something great!
... [Vision Capture + Spec Brainstorm] ...

📐 Filling Project Specs...
   ✅ docs/specs/PROJECT.md — filled
   ✅ docs/specs/REQUIREMENTS.md — filled (12 requirements)
   ✅ docs/specs/ROADMAP.md — filled (3 phases)
   ✅ docs/specs/TECH-SPEC.md — filled (5 architecture decisions)

🎯 Symphony tasks created:
   📋 #sym-A1 — User Authentication (P0, ready)
   📋 #sym-A2 — Onboarding Flow (P0, ready)
   📋 #sym-A3 — Dashboard UI (P1, ready)

🛠️ Advanced Tools Setup:
   ✅ NeuralMemory Active
   ✅ 5-Gate Autonomous System Ready
   ✅ Symphony Tracker Synced

🎉 SETUP COMPLETE! Your "Operating System" is ready.
➡️ Pick a feature to start building, or type `/next`.
```