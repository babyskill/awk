---
description: 🐞 Sửa lỗi tự động (Expert Mode)
---

# WORKFLOW: /debugExpert - Auto Debug & Fix

> **Expert Mode Only:** Tự động phân tích và sửa lỗi, không hỏi gì cả.

---

## Usage

```bash
/debugExpert [file]
```

**Examples:**
```bash
/debugExpert                          # Auto-detect lỗi từ logs
/debugExpert src/api/auth/login.ts    # Debug file cụ thể
```

---

## Execution Flow

### 1. Error Detection (Auto)

**Source Priority:**
1. Terminal output (last 100 lines)
2. Log files (`logs/*.log`)
3. Test failures (Jest/Mocha/XCTest output)
4. Linter errors (ESLint/SwiftLint)

**Parse:**
- Error type
- File & line number
- Stack trace
- Error message

### 2. Root Cause Analysis (Auto)

**Common Patterns:**
- `undefined/null` → Add null check
- `Module not found` → Add import
- `Type error` → Fix type annotation
- `API 401/403` → Check auth token
- `API 500` → Check server logs
- `CORS` → Update server config

### 3. Auto-Fix (Safe Only)

**Safe-to-Fix:**
- ✅ Missing imports
- ✅ Typos in variable names
- ✅ Undefined checks (`if (x)` before `x.map()`)
- ✅ Type annotations
- ✅ Linting issues

**Need-Review:**
- ⚠️ Logic errors → Create Symphony task
- ⚠️ Security issues → Create Symphony task + Alert
- ⚠️ Performance issues → Create Symphony task

### 4. Verify Fix

- Chạy lại test/linter
- Nếu pass → Done
- Nếu fail → Rollback + Create Symphony task

### 5. Report

```
✅ **DEBUG COMPLETE**

🐛 **Issue:** TypeError: Cannot read 'map' of undefined
📂 **File:** src/components/ProductList.tsx:42

🔧 **Fix Applied:**
Added null check before mapping products array

✅ **Verification:** Tests passed

🎵 **Symphony:** No new tasks (auto-fixed)

➡️ **Next:** /codeExpert (Continue coding)
```

---

## Assumptions (Expert Mode)

AI sẽ tự động quyết định:
- ✅ Fix strategy (null check vs default value vs error throw)
- ✅ Test coverage (add test for fixed bug)
- ✅ Rollback on failure

**Không hỏi về fix approach.** Chọn cách an toàn nhất.

---

## Error Handling

### Cannot Auto-Fix
```
⚠️ Cannot auto-fix: Complex logic error

🎵 Created task: "Fix logic error in calculateTotal()"

📋 **Analysis:**
- Issue: Calculation returns negative value
- Root cause: Missing validation for discount > price
- Suggested fix: Add validation before calculation

➡️ **Next:**
1. Fix manually: Open task in Symphony
2. Get help: /debug (Guided Mode)
```

### Multiple Errors
```
⚠️ Found 5 errors

✅ Auto-fixed: 3 errors
🎵 Created Symphony tasks: 2 errors

➡️ **Next:** symphony_available_tasks(filter="ready")
```

---

## Integration

- **Symphony:** Auto-create tasks for complex bugs
- **Brain:** Save bug patterns to `brain/bugs/`
- **Git:** Auto-commit fixes with message "fix: [description]"
