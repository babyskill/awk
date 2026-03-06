---
description: 🔨 RE iOS Phase 2+3+4 — Blueprint + UI Shell → Logic Build → Final Parity (UI-First)
parent: reverse-ios
---

# /re-ios-build — Blueprint + UI + Build (Per Feature)

> **Parent:** [`/reverse-ios`](reverse-ios.md) → Phase 2+3+4
> **Prerequisite:** Completed Architecture from [`/re-ios-design`](reverse-ios-design.md)
> **Skill:** `smali-to-swift` → `phase-2-blueprint-ui.md` + `phase-3-logic-build.md`

---

## 🔄 Feature Loop (UI-First)

```
For each feature (from Architecture Build Order):
    Phase 2: Blueprint + UI (contracts + visual shell)
        ↓ 🚦 GATE: User approves UI + contracts
    Phase 3: Logic Build (domain → data → wire)
        ↓ 📊 CHECKPOINT
    → Next feature
```

---

## 📐🎨 Phase 2: Blueprint + UI Design

> **Output:** Approved contracts + Working SwiftUI shell with mock data.

### Part A: Contracts (signatures only)

#### 2.1: Deep Header Reading
Read class-dump headers + Hopper pseudo-code. See `objc-reading-guide.md`.

**ObjC → Swift Quick Ref:**
```
@property (copy) NSString *name     → let name: String
@property (assign) BOOL active      → let active: Bool
- (void)fetchWith:(block)completion → func fetch() async throws -> T
+ (instancetype)sharedInstance      → static let shared
```

#### 2.2–2.5: Define Contracts
```swift
// 2.2 Domain Model
struct [Model]: Codable, Identifiable, Sendable {
    let field: Type
}

// 2.3 Repository Protocol
protocol [Feature]Repository: Sendable {
    func [method](...) async throws -> [Type]
}

// 2.4 API Endpoint
enum [Feature]Endpoint {
    case [action](param: Type)
    var path: String { /* ... */ }
}

// 2.5 UseCase
struct [Action]UseCase {
    func execute(...) async throws -> [Type] // TODO
}
```

#### 2.6: UI State Design
```swift
struct [Screen]ViewState {
    var field: Type = default
    var isLoading: Bool = false
    var error: String? = nil
}
enum [Screen]Action { /* user interactions */ }
enum [Screen]Event { /* navigation, alerts */ }

extension [Screen]ViewState {
    static let normal = [Screen]ViewState(/* sample */)
    static let loading = [Screen]ViewState(isLoading: true)
    static let error = [Screen]ViewState(error: "Error message")
}
```

### Part B: UI Visual Shell

#### 2.7: Resource Extraction ⭐ (BEFORE UI code!)

Extract from IPA bundle / Assets.car:
- Images → Assets.xcassets
- Colors → Color extension or asset catalog
- Strings → Localizable.xcstrings
- Fonts → custom fonts

Copy ONLY needed resources. Verify they build.

#### 2.8: UI Implementation ⭐ (Visual shell with mock data)

- Use ViewState from 2.6 with hardcoded defaults
- Use REAL resources from 2.7
- Create `[Screen]Content` view (stateless)
- Match visual parity with original app
- NO ViewModel connection, NO real API calls

```swift
struct [Screen]Content: View {
    var state: [Screen]ViewState = .normal   // Mock
    var onAction: ([Screen]Action) -> Void = { _ in }  // No-op

    var body: some View {
        // Full SwiftUI matching original app
    }
}

#Preview("Normal") { [Screen]Content(state: .normal) }
#Preview("Loading") { [Screen]Content(state: .loading) }
#Preview("Error") { [Screen]Content(state: .error) }
```

#### 2.9: Visual Parity Check ⭐

Compare with original app:
- [ ] Layout structure matches
- [ ] Colors, typography, spacing correct
- [ ] Icons/images positioned correctly
- [ ] All states: normal, loading, error, empty

### 🚦 UI + Contracts Gate (MANDATORY)

```
"📐🎨 Blueprint + UI cho [Feature] xong:
📝 Contracts: [N] models, [N] protocols, [N] use cases, [N] endpoints
🎨 UI: [Screen] with [N] state previews
📸 Visual Parity: [OK / needs adjustment]

→ ✅ Approve → Phase 3 (Logic Build)
→ 🎨 Adjust UI → fix then re-check
→ 📝 Adjust contracts → revise"
```

> ⚠️ **DO NOT proceed to Phase 3 without user approval.**

---

## 🔨 Phase 3: Logic Build

> **Output:** Full Swift code. Wire logic to EXISTING UI.

### 3.1: Domain Layer
Models + Repository protocols + UseCases (implement with repo calls)

### 3.2: Data Layer
DTOs + APIClient endpoints + SwiftData (if applicable) + Repository implementation

### 3.3: DI Container
AppContainer with lazy properties for repos, use cases, view models

### 3.4: ViewModel
@Observable with state property + handle(_ action:) + event handler

### 3.5: Wire UI ↔ Logic ⭐ (NOT "code new UI")

The UI already exists from Phase 2.8. Only CONNECT it:

```swift
// Keep stateless Content view from Phase 2 (for Preview):
// [Screen]Content(state:, onAction:) — DO NOT MODIFY

// ADD wrapper that wires ViewModel:
struct [Screen]: View {
    @State private var viewModel: [Screen]ViewModel

    init(container: AppContainer) {
        _viewModel = State(initialValue: container.make[Screen]ViewModel())
    }

    var body: some View {
        [Screen]Content(
            state: viewModel.state,
            onAction: viewModel.handle
        )
    }
}
```

### 3.6: Integration Test ⭐
- [ ] API calls succeed, data displays
- [ ] Loading/error states work
- [ ] Navigation correct
- [ ] Crypto output matches (if applicable)

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
Files: [list] | Resources: [count] | Tests: [status]
⏭️ Next Feature: [Name] → Return to Phase 2
```

---

## ✅ Phase 4: Final Parity Check (After ALL features)

### Checklist
- [ ] API Parity — all endpoints match
- [ ] Data/Crypto Parity — output identical
- [ ] UI Parity — screen-by-screen comparison
- [ ] Edge Cases — empty, error, offline, lifecycle
- [ ] Build: `xcodebuild build && xcodebuild test`

### 🎉 Final Summary

```markdown
## ✅ Reverse Engineering Complete!
- Screens: [N] | Features: [N]
- Frameworks reused: [N] | Replaced: [N]
- Tests: [pass/fail]

⏭️ Next: /test → /deploy → /code-janitor
```

---

## 🔗 Related

- **Parent:** [`/reverse-ios`](reverse-ios.md)
- **Previous:** [`/re-ios-design`](reverse-ios-design.md) (Phase 1)
- **Skill:** `smali-to-swift` → `phase-2-blueprint-ui.md` + `phase-3-logic-build.md`

---

*re-ios-build v4.0.0 — UI-First Blueprint + Build*
