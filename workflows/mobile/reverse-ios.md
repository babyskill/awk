---
description: 🍎 Dịch ngược IPA iOS (class-dump, Hopper output) → App Swift hiện đại với SwiftUI, Clean Architecture, và Framework Scanner tự động.
skill: smali-to-swift
---

# /reverse-ios — iOS IPA Reverse Engineering Workflow

> **Skill:** `smali-to-swift` | **Tech:** Swift + SwiftUI + async/await + URLSession + SwiftData
> **Philosophy:** "Read ObjC headers to understand WHAT & WHY → Write Swift for HOW"
> **Sibling:** `/reverse-android`

---

## ⚡ QUICK START

User cung cấp: Decrypted `.app` bundle, class-dump headers, Hopper pseudo-code, hoặc nói "reverse engineer IPA này".
Workflow dẫn dắt từng bước — **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
reverse_ios_session:
  project_name: "[TBD - từ Info.plist]"
  app_bundle_dir: "[path]"
  headers_dir: "[class-dump output]"
  current_step: 0
  framework_report_done: false
  plist_analyzed: false
  completed_screens: []
  pending_screens: []
  decisions: []
```

### Bước 0.2: Xác nhận input

```
🍎 iOS Reverse Engineering bắt đầu!

Em cần biết:
1. Decrypted .app bundle ở đâu?
2. Class-dump headers ở đâu?
3. Tên app gốc? Bundle ID?

Chưa chuẩn bị?
→ bagbak -o ~/decrypted/ com.example.app
→ class-dump -H ~/decrypted/App.app -o ~/headers/
```

---

## 📋 Pipeline Overview (7 Steps)

| Step | Phase | Sub-workflow | Gate |
|------|-------|-------------|------|
| 0 | 📦 Framework Scanner | [`/re-ios-scan`](reverse-ios-scan.md) | User approve report |
| 1 | 📄 Info.plist & Bootstrap | [`/re-ios-scan`](reverse-ios-scan.md) | Checkpoint |
| 2 | 💾 Data Layer | [`/re-ios-build`](reverse-ios-build.md) | Checkpoint |
| 3 | 🧮 Core Logic & Utils | [`/re-ios-build`](reverse-ios-build.md) | Checkpoint |
| 4 | 🎨 UI & ViewModel | [`/re-ios-build`](reverse-ios-build.md) | Per-screen loop |
| 5 | 📦 SDK Integration | [`/re-ios-build`](reverse-ios-build.md) | Checkpoint |
| 6 | ✅ Parity Check | [`/re-ios-build`](reverse-ios-build.md) | Final QA |

### Execution Flow

```
Session Setup → Step 0+1 (/re-ios-scan) → Step 2-6 (/re-ios-build)
```

**Chạy tuần tự:** Xong `/re-ios-scan` → chuyển sang `/re-ios-build`.

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Step 0 (Framework Scanner) — always first
  - User approval of Framework Report
  - Checkpoint after each step

never_do:
  - Mass-copy assets from IPA
  - Use UIKit when SwiftUI equivalent exists
  - Use GCD for new async code (use async/await)
  - Use ObjC in new code (Swift only, except bridging headers)
  - Skip crypto parity testing

always_do:
  - Document decisions in session state
  - Present Framework Report before coding
  - XCTest all crypto/hash functions
  - Use @Observable for ViewModels (iOS 17+)
  - Use NavigationStack for navigation
  - Use SPM for all dependencies
```

---

## 🔗 Related

- **Sub-workflows:** [`/re-ios-scan`](reverse-ios-scan.md) · [`/re-ios-build`](reverse-ios-build.md)
- **Skill:** `smali-to-swift` (core knowledge & rules)
- **Framework DB:** `skills/smali-to-swift/framework-patterns.md`
- **ObjC Guide:** `skills/smali-to-swift/objc-reading-guide.md`
- **Sibling:** `/reverse-android` (Android counterpart)
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-ios workflow v2.0.0 — Modular RE Pipeline*
