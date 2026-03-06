---
description: 🗺️ RE iOS Phase 0 — Discovery & App Map (NO CODE output)
parent: reverse-ios
---

# /re-ios-discover — Discovery & App Map

> **Parent:** [`/reverse-ios`](reverse-ios.md) → Phase 0
> **Skill:** `smali-to-swift` → `phase-0-discovery.md`
> **Zoom Level:** 0 — Satellite View
> **Output:** App Map (diagrams, tables, NO CODE)

---

## ⛔ ZOOM 0 RULE

```
This workflow produces NO CODE output.
Only: diagrams, tables, bullet lists, bash scan commands.
If you are about to write Swift code → STOP → wrong zoom level.
```

---

## 📦 Step 0: Framework Scanner

### 0.1: Quét IPA structure

```bash
# Embedded frameworks
ls [app_bundle]/Frameworks/ 2>/dev/null

# Non-system linked libs
otool -L [app_bundle]/[AppName] | grep -v /System | grep -v /usr/lib

# Header imports
grep -rh "#import <" [headers_dir]/ | sort -u | head -30
grep -rh "@import " [headers_dir]/ | sort -u

# VC count
grep -rl "UIViewController" [headers_dir]/ | wc -l

# Resources
ls [app_bundle]/*.car [app_bundle]/*.momd [app_bundle]/*.storyboardc 2>/dev/null
find [app_bundle] -name "*.json" -o -name "*.plist" | grep -v Info.plist | sort

# SDK markers
strings [app_bundle]/[AppName] | grep -i "cocoapods\|carthage\|firebase\|facebook" | head -20
```

### 0.2: Phân loại frameworks

| Category | Action |
|----------|--------|
| ✅ Reuse | Add via SPM |
| 🔄 Replace | Map to modern Swift |
| 🍏 Apple | Use SwiftUI equivalents |
| 📱 Native | Keep, bridging header |
| 🏷️ App Code | Rebuild in Swift |

### 0.3: User approval

> **GATE:** Framework Report → User approve.

---

## 📄 Step 1: Info.plist & Entitlements

```bash
plutil -p [app_bundle]/Info.plist
codesign -d --entitlements :- [app_bundle]/[AppName] 2>/dev/null
```

### 1.1: Trích xuất

- Bundle ID, Display Name, Min iOS
- Privacy permissions (NSCameraUsageDescription, etc.)
- URL Schemes, Universal Links
- Capabilities (push, Apple Pay, Sign In with Apple)

### 1.2: Screen Map

```bash
grep -rl "UIViewController" [headers_dir]/ | sort
grep -rl "UITabBarController" [headers_dir]/
grep -rl "UINavigationController" [headers_dir]/
```

Mapping VCs → SwiftUI screens + navigation flow.

### 1.3: Complexity Estimate

| Area | Rating | Notes |
|------|--------|-------|

---

## 📊 Output: App Map

Template: `skills/smali-to-swift/templates/app-map.md`

---

## ✅ Gate

```
"🗺️ App Map xong! Anh review → OK → Phase 1 (Architecture)."
→ /re-ios-design
```

---

## 🔗 Related

- **Next:** [`/re-ios-design`](reverse-ios-design.md)
- **Parent:** [`/reverse-ios`](reverse-ios.md)

---

*re-ios-discover v3.0.0 — Phase 0: Discovery & App Map*
