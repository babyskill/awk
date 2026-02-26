---
description: Phân tích ảnh chụp màn hình để xác định và sửa lỗi giao diện hoặc hiển thị.
safe_auto_run: false
---

# Visual Debug Workflow

Turn a screenshot into a code fix.

## 1. Visual Analysis
**Trigger**: User uploads a screenshot.

1. **Analyze Image**:
   - Identify the screen/feature.
   - Spot the anomaly (Error message, misalignment, wrong color, broken layout).
   - *Self-Question*: "What looks wrong in this picture compared to a premium app?"

## 2. Code Mapping
1. **Locate Component**: based on text or visual structure, find the source file (e.g., `ProfileView.swift` or `home_screen.xml`).
2. **Verify Context**: Read the file to understand the current state implementation.

## 3. Diagnosis
1. **Hypothesize**: Why is it rendering this way?
   - *Logic Error*: State variable is wrong?
   - *Style Error*: Padding/Margin/Flex issue?
   - *Data Error*: Null or undefined data?
2. **Confirm**: Correlate code logic with the visual bug.

## 4. Remediation
1. **Propose Fix**: Explain the plan to the user.
2. **Apply Fix**: Edit the code.

## 5. Verification
1. Ask user to rebuild or preview to confirm the visual glitch is gone.
