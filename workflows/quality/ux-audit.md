---
description: Kiểm tra hệ thống giao diện để cải thiện trải nghiệm và tính khả dụng.
safe_auto_run: false
---

# /ux-audit - The Design Police

A comprehensive sweep to ensure the app feels premium and consistent.

---

## Phase 1: Scope Definition

### 1.1. Target Selection
"Which screens to audit?"
- A) **Single Screen** (Quick check)
- B) **Feature Flow** (e.g., Onboarding, Checkout)
- C) **Entire App** (Comprehensive audit)

### 1.2. Locate Files
Identify View/Layout files for the target screens.

---

## Phase 2: The 5-Pillar Audit

### Pillar 1: Design System Consistency

#### iOS (SwiftUI) Checks
- [ ] Colors from `ColorPalette` or `Color.accentColor` (not hardcoded hex)
- [ ] Typography using Design System styles (not inline `.font()`)
- [ ] Spacing consistent (multiples of 4/8)
- [ ] Components from shared library (not one-off implementations)

```bash
# Detection
grep -E "#[0-9A-Fa-f]{6}" --include="*.swift"  # Hardcoded colors
grep -E "\.font\(\.system" --include="*.swift"  # Inline fonts
```

#### Android (Compose) Checks
- [ ] Colors from `MaterialTheme.colorScheme`
- [ ] Typography from `MaterialTheme.typography`
- [ ] Spacing using dimension resources
- [ ] Components from shared composables

```bash
# Detection
grep -E "Color\(0x" --include="*.kt"  # Hardcoded colors
grep -E "fontSize = [0-9]" --include="*.kt"  # Inline sizes
```

---

### Pillar 2: Usability & Accessibility

- [ ] Touch targets ≥ 44pt (iOS) / 48dp (Android)
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Empty states have clear messaging + CTA
- [ ] Loading states implemented (skeleton/spinner)
- [ ] Error states user-friendly (not technical messages)
- [ ] accessibilityLabel / contentDescription present

```swift
// iOS Check
// All interactive elements should have:
.frame(minWidth: 44, minHeight: 44)
.accessibilityLabel("Clear description")
```

```kotlin
// Android Check
// All interactive elements should have:
Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)
contentDescription = "Clear description"
```

---

### Pillar 3: Visual Aesthetics (The "Wow" Factor)

- [ ] Consistent border radius (rounded corners)
- [ ] Shadows/elevation used appropriately
- [ ] Animations smooth (not jarring)
- [ ] Visual hierarchy clear (what to focus on)
- [ ] White space balanced (not too crowded)
- [ ] Icons consistent (same style/weight)

**Common Issues:**
| Issue | Fix |
| :--- | :--- |
| Flat, boring UI | Add subtle shadows, gradients |
| Busy/cluttered | Increase padding, reduce elements |
| Inconsistent icons | Use single icon set (SF Symbols/Material) |
| No visual feedback | Add press states, animations |

---

### Pillar 4: Responsiveness & Adaptability

- [ ] Landscape orientation handled (if applicable)
- [ ] Different screen sizes tested (SE → Pro Max / Small → Tablet)
- [ ] Dynamic Type supported (iOS) / Font scaling (Android)
- [ ] Safe areas respected (notch, home indicator)
- [ ] Keyboard doesn't cover inputs

```swift
// iOS - Dynamic Type
.font(.body)  // Good - scales with user preference
.font(.system(size: 16))  // Bad - fixed size
```

---

### Pillar 5: Interaction & Micro-animations

- [ ] Buttons have tap feedback (haptics, visual)
- [ ] Transitions between screens smooth
- [ ] Pull-to-refresh feels native
- [ ] Loading indicators appear quickly (< 100ms)
- [ ] Success/error feedback clear
- [ ] Navigation intuitive

**Animation Timing:**
| Action | Ideal Duration |
| :--- | :--- |
| Button tap | 100-150ms |
| Screen transition | 250-350ms |
| Modal appearance | 300-400ms |
| Micro-feedback | 50-100ms |

---

## Phase 3: Pre-Delivery Checklist

### ✅ Visual Quality
- [ ] No emojis used as icons (use SF Symbols/Material Icons)
- [ ] All icons from consistent icon set
- [ ] Hover/press states don't cause layout shift
- [ ] No hardcoded colors (use theme)

### ✅ Interaction
- [ ] All clickable elements clearly tappable
- [ ] Haptic feedback on important actions
- [ ] Transitions smooth (spring/ease curves)
- [ ] Focus states visible for accessibility

### ✅ Light/Dark Mode
- [ ] Tested in both modes
- [ ] Text maintains contrast in both
- [ ] Images/icons visible in both
- [ ] No "burned in" colors

### ✅ Localization Ready
- [ ] No hardcoded strings
- [ ] Layouts handle longer text (German, Russian)
- [ ] RTL layout considered (if needed)
- [ ] Date/number formatting localized

### ✅ Edge Cases
- [ ] Empty state designed
- [ ] Error state designed
- [ ] Loading state designed
- [ ] Offline state designed (if applicable)
- [ ] Permission denied state (camera, location, etc.)

---

## Phase 4: Audit Report

```markdown
## 🎨 UX Audit Report: [Screen/Feature]

### 📊 Score
- Consistency: X/10
- Usability: X/10
- Aesthetics: X/10
- Responsiveness: X/10
- Interactions: X/10
- **Overall: X/10**

### 🔴 Critical Issues
1. [Issue] - [File:Line] - [Fix]

### 🟡 Improvements
1. [Suggestion] - [Benefit]

### ✨ Quick Wins
1. [Easy fix with big impact]

### 🎯 Action Plan
1. **Immediate**: [Today]
2. **Short-term**: [This week]
3. **Polish**: [Later]
```

---

## Phase 5: Implementation

### 5.1. Apply Quick Wins
// turbo
Fix easy issues that have high impact

### 5.2. Schedule Major Changes
Create tasks for larger improvements

---

## ⚠️ NEXT STEPS:
- Fixes applied → `/run` to preview
- Needs code changes → `/feature-completion`
- Ready to ship → `/deploy`
