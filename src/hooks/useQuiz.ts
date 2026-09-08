import { useState, useCallback } from 'react';
import { QuizQuestion, QuizStatus } from '../types';
import { getRandomScienceMCQ } from '../../scienceSyllabusMemory';

export function useQuiz(onStreakActivity?: () => void) {
  const [dailyMcqCount, setDailyMcqCount] = useState<number>(0);
  const [selectedScienceChapterId, setSelectedScienceChapterId] = useState<number | null>(null);

  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion>(() => {
    const initMcq = getRandomScienceMCQ();
    return {
      subject: `${initMcq.chapterName} (${initMcq.chapterNameNe})`,
      question: initMcq.question,
      options: initMcq.options,
      correctIndex: initMcq.correctIndex,
      explanation: initMcq.explanation,
    };
  });

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('idle');

  const generateScienceAiQuiz = useCallback((chapterId?: number | null) => {
    setSelectedOption(null);
    setQuizStatus('idle');

    const targetChId = chapterId !== undefined ? chapterId : selectedScienceChapterId;
    // Instant 0ms question load from verified Nepal CDC curriculum syllabus memory
    const instantMcq = getRandomScienceMCQ(targetChId || undefined);
    if (instantMcq) {
      setCurrentQuiz({
        subject: `${instantMcq.chapterName} (${instantMcq.chapterNameNe})`,
        question: instantMcq.question,
        options: instantMcq.options,
        correctIndex: instantMcq.correctIndex,
        explanation: instantMcq.explanation,
      });
    }
  }, [selectedScienceChapterId]);

  const pickRandomQuiz = useCallback(() => {
    generateScienceAiQuiz(selectedScienceChapterId);
  }, [generateScienceAiQuiz, selectedScienceChapterId]);

  const handleQuizAnswer = useCallback((index: number) => {
    setSelectedOption(index);
    setQuizStatus(index === currentQuiz.correctIndex ? 'correct' : 'wrong');
    if (onStreakActivity) {
      onStreakActivity();
    }
  }, [currentQuiz.correctIndex, onStreakActivity]);

  return {
    dailyMcqCount,
    setDailyMcqCount,
    selectedScienceChapterId,
    setSelectedScienceChapterId,
    currentQuiz,
    setCurrentQuiz,
    selectedOption,
    setSelectedOption,
    quizStatus,
    setQuizStatus,
    generateScienceAiQuiz,
    pickRandomQuiz,
    handleQuizAnswer,
  };
}

export default useQuiz;
