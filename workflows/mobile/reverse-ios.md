---
description: 🍎 Dịch ngược IPA iOS (class-dump, Hopper output) → App Swift hiện đại với SwiftUI, Clean Architecture. Progressive Disclosure: Map → Blueprint → Build.
skill: smali-to-swift
---

# /reverse-ios — iOS IPA Reverse Engineering Workflow

> **Skill:** `smali-to-swift` v2.0 | **Tech:** Swift + SwiftUI + async/await + URLSession + SwiftData
> **Philosophy:** "Treat decompiled code as a MAP, not a TODO list"
> **Approach:** Map → Blueprint → Build (progressive disclosure)
> **Sibling:** `/reverse-android`

---

## ⚡ QUICK START

User cung cấp: Decrypted `.app` bundle, class-dump headers, Hopper pseudo-code, hoặc nói "reverse engineer IPA này".
Workflow dẫn dắt qua **4 phases** — mỗi phase có zoom level riêng, **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
reverse_ios_session:
  project_name: "[TBD - từ Info.plist]"
  app_bundle_dir: "[path]"
  headers_dir: "[class-dump output]"
  current_phase: 0
  current_zoom: 0
  current_feature: null
  app_map_done: false
  architecture_done: false
  completed_features: []
  pending_features: []
  decisions: []
```

### Bước 0.2: Xác nhận input

```
🍎 iOS Reverse Engineering v2.0 — Map → Blueprint → Build

Em cần biết:
1. Decrypted .app bundle ở đâu?
2. Class-dump headers ở đâu?
3. Tên app gốc? Bundle ID?

Chưa chuẩn bị?
→ bagbak -o ~/decrypted/ com.example.app
→ class-dump -H ~/decrypted/App.app -o ~/headers/
```

---

## 📋 Pipeline Overview (4 Phases)

| Phase | Name | Sub-workflow | Zoom | Code? | Gate |
|-------|------|-------------|------|-------|------|
| 0 | 🗺️ Discovery | [`/re-ios-discover`](reverse-ios-discover.md) | Satellite | ❌ | User approves Map |
| 1 | 🏗️ Architecture | [`/re-ios-design`](reverse-ios-design.md) | District | ❌ | User approves Architecture |
| 2 | 📐 Blueprint | [`/re-ios-build`](reverse-ios-build.md) | Block | Signatures | Per-feature approval |
| 3 | 🔨 Implementation | [`/re-ios-build`](reverse-ios-build.md) | Ground | Full | Per-feature checkpoint |

### Execution Flow

```
Session Setup
    ↓
Phase 0: Discovery (/re-ios-discover) → App Map
    ↓ [User approves]
Phase 1: Architecture (/re-ios-design) → Architecture Blueprint
    ↓ [User approves + picks feature]
Phase 2+3 Loop (/re-ios-build):
    → Blueprint Feature X → Build Feature X → Checkpoint
    → Blueprint Feature Y → Build Feature Y → Checkpoint
    ↓
Final: Parity Check & Quality Gate
```

---

## 🔭 ZOOM CONTROL

```yaml
pre_output_check:
  - "Đang ở zoom level nào?"
  - "Output có đúng zoom level không?"
  - "Có function body trong Phase 0/1 không? → REMOVE"

zoom_rules:
  zoom_0: "NO CODE. Only diagrams, tables, maps."
  zoom_1: "NO CODE BODIES. Only architecture, file lists."
  zoom_2: "SIGNATURES ONLY. Protocols, structs, enums."
  zoom_3: "FULL CODE. Implementation for ONE feature."
```

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Phase 0 (Discovery) — always first
  - Phase 1 (Architecture) — design before code
  - Per-feature Blueprint before Implementation

never_do:
  - Write code in Phase 0 or Phase 1
  - Mass-copy assets from IPA
  - Use UIKit when SwiftUI equivalent exists
  - Use GCD for new async code (use async/await)
  - Use ObjC in new code (Swift only)
  - Implement multiple features simultaneously

always_do:
  - Start with App Map
  - Create Blueprint before each feature
  - XCTest all crypto/hash functions
  - Use @Observable for ViewModels
  - Use NavigationStack, SPM
```

---

## 🔗 Related

- **Sub-workflows:**
  - [`/re-ios-discover`](reverse-ios-discover.md) — Phase 0: Discovery
  - [`/re-ios-design`](reverse-ios-design.md) — Phase 1: Architecture
  - [`/re-ios-build`](reverse-ios-build.md) — Phase 2+3: Blueprint + Build
- **Skill:** `smali-to-swift` v2.0
- **Sibling:** `/reverse-android`
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-ios workflow v3.0.0 — Progressive Disclosure RE Pipeline*
