# Native Android Engine (`android/`)

This directory houses the native Kotlin and C++ layer of Guru. 

When building an offline AI tutor for students in rural Nepal, React Native alone simply couldn't cut it. Standard JavaScript runtimes cannot load multi-gigabyte neural weights into memory, interface with hardware shader pipelines, or survive the aggressive background battery managers common on budget Android phones.

To solve this, I wrote custom native Android modules that interface directly with device hardware, Google's LiteRT-LM C++ runtime, ONNX Runtime, and core Android system services.

---

## Architecture Overview

```
React Native Bridge (JNI)
       │
       ├── LLMInferenceModule.kt ──> LiteRT-LM (Google Gemma 4 E2B)
       │                         ──> ONNX Runtime (Whisper Voice)
       │                         ──> Google ML Kit (Textbook OCR)
       │                         ──> Android Native PdfRenderer
       │                         ──> Android Neural Text-To-Speech
       │
       └── ModelDownloadService.kt ──> Foreground Service (Resumable 2.5 GB downloads)
                                   ──> WakeLock & High-Perf WifiLock
```

---

## Deep Dive: How the Native Components Work

### 1. `LLMInferenceModule.kt` (The On-Device AI Engine)

This is the core native module (over 2,000 lines of Kotlin) that turns a student's phone into an autonomous AI classroom without needing the internet.

- **LiteRT-LM C++ Runtime Integration**: We dynamically load the 4-bit quantized Google Gemma 4 E2B model weights (`.litertlm` format) straight into physical RAM.
- **Dynamic Hardware Negotiation (GPU vs CPU)**: Many phones in Nepal run budget MediaTek chipsets (like the Helio G85) where GPU shader compilation for LLMs can either fail or cause driver panics. The module performs hardware capability checks on startup. If OpenCL/Vulkan GPU acceleration is safe, it routes computation to the GPU; otherwise, it smoothly falls back to multi-threaded CPU execution with optimized NEON vector math.
- **Low-Memory (OOM) Defense**: Phones with 3 GB or 4 GB RAM will immediately kill apps that exceed heap boundaries. The module monitors system memory pressure using `ActivityManager.MemoryInfo`, dynamically scales the context window (capping at 2,048 tokens on low-tier hardware), and forces clean garbage-collection sweeps between inference runs.
- **Degenerate Loop & Repetition Breaker**: Quantized models can occasionally get stuck in repetitive token loops when answering complex questions. I engineered an on-the-fly n-gram ring buffer in Kotlin that monitors incoming tokens in real time. If a repeating cycle is detected, it terminates the stream cleanly and presents a complete, coherent answer.
- **Native PDF Renderer**: Instead of bundling heavy third-party PDF engines that bloat the APK and lag on budget phones, we tap directly into Android's native `android.graphics.pdf.PdfRenderer`. It renders vector textbook pages into smooth hardware-accelerated bitmaps at 60 FPS.
- **Offline Multimodal Stack**:
  - **OCR**: Integrated Google ML Kit Latin Text Recognition for zero-lag extraction of question text from camera snaps.
  - **Voice (Whisper)**: Quantized speech-to-text running via ONNX Runtime so students can ask questions by speaking in their natural voice.
  - **TTS**: Android's `TextToSpeech` engine configured with Nepali and English language profiles to read solutions out loud.

### 2. `ModelDownloadService.kt` (Surviving Unstable Wi-Fi)

Downloading 2.5 GB of AI model weights on slow, spotty Wi-Fi in Nepal was one of the hardest problems to solve. A single network hiccup or screen lock could ruin an hour-long download. 

Here is how I built the downloader to be rock-solid:

- **HTTP `Range` Header Resumes**: The service writes chunks directly to disk using `RandomAccessFile`. If the connection drops at 1.8 GB, it doesn't start over. It inspects the existing byte count on disk and sends a `Range: bytes=X-` request, resuming from the exact byte where it paused.
- **Foreground Service with Persistent Notification**: Runs as an official Android `ForegroundService` with notification priority, so the operating system never kills the download process to reclaim memory.
- **WakeLock & WifiLock Protection**: Acquires `PowerManager.PARTIAL_WAKE_LOCK` and `WifiManager.WIFI_MODE_FULL_HIGH_PERF`. This prevents Android's aggressive battery optimizations (Doze mode) from putting the Wi-Fi radio to sleep when the student locks their screen.
- **Exponential Backoff Reconnects**: Tries up to 50 times with progressive delays to silently reconnect through load shedding power cuts and router restarts.
- **Live Streamed Telemetry**: Emits live download speed (KB/s and MB/s), downloaded bytes, and remaining ETA events to the React Native UI.

---

## Build Configuration & SDK Targets

- **Target SDK**: 35 (Android 15)
- **Compile SDK**: 34
- **Build Tools**: 34.0.0
- **NDK Version**: 26.1.10909125
- **Kotlin Version**: 2.0.21
- **ABI Filters**: `arm64-v8a`, `armeabi-v7a`

