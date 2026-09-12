# Guru

### The Offline AI Tutor for Low-Connectivity Areas

[![Shipathon 2026](https://img.shields.io/badge/Shipathon-2026-blue?style=flat-square)](https://www.shipathon.com)
[![RevenueCat](https://img.shields.io/badge/RevenueCat-Next_Gen_Track-ff5a5f?style=flat-square&logo=revenuecat)](https://github.com/sangamgautam1111/guru/blob/master/src/services/RevenueCatService.ts)
[![Demo Video](https://img.shields.io/badge/Demo_Video-YouTube-red?style=flat-square&logo=youtube)](https://youtu.be/pWdVwdpM14A?si=Ti_yTDg1_KZKW3tb)
[![Status](https://img.shields.io/badge/Status-Shipped-brightgreen?style=flat-square)](https://github.com/sangamgautam1111/guru/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Guru is an offline AI tutor for rural students in Nepal, powered by on-device LiteRT-LM (Gemma 2B) and RevenueCat.

![Guru Classroom Pilot in Nepal](assets/classroom_pilot.jpg)
*Grade 10 students in rural Nepal learning with Guru offline AI in their classroom.*

## The Story Behind Guru

One night, I was studying for my SEE exams and the power went out. No light, no internet - I couldn't study for the rest of the night.

It got me thinking - what if there was an AI tutor that could teach you even when the internet is gone? UNICEF says over a billion students worldwide don't have internet access, with the highest numbers in South Asia and West and Central Africa.

I decided to stop thinking about it globally and focus on what I know - Nepal. I went to Kavre, my village, and talked to a student named Milan. I asked him what his biggest problem with studying was. He said:

> "Whenever I have doubts in my studies, it is difficult to find answers by searching the internet or using AI, because internet access is limited in our village."

![Milan carrying his study materials in Kavre, Nepal](https://raw.githubusercontent.com/sangamgautam1111/guru/master/assets/student_milan.jpg)
*Milan carrying his study materials in Kavre, Nepal.*

That gave me the clarity I needed. I'm 14, and I knew exactly what had to be built. I picked Google's Gemma 4 E2B model and ran it through LiteRT - even on devices with low RAM, the kind of phones students in these areas actually have.

That's how Guru started.

## Demo Video

Watch the 1:58 walkthrough running on a physical Android device:

- **[Watch Guru Demo on YouTube (1:58)](https://youtu.be/pWdVwdpM14A?si=Ti_yTDg1_KZKW3tb)**
- **[Teacher Feedback Video (MP4)](https://github.com/sangamgautam1111/guru/releases/download/v1.3.0/teacher_feedback.mp4)**: Real educator feedback on how Guru assists Grade 10 SEE students in rural Nepal.

## Features

- **Ask by typing** - chat with Guru one-on-one about Science, Math, English, Nepali, Social Studies, Optional Math, or Computer Science and get step-by-step help
- **Model accuracy disclaimer** - clear reminder banner in the chat screen to verify critical answers with textbooks
- **Ask by photo** - snap a picture of a textbook problem using your camera, the app reads it through OCR and solves it
- **Ask by voice** - speak your question through the mic using Whisper speech recognition, completely offline
- **Listen to answers** - the app reads solutions back to you out loud using neural text-to-speech
- **Practice MCQs** - quick chapter-wise multiple choice questions with instant answers and explanations to test what you learned
- **Class 10 textbooks built in** - Science, Math, Social Studies, Nepali, English, Optional Math, and Computer Science textbooks (with English and Nepali medium choices for Science and Math), readable inside the app
- **SEE 2081 past papers** - province-wise past papers for Science, Math, English, Nepali, Social Studies, Optional Math, and Computer Science from all 7 provinces
- **SEE 2082 model paper solutions** - full solutions for Science, Math, English, Nepali, and Social Studies
- **Daily study streaks** - track your daily streak to stay consistent every day
- **In-app PDF reader** - zoom, navigate pages, everything inside the app without needing any external app
- **Guru Dakshina** - optional $1 sponsorship to fund an offline AI kit for a rural student

## Download

Download the latest release APK directly for Android:

- **[Download Latest Release APK](https://github.com/sangamgautam1111/guru/releases/latest)**

## Setup

1. **Install the APK**: Download and install `app-release.apk` on your Android device (Android 8.0+).
2. **Start studying right away**: Open the app, type in your name, and you can immediately read textbooks, practice MCQs, or look at past papers. You don't have to wait for any big downloads to get started.
3. **Download AI models when ready**: When you want to chat with Guru, tap "Chat with Guru" to download the Gemma and Whisper models (~2.5 GB). You'll see real-time download speed and progress.
4. **Grant permissions**: Allow camera and microphone access so you can take photos of textbook questions and speak into the mic.
5. **Study offline**: You can turn on Airplane mode to test it. Once the model is on your device, asking questions, photo solving, voice questions, and all textbooks run right on your phone without needing any internet connection. If the model ever seems stuck on loading, tap "Clear Chat" and try asking once more.

## RevenueCat Integration (Guru Dakshina)

Guru is built for the **RevenueCat Shipathon 2026 (Next Gen Track)**.

Instead of putting a paywall in front of students who can barely afford school books, I built **Guru Dakshina**. It lets community members, alumni, and supporters sponsor offline study kits for students who need them.

[![View RevenueCat Code](https://img.shields.io/badge/View_RevenueCat_Code-src/services/RevenueCatService.ts-ff5a5f?style=for-the-badge&logo=revenuecat)](https://github.com/sangamgautam1111/guru/blob/master/src/services/RevenueCatService.ts)

You can check out the clean code in [`src/services/RevenueCatService.ts`](src/services/RevenueCatService.ts), [`src/hooks/useDakshina.ts`](src/hooks/useDakshina.ts), and [`src/components/GuruDakshinaHub.tsx`](src/components/GuruDakshinaHub.tsx).

### The $1 Student Kit (Parent's Phone — Zero Internet)
In villages across Nepal, students don't own laptops or Wi-Fi routers. When their parents come home from work in the evening, the students borrow the parent's phone to study.

Each $1 sponsorship funds the full setup on a parent's phone:
- All official Class 10 CDC textbooks (Science, Math, Social, English, Nepali, Opt Math, Computer Science)
- All 7 provinces SEE 2081 board question papers and answers
- Chapter-by-chapter practice MCQs
- The Gemma 2B AI tutor running right on the phone

Supporters can sponsor 1 student or use the counter to sponsor 3, 5, 10, or more students ($1 per student).

### How I Fixed the Release Build Crash with RevenueCat
When I built the release APK (`assembleRelease`), the app suddenly crashed right after opening with a popup: *"Wrong API Key... The app will close now to protect the security of test purchases."*

Here is why that happened and how I fixed it:

1. **The fix (`goog_` key)**: RevenueCat's Android SDK does not allow test keys (`test_...`) in release builds. It does this on purpose so nobody ships a test store to real users. In [`src/services/RevenueCatService.ts`](src/services/RevenueCatService.ts), I replaced the test key with my real Google Play key:
   ```typescript
   const REVENUECAT_API_KEY = 'goog_RmztSEyguCfzJskBlCWHaEUgQAL';
   ```
   Because the key starts with `goog_`, RevenueCat recognizes it as a valid production key. The app boots cleanly without any warning or shutdown.

2. **Airplane mode check**: If you turn off your Wi-Fi and mobile data, the app doesn't freeze or throw an error. It simply tells you that you are offline and lets you keep studying.

3. **Fallback for sideloaded testing**: When testing this APK directly without Google Play Billing connected, the app catches that gracefully. It lets you test the sponsorship flow, updates your sponsor count in phone storage, and unlocks your supporter badge.

4. **Supporter badges**: When you sponsor students, you get a clean vector icon badge right on top:
   - 1–2 students: Study Supporter
   - 3–9 students: Classroom Patron
   - 10+ students: Vidya Guru Benefactor
   I used clean Lucide line icons so it looks sharp and well-built.

5. **Customer Attributes**: Every time someone sponsors students, the app saves their tier and total students sponsored directly to RevenueCat customer attributes.

### Testing the RevenueCat Sponsorship (For Reviewers)

Since Guru is submitted as a standalone APK for the Next Gen Track without a live Google Play Store listing, here is how you can test the sponsorship flow smoothly on your phone:

1. **Turn on Wi-Fi or mobile data**: The AI tutor and all textbooks work completely offline, but sponsoring needs an internet connection to talk to RevenueCat.
2. **Open the "Guru Dakshina" tab** (the heart icon at the bottom).
3. **Pick how many students to sponsor** using the `-` / `+` counter or the quick buttons (like `1 St.`, `3 St.`, or `5 St.`).
4. **Tap "Sponsor Now"**:
   - The app connects to RevenueCat using my Google Play key (`goog_RmztSEyguCfzJskBlCWHaEUgQAL`).
   - Since this is a sideloaded APK without Google Play Store billing accounts attached, the app catches that cleanly. It runs the sponsorship test, saves your student count in phone storage, syncs with RevenueCat customer attributes, and unlocks your supporter badge right away without crashing or showing a billing error.
   - If you test this inside a Google Play sandbox account, the native Google Play purchase sheet will open directly.
5. **Check your supporter badge**: Look at the top of the screen — you will see your new supporter badge (like *Study Supporter* or *Classroom Patron*) and your sponsored student count updated.
6. **Testing Restore**: You can also tap "Restore Previous Sponsorship" at the bottom to verify that RevenueCat checks your past sponsorship status.

## Tested On Real Devices

I tested Guru on real physical phones to see how it performs across different hardware:

| Phone | Chipset | RAM | AI Speed | How it runs |
| :--- | :--- | :--- | :--- | :--- |
| **Vivo Y27 5G** | MediaTek Dimensity 6020 | 8 GB | ~5.0 tok/s | GPU acceleration (Mali OpenCL) |
| **Redmi A4 5G** | Snapdragon 4s Gen 2 | 8 GB | ~1.8 tok/s | CPU fallback (Qualcomm OpenCL limit) |
| **Realme C51/C53** | Unisoc Tiger T612 | 4 GB | ~1.6 tok/s | GPU acceleration (Mali OpenCL, 1.67 GB PSS) |
| **OPPO A18** | MediaTek Helio G85 | 4 GB | ~1.6 tok/s | CPU mode (safe for 4GB RAM) |

- **GPU mode**: On phones with capable GPUs (like the Dimensity 6020 and Unisoc T612 with Mali-G57), the model runs directly on the GPU using OpenCL.
- **CPU fallback**: On budget Qualcomm phones (like the Redmi A4) where the Adreno GPU has driver workgroup limits, the app automatically switches over to ARM NEON CPU execution without dropping requests, generating at around 1.8 tokens per second.



## Codebase Architecture

Originally, Guru was built as a single 5,400-line prototype in `App.tsx`. To keep the code clean, reliable, and easy to maintain, I refactored the entire application into a modular architecture under `src/`:

```mermaid
flowchart TB
    %% ============================================================
    %% GURU SYSTEM ARCHITECTURE · 100% ON-DEVICE EDGE AI ENGINE
    %% ============================================================

    subgraph CLIENT ["📱 Client Layer · React Native & TypeScript"]
        direction TB
        INPUTS["<b>Tri-Modal Input Engine</b><br/>• LaTeX Keyboard Typing<br/>• Google ML Kit Camera OCR<br/>• Whisper On-Device STT"]
        
        UI["<b>UI & Orchestration (~370 LOC)</b><br/>App.tsx · Home · Revision · Chat · Dakshina"]
        
        HOOKS["<b>Domain Hooks & State Separation</b><br/>useChat · useDakshina · useModelManager · useQuiz · usePdfViewer"]
        
        INPUTS --> UI
        UI --> HOOKS
    end

    subgraph MONETIZATION ["💖 Ethical Patron Engine · RevenueCat SDK"]
        direction TB
        RC_SVC["<b>RevenueCatService.ts</b><br/>Production Key (goog_...) · Offline Pre-Flight Guard"]
        RC_PURCHASE["<b>Micro-Sponsorships ($1 - $20)</b><br/>1-Kit Sponsor · Classroom Patron · Benefactor"]
        RC_ATTRS["<b>Customer Attributes Sync</b><br/>Lifetime Kits · Sponsor Tier Badge · Donor History"]
        
        RC_SVC --> RC_PURCHASE
        RC_PURCHASE --> RC_ATTRS
    end

    subgraph NATIVE ["⚙️ Native Android Engine · Kotlin & Custom JNI"]
        direction TB
        JNI["<b>LLMInferenceModule.kt</b><br/>Custom JNI Bridge · Token Stream Dispatcher"]
        BG_SVC["<b>ModelDownloadService.kt</b><br/>Foreground Service · Android WakeLocks · Byte-Range Resume"]
        RAM_GATE["<b>RAM-Binding Gate</b><br/>Pre-warms weights · Guarantees zero-lag entry"]
        
        BG_SVC --> RAM_GATE
        RAM_GATE --> JNI
    end

    subgraph ENGINE ["🧠 Edge AI Engine · Google LiteRT-LM (C++)"]
        direction TB
        MODEL["<b>Gemma 4 E2B IT Model</b><br/>INT4 Quantized (~2.5 GB) · Local Storage"]
        MEM["<b>Dynamic Memory Allocator</b><br/>1.67 GB PSS Allocation · 2,048 Token Context"]
        ROUTER{"<b>Hardware Compute Router</b><br/>Checks Driver OpenCL Workgroups & RAM"}
        
        MODEL --> MEM
        MEM --> ROUTER
    end

    subgraph COMPUTE ["⚡ Dual Hardware Dispatch (100% Airplane Mode)"]
        direction TB
        GPU["<b>OpenCL GPU Acceleration</b><br/>Mali-G57 Pipeline (Vivo Y27, Realme C51/C53)<br/><b>~5.0 tok/s</b> · Native Mobile GPU Execution"]
        
        CPU["<b>Zero-Drop ARM NEON CPU Fallback</b><br/>Adreno 619 & Helio G85 (Redmi A4, OPPO A18)<br/><b>~1.8 tok/s</b> · Status 13 Workgroup Auto-Failover"]
        
        ROUTER -->|Capable GPU Driver| GPU
        ROUTER -->|Workgroup Limit Exceeded| CPU
    end

    subgraph CURRICULUM ["📚 Bundled Curriculum Vault (Zero Cloud Dependency)"]
        direction TB
        PDF["<b>Native PDF Engine</b><br/>Instant Page Zoom & Offline Navigation"]
        BOOKS["<b>7 CDC Textbooks</b><br/>Science · Math · Social · English · Nepali · Opt Math · CS"]
        SOLUTIONS["<b>SEE 2081 & 2082 Solutions</b><br/>7-Province Board Papers · Step-by-Step Derivations"]
        MCQ["<b>19-Chapter Science MCQs</b><br/>Instant Verification & Offline Grading"]
        
        PDF --> BOOKS
        PDF --> SOLUTIONS
        PDF --> MCQ
    end

    %% Cross-Domain Data Pipelines
    HOOKS -->|Sponsorship Calls| RC_SVC
    HOOKS -->|Inference Invocations| JNI
    HOOKS -->|Background Fetch| BG_SVC
    UI -->|Instant Local Study| PDF
    JNI -->|Native C++ Bridge| MODEL
    GPU -->|Real-Time Token Stream| JNI
    CPU -->|Real-Time Token Stream| JNI

    %% High-Contrast Theme Styling
    classDef clientStyle fill:#f0f9ff,stroke:#0284c7,stroke-width:2px,color:#0f172a;
    classDef nativeStyle fill:#f8fafc,stroke:#475569,stroke-width:2px,color:#0f172a;
    classDef engineStyle fill:#faf5ff,stroke:#7c3aed,stroke-width:2px,color:#0f172a;
    classDef computeGpu fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#0f172a;
    classDef computeCpu fill:#fffbeb,stroke:#d97706,stroke-width:2px,color:#0f172a;
    classDef rcStyle fill:#fff1f2,stroke:#e11d48,stroke-width:2px,color:#0f172a;
    classDef curriculumStyle fill:#f0fdf4,stroke:#16a34a,stroke-width:2px,color:#0f172a;

    class INPUTS,UI,HOOKS clientStyle;
    class JNI,BG_SVC,RAM_GATE nativeStyle;
    class MODEL,MEM,ROUTER engineStyle;
    class GPU computeGpu;
    class CPU computeCpu;
    class RC_SVC,RC_PURCHASE,RC_ATTRS rcStyle;
    class PDF,BOOKS,SOLUTIONS,MCQ curriculumStyle;
```

- **`src/screens/`** — Screen components (`HomeTab`, `RevisionTab`, `ChatModal`, `DownloadScreen`, `OnboardingScreen`, `BootScreen`).
- **`src/hooks/`** — Custom React hooks separating UI from business logic (`useChat`, `useQuiz`, `useStreak`, `useDakshina`, `useModelManager`, `usePdfViewer`, `useVoiceMode`).
- **`src/services/`** — RevenueCat integration (`RevenueCatService.ts`), native AI engine bridges (`GemmaRunner.ts`), and curriculum syllabus memory.
- **`src/data/`** — Official CDC syllabus chapters, SEE board exam papers, model solutions, and 19-chapter science MCQ practice banks.
- **`src/components/`** — Reusable UI widgets, navigation bar, and supporter badge displays.
- **`App.tsx`** — Lightweight ~370-line orchestrator handling top-level screen transitions.

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

Made with dedication for students across Nepal.

