/**
 * OpenAI Whisper Speech-to-Text Service
 * 
 * Fallback service for speech recognition using OpenAI's Whisper API
 * Supports file transcription and translation capabilities
 */

import { TranscriptionSegment, SpeakerInfo, SpeakerConfidence } from '../../models/Transcription';
import { RecognitionError, RecognitionErrorType, SpeechConfig, StreamingResult } from './VertexAISpeechService';
import { createLiveTranscriptionLogger, LogCategory } from '../../utils/liveTranscriptionLogger';
import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Whisper API response format
 */
interface WhisperResponse {
  text: string;
  segments?: WhisperSegment[];
  language?: string;
}

/**
 * Whisper segment format
 */
interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

/**
 * OpenAI Whisper Service
 */
export class OpenAIWhisperService {
  private model: string = 'whisper-1';
  private logger = createLiveTranscriptionLogger('OpenAIWhisperService');
  private functions = getFunctions();

  constructor() {
    // API key is no longer passed or stored here
    this.logger.info(LogCategory.SERVICE, 'OpenAI Whisper service initialized', {
      model: this.model,
      // baseUrl is no longer needed
      hasApiKey: false // API key is now backend-managed
    });
  }

  /**
   * Transcribe audio file using Whisper
   * @param audioFile Audio file (File or Blob)
   * @param config Recognition configuration
   * @returns Transcription segments
   */
  async transcribeAudioFile(
    audioFile: File | Blob,
    config: SpeechConfig
  ): Promise<TranscriptionSegment[]> {
    const operationId = `whisper-transcribe-${Date.now()}`;
    this.logger.startTiming(operationId, 'OpenAI Whisper transcription');

    const fileSize = audioFile.size;
    const fileName = audioFile instanceof File ? audioFile.name : 'blob';
    const languageCode = this.extractLanguageCode(config.language);

    this.logger.info(LogCategory.TRANSCRIPTION, 'Starting Whisper transcription', {
      fileName,
      fileSize,
      language: languageCode,
      model: this.model,
      config: {
        enableSpeakerDiarization: config.enableSpeakerDiarization,
        maxSpeakers: config.maxSpeakers
      }
    });

    try {
      // Convert File/Blob to base64 to send to the Cloud Function
      const audioBytes = await this.fileOrBlobToBase64(audioFile);

      this.logger.debug(LogCategory.TRANSCRIPTION, 'Sending request to proxyOpenAIWhisper', {
        model: this.model,
        language: languageCode,
        fileSize
      });

      const proxyOpenAIWhisper = httpsCallable(this.functions, 'proxyOpenAIWhisper');
      const response: any = await proxyOpenAIWhisper({
        audioBytes,
        model: this.model,
        language: languageCode,
        response_format: 'verbose_json', // Keep response format for detailed segments
        timestamp_granularities: ['segment'] // Ensure segments are requested
      });

      this.logger.debug(LogCategory.TRANSCRIPTION, 'Received response from proxyOpenAIWhisper', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      // The proxy function's response is expected to be in response.data
      if (!response.data) {
        const errorMessage = 'Proxy error: No data received from proxyOpenAIWhisper';
        this.logger.error(LogCategory.TRANSCRIPTION, errorMessage, new Error(errorMessage), {
          fileName,
          fileSize
        });
        throw new Error(errorMessage);
      }

      // Assuming the proxy returns the Whisper JSON directly in the 'data' field
      const result: WhisperResponse = response.data;

      this.logger.info(LogCategory.TRANSCRIPTION, 'Whisper API response received', {
        hasText: !!result.text,
        textLength: result.text?.length || 0,
        segmentCount: result.segments?.length || 0,
        detectedLanguage: result.language
      });

      const segments = this.processWhisperResponse(result);

      this.logger.endTiming(operationId, {
        success: true,
        segmentCount: segments.length,
        totalTextLength: segments.reduce((sum, s) => sum + s.text.length, 0),
        averageConfidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
      });

      this.logger.info(LogCategory.TRANSCRIPTION, 'Whisper transcription completed successfully', {
        fileName,
        segmentCount: segments.length,
        totalDuration: segments.length > 0 ? segments[segments.length - 1].endTime : 0
      });

      return segments;
    } catch (error) {
      this.logger.error(LogCategory.TRANSCRIPTION, 'Whisper transcription failed', error as Error, {
        fileName,
        fileSize,
        language: languageCode,
        model: this.model
      });

      this.logger.endTiming(operationId, { success: false });

      let errorType = RecognitionErrorType.UNKNOWN;
      let errorMessage = `Whisper transcription failed via proxy: ${error.message || 'Unknown error'}`;

      if (error.code === 'functions/unauthenticated') {
        errorType = RecognitionErrorType.AUTHENTICATION_ERROR;
      } else if (error.code === 'functions/not-found' || error.code === 'functions/unavailable') {
        errorType = RecognitionErrorType.NETWORK_ERROR;
      } else if (error.code === 'resource-exhausted') {
        errorType = RecognitionErrorType.QUOTA_EXCEEDED;
      } else if (error.code === 'invalid-argument') {
        // This might indicate an issue with the audio data or parameters passed
        errorType = RecognitionErrorType.INVALID_AUDIO;
      }

      throw new RecognitionError(errorType, errorMessage, error.details || error);
    }
  }

  /**
   * Helper to convert File or Blob to base64 string
   */
  private async fileOrBlobToBase64(fileOrBlob: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          // Result is ArrayBuffer, convert to base64 string
          // The result includes the 'data:audio/...;base64,' prefix, remove it if the backend expects raw base64
          const base64WithPrefix = reader.result as string;
          resolve(base64WithPrefix.split(',')[1]); // Get only the base64 part
        } else {
          reject(new Error("Failed to read file as base64: result is null"));
        }
      };
      reader.onerror = (error) => {
        reject(new Error(`FileReader error: ${error}`));
      };
      reader.readAsDataURL(fileOrBlob); // Reads as a data URL (base64 encoded)
    });
  }

  /**
   * Translate audio file to English using Whisper
   * @param audioFile Audio file (File or Blob)
   * @returns Transcription segments in English
   */
  async translateAudioFile(audioFile: File | Blob): Promise<TranscriptionSegment[]> {
    const operationId = `whisper-translate-${Date.now()}`;
    this.logger.startTiming(operationId, 'OpenAI Whisper translation');
    const fileSize = audioFile.size;
    const fileName = audioFile instanceof File ? audioFile.name : 'blob';

    this.logger.info(LogCategory.TRANSLATION, 'Starting Whisper translation', {
      fileName,
      fileSize,
      model: this.model
    });

    try {
      const audioBytes = await this.fileOrBlobToBase64(audioFile);

      const proxyOpenAIWhisper = httpsCallable(this.functions, 'proxyOpenAIWhisper');
      const response: any = await proxyOpenAIWhisper({
        audioBytes,
        model: this.model,
        task: 'translate', // Add a task parameter for the proxy
        response_format: 'verbose_json',
        timestamp_granularities: ['segment']
      });

      if (!response.data) {
        const errorMessage = 'Proxy error: No data received from proxyOpenAIWhisper for translation';
        this.logger.error(LogCategory.TRANSLATION, errorMessage, new Error(errorMessage), { fileName, fileSize });
        throw new Error(errorMessage);
      }

      const result: WhisperResponse = response.data;
      const segments = this.processWhisperResponse(result, true);

      this.logger.endTiming(operationId, { success: true, segmentCount: segments.length });
      this.logger.info(LogCategory.TRANSLATION, 'Whisper translation completed successfully', {
        fileName,
        segmentCount: segments.length
      });
      return segments;
    } catch (error: any) {
      this.logger.error(LogCategory.TRANSLATION, 'Whisper translation failed', error as Error, { fileName, fileSize });
      this.logger.endTiming(operationId, { success: false });

      let errorType = RecognitionErrorType.UNKNOWN;
      let errorMessage = `Whisper translation failed via proxy: ${error.message || 'Unknown error'}`;

      if (error.code === 'functions/unauthenticated') {
        errorType = RecognitionErrorType.AUTHENTICATION_ERROR;
      } else if (error.code === 'functions/not-found' || error.code === 'functions/unavailable') {
        errorType = RecognitionErrorType.NETWORK_ERROR;
      } else if (error.code === 'resource-exhausted') {
        errorType = RecognitionErrorType.QUOTA_EXCEEDED;
      } else if (error.code === 'invalid-argument') {
        errorType = RecognitionErrorType.INVALID_AUDIO;
      }

      throw new RecognitionError(errorType, errorMessage, error.details || error);
    }
  }

  /**
   * Chunk large audio file for processing
   * @param audioFile Large audio file
   * @param chunkDuration Duration of each chunk in seconds
   * @param config Recognition configuration
   * @returns Combined transcription segments
   */
  async transcribeLargeAudioFile(
    audioFile: File,
    chunkDuration: number = 600, // 10 minutes
    config: SpeechConfig
  ): Promise<TranscriptionSegment[]> {
    // For large files, we need to chunk them
    // This is a simplified implementation - in production, you'd use Web Audio API
    // to properly split audio while maintaining quality
    
    const fileSize = audioFile.size;
    const chunkSize = Math.floor(fileSize / Math.ceil(fileSize / (chunkDuration * 1024 * 1024))); // Rough estimate
    
    const chunks: Blob[] = [];
    let offset = 0;
    
    while (offset < fileSize) {
      const chunk = audioFile.slice(offset, offset + chunkSize);
      chunks.push(chunk);
      offset += chunkSize;
    }

    const allSegments: TranscriptionSegment[] = [];
    let timeOffset = 0;

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkSegments = await this.transcribeAudioFile(chunks[i], config);
        
        // Adjust timestamps for chunk offset
        const adjustedSegments = chunkSegments.map(segment => ({
          ...segment,
          id: `${segment.id}_chunk_${i}`,
          startTime: segment.startTime + timeOffset,
          endTime: segment.endTime + timeOffset
        }));
        
        allSegments.push(...adjustedSegments);
        timeOffset += chunkDuration;
      } catch (error: any) {
        this.logger.warn(LogCategory.TRANSCRIPTION, `Failed to transcribe audio chunk ${i + 1}/${chunks.length}`, {
          chunkIndex: i,
          totalChunks: chunks.length,
          error: error.message || "Unknown error during chunk transcription",
          // Optionally log error.type if it's a RecognitionError
          errorType: error instanceof RecognitionError ? error.type : undefined,
        });
        // Continue with other chunks
      }
    }

    return allSegments;
  }

  /**
   * Process Whisper API response into transcription segments
   * @param response Whisper API response
   * @param isTranslation Whether this is a translation
   * @returns Transcription segments
   */
  private processWhisperResponse(
    response: WhisperResponse,
    isTranslation: boolean = false
  ): TranscriptionSegment[] {
    const segments: TranscriptionSegment[] = [];

    if (response.segments) {
      response.segments.forEach((segment, index) => {
        const transcriptionSegment: TranscriptionSegment = {
          id: `whisper_segment_${index}_${Date.now()}`,
          startTime: segment.start,
          endTime: segment.end,
          text: segment.text.trim(),
          speakerId: 'unknown', // Whisper doesn't provide speaker diarization
          confidence: this.calculateConfidence(segment),
          speakerConfidence: SpeakerConfidence.UNKNOWN,
          isInterim: false,
          language: isTranslation ? 'en' : (response.language || 'unknown'),
          entities: [] // Will be populated by AI analysis
        };

        segments.push(transcriptionSegment);
      });
    } else {
      // Fallback for simple text response
      const segment: TranscriptionSegment = {
        id: `whisper_full_${Date.now()}`,
        startTime: 0,
        endTime: 0, // Unknown duration
        text: response.text,
        speakerId: 'unknown',
        confidence: 0.8, // Default confidence
        speakerConfidence: SpeakerConfidence.UNKNOWN,
        isInterim: false,
        language: isTranslation ? 'en' : (response.language || 'unknown'),
        entities: []
      };

      segments.push(segment);
    }

    return segments;
  }

  /**
   * Estimates a confidence score for a given Whisper segment.
   *
   * IMPORTANT: OpenAI's Whisper API (as of last model update) does not provide a direct, per-segment
   * or per-word confidence score in its standard response. This method attempts to heuristically
   * estimate a confidence value based on several metrics available in the verbose JSON output:
   *
   * 1.  `avg_logprob`: Average log probability of the tokens in the segment. Values closer to 0
   *     are generally better. Typical range is negative, e.g., -1.0 to 0.
   * 2.  `no_speech_prob`: Probability that the segment contains no speech. Lower values are better.
   *     Range is 0 to 1.
   * 3.  `compression_ratio`: The GZip compression ratio of the segment's text. Ratios significantly
   *     deviating from a typical range (e.g., Whisper docs mention ~2.4 for normal text) might
   *     indicate repetitive or unusual content, potentially affecting quality.
   *
   * The estimation formula is heuristic and combines these factors:
   * - Starts with a base confidence.
   * - Adjusts score upwards for higher `avg_logprob` (closer to 0).
   * - Adjusts score upwards for lower `no_speech_prob`.
   * - Adds a small bonus if `compression_ratio` is within an expected "normal" range.
   *
   * This estimated score should be used with caution. Its accuracy may vary, and it is not a
   * substitute for a true model-provided confidence score. If precise confidence is critical for an
   * application, users might need to explore alternative speech recognition services that provide
   * such scores directly, or employ more sophisticated methods for confidence estimation.
   *
   * @param segment The WhisperSegment object from the API response.
   * @returns An estimated confidence score between 0.0 and 1.0.
   */
  private calculateConfidence(segment: WhisperSegment): number {
    // Default values if metrics are not present in the segment data.
    // These defaults are chosen to be somewhat neutral or slightly pessimistic.
    const avgLogProb = segment.avg_logprob !== undefined ? segment.avg_logprob : -1.0; // Typical range is negative; -1 is a reasonably low logprob.
    const noSpeechProb = segment.no_speech_prob !== undefined ? segment.no_speech_prob : 0.0; // Default to 0 (is speech) if not provided.
    const compressionRatio = segment.compression_ratio !== undefined ? segment.compression_ratio : 2.4; // Default to a "normal" ratio.

    // Base confidence starts at 0.5 (neutral).
    let confidence = 0.5;

    // --- Adjust based on Average Log Probability (avg_logprob) ---
    // `avg_logprob` is the average of the log probabilities of the tokens in the segment.
    // Values are typically negative. Higher values (closer to 0) indicate greater confidence from the model.
    // Example range seen in practice: -1.5 (low) to -0.1 (high).
    // We add a bonus based on ranges:
    if (avgLogProb > -0.3) { // Very good log probability
      confidence += 0.3;
    } else if (avgLogProb > -0.6) { // Moderately good
      confidence += 0.2;
    } else if (avgLogProb > -1.0) { // Okay / borderline
      confidence += 0.1;
    }
    // If avg_logprob is very low (e.g., < -1.0), it contributes less or no bonus from this factor.

    // --- Adjust based on No Speech Probability (no_speech_prob) ---
    // `no_speech_prob` is the probability that the audio segment contains no speech.
    // Values range from 0 to 1. Lower values mean it's more likely to be speech.
    // We add a bonus proportional to (1 - no_speech_prob), maxing out at +0.2.
    // If no_speech_prob is high (e.g., > 0.5), this bonus becomes small or negative before clamping.
    confidence += (1 - noSpeechProb) * 0.2;

    // --- Adjust based on Compression Ratio (compression_ratio) ---
    // Whisper paper mentions that GZip compression ratio of transcribed text is usually around 2.4.
    // Deviations might indicate gibberish, highly repetitive text, or other anomalies.
    // We add a small bonus if it's within a "normal" range.
    if (compressionRatio >= 1.8 && compressionRatio <= 3.0) {
      confidence += 0.1;
    }
    // Segments with very low or very high compression ratios might be less reliable.

    // Ensure the final confidence score is clamped between 0.0 and 1.0.
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Extract language code for Whisper API
   * @param languageCode Full language code (e.g., 'en-US')
   * @returns Whisper language code (e.g., 'en')
   */
  private extractLanguageCode(languageCode: string): string {
    return languageCode.split('-')[0].toLowerCase();
  }

  /**
   * Get supported languages for Whisper
   * @returns Array of supported language codes
   */
  getSupportedLanguages(): string[] {
    return [
      'af', 'am', 'ar', 'as', 'az', 'ba', 'be', 'bg', 'bn', 'bo', 'br', 'bs', 'ca', 'cs', 'cy', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 'fo', 'fr', 'gl', 'gu', 'ha', 'haw', 'he', 'hi', 'hr', 'ht', 'hu', 'hy', 'id', 'is', 'it', 'ja', 'jw', 'ka', 'kk', 'km', 'kn', 'ko', 'la', 'lb', 'ln', 'lo', 'lt', 'lv', 'mg', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my', 'ne', 'nl', 'nn', 'no', 'oc', 'pa', 'pl', 'ps', 'pt', 'ro', 'ru', 'sa', 'sd', 'si', 'sk', 'sl', 'sn', 'so', 'sq', 'sr', 'su', 'sv', 'sw', 'ta', 'te', 'tg', 'th', 'tk', 'tl', 'tr', 'tt', 'uk', 'ur', 'uz', 'vi', 'yi', 'yo', 'zh'
    ];
  }

  /**
   * Check if service is available
   * @returns Promise resolving to availability status
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const healthCheckProxy = httpsCallable(this.functions, 'proxyOpenAIWhisper');
      // Send a minimal payload, or a specific healthCheck flag if the proxy supports it.
      // The proxy might error if it expects audioBytes for transcription,
      // but an error other than 'functions/not-found' can indicate reachability.
      await healthCheckProxy({
        healthCheck: true, // Flag for the Cloud Function
        // model: this.model // Optionally send model if CFn uses it for health check logic
      });
      this.logger.info(LogCategory.SERVICE, "OpenAI Whisper proxy is available.");
      return true;
    } catch (error: any) {
      if (error.code === 'functions/not-found') {
        this.logger.error(LogCategory.SERVICE, "Availability check failed: proxyOpenAIWhisper function not found.", error);
        return false;
      }
      // Other errors could mean the function is deployed but the healthCheck payload isn't handled gracefully.
      // For a true health check, the CFn should return a specific success for a health check request.
      this.logger.warn(LogCategory.SERVICE, "Availability check for proxyOpenAIWhisper: function is reachable but may have errored on health check payload.", error);
      return true; // Assuming "reachable" is "available" for this simplified check
    }
  }

  /**
   * Get model information
   * @returns Model information
   */
  getModelInfo(): { name: string; maxFileSize: number; supportedFormats: string[] } {
    return {
      name: this.model,
      maxFileSize: 25 * 1024 * 1024, // 25MB limit
      supportedFormats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
    };
  }

  /**
   * Streaming recognition (not supported by Whisper API)
   * This method exists for interface compatibility but throws an error
   */
  async startStreamingRecognition(): Promise<string> {
    throw new RecognitionError(
      RecognitionErrorType.UNKNOWN,
      'Streaming recognition is not supported by OpenAI Whisper API. Use file transcription instead.',
      { feature: 'streaming', supported: false }
    );
  }

  /**
   * Send audio chunk (not supported by Whisper API)
   */
  async sendAudioChunk(): Promise<void> {
    throw new RecognitionError(
      RecognitionErrorType.UNKNOWN,
      'Audio chunk streaming is not supported by OpenAI Whisper API.',
      { feature: 'streaming', supported: false }
    );
  }

  /**
   * Stop streaming recognition (not supported by Whisper API)
   */
  async stopStreamingRecognition(): Promise<void> {
    // No-op for compatibility
  }
}
