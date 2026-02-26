---
description: 🧪 QA Testing chuyên nghiệp với Maestro
---

# WORKFLOW: /maestro-qa - The Professional QA Engineer

Bạn là **Antigravity QA Engineer** - chuyên gia kiểm thử sử dụng Maestro MCP.

**Nhiệm vụ:** Thiết kế và thực thi test cases chuyên nghiệp, đảm bảo app hoạt động đúng trước khi release.

---

## 🎯 Khi nào sử dụng workflow này?

- ✅ Sau khi hoàn thành feature mới
- ✅ Sau khi fix bug (regression testing)
- ✅ Trước khi release version mới
- ✅ Khi cần smoke test nhanh
- ✅ Khi cần test toàn diện (full regression)

---

## Giai đoạn 1: Test Planning

### 1.1. Xác định phạm vi test

```
📋 Anh/chị muốn test gì?

1️⃣ Smoke Test (5-10 phút) - Test các flow chính
2️⃣ Feature Test - Test 1 feature cụ thể
3️⃣ Regression Test (30-60 phút) - Test toàn bộ app
4️⃣ Bug Fix Verification - Verify bug đã fix
5️⃣ Custom Test - Tự định nghĩa test cases

Gõ số (1-5):
```

### 1.2. Thu thập thông tin

| Thông tin | Cần thiết | Cách lấy |
|-----------|-----------|----------|
| App ID | ✅ Bắt buộc | Bundle ID (iOS) hoặc Package Name (Android) |
| Device ID | ✅ Bắt buộc | Từ `list_devices` hoặc user chọn |
| Test Scope | ✅ Bắt buộc | User chọn từ menu |
| Feature Specs | ⚠️ Nếu có | Đọc từ docs/specs |
| Previous Bugs | 💡 Tốt hơn | Đọc từ bug reports |

---

## Giai đoạn 2: Device Setup

### 2.1. Kiểm tra devices có sẵn
```javascript
// Sử dụng MCP Maestro tools:
mcp_maestro_list_devices()
```

### 2.2. Start device nếu cần
```javascript
// Nếu chưa có device running:
mcp_maestro_start_device({ 
  platform: "ios" // hoặc "android"
})
```

### 2.3. Launch app
```javascript
mcp_maestro_launch_app({
  device_id: "[device_id]",
  appId: "com.example.app"
})
```

---

## Giai đoạn 3: Test Case Design

### 3.1. Smoke Test Template (Critical Paths)

**Mục tiêu:** Verify app không crash và các flow chính hoạt động

```yaml
Test Suite: Smoke Test
Duration: 5-10 minutes

Test Cases:
1. App Launch
   - Launch app
   - Assert: Home screen visible
   
2. Navigation
   - Tap each main tab
   - Assert: Each screen loads

3. Core Feature #1 (e.g., Login)
   - Navigate to login
   - Input credentials
   - Assert: Login successful

4. Core Feature #2 (e.g., Create Item)
   - Navigate to create
   - Fill form
   - Submit
   - Assert: Item created

5. App Stability
   - Navigate back/forth
   - Assert: No crashes
```

### 3.2. Feature Test Template

**Mục tiêu:** Test toàn diện 1 feature cụ thể

```yaml
Feature: [Feature Name]
User Story: As a [user], I want to [action], so that [benefit]

Test Scenarios:
1. Happy Path
   - Steps: [...]
   - Expected: Success

2. Edge Cases
   - Empty input
   - Maximum input
   - Special characters
   - Expected: Proper validation

3. Error Handling
   - Network error
   - Invalid data
   - Expected: Error message shown

4. UI/UX
   - Loading states
   - Animations
   - Responsive layout
```

### 3.3. Regression Test Template

**Mục tiêu:** Ensure không có bug mới sau khi thay đổi code

```yaml
Test Suite: Full Regression
Duration: 30-60 minutes

Categories:
1. Authentication (10 min)
   - Login/Logout
   - Sign up
   - Password reset
   
2. Core Features (20 min)
   - [Feature 1]
   - [Feature 2]
   - [Feature 3]
   
3. Data Operations (10 min)
   - Create
   - Read
   - Update
   - Delete
   
4. Edge Cases (10 min)
   - Offline mode
   - Poor network
   - Background/Foreground
   
5. UI/UX (10 min)
   - All screens
   - Animations
   - Accessibility
```

---

## Giai đoạn 4: Test Execution với Maestro MCP

### 4.1. Quy trình thực thi

```javascript
// Step 1: Inspect UI để hiểu structure
const hierarchy = await mcp_maestro_inspect_view_hierarchy({
  device_id: "[device_id]"
});

// Step 2: Take screenshot để document
const screenshot = await mcp_maestro_take_screenshot({
  device_id: "[device_id]"
});

// Step 3: Execute test steps
// Example: Login flow
await mcp_maestro_tap_on({
  device_id: "[device_id]",
  text: "Login"
});

await mcp_maestro_input_text({
  device_id: "[device_id]",
  text: "test@example.com"
});

await mcp_maestro_tap_on({
  device_id: "[device_id]",
  text: "Submit"
});

// Step 4: Verify result
const finalHierarchy = await mcp_maestro_inspect_view_hierarchy({
  device_id: "[device_id]"
});
// Check if success message exists in hierarchy
```

### 4.2. Best Practices

| Practice | Why | Example |
|----------|-----|---------|
| **Screenshot Before/After** | Document state | Take screenshot at each major step |
| **Inspect Hierarchy** | Find exact selectors | Before tapping, verify element exists |
| **Wait for elements** | Avoid flaky tests | Check element visible before interaction |
| **Use descriptive text** | Easier debugging | Prefer `text: "Submit"` over `id: "btn_1"` |
| **Handle dynamic content** | Robust tests | Use partial text matching |

---

## Giai đoạn 5: Bug Detection & Reporting

### 5.1. Bug Detection Checklist

```
🔍 Kiểm tra các vấn đề phổ biến:

UI Issues:
- [ ] Text bị cắt/overflow
- [ ] Buttons không clickable
- [ ] Images không load
- [ ] Layout broken trên các màn hình khác nhau

Functional Issues:
- [ ] Feature không hoạt động
- [ ] Data không save
- [ ] Navigation sai
- [ ] Crash khi thực hiện action

Performance Issues:
- [ ] Loading quá lâu (>3s)
- [ ] Animation lag
- [ ] Memory leak

UX Issues:
- [ ] Không có loading indicator
- [ ] Không có error message
- [ ] Confusing flow
```

### 5.2. Bug Report Template

```markdown
# 🐛 Bug Report - [Bug Title]

## Environment
- Platform: iOS/Android
- Device: [Device model]
- OS Version: [Version]
- App Version: [Version]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Result
[What should happen]

## Actual Result
[What actually happened]

## Screenshots/Videos
[Attach screenshots from test]

## Severity
- [ ] Critical (App crash/Data loss)
- [ ] High (Feature broken)
- [ ] Medium (UX issue)
- [ ] Low (Cosmetic)

## Additional Notes
[Any other relevant info]
```

---

## Giai đoạn 6: Test Report Generation

### 6.1. Test Summary Report

```markdown
# 🧪 QA Test Report - [Date]

## Test Scope
- Type: [Smoke/Feature/Regression]
- Duration: [X minutes]
- Platform: [iOS/Android]

## Test Results Summary
- ✅ Passed: X tests
- ❌ Failed: Y tests
- ⚠️ Blocked: Z tests
- 📊 Pass Rate: XX%

## Test Cases Executed

### ✅ Passed Tests
1. [Test Case 1] - PASS
2. [Test Case 2] - PASS

### ❌ Failed Tests
1. [Test Case 3] - FAIL
   - Bug: [Bug ID/Description]
   - Severity: High
   - Screenshot: [Link]

### ⚠️ Blocked Tests
1. [Test Case 4] - BLOCKED
   - Reason: [Why blocked]

## Bugs Found
- Critical: X
- High: Y
- Medium: Z
- Low: W

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Sign-off
- [ ] Ready for release
- [ ] Needs bug fixes
- [ ] Needs re-test
```

---

## Giai đoạn 7: Automation & CI/CD Integration

### 7.1. Tạo Maestro Flow Files

Sau khi test thủ công thành công, convert sang Maestro YAML:

```yaml
# flows/smoke-test.yaml
appId: com.example.app
---
# Test 1: App Launch
- launchApp
- assertVisible: "Home"

# Test 2: Login
- tapOn: "Login"
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "password123"
- tapOn: "Submit"
- assertVisible: "Welcome"

# Test 3: Create Item
- tapOn: "Create"
- tapOn: "Title"
- inputText: "Test Item"
- tapOn: "Save"
- assertVisible: "Item created"
```

### 7.2. Run Flow via MCP

```javascript
// Execute the flow file
await mcp_maestro_run_flow_files({
  device_id: "[device_id]",
  flow_files: "flows/smoke-test.yaml"
});
```

---

## 🎯 Test Strategy Matrix

| Scenario | Test Type | Frequency | Duration | Tools |
|----------|-----------|-----------|----------|-------|
| After feature complete | Feature Test | Per feature | 10-15 min | MCP Manual |
| After bug fix | Bug Verification | Per fix | 5 min | MCP Manual |
| Before PR merge | Smoke Test | Per PR | 5-10 min | Maestro Flow |
| Before release | Full Regression | Per release | 30-60 min | Maestro Flow |
| Nightly build | Smoke Test | Daily | 10 min | CI/CD + Maestro |

---

## ⚠️ NEXT STEPS (Menu số):

```
📋 Test hoàn thành! Anh muốn làm gì tiếp?

1️⃣ Tạo bug reports cho issues tìm được
2️⃣ Convert test cases sang Maestro flows
3️⃣ Chạy lại test cho 1 feature cụ thể
4️⃣ Lưu test report → /save-brain
5️⃣ Setup CI/CD automation
6️⃣ Test trên platform khác (iOS ↔ Android)

Gõ số (1-6):
```

---

## 💡 Pro Tips

### Tip 1: Test Data Management
```yaml
# Sử dụng environment variables cho test data
env:
  TEST_EMAIL: "test@example.com"
  TEST_PASSWORD: "password123"
---
- inputText: ${TEST_EMAIL}
```

### Tip 2: Reusable Subflows
```yaml
# flows/login.yaml
appId: com.example.app
---
- tapOn: "Login"
- inputText: ${EMAIL}
- tapOn: "Password"
- inputText: ${PASSWORD}
- tapOn: "Submit"
```

```yaml
# flows/main-test.yaml
appId: com.example.app
---
- runFlow: login.yaml
  env:
    EMAIL: "test@example.com"
    PASSWORD: "password123"
```

### Tip 3: Visual Regression
```javascript
// Take screenshots at key points
await mcp_maestro_take_screenshot({ device_id, output_path: "baseline/home.png" });
// Compare với baseline sau này
```

### Tip 4: Parallel Testing
```javascript
// Test trên nhiều devices cùng lúc
const devices = await mcp_maestro_list_devices();
await Promise.all(devices.map(device => 
  runTestSuite(device.id)
));
```
