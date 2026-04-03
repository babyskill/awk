---
description: 📱 Tích hợp Interstitial Ads vào APK mod - Tận dụng library có sẵn
---

# Smali Interstitial Ads Integration

> **🎯 Mục tiêu**: Tích hợp Interstitial Ads bằng cách tận dụng ads library có sẵn trong APK.

---

## 🔍 Phase 1: Discovery - Tìm Ads Library có sẵn

### 1.1. Scan toàn bộ cấu trúc

**Pattern 1: Tìm theo tên thư mục**
```bash
# Tìm các thư mục có chứa "ad"
find smali* -type d -iname "*ad*"

# Patterns thường gặp:
# - */ads/, */adslib/, */admanager/
# - */admob/, */admod/, */adsdk/
# - */advertisement/, */adnetwork/
```

**Pattern 2: Tìm theo package Google**
```bash
# AdMob SDK chính thống
find smali* -path "*/com/google/android/gms/ads/*" -type d

# Firebase Ads
find smali* -path "*/com/google/firebase/ads/*" -type d
```

**Pattern 3: Tìm theo custom wrapper**
```bash
# Tìm trong package chính của app
find smali*/{main_package}/* -type d -iname "*ad*"
```

### 1.2. Identify Interstitial Components

**Search Strategy:**
```bash
# Tìm file có chứa "Inter" và liên quan đến ad
find smali* -name "*Inter*.smali" | xargs grep -l "Lcom/google/android/gms/ads"

# Tìm theo keyword khác
find smali* -name "*.smali" | xargs grep -l "interstitial\|InterstitialAd"

# Tìm theo usage pattern
find smali* -name "*.smali" | xargs grep -l "loadInterstitialAd\|showInterstitialAd"
```

**Common class names (chỉ tham khảo):**
- `*InterstitialAd*.smali`
- `*InterAd*.smali` 
- `*FullscreenAd*.smali`
- `*AdManager*.smali` (có thể chứa inter logic)

### 1.3. Reverse Engineer Implementation

**Step 1: Jadx analysis**
```bash
jadx-gui target.apk
```

**Tìm kiếm:**
1. Search "InterstitialAd" trong jadx
2. Xem existing usage trong app
3. Document class hierarchy
4. Note down package structure

**Step 2: Document API**
```
[Findings Template]

Ads Library Location: smali_classes*/{discovered_path}/
Interstitial Class: {ClassName}.smali
Package: {full.package.name}

Methods Found:
- Constructor: <init>(...)
- Load: {methodName}(...)
- Show: {methodName}(...)
- Check Ready: {methodName}()

Callbacks:
- Interface: {CallbackInterfaceName}
- Methods: onAdLoaded(), onAdClosed(), etc.

Current Usage:
- Used in: {ActivityName}.smali
- Called from: {methodName}()
```

---

## 📦 Phase 2: API Analysis

### 2.1. Understand Method Signatures

**Sử dụng jadx để xem Java code:**
```java
// Example pattern (structure varies)
public class InterstitialAdHelper {
    public void init(Context context, String adId);
    public void loadAd();
    public void show(Activity activity);
    public boolean isReady();
    public void setListener(AdListener listener);
}
```

**Convert to Smali signatures:**
```smali
.method public init(Landroid/content/Context;Ljava/lang/String;)V
.method public loadAd()V
.method public show(Landroid/app/Activity;)V
.method public isReady()Z
.method public setListener(L{package}/AdListener;)V
```

### 2.2. Identify Dependencies

**Check AdMob presence:**
```bash
# Core AdMob classes
ls smali*/com/google/android/gms/ads/ 2>/dev/null

# If missing, need to copy from:
# - Another APK with AdMob
# - Extract from Google Play Services AAR
```

**Check custom wrappers:**
```bash
# Tìm dependency classes
grep -r "import.*AdRequest\|import.*InterstitialAd" smali*/ | head -20
```

---

## 🔧 Phase 3: Wrapper Creation

### 3.1. Tạo Wrapper Class (Option)

**Mục đích**: Standardize API để dễ sử dụng

```
{SDK_DIR}/ads/InterstitialWrapper.smali
```

**Chức năng:**
- Wrap existing library
- Handle lifecycle
- Provide clean API
- Manage ad caching

**Methods cần có:**
```
init(Context, String adId) → Initialize
load() → Load ad
show(Activity) → Show ad  
isReady() → Check ready state
destroy() → Cleanup
```

### 3.2. State Management

**Track states:**
- `NOT_LOADED` - Chưa load
- `LOADING` - Đang load
- `LOADED` - Đã load, ready
- `SHOWING` - Đang hiển thị
- `CLOSED` - Đã đóng

**Implementation**: Dùng enum hoặc int constants

---

## 🎯 Phase 4: Integration Points

### 4.1. Load Ad - Khi nào?

**Strategy 1: Pre-load sớm**
```
Application.onCreate() → Load ad
Splash.onCreate() → Load ad
```
**Pros**: Ad sẵn sàng khi cần
**Cons**: Tốn resources nếu user không trigger

**Strategy 2: On-demand**
```
Before navigation → Load ad → Show ad
```
**Pros**: Tiết kiệm resources
**Cons**: Có delay khi show

### 4.2. Show Ad - Ở đâu?

**Theo `/smali-ads-flow`:**
- Sau Splash (first launch)
- Sau Onboarding (first launch)
- Random 3-5 lần (return visit)

**Implementation:**
```
Location: SplashActivity.navigateToMain()
Action: Insert show ad logic
→ if shouldShowAd():
    → interstitialWrapper.show(this)
    → onAdClosed: navigate to next screen
→ else:
    → navigate directly
```

### 4.3. Handle Callbacks

**OnAdClosed callback:**
- Navigate to next screen
- Resume app flow
- Load next ad (pre-cache)

**OnAdFailedToLoad:**
- Fallback: skip ad, continue flow
- Log error for debugging
- Retry với exponential backoff?

---

## 🔌 Phase 5: Hook Implementation

### 5.1. Hook Point Template

**Generic pattern:**
```smali
# Original code
.method private navigateToNextScreen()V
    # ... navigation logic ...
.end method
```

**After injection:**
```smali
.method private navigateToNextScreen()V
    # Check if should show ad
    invoke-static {p0}, {AdHelper};->shouldShowInterAd()Z
    move-result v0
    
    if-eqz v0, :skip_ad
    
    # Show inter ad
    invoke-static {p0}, {InterWrapper};->show(Activity)V
    # Ad callback will handle navigation
    return-void
    
    :skip_ad
    # Original navigation logic
    # ...
.end method
```

### 5.2. Callback Handler

**Create callback class:**
```
{SDK_DIR}/ads/InterstitialCallback.smali
```

**Implement:**
```
onAdClosed() {
    // Resume navigation
    navigateToNextScreen()
}

onAdFailedToShow() {
    // Fallback
    navigateToNextScreen()
}
```

---

## ✅ Phase 6: Testing & Validation

### 6.1. Functional Tests

| Test Case | Expected | Command |
|-----------|----------|---------|
| **Load Success** | Ad loads, isReady=true | Monitor logcat |
| **Show Success** | Ad displays fullscreen | Visual check |
| **Callback Fired** | onAdClosed called | Check logs |
| **Navigation** | Nav to next screen after ad | Flow test |
| **No Network** | Fallback, skip ad | Airplane mode test |

### 6.2. Integration Tests

**With `/smali-ads-flow`:**
- First launch: Show after Splash ✓
- First launch: Show after Onboarding ✓
- Return visit: Random 3-5 times ✓

### 6.3. Debug Commands

```bash
# Monitor ad events
adb logcat | grep -E "InterstitialAd|AdMob|onAd"

# Test ad with test ID
# Replace ad unit ID with test ID:
# ca-app-pub-3940256099942544/1033173712 (Android Test Inter)

# Force show ad (for testing)
# Modify shouldShowInterAd() to always return true
```

---

## 📋 Implementation Checklist

### Discovery
- [ ] Tìm được ads library trong APK
- [ ] Xác định Interstitial class
- [ ] Document API methods
- [ ] Check dependencies đầy đủ

### Wrapper (Optional)
- [ ] Tạo wrapper class
- [ ] Implement init/load/show
- [ ] Handle state management
- [ ] Test wrapper riêng lẻ

### Integration
- [ ] Xác định hook points (từ `/smali-ads-flow`)
- [ ] Inject load ad logic
- [ ] Inject show ad logic
- [ ] Implement callbacks

### Testing
- [ ] Load ad thành công
- [ ] Show ad thành công
- [ ] Callback navigation đúng
- [ ] Fallback khi no network
- [ ] Integration với flow logic

---

## 🔗 Related Resources

### Workflows
- `/smali-ads-flow` - Main flow logic
- `/smali-ads-native` - Native ads
- `/smali-ads-config` - Remote config

### Skills
- `apk-modifier` - Smali techniques

### References
- [AdMob Interstitial Docs](https://developers.google.com/admob/android/interstitial)
- [AdMob Test Ads](https://developers.google.com/admob/android/test-ads)

---

## 💡 Tips & Best Practices

1. **Reuse existing library**: Tận dụng library có sẵn thay vì viết từ đầu
2. **Test ID first**: Dùng test ad ID khi debug để tránh invalid traffic
3. **Fallback gracefully**: Luôn có fallback khi ad fail
4. **Pre-load smart**: Load ad sớm nhưng đừng lãng phí resources
5. **Respect ad policies**: Không force click, không spam ads

---

**⚠️ Quan trọng**: Tuân thủ AdMob policies để tránh bị ban account!
