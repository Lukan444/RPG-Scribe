/**
 * Vertex AI Speech-to-Text Service
 * 
 * Integrates with Google Cloud Vertex AI Speech-to-Text API for real-time transcription
 * Supports streaming audio, speaker diarization, and multiple languages
 */

import { TranscriptionSegment, SpeakerInfo, AudioSourceType, SpeakerConfidence } from '../../models/Transcription';

/**
 * Speech recognition configuration
 */
export interface SpeechConfig {
  language: string;
  sampleRate: number;
  channels: number;
  enableSpeakerDiarization: boolean;
  maxSpeakers?: number;
  enableAutomaticPunctuation: boolean;
  enableWordTimeOffsets: boolean;
  model?: string;
  useEnhanced?: boolean;
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
  private apiKey: string;
  private projectId: string;
  private location: string;
  private baseUrl: string;
  private activeStreams: Map<string, any> = new Map();

  constructor(config: {
    apiKey: string;
    projectId: string;
    location?: string;
  }) {
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.location = config.location || 'us-central1';
    this.baseUrl = `https://${this.location}-speech.googleapis.com/v1`;
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
      // For browser environment, we'll use the REST API with chunked uploads
      // In a production environment, you'd want to use WebSocket or gRPC streaming
      const recognitionConfig = {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: config.sampleRate,
        languageCode: config.language,
        enableSpeakerDiarization: config.enableSpeakerDiarization,
        diarizationSpeakerCount: config.maxSpeakers || 2,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation,
        enableWordTimeOffsets: config.enableWordTimeOffsets,
        model: config.model || 'latest_long',
        useEnhanced: config.useEnhanced || true
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
      
      // Send to Vertex AI Speech API
      const response = await fetch(`${this.baseUrl}/speech:recognize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: stream.config,
          audio: {
            content: base64Audio
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Process recognition results
      if (result.results && result.results.length > 0) {
        const segments = this.processRecognitionResults(result.results, streamId);
        const streamingResult: StreamingResult = {
          segments,
          isFinal: true,
          stability: 1.0,
          resultEndTime: Date.now() - stream.startTime
        };
        
        stream.onResult(streamingResult);
      }
    } catch (error) {
      const recognitionError = new RecognitionError(
        RecognitionErrorType.NETWORK_ERROR,
        `Failed to process audio chunk: ${error}`,
        error
      );
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
        encoding: 'WEBM_OPUS',
        sampleRateHertz: config.sampleRate,
        languageCode: config.language,
        enableSpeakerDiarization: config.enableSpeakerDiarization,
        diarizationSpeakerCount: config.maxSpeakers || 2,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation,
        enableWordTimeOffsets: config.enableWordTimeOffsets,
        model: config.model || 'latest_long',
        useEnhanced: config.useEnhanced || true
      };

      const response = await fetch(`${this.baseUrl}/speech:recognize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: recognitionConfig,
          audio: {
            content: base64Audio
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return this.processRecognitionResults(result.results || []);
    } catch (error) {
      throw new RecognitionError(
        RecognitionErrorType.NETWORK_ERROR,
        `Failed to transcribe audio file: ${error}`,
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
      const response = await fetch(`${this.baseUrl}/operations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
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
