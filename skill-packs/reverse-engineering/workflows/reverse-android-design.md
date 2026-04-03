---
description: 🏗️ RE Android Phase 1 — Architecture Design (NO CODE BODIES)
parent: reverse-android
---

# /re-android-design — Architecture Blueprint

> **Parent:** [`/reverse-android`](reverse-android.md) → Phase 1
> **Prerequisite:** Completed App Map from [`/re-android-discover`](reverse-android-discover.md)
> **Skill:** `smali-to-kotlin` → `phase-1-architecture.md`
> **Zoom Level:** 1 — District View
> **Output:** Architecture Blueprint (diagrams, tables, NO CODE BODIES)

---

## ⛔ ZOOM 1 RULE

```
This workflow produces NO CODE BODIES.
Allowed: Architecture diagrams, layer maps, feature tables, file paths, API endpoint lists.
Allowed: build.gradle.kts plugin/dependency declarations (declaration only).
If you are about to write a function body → STOP → wrong zoom level.
```

---

## 📐 Step 1: Layer Design

Design Clean Architecture layers based on App Map:

```
┌─────────────────────────────────────┐
│ Presentation                        │
│ ├── screens/ ([N] screens)          │
│ ├── navigation/ (NavGraph + Routes) │
│ ├── theme/ (Material 3)            │
│ └── components/ (Shared UI)        │
├─────────────────────────────────────┤
│ Domain                              │
│ ├── model/ ([N] models)             │
│ ├── repository/ ([N] interfaces)   │
│ └── usecase/ ([N] use cases)        │
├─────────────────────────────────────┤
│ Data                                │
│ ├── remote/ ([N] API services)     │
│ ├── local/ (Room, DataStore)       │
│ └── repository/ (implementations)  │
├─────────────────────────────────────┤
│ DI (Hilt)                           │
│ └── modules/ (Network, DB, Repo)   │
└─────────────────────────────────────┘
```

## 📋 Step 2: Feature → File Mapping

Map mỗi feature tới Clean Architecture components:

| Feature | Domain Model | Repository | UseCase | Screen(s) | ViewModel |
|---------|-------------|-----------|---------|-----------|-----------|

## 🌐 Step 3: API Endpoint Inventory

Trích xuất TẤT CẢ API endpoints từ Smali:

| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|

**Base URL:** `[from Smali const-string]`

## 💾 Step 4: Data Schema

| Model | Key Fields | Source | Storage |
|-------|-----------|--------|---------|

## 📁 Step 5: Project Structure

```
app/src/main/java/[package]/
├── App.kt
├── di/
├── data/remote/ + data/local/ + data/repository/
├── domain/model/ + domain/repository/ + domain/usecase/
├── presentation/navigation/ + screens/ + theme/
└── util/
```

## 🔢 Step 6: Build Order (UI-First) ⭐

| # | Phase | Scope | Complexity |
|---|-------|-------|-----------|
| 1 | 🟢 Foundation | Project + DI skeleton + Theme/Design System | Low |
| 2 | 🟢 Navigation | Routes, tab bar, NavGraph | Low |
| 3 | 🔵 Per Feature | Blueprint (contracts) + UI Shell (visual) | Medium |
| 4 | 🚦 UI Gate | User approves UI before logic | — |
| 5 | 🟡 Per Feature | Logic Build (Domain → Data → VM → Wire UI) | High |
| 6 | 📦 SDKs | Third-party SDK + Native libs integration | Medium |
| N | 🔴 Final | Full Parity Check | High |

> **UI-First:** Design and approve UI before coding logic for each feature.

## 🔧 Step 7: Tech Stack Confirmation

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI | Jetpack Compose + M3 | Modern |
| DI | Hilt | Standard |
| ... | ... | ... |

---

## 📊 Output: Architecture Blueprint

Sử dụng template từ `skills/smali-to-kotlin/templates/architecture.md`.

---

## ✅ Gate: Chuyển sang Phase 2

```
"🏗️ Architecture Blueprint xong!
Anh muốn bắt đầu từ feature nào?
Em suggest: [Feature X] vì [reason]."

→ User picks feature → /re-android-build (Phase 2: Blueprint for that feature)
→ User wants changes → adjust architecture
```

---

## 🔗 Related

- **Previous:** [`/re-android-discover`](reverse-android-discover.md) (Phase 0)
- **Next:** [`/re-android-build`](reverse-android-build.md) (Phase 2+3)
- **Parent:** [`/reverse-android`](reverse-android.md)
- **Skill:** `skills/smali-to-kotlin/phase-1-architecture.md`

---

*re-android-design v3.0.0 — Phase 1: Architecture Blueprint*
