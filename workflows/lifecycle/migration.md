---
description: 🔄 Nâng cấp SDK & Dependencies
---

# WORKFLOW: /migration - SDK & Dependency Migration

Hướng dẫn nâng cấp an toàn SDK, dependencies, và platform versions.

---

## Khi nào cần migration?

- iOS SDK upgrade (iOS 17 → iOS 18)
- Android SDK upgrade (API 33 → API 34)
- Expo SDK upgrade (SDK 50 → SDK 51)
- Major dependency updates (React Native, Firebase, etc.)
- Breaking changes in libraries

---

## Giai đoạn 1: Pre-Migration Assessment

### 1.1. Đọc Release Notes

- [ ] Review breaking changes
- [ ] Check deprecated APIs
- [ ] Note new features
- [ ] Identify migration guides

### 1.2. Check Compatibility

```bash
# iOS: Check Xcode compatibility
xcodebuild -version

# Android: Check Gradle compatibility
./gradlew --version

# Expo: Check SDK compatibility
npx expo-doctor
```

### 1.3. Backup Current State

```bash
# Create backup branch
git checkout -b backup/pre-migration-$(date +%Y%m%d)
git push origin backup/pre-migration-$(date +%Y%m%d)

# Tag current version
git tag -a v1.0.0-pre-migration -m "Before SDK migration"
git push origin v1.0.0-pre-migration
```

---

## Giai đoạn 2: Update Dependencies

### iOS Migration

```bash
# Update Podfile
# Edit Podfile: platform :ios, '18.0'

# Update pods
pod update

# Update Swift version if needed
# Xcode → Build Settings → Swift Language Version
```

### Android Migration

```kotlin
// build.gradle.kts
android {
    compileSdk = 34
    defaultConfig {
        minSdk = 24
        targetSdk = 34
    }
}

// Update dependencies
dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    // ... other updates
}
```

```bash
# Sync and build
./gradlew clean build
```

### Expo Migration

```bash
# Upgrade Expo SDK
npx expo install expo@latest

# Upgrade all Expo packages
npx expo install --fix

# Check for issues
npx expo-doctor
```

---

## Giai đoạn 3: Fix Breaking Changes

### 3.1. Compiler Errors

Fix errors one by one:
- Deprecated API usage
- Changed method signatures
- Removed classes/methods

### 3.2. Runtime Issues

Test thoroughly:
- [ ] App launches
- [ ] Core features work
- [ ] No crashes
- [ ] Performance is acceptable

---

## Giai đoạn 4: Testing

### 4.1. Automated Tests

```bash
# iOS
xcodebuild test -scheme YourApp -destination 'platform=iOS Simulator,name=iPhone 15'

# Android
./gradlew test
./gradlew connectedAndroidTest

# Expo
npm test
```

### 4.2. Manual Testing

- [ ] Test on oldest supported device
- [ ] Test on newest device
- [ ] Test all critical user flows
- [ ] Test edge cases

---

## Giai đoạn 5: Rollout

### 5.1. Internal Testing

- Deploy to TestFlight/Internal Testing
- Monitor for 2-3 days
- Check crash reports

### 5.2. Phased Rollout

- Start with 10% users
- Monitor for 24 hours
- Increase to 50% if stable
- Full rollout after 48 hours

---

## Rollback Plan

If issues occur:

```bash
# Revert to backup branch
git checkout main
git reset --hard backup/pre-migration-YYYYMMDD
git push origin main --force

# Redeploy previous version
```

---

## Post-Migration

- [ ] Update documentation
- [ ] Remove deprecated code
- [ ] Update CI/CD configs
- [ ] Communicate changes to team

---

**Next Steps**: `/test` để chạy full test suite
