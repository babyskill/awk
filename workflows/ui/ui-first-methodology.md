---
description: Thiết kế UI đầy đủ trước tiên
alwaysApply: false
category: workflow
priority: medium
triggers:
  - "keywords: ui, design, interface, user experience"
  - "context: new project, frontend development"
  - "file_patterns: *.ui, *.design, *.mockup"
version: 1.0.0
track:
  - quick
  - method
  - enterprise
---

# UI First Methodology Workflow

## UI First Philosophy

**Core Principle**: Design and implement all user interfaces first, then build supporting backend logic  
**Purpose**: Ensure every feature is testable and user-validated before complex logic implementation  
**Benefit**: Reduce development risk, improve UX consistency, enable early user feedback

### Key Benefits

- **Early Validation**: Test user flows before investing in complex backend logic
- **Better UX**: Focus on user experience from the beginning
- **Reduced Risk**: Identify usability issues before heavy development
- **Faster Iteration**: UI changes are typically faster than backend refactoring
- **Complete Coverage**: Ensure every feature has a corresponding user interface

## UI First Implementation Rules

### Mandatory UI Coverage

**Screen Coverage Requirements**:
- ✅ Every CRUD operation MUST have dedicated UI screen
- ✅ All user stories MUST map to specific UI interactions
- ✅ Navigation between all features MUST be implemented
- ✅ Error states and loading states MUST have UI representation

**Validation Checkpoints**:
- [ ] Can user access all features through UI?
- [ ] Are all CRUD operations testable via interface?
- [ ] Do all user flows have complete screen sequences?
- [ ] Are error scenarios handled with appropriate UI feedback?

### UI Implementation Standards

**Component Structure**:
- Reusable UI components for consistent design
- Proper state management for user interactions
- Responsive design for multiple screen sizes
- Accessibility considerations for all users

**Navigation Patterns**:
- Clear navigation hierarchy
- Consistent back/forward behavior
- Breadcrumb or progress indicators where appropriate
- Deep linking support for web applications

### CRUD UI Requirements

**Create Operations**:
- Form-based input with validation
- Clear success/error feedback
- Cancel and save options
- Input validation with helpful messages

**Read Operations**:
- List views with search and filtering
- Detail views with comprehensive information
- Pagination for large datasets
- Empty states with helpful guidance

**Update Operations**:
- Inline editing where appropriate
- Form-based editing for complex data
- Clear save/cancel actions
- Change confirmation for destructive actions

**Delete Operations**:
- Confirmation dialogs for destructive actions
- Soft delete with restore options
- Bulk delete operations with confirmation
- Clear feedback on deletion results

## UI Design Standards

### Visual Consistency

**Design System**:
- Consistent color palette across all screens
- Typography hierarchy and spacing
- Icon library with consistent style
- Component library for reusable elements

**Layout Standards**:
- Grid system for consistent spacing
- Responsive breakpoints for different screen sizes
- Consistent header and navigation patterns
- Footer and branding consistency

### Responsive Design

**Mobile-First Approach**:
- Design for mobile screens first
- Progressive enhancement for larger screens
- Touch-friendly interface elements
- Optimized for mobile performance

**Breakpoint Strategy**:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+
- Large Desktop: 1440px+

### Accessibility Design

**WCAG 2.1 AA Compliance**:
- Color contrast ratios meet standards
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators for interactive elements

**Inclusive Design**:
- Alternative text for images
- Captions for video content
- High contrast mode support
- Font size adjustment options

## User Flow Design

### Primary User Flows

**Onboarding Flow**:
- Welcome screen with app introduction
- Account creation or login
- Feature tour or tutorial
- Initial setup and preferences

**Core Feature Flows**:
- Main feature access and usage
- Data input and management
- Search and discovery
- Settings and preferences

### Secondary User Flows

**Error Recovery Flows**:
- Network error handling
- Validation error recovery
- Session timeout handling
- Data sync conflict resolution

**Advanced Feature Flows**:
- Power user features
- Administrative functions
- Integration with external services
- Data export and import

## UI State Management

### Loading States

**Skeleton Screens**:
- Show content structure while loading
- Maintain layout stability
- Provide visual feedback
- Reduce perceived loading time

**Progress Indicators**:
- Show progress for long operations
- Provide estimated completion time
- Allow cancellation where appropriate
- Clear success/failure feedback

### Error States

**Error Handling**:
- Clear error messages
- Suggested recovery actions
- Fallback options
- Contact support information

**Empty States**:
- Helpful empty state messages
- Call-to-action buttons
- Onboarding guidance
- Feature discovery hints

### Success States

**Success Feedback**:
- Clear success confirmation
- Next action suggestions
- Progress indicators
- Celebration animations (when appropriate)

## Implementation Guidelines

### UI Development Priority

1. **UI Implementation Tasks** (Priority 1)
   - Screen layouts and components
   - Navigation and routing
   - User interaction handlers
   - Form validation and feedback

2. **Integration Tasks** (Priority 2)
   - API integration with UI
   - Data binding and state management
   - Error handling in UI context

3. **Backend Logic Tasks** (Priority 3)
   - Business logic implementation
   - Database operations
   - Background processing

### Platform-Specific Considerations

**Mobile Applications**:
- Touch gesture support
- Platform-specific navigation patterns
- Performance optimization for mobile
- Offline functionality

**Web Applications**:
- Cross-browser compatibility
- SEO optimization
- Progressive Web App features
- Desktop interaction patterns

**Desktop Applications**:
- Keyboard shortcuts
- Menu systems
- Window management
- System integration

## Quality Assurance

### UI Testing Strategy

**Visual Testing**:
- Screenshot comparison testing
- Cross-browser visual validation
- Responsive design testing
- Accessibility testing

**Interaction Testing**:
- User flow testing
- Form validation testing
- Navigation testing
- Error handling testing

**Performance Testing**:
- Loading time optimization
- Animation performance
- Memory usage monitoring
- Battery impact (mobile)

### Success Metrics

**UI Completion Metrics**:
- Screen coverage percentage
- User flow completion rate
- Feature accessibility through UI
- CRUD operation UI coverage

**Quality Metrics**:
- Design consistency score
- Accessibility compliance
- Performance benchmarks
- User satisfaction ratings

---

**Success Criteria**: Complete UI coverage for all features, consistent design system, accessible interfaces, and smooth user flows.
