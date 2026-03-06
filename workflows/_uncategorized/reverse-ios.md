---
description: 🍎 Dịch ngược IPA iOS (class-dump, Hopper output) → App Swift hiện đại với SwiftUI, Clean Architecture, và UI-First methodology.
skill: smali-to-swift
---

# /reverse-ios — iOS IPA Reverse Engineering Workflow

> **Skill:** `smali-to-swift` v2.0 | **Tech:** Swift + SwiftUI + async/await + URLSession + SwiftData
> **Philosophy:** "Map → Blueprint → UI First → Logic Behind"
> **Key:** UI is designed and approved BEFORE coding any business logic.
> **Sibling:** `/reverse-android`

---

## ⚡ QUICK START

User cung cấp: Decrypted `.app` bundle, class-dump headers, Hopper pseudo-code, hoặc nói "reverse engineer IPA này".
Workflow dẫn dắt qua **5 phases** — UI-First approach, **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
reverse_ios_session:
  project_name: "[TBD - từ Info.plist]"
  app_bundle_dir: "[path]"
  headers_dir: "[class-dump output]"
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
🍎 iOS Reverse Engineering v2.0 — UI-First Pipeline

Em cần biết:
1. Decrypted .app bundle ở đâu?
2. Class-dump headers ở đâu?
3. Tên app gốc? Bundle ID?

Chưa chuẩn bị?
→ bagbak -o ~/decrypted/ com.example.app
→ class-dump -H ~/decrypted/App.app -o ~/headers/
```

---

## 📋 Pipeline Overview (5 Phases — UI-First)

| Phase | Name | Sub-workflow | Code? | Gate |
|-------|------|-------------|-------|------|
| 0 | 🗺️ Discovery | [`/re-ios-discover`](reverse-ios-discover.md) | ❌ | User approves Map |
| 1 | 🏗️ Architecture | [`/re-ios-design`](reverse-ios-design.md) | ❌ | User approves Architecture |
| 2 | 📐🎨 Blueprint + UI | [`/re-ios-build`](reverse-ios-build.md) | UI code | User approves UI + Contracts |
| 3 | 🔨 Logic Build | [`/re-ios-build`](reverse-ios-build.md) | Full logic | Feature checkpoint |
| 4 | ✅ Final Parity | [`/re-ios-build`](reverse-ios-build.md) | — | Final check |

### Execution Flow

```
Session Setup
    ↓
Phase 0: Discovery (/re-ios-discover) → App Map
    ↓ [User approves]
Phase 1: Architecture (/re-ios-design) → Architecture Blueprint
    ↓ [User approves + picks feature]
Feature Loop (/re-ios-build):
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
  phase_1: "NO CODE BODIES. Only architecture, file lists."
  phase_2_contracts: "SIGNATURES ONLY. Protocols, structs, enums."
  phase_2_ui: "FULL UI CODE. SwiftUI with hardcoded mock data + #Preview."
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
  - Mass-copy assets from IPA (on-demand only)
  - Use UIKit when SwiftUI equivalent exists
  - Use GCD for new async code (use async/await)
  - Use ObjC in new code (Swift only)
  - Modify UI significantly in Phase 3 (only wire, don't redesign)
  - Implement multiple features simultaneously

always_do:
  - Extract resources BEFORE coding UI (Phase 2.7 → 2.8)
  - Create #Preview for ALL states
  - Keep stateless View (LoginScreenContent) after wiring
  - XCTest all crypto/hash functions
  - Use @Observable for ViewModels
  - Use NavigationStack, SPM
  - Checkpoint after each feature
```

---

## 🔗 Related

- **Sub-workflows:**
  - [`/re-ios-discover`](reverse-ios-discover.md) — Phase 0: Discovery
  - [`/re-ios-design`](reverse-ios-design.md) — Phase 1: Architecture
  - [`/re-ios-build`](reverse-ios-build.md) — Phase 2+3+4: Blueprint + UI + Build
- **Skill:** `smali-to-swift` v2.0 (UI-First pipeline)
- **Sibling:** `/reverse-android`
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-ios workflow v4.0.0 — UI-First RE Pipeline*
