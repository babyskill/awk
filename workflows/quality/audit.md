---
description: 🔍 Review thay đổi trước commit - Kiểm tra bảo mật, đa ngôn ngữ & chất lượng code
---

# /audit - Pre-Commit Code Review

**Mục đích:** Review tất cả thay đổi code trước khi commit, tập trung vào 3 vấn đề chính:
1. 🛡️ **Bảo mật**: Hardcoded secrets, API keys, sensitive data
2. 🌐 **Đa ngôn ngữ**: Hardcoded strings trong UI (phải dùng localization)
3. ✅ **Chất lượng**: Architecture, performance, testing

---

## 🚀 Cách sử dụng

### Expert Mode (Tự động)
```bash
/audit --auto     # Tự động quét và báo cáo
```

### Guided Mode (Chi tiết)
```bash
/audit            # Hướng dẫn từng bước
```

---

## Phase 1: Xác định thay đổi

// turbo
```bash
# Kiểm tra các file đã thay đổi
git status
git diff --stat HEAD
git diff --name-only HEAD
```

**Output mong đợi:** Danh sách file đã sửa.

---

## Phase 2: Kiểm tra 3 vấn đề chính

### 🛡️ 1. BẢO MẬT (Critical)

#### Checklist:
- [ ] Không có hardcoded API keys, secrets, passwords
- [ ] Dữ liệu nhạy cảm dùng Keychain (iOS) / EncryptedSharedPreferences (Android)
- [ ] Không log sensitive data (token, password)
- [ ] Input validation đúng cách

#### Script tự động quét:
// turbo
```bash
echo "🔍 Scanning for security issues..."

# 1. Hardcoded secrets
echo "\n1️⃣ Checking hardcoded secrets..."
git diff HEAD | grep -E "api_key|secret|password|token" | grep -v "^-" | grep -v "//"

# 2. Sensitive data in logs
echo "\n2️⃣ Checking logs for sensitive data..."
git diff HEAD --name-only | xargs grep -n "print\|Log\." 2>/dev/null | grep -iE "token|password|key"

# 3. Keychain/Secure storage check (iOS)
echo "\n3️⃣ Checking for proper secure storage (iOS)..."
git diff HEAD | grep -E "UserDefaults|NSUserDefaults" | grep -v "^-"

# 4. Keychain/Secure storage check (Android)
echo "\n4️⃣ Checking for proper secure storage (Android)..."
git diff HEAD | grep -E "SharedPreferences" | grep -v "Encrypted" | grep -v "^-"
```

**🔴 CRITICAL nếu tìm thấy vấn đề:** DỪNG ngay, không được commit!

---

### 🌐 2. ĐA NGÔN NGỮ (High Priority)

#### Checklist:
- [ ] Không có hardcoded strings trong UI
- [ ] Tất cả text hiển thị dùng localization keys
- [ ] iOS: Dùng `LocalizedStringKey` hoặc `NSLocalizedString`
- [ ] Android: Dùng `R.string.xxx` hoặc `stringResource()`

#### Script tự động quét:
// turbo
```bash
echo "\n🌐 Scanning for hardcoded strings..."

# iOS - SwiftUI Text with hardcoded strings
echo "\n1️⃣ iOS: Checking SwiftUI Text..."
git diff HEAD --name-only "*.swift" | xargs grep -nE 'Text\("' 2>/dev/null | grep -v "LocalizedStringKey" | grep -v "^-"

# iOS - UILabel with hardcoded strings
echo "\n2️⃣ iOS: Checking UILabel..."
git diff HEAD --name-only "*.swift" | xargs grep -nE '\.text = "' 2>/dev/null | grep -v "NSLocalizedString" | grep -v "^-"

# Android - Kotlin hardcoded strings
echo "\n3️⃣ Android: Checking Kotlin..."
git diff HEAD --name-only "*.kt" | xargs grep -nE 'text = "' 2>/dev/null | grep -v "stringResource\|R.string" | grep -v "^-"

# Android - XML hardcoded strings
echo "\n4️⃣ Android: Checking XML..."
git diff HEAD --name-only "*.xml" | xargs grep -nE 'android:text="[^@]' 2>/dev/null | grep -v "^-"
```

**🟠 HIGH PRIORITY nếu tìm thấy:** Phải sửa trước khi commit!

---

### ✅ 3. CHẤT LƯỢNG CODE (Medium Priority)

#### Checklist:
- [ ] Functions < 50 lines
- [ ] Classes < 500 lines  
- [ ] No code duplication
- [ ] Proper error handling
- [ ] No commented-out code
- [ ] No TODO/FIXME left behind

#### Script tự động quét:
// turbo
```bash
echo "\n✅ Checking code quality..."

# 1. TODO/FIXME
echo "\n1️⃣ Checking for TODO/FIXME..."
git diff HEAD --name-only | xargs grep -nE "TODO|FIXME" 2>/dev/null

# 2. Commented code
echo "\n2️⃣ Checking for commented code blocks..."
git diff HEAD | grep -E "^\+.*//.*func |^\+.*//.*class " | head -10

# 3. Long functions (approximate)
echo "\n3️⃣ Checking for potentially long functions..."
git diff HEAD --name-only "*.swift" "*.kt" | xargs -I {} sh -c 'echo "\n{}" && grep -n "func \|fun " {} | head -5'

# 4. Missing tests for new code
echo "\n4️⃣ Checking if tests are updated..."
if git diff HEAD --name-only | grep -qE "\.swift$|\.kt$"; then
  if ! git diff HEAD --name-only | grep -qE "Test\.swift$|Test\.kt$"; then
    echo "⚠️  WARNING: Production code changed but no test files modified"
  fi
fi
```

**🟡 MEDIUM PRIORITY:** Nên sửa nhưng không block commit.

---

## Phase 3: Báo cáo kết quả

```markdown
# 📊 AUDIT REPORT

## 🛡️ Bảo mật
- ✅ Không phát hiện vấn đề / ❌ Tìm thấy X vấn đề

## 🌐 Đa ngôn ngữ  
- ✅ Tất cả strings đã localized / ❌ Tìm thấy X hardcoded strings

## ✅ Chất lượng
- ✅ Code clean / ⚠️ Tìm thấy X vấn đề nhỏ

---

## 🚦 QUYẾT ĐỊNH:
- 🟢 **READY TO COMMIT** - Không có vấn đề critical
- 🟡 **FIX RECOMMENDED** - Có warnings, nên sửa nhưng có thể commit
- 🔴 **MUST FIX** - Có critical issues, KHÔNG được commit!
```

---

## Phase 4: Hành động tiếp theo

**Nếu 🟢 READY:**
```markdown
1️⃣ Tiếp tục commit (`/smart-git-ops` hoặc `git commit`)
2️⃣ Xem lại danh sách thay đổi (`git diff --staged`)
```

**Nếu 🟡 FIX RECOMMENDED:**
```markdown
1️⃣ Xem chi tiết vấn đề (scroll up)
2️⃣ Sửa ngay (`/code`)
3️⃣ Tạo task để sửa sau (`bd create "Fix warnings"`)
4️⃣ Bỏ qua và commit (KHÔNG khuyến khích)
```

**Nếu 🔴 MUST FIX:**
```markdown
❌ DỪNG! Không được commit.

🔧 Hành động bắt buộc:
1. Sửa tất cả vấn đề bảo mật
2. Localize tất cả hardcoded strings
3. Chạy lại /audit
```

---

## 🧠 Brain Integration

Sau mỗi lần audit:
- Lưu báo cáo vào `brain/reports/audit_[timestamp].md`
- Track lỗi lặp lại → Gợi ý tạo rule tự động

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **LUÔN chạy `/audit` trước khi commit code**
2. **Ưu tiên sửa theo thứ tự:** 🛡️ Bảo mật → 🌐 Đa ngôn ngữ → ✅ Chất lượng
3. **Không bỏ qua vấn đề 🔴 Critical**
4. **Nếu không chắc:** Hỏi trước, đừng commit sau
