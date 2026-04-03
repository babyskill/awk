---
description: 📺 Tích hợp Ads Flow vào APK mod (Smali) - Splash → Ads → Onboarding → Home
---

# Smali Ads Flow Integration

> **🎯 Mục tiêu**: Tạo luồng quảng cáo trong APK mod bằng cách hook vào Splash Activity có sẵn.

---

## 📋 Flow Logic Overview

### First Launch (Lần đầu)
```
Splash → Inter Ad (100%) → Onboarding + Native Ads → Inter Ad (100%) → Home
```

### Return Visit (Lần 2+)
```
Splash → Inter Ad (random mỗi 3-5 lần) → Home
```

---

## 🎬 Phase 1: Phân Tích Entry Points

**Prerequisites**: Đã decompile APK (xem `apk-modifier` skill)

### 1.1. Xác định Splash Activity

```bash
# Tìm LAUNCHER Activity trong AndroidManifest.xml
grep -r "android.intent.category.LAUNCHER" AndroidManifest.xml

# Kiểm tra có Splash Activity riêng không
find smali* -name "*Splash*.smali"
```

**Kết quả mong đợi:**
- **Scenario A**: App có `SplashActivity` riêng
- **Scenario B**: `MainActivity` là LAUNCHER (không có Splash)

### 1.2. Phân tích Navigation Flow

**Sử dụng jadx để hiểu logic:**
```bash
jadx-gui target.apk
```

**Cần xác định:**
- Method chứa navigation logic (ví dụ: `navigateToMain()`, `goHome()`)
- Delay mechanism (Handler.postDelayed, Timer, etc.)
- Target activity (MainActivity class name)

**Document findings:**
```
Current Flow: [Splash/MainActivity] → [Activity?] → [FinalActivity]
Navigation Method: navigateToMain() / goHome() / etc.
Target Activity: com.example.app.MainActivity
```

---

## 📦 Phase 2: Thiết Kế Components

### 2.1. Cấu trúc SDK cần tạo

```
{SDK_DIR}/
├── config/
│   └── AppPreferences.smali     # Quản lý state & random logic
└── activities/
    └── OnboardingActivity.smali  # Onboarding với Native Ads
```

**Note**: 
- `{SDK_DIR}` = thư mục SDK bạn chọn (ví dụ: `smali_classes2/com/myads/`)
- Package name tùy chỉnh theo dự án

### 2.2. Config Strategy

**Option 1**: JSON config file trong assets
```json
{
  "ad_ids": {...},
  "frequency": {"min": 3, "max": 5},
  "main_activity": "com.target.app.MainActivity"
}
```

**Option 2**: Hardcode trong Smali constants
```smali
.field private static final INTER_FREQUENCY_MIN:I = 0x3
.field private static final INTER_FREQUENCY_MAX:I = 0x5
```

---

## 🔧 Phase 3: Implementation Strategy

### 3.1. Component: AppPreferences

**Chức năng cần implement:**

| Method | Mục đích | Return |
|--------|----------|--------|
| `isFirstLaunch()` | Kiểm tra lần đầu mở app | boolean |
| `setFirstLaunchDone()` | Đánh dấu đã onboarding | void |
| `incrementOpenCount()` | Tăng counter mỗi lần mở | int |
| `shouldShowInterAd()` | Random 3-5 lần | boolean |

**Storage**: SharedPreferences

**Implementation**: Xem chi tiết Smali syntax trong `apk-modifier` skill

---

### 3.2. Injection Strategy

#### Scenario A: App có SplashActivity

**Hook Point 1: onCreate()**
```
Location: SplashActivity.smali
Action: Inject tracking
→ Call incrementOpenCount()
```

**Hook Point 2: Navigation Method**
```
Location: navigateToMain() / goHome() / etc.
Action: Inject flow logic
→ if isFirstLaunch() → go to Onboarding
→ else if shouldShowInterAd() → show Inter
→ else → go to MainActivity
```

---

#### Scenario B: MainActivity là LAUNCHER

**Hook Point: onCreate()**
```
Location: MainActivity.smali
Action 1: Tạo method mới checkAdsFlow()
Action 2: Inject call vào đầu onCreate()
→ Call checkAdsFlow()
→ Logic tương tự Scenario A
```

---

### 3.3. Component: OnboardingActivity

**Chức năng:**
- ViewPager/HorizontalScrollView với N slides
- Native Ad container (giữa hoặc cuối slides)
- Next/Skip buttons
- Khi complete → call `setFirstLaunchDone()`

**Navigation:**
```
OnboardingActivity → [Show Inter Ad?] → MainActivity
```

---

## 🔌 Phase 4: Integration

### 4.1. AndroidManifest Changes

**Thêm permissions:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**Thêm AdMob App ID:**
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-{YOUR_PUBLISHER_ID}~{APP_ID}"/>
```

**Đăng ký OnboardingActivity:**
```xml
<activity 
    android:name="{YOUR_PACKAGE}.activities.OnboardingActivity"
    android:exported="false"
    android:theme="@android:style/Theme.NoTitleBar.Fullscreen"/>
```

**⚠️ Quan trọng**: KHÔNG thay đổi LAUNCHER activity

---

### 4.2. Copy Dependencies

```bash
# Tùy project structure, có thể là smali, smali_classes2, etc.

# Copy AdMob libraries (nếu chưa có)
# Thường nằm trong com/google/android/gms/ads/

# Verify method count
find smali* -name "*.smali" | wc -l  # Phải < 60,000
```

---

### 4.3. Reference Validation

**Kiểm tra injection đúng:**
```bash
# Tìm tất cả reference đến AppPreferences
grep -r "AppPreferences" smali*/

# Tìm reference đến OnboardingActivity
grep -r "OnboardingActivity" smali*/
```

**Expected**: Thấy reference trong Splash/MainActivity

---

## 📺 Phase 5: Ads Implementation

> **Tách workflow riêng**: `/smali-ads-interstitial`, `/smali-ads-native`

**Tổng quan:**
1. **Interstitial Ads**
   - Load khi Splash onCreate()
   - Show sau Splash, sau Onboarding
   - Show random theo `shouldShowInterAd()`

2. **Native Ads**
   - Load trong OnboardingActivity
   - Display trong ad container
   - Cleanup khi destroy

**Chi tiết**: Xem workflows riêng

---

## ✅ Phase 6: Build & Test

```

### 6.2. Test Scenarios

| Scenario | Expected Behavior | Verification |
|----------|-------------------|--------------|
| **First Launch** | Splash → [Inter?] → Onboarding → [Inter?] → Home | Clear app data, launch |
| **2nd Launch** | Splash → Home (no ads) | Launch again |
| **3rd-5th Random** | Splash → [Inter random] → Home | Launch 10+ times, observe pattern |
| **Onboarding Skip** | Skip button works, navigate correctly | Test skip button |

### 6.3. Debug Commands

```bash
# Monitor flow events
adb logcat | grep -E "Preference|Onboarding|Navigation"

# Check SharedPreferences state
adb shell run-as {package} cat /data/data/{package}/shared_prefs/*.xml

# Extract & verify counter
# Should see: open_count, next_ad_count, first_launch values
```

---

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] APK đã decompile xong
- [ ] Xác định Splash/MainActivity và navigation method
- [ ] Document flow hiện tại
- [ ] Backup APK gốc

### Core Components
- [ ] Tạo AppPreferences với 4 methods
- [ ] Implement random logic (3-5 range)
- [ ] Tạo OnboardingActivity skeleton
- [ ] Test SharedPreferences đọc/ghi đúng

### Injection
- [ ] Hook vào onCreate() - tracking
- [ ] Hook vào navigation method - flow logic
- [ ] Test first launch flow
- [ ] Test return visit flow

### Integration
- [ ] Update AndroidManifest
- [ ] Copy dependencies (check method count)
- [ ] Validate all references
- [ ] Build thành công (no errors)

### Testing
- [ ] First launch: đúng flow
- [ ] Return visit: random đúng (test 10+ lần)
- [ ] Onboarding: skip/next works
- [ ] No crashes, no ANR

---

## 🔗 Related Resources

### Workflows
- `/smali-ads-interstitial` - Interstitial Ads implementation
- `/smali-ads-native` - Native Ads implementation
- `/smali-ads-config` - Remote Config cho Ad settings

### Skills & Docs
- **Skill**: `apk-modifier` - Smali techniques & examples
- **Cheatsheet**: `SMALI_CHEATSHEET.md` - Syntax reference
- **Tool**: jadx-gui - Decompile để đọc logic

---

## 💡 Tips & Best Practices

1. **Package Naming**: Chọn tên package phù hợp với app để tránh confusion
2. **Method Count**: Monitor liên tục, phân bổ sang smali_classes* nếu cần
3. **Testing**: Test với nhiều scenarios, đặc biệt random logic
4. **Logging**: Thêm Log.d() trong Smali để debug flow
5. **Backup**: Luôn giữ backup trước mỗi thay đổi lớn

---

**⚠️ Note**: Workflow này chỉ tập trung vào **FLOW LOGIC**. Chi tiết Ads implementation xem workflows riêng.