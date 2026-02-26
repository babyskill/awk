---
description: ⚡ Phân tích & Tối ưu Performance
---

# WORKFLOW: /performance-audit - Performance Analysis & Optimization

Phân tích hiệu suất ứng dụng và đưa ra đề xuất tối ưu hóa.

---

## Khi nào cần audit?

- App chạy chậm
- Battery drain cao
- Memory leaks
- Trước khi release
- Sau khi thêm tính năng lớn

---

## Giai đoạn 1: Profiling

### iOS - Instruments

```bash
# 1. Build for Profiling
# Xcode → Product → Profile (⌘I)

# 2. Choose template:
# - Time Profiler: CPU usage
# - Allocations: Memory usage
# - Leaks: Memory leaks
# - Energy Log: Battery usage
```

**Key Metrics:**
- CPU usage < 50% average
- Memory < 200MB for simple apps
- Frame rate: 60 FPS (16.67ms per frame)
- Launch time < 400ms

### Android - Profiler

```bash
# Android Studio → View → Tool Windows → Profiler

# Or command line:
adb shell am profile start <package> /data/local/tmp/profile.trace
# ... use app ...
adb shell am profile stop <package>
adb pull /data/local/tmp/profile.trace
```

**Key Metrics:**
- CPU usage < 40% average
- Memory < 150MB for simple apps
- Frame time < 16ms (60 FPS)
- Startup time < 500ms

### React Native - Flipper

```bash
# Install Flipper
brew install --cask flipper

# Run with Flipper
npx react-native run-ios
# or
npx react-native run-android

# Open Flipper → Connect to app
```

---

## Giai đoạn 2: Identify Bottlenecks

### Common Issues

| Issue | Symptoms | Tools |
|-------|----------|-------|
| **Slow rendering** | Janky scrolling, low FPS | Time Profiler, GPU Profiler |
| **Memory leaks** | Increasing memory, crashes | Allocations, Leaks |
| **Heavy computations** | High CPU, battery drain | Time Profiler |
| **Large images** | Slow loading, high memory | Network profiler |
| **Inefficient queries** | Slow data loading | Database profiler |

---

## Giai đoạn 3: Optimization Strategies

### 3.1. Rendering Performance

**iOS (SwiftUI)**
```swift
// ❌ BAD: Re-renders entire list
ForEach(items) { item in
    HeavyView(item: item)
}

// ✅ GOOD: Use lazy loading
LazyVStack {
    ForEach(items) { item in
        HeavyView(item: item)
            .id(item.id) // Stable identity
    }
}
```

**Android (Compose)**
```kotlin
// ❌ BAD: Recomposition on every state change
@Composable
fun ItemList(items: List<Item>) {
    Column {
        items.forEach { item ->
            HeavyItem(item)
        }
    }
}

// ✅ GOOD: Use LazyColumn with keys
@Composable
fun ItemList(items: List<Item>) {
    LazyColumn {
        items(items, key = { it.id }) { item ->
            HeavyItem(item)
        }
    }
}
```

**React Native**
```typescript
// ❌ BAD: FlatList without optimization
<FlatList
  data={items}
  renderItem={({ item }) => <HeavyComponent item={item} />}
/>

// ✅ GOOD: Optimized FlatList
<FlatList
  data={items}
  renderItem={({ item }) => <HeavyComponent item={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 3.2. Image Optimization

**iOS**
```swift
// Use appropriate image size
Image("photo")
    .resizable()
    .aspectRatio(contentMode: .fill)
    .frame(width: 100, height: 100)
    .clipped()

// Lazy loading
AsyncImage(url: URL(string: imageURL)) { image in
    image.resizable()
} placeholder: {
    ProgressView()
}
```

**Android**
```kotlin
// Use Coil for efficient image loading
AsyncImage(
    model = imageUrl,
    contentDescription = null,
    modifier = Modifier.size(100.dp),
    contentScale = ContentScale.Crop
)
```

**React Native**
```typescript
// Use FastImage
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  style={{ width: 100, height: 100 }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 3.3. Memory Management

**iOS**
```swift
// Use weak references to avoid retain cycles
class ViewModel: ObservableObject {
    private var cancellables = Set<AnyCancellable>()
    
    func fetchData() {
        apiService.getData()
            .sink { [weak self] data in
                self?.updateUI(data)
            }
            .store(in: &cancellables)
    }
}
```

**Android**
```kotlin
// Use lifecycle-aware components
class MyViewModel : ViewModel() {
    private val _data = MutableLiveData<Data>()
    val data: LiveData<Data> = _data
    
    override fun onCleared() {
        // Clean up resources
        super.onCleared()
    }
}
```

### 3.4. Database Optimization

**iOS (SwiftData)**
```swift
// Use indexes
@Model
class User {
    @Attribute(.unique) var id: UUID
    @Attribute(.indexed) var email: String // Index for faster queries
    var name: String
}

// Batch operations
let users = try context.fetch(FetchDescriptor<User>())
context.delete(users) // Batch delete
```

**Android (Room)**
```kotlin
@Entity(indices = [Index(value = ["email"], unique = true)])
data class User(
    @PrimaryKey val id: String,
    val email: String,
    val name: String
)

// Use transactions for batch operations
@Transaction
suspend fun updateUsers(users: List<User>) {
    users.forEach { userDao.update(it) }
}
```

---

## Giai đoạn 4: Measure Improvements

### Before/After Comparison

```markdown
## Performance Audit Report

### Metrics Before Optimization
- App launch: 800ms
- Memory usage: 250MB
- FPS: 45 average
- CPU usage: 65%

### Optimizations Applied
1. Implemented lazy loading for lists
2. Optimized image loading with caching
3. Fixed memory leaks in ViewModels
4. Added database indexes

### Metrics After Optimization
- App launch: 400ms ✅ (50% improvement)
- Memory usage: 150MB ✅ (40% reduction)
- FPS: 58 average ✅ (29% improvement)
- CPU usage: 35% ✅ (46% reduction)

### Recommendations
- [ ] Monitor memory in production
- [ ] Add performance tests to CI
- [ ] Profile quarterly
```

---

## Giai đoạn 5: Continuous Monitoring

### Setup Analytics

```swift
// iOS - Track performance metrics
func trackPerformance() {
    let launchTime = Date().timeIntervalSince(appLaunchTime)
    Analytics.logEvent("app_launch_time", parameters: [
        "duration_ms": launchTime * 1000
    ])
}
```

```kotlin
// Android
class PerformanceMonitor {
    fun trackStartup() {
        val duration = SystemClock.elapsedRealtime() - startTime
        FirebasePerformance.getInstance()
            .newTrace("app_startup")
            .apply {
                putMetric("duration_ms", duration)
                start()
                stop()
            }
    }
}
```

---

## Checklist

- [ ] Profile with platform tools
- [ ] Identify top 3 bottlenecks
- [ ] Implement optimizations
- [ ] Measure improvements
- [ ] Setup continuous monitoring
- [ ] Document findings
- [ ] Add performance tests

---

**Next Steps**: `/test` để verify optimizations không break functionality
