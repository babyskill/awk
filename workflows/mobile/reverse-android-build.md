---
description: 🔨 RE Android Phase 2+3 — Per-feature Blueprint → Implementation → Parity Check
parent: reverse-android
---

# /re-android-build — Blueprint & Build (Per Feature)

> **Parent:** [`/reverse-android`](reverse-android.md) → Phase 2+3
> **Prerequisite:** Completed Architecture from [`/re-android-design`](reverse-android-design.md)
> **Skill:** `smali-to-kotlin` → `phase-2-blueprint.md` + `phase-3-build.md`

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

> **Output:** Contracts, interfaces, state design. **Signatures only, no bodies.**

### 2.1: Deep Smali Reading

Read Smali files for the chosen feature. Extract:
- Class hierarchy, fields, method signatures
- String constants (URLs, keys, messages)
- Control flow → business rules (document, don't code)

### 2.2: Contracts

Define for this feature:

```kotlin
// Domain Model
data class [Model](val field1: Type, ...)

// Repository Interface
interface [Feature]Repository {
    suspend fun [method](...): Result<[Type]>
    fun [stream](): Flow<[Type]>
}

// API Interface
interface [Feature]Api {
    @[METHOD]("[endpoint]")
    suspend fun [method](...): [Response]
}

// UseCase
class [Action]UseCase(repo: [Feature]Repository) {
    suspend operator fun invoke(...): Result<[Type]> // TODO()
}
```

### 2.3: UI State Design

```kotlin
data class [Screen]UiState(
    val field: Type = default,
    val isLoading: Boolean = false,
    val error: String? = null
)

sealed interface [Screen]Event { /* navigation, snackbar */ }
sealed interface [Screen]Action { /* user interactions */ }
```

### 2.4: Wireframe + File List

ASCII wireframe + list of files to create.

### ✅ Blueprint Gate

```
"📐 Blueprint cho [Feature] xong. Anh xem OK không? → Em bắt đầu code."
```

---

## 🔨 Phase 3: Implementation (Zoom 3)

> **Output:** Full production-quality Kotlin code for THIS feature only.

### 3.1: Domain Layer

- Models (data classes from Blueprint)
- Repository interfaces (from Blueprint)
- UseCases (implement invoke with repo calls)

### 3.2: Data Layer

- DTOs (@Serializable)
- Retrofit API interface
- Room entities + DAOs (if applicable)
- Repository implementation (offline-first)

### 3.3: DI Module

- Hilt @Module with @Binds for repository

### 3.4: ViewModel

- @HiltViewModel with StateFlow + SharedFlow
- Implement onAction() handler from Blueprint actions

### 3.5: Compose Screen

- Collect state with collectAsStateWithLifecycle()
- UI from wireframe
- LaunchedEffect for events

### 3.6: Resource Extraction (On-Demand only)

```bash
# Only resources for THIS screen
grep -o '@drawable/[a-z_]*' [apktool_dir]/res/layout/activity_[screen].xml | sort -u
```

### 🔒 Crypto Utils (Special)

If feature involves crypto/hashing:
1. Read Smali carefully (exact algorithm)
2. Implement in Kotlin
3. Unit test IMMEDIATELY with known pairs

> ⚠️ Crypto MUST produce identical output to original app.

### ✅ Feature Checkpoint

```markdown
## ✅ Feature Complete: [Name]

### Files created: [list]
### Resources extracted: [only needed]
### Tests: [crypto verified? API matches?]

### ⏭️ Next Feature: [Name]
→ Return to Phase 2 (Blueprint) for next feature
```

---

## ✅ Final Parity Check (After ALL features)

### Checklist
- [ ] API Parity — all endpoints match (headers, body, encoding)
- [ ] Data Parity — crypto/hash output identical
- [ ] UI Parity — screen-by-screen comparison
- [ ] Edge Cases — empty states, errors, offline, lifecycle
- [ ] Build & Test: `./gradlew assembleDebug && ./gradlew test && ./gradlew lint`

### 🎉 Final Summary

```markdown
## ✅ Reverse Engineering Complete!
- Screens: [count] | Features: [count]
- Libs reused: [count] | Replaced: [count]
- Tests: [pass/fail] | Lint: [pass/warnings]

⏭️ Next: /test → /deploy → /code-janitor
```

---

## 🔗 Related

- **Parent:** [`/reverse-android`](reverse-android.md)
- **Previous:** [`/re-android-design`](reverse-android-design.md) (Phase 1)
- **Skill:** `smali-to-kotlin` → `phase-2-blueprint.md` + `phase-3-build.md`

---

*re-android-build v3.0.0 — Phase 2+3: Blueprint & Build*
