# Guru Application Logic & Services (src/)

This directory contains the core TypeScript business logic, curriculum conditioning services, and typed abstractions for on-device inference.

---

## Directory Architecture

### src/services/

- **inference/GemmaRunner.ts**:
  Typed TypeScript wrapper for NativeModules.LLMInferenceModule. Manages event subscriptions (LiteRTResponseChunk, LiteRTResponseDone, LiteRTResponseError), token streaming callbacks, and engine lifecycle controls.

- **curriculum/CurriculumService.ts**:
  Lightweight on-device prompt conditioning service. Normalizes student input, matches keywords against local curriculum chunks, and injects Nepal CDC syllabus context before sending prompts to Gemma 4.

### src/data/

- **curriculumData.ts**:
  Structured offline curriculum reference data for Class 9 and Class 10 (Compulsory Math, Optional Math, Science, Social Studies, English, Nepali, Computer Science). Provides grade-specific prompt rules, formula references, and SEE marking criteria.

---

## Design Principles

1. **Zero Cloud Dependency**: All services, prompt conditioning, and matching algorithms execute locally in-memory.
2. **Type Safety**: Full TypeScript type definitions for all curriculum schemas, generation events, and native bridge interfaces.
3. **Graceful Degradation**: Inference and curriculum services maintain local fallbacks when peripheral capabilities (e.g., camera OCR or voice) are not in use.
