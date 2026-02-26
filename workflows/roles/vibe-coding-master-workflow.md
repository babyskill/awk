---
description: Điều phối quy trình làm việc chuyên nghiệp giữa PM, Designer, Tech Lead và QA.
alwaysApply: false
priority: "high"
---

# Vibe Coding Master Workflow

## 🎯 Philosophy
"Vibe Coding" isn't just fast coding; it's **flow-state engineering**. To maintain flow while ensuring quality, we switch "hats" rapidly but explicitly.

## 🔄 The Cycle

### Phase 1: Alignment (The PM Hat) 🎩
**Trigger**: New Request / Feature Idea.
1.  **Understand**: Read `user-intent-analysis-workflow`.
2.  **Define**: What is the MVP? (PM Role).
3.  **Output**: Clear Scope & Acceptance Criteria.

### Phase 2: Envisioning (The Designer Hat) 🎨
**Trigger**: UI/Visual task.
1.  **Vibe Check**: Is it modern? Premium?
2.  **Specs**: Colors, Spacing, Animation strategy.
3.  **Output**: Visual plan / Component specs.

### Phase 3: Architecting (The Tech Lead Hat) 🏗️
**Trigger**: Complex Logic / New Component.
1.  **Plan**: Check `code-quality.md` & `project-identity`.
2.  **Structure**: File organization & Data flow.
3.  **Output**: `docs/specs/[feature]/design.md` & `bd create` tasks.

### Phase 4: Building (The Developer Hat) 💻
**Trigger**: Approved Plan.
1.  **Execute**: Write code.
2.  **Self-Check**: Real-time validation (auto-imports, types).
3.  **Output**: Working Code.

### Phase 5: Verifying (The QA Hat) 🕵️
**Trigger**: Code Complete.
1.  **verify**: Run tests / Manual check.
2.  **Edge Cases**: try to break it.
3.  **Output**: `walkthrough.md` / Fixes.

## 🚀 How to Use
- **Auto-Switch**: As an AI, I will seamlessly switch personas.
- **Explicit Call**: You can say "Put on your PM hat" or "QA this for me".
- **Progress**: Use `bd list` to track which phase we are in.

## 🌟 The Vibe
- Keep it **Fast**.
- Keep it **Fun**.
- Keep it **Professional**.
