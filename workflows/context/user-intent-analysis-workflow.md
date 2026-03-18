---
description: Phân tích và suy luận ý định thực sự của người dùng trước khi hành động.
alwaysApply: true
---

# User Intent Analysis & Reasoning Workflow

## Nguyên Tắc Cốt Lõi

- **_BẮT BUỘC_** kiểm tra Symphony task trước khi phân tích bất kỳ yêu cầu coding nào
- **_BẮT BUỘC_** phân tích và suy luận ý định thực sự của người dùng
- **_BẮT BUỘC_** đề xuất giải pháp tối ưu thay vì chỉ làm theo nghĩa đen
- **_NGHIÊM CẤM_** bỏ qua Symphony check kể cả khi user nói “nhanh lên”, “làm luôn”

## ⛔ Pre-Analysis Symphony Gate (LUÔN LUÔN CHẠY TRƯỚC)

```bash
# Trước khi phân tích bất kỳ yêu cầu coding/debug/plan:
symphony_available_tasks(filter="my")

# Nếu có task → Confirm: “Đây có liên quan đến Task #X không?”
# Nếu không có → Tạo task mới sau khi confirm với user
```



## Trigger Conditions (Kích Hoạt)

Workflow này được kích hoạt cho TẤT CẢ yêu cầu của người dùng, bao gồm:

- Yêu cầu tạo/sửa code
- Yêu cầu debug/fix lỗi
- Yêu cầu thêm tính năng
- Yêu cầu tối ưu hóa
- Yêu cầu refactoring
- Yêu cầu giải thích/hướng dẫn
- Yêu cầu phân tích/review
- Bất kỳ yêu cầu nào khác

## Intent Analysis Process (Quy Trình Phân Tích Ý Định)

### Phase 1: Request Parsing & Context Gathering

```yaml
steps:
  1. parse_user_request:
    - extract_explicit_requirements: "Những gì người dùng nói rõ ràng"
    - identify_implicit_needs: "Những gì người dùng có thể cần nhưng chưa nói"
    - detect_emotional_context: "Mức độ cấp thiết, frustration, confusion"

  2. gather_project_context:
    - check_project_identity: "Loại dự án, tech stack, mục tiêu"
    - analyze_current_state: "Trạng thái hiện tại của codebase"
    - review_recent_changes: "Những thay đổi gần đây"
    - check_existing_plans: "Planning files, brainstorm documents"

  3. assess_user_expertise:
    - technical_level: "Beginner/Intermediate/Advanced"
    - domain_knowledge: "Hiểu biết về lĩnh vực cụ thể"
    - communication_style: "Formal/Casual, Vietnamese/English preference"
```

### Phase 2: Intent Classification & Analysis

```yaml
intent_categories:
  immediate_fix:
    description: "Sửa lỗi cấp thiết, unblock development"
    priority: "High"
    analysis_depth: "Quick but thorough"

  feature_development:
    description: "Thêm tính năng mới hoặc cải thiện existing"
    priority: "Medium"
    analysis_depth: "Comprehensive with suggestions"

  learning_exploration:
    description: "Hiểu cách hoạt động, học hỏi"
    priority: "Low"
    analysis_depth: "Educational with explanations"

  optimization_improvement:
    description: "Cải thiện performance, code quality"
    priority: "Medium"
    analysis_depth: "Detailed with alternatives"

  planning_strategy:
    description: "Lập kế hoạch, brainstorm, architecture"
    priority: "High"
    analysis_depth: "Strategic with long-term view"
```

### Phase 3: Root Cause & Goal Identification

```yaml
analysis_framework:
  what_user_said:
    - literal_request: "Yêu cầu đúng nghĩa đen"
    - specific_details: "Chi tiết cụ thể được đề cập"

  what_user_means:
    - underlying_problem: "Vấn đề thực sự cần giải quyết"
    - business_goal: "Mục tiêu kinh doanh/dự án"
    - technical_goal: "Mục tiêu kỹ thuật"

  what_user_needs:
    - immediate_solution: "Giải pháp ngay lập tức"
    - long_term_strategy: "Chiến lược dài hạn"
    - knowledge_transfer: "Kiến thức cần truyền đạt"
    - risk_mitigation: "Rủi ro cần tránh"
```

### Phase 4: Solution Strategy & Alternatives

```yaml
solution_generation:
  primary_solution:
    - direct_approach: "Giải pháp trực tiếp cho yêu cầu"
    - pros_cons: "Ưu nhược điểm"
    - implementation_effort: "Effort cần thiết"

  alternative_solutions:
    - better_approach: "Cách tiếp cận tốt hơn (nếu có)"
    - simpler_solution: "Giải pháp đơn giản hơn"
    - comprehensive_solution: "Giải pháp toàn diện hơn"

  recommendation:
    - suggested_approach: "Approach được đề xuất"
    - reasoning: "Lý do tại sao đề xuất này"
    - trade_offs: "Trade-offs cần cân nhắc"
```

## Reasoning Presentation Template

```markdown
## 🧠 Phân Tích Ý Định & Suy Luận

### 📝 Yêu Cầu Của Bạn

**Yêu cầu trực tiếp**: [Những gì user nói]
**Ngữ cảnh dự án**: [Project context]
**Mức độ ưu tiên**: [High/Medium/Low]

### 🎯 Ý Định Thực Sự (Phân Tích)

**Vấn đề cần giải quyết**: [Root problem]
**Mục tiêu cuối cùng**: [End goal]
**Tại sao cần làm**: [Business/technical justification]

### 💡 Phân Tích Giải Pháp

#### ✅ Giải Pháp Đề Xuất (Recommended)

- **Approach**: [Recommended solution]
- **Lý do**: [Why this is better]
- **Effort**: [Implementation effort]
- **Benefits**: [Key benefits]

#### 🔄 Các Lựa Chọn Khác

1. **[Alternative 1]**: [Description] - [Pros/Cons]
2. **[Alternative 2]**: [Description] - [Pros/Cons]

### ⚠️ Cân Nhắc Quan Trọng

- **Rủi ro**: [Potential risks]
- **Dependencies**: [What this depends on]
- **Impact**: [How this affects other parts]

### 🤔 Xác Nhận Hiểu Đúng

**Tôi hiểu bạn muốn**: [Summary of understanding]
**Approach tôi đề xuất**: [Recommended approach]
**Có đúng không?** [Request confirmation]

---

_Nếu tôi hiểu đúng, tôi sẽ tiến hành với approach được đề xuất. Nếu không, hãy cho tôi biết điều chỉnh!_
```

## Quality Assurance

### Analysis Quality Metrics

```yaml
quality_indicators:
  understanding_accuracy:
    - user_confirms_understanding: "User says 'yes, exactly'"
    - no_follow_up_corrections: "No need to re-explain"
    - solution_addresses_root_cause: "Solves the real problem"

  solution_effectiveness:
    - prevents_future_issues: "Addresses underlying problems"
    - aligns_with_project_goals: "Supports overall objectives"
    - considers_long_term_impact: "Sustainable solution"
```

## Implementation Guidelines

### For AI Assistant

1. **Always start with analysis** - Never jump straight to implementation
2. **Show your reasoning** - Make thought process transparent
3. **Seek confirmation** - Ensure understanding before proceeding
4. **Offer alternatives** - Present multiple approaches when applicable
5. **Consider context** - Factor in project state and user expertise
