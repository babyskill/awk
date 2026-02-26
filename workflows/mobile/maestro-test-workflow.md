---
description: 🧪 Tạo bài kiểm tra UI tự động với Maestro
alwaysApply: false
priority: "high"
---

# Maestro Test Creation Workflow

## 🎯 Purpose
Automate UI testing for Android and iOS applications using [Maestro](https://maestro.dev). This workflow guides the creation of robust, readable, and maintainable test flows.

## 📋 Prerequisites
- Maestro CLI installed (`curl -Ls "https://get.maestro.mobile.dev" | bash`).
- Android Emulator or iOS Simulator running.
- Target app installed on the device.

## 🛠️ Workflow Steps

### 1. Analysis & Setup
- **Identify the User Flow**: What are we testing? (e.g., "Add Contact", "Login", "Checkout").
- **Determine App ID**: Find the package name (Android) or bundle ID (iOS).
    - Android: `adb shell dumpsys window | grep -E 'mCurrentFocus|mFocusedApp'`
- **Create File**: Create a new `.yaml` file (e.g., `flows/add-contact.yaml`).

### 2. Flow Definition (The Script)

Start with the header:
```yaml
appId: com.example.app
---
- launchApp:
    clearState: true # Optional: Reset app state
```

### 3. Implementing Steps

Use the following commands to interact with the UI:

#### Basic Interactions
- **Tap**: `tapOn: "Text on Screen"` or `tapOn: id: "view_id"`
- **Input text**: `inputText: "Hello World"`
- **Input Random**: `inputRandomPersonName`, `inputRandomEmail`
- **Wait**: `assertVisible: "Success"` (Maestro waits automatically, but assertions confirm state).

#### Example Structure (Contacts Flow)
```yaml
appId: com.android.contacts
---
- launchApp
- tapOn: "Create new contact"
- tapOn: "First name"
- inputRandomPersonName
- tapOn: "Last name"
- inputRandomPersonName
- tapOn: "Phone"
- inputRandomNumber:
    length: 10
- back # Hide keyboard if needed
- tapOn: "Save"
- assertVisible: "Contact saved" # Verification
```

### 4. Refining Selectors
If text matches are ambiguous, use `maestro studio` to find precise selectors:
1. Run `maestro studio` in terminal.
2. Open web browser to the provided URL.
3. Click elements to get their ID or precise text.

### 5. Execution & Debugging
- **Run the flow**: `maestro test flows/add-contact.yaml`
- **Continuous Run** (Dev Mode): `maestro test -c flows/add-contact.yaml`
- **Debug**: If it fails, check the emulator screen. Maestro takes screenshots on failure.

## 💡 Best Practices
- **Atomic Flows**: Keep flows focused on one main task.
- **Subflows**: Use `runFlow` for reusable components (e.g., Login).
- **Clean State**: Prefer `clearState: true` for deterministic tests.
- **Assertions**: Always end with an assertion (`assertVisible`) to prove the test succeeded.
- **Constants**: Use `env` variables for dynamic data if needed.

## 🗣️ QA/Dev Guidelines
- "Don't just run it, `assert` it."
- "If you can't tap it, check the text visibility."
- "Use `inputRandom...` for data that needs to be unique."
