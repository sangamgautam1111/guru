import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import { Heart, User } from 'lucide-react-native';
import { UserProfile, TabState, SubjectItem, QuizQuestion, QuizStatus, ActivePdfState, Message } from '../types';
import { logoSource } from '../constants/storage';
import { SupporterBadgeInfo } from '../hooks/useDakshina';
import { SupporterBadge } from '../components/SupporterBadge';
import { GuruDakshinaHub } from '../components/GuruDakshinaHub';
import { BottomTabBar } from '../components/BottomTabBar';
import { FloatingChatOrb } from '../components/FloatingChatOrb';
import { MediumChooserModal } from '../components/MediumChooserModal';
import { PdfViewerModal } from '../modals/PdfViewerModal';
import { PastPapersModal } from '../modals/PastPapersModal';
import { ChatModal } from './ChatModal';
import { HomeTab } from './HomeTab';
import { RevisionTab } from './RevisionTab';

interface MainScreenProps {
  user: UserProfile | null;
  currentTimeStr: string;
  currentDateStr: string;
  supporterBadge: SupporterBadgeInfo;
  lifetimeSponsorCount: number;
  isPatron: boolean;
  sponsorCount: number;
  setSponsorCount: (count: number | ((prev: number) => number)) => void;
  isPurchasing: boolean;
  donationSuccessMsg: string | null;
  handleSponsor: (count: number, tierTitle?: string) => Promise<boolean>;
  handleRestore: () => Promise<void>;
  onEditProfile?: () => void;
  // Streak
  streakCount: number;
  // Quiz
  isModelAvailable: boolean;
  currentQuiz: QuizQuestion;
  selectedOption: number | null;
  quizStatus: QuizStatus;
  selectedScienceChapterId: number | null;
  onSelectChapter: (chId: number | null) => void;
  onAnswerQuiz: (idx: number) => void;
  onPickRandomQuiz: () => void;
  // PDF
  activePdf: ActivePdfState | null;
  mediumChooserSubject: SubjectItem | null;
  setMediumChooserSubject: (subj: SubjectItem | null) => void;
  onOpenPdf: (assetPath?: string, title?: string) => void;
  onNextPdfPage: () => void;
  onPrevPdfPage: () => void;
  onZoomInPdf: () => void;
  onZoomOutPdf: () => void;
  onClosePdf: () => void;
  onSubjectClick: (subj: SubjectItem) => void;
  // AI Chat & Modals
  isChatModalOpen: boolean;
  setIsChatModalOpen: (open: boolean) => void;
  onOpenAIChat: () => void;
  chatMessages: Message[];
  prompt: string;
  setPrompt: (text: string) => void;
  isGenerating: boolean;
  isListening: boolean;
  playingMessageId: string | null;
  attachedImageUri: string | null;
  setAttachedImageUri: (uri: string | null) => void;
  attachedFileName: string | null;
  setAttachedFileName: (name: string | null) => void;
  showAttachModal: boolean;
  setShowAttachModal: (show: boolean) => void;
  onSendPrompt: (forcedPrompt?: string) => void;
  onClearChat: () => void;
  onStopGeneration: () => void;
  onToggleSpeech: (messageId: string, text: string) => void;
  onCopyMessage: (text: string) => void;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
}

export const MainScreen: React.FC<MainScreenProps> = ({
  user,
  currentTimeStr,
  currentDateStr,
  supporterBadge,
  lifetimeSponsorCount,
  isPatron,
  sponsorCount,
  setSponsorCount,
  isPurchasing,
  donationSuccessMsg,
  handleSponsor,
  handleRestore,
  onEditProfile,
  streakCount,
  isModelAvailable,
  currentQuiz,
  selectedOption,
  quizStatus,
  selectedScienceChapterId,
  onSelectChapter,
  onAnswerQuiz,
  onPickRandomQuiz,
  activePdf,
  mediumChooserSubject,
  setMediumChooserSubject,
  onOpenPdf,
  onNextPdfPage,
  onPrevPdfPage,
  onZoomInPdf,
  onZoomOutPdf,
  onClosePdf,
  onSubjectClick,
  isChatModalOpen,
  setIsChatModalOpen,
  onOpenAIChat,
  chatMessages,
  prompt,
  setPrompt,
  isGenerating,
  isListening,
  playingMessageId,
  attachedImageUri,
  setAttachedImageUri,
  attachedFileName,
  setAttachedFileName,
  showAttachModal,
  setShowAttachModal,
  onSendPrompt,
  onClearChat,
  onStopGeneration,
  onToggleSpeech,
  onCopyMessage,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onPickCamera,
  onPickGallery,
}) => {
  const [activeTab, setActiveTab] = useState<TabState>('home');
  const [is2081ModalOpen, setIs2081ModalOpen] = useState(false);

  return (
    <SafeAreaView style={styles.darkContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* TOP HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeftGroup}>
          <Image source={logoSource} style={styles.headerLogoIcon} resizeMode="contain" />
          <Text style={styles.appHeaderTitle}>Guru</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
          {supporterBadge.tier !== 'none' ? (
            <SupporterBadge
              badge={supporterBadge}
              count={lifetimeSponsorCount}
              compact
              onPress={() => setActiveTab('donate')}
            />
          ) : (
            <TouchableOpacity
              style={styles.headerSponsorPill}
              activeOpacity={0.8}
              onPress={() => setActiveTab('donate')}
            >
              <Heart size={13} color="#ffffff" style={{ marginRight: 5 }} />
              <Text style={styles.headerSponsorText}>Sponsor</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.headerUserPill}
            activeOpacity={0.8}
            onPress={() => setActiveTab('donate')}
          >
            <User size={13} color="#ffffff" style={{ marginRight: 5 }} />
            <Text style={styles.headerUserName} numberOfLines={1}>
              {user?.name || 'Scholar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB CONTENT */}
      {activeTab === 'home' && (
        <HomeTab
          user={user}
          currentTimeStr={currentTimeStr}
          currentDateStr={currentDateStr}
          streakCount={streakCount}
          isModelAvailable={isModelAvailable}
          currentQuiz={currentQuiz}
          selectedOption={selectedOption}
          quizStatus={quizStatus}
          selectedScienceChapterId={selectedScienceChapterId}
          onNavigateToRevision={() => setActiveTab('revision')}
          onSubjectClick={onSubjectClick}
          onOpenAIChat={onOpenAIChat}
          onSelectChapter={onSelectChapter}
          onAnswerQuiz={onAnswerQuiz}
          onPickRandomQuiz={onPickRandomQuiz}
        />
      )}

      {activeTab === 'revision' && (
        <RevisionTab
          onOpenPdf={onOpenPdf}
          onOpen2081Modal={() => setIs2081ModalOpen(true)}
        />
      )}

      {activeTab === 'donate' && (
        <GuruDakshinaHub
          isPatron={isPatron}
          badge={supporterBadge}
          sponsorCount={sponsorCount}
          setSponsorCount={setSponsorCount}
          lifetimeSponsorCount={lifetimeSponsorCount}
          isPurchasing={isPurchasing}
          donationSuccessMsg={donationSuccessMsg}
          onSponsor={handleSponsor}
          onRestore={handleRestore}
          userName={user?.name || 'Student'}
          onEditProfile={onEditProfile}
        />
      )}

      {/* DRAGGABLE FLOATING GURU AI SPHERE */}
      <FloatingChatOrb onPress={onOpenAIChat} />

      {/* BOTTOM TAB BAR */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* MODALS */}
      <PdfViewerModal
        activePdf={activePdf}
        onClose={onClosePdf}
        onNextPage={onNextPdfPage}
        onPrevPage={onPrevPdfPage}
        onZoomIn={onZoomInPdf}
        onZoomOut={onZoomOutPdf}
      />

      <MediumChooserModal
        subject={mediumChooserSubject}
        onClose={() => setMediumChooserSubject(null)}
        onSelectMedium={onOpenPdf}
      />

      <PastPapersModal
        isOpen={is2081ModalOpen}
        onClose={() => setIs2081ModalOpen(false)}
        onSelectPaper={onOpenPdf}
      />

      <ChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        messages={chatMessages}
        prompt={prompt}
        setPrompt={setPrompt}
        isGenerating={isGenerating}
        isListening={isListening}
        playingMessageId={playingMessageId}
        attachedImageUri={attachedImageUri}
        setAttachedImageUri={setAttachedImageUri}
        attachedFileName={attachedFileName}
        setAttachedFileName={setAttachedFileName}
        showAttachModal={showAttachModal}
        setShowAttachModal={setShowAttachModal}
        onSendPrompt={onSendPrompt}
        onClearChat={onClearChat}
        onStopGeneration={onStopGeneration}
        onToggleSpeech={onToggleSpeech}
        onCopyMessage={onCopyMessage}
        onStartVoiceRecording={onStartVoiceRecording}
        onStopVoiceRecording={onStopVoiceRecording}
        onPickCamera={onPickCamera}
        onPickGallery={onPickGallery}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 10 : 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#121214',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoIcon: {
    width: 22,
    height: 22,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSponsorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  headerSponsorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121214',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    maxWidth: 110,
    flexShrink: 1,
  },
  headerUserName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default MainScreen;
