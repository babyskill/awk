---
description: 📦 RE iOS Phase 1 — Framework Scanner + Info.plist Analysis + Project Bootstrap
parent: reverse-ios
---

# /re-ios-scan — Framework Scanner & Plist Analysis

> **Parent:** [`/reverse-ios`](reverse-ios.md) → Step 0 + Step 1
> **Skill:** `smali-to-swift` | **Reference:** `skills/smali-to-swift/framework-patterns.md`

---

## 📦 Step 0: Framework Scanner (BẮT BUỘC)

> Nhận diện toàn bộ frameworks **trước khi code bất kỳ thứ gì**.

### 0.3: Quét IPA structure

```bash
# Embedded frameworks
ls [app_bundle]/Frameworks/

# Linked libraries (Mach-O)
otool -L [app_bundle]/App | grep -v /System | grep -v /usr/lib

# Header imports
grep -rh "#import <" [headers_dir]/ | sort -u
grep -rh "@import " [headers_dir]/ | sort -u

# SDK identifiers
strings [app_bundle]/App | grep -i "cocoapods\|carthage\|firebase\|facebook\|google"

# Assets & resources
ls [app_bundle]/*.car [app_bundle]/*.momd [app_bundle]/*.storyboardc 2>/dev/null
find [app_bundle] -name "*.json" -o -name "*.plist" | grep -v Info.plist | sort
```

### 0.4: Tạo Framework Detection Report

Dùng patterns từ `framework-patterns.md`:

```markdown
## 📦 Framework Detection Report — [App Name]

### ✅ Reuse (Add via SPM)
| Framework | Detected | Version | Notes |
|-----------|----------|---------|-------|

### 🔄 Replace (Legacy → Modern Swift)
| Old Framework | Detected | Replacement |
|---------------|----------|-------------|
| AFNetworking | Frameworks/ | URLSession async/await |
| SDWebImage | imports | AsyncImage + Kingfisher |
| SnapKit | imports | SwiftUI layout |

### 🍏 Apple Frameworks
| Framework | Purpose | SwiftUI Equivalent |
|-----------|---------|-------------------|
| MapKit | Maps | Map (SwiftUI) |
| CoreData | Database | SwiftData |

### 📱 Native Libraries
| File | Notes |
|------|-------|

### 🏷️ App Code (Rewrite in Swift)
| Class Prefix | Module |
|-------------|--------|

### ❓ Unknown
| Framework | Notes |
|-----------|-------|
```

### 0.5: User approval

> **GATE:** Không tiếp tục khi chưa có user approval.

---

## 📄 Step 1: Info.plist & Entitlements + Project Bootstrap

> **Input:** `[app_bundle]/Info.plist` + entitlements

### 1.1: Đọc Info.plist

```bash
plutil -p [app_bundle]/Info.plist
codesign -d --entitlements :- [app_bundle]/App 2>/dev/null
```

Trích xuất:

```yaml
extract:
  - bundle_id, display_name, min_ios_version
  - permissions: [camera, photos, location, microphone, notifications, tracking]
  - url_schemes, universal_links
  - capabilities: [push, apple_pay, sign_in_apple, app_groups]
  - supported_orientations
```

### 1.2: Phân tích class hierarchy

```bash
grep -rl "UIViewController" [headers_dir]/ | sort
grep -rl "UITabBarController" [headers_dir]/
grep -rl "UINavigationController" [headers_dir]/
```

Mapping VCs → SwiftUI:
```
SplashViewController  → SplashScreen.swift
LoginViewController   → Auth/LoginScreen.swift
MainTabBarController  → TabView in ContentView.swift
HomeViewController    → Home/HomeScreen.swift
```

### 1.3: Xcode project structure

Đề xuất Clean Architecture structure (xem SKILL.md Step 1).

### 1.4: SPM Dependencies (từ Framework Report)

```swift
// Firebase: firebase/firebase-ios-sdk 11.0+
// Kingfisher: onevcat/Kingfisher 7.12+
// KeychainAccess: kishikawakatsumi/KeychainAccess 4.2+
// Lottie: airbnb/lottie-ios 4.4+
```

### ✅ Checkpoint Step 1

```markdown
## ✅ Step 1 Complete

- Bundle ID: [bundle_id]
- Permissions: [count] | Screens: [count]
- URL Schemes: [list]

⏭️ Next: `/re-ios-build` — Step 2 (Data Layer)
Cung cấp headers: *Service, *Manager, *Client, *API, *Model
```

---

## 🔗 Related

- **Next:** [`/re-ios-build`](reverse-ios-build.md) (Step 2-6)
- **Parent:** [`/reverse-ios`](reverse-ios.md)
- **Framework patterns:** `skills/smali-to-swift/framework-patterns.md`

---

*re-ios-scan v2.0.0 — Phase 1: Discovery & Bootstrap*
