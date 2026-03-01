---
description: 🏗️ RE Android Phase 2 — Data Layer, Utils, UI, SDK Integration & Parity Check
parent: reverse-android
---

# /re-android-build — Build & Verify

> **Parent:** [`/reverse-android`](reverse-android.md) → Step 2-6
> **Prerequisite:** Hoàn thành [`/re-android-scan`](reverse-android-scan.md)
> **Skill:** `smali-to-kotlin` | **Smali Guide:** `skills/smali-to-kotlin/smali-reading-guide.md`

---

## 💾 Step 2: Data Layer Reconstruction

> **Input:** Smali files cho network, models, database logic

### 2.1: Network Layer → Retrofit interfaces

```kotlin
interface UserApi {
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserDto

    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): TokenDto
}
```

### 2.2: DTOs (Kotlin Serialization)

```kotlin
@Serializable
data class UserDto(
    @SerialName("user_id") val userId: String,
    @SerialName("full_name") val fullName: String,
    @SerialName("email") val email: String,
)
```

### 2.3: Room Database (nếu có local DB)

- Entity với `@Entity` + `@PrimaryKey`
- DAO với `@Dao` + `Flow<>` return types
- `OnConflictStrategy.REPLACE` cho upsert

### 2.4: Repository Pattern

- Domain: `interface UserRepository` (Flows + Results)
- Data: `UserRepositoryImpl @Inject constructor(api, dao)` — offline-first

### ✅ Checkpoint Step 2

---

## 🧮 Step 3: Core Logic & Utils

> **CRITICAL:** Output phải match 100% với app gốc

### 3.1: Nhận diện từ Smali

```
javax/crypto/Cipher       → AES/DES encryption
java/security/MessageDigest → MD5/SHA hashing
android/util/Base64        → Base64 encoding
Custom XOR/shift loops     → Custom obfuscation
```

### 3.2: Kotlin objects

```kotlin
object CryptoUtils {
    fun hashMd5(input: String): String {
        val md = MessageDigest.getInstance("MD5")
        return md.digest(input.toByteArray())
            .joinToString("") { "%02x".format(it) }
    }
    fun encryptAes(data: String, key: String): String { /* from Smali */ }
}
```

### 3.3: Unit Test verification (BẮT BUỘC cho crypto)

```kotlin
class CryptoUtilsTest {
    @Test
    fun `md5 hash matches original`() {
        assertEquals("expected_hash", CryptoUtils.hashMd5("test_input"))
    }
}
```

### ✅ Checkpoint Step 3

---

## 🎨 Step 4: UI & ViewModel (Per Screen — Loop)

> **Input:** `res/layout/*.xml` + Activity/Fragment Smali
> **Lặp lại** cho MỌI màn hình từ Step 1

### 4.0: Thứ tự ưu tiên

1. SplashScreen → 2. Auth → 3. Home → 4. Detail → 5. Settings/Profile

### 4.1: Resource Extraction (On-Demand only)

Chỉ copy resources cho màn hình hiện tại: drawables, strings, colors, dimens, fonts.

### 4.2: XML Layout → Compose

Pattern cho mỗi screen:

```kotlin
@Composable
fun [Screen]Screen(
    viewModel: [Screen]ViewModel = hiltViewModel(),
    onNavigateTo[Next]: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // LaunchedEffect for events
    // Scaffold with content
}
```

### 4.3: ViewModel Pattern

```kotlin
@HiltViewModel
class [Screen]ViewModel @Inject constructor(
    private val useCase: [Feature]UseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow([Screen]UiState())
    val uiState = _uiState.asStateFlow()
    
    private val _events = MutableSharedFlow<[Screen]Event>()
    val events = _events.asSharedFlow()
}

data class [Screen]UiState(val isLoading: Boolean = false, val error: String? = null)
sealed interface [Screen]Event { /* navigation, snackbar */ }
```

### ✅ Checkpoint Step 4 (Per Screen)

> **Loop:** Quay lại 4.0 cho screen tiếp. Hết screen → Step 5.

---

## 📦 Step 5: SDK & Native Library Integration

> **Input:** Library Report từ Step 0

### 5.1: Native Libraries (.so) → JNI Bridge

```kotlin
class NativeBridge {
    companion object { init { System.loadLibrary("name") } }
    external fun nativeMethod(param: String): ByteArray
}
```

### 5.2: Application class

```kotlin
@HiltAndroidApp
class App : Application() {
    override fun onCreate() { super.onCreate(); setupTimber(); setupFirebase() }
}
```

### 5.3: Hilt DI Modules

- `NetworkModule`: OkHttpClient + Retrofit + Interceptors
- `DatabaseModule`: Room database + DAOs
- `RepositoryModule`: Bind implementations

### ✅ Checkpoint Step 5

---

## ✅ Step 6: Parity Check & Quality Gate

### 6.1: Edge Case checklist (từ Smali branches)

```markdown
- [ ] Login empty/invalid input
- [ ] Network timeout/offline
- [ ] Empty list states
- [ ] Null server responses
- [ ] App lifecycle (bg/fg)
```

### 6.2: API Parity

- [ ] Base URL, headers, body format matches
- [ ] Response parsing correct
- [ ] Error handling matches

### 6.3: Data Parity

- [ ] Encryption/hash output matches
- [ ] Date formatting matches
- [ ] Local storage works correctly

### 6.4: Build & Test

```bash
./gradlew assembleDebug && ./gradlew test && ./gradlew lint
```

### 🎉 Final Summary

```markdown
## Complete!
- Screens: [count] | Libs reused: [count] | Replaced: [count]
- Tests: [pass/fail] | Lint: [pass/warnings]

⏭️ Next: /test → /deploy → /code-janitor
```

---

## 🔗 Related

- **Parent:** [`/reverse-android`](reverse-android.md)
- **Previous:** [`/re-android-scan`](reverse-android-scan.md) (Step 0-1)
- **Smali Guide:** `skills/smali-to-kotlin/smali-reading-guide.md`

---

*re-android-build v2.0.0 — Phase 2: Build & Verify*
