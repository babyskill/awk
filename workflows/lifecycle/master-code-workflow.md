---
description: Quy trình thiết kế tính năng toàn diện từ kiến trúc đến triển khai chi tiết.
---

# /master-code-workflow - Feature Design Pipeline

> **Antigravity Lead Architect** - Master workflow for complete feature development

**Mission:** Production-ready features with comprehensive specs, clean architecture, and premium UI/UX.

---

## 🎯 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  FEATURE DESIGN PIPELINE                    │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: PROJECT STEERING (1x per project)                │
│  └── product.md → structure.md → tech.md                   │
│                          ↓                                  │
│  Phase 2: CLEAN ARCHITECTURE                               │
│  └── Domain → Data → Presentation layers                   │
│                          ↓                                  │
│  Phase 3: FEATURE SPECS                       │
│  └── requirements.md → design.md → bd tasks                │
│                          ↓                                  │
│  Phase 4: UI/UX DESIGN                                     │
│  └── Design analysis + Platform guidelines                 │
│                          ↓                                  │
│  Phase 5: IMPLEMENTATION                                   │
│  └── Code → Tests → Security → Localization               │
│                          ↓                                  │
│  Phase 6: QUALITY ASSURANCE                                │
│  └── Review → Polish → Documentation                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Prerequisites

### 0.1. Check Project Identity
// turbo
```bash
[ -f ".project-identity" ] && echo "✅ Found" || echo "❌ Missing"
```

**If missing**: Run `/init` workflow first.

### 0.2. Detect Platform
Read `.project-identity` to detect:
- **iOS**: Swift/SwiftUI → Apple HIG
- **Android**: Kotlin/Compose → Material Design 3
- **Expo**: TypeScript/React Native → Platform-adaptive
- **Web**: React/Vue/Next.js → Modern web patterns

### 0.3. Check Steering Docs
// turbo
```bash
[ -d "docs/steering" ] && echo "✅ Exists" || echo "❌ Missing"
```

---

## Phase 1: Project Steering (One-time)

> **Skip if `docs/steering/` exists and is complete.**

### 1.1. Create Steering Directory
// turbo
```bash
mkdir -p docs/steering
```

### 1.2. Create Steering Documents

**Required Files:**
- `docs/steering/product.md` - Product overview, mission, target users
- `docs/steering/structure.md` - Project structure, naming conventions
- `docs/steering/tech.md` - Tech stack, build commands, conventions

**Templates:** See `templates/specs/steering-*.md` for detailed templates.

**Content Guidelines:**
- **product.md**: Target users, key features, design philosophy, business model
- **structure.md**: Directory structure, file naming, architecture patterns
- **tech.md**: Build system, tech stack, common commands, code style

---

## Phase 2: Clean Architecture Setup

### 2.1. Create Feature Directory Structure

Based on platform:

**iOS (Swift/SwiftUI):**
```bash
mkdir -p Features/[FeatureName]/{Views,ViewModels,Models,Services,Tests}
```

**Android (Kotlin/Compose):**
```bash
mkdir -p app/src/main/java/com/[package]/features/[featurename]/{ui,viewmodel,model,repository}
```

**Expo (TypeScript):**
```bash
mkdir -p src/features/[featurename]/{screens,hooks,components,types}
```

### 2.2. Architecture Compliance Checklist
- [ ] Domain layer has no UI/Framework dependencies
- [ ] Data layer implements Domain interfaces
- [ ] Presentation layer depends on Domain only
- [ ] Proper separation of concerns

---

## Phase 3: Feature Specs (Kiro-style)

### 3.1. Create Feature Specs Directory
// turbo
```bash
mkdir -p docs/specs/[feature-name]
```

### 3.2. Generate Spec Documents

**Required Files:**
1. `requirements.md` - User stories & acceptance criteria
2. `design.md` - Technical design & architecture

**Templates Location:**
- `templates/specs/requirements-template.md`
- `templates/specs/design-template.md`
- `templates/specs/tasks-template.md`

**Generation Process:**
1. Copy templates to `docs/specs/[feature-name]/`
2. Fill in feature-specific details
3. Ensure traceability: tasks → design → requirements

### 3.3. Spec Quality Checklist
- [ ] All requirements have acceptance criteria
- [ ] Design includes component hierarchy
- [ ] Data models are fully defined
- [ ] Tasks reference specific requirements
- [ ] Correctness properties defined
- [ ] UI/UX specifications complete

---

## Phase 4: UI/UX Design

### 4.1. Design Source Analysis

**If design file provided:**
- Analyze layout, components, interactions
- Extract color palette, typography, spacing
- Document animations and transitions

**If no design file:**
- Follow platform guidelines (HIG/Material Design)
- Use design system tokens
- Ensure accessibility compliance

### 4.2. Platform-Specific Adaptations

**iOS:**
- SF Symbols for icons
- NavigationStack for navigation
- .ultraThinMaterial for glass effects
- Haptic feedback on key actions

**Android:**
- Material Icons
- NavHost for navigation
- Material Design 3 surfaces
- Standard Android haptics

---

## Phase 5: Implementation

### 5.1. Recommended Approach

**Option A: Manual Implementation**
Use `/create-feature` for hands-on coding with spec guidance.

**Option B: Automated Implementation**
Use `/auto-implement [feature-name]` for spec-driven auto-coding.

### 5.2. Implementation Standards

**Must Include:**
- [ ] Input validation
- [ ] Error handling (try-catch)
- [ ] Security measures (auth, validation)
- [ ] Performance optimization (lazy loading, caching)
- [ ] Logging for important actions
- [ ] Localization (no hardcoded strings)
- [ ] Accessibility labels
- [ ] Unit tests (>80% coverage)

### 5.3. Progress Tracking

Update `bd` status as you complete each task:
```bash
bd close [id]
```

---

## Phase 6: Quality Assurance

### 6.1. Code Review Checklist
- [ ] All requirements validated
- [ ] Build passes without errors
- [ ] No hardcoded strings
- [ ] Accessibility implemented
- [ ] Security measures in place
- [ ] Tests written and passing
- [ ] Performance acceptable

### 6.2. Final Validation
- [ ] Test on multiple device sizes
- [ ] Verify offline functionality
- [ ] Check error recovery scenarios
- [ ] Validate all user flows

---

## Workflow Integration

### Related Workflows

**Design Phase:**
- `/design-feature` - Create specs only (no code)

**Implementation Phase:**
- `/auto-implement` - Auto-execute from specs
- `/create-feature` - Manual implementation with guidance

**Quality Phase:**
- `/code-review` - Pre-push review
- `/self-healing-test` - Auto-fix failing tests

---

## Usage Examples

### Complete New Feature
```
1. /master-code-workflow
   → Creates steering docs (if needed)
   → Creates feature specs
   → Guides through implementation

2. /auto-implement [feature-name]
   → Auto-executes tasks from specs
```

### Specs Only (Design First)
```
1. /design-feature
   → Creates requirements.md, design.md

2. Review and refine specs manually

3. /auto-implement [feature-name]
   → Auto-executes when ready
```

---

## Success Criteria

✅ **Complete Documentation:**
- Steering docs (product, structure, tech)
- Feature specs (requirements, design, tasks)

✅ **Clean Architecture:**
- Proper layer separation
- Clear dependencies
- Testable code

✅ **Production Quality:**
- All tests passing
- Security validated
- Accessibility compliant
- Performance optimized

---

**Next Steps After Completion:**
- `/run` - Test on device
- `/code-review` - Pre-merge review
- `/save-brain` - Document decisions