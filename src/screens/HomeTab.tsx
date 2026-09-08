import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import {
  MapPin,
  Folder,
  Calendar,
  Sparkles,
  Lock,
  Download,
  ArrowRight,
} from 'lucide-react-native';
import { UserProfile, SubjectItem, QuizQuestion, QuizStatus } from '../types';
import { SUBJECTS_DATA } from '../data/subjects';
import { SCIENCE_19_CHAPTERS } from '../../scienceSyllabusMemory';
import {
  ScienceAtomIllustration,
  MathPyramidIllustration,
  SocialGlobeIllustration,
  NepaliDiyoIllustration,
  EnglishQuillIllustration,
  OptMathIllustration,
  ComputerCodeIllustration,
  ExamNotebookIllustration,
  StreakFlameRing,
} from '../../SubjectIllustrations';
import { stickerSource } from '../constants/storage';

interface HomeTabProps {
  user: UserProfile | null;
  currentTimeStr: string;
  currentDateStr: string;
  streakCount: number;
  isModelAvailable: boolean;
  currentQuiz: QuizQuestion;
  selectedOption: number | null;
  quizStatus: QuizStatus;
  selectedScienceChapterId: number | null;
  onNavigateToRevision: () => void;
  onSubjectClick: (subject: SubjectItem) => void;
  onOpenAIChat: () => void;
  onSelectChapter: (chapterId: number | null) => void;
  onAnswerQuiz: (index: number) => void;
  onPickRandomQuiz: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  user,
  currentTimeStr,
  currentDateStr,
  streakCount,
  isModelAvailable,
  currentQuiz,
  selectedOption,
  quizStatus,
  selectedScienceChapterId,
  onNavigateToRevision,
  onSubjectClick,
  onOpenAIChat,
  onSelectChapter,
  onAnswerQuiz,
  onPickRandomQuiz,
}) => {
  const renderSubjectIllustration = (id: string) => {
    switch (id) {
      case 'science':
        return <ScienceAtomIllustration size={44} />;
      case 'math':
        return <MathPyramidIllustration size={44} />;
      case 'social':
        return <SocialGlobeIllustration size={44} />;
      case 'nepali':
        return <NepaliDiyoIllustration size={44} />;
      case 'english':
        return <EnglishQuillIllustration size={44} />;
      case 'opt_math':
        return <OptMathIllustration size={44} />;
      case 'computer':
        return <ComputerCodeIllustration size={44} />;
      default:
        return null;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
      {/* GREETING & TIME / LOCATION BLOCK */}
      <View style={styles.greetingHeaderRow}>
        <View style={styles.greetingLeftBlock}>
          <Text style={styles.greetingTitle}>{`Hi, ${user?.name || 'Scholar'}`}</Text>
          <Text style={styles.greetingSub}>Tap any subject folder to open Class 10 PDF textbooks in-app.</Text>
        </View>
        <View style={styles.greetingRightBlock}>
          <Text style={styles.greetingTimeText}>{currentTimeStr}</Text>
          <Text style={styles.greetingDateText}>{currentDateStr}</Text>
          <View style={styles.locationBadge}>
            <MapPin size={10} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.locationBadgeText}>Changunarayan, Nepal</Text>
          </View>
        </View>
      </View>

      {/* PRACTICE FOR EXAM HERO SECTION */}
      <TouchableOpacity
        style={styles.practiceExamHeroCard}
        activeOpacity={0.85}
        onPress={onNavigateToRevision}
      >
        <View style={styles.practiceExamHeroLeft}>
          <View style={styles.practiceExamIconBox}>
            <ExamNotebookIllustration size={44} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={styles.practiceExamHeroTitle}>Practice for exam</Text>
              <View style={styles.practiceExamBadge}>
                <Text style={styles.practiceExamBadgeText}>SEE 2081/2082</Text>
              </View>
            </View>
            <Text style={styles.practiceExamHeroSub}>
              Past question papers, formula sheets & step-by-step model solutions.
            </Text>
          </View>
        </View>
        <View style={styles.practiceExamArrowBox}>
          <ArrowRight size={18} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* SUBJECT RESOURCE FOLDERS SECTION */}
      <View style={styles.sectionHeaderRow}>
        <Folder size={17} color="#ffffff" style={{ marginRight: 7 }} />
        <Text style={styles.sectionTitleText}>Class 10 Textbooks</Text>
      </View>

      {/* SUBJECT FOLDERS GRID WITH 3D ARTWORK & CHAT STICKER CARD */}
      <View style={styles.subjectGrid}>
        {SUBJECTS_DATA.map((subj) => (
          <TouchableOpacity
            key={subj.id}
            style={styles.subjectFolderCard}
            activeOpacity={0.8}
            onPress={() => onSubjectClick(subj)}
          >
            <View style={styles.subjectCardContentLeft}>
              <View style={styles.subjectCardTop}>
                <Folder size={16} color="#ffffff" />
                <View style={styles.unitCountPill}>
                  <Text style={styles.unitCountText}>{`${subj.unitsCount} Units`}</Text>
                </View>
              </View>
              <Text style={styles.subjectCardTitle} numberOfLines={1}>
                {subj.name}
              </Text>
              <Text style={styles.subjectCardPages}>
                {subj.id === 'nepali'
                  ? `${subj.pagesCount} Pages • नेपाली प्रश्न`
                  : `${subj.pagesCount} Pages • In-App PDF`}
              </Text>
            </View>
            <View style={styles.subjectCardArtBox}>{renderSubjectIllustration(subj.id)}</View>
          </TouchableOpacity>
        ))}

        {/* CHAT WITH GURU WITH INTERACTIVE CHAT STICKER */}
        <TouchableOpacity
          style={styles.chatWithGuruStickerCard}
          activeOpacity={0.85}
          onPress={onOpenAIChat}
        >
          <View style={styles.chatWithGuruStickerLeft}>
            <Text style={styles.chatWithGuruStickerTitle} numberOfLines={1}>
              Chat with Guru
            </Text>
            <Text style={styles.chatWithGuruStickerSub} numberOfLines={2}>
              Build journey with offline AI tutor
            </Text>
          </View>
          <View style={styles.chatWithGuruStickerImgBox}>
            <Image source={stickerSource} style={styles.chatWithGuruStickerImg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
      </View>

      {/* DAILY STREAK CARD WITH FLAME RING */}
      <View style={styles.streakCardModern}>
        <View style={styles.streakCardLeft}>
          <View style={styles.statHeader}>
            <Calendar size={14} color="#ffffff" style={{ marginRight: 5 }} />
            <Text style={styles.statLabel}>DAILY STREAK</Text>
          </View>
          <Text style={styles.statValue}>{`${streakCount} Day${streakCount === 1 ? '' : 's'}`}</Text>
          <Text style={styles.statSubText}>
            {streakCount > 1
              ? 'consecutive offline learning days'
              : 'start your offline learning streak today'}
          </Text>
        </View>
        <StreakFlameRing size={62} />
      </View>

      {/* SCIENCE MCQ GENERATOR */}
      <View style={[styles.quizCard, !isModelAvailable && { overflow: 'hidden' }]}>
        <View
          style={!isModelAvailable ? { opacity: 0.12 } : undefined}
          pointerEvents={!isModelAvailable ? 'none' : 'auto'}
        >
          <View style={styles.quizHeaderRow}>
            <View style={styles.quizHeaderLeft}>
              <Sparkles size={17} color="#ffffff" />
              <Text style={styles.quizTitle}>Science MCQ Generator</Text>
            </View>
            <View style={styles.quizSubjectTag}>
              <Text style={styles.quizSubjectTagText}>All 19 Chapters · 100% Free</Text>
            </View>
          </View>

          {/* HORIZONTAL CHAPTER SELECTOR CAROUSEL */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10, gap: 8 }}
          >
            <TouchableOpacity
              style={[
                styles.scienceChapterPill,
                selectedScienceChapterId === null && styles.scienceChapterPillActive,
              ]}
              onPress={() => onSelectChapter(null)}
            >
              <Text
                style={[
                  styles.scienceChapterPillText,
                  selectedScienceChapterId === null && styles.scienceChapterPillTextActive,
                ]}
              >
                All 19 Chapters
              </Text>
            </TouchableOpacity>

            {SCIENCE_19_CHAPTERS.map((ch) => {
              const isChSelected = selectedScienceChapterId === ch.id;
              return (
                <TouchableOpacity
                  key={`sci-ch-${ch.id}`}
                  style={[
                    styles.scienceChapterPill,
                    isChSelected && styles.scienceChapterPillActive,
                  ]}
                  onPress={() => onSelectChapter(ch.id)}
                >
                  <Text
                    style={[
                      styles.scienceChapterPillText,
                      isChSelected && styles.scienceChapterPillTextActive,
                    ]}
                  >
                    {`Ch ${ch.id}: ${ch.name.split(' ')[0]}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.quizCurrentChapterBadge}>
            <Text style={styles.quizCurrentChapterBadgeText} numberOfLines={1}>
              {currentQuiz.subject || 'Heredity (वंशानुक्रम)'}
            </Text>
          </View>

          <Text style={styles.quizQuestionText}>{currentQuiz.question}</Text>

          <View style={styles.quizOptionsGrid}>
            <View style={styles.quizRowTwo}>
              {currentQuiz.options.slice(0, 2).map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = quizStatus !== 'idle' && idx === currentQuiz.correctIndex;
                const isWrong = quizStatus === 'wrong' && isSelected && idx !== currentQuiz.correctIndex;
                return (
                  <TouchableOpacity
                    key={`${opt}-${idx}`}
                    style={[
                      styles.quizOptionPill,
                      isSelected && styles.quizOptionPillSelected,
                      isCorrect && styles.quizOptionPillCorrect,
                      isWrong && styles.quizOptionPillWrong,
                    ]}
                    onPress={() => onAnswerQuiz(idx)}
                  >
                    <Text
                      style={[
                        styles.quizOptionText,
                        (isCorrect || isSelected) && styles.quizOptionTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.quizRowTwo}>
              {currentQuiz.options.slice(2, 4).map((opt, idx) => {
                const realIdx = idx + 2;
                const isSelected = selectedOption === realIdx;
                const isCorrect = quizStatus !== 'idle' && realIdx === currentQuiz.correctIndex;
                const isWrong = quizStatus === 'wrong' && isSelected && realIdx !== currentQuiz.correctIndex;
                return (
                  <TouchableOpacity
                    key={`${opt}-${realIdx}`}
                    style={[
                      styles.quizOptionPill,
                      isSelected && styles.quizOptionPillSelected,
                      isCorrect && styles.quizOptionPillCorrect,
                      isWrong && styles.quizOptionPillWrong,
                    ]}
                    onPress={() => onAnswerQuiz(realIdx)}
                  >
                    <Text
                      style={[
                        styles.quizOptionText,
                        (isCorrect || isSelected) && styles.quizOptionTextActive,
                      ]}
                      numberOfLines={2}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {quizStatus !== 'idle' && (
            <View
              style={[
                styles.feedbackBox,
                quizStatus === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
              ]}
            >
              <Text style={styles.feedbackTitle}>
                {quizStatus === 'correct' ? 'Correct!' : 'Review Concept:'}
              </Text>
              <Text style={styles.feedbackExplain}>{currentQuiz.explanation}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.newQuizButton}
            onPress={onPickRandomQuiz}
            activeOpacity={0.7}
          >
            <Sparkles size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.newQuizButtonText}>Generate Next</Text>
          </TouchableOpacity>
        </View>

        {/* LOCKED OVERLAY (WHEN MODELS ARE NOT DOWNLOADED) */}
        {!isModelAvailable && (
          <View style={styles.mcqLockedOverlay}>
            <TouchableOpacity
              style={styles.mcqLockCircle}
              onPress={onOpenAIChat}
              activeOpacity={0.8}
            >
              <Lock size={26} color="#ffffff" />
            </TouchableOpacity>

            <Text style={styles.mcqLockedTitle}>AI MCQ Generator Locked</Text>
            <Text style={styles.mcqLockedSubtitle}>
              Generating dynamic Class 10 SEE exam MCQs requires on-device Gemma AI.
            </Text>

            <TouchableOpacity
              style={styles.mcqUnlockBtn}
              onPress={onOpenAIChat}
              activeOpacity={0.85}
            >
              <Download size={15} color="#000000" style={{ marginRight: 7 }} />
              <Text style={styles.mcqUnlockBtnText}>Download Models to Unlock</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainScroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 220,
  },
  greetingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  greetingLeftBlock: {
    flex: 1,
    paddingRight: 10,
  },
  greetingRightBlock: {
    alignItems: 'flex-end',
  },
  greetingTimeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  greetingDateText: {
    fontSize: 10.5,
    color: '#71717a',
    marginTop: 1,
    marginBottom: 4,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBadgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },
  greetingSub: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
  },
  practiceExamHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    marginBottom: 16,
    shadowColor: '#0284c7',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  practiceExamHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  practiceExamIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  practiceExamHeroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  practiceExamBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  practiceExamBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  practiceExamHeroSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 16,
    marginTop: 2,
  },
  practiceExamArrowBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  subjectFolderCard: {
    width: '48.5%',
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 9,
    marginBottom: 8,
  },
  subjectCardContentLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4,
  },
  subjectCardArtBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  unitCountPill: {
    backgroundColor: '#18181b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  unitCountText: {
    fontSize: 9.5,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  subjectCardTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  subjectCardPages: {
    fontSize: 9.5,
    color: '#71717a',
  },
  chatWithGuruStickerCard: {
    width: '48.5%',
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 8,
    marginBottom: 8,
  },
  chatWithGuruStickerLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 4,
  },
  chatWithGuruStickerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  chatWithGuruStickerSub: {
    fontSize: 9.5,
    color: '#a1a1aa',
    lineHeight: 13,
  },
  chatWithGuruStickerImgBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatWithGuruStickerImg: {
    width: 42,
    height: 42,
  },
  streakCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#1e1e24',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  streakCardLeft: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#a1a1aa',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  statSubText: {
    fontSize: 10.5,
    color: '#71717a',
  },
  quizCard: {
    backgroundColor: '#0c0c0e',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  mcqLockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 12, 14, 0.90)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    zIndex: 10,
  },
  mcqLockCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mcqLockedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  mcqLockedSubtitle: {
    fontSize: 12.5,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    maxWidth: 280,
  },
  mcqUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  mcqUnlockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  quizHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 8,
  },
  quizSubjectTag: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quizSubjectTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  scienceChapterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  scienceChapterPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  scienceChapterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#a1a1aa',
  },
  scienceChapterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  quizCurrentChapterBadge: {
    backgroundColor: '#18181b',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  quizCurrentChapterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  quizQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 21,
    marginBottom: 14,
  },
  quizOptionsGrid: {
    gap: 10,
    marginBottom: 14,
  },
  quizRowTwo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quizOptionPill: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  quizOptionPillSelected: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  quizOptionPillCorrect: {
    backgroundColor: '#18181b',
    borderColor: '#ffffff',
  },
  quizOptionPillWrong: {
    backgroundColor: '#4c0519',
    borderColor: '#f43f5e',
  },
  quizOptionText: {
    fontSize: 12.5,
    color: '#d4d4d8',
    fontWeight: '600',
  },
  quizOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  feedbackBox: {
    padding: 9,
    borderRadius: 8,
    marginBottom: 8,
  },
  feedbackCorrect: {
    backgroundColor: '#064e3b',
  },
  feedbackWrong: {
    backgroundColor: '#4c0519',
  },
  feedbackTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  feedbackExplain: {
    fontSize: 10.5,
    color: '#e4e4e7',
    lineHeight: 14,
  },
  newQuizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 10,
    backgroundColor: '#18181b',
  },
  newQuizButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default HomeTab;
