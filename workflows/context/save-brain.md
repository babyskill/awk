---
description: 💾 Lưu trữ kiến thức & quyết định dự án
---

# /save-brain - The Memory Keeper

You are **Antigravity Librarian**. Mission: Fight "Context Drift" - ensure AI never forgets.

**Principle:** "Code changes → Docs change IMMEDIATELY"

---

## Phase 1: Change Analysis

### 1.1. What Changed Today?
"What important changes did we make?"
- Or: "Should I auto-scan modified files?"

### 1.2. Auto-Analysis
// turbo
```bash
# Find recently modified files
find . -name "*.swift" -o -name "*.kt" -mtime -1 | head -20

# Check git changes
git diff --stat HEAD~1
git log --oneline -5
```

### 1.3. Classification
| Type | Action |
| :--- | :--- |
| **Major** (New module, DB changes) | Update Architecture docs |
| **Feature** (New screen, API) | Update Feature docs |
| **Minor** (Bug fix, refactor) | Update CHANGELOG only |

---

## Phase 2: Documentation Updates

### 2.1. Steering Docs (Project-level)
**Files:** `docs/steering/`
// turbo
Update when:
- New module/feature added
- Third-party SDK integrated
- Major refactoring done

**Structure:**
- `docs/steering/product.md` - Product overview & mission
- `docs/steering/structure.md` - Project structure & organization
- `docs/steering/tech.md` - Tech stack & commands

### 2.2. Feature Specs
**Files:** `docs/specs/[feature-name]/`
// turbo
```markdown
docs/specs/[feature-name]/
├── requirements.md  # User stories & acceptance criteria
├── design.md        # Technical design & architecture
└── design.md        # Technical design & architecture
```

### 2.3. Legacy Feature Documentation (Optional)
**File:** `docs/features/[feature_name].md`
// turbo
```markdown
# [Feature Name]

## Purpose
[What this feature does]

## User Stories
- As a user, I want to...

## Technical Design
[Architecture decisions]

## API Contracts
[If applicable]

## Known Issues
[Current limitations]
```

### 2.4. API Documentation (If Applicable)
**File:** `docs/api/endpoints.md`
// turbo
```markdown
# API Documentation

## Authentication
### POST /api/auth/login
- **Description:** User login
- **Body:** { email, password }
- **Response:** { token, user }
- **Errors:** 401 (Invalid credentials)
```

---

## Phase 3: Code Documentation

### 3.1. README Update
// turbo
Check if updates needed:
- [ ] New setup steps
- [ ] New environment variables
- [ ] Changed build commands
- [ ] New dependencies

### 3.2. Inline Documentation Quality Check

**Good Swift Documentation:**
```swift
/// Fetches user profile from the server.
/// - Parameter userId: The unique identifier of the user
/// - Returns: User profile if found, nil otherwise
/// - Throws: NetworkError if request fails
func fetchUserProfile(userId: String) async throws -> UserProfile?
```

**Good Kotlin Documentation:**
```kotlin
/**
 * Fetches user profile from the server.
 * @param userId The unique identifier of the user
 * @return User profile if found, null otherwise
 * @throws NetworkException if request fails
 */
suspend fun fetchUserProfile(userId: String): UserProfile?
```

### 3.3. CHANGELOG Update
// turbo
**File:** `CHANGELOG.md`
```markdown
# Changelog

## [Unreleased] - 2026-01-16

### Added
- [Feature description]
- New API endpoint for [purpose]

### Changed
- [What was modified]

### Fixed
- [Bug that was fixed]

### Deprecated
- [Features being phased out]
```

---

## Phase 4: Knowledge Items

### 4.1. Capture Important Learnings
// turbo
**File:** `.gemini/knowledge/[topic].md`

Things to document:
- Patterns discovered that work well
- Gotchas and how to avoid them
- Third-party integration notes
- Performance optimizations found
- Security considerations

```markdown
# [Topic] Knowledge

## Context
[When this applies]

## Key Points
- [Important thing 1]
- [Important thing 2]

## Code Example
```[language]
[Working example]
```

## References
- [Links to docs/resources]
```

---

## Phase 5: Quality Checks

### 5.1. Documentation Health
// turbo
```bash
# Check documentation completeness
find docs -name "*.md" | wc -l  # Total docs

# Find docs not updated recently
find docs -name "*.md" -mtime +30  # Older than 30 days

# Check for TODO in docs
grep -rn "TODO\|TBD\|FIXME" docs/
```

### 5.2. Consistency Check
```bash
# Terminology consistency
for term in "setup" "set-up" "set up"; do
  echo "$term: $(grep -ri "$term" docs/ 2>/dev/null | wc -l)"
done
```

### 5.3. Link Validation
```bash
# Find potentially broken internal links
grep -r "\[.*\](\..*\.md)" docs/ | head -10
```

---

## Phase 6: Environment & Config

### 6.1. Environment Variables
// turbo
**File:** `.env.example`
```bash
# Ensure all new env vars are documented
# API Configuration
API_BASE_URL=https://api.example.com
API_KEY=your_api_key_here

# Feature Flags
FEATURE_NEW_ONBOARDING=false
```

### 6.2. Build Configuration
Document any changes to:
- Xcode schemes
- Gradle flavors
- Environment configs

---

## Phase 7: Confirmation

```markdown
## 💾 Brain Save Complete

### Documents Updated
- `docs/architecture/system_overview.md` - Added new module
- `CHANGELOG.md` - Added today's changes
- `.gemini/knowledge/[topic].md` - New knowledge captured

### Quality Metrics
- Docs with updates: X
- Knowledge items added: Y
- TODO items remaining: Z

### Recommendations
- [ ] Review [doc] before next major change
- [ ] Update [area] when implementing [feature]

---
*This knowledge is now permanently saved.*
*Tomorrow use `/recap` to restore context.*
```

---

## ⚠️ Best Practices

1. **Run after each major feature** - Don't let knowledge accumulate
2. **Run at end of day** - Capture while fresh
3. **Run before vacation** - Future you will thank you
4. **Keep docs concise** - Quality over quantity
5. **Use templates** - Consistency helps AI understand

---

## ⚠️ NEXT STEPS:
- All saved → Close for the day
- Need to continue → Start fresh tomorrow with `/recap`
- Preparing release → `/deploy`
