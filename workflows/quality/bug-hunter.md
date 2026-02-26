---
description: 🐛 Tìm, tái hiện & sửa lỗi từ log
safe_auto_run: false
---

# /bug-hunter - The Bug Detective

A forensic approach to fixing bugs with progressive solutions.

---

## Phase 1: Triage & Reproduction

### 1.1. Bug Classification
"What type of bug is this?"
- A) **Crash** - App terminates unexpectedly
- B) **UI Glitch** - Visual issues
- C) **Logic Error** - Wrong behavior/output
- D) **Performance** - Slow/laggy
- E) **Intermittent** - Happens sometimes (hardest!)

### 1.2. Gather Evidence
```markdown
**Bug Report:**
- Description: [What's happening]
- Expected: [What should happen]
- Steps to reproduce: [1, 2, 3...]
- Frequency: [Always/Sometimes/Rare]
- Environment: [Device, OS, App version]
- Logs/Screenshots: [Attached]
```

### 1.3. Create Reproduction Test
// turbo
```swift
// iOS - Create failing test first (TDD approach)
func testBugReproduction_ISSUE123() {
    // Arrange - Set up the conditions
    let sut = SystemUnderTest()
    
    // Act - Perform the action that triggers bug
    let result = sut.performAction()
    
    // Assert - This should FAIL initially
    XCTAssertEqual(result, expectedValue)
}
```

```kotlin
// Android
@Test
fun `ISSUE-123 - bug reproduction`() {
    // Arrange
    val sut = SystemUnderTest()
    
    // Act
    val result = sut.performAction()
    
    // Assert - Should FAIL initially
    assertEquals(expectedValue, result)
}
```

---

## Phase 2: Three-Level Root Cause Analysis

### Level 1: WHAT (Surface)
> What is the observable symptom?

### Level 2: WHY (Root Cause)
> What is the underlying technical cause?

### Level 3: HOW (Solution)
> What is the specific fix?

**Example:**
```markdown
**Level 1 (Surface):** User sees stale data after pulling to refresh

**Level 2 (Root Cause):** 
- API response is cached
- Cache invalidation not triggered on pull-to-refresh
- StateFlow not updated with fresh data

**Level 3 (Solution):**
```kotlin
fun refresh() {
    viewModelScope.launch {
        // Force cache bypass
        repository.fetchData(forceRefresh = true)
    }
}
```
```

---

## Phase 3: Progressive Solutions

### 1️⃣ Minimal Fix (Quick Patch)
- Fix the immediate symptom
- May not address root cause
- Acceptable for urgent hotfixes

```swift
// Quick fix: Force unwrap guard
if data == nil { return } // Band-aid
```

### 2️⃣ Better Fix (Proper Solution)
- Address the root cause
- Add defensive checks
- Includes basic test

```swift
// Proper fix: Handle nil case correctly
guard let data = data else {
    showError("No data available")
    return
}
```

### 3️⃣ Complete Fix (Robust Solution)
- Fix + refactor if needed
- Comprehensive tests
- Documentation update
- Monitoring added

```swift
// Robust: Full error handling + logging
do {
    let data = try await fetchData()
    await MainActor.run { updateUI(with: data) }
} catch {
    Logger.error("Data fetch failed: \(error)")
    showUserFriendlyError(error)
    Analytics.track("data_fetch_error", error: error)
}
```

---

## Phase 4: Isolation Techniques

### 4.1. Binary Search (Bisect)
```bash
# Find the commit that introduced the bug
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# Git will help find the exact commit
```

### 4.2. Strategic Logging
```swift
// Add temporary debug logs
func suspectFunction() {
    print("🔍 DEBUG: Entering suspectFunction")
    print("🔍 DEBUG: Variable state = \(variable)")
    // ... logic
    print("🔍 DEBUG: Exiting with result = \(result)")
}
```

### 4.3. Divide and Conquer
1. Comment out half the suspect code
2. Does bug still occur?
3. If yes → bug in remaining code
4. If no → bug in commented code
5. Repeat until isolated

---

## Phase 5: Fix Implementation

### 5.1. Apply Fix
Based on severity, apply appropriate level fix (Minimal/Better/Complete)

### 5.2. Verify with Reproduction Test
// turbo
```bash
# iOS
xcodebuild test -only-testing:TestTarget/testBugReproduction_ISSUE123

# Android
./gradlew testDebugUnitTest --tests "*ISSUE123*"
```

### 5.3. Regression Check
// turbo
```bash
# Run related tests to ensure nothing else broke
# iOS
xcodebuild test -workspace *.xcworkspace -scheme [Scheme]

# Android
./gradlew testDebugUnitTest
```

---

## Phase 6: Cleanup & Documentation

### 6.1. Remove Debug Code
```bash
# Find and remove debug logs
grep -rn "DEBUG\|🔍" --include="*.swift" --include="*.kt"
```

### 6.2. Update Documentation
- Add to known issues if relevant
- Update CHANGELOG
- Link to issue tracker

### 6.3. Report
```markdown
## 🐛 Bug Fix Report

**Issue:** [ID or Description]
**Root Cause:** [What was actually wrong]
**Solution Level:** Minimal/Better/Complete
**Fix Applied:** [Description of changes]

**Files Changed:**
- `FileName.swift` - [What changed]

**Verification:**
- ✅ Reproduction test passes
- ✅ Regression tests pass
- ✅ Manual verification done

**Prevention:**
- [What can prevent similar bugs]
```

---

## ⚠️ NEXT STEPS:
- Bug fixed → `/test` to run full suite
- Need deeper analysis → `/oracle`
- Made it worse → `/rollback`
- All good → `/smart-git-ops` to commit
