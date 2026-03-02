---
description: 🔧 Dịch ngược APK Android (Apktool output) → App Kotlin hiện đại với Jetpack Compose, Clean Architecture. Progressive Disclosure: Map → Blueprint → Build.
skill: smali-to-kotlin
---

# /reverse-android — Android APK Reverse Engineering Workflow

> **Skill:** `smali-to-kotlin` v2.0 | **Tech:** Kotlin + Compose + Hilt + Retrofit + Room
> **Philosophy:** "Treat decompiled code as a MAP, not a TODO list"
> **Approach:** Map → Blueprint → Build (progressive disclosure)

---

## ⚡ QUICK START

User cung cấp: Apktool output dir, `AndroidManifest.xml`, hoặc nói "reverse engineer APK này".
Workflow dẫn dắt qua **4 phases** — mỗi phase có zoom level riêng, **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
reverse_session:
  project_name: "[TBD - từ manifest]"
  apktool_dir: "[path]"
  current_phase: 0
  current_zoom: 0       # 0=satellite, 1=district, 2=block, 3=ground
  current_feature: null  # set khi user chọn feature ở Phase 2
  app_map_done: false
  architecture_done: false
  completed_features: []
  pending_features: []
  decisions: []
```

### Bước 0.2: Xác nhận input

```
🔧 Android Reverse Engineering v2.0 — Map → Blueprint → Build

Em cần biết:
1. Thư mục Apktool output ở đâu?
2. Tên app gốc? Package name?

Chưa chạy Apktool? → apktool d your-app.apk -o ./decompiled/
```

---

## 📋 Pipeline Overview (4 Phases)

| Phase | Name | Sub-workflow | Zoom | Code? | Gate |
|-------|------|-------------|------|-------|------|
| 0 | 🗺️ Discovery | [`/re-android-discover`](reverse-android-discover.md) | Satellite | ❌ | User approves Map |
| 1 | 🏗️ Architecture | [`/re-android-design`](reverse-android-design.md) | District | ❌ | User approves Architecture |
| 2 | 📐 Blueprint | [`/re-android-build`](reverse-android-build.md) | Block | Signatures | Per-feature approval |
| 3 | 🔨 Implementation | [`/re-android-build`](reverse-android-build.md) | Ground | Full | Per-feature checkpoint |

### Execution Flow

```
Session Setup
    ↓
Phase 0: Discovery (/re-android-discover) → App Map
    ↓ [User approves]
Phase 1: Architecture (/re-android-design) → Architecture Blueprint
    ↓ [User approves + picks feature]
Phase 2+3 Loop (/re-android-build):
    → Blueprint Feature X → Build Feature X → Checkpoint
    → Blueprint Feature Y → Build Feature Y → Checkpoint
    → ... (repeat for all features)
    ↓
Final: Parity Check & Quality Gate
```

---

## 🔭 ZOOM CONTROL

AI phải tự check **TRƯỚC MỖI output**:

```yaml
pre_output_check:
  - "Đang ở zoom level nào? (0/1/2/3)"
  - "Output có đúng zoom level không?"
  - "Có function body trong Phase 0/1 không? → REMOVE"

zoom_rules:
  zoom_0: "NO CODE. Only diagrams, tables, maps."
  zoom_1: "NO CODE BODIES. Only architecture diagrams, file lists."
  zoom_2: "SIGNATURES ONLY. Interfaces, data classes, sealed classes."
  zoom_3: "FULL CODE. Implementation for ONE feature at a time."
```

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Phase 0 (Discovery) — always first, MUST create App Map
  - Phase 1 (Architecture) — MUST design before coding
  - User approval at each phase gate
  - Per-feature Blueprint before Implementation

never_do:
  - Write code in Phase 0 or Phase 1
  - Mass-copy resources from APK (on-demand only)
  - Implement multiple features simultaneously
  - Skip parity check for crypto utils

always_do:
  - Start with App Map (Phase 0)
  - Present Architecture for review (Phase 1)
  - Create Blueprint before coding each feature (Phase 2)
  - Checkpoint after each feature (Phase 3)
  - Document all decisions in session state
```

---

## 🔗 Related

- **Sub-workflows:**
  - [`/re-android-discover`](reverse-android-discover.md) — Phase 0: Discovery
  - [`/re-android-design`](reverse-android-design.md) — Phase 1: Architecture
  - [`/re-android-build`](reverse-android-build.md) — Phase 2+3: Blueprint + Build
- **Skill:** `smali-to-kotlin` v2.0 (core knowledge & rules)
- **Sibling:** `/reverse-ios` (iOS counterpart)
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-android workflow v3.0.0 — Progressive Disclosure RE Pipeline*
