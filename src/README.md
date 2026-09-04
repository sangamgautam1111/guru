# App Services & Curriculum Logic (`src/`)

This folder contains the TypeScript logic, curriculum data, and service wrappers that connect our screens to the native Android engine.

---

## What's in Here

### `src/services/`

- **`inference/GemmaRunner.ts`**:
  A clean TypeScript wrapper for the native inference bridge. It manages listeners for streamed tokens, completion signals, and errors so the UI stays simple and responsive.

- **`curriculum/CurriculumService.ts`**:
  Helps Gemma give accurate, curriculum-aligned answers. When a student asks a question, this service looks through local textbook keywords and adds relevant Class 10 Nepal CDC syllabus context to the prompt before Gemma answers.

### `src/data/`

- **`curriculumData.ts`**:
  Contains structured offline syllabus data for Class 9 and Class 10 (Math, Science, Social Studies, English, Nepali, Computer Science). It includes formulas, important topics, and SEE exam marking guidelines.

---

## Key Principles

1. **100% Offline**: All curriculum matching, syllabus data, and inference wrappers run directly in memory without contacting any server.
2. **Type Safe**: Fully typed interfaces for all curriculum topics, exam questions, and streaming events.
3. **No Crashes**: If camera OCR or microphone access isn't available, the app gracefully falls back to text-only study.
