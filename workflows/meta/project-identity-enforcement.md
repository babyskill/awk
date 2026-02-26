---
description: Tuân thủ định dạng và tiêu chuẩn dự án theo .project-identity.
---

# Project Identity Enforcement Workflow

## Overview

Workflow này đảm bảo rằng AI assistant luôn kiểm tra và tuân thủ thông tin trong `.project-identity` trước khi thực hiện bất kỳ nhiệm vụ nào.

## 🔴 MANDATORY RULES

### Pre-Task Identity Check

**BẮT BUỘC thực hiện trước mọi nhiệm vụ:**

1. **Read .project-identity file**
2. **Analyze project context**
3. **Load appropriate workflow rules**
4. **Apply project-specific constraints**

### Identity Check Protocol

#### Step 1: File Validation
```
IF .project-identity exists:
  → Proceed to Step 2
ELSE:
  → Create .project-identity template
  → Request user to fill required information
  → STOP until completed
```

#### Step 2: Context Analysis
**Extract and understand:**
- `projectType`: Determines platform-specific rules
- `projectStage`: Defines current workflow phase
- `mainLanguages`: Programming languages in use
- `mainFrameworks`: Technology stack
- `keyFeatures`: Core functionality
- `projectLifecycle`: Current stage requirements

#### Step 3: Workflow Rules Loading
**Load rules in this order:**
1. `coreRules.always_applied` (mandatory for all tasks)
2. `platformSpecificRules` based on `projectType`
3. Stage-specific rules from `projectLifecycle`
4. Integration rules if features are enabled

## Workflow Rules Mapping

### By Project Type

**Android Projects:**
```
Required Rules:
- .cursor/rules/android-workflow.mdc
- .cursor/rules/android-code-deduplication.mdc
- .cursor/rules/tdd-mobile-workflow.mdc
- .cursor/rules/mobile-utility-workflow.mdc
```

**iOS Projects:**
```
Required Rules:
- .cursor/rules/ios-workflow.mdc
- .cursor/rules/tdd-mobile-workflow.mdc
- .cursor/rules/mobile-utility-workflow.mdc
```

**Web Projects:**
```
Required Rules:
- .cursor/rules/frontend-rules.mdc
- .cursor/rules/backend-rules-optimized.mdc
- .cursor/rules/api-integration-rules.mdc
```

**Flutter Projects:**
```
Required Rules:
- .cursor/rules/mobile-utility-workflow.mdc
- .cursor/rules/tdd-mobile-workflow.mdc
```

### By Project Stage

**Stage 1 - Brainstorm:**
```
Required Rules:
- .cursor/rules/brainstorm-workflow.mdc
- .cursor/rules/brainstorm-detailed-workflow.mdc
Blocking: Cannot proceed to development without brainstorm completion
```

**Stage 2 - Setup:**
```
Required Rules:
- .cursor/rules/project-creation-workflow.mdc
- .cursor/rules/planning-workflow.mdc
- .cursor/rules/tech-stack-selection.mdc
```

**Stage 3 - Development:**
```
Required Rules:
- Platform-specific development rules
- .cursor/rules/development-rules.mdc
- .cursor/rules/tdd-guidelines.mdc
```

## Context7 Integration (Enhanced)

### Memory Check Requirements
**Before starting any task:**
1. **BẮT BUỘC**: Kích hoạt Context7 Auto-Check Workflow
2. **BẮT BUỘC**: Search Context7 for project-related memories
3. **BẮT BUỘC**: Resolve library IDs cho các tech stack components
4. **BẮT BUỘC**: Thu thập documentation và best practices
5. **BẮT BUỘC**: Apply lessons learned from similar projects
6. **BẮT BUỘC**: Check for existing solutions or patterns
7. **BẮT BUỘC**: Validate architecture choices với industry standards
8. **BẮT BUỘC**: Update memory with new insights
9. **MỚI**: Implement error handling cho Context7 failures
10. **MỚI**: Cache Context7 results để improve performance

## Enforcement Actions

### Blocking Conditions
**STOP execution if:**
- `.project-identity` is missing or incomplete
- Project stage requirements not met
- Required workflow rules not loaded
- Stage progression rules violated

### Warning Conditions
**Warn user if:**
- Project type doesn't match detected technology
- Stage seems inconsistent with project state
- Missing recommended integrations
- Outdated project information

### Auto-Update Triggers
**Automatically update `.project-identity` when:**
- New technologies are detected
- Project stage naturally progresses
- New features are implemented
- Integration status changes

## Error Handling

### Missing .project-identity
```
Action: Create template file
Message: "🚫 Project identity file missing. Creating template..."
Next: Request user to complete required fields
```

### Incomplete Information
```
Action: Identify missing fields
Message: "⚠️ Project identity incomplete. Missing: [fields]"
Next: Request specific information
```

### Stage Violation
```
Action: Block execution
Message: "🚫 Cannot skip project stages. Current: [stage], Required: [required]"
Next: Guide user to complete current stage
```

## Success Criteria

**Task can proceed when:**
- ✅ `.project-identity` exists and is complete
- ✅ All required workflow rules are loaded
- ✅ Project context is understood
- ✅ Stage requirements are validated
- ✅ No blocking conditions exist
