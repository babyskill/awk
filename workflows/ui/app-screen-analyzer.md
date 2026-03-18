---
description: 📱 Phân tích màn hình & tạo đặc tả UI
---

# /app-screen-analyzer

**Mission:** Analyze idea/image → Generate complete spec docs (requirements, design, tasks) for ALL screens (Core + Secondary + Common).

## 🎯 Overview
1.  **Input Analysis**: Detect App Type & Context.
2.  **Screen Discovery**: Core → Secondary → Common.
3.  **Feature Grouping**: Organize screens into Features.
4.  **Spec Gen**: Create `docs/specs/[feature]/{requirements,design}.md` and init tasks via **Symphony**.
5.  **Overview**: Create `docs/specs/_overview.md`.

---

## Phase 0: Input & Context
**0.1. Input**: Text idea OR Screenshots.
**0.2. App Type**:
*   `social` (Chat, Feed) | `ecommerce` (Shop, Cart) | `fitness` (Track, Plans)
*   `content` (Media, News) | `productivity` (Tools) | `finance` (Bank, Wallet)
**0.3. Check Context**: Read `.project-identity` if exists.

---

## Phase 1: Screen Discovery

### 1.1. Core & Secondary Analysis
Analyze input to list screens. For each Core Screen, identify Secondary Screens (Details, Modals, Edits, Filters).

**Output Format:**
```markdown
## Screen Discovery
- **[CoreScreen]**: [Purpose]
  - *Secondary*: [Detail/Modal/Edit]
```

### 1.2. Common Screens (Auto-Add)
Add screens based on App Type:
*   **ALL**: Splash, Onboarding, Auth (Login/Reg/Forgot), Home, Settings, Profile.
*   **Social**: Search, Notifications, Feed, UserProfile.
*   **E-commerce**: Search, Cart, Checkout, Orders, ProductDetail.
*   **Fitness**: ActivityLog, Stats, Plans, WorkoutPlayer.
*   **Content**: Library, Player/Reader, Favorites.
*   **Finance**: Transactions, Wallet, Transfer, Report.

---

## Phase 2: Feature Grouping
Group screens into features (subdirectories in `docs/specs/`).

**Structure:**
*   `onboarding/`: Splash, Welcome, Steps.
*   `auth/`: Login, Register, OTP.
*   `home/`: Dashboard, Feed.
*   `[feature-name]/`: Core feature specific screens.
*   `profile/`: User details, preferences.
*   `settings/`: App configs, About.
*   `common/`: Shared UI (Alerts, Modals).

---

## Phase 3: Spec Generation
For EACH feature, create 3 files using these optimized templates:

### 3.1. requirements.md
```markdown
# [Feature] Requirements

## Screens
1. **[Screen1]**: [Desc]
2. **[Screen2]**: [Desc]

## Requirements
### RQ-01: [Screen1]
**Story:** As [user], I want [action], so that [value].
**Criteria:**
1. WHEN [trigger] THEN [behavior]
2. WHEN [error] THEN [handling]
```

### 3.2. design.md
```markdown
# [Feature] Design

## Hierarchy
[Feature]View
├── [Screen1]
│   └── [Components]
├── [Screen2]
└── [Shared]

## Models
```swift
struct [Model]: Identifiable, Codable { let id: UUID; ... }
enum ViewState { case idle, loading, loaded([Model]), error(Error) }
```

## Flow
[Entry] -> [Screen1] -> [Screen2]
```

### 3.3. Task Initialization (Symphony)
```bash
symphony_create_task(title= "Implement [Feature] - A1: Models & Repos" --body "File: Domain & Data\nValidates: RQ-01"
symphony_create_task(title= "Implement [Feature] - B1: [Screen1]" --body "File: Presentation/[Feature]/"
```

---

## Phase 4: App Overview
Create `docs/specs/_overview.md`:
```markdown
# App Screen Map
**Type:** [Type] | **Total Specs:** [N] directories

## Navigation
Tab 1: Home | Tab 2: [Feature] | Tab 3: Profile

## Feature Index
| Feature | Specs | Status |
|---|---|---|
| Auth | ./auth/ | ✅ |
| [Feature] | ./[feat]/ | ✅ |
```

---

## Rules
1.  **NO CODE**: Only specs.
2.  **COMPLETE**: Do not miss Common Screens.
3.  **FORMAT**: Always 3 files per feature.

---

## ⚠️ Workflow Integration
| Action | Related Workflow |
|---|---|
| Auto-Implement | `/auto-implement docs/specs/[feature]` |
| Code Quality | `/code-review-workflow` |
| Progress | `/recap` |

## Quick Start
**Trigger:** User says "Analyze app [idea]" or sends screenshots.

**Example:**
User: "Analyze app: Pregnancy tracker with AI chat and nutrition plans"
AI: [Runs workflow]
→ Detects: fitness + content
→ Discovers: 25 screens (Core + Secondary + Common)
→ Generates: 9 features × 3 specs each