---
name: smali-to-swift
description: >-
  iOS Reverse Engineering specialist. Reads decrypted IPA output (class-dump headers,
  Hopper/IDA disassembly, resources, Info.plist) and rebuilds the app from scratch using
  modern Swift + SwiftUI + Clean Architecture (MVVM).
  Includes framework detection to reuse existing dependencies.
author: Antigravity Team
version: 1.0.0
trigger: conditional
activation_keywords:
  - "/reverse-ios"
  - "ipa"
  - "class-dump"
  - "hopper"
  - "reverse engineer ios"
  - "dịch ngược ios"
  - "tái tạo ipa"
  - "rebuild ipa"
  - "objective-c to swift"
  - "objc to swift"
priority: high
platform: ios
sibling_skill: smali-to-kotlin (Android counterpart)
---

# 🍎 Smali-to-Swift Skill

> **Purpose:** Transform decrypted iOS IPA (class-dump headers, disassembly, resources, plist) into a modern Swift app with SwiftUI, Clean Architecture, and MVVM.
> **Philosophy:** "Read ObjC headers to understand WHAT and WHY → Write Swift for HOW."

---

## ⚠️ SCOPE CLARITY

| This skill DOES | This skill DOES NOT |
|-----------------|---------------------|
| Read & analyze ObjC headers, ARM disassembly | Write Objective-C code |
| Rebuild logic in modern Swift + SwiftUI | Modify original IPA |
| Detect & reuse third-party frameworks | Crack/bypass DRM or jailbreak |
| Extract only needed resources (on-demand) | Mass-copy assets blindly |
| Set up Clean Architecture project structure | Handle Android reverse engineering |
| Scan IPA frameworks for dependency reuse | Submit to App Store |

→ For Android reverse engineering → sibling skill: `smali-to-kotlin`
→ After rebuild complete → use `/test` or `/deploy` workflows

---

## 🎯 ROLE DEFINITION

When this skill is active, the agent becomes:

> **Expert iOS Reverse Engineer & Swift Architect**
> - Master at reading ObjC/Swift class-dump headers and ARM disassembly
> - Fluent in Clean Architecture + MVVM + SwiftUI
> - Knows when to reuse vs rewrite third-party frameworks
> - Enforces resource-on-demand principle (zero bloat)

---

## 🧰 iOS RE TOOLCHAIN

### Decryption & Extraction
| Tool | Purpose | Output |
|------|---------|--------|
| **frida-ios-dump** / **bagbak** | Decrypt IPA from jailbroken device | Decrypted .app bundle |
| **class-dump** / **class-dump-swift** | Extract ObjC/Swift headers | `.h` header files |
| **Hopper Disassembler** | ARM disassembly + pseudo-code | Pseudo-C / ARM ASM |
| **IDA Pro** | Advanced disassembly | Pseudo-C / ARM ASM |
| **jtool2** | Mach-O analysis, entitlements | Entitlements plist, segments |
| **plutil / plistutil** | Read binary plists | Readable plist XML |

### What we get from an IPA:
```
Payload/App.app/
├── App                          # Mach-O binary (encrypted → need decrypt first)
├── Info.plist                   # App metadata (bundle ID, permissions, URL schemes)
├── Frameworks/                  # Embedded frameworks (.framework / .dylib)
│   ├── SomeSDK.framework/
│   └── libswiftCore.dylib
├── Assets.car                   # Compiled asset catalog
├── Base.lproj/                  # Storyboards / XIBs (compiled)
│   ├── Main.storyboardc/
│   └── LaunchScreen.storyboardc/
├── *.nib                        # Compiled XIB files
├── *.momd                       # Core Data models (compiled)
├── embedded.mobileprovision     # Provisioning profile
├── _CodeSignature/              # Code signing
└── [other resources: json, png, html, js, fonts...]
```

---

## 🏗️ MODERN TECH STACK (Mandatory)

### Core
| Layer | Technology | Replaces |
|-------|-----------|----------|
| **UI** | SwiftUI + iOS 17+ | UIKit Storyboards / XIBs |
| **State** | `@Observable` (Observation framework) | `@ObservableObject` / KVO |
| **Navigation** | NavigationStack + NavigationPath | UINavigationController / segues |
| **DI** | Swift DI (protocol + init injection) | Singletons / Service Locators |

### Data Layer
| Purpose | Technology | Replaces |
|---------|-----------|----------|
| **Network** | URLSession + async/await | AFNetworking / Alamofire (evaluate) |
| **JSON** | Codable (Swift built-in) | NSJSONSerialization / Mantle / ObjectMapper |
| **Local DB** | SwiftData (iOS 17+) or Core Data | Raw SQLite / FMDB / Realm |
| **Preferences** | UserDefaults / @AppStorage | NSUserDefaults direct |
| **Keychain** | KeychainAccess (or custom wrapper) | Raw Security.framework |
| **Image Loading** | AsyncImage / Kingfisher / Nuke | SDWebImage (evaluate) |
| **Async** | Swift Concurrency (async/await, actors) | GCD / NSOperation / PromiseKit |

### Observability
| Purpose | Technology |
|---------|-----------|
| **Crash** | Firebase Crashlytics |
| **Analytics** | Firebase Analytics |
| **Logging** | OSLog / swift-log |

### Replacements Table (Legacy → Modern)

```yaml
always_replace:
  NSURLConnection: "URLSession async/await"
  AFNetworking: "URLSession async/await"
  NSJSONSerialization: "Codable / JSONDecoder"
  Mantle/ObjectMapper: "Codable"
  GCD_dispatch_async: "Task { } / async-await"
  NSOperation: "TaskGroup / async let"
  NSTimer: "Timer.publish (Combine) or Task.sleep"
  UIAlertView: "SwiftUI .alert modifier"
  UIActionSheet: "SwiftUI .confirmationDialog"
  UITableView: "List / LazyVStack"
  UICollectionView: "LazyVGrid / LazyHGrid"
  UIPageViewController: "TabView with .page style"
  Storyboard_segues: "NavigationStack + NavigationLink"
  NSNotificationCenter_addObserver: "NotificationCenter.notifications (AsyncSequence)"
  KVO: "@Observable macro"
  Delegate_patterns: "AsyncStream or closures"
  Target_Action: "SwiftUI action closures"

evaluate_before_replacing:
  Alamofire: "Keep if deeply used for interceptors/retry, otherwise → URLSession"
  SDWebImage: "Replace with AsyncImage + Kingfisher"
  Realm: "Migrate to SwiftData (if iOS 17+)"
  RxSwift: "Migrate to async/await + AsyncSequence (gradual)"
  SnapKit: "Replace with SwiftUI layout"
  Masonry: "Replace with SwiftUI layout"
  MBProgressHUD: "SwiftUI .overlay + ProgressView"
  SVProgressHUD: "SwiftUI .overlay + ProgressView"
  IQKeyboardManager: "SwiftUI handles keyboard automatically"

keep_as_is:
  - "Firebase SDKs (use latest via SPM)"
  - "Google Sign-In"
  - "Facebook SDK (latest)"
  - "Apple frameworks (MapKit, CoreLocation, AVFoundation, etc.)"
  - "Native C/C++ libraries (.dylib)"
  - "CryptoKit (Apple native)"
```

---

## 📋 EXECUTION PIPELINE (6 Steps)

> **Rule:** Always complete one step fully before moving to the next.
> **Rule:** After each step, create a checkpoint summary for the user.

### Step 0: Framework Scanner (PRE-STEP — Always First) 🔍

**Purpose:** Scan the IPA structure to identify all third-party frameworks before any coding.

**Process:**
1. **Scan `Frameworks/` directory:**
   ```
   Frameworks/Alamofire.framework     → Alamofire (network)
   Frameworks/SDWebImage.framework    → SDWebImage (image loading)
   Frameworks/Realm.framework         → Realm (database)
   Frameworks/FBSDKCoreKit.framework  → Facebook SDK
   Frameworks/GoogleSignIn.framework  → Google Sign-In
   ```

2. **Scan class-dump headers for imports:**
   ```
   #import <AFNetworking/...>        → AFNetworking
   #import <Masonry/...>             → Masonry (auto-layout)
   #import <MBProgressHUD/...>       → MBProgressHUD
   @import Firebase;                 → Firebase SDK
   @import GoogleMobileAds;          → AdMob
   ```

3. **Check Mach-O linked frameworks:**
   ```bash
   otool -L Payload/App.app/App | grep -v /System | grep -v /usr/lib
   ```

4. **Check embedded dylibs:**
   ```bash
   find Payload/App.app -name "*.dylib" -o -name "*.framework" | sort
   ```

5. **Check for CocoaPods / SPM markers:**
   ```
   Pods/ directory presence → was using CocoaPods
   .package.resolved → was using SPM
   ```

6. **Output: Framework Detection Report**
   ```markdown
   ## 📦 Framework Detection Report
   
   ### ✅ Can Reuse (add to Package.swift / Podfile)
   | Framework | Detected | Latest Version | Action |
   |-----------|----------|----------------|--------|
   | Alamofire | Frameworks/Alamofire.framework | 5.9.0 | Evaluate |
   | Kingfisher | (header import) | 7.12.0 | Add via SPM |
   
   ### 🔄 Must Replace (legacy)
   | Old Framework | Detected | Modern Replacement |
   |---------------|----------|-------------------|
   | AFNetworking | Frameworks/AFNetworking.framework | URLSession async/await |
   | Masonry | header imports | SwiftUI layout |
   
   ### 🍏 Apple Frameworks Used
   | Framework | Purpose |
   |-----------|---------|
   | MapKit | Maps |
   | CoreLocation | GPS |
   | AVFoundation | Camera/Audio |
   
   ### 📱 Native (.dylib) — Investigate
   | File | Notes |
   |------|-------|
   | libcrypto.dylib | Custom crypto? |
   
   ### ❓ Unknown (investigate)
   | Framework/Import | Notes |
   |------------------|-------|
   | CustomSDK.framework | Proprietary? |
   ```

---

### Step 1: Info.plist & Entitlements Analysis + Project Bootstrap 📄

**Input:** User provides `Info.plist` + entitlements from IPA.

**Tasks:**
1. Extract Bundle ID and display name
2. List required permissions (Privacy keys):
   ```
   NSCameraUsageDescription          → Camera
   NSPhotoLibraryUsageDescription    → Photo Library
   NSLocationWhenInUseUsageDescription → Location
   NSMicrophoneUsageDescription      → Microphone
   ```
3. Identify URL Schemes (deep links)
4. Check app capabilities from entitlements:
   ```
   com.apple.developer.associated-domains → Universal Links
   aps-environment → Push Notifications
   com.apple.developer.in-app-payments → Apple Pay
   ```
5. Analyze class-dump headers for entry points:
   - `AppDelegate` → lifecycle logic
   - Root ViewController → initial screen
   - Tab bar / Navigation structure
6. **Output:** Propose Clean Architecture project structure

**Project Structure Template:**
```
App/
├── App.swift                          # @main entry point
├── AppDelegate.swift                  # UIKit lifecycle (if needed for SDKs)
├── Info.plist
├── Assets.xcassets/
├── DI/                                # Dependency Injection
│   └── AppContainer.swift
├── Data/                              # Data Layer
│   ├── Network/
│   │   ├── APIClient.swift            # URLSession wrapper
│   │   ├── Endpoints/                 # API endpoint definitions
│   │   └── DTOs/                      # Codable response models
│   ├── Local/
│   │   ├── SwiftDataModels/           # @Model classes
│   │   ├── KeychainService.swift
│   │   └── UserDefaultsKeys.swift
│   └── Repositories/                  # Repository implementations
├── Domain/                            # Domain Layer
│   ├── Models/                        # Business models
│   ├── Repositories/                  # Repository protocols
│   └── UseCases/
├── Presentation/                      # Presentation Layer
│   ├── Navigation/
│   │   ├── AppNavigation.swift        # NavigationStack + routes
│   │   └── Route.swift                # Deep link routes
│   ├── Theme/
│   │   ├── AppTheme.swift             # Colors, fonts, spacing
│   │   └── Components/               # Reusable SwiftUI components
│   └── Screens/
│       ├── Launch/
│       │   └── LaunchScreen.swift
│       ├── Auth/
│       │   ├── LoginScreen.swift
│       │   └── LoginViewModel.swift
│       ├── Home/
│       │   ├── HomeScreen.swift
│       │   └── HomeViewModel.swift
│       └── ...
├── Utilities/
│   ├── Extensions/
│   ├── Crypto/                        # Encryption/hashing utils
│   └── Helpers/
└── Resources/
    ├── Localizable.xcstrings
    └── Fonts/
```

---

### Step 2: Data Layer Reconstruction 💾

**Input:** User provides class-dump headers + Hopper pseudo-code for network/data classes.

**Tasks:**
1. **Models:** Convert ObjC interfaces → Swift structs
   ```objc
   // ObjC header (class-dump)
   @interface UserModel : NSObject
   @property (nonatomic, copy) NSString *userId;
   @property (nonatomic, copy) NSString *fullName;
   @property (nonatomic, assign) NSInteger age;
   @end
   ```
   ```swift
   // Swift
   struct User: Codable, Identifiable {
       let id: String
       let fullName: String
       let age: Int
       
       enum CodingKeys: String, CodingKey {
           case id = "user_id"
           case fullName = "full_name"
           case age
       }
   }
   ```

2. **API Layer:**
   - Extract base URL, endpoints, headers from disassembly
   - Create async URLSession-based API client:
   ```swift
   actor APIClient {
       private let session: URLSession
       private let baseURL: URL
       
       func request<T: Decodable>(_ endpoint: Endpoint) async throws -> T {
           let (data, response) = try await session.data(for: endpoint.urlRequest(baseURL: baseURL))
           guard let httpResponse = response as? HTTPURLResponse,
                 (200...299).contains(httpResponse.statusCode) else {
               throw APIError.invalidResponse
           }
           return try JSONDecoder().decode(T.self, from: data)
       }
   }
   ```

3. **Local Storage:**
   - CoreData models → SwiftData `@Model` classes
   - NSUserDefaults keys → `@AppStorage` or typed UserDefaults wrapper
   - Keychain items → KeychainAccess wrapper

4. **Repository:**
   ```swift
   // Domain layer - protocol
   protocol UserRepository: Sendable {
       func getUser(id: String) async throws -> User
       func login(email: String, password: String) async throws -> AuthToken
   }
   
   // Data layer - implementation
   final class UserRepositoryImpl: UserRepository {
       private let apiClient: APIClient
       private let modelContext: ModelContext
       
       func getUser(id: String) async throws -> User {
           // offline-first: check local → fetch remote → cache
       }
   }
   ```

---

### Step 3: Core Logic & Utils Reconstruction 🧮

**Input:** Disassembly/pseudo-code for encryption, hashing, custom utils.

**Tasks:**
1. Translate ObjC/C crypto logic → Swift
   - Use `CryptoKit` for modern crypto (SHA256, AES-GCM, HMAC)
   - Use `CommonCrypto` for legacy-compatible (MD5, AES-CBC)
   - Preserve exact input/output signatures

2. Common ObjC → Swift crypto patterns:
   ```objc
   // ObjC (class-dump + disassembly)
   + (NSString *)md5Hash:(NSString *)input;
   + (NSData *)aesEncrypt:(NSData *)data withKey:(NSString *)key;
   ```
   ```swift
   // Swift
   import CryptoKit
   import CommonCrypto
   
   enum CryptoUtils {
       static func md5Hash(_ input: String) -> String {
           let data = Data(input.utf8)
           var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
           data.withUnsafeBytes { CC_MD5($0.baseAddress, CC_LONG(data.count), &digest) }
           return digest.map { String(format: "%02x", $0) }.joined()
       }
       
       static func aesEncrypt(data: Data, key: String) throws -> Data {
           // Implement matching original algorithm exactly
       }
   }
   ```

3. **Verification:** XCTest unit tests with known input/output pairs

**Critical Rule:**
> ⚠️ Crypto/hash functions MUST produce identical output to the original app.
> Test with known pairs captured from the running original app.

---

### Step 4: UI & ViewModel Reconstruction (Per Screen) 🎨

**Input:** Storyboard analysis + class-dump headers for ViewControllers.

**Tasks:**
1. **Resource Extraction (On-Demand):**
   - Extract only images, colors, strings for current screen
   - Use Asset Catalog for organized resources
   - Map ObjC string tables to `Localizable.xcstrings`

2. **UIKit → SwiftUI Migration:**
   ```
   UIViewController          → SwiftUI View struct
   UINavigationController    → NavigationStack
   UITabBarController        → TabView
   UITableView               → List / LazyVStack
   UICollectionView          → LazyVGrid / LazyHGrid
   UIScrollView              → ScrollView
   UIImageView               → AsyncImage / Image
   UILabel                   → Text
   UITextField               → TextField
   UIButton                  → Button
   UIActivityIndicatorView   → ProgressView
   UIAlertController         → .alert / .confirmationDialog modifier
   UIPageViewController      → TabView(.page)
   UIStackView               → VStack / HStack
   MKMapView                 → Map (MapKit SwiftUI)
   WKWebView                 → WebView (custom wrapper)
   UIRefreshControl          → .refreshable modifier
   UISearchController        → .searchable modifier
   ```

3. **ViewModel Creation:**
   ```swift
   @Observable
   final class LoginViewModel {
       var email = ""
       var password = ""
       var isLoading = false
       var error: String?
       
       private let loginUseCase: LoginUseCase
       
       init(loginUseCase: LoginUseCase) {
           self.loginUseCase = loginUseCase
       }
       
       func login() async {
           isLoading = true
           defer { isLoading = false }
           do {
               try await loginUseCase.execute(email: email, password: password)
           } catch {
               self.error = error.localizedDescription
           }
       }
   }
   ```

4. **Screen Composable:**
   ```swift
   struct LoginScreen: View {
       @State private var viewModel: LoginViewModel
       
       init(loginUseCase: LoginUseCase) {
           _viewModel = State(initialValue: LoginViewModel(loginUseCase: loginUseCase))
       }
       
       var body: some View {
           Form {
               TextField("Email", text: $viewModel.email)
                   .textContentType(.emailAddress)
                   .keyboardType(.emailAddress)
               
               SecureField("Password", text: $viewModel.password)
                   .textContentType(.password)
               
               Button("Login") {
                   Task { await viewModel.login() }
               }
               .disabled(viewModel.isLoading)
           }
           .overlay { if viewModel.isLoading { ProgressView() } }
           .alert("Error", isPresented: .constant(viewModel.error != nil)) {
               Button("OK") { viewModel.error = nil }
           } message: {
               Text(viewModel.error ?? "")
           }
       }
   }
   ```

---

### Step 5: Third-party SDK & Native Library Integration 📦

**Input:** Framework Report from Step 0.

**Tasks:**
1. **Swift Package Manager setup:**
   ```swift
   // Package.swift dependencies (or Xcode SPM UI)
   dependencies: [
       .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "11.0.0"),
       .package(url: "https://github.com/onevcat/Kingfisher", from: "7.12.0"),
       .package(url: "https://github.com/kishikawakatsumi/KeychainAccess", from: "4.2.2"),
   ]
   ```

2. **Native C/C++ libraries:**
   ```swift
   // Bridging header for C libraries
   // App-Bridging-Header.h
   #include "native_crypto.h"
   
   // Swift usage
   func callNativeFunction() -> String {
       let result = native_function_name(param)
       return String(cString: result)
   }
   ```

3. **App lifecycle for SDK init:**
   ```swift
   @main
   struct MyApp: App {
       @UIApplicationDelegateAdaptor private var appDelegate: AppDelegate
       
       var body: some Scene {
           WindowGroup {
               ContentView()
           }
       }
   }
   
   class AppDelegate: NSObject, UIApplicationDelegate {
       func application(_ application: UIApplication,
                        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
           FirebaseApp.configure()
           // Other SDK initialization
           return true
       }
   }
   ```

---

### Step 6: Parity Check & Quality Gate ✅

**Per-module checklist:**
1. **Branch Coverage:** Review all conditional paths from disassembly
2. **API Parity:** Same requests/responses as original
3. **Data Parity:** Crypto output matches, local storage compatible
4. **UI Parity:** Screen-by-screen comparison
5. **Performance:**
   - Instruments profiling
   - No unnecessary @State re-renders
   - Proper actor isolation (no data races)

---

## 🔍 ObjC HEADER READING GUIDE

### Property Types → Swift
```objc
@property (nonatomic, copy) NSString *name;        // → let name: String
@property (nonatomic, strong) NSArray *items;       // → let items: [Any] (refine type)
@property (nonatomic, assign) BOOL isActive;        // → let isActive: Bool
@property (nonatomic, assign) NSInteger count;      // → let count: Int
@property (nonatomic, assign) CGFloat height;       // → let height: CGFloat
@property (nonatomic, strong) NSDictionary *meta;   // → let meta: [String: Any]
@property (nonatomic, strong) NSDate *createdAt;    // → let createdAt: Date
@property (nonatomic, strong) NSURL *imageURL;      // → let imageURL: URL?
@property (nonatomic, strong) NSData *data;         // → let data: Data
@property (nullable, nonatomic, copy) NSString *bio; // → let bio: String?
```

### Method Signatures → Swift
```objc
- (void)fetchUserWithId:(NSString *)userId completion:(void (^)(UserModel *, NSError *))completion;
// → func fetchUser(id: String) async throws -> User

+ (instancetype)sharedInstance;
// → static let shared = ClassName()

- (BOOL)validateEmail:(NSString *)email;
// → func validateEmail(_ email: String) -> Bool
```

### Delegate Patterns → Swift
```objc
@protocol UserServiceDelegate <NSObject>
- (void)userServiceDidFetchUser:(UserModel *)user;
- (void)userServiceDidFailWithError:(NSError *)error;
@end
```
```swift
// Replace with async/await:
func fetchUser() async throws -> User
// Or AsyncStream for multiple values:
func userUpdates() -> AsyncStream<User>
```

### Blocks → Closures / async
```objc
typedef void (^CompletionHandler)(NSData * _Nullable data, NSError * _Nullable error);
- (void)requestWithCompletion:(CompletionHandler)completion;
```
```swift
// Modern Swift: drop the callback, use async
func request() async throws -> Data
```

---

## 🔄 WORKFLOW INTEGRATION

```yaml
triggers_from:
  - "/reverse-ios" workflow command
  - Keywords: "ipa", "class-dump", "objc to swift", "dịch ngược ios", "reverse ios"

delegates_to:
  - "/test" — after parity check
  - "/deploy" — when rebuild is complete
  - symphony-orchestrator — auto-track progress per step

works_with:
  - memory-sync — saves decisions, patterns, solutions
  - orchestrator — routes to this skill based on intent
  - ios-engineer — shares iOS knowledge base

independent_from:
  - brainstorm-agent
  - smali-to-kotlin (sibling, same pattern, different platform)
```

---

## 🚫 ANTI-PATTERNS

```yaml
never_do:
  - Copy all resources blindly from IPA → only on-demand
  - Use UIKit when SwiftUI equivalent exists → always prefer SwiftUI
  - Use GCD dispatch_async for new code → use async/await
  - Use NSJSONSerialization → use Codable
  - Modify encryption output → must match original exactly
  - Create massive ViewController God objects → split into SwiftUI Views + ViewModels
  - Skip framework scanner step → always detect reusable dependencies first
  - Use ObjC in new code → Swift only (except bridging headers for C libs)
  - Force unwrap optionals → use guard let / if let / nil coalescing

always_do:
  - Run Framework Scanner (Step 0) before any coding
  - Present framework report to user for approval
  - Use Swift Concurrency (async/await) for all async operations
  - Use @Observable (iOS 17+) for ViewModels
  - Use NavigationStack for navigation
  - Unit test all encryption/hashing utils
  - Follow Clean Architecture layer separation strictly
  - Use SPM for dependency management (not CocoaPods)
```

---

## 📊 CHECKPOINT TEMPLATE

After each step, output:

```markdown
## ✅ Step [N] Complete: [Step Name]

### What was done:
- [Summary]

### Files created:
- [List]

### Resources extracted:
- [Only what was needed]

### Decisions made:
- [Key decisions]

### ⏭️ Next: Step [N+1] — [Step Name]
- [What user needs to provide]
```

---

## 🧩 PLATFORM RE TEMPLATE PATTERN

This skill follows the same **6-step pipeline** as `smali-to-kotlin`:

| Step | Android (smali-to-kotlin) | iOS (smali-to-swift) |
|------|--------------------------|---------------------|
| 0 | Library Scanner (Smali packages) | Framework Scanner (Frameworks/ + headers) |
| 1 | AndroidManifest.xml | Info.plist + Entitlements |
| 2 | Retrofit + Room | URLSession + SwiftData |
| 3 | Kotlin crypto utils | Swift CryptoKit/CommonCrypto |
| 4 | Jetpack Compose + StateFlow | SwiftUI + @Observable |
| 5 | Hilt + JNI | SPM + Bridging Header |
| 6 | Parity Check | Parity Check |

---

*smali-to-swift v1.0.0 — iOS Reverse Engineering Skill for AWF*
*Created by Antigravity Team*
