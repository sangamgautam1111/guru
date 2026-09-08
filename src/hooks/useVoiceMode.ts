import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, DeviceEventEmitter, NativeModules, PermissionsAndroid, Animated } from 'react-native';

export function useVoiceMode(
  showToast: (msg: string) => void,
  onPromptTranscribed?: (text: string) => void,
  onStreakActivity?: () => void
) {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Real-time voice interaction modal states
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [voiceModeState, setVoiceModeState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceModeTranscript, setVoiceModeTranscript] = useState('');
  const [voiceModeAiText, setVoiceModeAiText] = useState('');
  const orbScale = useRef(new Animated.Value(1)).current;

  const startVoiceRecording = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          showToast('Microphone permission required for speech recognition.');
          return;
        }

        setSpeechText('');
        if (NativeModules.LLMInferenceModule?.startSpeechRecognition) {
          await NativeModules.LLMInferenceModule.startSpeechRecognition('en-US');
          setIsListening(true);
        }
      } catch (err) {
        console.warn('Start STT error:', err);
      }
    }
  }, [showToast]);

  const stopVoiceRecording = useCallback(async () => {
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.stopSpeechRecognition) {
      try {
        await NativeModules.LLMInferenceModule.stopSpeechRecognition();
      } catch (_) {}
    }
    setIsListening(false);
  }, []);

  const handleVoiceModeTurn = useCallback(
    async (userUtterance: string) => {
      if (!userUtterance.trim()) {
        setVoiceModeState('listening');
        await startVoiceRecording();
        return;
      }

      setVoiceModeTranscript(userUtterance);
      setVoiceModeState('thinking');
      setVoiceModeAiText('Thinking...');
      if (onStreakActivity) {
        onStreakActivity();
      }

      try {
        const requestId = Math.random().toString(36).slice(2, 10);
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.generateResponse) {
          const reply = await NativeModules.LLMInferenceModule.generateResponse(
            userUtterance,
            'EN',
            true,
            [],
            requestId,
            ''
          );

          const cleanReply = reply || 'I understand.';
          setVoiceModeAiText(cleanReply);
          setVoiceModeState('speaking');

          if (NativeModules.LLMInferenceModule?.speakText) {
            await NativeModules.LLMInferenceModule.speakText(cleanReply);
          }

          const speakingDurationMs = Math.max(3000, Math.min(12000, cleanReply.length * 70));
          setTimeout(async () => {
            if (isVoiceModeOpen) {
              setVoiceModeState('listening');
              setVoiceModeTranscript('');
              setVoiceModeAiText('');
              await startVoiceRecording();
            }
          }, speakingDurationMs);
        }
      } catch (err) {
        setVoiceModeState('listening');
        await startVoiceRecording();
      }
    },
    [isVoiceModeOpen, onStreakActivity, startVoiceRecording]
  );

  // Native Speech-to-Text Recognition Listeners
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const startSub = DeviceEventEmitter.addListener('onSpeechStart', () => {
      setIsListening(true);
    });

    const partialSub = DeviceEventEmitter.addListener('onSpeechPartial', (e: { text?: string }) => {
      if (e.text) {
        setSpeechText(e.text);
        if (!isVoiceModeOpen) {
          if (onPromptTranscribed) {
            onPromptTranscribed(e.text);
          }
        } else {
          setVoiceModeTranscript(e.text);
        }
      }
    });

    const finalSub = DeviceEventEmitter.addListener('onSpeechFinal', (e: { text?: string }) => {
      setIsListening(false);
      const text = e.text?.trim() || speechText.trim();
      if (text) {
        if (!isVoiceModeOpen) {
          if (onPromptTranscribed) {
            onPromptTranscribed(text);
          }
          showToast('Speech transcribed');
        } else {
          handleVoiceModeTurn(text);
        }
      }
    });

    const errorSub = DeviceEventEmitter.addListener('onSpeechError', (e: { text?: string }) => {
      setIsListening(false);
      if (isVoiceModeOpen && voiceModeState === 'listening') {
        setVoiceModeState('idle');
      }
      if (e.text && !e.text.includes('No speech')) {
        showToast(e.text);
      }
    });

    const endSub = DeviceEventEmitter.addListener('onSpeechEnd', () => {
      setIsListening(false);
    });

    return () => {
      startSub.remove();
      partialSub.remove();
      finalSub.remove();
      errorSub.remove();
      endSub.remove();
    };
  }, [handleVoiceModeTurn, isVoiceModeOpen, onPromptTranscribed, showToast, speechText, voiceModeState]);

  // Orb Pulsing Animation for Realtime Voice Mode
  useEffect(() => {
    if (isVoiceModeOpen) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(orbScale, {
            toValue: voiceModeState === 'speaking' ? 1.25 : voiceModeState === 'listening' ? 1.15 : 1.05,
            duration: voiceModeState === 'speaking' ? 400 : 700,
            useNativeDriver: true,
          }),
          Animated.timing(orbScale, {
            toValue: 0.95,
            duration: voiceModeState === 'speaking' ? 400 : 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isVoiceModeOpen, orbScale, voiceModeState]);

  const startVoiceMode = useCallback(async () => {
    setIsVoiceModeOpen(true);
    setVoiceModeState('listening');
    setVoiceModeTranscript('');
    setVoiceModeAiText('');
    await startVoiceRecording();
  }, [startVoiceRecording]);

  const stopVoiceMode = useCallback(async () => {
    setIsVoiceModeOpen(false);
    setVoiceModeState('idle');
    await stopVoiceRecording();
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.stopSpeaking) {
      await NativeModules.LLMInferenceModule.stopSpeaking();
    }
  }, [stopVoiceRecording]);

  const toggleSpeech = useCallback(
    async (messageId: string, text: string) => {
      if (playingMessageId === messageId) {
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.stopSpeaking) {
          await NativeModules.LLMInferenceModule.stopSpeaking();
        }
        setPlayingMessageId(null);
      } else {
        setPlayingMessageId(messageId);
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.speakText) {
          try {
            await NativeModules.LLMInferenceModule.speakText(text);
          } catch (err) {
            console.warn('TTS speak error:', err);
          }
        }
      }
    },
    [playingMessageId]
  );

  return {
    isListening,
    speechText,
    setSpeechText,
    playingMessageId,
    setPlayingMessageId,
    isVoiceModeOpen,
    setIsVoiceModeOpen,
    voiceModeState,
    voiceModeTranscript,
    voiceModeAiText,
    orbScale,
    startVoiceRecording,
    stopVoiceRecording,
    startVoiceMode,
    stopVoiceMode,
    handleVoiceModeTurn,
    toggleSpeech,
  };
}

export default useVoiceMode;
