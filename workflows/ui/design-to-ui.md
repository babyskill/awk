---
description: 🎨 Phân tích ảnh thiết kế & tạo code UI
alwaysApply: false
category: workflow
priority: medium
---
triggers:
  - "keywords: design analysis, image analysis, ui evaluation"
  - "file_patterns: *.png, *.jpg, *.design, *.mockup"
  - "context: design review, implementation planning"
version: 1.0.0
track:
  - quick
  - method
  - enterprise
---

# Design to Prompt Analysis Workflow

## Nguyên Tắc Cơ Bản

### Phân Tích Chi Tiết và Có Cấu Trúc

- **_BẮT BUỘC_** phân tích từng pixel và chi tiết trong hình ảnh
- **_BẮT BUỘC_** trích xuất tất cả tính năng có thể nhìn thấy
- **_BẮT BUỘC_** kết nối các tính năng với nhau để tạo thành hệ thống hoàn chỉnh
- **_BẮT BUỘC_** xác định tiềm năng AI và automation cho từng tính năng
- **_BẮT BUỘC_** phân tích marketing và monetization potential

### Quy Trình Phân Tích 4 Bước

#### Bước 1: Trích xuất Tính năng (Feature Extraction)

**Mục tiêu**: Liệt kê tất cả tính năng có thể nhìn thấy trong hình ảnh

**Quy trình**:
1. **Phân tích Layout**: Xác định cấu trúc màn hình và các vùng chức năng
2. **Liệt kê UI Elements**: Buttons, forms, lists, cards, navigation elements
3. **Xác định Data Points**: Text, numbers, images, icons có trong giao diện
4. **Phân tích Interactions**: Swipe, tap, scroll, input patterns
5. **Ghi nhận States**: Loading, empty, error, success states

**Output Format**:
```markdown
## Tính năng được trích xuất

### Màn hình chính
- [Tính năng 1]: Mô tả chi tiết
- [Tính năng 2]: Mô tả chi tiết
- [Tính năng 3]: Mô tả chi tiết

### Màn hình phụ
- [Tính năng 4]: Mô tả chi tiết
- [Tính năng 5]: Mô tả chi tiết
```

#### Bước 2: Phân tích Chuyên sâu Tính năng (Feature Deep Dive)

**Mục tiêu**: Phân tích chi tiết từng tính năng về mặt kỹ thuật và business logic

**Quy trình**:
1. **Technical Analysis**: Database schema, API endpoints, algorithms
2. **Business Logic**: Rules, validations, calculations
3. **User Experience**: Flow, interactions, feedback
4. **Data Requirements**: Input, output, storage, processing
5. **Integration Points**: External services, third-party APIs

**Output Format**:
```markdown
## Phân tích chuyên sâu tính năng

### [Tên tính năng]
**Mục đích**: [Business purpose]
**Technical Requirements**:
- Database: [Schema requirements]
- API: [Endpoint specifications]
- Business Logic: [Rules and calculations]
- UI/UX: [Interaction patterns]

**Data Flow**:
1. [Step 1]: [Description]
2. [Step 2]: [Description]
3. [Step 3]: [Description]
```

#### Bước 3: Kết nối Tính năng (Feature Connection)

**Mục tiêu**: Tạo ra hệ thống hoàn chỉnh bằng cách kết nối các tính năng

**Quy trình**:
1. **Data Relationships**: Cách dữ liệu liên kết giữa các tính năng
2. **User Flow**: Journey người dùng qua các tính năng
3. **System Architecture**: Cách các tính năng tương tác với nhau
4. **Dependencies**: Tính năng nào phụ thuộc vào tính năng nào
5. **Integration Points**: Cách tích hợp với hệ thống bên ngoài

**Output Format**:
```markdown
## Kết nối tính năng

### User Journey
1. [Starting Point] → [Feature A] → [Feature B] → [End Point]

### Data Relationships
- [Feature A] provides data to [Feature B]
- [Feature B] updates data for [Feature C]
- [Feature C] triggers action in [Feature A]

### System Architecture
- Frontend: [UI components and interactions]
- Backend: [API endpoints and business logic]
- Database: [Data models and relationships]
- External: [Third-party integrations]
```

#### Bước 4: Tiềm năng AI (AI Potential)

**Mục tiêu**: Xác định cơ hội tích hợp AI và automation

**Quy trình**:
1. **Data Analysis**: Machine learning opportunities
2. **Automation**: Repetitive task automation
3. **Personalization**: User behavior analysis
4. **Prediction**: Forecasting and recommendations
5. **Natural Language**: Chat, voice, text processing

**Output Format**:
```markdown
## Tiềm năng AI

### Machine Learning Opportunities
- [Feature]: [ML use case and benefits]
- [Feature]: [ML use case and benefits]

### Automation Potential
- [Process]: [Automation opportunity]
- [Process]: [Automation opportunity]

### Personalization Features
- [Feature]: [Personalization approach]
- [Feature]: [Personalization approach]
```

## Marketing & Monetization Analysis

### Target Market Analysis

**Primary Users**:
- Demographics: Age, gender, income, location
- Psychographics: Interests, behaviors, values
- Pain Points: Problems the app solves
- Use Cases: How users will use the app

**Market Size**:
- Total Addressable Market (TAM)
- Serviceable Addressable Market (SAM)
- Serviceable Obtainable Market (SOM)

### Cost vs. Revenue Analysis

**Development Costs**:
- Development time and resources
- Third-party service costs
- Infrastructure and hosting costs
- Marketing and user acquisition costs

**Revenue Streams**:
- Subscription models
- Freemium with premium features
- In-app purchases
- Advertising revenue
- Data monetization (if applicable)

**Break-even Analysis**:
- Monthly recurring revenue targets
- Customer acquisition cost
- Lifetime value calculations
- Payback period estimates

### Target Users & Cross-sell Features

**User Segments**:
- Power users: Advanced features, premium subscriptions
- Casual users: Basic features, freemium model
- Business users: Team features, enterprise pricing

**Cross-sell Opportunities**:
- Related services or products
- Premium feature upgrades
- Additional user accounts
- Complementary apps or services

## Ví Dụ Phân Tích: Tính Năng "Thời tiết"

### Bước 1: Trích xuất Tính năng

```markdown
## Tính năng Thời tiết

### Màn hình chính
- Weather Display: Hiển thị nhiệt độ, độ ẩm, tình trạng thời tiết
- Location Selection: Chọn thành phố, GPS location
- Forecast Cards: Dự báo 7 ngày với icons và nhiệt độ
- Weather Map: Bản đồ thời tiết với overlays
- Settings: Cài đặt đơn vị (Celsius/Fahrenheit), notifications
```

### Bước 2: Phân tích Chuyên sâu

```markdown
## Phân tích tính năng Thời tiết

**Mục đích**: Cung cấp thông tin thời tiết chính xác và dự báo cho người dùng

**Technical Requirements**:
- Database: User preferences, location history, cached weather data
- API: Weather service integration (OpenWeatherMap, AccuWeather)
- Business Logic: Unit conversion, location validation, data caching
- UI/UX: Responsive cards, smooth animations, offline support

**Data Flow**:
1. User opens app → Check cached data → Show last known weather
2. Get current location → Fetch fresh weather data → Update UI
3. User selects new location → Validate location → Fetch weather → Update display
4. Background refresh → Update data → Send notifications if enabled
```

### Bước 3: Kết nối Tính năng

```markdown
## Kết nối với hệ thống

### User Journey
1. App Launch → Location Permission → Weather Display → Forecast View → Settings

### Data Relationships
- Location Service provides coordinates to Weather API
- Weather API provides data to Weather Display
- User Preferences affect data presentation
- Notification Service uses weather data for alerts

### System Architecture
- Frontend: React Native components, Redux state management
- Backend: Node.js API, Redis caching, PostgreSQL storage
- External: Weather API, Location services, Push notifications
```

### Bước 4: Tiềm năng AI

```markdown
## AI Opportunities

### Machine Learning
- Weather Prediction: Improve forecast accuracy with local data
- User Behavior: Predict when users check weather most
- Personalization: Customize weather alerts based on user patterns

### Automation
- Smart Notifications: Alert users about weather changes affecting their schedule
- Location Learning: Automatically detect frequently visited locations
- Weather Patterns: Learn user preferences for weather information display
```

## Implementation Guidelines

### Technical Documentation Generation

**Component Specifications**:
- Props and state requirements
- Event handlers and callbacks
- Styling and responsive behavior
- Accessibility considerations

**API Contract Specifications**:
- Endpoint definitions and parameters
- Request/response schemas
- Error handling and status codes
- Authentication and authorization

**Database Schema**:
- Entity relationships and constraints
- Indexing strategies
- Data validation rules
- Migration scripts

### Development Handoff

**Frontend Requirements**:
- UI component library specifications
- State management patterns
- Navigation and routing
- Performance optimization

**Backend Requirements**:
- API endpoint specifications
- Business logic implementation
- Database design and optimization
- Security and authentication

**Integration Requirements**:
- Third-party service integration
- Data synchronization patterns
- Error handling and recovery
- Monitoring and logging

---

**Success Criteria**: Complete feature analysis, technical specifications, AI opportunities identification, and implementation-ready documentation.
