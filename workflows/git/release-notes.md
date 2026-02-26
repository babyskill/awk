---
description: 📝 Tạo Release Notes tự động
---

# WORKFLOW: /release-notes - Automated Changelog Generation

Tự động tạo release notes từ git commits cho App Store và Play Store.

---

## Giai đoạn 1: Generate from Git

### 1.1. Conventional Commits Format

Commits nên theo format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `docs`: Documentation
- `style`: UI/UX changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### 1.2. Extract Commits

```bash
# Get commits since last release
git log v1.0.0..HEAD --pretty=format:"%s" --no-merges

# Group by type
git log v1.0.0..HEAD --pretty=format:"%s" --no-merges | grep "^feat:"
git log v1.0.0..HEAD --pretty=format:"%s" --no-merges | grep "^fix:"
```

---

## Giai đoạn 2: Format for Platforms

### App Store (English)

```markdown
## What's New in Version 1.1.0

### New Features
• Added dark mode support
• Introduced offline mode for core features
• New onboarding experience

### Improvements
• Faster app startup time
• Improved search performance
• Better error messages

### Bug Fixes
• Fixed crash when uploading large images
• Resolved sync issues with cloud storage
• Fixed UI glitches on iPad

---

Thank you for using [App Name]! We're constantly improving your experience.
```

### Play Store (English)

```markdown
🎉 What's New

✨ New Features
• Dark mode is here!
• Work offline with core features
• Redesigned onboarding

⚡ Improvements
• 50% faster startup
• Smoother search
• Clearer error messages

🐛 Bug Fixes
• No more crashes when uploading
• Cloud sync works perfectly
• iPad UI is now pixel-perfect

Love the app? Rate us! ⭐⭐⭐⭐⭐
```

---

## Giai đoạn 3: Localization

### Vietnamese

```markdown
## Có gì mới trong phiên bản 1.1.0

### Tính năng mới
• Hỗ trợ chế độ tối
• Chế độ ngoại tuyến cho các tính năng chính
• Trải nghiệm giới thiệu mới

### Cải tiến
• Khởi động ứng dụng nhanh hơn
• Tìm kiếm mượt mà hơn
• Thông báo lỗi rõ ràng hơn

### Sửa lỗi
• Sửa lỗi crash khi tải ảnh lớn
• Khắc phục vấn đề đồng bộ
• Sửa lỗi giao diện trên iPad
```

---

## Automation Script

```bash
#!/bin/bash
# generate-release-notes.sh

LAST_TAG=$(git describe --tags --abbrev=0)
CURRENT_VERSION="1.1.0"

echo "## What's New in Version $CURRENT_VERSION"
echo ""

echo "### New Features"
git log $LAST_TAG..HEAD --pretty=format:"• %s" --no-merges | grep "^• feat:" | sed 's/^• feat: /• /'
echo ""

echo "### Improvements"
git log $LAST_TAG..HEAD --pretty=format:"• %s" --no-merges | grep "^• perf:\|^• refactor:" | sed 's/^• perf: /• /' | sed 's/^• refactor: /• /'
echo ""

echo "### Bug Fixes"
git log $LAST_TAG..HEAD --pretty=format:"• %s" --no-merges | grep "^• fix:" | sed 's/^• fix: /• /'
```

---

## Best Practices

- Keep it user-focused (not technical)
- Highlight top 3-5 changes
- Use emojis for Play Store
- Keep under 4000 characters
- Test readability

---

**Next Steps**: Copy to App Store Connect / Play Console
