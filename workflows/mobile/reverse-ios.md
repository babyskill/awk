---
description: 🍎 Dịch ngược IPA iOS (class-dump, Hopper output) → App Swift hiện đại với SwiftUI, Clean Architecture, và Framework Scanner tự động.
skill: smali-to-swift
---

# /reverse-ios — iOS IPA Reverse Engineering Workflow

> **Skill được dùng:** `smali-to-swift`
> **Tech Stack:** Swift + SwiftUI + async/await + URLSession + SwiftData
> **Philosophy:** "Read ObjC headers to understand WHAT & WHY → Write Swift for HOW"
> **Sibling:** `/reverse-android` (cùng pipeline pattern, khác platform)

---

## ⚡ QUICK START

User cung cấp một trong các input sau:
- Decrypted `.app` bundle (từ frida-ios-dump / bagbak)
- Class-dump headers output
- Hopper/IDA pseudo-code
- Nói: "Tôi muốn reverse engineer IPA này"

Workflow dẫn dắt từng bước — **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup (Chạy 1 lần khi bắt đầu)

### Bước 0.1: Khởi tạo session state

```yaml
reverse_ios_session:
  project_name: "[TBD - lấy từ Info.plist]"
  app_bundle_dir: "[path user cung cấp]"
  headers_dir: "[path to class-dump output]"
  current_step: 0
  framework_report_done: false
  plist_analyzed: false
  completed_screens: []
  pending_screens: []
  decisions: []
```

### Bước 0.2: Xác nhận input và hướng dẫn chuẩn bị

```
🍎 iOS Reverse Engineering bắt đầu!

Em cần biết:
1. Decrypted .app bundle ở đâu? (vd: ~/decrypted/App.app/)
2. Đã chạy class-dump chưa? Headers ở đâu?
3. Tên app gốc? Bundle ID?

Nếu chưa chuẩn bị, đây là flow chuẩn bị:

# 1. Decrypt IPA (cần jailbroken device)
bagbak -o ~/decrypted/ com.example.app
# hoặc
frida-ios-dump -u com.example.app

# 2. Dump headers
class-dump -H ~/decrypted/App.app -o ~/headers/

# 3. (Optional) Disassembly — mở trong Hopper hoặc IDA
open -a Hopper ~/decrypted/App.app/App
```

---

## 📦 Step 0: Framework Scanner (BẮT BUỘC — Không được bỏ qua)

> **Mục tiêu:** Nhận diện toàn bộ frameworks trước khi code.
> **Reference:** `skills/smali-to-swift/framework-patterns.md`

### Bước 0.3: Quét IPA structure

```bash
# 1. Embedded frameworks
ls [app_bundle]/Frameworks/

# 2. Linked libraries (Mach-O)
otool -L [app_bundle]/App | grep -v /System | grep -v /usr/lib

# 3. Class-dump header imports
grep -rh "#import <" [headers_dir]/ | sort -u
grep -rh "@import " [headers_dir]/ | sort -u
grep -rh "import " [headers_dir]/ | grep -v Foundation | grep -v UIKit | sort -u

# 4. String search for SDK identifiers
strings [app_bundle]/App | grep -i "cocoapods\|carthage\|firebase\|facebook\|google"

# 5. Assets & resources
ls [app_bundle]/*.car 2>/dev/null          # Asset catalogs
ls [app_bundle]/*.momd 2>/dev/null         # Core Data models
ls [app_bundle]/*.storyboardc 2>/dev/null  # Storyboards
find [app_bundle] -name "*.json" -o -name "*.plist" | grep -v Info.plist | sort
```

### Bước 0.4: Tạo Framework Detection Report

Dùng patterns từ `framework-patterns.md`:

```markdown
## 📦 Framework Detection Report — [App Name]

### ✅ Reuse (Add via SPM)
| Framework | Detected | Latest Version | Notes |
|-----------|----------|----------------|-------|
| Kingfisher | Frameworks/Kingfisher.framework | 7.12.0 | Keep |
| [...]      | [...]    | [...]          | [...] |

### 🔄 Replace (Legacy → Modern Swift)
| Old Framework | Detected | Modern Replacement |
|---------------|----------|-------------------|
| AFNetworking | Frameworks/AFNetworking.framework | URLSession async/await |
| SDWebImage | header imports | AsyncImage + Kingfisher |
| SnapKit | header imports | SwiftUI layout |
| [...]        | [...]    | [...]             |

### 🍏 Apple Frameworks Used
| Framework | Purpose | SwiftUI Equivalent |
|-----------|---------|-------------------|
| MapKit | Maps | Map (SwiftUI) |
| CoreLocation | GPS | LocationManager wrapper |
| AVFoundation | Camera | Camera view wrapper |
| CoreData | Database | SwiftData migration |

### 📱 Native Libraries — investigate
| File | Notes |
|------|-------|
| libcustom.dylib | C library — need bridging header |

### 🏷️ App Code (Rewrite in Swift)
| Class Prefix / Pattern | Estimated Module |
|------------------------|-----------------|
| MYAppUser*, MYAppAuth* | Auth module |
| MYAppHome*, MYAppFeed* | Home/Feed module |

### ❓ Unknown (investigate)
| Framework | Notes |
|-----------|-------|
| CustomSDK.framework | Proprietary? |
```

### Bước 0.5: User approval

```
📦 Framework Report sẵn sàng!

Anh review:
✅ "Reuse" list — còn thiếu gì không?
🔄 "Replace" list — có cái nào anh muốn giữ?

Xác nhận xong → em bắt đầu Step 1.
```

> **GATE:** Không tiếp tục khi chưa có user approval.

---

## 📄 Step 1: Info.plist & Entitlements Analysis + Project Bootstrap

> **Input:** `[app_bundle]/Info.plist` + entitlements

### Bước 1.1: Đọc Info.plist

```bash
# Read Info.plist (may be binary format)
plutil -p [app_bundle]/Info.plist

# Entitlements
codesign -d --entitlements :- [app_bundle]/App 2>/dev/null
# hoặc
jtool2 --ent [app_bundle]/App
```

Trích xuất:
```yaml
extract:
  - bundle_id: "com.example.app"
  - display_name: "My App"
  - min_ios_version: "15.0"
  - permissions:
      camera: "NSCameraUsageDescription → [description]"
      photos: "NSPhotoLibraryUsageDescription → [description]"
      location: "NSLocationWhenInUseUsageDescription → [description]"
      microphone: "NSMicrophoneUsageDescription → [description]"
      notifications: "aps-environment → [production/development]"
      tracking: "NSUserTrackingUsageDescription → [description]"
  - url_schemes: ["myapp://"]
  - universal_links: ["applinks:example.com"]
  - capabilities:
      push_notifications: true/false
      apple_pay: true/false
      sign_in_with_apple: true/false
      app_groups: ["group.com.example.app"]
  - supported_orientations: [portrait, landscape]
```

### Bước 1.2: Phân tích class hierarchy

Từ class-dump headers, xác định:
```bash
# Find all ViewControllers
grep -rl "UIViewController" [headers_dir]/ | sort

# Find AppDelegate
grep -rl "UIApplicationDelegate" [headers_dir]/

# Find tab bar structure
grep -rl "UITabBarController" [headers_dir]/

# Find navigation controllers
grep -rl "UINavigationController" [headers_dir]/
```

Mapping ViewControllers → SwiftUI Screens:
```
SplashViewController    → LaunchScreen (or SplashScreen.swift)
LoginViewController     → Auth/LoginScreen.swift
MainTabBarController    → TabView in ContentView.swift
HomeViewController      → Screens/Home/HomeScreen.swift
ProfileViewController   → Screens/Profile/ProfileScreen.swift
SettingsTableViewController → Screens/Settings/SettingsScreen.swift
DetailViewController    → Screens/Detail/DetailScreen.swift
```

### Bước 1.3: Tạo Xcode project structure

Đề xuất structure (xem template trong SKILL.md Step 1).

### Bước 1.4: Package.swift setup (hoặc SPM via Xcode)

```swift
// Dependencies từ Framework Report
// Add via Xcode: File → Add Package Dependencies

// Firebase
"https://github.com/firebase/firebase-ios-sdk" // 11.0+
// Kingfisher (image loading)
"https://github.com/onevcat/Kingfisher" // 7.12+
// KeychainAccess
"https://github.com/kishikawakatsumi/KeychainAccess" // 4.2+
// Lottie
"https://github.com/airbnb/lottie-ios" // 4.4+
```

### ✅ Checkpoint Step 1

```markdown
## ✅ Step 1 Complete: Info.plist & Bootstrap

### Extracted:
- Bundle ID: [bundle_id]
- Permissions: [count] total
- Screens to rebuild: [list from VCs]
- URL Schemes: [list]

### Created:
- Xcode project structure proposal
- SPM dependency list

### ⏭️ Next: Step 2 — Data Layer Reconstruction
- Cung cấp class-dump headers cho: Network/API classes, Model classes, Database/Storage
- Tìm trong headers: *Service, *Manager, *Client, *API, *Model, *Entity
```

---

## 💾 Step 2: Data Layer Reconstruction

> **Input:** Class-dump headers cho network, models, storage classes
> **Reading help:** `skills/smali-to-swift/objc-reading-guide.md`

### Bước 2.1: Models

```objc
// From class-dump
@interface UserModel : NSObject
@property (nonatomic, copy) NSString *userId;
@property (nonatomic, copy) NSString *fullName;
@property (nonatomic, assign) NSInteger age;
@property (nullable, nonatomic, copy) NSString *avatarURL;
@end
```

```swift
// Swift Codable
struct User: Codable, Identifiable, Sendable {
    let id: String
    let fullName: String
    let age: Int
    let avatarURL: String?
    
    enum CodingKeys: String, CodingKey {
        case id = "user_id"
        case fullName = "full_name"
        case age
        case avatarURL = "avatar_url"
    }
}
```

### Bước 2.2: API Client

```swift
// Data/Network/APIClient.swift
actor APIClient {
    private let session: URLSession
    private let baseURL: URL
    private let decoder = JSONDecoder()
    
    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }
    
    func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(endpoint.path))
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        endpoint.headers?.forEach { request.setValue($0.value, forHTTPHeaderField: $0.key) }
        if let body = endpoint.body { request.httpBody = body }
        
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw APIError.invalidResponse
        }
        return try decoder.decode(T.self, from: data)
    }
}
```

### Bước 2.3: SwiftData (nếu app có Core Data / SQLite)

```swift
// Data/Local/SwiftDataModels/UserEntity.swift
import SwiftData

@Model
final class UserEntity {
    @Attribute(.unique) var id: String
    var name: String
    var email: String
    var lastUpdated: Date
    
    init(id: String, name: String, email: String) {
        self.id = id
        self.name = name
        self.email = email
        self.lastUpdated = .now
    }
}
```

### Bước 2.4: Repository

```swift
// Domain/Repositories/UserRepository.swift
protocol UserRepository: Sendable {
    func getUser(id: String) async throws -> User
    func login(email: String, password: String) async throws -> AuthToken
}

// Data/Repositories/UserRepositoryImpl.swift
final class UserRepositoryImpl: UserRepository {
    private let apiClient: APIClient
    private let modelContext: ModelContext
    
    func getUser(id: String) async throws -> User {
        // offline-first: local → remote → cache
    }
}
```

### ✅ Checkpoint Step 2

---

## 🧮 Step 3: Core Logic & Utils Reconstruction

> **CRITICAL:** Crypto output MUST match original
> **Input:** Hopper pseudo-code / headers cho encryption utils

### Bước 3.1: Crypto utils → Swift

```swift
import CryptoKit
import CommonCrypto

enum CryptoUtils {
    // MD5 (legacy — use CommonCrypto)
    static func md5(_ input: String) -> String {
        let data = Data(input.utf8)
        var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
        data.withUnsafeBytes { CC_MD5($0.baseAddress, CC_LONG(data.count), &digest) }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
    
    // SHA256 (modern — use CryptoKit)
    static func sha256(_ input: String) -> String {
        let hash = SHA256.hash(data: Data(input.utf8))
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }
    
    // AES (match original algorithm exactly)
    static func aesEncrypt(data: Data, key: Data, iv: Data) throws -> Data {
        // Implement matching original parameters
    }
}
```

### Bước 3.2: XCTest verification

```swift
final class CryptoUtilsTests: XCTestCase {
    func testMD5MatchesOriginal() {
        XCTAssertEqual(CryptoUtils.md5("test"), "098f6bcd4621d373cade4e832627b4f6")
    }
}
```

### ✅ Checkpoint Step 3

---

## 🎨 Step 4: UI & ViewModel Reconstruction (Per Screen — Lặp lại)

> **Input:** Storyboard analysis + VC headers + disassembly
> **Reference:** `skills/smali-to-swift/SKILL.md` → Step 4

### Bước 4.0: Chọn màn hình theo ưu tiên

```
1. LaunchScreen / Splash (đơn giản nhất)
2. Auth screens (Login, Register)
3. Main TabView + Home
4. Detail screens
5. Settings / Profile
```

### Bước 4.1: Resource extraction (on-demand)

```markdown
### Resources cho [ScreenName]:
- Images: [icon_logo, bg_login, ...]
- Colors: [primaryColor, backgroundColor, ...]  
- Strings: [login_title, email_placeholder, ...]
- Fonts: [Inter-Regular.ttf, ...]
```

### Bước 4.2: UIKit → SwiftUI

```swift
// Presentation/Screens/Auth/LoginScreen.swift
struct LoginScreen: View {
    @State private var viewModel: LoginViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Logo
                    Image(.appLogo)
                        .resizable()
                        .scaledToFit()
                        .frame(height: 80)
                    
                    // Form fields
                    VStack(spacing: 16) {
                        TextField("Email", text: $viewModel.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                        
                        SecureField("Password", text: $viewModel.password)
                            .textContentType(.password)
                    }
                    .textFieldStyle(.roundedBorder)
                    
                    // Login button
                    Button {
                        Task { await viewModel.login() }
                    } label: {
                        Text("Login")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(viewModel.isLoading)
                }
                .padding()
            }
            .overlay {
                if viewModel.isLoading { ProgressView() }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") {}
            } message: {
                Text(viewModel.errorMessage)
            }
            .navigationTitle("Login")
        }
    }
}
```

### Bước 4.3: ViewModel

```swift
@Observable
final class LoginViewModel {
    var email = ""
    var password = ""
    var isLoading = false
    var showError = false
    var errorMessage = ""
    
    private let authRepository: AuthRepository
    
    init(authRepository: AuthRepository) {
        self.authRepository = authRepository
    }
    
    func login() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await authRepository.login(email: email, password: password)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
}
```

### ✅ Checkpoint Step 4 (Per Screen)

> **Loop:** Lặp Step 4 cho từng screen → khi hết → Step 5.

---

## 📦 Step 5: Third-party SDK & Native Library Integration

### Bước 5.1: App entry point

```swift
@main
struct MyApp: App {
    @UIApplicationDelegateAdaptor private var appDelegate: AppDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [UserEntity.self, /* other models */])
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }
    
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
}
```

### Bước 5.2: Native C/C++ libraries (Bridging Header)

```c
// App-Bridging-Header.h
#include "native_lib.h"
```

```swift
// Swift usage
let result = native_function(param1, param2)
```

### ✅ Checkpoint Step 5

---

## ✅ Step 6: Parity Check & Quality Gate

### Bước 6.1: Test checklist từ disassembly branches

```markdown
### Edge cases (từ ObjC analysis):
- [ ] Login empty email → error message
- [ ] Login wrong password → error + retry limit?
- [ ] Network offline → cached data shown?
- [ ] App backgrounded during API call
- [ ] Deep link handling
- [ ] Push notification tap → correct screen
```

### Bước 6.2: Build & test

```bash
# Build
xcodebuild -scheme App -destination 'generic/platform=iOS' build

# Unit tests
xcodebuild -scheme App -destination 'platform=iOS Simulator,name=iPhone 16' test

# SwiftLint
swiftlint lint
```

### ✅ Final Checkpoint

```markdown
## 🎉 iOS Reverse Engineering Complete!

### Summary:
- Screens rebuilt: [count]
- Frameworks reused: [count]
- Frameworks replaced: [count]
- Native libs integrated: [count]

### ⏭️ Next Steps:
1. `/test` — Run full test suite
2. `/deploy` — When ready for TestFlight / App Store
3. `/code-janitor` — Clean up before merge
```

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Step 0 (Framework Scanner) — always first
  - User approval of Framework Report
  - Checkpoint after each step

never_do:
  - Mass-copy assets from IPA
  - Use UIKit when SwiftUI equivalent exists
  - Use GCD for new async code (use async/await)
  - Use ObjC in new code (Swift only, except bridging headers)
  - Skip crypto parity testing

always_do:
  - Document decisions in session state
  - Present Framework Report before coding
  - XCTest all crypto/hash functions
  - Use @Observable for ViewModels (iOS 17+)
  - Use NavigationStack for navigation
  - Use SPM for all dependencies
```

---

## 🔗 Related

- **Skill:** `smali-to-swift` (core knowledge & rules)
- **Framework DB:** `skills/smali-to-swift/framework-patterns.md`
- **ObjC Guide:** `skills/smali-to-swift/objc-reading-guide.md`
- **Sibling:** `/reverse-android` (Android counterpart)
- **After RE done:** `/test`, `/deploy`, `/code-janitor`

---

*reverse-ios workflow v1.0.0 — iOS IPA RE Execution Flow*
