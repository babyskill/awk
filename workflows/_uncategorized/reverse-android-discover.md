---
description: 🗺️ RE Android Phase 0 — Discovery & App Map (NO CODE output)
parent: reverse-android
---

# /re-android-discover — Discovery & App Map

> **Parent:** [`/reverse-android`](reverse-android.md) → Phase 0
> **Skill:** `smali-to-kotlin` → `phase-0-discovery.md`
> **Zoom Level:** 0 — Satellite View
> **Output:** App Map (diagrams, tables, NO CODE)

---

## ⛔ ZOOM 0 RULE

```
This workflow produces NO CODE output.
Only: diagrams, tables, bullet lists, bash scan commands.
If you are about to write Kotlin code → STOP → you are at wrong zoom level.
```

---

## 📦 Step 0: Library Scanner

> Nhận diện toàn bộ thư viện **trước khi làm bất kỳ thứ gì**.

### 0.1: Quét structure

```bash
# Top-level packages
find [apktool_dir]/smali -maxdepth 3 -type d | sed 's|.*/smali/||' | sort

# Multi-dex check
find [apktool_dir] -name "smali*" -maxdepth 1 -type d

# Resource counts
ls [apktool_dir]/res/layout/ 2>/dev/null | wc -l
ls [apktool_dir]/res/drawable*/ 2>/dev/null | wc -l

# Native + Assets
find [apktool_dir]/lib -name "*.so" 2>/dev/null
ls [apktool_dir]/assets/ 2>/dev/null
```

### 0.2: Phân loại thư viện

Dùng patterns từ `library-patterns.md`, phân thành 5 nhóm:

| Category | Example | Action |
|----------|---------|--------|
| ✅ Reuse | Retrofit, OkHttp | Add to build.gradle |
| 🔄 Replace | Volley, AsyncTask | Map to modern |
| 🔵 Google/Firebase | FCM, Analytics | Use latest |
| 📱 Native | .so files | Keep, JNI bridge |
| 🏷️ App Code | com.app.* | Rebuild |

### 0.3: User approval

> **GATE:** Hiển thị Library Report → User approve trước khi tiếp.

---

## 📄 Step 1: Manifest Analysis

```bash
cat [apktool_dir]/AndroidManifest.xml
```

### 1.1: Trích xuất

- Application ID + Package name
- Min/Target SDK
- Permissions (phân nhóm: network, storage, camera, location, other)
- Entry points: Application class, Launcher Activity, MainActivity
- Components: Activities (→ future screens), Services, Receivers, Providers
- Deep links / Intent filters

### 1.2: Screen Map

Map Activities → future Compose screens:

```
SplashActivity    → presentation/screens/splash/
LoginActivity     → presentation/screens/auth/
MainActivity      → presentation/screens/main/
DetailActivity    → presentation/screens/detail/
SettingsActivity  → presentation/screens/settings/
```

Draw navigation flow (ASCII or Mermaid).

### 1.3: Complexity Estimate

| Area | Rating | Notes |
|------|--------|-------|
| Data Layer | ●●●○○ | [evidence] |
| Core Logic | ●●○○○ | [evidence] |
| UI Screens | ●●●●○ | [evidence] |
| SDK Integration | ●●○○○ | [evidence] |

---

## 📊 Output: App Map

Sử dụng template từ `skills/smali-to-kotlin/templates/app-map.md`:

```markdown
## 🗺️ App Map: [App Name]

### Identity
[package, SDK, counts]

### Screen Flow
[navigation graph]

### Library Landscape
[categorized table]

### Complexity Estimate
[rating dots]

### Key Observations
[notable findings]
```

---

## ✅ Gate: Chuyển sang Phase 1

```
"🗺️ App Map xong! Anh review map này.
Có gì cần điều chỉnh không? OK → em sẽ thiết kế Architecture."

→ User approves → /re-android-design (Phase 1)
→ User has questions → investigate và update map
```

---

## 🔗 Related

- **Next:** [`/re-android-design`](reverse-android-design.md) (Phase 1: Architecture)
- **Parent:** [`/reverse-android`](reverse-android.md)
- **Skill reference:** `skills/smali-to-kotlin/phase-0-discovery.md`

---

*re-android-discover v3.0.0 — Phase 0: Discovery & App Map*
