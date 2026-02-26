---
description: Khởi tạo nhanh cấu trúc Clean Architecture cho các tính năng Swift, Kotlin hoặc Expo.
safe_auto_run: true
---

# /structure-clean-architect - Mobile Feature Scaffolder

> 💡 **Tip:** For complete feature design from scratch (architecture → specs → UI → implementation), use `/feature-design-pipeline` master workflow.

Generates complete file structure for a new feature based on `.project-identity` and platform.

---

## Phase 1: Input Parsing

**Trigger**: User says "Create feature [FeatureName]"

1. **Extract feature name** (e.g., "ProfileSettings", "Checkout")
2. **Read `.project-identity`** for:
   - Platform (iOS/Android/Expo)
   - Architecture (MVVM/TCA/MVI)
   - Language (Swift/Kotlin/TypeScript)

---

## Phase 2: iOS (Swift/SwiftUI) Scaffold

### MVVM Architecture
// turbo
Create directory structure:
```
Features/[FeatureName]/
├── Views/
│   └── [FeatureName]View.swift
├── ViewModels/
│   └── [FeatureName]ViewModel.swift
├── Models/
│   └── [FeatureName]Model.swift
├── Services/
│   └── [FeatureName]Service.swift
└── Tests/
    └── [FeatureName]ViewModelTests.swift
```

### File Templates

**[FeatureName]View.swift**
```swift
import SwiftUI

struct [FeatureName]View: View {
    @StateObject private var viewModel = [FeatureName]ViewModel()
    
    var body: some View {
        Text("Hello, [FeatureName]!")
    }
}

#Preview {
    [FeatureName]View()
}
```

**[FeatureName]ViewModel.swift**
```swift
import Foundation
import Combine

@MainActor
final class [FeatureName]ViewModel: ObservableObject {
    enum State {
        case idle
        case loading
        case loaded([FeatureName]Model)
        case error(Error)
    }
    
    @Published private(set) var state: State = .idle
    
    private let service: [FeatureName]Service
    
    init(service: [FeatureName]Service = [FeatureName]Service()) {
        self.service = service
    }
    
    func load() async {
        state = .loading
        // TODO: Implement loading logic
    }
}
```

**[FeatureName]Model.swift**
```swift
import Foundation

struct [FeatureName]Model: Codable, Identifiable {
    let id: String
    // TODO: Add properties
}
```

---

## Phase 3: Android (Kotlin/Compose) Scaffold

### MVVM Architecture
// turbo
Create directory structure:
```
features/[featurename]/
├── ui/
│   └── [FeatureName]Screen.kt
├── viewmodel/
│   └── [FeatureName]ViewModel.kt
├── model/
│   └── [FeatureName].kt
├── repository/
│   └── [FeatureName]Repository.kt
└── di/
    └── [FeatureName]Module.kt
```

### File Templates

**[FeatureName]Screen.kt**
```kotlin
package com.app.features.[featurename].ui

import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun [FeatureName]Screen(
    viewModel: [FeatureName]ViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    [FeatureName]Content(uiState = uiState)
}

@Composable
private fun [FeatureName]Content(uiState: [FeatureName]UiState) {
    Text("Hello, [FeatureName]!")
}
```

**[FeatureName]ViewModel.kt**
```kotlin
package com.app.features.[featurename].viewmodel

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

@HiltViewModel
class [FeatureName]ViewModel @Inject constructor(
    private val repository: [FeatureName]Repository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<[FeatureName]UiState>([FeatureName]UiState.Loading)
    val uiState: StateFlow<[FeatureName]UiState> = _uiState.asStateFlow()
}

sealed interface [FeatureName]UiState {
    data object Loading : [FeatureName]UiState
    data class Success(val data: [FeatureName]) : [FeatureName]UiState
    data class Error(val message: String) : [FeatureName]UiState
}
```

---

## Phase 4: Expo (TypeScript) Scaffold

// turbo
Create directory structure:
```
app/[featurename]/
├── index.tsx
├── [id].tsx (if detail needed)
components/[featurename]/
├── [FeatureName]Card.tsx
├── [FeatureName]List.tsx
hooks/
├── use[FeatureName].ts
services/
├── [featurename]Service.ts
types/
├── [featurename].ts
```

### File Templates

**app/[featurename]/index.tsx**
```typescript
import { View, Text } from 'react-native';
import { use[FeatureName] } from '@/hooks/use[FeatureName]';

export default function [FeatureName]Screen() {
  const { data, isLoading, error } = use[FeatureName]();
  
  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <View>
      <Text>Hello, [FeatureName]!</Text>
    </View>
  );
}
```

**hooks/use[FeatureName].ts**
```typescript
import { useQuery } from '@tanstack/react-query';
import { [featurename]Service } from '@/services/[featurename]Service';

export function use[FeatureName]() {
  return useQuery({
    queryKey: ['[featurename]'],
    queryFn: [featurename]Service.getAll,
  });
}
```

---

## Phase 5: Registration

### iOS
// turbo
- Add to Navigation/Router if using coordinator pattern
- Register in DI container if applicable

### Android
// turbo
- Add navigation route to NavGraph
- Register Hilt module if using DI

### Expo
// turbo
- Route auto-registered via file-based routing

---

## Phase 6: Summary

Return checklist:
- ✅ Created files: [list]
- 📝 TODOs to implement:
  - [ ] Add model properties
  - [ ] Implement service/repository
  - [ ] Connect to API
  - [ ] Add UI elements

**Optional**: Create feature specs?
- `docs/specs/[feature]/requirements.md`
- `docs/specs/[feature]/design.md`
- `docs/specs/[feature]/design.md`

Use `/feature-completion` to generate specs if needed.

---

## ⚠️ NEXT STEPS:
- Add UI → `/ui-review`
- Implement logic → `/feature-completion`
- Run app → `/run`
