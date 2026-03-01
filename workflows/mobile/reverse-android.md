---
description: 🔧 Dịch ngược APK Android (Apktool output) → App Kotlin hiện đại với Jetpack Compose, Clean Architecture, và Library Scanner tự động.
skill: smali-to-kotlin
---

# /reverse-android — Android APK Reverse Engineering Workflow

> **Skill:** `smali-to-kotlin` | **Tech:** Kotlin + Compose + Hilt + Retrofit + Room
> **Philosophy:** "Read Smali to understand WHAT & WHY → Write Kotlin for HOW"

---

## ⚡ QUICK START

User cung cấp: Apktool output dir, `AndroidManifest.xml`, hoặc nói "reverse engineer APK này".
Workflow dẫn dắt từng bước — **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup

### Bước 0.1: Khởi tạo session state

```yaml
reverse_session:
  project_name: "[TBD - từ manifest]"
  apktool_dir: "[path]"
  current_step: 0
  library_report_done: false
  manifest_analyzed: false
  completed_screens: []
  pending_screens: []
  decisions: []
```

### Bước 0.2: Xác nhận input

```
🔧 Android Reverse Engineering bắt đầu!

Em cần biết:
1. Thư mục Apktool output ở đâu?
2. Tên app gốc? Package name?

Chưa chạy Apktool? → apktool d your-app.apk -o ./decompiled/
```

---

## 📋 Pipeline Overview (7 Steps)

| Step | Phase | Sub-workflow | Gate |
|------|-------|-------------|------|
| 0 | 📦 Library Scanner | [`/re-android-scan`](reverse-android-scan.md) | User approve report |
| 1 | 📄 Manifest & Bootstrap | [`/re-android-scan`](reverse-android-scan.md) | Checkpoint |
| 2 | 💾 Data Layer | [`/re-android-build`](reverse-android-build.md) | Checkpoint |
| 3 | 🧮 Core Logic & Utils | [`/re-android-build`](reverse-android-build.md) | Checkpoint |
| 4 | 🎨 UI & ViewModel | [`/re-android-build`](reverse-android-build.md) | Per-screen loop |
| 5 | 📦 SDK Integration | [`/re-android-build`](reverse-android-build.md) | Checkpoint |
| 6 | ✅ Parity Check | [`/re-android-build`](reverse-android-build.md) | Final QA |

### Execution Flow

```
Session Setup → Step 0+1 (/re-android-scan) → Step 2-6 (/re-android-build)
```

**Chạy tuần tự:** Xong `/re-android-scan` → chuyển sang `/re-android-build`.

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Step 0 (Library Scanner) — always first
  - User approval of Library Report — gate before Step 1
  - Checkpoint after each step — no silent progress

never_do:
  - Mass-copy resources from APK (on-demand only)
  - Use deprecated libraries without replacement plan
  - Skip parity check for encryption utils
  - Proceed to next step without user confirmation

always_do:
  - Document decisions in session state
  - Present Library Report before any coding
  - Unit test all crypto/hash functions
  - Update session state after each screen in Step 4
```

---

## 🔗 Related

- **Sub-workflows:** [`/re-android-scan`](reverse-android-scan.md) · [`/re-android-build`](reverse-android-build.md)
- **Skill:** `smali-to-kotlin` (core knowledge & rules)
- **Library DB:** `skills/smali-to-kotlin/library-patterns.md`
- **Smali Guide:** `skills/smali-to-kotlin/smali-reading-guide.md`
- **Sibling:** `/reverse-ios` (iOS counterpart)
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-android workflow v2.0.0 — Modular RE Pipeline*
