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
import { createLiveTranscriptionLogger, LogCategory, LiveTranscriptionLogLevel } from '../utils/liveTranscriptionLogger';
import { systemLogger, SystemModule } from './systemLogger.service';

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
  private logger = createLiveTranscriptionLogger('LiveTranscriptionService');

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
    // Log to console logger for immediate debugging
    this.logger.info(LogCategory.SERVICE, 'Initializing LiveTranscriptionService', {
      configOverrides: Object.keys(config),
      hasEvents: Object.keys(events).length > 0
    });

    // Log to system logger for centralized monitoring
    systemLogger.log(SystemModule.LIVE_TRANSCRIPTION, LiveTranscriptionLogLevel.INFO, LogCategory.SERVICE,
      'LiveTranscriptionService constructor called', {
        configOverridesCount: Object.keys(config).length,
        hasEventListeners: Object.keys(events).length > 0,
        timestamp: new Date().toISOString()
      });

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.events = events;
    this.transcriptionService = new TranscriptionService();
    this.configService = LiveTranscriptionConfigService.getInstance();

    this.logger.debug(LogCategory.SERVICE, 'Service configuration loaded', {
      provider: this.config.provider,
      fallbackProvider: this.config.fallbackProvider,
      language: this.config.language,
      enableRealTimeStreaming: this.config.enableRealTimeStreaming,
      audioConfig: this.config.audioConfig
    });

    systemLogger.log(SystemModule.LIVE_TRANSCRIPTION, LiveTranscriptionLogLevel.DEBUG, LogCategory.CONFIG,
      'Service configuration merged with defaults', {
        provider: this.config.provider,
        fallbackProvider: this.config.fallbackProvider,
        language: this.config.language,
        enableRealTimeStreaming: this.config.enableRealTimeStreaming,
        sampleRate: this.config.audioConfig.sampleRate
      });

    this.initializeServices();
  }

  /**
   * Initialize speech recognition services
   */
  private async initializeServices(): Promise<void> {
    const operationId = `init-services-${Date.now()}`;
    this.logger.startTiming(operationId, 'Initialize transcription services');

    try {
      this.logger.info(LogCategory.SERVICE, 'Starting service initialization', {
        vertexAIAvailable: !!(process.env.REACT_APP_VERTEX_AI_API_KEY && process.env.REACT_APP_VERTEX_AI_PROJECT_ID),
        openAIAvailable: !!process.env.REACT_APP_OPENAI_API_KEY,
        webSocketEnabled: this.config.enableRealTimeStreaming
      });

      // Initialize Vertex AI service
      if (process.env.REACT_APP_VERTEX_AI_API_KEY && process.env.REACT_APP_VERTEX_AI_PROJECT_ID) {
        this.logger.debug(LogCategory.SERVICE, 'Initializing Vertex AI Speech service');
        this.vertexAIService = new VertexAISpeechService({
          apiKey: process.env.REACT_APP_VERTEX_AI_API_KEY,
          projectId: process.env.REACT_APP_VERTEX_AI_PROJECT_ID,
          location: process.env.REACT_APP_VERTEX_AI_LOCATION
        });
        this.logger.info(LogCategory.SERVICE, 'Vertex AI Speech service initialized successfully');
      } else {
        this.logger.warn(LogCategory.SERVICE, 'Vertex AI credentials not found, service unavailable');
      }

      // Initialize OpenAI Whisper service
      if (process.env.REACT_APP_OPENAI_API_KEY) {
        this.logger.debug(LogCategory.SERVICE, 'Initializing OpenAI Whisper service');
        this.whisperService = new OpenAIWhisperService(process.env.REACT_APP_OPENAI_API_KEY);
        this.logger.info(LogCategory.SERVICE, 'OpenAI Whisper service initialized successfully');
      } else {
        this.logger.warn(LogCategory.SERVICE, 'OpenAI API key not found, Whisper service unavailable');
      }

      // Initialize WebSocket service for real-time streaming (optional)
      const enableRealTime = this.config.enableRealTimeStreaming &&
                             process.env.REACT_APP_ENABLE_REALTIME_TRANSCRIPTION === 'true' &&
                             process.env.REACT_APP_TRANSCRIPTION_WEBSOCKET_URL;

      this.logger.debug(LogCategory.WEBSOCKET, 'Evaluating WebSocket initialization', {
        configEnabled: this.config.enableRealTimeStreaming,
        envEnabled: process.env.REACT_APP_ENABLE_REALTIME_TRANSCRIPTION === 'true',
        urlProvided: !!process.env.REACT_APP_TRANSCRIPTION_WEBSOCKET_URL,
        finalDecision: enableRealTime
      });

      if (enableRealTime) {
        try {
          this.logger.info(LogCategory.WEBSOCKET, 'Initializing WebSocket service for real-time streaming', {
            url: process.env.REACT_APP_TRANSCRIPTION_WEBSOCKET_URL
          });

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
          this.logger.info(LogCategory.WEBSOCKET, 'WebSocket service initialized successfully');
        } catch (error) {
          this.logger.warn(LogCategory.WEBSOCKET, 'WebSocket service initialization failed, falling back to batch mode', { error });
          this.webSocketService = null;
          // Update config to reflect actual capabilities
          this.config.enableRealTimeStreaming = false;
        }
      } else {
        this.logger.info(LogCategory.SERVICE, 'Real-time streaming disabled, using batch mode transcription');
        this.webSocketService = null;
        this.config.enableRealTimeStreaming = false;
      }

      this.logger.endTiming(operationId, {
        vertexAIInitialized: !!this.vertexAIService,
        whisperInitialized: !!this.whisperService,
        webSocketInitialized: !!this.webSocketService,
        finalMode: this.config.enableRealTimeStreaming ? 'real-time' : 'batch'
      });

    } catch (error) {
      this.logger.error(LogCategory.SERVICE, 'Failed to initialize transcription services', error as Error);
      this.logger.endTiming(operationId, { success: false });
      throw error;
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
    const operationId = `start-session-${sessionId}`;
    this.logger.startTiming(operationId, 'Start live transcription session', {
      sessionId,
      campaignId,
      worldId
    });

    this.logger.info(LogCategory.SERVICE, 'Starting live transcription session', {
      sessionId,
      campaignId,
      worldId,
      currentState: this.currentState,
      provider: this.config.provider,
      language: this.config.language
    });

    if (this.currentState !== SessionState.IDLE) {
      const error = new Error(`Session already active. Current state: ${this.currentState}`);
      this.logger.error(LogCategory.SERVICE, 'Cannot start session - already active', error, {
        sessionId,
        currentState: this.currentState
      });
      throw error;
    }

    this.updateState(SessionState.STARTING);
    this.logger.setSessionId(sessionId);

    try {
      // Create transcription record
      this.logger.debug(LogCategory.DATABASE, 'Creating transcription record in database');
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

      this.logger.logDatabaseOperation('CREATE', 'transcriptions', transcriptionId, {
        sessionId,
        audioSource: AudioSourceType.MICROPHONE,
        provider: this.config.provider
      });

      this.currentSessionId = sessionId;
      this.currentTranscriptionId = transcriptionId;

      this.logger.info(LogCategory.SERVICE, 'Transcription record created successfully', {
        transcriptionId,
        sessionId
      });

      // Connect WebSocket if enabled
      if (this.webSocketService) {
        try {
          this.logger.debug(LogCategory.WEBSOCKET, 'Connecting WebSocket for real-time streaming');
          await this.webSocketService.connect();

          this.logger.debug(LogCategory.WEBSOCKET, 'Starting WebSocket session');
          await this.webSocketService.startSession({
            campaignId,
            worldId,
            audioConfig: {
              ...this.config.audioConfig,
              format: 'webm'
            }
          });

          this.logger.info(LogCategory.WEBSOCKET, 'WebSocket session started successfully');
        } catch (error) {
          this.logger.warn(LogCategory.WEBSOCKET, 'WebSocket connection failed, continuing with batch transcription', { error });
          // Don't throw error - continue with batch mode transcription
          this.webSocketService = null;
        }
      }

      // Start speech recognition
      this.logger.debug(LogCategory.TRANSCRIPTION, 'Starting speech recognition');
      await this.startSpeechRecognition();

      this.updateState(SessionState.ACTIVE);

      this.logger.endTiming(operationId, {
        success: true,
        transcriptionId,
        webSocketConnected: !!this.webSocketService,
        speechRecognitionActive: !!this.activeStreamId
      });

      this.logger.info(LogCategory.SERVICE, 'Live transcription session started successfully', {
        sessionId,
        transcriptionId,
        mode: this.webSocketService ? 'real-time' : 'batch'
      });

      // Log to system logger for monitoring
      systemLogger.log(SystemModule.LIVE_TRANSCRIPTION, LiveTranscriptionLogLevel.INFO, LogCategory.SERVICE,
        'Live transcription session started successfully', {
          transcriptionId,
          mode: this.webSocketService ? 'real-time' : 'batch',
          provider: this.config.provider,
          language: this.config.language,
          webSocketConnected: !!this.webSocketService,
          speechRecognitionActive: !!this.activeStreamId
        }, undefined, {
          sessionId
        });

      return transcriptionId;
    } catch (error) {
      this.updateState(SessionState.ERROR);
      this.logger.error(LogCategory.SERVICE, 'Failed to start live transcription session', error as Error, {
        sessionId,
        campaignId,
        worldId
      });
      this.logger.endTiming(operationId, { success: false });
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
      this.logger.debug(LogCategory.AUDIO, 'Skipping audio chunk - session not active', {
        currentState: this.currentState,
        chunkSize: audioChunk.byteLength,
        timestamp
      });
      return;
    }

    const operationId = `process-chunk-${timestamp}`;
    this.logger.startTiming(operationId, 'Process audio chunk');

    this.logger.debug(LogCategory.AUDIO, 'Processing audio chunk', {
      chunkSize: audioChunk.byteLength,
      timestamp,
      sessionId: this.currentSessionId,
      webSocketConnected: this.webSocketService?.isConnected(),
      speechStreamActive: !!this.activeStreamId
    });

    try {
      // Send to WebSocket for real-time processing
      if (this.webSocketService?.isConnected()) {
        this.logger.debug(LogCategory.WEBSOCKET, 'Sending audio chunk to WebSocket');
        this.webSocketService.sendAudioChunk(audioChunk, timestamp);
      }

      // Send to speech recognition service
      if (this.activeStreamId && this.vertexAIService) {
        this.logger.debug(LogCategory.TRANSCRIPTION, 'Sending audio chunk to speech recognition service');
        await this.vertexAIService.sendAudioChunk(this.activeStreamId, audioChunk);
      }

      this.logger.logAudioMetrics({
        bufferSize: audioChunk.byteLength,
        duration: timestamp
      });

      this.logger.endTiming(operationId, {
        success: true,
        sentToWebSocket: this.webSocketService?.isConnected(),
        sentToSpeechService: !!(this.activeStreamId && this.vertexAIService)
      });

    } catch (error) {
      this.logger.error(LogCategory.AUDIO, 'Failed to process audio chunk', error as Error, {
        chunkSize: audioChunk.byteLength,
        timestamp,
        sessionId: this.currentSessionId
      });
      this.logger.endTiming(operationId, { success: false });
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
    this.logger.debug(LogCategory.TRANSCRIPTION, 'Received speech recognition result', {
      hasSegments: !!(result.segments && result.segments.length > 0),
      segmentCount: result.segments?.length || 0,
      sessionId: this.currentSessionId
    });

    if (result.segments && result.segments.length > 0) {
      const segments = result.segments.filter((segment: TranscriptionSegment) =>
        segment.confidence >= this.config.confidenceThreshold
      );

      const filteredCount = segments.length;
      const rejectedCount = result.segments.length - filteredCount;

      this.logger.info(LogCategory.TRANSCRIPTION, 'Processing speech recognition segments', {
        totalSegments: result.segments.length,
        acceptedSegments: filteredCount,
        rejectedSegments: rejectedCount,
        confidenceThreshold: this.config.confidenceThreshold,
        sessionId: this.currentSessionId
      });

      this.segmentBuffer.push(...segments);

      segments.forEach((segment: TranscriptionSegment) => {
        this.logger.logTranscriptionSegment({
          id: segment.id,
          text: segment.text,
          confidence: segment.confidence,
          startTime: segment.startTime,
          endTime: segment.endTime,
          provider: this.config.provider
        });
        this.events.onSegmentReceived?.(segment);
      });

      // Periodically save segments to database
      if (Date.now() - this.lastProcessedTime > 5000) { // Every 5 seconds
        this.logger.debug(LogCategory.DATABASE, 'Triggering periodic segment save');
        this.saveBufferedSegments();
      }
    }
  }

  /**
   * Handle speech recognition errors
   */
  private handleSpeechError(error: RecognitionError): void {
    this.logger.error(LogCategory.TRANSCRIPTION, 'Speech recognition error occurred', error, {
      sessionId: this.currentSessionId,
      activeStreamId: this.activeStreamId,
      provider: this.config.provider
    });
    this.events.onError?.(error);
  }

  /**
   * Handle WebSocket segments
   */
  private handleWebSocketSegment(segment: TranscriptionSegment): void {
    this.logger.info(LogCategory.WEBSOCKET, 'Received WebSocket transcription segment', {
      segmentId: segment.id,
      textLength: segment.text.length,
      confidence: segment.confidence,
      sessionId: this.currentSessionId
    });

    this.logger.logTranscriptionSegment({
      id: segment.id,
      text: segment.text,
      confidence: segment.confidence,
      startTime: segment.startTime,
      endTime: segment.endTime,
      provider: 'websocket'
    });

    this.events.onSegmentReceived?.(segment);
  }

  /**
   * Handle WebSocket errors
   */
  private handleWebSocketError(error: Error): void {
    this.logger.error(LogCategory.WEBSOCKET, 'WebSocket error occurred', error, {
      sessionId: this.currentSessionId,
      connectionState: this.webSocketService?.getConnectionState()
    });

    // Provide more user-friendly error messages
    let userFriendlyError = error;
    if (error.message.includes('No local transcription server running')) {
      userFriendlyError = new Error('Real-time transcription requires a WebSocket server. Transcription will continue in batch mode.');
      this.logger.warn(LogCategory.WEBSOCKET, 'WebSocket server not available, falling back to batch mode');
    } else if (error.message.includes('WebSocket connection error')) {
      userFriendlyError = new Error('Connection to transcription server failed. Check your network connection.');
      this.logger.warn(LogCategory.WEBSOCKET, 'WebSocket connection failed - network issue');
    }

    this.events.onError?.(userFriendlyError);
  }

  /**
   * Save buffered segments to database
   */
  private async saveBufferedSegments(): Promise<void> {
    if (this.segmentBuffer.length > 0 && this.currentTranscriptionId) {
      const operationId = `save-segments-${Date.now()}`;
      this.logger.startTiming(operationId, 'Save buffered segments to database');

      this.logger.info(LogCategory.DATABASE, 'Saving buffered transcription segments', {
        segmentCount: this.segmentBuffer.length,
        transcriptionId: this.currentTranscriptionId,
        sessionId: this.currentSessionId
      });

      try {
        await this.transcriptionService.addTranscriptionSegments(
          this.currentTranscriptionId,
          [...this.segmentBuffer],
          false
        );

        this.logger.logDatabaseOperation('BATCH_INSERT', 'transcription_segments', undefined, {
          segmentCount: this.segmentBuffer.length,
          transcriptionId: this.currentTranscriptionId
        });

        this.segmentBuffer = [];
        this.lastProcessedTime = Date.now();

        this.logger.endTiming(operationId, {
          success: true,
          segmentsSaved: this.segmentBuffer.length
        });

        this.logger.info(LogCategory.DATABASE, 'Successfully saved buffered segments');
      } catch (error) {
        this.logger.error(LogCategory.DATABASE, 'Failed to save buffered segments', error as Error, {
          segmentCount: this.segmentBuffer.length,
          transcriptionId: this.currentTranscriptionId,
          sessionId: this.currentSessionId
        });
        this.logger.endTiming(operationId, { success: false });
      }
    } else {
      this.logger.debug(LogCategory.DATABASE, 'Skipping segment save - no segments or transcription ID', {
        segmentCount: this.segmentBuffer.length,
        hasTranscriptionId: !!this.currentTranscriptionId
      });
    }
  }

  /**
   * Update session state
   */
  private updateState(state: SessionState): void {
    if (this.currentState !== state) {
      const previousState = this.currentState;
      this.currentState = state;

      this.logger.info(LogCategory.SERVICE, 'Session state changed', {
        previousState,
        newState: state,
        sessionId: this.currentSessionId,
        timestamp: new Date().toISOString()
      });

      this.events.onStateChange?.(state);
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.logger.info(LogCategory.SERVICE, 'Cleaning up session resources', {
      sessionId: this.currentSessionId,
      transcriptionId: this.currentTranscriptionId,
      bufferedSegments: this.segmentBuffer.length
    });

    this.currentSessionId = null;
    this.currentTranscriptionId = null;
    this.activeStreamId = null;
    this.segmentBuffer = [];
    this.lastProcessedTime = 0;

    this.logger.clearSessionId();
    this.logger.debug(LogCategory.SERVICE, 'Session cleanup completed');
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
