---
description: 🏗️ RE iOS Phase 2 — Data Layer, Utils, UI, SDK Integration & Parity Check
parent: reverse-ios
---

# /re-ios-build — Build & Verify

> **Parent:** [`/reverse-ios`](reverse-ios.md) → Step 2-6
> **Prerequisite:** Hoàn thành [`/re-ios-scan`](reverse-ios-scan.md)
> **Skill:** `smali-to-swift` | **ObjC Guide:** `skills/smali-to-swift/objc-reading-guide.md`

---

## 💾 Step 2: Data Layer Reconstruction

> **Input:** Class-dump headers cho network, models, storage

### 2.1: Models (ObjC → Swift Codable)

```objc
// From class-dump
@interface UserModel : NSObject
@property (nonatomic, copy) NSString *userId;
@property (nonatomic, copy) NSString *fullName;
@end
```

```swift
struct User: Codable, Identifiable, Sendable {
    let id: String
    let fullName: String
    enum CodingKeys: String, CodingKey {
        case id = "user_id"
        case fullName = "full_name"
    }
}
```

### 2.2: API Client (URLSession async/await)

```swift
actor APIClient {
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              (200...299).contains(http.statusCode) else {
            throw APIError.invalidResponse
        }
        return try decoder.decode(T.self, from: data)
    }
}
```

### 2.3: SwiftData (nếu app dùng Core Data / SQLite)

- `@Model` classes thay Core Data entities
- `@Attribute(.unique)` cho primary keys
- `ModelContext` cho CRUD operations

### 2.4: Repository Pattern

- Protocol: `protocol UserRepository: Sendable`
- Implementation: offline-first (local → remote → cache)

### ✅ Checkpoint Step 2

---

## 🧮 Step 3: Core Logic & Utils

> **CRITICAL:** Crypto output MUST match original

### 3.1: Crypto utils → Swift

```swift
import CryptoKit
import CommonCrypto

enum CryptoUtils {
    static func md5(_ input: String) -> String {
        let data = Data(input.utf8)
        var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
        data.withUnsafeBytes { CC_MD5($0.baseAddress, CC_LONG(data.count), &digest) }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
    static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8))
            .compactMap { String(format: "%02x", $0) }.joined()
    }
}
```

### 3.2: XCTest verification (BẮT BUỘC cho crypto)

```swift
final class CryptoUtilsTests: XCTestCase {
    func testMD5MatchesOriginal() {
        XCTAssertEqual(CryptoUtils.md5("test"), "098f6bcd4621d373cade4e832627b4f6")
    }
}
```

### ✅ Checkpoint Step 3

---

## 🎨 Step 4: UI & ViewModel (Per Screen — Loop)

> **Input:** Storyboard + VC headers + disassembly
> **Lặp lại** cho MỌI screen từ Step 1

### 4.0: Thứ tự ưu tiên

1. LaunchScreen → 2. Auth → 3. Main TabView → 4. Detail → 5. Settings

### 4.1: Resource extraction (on-demand only)

Images, colors, strings, fonts — chỉ cho screen hiện tại.

### 4.2: UIKit → SwiftUI

```swift
struct LoginScreen: View {
    @State private var viewModel: LoginViewModel
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    TextField("Email", text: $viewModel.email)
                    SecureField("Password", text: $viewModel.password)
                    Button("Login") { Task { await viewModel.login() } }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.isLoading)
                }
                .padding()
            }
            .overlay { if viewModel.isLoading { ProgressView() } }
            .alert("Error", isPresented: $viewModel.showError) { Button("OK") {} }
                message: { Text(viewModel.errorMessage) }
        }
    }
}
```

### 4.3: @Observable ViewModel

```swift
@Observable
final class LoginViewModel {
    var email = "", password = ""
    var isLoading = false, showError = false, errorMessage = ""
    
    private let authRepository: AuthRepository
    
    func login() async {
        isLoading = true
        defer { isLoading = false }
        do { try await authRepository.login(email: email, password: password) }
        catch { errorMessage = error.localizedDescription; showError = true }
    }
}
```

### ✅ Checkpoint Step 4 (Per Screen)

> **Loop:** Lặp 4.0 cho screen tiếp. Hết screen → Step 5.

---

## 📦 Step 5: SDK & Native Library Integration

### 5.1: App entry point

```swift
@main
struct MyApp: App {
    @UIApplicationDelegateAdaptor private var appDelegate: AppDelegate
    var body: some Scene {
        WindowGroup { ContentView() }
            .modelContainer(for: [UserEntity.self])
    }
}
```

### 5.2: AppDelegate (Firebase, Push)

```swift
class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ app: UIApplication,
                     didFinishLaunchingWithOptions opt: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure(); return true
    }
}
```

### 5.3: Native C/C++ → Bridging Header

```c
// App-Bridging-Header.h
#include "native_lib.h"
```

### ✅ Checkpoint Step 5

---

## ✅ Step 6: Parity Check & Quality Gate

### 6.1: Edge Case checklist

```markdown
- [ ] Login empty/invalid input
- [ ] Network offline → cached data?
- [ ] App background during API call
- [ ] Deep link handling
- [ ] Push notification → correct screen
```

### 6.2: Build & Test

```bash
xcodebuild -scheme App -destination 'generic/platform=iOS' build
xcodebuild -scheme App -destination 'platform=iOS Simulator,name=iPhone 16' test
swiftlint lint
```

### 🎉 Final Summary

```markdown
## Complete!
- Screens: [count] | Frameworks reused: [count] | Replaced: [count]

⏭️ Next: /test → /deploy → /code-janitor
```

---

## 🔗 Related

- **Parent:** [`/reverse-ios`](reverse-ios.md)
- **Previous:** [`/re-ios-scan`](reverse-ios-scan.md) (Step 0-1)
- **ObjC Guide:** `skills/smali-to-swift/objc-reading-guide.md`

---

*re-ios-build v2.0.0 — Phase 2: Build & Verify*
