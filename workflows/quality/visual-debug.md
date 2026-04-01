---
description: Phân tích ảnh chụp màn hình để xác định và sửa lỗi giao diện hoặc hiển thị.
safe_auto_run: false
---

# Visual Debug Workflow

Turn a screenshot into actionable UI improvements — both technical bugs AND design quality issues.

> **Mindset**: You are a Senior UI/UX Designer doing a heuristic review, NOT just a developer looking for crashes. Every screen must meet premium app standards.

## 1. Visual Analysis (Dual-Lens)

**Trigger**: User uploads a screenshot.

### Lens A — Technical Bug Scan
1. **Identify Screen**: Name the screen/feature shown.
2. **Spot Technical Anomalies**:
   - Broken layout, text overflow, clipped content
   - Wrong colors, missing assets, placeholder data still visible
   - Error messages, loading spinners stuck, empty states missing

### Lens B — UI/UX Designer Review (CRITICAL)
Run through these **7 checkpoints** on EVERY image. For each checkpoint, produce a finding or explicitly say "OK".

| # | Checkpoint | What to look for |
|---|-----------|-----------------|
| 1 | **Information Completeness** | Are all required data fields present? Missing inputs that the feature logically needs? (e.g., a "Add Medicine" form without dosage field) |
| 2 | **Naming & Copy Consistency** | Do button labels, titles, and section headers match the screen's purpose? Any contradictions? (e.g., screen title says "Add X" but button says "Save Y") |
| 3 | **Visual Hierarchy** | Is it clear what's most important? Do headings, font sizes, and colors guide the eye correctly? |
| 4 | **Spacing & Layout Balance** | Large empty gaps? Content crammed? Proper padding and margins? Consistent spacing rhythm? |
| 5 | **Component State Clarity** | Can the user tell which items are selected, disabled, required, or interactive? Are disabled buttons explained? |
| 6 | **Navigation Consistency** | Does the tab bar / nav bar state match the current screen? Are back buttons and breadcrumbs correct? |
| 7 | **Interaction Completeness** | Are there enough options in selection groups? Missing common choices? Proper validation hints for required fields? |

### Output Format
```
## Visual Analysis Report

### 🐛 Technical Issues
- [list or "None found"]

### 🎨 Design Issues
| # | Checkpoint | Status | Finding |
|---|-----------|--------|---------|
| 1 | Info Completeness | ⚠️ | Missing dosage input field |
| 2 | Naming Consistency | ⚠️ | Button "Save X" contradicts title "Add Y" |
| 3 | Visual Hierarchy | ✅ | OK |
| ... | ... | ... | ... |

### 📋 Priority Actions
1. [Critical] ...
2. [Important] ...
3. [Nice-to-have] ...
```

## 2. Code Mapping
1. **Locate Component**: Based on text, screen title, or visual structure, find the source file.
2. **Verify Context**: Read the file to understand the current implementation.
3. **Cross-Reference Design Spec**: If a design doc or spec exists (`.kiro/specs/`, `docs/specs/`), compare the implementation against it.

## 3. Diagnosis

### For Technical Bugs
1. **Hypothesize** root cause:
   - *Logic Error*: State variable is wrong?
   - *Style Error*: Padding/Margin/Flex issue?
   - *Data Error*: Null or undefined data?
2. **Confirm**: Correlate code logic with the visual bug.

### For Design Issues
1. **Classify Severity**:
   - 🔴 **Critical**: Missing data/functionality that blocks user goals (e.g., no dosage field in medicine form)
   - 🟡 **Important**: UX friction or inconsistency that confuses users (e.g., mismatched button label)
   - 🟢 **Nice-to-have**: Polish and refinement (e.g., better spacing, shadow depth)
2. **Propose Design Fix**: Describe the ideal state with specific UI recommendations.

## 4. Remediation
1. **Present Report**: Show the analysis table with all findings to the user.
2. **Prioritize**: Ask user which issues to fix now vs. later.
3. **Apply Fixes**: Edit code for approved items.
   - Technical bugs → direct code fix
   - Design issues → may require new UI components, layout changes, or copy updates

## 5. Verification
1. Ask user to rebuild or preview.
2. Re-run the 7 checkpoints on the updated screenshot if provided.
3. Confirm all critical and important issues are resolved.
