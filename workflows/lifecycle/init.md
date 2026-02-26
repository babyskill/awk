---
description: ✨ Khởi tạo dự án chuẩn Antigravity (v4.1 - Master Orchestrator)
---

# WORKFLOW: /init - The Antigravity Orchestrator (v4.1)

> **Mission:** Không chỉ tạo file. `/init` thiết lập toàn bộ "Hệ điều hành phát triển" (OS for Development), tích hợp sẵn tư duy Spec-First, Clean Architecture và MCP Tools.

---

## 🚀 Giai đoạn 0: Environment & MCP Check (New in v4.1)
Trước khi làm bất cứ điều gì, kiểm tra "vũ khí":

1.  **MCP Status Check**:
    *   `firebase-mcp-server`: [Check] -> Nếu thiếu, hỏi user có cần Backend/Auth không?
    *   `maestro`: [Check] -> Nếu thiếu, warn "Sẽ không thể chạy test UI tự động".
    *   `ios-simulator`: [Check] -> Nếu là dự án Mobile, yêu cầu bật Simulator.
    *   `google-ads-mcp`: [Check] -> (Optional) Cho Marketing.

2.  **Dev Environment**:
    *   Node/Ruby/Java/Swift versions.
    *   Docker status (nếu là Backend).

---

## ⚡ Giai đoạn 1: Context Awareness & Smart Adoption
*Thay vì hỏi máy móc, hãy quan sát:*

**Kịch bản A: Thư mục trống (New Project)**
*   Chạy quy trình phỏng vấn **Vision Capture** (như bản cũ).
*   Hỏi thêm: "Anh muốn dùng template có sẵn không?" (Clean Arch, Boilerplate).

**Kịch bản B: Thư mục có Code (Adoption Mode)**
*   AI quét cấu trúc hiện tại.
*   Tự động điền `.project-identity`.
*   Đề xuất: "Em thấy dự án này đang dùng [Stack]. Anh có muốn em setup lại folder `docs/` và `scripts/` để chuẩn hóa theo Antigravity Workflow không?"

---

## 🧠 Giai đoạn 2: The Antigravity Core Injection
*Đây là "bí mật" tạo nên sự khác biệt. Setup nền tảng cho các workflow nâng cao.*

### 2.1. Create Standard Ecosystem
Tự động tạo các thư mục và file mẫu:

1.  **Antigravity Core**:
    ```bash
    mkdir -p docs/specs/_templates
    mkdir -p docs/architecture/decisions
    mkdir -p .gemini/scripts
    ```

2.  **App Structure (Platform-Specific)**:
    *   **Action:** Đọc template cấu trúc từ `~/.gemini/antigravity/templates/structures/[platform].txt`.
    *   **Execute:** Tạo folder tree tương ứng.
    *   *Ví dụ iOS:* `App/Features`, `App/Shared`, `Tests`, ...

### 2.2. Inject Templates (Spec & Architecture)
Tạo file mẫu để workflow `/plan` (create-spec) hoạt động trơn tru:

**`docs/specs/_templates/requirements_template.md`**:
*(Mẫu chuẩn Requirements từng dùng ở `create-spec-architect`)*

**`docs/specs/_templates/architecture_template.md`**:
*(Mẫu chuẩn Clean Architecture Decision)*

### 2.3. Inject Automation Scripts
Tạo script để user gõ lệnh tắt là chạy workflow:

**`scripts/scaffold_feature.sh`**:
*(Script gọi đến `structure-clean-architect` workflow)*

---

## 🏗️ Giai đoạn 3: Project Skeleton & Hidden Setup
*(Kế thừa từ v4.0 nhưng mạnh mẽ hơn)*

1.  **Generate `.project-identity`**: (Bắt buộc, là trái tim của mọi workflow).
    *   **Action:** Copy template từ `~/.gemini/antigravity/templates/project-identity/`:
        *   `ios.json` cho iOS.
        *   `android.json` cho Android.
        *   `expo.json` cho Cross-platform.
        *   `web-nextjs.json` cho Web App.
        *   `backend-nestjs.json` cho API.
    *   **Customize:** Thay thế các placeholder (`{{DATE}}`, `projectName`) bằng thông tin thực tế.
2.  **Git Setup**: `.gitignore` thông minh theo stack.
3.  **Linter/Formatter**: Cài ESLint/SwiftLint/Detekt ngay lập tức.
4.  **CI/CD Basics**: Tạo `.github/workflows/ci.yml` cơ bản (build test).

---

## 🎨 Giai đoạn 4: Visual Vision (The WOW Factor)
*Không để user chờ đợi với màn hình đen trắng.*

1.  **Brainstorm UI Concept**:
    *   Dựa trên ý tưởng user, AI tự nghĩ ra 1 `prompt` mô tả giao diện cực xịn (Dark/Light mode, Glassmorphism...).
2.  **Generate Mockup**:
    *   Gọi tool `generate_image` để tạo ngay 1 ảnh "Vision Art".
    *   Hiển thị cho user: "App của anh trông sẽ ngầu như thế này này!"

---

## 🔗 Giai đoạn 5: Handover to Specialized Workflows
*Sự kết nối chặt chẽ với các quy trình user yêu thích.*

Báo cáo hoàn tất và trỏ ngay sang các bước tiếp theo:

### ⚠️ NEXT STEPS (Choose your path):

**Path A: The Planner (Chậm mà chắc)**
> "Tôi muốn lên kế hoạch chi tiết cho tính năng đầu tiên."
👉 Gõ: **/plan** (Sẽ chạy `create-spec-architect` dùng template vừa tạo).

**Path B: The Builder (Mì ăn liền)**
> "Tôi muốn thấy cấu trúc code ngay."
👉 Gõ: **/structure** (Sẽ chạy `structure-clean-architect` dựa trên `.project-identity`).

**Path C: The Artist (UI First)**
> "Tôi muốn thiết kế giao diện trước."
👉 Gõ: **/visualize** (Sẽ chạy `design-to-ui` / `ui-first-methodology`).

---

## 📝 Example Execution for User

```text
Antigravity Initializer v4.1
----------------------------
✅ Checking Environment... OK
✅ Checking MCPs... Firebase (OFF), Maestro (ON)
📂 Project detected: Empty folder

🤖 Let's build something great!
... [Vision Capture Questions] ...

🚀 Setting up Antigravity Core...
   + docs/specs/_templates
   + .project-identity
   + .gitignore
   + scripts/scaffold_feature.sh

🎨 Generating Vision Concept... [Done]
   (Image: A sleek, dark-themed dashboard for [AppName])

🎉 SETUP COMPLETE!
Your "Operating System" is ready.

What's your first move?
1. /plan [FeatureName] (Recommended: Create Specs first)
2. /structure [FeatureName] (Scaffold Code)
3. /visualize (Design UI)
```