import { NativeModules, DeviceEventEmitter, EmitterSubscription } from 'react-native';

const { LLMInferenceModule } = NativeModules;

export interface InferenceConfig {
  maxTokens?: number;
  temperature?: number;
  topK?: number;
}

export interface ModelStatus {
  isGemmaReady: boolean;
  isWhisperReady: boolean;
  isTtsReady: boolean;
}

/**
 * TypeScript service wrapper for Guru's native LiteRT-LM inference engine.
 * Communicates with LLMInferenceModule.kt over the React Native bridge.
 */
class GemmaRunnerService {
  private chunkSub: EmitterSubscription | null = null;
  private doneSub: EmitterSubscription | null = null;
  private errorSub: EmitterSubscription | null = null;

  /**
   * Checks whether the offline AI model files exist on physical storage.
   */
  async checkModelStatus(): Promise<ModelStatus> {
    if (!LLMInferenceModule?.checkAllModelsStatus) {
      return { isGemmaReady: false, isWhisperReady: false, isTtsReady: false };
    }
    return await LLMInferenceModule.checkAllModelsStatus();
  }

  /**
   * Initializes the LiteRT-LM C++ engine with the downloaded model.
   */
  async loadModel(modelPath: string): Promise<boolean> {
    if (!LLMInferenceModule?.initializeModel) return false;
    return await LLMInferenceModule.initializeModel(modelPath);
  }

  /**
   * Streams a prompt response token by token from on-device Gemma 4.
   */
  generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (err: string) => void
  ): void {
    this.cleanupSubscriptions();

    this.chunkSub = DeviceEventEmitter.addListener('LiteRTResponseChunk', (data: { chunk?: string }) => {
      if (data?.chunk) onChunk(data.chunk);
    });

    this.doneSub = DeviceEventEmitter.addListener('LiteRTResponseDone', () => {
      this.cleanupSubscriptions();
      onComplete();
    });

    this.errorSub = DeviceEventEmitter.addListener('LiteRTResponseError', (data: { error?: string }) => {
      this.cleanupSubscriptions();
      onError(data?.error || 'Inference error');
    });

    LLMInferenceModule?.generateResponse?.(prompt);
  }

  /**
   * Immediately halts current token generation.
   */
  stopGeneration(): void {
    this.cleanupSubscriptions();
    LLMInferenceModule?.stopGeneration?.();
  }

  private cleanupSubscriptions(): void {
    this.chunkSub?.remove();
    this.doneSub?.remove();
    this.errorSub?.remove();
    this.chunkSub = null;
    this.doneSub = null;
    this.errorSub = null;
  }
}

export const GemmaRunner = new GemmaRunnerService();
