---
description: Kiểm tra chất lượng code, tiêu chuẩn SOLID và các mẫu sửa lỗi tự động.
alwaysApply: false
priority: "high"
---

# Code Quality & AI Automation Rules

## 🎯 Core Purpose

**_BẮT BUỘC_** manual workflow cho AI assistants để tự động thực hiện code quality checks mà không dựa vào IDE auto-tools.

## 🔧 MANDATORY AI Execution Rules

### Before Writing Any Code

**_BẮT BUỘC_** AI phải thực hiện checklist này trước khi viết bất kỳ dòng code nào:

```markdown
☐ 1. SCAN existing file structure và imports
☐ 2. IDENTIFY required dependencies và packages  
☐ 3. PREDICT potential import conflicts
☐ 4. VALIDATE target file syntax structure
☐ 5. PREPARE import statements list
☐ 6. CHECK for existing naming conventions
☐ 7. VERIFY package declarations match directory
```

### During Code Writing

**_BẮT BUỘC_** AI phải thực hiện real-time validation:

```markdown
☐ 1. ADD import statements ngay khi sử dụng class mới
☐ 2. VALIDATE type compatibility trước khi assignment
☐ 3. CHECK null safety cho tất cả nullable operations
☐ 4. ENSURE proper bracket matching trong real-time
☐ 5. VALIDATE function signatures match usage
☐ 6. CHECK variable naming conventions
☐ 7. VERIFY proper indentation và formatting
```

### After Code Completion

**_BẮT BUỘC_** AI phải thực hiện final validation:

```markdown
☐ 1. SCAN for any missing imports
☐ 2. OPTIMIZE import statements (remove unused)
☐ 3. FINAL type safety validation
☐ 4. COMPLETE syntax error check
☐ 5. VALIDATE code style consistency
☐ 6. CHECK for potential performance issues
☐ 7. ENSURE proper error handling patterns
```

## Code Quality Standards

### Code Style
- **Naming**: Use consistent, meaningful English naming (camelCase for vars, PascalCase for classes, UPPER_CASE for constants).
- **Comments**: Explain "Why", not "What".
- **Formatting**: Consistent indentation (spaces vs tabs) and spacing.

### Architecture & Design
- **SOLID**: Follow SOLID principles strictly.
- **Layers**: Clear separation of concerns (Presentation, Business, Data).
- **Dependency Injection**: Use DI to decouple components.
- **Composition over Inheritance**: Prefer composition.

### Error Handling
- **Exceptions**: Catch specific exceptions, not generic ones.
- **Messages**: Provide meaningful, safe error messages.
- **Logging**: Log errors with context.

### Performance
- **Database**: Avoid N+1 queries.
- **Caching**: Implement caching where appropriate.
- **Async**: Use async/await for non-blocking operations.

### Security
- **Input Validation**: Validate all inputs.
- **Sanitization**: Sanitize data before display to prevent XSS.
- **SQL Injection**: Use parameterized queries.
- **Secrets**: Never hardcode secrets.

## 🔍 Manual Code Quality Checklist

### Critical Issues (Must Fix Immediately)

```markdown
Priority: CRITICAL - Block execution until fixed

☐ Missing import statements → AUTO-ADD appropriate imports
☐ Syntax errors (brackets, semicolons) → AUTO-FIX basic syntax
☐ Type mismatches → AUTO-CONVERT with safety checks
☐ Null pointer risks → AUTO-ADD safe call operators
☐ Unresolved references → AUTO-RESOLVE or flag for manual review
```

### High Priority Issues (Fix Before Proceeding)

```markdown
Priority: HIGH - Fix immediately after critical issues

☐ Unused imports → AUTO-REMOVE unused imports
☐ Incorrect naming conventions → SUGGEST corrections
☐ Missing error handling → AUTO-ADD basic try-catch
☐ Performance anti-patterns → FLAG for review
☐ Security vulnerabilities → FLAG for immediate review
```

## 🛠️ Common Fix Templates

### Android/Kotlin Examples

```kotlin
// AUTO-FIX TEMPLATE: Null safety
// BEFORE: user.name
// AFTER: user?.name

// AUTO-FIX TEMPLATE: Missing brackets
// BEFORE: if (condition) doSomething()
// AFTER: if (condition) { doSomething() }
```

### General Syntax Fixes

```javascript
// AUTO-FIX TEMPLATE: Missing generic error handling
// BEFORE: try { call() } catch (e) { log(e) }
// AFTER: try { call() } catch (e) { logger.error("Call failed", e); throw new ServiceException(e) }
```
