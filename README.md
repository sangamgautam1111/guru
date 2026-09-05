# Guru

### The Offline AI Tutor for Low-Connectivity Areas

[![Shipathon 2026](https://img.shields.io/badge/Shipathon-2026-blue?style=flat-square)](https://www.shipathon.com)
[![Status](https://img.shields.io/badge/Status-Shipped-brightgreen?style=flat-square)](https://github.com/sangamgautam1111/guru/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

![Guru Classroom Pilot in Nepal](assets/classroom_pilot.jpg)
*Real-world classroom pilot in Nepal: Grade 10 SEE students learning with Guru offline AI on the classroom display.*

An offline AI tutor designed to help students learn concepts with an AI model developed by Google DeepMind. We implemented a JNI–Kotlin bridge to run a quantized Gemma model directly on local hardware, whether it’s a GPU or CPU.

## Features

- **Instant CDC Syllabus MCQ Engine** — practice chapter-wise multiple-choice questions for Class 10 with 0ms lag, instant answer verification, and conceptual explanations
- **Ask by typing (Unified AI Chat)** — get step-by-step guidance across Science, Math, English, Nepali, Social Studies, Optional Math, and Computer Science in a single, focused AI tutor chat
- **Ask by photo (OCR)** — snap a picture of any textbook question using your camera; Guru reads the problem via ML Kit OCR and solves it step-by-step
- **Ask by voice (Whisper)** — speak your questions naturally through the microphone using on-device Whisper speech recognition
- **Listen to answers (TTS)** — hear explanations read aloud using local neural text-to-speech
- **Class 10 textbooks built in** — official CDC curriculum textbooks for Science, Math, Social Studies, Nepali, English, Optional Math, and Computer Science, with tailored English and Nepali medium selection
- **SEE 2081 past papers & 2082 model solutions** — all 7 provinces past exam papers and complete model solutions readable directly in the app
- **Dynamic Streak Engine** — track daily study streaks on-device to build consistent learning habits
- **Guru Dakshina & Patronage** — optional sponsorship via RevenueCat to fund offline AI kits for rural students in Nepal

## Download

Download the latest release APK directly for Android:

- **[Download Latest Release APK (v1.1.0)](https://github.com/sangamgautam1111/guru/releases/latest)**

## Setup & Progressive AI Download

1. **Install the APK**: Download and install `app-release.apk` on your Android device (Android 8.0+).
2. **Instant Learning (Zero Wait)**: Enter your name and school to immediately access all official CDC textbooks, past exam papers, and the MCQ practice engine without waiting for large downloads.
3. **On-Demand AI Download**: Tap **"Chat with Guru"** or the floating AI sphere whenever you are ready to activate the AI tutor. Guru will download the quantized Google Gemma 4 E2B (~2.5 GB) and Whisper models with live download speed, progress bar, and ETA tracking.
4. **Grant Permissions**: Allow camera and microphone permissions so you can take photos of questions and speak into the mic.
5. **Learn 100% Offline**: Turn on Airplane mode. Once the models are downloaded, all AI conversations, photo OCR solving, voice recognition, and textbooks operate completely offline with zero internet required.

## Hardware Performance Benchmark

Tested live on physical Android devices using ADB system telemetry (`dumpsys meminfo`, `dumpsys gfxinfo`, and `top`):

| Metric | OPPO A18 (Budget Tier) | Vivo Y27 5G (Performance Tier) |
| :--- | :--- | :--- |
| Model Number | CPH2591 | V2302 (PD2279F_EX) |
| Chipset / SoC | MediaTek Helio G85 (mt6768) | MediaTek Dimensity 6020 (mt6833) |
| Physical RAM | 3.8 GB (Budget 4GB tier) | 7.8 GB (Mid-range 8GB tier) |
| Android Version | Android 15 | Android 15 |
| AI Model | Google Gemma 4 E2B (litertlm) | Google Gemma 4 E2B (litertlm) |
| Model Engine | Google LiteRT-LM (4-bit Dynamic) | Google LiteRT-LM (4-bit Dynamic) |
| CPU Usage (Inference) | ~68.5% (Stable budget execution) | ~16.6% (Ultra-efficient execution) |
| UI Streaming FPS | 20 – 24 FPS | 60.0 FPS (16.6ms target) |
| Memory Pressure (OOM) | 0 Crashes (Stable headroom) | 0 Crashes (Maximum headroom) |
| Network Dependency | Offline | Offline |

## Development

To build and run Guru locally from source:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sangamgautam1111/guru.git
   cd guru
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run on Android**:
   ```bash
   npx react-native run-android
   ```

4. **Build Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

---

Made with ❤️ for Nepal students!

