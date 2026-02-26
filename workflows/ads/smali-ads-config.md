---
description: ⚙️ Remote Config cho Ad Settings - Điều chỉnh ads mà không cần rebuild APK
---

# Smali Ads Remote Config

> **🎯 Mục tiêu**: Setup Remote Config để điều chỉnh ad settings (frequency, ad units, enable/disable) từ xa.

---

## 📋 Overview - Tại sao cần Remote Config?

### Benefits

| Without Remote Config | With Remote Config |
|----------------------|-------------------|
| ❌ Hardcode ad unit IDs | ✅ Update ad IDs remotely |
| ❌ Fixed frequency (3-5) | ✅ Adjust frequency dynamic |
| ❌ Rebuild APK để thay đổi | ✅ Change instantly |
| ❌ Rollback = new release | ✅ Rollback = change config |
| ❌ A/B test = multiple APKs | ✅ A/B test via config |

### Use Cases

1. **Update Ad Unit IDs** - Khi switch AdMob account
2. **Adjust Frequency** - Optimize revenue vs UX
3. **Feature Flags** - Enable/disable ads per screen
4. **A/B Testing** - Test different strategies
5. **Emergency Kill Switch** - Disable ads if issues

---

## 🔍 Phase 1: Choose Config Strategy

### Option 1: Firebase Remote Config (Recommended)

**Pros:**
- Free tier available
- Real-time updates
- User targeting (country, app version, etc.)
- Analytics integration
- No server needed

**Cons:**
- Requires Firebase SDK
- Network dependency
- Có thể conflict nếu app đã có Firebase

**Best for**: Production apps, need targeting

---

### Option 2: JSON from Server

**Pros:**
- Full control
- Lightweight
- Custom logic
- No third-party dependency

**Cons:**
- Need own server/CDN
- Implement sync logic
- Không có targeting built-in

**Best for**: Apps có backend riêng

---

### Option 3: Assets Fallback + Remote

**Strategy**: Local JSON fallback + remote override

**Pros:**
- App works offline
- Fast first load
- Graceful degradation

**Implementation:**
```
1. Load from assets/ad_config.json (defaults)
2. Fetch from remote
3. Merge/override
4. Cache locally
```

**Best for**: Hybrid approach, production ready

---

## 🔧 Phase 2: Config Schema Design

### 2.1. JSON Structure

```json
{
  "version": "1.0",
  "last_updated": "2024-01-20T10:00:00Z",
  
  "ad_units": {
    "interstitial": {
      "splash": "ca-app-pub-XXX/111",
      "onboarding": "ca-app-pub-XXX/222",
      "general": "ca-app-pub-XXX/333"
    },
    "native": {
      "onboarding": "ca-app-pub-XXX/444",
      "list": "ca-app-pub-XXX/555"
    },
    "banner": {
      "home": "ca-app-pub-XXX/666"
    }
  },
  
  "frequency": {
    "interstitial": {
      "min_launches": 3,
      "max_launches": 5,
      "min_interval_ms": 10000
    }
  },
  
  "feature_flags": {
    "enable_splash_ad": true,
    "enable_onboarding_ad": true,
    "enable_random_inter": true,
    "enable_native_ads": true
  },
  
  "test_mode": {
    "enabled": false,
    "use_test_ads": false
  }
}
```

### 2.2. Config Keys Strategy

**Naming convention:**
```
{feature}_{type}_{location}

Examples:
- ad_inter_splash
- ad_native_onboarding  
- freq_inter_min
- flag_enable_ads
```

---

## 📦 Phase 3: Implementation

### 3.1. Discovery - Check Firebase Presence

```bash
# Check if Firebase already in APK
find smali* -path "*/com/google/firebase/*" -type d

# Check Firebase config
ls assets/google-services.json 2>/dev/null
```

**Scenarios:**

**A. Firebase đã có**
- Reuse existing Firebase instance
- Add Remote Config component
- Risk: Conflict với existing config

**B. Firebase chưa có**
- Add Firebase SDK (heavy ~5-10MB)
- Setup google-services.json
- Risk: Method count, size increase

**C. Custom server**
- Implement HTTP client
- Parse JSON
- Cache mechanism

---

### 3.2. Config Helper Class

**Create wrapper:**
```
{SDK_DIR}/config/RemoteConfigHelper.smali
```

**Methods needed:**
```smali
.method public static init(Context)V
    # Initialize config (Firebase or HTTP)
.end method

.method public static fetch()V
    # Fetch latest config from remote
.end method

.method public static getString(String key)String
    # Get string value
.end method

.method public static getInt(String key)I
    # Get int value
.end method

.method public static getBoolean(String key)Z
    # Get boolean value
.end method

.method public static isFeatureEnabled(String)Z
    # Check feature flag
.end method
```

### 3.3. Integration với AppPreferences

**Update AppPreferences để dùng RemoteConfig:**

```
Before:
const/4 v0, 0x3  # Hardcoded min = 3

After:
invoke-static {"freq_inter_min"}, RemoteConfigHelper;->getInt()I
move-result v0  # Dynamic min from config
```

---

## 🔌 Phase 4: Fetch Strategy

### 4.1. When to Fetch?

**Strategy A: Application.onCreate()**
```
Pros: Early fetch, ready when needed
Cons: Delay app start
```

**Strategy B: Background fetch**
```
Pros: No blocking
Cons: First launch uses defaults
```

**Strategy C: Lazy fetch**
```
Pros: On-demand
Cons: Delay when showing ad
```

**Recommended: Hybrid**
```
1. Load cached config immediately
2. Fetch in background
3. Apply on next launch (or live if safe)
```

### 4.2. Caching Mechanism

**SharedPreferences caching:**
```
Keys:
- remote_config_json: Full JSON string
- remote_config_timestamp: Last fetch time
- remote_config_version: Config version

Invalidation:
- TTL: 12-24 hours
- Force refresh on app update
- Manual refresh option
```

### 4.3. Fallback Strategy

```
Priority:
1. Remote config (if fresh)
2. Cached config
3. Assets config (bundled)
4. Hardcoded defaults
```

---

## ✅ Phase 5: Testing & Rollout

### 5.1. Test Scenarios

| Test | Expected | Command |
|------|----------|---------|
| **First launch (no cached)** | Use assets config | Clear data, launch |
| **Fetch success** | Use remote values | Normal launch with network |
| **Fetch fail** | Use cached/assets | Airplane mode |
| **Config change** | Reflect on next launch | Change remote, relaunch |
| **Invalid JSON** | Fallback gracefully | Corrupt remote config |

### 5.2. Gradual Rollout

**Phase 1: Test with dev account**
- Use test ad IDs
- Small audience (1%)
- Monitor crashes

**Phase 2: Staging**
- Real ad IDs
- 10-20% audience
- Monitor metrics (impressions, revenue)

**Phase 3: Full rollout**
- 100% audience
- Monitor continuously

### 5.3. Monitoring

```bash
# Log config values on app start
adb logcat | grep "RemoteConfig"

# Verify fetched values
adb shell run-as {package} cat /data/data/{package}/shared_prefs/remote_config.xml
```

---

## 📋 Implementation Checklist

### Setup
- [ ] Choose config strategy (Firebase/Server/Hybrid)
- [ ] Design JSON schema
- [ ] Create RemoteConfigHelper class
- [ ] Setup fallback config in assets

### Firebase (if used)
- [ ] Add Firebase SDK dependencies
- [ ] Add google-services.json
- [ ] Initialize Firebase
- [ ] Test Remote Config connection

### Integration
- [ ] Update AppPreferences to use RemoteConfig
- [ ] Replace hardcoded values với config keys
- [ ] Implement fetch logic
- [ ] Add caching mechanism

### Testing
- [ ] Test all fallback scenarios
- [ ] Verify config updates apply
- [ ] Test with invalid/missing config
- [ ] Monitor performance impact

---

## 🔗 Related Resources

### Workflows
- `/smali-ads-flow` - Uses config for frequency
- `/smali-ads-interstitial` - Uses ad unit IDs
- `/smali-ads-native` - Uses ad unit IDs

### Firebase Docs
- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)
- [Android Integration](https://firebase.google.com/docs/remote-config/use-config-android)

---

## 💡 Tips & Best Practices

1. **Always have fallback**: App phải work khi remote config fail
2. **Cache aggressively**: Reduce network calls
3. **Version config**: Track changes, rollback if needed
4. **Test offline**: Ensure graceful degradation
5. **Don't fetch too often**: Respect rate limits, battery
6. **Use feature flags**: Easy enable/disable features
7. **Monitor impact**: Track config changes vs metrics

---

## ⚠️ Important Considerations

### Performance
- Fetch config async, don't block UI
- Cache effectively to minimize network
- Consider app size impact (Firebase SDK ~5-10MB)

### Security
- Don't put sensitive data in remote config
- Validate config values (prevent abuse)
- Monitor for unexpected changes

### User Experience
- Changes should be non-disruptive
- Consider showing update notice if major change
- Test across different Android versions

---

**🎯 Goal**: Balance flexibility với stability. Remote Config là powerful tool nhưng phải implement carefully!
