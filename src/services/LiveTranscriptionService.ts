/**
 * Live Transcription Service
 * 
 * Main orchestration service for live session transcription
 * Coordinates audio capture, speech recognition, and real-time streaming
 */

import { TranscriptionService } from './transcription.service';
import { VertexAISpeechService, SpeechConfig, RecognitionError } from './speech/VertexAISpeechService';
import { OpenAIWhisperService } from './speech/OpenAIWhisperService';
import { LiveTranscriptionConfigService } from './liveTranscriptionConfig.service';
import { TranscriptionWebSocketService, ConnectionState } from './websocket/TranscriptionWebSocketService';
import { 
  SessionTranscription, 
  TranscriptionSegment, 
  AudioSourceType, 
  TranscriptionStatus,
  LiveTranscriptionSession
} from '../models/Transcription';

/**
 * Transcription provider types
 */
export enum TranscriptionProvider {
  VERTEX_AI = 'vertex-ai',
  OPENAI_WHISPER = 'openai-whisper',
  BROWSER_API = 'browser-api'
}

/**
 * Live transcription configuration
 */
export interface LiveTranscriptionConfig {
  provider: TranscriptionProvider;
  fallbackProvider?: TranscriptionProvider;
  language: string;
  enableSpeakerDiarization: boolean;
  maxSpeakers?: number;
  enableRealTimeStreaming: boolean;
  chunkDuration: number; // seconds
  confidenceThreshold: number;
  audioConfig: {
    sampleRate: number;
    channels: number;
    bitDepth: number;
  };
}

/**
 * Session state
 */
export enum SessionState {
  IDLE = 'idle',
  STARTING = 'starting',
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPING = 'stopping',
  ERROR = 'error'
}

/**
 * Live transcription events
 */
export interface LiveTranscriptionEvents {
  onStateChange?: (state: SessionState) => void;
  onSegmentReceived?: (segment: TranscriptionSegment) => void;
  onError?: (error: Error) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: LiveTranscriptionConfig = {
  provider: TranscriptionProvider.VERTEX_AI,
  fallbackProvider: TranscriptionProvider.OPENAI_WHISPER,
  language: 'en-US',
  enableSpeakerDiarization: true,
  maxSpeakers: 4,
  enableRealTimeStreaming: true,
  chunkDuration: 2,
  confidenceThreshold: 0.7,
  audioConfig: {
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16
  }
};

/**
 * Live Transcription Service
 */
export class LiveTranscriptionService {
  private config: LiveTranscriptionConfig;
  private events: LiveTranscriptionEvents;
  private transcriptionService: TranscriptionService;
  private vertexAIService: VertexAISpeechService | null = null;
  private whisperService: OpenAIWhisperService | null = null;
  private configService: LiveTranscriptionConfigService;
  private webSocketService: TranscriptionWebSocketService | null = null;
  
  private currentState: SessionState = SessionState.IDLE;
  private currentSessionId: string | null = null;
  private currentTranscriptionId: string | null = null;
  private activeStreamId: string | null = null;
  private segmentBuffer: TranscriptionSegment[] = [];
  private lastProcessedTime = 0;

  constructor(
    config: Partial<LiveTranscriptionConfig> = {},
    events: LiveTranscriptionEvents = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events;
    this.transcriptionService = new TranscriptionService();
    this.configService = LiveTranscriptionConfigService.getInstance();

    this.initializeServices();
  }

  /**
   * Initialize speech recognition services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize Vertex AI service
      if (process.env.REACT_APP_VERTEX_AI_API_KEY && process.env.REACT_APP_VERTEX_AI_PROJECT_ID) {
        this.vertexAIService = new VertexAISpeechService({
          apiKey: process.env.REACT_APP_VERTEX_AI_API_KEY,
          projectId: process.env.REACT_APP_VERTEX_AI_PROJECT_ID,
          location: process.env.REACT_APP_VERTEX_AI_LOCATION
        });
      }

      // Initialize OpenAI Whisper service
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        this.whisperService = new OpenAIWhisperService(process.env.REACT_APP_OPENAI_API_KEY);
      }

      // Initialize WebSocket service for real-time streaming
      if (this.config.enableRealTimeStreaming) {
        try {
          this.webSocketService = new TranscriptionWebSocketService(
            {
              url: process.env.REACT_APP_TRANSCRIPTION_WEBSOCKET_URL
            },
            {
              onConnectionStateChange: this.events.onConnectionStateChange,
              onTranscriptionSegment: this.handleWebSocketSegment.bind(this),
              onError: this.handleWebSocketError.bind(this)
            }
          );
        } catch (error) {
          console.warn('WebSocket service initialization failed, falling back to non-real-time mode:', error);
          this.webSocketService = null;
        }
      }
    } catch (error) {
      console.error('Failed to initialize transcription services:', error);
    }
  }

  /**
   * Start live transcription session
   * @param sessionId Session ID
   * @param campaignId Campaign ID
   * @param worldId World ID
   * @returns Promise resolving to transcription ID
   */
  async startLiveSession(
    sessionId: string,
    campaignId: string,
    worldId: string
  ): Promise<string> {
    if (this.currentState !== SessionState.IDLE) {
      throw new Error('Session already active');
    }

    this.updateState(SessionState.STARTING);

    try {
      // Create transcription record
      const transcriptionId = await this.transcriptionService.createSessionTranscription({
        sessionId,
        campaignId,
        worldId,
        audioSource: AudioSourceType.MICROPHONE,
        language: this.config.language,
        provider: this.config.provider,
        isLiveSession: true,
        name: `Live Session ${new Date().toLocaleString()}`,
        description: `Live transcription for session ${sessionId}`
      });

      this.currentSessionId = sessionId;
      this.currentTranscriptionId = transcriptionId;

      // Connect WebSocket if enabled
      if (this.webSocketService) {
        try {
          await this.webSocketService.connect();
          await this.webSocketService.startSession({
            campaignId,
            worldId,
            audioConfig: {
              ...this.config.audioConfig,
              format: 'webm'
            }
          });
        } catch (error) {
          console.warn('WebSocket connection failed, continuing with batch transcription:', error);
          // Don't throw error - continue with batch mode transcription
          this.webSocketService = null;
        }
      }

      // Start speech recognition
      await this.startSpeechRecognition();

      this.updateState(SessionState.ACTIVE);
      return transcriptionId;
    } catch (error) {
      this.updateState(SessionState.ERROR);
      throw error;
    }
  }

  /**
   * Process audio chunk for transcription
   * @param audioChunk Audio data
   * @param timestamp Timestamp
   */
  async processAudioChunk(audioChunk: ArrayBuffer, timestamp: number): Promise<void> {
    if (this.currentState !== SessionState.ACTIVE) {
      return;
    }

    try {
      // Send to WebSocket for real-time processing
      if (this.webSocketService?.isConnected()) {
        this.webSocketService.sendAudioChunk(audioChunk, timestamp);
      }

      // Send to speech recognition service
      if (this.activeStreamId && this.vertexAIService) {
        await this.vertexAIService.sendAudioChunk(this.activeStreamId, audioChunk);
      }
    } catch (error) {
      console.error('Failed to process audio chunk:', error);
      this.events.onError?.(error as Error);
    }
  }

  /**
   * Process uploaded audio file
   * @param audioFile Audio file
   * @param sessionId Session ID
   * @param campaignId Campaign ID
   * @param worldId World ID
   * @returns Promise resolving to transcription ID
   */
  async processAudioFile(
    audioFile: File,
    sessionId: string,
    campaignId: string,
    worldId: string
  ): Promise<string> {
    try {
      // Create transcription record
      const transcriptionId = await this.transcriptionService.createSessionTranscription({
        sessionId,
        campaignId,
        worldId,
        audioSource: AudioSourceType.FILE_UPLOAD,
        language: this.config.language,
        provider: this.config.provider,
        isLiveSession: false,
        name: `File Transcription - ${audioFile.name}`,
        description: `Transcription of uploaded file: ${audioFile.name}`
      });

      // Update status to processing
      await this.transcriptionService.update(transcriptionId, {
        status: TranscriptionStatus.PROCESSING,
        processingStartedAt: new Date()
      });

      // Process with primary provider
      let segments: TranscriptionSegment[] = [];
      
      try {
        segments = await this.transcribeWithProvider(audioFile, this.config.provider);
      } catch (error) {
        console.warn(`Primary provider ${this.config.provider} failed, trying fallback:`, error);
        
        // Try fallback provider
        if (this.config.fallbackProvider) {
          segments = await this.transcribeWithProvider(audioFile, this.config.fallbackProvider);
        } else {
          throw error;
        }
      }

      // Save transcription results
      await this.transcriptionService.addTranscriptionSegments(
        transcriptionId,
        segments,
        true
      );

      return transcriptionId;
    } catch (error) {
      console.error('Failed to process audio file:', error);
      throw error;
    }
  }

  /**
   * Pause live session
   */
  pauseSession(): void {
    if (this.currentState === SessionState.ACTIVE) {
      this.updateState(SessionState.PAUSED);
    }
  }

  /**
   * Resume live session
   */
  resumeSession(): void {
    if (this.currentState === SessionState.PAUSED) {
      this.updateState(SessionState.ACTIVE);
    }
  }

  /**
   * Stop live session
   */
  async stopSession(): Promise<void> {
    if (this.currentState === SessionState.IDLE) {
      return;
    }

    this.updateState(SessionState.STOPPING);

    try {
      // Stop speech recognition
      if (this.activeStreamId && this.vertexAIService) {
        await this.vertexAIService.stopStreamingRecognition(this.activeStreamId);
        this.activeStreamId = null;
      }

      // End WebSocket session
      if (this.webSocketService) {
        this.webSocketService.endSession();
      }

      // Finalize transcription
      if (this.currentTranscriptionId) {
        await this.transcriptionService.addTranscriptionSegments(
          this.currentTranscriptionId,
          this.segmentBuffer,
          true
        );
      }

      this.cleanup();
      this.updateState(SessionState.IDLE);
    } catch (error) {
      this.updateState(SessionState.ERROR);
      throw error;
    }
  }

  /**
   * Get current session state
   */
  getSessionState(): SessionState {
    return this.currentState;
  }

  /**
   * Get current transcription ID
   */
  getCurrentTranscriptionId(): string | null {
    return this.currentTranscriptionId;
  }

  /**
   * Start speech recognition
   */
  private async startSpeechRecognition(): Promise<void> {
    const speechConfig: SpeechConfig = {
      language: this.config.language,
      sampleRate: this.config.audioConfig.sampleRate,
      channels: this.config.audioConfig.channels,
      enableSpeakerDiarization: this.config.enableSpeakerDiarization,
      maxSpeakers: this.config.maxSpeakers,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true
    };

    if (this.vertexAIService) {
      this.activeStreamId = await this.vertexAIService.startStreamingRecognition(
        speechConfig,
        this.handleSpeechResult.bind(this),
        this.handleSpeechError.bind(this)
      );
    }
  }

  /**
   * Transcribe with specific provider
   */
  private async transcribeWithProvider(
    audioFile: File,
    provider: TranscriptionProvider
  ): Promise<TranscriptionSegment[]> {
    const speechConfig: SpeechConfig = {
      language: this.config.language,
      sampleRate: this.config.audioConfig.sampleRate,
      channels: this.config.audioConfig.channels,
      enableSpeakerDiarization: this.config.enableSpeakerDiarization,
      maxSpeakers: this.config.maxSpeakers,
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true
    };

    switch (provider) {
      case TranscriptionProvider.VERTEX_AI:
        if (!this.vertexAIService) throw new Error('Vertex AI service not available');
        const audioBuffer = await audioFile.arrayBuffer();
        return await this.vertexAIService.transcribeAudioFile(audioBuffer, speechConfig);

      case TranscriptionProvider.OPENAI_WHISPER:
        if (!this.whisperService) throw new Error('OpenAI Whisper service not available');
        return await this.whisperService.transcribeAudioFile(audioFile, speechConfig);

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(result: any): void {
    if (result.segments && result.segments.length > 0) {
      const segments = result.segments.filter((segment: TranscriptionSegment) => 
        segment.confidence >= this.config.confidenceThreshold
      );

      this.segmentBuffer.push(...segments);
      
      segments.forEach((segment: TranscriptionSegment) => {
        this.events.onSegmentReceived?.(segment);
      });

      // Periodically save segments to database
      if (Date.now() - this.lastProcessedTime > 5000) { // Every 5 seconds
        this.saveBufferedSegments();
      }
    }
  }

  /**
   * Handle speech recognition errors
   */
  private handleSpeechError(error: RecognitionError): void {
    console.error('Speech recognition error:', error);
    this.events.onError?.(error);
  }

  /**
   * Handle WebSocket segments
   */
  private handleWebSocketSegment(segment: TranscriptionSegment): void {
    this.events.onSegmentReceived?.(segment);
  }

  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(error: Error): void {
    console.error('WebSocket error:', error);

    // Provide more user-friendly error messages
    let userFriendlyError = error;
    if (error.message.includes('No local transcription server running')) {
      userFriendlyError = new Error('Real-time transcription requires a WebSocket server. Transcription will continue in batch mode.');
    } else if (error.message.includes('WebSocket connection error')) {
      userFriendlyError = new Error('Connection to transcription server failed. Check your network connection.');
    }

    this.events.onError?.(userFriendlyError);
  }

  /**
   * Save buffered segments to database
   */
  private async saveBufferedSegments(): Promise<void> {
    if (this.segmentBuffer.length > 0 && this.currentTranscriptionId) {
      try {
        await this.transcriptionService.addTranscriptionSegments(
          this.currentTranscriptionId,
          [...this.segmentBuffer],
          false
        );
        this.segmentBuffer = [];
        this.lastProcessedTime = Date.now();
      } catch (error) {
        console.error('Failed to save segments:', error);
      }
    }
  }

  /**
   * Update session state
   */
  private updateState(state: SessionState): void {
    if (this.currentState !== state) {
      this.currentState = state;
      this.events.onStateChange?.(state);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.currentSessionId = null;
    this.currentTranscriptionId = null;
    this.activeStreamId = null;
    this.segmentBuffer = [];
    this.lastProcessedTime = 0;
  }

  /**
   * Dispose of service and cleanup resources
   */
  dispose(): void {
    this.stopSession();
    this.transcriptionService.cleanup();
    this.vertexAIService?.cleanup();
    this.webSocketService?.disconnect();
  }
}
