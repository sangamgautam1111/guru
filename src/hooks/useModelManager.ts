import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, DeviceEventEmitter, NativeModules, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { ModelFileStatus } from '../types';
import { STORAGE_KEYS } from '../constants/storage';

export function useModelManager(showToast: (msg: string) => void) {
  const [hfToken, setHfToken] = useState('');
  const [showHfTokenInput, setShowHfTokenInput] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('0 KB/s');
  const [downloadEta, setDownloadEta] = useState('--');
  const [downloadedTotalMb, setDownloadedTotalMb] = useState(0);
  const [totalAllMb, setTotalAllMb] = useState(2665);
  const [currentDownloadModel, setCurrentDownloadModel] = useState('');

  // Verified Engine Statuses
  const [gemmaStatus, setGemmaStatus] = useState<ModelFileStatus>({ found: false, sizeMb: 0 });
  const [whisperStatus, setWhisperStatus] = useState<ModelFileStatus>({ found: false, sizeMb: 0 });
  const [kokoroStatus, setKokoroStatus] = useState<{ found: boolean; path: string; sizeMb: number }>({
    found: true,
    path: 'builtin_android_tts',
    sizeMb: 0,
  });
  const [isAllModelsReady, setIsAllModelsReady] = useState(false);
  const [isCheckingModels, setIsCheckingModels] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const modelReadyRef = useRef(false);

  const verifyAllModels = useCallback(async () => {
    setIsCheckingModels(true);
    try {
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.checkAllModelsStatus) {
        const res = await NativeModules.LLMInferenceModule.checkAllModelsStatus();
        if (res) {
          setGemmaStatus({
            found: !!res.gemmaFound,
            path: res.gemmaPath || '',
            sizeMb: Math.round(res.gemmaSizeMb || 0),
          });
          setKokoroStatus({
            found: !!res.kokoroFound,
            path: res.kokoroPath || '',
            sizeMb: Math.round(res.kokoroSizeMb || 0),
          });
          setWhisperStatus({
            found: !!res.whisperFound,
            path: res.whisperPath || '',
            sizeMb: Math.round(res.whisperSizeMb || 0),
          });
          setIsAllModelsReady(!!res.allReady);
          if (res.allReady) {
            setDownloadProgress(100);
          }
          if (res.gemmaPath) {
            try {
              await AsyncStorage.setItem(STORAGE_KEYS.modelPath, res.gemmaPath);
              await NativeModules.LLMInferenceModule.initModel(res.gemmaPath);
              setIsModelReady(true);
              modelReadyRef.current = true;
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.warn('Model check error:', err);
    } finally {
      setIsCheckingModels(false);
    }
  }, []);

  // Multi-Model Download Progress Listener
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const sub = DeviceEventEmitter.addListener('MultiModelDownloadProgress', (data: any) => {
      if (data.percentage !== undefined && data.percentage > 0) {
        setDownloadProgress((prev) => Math.max(prev, data.percentage));
      }
      if (data.speedFormatted && data.speedFormatted !== '--') {
        setDownloadSpeed(data.speedFormatted);
      } else if (data.status === 'downloading') {
        setDownloadSpeed((prev) => (prev && prev !== '--' ? prev : 'Optimizing...'));
      }
      if (data.etaFormatted) {
        setDownloadEta(data.etaFormatted);
      }
      if (data.currentModelName) {
        setCurrentDownloadModel(data.currentModelName);
      }
      if (data.bytesReadTotalMb !== undefined && data.totalBytesAllMb !== undefined) {
        const total = Math.round(data.totalBytesAllMb);
        const downloaded = Math.min(Math.round(data.bytesReadTotalMb), total);
        setDownloadedTotalMb((prev) => Math.max(prev, downloaded));
        setTotalAllMb(total);
      } else if (data.bytesReadTotalMb !== undefined) {
        setDownloadedTotalMb((prev) => Math.max(prev, Math.round(data.bytesReadTotalMb)));
      } else if (data.totalBytesAllMb !== undefined) {
        setTotalAllMb(Math.round(data.totalBytesAllMb));
      }

      if (data.completedKeys && Array.isArray(data.completedKeys)) {
        if (data.completedKeys.includes('gemma')) {
          setGemmaStatus((prev) => ({ ...prev, found: true, sizeMb: prev.sizeMb || 2590 }));
        }
        if (data.completedKeys.includes('whisper')) {
          setWhisperStatus((prev) => ({ ...prev, found: true, sizeMb: prev.sizeMb || 75 }));
        }
      }

      if (data.status === 'downloading') {
        setIsDownloading(true);
      } else if (data.status === 'done') {
        setIsDownloading(false);
        setDownloadProgress(100);
        void verifyAllModels();
      } else if (data.status === 'error') {
        setIsDownloading(false);
        showToast('Download notice: ' + (data.error || 'Network error'));
        if (data.error && data.error.includes('401')) {
          setShowHfTokenInput(true);
        }
      }
    });

    return () => {
      sub.remove();
    };
  }, [showToast, verifyAllModels]);

  const startDownloadAllModels = useCallback(
    async (replaceExisting = false) => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        } catch (_) {}
      }
      setIsDownloading(true);
      setDownloadProgress(0);
      setDownloadedTotalMb(0);
      try {
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.startDownloadAllModels) {
          showToast('Downloading On-Device AI Models (Gemma 4 & Whisper)...');
          const res = await NativeModules.LLMInferenceModule.startDownloadAllModels(
            hfToken.trim() || null,
            replaceExisting
          );
          if (res && res.allReady) {
            setIsAllModelsReady(true);
            setDownloadProgress(100);
            setIsDownloading(false);
            await verifyAllModels();
            showToast('Download complete! Tap "Enter Chat" to start.');
          }
        } else {
          setIsDownloading(false);
          showToast('Download module unavailable');
        }
      } catch (err: any) {
        console.warn('Download error:', err);
        setIsDownloading(false);
        if (err?.message && err.message.includes('401')) {
          setShowHfTokenInput(true);
          showToast('Authentication notice: Enter your Hugging Face Token below.');
        } else if (err?.message !== 'Download cancelled by user') {
          showToast('Download notice: ' + (err.message || 'Interrupted'));
        }
      }
    },
    [hfToken, showToast, verifyAllModels]
  );

  const cancelAllDownloads = useCallback(async () => {
    try {
      if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.cancelAllDownloads) {
        await NativeModules.LLMInferenceModule.cancelAllDownloads();
      }
      setIsDownloading(false);
      showToast('Download cancelled');
    } catch (_) {}
  }, [showToast]);

  const pickLocalModelFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        const uri = file.uri;
        setGemmaStatus({ found: true, path: uri, sizeMb: 2590 });
        if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.initModel) {
          try {
            await NativeModules.LLMInferenceModule.initModel(uri);
            setIsModelReady(true);
            modelReadyRef.current = true;
          } catch (_) {}
        }
        showToast('Local Gemma model linked: ' + file.name);
      }
    } catch (err) {
      showToast('Could not link model file');
    }
  }, [showToast]);

  const testVoiceSample = useCallback(async () => {
    setIsTestingVoice(true);
    if (Platform.OS === 'android' && NativeModules.LLMInferenceModule?.speakText) {
      try {
        await NativeModules.LLMInferenceModule.speakText(
          'Welcome to Guru. Offline neural artificial intelligence and textbook vault are operational.'
        );
      } catch (_) {}
    }
    setTimeout(() => setIsTestingVoice(false), 2500);
  }, []);

  return {
    hfToken,
    setHfToken,
    showHfTokenInput,
    setShowHfTokenInput,
    isDownloading,
    downloadProgress,
    downloadSpeed,
    downloadEta,
    downloadedTotalMb,
    totalAllMb,
    currentDownloadModel,
    gemmaStatus,
    whisperStatus,
    kokoroStatus,
    isAllModelsReady,
    isCheckingModels,
    isModelReady,
    setIsModelReady,
    isTestingVoice,
    modelReadyRef,
    verifyAllModels,
    startDownloadAllModels,
    cancelAllDownloads,
    pickLocalModelFile,
    testVoiceSample,
  };
}

export default useModelManager;
