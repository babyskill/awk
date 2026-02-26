---
description: 🚨 Sửa lỗi khẩn cấp Production
---

# WORKFLOW: /hotfix - Emergency Production Fix

**⚠️ CHỈ SỬ DỤNG KHI:**
- App đang crash trên production
- Critical security vulnerability được phát hiện
- Data loss đang xảy ra
- Service outage ảnh hưởng users

**KHÔNG dùng cho:**
- Bug nhỏ có thể đợi được
- Feature requests
- Performance improvements (trừ khi critical)

---

## 🎯 Mục tiêu

Sửa lỗi production **NHANH** và **AN TOÀN** nhất có thể, với documentation đầy đủ để tránh lặp lại.

---

## ⚡ FAST TRACK MODE (Bypass Spec-First)

Workflow này được phép **bypass** requirement tạo spec trước, NHƯNG phải tuân thủ các safety checks:

```yaml
bypass_conditions:
  - severity: CRITICAL (P0)
  - user_impact: HIGH (>1000 users affected)
  - time_sensitive: YES (must fix within hours)

safety_requirements:
  - Must document root cause
  - Must have rollback plan
  - Must write post-mortem after fix
```

---

## Giai đoạn 1: Triage & Assessment (5-10 phút)

### 1.1. Xác định mức độ nghiêm trọng

```
P0 - CRITICAL: App không dùng được, data loss, security breach
P1 - HIGH: Tính năng chính bị lỗi, ảnh hưởng nhiều users
P2 - MEDIUM: Tính năng phụ lỗi, workaround có thể
P3 - LOW: UI glitch, minor bugs
```

**Chỉ P0 và P1 mới được dùng /hotfix!**

### 1.2. Thu thập thông tin

- [ ] Error logs/crash reports
- [ ] Steps to reproduce
- [ ] Affected versions (iOS/Android version, app version)
- [ ] Number of affected users
- [ ] When did it start?

### 1.3. Rollback assessment

"Có thể rollback về version trước không?"
- **CÓ** → Rollback ngay, fix sau
- **KHÔNG** → Tiếp tục hotfix

---

## Giai đoạn 2: Root Cause Analysis (10-15 phút)

### 2.1. Reproduce locally

1. Checkout production branch
2. Reproduce lỗi trong dev environment
3. Confirm root cause

### 2.2. Identify the culprit

- Recent commits? (`git log --since="2 days ago"`)
- Recent deployments?
- Third-party SDK updates?
- Backend API changes?

### 2.3. Document findings

Tạo file `docs/ai/hotfix/YYYY-MM-DD-issue-name.md`:

```markdown
# Hotfix: [Issue Name]

## Severity: P0/P1

## Impact
- Affected users: [number]
- Affected platforms: iOS/Android/Both
- Started: [timestamp]

## Root Cause
[Detailed explanation]

## Proposed Fix
[What you will change]

## Risks
[What could go wrong]

## Rollback Plan
[How to undo if fix fails]
```

---

## Giai đoạn 3: Implement Fix (15-30 phút)

### 3.1. Create hotfix branch

```bash
git checkout production
git pull origin production
git checkout -b hotfix/YYYY-MM-DD-issue-name
```

### 3.2. Minimal change principle

**QUAN TRỌNG**: Chỉ sửa đúng cái bị lỗi, KHÔNG:
- Refactor code
- Add new features
- "Improve" things khác
- Change formatting

### 3.3. Write targeted fix

Focus vào:
- Smallest possible change
- Defensive coding (null checks, try-catch)
- Backward compatibility

### 3.4. Add safety guards

```swift
// iOS Example
guard let data = fetchData() else {
    // Fallback to safe default
    logger.error("Hotfix: Data fetch failed, using fallback")
    return defaultData
}
```

```kotlin
// Android Example
try {
    riskyOperation()
} catch (e: Exception) {
    // Log and gracefully degrade
    FirebaseCrashlytics.getInstance().recordException(e)
    showFallbackUI()
}
```

---

## Giai đoạn 4: Testing (10-20 phút)

### 4.1. Test the fix

- [ ] Verify fix works locally
- [ ] Test on affected device/OS version
- [ ] Test edge cases
- [ ] Verify no regression

### 4.2. Quick smoke test

Test các tính năng chính:
- [ ] App launches
- [ ] Login works
- [ ] Core features work
- [ ] No new crashes

### 4.3. Beta test (if possible)

- Deploy to internal testers
- Monitor for 15-30 minutes
- Check crash reports

---

## Giai đoạn 5: Deploy (Platform-specific)

### iOS (TestFlight → App Store)

```bash
# 1. Bump version
# Edit Info.plist: CFBundleShortVersionString = "1.2.3"
# CFBundleVersion = "123"

# 2. Build & Archive
xcodebuild archive -scheme YourApp -archivePath build/YourApp.xcarchive

# 3. Upload to TestFlight
xcodebuild -exportArchive -archivePath build/YourApp.xcarchive \
  -exportPath build/ -exportOptionsPlist ExportOptions.plist

# 4. Submit for expedited review
# In App Store Connect: Request Expedited Review
# Explain the critical bug and user impact
```

### Android (Internal Test → Production)

```bash
# 1. Bump version
# Edit build.gradle.kts:
# versionCode = 124
# versionName = "1.2.4"

# 2. Build release
./gradlew bundleRelease

# 3. Upload to Play Console
# Internal testing → Production (phased rollout 10%)

# 4. Monitor crash reports
```

### Expo (EAS Update)

```bash
# 1. Create hotfix update
eas update --branch production --message "Hotfix: [issue]"

# 2. Monitor rollout
eas update:view

# 3. If issues, rollback
eas update:rollback
```

---

## Giai đoạn 6: Monitor (2-4 giờ)

### 6.1. Watch metrics

- [ ] Crash rate (should decrease)
- [ ] Error logs (should reduce)
- [ ] User reports (should stop)
- [ ] App Store/Play Store reviews

### 6.2. Phased rollout (if possible)

- Start with 10% users
- If stable after 1 hour → 50%
- If stable after 2 hours → 100%

### 6.3. Rollback trigger

Rollback immediately if:
- Crash rate increases
- New critical bugs appear
- User complaints spike

---

## Giai đoạn 7: Post-Mortem (Sau khi stable)

### 7.1. Write post-mortem

Cập nhật `docs/ai/hotfix/YYYY-MM-DD-issue-name.md`:

```markdown
## Timeline
- [HH:MM] Issue detected
- [HH:MM] Hotfix started
- [HH:MM] Fix deployed
- [HH:MM] Verified stable

## What Went Wrong
[Detailed analysis]

## What Went Right
[What helped us fix quickly]

## Action Items
- [ ] Add test to prevent regression
- [ ] Update monitoring/alerts
- [ ] Improve deployment process
- [ ] Document learnings
```

### 7.2. Merge back to main

```bash
# Merge hotfix to main branch
git checkout main
git merge hotfix/YYYY-MM-DD-issue-name
git push origin main
```

### 7.3. Create regression test

**BẮT BUỘC**: Thêm test để đảm bảo lỗi này không xảy ra lại.

---

## 🛡️ Safety Checklist

Trước khi deploy, confirm:

- [ ] Root cause đã được xác định rõ ràng
- [ ] Fix đã được test kỹ
- [ ] Rollback plan đã sẵn sàng
- [ ] Monitoring đã được setup
- [ ] Team đã được thông báo
- [ ] Documentation đã được viết

---

## 📊 Success Criteria

Hotfix được coi là thành công khi:

- ✅ Crash rate giảm về baseline
- ✅ Không có regression bugs
- ✅ User complaints dừng lại
- ✅ Post-mortem đã được viết
- ✅ Regression test đã được thêm

---

## ⚠️ NEXT STEPS

```
1️⃣ Monitor metrics trong 24h tiếp theo
2️⃣ Schedule post-mortem meeting với team
3️⃣ Tạo tasks để prevent tương tự: /plan
4️⃣ Update runbook/documentation
```

---

## 🔴 Emergency Contacts (Template)

```
# Add your team's emergency contacts
- On-call engineer: [Name/Phone]
- Backend team lead: [Name/Phone]
- DevOps: [Name/Phone]
- Product manager: [Name/Phone]
```

---

**Remember**: Hotfix là last resort. Nếu không thực sự khẩn cấp, hãy dùng quy trình normal với `/plan` → `/code` → `/test`.
