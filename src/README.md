# App Architecture & Logic (`src/`)

This directory contains the TypeScript application code, curriculum data, and custom hooks that power Guru.

Originally, the entire React Native app was written inside a single 5,400-line `App.tsx` file. While that was fine for early prototyping, it became difficult to maintain and test. I refactored the entire codebase into small, single-responsibility modules under `src/`, bringing `App.tsx` down to just ~370 lines of clean navigation and orchestration.

---

## Folder Structure

```
src/
├── components/          # Reusable UI widgets
│   ├── BottomTabBar.tsx       # Bottom navigation bar (Home, Revision, Chat, Sponsor)
│   ├── FloatingChatOrb.tsx    # Floating quick-access chat trigger
│   ├── GuruDakshinaHub.tsx    # RevenueCat sponsorship UI ($1 student kit)
│   ├── MediumChooserModal.tsx # Nepali vs English textbook medium picker
│   └── SupporterBadge.tsx     # Supporter badge display (Study Supporter, Patron, Benefactor)
├── constants/           # Storage keys and asset references
│   └── storage.ts
├── data/                # Offline curriculum and revision data
│   ├── curriculumData.ts      # Class 10 CDC syllabus chapters and topics
│   ├── pastPapers2081.ts      # Official SEE 2081 board exam papers across all 7 provinces
│   ├── proSolutions.ts        # Model question solutions
│   ├── quizPool.ts            # 19-chapter science MCQ practice question bank
│   └── subjects.ts            # Subject metadata, icons, and colors
├── hooks/               # Custom React hooks (business logic isolated from UI)
│   ├── useChat.ts             # Chat state, message history, and OCR question handling
│   ├── useClock.ts            # Real-time clock for the dashboard header
│   ├── useDakshina.ts         # Sponsorship counts, badge logic, and local storage sync
│   ├── useModelManager.ts     # Downloading, progress tracking, and AI model verification
│   ├── usePdfViewer.ts        # Zoom, page navigation, and PDF document state
│   ├── useQuiz.ts             # MCQ randomized options, score tracking, and explanations
│   ├── useStreak.ts           # Daily study streak tracking with date calculations
│   └── useVoiceMode.ts        # Whisper speech recording and audio state
├── modals/              # Standalone modal dialogs
│   ├── PastPapersModal.tsx    # Past papers and model solutions viewer
│   └── PdfViewerModal.tsx     # Native full-screen textbook reader
├── screens/             # Primary app screens and tabs
│   ├── BootScreen.tsx         # Splash screen and initialization
│   ├── ChatModal.tsx          # Full-screen AI tutor chat (with accuracy disclaimer banner)
│   ├── DownloadScreen.tsx     # Gemma & Whisper on-device model manager
│   ├── HomeTab.tsx            # Main dashboard with subjects, textbooks, and daily streak
│   ├── MainScreen.tsx         # Main tab view coordinator
│   ├── OnboardingScreen.tsx   # First-time student welcome and name setup
│   └── RevisionTab.tsx        # Chapter MCQ practice and quick revision
├── services/            # Native bridges and integrations
│   ├── RevenueCatService.ts   # RevenueCat purchases, customer attributes, and offline check
│   ├── curriculum/            # Curriculum syllabus memory service
│   └── inference/             # TypeScript bridge to native Kotlin LiteRT-LM engine
├── styles/              # Global dark theme and design tokens
│   └── theme.ts
├── types/               # TypeScript interfaces and data models
│   └── index.ts
└── utils/               # Helper utilities
    └── formatGemmaResponse.ts # Cleans up model tokens and formats math markdown
```

---

## How the Core Pieces Work

### 1. Progressive Learning (Never Lock Out a Student)
In villages across Nepal, internet is slow and power cuts happen often. If the app forced students to download 2.5 GB of AI models before opening, many could never use it.
- When you first open Guru, you can immediately read all Class 10 textbooks, practice chapter MCQs, and solve SEE board papers. Everything opens right away without waiting.
- The 2.5 GB AI models (Gemma 2B and Whisper) are downloaded only when you want to use the AI chat tutor. Once downloaded, the AI works 100% offline forever.

### 2. Built-in Science MCQ Practice (`src/data/quizPool.ts`)
Instead of running heavy AI inference just to practice standard revision questions, Guru has a built-in question bank covering all 19 Class 10 science chapters. It loads instantly, scrambles the choices, gives immediate feedback, and explains why an answer is right.

### 3. Model Accuracy Disclaimer Banner (`src/screens/ChatModal.tsx`)
Because on-device language models can occasionally make mistakes on complex problems, the top bar of the chat screen includes a clear reminder:
> *"Model can be inaccurate sometimes. Please verify important answers."*

This encourages students to cross-check critical formulas and definitions against their official textbook.

### 4. RevenueCat Integration (`src/services/RevenueCatService.ts`)
Guru uses RevenueCat for **Guru Dakshina**, an optional sponsorship feature where community members can sponsor a $1 offline study kit for a rural student.
- Configured with a Google Play key (`goog_RmztSEyguCfzJskBlCWHaEUgQAL`) and Project ID `proj7a3c50f1`.
- Checks connectivity before attempting a network purchase so it never crashes in Airplane mode.
- In sideloaded builds without Google Play Billing accounts attached, it handles errors gracefully and lets reviewers test the sponsorship flow smoothly.
- Saves the sponsor's tier and student count to RevenueCat customer attributes.

### 5. Daily Study Streaks (`src/hooks/useStreak.ts`)
Tracks consecutive study days directly on the device using `AsyncStorage`. It compares calendar dates between sessions to increment streaks or reset if a day was missed—completely offline with no account or server needed.
