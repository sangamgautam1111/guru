# Guru Native Android Engine (ndroid/)

This directory contains the custom native Android implementation powering **Guru's on-device AI inference engine**, speech recognition, optical character recognition (OCR), and background download resilience.

---

## Core Native Components

### 1. LLMInferenceModule.kt
The central JNI bridge connecting React Native to Google's **LiteRT-LM C++ runtime**.
- **Model Loading**: Maps the 4-bit dynamically quantized Gemma 4 E2B model (litertlm) into system memory.
- **Hardware-Aware Backend Selection**: Automatically prioritizes GPU compute shaders if supported drivers exist, with an instant, crash-free fallback to multi-threaded CPU execution for budget chipsets (e.g., MediaTek Helio G85).
- **Streaming Generation**: Emits token chunks (LiteRTResponseChunk) across the React Native bridge in real time without blocking the Android UI thread.
- **Memory Management**: Enforces strict context window limits to ensure stable execution on devices with 3 to 4 GB of RAM.

### 2. ModelDownloadService.kt
A high-resilience Android **Foreground Service** engineered for low-connectivity environments.
- **HTTP Byte-Range Resume**: Uses Range: bytes={offset}- headers with HTTP 206 Partial Content so interrupted downloads continue from the exact byte rather than restarting from zero.
- **System Locks**:
  - PARTIAL_WAKE_LOCK: 12-hour background execution lock to prevent Android deep sleep from killing downloads when the display turns off.
  - WifiLock (WIFI_MODE_FULL_HIGH_PERF): Prevents Wi-Fi chip throttling during screen-off operation.
- **Exponential Backoff**: Up to 50 automatic reconnection attempts with exponential backoff to handle temporary Wi-Fi drops.

### 3. Speech & Vision Pipeline
- **On-Device Whisper STT**: Quantized Whisper model running natively to transcribe spoken questions offline.
- **Google ML Kit Vision**: High-accuracy on-device text recognition for printed and handwritten textbook questions.

---

## Build Configuration

- **Target SDK**: 35 (Android 15)
- **Compile SDK**: 34
- **Build Tools**: 34.0.0
- **NDK**: 26.1.10909125
- **Kotlin**: 2.0.21
- **Supported Architectures**: rm64-v8a, rmeabi-v7a
