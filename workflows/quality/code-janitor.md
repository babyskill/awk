---
description: 🧹 Bảo trì mã nguồn & dọn tài nguyên thừa
safe_auto_run: true
---

# /code-janitor - Mobile Project Cleaner

Keeps iOS/Android/Expo projects clean and consistent.

---

## Phase 1: Localization Audit
// turbo

### iOS (Swift)
1. **Scan for hardcoded strings:**
   ```swift
   // BAD
   Text("Welcome back!")
   
   // GOOD
   Text(LocalizedStringKey("welcome_back"))
   ```

2. **Find missing keys:**
   - Scan all `.swift` files for `LocalizedStringKey` usage
   - Compare with `Localizable.strings`
   - Report missing translations

3. **Auto-fix:**
   - Extract hardcoded strings to `Localizable.strings`
   - Replace with localization keys

### Android (Kotlin)
1. **Scan for hardcoded strings:**
   ```kotlin
   // BAD
   Text("Welcome back!")
   
   // GOOD
   stringResource(R.string.welcome_back)
   ```

2. **Find missing keys:**
   - Scan for string usage
   - Compare with `strings.xml`

### Expo (TypeScript)
1. **Scan for hardcoded strings:**
   - Check for strings in components
   - Verify i18n usage if configured

---

## Phase 2: Unused Resource Cleanup
// turbo

### iOS
1. **Unused Images:**
   ```bash
   # Find images in Assets.xcassets not referenced in code
   find . -name "*.swift" -exec grep -l "imageName" {} \;
   ```
   
2. **Unused Colors:**
   - Check Color assets vs code usage

3. **Dead Code:**
   - Run SwiftLint for unused imports
   - Find unreferenced classes/structs

### Android
1. **Unused Resources:**
   ```bash
   ./gradlew lintDebug
   # Check "UnusedResources" warnings
   ```

2. **Unused Dependencies:**
   - Check for unused Gradle dependencies

### Expo
1. **Unused packages:**
   ```bash
   npx depcheck
   ```

2. **Unused images:**
   - Scan `assets/` folder vs imports

---

## Phase 3: Code Formatting
// turbo

### iOS
```bash
# SwiftFormat
swiftformat . --config .swiftformat

# SwiftLint auto-correct
swiftlint --fix
```

### Android
```bash
# Ktlint
./gradlew ktlintFormat

# Or standalone
ktlint -F "**/*.kt"
```

### Expo
```bash
# Prettier + ESLint
npm run lint -- --fix
npx prettier --write "**/*.{ts,tsx}"
```

---

## Phase 4: Project-Specific Cleanup

### iOS
// turbo
1. **Info.plist validation:**
   - Check required keys present
   - Verify bundle identifiers

2. **Build Settings:**
   - Check for deprecated settings
   - Verify signing configuration

3. **Podfile cleanup:**
   - Remove unused pods
   - Update pod versions

### Android
// turbo
1. **Manifest validation:**
   - Check permissions
   - Verify activities/services

2. **Gradle cleanup:**
   - Remove deprecated dependencies
   - Update dependency versions

3. **ProGuard rules:**
   - Verify rules are current

### Expo
// turbo
1. **app.json validation:**
   - Check required fields
   - Verify splash/icon paths

2. **Package.json cleanup:**
   - Remove unused dependencies
   - Update versions

---

## Phase 5: File Organization Check

### Verify Architecture Compliance
1. **Check if files are in correct folders:**
   - Views in Views/
   - ViewModels in ViewModels/
   - Models in Models/

2. **Check naming conventions:**
   - iOS: PascalCase for files
   - Android: PascalCase for Kotlin, lowercase for resources
   - Expo: PascalCase for components

---

## Phase 6: Report
// turbo

```markdown
# 🧹 Code Janitor Report

## Localization
- Hardcoded strings found: X
- Strings extracted: Y
- Missing translations: Z

## Resources
- Unused images removed: X
- Unused code detected: Y files

## Formatting
- Files formatted: X
- Lint issues fixed: Y

## Recommendations
- [ ] Review unused code before deletion
- [ ] Update translations for new strings
- [ ] Run /test after cleanup
```

---

## ⚠️ NEXT STEPS:
- Review changes → Commit with `/smart-git-ops`
- Verify nothing broke → `/run`
- Full audit → `/ux-audit`
