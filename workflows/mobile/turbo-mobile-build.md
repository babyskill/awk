---
description: Tự động hóa build dự án mobile và khắc phục lỗi môi trường phổ biến.
safe_auto_run: true
---

# /turbo-mobile-build - The Build Doctor

Automates the build process for mobile apps. Attempts to build, detects errors, applies known fixes, and rebuilds.

---

## Phase 1: Platform Detection & Clean
// turbo

1. **Detect platform:**
   - `*.xcworkspace` → iOS (prefer workspace over project)
   - `*.xcodeproj` → iOS
   - `build.gradle.kts` → Android
   - `app.json` with expo → Expo

2. **Clean build artifacts:**

### iOS
```bash
# Clean DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/[ProjectName]*

# Clean build folder
xcodebuild clean -workspace *.xcworkspace -scheme [Scheme]
```

### Android
```bash
./gradlew clean
```

### Expo
```bash
npx expo start -c  # Clear cache
rm -rf node_modules/.cache
```

---

## Phase 2: Dependency Resolution
// turbo

### iOS - CocoaPods
```bash
# Check Podfile.lock vs Pods
pod install --repo-update

# If still failing
rm -rf Pods Podfile.lock
pod install
```

### iOS - SPM (Swift Package Manager)
```bash
# Resolve packages
xcodebuild -resolvePackageDependencies
```

### Android - Gradle
```bash
# Refresh dependencies
./gradlew --refresh-dependencies

# If cache issues
rm -rf ~/.gradle/caches
./gradlew build
```

### Expo
```bash
rm -rf node_modules
npm install
```

---

## Phase 3: Build Execution
// turbo

### iOS
```bash
xcodebuild build \
  -workspace *.xcworkspace \
  -scheme [Scheme] \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO
```

### Android
```bash
./gradlew assembleDebug
```

### Expo
```bash
npx expo export --platform ios
npx expo export --platform android
# Or for native build
eas build --platform ios --profile development
eas build --platform android --profile development
```

---

## Phase 4: Error Analysis & Auto-Fix Loop

### iOS Common Errors

| Error Pattern | Auto-Fix |
| :--- | :--- |
| `No such module 'X'` | `pod install --repo-update` |
| `Command PhaseScriptExecution failed` | Check build phases, re-run |
| `Signing requires a development team` | Set `CODE_SIGNING_ALLOWED=NO` for simulator |
| `Multiple commands produce` | Clean DerivedData |
| `Package resolution failed` | `xcodebuild -resolvePackageDependencies` |
| `Framework not found` | Check Podfile, reinstall pods |

### Android Common Errors

| Error Pattern | Auto-Fix |
| :--- | :--- |
| `Gradle daemon stopped` | `./gradlew --stop && ./gradlew build` |
| `SDK location not found` | Set ANDROID_HOME in local.properties |
| `Dependency resolution failed` | `./gradlew --refresh-dependencies` |
| `Kotlin version mismatch` | Sync Kotlin versions in build.gradle |
| `AAPT2 error` | Clean and rebuild |

### Expo Common Errors

| Error Pattern | Auto-Fix |
| :--- | :--- |
| `Metro bundler crashed` | `npx expo start -c` |
| `Native module not linked` | `npx expo prebuild --clean` |
| `EAS build failed` | Check eas.json, credentials |

---

## Phase 5: Report
// turbo

### Success Report
```
✅ BUILD SUCCESSFUL

Platform: [iOS/Android/Expo]
Scheme: [Scheme Name]
Duration: [X] seconds
Output: [path to .app/.apk]

Actions Taken:
- Cleaned DerivedData
- Installed CocoaPods
- Built successfully

Next: /run to launch, or /deploy to publish
```

### Failure Report
```
❌ BUILD FAILED

Platform: [iOS/Android/Expo]
Error Type: [Compilation/Linking/Signing]

Error Details:
[First 10 lines of error]

Attempted Fixes:
- [Fix 1] - ❌ Did not resolve
- [Fix 2] - ❌ Did not resolve

Remaining Issues:
- [Issue 1] - Likely code error in [File]
- [Issue 2] - Missing dependency

Recommendation: Use /debug to investigate code errors
```

---

## ⚠️ NEXT STEPS:
- Build passed → `/run` to launch
- Build failed (env issue) → Retry with suggested fix
- Build failed (code issue) → `/debug`
