---
description: 📰 Tích hợp Native Ads vào APK mod - Tận dụng library có sẵn
---

# Smali Native Ads Integration

> **🎯 Mục tiêu**: Tích hợp Native Ads bằng cách tận dụng ads library có sẵn trong APK.

---

## 🔍 Phase 1: Discovery - Tìm Native Ads Library

### 1.1. Scan Pattern-based Search

**Pattern 1: Tìm theo keyword**
```bash
# Tìm file chứa "Native"
find smali* -name "*Native*.smali" | grep -i ad

# Tìm theo nội dung
find smali* -name "*.smali" | xargs grep -l "NativeAd\|native.*ad"
```

**Pattern 2: Tìm theo View components**
```bash
# Native Ad thường có View custom
find smali* -name "*AdView*.smali"
find smali* -name "*NativeView*.smali"

# Hoặc trong layout
grep -r "NativeAd" res/layout/
```

**Pattern 3: Google AdMob Native**
```bash
# Native Ad từ AdMob SDK
find smali* -path "*/gms/ads/nativead/*" -type f
```

### 1.2. Identify Components

**Common structures:**
- `NativeAd.smali` - Core ad object
- `NativeAdView.smali` - Container view
- `NativeAdOptions.smali` - Configuration
- `MediaView.smali` - Media content view
- Custom wrappers: `*NativeAdHelper*.smali`

**Document findings:**
```
[Native Ads Discovery]

Library Location: smali_classes*/{path}/
Core Classes:
- NativeAd: {ClassName}.smali
- AdView: {ViewClassName}.smali
- Loader: {LoaderClassName}.smali

View Components:
- Layout: res/layout/{native_ad_layout}.xml
- Binding: {package}/databinding/{Binding}.smali (nếu có)

Current Usage:
- Used in: {Activity/Fragment}.smali
- Inflated in: {methodName}()
```

---

## 📦 Phase 2: Understanding Native Ad Structure

### 2.1. Ad Assets Components

**Standard Native Ad có các thành phần:**

| Asset | Purpose | View Type |
|-------|---------|-----------|
| **Headline** | Tiêu đề chính | TextView |
| **Body** | Mô tả | TextView |
| **Icon** | Logo/Icon | ImageView |
| **Media** | Ảnh/Video lớn | MediaView |
| **Call to Action** | Button hành động | Button |
| **Advertiser** | Tên advertiser | TextView |
| **Star Rating** | Đánh giá | RatingBar |
| **Price** | Giá (nếu có) | TextView |
| **Store** | Store name | TextView |

### 2.2. Analyze Existing Layout

**Tìm layout XML:**
```bash
# Tìm layout có Native Ad
grep -r "NativeAdView\|native.*ad" res/layout/

# Hoặc tìm theo ID
grep -r "@id/ad_" res/layout/
```

**Structure thường gặp:**
```xml
<com.google.android.gms.ads.nativead.NativeAdView>
    <ImageView android:id="@+id/ad_app_icon" />
    <TextView android:id="@+id/ad_headline" />
    <TextView android:id="@+id/ad_body" />
    <com.google.android.gms.ads.nativead.MediaView 
        android:id="@+id/ad_media" />
    <Button android:id="@+id/ad_call_to_action" />
</com.google.android.gms.ads.nativead.NativeAdView>
```

### 2.3. API Pattern Recognition

**Sử dụng jadx để xem pattern:**
```java
// Example pattern
AdLoader adLoader = new AdLoader.Builder(context, "AD_UNIT_ID")
    .forNativeAd(new NativeAd.OnNativeAdLoadedListener() {
        @Override
        public void onNativeAdLoaded(NativeAd nativeAd) {
            // Populate views
        }
    })
    .build();
    
adLoader.loadAd(new AdRequest.Builder().build());
```

---

## 🔧 Phase 3: Integration Strategy

### 3.1. Determine Placement

**Từ `/smali-ads-flow`:**
- **Onboarding Activity** - Between slides
- **Other screens** (optional) - List items, feed, etc.

**Layout Strategy:**

**Option A: Inline placement**
```xml
<ScrollView>
    <LinearLayout>
        <!-- Content -->
        <TextView .../>
        
        <!-- Native Ad Container -->
        <include layout="@layout/native_ad_layout" />
        
        <!-- More content -->
    </LinearLayout>
</ScrollView>
```

**Option B: Overlay placement**
```xml
<FrameLayout>
    <!-- Main content -->
    <ViewPager .../>
    
    <!-- Ad overlay -->
    <include 
        layout="@layout/native_ad_layout"
        android:layout_gravity="bottom" />
</FrameLayout>
```

### 3.2. Loading Pattern

**Lifecycle integration:**
```
onCreate/onViewCreated:
  → Initialize AdLoader
  → Load ad

onNativeAdLoaded:
  → Populate NativeAdView
  → Show ad container
  → Track impression

onDestroy:
  → Destroy ad
  → Cleanup resources
```

### 3.3. View Population

**Generic pattern trong Smali:**
```
1. Get ad assets (headline, body, icon, etc.)
2. Set to corresponding views
3. Register NativeAdView
4. Track loaded state
```

**Implementation**: Xem existing usage trong APK để copy pattern

---

## 🎨 Phase 4: UI Implementation

### 4.1. Layout Creation/Reuse

**Option 1: Reuse existing layout**
```bash
# Tìm layout có sẵn
find res/layout -name "*native*.xml"
find res/layout -name "*ad*.xml"

# Copy và modify cho use case mới
cp res/layout/existing_native_ad.xml res/layout/onboarding_native_ad.xml
```

**Option 2: Create new layout**
- Design theo style app
- Include all required ad components
- Match NativeAdView structure

### 4.2. Styling Considerations

**Tuân thủ AdMob policy:**
- Phải có "Ad" badge/label
- Không được misleading
- CTA button phải rõ ràng
- Không che khuất nội dung bắt buộc

**Implementation:**
```xml
<!-- Ad badge -->
<TextView
    android:text="Ad"
    android:background="@color/ad_badge_bg"
    .../>
```

---

## 🔌 Phase 5: Code Injection

### 5.1. Hook Points

**Trong OnboardingActivity:**
```
Location: OnboardingActivity.smali
Method: onCreate() hoặc setupUI()

Actions:
1. Initialize AdLoader
2. Load native ad
3. Setup callback handlers
```

### 5.2. Injection Pattern

**Generic template:**
```smali
# In onCreate or initialization method

# Create AdLoader
new-instance v0, Lcom/google/android/gms/ads/AdLoader$Builder;
const-string v1, "{AD_UNIT_ID}"
invoke-direct {v0, p0, v1}, ...; <init>(...)

# Set native ad listener
# ... (copy pattern from existing usage)

# Build and load
invoke-virtual {v0}, ...; build()
move-result-object v1
invoke-virtual {v1, ...}, ...; loadAd(...)
```

### 5.3. Callback Implementation

**Pattern:**
```smali
.method private onNativeAdLoaded(Lcom/.../NativeAd;)V
    # 1. Get ad container view
    # 2. Populate assets to views
    # 3. Register ad view
    # 4. Make container visible
.end method

.method private onAdFailedToLoad()V
    # Fallback: hide ad container
    # Continue without ad
.end method
```

---

## ✅ Phase 6: Testing & Validation

### 6.1. Functional Tests

| Test | Expected | Verification |
|------|----------|--------------|
| **Load Success** | Ad loads, views populated | Visual check |
| **All Assets** | Headline, body, media, CTA shown | Check each element |
| **Click Works** | Clicking opens advertiser page | Test CTA |
| **Fallback** | No ad = hidden container | Test with no network |
| **No Memory Leak** | Destroy properly | Monitor memory |

### 6.2. UI/UX Tests

- [ ] Ad không che khuất content quan trọng
- [ ] "Ad" badge visible
- [ ] Layout responsive với different screen sizes
- [ ] Không conflict với app UI
- [ ] Smooth scroll/transition

### 6.3. Debug Commands

```bash
# Monitor native ad events
adb logcat | grep -E "NativeAd|AdLoader|MediaView"

# Test with test ad ID
# ca-app-pub-3940256099942544/2247696110 (Android Test Native)

# Check view hierarchy
adb shell uiautomator dump
adb pull /sdcard/window_dump.xml
```

---

## 📋 Implementation Checklist

### Discovery
- [ ] Tìm được native ad library/wrapper
- [ ] Xác định NativeAd và NativeAdView classes
- [ ] Tìm được existing layout
- [ ] Document API usage pattern

### Layout
- [ ] Có layout cho native ad
- [ ] Include tất cả required components
- [ ] Add "Ad" badge
- [ ] Styling match app design

### Integration
- [ ] Hook vào OnboardingActivity
- [ ] Inject AdLoader initialization
- [ ] Implement onNativeAdLoaded callback
- [ ] Populate view assets

### Testing
- [ ] Load ad successfully
- [ ] All assets display correctly
- [ ] Click tracking works
- [ ] Fallback when no ad
- [ ] No memory leaks

---

## 🔗 Related Resources

### Workflows
- `/smali-ads-flow` - Main ads flow
- `/smali-ads-interstitial` - Interstitial ads
- `/smali-ads-config` - Remote config

### References
- [AdMob Native Ads Guide](https://developers.google.com/admob/android/native)
- [Native Ads Policies](https://support.google.com/admob/answer/6329638)
- [Test Ads](https://developers.google.com/admob/android/test-ads)

---

## 💡 Tips & Best Practices

1. **Reuse existing implementation**: Copy pattern từ native ad có sẵn trong app
2. **Respect policies**: Luôn có "Ad" badge, không misleading
3. **Test thoroughly**: Native ad có nhiều assets, test kỹ
4. **Handle missing assets**: Một số ad không có đủ assets (rating, price)
5. **Cleanup properly**: Destroy ad trong onDestroy để tránh memory leak
6. **Responsive design**: Test với nhiều screen sizes

---

**⚠️ Quan trọng**: Native Ads phải tuân thủ strict policies về disclosure và presentation!
