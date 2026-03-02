---
description: 🏗️ RE iOS Phase 1 — Architecture Design (NO CODE BODIES)
parent: reverse-ios
---

# /re-ios-design — Architecture Blueprint

> **Parent:** [`/reverse-ios`](reverse-ios.md) → Phase 1
> **Prerequisite:** Completed App Map from [`/re-ios-discover`](reverse-ios-discover.md)
> **Skill:** `smali-to-swift` → `phase-1-architecture.md`
> **Zoom Level:** 1 — District View
> **Output:** Architecture Blueprint (NO CODE BODIES)

---

## ⛔ ZOOM 1 RULE

```
NO CODE BODIES. Only architecture diagrams, file paths, tables, SPM declarations.
```

---

## 📐 Architecture Steps

### Step 1: Layer Design

```
┌────────────────────────────────┐
│ Presentation (SwiftUI)         │
├────────────────────────────────┤
│ Domain (Models, Protocols, UC) │
├────────────────────────────────┤
│ Data (Network, Local, Repos)   │
├────────────────────────────────┤
│ DI (AppContainer)              │
└────────────────────────────────┘
```

### Step 2: Feature → File Mapping

| Feature | Model | Repository | UseCase | Screen | ViewModel |
|---------|-------|-----------|---------|--------|-----------|

### Step 3: API Inventory

| # | Method | Endpoint | Auth | Notes |
|---|--------|----------|------|-------|

### Step 4: Data Schema

| Model | Key Fields | Source | Storage |
|-------|-----------|--------|---------|

### Step 5: Xcode Structure

```
App/
├── App.swift
├── DI/
├── Data/Network/ + Local/ + Repositories/
├── Domain/Models/ + Repositories/ + UseCases/
├── Presentation/Navigation/ + Screens/ + Theme/
├── Utilities/
└── Resources/
```

### Step 6: Build Order

| # | Phase | Scope | Complexity |
|---|-------|-------|-----------|

### Step 7: Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|

---

## 📊 Output

Template: `skills/smali-to-swift/templates/architecture.md`

---

## ✅ Gate

```
"🏗️ Architecture xong! Anh chọn feature nào làm trước?"
→ /re-ios-build (Phase 2: Blueprint)
```

---

## 🔗 Related

- **Previous:** [`/re-ios-discover`](reverse-ios-discover.md)
- **Next:** [`/re-ios-build`](reverse-ios-build.md)
- **Parent:** [`/reverse-ios`](reverse-ios.md)

---

*re-ios-design v3.0.0 — Phase 1: Architecture Blueprint*
