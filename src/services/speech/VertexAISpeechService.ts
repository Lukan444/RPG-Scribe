/**
 * Vertex AI Speech-to-Text Service
 * 
 * Integrates with Google Cloud Vertex AI Speech-to-Text API for real-time transcription
 * Supports streaming audio, speaker diarization, and multiple languages
 */

import { TranscriptionSegment, SpeakerInfo, AudioSourceType, SpeakerConfidence } from '../../models/Transcription';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Speech recognition configuration
 */
export interface SpeechConfig {
  language: string; // BCP-47 language tag
  sampleRate: number; // Sample rate in Hertz
  channels: number; // Number of audio channels
  encoding?: 'ENCODING_UNSPECIFIED' | 'LINEAR16' | 'FLAC' | 'MULAW' | 'AMR' | 'AMR_WB' | 'OGG_OPUS' | 'SPEEX_WITH_HEADER_BYTE' | 'WEBM_OPUS'; // Audio encoding
  enableSpeakerDiarization?: boolean;
  maxSpeakers?: number;
  enableAutomaticPunctuation?: boolean;
  enableWordTimeOffsets?: boolean;
  model?: string; // e.g., "latest_long", "medical_dictation", etc.
  useEnhanced?: boolean;
  interimResults?: boolean; // If true, interim results will be streamed back
}

/**
 * Streaming recognition result
 */
export interface StreamingResult {
  segments: TranscriptionSegment[];
  isFinal: boolean;
  stability: number;
  resultEndTime: number;
}

/**
 * Recognition error types
 */
export enum RecognitionErrorType {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_AUDIO = 'invalid_audio',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

/**
 * Recognition error
 */
export class RecognitionError extends Error {
  constructor(
    public type: RecognitionErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'RecognitionError';
  }
}

/**
 * Vertex AI Speech Service
 */
export class VertexAISpeechService {
  private projectId: string;
  private location: string;
  private activeStreams: Map<string, any> = new Map();
  private functions = getFunctions();

  constructor(config: {
    projectId: string;
    location?: string;
  }) {
    this.projectId = config.projectId;
    this.location = config.location || 'us-central1';
    // API key and baseUrl are no longer initialized here
  }

  /**
   * Start streaming speech recognition
   * @param config Recognition configuration
   * @param onResult Callback for recognition results
   * @param onError Error callback
   * @returns Stream ID for management
   */
  async startStreamingRecognition(
    config: SpeechConfig,
    onResult: (result: StreamingResult) => void,
    onError: (error: RecognitionError) => void
  ): Promise<string> {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // This config is sent to the proxy with each audio chunk.
      // The proxy then uses it to set up the streamingRecognize call to Vertex AI.
      const recognitionConfig = {
        encoding: 'WEBM_OPUS', // This should match the actual encoding of audio captured by client
        sampleRateHertz: config.sampleRate,
        languageCode: config.language,
        enableSpeakerDiarization: config.enableSpeakerDiarization,
        diarizationSpeakerCount: config.maxSpeakers,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation,
        enableWordTimeOffsets: config.enableWordTimeOffsets,
        model: config.model, // Allow specific model selection
        useEnhanced: config.useEnhanced,
        interimResults: true, // Request interim results for faster feedback
      };

      // Store stream configuration
      this.activeStreams.set(streamId, {
        config: recognitionConfig,
        onResult,
        onError,
        isActive: true,
        startTime: Date.now()
      });

      return streamId;
    } catch (error) {
      const recognitionError = new RecognitionError(
        RecognitionErrorType.UNKNOWN,
        `Failed to start streaming recognition: ${error}`,
        error
      );
      onError(recognitionError);
      throw recognitionError;
    }
  }

  /**
   * Send audio chunk for recognition
   * @param streamId Stream ID
   * @param audioChunk Audio data chunk
   */
  async sendAudioChunk(streamId: string, audioChunk: ArrayBuffer): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (!stream || !stream.isActive) {
      throw new Error(`Stream ${streamId} not found or inactive`);
    }

    try {
      // Convert audio chunk to base64
      const base64Audio = this.arrayBufferToBase64(audioChunk);
      
      // Call the proxy function for the audio chunk
      const proxyVertexAISpeech = httpsCallable(this.functions, 'proxyVertexAISpeech');
      const response: any = await proxyVertexAISpeech({
        audioBytes: base64Audio,
        config: stream.config, // Send the stream's config
        streamId: streamId, // Pass streamId for context if needed by proxy/client
      });

      // The proxy now returns an object like { results: StreamingRecognizeResponse[] }
      if (response.data && Array.isArray(response.data.results)) {
        response.data.results.forEach((streamingResponseItem: any) => {
          // Each item is a google.cloud.speech.v1.StreamingRecognizeResponse
          // It contains its own 'results' list (usually one item for streaming)
          // and things like 'speechEventType', 'isFinal', etc.
          if (streamingResponseItem.results && streamingResponseItem.results.length > 0) {
            const segments = this.processRecognitionResults(streamingResponseItem.results, streamId);
            if (segments.length > 0) {
              const isFinal = streamingResponseItem.results.some((res: any) => res.isFinal);
              const stability = streamingResponseItem.results[0]?.stability || 0; // Example: take stability of first partial result

              const streamingResult: StreamingResult = {
                segments,
                isFinal,
                stability,
                resultEndTime: streamingResponseItem.resultEndTime ?
                               parseInt(streamingResponseItem.resultEndTime.seconds) * 1000 +
                               Math.floor(streamingResponseItem.resultEndTime.nanos / 1000000) :
                               (Date.now() - stream.startTime),
              };
              stream.onResult(streamingResult);
            }
          } else if (streamingResponseItem.speechEventType === 'SPEECH_EVENT_UNSPECIFIED' && streamingResponseItem.results.length === 0 && !streamingResponseItem.error) {
            // This can happen for empty audio or silence, not necessarily an error.
            // console.debug("Received empty speech event:", streamingResponseItem);
          } else if (streamingResponseItem.error) {
             // streamingResponseItem.error would typically be a google.rpc.Status like object.
             // Logging the full object here is for debug; ensure it doesn't inadvertently contain sensitive data from the request if error structures change.
             console.error("Error in individual streaming response item:", streamingResponseItem.error);
             // Handle specific item error if necessary, though top-level error is caught below
          }
        });
      } else {
        console.warn("No results in proxy response or unexpected structure:", response.data);
      }
    } catch (error: any) {
      let errorType = RecognitionErrorType.UNKNOWN;
      let errorMessage = `Failed to process audio chunk via proxy: ${error.message || 'Unknown error'}`;

      if (error.code === 'functions/unauthenticated') {
        errorType = RecognitionErrorType.AUTHENTICATION_ERROR;
      } else if (error.code === 'functions/not-found' || error.code === 'functions/unavailable') {
        errorType = RecognitionErrorType.NETWORK_ERROR;
      } else if (error.code === 'resource-exhausted') {
        errorType = RecognitionErrorType.QUOTA_EXCEEDED;
      } else if (error.code === 'invalid-argument') {
        errorType = RecognitionErrorType.INVALID_AUDIO;
      }

      const recognitionError = new RecognitionError(errorType, errorMessage, error.details || error);
      stream.onError(recognitionError);
    }
  }

  /**
   * Stop streaming recognition
   * @param streamId Stream ID
   */
  async stopStreamingRecognition(streamId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.isActive = false;
      this.activeStreams.delete(streamId);
    }
  }

  /**
   * Transcribe audio file
   * @param audioData Audio file data
   * @param config Recognition configuration
   * @returns Transcription segments
   */
  async transcribeAudioFile(
    audioData: ArrayBuffer,
    config: SpeechConfig
  ): Promise<TranscriptionSegment[]> {
    try {
      const base64Audio = this.arrayBufferToBase64(audioData);
      
      const recognitionConfig = {
        // encoding: 'WEBM_OPUS', // Encoding is inherent in the audio data from client
        sampleRateHertz: config.sampleRate,
        languageCode: config.language,
        enableSpeakerDiarization: config.enableSpeakerDiarization,
        diarizationSpeakerCount: config.maxSpeakers || 2,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation,
        enableWordTimeOffsets: config.enableWordTimeOffsets,
        model: config.model || 'latest_long',
        useEnhanced: config.useEnhanced || true
      };

      const proxyVertexAISpeech = httpsCallable(this.functions, 'proxyVertexAISpeech');
      // Explicitly define the type of the expected response for clarity
      const result: any = await proxyVertexAISpeech({
        audioBytes: base64Audio,
        config: recognitionConfig
      });

      // The proxy should return data in a 'data' property
      if (result.data && result.data.results) {
        return this.processRecognitionResults(result.data.results);
      } else {
        // Handle cases where results might be missing or in an unexpected structure
        console.error("Unexpected response structure from proxyVertexAISpeech:", result.data);
        throw new RecognitionError(
          RecognitionErrorType.UNKNOWN,
          "Unexpected response structure from proxy.",
          result.data
        );
      }
    } catch (error: any) {
      console.error("Error calling proxyVertexAISpeech:", error);
      let errorType = RecognitionErrorType.UNKNOWN;
      let errorMessage = `Failed to transcribe audio file via proxy: ${error.message}`;

      if (error.code === 'functions/unauthenticated') {
        errorType = RecognitionErrorType.AUTHENTICATION_ERROR;
        errorMessage = "Authentication error: User is not authenticated to call the proxy function.";
      } else if (error.code === 'functions/not-found') {
        errorType = RecognitionErrorType.NETWORK_ERROR; // Or a more specific "endpoint not found"
        errorMessage = "Network error: The proxy function endpoint was not found.";
      } else if (error.code === 'functions/internal') {
        errorType = RecognitionErrorType.UNKNOWN;
        errorMessage = `Internal proxy error: ${error.message}`;
      }
      // Add more specific error handling based on proxy responses if needed
      throw new RecognitionError(
        errorType,
        errorMessage,
        error
      );
    }
  }

  /**
   * Process recognition results into transcription segments
   * @param results Raw recognition results
   * @param streamId Optional stream ID for real-time processing
   * @returns Transcription segments
   */
  private processRecognitionResults(
    results: any[],
    streamId?: string
  ): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = [];
    
    results.forEach((result, index) => {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        
        // Extract speaker information if available
        let speakerId = 'unknown';
        let speakerConfidence = 0.5;
        
        if (result.words && result.words.length > 0) {
          const firstWord = result.words[0];
          if (firstWord.speakerTag !== undefined) {
            speakerId = `speaker_${firstWord.speakerTag}`;
            speakerConfidence = 0.8; // Vertex AI doesn't provide speaker confidence
          }
        }

        const segment: TranscriptionSegment = {
          id: `segment_${streamId || 'file'}_${index}_${Date.now()}`,
          startTime: this.parseTimeToSeconds(result.words?.[0]?.startTime || '0s'),
          endTime: this.parseTimeToSeconds(result.words?.[result.words.length - 1]?.endTime || '0s'),
          text: alternative.transcript,
          speakerId,
          confidence: alternative.confidence || 0.8,
          speakerConfidence: speakerConfidence > 0.7 ? SpeakerConfidence.HIGH :
                           speakerConfidence > 0.4 ? SpeakerConfidence.MEDIUM : SpeakerConfidence.LOW,
          isInterim: !result.isFinal,
          language: 'en-US', // Should be extracted from config
          entities: [], // Will be populated by AI analysis
        };

        segments.push(segment);
      }
    });

    return segments;
  }

  /**
   * Convert ArrayBuffer to base64 string
   * @param buffer ArrayBuffer
   * @returns Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Parse time string to seconds
   * @param timeString Time string (e.g., "1.5s")
   * @returns Seconds as number
   */
  private parseTimeToSeconds(timeString: string): number {
    if (timeString.endsWith('s')) {
      return parseFloat(timeString.slice(0, -1));
    }
    return parseFloat(timeString);
  }

  /**
   * Get supported languages
   * @returns Array of supported language codes
   */
  getSupportedLanguages(): string[] {
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-US', 'fr-FR', 'fr-CA', 'de-DE',
      'it-IT', 'pt-BR', 'pt-PT', 'ru-RU', 'ja-JP',
      'ko-KR', 'zh-CN', 'zh-TW', 'nl-NL', 'sv-SE',
      'da-DK', 'no-NO', 'fi-FI', 'pl-PL', 'cs-CZ',
      'hu-HU', 'ro-RO', 'sk-SK', 'sl-SI', 'hr-HR',
      'bg-BG', 'et-EE', 'lv-LV', 'lt-LT', 'mt-MT'
    ];
  }

  /**
   * Check if service is available
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      // Attempt to call the proxy function with a minimal or 'healthCheck' payload.
      // This is a simplified check. A dedicated health check Firebase Function would be more robust.
      const healthCheckProxy = httpsCallable(this.functions, 'proxyVertexAISpeech');

      // Send a payload that the function might expect, or a specific health check indicator.
      // The function might error if the payload isn't what it expects for transcription,
      // but an error other than 'functions/not-found' can still indicate reachability.
      await healthCheckProxy({
        healthCheck: true, // Add a flag that your CFn could specifically look for
        audioBytes: "cHVycG9zZWZ1bGx5IGVtcHR5IGF1ZGlv", // Empty base64 audio
        config: { languageCode: "en-US" } // Minimal config
      });
      return true; // If the call succeeds or fails with certain errors (see below)
    } catch (error: any) {
      // 'functions/not-found' means the function isn't deployed or the name is wrong.
      if (error.code === 'functions/not-found') {
        console.error("Availability check failed: proxyVertexAISpeech function not found.", error);
        return false;
      }
      // Other errors (e.g., 'functions/internal' if healthCheck isn't handled, or invalid args)
      // can still imply the function is deployed. This logic is a simplification.
      // For a real health check, the CFn should return a specific success response for a health check request.
      console.info("Availability check for proxyVertexAISpeech: function is reachable (though it may have errored on health check payload).", error);
      return true;
    }
  }

  /**
   * Clean up all active streams
   */
  cleanup(): void {
    this.activeStreams.forEach((stream, streamId) => {
      stream.isActive = false;
    });
    this.activeStreams.clear();
  }
}
