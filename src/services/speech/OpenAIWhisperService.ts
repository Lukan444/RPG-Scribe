/**
 * OpenAI Whisper Speech-to-Text Service
 * 
 * Fallback service for speech recognition using OpenAI's Whisper API
 * Supports file transcription and translation capabilities
 */

import { TranscriptionSegment, SpeakerInfo, SpeakerConfidence } from '../../models/Transcription';
import { RecognitionError, RecognitionErrorType, SpeechConfig, StreamingResult } from './VertexAISpeechService';
import { createLiveTranscriptionLogger, LogCategory } from '../../utils/liveTranscriptionLogger';

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
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'whisper-1';
  private logger = createLiveTranscriptionLogger('OpenAIWhisperService');

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.logger.info(LogCategory.SERVICE, 'OpenAI Whisper service initialized', {
      model: this.model,
      baseUrl: this.baseUrl,
      hasApiKey: !!apiKey
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
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', this.model);
      formData.append('language', languageCode);
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'segment');

      this.logger.debug(LogCategory.TRANSCRIPTION, 'Sending request to Whisper API', {
        url: `${this.baseUrl}/audio/transcriptions`,
        model: this.model,
        language: languageCode,
        fileSize
      });

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      this.logger.debug(LogCategory.TRANSCRIPTION, 'Received response from Whisper API', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `Whisper API error: ${response.status} - ${errorData.error?.message || response.statusText}`;

        this.logger.error(LogCategory.TRANSCRIPTION, 'Whisper API request failed', new Error(errorMessage), {
          status: response.status,
          statusText: response.statusText,
          errorData,
          fileName,
          fileSize
        });

        throw new Error(errorMessage);
      }

      const result: WhisperResponse = await response.json();

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

      throw new RecognitionError(
        RecognitionErrorType.NETWORK_ERROR,
        `Whisper transcription failed: ${error}`,
        error
      );
    }
  }

  /**
   * Translate audio file to English using Whisper
   * @param audioFile Audio file (File or Blob)
   * @returns Transcription segments in English
   */
  async translateAudioFile(audioFile: File | Blob): Promise<TranscriptionSegment[]> {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', this.model);
      formData.append('response_format', 'verbose_json');
      formData.append('timestamp_granularities[]', 'segment');

      const response = await fetch(`${this.baseUrl}/audio/translations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const result: WhisperResponse = await response.json();
      return this.processWhisperResponse(result, true);
    } catch (error) {
      throw new RecognitionError(
        RecognitionErrorType.NETWORK_ERROR,
        `Whisper translation failed: ${error}`,
        error
      );
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
      } catch (error) {
        console.warn(`Failed to transcribe chunk ${i}:`, error);
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
   * Calculate confidence score from Whisper segment data
   * @param segment Whisper segment
   * @returns Confidence score (0-1)
   */
  private calculateConfidence(segment: WhisperSegment): number {
    // Whisper doesn't provide direct confidence scores
    // We estimate based on available metrics
    const avgLogProb = segment.avg_logprob || -1;
    const noSpeechProb = segment.no_speech_prob || 0;
    const compressionRatio = segment.compression_ratio || 2.4;

    // Higher avg_logprob (closer to 0) = higher confidence
    // Lower no_speech_prob = higher confidence
    // Compression ratio around 2.4 is normal, very high or low indicates issues
    
    let confidence = 0.5; // Base confidence
    
    // Adjust based on avg_logprob (-1 to 0 range)
    if (avgLogProb > -0.5) confidence += 0.3;
    else if (avgLogProb > -1) confidence += 0.2;
    else confidence += 0.1;
    
    // Adjust based on no_speech_prob (0 to 1 range)
    confidence += (1 - noSpeechProb) * 0.2;
    
    // Adjust based on compression ratio
    if (compressionRatio >= 2.0 && compressionRatio <= 3.0) {
      confidence += 0.1;
    }
    
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
      const response = await fetch(`${this.baseUrl}/models`, {
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
