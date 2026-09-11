import React, { useState, useEffect, useCallback } from 'react';
import {
  Platform,
  ToastAndroid,
  BackHandler,
  NativeModules,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenState, UserProfile } from './src/types';
import { STORAGE_KEYS } from './src/constants/storage';
import { useClock } from './src/hooks/useClock';
import { useStreak } from './src/hooks/useStreak';
import { useDakshina } from './src/hooks/useDakshina';
import { useQuiz } from './src/hooks/useQuiz';
import { usePdfViewer } from './src/hooks/usePdfViewer';
import { useModelManager } from './src/hooks/useModelManager';
import { useChat } from './src/hooks/useChat';
import { useVoiceMode } from './src/hooks/useVoiceMode';
import { BootScreen } from './src/screens/BootScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DownloadScreen } from './src/screens/DownloadScreen';
import { MainScreen } from './src/screens/MainScreen';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [screen, setScreen] = useState<ScreenState>('onboarding');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  }, []);

  const { currentTimeStr, currentDateStr } = useClock();

  // Streak Subsystem
  const { streakCount, checkAndUpdateDailyStreak } = useStreak(showToast);
  const onActivity = useCallback(() => {
    void checkAndUpdateDailyStreak(true);
  }, [checkAndUpdateDailyStreak]);

  // RevenueCat Dakshina Patronage Subsystem
  const {
    isPatron,
    badge: supporterBadge,
    sponsorCount,
    setSponsorCount,
    lifetimeSponsorCount,
    isPurchasing,
    donationSuccessMsg,
    handleSponsor,
    handleRestore,
  } = useDakshina(showToast);

  // Dynamic Science Exam MCQ Quiz Engine
  const {
    selectedScienceChapterId,
    setSelectedScienceChapterId,
    currentQuiz,
    selectedOption,
    quizStatus,
    generateScienceAiQuiz,
    pickRandomQuiz,
    handleQuizAnswer,
  } = useQuiz(onActivity);

  // In-App Native PDF Viewer
  const {
    activePdf,
    setActivePdf,
    mediumChooserSubject,
    setMediumChooserSubject,
    openInAppPdf,
    nextPdfPage,
    prevPdfPage,
    zoomIn,
    zoomOut,
    handleSubjectClick,
  } = usePdfViewer(showToast, onActivity);

  // On-Device AI Models Manager (LiteRT-LM Gemma & Whisper)
  const {
    hfToken,
    setHfToken,
    showHfTokenInput,
    isDownloading,
    downloadProgress,
    downloadSpeed,
    downloadEta,
    downloadedTotalMb,
    totalAllMb,
    currentDownloadModel,
    gemmaStatus,
    whisperStatus,
    isAllModelsReady,
    isModelReady,
    isInitializingModel,
    setIsModelReady,
    modelReadyRef,
    verifyAllModels,
    startDownloadAllModels,
    cancelAllDownloads,
  } = useModelManager(showToast);

  // Conversational AI Chat Tutor
  const {
    chatMessages,
    prompt,
    setPrompt,
    isGenerating,
    showAttachModal,
    setShowAttachModal,
    attachedImageUri,
    setAttachedImageUri,
    attachedFileName,
    setAttachedFileName,
    sendPrompt,
    handleClearChat,
    handleStopGeneration,
    handlePickCamera,
    handlePickGallery,
    copyMessageToClipboard,
  } = useChat(showToast, onActivity);

  // Voice Interaction & TTS Subsystem
  const {
    isListening,
    playingMessageId,
    startVoiceRecording,
    stopVoiceRecording,
    toggleSpeech,
  } = useVoiceMode(showToast, setPrompt, onActivity);

  const isModelAvailable = isAllModelsReady || gemmaStatus.found || isModelReady;

  const handleOpenAIChat = useCallback(() => {
    const isReady = isAllModelsReady || gemmaStatus.found;
    if (isReady) {
      setIsChatModalOpen(true);
    } else {
      setScreen('download');
      setTimeout(() => {
        void verifyAllModels();
      }, 100);
    }
  }, [gemmaStatus.found, isAllModelsReady, verifyAllModels]);

  const finishDownloadAndEnterMain = useCallback(async () => {
    try {
      await AsyncStorage.setItem('@guru_resources_ready', 'true');
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.checkAllModelsStatus) {
        const res = await NativeModules.LLMInferenceModule.checkAllModelsStatus();
        if (res?.gemmaPath) {
          await AsyncStorage.setItem(STORAGE_KEYS.modelPath, res.gemmaPath);
          if (!modelReadyRef.current) {
            showToast('Finalizing AI Brain setup...');
            try {
              await NativeModules.LLMInferenceModule.initModel(res.gemmaPath);
              setIsModelReady(true);
              modelReadyRef.current = true;
            } catch (initErr) {
              console.warn('Model init deferred:', initErr);
            }
          }
        }
      }
    } catch (_) {}
    setScreen('main');
    setIsChatModalOpen(true);
    showToast('Welcome to Guru Offline AI Tutor!');
  }, [modelReadyRef, setIsModelReady, showToast]);

  const registerUser = useCallback(
    async (profile: UserProfile, isEditingProfile = false) => {
      setUser(profile);
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
      if (isEditingProfile) {
        showToast('Profile updated successfully!');
        setScreen('main');
      } else {
        setScreen('main');
        showToast('Welcome to Guru! Start exploring textbooks & past papers.');
        setTimeout(() => {
          void verifyAllModels();
        }, 150);
      }
    },
    [showToast, verifyAllModels]
  );

  // --- HARDWARE BACK BUTTON HANDLER ---
  useEffect(() => {
    const onBackPress = () => {
      if (activePdf) {
        setActivePdf(null);
        return true;
      }
      if (mediumChooserSubject) {
        setMediumChooserSubject(null);
        return true;
      }
      if (isChatModalOpen) {
        setIsChatModalOpen(false);
        return true;
      }
      if (screen === 'download') {
        setScreen('main');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [activePdf, isChatModalOpen, mediumChooserSubject, screen, setActivePdf, setMediumChooserSubject]);

  // --- BOOT & MODEL INITIALIZATION ---
  useEffect(() => {
    const bootApp = async () => {
      try {
        let storedUser = await AsyncStorage.getItem(STORAGE_KEYS.user);
        if (!storedUser) {
          storedUser = await AsyncStorage.getItem(STORAGE_KEYS.legacyUser);
        }

        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setScreen('main');
            setTimeout(() => {
              void verifyAllModels();
            }, 150);
          } catch (_) {
            setScreen('onboarding');
          }
        } else {
          setScreen('onboarding');
        }

        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
          try {
            let storedPath = await AsyncStorage.getItem(STORAGE_KEYS.modelPath);
            if (!storedPath) {
              storedPath = await AsyncStorage.getItem(STORAGE_KEYS.legacyModelPath);
            }
            if (storedPath) {
              await NativeModules.LLMInferenceModule.initModel(storedPath);
              modelReadyRef.current = true;
              setIsModelReady(true);
            }
          } catch (_) {}
        }

        await checkAndUpdateDailyStreak(false);
        pickRandomQuiz();
      } catch (err) {
        console.warn('Boot initialization issue:', err);
      } finally {
        setTimeout(() => setIsBooting(false), 200);
      }
    };

    void bootApp();
  }, [checkAndUpdateDailyStreak, modelReadyRef, pickRandomQuiz, setIsModelReady, verifyAllModels]);

  // Screen Switching
  if (isBooting) {
    return <BootScreen />;
  }

  if (screen === 'onboarding') {
    return (
      <OnboardingScreen
        user={user}
        onRegister={registerUser}
        onBackToApp={() => setScreen('main')}
      />
    );
  }

  if (screen === 'download') {
    return (
      <DownloadScreen
        user={user}
        gemmaStatus={gemmaStatus}
        whisperStatus={whisperStatus}
        isAllModelsReady={isAllModelsReady}
        isModelReady={isModelReady}
        isInitializingModel={isInitializingModel}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        downloadSpeed={downloadSpeed}
        downloadEta={downloadEta}
        downloadedTotalMb={downloadedTotalMb}
        totalAllMb={totalAllMb}
        currentDownloadModel={currentDownloadModel}
        showHfTokenInput={showHfTokenInput}
        hfToken={hfToken}
        setHfToken={setHfToken}
        onBackToApp={() => setScreen('main')}
        onStartDownload={startDownloadAllModels}
        onCancelDownload={cancelAllDownloads}
        onEnterChat={finishDownloadAndEnterMain}
      />
    );
  }

  return (
    <MainScreen
      user={user}
      currentTimeStr={currentTimeStr}
      currentDateStr={currentDateStr}
      supporterBadge={supporterBadge}
      lifetimeSponsorCount={lifetimeSponsorCount}
      isPatron={isPatron}
      sponsorCount={sponsorCount}
      setSponsorCount={setSponsorCount}
      isPurchasing={isPurchasing}
      donationSuccessMsg={donationSuccessMsg}
      handleSponsor={handleSponsor}
      handleRestore={handleRestore}
      onEditProfile={() => setScreen('onboarding')}
      streakCount={streakCount}
      isModelAvailable={isModelAvailable}
      currentQuiz={currentQuiz}
      selectedOption={selectedOption}
      quizStatus={quizStatus}
      selectedScienceChapterId={selectedScienceChapterId}
      onSelectChapter={(chId) => {
        setSelectedScienceChapterId(chId);
        void generateScienceAiQuiz(chId);
      }}
      onAnswerQuiz={handleQuizAnswer}
      onPickRandomQuiz={pickRandomQuiz}
      activePdf={activePdf}
      mediumChooserSubject={mediumChooserSubject}
      setMediumChooserSubject={setMediumChooserSubject}
      onOpenPdf={openInAppPdf}
      onNextPdfPage={nextPdfPage}
      onPrevPdfPage={prevPdfPage}
      onZoomInPdf={zoomIn}
      onZoomOutPdf={zoomOut}
      onClosePdf={() => setActivePdf(null)}
      onSubjectClick={handleSubjectClick}
      isChatModalOpen={isChatModalOpen}
      setIsChatModalOpen={setIsChatModalOpen}
      onOpenAIChat={handleOpenAIChat}
      chatMessages={chatMessages}
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
      onSendPrompt={sendPrompt}
      onClearChat={handleClearChat}
      onStopGeneration={handleStopGeneration}
      onToggleSpeech={toggleSpeech}
      onCopyMessage={copyMessageToClipboard}
      onStartVoiceRecording={startVoiceRecording}
      onStopVoiceRecording={stopVoiceRecording}
      onPickCamera={handlePickCamera}
      onPickGallery={handlePickGallery}
    />
  );
}
