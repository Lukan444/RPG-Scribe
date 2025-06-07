/**
 * Transcription WebSocket Service
 * 
 * Handles real-time WebSocket communication for live transcription streaming
 * Supports connection management, heartbeat, and automatic reconnection
 */

import { TranscriptionSegment, LiveTranscriptionSession } from '../../models/Transcription';

/**
 * WebSocket message types
 */
export enum MessageType {
  // Client to server
  START_SESSION = 'start_session',
  AUDIO_CHUNK = 'audio_chunk',
  END_SESSION = 'end_session',
  HEARTBEAT = 'heartbeat',
  
  // Server to client
  SESSION_STARTED = 'session_started',
  TRANSCRIPTION_SEGMENT = 'transcription_segment',
  SESSION_ENDED = 'session_ended',
  ERROR = 'error',
  HEARTBEAT_ACK = 'heartbeat_ack'
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: MessageType;
  sessionId?: string;
  timestamp: number;
  data?: any;
}

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

/**
 * Event handlers
 */
export interface TranscriptionWebSocketHandlers {
  onConnectionStateChange?: (state: ConnectionState) => void;
  onSessionStarted?: (sessionId: string) => void;
  onTranscriptionSegment?: (segment: TranscriptionSegment) => void;
  onSessionEnded?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Default WebSocket configuration
 */
const DEFAULT_CONFIG: WebSocketConfig = {
  url: process.env.REACT_APP_WEBSOCKET_URL ||
       process.env.REACT_APP_TRANSCRIPTION_WEBSOCKET_URL ||
       'ws://localhost:8080/transcription',
  reconnectInterval: 5000,
  maxReconnectAttempts: 3, // Reduced to prevent excessive retry attempts
  heartbeatInterval: 30000,
  connectionTimeout: 10000
};

/**
 * Transcription WebSocket Service
 */
export class TranscriptionWebSocketService {
  private config: WebSocketConfig;
  private handlers: TranscriptionWebSocketHandlers;
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private currentSessionId: string | null = null;

  constructor(
    config: Partial<WebSocketConfig> = {},
    handlers: TranscriptionWebSocketHandlers = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.handlers = handlers;

    // Validate WebSocket URL
    if (!this.config.url || this.config.url === 'undefined' || this.config.url.trim() === '') {
      throw new Error(
        'WebSocket URL is not configured. Please set REACT_APP_TRANSCRIPTION_WEBSOCKET_URL ' +
        'environment variable or disable real-time transcription.'
      );
    }
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED || 
        this.connectionState === ConnectionState.CONNECTING) {
      return;
    }

    this.updateConnectionState(ConnectionState.CONNECTING);

    try {
      this.socket = new WebSocket(this.config.url);
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.connectionState === ConnectionState.CONNECTING) {
          const timeoutError = new Error(
            `Connection timeout: Unable to connect to transcription server at ${this.config.url}. ` +
            `This usually means no WebSocket server is running. Live transcription will continue in batch mode.`
          );
          this.handleConnectionError(timeoutError);
        }
      }, this.config.connectionTimeout);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);

    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.clearTimeouts();
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    
    this.updateConnectionState(ConnectionState.DISCONNECTED);
    this.reconnectAttempts = 0;
    this.currentSessionId = null;
  }

  /**
   * Start a transcription session
   * @param sessionConfig Session configuration
   * @returns Promise resolving to session ID
   */
  async startSession(sessionConfig: {
    campaignId: string;
    worldId: string;
    audioConfig: {
      sampleRate: number;
      channels: number;
      format: string;
    };
  }): Promise<string> {
    if (this.connectionState !== ConnectionState.CONNECTED) {
      throw new Error('WebSocket not connected');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.currentSessionId = sessionId;

    const message: WebSocketMessage = {
      type: MessageType.START_SESSION,
      sessionId,
      timestamp: Date.now(),
      data: sessionConfig
    };

    this.sendMessage(message);
    return sessionId;
  }

  /**
   * Send audio chunk for transcription
   * @param audioChunk Audio data
   * @param timestamp Timestamp
   */
  sendAudioChunk(audioChunk: ArrayBuffer, timestamp: number): void {
    if (!this.currentSessionId) {
      throw new Error('No active session');
    }

    // Convert ArrayBuffer to base64 for JSON transmission
    const base64Audio = this.arrayBufferToBase64(audioChunk);

    const message: WebSocketMessage = {
      type: MessageType.AUDIO_CHUNK,
      sessionId: this.currentSessionId,
      timestamp,
      data: {
        audio: base64Audio,
        format: 'webm'
      }
    };

    this.sendMessage(message);
  }

  /**
   * End the current transcription session
   */
  endSession(): void {
    if (!this.currentSessionId) {
      return;
    }

    const message: WebSocketMessage = {
      type: MessageType.END_SESSION,
      sessionId: this.currentSessionId,
      timestamp: Date.now()
    };

    this.sendMessage(message);
    this.currentSessionId = null;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connected');
    this.clearTimeouts();
    this.updateConnectionState(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Send queued messages
    this.flushMessageQueue();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case MessageType.SESSION_STARTED:
          this.handlers.onSessionStarted?.(message.sessionId!);
          break;
          
        case MessageType.TRANSCRIPTION_SEGMENT:
          if (message.data) {
            this.handlers.onTranscriptionSegment?.(message.data as TranscriptionSegment);
          }
          break;
          
        case MessageType.SESSION_ENDED:
          this.handlers.onSessionEnded?.(message.sessionId!);
          this.currentSessionId = null;
          break;
          
        case MessageType.ERROR:
          this.handlers.onError?.(new Error(message.data?.message || 'WebSocket error'));
          break;
          
        case MessageType.HEARTBEAT_ACK:
          // Heartbeat acknowledged
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket closed:', event.code, event.reason);
    this.clearTimeouts();
    
    if (event.code !== 1000 && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      // Attempt reconnection for non-normal closures
      this.attemptReconnect();
    } else {
      this.updateConnectionState(ConnectionState.DISCONNECTED);
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);

    // Provide more specific error messages
    let errorMessage = 'WebSocket connection error';
    if (this.config.url.includes('localhost')) {
      errorMessage = 'WebSocket connection error: No local transcription server running. Live transcription requires a WebSocket server.';
    } else {
      errorMessage = `WebSocket connection error: Unable to connect to ${this.config.url}`;
    }

    this.handleConnectionError(new Error(errorMessage));
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    this.clearTimeouts();
    this.updateConnectionState(ConnectionState.ERROR);
    this.handlers.onError?.(error);

    // Only attempt reconnection if we haven't exceeded max attempts
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      console.warn(`WebSocket: Max reconnection attempts (${this.config.maxReconnectAttempts}) reached. Stopping reconnection attempts.`);
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    this.updateConnectionState(ConnectionState.RECONNECTING);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, this.config.reconnectInterval);
  }

  /**
   * Send message to server
   */
  private sendMessage(message: WebSocketMessage): void {
    if (this.connectionState === ConnectionState.CONNECTED && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send message:', error);
        this.messageQueue.push(message);
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket) {
      const message = this.messageQueue.shift()!;
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        // Put message back at front of queue
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        const heartbeat: WebSocketMessage = {
          type: MessageType.HEARTBEAT,
          timestamp: Date.now()
        };
        this.sendMessage(heartbeat);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Update connection state and notify handlers
   */
  private updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.handlers.onConnectionStateChange?.(state);
    }
  }

  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}
