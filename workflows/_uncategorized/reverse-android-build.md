---
description: 🔨 RE Android Phase 2+3+4 — Blueprint + UI Shell → Logic Build → Final Parity (UI-First)
parent: reverse-android
---

# /re-android-build — Blueprint + UI + Build (Per Feature)

> **Parent:** [`/reverse-android`](reverse-android.md) → Phase 2+3+4
> **Prerequisite:** Completed Architecture from [`/re-android-design`](reverse-android-design.md)
> **Skill:** `smali-to-kotlin` → `phase-2-blueprint-ui.md` + `phase-3-logic-build.md`

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

> **Output:** Approved contracts + Working Compose UI shell with mock data.

### Part A: Contracts (signatures only)

#### 2.1: Deep Smali Reading
Read Smali files for the chosen feature. Extract class hierarchy, fields, method signatures,
string constants, control flow. See `smali-reading-guide.md`.

#### 2.2–2.5: Define Contracts
```kotlin
// 2.2 Domain Model
data class [Model](val field: Type, ...)

// 2.3 Repository Interface
interface [Feature]Repository {
    suspend fun [method](...): Result<[Type]>
}

// 2.4 API Interface
interface [Feature]Api {
    @[METHOD]("[endpoint]")
    suspend fun [method](...): [Response]
}

// 2.5 UseCase
class [Action]UseCase(repo: [Feature]Repository) {
    suspend operator fun invoke(...): Result<[Type]> // TODO()
}
```

#### 2.6: UI State Design
```kotlin
data class [Screen]UiState(
    val field: Type = default,
    val isLoading: Boolean = false,
    val error: String? = null
)
sealed interface [Screen]Event { /* navigation, snackbar */ }
sealed interface [Screen]Action { /* user interactions */ }
```

### Part B: UI Visual Shell

#### 2.7: Resource Extraction ⭐ (BEFORE UI code!)

```bash
# Only resources for THIS screen
grep -o '@drawable/[a-z_]*' [apktool_dir]/res/layout/activity_[screen].xml | sort -u
grep -o '@color/[a-z_]*' [apktool_dir]/res/layout/activity_[screen].xml | sort -u
```

Copy ONLY needed resources. Verify they compile.

#### 2.8: UI Implementation ⭐ (Visual shell with mock data)

- Use UiState from 2.6 with hardcoded defaults
- Use REAL resources from 2.7
- Create `[Screen]Content` composable (stateless)
- Match visual parity with original app
- NO ViewModel connection, NO real API calls

```kotlin
@Composable
fun [Screen]Content(
    uiState: [Screen]UiState = [Screen]UiState(),  // Mock
    onAction: ([Screen]Action) -> Unit = {}          // No-op
) {
    // Full Compose UI matching original app
}

@Preview @Composable
private fun NormalPreview() { AppTheme { [Screen]Content() } }

@Preview @Composable
private fun LoadingPreview() { AppTheme { [Screen]Content([Screen]UiState(isLoading = true)) } }

@Preview @Composable
private fun ErrorPreview() { AppTheme { [Screen]Content([Screen]UiState(error = "Error")) } }
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
📝 Contracts: [N] models, [N] repos, [N] use cases, [N] APIs
🎨 UI: [Screen] with [N] state previews
📸 Visual Parity: [OK / needs adjustment]

→ ✅ Approve → Phase 3 (Logic Build)
→ 🎨 Adjust UI → fix then re-check
→ 📝 Adjust contracts → revise"
```

> ⚠️ **DO NOT proceed to Phase 3 without user approval.**

---

## 🔨 Phase 3: Logic Build

> **Output:** Full production-quality Kotlin code. Wire logic to EXISTING UI.

### 3.1: Domain Layer
Models + Repository interfaces + UseCases (implement invoke with repo calls)

### 3.2: Data Layer
DTOs + Retrofit API + Room (if applicable) + Repository implementation

### 3.3: DI Module
Hilt @Module with @Binds for repository

### 3.4: ViewModel
@HiltViewModel with StateFlow + SharedFlow, implements onAction()

### 3.5: Wire UI ↔ Logic ⭐ (NOT "code new UI")

The UI already exists from Phase 2.8. Only CONNECT it:

```kotlin
// Keep stateless Content composable from Phase 2 (for Preview):
// [Screen]Content(uiState, onAction) — DO NOT MODIFY

// ADD wrapper that wires ViewModel:
@Composable
fun [Screen](
    viewModel: [Screen]ViewModel = hiltViewModel(),
    onNavigate: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    LaunchedEffect(Unit) {
        viewModel.events.collect { event -> /* handle navigation */ }
    }
    [Screen]Content(uiState = uiState, onAction = viewModel::onAction)
}
```

### 3.6: Integration Test ⭐
- [ ] API calls succeed, data displays
- [ ] Loading/error states work
- [ ] Navigation correct
- [ ] Crypto output matches (if applicable)

### 🔒 Crypto Utils (Special)
If crypto involved: implement + unit test IMMEDIATELY with known pairs.
> ⚠️ MUST produce identical output.

### ✅ Feature Checkpoint

```markdown
## ✅ Feature Complete: [Name]
Files: [list] | Resources: [count] | Tests: [status]
⏭️ Next Feature: [Name] → Return to Phase 2
```

---

## ✅ Phase 4: Final Parity Check (After ALL features)

### Checklist
- [ ] API Parity — all endpoints match (headers, body, encoding)
- [ ] Data Parity — crypto/hash output identical
- [ ] UI Parity — screen-by-screen comparison
- [ ] Edge Cases — empty states, errors, offline, lifecycle
- [ ] Build: `./gradlew assembleDebug && ./gradlew test && ./gradlew lint`

### 🎉 Final Summary

```markdown
## ✅ Reverse Engineering Complete!
- Screens: [N] | Features: [N]
- Libs reused: [N] | Replaced: [N]
- Tests: [pass/fail] | Lint: [warnings]

⏭️ Next: /test → /deploy → /code-janitor
```

---

## 🔗 Related

- **Parent:** [`/reverse-android`](reverse-android.md)
- **Previous:** [`/re-android-design`](reverse-android-design.md) (Phase 1)
- **Skill:** `smali-to-kotlin` → `phase-2-blueprint-ui.md` + `phase-3-logic-build.md`

---

*re-android-build v4.0.0 — UI-First Blueprint + Build*
