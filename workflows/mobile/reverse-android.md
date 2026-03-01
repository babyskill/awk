---
description: 🔧 Dịch ngược APK Android (Apktool output) → App Kotlin hiện đại với Jetpack Compose, Clean Architecture, và Library Scanner tự động.
skill: smali-to-kotlin
---

# /reverse-android — Android APK Reverse Engineering Workflow

> **Skill được dùng:** `smali-to-kotlin`
> **Tech Stack:** Kotlin + Jetpack Compose + Hilt + Retrofit + Room + Coroutines
> **Philosophy:** "Read Smali to understand WHAT & WHY → Write Kotlin for HOW"

---

## ⚡ QUICK START

User cung cấp một trong các input sau:
- Đường dẫn thư mục Apktool output
- File `AndroidManifest.xml` (để bắt đầu từ Step 1)
- Nói: "Tôi muốn reverse engineer APK này"

Workflow sẽ dẫn dắt từng bước — **không bao giờ nhảy cóc**.

---

## 🔵 Session Setup (Chạy 1 lần khi bắt đầu)

### Bước 0.1: Khởi tạo session state

Tạo và track session state trong suốt quá trình:

```yaml
reverse_session:
  project_name: "[TBD - lấy từ manifest]"
  apktool_dir: "[path user cung cấp]"
  current_step: 0
  library_report_done: false
  manifest_analyzed: false
  completed_screens: []
  pending_screens: []
  decisions: []
```

### Bước 0.2: Xác nhận input

Hỏi user (nếu chưa cung cấp):

```
🔧 Android Reverse Engineering bắt đầu!

Em cần biết:
1. Thư mục Apktool output ở đâu? (vd: ~/decompiled/com.example.app/)
2. Tên app gốc là gì? (nếu biết)
3. Package name original? (vd: com.example.myapp)

Nếu chưa chạy Apktool, dùng lệnh:
apktool d your-app.apk -o ./decompiled/
```

---

## 📦 Step 0: Library Scanner (BẮT BUỘC — Không được bỏ qua)

> **Mục tiêu:** Nhận diện toàn bộ thư viện trước khi code bất kỳ thứ gì.
> **Reference:** `skills/smali-to-kotlin/library-patterns.md`

### Bước 0.3: Quét Smali directories

User chạy lệnh sau hoặc AI đọc cấu trúc thư mục:

```bash
# Liệt kê top-level packages trong smali/
find [apktool_dir]/smali -maxdepth 3 -type d | sed 's|[apktool_dir]/smali/||' | sort

# Multi-dex apps (smali_classes2, smali_classes3...)
find [apktool_dir] -name "smali*" -maxdepth 1 -type d
find [apktool_dir]/smali_classes2 -maxdepth 3 -type d 2>/dev/null | sort

# Native libraries
find [apktool_dir]/lib -name "*.so" 2>/dev/null

# Assets
ls [apktool_dir]/assets/ 2>/dev/null
```

### Bước 0.4: Phân tích và tạo Library Detection Report

Dùng patterns từ `library-patterns.md`, phân loại từng package:

```markdown
## 📦 Library Detection Report — [App Name]

### ✅ Reuse (Thêm vào build.gradle)
| Library | Package Detected | Recommended Version | Notes |
|---------|-----------------|--------------------|----|
| Retrofit | com/squareup/retrofit2 | 2.9.0 | Keep |
| OkHttp | com/squareup/okhttp3 | 4.12.0 | Keep |
| [...]   | [...]           | [...] | [...] |

### 🔄 Replace (Legacy — cần đổi)
| Old Library | Package Detected | Modern Replacement |
|-------------|-----------------|-------------------|
| Volley | com/android/volley | Retrofit + OkHttp |
| AsyncTask | android.os.AsyncTask | Coroutines |
| [...]      | [...]            | [...] |

### 🔵 Firebase/Google SDKs
| SDK | Package Detected | Action |
|-----|-----------------|--------|
| Firebase Analytics | com/google/firebase/analytics | Add latest |
| [...]              | [...]                        | [...] |

### 📱 Native (.so) — Giữ nguyên
| File | Architecture | Notes |
|------|-------------|-------|
| lib*.so | arm64-v8a | JNI bridge needed |

### 🏷️ App Code (Rebuild in Kotlin)
| Package | Estimated Module |
|---------|-----------------|
| com/example/app/ui | Presentation layer |
| com/example/app/data | Data layer |

### ❓ Unknown Packages (Cần điều tra thêm)
| Package | Path | Possible Library |
|---------|------|-----------------|
| [...]   | [...] | Custom? |
```

### Bước 0.5: User review và approve report

```
📦 Library Report đã sẵn sàng!

Anh review và xác nhận:
✅ Danh sách "Reuse" có đúng không?
🔄 Có thư viện nào trong "Replace" mà anh muốn giữ không?

Sau khi anh OK, em sẽ bắt đầu Step 1 (Manifest Analysis).
```

> **GATE:** Không tiếp tục Step 1 khi chưa có user approval report.

---

## 📄 Step 1: AndroidManifest Analysis & Project Bootstrap

> **Input:** `[apktool_dir]/AndroidManifest.xml`
> **Reference:** `skills/smali-to-kotlin/SKILL.md` → Step 1

### Bước 1.1: Đọc và phân tích AndroidManifest.xml

User cung cấp nội dung file hoặc AI đọc từ path. Trích xuất:

```yaml
extract:
  - application_id: "com.example.app"
  - package_name: "com.example.app"
  - min_sdk: 21
  - target_sdk: 34
  - permissions:
      network: [INTERNET, ACCESS_NETWORK_STATE]
      storage: [READ_EXTERNAL_STORAGE]
      camera: [CAMERA]
      location: []
      other: []
  - entry_points:
      application_class: "com.example.app.MyApp"
      splash_activity: "com.example.app.SplashActivity"
      main_activity: "com.example.app.MainActivity"
  - components:
      activities: [list]
      services: [list]
      receivers: [list]
      providers: [list]
  - deep_links: [list of intent-filters with schemes]
  - features: [uses-feature list]
```

### Bước 1.2: Đề xuất project structure

Xuất Clean Architecture structure dựa trên manifest analysis (xem template trong SKILL.md Step 1).

Mapping activities → Compose screens:

```
SplashActivity → presentation/screens/splash/SplashScreen.kt
MainActivity   → presentation/screens/main/MainScreen.kt
LoginActivity  → presentation/screens/auth/LoginScreen.kt
[...]
```

### Bước 1.3: Tạo `build.gradle.kts` skeleton

```kotlin
// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "[package_name]"
    compileSdk = [target_sdk]

    defaultConfig {
        applicationId = "[application_id]"
        minSdk = [min_sdk]
        targetSdk = [target_sdk]
        versionCode = 1
        versionName = "1.0.0"
    }
    
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Jetpack Compose BOM
    val composeBom = platform(libs.androidx.compose.bom)
    implementation(composeBom)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Hilt DI
    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.androidx.hilt.navigation.compose)

    // Network (từ Library Report)
    implementation(libs.retrofit)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.serialization.json)

    // Local Storage (từ Library Report)
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    ksp(libs.room.compiler)
    implementation(libs.datastore.preferences)

    // Image Loading
    implementation(libs.coil.compose)

    // Logging
    implementation(libs.timber)

    // [Thêm các libs từ Library Report "Reuse" section]
}
```

### ✅ Checkpoint Step 1

```markdown
## ✅ Step 1 Complete: Manifest Analysis & Bootstrap

### Extracted:
- Package: [package_name]
- Entry points: [list]
- Permissions: [count] total
- Screens to rebuild: [list from activities]

### Created:
- Project structure proposal
- build.gradle.kts skeleton

### ⏭️ Next: Step 2 — Data Layer Reconstruction
- Hãy cung cấp Smali files cho: API calls, network models, database queries
- Folders thường có: smali/[package]/network/, smali/[package]/model/, smali/[package]/data/
```

---

## 💾 Step 2: Data Layer Reconstruction

> **Input:** Smali files cho network, models, database logic
> **Reference:** `skills/smali-to-kotlin/SKILL.md` → Step 2
> **Reading help:** `skills/smali-to-kotlin/smali-reading-guide.md`

### Bước 2.1: Network Layer

Từ Smali, trích xuất và tạo:

```kotlin
// data/remote/api/[Feature]Api.kt
interface UserApi {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserDto

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): TokenDto
}
```

### Bước 2.2: DTOs (Data Transfer Objects)

```kotlin
// data/remote/dto/UserDto.kt
@Serializable
data class UserDto(
    @SerialName("user_id") val userId: String,
    @SerialName("full_name") val fullName: String,
    @SerialName("email") val email: String,
    // map từ Smali fields
)
```

### Bước 2.3: Room Database (nếu app có local DB)

```kotlin
// data/local/entity/UserEntity.kt
@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val name: String,
    val email: String
)

// data/local/dao/UserDao.kt
@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :id")
    fun getUserById(id: String): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)
}
```

### Bước 2.4: Repository

```kotlin
// domain/repository/UserRepository.kt (interface)
interface UserRepository {
    fun getUser(id: String): Flow<Result<User>>
    suspend fun login(email: String, password: String): Result<Token>
}

// data/repository/UserRepositoryImpl.kt (implementation)
@Singleton
class UserRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val dao: UserDao
) : UserRepository {
    override fun getUser(id: String): Flow<Result<User>> = flow {
        // offline-first pattern
    }
}
```

### ✅ Checkpoint Step 2

```markdown
## ✅ Step 2 Complete: Data Layer

### Created:
- API interfaces: [list]
- DTOs: [list]
- Room entities + DAOs: [list if applicable]
- Repositories: [list]

### Decisions:
- [Key decisions documented]

### ⏭️ Next: Step 3 — Core Logic & Utils
- Cung cấp Smali cho: encryption, hashing, date formatting, custom algorithms
```

---

## 🧮 Step 3: Core Logic & Utils Reconstruction

> **Input:** Smali for encryption, hashing, utils
> **CRITICAL:** Output phải match 100% với app gốc

### Bước 3.1: Nhận diện utils cần rebuild

Tìm trong Smali:
```
- javax/crypto/Cipher → AES/DES encryption
- java/security/MessageDigest → MD5/SHA hashing
- android/util/Base64 → Base64 encoding
- Custom loops với XOR, shift → custom obfuscation
```

### Bước 3.2: Tái tạo thành Kotlin objects

```kotlin
// util/CryptoUtils.kt
object CryptoUtils {
    fun hashMd5(input: String): String {
        val md = MessageDigest.getInstance("MD5")
        val digest = md.digest(input.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    fun encryptAes(data: String, key: String): String {
        val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
        // ... implement from Smali logic ...
    }
}
```

### Bước 3.3: Unit Test verification

```kotlin
// Luôn tạo unit test cho crypto/hash functions!
class CryptoUtilsTest {
    @Test
    fun `md5 hash matches original`() {
        // Test với known input/output từ app gốc
        assertEquals("expected_hash", CryptoUtils.hashMd5("test_input"))
    }
}
```

### ✅ Checkpoint Step 3

---

## 🎨 Step 4: UI & ViewModel Reconstruction (Per Screen — Lặp lại)

> **Input:** `res/layout/layout_xxx.xml` + Activity/Fragment Smali
> **Lặp lại** cho MỌI màn hình trong danh sách từ Step 1
> **Reference:** `skills/smali-to-kotlin/SKILL.md` → Step 4

### Bước 4.0: Chọn màn hình (theo thứ tự ưu tiên)

```
Thứ tự rebuild đề nghị:
1. SplashScreen (đơn giản nhất)
2. Auth screens (Login, Register, Forgot Password)
3. Main/Home screen
4. Detail screens
5. Settings / Profile
```

### Bước 4.1: Resource Extraction (On-Demand)

Chỉ copy resources của màn hình này:

```markdown
### Resources cần thiết cho [ScreenName]:
- Drawables: [ic_logo.xml, bg_login.png, ...]
- Strings: [login_title, email_hint, password_hint, ...]
- Colors: [primary_color, background_color, ...]
- Dimens: [margin_standard, text_size_title, ...]
- Fonts: [inter_regular.ttf, ...]
```

### Bước 4.2: XML Layout → Compose Migration

Đọc layout XML, convert sang Compose composables:

```kotlin
// presentation/screens/[screen]/[Screen]Screen.kt
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = hiltViewModel(),
    onNavigateToHome: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    
    LaunchedEffect(Unit) {
        viewModel.events.collectLatest { event ->
            when (event) {
                is LoginEvent.NavigateToHome -> onNavigateToHome()
                is LoginEvent.ShowError -> snackbarHostState.showSnackbar(event.message)
            }
        }
    }
    
    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        LoginContent(
            uiState = uiState,
            onEmailChange = viewModel::onEmailChange,
            onPasswordChange = viewModel::onPasswordChange,
            onLoginClick = viewModel::login,
            modifier = Modifier.padding(padding)
        )
    }
}
```

### Bước 4.3: ViewModel

```kotlin
// presentation/screens/[screen]/[Screen]ViewModel.kt
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    private val _events = MutableSharedFlow<LoginEvent>()
    val events: SharedFlow<LoginEvent> = _events.asSharedFlow()

    fun login() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            loginUseCase(uiState.value.email, uiState.value.password)
                .onSuccess { _events.emit(LoginEvent.NavigateToHome) }
                .onFailure { _uiState.update { s -> s.copy(error = it.message) } }
            _uiState.update { it.copy(isLoading = false) }
        }
    }
}

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

sealed interface LoginEvent {
    data object NavigateToHome : LoginEvent
    data class ShowError(val message: String) : LoginEvent
}
```

### ✅ Checkpoint Step 4 (Per Screen)

```markdown
## ✅ Step 4 Complete: [ScreenName]

### Resources extracted: [list]
### Files created:
- [ScreenName]Screen.kt
- [ScreenName]ViewModel.kt
### Next screen: [ScreenName] or Step 5 if all screens done
```

> **Loop:** Quay lại Step 4.0 cho màn hình tiếp theo. Hoàn thành tất cả → Step 5.

---

## 📦 Step 5: Third-party SDK & Native Library Integration

> **Input:** Library Report từ Step 0 (Approved Libraries)

### Bước 5.1: Native Libraries (.so)

```kotlin
// Declare JNI bridge for each .so file
class NativeBridge {
    companion object {
        init {
            System.loadLibrary("library_name")
        }
    }
    
    // Match exact C/C++ function signatures from .so
    external fun nativeMethod(param: String): ByteArray
    external fun nativeVersion(): String
}
```

### Bước 5.2: Application class setup

```kotlin
// App.kt
@HiltAndroidApp
class App : Application() {
    override fun onCreate() {
        super.onCreate()
        setupTimber()
        setupFirebase()
    }
    
    private fun setupTimber() {
        if (BuildConfig.DEBUG) Timber.plant(Timber.DebugTree())
        else Timber.plant(CrashReportingTree())
    }
    
    private fun setupFirebase() {
        // Firebase auto-initializes via manifest
        // Manual config if needed:
        // FirebaseApp.initializeApp(this)
    }
}
```

### Bước 5.3: Hilt modules cho SDK dependencies

```kotlin
// di/NetworkModule.kt
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun provideOkHttpClient(): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor())
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) BODY else NONE
            })
            .build()

    @Provides @Singleton
    fun provideRetrofit(okHttp: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttp)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
}
```

### ✅ Checkpoint Step 5

---

## ✅ Step 6: Parity Check & Quality Gate

> **Mục tiêu:** Đảm bảo app mới hoạt động giống 100% app gốc

### Bước 6.1: Branch coverage từ Smali

Tạo test checklist từ các `if-else` / `when` tìm thấy trong Smali:

```markdown
### Edge Cases cần test (từ Smali analysis):
- [ ] Login với email trống
- [ ] Login với password sai > 3 lần
- [ ] Network timeout handling
- [ ] Empty list state
- [ ] Null response from server
- [ ] App lifecycle (background/foreground)
- [ ] [Custom cases từ specific Smali branches]
```

### Bước 6.2: API Parity verification

```
Checklist:
- [ ] Base URL matches original
- [ ] Request headers identical (User-Agent, auth tokens, etc.)
- [ ] Request body format matches (JSON field names, encoding)
- [ ] Response parsing correct (all fields mapped)
- [ ] Error responses handled
```

### Bước 6.3: Data parity

```
Checklist:
- [ ] Encryption output matches for same input
- [ ] Hash values match for same input
- [ ] Date/time formatting matches locale
- [ ] Local storage read/write works correctly
```

### Bước 6.4: Build và test

```bash
# Debug build
./gradlew assembleDebug

# Unit tests
./gradlew test

# Lint
./gradlew lint
```

### ✅ Final Checkpoint

```markdown
## 🎉 Reverse Engineering Complete!

### Summary:
- Screens rebuilt: [count]
- Libraries reused: [count]
- Libraries replaced: [count]
- Native libs integrated: [count]

### Test Results:
- Unit tests: [pass/fail]
- Lint: [pass/warnings]

### Known Differences from Original:
- [Any intentional or unavoidable differences]

### ⏭️ Recommended Next Steps:
1. `/test` — Chạy full test suite
2. `/deploy` — Khi sẵn sàng release
3. `/code-janitor` — Dọn dẹp code trước merge
```

---

## 🚫 WORKFLOW RULES

```yaml
never_skip:
  - Step 0 (Library Scanner) — always first
  - User approval of Library Report — gate before Step 1
  - Checkpoint after each step — no silent progress

never_do:
  - Mass-copy resources from APK (on-demand only)
  - Use deprecated libraries without replacement plan
  - Skip parity check for encryption utils
  - Proceed to next step without user confirmation at checkpoints

always_do:
  - Document decisions in session state
  - Present Library Report before any coding
  - Unit test all crypto/hash functions
  - Update session state after each screen in Step 4
```

---

## 🔗 Related

- **Skill:** `smali-to-kotlin` (core knowledge & rules)
- **Library DB:** `skills/smali-to-kotlin/library-patterns.md`
- **Smali Guide:** `skills/smali-to-kotlin/smali-reading-guide.md`
- **After RE done:** `/test`, `/deploy`, `/code-janitor`
- **Future iOS version:** `smali-to-swift` skill + `/reverse-ios` workflow

---

*reverse-android workflow v1.0.0 — Android APK RE Execution Flow*
