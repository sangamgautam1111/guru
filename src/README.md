# App Services, Curriculum Logic & UI (`src/`)

This directory houses the TypeScript application logic, CDC curriculum memory, and service bridges that power Guru's user experience.

---

## Architectural Philosophy

When building Guru, our core rule was simple: **never block a student from learning**. 

Early iterations forced students to download 2.5 GB of AI models on the very first screen before they could see anything. In rural Nepal, where mobile data is expensive, internet is spotty, and electricity can cut out, that meant students were locked out of their textbooks on day one.

We re-architected the entire app around **progressive access**:
1. **Instant Curriculum Access**: The moment a student opens Guru, all official Grade 10 CDC textbooks (Science, Math, Social, Nepali, English, Opt Math, Computer), SEE past papers from all 7 provinces, model solutions, and chapter-wise MCQs are immediately accessible. They are bundled directly inside the app and open with 0ms delay.
2. **On-Demand AI Activation**: The 2.5 GB Google Gemma 4 and Whisper downloads are shifted to just-in-time activation. When a student decides to ask the AI Tutor a question, the app checks if the weights are on disk. If not, it smoothly opens the model manager with live progress, speed, and ETA. Once downloaded, everything runs 100% offline forever.

---

## Key Modules & Components

### 1. `scienceSyllabusMemory.ts` (Instant 0ms MCQ Engine)
Rather than making slow, battery-draining AI inference calls for standard syllabus revision questions, I built an authentic curriculum memory bank containing real Class 10 CDC exam questions:
- Covers all 19 major science chapters: Force, Pressure, Energy, Heat, Light, Electricity & Magnetism, Classification of Elements, Chemical Reaction, Acid Base & Salt, Some Gases, Metals, Carbon & Compounds, Heredity, Reproduction, Nervous & Glandular System, Blood Circulation, Nature & Environment, Earth History, and the Universe.
- Instant 0ms retrieval with zero layout shifts or CPU spikes.
- Shuffled option distribution and instant answer verification with clear conceptual explanations.

### 2. `MathMarkdownRenderer.tsx` (Readable Formulas in Dark Mode)
Science and mathematics answers require clean, precise typography:
- Parses LaTeX syntax (`$F = G \frac{m_1 m_2}{r^2}$`, chemical equations, radical signs, exponents).
- Renders readable mathematical formulas seamlessly within dark-mode chat bubbles.

### 3. `SubjectIllustrations.tsx` (Handcrafted Visual Identity)
To make the interface welcoming for young students, this component renders custom, resolution-independent SVG illustrations for every subject card:
- Beakers and atoms for Science
- Compass and geometry for Mathematics
- Nepal flag and heritage for Social Studies
- Code brackets for Computer Science
- Books and quills for Languages

### 4. `src/services/inference/GemmaRunner.ts`
The typed TypeScript bridge that talks to our native Kotlin `LLMInferenceModule`:
- Subscribes to native `onTokenStream` events for real-time streaming text rendering.
- Listens for `onModelLoaded`, `onInferenceComplete`, and error events.
- Provides clean `Promise`-based async APIs for starting generation, resetting sessions, and checking model status.

### 5. `src/services/curriculum/CurriculumService.ts` & `src/data/curriculumData.ts`
- Injects authentic CDC syllabus context into prompt templates so Gemma answers according to the official Nepal SEE marking criteria rather than generic web answers.
- Holds formulas, chapter weightages, and past exam patterns.

### 6. Dynamic On-Device Streak Engine
- Tracks consecutive study days using local `AsyncStorage` (`STORAGE_KEYS.streakData`).
- Compares calendar day timestamps between sessions to automatically increment streaks or reset them if a day is missed.
- Requires zero backend servers or user accounts to function.

### 7. RevenueCat Dakshina & Patronage Subsystem
- Integrates `react-native-purchases` for community patronage.
- Entitlement: `patron`, product: `guru_sponsor_monthly`, offering: `default`, package: `$rc_monthly`.
- Provides an elegant single-screen sponsorship modal with quick student count chips (`1, 3, 5, 10, 20`), live dollar calculations, and a restore purchases handler.
- 100% compliant with Google Play billing and RevenueCat Next-Gen developer standards.

---

## Engineering Standards

- **Zero Network Dependence**: Once AI models are downloaded, zero API requests leave the device. The app works flawlessly in Airplane mode.
- **Memory Safety**: No leaking native listeners, lightweight SVG icons, and zero layout collapse during state transitions.
- **Graceful Degradation**: If a device lacks camera hardware or microphone permissions, the textbook reader, MCQ engine, and typed AI tutor continue to function without interruption.
