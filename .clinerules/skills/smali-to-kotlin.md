---
name: smali-to-kotlin
description: >-
  Android Reverse Engineering specialist. Reads Apktool output (Smali, resources, manifest)
  and rebuilds the app from scratch using modern Kotlin + Jetpack Compose + Clean Architecture.
  Includes library detection to reuse existing dependencies.
author: Antigravity Team
version: 1.0.0
trigger: conditional
activation_keywords:
  - "/reverse-android"
  - "smali"
  - "apktool"
  - "reverse engineer"
  - "dịch ngược"
  - "tái tạo apk"
  - "rebuild apk"
  - "smali to kotlin"
priority: high
platform: android
extensible_to:
  - ios (separate skill: smali-to-swift — planned)
---

# 🔧 Smali-to-Kotlin Skill

> **Purpose:** Transform decompiled Android APK (Apktool output) into a modern Kotlin app with Jetpack Compose, Clean Architecture, and MVVM.
> **Philosophy:** "Read Smali to understand WHAT and WHY → Write Kotlin for HOW."

---

## ⚠️ SCOPE CLARITY

| This skill DOES | This skill DOES NOT |
|-----------------|---------------------|
| Read & analyze Smali/Java decompiled code | Write Smali code |
| Rebuild logic in modern Kotlin | Modify original APK |
| Detect & reuse third-party libraries | Crack/bypass security |
| Extract only needed resources (on-demand) | Mass-copy resources blindly |
| Set up Clean Architecture project structure | Handle iOS reverse engineering |
| Scan APK libraries for package reuse | Deploy to Play Store |

→ For iOS reverse engineering → future skill: `smali-to-swift`
→ After rebuild complete → use `/test` or `/deploy` workflows

---

## 🎯 ROLE DEFINITION

When this skill is active, the agent becomes:

> **Expert Android Reverse Engineer & Kotlin Architect**
> - Master at reading Smali bytecode and obfuscated Java
> - Fluent in Clean Architecture + MVVM + Jetpack Compose
> - Knows when to reuse vs rewrite third-party dependencies
> - Enforces resource-on-demand principle (zero bloat)

---

## 🏗️ MODERN TECH STACK (Mandatory)

### Core
| Layer | Technology | Replaces |
|-------|-----------|----------|
| **UI** | Jetpack Compose + Material 3 | XML Layouts + findViewById |
| **State** | StateFlow + ViewModel | LiveData / AsyncTask |
| **Navigation** | Navigation Compose | Intent-based navigation |
| **DI** | Hilt (Dagger) | Manual DI / ServiceLocator |

### Data Layer
| Purpose | Technology | Replaces |
|---------|-----------|----------|
| **Network** | Retrofit + OkHttp + Kotlin Serialization | Volley / HttpURLConnection |
| **Local DB** | Room Database | Raw SQLite / SQLiteOpenHelper |
| **Preferences** | DataStore (Proto/Preferences) | SharedPreferences |
| **Image Loading** | Coil | Picasso / Glide (evaluate) |
| **Async** | Kotlin Coroutines + Flow | AsyncTask / Handler / Thread |

### Observability
| Purpose | Technology |
|---------|-----------|
| **Crash** | Firebase Crashlytics |
| **Analytics** | Firebase Analytics |
| **Logging** | Timber |

### Replacements Table (Legacy → Modern)

```yaml
always_replace:
  AsyncTask: "Coroutines (suspend fun / Flow)"
  Volley: "Retrofit + OkHttp"
  HttpURLConnection: "Retrofit + OkHttp"
  Handler/Looper: "Coroutines (Dispatchers.Main)"
  BroadcastReceiver (local): "Flow / EventBus → SharedFlow"
  SharedPreferences: "DataStore"
  SQLiteOpenHelper: "Room"
  ListView/GridView: "LazyColumn/LazyGrid (Compose)"
  findViewById: "Compose state"
  Gson: "Kotlin Serialization (kotlinx.serialization)"
  
evaluate_before_replacing:
  Glide: "Keep if deeply integrated, otherwise → Coil"
  RxJava: "Migrate to Coroutines + Flow (gradual)"
  EventBus: "Replace with SharedFlow"
  Butter Knife: "Not needed in Compose"
  Dagger 2: "Upgrade to Hilt"

keep_as_is:
  - "OkHttp (still current)"
  - "Retrofit (still current)"
  - "Firebase SDKs (use latest version)"
  - "Google Play Services"
  - "Native .so libraries (JNI)"
```

---

## 📋 EXECUTION PIPELINE (6 Steps)

> **Rule:** Always complete one step fully before moving to the next.
> **Rule:** After each step, create a checkpoint summary for the user.

### Step 0: Library Scanner (PRE-STEP — Always First) 🔍

**Purpose:** Scan the APK structure to identify all third-party libraries before any coding.

**Process:**
1. **Scan `smali/` directories** for package patterns:
   ```
   smali/com/google/      → Google SDKs
   smali/com/facebook/    → Facebook SDK
   smali/com/squareup/    → OkHttp, Retrofit, Picasso
   smali/io/reactivex/    → RxJava
   smali/org/greenrobot/  → EventBus
   smali/com/bumptech/    → Glide
   smali/com/airbnb/      → Lottie
   smali/androidx/         → AndroidX (baseline)
   smali/com/jakewharton/ → Butterknife, Timber
   ```

2. **Check `lib/` for native libraries (.so)**:
   ```
   lib/arm64-v8a/*.so     → 64-bit native libs
   lib/armeabi-v7a/*.so   → 32-bit native libs
   ```

3. **Check `assets/` for embedded resources:**
   - ML models (.tflite, .onnx)
   - WebView HTML/JS bundles
   - Config files (JSON, XML)

4. **Output: Library Report**
   ```markdown
   ## 📦 Library Detection Report
   
   ### ✅ Can Reuse (add to build.gradle)
   | Library | Detected Package | Latest Version | Action |
   |---------|-----------------|----------------|--------|
   | Retrofit | com.squareup.retrofit2 | 2.9.0 | Add dependency |
   | OkHttp | com.squareup.okhttp3 | 4.12.0 | Add dependency |
   | Glide | com.bumptech.glide | 4.16.0 | Evaluate → Coil? |
   
   ### 🔄 Must Replace (legacy)
   | Old Library | Detected Package | Replacement |
   |-------------|-----------------|-------------|
   | Volley | com.android.volley | Retrofit |
   | AsyncTask | android.os.AsyncTask | Coroutines |
   
   ### 📱 Native (.so) — Keep As-Is
   | File | Architecture | Notes |
   |------|-------------|-------|
   | libfoo.so | arm64-v8a | Need JNI bridge |
   
   ### ❓ Unknown (investigate)
   | Package | Path | Possible Library |
   |---------|------|-----------------|
   | com.xyz.abc | smali/com/xyz/abc | Custom? |
   ```

---

### Step 1: AndroidManifest Analysis & Project Bootstrap 📄

**Input:** User provides `AndroidManifest.xml` from Apktool output.

**Tasks:**
1. Extract Application ID and original package name
2. List all required permissions (group by category: network, storage, camera, etc.)
3. Identify entry points:
   - `Application` class (custom init logic?)
   - `SplashActivity` / Launcher Activity
   - `MainActivity`
4. Map all components:
   - Activities → future Compose screens
   - Services → WorkManager candidates?
   - BroadcastReceivers → keep or replace with Flow?
   - ContentProviders → keep or replace with Room?
5. Detect intent-filters for deep links
6. **Output:** Propose Clean Architecture project structure

**Project Structure Template:**
```
app/
├── src/main/
│   ├── java/com/package/app/
│   │   ├── App.kt                    # Application class
│   │   ├── di/                       # Hilt modules
│   │   │   ├── AppModule.kt
│   │   │   ├── NetworkModule.kt
│   │   │   └── DatabaseModule.kt
│   │   ├── data/                     # Data Layer
│   │   │   ├── remote/
│   │   │   │   ├── api/              # Retrofit interfaces
│   │   │   │   ├── dto/              # Data Transfer Objects
│   │   │   │   └── interceptor/      # OkHttp interceptors
│   │   │   ├── local/
│   │   │   │   ├── db/               # Room database
│   │   │   │   ├── dao/              # Room DAOs
│   │   │   │   ├── entity/           # Room entities
│   │   │   │   └── datastore/        # DataStore preferences
│   │   │   └── repository/           # Repository implementations
│   │   ├── domain/                   # Domain Layer
│   │   │   ├── model/                # Business models
│   │   │   ├── repository/           # Repository interfaces
│   │   │   └── usecase/              # Use cases
│   │   ├── presentation/             # Presentation Layer
│   │   │   ├── navigation/           # NavGraph + Routes
│   │   │   ├── theme/                # Material 3 Theme
│   │   │   ├── components/           # Reusable Compose components
│   │   │   └── screens/              # Feature screens
│   │   │       ├── splash/
│   │   │       │   ├── SplashScreen.kt
│   │   │       │   └── SplashViewModel.kt
│   │   │       ├── home/
│   │   │       │   ├── HomeScreen.kt
│   │   │       │   └── HomeViewModel.kt
│   │   │       └── ...
│   │   └── util/                     # Extensions, helpers
│   ├── res/                          # Only needed resources
│   └── AndroidManifest.xml           # Clean manifest
├── build.gradle.kts
└── proguard-rules.pro
```

---

### Step 2: Data Layer Reconstruction 💾

**Input:** User provides Smali/Java code for API endpoints, JSON models, database queries.

**Tasks:**
1. **Models:** Convert POJO/Model Smali → Kotlin `data class`
   - Use `@Serializable` (kotlinx.serialization) or `@JsonClass` (Moshi)
   - Preserve JSON field names with `@SerialName`
2. **API Layer:**
   - Extract base URL, endpoints, headers from Smali
   - Create Retrofit `@GET/@POST` interfaces
   - Identify auth patterns (token, API key, custom headers)
3. **Local Storage:**
   - SQLite queries → Room entities + DAOs
   - SharedPreferences keys → DataStore schema
4. **Repository:**
   - Create interface in `domain/repository/`
   - Implement in `data/repository/`
   - Use Flow for reactive data streams

**Smali Reading Tips:**
```
# Finding API base URL:
Look for: const-string → "https://" or "http://"
Look for: .field → BASE_URL or API_URL

# Finding endpoints:
Look for: StringBuilder + append patterns
Look for: Annotation patterns (@GET, @POST in obfuscated form)

# Finding JSON parsing:
Look for: JSONObject, JSONArray usage
Look for: Gson.fromJson / TypeToken patterns
```

---

### Step 3: Core Logic & Utils Reconstruction 🧮

**Input:** User provides Smali for encryption, hashing, time formatting, custom utils.

**Tasks:**
1. Translate mathematical/encryption logic from Smali → Kotlin
   - Preserve exact input/output signatures (critical for server compatibility)
   - Use `object` for stateless utils, extension functions for type-specific
2. Map special encoding patterns:
   - MD5/SHA hashing → `MessageDigest`
   - AES/DES encryption → `javax.crypto.Cipher`
   - Base64 → `android.util.Base64` or `java.util.Base64`
   - Custom obfuscation → reverse engineer step-by-step
3. **Verification:** Create unit tests that compare output with original app

**Critical Rule:**
> ⚠️ Encryption and hashing functions MUST produce identical output to the original app.
> Any mismatch will break server communication. Always unit test with known input/output pairs.

---

### Step 4: UI & ViewModel Reconstruction (Per Screen) 🎨

**Input:** User provides `layout_xxx.xml` + corresponding Smali for Activity/Fragment.

**Tasks:**
1. **Resource Extraction (On-Demand):**
   - List ONLY the drawables, strings, colors, dimens used in this specific screen
   - User copies only those resources to the new project
   - Clean up namespace references in resources
   
2. **Compose Migration:**
   - Convert XML layout → Jetpack Compose composables
   - Map View attributes → Compose modifiers
   - Common mappings:
     ```
     LinearLayout (vertical) → Column
     LinearLayout (horizontal) → Row
     FrameLayout → Box
     RelativeLayout → Box with alignment / ConstraintLayout
     RecyclerView → LazyColumn / LazyGrid
     ScrollView → verticalScroll modifier
     ImageView → Image / AsyncImage (Coil)
     TextView → Text
     EditText → TextField / OutlinedTextField
     Button → Button / TextButton / OutlinedButton
     ProgressBar → CircularProgressIndicator / LinearProgressIndicator
     CardView → Card (Material 3)
     Toolbar/ActionBar → TopAppBar (Material 3)
     BottomNavigationView → NavigationBar (Material 3)
     TabLayout + ViewPager → TabRow + HorizontalPager
     SwipeRefreshLayout → pullRefresh modifier
     ```

3. **ViewModel Creation:**
   - Read Smali logic flow: when API calls happen, loading states, form validation
   - Create sealed class for UI state:
     ```kotlin
     sealed interface ScreenUiState {
         data object Loading : ScreenUiState
         data class Success(val data: ScreenData) : ScreenUiState
         data class Error(val message: String) : ScreenUiState
     }
     ```
   - Expose via `StateFlow` from ViewModel
   - Handle one-time events via `SharedFlow` (navigation, snackbar, toast)

4. **Screen Composable:**
   - Collect state from ViewModel
   - Implement Material 3 theming
   - Handle navigation via Navigation Compose

---

### Step 5: Third-party SDK & Native Library Integration 📦

**Input:** User provides JNI libs list and SDK detection from Step 0.

**Tasks:**
1. **Native Libraries (.so):**
   - Keep .so files in `jniLibs/` directory
   - Declare `external fun` in Kotlin matching C/C++ signatures
   - Use `System.loadLibrary("name")` in companion object or init block
   - Document JNI method signatures

2. **SDKs (from Library Report):**
   - Add latest stable versions to `build.gradle.kts`
   - Initialize in `Application` class using modern patterns:
     ```kotlin
     @HiltAndroidApp
     class App : Application() {
         override fun onCreate() {
             super.onCreate()
             // Firebase (auto-init via manifest, or manual)
             // Timber
             if (BuildConfig.DEBUG) {
                 Timber.plant(Timber.DebugTree())
             }
         }
     }
     ```
   - Replace deprecated SDK API calls with current documentation

3. **build.gradle.kts Setup:**
   - Use Version Catalogs (`libs.versions.toml`) for dependency management
   - Configure Compose compiler, Hilt plugin, KSP
   - Set up proper minSdk, targetSdk, compileSdk

---

### Step 6: Parity Check & Quality Gate ✅

**Per-module checklist:**
1. **Branch Coverage:** Review all `if-else`, `switch/when`, `try-catch` paths from Smali
   - List discovered branches as test cases
   - Ask user to test each edge case
   
2. **API Parity:** Verify all API endpoints produce same request/response
   - Compare headers, body format, encoding
   - Test auth flow end-to-end

3. **Data Parity:** Verify local storage read/write matches original
   - Migration path from old DB schema if user needs it

4. **UI Parity:** Compare screen-by-screen
   - Layout matches (spacing, colors, interactions)
   - Navigation flow matches
   - Error states handled

5. **Performance Check:**
   - ProGuard/R8 rules for release build
   - No unnecessary allocations in Compose (stable/immutable)
   - Proper coroutine scope management

---

## 🔄 WORKFLOW INTEGRATION

### With Other Skills/Workflows:

```yaml
triggers_from:
  - "/reverse-android" workflow command
  - Keywords: "smali", "apktool", "dịch ngược", "rebuild"

delegates_to:
  - "/test" — after parity check
  - "/deploy" — when rebuild is complete
  - symphony-orchestrator — auto-track progress per step

works_with:
  - memory-sync — saves decisions, patterns, solutions
  - orchestrator — routes to this skill based on intent

independent_from:
  - brainstorm-agent
  - ios-engineer (but shares design philosophy)
```

### Session State Tracking:

```yaml
session_state:
  current_step: 0-6
  current_screen: "HomeScreen" (for step 4 iterations)
  library_report: generated | pending
  completed_screens: ["SplashScreen", "LoginScreen"]
  pending_screens: ["HomeScreen", "SettingsScreen"]
```

---

## 🚫 ANTI-PATTERNS

```yaml
never_do:
  - Copy all resources blindly from APK → only on-demand
  - Use deprecated libraries (AsyncTask, Volley) → always use modern replacements
  - Skip library scanning step → always detect reusable packages first
  - Modify encryption output → must match original exactly
  - Create massive God Activity → split into Compose screens + ViewModels
  - Hardcode API keys/secrets → use BuildConfig or encrypted storage
  - Skip parity check → always verify against original behavior

always_do:
  - Run Library Scanner (Step 0) before any coding
  - Present library report to user for approval
  - Ask user to confirm each step's output before proceeding
  - Create checkpoint summary after each step
  - Unit test all encryption/hashing utils
  - Use sealed classes for UI state
  - Follow Clean Architecture layer separation strictly
```

---

## 📊 CHECKPOINT TEMPLATE

After each step, output:

```markdown
## ✅ Step [N] Complete: [Step Name]

### What was done:
- [Summary of actions]

### Files created:
- [List of new files]

### Resources extracted:
- [List of resources moved to new project]

### Decisions made:
- [Key decisions documented]

### ⏭️ Next: Step [N+1] — [Step Name]
- [What user needs to provide]
- [What will be done]
```

---

## 🧩 EXTENSIBILITY NOTE

This skill follows the **Platform RE Template Pattern**:
- Core workflow (6 steps) is transferable to other platforms
- Technology mappings are platform-specific (this file: Android)
- Future `smali-to-swift` skill will follow same structure with iOS tech stack:
  - Smali → Swift
  - Jetpack Compose → SwiftUI
  - Room → Core Data / SwiftData
  - Retrofit → URLSession / Alamofire
  - Hilt → Swift DI patterns

---

*smali-to-kotlin v1.0.0 — Android Reverse Engineering Skill for AWF*
*Created by Antigravity Team*
