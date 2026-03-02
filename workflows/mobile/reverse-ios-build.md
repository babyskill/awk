---
description: 🔨 RE iOS Phase 2+3 — Per-feature Blueprint → Implementation → Parity Check
parent: reverse-ios
---

# /re-ios-build — Blueprint & Build (Per Feature)

> **Parent:** [`/reverse-ios`](reverse-ios.md) → Phase 2+3
> **Prerequisite:** Completed Architecture from [`/re-ios-design`](reverse-ios-design.md)
> **Skill:** `smali-to-swift` → `phase-2-blueprint.md` + `phase-3-build.md`

---

## 🔄 Feature Loop

```
For each feature (from Architecture Build Order):
    Phase 2: Blueprint (Zoom 2 — signatures only)
        ↓ [User approves]
    Phase 3: Implementation (Zoom 3 — full code)
        ↓ [Checkpoint]
    → Next feature
```

---

## 📐 Phase 2: Feature Blueprint (Zoom 2)

> **Output:** Contracts, protocols, state design. **Signatures only.**

### 2.1: Deep Header Reading

Read class-dump headers + Hopper pseudo-code for chosen feature.

**ObjC → Swift Quick Ref:**
```
@property (copy) NSString *name     → let name: String
@property (assign) BOOL active      → let active: Bool
- (void)fetchWith:(block)completion → func fetch() async throws -> T
+ (instancetype)sharedInstance      → static let shared
```

### 2.2: Domain Contracts

```swift
struct [Model]: Codable, Identifiable, Sendable {
    let field1: Type
    // CodingKeys if needed
}

protocol [Feature]Repository: Sendable {
    func [method](...) async throws -> [Type]
}

struct [Action]UseCase: Sendable {
    func execute(...) async throws -> [Type]
}
```

### 2.3: UI State Design

- @Observable ViewModel properties
- User actions
- Navigation events
- Wireframe

### ✅ Blueprint Gate

```
"📐 Blueprint cho [Feature] xong. OK? → Code."
```

---

## 🔨 Phase 3: Implementation (Zoom 3)

> **Full Swift code for THIS feature only.**

### 3.1: Domain → Data → DI → ViewModel → Screen

Standard implementation order:
1. Codable structs
2. Repository protocol + implementation
3. APIClient endpoints
4. SwiftData models (if applicable)
5. DI container entries
6. @Observable ViewModel
7. SwiftUI Screen
8. Resource extraction (on-demand only)

### 🔒 Crypto (Special)

```swift
import CryptoKit
import CommonCrypto
// XCTest mandatory for crypto utils
```

> ⚠️ Crypto MUST match original output.

### ✅ Feature Checkpoint

```markdown
## ✅ Feature Complete: [Name]
### Files created: [list]
### Tests: [crypto verified?]
⏭️ Next: Phase 2 for [next feature]
```

---

## ✅ Final Parity Check

- [ ] API Parity
- [ ] Data/Crypto Parity
- [ ] UI Parity
- [ ] Build: `xcodebuild build && xcodebuild test`

---

## 🔗 Related

- **Parent:** [`/reverse-ios`](reverse-ios.md)
- **Previous:** [`/re-ios-design`](reverse-ios-design.md)
- **Skill:** `smali-to-swift` → `phase-2-blueprint.md` + `phase-3-build.md`

---

*re-ios-build v3.0.0 — Phase 2+3: Blueprint & Build*
