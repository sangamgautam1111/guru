# Native Android Engine (`android/`)

This folder contains the native Kotlin and C++ layer of Guru. Because React Native can't run large AI models or low-level background services on its own, I wrote custom Android code to handle the heavy lifting.

---

## How the Native Code Works

### 1. `LLMInferenceModule.kt` (The AI Engine Bridge)
This is the bridge connecting our React Native UI to Google's **LiteRT-LM C++ runtime**.
- **Runs Gemma on Phone RAM**: Loads the 4-bit quantized Gemma 4 E2B model directly into device memory so answers generate without any internet.
- **Hardware Fallback**: It checks the phone hardware automatically. If the GPU supports AI shaders, it uses it for speed; if not (like on budget MediaTek chips common in Nepal), it smoothly falls back to multi-core CPU execution so the phone never crashes.
- **Live Streaming**: Streams tokens back to the screen as soon as they are generated so students don't have to wait for the full answer to load.
- **Low-RAM Protection**: Caps the context window to prevent Out-Of-Memory (OOM) crashes on 3GB and 4GB RAM phones.

### 2. `ModelDownloadService.kt` (Background Download Resumes)
Downloading 2.5 GB on slow, unstable Wi-Fi in Nepal was one of my biggest challenges. This foreground service keeps downloads safe:
- **Resumes From Exact Byte**: Uses HTTP `Range` headers so if the connection drops at 75%, it picks up right at 75% when reconnected instead of restarting from zero.
- **Screen-Off Protection**: Acquires a `WakeLock` and high-performance `WifiLock` so Android's battery saver doesn't pause or kill the download when you lock your screen.
- **Automatic Reconnects**: Tries up to 50 times with backoff delays to survive power cuts and spotty Wi-Fi.

### 3. Voice and Camera
- **On-Device Whisper**: Transcribes spoken questions into text completely offline using a quantized Whisper model.
- **Google ML Kit OCR**: Recognizes printed and handwritten text from textbook photos taken by the camera.

---

## Build Specs

- Target SDK: 35 (Android 15)
- Compile SDK: 34
- Build Tools: 34.0.0
- NDK: 26.1.10909125
- Kotlin: 2.0.21
- Supported Architectures: arm64-v8a, armeabi-v7a
