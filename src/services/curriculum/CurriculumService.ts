// Curriculum Matching and Prompt Conditioning Service for Guru App
// Provides lightweight on-device context injection from local CDC syllabus data
// Optimized for compact INT4 Gemma 2B models running on mobile hardware.

import {
  CURRICULUM_DATA,
  GRADE_PROMPT_RULES,
  CurriculumChunk,
  GradePromptRule,
} from '../../data/curriculumData';

export interface PromptContextOptions {
  question: string;
  grade: string;
  subjectId?: string;
  language?: 'EN' | 'NE';
  hasAttachment?: boolean;
}

export interface PromptConditioningResult {
  conditionedPrompt: string;
  matchedChunk: CurriculumChunk | null;
  gradeRule: GradePromptRule;
}

/**
 * Normalizes text for clean token-level matching against curriculum keywords.
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Maps app subject IDs to curriculum subject categories.
 */
const mapAppSubjectToCurriculum = (appSubjectId?: string): string => {
  if (!appSubjectId) return 'general';
  const normalized = appSubjectId.toLowerCase();
  if (normalized.includes('opt') && normalized.includes('math')) return 'optmath';
  if (normalized.includes('math') || normalized.includes('ganit')) return 'math';
  if (normalized.includes('sci') || normalized.includes('vigyan')) return 'science';
  if (normalized.includes('soc') || normalized.includes('samajik')) return 'social';
  if (normalized.includes('comp')) return 'computer';
  if (normalized.includes('nep')) return 'nepali';
  if (normalized.includes('eng')) return 'english';
  return 'general';
};

/**
 * Finds the most relevant syllabus chunk based on grade, subject, and keyword frequency.
 */
export const findMatchingCurriculumChunk = (
  question: string,
  grade: string,
  appSubjectId?: string
): CurriculumChunk | null => {
  const normalizedQuestion = normalizeText(question);
  if (!normalizedQuestion || normalizedQuestion.length < 3) {
    return null;
  }

  const queryWords = new Set(normalizedQuestion.split(' '));
  const targetSubject = mapAppSubjectToCurriculum(appSubjectId);
  const targetGrade = grade === '10' ? '10' : '9';

  let bestChunk: CurriculumChunk | null = null;
  let highestScore = 0;

  for (const chunk of CURRICULUM_DATA) {
    // Check grade compatibility
    if (chunk.grade !== 'all' && chunk.grade !== targetGrade) {
      continue;
    }

    let score = 0;

    // Subject match boost
    if (targetSubject !== 'general' && chunk.subjectId === targetSubject) {
      score += 3;
    }

    // Keyword matching
    for (const keyword of chunk.keywords) {
      const normalizedKeyword = keyword.toLowerCase();
      if (normalizedKeyword.includes(' ')) {
        // Multi-word phrase check
        if (normalizedQuestion.includes(normalizedKeyword)) {
          score += 5;
        }
      } else if (queryWords.has(normalizedKeyword)) {
        score += 2;
      }
    }

    // Topic title direct mention
    if (normalizedQuestion.includes(chunk.topic.toLowerCase())) {
      score += 4;
    }

    if (score > highestScore && score >= 4) {
      highestScore = score;
      bestChunk = chunk;
    }
  }

  return bestChunk;
};

/**
 * Builds a prompt with injected curriculum context and grade-specific rules.
/**
 * Injects concise syllabus reference data (formulas/rules) without rigid meta constraints.
 * Allows base instruction-tuned Gemma 4 to answer naturally.
 */
export const buildConditionedPrompt = (
  options: PromptContextOptions
): PromptConditioningResult => {
  const { question, grade, subjectId, language = 'EN', hasAttachment = false } = options;
  const targetGrade = grade === '10' ? '10' : '9';
  const gradeRule = GRADE_PROMPT_RULES[targetGrade];
  const matchedChunk = findMatchingCurriculumChunk(question, targetGrade, subjectId);

  const contextLines: string[] = [];

  // Syllabus formula and definition injection
  if (matchedChunk?.formulasOrRules) {
    contextLines.push(`Reference Formulas: ${matchedChunk.formulasOrRules}`);
  }

  // Document attachment reference
  if (hasAttachment) {
    contextLines.push('Reference: Use the attached study material to answer the question.');
  }

  const header = contextLines.join('\n');
  const conditionedPrompt = header ? `${header}\n\n${question.trim()}` : question.trim();

  return {
    conditionedPrompt,
    matchedChunk,
    gradeRule,
  };
};
