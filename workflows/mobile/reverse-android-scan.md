---
description: 📦 RE Android Phase 1 — Library Scanner + Manifest Analysis + Project Bootstrap
parent: reverse-android
---

# /re-android-scan — Library Scanner & Manifest Analysis

> **Parent:** [`/reverse-android`](reverse-android.md) → Step 0 + Step 1
> **Skill:** `smali-to-kotlin` | **Reference:** `skills/smali-to-kotlin/library-patterns.md`

---

## 📦 Step 0: Library Scanner (BẮT BUỘC)

> Nhận diện toàn bộ thư viện **trước khi code bất kỳ thứ gì**.

### 0.3: Quét Smali directories

```bash
# Top-level packages
find [apktool_dir]/smali -maxdepth 3 -type d | sed 's|[apktool_dir]/smali/||' | sort

# Multi-dex
find [apktool_dir] -name "smali*" -maxdepth 1 -type d
find [apktool_dir]/smali_classes2 -maxdepth 3 -type d 2>/dev/null | sort

# Native libraries & Assets
find [apktool_dir]/lib -name "*.so" 2>/dev/null
ls [apktool_dir]/assets/ 2>/dev/null
```

### 0.4: Tạo Library Detection Report

Dùng patterns từ `library-patterns.md`, phân loại:

```markdown
## 📦 Library Detection Report — [App Name]

### ✅ Reuse (build.gradle)
| Library | Package Detected | Version | Notes |
|---------|-----------------|---------|-------|
| Retrofit | com/squareup/retrofit2 | 2.9.0 | Keep |
| OkHttp | com/squareup/okhttp3 | 4.12.0 | Keep |

### 🔄 Replace (Legacy → Modern)
| Old Library | Detected | Replacement |
|-------------|----------|-------------|
| Volley | com/android/volley | Retrofit + OkHttp |
| AsyncTask | android.os.AsyncTask | Coroutines |

### 🔵 Firebase/Google SDKs
| SDK | Detected | Action |
|-----|----------|--------|

### 📱 Native (.so) — Giữ nguyên
| File | Architecture | Notes |
|------|-------------|-------|

### 🏷️ App Code (Rebuild in Kotlin)
| Package | Module |
|---------|--------|

### ❓ Unknown (Cần điều tra)
| Package | Path | Possible |
|---------|------|----------|
```

### 0.5: User approval

> **GATE:** Không tiếp tục Step 1 khi chưa có user approval report.

---

## 📄 Step 1: AndroidManifest Analysis & Project Bootstrap

> **Input:** `[apktool_dir]/AndroidManifest.xml`

### 1.1: Phân tích Manifest

Trích xuất:

```yaml
extract:
  - application_id, package_name
  - min_sdk, target_sdk
  - permissions: [network, storage, camera, location, other]
  - entry_points: [application_class, splash_activity, main_activity]
  - components: [activities, services, receivers, providers]
  - deep_links, features
```

### 1.2: Đề xuất project structure

Mapping activities → Compose screens (xem SKILL.md Step 1):

```
SplashActivity → presentation/screens/splash/SplashScreen.kt
MainActivity   → presentation/screens/main/MainScreen.kt
LoginActivity  → presentation/screens/auth/LoginScreen.kt
```

### 1.3: Tạo `build.gradle.kts` skeleton

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "[package_name]"
    compileSdk = [target_sdk]
    defaultConfig {
        applicationId = "[application_id]"
        minSdk = [min_sdk]
        targetSdk = [target_sdk]
    }
    buildFeatures { compose = true; buildConfig = true }
}

dependencies {
    // Compose BOM + Material3 + Navigation
    // Coroutines + Hilt DI
    // Network: Retrofit + OkHttp (từ Library Report)
    // Local: Room + DataStore
    // Image: Coil + Logging: Timber
    // [Thêm libs từ "Reuse" section]
}
```

### ✅ Checkpoint Step 1

```markdown
## ✅ Step 1 Complete

- Package: [package_name]
- Entry points: [list]
- Screens to rebuild: [list]

⏭️ Next: `/re-android-build` — Step 2 (Data Layer)
Cung cấp Smali: smali/[package]/network/, model/, data/
```

---

## 🔗 Related

- **Next:** [`/re-android-build`](reverse-android-build.md) (Step 2-6)
- **Parent:** [`/reverse-android`](reverse-android.md)
- **Library patterns:** `skills/smali-to-kotlin/library-patterns.md`

---

*re-android-scan v2.0.0 — Phase 1: Discovery & Bootstrap*
