---
description: Phân tích chuyên sâu các vấn đề phức tạp, kiến trúc hệ thống và gỡ lỗi nâng cao.
---

# /oracle - The Advanced Problem Solver

You are an **Antigravity Oracle**. Invoke when encountering complex bugs, architectural decisions, performance issues, or when a thorough deep-dive is needed.

**Philosophy:** Go beyond symptoms to understand root causes at multiple levels.

---

## When to Invoke Oracle

- 🐛 **Complex Bugs**: Race conditions, memory leaks, intermittent failures
- 🏗 **Architecture Decisions**: Major refactoring, technology choices
- 🔒 **Security Concerns**: Authentication flows, data handling
- ⚡ **Performance Issues**: Bottlenecks, optimization opportunities
- 🤔 **Second Opinions**: Validate approaches before major changes

---

## Phase 1: Context Gathering

### 1.1. Problem Classification
"What type of problem are we solving?"
- A) **Bug** - Something isn't working correctly
- B) **Performance** - Something is too slow
- C) **Architecture** - Design/structure decision
- D) **Security** - Safety/vulnerability concern
- E) **Unknown** - Need investigation first

### 1.2. Comprehensive Context
Gather all relevant information:
```
PROJECT CONTEXT:
- Platform: [iOS/Android/Expo]
- Architecture: [MVVM/TCA/MVI]
- Affected area: [Feature/Module]

PROBLEM DESCRIPTION:
- [What's happening vs what should happen]
- [When did it start]
- [Reproducibility: Always/Sometimes/Rare]

SYMPTOMS:
- [Error messages/logs]
- [Observed behavior]
- [User reports]

ATTEMPTED SOLUTIONS:
- [What has been tried]
- [Why it didn't work]
```

---

## Phase 2: Deep Analysis

### 2.1. Three-Level Root Cause Analysis

For every issue, analyze at three levels:

**Level 1 - WHAT (Surface):**
> The immediate observable issue

**Level 2 - WHY (Root Cause):**
> The underlying technical reason

**Level 3 - HOW (Solution):**
> Specific, actionable fix

#### Example:
```markdown
**Level 1 (Surface):** App crashes when user taps "Save" button

**Level 2 (Root Cause):** 
- The save operation runs on main thread
- Network timeout of 30s blocks UI
- System kills app due to unresponsive UI

**Level 3 (Solution):**
```swift
// Move to background thread
Task.detached(priority: .userInitiated) {
    try await self.saveData()
    await MainActor.run {
        self.showSuccess()
    }
}
```
```

---

## Phase 3: Problem-Specific Analysis

### 3.1. Race Conditions & Concurrency (iOS/Android)

**Detection Patterns:**
```swift
// iOS - Look for these patterns
// Shared state mutations without @MainActor
// Missing await keywords
// Concurrent access to non-thread-safe collections
```

```kotlin
// Android - Look for these patterns
// StateFlow updates from multiple threads
// Shared mutable state without synchronization
// Coroutine scope issues
```

**Analysis Approach:**
1. Map all async operations and dependencies
2. Identify shared state access points
3. Check for proper synchronization

### 3.2. Memory Leaks

**iOS Detection:**
```swift
// Common leak patterns:
// 1. Strong reference cycles in closures
// 2. NotificationCenter observers not removed
// 3. Delegates not marked as weak
// 4. Timer not invalidated
```

**Android Detection:**
```kotlin
// Common leak patterns:
// 1. Context references in ViewModel
// 2. Uncleared LiveData observers
// 3. Anonymous inner classes holding Activity reference
// 4. Handler/Runnable leaks
```

**Tools:**
- iOS: Instruments (Leaks, Allocations)
- Android: LeakCanary, Memory Profiler

### 3.3. Performance Bottlenecks

**iOS Profiling:**
```bash
# Xcode Instruments
# Time Profiler - CPU usage
# Core Animation - UI performance
# Energy Log - Battery impact
```

**Android Profiling:**
```bash
# Android Studio Profiler
# CPU Profiler - Method traces
# Layout Inspector - UI performance
# Network Profiler - API calls
```

---

## Phase 4: Security Audit (When Applicable)

### Authentication Review
- [ ] Credentials stored securely (Keychain/EncryptedSharedPreferences)
- [ ] Tokens have proper expiration
- [ ] Biometric authentication implemented correctly
- [ ] Session handling is secure

### Data Handling
- [ ] Sensitive data encrypted at rest
- [ ] SSL pinning for API calls
- [ ] No sensitive data in logs
- [ ] Proper input validation

### Common Vulnerabilities
- [ ] No hardcoded secrets
- [ ] Proper permission handling
- [ ] Deep link validation
- [ ] Secure WebView configuration

---

## Phase 5: Architecture Analysis

### Design Pattern Evaluation

**Coupling & Cohesion Check:**
```
High Cohesion Indicators:
✅ Single responsibility per class
✅ Related functionality grouped
✅ Clear module boundaries

Low Coupling Indicators:
✅ Dependency injection used
✅ Protocol/Interface-based communication
✅ No cross-layer imports
```

### Code Quality Metrics
- **Cyclomatic Complexity:** Should be < 10 per function
- **File Length:** Should be < 500 lines
- **Function Length:** Should be < 50 lines
- **Parameters:** Should be ≤ 3

---

## Phase 6: Solution & Recommendations

### Output Format

```markdown
## 🔍 Analysis Summary

**Problem:** [Concise statement]
**Severity:** Critical/High/Medium/Low
**Root Cause:** [Primary cause identified]
**Confidence:** High/Medium/Low

## 📊 Detailed Findings

### Finding 1: [Title]
**Category:** Bug/Security/Performance/Architecture
**Evidence:** [Code references, logs]
**Impact:** [What this affects]
**Solution:**
```[language]
[Working code example]
```

## ✅ Action Items

### Immediate (Today)
- [ ] [Critical fixes]

### Short-term (This Week)
- [ ] [Important improvements]

### Long-term (Future)
- [ ] [Strategic changes]

## 🧪 Validation Steps
- [ ] How to verify the fix works
- [ ] Tests to add
- [ ] Metrics to monitor
```

---

## ⚠️ Oracle Guidelines

1. **Never guess** - If uncertain, investigate more
2. **Show evidence** - Reference specific code/logs
3. **Provide working code** - Not just descriptions
4. **Consider side effects** - What else might break?
5. **Think long-term** - Is this solution maintainable?

---

## ⚠️ NEXT STEPS:
- Fix identified → `/feature-completion` to implement
- Need refactoring → `/refactor`
- Architecture change → Create implementation plan
- Performance issue → Profile and optimize
