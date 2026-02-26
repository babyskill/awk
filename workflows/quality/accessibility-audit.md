---
description: ♿ Kiểm tra Accessibility (WCAG)
---

# WORKFLOW: /accessibility-audit - Accessibility Compliance Check

Đảm bảo ứng dụng accessible cho mọi người dùng, bao gồm người khuyết tật.

---

## Tại sao quan trọng?

- **Legal**: Nhiều quốc gia yêu cầu accessibility
- **Market**: 15% dân số có khuyết tật
- **UX**: Accessibility tốt = UX tốt cho tất cả
- **SEO/ASO**: App Store ưu tiên apps accessible

---

## WCAG 2.1 Level AA Checklist

### 1. Perceivable (Nhận biết được)

#### 1.1. Text Alternatives
- [ ] Tất cả images có alt text/content description
- [ ] Icons có labels
- [ ] Decorative images được đánh dấu

#### 1.2. Color Contrast
- [ ] Text contrast ratio ≥ 4.5:1 (normal text)
- [ ] Text contrast ratio ≥ 3:1 (large text 18pt+)
- [ ] UI components contrast ≥ 3:1

#### 1.3. Adaptable Content
- [ ] Hỗ trợ Dynamic Type (iOS) / Font Scaling (Android)
- [ ] Layout không break khi text size tăng
- [ ] Thông tin không phụ thuộc vào màu sắc

---

### 2. Operable (Vận hành được)

#### 2.1. Keyboard/Switch Control
- [ ] Tất cả functions accessible bằng keyboard/switch
- [ ] Focus order hợp lý
- [ ] Focus visible rõ ràng

#### 2.2. Touch Targets
- [ ] Minimum size: 44x44pt (iOS) / 48x48dp (Android)
- [ ] Spacing giữa targets ≥ 8pt/dp

#### 2.3. Timing
- [ ] Không có time limits (hoặc có thể tắt/điều chỉnh)
- [ ] Auto-playing content có thể pause

---

### 3. Understandable (Dễ hiểu)

#### 3.1. Readable
- [ ] Language được khai báo
- [ ] Text rõ ràng, đơn giản
- [ ] Error messages hữu ích

#### 3.2. Predictable
- [ ] Navigation nhất quán
- [ ] Components hoạt động như mong đợi
- [ ] Không có unexpected changes

---

### 4. Robust (Bền vững)

#### 4.1. Compatible
- [ ] Hoạt động với screen readers
- [ ] Semantic markup đúng
- [ ] Accessibility APIs được sử dụng đúng

---

## Testing Tools

### iOS - VoiceOver

```bash
# Enable VoiceOver
Settings → Accessibility → VoiceOver → ON

# Or triple-click side button (if configured)
Settings → Accessibility → Accessibility Shortcut → VoiceOver
```

**Testing Checklist:**
- [ ] Mọi element được đọc rõ ràng
- [ ] Swipe navigation hợp lý
- [ ] Custom controls hoạt động
- [ ] Images có alt text
- [ ] Buttons có labels

### Android - TalkBack

```bash
# Enable TalkBack
Settings → Accessibility → TalkBack → ON

# Or volume key shortcut
Settings → Accessibility → Volume key shortcut
```

**Testing Checklist:**
- [ ] Content descriptions đầy đủ
- [ ] Navigation logic
- [ ] Custom views accessible
- [ ] Proper heading structure

### Automated Tools

**iOS:**
```bash
# Accessibility Inspector
Xcode → Open Developer Tool → Accessibility Inspector

# Run audit
Select device → Audit → Run
```

**Android:**
```bash
# Accessibility Scanner
# Install from Play Store
# Enable → Scan screen → Review issues
```

---

## Common Issues & Fixes

### Issue 1: Missing Labels

**iOS**
```swift
// ❌ BAD
Image(systemName: "heart")

// ✅ GOOD
Image(systemName: "heart")
    .accessibilityLabel("Favorite")
```

**Android**
```kotlin
// ❌ BAD
Icon(Icons.Default.Favorite, contentDescription = null)

// ✅ GOOD
Icon(Icons.Default.Favorite, contentDescription = "Favorite")
```

**React Native**
```typescript
// ❌ BAD
<Image source={heartIcon} />

// ✅ GOOD
<Image 
  source={heartIcon} 
  accessible={true}
  accessibilityLabel="Favorite"
/>
```

### Issue 2: Low Contrast

```swift
// ❌ BAD: Gray text on light gray background
Text("Hello")
    .foregroundColor(.gray)
    .background(.gray.opacity(0.2))

// ✅ GOOD: High contrast
Text("Hello")
    .foregroundColor(.primary) // Adapts to light/dark mode
    .background(.background)
```

### Issue 3: Small Touch Targets

```kotlin
// ❌ BAD: 24dp button
Button(
    onClick = { },
    modifier = Modifier.size(24.dp)
) { }

// ✅ GOOD: 48dp minimum
Button(
    onClick = { },
    modifier = Modifier.size(48.dp)
) { }
```

### Issue 4: Complex Custom Controls

```swift
// ✅ GOOD: Proper accessibility for custom slider
struct CustomSlider: View {
    @State private var value: Double = 0.5
    
    var body: some View {
        // Custom slider UI
        sliderView
            .accessibilityElement()
            .accessibilityLabel("Volume")
            .accessibilityValue("\(Int(value * 100))%")
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment:
                    value = min(value + 0.1, 1.0)
                case .decrement:
                    value = max(value - 0.1, 0.0)
                @unknown default:
                    break
                }
            }
    }
}
```

---

## Audit Report Template

```markdown
# Accessibility Audit Report
Date: 2026-01-27
App Version: 1.0.0
Auditor: [Name]

## Summary
- Total Issues: 15
- Critical: 3
- High: 5
- Medium: 7
- Low: 0

## Critical Issues

### 1. Login button has no label
**Screen**: Login
**Issue**: Button not accessible to screen readers
**Fix**: Add accessibilityLabel
**Priority**: P0
**Status**: ❌ Open

### 2. Color-only error indication
**Screen**: Form validation
**Issue**: Errors shown only with red color
**Fix**: Add error icon and text
**Priority**: P0
**Status**: ❌ Open

## High Priority Issues
[...]

## Recommendations
1. Add accessibility tests to CI
2. Train team on accessibility
3. Regular audits (quarterly)
4. User testing with assistive tech users

## Compliance Status
- WCAG 2.1 Level A: ✅ Pass
- WCAG 2.1 Level AA: ⚠️ Partial (85%)
- WCAG 2.1 Level AAA: ❌ Not assessed
```

---

## Best Practices

### 1. Design for Accessibility

- Use system fonts (support Dynamic Type)
- Ensure 4.5:1 contrast minimum
- Make touch targets 44x44pt minimum
- Don't rely on color alone

### 2. Test Early and Often

- Test with VoiceOver/TalkBack weekly
- Include accessibility in QA checklist
- Get feedback from users with disabilities

### 3. Educate Team

- Accessibility training for designers
- Code review for accessibility
- Share accessibility guidelines

---

## Resources

- [Apple Accessibility](https://developer.apple.com/accessibility/)
- [Android Accessibility](https://developer.android.com/guide/topics/ui/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Next Steps**: Fix critical issues → Re-test → Document compliance
