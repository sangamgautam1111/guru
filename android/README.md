# Native Android Engine (`android/`)

This directory contains the native Android code (Kotlin and C++) that powers Guru.

When I started building Guru, I tried doing everything in pure React Native. But running a 2.5 GB local AI model on a budget phone isn't possible in plain JavaScript. A phone needs to load heavy neural weights directly into RAM, work with OpenCL GPU shaders or ARM NEON CPU instructions, and stay alive even when Android tries to kill background tasks to save battery.

To make this work on the actual phones students use in Nepal, I built custom native modules in Kotlin that talk directly to device hardware, Google's LiteRT-LM runtime, and Android system services.

---

## How It's Structured

```
React Native UI (ChatModal / useChat)
       │ (JNI Bridge)
       ├── LLMInferenceModule.kt
       │      ├── LiteRT-LM (Gemma 2B INT4)
       │      │     ├── GPU Backend (OpenCL via Mali-G57)
       │      │     └── CPU Fallback (ARM NEON for Snapdragon / low-RAM)
       │      ├── ONNX Runtime (Whisper speech-to-text)
       │      ├── Google ML Kit (Textbook photo OCR)
       │      ├── Android PdfRenderer (Fast, native textbook reading)
       │      └── Android TextToSpeech (Reads answers out loud)
       │
       └── ModelDownloadService.kt
              ├── Foreground Service (keeps downloading when screen locks)
              ├── HTTP Range Resumes (doesn't restart if Wi-Fi drops)
              └── WakeLock & WifiLock (stops phone from sleeping during download)
```

---

## What the Native Code Does

### 1. `LLMInferenceModule.kt` — The Offline AI Brain

This is the main native module (~2,000 lines of Kotlin). It handles loading the model, running inference, and making sure the app never freezes or crashes:

- **GPU First, Safe CPU Fallback**:
  When testing across different phones, I ran into an interesting hardware reality:
  - On phones like the **Vivo Y27 5G** (Dimensity 6020 / Mali GPU), OpenCL workgroups of 512 work great, giving around **5 tokens/sec**.
  - On budget Qualcomm chips like the **Redmi A4 5G** (Snapdragon 4s Gen 2 / Adreno GPU), the OpenCL driver only supports workgroups up to 256. LiteRT crashes if you force it onto the GPU.
  - To solve this, the module catches GPU initialization and driver errors automatically and falls back to multi-threaded CPU execution (ARM NEON) at ~1.8 tokens/sec. The student never sees a crash or an error popup—it just works.

- **Background Worker Queue**:
  All C++ inference runs on a dedicated single-thread background executor. This keeps the Android UI thread at 60 FPS so scrolling and typing stay completely smooth while the model is thinking.

- **Loop Breaker for Quantized Weights**:
  4-bit quantized models can sometimes repeat phrases when writing long step-by-step math answers. I wrote an n-gram repetition detector that checks streaming tokens in real time. If a repeating loop is caught, it cleanly stops generation and keeps the good part of the answer.

- **Memory Management**:
  Before loading the model, the module checks available RAM. On phones with 4 GB of RAM, it limits the context window to 2,048 tokens and cleans up sessions after each prompt to prevent Android from killing the app.

- **Built-in OCR, Voice, and Books**:
  - **Camera OCR**: Uses Google ML Kit to pull text from photos of textbook questions.
  - **Whisper Voice**: Runs a quantized speech model via ONNX Runtime so students can ask questions by speaking.
  - **Native PDF Reading**: Uses Android's native `PdfRenderer` instead of heavy npm PDF packages, keeping memory light while scrolling CDC textbooks.

### 2. `ModelDownloadService.kt` — Surviving Spotty Village Wi-Fi

Downloading a ~2.5 GB model file over rural Wi-Fi in Nepal is tough. The power can cut out, or the Wi-Fi can drop midway through:

- **Resume from where it stopped**: Uses HTTP `Range` headers. If a download drops at 1.7 GB, it checks the file on disk and resumes from byte 1.7 GB instead of starting from zero.
- **Foreground Service**: Runs with an ongoing notification so Android's memory manager won't kill it in the background.
- **WakeLock & High-Performance WifiLock**: Keeps the Wi-Fi antenna and CPU active so the download keeps running even when the screen turns off.
- **Auto-Reconnect**: Tries reconnecting up to 50 times with exponential backoff if the router restarts or power drops temporarily.

---

## Build Targets

- **Target SDK**: 35 (Android 15)
- **Compile SDK**: 34
- **Build Tools**: 34.0.0
- **NDK Version**: 26.1.10909125
- **Kotlin Version**: 2.0.21
- **ABIs**: `arm64-v8a`, `armeabi-v7a`


