import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, DeviceEventEmitter, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Message, GenerationRef } from '../types';
import { formatGemmaResponse } from '../utils/formatGemmaResponse';

export function useChat(
  showToast: (msg: string) => void,
  onStreakActivity?: () => void
) {
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Multimodal Attachment State
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachedImageUri, setAttachedImageUri] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedFileContent, setAttachedFileContent] = useState<string | null>(null);

  const activeGenerationRef = useRef<GenerationRef | null>(null);
  const lastChunkUpdateRef = useRef<number>(0);

  // Load chat history from disk on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('@guru_single_chat_history');
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            setChatMessages(parsed);
          }
        }
      } catch (err) {
        console.warn('Error loading chat history:', err);
      }
    };
    void loadHistory();
  }, []);

  // Persist chat messages to disk
  useEffect(() => {
    if (chatMessages.length > 0) {
      void AsyncStorage.setItem('@guru_single_chat_history', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  const updateAssistantMessage = useCallback(
    (messageId: string, text: string, isPending: boolean) => {
      const formatted = formatGemmaResponse(text);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, text: isPending ? text : formatted, isPending } : m
        )
      );
    },
    []
  );

  // --- STREAMING LISTENERS ---
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const chunkSub = DeviceEventEmitter.addListener(
      'LiteRTResponseChunk',
      (event: { requestId?: string; text?: string; chunk?: string }) => {
        const active = activeGenerationRef.current;
        if (!active || (event.requestId && event.requestId !== active.requestId)) return;
        const currentText = event.text || event.chunk || '';
        if (currentText) {
          const now = Date.now();
          if (now - lastChunkUpdateRef.current > 70) {
            lastChunkUpdateRef.current = now;
            updateAssistantMessage(active.messageId, currentText, true);
          }
        }
      }
    );

    const doneSub = DeviceEventEmitter.addListener(
      'LiteRTResponseDone',
      (event: { requestId?: string; text?: string }) => {
        const active = activeGenerationRef.current;
        if (!active || event.requestId !== active.requestId) return;

        const finalText = String(event.text ?? '');
        updateAssistantMessage(active.messageId, finalText, false);
        setIsGenerating(false);
        activeGenerationRef.current = null;
      }
    );

    const errorSub = DeviceEventEmitter.addListener(
      'LiteRTResponseError',
      (event: { requestId?: string; error?: string }) => {
        const active = activeGenerationRef.current;
        if (active && (!event?.requestId || event.requestId === active.requestId)) {
          updateAssistantMessage(
            active.messageId,
            'I am ready! Please ask your question again or send a photo from your textbook.',
            false
          );
        }
        setIsGenerating(false);
        activeGenerationRef.current = null;
      }
    );

    return () => {
      chunkSub.remove();
      doneSub.remove();
      errorSub.remove();
    };
  }, [updateAssistantMessage]);

  const handleClearChat = useCallback(async () => {
    setChatMessages([]);
    await AsyncStorage.removeItem('@guru_single_chat_history');
    showToast('Chat cleared');
  }, [showToast]);

  const handleStopGeneration = useCallback(async () => {
    try {
      if (Platform.OS === 'android') {
        await NativeModules.LLMInferenceModule?.stopGeneration();
      }
    } catch (_) {}
    setIsGenerating(false);
    activeGenerationRef.current = null;
    showToast('Response stopped');
  }, [showToast]);

  const handlePickCamera = useCallback(async () => {
    setShowAttachModal(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showToast('Camera permission required.');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: false,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setAttachedImageUri(asset.uri);
        setAttachedFileName('Camera_Photo.jpg');
        setPrompt((prev) => (prev.trim() ? prev : 'Please solve and explain this problem step-by-step:'));
        showToast('Photo attached for OCR analysis');
      }
    } catch (err) {
      console.warn('Camera error:', err);
      showToast('Could not open camera');
    }
  }, [showToast]);

  const handlePickGallery = useCallback(async () => {
    setShowAttachModal(false);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const mime = (asset.mimeType || '').toLowerCase();
        const name = (asset.name || '').toLowerCase();

        if (
          mime.startsWith('video/') ||
          name.endsWith('.mp4') ||
          name.endsWith('.mkv') ||
          name.endsWith('.mov') ||
          name.endsWith('.avi')
        ) {
          showToast('Videos are not supported. Please select an image.');
          return;
        }

        if (!mime.startsWith('image/') && !name.match(/\.(jpg|jpeg|png|webp|bmp|gif)$/i)) {
          showToast('Please select a valid image file.');
          return;
        }

        setAttachedImageUri(asset.uri);
        setAttachedFileName(asset.name || 'Question_Image.jpg');
        setPrompt((prev) => (prev.trim() ? prev : 'Please solve and explain this problem step-by-step:'));
        showToast('Image attached from storage');
        return;
      }
    } catch (docErr) {
      console.warn('DocumentPicker storage error, trying gallery fallback:', docErr);
    }

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        if (asset.type === 'video') {
          showToast('Videos are not supported. Please select an image.');
          return;
        }
        setAttachedImageUri(asset.uri);
        setAttachedFileName(asset.fileName || 'Question_Image.jpg');
        setPrompt((prev) => (prev.trim() ? prev : 'Please solve and explain this problem step-by-step:'));
        showToast('Image attached');
      }
    } catch (err) {
      console.warn('Gallery error:', err);
      showToast('Could not open storage');
    }
  }, [showToast]);

  const sendPrompt = useCallback(
    async (forcedPrompt?: string) => {
      const textToSend = (forcedPrompt || prompt).trim();
      if (!textToSend && !attachedFileContent && !attachedImageUri) return;

      const userMessageId = Math.random().toString(36).slice(2, 10);
      const assistantMessageId = Math.random().toString(36).slice(2, 10);
      const requestId = Math.random().toString(36).slice(2, 10);

      const userMsg: Message = {
        id: userMessageId,
        text: textToSend,
        isUser: true,
        attachmentName: attachedFileName || undefined,
        attachmentImageUri: attachedImageUri || undefined,
      };

      const botMsg: Message = {
        id: assistantMessageId,
        text: '',
        isUser: false,
        isPending: true,
      };

      setChatMessages((prev) => [...prev, userMsg, botMsg]);

      const imageToSend = attachedImageUri;
      const fileContentToSend = attachedFileContent;

      setPrompt('');
      setAttachedFileName(null);
      setAttachedFileContent(null);
      setAttachedImageUri(null);
      setIsGenerating(true);

      if (onStreakActivity) {
        onStreakActivity();
      }

      activeGenerationRef.current = {
        requestId,
        messageId: assistantMessageId,
      };

      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule) {
        try {
          const rawHistory = chatMessages.filter(
            (m) => m.id !== assistantMessageId && m.text !== 'Analyzing...' && m.text.trim().length > 0
          );
          const historyForInference = rawHistory.slice(-6).map((m) => ({
            isUser: m.isUser,
            text: m.text.length > 350 ? m.text.slice(0, 350) + '...' : m.text,
          }));

          let fullPromptText = fileContentToSend
            ? `${textToSend}\n\n[Attached File Content]:\n${fileContentToSend}`
            : textToSend;

          await NativeModules.LLMInferenceModule.generateResponse(
            fullPromptText,
            'EN',
            true,
            historyForInference,
            requestId,
            imageToSend || ''
          );
        } catch (err: any) {
          console.warn('Native inference error:', err);
          updateAssistantMessage(
            assistantMessageId,
            'I am ready to help! Please ask your question again or send a photo from your textbook.',
            false
          );
          setIsGenerating(false);
        }
      } else {
        updateAssistantMessage(
          assistantMessageId,
          'Offline AI Brain is only available on native Android devices.',
          false
        );
        setIsGenerating(false);
      }
    },
    [
      attachedFileContent,
      attachedFileName,
      attachedImageUri,
      chatMessages,
      onStreakActivity,
      prompt,
      updateAssistantMessage,
    ]
  );

  const copyMessageToClipboard = useCallback(
    async (text: string) => {
      if (!text) return;
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.copyToClipboard) {
        try {
          await NativeModules.LLMInferenceModule.copyToClipboard(text);
          showToast('Copied to clipboard');
        } catch (_) {
          showToast('Copied to clipboard');
        }
      } else {
        showToast('Copied to clipboard');
      }
    },
    [showToast]
  );

  return {
    chatMessages,
    setChatMessages,
    prompt,
    setPrompt,
    isGenerating,
    setIsGenerating,
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
  };
}

export default useChat;
