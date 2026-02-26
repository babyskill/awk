---
description: Tự động chạy lại, phát hiện lỗi và vá mã nguồn cho bài test XCTest/JUnit/Jest.
safe_auto_run: false
---

# /self-healing-test - Mobile Test Loop

A sophisticated workflow that doesn't just fail on error, but attempts to fix the test or the code.

---

## Phase 1: Test Execution
// turbo

### iOS (XCTest)
```bash
xcodebuild test \
  -workspace *.xcworkspace \
  -scheme [Scheme] \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -only-testing:[TestTarget]/[TestClass]/[testMethod]
```

### Android (JUnit / Espresso)
```bash
# Unit tests
./gradlew testDebugUnitTest --tests "[TestClass]"

# Instrumented tests
./gradlew connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=[TestClass]
```

### Expo (Jest)
```bash
npm test -- --testPathPattern="[pattern]" --watch=false
```

---

## Phase 2: Failure Interception

If test fails:

### 2.1. Capture Artifacts
// turbo
- **iOS**: Capture simulator screenshot, test logs
- **Android**: Capture emulator screenshot, logcat
- **Expo**: Capture test output

### 2.2. Analyze Failure Type

| Type | Pattern | Strategy |
| :--- | :--- | :--- |
| **Selector Not Found** | "Unable to find element" | Update test selector |
| **Assertion Failed** | "Expected X but got Y" | Fix implementation |
| **Timeout** | "Timed out waiting" | Add wait, check async |
| **Null/Nil Error** | "unexpectedly found nil" | Add null check |
| **API Error** | "Network request failed" | Check mock setup |

---

## Phase 3: The "Heal" Step

### Case A: Selector Not Found (UI Changed)
1. **Read UI file** to find current element
2. **Update test file** with new selector:

**iOS:**
```swift
// Before
app.buttons["oldButton"].tap()

// After (find new accessibilityIdentifier)
app.buttons["newButton"].tap()
```

**Android:**
```kotlin
// Before
onView(withId(R.id.oldButton)).perform(click())

// After
onView(withId(R.id.newButton)).perform(click())
```

### Case B: Assertion Failed (Logic Bug)
1. **Analyze expected vs actual**
2. **Locate function** causing wrong output
3. **Apply fix** to implementation

### Case C: Timeout (Async Issue)
1. **Add explicit wait:**

**iOS:**
```swift
let exists = element.waitForExistence(timeout: 5)
XCTAssertTrue(exists)
```

**Android:**
```kotlin
IdlingRegistry.getInstance().register(idlingResource)
// or use Espresso IdlingResource
```

**Expo:**
```typescript
await waitFor(() => expect(element).toBeVisible());
```

---

## Phase 4: Retry Loop
// turbo

```
Loop (max 3 iterations):
  1. Run failing test
  2. If PASS → Break, report success
  3. If FAIL → Analyze, Apply fix
  4. Increment counter
  
If still failing after 3 attempts:
  → Abort and report to user
```

---

## Phase 5: Success Actions

### If Healed:
// turbo
1. **Report fix:**
   ```
   ✅ Test Healed!
   
   Test: [TestName]
   Issue: [Selector not found]
   Fix: Updated accessibilityIdentifier in [File]
   Attempts: 2
   ```

2. **Auto-commit (optional):**
   ```bash
   git add .
   git commit -m "test: auto-heal fix for [TestName]"
   ```

### If Not Healed:
```
❌ Could Not Auto-Heal

Test: [TestName]
Attempts: 3
Last Error: [Error details]

Possible Issues:
- Complex logic error requiring manual review
- Missing mock data
- Environment configuration

Recommendation: Use /debug for manual investigation
```

---

## Phase 6: Test Coverage Check (Optional)

After healing, optionally run coverage:

### iOS
```bash
xcodebuild test -enableCodeCoverage YES ...
xcrun xccov view --report build/Logs/Test/*.xcresult
```

### Android
```bash
./gradlew jacocoTestReport
```

### Expo
```bash
npm test -- --coverage
```

---

## ⚠️ NEXT STEPS:
- All tests pass → `/deploy` or continue coding
- Tests still failing → `/debug` for manual fix
- Want more tests → `/feature-completion` with TDD
