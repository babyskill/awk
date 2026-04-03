---
description: 🔧 Dịch ngược APK Android (Apktool output) → App Kotlin hiện đại với Jetpack Compose, Clean Architecture, và UI-First methodology.
skill: smali-to-kotlin
---

# /reverse-android — Android APK Reverse Engineering Workflow

> **Skill:** `smali-to-kotlin` v2.0 | **Tech:** Kotlin + Compose + Hilt + Retrofit + Room
> **Philosophy:** "Map → Blueprint → UI First → Logic Behind"
> **Key:** UI is designed and approved BEFORE coding any business logic.

---

## ⚡ QUICK START

User cung cấp: Apktool output dir, `AndroidManifest.xml`, hoặc nói "reverse engineer APK này".
Workflow dẫn dắt qua **5 phases** — UI-First approach, **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
reverse_session:
  project_name: "[TBD - từ manifest]"
  apktool_dir: "[path]"
  current_phase: 0
  current_feature: null
  phase_2_status:
    contracts: pending
    ui_shell: pending
    resources: pending
  completed_features: []
  pending_features: []
  decisions: []
```

### Bước 0.2: Xác nhận input

```
🔧 Android Reverse Engineering v2.0 — UI-First Pipeline

Em cần biết:
1. Thư mục Apktool output ở đâu?
2. Tên app gốc? Package name?

Chưa chạy Apktool? → apktool d your-app.apk -o ./decompiled/
```

---

## 📋 Pipeline Overview (5 Phases — UI-First)

| Phase | Name | Sub-workflow | Code? | Gate |
|-------|------|-------------|-------|------|
| 0 | 🗺️ Discovery | [`/re-android-discover`](reverse-android-discover.md) | ❌ | User approves Map |
| 1 | 🏗️ Architecture | [`/re-android-design`](reverse-android-design.md) | ❌ | User approves Architecture |
| 2 | 📐🎨 Blueprint + UI | [`/re-android-build`](reverse-android-build.md) | UI code | User approves UI + Contracts |
| 3 | 🔨 Logic Build | [`/re-android-build`](reverse-android-build.md) | Full logic | Feature checkpoint |
| 4 | ✅ Final Parity | [`/re-android-build`](reverse-android-build.md) | — | Final check |

### Execution Flow

```
Session Setup
    ↓
Phase 0: Discovery (/re-android-discover) → App Map
    ↓ [User approves]
Phase 1: Architecture (/re-android-design) → Architecture Blueprint
    ↓ [User approves + picks feature]
Feature Loop (/re-android-build):
    Phase 2: Blueprint + UI (contracts + visual shell + resources)
        ↓ 🚦 GATE: User approves UI + contracts
    Phase 3: Logic Build (domain → data → DI → VM → wire UI)
        ↓ 📊 CHECKPOINT: Feature done
    → Repeat for next feature
    ↓
Phase 4: Final Parity Check & Quality Gate
```

---

## 🔭 ZOOM CONTROL

```yaml
pre_output_check:
  - "Đang ở phase nào?"
  - "Output có đúng phase rule không?"
  - "Phase 0/1: NO CODE BODIES"
  - "Phase 2: UI code + signatures (no logic bodies)"
  - "Phase 3: Full implementation code"

phase_rules:
  phase_0: "NO CODE. Only diagrams, tables, maps."
  phase_1: "NO CODE BODIES. Only architecture diagrams, file lists."
  phase_2_contracts: "SIGNATURES ONLY. Interfaces, data classes, sealed classes."
  phase_2_ui: "FULL UI CODE. Compose with hardcoded mock data + @Preview."
  phase_3: "FULL LOGIC CODE. Domain → Data → DI → VM → Wire UI."
```

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Phase 0 (Discovery) — always first
  - Phase 1 (Architecture) — design before coding
  - Phase 2 UI Gate — user MUST approve UI before Phase 3
  - Per-feature Blueprint before Logic Build

never_do:
  - Write logic code before UI is approved
  - Mass-copy resources from APK (on-demand only)
  - Implement multiple features simultaneously
  - Modify UI significantly in Phase 3 (only wire, don't redesign)
  - Skip crypto parity check

always_do:
  - Extract resources BEFORE coding UI (Phase 2.7 → 2.8)
  - Create @Preview for ALL states
  - Keep stateless composable (LoginScreenContent) after wiring
  - Checkpoint after each feature
  - Document all decisions
```

---

## 🔗 Related

- **Sub-workflows:**
  - [`/re-android-discover`](reverse-android-discover.md) — Phase 0: Discovery
  - [`/re-android-design`](reverse-android-design.md) — Phase 1: Architecture
  - [`/re-android-build`](reverse-android-build.md) — Phase 2+3+4: Blueprint + UI + Build
- **Skill:** `smali-to-kotlin` v2.0 (UI-First pipeline)
- **Sibling:** `/reverse-ios` (iOS counterpart)
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-android workflow v4.0.0 — UI-First RE Pipeline*
